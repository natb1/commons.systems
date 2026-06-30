import { describe, it, expect } from "vitest";
import { chartSeriesColor, computePanelWidth, filterToWindow } from "../../src/pages/chart-util";
import { makeContainer, CHART_TOKENS } from "../helpers";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

describe("chartSeriesColor", () => {
  it("resolves the --chart-N token for the given index", () => {
    const container = makeContainer();
    expect(chartSeriesColor(container, 0)).toBe(CHART_TOKENS["--chart-1"]);
    expect(chartSeriesColor(container, 5)).toBe(CHART_TOKENS["--chart-6"]);
  });

  it("cycles back to --chart-1 after six series", () => {
    const container = makeContainer();
    expect(chartSeriesColor(container, 6)).toBe(CHART_TOKENS["--chart-1"]);
    expect(chartSeriesColor(container, 7)).toBe(CHART_TOKENS["--chart-2"]);
  });
});

describe("computePanelWidth", () => {
  it("returns budgetCount * 30 + 30 for typical counts", () => {
    expect(computePanelWidth(2)).toBe(90);
    expect(computePanelWidth(3)).toBe(120);
    expect(computePanelWidth(5)).toBe(180);
  });

  it("clamps to minimum of 80", () => {
    expect(computePanelWidth(1)).toBe(80);
    expect(computePanelWidth(0)).toBe(80);
  });
});

describe("filterToWindow", () => {
  const anchor = new Date("2025-03-16").getTime(); // a Sunday

  it("includes weeks within 12-week window", () => {
    const weeks = [
      anchor - 11 * WEEK_MS,
      anchor - 6 * WEEK_MS,
      anchor,
    ];
    const result = filterToWindow(weeks, anchor);
    expect(result.size).toBe(3);
    for (const ms of weeks) expect(result.has(ms)).toBe(true);
  });

  it("excludes weeks older than 12 weeks", () => {
    const tooOld = anchor - 13 * WEEK_MS;
    const justOld = anchor - 12 * WEEK_MS; // exactly 12 weeks = cutoff, excluded (> cutoff)
    const inWindow = anchor - 11 * WEEK_MS;
    const result = filterToWindow([tooOld, justOld, inWindow, anchor], anchor);
    expect(result.has(tooOld)).toBe(false);
    expect(result.has(justOld)).toBe(false);
    expect(result.has(inWindow)).toBe(true);
    expect(result.has(anchor)).toBe(true);
  });

  it("excludes weeks after the anchor", () => {
    const future = anchor + WEEK_MS;
    const result = filterToWindow([anchor, future], anchor);
    expect(result.has(anchor)).toBe(true);
    expect(result.has(future)).toBe(false);
  });

  it("returns empty set for empty input", () => {
    expect(filterToWindow([], anchor).size).toBe(0);
  });
});
