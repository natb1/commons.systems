---
id: tactic-graph-write-failure-rollback
kind: tactic
statement: "Graph-write primitives leave no residue in the shared checkout when
  a write fails to land: roll back on every failure path across all six leaking
  call sites, surface the one silently-swallowed failure, and isolate the
  read-modify-write to scratch cut from origin/main as the target"
owner: ai
status: codified
parent: null
rationale: >-
  Surfaced 2026-07-23 debugging a failed manual dispatch tick, and recorded as a
  standing invariant in strategy-graph-native-dispatch's 2026-07-23 no-residue
  clarification; this draft carries the implementing fix. The shape: a script
  mutates one or more intentions/*.md files in the PRIMARY checkout, calls
  graph-commit, and on failure exits non-zero leaving the mutation on disk with
  no rollback. graph-commit's assert_clean_outside_ids ("refusing to start --
  unrelated dirty tracked file(s) outside this call's node set") then rejects
  every subsequent call for every OTHER node until a human clears it by hand.


  Census corrected 2026-07-23 after the first draft of this tactic named only
  two call sites. That undercount came from grepping the literal phrase "on disk
  but not landed", which the other sites word differently ("plan applied on
  disk, not landed", "content on disk, not landed", or nothing at all).
  Enumerating callers of graph-commit instead gives SIX leaking sites, none of
  which roll back: park-node:98; demote-node-to-implement:78;
  transition-node:154 (the most frequently invoked -- every phase transition);
  reconcile-graph-merged:118 (BULK -- reconcile-graph.ts applies edits to many
  node files before a single graph-commit, so one failure dirties all of them at
  once); dispatch-graph-census:120; and dispatch-graph-main-red-sync:104. The
  .ts mutators (apply-fix-state.ts, apply-node-transition.ts,
  reconcile-graph.ts) do not leak themselves -- they document that the caller
  owns landing -- which is precisely why the leak lives in their callers.


  Two sites amplify beyond the single-file case. dispatch-graph-scope-sweep:122
  calls demote-node-to-implement in a loop that explicitly "continues to the
  next stale node" on failure, so one stray write cascades into every later
  demote in the same sweep. dispatch-graph-main-red-sync:104 is worse: its
  graph-commit runs inside a `( ... ) 1>&2 || true` subshell inside a `while
  read` loop, so a failure is swallowed entirely -- no error surfaced, residue
  left, and the loop continues to the next node, potentially adding another
  dirty file per iteration. That silent-failure variant is a defect in its own
  right and not merely a residue problem.


  Observed blast radius: on 2026-07-23 a park-node failure on
  tactic-flake-fingerprint-stability (itself triggered by a
  provision-node-worktree exit 2) left a stray office_hours write in the primary
  checkout; the next manual tick's two legitimate scope-stale demotions --
  tactic-flake-hook-tests-select-tick and tactic-sync-reader-skill -- were both
  refused before doing any work, and dispatch-graph-execute exited 1. The
  failure was hard to diagnose because the error names a file belonging to a
  node unrelated to the one being worked.


  Neither tactic-flake-park-node-case2-dirty-tree-guard nor
  tactic-flake-park-node-concurrent-write-refusal covers this -- both are scoped
  to the CI test test-park-node.sh tripping the same guard, not to the
  production leak.
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 90
  override: null
  rationale: "Author-directed 2026-07-23: boost to top ranking. This node carries
    the amplifier half of the 2026-07-23 manual-dispatch-tick failure. One stray
    uncommitted file in the primary checkout tripped graph-commit's
    assert_clean_outside_ids, and because none of the six graph-commit callers
    roll back, every refused call left its own plan on disk: the dirty set grew
    from 1 file to 7 within a single tick, reconcile-graph-merged and three
    demote-node-to-implement calls all failed, two nodes ended demote-failed,
    one was skipped as stale-selection after reading its own unlanded demotion
    off disk, and dispatch-graph-execute exited 1. Sized at 90, which composes
    to 95.33 with the boost 5 inherited from strategy-graph-native-dispatch,
    placing it above the live discretionary composed max (90.33,
    tactic-graph-router-live-worker-read-robust) and below the
    strategy-main-health ceiling (100, author-override-guarded), which it does
    not displace. Paired with tactic-subagent-cwd-worktree-guard, which carries
    the seed half of the same incident."
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Graph-write primitives leave no residue in the shared checkout

Implements the standing invariant recorded in `strategy-graph-native-dispatch`'s
2026-07-23 no-residue clarification. Units 1–7 are the stop-the-bleeding fix
(rollback, silent-failure surfacing, diagnosability, tests); Unit 8 is the
deferred target redesign.

## Context

Six scripts mutate `intentions/*.md` in the primary checkout, then call
`graph-commit` to land the change. When the write step or `graph-commit` fails,
none of the six roll back — the mutated (or deleted, or newly-created) file is
left dirty on disk. That stray file then trips `graph-commit`'s
`assert_clean_outside_ids` guard (`packages/intentionsutil/scripts/graph-commit:975-1009`)
on every *other* unrelated node until a human manually cleans it, because the
guard refuses to start whenever any tracked `intentions/*.md` outside the
current call's node set is dirty.

On 2026-07-23 this cascaded: one park-node failure left a stray
`intentions/*.md`, and the next tick's two legitimate demotions were both
refused by the guard, exiting the whole dispatch tick with code 1. Two
amplifiers make it worse. `dispatch-graph-scope-sweep:119-123` loops over
`demote-node-to-implement` and continues past a failure, so one leak poisons
every later demote in the same sweep. `dispatch-graph-main-red-sync:99-105`
compounds a leak by swallowing the failure entirely (`( ... ) 1>&2 || true`) —
no diagnostic at all.

There is no rollback primitive anywhere. The only pre-mutation blob capture in
the tree is `park-node:70` (`FRESH_BLOB="$(git -C "$REPO_ROOT" rev-parse
"origin/main:intentions/$NODE_ID.md")"`), and it is used only as a
`graph-commit --base` CAS token, never to restore. The fix is to capture the
pre-mutation origin/main blob at each site and restore it (or delete, for born
nodes) on any post-mutation failure — inline per call site, via the existing
`trap` idiom (`park-node:82`), not a new shared script.

## The leaking call sites

| # | Site | Anchor | Shape | Rollback |
|---|------|--------|-------|----------|
| 1 | `packages/intentionsutil/scripts/park-node` | write ~93, commit 98, leak 99-100 | edit | restore FRESH_BLOB |
| 2 | `packages/intentionsutil/scripts/demote-node-to-implement` | write 66, commit 77, leak 78-79 | edit | capture + restore FRESH_BLOB |
| 3 | `.claude/skills/dispatch-propagate/scripts/transition-node` | write 138, commit 154, leak 155-156 | edit | capture + restore FRESH_BLOB |
| 4 | `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged` | plan+write 96, commit 118, leak 119-120 | BULK multi-node | plan-then-apply split + snapshot/restore edit∪prune |
| 5 | `.claude/skills/dispatch-propagate/scripts/dispatch-graph-census` | write 97+110-118, commit 120, leak 123-124 | BORN new node | delete-if-absent / restore-if-present |
| 6 | `.claude/skills/dispatch-propagate/scripts/dispatch-graph-main-red-sync` | write 101-104, commit 104, leak (swallowed) 105 | edit (per-node loop) | restore CAS-dumped node + surface the swallowed failure |

## Unit 1 — `park-node` + `demote-node-to-implement` rollback

**Scope.** Two sibling primitives, the straightforward single-node edit shape.

- `park-node`: `FRESH_BLOB` is already captured at line 70. Extend the existing
  `EXIT` trap (currently `trap 'rm -f "$TMPTS"' EXIT` at :82) so that on a
  non-zero exit after the mutation write (:93) it restores the file: `git -C
  "$REPO_ROOT" show "origin/main:intentions/$NODE_ID.md" >
  "$INTENTIONS_DIR/$NODE_ID.md"`. Gate the restore on a flag set just before
  the mutation so a pre-mutation failure (fetch/rev-parse at :66-73) does not
  restore a file it never touched. Correct the now-inaccurate diagnostic at
  :99 ("on disk but not landed") to state the write was rolled back.
- `demote-node-to-implement`: captures nothing today. Add, before the
  mutating call at :66, `FRESH_BLOB="$(git -C "$REPO_ROOT" rev-parse
  "origin/main:intentions/$NODE_ID.md" 2>/dev/null)"` using the in-scope
  `NODE_ID` (:39) and `REPO_ROOT` (:36) — same pattern as `park-node:70`, no
  fetch needed (best-effort capture; if the node is absent from origin/main,
  treat as a hard pre-condition and fail before mutating rather than
  mutate-without-recourse). Install a `trap`-based restore covering both the
  `apply-node-transition.ts` failure (:66-68) and the `graph-commit` failure
  (:77-79). Correct the :78 diagnostic.
- Out of scope: the PR-comment best-effort tail (:82+), the provenance range
  logic (:45-61).

**Recommended model.** sonnet — clear diff shape, one reused pattern, explicit
anchors.

## Unit 2 — `transition-node` rollback

**Scope.** `.claude/skills/dispatch-propagate/scripts/transition-node`, the
normal forward/hold write path (:134-157). Capture `FRESH_BLOB` from
`origin/main:intentions/$NODE_ID.md` before the `apply-node-transition.ts`
mutation at :138; restore via `trap` on the apply failure (:139-140) and the
`graph-commit` failure (:155-156). Same shape as Unit 1.

- Out of scope: the scope-stale delegation branch (:125-132) — it delegates to
  `demote-node-to-implement`, whose own rollback (Unit 1) covers it; do not add
  a second layer. The `refresh_stamp`/arm-merge tail (:159+) does not mutate
  `intentions/`.

**Recommended model.** sonnet.

**Dependencies.** None (independent of Unit 1, but shares the same idiom —
land Unit 1 first for a reviewed template).

## Unit 3 — `reconcile-graph-merged` (BULK): plan-then-apply split + snapshot/restore

**Scope.** The bulk multi-node reconcile at `reconcile-graph-merged:91-121`,
plus a contract change to `packages/intentionsutil/scripts/reconcile-graph.ts`.

Critical finding: `reconcile-graph.ts` computes its plan **and performs all
writes/deletes synchronously in-process** — `writeNode` for main-qa
transitions (:123), inbound `blocked_by` repair (:139-143), strategy round
stamps (:162-163); `rmSync` for the done set (:174-175). `plan.edit`/
`plan.prune` (:180-181) are only returned *after* the disk is already mutated.
So post-hoc capture from `$PLAN` at `reconcile-graph-merged:96` is
impossible — the files are already dirty by the time the caller sees the ids.

**Recommendation: plan-then-apply split, not upfront-snapshot-all-candidates.**
The upfront option (snapshot the `$OPEN_TACTICS` candidate set built at :44-54
before :96) is not merely larger-than-necessary — it is *incorrect*: the write
set exceeds the candidate set. Strategy round stamps
(`reconcile-graph.ts:162-163`) and inbound-blocker repairs (:139-143) mutate
nodes that are strategies / arbitrary blockers **not present in
`$OPEN_TACTICS`** (which is open PR-carrying tactics only, :44-54).
Snapshotting only candidates would leave those files un-restorable.
Snapshotting the *entire* graph upfront would be correct but wasteful and
crude.

The split is small and clean: add a `--no-apply` (plan-only) flag to
`reconcile-graph.ts` that runs the identical traversal but guards every
`writeNode` (:123, :142, :162) and `rmSync` (:174) behind the flag. Reads are
already pure, and `editSet`/`doneSet` are computed regardless, so the returned
plan is identical whether or not writes ran. Caller flow at
`reconcile-graph-merged:96`:

1. Invoke `reconcile-graph.ts --pr-states "$STATES_FILE" --no-apply` → get
   `plan.edit ∪ plan.prune`.
2. Snapshot each of those ids: `git -C "$REPO_ROOT" rev-parse
   "origin/main:intentions/<id>.md"` into an associative array (all are landed
   nodes, so blobs exist; a prune target's blob is what restores the deleted
   file).
3. Invoke `reconcile-graph.ts --pr-states "$STATES_FILE"` (apply). Both runs
   read the same unmutated dir, so the plan is deterministic across the two
   calls.
4. `graph-commit` (:118).
5. `trap`/on-failure restore: for every snapshotted id, `git show <blob> >
   intentions/<id>.md` (restores both edits and deletes). Cover the apply
   failure and the `graph-commit` failure (:118-120). Correct the :119 "plan
   applied on disk, not landed" diagnostic.

- Out of scope: the PR-state resolution loop (:44-89), deferral reporting
  (:99-104). Do not change the plan's *content*, only *when* the writes
  happen.

**Recommended model.** opus — a contract change to a shared TS module,
cross-run determinism reasoning, and the undercapture correction are
judgment-heavy.

**Dependencies.** None, but land after Unit 1 for the reviewed restore idiom.

## Unit 4 — `dispatch-graph-census` (BORN): delete-vs-restore rollback

**Scope.** `.claude/skills/dispatch-propagate/scripts/dispatch-graph-census:89-127`,
the born-node path. `NODE_ID` (:90) is a deterministic-per-day id
`tactic-graph-census-${now}` (`packages/intentionsutil/scripts/graph-census-debt.ts:233`),
and the `shouldBirth` gate (:79-87, backed by an existence check in
`graph-census-debt.ts`) only fires when no such node exists — so under the
normal path `origin/main:intentions/$NODE_ID.md` **does not exist** and the
node is created fresh (`write-node.ts --file` at :97-99, then awk/jq body
surgery at :110-118).

Correct rollback is therefore *delete*, not restore — but branch defensively
for the same-day-id-collision race. Before the mutation, probe: `if git -C
"$REPO_ROOT" rev-parse -q --verify "origin/main:intentions/$NODE_ID.md"
>/dev/null 2>&1; then capture PRIOR_BLOB; fi`. On failure after :97 (via
`trap`): if `PRIOR_BLOB` was set, `git show` it back; otherwise `rm -f
"$REPO_ROOT/intentions/$NODE_ID.md"`. This mirrors `park-node:70-73`'s
absent-node guard shape but inverted — there absence is a hard failure; here
absence is the expected case selecting the delete branch. Cover both the
`write-node`/body-surgery failures (:97-118) and the `graph-commit` failure
(:123-124); correct the :123 diagnostic.

- Out of scope: the latch/threshold no-birth branch (:79-87), debt
  computation.

**Recommended model.** opus — the branch selection and the collision-race
reasoning are the crux; a mechanical FRESH_BLOB copy would be wrong here.

## Unit 5 — `dispatch-graph-main-red-sync`: rollback + surface the silent failure

**Scope.** `.claude/skills/dispatch-propagate/scripts/dispatch-graph-main-red-sync:86-107`,
the per-node completion loop. Two *distinct* invariants:

1. **Rollback.** Each iteration dumps the node via `dump-node.ts` (writes the
   manifest as the CAS token, :101), patches `phase=done` (:102), writes it
   back (:103), and `graph-commit --base` (:104). On failure the mutated
   `intentions/<node_id>.md` leaks. Capture the pre-mutation origin/main blob
   for `$node_id` before :103 and restore it inside the subshell's failure
   path. Because the loop continues to the next node, each iteration **must**
   leave a clean tree before the next begins (otherwise the guard trips
   mid-loop) — restore is what guarantees that precondition.
2. **Surface the swallow.** The `( ... ) 1>&2 || true` at :105 discards the
   exit code with no diagnostic. Change to log-and-continue: on subshell
   failure emit a stderr line naming `$node_id` and that the write was rolled
   back, then continue. Log-and-continue (not abort) matches
   `dispatch-graph-scope-sweep`'s existing sweep-loop precedent (:119-123) —
   but is only safe *once this unit's rollback guarantees each iteration
   leaves a clean tree*, so both changes ship together.

- Out of scope: the `OPEN_MAIN_RED` enumeration and the `EXECUTION==null` skip
  gate (:88-93).

**Recommended model.** opus — two intertwined invariants plus the
loop-precondition ordering argument.

**Dependencies.** None, but the rollback half must precede/accompany the
swallow half (do not surface-then-continue over a still-dirty tree).

## Unit 6 — `assert_clean_outside_ids` diagnosability

**Scope.** `packages/intentionsutil/scripts/graph-commit:975-1009`. The guard
already lists offending paths (:1004-1005, `printf '%s' "$offending"`) and
suggests `git stash -u` (:1006). Add a targeted remediation: for each
offending `intentions/*.md` whose only diff is a frontmatter-marker change
(office_hours / phase / marker fields) — the fingerprint of a failed-write
residue — name it as likely leaked-write residue and print the precise
per-file clearing command (`git -C <root> checkout -- intentions/<id>.md`)
rather than only the blanket `git stash -u`. Keep the existing blanket
suggestion as fallback. Standalone value even before Units 1–5 land; does not
change the guard's pass/fail behavior, only its message.

- Out of scope: the racy-clean `--refresh` logic (:987), the guard's trip
  condition.

**Recommended model.** sonnet — localized message enrichment with a clear
shape.

**Dependencies.** None.

## Unit 7 — Test coverage

**Scope.** Extend the existing suites; add no new suite.

- **Per-primitive byte-identical-restore** for all six sites. Use **Pattern
  A** (`packages/intentionsutil/scripts/test-park-node.sh:252-284`): copy the
  real `graph-commit` aside to `graph-commit.real`, drop a wrapper at the
  resolved path (`"$SCRIPT_DIR/graph-commit"`) that `exit 1`s to force the
  post-mutation failure, then assert `git diff -- intentions/<id>.md` is empty
  afterward. Cover: park-node, demote-node-to-implement, transition-node (edit
  shape); reconcile-graph-merged (assert the full edit∪prune set — including a
  strategy round-stamp and an inbound-blocker repair, the multi-node case —
  all restored, and a pruned file is recreated); dispatch-graph-census (assert
  the born file is *deleted* on failure, and the collision branch restores
  when a prior blob exists).
- **Cascade test**: `dispatch-graph-scope-sweep` continuing past a failure now
  leaves a clean tree per iteration, so a later demote in the same sweep is
  *not* refused. Use **Pattern B**
  (`.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh:59-83`,
  `*_RC`/`*_LOG` env-controlled stub siblings) — that harness already stubs
  `demote-node-to-implement` itself (lines 80-91; Case 8: provision exit 2 →
  parked; Case 10: park-node failure → failed, exit 1); drive one iteration's
  stub to fail and assert the next lands.
- **Silent-failure stderr assertion** for `dispatch-graph-main-red-sync`:
  force the inner subshell to fail (Pattern B `GRAPH_COMMIT_RC`) and assert a
  non-empty stderr diagnostic naming the node (regression guard for the old
  `|| true` swallow).
- Out of scope: `tactic-flake-park-node-case2-dirty-tree-guard` and
  `tactic-flake-park-node-concurrent-write-refusal` (both about the CI test
  itself tripping the guard, not this production leak; neither subsumed by
  this tactic).

**Recommended model.** sonnet — explicit cases and two documented stub
patterns.

**Dependencies.** Units 1–5 (asserts their behavior).

## Unit 8 — Target redesign: cut scratch from origin/main (deferred, not this round's critical path)

**Scope (intent only, not specced now).** Replace in-place mutation of the
primary checkout with: create scratch from `origin/main`, do the
read-modify-write there, `graph-commit` from there — so a failure leaves the
primary checkout untouched *by construction*, obsoleting Units 1–5's per-site
traps. This is the "never use the shared checkout as scratch — decide read,
then write" discipline `.claude/skills/align-strategy/SKILL.md` Step 0 already
binds interactive sessions to; Units 1–5 only approximate it for these six
production sites.

**Dependencies (hard).** Blocked on external tactic
`tactic-graph-commit-cwd-repo-resolution` (currently `phase: qa`, not merged),
which lands the cwd-based target-repo resolution this design depends on. Do
not spec or implement Unit 8 until that tactic reaches `done`; re-read and
re-scope against its final shape then. Units 1–7 are the stop-the-bleeding
phase and must not wait on it.

**Recommended model.** opus (when unblocked).

## Reuse

- **FRESH_BLOB capture pattern** — `packages/intentionsutil/scripts/park-node:70`
  (`git -C "$REPO_ROOT" rev-parse "origin/main:intentions/$NODE_ID.md"`).
  Reused by Units 1–5 for capture; restore via `git show <blob> >
  intentions/<id>.md`.
- **`trap ... EXIT` idiom** — `packages/intentionsutil/scripts/park-node:82`.
  Extend (do not replace) for gated restore-on-failure in Units 1–5.
- **`dump-node.ts` CAS manifest** —
  `.claude/skills/dispatch-propagate/scripts/dispatch-graph-main-red-sync:101`
  already uses it for `--base`; the pre-mutation node state it dumps is also
  the natural rollback source in Unit 5.
- **Absent-node guard shape** — `park-node:70-73` (inverted for Unit 4's
  born-node delete branch).
- **Test stub Pattern A** (same-path `graph-commit` wrapper) —
  `packages/intentionsutil/scripts/test-park-node.sh:252-284`. Unit 7
  per-primitive tests.
- **Test stub Pattern B** (`*_RC`/`*_LOG` env-controlled stub siblings) —
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh:59-83`.
  Unit 7 cascade + silent-failure tests.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh
```

```verify
bash packages/intentionsutil/scripts/test-park-node.sh
```

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

Manual / observational checks:

- For each of the six sites, run the site with `graph-commit` forced to fail
  (Pattern A/B) and confirm `git status --porcelain intentions/` is empty
  afterward (edit/edit-bulk sites), the born file is gone (census normal
  case), and — for the reconcile bulk case — a pruned node file is restored
  and a strategy round-stamp is reverted.
- Reproduce the 2026-07-23 cascade shape: force one
  `demote-node-to-implement` in a `dispatch-graph-scope-sweep` run to fail,
  then confirm a subsequent unrelated demote in the same sweep is *not*
  refused by `assert_clean_outside_ids` and the tick exits 0.
- Force a `dispatch-graph-main-red-sync` inner failure and confirm a stderr
  diagnostic naming the node appears (no silent swallow) and the tree is
  clean for the next loop iteration.
- Confirm Unit 6: trigger the guard with a leaked office_hours-only residue
  file and confirm the message names the file as likely residue and prints
  the exact clearing command.
