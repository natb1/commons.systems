---
id: tactic-graph-main-self-heal
kind: tactic
statement: "graph-native red-main self-heal: main-health sensor, auto-created
  high-rank fix tactic, diagnose-main rewritten graph-native, legacy issue-latch
  cleanup"
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-12 /align-strategy interview triggered by
  the red-main episode of the same day: the legacy dispatch-diagnose-main flow
  re-enabled the repo's disabled has_issues feature to file its
  dispatch:main-broken latch issue, regressing the drain ratchet. The author
  decided the greenfield shape: one graph node is latch, announcement, and work
  item; no gh issue, no label. Supersedes tactic-dispatch-legacy-rewire Unit 1
  latitude on the announcement surface (see the strategy's 2026-07-12
  clarifications). Encoding refined and author-dictated 2026-07-13 across two
  interviews: main health is a registered sensor; the tick auto-creates the fix
  tactic on a failing read; the standing owner strategy-main-health (created
  2026-07-13) carries the signal and a standing boost 100 the fix tactic
  inherits via serves; the fix tactic carries its own main-health success_signal
  and completes on green; boost dominance is guard-maintained at the write path
  (author override required to out-boost or reduce it); blocking is orthogonal
  to boosting (strategy-graph-drives-dispatch same-date clarification). See the
  strategy's 2026-07-13 clarifications."
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
# graph-native red-main self-heal: main-health sensor, auto-created high-rank fix tactic, diagnose-main rewritten graph-native, legacy issue-latch cleanup

Draft — retained interview context per the retain-not-refine contract.
/align-tactics finalizes, splits, or merges; nothing below is a plan schema.

## Decided shape (2026-07-12 interview; encoding refined and author-dictated 2026-07-13, authoritative)

Main health is a **sensor**, and the self-heal flows through the general
sensor machinery — not bespoke tick gating:

- **Sensor:** `main-health` is a registered sensor (`SensorRegistry`,
  `packages/intentionsutil/src/sensors.ts`) reading `origin/main` HEAD's
  check conclusions. It qualifies for the default local-first registry —
  `read-sensors.ts` explicitly classes own-pipeline CI status as
  local-first.
- **Automation:** the graph tick (the greenfield workflow automation) runs
  the sensor each tick. On a failing read it **find-or-creates the fix
  tactic** (`tactic-main-red-<shortsha>` shape) via the normal
  `graph-commit` write path — one open node per red episode; a re-detection
  during the same episode updates the body, never duplicates. The node body
  carries the **redacted diagnosis** (failing check/step name, high-level
  error category, likely cause — same redaction bar the legacy
  `dispatch-diagnose-main` skill documents: no raw log lines, no secrets,
  no CI internals).
- **Signal home:** the standing owner is `strategy-main-health` (created
  2026-07-13, `parent: strategy-autonomous-execution`) — a **strategy**,
  per the persistent-layer doctrine (standing structure never lives on
  transient tactics; see `tactic-align-persistent-layer-doctrine`). It
  carries `success_signal {sensor: main-health, threshold: green}`. The
  auto-created fix tactic carries `serves` + `validates` edges to
  `strategy-main-health` and **its own**
  `success_signal {sensor: main-health, threshold: green}` — the same
  sensor that detected the episode validates its fix: threshold-met
  completes the tactic, re-arming detection (the one-signal-per-node limit
  binds per node; two nodes may reference one sensor). Supersedes the
  earlier fix-tactic-only signal home.
- **Rank:** by inheritance — `strategy-main-health` carries a standing
  authored **boost 100**; the fix tactic inherits it undecayed through the
  normal downward attention flow (`serves`). Supersedes the creation-time
  recompute-graph-max machine-authored boost: no machine-authored boosts
  remain in the model. The automation still sets `pace_exempt: true` on
  the fix tactic at creation — bypasses the pace gate, never the
  `--exhausted` hard floor. The former accepted edge (`blocked_by`
  compounding overtake) dissolves: blocking is orthogonal to boosting
  (`strategy-graph-drives-dispatch` 2026-07-13 clarifications,
  implementation in `tactic-attention-blocking-orthogonal`).
- **Guard (unit):** boost dominance is maintained mechanically at the
  write path, not by ranking logic (parsimony — author-dictated):
  `validate-graph`/`graph-commit` refuses a commit that authors another
  boost/override at or above `strategy-main-health`'s, or that reduces it,
  unless the commit carries an explicit author override. Implementation
  detail (override marker shape, which script hosts the check) is
  /align-tactics's call.
- **Strategy-lane edge:** `strategy-main-health`'s boost 100 also tops the
  router's strategy lane, but it needs no interactive decomposition — its
  tactics are auto-created. The lane must not treat its rank as a
  decomposition request; guard detail lands with this tactic's
  finalization. Until then selector align skips for it are expected.
- **Scope:** a main-specific instance of the general signal-ranking rule
  (a failing signal's resolution inherits the owning node's boost; default
  = no elevation); strategy-signal failures keep routing to
  `/align-tactics`.
- No gh issue, no `dispatch:*` label, no re-enabled GitHub features
  (`has_issues` stays disabled — drain-state monotonicity condition on
  `strategy-graph-native-dispatch`).

## Deprecation half

- `dispatch-diagnose-main`'s SKILL.md is rewritten graph-native: write the
  node, never `gh issue`; never touch repo feature flags. (The 2026-07-12
  episode: the skill's find-or-create-issue mandate led the job to re-enable
  `has_issues` via PATCH — the spec itself was the defect.)
- Steelman diverged (recorded on the strategy): no gh-issue mirror for
  human visibility — owned surfaces (office-hours dashboard, statusline,
  the graph) announce red main.

## Cleanup unit — sequencing is load-bearing

The legacy latch reader is `dispatch-select-tick` step 1c (~line 387): open
`dispatch:main-broken` issue = latched. Cleanup — close the 2026-07-12
latch issue and re-disable `has_issues` — **must land after** the graph
latch replaces that reader, else the queue freezes mid-red or diagnose-main
refiles. Until then the open issue stands.

## Coordination

- `tactic-dispatch-legacy-rewire` Unit 1 (phase: implement, live) scopes the
  same latch extraction and left the announcement surface as implementer's
  choice — that latitude is now superseded by the strategy's 2026-07-12
  clarification. /align-tactics reconciles the two nodes (fold this shape
  into Unit 1, or block Unit 1 on this node) rather than letting both run.
- The current red episode itself is tracked by
  `tactic-graph-fastpath-guard-diff-base` (the underlying guard bug) and,
  interim, by the legacy latch issue.
