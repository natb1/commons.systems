import { escapeHtml } from "@commons-systems/htmlutil";
import type { AppCard, Dependency } from "./site-config.ts";

function renderBand(): string {
  return `<div class="landing-hero-band">
        <p class="landing-hero-band-headline">Build with commons.systems. Run without.</p>
        <p class="landing-hero-band-subline">Code you own. Data you control. A roadmap you set.</p>
      </div>`;
}

function renderCard(app: AppCard): string {
  return `<a class="app-card" href="${escapeHtml(app.url)}">
          <img class="app-card-screenshot" loading="lazy" src="${escapeHtml(app.screenshot)}" alt="${escapeHtml(app.screenshotAlt)}" width="600" height="400">
          <span class="app-name">${escapeHtml(app.name)}</span>
          <p class="app-problem">${escapeHtml(app.problem)}</p>
        </a>`;
}

function renderDependencyTable(deps: Dependency[]): string {
  const rows = deps
    .map(
      (d) => `          <tr>
            <th scope="row">${escapeHtml(d.name)}</th>
            <td>${escapeHtml(d.solves)}</td>
            <td>${escapeHtml(d.classification)}</td>
            <td>${escapeHtml(d.exitPath)}</td>
            <td>${escapeHtml(d.ratchetRisk)}</td>
          </tr>`,
    )
    .join("\n");
  return `<section class="dependency-assessment" aria-labelledby="dependency-assessment-heading">
        <h2 id="dependency-assessment-heading">Dependency self-assessment</h2>
        <div class="dependency-assessment-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Dependency</th>
                <th scope="col">Solves</th>
                <th scope="col">Required or parasitic?</th>
                <th scope="col">Exit path</th>
                <th scope="col">Ratchet risk</th>
              </tr>
            </thead>
            <tbody>
${rows}
            </tbody>
          </table>
        </div>
      </section>`;
}

export function renderShowcase(apps: AppCard[], deps: Dependency[]): string {
  const cards = apps.map(renderCard).join("\n        ");
  return `<section class="landing-hero app-showcase" aria-label="Featured apps">
      ${renderBand()}
      <div class="landing-hero-grid">
        ${cards}
      </div>
      ${renderDependencyTable(deps)}
    </section>`;
}
