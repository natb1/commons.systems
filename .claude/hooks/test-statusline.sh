#!/usr/bin/env bash
# Test suite for statusline.sh hook.
# Usage: ./test-statusline.sh
# Requires: jq, git, awk
#
# Each case copies the real hook into a fresh temp tree so the hook's SCRIPT_DIR
# resolves to the temp tree, keeping side effects per-case-isolated.
#
# The dispatch-phase segment is graph-native (Unit 2 of
# tactic-dispatch-legacy-rewire): the hook reads the persisted `phase:` from
# intentions/<branch>.md in the worktree — a local, instant read with NO `gh`,
# NO cache, and NO background process. These tests exercise that read and the
# non-node fallbacks (legacy <N>-… branch, main, missing node file, null phase).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
ORIG_TMPDIR="${TMPDIR:-/tmp}"

PASS=0
FAIL=0
TOTAL=0

# --- stub git (shared, prepended to PATH once) --------------------------------
# Handles two invocations the hook makes:
#   git -C <path> rev-parse --show-toplevel → prints $STUB_TOPLEVEL
#   git -C <path> branch --show-current     → prints $STUB_BRANCH
# Ignores any other invocation.

STUB_BIN=$(mktemp -d)
cat >"$STUB_BIN/git" <<'STUB'
#!/usr/bin/env bash
set -uo pipefail
# Drop a leading "-C <path>" so we handle: git -C <dir> <subcommand>
if [ "${1:-}" = "-C" ]; then shift 2; fi
case "$*" in
  "rev-parse --show-toplevel")
    if [ -n "${STUB_TOPLEVEL:-}" ]; then
      printf '%s\n' "$STUB_TOPLEVEL"
      exit 0
    fi
    exit 1 ;;
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

# Remove the shared stub-git dir and the last per-case temp tree on exit;
# setup_case discards each prior tree as it creates the next.
trap 'rm -rf "$STUB_BIN" "$tmp" 2>/dev/null || true' EXIT

# setup_case — create a fresh isolated temp tree for one test.
# Copies the real hook so the hook's SCRIPT_DIR resolves inside $tmp, and points
# STUB_TOPLEVEL at $tmp so the hook reads intentions/<branch>.md from $tmp.
setup_case() {
  [ -n "$tmp" ] && rm -rf "$tmp"   # discard the previous case's temp tree
  TMPDIR="$ORIG_TMPDIR"
  tmp=$(mktemp -d)

  # Hook lives at $tmp/.claude/hooks/statusline.sh
  mkdir -p "$tmp/.claude/hooks"
  cp "$SCRIPT_DIR/statusline.sh" "$tmp/.claude/hooks/statusline.sh"
  chmod +x "$tmp/.claude/hooks/statusline.sh"

  # intentions/ dir where the hook looks for the node record.
  mkdir -p "$tmp/intentions"

  # Point update-rate-limits.sh to a non-existent path under tmp; the hook
  # swallows the error with || true so there is no real side effect.
  export CLAUDE_PROJECT_DIR="$tmp"

  # STUB_TOPLEVEL is the worktree root the hook derives intentions/ from.
  export STUB_TOPLEVEL="$tmp"

  # Reset stub vars to defaults so a previous case's overrides never leak.
  export STUB_BRANCH="main"
}

# write_node <branch> <phase-line>
# Write intentions/<branch>.md with a frontmatter block carrying <phase-line>
# verbatim (e.g. "phase: review", "phase: null", or "" to omit the key).
write_node() {
  local branch="$1" phase_line="$2"
  {
    printf '%s\n' '---'
    printf '%s\n' "id: $branch"
    printf '%s\n' 'kind: tactic'
    [ -n "$phase_line" ] && printf '%s\n' "$phase_line"
    printf '%s\n' '---'
    printf '%s\n' ''
    printf '%s\n' 'Body text with a decoy phase: not-this in it.'
  } >"$tmp/intentions/$branch.md"
}

# run_hook — feed JSON on stdin to the copied hook, capture stdout with ANSI
# escape sequences stripped. The visible line wraps every segment in color codes
# (e.g. ESC[36m … ESC[0m); those codes themselves contain `[`, so they are
# removed here to leave the `[phase]` dispatch sentinel as the sole `[` in the
# asserted text.
run_hook() {
  local json="$1" raw
  HOOK_OUT=""
  raw=$(printf '%s' "$json" | "$tmp/.claude/hooks/statusline.sh" 2>/dev/null) || true
  HOOK_OUT=$(printf '%s' "$raw" | sed $'s/\033\\[[0-9;]*m//g')
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

# current_usage present (so the hook enters the token branch) but
# context_window_size is either 0 or absent (jq -r renders a missing/null key
# as the literal string "null") — the two shapes #2260-style silently
# division-by-zero / arithmetic-error the old `pct=$((current * 100 /
# ctx_size))` line.
json_with_zero_ctx() {
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
        context_window_size: 0
      }
    }'
}

json_with_null_ctx() {
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
        context_window_size: null
      }
    }'
}

# =============================================================================
# Case 1: branch `main` — no dispatch segment (model+cwd+tokens still render)
# =============================================================================
setup_case
export STUB_BRANCH="main"
run_hook "$(json_with_tokens "claude-sonnet-4" "/home/user/project")"
assert_nonempty    "case1: branch main renders model+cwd+tokens" "$HOOK_OUT"
assert_not_contains "case1: branch main has no dispatch segment" "[" "$HOOK_OUT"

