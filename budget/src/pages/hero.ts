export function renderHero(): string {
  return `<section id="hero" class="hero">
  <h2>This is Not an App.</h2>
  <p class="hero-subtext">No signup. No subscription. No data sharing.</p>
  <p class="hero-body">This tool was built using <a href="https://commons.systems">agentic coding</a>. You can use agentic coding to make it your own.</p>

  <div class="hero-chips" id="hero-chips">
    <details class="hero-chip-detail" name="hero-chips">
      <summary class="hero-chip">
        <span class="chip-badge chip-badge--easy">Easy</span>
        Analyze your data on your own machine
      </summary>
      <div class="hero-chip-panel">
        <ol>
          <li>Download <a href="https://claude.ai/referral/G7p6TDLfcw">Claude Desktop</a> if you don't have it</li>
          <li>Install the <code>budget</code> plugin (instructions TBD — marketplace or direct link)</li>
          <li>Download your recent transactions from your bank — most banks offer a "Download for Quicken" option, which gives you a <code>.qfx</code> file</li>
          <li>Run <code>/budget &lt;path to your .qfx files&gt;</code></li>
          <li>Load the generated <code>budget.json</code> into the tool above — your data is processed entirely on your machine and is never sent across the internet. The developer of this tool cannot access your data.</li>
          <li>If your bank's export format is not recognized → <button type="button" class="inline-chip" data-opens="chip-parser">Create a new statement parser</button></li>
        </ol>
      </div>
    </details>

    <details class="hero-chip-detail" id="chip-parser" name="hero-chips">
      <summary class="hero-chip">
        <span class="chip-badge chip-badge--medium">Medium</span>
        Create a new statement parser
      </summary>
      <div class="hero-chip-panel">
        <p>QFX (Open Financial Exchange) is the most common bank export format, but your bank may use something different. You can teach the tool to understand it.</p>
        <ol>
          <li><a href="https://github.com/natb1/commons.systems/fork">Fork this project</a> on GitHub</li>
          <li>Open your fork in Claude Desktop</li>
          <li>Run <code>/budget-parser &lt;path to your unsupported statement file&gt;</code></li>
          <li>Claude will generate a new parser for your bank's format and test it against your data</li>
        </ol>
      </div>
    </details>

    <details class="hero-chip-detail" name="hero-chips">
      <summary class="hero-chip">
        <span class="chip-badge chip-badge--hard">Hard</span>
        Modify and host your own version of this tool
      </summary>
      <div class="hero-chip-panel">
        <p>Add visualizations, write new features, and control more of your software supply chain.</p>
        <ol>
          <li><a href="https://github.com/natb1/commons.systems/fork">Fork this project</a> on GitHub</li>
          <li>Open your fork in Claude Desktop</li>
          <li>Ask Claude what you want to change — it knows the codebase</li>
          <li>Run <code>firebase deploy</code> to host it yourself</li>
        </ol>
      </div>
    </details>
  </div>

  <div class="hero-faq">
    <details class="hero-faq-item">
      <summary>How is this different from using Claude to manage my finances?</summary>
      <div class="hero-faq-body">
        <p>It's not. This tool is entirely built using Claude. This is only a demonstration of how I use Claude to manage my finances. It includes some of my preferences — like designing the solution so that my financial data is not stored on third-party infrastructure.</p>
      </div>
    </details>
    <details class="hero-faq-item">
      <summary>How do I know that this is secure?</summary>
      <div class="hero-faq-body">
        <p>This tool makes claims about security which are easily audited. It is as secure as the rest of your software supply chain that you fully understand. If you don't understand your software supply chain, congratulations, this is a great place to start. And to think, you were about to send your financial data across the internet to a SaaS startup.</p>
      </div>
    </details>
  </div>
</section>`;
}
