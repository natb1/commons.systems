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
  clarifications). Encoding refined 2026-07-13 (author-dictated): main health is
  a registered sensor; the tick auto-creates the fix tactic on a failing read;
  the fix tactic carries the main-health success_signal and completes on green;
  rank via creation-time recomputed attention boost + pace_exempt. See the
  strategy 2026-07-13-refined clarification."
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
- **Signal home:** the fix tactic itself carries
  `success_signal {sensor: main-health, threshold: green}` — the same
  sensor that detected the episode validates its fix. The reading lands on
  the tactic; threshold-met **completes it**, re-arming detection. No
  standing signal-home node (a node carries exactly one `success_signal`,
  and both natural strategy slots are occupied).
- **Rank:** at creation the automation recomputes the current
  resolved-rank graph max and authors an **attention boost topping it**,
  with a rationale naming the failing main signal (machine authorship stays
  inside the authored-boost model because the rationale requirement is
  met), plus `pace_exempt: true` — bypasses the pace gate, never the
  `--exhausted` hard floor. The router then selects it like any tactic;
  the fleet fixes main autonomously. Accepted edge: `blocked_by`
  compounding could overtake mid-episode (episodes are short; revisit if
  it bites).
- **Scope:** a main-specific instance of the general pattern (mechanical
  failing signal → auto-created fix tactic → very high rank);
  strategy-signal failures keep routing to `/align-tactics`.
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
