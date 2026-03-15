#!/usr/bin/env bash
set -euo pipefail

# Unit tests for PID file cleanup functions in lib.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

# Use a dedicated temp directory for test isolation
TEST_TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TEST_TMPDIR"' EXIT

PASS_FILE="${TEST_TMPDIR}/.pass_count"
FAIL_FILE="${TEST_TMPDIR}/.fail_count"
echo 0 > "$PASS_FILE"
echo 0 > "$FAIL_FILE"

pass() {
  echo "  PASS: $1"
  echo $(( $(cat "$PASS_FILE") + 1 )) > "$PASS_FILE"
}
fail() {
  echo "  FAIL: $1"
  echo $(( $(cat "$FAIL_FILE") + 1 )) > "$FAIL_FILE"
}

# Source lib.sh from the repo root so git commands work
cd "$REPO_ROOT"
source "$SCRIPT_DIR/lib.sh"

echo "=== Test: write_pid_file creates correct JSON ==="
(
  source "$SCRIPT_DIR/lib.sh"
  get_tmpdir() { printf '%s' "$TEST_TMPDIR"; }

  sleep 300 &
  SLEEP_PID=$!
  trap 'kill $SLEEP_PID 2>/dev/null || true' EXIT

  write_pid_file "${SLEEP_PID}:sleep"

  project_id="$(get_emulator_project_id)"
  pid_file="${TEST_TMPDIR}/pids-${project_id}.json"

  if [ ! -f "$pid_file" ]; then
    fail "PID file not created"
    exit 1
  fi

  hub_pid=$(jq -r '.hub_pid' "$pid_file")
  worktree_path=$(jq -r '.worktree_path' "$pid_file")
  proc_pid=$(jq -r '.processes[0].pid' "$pid_file")
  proc_cmd=$(jq -r '.processes[0].cmd' "$pid_file")

  if [ "$hub_pid" = "$$" ] && [ "$worktree_path" = "$(git rev-parse --show-toplevel)" ] && \
     [ "$proc_pid" = "$SLEEP_PID" ] && [ "$proc_cmd" = "sleep" ]; then
    pass "write_pid_file creates correct JSON"
  else
    fail "write_pid_file JSON incorrect (hub_pid=$hub_pid, proc_pid=$proc_pid, proc_cmd=$proc_cmd)"
  fi

  kill "$SLEEP_PID" 2>/dev/null || true
  rm -f "$pid_file"
)

echo ""
echo "=== Test: write_pid_file with multiple processes ==="
(
  source "$SCRIPT_DIR/lib.sh"
  get_tmpdir() { printf '%s' "$TEST_TMPDIR"; }

  sleep 300 &
  PID1=$!
  sleep 300 &
  PID2=$!
  trap 'kill $PID1 $PID2 2>/dev/null || true' EXIT

  write_pid_file "${PID1}:node" "${PID2}:java"

  project_id="$(get_emulator_project_id)"
  pid_file="${TEST_TMPDIR}/pids-${project_id}.json"

  count=$(jq '.processes | length' "$pid_file")
  if [ "$count" = "2" ]; then
    pass "write_pid_file records multiple processes"
  else
    fail "expected 2 processes, got $count"
  fi

  kill "$PID1" "$PID2" 2>/dev/null || true
  rm -f "$pid_file"
)

echo ""
echo "=== Test: remove_pid_file cleans up ==="
(
  source "$SCRIPT_DIR/lib.sh"
  get_tmpdir() { printf '%s' "$TEST_TMPDIR"; }

  sleep 300 &
  SLEEP_PID=$!
  trap 'kill $SLEEP_PID 2>/dev/null || true' EXIT

  write_pid_file "${SLEEP_PID}:sleep"

  project_id="$(get_emulator_project_id)"
  pid_file="${TEST_TMPDIR}/pids-${project_id}.json"

  if [ ! -f "$pid_file" ]; then
    fail "PID file not created for remove test"
    exit 1
  fi

  remove_pid_file

  if [ ! -f "$pid_file" ]; then
    pass "remove_pid_file removes the file"
  else
    fail "PID file still exists after remove_pid_file"
  fi

  kill "$SLEEP_PID" 2>/dev/null || true
)

