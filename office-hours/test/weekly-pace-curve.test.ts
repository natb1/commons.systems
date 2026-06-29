import { describe, it, expect } from "vitest";
import {
  weeklyPaceCurve,
  elapsedWeekFraction,
  paceCurveAtFraction,
  fractionToWindowDate,
  formatWindowTick,
  WEEK_SECONDS,
  WINDOW_SECONDS,
  T,
  FLOOR,
  SHOULDER,
  TERMINAL_WINDOWS,
} from "../src/weekly-pace-curve.js";

// A fixed weekly-reset anchor. Each test picks a `sampledAt` at a known offset
// BEFORE this reset so the offset (in seconds) is exactly `remaining`.
const RESET = new Date("2026-06-14T00:00:00Z");

/** sampledAt placed `remainingSeconds` before RESET. */
const at = (remainingSeconds: number): Date =>
  new Date(RESET.getTime() - remainingSeconds * 1000);

describe("weeklyPaceCurve constants", () => {
  it("derives T = 604800 / 18000 = 33.6 (exact)", () => {
    expect(WEEK_SECONDS).toBe(604800);
    expect(WINDOW_SECONDS).toBe(18000);
    expect(T).toBeCloseTo(33.6, 10);
  });

  it("floor, shoulder, and terminal_windows match defaults", () => {
    expect(FLOOR).toBe(50);
    expect(SHOULDER).toBe(80);
    expect(TERMINAL_WINDOWS).toBe(2);
  });
});

describe("weeklyPaceCurve", () => {
  it("returns exactly 0 when the weekly window has already reset", () => {
    // sampledAt == reset → remaining = 0 → early 0.
    expect(weeklyPaceCurve(RESET, RESET)).toBe(0);
    // sampledAt after reset → remaining < 0 → 0.
    expect(weeklyPaceCurve(at(-WINDOW_SECONDS), RESET)).toBe(0);
  });

  it("returns 50 at x=0 (sampledAt one full week before reset)", () => {
    // remaining = WEEK_SECONDS → x = 0, r = 33.6, s = 0.
    // rise = 50 + 30*0 = 50. terminal_seg = 100 - 10*33.6 = -236. W = max(50, -236, 50) = 50.
    expect(weeklyPaceCurve(at(WEEK_SECONDS), RESET)).toBeCloseTo(50, 6);
  });

  it("clamps x to 0 when sampledAt is more than a full week before reset", () => {
    // remaining = 2*WEEK → (WEEK - 2*WEEK)/WEEK = -1, clamps to 0 → same as x=0 → W = 50.
    expect(weeklyPaceCurve(at(2 * WEEK_SECONDS), RESET)).toBeCloseTo(50, 6);
  });

  it("returns the rise-segment value mid-week (x=0.5)", () => {
    // remaining = half a week → r = 16.8, s = (33.6-16.8)/(33.6-2) = 16.8/31.6 ≈ 0.5316.
    // rise = 50 + 30*0.5316 = 65.95. terminal_seg = 100 - 10*16.8 = -68. W = 65.95.
    expect(weeklyPaceCurve(at(WEEK_SECONDS / 2), RESET)).toBeCloseTo(65.95, 2);
  });

  it("follows the terminal segment near the reset", () => {
    // At r=1 (remaining = 18000s): terminal_seg = 100 - 10*1 = 90. rise = 80 (s=1). W = 90.
    expect(weeklyPaceCurve(at(WINDOW_SECONDS), RESET)).toBeCloseTo(90.0, 6);

    // As remaining → 0+: terminal_seg → 100, r ≈ 0.0000556, W ≈ 100.
    expect(weeklyPaceCurve(at(1), RESET)).toBeCloseTo(100.0, 2);
  });

  it("rises monotonically as the week elapses", () => {
    // Earlier in the week (more remaining) → lower W; later → higher W.
    const early = weeklyPaceCurve(at(WEEK_SECONDS * 0.75), RESET);
    const mid = weeklyPaceCurve(at(WEEK_SECONDS * 0.5), RESET);
    const late = weeklyPaceCurve(at(WEEK_SECONDS * 0.25), RESET);
    expect(early).toBeLessThan(mid);
    expect(mid).toBeLessThan(late);
  });
});

