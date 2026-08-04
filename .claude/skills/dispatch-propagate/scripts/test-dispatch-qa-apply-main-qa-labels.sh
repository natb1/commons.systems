#!/usr/bin/env bash
# Tests for dispatch-qa-apply-main-qa-labels -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 4494-4693.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-qa-apply-main-qa-labels tests (#1758)
# ============================================================================
echo ""
echo "=== dispatch-qa-apply-main-qa-labels (#1758) ==="

# Happy path (#2256). Step 1 REST-DELETEs "help wanted" (issues/42/labels/help%20wanted).
# Step 2 ensure-first-creates main-qa (canonical 5319E7) then REST-adds it. Step 3's
# dispatch-apply-office-hours (the real migrated sibling) ensure-creates
# dispatch:office-hours and REST-adds it too. Both REST adds land in
# gh-issue-set-labels-rest-calls.log; both creates land in gh-label-create.log.
echo "Test: happy path → REST-remove help-wanted, REST-add main-qa, route to office-hours; exit 0"
setup
echo '{"state":"open","labels":[]}' > "$STUB_DIR/arg-issue-42.json"
if "$TMPDIR_TEST/dispatch-qa-apply-main-qa-labels" 42; then rc=0; else rc=$?; fi
assert_eq "happy path: exit 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if grep -q 'DELETE' "$STUB_DIR/gh-issue-remove-label-rest-calls.log" \
   && grep -q 'issues/42/labels/help%20wanted' "$STUB_DIR/gh-issue-remove-label-rest-calls.log"; then
  PASS=$((PASS + 1)); echo "  PASS: REST-removed help wanted"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: REST-removed help wanted"
  echo "    actual: '$(cat "$STUB_DIR/gh-issue-remove-label-rest-calls.log" 2>/dev/null)'"
fi
TOTAL=$((TOTAL + 1))
if grep -q 'labels\[\]=main-qa' "$STUB_DIR/gh-issue-set-labels-rest-calls.log"; then
  PASS=$((PASS + 1)); echo "  PASS: REST-added main-qa"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: REST-added main-qa"
fi
TOTAL=$((TOTAL + 1))
if grep -q 'labels\[\]=dispatch:office-hours' "$STUB_DIR/gh-issue-set-labels-rest-calls.log"; then
  PASS=$((PASS + 1)); echo "  PASS: routed to office-hours (REST add)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: routed to office-hours (REST add)"
fi
TOTAL=$((TOTAL + 1))
if grep -q "^label create main-qa --color 5319E7 " "$STUB_DIR/gh-label-create.log"; then
  PASS=$((PASS + 1)); echo "  PASS: ensure-first created main-qa with 5319E7"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: ensure-first created main-qa with 5319E7"
fi
teardown

# Idempotent re-run: the "help wanted" label is no longer on the issue, so the REST
# DELETE returns 404. gh_issue_remove_label_rest treats that as no-op success; the
# script still REST-adds main-qa and routes to office-hours, exiting 0.
echo "Test: help-wanted absent (404) → tolerated, main-qa and office-hours still applied; exit 0"
setup
echo '{"state":"open","labels":[]}' > "$STUB_DIR/arg-issue-42.json"
: > "$STUB_DIR/gh-404-remove-label"
if "$TMPDIR_TEST/dispatch-qa-apply-main-qa-labels" 42; then rc=0; else rc=$?; fi
assert_eq "404 removal tolerated, exit 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if grep -q 'issues/42/labels/help%20wanted' "$STUB_DIR/gh-issue-remove-label-rest-calls.log"; then
  PASS=$((PASS + 1)); echo "  PASS: REST DELETE attempted (then 404-tolerated)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: REST DELETE attempted (then 404-tolerated)"
