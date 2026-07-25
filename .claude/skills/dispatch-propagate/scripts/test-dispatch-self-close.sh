#!/usr/bin/env bash
# Tests for dispatch-self-close -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 15637-15908.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-self-close tests
# ============================================================================
echo "=== dispatch-self-close ==="
#
# dispatch-self-close runs `claude rm <job-id>` against the basename of
# $CLAUDE_JOB_DIR. The fake `claude` records its argv in SPAWN_RM_LOG (see
# write_fake_spawn_claude). When CLAUDE_JOB_DIR is unset, the script is a no-op
# — the foreground-safe gate that protects an interactive /dispatch-propagate from
# deleting the user's live conversation.

selfclose_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts"
  cp "$SCRIPT_DIR/dispatch-self-close" "$TMPDIR_TEST/scripts/dispatch-self-close"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-self-close"
  # The router-only continuation invariant (#1010) sources lib-claude-agents.sh
  # from its own dir for claude_agents_count_busy_workers, so the helper must sit
  # alongside the copied script. Sourced, not executed — no chmod.
  cp "$SCRIPT_DIR/lib-claude-agents.sh" "$TMPDIR_TEST/scripts/lib-claude-agents.sh"

  # Reuse the dispatch-spawn-router fake `claude` writer: it already dispatches on
  # `rm` and appends $2 to SPAWN_ROUTER_RM_LOG. The unused SPAWN_ROUTER_REGISTRY /
  # SPAWN_ROUTER_BG_ARGV / SPAWN_ROUTER_STOP_LOG paths still need to be set because
  # the writer interpolates them into the fake-claude script body.
  SPAWN_ROUTER_REGISTRY="$TMPDIR_TEST/registry.json"
  SPAWN_ROUTER_BG_ARGV="$TMPDIR_TEST/bg-argv"
  SPAWN_ROUTER_RM_LOG="$TMPDIR_TEST/rm-log"
  SPAWN_ROUTER_STOP_LOG="$TMPDIR_TEST/stop-log"
  printf '[]' > "$SPAWN_ROUTER_REGISTRY"
  write_fake_spawn_router_claude

  export DISPATCH_SELF_CLOSE_CLAUDE_CMD="$TMPDIR_TEST/fake-claude"

  # Continuation-check fakes (#1010), all defaulting to "no continuation":
  #   - The daemon query (claude_agents_count_busy_workers, via CLAUDE_AGENTS_CMD)
  #     defaults to a successful query reporting zero busy workers.
  #   - The systemctl probe (DISPATCH_SELF_CLOSE_SYSTEMCTL_CMD) defaults to
  #     emitting no reseed timer.
  # Helpers below let a test flip either to a continuation-present state.
  export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/fake-agents"
  export DISPATCH_SELF_CLOSE_SYSTEMCTL_CMD="$TMPDIR_TEST/fake-systemctl"
  selfclose_set_workers   # default: no workers
  selfclose_set_no_timer  # default: no reseed timer
}

# selfclose_write_state <name> — write a state.json with the given .name into the
# fake CLAUDE_JOB_DIR (exported by the caller as CLAUDE_JOB_DIR).
selfclose_write_state() {
  local name="$1"
  printf '{"name":"%s"}\n' "$name" > "$CLAUDE_JOB_DIR/state.json"
}

# selfclose_set_workers [session-spec...] — install the fake `claude agents`
# command. Each spec is `name:status`. With zero specs it emits an empty array.
# Always exits 0 (a successfully-queried daemon).
selfclose_set_workers() {
  local payload="["
  local first=1 spec name status
  for spec in "$@"; do
    name="${spec%%:*}"
    status="${spec#*:}"
    [[ $first -eq 1 ]] || payload+=","
    first=0
    payload+="{\"sessionId\":\"s-$name\",\"pid\":1,\"status\":\"$status\",\"name\":\"$name\",\"cwd\":\"\"}"
  done
  payload+="]"
  cat > "$TMPDIR_TEST/fake-agents" <<FAKE
#!/usr/bin/env bash
# Fake \`claude\`: only the \`agents --json\` query is exercised here.
if [[ "\${1:-}" == "agents" ]]; then
  printf '%s\n' '$payload'
  exit 0
fi
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/fake-agents"
}

