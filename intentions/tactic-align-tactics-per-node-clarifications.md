---
id: tactic-align-tactics-per-node-clarifications
kind: tactic
statement: "A per-node /align-tactics <tactic-id> session has no legal
  destination for the drift phase's immaterial observations: write-path.md tells
  it to land them as strategy clarifications, tactic-target.md forbids any
  strategy write, the park escape is closed by the autonomy contract's three
  conditions, and DRIFT_SCHEMA emits {answer} with no question so the
  instruction is not mechanically executable anyway"
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-28 /align-strategy interview from the 2026-07-27
  per-node run on tactic-align-tactics-tactic-mode-drift-gate (workflow run
  wf_9f49072c-454), which returned 4 clarifications_to_add and 4
  unrecorded_premises (all material:false) and dropped every one of them because
  the two reference files give opposite instructions. The doctrine half was
  resolved at that interview and is recorded as a strategy clarification: a
  per-node session MAY append clarifications entries to the serving strategy and
  may touch NOTHING else on it. This tactic is the completable implementation of
  that standing requirement, plus the independent schema defect found in the
  same path. Two units, both in .claude/skills/align-tactics/ and
  .claude/workflows/align-tactics.js. UNIT A (doctrine sync, sonnet): narrow
  references/tactic-target.md:131-137's absolute prohibition -- 'There is no
  strategy edit in either case -- a per-node tactic-target session never touches
  the serving strategy's frontmatter (rounds, clarifications, or otherwise)' --
  to everything-but-clarifications, stating the append-only carve-out explicitly
  (never rounds/count/last_completed/last_aligned, never statement, rationale,
  attributes.conditions, success_signal, or any edge) and citing the decisive
  symmetry argument (strategy-mode /align-tactics already lands these
  autonomously with no author present, so tactic mode claims no new authority).
  Leave references/write-path.md:168-171 substantively unchanged but make its
  both-modes scope explicit so a reader cannot infer strategy-mode-only. Check
  references/autonomy.md needs no edit: the park escape stays closed, which is
  now correct rather than a hole, because the carve-out gives the observations a
  destination. UNIT B (schema widening, sonnet, depends on A):
  DRIFT_SCHEMA.clarifications_to_add in
  .claude/workflows/align-tactics.js:165-173 declares items as {answer} only
  with additionalProperties:false, while the Clarification interface in
  packages/intentionsutil/src/schema.ts:66-69 requires {question, answer} -- so
  a landing session must fabricate the question unguided (this interview did
  exactly that for the four recovered entries). Widen the schema items to
  require both question and answer, and update buildDriftPrompt's instruction
  text (around .claude/workflows/align-tactics.js:577-582) so the drift agent
  authors the question alongside the dated answer. VERIFICATION: node --check on
  the workflow file; a per-node /align-tactics run whose drift phase emits at
  least one clarification lands it verbatim on the serving strategy with both
  fields populated and nothing else on that strategy touched; validate-graph
  rule 17 (date presence) still passes on the landed entry."
reading: null
gap: null
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
blocked_by: []
office_hours:
  reason: "Parked 2026-08-15 by the /align node-creation-surface correction
    round, on author ruling. This node implements a doctrine ruling that the
    same round OVERTURNED. Its unit A widens a per-node session's authority to
    append clarifications to the serving strategy; its unit B hardens
    DRIFT_SCHEMA.clarifications_to_add. The 2026-08-15 ruling removes that write
    authority entirely — the immaterial drift path now mints a born-parked
    observation node instead — and deletes the field unit B would harden. So
    unit A is doomed as written and unit B's target is being removed. Found by
    the pre-commit adversarial review, on the correction round's own output,
    which is the exact failure class that round exists to close."
  since: 2026-08-15
  recommendation: Re-scope or close. Unit A should be dropped. Unit B's finding
    SURVIVES the overturn and is still owed — DRIFT_SCHEMA declares its items as
    {answer} only with additionalProperties false while the Clarification
    interface requires {question, answer} — but its home is now
    tactic-align-tactics-immaterial-drift-redirect, which must not repeat the
    mismatch in the replacement observation-node schema. Confirm that node
    carries it before closing this one.
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# A per-node /align-tactics <tactic-id> session has no legal destination for the drift phase's immaterial observations: write-path.md tells it to land them as strategy clarifications, tactic-target.md forbids any strategy write, the park escape is closed by the autonomy contract's three conditions, and DRIFT_SCHEMA emits {answer} with no question so the instruction is not mechanically executable anyway
