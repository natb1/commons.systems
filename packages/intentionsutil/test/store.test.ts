import { chmodSync, existsSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { IntentionNode, IntentionNodeInput } from "../src/schema.js";
import { IntentionSchemaError } from "../src/errors.js";
import {
  assertNoBodyLoss,
  assertWriteClassBoundary,
  listNodes,
  listNodesResilient,
  listNodesStrict,
  readNode,
  writeNode,
} from "../src/store.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "intentions-"));
}

/**
 * Collect what `fn` writes to stderr. The chunks are gathered inside the mock
 * because `mockRestore()` clears `mock.calls` along with the spy.
 */
function captureStderr<T>(fn: () => T): { result: T; warnings: string } {
  const chunks: string[] = [];
  const spy = vi.spyOn(process.stderr, "write").mockImplementation(((chunk: unknown) => {
    chunks.push(String(chunk));
    return true;
  }) as typeof process.stderr.write);
  let result: T;
  try {
    result = fn();
  } finally {
    spy.mockRestore();
  }
  return { result, warnings: chunks.join("") };
}

describe("store round-trip", () => {
  it("is lossless for a fully-populated node", () => {
    const dir = tempDir();
    const node: IntentionNode = {
      id: "root-1",
      kind: "virtue",
      statement: "Keep the commons aligned with its charter.",
      owner: "human",
      status: "codified",
      parent: "charter",
      serves: ["charter"],
      recovers: ["delegation-1"],
      rationale: "Alignment is the project's reason for being.",
      reading: "See the alignment principles.",
      clarifications: [
        { question: "Who arbitrates conflicts?", answer: "The charter owner." },
        { question: "How often is it reviewed?", answer: "Each digest cycle." },
      ],
      tooling_goals: [{ kind: "actuator", statement: "align-cli" }, { kind: "sensor", statement: "intention-tree" }],
      success_signal: {
        observable: "intention-tree builds without orphans",
        sensor: "align --check",
        threshold: "0 orphans",
        is_proxy: false,
      },
      attention: {
        boosts: { "1": 4 },
        rationale: "This root draws attention this cycle.",
      },
      phase: null,
      execution: null,
      validates: [],
      blocked_by: [],
      superseded_by: [],
      supersession_expiry: null,
      office_hours: null,
      pace_exempt: false,
      rounds: null,
      attributes: { source: "github:natb1/commons.systems#1", weight: 3 },
    };

    writeNode(dir, node);
    const read = readNode(dir, node.id);
    expect(read).toEqual(node);
  });

  it("round-trips a node carrying boosts in several tiers", () => {
    const dir = tempDir();
    const node: IntentionNode = {
      id: "capped-1",
      kind: "strategy",
      statement: "A branch boosted in more than one tier.",
      owner: "human",
      status: "refining",
      parent: "root-1",
      serves: [],
      recovers: [],
      rationale: null,
      reading: null,
      clarifications: [],
      tooling_goals: [],
      success_signal: null,
      attention: {
        boosts: { "1": 2, "3": 7 },
        rationale: "Ordinary work now, but it is on the security path.",
      },
      phase: null,
      execution: null,
      validates: [],
      blocked_by: [],
      superseded_by: [],
      supersession_expiry: null,
      office_hours: null,
      pace_exempt: false,
      rounds: null,
      attributes: {},
    };

    writeNode(dir, node);
    const read = readNode(dir, node.id);
    expect(read).toEqual(node);
  });

  /**
   * Every accepted `attention` spelling — canonical and legacy — must survive
   * the full write→read cycle. `writeNode` emits `stringify(validateNode(node))`
   * verbatim, so any spelling that canonicalizes to a shape the parser then
   * REJECTS writes a file that can never be loaded again (the old
   * `override: 0` ⇒ `{boosts: {}}` mapping did exactly that). The failure is
   * silent where it matters: `listNodes` only warns about an unreadable file
   * and skips it, so the node — and every `blocked_by` gate it holds —
   * disappears from the graph. This table is the guard: a future shape
   * migration that reintroduces a write-then-unreadable spelling fails here.
   */
  const ATTENTION_SPELLINGS: Array<{
    name: string;
    authored: Record<string, unknown>;
    canonical: { boosts: Record<string, number>; rationale: string };
  }> = [
    {
      name: "the canonical per-tier boosts map",
      authored: { boosts: { "1": 3, "2": 20 }, rationale: "r" },
      canonical: { boosts: { "1": 3, "2": 20 }, rationale: "r" },
    },
    {
      name: "a legacy untagged boost",
      authored: { boost: 3, rationale: "r" },
      canonical: { boosts: { "1": 3 }, rationale: "r" },
    },
    {
      name: "a legacy tier-tagged boost",
      authored: { boost: 5, tier: 2, rationale: "r" },
      canonical: { boosts: { "2": 5 }, rationale: "r" },
    },
    {
      // The shape the live store actually carries: `boost:` set, `override:`
      // explicitly null.
      name: "a legacy boost alongside an explicit override: null",
      authored: { boost: 6, override: null, rationale: "r" },
      canonical: { boosts: { "1": 6 }, rationale: "r" },
    },
    {
      name: "a legacy positive override",
      authored: { override: 60, tier: 3, rationale: "r" },
      canonical: { boosts: { "3": 60 }, rationale: "r" },
    },
  ];

  for (const spelling of ATTENTION_SPELLINGS) {
    it(`round-trips ${spelling.name} through write → read → write`, () => {
      const dir = tempDir();
      const input = {
        id: "attn-1",
        kind: "strategy",
        statement: "Attention spelling round-trip.",
        owner: "human",
        status: "raw",
        attention: spelling.authored,
      } as unknown as IntentionNodeInput; // type-safety-ok: legacy attention spellings intentionally omit fields IntentionNodeInput requires

      writeNode(dir, input);
      const read = readNode(dir, "attn-1");
      expect(read.attention).toEqual(spelling.canonical);

      // The emitted shape must itself be re-writable and re-readable: the
      // second cycle is what a read-modify-write consumer (read-sensors,
      // write-node, graph-commit, the boost scripts) actually performs.
      writeNode(dir, read);
      expect(readNode(dir, "attn-1").attention).toEqual(spelling.canonical);
    });
  }

  it("refuses to write a node whose attention claims nothing", () => {
    const dir = tempDir();
    const base = {
      id: "attn-zero",
      kind: "strategy",
      statement: "Attention that claims nothing.",
      owner: "human",
      status: "raw",
    };
    // Legacy `override: 0` ("zero this branch") and a bare empty map are the
    // two ways to author a claim-nothing block. Both must fail AT THE WRITE,
    // not produce a file that only fails on the next read.
    for (const attention of [{ override: 0, rationale: "r" }, { boosts: {}, rationale: "r" }]) {
      expect(() =>
        writeNode(dir, { ...base, attention } as unknown as IntentionNodeInput), // type-safety-ok: claim-nothing attention fixtures intentionally omit fields IntentionNodeInput requires
      ).toThrow();
    }
    expect(existsSync(join(dir, "attn-zero.md"))).toBe(false);
  });

  it("is lossless for a node with multi-line string fields", () => {
    const dir = tempDir();
    const node: IntentionNode = {
      id: "multi-1",
      kind: "strategy",
      statement: "Preserve multi-line content through the store round-trip.",
      owner: "human",
      status: "codified",
      parent: "root-1",
      serves: [],
      recovers: [],
      // rationale ends with \n (trailing newline); reading does not — exercises both chomping cases
      rationale:
        "Block scalars in YAML can silently strip trailing newlines\nor fold long lines.\n\nThis test pins the guarantee that neither transformation occurs.\n",
      reading:
        "See yaml.org/spec/1.2/spec.html section 8.1.1.2 on block scalar chomping.\n\nAlso review the 'clip', 'strip', and 'keep' indicators.",
      clarifications: [
        {
          question: "Does the yaml library clip trailing newlines?",
          answer: "Not when fields are read back via parse — this test confirms it.",
        },
        {
          question: "Are internal blank lines preserved?",
          answer: "Yes — the rationale field above contains one.",
        },
      ],
      tooling_goals: [{ kind: "actuator", statement: "yaml-round-trip" }, { kind: "sensor", statement: "intention-store" }],
      success_signal: {
        observable: "readNode returns the exact node written, including trailing newlines",
        sensor: "vitest store.test.ts",
        threshold: "0 diff",
        is_proxy: false,
      },
      attention: null,
      phase: null,
      execution: null,
      validates: [],
      blocked_by: [],
      superseded_by: [],
      supersession_expiry: null,
      office_hours: null,
      pace_exempt: false,
      rounds: null,
      attributes: {},
    };

    writeNode(dir, node);
    const read = readNode(dir, node.id);
    expect(read).toEqual(node);
  });

  it("applies defaults for a minimal node", () => {
    const dir = tempDir();
    // Only the required core; optional fields omitted entirely.
    writeNode(dir, {
      id: "leaf-1",
      kind: "tactic",
      statement: "Do the small thing.",
      owner: "ai",
      status: "raw",
    });
    const read = readNode(dir, "leaf-1");

    expect(read).toEqual({
      id: "leaf-1",
      kind: "tactic",
      statement: "Do the small thing.",
      owner: "ai",
      status: "raw",
      parent: null,
      serves: [],
      recovers: [],
      rationale: null,
      reading: null,
      clarifications: [],
      tooling_goals: [],
      success_signal: null,
      attention: null,
      phase: null,
      execution: null,
      validates: [],
      blocked_by: [],
      superseded_by: [],
      supersession_expiry: null,
      office_hours: null,
      pace_exempt: false,
      rounds: null,
      attributes: {},
    });
  });
});

