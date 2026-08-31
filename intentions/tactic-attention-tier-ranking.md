---
id: tactic-attention-tier-ranking
kind: tactic
statement: "Implement the three-tier ranking floor: bug_fix/security/tier marks
  resolve to an outer tier in resolveAttention, the selector sorts by (tier,
  rank), blocking lifts the lexicographic (tier, rank) pair, and
  strategy-main-health migrates from boost 100 to tier 3"
owner: ai
status: codified
parent: null
rationale: "Byproduct of the 2026-07-18 /align-strategy tier-model round on
  strategy-graph-drives-dispatch (author-dictated). Carries the implementation
  scope, the must-land-first main-health migration, and the borderline marking
  worklist the round deferred. Planned 2026-07-30 by the dispatch-pipeline
  bootstrap through a parallel Workflow fan-out rather than an /align-tactics
  round, so that skill's two-sided drift review and its census were bypassed
  (deliberate: ten concurrent align rounds would mean ten concurrent
  graph-commits, the exact hazard the bootstrap exists to avoid). Each plan was
  authored against the node's own cited code and then independently verified by
  a second agent; all reported citation and substance gaps were applied before
  landing. A later /align-tactics round should treat this body as unreviewed by
  the normal path."
reading: null
serves:
  - strategy-graph-drives-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boosts:
    "1": 0.02
  rationale: >-
    Bootstrap re-scale 2026-07-30: Wave A of a three-band interim scale (50 / 20
    / 10) that puts write-path integrity work above ordinary feature work. This
    band holds the silent graph-write-corruption defects plus the two paths the
    bootstrap arms or depends on. Interim scaffolding only -
    tactic-attention-tier-ranking replaces the whole numeric scheme with
    lexicographic (tier, rank) and max-lifting, and
    tactic-attention-boost-scripts converts these boosts to tier/bug_fix marks.


    NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 50 to 0.02 so this
    boost can no longer lift the node out of its parent strategy's band. The
    bound - a tactic boost is namespaced to its strategy's rank and must never
    cause the tactic to outrank a tactic of a higher-ranked strategy - is
    recorded doctrine on strategy-recursive-self-improvement but is NOT yet
    enforced by the resolver; tactic-attention-namespaced-rank makes it
    structural. Until then the flat additive sum defeats it, so the magnitudes
    are compressed by hand onto a 0.01-per-level ladder that preserves the
    original ordering WITHIN the band. Original magnitude preserved at
    attributes.pre_namespacing_boost for restoration.
phase: main-qa
execution:
  branch: tactic-attention-tier-ranking
  pr: 2997
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-01T17:46:53Z
    mergeCommitSha: 7876d5f91041fd806e7fea4084f26727c21cb763
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours:
  reason: Item 11 asks a human to confirm the strategy-graph-native-dispatch
    soft-freeze blast radius is proportionate and intended -- a subjective
    scope/product judgment call, not something any tool can decide; the finding
    text itself says so explicitly.
  since: 2026-08-03
  recommendation: "Machine research already done: ran 'npx tsx
    packages/intentionsutil/scripts/select-targets.ts' (sandbox-off) against the
    live 400+ node store and filtered its emitted freeze events to
    strategy-graph-native-dispatch. Result: currently ZERO open tactics carry a
    stale strategy_fingerprint stamp against this strategy, so the observed
    blast radius right now is zero re-surfaced tactics, not the dozens one might
    assume from the plan prose. (163 tactics serve this strategy total, 123 of
    them open by phase, but none of the open ones hold a strategy_fingerprint
    map entry for this strategy id predating the 2026-07-31
    attributes.conditions amendment -- most never got a per-strategy stamp at
    all.) The graph-wide freeze mechanism itself is confirmed live and working:
    it correctly reported 5 unrelated freeze events on other strategies
    (strategy-autonomous-execution x3, strategy-explicit-intent x1,
    strategy-reversible-institution x1) in the same run. Ask: given the
    currently-measured blast radius is zero, confirm this (rather than the
    larger hypothetical set) is the intended/acceptable outcome -- note the
    count is a live snapshot and will grow as more tactics serving
    strategy-graph-native-dispatch get planned/stamped over time, so re-check if
    the concern is about future growth rather than the current state."
  session_type: other
pace_exempt: true
rounds: null
attributes:
  pre_namespacing_boost: 50
---
# Implement the three-tier ranking floor: bug_fix/security/tier marks resolve to an outer tier in resolveAttention, the selector sorts by (tier, rank), blocking lifts the lexicographic (tier, rank) pair, and strategy-main-health migrates from boost 100 to tier 3

## Context

Ranking in this repo is a single scalar. `resolveAttention`
(`packages/intentionsutil/src/attention.ts:285`) composes a weighted sum of
three terms (`authored`, `signal`, `capture`) into `ResolvedAttention.value`,
and every consumer orders by that one number: the dispatch selector
(`packages/intentionsutil/src/router.ts:442-448`), the frontier projection
(`packages/intentionsutil/src/goals.ts:80-94`), and the office-hours queue
(`packages/intentionsutil/src/officeHours.ts:57-59`).

Three defects follow from having only that one scalar.

