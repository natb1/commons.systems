---
id: tactic-align-indifference-option
kind: tactic
statement: Encode the three-state decision model into the /align skill surface —
  question rounds offering recommendation / delegate-pending-review /
  delegate-review-declined, stamps not minted review nodes, the
  motivation-coherence separation dual, and compel-from-doctrine-only type-b
  probes
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-08-30 /align interview. The graph now records
  the doctrine (strategy-explicit-intent's two 2026-08-30 clarifications, plus
  the dated amendments to its 8th and 9th clarification entries — 'What
  interview types do align sessions run' and 'What does a deferral commit the
  author to'); the skill prose that binds an interview session still describes a
  two-option round, so a session reading only the skill would not offer the
  third option. SERVES CORRECTED 2026-08-30 by the round's own adversarial
  review (finding F7): this node first served strategy-explicit-intent on the
  artifact-owner rule (strategy-graph-native-dispatch clarification 27),
  reasoning that node's rationale names 'the align dialectic' among its
  artifacts. That was wrong. strategy-discovered-requirements is /align's
  charter node — it carries the /align actuator tooling_goal and records the
  operational boundary 'a tactic that changes what the interview elicits, or
  what the record must carry, serves this strategy', with a precedent of moving
  exactly such a tactic off strategy-explicit-intent as a refinement to a more
  specific home (tactic-align-strategy-new-steps-revision). A three-option
  interview round is the paradigm case. The mis-serve was not cosmetic: it cost
  this node the author-directed tier-1 boost on the charter strategy and
  stripped the draft-review-gate and self-consistency conditions from its
  ancestry projection."
reading: null
serves:
  - strategy-discovered-requirements
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Encode the three-option interview round — recommendation, accept-as-deferral, indifference-as-delegation — plus the virtue/strategy-core floor and the revision-authority rule, into the /align skill surface

Retain-not-refine draft from the 2026-08-30 /align interview. Not a plan.

## The gap

The doctrine landed on `strategy-explicit-intent` this round (two new 2026-08-30
clarifications, plus dated amendments to its 8th and 9th clarification entries —
"What interview types do align sessions run" and "What does a deferral commit the
author to", both findable by their `AMENDED 2026-08-30` stamps). The skill prose
an interview session actually reads has not moved: `.claude/skills/align/SKILL.md`
still describes a **two**-option round in two places — "Question mechanics", item
3 ("an explicit accept-as-deferral option alongside plain acceptance"), and the
"Deferral mechanics" subsection, which opens "A deferral is always
defer-until-later-review" and states that **every** deferral produces exactly one
born-parked review item. A session reading only the skill would not offer the
third option, and would mint a review item for an indifference answer.

## What to encode

- **Three options, every round, both interview types.** Recommendation with its
  boldness assessment; accept-as-deferral; indifference.
- **Indifference is a delegation, not a deferral.** It lands as a dated
  clarification marked Claude-owned and mints **no** review node. The
  "Deferral mechanics" typology (reading chunk vs office-hours sitting) applies
  only to review-later deferrals, which are otherwise unchanged — they still
  mint their born-parked node at deferral time, text-grounded or not.
- **The floor.** Indifference is unavailable for virtue substance and for a
  strategy's `statement`, `rationale`, and `success_signal`. Available for
  mechanism, encoding, tactic shape, naming, sequencing, and the clarifications
  resolving those. At the floor Claude may not compel: re-frame the question
  until it is answerable, or record that the author declined to hold a view —
  which is itself author doctrine.
- **Revision authority.** Neither deferred nor indifference-delegated content is
  doctrine. Indifference-delegated content is freely and silently revisable as
  ordinary design work. Review-deferred content is revisable too, but the
  revision carries forward: the pending review node re-points at the revised
  content and the revision is recorded, so a sitting never reviews a superseded
  draft.
- **No per-decision delegation-record extension.** An indifference-delegation
  does not extend a delegation node's `attributes.delegated` in-round — that
  would reintroduce the per-decision pollution the option exists to avoid. This
  is the deliberate asymmetry with a deferral to Claude's philosophical
  articulation, which *does* extend
  `delegation-philosophical-articulation` in-round. Keep that contrast explicit
  in the prose; it is the part most likely to be "corrected" back by a later
  reader who sees only the older rule.

## Scope note

Only `/align` runs interview rounds — `/align-tactics` never calls
`AskUserQuestion` mid-run, so its skill surface is out of scope. `/reading-review`
and the office-hours skills present author choices but are not interviews in this
sense; whether the three-option convention should extend to them is an open
question for the round, not a settled requirement.

## Marker convention is undecided

The doctrine says indifference-delegated content is "marked Claude-owned" but
does not say how. A structured field, a prose convention in the clarification
answer, or reuse of an existing marker are all open. It sits below the 2026-08-30
floor (encoding), so the round decides it as a Claude-owned delegation rather
than escalating — but it must be decided *once* and consistently, since the
review-debt signal and the virtual review node
(`tactic-node-review-skill`) both need to tell the two content classes apart.

## Open decision, restored 2026-08-30 (adversarial review F9)

**Should `delegation-anthropic-claude` carry a one-time, class-level record of
indifference-delegated decisions?**

Considered during the 2026-08-30 interview and then LOST — the round's own
provenance note claimed it had been "deferred to the draft tactic", but it was in
neither tactic body. The round's adversarial review caught the false disclosure
(F9) and the substantive gap behind it (F10). Restored here as an explicitly open
decision so it is carried rather than silently dropped a second time; it is NOT
decided here.

The tension, stated fairly both ways:

- **Against any record.** The 2026-08-30 doctrine deliberately rules out
  per-decision extension of a delegation record's `attributes.delegated` — that is
  exactly the per-decision graph pollution the third option exists to remove.
- **For a class-level record.** `kind-delegation` holds that "attachments are
  audited however acquired", and indifference-delegations are currently invisible
  to the whole delegation apparatus: the audit surface, the divergence ×
  irreversibility capture-visibility ranking, and
  `strategy-exercise-recovery-paths`' portfolio review all miss a growing class of
  Claude-owned decisions. The review-debt signal does not close this — it counts
  un-reviewed *nodes*, so a node carrying nine indifference-delegations and one
  carrying none weigh identically.
- **The reviewer's proposal**, offered as the resolution and not yet adopted: one
  line, once, on `delegation-anthropic-claude`'s `attributes.delegated` — naming
  the class, stating that instances are individually unrecorded by design, and
  pointing at the aggregate measure. Anti-pollution goal intact; the delegation
  apparatus regains sight of the class.

This goes to the design-question interview following the 2026-08-30 review, along
with the review-priority metric, the floor boundary, the change-gate detection
path, the Claude-owned marker convention, and the review-debt threshold.

## SUPERSEDING UPDATE — 2026-08-30 continuation round (read this first)

The adversarial-review disposition interview reshaped this node's scope. The
sections above are retained as history; where they conflict with this section,
this section wins. Authoritative doctrine: `strategy-explicit-intent`'s
2026-08-30 three-state clarification and the amended entries it names.

**What changed:**

- **The floor is retired.** The "What to encode / The floor" section above is
  superseded: no decision class is barred from delegation. Delegation depth is
  priced by `strategy-graph-mounts`' capture model, not forbidden.
- **Three-state vocabulary.** The question-round options are now: the
  recommendation (author-ratified doctrine if accepted),
  **delegate-pending-review**, and **delegate-review-declined**. "Accept-as-
  deferral" and "indifference" map onto the two delegated states.
- **Nothing mints.** Review items are fully virtual — a delegated-pending-review
  stamp IS the review record; the queue derives from stamps. The "Deferral
  mechanics" subsection of `/align`'s SKILL.md (born-parked minting, the
  reading-chunk/office-hours-sitting typology at deferral time) rewrites
  entirely. Reading chunks survive as stored content nodes, minted lazily by the
  reading program.
- **The marker convention is resolved by the schema delegation.** The "Marker
  convention is undecided" section above is superseded: the structured
  decision-stamp schema (state, delegatee mount id, dates) plus its enforcing
  lint are delegated to Claude, pending review. Interim carrier: dated prose
  ownership tags.
- **The open delegation-record decision is RESOLVED** (pending review): the
  dual-carry pair landed — a class-level hand-assessed entry on
  `delegation-anthropic-claude`, with the derived side implied by stamps naming
  the mount.
- **Type-b probes compel from doctrine only** — the interview-types section of
  the skill gains this rule.
- **Multi-topic separation gains its dual**: decompose along motivation
  profiles (different `serves` set or graft constraints), not only along
  independent success signals — the motivation-coherence clause on
  `strategy-graph-mounts`.

**Encoding checklist for the implementing round** (all in
`.claude/skills/align/SKILL.md` unless noted): Question mechanics item 3 →
three options in state vocabulary; Deferral mechanics → stamps, no minting,
lazy reading chunks; Step 1.1 → motivation-coherence dual; interview-types
section → compel-from-doctrine-only; Step 5 Mode A enrollment → superseded by
stamps; Step 5 record construction → write ownership tags (interim) or stamps
(once schema lands).
