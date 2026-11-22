# Draw Together — Madison's branch

Collaborative drawing game concept for Pratt's Designing for Kids studio, targeting ages **14–18**.

This branch contains a minimal **React + Vite** mobile-first starter screen, not a finished game. It is intentionally independent of the other teammates' branches.

## Run locally

```bash
git clone https://github.com/mail2tarunv-cpu/Formal-Operational-.git
cd Formal-Operational-
git switch Madison
npm install
npm run dev
```

Open the local URL printed by Vite. Verify production output with `npm run build`.

## What we are making

1. **Group** — a friend creates a private group and invites others.
2. **Prompt** — one shared daily theme, but each friend gets a *different* part to draw.
3. **Draw** — each person draws on their phone, independently.
4. **Reveal** — the app combines all submitted pieces into a single group picture.
5. **Share (optional)** — the finished picture can be saved or shared to socials after the group agrees.

## Where to work

- `src/App.jsx`: current starter page, replace with screens and interaction.
- `src/styles.css`: global styling, typography, responsive layout.
- `src/main.jsx`: React entry point.
- `AGENTS.md`: **read this first when using an AI coding assistant**. Product scope, build order, and team rules live there.

## Team workflow

- `main` is the approved shared version, **not** a scratch branch.
- Work and push to `Tarun`, `Madison`, or `Esha` as assigned.
- Open a Pull Request from your branch into `main` when a feature is ready.
- The **other two teammates** review before merge. Do not merge your own unreviewed work.
- Preview builds deploy independently to Vercel; the `main` deployment stays production.
- Coordinate on shared architecture and data shape before introducing a backend.

**Project status:** starter screen only. No login, real-time collaboration, drawing editor, or sharing is implemented yet.
