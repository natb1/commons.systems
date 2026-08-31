# OTel export as a local attribution substrate — trial notes

Working measurement notes for `tactic-otel-sensor-substrate` (Unit 1). These
document the trial *setup* and a rigorous *mechanism-level* comparison of the
Claude Code OpenTelemetry (OTel) export path against the incumbent
transcript-scrape + sidecar-join attribution path. They are scratch working
notes for the eventual recommendation (Unit 2), not a control artifact and not a
config change.

## Honesty boundary: what was and was not measured

**No live trial numbers appear in this document.** A faithful trial of the one
thing this tactic exists to evaluate — whether OTel attributes cost to
`node+phase` for *workflow-spawned subagents* that the scrape path misses —
requires a real `dispatch-graph-tick` run (one `claude --bg` orchestrator per
selected node, each spawning phase-workflow subagents) exporting to a live OTLP
collector over a multi-hour window. That is not feasible from this sandboxed
session:

- The session runs in a network-isolated namespace; a collector started here is
  not reachable the way a real fleet's sessions would reach it, and standing up
  a real multi-node dispatch fleet is out of scope for a working-tree-only unit.
- Enabling telemetry as a standing default is explicitly forbidden for this
  tactic (no committed `settings.json` / env changes). Any live test would be
  ephemeral and hand-torn-down.
- Fabricating a `token.usage` / `cost.usage` table I did not observe would
  defeat the entire point of an evaluation.

So the substantive content below is a **design-level mechanism comparison**
grounded in the actual current implementation (file:line anchors throughout) and
the documented Claude Code OTel surface. Where a claim depends on runtime
behavior I could not observe, it is flagged **[UNVERIFIED — needs live trial]**.

Environment confirmed present for a future ephemeral test: `docker`, `nc`
available; `claude` 2.1.204.

## The requirement being served

A session unattributable to a node and phase is invisible to every control loop
(`strategy-token-economy`), and a tick's activity must be reconstructable
(`strategy-graph-native-dispatch`). The incumbent satisfies this by
transcript-scraping. The measured weakness (2026-06-26→07-03 audit, cited in the
tactic body): the unattributed `<none>` bucket was the single largest line, and
workflow-spawned agents are exactly that blind spot.

---

## Path A — incumbent: transcript scrape + sidecar join

### How a session gets attributed today

1. **Sidecar write at session birth.** `SessionStart:startup|resume` fires
   `.claude/hooks/stamp-dispatch-session.sh`, which calls
   `dispatch-stamp-session` (`.claude/skills/dispatch-propagate/scripts/dispatch-stamp-session`).
   For a graph-native branch (exactly a node id `tactic-*`/`strategy-*`, or
   `graph-<slug>`) it writes `<transcript>.dispatch-stamp.json` next to the
   session's `.jsonl`, carrying `node_id` derived **from the git branch name**
   (`dispatch-stamp-session:238-258`). `base_sha` is the session-start HEAD,
   preserved across resume.

2. **Scrape + join at audit time.** `aggregate-usage.sh` recursively finds every
   `*.jsonl` transcript in the window, runs a two-stage `jq` program that sums
   `message.usage` per assistant turn, and for each transcript slurps the sibling
   `.dispatch-stamp.json` (`aggregate-usage.sh:872-874`). The `by_node` rollup
   (`aggregate-usage.sh:593-601`) folds **only** sessions whose sidecar stamps a
   non-null `node_id`; everything else stays attributed by topic/type or lands in
   `<none>`.

3. **`node.id` provenance is the branch, `phase` is the skill frame.** Node
   attribution rides entirely on the worktree branch name. Phase is inferred
   separately from the transcript's `attributionSkill` values folded into
   `by_skill` / `by_phase` (`aggregate-usage.sh:296-311, 562-585`).

### Where it goes blind — the subagent / `<none>` gap

- **Subagent transcripts carry no sidecar.** They nest at
  `<projectdir>/<sid>/subagents/agent-*.jsonl` (`aggregate-usage.sh:33-36`). The
  sidecar is written for the **top-level** session on a branch; a subagent has no
  branch context and no sidecar of its own. So its `artifact` is `null` and it is
  **excluded from `by_node`** — confirmed by SKILL.md:89,171 ("null for sessions
  without a sidecar — subagents, router ticks, pre-#1861 sessions"). Subagent
  tokens land in `by_session_type.subagent`, never attributed to the node whose
  work produced them.
- **Workflow-spawned agents are the acute case.** `dispatch-graph-tick`
  (the Workflow that `dispatch-tick` runs → `dispatch-graph-execute`) spawns one
  orchestrator `claude --bg` per selected node
  (`dispatch-graph-execute:110-230`), and each phase's own Workflow (`/review-fix`,
  `/qa-fix`, …) fans out to `agent()`/subagent calls where Opus is actually spent
  (SKILL.md:130). That Opus spend is precisely the nested-subagent spend that has
  no sidecar → the single largest `<none>`-ish bucket.
