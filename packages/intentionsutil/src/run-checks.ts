/**
 * run-checks: the pure sweep-and-summarize logic behind
 * `scripts/run-registered-checks.ts` (unit 7,
 * `tactic-migration-frontier-projection`).
 *
 * SPLIT, LIKE `compute-freshness.ts`: `runRegisteredChecks` executes each
 * registered check against a live `CheckContext` (so it is not fs/process
 * free — a check's own `run()` shells out), but `summarizeCheckRun` is a pure
 * function of the outcomes it produces — exit-code and line-formatting logic
 * that is fully unit-testable with hand-built `CheckRunOutcome[]` fixtures,
 * exactly as `checks.test.ts` already builds fake `CheckDeclaration`s. The CLI
 * is a thin wrapper that wires the registry, the real `CheckContext`, the real
 * `criteriaById` (`criteriaInForce`, `frontier-reconciliation.ts`) and the real
 * `StoreHighWater`, then prints `summarizeCheckRun`'s lines and exits with its
 * code.
 *
 * TWO ENFORCEMENT POSTURES, ONE RULE — the SAME shape as `validate-graph.ts`'s
 * `--strict-sensors` (`:193-269` there; read that block's comment on the
 * 2026-08-14 outage before touching this one). `deriveTier` (`checks.ts`)
 * THROWS when a registered check's `criterion` id is not in the effective
 * criteria set — a registry defect (a renamed criterion, a typo, a check
 * registered before its criterion was transcribed). That is exactly the
 * outage class: denying every writer over a defect that says nothing about the
 * content being checked. So by DEFAULT (`strictRegistry: false`, the posture
 * `run-lint.sh`'s unconditional block uses) an unbound check is caught,
 * reported as a non-blocking `unresolved`-tier row, and the sweep continues.
 * Under `strictRegistry: true` the same defect is left to throw and crash the
 * whole run — the stricter posture for a context that wants the registry
 * defect to be loud (mirroring how `--strict-sensors` is reserved for
 * `unit-tests.yml`'s `graph-validate` job on `main`, never the write-path
 * guard). SAME RULE, SAME CODE: one `deriveTier` call, one `try/catch`, a
 * boolean selecting whether the catch rethrows.
 *
 * A CHECK'S OWN `run()` THROWING is a separate failure mode from a tier
 * defect, and is handled independently: it is always caught and reported as
 * an ordinary failing result (never a crash, in either posture), because a
 * check throwing is a fact about THAT check's content, not about the
 * registry — the same reasoning that keeps `runShell`
 * (`check-registrations.ts`) from ever throwing on a non-zero exit.
 */
import { deriveTier, type CheckContext, type CheckRegistry, type CheckTier, type HighWaterSource } from "./checks.js";
import type { Criterion } from "./criteria.js";

/** `CheckTier` plus the registry-defect case: a criterion binding that could not be resolved. */
export type CheckRunTier = CheckTier | "unresolved";

export interface CheckRunOutcome {
  id: string;
  tier: CheckRunTier;
  ok: boolean;
  detail: string;
}

export interface RunRegisteredChecksOptions {
  /**
   * Selects the enforcement posture for an unbound-criterion registry defect.
   * `false` (default): caught, reported as a non-blocking `unresolved` row.
   * `true`: rethrown, crashing the whole run. See the module header.
   */
  strictRegistry?: boolean;
}

/**
 * Run every registered check against `ctx`, deriving each one's tier from
 * `criteriaById` and `highWater`. Never throws in the default posture; see the
 * module header for the `strictRegistry` posture that does.
 */
export function runRegisteredChecks(
  registry: CheckRegistry,
  ctx: CheckContext,
  criteriaById: ReadonlyMap<string, Criterion>,
  highWater: HighWaterSource,
  opts: RunRegisteredChecksOptions = {},
): CheckRunOutcome[] {
  const strict = opts.strictRegistry ?? false;
  const outcomes: CheckRunOutcome[] = [];
  for (const id of [...registry.names()].sort()) {
    const check = registry.resolve(id);
    let tier: CheckRunTier;
    try {
      tier = deriveTier(check, criteriaById, highWater);
    } catch (err) {
      if (strict) throw err;
      outcomes.push({
        id,
        tier: "unresolved",
        ok: false,
        detail: `registry defect (tier could not be derived, treated as non-blocking): ${
          err instanceof Error ? err.message : String(err)
        }`,
      });
      continue;
    }
    let ok: boolean;
    let detail: string;
    try {
      const result = check.run(ctx);
      ok = result.ok;
      detail = result.detail;
    } catch (err) {
      // A check's own run() throwing is a fact about that check, not the
      // registry — always caught, in both postures, and reported as an
      // ordinary failing result rather than crashing the sweep.
      ok = false;
      detail = `check threw rather than returning a result: ${err instanceof Error ? err.message : String(err)}`;
    }
    outcomes.push({ id, tier, ok, detail });
  }
  return outcomes;
}

export interface CheckRunSummary {
  lines: string[];
  exitCode: number;
}

/**
 * Pure: format `outcomes` into one `tier verdict id — detail` line each, and
 * derive the exit code — non-zero iff at least one GATING-tier outcome
 * failed. An observe (or `unresolved`) failure prints and never blocks.
 *
 * EMPTY REGISTRY: exits 0 with one explicit "0 checks registered" line, never
 * a silent vacuous pass — the same `CHECKED == 0` discipline
 * `run-typecheck.sh:287-293` already models ("this run verified nothing — it
 * is not a pass").
 */
export function summarizeCheckRun(outcomes: readonly CheckRunOutcome[]): CheckRunSummary {
  if (outcomes.length === 0) {
    return {
      lines: ["0 checks registered — nothing was verified; this is not a pass."],
      exitCode: 0,
    };
  }
  const lines = outcomes.map((o) => `${o.tier} ${o.ok ? "PASS" : "FAIL"} ${o.id} — ${o.detail}`);
  const gatingFailed = outcomes.some((o) => o.tier === "gating" && !o.ok);
  return { lines, exitCode: gatingFailed ? 1 : 0 };
}
