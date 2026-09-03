import { describe, expect, it } from "vitest";
import type { IntentionNode } from "../src/schema.js";
import {
  challengeState,
  parseParticipationLog,
  participationSummary,
} from "../src/participation.js";

/** Build a full IntentionNode fixture, filling required/default fields. */
function anode(partial: Partial<IntentionNode> & { id: string; kind: string }): IntentionNode {
  return {
    id: partial.id,
    kind: partial.kind,
    statement: partial.statement ?? `Statement for ${partial.id}`,
    owner: partial.owner ?? "human",
    status: partial.status ?? "raw",
    parent: partial.parent ?? null,
    serves: partial.serves ?? [],
    recovers: partial.recovers ?? [],
    rationale: partial.rationale ?? null,
    reading: partial.reading ?? null,
    gap: partial.gap ?? null,
    clarifications: partial.clarifications ?? [],
    tooling_goals: partial.tooling_goals ?? [],
    success_signal: partial.success_signal ?? null,
    attention: partial.attention ?? null,
    phase: partial.phase ?? null,
    execution: partial.execution ?? null,
    validates: partial.validates ?? [],
    blocked_by: partial.blocked_by ?? [],
    office_hours: partial.office_hours ?? null,
    pace_exempt: partial.pace_exempt ?? false,
    rounds: partial.rounds ?? null,
    attributes: partial.attributes ?? {},
  };
}

/** A strategy fixture carrying `attributes.participation_log`. */
function strategyNode(participationLog: unknown): IntentionNode {
  return anode({
    id: "strategy-join-existing-practice",
    kind: "strategy",
    attributes: { participation_log: participationLog },
  });
}

describe("parseParticipationLog", () => {
  it("returns an honest zero when the attribute is absent", () => {
    const node = anode({ id: "strategy-join-existing-practice", kind: "strategy" });
    expect(parseParticipationLog(node)).toEqual({ entries: [], malformed: [] });
  });

  it("returns an honest zero for an empty list", () => {
    const node = strategyNode([]);
    expect(parseParticipationLog(node)).toEqual({ entries: [], malformed: [] });
  });

  it("parses well-formed entries given out of order, sorted by date ascending", () => {
    const node = strategyNode([
      { date: "2026-03-15", venue: "IndieWeb meetup", activity: "talk", challenge: null },
      { date: "2026-01-10", venue: "local-first chat", activity: "discussion", challenge: "why not CRDTs" },
      { date: "2026-02-20", venue: "IndieWeb meetup", activity: "workshop", challenge: null },
    ]);
    const { entries, malformed } = parseParticipationLog(node);
    expect(malformed).toEqual([]);
    expect(entries.map((e) => e.date)).toEqual(["2026-01-10", "2026-02-20", "2026-03-15"]);
  });

  it("flags a non-array attribute as malformed and returns no entries", () => {
    const node = strategyNode({ not: "an array" });
    const { entries, malformed } = parseParticipationLog(node);
    expect(entries).toEqual([]);
    expect(malformed).toHaveLength(1);
    expect(malformed[0]).toMatch(/expected an array/);
  });

  it("flags an entry missing venue, keeps parsing the rest", () => {
    const node = strategyNode([
      { date: "2026-01-10", activity: "discussion", challenge: null },
      { date: "2026-02-20", venue: "IndieWeb meetup", activity: "workshop", challenge: null },
    ]);
    const { entries, malformed } = parseParticipationLog(node);
    expect(entries).toHaveLength(1);
    expect(entries[0].date).toBe("2026-02-20");
    expect(malformed).toHaveLength(1);
    expect(malformed[0]).toMatch(/entry 0.*venue/);
  });

  it("flags an entry with a non-string date, keeps parsing the rest", () => {
    const node = strategyNode([
      { date: 20260110, venue: "local-first chat", activity: "discussion", challenge: null },
      { date: "2026-02-20", venue: "IndieWeb meetup", activity: "workshop", challenge: null },
    ]);
    const { entries, malformed } = parseParticipationLog(node);
    expect(entries).toHaveLength(1);
    expect(entries[0].date).toBe("2026-02-20");
    expect(malformed).toHaveLength(1);
    expect(malformed[0]).toMatch(/entry 0.*date/);
  });

  it("defaults a missing challenge field to null without flagging malformed", () => {
    const node = strategyNode([
      { date: "2026-01-10", venue: "local-first chat", activity: "discussion" },
    ]);
    const { entries, malformed } = parseParticipationLog(node);
    expect(malformed).toEqual([]);
    expect(entries).toHaveLength(1);
    expect(entries[0].challenge).toBeNull();
  });
});

