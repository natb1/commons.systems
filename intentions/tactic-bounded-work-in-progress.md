---
id: tactic-bounded-work-in-progress
kind: tactic
statement: The selector orders candidates by (tier, rank) with the
  closest-to-done progression ordinal only as a tie-break, so it systematically
  prefers STARTING new work to FINISHING in-flight work — work-in-progress is
  unbounded (measured 123 in-flight tactics against a 3-worker fleet), and
  in-flight PRs age until they no longer merge
owner: ai
status: codified
parent: null
rationale: "Measured live 2026-08-03. THE DEFECT: selectGraphTargets' comparator
  (router.ts, the Order block) sorts candidates by precedence.tier desc, then
  precedence.rank desc, then progressionIndex desc, then id asc. The progression
  ordinal — the 'drain closest-to-done first' bias, whose own doc comment states
  that intent — is the THIRD key, so it orders only WITHIN an exact rank tie and
  never overrides an authored rank difference. This ordering is the one
  tactic-attention-tier-ranking Unit 2 ratified, so amending it is a deliberate
  design change, not a bug fix. MEASURED CONSEQUENCE: of the current top 10
  candidates, only 3 are in-flight (a phase past align-tactics) — the other 7
  are drafts awaiting decomposition, promoted above in-flight work purely by
  authored boost (25.33 and 20.00 vs the 5.33 baseline that most in-flight nodes
  carry). Meanwhile 123 tactics are in flight (implement 74, main-qa 26, qa 18,
  review 5; 33 of them parked) against a fleet of 3 workers — 41 started nodes
  per worker slot. THE HARM: an open PR is a claim on a decaying resource, its
  mergeability against main. main advanced 103 commits in the 48h before this
  was written. A node that is selectable but ranks below the per-tick top-N is
  never provisioned, so its PR rots; and because provision-node-worktree exit 11
  at selection time is the ONLY conflict detector in the graph-native lane, the
  rot is also never observed. Measured 2026-08-03: 15 of 31 open PRs are
  mergeable CONFLICTING, the oldest opened 2026-07-11 — 13 of the 15 predate any
  recent worker-cap deviation, so throttling did not cause them; unbounded WIP
  plus rank-dominated ordering did. Six of the 15 are unparked AND unblocked —
  genuinely selectable for weeks at queue positions 14, 24, 25, 29, 30 and 41,
  never reached. GREENFIELD (recommended): bound WIP in the selector. When the
  count of in-flight tactics is at or above a configured limit, restrict the
  candidate set to in-flight nodes; below the limit, behave exactly as today.
  This names the actual defect (unbounded starting) rather than a symptom,
  preserves the ratified (tier, rank) ordering and the meaning of authored
  boosts in the normal case, and gives one operator dial of the same shape as
  max_concurrent_workers. It MUST fail open: if the restricted set is empty
  (every in-flight node parked or blocked) the selector falls through to normal
  selection, or the fleet deadlocks at the limit with nothing selectable — the
  failure mode this node exists to prevent. ALTERNATIVE (simpler, no new state):
  swap the comparator's second and third keys to (tier, progression, rank, id),
  draining closest-to-done first within a tier. Simulated 2026-08-03 over the
  live store: in-flight share of the top 10 goes 3/10 to 10/10, and the six
  stalled conflicting nodes move from positions 14/24/25/29/30/41 to
  9/5/6/12/13/30. Its cost is that it silently defeats authored boosts on draft
  work until the in-flight backlog drains — with 123 in flight that is a long
  freeze on decomposition — so it needs an author decision, not a quiet landing.
  Under either design, tier remains the preemption escape hatch: genuinely
  urgent new work takes tier 2 and still outranks the in-flight tier-1 set. This
  composes with tactic-graph-router-conflict-routing rather than duplicating it:
  that node routes a conflict once detected, while this one bounds how many
  undetected conflicts can accumulate. Distinct from tactic-pending-merge-phase,
  which changes what the phase ladder contains, not how candidates are ordered."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Design ruling — bound WIP in the selector or swap the comparator keys,
      and does Ruling 17's hold (decide only once the fleet runs at cap) still
      stand?
    answer: "(Ruled 2026-08-04 /align interview, superseding Ruling 17's hold.) The
      WIP bound is ADOPTED: when the count of in-flight tactics is at or above a
      configured limit, the selector restricts the candidate set to in-flight
      nodes; below the limit, behavior is unchanged. Edge-case resolutions
      ratified with it: FAIL OPEN when the restricted set is empty (every
      in-flight node parked or blocked) — fall through to normal selection,
      never deadlock at the limit; tier-2 candidates BYPASS the bound (tier
      remains the preemption escape hatch); parked in-flight nodes count toward
      the WIP number but stay unselectable (each is a live claim on decaying
      mergeability); the pace-exempt lane draws from the restricted set. The
      comparator swap (tier, progression, rank, id) is REJECTED: it permanently
      changes every ranking decision and silently defeats authored boosts on
      draft work until the backlog drains. Ruling 17's re-measure (CONFLICTING
      trend once the fleet demonstrably runs at cap) becomes this node's
      post-landing VERIFICATION, not a decision precondition. blocked_by records
      the mechanical WAIT: the /align-tactics tactic-mode finalize is blocked by
      the workflow drift-gate defect, whose fix is
      tactic-align-tactics-tactic-mode-drift-gate (PR #2982, phase review). Park
      cleared on this ruling."
  - question: What operator-configured limit and default does the adopted WIP bound
      use, and does the plan need a new author decision to pick a number?
    answer: "(Recorded 2026-08-09 /align-tactics tactic-mode finalize.) The
      2026-08-04 ruling adopts \"a configured limit\" without naming a number,
      and none is needed to author the plan: the ruling's own framing — \"one
      operator dial of the same shape as max_concurrent_workers\" — ratifies the
      established ceiling shape, so the plan carries a default baked in code and
      overridden through dispatch-config-load, mirroring dispatch-target-workers
      (MAX_WORKERS default in code, exposed via a dedicated --max query mode)
      and dispatch.config/census.json's single integer `threshold`. The ceiling
      number is config; the in-flight count itself is computed live from the
      graph — isOpenTactic (packages/intentionsutil/src/router.ts:151-155, phase
      set, neither draft nor done) tallied over the full tactic list BEFORE the
      office_hours candidacy filters, so parked in-flight nodes count toward the
      number while staying unselectable, as ratified — and is never stored.
      Landing-day consequence, recorded so it is not a surprise: with 123
      tactics in flight, any operator-sane default puts the fleet into
      restricted mode on the first tick after landing, so starting-work
      candidates stop being selectable until the backlog drains below the limit.
      That is the ruling's intent, and the ratified fail-open (empty restricted
      set falls through to normal selection) and tier-2 bypass are the valves
      that keep it from deadlocking or from blocking genuinely urgent new work.
      Retuning the number afterward is a config edit, not a re-plan."
  - question: How fresh is the measurement evidence backing this ruling as of the
      finalize sitting, and does staleness gate the plan?
    answer: "(Recorded 2026-08-09 /align-tactics tactic-mode finalize.) Measurement
      freshness for this node's evidence: the argument rests on 2026-08-03 (123
      in flight against a 3-worker fleet; 15 of 31 open PRs CONFLICTING) and
      2026-08-05 (33 open PRs, 10 CONFLICTING / 23 MERGEABLE). Re-checked at
      finalize time: 30 open PRs, directionally consistent with a draining
      backlog, but the per-PR mergeable split was not force-recomputed — the
      bulk mergeable query returns most PRs UNKNOWN, a FAILED READ that must
      never be mistaken for \"clean\". This does not gate the plan: the
      2026-08-04 ruling already made the CONFLICTING-trend re-measure this
      node's post-landing verification rather than a decision precondition. It
      does constrain the verification section, which must force per-PR mergeable
      computation rather than trusting the bulk query or an open-PR count
      alone."
  - question: What is the fleet-visible reach of "restrict the candidate set to
      in-flight nodes" — does it suppress only draft-tactic finalizes, or also
      fresh /align-tactics strategy rounds and frozen-tactic re-evaluation?
    answer: '(Recorded 2026-08-09 /align-tactics tactic-mode finalize.) Reach of the
      adopted restriction, checked against the code: selectGraphTargets emits
      exactly two candidate kinds (packages/intentionsutil/src/router.ts:24),
      and all three sites that emit at the align-tactics directive rung — draft
      tactic (:577), frozen-tactic re-evaluation (:590), and fresh strategy
      round (:609) — are by construction not in-flight. So "restrict the
      candidate set to in-flight nodes" suppresses new /align-tactics strategy
      rounds as well as draft-tactic finalizes while the fleet sits at or above
      the limit. That is the intended "stop starting" effect (a new round mints
      new work-in-progress), not a scope overreach; tier-2 candidates still
      bypass the bound and the empty-set fail-open still applies. The
      restriction is a filter over the existing candidate list feeding the
      single canonical comparator (router.ts:673-682) — never a second competing
      sort.'
