#!/usr/bin/env bash
# Tests for dispatch-spawn-job -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 14978-15636.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# spawn fake-claude harness (shared)
# ============================================================================
echo "=== spawn fake-claude harness (shared) ==="
#
# This section defines only the shared fake-`claude` harness reused by the
# dispatch-spawn-job test section that follows:
# the write_fake_spawn_worker_claude / spawn_worker_setup / spawn_worker_teardown
# helpers and the SPAWN_WORKER_* fixture globals. (The dedicated
# dispatch-spawn-worker tests were removed with that script in #1392; the
# helper names retain their historical "spawn_worker" prefix.)
#
# The fake `claude` is a multi-subcommand temp script the script-under-test
# points at by absolute path, so no real daemon is needed. The same fake also
# backs the sourced lib-claude-agents.sh helper (via CLAUDE_AGENTS_CMD).
#
# Each test that calls spawn_worker_setup gets a fresh tmp tree:
#   $TMPDIR_TEST/scripts/dispatch-spawn-job     the generalized spawn primitive
#   $TMPDIR_TEST/scripts/lib-claude-agents.sh   sourced helper (not chmod'd)
#   $TMPDIR_TEST/worktrees/main/                backdrop cwd
#   $TMPDIR_TEST/worktrees/839-test-worker/     the target worktree path
#   $TMPDIR_TEST/fake-claude                    the multi-subcommand fake `claude`
#   $TMPDIR_TEST/registry.json                  `claude agents --json` fixture
#   $TMPDIR_TEST/bg-argv                        recorded argv of each `claude --bg` call
#   $TMPDIR_TEST/pwd-log                        records the spawn subshell's $PWD

SPAWN_WORKER_REGISTRY=""
SPAWN_WORKER_BG_ARGV=""
SPAWN_WORKER_PWD_LOG=""
SPAWN_WORKER_PENDING=""
SPAWN_WORKER_SUBAGENT_MODEL=""
WORKER_TARGET_WORKTREE=""

# write_fake_spawn_worker_claude — install the multi-subcommand fake `claude`.
# Dispatches on $1:
#   agents   — print the registry fixture verbatim. The fake ignores --cwd:
#              claude_sessions_under does no client-side path filtering — it
#              trusts server-side `--cwd` filtering — so every fixture session
#              is returned. Fine here: each fixture holds only sessions a test
#              means dispatch-spawn-job to see. If SPAWN_BG_REGISTER_AFTER_N
#              mode left a pending sidecar, decrement its countdown; when it
#              reaches zero, merge the pending agent into the registry and
#              delete the sidecar.
#   --bg     — record full argv to bg-argv AND record $PWD to pwd-log. Then:
#                - SPAWN_BG_REGISTER_AFTER_N=<n> set → write pending sidecar
#                  (name + countdown=n) so the agent first appears on the
#                  n-th subsequent `agents` call. Models the daemon's async-
#                  registration race that verify_agent_registered_under closes.
#                - else SPAWN_BG_REGISTERS=1 (default) → parse --name and
#                  jq-append the new agent to the fixture so the verify step
#                  finds it on the first attempt.
#                - else (SPAWN_BG_REGISTERS=0) → never register.
write_fake_spawn_worker_claude() {
  cat > "$TMPDIR_TEST/fake-claude" <<FAKE
#!/usr/bin/env bash
set -uo pipefail
case "\${1:-}" in
  agents)
    if [[ -f "$SPAWN_WORKER_PENDING" ]]; then
      pending_name=\$(sed -n '1p' "$SPAWN_WORKER_PENDING")
      pending_count=\$(sed -n '2p' "$SPAWN_WORKER_PENDING")
      pending_count=\$((pending_count - 1))
      if [[ "\$pending_count" -le 0 ]]; then
        tmp=\$(mktemp)
        jq --arg name "\$pending_name" \
          '. + [{"sessionId":("sess-"+\$name),"pid":9999,"cwd":"/worker","kind":"background","status":"busy","name":\$name}]' \
          "$SPAWN_WORKER_REGISTRY" > "\$tmp" && mv "\$tmp" "$SPAWN_WORKER_REGISTRY"
        rm -f "$SPAWN_WORKER_PENDING"
      else
        printf '%s\n%s\n' "\$pending_name" "\$pending_count" > "$SPAWN_WORKER_PENDING"
      fi
    fi
    cat "$SPAWN_WORKER_REGISTRY"
    ;;
  --bg)
    pwd >> "$SPAWN_WORKER_PWD_LOG"
    printf '%s\n' "\$@" > "$SPAWN_WORKER_BG_ARGV"
    printf '%s\n' "\${CLAUDE_CODE_SUBAGENT_MODEL:-<unset>}" > "$SPAWN_WORKER_SUBAGENT_MODEL"
    name=""
    while [[ \$# -gt 0 ]]; do
      if [[ "\$1" == "--name" ]]; then name="\${2:-}"; shift 2; continue; fi
      shift
    done
    if [[ -n "\${SPAWN_BG_REGISTER_AFTER_N:-}" ]]; then
      printf '%s\n%s\n' "\$name" "\$SPAWN_BG_REGISTER_AFTER_N" > "$SPAWN_WORKER_PENDING"
    elif [[ "\${SPAWN_BG_REGISTERS:-1}" == "1" ]]; then
      tmp=\$(mktemp)
      jq --arg name "\$name" \
        '. + [{"sessionId":("sess-"+\$name),"pid":9999,"cwd":"/worker","kind":"background","status":"busy","name":\$name}]' \
        "$SPAWN_WORKER_REGISTRY" > "\$tmp" && mv "\$tmp" "$SPAWN_WORKER_REGISTRY"
    fi
    ;;
esac
FAKE
  chmod +x "$TMPDIR_TEST/fake-claude"
}

spawn_worker_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" \
    "$TMPDIR_TEST/worktrees/main" \
    "$TMPDIR_TEST/worktrees/839-test-worker" \
    "$TMPDIR_TEST/config"

  # dispatch-spawn-job (the generalized spawn primitive) sources
  # lib-claude-agents.sh from its own directory, so both must sit alongside the
  # copy. lib-claude-agents.sh is sourced, not executed — no chmod;
  # dispatch-spawn-job is run, so it is chmod'd.
  # dispatch-spawn-job's force-opus gate calls dispatch-config-load, which in
  # turn sources lib.sh — both must sit alongside the copy. dispatch-config-load
  # is run, so it is chmod'd; lib.sh is sourced, no chmod.
  cp "$SCRIPT_DIR/dispatch-spawn-job" "$TMPDIR_TEST/scripts/dispatch-spawn-job"
  cp "$SCRIPT_DIR/lib-claude-agents.sh" "$TMPDIR_TEST/scripts/lib-claude-agents.sh"
  cp "$SCRIPT_DIR/dispatch-config-load" "$TMPDIR_TEST/scripts/dispatch-config-load"
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/lib.sh"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-spawn-job"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-config-load"

  SPAWN_WORKER_REGISTRY="$TMPDIR_TEST/registry.json"
  SPAWN_WORKER_BG_ARGV="$TMPDIR_TEST/bg-argv"
  SPAWN_WORKER_PWD_LOG="$TMPDIR_TEST/pwd-log"
  SPAWN_WORKER_PENDING="$TMPDIR_TEST/pending"
  SPAWN_WORKER_SUBAGENT_MODEL="$TMPDIR_TEST/subagent-model"
  WORKER_TARGET_WORKTREE="$TMPDIR_TEST/worktrees/839-test-worker"
  printf '[]' > "$SPAWN_WORKER_REGISTRY"

  # Point dispatch-config-load at the test's config dir so force-opus.json is
  # under test control (absent config dir → no-config → gate off by default).
  export DISPATCH_CONFIG_DIR="$TMPDIR_TEST/config"

  # lib-claude-agents only trusts an exactly-`[]` registry payload when a
  # `claude daemon` process corroborates it (CLAUDE_AGENTS_PGREP_CMD probe).
  # The spawn fakes below emit `[]` for the pre-spawn dedup check, so without
  # this stub that read would be UNKNOWN — occupied — on any host with no daemon
  # running, and every spawn case would dedupe instead of spawning. Exit 0 =
  # daemon visible, preserving the fakes' intended "registry is empty" meaning.
  printf '#!/usr/bin/env bash\nexit 0\n' > "$TMPDIR_TEST/fake-pgrep"
  chmod +x "$TMPDIR_TEST/fake-pgrep"
  export CLAUDE_AGENTS_PGREP_CMD="$TMPDIR_TEST/fake-pgrep"
}

