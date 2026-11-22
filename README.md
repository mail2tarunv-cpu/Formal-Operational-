# Formal Operational — Esha's workspace

A **blank mobile-first React/Vite starter** for our three-person studio team's ideation and implementation experiments.

**We have not chosen a game, product direction, or user flow yet.** This starter does not implement any game mechanics.

## Open this branch locally

```bash
git clone https://github.com/mail2tarunv-cpu/Formal-Operational-.git
cd Formal-Operational-
git switch Esha
npm install
npm run dev
```

Check a production build:

```bash
npm run build
```

## Where to build

- `src/App.jsx`: edit or replace the blank starter page.
- `src/styles.css`: styles for the starter and your experiments.
- `AGENTS.md`: instructions to give an AI coding assistant; read before coding.

## Team GitHub workflow

- Each teammate works on **their own branch**: `Tarun`, `Madison`, `Esha`.
- Push your progress to your own branch as often as needed. This automatically updates that branch's Vercel preview.
- `main` is the team-approved version. **Do not push directly to main**.
- When something is ready for the team, open a pull request (PR) from your branch into `main`.
- The other **two** teammates review and approve before merging. This is the team rule; GitHub enforcement is a separate setting.
- Before requesting reviews, check the feature on your own preview link and run `npm run build`.
- If everyone experiments separately, compare and decide which approach to bring into `main`.

## Example starting request to an AI tool

"Read AGENTS.md and README.md. Work only on the Esha branch. We have not settled on a game idea yet. Implement the idea I give you next, test the build, and push the changes to this same branch. Do not push to main."

**Current status:** blank UI starter. No game screens, group flow, prompts, drawing mechanics, or sharing are implemented.
