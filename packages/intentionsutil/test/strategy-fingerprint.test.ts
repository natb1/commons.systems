import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { writeNode } from "../src/store.js";
import { strategyFingerprint } from "../src/router.js";
import type { IntentionNode } from "../src/schema.js";
import { strategyFingerprintFor } from "../scripts/strategy-fingerprint.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "strategy-fingerprint-"));
}

/** Minimal full IntentionNode fixture (mirrors router.test.ts's `anode`). */
function anode(partial: Partial<IntentionNode> & { id: string; kind: string }): IntentionNode {
  return {
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
    superseded_by: partial.superseded_by ?? [],
    supersession_expiry: partial.supersession_expiry ?? null,
    office_hours: partial.office_hours ?? null,
    pace_exempt: partial.pace_exempt ?? false,
    rounds: partial.rounds ?? null,
    attributes: partial.attributes ?? {},
  };
}

function seed(dir: string, node: IntentionNode): void {
  writeNode(dir, node);
}

describe("strategyFingerprintFor", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a 64-hex fingerprint for a seeded strategy node", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "strategy-a", kind: "strategy", statement: "Own the substrate." }));
    const fp = strategyFingerprintFor(dir, "strategy-a");
    expect(fp).toMatch(/^[0-9a-f]{64}$/);
  });

  it("matches strategyFingerprint(strategy) called directly on the same node", () => {
    const dir = tempDir();
    const node = anode({ id: "strategy-a", kind: "strategy", statement: "Own the substrate." });
    seed(dir, node);
    const fp = strategyFingerprintFor(dir, "strategy-a");
    expect(fp).toBe(strategyFingerprint(node));
  });

  it("is unchanged by a state-only edit (reading, office_hours)", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "strategy-a", kind: "strategy", statement: "Own the substrate." }));
    const fp1 = strategyFingerprintFor(dir, "strategy-a");

    seed(
      dir,
      anode({
        id: "strategy-a",
        kind: "strategy",
        statement: "Own the substrate.",
        reading: "holding at threshold",
        office_hours: { reason: "author park", since: "2026-07-18", recommendation: null, session_type: "other" },
      }),
    );
    const fp2 = strategyFingerprintFor(dir, "strategy-a");
    expect(fp2).toBe(fp1);
  });

  it("changes on a substance edit (statement)", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "strategy-a", kind: "strategy", statement: "Own the substrate." }));
    const fp1 = strategyFingerprintFor(dir, "strategy-a");

    seed(dir, anode({ id: "strategy-a", kind: "strategy", statement: "Own a different substrate." }));
    const fp2 = strategyFingerprintFor(dir, "strategy-a");
    expect(fp2).not.toBe(fp1);
  });

  it("exits non-zero for a non-strategy id", () => {
    const dir = tempDir();
    seed(dir, anode({ id: "tactic-a", kind: "tactic", phase: "implement" }));
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    expect(() => strategyFingerprintFor(dir, "tactic-a")).toThrow(/process\.exit\(1\)/);
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(stderrSpy).toHaveBeenCalled();
  });

  it("exits non-zero for a missing/nonexistent id", () => {
    const dir = tempDir();
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    expect(() => strategyFingerprintFor(dir, "strategy-gone")).toThrow(/process\.exit\(1\)/);
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(stderrSpy).toHaveBeenCalled();
  });
});
