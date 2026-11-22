# AGENTS.md — Read before modifying this branch

You are developing **Draw Together**, a mobile-first collaborative drawing game for a Pratt studio project. Branch owner: **Tarun**. The audience is ages **14–18**, and the app should feel polished and age-appropriate, not childish.

## Product idea (keep this intact)

- A small private friend group plays together.
- One round has one theme (e.g. "A City on Mars"), and *each participant gets a different assigned piece* (sky, buildings, people, vehicles), not the identical prompt.
- Players draw their own pieces separately on a mobile canvas. Do not reveal other pieces while the round is ongoing.
- After the group submits, combine the drawings into **one coherent group picture** and show a collective reveal.
- Sharing outside the app is **optional**, with group control; private drawings should not be posted automatically.

## Suggested user flow

Home / my groups → Create or join group → Invite via private code/link → Start round → Individual role/prompt → Draw on mobile canvas → Submit / waiting room → Compose & reveal a single artwork → Download or share (with consent).

## Build order

1. Build one clickable end-to-end local prototype with placeholder data, no auth required.
2. Implement group creation / join and state for multiple fictional participants.
3. Implement unique per-player prompts from a shared theme.
4. Implement touch-friendly canvas, undo/redo, eraser, clear, brush colors, submission.
5. Assemble drawings into a single composed image; define layout before implementation (tiles or positioned layers).
6. Add reveal animation and export PNG; consider native sharing with a download fallback.
7. Add backend/realtime only after reviewing the architecture with all 3 teammates.

## Engineering guardrails

- Existing stack: **React + Vite**, JavaScript/JSX, mobile-first CSS. Keep the app easy to run with `npm install && npm run dev`.
- Keep screens/components small; prefer reusable UI elements rather than a giant App file.
- Prefer semantic controls, accessible labels, keyboard operability, visible focus, sufficient contrast, and reduced-motion support.
- Touch interactions must work on a phone. Do not design a desktop-only game.
- Treat group codes as private, not secure authentication; avoid collecting unnecessary teen personal data.
- Do not add AI-generated illustrations, accounts, payments, public social feeds, or notification systems without a deliberate team decision.
- Do not add external APIs, database keys, or secrets to the repo.
- Run `npm run build` before proposing a merge. Clearly distinguish implemented features from placeholders.

## Team & Git rules

- Only commit to **Tarun** when working on this branch; never push directly to `main`.
- Your branch can be pushed to GitHub for preview builds without approval.
- Open a pull request into `main` when ready for team review, and get approvals from **both** other teammates.
- Don't force-push or overwrite other people's branches.
- The three working branches can diverge for ideation, but integrate only reviewed features.
- If an LLM makes an architectural change, document why in the PR, including screenshots and mobile testing.

## First task for an AI coding agent

"Read AGENTS.md and README.md. Work only on the current branch. Replace the starter screen with a mobile-first Create/Join Group flow using local state and mock data. Keep the other stages as clearly labeled placeholders. Verify npm run build, then summarize files changed and test steps. Do not push to main."
