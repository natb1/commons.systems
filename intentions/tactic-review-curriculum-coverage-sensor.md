---
id: tactic-review-curriculum-coverage-sensor
kind: tactic
statement: "Add a review-coverage table to the graph digest / align-audit
  report: per durable-layer node its mode (re-validation vs confirmation),
  review path, and last-reviewed date — the mechanical sensor for
  strategy-graph-review-curriculum's coverage signal"
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-07-09 /align-tactics round 1 from the retained
  2026-07-09 /align-strategy draft. The strategy's coverage signal has no
  mechanical sensor (reading null; sensor is owner review only), so this is
  round 1's instrument tactic (validates edge). Ships standalone-script-first:
  the digest host (tactic-graph-digest-tooling) and audit reader
  (tactic-align-audit-skill) are drafts; the script is the interim sensor they
  absorb later. Review-path taxonomy corrected for the 2026-07-09 review_window
  retirement: the delegation path is kind-delegation's event-based review model,
  recorded in strategy-exercise-recovery-paths' rationale."
reading: null
gap: null
serves:
  - strategy-graph-review-curriculum
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-review-curriculum-coverage-sensor
  pr: 2801
  attempts: {}
  markers:
    - planned
    - qa-passed
  strategy_fingerprint: 7a69fe4c494003260413fb401128c7efcf25eb7122f2e9b7fd9adbc3b0997cdf
validates:
  - strategy-graph-review-curriculum
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Add a review-coverage table to the graph digest / align-audit report: per durable-layer node its mode (re-validation vs confirmation), review path, and last-reviewed date — the mechanical sensor for strategy-graph-review-curriculum's coverage signal

Planned 2026-07-09 /align-tactics round 1. This is the round's instrument
tactic (`validates: [strategy-graph-review-curriculum]`): the strategy's
`reading` is null and its only sensor is owner review at office-hours
(`is_proxy: true`), so the round cannot produce a reading until this lands.

## Context

strategy-graph-review-curriculum's success signal reads coverage — zero
durable-layer nodes without a review path — and motion. This tactic ships the
mechanical coverage half: a deterministic review-coverage table computed from
the `intentions/` store. Hosting decision (recorded as strategy clarification
6): the named hosts — the graph digest (`tactic-graph-digest-tooling`) and the
/align-audit report (`tactic-align-audit-skill`) — are both still draft
tactics, so the table ships as a standalone script the same shape as
`packages/intentionsutil/scripts/frontier-view.ts`; those hosts absorb its
output when they land.

Definitions the units rely on (from the strategy's clarifications 2–3 and the
2026-07-09 graph state):

- **Durable layer** = nodes with `kind` in `{virtue, strategy, kind,
  tradition, delegation}` — at plan time 5/53/6/6/21 nodes (91 total).
  Tactics are excluded: live tactics are covered through their serving
  strategy, born-parked review items are curriculum *entries* not subjects,
  done tactics are pruned (strategy clarification 2).
- **Mode** is derivable from the node's own record (strategy clarification
  3): mode A = content held on trust (re-validate against the source); mode
  B = author-owned (re-affirm against broadened context).
- **review_window is retired** (2026-07-09, `strategy-exercise-recovery-paths`
  rationale): the delegation review model is event-based — `review_trigger`
  firings, reading-program rounds, `last_exercised`/`last_assessed` stamps.
  Do not implement a review_window path; `tactic-delegation-review-windows`
  is historical.

## Units of work

### Unit 1 — coverage module + tests

**Recommended model**: opus

**Scope.** One new source file `packages/intentionsutil/src/coverage.ts` and
one new test file `packages/intentionsutil/test/coverage.test.ts`. No changes
to existing modules. Exports:

- `interface CoverageRow { id: string; kind: string; mode: "A" | "B"; path: string; last_reviewed: string | null }`
- `computeReviewCoverage(nodes: IntentionNode[], bodyById: ReadonlyMap<string, string>): CoverageRow[]`
  — `bodyById` maps node id → the node's raw markdown text (frontmatter +
  body); the module stays pure, the script (Unit 2) does the file reads.
- `renderCoverageTable(rows: CoverageRow[]): string` — deterministic stdout
  block: one table row per durable node (id-sorted) plus a trailing summary
  line `"<N> durable nodes; <M> missing a review path: <ids>"` (`0 missing`
  when clean). No wall-clock or environment data — byte-identical across runs
  on the same store (same bar `frontier-view.ts` documents).

Rules `computeReviewCoverage` implements:

