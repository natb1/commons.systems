---
id: tactic-stale-hold-sweep-paused-path-live-daemon-lookup
kind: tactic
statement: The stale-hold sweep's per-candidate live-session claim check falls
  back to a LIVE claude agents daemon round-trip on the paused tick path,
  because that branch exits before the per-tick registered-view snapshot is
  captured — turning a cheap once-per-tick lookup into an N+1 shape that runs
  for the whole duration of a pause
owner: ai
status: raw
parent: null
rationale: "Surfaced as a Deferred, advisory (cost lens) finding during the
  /review-fix pass on PR #3011 (tactic-stale-hold-auto-resolve). Advisory
  findings from the cost lens always route to Deferred and are never
  verify-eligible or fixed in the source PR per the review-fix disposition
  contract."
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
# The stale-hold sweep's per-candidate live-session claim check falls back to a LIVE claude agents daemon round-trip on the paused tick path, because that branch exits before the per-tick registered-view snapshot is captured — turning a cheap once-per-tick lookup into an N+1 shape that runs for the whole duration of a pause

## Finding

The new stale-hold sweep is invoked on the PAUSED tick path (line 372), which exits before the per-tick `claude agents` snapshots are captured (`DISPATCH_AGENTS_SNAPSHOT` / `DISPATCH_AGENTS_SNAPSHOT_ALL` are only exported at dispatch-tick:532 and :555, well after this `exit 0` branch). The sweep's rule (d) calls `worktree_has_live_session "$wt"` once per candidate inside the per-candidate loop (lib-stale-hold-recheck.sh:319), and with no snapshot set that helper falls back to a LIVE `claude agents --json --all` daemon round-trip per candidate. This is the N+1 shape the lens targets: one expensive per-item lookup inside a loop over a set that grows with the number of stuck/held nodes, re-run on every heartbeat fire (OnUnitActiveSec=5min per lib.sh:3293) for the entire duration of a pause — i.e. indefinitely, precisely when the machine is supposed to be quiet. The tick's own comment at dispatch-tick:318-322 already identifies this exact hazard for `reservation_sweep` ("cost one extra LIVE `claude agents --json` round-trip per heartbeat, because the per-tick registry snapshot ... is not captured until further below") but the new sweep pays it once per candidate rather than once per tick. Note that `reservation_exists` short-circuits ahead of it, so only unclaimed candidates pay — which is the majority in the steady state the sweep exists for.

## Recommended fix

Hoist a single registered-view snapshot for the paused branch before the sweeps run — call `claude_agents_snapshot_capture_registered` into a tick-scoped temp file and export `DISPATCH_AGENTS_SNAPSHOT_ALL` on the paused path too (mirroring dispatch-tick:553-562), so every `worktree_has_live_session` in the loop reads the snapshot and the branch makes one daemon round-trip per tick instead of one per candidate. Alternatively, capture the registered view once inside `stale_hold_recheck_sweep` itself when `DISPATCH_AGENTS_SNAPSHOT_ALL` is unset, and unset it on return.

## Provenance

- **Location:** `.claude/skills/dispatch-propagate/scripts/dispatch-tick:372`
- **Source PR:** #3011 (`tactic-stale-hold-auto-resolve`)
- **Adversarial verdict:** not verify-gated — cost-lens findings are advisory and always route to `Deferred`, never through the adversarial-verify pipeline.
- **Why deferred rather than fixed in the source PR:** advisory cost finding, out of scope for the source tactic's 5-unit plan.
