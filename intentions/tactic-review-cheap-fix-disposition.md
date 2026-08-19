---
id: tactic-review-cheap-fix-disposition
kind: tactic
statement: "review-phase cheap-fix disposition: the residue classify step fixes
  cheap out-of-contract findings in scope and defers only expensive ones
  (fix-everything-cheap doctrine, cost as a second resolve-in-scope trigger
  refining clarification 19)"
owner: ai
status: raw
parent: null
rationale: Surfaced 2026-07-13 /align-strategy interview recording the
  fix-everything-cheap clarification (cost as a second resolve-in-scope trigger
  refining clarification 19). Implements the disposition-policy change in
  review-fix.js's residue-classification step.
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
blocked_by: []
office_hours:
  reason: >-
    SCOPE FULLY LANDED UNDER A SIBLING CARRIER — no plan authored, no phase
    written.


    Parked by the 2026-08-19 /align-tactics per-node (tactic-mode) run. Every
    claim

    below was verified against origin/main 0b5742ee in this run by reading the
    code

    and `git log -L`, not taken from the node body's word.


    WHAT SHIPPED. All three of this node's "Scope (to be decomposed by

    /align-tactics)" bullets are already in service, and its one recorded "Open

    question for /align-tactics" is already answered in code. The carrier is the

    SIBLING node named in this node's own "Overlap / sequencing" section —

    tactic-review-phase-trust-builtin-review — which shipped as PR #2887 (merge

    d8937946, 2026-07-18) five days after this node was recorded (830e9da0,

    2026-07-13). That sibling's node file was pruned from intentions/ on
    2026-07-19

    (df623fb5, "graph: reconcile merged/closed tactics"), which is why no
    sibling

    node survives in the census to show the overlap.


    The sibling did not merely touch the same surface — it planned this node's

    substance as its own unit. Its pre-prune body (git show
    df623fb5^:intentions/

    tactic-review-phase-trust-builtin-review.md) cites "the 2026-07-13

    fix-everything-cheap amendment (to clarification 19)" at its line 73 and
    carries

    the resolve/defer rule text verbatim at its lines 208-215.


    Bullet by bullet, against origin/main 0b5742ee:


    - BULLET 1, the cheap-vs-expensive fork in the residue classification.
      Landed at .claude/workflows/review-fix.js:3504-3511, inside `residuePrompt`
      (declared :3473), the ONE opus residue-disposition agent:
        "- Resolve (apply the fix to the working tree): confirmed AND breaks the
           tactic's own contract ... ALWAYS, regardless of cost; OR confirmed
           out-of-contract AND cheaper to fix than to defer.
         - Defer (file a follow-up, do not edit): confirmed, real, out-of-contract,
           and EXPENSIVE to fix ..."
      `git log -L 3504,3512:.claude/workflows/review-fix.js` attributes these exact
      lines to d8937946 as a net-new block. The schema backing it is RESIDUE_SCHEMA
      (:307-350), whose `disposition` enum is resolve|defer|ignore and whose
      `in_contract` boolean is the entry-19 axis kept alongside cost.

    - BULLET 2, contract-breaking always resolves and the ignore category is
      untouched. Landed at :3505-3507 ("ALWAYS, regardless of cost") and :3512-3515
      (ignore = refuted / unreachable / below-threshold / defensive-fallback
      contrary to code-style). Cost appears nowhere in the ignore branch, exactly as
      the strategy body's Review & QA Disposition section requires.

    - BULLET 3, the PR-review-comment audit trail records EVERY disposition, the
      cheap-fixed ones included. Landed at :3627-3650: every dispositioned item
      builds an audit `entry` with an explicit bucket mapping — resolve+verified
      applied -> Fixed, resolve+unverified -> Required, ignore -> Informational,
      defer -> Deferred — pushed unconditionally to `laneADispositions` at :3650.
      That array is merged into the returned `dispositions` at :3860 and emitted at
      :4021, which /review-fix SKILL.md Step 6 renders into the single PR comment.
      Undispositioned residue is also surfaced rather than dropped (:3653-3668).

    - THE OPEN QUESTION ("where the cheap-vs-expensive judgment lives — a
    heuristic
      in the classifier subagent's prompt versus any mechanical signal") is answered
      in favor of the first option the node itself proposed: a prose heuristic
      inside the opus residue agent's prompt, with NO mechanical cost signal
      anywhere in review-fix.js. That resolution is recorded only in code; it is not
      written back to the graph anywhere.

    STALE ANCHORS IN THIS NODE BODY, CORRECTED. The body cites review-fix.js

    ":548-640" for the classify/defer/file logic and ":863-" for the deferred

    filings. Both are stale — the file is now 4385 lines and d8937946
    restructured

    it into two lanes. Today: the residue disposition prompt is :3473-3536, the

    residue phase's agent call is :3538-3546, the deferred-filing construction
    is

    :3596-3625, the audit-entry construction is :3626-3650, and Lane-B's own

    (unrelated, scope-keyed, not cost-keyed) classify prompt is :2148-2178. A
    future

    session that trusts the body's anchors reads unrelated code.


    STRATEGY-RECORD CORRECTION OWED (not written by this session — a per-node

    tactic-target run may never write the serving strategy). The

    strategy-graph-native-dispatch body, section "Review & QA Disposition", ends
    its

    entry-59 paragraph with "Implementation retained as draft

    tactic-review-cheap-fix-disposition." That sentence is now false: the

    implementation is merged and this node is its only surviving trace. The same

    paragraph's account of entry 51 is accurate and needs no change.


    FOURTH INSTANCE OF THE SAME SHAPE, and the first where the draft was NEVER

    rewritten into a completion record. A draft tactic whose recorded substance

    shipped under a sibling carrier has now parked four times with no ratified

    convention: tactic-audit-permission-friction (2026-08-18, 9ced5777),

    tactic-code-review-detached-node-lock (2026-08-19, 63640767),

    tactic-dispatch-code-review-concurrent-write-attribution (2026-08-19,
    649a7cce,

    the partial case), and this node. The first three all read in completed
    voice,

    which was the documented tell; this one still reads as a live draft ("Scope
    (to

    be decomposed by /align-tactics)", "Open question for /align-tactics") and

    still has execution: null with no half-stamp, so the prose tell does not
    fire

    at all. Only dating the node against the carrying merge and re-reading the

    target file surfaced it. That widens the standing ruling's scope: the

    convention must be mechanical, because the body's voice is not a reliable

    discriminator.
  since: 2026-08-19
  recommendation: >-
    One author ruling, then this node closes mechanically. There is no residual

    implementation to plan — unlike the partial case (649a7cce), every recorded

    bullet here is landed and the recorded open question is answered.


    RULING — the standing convention for a draft whose substance shipped under a

    sibling carrier. Rule on this node together with the three already parked

    awaiting the same ruling — tactic-audit-permission-friction (9ced5777),

    tactic-code-review-detached-node-lock (63640767), and

    tactic-dispatch-code-review-concurrent-write-attribution (649a7cce) — in one

    office-hours sitting, and record the outcome as a clarification on

    strategy-graph-native-dispatch so a fifth instance is dispositioned

    mechanically instead of parking again.


    This node is the cleanest of the four for setting the rule: fully landed, no

    residual, no partial-scope wrinkle. Decide it first and let the harder ones

    inherit. The two dispositions on the table:

      (a) COMPLETION RECORD. Stamp the node against the carrying PR and retire it.
          Because the phase ladder has no null->done transition, transition-node
          cannot do this — it is dump-node.ts + a jq patch + write-node.ts +
          `graph-commit -C <repo-root>`, setting status: raw -> codified,
          phase: null -> done, and (optionally) execution.pr = 2887 /
          execution.branch to the carrier's. Note the honest wrinkle: execution.pr
          would then point at a PR this node never dispatched, which is the reason
          the ruling is an author call and not a script.

      (b) PRUNE. Cheaper, and defensible here precisely because nothing is lost:
          unlike 649a7cce, this node records no open gap, no unverified residual,
          and no analysis that exists nowhere else. Its only unique content is the
          recorded open question, and that question is now answered in code. If the
          ruling is (b), delete the node and let the merged code plus the strategy
          body's entry-59 paragraph carry the record.

    Do NOT re-plan this node as written under either ruling — authoring units
    that

    rebuild the shipped fork at review-fix.js:3504-3511 is dead work.


    TWO SMALL EDITS TO MAKE IN THE SAME SITTING, whichever ruling lands:

      1. strategy-graph-native-dispatch body, section "Review & QA Disposition":
         replace the trailing sentence "Implementation retained as draft
         tactic-review-cheap-fix-disposition." with the merged fact — shipped
         2026-07-18 in PR #2887 (merge d8937946) under
         tactic-review-phase-trust-builtin-review, encoded as a prose heuristic in
         the residue agent's prompt at .claude/workflows/review-fix.js:3504-3511
         with no mechanical cost signal. Leaving the sentence as-is is the record
         gap that made this node look plannable.

      2. Consider whether the mechanical discriminator the ruling needs is already
         buildable: a census check that flags any phase-absent tactic whose serving
         strategy's body or a merged PR title names it as "retained as draft" while
         the cited implementation surface has since changed. The existing hook is
         packages/intentionsutil/scripts/align-tactics-census.ts (its
         `classification` field already separates draft from born-parked); this
         would be a fourth classification, not a new script.
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# review-phase cheap-fix disposition: fix cheap out-of-contract findings in scope, defer only expensive ones

> Draft context retained by `/align-strategy` on 2026-07-13 — not yet a
> finalized unit plan. `/align-tactics` decomposes this into PR-sized units.

## Context

`strategy-graph-native-dispatch`'s 2026-07-13 fix-everything-cheap
clarification adds **cost** as a second resolve-in-scope trigger to
clarification 19: a confirmed finding is resolved in the review phase's
content-fix loop when it either breaks the tactic's contract (clar 19's
original trigger) **or** is cheaper to fix than to defer; only a confirmed
out-of-contract finding that is *expensive* (a real refactor) defers to a
draft tactic. Cost touches only the resolve↔defer boundary — the ignore
category (refuted / unreachable / below-threshold / defensive-fallback) is
unchanged.

Today `review-fix.js`'s residue-classification step
(`.claude/workflows/review-fix.js`, the classify → defer → file logic around
`:548-640` and the deferred filings around `:863-`) routes every confirmed
out-of-contract finding straight to a deferred filing. This tactic changes
that step into a fix-cheap / defer-expensive fork.

## Scope (to be decomposed by /align-tactics)

- In the residue classification, add a cheap-vs-expensive determination for
  confirmed out-of-contract findings: **cheaper-to-fix-than-to-defer** →
  route to the in-scope fix lane (the review phase's content-fix loop, before
  the `review → done` transition); **expensive** → the existing
  deferred-filing path (draft tactic per component).
- Leave contract-breaking findings (always resolve) and the ignore category
  exactly as clar 19 sets them — cost touches only resolve↔defer.
- Keep the PR-review-comment audit trail recording **every** disposition,
  the cheap-fixed ones included, so a fixed-in-PR finding is still recorded
  (graph-as-sole-tracker, clar 30).

## Overlap / sequencing

Shares the `review-fix.js` residue-disposition surface with
`tactic-review-phase-trust-builtin-review` (which drops the findings-only
wrapper and routes the review skills' *unfixed residue* through the same
classify → defer → file logic). `/align-tactics` should sequence the two
together: trust-builtin defines **what** reaches the residue step; this
defines **how** that residue is dispositioned by cost. Neither changes clar
19's three-way structure or its adversarial-confirm requirement.

## Open question for /align-tactics

Where the cheap-vs-expensive judgment lives — a heuristic in the classifier
subagent's prompt ("cheaper to fix than to defer"; examples: reuse a helper /
consolidate a read / add validation / tighten a regex = cheap; an algorithmic
rewrite or a new data structure = expensive) versus any mechanical signal.
The clarification records the *principle*, not a code rule; decomposition
picks the encoding.
