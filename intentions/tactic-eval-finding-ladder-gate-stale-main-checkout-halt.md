---
id: tactic-eval-finding-ladder-gate-stale-main-checkout-halt
kind: tactic
statement: dispatch-ladder halts exit-12 stalled on a phase that SUCCEEDED — the
  selector reads origin/main but provision-node-worktree re-validates against
  the main checkout working tree, which nothing on the advance path
  fast-forwards, so the transition the ladder just landed reads as a stale
  selection until the requeue budget runs out
owner: ai
status: raw
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
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
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-13
  measured_impact:
    - metric: stale_selection_refusals
      value: 6
      unit: refusals
      window: tactic-attention-namespaced-rank qa phase, 2026-08-13T14:22:35Z-14:23:07Z
      sensor: events.jsonl
      measured: 2026-08-13
    - metric: requeue_budget_exhaustion_s
      value: 32
      unit: seconds
      window: tactic-attention-namespaced-rank qa phase, 2026-08-13T14:22:35Z-14:23:07Z
      sensor: events.jsonl
      measured: 2026-08-13
    - metric: main_checkout_lag_commits
      value: 3
      unit: commits
      window: main checkout fbb9be83 vs origin/main db9e7f2c, 2026-08-13T14:23:07Z
      sensor: git
      measured: 2026-08-13
    - metric: halted_after_successful_phase_price_proxy_usd
      value: 78.39
      unit: usd
      window: tactic-attention-namespaced-rank qa phase attempt 4, 2026-08-13
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: stale_selection_requeues
      value: 10
      unit: requeues
      window: tactic-attention-namespaced-rank runs A+B 2026-08-13T14:05..14:31Z
      sensor: events.jsonl
      measured: 2026-08-13
    - metric: runs_halted
      value: 1
      unit: runs
      window: tactic-attention-namespaced-rank runs A+B 2026-08-13T14:05..14:31Z
      sensor: events.jsonl
      measured: 2026-08-13
    - metric: launch_delay_s
      value: 61
      unit: seconds
      window: tactic-attention-namespaced-rank review launch 2026-08-13
      sensor: events.jsonl
      measured: 2026-08-13
    - metric: recurrence_count
      value: 2
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-13
  resolved_by: 43d13914717716f756ca957991e1bcaed262563f
---
## Merge note — this entry absorbed a duplicate node

