---
id: tactic-graph-execute-claimless-manual-launch
kind: tactic
statement: dispatch-graph-execute must itself refuse to launch a node already
  covered by the claimed set, and a bootstrap-exempt manual launch must have a
  claim-safe route — today the script takes no reservation and checks none, so a
  direct invocation double-books a node the tick's selector has already claimed,
  while the one claim-safe manual path (graph-select-target --standalone) is
  pace-ceiling-gated and returns nothing whenever the weekly curve holds
  target_n at 0
owner: ai
status: raw
parent: null
rationale: "Observed live 2026-08-05T22:31Z during the iteration-N+3 main-qa
  drain: tactic-phase-terminal-requires-disposition ran TWO concurrent /qa-main
  sessions in one worktree (2ae93717 started 22:31:25Z, fc201c10 started
  22:31:34Z, both cwd .claude/worktrees/tactic-phase-terminal-requires-disposition);
  the author stopped one by hand. Sequence: the drain cleared the node's
  office_hours park (commit 3b807377), which is exactly what makes the node
  tick-selectable; dispatch-tick[286881] reconciled it to main-qa at 22:31:22Z
  and launched at 22:31:25Z; the drain driver's own `dispatch-graph-execute
  <id>:tactic:main-qa` launched 9s later at 22:31:34Z. NEITHER LAUNCHER SAW THE
  OTHER, because the entire double-dispatch guard lives in the SELECTOR:
  graph-select-target:787-792 skips a node when `reservation_exists` is true and
  folds `worktree_has_live_session` (daemon-UNKNOWN included) into the claimed
  set. dispatch-graph-execute has no occupancy check anywhere — its only mention
  of `worktree_has_live_session` is a comment at :298. It merely HANDS OFF a
  claim it assumes its caller already holds (hand_off_reservation /
  reservation_mark_spawned at :150-161) and clears one outright on the
  stale-selection (12) and scope-stale (13) dispositions (:392, :408). A caller
  that never went through the selector holds no claim, so the handoff re-stamps
  nothing and the guard is structurally absent in both race directions.
  DISTINCT FROM the two adjacent tactics, both already done: #2995
  tactic-router-spawn-window-duplicate-worker closed the boot-window hole where
  the marker was CLEARED at spawn time before the worker registered — it makes an
  EXISTING claim survive longer, and does not create one for a claimless caller;
  #2918 tactic-graph-router-live-worker-visibility added `graph-select-target
  --standalone` (lock acquire, headroom check, reservation_write, release)
  precisely so a manual/emulated tick is concurrency-safe. THE SECOND LIMB IS
  WHY THAT FIX DOES NOT REACH THIS CASE: --standalone is deliberately
  ceiling-gated (graph-select-target:91-92, :119-120; \"standalone selection is
  paced to zero\" at :391), and `dispatch-target-workers` currently returns 0 on
  the weekly curve — a pause, not a defect, and never to be 'fixed'. So the
  bootstrap exemption (Ruling 34 item 4: do not throttle bootstrap fan-outs to
  protect the pace curve) and claim-safety are today mutually exclusive: the
  pace-exempt route is the claimless one. That is not a misuse the operator can
  avoid — the bootstrap plan's own Step 1 and Step 2 recipes instruct a bare
  `dispatch-graph-execute <id>:tactic:main-qa`, and every park-clearing drain
  reopens the window by construction. Blast radius on the observed run was one
  node of eight drained; the other seven were verified singletons. Fix
  directions to weigh at planning time: (a) give dispatch-graph-execute its own
  pre-spawn claimed-set check (reservation_exists + worktree_occupancy_state)
  that refuses with a distinct non-zero disposition rather than launching —
  cheapest, and makes the script safe for every caller including the selector's
  own; (b) have it acquire the claim itself when it does not already hold one,
  making the selector's claim an optimization rather than a precondition; (c)
  add a pace-exempt admission to --standalone (a --bootstrap or
  --pace-exempt flag) so the claim-safe path is usable while target_n is 0, which
  fixes the doctrine tension but leaves the script unsafe for anyone who skips
  it. (a) and (c) are complementary, not alternatives."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 20
  override: null
  rationale: "Bootstrap band 2 (50/20/10 interim scale): a router write-path
    correctness defect that produces duplicate concurrent workers on a single
    node — same band as the other dispatch-containment fixes, below the Wave-A
    write-path work."
  tier: 1
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Born parked. The defect and its mechanism are established by direct
    observation (see rationale) and need no further diagnosis, but the FIX
    DIRECTION IS A DOCTRINE CALL THE GRAPH DOES NOT RECORD: whether a
    bootstrap-exempt manual launch is entitled to bypass the pace ceiling while
    still holding a claim. Limb (c) — a --pace-exempt/--bootstrap admission on
    graph-select-target --standalone — grants the bootstrap exemption a standing
    route past a ceiling the strategy currently applies to every unattended
    selection, and graph-select-target:91-92 states the opposing premise
    verbatim: an interactive keystroke is sovereign, but 'a --standalone caller
    is unattended, so it is ceiling-gated like every other --standalone
    selection'. A drain driver run by the monitor is unattended by that
    definition yet bootstrap-exempt by Ruling 34 item 4, and those two readings
    contradict. Choosing (c) unilaterally would amend a stated design premise;
    choosing only (a) leaves the monitor with no claim-safe drain route for as
    long as the weekly curve holds target_n at 0, which is the condition that
    produced this incident."
  since: 2026-08-05
  recommendation: "Ratify, in a one-question /align-strategy or office-hours
    sitting citing this park: (i) does the bootstrap exemption (Ruling 34 item 4)
    entitle an UNATTENDED but bootstrap-scoped caller to a pace-ceiling bypass on
    graph-select-target --standalone, or does the ceiling govern and the monitor
    must instead drain via a route that takes the claim without selecting (fix
    limb (b))? and (ii) is limb (a) — dispatch-graph-execute performing its own
    claimed-set check and refusing with a distinct disposition — adopted
    unconditionally, independent of (i)? Limb (a) is expected to be a plain yes:
    it is defence-in-depth for every caller and does not touch the pace doctrine.
    Then clear this office_hours park and run /align-tactics
    tactic-graph-execute-claimless-manual-launch to finalize a plan. STATE A
    FRESH SESSION NEEDS: the guard to mirror is graph-select-target:787-800
    (reservation_exists, then worktree_occupancy_state naming WHY — free /
    live-session / terminal / reserved); the claim primitives are
    reservation_exists / reservation_write / reservation_mark_spawned /
    reservation_clear in
    .claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh
    (reservation_dir at :308-315, DISPATCH_RESERVATION_DIR override at :246);
    the insertion point is dispatch-graph-execute's per-spec loop (the `for spec
    in \"$@\"` at :163) before provisioning, and its existing non-launch
    dispositions (`waiting <id>`, stale-selection 12, scope-stale 13 at :390-408)
    are the precedent for the shape and stdout wording of a new refusal line;
    the standalone lock/ceiling code to extend for limb (c) is
    graph-select-target:288-395 (acquire, TARGET_N via dispatch-target-workers
    at :348, GAP_BUDGET zero-exit at :391). Tests live beside the SUTs and are
    picked up by run-unit-tests.sh's test-*.sh glob with no CI wiring change:
    test-graph-select-target.sh already exercises the claimed-set path, and
    dispatch-graph-execute needs its own or an extension of
    test-dispatch-resolve-worktree.sh."
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# dispatch-graph-execute must itself refuse to launch a node already covered by the claimed set, and a bootstrap-exempt manual launch must have a claim-safe route
