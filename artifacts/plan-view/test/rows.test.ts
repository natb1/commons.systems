import { describe, expect, it } from "vitest";
import { buildRows, etaFor, labelsFor, unavailableReason } from "../src/rows.js";
import type { Velocity } from "../src/model.js";
import { boost, kindNodes, strategy, tactic } from "./fixtures.js";

const VELOCITY: Velocity = { perDay: 2, windowDays: 28, closures: 56, created: 60 };
const TODAY = new Date("2026-08-13T00:00:00Z");

describe("etaFor", () => {
  it("renders a date from a live queue", () => {
    expect(etaFor(4, VELOCITY, TODAY)).toBe("2026-08-15");
  });

  it("renders NO date from a paused queue", () => {
    // A zero closure rate has no finite answer. Returning a date from a stalled
    // queue would be the most misleading thing this column could do.
    const paused: Velocity = { ...VELOCITY, perDay: 0, closures: 0 };
    expect(etaFor(4, paused, TODAY)).toBeNull();
  });
});

describe("labelsFor", () => {
  it("renders BOTH delegated and parked when both hold", () => {
    // They are independent facts, not alternatives — 53 nodes in the live store
    // carry both.
    const node = tactic("tactic-a", {
      owner: "ai",
      office_hours: { reason: "held", since: "2026-08-01" },
    });
    expect(labelsFor(node, false)).toEqual(["parked", "delegated"]);
  });

  it("keeps the bug chip alongside the tier it derives", () => {
    const node = tactic("tactic-b", { owner: "human", attributes: { bug_fix: true } });
    expect(labelsFor(node, false)).toEqual(["bug"]);
  });
});

describe("unavailableReason", () => {
  const byId = new Map([["tactic-blocker", tactic("tactic-blocker", { phase: "implement" })]]);

  it("reports parked BEFORE blocked", () => {
    // A parked node is withheld deliberately; reporting it as blocked would read
    // as a graph problem rather than an author decision.
    const node = tactic("tactic-a", {
      office_hours: { reason: "held", since: "2026-08-01" },
      blocked_by: ["tactic-blocker"],
    });
    expect(unavailableReason(node, byId, new Set())).toEqual({ kind: "parked" });
  });

  it("names the open blockers", () => {
    const node = tactic("tactic-a", { blocked_by: ["tactic-blocker"] });
    expect(unavailableReason(node, byId, new Set())).toEqual({
      kind: "blocked",
      by: ["tactic-blocker"],
    });
  });

  it("reports a container", () => {
    const node = tactic("tactic-a");
    expect(unavailableReason(node, byId, new Set(["tactic-a"]))).toEqual({ kind: "container" });
  });
});

describe("buildRows", () => {
  const graph = () => [
    ...kindNodes(),
    strategy("strategy-hot", { attention: boost(10) }),
    tactic("tactic-open", { serves: ["strategy-hot"], phase: "implement" }),
    tactic("tactic-parked", {
      serves: ["strategy-hot"],
      office_hours: { reason: "held", since: "2026-08-01" },
    }),
    tactic("tactic-later", { serves: ["strategy-hot"] }),
    tactic("tactic-done", { serves: ["strategy-hot"], phase: "done" }),
  ];

  it("omits done tactics and keeps every other phase", () => {
    const rows = buildRows({ nodes: graph(), velocity: VELOCITY, today: TODAY });
    expect(rows.map((r) => r.id)).not.toContain("tactic-done");
    expect(rows.map((r) => r.id).sort()).toEqual([
      "tactic-later",
      "tactic-open",
      "tactic-parked",
    ]);
  });

  it("gives every row either a date or a typed reason, never a blank", () => {
    const rows = buildRows({ nodes: graph(), velocity: VELOCITY, today: TODAY });
    for (const row of rows) {
      if (row.position === null) {
        expect(row.eta).toBeNull();
        expect(row.reason).not.toBeNull();
      } else {
        expect(row.eta).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(row.reason).toBeNull();
      }
    }
  });

  it("does not let a parked row inflate any other row's ETA", () => {
    // The check that parked rows were excluded from the POSITION COUNTER rather
    // than merely blanked in the ETA column. Removing one must move nothing.
    const withParked = buildRows({ nodes: graph(), velocity: VELOCITY, today: TODAY });
    const withoutParked = buildRows({
      nodes: graph().filter((n) => n.id !== "tactic-parked"),
      velocity: VELOCITY,
      today: TODAY,
    });
    const etas = (rows: ReturnType<typeof buildRows>) =>
      Object.fromEntries(
        rows.filter((r) => r.position !== null).map((r) => [r.id, `${r.position}:${r.eta}`]),
      );
    expect(etas(withoutParked)).toEqual(etas(withParked));
  });

  it("marks a parked row rather than dropping it", () => {
    const rows = buildRows({ nodes: graph(), velocity: VELOCITY, today: TODAY });
    const parked = rows.find((r) => r.id === "tactic-parked");
    expect(parked?.labels).toContain("parked");
    expect(parked?.reason).toEqual({ kind: "parked" });
  });

  it("carries the serving strategy as the band spine", () => {
    const rows = buildRows({ nodes: graph(), velocity: VELOCITY, today: TODAY });
    expect(rows.find((r) => r.id === "tactic-open")?.spine).toEqual(["strategy-hot"]);
  });
});
