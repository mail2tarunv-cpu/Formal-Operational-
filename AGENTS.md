# AGENTS.md — Tarun's implementation branch

This is the **Tarun** branch of a three-person Pratt studio project. Do not edit \`main\`, \`Madison\`, or \`Esha\`. Never merge code without both other teammates' approval.

## Current approved concept

A mobile-first daily creative game for teens 14–18. Users:
1. Create a private group or one-on-one, invite via code rather than public name search.
2. Get a daily challenge notification at 7 AM; draw from 7 AM to 7 PM, with a shared theme and a distinct assigned sub-prompt for each participant.
3. Have a 5–10 minute drawing session that pauses when leaving. Pen, marker, eraser, undo/redo, prompt reminder.
4. Chat with group members, view submitted drawings, and comment directly on a sketch.
5. Vote on other submissions from 7 PM to 7 AM. Reveal points and leaderboard standings at 7 AM.
6. At the 7 AM reveal, combine their sketches into one group picture and optionally share on social platforms.

## Current implementation status (DO NOT OVERCLAIM)

The frontend is an interactive **prototype with browser-local persistence** and sample friends, messages and sketches. No remote database, real shared accounts, server-backed invite codes, push notification service, or real AI image stitching has been connected. The final graphic is a fallback composition generated on the client, not an AI output. Demo Mode allows reviewers to inspect time-gated stages.

## Engineering rules

- Tech: React + Vite, JSX, CSS, lucide-react.
- Main app: \`src/App.jsx\`; responsive design: \`src/styles.css\`.
- Make small, tested changes. Preserve flows unless requested otherwise.
- Mobile touch interactions and accessibility are critical; test narrow widths.
- Keep 7 AM / 7 PM scheduling, unique per-person prompt assignment, private-only circles and optional sharing consistent.
- Do not create fake server responses, fake persistent AI composition, or claim that multi-user sharing is active.
- Do not introduce analytics, open user directories, public feeds, backend providers, paid image generation APIs, or leak API keys.
- To add a real backend, design RLS-protected group memberships, teen privacy safeguards, server-controlled time windows and votes, real-time chat, drawing object storage and scheduled jobs. Ask before connecting to an unrelated existing Supabase project.
- Run \`npm run build\`, inspect usability and document limitations.
- Commit and push only to \`Tarun\`; verify the Vercel preview deployment after pushing.

## Suggested next steps

1. Test and refine the mobile UI with 14–18-year-old participants.
2. Review group consent, privacy, moderation, vote manipulation and time-zone handling.
3. Decide on shared backend/auth and implement real group participation.
4. Integrate AI stitching only after defining prompts, image permissions and costs.

The user has asked for a premium, polished visual feel borrowing cinematic dark hierarchy (Netflix) and intuitive social mechanics (Instagram), but avoid trademarked assets and avoid cloning those brands' interfaces literally.
