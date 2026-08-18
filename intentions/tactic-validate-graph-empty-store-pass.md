---
id: tactic-validate-graph-empty-store-pass
kind: tactic
statement: validate-graph exits 0 on an intentions directory that exists and
  holds zero nodes, printing an ok line with a zero count, which contradicts the
  contract written three lines above its own guard -- validating nothing is
  never a pass -- so any run from the wrong working directory reports a clean
  graph instead of a usage error
owner: ai
status: raw
parent: null
rationale: "Filed 2026-08-18 as a residual of PR #3095 (graph write-path
  integrity, squash-merged to main as fe0b1c4d). PR1's closing batch could not
  carry a node create -- graph-commit's --base compare-and-swap manifest pins a
  pre-image per id, and an id with no pre-image corrupts the batch -- so the
  residuals it discovered were recorded in the PR's plan document and filed
  nowhere in the graph. This node closes that gap. PR1 made the
  intentions-directory argument required and made a MISSING directory exit 2. It
  did not close the neighbouring case: a directory that exists and is empty
  still exits 0. The comment at validate-graph.ts:111 is written as though the
  required-argument change had already settled it, so the specification is
  present and the code is one check short of meeting it. Low severity alone,
  higher in combination: this is the exact shape of vacuous pass the
  required-argument change existed to eliminate, and every verify fence in the
  serialized PR plan now runs validate-graph.ts against a path relative to a
  repo root."
reading: null
serves:
  - strategy-graph-integrity
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
# Make an empty store a non-zero exit

## Context

`validate-graph.ts` states its own contract at line 111:

> Validating "nothing" is never a pass.

`assertIsDirectory` (`:114`) enforces half of it. A path that does not exist
exits 2 with a message saying nothing was validated. A path that exists but is
**not** a directory exits 2 as well.

The third case is unguarded. A directory that exists and contains zero nodes
runs the whole validator over an empty list and reaches `:208`:

```
process.stdout.write(`ok — ${nodes.length} nodes\n`);
```

which prints `ok — 0 nodes` and exits **0**. Measured on `main` at `063b3df2`
against an empty directory: exit 0, three `ok` lines, no diagnostic.

That is the vacuous pass the required-`<intentionsDir>` change existed to
eliminate, surviving in the one shape the change did not cover. It matters more
than its size suggests because every `verify` fence in the serialized graph
write-path plan now runs `validate-graph.ts intentions` as a path relative to a
repo root — so a run from an unexpected working directory does not fail, it
reports a clean graph.

## Scope

In `packages/intentionsutil/scripts/validate-graph.ts`, after store
enumeration and before the `ok` lines at `:208`: exit non-zero when the store
resolved to zero nodes. The message must name the **resolved absolute path**,
as `assertIsDirectory` already does — the whole failure mode is a caller who
believes they pointed at a different directory than they did.

Use an exit code distinct from the existing usage errors so a caller can
distinguish *"you pointed me nowhere"* from *"you pointed me at the wrong
place"*. Both are usage errors; only one is recoverable by adding an argument.

Out of scope: the graph rules themselves, and the sensor and prose-ref
sections. This is one guard.

## Dependencies

None. Independent of the other PR #3095 residuals and can land alone.

## Reuse

- `assertIsDirectory` (`validate-graph.ts:114`) — the message shape, the
  `resolve()` call that prints the absolute path, and the "Nothing was
  validated — this is NOT a clean graph" phrasing are all established there and
  should be matched, not re-invented.

## Verification

The real graph must keep passing, and an empty directory must now fail:

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
npm test --prefix packages/intentionsutil
```

Then, by hand, point the validator at a freshly created empty directory and
confirm it exits non-zero and names that directory's absolute path. Confirm
also that a directory holding exactly one node still exits 0 — the guard is on
zero, not on "suspiciously few".
