---
id: tactic-router-subtree-parent-exclusion
kind: tactic
statement: selectGraphTargets excludes subtree-parents from the align-tactics
  draft-selectable set — a tactic named as another tactic's parent is a
  permanent container, not an undecomposed draft
owner: ai
status: codified
parent: null
rationale: "Retained draft from the 2026-07-19 /align-strategy round on
  strategy-graph-native-dispatch ('track both the router fix'), minted after
  /align-tactics tactic-graph-native-dispatch parked its own target for exactly
  this defect: the router's frozen-tactic branch
  (packages/intentionsutil/src/router.ts — isDraft at ~L124-127, frozen-tactic
  candidates at ~L308-334) treats any tactic with phase===null as an
  align-tactics candidate, with no exclusion for a tactic that is itself another
  tactic's `parent`. A subtree-parent is by design permanently phase-null (it
  completes when its last child completes), so it re-surfaces as an
  align-tactics candidate every tick. Two live instances on the current corpus:
  tactic-graph-native-dispatch (8 children, office_hours-parked 2026-07-19 for
  this defect) and tactic-firebase-demo-saas-app (6 children). Finalized
  2026-07-18 /align-tactics per-node session: plan written into the body below;
  no code change made by this session (planning only)."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 65
  override: null
  rationale: "Boosted to top ranking by author direction (2026-07-19, 'execute
    recommendation' follow-up to the /align-strategy round that minted this
    draft): the router misselects subtree-parents every tick, and the
    office_hours parks those doomed sessions force are self-regenerating queue
    noise — so this fix dispatches next. Sized against the composed selector
    max: childless, empty blocked_by, so rank = boost + 5.33; frontier max at
    authoring was 69.33 (tactic-graph-commit-auto-serialization, boost 64), so
    boost 65 gives 70.33 — verified #1 via select-targets against origin/main
    10befb49. This deliberately overtakes the auto-serialization pin per the
    same author direction; that node stays #2 with its own boost untouched. The
    boost flows nowhere else (no blocked_by, no children)."
phase: qa
execution:
  branch: tactic-router-subtree-parent-exclusion
  pr: 2912
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# selectGraphTargets excludes subtree-parents from the align-tactics draft-selectable set — a tactic named as another tactic's parent is a permanent container, not an undecomposed draft

## Context

