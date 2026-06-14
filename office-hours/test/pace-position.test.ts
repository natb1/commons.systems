import { describe, it, expect } from "vitest";
import { segmentByWeek, aheadBehindDelta, paceBackdrop } from "../src/pace-position.js";
import { type UsageSample } from "../src/usage-samples.js";
import { weeklyPaceCurve, WEEK_SECONDS } from "../src/weekly-pace-curve.js";

// Two distinct weekly windows:
//   RESET_A  — the earlier week resets on 2026-06-14T00:00:00Z
//   RESET_B  — the current week resets on 2026-06-21T00:00:00Z
const RESET_A = new Date("2026-06-14T00:00:00Z");
const RESET_B = new Date("2026-06-21T00:00:00Z");

const baseSample: UsageSample = {
  sampledAt: new Date("2026-06-07T12:00:00Z"),
  fiveHourUsedPct: 30,
  weeklyUsedPct: 20,
  fiveHourResetsAt: new Date("2026-06-07T17:00:00Z"),
  weeklyResetsAt: RESET_A,
  activeWorkers: 2,
  targetWorkers: 3,
  groupId: "grp-test",
};

const make = (o: Partial<UsageSample> = {}): UsageSample => ({ ...baseSample, ...o });

// Helper: a sampledAt that is `remainingSeconds` before a given reset, giving
// a well-defined x = (WEEK_SECONDS - remainingSeconds) / WEEK_SECONDS.
const atBefore = (reset: Date, remainingSeconds: number): Date =>
  new Date(reset.getTime() - remainingSeconds * 1000);

describe("segmentByWeek", () => {
  it("returns [] for an empty input", () => {
    expect(segmentByWeek([])).toEqual([]);
  });

  it("produces two segments for a two-week trail", () => {
    const s1 = make({
      sampledAt: atBefore(RESET_A, WEEK_SECONDS * 0.5), // mid-week A
      weeklyResetsAt: RESET_A,
    });
    const s2 = make({
      sampledAt: atBefore(RESET_B, WEEK_SECONDS * 0.5), // mid-week B
      weeklyResetsAt: RESET_B,
    });

    const segments = segmentByWeek([s1, s2]);
    expect(segments).toHaveLength(2);
  });

  it("orders segments by weeklyResetsAt ascending", () => {
    const s1 = make({ sampledAt: atBefore(RESET_A, WEEK_SECONDS * 0.3), weeklyResetsAt: RESET_A });
    const s2 = make({ sampledAt: atBefore(RESET_B, WEEK_SECONDS * 0.3), weeklyResetsAt: RESET_B });

    // Pass in reverse order to confirm sorting, not input order.
    const segments = segmentByWeek([s2, s1]);
    expect(segments[0].weeklyResetsAt.getTime()).toBe(RESET_A.getTime());
    expect(segments[1].weeklyResetsAt.getTime()).toBe(RESET_B.getTime());
  });

  it("flags only the segment with the latest weeklyResetsAt as isCurrent", () => {
    const s1 = make({ sampledAt: atBefore(RESET_A, WEEK_SECONDS * 0.5), weeklyResetsAt: RESET_A });
    const s2 = make({ sampledAt: atBefore(RESET_B, WEEK_SECONDS * 0.5), weeklyResetsAt: RESET_B });

    const segments = segmentByWeek([s1, s2]);
    expect(segments[0].isCurrent).toBe(false); // RESET_A is earlier
    expect(segments[1].isCurrent).toBe(true);  // RESET_B is the latest
  });

  it("sorts points within a segment ascending by sampledAt", () => {
    // Three samples in RESET_B's window, passed out of time order.
    const early = make({ sampledAt: atBefore(RESET_B, WEEK_SECONDS * 0.7), weeklyResetsAt: RESET_B });
    const mid   = make({ sampledAt: atBefore(RESET_B, WEEK_SECONDS * 0.5), weeklyResetsAt: RESET_B });
    const late  = make({ sampledAt: atBefore(RESET_B, WEEK_SECONDS * 0.2), weeklyResetsAt: RESET_B });

    const segments = segmentByWeek([late, early, mid]);
    expect(segments).toHaveLength(1);
    const { points } = segments[0];
    expect(points[0].sampledAt.getTime()).toBe(early.sampledAt.getTime());
    expect(points[1].sampledAt.getTime()).toBe(mid.sampledAt.getTime());
    expect(points[2].sampledAt.getTime()).toBe(late.sampledAt.getTime());
  });

  it("points within a segment have monotonically increasing x", () => {
    const s1 = make({ sampledAt: atBefore(RESET_B, WEEK_SECONDS * 0.7), weeklyResetsAt: RESET_B });
    const s2 = make({ sampledAt: atBefore(RESET_B, WEEK_SECONDS * 0.5), weeklyResetsAt: RESET_B });
    const s3 = make({ sampledAt: atBefore(RESET_B, WEEK_SECONDS * 0.2), weeklyResetsAt: RESET_B });

    const segments = segmentByWeek([s3, s1, s2]);
    const xs = segments[0].points.map((p) => p.x);
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i]).toBeGreaterThan(xs[i - 1]);
    }
  });

  it("does not mutate the input array", () => {
    const s1 = make({ sampledAt: atBefore(RESET_A, WEEK_SECONDS * 0.6), weeklyResetsAt: RESET_A });
    const s2 = make({ sampledAt: atBefore(RESET_B, WEEK_SECONDS * 0.4), weeklyResetsAt: RESET_B });
    const input = [s1, s2];
    const before = input.slice();

    segmentByWeek(input);

    expect(input[0]).toBe(before[0]);
    expect(input[1]).toBe(before[1]);
  });

  it("groups multiple samples sharing a weeklyResetsAt into one segment", () => {
    const sA1 = make({ sampledAt: atBefore(RESET_A, WEEK_SECONDS * 0.8), weeklyResetsAt: RESET_A });
    const sA2 = make({ sampledAt: atBefore(RESET_A, WEEK_SECONDS * 0.4), weeklyResetsAt: RESET_A });
    const sB1 = make({ sampledAt: atBefore(RESET_B, WEEK_SECONDS * 0.6), weeklyResetsAt: RESET_B });

    const segments = segmentByWeek([sB1, sA2, sA1]);
    expect(segments).toHaveLength(2);
    // RESET_A segment has 2 points, RESET_B has 1.
    expect(segments[0].points).toHaveLength(2);
    expect(segments[1].points).toHaveLength(1);
  });
});

