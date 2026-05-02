import { renderHeroShell } from "@commons-systems/components/hero-render";

export function renderHero(): string {
  return renderHeroShell({
    chips: [
      {
        panelId: "panel-analyze",
        badge: "easy",
        label: "Analyze your data on your own machine",
        panelContent: `<h3>Analyze your data on your own machine</h3>
      <ol>
        <li>Download <a href="https://claude.ai/referral/G7p6TDLfcw">Claude Desktop</a> if you don't have it</li>
        <li>Install the <code>budget</code> plugin (instructions TBD — marketplace or direct link)</li>
        <li>Download your recent transactions from your bank — most banks offer a "Download for Quicken" option, which gives you a <code>.qfx</code> file</li>
        <li>Run <code>/budget &lt;path to your .qfx files&gt;</code></li>
        <li>Load the generated <code>budget.json</code> into the tool above — your data is processed entirely on your machine and is never sent across the internet. The developer of this tool cannot access your data.</li>
        <li>If your bank's export format is not recognized → <button type="button" class="inline-chip" data-opens="panel-parser">Create a new statement parser</button></li>
      </ol>`,
      },
      {
        panelId: "panel-parser",
        badge: "medium",
        label: "Create a new statement parser",
        panelContent: `<h3>Create a new statement parser</h3>
      <p>QFX (Open Financial Exchange) is the most common bank export format, but your bank may use something different. You can teach the tool to understand it.</p>
      <ol>
        <li><a href="https://github.com/natb1/commons.systems/fork">Fork this project</a> on GitHub</li>
        <li>Open your fork in Claude Desktop</li>
        <li>Run <code>/budget-parser &lt;path to your unsupported statement file&gt;</code></li>
        <li>Claude will generate a new parser for your bank's format and test it against your data</li>
      </ol>`,
      },
      {
        panelId: "panel-host",
        badge: "hard",
        label: "Modify and host your own version of this tool",
        panelContent: `<h3>Modify and host your own version of this tool</h3>
      <p>Add visualizations, write new features, and control more of your software supply chain.</p>
      <ol>
        <li><a href="https://github.com/natb1/commons.systems/fork">Fork this project</a> on GitHub</li>
        <li>Open your fork in Claude Desktop</li>
        <li>Ask Claude what you want to change — it knows the codebase</li>
        <li>Run <code>firebase deploy</code> to host it yourself</li>
      </ol>`,
      },
    ],
    faq: [
      {
        question: "How is this different from using Claude to manage my finances?",
        answer:
          "It's not. This tool is entirely built using Claude. You should try creating your own budgeting solution using Claude. This is only a demonstration of how I use Claude to manage my finances that you can use for a reference. It includes some of my preferences — like designing the solution so that my financial data is not stored on third-party infrastructure.",
      },
      {
        question: "How do I know that this is secure?",
        answer:
          "This tool makes claims about security which are easily audited. It is as secure as the rest of your software supply chain that you fully understand. If you don't understand your software supply chain, congratulations, this is a great place to start. And to think, you were about to send your financial data across the internet to a SaaS startup.",
      },
    ],
  });
}
