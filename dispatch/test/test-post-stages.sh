#!/usr/bin/env bash
# Unit tests for the post-implementation stage helpers in dispatch:
#   - prompt_yes_skip  (A1–A5)
#   - should_run_post_stages  (B1–B5)
#   - structural sequencing of all seven stages  (C1)
#   - mark_pr_ready  (D1a–D1c)
#   - remove_worktree  (E1a–E1b)
#
# Uses two testability hooks added to dispatch/bin/dispatch:
#   1. prompt_is_tty()       — overridden here to return 0 (force interactive
#                              path) or return 1 (force non-TTY path).
#   2. PROMPT_INPUT env var  — redirects read input away from /dev/tty so
#                              scripted bytes can be fed from a temp file.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DISPATCH="$SCRIPT_DIR/../bin/dispatch"

# shellcheck disable=SC1090
source "$DISPATCH"

PASS=0
FAIL=0
TOTAL=0

assert_eq() {
  local label="$1" expected="$2" actual="$3"
  TOTAL=$((TOTAL + 1))
  if [[ "$expected" == "$actual" ]]; then
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label"
    echo "    expected: '$expected'"
    echo "    actual:   '$actual'"
  fi
}

# assert_returns_zero <label> <command...>
assert_returns_zero() {
  local label="$1"; shift
  TOTAL=$((TOTAL + 1))
  if "$@" 2>/dev/null; then
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label (expected exit 0, got non-zero)"
  fi
}

# assert_returns_nonzero <label> <command...>
assert_returns_nonzero() {
  local label="$1"; shift
  TOTAL=$((TOTAL + 1))
  if ! "$@" 2>/dev/null; then
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label (expected non-zero exit, got 0)"
  fi
}

# Shared temp file used by prompt_yes_skip tests via PROMPT_INPUT.
PROMPT_TMP=$(mktemp)
trap 'rm -f "$PROMPT_TMP"' EXIT

# ---------------------------------------------------------------------------
# A. prompt_yes_skip
# ---------------------------------------------------------------------------
echo ""
echo "--- A. prompt_yes_skip ---"

# A1: Enter → yes (return 0)
# printf '\n' writes a single newline; read -n 1 returns empty string → yes.
printf '\n' >"$PROMPT_TMP"
PROMPT_INPUT="$PROMPT_TMP"
export PROMPT_INPUT
prompt_is_tty() { return 0; }
assert_returns_zero "A1: Enter returns 0 (yes)" prompt_yes_skip "Test label?"

# A2: 's' → skip (return 1)
printf 's' >"$PROMPT_TMP"
prompt_is_tty() { return 0; }
assert_returns_nonzero "A2: 's' returns non-zero (skip)" prompt_yes_skip "Test label?"

# A3: 'S' → skip (return 1)
printf 'S' >"$PROMPT_TMP"
prompt_is_tty() { return 0; }
assert_returns_nonzero "A3: 'S' returns non-zero (skip)" prompt_yes_skip "Test label?"

# A4a: unknown then Enter → re-prompts once; Enter on second → yes (return 0)
# Both reads draw from the same file sequentially; first char 'x', second '\n'.
printf 'x\n' >"$PROMPT_TMP"
prompt_is_tty() { return 0; }
assert_returns_zero "A4a: unknown then Enter returns 0 (yes on re-prompt)" prompt_yes_skip "Test label?"

# A4b: two unknowns → second miss → skip (return 1)
printf 'xx' >"$PROMPT_TMP"
prompt_is_tty() { return 0; }
assert_returns_nonzero "A4b: two unknowns returns non-zero (skip on re-prompt miss)" prompt_yes_skip "Test label?"

# A4c: unknown then 's' → skip (return 1)
printf 'xs' >"$PROMPT_TMP"
prompt_is_tty() { return 0; }
assert_returns_nonzero "A4c: unknown then 's' returns non-zero (skip on re-prompt)" prompt_yes_skip "Test label?"

# A5: non-TTY → auto-skip (return 1) without touching PROMPT_INPUT
prompt_is_tty() { return 1; }
assert_returns_nonzero "A5: non-TTY auto-skips (returns non-zero)" prompt_yes_skip "Test label?"

# Restore prompt_is_tty to default after A tests.
prompt_is_tty() { [[ -t 0 ]]; }
unset PROMPT_INPUT

# ---------------------------------------------------------------------------
# B. should_run_post_stages
# ---------------------------------------------------------------------------
echo ""
echo "--- B. should_run_post_stages ---"

B_TMP=$(mktemp -d)

# B1: no state file → skip (return 1)
prompt_is_tty() { return 0; }
assert_returns_nonzero "B1: missing state file returns non-zero" \
  should_run_post_stages "$B_TMP/nonexistent.json"

