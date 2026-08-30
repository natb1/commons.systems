---
id: tactic-realignment-coverage-sensor
kind: tactic
statement: Land the recorded re-alignment convention and extend the
  delegation-records sensor's coverage predicate to read it
owner: ai
status: codified
parent: null
rationale: "Minted 2026-07-11 by /align-tactics round 1: the strategy's
  threshold counts a high-divergence record as covered by a recovers edge OR a
  recorded re-alignment, but no re-alignment surface exists on the ledger.
  tactic-first-sensor-pass registers the delegation-records sensor with the
  recovers arm only and explicitly defers the re-alignment arm until a recording
  convention lands. This tactic lands that convention (kind-delegation
  attributes.fields) and the sensor predicate, making the signal's threshold
  fully mechanically evaluable — the round's instrument."
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
  branch: tactic-realignment-coverage-sensor
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: 4011b4e13289e44af6961dd29001e88d1bb162586f5e715a1f9e575c6cb9a175
validates:
  - strategy-realign-attachments
blocked_by:
  - tactic-first-sensor-pass
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Land the recorded re-alignment convention and extend the delegation-records sensor's coverage predicate to read it

## Context

`strategy-realign-attachments`' success signal: observable = high-divergence
delegation records with neither a recovery strategy nor a recorded
re-alignment; sensor = "the delegation records themselves"; threshold = every
high-divergence record is covered by a `recovers` edge or a recorded
re-alignment. `tactic-first-sensor-pass` (this tactic is `blocked_by` it)
registers that sensor in `packages/intentionsutil/scripts/read-sensors.ts`
with a per-node rule for `strategy-realign-attachments` that computes only the
recovers arm, and its plan explicitly defers the other arm: "A 'recorded
re-alignment' surface does not exist yet; when a recording convention lands on
the ledger, extend the coverage predicate then." The convention now exists
(strategy clarification recorded 2026-07-11: executed swaps only, as a dated
`attributes.realignment` entry on the delegation record). This tactic writes
the convention into `intentions/kind-delegation.md` (the meaning home for
delegation attributes) and extends the sensor predicate plus tests, making the
threshold mechanically evaluable — the round's instrument.

Ledger facts as of 2026-07-11 (plan anchors, not assertions — membership
follows the ledger at run time): 21 `intentions/delegation-*.md` records; 4
high-divergence (`attributes.divergence.level` starting "high"):
delegation-attention-services, delegation-finance-saas,
delegation-social-publishing (each in some strategy's `recovers` array), and
delegation-communications (uncovered — its re-alignment is the round's human
work; `tactic-record-email-realignment` records it later, gated on the
cutover).

## Unit 1 — convention entry on kind-delegation

**Recommended model:** sonnet

**Scope:** `intentions/kind-delegation.md` — append one string to
`attributes.fields` (currently a 9-entry list ending at `last_assessed`):

> "realignment: [{date, moved, from, to, terms}] — dated records of executed
> re-alignments per strategy-realign-attachments: the named capability slice
> was moved from an engagement-funded delegatee to a fee-aligned one on
> portable terms; an entry records a completed swap, never intent or a plan"

Mechanism: full-node JSON through
`packages/intentionsutil/scripts/write-node.ts` (read the node, append the
string to `attributes.fields` in memory, re-write the whole object — never
hand-edit YAML; `writeNode` preserves the markdown body). **Out of scope:**
writing any `realignment` entry on a delegation record — that is
`tactic-record-email-realignment`, gated on the human cutover.

## Unit 2 — sensor predicate + tests

**Recommended model:** sonnet

**Dependencies:** Unit 1. Also assumes `tactic-first-sensor-pass` is merged
(enforced by this tactic's `blocked_by`), so the delegation-records sensor
(name verbatim `"the delegation records themselves"`) and its
`strategy-realign-attachments` per-node rule exist in
`packages/intentionsutil/scripts/read-sensors.ts`.

**Scope:** in that per-node rule, extend `covered`: a record is covered when
its id appears in ANY node's `recovers` array (the existing union-set logic)
OR its `attributes.realignment` parses as a non-empty array containing at
least one entry whose `date` is a non-empty string. Parse defensively —
attributes are data, not a code contract (the convention of
`packages/intentionsutil/src/voice.ts` and `src/attention.ts:89-107`): a
missing, malformed, or empty `realignment` simply fails that arm, never
throws. Extend the reading string to report the split, e.g.
`high-divergence: <h> records; <c> covered (<r> by recovers, <a> by recorded
re-alignment); uncovered: <comma-separated ids or "none">` — one line,
self-describing. Tests: extend
`packages/intentionsutil/test/delegation-records-sensor.test.ts` (created by
tactic-first-sensor-pass) with fixtures for: a dated realignment entry
(covered), an empty `realignment` array (not covered), an entry missing
`date` (not covered), a realignment on a non-high-divergence record (does not
change the high-divergence counts), and a record with both a recovers edge
and a realignment entry (counted once).

## Unit 3 — run the pass, land refreshed readings

**Recommended model:** sonnet

**Dependencies:** Units 1–2 committed (the git/vitest sensors read committed
state, so run the driver only after the code is committed).

**Scope:** run `npx tsx packages/intentionsutil/scripts/read-sensors.ts` in
the tactic worktree, inspect `git diff -- intentions/`, and commit the
refreshed reading+gap writes in this same PR. Expect
`strategy-realign-attachments`' reading to name delegation-communications as
the uncovered record and its `gap` to stay non-null — that is the honest
pre-cutover state, not a failure.

## Reuse

- `packages/intentionsutil/scripts/read-sensors.ts` — the delegation-records
  sensor and its per-node rule (landed by tactic-first-sensor-pass); the
  loadNodes-closure sensor factory pattern.
- `packages/intentionsutil/src/sensors.ts` — `SensorRegistry`, `deriveGap`.
- `packages/intentionsutil/src/store.ts` — `listNodes`;
  `packages/intentionsutil/scripts/write-node.ts` as the single node-write
  gate for the kind-delegation edit.
- `packages/intentionsutil/src/voice.ts` + `src/attention.ts:89-107` —
  defensive attributes-parsing precedent.

## Verification

```verify
npx vitest run --project intentionsutil --root . || exit 1
npx tsx packages/intentionsutil/scripts/read-sensors.ts || exit 1
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

Prose: a second driver run after the commit is idempotent apart from the
deliberately volatile halves (utilization %, git/vitest status strings).
`intentions/strategy-realign-attachments.md` carries a reading whose uncovered
list names exactly delegation-communications (as of the 2026-07-11 ledger).
