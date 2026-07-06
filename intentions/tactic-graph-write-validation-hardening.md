---
id: tactic-graph-write-validation-hardening
kind: tactic
statement: "Harden graph write-path validation: symlink type check in the
  fast-path guard, semantic shape rules in the schema, tactic-body loss guard on
  kind change"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: Deferred-finding draft per strategy-graph-native-dispatch
  clarification 19 — recorded by the 2026-07-04 independent review round of PRs
  2748 and 2742 (merged without review; no in-scope findings). All entries are
  defense-in-depth on paths that currently fail closed; finalized 2026-07-04 by
  the clarification-19 /align-tactics re-evaluation; off-path (no validates
  chain), so calculated attention demotes it below round tactics.
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-graph-write-validation-hardening
  pr: 2775
  attempts: {}
  markers: []
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Harden graph write-path validation: symlink type check in the fast-path guard, semantic shape rules in the schema, tactic-body loss guard on kind change

**Finalized 2026-07-04** by the clarification-19 `/align-tactics`
re-evaluation, from the deferral draft recorded by the same-day independent
review of PRs #2748 and #2742. Off-path: no `validates` chain reaches this
node, so calculated attention demotes it below round tactics at read time.
One PR.

## Context

The 2026-07-04 review of the `graph/**` CI fast path (PR #2748) and the
intentionsutil schema/store changes (PR #2742) found no in-scope contract
violations — every gap below sits on a path that currently fails closed.
They are defense-in-depth, deferred per strategy clarification 19: each
removes a reliance on a *downstream* accident of implementation (frontmatter
parsing happening to reject a symlink target; no consumer yet parsing
`office_hours.since`) and replaces it with an explicit rule at the boundary.

## Unit 1 — reject non-regular files in the fast-path guard

**Recommended model:** sonnet

Scope — `.github/workflows/graph-fast-path.yml`, guard job only. The
guard's diff filter is name-based (`grep -v '^intentions/'` over
`git diff --name-only origin/main...HEAD`): a committed symlink at
`intentions/x.md` passes the name check, and only `validate-graph`'s
frontmatter parsing of the resolved content stands between it and a
stamped SHA. Add an explicit mode check to the guard step: fail when any
changed path under `intentions/` is not a regular blob — e.g.
`git diff --raw origin/main...HEAD -- intentions/` entries whose dst mode
is `120000` (symlink) or `160000` (gitlink), or simply
`find intentions -type l` returning matches. Fail closed (non-zero exit),
matching the guard's existing style.

## Unit 2 — schema semantic shapes and writeNode kind-change guard

**Recommended model:** sonnet

Scope — `packages/intentionsutil/src/schema.ts`,
`packages/intentionsutil/src/store.ts`, tests under
`packages/intentionsutil/test/`:

- `schema.ts`: `execution.pr`, each `execution.attempts` value, and
  `rounds.count` currently accept any finite number — require
  non-negative integers. `office_hours.since` accepts any string —
  require `^\d{4}-\d{2}-\d{2}$` (the shape `graph-commit`'s `park_write`
  already writes via `date -u +%Y-%m-%d`). Before tightening, scan the
  live store (`intentions/`) for violating values; if any exist, fix them
  in this PR (state-only follow-through), else the validator change is
  a no-op on existing data.
- `store.ts` `writeNode`: tactic-body preservation triggers on
  `kind === "tactic" && existsSync(filePath)` alone, so rewriting an
  existing tactic with `kind` changed away from `tactic` regenerates the
  placeholder body and silently discards a hand-authored plan. Throw on a
  kind change that would drop an existing non-placeholder tactic body
  (clear error over fallback); a deliberate reclassification then
  requires deleting or rewriting the file explicitly.
- Add unit tests for each new rejection and for the kind-change throw.

Recorded, explicitly out of scope: referential/layer rules staying
`validateGraph`-only (not enforced at `writeNode` time) is accepted design
— every current write path lands through CI's `committed-store.test.ts`
or the fast path's `validate-graph` gate. Re-examine only if a write path
appears that skips both.

## Dependencies

Units are independent; both land in the one PR.

## Reuse

- The guard job's existing fail-closed shell style in
  `.github/workflows/graph-fast-path.yml` — extend the same step, do not
  add a second job.
- `requireString`/`requireNumber`/`isPlainObject` helpers in `schema.ts`
  — add `requireNonNegativeInt`/date-shape checks beside them.
- Existing round-trip tests in `packages/intentionsutil/test/` as the
  template for the new cases.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions
```

Manual: push a scratch `graph/**` branch adding an `intentions/` symlink
and confirm the guard job fails; delete the scratch branch after.
