---
id: tactic-align-tactics-migration-tightening-split
kind: tactic
statement: /align-tactics has no rule against planning a data migration and the
  schema tightening that rejects its pre-migration spelling into the same PR, so
  plans keep pairing them and rely on the origin/main data test being green --
  record the rule in the skill and reconcile the two live plan units that
  violate it today
owner: ai
status: raw
parent: null
rationale: "Filed 2026-08-18 as a residual of PR #3095 (graph write-path
  integrity, squash-merged to main as fe0b1c4d). PR1's closing batch could not
  carry a node create -- graph-commit's --base compare-and-swap manifest pins a
  pre-image per id, and an id with no pre-image corrupts the batch -- so the
  residuals it discovered were recorded in the PR's plan document and filed
  nowhere in the graph. This node closes that gap. The rule -- direction 1 --
  arrived as planning-time doctrine on PR1 unit 4's node and was deliberately
  put out of that PR's scope: it is /align-tactics doctrine, not graph-write
  code, so PR1 correctly declined it and recommended a follow-up node that was
  then never filed. It is worth filing rather than dropping because the
  serialized PR plan violates it in two places right now, and both are currently
  safe only because PR1 fixed the origin/main data test -- which is precisely
  what the rule says not to rely on.
  AMENDED 2026-08-31: the premise in the sentence above is REFUTED.
  graph-commit's --base is a per-id opt-in, not a whole-batch mode.
  check_base_freshness returns early on an empty manifest and otherwise
  iterates only the manifest's own keys, so a positional id absent from the
  manifest is simply not CAS-checked; and the ordinary-id guard asks only
  that intentions/<id>.md exist on disk, never on origin/main. The header
  documents --prune as mixable with ordinary positional ids. One invocation
  can therefore carry creates, edits and prunes together. Only the stated
  REASON was wrong: the decision it explains -- filing PR1's residuals as
  their own nodes rather than folding them into that batch -- stands on its
  own merits and is not disturbed by this correction."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Are the two plan units this node names as violating the
      migration/tightening rule still violating it?
    answer: "No — both were reconciled by their own finalize rounds after this node
      was filed on 2026-08-18, re-verified on the caller thread at origin/main
      9abdb750 on 2026-08-21. UNIT A is
      `tactic-attributes-phase-squatter-retire` (phase: implement, status:
      codified, office_hours: null, serves this strategy): it now splits the
      migration from the tightening across a hard unit boundary — `## Unit 1 —
      Backfill the three squatter nodes to first-class phase: main-qa`
      (intentions/tactic-attributes-phase-squatter-retire.md:220) lands as a
      state-only, direct-to-main graph-commit with no PR, and `## Unit 3 —
      validateGraph Rule 23` (:389) carries `**Dependencies.** Unit 1 —
      **hard**` at :471-476 with the mechanical reason written out
      (validate-graph runs in CI on every PR and on the graph fast path, so
      landing the gate while the squatters are still on origin/main reddens
      main). Its `### Brownfield migration path` at :152 states the same
      sequencing. Landed 9f152203 on 2026-08-20. UNIT B is
      `tactic-eval-finding-ledger` (phase: implement, status: codified): it
      removed the migration from scope entirely rather than splitting it — `###
      Out of scope (whole plan)` (intentions/tactic-eval-finding-ledger.md:114)
      lists `Bulk-stripping attributes.ledger_entry from the 40 nodes that carry
      it` at :125-128, and no validateGraph rule ever rejects the key, so the
      reader removal in `## Unit 1` (:149) is safe alone; Unit 5 (:398) carries
      the written justification for why the un-migrated data stays legal. Landed
      f1522dc0 on 2026-08-19. Scope item 2 of this node is therefore already
      discharged, by two different means; the remaining owed work is Scope item
      1 only."
  - question: Do the factual anchors this node's body cites still hold on origin/main?
    answer: "Two do not, verified 2026-08-21 at origin/main 9abdb750. (a) The body
      says Unit A `backfills six nodes off attributes.phase`; the population is
      three, not six — `tactic-attributes-phase-squatter-retire.md:83` records
      `The stored body of this node claimed six nodes. It is three.`, the other
      three having been lifted out-of-band by f42da977. (b) The body quotes that
      section as recording it `does trip the origin/main data test`; that phrase
      exists nowhere in the repo working tree except this node's own quotation
      of it at :71 — it lived in PR #3095's plan document and in the
      pre-finalization body, not in any live node. Consequently this node's `##
      Verification` (:100-106), which asks a fresh planner reading only the
      amended SKILL text to say `which of the two violating units above is
      non-compliant and why`, is unrunnable as written: against today's bodies
      neither is non-compliant. That verification step must be rewritten when
      this node is planned — a doctrine rule still needs a readable test, but it
      cannot be this one."
  - question: Does recording the rule in .claude/skills/align-tactics/SKILL.md
      actually reach the model that plans units?
    answer: "No — and this is a material scope question for the author, raised
      2026-08-21. The planning model's prompt is `buildPlanPrompt`'s `PLAN BODY
      SCHEMA` block in `.claude/workflows/align-tactics.js` (:944 opens the
      block; :960 is its `Dependencies` line, the natural home for a
      unit-ordering constraint). SKILL.md itself declares that block
      authoritative twice — at :31 and :331 — saying the schema's canonical home
      is buildPlanPrompt, not SKILL.md. Measured: `grep -in
      'migration|tighten|data test|backfill'` over
      .claude/skills/align-tactics/SKILL.md (452 lines) returns ZERO hits,
      confirming Scope item 1 is fully owed and untouched; the same grep over
      .claude/workflows/align-tactics.js returns one unrelated hit at :934 (`add
      a brownfield migration path`). So a rule recorded only as SKILL.md prose
      is doctrine no planning agent ever reads. This node's Scope item 1 names
      SKILL.md specifically, and its Out-of-scope paragraph excludes `any
      mechanical enforcement of the rule`; a workflow-prompt edit is neither
      SKILL.md prose nor validator enforcement, so it falls in a gap the
      recorded scope does not decide. The author should rule whether Scope item
      1 covers both files. The nearest precedent inside SKILL.md is the /dataviz
      constraint at :336-338, which is stated in SKILL.md prose within the same
      `Plan each claude-eligible tactic` bullet."
  - question: Is another in-flight node already editing the file Scope item 1 targets?
    answer: "Yes, verified 2026-08-21. `tactic-attributes-phase-squatter-retire`
      (phase: implement) carries `## Unit 4 — Correct the stale PHASES claim in
      /align-tactics` at
      intentions/tactic-attributes-phase-squatter-retire.md:480, which edits
      `.claude/skills/align-tactics/SKILL.md` around :427-431 under its `## Out
      of scope` heading. That is the same file Scope item 1 of this node
      targets, so if both land there is a conflict window; sequence this node
      after that unit, or plan for the merge. Related mechanical note recorded
      on that node at :509-512: `.claude/skills/**` is a sandbox
      `denyWithinAllow` carve-out, so tree-updating git ops touching it need
      `dangerouslyDisableSandbox: true`."
  - question: Does parking this node, rather than finalizing it, improve the
      maintenance-burden band the park cites?
    answer: "No — neither disposition does, and that is a property of the band as
      declared rather than of this node. Measured 2026-08-21 at origin/main
      9abdb750 through the canonical census functions. `classifyTactic`
      (packages/intentionsutil/src/census.ts:13-18) scores a tactic with `phase:
      null, office_hours: null` as `draft` — counted in the band's DENOMINATOR
      only — while both `open` (phase set, not done) and `born-parked` (phase
      null, office_hours set) score into the NUMERATOR (strategyBacklogBand,
      :26-39). This node is currently a draft. Finalizing it to `phase:
      implement` would move it from denominator-only into the numerator: 130/316
      = 41.14% becomes 131/316 = 41.46%. Parking it moves it into the numerator
      identically: also 131/316 = 41.46%. The two dispositions are numerically
      indistinguishable to the band. It follows that the only band-improving
      dispositions available to any lane are carrying a tactic through to `done`
      or pruning a draft outright — so while the band is breached it does not
      merely close the /align-tactics lane, it makes every forward motion on a
      draft raise the measured burden, decomposition's own output included. This
      refines, and partly corrects, the framing carried on the sibling parks of
      2026-08-21, which attribute the compounding specifically to parks; the
      caller-thread measurement here shows finalizes feed the numerator by
      exactly the same step. Offered as a live input to the author's ruling, not
      as a reason to plan through the breach."
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "SIDE A — a recorded condition on the serving strategy measures FALSE,
    so this node cannot be planned against it.
    `strategy-graph-native-dispatch`'s ARMED maintenance-burden band fails on
    BOTH limbs. MEASUREMENT, taken on the caller thread on 2026-08-21 at
    origin/main 9abdb750 through the canonical census functions (`listNodes` +
    `strategyBacklogBand`/`classifyTactic`,
    packages/intentionsutil/src/census.ts:13-39) rather than by reimplementing
    the rules: 316 tactics serve this strategy — 84 open (phase set, not done),
    46 born-parked, 89 draft, 97 done — so backlog = 84 + 46 = 130 of 316 =
    41.14%. The declared band is 'at or below 35% ... and non-increasing across
    consecutive samples derived from intentions/ git history at read time'.
    CEILING LIMB: 41.14% > 35%, FAILED. NON-INCREASING LIMB: the strategy's
    recorded descent is 47.6% -> 38.2% -> 31.4% -> 24.6%, but the measured
    series across 2026-08-21 alone reads 38.5% (fd98fd26) -> 39.4% (481572f1) ->
    40.19% -> 40.5% (3313bc46) -> 41.14% (this round, 9abdb750) — strictly
    rising, five samples inside one day. FAILED. The strategy's stored `reading`
    field still says '58/236 = 24.6%' and is stamped 2026-08-10; it is stale by
    roughly 16 points and must not be read as the condition still passing. The
    condition's own text makes this an author decision rather than more work to
    do: 'A burden growing without bound is this condition FAILING (which parks
    the strategy for an author decision), not merely more work to do.' A
    per-node tactic-target session may not write the serving strategy, so the
    re-measurement and the ruling request are recorded here rather than on the
    strategy — the strategy's own record is the incomplete half. WHY THIS
    PARTICULAR NODE IS AFFECTED: this node is currently a draft, and
    `classifyTactic` scores a draft into the band's denominator only. BOTH
    available dispositions move it into the numerator by exactly one — finalize
    to `phase: implement` gives 131/316 = 41.46%, and this park gives 131/316 =
    41.46% — so proceeding would have worsened the breached metric by the same
    step the park does, with no disposition available to this lane that improves
    it. That symmetry is recorded as clarification 5 and is a live input to the
    ruling, since it means the band as declared penalises decomposition's own
    output and not only its parks. FOUR FURTHER DRIFT FINDINGS are folded into
    this node's `clarifications` rather than into a separate born-parked
    observation carrier (minting one would add another node to the same failing
    numerator): (1) Scope item 2 of this node — 'reconcile the two violating
    units' — is ALREADY DISCHARGED, both units having been reconciled by their
    own finalize rounds after this node was filed, verified at file:line; (2)
    the body's 'six nodes' is three and its quoted phrase 'does trip the
    origin/main data test' no longer exists in any live node, which makes this
    node's own `## Verification` unrunnable as written; (3) a MATERIAL scope
    ambiguity — recording the rule in SKILL.md alone does not reach the planning
    model, whose prompt is `buildPlanPrompt`'s PLAN BODY SCHEMA in
    .claude/workflows/align-tactics.js:944-966, so the author must rule whether
    Scope item 1 covers that file too; (4) a conflict window —
    `tactic-attributes-phase-squatter-retire` Unit 4 already edits the same
    SKILL.md. Scope item 1 itself remains fully owed and untouched (grep for
    migration/tighten/data-test/backfill over SKILL.md returns zero)."
  since: 2026-08-21
  recommendation: "Three items for the sitting, in order. (1) RULE ON THE BAND. It
    is the sole blocker on this node and on at least four sibling /align-tactics
    rounds parked across 2026-08-21 (tactic-supersession-retirement-sweep,
    tactic-graph-commit-park-content-durability,
    tactic-align-tactics-drift-dump-office-hours,
    tactic-align-tactics-immaterial-drift-redirect, and this node). Three
    dispositions are available: (a) RE-AFFIRM 35% as a real stop and accept that
    the /align-tactics lane on this strategy stays closed until the backlog
    drains — which requires directing capacity at carrying open tactics to
    `done`, the only band-improving move; (b) RE-DECLARE the band against the
    grown population, noting the arming measurement was 59/197 = 30.0% on
    2026-08-05 and the tactic population has since grown from 197 to 316, so the
    ratio is measuring a different-sized machine than the one it was declared
    against; (c) ACCEPT the breach with recorded remediation and a date to
    re-measure. Whichever is chosen, RE-STAMP the strategy's `reading` field —
    it says 24.6% from 2026-08-10 and is ~16 points stale, so every reader that
    trusts it concludes the condition passes. (2) NOTE THE STRUCTURAL FINDING
    before ruling: measured this round, finalizing a draft and parking a draft
    move the band by an identical +1/316, because `classifyTactic` counts `open`
    and `born-parked` alike into the numerator and `draft` into neither. So the
    band as declared makes every forward motion on a draft raise the measured
    burden; only completion to `done` or pruning improves it. If (b) or (c) is
    chosen, consider whether the metric should count `open` tactics — work in
    flight — as burden at all, or whether burden means born-parked plus stalled
    work only. (3) RULE ON SCOPE ITEM 1's REACH (clarification 3), which is
    independent of the band and can be settled in the same sitting: does 'record
    the rule in the planning guidance' mean
    .claude/skills/align-tactics/SKILL.md only, or also `buildPlanPrompt`'s PLAN
    BODY SCHEMA block in .claude/workflows/align-tactics.js (:944-966,
    Dependencies line at :960)? SKILL.md itself names that block canonical, and
    a rule absent from it is never read by a planning agent. THEN, when the node
    is next planned: Scope item 2 is already discharged (clarification 1) so the
    plan should carry Scope item 1 only; and the body's `## Verification` must
    be rewritten, since the two units it asks a planner to judge are both
    compliant today (clarification 2). Do NOT send this node to a phase worker
    before the band is ruled on — a worker would re-derive the same Side-A
    stop."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# Record the migration/tightening split rule in `/align-tactics`

## Context

The rule, stated once so it can be quoted:

> **A data migration and the schema tightening that rejects its pre-migration
> spelling cannot share a PR.** The migration lands first and reaches
> `origin/main`; the tightening lands after.

The reason is mechanical. A schema tightening is validated against the data on
`origin/main`. If the migration that rewrites that data is in the same PR, the
tightening is being checked against data that has not landed yet — the PR
passes only because of the order its own checks happen to run in, not because
the constraint holds on the trunk.

This arrived as planning-time doctrine on PR #3095's unit 4 and was
deliberately excluded from that PR's scope: it is `/align-tactics` doctrine,
not graph-write code. PR1 declined it correctly and recommended a follow-up
node. The follow-up was never filed — which is why it is being filed now,
after the second plan revision to rediscover it.

## Why this is not bookkeeping

The serialized graph write-path plan **violates the rule in two live units
today**:

- One unit backfills six nodes off `attributes.phase` *and* makes
  `validate-graph` reject the key, in a single unit. That section already
  records that it "does trip the origin/main data test".
- Another strips `attributes.ledger_entry` from forty nodes *and* removes the
  reader in the same PR.

Both are currently safe **only because PR #3095 fixed the origin/main data
test**. That is precisely the rule's point: it says do not depend on that.

## Scope

1. **`.claude/skills/align-tactics/SKILL.md`** — add the rule to the planning
   guidance, as a constraint on how a tactic is split into units, with the
   mechanical reason stated. A rule recorded without its reason gets
   "simplified" away by the next reader who cannot see what it is protecting.
2. **Reconcile the two violating units.** Splitting them is the obvious move
   and may not be the right one — the alternative is to record explicitly, on
   each, why the pairing is safe in that specific case. Either outcome is
   acceptable; leaving them unexamined is not, because the rule's first
   application should not have a silent exception.

Out of scope: `validate-graph`, the schema, and any mechanical enforcement of
the rule. This is doctrine a planner applies, not a check a validator runs. If
enforcement turns out to be feasible, that is a separate node — do not grow
this one into it.

## Dependencies

None mechanically. But the reconciliation in (2) has to happen **before** the
two violating units are executed, or the rule is being recorded after the last
moment it could have been applied.

## Reuse

- `.claude/skills/align-tactics/SKILL.md` already carries per-unit planning
  constraints; this belongs beside them, not in a new document.
- `.claude/rules/planning.md` defines the plan-body schema (Context, Scope,
  Dependencies, Reuse, Verification) that the unit split has to satisfy — the
  new rule constrains where a unit boundary may fall, so it should be phrased
  in that document's vocabulary.

## Verification

Doctrine, so the verification is a reading rather than a command: a planner
with no memory of this node, reading only the amended SKILL text, must be able
to say which of the two violating units above is non-compliant and why. If the
rule as written does not let them do that, it is not yet written.

The reconciliation half is checkable directly — after (2), each of the two
units either has a unit boundary between migration and tightening, or carries a
written justification for why it does not.
