# Doodl — daily collaborative sketching prototype

**Branch:** Tarun  
**Stack:** React + Vite + lucide-react  
**Vercel:** https://formalop-git-tarun-mail2tarunv-cpus-projects.vercel.app

A high-fidelity mobile-first prototype for our Pratt studio project for ages 14–18. The group has selected a concept: friends get a shared daily theme, each member draws one assigned part, and the group interacts through chats, comments, voting, leaderboards and a next-day artwork reveal.

## Run locally

    git clone https://github.com/mail2tarunv-cpu/Formal-Operational-.git
    cd Formal-Operational-
    git switch Tarun
    npm install
    npm run dev

Run \`npm run build\` to check the production bundle.

## Screens & interactions

- **Home:** premium dark creative feed; daily theme, group members, private part assignment, progression.
- **Circles:** create a private group or one-on-one, select sample friends, generate a shareable invite code, switch groups.
- **Drawing studio:** pointer/touch canvas, pen, highlighter, eraser, seven colors, brush size, undo, redo, clear, prompt reminder, pause/resume countdown, submit and keep local draft.
- **Gallery:** view group submissions, comments on each drawing, and votes during 7 PM–7 AM.
- **Leaderboard:** ranked members and illustration points.
- **Chat:** group messaging inside the app.
- **Reveal:** a composed 1080×1080 picture with export and native share/download fallback.
- **Notifications:** optional browser-permission prompt, foreground-only alerts at the 7 AM / 7 PM boundaries.
- **Prototype Mode:** lets reviewers preview Draw/Vote/Reveal screens without waiting for the real-time schedule.

## Important: this is a single-browser prototype

Data is saved in **localStorage/sessionStorage on the current device**. The preloaded friends, drawings, points and messages are sample data. **Real-time multi-user features do not work across browsers**, and invite codes do not provision remote users. That requires authentication, a shared database, role-specific membership, server-validated votes, message sync, privacy permissions and storage.

The final composition is a **client-side illustration/layout preview, not AI-generated stitching**. Connecting an image generation service is a separate task and must require approval for provider credentials/costs. Never describe these placeholder features as live.

Daily windows are interpreted in the user's **browser-local time zone**. Actual push notifications and reliable 7 AM background jobs require a push service + scheduler. Browser alerts here only work while the page is open.

## Team workflow

- Push work only to \`Tarun\`.
- Do not modify \`main\`, \`Madison\`, or \`Esha\`.
- Open a Pull Request and ask both other teammates to review before merging.
- Read \`AGENTS.md\` before continuing with an AI coding agent.
