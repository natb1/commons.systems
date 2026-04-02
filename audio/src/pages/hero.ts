import { renderHeroShell } from "@commons-systems/style/hero-render";

export function renderHero(): string {
  return renderHeroShell({
    chips: [
      {
        panelId: "panel-listen",
        badge: "easy",
        label: "Upload and listen to audio",
        panelContent: `<h3>Upload and listen to audio</h3>
      <ol>
        <li>Sign in with your Google account</li>
        <li>Upload an audio file</li>
        <li>Play and manage your audio in the library</li>
      </ol>`,
      },
      {
        panelId: "panel-format",
        badge: "medium",
        label: "Add a new audio format",
        panelContent: `<h3>Add a new audio format</h3>
      <ol>
        <li><a href="https://github.com/natb1/commons.systems/fork">Fork this project</a> on GitHub</li>
        <li>Open your fork in Claude Desktop</li>
        <li>Ask Claude to add support for your audio format</li>
        <li>Test it locally and deploy</li>
      </ol>`,
      },
      {
        panelId: "panel-host",
        badge: "hard",
        label: "Modify and host your own version",
        panelContent: `<h3>Modify and host your own version</h3>
      <p>Add features, change the design, and control your own audio player.</p>
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
        question: "How is this different from using Spotify or Apple Music?",
        answer:
          "This tool is entirely built using Claude. You should try creating your own audio player using Claude. This is only a demonstration that you can use as a reference. It includes some of my preferences — like controlling where my audio files are stored.",
      },
      {
        question: "How do I know that this is secure?",
        answer:
          "This tool makes claims about security which are easily audited. It is as secure as the rest of your software supply chain that you fully understand. If you don't understand your software supply chain, congratulations, this is a great place to start.",
      },
    ],
  });
}