describe("writeNode body preservation", () => {
  it("preserves an existing tactic file's exact prior body content on rewrite", () => {
    const dir = tempDir();
    const original: IntentionNode = {
      id: "tactic-1",
      kind: "tactic",
      statement: "Original statement.",
      owner: "ai",
      status: "codified",
      parent: null,
      serves: [],
      recovers: [],
      rationale: null,
      reading: null,
      clarifications: [],
      tooling_goals: [],
      success_signal: null,
      attention: null,
      phase: "implement",
      execution: null,
      validates: [],
      blocked_by: [],
      superseded_by: [],
      supersession_expiry: null,
      office_hours: null,
      pace_exempt: false,
      rounds: null,
      attributes: {},
    };
    writeNode(dir, original);

    // Hand-author a real plan body onto the file writeNode just produced,
    // simulating the authoritative, hand-maintained content a tactic body
    // carries in the live store.
    const filePath = join(dir, "tactic-1.md");
    const raw = readFileSync(filePath, "utf8");
    const closeIndex = raw.indexOf("\n---\n");
    const frontmatterAndFence = raw.slice(0, closeIndex + "\n---\n".length);
    const handAuthoredBody =
      "# A real plan\n\n## Context\n\nSome hand-written plan content.\n\n## Unit 1\n\nDo the thing.\n";
    writeFileSync(filePath, frontmatterAndFence + handAuthoredBody);

    // Rewrite with a changed statement/phase — the body must survive untouched.
    const updated: IntentionNode = { ...original, statement: "Updated statement.", phase: "qa" };
    writeNode(dir, updated);

    const rewritten = readFileSync(filePath, "utf8");
    const rewrittenCloseIndex = rewritten.indexOf("\n---\n");
    const rewrittenBody = rewritten.slice(rewrittenCloseIndex + "\n---\n".length);
    expect(rewrittenBody).toBe(handAuthoredBody);

    // Frontmatter itself did update.
    const read = readNode(dir, "tactic-1");
    expect(read.statement).toBe("Updated statement.");
    expect(read.phase).toBe("qa");
  });

  it("preserves an existing non-tactic (strategy) body verbatim on rewrite", () => {
    // Durable-body contract (tactic-nontactic-body-durability): a strategy body
    // is authoritative, durable content — a rewrite driven by a statement change
    // (reconcile-graph, read-sensors, park, transition) must NOT clobber it.
    const dir = tempDir();
    const strategy: IntentionNodeInput = {
      id: "strategy-1",
      kind: "strategy",
      statement: "First statement.",
      owner: "human",
      status: "refining",
    };
    writeNode(dir, strategy);

    // Hand-author durable design notes onto the strategy body, then rewrite the
    // frontmatter — the body must survive untouched.
    const filePath = join(dir, "strategy-1.md");
    const raw = readFileSync(filePath, "utf8");
    const closeIndex = raw.indexOf("\n---\n");
    const frontmatterAndFence = raw.slice(0, closeIndex + "\n---\n".length);
    const handAuthoredBody =
      "# Router mechanism\n\n## Calibration events\n\nDurable settled design notes.\n";
    writeFileSync(filePath, frontmatterAndFence + handAuthoredBody);

    writeNode(dir, { ...strategy, statement: "Second statement." });

    const rewritten = readFileSync(filePath, "utf8");
    const rewrittenCloseIndex = rewritten.indexOf("\n---\n");
    const rewrittenBody = rewritten.slice(rewrittenCloseIndex + "\n---\n".length);
    expect(rewrittenBody).toBe(handAuthoredBody);

    // Frontmatter itself did update.
    expect(readNode(dir, "strategy-1").statement).toBe("Second statement.");
  });

  it("preserves a hand-authored body across a kind change (durable for all kinds)", () => {
    // Under the durable-body contract, a body is authoritative content that
    // survives reclassification — the former tactic→non-tactic loss guard is
    // obsolete because non-tactic bodies are now durable too.
    const dir = tempDir();
    const tactic: IntentionNodeInput = {
      id: "tactic-reclass",
      kind: "tactic",
      statement: "A tactic with a real plan.",
      owner: "ai",
      status: "codified",
    };
    writeNode(dir, tactic);

    const filePath = join(dir, "tactic-reclass.md");
    const raw = readFileSync(filePath, "utf8");
    const closeIndex = raw.indexOf("\n---\n");
    const frontmatterAndFence = raw.slice(0, closeIndex + "\n---\n".length);
    const handAuthoredBody = "# A real plan\n\n## Unit 1\n\nDo the thing.\n";
    writeFileSync(filePath, frontmatterAndFence + handAuthoredBody);

    // Reclassify tactic → strategy: the body is preserved verbatim, not dropped.
    writeNode(dir, { ...tactic, kind: "strategy" });

    const rewritten = readFileSync(filePath, "utf8");
    const rewrittenBody = rewritten.slice(rewritten.indexOf("\n---\n") + "\n---\n".length);
    expect(rewrittenBody).toBe(handAuthoredBody);
    expect(readNode(dir, "tactic-reclass").kind).toBe("strategy");
  });

  it("allows a kind change when the existing tactic body is still the generated placeholder", () => {
    const dir = tempDir();
    const tactic: IntentionNodeInput = {
      id: "tactic-placeholder",
      kind: "tactic",
      statement: "A tactic never given a plan.",
      owner: "ai",
      status: "raw",
    };
    writeNode(dir, tactic);

    // The body is still the generated `# ${statement}` placeholder — no plan
    // content exists to lose, so reclassification proceeds.
    writeNode(dir, { ...tactic, kind: "strategy" });

    const read = readNode(dir, "tactic-placeholder");
    expect(read.kind).toBe("strategy");
    const raw = readFileSync(join(dir, "tactic-placeholder.md"), "utf8");
    expect(raw.endsWith("# A tactic never given a plan.\n")).toBe(true);
  });

  it("generates a placeholder body for a brand-new tactic with no prior file", () => {
    const dir = tempDir();
    writeNode(dir, {
      id: "tactic-new",
      kind: "tactic",
      statement: "A fresh tactic.",
      owner: "ai",
      status: "raw",
    });

    const raw = readFileSync(join(dir, "tactic-new.md"), "utf8");
    expect(raw.endsWith("# A fresh tactic.\n")).toBe(true);
  });

  it("does not false-positive when the preserved body equals the new statement's placeholder", () => {
    // Regression for the guard's false positive: a human sets a strategy body to
    // `# New statement.\n`, then the statement is changed to "New statement." The
    // preserved on-disk body coincidentally equals the NEW statement's generated
    // placeholder. writeNode preserves it byte-for-byte (lossless), so the rewrite
    // must succeed — the old guard threw here, blocking a legitimate update.
    const dir = tempDir();
    const strategy: IntentionNodeInput = {
      id: "strategy-coincidence",
      kind: "strategy",
      statement: "Old statement.",
      owner: "human",
      status: "refining",
    };
    writeNode(dir, strategy);

    const filePath = join(dir, "strategy-coincidence.md");
    const raw = readFileSync(filePath, "utf8");
    const frontmatterAndFence = raw.slice(0, raw.indexOf("\n---\n") + "\n---\n".length);
    const handAuthoredBody = "# New statement.\n";
    writeFileSync(filePath, frontmatterAndFence + handAuthoredBody);

    // Changing the statement to "New statement." makes the preserved body equal
    // the NEW placeholder — the rewrite must not throw, and the body survives.
    expect(() => writeNode(dir, { ...strategy, statement: "New statement." })).not.toThrow();
    const rewritten = readFileSync(filePath, "utf8");
    const rewrittenBody = rewritten.slice(rewritten.indexOf("\n---\n") + "\n---\n".length);
    expect(rewrittenBody).toBe(handAuthoredBody);
    expect(readNode(dir, "strategy-coincidence").statement).toBe("New statement.");
  });
});

