#!/usr/bin/env bash
# Tests for dispatch-reconcile-ready -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 26380-26621.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-reconcile-ready tests
# ============================================================================
echo ""
echo "=== dispatch-reconcile-ready ==="

# Build a single-PR fixture array for the reconcile fetch. Shapes match the
# `gh pr list --json number,isDraft,labels,headRefOid,mergeable` output the
# script consumes; the CI verdict now derives from the REST check-runs of
# headRefOid (#1601), so also write the matching check-runs fixture.
#   $1 = number, $2 = isDraft (true|false), $3 = mergeable
#   (MERGEABLE|CONFLICTING|UNKNOWN), $4 = rollup JSON, $5 = labels JSON.
make_reconcile_pr() {
  local num="$1" is_draft="$2" mergeable="$3" rollup_json="$4" labels_json="$5"
  local sha="sha${num}"
  write_rest_check_runs "$sha" "$rollup_json"
  printf '[{"number":%s,"isDraft":%s,"mergeable":"%s","headRefOid":"%s","labels":%s}]' \
    "$num" "$is_draft" "$mergeable" "$sha" "$labels_json"
}

# Labels: a single dispatch:reviewed label, and the no-reviewed scope case.
REVIEWED_LABELS='[{"name":"dispatch:reviewed"}]'
NO_REVIEWED_LABELS='[{"name":"dispatch:planned"}]'

# Reports whether a given stub log file is present/absent.
reconcile_log_state() {
  [[ -f "$STUB_DIR/$1" ]] && echo "present" || echo "absent"
}

# --- Truth table for a dispatch:reviewed PR ---------------------------------
# Each row writes a one-PR fixture, runs the reconciler, and asserts on the
# emitted stdout plus the promote/demote call logs.

# Row 1: draft + passing + MERGEABLE → promote.
echo "Test: draft + passing + MERGEABLE → promote (#7)"
setup
make_reconcile_pr 7 true MERGEABLE "$GREEN_ROLLUP" "$REVIEWED_LABELS" \
  > "$STUB_DIR/reconcile-pr-list.json"
out=$("$TMPDIR_TEST/dispatch-reconcile-ready" 2>/dev/null)
assert_eq "promote: stdout is 'promoted #7'" "promoted #7" "$out"
assert_eq "promote: gh pr ready #7 logged" "7" "$(cat "$STUB_DIR/gh-pr-ready.log")"
assert_eq "promote: no demote call" "absent" "$(reconcile_log_state gh-pr-ready-undo.log)"
teardown

# Row 2: draft + passing + UNKNOWN → no-op (mergeable async, self-heal later).
echo "Test: draft + passing + UNKNOWN → no-op (#8)"
setup
make_reconcile_pr 8 true UNKNOWN "$GREEN_ROLLUP" "$REVIEWED_LABELS" \
  > "$STUB_DIR/reconcile-pr-list.json"
out=$("$TMPDIR_TEST/dispatch-reconcile-ready" 2>/dev/null)
assert_eq "draft+UNKNOWN: no stdout" "" "$out"
assert_eq "draft+UNKNOWN: no promote call" "absent" "$(reconcile_log_state gh-pr-ready.log)"
assert_eq "draft+UNKNOWN: no demote call" "absent" "$(reconcile_log_state gh-pr-ready-undo.log)"
teardown

# Row 3: draft + failing + MERGEABLE → no-op (a draft is never demoted).
echo "Test: draft + failing + MERGEABLE → no-op (#9)"
setup
make_reconcile_pr 9 true MERGEABLE "$FAILING_ROLLUP" "$REVIEWED_LABELS" \
  > "$STUB_DIR/reconcile-pr-list.json"
out=$("$TMPDIR_TEST/dispatch-reconcile-ready" 2>/dev/null)
assert_eq "draft+failing: no stdout" "" "$out"
assert_eq "draft+failing: no promote call" "absent" "$(reconcile_log_state gh-pr-ready.log)"
assert_eq "draft+failing: no demote call" "absent" "$(reconcile_log_state gh-pr-ready-undo.log)"
teardown

