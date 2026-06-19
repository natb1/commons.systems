import { Fragment, useState } from "react";
import { Badge } from "@commons-systems/ds";

interface HeroChip {
  panelId: string;
  badge: "easy" | "medium" | "hard";
  label: string;
  panelContent: string;
}

interface HeroFaq {
  question: string;
  answer: string;
}

const badgeVariant = {
  easy: "success",
  medium: "accent",
  hard: "error",
} as const;

const chips: HeroChip[] = [
  {
    panelId: "panel-upload",
    badge: "easy",
    label: "Upload and view your documents",
    panelContent: `<h3>Upload and view your documents</h3>
      <ol>
        <li>Sign in with your Google account</li>
        <li>Upload a PDF or image file</li>
        <li>View and manage your documents in the library</li>
      </ol>`,
  },
  {
    panelId: "panel-format",
    badge: "medium",
    label: "Add a new document format",
    panelContent: `<h3>Add a new document format</h3>
      <ol>
        <li><a href="https://github.com/natb1/commons.systems/fork">Fork this project</a> on GitHub</li>
        <li>Open your fork in Claude Desktop</li>
        <li>Ask Claude to add support for your document format</li>
        <li>Test it locally and deploy</li>
      </ol>`,
  },
  {
    panelId: "panel-host",
    badge: "hard",
    label: "Modify and host your own version",
    panelContent: `<h3>Modify and host your own version</h3>
      <p>Add features, change the design, and control your own document viewer.</p>
      <ol>
        <li><a href="https://github.com/natb1/commons.systems/fork">Fork this project</a> on GitHub</li>
        <li>Open your fork in Claude Desktop</li>
        <li>Ask Claude what you want to change — it knows the codebase</li>
        <li>Run <code>firebase deploy</code> to host it yourself</li>
      </ol>`,
  },
];

const faq: HeroFaq[] = [
  {
    question: "How is this different from using Google Drive or Dropbox?",
    answer:
      "This tool is entirely built using Claude. You should try creating your own document viewer using Claude. This is only a demonstration that you can use as a reference. It includes some of my preferences — like controlling where my documents are stored.",
  },
  {
    question: "How do I know that this is secure?",
    answer:
      "This tool makes claims about security which are easily audited. It is as secure as the rest of your software supply chain that you fully understand. If you don't understand your software supply chain, congratulations, this is a great place to start.",
  },
];

export function Hero() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section id="hero" className="hero">
      <div className="hero-content">
        <h2>This is Not an App.</h2>
        <p className="hero-subtext">
          No signup. No subscription. No data sharing.
        </p>
        <p className="hero-body">
          This tool was built using{" "}
          <a href="https://commons.systems">agentic coding</a>. You can use
          agentic coding to make it your own.
        </p>

        <div className="hero-chips" id="hero-chips">
          <div className="hero-chip-row">
            {chips.map((chip) => {
              const active = openId === chip.panelId;
              return (
                <button
                  key={chip.panelId}
                  type="button"
                  className={active ? "hero-chip hero-chip--active" : "hero-chip"}
                  data-panel={chip.panelId}
                  aria-expanded={active ? "true" : "false"}
                  onClick={() =>
                    setOpenId((prev) =>
                      prev === chip.panelId ? null : chip.panelId,
                    )
                  }
                >
                  <Badge
                    className="chip-badge"
                    variant={badgeVariant[chip.badge]}
                  >
                    {chip.badge.charAt(0).toUpperCase() + chip.badge.slice(1)}
                  </Badge>
                  {chip.label}
                </button>
              );
            })}
          </div>

          {chips.map((chip) => (
            <div
              key={chip.panelId}
              className="hero-chip-panel"
              id={chip.panelId}
              hidden={openId !== chip.panelId}
              dangerouslySetInnerHTML={{ __html: chip.panelContent }}
            />
          ))}
        </div>

        <details className="hero-faq">
          <summary>FAQ</summary>
          <div className="hero-faq-body">
            <dl>
              {faq.map((entry) => (
                <Fragment key={entry.question}>
                  <dt>{entry.question}</dt>
                  <dd>{entry.answer}</dd>
                </Fragment>
              ))}
            </dl>
          </div>
        </details>
      </div>
    </section>
  );
}