tooling_goals: []
success_signal: null
attention:
  boost: 0.03
  override: null
  rationale: >-
    Author-directed 2026-08-03: prioritize bug-ledger fixes directly BELOW the
    token-efficiency cluster. Boost 12 resolves to 17.33 because an inbound
    distributor adds 5.33 — under that cluster's 20.00 and above the 5.33
    undecomposed baseline. Simulated over the live store before writing: 0 tier
    changes, 0 value drift onto non-target nodes.


    NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 12 to 0.03 so this
    boost can no longer lift the node out of its parent strategy's band. The
    bound - a tactic boost is namespaced to its strategy's rank and must never
    cause the tactic to outrank a tactic of a higher-ranked strategy - is
    recorded doctrine on strategy-recursive-self-improvement but is NOT yet
    enforced by the resolver; tactic-attention-namespaced-rank makes it
    structural. Until then the flat additive sum defeats it, so the magnitudes
    are compressed by hand onto a 0.01-per-level ladder that preserves the
    original ordering WITHIN the band. Original magnitude preserved at
    attributes.pre_namespacing_boost for restoration.
  tier: 1
phase: qa
execution:
  branch: tactic-bounded-work-in-progress
  pr: 3057
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
validates: []
blocked_by:
  - tactic-hold-residue-bounded-work-in-progress
