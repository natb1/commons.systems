---
id: tactic-workflow-launch-contract-home
kind: tactic
statement: Give the Workflow launch contract one home and repoint the five skill
  sites at it
owner: ai
status: raw
parent: null
rationale: Five skill sites each restate a Workflow launch directive as a file
  path, which invites the scriptPath form that dies unrecoverably when a
  background session forks. Surfaced 2026-07-27 during a /align-tactics
  tactic-mode round that burned four launches and five killed subagents. One
  home, five pointers, no restatement.
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
# Give the Workflow launch contract one home and repoint the five skill sites at it

Retained from the 2026-07-27 `/align-strategy` round. See
`strategy-graph-native-dispatch` clarifications on the launch contract, the
mechanical-floor placement, and the resume carve-out for the full ground.

## Context

Five skill sites each restate the same Workflow launch directive as a file
path — a phrasing that reads as the Workflow tool's `scriptPath` parameter.
A `scriptPath` launch persists no harness-owned script copy, so when a
background session forks at a turn boundary the fork emits
`[adopt] workflow <id> skipped: scriptPath rejected`, kills every agent
mid-flight, and the run cannot be resumed (`resumeFromRunId` carries the same
rejected path). The wrong form works in a foreground session and dies only in
a background one — which is how the fleet dispatches every one of these skills.

The wording has already mis-fired twice in the session record besides the
2026-07-27 round: session `d19c3c7f` (2026-07-05) passed the path as `name` and
got `Workflow ".claude/workflows/review-fix.js" not found`; session `88a4c17d`
(2026-07-11) passed `scriptPath: '.claude/workflows/qa-fix.js'` and survived only
because that run never crossed a fork.

## Scope

The five sites, all carrying the same directive:

- `.claude/skills/align-tactics/SKILL.md:210`
- `.claude/skills/align-tactics/references/tactic-target.md:100`
- `.claude/skills/review-fix/SKILL.md:284`
- `.claude/skills/qa-fix/SKILL.md:324`
- `.claude/skills/qa-fix/references/disposition-workflow.md:69`

Create one canonical home — `.claude/rules/` is the natural container, alongside
`sandbox.md` and `shell-json.md`, since rules are project instructions already
loaded into every session's context. It states: launch by registry `name` (or
inline `script` for an ad-hoc script); `args` may be an object or a JSON string;
`scriptPath` only against the harness-returned persisted path, never from a
skill; and the recovery rule — on `adopt scriptPath rejected`, relaunch by
`name`, never retry the same form.

Each of the five sites becomes a pointer at that home and restates no mechanics.
Sweep `.claude/skills/**` for any other launch-form prose while there; as of
2026-07-27 a `grep -rn scriptPath .claude/` returns nothing, and no committed
workflow script makes a nested `workflow()` call, so the five sites are believed
to be the whole surface.

**Out of scope:** the lint that enforces the phrasing
(`tactic-workflow-launch-prose-lint`); the upstream report
(`tactic-workflow-adoption-upstream-report`); the body of
`tactic-align-tactics-workflow`, which is `phase: done` and left as history.

## Verification

`grep -rn "Invoke the Workflow tool on" .claude/skills/` returns nothing, and
each of the five sites resolves to the rule file. The registry names are
`align-tactics`, `review-fix`, `qa-fix` (plus the built-in `deep-research`,
`code-review`, and `dispatch-graph-tick`) — confirm each pointer names the right
one. End-to-end confirmation is a background-session `/align-tactics` round that
survives a turn boundary; the 2026-07-25 runs (`d4f7f09e`, `ff12b541`) are the
worked precedent for the `name` form carrying args as a JSON string.
