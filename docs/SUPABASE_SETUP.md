# Setting up campaigns (Supabase)

Campaigns let your friends join by code, see each other's rolls live, and give the GM a party board.
Without this setup the app still works; the Campaigns tab runs in **test mode** (tabs on one computer).

You have already created the project and put its URL and publishable key in `.env.local`.
Two things are left, and both are clicks in the Supabase dashboard (I cannot do them for you):

## 1. Turn on anonymous sign-ins

Players do not make accounts. Each browser signs in anonymously, and that is how the database knows who is who.

1. Open your project at <https://supabase.com/dashboard>.
2. **Authentication** (left bar) -> **Sign In / Providers**.
3. Find **Anonymous** and switch it **on**. Save.

## 2. Create the tables

1. **SQL Editor** (left bar) -> **New query**.
2. Open `supabase/schema.sql` from this project, copy **everything**, paste it in, press **Run**.
3. It should finish with *Success. No rows returned.* It is safe to run again later.

## 3. Check it worked

```bash
npm run check:supabase
```

It reads `.env.local`, only reads from your project, and tells you which steps are still to do. When it says
"All set", run `npm run dev`, open **Campaigns**, choose a display name, and create a campaign.

## Playing with friends

- The GM creates a campaign and shares the 8-character **join code**. Friends open the Campaigns tab, pick a display name, and join.
- Each player chooses "Playing as" a character. From then on their rolls appear in the shared log, and their HP, AC and state show on the party board.
- **Send my rolls to the GM only** makes private rolls: the roller and the GM see them, nobody else.
- The GM can clear the log and remove players. Only the GM can.
- **Save the GM recovery key** shown at creation. If the GM clears their browser data or switches computers, the join code plus that key takes the GM seat back. (Anonymous sign-ins live in the browser.)

Your friends need the app itself, not the database. Host the built app (Vercel or Netlify are free) and set the same two
variables, `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, in the host's settings. Hosting is covered in the last phase.

## Good to know

- **The publishable key is public by design.** It ships inside the app. The database rules in `schema.sql` are what
  protect the data: nobody can list campaigns, and everyone only sees campaigns they belong to. Never put the **secret**
  (`service_role`) key in this app or in `.env.local`.
- **Free projects pause** after about a week without activity. If campaigns stop connecting, open the dashboard and
  press *Restore project*.
- **Clearing browser data** signs that player out. They rejoin with the code and appear as a new member; the GM can remove the old entry.
- Old rolls: the log keeps the newest 200 in view; the GM can clear it any time.

## If something goes wrong

| What you see | What it means |
|--------------|---------------|
| "Anonymous sign-ins are off in your Supabase project" | Step 1 |
| "Could not find the table 'public.campaigns'" or `PGRST205` | Step 2 |
| "No campaign with that code" | Typo, or the code is for a different project |
| "Could not reach the campaign server" | Offline, or the project is paused |
| Test-mode banner on the Campaigns tab | `.env.local` is missing or the dev server was not restarted after editing it |
