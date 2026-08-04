#!/usr/bin/env bash
# Tests for dispatch-office-hours-strip-hook -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 17526-17704.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-office-hours-strip hook tests
# ============================================================================
echo ""
echo "=== dispatch-office-hours-strip ==="
#
# UserPromptSubmit hook that removes dispatch:office-hours from the worktree's
# PR (or issue if no PR exists). No CLAUDE_JOB_DIR discriminator — a human
# submitting a prompt is the engagement signal regardless of session type.

ohs_setup() {
  TMPDIR_TEST=$(mktemp -d)
  STUB_DIR="$TMPDIR_TEST/stub"
  mkdir -p "$TMPDIR_TEST/hooks" "$TMPDIR_TEST/skills/dispatch-propagate/scripts" \
    "$TMPDIR_TEST/bin" "$STUB_DIR"

  cp "$HOOK_SCRIPT_DIR/dispatch-office-hours-strip.sh" \
    "$TMPDIR_TEST/hooks/dispatch-office-hours-strip.sh"
  chmod +x "$TMPDIR_TEST/hooks/dispatch-office-hours-strip.sh"

  # The hook now sources lib.sh via $SCRIPTS (= TMPDIR_TEST/hooks/../skills/
  # dispatch-propagate/scripts) so gh_issue_remove_label_rest is defined. Stage
  # the REAL lib so the strip actually issues `gh api -X DELETE .../labels/...`.
  cp "$SCRIPT_DIR/lib.sh" \
    "$TMPDIR_TEST/skills/dispatch-propagate/scripts/lib.sh"

  cat > "$TMPDIR_TEST/skills/dispatch-propagate/scripts/dispatch-find-pr" <<'FAKE'
#!/usr/bin/env bash
[[ -f "$STUB_DIR/find-pr-output" ]] && cat "$STUB_DIR/find-pr-output"
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/skills/dispatch-propagate/scripts/dispatch-find-pr"

  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
case "$args" in
  api\ -X\ DELETE\ *labels*)
    # REST label-remove from the real lib.sh's gh_issue_remove_label_rest:
    # `api -X DELETE repos/{owner}/{repo}/issues/<N>/labels/<name>`.
    echo "$args" >> "$STUB_DIR/gh-api-delete.log" ;;
  pr\ edit\ *) echo "$args" >> "$STUB_DIR/gh-pr-edit.log" ;;
  issue\ edit\ *) echo "$args" >> "$STUB_DIR/gh-issue-edit.log" ;;
  *) echo "gh stub: unknown invocation: $args" >&2; exit 1 ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/gh"

  cat > "$TMPDIR_TEST/bin/git" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
case "$args" in
  "rev-parse --abbrev-ref HEAD")
    if [[ -f "$STUB_DIR/current-branch.txt" ]]; then
      cat "$STUB_DIR/current-branch.txt"
    else
      echo "main"
    fi
    ;;
  *) echo "git stub: unknown invocation: $args" >&2; exit 1 ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/git"

  export PATH="$TMPDIR_TEST/bin:$PATH"
  export STUB_DIR
}

ohs_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  STUB_DIR=""
  export PATH="$SAVED_PATH"
}

# --- Test 1: branch <N>-* + PR exists → strip from both PR and issue ----------
# The hook strips from both targets so a stale issue label (applied before the PR
# was opened) is also cleared. The REST helper gh_issue_remove_label_rest is a
# no-op when the label is absent (404 → success). After migration both the PR
# and the issue strip go through `gh api -X DELETE .../issues/<N>/labels/<name>`,
# distinguished only by <N> (456 = PR, 123 = issue). The helper URL-encodes only
# space→%20, so the literal `dispatch:office-hours` (colon unescaped) appears in
# the path.

