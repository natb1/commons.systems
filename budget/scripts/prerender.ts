import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { findCollection } from "../seeds/find-collection.js";
import { renderBudgetsContent } from "../src/pages/budgets.js";
import type { Budget, BudgetPeriod, WeeklyAggregate, BudgetId, BudgetPeriodId, GroupId } from "../src/firestore.js";

const distDir = join(dirname(new URL(import.meta.url).pathname), "..", "dist");
const indexPath = join(distDir, "index.html");

// Minimal Timestamp shim for build-time rendering (similar purpose to test/helpers.ts:MockTimestamp)
class BuildTimestamp {
  constructor(private readonly ms: number) {}
  toMillis(): number { return this.ms; }
  toDate(): Date { return new Date(this.ms); }
  static fromMillis(ms: number): BuildTimestamp { return new BuildTimestamp(ms); }
  static fromDate(d: Date): BuildTimestamp { return new BuildTimestamp(d.getTime()); }
}

function buildBudgets(): Budget[] {
  return findCollection("seed-budgets").map(({ id, data }) => ({
    id: id as BudgetId,
    name: data.name as string,
    allowance: data.allowance as number,
    allowancePeriod: (data.allowancePeriod ?? "weekly") as Budget["allowancePeriod"],
    rollover: data.rollover as Budget["rollover"],
    overrides: Array.isArray(data.overrides)
      ? (data.overrides as { date: Date; balance: number }[]).map((o) => ({
          date: BuildTimestamp.fromDate(o.date) as unknown as Budget["overrides"][0]["date"],
          balance: o.balance,
        }))
      : [],
    groupId: null as GroupId | null,
  }));
}

function buildBudgetPeriods(): BudgetPeriod[] {
  return findCollection("seed-budget-periods").map(({ id, data }) => ({
    id: id as BudgetPeriodId,
    budgetId: data.budgetId as BudgetId,
    periodStart: BuildTimestamp.fromDate(data.periodStart as Date) as unknown as BudgetPeriod["periodStart"],
    periodEnd: BuildTimestamp.fromDate(data.periodEnd as Date) as unknown as BudgetPeriod["periodEnd"],
    total: data.total as number,
    count: data.count as number,
    categoryBreakdown: (data.categoryBreakdown ?? {}) as Record<string, number>,
    groupId: null as GroupId | null,
  }));
}

function buildWeeklyAggregates(): WeeklyAggregate[] {
  return findCollection("seed-weekly-aggregates").map(({ id, data }) => ({
    id,
    weekStart: BuildTimestamp.fromDate(data.weekStart as Date) as unknown as WeeklyAggregate["weekStart"],
    creditTotal: data.creditTotal as number,
    unbudgetedTotal: data.unbudgetedTotal as number,
    groupId: null as GroupId | null,
  }));
}

import { NAV_LINKS } from "../src/nav-links.js";

const navLinksInner = NAV_LINKS.map(l => `<a href="${l.href}">${l.label}</a>`).join("\n     ");
const navHtml = `<app-nav id="nav"><span class="nav-links">\n     ${navLinksInner}\n   </span></app-nav>`;

const budgets = buildBudgets();
const periods = buildBudgetPeriods();
const weeklyAggregates = buildWeeklyAggregates();
const budgetsHtml = renderBudgetsContent(budgets, periods, weeklyAggregates, false);

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
