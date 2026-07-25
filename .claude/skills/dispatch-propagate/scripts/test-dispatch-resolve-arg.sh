#!/usr/bin/env bash
# Tests for dispatch-resolve-arg -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 2281-2363.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-resolve-arg tests
# ============================================================================
echo ""
echo "=== dispatch-resolve-arg ==="

# 1. Issue argument → stdout is the number unchanged, exit 0.
echo "Test: issue number → passes through unchanged"
setup
printf '{"number":736,"state":"open"}\n' > "$STUB_DIR/arg-issue-736.json"
result=$("$TMPDIR_TEST/dispatch-resolve-arg" "736")
assert_eq "issue number → passes through" "736" "$result"
teardown

# 2. Leading '#' is tolerated → same resolution as bare number.
echo "Test: leading '#' is stripped and resolves correctly"
setup
printf '{"number":736,"state":"open"}\n' > "$STUB_DIR/arg-issue-736.json"
result=$("$TMPDIR_TEST/dispatch-resolve-arg" "#736")
assert_eq "leading '#' stripped → issue number" "736" "$result"
teardown

# 3. PR closing exactly one issue → stdout is the closing issue number.
# PR 717 closes issue 715.
echo "Test: PR closing one issue → that issue number"
setup
printf '{"number":717,"pull_request":{}}\n' > "$STUB_DIR/arg-issue-717.json"
printf '{"closingIssuesReferences":[{"number":715}]}\n' > "$STUB_DIR/arg-closing-717.json"
result=$("$TMPDIR_TEST/dispatch-resolve-arg" "717")
assert_eq "PR closing one issue → closing issue number" "715" "$result"
teardown

# 4. PR closing zero issues → exit 3.
# arg-closing-718.json explicitly carries an empty array to model zero references.
echo "Test: PR with no closing issue → exit 3"
setup
printf '{"number":718,"pull_request":{}}\n' > "$STUB_DIR/arg-issue-718.json"
printf '{"closingIssuesReferences":[]}\n' > "$STUB_DIR/arg-closing-718.json"
if ( "$TMPDIR_TEST/dispatch-resolve-arg" "718" ) >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "PR closing zero issues → exit 3" "3" "$rc"
teardown

# 5. PR closing multiple issues → exit 4.
echo "Test: PR closing multiple issues → exit 4"
setup
printf '{"number":719,"pull_request":{}}\n' > "$STUB_DIR/arg-issue-719.json"
printf '{"closingIssuesReferences":[{"number":700},{"number":701}]}\n' > "$STUB_DIR/arg-closing-719.json"
if ( "$TMPDIR_TEST/dispatch-resolve-arg" "719" ) >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "PR closing multiple issues → exit 4" "4" "$rc"
teardown

# 6. Number is neither an issue nor a PR (stub 404s) → exit 2.
echo "Test: unknown number → exit 2"
setup
# arg-issue-999.notfound forces the issues GET to a real 404 (the number is
# neither an issue nor a PR), overriding the stub's empty-labels default.
touch "$STUB_DIR/arg-issue-999.notfound"
if ( "$TMPDIR_TEST/dispatch-resolve-arg" "999" ) >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "neither issue nor PR → exit 2" "2" "$rc"
teardown

# 7. Non-numeric argument → exit 1.
echo "Test: non-numeric argument → exit 1"
setup
if ( "$TMPDIR_TEST/dispatch-resolve-arg" "abc" ) >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "non-numeric argument → exit 1" "1" "$rc"
teardown

# 8. Missing argument → exit 1.
echo "Test: missing argument → exit 1"
setup
if ( "$TMPDIR_TEST/dispatch-resolve-arg" ) >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "missing argument → exit 1" "1" "$rc"
teardown

# 9. Non-404 gh failure (auth/network) → exit 1, not misreported as exit 2.
echo "Test: non-404 lookup failure → exit 1"
setup
printf 'gh: HTTP 503: Service unavailable\n' > "$STUB_DIR/arg-issue-998.err"
if ( "$TMPDIR_TEST/dispatch-resolve-arg" "998" ) >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "non-404 lookup failure → exit 1" "1" "$rc"
teardown

# <<< END MOVED <<<

report_results
