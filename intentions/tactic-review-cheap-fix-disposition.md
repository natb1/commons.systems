---
id: tactic-review-cheap-fix-disposition
kind: tactic
statement: "review-phase cheap-fix disposition: the residue classify step fixes
  cheap out-of-contract findings in scope and defers only expensive ones
  (fix-everything-cheap doctrine, cost as a second resolve-in-scope trigger
  refining clarification 19)"
owner: ai
status: codified
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
phase: done
execution:
  branch: tactic-review-phase-trust-builtin-review
  pr: 2887
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-07-19T03:55:40Z
    mergeCommitSha: d8937946d7ad6530ced429adbbcffacdd103feef
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
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


## Author ruling, 2026-08-29 — this node is a COMPLETION RECORD

**Ruled (author, 2026-08-29 batch-execution sitting; recorded in
`plans/dispatch-rsi-author-rulings.md` §"Ruling 1").** A draft whose substance
shipped under a sibling carrier becomes a **completion record**: stamp
`execution.completion` against the carrier PR, move `status: raw → codified` and
`phase: null → done`, and **do not prune**. Disposition (b) PRUNE, which the
2026-08-19 park offered as the cheaper option for this node specifically, is
**rejected** — the ruling preserves provenance and the reason the work existed
even where nothing unique would be lost.

**Applied here.** Carrier is the sibling `tactic-review-phase-trust-builtin-review`,
which shipped as PR #2887 (merge `d8937946`, 2026-07-18) five days after this node
was recorded (`830e9da0`, 2026-07-13). That sibling's node file was pruned from
`intentions/` on 2026-07-19 (`df623fb5`), which is why no sibling survives in the
census to show the overlap. **Do not re-plan this node** — authoring units that
rebuild the shipped fork at `review-fix.js:3504-3511` is dead work.

### What shipped, verified bullet by bullet at origin/main `0b5742ee`

Retained from the 2026-08-19 park because clearing the park destroys the field.

- **Bullet 1 — the cheap-vs-expensive fork in residue classification.** Landed at
  `.claude/workflows/review-fix.js:3504-3511`, inside `residuePrompt` (declared
  `:3473`), the one opus residue-disposition agent. `git log -L
  3504,3512:.claude/workflows/review-fix.js` attributes those exact lines to
  `d8937946` as a net-new block. Backing schema is `RESIDUE_SCHEMA` (`:307-351`),
  `disposition` enum `resolve|defer|ignore`, `in_contract` boolean the entry-19
  axis kept alongside cost.
- **Bullet 2 — contract-breaking always resolves; the ignore category untouched.**
  `:3505-3507` ("ALWAYS, regardless of cost") and `:3512-3515`. Cost appears
  nowhere in the ignore branch, as the strategy body's Review & QA Disposition
  section requires.
- **Bullet 3 — the PR-comment audit trail records EVERY disposition.**
  `:3627-3650` builds an audit entry per dispositioned item with an explicit
  bucket mapping (resolve+verified → Fixed, resolve+unverified → Required,
  ignore → Informational, defer → Deferred), pushed unconditionally at `:3650`,
  merged at `:3860`, emitted at `:4021`. Undispositioned residue is surfaced
  rather than dropped (`:3653-3668`).
- **The recorded open question is answered in code.** Where the
  cheap-vs-expensive judgment lives resolves to the first option this node itself
  proposed: a prose heuristic inside the opus residue agent's prompt, with **no**
  mechanical cost signal anywhere in `review-fix.js`.

### Stale anchors in this node's own body, corrected

The body cites `review-fix.js:548-640` for classify/defer/file and `:863-` for
deferred filings. Both are stale — the file is now 4385 lines and `d8937946`
restructured it into two lanes. **Current anchors:** residue disposition prompt
`:3473-3536`; the residue phase's agent call `:3538-3546`; deferred-filing
construction `:3605-3625`; audit-entry construction `:3626-3650`; Lane-B's own
(unrelated, scope-keyed, not cost-keyed) classify prompt `:2148-2178`.

### Owed on the serving strategy, not written by this node

`strategy-graph-native-dispatch`'s body section "Review & QA Disposition" ends its
entry-59 paragraph with *"Implementation retained as draft
tactic-review-cheap-fix-disposition."* That sentence is now **false** — the
implementation merged 2026-07-18 in PR #2887 under
`tactic-review-phase-trust-builtin-review`, encoded as a prose heuristic at
`.claude/workflows/review-fix.js:3504-3511` with no mechanical cost signal.
Leaving it as-is is the record gap that made this node look plannable. That
correction on the serving strategy is OWED AND NOT YET APPLIED — it was held
back because the park's RULING 1 is unanswered, not because it was judged
wrong.
