#!/usr/bin/env bash
# Tests for dispatch-tick -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 21319-21957.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-tick tests (#982)
# ============================================================================
# The headless tick sequencer runs against FAKE dispatch-select-tick /
# dispatch-materialize-spawn / dispatch-spawn-job scripts (each landed in
# TMPDIR_TEST so dispatch-tick's SCRIPT_DIR resolution finds them). The fake
# select-tick prints a test-controlled decision line as its LAST stdout line; the
# fake materialize-spawn records its argv to a log file and prints a
# test-controlled terminal token; the fake spawn-job logs its argv. Each routing
# branch gets at least one assertion.
echo ""
echo "=== dispatch-tick ==="

tick_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/logs"
  cp "$SCRIPT_DIR/dispatch-tick" "$TMPDIR_TEST/dispatch-tick"
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/lib.sh"
  # Copied (not chmod +x — these are sourced, not executed) so dispatch-tick's
  # SCRIPT_DIR-relative `source "$SCRIPT_DIR/lib-claude-agents.sh"` /
  # `lib-reservation-ledger.sh` calls resolve inside the copied tmpdir and the
  # paused-branch reservation_sweep genuinely runs instead of source-failing.
  cp "$SCRIPT_DIR/lib-claude-agents.sh" "$TMPDIR_TEST/lib-claude-agents.sh"
  cp "$SCRIPT_DIR/lib-reservation-ledger.sh" "$TMPDIR_TEST/lib-reservation-ledger.sh"
  # Copied (not chmod +x — sourced, not executed) so dispatch-tick's
  # SCRIPT_DIR-relative `source "$SCRIPT_DIR/lib-frozen-session-park.sh"` calls
  # resolve inside the copied tmpdir on both cadences (paused branch, normal
  # path) and the frozen-session sweep genuinely runs instead of source-failing.
  cp "$SCRIPT_DIR/lib-frozen-session-park.sh" "$TMPDIR_TEST/lib-frozen-session-park.sh"
  # Also copy lib-decision-log.sh, which lib-frozen-session-park.sh sources
  # non-fatally at load time (best-effort decision-log sink).
  cp "$SCRIPT_DIR/lib-decision-log.sh" "$TMPDIR_TEST/lib-decision-log.sh"
  chmod +x "$TMPDIR_TEST/dispatch-tick"
  # Pin the canonical main worktree so the advisory diagnose-main / jit-reminder
  # spawns get a deterministic --cwd independent of the host repo layout and the
  # test's $PWD (dispatch-tick's resolve_project_root would otherwise resolve the
  # real project root). The fake spawn-job logs this value as its --cwd argv.
  export DISPATCH_TICK_MAIN_WORKTREE="$TMPDIR_TEST"
  # Pin the shared lock file under TMPDIR_TEST so the headless-liveness sentinel
  # (#1068) the tick writes resolves through dispatch_lock_file to a path inside
  # the test tree (not the host repo's tmp/).
  export DISPATCH_LOCK_FILE="$TMPDIR_TEST/dispatch.lock"
  # Pin the pause sentinel to a path INSIDE the test tree that does not exist by
  # default, so the tick's pause guard never fires from a real host flag file at
  # the default $HOME/.local/share/commons-dispatch/paused. A pause test creates
  # this file explicitly to exercise the guard.
  export DISPATCH_PAUSE_FLAG="$TMPDIR_TEST/paused"
  # Isolate the two inputs the paused-branch reservation_sweep reads, mirroring
  # the global setup() and sel_tick_setup. Without these the sweep falls back to
  # the REAL shared ledger under the host repo's tmp/dispatch-reservations and to
  # the real `claude` binary — and since a sandboxed `claude agents --json` returns
  # an empty array with exit 0 (a DEFINITE empty live set, not UNKNOWN), a tick
  # test would reclaim live production markers as dead-session-stranded,
  # under-counting effective_live for the next real tick.
  #  - ledger: an empty scratch dir → the sweep finds no markers and no-ops.
  #  - liveness: a non-existent binary → `claude agents --json` exits non-zero →
  #    UNKNOWN, so the sweep declines to reclaim anything.
  # A sweep test opts in by planting a marker here and overwriting
  # CLAUDE_AGENTS_CMD with a fake whose registry omits the marker's session.
  export DISPATCH_RESERVATION_DIR="$TMPDIR_TEST/reservations"
  mkdir -p "$TMPDIR_TEST/reservations"
  export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/no-such-claude"

  # Isolate every input the frozen-session sweep (lib-frozen-session-park.sh)
  # reads, mirroring the reservation-ledger isolation above. Same defensive
  # default: CLAUDE_AGENTS_CMD already points at a non-existent binary, so
  # claude_agents_list_blocked_workers returns UNKNOWN and the sweep parks
  # nothing by default — a tick test can never touch or park a real production
  # node. The repo/projects/park-node/decision-log paths are pointed at scratch
  # locations regardless, so a test that DOES install a live fake-claude still
  # cannot reach the host's real graph, transcripts, or park-node.
  export DISPATCH_FROZEN_SESSION_PROJECTS_ROOT="$TMPDIR_TEST/frozen-projects"
  mkdir -p "$TMPDIR_TEST/frozen-projects"
  export DISPATCH_FROZEN_SESSION_REPO_ROOT="$TMPDIR_TEST/frozen-repo"
  mkdir -p "$TMPDIR_TEST/frozen-repo/intentions"
  git -C "$TMPDIR_TEST/frozen-repo" init -q
  git -C "$TMPDIR_TEST/frozen-repo" config user.email "test@example.com"
  git -C "$TMPDIR_TEST/frozen-repo" config user.name "Test"
  export DISPATCH_FROZEN_SESSION_PARK_NODE="$TMPDIR_TEST/fake-park-node"
  cat > "$TMPDIR_TEST/fake-park-node" <<FAKE
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/logs/park-node.log"
echo "park" >> "$TMPDIR_TEST/logs/order.log"
exit \${TICK_PARK_NODE_RC:-0}
FAKE
  chmod +x "$TMPDIR_TEST/fake-park-node"
  export DISPATCH_DECISION_LOG_DIR="$TMPDIR_TEST/decisions"
  mkdir -p "$TMPDIR_TEST/decisions"

  # Fake dispatch-select-tick: echoes any TICK_SEL_PRE passthrough lines, then
  # the test-controlled decision line (TICK_DECISION) as the LAST line. Exits
  # TICK_SEL_RC (default 0).
  cat > "$TMPDIR_TEST/dispatch-select-tick" <<FAKE
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/logs/select-tick.log"
echo "select" >> "$TMPDIR_TEST/logs/order.log"
[[ -n "\${TICK_SEL_PRE:-}" ]] && printf '%s\n' "\$TICK_SEL_PRE"
printf '%s\n' "\${TICK_DECISION:-empty}"
exit \${TICK_SEL_RC:-0}
FAKE
  # Fake dispatch-graph-execute (tactic-graph-router-selector): the ONLY queue
  # execute path now (the legacy dispatch-materialize-spawn lane was deleted in
  # Unit 3). Records its full argv (the id:kind:phase specs), echoes any
  # TICK_GRAPH_EXEC_PRE launch-narrative lines, then exits TICK_GRAPH_EXEC_RC
  # (default 0).
  cat > "$TMPDIR_TEST/dispatch-graph-execute" <<FAKE
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/logs/graph-execute.log"
[[ -n "\${TICK_GRAPH_EXEC_PRE:-}" ]] && printf '%s\n' "\$TICK_GRAPH_EXEC_PRE"
exit \${TICK_GRAPH_EXEC_RC:-0}
FAKE
  # Fake dispatch-spawn-job: records its full argv, prints a spawn result.
  cat > "$TMPDIR_TEST/dispatch-spawn-job" <<FAKE
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/logs/spawn-job.log"
echo "\${TICK_SPAWN_RESULT:-spawned}"
exit 0
FAKE
  # Fake dispatch-refresh-rate-limits (#1127): records that it ran (to order.log
  # for ordering assertions) and exits TICK_REFRESH_RC (default 0). The headless
  # tick runs this before the budget read; tests assert it runs first and that a
  # non-zero exit does not break the tick.
  cat > "$TMPDIR_TEST/dispatch-refresh-rate-limits" <<FAKE
