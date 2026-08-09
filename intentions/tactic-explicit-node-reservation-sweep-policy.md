---
id: tactic-explicit-node-reservation-sweep-policy
kind: tactic
statement: reconcile the reservation ledger (reservation_sweep) before
  consulting graph-select-target --node in dispatch-select-tick's explicit-node
  dispatch branch, so a stale dead-session marker never refuses an explicit
  human dispatch
owner: ai
status: codified
parent: null
rationale: "Surfaced by /review-fix on PR #2921
  (tactic-graph-explicit-node-dispatch), disposed deferred (out of scope for
  that PR). Finalized 2026-07-22 by /align-tactics: decided option (1) of the
  original recommended scope (run reservation_sweep in the explicit-node branch)
  over option (2) (merely document non-reclaim). Grounding:
  tactic-graph-explicit-node-dispatch's own recorded author principle --
  explicit human dispatch overrides the autonomous pace curve -- extends
  naturally to reservation staleness; a stale dead-session marker silently
  defeats that principle by refusing the human's named target with
  node-not-selectable. The apparent tension the finding raised (diverging from
  --manual, which also skips the sweep) is not a real conflict: --manual's
  non-sweep only affects fan-out-width/pacing math (an optimization), never a
  hard refused outcome the way the NODE_ARG path's reserved check does, so the
  two paths solve different problems and need not move in lockstep. blocked_by
  tactic-graph-explicit-node-dispatch (PR #2921, still open, not yet on
  origin/main) -- the NODE_ARG branch this tactic edits does not exist until
  that PR merges."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: main-qa
execution:
  branch: tactic-explicit-node-reservation-sweep-policy
  pr: 2952
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-07-29T14:07:03Z
    mergeCommitSha: 30b51ea46cc279564a672bc0c96e01b39057d8ca
    graphCommitSha: null
validates: []
blocked_by: []
office_hours:
  reason: needs-main residue item 5 asks a human to ratify a design/policy
    judgment already made by /align-tactics -- whether reclaiming a stranded
    reservation-ledger marker via reservation_sweep in the explicit-node
    dispatch branch (option 1, implemented in Unit 1) is the correct disposition
    versus merely documenting the gap (option 2), and whether best-effort ||
    true non-fatal sweep semantics are acceptable. QA's own triage subagent
    flagged this as a subjective policy call, not a machine-assertable fact --
    no git, journal, log, shell, or filesystem check can decide it.
  since: 2026-08-04
  recommendation: "Confirm the policy: running reservation_sweep before
    graph-select-target --node in the explicit-node branch (mirroring the
    autonomous block's existing sweep call, so a stale dead-session marker never
    refuses an explicit human dispatch), with a sweep failure never blocking the
    explicit dispatch (best-effort || true). This node has no MACHINE-verifiable
    needs-main items -- Unit 1 (the sweep wiring) and Unit 2 (its test coverage)
    already landed via the merged source PR (execution.pr 2952); this is the
    sole remaining residue item and it is a pure author ratification, not a
    regression check."
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# reconcile the reservation ledger before explicit-node dispatch selection

## Context

Surfaced by `/review-fix` on PR #2921 (`tactic-graph-explicit-node-dispatch`),
a code-review finder disposed `deferred` (out of scope for that PR, never
independently adversarially verified — see "Original finding", below, for the
full original text).

**Decision (this `/align-tactics` pass, 2026-07-22):** implement the fix —
run `reservation_sweep` in the explicit-node branch before consulting
`graph-select-target --node` — rather than merely documenting the gap as
intentional. Grounding: `tactic-graph-explicit-node-dispatch`'s own recorded
author principle, "explicit human dispatch overrides the autonomous pace
curve," extends naturally to reservation staleness — a stale dead-session
marker silently defeats that principle by refusing the human's named target
with `node-not-selectable`, exactly the outcome the whole feature exists to
prevent. The original finding's own hesitation (diverging from `--manual`,
which also skips the sweep) is not a real conflict: `--manual` has no
`node-not-selectable`-style hard refusal at all — its own non-sweep only
widens or narrows `GAP` (fan-out width), a soft pacing computation, never a
named-target refusal. The two branches solve different problems (throughput
pacing vs. a single explicit claim check) and do not need to move in
lockstep, so no author ratification is needed to proceed.

