---
id: tactic-freeze-resurface-stale-children-only
kind: tactic
statement: "Narrow the soft-freeze blast radius to stale-stamped children only:
  the selector's phase suppression and align-tactics re-surface follow the
  per-child staleness verdict, leaving fresh-stamped and null-stamped siblings
  on their normal phase"
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-07-18 /align-strategy interview on the
  mis-dispatched /align-tactics re-evaluations (see the same-day
  selector-mis-dispatch clarification on strategy-graph-native-dispatch). The
  soft-freeze scan in selectGraphTargets adds every open child of a drifted
  strategy to frozenTacticIds — suppressing each child's normal phase and
  re-surfacing each as an align-tactics re-evaluation candidate — when only the
  stale-stamped children carry evidence of drift. With the materiality doctrine
  classifying children at edit time (tactic-materiality-scoped-freeze, PR
  #2892), the blanket sweep contradicts the classification the editing round
  just recorded, and it sweeps null-stamped children whose plans a sibling's
  staleness says nothing about: the 2026-07-18 mis-dispatch sent
  tactic-review-phase-trust-builtin-review (stamp null, plan untouched) to
  /align-tactics on a sibling's stale stamp. The author DIVERGED from the
  subtree-conservatism rival framing this round. Boosted to top ranking by
  author direction (2026-07-18). Finalized 2026-07-18 /align-tactics per-node
  round: narrows frozenTacticIds population in selectGraphTargets
  (packages/intentionsutil/src/router.ts) to the already-computed stale list
  instead of every child."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 62
  override: null
  rationale: "Boosted to top ranking by author direction (2026-07-18
    /align-strategy round, re-confirmed same day): one of the two fix carriers
    for the selector mis-dispatch — the read-time consumer half; its edit-time
    sibling is tactic-scope-inert-restamp-primitive. Sized against the composed
    selector rank (childless, empty blocked_by: rank = boost + 5.33). At boost
    61 (rank 66.33) it merely TIED an unrelated non-carrier
    (tactic-qa-fix-office-hours-reentry-guard, also 66.33), holding top only on
    the id tiebreak — fragile against any compounding that node might accrue.
    Bumped to 62 (rank 67.33) so both requirement carriers sit at joint top of
    the frontier, strictly above every non-carrier. The boost flows nowhere
    else (no blocked_by, no children)."
phase: review
execution:
  branch: tactic-freeze-resurface-stale-children-only
  pr: 2895
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Narrow the soft-freeze blast radius to stale-stamped children only: the selector's phase suppression and align-tactics re-surface follow the per-child staleness verdict, leaving fresh-stamped and null-stamped siblings on their normal phase

## Context

`selectGraphTargets` in `packages/intentionsutil/src/router.ts` runs a
soft-freeze scan per strategy (router.ts:268-286): for each strategy it
computes `stale` — the open children whose `execution.strategy_fingerprint`
entry for that strategy differs from the strategy's current
`strategyFingerprint()` (per `isStrategyStale`,
`packages/intentionsutil/src/transitions.ts:413`). If `stale` is non-empty,
the scan currently sweeps **every** child of the strategy — not just the
stale ones — into `frozenTacticIds`:

```ts
// router.ts:280
for (const t of children) frozenTacticIds.add(t.id);
```

Two downstream consumers read `frozenTacticIds`:
- The normal tactic-candidate loop (router.ts:294) skips any tactic in the
  set, suppressing its ordinary phase-skill candidate.
- The frozen-tactic-candidate loop (router.ts:330) re-emits any open tactic in
  the set as a `kind: "tactic", phase: "align-tactics", reevaluation: true`
  candidate, routing it to `/align-tactics`.

Because the set includes every sibling regardless of that sibling's own
stamp, one stale-stamped tactic drags its fresh-stamped and never-stamped
(`execution.strategy_fingerprint` null) siblings into a spurious re-plan.
This produced a real mis-dispatch on 2026-07-18: a staling edit (commit
e7d20df0, the provenance-lint round) stamped
`tactic-graph-selector-reviewed-exclusion` stale against
`strategy-graph-native-dispatch`; the selector's blanket sweep then also
queued `tactic-review-phase-trust-builtin-review` — a sibling whose own stamp
was null and whose plan the staling edit said nothing about — for
`/align-tactics` re-evaluation.

