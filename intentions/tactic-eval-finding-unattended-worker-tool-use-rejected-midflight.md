---
id: tactic-eval-finding-unattended-worker-tool-use-rejected-midflight
kind: tactic
statement: A detached ladder worker with no human attached had a Bash tool use
  rejected by the permission gate 65 seconds INTO execution and was told to stop
  and wait for a user who does not exist, killing the review phase; the same
  rejection signature is the nodes largest non-exit-code tool-error class at 6
  occurrences across 5 sessions and hits read-only inspection commands too
owner: ai
status: raw
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
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
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-13
  measured_impact:
    - metric: permission_rejections_in_phase
      value: 3
      unit: count
      window: tactic-attention-namespaced-rank review 2026-08-13T21:42:01Z..21:51:58Z
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: sessions_with_a_rejection_in_phase
      value: 3
      unit: count
      window: tactic-attention-namespaced-rank review 2026-08-13T21:42:01Z..21:51:58Z
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: rejection_signature_occurrences_node_scope
      value: 6
      unit: count
      window: tactic-attention-namespaced-rank all sessions
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: rejection_signature_sessions_node_scope
      value: 5
      unit: count
      window: tactic-attention-namespaced-rank all sessions
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: rejection_latency_after_tool_use_emitted_s
      value: 65
      unit: s
      window: tactic-attention-namespaced-rank review 2026-08-13T21:48:33Z..21:49:38Z
      sensor: session-transcript
      measured: 2026-08-13
    - metric: worker_sandbox_overrides_in_phase
      value: 13
      unit: count
      window: tactic-attention-namespaced-rank review 2026-08-13T21:42:01Z..21:51:58Z
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: unattended_denials_in_phase
      value: 2
      unit: events
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: denial_retry_price_proxy_usd
      value: 0.1743795
      unit: usd
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: sessions_affected_in_phase
      value: 1
      unit: sessions
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: phase_disposition_masked_denial
      value: 1
      unit: phases
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: events.jsonl
      measured: 2026-08-13
    - metric: recurrence_count
      value: 2
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-13
---
# Occurrence — tactic-attention-namespaced-rank / review / `--since 1786661088`

Second sighting. The first killed the phase; this one did not — the phase
completed `reviewed` — which is the useful new information: the denial is not
always fatal, so it is not self-announcing, and a phase can carry silent
coverage loss past a green disposition.

## Observed

Session `agent-abeb8e443ad63b2eb` (a `/code-review` pre-stage subagent under
shell session `c8f2d453-b186-4b9e-8651-e3e4ba8b9280`, 25 turns, $3.88 price
proxy, started 2026-08-13T22:49:44Z) took **2** permission-friction events, both
`user_rejections`, with `retry_price_proxy_usd = 0.1743795`.

There was no user. The ladder driver (`dispatch-ladder-run`, pid 2993618,
`state.json status=running`) spawned this phase detached at 22:44; nothing was
attached to approve anything.

## The two denials, verbatim from the transcript

Both carry `"toolDenialKind":"user-rejected"` and both are the compound-command
classifier, not a policy or sandbox rule:

```
This Bash command contains multiple operations. The following part requires
approval: .PATH --scan-stdin; echo "EXIT=$?"

This Bash command contains multiple operations. The following part requires
approval: bash .github/scripts/check-type-safety-escapes.sh
```

**Note for a future evaluator: do not grep for the string "The user doesn't want
to proceed with this tool use" to find these.** `aggregate-usage.sh` classifies
`user_rejections` from the JSON field `toolDenialKind == "user-rejected"`
(aggregate-usage.sh:423), and that phrase appears nowhere in this transcript. A
literal search for the human-readable rejection text returns zero and reads as a
clean session. Grep `toolDenialKind` instead.

## Why this occurrence matters more than its cost

$0.17 of retry is nothing. The content is everything: the denied command is
`.github/scripts/check-type-safety-escapes.sh` — the **type-safety gate**, run by
a reviewer whose entire review delta (1 file, +2/−2) was two `// type-safety-ok:`
suppression comments added to silence that exact sensor.

So the one reviewer that tried to verify the suppression against the tool that
produced it was denied twice, and the review still reported `disposition:
completed`, `findings_surfaced: 10`, `findings_actionable: 0`. The phase's
headline result — "nothing actionable in this suppression" — was reached with the
verifying check blocked. Nothing in the outcome record marks that.

This compounds `type-safety-marker-invisible-at-write-time` (the marker is run by
no local gate): here an agent *tried* to run the gate locally and the permission
layer stopped it.

## What would have to change

The command shapes are both routine and both avoidable —
`cmd; echo "EXIT=$?"` and a plain `bash <script>` that the classifier split. But
writing "agents should not use compound commands" is the wrong fix twice over: it
has been written already (`.claude/rules/sandbox.md`, "Command pattern matching")
and it still fires, which per lens 7 means the rule, not the session, is the
defect.

The load-bearing gap is that an unattended detached session has no distinct
handling for "no user exists to approve this". It is told to stop and wait for a
human who is not there, and the surrounding phase absorbs the loss silently. A
denial in an unattended session should be a recorded, surfaced event on the
outcome record — not an invisible coverage hole behind a `completed` verdict.

Recording only; the rule about what an unattended session may do belongs to the
script that owns the decision.

## Evidence a later session cannot rediscover

- Transcript: `~/.claude/projects/-home-n8-natb1-commons-systems--claude-worktrees-tactic-attention-namespaced-rank/c8f2d453-b186-4b9e-8651-e3e4ba8b9280/subagents/agent-abeb8e443ad63b2eb.jsonl`
  — 2 hits for `toolDenialKind":"user-rejected"`.
- Phase-scoped: these are the only 2 denials among the window's 17 sessions
  (grep of all 17 transcript paths; positive control `review-fix` matched 16/17).
- Node-wide `tool_errors` for the same signature class: 6 occurrences across 5
  sessions.
