import { Hero } from "@commons-systems/ds";
import type { HeroCard } from "@commons-systems/ds";
import type { ProjectCard } from "./site-config.ts";

/**
 * Build the ds <Hero> element from the project showcase data. Shared by the
 * client (main.tsx's createBlogApp shell) and the prerender (prerender.tsx's
 * prerenderPosts/prerenderStaticPage shell) so both sides build an identical
 * node — a hard requirement for hydration parity.
 */
export function buildShowcaseHero(
  projects: ProjectCard[],
  overflow: ProjectCard[] = [],
) {
  const toCard = (p: ProjectCard): HeroCard => ({
    name: p.name,
    problem: p.problem,
    href: p.url,
    className: "project-card",
    media: (
      <img
        className="project-card-screenshot"
        loading="lazy"
        src={p.screenshot}
        alt={p.screenshotAlt}
        width={1200}
        height={800}
      />
    ),
  });
  return (
    <Hero
      headline="Build with commons.systems. Learn to run without."
      subline="Code you understand. Data you control. A roadmap you set."
      ctas={[
        { label: "Learn More", href: "/about" },
        { label: "Source", href: "https://github.com/natb1/commons.systems" },
      ]}
      cards={projects.map(toCard)}
      overflow={overflow.map(toCard)}
      aria-label="Featured projects"
    />
  );
}
