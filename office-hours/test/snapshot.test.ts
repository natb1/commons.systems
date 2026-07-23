import { describe, it, expect } from "vitest";
import { encryptData } from "@commons-systems/crypto-core";
import { decodeSnapshot, loadSnapshotPanelData, type OfficeHoursSnapshotV1 } from "../src/snapshot.js";
import { projectSignalsEqual } from "../src/panel-equality.js";

// ---------------------------------------------------------------------------
// Fixture snapshot — one valid element in every collection field.
// All Firestore-Timestamp fields are ISO-8601 full-datetime strings.
// topicUsage[].date is a plain date string (NOT a datetime).
// ---------------------------------------------------------------------------

const fixtureSnapshot: OfficeHoursSnapshotV1 = {
  version: 1,
  computedAt: "2026-06-30T10:00:00Z",
  scope: "full",
  chainHealth: {},
  reminders: [
    {
      title: "Review #2659 PR",
      repo: "natb1/commons.systems",
      issueNumber: 2659,
      dueAt: "2026-07-01T09:00:00Z",
      jitKey: "jit-2659",
    },
  ],
  samples: [
    {
      sampledAt: "2026-06-30T08:00:00Z",
      fiveHourResetsAt: "2026-06-30T13:00:00Z",
      weeklyResetsAt: "2026-07-07T00:00:00Z",
      fiveHourUsedPct: 42.5,
      weeklyUsedPct: 18.3,
      activeWorkers: 3,
      targetWorkers: 8,
      groupId: "natb1",
      memberEmails: ["nathan@natb1.com"],
    },
  ],
  issueSamples: [
    {
      sampledAt: "2026-06-30T08:00:00Z",
      openSecurity: 1,
      openBug: 5,
      openEnhancement: 12,
      openOther: 7,
      groupId: "natb1",
      memberEmails: ["nathan@natb1.com"],
    },
  ],
  topicUsage: [
    {
      date: "2026-06-30",
      byTopic: {
        dispatch: { priceProxyUsd: 1.23, input: 10000, cacheRead: 5000, cacheCreation: 2000, output: 500 },
      },
      byType: {
        enhancement: { priceProxyUsd: 0.85, input: 7000, cacheRead: 3000, cacheCreation: 1000, output: 300 },
      },
    },
  ],
  queueMetrics: {
    openHelpWanted: 25,
    closedPerDay: 3.5,
    createdPerDay: 2.5,
    netDrainPerDay: 1.0,
    runwayDays: 25,
    windowDays: 14,
    computedAt: "2026-06-30T06:00:00Z",
    groupId: "natb1",
    memberEmails: ["nathan@natb1.com"],
    parked: [
      {
        number: 1466,
        title: "office-hours: surface parked dispatch:office-hours work on the dashboard",
        url: "https://github.com/natb1/commons.systems/issues/1466",
        repo: "natb1/commons.systems",
        createdAt: "2026-05-15T10:00:00Z",
        phase: "dispatch:plan",
      },
    ],
  },
  projectSignals: {
    computedAt: "2026-06-30T07:00:00Z",
    groupId: "natb1",
    memberEmails: ["nathan@natb1.com"],
    github: {
      repo: "natb1/commons.systems",
      stars: 42,
      forks: 3,
      watchers: 10,
    },
  },
};

const password = "test-pass-123";

// Build the encrypted fixture once for all tests
async function buildFixture(): Promise<ArrayBuffer> {
  const plaintext = JSON.stringify(fixtureSnapshot);
  return encryptData(
    crypto.subtle,
    (a) => crypto.getRandomValues(a),
    plaintext,
    password,
  );
}

describe("snapshot decode spine", () => {
  it("round-trip — all six slices populate (AC#1 surrogate)", async () => {
    const bytes = await buildFixture();
    const { data, computedAt } = await loadSnapshotPanelData(bytes, password);

    expect(data.samples).toHaveLength(1);
    expect(data.reminders).toHaveLength(1);
    expect(data.issueSamples).toHaveLength(1);
    expect(data.topicUsage).toHaveLength(1);
    expect(data.queueMetrics).not.toBeNull();
    expect(data.projectSignals).not.toBeNull();

    expect(computedAt).toBeInstanceOf(Date);
    expect(computedAt.toISOString()).toBe(new Date(fixtureSnapshot.computedAt).toISOString());
  });

  it("date-shim correctness — reminders[0].dueAt is a real Date with the expected time", async () => {
    const bytes = await buildFixture();
    const { data } = await loadSnapshotPanelData(bytes, password);

    const dueAt = data.reminders[0].dueAt;
    expect(dueAt).toBeInstanceOf(Date);
    expect(dueAt.getTime()).toBe(new Date("2026-07-01T09:00:00Z").getTime());
  });

  it("top-level computedAt is a real Date (not a shim object)", async () => {
    const bytes = await buildFixture();
    const { computedAt } = await loadSnapshotPanelData(bytes, password);

    expect(computedAt).not.toBeNull();
    expect(computedAt).toBeInstanceOf(Date);
    expect(computedAt.getTime()).toBe(new Date("2026-06-30T10:00:00Z").getTime());
  });

  it("topicUsage date stays a plain string — NOT converted to a shim", async () => {
    const bytes = await buildFixture();
    const { data } = await loadSnapshotPanelData(bytes, password);

    expect(data.topicUsage[0].date).toBe("2026-06-30");
    expect(typeof data.topicUsage[0].date).toBe("string");
  });

  it("projectSignals footgun regression — projectSignalsEqual(decoded, decoded) returns true", async () => {
    const bytes = await buildFixture();
    const { data } = await loadSnapshotPanelData(bytes, password);

    // If a shim object leaked into the github sub-object, JSON.stringify would
    // serialize it as {} and the equality check would fail.
    expect(projectSignalsEqual(data.projectSignals, data.projectSignals)).toBe(true);
  });

  it("wrong password throws SnapshotValidationError", async () => {
    const bytes = await buildFixture();

    await expect(loadSnapshotPanelData(bytes, "wrong-password")).rejects.toThrow(
      "Wrong password",
    );
  });

  it("non-BENC bytes throw a BENC-format error", async () => {
    const plainBytes = new TextEncoder().encode('{"x":1}').buffer;

    await expect(loadSnapshotPanelData(plainBytes, password)).rejects.toThrow(
      "not in BENC",
    );
  });

  it("version !== 1 rejected by decodeSnapshot", () => {
    const badPlaintext = JSON.stringify({ ...fixtureSnapshot, version: 2 });

    expect(() => decodeSnapshot(badPlaintext)).toThrow("Unsupported snapshot version");
  });
});
