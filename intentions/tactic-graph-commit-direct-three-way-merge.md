---
id: tactic-graph-commit-direct-three-way-merge
kind: tactic
statement: Replace graph-commit's rebase-driven conflict production with a
  direct three-way merge through merge-node.ts, which already takes
  --base/--ours/--theirs as plain paths and is git-independent
owner: ai
status: codified
parent: null
rationale: "Retained from PR #3086's own 'Still to come' list, re-surfaced by
  the 2026-08-14 /align round (strategy clarification 237). The rebase exists
  only to PRODUCE a conflict that layer 2 then unwinds in order to call
  merge-node.ts — the merger it ends at is already git-independent.
  Writer-internal cleanup rather than something the write-independence invariant
  requires, so it is not on that invariant's critical path; it is the remaining
  structural simplification once the plumbing default lands
  (tactic-graph-commit-plumbing-default). Planned 2026-08-20: the plumbing arm's
  reconcile_plumbing_base already IS the direct three-way merge, so the
  remaining work is deleting the worktree arm rather than authoring a merger —
  three units, the first (the --prune peer-already-deleted divergence)
  independently landable before the default flips."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# Replace graph-commit's rebase-driven conflict production with a direct three-way merge through merge-node.ts, which already takes --base/--ours/--theirs as plain paths and is git-independent

## Context

`packages/intentionsutil/scripts/graph-commit` (4012 lines) lands intention-node
writes on `origin/main`. It carries **two writers**, selected by
`GRAPH_COMMIT_WRITER` (`graph-commit:418`, default `worktree`):

- **worktree** — `commit_files()` makes a local commit on the checkout's HEAD, then
  `git pull --rebase origin main` produces a *textual* conflict when a peer edited the
  same node, and `try_layer2_resolve()` unwinds that conflict back into the semantic
  `base` / `ours` / `theirs` triple that `merge-node.ts` wants.
- **plumbing** — `prepare_plumbing_sha()` fetches `origin/main`, calls
  `reconcile_plumbing_base()` (a per-id blob comparison feeding a **direct** three-way
  `run_merge_node()` call), and builds the commit with `read-tree` / `write-tree` /
  `commit-tree` against a throwaway index.

PR #3086's own "Still to come" list, re-surfaced by the 2026-08-14 `/align` round
(strategy clarification 237), stated the observation this node exists for:

> Replace rebase-driven conflict handling with a direct three-way merge.
> `merge-node.ts` already takes `--base --ours --theirs --out` as plain paths and
> runs the pure field-level merge — it is already git-independent. The rebase exists
> only to *produce* a conflict that layer 2 then unwinds to call that merger.

**That observation is correct and `75d76e26` (#3090) already built the replacement.**
`reconcile_plumbing_base()` (`graph-commit:1785`) IS the direct three-way merge: it
maps `base` = the node's blob at the previous base, `ours` = the on-disk file,
`theirs` = the node's blob at the new base, all from plain `git cat-file -p` reads,
and hands them to the same `run_merge_node()` (`graph-commit:1073`) the rebase path
ends at. Its own comment (`graph-commit:1758-1767`) notes there is "no rebase stage
inversion here — these are plain file reads."

So **no merger has to be written.** What is left is deletion: the worktree arm's
rebase machinery, and the four things that exist only to make a rebase survivable.
The concrete simplification this node is named for is the disappearance of
`graph-commit:2483-2493` — the only place in the file that documents git-rebase stage
numbering, which exists solely to translate rebase stages into `run_merge_node()`'s
semantic argument order.

### Greenfield design (what to build from scratch)

`graph-commit` has **one** writer. Every landing attempt is: fetch `origin/main`,
reconcile the on-disk node files against that fresh tip with a direct three-way merge
through `merge-node.ts`, build the commit with git plumbing against a throwaway index,
stamp the SHA on the `graph/**` scratch ref, fast-forward it onto `main`. There is no
`git pull --rebase`, no rebase conflict stage, no stage-number inversion, no local
commit on the caller's HEAD, no dirty-tree pre-flight refusal, no far-ahead rebuild,
no whole-tree `git reset --hard`, and no `GRAPH_COMMIT_WRITER` variable. A caller's
unrelated dirt is simply not the writer's business (strategy clarification 237,
property (1) — WRITE INDEPENDENCE).

### Brownfield migration path (why this node is not the whole distance)

Two steps, deliberately separated by blast radius:

