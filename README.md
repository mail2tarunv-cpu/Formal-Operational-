# Doodl — full multiplayer app code

**Branch:** Tarun (do not merge into main without Madison and Esha's review)

Doodl is a private, mobile-first creative drawing game for ages 14–18.

This branch replaces the old browser-only demo with code for a real multi-user app. **Do not call the deployment finished until a dedicated Supabase project has been provisioned, the migration has been applied, live credentials are connected, and the security/UX checks below pass.** The project currently has no backend connection.

## Built into the app

- Passwordless email sign-in (email link or OTP) and personal profile with uploaded profile photos.
- Create a private group (up to 8) or duo (2); join using a high-entropy invitation code.
- Unique per-member part prompts from a daily shared theme. Groups have a saved timezone.
- 7 AM–7 PM drawing time, 7 PM–next 7 AM voting, then the previous day's reveal.
- Pointer/touch canvas: pen, marker, eraser, colors, brush size, undo/redo, clear, pause/resume 5/7/10-minute sessions, draft recovery, PNG upload.
- Private group chats, comment threads on artworks and single vote per member enforced by Postgres.
- Real votes → leaderboard: 10 points per received vote after a round has finished.
- Previous-day collage export without AI generation, requiring every member to approve group sharing.
- Report content, block members' messages, leave or delete circles; private artwork files with signed URLs.
- Mobile-width UI and installable manifest.

## Connecting the backend (NOT YET DONE)

1. Provision a **new dedicated Supabase project** for Doodl. Do not use unrelated existing databases.
2. Apply [database migration](supabase/migrations/20261122_doodl_initial.sql) to that project.
3. In Vercel for this branch's Preview environment, set:
   - \`VITE_SUPABASE_URL\` = your new Supabase project URL
   - \`VITE_SUPABASE_PUBLISHABLE_KEY\` = its **publishable** API key (never secret/service role)
4. In Supabase Auth URL settings, set the site URL and allow the [Tarun branch preview](https://formalop-git-tarun-mail2tarunv-cpus-projects.vercel.app) as an auth redirect.
5. Redeploy; then test two *different browsers/accounts* to verify invitations, messages, voting and private file access.
6. Review RLS, storage policies, SQL functions, email deliverability and age-appropriate moderation before letting teens use the app.

Required \`src/lib/client.js\` variables are exposed in frontend by design, so use only a Supabase **publishable** key, never service role. Credentials are intentionally absent until a dedicated backend is selected.

## Run locally

\`\`\`bash
git clone https://github.com/mail2tarunv-cpu/Formal-Operational-.git
cd Formal-Operational-
git switch Tarun
npm install
cp .env.example .env.local
# supply your dedicated Supabase publishable credentials
npm run dev
\`\`\`

Production build: \`npm run build\`.

## Known incomplete parts / release blockers

- **No connected backend yet**, so real sign-in/circles/etc. cannot be exercised on the current Vercel preview.
- **AI image stitching** is excluded intentionally; users get a deterministic collage instead.
- **Scheduled background push notifications** are not configured; the UI accurately explains this.
- Moderation dashboard, administrator review process, legal/parental age policy, account deletion and data retention require decisions and implementation before a real teen launch.
- Email OTP deliverability, multi-account privacy, time-zone / DST boundary tests, accessibility and mobile browser testing still need live verification.
- Supabase Free project limits and third-party usage costs need confirmation before provisioning.

## Workflow

- Push only to \`Tarun\`; Madison and Esha continue independently.
- Work from \`AGENTS.md\` and report real versus unverified features accurately.
- Never put private group drawings or member data in public storage buckets.


## Push notification infrastructure (prepared, NOT ACTIVE)

The code now includes a service worker (\`public/sw.js\`), browser push registration,
a private \`push_subscriptions\` table and an authenticated scheduler endpoint
(\`api/notify.js\`). It is safe to leave unconfigured: the UI disables its
notification control until credentials exist.

To make push live after provisioning the **dedicated Doodl** database:
- Browser build: \`VITE_VAPID_PUBLIC_KEY\`
- Vercel **server-side only**: \`SUPABASE_URL\`, \`SUPABASE_SERVICE_ROLE_KEY\`,
  \`VAPID_PUBLIC_KEY\`, \`VAPID_PRIVATE_KEY\`, \`VAPID_SUBJECT\` (mailto:),
  \`CRON_SECRET\`
- Generate a matching VAPID keypair once, never commit private keys.
- Arrange a trusted 5–10 minute scheduler to call \`GET /api/notify\` with
  \`Authorization: Bearer <CRON_SECRET>\`, then test on physical devices.
- The existing Vercel account is **Hobby**. Do not add a frequent
  \`vercel.json\` cron schedule: Hobby cron frequency is limited to once per
  day, so 7 AM and 7 PM local-time notifications require another scheduler.
- On iOS, web push requires the PWA to be added to the Home Screen (where
  browser version / OS support allows). Test on a real iPhone.

The app cannot honestly be marked production-ready for teenagers without live
security tests, age-appropriate policies, a monitored report queue, and an
account deletion/data retention process.