**1. Defects and production incidents have no floor.** Today the only way to
make red-main work outrank everything is a big number:
`intentions/strategy-main-health.md:159-161` carries `attention.boost: 100`,
protected by `validateGraph` rule 18 (`packages/intentionsutil/src/schema.ts:917-941`,
rule text at `:1028-1035`), which refuses any other node authoring a boost or
override `>= 100` without the literal `ACK: main-health-dominance` in its
`attention.rationale`. That is a numeric arms race, not a guarantee: it erodes
as term weights evolve, and it forces every ordinary escalation to reason about
a ceiling. The live graph already shows the pressure — 44 nodes carry boosts,
the current bootstrap scale runs 3/5/7/10/20/50/75/85/90/96 (excluding `strategy-main-health`'s 100), and one node is at 96.
Meanwhile the semantic marks `attributes.bug_fix: true` (four live nodes) and
`attributes.security: true` (one live node) are authored but completely inert:
no code reads them.

The author-dictated model (recorded on `intentions/strategy-graph-drives-dispatch.md`,
2026-07-18 clarifications, and 2026-07-21 clarifications) replaces the numeric
ceiling with an outer **tier** axis. Ranking becomes the lexicographic pair
`(tier, rank)`, tier outermost. Tier 1 is the default (all ordinary work);
tier 2 is bug fixes and security issues plus explicit lifts; tier 3 is
production/main issues. Tiers ARE bands, deliberately — an explicit amendment of
the terms-with-weights-never-bands doctrine, which continues to govern ordering
*within* a tier.

**2. `resolveAttention` still carries a superseded doctrine.** The authored
term's `distributorIds` (`packages/intentionsutil/src/attention.ts:315-327`)
includes `reverseBlockers` — the 2026-07-07 *backward* additive flow along
`blocked_by`, where a hot node's boost flows into its blockers and sums. That
design was superseded 2026-07-13 (`strategy-graph-drives-dispatch`, the two
backward-flow clarifications): blocking is orthogonal to boosting. The recorded
failure it caused: unrelated `blocked_by` compounding silently overtook
intentionally top-ranked nodes, because the flow is additive. The replacement is
a **max-based precedence lift in the selector**: a blocker's *selection
precedence* lifts to at least the lexicographic max `(tier, rank)` of the nodes
it blocks — recursive, max-based, never additive — while its own marks and
authored rank stay untouched. Blocking still gates and serializes; it never
boosts. This tactic absorbs the draft
`intentions/tactic-attention-blocking-orthogonal.md`, which recorded the same
change pre-tier.

**3. A boost value has no scale it belongs to.** Under tiers a boost only ever
orders a node against same-tier peers, so a magnitude is meaningful only within
the tier it was chosen for; different tiers can be on entirely different scales.
The author's failure scenario (2026-07-21, author-directed): a value chosen
mid-way in tier 1 carried into tier 2 wrongly dominates there. The required
remedy is a **mechanical** guarantee, not a scripting convention — changing a
node's tier must not carry its boost.

Observable bad outcome today, concretely: a node marked `attributes.bug_fix:
true` with no boost (e.g. `tactic-review-fix-residue-death-coverage`, which has
`attention: null`) resolves to rank 0 and is dispatched *after* every ordinary
feature node carrying a boost of 3. The mark is authored, visible in the graph,
and has zero effect on what the fleet picks up next.

Intended outcome: `resolveAttention` returns a `tier` alongside `value`; every
ordering consumer sorts `(tier, rank)`; blocking lifts the pair; boosts are
tier-scoped; `strategy-main-health` moves from `boost: 100` to
`attributes.tier: 3`; and the write-path guard that protected the 100 protects
tier 3 instead.

### Design decisions this plan makes (and the rivals it diverges from)

The node's prose left two questions open. They are resolved here so a clean
session need not re-litigate them.

**(a) Storage shape of the per-tier boost namespace.** Chosen: a **provenance
tag** — `attention.tier`, the tier whose scale the value was chosen in,
defaulting to 1 when absent — plus a `validateGraph` rule that it must equal the
node's own tier. Changing a node's marks without re-selecting a boost is then a
loud, named validation failure telling the author to pick a fresh value for the
new tier.

Rival considered and diverged from: storing boost as a map keyed by tier
(`attention.boost: {1: 50}`), so a tier change simply finds no entry. It gives
the same guarantee but *silently* zeroes the boost — a defensive fallback
exactly of the kind `.claude/rules/code-style.md` forbids ("prefer clear errors
over defensive fallbacks"). It also requires rewriting all 44 live boosted node
files. The tag form needs **zero** node-file edits: every existing boost was
authored under the single pre-tier scale, which *is* tier 1, which *is* the
default.

**(b) How a per-tier boost composes with the downward flow along
`parent`/`serves`.** Chosen: **unchanged composition** — inherited authored
claims sum exactly as today, each source contributing the value in its own
namespace. Justification: tier inherits downward along the same `parent`/`serves`
edges the authored flow uses and is max-based, so a receiving node's effective
tier is always `>=` every source's namespace tier. A tier-1-scale number can
therefore only ever reorder nodes that are all already inside the same, higher
tier — the mixing is bounded by tier being the outer axis, and the author's
stated failure scenario (a value surviving a *tier change of its own node*) is
closed by (a).

Rival considered and diverged from: filtering the authored source set so only
sources whose namespace equals the receiver's *effective* tier contribute. It is
a more literal reading of "meaningful only within its tier", but it silently
drops legitimate authored claims — a node under a tier-3 strategy would see its
own boost vanish from its rank with no error and no explanation in the
`sources`/`terms` breakdown. If the author later prefers it, it is a one-line
change in the compose step (`attention.ts:459-491`) — record that as a follow-up
rather than building it now.

### Citation drift found while planning

The node's prose cites some locations that are not where the code lives. Use
these instead:

- "`packages/intentionsutil/scripts/validate-graph.ts` — shape checks": that
  script (`main()` at `:64-90`, invoked at `:92`) calls `validateGraph` plus `lintTacticBodies` (`:76`) and `validateGraphProseRefs` (`:84`) — it holds no rule logic of its own. **All rule logic lives in
  `packages/intentionsutil/src/schema.ts`** — `validateGraph` at `:1047-1092`,
  its numbered rule documentation at `:989-1046`.
- "frontier-view — render the tier": `packages/intentionsutil/scripts/frontier-view.ts:32`
  is a one-line call. **The rendering lives in
  `packages/intentionsutil/src/goals.ts`** — `projectGoals` at `:77-100`,
  `renderFrontier` at `:150-168`.
- "amend the >=100 write-path-guard **clarification** on
  strategy-graph-native-dispatch (2026-07-13)": it is not a `clarifications`
  entry. It is a bullet in `attributes.conditions` —
  `intentions/strategy-graph-native-dispatch.md:3093-3098` (the
  `attributes:`/`conditions:` keys are at `:2998-2999`).

### Two consequences to expect, neither of which is a defect

1. **Amending `strategy-graph-native-dispatch`'s condition changes its substance
   fingerprint.** `strategyFingerprint` (`packages/intentionsutil/src/router.ts:80-90`)
   hashes `attributes.conditions`. Editing that bullet therefore soft-freezes
   every open tactic stamped against `strategy-graph-native-dispatch`; each
   re-surfaces as an `align-tactics` re-evaluation candidate
   (`router.ts:267-285`). This is unavoidable for any condition edit and is the
   designed behavior, not breakage.
2. **`strategy-main-health`'s own edits do NOT change its fingerprint.** Only
   `statement`, `clarifications`, `attributes.conditions`, `serves`,
   `success_signal`, `tooling_goals` are hashed. Setting `attributes.tier: 3`,
   nulling `attention`, and extending `rationale` touch none of them — so record
   the migration's "why" in the node's `rationale` field, **not** as a new
   clarification, and nothing freezes.

### Verification is NOT covered by PR CI — this matters

`validate-graph` runs only in `.github/workflows/graph-fast-path.yml:32`, which
fires on `intentions/`-only pushes. `.github/workflows/unit-tests.yml` does not
run it, and `packages/intentionsutil/scripts/graph-commit` does not call it
either. So a PR that changes `validateGraph` rules is **not** checked against the
live 400+ node store by CI. Every unit below must run
`npx tsx packages/intentionsutil/scripts/validate-graph.ts` locally against the
real `intentions/` directory before landing, or the next graph push breaks the
fast path.

---

## Unit 1 — Tier resolution, the per-tier boost namespace, and dropping the backward flow

**Recommended model**: `opus`

This is the semantic core: a new outer axis threaded through a monotone
fixpoint, plus removal of a superseded flow relation whose interaction with
cycles is subtle. Judgment-heavy, cross-cutting.

**Scope**

`packages/intentionsutil/src/schema.ts`:

- `Attention` interface (`:121-125`): add `tier: number`. Document it as the
  tier whose scale the value was chosen in — the per-tier boost namespace tag —
  not the node's tier.
- `IntentionNodeInput`'s `attention?: Attention | null` (`:197`) needs no change;
  make the field optional on the *input* side by having `validateAttention`
  default it.
- `validateAttention` (`:309-357`): parse `tier`. Absent/null → `1`. Present →
  must be an integer in `{1, 2, 3}`, else throw `IntentionSchemaError` naming the
  field, matching the existing throw style at `:330-347`. Return it in the object
  at `:356`.
- New exported helper `ownTier(node: IntentionNode): number` =
  `max(explicit, semantic, 1)` where `explicit` is `attributes.tier` when it is
  the number 2 or 3 (otherwise contributes nothing), and `semantic` is 2 when
  `attributes.bug_fix === true` or `attributes.security === true`. Export it —
  `attention.ts` and the new validate rules both need it, and it must have
  exactly one implementation.
- `validateGraph` (`:1047-1092`) gains two rules, documented in the numbered list
  at `:989-1046` in the same style:
  - **Rule 19 (mark shape)**: when present, `attributes.bug_fix` and
    `attributes.security` must be booleans; when present, `attributes.tier` must
    be the number 2 or 3. `attributes.tier: 1` is rejected — 1 is the default and
    is never authored. A non-boolean mark or an out-of-range tier is a problem
    string, not a silent skip.
  - **Rule 20 (per-tier boost namespace)**: for any node with non-null
    `attention`, `attention.tier` must equal `ownTier(node)`. The message must
    say what to do: the node's tier changed, so a fresh boost must be selected in
    the new tier's namespace and `attention.tier` updated to match. Use **own**
    tier, never effective tier — an effective-tier rule would cascade, invalidating
    every boosted descendant the moment any ancestor is marked.

`packages/intentionsutil/src/attention.ts`:

- `ResolvedAttention` (`:13-31`): add `tier: number`, **required** (not optional
  like `terms`). It is load-bearing for ordering; an optional field invites a
  `?? 1` at each call site that would hide a bug.
- `distributorIds` (`:315-327`): **delete the `reverseBlockers` clause**
  (`:323-325`), leaving `parent` plus (eligible nodes only) `serves`. Delete the
  now-unused `reverseBlockers` construction at `:300-307` — note
  `computeSignalPath` builds its own copy at `:152-159`, which stays untouched
  (the signal term is boolean reachability with a flat +1, explicitly unaffected
  by this doctrine change).
- Rewrite the module docblock at `:223-284` and the inline comments at
  `:293-314` and `:352-359`: the authored term now flows downward only. Keep the
  monotone fixpoint (`:393-414`) — it is still correct and still order-independent
  — but say plainly that the mixed `parent`/`blocked_by` cycles it was widened to
  tolerate can no longer arise, and that the pure-`parent`-cycle guard at
  `:338-350` remains the guard that fires.
- New: effective-tier resolution. `effectiveTier(n) = max(ownTier(n), max over
  distributors d of effectiveTier(d))` over the SAME downward relation
  `distributorIds` now returns. Compute it as a monotone fixpoint in the same
  sorted-id sweep style as the authored term (`:393-414`) — values only increase
  and are bounded by 3, so it converges. Resolve it for **every** node, not just
  eligible ones, because an ineligible node can sit on a `parent` chain; but only
  eligible nodes get a `ResolvedAttention` entry (`:456`).
- Compose (`:459-491`): set `tier: effectiveTier(n)` on every result entry,
  including the `overridden` early-return branch at `:471-476` (an override pins
  the *value*, not the tier — tier is a separate axis and must still be
  reported). Leave `value`, `sources`, and `terms` arithmetic exactly as today
  per design decision (b).

`packages/intentionsutil/test/attention.test.ts`:

- The `describe("resolveAttention backward blocked_by distribution")` block at
  `:468-555` asserts the superseded 2026-07-07 doctrine. Its five cases must be
  **rewritten to the new doctrine**, not deleted: a boost on a blocked node no
  longer reaches its blocker's `value`/`sources` (assert the blocker resolves to
  0 with empty sources); a mixed `parent`/`blocked_by` structure no longer needs
  fixpoint convergence but must still not throw; the downward-flow cases (the
  `serves`-edge half of the diamond at `:539-554`) keep their existing
  expectations. This is a recorded doctrine change (`strategy-graph-drives-dispatch`,
  2026-07-13), not test weakening.
- New cases for tier: an unmarked node resolves `tier: 1`; `bug_fix: true`
  resolves 2; `security: true` resolves 2; `attributes.tier: 3` resolves 3;
  `bug_fix: true` plus `attributes.tier: 3` resolves 3 (max, not sum); a tier-3
  strategy lifts a child tactic that serves it to tier 3; a tier-2 strategy and a
  tier-3 strategy both serving one tactic give it tier 3 (max); tier does not flow
  *upward* (a tier-3 child leaves its parent at 1); an `override` node still
  reports its inherited tier.
- The `anode` fixture at `:7-33` and the `boost`/`override` helpers at `:48-55`
  need `tier` threaded through the `Attention` literals.

`packages/intentionsutil/test/schema.test.ts`: new cases for rules 19 and 20 —
`attributes.bug_fix: "yes"` rejected; `attributes.tier: 1` rejected;
`attributes.tier: 4` rejected; a node with `bug_fix: true` and
`attention.tier: 1` rejected by rule 20 with the re-select message; the same node
with `attention.tier: 2` accepted; a node with `attention: null` and any marks
accepted.

**Explicitly out of scope for this unit**: any ordering change (router, goals,
officeHours — Units 2 and 3); any edit under `intentions/` (Unit 4); rule 18
(Unit 4).

**Reuse**

- `IntentionSchemaError` — `packages/intentionsutil/src/errors.ts`, already
  imported by both files.
- The existing monotone-fixpoint sweep shape and `mustGet` helper —
  `packages/intentionsutil/src/attention.ts:374-414` and `:385-391`. Model the
  tier fixpoint on them rather than writing a new traversal.
- `isPlainObject` — `packages/intentionsutil/src/schema.ts` (used at `:273`,
  `:310`) for the `attributes` reads in `ownTier`.
- The `problems.push(...)` accumulate-then-throw pattern in `validateGraph`
  (`:1059-1091`) — new rules must add to `problems`, never throw early, so one
  run surfaces every violation.
- `packages/intentionsutil/src/store.ts:48` serializes the *validated* node with
  `stringify`, so `attention.tier` will appear in frontmatter on any node
  rewritten through `writeNode`. That is intended (values become
  self-describing); do not add special-case suppression.

## Unit 2 — Selector: lexicographic (tier, rank) ordering and the max-based blocking precedence lift

**Recommended model**: `opus`

Recursive precedence over a graph relation with a termination hazard, plus a
change to the ordering the entire autonomous fleet keys on.

**Dependencies**: Unit 1 (needs `ResolvedAttention.tier`).

**Scope**

`packages/intentionsutil/src/router.ts`:

- `GraphCandidate` (`:22-51`): add `tier: number` — the node's OWN resolved
  effective tier, from `resolveAttention` — documented alongside the existing
  `rank` field at `:33-34`. Additionally add `precedence: { tier: number; rank:
  number }`: the lifted pair actually used for the sort. Keeping both is the
  point of the doctrine — "blocking nodes are ranked higher, not boosted higher"
  — so the candidate must report its own values *and* the precedence it drains at.
- New function, placed near `blockersComplete` (`:168-174`):
  `effectivePrecedence(nodes)` returning `Map<string, {tier, rank}>`, where a
  node's precedence is the lexicographic max over its own `(tier, rank)` and the
  precedence of every node that lists it in `blocked_by`. Build the
  reverse-blockers index the same way `computeSignalPath` does
  (`packages/intentionsutil/src/attention.ts:152-159`). Memoize. **Compute over
  the full `nodes` array, not over the candidate list** — a blocked node is
  ineligible (`:303`) and never becomes a candidate, so its urgency reaches the
  selector only through the lift.
- Termination: `validateGraph` rule 15 forbids `blocked_by` cycles, but
  `selectGraphTargets` runs on a store snapshot that was never validated. Do not
  rely on the rule. Track an on-stack set and, on re-entry, **throw
  `IntentionSchemaError`** naming the cycle — mirroring the parent-cycle guard at
  `packages/intentionsutil/src/attention.ts:338-350`. A clear error, never a
  silent 0 (`.claude/rules/code-style.md`).
- Populate `tier` and `precedence` at all four candidate-construction sites:
  `:319-331`, `:348-357`, `:359-368`, and `asCandidate` at `:376-385`.
- The sort at `:442-448` becomes, in order: `precedence.tier` descending,
  `precedence.rank` descending, progression ordinal descending
  (`progressionIndex`, `:191-196`, unchanged), `id` ascending.
- Update the ordering paragraph of the `selectGraphTargets` docblock
  (`:241-247`) and the "Order:" line in `GraphSelection` (`:61`).

`packages/intentionsutil/test/router.test.ts` — extend
`describe("ordering")` (`:833-895`):

- A tier-2 node with rank 0 sorts ahead of a tier-1 node with a large boost.
- A tier-3 node sorts ahead of a tier-2 node.
- Within one tier, boost still orders (the existing case at `:834-850` should
  still pass unchanged — both nodes are tier 1).
- Nothing compounds: a node blocking two tier-3 nodes gets tier-3 precedence, not
  tier 6 or a summed rank.
- A tier-1 blocker of a tier-3 node is emitted with tier-3 precedence while its
  reported `tier` stays 1 and its `rank` is unchanged.
- The lift is recursive: a blocker of a blocker of a tier-3 node also lifts.
- A `blocked_by` cycle throws `IntentionSchemaError`.

Note the `tactic`/`strategy`/`kinds` fixtures already exist at `:42-78`, and
`kinds()` (`:73-78`) supplies the `goal_layer: true` kind nodes
`resolveAttention` needs for real ranks.

**Explicitly out of scope**: `packages/intentionsutil/scripts/check-node-selection.ts`
and `.claude/skills/dispatch-propagate/scripts/graph-select-target`. The wrapper
reads named fields from the selection JSON by jq at
`.claude/skills/dispatch-propagate/scripts/graph-select-target:724`
(`id, kind, phase, pr, pace_exempt, fix.pushed_sha, fix.since`); both new fields
are additive and break nothing. Do not touch either file.

**Reuse**

- `resolveAttention` — already imported at `packages/intentionsutil/src/router.ts:2`.
- `blockersComplete` (`:168-174`) for eligibility; the lift is separate and must
  not change it.
- The reverse-blockers index construction in
  `packages/intentionsutil/src/attention.ts:152-159`.

## Unit 3 — Frontier and office-hours queue order by (tier, rank)

**Recommended model**: `sonnet`

Two small, well-specified sort/render changes with explicit expected cases.

**Dependencies**: Unit 1 (needs `ResolvedAttention.tier`).

**Scope**

`packages/intentionsutil/src/goals.ts`:

- `projectGoals` sort (`:80-94`): tier descending becomes the new outermost key,
  ahead of the existing `value` comparison at `:81-83`. A node with no resolver
  entry is tier 1, matching the existing `?? 0` value convention. Update the
  numbered sort documentation at `:65-73`.
- `renderFrontier` (`:150-168`): render ` [tier N]` immediately before the
  existing rank marker, **only when `tier > 1`**. This preserves the documented
  byte-stability property at `:144-147` — a store with no marks and no injections
  renders exactly as it does today.
- Update the `renderFrontier` docblock at `:136-149` to describe the tier marker.

`packages/intentionsutil/src/officeHours.ts`:

- `QueueMember` (`:15-21`): add `tier: number`.
- `officeHoursQueue` (`:38-60`): read `attention.get(n.id)?.tier ?? 1` alongside
  the raw rank at `:49`; sort by tier descending first, then the existing
  penalized-rank comparison at `:57-59`, then id. The `SESSION_TYPE_PENALTY`
  multiplier (`:12`, applied at `:47-52`) stays a rank-only multiplier and must
  NOT scale the tier — amend the docblock at `:23-37`, which currently says the
  penalty "is soft, not a hard tier", to add that the attention tier now IS a
  hard outer axis while the session-type penalty remains soft within it.
  Rationale for including this file: a tier-3 parked node must head the
  office-hours queue for the same reason it heads the dispatch queue, and
  `officeHoursQueue` consumes `resolveAttention` directly, so it would otherwise
  silently ignore tiers.

`packages/intentionsutil/scripts/office-hours-select.ts`: the row format is
`<rank>\t<sessionType>\t<nodeId>\t<since>` (`:131`, contract documented at
`:43-46` and pinned by a unit test). **Do not change the row format** — the
consumer `office-hours-graph` parses it positionally. Ordering changes; the wire
format does not.

`packages/intentionsutil/test/goals.test.ts`: the hand-built `ResolvedAttention`
literals at `:198`, `:203`, `:217` need the new required `tier` field. Add cases:
a tier-2 goal sorts ahead of a tier-1 goal with a higher value; a tier-1 goal
renders no tier marker; a tier-2 goal renders ` [tier 2]`; an empty/unmarked
store renders byte-identically to the pre-change expectation.

`packages/intentionsutil/test/office-hours.test.ts`: extend
`describe("officeHoursQueue")` (`:73-208`) — a tier-2 parked node heads the
queue over a higher-raw-rank tier-1 node; within one tier the session-type
penalty still applies as the existing cases assert.

**Explicitly out of scope**: `packages/intentionsutil/scripts/frontier-view.ts`
(a one-line call at `:32`, no change needed).

**Reuse**

- `formatRank` (`packages/intentionsutil/src/goals.ts:110-112`) and
  `formatTermBreakdown` (`:128-134`) — the tier marker sits alongside them, do
  not duplicate the formatting.
- `resolveAttention` — already imported in both
  `packages/intentionsutil/src/goals.ts:2` and
  `packages/intentionsutil/src/officeHours.ts:9`.

## Unit 4 — Migration: strategy-main-health to tier 3, and rule 18 re-pointed at the tier field

**Recommended model**: `opus`

Redesigning a write-path guard plus editing live graph nodes whose prose is
doctrine. Judgment-heavy and easy to get subtly wrong.

**Dependencies**: Units 1, 2, and 3 must all be complete first. The node's
recorded constraint: *do not remove the boost before the tier code is live in the
selector path.* Landing the flip early leaves red-main work at tier 1 with no
protection at all.

**Every `schema.ts` line number in this unit is a PRE-Unit-1 snapshot and will
have shifted by the time you execute.** Unit 1 edits the `Attention` interface
(`:121-125`), rewrites `validateAttention` (`:309-357`), and adds an exported
`ownTier` helper plus two new rule-check functions with their numbered-list
documentation — all of it *above* this unit's anchors
(`checkAttentionDominance` `:917-941`, the `dominantBoost` read `:1051-1058`,
the rule-18 doc text `:1028-1035`, the numbered rule list `:989-1046`,
`validateGraph` `:1047-1092`). **Re-locate every one of them by function name
and rule name, not by line number.** The same caution applies to
`test/schema.test.ts` if Units 1-3 added cases above `:1532`.

**Scope**

`packages/intentionsutil/src/schema.ts` — replace rule 18:

- Delete `checkAttentionDominance` (`:917-941`) and the `dominantBoost` read at
  `:1051-1058`.
- Add `checkTierDominance(node, mainHealthPresent, problems)` in its place, and
  rewrite the rule-18 documentation at `:1028-1035`:
  - (a) No node other than `strategy-main-health` may **author** an explicit
    `attributes.tier: 3`. Inheriting tier 3 through `serves`/`parent` is fine and
    is exactly how auto-created red-main fix tactics get their urgency — the guard
    is on authoring, never on the derived value.
  - (b) When `strategy-main-health` is present in the node set, it must itself
    carry `attributes.tier: 3` — this is the "or reduce it" half of the original
    guard, now structural rather than numeric. When the node is absent (test
    fixtures, partial sets), the guard is inert, mirroring the old
    `dominantBoost === null` inert path.
  - Opt-out: the literal substring `ACK: main-health-dominance` in the node's
    `rationale`, or in `attention.rationale` when `attention` is non-null. The
    substring is unchanged from the old guard so existing author habit and any
    existing ACKs carry over; accepting it in `rationale` too is necessary
    because a node can now be tier-lifted with `attention: null`.
  - Every message must name the node and state the remedy, matching the existing
    message style at `:932-939`.

`packages/intentionsutil/test/schema.test.ts` — the seven rule-18 cases at
`:1565-1613` (helper `mainHealthNodes` at `:1541-1563`; `:1532-1540` is the section comment and `type Attn` alias) all assert the removed
numeric rule. **Replace them one-for-one with the tier equivalents**: authoring
`attributes.tier: 3` on a sibling throws; the same with the ACK substring in
`rationale` passes; the same with the ACK in `attention.rationale` passes;
`attributes.tier: 2` on a sibling passes (tier 2 is unguarded); a
`strategy-main-health` without `attributes.tier: 3` throws; a node set with no
`strategy-main-health` is inert; `strategy-main-health`'s own
`attributes.tier: 3` does not self-trip. This is a rule replacement following a
recorded doctrine change, not test removal.

`intentions/strategy-main-health.md`:

- `attention:` block at `:159-169` → `attention: null`.
- `attributes: {}` (last line of the frontmatter) → `attributes:` with
  `tier: 3`.
- Extend the `rationale` field (`:9-17`) with a dated note (`2026-07-30` or the
  implementation date) recording that the standing boost 100 migrated to
  `attributes.tier: 3` under the tier model, that red-main fix tactics now
  inherit tier 3 through the same downward flow, and that dominance is now
  structural (top tier) rather than numeric. **Put this in `rationale`, not in a
  new clarification** — `strategyFingerprint`
  (`packages/intentionsutil/src/router.ts:80-90`) hashes `clarifications` but not
  `rationale`, so a clarification would needlessly soft-freeze this strategy's
  children while a rationale edit changes nothing.
- Leave the two existing clarifications' prose alone even though they narrate
  "boost 100" — they are dated 2026-07-13 interview records, and rewriting
  history is not this tactic's job. The new `rationale` note supersedes them in
  effect.

`intentions/strategy-graph-native-dispatch.md`:

- Amend the `attributes.conditions` bullet at `:3093-3098` (currently: "strategy-main-health's
  standing boost (100) stays the graph's top authored rank … validate-graph/graph-commit
  refuses a commit that authors another boost or override at or above it, or that
  reduces it, unless the commit carries an explicit author override"). Rewrite it
  to guard the tier field: `strategy-main-health` holds `attributes.tier: 3`, the
  top tier; `validate-graph` refuses a commit that authors an explicit
  `attributes.tier: 3` on any other node, or that removes it from
  `strategy-main-health`, unless the node carries the `ACK: main-health-dominance`
  opt-out. Keep the parenthetical parsimony argument in spirit — the node is
  simply in the top tier, with no specialized rank treatment. Carry a dated
  amendment marker in the bullet text.
- **Expect the soft-freeze.** This bullet is inside `attributes.conditions`,
  which `strategyFingerprint` hashes, so every open tactic stamped against
  `strategy-graph-native-dispatch` re-surfaces as an `align-tactics`
  re-evaluation candidate. Designed behavior; do not try to suppress it.

**Landing these two node files.** Greenfield: they ride the same PR branch as the
code, so the flip and the tier code become live in one atomic merge and no window
exists where main-health is a tier-1 node with an unprotected boost.

Fallback if the fleet's concurrent `graph-commit` writes make those two files
conflict repeatedly (both are hot, and `strategy-graph-native-dispatch.md` is
very large): drop the two `intentions/` edits from the PR, merge the code alone,
then land both node edits **immediately** in one `graph-commit`. The exposure
window is real — between merge and that commit, `strategy-main-health` sits at
tier 1 with `boost: 100` and is outranked by every tier-2 `bug_fix` node — so
this path is only acceptable if the graph commit follows within the same session.
Never take the fallback by default.

**Explicitly out of scope**

- The **borderline marking worklist** in this node's body. Two of the ids it
  names — `tactic-fix-interrupt-orthogonal-state` and
  `tactic-phase-boot-offload-launcher` — **do not exist under `intentions/`**
  (no file, no prose reference outside this node); they were either never filed
  or since pruned. Do not go looking for them. The list, as recorded: bug_fix
  candidates `tactic-fix-interrupt-orthogonal-state`,
  `tactic-phase-boot-offload-launcher`,
  `tactic-noncodegen-session-model-defaults`,
  `tactic-reconcile-graph-mainqa-guard-prune`; security candidates
  `tactic-audit-routing-advisory-gate`, `tactic-mainqa-deploy-auth-diagnostics`).
  These are author judgment calls the 2026-07-18 round deliberately deferred. Do
  not mark them. Surface them at office hours after this lands.
- Pruning `intentions/tactic-attention-blocking-orthogonal.md`, now fully
  absorbed. That is a graph-lane operation
  (`packages/intentionsutil/scripts/graph-commit --prune <id>`), not a PR change.
  Note it as a post-merge follow-up.
- Converting any of the 44 existing boosts to tier/mark form. That is
  `intentions/tactic-attention-boost-scripts.md`'s Unit 3 (the tier-change
  script), gated on this tactic landing.