describe("elapsedWeekFraction", () => {
  it("is 0 a full week before the reset", () => {
    // remaining = WEEK_SECONDS → (WEEK - WEEK)/WEEK = 0.
    expect(elapsedWeekFraction(at(WEEK_SECONDS), RESET)).toBe(0);
  });

  it("is 0.5 half a week before the reset", () => {
    expect(elapsedWeekFraction(at(WEEK_SECONDS / 2), RESET)).toBeCloseTo(0.5, 12);
  });

  it("is 1 at the reset", () => {
    // remaining = 0 → (WEEK - 0)/WEEK = 1.
    expect(elapsedWeekFraction(at(0), RESET)).toBe(1);
  });

  it("clamps to 0 when remaining exceeds a full week", () => {
    // remaining = 2*WEEK → (WEEK - 2*WEEK)/WEEK = -1, clamps to 0.
    expect(elapsedWeekFraction(at(2 * WEEK_SECONDS), RESET)).toBe(0);
  });

  it("clamps to 1 when remaining is negative (sampled past the reset)", () => {
    // remaining < 0 → (WEEK - remaining)/WEEK > 1, clamps to 1.
    expect(elapsedWeekFraction(at(-WINDOW_SECONDS), RESET)).toBe(1);
  });
});

describe("fractionToWindowDate", () => {
  it("f=0 is exactly one full week before the reset (window start)", () => {
    expect(fractionToWindowDate(0, RESET).getTime()).toBe(
      RESET.getTime() - WEEK_SECONDS * 1000,
    );
  });

  it("f=1 is the reset itself", () => {
    expect(fractionToWindowDate(1, RESET).getTime()).toBe(RESET.getTime());
  });

  it("f=0.5 is the half-week midpoint", () => {
    expect(fractionToWindowDate(0.5, RESET).getTime()).toBe(
      RESET.getTime() - 0.5 * WEEK_SECONDS * 1000,
    );
  });
});

describe("paceCurveAtFraction", () => {
  it("matches the rise-segment mid-week value at x=0.5", () => {
    // r=16.8, s≈0.5316, rise=65.95, terminal_seg=-68 → W=65.95.
    expect(paceCurveAtFraction(0.5)).toBeCloseTo(65.95, 2);
  });

  it("matches the canonical curve table at representative x-values", () => {
    // x=0.00: r=33.6, s=0, rise=50, terminal_seg=-236 → W=50.
    expect(paceCurveAtFraction(0.00)).toBeCloseTo(50, 2);
    // x=0.25: r=25.2, s≈0.2658, rise≈57.97, terminal_seg=-152 → W≈57.97.
    expect(paceCurveAtFraction(0.25)).toBeCloseTo(57.97, 2);
    // x=0.75: r=8.4, s≈0.7975, rise≈73.92, terminal_seg=16 → W≈73.92.
    expect(paceCurveAtFraction(0.75)).toBeCloseTo(73.92, 2);
    // x=0.90: r=3.36, s≈0.9570, rise≈78.71, terminal_seg=66.4 → W≈78.71.
    expect(paceCurveAtFraction(0.90)).toBeCloseTo(78.71, 2);
    // r=2 → x = 1 - 2/33.6 ≈ 0.940476: rise=80 (s=1), terminal_seg=80 → W=80.
    expect(paceCurveAtFraction(1 - 2 / T)).toBeCloseTo(80, 2);
    // r=1 → x = 1 - 1/33.6 ≈ 0.970238: rise=80 (s=1), terminal_seg=90 → W=90.
    expect(paceCurveAtFraction(1 - 1 / T)).toBeCloseTo(90, 2);
  });

  it("recomposes weeklyPaceCurve via elapsedWeekFraction (remaining > 0)", () => {
    // For several samples within the week, the decomposition must reproduce
    // weeklyPaceCurve exactly.
    const offsets = [
      WEEK_SECONDS * 0.9,
      WEEK_SECONDS * 0.75,
      WEEK_SECONDS * 0.5,
      WEEK_SECONDS * 0.25,
      WINDOW_SECONDS,
      1,
    ];
    for (const offset of offsets) {
      const s = at(offset);
      expect(paceCurveAtFraction(elapsedWeekFraction(s, RESET))).toBe(
        weeklyPaceCurve(s, RESET),
      );
    }
  });
});
