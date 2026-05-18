#!/usr/bin/env bash
# Test suite for worktree-remove.sh hook.
# Usage: ./test-worktree-remove.sh
# Requires: jq, realpath
#
# The hook emits no decision output (WorktreeRemove ignores stdout/exit code),
# so cases assert on SIDE EFFECTS instead: whether a stub `git` received
# `worktree remove`, and the contents of the hook's persistent log file.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
HOOK="$SCRIPT_DIR/worktree-remove.sh"
ORIG_TMPDIR="${TMPDIR:-/tmp}"

PASS=0
FAIL=0
TOTAL=0

# --- stub git ---------------------------------------------------------------
# A fake `git` prepended to PATH. Behaviour is driven entirely by STUB_* env
# vars set per case, so no real repo or network is needed.

STUB_BIN=$(mktemp -d)
cat >"$STUB_BIN/git" <<'STUB'
#!/usr/bin/env bash
set -uo pipefail
# Drop a leading "-C <path>" (git -C <wt> status / rev-list).
if [ "${1:-}" = "-C" ]; then shift 2; fi
cmd="$*"
case "$cmd" in
  "rev-parse --path-format=absolute --git-common-dir")
    printf '%s\n' "${STUB_GIT_COMMON_DIR:-}"
    exit "${STUB_REVPARSE_RC:-0}" ;;
  "worktree list --porcelain")
    [ -n "${STUB_WT_LIST:-}" ] && printf '%s\n' "$STUB_WT_LIST"
    exit 0 ;;
  "status --porcelain")
    [ -n "${STUB_STATUS:-}" ] && printf '%s\n' "$STUB_STATUS"
    exit "${STUB_STATUS_RC:-0}" ;;
  "rev-list --count HEAD --not --remotes")
    printf '%s\n' "${STUB_REVLIST:-0}"
    exit "${STUB_REVLIST_RC:-0}" ;;
  "worktree remove "*)
    printf '%s\n' "$cmd" >>"${STUB_REMOVED_LOG:?STUB_REMOVED_LOG unset}"
    exit "${STUB_REMOVE_RC:-0}" ;;
  "worktree prune")
    exit 0 ;;
  *)
    echo "git stub: unknown invocation: $cmd" >&2
    exit 1 ;;
esac
STUB
chmod +x "$STUB_BIN/git"
export PATH="$STUB_BIN:$PATH"

# --- per-case fixtures ------------------------------------------------------

ROOT=""; BRANCH=""; WT=""; REMOVED_LOG=""; HOOK_LOG=""; HOOK_RC=0

# setup_root — fresh fake project root with a registered, in-sync worktree.
# Sets every STUB_* var so a previous case's overrides never leak.
setup_root() {
  TMPDIR="$ORIG_TMPDIR"
  ROOT=$(realpath "$(mktemp -d)")
  export TMPDIR="$ROOT"      # isolates the hook's pre-relocation log per case

  BRANCH="42-foo"
  WT="$ROOT/worktrees/$BRANCH"
  mkdir -p "$ROOT/.bare" "$ROOT/worktrees/main" "$WT"

  REMOVED_LOG="$ROOT/removed.log"
  HOOK_LOG="$ROOT/tmp/worktree-remove.log"

  export STUB_GIT_COMMON_DIR="$ROOT/.bare"
  export STUB_REVPARSE_RC=0
  export STUB_WT_LIST="worktree $ROOT/worktrees/main
worktree $WT"
  export STUB_STATUS=""        # clean working tree
  export STUB_STATUS_RC=0
  export STUB_REVLIST="0"      # all commits pushed
  export STUB_REVLIST_RC=0
  export STUB_REMOVE_RC=0
  export STUB_REMOVED_LOG="$REMOVED_LOG"
}

# run_hook <payload> [cwd] — feed the payload on stdin, capture the exit code.
run_hook() {
  local payload="$1" cwd="${2:-$ROOT}"
  HOOK_RC=0
  ( cd "$cwd" && printf '%s' "$payload" | "$HOOK" ) || HOOK_RC=$?
}

# --- assertions -------------------------------------------------------------

assert_exit0() {
  local desc="$1"
  TOTAL=$((TOTAL + 1))
  if [ "$HOOK_RC" -eq 0 ]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: $desc — expected exit 0, got $HOOK_RC"
  fi
}

assert_remove_called() {
  local desc="$1"
  TOTAL=$((TOTAL + 1))
  if [ -s "$REMOVED_LOG" ]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: $desc — expected 'git worktree remove' to be invoked"
  fi
}

assert_remove_not_called() {
  local desc="$1"
  TOTAL=$((TOTAL + 1))
  if [ ! -s "$REMOVED_LOG" ]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: $desc — 'git worktree remove' was invoked unexpectedly: $(cat "$REMOVED_LOG")"
  fi
}

assert_log() {
  local desc="$1" pattern="$2"
  TOTAL=$((TOTAL + 1))
  if grep -qF -- "$pattern" "$HOOK_LOG" 2>/dev/null; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: $desc — log missing pattern: $pattern"
    if [ -f "$HOOK_LOG" ]; then sed 's/^/    /' "$HOOK_LOG"; else echo "    <no log file>"; fi
  fi
}

# --- Removal cases: in sync, target supplied each way -----------------------