**Reuse**

- The existing ACK-substring convention and its message shape
  (`packages/intentionsutil/src/schema.ts:926`, `:932-939`).
- The `mainHealthNodes` test helper (`packages/intentionsutil/test/schema.test.ts:1541-1563`)
  — adapt it to build tier fixtures rather than writing a new one.
- `ownTier` from Unit 1 — the guard reads the *authored* `attributes.tier`
  directly (it must distinguish authored from derived), but `ownTier` is the right
  helper anywhere derived own-tier is needed.

---

## Verification

Run after every unit; all four must pass before the PR is opened.

```verify
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && npx vitest run --project packages/intentionsutil --root .
```

```verify
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && .claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app packages/intentionsutil
```

```verify
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && .claude/skills/dispatch-propagate/scripts/run-lint.sh
```

The next command is the one PR CI does **not** run for you (see Context —
`validate-graph` fires only on `intentions/`-only pushes). It validates the new
rules 19/20 and the rewritten rule 18 against the real 400+ node store. It must
pass before merge, and it is the check that would otherwise break the graph fast
path on the fleet's next graph push.

```verify
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
```

### Manual checks

**Selector ordering against the live store.** Run the pure selector over the real
graph and read the head of the candidate list:

```verify
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && node --import tsx/esm packages/intentionsutil/scripts/select-targets.ts
```

