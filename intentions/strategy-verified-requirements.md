---
id: strategy-verified-requirements
kind: strategy
statement: Every requirement recorded in the graph carries first-class encoding
  of the test or suite that verifies it; automated validation keeps the map's
  integrity, and gaps become tactics
owner: human
status: refining
parent: strategy-explicit-intent
rationale: "The graph is the source-of-truth requirement home, but its
  requirement clauses are verified ad hoc: validateGraph covers structural
  rules, tactic verify blocks expire with the tactic, and nothing ties a
  standing requirement to the suite that keeps it true — so requirement drift
  surfaces only at the recurring audit or in production. First-class
  verification encoding turns that drift into a red check with an owned tactic
  instead of an audit finding. Mechanism, by the adopted steelman: no parallel
  traceability matrix — the encoding extends the graph's existing verification
  vocabulary (success_signal {observable, sensor, threshold} plus the sensors.ts
  registry), with test suites becoming a first-class sensor species and each
  requirement clause naming its verifying sensor. Pointer discipline:
  strategy-graph-integrity keeps consistency/closure/parsimony and the recurring
  audit (which checks vacuous-test drift — this strategy does not replace it);
  strategy-graph-self-description keeps schema mechanics (kind nodes as sole
  schema authority, derived-never-stored). Capture note: the validator makes
  Claude-authored tests audit Claude-drafted records
  (delegation-anthropic-claude) and rides delegation-github's Actions for CI
  enforcement with a local read-sensors path retained; both loops are
  controlled, not unwound — no recovers edge — held by the
  substance-routes-to-author and vacuous-test-audit conditions. serves is empty
  by the sub-strategy inheritance rule (kind-strategy): no virtue claim beyond
  parent strategy-explicit-intent."
reading: null
gap: null
serves: []
recovers: []
clarifications:
  - question: What counts as a requirement in scope?
    answer: "Every requirement carrier in the graph, honestly marked: strategy
      success_signals, attributes.conditions entries, kind-node schema rules,
      and standing invariants named in node bodies. Machine-verifiable clauses
      map to a concrete test/suite; the rest carry an explicit
      not-machine-verifiable marking (sensor is the author or an office-hours
      review), so the map is total and an unmapped carrier is a real gap, never
      ambiguous territory. Recorded 2026-07-19 interview."
  - question: Why extend the existing signal/sensor vocabulary rather than add a
      separate traceability field?
    answer: "Three rival framings were put: (a) test suites as a first-class sensor
      species inside the success_signal machinery; (b) a dedicated
      requirement-to-test edge distinct from success_signal; (c) no new encoding
      — the recurring /align-audit checks traceability as a prose lens. Adopted
      (a): the graph already has one verification vocabulary, and a parallel map
      would be a second one, violating the content-parsimony requirement
      strategy-graph-integrity names. Diverged from (c): a prose audit check
      never makes drift a red check, and strategy-graph-integrity's own
      incubator condition expects mechanical checks to ratchet into CI as they
      become expressible in code — this one is expressible. Recorded 2026-07-19
      interview."
  - question: What granularity does the map target, and how does bootstrap avoid a
      gap-tactic flood?
    answer: "Clause-level encoding is the target — each conditions entry, schema
      rule, and signal clause maps or is marked, not just each node. Bootstrap
      is per requirement family via ordinary planned tactics
      (tactic-requirement-map-backfill), never per-gap auto-creation: roughly
      fifty strategies are unmapped on day one, which is arithmetic, not a
      defect. The validator auto-creates find-or-create gap tactics only for new
      gaps arising after a carrier is first mapped. Recorded 2026-07-19
      interview."
  - question: Is map-integrity status stored on the nodes?
    answer: Never. The map itself — which sensor or suite verifies which clause — is
      authored and stored; its integrity status (suite exists, runs, passes, is
      stale) derives on read, per strategy-graph-self-description's
      derived-never-stored doctrine. Recorded 2026-07-19 interview.
  - question: Should this strategy carry a recovers edge?
    answer: "No — mirroring strategy-graph-integrity's recorded reasoning. The
      strategy adds a control on delegation-anthropic-claude (the self-audit
      loop: Claude-authored tests grade Claude-drafted records, so a vacuous
      test could pass its own requirement) and relies on delegation-github for
      CI enforcement (local read-sensors execution keeps a non-GitHub path), but
      it unwinds neither, so recovers semantics do not apply. The loops are held
      by the substance-routes-to-author condition and the vacuous-test audit
      condition. Recorded 2026-07-19 interview."
tooling_goals:
  - kind: sensor
    statement: map-integrity validator — per-clause verification-encoding coverage
      and mapped-suite health, wired into CI and the read-sensors run, status
      derived on read (tactic-requirement-map-integrity-validator)
  - kind: actuator
    statement: find-or-create gap-tactic writer — exactly one open tactic per
      post-bootstrap gap (tactic-requirement-map-integrity-validator)
success_signal:
  observable: "per validation run: requirement carriers with no verification
    encoding (unmapped); mapped entries whose test/suite is missing, failing, or
    stale (broken); open gap tactics"
  sensor: the map-integrity validator (CI + read-sensors run)
  threshold: zero unmapped carriers and zero broken entries; every detected gap
    has exactly one open tactic
  is_proxy: true
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  conditions:
    - the map stays honestly marked — not-machine-verifiable is an explicit
      recorded state, never a silent omission
    - map-integrity validation stays mechanical (CI-grade) and its status
      derives on read, never stored (strategy-graph-self-description's
      derived-never-stored doctrine)
    - auto-created gap tactics are bounded and deduplicated (find-or-create, one
      per gap), and gaps touching virtue or strategy substance route through the
      align interviews, never auto-fixed (extends strategy-explicit-intent's
      human-authorship condition)
    - a mapped suite genuinely exercises its requirement — vacuous-test drift is
      checked by the recurring audit (strategy-graph-integrity), which this
      strategy does not replace
---
# Every requirement recorded in the graph carries first-class encoding of the test or suite that verifies it; automated validation keeps the map's integrity, and gaps become tactics