# B2: phase_signal == "complete" + TTY → run (return 0)
B2_FILE="$B_TMP/b2.json"
printf '{"state":{"phase_signal":"complete"}}\n' >"$B2_FILE"
prompt_is_tty() { return 0; }
assert_returns_zero "B2: phase_signal=complete + TTY returns 0 (run)" \
  should_run_post_stages "$B2_FILE"

# B3: phase_signal == "incomplete" → skip (return 1)
B3_FILE="$B_TMP/b3.json"
printf '{"state":{"phase_signal":"incomplete"}}\n' >"$B3_FILE"
prompt_is_tty() { return 0; }
assert_returns_nonzero "B3: phase_signal=incomplete returns non-zero" \
  should_run_post_stages "$B3_FILE"

# B4: state file missing phase_signal key → skip (return 1)
B4_FILE="$B_TMP/b4.json"
printf '{"state":{}}\n' >"$B4_FILE"
prompt_is_tty() { return 0; }
assert_returns_nonzero "B4: missing phase_signal key returns non-zero" \
  should_run_post_stages "$B4_FILE"

# B5: TTY false → skip even when phase_signal == "complete"
B5_FILE="$B_TMP/b5.json"
printf '{"state":{"phase_signal":"complete"}}\n' >"$B5_FILE"
prompt_is_tty() { return 1; }
assert_returns_nonzero "B5: non-TTY returns non-zero even with phase_signal=complete" \
  should_run_post_stages "$B5_FILE"

rm -rf "$B_TMP"
# Restore default.
prompt_is_tty() { [[ -t 0 ]]; }

# ---------------------------------------------------------------------------
# C. Sequencing — all seven stage prompts are present and ordered
# ---------------------------------------------------------------------------
echo ""
echo "--- C. stage sequencing (structural) ---"

# Extract the first line number where each expected label appears in dispatch.
# All seven must be present and in the correct order.
declare -a LABELS=(
  "Run dispatch-qa?"
  "Run claude /simplify?"
  "Run claude /review?"
  "Run claude /ultrareview?"
  "Run claude /security-review?"
  "Mark PR ready for review?"
  "Remove local worktree?"
)
declare -a LINE_NUMS=()
all_found=1
for label in "${LABELS[@]}"; do
  # Match only lines that call prompt_yes_skip with the label (not comments).
  lineno=$(grep -n "prompt_yes_skip.*${label}" "$DISPATCH" | head -1 | cut -d: -f1)
  if [[ -z "$lineno" ]]; then
    all_found=0
    echo "  FAIL: C1 — prompt_yes_skip call not found in dispatch for label: '$label'"
    FAIL=$((FAIL + 1))
    TOTAL=$((TOTAL + 1))
  else
    LINE_NUMS+=("$lineno")
  fi
done

if [[ "$all_found" -eq 1 ]]; then
  TOTAL=$((TOTAL + 1))
  # Verify that line numbers are strictly increasing (preserves order).
  in_order=1
  for ((i = 1; i < ${#LINE_NUMS[@]}; i++)); do
    if [[ "${LINE_NUMS[$i]}" -le "${LINE_NUMS[$((i-1))]}" ]]; then
      in_order=0
      break
    fi
  done
  if [[ "$in_order" -eq 1 ]]; then
    PASS=$((PASS + 1))
    echo "  PASS: C1: all seven stage labels present in correct order (lines: ${LINE_NUMS[*]})"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: C1: stage labels out of order (lines: ${LINE_NUMS[*]})"
  fi
fi

# C2: launch_claude_stage must not redirect stdin — Claude's TUI requires an
# RW tty on fd 0 for raw mode (cf. #576 bug fix).
TOTAL=$((TOTAL + 1))
fn_body=$(awk '/^launch_claude_stage\(\)/,/^}/' "$DISPATCH")
if grep -qE '<\s*/dev/tty|<&\s*[0-9]' <<<"$fn_body"; then
  FAIL=$((FAIL + 1))
  echo "  FAIL: C2 — launch_claude_stage redirects stdin (breaks claude TUI raw mode)"
else
  PASS=$((PASS + 1))
  echo "  PASS: C2: launch_claude_stage does not redirect stdin"
fi

# ---------------------------------------------------------------------------
# D. mark_pr_ready
# ---------------------------------------------------------------------------
echo ""
echo "--- D. mark_pr_ready ---"

# PATH-injected gh stub. Behaviour driven by:
#   STUB_GH_PR_VIEW   — "success" | "not-found" (default: "success")
#   STUB_GH_PR_NUMBER — PR number string to return on view success (default: "42")
#   STUB_GH_PR_READY  — "success" | "fail" (default: "success")
D_STUB_DIR=$(mktemp -d)
cat >"$D_STUB_DIR/gh" <<'GHSTUB'
#!/usr/bin/env bash
# Test stub for `gh` used by mark_pr_ready tests.
case "$1 $2" in
  "pr view")
    case "${STUB_GH_PR_VIEW:-success}" in
      success)
        printf '%s\n' "${STUB_GH_PR_NUMBER:-42}"
        exit 0
        ;;
      not-found)
        echo "no pull requests found" >&2
        exit 1
        ;;
      *)
        echo "stub gh: unknown STUB_GH_PR_VIEW='${STUB_GH_PR_VIEW}'" >&2
        exit 2
        ;;
    esac
    ;;
  "pr ready")
    case "${STUB_GH_PR_READY:-success}" in
      success)
        exit 0
        ;;
      fail)
        echo "gh pr ready failed" >&2
        exit 1
        ;;
      *)
        echo "stub gh: unknown STUB_GH_PR_READY='${STUB_GH_PR_READY}'" >&2
        exit 2
        ;;
    esac
    ;;
  *)
    echo "stub gh: unexpected invocation: $*" >&2
    exit 2
    ;;
