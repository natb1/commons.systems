---
id: tactic-record-email-realignment
kind: tactic
statement: Record the executed email re-alignment on delegation-communications
  and land the threshold-met reading
owner: ai
status: codified
parent: null
rationale: "Minted 2026-07-11 by /align-tactics round 1 (split from the retained
  draft tactic-realign-email): once the author's cutover completes, the executed
  swap is written onto delegation-communications as a dated
  attributes.realignment entry and the delegation-records sensor is re-run. That
  covers the ledger's one uncovered high-divergence record, so this is the
  round's threshold-meeting terminal."
reading: null
gap: null
serves:
  - strategy-realign-attachments
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-record-email-realignment
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: 4011b4e13289e44af6961dd29001e88d1bb162586f5e715a1f9e575c6cb9a175
validates:
  - strategy-realign-attachments
blocked_by:
  - tactic-realignment-coverage-sensor
  - tactic-realign-email
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Record the executed email re-alignment on delegation-communications and land the threshold-met reading

## Context

The human cutover (`tactic-realign-email`) moved email from the
engagement-funded delegatee to a fee-aligned provider on an owned domain, and
the recording convention plus sensor predicate exist
(`tactic-realignment-coverage-sensor`) — both enforced by this tactic's
`blocked_by`. This tactic writes the executed swap onto
`intentions/delegation-communications.md` as a dated `attributes.realignment`
entry (the convention home is `intentions/kind-delegation.md`
`attributes.fields`; semantics fixed by the strategy's 2026-07-11
clarification: executed swaps only, never intent) and lands the refreshed
sensor reading. As of the 2026-07-11 ledger, delegation-communications is the
only high-divergence record with neither a `recovers` edge nor a recorded
re-alignment, so this recording meets the strategy's threshold — the round's
threshold-meeting terminal. Membership follows the ledger at run time: if a
new uncovered high-divergence record has entered since, the reading honestly
reports it and the gap stays non-null — do not chase it in this tactic.

## Unit 1 — the realignment entry

**Recommended model:** sonnet

**Scope:** read the cutover facts — the dated clarification on
`intentions/strategy-realign-attachments.md` recorded when
`tactic-realign-email` completed (provider, domain, cutover date); if it is
missing there, check `intentions/tactic-realign-email.md` (its
`clarifications` or body). If the facts are recorded nowhere in the graph, do
NOT guess: park this tactic (`office_hours` via
`packages/intentionsutil/scripts/write-node.ts`, reason naming the missing
cutover record as a record-completeness defect of the cutover session,
recommendation: the author records provider/domain/date as a dated
clarification on the strategy). Otherwise append to
`intentions/delegation-communications.md` `attributes.realignment` (creating
the array — the record currently has no such key) one entry:

- `date`: the cutover date
- `moved`: "email — mailbox and send/receive on the owned domain"
- `from`: the engagement-funded delegatee as the record names it
  (`attributes.delegatee`)
- `to`: the chosen provider
- `terms`: the portable terms actually in effect (owned domain `<domain>`,
  standard protocols, plain export) — from the recorded facts, not invented

Mechanism: full-node JSON through
`packages/intentionsutil/scripts/write-node.ts`; preserve every other
`attributes` entry verbatim; leave `divergence`, `irreversibility`, and
`last_assessed` untouched — the cutover fires the record's `review_trigger`
and the two-axis reassessment is the author's, not this tactic's.

## Unit 2 — refreshed reading

**Recommended model:** sonnet

**Dependencies:** Unit 1 committed (the driver reads committed state).

**Scope:** run `npx tsx packages/intentionsutil/scripts/read-sensors.ts` in
the tactic worktree; confirm `strategy-realign-attachments`' reading counts
delegation-communications as covered by recorded re-alignment (expected shape
as of the 2026-07-11 ledger: 4 high-divergence, 4 covered — 3 by recovers, 1
by recorded re-alignment — uncovered: none, and the derived `gap` goes null);
commit the refreshed `intentions/*.md` reading+gap writes in this same PR.

## Reuse

- `packages/intentionsutil/scripts/write-node.ts` — the single node-write
  gate for the delegation-record edit.
- `packages/intentionsutil/scripts/read-sensors.ts` — the delegation-records
  sensor with the re-alignment coverage arm
  (tactic-realignment-coverage-sensor).
- `packages/intentionsutil/scripts/validate-graph.ts` — graph validation.

## Verification

```verify
npx vitest run --project intentionsutil --root . || exit 1
npx tsx packages/intentionsutil/scripts/read-sensors.ts || exit 1
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

Prose: `intentions/delegation-communications.md` carries the dated
`realignment` entry and no other attribute changed;
`strategy-realign-attachments`' reading reports uncovered: none (threshold
met) unless the ledger gained a new uncovered high-divergence record. This
tactic is the round's final tactic (its `blocked_by` covers every sibling
chain), so on completion stamp `strategy-realign-attachments`
`rounds: {count: 1, last_completed: <date>}` in the completing session — the
bootstrap hand-stamp per `intentions/tactic-graph-native-dispatch.md` §1.1.
