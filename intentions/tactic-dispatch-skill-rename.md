---
id: tactic-dispatch-skill-rename
kind: tactic
statement: Atomically rename the dispatch phase-worker skills to a uniform
  dispatch-<phase> namespace with a full reference sweep
owner: ai
status: raw
parent: null
rationale: Surfaced in the 2026-07-18 /align-strategy interview recording the
  dispatch-* naming convention (clarification 67). Follows the
  atomic-rename-with-full-reference-sweep pattern of
  tactic-align-entrypoint-consolidation and its cleanup sibling
  tactic-align-init-rename-stale-node-refs. Finalize as a BACKLOG tactic
  (off-path, low rank) per clarification 69 — legitimate but low priority, must
  not preempt higher-ranked work.
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
blocked_by:
  - tactic-dispatch-skill-input-contract
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Atomically rename the dispatch phase-worker skills to a uniform dispatch-<phase> namespace with a full reference sweep

Draft context (retained by /align-strategy 2026-07-18; not yet planned). Renames every dispatch-invoked phase-worker skill to a uniform `dispatch-<phase>` namespace, drawing the align-vs-dispatch family boundary at records-vs-executes (strategy clarification 67).

## Roster (records-vs-executes taxonomy)

| new name | from | notes |
|---|---|---|
| `dispatch-plan` | `/align-tactics` | also supersedes legacy `/plan-issue` (deleted, not renamed — tactic-legacy-router-removal) |
| `dispatch-implement` | `/implement` | |
| `dispatch-fix` | `/fix-checks` | CI-red interrupt (clarification 18) |
| `dispatch-qa` | `/qa-fix` | |
| `dispatch-review` | `/review-fix` | Workflow-tool orchestrator (`.claude/workflows/review-fix.js`) |
| `dispatch-main-qa` | `/qa-main` | has a live graph node lane |
| `dispatch-conflict` | `/fix-conflicts` | behavior redesign — see [[tactic-dispatch-conflict-greenfield]] |

Out of scope: `/align` (persistent-layer recording — stays align-family); `/plan-issue`, and any other legacy issue-lane-only skill deleted by tactic-legacy-router-removal.

## Reference-site census (full sweep required — single atomic PR)

- Router directive map: `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:124-132` (the `case "$kind:$phase"` → `SKILL`/`MODEL_PHASE` map) and its explicit-arg lane `:148-153` (`/align-tactics <id>`).
- Router tests: `.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh:116-162` (assert `/implement tactic-foo`, `/review-fix tactic-r`, `/qa-fix tactic-q`, `/align-tactics strategy-x`).
- Legacy issue-lane emitter: `.claude/skills/dispatch-propagate/scripts/dispatch-route:12-16,247,315-320` (`INVOKE /qa-fix` etc.) — only for surfaces surviving legacy removal.
- Per-phase model/effort routing: `dispatch-phase-effort` / `MODEL_PHASE` policy keyed alongside `SKILL`.
- `strategy-token-economy`'s skill→phase model map (a reference site; no intent contradiction — just a rename to sweep).
- Skill directory names under `.claude/skills/`.
- Skill self-descriptions: `.claude/skills/align-tactics/SKILL.md` declares align-family identity → rewrite to `dispatch-plan` under the records-vs-executes taxonomy.
- Stale node-body skill-path pointers across `intentions/*.md` (same cleanup class as [[tactic-align-init-rename-stale-node-refs]]).

## Pattern

Single-PR atomic rename with full reference sweep, old names working until the PR merges — parity with [[tactic-align-entrypoint-consolidation]]. Fixtures/tests updated in the same PR. Coordinate with [[tactic-dispatch-skill-input-contract]] (same skills).

Sequencing (2026-07-18 topology correction, strategy migration-sequencing clarification): lands as the second of two coordinated adjacent PRs — `blocked_by: [tactic-dispatch-skill-input-contract]`; the rename sweeps the restructured skills after the input-contract PR merges. The reference-site census above is re-run at finalize (it will have drifted as in-flight work edits those files).
