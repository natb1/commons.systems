---
id: tactic-ledger-census
kind: tactic
statement: Ledger census script — enumerate every delegation record with its
  git-derived entry date so the completeness pass of the portfolio review is
  runnable
owner: ai
status: codified
parent: null
rationale: "strategy-complete-ledger has a null reading, so this round must buy
  its own instrument (align-tactics clarification 3): the sensor is the
  completeness pass of the portfolio review at office-hours, and nothing today
  enumerates the delegation ledger with record entry dates. This script is that
  instrument — a local-first CLI census the pass runs. The discovery judgment
  stays human; the census makes the pass runnable and the recording-latency half
  mechanical. Minted 2026-07-11 /align-tactics round."
reading: null
gap: null
serves:
  - strategy-complete-ledger
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-ledger-census
  pr: 2860
  attempts: {}
  markers:
    - qa-done
  strategy_fingerprint: 7e5a9be9d1d3720fc204d6e801cc3f20cb1f3c409011a9ff700944db7b525268
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Ledger census script — enumerate every delegation record with its git-derived entry date so the completeness pass of the portfolio review is runnable

## Context

`strategy-complete-ledger`'s success signal is read by the completeness pass
of the portfolio review at office-hours, but the sensor has no runnable
surface: nothing enumerates the delegation ledger with record entry dates, so
both signal terms — live attachments discovered without a record, and how
quickly new attachments get records — are read from memory. The strategy's
`reading` is null, so this round must include an instrument that makes the
sensor runnable. This tactic is that instrument: a local-first CLI census the
office-hours completeness pass runs. It prints every `kind: delegation`
record with its git-derived entry date, `last_assessed`, origin, and status,
then the standing completeness question and the strategy's in-scope category
prompts. The discovery judgment stays human — the census makes the pass
runnable and the recording-latency half mechanical.

Boundary: `tactic-delegation-capture-visibility` (a draft serving
`strategy-attention-surface`) is a goals-page ranking surface for review
prioritization by capture weight; this census is the terminal completeness
surface (entry dates + discovery prompts). They share enumeration but not
function; neither supersedes the other. No goals-page or web surface is in
scope here.

## Unit 1 — ledger-census script + tests

Recommended model: sonnet

Scope:

- New `packages/intentionsutil/scripts/ledger-census.ts`, run as
  `npx tsx packages/intentionsutil/scripts/ledger-census.ts` (no arguments).
  Resolve the repo root and `intentions/` dir from the script's own file
  location, never cwd — copy the pattern at
  `packages/intentionsutil/scripts/read-sensors.ts:44-47`.
- Load the store with `listNodes`
  (`packages/intentionsutil/src/store.ts:137`), filter
  `kind === "delegation"`.
- Entry date per record:
  `git log --follow --diff-filter=A --format=%as -- intentions/<id>.md`
  (last output line = the first add), run via `execFileSync` with
  `cwd: repoRoot` — the `execOpts` pattern at
  `packages/intentionsutil/scripts/read-sensors.ts:55-59`. A record with no
  add date yet (e.g. untracked) renders `unrecorded`; an actual git failure
  exits with a clear error, no fallback (`.claude/rules/code-style.md`).
- Render a plain-text table sorted by entry date ascending: id, entry date,
  `attributes.last_assessed` (may be absent — render `-`),
  `attributes.origin` (may be absent), status. After the table print: the
  record count; the completeness question verbatim — "What does the household
  now depend on that carries no record?"; and the in-scope category prompts
  from the strategy's scope sentence — utilities, insurance, transport, food
  supply, plus digital/institutional attachments generally.
- Keep the pure derivation/rendering helpers separate from the git call
  (inject the per-id date lookup as a function argument) so unit tests need
  no git fixture. Tests in
  `packages/intentionsutil/test/ledger-census.test.ts` using the
  fixture-builder pattern at
  `packages/intentionsutil/test/goals.test.ts:12-30`: cover the table
  rendering (sorting, absent `last_assessed`/`origin`), the `unrecorded`
  date case, and that non-delegation kinds are excluded.
- Out of scope: any goals-page/web surface, any node write, any gh or
  network call, any change to `read-sensors.ts` or its sensor registry (the
  sensor here is a human pass, not a registry sensor).

## Reuse

- `listNodes` — `packages/intentionsutil/src/store.ts:137`
- script-relative repo-root + `execFileSync` local-command pattern —
  `packages/intentionsutil/scripts/read-sensors.ts:40-60`
- `IntentionNode` type — `packages/intentionsutil/src/schema.ts`

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
```

Prose: run `npx tsx packages/intentionsutil/scripts/ledger-census.ts` from
the repo root; confirm all 21+ delegation records render, entry dates
populate (e.g. `delegation-cloud-backup` → 2026-07-02), and the completeness
question plus category prompts print after the table.