#!/usr/bin/env bash
echo refresh >> "$TMPDIR_TEST/logs/order.log"
exit \${TICK_REFRESH_RC:-0}
FAKE
  # Fake dispatch-tick-recover (#1445): records that it ran so a test can assert
  # the no-spawn-drain backstop fired. Exits 0.
  cat > "$TMPDIR_TEST/dispatch-tick-recover" <<FAKE
#!/usr/bin/env bash
echo "recover" >> "$TMPDIR_TEST/logs/recover.log"
exit 0
FAKE
  # Fake dispatch-schedule-convergence-reseed (#1453): records each invocation so
  # a test can assert the convergence safety net was (or was NOT) armed on a
  # `propagate` token. Exits TICK_CONVERGE_RC (default 0). Same PATH-stub pattern
  # as the dispatch-spawn-job fake above.
  cat > "$TMPDIR_TEST/dispatch-schedule-convergence-reseed" <<FAKE
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/logs/converge.log"
exit \${TICK_CONVERGE_RC:-0}
FAKE
  chmod +x "$TMPDIR_TEST/dispatch-select-tick" \
           "$TMPDIR_TEST/dispatch-graph-execute" \
           "$TMPDIR_TEST/dispatch-spawn-job" \
           "$TMPDIR_TEST/dispatch-refresh-rate-limits" \
           "$TMPDIR_TEST/dispatch-tick-recover" \
           "$TMPDIR_TEST/dispatch-schedule-convergence-reseed"
}

tick_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  unset TICK_DECISION TICK_SEL_RC TICK_GRAPH_EXEC_RC \
    TICK_SEL_PRE TICK_GRAPH_EXEC_PRE TICK_SPAWN_RESULT DISPATCH_TICK_MAIN_WORKTREE \
    DISPATCH_LOCK_FILE TICK_REFRESH_RC TICK_CONVERGE_RC DISPATCH_PAUSE_FLAG \
    DISPATCH_RESERVATION_DIR CLAUDE_AGENTS_CMD DISPATCH_RESERVATION_SWEEP_NOW_EPOCH \
    DISPATCH_FROZEN_SESSION_PROJECTS_ROOT DISPATCH_FROZEN_SESSION_REPO_ROOT \
    DISPATCH_FROZEN_SESSION_PARK_NODE DISPATCH_DECISION_LOG_DIR \
    DISPATCH_FROZEN_SESSION_NOW_EPOCH TICK_PARK_NODE_RC
}

run_tick() { "$TMPDIR_TEST/dispatch-tick" "$@" 2>/dev/null; }
run_tick_stderr() { "$TMPDIR_TEST/dispatch-tick" "$@" 2>&1 1>/dev/null; }

# tick_frozen_add_blocked_candidate <sid> <node-id> — configure the Unit 2 test
# seams (fake `claude agents` registry, an aged transcript, and an unparked node
# committed to the scratch repo's origin/main) so the frozen-session sweep finds
# exactly one aged, parkable candidate. Fixed clock: idle = 2000s, well past the
# 900s default grace.
tick_frozen_add_blocked_candidate() {
  local sid="$1" node="$2"
  local now=1700000000
  export DISPATCH_FROZEN_SESSION_NOW_EPOCH="$now"

  cat > "$TMPDIR_TEST/frozen-repo/intentions/$node.md" <<NODE
---
id: $node
kind: tactic
office_hours: null
---

Body text.
NODE
  git -C "$TMPDIR_TEST/frozen-repo" add -A
  git -C "$TMPDIR_TEST/frozen-repo" commit -q -m "node $node"
  git -C "$TMPDIR_TEST/frozen-repo" update-ref refs/remotes/origin/main HEAD

  mkdir -p "$TMPDIR_TEST/frozen-projects/proj-a"
  printf '{}\n' > "$TMPDIR_TEST/frozen-projects/proj-a/$sid.jsonl"
  touch -d "@$(( now - 2000 ))" "$TMPDIR_TEST/frozen-projects/proj-a/$sid.jsonl"

  cat > "$TMPDIR_TEST/fake-claude" <<FAKE
#!/usr/bin/env bash
printf '[{"sessionId":"$sid","name":"$node","state":"blocked","status":"busy","cwd":"/tmp/$node"}]'
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/fake-claude"
  export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/fake-claude"
}

# --- busy → exit 0, no graph-execute, no spawn-job -----------------------------
echo "Test: dispatch-tick busy → exit 0, no graph-execute/spawn"
tick_setup
export TICK_DECISION="busy"
out=$(run_tick) && rc=0 || rc=$?
assert_eq "busy: exit 0" "0" "$rc"
assert_eq "busy: no graph-execute call" "0" \
  "$([ -f "$TMPDIR_TEST/logs/graph-execute.log" ] && echo 1 || echo 0)"
