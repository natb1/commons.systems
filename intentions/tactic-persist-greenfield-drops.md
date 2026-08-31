---
id: tactic-persist-greenfield-drops
kind: tactic
statement: Persist /align-tactics' greenfield_drops onto the graph as
  supersession edges instead of discarding them into the round report
owner: ai
status: raw
parent: null
rationale: Ruled 2026-08-14. greenfield_drops is already a schema-REQUIRED
  decomposer output with a required superseded_by member, so the supersession
  judgment is already made and its output shape already validated — it is then
  thrown away, because write-path.md directs only that it be recorded in the
  round's transient report. Persisting it is a strict superset of relocating the
  gate and gives the RSI observable a real reading immediately. Two additions
  ruled 2026-08-15 after the pre-commit review - call the shared supersedes()
  evaluator rather than restating the judgment, and emit what was searched so an
  empty drops list is distinguishable from a search that never ran.
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by:
  - tactic-finding-search-all-producers
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Persist /align-tactics' greenfield_drops onto the graph as supersession edges instead of discarding them into the round report

## Draft context (2026-08-14 /align correction round)

Doctrine home: `strategy-graph-native-dispatch`, the clarification refuting the
"gate's only carrier is prose" argument.

**The judgment already exists and its OUTPUT SHAPE is already validated.**
`.claude/workflows/align-tactics.js` types `greenfield_drops` as a **required**
member of the decomposer's output schema, `additionalProperties: false`, with
`required: ['target', 'superseded_by', 'reason']`. The normative instruction is
carried in the same file: check each unit's subject against non-draft nodes
elsewhere that delete or supersede it; drop a doomed unit naming the superseding
node; a fully superseded tactic demotes to draft.

**Be precise about what that enforces** — corrected 2026-08-15, because the
2026-08-14 draft said "a decomposer run fails validation without it", which
overstates it in the same direction as the claim it was correcting. What is
enforced is the **shape**: the key must be present, and each entry that appears
must carry all three sub-fields. The **judgment** is prose in the prompt string.
`greenfield_drops: []` satisfies the schema on every run, so **an empty result is
indistinguishable from a search that never ran.** The honest comparison with the
rejected relocation is that the gate has a typed output where the proposal had
none — not that one is enforced and the other is prose.

**And then it is thrown away.**
`.claude/skills/align-tactics/references/write-path.md` directs only that the
drop be recorded "in the round's report". Nothing reaches the graph. The report
dies with the session.

### Scope

- On each `greenfield_drops` entry, write `superseded_by: [<superseded_by>]` onto
  the node named by `target`, in the round's **existing** `graph-commit` — no new
  commit, no new lane.
- The demote-to-draft behaviour for fully-superseded tactics stays exactly as it
  is; this adds the edge, it does not change the disposition.
- Correct `write-path.md`'s "record the drop in the round's report" to name the
  graph write as the primary destination, with the report as narration.
- **Call the shared evaluator; do not restate the judgment.** Ruled 2026-08-15.
  The decomposer's gate and the creation-time check in
  `tactic-finding-search-all-producers` are two triggers for the SAME judgment —
  "is X superseded by Y?" — and the author asked in terms for a parsimonious,
  DRY list of surfaces. The judgment lives once, as a pure function
  `supersedes(candidate, corpus) → {target, superseded_by, reason}[]` in
  `packages/intentionsutil/src/`. This node's change is to make the decomposer
  **call** it per unit rather than carry a second prose specification asserted to
  agree with the create surface's. The evaluator itself is authored by
  `tactic-finding-search-all-producers`, which owns the create surface — hence
  the added dependency below.

  This repo already applies exactly this rule elsewhere, and the precedent is
  worth citing because it states the failure mode precisely:
  `packages/intentionsutil/scripts/attribute-spend.ts:6-11` keeps itself a thin
  CLI and delegates the fold to `../src/spend.ts`, on the grounds that
  re-deriving the shares locally "would give the fitness function two
  denominators that could disagree, which is exactly the failure the single
  module exists to prevent." Two prose specifications of `supersedes()` are two
  denominators.
- **Make an empty result distinguishable from an absent search.** Emit, alongside
  the drops, a record of what was searched — corpus size and method — so
  `greenfield_drops: []` can be told apart from a judgment that never ran. Same
  principle the create surface already carries, where a disagreement between its
  two checks is itself a finding.

### Why this rather than relocating the gate

The 2026-08-14 round moved this check into the unbuilt shared creation surface,
arguing its only carrier was prose. That argument was false and the migration
would have **reduced** enforcement — from a schema-required field to a
prose-specified surface that does not exist yet. Persisting is a strict superset:
the workflow keeps enforcing, and the creation-time check in
`tactic-finding-search-all-producers` supplements it for the callers the workflow
never sees (strategies, and every create site that is not an `/align-tactics`
decomposition).

### Dependencies

- `tactic-supersession-edge-and-terminal` — **DISCHARGED 2026-08-31; the
  `blocked_by` edge is dropped.** The `superseded_by` field and its
  `supersession_expiry` companion shipped as that node's **Unit 1 only**, merged
  `fd5ce337` (PR19a, #3175), so there is a field to write and `validateNode` no
  longer drops it. What has *not* shipped is that node's Unit 2, the eligibility
  gate, and the gap binds this node directly. Until Unit 2 lands a superseded
  node keeps its non-`done` phase and is not pruned, so `blockersComplete`
  (`router.ts`) counts it incomplete and blocks every dependent that names it
  forever, which `classifyTerminus` drains as `excused-blocked` — so persisting
  a drop can deadlock a live chain. **Interim rule, the one
  `intentions/kind-kind.md` carries: do not persist a supersession whose target
  any live node names in `blocked_by`.** Emit those drops to the round report
  unpersisted, as today, rather than writing an edge that strands a dependent.
- `tactic-finding-search-all-producers` — it authors the shared `supersedes()`
  evaluator this node calls. Added 2026-08-15 with the one-evaluator ruling.
  **Still live, and now this node's only `blocked_by` entry.**
