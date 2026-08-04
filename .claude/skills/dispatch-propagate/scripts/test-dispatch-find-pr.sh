#!/usr/bin/env bash
# Tests for dispatch-find-pr -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 1645-1818.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-find-pr tests
# ============================================================================
echo ""
echo "=== dispatch-find-pr ==="

# 1. Matching branch prefix + matching title → prints PR number.
echo "Test: matching branch prefix + matching title → PR number"
setup
printf '[{"number":42,"headRefName":"42-my-feature","title":"feature: 42 something"}]\n' \
  > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-find-pr" "42")
assert_eq "matching branch prefix + matching title → PR number" "42" "$result"
teardown

# 2. Matching branch prefix + non-matching title → still prints PR number (the #670 case).
# The script never reads title — that's the point; this is the regression case from #673.
echo "Test: matching branch prefix + non-matching title → PR number (#670 case)"
setup
printf '[{"number":670,"headRefName":"669-budget-sankey","title":"budget: use schemeTableau10 in sankey chart"}]\n' \
  > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-find-pr" "669")
assert_eq "matching branch prefix, non-matching title → PR number" "670" "$result"
teardown

# 3. No PR → prints empty.
echo "Test: no PR → empty"
setup
printf '[]\n' > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-find-pr" "42")
assert_eq "no PR → empty output" "" "$result"
teardown

# 4. DISPATCH_PR_LIST_FILE overrides self-fetch.
# pr-list-full.json is empty: a self-fetch would yield empty. The PR lives only
# in the file channel, so a non-empty result proves it won.
echo "Test: DISPATCH_PR_LIST_FILE overrides self-fetch"
setup
printf '[]\n' > "$STUB_DIR/pr-list-full.json"
PR_LIST_F=$(pr_list_tmpfile '[{"number":670,"headRefName":"669-x"}]')
result=$(DISPATCH_PR_LIST_FILE="$PR_LIST_F" "$TMPDIR_TEST/dispatch-find-pr" "669")
assert_eq "DISPATCH_PR_LIST_FILE used over self-fetch → PR number" "670" "$result"
teardown

# 5. Issue-prefix disambiguation: issue 6 must not match branch "60-foo".
# The trailing "-" in the startswith match is what prevents the collision.
echo "Test: issue 6 does not match branch 60-foo"
setup
printf '[{"number":10,"headRefName":"60-foo"}]\n' > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-find-pr" "6")
assert_eq "issue 6 does not match branch 60-foo → empty" "" "$result"
teardown

# 6. Flake recovery: first pr list call is empty, second returns the PR.
# Models gh pr list flaking (exit 0 + []) on call 1 and returning the real list
# on call 2. The retry-on-empty should produce the PR number.
echo "Test: flake recovery — empty first call, PR on retry → PR number"
setup
printf '[]\n' > "$STUB_DIR/pr-list-full.json"
printf '[{"number":820,"headRefName":"820-x"}]\n' > "$STUB_DIR/pr-list-retry.json"
result=$("$TMPDIR_TEST/dispatch-find-pr" "820")
assert_eq "flake recovery → PR number" "820" "$result"
teardown

# 7. Cross-check fallback: pr list yields empty on both attempts, but the
# issue's closedByPullRequestsReferences lists an OPEN PR. This covers the
# case where the branch was renamed away from the <issue>- convention.
echo "Test: cross-check fallback — issue references an OPEN PR → PR number"
setup
printf '[]\n' > "$STUB_DIR/pr-list-full.json"
printf '{"closedByPullRequestsReferences":[{"number":830,"state":"OPEN"}]}\n' \
  > "$STUB_DIR/issue-closing-prs-822.json"
result=$("$TMPDIR_TEST/dispatch-find-pr" "822")
assert_eq "cross-check OPEN reference → PR number" "830" "$result"
teardown

# 8. Cross-check ignores non-OPEN references. The script's contract is "open
# PR for issue N or empty"; a MERGED reference must not be reported.
echo "Test: cross-check ignores MERGED reference → empty"
setup
printf '[]\n' > "$STUB_DIR/pr-list-full.json"
printf '{"closedByPullRequestsReferences":[{"number":840,"state":"MERGED"}]}\n' \
  > "$STUB_DIR/issue-closing-prs-822.json"
result=$("$TMPDIR_TEST/dispatch-find-pr" "822")
assert_eq "cross-check MERGED reference → empty" "" "$result"
teardown

