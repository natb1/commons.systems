---
id: tactic-ratchet-teeth-census
kind: tactic
statement: "Instrument: the project's ratchet-teeth inventory manifest with tier
  and validating-signal columns, plus the report the office-hours review runs"
owner: ai
status: codified
parent: null
rationale: "Round-1 instrument for strategy-progressive-validation (reading null
  — a strategy that cannot be measured must first buy its own instrument,
  align-tactics clarification 3). The recorded sensor is owner review at
  office-hours, but nothing enumerates the project's accepted ratchet teeth,
  their tier attribution, or the prior-tier signal that validated each — so the
  review cannot produce a reading at threshold granularity. This tactic buys the
  instrument: an owner-editable teeth manifest audited by the mechanism
  (reasonable to add, costly to remove — virtue-philosophical-mobility's
  2026-07-08 ratcheting clarification), plus a report that flags teeth with no
  validating signal and teeth beyond the entered tiers. Serves both strategies
  honestly (artifact-owner placement): strategy-reversible-institution's
  rationale owns the teeth inventory; the tier and validating-signal columns
  serve this strategy's sensor. Ratification and the reading stay human
  (tactic-ratchet-teeth-reading). Recorded 2026-07-11 /align-tactics round."
reading: null
gap: null
serves:
  - strategy-progressive-validation
  - strategy-reversible-institution
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-ratchet-teeth-census
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: 5e832453478006e7054f52d9a3e7770ed90e23d7ed5756a7255af1e855f682c3
validates:
  - strategy-progressive-validation
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Instrument: the project's ratchet-teeth inventory manifest with tier and validating-signal columns, plus the report the office-hours review runs

## Context

`strategy-progressive-validation`'s success signal is: observable "each
accepted ratchet tooth has a recorded prior-tier signal that validated the
need for it"; sensor "owner review at office-hours"; threshold "no tooth is
accepted without a named validating signal from the previous tier". The
reading is null and the sensor has no runnable surface: nothing enumerates
the project's accepted ratchet teeth, attributes each to the tier that
accepted it, or names the prior-tier signal that validated it — so the
review cannot produce a pass/fail reading at threshold granularity. This
tactic buys the instrument.

Fixed design frame, all recorded in the graph:

- **Tooth definition** (canonical home: `intentions/virtue-philosophical-mobility.md`,
  2026-07-08 ratcheting clarification): an attachment mechanism individually
  reasonable to add and individually costly to remove, so removal never
  happens by an act of will. Audit **by the mechanism, not by membership in
  a list** — the clarification's example categories (shared language,
  legitimacy, funding, personnel/knowledge, infrastructure/legal, cultural
  identity) are deliberately not a taxonomy.
- **Inventory ownership**: `intentions/strategy-reversible-institution.md`'s
  rationale owns "the inventory of the project's ratchet teeth" — hence this
  tactic's dual `serves`. That strategy's own signal column
  (degrade-by-inaction path per tooth) is its own future round: **out of
  scope here** beyond the free-text `removal_cost` note.
- **Tier state** (`intentions/strategy-progressive-validation.md`,
  2026-07-06 clarifications): tier 1 (author) validated by daily use; tiers
  2 (users), 3 (practitioners), 4 (collaborators) NOT entered. The tier gate
  covers invitations and obligations only, never openness — the public repo,
  the live landing CTA, and blog publishing are ungated surfaces, so their
  *existence* is a tooth only if it is costly to remove; audit by removal
  cost, not visibility.
- **Tier-1 semantics** (strategy clarification recorded 2026-07-11): the
  proposed reading — a tier-1 tooth validates against the author's own
  demonstrated need, i.e. named daily-use evidence — is reserved to the
  author at the first reading. This census *proposes* signals under that
  reading; ratification is `tactic-ratchet-teeth-reading` (born-parked,
  blocked on this tactic).

Boundary with the in-flight sibling `tactic-durability-audit-instrument`
(`phase: implement`, unmerged): same `ops/` owner-editable-manifest + report
shape (that plan is the pattern exemplar), different data class (owned-data
durability vs ratchet teeth). Do not depend on its code landing; it may
merge before or after this.

## Unit 1 — manifest schema + seeded teeth census

**Recommended model:** opus

Implement in a subagent (`model: opus`), working-tree edits only, passing
this unit's context and scope in the prompt.

Scope:

- Create `ops/ratchet-teeth/manifest.json` (the `ops/` tree currently holds
  only `ops/monitoring/` and `ops/scripts/`; no build integration). Shape:
  `{tiers_entered: [1], teeth: [{id, description, mechanism: {add_reason,
  removal_cost}, tier, accepted: {date, evidence}, validating_signal:
  string|null, notes?}]}`. Owner-editable data: every host- or
  account-specific fact is manifest data, never a constant in the report
  script. `accepted.date` may be approximate (`"2025"`, `"pre-graph"`) —
  honesty over precision. `tier` is the tier whose work accepted the tooth;
  `validating_signal` names the prior-tier signal that validated the need
  (tier-1 teeth: named author-need/daily-use evidence per the 2026-07-11
  clarification), or `null` when none is findable — a null is honest input
  to the reading, never something to invent.
