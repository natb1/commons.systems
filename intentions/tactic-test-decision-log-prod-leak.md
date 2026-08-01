---
id: tactic-test-decision-log-prod-leak
kind: tactic
statement: two dispatch test scripts do not override the decision-log path, so
  their fixture records append to the production routing-decisions.jsonl that
  the fleet's own defect detects read as evidence
owner: ai
status: raw
parent: null
rationale: >-
  Found 2026-07-31 during a fleet health read, while running the bootstrap
  plan's bug-N detect. The detect (tail routing-decisions.jsonl | jq
  'select(.effective_live==null or .effective_live>3)') reported three null
  readings at 16:55-16:56Z. Those readings are not router behaviour at all: they
  are test fixtures. The records name node tactic-some-node and session UUIDs
  aaaa1111-1111-1111-1111-111111111111 / bbbb2222-2222-2222-2222-222222222222,
  and they match select(.effective_live==null) only because standdown-declared
  records carry no effective_live field.


  Mechanism, verified at record time. lib-decision-log.sh:68 resolves the log as
  DISPATCH_DECISION_LOG_FILE, else DISPATCH_DECISION_LOG_DIR, else
  $HOME/.local/share/commons-dispatch/routing-decisions.jsonl. Four test scripts
  set one of those overrides and so write to a temp dir:
  test-lib-frozen-session-park.sh, test-lib-standdown-recheck.sh,
  test-dispatch-select-tick.sh and test-dispatch-tick.sh. Two scripts that also
  exercise decision-logging paths set neither, so their records fall through to
  the production log: test-dispatch-standdown.sh (the source of the aaaa1111
  standdown-declared records) and test-dispatch-stop-hook.sh (the source of the
  tactic-some-node records). 15 fixture records were present in the production
  log at record time, timestamped 07:56Z, 07:58Z, 13:59Z and 16:55-16:56Z on
  2026-07-31.


  Why this is worth a node rather than a cleanup. The production routing log is
  an observability surface the bootstrap plan reads as evidence: it is the sole
  detect for bug N (router effective_live undercounts or reads null) and it
  carries the site records the frozen-session and standdown sweeps are validated
  against. A test run silently appends synthetic rows to it, so a defect detect
  can fire on data no router produced, and a real regression can be dismissed as
  another fixture. This is the same shape as tactic-sweep-timer-unit-dir-leak
  (bug B), where a test run rewrote the live systemd unit ExecStart to a /tmp
  path: a test that does not isolate its environment mutates live state that an
  operator later trusts. It also belongs to the class this strategy already
  tracks, since the corrupted signal is indistinguishable from a healthy one at
  the point of reading.


  Direction for planning, not a plan: give the two unisolated tests the same
  DISPATCH_DECISION_LOG_DIR override the four isolated ones already use, rather
  than inventing a new mechanism; the reuse target is whichever of those four
  has the cleanest setup. Consider whether the guard belongs in the shared test
  harness (test-helpers.sh) so a future test cannot regress this by omission,
  which is how both of these got here. Purging the 15 existing fixture rows from
  the production log is a separate, optional cleanup and must not be conflated
  with the fix: the rows are evidence for this node until it lands.
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
pace_exempt: true
rounds: null
attributes: {}
---
# two dispatch test scripts do not override the decision-log path, so their fixture records append to the production routing-decisions.jsonl that the fleet's own defect detects read as evidence