fi
TOTAL=$((TOTAL + 1))
if grep -q 'labels\[\]=main-qa' "$STUB_DIR/gh-issue-set-labels-rest-calls.log"; then
  PASS=$((PASS + 1)); echo "  PASS: main-qa applied after tolerated removal"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: main-qa applied after tolerated removal"
fi
TOTAL=$((TOTAL + 1))
if grep -q 'labels\[\]=dispatch:office-hours' "$STUB_DIR/gh-issue-set-labels-rest-calls.log"; then
  PASS=$((PASS + 1)); echo "  PASS: office-hours routing still runs"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: office-hours routing still runs"
fi
teardown

# Already-exists label-create: main-qa already exists in the repo. `gh label create`
# errors already-exists; the ensure-first idiom tolerates it and still REST-adds the
# label. The office-hours step runs unaffected.
echo "Test: main-qa already exists → tolerated, REST add, office-hours unaffected; exit 0"
setup
echo '{"state":"open","labels":[]}' > "$STUB_DIR/arg-issue-42.json"
: > "$STUB_DIR/gh-label-exists"
if "$TMPDIR_TEST/dispatch-qa-apply-main-qa-labels" 42; then rc=0; else rc=$?; fi
assert_eq "already-exists: exit 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if grep -q "^label create main-qa --color 5319E7 --description QA verification that can only run against deployed main/production" "$STUB_DIR/gh-label-create.log"; then
  PASS=$((PASS + 1)); echo "  PASS: ensure-first attempted with canonical metadata"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: ensure-first attempted with canonical metadata"
fi
TOTAL=$((TOTAL + 1))
if grep -q 'labels\[\]=main-qa' "$STUB_DIR/gh-issue-set-labels-rest-calls.log"; then
  PASS=$((PASS + 1)); echo "  PASS: main-qa REST-added despite already-exists create"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: main-qa REST-added despite already-exists create"
fi
TOTAL=$((TOTAL + 1))
if grep -q 'labels\[\]=dispatch:office-hours' "$STUB_DIR/gh-issue-set-labels-rest-calls.log"; then
  PASS=$((PASS + 1)); echo "  PASS: office-hours unaffected by already-exists create"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: office-hours unaffected by already-exists create"
fi
teardown

# Non-numeric, flag-like issue number → hard error (exit 1), no gh calls. The
# guard exists so a flag-like value can never be parsed by gh as an option that
# redirects the label writes.
echo "Test: non-numeric issue number → non-zero exit, no edit/label-create"
setup
if "$TMPDIR_TEST/dispatch-qa-apply-main-qa-labels" "--repo other/repo" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "non-numeric issue number exits non-zero" "1" "$rc"
assert_eq "non-numeric: no label edit" "absent" "$(log_state gh-issue-edit.log)"
assert_eq "non-numeric: no label create" "absent" "$(log_state gh-label-create.log)"
teardown

# Missing arg → hard error (exit 1).
echo "Test: missing issue number → non-zero exit"
setup
if "$TMPDIR_TEST/dispatch-qa-apply-main-qa-labels" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "missing issue number exits non-zero" "1" "$rc"
assert_eq "missing arg: no label edit" "absent" "$(log_state gh-issue-edit.log)"
teardown

# --route autonomous: Step 1 (remove help-wanted) and Step 2 (add main-qa) run
# unconditionally; Step 3 is skipped, so dispatch:office-hours is ABSENT from the
# set-labels log. Exit 0.
echo "Test: --route autonomous → help-wanted removed, main-qa added, office-hours withheld; exit 0"
setup
echo '{"state":"open","labels":[]}' > "$STUB_DIR/arg-issue-42.json"
if "$TMPDIR_TEST/dispatch-qa-apply-main-qa-labels" 42 --route autonomous 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "--route autonomous: exit 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if grep -q 'DELETE' "$STUB_DIR/gh-issue-remove-label-rest-calls.log" \
   && grep -q 'issues/42/labels/help%20wanted' "$STUB_DIR/gh-issue-remove-label-rest-calls.log"; then
  PASS=$((PASS + 1)); echo "  PASS: autonomous route: REST-removed help wanted"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: autonomous route: REST-removed help wanted"
  echo "    actual: '$(cat "$STUB_DIR/gh-issue-remove-label-rest-calls.log" 2>/dev/null)'"
