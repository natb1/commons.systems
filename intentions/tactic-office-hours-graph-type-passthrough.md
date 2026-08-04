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
office_hours:
  reason: "This /align-tactics tactic-office-hours-graph-type-passthrough round
    could not autonomously finalize this draft: the align-tactics Workflow's
    tactic-mode drift phase declined to author a plan (disposition 'escalated',
    tactics[0].body_markdown null) because its ELIGIBILITY SANITY CHECK judged
    serving strategy strategy-attention-surface 'not decomposable this round'
    (twelve non-draft children already on its signal path) -- a
    strategy-round-decomposability question that is orthogonal to finalizing
    this one already-scoped, already-frozen draft. The drift review's own Side A
    / Side B substance passed cleanly (side_a_failed_conditions: [], both
    unrecorded_premises immaterial: PR #2961 merged 2026-07-28 unblocking
    tactic-office-hours-session-type-strategy-review, and this strategy's
    subtree is idempotent-complete pending
    tactic-attention-surface-analytics-collector), so nothing about THIS
    tactic's own content or scope blocks it. This is a known, already-tracked
    tooling defect, not a fresh finding: buildDriftPrompt
    (.claude/workflows/align-tactics.js) is not mode-aware and driftProceed
    gates tactic-mode plan authoring on the strategy's round-decomposability
    verdict -- see tactic-align-tactics-tactic-mode-drift-gate (phase review, PR
    #2982 'align-tactics: split tactic-mode plan gate from strategy
    round-decomposability', OPEN/unmerged as of 2026-08-04), whose planned fix
    (a computePhaseGates helper splitting decomposeProceed from planProceed,
    with mode threaded into the drift prompt) directly addresses this failure
    mode. A second live rediscovery of the same defect also sits at
    tactic-align-tactics-workflow-tactic-mode-drift-gate (status raw, filed
    2026-08-04) -- likely a duplicate of
    tactic-align-tactics-tactic-mode-drift-gate, but deduping it is outside this
    session's single-node write scope. Recommend: after PR #2982 merges, re-run
    /align-tactics tactic-office-hours-graph-type-passthrough -- the finalize
    should then proceed autonomously with no author input needed, since the
    underlying scope (accept --type/--type=<t> before the positional node id in
    office-hours-graph, forward it at both office-hours-select.ts call sites,
    update the usage block) is already fully specified in this node's own body."
  since: 2026-08-04
  recommendation: null
  session_type: other
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
