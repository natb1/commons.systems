#!/usr/bin/env bash
# Tests for dispatch-apply-planned -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 4438-4493.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-apply-planned tests
# ============================================================================
echo ""
echo "=== dispatch-apply-planned ==="

# Happy path: #2256 ensure-label-exists-first (`gh label create`, canonical 0E8A16
# metadata) then REST-add to the ISSUE (POST .../issues/55/labels). The create
# succeeds in default stub mode.
echo "Test: ensure label (0E8A16) + REST add dispatch:planned to issue"
setup
"$TMPDIR_TEST/dispatch-apply-planned" 55
TOTAL=$((TOTAL + 1))
if grep -q 'issues/55/labels' "$STUB_DIR/gh-issue-set-labels-rest-calls.log" \
   && grep -q 'labels\[\]=dispatch:planned' "$STUB_DIR/gh-issue-set-labels-rest-calls.log"; then
  PASS=$((PASS + 1)); echo "  PASS: REST-adds dispatch:planned to issues/55/labels"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: REST-adds dispatch:planned to issues/55/labels"
  echo "    actual: '$(cat "$STUB_DIR/gh-issue-set-labels-rest-calls.log" 2>/dev/null)'"
fi
assert_eq "ensure-first creates with 0E8A16 metadata" \
  "label create dispatch:planned --color 0E8A16 --description dispatch workflow: an approved plan exists; implement phase is next" \
  "$(cat "$STUB_DIR/gh-label-create.log")"
teardown

# Already-exists tolerance: `gh label create` errors already-exists; the idiom
# tolerates it and still REST-adds the label.
echo "Test: label already exists → tolerated, REST add still fires"
setup
: > "$STUB_DIR/gh-label-exists"
if "$TMPDIR_TEST/dispatch-apply-planned" 55; then rc=0; else rc=$?; fi
assert_eq "already-exists tolerated: exit 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if grep -q 'labels\[\]=dispatch:planned' "$STUB_DIR/gh-issue-set-labels-rest-calls.log"; then
  PASS=$((PASS + 1)); echo "  PASS: already-exists still REST-adds dispatch:planned"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: already-exists still REST-adds dispatch:planned"
fi
teardown

# Non-numeric, flag-like issue number → hard error (exit 1), no gh calls.
echo "Test: non-numeric issue number → non-zero exit, no edit/label-create"
setup
if "$TMPDIR_TEST/dispatch-apply-planned" "--repo other/repo" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "non-numeric issue number exits non-zero" "1" "$rc"
assert_eq "non-numeric: no label edit" "absent" "$(log_state gh-issue-edit.log)"
assert_eq "non-numeric: no label create" "absent" "$(log_state gh-label-create.log)"
teardown

# Missing arg → hard error (exit 1).
echo "Test: missing issue number → non-zero exit"
setup
if "$TMPDIR_TEST/dispatch-apply-planned" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "missing issue number exits non-zero" "1" "$rc"
teardown

# <<< END MOVED <<<

report_results
