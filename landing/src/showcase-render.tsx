import { renderToStaticMarkup } from "react-dom/server";
import { Showcase } from "./components/Showcase.tsx";
import type { ProjectCard } from "./site-config.ts";

/**
 * Static markup for the prerender `homeExtraHtml` seam (blog's injectHomeExtra
 * replaces the `<section class="landing-hero">` placeholder with this string).
 * The client mount in main.tsx renders ShowcaseContent directly instead.
 */
export function renderShowcase(primary: ProjectCard[], overflow: ProjectCard[] = []): string {
  return renderToStaticMarkup(<Showcase projects={primary} overflow={overflow} />);
}
