import { describe, it, expect } from "vitest";
import { serializeQueueMetrics, parseQueueMetrics } from "../src/queue-metrics.js";
import type { QueueMetricsSnapshot } from "../src/queue-metrics.js";

describe("serializeQueueMetrics / parseQueueMetrics", () => {
  const base: QueueMetricsSnapshot = {
    openHelpWanted: 48,
    closedPerDay: 4.5,
    createdPerDay: 2.5,
    netDrainPerDay: 2.0,
    runwayDays: 24,
    windowDays: 14,
    computedAt: new Date("2026-06-07T12:00:00Z"),
    groupId: "natb1",
    memberEmails: ["alice@example.com", "bob@example.com"],
    parked: [],
  };

  it("round-trips a full snapshot with a finite runwayDays", () => {
    const serialized = serializeQueueMetrics(base);
    const parsed = parseQueueMetrics(serialized);
    expect(parsed).toEqual(base);
  });

  it("round-trips the optional parked-only scope", () => {
    const snapshot: QueueMetricsSnapshot = {
      ...base,
      netDrainPerDay: 0,
      runwayDays: null,
      scope: "parked-only",
    };
    const serialized = serializeQueueMetrics(snapshot);
    expect(serialized.scope).toBe("parked-only");
    expect(parseQueueMetrics(serialized)).toEqual(snapshot);
  });

  it("omits scope entirely when absent (fully-measured metrics)", () => {
    const serialized = serializeQueueMetrics(base);
    expect("scope" in serialized).toBe(false);
    expect(parseQueueMetrics(serialized)).toEqual(base);
  });

  it("round-trips the runwayDays: null case (queue flat or growing)", () => {
    const snapshot: QueueMetricsSnapshot = {
      ...base,
      netDrainPerDay: 0,
      runwayDays: null,
    };
    const serialized = serializeQueueMetrics(snapshot);
    const parsed = parseQueueMetrics(serialized);
    expect(parsed).toEqual(snapshot);
  });

  it("parses a Firestore-shaped doc where computedAt is a Timestamp object", () => {
    const date = new Date("2026-06-07T08:30:00Z");
    const firestoreDoc: Record<string, unknown> = {
      ...serializeQueueMetrics(base),
      computedAt: { toDate: () => date },
    };
    const parsed = parseQueueMetrics(firestoreDoc);
    expect(parsed).not.toBeNull();
    expect(parsed!.computedAt).toBe(date);
    expect(parsed!.openHelpWanted).toBe(base.openHelpWanted);
    expect(parsed!.runwayDays).toBe(base.runwayDays);
    expect(parsed!.memberEmails).toEqual(base.memberEmails);
  });

  it("returns null for a doc missing a required field (openHelpWanted omitted)", () => {
    const { openHelpWanted: _omitted, ...rest } = serializeQueueMetrics(base);
    const parsed = parseQueueMetrics(rest);
    expect(parsed).toBeNull();
  });

  it("returns null for a non-numeric, non-null runwayDays", () => {
    const doc = { ...serializeQueueMetrics(base), runwayDays: "soon" };
    const parsed = parseQueueMetrics(doc);
    expect(parsed).toBeNull();
  });

  it("returns null for a negative runwayDays (violates the runwayDays >= 0 invariant)", () => {
    const doc = { ...serializeQueueMetrics(base), runwayDays: -5 };
    const parsed = parseQueueMetrics(doc);
    expect(parsed).toBeNull();
  });

  it("returns a valid snapshot when runwayDays field is absent (Firestore omits stored nulls)", () => {
    const serialized = serializeQueueMetrics({ ...base, netDrainPerDay: 0, runwayDays: null }) as Record<string, unknown>;
    delete serialized.runwayDays;
    const parsed = parseQueueMetrics(serialized);
    expect(parsed).not.toBeNull();
    expect(parsed!.runwayDays).toBeNull();
  });

  it("returns null for an inconsistent snapshot: netDrainPerDay > 0 with runwayDays null", () => {
    // base.netDrainPerDay is 2.0 (> 0); a null runwayDays violates the invariant.
    const doc = { ...serializeQueueMetrics(base), runwayDays: null };
    expect(parseQueueMetrics(doc)).toBeNull();
  });

  it("returns null for the symmetric inconsistency: runwayDays non-null with netDrainPerDay <= 0", () => {
    // base.runwayDays is 24 (non-null); netDrainPerDay 0 violates the invariant.
    const doc = { ...serializeQueueMetrics(base), netDrainPerDay: 0 };
    expect(parseQueueMetrics(doc)).toBeNull();
  });

  it("parses a doc with no parked field with parked: [] (back-compat regression guard)", () => {
    const doc = serializeQueueMetrics(base) as Record<string, unknown>; // type-safety-ok: test-only cast to mutate serialized doc before parsing
    delete doc.parked;
    const parsed = parseQueueMetrics(doc);
    expect(parsed).not.toBeNull();
    expect(parsed?.parked).toEqual([]);
  });

  it("skips malformed parked items while the core snapshot still parses", () => {
    const doc: Record<string, unknown> = {
      ...serializeQueueMetrics(base),
      parked: [
        // missing required url field
        { number: 42, title: "broken item", repo: "natb1/commons.systems", createdAt: new Date("2026-06-01T00:00:00Z") },
        // valid item
        { number: 99, title: "valid item", url: "https://github.com/natb1/commons.systems/issues/99", repo: "natb1/commons.systems", createdAt: new Date("2026-06-02T00:00:00Z") },
      ],
    };
    const parsed = parseQueueMetrics(doc);
    expect(parsed).not.toBeNull();
    expect(parsed?.parked).toHaveLength(1);
    expect(parsed?.parked[0].number).toBe(99);
  });

  it("round-trips a snapshot with a non-empty parked array", () => {
    const createdAt = new Date("2026-05-15T10:00:00Z");
    const snapshot: QueueMetricsSnapshot = {
      ...base,
      parked: [
        {
          number: 1466,
          title: "office-hours: surface parked dispatch:office-hours work on the dashboard",
          url: "https://github.com/natb1/commons.systems/issues/1466",
          createdAt,
          repo: "natb1/commons.systems",
          phase: "dispatch:plan",
        },
      ],
    };
    const serialized = serializeQueueMetrics(snapshot);
    const parsed = parseQueueMetrics(serialized);
    expect(parsed).not.toBeNull();
    expect(parsed?.parked).toHaveLength(1);
    expect(parsed?.parked[0].number).toBe(1466);
    expect(parsed?.parked[0].title).toBe("office-hours: surface parked dispatch:office-hours work on the dashboard");
    expect(parsed?.parked[0].url).toBe("https://github.com/natb1/commons.systems/issues/1466");
    expect(parsed?.parked[0].createdAt).toEqual(createdAt);
    expect(parsed?.parked[0].repo).toBe("natb1/commons.systems");
    expect(parsed?.parked[0].phase).toBe("dispatch:plan");
  });
});
