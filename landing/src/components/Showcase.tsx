import type { AnchorHTMLAttributes } from "react";
import { Card } from "@commons-systems/ds";
import type { AppCard } from "../site-config.ts";

function ShowcaseCard({ app }: { app: AppCard }) {
  // href is an anchor attribute; Card's props extend HTMLAttributes<HTMLElement>
  // (no href), so type it explicitly and spread through Card's ...rest.
  const anchorProps: AnchorHTMLAttributes<HTMLAnchorElement> = { href: app.url };
  return (
    <Card as="a" interactive className="app-card" {...anchorProps}>
      <img
        className="app-card-screenshot"
        loading="lazy"
        src={app.screenshot}
        alt={app.screenshotAlt}
        width={1200}
        height={800}
      />
      <span className="app-name">{app.name}</span>
      <p className="app-problem">{app.problem}</p>
    </Card>
  );
}

/**
 * The hero band + app grid. Rendered as the *children* of the existing
 * `.landing-hero` section — both at build time (inside the section wrapper that
 * `Showcase` adds for the prerender seam) and on the client (mounted directly
 * into the `.landing-hero` placeholder node). Kept separate from the section
 * wrapper so the client mount does not nest a second `.landing-hero` section.
 */
export function ShowcaseContent({
  apps,
  overflow = [],
}: {
  apps: AppCard[];
  overflow?: AppCard[];
}) {
  return (
    <>
      <div className="landing-hero-band">
        <p className="landing-hero-band-headline">
          Build with commons.systems. Learn to run without.
        </p>
        <p className="landing-hero-band-subline">
          Code you understand. Data you control. A roadmap you set.
        </p>
        <p className="landing-hero-band-cta">
          <a href="/about">Learn More</a>
          <span aria-hidden="true"> · </span>
          <a href="https://github.com/natb1/commons.systems">Source</a>
        </p>
      </div>
      <div className="landing-hero-grid">
        {apps.map((app) => (
          <ShowcaseCard key={app.url} app={app} />
        ))}
      </div>
      {overflow.length > 0 && (
        <details className="app-showcase-overflow">
          <summary>more…</summary>
          <div className="app-showcase-overflow-cards">
            {overflow.map((app) => (
              <ShowcaseCard key={app.url} app={app} />
            ))}
          </div>
        </details>
      )}
    </>
  );
}

/**
 * Full showcase section, used by the prerender `homeExtraHtml` seam, which
 * replaces the `<section class="landing-hero">` placeholder in the template
 * wholesale (blog's injectHomeExtra). The client never renders this wrapper —
 * it mounts ShowcaseContent into the existing placeholder node instead.
 */
export function Showcase({
  apps,
  overflow = [],
}: {
  apps: AppCard[];
  overflow?: AppCard[];
}) {
  return (
    <section className="landing-hero app-showcase" aria-label="Featured apps">
      <ShowcaseContent apps={apps} overflow={overflow} />
    </section>
  );
}
