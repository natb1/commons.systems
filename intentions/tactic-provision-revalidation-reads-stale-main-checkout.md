---
id: tactic-provision-revalidation-reads-stale-main-checkout
kind: tactic
statement: Stop provision-node-worktree's worker-start re-validation answering
  from the main checkout's WORKING TREE — it fetches `origin/main` and then
  reads node state with `check-node-selection.ts --dir $PROJECT_ROOT/intentions`,
  a plain filesystem read that the fetch does not update, so whenever that
  checkout lags the gate reports a false `stale-selection` (exit 12) against a
  selection that was correct at `origin/main`; read the node from `origin/main`
  directly, as the repo's own stated rule already requires
owner: ai
status: raw
parent: null
rationale: "Observed 2026-08-13 on the /dispatch-ladder run of
  tactic-attention-namespaced-rank, twice, and it halted the ladder once.
  The qa->review transition landed on origin/main at 14:19:42Z (commit
  db9e7f2c). Beginning at 14:22:35Z — nearly three minutes LATER —
  provision-node-worktree refused six consecutive times with the identical
  reason `stale-selection: phase: selected review but node is now qa`, and the
  ladder halted `stalled` at 14:23:07Z once the requeue budget drained.
  origin/main said `review` throughout; graph-select-target read it correctly
  and emitted `review`; only the gate said `qa`. The gate was wrong, not the
  selection. Mechanism, all verified in the source: provision-node-worktree:115
  runs `git fetch origin main`, which updates refs and NOT any working tree;
  provision-node-worktree:129 then calls check-node-selection.ts with
  `--dir \"$PROJECT_ROOT/intentions\"`, and check-node-selection.ts:224 answers
  with `readNode(dir, nodeId)` — a filesystem read of whatever is checked out at
  the project root. The fetch is therefore inert with respect to the very read
  the gate makes. The comment at provision-node-worktree:122-125 states the
  precondition honestly — 'The main checkout is kept fast-forwarded to
  origin/main by dispatch-select-tick' — but that precondition is unmet on the
  ladder path: dispatch is paused, select-tick does not run, and the ladder's
  own `git merge --ff-only origin/main` on the main checkout lives inside
  reconcile_pass, which the `stale-selection` requeue arm never calls. The
  second occurrence is the corroborating control: five more requeues at
  14:29:58-14:30:27Z, then the main checkout's working-tree copy of
  intentions/tactic-attention-namespaced-rank.md was rewritten at 14:30:31Z
  (file mtime), and the very next advance launched /review-fix at `review` at
  14:30:52Z. Nothing about the selection changed between the sixth refusal and
  the launch — only the freshness of the file the gate reads."
reading: null
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
`origin/main`.

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

## The evidence

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

## Directions

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
