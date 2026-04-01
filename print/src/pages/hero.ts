export function renderHero(): string {
  return `<section id="hero" class="hero">
  <div class="hero-content">
  <h2>This is Not an App.</h2>
  <p class="hero-subtext">No signup. No subscription. No data sharing.</p>
  <p class="hero-body">This tool was built using <a href="https://commons.systems">agentic coding</a>. You can use agentic coding to make it your own.</p>

  <div class="hero-chips" id="hero-chips">
    <div class="hero-chip-row">
      <button type="button" class="hero-chip" data-panel="panel-upload" aria-expanded="false">
        <span class="chip-badge chip-badge--easy">Easy</span>
        Upload and view your documents
      </button>
      <button type="button" class="hero-chip" data-panel="panel-format" aria-expanded="false">
        <span class="chip-badge chip-badge--medium">Medium</span>
        Add a new document format
      </button>
      <button type="button" class="hero-chip" data-panel="panel-host" aria-expanded="false">
        <span class="chip-badge chip-badge--hard">Hard</span>
        Modify and host your own version
      </button>
    </div>

    <div class="hero-chip-panel" id="panel-upload" hidden>
      <h3>Upload and view your documents</h3>
      <ol>
        <li>Sign in with your Google account</li>
        <li>Upload a PDF or image file</li>
        <li>View and manage your documents in the library</li>
      </ol>
    </div>

    <div class="hero-chip-panel" id="panel-format" hidden>
      <h3>Add a new document format</h3>
      <ol>
        <li><a href="https://github.com/natb1/commons.systems/fork">Fork this project</a> on GitHub</li>
        <li>Open your fork in Claude Desktop</li>
        <li>Ask Claude to add support for your document format</li>
        <li>Test it locally and deploy</li>
      </ol>
    </div>

    <div class="hero-chip-panel" id="panel-host" hidden>
      <h3>Modify and host your own version</h3>
      <p>Add features, change the design, and control your own document viewer.</p>
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
        <dt>How is this different from using Google Drive or Dropbox?</dt>
        <dd>This tool is entirely built using Claude. You should try creating your own document viewer using Claude. This is only a demonstration that you can use as a reference. It includes some of my preferences — like controlling where my documents are stored.</dd>
        <dt>How do I know that this is secure?</dt>
        <dd>This tool makes claims about security which are easily audited. It is as secure as the rest of your software supply chain that you fully understand. If you don't understand your software supply chain, congratulations, this is a great place to start.</dd>
      </dl>
    </div>
  </details>
  </div>
</section>`;
}