assert_eq "busy: no spawn-job call" "0" \
  "$([ -f "$TMPDIR_TEST/logs/spawn-job.log" ] && echo 1 || echo 0)"
tick_teardown

# --- pause sentinel: autonomous tick with flag present → no-op before select ---
# The pause flag makes an AUTONOMOUS tick exit before dispatch-select-tick and
# before dispatch-refresh-rate-limits, so it spawns nothing and arms no reseed.
# Already-running workers are separate sessions the tick never signals, so this
# pause does not interfere with in-flight work.
echo "Test: dispatch-tick paused (flag present, autonomous) → exit 0, no select-tick/refresh/spawn"
tick_setup
: > "$TMPDIR_TEST/paused"
export TICK_DECISION="empty"
# Plant a stale/dead-session reservation marker BEFORE the tick runs (in the
# scratch ledger tick_setup already isolated), and overwrite the default
# UNKNOWN `claude` stub with a fake whose live-session registry does NOT include
# the marker's recorded session — so the marker is dead-session-stranded and
# reclaimable by reservation_sweep. This exercises the sweep dispatch-tick runs
# on the paused branch before its `exit 0`.
printf 'session=dead-sess\nissue=910\ntimestamp=2026-01-01T00:00:00Z\n' \
  > "$DISPATCH_RESERVATION_DIR/910-slug"
# Pin the sweep's "now" so the marker's age is host-clock-independent: the
# stamped timestamp's epoch is 1767225600, so 1767225631 is 31s later — past the
# 30s boot grace, hence reclaimable (same pinning the rl-sweep-aged test uses).
# Without this the assertion silently inverts on a host clock at or before
# 2026-01-01T00:00:30Z, where the marker is still in-flight and correctly kept.
export DISPATCH_RESERVATION_SWEEP_NOW_EPOCH=1767225631
cat > "$TMPDIR_TEST/fake-claude" <<'FAKE'
#!/usr/bin/env bash
echo '[{"sessionId":"other","pid":1,"status":"busy","name":"someworker"}]'
exit 0
FAKE
chmod +x "$TMPDIR_TEST/fake-claude"
export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/fake-claude"
out=$(run_tick) && rc=0 || rc=$?
assert_eq "paused: exit 0" "0" "$rc"
assert_eq "paused: stdout announces pause" "1" \
  "$(printf '%s' "$out" | grep -qi 'paused (sentinel present' && echo 1 || echo 0)"
assert_eq "paused: select-tick NOT called" "0" \
  "$([ -f "$TMPDIR_TEST/logs/select-tick.log" ] && echo 1 || echo 0)"
assert_eq "paused: refresh-rate-limits NOT run (guard exits before it)" "0" \
  "$([ -f "$TMPDIR_TEST/logs/order.log" ] && echo 1 || echo 0)"
assert_eq "paused: no graph-execute" "0" \
  "$([ -f "$TMPDIR_TEST/logs/graph-execute.log" ] && echo 1 || echo 0)"
assert_eq "paused: no spawn-job" "0" \
  "$([ -f "$TMPDIR_TEST/logs/spawn-job.log" ] && echo 1 || echo 0)"
assert_eq "paused: paused-path sweep still reclaimed the dead-session marker" "0" \
  "$([ -f "$DISPATCH_RESERVATION_DIR/910-slug" ] && echo 1 || echo 0)"
tick_teardown

# --- tactic-denied-command-parks-node: paused tick still runs the frozen-session
# sweep -------------------------------------------------------------------------
# The pause branch is documented as the only autonomous path that never reaches
# dispatch-select-tick's own sweeps, so it must sweep the frozen-session detector
# itself (mirroring the reservation-ledger sweep covered above) before its
# `exit 0`. Configure one aged blocked candidate via the Unit 2 test seams and
# assert the fake park-node's argv log records the park.
echo "Test: dispatch-tick paused, one aged blocked candidate → frozen-session sweep parks it, still exits 0 paused"
tick_setup
: > "$TMPDIR_TEST/paused"
tick_frozen_add_blocked_candidate "0aa1-1111" "tactic-frozen-paused"
out=$(run_tick) && rc=0 || rc=$?
assert_eq "paused-frozen: exit 0" "0" "$rc"
assert_eq "paused-frozen: stdout still announces pause" "1" \
  "$(printf '%s' "$out" | grep -qi 'paused (sentinel present' && echo 1 || echo 0)"
assert_eq "paused-frozen: select-tick NOT called" "0" \
  "$([ -f "$TMPDIR_TEST/logs/select-tick.log" ] && echo 1 || echo 0)"
assert_eq "paused-frozen: park-node invoked exactly once" "1" \
  "$(grep -cF "tactic-frozen-paused" "$TMPDIR_TEST/logs/park-node.log" 2>/dev/null || echo 0)"
tick_teardown

# --- pause sentinel: --manual overrides the flag → the tick runs normally ------
echo "Test: dispatch-tick --manual with flag present → overrides pause, runs select-tick"
tick_setup
: > "$TMPDIR_TEST/paused"
export TICK_DECISION="busy"
out=$(run_tick --manual) && rc=0 || rc=$?
assert_eq "manual-override: exit 0" "0" "$rc"
assert_eq "manual-override: select-tick WAS called" "1" \
  "$([ -f "$TMPDIR_TEST/logs/select-tick.log" ] && echo 1 || echo 0)"
assert_eq "manual-override: not announced as paused" "0" \
  "$(printf '%s' "$out" | grep -qi 'paused (sentinel present' && echo 1 || echo 0)"
tick_teardown

# --- concurrency-cap / sync-repair-pending / sync-broken ---------------------
# Pass-through dispositions: exit 0, no graph-execute, no spawn-job. #1495 adds
# the two sync pass-throughs (sync-repair-pending, sync-broken); sync-failed moved
# out of this loop because it now spawns the repair job (covered below). `empty`
# moved out because #1557 routes it through dispatch-tick-recover on the
# autonomous path (covered by its own tests below). The legacy `resolver-failed`
# disposition died with the legacy selector — it is now an unrecognized decision.
for d in concurrency-cap sync-repair-pending sync-broken; do
  echo "Test: dispatch-tick $d → exit 0, no graph-execute/spawn"
  tick_setup
  export TICK_DECISION="$d"
  out=$(run_tick) && rc=0 || rc=$?
  assert_eq "$d: exit 0" "0" "$rc"
  assert_eq "$d: no graph-execute call" "0" \
    "$([ -f "$TMPDIR_TEST/logs/graph-execute.log" ] && echo 1 || echo 0)"
  assert_eq "$d: no spawn-job call" "0" \
    "$([ -f "$TMPDIR_TEST/logs/spawn-job.log" ] && echo 1 || echo 0)"
  tick_teardown