# Row 4: draft + pending + MERGEABLE → no-op (CI still running).
echo "Test: draft + pending + MERGEABLE → no-op (#10)"
setup
make_reconcile_pr 10 true MERGEABLE "$PENDING_ROLLUP" "$REVIEWED_LABELS" \
  > "$STUB_DIR/reconcile-pr-list.json"
out=$("$TMPDIR_TEST/dispatch-reconcile-ready" 2>/dev/null)
assert_eq "draft+pending: no stdout" "" "$out"
assert_eq "draft+pending: no promote call" "absent" "$(reconcile_log_state gh-pr-ready.log)"
teardown

# Row 5: ready + failing + MERGEABLE → demote (CI regressed).
echo "Test: ready + failing + MERGEABLE → demote (#11)"
setup
make_reconcile_pr 11 false MERGEABLE "$FAILING_ROLLUP" "$REVIEWED_LABELS" \
  > "$STUB_DIR/reconcile-pr-list.json"
out=$("$TMPDIR_TEST/dispatch-reconcile-ready" 2>/dev/null)
assert_eq "demote (failing): stdout reports verdict + mergeable" \
  "demoted #11 (ci=failing merge=MERGEABLE)" "$out"
assert_eq "demote (failing): gh pr ready --undo #11 logged" \
  "11" "$(cat "$STUB_DIR/gh-pr-ready-undo.log")"
assert_eq "demote (failing): no promote call" "absent" "$(reconcile_log_state gh-pr-ready.log)"
# dispatch:reviewed is KEPT — no remove-label of it.
assert_eq "demote (failing): dispatch:reviewed not removed" \
  "absent" "$(reconcile_log_state gh-pr-edit.log)"
teardown

# Row 6: ready + passing + CONFLICTING → demote (merge conflict).
echo "Test: ready + passing + CONFLICTING → demote (#12)"
setup
make_reconcile_pr 12 false CONFLICTING "$GREEN_ROLLUP" "$REVIEWED_LABELS" \
  > "$STUB_DIR/reconcile-pr-list.json"
out=$("$TMPDIR_TEST/dispatch-reconcile-ready" 2>/dev/null)
assert_eq "demote (CONFLICTING): stdout reports verdict + mergeable" \
  "demoted #12 (ci=passing merge=CONFLICTING)" "$out"
assert_eq "demote (CONFLICTING): gh pr ready --undo #12 logged" \
  "12" "$(cat "$STUB_DIR/gh-pr-ready-undo.log")"
teardown

# Row 7: ready + passing + UNKNOWN → no-op (do NOT demote on UNKNOWN).
echo "Test: ready + passing + UNKNOWN → no-op (#13)"
setup
make_reconcile_pr 13 false UNKNOWN "$GREEN_ROLLUP" "$REVIEWED_LABELS" \
  > "$STUB_DIR/reconcile-pr-list.json"
out=$("$TMPDIR_TEST/dispatch-reconcile-ready" 2>/dev/null)
assert_eq "ready+UNKNOWN: no stdout" "" "$out"
assert_eq "ready+UNKNOWN: no demote call" "absent" "$(reconcile_log_state gh-pr-ready-undo.log)"
teardown

# Row 8: ready + pending + MERGEABLE → no-op (do NOT demote on pending CI).
echo "Test: ready + pending + MERGEABLE → no-op (#14)"
setup
make_reconcile_pr 14 false MERGEABLE "$PENDING_ROLLUP" "$REVIEWED_LABELS" \
  > "$STUB_DIR/reconcile-pr-list.json"
out=$("$TMPDIR_TEST/dispatch-reconcile-ready" 2>/dev/null)
assert_eq "ready+pending: no stdout" "" "$out"
assert_eq "ready+pending: no demote call" "absent" "$(reconcile_log_state gh-pr-ready-undo.log)"
teardown

