---
id: tactic-graph-commit-noop-landing-false-failure
kind: tactic
statement: graph-commit runs a full CI-stamped landing cycle for a write that is
  already a no-op, and its required-check gate counts check-run ROWS rather than
  distinct required contexts — so that cycle can never pass on an
  already-stamped SHA, converting a no-op write into a false 'main busy' failure
  that fails the whole dispatch tick
owner: ai
status: raw
parent: null
rationale: "(Recorded 2026-07-28 /align-strategy round.) Diagnosed live from the
  2026-07-28 manual dispatch tick that exited 1. Chain: tactic-sync-reader-skill
  provisioned exit 13 (scope-stale), so dispatch-graph-execute called
  demote-node-to-implement; the node was ALREADY at phase implement, so the
  write staged nothing; graph-commit took its 'no new changes to stage — landing
  current HEAD' branch (graph-commit:1476) and entered a real landing cycle
  against e81ae2f5, which was already origin/main HEAD and already CI-stamped.
  await_checks (graph-commit:610) then gated on `[[ \"$nsucc\" -eq 4 ]]`, where
  nsucc counts check-RUN ROWS matching the four required names — not distinct
  contexts. Verified against the GitHub API: e81ae2f5 carried exactly 3
  successful runs of each of acceptance, preview-and-smoke, lint, unit-tests (12
  rows, 0 failures) because the same SHA had been pushed to two graph/** scratch
  branches and to main, each firing the fast path. 12 != 4, so the gate could
  never return 0; five attempts x 180s were burned (attempts 2-5 pushed nothing
  — 'Everything up-to-date'), then the run died with 'main busy (landing-lock
  contention or required checks never stamped green)'. Neither cause was
  present: no competing writer, no red check. demote-node-to-implement rolled
  its write back and reported 'failed tactic-sync-reader-skill demote-failed',
  which forced dispatch-graph-execute's exit 1 (dispatch-graph-execute:320) and
  the tick's failure. Filed as a SEPARATE node from the graph-commit siblings,
  per the same distinct-defect-class discipline they already follow:
  tactic-graph-commit-landing-lock is contention serialization (done),
  tactic-graph-commit-cwd-repo-resolution was wrong-repo targeting (done),
  tactic-graph-commit-staleness-silent-revert is staleness misjudging a genuine
  dirty edit. This node is the inverse of that last one — there, a real edit is
  lost and reported as success; here, an absent edit is reported as failure —
  but both are reached through the same land-current-HEAD fallback, which is why
  they cross-reference. That fallback was hardened on 2026-07-28 by PR #2978
  (merged as 29952532) to die on a mis-pointed -C rather than emit a false
  'landed'; #2978's own comment at graph-commit:1457-1459 asserts the surviving
  benign branch is 'a trivial no-op push when HEAD == origin/main', and this
  incident is the counterexample — it is not trivial, because it still runs the
  full scratch-push + await_checks stamp cycle. Interim by construction:
  tactic-graph-ref-split deletes the CI stamp entirely (graph lands on
  origin/graph-main under a validate-only gate), which removes await_checks and
  this whole defect class; this node exists because that is a large in-flight
  change and this failure fails ticks deterministically today, at roughly 15
  wasted minutes per occurrence."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: The boost 97 is meant to make this the next thing the fleet works —
      does it actually do that while the node is a draft?
    answer: "(Recorded 2026-07-28 /align-strategy round.) Not yet, and this is
      recorded so the gap is not mistaken for a ranking failure. This node is
      filed status: raw with phase: null — a draft — and the router never
      selects a draft tactic, so the 97 boost is INERT until an /align-tactics
      round finalizes this node into a planned tactic with a phase. Only then
      does it resolve to 102.33 and rank at the top of the authored
      discretionary band. The precedent that motivated recording this:
      tactic-graph-commit-staleness-silent-revert carried an authorized boost of
      173 from 2026-07-26 while sitting at status raw / phase null, and was
      never selected on that boost at all — its fix ultimately shipped through
      an office-hours drain session (PR #2978), not through the ranking the
      boost was intended to buy. What unblocks this node is therefore an
      /align-tactics round on strategy-graph-native-dispatch, which is already
      in the align-tactics rotation (it was selected for that lane in the
      2026-07-28 tick that surfaced this defect). If the fix is wanted sooner
      than that rotation delivers, the direct route is an office-hours or
      interactive session against this node rather than a higher boost — raising
      the number changes nothing while the node remains a draft."
tooling_goals: []
success_signal: null
attention:
  boost: 97
  override: null
  rationale: "Author-directed 2026-07-28 /align-strategy round: lift to the top of
    the authored discretionary band. Composes with the +5.33 inherited from
    strategy-graph-native-dispatch to a resolved 102.33, just above the current
    top authored rank of 101.33 (tactic-dispatch-conflict-branch-merge-lane,
    boost 96) — measured from select-targets.ts this session, not estimated.
    Deliberately held at 97, below strategy-main-health's standing 100, so no
    >=100 authorization or ACK substring is required (schema rule 18). It does
    NOT out-rank the live composed max of 387.33
    (tactic-scope-fingerprint-plan-substance, whose rank is compounded by
    inbound blocked_by rather than authored); that node is at qa on PR #2974 and
    expected to complete, after which this becomes the effective top selectable
    target. Justification: this defect fails whole dispatch ticks
    deterministically and misreports its own cause, so every occurrence costs
    both the tick and the diagnosis time."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# graph-commit turns a no-op write into an unlandable CI-stamp cycle, then reports it as "main busy"

## Context

`packages/intentionsutil/scripts/graph-commit` is the sole write primitive that
lands intention-node edits on `main`. Its landing path has two independent
defects that compose into a deterministic tick failure. Both were observed live
on 2026-07-28 and confirmed against the GitHub API and the script source at
`origin/main` (29952532).

## Defect 1 — a no-op write still buys a full landing cycle

When nothing is staged for any target id, `graph-commit` prints
`no new changes to stage ... landing current HEAD` (graph-commit:1476) and falls
through to `land`. PR #2978 (merged 2026-07-28 as 29952532) hardened this branch
to `die` when a target id's local blob differs from `origin/main` — the
mis-pointed `-C` case. What survives is the branch its own comment
(graph-commit:1457-1459) describes as benign:

> already landed out-of-band, or a prior attempt committed but did not push →
> land the current HEAD (a trivial no-op push when HEAD == origin/main)

It is not trivial. `land` runs the whole cycle: claim the landing lock, push a
`graph/**` scratch branch, poll `await_checks` for the four required contexts,
then push to `main`. When `HEAD == origin/main` there is by definition nothing to
push, so that entire cycle is pure cost — and, per Defect 2, cost that cannot
succeed.

The two cases the comment lumps together are mechanically distinguishable:

- `HEAD == FETCH_HEAD (origin/main)` — nothing to push. A genuine no-op; the
  correct outcome is immediate success without entering `land`.
- `HEAD != FETCH_HEAD` — a prior attempt committed locally but did not push.
  This one genuinely needs `land`, and is the case the fallback exists for.

## Defect 2 — the required-check gate counts rows, not contexts

`await_checks` (graph-commit:584-630) counts check-run rows whose `name` matches
one of the four required contexts, then gates on exact equality:

```sh
if [[ "$nsucc" -eq 4 ]]; then return 0
```

`nsucc` is a count of *rows*, not of distinct contexts. A commit accumulates one
row per context **per workflow run**, and the same SHA is re-stamped every time
it is pushed to another `graph/**` scratch branch or to `main`. Once more than
one run exists, `nsucc` is 8, 12, 16 … and the equality can never hold — the SHA
becomes permanently unlandable.

Observed on `e81ae2f5c58bd2634b047e86c534e1867684ede7`:

| context | successful runs |
|---|---|
| `acceptance` | 3 |
| `preview-and-smoke` | 3 |
| `lint` | 3 |
| `unit-tests` | 3 |

Twelve green, zero failed, `nfail == 0` so the deterministic exit-2 path never
fired either. The run polled 180s, retried, and repeated five times — attempts
2-5 pushed nothing (`Everything up-to-date`), so they were guaranteed to observe
the same 12.

Relaxing the gate to `-ge 4` would be wrong: with duplicate rows, four green
`lint` rows and zero `acceptance` rows also satisfies it. The gate must count
**distinct context names** that are green, taking the latest run per name, and
require all four present.

## Defect 3 — the diagnostic names a cause that was not present

The terminal error reads `main busy (landing-lock contention or required checks
never stamped green)`. Neither held: no competing writer, and every required
check was green. The message should report the per-context state it actually
observed (which names are green, pending, or failed, and how many rows each has),
so this signature is not misread as contention — see the amended clarification 80
on `strategy-graph-native-dispatch`.

## How the three compose into a tick failure

1. `tactic-sync-reader-skill` provisioned exit 13 (scope-stale).
2. `dispatch-graph-execute` case 13 called `demote-node-to-implement`.
3. The node was **already** at `phase: implement`, so the write staged nothing.
4. Defect 1 sent a pure no-op into a landing cycle on an already-stamped SHA.
5. Defect 2 made that cycle unpassable; 5 x 180s burned.
6. Defect 3 reported contention.
7. `demote-node-to-implement` rolled back and printed
   `failed tactic-sync-reader-skill demote-failed`.
8. `dispatch-graph-execute:320` (`(( FAILURES == 0 )) && exit 0 || exit 1`)
   exited 1, failing the tick.

Note step 3: the node was already in the target state, so the correct outcome for
the whole chain was success.

## Suggested shape (two units — for /align-tactics to plan, not a plan)

- **Unit 1 — no-op guard.** In the nothing-staged branch, after #2978's existing
  per-id blob comparison, return success without entering `land` when
  `HEAD == FETCH_HEAD`. Preserve the existing behaviour when they differ.
- **Unit 2 — distinct-context gate.** Rewrite `await_checks`'s counting to
  reduce check runs to one latest row per required context name before counting
  green, and report per-context state in both the timeout and the concluded
  non-success messages.

## Verification

`packages/intentionsutil/scripts/test-graph-commit.sh` is the existing
bare-origin + multi-clone harness and the natural home for both cases: a no-op
invocation that must exit 0 without pushing a scratch branch, and an
`await_checks` case whose `gh` shim returns duplicate green rows per context
(the harness already shims `gh api ... check-runs`).

## Relationship to other nodes

- `tactic-graph-ref-split` — the greenfield fix. It moves the graph to
  `origin/graph-main` under a validate-only gate, deleting the CI stamp and with
  it `await_checks` and Defect 2 entirely. This node is interim and should be
  dropped if ref-split lands first.
- `tactic-graph-commit-staleness-silent-revert` — the inverse failure through the
  same fallback (a real edit lost and reported as success). Cross-reference when
  diagnosing.
- `tactic-graph-commit-landing-lock` (done) — serializes the stamp; unaffected by
  and orthogonal to both defects here.

## Out of scope

No implementation plan is carried here — filed `status: raw`, `phase: null` for a
later `/align-tactics` round. Raising `GRAPH_COMMIT_MAX_ATTEMPTS` is explicitly
not a fix: every retry re-observes the same duplicate rows.
