---
id: tactic-spawn-handoff-noverify-phantom-stall
kind: tactic
statement: "The spawn-handoff reservation
  (tactic-router-spawn-window-duplicate-worker) holds a budget slot for the full
  DISPATCH_RESERVATION_HANDOFF_TTL_S (300s) on the sole evidence that
  dispatch-spawn-job --no-verify returned 0 -- a flag that explicitly skips
  registration verification -- so any condition that makes `claude --bg` exit 0
  without a session ever registering (auto-mode classifier denial, bg-supervisor
  parenting failure, stale daemon version, OOM during boot) converts each launch
  attempt into a 300s reservation with zero work performed, and a fleet with
  enough such nodes can pin LIVE_COUNT >= TARGET_N and hard-stop every
  subsequent tick at concurrency-cap: a self-sustaining stall driven purely by
  phantom claims"
owner: ai
status: raw
parent: null
rationale: null
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
# The spawn-handoff reservation (tactic-router-spawn-window-duplicate-worker) holds a budget slot for the full DISPATCH_RESERVATION_HANDOFF_TTL_S (300s) on the sole evidence that dispatch-spawn-job --no-verify returned 0 -- a flag that explicitly skips registration verification -- so any condition that makes `claude --bg` exit 0 without a session ever registering (auto-mode classifier denial, bg-supervisor parenting failure, stale daemon version, OOM during boot) converts each launch attempt into a 300s reservation with zero work performed, and a fleet with enough such nodes can pin LIVE_COUNT >= TARGET_N and hard-stop every subsequent tick at concurrency-cap: a self-sustaining stall driven purely by phantom claims

## Provenance

- **Location**: `.claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh:609`
- **Source**: `/review-fix` red-team finder (`red-team-2`), PR review pass
- **Adversarial verdict**: Deferred — classified `Deferred` at review-fix classify stage (not sent to adversarial verify; the `security_class` of `required` combined with `Deferred` bucket means the classifier judged this real but out of scope for the landing PR, not a false positive)
- **Source PR**: #2995 (`tactic-router-spawn-window-duplicate-worker`, the PR that landed the spawn-handoff fix this finding is about)

## Finding detail

The handoff makes every successful spawn kick hold a budget slot for a full
`DISPATCH_RESERVATION_HANDOFF_TTL_S` (300s), and the only evidence a worker
exists is that `dispatch-spawn-job --no-verify` returned 0 — a flag that, per
`dispatch-spawn-job:29` and `:78`, explicitly SKIPS the registration verify, so
the kick's exit code is the sole signal.

Phantom-spawn stall scenario: any condition that makes `claude --bg` exit 0
without a session ever registering — an auto-mode classifier denial of the
spawned prompt, a bg-supervisor parenting failure, a stale daemon version, an
OOM during boot — now converts each launch attempt into a 300s reservation
with zero work performed. Rule (a) never fires (no worker of that name ever
registers), so the slot is held the full TTL, then reclaimed, then the same
node is re-selected, re-kicked, and re-held for another 300s, indefinitely.
With `TARGET_N` such nodes the ledger alone pins `LIVE_COUNT >= TARGET_N` and
`dispatch-select-tick:645-651` hard-stops every subsequent tick at
`concurrency-cap` — a self-sustaining fleet stall driven purely by phantom
claims.

Before this change the marker was cleared on the kick, so a phantom spawn cost
nothing and other nodes stayed dispatchable; the change converts a harmless
failure into a budget-consuming one.

**Recommended fix**: Do not let an unverified kick hold a budget slot for the
full TTL. Either drop `--no-verify` on the graph spawn sites so
`verify_agent_registered_under` confirms the session before
`reservation_mark_spawned` stamps the handoff, or record the spawned job id in
the marker and have rule (a-handoff) reclaim as soon as the job is definitively
absent from `claude agents --json --all` (the `claude_session_id_is_live` /
`claude_job_id_for_name_all` primitives already exist), falling back to the
TTL only on an UNKNOWN registry.
