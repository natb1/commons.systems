# OTel attribution substrate — recommendation (tactic-otel-sensor-substrate, Unit 2)

Recommendation memo closing `tactic-otel-sensor-substrate`. Unit 1
(`.claude/skills/rsi-audit/otel-trial-notes.md`) is the mechanism-level
comparison this verdict rests on. Every claim here is grounded in that document;
no new measurement is introduced, because none was taken.

## Verdict: DEFER — adopt-pending a cheap live-trial of the one unverified assumption

Do **not** adopt Path B (OTel resource-attribute stamping) unconditionally, and
do **not** drop it. **Defer** on a short, bounded path: run the ephemeral live
trial Unit 1 already specifies, confirm the single load-bearing assumption, and
only then promote OTel to the primary node+phase attribution path — as a
separate, author-approved follow-up.

The reason the verdict is defer and not adopt is honest and specific: the entire
value of Path B over Path A rests on one runtime behavior that Unit 1 could not
observe and explicitly flagged **[UNVERIFIED — needs live trial]** — that
workflow-spawned subagent processes inherit `OTEL_RESOURCE_ATTRIBUTES` and that
their `claude_code.token.usage` / `cost.usage` metrics actually carry
`node.id`+`phase` (Unit 1, lines 135–138, 182). This is not a peripheral detail;
it is *the* thing this tactic exists to evaluate — closing the subagent `<none>`
blind spot that was the single largest unattributed line in the 2026-06-26→07-03
audit (Unit 1, lines 42–44, 84–90). Adopting on an unverified core mechanism
would repeat exactly the mistake Path A already suffers from: an unverified
`--bg`-hook-firing assumption baked into production (Unit 1, lines 91–96, 185).

The reason the verdict is not drop: the mechanism is sound *by construction* if
inheritance holds. Resource attributes are stamped on every emitted metric at
emit time, removing all three of Path A's fragile join surfaces at once — the
`session-id → node_id` sidecar file, the branch-name encoding, and the
skill-frame phase inference (Unit 1, lines 140–143). The trial to confirm it is
cheap and fully specified (Unit 1, lines 201–233): a one-off local
`otel/opentelemetry-collector` on `:4317`, export toggled on for a handful of
trial nodes, one real `dispatch-graph-tick` slice to exercise nested emission,
compared against `aggregate-usage.sh --day <date>`. That is a few hours of work
that converts the load-bearing assumption from asserted to proven. Dropping
before spending it would waste a genuine improvement.

## Grounding

Everything below traces to Unit 1; the `path:line` anchors are its own.

- **The blind spot is real and acute.** Subagent transcripts carry no sidecar,
  are excluded from `by_node`, and land in `by_session_type.subagent` / `<none>`
  (`aggregate-usage.sh:33-36`, `593-601`; SKILL.md:89,171 — Unit 1 lines 76–83).
  Workflow-spawned agents are the acute case: `/review-fix`, `/qa-fix` fan out to
  `agent()`/subagent calls where Opus is actually spent, and none of it attributes
  (`dispatch-graph-execute:110-230`, SKILL.md:130 — Unit 1 lines 84–90).
- **Path B closes it by construction — if inheritance holds.** The launcher
  already has `id` and `phase` in scope per node
  (`dispatch-graph-execute:110-135`), and `dispatch-spawn-job` execs
  `claude --bg` in an env-inheriting subshell (`:285-298`). Exporting the three
  env vars immediately before the spawn stamps `node.id`+`phase` onto every metric
  the orchestrator and its nested subagents emit (Unit 1 lines 118–143).
- **The reach to node+phase-on-spend is narrow.** Cost/token are *metrics*;
  `workflow.name` / `workflow.run_id` are *log* attributes — there is no
  `workflow.name` field on the cost metric, and it is redacted to `"custom"`
  without `OTEL_LOG_TOOL_DETAILS=1` (Unit 1 lines 145–167). So the resource-attr
  stamp (option 1) is the only self-contained route; the logs↔metrics join
  (option 2) is the fallback if inheritance does not propagate to subagents
  (Unit 1 lines 157–172).