1. **`tactic-graph-commit-plumbing-default`** (a *separate* node) flips the default
   from `worktree` to `plumbing`. The worktree arm survives as a runtime escape
   hatch: an operator who hits a regression sets `GRAPH_COMMIT_WRITER=worktree` and
   the fleet recovers.
2. **This node** removes the worktree arm and the variable, once the plumbing arm has
   actually run under fleet load.

Step 2 before step 1 would delete the only rollback from a path that has never carried
the fleet's write volume — the failure `virtue-progressive-detachment` names
("an unexercised recovery path is a hope, not a path"), inverted. **The sequencing is
a hard precondition, not a preference.**

### PRECONDITION AND DECISION RULE — read this before implementing anything

Measured 2026-08-20 against `origin/main` `6ce8702d`:
`intentions/tactic-graph-commit-plumbing-default.md` is `status: raw`, `phase: null`,
`office_hours: null` — a draft, **not yet planned or landed**.

Before starting Unit 2, read `origin/main`'s copy of the writer default:

```
git fetch origin main
git show origin/main:packages/intentionsutil/scripts/graph-commit | grep -n 'GRAPH_COMMIT_WRITER="\${GRAPH_COMMIT_WRITER'
```

- **If the default reads `plumbing`** — `tactic-graph-commit-plumbing-default` has
  landed. Implement Units 1, 2 and 3, all in one PR.
- **If the default still reads `worktree`** — implement and land **Unit 1 only**
  (it is independently correct, independently valuable, and de-risks the flip), then
  **park this node to `office_hours`** rather than proceeding. Park text to use
  verbatim:
  - `reason`: `blocked on tactic-graph-commit-plumbing-default — Unit 1 (the --prune peer-already-deleted divergence) landed; Units 2-3 delete graph-commit's worktree arm and must not run while the plumbing writer is still opt-in.`
  - `recommendation`: `Plan and land tactic-graph-commit-plumbing-default first (it flips GRAPH_COMMIT_WRITER's default at graph-commit:418 and deletes the then-inert assert_clean_outside_ids gate at graph-commit:3793-3795). Let the flipped default carry real fleet write volume before returning here — the worktree arm is the only runtime rollback from the plumbing writer, and Unit 2 deletes it. Then re-select this node and execute Units 2 and 3 of its plan body unchanged; Unit 1 is already done and must not be re-implemented.`

Do not "helpfully" perform the flip as part of this node. Deleting the arm subsumes
the flip mechanically, but not its staging value, which is the entire reason the two
nodes are separate.

### What is explicitly NOT in scope, anywhere in this plan

- `packages/intentionsutil/scripts/merge-node.ts` — already git-independent, already
  takes plain paths, already invoked identically by both arms. **Nothing about it
  changes.** Same for `packages/intentionsutil/src/node-merge.ts`.
- `run_merge_node()` (`graph-commit:1073`) — the shared wrapper. Unchanged.
- Everything in `try_land()` from `graph-commit:2830` onward (scratch push,
  `await_checks`, the landing lock, `PUSHED_SHA`, the verdict). Already shared verbatim
  by both arms; not writer-specific; unchanged.
- `check_base_freshness()` (layer 3, `graph-commit:766-851`) — already
  rebase-independent. Unchanged.
- `tactic-graph-ref-split`. It remains the ratified greenfield for the *landing ref*
  (clarification 80, limb (a)); this node is writer-internal cleanup and is not on its
  critical path, nor it on this one.

---

## Unit 1 — Decide the `--prune` divergence: a peer's already-landed deletion is not a conflict

### Scope

The one place the two arms are genuinely **not** equivalent, documented in
`reconcile_plumbing_base()`'s own comment block at `graph-commit:1776-1784`: a
`--prune` id whose node a peer **already deleted** reads as a moved blob and parks,
where the rebase saw both sides delete and carried on. That comment's own defense —
"the plumbing writer's one opt-in caller today never prunes" — **stops being true the
moment the default flips**, because the owed-prune census's `graph-commit --prune`
invocations would then be on the plumbing arm.

The worktree arm already gets this right, and its condition is the specification to
copy. `ensure_intentions_only_base()` at `graph-commit:1347-1360`:

```
if [[ -n "$prune_main" && "$prune_main" != "$prune_fork" ]]; then
  append_conflicts '... prune vs. concurrent edit'
  unresolved=1
  continue
fi
# Unchanged since the fork, or already deleted on main too — safe to delete.
```

