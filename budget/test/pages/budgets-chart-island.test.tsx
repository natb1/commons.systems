// @vitest-environment happy-dom
//
// The bar/pie/area chart island on the React <Budgets> page (Unit 2 of #1876).
// Unlike the Sankey (its own component), the budgets page renders ONE island that
// calls hydrateBudgetChart in an effect — hydrateBudgetChart already orchestrates
// the bar + pie + area charts plus the date-picker / weeks / resize / scroll-sync
// controls. This suite drives the island via <Budgets> with the d3 render fns
// stubbed, and locks the #1267 stale-listener fix as an EFFECT CLEANUP: the
// island's effect returns hydrateBudgetChart's teardown, so React disconnects the
// ResizeObserver and aborts scroll-sync before re-running the effect or on unmount.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import type { DataSource } from "../../src/data-source";
import { createMockDataSource } from "../helpers";

vi.mock("firebase/firestore", () => ({
  Timestamp: class Timestamp {
    _date: Date;
    constructor(d: Date) { this._date = d; }
    toDate() { return this._date; }
    toMillis() { return this._date.getTime(); }
    static fromDate(d: Date) { return new Timestamp(d); }
    static fromMillis(ms: number) { return new Timestamp(new Date(ms)); }
  },
}));

const renderBudgetChart = vi.fn(() => () => {});
const renderBudgetPieChart = vi.fn(() => () => {});
const renderPerBudgetAreaChart = vi.fn(() => () => {});
vi.mock("../../src/pages/budgets-chart.js", () => ({ renderBudgetChart: (...a: unknown[]) => renderBudgetChart(...(a as [])) }));
vi.mock("../../src/pages/budgets-pie-chart.js", () => ({ renderBudgetPieChart: (...a: unknown[]) => renderBudgetPieChart(...(a as [])) }));
vi.mock("../../src/pages/budgets-area-chart.js", () => ({ renderPerBudgetAreaChart: (...a: unknown[]) => renderPerBudgetAreaChart(...(a as [])) }));

import { Budgets } from "../../src/pages/Budgets";
import type { Budget } from "../../src/firestore";

function budget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: "food" as Budget["id"],
    name: "Food",
    allowance: 150,
    allowancePeriod: "weekly",
    rollover: "none",
    overrides: [],
    groupId: null,
    ...overrides,
  };
}

function seedOptions(dsOverrides: Partial<DataSource> = {}) {
  return {
    authorized: false,
    groupName: "",
    dataSource: createMockDataSource({
      getBudgets: vi.fn().mockResolvedValue([budget()]),
      ...dsOverrides,
    }),
  };
}

let disconnectSpy: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.clearAllMocks();
  disconnectSpy = vi.fn();
  class FakeRO {
    observe() {}
    unobserve() {}
    disconnect() { disconnectSpy(); }
  }
  vi.stubGlobal("ResizeObserver", FakeRO as unknown as typeof ResizeObserver);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

async function renderUntilHydrated() {
  const utils = render(<Budgets options={seedOptions()} />);
  // The chart effect runs after the load effect settles and the chart containers
  // mount; wait for hydrateBudgetChart to drive the bar chart at least once.
  await waitFor(() => {
    if (renderBudgetChart.mock.calls.length === 0) throw new Error("chart not hydrated");
  });
  return utils;
}

describe("Budgets chart island", () => {
  it("renders the chart family containers and controls", async () => {
    const { container } = await renderUntilHydrated();
    expect(container.querySelector("#budgets-chart")).not.toBeNull();
    expect(container.querySelector("#budgets-area-chart")).not.toBeNull();
    expect(container.querySelector("#budgets-pie")).not.toBeNull();
    expect(container.querySelector("#chart-date-picker")).not.toBeNull();
    expect(container.querySelector("#area-chart-weeks")).not.toBeNull();
    expect(container.querySelector("#budget-metrics")).not.toBeNull();
  });

  it("hydrates the bar, pie, and area charts from the container data blobs", async () => {
    await renderUntilHydrated();
    expect(renderBudgetChart).toHaveBeenCalled();
    expect(renderBudgetPieChart).toHaveBeenCalled();
    expect(renderPerBudgetAreaChart).toHaveBeenCalled();
  });

  it("disconnects the ResizeObserver on unmount (no leaked observer)", async () => {
    const { unmount } = await renderUntilHydrated();
    expect(disconnectSpy).not.toHaveBeenCalled();
    unmount();
    expect(disconnectSpy).toHaveBeenCalled();
  });
});
