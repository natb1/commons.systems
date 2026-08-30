import { describe, expect, it } from "vitest";
import { validateNode } from "../src/schema.js";
import {
  MAINQA_LANES,
  buildMainqaBody,
  buildMainqaNode,
  decideMint,
  groupByLane,
  laneFor,
  mainqaNodeId,
  type MainqaItem,
} from "../src/mainqaRouting.js";

// PR5a Unit 1 — the pure mainqa lane/id/mint vocabulary consumed by /qa-fix's
// main-qa record-time routing. Pure over in-memory args (no store, no
// subprocess), mirroring hold-node-decide.test.ts.

const SOURCE = "tactic-some-work";
const STRATEGY = "strategy-graph-native-dispatch";
const STRATEGY_B = "strategy-main-health";
const BRANCH = "tactic-some-work";
const PR = 3132;
const SINCE = "2026-08-29";

function item(overrides: Partial<MainqaItem> = {}): MainqaItem {
  return {
    id: "check-1",
    title: "landing page renders",
    url_path: "/",
    expected_outcome: "200 with the hero heading",
    finding: "confirmed 200, heading present",
    verifiability: "MACHINE",
    ...overrides,
  };
}

describe("mainqaNodeId", () => {
  it("strips a leading tactic- prefix and appends the lane", () => {
    expect(mainqaNodeId("tactic-some-work", "machine")).toBe(
      "tactic-mainqa-some-work-machine",
    );
    expect(mainqaNodeId("tactic-some-work", "author")).toBe(
      "tactic-mainqa-some-work-author",
    );
  });

  it("uses the source id verbatim when it has no tactic- prefix", () => {
    expect(mainqaNodeId("strategy-some-work", "machine")).toBe(
      "tactic-mainqa-strategy-some-work-machine",
    );
  });

  it("strips only ONE leading tactic- prefix", () => {
    expect(mainqaNodeId("tactic-tactic-nested", "machine")).toBe(
      "tactic-mainqa-tactic-nested-machine",
    );
  });

  it("throws on a source id that yields a path separator in the derived id", () => {
    expect(() => mainqaNodeId("tactic-a/b", "machine")).toThrow(/path separator/);
    expect(() => mainqaNodeId("tactic-a\\b", "author")).toThrow(/path separator/);
  });

  it("throws on an empty slug", () => {
    expect(() => mainqaNodeId("tactic-", "machine")).toThrow(/empty slug/);
    expect(() => mainqaNodeId("", "author")).toThrow(/empty slug/);
  });
});

describe("laneFor", () => {
  it("routes AUTHOR to the author lane", () => {
    expect(laneFor("AUTHOR")).toBe("author");
  });

  it("routes MACHINE to the machine lane", () => {
    expect(laneFor("MACHINE")).toBe("machine");
  });

  it("routes WAIT to the machine lane (R1: WAIT is a hold on machine, not a third lane)", () => {
    expect(laneFor("WAIT")).toBe("machine");
  });
});

describe("groupByLane", () => {
  it("preserves stable input order within each lane", () => {
    const items = [
      item({ id: "m1", verifiability: "MACHINE" }),
      item({ id: "a1", verifiability: "AUTHOR" }),
      item({ id: "m2", verifiability: "MACHINE" }),
      item({ id: "w1", verifiability: "WAIT" }),
      item({ id: "a2", verifiability: "AUTHOR" }),
    ];
    const grouped = groupByLane(items);
    expect(grouped.machine.map((i) => i.id)).toEqual(["m1", "m2", "w1"]);
    expect(grouped.author.map((i) => i.id)).toEqual(["a1", "a2"]);
  });

  it("returns empty arrays for a lane with no items", () => {
    const grouped = groupByLane([item({ verifiability: "MACHINE" })]);
    expect(grouped.author).toEqual([]);
  });
});

