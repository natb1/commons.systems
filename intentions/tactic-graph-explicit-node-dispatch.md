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
  by this design routing through dispatch-tick -> dispatch-select-tick ->
  dispatch-graph-execute instead of calling dispatch-graph-execute directly --
  the existing BRANCH==main sync in dispatch-select-tick then runs before target
  selection whenever the tick runs from the main checkout, with no new sync code
  needed; the non-main-worktree invocation case remains a known pre-existing
  limitation, unchanged by this tactic (see Unit 2's Out-of-scope note in the
  body). Validated 2026-07-18 by an independent opus subagent review of the
  landed plan against live file content: the review confirmed all path:line
  citations except one off-by-8 line number (provision-node-worktree's node-id
  regex is at line 52, not 44 -- corrected), confirmed the test-anchor citations
  and non-fallthrough decision-line design were accurate and implementable, but
  found a critical gap -- Unit 2 as originally landed never bypassed
  dispatch-select-tick's autonomous concurrency/pace gate (lines 558-645, which
  runs whenever MANUAL is empty, which includes the NODE_ARG case since the two
  are mutually exclusive) -- so the explicit node-id path would have been
  paced/capped exactly like the ranked path, defeating the tactic's entire
  purpose. This pass adds the missing Step-1b bypass to Unit 2's scope (skip the
  TARGET_N pace-curve and MAX_WORKERS ceiling for NODE_ARG, but still honor
  genuine dispatch-target-workers --exhausted, mirroring the --manual branch's
  own EXHAUSTED handling) and corrects the citation and the overstated 'sync is
  unconditional' claim."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-graph-explicit-node-dispatch
  pr: 2921
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix:
    since: 2026-07-21
    attempt: 1
    pushed_sha: null
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
resolves the stale-tree false-exit-12, since the existing `BRANCH == "main"`
sync already runs before target selection on that path whenever the tick runs
from the main checkout (the normal invocation — see the caveat in Unit 2's
Scope), with no new sync code needed.

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
- Track whether the target id appeared in `.candidates[]` at all with its own
  counter/flag (distinct from `SELECTED_COUNT`) — both the "present but
  gated" and "absent entirely" cases below leave `SELECTED_COUNT` at 0, so
  `SELECTED_COUNT` alone cannot distinguish them; only "did the `select(.id ==
  $id)` filter yield a row" can.
- If the id is present in `.candidates[]` and passes every gate: print
  `node <id> <kind> <phase>` (the existing protocol; `dispatch-select-tick`'s
  `emit_graph_selection` already consumes this unchanged) and exit 0.
- If the id is present but fails a gate (reserved, live-session, or a sensor
  gate like `no-pr`/`ci-pending`/`pr-not-merged`): `sensor_gate`/the claim
  checks already produce a `reason` string (today only fed into `skip_note`,
  which logs to the selection-log JSON, not stderr) — echo that same `reason`
  string directly to stderr yourself, then print `empty` on stdout, exit 0
  (same stdout contract the ranked path already uses for a fully-gated-out
  candidate).
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
- **Bypass the autonomous concurrency/pace gate for `NODE_ARG` (this is the
  actual pace-skip the tactic exists for — without this edit the feature does
  nothing beyond what the ranked path already does).**
  `dispatch-select-tick:558` opens `if [[ -z "$MANUAL" ]]; then` — the
  autonomous gate block that computes `TARGET_N`/`LIVE_COUNT` and, at cap,
  either finds a pace-exempt bypass or emits `concurrency-cap` and exits 0
  (lines 558-645) *before* Step 3 ever runs. Because `NODE_ARG` is mutually
  exclusive with `--manual`, `MANUAL` is empty on the explicit-node path too,
  so unless this block is also guarded, a `NODE_ARG` dispatch hits the exact
  same pace cap as the ranked autonomous path and never reaches Step 3 — the
  opposite of "skips the pace gate." Change the guard at line 558 to
  `if [[ -z "$MANUAL" && -z "$NODE_ARG" ]]; then`, so `NODE_ARG` skips this
  entire block (both the `TARGET_N` pace-curve throttle and the `MAX_WORKERS`
  ceiling check that lives inside it) and `GAP` stays at its default of `1`
  (set at line 557, above this block), falling straight through to Step 3.
  This mirrors the doctrine `tactic-manual-dispatch-single-node-headroom`'s
  own body describes for this tactic: an explicit single-node dispatch
  "launches its one named node without a ceiling check" — stronger than
  `--manual`'s bare fan-out, which still honors the ceiling (that sibling
  tactic brings `--manual` up to the same guarantee separately; not this
  tactic's scope). **Still honor genuine token exhaustion**, the one hard
  floor every other path in this file respects (the `--manual` branch's own
  `EXHAUSTED` check at lines 681-686 is the pattern): before falling through
  to Step 3, `NODE_ARG` must still query
  `dispatch-target-workers --exhausted` and, if `exhausted`, `release_lock`
  and emit `concurrency-cap` with a `node-explicit-rate-limit-exhausted`
  `DLOG_SKIP_REASON` exactly as the `--manual` branch does — a deliberate
  single-node dispatch does not override real token exhaustion, only the
  self-imposed pace curve and worker ceiling.
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
  (`.claude/skills/dispatch-propagate/scripts/provision-node-worktree:52`) —
  reuse verbatim for arg discrimination; do not invent a second regex.
- The `--manual` branch's `EXHAUSTED` check
  (`dispatch-select-tick:681-686`) — the pattern to mirror for `NODE_ARG`'s
  own hard-floor check above; do not invent new exhaustion-detection logic.
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
this tactic does not implement it); making the `origin/main` sync
worktree-independent. **Known limitation, not fixed by this tactic:** the
`BRANCH == "main"` sync (`dispatch-select-tick:259-334`) that closes the
stale-tree gap only runs when the invoking checkout's current branch is
literally `main` — `dispatch-tick` does not `cd` to the main worktree before
calling `dispatch-select-tick` on the terminal path. Running `dispatch
<node-id>` from a **non-main feature worktree** does not inherit the sync, so
the stale-tree false exit-12 this tactic otherwise closes can still occur in
that case. This is a pre-existing constraint of the whole tick pipeline (the
autonomous and `--manual` paths have the same limitation today), not something
this tactic introduces or is scoped to fix; fixing it would mean hardening
`check-node-selection.ts` to read `origin/main` directly instead of the
working tree (the design-point-5(b) shape the original draft flagged as the
greenfield-preferred fix) — a separate, larger-scoped tactic if the author
wants it. The normal invocation (`dispatch <node-id>` from the main checkout)
is unaffected.

## Verification

```verify
cd /home/n8/natb1/commons.systems && .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```
Manually, all from the **main checkout** (branch `main` — see Unit 2's "Known
limitation" note above): pick a real open node id (e.g. a tactic currently at
`phase: implement` with no live claim). Run `dispatch <that-node-id>` with the
pace curve pinned to zero (`dispatch.config/target-workers.json`) **and** live
worker count at or above `max_concurrent_workers` and confirm it still spawns
— proving both the `TARGET_N` pace-curve gate and the `MAX_WORKERS` ceiling
are skipped (this is the core check: without Unit 2's Step-1b bypass, this
case would incorrectly emit `concurrency-cap`). Separately, confirm the
genuine-exhaustion floor still holds: with `dispatch-target-workers
--exhausted` reporting `exhausted`, `dispatch <that-node-id>` must still emit
`concurrency-cap`, not spawn. Run `dispatch <that-node-id>` again immediately
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
