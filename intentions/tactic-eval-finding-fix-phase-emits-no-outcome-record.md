---
id: tactic-eval-finding-fix-phase-emits-no-outcome-record
kind: tactic
statement: fix-checks is the only phase skill that never calls
  dispatch-emit-outcome, so every fix session aggregates with a null outcome and
  the plan-quality-yield and variance lenses are structurally blind to a third
  of the ladder even though the skill has already computed the disposition
owner: ai
status: raw
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
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
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-13
  measured_impact:
    - metric: phase_skills_emitting_outcome
      value: 2
      unit: of 3 skills
      window: fix-checks/qa-fix/review-fix 2026-08-13
      sensor: rsi
      measured: 2026-08-13
    - metric: fix_sessions_with_null_outcome
      value: 2
      unit: of 2 sessions
      window: tactic-attention-namespaced-rank 2026-08-13
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: lenses_degraded_to_prose
      value: 2
      unit: lenses
      window: rsi fix-phase eval 2026-08-13
      sensor: rsi
      measured: 2026-08-13
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-13
  resolved_by: 1092a403e0000e4a4ce8ff106b892bfb32d4cdb7
---
## `/fix-checks` is the one phase skill that never calls `dispatch-emit-outcome`

Observed 2026-08-13 evaluating the `fix` phase of
`tactic-attention-namespaced-rank`, where lens 5 (plan-quality yield) and lens 3
(variances) both had to fall back to prose because the phase produced no
structured outcome.

`aggregate-usage.sh` rows for this node:

| session | `launch_skill` | `outcome` |
| --- | --- | --- |
| `17e4bf6c…` | qa-fix | `dispatch.outcome.v1`, `disposition=escalated` |
| `801bd0c6…` | qa-fix | `dispatch.outcome.v1`, `disposition=completed_with_fixes` |
| `72d549c3…` | qa-fix | `dispatch.outcome.v1`, `disposition=completed` |
| `40c253c4…` | review-fix | `dispatch.outcome.v1`, `findings_surfaced=22`, `fixes_applied=4` |
| `c1c85aeb…` | **fix-checks** | **`null`** |
| `b3e6cb28…` | **fix-checks** | **`null`** |
| `db21b669…` | implement | `null` |

`grep -rl dispatch-emit-outcome .claude/skills/` returns the emitter itself, its
test, and exactly two consumers: `qa-fix` (SKILL.md plus two references) and
`review-fix` (SKILL.md plus `references/terminal-actions.md`). `fix-checks`
matches nothing — its SKILL.md uses "outcome" 27 times as prose for its internal
`fixed` / `main-fixed` / `flake` / `generic` / `needs-human` branch names, and
records them in its own accumulator, but never emits the structured record.

### Consequence for the evaluator

`dispatch.outcome.v1` carries `findings_surfaced`, `findings_actionable`,
`fixes_applied`, `followups_filed`, `subagents_launched`, `disposition` and
`terminated_reason` — the fields lens 5 is defined over and the fields lens 3
uses to spot an escalation. For every fix phase in the fleet those are
structurally absent, so:

- the fix phase's own five-way disposition is invisible to aggregation, even
  though `fix-checks` has already computed it;
- `by_phase_outcome` can never carry a `fix` row;
- an evaluator must reach for `dispatch-session-digest` on the transcript to
  recover a disposition the skill already knew — which is what this evaluation
  had to do, and which the SKILL explicitly calls "not a routine step".

This is not a claim that the fix phase is unmeasured overall — spend, turns,
context and friction all aggregate fine. It is that the one lens family the
outcome object exists to serve is blind to a third of the ladder.

### What would have to change

`fix-checks` Step 9 already writes the phase-completed marker for every outcome
that reaches it; emitting `dispatch.outcome.v1` alongside it, with the branch it
has already selected as `disposition`, is the obvious seam. Whether the
`needs-human` branch (terminal at Step 4, before Step 9) also emits, and what it
puts in `terminated_reason`, is the author's call.
