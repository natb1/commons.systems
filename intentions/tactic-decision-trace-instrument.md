---
id: tactic-decision-trace-instrument
kind: tactic
statement: "instrument: decision-trace digest — assemble graph-history evidence
  that decisions trace to node changes, for the owner's office-hours reading"
owner: ai
status: codified
parent: null
rationale: "strategy-explicit-intent's reading is null, so round 1 must buy its
  own instrument (an unmeasurable strategy first buys its instrument). The
  recorded sensor is owner review at office-hours (is_proxy: true) — human
  judgment, never auto-written — and this digest makes that review runnable by
  mechanically assembling the candidate trace events the observable names:
  dialectic outputs citing node ids, condition-driven strategy retirement or
  re-derivation, calibration challenges moving a node. The owner judges the
  threshold at the sitting (tactic-decision-trace-first-reading)."
reading: null
gap: null
serves:
  - strategy-explicit-intent
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-decision-trace-instrument
  pr: 2852
  attempts: {}
  markers:
    - qa-done
    - reviewed
  strategy_fingerprint: a10d001daf8fd0335625aea2c5eb394c1216abdd4d73313c6ba3881e2f69a64b
validates:
  - strategy-explicit-intent
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# instrument: decision-trace digest — assemble graph-history evidence that decisions trace to node changes, for the owner's office-hours reading

## Context

strategy-explicit-intent's success signal: observable "decisions trace to the
graph — dialectic outputs cite node ids, a failed condition retires or
re-derives a strategy, a calibration challenge moves a node"; sensor "owner
review at office-hours"; threshold "each review cycle shows at least one
decision that changed because a node changed"; `is_proxy: true`. The
strategy's `reading` is null, so round 1 must buy its own instrument. The
sensor is human review — a machine must never auto-write this reading — so
the instrument is a digest: it mechanically assembles the candidate trace
events from the graph's git history, and the owner judges the threshold at an
office-hours sitting (tactic-decision-trace-first-reading, blocked on this
tactic, records the reading).

All three observable clauses are graph-visible events, so the digest reads
them from `git log -p -- intentions/` line-level patch heuristics — the same
technique `readTacticVelocity` already uses
(`packages/intentionsutil/scripts/read-sensors.ts:187`).

## Unit 1 — trace-decisions.ts digest script

**Recommended model:** sonnet

Scope:

- New `packages/intentionsutil/scripts/trace-decisions.ts`. Runnable from
  anywhere (resolve the repo root from the script's own file location, as
  `read-sensors.ts:44-46` does — never from cwd). CLI:
  `npx tsx packages/intentionsutil/scripts/trace-decisions.ts [--since <git-date>] [--json]`,
  default window 30 days.
- Scan `git log --since=... -p --no-renames -- intentions/` (cwd repoRoot)
  and emit candidate decision-trace events grouped into three classes
  mirroring the observable's clauses:
  1. **Dialectic outputs cite node ids** — commits adding `clarifications`
     entries to a `strategy-*.md` or `virtue-*.md` (added lines matching the
     block-sequence `question:`/`answer:` shape under an intentions strategy
     or virtue path).
  2. **A failed condition retires or re-derives a strategy** — commits
     editing an `attributes.conditions` block, deleting a `strategy-*.md`
     file, or changing a strategy's substance lines (`statement:`,
     `success_signal` block).
  3. **A calibration challenge moves a node** — commits changing an
     `attention:` block (boost/override/rationale lines) on any node.
- Each event line: ISO date, short commit hash, node id (derived from the
  file path), event class, and a one-line summary. Human-readable digest to
  stdout grouped by class with per-class counts; `--json` emits the same as
  a JSON array for machine use.
- A git failure (not a repo, bad `--since`) exits non-zero with the error —
  clear errors over fallbacks (`.claude/rules/code-style.md`); this is an
  operator-run script, not a total batch sensor.
- Unit tests in `packages/intentionsutil/test/trace-decisions.test.ts`
  following the temp-fixture-repo pattern of
  `packages/intentionsutil/test/lifecycle-sensor.test.ts:14-30` (mkdtemp +
  `git init -b main` + deterministic author env): one fixture commit per
  event class plus a no-match control (e.g. a body-only edit), asserting
  class attribution, node-id derivation, and the `--json` shape. Export the
  scan function from the script for the tests, as `read-sensors.ts` exports
  its readers.

Out of scope:

- Registering a sensor in `buildDefaultRegistry`
  (`scripts/read-sensors.ts:545`) — the recorded sensor is the owner's
  review; no automatic `reading` write for this strategy.
- Office-hours UI surfacing of the digest; any gh/network IO.
- Writing `reading`/`gap` on the strategy — that is the sitting's job
  (tactic-decision-trace-first-reading).

## Reuse

- Patch-heuristic scanning over `git log -p -- intentions/`:
  `readTacticVelocity`, `packages/intentionsutil/scripts/read-sensors.ts:187`.
- Repo-root resolution from the script file:
  `packages/intentionsutil/scripts/read-sensors.ts:44-46`.
- Fixture-repo test helpers:
  `packages/intentionsutil/test/lifecycle-sensor.test.ts:14-30`.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

Manual: run `npx tsx packages/intentionsutil/scripts/trace-decisions.ts
--since 2026-07-07` against this clone — the digest lists the 2026-07-08/09
clarification amendments on `strategy-explicit-intent` under class 1.

## Implementation notes

Single unit; implement in a subagent launched with `model: sonnet`; supply
this Context and the Unit 1 Scope in the subagent prompt; constrain it to
working-tree edits only.
