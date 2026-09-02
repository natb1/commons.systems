// check-registration-census — the read-only observe-tier drain gauge for the
// unit-6 migration: register the incumbent check corpus into
// check-registrations.ts, one script at a time. This census reports what
// still remains undone on BOTH halves of that migration:
//
//   Part 1 — every incumbent check script found on disk (the corpus roots
//   below) that is NOT registered in `check-registrations.ts`'s default
//   registry.
//
//   Part 2 — every REGISTERED check whose criterion id is not actually
//   recorded anywhere in the graph (a registry defect: a renamed criterion, a
//   typo, a criterion authored on the wrong node).
//
// It ALWAYS exits 0 — this is a report, never a gate (mirrors
// write-class-census.ts's own always-0 contract). It empties as registration
// proceeds: Part 1 shrinks as more corpus scripts get a CheckDeclaration,
// and Part 2 shrinks as the criteria those declarations name get recorded.
//
// Usage:
//   node --import tsx/esm packages/intentionsutil/scripts/check-registration-census.ts
//
// `npx tsx` is not an alternative spelling here — its CLI wrapper opens an IPC
// socket at startup that the sandbox's network-namespace isolation denies, so
// it dies with `listen EPERM` before the script runs at all
// (.claude/rules/sandbox.md, "npx tsx"). `node --import tsx/esm` loads the same
// loader in-process and opens no socket.
//
// No flags, no arguments: like write-class-census.ts, the script locates the
// repo it lives in from its own `import.meta.url`
// (packages/intentionsutil/scripts/.. -> packages/intentionsutil, then ../..
// -> the repo root), so it works the same from any cwd. It is read-only —
// reads script filenames under the corpus roots and node frontmatter under
// intentions/, and never writes a byte anywhere.
//
// THE CORPUS ROOTS. A script counts as an incumbent "check" if it matches one
// of these patterns under these roots, or is one of the two named TypeScript
// entries — the same enumeration tactic-migration-frontier-projection's
// Unit 6 measured against disk on 2026-09-01:
//
//   .github/scripts/check-*.sh                (the `test-check-*.sh` harness
//                                               siblings start with `test-`,
//                                               not `check-`, so the glob
//                                               excludes them automatically)
//   .claude/skills/dispatch-propagate/scripts/lint-*.sh
//   packages/intentionsutil/scripts/validate-graph.ts   (named, not globbed —
//   packages/intentionsutil/scripts/write-class-census.ts   many other scripts
//                                               live in that directory that are
//                                               not checks)
//
// A script's expected registry id is its filename with the extension
// stripped (`check-firestore-query-bounds.sh` -> `check-firestore-query-bounds`),
// which is exactly how every id in `check-registrations.ts` is spelled — so
// Part 1 is a plain set-difference between the corpus and
// `registeredCheckNames()`, never a hand-maintained mapping that could drift
// from either side.

import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registeredCheckNames, buildDefaultCheckRegistry } from "../src/check-registrations.js";
import { parseCriteria, standingCriteria } from "../src/criteria.js";
import { listNodesStrict } from "../src/store.js";

// --- Path resolution (from this script's own location, not cwd) ------------

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = join(SCRIPT_DIR, "..");
const REPO_ROOT = join(PACKAGE_ROOT, "..", "..");
const INTENTIONS_DIR = join(REPO_ROOT, "intentions");

// --- Part 1: the on-disk corpus ----------------------------------------------

/** Basenames matching `prefix*.sh` directly under `dir`, extension stripped. */
function shellCheckIds(dir: string, prefix: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.startsWith(prefix) && f.endsWith(".sh"))
    .map((f) => f.slice(0, -".sh".length));
}

/** The two named TypeScript corpus entries — not globbed; see header. */
const NAMED_TS_CHECK_IDS = ["validate-graph", "write-class-census"] as const;

function corpusCheckIds(repoRoot: string): string[] {
  const ids = [
    ...shellCheckIds(join(repoRoot, ".github/scripts"), "check-"),
    ...shellCheckIds(join(repoRoot, ".claude/skills/dispatch-propagate/scripts"), "lint-"),
    ...NAMED_TS_CHECK_IDS,
  ];
  return [...new Set(ids)].sort();
}

// --- Part 2: registered checks vs. recorded criteria -------------------------

/** Every criterion id recorded anywhere in the graph: the standing set union every node's own. */
function allRecordedCriterionIds(): ReadonlySet<string> {
  const nodes = listNodesStrict(INTENTIONS_DIR);
  const ids = new Set<string>();
  for (const c of standingCriteria(nodes)) ids.add(c.id);
  for (const node of nodes) {
    for (const c of parseCriteria(node)) ids.add(c.id);
  }
  return ids;
}

// --- Report -------------------------------------------------------------------

function render(): string {
  const registry = buildDefaultCheckRegistry();
  const registeredIds = registeredCheckNames();
  const corpusIds = corpusCheckIds(REPO_ROOT);
  const unregistered = corpusIds.filter((id) => !registeredIds.has(id));

  const recordedCriteria = allRecordedCriterionIds();
  const unresolvedBindings = [...registeredIds]
    .sort()
    .map((id) => ({ id, criterion: registry.resolve(id).criterion }))
    .filter(({ criterion }) => !recordedCriteria.has(criterion));

  const lines: string[] = [];
  lines.push("=== check-registration-census ===");
  lines.push("(observe-tier report — read-only, always exits 0; the drain gauge for unit 6's registration migration)");
  lines.push("");
  lines.push("-- Part 1: on-disk check scripts not yet registered --");
  lines.push(`corpus scripts found: ${corpusIds.length}`);
  lines.push(`registered: ${registeredIds.size}`);
  lines.push(`unregistered: ${unregistered.length}`);
  lines.push(unregistered.length === 0 ? "  (none)" : unregistered.map((id) => `  ${id}`).join("\n"));
  lines.push("");
  lines.push("-- Part 2: registered checks whose criterion is not recorded in the graph --");
  lines.push(`registered checks: ${registeredIds.size}`);
  lines.push(`unresolved bindings: ${unresolvedBindings.length}`);
  lines.push(
    unresolvedBindings.length === 0
      ? "  (none)"
      : unresolvedBindings.map(({ id, criterion }) => `  ${id} -> ${criterion}`).join("\n"),
  );
  lines.push("");
  lines.push("=== end ===");
  return lines.join("\n");
}

function main(): void {
  process.stdout.write(render() + "\n");
  process.exit(0);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