spawn_worker_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  SPAWN_WORKER_REGISTRY=""
  SPAWN_WORKER_BG_ARGV=""
  SPAWN_WORKER_PWD_LOG=""
  SPAWN_WORKER_PENDING=""
  SPAWN_WORKER_SUBAGENT_MODEL=""
  WORKER_TARGET_WORKTREE=""
  unset DISPATCH_SPAWN_JOB_CLAUDE_CMD DISPATCH_SPAWN_JOB_SESSION_ID \
    SPAWN_BG_REGISTERS SPAWN_BG_REGISTER_AFTER_N \
    LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S CLAUDE_AGENTS_PGREP_CMD \
    DISPATCH_CONFIG_DIR CLAUDE_CODE_SUBAGENT_MODEL
}

# ============================================================================
# dispatch-spawn-job tests
# ============================================================================
echo "=== dispatch-spawn-job ==="
#
# dispatch-spawn-job is the generalized `claude --bg` spawn primitive that
# dispatch-launch-worker delegates to. It is exercised directly here against a
# fake `claude`, reusing the same fake-claude harness shape as the spawn-worker
# tests (a multi-subcommand temp script DISPATCH_SPAWN_JOB_CLAUDE_CMD points at,
# which also backs the sourced lib-claude-agents.sh via CLAUDE_AGENTS_CMD).
#
# Each test gets a fresh tmp tree (reusing spawn_worker_setup, which already
# stages dispatch-spawn-job + lib-claude-agents.sh into $TMPDIR_TEST/scripts):
#   $TMPDIR_TEST/scripts/dispatch-spawn-job   copy of the script under test
#   $TMPDIR_TEST/scripts/lib-claude-agents.sh sourced helper
#   $TMPDIR_TEST/worktrees/839-test-worker/   a usable cwd for --cwd
#   $TMPDIR_TEST/fake-claude                  the multi-subcommand fake `claude`
#   $TMPDIR_TEST/registry.json                `claude agents --json` fixture
#   $TMPDIR_TEST/bg-argv                      recorded argv of each --bg call
#   $TMPDIR_TEST/pwd-log                      recorded spawn-subshell $PWD

# --- Test 1: spawn success (diagnose-main) -----------------------------------

echo "Test: dispatch-spawn-job spawns a /dispatch-diagnose-main background job"
spawn_worker_setup
write_fake_spawn_worker_claude
# Point the job's own env override at the fake (the wrapper's env translation
# is not in play here — the job is invoked directly).
export DISPATCH_SPAWN_JOB_CLAUDE_CMD="$TMPDIR_TEST/fake-claude"
export DISPATCH_SPAWN_JOB_SESSION_ID="sess-self"
SPAWN_JOB_CWD="$TMPDIR_TEST/worktrees/839-test-worker"
SPAWN_CALLER_CWD="$TMPDIR_TEST/worktrees/main"
if out=$( cd "$SPAWN_CALLER_CWD" && "$TMPDIR_TEST/scripts/dispatch-spawn-job" \
    --name diagnose-main --cwd "$SPAWN_JOB_CWD" "/dispatch-diagnose-main abc123" 2>/dev/null ); then rc=0; else rc=$?; fi
