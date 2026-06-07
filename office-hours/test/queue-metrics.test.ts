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
  };

  it("round-trips a full snapshot with a finite runwayDays", () => {
    const serialized = serializeQueueMetrics(base);
    const parsed = parseQueueMetrics(serialized);
    expect(parsed).toEqual(base);
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

  it("returns a valid snapshot when runwayDays field is absent (Firestore omits stored nulls)", () => {
    const serialized = serializeQueueMetrics({ ...base, runwayDays: null }) as Record<string, unknown>;
    delete serialized.runwayDays;
    const parsed = parseQueueMetrics(serialized);
    expect(parsed).not.toBeNull();
    expect(parsed!.runwayDays).toBeNull();
  });
});
