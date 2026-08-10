---
id: strategy-exercise-recovery-paths
kind: strategy
statement: Exercise every recovery path — an unexercised path is a hope
owner: human
status: codified
parent: null
rationale: >-
  The graph's own doctrine (kind-delegation) says a recovery path that has never
  been walked is a hope, not a path — and every delegation record carried
  last_exercised null until this strategy existed. It owns three things. First,
  per-delegation recovery drills, scaled to the delegation: for Firebase,
  actually re-host one app; for GitHub, run one export/import round-trip of the
  issue graph; for Anthropic, complete a real unit of work on open-weight local
  inference and record the capability gap found; for the identity root, a zone
  export plus a break-glass rehearsal walked by the second custodian
  (strategy-secure-identity-root owns the standing custody practice the drill
  exercises); for the OS substrate, provision the working environment from
  scratch on a fresh machine — delegation-os-hardware's floor.


  Second, non-delegable-floor exercises. Each record names the meta-capability
  that must not atrophy — "the ability to evaluate what the agent produces",
  "noticing where my attention actually goes" — and a floor needs deliberate
  exercise on the same terms as the paths above it.


  Third, the portfolio-level review the tension pair requires:
  virtue-alignment-of-attachments warns that a portfolio of individually
  well-aligned dependencies still drifts toward capture on the irreversibility
  axis, and per-record review_triggers never see the aggregate. This strategy
  reviews the whole attachment portfolio at once — both axes: aggregate
  irreversibility drift, and each record's imported virtues checked for drift
  and fired review_triggers — event-based per kind-delegation's review model
  (2026-07-09: review_window is retired; reading-program rounds and requirement
  refinement are the standard triggers, with ad-hoc prioritization via the
  capture-visibility surface) — so aggregate drift has an owner. The divergence
  half is why this strategy also serves virtue-alignment-of-attachments.
reading: "exercised: 4/22 records; 18 null last_exercised; review_trigger firing
  not recorded"
gap: "reading \"exercised: 4/22 records; 18 null last_exercised; review_trigger
  firing not recorded\" does not meet threshold \"no record's last_exercised is
  null, and no fired review_trigger is left unactioned\""
serves:
  - virtue-progressive-detachment
  - virtue-alignment-of-attachments
recovers: []
clarifications:
  - question: What does a decomposition round exercise, and do drills include
      production cutover?
    answer: "Round 1 (2026-07-11 /align-tactics) decomposes to the strategy's five
      named drills plus the reading instrument and the portfolio review; the
      records without named drills are reached through the reading the
      instrument produces — the threshold spanning every record is expected to
      converge over multiple rounds, not one. Drills walk the recovery path
      end-to-end short of production cutover: the affordability condition (days,
      not the price of the full recovery) entails that a drill re-hosts or
      round-trips a real artifact and verifies it works, while the final
      DNS/traffic cutover is documented, not executed. Declined-origin records
      have no entered delegation to exercise; the instrument reports them as a
      separate class and the portfolio review, not a drill, is their exercise.
      Recorded 2026-07-11 /align-tactics round."
tooling_goals: []
success_signal:
  observable: last_exercised on every delegation record in this graph
  sensor: the delegation records themselves
  threshold: no record's last_exercised is null, and no fired review_trigger is
    left unactioned
  is_proxy: false
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds:
  count: 0
  last_completed: null
  last_aligned: null
attributes:
  conditions:
    - drills stay affordable — walking a path costs days, not the price of the
      full recovery
---
# Exercise every recovery path — an unexercised path is a hope