Inspect the JSON (pipe through `jq` directly — never `echo` a captured JSON
variable into `jq`, per `.claude/rules/shell-json.md`). Confirm by eye:

- Every candidate carries `tier` and `precedence`.
- The four live `attributes.bug_fix: true` nodes (`tactic-analytics-preinit-vitals`,
  `tactic-office-hours-snapshot-wire-contract`,
  `tactic-review-fix-residue-death-coverage`,
  `tactic-graph-review-exclusion-stall-recovery`) and the one
  `attributes.security: true` node (`tactic-prerender-single-injection-path`)
  resolve to `tier: 2` — where eligible; several are draft or in-flight, so a node
  legitimately absent from the candidate list is not a failure, only an absent
  data point.
- Those tier-2 nodes now sort ahead of every tier-1 node, including the
  boost-85/90/96 ones. Before this change they sorted below all of them. This is
  the headline behavior; if it does not hold, the change did not work.

**After the Unit 4 migration**, re-run the selector and confirm any eligible
node inheriting tier 3 from `strategy-main-health` outranks every tier-1 and
tier-2 candidate. If no red-main tactic is open (the common case — main is
usually green), this cannot be observed live. Do **not** fabricate a red-main
node in the store to test it; the equivalent is already covered by the Unit 2
unit tests. Record it as observed-in-production on the next red-main episode.

