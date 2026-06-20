#!/usr/bin/env bash
# Tests for dispatch-write-phase-log flag-value guard (#2132).
#
# AC1: --phase with no value exits 2 with '--phase' in stderr
# AC2: --attempt with no value exits 2 with '--attempt' in stderr
# AC3: valid invocation (--phase qa --attempt 2) exits 0 and POSTs to issues/2132/comments
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
source "$SCRIPT_DIR/test-helpers.sh"
SUT="$SCRIPT_DIR/dispatch-write-phase-log"

# ============================================================================
# AC1: --phase with no following value → exit 2, stderr contains '--phase'
# ============================================================================

echo "AC1: --phase with no value -> exit 2, stderr mentions --phase"

set +e
AC1_STDERR=$(printf 'body\n' | "$SUT" 2132 --phase 2>&1)
AC1_RC=$?
set -e

assert_eq "AC1: exit code is 2" "2" "$AC1_RC"
assert_contains "AC1: stderr mentions --phase" "--phase" "$AC1_STDERR"

# ============================================================================
# AC2: --attempt with no following value → exit 2, stderr contains '--attempt'
# ============================================================================

echo ""
echo "AC2: --attempt with no value -> exit 2, stderr mentions --attempt"

set +e
AC2_STDERR=$(printf 'body\n' | "$SUT" 2132 --phase qa --attempt 2>&1)
AC2_RC=$?
set -e

assert_eq "AC2: exit code is 2" "2" "$AC2_RC"
assert_contains "AC2: stderr mentions --attempt" "--attempt" "$AC2_STDERR"

# ============================================================================
# issue-num 0 → exit 2, stderr mentions 'positive integer' (#2134)
# ============================================================================

echo ""
echo "issue-num 0: exit 2, stderr mentions positive integer"

set +e
ZERO_STDERR=$(printf 'body\n' | "$SUT" 0 --phase plan 2>&1)
ZERO_RC=$?
set -e
assert_eq "issue-num 0: exit code is 2" "2" "$ZERO_RC"
assert_contains "issue-num 0: stderr mentions positive integer" "positive integer" "$ZERO_STDERR"

# ============================================================================
# AC3: valid invocation → exit 0, gh stub records a POST to issues/2132/comments
# ============================================================================

echo ""
echo "AC3: valid invocation -> exit 0, POST to issues/2132/comments"

# Create a temp directory to act as the git repo and stub home.
TMPDIR_TEST="$(mktemp -d)"
GH_LOG="$TMPDIR_TEST/gh-calls.log"

cleanup() {
  rm -rf "$TMPDIR_TEST"
}
trap cleanup EXIT

# Init a git repo in the temp dir and add a remote so git rev-parse and
# git config --get remote.origin.url work when the script calls them.
git init -q "$TMPDIR_TEST"
git -C "$TMPDIR_TEST" remote add origin https://github.com/natb1/commons.systems.git

# Create a stub gh that:
#   - appends its full args to the call log
#   - if args contain --method POST → exit 0 (the create-comment call)
#   - else (the list/get call from dispatch_marker_comment_id) → print []
mkdir -p "$TMPDIR_TEST/bin"
cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
echo "$*" >> "$GH_LOG"
for arg in "$@"; do
  if [[ "$arg" == "POST" ]]; then
    exit 0
  fi
done
# Default: return empty comment list so script takes the POST-fresh-comment branch.
echo "[]"
STUB
chmod +x "$TMPDIR_TEST/bin/gh"

# Export GH_LOG so the stub can append to it.
export GH_LOG

# Export DISPATCH_PLAN_AUTHOR_ID to skip the gh api user call inside
# dispatch_marker_comment_id.
export DISPATCH_PLAN_AUTHOR_ID=123

# Prepend stub bin/ to PATH and run the SUT from inside the temp git repo.
ORIG_PATH="$PATH"
export PATH="$TMPDIR_TEST/bin:$PATH"

set +e
AC3_STDERR=$(cd "$TMPDIR_TEST" && printf 'phase handoff note\n' | "$SUT" 2132 --phase qa --attempt 2 2>&1)
AC3_RC=$?
set -e

export PATH="$ORIG_PATH"

assert_eq "AC3: exit code is 0" "0" "$AC3_RC"

# Verify that the stub gh call log contains a POST to issues/2132/comments.
AC3_LOG=""
if [[ -f "$GH_LOG" ]]; then
  AC3_LOG="$(cat "$GH_LOG")"
fi
assert_contains "AC3: gh called with POST to issues/2132/comments" "issues/2132/comments" "$AC3_LOG"
assert_contains "AC3: gh called with --method POST" "POST" "$AC3_LOG"

report_results