# selfclose_set_timer — fake systemctl emits an armed (waiting) reseed timer line.
selfclose_set_timer() {
  cat > "$TMPDIR_TEST/fake-systemctl" <<'FAKE'
#!/usr/bin/env bash
printf '%s\n' 'dispatch-reseed.timer loaded active waiting Dispatch reseed timer'
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/fake-systemctl"
}

# selfclose_set_no_timer — fake systemctl emits nothing (no reseed timer).
selfclose_set_no_timer() {
  cat > "$TMPDIR_TEST/fake-systemctl" <<'FAKE'
#!/usr/bin/env bash
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/fake-systemctl"
}

selfclose_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  SPAWN_ROUTER_REGISTRY=""
  SPAWN_ROUTER_BG_ARGV=""
  SPAWN_ROUTER_RM_LOG=""
  SPAWN_ROUTER_STOP_LOG=""
  unset DISPATCH_SELF_CLOSE_CLAUDE_CMD CLAUDE_JOB_DIR \
    CLAUDE_AGENTS_CMD DISPATCH_SELF_CLOSE_SYSTEMCTL_CMD
}

# --- Test 1: managed-job → deletes itself -------------------------------------

echo "Test: a managed background job deletes itself by job-id (basename of CLAUDE_JOB_DIR)"
selfclose_setup
mkdir -p "$TMPDIR_TEST/jobs/abcd1234"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
if out=$("$TMPDIR_TEST/scripts/dispatch-self-close" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "self-close: dispatch-self-close exits 0" "0" "$rc"
rm_log=$(cat "$SPAWN_ROUTER_RM_LOG" 2>/dev/null || true)
assert_eq "self-close: 'claude rm abcd1234' was invoked (basename, not full path)" \
  "abcd1234" "$rm_log"
selfclose_teardown

# --- Test 2: interactive → no-op ---------------------------------------------

echo "Test: an interactive session (CLAUDE_JOB_DIR unset) is a no-op with a diagnostic"
selfclose_setup
unset CLAUDE_JOB_DIR
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-self-close" 2>&1 1>/dev/null) || rc=$?
assert_eq "interactive: dispatch-self-close exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"not a managed background job"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: interactive: stderr reports 'not a managed background job'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: interactive: stderr reports 'not a managed background job'"
  echo "    stderr: $err"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -e "$SPAWN_ROUTER_RM_LOG" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: interactive: no 'claude rm' invocation recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: interactive: no 'claude rm' invocation recorded"
  echo "    rm-log: $(cat "$SPAWN_ROUTER_RM_LOG")"
fi
selfclose_teardown

# --- Test 3: router + no continuation → PARK (#1010) --------------------------

echo "Test: router with no continuation (no busy worker, no reseed timer) parks"
selfclose_setup
mkdir -p "$TMPDIR_TEST/jobs/abcd1234"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
selfclose_write_state "dispatch-abcd1234"
selfclose_set_workers   # no workers
selfclose_set_no_timer
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-self-close" 2>"$TMPDIR_TEST/park-err") || rc=$?
err=$(cat "$TMPDIR_TEST/park-err")
assert_eq "park: router no-continuation exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$SPAWN_ROUTER_RM_LOG" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: park: no 'claude rm' invocation recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: park: no 'claude rm' invocation recorded"
  echo "    rm-log: $(cat "$SPAWN_ROUTER_RM_LOG")"
fi
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"parking — no continuation"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: park: parking reason on stderr"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: park: parking reason on stderr"
  echo "    stderr: $err"
fi
selfclose_teardown

# --- Test 4: router + live busy worker → SELF-CLOSE (#1010) -------------------

echo "Test: router with a live busy ^[0-9]+- worker self-closes"
selfclose_setup
mkdir -p "$TMPDIR_TEST/jobs/abcd1234"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
selfclose_write_state "dispatch-abcd1234"
selfclose_set_workers "824-foo:busy"
selfclose_set_no_timer
rc=0
"$TMPDIR_TEST/scripts/dispatch-self-close" >/dev/null 2>&1 || rc=$?
assert_eq "busy-worker: router self-close exits 0" "0" "$rc"
rm_log=$(cat "$SPAWN_ROUTER_RM_LOG" 2>/dev/null || true)
assert_eq "busy-worker: 'claude rm abcd1234' was invoked" "abcd1234" "$rm_log"
selfclose_teardown

# --- Test 5: router + pending reseed timer → SELF-CLOSE (#1010) ---------------

echo "Test: router with a pending dispatch-reseed timer self-closes"
selfclose_setup
mkdir -p "$TMPDIR_TEST/jobs/abcd1234"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
selfclose_write_state "dispatch-abcd1234"
selfclose_set_workers   # no workers
selfclose_set_timer     # armed reseed timer
rc=0
"$TMPDIR_TEST/scripts/dispatch-self-close" >/dev/null 2>&1 || rc=$?
assert_eq "reseed-timer: router self-close exits 0" "0" "$rc"
rm_log=$(cat "$SPAWN_ROUTER_RM_LOG" 2>/dev/null || true)
assert_eq "reseed-timer: 'claude rm abcd1234' was invoked" "abcd1234" "$rm_log"
selfclose_teardown

# --- Test 6: router + only a non-busy worker → PARK (#1010) -------------------

echo "Test: router whose only worker is non-busy (waiting) parks"
selfclose_setup
mkdir -p "$TMPDIR_TEST/jobs/abcd1234"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
selfclose_write_state "dispatch-abcd1234"
selfclose_set_workers "824-foo:waiting"   # idle/waiting → not busy
selfclose_set_no_timer
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-self-close" 2>"$TMPDIR_TEST/park-err") || rc=$?
err=$(cat "$TMPDIR_TEST/park-err")
assert_eq "non-busy-worker: router parks, exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$SPAWN_ROUTER_RM_LOG" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-busy-worker: no 'claude rm' invocation recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-busy-worker: no 'claude rm' invocation recorded"
  echo "    rm-log: $(cat "$SPAWN_ROUTER_RM_LOG")"
fi
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"parking — no continuation"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-busy-worker: parking reason on stderr"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-busy-worker: parking reason on stderr"
  echo "    stderr: $err"
fi
selfclose_teardown

# --- Test 7: worker-named session → invariant skipped, SELF-CLOSE (#1010) -----

echo "Test: worker-named session (123-foo) self-closes (invariant skipped)"
selfclose_setup
mkdir -p "$TMPDIR_TEST/jobs/abcd1234"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
selfclose_write_state "123-foo"
selfclose_set_workers   # no continuation at all
selfclose_set_no_timer
rc=0
"$TMPDIR_TEST/scripts/dispatch-self-close" >/dev/null 2>&1 || rc=$?
assert_eq "worker-named: self-close exits 0" "0" "$rc"
rm_log=$(cat "$SPAWN_ROUTER_RM_LOG" 2>/dev/null || true)
assert_eq "worker-named: 'claude rm abcd1234' was invoked (invariant skipped)" \
  "abcd1234" "$rm_log"
selfclose_teardown

# --- Test 8: router + UNKNOWN daemon + no reseed timer → SELF-CLOSE (#1010) ---

echo "Test: router with UNKNOWN daemon (unqueryable) and no reseed timer self-closes (fail-safe)"
selfclose_setup
mkdir -p "$TMPDIR_TEST/jobs/abcd1234"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
selfclose_write_state "dispatch-abcd1234"
# Model UNKNOWN: point CLAUDE_AGENTS_CMD at a non-existent binary so
# claude_agents_count_busy_workers returns non-zero (daemon unqueryable).
export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/no-such-claude"
selfclose_set_no_timer
rc=0
"$TMPDIR_TEST/scripts/dispatch-self-close" >/dev/null 2>&1 || rc=$?
assert_eq "unknown-daemon: router self-close exits 0" "0" "$rc"
rm_log=$(cat "$SPAWN_ROUTER_RM_LOG" 2>/dev/null || true)
assert_eq "unknown-daemon: 'claude rm abcd1234' was invoked (fail-safe toward self-close)" \
  "abcd1234" "$rm_log"
selfclose_teardown

# <<< END MOVED <<<

report_results