**Frontier render.** Run the projection and confirm tier markers appear only on
marked nodes and that unmarked lines are unchanged from before:

```verify
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && node --import tsx/esm packages/intentionsutil/scripts/frontier-view.ts
```

**Judgment call at review time.** Design decision (b) — inherited authored claims
sum across tier namespaces without filtering — is the resolution of a question
the 2026-07-21 clarification explicitly left open. Flag it in the PR body as an
author-reviewable decision, with the rival (filter to same-namespace sources) and
the reason for divergence, so the author can overturn it cheaply if they disagree.

## Author ruling 2026-07-31 — design decision (b): FILTER to same-tier-namespace

The office-hours park is cleared. Design decision (b) — whether authored
attention claims inherited down `parent`/`serves` edges from ancestors whose
boost was authored in a *different* tier namespace keep summing unfiltered, or
are filtered to same-tier-namespace sources before summing — is ruled by the
author as **(B): filter to same-tier-namespace sources.**

**Philosophy on record: tier is an isolation boundary.** Authored authority does
not flow across a tier namespace; tier does not merely order within a shared
global pool of authored claims. Any future question about cross-tier attention
flow resolves against this statement.

**Why B rather than ratifying the shipped A.** Both were measured safe — QA found
zero tier-inversions across 186 real candidates, and structurally none is
possible, since tier inherits down the same edges and is max-based, so a
receiver's effective tier is always at least every source's and a tier-1-scale
number can only reorder nodes already inside the same higher tier. The residual
risk under A is intra-tier miscalibration, not tier inversion. So this is a
consistency call, not a risk call, and consistency points at B:

- The pathology that motivated this node in the first place was an **authored
  term summing over distinct sources** — the fingerprint-custody cluster
  compounding at a `blocked_by` sink, which together with a large authored boost
  produced the attention saturation that stalled the pipeline.
- This node already converts blocking lift from **sum to max** for exactly that
  reason. Leaving `parent`/`serves` inheritance summing unfiltered would keep one
  unfiltered summation path alive inside the very change that exists to remove
  them, and would leave the door open to the same compounding reappearing along a
  different edge set.
- An isolation boundary is also the cheaper invariant to reason about later: it
  can be stated in one sentence and checked locally, whereas "authored authority
  flows globally, tier only orders" requires simulating the whole graph to
  predict any single node's rank.

**Implementation.** One place to edit, in the compose step of `resolveAttention`
— the sum loop at `packages/intentionsutil/src/attention.ts:507-511`. Filter
contributing authored claims to same-tier-namespace sources before summing.

**This is a code change, so the park clearing routes the node back through the
fix lane, not straight to review.** Re-QA must re-run the tier-inversion sweep
over the live store and confirm it still reports zero, and must additionally
confirm that at least one node whose rank changes under B changes in the
predicted direction — a re-run that reports "no change anywhere" would mean the
filter is not actually engaging.

## needs-main residue