This also contradicts the materiality doctrine `tactic-materiality-scoped-
freeze` (PR #2892, already merged) just established: that change made the
*edit-time* stamping classify children by whether a strategy edit was
material to each one individually. Sweeping every sibling into re-plan at
*read* time throws that per-child classification away. This tactic narrows
the read-time consumption side only; it does not touch stamping, which PR
#2892 already made correct.

## Unit 1 — Narrow `frozenTacticIds` population to the stale children only

**Scope**: `packages/intentionsutil/src/router.ts:268-286` (the soft-freeze
scan inside `selectGraphTargets`).

Change the population line from sweeping every child to sweeping only the
already-computed `stale` list:

```ts
// before (line ~280)
for (const t of children) frozenTacticIds.add(t.id);

// after
for (const t of stale) frozenTacticIds.add(t.id);
```

That is the entire behavioral fix. Do **not** change either consumption site
(router.ts:294 and router.ts:330) — both read `frozenTacticIds` directly, so
narrowing the populated set automatically narrows both the phase-suppression
and the re-surface behavior to exactly the stale-stamped children. Do **not**
change `frozenTacticSelectable` or `resolveFrozenDescendant`
(router.ts:437-490) — both are pure membership checks against
`selectGraphTargets(nodes).candidates` (the single-callsite doctrine
documented in their own JSDoc), so they inherit the narrowed behavior for
free; leave them untouched and confirm their existing tests in
`packages/intentionsutil/test/router.test.ts` (search
`frozenTacticSelectable`/`resolveFrozenDescendant`) still pass unmodified.

Also update the `selectGraphTargets` JSDoc (router.ts:224-234), which
currently describes the freeze as "freezes the subtree" and says "each
subtree tactic re-surfaces as a ... candidate." Rewrite those two sentences
to describe the corrected, per-child scope: the freeze applies only to the
stale-stamped children (not the whole subtree), and only those stale children
re-surface as `align-tactics` re-evaluation candidates — a fresh-stamped or
null-stamped sibling under the same strategy keeps its ordinary phase-skill
candidate untouched.

**Recommended model**: sonnet — a one-line filter change plus a doc-comment
rewrite, no design decisions.

**Dependencies**: none (`tactic-materiality-scoped-freeze`, PR #2892, is
already merged on `origin/main`).

## Unit 2 — Update tests to the narrowed behavior and add a direct regression test

**Scope**: `packages/intentionsutil/test/router.test.ts`, the
`describe("soft-freeze gate", ...)` block (lines 327-541). Its
`frozenGraph(fingerprint)` helper (line 328) builds a strategy plus
`tactic-stale` (stamped with the passed-in `fingerprint`) and
`tactic-sibling` (phase `qa`, never stamped — `execution: null`). Under the
current (pre-fix) blanket sweep, `tactic-sibling` is wrongly swept into
`frozenTacticIds` whenever `tactic-stale` is actually stale, so several
existing tests assert the pre-fix behavior for `tactic-sibling` and must be
corrected:

- **"a stale fingerprint re-surfaces the frozen tactics at align-tactics"**
  (lines 342-365): after the fix, `tactic-sibling` is no longer frozen —
  change `expect(sibling).toMatchObject({ kind: "tactic", phase:
  "align-tactics", reevaluation: true })` to `expect(sibling).toMatchObject({
  kind: "tactic", phase: "qa", reevaluation: false })`. The candidate **id
  order does not change**: `progressionIndex` (router.ts:194) ranks by each
  node's real `phase` via `PHASES` (`packages/intentionsutil/src/schema.ts:41`
  — `draft=0, align-tactics=1, implement=2, fix=3, qa=4, review=5,
  main-qa=6, done=7`), and `tactic-sibling`'s real phase is `qa` (4) both
  before and after the fix, still ahead of `tactic-stale`'s real phase
  `implement` (2) and `strategy-s`'s `align-tactics` (1) — so
  `sel.candidates.map(c => c.id)` stays `["tactic-sibling", "tactic-stale",
  "strategy-s"]`. Update the comments explaining the order and the
  `toMatchObject` assertions to describe the corrected behavior instead of
  the blanket sweep.
