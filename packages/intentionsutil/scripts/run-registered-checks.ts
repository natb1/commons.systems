// run-registered-checks — the tier-aware runner (unit 7,
// tactic-migration-frontier-projection): sweeps every check registered in
// check-registrations.ts, derives each one's tier via the sanction gate
// (deriveTier, checks.ts), and exits non-zero ONLY when a GATING check
// failed. An observe-tier failure prints and never blocks — with every
// registered criterion at authority "deferred" today (unit 6's bootstrap
// census), every check derives observe by construction, so this runner is
// green on day one regardless of what any individual check reports.
//
// Usage:
//   node --import tsx/esm packages/intentionsutil/scripts/run-registered-checks.ts [intentionsDir] [--strict-registry]
//
// Never `npx tsx`: that spelling dies with `listen EPERM` under the sandbox
// before it parses its arguments (.claude/rules/sandbox.md).
//
// Defaults to `intentions` (relative to cwd) when no directory is given, and
// resolves it to an absolute path so CheckContext.storeDir is always absolute
// regardless of cwd — checks.ts's own doc contract for that field.
//
// --strict-registry selects the STRICT posture of the same two-posture rule
// validate-graph.ts's --strict-sensors selects (see that script's :193-269 and
// src/run-checks.ts's module header): a registered check whose criterion id
// does not resolve in the effective criteria set is a REGISTRY DEFECT.
// Default posture: caught, printed as a non-blocking "unresolved"-tier row,
// exit code unaffected. --strict-registry: rethrown, crashing this run. The
// unconditional run-lint.sh block below uses the DEFAULT posture — the same
// reasoning validate-graph.ts's own header records for why denying the write
// path over a registry defect (2026-08-14) is the wrong failure mode for a
// gate every writer in the repo passes through.

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { listNodes } from "../src/store.js";
import { criteriaInForce } from "../src/frontier-reconciliation.js";
import type { IntentionNode } from "../src/schema.js";
import type { Criterion } from "../src/criteria.js";
import { buildDefaultCheckRegistry } from "../src/check-registrations.js";
import { StoreHighWater } from "../src/high-water.js";
import { runRegisteredChecks, summarizeCheckRun } from "../src/run-checks.js";
import type { CheckContext } from "../src/checks.js";

// The script lives at packages/intentionsutil/scripts/run-registered-checks.ts,
// so the repo root is three directories up — resolved from this file's own
// location, never from cwd (same rule every sibling CLI here follows).
const scriptDir = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = dirname(dirname(dirname(scriptDir)));

function parseArgs(argv: string[]): { dir: string; strictRegistry: boolean } {
  let dir: string | undefined;
  let strictRegistry = false;
  for (const arg of argv) {
    if (arg === "--strict-registry") {
      strictRegistry = true;
    } else if (dir === undefined) {
      dir = arg;
    } else {
      process.stderr.write(`run-registered-checks: unexpected argument: ${arg}\n`);
      process.exit(2);
    }
  }
  return { dir: dir ?? "intentions", strictRegistry };
}

function criteriaByIdMap(nodes: readonly IntentionNode[]): Map<string, Criterion> {
  const byId = new Map<string, Criterion>();
  for (const [id, homed] of criteriaInForce(nodes)) {
    byId.set(id, homed.criterion);
  }
  return byId;
}

function main(): void {
  const { dir, strictRegistry } = parseArgs(process.argv.slice(2));
  const storeDir = resolve(dir);
  const nodes = listNodes(storeDir);
  const registry = buildDefaultCheckRegistry();
  const criteriaById = criteriaByIdMap(nodes);
  const highWater = new StoreHighWater(storeDir);
  const ctx: CheckContext = { repoRoot: REPO_ROOT, storeDir, nodes };
  const outcomes = runRegisteredChecks(registry, ctx, criteriaById, highWater, { strictRegistry });
  const { lines, exitCode } = summarizeCheckRun(outcomes);
  process.stdout.write(`${lines.join("\n")}\n`);
  process.exit(exitCode);
}

main();