done

# --- main-broken → spawn-job /dispatch-diagnose-main, exit 0 -----------------
echo "Test: dispatch-tick main-broken → spawn-job diagnose-main"
tick_setup
export TICK_DECISION="main-broken abc1234"
out=$(run_tick) && rc=0 || rc=$?
assert_eq "main-broken: exit 0" "0" "$rc"
assert_eq "main-broken: spawn-job argv (Sonnet — diagnosis authors no product code)" \
  "--name diagnose-main --cwd $TMPDIR_TEST --model sonnet /dispatch-diagnose-main abc1234" \
  "$(cat "$TMPDIR_TEST/logs/spawn-job.log")"
assert_eq "main-broken: no graph-execute call" "0" \
  "$([ -f "$TMPDIR_TEST/logs/graph-execute.log" ] && echo 1 || echo 0)"
tick_teardown

# --- #1495: sync-failed → spawn-job /commit-merge-push (sync-repair), exit 0 ---
echo "Test: dispatch-tick sync-failed → spawn-job sync-repair /commit-merge-push"
tick_setup
export TICK_DECISION="sync-failed"
out=$(run_tick) && rc=0 || rc=$?
assert_eq "sync-failed: exit 0" "0" "$rc"
assert_eq "sync-failed: spawn-job argv (Sonnet — conflict recovery escalates to Opus internally)" \
  "--name sync-repair --cwd $TMPDIR_TEST --model sonnet /commit-merge-push" \
  "$(cat "$TMPDIR_TEST/logs/spawn-job.log")"
assert_eq "sync-failed: no graph-execute call" "0" \
  "$([ -f "$TMPDIR_TEST/logs/graph-execute.log" ] && echo 1 || echo 0)"
tick_teardown

# --- jit-reminder → spawn-job /dispatch-jit-reminder, exit 0 -----------------
echo "Test: dispatch-tick jit-reminder → spawn-job jit-reminder-<num>"
tick_setup
export TICK_DECISION="jit-reminder owner/repo 42 PVT_x ITEM_y"
out=$(run_tick) && rc=0 || rc=$?
assert_eq "jit-reminder: exit 0" "0" "$rc"
assert_eq "jit-reminder: spawn-job argv (Sonnet — reminder skills author no product code)" \
  "--name jit-reminder-42 --cwd $TMPDIR_TEST --model sonnet /dispatch-jit-reminder owner/repo 42 PVT_x ITEM_y" \
  "$(cat "$TMPDIR_TEST/logs/spawn-job.log")"
tick_teardown

# --- graph <count> <spec>... → dispatch-graph-execute <spec>..., exit 0 ------
# The graph lane is the ONLY queue execute path now. dispatch-tick shifts off the
# `graph` keyword and the <count>, then hands the id:kind:phase specs to
# dispatch-graph-execute. The per-node reservations are already written and the
# lock already released by select-tick, so the execute runs lock-free.
echo "Test: dispatch-tick graph → dispatch-graph-execute with the node specs"
tick_setup
export TICK_DECISION="graph 2 t1:tactic:implement t2:tactic:review"
out=$(run_tick) && rc=0 || rc=$?
assert_eq "graph-exec: exit 0" "0" "$rc"
assert_eq "graph-exec: graph-execute got the specs (count/keyword stripped)" \
  "t1:tactic:implement t2:tactic:review" "$(cat "$TMPDIR_TEST/logs/graph-execute.log")"
assert_eq "graph-exec: no spawn-job call (graph lane spawns via graph-execute)" "0" \
  "$([ -f "$TMPDIR_TEST/logs/spawn-job.log" ] && echo 1 || echo 0)"
tick_teardown

# --- #1453: convergence reseed armed on a graph execute (autonomous only) -----
# On a `graph` decision from an AUTONOMOUS tick (no --manual, no explicit <N>),
# dispatch-tick calls dispatch-schedule-convergence-reseed exactly once after the
# execute. The autonomous-only guard keys on the $MANUAL/$ARG globals, NOT the
# decision string: the --manual test below sets that global through the real
# invocation (--manual trips MANUAL). The graph lane is the only queue execute
# path now (the legacy issue/pr/materialize lane was deleted in Unit 3).
echo "Test: dispatch-tick autonomous graph → convergence reseed armed once (#1453)"
tick_setup
export TICK_DECISION="graph 1 t1:tactic:implement"
out=$(run_tick) && rc=0 || rc=$?
assert_eq "converge-graph: exit 0" "0" "$rc"
assert_eq "converge-graph: convergence script called exactly once" "1" \
  "$(wc -l < "$TMPDIR_TEST/logs/converge.log" | tr -d ' ')"
tick_teardown

echo "Test: dispatch-tick --manual graph → convergence reseed NOT armed (autonomous-only) (#1453)"
tick_setup
export TICK_DECISION="graph 1 t1:tactic:implement"
out=$(run_tick --manual) && rc=0 || rc=$?
assert_eq "converge-manual: exit 0" "0" "$rc"
assert_eq "converge-manual: convergence script NOT called (MANUAL set)" "0" \
  "$([ -f "$TMPDIR_TEST/logs/converge.log" ] && echo 1 || echo 0)"
tick_teardown

echo "Test: dispatch-tick convergence reseed failure is best-effort → tick still exits 0 (#1453)"
tick_setup
export TICK_DECISION="graph 1 t1:tactic:implement" TICK_CONVERGE_RC=1
out=$(run_tick) && rc=0 || rc=$?
assert_eq "converge-besteffort: exit 0 despite arm failure" "0" "$rc"
assert_eq "converge-besteffort: convergence script was called" "1" \
  "$(wc -l < "$TMPDIR_TEST/logs/converge.log" | tr -d ' ')"
tick_teardown

echo "Test: dispatch-tick concurrency-cap → convergence reseed NOT armed (#1453)"
tick_setup
export TICK_DECISION="concurrency-cap"
out=$(run_tick) && rc=0 || rc=$?
assert_eq "converge-cap: exit 0" "0" "$rc"
assert_eq "converge-cap: convergence script NOT called (no propagate branch)" "0" \
  "$([ -f "$TMPDIR_TEST/logs/converge.log" ] && echo 1 || echo 0)"
tick_teardown