describe("assertNoBodyLoss guard", () => {
  // The guard is a defensive backstop: writeNode always feeds it the preserved
  // on-disk body, so its throw branch is unreachable through the public path.
  // These tests exercise it directly to pin its contract — it trips only when a
  // (future, buggy) caller supplies a body that differs from the durable on-disk
  // body, and never on a byte-identical body.
  function existingNode(dir: string, statement: string): IntentionNode {
    writeNode(dir, {
      id: "guarded",
      kind: "strategy",
      statement,
      owner: "human",
      status: "refining",
    });
    return readNode(dir, "guarded");
  }

  it("throws when the supplied body differs from the durable on-disk body", () => {
    const dir = tempDir();
    const node = existingNode(dir, "Statement.");
    const filePath = join(dir, "guarded.md");
    const raw = readFileSync(filePath, "utf8");
    const frontmatterAndFence = raw.slice(0, raw.indexOf("\n---\n") + "\n---\n".length);
    writeFileSync(filePath, frontmatterAndFence + "# Durable authored content.\n\nA plan.\n");

    // A regenerated placeholder written over authored content — the regression
    // the guard exists to catch.
    expect(() => assertNoBodyLoss(filePath, node, `# ${node.statement}\n`)).toThrow(
      /body-preservation regression/
    );
  });

  it("does not throw when the supplied body is byte-identical to the on-disk body", () => {
    const dir = tempDir();
    const node = existingNode(dir, "Statement.");
    const filePath = join(dir, "guarded.md");
    const raw = readFileSync(filePath, "utf8");
    const frontmatterAndFence = raw.slice(0, raw.indexOf("\n---\n") + "\n---\n".length);
    const durableBody = "# Durable authored content.\n\nA plan.\n";
    writeFileSync(filePath, frontmatterAndFence + durableBody);

    expect(() => assertNoBodyLoss(filePath, node, durableBody)).not.toThrow();
  });

  it("returns early (no throw) when no file exists yet", () => {
    const dir = tempDir();
    const node = existingNode(dir, "Statement.");
    const missing = join(dir, "does-not-exist.md");
    expect(() => assertNoBodyLoss(missing, node, "# anything\n")).not.toThrow();
  });
});

