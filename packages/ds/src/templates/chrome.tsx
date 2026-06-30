import type { CSSProperties, ReactNode } from "react";

// Shared page chrome reused across the full-page templates (Landing,
// OfficeHours). These are deliberately NOT re-exported from the package index:
// they are internal template-composition helpers, not part of the public
// component API. Keeping them here means a template is "based on the reusable
// pieces of the other templates" rather than copy-pasting the same footer and
// section-heading markup into each one.

/**
 * The common footer — identical content across every template page. Same markup
 * the Landing template shipped inline; extracted here so both templates render
 * one source of truth.
 */
export function TemplateFooter() {
  return (
    <footer>
      <p>
        Created with{" "}
        <a
          href="https://github.com/natb1/commons.systems"
          target="_blank"
          rel="noopener"
        >
          commons.systems
        </a>{" "}
        | © 2026 RUMOR.ML{" "}
        <a
          href="https://creativecommons.org/licenses/by-sa/4.0/"
          target="_blank"
          rel="noopener"
        >
          <img
            src="https://mirrors.creativecommons.org/presskit/buttons/88x31/png/by-sa.png"
            alt="CC-BY-SA"
            style={{ width: "117px", height: "41px", verticalAlign: "middle" }}
          />
        </a>
      </p>
    </footer>
  );
}

/**
 * The spare, uppercase, monospace section label the templates use to title a
 * panel or content block (the "engineering terminal" heading idiom). Mirrors the
 * label style Landing uses for its context-panel sections, lifted to a shared
 * helper so OfficeHours' panels read identically.
 */
export function SectionHeading({ children }: { children: ReactNode }) {
  const style: CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-xs)",
    textTransform: "uppercase",
    letterSpacing: "var(--tracking-label)",
    color: "var(--text-muted)",
    margin: "0 0 var(--space-3)",
  };
  return <h2 style={style}>{children}</h2>;
}
