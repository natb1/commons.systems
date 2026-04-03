#!/usr/bin/env bash
set -euo pipefail

# Unit tests for worktree-path process cleanup functions in lib.sh

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

echo "=== Test: kill_worktree_processes finds and kills by path ==="
(
  source "$SCRIPT_DIR/lib.sh"
  TEST_WT="/fake/worktrees/test-kill-$$"

  # Spawn processes with the fake worktree path in their args
  perl -e 'sleep 300' -- "$TEST_WT/sentinel1" &
  PID1=$!
  perl -e 'sleep 300' -- "$TEST_WT/sentinel2" &
  PID2=$!
  trap 'kill -9 $PID1 $PID2 2>/dev/null || true' EXIT
  sleep 0.3

  kill_worktree_processes "$TEST_WT"

  alive=0
  kill -0 "$PID1" 2>/dev/null && alive=$((alive + 1))
  kill -0 "$PID2" 2>/dev/null && alive=$((alive + 1))

  if [ "$alive" -eq 0 ]; then
    pass "kill_worktree_processes kills matching processes"
  else
    fail "kill_worktree_processes left $alive processes alive"
    kill -9 "$PID1" "$PID2" 2>/dev/null || true
  fi
)

echo ""
echo "=== Test: kill_worktree_processes ignores other worktree processes ==="
(
  source "$SCRIPT_DIR/lib.sh"
  TARGET_WT="/fake/worktrees/target-$$"
  OTHER_WT="/fake/worktrees/other-$$"

  perl -e 'sleep 300' -- "$TARGET_WT/sentinel" &
  TARGET_PID=$!
  perl -e 'sleep 300' -- "$OTHER_WT/sentinel" &
  OTHER_PID=$!
  trap 'kill -9 $TARGET_PID $OTHER_PID 2>/dev/null || true' EXIT
  sleep 0.3

  kill_worktree_processes "$TARGET_WT"

  target_alive=false
  other_alive=false
  kill -0 "$TARGET_PID" 2>/dev/null && target_alive=true
  kill -0 "$OTHER_PID" 2>/dev/null && other_alive=true

  if [ "$target_alive" = false ] && [ "$other_alive" = true ]; then
    pass "kill_worktree_processes only kills matching path"
  else
    fail "target alive=$target_alive (want false), other alive=$other_alive (want true)"
  fi

  kill -9 "$TARGET_PID" "$OTHER_PID" 2>/dev/null || true
)

echo ""
echo "=== Test: kill_tree escalates to SIGKILL ==="
(
  source "$SCRIPT_DIR/lib.sh"

  # Spawn a process that traps SIGTERM (refuses to die)
  bash -c 'trap "" TERM; sleep 300' &
  STUBBORN_PID=$!
  trap 'kill -9 $STUBBORN_PID 2>/dev/null || true' EXIT
  sleep 0.3

  kill_tree "$STUBBORN_PID"
  # kill_tree sleeps 2s internally, then SIGKILLs. Give a small buffer.
  sleep 0.5

  if kill -0 "$STUBBORN_PID" 2>/dev/null; then
    fail "kill_tree did not SIGKILL stubborn process"
    kill -9 "$STUBBORN_PID" 2>/dev/null || true
  else
    pass "kill_tree escalates to SIGKILL for stubborn processes"
  fi
)

echo ""
echo "=== Test: kill_tree kills descendants ==="
(
  source "$SCRIPT_DIR/lib.sh"

  # Spawn a parent with a child
  bash -c 'sleep 300 & wait' &
  PARENT_PID=$!
  sleep 0.3

  # Find the child sleep process
  CHILD_PID=$(pgrep -P "$PARENT_PID" 2>/dev/null | head -1) || true
  trap 'kill -9 $PARENT_PID $CHILD_PID 2>/dev/null || true' EXIT

  if [ -z "$CHILD_PID" ]; then
    fail "could not find child process for kill_tree descendant test"
  else
    kill_tree "$PARENT_PID"
    sleep 0.5

    parent_dead=true
    child_dead=true
    kill -0 "$PARENT_PID" 2>/dev/null && parent_dead=false
    kill -0 "$CHILD_PID" 2>/dev/null && child_dead=false

    if [ "$parent_dead" = true ] && [ "$child_dead" = true ]; then
      pass "kill_tree kills parent and descendants"
    else
      fail "parent dead=$parent_dead, child dead=$child_dead (both should be true)"
      kill -9 "$PARENT_PID" "$CHILD_PID" 2>/dev/null || true
    fi
  fi
)

echo ""
echo "=== Test: cleanup_stale_worktree_processes kills stale, keeps active ==="
(
  source "$SCRIPT_DIR/lib.sh"
  REAL_WT="$(git rev-parse --show-toplevel)"
  STALE_WT="/fake/worktrees/deleted-$$"

  # Process from a real active worktree
  perl -e 'sleep 300' -- "$REAL_WT/sentinel" &
  ACTIVE_PID=$!
  # Process from a stale (non-existent) worktree
  perl -e 'sleep 300' -- "$STALE_WT/sentinel" &
  STALE_PID=$!
  trap 'kill -9 $ACTIVE_PID $STALE_PID 2>/dev/null || true' EXIT
  sleep 0.3

  cleanup_stale_worktree_processes

  active_alive=false
  stale_alive=false
  kill -0 "$ACTIVE_PID" 2>/dev/null && active_alive=true
  kill -0 "$STALE_PID" 2>/dev/null && stale_alive=true

  if [ "$active_alive" = true ]; then
    pass "cleanup keeps active worktree process alive"
  else
    fail "cleanup killed active worktree process"
  fi

  if [ "$stale_alive" = false ]; then
    pass "cleanup kills stale worktree process"
  else
    fail "cleanup left stale worktree process alive"
    kill -9 "$STALE_PID" 2>/dev/null || true
  fi

  kill -9 "$ACTIVE_PID" 2>/dev/null || true
)

echo ""
echo "=== Test: cleanup_stale_hub removes stale hub file ==="
(
  source "$SCRIPT_DIR/lib.sh"
  get_tmpdir() { printf '%s' "$TEST_TMPDIR"; }

  project_id="$(get_emulator_project_id)"
  hub_file="${TEST_TMPDIR}/hub-${project_id}.json"

  # Create a hub file with a dead PID
  echo '{"pid": 1999999}' > "$hub_file"

  cleanup_stale_hub

  if [ ! -f "$hub_file" ]; then
    pass "cleanup_stale_hub removes stale hub file"
  else
    fail "cleanup_stale_hub did not remove stale hub file"
    rm -f "$hub_file"
  fi
)

echo ""
echo "=== Test: cleanup_stale_hub keeps live hub file ==="
(
  source "$SCRIPT_DIR/lib.sh"
  get_tmpdir() { printf '%s' "$TEST_TMPDIR"; }

  project_id="$(get_emulator_project_id)"
  hub_file="${TEST_TMPDIR}/hub-${project_id}.json"

  # Create a hub file with a live PID (current process)
  echo "{\"pid\": $$}" > "$hub_file"

  cleanup_stale_hub

  if [ -f "$hub_file" ]; then
    pass "cleanup_stale_hub keeps live hub file"
  else
    fail "cleanup_stale_hub removed a live hub file"
  fi

  rm -f "$hub_file"
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
