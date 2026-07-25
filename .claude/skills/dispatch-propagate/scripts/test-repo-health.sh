#!/usr/bin/env bash
# Tests for repo-health -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 29733-29822.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# repo-health --main-broken-sha branch-attribution tests
# ============================================================================
echo ""
echo "=== repo-health --main-broken-sha branch attribution ==="

# a. Empty set: no check-runs, no workflow runs → fail closed.
echo "Test: repo-health --main-broken-sha — empty attributable set → NO_ATTRIBUTABLE_CHECKS, exit 3"
setup
export REPO_HEALTH_STATE_FILE="$TMPDIR_TEST/rh.json"
echo '{"sha":"headsha1"}' > "$STUB_DIR/main-commit.json"
echo '{"check_runs":[]}' > "$STUB_DIR/main-check-runs.json"
echo '[]' > "$STUB_DIR/main-run-list.json"
rc=0; out=$("$SCRIPT_DIR/repo-health" --main-broken-sha 2>/dev/null) || rc=$?
assert_eq "empty set → stdout token" "NO_ATTRIBUTABLE_CHECKS" "$out"
assert_eq "empty set → exit 3" "3" "$rc"
unset REPO_HEALTH_STATE_FILE
teardown

# b. All-misattributed: check-runs exist (incl. a failure) but their check-suite
# resolves to a foreign branch (graph/foo), not main. Regression guard for the
# real 2026-07-23 Graph Fast Path false-red (#main-health-signal-attribution):
# a foreign-branch failure must never read as a confirmed red main.
echo "Test: repo-health --main-broken-sha — all-misattributed (foreign-branch) failing checks → NO_ATTRIBUTABLE_CHECKS, exit 3"
setup
export REPO_HEALTH_STATE_FILE="$TMPDIR_TEST/rh.json"
echo '{"sha":"headsha2"}' > "$STUB_DIR/main-commit.json"
cat > "$STUB_DIR/main-check-runs.json" <<'JSON'
{"check_runs":[
  {"name":"guard","conclusion":"failure","check_suite":{"id":999}},
  {"name":"other","conclusion":"success","check_suite":{"id":999}}
]}
JSON
echo '{"head_branch":"graph/foo"}' > "$STUB_DIR/main-check-suite-999.json"
echo '[]' > "$STUB_DIR/main-run-list.json"
rc=0; out=$("$SCRIPT_DIR/repo-health" --main-broken-sha 2>/dev/null) || rc=$?
assert_eq "all-misattributed → stdout token" "NO_ATTRIBUTABLE_CHECKS" "$out"
assert_eq "all-misattributed → exit 3" "3" "$rc"
unset REPO_HEALTH_STATE_FILE
teardown

# c. Attributable green: check-runs attributed to main's own suite, all success.
echo "Test: repo-health --main-broken-sha — attributable green → empty stdout, exit 0"
setup
export REPO_HEALTH_STATE_FILE="$TMPDIR_TEST/rh.json"
echo '{"sha":"headsha3"}' > "$STUB_DIR/main-commit.json"
cat > "$STUB_DIR/main-check-runs.json" <<'JSON'
{"check_runs":[
  {"name":"codeql","conclusion":"success","check_suite":{"id":111}}
]}
JSON
echo '{"head_branch":"main"}' > "$STUB_DIR/main-check-suite-111.json"
echo '[]' > "$STUB_DIR/main-run-list.json"
rc=0; out=$("$SCRIPT_DIR/repo-health" --main-broken-sha 2>/dev/null) || rc=$?
assert_eq "attributable green → empty stdout" "" "$out"
assert_eq "attributable green → exit 0" "0" "$rc"
unset REPO_HEALTH_STATE_FILE
teardown

# d. Attributable red: check-runs attributed to main's own suite, one failing.
echo "Test: repo-health --main-broken-sha — attributable red → prints sha, exit 0"
setup
export REPO_HEALTH_STATE_FILE="$TMPDIR_TEST/rh.json"
echo '{"sha":"headsha4"}' > "$STUB_DIR/main-commit.json"
cat > "$STUB_DIR/main-check-runs.json" <<'JSON'
{"check_runs":[
  {"name":"codeql","conclusion":"failure","check_suite":{"id":111}}
]}
JSON
echo '{"head_branch":"main"}' > "$STUB_DIR/main-check-suite-111.json"
echo '[]' > "$STUB_DIR/main-run-list.json"
rc=0; out=$("$SCRIPT_DIR/repo-health" --main-broken-sha 2>/dev/null) || rc=$?
assert_eq "attributable red → stdout is the broken sha" "headsha4" "$out"
assert_eq "attributable red → exit 0" "0" "$rc"
unset REPO_HEALTH_STATE_FILE
teardown

# e. Workflow-run red: empty check-run set, but a workflow run on main is
# failing. Workflow runs are already correctly attributed by `gh run list
# --branch main`, so this half must still trip red on its own.
echo "Test: repo-health --main-broken-sha — workflow-run red (empty check-run set) → prints sha, exit 0"
setup
export REPO_HEALTH_STATE_FILE="$TMPDIR_TEST/rh.json"
echo '{"sha":"headsha5"}' > "$STUB_DIR/main-commit.json"
echo '{"check_runs":[]}' > "$STUB_DIR/main-check-runs.json"
echo '[{"headSha":"headsha5","conclusion":"failure"}]' > "$STUB_DIR/main-run-list.json"
rc=0; out=$("$SCRIPT_DIR/repo-health" --main-broken-sha 2>/dev/null) || rc=$?
assert_eq "workflow-run red → stdout is the broken sha" "headsha5" "$out"
assert_eq "workflow-run red → exit 0" "0" "$rc"
unset REPO_HEALTH_STATE_FILE
# <<< END MOVED <<<

report_results