- **Two asymmetries constrain how B can replace A** (Unit 1 lines 187–197):
  - **Path A is retroactive; Path B is forward-only.** The scrape re-audits any
    past window from transcripts on disk; OTel sees only sessions run with export
    on and cannot reconstruct the pre-adoption past.
  - **Path A already prices per real model truthfully** (`ACTUAL_RATES`,
    generation-aware, `aggregate-usage.sh:454-488`). Adopting `cost.usage` trades
    a locally-computed, vendor-independent number for the vendor's — a
    substrate-ownership shift, not just plumbing.

## Sequencing / path to adoption

If the author approves proceeding, sequence B relative to the shipped scrape path
so nothing regresses:

1. **Validate first (gate).** Run the ephemeral trial exactly as Unit 1 step 4
   specifies (lines 223–233): does the OTel `node.id`+`phase` grouping account for
   subagent cost that Path A shows only as unattributed `subagent`/`<none>` spend?
   Quantify the `<none>`-bucket dollars OTel newly attributes. If inheritance does
   **not** propagate, fall back to the option-2 logs↔metrics join before deciding —
   or stop, if neither reaches subagent spend cleanly.
2. **Promote to primary, keep the sidecar as cross-check (transition window).**
   If confirmed, use OTel resource-attribute stamping as the primary path for
   node+phase attribution. Keep the sidecar join running in parallel as a
   fallback and cross-check — the two should agree on top-level worker sessions,
   and any divergence is a signal to investigate before trusting B alone.
3. **Supersede the sidecar only on proven equivalence.** Fully retire the sidecar
   join only once OTel coverage is demonstrated equivalent-or-better across a real
   multi-day window. Because Path A is retroactive and Path B is not (Unit 1 lines
   190–193), the sidecar/scrape path must remain the authority for any window that
   predates telemetry being on — retiring it there would erase the ability to
   re-audit history. Practically, the scrape path likely never fully leaves;
   OTel becomes primary forward, the scrape remains the retroactive backstop.

## Capture-risk decision for the author (office-hours, not resolved here)

This doc recommends a **technical** path. It does **not** resolve the capture
tradeoff, and deliberately so.

Adopting Path B deepens reliance on the Anthropic-provided export surface — owned
by delegation node `delegation-anthropic-claude`, and `strategy-token-economy`
explicitly tracks a "promote the vendor via spend" divergence risk (Unit 1 lines
257–264). It also trades a locally-computed, retroactive, vendor-independent cost
number for the vendor's `cost.usage`, and it requires standing up new local
collector infra (an OTLP collector) that does not exist today.

The question — *how much vendor-surface reliance are we willing to trade for
attribution completeness, and is new local collector infra worth standing up for
it?* — is an author-owned, office-hours decision. It is not something a mechanism
evaluation should commit on the author's behalf. This memo's technical
recommendation (defer-then-validate-then-adopt) is conditional on that call
landing in favor of proceeding.

## What this Unit does NOT do

- **It does not enable telemetry export as a standing default.** No
  `settings.json` change, no env change, no committed `CLAUDE_CODE_ENABLE_TELEMETRY`
  or `OTEL_*` wiring ships with this tactic (Unit 1 lines 23–25, 203).
- **It does not run the live trial.** Unit 1 could not (sandboxed,
  network-isolated), and this Unit does not either. The core mechanism remains
  [UNVERIFIED] and this memo says so plainly rather than papering over it.
- **It records no measured numbers.** Consistent with Unit 1's honesty boundary
  (lines 10–35, 232–233), no `token.usage` / `cost.usage` figures appear here
  because none were observed on a real run.
- **It commits no code.** This is a recommendation memo. Any adoption is a
  separate, future, author-approved follow-up — most likely a new tactic node that
  runs the trial and, if it passes, wires the launcher stamping and stands up the
  collector.