describe("buildMainqaBody", () => {
  it("renders the machine statement, context, and a Check line when present", () => {
    const body = buildMainqaBody({
      sourceId: SOURCE,
      lane: "machine",
      pr: PR,
      items: [item({ check: "npm run verify:landing" })],
    });
    expect(body).toContain(
      `# Post-merge verification of ${SOURCE} (PR #${PR}) — machine-verifiable items`,
    );
    expect(body).toContain("## Context");
    expect(body).toContain(`\`${SOURCE}\` (PR #${PR})`);
    expect(body).toContain("## Verification items");
    expect(body).toContain("- **check-1 — landing page renders**");
    expect(body).toContain("  - Path: `/`");
    expect(body).toContain("  - Verifiability: MACHINE");
    expect(body).toContain("  - Check: npm run verify:landing");
  });

  it("renders the author statement and omits the Check line when absent", () => {
    const body = buildMainqaBody({
      sourceId: SOURCE,
      lane: "author",
      pr: PR,
      items: [item({ verifiability: "AUTHOR", check: undefined })],
    });
    expect(body).toContain(
      `# Post-merge verification of ${SOURCE} (PR #${PR}) — author-required items`,
    );
    expect(body).not.toContain("Check:");
  });

  it("omits the Check line when check is explicitly null", () => {
    const body = buildMainqaBody({
      sourceId: SOURCE,
      lane: "machine",
      pr: PR,
      items: [item({ check: null })],
    });
    expect(body).not.toContain("Check:");
  });

  it("never mints a needs-main-prefixed heading (reconciler discriminator)", () => {
    const body = buildMainqaBody({ sourceId: SOURCE, lane: "machine", pr: PR, items: [item()] });
    for (const line of body.split("\n")) {
      const m = line.match(/^##\s+(.*)$/);
      if (m !== null) {
        expect(/^needs-main(?:\s|$)/i.test(m[1].trim())).toBe(false);
      }
    }
  });
});

describe("buildMainqaNode", () => {
  function nodeArgs(overrides: Record<string, unknown> = {}) {
    return {
      sourceId: SOURCE,
      lane: "machine" as const,
      pr: PR,
      branch: BRANCH,
      serves: [STRATEGY],
      since: SINCE,
      ...overrides,
    };
  }

  it("builds the machine lane per the target-design table", () => {
    const node = buildMainqaNode(nodeArgs());
    expect(node.id).toBe("tactic-mainqa-some-work-machine");
    expect(node.kind).toBe("tactic");
    expect(node.phase).toBe("main-qa");
    expect(node.owner).toBe("ai");
    expect(node.status).toBe("codified");
    expect(node.office_hours).toBeNull();
    expect(node.serves).toEqual([STRATEGY]);
    expect(node.parent).toBeNull();
    expect(node.blocked_by).toEqual([SOURCE]);
    expect(node.execution).toEqual({
      branch: BRANCH,
      pr: PR,
      attempts: {},
      markers: [],
      strategy_fingerprint: null,
    });
  });

  it("builds the author lane per the target-design table", () => {
    const node = buildMainqaNode(
      nodeArgs({ lane: "author", reason: "needs a look", recommendation: "check it" }),
    );
    expect(node.id).toBe("tactic-mainqa-some-work-author");
    expect(node.phase).toBe("main-qa");
    expect(node.owner).toBe("human");
    expect(node.status).toBe("delegated");
    expect(node.parent).toBeNull();
    expect(node.blocked_by).toEqual([SOURCE]);
    expect(node.office_hours).toEqual({
      reason: "needs a look",
      since: SINCE,
      recommendation: "check it",
      session_type: "other",
    });
  });

  it("copies serves verbatim from the source, in order", () => {
    const node = buildMainqaNode(nodeArgs({ serves: [STRATEGY, STRATEGY_B] }));
    expect(node.serves).toEqual([STRATEGY, STRATEGY_B]);
  });

  it("refuses an empty author reason", () => {
    expect(() =>
      buildMainqaNode(
        nodeArgs({ lane: "author", reason: "   ", recommendation: "check it" }),
      ),
    ).toThrow(/non-empty reason/);
  });

  it("refuses an empty author recommendation", () => {
    expect(() =>
      buildMainqaNode(
        nodeArgs({ lane: "author", reason: "needs a look", recommendation: "" }),
      ),
    ).toThrow(/non-empty recommendation/);
  });

  it("refuses a missing author recommendation", () => {
    expect(() =>
      buildMainqaNode(nodeArgs({ lane: "author", reason: "needs a look" })),
    ).toThrow(/non-empty recommendation/);
  });

  // A destination node is born carrying the source's already-merged PR. Rendering
  // `PR #null` into the statement and body would be a silent-wrong-output
  // fallback; the payload arrives in JSON form, so null is reachable at runtime.
  it("refuses a null source PR rather than rendering `PR #null`", () => {
    const nullPr = null as unknown as number; // type-safety-ok: the items payload reaches this module as JSON, so a null pr is reachable at runtime and the guard must be exercised with one
    expect(() => buildMainqaNode(nodeArgs({ pr: nullPr }))).toThrow(
      /requires the source PR number/,
    );
  });

  it("refuses a non-positive source PR", () => {
    expect(() => buildMainqaNode(nodeArgs({ pr: 0 }))).toThrow(
      /requires the source PR number/,
    );
  });

  it("passes validateNode for both lanes", () => {
    const machine = validateNode(buildMainqaNode(nodeArgs()));
    expect(machine.id).toBe("tactic-mainqa-some-work-machine");
    expect(machine.phase).toBe("main-qa");

    const author = validateNode(
      buildMainqaNode(
        nodeArgs({ lane: "author", reason: "needs a look", recommendation: "check it" }),
      ),
    );
    expect(author.id).toBe("tactic-mainqa-some-work-author");
    expect(author.office_hours?.session_type).toBe("other");
  });
});

describe("decideMint", () => {
  function mintArgs(overrides: Record<string, unknown> = {}) {
    return {
      sourceId: SOURCE,
      items: [item()],
      branch: BRANCH,
      pr: PR,
      serves: [STRATEGY],
      since: SINCE,
      existingIds: [] as readonly string[],
      ...overrides,
    };
  }

  it("yields exactly ONE entry for an all-machine source", () => {
    const decisions = decideMint(
      mintArgs({
        items: [item({ id: "m1", verifiability: "MACHINE" }), item({ id: "m2", verifiability: "MACHINE" })],
      }),
    );
    expect(decisions).toHaveLength(1);
    expect(decisions[0].lane).toBe("machine");
    expect(decisions[0].id).toBe("tactic-mainqa-some-work-machine");
  });

  it("yields exactly ONE entry for an all-author source", () => {
    const decisions = decideMint(
      mintArgs({
        items: [item({ id: "a1", verifiability: "AUTHOR" }), item({ id: "a2", verifiability: "AUTHOR" })],
      }),
    );
    expect(decisions).toHaveLength(1);
    expect(decisions[0].lane).toBe("author");
    expect(decisions[0].id).toBe("tactic-mainqa-some-work-author");
    // Author office_hours must be non-empty, composed from the items.
    expect(decisions[0].node.office_hours?.reason).toContain("a1");
    expect(decisions[0].node.office_hours?.reason).toContain("a2");
    expect(decisions[0].node.office_hours?.recommendation?.trim()).not.toBe("");
  });

  it("leads the author lane's born recommendation with the merge precondition", () => {
    // This node is born PARKED at qa record time, before its source PR merges,
    // and officeHoursQueue applies no blocked_by gate — openBlockers is
    // "Advisory only — never a gate" (src/officeHours.ts), and
    // .claude/skills/office-hours/SKILL.md makes that doctrine. So the node
    // CAN be handed to a human sitting while PR #3132 is still open, and this
    // text is the only thing that tells them not to verify yet. Pin it.
    const decisions = decideMint(
      mintArgs({ items: [item({ id: "a1", verifiability: "AUTHOR" })] }),
    );
    const rec = decisions[0].node.office_hours?.recommendation ?? "";
    expect(rec).toMatch(/^PRECONDITION — do NOT verify until PR #3132 has MERGED/);
    expect(rec).toContain("tactic-some-work");
    // …and the actionable instruction still follows it.
    expect(rec).toContain("resolve this node");
    expect(rec).toContain("a1");
  });

  it("yields exactly TWO entries for a mixed source, and NEVER three", () => {
    const decisions = decideMint(
      mintArgs({
        items: [
          item({ id: "m1", verifiability: "MACHINE" }),
          item({ id: "a1", verifiability: "AUTHOR" }),
          item({ id: "w1", verifiability: "WAIT" }),
        ],
      }),
    );
    expect(decisions).toHaveLength(2);
    const lanes = decisions.map((d) => d.lane).sort();
    expect(lanes).toEqual([...MAINQA_LANES].sort());
    // WAIT joined the machine lane, not a third lane.
    const machineDecision = decisions.find((d) => d.lane === "machine");
    expect(machineDecision).toBeDefined();
  });

  it("reports CREATE when the id is absent from existingIds", () => {
    const decisions = decideMint(mintArgs());
    expect(decisions[0].disposition).toBe("CREATE");
  });

  it("reports EXISTING when the caller names the id already on disk", () => {
    const decisions = decideMint(
      mintArgs({ existingIds: ["tactic-mainqa-some-work-machine"] }),
    );
    expect(decisions[0].disposition).toBe("EXISTING");
  });

  it("produces a node and body for each returned entry", () => {
    const decisions = decideMint(mintArgs());
    expect(decisions[0].node.id).toBe(decisions[0].id);
    expect(decisions[0].body).toContain("## Verification items");
  });
});