- **The join is fragile by construction.** It depends on: (a) the SessionStart
  hook actually firing for detached `--bg` sessions — an explicitly *unverified*
  assumption (`stamp-dispatch-session.sh:10-26`, which added
  `window.sidecar_present_rate` precisely to monitor it); (b) the branch name
  encoding the node id; (c) skill-frame detection for phase. Three independent
  failure surfaces per attributed dollar.

---

## Path B — greenfield: OTel resource-attribute stamping at launch

### Documented Claude Code OTel surface

Per the Claude Code monitoring-usage docs (`code.claude.com/docs/en/monitoring-usage`):

- `CLAUDE_CODE_ENABLE_TELEMETRY=1` + `OTEL_EXPORTER_OTLP_ENDPOINT` (OTLP/gRPC
  default `localhost:4317`) exports to a **local** OTLP collector — no cloud
  backend required.
- **Metrics** `claude_code.token.usage` and `claude_code.cost.usage` are keyed
  by `session.id`, `model`, and `skill.name`.
- **`OTEL_RESOURCE_ATTRIBUTES`** is stamped as resource attributes on **every**
  emitted metric and log. Setting it at session start makes those attributes ride
  every cost/token metric by construction.
- **`workflow.run_id`** (and `workflow.name`) is a **log** attribute that groups
  a whole workflow run *including nested agents*.

### The greenfield shape

The launcher — the per-node spawn loop in `dispatch-graph-execute` — already has
`id` (node id) and `phase` in scope for every node it launches
(`dispatch-graph-execute:110-135`). It spawns via `dispatch-spawn-job`, which
execs `cd "$CWD" && claude --bg …` **in a subshell that inherits the exported
environment** (`dispatch-spawn-job:285-298`). So exporting, immediately before
that spawn:

```
CLAUDE_CODE_ENABLE_TELEMETRY=1
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_RESOURCE_ATTRIBUTES="node.id=<id>,phase=<phase>"
```

stamps `node.id` and `phase` onto every `claude_code.token.usage` /
`claude_code.cost.usage` metric the orchestrator **and its nested workflow
subagents** emit — because the subagents are children of that process tree and
inherit the same resource attributes. **[UNVERIFIED — needs live trial:** that
child/subagent processes inherit `OTEL_RESOURCE_ATTRIBUTES` and that their
metrics carry it. This is the single load-bearing assumption of the whole
substrate and must be confirmed against a real run before adoption.**]**

This removes all three fragile join surfaces of Path A at once: no
`session-id → node_id` sidecar file, no branch-name encoding, no skill-frame
phase inference. Attribution is present **on the metric**, by construction, at
emit time.

### The caveat that must not be glossed — metrics vs logs

`node+phase` on the *cost numbers* is reachable **only** via the
`OTEL_RESOURCE_ATTRIBUTES` stamp above, because:

- cost/token are **metrics**; `workflow.name` / `workflow.run_id` are **log**
  attributes. There is **no `workflow.name` field on the cost metric** — a naive
  "group `cost.usage` by `workflow.name`" does not exist and would silently
  return nothing.
- `workflow.name` is additionally **redacted to `"custom"` unless
  `OTEL_LOG_TOOL_DETAILS=1`**.

So there are exactly two ways to reach node+phase on spend:

1. **Resource-attribute stamping** (the greenfield above) — node+phase land
   directly on each metric. Self-contained, no join. This is the recommended
   shape.
2. **A logs↔metrics join** on `session.id` and/or `workflow.run_id` — correlate
   the `workflow.run_id` log group (which spans nested agents) with the
   per-`session.id` cost metrics. This is what recovers *workflow-run grouping*
   specifically, but it reintroduces a join (now inside the collector/query
   layer rather than a sidecar file) and needs `OTEL_LOG_TOOL_DETAILS=1` for
   readable workflow names.

The evaluation's headline question — *does OTel attribute cost to node+phase for
workflow-spawned subagents the scrape `<none>` bucket misses?* — resolves to
**yes, via option 1**, conditional on the inheritance assumption above holding.
Option 2 is the fallback if inheritance does not propagate to subagents.

---

## Field-by-field: what each path can actually observe

