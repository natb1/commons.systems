import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { IntentionNodeInput } from "../src/schema.js";
import { listNodes, writeNode } from "../src/store.js";
import {
  buildReport,
  formatReport,
  parseHousehold,
  type ReportModel,
} from "../scripts/household-consent-report.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "household-report-"));
}

/** A delegation record with the given attributes, defaults filled in. */
function delegation(id: string, attributes: Record<string, unknown>): IntentionNodeInput {
  return {
    id,
    kind: "delegation",
    statement: `Delegation ${id}`,
    owner: "human",
    status: "codified",
    attributes,
  };
}

/** A strategy that recovers the given delegation ids. */
function strategy(id: string, recovers: string[]): IntentionNodeInput {
  return {
    id,
    kind: "strategy",
    statement: `Strategy ${id}`,
    owner: "human",
    status: "refining",
    recovers,
  };
}

/** Write fixtures to a fresh temp store and return the built report model. */
function reportOver(fixtures: IntentionNodeInput[]): ReportModel {
  const dir = tempDir();
  for (const node of fixtures) writeNode(dir, node);
  return buildReport(listNodes(dir));
}

describe("parseHousehold", () => {
  it("returns null for a record with no household block (unassessed)", () => {
    const node = delegation("delegation-x", { delegatee: "vendor" });
    // writeNode/readNode round-trip through a temp dir so we exercise a real node.
    const dir = tempDir();
    writeNode(dir, node);
    const [read] = listNodes(dir);
    expect(parseHousehold(read)).toBeNull();
  });

  it("narrows a well-formed block", () => {
    const node = delegation("delegation-x", {
      household: {
        shared: true,
        basis: "family photos",
        consent: [{ date: "2026-07-11", move: "strategy-a", decision: "approved" }],
        preferences: ["keep iCloud"],
      },
    });
    const dir = tempDir();
    writeNode(dir, node);
    const [read] = listNodes(dir);
    expect(parseHousehold(read)).toEqual({
      shared: true,
      basis: "family photos",
      consent: [{ date: "2026-07-11", move: "strategy-a", decision: "approved" }],
      preferences: ["keep iCloud"],
    });
  });

  it("throws naming the record when shared is not a boolean", () => {
    const node = delegation("delegation-bad", {
      household: { shared: "yes", basis: "x", consent: [], preferences: [] },
    });
    const dir = tempDir();
    writeNode(dir, node);
    const [read] = listNodes(dir);
    expect(() => parseHousehold(read)).toThrow("delegation-bad");
    expect(() => parseHousehold(read)).toThrow("shared must be a boolean");
  });

  it("throws when consent is not an array", () => {
    const node = delegation("delegation-bad", {
      household: { shared: true, basis: "x", consent: {}, preferences: [] },
    });
    const dir = tempDir();
    writeNode(dir, node);
    const [read] = listNodes(dir);
    expect(() => parseHousehold(read)).toThrow("consent must be an array");
  });

  it("throws when a consent entry is missing required fields", () => {
    const node = delegation("delegation-bad", {
      household: {
        shared: true,
        basis: "x",
        consent: [{ date: "2026-07-11", move: "strategy-a" }],
        preferences: [],
      },
    });
    const dir = tempDir();
    writeNode(dir, node);
    const [read] = listNodes(dir);
    expect(() => parseHousehold(read)).toThrow("string date, move, and decision");
  });
});

describe("buildReport", () => {
  it("covers a shared record whose recovers move has a consent entry", () => {
    const model = reportOver([
      delegation("delegation-shared", {
        household: {
          shared: true,
          basis: "family archive",
          consent: [{ date: "2026-07-11", move: "strategy-move", decision: "approved" }],
          preferences: ["prefer DRM-free"],
        },
      }),
      strategy("strategy-move", ["delegation-shared"]),
    ]);
    expect(model.shared).toHaveLength(1);
    expect(model.shared[0].moves).toEqual([
      {
        strategyId: "strategy-move",
        consent: { date: "2026-07-11", move: "strategy-move", decision: "approved" },
      },
    ]);
    expect(model.shared[0].preferences).toEqual(["prefer DRM-free"]);
    expect(model.uncoveredMoveCount).toBe(0);
  });

  it("counts a shared record's move with no matching consent as uncovered", () => {
    const model = reportOver([
      delegation("delegation-shared", {
        household: { shared: true, basis: "family archive", consent: [], preferences: [] },
      }),
      strategy("strategy-move", ["delegation-shared"]),
      // A consent entry for a DIFFERENT move must not cover this one.
      strategy("strategy-other", ["delegation-elsewhere"]),
    ]);
    expect(model.uncoveredMoveCount).toBe(1);
    expect(model.shared[0].moves).toEqual([{ strategyId: "strategy-move", consent: null }]);
  });

  it("lists an explicit shared:false record under notShared, not shared", () => {
    const model = reportOver([
      delegation("delegation-author", {
        household: { shared: false, basis: "author-only tool", consent: [], preferences: [] },
      }),
    ]);
    expect(model.shared).toHaveLength(0);
    expect(model.notShared).toEqual([{ id: "delegation-author", basis: "author-only tool" }]);
    expect(model.unassessed).toHaveLength(0);
  });

  it("lists a record with no household block under unassessed", () => {
    const model = reportOver([delegation("delegation-raw", { delegatee: "vendor" })]);
    expect(model.unassessed).toEqual(["delegation-raw"]);
    expect(model.shared).toHaveLength(0);
    expect(model.notShared).toHaveLength(0);
  });

  it("throws on a malformed household block, naming the record", () => {
    const dir = tempDir();
    writeNode(
      dir,
      delegation("delegation-malformed", {
        household: { shared: true, basis: "", consent: [], preferences: [] },
      }),
    );
    expect(() => buildReport(listNodes(dir))).toThrow("delegation-malformed");
  });
});

describe("formatReport", () => {
  it("renders sections, the NO RECORDED CONSENT line, and the summary count", () => {
    const model = reportOver([
      delegation("delegation-shared", {
        household: { shared: true, basis: "family archive", consent: [], preferences: [] },
      }),
      delegation("delegation-author", {
        household: { shared: false, basis: "author-only", consent: [], preferences: [] },
      }),
      delegation("delegation-raw", { delegatee: "vendor" }),
      strategy("strategy-move", ["delegation-shared"]),
    ]);
    const report = formatReport(model);
    expect(report).toContain("### delegation-shared");
    expect(report).toContain("strategy-move — NO RECORDED CONSENT");
    expect(report).toContain("- delegation-author — author-only");
    expect(report).toContain("- [ ] delegation-raw");
    expect(report).toContain("NO RECORDED CONSENT: 1");
  });

  it("renders a recorded consent decision instead of the NO RECORDED CONSENT line", () => {
    const model = reportOver([
      delegation("delegation-shared", {
        household: {
          shared: true,
          basis: "family archive",
          consent: [{ date: "2026-07-11", move: "strategy-move", decision: "approved by household" }],
          preferences: [],
        },
      }),
      strategy("strategy-move", ["delegation-shared"]),
    ]);
    const report = formatReport(model);
    expect(report).toContain("strategy-move — consent 2026-07-11: approved by household");
    expect(report).not.toContain("NO RECORDED CONSENT: 1");
    expect(report).toContain("NO RECORDED CONSENT: 0");
  });
});