office_hours: null
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 12
---
# The selector orders candidates by (tier, rank) with the closest-to-done progression ordinal only as a tie-break, so it systematically prefers STARTING new work to FINISHING in-flight work — work-in-progress is unbounded (measured 123 in-flight tactics against a 3-worker fleet), and in-flight PRs age until they no longer merge

## Context

**The defect (measured live 2026-08-03).** `selectGraphTargets`
(`packages/intentionsutil/src/router.ts:464`) builds its candidate list and
sorts it in the Order block (`router.ts:673-682`) by
`precedence.tier` desc → `precedence.rank` desc → `progressionIndex` desc →
`id` asc. The progression ordinal — the "drain closest-to-done first" bias,
whose own doc comment at `router.ts:390-403` states that intent — is the THIRD
key, so it orders only WITHIN an exact rank tie and never overrides an authored
rank difference. This ordering is the one `tactic-attention-tier-ranking` Unit 2
ratified, so amending it is a deliberate design change, not a bug fix.

**Measured consequence.** Of the then-current top 10 candidates only 3 were
in-flight (a phase past `align-tactics`); the other 7 were drafts awaiting
decomposition, promoted above in-flight work purely by authored boost (25.33 and
20.00 against the 5.33 baseline most in-flight nodes carry). Meanwhile 123
tactics were in flight (implement 74, main-qa 26, qa 18, review 5; 33 of them
parked) against a fleet of 3 workers — 41 started nodes per worker slot.

**The harm.** An open PR is a claim on a decaying resource: its mergeability
against main. main advanced 103 commits in the 48h before this was written. A
node that is selectable but ranks below the per-tick top-N is never provisioned,
so its PR rots; and because `provision-node-worktree` exit 11 at selection time
is the ONLY conflict detector in the graph-native lane, the rot is also never
observed. Measured 2026-08-03: 15 of 31 open PRs were CONFLICTING, the oldest
opened 2026-07-11 — 13 of the 15 predate any recent worker-cap deviation, so
throttling did not cause them; unbounded WIP plus rank-dominated ordering did.
Six of the 15 were unparked AND unblocked — genuinely selectable for weeks at
queue positions 14, 24, 25, 29, 30 and 41, never reached. The 2026-08-05 /align
sitting re-measured by FORCING per-PR computation (the bulk `mergeable` query
returned 31 of 33 UNKNOWN — a FAILED READ that must never be read as "clean"):
33 open, 10 CONFLICTING, 23 MERGEABLE.

**Design ruling (2026-08-04 /align interview, superseding the prior hold).** The
WIP bound is ADOPTED: when the count of in-flight tactics is at or above a
configured limit, the selector restricts the candidate set to in-flight nodes;
below the limit, behavior is unchanged. Edge cases ratified with it:

- FAIL OPEN when the restricted set is empty (every in-flight node parked or
  blocked) — fall through to normal selection, never deadlock at the limit.
  Without this the fleet deadlocks at the limit with nothing selectable, the
  exact failure mode this node exists to prevent.
- Tier-2 candidates BYPASS the bound — tier remains the preemption escape hatch;
  genuinely urgent new work takes tier 2 and still outranks the in-flight tier-1
  set.
- Parked in-flight nodes COUNT toward the WIP number but stay unselectable (each
  is a live claim on decaying mergeability).
- The pace-exempt lane draws from the restricted set.

**The comparator swap is REJECTED** — swapping the second and third sort keys to
`(tier, progression, rank, id)` was simulated 2026-08-03 over the live store
(in-flight share of the top 10 goes 3/10 → 10/10; the six stalled conflicting
nodes move from positions 14/24/25/29/30/41 to 9/5/6/12/13/30), but it
permanently changes every ranking decision and silently defeats authored boosts
on draft work until the backlog drains. Do not implement it, and do not
re-derive it as a "simpler alternative" mid-implementation: it was decided
against on the record.

**Boundaries against siblings.** This composes with
`tactic-graph-router-conflict-routing` (phase done) rather than duplicating it:
that node routes a conflict once detected; this one bounds how many undetected
conflicts can accumulate. It is distinct from `tactic-pending-merge-phase`,
which changes what the phase ladder contains, not how candidates are ordered.
The `blocked_by` WAIT this node previously recorded is discharged:
`tactic-align-tactics-tactic-mode-drift-gate` landed (PR #2982) and the
2026-08-05 /align interview removed this node's main-qa gate edge (commit
425ffe7e). `blocked_by` is empty; nothing gates this work.

**Where the bound lives, and why.** In the PURE selector, not in the bash
wrapper. `router.ts` is the single canonical ordering site (its doc comment at
`router.ts:451-462` is the ordering spec of record) and it is the offline-
testable layer the strategy's condition 5 requires. Implementing it in
`graph-select-target` would duplicate candidate classification in bash and would
NOT automatically give the ruling's "pace-exempt lane draws from the restricted
set" property — that property falls out for free when the restriction is applied
to the candidate list the wrapper's `--pace-exempt-only` filter
(`graph-select-target:1111`) already reads. The LIMIT is environmental and stays
in the shell layer, exactly like `MAX_WORKERS` lives in `dispatch-target-workers`
and not in the router.

