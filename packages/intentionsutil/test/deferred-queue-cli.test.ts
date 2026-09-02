// Round-trip coverage for the deferred-queue CLI, following
// merge-node-cli.test.ts's shape: the pure-function tests import the
// exported helper directly (`deriveDeferredQueue`), and a small spawned block
// covers what only a real process boundary can pin — argv parsing, the
// three-way exit-code contract, and the JSON stdout shape.

import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stringify } from "yaml";
import { describe, expect, it } from "vitest";
import { deriveDeferredQueue } from "../scripts/deferred-queue.js";
import type { IntentionNode } from "../src/schema.js";

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
    clarifications: partial.clarifications ?? [],
    tooling_goals: partial.tooling_goals ?? [],
    success_signal: partial.success_signal ?? null,
    attention: partial.attention ?? null,
    phase: partial.phase ?? null,
    execution: partial.execution ?? null,
    validates: partial.validates ?? [],
    blocked_by: partial.blocked_by ?? [],
    superseded_by: partial.superseded_by ?? [],
    supersession_expiry: partial.supersession_expiry ?? null,
    office_hours: partial.office_hours ?? null,
    pace_exempt: partial.pace_exempt ?? false,
    rounds: partial.rounds ?? null,
    attributes: partial.attributes ?? {},
  };
}

/** Write a node fixture directly to `dir/<id>.md`, body appended verbatim. */
function seed(dir: string, node: IntentionNode, body = `# ${node.statement}\n`): void {
  writeFileSync(join(dir, `${node.id}.md`), `---\n${stringify(node)}---\n${body}`);
}

function fixtureDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "deferred-queue-cli-"));
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("deriveDeferredQueue (fs-reading core helper)", () => {
  it("derives items and a node count from a small on-disk store", () => {
    const dir = fixtureDir();
    seed(
      dir,
      anode({
        id: "strategy-x",
        kind: "strategy",
        clarifications: [
          {
            question: "q1",
            answer: "(decision: deferred, delegation-anthropic-claude, 2026-08-30)",
          },
        ],
      }),
    );
    seed(dir, anode({ id: "tactic-y", kind: "tactic" }));

    const { queue, nodeCount } = deriveDeferredQueue(dir);

    expect(nodeCount).toBe(2);
    expect(queue.items).toHaveLength(1);
    expect(queue.items[0]?.nodeId).toBe("strategy-x");
    expect(queue.defects).toEqual([]);
  });

  it("returns a zero-item queue (not a throw) over a store with no deferred stamps", () => {
    const dir = fixtureDir();
    seed(dir, anode({ id: "tactic-y", kind: "tactic" }));

    const { queue, nodeCount } = deriveDeferredQueue(dir);

    expect(nodeCount).toBe(1);
    expect(queue.items).toEqual([]);
  });
});

// --- the CLI's process contract, which only a SPAWNED run can observe ------

const scriptsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts");

function runCli(args: string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx/esm", join(scriptsDir, "deferred-queue.ts"), ...args],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe("deferred-queue CLI", () => {
  it("exits 0 with a parseable --json payload over a store carrying one deferred stamp", () => {
    const dir = fixtureDir();
    seed(
      dir,
      anode({
        id: "strategy-x",
        kind: "strategy",
        clarifications: [
          {
            question: "q1",
            answer: "(decision: deferred, delegation-anthropic-claude, 2026-08-30)",
          },
        ],
      }),
    );

    const run = runCli(["--dir", dir, "--json"]);

    expect(run.status).toBe(0);
    const parsed = JSON.parse(run.stdout) as {
      items: { nodeId: string }[];
      defects: string[];
      nodeCount: number;
    };
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0]?.nodeId).toBe("strategy-x");
    expect(parsed.nodeCount).toBe(1);
    // The explicit-zero-style summary line always lands on stderr, even on a
    // non-zero run — it is the "reached a verdict" signal, not a defect.
    expect(run.stderr).toContain("1 deferred dispositions across 1 nodes");
  });

  it("exits 0 and prints the explicit zero line — a zero-item run is not a silent vacuous pass", () => {
    const dir = fixtureDir();
    seed(dir, anode({ id: "tactic-y", kind: "tactic" }));

    const run = runCli(["--dir", dir, "--json"]);

    expect(run.status).toBe(0);
    const parsed = JSON.parse(run.stdout) as { items: unknown[]; nodeCount: number };
    expect(parsed.items).toEqual([]);
    expect(parsed.nodeCount).toBe(1);
    expect(run.stderr).toContain("0 deferred dispositions across 1 nodes");
  });

  it("prints a human-readable report without --json", () => {
    const dir = fixtureDir();
    seed(
      dir,
      anode({
        id: "strategy-x",
        kind: "strategy",
        clarifications: [
          {
            question: "q1",
            answer: "(decision: deferred, delegation-anthropic-claude, 2026-08-30)",
          },
        ],
      }),
    );

    const run = runCli(["--dir", dir]);

    expect(run.status).toBe(0);
    expect(run.stdout).toContain("1 deferred dispositions across 1 nodes");
    expect(run.stdout).toContain("strategy-x");
    // Not JSON — the human report is plain text.
    expect(() => JSON.parse(run.stdout)).toThrow();
  });

  it("exits 3 with no JSON on stdout when --dir is missing", () => {
    const run = runCli(["--json"]);

    expect(run.status).toBe(3);
    expect(run.stdout).toBe("");
    expect(run.stderr).toContain("--dir requires a value argument");
  });

  it("exits 3 with no JSON on stdout when --dir points at a nonexistent path", () => {
    const run = runCli(["--dir", join(fixtureDir(), "does-not-exist"), "--json"]);

    expect(run.status).toBe(3);
    expect(run.stdout).toBe("");
  });
});
