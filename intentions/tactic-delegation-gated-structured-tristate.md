---
id: tactic-delegation-gated-structured-tristate
kind: tactic
statement: "attributes.irreversibility.gated becomes a structured tri-state —
  {level: none | partial | large, note: string} — with the 22 delegation records
  migrated, both readers reading the level, and kind-delegation's
  attributes.fields declaring the shape"
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-28 at an office-hours sitting, alongside
  tactic-delegation-gated-boolean-coercion. `gated` is documented on
  intentions/kind-delegation.md as 'whether recovery knowledge is held by the
  delegatee' — a yes/no phrasing — but the corpus and both readers have
  converged on a THREE-valued axis with an attached reason, expressed as a bare
  word optionally followed by an em-dash and free prose. Verified against
  origin/main 2026-07-28 by parsing every delegation record: 22 carry the field,
  9 as a YAML boolean `false`, 13 as a string — 4 shaped `false — <reason>`, 9
  shaped `partially — …` or `largely — …`. Both readers score the middle band
  deliberately and separately from the poles:
  packages/intentionsutil/src/attention.ts:99-105 (irreversibilityScore,
  declared :89) returns 3 for a string starting `true`, 1 for one starting
  `false`, and 2 for any other non-empty string;
  packages/intentionsutil/src/grounding.ts:108-110 (gatedRank, declared :101) is
  byte-identical in structure. So the tri-state is real and load-bearing, yet it
  is encoded as prefix-matching over free text, and the reason — genuine
  authored assessment — is glued onto the value behind a separator rather than
  being a field. Greenfield the axis is {level: none | partial | large, note:
  string}: level machine-readable and enum-guarded, note a first-class field.
  CONFLICT TO RECONCILE, recorded here because it is a live one:
  tactic-delegation-classification-derivation (status codified, phase implement)
  already plans the opposite migration of this exact field in these exact
  records — its Unit 1 requires 'irreversibility.gated strictly boolean' with
  the annotation moved into the record's audit narrative, Unit 2 rewrites all
  records, Unit 3 adds a validateGraph check enforcing boolean. That plan
  flattens the middle band both readers score as 2, discarding the partial/large
  distinction the corpus authored across 9 records. The two nodes cannot both
  ship as planned. This node is blocked_by
  tactic-delegation-classification-derivation as a serialization gate — two
  concurrent migrations of the same field in the same 22 records would collide
  mechanically — and its planning pass must settle which shape wins before
  touching the corpus. tactic-delegation-capture-visibility is adjacent but does
  NOT cover this: it is a goals-page ranking surface over the existing scores,
  and consumes whatever the axis readers return."
reading: null
gap: null
serves:
  - strategy-graph-self-description
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by:
  - tactic-delegation-classification-derivation
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Structured tri-state `gated` — {level, note} replacing a bare word plus glued prose

## Context

`attributes.irreversibility.gated` is documented on `intentions/kind-delegation.md`
(`attributes.fields`) as "whether recovery knowledge is held by the delegatee" —
a yes/no phrasing. Neither the corpus nor the code agrees with that phrasing.

Both readers score **three** bands, deliberately and with comments saying so:

`packages/intentionsutil/src/attention.ts:89-105` (`irreversibilityScore`)

```
  if (gatedText.startsWith("true")) return 3;
  if (gatedText.startsWith("false")) return 1;
  // The store's real middle ground ("partially — ...", "largely — ...") is
  // real, described gating — a present, non-empty string that names neither
  // pole — distinct from both the fully-open and fully-closed poles, never
  // collapsed into either.
  return 2;
```

`packages/intentionsutil/src/grounding.ts:101-111` (`gatedRank`) is structurally
identical, and its doc comment (`grounding.ts:96-100`) repeats the same
three-band contract.

So the axis is a tri-state — but it is encoded as **prefix matching over free
text**, and the reason for the assessment (real authored content) is glued onto
the value behind an em-dash instead of being a field.

## Verified state (2026-07-28, against origin/main)

Parsing every `intentions/delegation-*.md` front matter with the repo's own YAML
parser: **22** records carry `gated`, **9** as a YAML boolean `false`
(`app-signin-identity`, `client-income`, `cloud-backup`, `connectivity`,
`firebase`, `food-supply`, `hosted-publishing`, `os-hardware`,
`web-analytics`), **13** as a string — four `false — <reason>`
(`anthropic-claude`, `finance-saas`, `github`, `philosophical-articulation`) and
nine `partially — …` / `largely — …` (`attention-services`, `banking`,
`communications`, `health-records`, `identity-root`, `knowledge-notes`,
`media-libraries`, `mobile-platform`, `social-publishing`).

