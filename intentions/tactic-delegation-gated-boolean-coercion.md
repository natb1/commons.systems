---
id: tactic-delegation-gated-boolean-coercion
kind: tactic
statement: "The two capture-scoring readers accept a boolean
  attributes.irreversibility.gated as equivalent to the string form, so the 9
  delegation records that authored a bare `gated: false` stop scoring
  identically to an unassessed axis"
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-28 at an office-hours sitting and verified against
  origin/main the same day by parsing every intentions/delegation-*.md front
  matter with the repo's own YAML parser. All 22 delegation records carry
  attributes.irreversibility.gated; 0 are missing it. Of those, 9 write a bare
  `gated: false`, which YAML parses as a BOOLEAN —
  delegation-app-signin-identity, delegation-client-income,
  delegation-cloud-backup, delegation-connectivity, delegation-firebase,
  delegation-food-supply, delegation-hosted-publishing, delegation-os-hardware,
  delegation-web-analytics. The other 13 write a STRING: four of the form `false
  — <reason>` (anthropic-claude, finance-saas, github,
  philosophical-articulation) and nine of the form `partially — …` / `largely —
  …` (attention-services, banking, communications, health-records,
  identity-root, knowledge-notes, media-libraries, mobile-platform,
  social-publishing). Both readers of the axis gate on `typeof gated !==
  \"string\"` and return 0 — packages/intentionsutil/src/attention.ts:96 inside
  irreversibilityScore (declared at :89) and
  packages/intentionsutil/src/grounding.ts:105 inside the exported gatedRank
  (declared at :101). A string beginning `false` scores 1; a boolean `false`
  scores 0, the SAME score a missing or malformed axis receives. So 41% of the
  ledger (9 of 22) — every record whose author explicitly assessed the recovery
  path as ungated — is indistinguishable from unassessed to capture-ranking.
  attention.ts's own comment at :93-95 states the intended contract ('an
  unfilled irreversibility object must not score HIGHER than one explicitly
  authored as fully open'); the boolean case collapses the two to equal,
  defeating the distinction the comment is defending. Downstream this
  understates attention.ts captureScore (divergenceScore + irreversibilityScore,
  /6) by 1/6 and grounding.ts delegationScore (divergenceRank*10 + gatedRank) by
  1 for each of the 9. This node is the cheap non-destructive half: coerce at
  the two read sites, no corpus change, no schema change. The structured-field
  redesign was folded into tactic-delegation-classification-derivation Unit 1 on
  2026-07-28 (author decision: gated is a three-band enum, not a boolean); the
  separate tactic-delegation-gated-structured-tristate node was pruned as
  absorbed. This node must NOT be blocked on that work, since the whole point is
  that the two-line correction ships without waiting on a 22-record migration."
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
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Boolean `gated` scores as unassessed in both capture-scoring readers

## Context

`intentions/kind-delegation.md` declares, in `attributes.fields`:

```
irreversibility: {recovery_path: ..., recovery_cost: ..., gated: whether
recovery knowledge is held by the delegatee, last_exercised: ...}
```

Two readers score that axis. Both require a **string** and score anything else
as `0`:

`packages/intentionsutil/src/attention.ts:89-105`

```
function irreversibilityScore(delegation: IntentionNode): number {
  const irreversibility = delegation.attributes.irreversibility;
  if (!isPlainObjectLike(irreversibility)) return 0;
  const gated = irreversibility.gated;
  // A missing/malformed axis contributes 0 rather than partial (mirrors
  // `divergenceScore`): an unfilled `irreversibility` object must not score
  // HIGHER than one explicitly authored as fully open.
  if (typeof gated !== "string") return 0;          // attention.ts:96
  const gatedText = gated.trim().toLowerCase();
  if (gatedText === "") return 0;
  if (gatedText.startsWith("true")) return 3;
  if (gatedText.startsWith("false")) return 1;
  return 2;
}
```

`packages/intentionsutil/src/grounding.ts:101-111`

```
export function gatedRank(delegation: IntentionNode): number {
  const irreversibility = delegation.attributes.irreversibility;
  if (!isPlainObject(irreversibility)) return 0;
  const gated = irreversibility.gated;
  if (typeof gated !== "string") return 0;          // grounding.ts:105
  const g = gated.trim().toLowerCase();
  if (g === "") return 0;
  if (g.startsWith("true")) return 3;
  if (g.startsWith("false")) return 1;
  return 2;
}
```

## Verified state (2026-07-28, against origin/main)

