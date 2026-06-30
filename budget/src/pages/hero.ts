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
        <li>Install the <code>budget</code> plugin: run <code>/plugin marketplace add natb1/commons.systems</code>, then <code>/plugin install budget@commons-systems</code></li>
        <li>Download your recent transactions from your bank — most banks offer a "Download for Quicken" option, which gives you a <code>.qfx</code> file</li>
        <li>Run <code>/budget &lt;path to your .qfx files&gt;</code></li>
        <li>Load the generated <code>budget.json</code> into the tool above — your data is processed entirely on your machine and is never sent across the internet. The developer of this tool cannot access your data.</li>
        <li>If your bank's export format is not recognized, <a href="https://github.com/natb1/commons.systems/fork">fork</a> the project, open your fork in Claude Desktop, and run <code>/budget-parser &lt;path&gt;</code> — that skill walks Claude through writing and testing a new parser for your bank.</li>
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
