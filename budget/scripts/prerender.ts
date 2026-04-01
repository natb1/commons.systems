import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { serializeSeedData } from "../src/vite-plugin-seed-data.js";
import { toBudget, toBudgetPeriod, toWeeklyAggregate } from "../src/converters.js";
import { renderBudgetsContent } from "../src/pages/budgets.js";
import { NAV_LINKS } from "../src/nav-links.js";

const distDir = join(dirname(new URL(import.meta.url).pathname), "..", "dist");
const indexPath = join(distDir, "index.html");

const seedData = serializeSeedData();
const budgets = seedData.budgets.map(toBudget);
const periods = seedData.budgetPeriods.map(toBudgetPeriod);
const weeklyAggregates = seedData.weeklyAggregates.map(toWeeklyAggregate);
const budgetsHtml = renderBudgetsContent(budgets, periods, weeklyAggregates, false);

const navLinksInner = NAV_LINKS.map(l => `<a href="${l.href}">${l.label}</a>`).join("\n     ");
const navHtml = `<app-nav id="nav"><span class="nav-links">\n     ${navLinksInner}\n   </span></app-nav>`;

let html = readFileSync(indexPath, "utf-8");

const navTarget = '<app-nav id="nav"></app-nav>';
const afterNav = html.replace(navTarget, navHtml);
if (afterNav === html) {
  console.error(`Prerender failed: could not find "${navTarget}" in dist/index.html`);
  process.exit(1);
}
html = afterNav;

const mainTarget = '<main id="app"></main>';
const afterMain = html.replace(mainTarget, `<main id="app">${budgetsHtml}</main>`);
if (afterMain === html) {
  console.error(`Prerender failed: could not find "${mainTarget}" in dist/index.html`);
  process.exit(1);
}
html = afterMain;

writeFileSync(indexPath, html);

console.log("Prerender: injected nav links and budgets content into dist/index.html");
