import { describe, expect, it } from "vitest";
import { IntentionSchemaError } from "../src/errors.js";
import {
  CheckRegistry,
  type CheckContext,
  type CheckDeclaration,
  type CheckResult,
  type HighWaterSource,
} from "../src/checks.js";
import type { Criterion, CriterionAuthority } from "../src/criteria.js";
import { runRegisteredChecks, summarizeCheckRun, type CheckRunOutcome } from "../src/run-checks.js";

const CTX: CheckContext = { repoRoot: "/repo", storeDir: "/repo/intentions", nodes: [] };

function check(partial: Partial<CheckDeclaration> & { id: string }): CheckDeclaration {
  return {
    id: partial.id,
    criterion: partial.criterion ?? "crit",
    describe: partial.describe ?? `Describes ${partial.id}`,
    run: partial.run ?? (() => result()),
  };
}

function result(partial: Partial<CheckResult> = {}): CheckResult {
  return { ok: partial.ok ?? true, detail: partial.detail ?? "ok", entries: partial.entries ?? [] };
}

function criterion(id: string, authority: CriterionAuthority): Criterion {
  return { id, statement: `Statement for ${id}`, class: "functional", authority, recorded: "2026-09-01" };
}

function criteriaMap(...criteria: Criterion[]): ReadonlyMap<string, Criterion> {
  return new Map(criteria.map((c) => [c.id, c]));
}

function fakeHighWater(...promoted: string[]): HighWaterSource {
  const set = new Set(promoted);
  return { has: (id) => set.has(id) };
}

describe("runRegisteredChecks", () => {
  it("derives observe for a deferred criterion regardless of high-water", () => {
    const registry = new CheckRegistry();
    registry.register(check({ id: "c", criterion: "crit" }));
    const outcomes = runRegisteredChecks(
      registry,
      CTX,
      criteriaMap(criterion("crit", "deferred")),
      fakeHighWater("c"),
    );
    expect(outcomes).toEqual([{ id: "c", tier: "observe", ok: true, detail: "ok" }]);
  });

  it("derives gating for a ratified + high-watered check", () => {
    const registry = new CheckRegistry();
    registry.register(check({ id: "c", criterion: "crit" }));
    const outcomes = runRegisteredChecks(
      registry,
      CTX,
      criteriaMap(criterion("crit", "ratified")),
      fakeHighWater("c"),
    );
    expect(outcomes[0].tier).toBe("gating");
  });

  it("sweeps every registered check in sorted id order", () => {
    const registry = new CheckRegistry();
    registry.register(check({ id: "b-check", criterion: "crit" }));
    registry.register(check({ id: "a-check", criterion: "crit" }));
    const outcomes = runRegisteredChecks(
      registry,
      CTX,
      criteriaMap(criterion("crit", "deferred")),
      fakeHighWater(),
    );
    expect(outcomes.map((o) => o.id)).toEqual(["a-check", "b-check"]);
  });

  it("default posture: an unbound criterion is caught as 'unresolved', not thrown", () => {
    const registry = new CheckRegistry();
    registry.register(check({ id: "c", criterion: "missing-crit" }));
    const outcomes = runRegisteredChecks(
      registry,
      CTX,
      criteriaMap(criterion("crit", "ratified")),
      fakeHighWater(),
    );
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0].tier).toBe("unresolved");
    expect(outcomes[0].ok).toBe(false);
    expect(outcomes[0].detail).toMatch(/registry defect/);
    expect(outcomes[0].detail).toMatch(/missing-crit/);
  });

  it("strictRegistry posture: an unbound criterion THROWS rather than being caught", () => {
    const registry = new CheckRegistry();
    registry.register(check({ id: "c", criterion: "missing-crit" }));
    expect(() =>
      runRegisteredChecks(
        registry,
        CTX,
        criteriaMap(criterion("crit", "ratified")),
        fakeHighWater(),
        { strictRegistry: true },
      ),
    ).toThrow(IntentionSchemaError);
  });

  it("a check's own run() throwing is always caught (both postures) as an ordinary failing result", () => {
    const registry = new CheckRegistry();
    registry.register(
      check({
        id: "c",
        criterion: "crit",
        run: () => {
          throw new Error("boom");
        },
      }),
    );
    const outcomes = runRegisteredChecks(
      registry,
      CTX,
      criteriaMap(criterion("crit", "deferred")),
      fakeHighWater(),
      { strictRegistry: true },
    );
    expect(outcomes[0].ok).toBe(false);
    expect(outcomes[0].tier).toBe("observe");
    expect(outcomes[0].detail).toMatch(/threw/);
    expect(outcomes[0].detail).toMatch(/boom/);
  });
});

describe("summarizeCheckRun", () => {
  it("empty registry: exit 0 with an explicit '0 checks registered' line, never a silent vacuous pass", () => {
    const { lines, exitCode } = summarizeCheckRun([]);
    expect(exitCode).toBe(0);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/0 checks registered/);
    expect(lines[0]).toMatch(/not a pass/);
  });

  it("a gating-tier failure => non-zero exit", () => {
    const outcomes: CheckRunOutcome[] = [{ id: "c", tier: "gating", ok: false, detail: "red" }];
    expect(summarizeCheckRun(outcomes).exitCode).toBe(1);
  });

  it("an observe-tier failure => exit 0 (never blocks)", () => {
    const outcomes: CheckRunOutcome[] = [{ id: "c", tier: "observe", ok: false, detail: "red" }];
    expect(summarizeCheckRun(outcomes).exitCode).toBe(0);
  });

  it("an 'unresolved' tier (a caught registry defect) => exit 0 (never blocks)", () => {
    const outcomes: CheckRunOutcome[] = [{ id: "c", tier: "unresolved", ok: false, detail: "defect" }];
    expect(summarizeCheckRun(outcomes).exitCode).toBe(0);
  });

  it("a gating PASS alongside an observe FAIL still exits 0", () => {
    const outcomes: CheckRunOutcome[] = [
      { id: "a", tier: "gating", ok: true, detail: "ok" },
      { id: "b", tier: "observe", ok: false, detail: "red" },
    ];
    expect(summarizeCheckRun(outcomes).exitCode).toBe(0);
  });

  it("formats one 'tier verdict id — detail' line per outcome", () => {
    const outcomes: CheckRunOutcome[] = [{ id: "my-check", tier: "observe", ok: false, detail: "2 remain" }];
    expect(summarizeCheckRun(outcomes).lines).toEqual(["observe FAIL my-check — 2 remain"]);
  });
});