Three spellings for what should be one axis, and the type is not even stable
across records.

## Greenfield shape

```yaml
irreversibility:
  gated:
    level: none | partial | large
    note: <why — the assessment, as a field>
```

- `level` is machine-readable and enum-guarded; the readers switch from
  `startsWith` prefix matching to an exact enum read.
- `note` is a first-class field carrying what today lives after the em-dash.
- The `true` spelling (fully gated) currently has zero occurrences in the
  corpus; the enum reserves `large` for the top band and drops `true`/`false`
  entirely rather than preserving a boolean-shaped legacy.

## Scope

1. Define the `gated` enum alongside the other delegation-axis definitions in
   `packages/intentionsutil/src`.
2. Migrate all **22** `intentions/delegation-*.md` records, via
   `packages/intentionsutil/scripts/write-node.ts` (never hand-authored
   markdown). The 9 boolean `false` → `{level: none}`; the 4 `false — <reason>`
   → `{level: none, note: <reason>}`; the 9 `partially`/`largely` → `{level:
   partial | large, note: <reason>}`, resolving `largely` (only
   `health-records`) to `large` and every `partially` to `partial`.
3. Update both readers — `attention.ts` `irreversibilityScore` and
   `grounding.ts` `gatedRank` — to read `level`, keeping the existing 3/2/1
   score bands so downstream ranking is unchanged by the shape migration alone.
4. Update `intentions/kind-delegation.md`'s `attributes.fields` entry for
   `irreversibility` to declare the new structure, so the kind node stays the
   schema authority (`strategy-graph-self-description`).
5. Add the `validateGraph` guard so the shape cannot re-drift, and land it in
   the same PR as the corpus migration — the validator must never be red
   between commits.

## Conflict to reconcile before the corpus is touched

`tactic-delegation-classification-derivation` (status `codified`, phase
`implement`) plans the **opposite** migration of the same field in the same
records:

- Its Unit 1 requires "`irreversibility.gated` strictly boolean — note today's
  records store prose-annotated values … the annotation moves to the record's
  audit narrative".
- Its Unit 2 rewrites all records accordingly.
- Its Unit 3 adds a `validateGraph` check enforcing `gated` boolean.

That plan **flattens the middle band** — the `partially`/`largely` assessments
across nine records that both readers deliberately score as `2` — into a
boolean. The two nodes cannot both ship as planned. `blocked_by` on that node
here is a **serialization gate**, not a design dependency: two concurrent
migrations of one field across the same 22 records would collide mechanically.
The planning pass for this node must settle which shape wins first, and record
that decision on `kind-delegation.md` (the persistent layer) rather than in
either tactic.

## Relationship to `tactic-delegation-gated-boolean-coercion`

That node is the brownfield step: it teaches both readers to accept a boolean
`gated`, so the 9 bare-`false` records stop scoring as unassessed. It is
**deliberately not a blocker** of this node and this node is **deliberately not
a blocker** of it — the cheap fix ships first and independently.

When this node lands, that coercion branch becomes dead and is removed as part
of step 3 above. That is expected and is not a reason to gate the cheap fix; the
correction it buys is worth having in the intervening period.

## Not covered by `tactic-delegation-capture-visibility`

`tactic-delegation-capture-visibility` (serves `strategy-attention-surface`) is
a goals-page **surface** that ranks delegation records by capture weight. It
consumes whatever the axis readers return and says nothing about the encoding
of `gated`. It is a downstream beneficiary of this node, not an overlap.

## Reuse

- `packages/intentionsutil/scripts/write-node.ts` — the only sanctioned path for
  the 22 record rewrites.
- `packages/intentionsutil/src/schema.ts` — `validateGraph` is where the
  delegation-axis enum guard belongs (same home
  `tactic-delegation-classification-derivation` names for its own guard).
- `packages/intentionsutil/src/attention.ts:76-87` (`divergenceScore`) — the
  sibling axis reader, and the precedent for how an enum-ized axis should read.
- `tactic-schema-drift-guard` — the mechanical code-vs-kind-node comparison; the
  new declaration on `kind-delegation.md` must be discoverable to it.

## Out of scope

- The `divergence.level` axis and the `classification` derivation — owned by
  `tactic-delegation-classification-derivation`.
- Any change to the 3/2/1 score weights or to `captureScore` /
  `delegationScore` composition.
- No implementation plan is written here; this node is `status: raw`,
  `phase: null` for a later `/align-tactics` pass.
