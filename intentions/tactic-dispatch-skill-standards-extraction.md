---
id: tactic-dispatch-skill-standards-extraction
kind: tactic
statement: Extract the dispatch skills' core standards into common skills and
  rename the family — /align-tactics to /dispatch-plan, /qa-fix to /dispatch-qa,
  /review-fix to /dispatch-review — so rsi and dispatch share one quality bar
owner: ai
status: raw
parent: null
rationale: Surfaced in the 2026-08-10 /align interview recording
  strategy-recursive-self-improvement. The dispatch skills are owned by
  strategy-graph-native-dispatch (artifact owner); rsi consumes the extracted
  standards.
reading: null
serves:
  - strategy-graph-native-dispatch
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
pace_exempt: false
rounds: null
attributes: {}
---
# Extract the dispatch skills' core standards into common skills and rename the family — /align-tactics to /dispatch-plan, /qa-fix to /dispatch-qa, /review-fix to /dispatch-review — so rsi and dispatch share one quality bar

## Draft context (2026-08-10 /align interview)

- Extract core standards from the dispatch skill family into common skills so
  rsi and dispatch invoke one shared quality bar with different orchestration:
  planning standards from /align-tactics (to be renamed /dispatch-plan),
  including breaking implementation into units delegated to subagents with the
  appropriate model; QA strategies from /qa-fix (to be renamed /dispatch-qa);
  review standards from /review-fix (to be renamed /dispatch-review);
  variance/conflict handling extracted for /dispatch-conflict and shared with
  the dispatch scripts; tactic-drafting standards extracted from /align.
- Sequencing judgment retained from the interview: extraction can precede the
  renames; renames mid-bootstrap touch live dispatch surfaces, so land them
  when the queue is stable or behind explicit compatibility shims.
- The renames also serve discoverability: the dispatch skill family becomes
  uniformly /dispatch-*.
