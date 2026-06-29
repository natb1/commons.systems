import type { AnchorHTMLAttributes } from "react";
import { Card } from "@commons-systems/ds";
import type { ProjectCard } from "../site-config.ts";

function ShowcaseCard({ project }: { project: ProjectCard }) {
  // href is an anchor attribute; Card's props extend HTMLAttributes<HTMLElement>
  // (no href), so type it explicitly and spread through Card's ...rest.
  const anchorProps: AnchorHTMLAttributes<HTMLAnchorElement> = { href: project.url };
  return (
    <Card as="a" interactive className="project-card" {...anchorProps}>
      <img
        className="project-card-screenshot"
        loading="lazy"
        src={project.screenshot}
        alt={project.screenshotAlt}
        width={1200}
        height={800}
      />
      <span className="project-name">{project.name}</span>
      <p className="project-problem">{project.problem}</p>
    </Card>
  );
}

/**
 * The hero band + project grid. Rendered as the *children* of the existing
 * `.landing-hero` section — both at build time (inside the section wrapper that
 * `Showcase` adds for the prerender seam) and on the client (mounted directly
 * into the `.landing-hero` placeholder node). Kept separate from the section
 * wrapper so the client mount does not nest a second `.landing-hero` section.
 */
export function ShowcaseContent({
  projects,
  overflow = [],
}: {
  projects: ProjectCard[];
  overflow?: ProjectCard[];
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
        {projects.map((project) => (
          <ShowcaseCard key={project.url} project={project} />
        ))}
      </div>
      {overflow.length > 0 && (
        <details className="project-showcase-overflow">
          <summary>more…</summary>
          <div className="project-showcase-overflow-cards">
            {overflow.map((project) => (
              <ShowcaseCard key={project.url} project={project} />
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
  projects,
  overflow = [],
}: {
  projects: ProjectCard[];
  overflow?: ProjectCard[];
}) {
  return (
    <section className="landing-hero project-showcase" aria-label="Featured projects">
      <ShowcaseContent projects={projects} overflow={overflow} />
    </section>
  );
}
