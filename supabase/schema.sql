-- Avatar DND campaigns. Run this once in the Supabase SQL editor (Dashboard -> SQL Editor).
-- Safe to re-run: everything is "if not exists" / "create or replace".
--
-- Model: players sign in anonymously (Authentication -> Providers -> Anonymous sign-ins: ON).
-- Nobody can list campaigns. You join by code through a function, and after that you can only
-- see the campaigns you belong to. The GM is the campaign's gm_id.

-- ---------------------------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------------------------

create table if not exists public.campaigns (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    name text not null check (char_length(name) between 1 and 80),
    gm_id uuid not null,
    -- sha256 of the GM recovery key shown once at creation. Never readable by clients.
    gm_key_hash text not null,
    created_at timestamptz not null default now()
);

create table if not exists public.campaign_members (
    campaign_id uuid not null references public.campaigns (id) on delete cascade,
    user_id uuid not null,
    display_name text not null check (char_length(display_name) between 1 and 40),
    role text not null check (role in ('gm', 'player')),
    joined_at timestamptz not null default now(),
    primary key (campaign_id, user_id)
);

-- One row per roll shown in the shared log. `entry` is the app's RollEntry as JSON.
-- visibility 'gm' means only the roller and the GM can see it (a private roll).
create table if not exists public.campaign_rolls (
    id uuid primary key default gen_random_uuid(),
    campaign_id uuid not null references public.campaigns (id) on delete cascade,
    user_id uuid not null,
    display_name text not null,
    visibility text not null default 'all' check (visibility in ('all', 'gm')),
    entry jsonb not null check (pg_column_size(entry) < 8000),
    created_at timestamptz not null default now()
);
create index if not exists campaign_rolls_by_campaign on public.campaign_rolls (campaign_id, created_at desc);

-- The live "party board": each player's current HP, AC and state, for the GM and the table.
create table if not exists public.member_status (
    campaign_id uuid not null references public.campaigns (id) on delete cascade,
    user_id uuid not null,
    summary jsonb not null check (pg_column_size(summary) < 8000),
    updated_at timestamptz not null default now(),
    primary key (campaign_id, user_id)
);

-- GM-only NPC notes / stat blocks (used by the NPC Studio). `revealed` shows one to the players.
create table if not exists public.campaign_npcs (
    id uuid primary key default gen_random_uuid(),
    campaign_id uuid not null references public.campaigns (id) on delete cascade,
    data jsonb not null check (pg_column_size(data) < 60000),
    revealed boolean not null default false,
    updated_at timestamptz not null default now()
);
create index if not exists campaign_npcs_by_campaign on public.campaign_npcs (campaign_id);

-- Realtime needs the whole old row to filter delete events by campaign.
alter table public.campaign_members replica identity full;
alter table public.campaign_rolls replica identity full;
alter table public.member_status replica identity full;

-- ---------------------------------------------------------------------------------------------
-- Helpers used by the policies. SECURITY DEFINER so they can look at membership without
-- the policies calling themselves.
-- ---------------------------------------------------------------------------------------------

create or replace function public.is_member(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1 from public.campaign_members m
        where m.campaign_id = cid and m.user_id = auth.uid()
    )
$$;

create or replace function public.is_gm(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1 from public.campaigns c
        where c.id = cid and c.gm_id = auth.uid()
    )
$$;

-- ---------------------------------------------------------------------------------------------
-- Functions the app calls. Creating and joining go through these, never through direct inserts.
-- ---------------------------------------------------------------------------------------------

-- Returns the new campaign's id, its join code, and a GM recovery key. The key is shown to the
-- GM once; keep it. It lets you take the GM seat back if you ever lose this device's sign-in.
create or replace function public.create_campaign(p_name text, p_display_name text)
returns table (out_id uuid, out_code text, out_gm_key text)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_code text;
    v_key text;
    v_id uuid;