describe("participationSummary", () => {
  it("returns the empty-log shape when there are no entries", () => {
    expect(participationSummary([], "2026-07-16")).toEqual({
      count: 0,
      firstDate: null,
      lastDate: null,
      distinctVenues: 0,
      last30Days: 0,
      last90Days: 0,
    });
  });

  it("computes count, first/last date, and distinct venues", () => {
    const { entries } = parseParticipationLog(
      strategyNode([
        { date: "2026-01-10", venue: "local-first chat", activity: "discussion", challenge: null },
        { date: "2026-03-15", venue: "IndieWeb meetup", activity: "talk", challenge: null },
        { date: "2026-02-20", venue: "local-first chat", activity: "workshop", challenge: null },
      ]),
    );
    const summary = participationSummary(entries, "2026-07-16");
    expect(summary.count).toBe(3);
    expect(summary.firstDate).toBe("2026-01-10");
    expect(summary.lastDate).toBe("2026-03-15");
    expect(summary.distinctVenues).toBe(2);
  });

  it("counts an entry exactly 30 days before today inside the last30Days window", () => {
    const { entries } = parseParticipationLog(
      strategyNode([
        { date: "2026-06-16", venue: "IndieWeb meetup", activity: "talk", challenge: null },
      ]),
    );
    const summary = participationSummary(entries, "2026-07-16");
    expect(summary.last30Days).toBe(1);
    expect(summary.last90Days).toBe(1);
  });

  it("excludes an entry 31 days before today from last30Days but includes it in last90Days", () => {
    const { entries } = parseParticipationLog(
      strategyNode([
        { date: "2026-06-15", venue: "IndieWeb meetup", activity: "talk", challenge: null },
      ]),
    );
    const summary = participationSummary(entries, "2026-07-16");
    expect(summary.last30Days).toBe(0);
    expect(summary.last90Days).toBe(1);
  });

  it("counts an entry exactly 90 days before today inside the last90Days window", () => {
    const { entries } = parseParticipationLog(
      strategyNode([
        { date: "2026-04-17", venue: "IndieWeb meetup", activity: "talk", challenge: null },
      ]),
    );
    const summary = participationSummary(entries, "2026-07-16");
    expect(summary.last90Days).toBe(1);
  });

  it("excludes an entry 91 days before today from last90Days", () => {
    const { entries } = parseParticipationLog(
      strategyNode([
        { date: "2026-04-16", venue: "IndieWeb meetup", activity: "talk", challenge: null },
      ]),
    );
    const summary = participationSummary(entries, "2026-07-16");
    expect(summary.last90Days).toBe(0);
  });

  it("excludes an entry dated after today from both windows", () => {
    const { entries } = parseParticipationLog(
      strategyNode([
        { date: "2026-07-20", venue: "IndieWeb meetup", activity: "talk", challenge: null },
      ]),
    );
    const summary = participationSummary(entries, "2026-07-16");
    expect(summary.last30Days).toBe(0);
    expect(summary.last90Days).toBe(0);
  });
});

describe("challengeState", () => {
  function externalCalibrationNode(reading: string | null, gap: string | null): IntentionNode {
    return anode({
      id: "strategy-external-calibration",
      kind: "strategy",
      reading,
      gap,
    });
  }

  it("reports no logged challenges and passes reading/gap through verbatim when none arrived", () => {
    const { entries } = parseParticipationLog(
      strategyNode([
        { date: "2026-01-10", venue: "local-first chat", activity: "discussion", challenge: null },
      ]),
    );
    const external = externalCalibrationNode(null, "no challenges yet");
    const state = challengeState(entries, external);
    expect(state.logged).toEqual([]);
    expect(state.externalReading).toBeNull();
    expect(state.externalGap).toBe("no challenges yet");
  });

  it("collects entries carrying a non-null challenge and passes reading/gap through verbatim", () => {
    const { entries } = parseParticipationLog(
      strategyNode([
        { date: "2026-01-10", venue: "local-first chat", activity: "discussion", challenge: "why not CRDTs" },
        { date: "2026-02-20", venue: "IndieWeb meetup", activity: "workshop", challenge: null },
      ]),
    );
    const external = externalCalibrationNode("measured", null);
    const state = challengeState(entries, external);
    expect(state.logged).toHaveLength(1);
    expect(state.logged[0].challenge).toBe("why not CRDTs");
    expect(state.externalReading).toBe("measured");
    expect(state.externalGap).toBeNull();
  });
});
