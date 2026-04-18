import { escapeHtml } from "@commons-systems/htmlutil";
import type { AppCard } from "./site-config.ts";

function renderBand(): string {
  return `<div class="landing-hero-band">
        <p class="landing-hero-band-headline">Build with commons.systems. Run without.</p>
        <p class="landing-hero-band-subline">Code you understand. Data you control. A roadmap you set.</p>
      </div>`;
}

function renderCard(app: AppCard): string {
  return `<a class="app-card" href="${escapeHtml(app.url)}">
          <img class="app-card-screenshot" loading="lazy" src="${escapeHtml(app.screenshot)}" alt="${escapeHtml(app.screenshotAlt)}" width="600" height="400">
          <span class="app-name">${escapeHtml(app.name)}</span>
          <p class="app-problem">${escapeHtml(app.problem)}</p>
        </a>`;
}

export function renderShowcase(apps: AppCard[]): string {
  const cards = apps.map(renderCard).join("\n        ");
  return `<section class="landing-hero app-showcase" aria-label="Featured apps">
      ${renderBand()}
      <div class="landing-hero-grid">
        ${cards}
      </div>
    </section>`;
}
