---
id: tactic-park-node-rollback-dirty-tree-blocks-tick-sync
kind: tactic
statement: park-node's failure-rollback can leave a dirty, uncommitted file in
  the main checkout's intentions/, which then breaks dispatch-tick's own git
  merge --ff-only sync step for as long as the dirty file persists -- stalling
  all dispatch with no worker ever spawning
owner: ai
status: raw
parent: null
rationale: "Root-caused 2026-08-01T15:10Z from direct journald evidence during a
  health-read investigation: park-node set office_hours on
  tactic-fleet-alarm-mint-rollback-corruption, then graph-commit refused to
  start (\"unrelated dirty tracked file(s)\"), then park-node logged \"the
  office_hours write was rolled back\" -- but the VERY NEXT LINE shows git merge
  refusing because that same file still had an uncommitted local diff: \"Your
  local changes to the following files would be overwritten by merge:
  intentions/tactic-fleet-alarm-mint-rollback-corruption.md\". The claimed
  rollback did not actually clean the working tree. dispatch-select-tick then
  read sync-failed, armed a /commit-merge-push repair job, and every subsequent
  tick for as long as the dirty file persisted read sync-repair-pending --
  nothing is spawned during this window, regardless of what else is ready to
  run. This explains a real ~7-hour (2026-08-01 07:00Z-14:15Z) stretch of
  effective_live: null readings in routing-decisions.jsonl that was initially
  misattributed to a router undercount (a separate, already-closed defect,
  tactic-graph-router-live-worker-read-robust) before the real cause was traced.
  This is the same CLASS of bug as tactic-fleet-alarm-mint-rollback-corruption
  (a rollback path that logs success but does not actually restore a clean
  state) but a DIFFERENT producer (park-node, not dispatch-fleet-alarm) and a
  different blast radius (blocks the tick's own git sync fleet-wide, not
  listNodes())."
reading: null
gap: "Not yet decided: the exact line(s) in park-node's rollback path that fail
  to fully revert the working tree -- needs a session with time to read
  park-node's rollback implementation directly and trace why a git
  checkout/reset of the affected file does not run, or runs against the wrong
  path, after graph-commit's own failure. Also open: whether this is fixable
  with the same temp-file-then-rename discipline landed for
  tactic-fleet-alarm-mint-rollback-corruption (Unit 1's writeFileAtomic in
  store.ts), since park-node likely calls the same writeNode() path, or whether
  park-node's OWN shell-level rollback (separate from writeNode) has its own
  distinct defect that needs separate fault-injection coverage. Needs an
  /align-tactics round to decide scope and produce a fix."
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal:
  observable: park-node's failure-rollback path always leaves the main checkout's
    intentions/ tree clean (no uncommitted diff), verified by a fault-injection
    test that forces graph-commit to fail mid-park and then asserts git status
    --porcelain is empty afterward
  sensor: a new or extended park-node test suite with a fault-injection case for
    this exact failure path
  threshold: new fault-injection test case passes; existing suite unaffected;
    additionally, a full day passes on origin/main with no sync-failed or
    sync-repair-pending disposition in routing-decisions.jsonl caused by a dirty
    intentions/ file in the main checkout
  is_proxy: false
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
# park-node's failure-rollback can leave a dirty, uncommitted file in the main checkout's intentions/, which then breaks dispatch-tick's own git merge --ff-only sync step for as long as the dirty file persists -- stalling all dispatch with no worker ever spawning
