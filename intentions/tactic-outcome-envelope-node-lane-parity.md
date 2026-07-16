---
id: tactic-outcome-envelope-node-lane-parity
kind: tactic
statement: "the dispatch outcome envelope (dispatch-emit-outcome /
  dispatch:outcome:v1) has no graph-native node-lane parity: it hard-requires a
  positive-integer --issue and carries no node_id field, unlike the session
  sidecar stamp which already supports both"
owner: ai
status: raw
parent: null
rationale: "Discovered 2026-07-16 during a /qa-fix pass on
  tactic-graph-frozen-tactic-dispatch (PR #2883, the node lane's own first-ever
  bootstrap through the frozen-tactic-dispatch capability it defines). The
  qa-fix node lane resolves N to the node id (a non-numeric string), yet Step
  6/Escalation instruct emitting the outcome envelope with --issue \"$N\"
  against .claude/skills/dispatch-propagate/scripts/dispatch-emit-outcome, which
  unconditionally requires --issue to be a positive integer (_require_pos_int,
  no --node-id alternative) and whose envelope schema
  (.claude/docs/outcome-envelope.md field table) has no node_id field at all.
  The session worked around it by reusing the PR number for --issue, which
  .claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh's pooled
  by_phase_outcome reduce does not read (it keys only on .outcome.phase and sums
  counts), so no pooled metric is corrupted -- but a per-session debug dump of
  the envelope shows an 'issue' field that is actually a PR number, and the
  field is semantically wrong on the node lane. This is not an isolated qa-fix
  oversight: review-fix/SKILL.md has the identical unresolved contradiction --
  its own idempotency preamble states 'On the node lane ... never pass --issue'
  (line 64-65), yet its own emit-outcome call templates at the deviation and
  no-deviation completion paths (lines ~923, ~961) unconditionally include
  --issue <N> with no node-lane branch. Distinct from
  tactic-token-audit-node-attribution (merged, PR #2777): that tactic gave the
  per-SESSION dispatch-stamp-session sidecar (<sid>.dispatch-stamp.json) node_id
  parity and the aggregate-usage.sh by_node join -- a different, already-solved
  channel. This tactic is the outcome-envelope's OWN per-RUN
  findings/fixes/disposition channel (the dispatch:outcome:v1 JSON block
  dispatch-emit-outcome prints), which was never touched by that work and still
  has zero node-lane awareness -- no node_id field in the schema, script, or
  aggregate-usage.sh's envelope parsing (lines ~322-370, ~706-728). Fix shape:
  add a nullable node_id field to the envelope (mirroring the sidecar's shape),
  make --issue optional when --node-id is supplied (or vice versa) in
  dispatch-emit-outcome, update the field table and worked example in
  .claude/docs/outcome-envelope.md, extend aggregate-usage.sh's envelope
  parse/by_phase_outcome to carry node_id through (not required for the pooled
  phase metric, but should be available for a future by-node join analogous to
  the sidecar's), and fix qa-fix/SKILL.md's and review-fix/SKILL.md's node-lane
  emit-outcome call sites to pass --node-id \"$N\" instead of reusing the PR
  number for --issue. Same shape as the five gaps
  tactic-graph-node-lane-write-hardening (PR #2882) already tracked and fixed
  for the node lane's authoring/transition convention -- this is a sixth, in the
  outcome-envelope's own emit path, discovered after that tactic's scope had
  already closed."
reading: null
gap: null
serves:
  - strategy-token-economy
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
# the dispatch outcome envelope (dispatch-emit-outcome / dispatch:outcome:v1) has no graph-native node-lane parity: it hard-requires a positive-integer --issue and carries no node_id field, unlike the session sidecar stamp which already supports both