Parsing every `intentions/delegation-*.md` front matter with the repo's own YAML
parser:

- **22** delegation records carry `attributes.irreversibility.gated`. None is
  missing it.
- **9** parse as a YAML **boolean** `false` — the value is written bare:
  `app-signin-identity`, `client-income`, `cloud-backup`, `connectivity`,
  `firebase`, `food-supply`, `hosted-publishing`, `os-hardware`,
  `web-analytics`.
- **13** parse as a **string**:
  - four `false — <reason>`: `anthropic-claude`, `finance-saas`, `github`,
    `philosophical-articulation`
  - nine `partially — …` / `largely — …`: `attention-services`, `banking`,
    `communications`, `health-records`, `identity-root`, `knowledge-notes`,
    `media-libraries`, `mobile-platform`, `social-publishing`

So a record that appends a reason after an em-dash is a string and scores
correctly; a record that writes the same assessment bare is a boolean and falls
through `typeof gated !== "string"` to `0` — the score reserved for a missing or
malformed axis. Nine of twenty-two records, 41% of the ledger, are
indistinguishable from *unassessed* to capture-ranking despite carrying an
explicit author assessment.

The comment at `attention.ts:93-95` states the contract being violated: an
unfilled axis "must not score HIGHER than one explicitly authored as fully
open". The boolean case makes them **equal**, which technically satisfies "not
higher" while destroying the distinction the comment exists to defend.

Downstream effect, per record, for each of the 9:

- `attention.ts` `captureScore` = `(divergenceScore + irreversibilityScore) / 6`
  — understated by `1/6`.
- `grounding.ts` `delegationScore` = `divergenceRank * 10 + gatedRank`
  — understated by `1`. Also surfaced in the `factors` string at
  `grounding.ts:267` as `gated=0`, reading as "no assessment" in gap reports.

## Scope

Make both readers treat a boolean `gated` as equivalent to the string spelling
of the same assessment:

- `true` → the fully-gated score (3), `false` → the fully-open score (1).
- The middle band (`partially`, `largely`) has no boolean spelling and is
  unaffected.
- Roughly one added branch per function, plus unit tests covering: boolean
  `false` scores as `false`-string; boolean `true` scores as `true`-string; a
  genuinely absent/malformed axis still scores `0`; the middle band is
  unchanged.
- No corpus change. No schema change. No `kind-delegation.md` change.

## Explicitly out of scope

- Restructuring the field. The greenfield shape (`gated: {level, note}`, level
  ∈ {none, partial, large}) is Unit 1 of
  `tactic-delegation-classification-derivation`, where it was folded on
  2026-07-28 by author decision; the separate
  `tactic-delegation-gated-structured-tristate` node was pruned as absorbed.
  **This node is deliberately NOT blocked on it** — the two-line correction must
  ship without waiting on a 22-record migration.
- Note the interaction: once that migration lands, `gated` is no longer a
  scalar at all, and this node's `typeof gated !== "string"` coercion becomes
  dead code to delete. That is expected and is not a reason to delay either
  node — this one corrects the live mis-scoring of 9 records in the interim,
  which is otherwise wrong for however long the migration takes.
- Migrating any `intentions/delegation-*.md` record.
- The `divergence.level` axis, which has its own token-matching reader
  (`attention.ts:76-87`) and is not affected by this defect.

## Reuse

- `packages/intentionsutil/src/attention.ts:89-105` — `irreversibilityScore`.
- `packages/intentionsutil/src/grounding.ts:101-111` — `gatedRank` (exported,
  so directly unit-testable).
- The existing `intentionsutil` vitest project holds the tests for both modules.

## Relationship to in-flight work

`tactic-delegation-classification-derivation` (status `codified`, phase
`implement`) plans, in its Unit 1, to make `gated` **strictly boolean** and move
the prose annotation into each record's audit narrative, with a `validateGraph`
enforcement in Unit 3. That direction makes this node's coercion the *primary*
read path rather than throwing it away — this fix is forward-compatible with
it. The only interaction is textual: that node's Unit 1 also rewrites these two
functions, so whichever lands second rebases over the other.

## Verification

```verify
npx vitest run --project intentionsutil --root . || exit 1
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

Prose: run the grounding gap report and confirm the nine bare-`false` records
no longer report `gated=0`, and that their capture ordering relative to the
`partially`/`largely` band is unchanged (a fully-open record must still rank
below a partially-gated one).

No implementation plan is written here; this node is `status: raw`,
`phase: null` for a later `/align-tactics` pass.
