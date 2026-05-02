import { renderHeroShell } from "@commons-systems/components/hero-render";

export function renderHero(): string {
  return renderHeroShell({
    chips: [
      {
        panelId: "panel-try",
        badge: "easy",
        label: "Try it out",
        panelContent: `<h3>Try it out</h3>
      <ol>
        <li>Sign in with your Google account</li>
        <li>Explore the features available</li>
        <li>Your data stays in your account</li>
      </ol>`,
      },
      {
        panelId: "panel-customize",
        badge: "medium",
        label: "Customize the features",
        panelContent: `<h3>Customize the features</h3>
      <ol>
        <li><a href="https://github.com/natb1/commons.systems/fork">Fork this project</a> on GitHub</li>
        <li>Open your fork in Claude Desktop</li>
        <li>Ask Claude to add or change features</li>
        <li>Test it locally and deploy</li>
      </ol>`,
      },
      {
        panelId: "panel-host",
        badge: "hard",
        label: "Modify and host your own version",
        panelContent: `<h3>Modify and host your own version</h3>
      <p>Add features, change the design, and control your own deployment.</p>
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
        question: "How is this different from other tools?",
        answer:
          "This tool is entirely built using Claude. You should try creating your own version using Claude. This is only a demonstration that you can use as a reference.",
      },
      {
        question: "How do I know that this is secure?",
        answer:
          "This tool makes claims about security which are easily audited. It is as secure as the rest of your software supply chain that you fully understand. If you don't understand your software supply chain, congratulations, this is a great place to start.",
      },
    ],
  });
}
