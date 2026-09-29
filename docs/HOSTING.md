# Putting the app online (so friends can use it)

The app is a website that can also be **installed** like an app. You host it once; your friends open a link.

What you need: a free Netlify account (or Vercel; the steps are nearly identical), and the Supabase project you already set
up. Nothing here costs money at this size.

## Before you start

1. Make sure `npm run build` finishes with no errors (it also type-checks).
2. Make sure `.env.local` has your two values (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`). The build bakes them into
   the app. They are meant to be public (the publishable key), so this is safe. Never use the `service_role` key.
3. `reference/atla-homebrew-gmbinder.txt` stays on your computer. The app does **not** need it: the rules text is already
   saved inside the source (`*.generated.ts` files).

## Option A: drag and drop (simplest, no GitHub needed)

1. In the project folder, run:

   ```bash
   npm run build
   ```

2. Go to <https://app.netlify.com/drop> and drag the whole **`dist`** folder onto the page. You get a link like
   `https://something-random.netlify.app`.
3. In Netlify: **Site configuration -> Change site name** to something nicer.
4. To update later: run `npm run build` again and drag `dist` onto the same site (Deploys tab -> drag and drop).

## Option B: connect GitHub (updates itself)

1. Push the project to GitHub (it already points at `github.com/jonathanbailey115/avatar-sheet-starter`).
2. Netlify -> **Add new site -> Import an existing project -> GitHub** -> pick the repo and the branch you want live.
   The build settings come from `netlify.toml` (`npm run build`, publish `dist`).
3. **Site configuration -> Environment variables**: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the same
   values as `.env.local`. Then **Deploys -> Trigger deploy**.
4. From now on, every push to that branch publishes a new version.

(Vercel works the same way: Import Project, add the two environment variables. `vercel.json` is already set up.)

## After the first deploy: tell Supabase the new address

Password-reset emails and sign-in links must come back to your real address.

1. Supabase dashboard -> **Authentication -> URL Configuration**.
2. Set **Site URL** to your link (for example `https://avatar-dnd.netlify.app`).
3. Under **Redirect URLs**, add the same link. Keep `http://localhost:5173` there too if you still test on your computer.

## Installing it (for you and your friends)

- **Windows / Mac / Linux, Chrome or Edge:** open the link, click the install icon at the right end of the address bar
  (or menu -> "Install Avatar DND"). It opens in its own window and shows up in the Start menu.
- **Android, Chrome:** menu -> "Install app" (or "Add to Home screen").
- **iPhone / iPad, Safari:** Share button -> "Add to Home Screen".
- Safari on a Mac and Firefox can use the link but do not offer a full install.

Once installed, the app opens quickly and still opens with no connection. Campaigns, sign-in and syncing your characters need
a connection.

## What is and is not shared

- Everyone who opens your link uses **your** Supabase project. Each player makes their own account there.
- A character is saved on the device it is made on, and also in the player's account when they are signed in.
- Turning **Confirm email** off (see `SUPABASE_SETUP.md`) lets friends sign up without waiting for an email.

## If something looks stale

The installed app checks for a new version every time it opens. If a friend still sees an old version, closing and reopening
the app once loads the new one.

## A Windows .exe later

You chose the installable web app. If you ever want a real `.exe`, the same build can be wrapped with Electron or Tauri;
ask and it can be added without changing the app.
