---
id: tactic-ledger-census-batch-git-log
kind: tactic
statement: Batch the ledger-census git entry-date lookup into a single git log
  scan instead of spawning one git subprocess per delegation record
owner: ai
status: raw
parent: null
rationale: "Surfaced by the /review-fix review pass on PR #2860
  (tactic-ledger-census) as a Deferred code-review finding: buildRows calls the
  injected entryDateOf once per delegation node, wired in main() to
  gitEntryDate, which spawns a new git log subprocess per call. A census run
  therefore spawns O(n) git processes sequentially, doing in N processes what
  one git log invocation could do in one. At ~21 records this costs well under a
  second, so it is out of scope for the delivering PR — filed as a draft for a
  later /align-tactics round to finalize or dismiss after re-validating the
  provenance against what merged."
reading: null
gap: null
serves:
  - strategy-complete-ledger
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
# Batch the ledger-census git entry-date lookup into a single git log scan instead of spawning one git subprocess per delegation record

## Context

Draft filed by the `/review-fix` review pass on PR #2860 (source tactic
`tactic-ledger-census`) as a Deferred code-review finding. It is inert until a
later `/align-tactics` round finalizes or dismisses it after re-validating the
provenance below against what actually merged.

## Finding provenance

- **Location:** `packages/intentionsutil/scripts/ledger-census.ts` — `buildRows`
  calls the injected `entryDateOf` once per delegation node inside its `.map()`
  (the `entry: entryDateOf(n.id)` call), and `main()` wires that to
  `gitEntryDate`, which spawns a new `git log` subprocess per call.
- **Failure scenario:** a census run spawns one `git log` process per delegation
  record, sequentially — O(n) subprocess spawns that grow linearly with the
  ledger, doing in N processes what a single `git log` invocation could do in
  one. At today's ~21 records this costs well under a second, so it is not a bug
  the delivering PR must fix; it is a scaling smell worth capturing.
- **Source PR:** #2860.
- **Disposition on the source PR:** Deferred (out of scope for PR #2860),
  `independent` — no blocking edge to the delivering work.

## Recommended fix

Replace the per-id `execFileSync` calls with a single
`git log --diff-filter=A --name-only --format=%H %as -- intentions/` scan, build
an id → earliest-date map from its output once, and have the `EntryDateLookup`
passed to `buildRows` read from that map instead of shelling out per id.
