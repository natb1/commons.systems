---
id: tactic-graph-commit-delete-vs-edit-park-hardening
kind: tactic
statement: "Harden delete-vs-edit park in graph-commit: fix the integration-test
  shim's empty-theirs assumption, add downstream park-on-deleted-node handling,
  and add integration coverage for the concurrent-delete-vs-edit case"
owner: ai
status: raw
parent: null
rationale: "review-fix follow-up from PR #2911
  (tactic-graph-commit-auto-serialization): a red-team finding on
  merge-node.ts:61 (a concurrent writer's deletion of a node was silently
  resurrected by an empty --theirs synthesizing theirs=ours with a null base)
  was upheld by adversarial verify and fixed in that PR (merge-node.ts now
  treats empty --theirs with a non-empty --base as an unresolved delete/modify
  conflict that parks). This tactic covers the remaining hardening the review
  residue pass could not safely complete in-PR: the test-graph-commit.sh shim
  still hard-codes the old ours-wins assumption for empty --theirs, park_write's
  downstream handling of a their-delete park is unverified (readNode throws on
  the now-absent file), and there is no integration test for this direction
  (mirrors the existing prune-direction Case 17/23 coverage). Do not remove the
  merge-node.ts guard landed in PR #2911 -- this tactic only builds
  test/downstream coverage around it."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Harden delete-vs-edit park in graph-commit: fix the integration-test shim's empty-theirs assumption, add downstream park-on-deleted-node handling, and add integration coverage for the concurrent-delete-vs-edit case

Draft context (retained by /review-fix's residue-filing step; not yet planned). Source PR: #2911 (tactic-graph-commit-auto-serialization).

## Provenance

- **Location**: `packages/intentionsutil/scripts/merge-node.ts:61`
- **Failure scenario**: `merge-node.ts` treated an empty `--theirs` as "the id never existed on the already-landed side, so ours wins outright," and also nulled the base (`effectiveBase=null`). But two call sites in `graph-commit` — `check_base_freshness` and `try_layer2_resolve`/`stage_file_or_empty 2` — hand `merge-node.ts` an empty `--theirs` specifically when the *other* writer's already-landed change deleted the node. Nulling the base made every field trivially equal (`eq(oursVal, theirsVal)` on identical objects), so the merge produced zero conflicts and silently resurrected/overwrote the other writer's deletion with no conflict entry and no office_hours park.
- **Adversarial verdict**: upheld (single skeptic, high-confidence path). The skeptic could not construct a false-positive: confirmed via direct code reading (merge-node.ts:57-62, node-merge.ts:120-134) that both call sites' empty-`--theirs` cases are genuine "other writer deleted this node" cases, not "id never existed"; confirmed no guard intercepted this before `run_merge_node` in either path; confirmed the existing test suite's own npx shim for merge-node.ts (test-graph-commit.sh:288-295) hard-codes "ours wins outright" for empty theirs, so it would not catch this even with a test for the missing direction (only the mirror direction — this writer prunes, other writer's edit already landed — has coverage, via Cases 17/23).
- **Fixed in PR #2911**: `merge-node.ts` now treats empty `--theirs` with a non-empty `--base` as an unresolved delete/modify conflict that parks; only a genuine add/add (empty base AND empty theirs) still passes `ours` through. This tactic covers the review residue that could not be safely completed inside that PR — do NOT remove the merge-node.ts guard it landed.

## Scope

1. **Test shim fidelity** — `packages/intentionsutil/scripts/test-graph-commit.sh:288-295`. The `npx merge-node.ts` shim treats an empty `--theirs` as "ours wins outright" unconditionally, which no longer mirrors the real `merge-node.ts`. Update it to branch on `--base`: empty `--theirs` AND non-empty `--base` → print `{"resolved":false,...}` and do NOT write `--out` (park); empty `--theirs` AND empty `--base` → keep the current add/add pass-through (ours wins). Verify no existing case regresses (Cases 13/21 keep a present theirs; the empty-theirs branch is currently unexercised).
2. **Downstream park-on-deleted-node** — `graph-commit`'s `park_and_exit` + `park_write`. On a their-delete park, `park_and_exit` resets to origin (node deleted) and `park_write`'s tsx helper calls `readNode(intentionsDir, id)`, which throws on the absent file, so the park dies with "failed to write the office_hours parking record." Decide and implement the intended behavior (e.g. re-materialize the node carrying only `office_hours` plus a delete-vs-edit reconciliation recommendation, or a dedicated tombstone/park variant), so the park lands a usable `office_hours` record instead of dying.
3. **Integration coverage** — add a `test-graph-commit.sh` case (mirror of Case 23, opposite direction): OTHER prunes the node, THIS writer edits it and passes `--base`, asserting a clean park (rc 1, no resurrection, `office_hours` recorded with a delete-vs-edit reconciliation note). This exercises the guard end-to-end through both the shim fix (1) and the park handling (2).

## Verification

`bash packages/intentionsutil/scripts/test-graph-commit.sh` (expect all cases green including the new delete-vs-edit park case); confirm the new case fails if the merge-node.ts guard from PR #2911 is removed.
