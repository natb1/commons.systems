---
id: tactic-graph-commit-merge-npx-park-storm
kind: tactic
statement: graph-commit's far-ahead replay now routes every divergent node
  through run_merge_node (npx tsx merge-node.ts); when npx cannot run (sandbox
  EROFS, cold cache, registry outage) the merge crash is treated as an
  unresolvable divergence and pushed to main as an office_hours park instead of
  a clear environment error, turning a transient npx failure into a fleet-wide
  park storm
owner: ai
status: raw
parent: null
rationale: null
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
# npx unavailability in the far-ahead merge replay converts a transient environment failure into a pushed office_hours park

## Provenance

- Surfaced by the `review-fix` pass on PR #2989 (source tactic
  `tactic-graph-commit-intentions-base-stale-restore`), red-team finder,
  disposition `Deferred` (out of scope for that PR — this is a pre-existing
  weakness in a primitive the PR newly routes a common path through, not a
  defect introduced by the PR's own diff).
- Location: `packages/intentionsutil/scripts/graph-commit`, `run_merge_node()`
  (around line 685-710, shells out to `npx tsx "$MERGE_NODE_SCRIPT"`) and
  `ensure_intentions_only_base()` / `replay_snapshot_onto_base()` (around line
  807-859, the new caller that decides to park on a `run_merge_node` failure).

## Failure scenario

Per `.claude/rules/sandbox.md`, `npx` fails with `EROFS` writing
`~/.npm/_cacache` under the sandbox, and cannot reach the npm registry when a
package is not already cached. `graph-commit` callers run it through the
sandboxed Bash tool. `run_merge_node()` deliberately never dies on a crash — it
appends a `{id, note: "could not attempt structural merge"}` sentinel and
returns 1. The new far-ahead replay path (added by PR #2989) treats that 1 the
same as a genuine content divergence: it sets `unresolved=1` and calls
`park_and_exit()`, which fetches, resets, writes `office_hours` onto every id
via `store.ts`, **commits and pushes that park to protected `main`**, and exits
1.

So anyone or anything able to deny npm-registry/cache access (a network egress
block, a poisoned/emptied npm cache, a registry outage) converts every
far-ahead graph write that touches a concurrently-moved node into a pushed
`office_hours` park plus a hard failure — a self-inflicted park storm across
the fleet, with the parks landing on `main` as durable state a human must then
drain. Before PR #2989, this path never invoked `npx` at all — the far-ahead
rebuild was a pure `cp`/`rm`, so the blast radius of an unavailable `npx`
didn't include it. The blast radius also covers every invocation that passes
no `--base` (most of them), since `check_base_freshness()` short-circuits
without `--base` but the far-ahead replay does not.

## Adversarial verdict

This finding was surfaced by the red-team finder in the review-fix Workflow and
classified `Deferred` (advisory, not required for PR #2989) rather than
`Required` — it was not sent through the adversarial skeptic verify stage
(only `Required` findings are). It is filed here for triage, not pre-verified.

## Recommended fix

Distinguish "merge tool could not run" from "content genuinely diverged"
before deciding to park. Give `run_merge_node()` a distinct return code (or a
distinct sentinel the caller inspects) for the crash/unparsable-stdout case,
and have `ensure_intentions_only_base()` `die` with the captured stderr on that
code — a broken environment is a clear error, not graph state to write
(`.claude/rules/code-style.md`). Additionally consider resolving `tsx` from a
vendored/pinned local binary (e.g. `node_modules/.bin/tsx`) rather than `npx`,
so the write path has no runtime registry dependency.

## Out of scope

Not addressed by PR #2989 (source: `tactic-graph-commit-intentions-base-stale-restore`).
This is a draft — a later `/align-tactics` round should finalize it into a
plannable tactic (or dismiss it) after re-validating this provenance against
what actually merged.
