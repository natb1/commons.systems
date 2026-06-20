import { describe, it, expect, vi } from "vitest";
import { timestampMockFactory } from "./helpers";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { renderBudgetsContent } from "../src/pages/budgets";
import { AppShell } from "../src/AppShell";
import { Timestamp } from "firebase/firestore";
import type { Budget, BudgetPeriod, WeeklyAggregate, GroupId } from "../src/firestore";

function makeBudget(overrides: Partial<Budget> & { id: string; name: string }): Budget {
  return {
    allowance: 100,
    allowancePeriod: "weekly",
    rollover: "none",
    overrides: [],
    groupId: null as GroupId | null,
    ...overrides,
  } as Budget;
}

function makePeriod(overrides: Partial<BudgetPeriod> & { id: string; budgetId: string }): BudgetPeriod {
  return {
    periodStart: Timestamp.fromMillis(1705190400000), // 2024-01-14
    periodEnd: Timestamp.fromMillis(1705795200000),   // 2024-01-21
    total: 50,
    count: 3,
    categoryBreakdown: {},
    groupId: null as GroupId | null,
    ...overrides,
  } as BudgetPeriod;
}

describe("renderBudgetsContent", () => {
  const budgets: Budget[] = [
    makeBudget({ id: "food", name: "Food", allowance: 150 }),
    makeBudget({ id: "fun", name: "Fun", allowance: 50 }),
  ];

  const periods: BudgetPeriod[] = [
    makePeriod({ id: "bp-1", budgetId: "food" }),
    makePeriod({ id: "bp-2", budgetId: "fun" }),
  ];

  const weeklyAggregates: WeeklyAggregate[] = [
    {
      id: "2025-01-13",
      weekStart: Timestamp.fromMillis(1705104000000),
      creditTotal: 500,
      unbudgetedTotal: 75,
      groupId: null as GroupId | null,
    },
  ];

  it("renders an h2 heading", () => {
    const html = renderBudgetsContent(budgets, periods, weeklyAggregates, false);
    expect(html).toContain("<h2>Budgets</h2>");
  });

  it("renders the budgets-table container", () => {
    const html = renderBudgetsContent(budgets, periods, weeklyAggregates, false);
    expect(html).toContain('id="budgets-table"');
  });

  it("renders budget names in the table", () => {
    const html = renderBudgetsContent(budgets, periods, weeklyAggregates, false);
    expect(html).toContain('value="Food"');
    expect(html).toContain('value="Fun"');
  });

  it("renders seed-data-notice when not authorized", () => {
    const html = renderBudgetsContent(budgets, periods, weeklyAggregates, false);
    expect(html).toContain('id="seed-data-notice"');
    expect(html).toContain("Viewing example data");
  });

  it("does not render seed-data-notice when authorized", () => {
    const html = renderBudgetsContent(budgets, periods, weeklyAggregates, true);
    expect(html).not.toContain('id="seed-data-notice"');
  });

  it("renders the budget metrics section", () => {
    const html = renderBudgetsContent(budgets, periods, weeklyAggregates, false);
    expect(html).toContain('id="budget-metrics"');
  });

  it("renders the chart container", () => {
    const html = renderBudgetsContent(budgets, periods, weeklyAggregates, false);
    expect(html).toContain('id="budgets-chart"');
    expect(html).toContain('id="budgets-area-chart"');
  });

  it("renders disabled inputs when not authorized", () => {
    const html = renderBudgetsContent(budgets, periods, weeklyAggregates, false);
    expect(html).toContain("disabled");
  });

  it("renders editable inputs when authorized", () => {
    const html = renderBudgetsContent(budgets, periods, weeklyAggregates, true);
    const nameInputMatch = html.match(/<input type="text" class="edit-name"[^>]*>/g);
    expect(nameInputMatch).not.toBeNull();
    for (const match of nameInputMatch!) {
      expect(match).not.toContain("disabled");
    }
  });

  it("renders 'No budgets found' for empty budget list", () => {
    const html = renderBudgetsContent([], [], weeklyAggregates, false);
    expect(html).toContain("No budgets found");
  });
});

// ---------------------------------------------------------------------------
// SSG shell + injection
// Tests the exact shell+content that prerender.tsx bakes into <div id="root">
// without running the file-I/O script. Uses React.createElement to stay in a
// .ts file (no JSX transform required); mirrors prerender.tsx exactly.
// ---------------------------------------------------------------------------

describe("prerender SSG shell + injection", () => {
  // Reuse the same small fixture as renderBudgetsContent tests above.
  const budgets: Budget[] = [
    makeBudget({ id: "food", name: "Food", allowance: 150 }),
    makeBudget({ id: "fun", name: "Fun", allowance: 50 }),
  ];

  const periods: BudgetPeriod[] = [
    makePeriod({ id: "bp-1", budgetId: "food" }),
    makePeriod({ id: "bp-2", budgetId: "fun" }),
  ];

  const weeklyAggregates: WeeklyAggregate[] = [
    {
      id: "2025-01-13",
      weekStart: Timestamp.fromMillis(1705104000000),
      creditTotal: 500,
      unbudgetedTotal: 75,
      groupId: null as GroupId | null,
    },
  ];

  // Matches prerender.tsx: sync string render of the "/" route body.
  const budgetsHtml = renderBudgetsContent(budgets, periods, weeklyAggregates, false);

  // Render the same pure shell the prerender script composes.
  // React.createElement avoids JSX in this .ts file while producing the same tree.
  const shellHtml = renderToStaticMarkup(
    React.createElement(
      AppShell,
      { current: "/" },
      React.createElement("main", {
        id: "app",
        dangerouslySetInnerHTML: { __html: budgetsHtml },
      }),
    ),
  );

  it("contains the <h1>Budget</h1> heading", () => {
    expect(shellHtml).toContain("<h1>Budget</h1>");
  });

  it("renders nav links as real anchor elements", () => {
    // The ds Nav renders every link as <a>, including the current one.
    expect(shellHtml).toMatch(/<a[^>]+href="\/"[^>]*>budgets<\/a>/);
    expect(shellHtml).toMatch(/<a[^>]+href="\/transactions"[^>]*>transactions<\/a>/);
    expect(shellHtml).toMatch(/<a[^>]+href="\/accounts"[^>]*>accounts<\/a>/);
    expect(shellHtml).toMatch(/<a[^>]+href="\/rules"[^>]*>rules<\/a>/);
  });

  it("marks the '/' nav link as aria-current='page'", () => {
    expect(shellHtml).toContain('aria-current="page"');
  });

  it("renders the empty #hero-container placeholder (no hero baked)", () => {
    expect(shellHtml).toContain('id="hero-container"');
  });

  it("renders the <main id='app'> wrapper", () => {
    expect(shellHtml).toContain('<main id="app"');
  });

  it("injects the budgets content — h2 heading", () => {
    expect(shellHtml).toContain("<h2>Budgets</h2>");
  });

  it("injects the budgets content — budgets-table", () => {
    expect(shellHtml).toContain('id="budgets-table"');
  });

  it("injects the budgets content — seed-data-notice (unauthorized fixture)", () => {
    expect(shellHtml).toContain('id="seed-data-notice"');
  });

  it("renders the CC-BY-SA footer badge", () => {
    expect(shellHtml).toContain('alt="CC-BY-SA"');
  });
});