The park fires only when origin/main **still holds** the node *and* its content moved.
`reconcile_plumbing_base()`'s prune branch (`graph-commit:1794-1798`) drops the
`-n "$prune_main"` half and parks on any move.

Changes, all in `packages/intentionsutil/scripts/graph-commit`:

1. **`reconcile_plumbing_base()` prune branch, `graph-commit:1794-1798`.** This branch
   is reached only when `prev_blob != new_blob` (the equality fast-path at
   `graph-commit:1792` already `continue`d). Split the two sub-cases:
   - `new_blob` **empty** — a peer landed this node's deletion. Our prune wants the
     same end state; there is nothing to conflict over and nothing left to delete.
     Record the id in a new `PRUNE_SATISFIED_IDS` array and `continue` **without**
     `append_conflicts` and without setting `unresolved`.
   - `new_blob` **non-empty** (peer edited it, or created it after our fork) — keep
     today's behavior exactly: `append_conflicts` with the existing
     `"prune vs. concurrent edit"` sentinel, `unresolved=1`. The sentinel string is a
     contract other code and tests grep for; do not reword it.
   Mirror `ensure_intentions_only_base:1347-1360`'s comment wording so the two blocks
   stay visibly twinned (they already cross-reference each other).
2. **Declare `PRUNE_SATISFIED_IDS=()`** beside `RESURRECTED_IDS` / `PRUNE_IDS` in the
   globals block at `graph-commit:455-460`, and add an `is_prune_satisfied_id()`
   helper modelled on `is_prune_id()` (`graph-commit:2443-2450`). Declaring it at the
   globals site (not lazily) matters: `test-graph-commit.sh` case 69
   (`:3212-3237`) `source`s the script and calls `build_commit_plumbing` directly, so
   the array must exist and be empty for that fixture.
3. **`build_commit_plumbing()` prune branch, `graph-commit:1688-1702`.** It currently
   `plumb_die`s when the prune path is absent from the base tree
   (`"names a path absent from base commit"`). After change 1 that fires on exactly the
   case we just exonerated, because the base handed in *is* the new tip the peer
   deleted from. Add an `is_prune_satisfied_id "$id" && continue` **before** the
   `git cat-file -e` refusal, with a comment naming `reconcile_plumbing_base()` as the
   only setter. **The refusal itself stays** — it is the deliberate strictness case 69
   pins (`git update-index --force-remove` silently succeeds where `git add` rejects an
   unmatched pathspec), and case 69 must pass unchanged.
4. **"Nothing left to land" after reconciliation, `prepare_plumbing_sha()`
   `graph-commit:1912-1938`.** If every id is now either resurrected or
   prune-satisfied, `build_commit_plumbing()` would mint a commit whose tree equals its
   parent's and push that empty no-op onto main. After a successful
   `reconcile_plumbing_base` call, test `id_files_differ_from_rev "$PLUMB_BASE"`
   (`graph-commit:1855`, already rev-relative and already resurrected-id aware); when
   it reports nothing differs, `return 20`.
   - `try_land()` (`graph-commit:2792-2804`): on `prc` 20, `lock_release` and
     `return 20` — no stamp, no push.
   - `land()` (`graph-commit:2950-2961`): add `20) return 20 ;;` to the `case`, and
     extend its header comment's Returns list.
   - `main()`'s `land || rc=$?` dispatch (`graph-commit:3975` onward): on rc 20, print
     a stderr line naming the satisfied prune ids, then `emit_verdict_and_exit noop`.
     **Do not invent a new verdict status.** `print_verdict` already answers a
     `--prune` id by *absence on origin/main* (`graph-commit:2312-2317`), and
     graph-commit's own caller contract at `graph-commit:150-153` already documents
     `landed-equivalent` as "origin/main already carries byte-identical content for
     every id and **every `--prune` id is absent there** — a peer landed the same
     content; the caller's intent is satisfied." This change lands inside that existing
     contract rather than beside it.

Out of scope for this unit: the worktree arm (untouched — it already handles this
case correctly), `run_merge_node`, `merge-node.ts`, and any part of Units 2-3.

### Tests (same commit)

