---
id: tactic-reclaim-audit-spawn-handoff-expired-count
kind: tactic
statement: dispatch-reclaim-audit's RATE source greps exactly two literals --
  (dead-session-stranded) and (live-worker-redundant) -- so it is blind to the
  fourth reservation_sweep reclaim reason, spawn-handoff-expired, added by
  tactic-router-spawn-window-duplicate-worker; a rising never-registered-worker
  rate, or a handoff TTL tuned below real registration latency, shows up nowhere
  in the report
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
# dispatch-reclaim-audit's RATE source greps exactly two literals -- (dead-session-stranded) and (live-worker-redundant) -- so it is blind to the fourth reservation_sweep reclaim reason, spawn-handoff-expired, added by tactic-router-spawn-window-duplicate-worker; a rising never-registered-worker rate, or a handoff TTL tuned below real registration latency, shows up nowhere in the report

## Provenance

- **Location**: `.claude/skills/dispatch-propagate/scripts/dispatch-reclaim-audit:194`
- **Source**: `/review-fix` code-review finder (`residue-6`), PR review pass
- **Adversarial verdict**: Deferred — dispositioned `Deferred` by the residue phase (real, in-contract observation, but not opus-fixable within the landing PR's scope)
- **Source PR**: #2995 (`tactic-router-spawn-window-duplicate-worker`, the PR that added the `spawn-handoff-expired` reclaim reason this finding is about)

## Finding detail

The spawn-handoff change added a fourth reservation-sweep reclaim reason,
`spawn-handoff-expired`, emitted by `lib-reservation-ledger.sh:626`:

```
lib-reservation-ledger: reclaimed reservation <bn> (spawn-handoff-expired after <N>s with no live worker)
```

It fires when a spawn kick succeeded but the spawned worker never registered
in `claude agents` within `DISPATCH_RESERVATION_HANDOFF_TTL_S` (default
300s) — a failure mode that did not exist before the handoff landed, because
graph-lane markers were deleted at the spawn kick and produced no reclaim
event at all.

`dispatch-reclaim-audit` greps exactly two literals for its RATE source —
`(dead-session-stranded)` at `:194`/`:206`/`:209` and `(live-worker-redundant)`
at `:195` — so the new reason is invisible to the report. A rising
never-registered-worker rate, or a handoff TTL tuned below the host's real
registration latency (90s observed 2026-07-30), shows up nowhere.

This was scoped out of the landing PR deliberately: a third reason is
additive and breaks none of the audit's existing counters. It is filed here
because the signal itself is missing, not because anything regressed.

**Recommended fix**:

- `.claude/skills/dispatch-propagate/scripts/dispatch-reclaim-audit` — add a
  third event counter alongside `DEAD_EVENTS`/`REDUNDANT_EVENTS` (`:194-197`)
  for `lib-reservation-ledger: reclaimed reservation .+ \(spawn-handoff-expired`,
  and report it in the RATE summary. Note the message carries a trailing
  ` after <N>s with no live worker` clause, so the pattern must not anchor on
  a closing paren the way the two existing ones do.
- `.claude/skills/dispatch-propagate/scripts/test-reclaim-audit.sh` — a case
  asserting the new counter fires on a synthetic sweep line and stays 0 when
  absent.

Out of scope: the per-worktree session index (`DEAD_EVENTS_FILE`, `:202-215`)
— a handoff expiry has no transcript to index, so it should stay a scalar
count, not join the dead-session interval analysis.

**Verification**: `bash .claude/skills/dispatch-propagate/scripts/test-reclaim-audit.sh`