**Intentionally lands unset (observability before enforcement).** `dispatch.config/`
is operator-local and not tracked in git, so no committed file can turn the bound
on; the effective policy would be whatever default the code bakes in. Baking a
binding number here would be exactly the "quiet landing" of an author decision
that the ruling rejected the comparator swap for — with in-flight far above any
plausible limit, ANY binding value halts every `align-tactics` session
(strategy rounds and draft decomposition alike, including this machinery's own
decomposition lane) until the backlog drains below it, with tier 2 as the only
escape hatch. So: the limit defaults to UNSET (behavior byte-identical to today),
every selection reports the live in-flight count in its stderr line and its
selection-log record from the first tick, and turning the bound on is one
`dispatch.config/wip.json` line the author writes. The post-landing re-measure
the ruling ratified as this node's verification is what decides the number.

## Units of work

### Unit 1 — The WIP bound in the pure selector (`router.ts`) + tests

**Recommended model: opus** — this is the load-bearing design surface: a new
ordering/eligibility axis composed with `tier`/`rank` without mutating them, with
three ratified edge cases (fail-open, tier bypass, parked-counts-but-unselectable)
whose interaction is the whole point of the unit.

**Scope.** `packages/intentionsutil/src/router.ts` and
`packages/intentionsutil/test/router.test.ts` only. No script, config, or doc
changes in this unit.

1. **New exported types**, next to the existing wire-format interfaces
   (`GraphCandidate` at `router.ts:22-71`, `SelectionEvent` at `:75`,
   `GraphSelection` at `:87-96`):

   ```ts
   /** Caller-supplied environmental options. Config lives in the shell layer. */
   export interface SelectionOptions {
     /**
      * The work-in-progress ceiling: at or above this many in-flight tactics,
      * restrict the candidate set to in-flight nodes. `null`/absent = unbounded
      * (today's behavior, byte-identical output apart from the `wip` block).
      */
     wipLimit?: number | null;
   }

   /** What the WIP bound did on this pass — always present, never optional. */
   export interface WipBound {
     /** In-flight tactics over the FULL node array: `isOpenTactic`, parked and blocked included. */
     in_flight: number;
     /** The limit in force, or null when unbounded. */
     limit: number | null;
     /** True iff the restriction actually applied to the emitted candidate list. */
     restricted: boolean;
     /** Candidates admitted past the bound by the tier-2 escape hatch (0 unless restricted). */
     bypassed: number;
     /** True iff at/above the limit but the restricted set was EMPTY, so normal selection was used. */
     failed_open: boolean;
   }
   ```

   Add `wip: WipBound;` to `GraphSelection` (`router.ts:87-96`). It is the wire
   format `scripts/select-targets.ts` serializes verbatim and
   `graph-select-target` parses; a new field is additive for every existing
   consumer (`read-sensors.ts:614-622` reads only `record.selected` from the
   selection log).

2. **Signature.** `export function selectGraphTargets(nodes: IntentionNode[],
   options: SelectionOptions = {}): GraphSelection` (`router.ts:464`). Validate
   at this public boundary and throw a descriptive `Error` on a bad limit —
   `wipLimit` must be `null`/absent or a non-negative integer (`Number.isInteger`,
   `>= 0`). This is a caller-argument defect, not a store defect: the cycle
   guard's degrade-don't-throw posture (`router.ts:295-310`) applies to malformed
   STORE data reaching the fleet's read path and must NOT be copied here.

3. **The in-flight count.** Tally `tactics.filter(isOpenTactic).length` over
   `tactics` (`router.ts:482`, the full `kind === "tactic"` array) — BEFORE and
   independent of the candidacy loops. Reuse the module-private `isOpenTactic`
   (`router.ts:151-155`) directly; do not invent a second open/closed test and do
   not export it. It already ignores `office_hours` and `blocked_by`, which is
   precisely the ruling's "parked in-flight nodes count toward the WIP number but
   stay unselectable" — the two `if (t.office_hours !== null) continue;` gates
   (`router.ts:524` and `:569`) stay exactly as they are for CANDIDACY.

4. **The restriction**, applied to `candidates` after all three emission loops
   and BEFORE the sort (`router.ts:673-682`; filtering cannot change relative
   order, so filter-then-sort is equivalent and reads better):

   - Unbounded (`wipLimit == null`) or `in_flight < wipLimit` → no restriction;
     emit `{in_flight, limit, restricted: false, bypassed: 0, failed_open: false}`.
   - Otherwise build `restricted = candidates.filter(c => isInFlightCandidate(c)
     || c.precedence.tier >= 2)`, where **`isInFlightCandidate(c)` is
     node-keyed, not rung-keyed**: `c.kind === "tactic" && !isDraft(byId.get(c.id)!)`.
     This is load-bearing. A frozen-tactic re-evaluation candidate
     (`kind: "tactic"`, `phase: "align-tactics"`, `reevaluation: true`,
     `router.ts:588-599`) is emitted for a node that IS in flight and whose
     normal phase skill is suppressed — re-evaluation is its ONLY path forward,
     so excluding it would strand an in-flight node that can never drain, the
     very harm this node exists to prevent. A draft-tactic candidate
     (`router.ts:574-586`) and a strategy candidate (`router.ts:606-617`) are
     "start new work" and are what the bound withholds.
   - Tier bypass reads `c.precedence.tier` (the LIFTED pair the candidate
     actually sorts at, `router.ts:44-56`), not `c.tier`. A draft that blocks a
     tier-2 node is lifted to tier 2 by `effectivePrecedence`
     (`router.ts:263-380`) and must get through — it is holding up the urgent
     work the escape hatch exists for. Count the admitted non-in-flight
     candidates into `bypassed`.
   - **Fail open:** if `restricted.length === 0`, keep the UNRESTRICTED list and
     emit `failed_open: true, restricted: false`. Never emit an empty list on
     account of the bound.