1. **Denominator**: nodes whose `kind` is one of `virtue`, `strategy`,
   `kind`, `tradition`, `delegation`. All other kinds (tactics included)
   are excluded from rows entirely.
2. **Mode**: `delegation` → `A`; `tradition` → `A` (delegated articulations
   of primary texts); any other kind with `status: "delegated"` → `A`;
   everything else → `B`.
3. **Review path** — first matching rule wins:
   1. `frontier-entry:<entry-id>` — there exists another node with
      `office_hours` non-null and `phase` ≠ `"done"` whose raw text
      (`bodyById`) contains this node's id (born-parked review items name
      their subject in prose; id substring is the mechanical linkage). When
      several match, pick the lexicographically smallest entry id.
   2. kind `delegation` → `event-based-review` when the node's `attributes`
      carry a `review_trigger` key with a non-empty string value; otherwise
      `MISSING` (a delegation without a recorded trigger has no derivable
      review path — a finding).
   3. kind `tradition` → `reading-program` (the tradition-reading program's
      recurring rounds are the standing mode-A path for articulations).
   4. mode `B` and kind `strategy` with a non-empty `attributes.conditions`
      array → `condition-sweep` (its recorded conditions are the world-state
      re-check surface).
   5. mode `B` otherwise → `frontier-reachable` (the frontier's recursive
      scope expansion is the recurrence mechanism — strategy clarification 3).
   6. anything left (mode `A` with no rule matched) → `MISSING`.
4. **last_reviewed**: the newest ISO date among (a) `readingDate(answer)`
   over each of the node's `clarifications` (reuse
   `readingDate`, exported at `packages/intentionsutil/src/router.ts:131` —
   it extracts the newest `YYYY-MM-DD` in free text); (b) any string value
   under an attributes key named `last_assessed` or `last_exercised`,
   at any nesting depth (e.g. `delegation-anthropic-claude` carries
   `attributes.last_assessed` top-level and
   `attributes.irreversibility.last_exercised` nested), run through
   `readingDate` as well. `null` when none found.

**Tests** (`test/coverage.test.ts`, model fixture style on
`packages/intentionsutil/test/goals.test.ts`): mode derivation per rule 2
(delegation, tradition, delegated status, author-owned default); path
precedence (a frontier entry beats the class path; smallest entry id wins);
`MISSING` for a delegation without `review_trigger`; `condition-sweep` only
for strategies with non-empty conditions; `frontier-reachable` default;
tactic exclusion from the denominator; a done-phase parked node does not
count as a frontier entry; `last_reviewed` picks the newest across
clarification provenance and nested stamps, `null` when none; render
determinism (two calls, byte-identical) and the missing-summary line.

**Reuse**: `IntentionNode` type (`packages/intentionsutil/src/schema.ts:102`),
`readingDate` (`packages/intentionsutil/src/router.ts:131`). Do not
reimplement date extraction or node parsing.

### Unit 2 — `review-coverage.ts` script

**Recommended model**: sonnet

**Dependencies**: Unit 1.

**Scope.** One new file `packages/intentionsutil/scripts/review-coverage.ts`,
mirroring `packages/intentionsutil/scripts/frontier-view.ts` exactly in
shape: repo root resolved from `import.meta.url` (never cwd), a `main()`
behind the `pathToFileURL` guard, stdout only, no arguments, no network. It
calls `listNodes` (`packages/intentionsutil/src/store.ts:124`), builds
`bodyById` by `readFileSync` of `intentions/<id>.md` for each listed node,
and prints `renderCoverageTable(computeReviewCoverage(nodes, bodyById))`.

## Reuse

- `packages/intentionsutil/scripts/frontier-view.ts` — the script template
  (path resolution, determinism doc comment, main guard).
- `packages/intentionsutil/src/store.ts:124` `listNodes` (id-sorted).
- `packages/intentionsutil/src/router.ts:131` `readingDate`.

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
npx tsx packages/intentionsutil/scripts/review-coverage.ts
```

Prose: the script's table should list all durable-layer nodes (91 at plan
time — 5 virtue / 53 strategy / 6 kind / 6 tradition / 21 delegation; the
count will drift with the graph), with `tactic-align-audit-legacy-review`
(born-parked) appearing as `frontier-entry:` path for the nodes its
`office_hours.reason` names, and any delegation lacking `review_trigger`
listed in the missing-summary line as a finding. Recording the strategy's
first `reading` from this output is the round's completion-time write, not
part of this tactic.
