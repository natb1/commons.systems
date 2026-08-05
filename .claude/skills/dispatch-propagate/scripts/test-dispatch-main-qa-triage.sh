#!/usr/bin/env bash
# Tests for dispatch-main-qa-triage -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 1819-1909.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-main-qa-triage tests
# ============================================================================
echo ""
echo "=== dispatch-main-qa-triage ==="

# dispatch-main-qa-triage is the single-sourced qa-main Step 4·0
# browser-verifiability triage, consulted pre-provision by dispatch-route and
# in-session by /qa-main. One gh_issue_view_rest read (the generic
# `api repos/*/issues/<N>` stub arm serves arg-issue-<N>.json in RAW REST
# shape); exit 0 = verifiable, 3 = not browser-verifiable (one reason line on
# stdout), 1 = gh failure, 2 = usage.
triage_run() {
  TRIAGE_OUT=$("$TMPDIR_TEST/dispatch-main-qa-triage" "$@" 2>/dev/null) && TRIAGE_RC=0 || TRIAGE_RC=$?
}

# T1. url_path present + browser outcome → exit 0, verifiable line names the path.
echo "Test: triage: url_path + browser outcome → exit 0 (verifiable)"
setup
cat > "$STUB_DIR/arg-issue-61.json" <<'EOF'
{"number":61,"title":"qa: verify against main — qa-needs-main #50: /budget","body":"**Expected outcome:** the budget page shows the new snapshot panel\n**Finding during QA:** only verifiable on prod\n**URL path:** /budget\n\nSurfaced during QA of PR #55 for issue #50.","state":"open","labels":[{"name":"main-qa"}]}
EOF
triage_run 61
assert_eq "verifiable follow-up → exit 0" "0" "$TRIAGE_RC"
assert_eq "verifiable follow-up → prints url_path" "verifiable: url_path=/budget" "$TRIAGE_OUT"
teardown

# T2. No `**URL path:**` line (the followup template omits it for empty/"current"
# url_path) → exit 3 with a reason naming the missing url_path.
echo "Test: triage: no url_path → exit 3 (not browser-verifiable)"
setup
cat > "$STUB_DIR/arg-issue-62.json" <<'EOF'
{"number":62,"title":"qa: verify against main — qa-needs-main #50: some-behavior","body":"**Expected outcome:** the toast appears after save\n**Finding during QA:** deferred to main","state":"open","labels":[{"name":"main-qa"}]}
EOF
triage_run 62
assert_eq "no url_path → exit 3" "3" "$TRIAGE_RC"
assert_eq "no url_path → reason line" \
  "not-browser-verifiable: no url_path — the follow-up has no browser-addressable surface" \
  "$TRIAGE_OUT"
teardown

# T3. Non-browser outcome (Step 4·0's named example class: a nix flake check)
# → exit 3 even though a url_path is present. The reason names the matched
# non-browser signal so the office-hours comment is specific.
echo "Test: triage: nix-flake expected outcome → exit 3 despite url_path"
setup
cat > "$STUB_DIR/arg-issue-63.json" <<'EOF'
{"number":63,"title":"qa: verify against main — qa-needs-main #51: nix-flake-check","body":"**Expected outcome:** nix flake check --pure-eval passes on the WSL host\n**Finding during QA:** cannot run in PR CI\n**URL path:** /","state":"open","labels":[{"name":"main-qa"}]}
EOF
triage_run 63
assert_eq "nix outcome → exit 3" "3" "$TRIAGE_RC"
case "$TRIAGE_OUT" in
  "not-browser-verifiable: expected outcome names a non-browser surface"*)
    PASS=$((PASS + 1)); TOTAL=$((TOTAL + 1))
    echo "  PASS: nix outcome → reason names the non-browser surface" ;;
  *)
    FAIL=$((FAIL + 1)); TOTAL=$((TOTAL + 1))
    echo "  FAIL: nix outcome → reason names the non-browser surface"
    echo "    actual: '$TRIAGE_OUT'" ;;
esac
teardown

# T4. Criterion-2 scan surface is title + expected outcome ONLY: a finding that
# merely narrates tooling (ssh'd deploy) must NOT trip the non-browser class
# when the expected outcome itself is a browser observation.
echo "Test: triage: non-browser mention in the finding only → exit 0"
setup
cat > "$STUB_DIR/arg-issue-64.json" <<'EOF'
{"number":64,"title":"qa: verify against main — qa-needs-main #52: /fellspiral","body":"**Expected outcome:** the landing hero renders the new tagline\n**Finding during QA:** found while ssh tunneling to the preview; only prod serves the built asset\n**URL path:** /fellspiral","state":"open","labels":[{"name":"main-qa"}]}
EOF
triage_run 64
assert_eq "tooling mention in finding only → exit 0" "0" "$TRIAGE_RC"
teardown

# T5. gh hard failure → exit 1 (clear error, no fallback routing).
echo "Test: triage: gh failure → exit 1"
setup
touch "$STUB_DIR/gh-fail-issue-labels-65"
triage_run 65
assert_eq "gh failure → exit 1" "1" "$TRIAGE_RC"
teardown

# T6. Usage errors → exit 2 (missing / non-numeric N).
echo "Test: triage: usage errors → exit 2"
setup
triage_run
assert_eq "missing N → exit 2" "2" "$TRIAGE_RC"
triage_run not-a-number
assert_eq "non-numeric N → exit 2" "2" "$TRIAGE_RC"
teardown

# <<< END MOVED <<<

report_results
