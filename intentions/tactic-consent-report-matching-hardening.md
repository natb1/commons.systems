---
id: tactic-consent-report-matching-hardening
kind: tactic
statement: "Harden household-consent-report consent matching before consent
  entries are recorded: resolve superseding/revoking entries by recency so a
  later household decision is never hidden behind an earlier one, and surface
  consent entries whose move matches no current recovers-edge instead of
  silently dropping them"
owner: ai
status: raw
parent: null
rationale: "Deferred residue from the /review-fix review of
  tactic-household-consent-instrument (PR #2864). The report's consent matching
  in packages/intentionsutil/scripts/household-consent-report.ts (buildReport)
  resolves a move's consent via Array.prototype.find (first match) and never
  cross-checks consent[].move against the recovering strategies. Once
  tactic-household-consent-offering starts recording consent entries, two latent
  gaps bite: a superseding/revoking entry is hidden behind an earlier one
  (undermining 'no household objection is routed around'), and a consent whose
  move id is stale/renamed silently disappears from the review. Correct
  resolution depends on the consent-recording semantics owned by
  tactic-household-consent-offering (how supersession/revocation is
  represented), so it was scoped out of the instrument tactic, whose consent
  arrays are all empty. Recorded as a draft by /review-fix on 2026-07-12;
  /align-tactics finalizes."
reading: null
gap: null
serves:
  - strategy-household-shared-attachments
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
# Harden household-consent-report consent matching before consent entries are recorded: resolve superseding/revoking entries by recency so a later household decision is never hidden behind an earlier one, and surface consent entries whose move matches no current recovers-edge instead of silently dropping them

> Draft context retained by `/review-fix` on 2026-07-12 (deferred residue of the
> review of `tactic-household-consent-instrument`, PR #2864) — not yet a
> finalized unit plan. `/align-tactics` decomposes this into PR-sized units and
> re-validates the provenance below against what actually merged.

## Context

`strategy-household-shared-attachments`' sensor is the office-hours owner review
over the delegation records, and `household-consent-report.ts` is the report it
works from. That report's consent matching carries two latent correctness gaps
that do not bite today — every delegation record's `consent` array is empty,
because writing consent entries is `tactic-household-consent-offering`'s job —
but will bite the moment consent is recorded. Both were surfaced by the
`/review-fix` review of PR #2864 and deferred here rather than fixed in the
instrument tactic, because their correct resolution depends on the
consent-recording semantics `tactic-household-consent-offering` owns.

- **Superseding/revoking entry hidden** —
  `packages/intentionsutil/scripts/household-consent-report.ts:166`
  (`household.consent.find((c) => c.move === strategyId)`). `Array.prototype.find`
  returns the first matching entry. Failure scenario: a move's `consent` holds
  `{date: 2026-06-01, decision: "approved"}` then a later
  `{date: 2026-07-10, decision: "declined — revoked"}`; the report renders the
  older `approved` and the summary counts the move as covered, so the
  household's later revocation is invisible to the review — the exact
  "no household objection is routed around" case the threshold exists to catch.
- **Orphaned consent move silently dropped** —
  `packages/intentionsutil/scripts/household-consent-report.ts:160` (`buildReport`
  never cross-checks `consent[].move` against the strategies actually recovering
  the record). Failure scenario: a consent entry recorded under a since-renamed
  or mistyped `move` id matches no current `recovers`-edge; the entry is never
  rendered or counted anywhere and the move shows `NO RECORDED CONSENT`, so a
  genuine recorded consent disappears with no warning.

## Scope (to be decomposed by /align-tactics)

- Resolve a move's consent by **recency** (latest recorded decision wins) rather
  than first-match, and decide whether a later `declined`/revoked decision
  un-covers the move for the summary count. This is where the consent-recording
  model matters — see the dependency below.
- **Surface** consent entries whose `move` matches no current `recovers`-edge
  (a dedicated "recorded consent for an unrecognized move" list) instead of
  silently dropping them.
- Extend the test suite (`packages/intentionsutil/test/household-consent-report.test.ts`)
  to cover superseding entries and orphaned-move entries.

## Dependencies

- `tactic-household-consent-offering` (human, `status: delegated`) defines how
  consent is asked and recorded — including how a supersession or revocation is
  represented (a later entry vs an amended one). This hardening must honor that
  model, so it should be planned after (or alongside) the offering round rather
  than guessing the representation now.

## Reuse

- The report's existing shape validation (`parseHousehold`) and the
  `recoversIndex` cross-reference map already added in PR #2864's review fixes
  (`buildReport`) — extend them; do not re-derive the delegation→strategy index.
