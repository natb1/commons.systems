---
id: tactic-first-sensor-pass
kind: tactic
statement: Run the first mechanical sensor pass — register the
  delegation-records sensor, run read-sensors over the widened scope, and land
  the first driver-written readings (including this strategy's own)
owner: ai
status: codified
parent: null
rationale: "Finalized from the /align-strategy-retained draft (2026-07-10
  census: 50 strategies carry success_signals, most readings null). The
  owner-review half of the draft is split out to the born-parked chunks
  tactic-owner-review-reading-pass-a and tactic-owner-review-reading-pass-b;
  this tactic is the claude-eligible mechanical half: register 'the delegation
  records themselves' (the last mechanically computable named sensor with no
  registration), run the widened driver, and land the first driver-written
  readings — producing strategy-graph-drives-dispatch's own first reading, which
  validates its signal this round."
reading: null
gap: null
serves:
  - strategy-graph-drives-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: tactic-first-sensor-pass
  pr: 3062
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint:
    strategy-graph-drives-dispatch:
      hash: 99227b632204950956b9eb8f36c3837b121261ccba95dd830e863947c12a3802
      sha: c64859d398cbebfdabfa69c97e527b27f3ed71be
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-10T12:31:17Z
    mergeCommitSha: f1e634f7547b8576ff11cb80b77b5ee72d6e1847
    graphCommitSha: null
validates:
  - strategy-graph-drives-dispatch
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Run the first mechanical sensor pass — register the delegation-records sensor, run read-sensors over the widened scope, and land the first driver-written readings (including this strategy's own)

## Context

Finalized from the /align-strategy-retained draft. strategy-graph-drives-dispatch's
threshold requires sensor-run readings for every sensor-naming strategy; after
tactic-intention-store-sensor lands (this tactic is blocked_by it), the
registry covers five sensor names but two strategies still name the one
remaining mechanically computable sensor with no registration —
`"the delegation records themselves"`:

- `intentions/strategy-exercise-recovery-paths.md` — threshold: "no record's
  last_exercised is null, and no fired review_trigger is left unactioned".
- `intentions/strategy-realign-attachments.md` — threshold: "every
  high-divergence record is covered by a recovers edge or a recorded
  re-alignment".

Ledger facts as of 2026-07-11 (plan anchors, not assertions — membership
follows the ledger at run time): 21 `intentions/delegation-*.md` records; 19
carry `attributes.irreversibility.last_exercised: null`; 4 are high-divergence
(`attributes.divergence.level` starting "high": delegation-attention-services,
delegation-finance-saas, delegation-social-publishing,
delegation-communications); 3 of those appear in some strategy's `recovers`
array — delegation-communications does not, and no "recorded re-alignment"
attribute surface exists in the ledger yet (only prose mentions).

## Unit 1 — delegation-records sensor

**Recommended model:** sonnet

**Scope:** in `packages/intentionsutil/scripts/read-sensors.ts`, a sensor named
verbatim `"the delegation records themselves"` (exported name const + exported
pure functions + registration in `buildDefaultRegistry`, following the
token-economy pattern). Its `read(node)` dispatches on `node.id`:

- `strategy-exercise-recovery-paths` — over `kind === "delegation"` records:
  `exercised: <k>/<n> records; <m> null last_exercised; review_trigger firing not recorded`.
  `last_exercised` lives at `attributes.irreversibility.last_exercised`; parse
  attributes defensively (data, not a code contract — the convention of
  `packages/intentionsutil/src/voice.ts` and `src/attention.ts:89-107`); a
  missing/malformed field counts as null. The fired-review_trigger clause of
  the threshold is not mechanically evaluable (no firing/actioned surface
  exists on the records), and the reading says so rather than guessing.
- `strategy-realign-attachments` — high-divergence = trimmed lowercase
  `attributes.divergence.level` starts with `"high"`; covered = the record id
  appears in ANY node's `recovers` array (build the union set over all nodes):
  `high-divergence: <h> records; <c> covered by recovers; uncovered: <comma-separated ids or "none">`.
  A "recorded re-alignment" surface does not exist yet; when a recording
  convention lands on the ledger, extend the coverage predicate then — do not
  invent one now.
- Any other node id: return a self-describing
  `"no per-node rule for <id>"` string (total, never throw).

The sensor needs the full node list: take a `loadNodes` closure at construction
(same shape as tactic-intention-store-sensor's factory). Unit tests in
`packages/intentionsutil/test/delegation-records-sensor.test.ts` over fixtures:
null/missing/populated last_exercised; divergence levels `high`, `moderate`,
missing; covered vs uncovered records; the other-node fallback.

**Out of scope:** writing a re-alignment recording convention; any
`voice.ts`/attention scoring change; the office-hours owner-review readings
(born-parked siblings tactic-owner-review-reading-pass-a/-b).

## Unit 2 — run the pass and land the readings

**Recommended model:** sonnet

**Dependencies:** Unit 1 committed (a clean tree — the git/vitest sensors read
committed state, so run the pass only after the code is committed).

**Scope:** run `npx tsx packages/intentionsutil/scripts/read-sensors.ts` in the
tactic worktree, inspect `git diff -- intentions/`, and commit the refreshed
`intentions/*.md` reading+gap writes in this same PR (bootstrap: intentions
files ride PR branches like any file). Expect reading+gap updates on every
node naming one of the six registered sensors — including
strategy-graph-drives-dispatch (its FIRST reading; this is the round's
signal-validating artifact), strategy-graph-native-dispatch,
strategy-token-economy, strategy-exercise-recovery-paths, and
strategy-realign-attachments. The driver's stderr unregistered-sensor list
should enumerate approximately the 26 owner-review strategies the born-parked
chunks carry (modulo graph edits landed since 2026-07-11).

## Reuse

- `packages/intentionsutil/src/sensors.ts` — registry, `deriveGap`.
- `packages/intentionsutil/src/store.ts` — `listNodes`.
- `packages/intentionsutil/src/voice.ts` + `src/attention.ts:89-107` —
  defensive attributes-parsing precedent.
- `packages/intentionsutil/scripts/read-sensors.ts` — sensor factory +
  registration patterns from tactic-intention-store-sensor.

## Verification

```verify
npx vitest run --project intentionsutil --root . || exit 1
npx tsx packages/intentionsutil/scripts/read-sensors.ts
```

Prose: a second driver run after the commit is idempotent apart from the
deliberately volatile halves (utilization %, git/vitest status strings).
`intentions/strategy-graph-drives-dispatch.md` carries a non-null reading in
the intention-store format with a non-null gap naming the shortfall (the
threshold is not met while owner-review readings are missing — that is the
honest state, not a failure). `npx tsx
packages/intentionsutil/scripts/validate-graph.ts` passes. If this tactic
finishes after every sibling in the round (tactic-intention-store-sensor,
tactic-owner-review-reading-pass-a, tactic-owner-review-reading-pass-b), stamp
strategy-graph-drives-dispatch `rounds: {count: 1, last_completed: <date>}` in
the completing session (bootstrap hand-stamp per
intentions/tactic-graph-native-dispatch.md §1.1).
