---
id: tactic-align-review-skill
kind: tactic
statement: Build the /align-review skill, the assemble-review-pack script, and
  the graph-commit --review receipt floor; insert the draft-review gate into
  /align's flow
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-08-11 /align interview codifying the
  adversarial draft design review (strategy condition + clarifications of that
  date, amended by the bootstrap review's own material findings): the graph
  records the doctrine; this tactic carries the skill-text encoding, the
  pack-assembly script, and the mechanical receipt floor in graph-commit —
  judgment in the review, receipt in the script, per the scripted-path
  condition."
reading: null
serves:
  - strategy-discovered-requirements
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Why did the 2026-08-21 /align-tactics round park this node instead of
      finalizing it?
    answer: "(Measured 2026-08-21 during an /align-tactics per-node finalize,
      against the intentions/ store at 53eefa33 — byte-identical to origin/main
      eba3313b, verified with git diff --stat over intentions/ after origin/main
      advanced mid-run — via select-targets.ts --dir over the committed store.)
      This node was parked because the serving strategy's authored-boost
      condition has fired on its second, edge-churn path. At the 2026-08-14
      ratifying base b1ebf766 the highest band anywhere in the store was 8.000,
      held by strategy-discovered-requirements' own three children, with the
      whole rsi cluster at 7.500 and below and
      tactic-rsi-lens-catalog-decomposition at band 6 — the measurement the
      ratifying round recorded as confirming the boost. At HEAD, two rsi-cluster
      tactics band at 11.333: tactic-rsi-lens-catalog-decomposition (serves
      strategy-recursive-self-improvement, blocked_by [] of its own, depended on
      by at least tactic-rsi-round-trips-lens-carrier,
      tactic-rsi-trigger-threshold-gate, tactic-rsi-intervention-special-cases
      and tactic-audit-cache-efficiency-lens) and
      tactic-supersession-edge-and-terminal, while this strategy's four children
      still band at 8.000. strategy-recursive-self-improvement's authored boost
      is unchanged at 6, so no rerank occurred — the inversion is pure
      reverse-blocked_by lineage compounding, the path added to the condition on
      2026-08-14 precisely because no author acts in it. Recorded here so the
      measurement survives the park being cleared."
  - question: Is item 3's diff-read gate predicate still the design to build?
    answer: "(Recorded 2026-08-21 /align-tactics per-node round.) Item 3's sentence
      beginning 'Gate predicate, read off the commit's diff' is SUPERSEDED and
      must be struck when item 3 is implemented. The 2026-08-14 author
      ratification recorded later in this same body, and the
      discrimination-mechanism clause now carried by
      strategy-discovered-requirements' draft-review-gate condition, both hold
      that the scope boundary is defined by CALLER, so the discriminator must be
      the caller: --review is a flag the caller passes, and graph-commit refuses
      only a write DECLARED under review without a valid receipt, never
      inspecting the diff to decide whether a receipt was owed. An implementer
      reading item 3 in isolation would build the design the author explicitly
      rejected."
  - question: How many mitigations of the opt-in-floor accepted cost are actually in
      this tactic’s scope?
    answer: (Recorded 2026-08-21 /align-tactics per-node round.) The 'Accepted cost'
      section lists two mitigations as in-scope; only one still is. The serving
      strategy WITHDREW the caller-restriction mitigation ('/align's call site
      is the only site that MAY pass --review') on 2026-08-15 as a non-sequitur
      — restricting who may pass the flag constrains opt-IN, whereas the
      disclosed hole is omission — while noting it remains a true scope
      narrowing. The required deliverable is therefore the lint asserting that
      /align's call site always passes --review; the caller restriction may be
      implemented as narrowing but must not be described as addressing the
      accepted cost.
  - question: Is the body's “Still owed by the SERVING STRATEGY” debt still open?
    answer: (Recorded 2026-08-21 /align-tactics per-node round.) The section 'Still
      owed by the SERVING STRATEGY, not by this node' is DISCHARGED and should
      be marked so rather than left as a live debt.
      strategy-discovered-requirements' draft-review-gate condition now carries
      the caller-declared discrimination mechanism in full, together with the
      rejected diff-read predicate and the verified counter-evidence
      (dispatch-eval-finding's own ledger write, /align-tactics tactic mints,
      qa-fix finding nodes, dispatch-diagnose-main's main-red node,
      /context-chunks drafts).
  - question: Which path:line anchors in this body have drifted, and which still hold?
    answer: "(Recorded 2026-08-21 /align-tactics per-node round; every anchor
      re-measured against graph-commit at 4012 lines.) Anchor drift in this
      body. CORRECTIONS: the dangling prose reference to the pruned
      tactic-align-interview-type-doctrine is at
      .claude/skills/align/SKILL.md:746, not :733 — the node file is confirmed
      absent from intentions/. And item ii’s cited pair `:169`/`:1952` for
      graph-commit’s stale exit-3 header claim is wrong in BOTH halves, in
      opposite directions. `:169` is correct (“usage errors keep exit 2 and
      --base staleness keeps exit 3”). `:1952` is wrong — that line sits inside
      check_suite_concluded and is an unrelated note about orphaned check-suite
      rows. But the second stale site DOES exist, at `:2428-2429`, in
      emit_verdict_and_exit’s header: “Usage errors (exit 2) and --base
      staleness (exit 3) do not route through here and keep their own codes.” So
      item ii’s instruction to correct the stale header touches TWO lines, :169
      and :2429 — not one. (This supersedes the “:169 ONLY” finding the drift
      review itself reached; that finding was refuted on the caller thread by
      `grep -n “exit 3”`, which returns exactly three hits: :169, :1053 and
      :2429. The :1053 hit is ACCURATE and must NOT be touched — it documents
      merge-node.ts’s exit 3, a different program’s code, not graph-commit’s
      own.) STILL ACCURATE: the “interview is the audit” paragraph at
      SKILL.md:46-50; park-node’s --base header at :75-112, its resolution at
      :202-236 and its stale-diagnosis exit-3 refusal at :360-362; and item ii’s
      core claim, re-verified, that graph-commit today has zero occurrences of
      --review, zero of --ack and zero of “trailer” anywhere in the script. ALSO
      CORRECTED: the body’s citation of
      “.claude/workflows/align-tactics.js:154,807” as where /align-tactics mints
      tactic node files is wrong in kind, not merely stale — that Workflow
      authors no files at all (its own header says so); the minting happens on
      the /align-tactics CALLER thread via write-node.ts, per
      .claude/skills/align-tactics/references/write-path.md. The
      counter-evidence the ratification section rests on survives the correction
      unchanged."
  - question: Where must a test suite for item 2's new align-review scripts
      directory be wired?
    answer: (Recorded 2026-08-21 /align-tactics per-node round.) CI wiring note for
      item 2's chosen script home. A new .claude/skills/align-review/scripts/
      directory falls outside run-unit-tests.sh's dispatch-propagate-only test
      glob, so a test-*.sh landing there is NOT auto-discovered and will
      silently never run — the /rsi test-rsi-claim.sh precedent. Any such suite
      must be hand-added as a named step in .github/workflows/unit-tests.yml's
      hook-tests job in the same commit that adds the test file, per that file's
      own 'Keep this list in sync' comment, and verified post-merge against the
      actual job steps rather than trusting a green PR. New graph-commit
      --review cases belong in
      packages/intentionsutil/scripts/test-graph-commit.sh, which is already
      wired.
  - question: Is finding (i) right that attributes.align_round needs no
      strategyFingerprint exemption?
    answer: "YES — CONFIRMED by direct read on 2026-08-21, so item 9’s closing
      exemption sentence should be struck when item 9 is implemented.
      strategyFingerprint (packages/intentionsutil/src/router.ts:103-113) hashes
      a six-key allowlist and nothing else: statement, clarifications,
      attributes.conditions, serves, success_signal, tooling_goals. Because it
      is an allowlist rather than a denylist, every other attributes key —
      attributes.align_round included, alongside the priority_log and
      queue_summary the body cites — is freeze-inert by construction, and no
      exemption mechanism needs building. Finding (i) had asked that this
      allowlist be verified before being relied on; this entry is that
      verification."
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "SIDE A — a recorded condition on the serving strategy has failed,
    measured, so this node cannot be planned against it.
    strategy-discovered-requirements' authored-boost condition states that the
    boost of 8 encodes a relation, 'ranks above the rsi cluster's band', and
    that 'if the rsi cluster's band reaches 8 or above, this figure is stale and
    must be re-derived rather than defended', with re-derivation owed on edge
    churn and not only on rerank events. Measured at HEAD 53eefa33 (==
    origin/main) on 2026-08-21 with select-targets.ts: two rsi-cluster tactics
    now band at 11.333 — tactic-rsi-lens-catalog-decomposition (serves
    strategy-recursive-self-improvement) and
    tactic-supersession-edge-and-terminal (second serves edge to the same
    strategy) — while strategy-discovered-requirements' own four children, this
    node included, still band at 8.000. The same measurement against the
    2026-08-14 ratifying base b1ebf766 shows the condition holding then: top
    band 8.000 held by this strategy's children, the rsi cluster at 7.500 and
    below, tactic-rsi-lens-catalog-decomposition itself at 6.
    strategy-recursive-self-improvement's authored boost is unchanged at 6, so
    this is the condition's second path — band accumulating through
    reverse-blocked_by lineage with no author acting — which the 2026-08-14
    round added to the condition for exactly this case. The relation is now
    inverted and the condition's instruction is to re-derive rather than defend.
    RECOMMENDATION: an /align round on strategy-discovered-requirements
    re-derives the boost against the freshly measured field (rsi cluster at band
    11.333; this strategy's children at 8.000) and either restates the number so
    the intended relation holds again or records that the author now accepts
    ranking below the rsi cluster. That write is on the strategy, and THIS is a
    per-node session that may not write the strategy — which is why the park
    lands here and names the strategy's record as the incomplete half rather
    than targeting it. Nothing else blocks this node: the draft-review-gate
    condition still holds as written (verified — graph-commit carries no
    --review or --ack flag, no .claude/skills/align-review/ exists, no
    assemble-review-pack script exists, so the gate is correctly 'not yet armed'
    and the inline-pack bootstrap interim has not expired), the
    non-delegable-interview and record-as-sole-carrier conditions are
    unchallenged, and the self-consistency condition's implementing tactic still
    serves this strategy alone. Six drift observations are landed as
    clarifications on this node and are not blockers; once the boost is
    re-derived this node is ready to plan from its existing body with those
    corrections applied. CAVEAT ON THIS ROUND’S OWN COVERAGE, recorded rather
    than left implicit: one of the Workflow’s two evidence-gathering subagents —
    the clause-coverage evidence agent, whose job is to gather the current-repo
    evidence for judging every recorded condition and clarification — DIED after
    exceeding its structured-output retry cap (5 attempts, no valid output), so
    the drift review’s Side-A sweep ran on partial evidence. That cannot have
    manufactured this park: the failing condition was measured directly by the
    drift agent and then re-measured independently on the caller thread
    (select-targets.ts over the committed store; both rsi nodes’ serves edges
    read off their frontmatter; strategy-recursive-self-improvement’s authored
    boost read as an unchanged 6). It CAN have hidden an additional failing
    condition, so the drift review’s statement that the non-delegable-interview
    and record-as-sole-carrier conditions are unchallenged is less well
    evidenced than usual and should be re-checked at the sitting rather than
    taken as settled."
  since: 2026-08-21
  recommendation: "Run an /align round on strategy-discovered-requirements to
    re-derive its authored boost of 8 against the freshly measured field — the
    rsi cluster now bands at 11.333 (tactic-rsi-lens-catalog-decomposition,
    tactic-supersession-edge-and-terminal) while this strategy’s four children
    band at 8.000 — and either restate the number so the intended “ranks above
    the rsi cluster’s band” relation holds again, or record that the author now
    accepts ranking below the rsi cluster. Re-derivation, not defence, is what
    the condition itself instructs. That write lands on the strategy, which a
    per-node session may not touch, which is why this park sits on the tactic.
    While the round is open, also re-check the two conditions the partial
    clause-coverage sweep left thinly evidenced (see the caveat in the reason).
    Once the boost is re-derived, re-run /align-tactics
    tactic-align-review-skill: this node is otherwise ready to plan from its
    existing body with the seven clarifications landed this round applied — no
    other blocker was found, and the draft-review gate itself is still correctly
    not-yet-armed."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# Build the /align-review skill, the assemble-review-pack script, and the graph-commit --review receipt floor; insert the draft-review gate into /align's flow
## Draft context (2026-08-11 /align interview, v3 — two review rounds run on this round's own draft, the bootstrap precedent)

Authoritative doctrine: the draft-review gate **condition on
`strategy-discovered-requirements`** — re-homed there from
`strategy-graph-native-dispatch` on 2026-08-14 by the author's ratifying
round, and scoped to `/align` at the same time. Its supporting rationale
stayed behind as the clarification "Is the interview still the audit once
the draft review gate exists?" on `strategy-graph-native-dispatch`
(2026-08-11), which is still worth reading. This body carries the
implementation decomposition only — cite the strategy record, do not
restate its rationale.

**Binding scope ruling (2026-08-14), which changes what this tactic must
build.** The gate covers an `/align` round's own output ONLY: the
`strategy-*` substance the round writes, and any new node file it mints
(draft tactics, born-parked review items). A `/align-tactics`
decomposition, a `qa-fix` finding node, and a router transition are OUT of
scope. So the `--review` receipt floor must **not** make `graph-commit`
refuse every caller's write — refusing unconditionally would impose an
adversarial review round on every autonomous decomposition and every
finding-node write, which the author explicitly ruled out. The reason the
scope is asymmetric: `/align` output is the case with no downstream reader
("the interview IS the audit"), whereas an `/align-tactics` subtree is read
again at plan, implement, PR review and QA. This ruling was made while this
tactic was still unplanned, precisely so the receipt design starts from it
rather than being reworked into it.

1. New `.claude/skills/align-review/SKILL.md` — executed by an independent
   subagent launched with an explicit `model: opus` launch parameter (not
   skill frontmatter — unconfirmed honored outside context: fork). No
   drafting-session context. Also author-invocable standalone against any
   staged draft. Instructions (the requirement's words bind): consider
   alternate designs versus both the author's original requirements and the
   draft; focus on greenfield design that reconsiders assumptions in the
   existing graph; a challenge to recorded doctrine is always MATERIAL.
   Output rubric: verdict (greenfield / mostly-greenfield /
   brownfield-shaped) + requirement-clause coverage table + findings ranked
   MATERIAL/MINOR, each MATERIAL finding carrying its concrete alternate
   design. MINOR bright line (from the strategy condition): format-only —
   anything changing what the record says is MATERIAL by construction; a
   wrong-citation fix is MINOR only when the intended referent is
   unambiguous and exists, else MATERIAL (a wrong citation can conceal a
   missing doctrine home — the F4 precedent).
2. New owned script `assemble-review-pack` (home:
   `.claude/skills/align-review/scripts/`): builds the handoff pack from
   on-disk artifacts, never session narrative — requirement text captured
   verbatim at /align step 1; dump-node base JSON + exact write-node input
   JSON per edited node; each draft tactic's JSON and body; the
   design-proposals rule; origin/main renders of every touched node and
   every file the round's carrier tactics will amend; the round's freeze
   classification and delegation-sweep outcome. Interview resolutions enter
   as the drafted clarification entries themselves. The script FAILS CLOSED
   when any producer file is missing — that is what makes the pack spec
   enforceable rather than aspirational.
3. `graph-commit --review <report-file>` receipt floor, content-bound like
   `--base`: the report carries the node ids it reviewed plus a digest of
   the exact write-node input JSON it was given; graph-commit recomputes
   that digest from the staged node files and refuses on mismatch — so a
   shape-changing disposition breaks the stale round-1 receipt mechanically
   (dedicated exit code, verdict line `refused`). Gate predicate, read off
   the commit's diff: the commit creates or modifies any `strategy-*` node
   field other than the router-owned ones (`phase`, `execution`,
   `office_hours`, `reading`, `attention` stamps), or creates any new node
   file — covers new-strategy rounds, statement/rationale/signal-only
   amendments, and draft-tactic-only rounds; still excludes every
   mechanical phase-transition writer (transition-node, park-node,
   apply-node-transition touch only router-owned fields). ACK opt-out via
   an `--ack <reason>` flag graph-commit records as a commit trailer
   (graph-commit authors its own commit messages, so a message-substring
   escape hatch would have no author surface). This flag seam is also what
   a later /align-tactics extension reuses — one flag, not a redesign.
4. Amend `.claude/skills/align/SKILL.md`:
   - Producer writes for the pack (fail-closed inputs to point 2's script):
     Step 1 writes the author's requirement text verbatim to the round's
     pack dir before framing; Step 3 writes the delegation-sweep outcome;
     Step 5's materiality classification writes its verdict, including an
     explicit "no stamped open children — no freeze fires" no-op.
   - Insert the gate between draft construction and the graph-commit call
     in Step 5: assemble the pack (script), launch /align-review, hold the
     commit on its return, run the disposition rule (MATERIAL → author
     question mechanics incl. accept-as-deferral → Mode-A enrollment on
     deferral; MINOR → fold + report), re-review iff design shape changed
     (cap two rounds per bundle, then surface residue and proceed on the
     author's call), pass the report via graph-commit --review.
   - Rewrite the "interview is the audit" paragraph (currently
     SKILL.md:46-50) to the amended doctrine now recorded on the strategy
     ("the draft review is the audit's second reader, not a substitute")
     and fix its citation — the cited "clarification 2" does not carry that
     doctrine; cite the 2026-08-11 clarification instead.
   - Restate Step 6: the reviewer's coverage table is the authoritative
     condition-7 discharge (fresh-session proxy); Step 6 reconciles its own
     walk against the reviewer's table and escalates any clause the
     reviewer could not place. Instruct the reviewer to flag every fact it
     needed that is NOT in the material that will land on origin/main (the
     write-node input JSON and the draft-tactic bodies) — that list is the
     round's condition-7 defect list. (Facts appearing only in pack-context
     items — origin/main renders, the rules file, the verbatim requirement —
     are exactly the fresh-session gaps.)
   - Fix the adjacent dangling prose reference at SKILL.md:733
     (tactic-align-interview-type-doctrine — pruned node).
5. Subagent failure handling: one retry, then surface to the author —
   never a silent skip (strategy condition).
6. Implementation lane: SKILL.md/scripts paths are outside intentions/, so
   this lands via the normal tactic worktree + PR lane — never an /align
   round's direct-push (restricted to intentions/ paths by the strategy's
   own condition). graph-commit changes ship with tests (it is owned,
   offline-testable code per the scripted-path condition).
7. Arming: the strategy condition's gate reads not-yet-armed until this
   tactic lands the skill, the pack script, and the receipt flag together;
   the interim discharge is the inline-pack bootstrap subagent (two live
   runs 2026-08-11: the rsi-plan priorities round and the gate-codifying
   round itself, both producing material findings that changed the landed
   design). The interim's expiry event is this tactic's PR merging — after
   that, an inline-pack discharge is drift, not a sanctioned path.
8. Candidate, explicitly out of scope (author kept scope /align-only
   2026-08-11): extending the gate to /align-tactics' drafted plans via the
   same --review flag.
9. **Round provenance has no home in the graph — a structural gap this
   tactic must close** (added 2026-08-11, third round, from the review of
   the namespaced-rank round: six of its ten completeness defects were all
   this one gap). `/align`'s Step 5 orders the session to "record the
   classification in this round's own record/summary — the scope-inert
   verdict and the tactic ids re-stamped — as the audit trail the doctrine
   requires", but names **no field** to record it in, and none exists.
   `rounds` is not it: schema.ts declares it `/align-tactics` round
   accounting (`{count, last_completed, last_aligned}`, strategies only,
   `validateGraph` rule 12). `/align` writes only `attributes.conditions`,
   `delegated`, `divergence`, and `irreversibility`. So every round's
   freeze classification, delegation-sweep disposition, and gate-compliance
   status survive only in session narrative and die with the session — and
   the record-completeness contract (strategy clarification 31 / condition
   7) says the graph is the **sole** carrier. The observed cost is
   concrete: because the namespaced-rank round's freeze classification was
   never recorded, nothing showed that its blast-radius scan covered only
   children of `strategy-recursive-self-improvement`, and a contradiction
   left standing on `strategy-graph-drives-dispatch` went unnoticed until
   an adversarial reviewer found it.
   Scope: add an `attributes.align_round` record on the aligned strategy —
   date, requirement digest, freeze classification with its evidence set,
   delegation-sweep disposition, and the review receipt from item 3 — and
   make Step 5 write it. It is deliberately the same field the `--review`
   receipt lands in, so a round that skipped review is visible as a missing
   receipt rather than as an absence of any record at all. Note the
   fingerprint interaction: like `priority_log` and `queue_summary`, this
   field must be **exempt** from `strategyFingerprint`, or writing a
   round's own provenance would freeze that strategy's open children.
   Two provenance items are NOT in scope, having been judged
   cheap-and-ad-hoc rather than structural: quoting the author's
   requirement verbatim and naming a declined alternative both land as
   ordinary clarification prose (done for that round at d7f306a7 and its
   follow-up). And curriculum-enrollment status is deliberately **not**
   recorded: Step 5 makes Mode B enrollment implicit and forbids a
   per-node review schedule or side list, so an audit trail for it would
   contradict the doctrine it audits.

## Author ratification, 2026-08-14 — the discriminator is the CALLER

The 2026-08-14 `/align-tactics` round parked this node because item 3's
mechanism contradicted the same day's scope ruling: a gate predicate "read
off the commit's diff" fires on every explicitly scoped-out caller. The
author ratified **option (a), the caller-declared seam**, in the
`/dispatch-ladder` session of the same date. This section is that
ratification and the park reason's surviving content; the park itself was
cleared immediately after it landed.

**The ruling.** The scope boundary is *defined by caller* — "an `/align`
round's own output ONLY". A diff-read predicate tries to infer caller
identity from diff shape, and that inference is impossible: item 3's own
third case, a draft-tactic-only `/align` round, is diff-shaped identically
to an `/align-tactics` decomposition. When the boundary is the caller, the
discriminator must be the caller. So `--review` is a flag the CALLER
passes, and `graph-commit` refuses only a write that is *declared* under
review without a valid receipt. It never inspects the diff to decide
whether a receipt was owed.

**Accepted cost, stated plainly.** This is an opt-in floor, not the
mechanical one the condition's wording implies: a caller that omits the
flag is ungated by omission. That is the price of a caller-defined scope
and the author took it knowingly. Two mitigations belong in this tactic's
scope — `/align`'s call site is the only site that may pass `--review`,
and a lint asserts it always does.

**Verified counter-evidence for the rejected predicate.** The proposed
diff predicate would have refused `dispatch-eval-finding`'s own ledger
write, exercised live during the ratifying session (it creates a new node
file). `/align-tactics` minting tactic node files
(`.claude/workflows/align-tactics.js:154,807`), `qa-fix` finding nodes,
`dispatch-diagnose-main`'s `tactic-main-red-<sha>` node and
`/context-chunks` drafts all trip it the same way.

**Still owed by the SERVING STRATEGY, not by this node.** The
draft-review-gate condition on `strategy-discovered-requirements` scopes
the gate but records no discrimination mechanism. Ratifying it here does
not write it there, and a per-node session may not. An `/align` round on
that strategy must land the caller-declared seam as condition text; until
it does, the strategy's record remains the incomplete half.

### Two non-blocking findings from the 2026-08-14 round

Preserved here because the round that made them had no legal destination
for them (a tactic-target session may not write the serving strategy) and
would otherwise have lost them when the park cleared — the gap tracked by
`tactic-align-tactics-per-node-clarifications`.

i.  `attributes.align_round` (item 9) needs **no** `strategyFingerprint`
    exemption. The fingerprint is an allowlist — `statement`,
    `clarifications`, `attributes.conditions`, `serves`,
    `success_signal`, `tooling_goals` — so every other `attributes` key is
    already freeze-inert by construction. Item 9's closing sentence
    claiming the exemption is needed is wrong and should be dropped when
    item 9 is implemented.

ii. `graph-commit` today has only `--base`/`--expect` manifest-argument
    plumbing: no `--review` flag and no commit-trailer machinery exist
    anywhere in the script (the `-m` message is a single flat string).
    Model the refuse-before-mutation, dedicated-exit-code contract on
    **`park-node`'s `--base` pin** (`park-node:75-114` header, `:202-236`
    resolution, `:360-362` refusal — already duplicated verbatim in
    `clear-park`), NOT on `graph-commit`'s own `--base`, which auto-merges
    a stale blob via `check_base_freshness`/`run_merge_node` rather than
    refusing, and never exits 3 despite the script's own header claiming
    so at `:169`/`:1952`. Correct that stale header line in the same
    change.


## Author ruling, 2026-08-29 — DESCOPED from PR20; this node stays parked

**Ruled (author, 2026-08-29 batch-execution sitting; recorded in
`plans/dispatch-rsi-author-rulings.md` §"Ruling 7 — Position 9 Units 1 and 3 are
descoped").**

> **Ruled: DESCOPE UNITS 1 AND 3**, ship the rest of Position 9. The two units
> stay parked pending the strategy and need a follow-up position later. PR20 ships
> partial rather than fabricating a strategy the author has not written.

This node is PR20 Unit 1. **It is not built in that PR, and its park stands.** The
blocker is the one the section above already names as *"Still owed by the SERVING
STRATEGY, not by this node"*: `strategy-discovered-requirements`' authored-boost-of-8
condition holds that the boost encodes a **relation** — "ranks above the rsi
cluster's band" — and the relation is measured inverted, with two rsi-cluster
tactics banding at 11.333 while this strategy's children sit at 8.000. That
strategy has not been written since the park, and a per-node session may not write
strategy substance.

**Two independent stops, and neither is discharged here.** The maintenance-burden
band ruling of 2026-08-28 — (c) accept with remediation, whose un-park criterion
un-parks every node parked **solely** on the band — does **not** reach this node,
because the band is not its blocker. **Do not clear this park**, and do not treat
the band ruling as covering it.

**The follow-up.** These two units need their own later position, entered after an
`/align` round on `strategy-discovered-requirements` re-derives the authored boost
against the measured field. Until then the four deliverables recorded in
`plans/dispatch-rsi-serialized-pr-plan.md` under PR20 Unit 1 are a **reference
spec for that follow-up only**, not anyone's current scope.
