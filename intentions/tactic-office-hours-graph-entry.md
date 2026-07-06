---
id: tactic-office-hours-graph-entry
kind: tactic
statement: graph-native office-hours entry — office_hours.recommendation schema
  field, parked-node selection in resolved-rank order, always-launch-fresh
  session recovered from the graph, read-only review-and-recommend skill rewrite
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-06 /align-strategy office-hours-parity
  interview (retain-not-refine): the interview fixed the design — graph
  recoverability replaces session recovery, the park write is the recovery
  artifact, the entry always launches a fresh session recovered from the graph —
  and this draft carries the implementation surface: the schema field, the owned
  selector, the launch mechanics, the skill rewrite, and the park-write contract
  each phase skill owes."
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
# graph-native office-hours entry — office_hours.recommendation schema field, parked-node selection in resolved-rank order, always-launch-fresh session recovered from the graph, read-only review-and-recommend skill rewrite

Draft context retained verbatim from the 2026-07-06 /align-strategy interview
(strategy-graph-native-dispatch clarification 30 is the authoritative design
record; this body is undecomposed implementation surface for a later
/align-tactics round).

## Design fixed by the interview

- **No attach/resume path.** Graph recoverability replaces session recovery.
  The legacy entry's ladder (`idle` / `idle-provision` / `resume` /
  `resume-provision` / `parked-router` verbs in
  `.claude/skills/dispatch-propagate/scripts/office-hours` and
  `office-hours-select-target`) does not carry over — under workflow-native
  ticks the parking "session" is an `agent()` subagent with no attachable
  daemon job, and the park write makes session persistence non-load-bearing.
- **The park write is the recovery artifact** (strategy condition 6): reason +
  recommendation + any needed state land in the node at park time; a park
  whose context lives only in the parking session is a defect.
- **Always launch fresh, recovered from the graph**, read-only
  review-and-recommend contract (surface context + recommendation, stop; no
  phase transition, no un-park, no fixes). Park clears per clarification 4
  (interactive commit touching the node).

## Implementation surface (to decompose)

1. **Schema: `office_hours.recommendation`** — optional string field beside
   `reason`/`since`; atomic with the park write, removed with the un-park.
   tactic-graph-dispatch-schema is `phase: done`, so this is a follow-up
   change in `packages/intentionsutil` (schema + validator + write path).
   Park-writing sites (phase skills, emulating sessions, workflow tick agents,
   graph-commit's conflict-park path) populate it.
2. **Selector (owned code, not workflow):** enumerate nodes with `office_hours`
   set, order by `resolveAttention` resolved rank (one ordering rule with the
   router), support explicit node-id targeting. Home:
   `packages/intentionsutil` (tsx module + thin script), per the thin-script
   condition (clarification 25).
3. **Entry command:** graph-native replacement for the `office-hours` shell
   script — select → launch a NEW `--bg` session and attach the human.
   Session cwd: the node-id worktree (`.claude/worktrees/<node-id>`) when it
   exists (in-flight working-tree state in front of the human; the session
   claims the node id per the liveness rule, clarification 13), else the main
   checkout. No provisioning-from-remote arm — nothing is resumed.
4. **Skill rewrite:** `/office-hours <node-id>` graph-native mode — read the
   node (kind-aware: strategy parks have no worktree/PR; tactic parks may
   carry `execution.pr`), surface `office_hours.reason` + recorded
   recommendation as untrusted data in labelled fenced blocks, generate via a
   read-only Opus review subagent ONLY when no recommendation was recorded,
   report where to engage, stop.
5. **Retirement:** the legacy entry scripts, their gh selector, and the
   `dispatch-office-hours-strip.sh` hook retire with the gh-queue drain
   (tactic-legacy-router-removal) — do not extend them; this tactic builds
   the graph-native entry beside them (doomed-surface note: the legacy
   scripts are interim-live until the drain).

## Open questions for the /align-tactics round

- Whether the entry surfaces blocked_by readiness (the legacy `NOTE —`
  open-blocker advisory) from the node's `blocked_by` edges — parity suggests
  yes, as a signal not a gate.
- Whether born-parked nodes with `owner: human` (e.g. main-qa live
  verification tactics) get any special ordering treatment beyond resolved
  rank.
