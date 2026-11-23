# AGENTS.md — Doodl, Tarun branch

Work only on the **Tarun** branch. Never merge into main without review from both Madison and Esha.

## Product
Mobile-first private drawing game for teens aged 14–18. Each day a private circle gets one theme; each member gets a different subprompt, draws between 7 AM and 7 PM (5–10 min with pause), votes 7 PM–7 AM, sees scores and a group artwork at 7 AM. Members can chat, comment and optionally share their collective artwork. Sharing requires explicit per-member consent; never share automatically. Friend search is not public.

## Code map
- \`src/App.jsx\`: production-style real-data application screens, sign-in, group flows and navigation.
- \`src/components/Canvas.jsx\`: mobile drawing editor and draft persistence.
- \`src/lib/client.js\`: Supabase singleton and themes/timezone helpers.
- \`src/lib/data.js\`: authenticated data actions, storage and Realtime.
- \`src/live.css\`: new mobile UI styling.
- \`supabase/migrations/20261122_doodl_initial.sql\`: secure schema, RPCs, RLS and private storage policies.
- \`README.md\`: integration requirements, launch blockers and QA checklist.

## Critical constraints
- A dedicated Doodl Supabase project is connected to the Tarun preview. Guest-mode sign-in still requires enabling Anonymous Sign-Ins in Supabase Auth Providers. Do not claim multiplayer is verified until two-device tests pass.
- Do not modify other existing Supabase apps, databases, or infrastructure.
- Never include a Supabase secret/service-role key in browser code. Only use VITE_SUPABASE_PUBLISHABLE_KEY.
- RLS membership and time gating are enforced on the server; never bypass to make a demo look good.
- Don't introduce placeholder contacts, fake votes or photos representing unverified named real users.
- Use icon-driven, phone-native UI with real uploaded artwork and photos. Avoid random vectors.
- Realtime messages, comments, drawing storage, user blocks and reports must only be visible to authorized circle members.
- Users must be able to withdraw artwork sharing consent.
- Always run npm run build, inspect Vercel deploy state, and be explicit about what you did not verify.
- For under-18 users, moderation, privacy and abuse prevention are product release requirements, not optional polish.

## Next priority
Enable Supabase anonymous guest sign-ins, confirm tester access past Vercel preview protection, and complete two-device verification before shipping. Keep distinct guest identities and RLS; then address safety, moderation, and notifications. Test multiple accounts on different devices before calling the app complete. The AI stitching aspect stays out of scope.

## Web push
- \`src/lib/push.js\`: opt-in, browser push subscription, per signed-in user.
- \`public/sw.js\`: notification display and tap handling.
- \`api/notify.js\`: server-only push sender protected by CRON_SECRET. NEVER
  expose the service-role key, VAPID private key, or cron secret in the browser.
- A trusted scheduler is not configured. Do not claim background reminders are live.
- Vercel Hobby cannot schedule a frequent cron. Use a reviewed external or
  Supabase scheduler after provisioning; do not silently upgrade paid plans.