In `packages/intentionsutil/scripts/test-graph-commit.sh`, following the shape of the
existing plumbing CLI cases 70-75 (`:3243-3387`) and using case 51 (`:2540-2570`, the
worktree arm's far-ahead prune race) as the semantic template:

- **New case: plumbing, peer already deleted the same node → the prune lands as a
  no-op, no park.** Writer A prunes `t-plumb-prune-both`; writer B (whose HEAD predates
  A's deletion, so `main()`'s `HEAD:intentions/<id>.md` guard at `graph-commit:3741`
  still passes) prunes the same id under `GRAPH_COMMIT_WRITER=plumbing`. Assert:
  exit 0; the verdict line reads `landed` or `landed-equivalent`; **no**
  `prune vs. concurrent edit` text; no `office_hours` on any node; no new empty commit
  on `origin/main` beyond A's.
- **New case: plumbing, peer EDITED the node this run prunes → still parks.** Same
  fixture with an edit instead of a deletion. Assert exit 1 and
  `prune vs. concurrent edit` in the landed park record. This is the
  overcorrection guard, and it also closes the coverage gap the gather phase found:
  `reconcile_plumbing_base`'s prune sentinel is reached by no existing CLI case
  (only cases 23 and 51 exercise the string, both on the worktree arm).
- **Case 69 (`:3212-3237`) must pass unchanged** — it is the deliberate-strictness
  guard for change 3.

### Recommended model

`opus` — concurrency/ordering semantics across three interacting functions, a new
exit code threaded through `try_land` / `land` / `main`, and a fixture that must
construct a specific race. Not mechanical.

---

## Unit 2 — Delete the worktree arm and the `GRAPH_COMMIT_WRITER` switch

### Dependencies

Unit 1. **And the precondition in Context** — do not start this unit unless
`origin/main`'s `graph-commit:418` already defaults to `plumbing`.

### Scope

One atomic deletion in `packages/intentionsutil/scripts/graph-commit`, with
`packages/intentionsutil/scripts/test-graph-commit.sh` reconciled in the same commit
(splitting them leaves the suite red).

**The fork.** `try_land()` at `graph-commit:2743` is the single place the arms diverge.
Delete the `if [[ "$GRAPH_COMMIT_WRITER" == "plumbing" ]]` test at `graph-commit:2785`
and its `else` branch (`graph-commit:2805-2828` — `id_files_dirty` → `commit_files` →
`git pull --rebase origin main` → `try_layer2_resolve` → `git rebase --abort` →
`return 10`), keeping the plumbing body unconditional. Rewrite the ORPHAN-WINDOW
CONTAINMENT comment (`graph-commit:2758-2784`): with no local commit at any point
there is no orphan window at all, which that comment's own last paragraph already
says of the plumbing arm.

**Delete outright** (each is worktree-arm-only; verify with a fresh grep that nothing
else calls it before removing):

| function | defined at | only caller after the fork is gone |
|---|---|---|
| `try_layer2_resolve()` | `:2462-2521` | `try_land`'s deleted `else` |
| `stage_file_or_empty()` | `:2526` | `try_layer2_resolve` |
| `rebase_in_progress()` | `:1940-1974` | `try_land` `:2811`, `cleanup` `:872`, `main` `:3695` |
| `commit_files()` | `:1564` | `try_land` `:2807`, `park_and_exit` `:3462` |
| `id_files_dirty()` | `:1389` | `try_land` `:2806`, `park_and_exit` `:3461`, `main` `:3871` |
| `assert_clean_outside_ids()` | `:3591` | `main` `:3794` |
| `_offending_path_is_marker_only_residue()` | `:3559` | `assert_clean_outside_ids` |
| `ensure_intentions_only_base()` | `:1320-1368` | `main` `:3864` |
| `replay_snapshot_onto_base()` | `:1260-1318` | `ensure_intentions_only_base` `:1344` |

`replay_snapshot_onto_base()` is the near-twin of `reconcile_plumbing_base()` and it
goes with its sole caller. This is a larger deletion than "delete the rebase path"
suggests, and it is the deletion clarification 237 already ratified in principle:
ref-split "deletes `ensure_intentions_only_base` explicitly because the far-ahead-
worktree rebuild hazard it exists for is structurally impossible once landing never
touches a worktree's checkout." The plumbing writer's parent is `origin/main` by
construction (`prepare_plumbing_sha`), so its SHA is intentions/-only no matter what
HEAD carries — the rebuild has nothing left to guard.

**Also delete:** `ORIG_HEAD` / `RESTORE_HEAD` globals (`:534-542`) and the
`RESTORE_HEAD` restore block in `cleanup()` (`:875-883`); `cleanup()`'s
`rebase_in_progress` abort (`:861-874`); the `RESTORE_HEAD` early-return in the guard
at `:2395-2410`; `main()`'s rebase-already-in-progress refusal (`:3690-3697`); the
`GRAPH_COMMIT_WRITER` validation `case` (`:3707-3711`); both writer gates
(`:3793-3795`, `:3863-3865`); the variable itself and its whole header block
(`:374-418`). `MAIN_SHA` stays — `check_base_freshness()` still uses it.

**`park_and_exit()` (`:3324-3465`).** Keep only the plumbing side of both forks: at
`:3353` keep `sync_ids_to_rev FETCH_HEAD` + the `PLUMB_BASE` re-base and delete the
`git reset --hard FETCH_HEAD` `else`; at `:3457` keep
`id_files_differ_from_rev FETCH_HEAD` and delete the `elif id_files_dirty` /
`commit_files` arm. Update the surrounding comments, which currently describe the
reset as the primary behavior.

**`main()`'s clean-branch diagnosis (`:3840-3960`) — the delicate part.** It is built
on `id_files_dirty()` (HEAD-relative) and on distinguishing an orphan commit of this
script's own from a mis-pointed repo. Under the plumbing writer HEAD is not the
subject and **no orphan commit can ever exist**. Rewrite the branch around
`id_files_differ_from_rev "$MAIN_SHA"`, keep `assert_noop_matches_intent` and the
`emit_verdict_and_exit noop` tail, and delete the orphan-recovery narration
(`:3949-3958`), `id_divergence_is_own_orphan()` and the DIVERGED-AND-NOTHING-STAGED
`die` (`:3920-3948`) along with the behavior they describe. Then simplify the
`:3941-3944` short-circuit, whose `[[ "$GRAPH_COMMIT_WRITER" == "plumbing" && ... ]]`
arm becomes the unconditional test.

**Record the invariant this retires, in a comment at that site.** Clarification 86 is a
standing invariant of the serving strategy: a run with nothing to land must distinguish
"node content already on `origin/main` (benign)" from "wrong checkout resolved
(defect)" rather than printing a false success. The HEAD-orphan discriminator was one
half of how that was enforced, and it does not survive the plumbing writer — a
mis-pointed `-C` whose target happens to match `origin/main` reads as a benign `noop`.
That is **already** true on today's plumbing arm (the widened arm at `:3944`
short-circuits before the `die`); this unit makes it the only behavior. `--expect`
(`graph-commit`'s opt-in wrong-repo assertion, pinned by cases 33/34) remains the
guard. Say so in the comment, and do not silently drop the invariant's other half:
the `--expect` refusal and the benign/defect distinction in the `noop` stderr text
both stay.

**Also update the prose that describes the deleted behavior**, all inside
`graph-commit`: the top header block's rebase references (`:96-121`, `:237`, `:255`),
`land()`'s header comment (`:2935-2949`), `try_land()`'s header comment
(`:2708-2742`), the file's usage/recovery narration at `:96-121` (the
"re-run the same invocation" recovery no longer involves an orphan or a rebase), and
every stray cross-reference to a deleted function (`:377`, `:392`, `:405-406`, `:448`,
`:546`, `:596`, `:714`, `:787`, `:825`, `:921`, `:966`, `:982`, `:1068`, `:1175`,
`:1374-1387`, `:1405-1409`, `:1488`, `:1645`, `:1776-1784`, `:1842-1850`, `:3133`,
`:3265-3266`, `:3306-3320`, `:3541`, `:3595`, `:3692`, `:3799`).

