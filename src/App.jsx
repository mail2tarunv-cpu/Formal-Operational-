const milestones = [
  { number: '01', title: 'Create a group', detail: 'Invite friends with a private group code.' },
  { number: '02', title: 'Get your part', detail: 'One shared theme, a different prompt for each person.' },
  { number: '03', title: 'Draw separately', detail: 'Everyone draws their own piece on a phone.' },
  { number: '04', title: 'Reveal together', detail: 'Combine the pieces into one picture, then share if everyone agrees.' },
];

export default function App() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="wordmark" href="/" aria-label="Draw Together home">
          <span className="wordmark-icon" aria-hidden="true">✳</span> draw together
        </a>
        <span className="workspace"><span className="status-dot" /> Esha's workspace</span>
      </header>

      <main className="layout">
        <section className="content">
          <p className="eyebrow">FORMAL OPERATIONAL · STUDIO PROJECT</p>
          <h1>Your version<br /><em>starts here.</em></h1>
          <p className="lead">A collaborative drawing game for friends, ages 14–18. This is an intentionally empty starting point, ready for your ideas.</p>
          <div className="divider" />
          <div className="section-heading">
            <h2>The game, in four steps</h2>
            <span>Draft flow — not implemented yet</span>
          </div>
          <ol className="milestones">
            {milestones.map((step) => (
              <li className="milestone" key={step.number}>
                <span className="step-number">{step.number}</span>
                <div><strong>{step.title}</strong><p>{step.detail}</p></div>
              </li>
            ))}
          </ol>
          <aside className="developer-note">
            <span className="note-mark">↗</span>
            <div>
              <strong>Building with an LLM?</strong>
              <p>Read <code>AGENTS.md</code> and <code>README.md</code> in this branch first. They explain the product, code structure, and team review rules. Start with group creation.</p>
            </div>
          </aside>
        </section>

        <section className="preview-area" aria-label="Blank mobile app preview">
          <div className="preview-label"><span>CANVAS / 01</span><span>EMPTY STATE</span></div>
          <div className="phone">
            <div className="phone-top"><span>9:41</span><div className="camera" /><span>●●◕</span></div>
            <div className="phone-body">
              <p className="phone-brand">draw together <span>✳</span></p>
              <div className="blank-canvas">
                <div className="scribble" aria-hidden="true"><svg viewBox="0 0 100 100" fill="none"><path d="M18 65 C 34 15, 69 15, 54 57 S 78 91, 84 36" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg></div>
                <h3>Nothing here. Yet.</h3>
                <p>Your next idea goes here.</p>
              </div>
              <div className="phone-footer"><span>●</span><span>○</span><span>○</span></div>
            </div>
            <div className="home-indicator" />
          </div>
          <p className="preview-caption">A placeholder screen, not a working game.</p>
        </section>
      </main>
      <footer className="site-footer"><span>Shared concept. Separate branches. One approved main.</span><span>Esha · Starter v0.1</span></footer>
    </div>
  );
}