describe("write-class boundary", () => {
  // The fence is DIFF-derived: what the writer declares is only its class, and
  // which fields it actually touched is measured from the prior on-disk node
  // against the candidate. These tests drive it through `writeNode` (the seam
  // every writer reaches disk through) and directly through the exported guard.
  function seedTactic(dir: string, id = "fenced"): IntentionNode {
    writeNode(dir, {
      id,
      kind: "tactic",
      statement: "Original statement.",
      owner: "ai",
      status: "raw",
      phase: "implement",
    });
    return readNode(dir, id);
  }

  it("permits a declared orchestration writer changing an orchestration field", () => {
    const dir = tempDir();
    const node = seedTactic(dir);

    expect(() =>
      writeNode(dir, { ...node, phase: "review" }, { writes: "orchestration" })
    ).not.toThrow();
    expect(readNode(dir, "fenced").phase).toBe("review");
  });

  it("refuses a declared orchestration writer changing an intent field, and writes nothing", () => {
    const dir = tempDir();
    const node = seedTactic(dir);
    const before = readFileSync(join(dir, "fenced.md"), "utf8");

    expect(() =>
      writeNode(dir, { ...node, statement: "Rewritten by a router." }, { writes: "orchestration" })
    ).toThrow(/statement — an intent-class field, and this writer declared orchestration/);
    expect(readFileSync(join(dir, "fenced.md"), "utf8")).toBe(before);
  });

  it("refuses a declared intent writer changing an orchestration field", () => {
    const dir = tempDir();
    const node = seedTactic(dir);

    expect(() => writeNode(dir, { ...node, phase: "review" }, { writes: "intent" })).toThrow(
      /phase — an orchestration-class field, and this writer declared intent/
    );
  });

  it("permits a shared field (status, blocked_by) to either class", () => {
    const dir = tempDir();
    const node = seedTactic(dir);

    expect(() =>
      writeNode(dir, { ...node, status: "refining" }, { writes: "orchestration" })
    ).not.toThrow();
    expect(() =>
      writeNode(dir, { ...readNode(dir, "fenced"), blocked_by: ["other"] }, { writes: "intent" })
    ).not.toThrow();
    const written = readNode(dir, "fenced");
    expect(written.status).toBe("refining");
    expect(written.blocked_by).toEqual(["other"]);
  });

  it("leaves an undeclared write unfenced (the read-tolerance window)", () => {
    const dir = tempDir();
    const node = seedTactic(dir);

    // The same cross-class edit the declared writer above was refused for.
    expect(() =>
      writeNode(dir, { ...node, statement: "Rewritten by an undeclared writer." })
    ).not.toThrow();
    expect(readNode(dir, "fenced").statement).toBe("Rewritten by an undeclared writer.");
  });

  it('refuses writes: "shared" — a field classification is not a writer declaration', () => {
    const dir = tempDir();
    const node = seedTactic(dir);

    expect(() =>
      writeNode(dir, { ...node, phase: "review" }, { writes: "shared" })
    ).toThrow(/"shared" is a field classification, not a writer declaration/);
    // Also on a creation, where the diff is empty: an illegal declaration must
    // fail on every write, not only the ones that happen to change a field.
    expect(() =>
      writeNode(dir, { ...node, id: "fenced-new" }, { writes: "shared" })
    ).toThrow(/"shared" is a field classification, not a writer declaration/);
    expect(existsSync(join(dir, "fenced-new.md"))).toBe(false);
  });

  it("does not fence a creation — there is no prior state to clobber", () => {
    const dir = tempDir();
    const created: IntentionNodeInput = {
      id: "fenced-created",
      kind: "tactic",
      statement: "An orchestration writer minted this node.",
      owner: "ai",
      status: "raw",
    };

    expect(() => writeNode(dir, created, { writes: "orchestration" })).not.toThrow();
    expect(readNode(dir, "fenced-created").statement).toBe(created.statement);
  });

  it("exposes assertWriteClassBoundary as a directly callable guard", () => {
    const dir = tempDir();
    const prior = seedTactic(dir);
    const candidate: IntentionNode = { ...prior, rationale: "Authored by a router." };

    expect(() => assertWriteClassBoundary(prior, candidate, "orchestration")).toThrow(
      IntentionSchemaError
    );
    expect(() => assertWriteClassBoundary(prior, candidate, "intent")).not.toThrow();
    // A YAML key reordering is not a change: `eq` is order-independent for
    // object keys, so a re-serialized identical node passes under either class.
    expect(() =>
      assertWriteClassBoundary(prior, { ...prior }, "orchestration")
    ).not.toThrow();
    expect(() => assertWriteClassBoundary(null, candidate, "orchestration")).not.toThrow();
  });

  it("still enforces the kind-scoped durable fence when a class is declared", () => {
    const dir = tempDir();
    writeNode(dir, {
      id: "strategy-fenced",
      kind: "strategy",
      statement: "A durable-layer statement.",
      owner: "human",
      status: "refining",
    });
    const strategy = readNode(dir, "strategy-fenced");

    // `office_hours` is orchestration-class AND a state field — permitted.
    expect(() =>
      writeNode(
        dir,
        {
          ...strategy,
          office_hours: {
            reason: "provision-failed",
            since: "2026-08-30",
            recommendation: null,
            session_type: "other",
          },
        },
        { writes: "orchestration" }
      )
    ).not.toThrow();
    // `pace_exempt` is orchestration-class too, but it is NOT a state field, so
    // the durable fence refuses it on a durable kind whatever the writer's class.
    expect(() =>
      writeNode(dir, { ...readNode(dir, "strategy-fenced"), pace_exempt: true }, { writes: "orchestration" })
    ).toThrow(/pace_exempt — not a state field on the durable-layer kind "strategy"/);
  });
});

