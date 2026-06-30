import { describe, it, expect } from "vitest";
import {
  MAX_PRIOR_WINDOWS,
  selectPriorWindows,
  priorWindowOpacities,
  buildPaceLineSpecs,
} from "../src/charts/budget-pace-chart-core.ts";
import type { PacePoint, BudgetPaceSeries, BudgetPaceColors } from "../src/charts/budget-pace-chart-core.ts";

const COLORS: BudgetPaceColors = {
  pace: "var(--chart-pace)",
  current: "var(--chart-current)",
  prior: "var(--chart-prior)",
};

/** A minimal two-point window identified by a unique y-offset. */
function window(id: number): PacePoint[] {
  return [
    { x: 0, y: id * 10 },
    { x: 1, y: id * 10 + 5 },
  ];
}

const PACE: PacePoint[] = [{ x: 0, y: 0 }, { x: 1, y: 100 }];
const CURRENT: PacePoint[] = [{ x: 0, y: 0 }, { x: 0.5, y: 45 }];

describe("MAX_PRIOR_WINDOWS", () => {
  it("is 3", () => {
    expect(MAX_PRIOR_WINDOWS).toBe(3);
  });
});

describe("selectPriorWindows", () => {
  it("returns an empty array when given an empty array", () => {
    expect(selectPriorWindows([])).toEqual([]);
  });

  it("returns all windows when count <= 3", () => {
    const two = [window(1), window(2)];
    expect(selectPriorWindows(two)).toEqual(two);
  });

  it("returns exactly 3 windows when given exactly 3", () => {
    const three = [window(1), window(2), window(3)];
    expect(selectPriorWindows(three)).toHaveLength(3);
  });

  it("clamps to the 3 most recent when given more than 3", () => {
    const five = [window(1), window(2), window(3), window(4), window(5)];
    const result = selectPriorWindows(five);
    expect(result).toHaveLength(3);
    // Most recent 3 are windows 3, 4, 5 (oldest→newest order preserved).
    expect(result[0]).toEqual(window(3));
    expect(result[1]).toEqual(window(4));
    expect(result[2]).toEqual(window(5));
  });

  it("preserves oldest→newest order within the kept windows", () => {
    const four = [window(10), window(20), window(30), window(40)];
    const result = selectPriorWindows(four);
    // Kept: window(20), window(30), window(40) — in that order.
    expect(result[0][0].y).toBe(20 * 10);
    expect(result[1][0].y).toBe(30 * 10);
    expect(result[2][0].y).toBe(40 * 10);
  });
});

describe("priorWindowOpacities", () => {
  it("returns [] for count 0", () => {
    expect(priorWindowOpacities(0)).toEqual([]);
  });

  it("returns [] for negative count", () => {
    expect(priorWindowOpacities(-1)).toEqual([]);
  });

  it("returns one value strictly in (0,1) for count 1", () => {
    const [op] = priorWindowOpacities(1);
    expect(op).toBeGreaterThan(0);
    expect(op).toBeLessThan(1);
  });

  it("returns 3 values all strictly in (0,1) for count 3", () => {
    const ops = priorWindowOpacities(3);
    expect(ops).toHaveLength(3);
    for (const op of ops) {
      expect(op).toBeGreaterThan(0);
      expect(op).toBeLessThan(1);
    }
  });

  it("returns values strictly increasing oldest→newest for count 3", () => {
    const [oldest, middle, newest] = priorWindowOpacities(3);
    expect(oldest).toBeLessThan(middle);
    expect(middle).toBeLessThan(newest);
  });

  it("returns values strictly increasing for count 2", () => {
    const [older, newer] = priorWindowOpacities(2);
    expect(older).toBeLessThan(newer);
  });
});

