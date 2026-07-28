---
id: tactic-office-hours-graph-type-passthrough
kind: tactic
statement: Plumb --type <session-type> through the office-hours-graph entry
  point so the session-type filter is reachable from the ergonomic launcher
owner: ai
status: raw
parent: null
rationale: "Deferred out-of-scope finding from the /review-fix review pass on
  tactic-office-hours-session-type (PR #2961). The selector gained --type but
  the launcher that actually provisions worktrees and starts sessions never
  forwards it, so the tactic's stated intent is only half-delivered at the level
  the author uses."
reading: null
gap: null
serves:
  - strategy-attention-surface
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
# Plumb --type <session-type> through the office-hours-graph entry point so the session-type filter is reachable from the ergonomic launcher

## Provenance

Deferred finding from the `/review-fix` review pass on
`tactic-office-hours-session-type`. Source PR: #2961 (`execution.pr` of the
reviewed tactic). Surfaced by the `code-review` finder; dispositioned
**Deferred** by the residue phase — a real gap, but the reviewed tactic's plan
scopes the change to "the office-hours selector" and never mentions
`office-hours-graph` plumbing, so it reads as a deliberate scope boundary
rather than an oversight. Adversarial verdict: not applicable (the residue
phase's disposition path does not run adversarial verification; the finding was
deferred, not refuted).

**Location:** `packages/intentionsutil/scripts/office-hours-graph:56`

## Failure scenario

`office-hours-select.ts` now supports `--type <session-type>` (and
`--type=<t>`) to pull one office-hours session type on demand, but the filter
is unreachable from the ergonomic entry point.

`packages/intentionsutil/scripts/office-hours-graph` parses its first argument
as a node id (`TARGET="${1:-}"`, ~line 56) and forwards no flags to the
selector. So `office-hours-graph --type curriculum-review` sets
`TARGET="--type"`, the selector returns `office-hours-select: missing value for
--type` with exit 2, and `set -e` aborts the script with a message that does
not explain the real problem.

The author can only use `--type` by invoking the raw selector (`npx tsx
packages/intentionsutil/scripts/office-hours-select.ts --type <t>`), which
prints a `launch <id> <cwd>` line but performs no worktree provisioning,
liveness dedup, or session launch — all of that lives in `office-hours-graph`.
The intent of `tactic-office-hours-session-type` ("pull one session type on
demand") is therefore only half-delivered at the level the author actually
uses.

## Scope

- Accept an optional `--type <t>` / `--type=<t>` before the positional node id
  in `office-hours-graph`, keeping the existing `office-hours-graph <node-id>`
  and bare `office-hours-graph` forms unchanged.
- Forward the value to both selector call sites in `resolve_directive`: the
  `--list` call (~line 234) and the queue-head/per-node calls. Keep `--type`
  mutually exclusive with a positional node id, matching the selector's own
  rule.
- Update the `# Usage:` block in the script header.

## Verification

- `office-hours-graph --type curriculum-review` selects a curriculum park;
  `--type other` excludes them.
- `office-hours-graph <node-id>` and bare `office-hours-graph` behave exactly
  as before.
- `office-hours-graph --type curriculum-review <node-id>` errors clearly rather
  than silently ignoring one of the two.
- Consider adding an `office-hours-graph` smoke test alongside the
  `dispatch-sweep` cases in
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`, using
  the existing `OFFICE_HOURS_CLAUDE_CMD` stub hook.
