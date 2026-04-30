import { escapeHtml } from "@commons-systems/htmlutil";
import type { AppCard } from "./site-config.ts";

function renderCard(app: AppCard): string {
  return `<a class="app-card" href="${escapeHtml(app.url)}">
          <img class="app-card-screenshot" loading="lazy" src="${escapeHtml(app.screenshot)}" alt="${escapeHtml(app.screenshotAlt)}" width="1200" height="800">
          <span class="app-name">${escapeHtml(app.name)}</span>
          <p class="app-problem">${escapeHtml(app.problem)}</p>
        </a>`;
}

export function renderShowcase(apps: AppCard[]): string {
  const cards = apps.map(renderCard).join("\n        ");
  return `<section class="landing-hero app-showcase" aria-label="Featured apps">
      <div class="landing-hero-band">
        <p class="landing-hero-band-headline">Build with commons.systems. Run without.</p>
        <p class="landing-hero-band-subline">Code you understand. Data you control. A roadmap you set.</p>
        <p class="landing-hero-band-cta">
          <a href="/about">Learn More</a>
          <span aria-hidden="true"> · </span>
          <a href="https://github.com/natb1/commons.systems">Source</a>
        </p>
      </div>
      <div class="landing-hero-grid">
        ${cards}
      </div>
    </section>`;
}
