#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

STAMP_SCRIPT="$SCRIPT_DIR/intention-stamp-node"

TMPDIR_TEST=""
SAVED_PATH=""

# We keep the gh stub as a separate file so the Write avoids heredoc
# history-expansion issues with '!' in the test runner's zsh shell.
# Named without the test- prefix so it is not picked up by CI's test-*.sh glob.
GH_STUB_SRC="$SCRIPT_DIR/intention-stamp-gh-stub.sh"

setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/bin" "$TMPDIR_TEST/stub"

  # Install the pre-written stub as 'gh' on PATH
  cp "$GH_STUB_SRC" "$TMPDIR_TEST/bin/gh"
  chmod +x "$TMPDIR_TEST/bin/gh"

  SAVED_PATH="$PATH"
  export PATH="$TMPDIR_TEST/bin:$PATH"
  # Set author-id so dispatch_marker_comment_id skips 'gh api user' entirely
  export DISPATCH_PLAN_AUTHOR_ID=12345
  # Point stub at the right stub dir
  export STUB_DIR="$TMPDIR_TEST/stub"
}

teardown() {
  export PATH="$SAVED_PATH"
  unset DISPATCH_PLAN_AUTHOR_ID STUB_DIR 2>/dev/null || true
  unset STUB_EXISTING 2>/dev/null || true
  unset STUB_MIDLINE 2>/dev/null || true
  if [[ -n "${TMPDIR_TEST:-}" ]]; then
    rm -rf "$TMPDIR_TEST"
    TMPDIR_TEST=""
  fi
}
trap '[[ -n "${TMPDIR_TEST:-}" ]] && rm -rf "$TMPDIR_TEST"' EXIT

# ---------------------------------------------------------------------------
# Test 1: arg validation — bad issue number (non-integer)
# ---------------------------------------------------------------------------
echo "Test 1: bad issue number exits non-zero"
setup
exit_code=0
"$STAMP_SCRIPT" abc goal-foo 2>/dev/null || exit_code=$?
assert_eq "exits with code 2" "2" "$exit_code"
teardown

# ---------------------------------------------------------------------------
# Test 2: arg validation — path traversal in node-id
# ---------------------------------------------------------------------------
echo "Test 2: path traversal in node-id exits non-zero"
setup
exit_code=0
"$STAMP_SCRIPT" 5 "../evil" 2>/dev/null || exit_code=$?
assert_eq "exits with code 2" "2" "$exit_code"
teardown

# ---------------------------------------------------------------------------
# Test 3: arg validation — slash in node-id
# ---------------------------------------------------------------------------
echo "Test 3: slash in node-id exits non-zero"
setup
exit_code=0
"$STAMP_SCRIPT" 5 "parent/child" 2>/dev/null || exit_code=$?
assert_eq "exits with code 2" "2" "$exit_code"
teardown

# ---------------------------------------------------------------------------
# Test 4: POST branch — no existing marker comment
# ---------------------------------------------------------------------------
echo "Test 4: POST branch (no existing comment)"
setup
exit_code=0
"$STAMP_SCRIPT" 5 goal-foo 2>/dev/null || exit_code=$?
assert_eq "exits 0" "0" "$exit_code"
assert_eq "recorded method is POST" "POST" "$(cat "$TMPDIR_TEST/stub/posted-method.txt")"
body_line1="$(head -1 "$TMPDIR_TEST/stub/posted-body.txt")"
body_line2="$(sed -n '2p' "$TMPDIR_TEST/stub/posted-body.txt")"
assert_eq "body line 1 is marker" "<!-- intention:node-id -->" "$body_line1"
assert_eq "body line 2 is node-id" "goal-foo" "$body_line2"
teardown

# ---------------------------------------------------------------------------
# Test 5: PATCH branch — existing matching marker comment
# ---------------------------------------------------------------------------
echo "Test 5: PATCH branch (existing matching comment)"
setup
export STUB_EXISTING=1
exit_code=0
"$STAMP_SCRIPT" 5 goal-bar 2>/dev/null || exit_code=$?
assert_eq "exits 0" "0" "$exit_code"
assert_eq "recorded method is PATCH" "PATCH" "$(cat "$TMPDIR_TEST/stub/posted-method.txt")"
teardown

# ---------------------------------------------------------------------------
# Test 6: startswith-anchoring — mid-line mention does NOT match → POST
# The comment in this scenario has author.id == 12345, so author is NOT the
# discriminator. Only startswith anchoring prevents a match.
# ---------------------------------------------------------------------------
echo "Test 6: mid-line marker mention does NOT match (startswith anchoring), takes POST"
setup
export STUB_MIDLINE=1
exit_code=0
"$STAMP_SCRIPT" 5 goal-foo 2>/dev/null || exit_code=$?
assert_eq "exits 0" "0" "$exit_code"
assert_eq "took POST branch (startswith anchoring)" "POST" "$(cat "$TMPDIR_TEST/stub/posted-method.txt")"
teardown

# ---------------------------------------------------------------------------
# Test 7: --read mode returns the stamped node-id through the real jq split filter
# ---------------------------------------------------------------------------
echo "Test 7: --read mode returns the stamped node-id through the real jq split filter"
setup
export STUB_EXISTING=1        # keep set for the WHOLE test so the read path resolves CID 777
exit_code=0
"$STAMP_SCRIPT" 5 goal-roundtrip 2>/dev/null || exit_code=$?   # LIST returns existing comment 777 → PATCH branch → writes posted-body.txt
assert_eq "stamp exits 0" "0" "$exit_code"
exit_code=0
output="$("$STAMP_SCRIPT" --read 5 2>/dev/null)" || exit_code=$?   # LIST resolves CID 777 → GET on comments/777 → stateful handler runs real --jq '.body | split("\n")[1]'
assert_eq "read exits 0" "0" "$exit_code"
assert_eq "read returns the stamped node-id" "goal-roundtrip" "$output"
teardown

report_results
