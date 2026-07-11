---
id: tactic-graph-census-recurrence
kind: tactic
statement: wire the graph-native same-tick merged reconciler into the tick, then
  add a re-armable recurring census (owed-prune drain, PR-merge verification,
  orphan absorption)
owner: ai
status: codified
parent: null
rationale: "Surfaced by the tick +3 emulated router tick (2026-07-10):
  tactic-graph-self-consistency-sweep is a one-shot node now done, and
  owed-prune debt was observed growing with no open census node to drain it.
  Re-scoped 2026-07-11 by the reconciler-wiring finding (diagnosing the stale
  re-selection of tactic-align-interview-type-doctrine at phase:review despite
  merged PR #2849): the graph-native same-tick merged reconciler
  reconcile-graph-merged — delivered by tactic-graph-router-transitions Unit 2
  (PR #2813) — has zero call-sites; the tick's Step 1d runs only the issue-lane
  dispatch-reconcile-merged, so no merged graph-native node is ever absorbed to
  done and the reconciler sweep the router doctrine presumes never runs. This
  tactic now first wires that same-tick reconciler (Unit 1) and then adds the
  re-armable recurring census the original scope demanded (Unit 2). Recurrence
  state lives in the graph, never in dispatch.config (parity with the
  fuse-breaker doctrine)."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: "Recurrence mechanism: a self-re-arming census node on a fixed
      cadence, or a standing per-tick reconciliation duty with a debt threshold
      that births a census node?"
    answer: "A standing per-tick reconciliation duty plus a debt-threshold trigger
      that births a born-parked census tactic when accumulated owed-prune /
      orphan / merge-verification debt crosses the threshold. Greenfield
      rationale: once Unit 1 wires the same-tick reconciler the per-tick duty is
      near-free, so a zero-debt tick stays cheap, and genuine debt surfaces as a
      graph artifact for review — parity with the fuse-breaker doctrine
      (review-demanding events are graph artifacts; dispatch.config carries only
      the threshold tunable). The self-re-arming-node-on-cadence alternative is
      rejected: it runs the census even with zero debt and bakes cadence into
      node state. Recorded 2026-07-11 fold-in of the reconciler-wiring finding."
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-graph-census-recurrence
  pr: 2866
  attempts: {}
  markers:
    - qa-done
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours:
  reason: "review phase not executable in graph-tick worker: /review-fix ran its
    node-lane preamble cleanly (PR #2866, CI green, surface=code, no
    CodeQL/npm/erosion findings) but its sanctioned review fan-out (finders ->
    dedup -> classify -> adversarial-verify -> Opus fix) requires the Workflow
    tool, which is not present in this graph-tick agent worker's toolset (no
    Workflow primitive, no subagent launcher), and the phase must not be
    emulated ad hoc. The skill DOES accept node targets, so this is not
    skill-node-target-unsupported. Next steps: run /review-fix for PR #2866 from
    a full interactive/dispatch session where the Workflow tool is available (it
    resumes from durable state -- worktree and PR are intact, dispatch:reviewed
    not yet applied), OR wire the Workflow primitive into graph-tick agent
    workers so the graph-native review phase is executable in-tick. The diff is
    low-risk config plumbing plus a network-free TS debt computer with tests; CI
    is already passing."
  since: 2026-07-11
  recommendation: null
pace_exempt: false
rounds: null
attributes: {}
---
# wire the graph-native same-tick merged reconciler into the tick, then add a re-armable recurring census

## Context

Two defects, one root cause — the graph lane's absorption of merged PRs into
graph state is unbuilt end-to-end, and there is no recurrence to catch what
same-tick absorption misses.

1. **Same-tick absorption is unwired (Unit 1).** The graph-native reconciler
   `reconcile-graph-merged`
   (`.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged`) — which
   reads every open graph-native tactic carrying an `execution.pr`, and via
   `packages/intentionsutil/scripts/reconcile-graph.ts` moves a merged-without-
   residue node to `done` (pruning it and repairing inbound `blocked_by` in one
   `graph-commit`) — was delivered by `tactic-graph-router-transitions` Unit 2
   (PR #2813) but has **zero call-sites**. The tick's post-merge reconciliation
   (`dispatch-select-tick:447`, Step 1d) invokes only the **issue-lane**
   `dispatch-reconcile-merged`, which repairs GitHub `Closes #N` auto-close
   misses and never reads graph nodes. Consequence: a graph-native node left at
   `phase: review` under a merge-ready-hold whose PR is then merged out of band
   is **never** moved to `done`; the selector (`graph-select-target`) re-selects
   it every tick as a stale `review` target. Observed live:
   `tactic-align-interview-type-doctrine` re-selected at `phase: review` with
   `reviewed` marker and **merged** PR #2849 (merge `284741a`).

2. **No recurrence drains what same-tick misses (Unit 2).** Even once Unit 1
   lands, same-tick absorption misses cases: PRs merged during a tick that does
   not run the sweep, closed-not-merged nodes past a stale grace window, and
   owed-prune debt from conflict-park recovery and doctrine-home drift. The
   one-shot census `tactic-graph-self-consistency-sweep` (now `phase: done`)
   drained a static 2026-07-09 batch; tick +3 (2026-07-10) then observed
   owed-prune debt re-accumulating with **no open census node to drain it**.

Out of scope: changing `reconcile-graph.ts`'s per-node decision logic (already
correct — merged→done+prune, closed-not-merged→done, needs-main residue→deferred);
the issue-lane `dispatch-reconcile-merged`; the loop-containment fuse
(`tactic-router-failure-fuses`, which parks a no-progress node after a counter
cap — complementary, not this tactic's job).

## Unit 1 — Wire the same-tick graph merged reconciler into the tick

**Recommended model:** sonnet

Scope:
- `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick` — in the
  Step 1d post-merge reconciliation block (the `RECONCILE_MERGED_OUT=$(...
  dispatch-reconcile-merged)` call at line ~447), add a sibling invocation of
  `reconcile-graph-merged` immediately after, using the existing
  `dispatch-reconcile-merged` block as the pattern: run it best-effort
  (`|| true`, non-fatal — a reconcile error must not abort the tick), and prefix
  each emitted line with `reconcile-graph: ` (mirroring the `reconcile-merged: `
  prefix). It runs unconditionally like its issue-lane sibling (it only absorbs
  already-merged work; safe during a `main-broken` episode). Per
  `.claude/rules/sandbox.md` and the script's own header, `reconcile-graph-merged`
  needs `gh` (TLS) plus `node --import tsx/esm` (npm cache), so its call-site
  must run with the sandbox disabled — match how `dispatch-select-tick` already
  wraps its `gh`-touching sub-steps (the tick is launched by
  `dispatch-spawn-tick`; confirm the disable propagates or wrap the call
  explicitly).
- `.claude/skills/dispatch-propagate/scripts/graph-select-target` — defense in
  depth in `sensor_gate` (lines ~190-220): in the `fix|qa|review` arm (~195-206)
  add a pre-check that a node whose PR `state == MERGED` is **not** selected for
  `review` (return non-zero with reason `pr-merged-awaiting-reconcile`), so a
  merge that lands between reconcile and selection within the same tick does not
  re-select as stale. Reuse the REST `state` read already present in the
  `main-qa` arm (`gh_pr_view_rest "$pr" | jq -r .state`, line ~211).

Reuse:
- `reconcile-graph-merged` and its helper `reconcile-graph.ts` — invoke as-is,
  no edits.
- The `dispatch-reconcile-merged` invocation at `dispatch-select-tick:441-449`
  as the copy-paste pattern (block shape, `|| true`, per-line prefix loop,
  `refresh_lock` after).
- `gh_pr_view_rest` in `lib.sh` (already used by `graph-select-target`'s
  `main-qa` arm) for the selector MERGED pre-check.

Dependencies: none — `reconcile-graph-merged` is already on `origin/main`.

Verification:
```verify
cd /home/n8/natb1/commons.systems && .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```
Then, manually (needs `gh` + tsx; run with the sandbox disabled): in a
main-based checkout run `reconcile-graph-merged` with `GRAPH_RECONCILE_NOW` set
past the grace window against a merged-but-unabsorbed node (the
`tactic-align-interview-type-doctrine` / PR #2849 case if still un-reconciled,
else any merged review-phase node) and confirm it prints
`reconciled <id> -> done` and lands one `graph-commit` moving the node to `done`
and pruning it. Then run `dispatch-select-tick` (dry, no claim) and confirm it
emits `reconcile-graph:` lines and no longer re-selects the absorbed node.

## Unit 2 — Re-armable recurring census (standing duty + debt-threshold-births-node)

**Recommended model:** opus

Greenfield design (resolves the clarification on this node): a **standing
per-tick reconciliation duty** computes the owed reconciliation debt cheaply
each tick — owed prunes (done-but-present nodes), unverified PR-merges
(nodes carrying `execution.pr` whose PR is merged but node not yet absorbed),
and orphans (nodes whose serving strategy or parent was pruned) — and when the
**accumulated debt crosses a threshold**, births exactly one born-parked census
tactic (`office_hours` set at creation, `write-node.ts --file` recipe, same
`graph-commit`) that carries the batch to drain. Zero-debt ticks birth nothing.
The threshold is the only `dispatch.config` tunable; the debt and the census
node itself are graph state (parity with the fuse-breaker doctrine — see
`tactic-router-failure-fuses` — that review-demanding events are graph
artifacts, not config). Rejected alternative: a census node that re-arms itself
on a fixed cadence (runs even at zero debt; bakes cadence into node state).

Scope:
- A debt-computation step wired into the tick's reconciliation block (beside
  Unit 1's call), reusing `reconcile-graph-merged`'s node-enumeration query
  (the `listNodes` pass over open tactics) plus a done-but-present scan.
- A census-birth step: when debt ≥ threshold and no open census node already
  exists, write one born-parked census tactic naming the specific batch in its
  `statement`/body (so the coverage/census machinery can match it), landed in
  the same `graph-commit`.
- The threshold tunable in `dispatch.config` (a single integer; no recurrence
  *state* in config).
- Idempotency: never birth a second census node while one is open (probe the
  graph first) — the born-parked node IS the recurrence latch.

Reuse:
- `reconcile-graph-merged` enumeration + `reconcile-graph.ts` decision logic
  for the merge-verification and prune-owed computations.
- `tactic-graph-self-consistency-sweep` (done) as the reference shape for the
  census node's Unit structure (prune-with-edge-repair, doctrine-home
  reconciliation).
- The born-parked write recipe (`write-node.ts --file` with
  `office_hours: {reason, since}`) from `align-strategy`/`align-tactics` Step 4.
- `graph-commit --base` for the atomic land.

Dependencies: **Unit 1** (the standing duty layers on the same-tick reconciler;
without it the per-tick absorption it presumes does not run).

Verification: prose — dispatch machinery with no end-to-end test surface.
Simulate accumulated debt (several merged-but-unabsorbed and done-but-present
nodes in a scratch `intentions/` snapshot), run the census step, and confirm it
births exactly one born-parked census tactic naming the batch; confirm a
zero-debt snapshot births nothing; confirm a second run with a census node
already open births no duplicate. Extend `test-dispatch-scripts.sh` with the
debt-threshold and idempotency cases.