echo "Test: dispatch-tick autonomous empty → invokes recover, exit 0 (#1557)"
tick_setup
export TICK_DECISION="empty"
out=$(run_tick) && rc=0 || rc=$?
assert_eq "empty: exit 0" "0" "$rc"
assert_eq "empty: recover invoked" "1" \
  "$([ -f "$TMPDIR_TEST/logs/recover.log" ] && echo 1 || echo 0)"
assert_eq "empty: no graph-execute call" "0" \
  "$([ -f "$TMPDIR_TEST/logs/graph-execute.log" ] && echo 1 || echo 0)"
tick_teardown

echo "Test: dispatch-tick --manual empty → does NOT invoke recover (autonomous-only) (#1557)"
tick_setup
export TICK_DECISION="empty"
out=$(run_tick --manual) && rc=0 || rc=$?
assert_eq "empty-manual: exit 0" "0" "$rc"
assert_eq "empty-manual: recover NOT invoked (MANUAL set)" "0" \
  "$([ -f "$TMPDIR_TEST/logs/recover.log" ] && echo 1 || echo 0)"
tick_teardown

# --- dispatch-graph-execute exits non-zero → dispatch-tick exits 2 -----------
echo "Test: dispatch-tick graph-execute non-zero exit → exit 2"
tick_setup
export TICK_DECISION="graph 1 t1:tactic:implement" TICK_GRAPH_EXEC_RC=2
out=$(run_tick) && rc=0 || rc=$?
assert_eq "graph-exec non-zero: exit 2" "2" "$rc"
tick_teardown

# --- select-tick passthrough lines are echoed through ------------------------
echo "Test: dispatch-tick echoes select-tick passthrough + decision"
tick_setup
export TICK_DECISION="empty" TICK_SEL_PRE="jit: weekly-review: created #42"
out=$(run_tick) || true
assert_eq "passthrough: jit line echoed" "1" \
  "$(printf '%s\n' "$out" | grep -cF 'jit: weekly-review: created #42')"
assert_eq "passthrough: decision echoed" "1" \
  "$(printf '%s\n' "$out" | grep -cF 'empty')"
tick_teardown

# --- unrecognized decision line → exit 2 -------------------------------------
echo "Test: dispatch-tick unrecognized decision → exit 2"
tick_setup
export TICK_DECISION="garbage unexpected"
out=$(run_tick) && rc=0 || rc=$?
assert_eq "unrecognized: exit 2" "2" "$rc"
assert_eq "unrecognized: no graph-execute call" "0" \
  "$([ -f "$TMPDIR_TEST/logs/graph-execute.log" ] && echo 1 || echo 0)"
tick_teardown

# --- unknown flag → usage error, exit 2 --------------------------------------
echo "Test: dispatch-tick unknown flag → exit 2"
tick_setup
err=$("$TMPDIR_TEST/dispatch-tick" --nope 2>&1 1>/dev/null && echo "EXIT=0" || echo "EXIT=$?")
case "$err" in
  *"unknown flag"*"EXIT=2") status="ok" ;;
  *) status="bad: $err" ;;
esac
assert_eq "unknown flag → usage error, exit 2" "ok" "$status"
tick_teardown

# --- positional arg → usage error, exit 2, select-tick never invoked --------
# Explicit issue/PR targeting was the legacy issue lane's entry point; that lane
# is gone, so dispatch-tick itself rejects any positional arg at Step 0, before
# select-tick (or anything else) ever runs.
echo "Test: dispatch-tick positional arg → exit 2, select-tick never invoked"
tick_setup
export TICK_DECISION="empty"
err=$("$TMPDIR_TEST/dispatch-tick" '#88' 2>&1 1>/dev/null && echo "EXIT=0" || echo "EXIT=$?")
case "$err" in
  *"explicit issue/PR targeting"*"EXIT=2") status="ok" ;;
  *) status="bad: $err" ;;
esac
assert_eq "positional arg → usage error, exit 2" "ok" "$status"
assert_eq "positional arg: select-tick never invoked" "0" \
  "$([ -f "$TMPDIR_TEST/logs/select-tick.log" ] && echo 1 || echo 0)"
tick_teardown

# --- node-id-shaped positional arg is forwarded to select-tick (raw, no flag) -
# tactic-graph-explicit-node-dispatch Unit 2: a node-id-shaped positional is now
# recognized as NODE_ARG and forwarded to dispatch-select-tick as a raw
# positional (not a flag). Here the fake select-tick emits a
# `node-not-selectable <id>` decision line (Unit 2's new disposition), and the
# tick must exit non-zero (1), print a stderr message naming the node, and NOT
# invoke dispatch-graph-execute.
echo "Test: dispatch-tick node-id arg forwarded to select-tick; node-not-selectable → exit 1, no graph-execute"
tick_setup
export TICK_DECISION="node-not-selectable foo-bar"
err=$("$TMPDIR_TEST/dispatch-tick" foo-bar 2>&1 1>/dev/null) && rc=0 || rc=$?
assert_eq "node-arg-fwd: select-tick received the raw node-id (no flag)" "foo-bar" \
  "$(cat "$TMPDIR_TEST/logs/select-tick.log")"
assert_eq "node-not-selectable: exit 1" "1" "$rc"
case "$err" in
  *"foo-bar"*"not selectable"*) status="ok" ;;
  *) status="bad: $err" ;;
esac
assert_eq "node-not-selectable: stderr names the node" "ok" "$status"
assert_eq "node-not-selectable: no graph-execute call" "0" \
  "$([ -f "$TMPDIR_TEST/logs/graph-execute.log" ] && echo 1 || echo 0)"
tick_teardown

