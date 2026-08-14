import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readNode, writeNode } from "../src/store.js";
import type { IntentionNode } from "../src/schema.js";
import {
  OVERRIDE_DROP_NODE_ID,
  migrateBoostLevels,
  parseArgs,
  snapToLevel,
} from "../scripts/migrate-boost-levels.js";

const DATE = "2026-08-14";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "migrate-boost-"));
}

/** Author a node through the validated write path (canonical spelling on disk). */
function node(dir: string, partial: Partial<IntentionNode> & { id: string; kind: string }): void {
  const full: IntentionNode = {
    id: partial.id,
    kind: partial.kind,
    statement: partial.statement ?? `Statement for ${partial.id}`,
    owner: partial.owner ?? "ai",
    status: partial.status ?? "codified",
    parent: partial.parent ?? null,
    serves: partial.serves ?? [],
    recovers: partial.recovers ?? [],
    rationale: partial.rationale ?? null,
    reading: partial.reading ?? null,
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
  writeNode(dir, full);
}

/**
 * Author a node file with hand-written frontmatter. The legacy `boost:` /
 * `override:` / `tier:` spellings cannot be produced through `writeNode` — it
 * re-serializes through `validateNode`, which normalizes them away — so the
 * pre-migration on-disk shape has to be written directly.
 */
function rawNode(dir: string, id: string, frontmatter: string): void {
  writeFileSync(join(dir, `${id}.md`), `---\n${frontmatter}---\n# ${id}\n`);
}

const STOPGAP = [
  "NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 20 to 0.04 so this",
  "boost can no longer lift the node out of its parent strategy's band. Original",
  "magnitude preserved at attributes.pre_namespacing_boost for restoration.",
].join(" ");

/** The five-node fixture store every traversal test runs against. */
function fixture(dir: string): void {
  // Legacy scalar boost WITH a tier tag; 12 is off-vocabulary and snaps to 10.
  rawNode(
    dir,
    "tactic-legacy-tagged",
    [
      "id: tactic-legacy-tagged",
      "kind: tactic",
      "statement: legacy tagged",
      "owner: ai",
      "status: codified",
      "attention:",
      "  boost: 12",
      "  tier: 2",
      '  rationale: "Tagged legacy claim."',
      "",
    ].join("\n"),
  );
  // Legacy scalar boost with NO tag — tier "1" by default; 3 snaps to 5.
  rawNode(
    dir,
    "tactic-legacy-untagged",
    [
      "id: tactic-legacy-untagged",
      "kind: tactic",
      "statement: legacy untagged",
      "owner: ai",
      "status: codified",
      "attention:",
      "  boost: 3",
      "  override: null",
      '  rationale: "Untagged legacy claim."',
      "",
    ].join("\n"),
  );
  // Canonical map already, but on the stopgap ladder with the original magnitude
  // preserved and the stopgap paragraph trailing the rationale.
  node(dir, {
    id: "tactic-stopgap",
    kind: "tactic",
    attention: { boosts: { "1": 0.04 }, rationale: `A measured defect.\n\n${STOPGAP}` },
    attributes: { pre_namespacing_boost: 20 },
  });
  // Already migrated: canonical map, on-vocabulary value, no stopgap residue.
  node(dir, {
    id: "tactic-clean",
    kind: "tactic",
    attention: { boosts: { "1": 50 }, rationale: "Clean claim." },
  });
  // The one legacy `override:` node, at phase done.
  rawNode(
    dir,
    OVERRIDE_DROP_NODE_ID,
    [
      `id: ${OVERRIDE_DROP_NODE_ID}`,
      "kind: tactic",
      "statement: the override node",
      "owner: ai",
      "status: codified",
      "phase: done",
      "attention:",
      "  boost: null",
      "  override: 60",
      '  rationale: "Bootstrap re-scale pins the head of the chain."',
      "",
    ].join("\n"),
  );
}

function ids(plan: { migrated: { id: string }[] }): string[] {
  return plan.migrated.map((n) => n.id).sort();
}

describe("snapToLevel", () => {
  it("snaps every live ladder and pre-stopgap magnitude to its nearest level", () => {
    for (const value of [1, 3, 3.5, 5, 6, 7]) expect(snapToLevel(value)).toBe(5);
    for (const value of [8, 10, 12]) expect(snapToLevel(value)).toBe(10);
    expect(snapToLevel(20)).toBe(20);
    for (const value of [50, 55, 56]) expect(snapToLevel(value)).toBe(50);
    for (const value of [75, 85, 90, 96]) expect(snapToLevel(value)).toBe(85);
  });

  it("snaps UP on an exact tie at every midpoint (a guard — no live value ties)", () => {
    expect(snapToLevel(7.5)).toBe(10);
    expect(snapToLevel(15)).toBe(20);
    expect(snapToLevel(35)).toBe(50);
    expect(snapToLevel(67.5)).toBe(85);
  });

  it("refuses a non-positive or non-finite magnitude rather than coercing it", () => {
    expect(() => snapToLevel(0)).toThrow(/non-positive or non-finite/);
    expect(() => snapToLevel(-5)).toThrow(/non-positive or non-finite/);
    expect(() => snapToLevel(Number.NaN)).toThrow(/non-positive or non-finite/);
  });
});

describe("parseArgs", () => {
  it("defaults the dir to the repo-local intentions store and rejects unknown flags", () => {
    const args = parseArgs([]);
    expect(args.dir.endsWith("/intentions")).toBe(true);
    expect(args.noApply).toBe(false);
    expect(args.check).toBe(false);
    expect(parseArgs(["--check"]).check).toBe(true);
    expect(parseArgs(["--no-apply"]).noApply).toBe(true);
    expect(() => parseArgs(["--nope"])).toThrow(/unknown flag/);
  });
});

describe("migrateBoostLevels", () => {
  it("rewrites legacy spellings, reverts the ladder, strips the stopgap prose, and snaps to the vocabulary", () => {
    const dir = tempDir();
    fixture(dir);

    const plan = migrateBoostLevels({ dir, date: DATE });

    // The clean node is the only one left untouched.
    expect(ids(plan)).toEqual(
      [
        OVERRIDE_DROP_NODE_ID,
        "tactic-legacy-tagged",
        "tactic-legacy-untagged",
        "tactic-stopgap",
      ].sort(),
    );

    // Legacy tagged: canonical map keyed by the tag, value snapped, note appended.
    const tagged = readNode(dir, "tactic-legacy-tagged");
    expect(tagged.attention?.boosts).toEqual({ "2": 10 });
    expect(tagged.attention?.rationale).toContain(
      `LEVEL MIGRATION ${DATE}: tier 2 boost snapped from 12 to the closed level vocabulary value 10 (low)`,
    );
    // The legacy scalar keys are gone from the FILE, not just from the parse.
    const taggedRaw = readFileSync(join(dir, "tactic-legacy-tagged.md"), "utf8");
    expect(taggedRaw).toContain("boosts:");
    expect(taggedRaw).not.toMatch(/^\s+boost:/m);
    expect(taggedRaw).not.toMatch(/^\s+tier:/m);

    // Legacy untagged: tier "1" by default.
    const untagged = readNode(dir, "tactic-legacy-untagged");
    expect(untagged.attention?.boosts).toEqual({ "1": 5 });
    expect(untagged.attention?.rationale).toContain("snapped from 3 to the closed level vocabulary value 5 (background)");

    // Stopgap node: original magnitude restored, attribute deleted, prose stripped,
    // and NO snap note (20 is already a level).
    const stopgap = readNode(dir, "tactic-stopgap");
    expect(stopgap.attention?.boosts).toEqual({ "1": 20 });
    expect(stopgap.attributes.pre_namespacing_boost).toBeUndefined();
    expect(stopgap.attention?.rationale).toBe("A measured defect.");
    expect(stopgap.attention?.rationale).not.toContain("LEVEL MIGRATION");

    // Clean node untouched.
    expect(readNode(dir, "tactic-clean").attention).toEqual({
      boosts: { "1": 50 },
      rationale: "Clean claim.",
    });

    // The override node's whole block is dropped, the 60 not converted.
    expect(readNode(dir, OVERRIDE_DROP_NODE_ID).attention).toBeNull();
  });

  it("is idempotent: a second apply writes nothing and --check then passes", () => {
    const dir = tempDir();
    fixture(dir);

    migrateBoostLevels({ dir, date: DATE });
    const after = readFileSync(join(dir, "tactic-stopgap.md"), "utf8");

    expect(migrateBoostLevels({ dir, date: DATE }).migrated).toEqual([]);
    expect(migrateBoostLevels({ dir, date: DATE, check: true }).migrated).toEqual([]);
    // Byte-identical: the second pass never re-appended a migration note.
    expect(readFileSync(join(dir, "tactic-stopgap.md"), "utf8")).toBe(after);
  });

  it("--check reports every owed node and writes nothing", () => {
    const dir = tempDir();
    fixture(dir);
    const before = readFileSync(join(dir, "tactic-legacy-tagged.md"), "utf8");

    const plan = migrateBoostLevels({ dir, date: DATE, check: true });

    expect(plan.migrated.length).toBe(4);
    expect(readFileSync(join(dir, "tactic-legacy-tagged.md"), "utf8")).toBe(before);
  });

  it("--no-apply prints the same plan without writing", () => {
    const dir = tempDir();
    fixture(dir);
    const before = readFileSync(join(dir, "tactic-stopgap.md"), "utf8");

    const planned = migrateBoostLevels({ dir, date: DATE, noApply: true });
    expect(readFileSync(join(dir, "tactic-stopgap.md"), "utf8")).toBe(before);

    const applied = migrateBoostLevels({ dir, date: DATE });
    expect(ids(applied)).toEqual(ids(planned));
  });

  it("hard-errors when a stopgap paragraph is not the trailing content of the rationale", () => {
    const dir = tempDir();
    node(dir, {
      id: "tactic-misplaced-stopgap",
      kind: "tactic",
      attention: {
        boosts: { "1": 0.04 },
        rationale: `${STOPGAP}\n\nA trailing paragraph that follows the stopgap block.`,
      },
      attributes: { pre_namespacing_boost: 20 },
    });

    expect(() => migrateBoostLevels({ dir, date: DATE })).toThrow(
      /not the trailing content of attention.rationale/,
    );
  });

  it("hard-errors when a reverted node carries no stopgap paragraph at all", () => {
    const dir = tempDir();
    node(dir, {
      id: "tactic-no-stopgap-prose",
      kind: "tactic",
      attention: { boosts: { "1": 0.04 }, rationale: "No stopgap note here." },
      attributes: { pre_namespacing_boost: 20 },
    });

    expect(() => migrateBoostLevels({ dir, date: DATE })).toThrow(/no namespacing-stopgap paragraph/);
  });

  it("hard-errors on a pre_namespacing_boost that is not a positive finite number", () => {
    const dir = tempDir();
    node(dir, {
      id: "tactic-bad-preserved",
      kind: "tactic",
      attention: { boosts: { "1": 0.04 }, rationale: `x\n\n${STOPGAP}` },
      attributes: { pre_namespacing_boost: 0 },
    });

    expect(() => migrateBoostLevels({ dir, date: DATE })).toThrow(
      /expected a finite number > 0/,
    );
  });

  it("hard-errors when a preserved magnitude sits on a multi-tier or non-tier-1 boosts map", () => {
    const dir = tempDir();
    node(dir, {
      id: "tactic-wrong-tier-preserved",
      kind: "tactic",
      attention: { boosts: { "2": 0.04 }, rationale: `x\n\n${STOPGAP}` },
      attributes: { pre_namespacing_boost: 20 },
    });

    expect(() => migrateBoostLevels({ dir, date: DATE })).toThrow(
      /chosen on the tier-1 scale only/,
    );
  });

  it("refuses to drop the override node's claim if it has moved off phase done", () => {
    const dir = tempDir();
    rawNode(
      dir,
      OVERRIDE_DROP_NODE_ID,
      [
        `id: ${OVERRIDE_DROP_NODE_ID}`,
        "kind: tactic",
        "statement: the override node",
        "owner: ai",
        "status: codified",
        "phase: qa",
        "attention:",
        "  override: 60",
        '  rationale: "Still live."',
        "",
      ].join("\n"),
    );

    expect(() => migrateBoostLevels({ dir, date: DATE })).toThrow(
      /is at phase qa, not done — refusing to drop a live authored claim/,
    );
  });
});