describe("writeNode atomicity", () => {
  function probe(id: string): IntentionNodeInput {
    return { id, kind: "tactic", statement: "First statement.", owner: "ai", status: "raw" };
  }

  it("publishes by rename, not in-place truncate", () => {
    const dir = tempDir();
    writeNode(dir, probe("atomic-1"));
    const filePath = join(dir, "atomic-1.md");
    const firstIno = statSync(filePath).ino;

    writeNode(dir, { ...probe("atomic-1"), statement: "Second statement." });

    expect(statSync(filePath).ino).not.toBe(firstIno);
    expect(readNode(dir, "atomic-1").statement).toBe("Second statement.");
  });

  it("leaves no temp residue on success", () => {
    const dir = tempDir();
    writeNode(dir, probe("atomic-2"));
    expect(readdirSync(dir)).toEqual(["atomic-2.md"]);
  });

  it.skipIf(process.getuid?.() === 0)(
    "leaves no residue and no partial file when the publish fails",
    () => {
      const dir = tempDir();
      writeNode(dir, probe("atomic-3"));
      try {
        chmodSync(dir, 0o555);
        expect(() =>
          writeNode(dir, { ...probe("atomic-3"), statement: "Second statement." }),
        ).toThrow();
        expect(readdirSync(dir)).toEqual(["atomic-3.md"]);
        expect(readNode(dir, "atomic-3").statement).toBe("First statement.");
      } finally {
        chmodSync(dir, 0o755);
      }
    },
  );
});