This defect was minted twice on 2026-08-13, ten minutes apart: once here as the
ledger entry, and once as `tactic-provision-revalidation-reads-stale-main-checkout`,
which carried the mechanism analysis and the resolution record. The fix that
shipped — `43d13914` (#3079) — credited only the duplicate, so the recurrence
metric lived on one node and the remediation on the other.

The duplicate's technical content was folded into this body and the duplicate
pruned (2026-08-13). This node is the single ledger entry for the defect: it
carries `attributes.ledger_entry`, `first_seen`, `recurrence_count: 2`, and the
impact records for both occurrences. The merge was editorial — it did **not**
increment `recurrence_count`, because no new occurrence was observed.

## The defect

`provision-node-worktree` re-validates a selection at worker start, because
selection froze the node's directive at tick start and the worker may begin
minutes later. The intent is right. The read is not.

```
:115   git fetch origin main                      # updates REFS
:129   check-node-selection.ts ... --dir "$PROJECT_ROOT/intentions"
:224   (check-node-selection.ts)  readNode(dir, nodeId)   # reads the WORKING TREE
```

`git fetch` never touches a working tree. So the gate fetches one thing and
reads another: its answer comes from whatever `intentions/` happens to be
checked out at the project root, which may be arbitrarily far behind
`origin/main`. Whenever that checkout lags, the gate reports a false
`stale-selection` (exit 12) against a selection that was correct at
`origin/main` — `graph-select-target` read the ref and emitted `review`; only
the gate said `qa`. The gate was wrong, not the selection.

The gate's own comment names the precondition that makes this safe:

> The main checkout is kept fast-forwarded to origin/main by
> `dispatch-select-tick`, so its `intentions/` store is the fresh-origin/main
> snapshot the gate requires.  — `provision-node-worktree:122-125`

That is a true statement about the *tick* path and a false one about every other
caller. It is an undocumented coupling to a different script's side effect.

## Why the ladder path does not satisfy it

Three facts compose:

1. **`dispatch-select-tick` does not run.** Dispatch is paused for this work, and
   the pause sentinel stops select-tick — so nothing is fast-forwarding the main
   checkout on the tick's cadence.
2. **The ladder's own ff lives in the wrong branch of the loop.** The driver does
   run `git fetch origin main; git merge --ff-only origin/main` against the main
   checkout — but inside `reconcile_pass`, which `dispatch-ladder-run` calls only
   from the `*)` arm of the idle switch. The `stale-selection` arm
   (`dispatch-ladder-run:1099-1107`) decrements the budget and `continue`s with
   **no reconcile pass and no sleep**.
3. **So the requeue loop re-asks a question whose answer cannot change.** Nothing
   inside the loop refreshes the source of the staleness. Five retries in ~30
   seconds all read the same stale file, then the budget drains and the driver
   halts `stalled` — reporting "the node keeps being re-selected without
   progressing" when in fact the node had already progressed and only the gate
   could not see it.

## The evidence — `tactic-attention-namespaced-rank`, 2026-08-13

| Time (UTC) | Event |
|---|---|
| 14:19:42Z | `db9e7f2c` — node transitions to `review` **on origin/main** |
| 14:22:35Z | `stale-selection: phase: selected review but node is now qa` (budget 4) |
| 14:22:41Z / 14:22:48Z / 14:22:54Z / 14:23:00Z | same message, budget 3 → 0 |
| 14:23:07Z | `halt qa stalled — the requeue budget ran out` |
| 14:29:58Z–14:30:27Z | re-spawn; same message five more times, budget 4 → 0 |
| **14:30:31Z** | main checkout's `intentions/<id>.md` **rewritten** (mtime) |
| 14:30:52Z | `launched review — kind=tactic skill=/review-fix` |

The second block is the control. The selection did not change between the sixth
refusal at 14:30:27Z and the launch at 14:30:52Z. The only thing that changed is
the mtime at 14:30:31Z — the freshness of the file the gate reads.

### The same window, as the two ladder runs saw it

The symptom fired twice in eight minutes, on consecutive runs, either side of
the `review` phase's launch.

**Run A** (started 14:05:13Z). The `qa` phase advanced cleanly at 14:22:27Z
(`awaited` / `advanced`, `elapsed_s=1009`). The transition was at `origin/main`
— `db9e7f2c` reached it at 14:20:39Z per `git reflog show origin/main`. The
driver then burned its whole requeue budget on the node it had just advanced:

```
14:22:35Z idle qa stale-selection requeue_budget=4
14:22:41Z idle qa stale-selection requeue_budget=3
14:22:48Z idle qa stale-selection requeue_budget=2
14:22:54Z idle qa stale-selection requeue_budget=1
14:23:00Z idle qa stale-selection requeue_budget=0
14:23:07Z halt qa stalled  "the requeue budget ran out on repeated
                            'stale-selection' — the node keeps being
                            re-selected without progressing"
```

**Run B** (started 14:29:51Z), 6 minutes 44 s later. Identical, from a cold
start, with no phase yet launched (`phase: null`):

```
14:29:58Z idle stale-selection requeue_budget=4
14:30:06Z idle stale-selection requeue_budget=3
14:30:13Z idle stale-selection requeue_budget=2
14:30:20Z idle stale-selection requeue_budget=1
14:30:27Z idle stale-selection requeue_budget=0
14:30:52Z launched review  kind=tactic skill=/review-fix
```

Run B consumed all five requeues and then succeeded 25 s later. So the same
condition that terminated Run A cleared on its own inside Run B — consistent
with the diagnosis that the blocker is the **main checkout's working tree**
lagging `origin/main`, with recovery whenever something else fast-forwards it,
rather than with anything the driver did.

## Cost measured here

- **10 stale-selection requeues** across the two runs.
- **One run terminated** (Run A, exit 12 `stalled`) on a phase that had
  succeeded 40 s earlier.
- **61 s** of Run B's wall clock (14:29:51 → 14:30:52) spent before the review
  phase could launch, with zero requeue budget left as a safety margin — one
  more stale read and Run B would have halted exactly as Run A did.
- Run A's halt cost a full driver restart: a human or scheduler had to start
  Run B.

## Attribution note

The second occurrence matches the described symptom exactly (repeated
`stale-selection` on a just-landed transition, until the requeue budget runs
out) and is on the same driver. It was **not** independently verified that the
main checkout's working-tree HEAD lagged `origin/main` at 14:22:35Z and
14:29:58Z — that state is no longer observable. The symptom match is exact; the
causal attribution is inherited from the first occurrence's source-verified
mechanism trace, not re-proven at each timestamp.

## Blast radius beyond the ladder

This is not a ladder-only defect; the ladder is only where it is *loud*, because
the requeue budget converts it into a halt. Every caller of
`provision-node-worktree` that does not first fast-forward the main checkout
inherits a gate that can refuse correct work:

- the ladder driver (`dispatch-graph-execute` → `provision-node-worktree`),
- any hand invocation of `/implement`, `/qa-fix`, `/review-fix` on a node,
- any future caller, since nothing in the signature advertises the coupling.

The failure is also **silently one-directional**: a stale checkout can only
report a node as being at an *older* phase than it really is, so the gate
refuses work that should run. It never admits work that should not. That is the
safe direction, which is why this survived undetected — it costs throughput and
halts, not correctness.

## Directions considered

1. **Read the node from `origin/main`, not from a checkout.** This is the
   repo's own stated rule for exactly this class of read, and the gate is a
   violation of it. Give `check-node-selection.ts` a `--ref <git-ref>` mode that
   resolves the node with `git show <ref>:intentions/<id>.md` instead of a
   filesystem read, and have `provision-node-worktree` pass `--ref origin/main`.
   The fetch at `:115` then actually feeds the read it precedes. This is the
   greenfield answer: it removes the coupling rather than documenting it, and it
   makes the gate correct for every caller including ones not yet written.

2. **Failing that, make the precondition explicit and enforced.** If the gate
   keeps reading a checkout, `provision-node-worktree` must fast-forward that
   checkout itself rather than assuming another script did — and must fail loudly
   if it cannot, rather than answering from stale state. A precondition that is
   only stated in a comment is not a precondition.

3. **Independently: the `stale-selection` requeue arm must refresh something.**
   Even with the gate fixed, a bounded retry loop that re-runs an identical
   computation with no intervening state change is a spin, not a retry. It should
   either run a reconcile pass between attempts or not retry at all. As written
   it converts a transient into five copies of the same transient, and its halt
   message ("the node keeps being re-selected without progressing") misattributes
   the cause — the node *was* progressing.

## Relationship to the ladder findings already recorded

Same family as `tactic-ladder-await-phase-only-completion-test` (fixed in
PR #3077): a ladder halt reported as `stalled` on work that had in fact
succeeded. That one was the *await* reading real graph state and drawing the
wrong conclusion from it; this one is the *provision gate* reading state that is
not current at all. Fixing the await did not fix this — both halts documented
above happened after `7410e07f` merged.

## Resolved

Fixed in **PR #3079**, squash-merged **`43d13914`** on 2026-08-13.

### Direction 2 was taken, not direction 1

The finding proposed direction 1 — give `check-node-selection.ts` a `--ref` mode
and read the node with `git show origin/main:intentions/<id>.md` — as the
greenfield answer. The implemented fix is **direction 2**: make the checkout
current before the read. Three reasons, recorded so the choice is not
re-litigated from the direction list alone:

1. **It fixes every reader of that tree, not one.** Direction 1 corrects the one
   gate; every other consumer of `$PROJECT_ROOT/intentions` — including the
   reconcilers that *write* through it — keeps reading a possibly-stale
   checkout. A `--ref` fix would have had to list "audit the other `--dir`
   readers" as out of scope, which is a tell.
2. **Direction 1 is not actually cheap.** It breaks
   `check-node-selection.ts`'s stated "no git" contract, and the script needs
   the *whole store* (`listNodesStrict` at `:321`/`:329`/`:351`), so a bare
   `git show` of one file could not have served it.
3. **It discharges a follow-up the codebase already owed.**
   `dispatch-ladder-run:792` recorded "a shared `sync_main_checkout` helper
   across the three call sites is a deliberately deferred follow-up". The fix is
   that helper, extended by a fourth call site.

`sync_main_checkout` now lives in `lib.sh:2094` (fetch, then
`merge --ff-only`, with distinct return codes for fetch-failed vs merge-failed
so each caller phrases its own escalation) and is wired into all four sites:
`dispatch-ladder-run:884`, `dispatch-tick:595`, and — the actual fix —
`provision-node-worktree:161`, **before** the gate rather than after a bare
fetch. The three pre-existing sites keep their exact prior behaviour; only
provision's is new.

**Accepted cost, stated plainly:** a dirty or diverged main checkout previously
produced silently stale reads and now produces a loud refusal. That converts a
throughput bug into a hard stop. It is the right direction per
`.claude/rules/code-style.md`, and it is already how `dispatch-ladder-run` and
`dispatch-tick` treat the same condition — consistent, not novel.

### Direction 3 — what was actually done

Direction 3 asked that the `stale-selection` requeue arm "refresh something".
It still does not reconcile between attempts, and with the gate fixed it no
longer needs to — the arm's premise (an identical computation re-run with no
intervening state change) was a *consequence* of the stale gate, not an
independent defect.

What did change is the arm's honesty. The halt text no longer asserts "the node
keeps being re-selected without progressing" — a causal claim the driver never
established and which was false in both observed cases. It now reports "the
requeue budget drained on repeated '$REASON'", and
`dispatch-ladder-advance`'s stderr reason reaches `events.jsonl` alongside the
budget figure, so the arm names what it saw instead of guessing why. Same exit
code (12), same disposition (`stalled`).

### The starvation link — the part most likely to be re-discovered

The same defect **suppressed the merged-tree guarantee**. The gate at the old
`:129` refuses *before* `provision-node-worktree`'s unconditional
`origin/main` merge into the node worktree (`~:347`) ever runs. That is why a
phase could execute against a stale skill — the improvements had landed on main
and the worktree never received them.

This presented as a second, separate bug and is not one. Fixing the gate
restores skill freshness and early conflict detection for free. Anyone who
re-encounters "the node worktree is missing a change that merged mid-run"
should read this section before filing.

### Also landed in the same PR

`dispatch-ladder-run` gained a read-only, **advisory** mid-phase conflict
prediction (`check_main_conflict_prediction`, `:782`) using
`git merge-tree --write-tree origin/main "origin/$NODE_ID"`, which writes only
to the object store and so is safe against a branch a live worker is committing
to. It reuses the existing poll cadence and is **edge-triggered** — one event on
a change of verdict, never one per poll. It never gates and never halts; the
authoritative answer stays provision's real merge at the next phase boundary.
This closes the remaining gap that a conflicting commit landing *during* a phase
goes unnoticed until the next provision, which may be an hour later.

### Regression coverage, and where the code still cites the pruned id

`test-provision-node-worktree.sh` cases 14–17 cover the gate's checkout-freshness
behaviour (header note at `:42`, case block at `:519`), and `lib.sh:2078` carries
the `sync_main_checkout` header comment explaining fetch-without-merge.

All three of those comments name the pruned duplicate,
`tactic-provision-revalidation-reads-stale-main-checkout`. They are prose
references — they do not break a prune — but a reader who follows one will find
no node. **This node is where those comments now point.** Rewriting them was out
of scope for the merge (graph-only change); anyone touching those files should
repoint them to `tactic-eval-finding-ladder-gate-stale-main-checkout-halt`.