### Test reconciliation (same commit)

`.claude/rules/test-integrity.md` binds. A case may be **deleted along with the
behavior it tests**; no case covering surviving behavior may be weakened or skipped.
Work case by case:

- **Delete with the behavior** — the rebase-state cases 36 (`:2072`) and 37 (`:2114`):
  there is no "rebase already in progress" state once no rebase runs, and no
  direct-merge analog to construct.
- **Delete with the behavior** — case 24 (`:1777`, unrelated dirty tracked file blocks
  the pre-flight) and the worktree half of case 70 (`:3243`). Case 70's plumbing half
  ("a modified file the write never reads must NOT block a landing") becomes the whole
  case and the unconditional expectation; keep and rename it. This collapse *is* the
  strategy's WRITE INDEPENDENCE property (clarification 237, property (1)).
- **Delete with the behavior** — case 27 (`:1842`, the fail-loud guard on a differing
  blob with nothing staged). Its premise cannot arise once HEAD is not the subject: an
  on-disk blob differing from `origin/main` **is** the landable condition. Case 28
  (`:1867`, benign equal-blob) and cases 33/34 (`:2010`, `:2026`, `--expect`) survive
  and must pass unchanged — case 34 is now the wrong-repo guard.
- **Re-express, do not delete** — cases 19 (`:1594`) and 20 (`:1615`), the layer-2
  disjoint-field auto-resolve and same-field mechanical-unresolved. The *behavior*
  (a same-node concurrent edit is three-way merged, or parks) survives; only the
  mechanism changes. Case 71 (`:3275`, plumbing disjoint-field auto-merge) and the
  plumbing unresolvable-park case at `:3300-3330` are the existing analogs; fold 19/20
  into them or restate 19/20 against the plumbing path.
