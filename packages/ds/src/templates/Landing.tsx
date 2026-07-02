import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { PageShell } from "./PageShell.tsx";
import { Hero } from "./Hero.tsx";
import { ContextPanel, ContextPanelToggle } from "./ContextPanel.tsx";
import type { NavLink } from "../navigation/nav-link.ts";

// Boilerplate content. A template's value is "see the layout populated", so the
// copy is deliberately generic placeholder text — not real product or blog
// content. Swap these out when adapting the template for a real page.
const NAV_LINKS: NavLink[] = [
  { href: "#overview", label: "Overview" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#docs", label: "Docs" },
  { href: "#signin", label: "Sign in", align: "end" },
];

const HERO_CARDS: { name: string; problem: string }[] = [
  { name: "App one", problem: "A one-line description of the problem this app solves." },
  { name: "App two", problem: "Another short line describing what this card is for." },
  { name: "App three", problem: "Boilerplate copy that keeps the third card balanced." },
];

const MAIN_SECTIONS: { heading: string; body: string[] }[] = [
  {
    heading: "Section one",
    body: [
      "Boilerplate body copy goes here. This column is the main content region — in a real page it would hold the primary reading material, articles, or feature detail.",
      "A second paragraph keeps the column tall enough to demonstrate how the sticky context panel holds its position as the main content scrolls past it.",
    ],
  },
  {
    heading: "Section two",
    body: [
      "Each section is a plain content block. The main region sits in the wide grid column and fills its width; the panel stays pinned to the right.",
    ],
  },
  {
    heading: "Section three",
    body: [
      "More placeholder content. On narrow viewports the grid collapses to a single column and the context panel becomes a toggle-collapsible overlay.",
      "Replace these blocks with whatever the page actually presents — the layout, sticky behavior, and chrome stay the same.",
    ],
  },
];

// Enough sections that the panel overflows its capped height on a typical
// viewport, so its accent-colored native scrollbar is visible — mirroring the
// landing project's panel, which overflows with its link sections and blog roll.
const PANEL_SECTIONS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Resources",
    links: [
      { label: "Getting started", href: "#" },
      { label: "Guides", href: "#" },
      { label: "API reference", href: "#" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    title: "Product",
    links: [
      { label: "Overview", href: "#" },
      { label: "Features", href: "#" },
      { label: "Integrations", href: "#" },
      { label: "Pricing", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
    ],
  },
  {
    title: "Elsewhere",
    links: [
      { label: "Status", href: "#" },
      { label: "Community", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
];

export function Landing() {
  const [panelOpen, setPanelOpen] = useState(false);

  const headingStyle: CSSProperties = {
    fontFamily: "var(--font-heading)",
    fontSize: "var(--text-xl)",
    margin: "0 0 var(--space-3)",
  };

  const renderPanelSection = (
    section: (typeof PANEL_SECTIONS)[number],
  ): ReactNode => (
    <section key={section.title} style={{ marginBottom: "var(--space-6)" }}>
      <h3
        style={{
          fontSize: "var(--text-xs)",
          textTransform: "uppercase",
          letterSpacing: "var(--tracking-label)",
          color: "var(--text-muted)",
          margin: "0 0 var(--space-2)",
        }}
      >
        {section.title}
      </h3>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {section.links.map((link) => (
          <li key={link.label} style={{ marginBottom: "var(--space-1)" }}>
            <a
              href={link.href}
              style={{ color: "var(--link)", fontSize: "var(--text-sm)" }}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <PageShell
      className="cs-landing"
      wordmark="your.brand"
      tagline="A short tagline that says what this is."
      navLinks={NAV_LINKS}
      current="#overview"
      navEnd={
        <ContextPanelToggle
          open={panelOpen}
          onToggle={() => setPanelOpen((open) => !open)}
          controls="cs-landing-panel"
        />
      }
      hero={
        <Hero
          headline="Build with the template. Ship faster."
          subline="A one-line promise that expands on the headline."
          ctas={[
            { label: "Get started", href: "#" },
            { label: "Learn more", href: "#" },
          ]}
          cards={HERO_CARDS.map((card) => ({ ...card, href: "#" }))}
        />
      }
    >
      {/* Boilerplate main content. */}
      <main>
        {MAIN_SECTIONS.map((section) => (
          <article
            key={section.heading}
            style={{ marginBottom: "var(--space-8)" }}
          >
            <h2 style={headingStyle}>{section.heading}</h2>
            {section.body.map((paragraph, i) => (
              <p
                key={i}
                style={{
                  margin: "0 0 var(--space-4)",
                  lineHeight: "var(--leading-prose)",
                }}
              >
                {paragraph}
              </p>
            ))}
          </article>
        ))}
      </main>

      {/* Boilerplate right-aligned, collapsible, sticky context panel. */}
      <ContextPanel open={panelOpen} id="cs-landing-panel" aria-label="Context">
        {PANEL_SECTIONS.map(renderPanelSection)}
      </ContextPanel>
    </PageShell>
  );
}