| Question | Path A (scrape + sidecar) | Path B (OTel resource attrs) |
|---|---|---|
| node id of a top-level worker session | branch → sidecar `node_id` (`by_node`) | `node.id` resource attr on every metric |
| phase of that session | skill-frame → `by_skill`/`by_phase` | `phase` resource attr on every metric |
| **cost of a workflow-spawned subagent, attributed to node+phase** | **not observable** — no sidecar, excluded from `by_node` (the `<none>` gap) | `node.id`+`phase` inherited on the subagent's metrics **[UNVERIFIED]** |
| group a whole workflow run incl. nested agents | not modeled; subagents float free | `workflow.run_id` log attr groups them |
| per-model truthful cost | `cost()` in `aggregate-usage.sh:478-488` from `message.model` | `claude_code.cost.usage` keyed by `model` |
| depends on SessionStart hook firing for `--bg` | **yes** (unverified — `stamp-dispatch-session.sh:10-26`) | no — env is set by the launcher itself |
| depends on branch-name encoding | yes | no |
| retroactive over history | yes — scrapes existing transcripts | no — only from telemetry-on forward |

Two asymmetries worth carrying into Unit 2:

- **Path A is retroactive; Path B is not.** The scrape can re-audit any past
  window from transcripts already on disk. OTel only sees sessions run with
  export on — it cannot reconstruct the pre-adoption past.
- **Path A already prices per real model truthfully** (`ACTUAL_RATES`,
  generation-aware, `aggregate-usage.sh:454-488`). Adopting OTel's
  `cost.usage` means trusting the vendor's cost number instead of a
  locally-computed one — a substrate-ownership shift, not just a plumbing change.

---

## Trial setup (for a future feasible run)

Ephemeral, local-only, torn down after — never committed as a default.

1. **Stand up a local OTLP collector.** Minimal `otel/opentelemetry-collector`
   listening on `:4317` (gRPC) with a `debug`/`logging` exporter (or a file
   exporter) so emitted metrics/logs are inspectable locally with no cloud
   backend. E.g. a one-off `docker run` binding `4317:4317` with a config whose
   `receivers.otlp.protocols.grpc` feeds a `debug` exporter at
   `verbosity: detailed`. Confirm it is listening (`nc -z localhost 4317`).

2. **Turn export on for a small trial node set only.** For a handful of trial
   nodes, before the per-node `dispatch-spawn-job` call in
   `dispatch-graph-execute` (~`:155`/`:180`), export the three env vars above
   with `OTEL_RESOURCE_ATTRIBUTES="node.id=$id,phase=$phase"` (both already in
   loop scope). Optionally `OTEL_LOG_TOOL_DETAILS=1` to un-redact
   `workflow.name`. **Working-tree-only, reverted after the trial.**

3. **Run a representative slice** including at least one `dispatch-graph-tick`
   (spawns one orchestrator agent per selected node, each fanning out to phase
   subagents) so nested-subagent emission is actually exercised.

4. **Measure and compare.** From the collector output, group
   `claude_code.cost.usage` / `claude_code.token.usage` by the `node.id` +
   `phase` resource attributes (and by `workflow.run_id` from the logs). For the
   same window, run `aggregate-usage.sh --day <date>` and read `by_node` and the
   `<none>`/`by_session_type.subagent` buckets. The decisive comparison: **does
   the OTel `node.id`+`phase` grouping account for subagent cost that appears in
   Path A only as unattributed `subagent`/`<none>` spend?** Quantify the
   `<none>`-bucket dollars that OTel newly attributes.

Do **not** record any number in Unit 2 that did not come out of step 4 on a real
run.

---

## Reuse anchors (grounding for the above)

- `.claude/skills/rsi-audit/scripts/aggregate-usage.sh` — incumbent
  scrape; `by_node` fold `:593-601`, sidecar slurp `:872-874`, per-model cost
  `:454-488`, subagent-nesting note `:15-18`.
- `.claude/skills/dispatch-propagate/scripts/dispatch-stamp-session` — sidecar
  writer; branch→`node_id` derivation `:238-258`.
- `.claude/hooks/stamp-dispatch-session.sh` — SessionStart wiring; unverified
  `--bg`-firing assumption + `sidecar_present_rate` monitor `:10-26`.
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute` — the
  graph-native launcher; per-node loop with `id`/`phase` in scope `:110-135`,
  the two spawn sites `:155`/`:180`.
- `.claude/skills/dispatch-propagate/scripts/dispatch-spawn-job` — the
  `claude --bg` spawn primitive; env-inheriting subshell exec `:288-292`.
- `packages/intentionsutil/scripts/read-sensors.ts` — local-first sensor
  doctrine and the `token-economy` sensor (`:305-312`) the substrate would
  eventually feed; utilization currently read from the statusline
  `rate_limits.json` (`:141-166`), which OTel cost metrics could later replace or
  corroborate.

## Open decision left to office-hours (not this evaluation)

Adopting Path B deepens reliance on the Anthropic-provided export surface (owned
by `delegation-anthropic-claude`; `strategy-token-economy` explicitly manages the
"promote the vendor via spend" divergence). It also trades a locally-computed,
retroactive, vendor-independent cost number for the vendor's `cost.usage`. That
capture-risk / attachment call is an author decision, not something this
mechanism evaluation commits.