`selectGraphTargets`'s frozen-tactic branch
(`packages/intentionsutil/src/router.ts`) treats every `phase === null` tactic
as an `/align-tactics` draft candidate via `isDraft` (router.ts:124-127:
`phase === null || phase === "draft"`), with no exclusion for a tactic that
appears as another tactic's `parent`. A subtree-parent is permanently
`phase: null` by design — it never advances phase itself; it completes only
when its last child completes (`intentions/tactic-graph-native-dispatch.md`
§2.3 subtree shape) — so it re-surfaces as a draft candidate on every tick, and
a per-node `/align-tactics` session over it can only park (a subtree-parent
has no independent PR-sized unit of work; its "work" is entirely its
children's). Two live instances on the current corpus are already hitting
this: `tactic-graph-native-dispatch` (8 children, `office_hours`-parked
2026-07-19 naming this exact defect) and `tactic-firebase-demo-saas-app` (6
children, not yet parked but will trip the same defect the next time the
router selects it).

The fix stops the router from re-selecting subtree-parents as align-tactics
candidates. Because the defect's root cause — deriving container-ness from
`parent` edges rather than hand-annotating each subtree-parent — is a design
choice the author ratified 2026-07-19 (see the node's own rationale/Scope
extension history), the same derived-not-declared exclusion also needs to land
in the strategy-target `/align-tactics` draft-consumption sweep, the only
other site that conflates "phase-absent" with "undecomposed draft."

## Unit 1 — router.ts fix + unit tests

**Recommended model:** sonnet (well-specified, mechanical: one precomputed
set, one added guard clause, matching test cases against an existing fixture
pattern).

**Scope.** `packages/intentionsutil/src/router.ts`. Inside `selectGraphTargets`,
add a precomputed set of subtree-parent ids and skip emitting a draft
candidate (`isDraft(t)` branch) whose id is in that set.

Current anchors (re-locate by function/comment name if line numbers have
since drifted):
- `isDraft`: router.ts:124-127.
- `selectGraphTargets` — `tactics`/`byId` setup: router.ts:250-257.
- Frozen-tactic candidates loop: router.ts:308-334 (the `isDraft(t)` branch is
  ~317-327; the `tactics` array is already in scope there).

Implementation — immediately before the `// --- Frozen tactic candidates`
loop (after the soft-freeze scan), using the already-in-scope `tactics` array:

```ts
const subtreeParentIds = new Set<string>();
for (const t of tactics) {
  if (t.parent !== null) subtreeParentIds.add(t.parent);
}
```

Then, inside the loop's `if (isDraft(t))` branch, guard before pushing the
candidate:

```ts
if (isDraft(t)) {
  if (subtreeParentIds.has(t.id)) continue; // permanent container, not an undecomposed draft
  candidates.push({ ... });
}
```

Do not touch the `else if (frozenTacticIds.has(t.id) && isOpenTactic(t))`
branch: a subtree-parent is permanently phase-null by design, so it can never
satisfy `isOpenTactic` and never reaches that branch — no separate exclusion
needed there.

**Audit (confirm-only, no code change expected).** `resolveFrozenDescendant`
(router.ts:457-470) and `frozenTacticSelectable` (router.ts:486-490) both
delegate entirely to `selectGraphTargets(nodes).candidates` (single-source-of-
truth, per their own docstrings) — neither re-implements the draft/soft-freeze
gates independently. Fixing the loop above therefore fixes both transitively;
do not add a second exclusion in either function. If the implementing session
finds either function has since started re-deriving `isDraft` independently,
that is new drift beyond this plan's scope — park it rather than silently
expanding scope to cover it.

**Out of scope.** `isDraft`, `isOpenTactic`, `blockersComplete`, the
soft-freeze scan (`frozenTacticIds`), and the "Tactic candidates" executable
loop (router.ts:290-306) are all unchanged — a subtree-parent is always
phase-null, so it never enters that loop.

**Unit tests.** `packages/intentionsutil/test/router.test.ts`, in the existing
`describe("frozen-node candidates", ...)` block (currently starting at line
543). Reuse the file's existing `tactic()`/`anode()`/`candidateIds()` fixture
helpers (currently lines 14-45, 79-81) — do not hand-roll new fixture
builders.

- New test: "a tactic named as another tactic's parent is not
  draft-selectable, even though it is phase-null." Build
  `[tactic({ id: "tactic-parent", phase: null }), tactic({ id: "tactic-child", phase: null, parent: "tactic-parent" })]`;
  assert `candidateIds(nodes)` contains `"tactic-child"` (the child is itself
  an ordinary draft, still selectable — only its `parent` is excluded) but
  does NOT contain `"tactic-parent"`.
- Regression check, no new test needed: the existing "a null-phase (raw)
  tactic emits an align-tactics candidate" test (currently line 556) covers
  the childless case — it has no children, so `subtreeParentIds` is empty and
  the fix is a no-op for it. Confirm it still passes unmodified.

**Dependencies:** none.

## Unit 2 — SKILL.md draft-consumption sweep exclusion

**Recommended model:** sonnet (prose-only edit to an existing, well-scoped
instruction step; no design judgment beyond matching the router's exclusion
rule in words).

**Scope.** `.claude/skills/align-tactics/SKILL.md`, Step 2 item 2 ("Consume
the draft tactics.", currently lines 295-302 — re-locate by that heading text
if the file has been edited since this plan was written). Add the same
derived-parent-set exclusion to the strategy-target draft-consumption sweep,
so a strategy-wide `/align-tactics` round does not run a subtree-parent
through finalize/split/merge/prune.

Add a sentence to item 2, after the existing born-parked-exclusion sentence
("...leave it alone, do not run it through this path.") and before "Finalizing
reuses...": state that before finalizing/splitting/merging/pruning a draft
child, the sweep also excludes any child whose id appears as another tactic's
`parent` anywhere in the corpus — a subtree-parent is a permanent container,
not an undecomposed draft, per the same derived-set rule
`selectGraphTargets`'s frozen-tactic branch applies (cite
`packages/intentionsutil/src/router.ts` and this tactic's id as the
reference, following this SKILL.md's existing convention of citing router.ts
by file:function elsewhere in the document) — leave such a child in place as a
container rather than acting on it.

**Out of scope.** No other section of SKILL.md changes. Do not touch the
Idempotency section's existing `office_hours`-based born-park exclusion (a
different, already-correct exclusion) — this unit adds a second, independent
exclusion alongside it, not a replacement.

**Dependencies:** none (independent of Unit 1; both units may land in the same
PR or either order).

## Reuse

- Existing `isDraft`/`isOpenTactic` helpers (router.ts:124-133) — unchanged,
  reused as-is.
- Existing `tactic()`/`anode()`/`candidateIds()` test fixtures
  (`packages/intentionsutil/test/router.test.ts:14-81`).
- `resolveFrozenDescendant` and `frozenTacticSelectable` (router.ts:457-490) —
  reused unchanged; both already delegate to `selectGraphTargets`, confirmed
  by Unit 1's audit.

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
```

Manual:
- After landing, run `packages/intentionsutil/scripts/select-targets.ts`
  against `origin/main` post-merge and confirm neither
  `tactic-graph-native-dispatch` nor `tactic-firebase-demo-saas-app` appears as
  an `align-tactics` candidate.
- This PR's merge does NOT by itself clear the `office_hours` park on
  `tactic-graph-native-dispatch` — a park clears only when a session with a
  later commit touches that specific node. This PR's job is only to stop the
  router from re-selecting it; a human or a later session reviewing
  `tactic-graph-native-dispatch` clears its own park once satisfied the fix is
  live on `origin/main`.
