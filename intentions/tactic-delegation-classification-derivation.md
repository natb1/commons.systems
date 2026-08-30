---
id: tactic-delegation-classification-derivation
kind: tactic
statement: Delegation axes become enums (including a three-band gated) and
  classification derives on read from the stated rule; the 22 records normalize
  in the same PR
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
phase: qa
execution:
  branch: tactic-delegation-classification-derivation
  pr: 3040
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: 15b5ef1dc7ce30e0a267440a124bd558c5506c86bd79f91fa2dc39b909df79b9
  fix: null
  conflict: null
  completion: null
validates: []
blocked_by: []
office_hours:
  reason: "/qa-fix: QA disposition Workflow classified 4 residue items
    opus-fixable but the fix-planner emitted zero units (deviation=true):
    delegation-connectivity's recovery_cost (item12, high vs moderate) and
    delegation-health-records' captured flip (item13) need the author's
    ratification per the tactic's own 'do not guess: park rather than invent'
    rule, and item12's possible resolution is entangled with the PR body's
    flip-count text (item5, currently 8 but would become a true 9 if
    connectivity flips to moderate) -- no unit can land safely until the author
    decides. Escalating to office-hours as one batch."
  since: 2026-08-10
  recommendation: "Read intentions/delegation-connectivity.md's rationale (Reading
    A vs Reading B for recovery_cost) and
    intentions/delegation-health-records.md's rationale (the largely -> large
    gated-band mapping). Ratify or override each. If delegation-connectivity's
    recovery_cost is overridden to `moderate`, the record's derived
    classification flips platform -> tool, becoming a real 9th classification
    flip -- in that case also correct the PR body's \"flips 9 of 22\" sentence
    to describe the actual final flip set (it would then be accurate as written;
    if recovery_cost stays `high`, correct the sentence to \"8 of 22\" instead,
    since the current flip set is 8, not 9). Separately and independently of the
    above, intentions/kind-delegation.md's attributes.fields entry for
    irreversibility.recovery_cost/gated is stale -- it still describes free text
    (\"bounded description\" / \"whether recovery knowledge is held by the
    delegatee\") rather than naming the enum shapes this PR introduces, even
    though the sibling divergence/classification lines in the same entry were
    already modernized. Update it to match (recovery_cost:
    none|low|moderate|high|prohibitive|unassessed; gated: {level:
    none|partial|large, note: <why>})."
  session_type: other
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
mechanical derivation from enum-ized axes, with a guard, and the 22 records
normalize in the same PR (enforcement plus normalization together — the
validator must never be red between commits).

**Axis-shape decision (author, 2026-07-28): `gated` is a three-band enum, not a
boolean.** An earlier revision of this plan made `irreversibility.gated`
strictly boolean while enum-izing the other two axes. That was reversed after
parsing the corpus. Three findings, each verified against `origin/main` on
2026-07-28:

1. **41% of the corpus has no boolean value.** Of 22 records, 9 read
   `partially — …` and one reads `largely — …`; **zero** read `true`. The
   remaining 12 read `false` (9 as a bare YAML boolean, 3 as `false — <reason>`
   — plus `delegation-anthropic-claude`, making 4 string-`false` records).
2. **Coercing them corrupts the derivation.** `gated` is the only axis value
   that promotes a record to CAPTURED on its own ("captured = high divergence
   OR gated/prohibitive recovery"). Coercing the middle band to `true` makes
   nine records CAPTURED, including `delegation-media-libraries` ("DRM and
   proprietary formats"); coercing it to `false` scores
   `delegation-health-records` ("largely — export is by request through the
   party recovered from") as *ungated*, contradicting its own text. Either
   direction manufactures the exact defect this tactic exists to remove —
   classification contradicting the axes it derives from.
3. **Both readers already implement three bands, deliberately.**
   `packages/intentionsutil/src/attention.ts:89-105` (`irreversibilityScore`)
   and `packages/intentionsutil/src/grounding.ts:101-111` (`gatedRank`) each
   return 3 / 1 / 2 for true / false / anything-else, and attention.ts's
   comment defends the middle band explicitly: "distinct from both the
   fully-open and fully-closed poles, never collapsed into either." A boolean
   would silently delete a band the capture ranking already depends on.

`divergence` is already stored as `{level: <enum>, imported: [...],
contradictions: [...]}`, so a `{level, note}` `gated` is the shape that makes
the two axes structurally parallel; a bare boolean is the odd one out. The
separate `tactic-delegation-gated-structured-tristate` node, which had proposed
this redesign as follow-on work, was pruned as absorbed into Unit 1 — the enum
must land *before* Unit 2 rewrites the corpus, not after.

## Units

### Unit 1 — Enum-ize the axes and implement the derivation

**Scope:**

- Define the axis enums in `packages/intentionsutil/` (they live under
  delegation records' `attributes`, so enforcement is graph-level, not
  `validateNode`):
  - `divergence.level` ∈ {low, moderate, high}
  - `irreversibility.recovery_cost` ∈ {none, low, moderate, high, prohibitive,
    unassessed}. `unassessed` is a deliberate enum member (author decision,
    2026-07-28), not an oversight — six records use it today and it means "not
    yet measured", which is a different claim from any cost band. Under the
    derivation rule it triggers **neither** arm (it is not `prohibitive`, not
    `high`), so a record carrying it classifies on its `divergence.level`
    alone. It must never be read as a low or absent cost: absence of a
    measurement is not evidence of a cheap recovery path.
  - `irreversibility.gated` becomes a `{level, note}` object, mirroring
    `divergence`'s existing `{level, ...}` shape:

    ```yaml
    irreversibility:
      gated:
        level: none | partial | large
        note: <why — the assessment, as a field>
    ```

    `level` is enum-guarded and read exactly (no prefix matching). `note`
    carries what today sits after the em-dash (e.g. `gated: false — artifacts,
    workflow, and evaluation context are all in-repo` in
    `intentions/delegation-anthropic-claude.md` becomes
    `{level: none, note: "artifacts, workflow, and evaluation context are all
    in-repo"}`). `true`/`false` are dropped entirely rather than kept as a
    boolean-shaped legacy; `true` has zero occurrences in the corpus today.
- Both axis readers switch from `startsWith` prefix matching over free text to
  an exact `level` enum read, preserving today's three-band scores:
  `packages/intentionsutil/src/attention.ts:89-105` (`irreversibilityScore`)
  and `packages/intentionsutil/src/grounding.ts:101-111` (`gatedRank`). The
  score mapping is `large → 3`, `partial → 2`, `none → 1`, and a
  missing/malformed axis stays `0`. Preserving 0 as distinct from `none` is
  required by attention.ts's stated contract at `:93-95` — "an unfilled
  `irreversibility` object must not score HIGHER than one explicitly authored
  as fully open."
- The derivation rule's `gated` predicate resolves to `level === "large"`
  (the rule is "captured = high divergence OR gated/prohibitive recovery").
  Cite `intentions/kind-delegation.md`; do not restate a variant.
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

### Unit 2 — Normalize the 22 records in the same PR

**All three axes are out of enum today, not just `gated`.** Verified against
`origin/main` on 2026-07-28 across the 22 `intentions/delegation-*.md` records.
Unit 3's guard fails on nearly the whole corpus unless this unit covers all
three:

- **`divergence.level`** — 19 of 22 in enum (8 `moderate`, 6 `low`, 5 `high`);
  **3 out of enum**: `low-moderate` (×2) and `moderate — would-be` (×1).
- **`irreversibility.recovery_cost`** — the worst axis: **18 distinct values,
  almost all free text.** 5 records read a bare `unassessed`; one reads
  `unassessed — app repurchase, migration friction, household`; the rest are
  prose measurements such as `days — transfer locks and DNS propagation, no
  data re-formation`, `low; historical series lost, capability retained`, and
  `"measured 2026-07-16 drill: hours-to-about-a-day, dominated by …"`. Only
  `none — the delegation was never entered` and the two `moderate …` values
  begin with an enum member at all.
- **`irreversibility.gated`** — 9 bare YAML boolean `false`, 4
  `false — <reason>` strings, 8 `partially — …`, 1 `largely — …`, 0 `true`.

**Scope:**

- All 22 records: each axis value becomes a bare enum member (`gated` becomes
  the `{level, note}` object from Unit 1). Prose nuance — "would-be", date
  qualifiers, drill measurements, the gated annotations — moves into the
  record's rationale/audit-narrative body, except for `gated`'s, which moves
  into its own `note` field.
- Where a value is prose-ambiguous (`low-moderate`, and every free-text
  `recovery_cost`), resolve per the record's own rationale and note the
  resolution in the audit narrative. Do not guess: if a record's own text does
  not support a band, park rather than invent one.
- Remove the stored `classification:` line from each record's attributes.
- All record writes via `packages/intentionsutil/scripts/write-node.ts`.

**Settled — `recovery_cost` keeps an `unassessed` member (author, 2026-07-28).**
Six records say `unassessed` today (five bare, one as `unassessed — app
repurchase, migration friction, household`). They keep it: "not yet measured"
is a first-class state, distinguishable from a real low cost, and it mirrors
how `gated` keeps `0` (axis absent) distinct from `none` (assessed as fully
open). This unit therefore does **not** assess those six — that is six author
judgment calls about recovery cost, out of scope here.

Normalizing the one annotated record moves its prose to the audit narrative and
leaves a bare `unassessed`. Under the derivation rule `unassessed` triggers
neither arm, so those records classify on `divergence.level` alone; see Unit 1
for the full statement of its semantics.

**Recommended model:** opus

**Dependencies:** Unit 1.

### Unit 3 — Guard the enums

**Scope:**

- `validateGraph` (`packages/intentionsutil/src/schema.ts:530-720`) gains the
  enum check on `kind: delegation` records: `divergence.level` and
  `irreversibility.recovery_cost` must be enum members, `irreversibility.gated`
  must be an object whose `level` is an enum member (a bare boolean or string
  `gated` is rejected — that is the pre-normalization shape), and
  `classification` must NOT be stored — the re-drift guard the author required.
  Clear errors naming record and field.
- Tests: an out-of-enum axis value, a legacy boolean/string `gated`, and a
  stored classification each fail naming the record.
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
- `packages/intentionsutil/scripts/write-node.ts` for the 22 record rewrites.
- `packages/intentionsutil/src/grounding.ts:101-111` — `gatedRank`, the second
  reader of the same axis. It must change in lockstep with
  `attention.ts`'s `irreversibilityScore`; the two are structurally identical
  by design and grounding.ts's doc comment (`:96-100`) says so.

## Verification

```verify
npx vitest run --project intentionsutil --root . || exit 1
npx tsx packages/intentionsutil/scripts/validate-graph.ts || exit 1
if grep -rn "^  classification:" intentions/delegation-*.md; then echo "FAIL: the forbidden pattern is still present in intentions/delegation-*.md"; exit 1; fi
if grep -rnE "^    gated: (true|false|partially|largely)" intentions/delegation-*.md; then echo "FAIL: the forbidden pattern is still present in intentions/delegation-*.md"; exit 1; fi
```

The fourth check asserts the legacy scalar `gated` spellings are gone — all 22
records must carry the `{level, note}` object instead.

Prose: for each of the 22 records, the derived classification equals what the
record's audit narrative argues (where the old stored value disagreed with
the derivation, the normalization commit message names the record and which
way it resolved). `attention.ts`'s capture term produces the same ranking
class for the known-severe records (spot-check delegation-attention-services
per kind-delegation's body).
