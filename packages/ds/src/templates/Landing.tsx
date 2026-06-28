import { useState } from "react";
import type {
  AnchorHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
  ReactNode,
} from "react";
import { Nav } from "../navigation/Nav.tsx";
import { Card } from "../core/Card.tsx";
import type { NavLink } from "../navigation/nav-link.ts";

export type LandingProps = HTMLAttributes<HTMLDivElement>;

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

export function Landing(props: LandingProps) {
  const { className, ...rest } = props;
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
          color: "var(--muted)",
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
              style={{ color: "var(--accent)", fontSize: "var(--text-sm)" }}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <div
      {...rest}
      className={["page", "cs-landing", className].filter(Boolean).join(" ")}
    >
      {/* Common sticky navigation — base.css makes <header> sticky. The wordmark
          and tagline stack above the nav row, matching the landing project's
          header. The panel toggle is a right-aligned icon button living in the
          nav's `end` slot; it is mobile-only (hidden on the wide layout, where
          the panel is always shown). */}
      <header>
        <h1 className="cs-landing__title">your.brand</h1>
        <p className="cs-landing__tagline">
          A short tagline that says what this is.
        </p>
        <Nav
          links={NAV_LINKS}
          current="#overview"
          end={
            <button
              type="button"
              className="cs-landing__panel-toggle"
              aria-label="Toggle context panel"
              aria-expanded={panelOpen}
              aria-controls="cs-landing-panel"
              onClick={() => setPanelOpen((open) => !open)}
            >
              {"▸"}
            </button>
          }
        />
      </header>

      {/* Hero + body share a positioning wrapper. On the narrow layout the
          context panel is an absolute overlay anchored to this wrapper (not to
          the body grid), so an expanded panel drops directly below the sticky
          header and overlays the hero — rather than starting below the hero at
          the top of the grid. The wrapper carries no positioning on the wide
          layout, so the desktop hero-then-grid stack is unchanged. */}
      <div className="cs-landing__body">
        {/* Hero — the amber promo band (landing-hero-band) over a 3-up card
            grid. It sits in normal flow below the sticky header, so it scrolls
            up under the nav as the page moves. */}
        <section className="cs-landing__hero" aria-label="Featured">
          <div className="cs-landing__hero-band">
            <p className="cs-landing__hero-headline">
              Build with the template. Ship faster.
            </p>
            <p className="cs-landing__hero-subline">
              A one-line promise that expands on the headline.
            </p>
            <p className="cs-landing__hero-cta">
              <a href="#">Get started</a>
              <span aria-hidden="true"> · </span>
              <a href="#">Learn more</a>
            </p>
          </div>
          <div className="cs-landing__hero-grid">
            {HERO_CARDS.map((card) => {
              // href is an anchor attribute; Card's props extend
              // HTMLAttributes<HTMLElement> (no href), so type it explicitly and
              // spread it through Card's ...rest — same idiom as the landing
              // project's ShowcaseCard.
              const anchorProps: AnchorHTMLAttributes<HTMLAnchorElement> = {
                href: "#",
              };
              return (
                <Card
                  key={card.name}
                  as="a"
                  interactive
                  className="cs-landing__app-card"
                  {...anchorProps}
                >
                  <span className="cs-landing__app-name">{card.name}</span>
                  <p className="cs-landing__app-problem">{card.problem}</p>
                </Card>
              );
            })}
          </div>
        </section>

        <div className="cs-landing__grid">
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

          {/* Boilerplate right-aligned, collapsible, sticky context panel. It
              scrolls on its own (overflow-y is set in base.css); the native
              scrollbar is colored with the accent token to match the landing
              project, which relies on the native bar rather than a custom
              indicator. On the narrow layout it is an absolute overlay anchored
              to cs-landing__body, so an open panel drops below the header. */}
          <aside
            id="cs-landing-panel"
            className={[
              "cs-landing__panel",
              panelOpen ? "cs-landing__panel--open" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label="Context"
          >
            {PANEL_SECTIONS.map(renderPanelSection)}
          </aside>
        </div>
      </div>

      {/* Common footer — same content as the landing project. */}
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
              className="cs-landing__cc-badge"
            />
          </a>
        </p>
      </footer>
    </div>
  );
}
