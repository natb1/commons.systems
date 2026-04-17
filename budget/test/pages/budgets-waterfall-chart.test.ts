import { describe, it, expect, vi, afterEach } from "vitest";
import { timestampMockFactory, makeContainer } from "../helpers";
import type { CategoryActualRow } from "../../src/balance";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { buildWaterfallBars, renderVarianceWaterfall } from "../../src/pages/budgets-waterfall-chart";

function cat(category: string, avgWeekly: number): CategoryActualRow {
  return { kind: "category", category, avgWeekly };
}

function other(avgWeekly: number, groupedCount: number): CategoryActualRow {
  return { kind: "other", avgWeekly, groupedCount };
}

const FAVORABLE = "#4caf50";
const UNFAVORABLE = "#e45858";

function themedContainer(): HTMLElement {
  const c = makeContainer();
  c.style.setProperty("--favorable", FAVORABLE);
  c.style.setProperty("--unfavorable", UNFAVORABLE);
  return c;
}

describe("buildWaterfallBars", () => {
  it("produces allowance, one bar per category, and a trailing actual bar", () => {
    const bars = buildWaterfallBars({
      weeklyAllowance: 100,
      categories: [cat("Food:Groceries", 60)],
      window: 12,
    });
    expect(bars).toHaveLength(3);
    expect(bars[0]).toMatchObject({ label: "Allowance", y1: 0, y2: 100, kind: "allowance" });
    expect(bars[1]).toMatchObject({ label: "Food:Groceries", y1: 100, y2: 40, kind: "category" });
    expect(bars[2]).toMatchObject({ label: "Actual", y1: 0, y2: 60, kind: "actual" });
  });

  it("running total reflects multiple categories in order", () => {
    const bars = buildWaterfallBars({
      weeklyAllowance: 150,
      categories: [cat("A", 100), cat("B", 40), other(10, 2)],
      window: 12,
    });
    expect(bars).toHaveLength(5);
    expect(bars[1]).toMatchObject({ label: "A", y1: 150, y2: 50 });
    expect(bars[2]).toMatchObject({ label: "B", y1: 50, y2: 10 });
    expect(bars[3]).toMatchObject({ label: "Other", y1: 10, y2: 0 });
    expect(bars[4]).toMatchObject({ label: "Actual", y1: 0, y2: 150 });
  });

  it("handles over-budget case where running total goes negative", () => {
    const bars = buildWaterfallBars({
      weeklyAllowance: 50,
      categories: [cat("Food:Restaurants", 80)],
      window: 12,
    });
    expect(bars[1]).toMatchObject({ label: "Food:Restaurants", y1: 50, y2: -30 });
    expect(bars[2]).toMatchObject({ label: "Actual", y1: 0, y2: 80 });
  });

  it("throws when given zero categories", () => {
    expect(() =>
      buildWaterfallBars({ weeklyAllowance: 100, categories: [], window: 52 }),
    ).toThrow();
  });

  it("preserves the bridge invariant across multiple categories", () => {
    const weeklyAllowance = 200;
    const categories: CategoryActualRow[] = [cat("A", 80), cat("B", 50), cat("C", 20)];
    const bars = buildWaterfallBars({ weeklyAllowance, categories, window: 12 });
    const lastCategoryBar = bars[bars.length - 2];
    const actualBar = bars[bars.length - 1];
    const totalActual = categories.reduce((s, c) => s + c.avgWeekly, 0);
    expect(lastCategoryBar.y2 + totalActual).toBeCloseTo(weeklyAllowance);
    expect(actualBar.y2).toBeCloseTo(totalActual);
  });
});

describe("renderVarianceWaterfall", () => {
  const containers: HTMLElement[] = [];
  function trackedContainer(): HTMLElement {
    const c = themedContainer();
    containers.push(c);
    return c;
  }
  afterEach(() => {
    for (const c of containers) c.remove();
    containers.length = 0;
  });

  it("renders an svg with the expected aria label", () => {
    const container = trackedContainer();
    renderVarianceWaterfall(container, {
      weeklyAllowance: 100,
      categories: [cat("Food:Groceries", 60), cat("Food:Restaurants", 20)],
      window: 12,
    });
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute("aria-label")).toMatch(/variance waterfall/i);
    expect(svg!.getAttribute("aria-label")).toContain("12");
  });

  it("uses the 52-week window label in aria when requested", () => {
    const container = trackedContainer();
    renderVarianceWaterfall(container, {
      weeklyAllowance: 100,
      categories: [cat("Food:Groceries", 60)],
      window: 52,
    });
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-label")).toContain("52");
  });

  function lastRectFill(container: HTMLElement): string {
    const rects = container.querySelectorAll("rect");
    const last = rects[rects.length - 1];
    expect(last).toBeDefined();
    return (last.getAttribute("fill") ?? "").toLowerCase();
  }

  it("paints the Actual bar with --favorable when actual is under allowance", () => {
    const container = trackedContainer();
    renderVarianceWaterfall(container, {
      weeklyAllowance: 100,
      categories: [cat("A", 50)],
      window: 12,
    });
    expect(lastRectFill(container)).toBe(FAVORABLE.toLowerCase());
  });

  it("paints the Actual bar with --unfavorable when actual exceeds allowance", () => {
    const container = trackedContainer();
    renderVarianceWaterfall(container, {
      weeklyAllowance: 100,
      categories: [cat("A", 150)],
      window: 12,
    });
    expect(lastRectFill(container)).toBe(UNFAVORABLE.toLowerCase());
  });

  it("treats equality (allowance == actual) as favorable", () => {
    const container = trackedContainer();
    renderVarianceWaterfall(container, {
      weeklyAllowance: 100,
      categories: [cat("A", 100)],
      window: 12,
    });
    expect(lastRectFill(container)).toBe(FAVORABLE.toLowerCase());
  });

  it("throws when container.clientWidth is zero", () => {
    const container = document.createElement("div");
    container.style.setProperty("--fg", "#e0e0e0");
    container.style.setProperty("--favorable", FAVORABLE);
    container.style.setProperty("--unfavorable", UNFAVORABLE);
    document.body.appendChild(container);
    Object.defineProperty(container, "clientWidth", { value: 0, configurable: true });
    expect(() =>
      renderVarianceWaterfall(container, {
        weeklyAllowance: 100,
        categories: [cat("A", 50)],
        window: 12,
      }),
    ).toThrow();
    container.remove();
  });
});
