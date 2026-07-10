---
id: tactic-otel-sensor-substrate
kind: tactic
statement: evaluate Claude Code OTel export (token/cost metrics +
  workflow.run_id grouping + OTEL_RESOURCE_ATTRIBUTES node/phase stamping) as a
  local sensor/attribution substrate, replacing transcript-scraping
owner: ai
status: raw
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
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# evaluate Claude Code OTel export (token/cost metrics + workflow.run_id grouping + OTEL_RESOURCE_ATTRIBUTES node/phase stamping) as a local sensor/attribution substrate, replacing transcript-scraping

> Draft (no `phase`): retained tactical context, not selectable work. `/align-tactics`
> owns whether this is decomposed, superseded, or dropped. It is a *mechanism*
> proposal for an already-recorded requirement — do not read it as a re-plan of the
> shipping attribution tactics named below.

## What surfaced this

A Claude Code change note: *"Added `workflow.run_id` and `workflow.name`
OpenTelemetry attributes to telemetry emitted by workflow-spawned agents, so a
workflow run's activity can be reconstructed from OTel data."* The question was
whether this — or pre-existing Claude Code OTel data — could serve any graph
strategy. It can, as a **sensor/attribution substrate**, not as a new intent.

## The requirement it maps onto (already recorded)

`strategy-token-economy` conditions (frontmatter): *"the token audit stays
runnable and attributable across the router migration — a session that cannot be
attributed to a node and phase is invisible to every control loop here."* That
requirement is currently satisfied by **transcript-scraping**:

- `tactic-token-audit-node-attribution` (PR #2777, review) — stamps `node_id`
  into the `<session-id>.dispatch-stamp.json` sidecar and joins it in
  `aggregate-usage.sh`; phase is inferred by skill-frame command-name detection.
- `tactic-token-economy-sensor` (PR #2779, qa) — registers the `token-economy`
  registry sensor; utilization comes from the statusline `rate_limits.json`.

Measured weakness of the transcript-scrape path (2026-06-26→07-03 audit): the
unattributed `<none>` bucket was the single largest line ($5,680 proxy /
$1,842 real, 19,733 turns), and Unit 4 of #2777 fixes a subagent **double-count**.
Workflow-spawned agents are exactly that blind spot.

## Why OTel fits (verified against Claude Code docs, 2026-07-08)

`code.claude.com/docs/en/monitoring-usage`:

- **Metrics** `claude_code.token.usage` and `claude_code.cost.usage`, keyed by
  `session.id`, `model`, and `skill.name` — structured, no transcript parse.
- **`workflow.run_id`** (log-event attribute, `wf_`-prefixed) groups all API
  requests and tool results of one workflow run *including nested agents*.
  `dispatch-graph-tick` **is** a `Workflow` (one agent per selected node), so a
  whole tick and its subagents reconstruct into one run — this is the direct
  answer to the subagent double-count and the `<none>` bucket.
- **`workflow.name`** (log-event attribute) can carry node/phase, but is
  redacted to `"custom"` unless `OTEL_LOG_TOOL_DETAILS=1`.
- Exportable to a **local** OTLP collector (`OTEL_EXPORTER_OTLP_ENDPOINT`,
  default `localhost:4317`) — no cloud backend required, consistent with
  local-first sensors.
- Arbitrary `OTEL_RESOURCE_ATTRIBUTES` are stamped on every metric/event.

**Greenfield shape:** the dispatch worker launcher sets
`OTEL_RESOURCE_ATTRIBUTES="node.id=<id>,phase=<phase>"` at session start, so
every `token.usage` / `cost.usage` metric is **attributable by construction** —
removing the fragile session-id→node_id sidecar join and skill-frame phase
detection entirely.

## Two downstream consumers (why the multi-entry `serves`)

The telemetry pipeline (enable `CLAUDE_CODE_ENABLE_TELEMETRY=1` + a local
collector) is one shared instrument feeding two readings, which is why this is
one tactic serving two strategies rather than nearest-fit placement:

1. **`strategy-token-economy`** — OTel token/cost metrics + resource-attribute
   node/phase stamping as the attribution substrate for the token audit.
2. **`strategy-graph-native-dispatch`** — `workflow.run_id` reconstruction of a
   tick's activity (nodes selected, agents spawned, failures) as a second,
   independent reading source for `tactic-dispatch-lifecycle-sensor` (which today
   derives its reading from the `intentions/` git log + the router selection log).

## Honest caveats (bound the claim before decomposing)

- Cost/token are **metrics**; `workflow.name` is a **log event** redacted by
  default. Reaching node+phase on the *cost numbers* needs either a
  logs↔metrics join (on `session.id` / `workflow.run_id`) or the
  resource-attribute stamping above — **not** a naive "`workflow.name` on the
  cost metric," which does not exist.
- Requires standing up telemetry export + a local collector: new infra and a
  deeper lean on the Anthropic-provided export surface (owned by
  `delegation-anthropic-claude`). Weigh capture risk there.
- Overlaps in-flight tactics #2777 / #2779. The disposition here is
  *evaluate as greenfield substrate*, not *replace shipping work mid-flight*;
  `/align-tactics` decides sequencing (e.g. adopt after those land, or supersede
  the sidecar path once proven).