echo "Test: strip hook on <N>-* branch with PR → strips from both PR and issue"
ohs_setup
echo "123-foo-bar" > "$STUB_DIR/current-branch.txt"
echo "456" > "$STUB_DIR/find-pr-output"
"$TMPDIR_TEST/hooks/dispatch-office-hours-strip.sh" < /dev/null >/dev/null 2>&1
rc=$?
assert_eq "strip: hook exits 0" "0" "$rc"
api_delete_log=$(cat "$STUB_DIR/gh-api-delete.log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$api_delete_log" == *"api -X DELETE repos/{owner}/{repo}/issues/456/labels/dispatch:office-hours"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: strip: REST DELETE issues/456/labels/dispatch:office-hours (PR) was invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: strip: REST DELETE issues/456/labels/dispatch:office-hours (PR) was invoked"
  echo "    api-delete-log: $api_delete_log"
fi
TOTAL=$((TOTAL + 1))
if [[ "$api_delete_log" == *"api -X DELETE repos/{owner}/{repo}/issues/123/labels/dispatch:office-hours"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: strip: REST DELETE issues/123/labels/dispatch:office-hours (issue) also invoked (clears stale issue label)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: strip: REST DELETE issues/123/labels/dispatch:office-hours (issue) also invoked (clears stale issue label)"
  echo "    api-delete-log: $api_delete_log"
fi
ohs_teardown

# --- Test 2: branch <N>-* + no PR → strip from issue -------------------------

echo "Test: strip hook on <N>-* branch with no PR → REST DELETE issues/789/labels/dispatch:office-hours"
ohs_setup
echo "789-bare" > "$STUB_DIR/current-branch.txt"
# No find-pr-output → fall back to issue.
"$TMPDIR_TEST/hooks/dispatch-office-hours-strip.sh" < /dev/null >/dev/null 2>&1
rc=$?
assert_eq "strip (no PR): hook exits 0" "0" "$rc"
api_delete_log=$(cat "$STUB_DIR/gh-api-delete.log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$api_delete_log" == *"api -X DELETE repos/{owner}/{repo}/issues/789/labels/dispatch:office-hours"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: strip (no PR): REST DELETE issues/789/labels/dispatch:office-hours was invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: strip (no PR): REST DELETE issues/789/labels/dispatch:office-hours was invoked"
  echo "    api-delete-log: $api_delete_log"
fi
ohs_teardown

# --- Test 3: branch is not <N>-* → no-op -------------------------------------

echo "Test: strip hook on non-issue branch (main) → no-op (no gh call)"
ohs_setup
echo "main" > "$STUB_DIR/current-branch.txt"
"$TMPDIR_TEST/hooks/dispatch-office-hours-strip.sh" < /dev/null >/dev/null 2>&1
rc=$?
assert_eq "strip (non-issue): hook exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/gh-pr-edit.log" && ! -e "$STUB_DIR/gh-issue-edit.log" \
   && ! -e "$STUB_DIR/gh-api-delete.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: strip (non-issue): no gh call was invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: strip (non-issue): no gh call was invoked"
fi
ohs_teardown

# --- Test: open non-newline stdin → hook returns fast (no 1s read stall) (#1519) ---
echo "Test: strip hook open non-newline stdin → returns fast, still strips label"
ohs_setup
echo "123-foo-bar" > "$STUB_DIR/current-branch.txt"
echo "456" > "$STUB_DIR/find-pr-output"
timeout 0.5 "$TMPDIR_TEST/hooks/dispatch-office-hours-strip.sh" \
  < <(printf '%s' '{"some":"payload"}'; sleep 1) \
  >/dev/null 2>&1
rc=$?
TOTAL=$((TOTAL + 1))
if [[ "$rc" -ne 124 ]]; then
  PASS=$((PASS + 1)); echo "  PASS: strip open-stdin: hook completed before the 0.5s timeout (no 1s read stall)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: strip open-stdin: hook killed at 0.5s — read is still stalling"
fi
# Correctness: the payload is drain-only, so assert the strip still fired.
api_delete_log=$(cat "$STUB_DIR/gh-api-delete.log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$api_delete_log" == *"api -X DELETE repos/{owner}/{repo}/issues/456/labels/dispatch:office-hours"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: strip open-stdin: REST DELETE issues/456/labels (PR) still invoked (drain did not break strip)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: strip open-stdin: REST DELETE issues/456/labels (PR) NOT invoked (drain broke strip)"
  echo "    api-delete-log: $api_delete_log"
fi
TOTAL=$((TOTAL + 1))
if [[ "$api_delete_log" == *"api -X DELETE repos/{owner}/{repo}/issues/123/labels/dispatch:office-hours"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: strip open-stdin: REST DELETE issues/123/labels (issue) still invoked (drain did not break strip)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: strip open-stdin: REST DELETE issues/123/labels (issue) NOT invoked (drain broke strip)"
  echo "    api-delete-log: $api_delete_log"
fi
ohs_teardown

# <<< END MOVED <<<

report_results
