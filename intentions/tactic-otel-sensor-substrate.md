---
id: tactic-otel-sensor-substrate
kind: tactic
statement: evaluate Claude Code OTel export (token/cost metrics +
  workflow.run_id grouping + OTEL_RESOURCE_ATTRIBUTES node/phase stamping) as a
  local sensor/attribution substrate, replacing transcript-scraping
owner: ai
status: codified
parent: null
rationale: "Surfaced 2026-07-08 when the author asked whether a recent Claude
  Code change (workflow.run_id / workflow.name OTel attributes on
  workflow-spawned agents) could serve any graph strategy. It maps onto an
  already-recorded requirement, not a new intent: strategy-token-economy's
  condition that a session unattributable to a node and phase is invisible to
  every control loop. The shipping attribution tactics
  (tactic-token-audit-node-attribution #2777, tactic-token-economy-sensor #2779)
  satisfy it by transcript-scraping; this is the greenfield alternative
  substrate, retained for /align-tactics to weigh — NOT a re-plan of those
  tactics."
reading: null
gap: null
serves:
  - strategy-token-economy
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-otel-sensor-substrate
  pr: 2900
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# Evaluate Claude Code OTel export as a local sensor/attribution substrate, replacing transcript-scraping

## Context

Surfaced 2026-07-08: a Claude Code change added `workflow.run_id` /
`workflow.name` OpenTelemetry attributes to telemetry from workflow-spawned
agents. It maps onto an already-recorded requirement, not a new intent —
`strategy-token-economy`'s condition that a session unattributable to a node and
phase is invisible to every control loop, and `strategy-graph-native-dispatch`'s
need to reconstruct a tick's activity (hence the honest multi-entry `serves`).

The requirement is **currently satisfied by transcript-scraping**:
`tactic-token-audit-node-attribution` (PR #2777) stamps `node_id` into the
`<session-id>.dispatch-stamp.json` sidecar and joins it in `aggregate-usage.sh`;
`tactic-token-economy-sensor` (PR #2779, done) registers the `token-economy`
sensor with utilization from the statusline `rate_limits.json`. Measured weakness
of the scrape path (2026-06-26→07-03 audit): the unattributed `<none>` bucket was
the single largest line, and workflow-spawned agents are exactly that blind spot.

OTel is the **greenfield alternative substrate**: `code.claude.com/docs/en/monitoring-usage`
documents `claude_code.token.usage` / `claude_code.cost.usage` metrics keyed by
`session.id`/`model`/`skill.name`, a `workflow.run_id` log attribute that groups a
whole workflow run *including nested agents*, arbitrary `OTEL_RESOURCE_ATTRIBUTES`
stamped on every metric, and export to a **local** OTLP collector (no cloud
backend). The greenfield shape: the launcher sets
`OTEL_RESOURCE_ATTRIBUTES="node.id=<id>,phase=<phase>"` at session start, so every
cost/token metric is attributable *by construction*, removing the fragile
session-id→node_id sidecar join and skill-frame phase detection.

**This tactic is an evaluation, not an adoption.** It is off the success-signal
path (no `validates`; unboosted → derived-demoted rank). Its deliverable is a
written recommendation; the decision to *adopt* the OTel substrate — which deepens
reliance on the Anthropic-provided export surface (owned by
`delegation-anthropic-claude`, and this strategy explicitly manages the
"promote the vendor via spend" divergence) — is an **author capture-risk /
attachment decision left to office-hours**, not something this evaluation commits.

## Unit 1 — stand up a local OTel export and measure attribution quality vs the scrape path

**Recommended model:** opus

Judgment-heavy: it weighs a greenfield substrate against a shipped one and must
bound the claim honestly (per the draft's caveats) before recommending.

Scope:
- Enable Claude Code telemetry locally only: `CLAUDE_CODE_ENABLE_TELEMETRY=1`
  with `OTEL_EXPORTER_OTLP_ENDPOINT` pointing at a **local** OTLP collector
  (default `localhost:4317`) — no cloud backend, consistent with the local-first
  sensor doctrine (`read-sensors.ts`). Set
  `OTEL_RESOURCE_ATTRIBUTES="node.id=<id>,phase=<phase>"` at a dispatch worker's
  session start (the launcher, `dispatch-launch-worker`) for a small trial set of
  nodes.
- Run a representative slice of dispatch work (including a `dispatch-graph-tick`
  Workflow, which spawns one agent per selected node) with export on, and measure:
  does OTel `token.usage`/`cost.usage` — grouped by the resource attributes and
  `workflow.run_id` — attribute cost to node+phase for **workflow-spawned
  subagents** that the transcript-scrape `<none>` bucket currently misses? Compare
  the OTel node/phase attribution against the sidecar-join attribution for the
  same window.
- Honor the draft's caveats explicitly in the writeup: cost/token are *metrics*
  while `workflow.name` is a *log event* redacted to `"custom"` unless
  `OTEL_LOG_TOOL_DETAILS=1`, so reaching node+phase on the cost numbers needs the
  resource-attribute stamping (above) or a logs↔metrics join on
  `session.id`/`workflow.run_id` — **not** a naive "`workflow.name` on the cost
  metric," which does not exist.

Reuse:
- `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh` and the
  `<session-id>.dispatch-stamp.json` sidecar (`dispatch-stamp-session`) — the
  incumbent attribution path this evaluation benchmarks against.
- `dispatch-graph-tick` (a `Workflow`) — the concrete subagent-double-count /
  `<none>`-bucket case the OTel `workflow.run_id` grouping is claimed to fix.
- `packages/intentionsutil/scripts/read-sensors.ts` — the local-first sensor
  doctrine and the `token-economy` sensor the substrate would eventually feed.

## Unit 2 — write the recommendation: adopt / defer / supersede, with the capture-risk decision framed for the author

**Recommended model:** opus

Scope:
- Produce a written evaluation (as this tactic's PR artifact — a doc under the
  audit or dispatch skill, or a decision note) recommending one of: **adopt** the
  OTel substrate (and in what sequence relative to the shipped scrape path —
  e.g. supersede the sidecar once proven), **defer**, or **drop**. Ground the
  recommendation in Unit 1's measured attribution-quality comparison.
- Frame the **capture-risk decision explicitly for the author**: adopting the
  OTel substrate deepens reliance on the Anthropic export surface
  (`delegation-anthropic-claude`) and stands up new local infra (a collector).
  State the tradeoff and mark the adoption decision as author-owned
  (office-hours), not something the evaluation itself commits. Do not enable
  telemetry export as a standing default as part of this tactic.

Dependencies: Unit 2 depends on Unit 1.

## Verification

Prose — the deliverable is an evaluation, not a runtime behavior change:
- Unit 1's measurement must show, for the trial window, whether OTel node/phase
  attribution covers workflow-spawned subagents that the transcript-scrape
  `<none>` bucket misses — a concrete before/after on the audit's largest blind
  spot, not an assertion.
- Unit 2's recommendation must land a clear adopt/defer/drop verdict grounded in
  that measurement, with the capture-risk / new-infra tradeoff framed as an
  author office-hours decision. No standing telemetry-export default is enabled by
  this tactic.
- No production routing or sensor behavior changes as a result of the evaluation
  alone; any adoption is a separate, author-approved follow-up.

## needs-main residue

Item filed by `/qa-fix` (PR #2900) — disposition `needs-main` (planned
deferral), not machine-verifiable at this PR's merge time.

- **id:** 8
- **title:** Honest-deferral reframe is an acceptable deviation from literal
  "before/after" verification prose
- **url_path:** current
- **expected_outcome:** A human confirms the deferral reframing is a
  legitimate, author-level acceptable deviation and the memo's reasoning is
  honest and sound — the live-trial before/after itself remains deferred to a
  future ephemeral trial.
- **finding:** The tactic explicitly states the live OTel trial was not run in
  this sandboxed, network-isolated session and is left for a future ephemeral
  docker-collector trial; the actual before/after subagent-attribution
  measurement is deferred downstream, and whether the mechanism-comparison
  reframe acceptably satisfies the literal verification prose is an author
  call this QA pass cannot execute.