begin
    if auth.uid() is null then
        raise exception 'Not signed in';
    end if;
    if char_length(trim(coalesce(p_name, ''))) = 0 then
        raise exception 'A campaign needs a name';
    end if;
    if char_length(trim(coalesce(p_display_name, ''))) = 0 then
        raise exception 'Choose a display name';
    end if;

    loop
        v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
        exit when not exists (select 1 from public.campaigns c where c.code = v_code);
    end loop;

    v_key := replace(gen_random_uuid()::text, '-', '');

    insert into public.campaigns (code, name, gm_id, gm_key_hash)
    values (v_code, trim(p_name), auth.uid(), encode(sha256(convert_to(v_key, 'utf8')), 'hex'))
    returning id into v_id;

    insert into public.campaign_members (campaign_id, user_id, display_name, role)
    values (v_id, auth.uid(), trim(p_display_name), 'gm');

    return query select v_id, v_code, v_key;
end;
$$;

create or replace function public.join_campaign(p_code text, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_id uuid;
begin
    if auth.uid() is null then
        raise exception 'Not signed in';
    end if;
    if char_length(trim(coalesce(p_display_name, ''))) = 0 then
        raise exception 'Choose a display name';
    end if;

    select c.id into v_id
    from public.campaigns c
    where c.code = upper(regexp_replace(coalesce(p_code, ''), '[^0-9A-Za-z]', '', 'g'));

    if v_id is null then
        raise exception 'No campaign with that code';
    end if;

    insert into public.campaign_members (campaign_id, user_id, display_name, role)
    values (v_id, auth.uid(), trim(p_display_name), 'player')
    on conflict (campaign_id, user_id) do update set display_name = excluded.display_name;

    return v_id;
end;
$$;

-- Take the GM seat with the recovery key (for a lost device or cleared browser).
create or replace function public.claim_gm(p_code text, p_gm_key text, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_id uuid;
begin
    if auth.uid() is null then
        raise exception 'Not signed in';
    end if;

    select c.id into v_id
    from public.campaigns c
    where c.code = upper(regexp_replace(coalesce(p_code, ''), '[^0-9A-Za-z]', '', 'g'))
      and c.gm_key_hash = encode(sha256(convert_to(coalesce(p_gm_key, ''), 'utf8')), 'hex');

    if v_id is null then
        raise exception 'That code and GM key do not match';
    end if;

    update public.campaigns set gm_id = auth.uid() where id = v_id;
    update public.campaign_members set role = 'player' where campaign_id = v_id and role = 'gm';

    insert into public.campaign_members (campaign_id, user_id, display_name, role)
    values (v_id, auth.uid(), coalesce(nullif(trim(p_display_name), ''), 'GM'), 'gm')
    on conflict (campaign_id, user_id) do update set role = 'gm';

    return v_id;
end;
$$;

revoke all on function public.create_campaign(text, text) from public, anon;
revoke all on function public.join_campaign(text, text) from public, anon;
revoke all on function public.claim_gm(text, text, text) from public, anon;
grant execute on function public.create_campaign(text, text) to authenticated;
grant execute on function public.join_campaign(text, text) to authenticated;
grant execute on function public.claim_gm(text, text, text) to authenticated;
grant execute on function public.is_member(uuid) to authenticated;
grant execute on function public.is_gm(uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------------------------

alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
alter table public.campaign_rolls enable row level security;
alter table public.member_status enable row level security;
alter table public.campaign_npcs enable row level security;

-- Start from nothing, then grant exactly what the app needs. Supabase grants broadly by default.
revoke all on public.campaigns, public.campaign_members, public.campaign_rolls,
    public.member_status, public.campaign_npcs from anon, authenticated;

-- campaigns: members can read everything except the key hash; the GM can rename or delete.
grant select (id, code, name, gm_id, created_at) on public.campaigns to authenticated;
grant update (name) on public.campaigns to authenticated;
grant delete on public.campaigns to authenticated;

drop policy if exists campaigns_select on public.campaigns;
create policy campaigns_select on public.campaigns for select to authenticated
    using (public.is_member(id));
drop policy if exists campaigns_update on public.campaigns;
create policy campaigns_update on public.campaigns for update to authenticated
    using (public.is_gm(id)) with check (public.is_gm(id));
drop policy if exists campaigns_delete on public.campaigns;
create policy campaigns_delete on public.campaigns for delete to authenticated
    using (public.is_gm(id));

-- campaign_members: see the table; change your own name; leave, or be removed by the GM.
grant select, delete on public.campaign_members to authenticated;
grant update (display_name) on public.campaign_members to authenticated;

drop policy if exists members_select on public.campaign_members;
create policy members_select on public.campaign_members for select to authenticated
    using (public.is_member(campaign_id));
drop policy if exists members_update on public.campaign_members;
create policy members_update on public.campaign_members for update to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists members_delete on public.campaign_members;
create policy members_delete on public.campaign_members for delete to authenticated
    using (user_id = auth.uid() or public.is_gm(campaign_id));

-- campaign_rolls: members see public rolls, their own, and the GM sees all. You can only roll as yourself.
grant select, insert, delete on public.campaign_rolls to authenticated;

drop policy if exists rolls_select on public.campaign_rolls;
create policy rolls_select on public.campaign_rolls for select to authenticated
    using (
        public.is_member(campaign_id)
        and (visibility = 'all' or user_id = auth.uid() or public.is_gm(campaign_id))
    );
drop policy if exists rolls_insert on public.campaign_rolls;
create policy rolls_insert on public.campaign_rolls for insert to authenticated
    with check (user_id = auth.uid() and public.is_member(campaign_id));
drop policy if exists rolls_delete on public.campaign_rolls;
create policy rolls_delete on public.campaign_rolls for delete to authenticated
    using (public.is_gm(campaign_id));

-- member_status: every member can see the board; you can only write your own row.
grant select, insert, update, delete on public.member_status to authenticated;

drop policy if exists status_select on public.member_status;
create policy status_select on public.member_status for select to authenticated
    using (public.is_member(campaign_id));
drop policy if exists status_insert on public.member_status;
create policy status_insert on public.member_status for insert to authenticated
    with check (user_id = auth.uid() and public.is_member(campaign_id));
drop policy if exists status_update on public.member_status;
create policy status_update on public.member_status for update to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_member(campaign_id));
drop policy if exists status_delete on public.member_status;
create policy status_delete on public.member_status for delete to authenticated
    using (user_id = auth.uid() or public.is_gm(campaign_id));

-- campaign_npcs: the GM manages them; players only see the ones the GM revealed.
grant select, insert, update, delete on public.campaign_npcs to authenticated;

drop policy if exists npcs_select on public.campaign_npcs;
create policy npcs_select on public.campaign_npcs for select to authenticated
    using (public.is_gm(campaign_id) or (revealed and public.is_member(campaign_id)));
drop policy if exists npcs_insert on public.campaign_npcs;
create policy npcs_insert on public.campaign_npcs for insert to authenticated
    with check (public.is_gm(campaign_id));
drop policy if exists npcs_update on public.campaign_npcs;
create policy npcs_update on public.campaign_npcs for update to authenticated
    using (public.is_gm(campaign_id)) with check (public.is_gm(campaign_id));
drop policy if exists npcs_delete on public.campaign_npcs;
create policy npcs_delete on public.campaign_npcs for delete to authenticated
    using (public.is_gm(campaign_id));

-- ---------------------------------------------------------------------------------------------
-- Realtime: broadcast changes to the shared log, the party board and the roster.
-- ---------------------------------------------------------------------------------------------

do $$
declare
    t text;
begin
    if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
        foreach t in array array['campaign_rolls', 'member_status', 'campaign_members'] loop
            begin
                execute format('alter publication supabase_realtime add table public.%I', t);
            exception when duplicate_object then
                null; -- already added
            end;
        end loop;
    end if;
end $$;