describe("listNodes", () => {
  it("returns every node sorted by id", () => {
    const dir = tempDir();
    const ids = ["c-node", "a-node", "b-node"];
    for (const id of ids) {
      writeNode(dir, {
        id,
        kind: "strategy",
        statement: `Statement for ${id}`,
        owner: "procedure",
        status: "delegated",
      });
    }

    const nodes = listNodes(dir);
    expect(nodes).toHaveLength(3);
    expect(nodes.map((n) => n.id)).toEqual(["a-node", "b-node", "c-node"]);
  });

  it("skips the non-node README.md companion doc", () => {
    const dir = tempDir();
    writeNode(dir, {
      id: "leaf-1",
      kind: "tactic",
      statement: "Do the small thing.",
      owner: "ai",
      status: "raw",
    });
    // A frontmatter-less README.md sits alongside the node files;
    // listNodes must skip it rather than throw on its missing fence.
    writeFileSync(join(dir, "README.md"), "# Intentions store\n\nNot a node.\n");

    const nodes = listNodes(dir);
    expect(nodes.map((n) => n.id)).toEqual(["leaf-1"]);
  });

  /** Seed two readable nodes, `good-a` and `good-b`. */
  function seedGoodNodes(dir: string): void {
    for (const id of ["good-a", "good-b"]) {
      writeNode(dir, {
        id,
        kind: "tactic",
        statement: `Statement for ${id}`,
        owner: "ai",
        status: "raw",
      });
    }
  }

  /**
   * Write a node, then truncate its file just past the opening fence — an
   * opening `---` with no closing one, the shape a partially-written file has.
   */
  function seedTruncatedNode(dir: string, id: string): void {
    writeNode(dir, { id, kind: "tactic", statement: `Statement for ${id}`, owner: "ai", status: "raw" });
    const filePath = join(dir, `${id}.md`);
    const raw = readFileSync(filePath, "utf8");
    const closeIndex = raw.indexOf("\n---\n");
    writeFileSync(filePath, raw.slice(0, closeIndex));
  }

  it("skips a 0-byte node file and warns", () => {
    const dir = tempDir();
    seedGoodNodes(dir);
    // A 0-byte `<id>.md` is exactly what an interrupted non-atomic write left
    // behind on 2026-08-01, stalling the whole fleet.
    writeFileSync(join(dir, "corrupt.md"), "");

    const { result, warnings } = captureStderr(() => listNodes(dir));
    expect(result.map((n) => n.id)).toEqual(["good-a", "good-b"]);
    expect(warnings).toContain("corrupt.md");
  });

  it("skips a truncated node file", () => {
    const dir = tempDir();
    seedGoodNodes(dir);
    seedTruncatedNode(dir, "truncated");

    const { result, warnings } = captureStderr(() => listNodes(dir));
    expect(result.map((n) => n.id)).toEqual(["good-a", "good-b"]);
    expect(warnings).toContain("truncated.md");
  });

  it("listNodesResilient reports the failures", () => {
    const dir = tempDir();
    seedGoodNodes(dir);
    writeFileSync(join(dir, "corrupt.md"), "");
    seedTruncatedNode(dir, "truncated");

    const { nodes, failures } = listNodesResilient(dir);
    expect(nodes.map((n) => n.id)).toEqual(["good-a", "good-b"]);
    expect(failures.map((f) => f.id)).toEqual(["corrupt", "truncated"]);
  });

  it("listNodesStrict throws and names every unreadable file", () => {
    const dir = tempDir();
    seedGoodNodes(dir);
    writeFileSync(join(dir, "corrupt.md"), "");
    seedTruncatedNode(dir, "truncated");

    let message = "";
    try {
      listNodesStrict(dir);
      throw new Error("listNodesStrict should have thrown");
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
    expect(message).toContain("corrupt.md");
    expect(message).toContain("truncated.md");
  });
});

describe("id path safety", () => {
  // Mirrors graph-commit's own id validation exactly (packages/intentionsutil/
  // scripts/graph-commit, the `case "$id" in` block): every node id passes
  // through store.ts's assertPathSafeId via write-node.ts BEFORE graph-commit
  // ever sees it, so the two must agree on the accept/reject boundary or
  // graph-commit's relaxed check is unreachable in practice.
  function node(id: string): IntentionNodeInput {
    return { id, kind: "tactic", statement: "id safety probe", owner: "ai", status: "raw" };
  }

  it("accepts an id with a '..' substring that isn't the exact id '..'", () => {
    const dir = tempDir();
    writeNode(dir, node("v1..v2-migration"));
    expect(readNode(dir, "v1..v2-migration").id).toBe("v1..v2-migration");
  });

  it("rejects the exact ids '.' and '..'", () => {
    const dir = tempDir();
    expect(() => writeNode(dir, node("."))).toThrow();
    expect(() => writeNode(dir, node(".."))).toThrow();
  });

  it("rejects ids containing a path separator, including a leading '../'", () => {
    const dir = tempDir();
    expect(() => writeNode(dir, node("../evil"))).toThrow();
    expect(() => writeNode(dir, node("a/b"))).toThrow();
    expect(() => writeNode(dir, node("a\\b"))).toThrow();
  });
});
