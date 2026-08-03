#!/usr/bin/env bash
# Tests for dispatch-complete-phase -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 4180-4289.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-complete-phase tests
# ============================================================================
echo ""
echo "=== dispatch-complete-phase ==="

# Reports whether the gh stub recorded a `gh label create` call.
label_create_state() {
  [[ -f "$STUB_DIR/gh-label-create.log" ]] && echo "present" || echo "absent"
}

# #2256: migrated to ensure-label-exists-first + REST add. Every add path now runs
# `gh label create` (canonical BFD4F2 metadata) and then a REST POST
# .../issues/<PR>/labels (a PR is an issue in REST). The label-create create
# succeeds in default stub mode; the REST POST args land in
# gh-issue-set-labels-rest-calls.log as "api -X POST .../issues/<N>/labels -f labels[]=<label>".
echo "Test: qa → dispatch:qa-done (ensure label + REST add)"
setup
"$TMPDIR_TEST/dispatch-complete-phase" 21 qa
TOTAL=$((TOTAL + 1))
if grep -q 'issues/21/labels' "$STUB_DIR/gh-issue-set-labels-rest-calls.log" \
   && grep -q 'labels\[\]=dispatch:qa-done' "$STUB_DIR/gh-issue-set-labels-rest-calls.log"; then
  PASS=$((PASS + 1)); echo "  PASS: qa REST-adds dispatch:qa-done to issues/21/labels"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: qa REST-adds dispatch:qa-done to issues/21/labels"
  echo "    actual: '$(cat "$STUB_DIR/gh-issue-set-labels-rest-calls.log" 2>/dev/null)'"
fi
assert_eq "qa: ensure-first runs gh label create" \
  "label create dispatch:qa-done --color BFD4F2 --description dispatch workflow: qa-done phase complete" \
  "$(cat "$STUB_DIR/gh-label-create.log")"
teardown

echo "Test: review → dispatch:reviewed (ensure label + REST add)"
setup
"$TMPDIR_TEST/dispatch-complete-phase" 30 review
TOTAL=$((TOTAL + 1))
if grep -q 'issues/30/labels' "$STUB_DIR/gh-issue-set-labels-rest-calls.log" \
   && grep -q 'labels\[\]=dispatch:reviewed' "$STUB_DIR/gh-issue-set-labels-rest-calls.log"; then
  PASS=$((PASS + 1)); echo "  PASS: review REST-adds dispatch:reviewed to issues/30/labels"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: review REST-adds dispatch:reviewed to issues/30/labels"
  echo "    actual: '$(cat "$STUB_DIR/gh-issue-set-labels-rest-calls.log" 2>/dev/null)'"
fi
assert_eq "review: ensure-first runs gh label create" \
  "label create dispatch:reviewed --color BFD4F2 --description dispatch workflow: reviewed phase complete" \
  "$(cat "$STUB_DIR/gh-label-create.log")"
teardown

# Label already exists in the repo: `gh label create` returns the already-exists
# error, which the ensure-first idiom tolerates and proceeds to the REST add.
echo "Test: label already exists → tolerated, REST add still fires"
setup
: > "$STUB_DIR/gh-label-exists"
if "$TMPDIR_TEST/dispatch-complete-phase" 30 qa; then rc=0; else rc=$?; fi
assert_eq "already-exists tolerated: exit 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if grep -q 'issues/30/labels' "$STUB_DIR/gh-issue-set-labels-rest-calls.log" \
   && grep -q 'labels\[\]=dispatch:qa-done' "$STUB_DIR/gh-issue-set-labels-rest-calls.log"; then
  PASS=$((PASS + 1)); echo "  PASS: already-exists still REST-adds the label"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: already-exists still REST-adds the label"
fi
teardown

# A label-create failure unrelated to already-exists exits non-zero and issues
# no REST add (the label could not be guaranteed to exist). The gh-fail-label-create
# marker makes the stub's `label create` branch emit a generic error and exit 1.
echo "Test: non-already-exists label-create failure → non-zero exit, no REST add"
setup
: > "$STUB_DIR/gh-fail-label-create"
if "$TMPDIR_TEST/dispatch-complete-phase" 40 qa 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "create failure exits non-zero" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -f "$STUB_DIR/gh-issue-set-labels-rest-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: create failure issues no REST add"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: create failure issues no REST add"
fi
teardown

# Unknown phase → non-zero exit.
echo "Test: unknown phase → non-zero exit"
setup
if "$TMPDIR_TEST/dispatch-complete-phase" 25 bogus 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "unknown phase exits non-zero" "1" "$rc"
teardown

# Missing phase arg → non-zero exit.
echo "Test: missing args → non-zero exit"
setup
if "$TMPDIR_TEST/dispatch-complete-phase" 25 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "missing phase arg exits non-zero" "1" "$rc"
teardown

# Static guard: only dispatch-complete-phase contains the BFD4F2 hex color.
# Exclude this test file (which references BFD4F2 in fixtures and comments)
# rather than whitelisting specific extensions — that way any future
# regression in a .sh wrapper is caught alongside .md regressions.
echo "Test: only dispatch-complete-phase contains the BFD4F2 hex"
REPO_ROOT=$(cd "$SCRIPT_DIR/../../../.." && pwd)
# grep exits 2 on permission errors (e.g. sandbox-blocked directories); treat
# that as non-fatal — the important check is the matched file list, not whether
# grep could read every directory.
matches=$(grep -rl 'BFD4F2' "$REPO_ROOT/.claude" \
  --exclude='test-dispatch-complete-phase.sh' 2>/dev/null \
  | sed "s|$REPO_ROOT/||" | sort || true)
assert_eq "only dispatch-complete-phase owns BFD4F2" \
  ".claude/skills/dispatch-propagate/scripts/dispatch-complete-phase" \
  "$matches"

# <<< END MOVED <<<

report_results