describe("aheadBehindDelta", () => {
  it("returns a positive delta when weeklyUsedPct exceeds W(x)", () => {
    // At x ≈ 0.5, W ≈ 31. Setting weeklyUsedPct = 50 means delta ≈ +19.
    const sampledAt = atBefore(RESET_B, WEEK_SECONDS * 0.5);
    const sample = make({ sampledAt, weeklyResetsAt: RESET_B, weeklyUsedPct: 50 });

    const delta = aheadBehindDelta(sample);
    expect(delta).toBeGreaterThan(0);
  });

  it("returns a negative delta when weeklyUsedPct is below W(x)", () => {
    // At x ≈ 0.5, W ≈ 31. Setting weeklyUsedPct = 10 means delta ≈ −21.
    const sampledAt = atBefore(RESET_B, WEEK_SECONDS * 0.5);
    const sample = make({ sampledAt, weeklyResetsAt: RESET_B, weeklyUsedPct: 10 });

    const delta = aheadBehindDelta(sample);
    expect(delta).toBeLessThan(0);
  });

  it("equals weeklyUsedPct - weeklyPaceCurve(sampledAt, weeklyResetsAt) exactly", () => {
    const sampledAt = atBefore(RESET_B, WEEK_SECONDS * 0.5);
    const sample = make({ sampledAt, weeklyResetsAt: RESET_B, weeklyUsedPct: 50 });

    const expected = sample.weeklyUsedPct - weeklyPaceCurve(sample.sampledAt, sample.weeklyResetsAt);
    expect(aheadBehindDelta(sample)).toBeCloseTo(expected, 12);
  });

  it("equals weeklyUsedPct - weeklyPaceCurve for a below-pace sample", () => {
    const sampledAt = atBefore(RESET_B, WEEK_SECONDS * 0.25);
    const sample = make({ sampledAt, weeklyResetsAt: RESET_B, weeklyUsedPct: 10 });

    const expected = sample.weeklyUsedPct - weeklyPaceCurve(sample.sampledAt, sample.weeklyResetsAt);
    expect(aheadBehindDelta(sample)).toBeCloseTo(expected, 12);
  });
});

describe("paceBackdrop", () => {
  it("default steps=100 yields 101 points", () => {
    expect(paceBackdrop()).toHaveLength(101);
  });

  it("custom steps=10 yields 11 points", () => {
    expect(paceBackdrop(10)).toHaveLength(11);
  });

  it("first point has x === 0", () => {
    const points = paceBackdrop();
    expect(points[0].x).toBe(0);
  });

  it("last point has x === 1", () => {
    const points = paceBackdrop();
    expect(points[points.length - 1].x).toBe(1);
  });

  it("w is monotonically non-decreasing across all points", () => {
    const points = paceBackdrop();
    for (let i = 1; i < points.length; i++) {
      expect(points[i].w).toBeGreaterThanOrEqual(points[i - 1].w);
    }
  });

  it("x values are evenly spaced from 0 to 1", () => {
    const steps = 10;
    const points = paceBackdrop(steps);
    for (let i = 0; i <= steps; i++) {
      expect(points[i].x).toBeCloseTo(i / steps, 12);
    }
  });
});
