import { describe, it, expect } from "vitest";
import {
  fitBacklogRunway,
  runwayVerdict,
  type BacklogRunwayFit,
} from "../src/backlog-runway.js";
import type { IssueSample } from "../src/issue-samples.js";

const GROUP = "group-test";

function makeSample(sampledAt: Date, openHelpWanted: number): IssueSample {
  return { sampledAt, openHelpWanted, openOther: 5, groupId: GROUP };
}

// --- draining fixture: help-wanted 18 → 6 over ~7 days ---
const drainingFixture: IssueSample[] = [
  makeSample(new Date("2026-01-01T00:00:00Z"), 18),
  makeSample(new Date("2026-01-03T00:00:00Z"), 14),
  makeSample(new Date("2026-01-05T00:00:00Z"), 10),
  makeSample(new Date("2026-01-07T00:00:00Z"), 6),
];

// --- flat fixture: constant openHelpWanted ---
const flatFixture: IssueSample[] = [
  makeSample(new Date("2026-01-01T00:00:00Z"), 10),
  makeSample(new Date("2026-01-03T00:00:00Z"), 10),
  makeSample(new Date("2026-01-05T00:00:00Z"), 10),
];

// --- growing fixture: 5 → 15 over several days ---
const growingFixture: IssueSample[] = [
  makeSample(new Date("2026-01-01T00:00:00Z"), 5),
  makeSample(new Date("2026-01-04T00:00:00Z"), 10),
  makeSample(new Date("2026-01-07T00:00:00Z"), 15),
];

// --- empty fixture: latest sample has openHelpWanted === 0 ---
const emptyFixture: IssueSample[] = [
  makeSample(new Date("2026-01-01T00:00:00Z"), 5),
  makeSample(new Date("2026-01-07T00:00:00Z"), 0),
];

describe("fitBacklogRunway", () => {
  it("returns 'draining' when backlog is shrinking", () => {
    const fit = fitBacklogRunway(drainingFixture);
    expect(fit.state).toBe("draining");
    if (fit.state !== "draining") return;
    expect(fit.daysUntilEmpty).toBeGreaterThan(0);
    expect(isFinite(fit.daysUntilEmpty)).toBe(true);
  });

  it("draining: runwayVerdict text matches 'until the queue empties'", () => {
    const fit = fitBacklogRunway(drainingFixture);
    expect(fit.state).toBe("draining");
    const verdict = runwayVerdict(fit);
    expect(verdict.state).toBe("draining");
    expect(verdict.text).toMatch(/until the queue empties/);
  });

  it("returns 'stable' for a flat backlog", () => {
    const fit = fitBacklogRunway(flatFixture);
    expect(fit.state).toBe("stable");
    expect(runwayVerdict(fit)).toEqual({ text: "queue stable", state: "stable" });
  });

  it("returns 'growing' when backlog is increasing", () => {
    const fit = fitBacklogRunway(growingFixture);
    expect(fit.state).toBe("growing");
    // growing state has no daysUntilEmpty field
    expect("daysUntilEmpty" in fit).toBe(false);
    expect(runwayVerdict(fit)).toEqual({ text: "queue growing", state: "growing" });
  });

  it("returns 'empty' when latest sample has openHelpWanted === 0", () => {
    const fit = fitBacklogRunway(emptyFixture);
    expect(fit.state).toBe("empty");
    expect(runwayVerdict(fit)).toEqual({ text: "queue empty", state: "empty" });
  });

  it("returns 'insufficient' for a single sample", () => {
    const fit = fitBacklogRunway([makeSample(new Date("2026-01-01T00:00:00Z"), 10)]);
    expect(fit.state).toBe("insufficient");
    expect(runwayVerdict(fit)).toEqual({ text: "not enough data", state: "insufficient" });
  });

  it("returns 'insufficient' for an empty array", () => {
    const fit = fitBacklogRunway([]);
    expect(fit.state).toBe("insufficient");
  });

  it("never-negative guard: daysUntilEmpty >= 0 for a steep draining fixture", () => {
    const steepFixture: IssueSample[] = [
      makeSample(new Date("2026-01-01T00:00:00Z"), 100),
      makeSample(new Date("2026-01-02T00:00:00Z"), 50),
      makeSample(new Date("2026-01-03T00:00:00Z"), 5),
    ];
    const fit = fitBacklogRunway(steepFixture);
    expect(fit.state).toBe("draining");
    if (fit.state !== "draining") return;
    expect(fit.daysUntilEmpty).toBeGreaterThanOrEqual(0);
  });

  it("does not mutate the input array order", () => {
    const a = makeSample(new Date("2026-01-07T00:00:00Z"), 6);
    const b = makeSample(new Date("2026-01-01T00:00:00Z"), 18);
    const c = makeSample(new Date("2026-01-04T00:00:00Z"), 12);
    const samples = [a, b, c];

    fitBacklogRunway(samples);

    expect(samples[0]).toBe(a);
    expect(samples[1]).toBe(b);
    expect(samples[2]).toBe(c);
  });
});

describe("runwayVerdict", () => {
  it("formats singular 'day' when daysUntilEmpty rounds to 1", () => {
    const fit: BacklogRunwayFit = {
      state: "draining",
      daysUntilEmpty: 0.9,
      slope: -1,
      intercept: 10,
      crossingAt: new Date("2026-01-02T00:00:00Z"),
    };
    const { text } = runwayVerdict(fit);
    expect(text).toMatch(/~1 day until the queue empties/);
  });

  it("formats plural 'days' when daysUntilEmpty rounds to > 1", () => {
    const fit: BacklogRunwayFit = {
      state: "draining",
      daysUntilEmpty: 3.2,
      slope: -2,
      intercept: 20,
      crossingAt: new Date("2026-01-05T00:00:00Z"),
    };
    const { text } = runwayVerdict(fit);
    expect(text).toMatch(/~4 days until the queue empties/);
  });
});
