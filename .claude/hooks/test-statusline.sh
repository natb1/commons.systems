#!/usr/bin/env bash
# Test suite for statusline.sh hook.
# Usage: ./test-statusline.sh
# Requires: jq, git, stat, setsid
#
# Each case copies the real hook into a fresh temp tree so the hook's SCRIPT_DIR
# resolves to the temp tree, keeping caches and side effects per-case-isolated.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
ORIG_TMPDIR="${TMPDIR:-/tmp}"

PASS=0
FAIL=0
TOTAL=0

# --- stub git (shared, prepended to PATH once) --------------------------------
# Handles: git -C <path> branch --show-current → prints $STUB_BRANCH
# Ignores any other invocation (hook makes no other git call).

STUB_BIN=$(mktemp -d)
cat >"$STUB_BIN/git" <<'STUB'
#!/usr/bin/env bash
set -uo pipefail
# Drop a leading "-C <path>" so we handle: git -C <dir> branch --show-current
if [ "${1:-}" = "-C" ]; then shift 2; fi
case "$*" in
  "branch --show-current")
    printf '%s\n' "${STUB_BRANCH:-}"
    exit 0 ;;
  *)
    exit 0 ;;
esac
STUB
chmod +x "$STUB_BIN/git"
export PATH="$STUB_BIN:$PATH"

# --- per-case setup -----------------------------------------------------------

tmp=""

# setup_case — create a fresh isolated temp tree for one test.
# Copies the real hook so the hook's SCRIPT_DIR resolves inside $tmp.
setup_case() {
  TMPDIR="$ORIG_TMPDIR"
  tmp=$(mktemp -d)

  # Hook lives at $tmp/.claude/hooks/statusline.sh
  mkdir -p "$tmp/.claude/hooks"
  cp "$SCRIPT_DIR/statusline.sh" "$tmp/.claude/hooks/statusline.sh"
  chmod +x "$tmp/.claude/hooks/statusline.sh"

  # Stub dispatch-phase at the path the hook derives from its SCRIPT_DIR:
  #   SCRIPT_DIR/../skills/dispatch/scripts/dispatch-phase
  # = $tmp/.claude/hooks/../skills/dispatch/scripts/dispatch-phase
  # = $tmp/.claude/skills/dispatch/scripts/dispatch-phase
  mkdir -p "$tmp/.claude/skills/dispatch/scripts"
  cat >"$tmp/.claude/skills/dispatch/scripts/dispatch-phase" <<'DPHASE'
#!/usr/bin/env bash
# Sleep first so the hook's synchronous `cat $cache` reads the pre-existing
# cache value, not the just-written one, making case 3 deterministic.
sleep 0.3
if [ "${STUB_FAIL:-0}" = "1" ]; then
  exit 1
fi
printf '%s' "${STUB_PHASE:-implement}"
DPHASE
  chmod +x "$tmp/.claude/skills/dispatch/scripts/dispatch-phase"

  # Point update-rate-limits.sh to a non-existent path under tmp; the hook
  # swallows the error with || true so there is no real side effect.
  export CLAUDE_PROJECT_DIR="$tmp"

  # Cache lives at: $tmp/.claude/hooks/../../tmp/dispatch-phase = $tmp/tmp/dispatch-phase
  # (No pre-seeding by default; individual cases call seed_cache if needed.)
}

# seed_cache <phase> <fresh|stale>
seed_cache() {
  local phase="$1" freshness="$2"
  mkdir -p "$tmp/tmp"
  printf '%s' "$phase" >"$tmp/tmp/dispatch-phase"
  if [ "$freshness" = "stale" ]; then
    touch -d '5 minutes ago' "$tmp/tmp/dispatch-phase"
  fi
  # fresh: leave mtime as now (within TTL)
}

# run_hook — feed JSON on stdin to the copied hook, capture stdout.
# $1: JSON string
run_hook() {
  local json="$1"
  HOOK_OUT=""
  HOOK_OUT=$(printf '%s' "$json" | "$tmp/.claude/hooks/statusline.sh" 2>/dev/null) || true
}

# poll_cache <expected_value> <timeout_seconds>
# Returns 0 when the cache file contains exactly <expected_value>, else 1.
poll_cache() {
  local expected="$1" timeout="${2:-5}"
  local elapsed=0
  while (( elapsed < timeout * 5 )); do
    local got
    got=$(cat "$tmp/tmp/dispatch-phase" 2>/dev/null) || true
    if [ "$got" = "$expected" ]; then
      return 0
    fi
    sleep 0.2
    elapsed=$(( elapsed + 1 ))
  done
  return 1
}

# --- assertions ---------------------------------------------------------------

assert_contains() {
  local desc="$1" pattern="$2" haystack="$3"
  TOTAL=$(( TOTAL + 1 ))
  if printf '%s' "$haystack" | grep -qF -- "$pattern"; then
    PASS=$(( PASS + 1 ))
  else
    FAIL=$(( FAIL + 1 ))
    printf 'FAIL: %s — output should contain %q\n' "$desc" "$pattern"
    printf '    output: %s\n' "$haystack"
  fi
}

assert_not_contains() {
  local desc="$1" pattern="$2" haystack="$3"
  TOTAL=$(( TOTAL + 1 ))
  if ! printf '%s' "$haystack" | grep -qF -- "$pattern"; then
    PASS=$(( PASS + 1 ))
  else
    FAIL=$(( FAIL + 1 ))
    printf 'FAIL: %s — output should NOT contain %q\n' "$desc" "$pattern"
    printf '    output: %s\n' "$haystack"
  fi
}

assert_nonempty() {
  local desc="$1" haystack="$2"
  TOTAL=$(( TOTAL + 1 ))
  if [ -n "$haystack" ]; then
    PASS=$(( PASS + 1 ))
  else
    FAIL=$(( FAIL + 1 ))
    printf 'FAIL: %s — output was empty\n' "$desc"
  fi
}