setup_root
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0          "removal via .worktree_path: exit 0"
assert_remove_called  "removal via .worktree_path: git worktree remove called"
assert_log            "removal via .worktree_path: log shows IN SYNC" "IN SYNC: removing"
assert_log            "removal via .worktree_path: log shows success" "removed '$WT' successfully"

setup_root
run_hook "$(jq -nc --arg p "$WT" '{path: $p}')"
assert_exit0          "removal via .path: exit 0"
assert_remove_called  "removal via .path: git worktree remove called"
assert_log            "removal via .path: log shows success" "removed '$WT' successfully"

setup_root
run_hook "$(jq -nc --arg p "$WT" '{cwd: $p}')"
assert_exit0          "removal via .cwd: exit 0"
assert_remove_called  "removal via .cwd: git worktree remove called"
assert_log            "removal via .cwd: log shows success" "removed '$WT' successfully"

setup_root
run_hook "$(jq -nc --arg n "$BRANCH" '{name: $n}')"
assert_exit0          "removal via .name (bare name): exit 0"
assert_remove_called  "removal via .name (bare name): git worktree remove called"
assert_log            "removal via .name (bare name): log shows success" "removed '$WT' successfully"

setup_root
run_hook '{}' "$WT"   # empty payload -> $PWD fallback
assert_exit0          "removal via \$PWD fallback: exit 0"
assert_remove_called  "removal via \$PWD fallback: git worktree remove called"
assert_log            "removal via \$PWD fallback: log shows success" "removed '$WT' successfully"

# --- Keep cases: not in sync ------------------------------------------------

setup_root
export STUB_STATUS=" M src/file.txt"
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0              "keep: dirty working tree: exit 0"
assert_remove_not_called  "keep: dirty working tree: not removed"
assert_log                "keep: dirty working tree: log shows KEEP" "has uncommitted changes"

setup_root
export STUB_REVLIST="3"
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0              "keep: unpushed commits: exit 0"
assert_remove_not_called  "keep: unpushed commits: not removed"
assert_log                "keep: unpushed commits: log shows count" "3 unpushed commit(s)"

setup_root
export STUB_STATUS_RC=1
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0              "keep: git status error: exit 0"
assert_remove_not_called  "keep: git status error: not removed"
assert_log                "keep: git status error: log shows failure" "git status failed"

setup_root
export STUB_REVLIST="not-a-number"
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0              "keep: rev-list non-numeric: exit 0"
assert_remove_not_called  "keep: rev-list non-numeric: not removed"
assert_log                "keep: rev-list non-numeric: log shows failure" "rev-list non-numeric"

setup_root
export STUB_REVLIST_RC=1
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0              "keep: rev-list error: exit 0"
assert_remove_not_called  "keep: rev-list error: not removed"
assert_log                "keep: rev-list error: log shows failure" "rev-list failed"

# --- Safety no-ops ----------------------------------------------------------

setup_root
run_hook "$(jq -nc --arg p "$ROOT/elsewhere" '{worktree_path: $p}')"
assert_exit0              "safety: target outside worktrees/: exit 0"
assert_remove_not_called  "safety: target outside worktrees/: not removed"
assert_log                "safety: target outside worktrees/: log refuses" "not under"

setup_root
run_hook "$(jq -nc --arg p "$ROOT/worktrees/main" '{worktree_path: $p}')"
assert_exit0              "safety: target is main: exit 0"
assert_remove_not_called  "safety: target is main: not removed"
assert_log                "safety: target is main: log refuses" "is main"

setup_root
run_hook "$(jq -nc --arg p "$ROOT/worktrees/99-ghost" '{worktree_path: $p}')"
assert_exit0              "safety: target not registered: exit 0"
assert_remove_not_called  "safety: target not registered: not removed"
assert_log                "safety: target not registered: log no-ops" "not a registered worktree"

setup_root
export STUB_WT_LIST=""
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0              "safety: empty worktree list: exit 0"
assert_remove_not_called  "safety: empty worktree list: not removed"
assert_log                "safety: empty worktree list: log no-ops" "not a registered worktree"

setup_root
run_hook "$(jq -nc --arg p "$ROOT/.bare" '{worktree_path: $p}')"
assert_exit0              "safety: .bare path: exit 0"
assert_remove_not_called  "safety: .bare path: not removed"
assert_log                "safety: .bare path: log refuses" "not under"

# --- Robustness -------------------------------------------------------------

setup_root
run_hook "not valid json" "$ROOT"   # malformed -> all fields empty -> $PWD ($ROOT, outside worktrees/)
assert_exit0              "robustness: malformed JSON stdin: exit 0"
assert_remove_not_called  "robustness: malformed JSON stdin: not removed"

setup_root
run_hook "" "$ROOT"                 # empty stdin -> $PWD fallback ($ROOT, outside worktrees/)
assert_exit0              "robustness: empty stdin: exit 0"
assert_remove_not_called  "robustness: empty stdin: not removed"

setup_root
export STUB_REMOVE_RC=1
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0          "robustness: git worktree remove rc!=0: exit 0"
assert_remove_called  "robustness: git worktree remove rc!=0: remove attempted"
assert_log            "robustness: git worktree remove rc!=0: log shows failure" "git worktree remove failed"

# --- Summary ----------------------------------------------------------------

echo ""
echo "Results: $PASS passed, $FAIL failed, $TOTAL total"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo "All tests passed."
