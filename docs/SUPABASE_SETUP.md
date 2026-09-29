# Setting up campaigns (Supabase)

Campaigns let your friends join by code, see each other's rolls live, and give the GM a party board.
Without this setup the app still works; the Campaigns tab runs in **test mode** (tabs on one computer).

You have already created the project and put its URL and publishable key in `.env.local`.
Two things are left, and both are clicks in the Supabase dashboard (I cannot do them for you):

## 1. Accounts (email sign-in)

Players make their own account with an email, a username and a password. Supabase Auth keeps the email and the
(hashed) password; the username lives in the `profiles` table from `schema.sql`. Nobody, including you, can read a password.

1. Open your project at <https://supabase.com/dashboard>.
2. **Authentication** (left bar) -> **Sign In / Providers** -> **Email**: make sure it is **enabled**.
3. Decide about **Confirm email** on the same screen:
   - **Off (recommended for a group of friends):** people sign up and play immediately. Their email is not verified, so a typo
     in the email means "forgot password" cannot reach them.
   - **On:** every new player must click a link in an email first. Supabase's free built-in email sender is limited to a
     few emails per hour, so a group signing up together can get stuck.
4. **Authentication -> URL Configuration -> Site URL**: set this to where the app runs (`http://localhost:5173` while you
   test, your hosted address later). Also add it under **Redirect URLs**. Password-reset emails link back to it.

## 2. Create the tables

1. **SQL Editor** (left bar) -> **New query**.
2. Open `supabase/schema.sql` from this project, copy **everything**, paste it in, press **Run**.
3. It should finish with *Success. No rows returned.* It is safe to run again, and you **must** run it again whenever this project's `schema.sql` changes (for example after an update adds accounts).

## 3. Check it worked

```bash
npm run check:supabase
```

It reads `.env.local`, only reads from your project, and tells you which steps are still to do. When it says
"All set", run `npm run dev`, open **Campaigns**, choose a display name, and create a campaign.

## Playing with friends

- Everyone makes an account on the Campaigns tab (or signs in). Your account follows you: sign in on any device and your campaigns are there, no code or key needed.
- The GM creates a campaign and shares the 8-character **join code**. Friends join with it.
- **Two characters at once:** each account plays one character per campaign, so to play two you sign in to two accounts. There is no limit on how many accounts use the same computer or network. In one browser, untick **Keep me signed in on this device** when you sign in to the second account (it then lives only in that tab), and use a different tab for each.
- Characters are saved on the device they were made on, not in your account. Use *Export* on My Characters to move one to another device.
- Each player chooses "Playing as" a character. From then on their rolls appear in the shared log, and their HP, AC and state show on the party board.
- **Send my rolls to the GM only** makes private rolls: the roller and the GM see them, nobody else.
- The GM can clear the log and remove players. Only the GM can.
- **Save the GM recovery key** shown at creation. You should not need it now that GMs have accounts, but if the GM ever loses their account, the join code plus that key hands the GM seat to whichever account uses it.

Your friends need the app itself, not the database. Host the built app (Vercel or Netlify are free) and set the same two
variables, `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, in the host's settings. Hosting is covered in the last phase.

## Good to know

- **The publishable key is public by design.** It ships inside the app. The database rules in `schema.sql` are what
  protect the data: nobody can list campaigns, and everyone only sees campaigns they belong to. Never put the **secret**
  (`service_role`) key in this app or in `.env.local`.
- **Free projects pause** after about a week without activity. If campaigns stop connecting, open the dashboard and
  press *Restore project*.
- **Forgot password?** The sign-in screen sends a reset link to the account's email (needs the Site URL above).
- Old rolls: the log keeps the newest 200 in view; the GM can clear it any time.

## If something goes wrong

| What you see | What it means |
|--------------|---------------|
| "Confirm your email first" | **Confirm email** is on (step 1). Click the link, or turn it off |
| "Too many tries in a row" | Supabase limits emails and sign-in attempts. Wait a minute |
| "Account functions are missing" in the check | Run the latest `schema.sql` (step 2) |
| "Could not find the table 'public.campaigns'" or `PGRST205` | Step 2 |
| "No campaign with that code" | Typo, or the code is for a different project |
| "Could not reach the campaign server" | Offline, or the project is paused |
| Test-mode banner on the Campaigns tab | `.env.local` is missing or the dev server was not restarted after editing it |
