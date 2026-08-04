#!/usr/bin/env bash
# Tests for lib-gh-repo-from-remote -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 26188-26242.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
echo ""
echo "=== gh_repo_from_remote ==="

# gh_repo_from_remote is pure string logic (no git, no gh), so each case sources
# the real lib.sh in a subshell and calls the helper directly. Success cases
# assert the derived owner/repo; failure cases assert a non-zero return and that
# the caller-name prefix appears in the stderr diagnostic (AC: error messages
# include the caller name).

# Success — HTTPS with .git suffix.
if out=$( source "$SCRIPT_DIR/lib.sh"; gh_repo_from_remote "https://github.com/natb1/commons.systems.git" probe 2>/dev/null ); then rc=0; else rc=$?; fi
assert_eq "gh_repo_from_remote: https .git → owner/repo" "natb1/commons.systems" "$out"
assert_eq "gh_repo_from_remote: https .git → exit 0" "0" "$rc"

# Success — HTTPS without .git suffix.
out=$( source "$SCRIPT_DIR/lib.sh"; gh_repo_from_remote "https://github.com/natb1/commons.systems" probe 2>/dev/null )
assert_eq "gh_repo_from_remote: https no-.git → owner/repo" "natb1/commons.systems" "$out"

# Success — SSH scp-style.
out=$( source "$SCRIPT_DIR/lib.sh"; gh_repo_from_remote "git@github.com:natb1/commons.systems.git" probe 2>/dev/null )
assert_eq "gh_repo_from_remote: ssh → owner/repo" "natb1/commons.systems" "$out"

# Failure — empty URL: non-zero return, caller-prefixed "could not resolve" diagnostic.
if err=$( source "$SCRIPT_DIR/lib.sh"; gh_repo_from_remote "" probe 2>&1 1>/dev/null ); then rc=0; else rc=$?; fi
assert_eq "gh_repo_from_remote: empty URL exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"probe: could not resolve owner/repo"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: gh_repo_from_remote empty URL emits caller-prefixed diagnostic"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: gh_repo_from_remote empty URL emits caller-prefixed diagnostic"
  echo "    actual: '$err'"
fi

# Failure — non-GitHub remote: non-zero return, caller-prefixed not-GitHub diagnostic.
if err=$( source "$SCRIPT_DIR/lib.sh"; gh_repo_from_remote "https://gitlab.com/a/b" probe 2>&1 1>/dev/null ); then rc=0; else rc=$?; fi
assert_eq "gh_repo_from_remote: non-GitHub remote exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"probe: remote is not a GitHub repository"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: gh_repo_from_remote non-GitHub remote emits caller-prefixed diagnostic"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: gh_repo_from_remote non-GitHub remote emits caller-prefixed diagnostic"
  echo "    actual: '$err'"
fi

# Failure — malformed owner/repo (no slash): non-zero return, format diagnostic.
if err=$( source "$SCRIPT_DIR/lib.sh"; gh_repo_from_remote "https://github.com/onlyowner" probe 2>&1 1>/dev/null ); then rc=0; else rc=$?; fi
assert_eq "gh_repo_from_remote: malformed owner/repo exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"probe: unexpected owner/repo format"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: gh_repo_from_remote malformed owner/repo emits caller-prefixed diagnostic"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: gh_repo_from_remote malformed owner/repo emits caller-prefixed diagnostic"
  echo "    actual: '$err'"
fi

# <<< END MOVED <<<

report_results