fi
TOTAL=$((TOTAL + 1))
if grep -q 'labels\[\]=main-qa' "$STUB_DIR/gh-issue-set-labels-rest-calls.log"; then
  PASS=$((PASS + 1)); echo "  PASS: autonomous route: REST-added main-qa"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: autonomous route: REST-added main-qa"
fi
TOTAL=$((TOTAL + 1))
if ! grep -q 'labels\[\]=dispatch:office-hours' "$STUB_DIR/gh-issue-set-labels-rest-calls.log" 2>/dev/null; then
  PASS=$((PASS + 1)); echo "  PASS: autonomous route: dispatch:office-hours withheld"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: autonomous route: dispatch:office-hours withheld (should be absent)"
fi
teardown

# --route human (explicit): identical to the default no-flag path. Steps 1-3 all
# run, including the dispatch-apply-office-hours call that REST-adds office-hours.
echo "Test: --route human (explicit) → help-wanted removed, main-qa added, office-hours applied; exit 0"
setup
echo '{"state":"open","labels":[]}' > "$STUB_DIR/arg-issue-42.json"
if "$TMPDIR_TEST/dispatch-qa-apply-main-qa-labels" 42 --route human; then rc=0; else rc=$?; fi
assert_eq "--route human explicit: exit 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if grep -q 'DELETE' "$STUB_DIR/gh-issue-remove-label-rest-calls.log" \
   && grep -q 'issues/42/labels/help%20wanted' "$STUB_DIR/gh-issue-remove-label-rest-calls.log"; then
  PASS=$((PASS + 1)); echo "  PASS: explicit human route: REST-removed help wanted"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: explicit human route: REST-removed help wanted"
  echo "    actual: '$(cat "$STUB_DIR/gh-issue-remove-label-rest-calls.log" 2>/dev/null)'"
fi
TOTAL=$((TOTAL + 1))
if grep -q 'labels\[\]=main-qa' "$STUB_DIR/gh-issue-set-labels-rest-calls.log"; then
  PASS=$((PASS + 1)); echo "  PASS: explicit human route: REST-added main-qa"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: explicit human route: REST-added main-qa"
fi
TOTAL=$((TOTAL + 1))
if grep -q 'labels\[\]=dispatch:office-hours' "$STUB_DIR/gh-issue-set-labels-rest-calls.log"; then
  PASS=$((PASS + 1)); echo "  PASS: explicit human route: dispatch:office-hours applied"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: explicit human route: dispatch:office-hours applied"
fi
teardown

# Invalid --route value: the script must exit 1 with an error to stderr and must
# NOT write any label ops (no REST removes, no REST adds).
echo "Test: --route bogus → non-zero exit, no label writes"
setup
if "$TMPDIR_TEST/dispatch-qa-apply-main-qa-labels" 42 --route bogus 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "--route bogus: non-zero exit" "1" "$rc"
TOTAL=$((TOTAL + 1))
if ! grep -q '.' "$STUB_DIR/gh-issue-remove-label-rest-calls.log" 2>/dev/null; then
  PASS=$((PASS + 1)); echo "  PASS: invalid route: no REST remove-label writes"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: invalid route: no REST remove-label writes (should be absent)"
fi
TOTAL=$((TOTAL + 1))
if ! grep -q '.' "$STUB_DIR/gh-issue-set-labels-rest-calls.log" 2>/dev/null; then
  PASS=$((PASS + 1)); echo "  PASS: invalid route: no REST set-labels writes"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: invalid route: no REST set-labels writes (should be absent)"
fi
teardown

# <<< END MOVED <<<

report_results
