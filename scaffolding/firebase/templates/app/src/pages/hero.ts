export function renderHero(): string {
  return `<section id="hero" class="hero">
  <div class="hero-content">
  <h2>This is Not an App.</h2>
  <p class="hero-subtext">No signup. No subscription. No data sharing.</p>
  <p class="hero-body">This tool was built using <a href="https://commons.systems">agentic coding</a>. You can use agentic coding to make it your own.</p>

  <div class="hero-chips" id="hero-chips">
    <div class="hero-chip-row">
      <button type="button" class="hero-chip" data-panel="panel-try" aria-expanded="false">
        <span class="chip-badge chip-badge--easy">Easy</span>
        Try it out
      </button>
      <button type="button" class="hero-chip" data-panel="panel-customize" aria-expanded="false">
        <span class="chip-badge chip-badge--medium">Medium</span>
        Customize the features
      </button>
      <button type="button" class="hero-chip" data-panel="panel-host" aria-expanded="false">
        <span class="chip-badge chip-badge--hard">Hard</span>
        Modify and host your own version
      </button>
    </div>

    <div class="hero-chip-panel" id="panel-try" hidden>
      <h3>Try it out</h3>
      <ol>
        <li>Sign in with your Google account</li>
        <li>Explore the features available</li>
        <li>Your data stays in your account</li>
      </ol>
    </div>

    <div class="hero-chip-panel" id="panel-customize" hidden>
      <h3>Customize the features</h3>
      <ol>
        <li><a href="https://github.com/natb1/commons.systems/fork">Fork this project</a> on GitHub</li>
        <li>Open your fork in Claude Desktop</li>
        <li>Ask Claude to add or change features</li>
        <li>Test it locally and deploy</li>
      </ol>
    </div>

    <div class="hero-chip-panel" id="panel-host" hidden>
      <h3>Modify and host your own version</h3>
      <p>Add features, change the design, and control your own deployment.</p>
      <ol>
        <li><a href="https://github.com/natb1/commons.systems/fork">Fork this project</a> on GitHub</li>
        <li>Open your fork in Claude Desktop</li>
        <li>Ask Claude what you want to change — it knows the codebase</li>
        <li>Run <code>firebase deploy</code> to host it yourself</li>
      </ol>
    </div>
  </div>

  <details class="hero-faq">
    <summary>FAQ</summary>
    <div class="hero-faq-body">
      <dl>
        <dt>How is this different from other tools?</dt>
        <dd>This tool is entirely built using Claude. You should try creating your own version using Claude. This is only a demonstration that you can use as a reference.</dd>
        <dt>How do I know that this is secure?</dt>
        <dd>This tool makes claims about security which are easily audited. It is as secure as the rest of your software supply chain that you fully understand. If you don't understand your software supply chain, congratulations, this is a great place to start.</dd>
      </dl>
    </div>
  </details>
  </div>
</section>`;
}