- Seed the manifest by auditing the project **by the mechanism** (reasonable
  to add, costly to remove). Evidence-based starting points — the
  implementing session judges each candidate's actual removal cost and may
  conclude differently, split entries, or add ones this list misses:
  - the intention graph + `packages/intentionsutil` tooling + the `graph/**`
    CI fast path (shared language, infrastructure);
  - the agentic dispatch chain: `.claude/skills/`, hooks, the dispatch
    daemon and scheduled ticks (institutional knowledge, infrastructure);
  - Firebase/GCP footprint: Blaze billing account, `github-actions-deploy`
    service account, hosted apps on `*.commons.systems`, Cloud Scheduler
    jobs, Google Search Console (infrastructure, recurring obligations);
  - GitHub footprint: the public repo, the office-hours GitHub App, CI
    workflows (infrastructure);
  - documentation obligations: README, About page, landing page, blog
    cadence (legitimacy, shared language) — surfaces whose invitations are
    tier-gated; their existence is a tooth only where removal is costly;
  - the `.claude/rules` convention regime (shared language);
  - the repo-wide CC-BY-SA 4.0 license
    (`intentions/strategy-open-source-as-gift.md`) — recorded there as a
    stand-down precondition, i.e. a deliberately reversal-*enabling* tooth;
    record it with that note;
  - funding: client income (`intentions/delegation-client-income.md`,
    `intentions/strategy-commons-income.md`) — the parent strategy names
    funding the most dangerous tooth;
  - domains: the `commons.systems` registration
    (`intentions/strategy-owned-web-platform.md`).
- If the audit finds an accepted tooth attributable to tier ≥ 2 (e.g. a
  lingering invitation or support obligation predating the gate), record it
  honestly with its tier — the report flags it; do not omit or downgrade it.
- Out of scope: no degrade-by-inaction column (the parent strategy's own
  round); no tooth removal or remediation; no writes to `intentions/`; no
  `packages/intentionsutil/src/schema.ts` change.

## Unit 2 — report script + fixture verification

**Recommended model:** sonnet

**Dependencies:** Unit 1 (mirrors the manifest schema).

Implement in a subagent (`model: sonnet`), working-tree edits only.

Scope:

- New `ops/ratchet-teeth/report.ts`, run as `node --import tsx/esm
  ops/ratchet-teeth/report.ts --manifest <path>` (no build integration, no
  network, no `intentions/` reads — the manifest is self-contained input).
- Renders a plain markdown report to stdout, grouped by tier: per tooth its
  id, description, one mechanism line (`add_reason` → `removal_cost`),
  accepted evidence, and its validating signal or a `NO VALIDATING SIGNAL`
  line.
- Summary footer against the strategy threshold, two violation counts:
  (a) teeth with `validating_signal: null`; (b) teeth whose `tier` is not in
  `tiers_entered` (pacing violation — a tooth accepted beyond the entered
  tiers). Exit 0 only when both counts are 0; an unreadable or shape-invalid
  manifest is a fatal error naming the defect
  (`.claude/rules/code-style.md` — clear errors over fallbacks).

## Reuse

- Pattern exemplar: `intentions/tactic-durability-audit-instrument.md`'s
  plan (owner-editable `ops/` manifest + `node --import tsx/esm` report, no
  build integration) — reuse the shape, not its code (unmerged sibling).
- `.claude/rules/code-style.md` — clear errors over defensive fallbacks.
- No `packages/intentionsutil` dependency from `ops/` — the manifest is the
  sole input.

## Verification

```verify
set -e
TMP=$(mktemp -d)
printf '{"tiers_entered":[1],"teeth":[{"id":"graph","description":"t","mechanism":{"add_reason":"a","removal_cost":"c"},"tier":1,"accepted":{"date":"2026-01-01","evidence":"e"},"validating_signal":"daily use"}]}' > "$TMP/pass.json"
node --import tsx/esm ops/ratchet-teeth/report.ts --manifest "$TMP/pass.json"
printf '{"tiers_entered":[1],"teeth":[{"id":"graph","description":"t","mechanism":{"add_reason":"a","removal_cost":"c"},"tier":1,"accepted":{"date":"2026-01-01","evidence":"e"},"validating_signal":null}]}' > "$TMP/nosig.json"
if node --import tsx/esm ops/ratchet-teeth/report.ts --manifest "$TMP/nosig.json"; then echo "expected null-signal FAIL to exit nonzero"; exit 1; fi
printf '{"tiers_entered":[1],"teeth":[{"id":"npm","description":"t","mechanism":{"add_reason":"a","removal_cost":"c"},"tier":3,"accepted":{"date":"2026-01-01","evidence":"e"},"validating_signal":"x"}]}' > "$TMP/tier.json"
if node --import tsx/esm ops/ratchet-teeth/report.ts --manifest "$TMP/tier.json"; then echo "expected unentered-tier FAIL to exit nonzero"; exit 1; fi
rm -rf "$TMP"
```

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts
```

Manual: run the report against the real seeded manifest — every seeded
tooth appears exactly once under its tier and the summary counts match. A
truthful nonzero exit on the real manifest (a seeded tooth honestly lacking
a validating signal) is the reading's content, **not** a defect of this
tactic: the tactic's bar is that the manifest is an honest mechanism-audited
census and the report is accurate, not that the project currently passes the
threshold.
