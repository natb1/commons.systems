---
id: tactic-graph-explicit-node-dispatch
kind: tactic
statement: give the graph lane an explicit single-node dispatch entrypoint
  (dispatch <node-id>) that skips the pace gate, by extending the existing
  ranked-selection gating machinery to accept one explicit target
owner: ai
status: codified
parent: null
rationale: "Surfaced 2026-07-11 while explicitly executing
  tactic-graph-census-recurrence's implement phase: the graph lane had no CLI
  entry to dispatch one node on demand, so the only way was calling
  dispatch-graph-execute directly by hand. Finalized 2026-07-18 after a fresh
  /align-tactics pass found the tactic's original premise stale: the entire
  legacy issue lane it was written to mirror (dispatch-resolve-arg ->
  dispatch-select-target -> dispatch-materialize-spawn, and
  dispatch-select-tick's old explicit-arg branch) was deleted by
  tactic-dispatch-legacy-rewire Unit 3 -- dispatch-tick and dispatch-select-tick
  now hard-reject any positional argument. The underlying need is unchanged and,
  if anything, sharper: there is now no explicit-target path anywhere in the
  dispatch pipeline, for issues or graph nodes. Re-grounded against the current
  graph-native-only architecture: graph-select-target already reads a fresh
  origin/main snapshot (git archive, never the working tree) and already runs
  the full selectGraphTargets candidate list plus per-candidate claim gates
  (reservation_exists, worktree_has_live_session) and sensor gates -- the
  missing piece is purely 'let one explicit id skip the rank/--top truncation
  and be evaluated directly,' not new selection or claim logic. Design point 5
  from the original draft (provision-node-worktree's check-node-selection.ts
  reads the main checkout's working tree, which only dispatch-select-tick's
  BRANCH==main sync keeps fresh, so calling dispatch-graph-execute directly by
  hand skips that sync and can hit a false exit-12 stale-selection) is resolved
  for free by this design: routing the explicit node id through dispatch-tick ->
  dispatch-select-tick -> dispatch-graph-execute (instead of invoking
  dispatch-graph-execute directly) means the existing unconditional BRANCH==main
  sync in dispatch-select-tick already runs before target selection, exactly as
  it does for the autonomous and --manual paths today. No new sync code is
  needed; only routing through the existing pipeline instead of bypassing it."
reading: null
gap: null
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
# give the graph lane an explicit single-node dispatch entrypoint (dispatch <node-id>) that skips the pace gate

## Context

The author's standing principle: **explicit human dispatch overrides the
autonomous pace curve.** Today there is **no** way to explicitly dispatch one
named graph node — `dispatch-tick`/`dispatch-select-tick` hard-reject any
positional argument (`dispatch-tick:224-228`, `dispatch-select-tick:152-156`),
a leftover of `tactic-dispatch-legacy-rewire` Unit 3 deleting the old gh-issue
lane (`dispatch-resolve-arg` → `dispatch-select-target` →
`dispatch-materialize-spawn`) wholesale, including its explicit-arg branch.
`graph-select-target` — the sole remaining selector — is purely rank-driven
(`--top <n>` bounds how many of the *ranked* candidates it returns; there is no
way to force one specific id through regardless of rank). The only current
workaround is invoking `dispatch-graph-execute <id:kind:phase>` directly by
hand (done 2026-07-11 for `tactic-graph-census-recurrence`), which bypasses
`dispatch-select-tick` entirely — including the `git fetch origin main && git
merge --ff-only origin/main` it runs on the main checkout before every
selection (`dispatch-select-tick:259-334`, gated on `BRANCH == "main"`). That
sync is what `provision-node-worktree`'s worker-start re-validation gate
(`check-node-selection.ts`, invoked at `provision-node-worktree:87-88`) depends
on for a fresh `phase` read — its own comment says the tree "is kept
fast-forwarded to origin/main by dispatch-select-tick." Skipping
`dispatch-select-tick` by calling `dispatch-graph-execute` directly skips that
sync too, and a node whose phase was just advanced out-of-band then reads its
stale pre-transition phase and false-aborts exit-12 stale-selection (reproduced
2026-07-11 on `tactic-graph-census-recurrence`'s qa phase; confirmed non-issue
once the main checkout was manually synced).

This tactic closes the gap by giving `dispatch <node-id>` a real path through
the *existing* pipeline (`dispatch-tick` → `dispatch-select-tick` →
`dispatch-graph-execute`) instead of the direct-call workaround — which also
resolves the stale-tree false-exit-12 for free, since the existing
`BRANCH == "main"` sync already runs unconditionally before target selection on
that path, with no new sync code needed.

## Unit 1 — `graph-select-target --node <id>`: explicit single-target mode

**Scope.** `.claude/skills/dispatch-propagate/scripts/graph-select-target`.
Add a `--node <id>` flag, mutually exclusive with `--top`/`--pace-exempt-only`
(usage error if combined). The script already builds the full ranked
candidate list from a fresh `origin/main` snapshot via `select-targets.ts`
(lines 156-167) and then loops over `.candidates[]` in rank order applying
claim gates (`reservation_exists`, `worktree_has_live_session`,
lines ~245-254) and `sensor_gate` (lines ~193-234), truncating at `--top`
(the `(( SELECTED_COUNT >= TOP )) && continue` guard, ~line 235). For
`--node <id>` mode:
- Skip the rank-order iteration and `TOP` truncation. Instead select the one
  candidate whose `.id == <id>` from the SAME `SELECTION` JSON (a single `jq`
  filter change on the `while` loop's input, ~line 269:
  `jq -r '.candidates[] | select(.id == $id) | ...'` instead of
  `.candidates[]` unfiltered), and run it through the exact same
  `reservation_exists` / `worktree_has_live_session` / `sensor_gate` sequence
  used today — no new gating logic.
- If the id is present in `.candidates[]` and passes every gate: print
  `node <id> <kind> <phase>` (the existing protocol; `dispatch-select-tick`'s
  `emit_graph_selection` already consumes this unchanged) and exit 0.
- If the id is present but fails a gate (reserved, live-session, or a sensor
  gate like `no-pr`/`ci-pending`/`pr-not-merged`): print the existing
  `skip_note` reason to stderr and print `empty` on stdout, exit 0 (same
  contract the ranked path already uses for a fully-gated-out candidate).
- If the id is absent from `.candidates[]` entirely (does not exist in the
  store, is `done`, has `office_hours` set, has incomplete `blocked_by`, or is
  a `review`-phase tactic already excluded by the `REVIEWED_MARKER` check in
  `selectGraphTargets`): print `graph-select-target: node <id> is not
  selectable (not found, done, parked, blocked, or already reviewed — inspect
  intentions/<id>.md directly for the reason)` to stderr and `empty` to
  stdout, exit 0. Out of scope: differentiating *which* of those reasons
  applies — the human inspecting the node file directly is an acceptable first
  cut for a leaf-sized unit; do not add a second store read to disambiguate.

**Recommended model:** sonnet — a bounded, pattern-following extension of an
existing, well-commented bash+jq script; every gate it reuses already exists
verbatim.

**Dependencies:** none.

**Reuse.**
- `select-targets.ts` / `selectGraphTargets` (`packages/intentionsutil/src/router.ts:250`)
  — already produces the full eligible candidate list (draft tactics routed to
  the `align-tactics` directive rung, soft-frozen re-evaluation candidates,
  `review`+`REVIEWED_MARKER` exclusion) with no changes needed.
- `reservation_exists` (`.claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh:251`)
  and `worktree_has_live_session` (`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:497-522`)
  — the existing claim-safety gates; reused verbatim so there is no new
  `--force`-shaped escape hatch (a live claim always refuses, matching the
  2026-07-11 author decision against preemption).
- `sensor_gate` (`graph-select-target:~193-234`) — the existing per-phase CI/PR
  environmental gate, reused verbatim.

## Unit 2 — thread `dispatch <node-id>` through `dispatch-tick` / `dispatch-select-tick`

**Scope.**
- `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick:147-158` (arg
  parse, before the lock is acquired at line 221). Replace the unconditional
  `*)` rejection with: if `$a` matches the node-id slug shape
  `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` (the exact regex `provision-node-worktree`
  already validates against — reuse it, don't invent a new one), set
  `NODE_ARG="$a"`; otherwise keep the existing rejection message (still
  accurate — a bare number or garbage string is neither a flag nor a graph
  node id). Reject combining `NODE_ARG` with `--manual` as a usage error
  (`--manual` is the "no specific target" fan-out mode).
- Around Step 3 (`dispatch-select-tick:773-791`, the `graph-select-target
  --top "$GAP"` call and `emit_graph_selection` invocation): when `NODE_ARG`
  is set, call `graph-select-target --node "$NODE_ARG"` (Unit 1) instead of
  the ranked `--top "$GAP"` call, still through `emit_graph_selection`
  (`dispatch-select-tick:192-215`, reused unchanged — same `graph 1
  <id>:<kind>:<phase>` decision line, same `reservation_write`, same
  `DLOG_DISPOSITION="graph"`). **Important divergence from the ranked path:**
  if `emit_graph_selection` returns 1 (nothing to emit — the explicit node
  wasn't selectable), do **not** fall through to Step 3b's aux triggers
  (`dispatch-select-tick:793-820`, JIT reminder / main-broken) the way the
  ranked path does today — falling through would silently substitute an
  unrelated JIT/main-broken job for the node the human explicitly asked for.
  Instead: `release_lock`, set `DLOG_DISPOSITION="node-not-selectable"`, print
  `node-not-selectable $NODE_ARG` as the decision line, and exit 0 (a decision
  line the tick script must recognize, not an early script exit — see
  `dispatch-tick` change below).
- `.claude/skills/dispatch-propagate/scripts/dispatch-tick:210-230` (arg
  parse). Same node-id-shape recognition; when matched, pass the raw arg
  through as `dispatch-select-tick "$a"` (~line 350-354, alongside the
  existing `--manual`/no-arg branches) instead of hard-rejecting it before
  that call.
- `dispatch-tick`'s decision-line routing (the `case "$DECISION" in ... esac`
  dispatching on `graph`/`empty`/`busy`/etc., near line 438 per the existing
  `graph)` arm): add a `node-not-selectable)` arm that prints the node id and
  a "nothing dispatched" message to stderr and exits non-zero (a real,
  actionable failure — distinct from the generic `empty` disposition's "will
  check aux triggers next" framing).
- `nix/packages/dispatch.nix:4-5` — the header comment still says `` `dispatch
  <N>` -> dispatch-tick <N> (explicit target, skips the concurrency gate) ``,
  describing the deleted issue-number behavior. Update it to describe the
  node-id behavior this unit adds (the wrapper's `exec "$TICK" "$@"` at line 35
  already forwards any arg unchanged — no wrapper code change needed, only the
  comment).
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`: read
  the existing positional-arg-rejected cases at lines 21816-21828 (select-tick),
  22150-22155, 22976-22981, and 22742-22757 (dispatch-tick) **before editing** —
  confirm each asserts against a *numeric* or non-node-id-shaped arg (which
  must keep failing) rather than a generic string (which might now need to
  become a success case). Add new cases: a node-id-shaped arg on a real fixture
  node succeeds and reaches `dispatch-graph-execute` with the right
  `<id>:<kind>:<phase>` spec; `--manual` combined with a node-id arg is a usage
  error; an unknown/unselectable node id yields `node-not-selectable` and a
  non-zero `dispatch-tick` exit without invoking `dispatch-select-tick`'s aux
  triggers.

**Recommended model:** sonnet — mirrors the existing `--manual` threading
pattern through the same two scripts; every decision (regex reuse, decision-line
shape, non-fallthrough behavior) is already fully specified above, none left
to implementation-time judgment.

**Dependencies:** Unit 1 (`graph-select-target --node <id>` must exist first).

**Reuse.**
- `provision-node-worktree`'s node-id slug regex
  (`.claude/skills/dispatch-propagate/scripts/provision-node-worktree:44`) —
  reuse verbatim for arg discrimination; do not invent a second regex.
- `emit_graph_selection` (`dispatch-select-tick:192-215`) — reused unchanged;
  no new decision-line format for the success path.
- `dispatch-tick`'s existing `graph)` decision-routing arm
  (`dispatch-tick:438-467`) and its call into `dispatch-graph-execute`
  (`dispatch-tick:451`, passing the spec args positionally) — reused as-is;
  `dispatch-graph-execute` already iterates one spec at a time
  (`dispatch-graph-execute:110`), so a single-spec `graph 1 <spec>` line needs
  no format translation.
- The existing `BRANCH == "main"` origin/main sync in `dispatch-select-tick`
  (lines 259-334) — reused for free by routing through this pipeline instead
  of calling `dispatch-graph-execute` directly; no new sync code in this unit.

Out of scope: changing the pace curve or `dispatch.config/target-workers.json`
(explicit dispatch *overrides* the curve at the gate; it never edits it); the
`pace_exempt` standing-flag mechanism (a distinct, autonomous per-node
exemption); a `--force` escape hatch to preempt a live claim (rejected
2026-07-11 — races two workers into a `graph-commit` conflict-park); an
explicit `dispatch <node-id>:<phase>` phase override (the node's persisted
phase is always the target; defer a phase override to a future tactic if the
author wants one); differentiating the specific reason an unselectable node id
was excluded (Unit 1's scope note); `tactic-manual-dispatch-single-node-headroom`'s
bare-`--manual`-at-ceiling headroom guarantee (a sibling, ranking-driven
concern per that node's own body — keep the two consistent if both land, but
this tactic does not implement it).

## Verification

```verify
cd /home/n8/natb1/commons.systems && .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```
Manually: pick a real open node id (e.g. a tactic currently at `phase:
implement` with no live claim). Run `dispatch <that-node-id>` with the pace
curve pinned to zero (`dispatch.config/target-workers.json`) and confirm it
still spawns — proving the pace gate is skipped. Run it again immediately
while the first worker is still live and confirm it refuses cleanly
(`node-not-selectable`, reservation or live-session reason) rather than
double-spawning. Run `dispatch <unknown-node-id>` and confirm a clear
`node-not-selectable` failure, not a silent fall-through to a JIT reminder or
main-broken job. For the stale-tree fix: advance a real node's phase
out-of-band on `origin/main` (e.g. via `write-node.ts` + `graph-commit` from a
second worktree) while the main checkout is still on the prior commit, then
run `dispatch <that-node-id>` from the main checkout — confirm the tick's own
`origin/main` sync catches the checkout up before `provision-node-worktree`
runs, so the worker provisions at the *new* phase instead of aborting exit-12
stale-selection.
