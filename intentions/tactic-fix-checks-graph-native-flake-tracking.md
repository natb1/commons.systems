---
id: tactic-fix-checks-graph-native-flake-tracking
kind: tactic
statement: "Graph-native flake-tracking parity for fix-checks: replace
  /file-issue-based flake filing with a tactic-node + blocked_by design on the
  node lane"
owner: ai
status: raw
parent: tactic-graph-native-dispatch
rationale: "Retained /align-strategy byproduct (2026-07-16): fix-checks's
  node-lane Flake sub-path (.claude/skills/fix-checks/SKILL.md Step 4) still
  calls /file-issue to find-or-file a flake tracking issue and block the PR's
  tracked GitHub issue on it — dead on both counts now that GitHub Issues are
  disabled repo-wide (has_issues: false) and the node lane forbids gh issue
  reads/writes entirely. This surfaced live blocking PR #2880
  (tactic-phase-standup-audit-lens), which had to park to office-hours instead
  of autonomously self-unblocking. Full design recorded on
  strategy-graph-native-dispatch's 2026-07-16 clarification; this draft carries
  the implementation decisions for a later /align-tactics planning pass."
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
# Graph-native flake-tracking parity for fix-checks: replace /file-issue-based flake filing with a tactic-node + blocked_by design on the node lane

## Context

`.claude/skills/fix-checks/SKILL.md` Step 4's Flake sub-path is GitHub-Issues
based end to end: it calls `dispatch-flake-dedup` (searches `gh issue` for a
matching fingerprint) and `/file-issue` (creates a `gh issue`) to track a
non-reproducing CI flake, then records a `blocked_by` dependency **on the PR's
tracked GitHub issue** so `/dispatch-propagate`'s queue scan skips the PR until
the flake is resolved. This surfaced as fully dead on the node lane while
resolving PR #2880 (`tactic-phase-standup-audit-lens`): GitHub Issues are
disabled repo-wide (`gh api repos/natb1/commons.systems --jq .has_issues` →
`false`), and the node lane's own rule (this skill's preamble) forbids any `gh`
issue read/write regardless. `/fix-checks` had to park the node to
office-hours instead of autonomously self-unblocking — the exact "legacy
parity" gap `strategy-graph-native-dispatch`'s coverage matrix (this node's
§4) exists to close, just not yet mapped for this indirect `/file-issue`
caller.