# Row 9: ready + passing + MERGEABLE → no-op (already correct).
echo "Test: ready + passing + MERGEABLE → no-op (already correct) (#15)"
setup
make_reconcile_pr 15 false MERGEABLE "$GREEN_ROLLUP" "$REVIEWED_LABELS" \
  > "$STUB_DIR/reconcile-pr-list.json"
out=$("$TMPDIR_TEST/dispatch-reconcile-ready" 2>/dev/null)
assert_eq "ready+correct: no stdout" "" "$out"
assert_eq "ready+correct: no promote call" "absent" "$(reconcile_log_state gh-pr-ready.log)"
assert_eq "ready+correct: no demote call" "absent" "$(reconcile_log_state gh-pr-ready-undo.log)"
teardown

# --- Scope gate: a PR WITHOUT dispatch:reviewed is never flipped -------------
# Use the would-promote combination (draft + passing + MERGEABLE): the only
# thing withholding the flip is the missing label.
echo "Test: scope gate — no dispatch:reviewed → never flipped, even when promotable (#16)"
setup
make_reconcile_pr 16 true MERGEABLE "$GREEN_ROLLUP" "$NO_REVIEWED_LABELS" \
  > "$STUB_DIR/reconcile-pr-list.json"
out=$("$TMPDIR_TEST/dispatch-reconcile-ready" 2>/dev/null)
assert_eq "scope gate: no stdout" "" "$out"
assert_eq "scope gate: no promote call" "absent" "$(reconcile_log_state gh-pr-ready.log)"
assert_eq "scope gate: no demote call" "absent" "$(reconcile_log_state gh-pr-ready-undo.log)"
assert_eq "scope gate: no remove-label call" "absent" "$(reconcile_log_state gh-issue-remove-label-rest-calls.log)"
teardown

# Scope gate, ready side: a non-reviewed ready PR that is failing+CONFLICTING
# (the strongest demote signal) is still never demoted.
echo "Test: scope gate — no dispatch:reviewed ready+failing+CONFLICTING → never demoted (#17)"
setup
make_reconcile_pr 17 false CONFLICTING "$FAILING_ROLLUP" "$NO_REVIEWED_LABELS" \
  > "$STUB_DIR/reconcile-pr-list.json"
out=$("$TMPDIR_TEST/dispatch-reconcile-ready" 2>/dev/null)
assert_eq "scope gate (ready): no stdout" "" "$out"
assert_eq "scope gate (ready): no demote call" "absent" "$(reconcile_log_state gh-pr-ready-undo.log)"
teardown

# --- Attempt-clear: promote removes ALL dispatch:*-attempt-* labels ---------
# A promotable PR also carries two attempt counters; both are removed via
# gh_issue_remove_label_rest (REST DELETE .../issues/<N>/labels/<name>; PRs are
# issues in REST), and dispatch:reviewed is NOT among the removed.
echo "Test: promote clears all dispatch:*-attempt-* labels, keeps dispatch:reviewed (#18)"
setup
ATTEMPT_LABELS='[{"name":"dispatch:reviewed"},{"name":"dispatch:verify-attempt-2"},{"name":"dispatch:ci-wait-attempt-1"}]'
make_reconcile_pr 18 true MERGEABLE "$GREEN_ROLLUP" "$ATTEMPT_LABELS" \
  > "$STUB_DIR/reconcile-pr-list.json"
