---
id: tactic-workflow-adoption-upstream-report
kind: tactic
statement: Report the Workflow scriptPath adoption defect upstream to the
  harness delegatee
owner: ai
status: raw
parent: null
rationale: The Workflow tool's contract states every invocation persists its
  script under the session directory; scriptPath invocations demonstrably do
  not, and the resulting background-fork adoption failure is unrecoverable and
  prints no remedy. Exit from this delegation is expensive, so voice is the
  available lever — a report costs an hour and the fix would remove a whole
  failure class we otherwise route around forever.
reading: null
gap: null
serves:
  - strategy-exercise-voice
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
# Report the Workflow scriptPath adoption defect upstream to the harness delegatee

Retained from the 2026-07-27 `/align-strategy` round, whose primary record is a
set of clarifications on `strategy-graph-native-dispatch`. This node is the
voice-toward-the-delegatee half; it serves `strategy-exercise-voice` because the
artifact it touches is the delegation relationship, not our own skills.

## Context

Two defects in the harness's own contract, both verified 2026-07-27 against
Claude Code 2.1.220:

1. **The documented persistence claim is false for one launch form.** The
   Workflow tool's description states *"Every invocation automatically persists
   its script to a file under the session directory and returns the path in the
   tool result."* A `scriptPath` invocation persists nothing. Evidence: session
   `88a4c17d` launched once by `name` and once by `scriptPath` and has a store
   copy for only the first; session `e79be2b7`'s inline `script` launch
   persisted; the scriptPath-only sessions have no `workflows/scripts/` directory
   at all.

2. **The resulting failure is unrecoverable and prints no remedy.** When a
   background session forks at a turn boundary, adoption of a `scriptPath`-launched
   run is rejected — `[adopt] workflow <id> skipped: scriptPath rejected` — every
   agent is killed mid-flight, and `resumeFromRunId` cannot recover it because
   resume carries the same rejected path. The sibling branch (fork failed to
   spawn) prints `To resume manually: Workflow({scriptPath, resumeFromRunId})`;
   the rejected branch prints nothing actionable, and that suggested remedy would
   be inert for this class anyway. Not a version regression — both strings are
   present in 2.1.204 through 2.1.220.

Suggested asks, in priority order: persist a harness-owned copy for every launch
form so all three adopt (the greenfield fix — it makes the contract text true and
removes the failure class); failing that, correct the tool description and make
the rejected branch name the remedy (relaunch by registry `name`).

## Scope

One report through whatever channel the delegation record names for
`delegation-anthropic-claude` — the public `anthropics/claude-code` issue tracker
is the expected venue. Include the three-way persistence evidence, the extracted
adoption strings, and the version range checked. This is a report, not a
negotiation: file it, record the URL back on this node, and stop.

**Out of scope:** any local workaround — the repo-side fix is
`tactic-workflow-launch-contract-home` and `tactic-workflow-launch-prose-lint`,
which stand whether or not upstream acts.

## Verification

The report exists at a durable URL and that URL is recorded on this node. There
is no signal to wait for; `strategy-exercise-voice`'s own condition is that voice
stays cheap — hours per review cycle, not a role — so an unanswered report is a
complete outcome, not a pending one.
