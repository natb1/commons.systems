import { describe, it, expect } from "vitest";
import {
  weeklyPaceCurve,
  WEEK_SECONDS,
  WINDOW_SECONDS,
  T,
  END,
  FLOOR,
} from "../src/weekly-pace-curve.js";

// A fixed weekly-reset anchor. Each test picks a `sampledAt` at a known offset
// BEFORE this reset so the offset (in seconds) is exactly `remaining`.
const RESET = new Date("2026-06-14T00:00:00Z");

/** sampledAt placed `remainingSeconds` before RESET. */
const at = (remainingSeconds: number): Date =>
  new Date(RESET.getTime() - remainingSeconds * 1000);

describe("weeklyPaceCurve constants", () => {
  it("derives T = round(604800 / 18000) = 34", () => {
    expect(WEEK_SECONDS).toBe(604800);
    expect(WINDOW_SECONDS).toBe(18000);
    expect(T).toBe(34);
  });

  it("computes end = 1 + 2*(90/34 - 1) = 4.2941... (not the plan's 3.29)", () => {
    // end = FLOOR + (POWER+1)*(TARGET_WEEKLY/T - FLOOR), clamped at CAP.
    //     = 1 + 2*(90/34 - 1) = 1 + 2*1.6470588... = 4.2941176...
    expect(END).toBeCloseTo(4.2941176471, 6);
    expect(FLOOR).toBe(1);
  });
});

describe("weeklyPaceCurve", () => {
  it("returns exactly 0 when the weekly window has already reset", () => {
    // sampledAt == reset → remaining = 0 → early 0.
    expect(weeklyPaceCurve(RESET, RESET)).toBe(0);
    // sampledAt after reset → remaining < 0 → 0.
    expect(weeklyPaceCurve(at(-WINDOW_SECONDS), RESET)).toBe(0);
  });

  it("returns 0 at x=0 (sampledAt one full week before reset)", () => {
    // remaining = WEEK_SECONDS → x = (WEEK_SECONDS - WEEK_SECONDS)/WEEK = 0.
    // Smooth term: T*(FLOOR*0 + (END-FLOOR)*0/2) = 0.
    // Envelope: 100 - 10*(604800/18000) = 100 - 10*33.6 = 100 - 336 = -236.
    // max(0, -236) = 0.
    expect(weeklyPaceCurve(at(WEEK_SECONDS), RESET)).toBe(0);
  });

  it("clamps x to 0 when sampledAt is more than a full week before reset", () => {
    // remaining = 2*WEEK → (WEEK - 2*WEEK)/WEEK = -1, clamps to 0 → same as x=0.
    // Envelope is even more negative, so still 0.
    expect(weeklyPaceCurve(at(2 * WEEK_SECONDS), RESET)).toBe(0);
  });

  it("returns the smooth-curve value mid-week (x=0.5)", () => {
    // remaining = half a week = 302400 → x = 0.5.
    // W = 34*(1*0.5 + (4.2941176-1)*0.5^2/2)
    //   = 34*(0.5 + 3.2941176*0.25/2)
    //   = 34*(0.5 + 0.4117647) = 34*0.9117647 = 31.0
    // Envelope = 100 - 10*(302400/18000) = 100 - 168 = -68 (loses).
    expect(weeklyPaceCurve(at(WEEK_SECONDS / 2), RESET)).toBeCloseTo(31.0, 6);
  });

  it("is dominated by the terminal envelope near the reset", () => {
    // r = remaining / WINDOW_SECONDS (windows left).
    // At r=1 (remaining = 18000s): envelope = 100 - 10*1 = 90. The smooth
    // curve at x ≈ 0.97 is below 90, so the envelope wins.
    expect(weeklyPaceCurve(at(WINDOW_SECONDS), RESET)).toBeCloseTo(90.0, 6);

    // As remaining → 0+, envelope → 100 - 0 = 100 (W(1) = WEEKLY_TERMINAL).
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
