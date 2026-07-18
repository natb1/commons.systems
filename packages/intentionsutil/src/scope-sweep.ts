import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readNodeBody } from "./store.js";
import { tacticScopeFingerprint } from "./router.js";
import type { IntentionNode } from "./schema.js";

// Pre-selection scope-staleness sweep (tactic-tick-scriptable-then-spawn Unit 1).
//
// The scope-of-custody gate that today trips at worker-launch time
// (dispatch-graph-execute's exit-13, mirrored by check-node-selection.ts's
// check 5) is a metadata-only disposition: a stale tactic is demoted back to
// `implement`, no worker runs. Detecting it at launch means the demote silently
// consumes a SPAWN_N slot. This pure enumerator lets a pre-selection sweep find
// every such tactic BEFORE the worker-group spawn, so the demote is dispatched
// as a scriptable non-worker disposition instead.
//
// It is the read-only enumeration half only: it computes the set of tactic ids a
// sweep must demote and returns them. It performs no graph mutation, no
// liveness gathering, and no demote — those belong to the sweep script that
// calls this (later units).

/**
 * The phases whose scope is inherited from a prior phase and therefore chained
 * to the phase-start stamp — fix/qa/review. Mirrors `SCOPE_CHAINED_PHASES` in
 * `packages/intentionsutil/scripts/check-node-selection.ts` (the worker-start
 * gate's check 5): `implement` re-establishes custody against the latest scope,
 * and `main-qa` is post-merge, so neither is scope-chained.
 */
const SCOPE_CHAINED_PHASES = new Set(["fix", "qa", "review"]);

/** The phase-start stamp file for a node id: `<stamp-dir>/<id>.scope-fingerprint`. */
function stampPath(stampDir: string, id: string): string {
  return join(stampDir, `${id}.scope-fingerprint`);
}

/**
 * Read the stamped scope fingerprint for `id` — the first whitespace-delimited
 * field of the stamp file's first line (format `<fingerprint> <origin-main-sha>`,
 * mirroring check-node-selection.ts:210-233 and demote-node-to-implement's
 * `awk 'NR==1{print $2}'` sha read). Returns `null` when the stamp file is
 * missing (ENOENT) — the bootstrap fail-open case — or its first line has no
 * field. Any other read error propagates.
 */
function readStampedFingerprint(stampDir: string, id: string): string | null {
  let raw: string;
  try {
    raw = readFileSync(stampPath(stampDir, id), "utf8");
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "ENOENT") {
      return null;
    }
    throw err;
  }
  const firstField = raw.split("\n")[0].trim().split(/\s+/)[0];
  return firstField === "" ? null : firstField;
}

/**
 * Enumerate the tactic ids a pre-selection scope-staleness sweep must demote.
 *
 * A node is stale — and returned — when ALL hold:
 *   - `kind === "tactic"`,
 *   - `office_hours` is null (an author park is handled by its own lane),
 *   - `phase` is one of the scope-chained phases (fix/qa/review),
 *   - the node id is NOT in `liveIds` (an in-flight worker owns its own scope;
 *     the demote is only for idle nodes),
 *   - a scope-fingerprint stamp file exists at
 *     `<stampDir>/<id>.scope-fingerprint`, AND
 *   - the stamped fingerprint differs from the node's CURRENT scope fingerprint
 *     (`tacticScopeFingerprint(statement, body)`).
 *
 * A MISSING stamp file is NOT stale (bootstrap fail-open, matching
 * check-node-selection.ts's missing-stamp policy) — such nodes are excluded, not
 * thrown on.
 *
 * Pure and offline-testable: liveness is dependency-injected via `liveIds` and
 * never read from the environment here. The node bodies are read from the store
 * dir the nodes were loaded from (`readNodeBody`), and the stamps from
 * `stampDir` (`<repo>/.claude/worktrees/`).
 *
 * @param nodes    The loaded graph nodes (as from `listNodes`).
 * @param dir      The intentions store directory the nodes were loaded from,
 *                 for reading each node's authoritative body.
 * @param stampDir The stamp directory (`<repo>/.claude/worktrees/`).
 * @param liveIds  The set of node ids with a live session/worker right now.
 */
export function listScopeStaleTactics(
  nodes: IntentionNode[],
  dir: string,
  stampDir: string,
  liveIds: Set<string>,
): string[] {
  const stale: string[] = [];
  for (const node of nodes) {
    if (node.kind !== "tactic") continue;
    if (node.office_hours !== null) continue;
    if (node.phase === null || !SCOPE_CHAINED_PHASES.has(node.phase)) continue;
    if (liveIds.has(node.id)) continue;

    const stamped = readStampedFingerprint(stampDir, node.id);
    if (stamped === null) continue; // missing/empty stamp: fail-open, not stale

    const current = tacticScopeFingerprint(node.statement, readNodeBody(dir, node.id));
    if (stamped !== current) stale.push(node.id);
  }
  return stale;
}
