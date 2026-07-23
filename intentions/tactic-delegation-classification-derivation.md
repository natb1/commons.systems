---
id: tactic-delegation-classification-derivation
kind: tactic
statement: Delegation axes become enums and classification derives on read from
  the stated rule; the 21 records normalize in the same PR
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy review round:
  classification is declared 'derived from the two axes' but is stored,
  underived, and inconsistent (high-divergence records at platform, the
  worst-gated record at tool; enum drift like 'low-moderate' and 'moderate —
  would-be'). Author decision: mechanical derivation from enum-ized axes, with a
  guard."
reading: null
gap: null
serves:
  - strategy-graph-self-description
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-delegation-classification-derivation
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: 15b5ef1dc7ce30e0a267440a124bd558c5506c86bd79f91fa2dc39b909df79b9
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# tactic-delegation-classification-derivation

## Context

`kind-delegation` declares classification "derived from the two axes", but it
is stored, underived, and the store contradicts every consistent ordering
(high-divergence records at platform, the worst-gated record at tool; enum
drift like "low-moderate"). The derivation rule is now stated on
`intentions/kind-delegation.md` (body, ~lines 27-37, recorded 2026-07-09):
captured = high divergence OR gated/prohibitive recovery; platform = moderate
divergence OR high recovery cost; tool = otherwise. Author decision:
mechanical derivation from enum-ized axes, with a guard, and the 21 records
normalize in the same PR (enforcement plus normalization together — the
validator must never be red between commits).

## Units

### Unit 1 — Enum-ize the axes and implement the derivation

**Scope:**

- Define the axis enums in `packages/intentionsutil/` (they live under
  delegation records' `attributes`, so enforcement is graph-level, not
  `validateNode`):
  - `divergence.level` ∈ {low, moderate, high}
  - `irreversibility.recovery_cost` ∈ {none, low, moderate, high, prohibitive}
  - `irreversibility.gated` strictly boolean — note today's records store
    prose-annotated values (e.g. `gated: false — artifacts, workflow, and
    evaluation context are all in-repo` in
    `intentions/delegation-anthropic-claude.md`); the annotation moves to the
    record's audit narrative.
- Implement the derivation helper in `packages/intentionsutil/src` (e.g.
  alongside the axis readers in `attention.ts`): kind-delegation's rule,
  exactly as stated, returning tool | platform | captured. Unit tests cover
  every rule branch plus the boundary cases (moderate+gated, high+none, ...).
- `classification` leaves the stored `attributes` — consumers derive:
  `packages/intentionsutil/src/attention.ts` `captureScore`
  (`attention.ts:109`, and the prose token-matching over the axes at
  `attention.ts:59-110`) switches from token matching to exact enum reads;
  any other stored-classification consumer a repo-wide grep finds.
- Declined records (`origin: declined`) derive over their would-be axes
  exactly as entered ones.

**Recommended model:** opus

### Unit 2 — Normalize the 21 records in the same PR

**Scope:**

- All 21 `intentions/delegation-*.md` records: axis values become bare enum
  members; prose nuance ("would-be", date qualifiers, the gated annotations)
  moves into the record's rationale/audit-narrative body. Where an axis value
  is prose-ambiguous (e.g. "low-moderate"), resolve per the record's own
  rationale and note the resolution in the audit narrative.
- Remove the stored `classification:` line from each record's attributes.
- All record writes via `packages/intentionsutil/scripts/write-node.ts`.

**Recommended model:** opus

**Dependencies:** Unit 1.

### Unit 3 — Guard the enums

**Scope:**

- `validateGraph` (`packages/intentionsutil/src/schema.ts:530-720`) gains the
  enum check on `kind: delegation` records: axis values must be enum members,
  `gated` boolean, and `classification` must NOT be stored — the re-drift
  guard the author required. Clear errors naming record and field.
- Tests: an out-of-enum axis value and a stored classification each fail
  naming the record.
- Coordinate with tactic-schema-drift-guard: the enum declarations should be
  discoverable from `intentions/kind-delegation.md` so the drift guard can
  compare them (if that tactic has landed, add the declaration in its
  convention; if not, leave a `TODO(tactic-schema-drift-guard)` pointer).

**Recommended model:** sonnet

**Dependencies:** Units 1-2 (same PR — the check must land with the corpus
already normalized).

## Reuse

- The axis-reading code in `packages/intentionsutil/src/attention.ts:59-110`
  (its call sites are the consumers to switch; delete the token-matching once
  enums land).
- `intentions/kind-delegation.md` body — the derivation rule text; the
  implementation cites it, never restates a variant.
- `packages/intentionsutil/scripts/write-node.ts` for the 21 record rewrites.

## Verification

```verify
npx vitest run --project intentionsutil --root .
npx tsx packages/intentionsutil/scripts/validate-graph.ts
! grep -rn "^  classification:" intentions/delegation-*.md
```

Prose: for each of the 21 records, the derived classification equals what the
record's audit narrative argues (where the old stored value disagreed with
the derivation, the normalization commit message names the record and which
way it resolved). `attention.ts`'s capture term produces the same ranking
class for the known-severe records (spot-check delegation-attention-services
per kind-delegation's body).
