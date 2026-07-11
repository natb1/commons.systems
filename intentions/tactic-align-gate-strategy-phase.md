---
id: tactic-align-gate-strategy-phase
kind: tactic
statement: Worker-start-revalidation gate accepts a strategy's native phase:null
  when selected at align-tactics — the literal phase-equality check in
  check-node-selection.ts exit-12s every strategy, blocking the entire align
  lane
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "Regression shipped by tactic-worker-start-revalidation (PR 2792):
  check-node-selection.ts check #2 does a literal `readPhase(node) !==
  selectedPhase` test. A strategy carries phase:null natively; the selector's
  derived phase for an align-eligible strategy is the never-stored string
  align-tactics, so the gate computes null !== align-tactics and exits 12 for
  EVERY strategy regardless of status. No strategy can be provisioned for
  decomposition — the align lane produces zero tactics every tick and the graph
  cannot grow new work autonomously. On the signal path for
  strategy-graph-native-dispatch: autonomous align decomposition is a
  precondition of a self-scheduling fleet."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 1
  override: null
  rationale: Unblocks the entire align lane; every strategy align selection
    exit-12s until this gate fix merges, so no new tactic work is decomposed
    autonomously meanwhile.
phase: qa
execution:
  branch: tactic-align-gate-strategy-phase
  pr: 2847
  attempts: {}
  markers: []
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Worker-start-revalidation gate accepts a strategy's native phase:null when selected at align-tactics

**Recorded 2026-07-11** by the tick +5 router emulation after the human observed
the align lane repeating tick-to-tick with no progress. One PR.

## Context

`check-node-selection.ts` (the worker-start re-validation gate shipped by
`tactic-worker-start-revalidation` / PR 2792) is called by
`provision-node-worktree <id> <selected-phase>` before any worktree work, to
yield a worker whose selection went stale between tick-start selection and
execution. Its check #2 is a literal equality test
(`packages/intentionsutil/scripts/check-node-selection.ts`, `evaluateSelection`,
the `phase` check):

```
const phase = readPhase(node);
if (phase !== selectedPhase) {
  return fail(EXIT_STALE_SELECTION, "phase", `selected ${selectedPhase} but node is now ${phase ?? "draft/null"}`);
}
```

A strategy node carries `phase: null` **natively** (`strategy` nodes have no
persisted phase; `align-tactics` is the selector's *derived* rung for an
align-arm-eligible strategy — `packages/intentionsutil/src/router.ts`
`selectGraphTargets`, the strategy-candidate block ~lines 275+ sets
`phase: "align-tactics"` on the emitted candidate, never on the stored node).
So the gate computes `null !== "align-tactics"` and returns exit 12 for **every**
strategy, independent of `status` (verified tick +5: `strategy-autonomous-execution`
at `status: codified, phase: null` exit-12s identically to a `refining` one).

Consequence: no strategy can ever be provisioned for `/align-tactics`
decomposition. The align lane produces zero tactics every tick and re-skips all
selected strategies in milliseconds. The graph cannot grow new tactic work
autonomously — a precondition of the self-scheduling fleet
`strategy-graph-native-dispatch` targets.

This was previously misdiagnosed (tick +3 instruction note) as "the gate checks
`status` and refining strategies aren't decomposition-ready, so the skips are
self-correcting." That is false: the gate never reads `status`, and codified
strategies fail identically. The fix is in the gate, not the selector — the
selector correctly emits align-eligible strategies.

## Unit 1 — extract the strategy-align-selectability predicate into a shared export

**Recommended model:** opus

Scope — `packages/intentionsutil/src/router.ts`. The definition of "would the
selector emit this strategy as an `align-tactics` candidate right now" currently
lives inline in `selectGraphTargets` (the strategy-candidate loop: the frozen
subtree re-evaluation exception; then, for an unfrozen strategy, no non-draft
child tactic on the signal path, `isSignalUnvalidated`, the fresh-reading gate,
and `rounds.count < 2`). Extract it into an exported pure helper —
`strategyAlignSelectable(strategy, nodes)` (or reuse `selectGraphTargets`
membership directly; see Implementation notes) — that returns `true` iff the
selector would emit `strategy` as a strategy candidate (frozen re-evaluation
**or** fresh align-arm eligible), and refactor `selectGraphTargets` to call it so
there is a single source of truth (single-callsite doctrine, per
`tactic-fingerprint-recipe-single-callsite`). Behavior-preserving: existing
selector tests must stay green unchanged. Export the helper and any types the
gate needs.

## Unit 2 — make the gate strategy-aware for align-tactics, with tests

**Recommended model:** opus

Depends on: Unit 1.

Scope — `packages/intentionsutil/scripts/check-node-selection.ts`
`evaluateSelection`. Replace the literal `phase` check with a phase-aware branch:

- When `selectedPhase === "align-tactics"`: pass iff `node.kind === "strategy"`
  **and** `readPhase(node) === null` (native strategy phase, not advanced or
  squatted) **and** `strategyAlignSelectable(node, listNodes(dir))` from Unit 1.
  Otherwise `fail(12, "phase", …)` with a message distinguishing the sub-cause
  (not a strategy / phase advanced / no longer align-eligible or soft-frozen
  out). The existing check #3 (`not-parked`) and check #4 (fingerprint) still
  apply and need no change — an align-eligible strategy has `office_hours: null`
  and typically no `execution.strategy_fingerprint`.
- All other `selectedPhase` values: keep the existing literal
  `readPhase(node) !== selectedPhase` equality (tactic phases are first-class and
  stored, so equality is correct there).

Tests — `packages/intentionsutil/test/` (extend the existing
`check-node-selection` suite): (a) a `status: codified`, `phase: null` strategy
that the selector would emit passes (exit 0); (b) the same strategy after an
author park (`office_hours` set) → exit 12; (c) a strategy whose signal became
validated / `rounds.count` hit 2 / gained a non-draft on-path child → exit 12
(no longer selectable); (d) a strategy re-selected at align-tactics whose stored
phase was somehow advanced to a non-null value → exit 12; (e) a **tactic** id
passed with `selectedPhase = "align-tactics"` → exit 12 (not a strategy); (f) a
normal tactic phase (`implement`/`qa`) still round-trips unchanged. Add a
selector-side test asserting Unit 1's extraction is behavior-preserving (the
helper agrees with `selectGraphTargets` membership across the fixture graph).

## Dependencies

None external. `provision-node-worktree` already passes `align-tactics` as the
selected phase, so no change is needed there once the gate accepts it.

## Reuse

- `packages/intentionsutil/src/router.ts` — the strategy-arm eligibility logic
  to extract (do not reimplement it in the gate).
- `packages/intentionsutil/scripts/check-node-selection.ts` `readPhase`,
  `readParked`, `listNodes` — already imported; the fingerprint check already
  builds the full node set, so `listNodes(dir)` for the predicate is a cheap
  reuse of an existing read.

## Verification

```verify
npx vitest run --project intentionsutil --root .
```

Manual: on a checkout at fresh origin/main,
`node --import tsx/esm packages/intentionsutil/scripts/check-node-selection.ts
strategy-autonomous-execution align-tactics --dir intentions` exits 0 (was 12);
`provision-node-worktree strategy-autonomous-execution align-tactics` proceeds to
provision a worktree instead of exit-12; a subsequent router tick lands at least
one real align decomposition instead of an all-skip batch.

## Implementation notes

One subagent per unit, `model` per tag; constrain to working-tree edits and open
a draft PR. An even-simpler-greenfield alternative to a bespoke predicate is to
have the gate call `selectGraphTargets(listNodes(dir))` and assert the node
appears as a candidate at `selectedPhase` — this makes "valid selection"
definitionally identical to the selector for every phase, not just align; weigh
its cost (a full selector pass per gate call) against the targeted predicate in
Unit 1 and pick the one the maintainers prefer, but keep a single source of
truth either way. Do not weaken any existing test to accommodate the change
(test-integrity).