- **Re-express, do not delete** — case 23 (`:1754`, prune excluded from the layer-2
  merge attempt, parks with the prune sentinel). Unit 1's second new case is its
  direct-merge equivalent; make sure the assertion on the sentinel string survives in
  at least one CLI-driven case.
- **Far-ahead rebuild cases 16 (`:1515`), 18 (`:1570`), 49 (`:2477`), 50 (`:2508`),
  51 (`:2540`), 52 (`:2571`), 78 (`:3468`), 81 (`:3622`)** — these exercise
  `ensure_intentions_only_base` / `replay_snapshot_onto_base`. Delete each **only
  after** checking whether its assertion is about the rebuild or about a property that
  outlives it. **SUPERSEDED 2026-08-30 for case 52 (PR #3144).** The list-entry-removal
  guard is DELETED, along with `list_entries_dropped_by_ours` and
  `frontmatter_list_entries`, because the base-aware `threeWayList`
  (`packages/intentionsutil/src/node-merge.ts:151`) already distinguishes "ours dropped
  an entry" from "theirs never had it" — the exact discrimination the guard existed to
  substitute for. Case 52 is NOT re-expressed on the plumbing path: it is rewritten in
  place to assert the OPPOSITE outcome, that the same input LANDS rather than parks
  (rc 0, `office_hours` absent, the guard's note absent, concurrent edit preserved).
  Do not re-add the guard to the direct-merge reconciler. Case 81's
  "merge tool unrunnable → die, snapshot kept" likewise has a plumbing counterpart to
  land on (case 80, `:3584`, already covers the layer-3 arm).
- **Case 48 (`:2417`) — re-express, and say so explicitly.** Strategy clarification 241
  names it the Unit-1 SNAP_DIR regression guard ("far-ahead + stale `--base`: the
  layer-3 merge survives the far-ahead rebuild, both fields land"), and its ruling
  turns on the rebuild replaying `SNAP_DIR/<id>.merged.md`. The rebuild is being
  deleted, so the case cannot stand as written — but the property it guards must not
  be. Re-express it on the plumbing path: a stale `--base` whose layer-3 merge resolved
  (writing `.merged.md`), then `origin/main` advancing mid-run so
  `reconcile_plumbing_base` runs against the newer tip, asserting the layer-3 merged
  content survives and both fields land. Case 75 (`:3360`, "plumbing + a STALE
  `--base`") is the fixture to extend. **Case 22 (`:1660`) and case 22b (`:1692`) — the
  frozen-original SNAP_DIR contract — are layer-3 cases and must pass byte-unchanged.**
- Cases 60-69 (`:3021-3237`, `build_commit_plumbing` units) and 74/76/77
  (`:3335`, `:3388`, `:3426`) pass as-is. **Case 67 (`:3128`, `GRAPH_COMMIT_WRITER`
  gating — unset == `worktree`, `plumbing` lands without moving HEAD, unknown value
  refused) is deleted with the variable**, except its "lands without moving HEAD"
  assertion, which must be preserved as a standalone case (it is now the *only*
  writer's contract, and case 66 at `:3117` already asserts the tree/index half).

### Recommended model

`opus` — a cross-cutting deletion through a 4012-line script with load-bearing
comments, a standing invariant that partially retires and must be documented rather
than dropped, and case-by-case test-integrity judgment across ~20 test cases. The plan
deliberately leaves the re-expression shapes to implementation time.

---

## Unit 3 — Sweep the callers and the prose that still describe two writers

### Dependencies

Unit 2.

### Scope

- `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding` — the only
  production opt-in. Delete the `GRAPH_COMMIT_WRITER=plumbing` prefix at line **814**
  and the explanatory comment block at lines **771-796**, which describes a choice that
  no longer exists. Behavior is unchanged; the ledger's writes were already on this
  path.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-eval-finding.sh` — delete or
  re-express the three assertions that pin the opt-in: line **219** (the stub's
  env log), lines **967-968** (assertion 18), and lines **973-975** (the source-text
  assertions). The *behavior* they guarded — the ledger write is not blocked by
  unrelated dirt — is now unconditional and is covered by Unit 2's rewritten case 70;
  do not merely weaken these to keep the count.
- Prose still telling sessions that a dirty tracked file blocks a `graph-commit`
  **rebase**: `.claude/skills/align-tactics/SKILL.md:75`,
  `.claude/skills/align/SKILL.md:78`, `.claude/skills/grounding-research/SKILL.md:33`.
  Each sentence's *other* half — the stale-read hazard — is still true and must stay;
  only the dirty-tree-blocks-the-rebase clause goes. Follow
  `.claude/rules/writing-style.md`.

Out of scope: `graph-census-debt.ts`'s `--prune` guidance text (`:161-230`, `:288`) —
still accurate, and Unit 1 does not change the `--prune` CLI contract.

### Recommended model

`sonnet` — mechanical deletions across named files with an explicit diff shape and no
design decisions left open.

---

## Reuse

Every item below already exists; none of it is to be re-derived.

- `run_merge_node()` — `packages/intentionsutil/scripts/graph-commit:1073-1116`. The
  shared `merge-node.ts` wrapper used by layer 2, layer 3, the far-ahead replay and
  `reconcile_plumbing_base`. Routes merge-node's three-way exit contract
  (0 = verdict, 3 = content-shaped rejection, other = tool-could-not-run). **Unchanged
  by every unit.**
- `merge-node.ts` CLI contract — `packages/intentionsutil/scripts/merge-node.ts:61-115`.
  `--base/--ours/--theirs/--out` as plain paths, empty string = side absent. Confirmed
  git-independent. **Unchanged.** Invoke it only through `run_merge_node`; the
  `node --import tsx/esm` shape at `graph-commit:335-336,1081-1082` is deliberate
  (`merge-node.ts:7-8`: the `tsx` CLI opens an IPC socket a sandboxed caller cannot,
  EPERM) — never `npx tsx`, which case 83 (`test-graph-commit.sh:3705`) pins.
- `reconcile_plumbing_base()` — `graph-commit:1785-1839`. The direct three-way merge
  this node is named for. Unit 1 edits its prune branch; Unit 2 makes it the only
  reconciliation path.
- `prepare_plumbing_sha()` — `graph-commit:1912-1938`. The rebase-free "produce this
  attempt's SHA" step. Its comment at `:1921` already notes that the fork point it
  computes "is precisely what `git pull --rebase` would three-way against for the
  worktree writer."
- `build_commit_plumbing()` — `graph-commit:1661-1748`. read-tree / update-index /
  write-tree / commit-tree against a throwaway index, with a date pinned to the base's
  committer date so a retry against an unchanged base re-mints the same SHA.
- `blob_sha_or_empty()` — `graph-commit:1176-1183`. Blob SHA of `intentions/<id>.md`
  at a commit-ish, empty when absent (mirrors merge-node's empty-arg convention).
- ~~`list_entries_dropped_by_ours()` / `frontmatter_list_entries()`~~ — **DELETED
  2026-08-30 (PR #3144). Not available for reuse; do not reimplement.** Both helpers and
  the guard that called them are gone from `graph-commit`. The behavior they approximated
  is supplied correctly by the base-aware `threeWayList`
  (`packages/intentionsutil/src/node-merge.ts:151`), which is base-aware where the guard
  was not. A plan step that reaches for these will find nothing; a plan step that
  recreates them re-introduces a refusal on a case the merge now handles.
- `id_files_differ_from_rev()` — `graph-commit:1855-1870`. Rev-relative (not
  HEAD-relative) "is there anything to land". Unit 1 uses it for the nothing-left-to-land
  test; Unit 2 uses it to replace `id_files_dirty()` in `main()` and `park_and_exit()`.
- `sync_ids_to_rev()` — `graph-commit:1882-1893`. Path-scoped restore of exactly this
  invocation's node files; the survivor of `park_and_exit()`'s fork.
- `is_prune_id()` — `graph-commit:2443-2450`. The shape for Unit 1's
  `is_prune_satisfied_id()`.
- `ensure_intentions_only_base()`'s prune guard — `graph-commit:1347-1360`. The
  **specification** Unit 1 copies into `reconcile_plumbing_base`, before Unit 2 deletes
  the original.
- `print_verdict` / `emit_verdict_and_exit` — `graph-commit:2280-2340` and the
  `landed-equivalent` contract documented at `graph-commit:150-153`. Unit 1 routes into
  these rather than adding a verdict status.
- Test fixtures: `test-graph-commit.sh` cases 70-75 (`:3243-3387`) for plumbing CLI
  shape, case 51 (`:2540`) for a prune-race fixture, case 75 (`:3360`) for the stale
  `--base` + plumbing composition Unit 2 extends for case 48.

---

## Verification

All three fences run from the repo/worktree root and are what CI runs
(`.github/workflows/unit-tests.yml:305` and neighbours).

```verify
packages/intentionsutil/scripts/test-graph-commit.sh
```

```verify
packages/intentionsutil/scripts/test-land-align-round.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-eval-finding.sh
```

After Unit 2, assert the rebase machinery is gone by name. Written as a positive
count assertion on a single-line pattern (a bare negated `grep` in a fence can pass
vacuously when the pattern wraps):

```verify
set -e
pat='pull --rebase|rebase --abort|rebase_in_progress|try_layer2_resolve|stage_file_or_empty|GRAPH_COMMIT_WRITER|assert_clean_outside_ids|ensure_intentions_only_base|replay_snapshot_onto_base|id_files_dirty|commit_files'
n=$(grep -cE "$pat" packages/intentionsutil/scripts/graph-commit || true)
if [ "$n" -ne 0 ]; then grep -nE "$pat" packages/intentionsutil/scripts/graph-commit; echo "FAIL: $n residual worktree-arm references"; exit 1; fi
echo "ok: worktree arm fully removed"
```

Prose and shell lint (`shellcheck`, the `.claude/rules/shell-json.md` matcher) run
through `.claude/skills/dispatch-propagate/scripts/run-lint.sh` in CI; run it locally
before pushing rather than discovering a lint failure in review.

### Manual and judgment checks

- **Unit 1, before Unit 2 exists:** run the new peer-already-deleted case with
  `GRAPH_COMMIT_WRITER` **unset** as well as `=plumbing`, and confirm the worktree arm
  is byte-for-byte unaffected — Unit 1 must not change worktree-arm behavior at all.
- **Test-integrity audit, Unit 2.** For every case removed, state in the commit
  message which deleted behavior it covered. A case removed without a named deleted
  behavior is a weakened test, which `.claude/rules/test-integrity.md` forbids
  outright. The pairs that most need this written down: 48 → re-expressed on case 75's
  fixture; 52 → SUPERSEDED 2026-08-30 (PR #3144): the assertion was not re-expressed
  elsewhere, it was REWRITTEN IN PLACE to pin the opposite outcome, and the named
  deleted behavior is "a far-ahead list-entry removal parks". Assertion count held at
  124 under both behaviors, so nothing was traded away; 67 → its "lands without moving
  HEAD" half preserved standalone;
  70 → its plumbing half promoted to unconditional.
- **Case-count sanity.** `test-graph-commit.sh` is 3732 lines and mentions
  `GRAPH_COMMIT_WRITER` 30 times today. After Unit 2 that count must be 0, and the
  suite's own header "Covers:" list (`:13-40` onward) must be rewritten to match — it
  is documentation a reader trusts.
- **Post-merge, observe in production (`needs-main`).** The first fleet
  `graph-commit` landings after this merges are the real test of the deletion, because
  there is no longer a `GRAPH_COMMIT_WRITER=worktree` fallback. Watch the next dispatch
  tick's graph writes for: a `landed` verdict line on an ordinary node write; a
  successful `land-align-round` prune; and no `main busy` exhaustion attributable to
  the writer change. A regression here is a forward fix, not a rollback — record that
  in the PR body so a reviewer is not left looking for an escape hatch that no longer
  exists.
