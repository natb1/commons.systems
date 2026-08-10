---
id: tactic-invalid-state-lane-diagnostics-unobservable
kind: tactic
statement: "the invalid-state lane's two decision diagnostics are discarded by
  their own production callers, so the lane's tier decisions and
  terminal-session skips cannot be verified from any durable log -- the gap that
  blocked PR #3048's own post-merge verification"
owner: ai
status: raw
parent: null
rationale: "Measured 2026-08-05 by the bootstrap monitor pass while completing
  the /qa-main verification of PR #3048 (tactic-invalid-state-lane). Two
  independent sites, same failure shape -- the diagnostic is emitted, then
  thrown away by the only caller that runs in production. SITE 1:
  dispatch-invalid-state-sweep:214 invokes dispatch-invalid-state-route with
  `>/dev/null 2>&1`, discarding BOTH streams. So
  dispatch-invalid-state-route:505's `intervention skill absent at <dir> -- tier
  inert; escalating to the caller` line -- and every other tier explanation the
  router prints on the way to its exit code -- can never reach journald through
  the production path. The caller keeps only the numeric rc, and rc=10 is
  emitted from NINE distinct sites in that script, so the exit code alone cannot
  identify WHICH ladder rung was taken. SITE 2: graph-select-target:814 records
  `skip_note <id> terminal-session`, which accumulates into SKIPPED_JSON and is
  emitted only inside the selector's stdout JSON result (assembled at :238).
  That result is consumed by the tick and never persisted:
  routing-decisions.jsonl contains ZERO records carrying a `skipped` key across
  its entire history (5968 select-tick records checked) and ZERO
  terminal-session skip entries. The stderr twin at :816 is gated on `[[ -n
  $NODE_TARGET ]]`, so it fires only for an explicit single-node invocation and
  never during a normal tick. MEASURED CONSEQUENCE, not hypothetical: PR #3048's
  needs-main residue item 16 asked for five expected-outcome sub-clauses to be
  confirmed post-merge. The /qa-main pass confirmed three and could not confirm
  two -- and the two it could not confirm were exactly these. It parked rather
  than closing the residue. The behavior itself is CORRECT: this monitor
  confirmed the router's path empirically by invoking
  `dispatch-invalid-state-route --node <id> --kind terminal-session
  --evidence-file <f> --no-intervene` directly against a genuinely terminal-held
  node, which printed the skill-absent line and exited 10 exactly as designed.
  That is the point -- the only way to observe it is to re-run the primitive by
  hand, which no autonomous verification lane can do as a matter of course. Same
  class as invariant I7 (transition-node's stdout reaches no log, so
  verification must grep session transcripts). Remedy shape: forward the
  router's stderr to the sweep's own log rather than /dev/null (it is diagnostic
  text on a path that already logs a summary line), and persist the selector's
  skipped[] into the decision record that routing-decisions.jsonl already writes
  per tick. Dedup: a find-or-create check found no owner.
  tactic-test-decision-log-prod-leak (phase done) concerns test fixtures
  polluting the production decision log -- the opposite direction, and about the
  path, not the payload. tactic-graph-router-live-worker-visibility (phase done)
  is a concurrency-safety mode for the selector, not its logging."
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
# the invalid-state lane's two decision diagnostics are discarded by their own production callers, so the lane's tier decisions and terminal-session skips cannot be verified from any durable log -- the gap that blocked PR #3048's own post-merge verification
