---
id: tactic-voice-ledger-instrument
kind: tactic
statement: Voice-ledger instrument — mechanically compute the high-cost-of-exit
  delegation set and report each record's voice-channel state for the
  office-hours portfolio review
owner: ai
status: codified
parent: null
rationale: "Round-1 instrument for strategy-exercise-voice (its reading is null
  — a strategy that cannot be measured must first buy its own instrument):
  nothing today computes the high-cost-of-exit set the threshold quantifies
  over, and delegation records carry no surface for recording voice channels or
  actions. This tactic builds the predicate, the recording-field convention, and
  the report the office-hours sensor runs; the born-parked sibling
  tactic-voice-channel-review (blocked_by this tactic) then runs the first
  review and produces the strategy's first reading."
reading: null
gap: null
serves:
  - strategy-exercise-voice
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-voice-ledger-instrument
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: 2397a8d33f1a2436082a42ba5fab357c27c37b70b5652d944a25aae0a26cc448
validates:
  - strategy-exercise-voice
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Voice-ledger instrument — mechanically compute the high-cost-of-exit delegation set and report each record's voice-channel state for the office-hours portfolio review

## Context

strategy-exercise-voice ("Exercise voice toward delegatees — pull alignment
toward held virtues where exit is expensive") defines its success signal over
the HIGH-COST-OF-EXIT delegation set: a record qualifies when
`attributes.irreversibility.gated` is anything other than false, or its
`recovery_cost` is not bounded in days (weeks-plus, unbounded, or unassessed —
unknown exit cost is treated as high until assessed). The sensor is "owner
review at office-hours over the delegation records". Today that review cannot
run: no code computes the qualifying set, and delegation records have no field
for voice channels or actions. This tactic builds the instrument — a predicate
and voice-status module, a report script the office-hours session runs, and the
`voice` field convention documented on kind-delegation. The born-parked sibling
tactic-voice-channel-review (blocked_by this tactic) then runs the first review
and produces the strategy's first reading.

Guard carried from the strategy: voice is exercised as a customer and a
contributor, never as a partisan. The instrument only reports — it never scores
"more vendor engagement" as better.

## Unit 1 — high-cost-of-exit predicate + voice status (`src/voice.ts`)

**Recommended model:** sonnet

**Scope:** new `packages/intentionsutil/src/voice.ts` exporting:

- `isHighCostOfExit(node)` — true iff `node.kind === "delegation"` AND (the
  gated axis reads other-than-false, OR the recovery cost is not
  bounded-in-days). Fields-only, exactly as the strategy states — no
  hand-kept list, no origin-based exclusions.
- Gated parsing mirrors the pole conventions in
  `packages/intentionsutil/src/attention.ts:89-107` (`irreversibilityScore`):
  boolean `false` or a string whose trimmed lowercase starts with `"false"` →
  not gated; boolean `true` / startsWith `"true"` → gated; any other
  non-empty string (`"partially — …"`, `"largely — …"`) → gated
  (other-than-false). One deliberate divergence from attention.ts: a
  missing/empty/malformed gated axis counts as GATED here (qualifies), not 0 —
  the strategy's own rule is that unknown exit cost is high until assessed;
  attention.ts's contributes-0 rounding is correct for scoring but wrong for
  this predicate.
- `recoveryCostBoundedInDays(cost)` — `cost` is free prose
  (`attributes.irreversibility.recovery_cost`). Bounded iff its lowercase text
  contains a bounded-scale token:
  `/\b(none|low|hours?|days?|immediate|already paid|paid)\b/`. Missing, empty,
  or token-free text (including `"unassessed"`, `"moderate and falling"`, and
  open-ended costs like `"the frontier-vs-open-weight capability gap…"`) →
  NOT bounded (qualifies). Write the token rules as one small normalizer
  function: when tactic-delegation-classification-derivation (currently a raw
  draft) enum-izes `recovery_cost ∈ {none, low, moderate, high, prohibitive}`
  and makes `gated` boolean, the swap is that one function body (bounded =
  `{none, low}`; gated = the boolean).
- `voiceStatus(node)` — reads `attributes.voice`
  (`{channel: string|null, last_exercised: "YYYY-MM-DD"|null}`) and returns
  `{channel, last_exercised, recorded}` with `recorded: false` when the
  attribute is absent/malformed (defensive boundary parsing per attention.ts's
  convention — attributes shape is data, not a code contract).
- Unit tests in `packages/intentionsutil/test/voice.test.ts` over FIXTURE
  nodes (never the live store — records change) covering every prose form
  observed in the ledger as of 2026-07-11: boolean false; `"false — …"`;
  `"partially — …"`; `"largely — …"`; missing gated; and recovery costs
  `"days of migration work"`, `"low; days — …"`, `"low — copy elsewhere…"`,
  `"immediate but degraded…"`, `"bounded reading-hours — …"`,
  `"already paid — …"`, `"none — …"`, `"low and largely paid…"`,
  `"unassessed"`, `"moderate and falling; …"`,
  `"the frontier-vs-open-weight capability gap at recovery time; grows…"`.

Expected qualifying set against the live ledger as of 2026-07-11 (for the
prose verification below, not a test assertion): delegation-anthropic-claude,
delegation-attention-services, delegation-banking, delegation-client-income,
delegation-communications, delegation-health-records,
delegation-identity-root, delegation-knowledge-notes,
delegation-media-libraries, delegation-mobile-platform,
delegation-social-publishing — 11 records; delegation-github and every other
record drop out. (Per strategy clarification 3 — computed as the third
`clarifications` entry — the predicate wins over the strategy rationale's
10-record prose enumeration; social-publishing entered via a later ledger
edit.)

**Out of scope:** any change to attention.ts scoring; the axis enum-ization
itself (that raw draft tactic serves strategy-graph-self-description); any UI
surface.

## Unit 2 — report script (`scripts/voice-review.ts`)

**Recommended model:** sonnet

**Dependencies:** Unit 1.

**Scope:** new `packages/intentionsutil/scripts/voice-review.ts`, shaped like
`packages/intentionsutil/scripts/read-sensors.ts` (repo root resolved from
`import.meta.url`, never cwd; runnable from anywhere via
`npx tsx packages/intentionsutil/scripts/voice-review.ts`). It:

- `listNodes` over `intentions/`, filters `kind: "delegation"`, applies
  `isHighCostOfExit`.
- Prints a review table to stdout, one row per qualifying record: id, why it
  qualifies (the gated value and/or the cost-bound verdict),
  `voice.channel`, `voice.last_exercised`, `last_assessed`.
- Prints a one-line footer with the non-qualifying count and ids (so
  "delegation-github dropped out" stays visible at review).
- Exits 0 always: it is a report for owner judgment — a missing voice channel
  is the reading's content, not an error (deliberate, documented exception to
  the fail-fast rule; same stance as read-sensors.ts's collected reporting).
- No flags, no JSON mode, no store writes — report only.

## Unit 3 — `voice` field convention on kind-delegation

**Recommended model:** sonnet

**Dependencies:** Unit 1 (naming consistency).

**Scope:** append one entry to `intentions/kind-delegation.md`'s
`attributes.fields` list documenting the recording surface:
`"voice: {channel: where individual-scale voice lands with this delegatee
(tracker, forum, standards body), or null when none exists, last_exercised:
date a voice action last landed, or null} — the surface
strategy-exercise-voice reviews; exercised as customer and contributor, never
partisan"`. The edit MUST go through
`packages/intentionsutil/scripts/write-node.ts` (read the node JSON via
`packages/intentionsutil/scripts/dump-node.ts`, append to the
`attributes.fields` array, rewrite — never hand-edit YAML frontmatter;
`writeNode` preserves the markdown body). This file is `intentions/**` but
lands on the PR branch like any file in the bootstrap (no intentions branch
protection yet).

## Reuse

- `packages/intentionsutil/src/attention.ts:89-107` — gated-pole token
  parsing conventions (`irreversibilityScore`).
- `packages/intentionsutil/src/store.ts` — `listNodes`, `readNode`.
- `packages/intentionsutil/scripts/read-sensors.ts` — script skeleton
  (path resolution, batch-report stance).
- `packages/intentionsutil/scripts/write-node.ts` +
  `packages/intentionsutil/scripts/dump-node.ts` — Unit 3's write path.

## Verification

```verify
npx vitest run --project intentionsutil --root . || exit 1
npx tsx packages/intentionsutil/scripts/voice-review.ts
```

Prose: the script's reported qualifying set matches the 11 ids listed in
Unit 1 — modulo any delegation-record edit landed since 2026-07-11
(membership follows the ledger by design; a diff traceable to a record edit
is correct behavior, not a failure). Confirm delegation-github appears in the
dropped-out footer. Confirm kind-delegation's `attributes.fields` carries the
`voice` entry and its markdown body is unchanged.