describe("buildPaceLineSpecs", () => {
  describe("pace spec", () => {
    it("has role 'pace' and strokeDasharray '3,3'", () => {
      const series: BudgetPaceSeries = { pace: PACE, current: CURRENT, previous: [] };
      const specs = buildPaceLineSpecs(series, COLORS);
      const pace = specs.find((s) => s.role === "pace");
      expect(pace).toBeDefined();
      expect(pace!.strokeDasharray).toBe("3,3");
    });

    it("uses the pace color", () => {
      const series: BudgetPaceSeries = { pace: PACE, current: CURRENT, previous: [] };
      const specs = buildPaceLineSpecs(series, COLORS);
      const pace = specs.find((s) => s.role === "pace")!;
      expect(pace.stroke).toBe(COLORS.pace);
    });
  });

  describe("current spec", () => {
    it("has strokeOpacity === 1 and strokeWidth === 2", () => {
      const series: BudgetPaceSeries = { pace: PACE, current: CURRENT, previous: [window(1)] };
      const specs = buildPaceLineSpecs(series, COLORS);
      const current = specs.find((s) => s.role === "current");
      expect(current).toBeDefined();
      expect(current!.strokeOpacity).toBe(1);
      expect(current!.strokeWidth).toBe(2);
    });

    it("uses the current color", () => {
      const series: BudgetPaceSeries = { pace: PACE, current: CURRENT, previous: [] };
      const specs = buildPaceLineSpecs(series, COLORS);
      const current = specs.find((s) => s.role === "current")!;
      expect(current.stroke).toBe(COLORS.current);
    });

    it("is the last spec in the array (rendered on top)", () => {
      const series: BudgetPaceSeries = { pace: PACE, current: CURRENT, previous: [window(1)] };
      const specs = buildPaceLineSpecs(series, COLORS);
      expect(specs[specs.length - 1].role).toBe("current");
    });
  });

  describe("prior window specs — clamping", () => {
    it("produces 0 prior specs when previous is empty", () => {
      const series: BudgetPaceSeries = { pace: PACE, current: CURRENT, previous: [] };
      const specs = buildPaceLineSpecs(series, COLORS);
      expect(specs.filter((s) => s.role === "previous")).toHaveLength(0);
    });

    it("produces exactly 3 prior specs when given 5 previous windows", () => {
      const five = [window(1), window(2), window(3), window(4), window(5)];
      const series: BudgetPaceSeries = { pace: PACE, current: CURRENT, previous: five };
      const specs = buildPaceLineSpecs(series, COLORS);
      const priors = specs.filter((s) => s.role === "previous");
      expect(priors).toHaveLength(3);
    });

    it("retains the 3 most recent windows (drops the 2 oldest) when given 5", () => {
      const five = [window(1), window(2), window(3), window(4), window(5)];
      const series: BudgetPaceSeries = { pace: PACE, current: CURRENT, previous: five };
      const specs = buildPaceLineSpecs(series, COLORS);
      const priors = specs.filter((s) => s.role === "previous");
      // Kept windows are 3, 4, 5 identified by their y values (id*10).
      expect(priors[0].points[0].y).toBeCloseTo(window(3)[0].y);
      expect(priors[1].points[0].y).toBeCloseTo(window(4)[0].y);
      expect(priors[2].points[0].y).toBeCloseTo(window(5)[0].y);
    });

    it("oldest kept window has lowest opacity, newest has highest", () => {
      const five = [window(1), window(2), window(3), window(4), window(5)];
      const series: BudgetPaceSeries = { pace: PACE, current: CURRENT, previous: five };
      const specs = buildPaceLineSpecs(series, COLORS);
      const priors = specs.filter((s) => s.role === "previous");
      // priors[0] = oldest kept (window 3), priors[2] = newest kept (window 5).
      expect(priors[0].strokeOpacity).toBeLessThan(priors[1].strokeOpacity);
      expect(priors[1].strokeOpacity).toBeLessThan(priors[2].strokeOpacity);
    });

    it("all prior strokeOpacity values are strictly in (0,1)", () => {
      const three = [window(1), window(2), window(3)];
      const series: BudgetPaceSeries = { pace: PACE, current: CURRENT, previous: three };
      const specs = buildPaceLineSpecs(series, COLORS);
      const priors = specs.filter((s) => s.role === "previous");
      for (const p of priors) {
        expect(p.strokeOpacity).toBeGreaterThan(0);
        expect(p.strokeOpacity).toBeLessThan(1);
      }
    });

    it("uses the prior color for all prior specs", () => {
      const series: BudgetPaceSeries = { pace: PACE, current: CURRENT, previous: [window(1)] };
      const specs = buildPaceLineSpecs(series, COLORS);
      const priors = specs.filter((s) => s.role === "previous");
      for (const p of priors) {
        expect(p.stroke).toBe(COLORS.prior);
      }
    });
  });

  describe("spec ordering", () => {
    it("pace comes first, then priors, then current", () => {
      const series: BudgetPaceSeries = { pace: PACE, current: CURRENT, previous: [window(1), window(2)] };
      const specs = buildPaceLineSpecs(series, COLORS);
      expect(specs[0].role).toBe("pace");
      expect(specs[1].role).toBe("previous");
      expect(specs[2].role).toBe("previous");
      expect(specs[3].role).toBe("current");
    });
  });
});