assert_eq "spawn-job: dispatch-spawn-job exits 0" "0" "$rc"
assert_eq "spawn-job: stdout is 'spawned'" "spawned" "$out"
mapfile -t sj_bg_argv < "$SPAWN_WORKER_BG_ARGV"
assert_eq "spawn-job: argv[0] is --bg" "--bg" "${sj_bg_argv[0]:-}"
assert_eq "spawn-job: argv[1] is --name" "--name" "${sj_bg_argv[1]:-}"
assert_eq "spawn-job: argv[2] is the passed name" "diagnose-main" "${sj_bg_argv[2]:-}"
assert_eq "spawn-job: argv[3] is --permission-mode" "--permission-mode" "${sj_bg_argv[3]:-}"
assert_eq "spawn-job: argv[4] is auto" "auto" "${sj_bg_argv[4]:-}"
assert_eq "spawn-job: argv[5] is the prompt" "/dispatch-diagnose-main abc123" "${sj_bg_argv[5]:-}"
# The spawn subshell `cd`d into the passed --cwd, not the caller's cwd.
sj_pwd_line=$(head -1 "$SPAWN_WORKER_PWD_LOG" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$(realpath "$sj_pwd_line" 2>/dev/null)" == "$(realpath "$SPAWN_JOB_CWD")" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: spawn-job: 'claude --bg' ran with cwd = the passed --cwd"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: spawn-job: 'claude --bg' ran with cwd = the passed --cwd"
  echo "    pwd-log:  '$sj_pwd_line'"
  echo "    expected: '$SPAWN_JOB_CWD'"
fi
spawn_worker_teardown

# --- Test 2: spawn success (jit-reminder) ------------------------------------

echo "Test: dispatch-spawn-job spawns a /dispatch-jit-reminder background job"
spawn_worker_setup
write_fake_spawn_worker_claude
export DISPATCH_SPAWN_JOB_CLAUDE_CMD="$TMPDIR_TEST/fake-claude"
export DISPATCH_SPAWN_JOB_SESSION_ID="sess-self"
SPAWN_JOB_CWD="$TMPDIR_TEST/worktrees/839-test-worker"
jit_prompt="/dispatch-jit-reminder owner/repo 961 PVT_x ITEM_y"
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-job" \
    --name jit-reminder-961 --cwd "$SPAWN_JOB_CWD" "$jit_prompt" 2>/dev/null ); then rc=0; else rc=$?; fi
assert_eq "spawn-job-jit: dispatch-spawn-job exits 0" "0" "$rc"
assert_eq "spawn-job-jit: stdout is 'spawned'" "spawned" "$out"
mapfile -t sj_bg_argv < "$SPAWN_WORKER_BG_ARGV"
assert_eq "spawn-job-jit: argv[0] is --bg" "--bg" "${sj_bg_argv[0]:-}"
assert_eq "spawn-job-jit: argv[1] is --name" "--name" "${sj_bg_argv[1]:-}"
assert_eq "spawn-job-jit: argv[2] is the passed name" "jit-reminder-961" "${sj_bg_argv[2]:-}"
assert_eq "spawn-job-jit: argv[3] is --permission-mode" "--permission-mode" "${sj_bg_argv[3]:-}"
assert_eq "spawn-job-jit: argv[4] is auto" "auto" "${sj_bg_argv[4]:-}"
assert_eq "spawn-job-jit: argv[5] is the prompt" "$jit_prompt" "${sj_bg_argv[5]:-}"
spawn_worker_teardown

# --- Test 2b: --model is forwarded into the bg argv (#1171) -------------------

echo "Test: dispatch-spawn-job forwards --model into the 'claude --bg' argv"
spawn_worker_setup
write_fake_spawn_worker_claude
export DISPATCH_SPAWN_JOB_CLAUDE_CMD="$TMPDIR_TEST/fake-claude"
export DISPATCH_SPAWN_JOB_SESSION_ID="sess-self"
SPAWN_JOB_CWD="$TMPDIR_TEST/worktrees/839-test-worker"
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-job" \
    --name diagnose-main --cwd "$SPAWN_JOB_CWD" --model sonnet \
    "/dispatch-diagnose-main abc123" 2>/dev/null ); then rc=0; else rc=$?; fi
assert_eq "spawn-job-model: dispatch-spawn-job exits 0" "0" "$rc"
assert_eq "spawn-job-model: stdout is 'spawned'" "spawned" "$out"
mapfile -t sj_bg_argv < "$SPAWN_WORKER_BG_ARGV"
assert_eq "spawn-job-model: argv[0] is --bg" "--bg" "${sj_bg_argv[0]:-}"
assert_eq "spawn-job-model: argv[1] is --name" "--name" "${sj_bg_argv[1]:-}"
assert_eq "spawn-job-model: argv[2] is the passed name" "diagnose-main" "${sj_bg_argv[2]:-}"
assert_eq "spawn-job-model: argv[3] is --model" "--model" "${sj_bg_argv[3]:-}"
assert_eq "spawn-job-model: argv[4] is sonnet" "sonnet" "${sj_bg_argv[4]:-}"
assert_eq "spawn-job-model: argv[5] is --permission-mode" "--permission-mode" "${sj_bg_argv[5]:-}"
assert_eq "spawn-job-model: argv[6] is auto" "auto" "${sj_bg_argv[6]:-}"
assert_eq "spawn-job-model: argv[7] is the prompt" "/dispatch-diagnose-main abc123" "${sj_bg_argv[7]:-}"
spawn_worker_teardown

# --- Test 2c: force-opus enabled — overrides caller's --model (#1830) --------
# With force-opus.json {"enabled":true}, dispatch-spawn-job must replace any
# caller-supplied --model with --model opus in the bg argv AND set
# CLAUDE_CODE_SUBAGENT_MODEL=opus so the spawned process inherits it.

echo "Test: force-opus enabled overrides --model sonnet with --model opus in bg argv"
spawn_worker_setup
write_fake_spawn_worker_claude
export DISPATCH_SPAWN_JOB_CLAUDE_CMD="$TMPDIR_TEST/fake-claude"
export DISPATCH_SPAWN_JOB_SESSION_ID="sess-self"
# Write an enabled force-opus config into the test's config dir.
printf '{"enabled":true}\n' > "$DISPATCH_CONFIG_DIR/force-opus.json"
SPAWN_JOB_CWD="$TMPDIR_TEST/worktrees/839-test-worker"
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-job" \
    --name diagnose-main --cwd "$SPAWN_JOB_CWD" --model sonnet \
    "/dispatch-diagnose-main abc123" 2>/dev/null ); then rc=0; else rc=$?; fi
assert_eq "spawn-job-force-opus-on: exits 0" "0" "$rc"
assert_eq "spawn-job-force-opus-on: stdout is 'spawned'" "spawned" "$out"
# Check the bg argv — caller passed --model sonnet but force-opus
# must have overridden it to --model opus.
mapfile -t sj_fo_argv < "$SPAWN_WORKER_BG_ARGV"
assert_eq "spawn-job-force-opus-on: argv[0] is --bg" "--bg" "${sj_fo_argv[0]:-}"
assert_eq "spawn-job-force-opus-on: argv[1] is --name" "--name" "${sj_fo_argv[1]:-}"
assert_eq "spawn-job-force-opus-on: argv[2] is diagnose-main" "diagnose-main" "${sj_fo_argv[2]:-}"
assert_eq "spawn-job-force-opus-on: argv[3] is --model" "--model" "${sj_fo_argv[3]:-}"
assert_eq "spawn-job-force-opus-on: argv[4] is opus (not sonnet)" "opus" "${sj_fo_argv[4]:-}"
# Check that CLAUDE_CODE_SUBAGENT_MODEL was opus when the fake ran.
sj_fo_subagent=$(cat "$SPAWN_WORKER_SUBAGENT_MODEL" 2>/dev/null || true)
assert_eq "spawn-job-force-opus-on: CLAUDE_CODE_SUBAGENT_MODEL recorded as opus" "opus" "$sj_fo_subagent"
spawn_worker_teardown

# --- Test 2d: force-opus disabled — caller's --model passes verbatim (#1830) -
# With force-opus.json {"enabled":false}, dispatch-spawn-job must leave the
# caller's --model untouched and must NOT set CLAUDE_CODE_SUBAGENT_MODEL.

echo "Test: force-opus disabled leaves --model sonnet verbatim in bg argv"
spawn_worker_setup
write_fake_spawn_worker_claude
export DISPATCH_SPAWN_JOB_CLAUDE_CMD="$TMPDIR_TEST/fake-claude"
export DISPATCH_SPAWN_JOB_SESSION_ID="sess-self"
printf '{"enabled":false}\n' > "$DISPATCH_CONFIG_DIR/force-opus.json"
SPAWN_JOB_CWD="$TMPDIR_TEST/worktrees/839-test-worker"
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-job" \
    --name diagnose-main --cwd "$SPAWN_JOB_CWD" --model sonnet \
    "/dispatch-diagnose-main abc123" 2>/dev/null ); then rc=0; else rc=$?; fi
assert_eq "spawn-job-force-opus-off: exits 0" "0" "$rc"
assert_eq "spawn-job-force-opus-off: stdout is 'spawned'" "spawned" "$out"
mapfile -t sj_foff_argv < "$SPAWN_WORKER_BG_ARGV"
assert_eq "spawn-job-force-opus-off: argv[3] is --model" "--model" "${sj_foff_argv[3]:-}"
assert_eq "spawn-job-force-opus-off: argv[4] is sonnet (unchanged)" "sonnet" "${sj_foff_argv[4]:-}"
sj_foff_subagent=$(cat "$SPAWN_WORKER_SUBAGENT_MODEL" 2>/dev/null || true)
assert_eq "spawn-job-force-opus-off: CLAUDE_CODE_SUBAGENT_MODEL is <unset>" "<unset>" "$sj_foff_subagent"
spawn_worker_teardown

# --- Test 2e: force-opus absent — caller's --model passes verbatim (#1830) ---
# With no force-opus.json at all, the gate must be off: caller's --model is
# untouched and CLAUDE_CODE_SUBAGENT_MODEL is not set.

echo "Test: force-opus absent (no file) leaves --model sonnet verbatim in bg argv"
spawn_worker_setup
write_fake_spawn_worker_claude
export DISPATCH_SPAWN_JOB_CLAUDE_CMD="$TMPDIR_TEST/fake-claude"
export DISPATCH_SPAWN_JOB_SESSION_ID="sess-self"
# No force-opus.json written — config dir is empty (dispatch-config-load → no-config).
SPAWN_JOB_CWD="$TMPDIR_TEST/worktrees/839-test-worker"
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-job" \
    --name diagnose-main --cwd "$SPAWN_JOB_CWD" --model sonnet \
    "/dispatch-diagnose-main abc123" 2>/dev/null ); then rc=0; else rc=$?; fi
assert_eq "spawn-job-force-opus-absent: exits 0" "0" "$rc"
assert_eq "spawn-job-force-opus-absent: stdout is 'spawned'" "spawned" "$out"
mapfile -t sj_fabsent_argv < "$SPAWN_WORKER_BG_ARGV"
assert_eq "spawn-job-force-opus-absent: argv[3] is --model" "--model" "${sj_fabsent_argv[3]:-}"
assert_eq "spawn-job-force-opus-absent: argv[4] is sonnet (unchanged)" "sonnet" "${sj_fabsent_argv[4]:-}"
sj_fabsent_subagent=$(cat "$SPAWN_WORKER_SUBAGENT_MODEL" 2>/dev/null || true)
assert_eq "spawn-job-force-opus-absent: CLAUDE_CODE_SUBAGENT_MODEL is <unset>" "<unset>" "$sj_fabsent_subagent"
spawn_worker_teardown

# --- Test 3: exact-name dedup ------------------------------------------------

echo "Test: a pre-existing live session with the same name deduplicates the spawn"
spawn_worker_setup
# Prime the registry with a different sessionId whose name matches the name the
# spawn would use. dispatch-spawn-job's dedup keys on name == <name>. cwd matches
# SPAWN_JOB_CWD so the fixture models production: sessions_under(SPAWN_JOB_CWD)
# returns this row (the fake ignores --cwd, but the fixture is accurate).
SPAWN_JOB_CWD="$TMPDIR_TEST/worktrees/839-test-worker"
printf '%s' \
  "[{\"sessionId\":\"sess-other\",\"pid\":4242,\"cwd\":\"$SPAWN_JOB_CWD\",\"kind\":\"background\",\"status\":\"busy\",\"name\":\"diagnose-main\"}]" \
  > "$SPAWN_WORKER_REGISTRY"
write_fake_spawn_worker_claude
export DISPATCH_SPAWN_JOB_CLAUDE_CMD="$TMPDIR_TEST/fake-claude"
export DISPATCH_SPAWN_JOB_SESSION_ID="sess-self"
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-job" \
    --name diagnose-main --cwd "$SPAWN_JOB_CWD" "/dispatch-diagnose-main abc123" 2>/dev/null ); then rc=0; else rc=$?; fi
assert_eq "spawn-job-dedup: dispatch-spawn-job exits 0" "0" "$rc"
assert_eq "spawn-job-dedup: stdout is 'deduped' (name-keyed dedup hit)" "deduped" "$out"
# No --bg invocation was recorded — nothing was spawned.
TOTAL=$((TOTAL + 1))
if [[ ! -e "$SPAWN_WORKER_BG_ARGV" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: spawn-job-dedup: no 'claude --bg' invocation recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: spawn-job-dedup: no 'claude --bg' invocation recorded"
  echo "    bg-argv: $(cat "$SPAWN_WORKER_BG_ARGV")"
fi
spawn_worker_teardown

# --- Test 3b: uncorroborated empty registry read dedupes (tactic-graph-router-
# live-worker-read-robust) -----------------------------------------------------
# `claude agents --json --cwd <path>` can exit 0 and print exactly `[]` on a
# blocked read (sandbox / network-namespace isolation) — byte-identical to a
# genuine "no sessions here". Step 2's `claude_sessions_under` call must fold
# that ambiguity into UNKNOWN (return 1), not "zero sessions", so this test
# must FAIL on a pre-tactic-graph-router-live-worker-read-robust tree and PASS
# now: this is the last-line defense the 2026-07-21 incident bypassed, when an
# uncorroborated `[]` let a manual dispatch tick launch a duplicate
# `/implement` worker onto an already-occupied worktree.

echo "Test: an uncorroborated empty registry read dedupes the spawn (fails safe)"
spawn_worker_setup
# spawn_worker_setup already primes SPAWN_WORKER_REGISTRY with '[]' and points
# CLAUDE_AGENTS_PGREP_CMD at a "daemon visible" stub — override the probe here
# so this test's `[]` read is uncorroborated (the ambiguous case) instead.
SPAWN_JOB_CWD="$TMPDIR_TEST/worktrees/839-test-worker"
printf '#!/usr/bin/env bash\nexit 1\n' > "$TMPDIR_TEST/fake-pgrep-unreachable"
chmod +x "$TMPDIR_TEST/fake-pgrep-unreachable"
export CLAUDE_AGENTS_PGREP_CMD="$TMPDIR_TEST/fake-pgrep-unreachable"
write_fake_spawn_worker_claude
export DISPATCH_SPAWN_JOB_CLAUDE_CMD="$TMPDIR_TEST/fake-claude"
export DISPATCH_SPAWN_JOB_SESSION_ID="sess-self"
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-job" \
    --name diagnose-main --cwd "$SPAWN_JOB_CWD" "/dispatch-diagnose-main abc123" 2>/dev/null ); then rc=0; else rc=$?; fi
assert_eq "spawn-job-uncorroborated-empty: dispatch-spawn-job exits 0" "0" "$rc"
assert_eq "spawn-job-uncorroborated-empty: stdout is 'deduped' (UNKNOWN, not zero sessions)" \
  "deduped" "$out"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$SPAWN_WORKER_BG_ARGV" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: spawn-job-uncorroborated-empty: no 'claude --bg' invocation recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: spawn-job-uncorroborated-empty: no 'claude --bg' invocation recorded"
  echo "    bg-argv: $(cat "$SPAWN_WORKER_BG_ARGV")"
fi
spawn_worker_teardown

# --- Test 4: usage errors ----------------------------------------------------

echo "Test: missing --name, --cwd, or <prompt> each exit 2"
spawn_worker_setup
write_fake_spawn_worker_claude
export DISPATCH_SPAWN_JOB_CLAUDE_CMD="$TMPDIR_TEST/fake-claude"
SPAWN_JOB_CWD="$TMPDIR_TEST/worktrees/839-test-worker"

# Sub-case A: missing --name
if "$TMPDIR_TEST/scripts/dispatch-spawn-job" --cwd "$SPAWN_JOB_CWD" "/dispatch-diagnose-main abc" 2>/dev/null; then sj_rc_a=0; else sj_rc_a=$?; fi
assert_eq "spawn-job-usage: missing --name → exit 2" "2" "$sj_rc_a"

# Sub-case B: missing --cwd
if "$TMPDIR_TEST/scripts/dispatch-spawn-job" --name diagnose-main "/dispatch-diagnose-main abc" 2>/dev/null; then sj_rc_b=0; else sj_rc_b=$?; fi
assert_eq "spawn-job-usage: missing --cwd → exit 2" "2" "$sj_rc_b"

# Sub-case C: missing <prompt>
if "$TMPDIR_TEST/scripts/dispatch-spawn-job" --name diagnose-main --cwd "$SPAWN_JOB_CWD" 2>/dev/null; then sj_rc_c=0; else sj_rc_c=$?; fi
assert_eq "spawn-job-usage: missing <prompt> → exit 2" "2" "$sj_rc_c"

# Sub-case D: a --cwd that is not an existing directory
if "$TMPDIR_TEST/scripts/dispatch-spawn-job" --name diagnose-main --cwd "$TMPDIR_TEST/worktrees/does-not-exist" "/dispatch-diagnose-main abc" 2>/dev/null; then sj_rc_d=0; else sj_rc_d=$?; fi
assert_eq "spawn-job-usage: non-existent --cwd → exit 2" "2" "$sj_rc_d"

# Sub-case E: an unexpected extra positional
if "$TMPDIR_TEST/scripts/dispatch-spawn-job" --name diagnose-main --cwd "$SPAWN_JOB_CWD" "prompt-one" "prompt-two" 2>/dev/null; then sj_rc_e=0; else sj_rc_e=$?; fi
assert_eq "spawn-job-usage: extra positional → exit 2" "2" "$sj_rc_e"

spawn_worker_teardown

# --- Test 5: --no-verify mode skips the registration wait (#1048) ------------
# The budget-path fan-out passes --no-verify: a successful `claude --bg` kick is
# enough (the ledger + sweep reconcile the slot), and a non-zero kick fails.

echo "Test: --no-verify exits 0 on a kick that never registers (no registration poll)"
spawn_worker_setup
write_fake_spawn_worker_claude
export DISPATCH_SPAWN_JOB_CLAUDE_CMD="$TMPDIR_TEST/fake-claude"
export DISPATCH_SPAWN_JOB_SESSION_ID="sess-self"
SPAWN_JOB_CWD="$TMPDIR_TEST/worktrees/839-test-worker"
# SPAWN_BG_REGISTERS=0: the --bg fake returns 0 but never appends to the
# registry. Under the OLD verify path this would have exited 1; with --no-verify
# the kick's own exit 0 is the came-up signal, so the script exits 0.
export SPAWN_BG_REGISTERS=0
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-job" --no-verify \
    --name diagnose-main --cwd "$SPAWN_JOB_CWD" "/dispatch-diagnose-main abc" 2>/dev/null ); then rc=0; else rc=$?; fi
assert_eq "spawn-job-noverify: exits 0 despite an empty registry" "0" "$rc"
assert_eq "spawn-job-noverify: stdout is 'spawned'" "spawned" "$out"
# Prove no registration happened: the registry was never appended to.
TOTAL=$((TOTAL + 1))
if [[ "$(cat "$SPAWN_WORKER_REGISTRY")" == "[]" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: spawn-job-noverify: spawned without the worker ever registering"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: spawn-job-noverify: spawned without the worker ever registering"
  echo "    registry: $(cat "$SPAWN_WORKER_REGISTRY")"
fi
spawn_worker_teardown

echo "Test: --no-verify exits 1 on a non-zero 'claude --bg' kick with a diagnostic"
spawn_worker_setup
export DISPATCH_SPAWN_JOB_CLAUDE_CMD="$TMPDIR_TEST/fake-claude"
export DISPATCH_SPAWN_JOB_SESSION_ID="sess-self"
SPAWN_JOB_CWD="$TMPDIR_TEST/worktrees/839-test-worker"
# Inline fake whose --bg exits non-zero; `agents` prints [] so dedup passes.
cat > "$TMPDIR_TEST/fake-claude" <<FAKE
#!/usr/bin/env bash
set -uo pipefail
case "\${1:-}" in
  agents) echo '[]' ;;
  --bg) echo "boom" >&2; exit 3 ;;
esac
FAKE
chmod +x "$TMPDIR_TEST/fake-claude"
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-spawn-job" --no-verify \
    --name diagnose-main --cwd "$SPAWN_JOB_CWD" "/dispatch-diagnose-main abc" 2>&1 1>/dev/null) || rc=$?
assert_eq "spawn-job-noverify-fail: a non-zero kick exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ -n "${err//[[:space:]]/}" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: spawn-job-noverify-fail: stderr reports the failed kick"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: spawn-job-noverify-fail: stderr reports the failed kick"
  echo "    stderr: $err"
fi
spawn_worker_teardown

# --- Test 5b: --park-issue parks the failure to office-hours (#1454) ----------
# On a non-zero --bg kick under --no-verify, dispatch-spawn-job parks the issue
# durably via the sibling dispatch-apply-office-hours. SCRIPT_DIR resolves to the
# copied-script dir ($TMPDIR_TEST/scripts), so the stub sibling lives there.
# The stub records its $@ to park.log so we can assert the issue number + reason.

# write_failing_kick_fake — fake `claude` whose --bg exits non-zero (kick fails)
# but whose `agents` prints [] so dedup passes. $1 is the target fake path.
write_failing_kick_fake() {
  cat > "$1" <<FAKE
#!/usr/bin/env bash
set -uo pipefail
case "\${1:-}" in
  agents) echo '[]' ;;
  --bg) echo "boom-kick-output" >&2; exit 3 ;;
esac
FAKE
  chmod +x "$1"
}

# write_park_recorder_stub — stub dispatch-apply-office-hours at the resolved
# sibling path; it appends its full argv to $TMPDIR_TEST/park.log and exits 0.
write_park_recorder_stub() {
  cat > "$TMPDIR_TEST/scripts/dispatch-apply-office-hours" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$TMPDIR_PARK_LOG"
exit 0
STUB
  chmod +x "$TMPDIR_TEST/scripts/dispatch-apply-office-hours"
}

echo "Test: --no-verify --park-issue parks the failed kick to office-hours (#1454)"
spawn_worker_setup
export DISPATCH_SPAWN_JOB_CLAUDE_CMD="$TMPDIR_TEST/fake-claude"
export DISPATCH_SPAWN_JOB_SESSION_ID="sess-self"
SPAWN_JOB_CWD="$TMPDIR_TEST/worktrees/839-test-worker"
write_failing_kick_fake "$TMPDIR_TEST/fake-claude"
export TMPDIR_PARK_LOG="$TMPDIR_TEST/park.log"
write_park_recorder_stub
rc=0
"$TMPDIR_TEST/scripts/dispatch-spawn-job" --no-verify --park-issue 1454 \
  --name diagnose-main --cwd "$SPAWN_JOB_CWD" "/dispatch-diagnose-main abc" \
  >/dev/null 2>&1 || rc=$?
assert_eq "spawn-job-park: a failed kick with --park-issue exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ -s "$TMPDIR_PARK_LOG" ]] \
   && grep -q '1454' "$TMPDIR_PARK_LOG" \
   && grep -q 'worker never started' "$TMPDIR_PARK_LOG"; then
  PASS=$((PASS + 1)); echo "  PASS: spawn-job-park: office-hours parked with the issue number + spawn output"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: spawn-job-park: office-hours parked with the issue number + spawn output"
  echo "    park.log: $(cat "$TMPDIR_PARK_LOG" 2>/dev/null || echo MISSING)"
fi
unset TMPDIR_PARK_LOG
spawn_worker_teardown

echo "Test: --no-verify WITHOUT --park-issue does NOT park (generic callers unaffected) (#1454)"
spawn_worker_setup
export DISPATCH_SPAWN_JOB_CLAUDE_CMD="$TMPDIR_TEST/fake-claude"
export DISPATCH_SPAWN_JOB_SESSION_ID="sess-self"
SPAWN_JOB_CWD="$TMPDIR_TEST/worktrees/839-test-worker"
write_failing_kick_fake "$TMPDIR_TEST/fake-claude"
export TMPDIR_PARK_LOG="$TMPDIR_TEST/park.log"
write_park_recorder_stub
rc=0
"$TMPDIR_TEST/scripts/dispatch-spawn-job" --no-verify \
  --name diagnose-main --cwd "$SPAWN_JOB_CWD" "/dispatch-diagnose-main abc" \
  >/dev/null 2>&1 || rc=$?
assert_eq "spawn-job-nopark: a failed kick without --park-issue exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_PARK_LOG" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: spawn-job-nopark: no office-hours park (park.log absent/empty)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: spawn-job-nopark: no office-hours park (park.log absent/empty)"
  echo "    park.log: $(cat "$TMPDIR_PARK_LOG" 2>/dev/null || echo MISSING)"
fi
unset TMPDIR_PARK_LOG
spawn_worker_teardown

echo "Test: --park-issue with a non-integer value exits 2 (usage error) (#1454)"
spawn_worker_setup
write_fake_spawn_worker_claude
export DISPATCH_SPAWN_JOB_CLAUDE_CMD="$TMPDIR_TEST/fake-claude"
SPAWN_JOB_CWD="$TMPDIR_TEST/worktrees/839-test-worker"
if "$TMPDIR_TEST/scripts/dispatch-spawn-job" --park-issue abc \
    --name diagnose-main --cwd "$SPAWN_JOB_CWD" "/dispatch-diagnose-main abc" 2>/dev/null; then
  sj_rc_park=0
else
  sj_rc_park=$?
fi
assert_eq "spawn-job-park-badint: non-integer --park-issue → exit 2" "2" "$sj_rc_park"
spawn_worker_teardown

# --- Test 6: default (verify) path absorbs delayed registration --------------
# The unledgered one-off spawns (main-broken / jit-reminder) keep the default
# verify, so the delayed-registration retry coverage lives here on the DEFAULT
# path (no --no-verify), ported from the former worker Tests 9 & 10.

echo "Test: a job that registers on the 2nd 'agents' call still exits 0 (default verify)"
spawn_worker_setup
write_fake_spawn_worker_claude
export DISPATCH_SPAWN_JOB_CLAUDE_CMD="$TMPDIR_TEST/fake-claude"
export DISPATCH_SPAWN_JOB_SESSION_ID="sess-self"
SPAWN_JOB_CWD="$TMPDIR_TEST/worktrees/839-test-worker"
# SPAWN_BG_REGISTER_AFTER_N=2: the job first appears on the 2nd subsequent
# `agents` call. verify_agent_registered_under polls up to 5 times, so the 2nd
# attempt finds it and the script exits 0.
export SPAWN_BG_REGISTER_AFTER_N=2
err_file="$TMPDIR_TEST/stderr"
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-job" \
    --name diagnose-main --cwd "$SPAWN_JOB_CWD" "/dispatch-diagnose-main abc" 2>"$err_file" ); then rc=0; else rc=$?; fi
err=$(cat "$err_file")
assert_eq "spawn-job-delayed: exits 0" "0" "$rc"
assert_eq "spawn-job-delayed: stdout is 'spawned'" "spawned" "$out"
TOTAL=$((TOTAL + 1))
if [[ -z "${err//[[:space:]]/}" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: spawn-job-delayed: no diagnostic on stderr"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: spawn-job-delayed: no diagnostic on stderr"
  echo "    stderr: $err"
fi
spawn_worker_teardown

echo "Test: a job that registers on the 5th (final) 'agents' call still exits 0 (default verify)"
spawn_worker_setup
write_fake_spawn_worker_claude
export DISPATCH_SPAWN_JOB_CLAUDE_CMD="$TMPDIR_TEST/fake-claude"
export DISPATCH_SPAWN_JOB_SESSION_ID="sess-self"
SPAWN_JOB_CWD="$TMPDIR_TEST/worktrees/839-test-worker"
# SPAWN_BG_REGISTER_AFTER_N=5: the job first appears on the last poll before
# verify exhausts its 5-attempt budget. Pins the off-by-one — the final attempt
# is honoured, so the script must still exit 0.
export SPAWN_BG_REGISTER_AFTER_N=5
export LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S=0
err_file="$TMPDIR_TEST/stderr"
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-job" \
    --name diagnose-main --cwd "$SPAWN_JOB_CWD" "/dispatch-diagnose-main abc" 2>"$err_file" ); then rc=0; else rc=$?; fi
err=$(cat "$err_file")
assert_eq "spawn-job-last-attempt: exits 0" "0" "$rc"
assert_eq "spawn-job-last-attempt: stdout is 'spawned'" "spawned" "$out"
TOTAL=$((TOTAL + 1))
if [[ -z "${err//[[:space:]]/}" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: spawn-job-last-attempt: no diagnostic on stderr"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: spawn-job-last-attempt: no diagnostic on stderr"
  echo "    stderr: $err"
fi
spawn_worker_teardown

# --- Test 2f: --effort forwarded into bg argv (with --model, pins ordering) --
# Passes both --model and --effort to exercise the full argv order:
#   --bg --name N --model M --effort E --permission-mode auto PROMPT
# (effort sits after model and before --permission-mode).

echo "Test: dispatch-spawn-job forwards --effort into the 'claude --bg' argv (after --model)"
spawn_worker_setup
write_fake_spawn_worker_claude
export DISPATCH_SPAWN_JOB_CLAUDE_CMD="$TMPDIR_TEST/fake-claude"
export DISPATCH_SPAWN_JOB_SESSION_ID="sess-self"
SPAWN_JOB_CWD="$TMPDIR_TEST/worktrees/839-test-worker"
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-job" \
    --name diagnose-main --cwd "$SPAWN_JOB_CWD" \
    --model sonnet --effort high \
    "/dispatch-diagnose-main abc123" 2>/dev/null ); then rc=0; else rc=$?; fi
assert_eq "spawn-job-effort: dispatch-spawn-job exits 0" "0" "$rc"
assert_eq "spawn-job-effort: stdout is 'spawned'" "spawned" "$out"
mapfile -t sj_effort_argv < "$SPAWN_WORKER_BG_ARGV"
assert_eq "spawn-job-effort: argv[0] is --bg" "--bg" "${sj_effort_argv[0]:-}"
assert_eq "spawn-job-effort: argv[1] is --name" "--name" "${sj_effort_argv[1]:-}"
assert_eq "spawn-job-effort: argv[2] is the passed name" "diagnose-main" "${sj_effort_argv[2]:-}"
assert_eq "spawn-job-effort: argv[3] is --model" "--model" "${sj_effort_argv[3]:-}"
assert_eq "spawn-job-effort: argv[4] is sonnet" "sonnet" "${sj_effort_argv[4]:-}"
assert_eq "spawn-job-effort: argv[5] is --effort" "--effort" "${sj_effort_argv[5]:-}"
assert_eq "spawn-job-effort: argv[6] is high" "high" "${sj_effort_argv[6]:-}"
assert_eq "spawn-job-effort: argv[7] is --permission-mode" "--permission-mode" "${sj_effort_argv[7]:-}"
assert_eq "spawn-job-effort: argv[8] is auto" "auto" "${sj_effort_argv[8]:-}"
assert_eq "spawn-job-effort: argv[9] is the prompt" "/dispatch-diagnose-main abc123" "${sj_effort_argv[9]:-}"
spawn_worker_teardown

# --- Test 2g: --effort omitted — no --effort token in bg argv ----------------
# When --effort is absent, the bg argv must contain no --effort token.
# The spawn succeeds, so the argv file exists — we check token absence.

echo "Test: dispatch-spawn-job omits --effort from bg argv when not passed"
spawn_worker_setup
write_fake_spawn_worker_claude
export DISPATCH_SPAWN_JOB_CLAUDE_CMD="$TMPDIR_TEST/fake-claude"
export DISPATCH_SPAWN_JOB_SESSION_ID="sess-self"
SPAWN_JOB_CWD="$TMPDIR_TEST/worktrees/839-test-worker"
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-job" \
    --name diagnose-main --cwd "$SPAWN_JOB_CWD" \
    "/dispatch-diagnose-main abc123" 2>/dev/null ); then rc=0; else rc=$?; fi
assert_eq "spawn-job-no-effort: dispatch-spawn-job exits 0" "0" "$rc"
assert_eq "spawn-job-no-effort: stdout is 'spawned'" "spawned" "$out"
TOTAL=$((TOTAL + 1))
if ! grep -qx -- '--effort' "$SPAWN_WORKER_BG_ARGV" 2>/dev/null; then
  PASS=$((PASS + 1)); echo "  PASS: spawn-job-no-effort: no '--effort' token in bg argv"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: spawn-job-no-effort: no '--effort' token in bg argv"
  echo "    bg-argv: $(cat "$SPAWN_WORKER_BG_ARGV")"
fi
spawn_worker_teardown

# --- Test 2h: --effort bogus exits 2 (closed-set validation) -----------------
# An invalid effort value must exit 2 with a clear diagnostic (not a spawn).

echo "Test: dispatch-spawn-job exits 2 on an invalid --effort value"
spawn_worker_setup
write_fake_spawn_worker_claude
export DISPATCH_SPAWN_JOB_CLAUDE_CMD="$TMPDIR_TEST/fake-claude"
SPAWN_JOB_CWD="$TMPDIR_TEST/worktrees/839-test-worker"
if "$TMPDIR_TEST/scripts/dispatch-spawn-job" --effort bogus \
    --name diagnose-main --cwd "$SPAWN_JOB_CWD" "/dispatch-diagnose-main abc" 2>/dev/null; then
  sj_rc_effort=0
else
  sj_rc_effort=$?
fi
assert_eq "spawn-job-effort-bad: invalid --effort value → exit 2" "2" "$sj_rc_effort"
spawn_worker_teardown

# <<< END MOVED <<<

report_results
