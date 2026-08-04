#!/usr/bin/env bash
# Tests for dispatch-ci-ready -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 1497-1644.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-ci-ready tests
# ============================================================================
echo ""
echo "=== dispatch-ci-ready ==="

# Unrecognized non-terminal rollup: a check run that is COMPLETED but carries a
# conclusion outside the known passing/failing sets — classifies as pending.
UNRECOGNIZED_ROLLUP='[{"status":"COMPLETED","conclusion":"WONKY"}]'

# Helper: run dispatch-ci-ready, capturing both stdout and exit code so a test
# can assert on the printed token and the exit status together.
ci_ready_run() {
  CI_READY_OUT=$("$TMPDIR_TEST/dispatch-ci-ready" "$@") && CI_READY_RC=0 || CI_READY_RC=$?
}

# 1. No PR → ready (phase would be implement; no CI gate)
echo "Test: no PR → ready"
setup
echo '[]' > "$STUB_DIR/pr-list-full.json"
ci_ready_run "42"
assert_eq "no PR → ready (token)" "ready" "$CI_READY_OUT"
assert_eq "no PR → ready (exit 0)" "0" "$CI_READY_RC"
teardown

# 2. Non-draft PR → ready (phase would be done; no CI gate)
echo "Test: non-draft PR → ready"
setup
printf '[%s]\n' "$(make_pr 10 "42-my-feature" "false" "$NO_LABELS" "$PENDING_ROLLUP")" \
  > "$STUB_DIR/pr-list-full.json"
ci_ready_run "42"
assert_eq "non-draft PR → ready (token)" "ready" "$CI_READY_OUT"
assert_eq "non-draft PR → ready (exit 0)" "0" "$CI_READY_RC"
teardown

# 3. Draft + failing CI → ready (a concluded failure is actionable → fix-checks)
echo "Test: draft + failing → ready"
setup
printf '[%s]\n' "$(make_pr 10 "42-my-feature" "true" "$NO_LABELS" "$FAILING_ROLLUP")" \
  > "$STUB_DIR/pr-list-full.json"
ci_ready_run "42"
assert_eq "draft + failing → ready (token)" "ready" "$CI_READY_OUT"
assert_eq "draft + failing → ready (exit 0)" "0" "$CI_READY_RC"
teardown

# 4. Draft + passing CI → ready
echo "Test: draft + passing → ready"
setup
printf '[%s]\n' "$(make_pr 10 "42-my-feature" "true" "$NO_LABELS" "$GREEN_ROLLUP")" \
  > "$STUB_DIR/pr-list-full.json"
ci_ready_run "42"
assert_eq "draft + passing → ready (token)" "ready" "$CI_READY_OUT"
assert_eq "draft + passing → ready (exit 0)" "0" "$CI_READY_RC"
teardown

# 5. Draft + pending CI → not-ready (exit 1, prints waiting)
echo "Test: draft + pending → not-ready"
setup
printf '[%s]\n' "$(make_pr 10 "42-my-feature" "true" "$NO_LABELS" "$PENDING_ROLLUP")" \
  > "$STUB_DIR/pr-list-full.json"
ci_ready_run "42"
assert_eq "draft + pending → not-ready (token)" "waiting" "$CI_READY_OUT"
assert_eq "draft + pending → not-ready (exit 1)" "1" "$CI_READY_RC"
teardown

# 6. Draft + empty rollup → not-ready (no verdict yet)
echo "Test: draft + empty rollup → not-ready"
setup
printf '[%s]\n' "$(make_pr 10 "42-my-feature" "true" "$NO_LABELS" "$EMPTY_ROLLUP")" \
  > "$STUB_DIR/pr-list-full.json"
ci_ready_run "42"
assert_eq "draft + empty rollup → not-ready (token)" "waiting" "$CI_READY_OUT"
assert_eq "draft + empty rollup → not-ready (exit 1)" "1" "$CI_READY_RC"
teardown

# 7. Draft + unrecognized non-terminal state → not-ready
echo "Test: draft + unrecognized state → not-ready"
setup
printf '[%s]\n' "$(make_pr 10 "42-my-feature" "true" "$NO_LABELS" "$UNRECOGNIZED_ROLLUP")" \
  > "$STUB_DIR/pr-list-full.json"
ci_ready_run "42"
assert_eq "draft + unrecognized state → not-ready (token)" "waiting" "$CI_READY_OUT"
assert_eq "draft + unrecognized state → not-ready (exit 1)" "1" "$CI_READY_RC"
teardown

# 8. Branch-name arg form (exact match) → not-ready for a pending draft
echo "Test: branch arg → not-ready"
setup
printf '[%s]\n' "$(make_pr 10 "42-my-feature" "true" "$NO_LABELS" "$PENDING_ROLLUP")" \
  > "$STUB_DIR/pr-list-full.json"