5. **Do not touch the comparator.** The four sort keys stay
   `(precedence.tier, precedence.rank, progressionIndex, id)` exactly as they are
   — the swap is on the record as rejected.

6. **Doc comments.** Extend the `selectGraphTargets` doc block's Order paragraph
   (`router.ts:451-462`) with the bound: what counts toward `in_flight`, the
   node-keyed restricted-set membership rule, the tier bypass on the lifted pair,
   and the fail-open rule. Add an explicit note at
   `strategyAlignSelectable` (`router.ts:706`), `resolveFrozenDescendant`
   (`router.ts:727`) and `frozenTacticSelectable` (`router.ts:756`) that they
   call `selectGraphTargets(nodes)` UNBOUNDED **by design** and must stay that
   way: the bound is a start throttle applied once at selection, never an
   eligibility gate — re-validating a node at worker start
   (`packages/intentionsutil/scripts/check-node-selection.ts`, which imports
   these helpers at `:45-51`) under a bound that flipped on since selection would
   exit-12 an already-claimed, already-launched worker.

**Tests** — extend `packages/intentionsutil/test/router.test.ts` with a new
`describe("wip bound", ...)` placed after the existing `describe("ordering")`
(`router.test.ts:889`). Reuse the fixture builders already in that file:
`tactic()` / `strategy()` (`:44-56`), `exec()` (`:58+`), `kinds()` (`:75`),
`candidateIds()` (`:82`); the parked-node fixture shape
(`office_hours: { reason, since, recommendation: null, session_type: "other" }`)
is at `:36` and used by the existing "skips a parked tactic" cases
(`:98-106`, `:577-604`, `:753-761`). Cases to cover:

- unbounded (no options) → `wip.limit` null, `wip.restricted` false, candidate
  list identical to today's;
- `in_flight < limit` → unrestricted, `wip.in_flight` correct;
- `in_flight >= limit` → draft-tactic and strategy `align-tactics` candidates
  dropped; in-flight phase candidates kept, in unchanged relative order;
- a frozen-tactic re-evaluation candidate (stale `execution.strategy_fingerprint`
  against its serving strategy, per the existing soft-freeze fixtures near
  `:880`) SURVIVES the restriction;
- a PARKED in-flight tactic counts toward `wip.in_flight` while remaining absent
  from `.candidates` (assert both halves);
- a blocked in-flight tactic likewise counts but is not a candidate;
- tier-2 draft bypasses; a tier-1 draft LIFTED to `precedence.tier` 2 by blocking
  a tier-2 node also bypasses, and `wip.bypassed` counts them;
- fail-open: at/above the limit with every in-flight node parked or blocked and
  no tier-2 candidate → the full unrestricted list is emitted with
  `failed_open: true`;
- `selectGraphTargets(nodes, { wipLimit: -1 })` and `{ wipLimit: 1.5 }` throw.

### Unit 2 — `--wip-limit` on `select-targets.ts`

**Recommended model: sonnet** — one flag in an existing strict argument loop,
following the in-file `--dir` precedent exactly.

**Dependencies:** Unit 1.

**Scope.** `packages/intentionsutil/scripts/select-targets.ts` only.