QA pass (attempt 2, PR #2997) triaged one item as `needs-human-judgment` with a
`planned-deferral` flag; the Step 3.5 disposition Workflow routed it to class
`needs-main` (a planned deferral is non-assertable at merge time by definition,
so it is not opus-fixable now and is deferred to post-merge verification rather
than an immediate office-hours escalation).

- **id**: 11
- **title**: strategy-graph-native-dispatch soft-freeze of open child tactics is the intended blast radius, not an accident
- **url_path**: current
- **expected_outcome**: A human confirms the soft-freeze scope (the open child tactics of `strategy-graph-native-dispatch` that re-surface for `align-tactics` re-evaluation due to this tactic's amended `attributes.conditions` bullet) is proportionate and intended, not an accidental over-broad blast radius.
- **finding**: Design/scope judgment call, not machine-verifiable: amending the strategy's `attributes.conditions` bullet intentionally changes its substance fingerprint (`strategyFingerprint` hashes `attributes.conditions`) and soft-freezes every open child tactic serving `strategy-graph-native-dispatch` for `align-tactics` re-evaluation. This PR's body asserts the freeze is designed/intended behavior (a necessary consequence of any condition edit), but which and how many tactics get swept in, and whether that fleet cost is proportionate, is an author judgment call to make once the freeze is observable post-merge, not something a script can decide at QA time.