# --- headless tick (no CLAUDE_CODE_SESSION_ID) synthesizes a stable id --------
# Regression guard for #1054: since the tick went headless (#1043) a
# systemd-launched tick inherits no CLAUDE_CODE_SESSION_ID, and
# dispatch-acquire-lock hard-requires one (exit 2 if unset). dispatch-tick now
# synthesizes a synthetic, stable id at its entry point, exported so every
# sub-script (select-tick → acquire-lock acquire+release, materialize-spawn)
# sees one consistent holder id. This test drives the REAL dispatch-acquire-lock
# through fakes that invoke it, stubbing its `claude agents --json` registry to
# `[]` (no live foreign holder) via CLAUDE_AGENTS_CMD and pointing its lock file
# under TMPDIR_TEST via DISPATCH_LOCK_FILE.
echo "Test: dispatch-tick headless (no session id) acquires the lock and proceeds"
tick_setup
# Copy the real acquire-lock + lib.sh next to the tick copy so the fakes below
# can invoke it. (lib.sh is already present from tick_setup; copy acquire-lock.)
cp "$SCRIPT_DIR/dispatch-acquire-lock" "$TMPDIR_TEST/dispatch-acquire-lock"
chmod +x "$TMPDIR_TEST/dispatch-acquire-lock"
# Fake `claude` whose `agents --json` returns `[]` deterministically — no live
# foreign holder, so acquire-lock's dead-holder/unheld path claims the lock.
cat > "$TMPDIR_TEST/fake-claude" <<'FAKE'
#!/usr/bin/env bash
printf '[]'
exit 0
FAKE
chmod +x "$TMPDIR_TEST/fake-claude"
# acquire-lock env contract (read from the script): DISPATCH_LOCK_FILE overrides
# the lock path; CLAUDE_AGENTS_CMD overrides the registry command; bare invoke
# prints acquired/busy; --release prints released/noop.
export DISPATCH_LOCK_FILE="$TMPDIR_TEST/dispatch.lock"
export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/fake-claude"
# Replace the select-tick fake: log its inherited session id, then drive the
# REAL acquire-lock (acquire, then --release), logging each outcome string, then
# print the decision line the tick routes on.
cat > "$TMPDIR_TEST/dispatch-select-tick" <<FAKE
#!/usr/bin/env bash
printf '%s' "\${CLAUDE_CODE_SESSION_ID:-}" > "$TMPDIR_TEST/logs/sel-id.log"
"$TMPDIR_TEST/dispatch-acquire-lock" > "$TMPDIR_TEST/logs/acquire.log" 2>/dev/null
"$TMPDIR_TEST/dispatch-acquire-lock" --release > "$TMPDIR_TEST/logs/release.log" 2>/dev/null
printf '%s\n' "graph 1 t1:tactic:implement"
exit 0
FAKE
# Replace the graph-execute fake: log its inherited session id so the id-stability
# assertion can compare it with select-tick's, then exit 0 so the tick routes to
# exit 0.
cat > "$TMPDIR_TEST/dispatch-graph-execute" <<FAKE
#!/usr/bin/env bash
printf '%s' "\${CLAUDE_CODE_SESSION_ID:-}" > "$TMPDIR_TEST/logs/mat-id.log"
exit 0
FAKE
chmod +x "$TMPDIR_TEST/dispatch-select-tick" "$TMPDIR_TEST/dispatch-graph-execute"

# Run the tick with NO inherited session id (as systemd-run --user does).
env -u CLAUDE_CODE_SESSION_ID "$TMPDIR_TEST/dispatch-tick" >/dev/null 2>&1 && rc=0 || rc=$?
assert_eq "headless: tick exit 0 (not the old 2)" "0" "$rc"
assert_eq "headless: acquire outcome is 'acquired'" "acquired" \
  "$(cat "$TMPDIR_TEST/logs/acquire.log")"
assert_eq "headless: release outcome is 'released' (stable id across acquire+release)" \
  "released" "$(cat "$TMPDIR_TEST/logs/release.log")"
sel_id=$(cat "$TMPDIR_TEST/logs/sel-id.log")
mat_id=$(cat "$TMPDIR_TEST/logs/mat-id.log")
assert_eq "headless: synthetic id is stable across select-tick and graph-execute" \
  "$sel_id" "$mat_id"
assert_eq "headless: synthetic id is non-empty" "1" \
  "$([ -n "$sel_id" ] && echo 1 || echo 0)"
assert_eq "headless: synthetic id has headless: prefix (not a bare sentinel)" "1" \
  "$([[ "$sel_id" == headless:* ]] && echo 1 || echo 0)"

# Companion: under systemd the id derives from INVOCATION_ID (the primary
# headless path), not the random-token fallback the run above exercised. Use a
# realistic 32-hex INVOCATION_ID (the form systemd always produces) and assert
# the synthesized id is exactly headless:<INVOCATION_ID>. The validation guard
# must pass hex digits — this exercises that path. (#1068)
rm -f "$TMPDIR_TEST/logs/sel-id.log" "$TMPDIR_TEST/logs/mat-id.log"
env -u CLAUDE_CODE_SESSION_ID INVOCATION_ID="0123456789abcdef0123456789abcdef" \
  "$TMPDIR_TEST/dispatch-tick" >/dev/null 2>&1
assert_eq "headless: id derives from valid hex INVOCATION_ID (systemd path)" \
  "headless:0123456789abcdef0123456789abcdef" "$(cat "$TMPDIR_TEST/logs/sel-id.log")"

# Companion: polluted INVOCATION_ID — the #1068 validation guard drops a
# non-hex value so it cannot truncate the recorded holder (via embedded newline),
# mislead the awk -F'\t' comparison, or corrupt the sentinel path. The fallback
# fires and the id must be single-line headless:<hex-or-pid>.
rm -f "$TMPDIR_TEST/logs/sel-id.log" "$TMPDIR_TEST/logs/mat-id.log"
env -u CLAUDE_CODE_SESSION_ID INVOCATION_ID="a/b" \
  "$TMPDIR_TEST/dispatch-tick" >/dev/null 2>&1
polluted_id=$(cat "$TMPDIR_TEST/logs/sel-id.log")
assert_eq "headless: polluted INVOCATION_ID dropped — id has headless: prefix" "1" \
  "$([[ "$polluted_id" == headless:* ]] && echo 1 || echo 0)"
assert_eq "headless: polluted INVOCATION_ID dropped — id is single-line (no embedded newline)" "1" \
  "$([[ "$polluted_id" != *$'\n'* ]] && echo 1 || echo 0)"
assert_eq "headless: polluted INVOCATION_ID dropped — token is hex (guard rejected the slash)" "1" \
  "$([[ "$polluted_id" =~ ^headless:[0-9a-f]+$ ]] && echo 1 || echo 0)"

# Companion: INVOCATION_ID absent — the random-token fallback fires (openssl
# rand -hex 16 when available; $$ as last resort). Assert the id is headless:-
# prefixed, single-line, and its token matches hex (openssl path). (#1068)
rm -f "$TMPDIR_TEST/logs/sel-id.log" "$TMPDIR_TEST/logs/mat-id.log"
env -u CLAUDE_CODE_SESSION_ID -u INVOCATION_ID \
  "$TMPDIR_TEST/dispatch-tick" >/dev/null 2>&1
absent_id=$(cat "$TMPDIR_TEST/logs/sel-id.log")
assert_eq "headless: absent INVOCATION_ID — id has headless: prefix" "1" \
  "$([[ "$absent_id" == headless:* ]] && echo 1 || echo 0)"
assert_eq "headless: absent INVOCATION_ID — id is non-empty" "1" \
  "$([ -n "$absent_id" ] && echo 1 || echo 0)"