ci_ready_run "42-my-feature"
assert_eq "branch arg pending draft → not-ready (token)" "waiting" "$CI_READY_OUT"
assert_eq "branch arg pending draft → not-ready (exit 1)" "1" "$CI_READY_RC"
teardown

# 9. DISPATCH_PR_LIST_FILE reuse: predicate reads file-provided list without gh.
echo "Test: DISPATCH_PR_LIST_FILE overrides self-fetch"
setup
# pr-list-full.json is empty: a self-fetch would yield ready (no PR). The
# pending draft lives only in the file channel, so a not-ready result proves it
# won and no gh pr list was issued.
echo '[]' > "$STUB_DIR/pr-list-full.json"
ENV_LIST='['"$(make_pr 42 "42-waiting" "true" "$NO_LABELS" "$PENDING_ROLLUP")"']'
PR_LIST_F=$(pr_list_tmpfile "$ENV_LIST")
CI_READY_OUT=$(DISPATCH_PR_LIST_FILE="$PR_LIST_F" "$TMPDIR_TEST/dispatch-ci-ready" "42") && CI_READY_RC=0 || CI_READY_RC=$?
assert_eq "DISPATCH_PR_LIST_FILE used over self-fetch → waiting (token)" "waiting" "$CI_READY_OUT"
assert_eq "DISPATCH_PR_LIST_FILE used over self-fetch → not-ready (exit 1)" "1" "$CI_READY_RC"
assert_eq "DISPATCH_PR_LIST_FILE reuse issues no gh pr list" "0" \
  "$([[ -f "$STUB_DIR/gh-pr-list-calls.log" ]] && wc -l < "$STUB_DIR/gh-pr-list-calls.log" | tr -d ' ' || echo 0)"
teardown

# 10. Draft + mergeable=CONFLICTING + pending CI → ready. A conflicting PR is
# routable to fix-conflicts even while CI is still pending — the conflict gate
# precedes the CI-pending gate, so the PR is reported ready (exit 0).
echo "Test: draft + CONFLICTING + pending CI → ready"
setup
printf '[%s]\n' "$(make_pr_mergeable 10 "42-my-feature" "true" "$NO_LABELS" "$PENDING_ROLLUP" "CONFLICTING")" \
  > "$STUB_DIR/pr-list-full.json"
ci_ready_run "42"
assert_eq "draft + CONFLICTING + pending → ready (token)" "ready" "$CI_READY_OUT"
assert_eq "draft + CONFLICTING + pending → ready (exit 0)" "0" "$CI_READY_RC"
teardown

# #1646: a >128KB open-PR list passed via DISPATCH_PR_LIST_FILE returns the correct
# verdict. The equivalent inline DISPATCH_PR_LIST env var would E2BIG the exec.
echo "Test: ci-ready over >128KB DISPATCH_PR_LIST_FILE → correct verdict"
setup
PAD=$(printf 'x%.0s' {1..143360})
LIST='['"$(make_pr 10 "42-feature" "true" "$NO_LABELS" "$PENDING_ROLLUP")"','"$(make_pr 20 "99-pad" "false" "[{\"name\":\"$PAD\"}]" "$GREEN_ROLLUP")"']'
BIG_FILE=$(pr_list_tmpfile "$LIST")
assert_eq "ci-ready file-channel fixture exceeds 128KB" "ok" "$([[ "$(wc -c < "$BIG_FILE")" -gt 131072 ]] && echo ok || echo too-small)"
CI_OUT=$(DISPATCH_PR_LIST_FILE="$BIG_FILE" "$TMPDIR_TEST/dispatch-ci-ready" "42") && CI_RC=0 || CI_RC=$?
assert_eq ">128KB file channel → correct verdict (waiting)" "waiting" "$CI_OUT"
assert_eq ">128KB file channel → not-ready exit 1" "1" "$CI_RC"
teardown

# #1646: an unreadable DISPATCH_PR_LIST_FILE is an environment/IO error, surfaced
# as exit 2 — distinct from the readiness exits 0 (ready) / 1 (not-ready).
echo "Test: ci-ready with unreadable DISPATCH_PR_LIST_FILE → exit 2"
setup
echo '[]' > "$STUB_DIR/pr-list-full.json"
MISSING="$TMPDIR_TEST/does-not-exist-pr-list.json"
CI_ERR=$(DISPATCH_PR_LIST_FILE="$MISSING" "$TMPDIR_TEST/dispatch-ci-ready" "42" 2>&1 >/dev/null) && CI_RC=0 || CI_RC=$?
assert_eq "unreadable DISPATCH_PR_LIST_FILE → exit 2 (env error, not a readiness verdict)" "2" "$CI_RC"
case "$CI_ERR" in *"not readable"*) ok=yes ;; *) ok="no:$CI_ERR" ;; esac
assert_eq "unreadable file → clear stderr error" "yes" "$ok"
teardown

# <<< END MOVED <<<

report_results
