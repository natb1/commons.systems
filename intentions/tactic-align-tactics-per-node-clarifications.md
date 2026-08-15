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
  - tactic-supersession-edge-and-terminal
office_hours:
  reason: >-
    Parked 2026-08-15 by the /align node-creation-surface correction round, on
    author ruling. This node implements a doctrine ruling that the same round
    OVERTURNED. Its unit A widens a per-node session's authority to append
    clarifications to the serving strategy; its unit B hardens
    DRIFT_SCHEMA.clarifications_to_add. The 2026-08-15 ruling removes that write
    authority entirely — the immaterial drift path now mints a born-parked
    observation node instead — and deletes the field unit B would harden. So
    unit A is doomed as written and unit B's target is being removed. Found by
    the pre-commit adversarial review, on the correction round's own output,
    which is the exact failure class that round exists to close.


    PARK CONDITION DISCHARGED 2026-08-15 (later the same day). The
    recommendation below required confirming that
    tactic-align-tactics-immaterial-drift-redirect carries unit B's surviving
    finding before closing this node. It does, at three places in its body: the
    DRIFT_SCHEMA {answer}-only vs Clarification {question, answer} mismatch is
    recorded there as owed by that node. So the substantive precondition for
    closing is met.


    BLOCKED ON THE INSTRUMENT, NOT ON A DECISION. The close could not be
    executed, because no correct terminal exists yet and all three available
    instruments are wrong. (a) phase: done launders abandoned work as completed
    — the precise failure R8 of this round ruled against — and would
    additionally make blockersComplete treat this node as satisfied for anything
    blocked_by it. (b) graph-commit --prune deletes the file, but this node is
    cited by id in FIVE dated clarifications on strategy-graph-native-dispatch
    (at its 2026-07-28 and 2026-07-31 rounds and the 2026-08-15 correction) plus
    the bodies of tactic-align-review-skill and
    tactic-align-tactics-immaterial-drift-redirect. Those clarifications are
    historical records of what past interviews decided; repointing them would
    falsify dated records, and leaving them would point seven references at a
    node that no longer exists. Validation would pass — prose refs to a pruned
    node do not break validate-graph — which is exactly why the damage would be
    silent. (c) Staying parked with a stale recommendation misreports the state
    as awaiting an author decision when no decision is outstanding.


    So the blocked_by edge below is the honest state: this node is closeable the
    moment tactic-supersession-edge-and-terminal ships status: superseded plus
    the supersession edge, and not before. It is also the first concrete
    instance of the gap that node exists to fill, which is worth its weight when
    that node is prioritized.
  since: 2026-08-15
  recommendation: "Close as superseded by
    tactic-align-tactics-immaterial-drift-redirect as soon as
    tactic-supersession-edge-and-terminal lands — no further author judgment is
    needed, only the instrument. Unit A is dropped (its doctrine was
    overturned). Unit B's finding is already carried by the redirect node and
    must not be re-homed here. Do NOT close via phase: done or via --prune; the
    reason field records why each corrupts the record."
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# A per-node /align-tactics <tactic-id> session has no legal destination for the drift phase's immaterial observations: write-path.md tells it to land them as strategy clarifications, tactic-target.md forbids any strategy write, the park escape is closed by the autonomy contract's three conditions, and DRIFT_SCHEMA emits {answer} with no question so the instruction is not mechanically executable anyway
