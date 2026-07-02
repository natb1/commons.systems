---
id: strategy-exercise-recovery-paths
kind: strategy
statement: Exercise every recovery path — an unexercised path is a hope
owner: human
status: codified
parent: null
serves:
  - virtue-progressive-detachment
rationale: >-
  The graph's own doctrine (kind-delegation) says a recovery path that has
  never been walked is a hope, not a path — and every delegation record
  carried last_exercised null until this strategy existed. It owns three
  things. First, per-delegation recovery drills, scaled to the delegation:
  for Firebase, actually re-host one app; for GitHub, run one export/import
  round-trip of the issue graph; for Anthropic, complete a real unit of work
  on open-weight local inference and record the capability gap found.


  Second, non-delegable-floor exercises. Each record names the
  meta-capability that must not atrophy — "the ability to evaluate what the
  agent produces", "noticing where my attention actually goes" — and a floor
  needs deliberate exercise on the same terms as the paths above it.


  Third, the portfolio-level review the tension pair requires:
  virtue-alignment-of-attachments warns that a portfolio of individually
  well-aligned dependencies still drifts toward capture on the
  irreversibility axis, and per-record review_triggers never see the
  aggregate. This strategy reviews the whole attachment portfolio at once,
  so aggregate drift has an owner.
reading: null
gap: null
clarifications: []
tooling_goals: []
success_signal:
  observable: last_exercised on every delegation record in this graph
  sensor: the delegation records themselves
  threshold: no record's last_exercised is null or older than its review window
  is_proxy: false
attributes:
  conditions:
    - drills stay affordable — walking a path costs days, not the price of the full recovery
---
# Exercise every recovery path — an unexercised path is a hope