Full design recorded in the 2026-07-16 `/align-strategy` interview (see
`strategy-graph-native-dispatch`'s clarification of the same date) and applied
immediately to PR #2880 as a worked example
(`tactic-baseline-proxy-float-tolerance`, `blocked_by` wired onto
`tactic-phase-standup-audit-lens`, its `office_hours` cleared). This tactic
generalizes that worked example into the reusable `fix-checks` mechanism.

**Design (already decided, not open for re-litigation in the planning
session — plan the units, don't re-derive the design):**

- On `is_flake == true` (node lane), find-or-create a **tactic node** — not a
  GitHub issue — keyed by the same fingerprint `fix-checks` already computes
  (`<failing-check-name> — <stable-id>`, unchanged). The node body carries the
  same content the GH issue body used to: the fingerprint, the reproduce
  command, and the failure excerpt/diagnosis.
- Set `blocked_by: [<that tactic's id>]` on the **source tactic** (the one
  whose CI run hit the flake) — replacing the `gh api` dependency call onto a
  tracked GitHub issue.
- Do **not** escalate to office-hours for this case. This mirrors legacy's own
  flake path exactly (file + block + queue-skip, no park), and it is provably
  sufficient: `packages/intentionsutil/src/router.ts`'s `blockersComplete`
  already treats a `blocked_by` entry as complete when the blocker is absent
  from the store or present with `phase: done` — so the router's existing
  selection-eligibility gate re-surfaces the source tactic automatically once
  the flake-fix tactic reaches `phase: done`. No new auto-resume plumbing is
  needed anywhere in `router.ts`/`attention.ts` — only correct edge modeling
  in `fix-checks`.
- Steelman considered and declined (2026-07-16 interview): a centralized flake
  registry (tracking fingerprints as a set, one dedicated node, rather than N
  one-off tactics scattered under whichever strategy owns the touched file)
  would make recurrence more visible at a glance, but parsimony favors reusing
  the existing tactic + `blocked_by` primitive for a problem with no
  demonstrated volume yet. If flake recurrence becomes frequent enough to
  matter, that is a future strategy re-evaluation trigger, not something to
  pre-build for now.

## Unit 1 — port `dispatch-flake-dedup`'s find-or-file guard to search tactic nodes

**Recommended model:** opus

The dedup guard's four-way disposition (`NONE` / `EXISTING` / `REOPENED` /
`STALE`) encodes real judgment about issue lifecycle and stale-head detection
that must be faithfully re-derived over tactic-node state, not just
mechanically re-pointed at a different backend.

Scope:
- `.claude/skills/dispatch-propagate/scripts/dispatch-flake-dedup` (or a new
  graph-native sibling script, author's call at plan time) — replace the
  `gh issue list`/`gh issue view` fingerprint search with a grep over
  `intentions/tactic-*.md` for a matching fingerprint (stored in the node body
  or a dedicated field — decide at plan time whether the fingerprint needs a
  first-class frontmatter field or stays body-text-only, matched by grep like
  today's GH-issue-title matching).
- Re-derive each disposition against tactic-node semantics:
  - `NONE` → no matching tactic exists; create one (see Unit 2).
  - `EXISTING` → a matching tactic exists and is still open (`phase` set,
    not `done`); append the recurrence to its body, do not create a new one.
  - `REOPENED` → a matching tactic reached `phase: done` (or was pruned) but
    the flake fired again; the graph-native equivalent of "reopen" needs a
    concrete definition — likely re-creating the tactic if pruned, or
    resetting `phase` if the done tactic is still present in the transient
    pre-prune window. Decide the exact mechanics at plan time.
  - `STALE` → the triggering run's head doesn't contain the closing fix
    commit (ancestry `behind`/`diverged`) — the PR branch is stale and still
    emitting the pre-fix signature; no create, no reopen, matching today's
    suppression behavior.
- Preserve the existing run-id/ancestry-based stale-head detection logic
  (`dispatch-flake-dedup`'s current `STALE` branch) — only the search/create
  backend changes, not the staleness judgment itself.

Dependencies: none (this is the first unit; Unit 2 depends on it).

Reuse:
- `.claude/skills/dispatch-propagate/scripts/dispatch-flake-dedup` — the
  existing four-way disposition logic and its stale-head ancestry check;
  port the judgment, replace only the GH-issue-specific search/create calls.

## Unit 2 — rewrite `fix-checks`'s node-lane Flake sub-path

**Recommended model:** sonnet

Mechanical rewrite once Unit 1's primitive exists — the design is already
fixed above.

Scope:
- `.claude/skills/fix-checks/SKILL.md` Step 4's Flake sub-path (find-or-file
  issue, block PR's tracked issue) — on the node lane, replace `/file-issue`
  and the `blocked_by`-on-GH-issue wiring with: call Unit 1's tactic-node
  dedup primitive; on `NONE`, write a new tactic node (fingerprint, reproduce
  command, failure excerpt in the body — same content shape the GH issue body
  used to carry, `serves` whichever strategy owns the affected file/tool, not
  a forced default); on any disposition, set `blocked_by` on the **source**
  tactic to the flake tactic's id (idempotent — skip if already present); do
  **not** escalate to office-hours for this outcome.
- Leave the **legacy issue lane**'s Flake sub-path untouched in this unit —
  GitHub Issues being disabled makes the legacy lane's `/file-issue` calls
  fail regardless of what this tactic does, and legacy-lane removal is
  already tracked separately (`tactic-legacy-router-removal`,
  validates-terminal on `strategy-graph-native-dispatch`'s round-1 subtree).
  Do not conflate the two.
- Update the accumulator (`tmp/fix-checks-summary.md`) template's "Flake
  issue" / "Fingerprint" fields to name the tactic id instead of a GH issue
  number.

Dependencies: Unit 2 depends on Unit 1.

Reuse:
- `.claude/skills/fix-checks/SKILL.md` Step 4's existing Flake sub-path
  structure (fingerprint computation, run-id capture) — unchanged; only the
  find-or-file-and-block mechanics change.
- `packages/intentionsutil/scripts/write-node.ts` /
  `packages/intentionsutil/scripts/graph-commit` — the standard node-write and
  landing primitives, already used elsewhere in `fix-checks`'s node lane.

## Verification

Prose only — this is a process/skill change with no isolated automated test
surface of its own:

- Dry-run against a synthetic flake on a throwaway node-lane worktree: confirm
  a new tactic node is created (or an existing one is appended to, per
  disposition), `blocked_by` lands on the source tactic, and `office_hours`
  stays `null` throughout.
- Confirm the router genuinely re-selects the source tactic once the flake
  tactic is manually transitioned to `phase: done` — the concrete assertion
  this tactic's whole design rests on (`packages/intentionsutil/src/router.ts`
  `blockersComplete`).
- Confirm `dispatch-flake-dedup`'s ported `STALE` suppression still holds
  (a stale PR branch re-emitting the pre-fix signature does not spuriously
  reopen or duplicate).