esac
GHSTUB
chmod +x "$D_STUB_DIR/gh"

ORIGINAL_PATH="$PATH"
PATH="$D_STUB_DIR:$ORIGINAL_PATH"

# D1a: no PR found → mark_pr_ready returns non-zero
export STUB_GH_PR_VIEW=not-found
unset STUB_GH_PR_NUMBER STUB_GH_PR_READY
assert_returns_nonzero "D1a: no PR found returns non-zero" mark_pr_ready "test-branch"

# D1b: gh pr view succeeds but gh pr ready fails → returns non-zero
export STUB_GH_PR_VIEW=success
export STUB_GH_PR_NUMBER=77
export STUB_GH_PR_READY=fail
assert_returns_nonzero "D1b: gh pr ready fails returns non-zero" mark_pr_ready "test-branch"

# D1c: both calls succeed → returns 0
export STUB_GH_PR_VIEW=success
export STUB_GH_PR_NUMBER=42
export STUB_GH_PR_READY=success
assert_returns_zero "D1c: success returns 0" mark_pr_ready "test-branch"

PATH="$ORIGINAL_PATH"
rm -rf "$D_STUB_DIR"
unset STUB_GH_PR_VIEW STUB_GH_PR_NUMBER STUB_GH_PR_READY

# ---------------------------------------------------------------------------
# E. remove_worktree
# ---------------------------------------------------------------------------
echo ""
echo "--- E. remove_worktree ---"

# PATH-injected git stub. Behaviour driven by:
#   STUB_GIT_WT_REMOVE — "success" | "fail" (default: "success")
# The stub also fails loudly with exit 99 if `--force` is ever passed —
# that property is part of the design (no silent retry), so violating it
# must surface as a test failure, not a passing test.
E_STUB_DIR=$(mktemp -d)
cat >"$E_STUB_DIR/git" <<'GITSTUB'
#!/usr/bin/env bash
case "$1 $2" in
  "worktree remove")
    for arg in "$@"; do
      if [[ "$arg" == "--force" || "$arg" == "-f" ]]; then
        echo "stub git: --force passed to git worktree remove (forbidden by design)" >&2
        exit 99
      fi
    done
    case "${STUB_GIT_WT_REMOVE:-success}" in
      success)
        exit 0
        ;;
      fail)
        echo "fatal: '$3' contains modified or untracked files, use --force to delete it" >&2
        exit 1
        ;;
      *)
        echo "stub git: unknown STUB_GIT_WT_REMOVE='${STUB_GIT_WT_REMOVE}'" >&2
        exit 2
        ;;
    esac
    ;;
  *)
    echo "stub git: unexpected invocation: $*" >&2
    exit 2
    ;;
esac
GITSTUB
chmod +x "$E_STUB_DIR/git"

ORIGINAL_PATH="$PATH"
PATH="$E_STUB_DIR:$ORIGINAL_PATH"

# E1a: success → returns 0
export STUB_GIT_WT_REMOVE=success
assert_returns_zero "E1a: git worktree remove succeeds returns 0" \
  remove_worktree "/some/worktree/path"

# E1b: dirty refusal → returns non-zero (and stub asserts no --force retry)
export STUB_GIT_WT_REMOVE=fail
assert_returns_nonzero "E1b: dirty refusal returns non-zero (no --force retry)" \
  remove_worktree "/some/worktree/path"

PATH="$ORIGINAL_PATH"
rm -rf "$E_STUB_DIR"
unset STUB_GIT_WT_REMOVE

# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------
echo ""
echo "================================"
echo "Results: $PASS/$TOTAL passed, $FAIL failed"
echo "================================"
[[ "$FAIL" -eq 0 ]]