out=$("$TMPDIR_TEST/dispatch-reconcile-ready" 2>/dev/null)
assert_eq "attempt-clear: still promoted" "promoted #18" "$out"
assert_eq "attempt-clear: gh pr ready #18 logged" "18" "$(cat "$STUB_DIR/gh-pr-ready.log")"
rm_log=$(cat "$STUB_DIR/gh-issue-remove-label-rest-calls.log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if grep -q 'DELETE repos/{owner}/{repo}/issues/18/labels/dispatch:verify-attempt-2' <<<"$rm_log" \
   && grep -q 'DELETE repos/{owner}/{repo}/issues/18/labels/dispatch:ci-wait-attempt-1' <<<"$rm_log"; then
  PASS=$((PASS + 1)); echo "  PASS: attempt-clear: both attempt labels removed via REST DELETE"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: attempt-clear: both attempt labels removed via REST DELETE"
  echo "    actual gh-issue-remove-label-rest-calls.log: '$rm_log'"
fi
TOTAL=$((TOTAL + 1))
if grep -q 'labels/dispatch:reviewed' <<<"$rm_log"; then
  FAIL=$((FAIL + 1)); echo "  FAIL: attempt-clear: dispatch:reviewed must NOT be removed"
  echo "    actual gh-issue-remove-label-rest-calls.log: '$rm_log'"
else
  PASS=$((PASS + 1)); echo "  PASS: attempt-clear: dispatch:reviewed not removed"
fi
teardown

# --- Multi-PR: scope, promote, demote, and no-op coexist in one fetch --------
# A single fetch carrying four PRs reconciles each independently: a reviewed
# promotable PR is promoted, a reviewed demotable PR is demoted, a non-reviewed
# promotable PR is skipped, and a reviewed already-correct PR is a no-op.
echo "Test: multi-PR fetch reconciles each PR independently"
setup
# Each PR's CI verdict derives from the REST check-runs of its headRefOid (#1601);
# all four are green here.
for n in 20 21 22 23; do
  printf '%s' "{\"check_runs\": $GREEN_ROLLUP}" > "$STUB_DIR/check-runs-sha${n}.json"
done
{
  printf '[\n'
  printf '{"number":20,"isDraft":true,"mergeable":"MERGEABLE","headRefOid":"sha20","labels":%s},\n' \
    "$REVIEWED_LABELS"
  printf '{"number":21,"isDraft":false,"mergeable":"CONFLICTING","headRefOid":"sha21","labels":%s},\n' \
    "$REVIEWED_LABELS"
  printf '{"number":22,"isDraft":true,"mergeable":"MERGEABLE","headRefOid":"sha22","labels":%s},\n' \
    "$NO_REVIEWED_LABELS"
  printf '{"number":23,"isDraft":false,"mergeable":"MERGEABLE","headRefOid":"sha23","labels":%s}\n' \
    "$REVIEWED_LABELS"
  printf ']\n'
} > "$STUB_DIR/reconcile-pr-list.json"
out=$("$TMPDIR_TEST/dispatch-reconcile-ready" 2>/dev/null)
assert_eq "multi: #20 promoted" "20" "$(cat "$STUB_DIR/gh-pr-ready.log")"
assert_eq "multi: #21 demoted" "21" "$(cat "$STUB_DIR/gh-pr-ready-undo.log")"
TOTAL=$((TOTAL + 1))
if grep -q 'promoted #20' <<<"$out" \
   && grep -q 'demoted #21 (ci=passing merge=CONFLICTING)' <<<"$out" \
   && ! grep -qE '#22|#23' <<<"$out"; then
  PASS=$((PASS + 1)); echo "  PASS: multi: stdout has promote+demote lines only for the two reviewed actionable PRs"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: multi: stdout has promote+demote lines only for the two reviewed actionable PRs"
  echo "    actual stdout: '$out'"
fi
teardown

# --- Empty fetch: no PRs → no output, no calls ------------------------------
echo "Test: no open PRs → no output, no calls"
setup
echo "[]" > "$STUB_DIR/reconcile-pr-list.json"
out=$("$TMPDIR_TEST/dispatch-reconcile-ready" 2>/dev/null)
assert_eq "empty fetch: no stdout" "" "$out"
assert_eq "empty fetch: no promote call" "absent" "$(reconcile_log_state gh-pr-ready.log)"
assert_eq "empty fetch: no demote call" "absent" "$(reconcile_log_state gh-pr-ready-undo.log)"
teardown

# --- Executable-bit guard ----------------------------------------------------
echo "Test: dispatch-reconcile-ready is executable"
assert_eq "dispatch-reconcile-ready is executable" "yes" \
  "$([[ -x "$SCRIPT_DIR/dispatch-reconcile-ready" ]] && echo yes || echo no)"

# <<< END MOVED <<<

report_results
