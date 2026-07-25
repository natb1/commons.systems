---
id: tactic-budget-strategy-review-reading
kind: tactic
statement: "read the caught-up budget metrics and let them direct strategy: with
  13 months of merged statements published, the author reviews the resulting
  financial picture and records what it changes about strategy-recover-finance's
  direction — the first strategy-review-class office-hours sitting"
owner: human
status: raw
parent: null
rationale: "Born parked 2026-07-25 by author direction, at the close of the
  office-hours drain sweep, as the first node in the new strategy-review park
  class (see tactic-office-hours-session-type-strategy-review). The drain
  re-parked tactic-budget-monthly-sync-reading as an author-only OPERATIONAL run
  — get the pipeline caught up through 2026-07. This node is the separate
  strategy-review dimension the author named: once numbers exist, someone has to
  READ them and let them move strategy, and that is not the same labor as running
  the sync. It is filed as its own node because the two have different blockers
  (the sync needs a GPG-warmed shell and a mounted archive; this needs a
  published snapshot and the author's judgment) and different failure modes (the
  sync can complete and still leave the metrics unread — which is the state
  strategy-recover-finance is in today: reading: null, gap: null, rounds.count 1,
  so no reading has EVER been stamped against it despite the strategy being
  codified). Park class labelled in prose because the structured field does not
  exist yet: validateOfficeHours (schema.ts:571-580) rebuilds the park from
  exactly {reason, since, recommendation}, so a session_type key added today is
  silently dropped, not rejected."
reading: null
gap: null
serves:
  - strategy-recover-finance
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by:
  - tactic-budget-monthly-sync-reading
