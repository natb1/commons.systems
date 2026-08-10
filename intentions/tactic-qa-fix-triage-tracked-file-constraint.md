---
id: tactic-qa-fix-triage-tracked-file-constraint
kind: tactic
statement: constrain /qa-fix triage's script-verifiable class to items whose
  remediation lands in a tracked file — a fix that only edits PR description
  text, labels, or other GitHub-side metadata is needs-human-judgment — and add
  the implement PR-body convention to cite a suite's exit status rather than an
  assertion count
owner: ai
status: raw
parent: null
rationale: "Byproduct of the 2026-07-30 office-hours drain of
  tactic-manual-path-reservation-sweep (PR #2964). That node parked on a
  permanent /qa-fix planner scope-deviation: triage classified
  script-verifiable a residue item whose only remediation was editing the PR
  description text, which the auto-fix lane structurally cannot reach — the
  /implement-unit boundary is working-tree commits. The escalation was correct,
  but it cost several qa-fix passes and an office-hours sitting to reach. Two
  small edits remove the class: triage may not hand the Opus fix-planner work
  it cannot do, and the PR-body convention that produced the unstable assertion
  (an exact suite count against a shared growing test file) gets a guardrail.
  The park's own recommendation ratified this as the durable fix and explicitly
  rejected the alternative of giving the auto-fix lane a gh pr edit step — an
  autonomous lane must not get an untracked, un-reviewed, un-CI'd write channel
  to serve one recurring finding. Non-blocking: it gates no shipped node."
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
# triage may not ask for a fix the auto-fix lane cannot land

Draft context retained from the 2026-07-30 office-hours drain of
`tactic-manual-path-reservation-sweep`. Not yet refined into a plan —
`/align-tactics` owns that.

## The defect, confirmed live

PR #2964's body asserted `<pre-split dispatch-scripts test monolith> —
3046/3046 passed` while the tree ran 3183/3183. `/qa-fix` triage raised the
mismatch and classified it
`script-verifiable`. The only remediation is editing PR #2964's GitHub
description — there is no tracked file to change. The Opus fix-planner
therefore could not land it, and the lane escalated with a permanent planner
scope-deviation (`office_hours.since: 2026-07-28`), not attempt-cap exhaustion.

The escalation was the right refusal. The waste is upstream: triage handed the
planner work it was structurally unable to do, burning the attempt budget
before the escape fired.

## Two edits

### 1. Triage may not ask for it

`.claude/skills/qa-fix/references/triage-subagent.md`, the three-way
classification axis (currently at lines 63-72). `script-verifiable` is defined
as "outcome decided by a shell command / file check, a vitest run, or a single
`javascript_tool` assertion" — with no constraint on *where the fix lands*.

Add that constraint: an item is `script-verifiable` only when its remediation
lands in a tracked file. A finding whose only fix is editing PR description
text, labels, or other GitHub-side metadata classifies `needs-human-judgment`
and carries no `Command`. That converts several wasted auto-fix passes into one
clean first-pass escalation.

Note the axis already distinguishes *how an outcome is decided*; this adds the
orthogonal question of *whether the fix is reachable*. Whether that is best
expressed as a constraint on the existing class or as a fourth flag is a design
call for the planning round.

### 2. The convention that produced the unstable assertion

`.claude/skills/implement/SKILL.md`, Step 4 "Open the draft PR" (currently
~line 378). PR body prose is free-form via `tmp/pr-body.md` — nothing mandates
an assertion count, a session simply chose one.

Add the convention: for a suite living in a shared file that unrelated PRs
extend, cite the suite and its exit status, never an assertion count. A count
written against a shared per-SUT test file (e.g. `test-graph-auto-merge.sh`)
is stale within days by construction, because every parallel dispatch-script
feature adds cases to it.

The plan schema is already right — the originating tactic ran the script bare
in its own verify block, with no count. Only the PR-body prose convention needs
the guardrail.

## Related

- `tactic-dispatch-test-monolith-split` addresses the same shared-growing-file
  pain from the merge-conflict direction. Different remedy, not a duplicate;
  splitting the monolith would shrink but not remove the stale-count class,
  since any per-file count is still written at implement time.
- The rejected alternative — a `gh pr edit` step inside the qa-fix auto-fix
  lane — stays rejected. It is recorded here so a future round does not
  re-propose it without reading the reasoning.
