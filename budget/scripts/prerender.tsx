import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { serializeSeedData } from "../src/vite-plugin-seed-data.js";
import { idbToBudget } from "../src/entities/budget.js";
import { idbToBudgetPeriod } from "../src/entities/budget-period.js";
import { idbToWeeklyAggregate } from "../src/entities/weekly-aggregate.js";
import { renderBudgetsContent } from "../src/pages/budgets.js";
import { AppShell } from "../src/AppShell.js";

// SSG first-paint snapshot. The client mounts with createRoot (NOT hydrateRoot),
// so this baked HTML is a static first-paint approximation that React replaces
// wholesale on mount — hence renderToStaticMarkup (no hydration markers), not
// renderToString. hydrateRoot would require a byte-exact match, which is
// impossible here for three reasons: (1) the baked route is always "/" (budgets)
// but index.html is served for every route, so non-"/" first loads would
// mismatch; (2) real route bodies render async (renderBudgets is a Promise)
// while renderToStaticMarkup is sync, so we bake the sync renderBudgetsContent
// instead; (3) the budgets chart is a client-only island with no server output.
// hydrateRoot becomes correct only once every route is a React, SSR-able tree —
// out of scope for this unit.
const distDir = join(dirname(new URL(import.meta.url).pathname), "..", "dist");
const indexPath = join(distDir, "index.html");

const seedData = serializeSeedData();
const budgets = seedData.budgets.map(idbToBudget);
const periods = seedData.budgetPeriods.map(idbToBudgetPeriod);
const weeklyAggregates = seedData.weeklyAggregates.map(idbToWeeklyAggregate);
// Synchronous string render of the baked "/" route body — ideal for SSG.
const budgetsHtml = renderBudgetsContent(budgets, periods, weeklyAggregates, false);

// Render the same pure shell the client composes, with the budgets content in
// the <main id="app"> wrapper (matching the client's LegacyRoute container
// shape). navEnd is omitted (no auth UI baked); the empty #hero-container
// placeholder comes from AppShell's server default.
const shellHtml = renderToStaticMarkup(
  <AppShell current="/">
    <main id="app" dangerouslySetInnerHTML={{ __html: budgetsHtml }} />
  </AppShell>,
);

let html = readFileSync(indexPath, "utf-8");

const rootTarget = '<div id="root"></div>';
const injected = html.replace(rootTarget, `<div id="root">${shellHtml}</div>`);
if (injected === html) {
  console.error(`Prerender failed: could not find "${rootTarget}" in dist/index.html`);
  process.exit(1);
}
html = injected;

writeFileSync(indexPath, html);

console.log("Prerender: injected the static app shell + budgets content into dist/index.html");