# =============================================================================
# Case 2: node branch with `phase: review` — shows the persisted phase
# =============================================================================
setup_case
export STUB_BRANCH="tactic-foo-bar"
write_node "tactic-foo-bar" "phase: review"
run_hook "$(json_with_tokens "claude-sonnet-4" "/home/user/project")"
assert_contains     "case2: node phase shown" "[review]" "$HOOK_OUT"
assert_not_contains "case2: body decoy phase not read" "not-this" "$HOOK_OUT"

# =============================================================================
# Case 3: node branch with a quoted phase value — quotes are stripped
# =============================================================================
setup_case
export STUB_BRANCH="tactic-quoted"
write_node "tactic-quoted" 'phase: "implement"'
run_hook "$(json_with_tokens "claude-sonnet-4" "/home/user/project")"
assert_contains     "case3: dispatch segment present" "[implement]" "$HOOK_OUT"
assert_contains     "case3: phase value shown" "[implement]" "$HOOK_OUT"
assert_not_contains "case3: no literal quote in output" '"implement"' "$HOOK_OUT"

# =============================================================================
# Case 4: node branch with `phase: null` — no dispatch segment
# =============================================================================
setup_case
export STUB_BRANCH="tactic-parked"
write_node "tactic-parked" "phase: null"
run_hook "$(json_with_tokens "claude-sonnet-4" "/home/user/project")"
assert_nonempty     "case4: null phase still renders model+cwd+tokens" "$HOOK_OUT"
assert_not_contains "case4: null phase emits no dispatch segment" "[" "$HOOK_OUT"

# =============================================================================
# Case 5: node branch with NO phase key — no dispatch segment
# =============================================================================
setup_case
export STUB_BRANCH="tactic-nophase"
write_node "tactic-nophase" ""
run_hook "$(json_with_tokens "claude-sonnet-4" "/home/user/project")"
assert_not_contains "case5: missing phase key emits no dispatch segment" "[" "$HOOK_OUT"

# =============================================================================
# Case 6: legacy `<N>-…` issue branch (no node file) — fallback: no segment,
#   and NO `gh` is consulted (the read is purely local).
# =============================================================================
setup_case
export STUB_BRANCH="718-foo"
# No write_node — intentions/718-foo.md does not exist.
run_hook "$(json_with_tokens "claude-sonnet-4" "/home/user/project")"
assert_nonempty     "case6: legacy branch still renders model+cwd+tokens" "$HOOK_OUT"
assert_not_contains "case6: legacy branch emits no dispatch segment" "[" "$HOOK_OUT"

# =============================================================================
# Case 7: node branch, NO token usage — two-segment model|cwd, phase appended
# =============================================================================
setup_case
export STUB_BRANCH="tactic-notok"
write_node "tactic-notok" "phase: qa"
run_hook "$(json_without_tokens "claude-sonnet-4" "/home/user/project")"
assert_contains     "case7: no-token branch shows dispatch phase" "[qa]" "$HOOK_OUT"
assert_not_contains "case7: no-token branch omits tokens text" "tokens" "$HOOK_OUT"

# =============================================================================
# Case 8: git rev-parse --show-toplevel fails (not a worktree) — no segment,
#   other segments still render.
# =============================================================================
setup_case
export STUB_BRANCH="tactic-foo-bar"
write_node "tactic-foo-bar" "phase: review"
export STUB_TOPLEVEL=""     # rev-parse --show-toplevel now exits non-zero
run_hook "$(json_with_tokens "claude-sonnet-4" "/home/user/project")"
assert_nonempty     "case8: toplevel failure still renders model+cwd+tokens" "$HOOK_OUT"
assert_not_contains "case8: toplevel failure emits no dispatch segment" "[" "$HOOK_OUT"

# =============================================================================
# Case 9: context_window_size: 0 with current_usage present — must NOT crash
# on a division-by-zero; falls back to the no-usage (model-only) rendering.
# Before the fix, `pct=$((current * 100 / ctx_size))` aborted the whole script
# on this input — bash treats division by zero in arithmetic as fatal even
# without `set -e` — so NOTHING rendered, not even the model segment. That is
# the fail-open posture violation this case guards.
# =============================================================================
setup_case
export STUB_BRANCH="main"
run_hook "$(json_with_zero_ctx "claude-sonnet-4" "/home/user/project")"
assert_nonempty     "case9: zero ctx_size still renders (does not crash silent)" "$HOOK_OUT"
assert_contains     "case9: zero ctx_size falls back to model-only" "claude-sonnet-4" "$HOOK_OUT"
assert_not_contains "case9: zero ctx_size omits a bogus tokens line" "tokens" "$HOOK_OUT"

# =============================================================================
# Case 10: context_window_size missing/null with current_usage present — same
# fallback. jq -r renders a null/missing key as the literal string "null",
# which made the old arithmetic a non-numeric operand instead of a numeric
# zero, but it is fatal for the identical reason.
# =============================================================================
setup_case
export STUB_BRANCH="main"
run_hook "$(json_with_null_ctx "claude-sonnet-4" "/home/user/project")"
assert_nonempty     "case10: null ctx_size still renders (does not crash silent)" "$HOOK_OUT"
assert_contains     "case10: null ctx_size falls back to model-only" "claude-sonnet-4" "$HOOK_OUT"
assert_not_contains "case10: null ctx_size omits a bogus tokens line" "tokens" "$HOOK_OUT"

# --- Summary ------------------------------------------------------------------

echo ""
echo "Results: $PASS passed, $FAIL failed, $TOTAL total"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo "All tests passed."
