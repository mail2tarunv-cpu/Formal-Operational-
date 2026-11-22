export default function App() {
  return (
    <div className="shell">
      <header className="header">
        <a className="brand" href="/">FORMAL OPERATIONAL / STUDIO</a>
        <div className="branch"><span className="dot" />Madison's branch</div>
      </header>
      <main className="main">
        <section className="intro">
          <p className="eyebrow">IDEATION WORKSPACE · STARTER</p>
          <h1>Start with<br /><span>a blank canvas.</span></h1>
          <p className="description">
            Nothing has been decided yet. This is a separate space to explore,
            sketch, and prototype ideas before we agree on a direction together.
          </p>
          <div className="note">
            <div className="note-label">BUILDING HERE</div>
            <p>
              Edit <code>src/App.jsx</code> and <code>src/styles.css</code>.
              Read <code>AGENTS.md</code> before asking an AI coding assistant
              to change anything. Push only to your own branch.
            </p>
          </div>
        </section>
        <section className="preview" aria-label="Empty mobile design canvas">
          <div className="preview-top"><span>WORKSPACE / 01</span><span>NO FLOW DECIDED</span></div>
          <div className="phone" aria-label="Blank mobile app mockup">
            <div className="island" />
            <div className="phone-top"><span>9:41</span><span>●●●</span></div>
            <div className="phone-content">
              <div className="placeholder" aria-hidden="true">✳</div>
              <strong>Your idea goes here.</strong>
              <p>No features or screens defined.</p>
            </div>
            <div className="home-indicator" />
          </div>
          <p className="caption">Placeholder only. Replace when you're ready to experiment.</p>
        </section>
      </main>
      <footer className="footer"><span>Independent ideas. Shared reviews.</span><span>Madison · starter</span></footer>
    </div>
  );
}