office_hours:
  reason: "strategy-review sitting (park class: STRATEGY REVIEW — the third
    office_hours.session_type class, author-directed 2026-07-25; the structured
    enum member does not exist yet, so this prose label is the class marker and
    tactic-office-hours-session-type-strategy-review backfills it). Author-only
    by nature, not by credential: the labor IS the author reading financial
    metrics and deciding what they change about strategy. Blocked until
    tactic-budget-monthly-sync-reading publishes a caught-up snapshot — there are
    no current metrics to review. As of 2026-07-25 the last published snapshot is
    budget-2026-06-05T16-57-15.enc.json (data through early June) and statements
    through 2026-07-05 are staged unmerged, so a review run now would read a
    13-month-stale picture and mis-direct strategy. No autonomous path exists:
    the input is real financial data behind a GPG-guarded snapshot and the output
    is a strategy direction, which is the author's to set."
  since: 2026-07-25
  recommendation: >-
    ## Office-hours recommendation — `tactic-budget-strategy-review-reading`
    (STRATEGY REVIEW class)


    Do not schedule this before `tactic-budget-monthly-sync-reading` has run and
    published. It has no independent setup: the sync sitting produces this
    sitting's only input. Pairing them back-to-back in one session is the
    efficient shape — the mount and GPG cache are already warm — but they are
    separate sittings with separate outputs, and running the sync does NOT
    discharge this node.


    When the snapshot is fresh, the sitting is a read-and-decide pass, not a
    data-entry pass:


    1. Open the hosted budget app against the new snapshot. Confirm it spans
       through 2026-07 rather than stopping at early June.

    2. Read the picture across the whole caught-up range, not just the newest
       month — the value of a 13-month catch-up is the trend, and a single-month
       read wastes it.

    3. Check the divergence surface. The sync's own park notes one account with a
       known small same-month residual that is expected to appear there rather
       than fail the merge; adjudicate it in the app. A residual that is LARGER
       than expected, or on a different account, is a pipeline signal and should
       be reported against the sync node rather than absorbed silently here.

    4. Decide and record what the numbers change. Concretely: does
       `strategy-recover-finance`'s success_signal still describe what the author
       wants ("every month's financial picture assembled by the owned pipeline
       from bank exports", threshold "statements merged and categorized monthly
       with no SaaS budgeting service holding the data")? Monthly cadence is
       currently NOT being met — the catch-up itself is the evidence — so the
       honest options are to re-commit to the cadence with a mechanism that makes
       it stick, or to amend the threshold to what the author will actually
       sustain. Either is a legitimate outcome; leaving the signal asserting an
       unmet cadence is not.

    5. Stamp the reading. `strategy-recover-finance` has `reading: null` and
       `gap: null` and has never carried one. PR #2842 merged 2026-07-25 adds the
       reading-stamp sub-step to the `/budget` skill so the SYNC stamps the month
       reached automatically; if that fires, this sitting's job is the GAP —
       the distance between the stamped reading and the success_signal threshold
       — not the reading itself. If the stamp did not fire, that is a defect in
       #2842's work worth reporting, not a manual step to paper over.

    6. Route the outcome. A direction change belongs in an `/align-strategy`
       round against `strategy-recover-finance` (its clarifications are where
       direction decisions live), not in this tactic's body. This node closes
       when the reading and gap are recorded and any direction change is either
       captured as a clarification or explicitly declined.


    Judgment call reserved for the author: whether the owned-pipeline approach is
    still worth its operating cost at all. The catch-up backlog is itself
    evidence about sustainability, and a review that cannot reach "keep going /
    change shape / stop" is not a strategy review. Nothing in this
    recommendation presumes the answer.
pace_exempt: false
rounds: null
attributes: {}
---
# Read the caught-up budget metrics and let them direct strategy

## Context

`strategy-recover-finance` is `codified` with a concrete success signal —
"every month's financial picture assembled by the owned pipeline from bank
exports", sensed by "the budget app and its encrypted snapshot history", at the
threshold "statements merged and categorized monthly with no SaaS budgeting
service holding the data" (`strategy-recover-finance:75-82`).

It carries `reading: null` and `gap: null`. No reading has ever been stamped
against it. The pipeline has been built and repeatedly fixed —
`tactic-budget-txn-identity`, the overlapping same-month anchor work
(`f5238deb`, `6254afac`, `fb572eed`), and the reading-stamp sub-step in PR
#2842 — but the numbers it produces have never been read back against the
strategy that justified building it.

That is the gap this node names. It is deliberately *not* the sync run: that is
`tactic-budget-monthly-sync-reading`, re-confirmed as an author-only operational
park on 2026-07-25.

## Why this is a strategy-review sitting

The author introduced `strategy-review` on 2026-07-25 as the third office-hours
park class, alongside `requirement-discovery` and `curriculum-review`. Its
defining shape: **the input is metrics, not a question.** The author reads
numbers and the output is a direction for strategy.

This node is the motivating case. There is no requirement ambiguity to resolve
and no reading list to work through — there is a financial picture to look at and
a judgment to make about whether the strategy it serves still holds.

The structured `office_hours.session_type` field does not exist on main yet (PR
#2961 introduces the enum; `tactic-office-hours-session-type-strategy-review`
adds this member and backfills this node), so the class is recorded in prose in
the park reason above. Do not add a `session_type` key to the park before that
lands: `validateOfficeHours` reconstructs the park from exactly
`{reason, since, recommendation}` (`packages/intentionsutil/src/schema.ts:571-580`),
so the key would be silently dropped by the next `writeNode` rather than
rejected — a false record.

## Scope

This node produces a *recorded reading and gap*, plus a routed direction
decision. It does not change the pipeline. Concretely, on completion:

- `strategy-recover-finance.reading` names the month the published snapshot
  actually reaches.
- `strategy-recover-finance.gap` states the distance from that reading to the
  success-signal threshold in the threshold's own terms (monthly cadence, no SaaS
  holding the data).
- Any direction change is captured as a clarification on
  `strategy-recover-finance` via `/align-strategy`, or explicitly declined.

Out of scope: running the statement merge (that is
`tactic-budget-monthly-sync-reading`); the live pipeline checklist (that is
`tactic-mainqa-budget-pipeline`); any code change.

## Verification

Not machine-verifiable — the deliverable is a recorded judgment. The completion
check is by inspection:

- `strategy-recover-finance` carries a non-null `reading` naming a month that
  matches the newest published snapshot, and a non-null `gap`.
- The gap statement is falsifiable against the success-signal threshold rather
  than restating it.
- Either a new clarification records the direction decision, or the sitting
  recorded why no direction change was warranted.

## Dependencies

`tactic-budget-monthly-sync-reading` must publish a caught-up snapshot first —
it is this node's only source of input. Recommended to run in the same session
immediately afterwards while the mount and GPG agent cache are warm, without
treating the two as one unit of work.