assert_eq "headless: absent INVOCATION_ID — id is single-line" "1" \
  "$([[ "$absent_id" != *$'\n'* ]] && echo 1 || echo 0)"
assert_eq "headless: absent INVOCATION_ID — token is hex (random-token or PID fallback)" "1" \
  "$([[ "$absent_id" =~ ^headless:[0-9a-f]+$ ]] && echo 1 || echo 0)"

# Companion: a real session keeps its own id — the `:-` fallback never fires.
# Fresh id logs so this run does not cross-contaminate the headless run above.
rm -f "$TMPDIR_TEST/logs/sel-id.log" "$TMPDIR_TEST/logs/mat-id.log"
export CLAUDE_CODE_SESSION_ID="sess-real-1054"
"$TMPDIR_TEST/dispatch-tick" >/dev/null 2>&1
assert_eq "real session: select-tick sees the inherited id, not a synthetic one" \
  "sess-real-1054" "$(cat "$TMPDIR_TEST/logs/sel-id.log")"
unset CLAUDE_CODE_SESSION_ID DISPATCH_LOCK_FILE CLAUDE_AGENTS_CMD
tick_teardown

# --- headless tick writes a PID sentinel during the run, trap removes it after -
# #1068: a synthetic headless holder is invisible to `claude agents --json`, so
# the tick writes a PID sentinel alongside the shared lock file for its lifetime
# and an EXIT trap removes it. resolve_holder_state resolves the headless
# holder's liveness from that sentinel. This test observes the sentinel directly
# (no acquire-lock needed): the fake select-tick globs the lock dir mid-run and
# records the matched sentinel's existence + content, then after the tick returns
# we assert (1) a sentinel existed mid-run, (2) it held a numeric PID, (3) the
# trap left no dispatch-tick-*.live behind. The token is the tick's $$ (no
# INVOCATION_ID, no inherited id), unknowable in advance — hence the glob.
echo "Test: dispatch-tick headless writes a PID sentinel mid-run and removes it on exit"
tick_setup
LOCK_DIR="$(dirname "$DISPATCH_LOCK_FILE")"
# Replace the select-tick fake: glob the lock dir for the sentinel mid-run and
# log its presence (1/0) and contents, then print a decision line so the tick
# routes to a normal exit. mkdir -p the lock dir defensively (the tick already
# created it before writing the sentinel).
cat > "$TMPDIR_TEST/dispatch-select-tick" <<FAKE
#!/usr/bin/env bash
shopt -s nullglob
matches=( "$LOCK_DIR"/dispatch-tick-*.live )
if (( \${#matches[@]} > 0 )); then
  printf '1\n' > "$TMPDIR_TEST/logs/sentinel-midrun.log"
  cat "\${matches[0]}" >> "$TMPDIR_TEST/logs/sentinel-midrun.log"
else
  printf '0\n' > "$TMPDIR_TEST/logs/sentinel-midrun.log"
fi
printf '%s\n' "empty"
exit 0
FAKE
chmod +x "$TMPDIR_TEST/dispatch-select-tick"
# Run headless with NO inherited id and NO INVOCATION_ID → token is the tick $$.
env -u CLAUDE_CODE_SESSION_ID -u INVOCATION_ID \
  "$TMPDIR_TEST/dispatch-tick" >/dev/null 2>&1 && rc=0 || rc=$?
assert_eq "sentinel: tick exit 0" "0" "$rc"
midrun_present=$(sed -n '1p' "$TMPDIR_TEST/logs/sentinel-midrun.log" 2>/dev/null)
midrun_pid=$(sed -n '2p' "$TMPDIR_TEST/logs/sentinel-midrun.log" 2>/dev/null)
assert_eq "sentinel: existed mid-run" "1" "$midrun_present"
assert_eq "sentinel: mid-run content is a numeric PID" "1" \
  "$([[ "$midrun_pid" =~ ^[0-9]+$ ]] && echo 1 || echo 0)"
# The EXIT trap must have removed every sentinel from the lock dir.
shopt -s nullglob
leftover=( "$LOCK_DIR"/dispatch-tick-*.live )
shopt -u nullglob
assert_eq "sentinel: removed by the EXIT trap (no .live left behind)" "0" \
  "${#leftover[@]}"
tick_teardown

# --- headless tick fails clear when the sentinel write fails (#1068) ----------
# When the lock-file path resolves but the sentinel write fails (here forced via
# an over-long-but-hex INVOCATION_ID → a >255-byte sentinel filename →
# ENAMETOOLONG, while the short dispatch.lock stays writable), dispatch-tick must
# exit 2 *before* selecting a target rather than warn-and-continue. Continuing
# would acquire the lock with no liveness sentinel, so a concurrent tick reads
# this LIVE holder as dead and reclaims mid-selection — the exact duplicate-spawn
# defect #1068 closes. The select-tick fake drops a marker if it runs; the test
# asserts the tick exited non-zero and never reached selection.
echo "Test: dispatch-tick headless fails clear (exit 2, no selection) when the sentinel write fails"
tick_setup
LOCK_DIR="$(dirname "$DISPATCH_LOCK_FILE")"
cat > "$TMPDIR_TEST/dispatch-select-tick" <<FAKE
#!/usr/bin/env bash
printf 'ran\n' > "$TMPDIR_TEST/logs/select-ran.log"
printf '%s\n' "empty"
exit 0
FAKE
chmod +x "$TMPDIR_TEST/dispatch-select-tick"
rm -f "$TMPDIR_TEST/logs/select-ran.log"
# 250 hex chars: passes the INVOCATION_ID guard, yields a sentinel filename
# (dispatch-tick-<250>.live = 269 bytes) that exceeds NAME_MAX (255) → write fails.
long_inv=$(printf 'a%.0s' {1..250})
env -u CLAUDE_CODE_SESSION_ID INVOCATION_ID="$long_inv" \
  "$TMPDIR_TEST/dispatch-tick" >/dev/null 2>&1 && rc=0 || rc=$?
assert_eq "sentinel-write-fail: tick exits 2 (fail clear)" "2" "$rc"
assert_eq "sentinel-write-fail: selection never ran (aborted before select-tick)" "0" \
  "$([ -f "$TMPDIR_TEST/logs/select-ran.log" ] && echo 1 || echo 0)"
shopt -s nullglob
leftover=( "$LOCK_DIR"/dispatch-tick-*.live )
shopt -u nullglob
assert_eq "sentinel-write-fail: no stale .live left behind (trap cleaned partial)" "0" \
  "${#leftover[@]}"
tick_teardown

# --- --manual is forwarded to select-tick; the graph decision is executed -----
# A bare human-typed /dispatch passes --manual to dispatch-tick, which must
# forward it to dispatch-select-tick. The fake select-tick records its argv and
# emits whatever TICK_DECISION says; here it emits a `graph` decision so the tick
# drives dispatch-graph-execute (the only queue execute path now).
echo "Test: dispatch-tick --manual forwards --manual to select-tick"
tick_setup
export TICK_DECISION="graph 1 t1:tactic:implement"
out=$(run_tick --manual) && rc=0 || rc=$?
assert_eq "manual-fwd: select-tick received --manual flag" "--manual" \
  "$(cat "$TMPDIR_TEST/logs/select-tick.log")"
assert_eq "manual-fwd: graph-execute called with the node spec" "t1:tactic:implement" \
  "$(cat "$TMPDIR_TEST/logs/graph-execute.log")"
assert_eq "manual-fwd: exit 0" "0" "$rc"
tick_teardown

# --- --manual + an explicit number → exit 2 (positional rejected outright) --
echo "Test: dispatch-tick --manual + explicit number → exit 2"
tick_setup
err=$("$TMPDIR_TEST/dispatch-tick" --manual 707 2>&1 1>/dev/null && echo "EXIT=0" || echo "EXIT=$?")
case "$err" in
  *"explicit issue/PR targeting"*"EXIT=2") status="ok" ;;
  *) status="bad: $err" ;;
esac
assert_eq "--manual + number → usage error, exit 2" "ok" "$status"
tick_teardown

# --- autonomous no-arg tick never emits concurrency-cap from dispatch-tick itself ---
# The concurrency-cap decision is emitted by dispatch-select-tick on the autonomous
# path; dispatch-tick routes it as a log-and-exit-0 disposition (no graph-execute).
# This validates the autonomous routing is unchanged.
echo "Test: dispatch-tick routes autonomous concurrency-cap → exit 0, no graph-execute"
tick_setup
export TICK_DECISION="concurrency-cap"
out=$(run_tick) && rc=0 || rc=$?
assert_eq "auto-cap: exit 0" "0" "$rc"
assert_eq "auto-cap: no graph-execute call" "0" \
  "$([ -f "$TMPDIR_TEST/logs/graph-execute.log" ] && echo 1 || echo 0)"
assert_eq "auto-cap: no manual flag sent to select-tick" "0" \
  "$(grep -cF -- '--manual' "$TMPDIR_TEST/logs/select-tick.log" 2>/dev/null)"
# #2022 AC5: a no-op heartbeat tick (autonomous concurrency-cap) must never
# call dispatch-spawn-job — that would launch a worker session and consume
# model tokens. The tick_setup fake logs spawn-job invocations to spawn-job.log;
# its absence proves no worker was spawned.
assert_eq "auto-cap: no spawn-job call (#2022 AC5 heartbeat no-op)" "0" \
  "$([ -f "$TMPDIR_TEST/logs/spawn-job.log" ] && echo 1 || echo 0)"
tick_teardown

# --- #1127: refresh runs before select (budget read sees fresh telemetry) ----
echo "Test: dispatch-tick refreshes telemetry before selecting (ordering)"
tick_setup
export TICK_DECISION="empty"
out=$(run_tick) && rc=0 || rc=$?
assert_eq "refresh-ordering: exit 0" "0" "$rc"
assert_eq "refresh-ordering: refresh runs before select" \
  "$(printf 'refresh\nselect')" "$(cat "$TMPDIR_TEST/logs/order.log")"
tick_teardown

# --- #1127: probe failure is fail-safe — tick still routes its decision ------
echo "Test: dispatch-tick refresh-probe failure does not break the tick"
tick_setup
export TICK_DECISION="empty" TICK_REFRESH_RC=1
out=$(run_tick) && rc=0 || rc=$?
assert_eq "refresh-failsafe: exit 0 despite probe failure" "0" "$rc"
assert_eq "refresh-failsafe: tick still ran select after failed refresh" \
  "$(printf 'refresh\nselect')" "$(cat "$TMPDIR_TEST/logs/order.log")"
tick_teardown

# --- tactic-denied-command-parks-node: normal-path frozen-session sweep --------
# On the normal (non-paused) path the sweep must run AFTER the per-tick agents
# snapshot capture and BEFORE Step 1's dispatch-select-tick invocation, so that a
# node it parks this tick is excluded from this tick's own selection. Assert the
# ordering directly: the fake park-node and the fake select-tick both append to
# the shared order.log, so "park" must precede "select".
echo "Test: dispatch-tick normal path — frozen-session sweep runs before select-tick (ordering)"
tick_setup
export TICK_DECISION="empty"
tick_frozen_add_blocked_candidate "0bb2-2222" "tactic-frozen-normal"
out=$(run_tick) && rc=0 || rc=$?
assert_eq "normal-frozen-ordering: exit 0" "0" "$rc"
assert_eq "normal-frozen-ordering: park-node invoked exactly once" "1" \
  "$(grep -cF "tactic-frozen-normal" "$TMPDIR_TEST/logs/park-node.log" 2>/dev/null || echo 0)"
assert_eq "normal-frozen-ordering: park precedes select in order.log" \
  "$(printf 'refresh\npark\nselect')" "$(cat "$TMPDIR_TEST/logs/order.log")"
tick_teardown

# --- tactic-denied-command-parks-node: lib-frozen-session-park.sh missing ------
# A missing/failed-to-load sweep library must never gate the tick: the loud
# "failed to load" line is printed and the tick still completes its normal
# routing (select-tick still runs, its decision is still routed).
echo "Test: dispatch-tick normal path — lib-frozen-session-park.sh absent → loud failure line, tick still completes"
tick_setup
rm -f "$TMPDIR_TEST/lib-frozen-session-park.sh"
export TICK_DECISION="empty"
err=$(run_tick_stderr) && rc=0 || rc=$?
assert_eq "lib-absent: exit 0 (empty routes to 0)" "0" "$rc"
assert_eq "lib-absent: loud failure line printed" "1" \
  "$(printf '%s' "$err" | grep -cF 'dispatch-tick: lib-frozen-session-park.sh failed to load; frozen-session sweep NOT run this tick')"
assert_eq "lib-absent: select-tick still ran (tick was not aborted)" "1" \
  "$([ -f "$TMPDIR_TEST/logs/select-tick.log" ] && echo 1 || echo 0)"
tick_teardown

# <<< END MOVED <<<

report_results