Add `--wip-limit <n>` to the `main()` argument loop
(`select-targets.ts:45-60`), mirroring `--dir`'s shape: missing value → throw
`select-targets: --wip-limit requires a non-negative integer argument`; a value
failing `/^\d+$/` → throw naming the bad value (reject `1.5`, `1e6`, `-1`,
`abc` — the same plain-integer contract `dispatch-config-load` enforces at
`dispatch-config-load:740-762`). Pass it through as
`selectGraphTargets(listNodesStrict(intentionsDir), { wipLimit })`, with
`wipLimit` staying `null` when the flag is absent. Keep the unknown-argument
throw as-is. Update the header usage block (`select-targets.ts:12`) and add a
sentence explaining that the limit is environmental config resolved by the shell
wrapper — the script itself never reads `dispatch.config/`, which is what keeps
`packages/intentionsutil` separable (`packages/intentionsutil/SEPARABILITY.md:62-67`
names this script's `--dir` flag as the pattern of record).

### Unit 3 — `wip` config type in `dispatch-config-load` + example + tests

**Recommended model: sonnet** — additive schema case following the `census`
block verbatim.

**Scope.** `.claude/skills/dispatch-propagate/scripts/dispatch-config-load`, a
new `.claude/skills/dispatch-propagate/scripts/wip.example.json`, and
`.claude/skills/dispatch-propagate/scripts/test-dispatch-config-load.sh`.

1. Add `wip` to the accepted-type list in the usage comment
   (`dispatch-config-load:10`), the `case` guard (`:326`) and the usage error
   (`:328`). No filename wiring is needed — `CONFIG_FILE="$CONFIG_DIR/${CONFIG_TYPE}.json"`
   (`:349`) resolves `wip` → `dispatch.config/wip.json` automatically.
2. Add a `# ---- Schema: wip.json ----` doc block modeled on the census block
   (`:297-316`), documenting one optional tunable:
   `limit` — number, non-negative integer — the in-flight-tactic count at or
   above which the selector restricts the candidate set to in-flight nodes.
   State the doctrine split explicitly, as census does: **the ceiling is config;
   the in-flight count itself is computed live from the graph and is never
   stored**. State that absence means the bound is OFF (graph-select-target runs
   unbounded), which is a deliberate divergence from census's
   absent→baked-active-default: the correct WIP number is an operator judgment
   against live fleet state, and a binding default would silently freeze all
   `align-tactics` work on landing.
3. Add the validation `case "wip")` next to `census)` (`:740-762`), copying its
   jq validator with `threshold` → `limit`: top-level must be an object;
   `limit` optional; if present must be a number, `>= 0`, and render as a plain
   integer (`tostring | test("^[0-9]+$")`) so fractions and scientific notation
   are rejected before they reach the bash/TS integer paths.
4. `wip.example.json`: `{ "limit": 24 }`, matching `census.example.json`'s
   one-key shape. This is an EXAMPLE, not a default — 24 is illustrative (three
   in-flight nodes per slot at the `max_concurrent_workers` default of 8), and
   the file lives beside the script, never in `dispatch.config/`.
5. Tests: append a `wip` block to `test-dispatch-config-load.sh` (1310 lines
   today) using the `selection-lock` block at `:1217-1300` as the template —
   absent → `no-config`/exit 0; `{}` → valid, normalizes to `{}`; integer `limit`
   round-trips; fractional → exit 1 naming the field; negative → exit 1; string →
   exit 1; non-object top level → exit 1 mentioning object. Reuse the file's
   existing `config_setup`/`config_teardown`/`assert_eq` helpers.

### Unit 4 — Wire the limit through `graph-select-target` + selection log + shell test

**Recommended model: sonnet** — rote wiring that copies two in-repo precedents
(`dispatch-graph-census`'s config read, the existing `_selection_log_emit` jq
record); every posture decision is settled below.

**Dependencies:** Units 2 and 3.

**Scope.** `.claude/skills/dispatch-propagate/scripts/graph-select-target` and
`.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh`.

1. **Read the config**, inserted just above the pure-selector invocation
   (`graph-select-target:482-486`). Copy the posture of
   `dispatch-graph-census:55-70` verbatim, including its comment about not
   swallowing the diagnostic:

   ```bash
   WIP_LIMIT=""
   if CFG=$("$SCRIPT_DIR/dispatch-config-load" wip 2>&1); then
     if [[ "$CFG" != "no-config" ]]; then
       v=$(jq -r '.limit // empty' <<<"$CFG")
       [[ -n "$v" ]] && WIP_LIMIT="$v"
     fi
   else
     echo "graph-select-target: wip config load failed, running unbounded: $CFG" >&2
   fi
   ```

   (`jq -r ... <<<` here-string, never `echo "$CFG" | jq` — `.claude/rules/shell-json.md`.)

   **Failure posture: an unreadable or invalid config runs UNBOUNDED with a loud
   stderr line.** This deliberately diverges from the fail-closed ceiling posture
   of the just-landed `tactic-pace-exempt-ceiling-fanout`
   (`dispatch-select-tick:636-793`, where a non-numeric ceiling closes the lane).
   The asymmetry is the failure mode: a mis-set worker ceiling that fails open
   overspends tokens, while a mis-set WIP ceiling that fails closed freezes all
   new work fleet-wide on a typo. Unbounded is exactly today's behavior, so a
   config error can never make things worse than not landing this node. Do not
   "fix" this to fail closed. Guard `WIP_LIMIT` with `[[ "$WIP_LIMIT" =~ ^[0-9]+$ ]]`
   before use and drop it (with a stderr line) if it is not a plain integer, so a
   garbage value can never reach `select-targets.ts` under `set -u`.

2. **Pass it**, at `graph-select-target:484`: append `--wip-limit "$WIP_LIMIT"`
   when `WIP_LIMIT` is a non-empty integer AND `MODE != "node"`.
   **`--node <id>` bypasses the bound** — that lane already "bypass[es] rank
   order" for an explicitly named node (`graph-select-target:~149`), and a human
   or operator naming one node is not "starting unbounded new work". Every
   width-based lane honors the bound: `--top` (the tick's normal fan-out,
   `dispatch-select-tick:1052`), `--standalone`, and `--pace-exempt-only`
   (`graph-select-target:1111`) — the last is the ruling's "pace-exempt lane
   draws from the restricted set", which needs no code because the restriction
   already happened in the pure layer.

3. **Report it.** Capture `WIP_JSON=$(jq -c '.wip' <<<"$SELECTION")` (default
   `null` on failure, like the neighboring `EVENTS_JSON` at `:488`), echo a
   one-line human summary to stderr on every invocation
   (`graph-select-target: wip in_flight=<n> limit=<n|unset> restricted=<bool> bypassed=<n> failed_open=<bool>`),
   and add `--argjson wip "$WIP_JSON"` plus a `wip: $wip` key to the
   `_selection_log_emit` record (`graph-select-target:274-287`). That log is the
   per-invocation JSONL the lifecycle sensor reads
   (`packages/intentionsutil/scripts/read-sensors.ts:456-465,614-622`, which
   touches only `record.selected` — the new key is additive), and it is the
   durable time series the post-landing re-measure needs. The stderr line fires
   even when the bound is unset, so the in-flight count is observable from the
   first tick with no config written.

4. **Header docs.** Extend the usage/flag block (`graph-select-target:85-160`)
   with a short WIP-bound paragraph: where the limit comes from
   (`dispatch.config/wip.json` via `dispatch-config-load wip`), that absent
   config means unbounded, that `--node` bypasses while `--top`/`--standalone`/
   `--pace-exempt-only` honor it, and that the restriction itself is computed in
   `select-targets.ts` — this script only supplies the number.

5. **Test** — append a case to
   `.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh`
   (1227 lines today) using the existing hermetic fixture at `:32-60`: the fake
   `npx` on PATH that intercepts `npx tsx …/select-targets.ts …`. Have the stub
   append its own `"$@"` to a file, then assert (a) with
   `$DISPATCH_CONFIG_DIR/wip.json` = `{"limit":5}` a normal `--top 1` run passes
   `--wip-limit 5`; (b) a `--node <id>` run does NOT pass the flag; (c) with no
   `wip.json` no flag is passed. Keep the stub's emitted JSON shape in sync with
   the new wire format by adding a `"wip"` block to it (the existing stub emits
   `{"candidates":[…],"events":[]}` at `:41-49`), so the log/stderr path is
   exercised rather than silently `null`.

### Unit 5 — Amend the selection spec (§3.2) to describe the bound

**Recommended model: sonnet** — prose amendment to one numbered spec list.

**Dependencies:** Unit 1.

**Scope.** `intentions/tactic-graph-native-dispatch.md` §3.2 "Selection"
(`:390-407`) only — the spec block `router.ts:17-18` names as the ordering
contract of record. Add a step after the progression-ordinal step (currently
step 4, ending "Topic categories retire…"): the WIP bound, stated as
count-in-flight → restrict-to-in-flight → tier-2 bypass → fail-open-when-empty,
with the limit named as operator config (`dispatch.config/wip.json`) that is
absent by default, and the explicit note that the alternative comparator swap
`(tier, progression, rank, id)` was considered and rejected on 2026-08-04.

**Caveats for the implementer.** Edit ONLY the §3.2 prose in that file's body —
never its YAML frontmatter, and never any other node file. The graph machinery
writes node frontmatter on `main` out of band, so if `origin/main` has moved that
file, merge `origin/main` into the branch and re-apply the prose edit; never
resolve such a conflict by overwriting the file wholesale. `tactic-graph-native-dispatch`
is a phase-null subtree parent, so frontmatter churn on it is rare, but the
hazard is real and the recovery is "re-merge and re-apply", not "force".

## Reuse

- `packages/intentionsutil/src/router.ts:151-155` — `isOpenTactic`, the exact
  in-flight predicate (phase set, neither draft nor done). It IS the WIP
  membership test; count with it, do not write a second classification. It stays
  module-private — the count lives in-file.
- `packages/intentionsutil/src/router.ts:147-149` — `isDraft`, the draft test the
  restricted-set membership rule negates.
- `packages/intentionsutil/src/router.ts:482` — `const tactics = nodes.filter(...)`,
  the full tactic array the count must be tallied over (before the office_hours /
  blocked filters at `:524` and `:569`).
- `packages/intentionsutil/src/router.ts:22-71` — `GraphCandidate`; `tier`,
  `precedence`, `phase`, `kind`, `pace_exempt` and `reevaluation` are already
  first-class fields, so both bound exceptions need NO new per-candidate field.
- `packages/intentionsutil/src/router.ts:263-380` — `effectivePrecedence` /
  `maxPrecedence`: the established pattern for composing a new axis with
  tier/rank (separate computed map keyed by id, node's own reported values
  untouched, composition documented in the same style). The tier-2 bypass reads
  the pair this produces.
- `packages/intentionsutil/src/router.ts:673-682` — the single canonical
  comparator. The restriction filters the list feeding it; no second sort is
  added anywhere.
- `packages/intentionsutil/src/router.ts:87-96` — `GraphSelection`, the wire
  struct `select-targets.ts` serializes and `graph-select-target` parses; extend
  it rather than opening a parallel output channel.
- `packages/intentionsutil/scripts/select-targets.ts:45-60` — the strict
  argument loop and its `--dir` flag; `--wip-limit` copies its shape.
- `packages/intentionsutil/test/router.test.ts:36,44-56,75,82,98-106,880-935` —
  fixture builders (`tactic`, `strategy`, `exec`, `kinds`, `candidateIds`), the
  parked-node fixture shape, the soft-freeze fixtures, and the `describe("ordering")`
  block the new suite sits beside.
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-census:55-70` — the
  config-read block to copy verbatim (log the diagnostic on a failed load, then
  proceed; never `2>/dev/null` it away).
- `.claude/skills/dispatch-propagate/scripts/dispatch-config-load:297-316,740-762`
  — the `census` schema doc block and jq validator, the single-integer-threshold
  precedent this config type mirrors; `:349` gives `wip` → `wip.json` for free.
- `.claude/skills/dispatch-propagate/scripts/census.example.json` — the
  one-key example-file shape.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-config-load.sh:1217-1300`
  — the `selection-lock` test block, the closest template for a single-integer
  tunable's seven cases.
- `.claude/skills/dispatch-propagate/scripts/graph-select-target:274-287` —
  `_selection_log_emit`'s jq record, extended with one `--argjson`.
- `.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh:32-60`
  — the hermetic fixture with the fake `npx` interceptor.
- `.claude/skills/dispatch-propagate/scripts/dispatch-target-workers:226-270`
  (`--max` mode) — read for the load/override/query precedent only. Do NOT add
  the WIP limit to `target-workers.json`: worker occupancy and in-flight-tactic
  count are different inputs that happen to share a shape, and the pace-curve
  config solves throughput pacing, not WIP.

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app packages/intentionsutil
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-config-load.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

End-to-end over the REAL store (no fixture authoring, so it cannot false-fail on
node-schema drift): `--wip-limit 0` forces the restricted branch, a huge limit
forces the unrestricted branch, and no flag must reproduce today's behavior.

```verify
set -euo pipefail
OUT=$(node --import tsx/esm packages/intentionsutil/scripts/select-targets.ts --wip-limit 0)
jq -e '.wip.limit == 0 and (.wip.in_flight | type) == "number"' <<<"$OUT" >/dev/null
jq -e '.wip.restricted == true or .wip.failed_open == true' <<<"$OUT" >/dev/null
# When restricted, no "start new work" candidate below tier 2 survives:
# a strategy round or a draft tactic is phase align-tactics with reevaluation false.
jq -e 'if .wip.restricted then
         ([.candidates[] | select(.phase == "align-tactics" and .reevaluation == false and .precedence.tier < 2)] | length) == 0
       else true end' <<<"$OUT" >/dev/null
# Never empty on account of the bound.
jq -e '(.candidates | length) > 0' <<<"$OUT" >/dev/null

UNB=$(node --import tsx/esm packages/intentionsutil/scripts/select-targets.ts --wip-limit 1000000)
jq -e '.wip.restricted == false and .wip.failed_open == false and .wip.bypassed == 0' <<<"$UNB" >/dev/null

DEF=$(node --import tsx/esm packages/intentionsutil/scripts/select-targets.ts)
jq -e '.wip.limit == null and .wip.restricted == false' <<<"$DEF" >/dev/null
# Unbounded output must be identical to the pre-change candidate list.
diff <(jq -S '.candidates' <<<"$DEF") <(jq -S '.candidates' <<<"$UNB") >/dev/null

# Bad limits are rejected loudly, never silently coerced.
for bad in -1 1.5 1e6 abc; do
  if node --import tsx/esm packages/intentionsutil/scripts/select-targets.ts --wip-limit "$bad" >/dev/null 2>&1; then
    echo "select-targets accepted a bad --wip-limit: $bad" >&2; exit 1
  fi
done
echo OK
```

**Manual: confirm the wiring end to end (post-merge, on main).** Run
`graph-select-target --top 1` (needs `dangerouslyDisableSandbox: true` — it calls
`gh` and the Claude daemon) with no `dispatch.config/wip.json` and confirm the
stderr line reports `limit=unset` with a plausible `in_flight` count, and that the
selection-log record at
`${DISPATCH_SELECTION_LOG_DIR:-$HOME/.local/share/commons-dispatch}/graph-selection.jsonl`
carries the new `wip` key. Then write `dispatch.config/wip.json` with
`{"limit": <n>}` and re-run: the stderr line must report that limit, and
`restricted` must be true whenever `in_flight >= n`.

**Manual: the author's dial (this node does not choose the number).** The bound
lands OFF. Turning it on is an author decision: pick the limit against the live
in-flight count, write it to `dispatch.config/wip.json`, and expect every
`align-tactics` candidate — strategy rounds and draft decomposition alike — to
stop being selected until in-flight drains below it, with tier 2 as the only
escape hatch. Sanity-check the chosen number before committing to it by running
`npx tsx packages/intentionsutil/scripts/select-targets.ts --wip-limit <n> | jq
'{wip, top: [.candidates[:10][] | {id, phase, tier: .precedence.tier}]}'` and
reading what the top of the queue becomes.

**Manual: the ratified post-landing re-measure (this node's real verification).**
Ruling 17's re-measure is this node's post-landing check, not a decision
precondition. Once the bound is enabled and the fleet demonstrably runs at cap,
sample the open-PR mergeability trend across consecutive days and confirm
CONFLICTING is non-increasing and the stalled-node queue positions from the
2026-08-03 measurement (14/24/25/29/30/41) are actually being reached.
**Force per-PR computation** — the bulk `gh pr list --json mergeable` query
returns mostly UNKNOWN, which is a FAILED READ and must never be recorded as
"clean" or as MERGEABLE. Baselines to compare against: 15 CONFLICTING of 31 open
(2026-08-03), 10 of 33 (2026-08-05), 30 open PRs total (2026-08-09, split not
re-measured). Pair it with the `wip` series now in `graph-selection.jsonl` —
`in_flight` falling while `restricted` stays true is the bound working; `in_flight`
flat with `failed_open` true every tick means the in-flight population is parked
or blocked rather than drainable, which is a different defect and belongs in a
new tactic, not in a wider limit.