echo ""
echo "=== Test: cleanup kills orphans from dead parent ==="
(
  source "$SCRIPT_DIR/lib.sh"
  get_tmpdir() { printf '%s' "$TEST_TMPDIR"; }

  sleep 300 &
  ORPHAN_PID=$!

  project_id="$(get_emulator_project_id)"
  pid_file="${TEST_TMPDIR}/pids-${project_id}.json"
  worktree_path="$(git rev-parse --show-toplevel)"

  # PID 1999999 should not exist — simulates dead hub
  cat > "$pid_file" <<EOF
{"hub_pid": 1999999, "worktree_path": "$worktree_path", "processes": [{"pid": $ORPHAN_PID, "cmd": "sleep"}]}
EOF

  cleanup_all_stale_processes

  sleep 0.2

  if kill -0 "$ORPHAN_PID" 2>/dev/null; then
    fail "orphaned process $ORPHAN_PID still alive after cleanup"
    kill "$ORPHAN_PID" 2>/dev/null || true
  else
    pass "cleanup kills orphan from dead parent"
  fi

  if [ ! -f "$pid_file" ]; then
    pass "cleanup removes PID file for dead parent"
  else
    fail "PID file still exists after cleanup"
    rm -f "$pid_file"
  fi
)

echo ""
echo "=== Test: cleanup kills orphans from deleted worktree ==="
(
  source "$SCRIPT_DIR/lib.sh"
  get_tmpdir() { printf '%s' "$TEST_TMPDIR"; }

  sleep 300 &
  ORPHAN_PID=$!

  project_id="$(get_emulator_project_id)"
  pid_file="${TEST_TMPDIR}/pids-${project_id}-deleted-wt.json"

  # Use a nonexistent worktree path — simulates deleted worktree
  cat > "$pid_file" <<EOF
{"hub_pid": $$, "worktree_path": "/nonexistent/worktree/path", "processes": [{"pid": $ORPHAN_PID, "cmd": "sleep"}]}
EOF

  cleanup_all_stale_processes

  sleep 0.2

  if kill -0 "$ORPHAN_PID" 2>/dev/null; then
    fail "orphaned process $ORPHAN_PID still alive after deleted-worktree cleanup"
    kill "$ORPHAN_PID" 2>/dev/null || true
  else
    pass "cleanup kills orphan from deleted worktree"
  fi

  if [ ! -f "$pid_file" ]; then
    pass "cleanup removes PID file for deleted worktree"
  else
    fail "PID file still exists after deleted-worktree cleanup"
    rm -f "$pid_file"
  fi
)

echo ""
echo "=== Test: cleanup skips active processes with live hub ==="
(
  source "$SCRIPT_DIR/lib.sh"
  get_tmpdir() { printf '%s' "$TEST_TMPDIR"; }

  sleep 300 &
  LIVE_PID=$!
  trap 'kill $LIVE_PID 2>/dev/null || true' EXIT

  project_id="$(get_emulator_project_id)"
  pid_file="${TEST_TMPDIR}/pids-${project_id}-live.json"
  worktree_path="$(git rev-parse --show-toplevel)"

  # Use current PID ($$) as hub — it's alive, worktree exists
  cat > "$pid_file" <<EOF
{"hub_pid": $$, "worktree_path": "$worktree_path", "processes": [{"pid": $LIVE_PID, "cmd": "sleep"}]}
EOF

  cleanup_all_stale_processes

  if kill -0 "$LIVE_PID" 2>/dev/null; then
    pass "cleanup skips active process with live hub"
  else
    fail "cleanup killed a process that should have been skipped"
  fi

  kill "$LIVE_PID" 2>/dev/null || true
  rm -f "$pid_file"
)

echo ""
echo "=== Test: command name mismatch guards PID recycling ==="
(
  source "$SCRIPT_DIR/lib.sh"
  get_tmpdir() { printf '%s' "$TEST_TMPDIR"; }

  sleep 300 &
  SAFE_PID=$!
  trap 'kill $SAFE_PID 2>/dev/null || true' EXIT

  project_id="$(get_emulator_project_id)"
  pid_file="${TEST_TMPDIR}/pids-${project_id}-mismatch.json"
  worktree_path="$(git rev-parse --show-toplevel)"

  # PID file claims this is "not_sleep" but it's actually "sleep"
  cat > "$pid_file" <<EOF
{"hub_pid": 1999999, "worktree_path": "$worktree_path", "processes": [{"pid": $SAFE_PID, "cmd": "not_sleep"}]}
EOF

  cleanup_all_stale_processes

  if kill -0 "$SAFE_PID" 2>/dev/null; then
    pass "command name mismatch prevents killing recycled PID"
  else
    fail "cleanup killed a process despite command name mismatch"
  fi

  kill "$SAFE_PID" 2>/dev/null || true
  rm -f "$pid_file"
)

FINAL_PASS=$(cat "$PASS_FILE")
FINAL_FAIL=$(cat "$FAIL_FILE")

echo ""
echo "========================================"
echo "  Results: $FINAL_PASS passed, $FINAL_FAIL failed"
echo "========================================"

if [ "$FINAL_FAIL" -gt 0 ]; then
  exit 1
fi
