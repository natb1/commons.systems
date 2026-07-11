---
id: tactic-ledger-completeness-pass
kind: tactic
statement: "Run the ledger completeness pass at an office-hours sitting — the
  round's reading: discover unrecorded live attachments and judge recording
  latency against the census"
owner: human
status: delegated
parent: null
rationale: "The signal's sensor is the completeness pass of the portfolio review
  — a discovery judgment (what does the household now depend on that carries no
  record?) that is the author's, not delegable. This tactic is the round's
  validates-terminal: one sitting produces strategy-complete-ledger's first
  reading. Blocked by the census instrument (tactic-ledger-census) and the known
  food-supply gap (tactic-delegation-food-supply-record) so the pass can find a
  clean cycle rather than trivially rediscovering a known hole. Minted
  born-parked 2026-07-11 /align-tactics round."
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
validates:
  - strategy-complete-ledger
blocked_by:
  - tactic-ledger-census
  - tactic-delegation-food-supply-record
office_hours:
  reason: "Human sensor: at an office-hours sitting, run the ledger census and
    close it with the completeness question — what does the household now depend
    on that carries no record? — checking the strategy's in-scope categories
    (utilities, insurance, transport, food supply, digital/institutional
    attachments), and judge whether each record added since 2026-07-02 was dated
    within a cycle of its adoption. About 20-30 minutes."
  since: 2026-07-11
  recommendation: "Wait for both blockers to complete (tactic-ledger-census
    merged, delegation-food-supply record landed). Then run: npx tsx
    packages/intentionsutil/scripts/ledger-census.ts. Record the outcome as
    strategy-complete-ledger's reading (dated) and derived gap; any newly
    discovered unrecorded attachment gets its own born-parked intake tactic
    serving strategy-complete-ledger. On completion stamp the strategy's rounds
    {count: 1, last_completed: <date>}, and set this tactic phase: done."
pace_exempt: false
rounds: null
attributes: {}
---
# Run the ledger completeness pass at an office-hours sitting — the round's reading: discover unrecorded live attachments and judge recording latency against the census

Born-parked: the pass is the strategy's sensor, and the discovery judgment —
what does the household now depend on that carries no record? — is the
author's, not delegable. One sitting (20-30 minutes) produces
`strategy-complete-ledger`'s first reading. Blocked by the census instrument
(`tactic-ledger-census`) and the known food-supply gap
(`tactic-delegation-food-supply-record`) so the cycle under review can
actually come up clean. The `office_hours.recommendation` carries the run
procedure and the completion stamps (reading + gap on the strategy,
`rounds {count: 1, last_completed}`, this tactic `phase: done`).