assert_poll() {
  local desc="$1" expected="$2"
  TOTAL=$(( TOTAL + 1 ))
  if poll_cache "$expected"; then
    PASS=$(( PASS + 1 ))
  else
    local got
    got=$(cat "$tmp/tmp/dispatch-phase" 2>/dev/null) || true
    FAIL=$(( FAIL + 1 ))
    printf 'FAIL: %s — cache never reached %q (got: %q)\n' "$desc" "$expected" "$got"
  fi
}

assert_cache_not_populated() {
  local desc="$1" timeout="${2:-1.5}"
  # Wait a bit longer than the stub's 0.3s sleep + background write time.
  sleep "$timeout"
  TOTAL=$(( TOTAL + 1 ))
  local got
  got=$(cat "$tmp/tmp/dispatch-phase" 2>/dev/null) || true
  if [ -z "$got" ]; then
    PASS=$(( PASS + 1 ))
  else
    FAIL=$(( FAIL + 1 ))
    printf 'FAIL: %s — cache should be empty/missing but contains %q\n' "$desc" "$got"
  fi
}

# --- JSON helpers -------------------------------------------------------------

json_with_tokens() {
  local model="$1" cwd="$2"
  jq -nc \
    --arg m "$model" \
    --arg d "$cwd" \
    '{
      model: {display_name: $m},
      workspace: {current_dir: $d},
      context_window: {
        current_usage: {
          input_tokens: 10000,
          cache_creation_input_tokens: 5000,
          cache_read_input_tokens: 2000
        },
        context_window_size: 200000
      }
    }'
}

json_without_tokens() {
  local model="$1" cwd="$2"
  jq -nc \
    --arg m "$model" \
    --arg d "$cwd" \
    '{
      model: {display_name: $m},
      workspace: {current_dir: $d}
    }'
}

# =============================================================================
# Case 1: branch `main` with token usage — no dispatch segment rendered
# =============================================================================
setup_case
export STUB_BRANCH="main"
unset STUB_PHASE STUB_FAIL 2>/dev/null || true
run_hook "$(json_with_tokens "claude-sonnet-4" "/home/user/project")"
assert_nonempty    "case1: branch main renders model+cwd+tokens" "$HOOK_OUT"
assert_not_contains "case1: branch main has no dispatch segment" "#" "$HOOK_OUT"

# =============================================================================
# Case 2: branch `718-foo`, cache FRESH with `review` — shows cached phase
# =============================================================================
setup_case
export STUB_BRANCH="718-foo"
export STUB_PHASE="review"
unset STUB_FAIL 2>/dev/null || true
seed_cache "review" "fresh"
run_hook "$(json_with_tokens "claude-sonnet-4" "/home/user/project")"
assert_contains "case2: fresh cache shows phase" "#718 review" "$HOOK_OUT"

# =============================================================================
# Case 3: branch `718-foo`, cache STALE with `qa`, stub prints `review` —
#   renders stale value, then background refreshes to `review`
# =============================================================================
setup_case
export STUB_BRANCH="718-foo"
export STUB_PHASE="review"
unset STUB_FAIL 2>/dev/null || true
seed_cache "qa" "stale"
run_hook "$(json_with_tokens "claude-sonnet-4" "/home/user/project")"
assert_contains "case3: stale cache renders stale value immediately" "#718 qa" "$HOOK_OUT"
assert_poll     "case3: background refresh writes new phase to cache" "review"

# =============================================================================
# Case 4: branch `718-foo`, NO cache, stub prints `implement` —
#   no segment rendered now, but cache populated by background process
# =============================================================================
setup_case
export STUB_BRANCH="718-foo"
export STUB_PHASE="implement"
unset STUB_FAIL 2>/dev/null || true
# No seed_cache call — cache does not exist
run_hook "$(json_with_tokens "claude-sonnet-4" "/home/user/project")"
assert_nonempty     "case4: no cache still renders model+cwd+tokens" "$HOOK_OUT"
assert_not_contains "case4: no cache emits no dispatch segment" "#" "$HOOK_OUT"
assert_poll         "case4: background process populates cache" "implement"

# =============================================================================
# Case 5: branch `718-foo`, NO cache, stub FAILS —
#   no segment rendered, cache stays empty after background attempt
# =============================================================================
setup_case
export STUB_BRANCH="718-foo"
export STUB_FAIL="1"
unset STUB_PHASE 2>/dev/null || true
# No seed_cache call — cache does not exist
run_hook "$(json_with_tokens "claude-sonnet-4" "/home/user/project")"
assert_nonempty     "case5: stub fail still renders model+cwd+tokens" "$HOOK_OUT"
assert_not_contains "case5: stub fail emits no dispatch segment" "#" "$HOOK_OUT"
assert_cache_not_populated "case5: failed stub leaves cache empty"

# =============================================================================
# Case 6: branch `718-foo`, NO token usage, fresh cache with `review` —
#   two-segment model|cwd branch taken, dispatch segment appended
# =============================================================================
setup_case
export STUB_BRANCH="718-foo"
export STUB_PHASE="review"
unset STUB_FAIL 2>/dev/null || true
seed_cache "review" "fresh"
run_hook "$(json_without_tokens "claude-sonnet-4" "/home/user/project")"
assert_contains     "case6: no-token branch shows dispatch phase" "#718 review" "$HOOK_OUT"
assert_not_contains "case6: no-token branch omits tokens text" "tokens" "$HOOK_OUT"

# --- Summary ------------------------------------------------------------------

echo ""
echo "Results: $PASS passed, $FAIL failed, $TOTAL total"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo "All tests passed."
