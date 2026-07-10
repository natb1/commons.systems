---
id: tactic-fingerprint-recipe-single-callsite
kind: tactic
statement: Route every strategy_fingerprint producer through the canonical
  strategyFingerprint export — retire prose-recipe hand-computation in
  /align-tactics and orchestrator prompts
owner: ai
status: raw
parent: null
rationale: "Draft finding from the 2026-07-06/07 emulated router ticks
  (graph-tick-emulation-workflow-gotchas). Three independent writers
  hand-computed the prose recipe and produced three different hashes for the
  same substance; the tick orchestrator's own comparator was wrong twice
  (dropped attributes.conditions, unsorted serves) and overwrote correct stamps
  at ba3ac84c, corrected at 0c793d1f. The canonical implementation is
  strategyFingerprint (packages/intentionsutil/src/router.ts, PR #2785)."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 3
  override: null
  rationale: "Author-directed 2026-07-08 (refined): tactics that directly edit
    .claude/skills/align-strategy/SKILL.md or
    .claude/skills/align-tactics/SKILL.md content rank above the rest of
    strategy-graph-native-dispatch's subtree (boost 3, added on top of the
    strategy's own boost 5, authored 8) — above curriculum-execution tooling
    (boost 7) and above every other tactic in this strategy's subtree (inherited
    5, unboosted)."
phase: null
execution: null
validates: []
blocked_by:
  - tactic-graph-router-selector
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Route every strategy_fingerprint producer through the canonical strategyFingerprint export — retire prose-recipe hand-computation in /align-tactics and orchestrator prompts

**Draft** — retained finding from the 2026-07-06/07 emulated router ticks;
input to a later `/align-tactics strategy-graph-native-dispatch` round.

## Finding

The soft-freeze recipe currently exists in two forms: the canonical
implementation `strategyFingerprint`
(`packages/intentionsutil/src/router.ts:82`, PR #2785 branch — merges with
`tactic-graph-router-selector`), and a prose recipe repeated in tactic bodies
and skill text ("sha256 hex of JSON.stringify({statement, clarifications,
conditions, serves, success_signal, tooling_goals}) as loaded by listNodes").
The prose form is ambiguous in exactly two places the implementation resolves:
`conditions` means `attributes.conditions ?? null` (there is no top-level
`conditions` after `validateNode` — a naive reader gets `undefined` and
`JSON.stringify` silently drops the key), and `serves` is sorted before
hashing.

Evidence this ambiguity bites: in the 2026-07-06 tick, three writers hashed
the same substance three ways. The tick orchestrator's comparator dropped
`attributes.conditions`, producing false-stale verdicts for both stamped
subtrees (recover-finance's freeze was entirely spurious — its strategy file
was byte-identical since round-1 stamping); a re-eval worker following the
orchestrator's mandated constant replaced *correct* stamps with wrong ones;
the orchestrator then "corrected" the other subtree's *canonical* stamp
(`157bc07d…`, worker-derived from the recipe as written in the tactic bodies)
to another wrong value (`ba3ac84c`). All ten stamps were restored to canonical
values at `0c793d1f` (2026-07-07) by importing `strategyFingerprint` directly.

## Direction for the consuming round

- `.claude/skills/align-tactics/SKILL.md` "Fingerprint honesty" and
  re-evaluation-mode step 3 still say "no fingerprint helper exists" and
  restate the prose recipe. Once PR #2785 merges, both must instead invoke
  the export (a one-line `npx tsx` snippet importing `strategyFingerprint`
  from `packages/intentionsutil/src/router.ts`), and the prose recipe copies
  in tactic bodies become historical.
- Orchestrators (tick emulation instructions, worker prompts) must never pass
  a fingerprint *constant* into a re-eval session — the worker recomputes via
  the helper against fresh `origin/main` at stamp time. A constant computed at
  selection time is wrong whenever substance moves mid-tick (it did:
  `fae27514`).
- Consider a `--fingerprint <strategy-id>` mode on an existing intentionsutil
  script (or a tiny new one) so shell callers need no inline tsx.

## Reuse

- `strategyFingerprint`, `servingStrategyIds` —
  `packages/intentionsutil/src/router.ts` (PR #2785).
- `check-node-selection.ts` (planned, `tactic-worker-start-revalidation`
  Unit 1) already consumes the export — this tactic covers the *writer* side
  (skill text + orchestrator prompts), not the gate side.
