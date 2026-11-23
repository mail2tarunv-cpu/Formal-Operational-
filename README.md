# Doodl — guest drawing rooms

**Branch:** Tarun (do not merge into main without Madison and Esha's review)

Doodl is a private, mobile-first creative drawing game for ages 14–18.

This branch replaces the old browser-only demo with code for a real multi-user app. **Do not call the deployment finished until a dedicated Supabase project has been provisioned, the migration has been applied, live credentials are connected, and the security/UX checks below pass.** The Tarun preview has a dedicated connected Supabase backend; anonymous guests and room creation have been observed, but complete three-device gameplay remains unverified.

## Built into the app

- Automatic guest access through Supabase anonymous identities (no email or password), optional profile name and avatar.
- Create 1-, 2-, or 3-player private rooms; join on another device with a 16-character code or `?join=CODE` link.
- Unique per-member part prompts from a daily shared theme. Groups have a saved timezone.
- 7 AM–7 PM drawing time, 7 PM–next 7 AM voting, then the previous day's reveal.
- Pointer/touch canvas: pen, marker, eraser, colors, brush size, undo/redo, clear, pause/resume 5/7/10-minute sessions, draft recovery, PNG upload.
- Private group chats, comment threads on artworks and single vote per member enforced by Postgres.
- Real votes → leaderboard: 10 points per received vote after a round has finished.
- Previous-day collage export without AI generation, requiring every member to approve group sharing.
- Report content, block members' messages, leave or delete circles; private artwork files with signed URLs.
- Mobile-width UI and installable manifest.

## Backend connection (Tarun preview only)

1. Doodl has a dedicated Supabase project (`efhibksyoztceeyvfysn`).
2. The initial [database migration](supabase/migrations/20261122_doodl_initial.sql) has been applied.
3. The following are configured in Vercel for the `Tarun` branch preview:
   - \`VITE_SUPABASE_URL\` = your new Supabase project URL
   - \`VITE_SUPABASE_PUBLISHABLE_KEY\` = its **publishable** API key (never secret/service role)
4. **Required:** enable `Anonymous Sign-Ins` in [Supabase → Authentication → Providers](https://supabase.com/dashboard/project/efhibksyoztceeyvfysn/auth/providers). Guest sessions do not use email redirects.
5. Open the `Tarun` preview on separate devices. On one device create a room; on another use the invite code or link. Verify that membership, drawings and messages are isolated. Vercel preview access must also be configured for testers.
6. Review RLS, storage policies, SQL functions, email deliverability and age-appropriate moderation before letting teens use the app.

The browser uses only the scoped Supabase **publishable** key. Never expose the service role or secret keys.

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

- Guest sign-ins have been enabled and a guest player created successfully. Full cross-device gameplay remains unverified.
- **AI image stitching** is excluded intentionally; users get a deterministic collage instead.
- **Scheduled background push notifications** are not configured; the UI accurately explains this.
- Moderation dashboard, administrator review process, legal/parental age policy, account deletion and data retention require decisions and implementation before a real teen launch.
- Guest sign-in, multi-device privacy, time-zone / DST boundary tests, accessibility and mobile browser testing still need live verification.
- The separate Supabase project was created at a quoted $0/month; avoid upgrades and monitor free-tier limits.

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

## Guest mode

The app automatically calls `supabase.auth.signInAnonymously()` when there is no saved session. Each browser maintains a separate identity, while the database's membership RLS protects room messages and drawings. Room codes grant group membership, not control over another player's identity. Clearing browser data or changing browsers without account linking loses the previous guest profile. This is for a private prototype, not a ready-to-launch anonymous community for minors.

## November 2026 prototype refinement

The current prototype is intentionally organized around **Today, Gallery, and Chat**; drawing is accessed from Today, room switching and invitations from the header, member management from Room details, and results within Gallery. No separate Circles or Ranks tabs.

The backend has an applied second migration, captured at [20261123204117](supabase/migrations/20261123204117_doodl_secure_gameplay_and_quick_rounds.sql). It enforces private artwork until reveal, 1/2/3-player mode behavior, 5/7/10-minute server-timed drawing sessions, contributor-only sharing consent, and owner-initiated 10-minute prototype quick rounds (5-minute voting for trios). Daily rounds remain time-gated by circle timezone.

- Solo: draw and see your own work, no voting.
- Duo: two separate prompts, drawings revealed together, no competitive vote.
- Trio: each player gets a part; voting opens after drawing; results appear at reveal.
- **Quick round:** appears to the room creator once every player has joined, and only before a submission has been made that day. One quick start per circle per day.
- **No fake content:** all artwork, messages, and votes are loaded from Supabase.
- **Consent:** saving/sharing a collage requires recorded approvals for every submitted artist, checked again against the server immediately before export.
- **Drafts:** saved locally to the device; clearing browser storage loses guest identity and drafts.
- **Tests:** run `npm test` for pure game-logic tests and `npm run build` for compile validation. These are not substitutes for device tests.

Before public release: review privileged RPC grants, anonymous signup abuse controls and rate limits, reports queue, deletion/retention, mobile accessibility and actual browser playback across devices. Background notifications remain deliberately disabled.

**Leaving a room:** the server now revokes all of that guest's sharing approvals for the room before removing membership. Previously exported files cannot be recalled. Room owners must delete a room rather than leave it.