**Prerequisite:** PR #2921 (`tactic-graph-explicit-node-dispatch`) is still
open (not yet on `origin/main`) as of this planning pass — the NODE_ARG
branch this plan edits does not exist on `main` yet. This tactic is
`blocked_by: [tactic-graph-explicit-node-dispatch]`; the router will not
select it until that tactic reaches `phase: done`. The path:line anchors
below are taken from the `tactic-graph-explicit-node-dispatch` branch
(PR #2921) as of this planning pass — re-locate by the quoted comment text
if lines have shifted by the time this tactic is implemented, rather than
trusting the line numbers verbatim.

## Units of work

### Unit 1 — sweep the reservation ledger in the NODE_ARG branch

**Scope:** `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick`,
the `elif [[ -n "$NODE_ARG" ]]; then` branch (PR #2921 branch: lines 746–762,
identified by the comment `# Explicit single-node dispatch
(tactic-graph-explicit-node-dispatch): skip`). Today that branch only runs
the `dispatch-target-workers --exhausted` check and, on the non-exhausted
fallthrough, falls through to Step 3 with `GAP` left at its default of 1
(`dispatch-select-tick:762`, comment `# Not exhausted: GAP stays 1 (its
default above) — falls through to Step 3.`).

Add, immediately after that fallthrough comment (i.e. still inside the
`elif [[ -n "$NODE_ARG" ]]` branch, after the `EXHAUSTED` early-exit):

```bash
# Reconcile the reservation ledger before Step 3 consults graph-select-target
# --node (tactic-explicit-node-reservation-sweep-policy): an explicit human
# dispatch of a named node should see accurate claim state, not a stale
# marker left by a dead session. Mirrors the autonomous block's own
# best-effort sweep call above (source + call, never fails the tick).
# shellcheck source=/dev/null
source "$SCRIPT_DIR/lib-claude-agents.sh"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/lib-reservation-ledger.sh"
reservation_sweep 1>&2 || true
```

This exactly mirrors the sourcing + call pattern already used in the sibling
`if [[ -z "$MANUAL" && -z "$NODE_ARG" ]]` autonomous block a few lines above
(`source "$SCRIPT_DIR/lib-claude-agents.sh"`, `source
"$SCRIPT_DIR/lib-reservation-ledger.sh"`, `reservation_sweep 1>&2 || true`) —
no new sweep logic, just wiring the existing best-effort call into the
second branch that currently skips it. Placing it after the `EXHAUSTED`
early-exit (rather than before) avoids sweeping — and its one
`claude_agents_list_all` daemon round-trip — on a tick that is about to bail
out on genuine rate-limit exhaustion without reaching selection at all.

**Out of scope:** the `--manual` branch. Its non-sweep behavior addresses a
different problem (fan-out-width/pacing math, not a hard refusal) per the
Context section's reasoning above — do not add a symmetric sweep there as
part of this tactic.

**Recommended model:** sonnet (small, mechanical, well-scoped shell edit that
mirrors an existing sibling pattern verbatim — no architectural judgment
required).

**Dependencies:** none within this tactic; the tactic itself is
`blocked_by: [tactic-graph-explicit-node-dispatch]` (PR #2921 must merge
first, since this file's NODE_ARG branch does not exist before then).

### Unit 2 — test coverage

**Scope:**
`.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`, the
explicit-node-id test group inside the `sel_tick_setup`/`run_sel_tick`
harness (PR #2921 branch: around line 22364, the "explicit node-id,
selectable → graph decision, pace/cap gate bypassed" test, and the
neighboring "explicit node-id, not selectable" test at line ~22332). Add one
new test in this group:

- **Setup:** call `sel_tick_setup` as the existing tests do. Directly
  `source` `lib-reservation-ledger.sh` (or invoke `reservation_write` the
  same way `test-dispatch-scripts.sh`'s own `rl_setup`-group tests do around
  line 9974 — `reservation_write "<node-id>" "<issue>" "dead-sess"`) to plant
  a marker for the target node id under `DISPATCH_RESERVATION_DIR`, using a
  session id (`dead-sess`) that is absent from `sel_tick_setup`'s fake
  `claude_agents_list_all` (i.e. do not add it to `SEL_AGENTS_TSV`). Override
  `DISPATCH_RESERVATION_NOW` to a timestamp safely past the default 30s boot
  grace relative to real wall-clock time (e.g. an old fixed date, matching
  the `rl_setup` group's own `DISPATCH_RESERVATION_NOW="2026-01-01T00:00:00Z"`
  convention) so the marker is unambiguously stale when the real sweep runs
  at real current time.
- **Drive:** set `SEL_GRAPH_TARGET="node <node-id> tactic implement"` (so
  selection succeeds once the ledger is clear) and run
  `run_sel_tick <node-id>`.
- **Assert:**
  1. the tick's decision line is the normal `graph 1 <node-id>:tactic:implement`
     selection line, NOT `node-not-selectable <node-id>` — proving the sweep
     ran and cleared the stale marker before `graph-select-target --node`'s
     own `reservation_exists` check;
  2. the reservation marker is gone afterward (e.g. `reservation_exists
     "<node-id>"` returns false, or the marker file under
     `$DISPATCH_RESERVATION_DIR` no longer exists) — proving the reclaim
     itself happened, not just that selection incidentally succeeded some
     other way.

**Reuse:**
- `reservation_write` / `reservation_exists` / `reservation_sweep` —
  `lib-reservation-ledger.sh` (already present in `sel_tick_setup`'s staged
  copy, per its own comment: "the autonomous (no-arg) path sources the REAL
  lib-reservation-ledger.sh via its SCRIPT_DIR").
- `sel_tick_setup`'s existing `DISPATCH_RESERVATION_DIR` +
  fake-`claude_agents_list_all` wiring (`lib-claude-agents.sh` FAKE heredoc in
  `sel_tick_setup`) — no new test scaffolding needed, only a new test case in
  the existing group.
- The `rl_setup` group's own dead-session-sweep test
  (`test-dispatch-scripts.sh`, "Test: reservation_sweep reclaims a marker
  whose reserving session is dead and never converted", ~line 9974) as the
  reference pattern for planting a reclaimable stale marker.

**Recommended model:** sonnet (mechanical test addition following two
existing, directly analogous patterns in the same file).

**Dependencies:** Unit 1 (the test exercises the code Unit 1 adds).

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

No manual verification needed beyond the test suite: this is an internal
router-mechanics fix with no user-facing production surface (per the
original finding's own scope note — "low priority; no user-facing production
surface").

## Original finding (for provenance)

**Location:** `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick:746`

**Finding:** The explicit-node branch in `dispatch-select-tick` skips the
autonomous block that runs `reservation_sweep` before selection;
`graph-select-target --node` checks `reservation_exists` but never sweeps. So
a stale ledger marker left by a dead session for the targeted node makes
`graph-select-target --node` emit `reserved` and the tick report
`node-not-selectable`, whereas the autonomous `--top` path would have
reclaimed the stale reservation via the sweep first. A human's explicit
dispatch of a node can therefore be refused by a stale claim.

**Failure scenario:** A dead session leaves a stale reservation-ledger entry
for node X. A human or the router later runs `dispatch X` to dispatch it
explicitly; `graph-select-target --node X` reports `reserved` (the sweep
never ran), and the tick reports `node-not-selectable` even though the prior
claimant is dead and the node should be immediately reclaimable.

**Adversarial verdict:** Not independently adversarially verified — this is a
code-review residue finding (already confirmed by code-review's own internal
review pass), disposed `deferred` (out of scope for PR #2921) rather than
routed through the shared verify pipeline. Current behavior fails closed with
a clear signal (a specific `reserved` stderr message plus
`node-not-selectable`), not silent wrong behavior — this mirrors the existing
`--manual` branch, which also skips the sweep, so the current behavior may be
intentional (superseded by this tactic's decision above: implement the fix).

**Recommended scope (original, superseded by the Decision above):** Decide
between (1) running `reservation_sweep` in the explicit-node branch before
consulting `graph-select-target --node`, noting this would diverge from
`--manual`'s current behavior — confirm that divergence is wanted — or (2)
documenting explicitly that explicit-node dispatch intentionally does not
reclaim stale reservations. Scope: `dispatch-select-tick`; low priority; no
user-facing production surface.

## needs-main residue

### 5. Design judgment — running the sweep (option 1) is the right disposition vs. documenting the gap

- URL path: current
- Expected outcome: Human confirms that reclaiming the stranded marker (so
  explicit dispatch proceeds) is the desired policy and that best-effort
  `|| true` non-fatal semantics are acceptable — a sweep failure should never
  block the explicit dispatch.
- Finding: This is a policy call already made by `/align-tactics` (see the
  Context/Decision above: option 1 — run `reservation_sweep` — was chosen
  over option 2 — merely documenting the gap — because a stale dead-session
  marker silently defeats the whole point of explicit human dispatch
  overriding the autonomous pace curve). QA's triage subagent flagged this
  for office-hours ratification as a subjective policy call rather than a
  machine-assertable fact (`Flag: planned-deferral`); the qa-fix disposition
  workflow classified it `needs-main` per the planned-deferral rule
  (issue #1891) — verified downstream, not at this PR's merge.
