// census-decide — pure, in-memory decision layer for the scripted census
// dispatch-tick step (tactic-census-scripted-tick Unit 1). Given a node
// array, decides which done-but-present nodes verify their completion
// mechanically (safe to prune) and which don't (integrity defects, handled
// by Unit 2). No filesystem, no network, no graph-commit — this module is
// import { verifyCompletion, isCensusDefectNode, partitionDonePresent } from
// this file only.
//
// Mirrors the verification rule documented in graph-census-debt.ts around
// lines 232-240: execution.completion verifies when mergedAt AND
// mergeCommitSha are both non-null (a real PR merge), or when graphCommitSha
// is non-null (an out-of-band landing).
//
// ONE exception to verify-before-prune: census's OWN defect nodes retire by
// prune with no merge evidence — see `partitionDonePresent` for why, and for
// the re-mint property that keeps a premature close from losing the defect.

import { isPlainObject, type IntentionNode } from "../src/schema.js";

/** Why a done-but-present node did NOT verify as safe to prune. */
export type DefectReason = "no-execution" | "no-pr" | "unverified-merge";

/**
 * True when `node` is a census-minted integrity-defect node — i.e. it carries
 * the `attributes.census_defect` object `census-tick.ts`'s `defectNode` writes
 * (`{ target, reason, detected }`).
 *
 * Keyed off the ATTRIBUTE, never the `tactic-census-defect-` id prefix: the id
 * is a display convenience, the attribute is the record census itself wrote and
 * the only thing that survives a rename. (An id-prefix test would also match a
 * hand-authored node that merely borrowed the naming convention.)
 */
export function isCensusDefectNode(node: IntentionNode): boolean {
  return isPlainObject(node.attributes.census_defect);
}

/**
 * The mechanical completion-verification predicate. A node verifies when it
 * carries execution with a non-null pr, AND execution.completion is set with
 * either (mergedAt AND mergeCommitSha both non-null) OR graphCommitSha
 * non-null.
 */
export function verifyCompletion(node: IntentionNode): boolean {
  if (node.execution === null || node.execution === undefined) return false;
  if (node.execution.pr === null) return false;
  const completion = node.execution.completion;
  if (completion === null || completion === undefined) return false;
  const realMerge = completion.mergedAt !== null && completion.mergeCommitSha !== null;
  const outOfBand = completion.graphCommitSha !== null;
  return realMerge || outOfBand;
}

function classifyDefect(node: IntentionNode): DefectReason {
  if (node.execution === null || node.execution === undefined) return "no-execution";
  if (node.execution.pr === null) return "no-pr";
  return "unverified-merge";
}

export interface DonePresentPartition {
  prunable: string[];
  defects: { id: string; reason: DefectReason }[];
}

/**
 * Filter nodes to phase === "done" (the identical one-line filter
 * `computeDebt`'s `donePresent` uses in graph-census-debt.ts:126), then split
 * each into prunable ids and defect ids+reasons.
 *
 * A done-present node is prunable when `verifyCompletion` holds OR when it is
 * itself a census-minted defect node (`isCensusDefectNode`). That second arm is
 * a deliberate, narrowly-scoped exception to the verify-before-prune rule:
 *
 *   - A defect node is graph BOOKKEEPING minted by census, not delegated work.
 *     It has no PR of its own and never will — its resolver's evidence lives on
 *     the TARGET's `execution`, not here. Requiring merge evidence for the
 *     defect node's own completion record is a category error: there is no
 *     merge to point at.
 *   - Without the exception, closing a defect the way its own generated body
 *     instructs ("If <target> already verifies and was pruned, close this node
 *     (phase → done)") turns the closed defect into a fresh unverifiable
 *     done-present node, which census then mints a defect FOR — an unbounded
 *     self-regress (`tactic-census-defect-census-defect-…`, and so on).
 *   - Nothing is lost by pruning without evidence. Dedup is by file existence,
 *     so if the defect's TARGET is still unverified when the defect node is
 *     pruned, the next tick re-mints the same defect id. Closing a defect
 *     prematurely re-surfaces it rather than burying it.
 */
export function partitionDonePresent(nodes: IntentionNode[]): DonePresentPartition {
  const donePresent = nodes.filter((n) => n.phase === "done");

  const prunable: string[] = [];
  const defects: { id: string; reason: DefectReason }[] = [];

  for (const n of donePresent) {
    if (verifyCompletion(n) || isCensusDefectNode(n)) {
      prunable.push(n.id);
    } else {
      defects.push({ id: n.id, reason: classifyDefect(n) });
    }
  }

  return { prunable, defects };
}