# 9. Genuine empty: pr list empty on both attempts AND issue references no
# PR. Output stays empty, exit 0 — the "no PR exists" answer.
echo "Test: genuine empty (no PR, no references) → empty"
setup
printf '[]\n' > "$STUB_DIR/pr-list-full.json"
printf '{"closedByPullRequestsReferences":[]}\n' \
  > "$STUB_DIR/issue-closing-prs-822.json"
result=$("$TMPDIR_TEST/dispatch-find-pr" "822")
assert_eq "genuine empty → empty" "" "$result"
teardown

# 10. DISPATCH_PR_LIST_FILE supplied without matching branch; cross-check resolves PR.
# The retry (step 1) is skipped when DISPATCH_PR_LIST_FILE is set — the caller owns
# the list. The cross-check (step 2) still runs regardless, using a different gh
# endpoint that the caller cannot pre-supply.
echo "Test: DISPATCH_PR_LIST_FILE no match + cross-check OPEN reference → PR number"
setup
printf '[{"number":850,"headRefName":"999-unrelated"}]\n' > "$STUB_DIR/pr-list-full.json"
printf '{"closedByPullRequestsReferences":[{"number":851,"state":"OPEN"}]}\n' \
  > "$STUB_DIR/issue-closing-prs-822.json"
PR_LIST_F=$(pr_list_tmpfile '[{"number":850,"headRefName":"999-unrelated"}]')
result=$(DISPATCH_PR_LIST_FILE="$PR_LIST_F" \
  "$TMPDIR_TEST/dispatch-find-pr" "822")
assert_eq "DISPATCH_PR_LIST_FILE no prefix match; cross-check finds OPEN PR → PR number" "851" "$result"
# Verify no self-fetch: pr_list_open (number,headRefName) was not called.
if [[ -f "$STUB_DIR/gh-find-pr-calls.log" ]]; then
  call_count=$(wc -l < "$STUB_DIR/gh-find-pr-calls.log")
else
  call_count=0
fi
assert_eq "no self-fetch gh pr list calls when DISPATCH_PR_LIST_FILE set" "0" "$call_count"
teardown

# 11. #1312: No truncation past 30 PRs (proves the --limit 300 fix).
# Before the fix, gh pr list defaulted to --limit 30, so PR 33 of 35 open PRs
# would be silently omitted and dispatch-find-pr would return empty.  With
# --limit 300, the stub case "pr list --state open --limit 300 --json
# number,headRefName" serves all 35 entries from pr-list-full.json, so PR 33
# is found on the first fetch.
echo "Test: #1312 dispatch-find-pr resolves PR 33 of 35 open PRs (no truncation)"
setup
jq -nc '[range(1;36) | {number: ., headRefName: (tostring + "-feature")}]' \
  > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-find-pr" "33")
assert_eq "#1312: dispatch-find-pr resolves PR 33 of 35 open PRs (no truncation)" "33" "$result"
teardown

# 12. #1312: Loud truncation guard fires when result length equals the limit.
# With DISPATCH_PR_LIST_LIMIT=5 the stub returns exactly 5 PRs, which equals
# the limit.  pr_list_open must exit non-zero and write "likely truncated" to
# stderr so the failure is never silent.
echo "Test: #1312 pr_list_open exits non-zero and logs loudly when result length equals the limit"
setup
if err=$(DISPATCH_PR_LIST_LIMIT=5 bash -c \
    'source "'"$TMPDIR_TEST"'/lib.sh" && pr_list_open "number,headRefName"' \
    2>&1 1>/dev/null); then
  rc=0
else
  rc=$?
fi
if [[ "$rc" -ne 0 ]]; then
  PASS=$((PASS + 1))
  TOTAL=$((TOTAL + 1))
  echo "  PASS: #1312: pr_list_open exits non-zero when result length equals the limit"
else
  FAIL=$((FAIL + 1))
  TOTAL=$((TOTAL + 1))
  echo "  FAIL: #1312: pr_list_open exits non-zero when result length equals the limit"
  echo "    expected: non-zero exit"
  echo "    actual:   exit 0"
fi
case "$err" in
  *"likely truncated"*)
    PASS=$((PASS + 1))
    TOTAL=$((TOTAL + 1))
    echo "  PASS: #1312: pr_list_open writes a loud truncation error to stderr"
    ;;
  *)
    FAIL=$((FAIL + 1))
    TOTAL=$((TOTAL + 1))
    echo "  FAIL: #1312: pr_list_open writes a loud truncation error to stderr"
    echo "    expected: stderr containing 'likely truncated'"
    echo "    actual:   '$err'"
    ;;
esac
teardown

# <<< END MOVED <<<

report_results
