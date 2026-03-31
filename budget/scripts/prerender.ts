import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import appSeed from "../seeds/firestore.js";
import { renderBudgetsContent } from "../src/pages/budgets.js";
import type { Budget, BudgetPeriod, WeeklyAggregate, BudgetId, BudgetPeriodId, GroupId } from "../src/firestore.js";

const distDir = join(dirname(new URL(import.meta.url).pathname), "..", "dist");
const indexPath = join(distDir, "index.html");

// Minimal Timestamp shim for build-time rendering (same pattern as test/helpers.ts:MockTimestamp)
class BuildTimestamp {
  constructor(private readonly ms: number) {}
  toMillis(): number { return this.ms; }
  toDate(): Date { return new Date(this.ms); }
  static fromMillis(ms: number): BuildTimestamp { return new BuildTimestamp(ms); }
  static fromDate(d: Date): BuildTimestamp { return new BuildTimestamp(d.getTime()); }
}

function findCollection(name: string): { id: string; data: Record<string, unknown> }[] {
  const col = appSeed.collections.find((c) => c.name === name);
  if (!col) throw new Error(`Seed collection "${name}" not found`);
  return col.documents as { id: string; data: Record<string, unknown> }[];
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

// Pre-render nav links
const navHtml = `<app-nav id="nav"><span class="nav-links">
     <a href="/">budgets</a>
     <a href="/transactions">transactions</a>
     <a href="/accounts">accounts</a>
     <a href="/rules">rules</a>
   </span></app-nav>`;

// Pre-render budgets page content
const budgets = buildBudgets();
const periods = buildBudgetPeriods();
const weeklyAggregates = buildWeeklyAggregates();
const budgetsHtml = renderBudgetsContent(budgets, periods, weeklyAggregates, false);

let html = readFileSync(indexPath, "utf-8");
html = html.replace("<app-nav id=\"nav\"></app-nav>", navHtml);
html = html.replace("<main id=\"app\"></main>", `<main id="app">${budgetsHtml}</main>`);
writeFileSync(indexPath, html);

console.log("Prerender: injected nav links and budgets content into dist/index.html");