- **"a frozen tactic's normal phase-skill candidate is suppressed (only
  align-tactics remains)"** (lines 367-378): change the `siblingCands[0]`
  assertion from `{ phase: "align-tactics" }` to `{ phase: "qa" }` — the
  sibling's normal candidate is no longer suppressed. Update the leading
  comment (it currently says "neither emits an executable phase-skill
  candidate" — that is now false for the sibling).
- **"parking the strategy drops its own candidate but not the frozen
  tactics' re-eval"** (lines 402-417): `tactic-sibling` was never frozen
  after the fix, so it keeps emitting its normal `qa` candidate regardless of
  the strategy's park (tactic candidacy never reads the serving strategy's
  `office_hours`). Replace the blanket `expect(sel.candidates.every((c) =>
  c.kind === "tactic" && c.phase === "align-tactics")).toBe(true)` with
  per-candidate checks: find `tactic-sibling` and assert `{ phase: "qa",
  reevaluation: false }`; find `tactic-stale` and assert `{ phase:
  "align-tactics", reevaluation: true }`. `sel.candidates.map(c => c.id)`
  stays `["tactic-sibling", "tactic-stale"]` (order unaffected, per the
  progression-index reasoning above).
- Leave every other test in the block unchanged — **"a matching fingerprint
  does not freeze"**, **"a null fingerprint is not stale"**, **"parking a
  frozen tactic drops its own re-eval candidate"**, **"a done child of a
  frozen subtree is NOT re-emitted..."**, and all four multi-serves tests
  (453-541) each involve at most one open, non-stale sibling or none at all
  (the multi-serves tests use a single tactic; the done-child test's second
  node is `done`, already excluded from re-emission by `isOpenTactic`
  independent of this fix) — none of their assertions depend on the
  blanket-sweep behavior this unit removes.

Add one new test directly targeting the narrowed behavior (place it
immediately after "a stale fingerprint re-surfaces the frozen tactics at
align-tactics", inside the same `describe` block):

```ts
it("a fresh- or null-stamped sibling is not frozen or re-surfaced by a stale sibling's freeze", () => {
  const s = strategy({ id: "strategy-s" });
  const nodes: IntentionNode[] = [
    s,
    tactic({
      id: "tactic-stale",
      serves: ["strategy-s"],
      phase: "implement",
      execution: exec({ strategy_fingerprint: "stale-fingerprint" }),
    }),
    tactic({
      id: "tactic-fresh",
      serves: ["strategy-s"],
      phase: "qa",
      execution: exec({ strategy_fingerprint: strategyFingerprint(s) }),
    }),
    tactic({ id: "tactic-null-stamp", serves: ["strategy-s"], phase: "review" }),
  ];
  const sel = selectGraphTargets(nodes);
  expect(sel.candidates.find((c) => c.id === "tactic-fresh")).toMatchObject({
    phase: "qa",
    reevaluation: false,
  });
  expect(sel.candidates.find((c) => c.id === "tactic-null-stamp")).toMatchObject({
    phase: "review",
    reevaluation: false,
  });
  const frozenCandidates = sel.candidates.filter(
    (c) => c.kind === "tactic" && c.phase === "align-tactics",
  );
  expect(frozenCandidates.map((c) => c.id)).toEqual(["tactic-stale"]);
  const freezeEvent = sel.events.find((e) => e.event === "freeze");
  expect(freezeEvent?.detail).toContain("tactic-stale");
  expect(freezeEvent?.detail).not.toContain("tactic-fresh");
  expect(freezeEvent?.detail).not.toContain("tactic-null-stamp");
});
```

`strategyFingerprint` and `selectGraphTargets` are already imported at the
top of the test file (`packages/intentionsutil/test/router.test.ts:4-10`); no
new imports are needed.

**Recommended model**: sonnet — mechanical expectation updates plus one new
test with fully specified inputs/outputs.

**Dependencies**: Unit 1 (these tests assert the post-fix behavior; run them
against the Unit 1 code change, not before it).

## Reuse

- Test fixtures: `tactic()`, `strategy()`, `exec()`
  (`packages/intentionsutil/test/router.test.ts:43,52,57`) and the
  `frozenGraph()` helper (`:328`) — extend/reuse rather than duplicating.
- `strategyFingerprint` (`packages/intentionsutil/src/router.ts`, exported,
  already imported in the test file) — never hand-compute a fingerprint.
- `isStrategyStale` (`packages/intentionsutil/src/transitions.ts:413`) — the
  existing staleness predicate; this tactic does not change its logic, only
  which children `selectGraphTargets` feeds through it into
  `frozenTacticIds`.

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
```

Manual sanity check (optional, not required to land): re-read the updated
JSDoc on `selectGraphTargets` (router.ts:224-234) and confirm it no longer
uses "subtree" language for the freeze scope.
