#!/usr/bin/env bash
# Tests for lib-gh-rest -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 15-1496.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch_ci_verdict_rest verdict-fidelity tests (#1601)
# ============================================================================
# The REST check-runs endpoint returns status/conclusion in LOWERCASE
# (`completed`, `success`, `timed_out`); dispatch_classify_rollup matches the
# UPPERCASE statusCheckRollup enum. dispatch_ci_verdict_rest bridges the two by
# `ascii_upcase`ing every entry before classifying. These tests feed the helper
# the real lowercase REST shape directly (NOT the make_pr* uppercase fixtures)
# and assert hardcoded verdicts, so the conversion is genuinely exercised:
# delete the `ascii_upcase` from dispatch_ci_verdict_rest and the passing cases
# below flip to `pending` (lowercase `success` no longer matches `SUCCESS`),
# turning the suite RED. They also cover conclusions the selection fixtures
# never use (neutral-only, skipped, timed_out, cancelled, action_required) and
# the DISPATCH_CI_VERDICT_CACHE memoisation hit.
echo "=== dispatch_ci_verdict_rest (verdict fidelity) ==="

# Each case: write a lowercase REST check-runs fixture for a synthetic sha, then
# call the real helper (sourced from the copied lib.sh) against the stub gh.
verdict_rest_case() {
  local label="$1" sha="$2" check_runs_json="$3" expected="$4"
  printf '%s' "{\"check_runs\": $check_runs_json}" > "$STUB_DIR/check-runs-${sha}.json"
  local actual
  actual=$(source "$TMPDIR_TEST/lib.sh"; dispatch_ci_verdict_rest "$sha")
  assert_eq "$label" "$expected" "$actual"
}

echo "Test: REST verdict fidelity across conclusions"
setup
verdict_rest_case "verdict: lowercase success → passing" \
  "sha-success" '[{"status":"completed","conclusion":"success"}]' "passing"
verdict_rest_case "verdict: neutral-only → passing" \
  "sha-neutral" '[{"status":"completed","conclusion":"neutral"}]' "passing"
verdict_rest_case "verdict: skipped-only → passing" \
  "sha-skipped" '[{"status":"completed","conclusion":"skipped"}]' "passing"
verdict_rest_case "verdict: success + neutral + skipped → passing" \
  "sha-mixed-pass" '[{"status":"completed","conclusion":"success"},{"status":"completed","conclusion":"neutral"},{"status":"completed","conclusion":"skipped"}]' "passing"
verdict_rest_case "verdict: timed_out → failing" \
  "sha-timeout" '[{"status":"completed","conclusion":"timed_out"}]' "failing"
verdict_rest_case "verdict: cancelled → failing" \
  "sha-cancelled" '[{"status":"completed","conclusion":"cancelled"}]' "failing"
verdict_rest_case "verdict: action_required → failing" \
  "sha-action" '[{"status":"completed","conclusion":"action_required"}]' "failing"
verdict_rest_case "verdict: failure → failing" \
  "sha-failure" '[{"status":"completed","conclusion":"failure"}]' "failing"
verdict_rest_case "verdict: in_progress (null conclusion) → pending" \
  "sha-inprog" '[{"status":"in_progress","conclusion":null}]' "pending"
verdict_rest_case "verdict: desynced in_progress + success conclusion → passing" \
  "sha-desynced-success" '[{"status":"in_progress","conclusion":"success","completed_at":"2026-06-19T04:17:24Z"}]' "passing"
verdict_rest_case "verdict: completed success + desynced in_progress success → passing" \
  "sha-desynced-mixed" '[{"status":"completed","conclusion":"success"},{"status":"in_progress","conclusion":"success","completed_at":"2026-06-19T04:17:24Z"}]' "passing"
verdict_rest_case "verdict: genuine pending + desynced in_progress success → pending" \
  "sha-desynced-genuine-pending" '[{"status":"in_progress","conclusion":null},{"status":"in_progress","conclusion":"success","completed_at":"2026-06-19T04:17:24Z"}]' "pending"
verdict_rest_case "verdict: desynced in_progress + failure conclusion → failing" \
  "sha-desynced-failure" '[{"status":"in_progress","conclusion":"failure","completed_at":"2026-06-19T04:17:24Z"}]' "failing"
verdict_rest_case "verdict: queued → pending" \
  "sha-queued" '[{"status":"queued","conclusion":null}]' "pending"
verdict_rest_case "verdict: failing + still-running → failing (failure wins)" \
  "sha-mixed-fail" '[{"status":"completed","conclusion":"failure"},{"status":"in_progress","conclusion":null}]' "failing"
verdict_rest_case "verdict: empty check-runs → pending" \
  "sha-empty" '[]' "pending"
teardown

echo "Test: REST verdict cache hit serves stored verdict without re-fetch"
setup
# Prime the cache with a passing verdict, then overwrite the fixture with a
# failing one. A second call must return the cached `passing` (no REST call),
# proving the DISPATCH_CI_VERDICT_CACHE memoisation short-circuit.
export DISPATCH_CI_VERDICT_CACHE="$TMPDIR_TEST/ci-verdict-cache"
mkdir -p "$DISPATCH_CI_VERDICT_CACHE"
printf '%s' '{"check_runs":[{"status":"completed","conclusion":"success"}]}' \
  > "$STUB_DIR/check-runs-sha-cache.json"
primed=$(source "$TMPDIR_TEST/lib.sh"; dispatch_ci_verdict_rest "sha-cache")
assert_eq "verdict cache: first call → passing (and primes cache)" "passing" "$primed"
printf '%s' '{"check_runs":[{"status":"completed","conclusion":"failure"}]}' \
  > "$STUB_DIR/check-runs-sha-cache.json"
cached=$(source "$TMPDIR_TEST/lib.sh"; dispatch_ci_verdict_rest "sha-cache")
assert_eq "verdict cache: second call → cached passing despite changed fixture" "passing" "$cached"
unset DISPATCH_CI_VERDICT_CACHE
teardown

# ============================================================================
# Orphaned check runs classify as STALE, not pending
# (tactic-orphaned-check-run-pins-pending-ci-guard)
# ============================================================================
# GitHub sometimes strands a check run at `queued`/`in_progress` with a null
# conclusion while that row's PARENT check suite has already concluded. The row
# will never move and cannot be re-run, so classifying it `pending` pins
# graph-select-target's pending-ci-guard forever. dispatch_ci_verdict_rest
# resolves the parent suite for such rows and adapts a concluded-suite orphan as
# {status: COMPLETED, conclusion: STALE} — which dispatch_classify_rollup
# already counts as failing, routing the node into the fix lane's budgeted
# re-push instead of holding it.
#
# The suite fixtures are served by the shared stub's `check-suites/<id>` branch
# (dispatch-test-fixture.sh), which also appends one line per call to
# gh-check-suites-calls.log — that log is what the fast-path/dedup cases count.
echo "=== dispatch_ci_verdict_rest (orphaned check runs) ==="

# As verdict_rest_case, plus the parent check-suite fixtures the orphan rule
# reads. Trailing args are `<suite-id>=<suite-status>` pairs.
verdict_rest_suite_case() {
  local label="$1" sha="$2" check_runs_json="$3" expected="$4"
  shift 4
  local pair sid sstatus
  for pair in "$@"; do
    sid="${pair%%=*}"; sstatus="${pair#*=}"
    printf '{"status":"%s","conclusion":null}' "$sstatus" > "$STUB_DIR/check-suite-${sid}.json"
  done
  printf '%s' "{\"check_runs\": $check_runs_json}" > "$STUB_DIR/check-runs-${sha}.json"
  local actual
  actual=$(source "$TMPDIR_TEST/lib.sh"; dispatch_ci_verdict_rest "$sha")
  assert_eq "$label" "$expected" "$actual"
}

# Count the check-suites lookups made so far (the log is truncated per test).
suite_call_count() {
  local f="$STUB_DIR/gh-check-suites-calls.log"
  [[ -f "$f" ]] || { echo 0; return 0; }
  wc -l < "$f" | tr -d ' '
}

echo "Test: orphaned check run (parent suite concluded) → failing, not pending"
setup
: > "$STUB_DIR/gh-check-suites-calls.log"
# The incident shape: PR #3068 head 74548a2b, one `queued` CodeQL row whose
# suite 85475141868 had already reported completed/failure.
verdict_rest_suite_case "orphan: queued row + concluded suite → failing" \
  "sha-orphan" \
  '[{"status":"queued","conclusion":null,"check_suite":{"id":85475141868}}]' \
  "failing" "85475141868=completed"
# The important negative: a genuinely in-flight run whose suite is still
# running must STILL be pending. Breaking this would flip every live check in
# the fleet to failing — the strictly worse failure direction.
verdict_rest_suite_case "live: queued row + running suite → pending (regression guard)" \
  "sha-live" \
  '[{"status":"queued","conclusion":null,"check_suite":{"id":85475141869}}]' \
  "pending" "85475141869=in_progress"
# The rollup that actually pinned #3056: 22 green rows plus one orphan.
verdict_rest_suite_case "orphan: green rows + one orphan → failing (not pending)" \
  "sha-orphan-mixed" \
  '[{"status":"completed","conclusion":"success"},{"status":"completed","conclusion":"success"},{"status":"in_progress","conclusion":null,"check_suite":{"id":85480333626}}]' \
  "failing" "85480333626=completed"
# #2457 is the COMPLEMENT of this defect and must keep its existing verdict: a
# populated conclusion behind a stale status is concluded, not orphaned, even
# when its suite has finished. Re-labelling it STALE would fail green PRs.
verdict_rest_suite_case "desync (#2457): in_progress + success conclusion + concluded suite → passing" \
  "sha-desync-suite" \
  '[{"status":"in_progress","conclusion":"success","completed_at":"2026-06-19T04:17:24Z","check_suite":{"id":85480333627}}]' \
  "passing" "85480333627=completed"
# A pending row with no parent suite id is not resolvable, so it stays pending —
# and costs no lookup.
: > "$STUB_DIR/gh-check-suites-calls.log"
verdict_rest_case "no check_suite on a pending row → pending" \
  "sha-nosuite" '[{"status":"in_progress","conclusion":null}]' "pending"
assert_eq "no check_suite: zero check-suites lookups" "0" "$(suite_call_count)"
teardown

echo "Test: all-completed fast path makes zero check-suites calls"
setup
: > "$STUB_DIR/gh-check-suites-calls.log"
verdict_rest_case "fast path: all completed → passing" \
  "sha-fast" \
  '[{"status":"completed","conclusion":"success","check_suite":{"id":900001}},{"status":"completed","conclusion":"success","check_suite":{"id":900002}}]' \
  "passing"
assert_eq "fast path: zero check-suites lookups" "0" "$(suite_call_count)"
teardown

echo "Test: orphan lookups are deduplicated per parent suite"
setup
: > "$STUB_DIR/gh-check-suites-calls.log"
# Three pending rows, two of them sharing one suite: exactly two lookups.
verdict_rest_suite_case "dedup: three pending rows across two suites → failing" \
  "sha-dedup" \
  '[{"status":"queued","conclusion":null,"check_suite":{"id":910001}},{"status":"in_progress","conclusion":null,"check_suite":{"id":910001}},{"status":"queued","conclusion":null,"check_suite":{"id":910002}}]' \
  "failing" "910001=completed" "910002=in_progress"
assert_eq "dedup: one lookup per distinct suite" "2" "$(suite_call_count)"
teardown

echo "Test: a pending verdict is never cached, so the orphan stays detectable"
setup
export DISPATCH_CI_VERDICT_CACHE="$TMPDIR_TEST/ci-verdict-cache"
mkdir -p "$DISPATCH_CI_VERDICT_CACHE"
printf '%s' '{"check_runs":[{"status":"queued","conclusion":null,"check_suite":{"id":920001}}]}' \
  > "$STUB_DIR/check-runs-sha-orphan-cache.json"
printf '%s' '{"status":"in_progress","conclusion":null}' > "$STUB_DIR/check-suite-920001.json"
first=$(source "$TMPDIR_TEST/lib.sh"; dispatch_ci_verdict_rest "sha-orphan-cache")
assert_eq "pending cache: first call (suite still running) → pending" "pending" "$first"
if [[ -f "$DISPATCH_CI_VERDICT_CACHE/sha-orphan-cache" ]]; then
  cached_pending="cached"
else
  cached_pending="not-cached"
fi
assert_eq "pending cache: pending verdict is NOT persisted" "not-cached" "$cached_pending"
# The suite concludes; the orphan is now detectable and must be re-computed
# rather than served as a stale `pending` from cache.
printf '%s' '{"status":"completed","conclusion":"failure"}' > "$STUB_DIR/check-suite-920001.json"
second=$(source "$TMPDIR_TEST/lib.sh"; dispatch_ci_verdict_rest "sha-orphan-cache")
assert_eq "pending cache: recomputed once the suite concludes → failing" "failing" "$second"
unset DISPATCH_CI_VERDICT_CACHE
teardown

# ============================================================================
# gh_issue_list_rest edge-case tests (#1652)
# ============================================================================
# These three tests drive the REAL gh_issue_list_rest helper (sourced from the
# copied lib.sh) via the `dispatch-test-*` sentinel stub branch above. They cover
# the three behaviors that were previously unexercised:
#   (a) empty result (`[]` from the endpoint)
#   (b) pagination boundary (two concatenated arrays merged by jq -s 'add')
#   (c) --limit single-page branch (per_page=<limit>, no --paginate)
echo "=== gh_issue_list_rest (edge cases) ==="

echo "Test: empty result -- helper returns [] with length 0"
setup
# Create the call-log file before invocation so the grep assertion below has a
# valid target even if gh is never called.
: > "$STUB_DIR/gh-issue-list-rest-calls.log"
actual_empty=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_list_rest --state open --label dispatch-test-empty)
assert_eq "empty result: length == 0" "0" "$(jq 'length' <<<"$actual_empty")"
assert_eq "empty result: .[0].number is absent" "" "$(jq -r '.[0].number // empty' <<<"$actual_empty")"
# No --limit was passed, so the helper must take the full-paginate path.
if grep -q -- '--paginate' "$STUB_DIR/gh-issue-list-rest-calls.log"; then
  assert_eq "empty result: log contains --paginate" "yes" "yes"
else
  assert_eq "empty result: log contains --paginate" "yes" "no"
fi
teardown

echo "Test: pagination boundary -- two pages merged, all numbers present, PR objects filtered"
setup
# Page 1: two real issues + one object with pull_request key (must be filtered out).
printf '%s\n' '[
  {"number":101,"created_at":"2024-01-01T00:00:00Z","closed_at":null,"labels":[]},
  {"number":102,"created_at":"2024-01-02T00:00:00Z","closed_at":null,"labels":[],"pull_request":{"merged_at":null}},
  {"number":103,"created_at":"2024-01-03T00:00:00Z","closed_at":null,"labels":[]}
]' > "$STUB_DIR/rest-page-1.json"
# Page 2: two more real issues on a distinct page.
printf '%s\n' '[
  {"number":201,"created_at":"2024-01-04T00:00:00Z","closed_at":null,"labels":[]},
  {"number":202,"created_at":"2024-01-05T00:00:00Z","closed_at":null,"labels":[]}
]' > "$STUB_DIR/rest-page-2.json"
# Create the call-log file before invocation so the grep assertion below has a
# valid target even if gh is never called.
: > "$STUB_DIR/gh-issue-list-rest-calls.log"
actual_pag=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_list_rest --state open --label dispatch-test-paginate)
# Page-1 issue numbers 101 and 103 must appear (PR object 102 must NOT).
assert_eq "paginate: issue 101 present" "true" "$(jq 'any(.[]; .number == 101)' <<<"$actual_pag")"
assert_eq "paginate: issue 103 present" "true" "$(jq 'any(.[]; .number == 103)' <<<"$actual_pag")"
# Page-2 numbers must also appear -- proves jq -s 'add' merged both pages.
assert_eq "paginate: issue 201 present" "true" "$(jq 'any(.[]; .number == 201)' <<<"$actual_pag")"
assert_eq "paginate: issue 202 present" "true" "$(jq 'any(.[]; .number == 202)' <<<"$actual_pag")"
# PR object 102 must be absent (helper filters .pull_request != null).
assert_eq "paginate: PR object 102 filtered out" "false" "$(jq 'any(.[]; .number == 102)' <<<"$actual_pag")"
# No --limit was passed, so the helper must take the --paginate path. This pins
# the code path: a regression to single-page would still merge the two fixture
# pages here but would not pass --paginate.
if grep -q -- '--paginate' "$STUB_DIR/gh-issue-list-rest-calls.log"; then
  assert_eq "paginate: log contains --paginate" "yes" "yes"
else
  assert_eq "paginate: log contains --paginate" "yes" "no"
fi
teardown

echo "Test: --limit flag -- single-page branch (per_page=limit, no --paginate)"
setup
printf '%s\n' '[
  {"number":301,"created_at":"2024-01-06T00:00:00Z","closed_at":null,"labels":[]},
  {"number":302,"created_at":"2024-01-07T00:00:00Z","closed_at":null,"labels":[]},
  {"number":303,"created_at":"2024-01-08T00:00:00Z","closed_at":null,"labels":[]}
]' > "$STUB_DIR/rest-limit.json"
# Create the call-log file before invocation so the grep assertions below have a
# valid target even if gh is never called.
: > "$STUB_DIR/gh-issue-list-rest-calls.log"
actual_lim=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_list_rest --state open --limit 50 --label dispatch-test-limit)
assert_eq "limit: result length matches fixture (3 items)" "3" "$(jq 'length' <<<"$actual_lim")"
# The call log must contain per_page=50 (limit was passed through) ...
# Anchor with a trailing non-digit so this cannot spuriously match per_page=500.
if grep -q 'per_page=50[^0-9]' "$STUB_DIR/gh-issue-list-rest-calls.log"; then
  assert_eq "limit: log contains per_page=50" "yes" "yes"
else
  assert_eq "limit: log contains per_page=50" "yes" "no"
fi
# ... and must NOT contain --paginate (single-page branch was taken).
if grep -q -- '--paginate' "$STUB_DIR/gh-issue-list-rest-calls.log"; then
  assert_eq "limit: log does not contain --paginate" "no" "yes"
else
  assert_eq "limit: log does not contain --paginate" "no" "no"
fi
teardown

echo "Test: --paginate flag at limit <= 100 -- forces paginate-then-slice (up to <limit> real issues)"
setup
# Page 1: one real issue, one PR object, one real issue (mixed). A single page of
# per_page=3 would yield only 2 real issues after PR-filtering -- the bug this
# flag fixes.
printf '%s\n' '[
  {"number":401,"created_at":"2024-02-01T00:00:00Z","closed_at":null,"labels":[]},
  {"number":402,"created_at":"2024-02-02T00:00:00Z","closed_at":null,"labels":[],"pull_request":{"merged_at":null}},
  {"number":403,"created_at":"2024-02-03T00:00:00Z","closed_at":null,"labels":[]}
]' > "$STUB_DIR/rest-forcepage-1.json"
# Page 2: two more real issues -- reachable ONLY if --paginate was passed.
printf '%s\n' '[
  {"number":404,"created_at":"2024-02-04T00:00:00Z","closed_at":null,"labels":[]},
  {"number":405,"created_at":"2024-02-05T00:00:00Z","closed_at":null,"labels":[]}
]' > "$STUB_DIR/rest-forcepage-2.json"
: > "$STUB_DIR/gh-issue-list-rest-calls.log"
actual_fp=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_list_rest --state closed --limit 3 --paginate --label dispatch-test-limit-force-paginate)
# Merged both pages, filtered PR 402, then sliced to the first 3 real issues:
# 401, 403, 404 (405 is beyond the slice).
assert_eq "force-paginate: result length == limit (3)" "3" "$(jq 'length' <<<"$actual_fp")"
assert_eq "force-paginate: issue 401 present" "true" "$(jq 'any(.[]; .number == 401)' <<<"$actual_fp")"
assert_eq "force-paginate: issue 403 present (page-1, after filtered PR)" "true" "$(jq 'any(.[]; .number == 403)' <<<"$actual_fp")"
assert_eq "force-paginate: issue 404 present (page-2 -- proves pagination)" "true" "$(jq 'any(.[]; .number == 404)' <<<"$actual_fp")"
assert_eq "force-paginate: PR object 402 filtered out" "false" "$(jq 'any(.[]; .number == 402)' <<<"$actual_fp")"
assert_eq "force-paginate: issue 405 sliced off (beyond limit)" "false" "$(jq 'any(.[]; .number == 405)' <<<"$actual_fp")"
# The call log must contain --paginate (the forced path was taken) ...
if grep -q -- '--paginate' "$STUB_DIR/gh-issue-list-rest-calls.log"; then
  assert_eq "force-paginate: log contains --paginate" "yes" "yes"
else
  assert_eq "force-paginate: log contains --paginate" "yes" "no"
fi
# ... at per_page=100 (paginate clamp), NOT per_page=3 (the single-page value).
if grep -q 'per_page=100[^0-9]' "$STUB_DIR/gh-issue-list-rest-calls.log"; then
  assert_eq "force-paginate: log contains per_page=100" "yes" "yes"
else
  assert_eq "force-paginate: log contains per_page=100" "yes" "no"
fi
teardown

echo "Test: gh-failure -- both branches return non-zero with diagnostic stderr"
setup
: > "$STUB_DIR/gh-issue-list-rest-calls.log"
: > "$STUB_DIR/gh-fail-rest"
rc_fail=0
err_fail=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_list_rest --state open --label dispatch-test-empty 2>&1 >/dev/null) || rc_fail=$?
assert_eq "gh-failure: --paginate branch returns non-zero" "1" "$rc_fail"
case "$err_fail" in *"gh_issue_list_rest: gh api failed"*) m=yes ;; *) m=no ;; esac
assert_eq "gh-failure: stderr names the helper failure" "yes" "$m"
rc_fail_lim=0
err_fail_lim=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_list_rest --state open --limit 50 --label dispatch-test-empty 2>&1 >/dev/null) || rc_fail_lim=$?
assert_eq "gh-failure: single-page branch returns non-zero" "1" "$rc_fail_lim"
case "$err_fail_lim" in *"gh_issue_list_rest: gh api failed"*) m_lim=yes ;; *) m_lim=no ;; esac
assert_eq "gh-failure: single-page stderr names the helper failure" "yes" "$m_lim"
teardown

echo "Test: --repo flag -- cross-repo path uses owner/other-repo segment, not placeholder"
setup
: > "$STUB_DIR/gh-issue-list-rest-calls.log"
actual_repo=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_list_rest --state open --repo owner/other-repo --label dispatch-test-empty)
if grep -q 'repos/owner/other-repo/issues' "$STUB_DIR/gh-issue-list-rest-calls.log"; then seg=yes; else seg=no; fi
assert_eq "--repo: API path uses cross-repo segment" "yes" "$seg"
if grep -q 'repos/{owner}/{repo}/issues' "$STUB_DIR/gh-issue-list-rest-calls.log"; then ph=yes; else ph=no; fi
assert_eq "--repo: placeholder absent from cross-repo call" "no" "$ph"
assert_eq "--repo: returns the stub's empty array" "[]" "$actual_repo"
# Single-page (--limit) branch with --repo: pin that the cross-repo segment is
# emitted under the per_page= (no --paginate) path too, not just --paginate.
: > "$STUB_DIR/gh-issue-list-rest-calls.log"
actual_repo_lim=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_list_rest --state open --limit 50 --repo owner/other-repo --label dispatch-test-empty)
assert_eq "--repo+--limit: returns the stub's empty array" "[]" "$actual_repo_lim"
if grep -q 'repos/owner/other-repo/issues' "$STUB_DIR/gh-issue-list-rest-calls.log"; then seg_lim=yes; else seg_lim=no; fi
assert_eq "--repo+--limit: single-page API path uses cross-repo segment" "yes" "$seg_lim"
# Prove it was the single-page branch (not --paginate) that emitted the segment.
if grep -q 'per_page=50[^0-9]' "$STUB_DIR/gh-issue-list-rest-calls.log"; then
  assert_eq "--repo+--limit: log contains per_page=50" "yes" "yes"
else
  assert_eq "--repo+--limit: log contains per_page=50" "yes" "no"
fi
if grep -q -- '--paginate' "$STUB_DIR/gh-issue-list-rest-calls.log"; then
  assert_eq "--repo+--limit: log does not contain --paginate" "no" "yes"
else
  assert_eq "--repo+--limit: log does not contain --paginate" "no" "no"
fi
teardown

echo "Test: --state all -- issued query carries state=all (#2258)"
setup
: > "$STUB_DIR/gh-issue-list-rest-calls.log"
actual_all=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_list_rest --state all --label dispatch-test-empty)
assert_eq "--state all: returns the stub's empty array" "[]" "$actual_all"
# The query must carry state=all (anchor with a non-word char so this cannot
# match state=allowed or similar).
if grep -qE 'state=all([&?]|$| )' "$STUB_DIR/gh-issue-list-rest-calls.log"; then sa=yes; else sa=no; fi
assert_eq "--state all: query carries state=all" "yes" "$sa"
teardown

echo "Test: --include-title -- present projects title, absent omits it (#2258)"
setup
printf '%s\n' '[
  {"number":401,"title":"first issue","body":"b1","created_at":"2024-02-01T00:00:00Z","closed_at":null,"labels":[]},
  {"number":402,"title":"second issue","body":"b2","created_at":"2024-02-02T00:00:00Z","closed_at":null,"labels":[]}
]' > "$STUB_DIR/rest-title.json"
: > "$STUB_DIR/gh-issue-list-rest-calls.log"
# Absent: projected objects must NOT carry a title key.
without_title=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_list_rest --state open --label dispatch-test-title)
assert_eq "--include-title absent: .[0] has no title key" "false" "$(jq '.[0] | has("title")' <<<"$without_title")"
assert_eq "--include-title absent: .[0] has no body key" "false" "$(jq '.[0] | has("body")' <<<"$without_title")"
assert_eq "--include-title absent: number still projected" "401" "$(jq '.[0].number' <<<"$without_title")"
# Present: projected objects carry title but still not body.
with_title=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_list_rest --state open --include-title --label dispatch-test-title)
assert_eq "--include-title present: .[0] carries title" "first issue" "$(jq -r '.[0].title' <<<"$with_title")"
assert_eq "--include-title present: body still omitted" "false" "$(jq '.[0] | has("body")' <<<"$with_title")"
# Both flags combine: title AND body present.
with_both=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_list_rest --state open --include-title --include-body --label dispatch-test-title)
assert_eq "--include-title+--include-body: .[0] carries title" "first issue" "$(jq -r '.[0].title' <<<"$with_both")"
assert_eq "--include-title+--include-body: .[0] carries body" "b1" "$(jq -r '.[0].body' <<<"$with_both")"
teardown

echo "Test: --limit > 100 -- paginate path, sliced to limit (#2258)"
setup
# 150 items split across two pages (80 + 70). Numbers 1000..1149.
jq -nc '[range(1000;1080) | {number: ., created_at:"2024-03-01T00:00:00Z", closed_at:null, labels:[]}]' \
  > "$STUB_DIR/rest-bigpage-1.json"
jq -nc '[range(1080;1150) | {number: ., created_at:"2024-03-01T00:00:00Z", closed_at:null, labels:[]}]' \
  > "$STUB_DIR/rest-bigpage-2.json"
: > "$STUB_DIR/gh-issue-list-rest-calls.log"
actual_big=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_list_rest --state open --limit 120 --label dispatch-test-limit-paginate)
assert_eq "--limit 120 over 150 items: result length == 120" "120" "$(jq 'length' <<<"$actual_big")"
# The >100-limit path must --paginate (not single-page) ...
if grep -q -- '--paginate' "$STUB_DIR/gh-issue-list-rest-calls.log"; then bp=yes; else bp=no; fi
assert_eq "--limit 120: log contains --paginate" "yes" "$bp"
# ... at the clamped per_page=100 (not per_page=120).
if grep -q 'per_page=100[^0-9]' "$STUB_DIR/gh-issue-list-rest-calls.log"; then pp=yes; else pp=no; fi
assert_eq "--limit 120: per_page clamped to 100" "yes" "$pp"
if grep -q 'per_page=120' "$STUB_DIR/gh-issue-list-rest-calls.log"; then pp120=yes; else pp120=no; fi
assert_eq "--limit 120: per_page is NOT 120" "no" "$pp120"
teardown

echo "Test: --limit > 100 -- exactly-limit items still trips a caller's len==limit guard (#2258)"
setup
# Exactly 120 items. With --limit 120 the result length is 120, so a caller's
# `len == limit` truncation guard fires (just as it would on a single >100 page).
jq -nc '[range(2000;2120) | {number: ., created_at:"2024-04-01T00:00:00Z", closed_at:null, labels:[]}]' \
  > "$STUB_DIR/rest-exact.json"
: > "$STUB_DIR/gh-issue-list-rest-calls.log"
actual_exact=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_list_rest --state open --limit 120 --label dispatch-test-limit-exact)
exact_len=$(jq 'length' <<<"$actual_exact")
assert_eq "--limit 120 over exactly 120 items: result length == 120" "120" "$exact_len"
# Simulate a caller's truncation guard: len == limit ⇒ truncated.
if [[ "$exact_len" -eq 120 ]]; then guard=fired; else guard=clear; fi
assert_eq "--limit 120: len==limit guard fires on exactly-limit fixture" "fired" "$guard"
teardown

# ============================================================================
# gh_pr_list_rest edge-case tests (#2258)
# ============================================================================
# These tests drive the REAL gh_pr_list_rest helper (sourced from the copied
# lib.sh) via the `api *repos/*/pulls?*` stub arm above, which routes by fixture
# presence and logs each call to gh-pr-list-rest-calls.log. They mirror the
# gh_issue_list_rest edge-case block.
echo "=== gh_pr_list_rest (edge cases) ==="

echo "Test: gh_pr_list_rest empty result -- helper returns [] with length 0"
setup
: > "$STUB_DIR/gh-pr-list-rest-calls.log"
actual_pr_empty=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_list_rest --state open)
assert_eq "pr empty result: length == 0" "0" "$(jq 'length' <<<"$actual_pr_empty")"
# No --limit was passed, so the helper must take the full-paginate path.
if grep -q -- '--paginate' "$STUB_DIR/gh-pr-list-rest-calls.log"; then bp=yes; else bp=no; fi
assert_eq "pr empty result: log contains --paginate" "yes" "$bp"
teardown

echo "Test: gh_pr_list_rest --limit > 100 -- paginate path, sliced to limit"
setup
# 150 PRs split across two pages (80 + 70). Numbers 1000..1149.
jq -nc '[range(1000;1080) | {number: ., state:"open", title:"t", merged_at:null, created_at:"2024-03-01T00:00:00Z"}]' \
  > "$STUB_DIR/rest-pulls-page-1.json"
jq -nc '[range(1080;1150) | {number: ., state:"open", title:"t", merged_at:null, created_at:"2024-03-01T00:00:00Z"}]' \
  > "$STUB_DIR/rest-pulls-page-2.json"
: > "$STUB_DIR/gh-pr-list-rest-calls.log"
actual_pr_big=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_list_rest --state open --limit 120)
assert_eq "pr --limit 120 over 150: result length == 120" "120" "$(jq 'length' <<<"$actual_pr_big")"
# The >100-limit path must --paginate (not single-page) ...
if grep -q -- '--paginate' "$STUB_DIR/gh-pr-list-rest-calls.log"; then bp=yes; else bp=no; fi
assert_eq "pr --limit 120: log contains --paginate" "yes" "$bp"
# ... at the clamped per_page=100 (not per_page=120).
if grep -qE 'per_page=100([^0-9]|$)' "$STUB_DIR/gh-pr-list-rest-calls.log"; then pp=yes; else pp=no; fi
assert_eq "pr --limit 120: per_page clamped to 100" "yes" "$pp"
if grep -q 'per_page=120' "$STUB_DIR/gh-pr-list-rest-calls.log"; then pp120=yes; else pp120=no; fi
assert_eq "pr --limit 120: per_page is NOT 120" "no" "$pp120"
teardown

echo "Test: gh_pr_list_rest --limit single page (<=100, per_page=limit, no --paginate)"
setup
jq -nc '[range(300;303) | {number: ., state:"open", title:"t", merged_at:null, created_at:"2024-01-06T00:00:00Z"}]' \
  > "$STUB_DIR/rest-pulls-page-1.json"
: > "$STUB_DIR/gh-pr-list-rest-calls.log"
actual_pr_lim=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_list_rest --state open --limit 50)
assert_eq "pr limit: result length matches fixture (3 items)" "3" "$(jq 'length' <<<"$actual_pr_lim")"
# The call log must contain per_page=50 (anchor trailing non-digit) ...
if grep -qE 'per_page=50([^0-9]|$)' "$STUB_DIR/gh-pr-list-rest-calls.log"; then pp=yes; else pp=no; fi
assert_eq "pr limit: log contains per_page=50" "yes" "$pp"
# ... and must NOT contain --paginate (single-page branch).
if grep -q -- '--paginate' "$STUB_DIR/gh-pr-list-rest-calls.log"; then bp=yes; else bp=no; fi
assert_eq "pr limit: log does not contain --paginate" "no" "$bp"
teardown

echo "Test: gh_pr_list_rest gh-failure -- returns non-zero with diagnostic stderr"
setup
: > "$STUB_DIR/gh-pr-list-rest-calls.log"
: > "$STUB_DIR/gh-fail-pulls"
rc_pr_fail=0
err_pr_fail=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_list_rest --state open 2>&1 >/dev/null) || rc_pr_fail=$?
assert_eq "pr gh-failure: returns non-zero" "1" "$rc_pr_fail"
case "$err_pr_fail" in *"gh_pr_list_rest: gh api failed"*) m=yes ;; *) m=no ;; esac
assert_eq "pr gh-failure: stderr names the helper failure" "yes" "$m"
teardown

echo "Test: gh_pr_list_rest --head -- query carries head=<owner>:<branch> (repo-view owner)"
setup
echo '[]' > "$STUB_DIR/rest-pulls-page-1.json"
: > "$STUB_DIR/gh-pr-list-rest-calls.log"
# No --repo: owner resolves via the stubbed `gh repo view ... .owner.login` => natb1.
actual_pr_head=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_list_rest --state open --head my-branch)
assert_eq "pr --head: returns the stub's empty array" "[]" "$actual_pr_head"
if grep -q 'head=natb1:my-branch' "$STUB_DIR/gh-pr-list-rest-calls.log"; then hb=yes; else hb=no; fi
assert_eq "pr --head: query carries head=natb1:my-branch" "yes" "$hb"
teardown

echo "Test: gh_pr_list_rest --head + --repo -- owner from repo segment, not repo-view"
setup
echo '[]' > "$STUB_DIR/rest-pulls-page-1.json"
: > "$STUB_DIR/gh-pr-list-rest-calls.log"
# With --repo owner/other-repo, the head owner is the first segment (owner).
actual_pr_head_repo=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_list_rest --state open --repo owner/other-repo --head feat-x)
assert_eq "pr --head+--repo: returns the stub's empty array" "[]" "$actual_pr_head_repo"
if grep -q 'head=owner:feat-x' "$STUB_DIR/gh-pr-list-rest-calls.log"; then hb=yes; else hb=no; fi
assert_eq "pr --head+--repo: query carries head=owner:feat-x" "yes" "$hb"
if grep -q 'repos/owner/other-repo/pulls' "$STUB_DIR/gh-pr-list-rest-calls.log"; then seg=yes; else seg=no; fi
assert_eq "pr --head+--repo: API path uses cross-repo segment" "yes" "$seg"
teardown

echo "Test: gh_pr_list_rest state normalization -- OPEN / MERGED / CLOSED"
setup
# One open PR, one closed+merged (merged_at set), one closed+unmerged (null).
printf '%s\n' '[
  {"number":501,"state":"open","title":"open pr","merged_at":null,"created_at":"2024-05-01T00:00:00Z"},
  {"number":502,"state":"closed","title":"merged pr","merged_at":"2024-05-02T00:00:00Z","created_at":"2024-05-01T00:00:00Z"},
  {"number":503,"state":"closed","title":"closed pr","merged_at":null,"created_at":"2024-05-01T00:00:00Z"}
]' > "$STUB_DIR/rest-pulls-page-1.json"
: > "$STUB_DIR/gh-pr-list-rest-calls.log"
actual_pr_norm=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_list_rest --state all)
assert_eq "pr normalize: 501 (open) -> OPEN" "OPEN" "$(jq -r '.[] | select(.number==501) | .state' <<<"$actual_pr_norm")"
assert_eq "pr normalize: 502 (closed+merged_at) -> MERGED" "MERGED" "$(jq -r '.[] | select(.number==502) | .state' <<<"$actual_pr_norm")"
assert_eq "pr normalize: 503 (closed+null merged_at) -> CLOSED" "CLOSED" "$(jq -r '.[] | select(.number==503) | .state' <<<"$actual_pr_norm")"
# Projection remaps snake_case to camelCase mergedAt/createdAt; title present.
assert_eq "pr normalize: 502 mergedAt remapped" "2024-05-02T00:00:00Z" "$(jq -r '.[] | select(.number==502) | .mergedAt' <<<"$actual_pr_norm")"
assert_eq "pr normalize: 501 createdAt remapped" "2024-05-01T00:00:00Z" "$(jq -r '.[] | select(.number==501) | .createdAt' <<<"$actual_pr_norm")"
assert_eq "pr normalize: 501 title projected" "open pr" "$(jq -r '.[] | select(.number==501) | .title' <<<"$actual_pr_norm")"
teardown

echo "Test: --include-body -- projection includes title and body; default omits title"
setup
printf '%s\n' '[
  {"number":401,"title":"Fixture title for 401","created_at":"2024-01-09T00:00:00Z","closed_at":null,"labels":[],"body":"Fixture body for 401"}
]' > "$STUB_DIR/rest-includebody.json"
: > "$STUB_DIR/gh-issue-list-rest-calls.log"
# --include-body: projection must carry a non-null title (Unit 1 #2259) and body.
actual_ib=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_list_rest --state all --include-body --label dispatch-test-includebody)
assert_eq "--include-body: .[0].title is the fixture title" "Fixture title for 401" "$(jq -r '.[0].title // empty' <<<"$actual_ib")"
assert_eq "--include-body: .[0].body is the fixture body" "Fixture body for 401" "$(jq -r '.[0].body // empty' <<<"$actual_ib")"
# No --limit was passed, so the helper must take the full-paginate path. Pin the
# code path: a regression to single-page would still emit the fixture content
# from the stub but would not pass --paginate.
if grep -q -- '--paginate' "$STUB_DIR/gh-issue-list-rest-calls.log"; then
  assert_eq "--include-body: log contains --paginate" "yes" "yes"
else
  assert_eq "--include-body: log contains --paginate" "yes" "no"
fi
# Default projection (no --include-body) must still OMIT title (zero blast radius).
: > "$STUB_DIR/gh-issue-list-rest-calls.log"
actual_default=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_list_rest --state all --label dispatch-test-includebody)
assert_eq "default projection: .[0].title is absent" "" "$(jq -r '.[0].title // empty' <<<"$actual_default")"
assert_eq "default projection: .[0].number is present" "401" "$(jq -r '.[0].number // empty' <<<"$actual_default")"
# Default projection also takes the no-limit full-paginate path.
if grep -q -- '--paginate' "$STUB_DIR/gh-issue-list-rest-calls.log"; then
  assert_eq "default projection: log contains --paginate" "yes" "yes"
else
  assert_eq "default projection: log contains --paginate" "yes" "no"
fi
teardown

# ============================================================================
# gh_issue_view_rest / gh_pr_view_rest byte-compatibility tests (#2255)
# ============================================================================
# These drive the REAL helpers (sourced from the copied lib.sh) via the 9xxx
# sentinel stub branches. The oracle for the expected shape is the porcelain the
# helpers replace: `gh issue view <N> --json number,title,body,state,labels,
# assignees` (UPPERCASE state, labels:[{name}], assignees:[{login}]) and
# `gh pr view <N> --json number,title,body,state,mergeable,mergeStateStatus`
# (UPPERCASE state, mergeable as the GraphQL enum string, mergeStateStatus
# UPPERCASE). The fixtures are the RAW REST shape (lowercase state, label/
# assignee objects with extra keys, mergeable as a boolean, snake_case
# mergeable_state), so the projection + casing/enum bridges are genuinely
# exercised: delete a bridge and the assertions below flip RED.
echo "=== gh_issue_view_rest / gh_pr_view_rest (byte-compat) ==="

echo "Test: gh_issue_view_rest -- projection + state upcase + labels/assignees narrowing"
setup
# Raw REST issue: lowercase state, label objects carrying extra keys (id/color/
# description), assignee objects carrying extra keys (id/type). The projection
# must upcase state and narrow labels→[{name}] / assignees→[{login}].
printf '%s\n' '{
  "number": 9001,
  "title": "a sample issue",
  "body": "the issue body",
  "state": "open",
  "state_reason": null,
  "created_at": "2026-01-02T03:04:05Z",
  "labels": [
    {"id": 1, "name": "bug", "color": "ff0000", "description": "a bug"},
    {"id": 2, "name": "dispatch:planned", "color": "00ff00", "description": null}
  ],
  "assignees": [
    {"login": "alice", "id": 10, "type": "User"},
    {"login": "bob", "id": 11, "type": "User"}
  ],
  "extra_rest_field": "must not appear in projection"
}' > "$STUB_DIR/view-issue-9001.json"
iv=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_view_rest 9001)
assert_eq "issue: number" "9001" "$(jq -r '.number' <<<"$iv")"
assert_eq "issue: title" "a sample issue" "$(jq -r '.title' <<<"$iv")"
assert_eq "issue: body" "the issue body" "$(jq -r '.body' <<<"$iv")"
assert_eq "issue: state upcased OPEN" "OPEN" "$(jq -r '.state' <<<"$iv")"
assert_eq "issue: createdAt passthrough from created_at" "2026-01-02T03:04:05Z" "$(jq -r '.createdAt' <<<"$iv")"
# state_reason null must be PRESERVED as null (not upcased, not coerced).
assert_eq "issue: stateReason null preserved" "true" "$(jq '.stateReason == null' <<<"$iv")"
assert_eq "issue: labels narrowed to [{name}] (2 labels)" "2" "$(jq '.labels | length' <<<"$iv")"
assert_eq "issue: first label name" "bug" "$(jq -r '.labels[0].name' <<<"$iv")"
assert_eq "issue: label objects carry ONLY name (no color key)" "1" "$(jq '.labels[0] | keys | length' <<<"$iv")"
assert_eq "issue: assignees narrowed to [{login}]" "alice" "$(jq -r '.assignees[0].login' <<<"$iv")"
assert_eq "issue: assignee objects carry ONLY login" "1" "$(jq '.assignees[0] | keys | length' <<<"$iv")"
assert_eq "issue: raw REST extra field dropped" "" "$(jq -r '.extra_rest_field // empty' <<<"$iv")"
# Top-level keys are exactly the porcelain set.
assert_eq "issue: top-level key set" "assignees body closedAt createdAt labels number state stateReason title" \
  "$(jq -r 'keys | join(" ")' <<<"$iv")"
teardown

echo "Test: gh_issue_view_rest -- closed state upcases to CLOSED; empty labels/assignees"
setup
printf '%s\n' '{
  "number": 9002,
  "title": "closed one",
  "body": "",
  "state": "closed",
  "state_reason": "completed",
  "created_at": "2026-02-03T04:05:06Z",
  "closed_at": "2026-02-04T05:06:07Z",
  "labels": [],
  "assignees": []
}' > "$STUB_DIR/view-issue-9002.json"
iv2=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_view_rest 9002)
assert_eq "issue: closed → CLOSED" "CLOSED" "$(jq -r '.state' <<<"$iv2")"
# closedAt passthrough from closed_at: REST snake_case → porcelain camelCase.
assert_eq "issue: closedAt passthrough from closed_at" "2026-02-04T05:06:07Z" "$(jq -r '.closedAt' <<<"$iv2")"
# REST lowercase state_reason `completed` → porcelain UPPERCASE enum COMPLETED.
assert_eq "issue: stateReason completed upcased to COMPLETED" "COMPLETED" "$(jq -r '.stateReason' <<<"$iv2")"
# A second non-null case: not_planned → NOT_PLANNED.
printf '%s\n' '{"number":9005,"title":"np","body":"","state":"closed","state_reason":"not_planned","created_at":"2026-03-01T00:00:00Z","labels":[],"assignees":[]}' \
  > "$STUB_DIR/view-issue-9005.json"
iv_np=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_view_rest 9005)
assert_eq "issue: stateReason not_planned upcased to NOT_PLANNED" "NOT_PLANNED" "$(jq -r '.stateReason' <<<"$iv_np")"
# Byte-compat: a REST null body must surface as porcelain's empty string.
printf '%s\n' '{"number":9004,"title":"t","state":"open","body":null,"labels":[],"assignees":[]}' \
  > "$STUB_DIR/view-issue-9004.json"
iv_nb=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_view_rest 9004)
assert_eq "issue: null body coerced to empty string" "true" "$(jq '.body == ""' <<<"$iv_nb")"
assert_eq "issue: empty labels length 0" "0" "$(jq '.labels | length' <<<"$iv2")"
assert_eq "issue: empty assignees length 0" "0" "$(jq '.assignees | length' <<<"$iv2")"
teardown

echo "Test: gh_issue_view_rest -- --repo flag emits cross-repo segment"
setup
: > "$STUB_DIR/gh-issue-view-rest-calls.log"
printf '%s\n' '{"number":9003,"title":"t","body":"b","state":"open","labels":[],"assignees":[]}' \
  > "$STUB_DIR/view-issue-9003.json"
source "$TMPDIR_TEST/lib.sh"; gh_issue_view_rest 9003 --repo owner/other-repo >/dev/null
if grep -q 'repos/owner/other-repo/issues/9003' "$STUB_DIR/gh-issue-view-rest-calls.log"; then seg=yes; else seg=no; fi
assert_eq "issue: --repo uses cross-repo segment" "yes" "$seg"
if grep -q 'repos/{owner}/{repo}/issues' "$STUB_DIR/gh-issue-view-rest-calls.log"; then ph=yes; else ph=no; fi
assert_eq "issue: placeholder absent on cross-repo call" "no" "$ph"
teardown

echo "Test: gh_issue_view_rest -- missing number returns non-zero with diagnostic stderr"
setup
rc_iv=0
err_iv=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_view_rest 2>&1 >/dev/null) || rc_iv=$?
assert_eq "issue: missing number → non-zero" "1" "$rc_iv"
case "$err_iv" in *"gh_issue_view_rest: issue number is required"*) m=yes ;; *) m=no ;; esac
assert_eq "issue: missing-number stderr names the helper" "yes" "$m"
teardown

echo "Test: gh_issue_view_rest -- gh failure returns non-zero with diagnostic stderr"
setup
: > "$STUB_DIR/gh-fail-rest"
rc_ivf=0
err_ivf=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_view_rest 9001 2>&1 >/dev/null) || rc_ivf=$?
assert_eq "issue: gh failure → non-zero" "1" "$rc_ivf"
case "$err_ivf" in *"gh_issue_view_rest: gh api failed"*) mf=yes ;; *) mf=no ;; esac
assert_eq "issue: gh-failure stderr names the helper" "yes" "$mf"
teardown

echo "Test: gh_issue_view_rest --comments -- paginated multi-page fetch, remapped shape"
setup
# No --comments flag → no second call, no comments key. (Reuse the 9001 fixture.)
printf '%s\n' '{"number":9001,"title":"t","body":"b","state":"open","state_reason":null,"created_at":"2026-01-01T00:00:00Z","labels":[],"assignees":[]}' \
  > "$STUB_DIR/view-issue-9001.json"
iv_nc=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_view_rest 9001)
assert_eq "issue: no --comments → comments key absent" "false" "$(jq 'has("comments")' <<<"$iv_nc")"
# Multi-page comments fixture: page 1 = 30 comments, page 2 = 5 comments (35 > 30,
# so a non-paginating single-page fetch would miss page 2). Each comment is the
# RAW REST shape (nested .user.login, snake_case .created_at) so the remap to
# {author:{login}, createdAt, body} is genuinely exercised.
jq -n '[range(30) | {user:{login:("u"+(.|tostring)), id:.}, created_at:("2026-01-01T00:00:0"+( . % 10 |tostring)+"Z"), body:("comment "+(.|tostring)), extra:"drop"}]' \
  > "$STUB_DIR/view-issue-comments-9001-page1.json"
jq -n '[range(30;35) | {user:{login:("u"+(.|tostring)), id:.}, created_at:"2026-02-01T00:00:00Z", body:("comment "+(.|tostring)), extra:"drop"}]' \
  > "$STUB_DIR/view-issue-comments-9001-page2.json"
ivc=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_view_rest 9001 --comments)
assert_eq "comments: full count across both pages (>30 proves pagination)" "35" "$(jq '.comments | length' <<<"$ivc")"
assert_eq "comments: remapped author.login (nested from .user.login)" "u0" "$(jq -r '.comments[0].author.login' <<<"$ivc")"
assert_eq "comments: remapped createdAt from .created_at" "2026-01-01T00:00:00Z" "$(jq -r '.comments[0].createdAt' <<<"$ivc")"
assert_eq "comments: remapped body" "comment 0" "$(jq -r '.comments[0].body' <<<"$ivc")"
assert_eq "comments: page-2 comment present (login)" "u34" "$(jq -r '.comments[34].author.login' <<<"$ivc")"
assert_eq "comments: remapped object carries ONLY author/createdAt/body" "author body createdAt" \
  "$(jq -r '.comments[0] | keys | join(" ")' <<<"$ivc")"
assert_eq "comments: base projection keys still present alongside comments" "true" \
  "$(jq '(has("number")) and (has("createdAt")) and (has("stateReason"))' <<<"$ivc")"
teardown

echo "Test: gh_pr_view_rest -- mergeable=true → MERGEABLE, clean→CLEAN, state upcase"
setup
# Raw REST pull: lowercase state, mergeable BOOLEAN true, snake_case
# mergeable_state lowercase. Projection must map mergeable→enum string and
# remap+upcase mergeable_state→mergeStateStatus.
printf '%s\n' '{
  "number": 9001,
  "title": "a sample pr",
  "body": "the pr body",
  "state": "open",
  "mergeable": true,
  "mergeable_state": "clean",
  "head": {"ref": "feature-branch", "sha": "abc123def456"},
  "labels": [{"name": "enhancement", "color": "84b6eb"}, {"name": "dispatch:reviewed", "color": "000000"}],
  "extra_rest_field": "drop me"
}' > "$STUB_DIR/view-pr-9001.json"
pv=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_view_rest 9001)
assert_eq "pr: number" "9001" "$(jq -r '.number' <<<"$pv")"
assert_eq "pr: title" "a sample pr" "$(jq -r '.title' <<<"$pv")"
assert_eq "pr: body" "the pr body" "$(jq -r '.body' <<<"$pv")"
assert_eq "pr: state upcased OPEN" "OPEN" "$(jq -r '.state' <<<"$pv")"
assert_eq "pr: mergeable boolean true → enum MERGEABLE" "MERGEABLE" "$(jq -r '.mergeable' <<<"$pv")"
assert_eq "pr: mergeStateStatus key present + upcased" "CLEAN" "$(jq -r '.mergeStateStatus' <<<"$pv")"
assert_eq "pr: headRefName passthrough from head.ref" "feature-branch" "$(jq -r '.headRefName' <<<"$pv")"
assert_eq "pr: headRefOid passthrough from head.sha" "abc123def456" "$(jq -r '.headRefOid' <<<"$pv")"
assert_eq "pr: labels narrowed to [{name}] (2 labels)" "2" "$(jq '.labels | length' <<<"$pv")"
assert_eq "pr: first label name" "enhancement" "$(jq -r '.labels[0].name' <<<"$pv")"
assert_eq "pr: label objects carry ONLY name (no color key)" "1" "$(jq '.labels[0] | keys | length' <<<"$pv")"
assert_eq "pr: raw REST extra field dropped" "" "$(jq -r '.extra_rest_field // empty' <<<"$pv")"
# Raw REST pull with no merged_at → mergedAt key present with value null
# (open/closed-unmerged signal; consumers test `mergedAt != null`).
assert_eq "pr: mergedAt null when merged_at absent" "null" "$(jq -r '.mergedAt' <<<"$pv")"
assert_eq "pr: top-level key set" "body headRefName headRefOid labels mergeCommitSha mergeStateStatus mergeable mergedAt number state title" \
  "$(jq -r 'keys | join(" ")' <<<"$pv")"
teardown

echo "Test: gh_pr_view_rest -- mergeable=false → CONFLICTING, dirty→DIRTY, closed→CLOSED"
setup
printf '%s\n' '{
  "number": 9002,
  "title": "conflicting pr",
  "body": "",
  "state": "closed",
  "mergeable": false,
  "mergeable_state": "dirty",
  "head": {"ref": "conflicting-branch", "sha": "deadbeef0001"},
  "labels": [{"name": "bug", "color": "d73a4a"}]
}' > "$STUB_DIR/view-pr-9002.json"
pv2=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_view_rest 9002)
assert_eq "pr: mergeable boolean false → CONFLICTING" "CONFLICTING" "$(jq -r '.mergeable' <<<"$pv2")"
assert_eq "pr: mergeStateStatus dirty → DIRTY" "DIRTY" "$(jq -r '.mergeStateStatus' <<<"$pv2")"
assert_eq "pr: closed → CLOSED" "CLOSED" "$(jq -r '.state' <<<"$pv2")"
assert_eq "pr: closed-unmerged mergedAt null" "null" "$(jq -r '.mergedAt' <<<"$pv2")"
assert_eq "pr: closed-unmerged mergeCommitSha null" "null" "$(jq -r '.mergeCommitSha' <<<"$pv2")"
assert_eq "pr: headRefName from head.ref (9002)" "conflicting-branch" "$(jq -r '.headRefName' <<<"$pv2")"
assert_eq "pr: single label narrowed" "bug" "$(jq -r '.labels[0].name' <<<"$pv2")"
teardown

echo "Test: gh_pr_view_rest -- merged PR (REST state closed + merged_at set) → mergedAt passthrough"
setup
# REST reports a merged PR as state `closed`, never MERGED; the merged signal is
# a non-null merged_at. gh_pr_view_rest must pass it through under mergedAt so
# graph-select-target's sensor_gate can distinguish merged from closed-unmerged.
printf '%s\n' '{
  "number": 9004,
  "title": "merged pr",
  "body": "",
  "state": "closed",
  "merged_at": "2026-07-11T12:00:00Z",
  "merge_commit_sha": "feedface0004",
  "mergeable": null,
  "head": {"ref": "merged-branch", "sha": "feedface0004"},
  "labels": []
}' > "$STUB_DIR/view-pr-9004.json"
pv4=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_view_rest 9004)
assert_eq "pr: merged PR still reports state CLOSED (not MERGED)" "CLOSED" "$(jq -r '.state' <<<"$pv4")"
assert_eq "pr: merged PR mergedAt passthrough" "2026-07-11T12:00:00Z" "$(jq -r '.mergedAt' <<<"$pv4")"
assert_eq "pr: merged PR mergeCommitSha passthrough" "feedface0004" "$(jq -r '.mergeCommitSha' <<<"$pv4")"
teardown

echo "Test: gh_pr_view_rest -- mergeable=null → UNKNOWN; absent mergeable_state → empty"
setup
printf '%s\n' '{
  "number": 9003,
  "title": "computing pr",
  "body": "",
  "state": "open",
  "mergeable": null,
  "head": {"ref": "computing-branch", "sha": "cafef00d0003"}
}' > "$STUB_DIR/view-pr-9003.json"
pv3=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_view_rest 9003)
assert_eq "pr: mergeable null → UNKNOWN" "UNKNOWN" "$(jq -r '.mergeable' <<<"$pv3")"
assert_eq "pr: absent mergeable_state → empty string" "" "$(jq -r '.mergeStateStatus' <<<"$pv3")"
assert_eq "pr: headRefName from head.ref (9003)" "computing-branch" "$(jq -r '.headRefName' <<<"$pv3")"
# Absent labels in raw REST → empty array (// [] path), not null.
assert_eq "pr: absent labels → empty array" "0" "$(jq '.labels | length' <<<"$pv3")"
teardown

echo "Test: gh_pr_view_rest -- missing number returns non-zero with diagnostic stderr"
setup
rc_pv=0
err_pv=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_view_rest 2>&1 >/dev/null) || rc_pv=$?
assert_eq "pr: missing number → non-zero" "1" "$rc_pv"
case "$err_pv" in *"gh_pr_view_rest: PR number is required"*) mp=yes ;; *) mp=no ;; esac
assert_eq "pr: missing-number stderr names the helper" "yes" "$mp"
teardown

echo "Test: gh_pr_view_rest -- gh failure returns non-zero with diagnostic stderr"
setup
: > "$STUB_DIR/gh-fail-rest"
rc_pvf=0
err_pvf=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_view_rest 9001 2>&1 >/dev/null) || rc_pvf=$?
assert_eq "pr: gh failure → non-zero" "1" "$rc_pvf"
case "$err_pvf" in *"gh_pr_view_rest: gh api failed"*) mpf=yes ;; *) mpf=no ;; esac
assert_eq "pr: gh-failure stderr names the helper" "yes" "$mpf"
teardown

# ============================================================================
# gh_pr_view_rest memoisation — DISPATCH_PR_JSON_CACHE
# (tactic-review-stall-pr-json-duplicate-fetch)
# ============================================================================
# The memo carries NO state filter and NO TTL: its safety comes from arming
# scope, not from what is cached (see the helper's header note in lib.sh). These
# cases pin the four properties that scope depends on — a hit serves the stored
# projection without a REST call, an UNARMED caller is unaffected, the key is
# the resolved REST path rather than the bare number, and a failed fetch leaves
# nothing behind.

# Count the pr-view REST reads made so far (the log is truncated per test).
# Sibling of suite_call_count() above, deliberately not a reuse of it: that one
# counts check-suites lookups.
pr_view_call_count() {
  local f="$STUB_DIR/gh-pr-view-rest-calls.log"
  [[ -f "$f" ]] || { echo 0; return 0; }
  wc -l < "$f" | tr -d ' '
}

echo "Test: gh_pr_view_rest -- armed cache hit serves stored projection without re-fetch"
setup
# Same proof shape as the REST verdict cache case above: prime the cache, then
# overwrite the fixture with a conflicting body. The second call must still
# return the FIRST body.
export DISPATCH_PR_JSON_CACHE="$TMPDIR_TEST/pr-json-cache"
mkdir -p "$DISPATCH_PR_JSON_CACHE"
printf '%s\n' '{
  "number": 9301,
  "title": "first title",
  "body": "",
  "state": "open",
  "mergeable": true,
  "mergeable_state": "clean",
  "head": {"ref": "first-branch", "sha": "aaaa00009301"},
  "labels": []
}' > "$STUB_DIR/view-pr-9301.json"
pvc1=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_view_rest 9301)
assert_eq "pr cache: first call → first title (and primes cache)" "first title" "$(jq -r '.title' <<<"$pvc1")"
printf '%s\n' '{
  "number": 9301,
  "title": "second title",
  "body": "",
  "state": "closed",
  "merged_at": "2026-08-01T00:00:00Z",
  "mergeable": null,
  "head": {"ref": "second-branch", "sha": "bbbb00009301"},
  "labels": []
}' > "$STUB_DIR/view-pr-9301.json"
pvc2=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_view_rest 9301)
assert_eq "pr cache: second call → cached first title despite changed fixture" "first title" "$(jq -r '.title' <<<"$pvc2")"
assert_eq "pr cache: cached body is the PROJECTION (state upcased, not raw)" "OPEN" "$(jq -r '.state' <<<"$pvc2")"
assert_eq "pr cache: hit is byte-identical to the priming miss" "$pvc1" "$pvc2"
unset DISPATCH_PR_JSON_CACHE
teardown

echo "Test: gh_pr_view_rest -- armed pair makes exactly ONE REST call"
setup
export DISPATCH_PR_JSON_CACHE="$TMPDIR_TEST/pr-json-cache"
mkdir -p "$DISPATCH_PR_JSON_CACHE"
printf '%s\n' '{
  "number": 9301, "title": "counted", "body": "", "state": "open",
  "mergeable": true, "mergeable_state": "clean",
  "head": {"ref": "counted-branch", "sha": "cccc00009301"}, "labels": []
}' > "$STUB_DIR/view-pr-9301.json"
: > "$STUB_DIR/gh-pr-view-rest-calls.log"
_=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_view_rest 9301)
_=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_view_rest 9301)
assert_eq "pr cache: two armed calls → 1 REST read" "1" "$(pr_view_call_count)"
unset DISPATCH_PR_JSON_CACHE
teardown

echo "Test: gh_pr_view_rest -- UNARMED (var unset) always fetches"
setup
# The anti-vacuity control for the case above: with the var unset, the identical
# sequence must see the CHANGED body and log TWO reads. Without this, a memo
# that never fired would pass the hit case by accident.
printf '%s\n' '{
  "number": 9301, "title": "first title", "body": "", "state": "open",
  "mergeable": true, "mergeable_state": "clean",
  "head": {"ref": "first-branch", "sha": "aaaa00009301"}, "labels": []
}' > "$STUB_DIR/view-pr-9301.json"
: > "$STUB_DIR/gh-pr-view-rest-calls.log"
pvu1=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_view_rest 9301)
assert_eq "pr unarmed: first call → first title" "first title" "$(jq -r '.title' <<<"$pvu1")"
printf '%s\n' '{
  "number": 9301, "title": "second title", "body": "", "state": "open",
  "mergeable": true, "mergeable_state": "clean",
  "head": {"ref": "second-branch", "sha": "bbbb00009301"}, "labels": []
}' > "$STUB_DIR/view-pr-9301.json"
pvu2=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_view_rest 9301)
assert_eq "pr unarmed: second call → CHANGED second title (no memo)" "second title" "$(jq -r '.title' <<<"$pvu2")"
assert_eq "pr unarmed: two calls → 2 REST reads" "2" "$(pr_view_call_count)"
teardown

echo "Test: gh_pr_view_rest -- cache key is the resolved path, not the bare number"
setup
# `--repo other/repo 9302` and the default `{owner}/{repo}` form address
# DIFFERENT PRs under the same number, so they must not share an entry.
export DISPATCH_PR_JSON_CACHE="$TMPDIR_TEST/pr-json-cache"
mkdir -p "$DISPATCH_PR_JSON_CACHE"
printf '%s\n' '{
  "number": 9302, "title": "keyed", "body": "", "state": "open",
  "mergeable": true, "mergeable_state": "clean",
  "head": {"ref": "keyed-branch", "sha": "dddd00009302"}, "labels": []
}' > "$STUB_DIR/view-pr-9302.json"
: > "$STUB_DIR/gh-pr-view-rest-calls.log"
_=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_view_rest 9302)
_=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_view_rest --repo other/repo 9302)
assert_eq "pr key: same number, two repos → two distinct cache entries" "2" \
  "$(find "$DISPATCH_PR_JSON_CACHE" -type f | wc -l | tr -d ' ')"
assert_eq "pr key: neither call was served from the other's entry" "2" "$(pr_view_call_count)"
unset DISPATCH_PR_JSON_CACHE
teardown

echo "Test: gh_pr_view_rest -- a failed fetch is never cached"
setup
export DISPATCH_PR_JSON_CACHE="$TMPDIR_TEST/pr-json-cache"
mkdir -p "$DISPATCH_PR_JSON_CACHE"
printf '%s\n' '{
  "number": 9301, "title": "recovered", "body": "", "state": "open",
  "mergeable": true, "mergeable_state": "clean",
  "head": {"ref": "recovered-branch", "sha": "eeee00009301"}, "labels": []
}' > "$STUB_DIR/view-pr-9301.json"
: > "$STUB_DIR/gh-fail-rest"
rc_pvc=0
_=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_view_rest 9301 2>/dev/null) || rc_pvc=$?
assert_eq "pr cache: failed fetch → non-zero" "1" "$rc_pvc"
assert_eq "pr cache: failed fetch wrote no cache entry" "0" \
  "$(find "$DISPATCH_PR_JSON_CACHE" -type f | wc -l | tr -d ' ')"
rm -f "$STUB_DIR/gh-fail-rest"
pvcr=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_view_rest 9301)
assert_eq "pr cache: retry after the failure succeeds" "recovered" "$(jq -r '.title' <<<"$pvcr")"
unset DISPATCH_PR_JSON_CACHE
teardown

# ============================================================================
# REST read helpers: run-view / closing-commit / compare (#2480)
# ============================================================================
echo "=== REST read helpers: run-view / closing-commit / compare (#2480) ==="

# --- gh_run_view_rest ---

echo "Test: gh_run_view_rest -- success: returns JSON with createdAt and headSha"
setup
printf '%s\n' '{"createdAt":"2026-01-02T03:04:05Z","headSha":"deadbeef"}' \
  > "$STUB_DIR/run-view-9101.json"
out=$(source "$TMPDIR_TEST/lib.sh"; gh_run_view_rest 9101)
assert_eq "run-view: createdAt" "2026-01-02T03:04:05Z" "$(jq -r '.createdAt' <<<"$out")"
assert_eq "run-view: headSha" "deadbeef" "$(jq -r '.headSha' <<<"$out")"
teardown

echo "Test: gh_run_view_rest -- --repo flag passes cross-repo segment to gh"
setup
: > "$STUB_DIR/gh-run-view-rest-calls.log"
printf '%s\n' '{"createdAt":"2026-01-02T03:04:05Z","headSha":"deadbeef"}' \
  > "$STUB_DIR/run-view-9101.json"
source "$TMPDIR_TEST/lib.sh"; gh_run_view_rest 9101 --repo owner/other-repo >/dev/null
if grep -q 'owner/other-repo' "$STUB_DIR/gh-run-view-rest-calls.log"; then seg=yes; else seg=no; fi
assert_eq "run-view: --repo passes cross-repo segment" "yes" "$seg"
teardown

echo "Test: gh_run_view_rest -- missing run id returns non-zero with diagnostic stderr"
setup
rc=0
err=$(source "$TMPDIR_TEST/lib.sh"; gh_run_view_rest 2>&1 >/dev/null) || rc=$?
assert_eq "run-view: missing id → non-zero" "1" "$rc"
case "$err" in *"gh_run_view_rest: run id is required"*) m=yes ;; *) m=no ;; esac
assert_eq "run-view: missing-id stderr names the helper" "yes" "$m"
teardown

echo "Test: gh_run_view_rest -- gh failure returns non-zero with diagnostic stderr"
setup
: > "$STUB_DIR/gh-fail-rest"
rc=0
err=$(source "$TMPDIR_TEST/lib.sh"; gh_run_view_rest 9101 2>&1 >/dev/null) || rc=$?
assert_eq "run-view: gh failure → non-zero" "1" "$rc"
case "$err" in *"gh_run_view_rest: gh run view failed"*) m=yes ;; *) m=no ;; esac
assert_eq "run-view: gh-failure stderr names the helper" "yes" "$m"
teardown

# --- gh_issue_closing_commit_rest ---

echo "Test: gh_issue_closing_commit_rest -- returns closing commit SHA"
setup
printf '%s\n' '[{"event":"labeled"},{"event":"closed","commit_id":"abc123def"}]' \
  > "$STUB_DIR/timeline-9201.json"
out=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_closing_commit_rest 9201)
assert_eq "closing-commit: returns SHA" "abc123def" "$out"
teardown

echo "Test: gh_issue_closing_commit_rest -- null commit_id (manual close) yields empty output"
setup
printf '%s\n' '[{"event":"closed","commit_id":null}]' \
  > "$STUB_DIR/timeline-9202.json"
out=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_closing_commit_rest 9202)
assert_eq "closing-commit: null commit_id → empty" "" "$out"
teardown

echo "Test: gh_issue_closing_commit_rest -- no closed event yields empty output"
setup
printf '%s\n' '[{"event":"labeled"},{"event":"referenced"}]' \
  > "$STUB_DIR/timeline-9203.json"
out=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_closing_commit_rest 9203)
assert_eq "closing-commit: no closed event → empty" "" "$out"
teardown

echo "Test: gh_issue_closing_commit_rest -- missing number returns non-zero with diagnostic stderr"
setup
rc=0
err=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_closing_commit_rest 2>&1 >/dev/null) || rc=$?
assert_eq "closing-commit: missing number → non-zero" "1" "$rc"
case "$err" in *"gh_issue_closing_commit_rest: issue number is required"*) m=yes ;; *) m=no ;; esac
assert_eq "closing-commit: missing-number stderr names the helper" "yes" "$m"
teardown

# --- gh_commit_is_ancestor_rest ---

echo "Test: gh_commit_is_ancestor_rest -- behind (base is ancestor of head)"
setup
printf '%s\n' '{"status":"behind"}' > "$STUB_DIR/compare-status.json"
out=$(source "$TMPDIR_TEST/lib.sh"; gh_commit_is_ancestor_rest base123 head456)
assert_eq "compare: behind status" "behind" "$out"
teardown

echo "Test: gh_commit_is_ancestor_rest -- identical"
setup
printf '%s\n' '{"status":"identical"}' > "$STUB_DIR/compare-status.json"
out=$(source "$TMPDIR_TEST/lib.sh"; gh_commit_is_ancestor_rest base123 head456)
assert_eq "compare: identical status" "identical" "$out"
teardown

echo "Test: gh_commit_is_ancestor_rest -- diverged (non-ancestor)"
setup
printf '%s\n' '{"status":"diverged"}' > "$STUB_DIR/compare-status.json"
out=$(source "$TMPDIR_TEST/lib.sh"; gh_commit_is_ancestor_rest base123 head456)
assert_eq "compare: diverged status" "diverged" "$out"
teardown

echo "Test: gh_commit_is_ancestor_rest -- ahead"
setup
printf '%s\n' '{"status":"ahead"}' > "$STUB_DIR/compare-status.json"
out=$(source "$TMPDIR_TEST/lib.sh"; gh_commit_is_ancestor_rest base123 head456)
assert_eq "compare: ahead status" "ahead" "$out"
teardown

echo "Test: gh_commit_is_ancestor_rest -- missing base returns non-zero with diagnostic stderr"
setup
rc=0
err=$(source "$TMPDIR_TEST/lib.sh"; gh_commit_is_ancestor_rest 2>&1 >/dev/null) || rc=$?
assert_eq "compare: missing base → non-zero" "1" "$rc"
case "$err" in *"gh_commit_is_ancestor_rest: base commit is required"*) m=yes ;; *) m=no ;; esac
assert_eq "compare: missing-base stderr names the helper" "yes" "$m"
teardown

echo "Test: gh_commit_is_ancestor_rest -- missing head returns non-zero with diagnostic stderr"
setup
rc=0
err=$(source "$TMPDIR_TEST/lib.sh"; gh_commit_is_ancestor_rest base123 2>&1 >/dev/null) || rc=$?
assert_eq "compare: missing head → non-zero" "1" "$rc"
case "$err" in *"gh_commit_is_ancestor_rest: head sha is required"*) m=yes ;; *) m=no ;; esac
assert_eq "compare: missing-head stderr names the helper" "yes" "$m"
teardown

# ============================================================================
# Mutation REST helpers (#2255)
# ============================================================================
# These drive the REAL mutation helpers (sourced from the copied lib.sh) via the
# sentinel stub branches added for gh_issue_set_labels_rest, gh_issue_remove_label_rest,
# gh_issue_close_rest, gh_issue_create_rest, gh_issue_comment_rest, and
# gh_pr_merge_rest. Each test:
#   (a) asserts the helper hits the correct REST method and path, and
#   (b) asserts the helper returns non-zero with descriptive stderr on gh failure.
echo "=== mutation REST helpers ==="

# --- gh_issue_set_labels_rest ---
echo "Test: gh_issue_set_labels_rest -- POST to correct path, forwards labels"
setup
: > "$STUB_DIR/gh-issue-set-labels-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_issue_set_labels_rest 42 dispatch:planned dispatch:qa-done
if grep -q 'POST' "$STUB_DIR/gh-issue-set-labels-rest-calls.log"; then m=yes; else m=no; fi
assert_eq "set-labels: log contains POST" "yes" "$m"
if grep -q 'issues/42/labels' "$STUB_DIR/gh-issue-set-labels-rest-calls.log"; then p=yes; else p=no; fi
assert_eq "set-labels: log contains issues/42/labels path" "yes" "$p"
if grep -q 'dispatch:planned' "$STUB_DIR/gh-issue-set-labels-rest-calls.log"; then l=yes; else l=no; fi
assert_eq "set-labels: log contains label name" "yes" "$l"
teardown

echo "Test: gh_issue_set_labels_rest -- --repo flag emits cross-repo segment"
setup
: > "$STUB_DIR/gh-issue-set-labels-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_issue_set_labels_rest 42 dispatch:planned --repo owner/other-repo
if grep -q 'repos/owner/other-repo/issues/42/labels' "$STUB_DIR/gh-issue-set-labels-rest-calls.log"; then seg=yes; else seg=no; fi
assert_eq "set-labels: --repo uses cross-repo segment" "yes" "$seg"
if grep -q 'repos/{owner}/{repo}' "$STUB_DIR/gh-issue-set-labels-rest-calls.log"; then ph=yes; else ph=no; fi
assert_eq "set-labels: --repo placeholder absent" "no" "$ph"
teardown

echo "Test: gh_issue_set_labels_rest -- missing number returns non-zero"
setup
rc_sl=0
err_sl=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_set_labels_rest 2>&1 >/dev/null) || rc_sl=$?
assert_eq "set-labels: missing number → non-zero" "1" "$rc_sl"
case "$err_sl" in *"gh_issue_set_labels_rest: issue number is required"*) m=yes ;; *) m=no ;; esac
assert_eq "set-labels: missing-number stderr names helper" "yes" "$m"
teardown

echo "Test: gh_issue_set_labels_rest -- number with zero labels returns non-zero"
setup
rc_sl_nl=0
err_sl_nl=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_set_labels_rest 42 2>&1 >/dev/null) || rc_sl_nl=$?
assert_eq "set-labels: no labels → non-zero" "1" "$rc_sl_nl"
case "$err_sl_nl" in *"at least one label is required"*) m=yes ;; *) m=no ;; esac
assert_eq "set-labels: no-labels stderr names requirement" "yes" "$m"
teardown

echo "Test: gh_issue_set_labels_rest -- gh failure returns non-zero with diagnostic stderr"
setup
: > "$STUB_DIR/gh-fail-rest"
rc_slf=0
err_slf=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_set_labels_rest 42 dispatch:planned 2>&1 >/dev/null) || rc_slf=$?
assert_eq "set-labels: gh failure → non-zero" "1" "$rc_slf"
case "$err_slf" in *"gh_issue_set_labels_rest: gh api failed"*) m=yes ;; *) m=no ;; esac
assert_eq "set-labels: gh-failure stderr names helper" "yes" "$m"
teardown

# --- gh_issue_remove_label_rest ---
echo "Test: gh_issue_remove_label_rest -- DELETE to correct path, URL-encodes space"
setup
: > "$STUB_DIR/gh-issue-remove-label-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_issue_remove_label_rest 42 "help wanted"
if grep -q 'DELETE' "$STUB_DIR/gh-issue-remove-label-rest-calls.log"; then m=yes; else m=no; fi
assert_eq "remove-label: log contains DELETE" "yes" "$m"
if grep -q 'issues/42/labels/help%20wanted' "$STUB_DIR/gh-issue-remove-label-rest-calls.log"; then p=yes; else p=no; fi
assert_eq "remove-label: path contains URL-encoded label" "yes" "$p"
teardown

echo "Test: gh_issue_remove_label_rest -- --repo flag emits cross-repo segment"
setup
: > "$STUB_DIR/gh-issue-remove-label-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_issue_remove_label_rest 42 "dispatch:planned" --repo owner/other-repo
if grep -q 'repos/owner/other-repo/issues/42/labels' "$STUB_DIR/gh-issue-remove-label-rest-calls.log"; then seg=yes; else seg=no; fi
assert_eq "remove-label: --repo uses cross-repo segment" "yes" "$seg"
teardown

echo "Test: gh_issue_remove_label_rest -- missing args return non-zero"
setup
rc_rl=0
err_rl=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_remove_label_rest 2>&1 >/dev/null) || rc_rl=$?
assert_eq "remove-label: missing number → non-zero" "1" "$rc_rl"
case "$err_rl" in *"gh_issue_remove_label_rest: issue number is required"*) m=yes ;; *) m=no ;; esac
assert_eq "remove-label: missing-number stderr names helper" "yes" "$m"
rc_rll=0
err_rll=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_remove_label_rest 42 2>&1 >/dev/null) || rc_rll=$?
assert_eq "remove-label: missing label → non-zero" "1" "$rc_rll"
case "$err_rll" in *"gh_issue_remove_label_rest: label name is required"*) m=yes ;; *) m=no ;; esac
assert_eq "remove-label: missing-label stderr names helper" "yes" "$m"
teardown

echo "Test: gh_issue_remove_label_rest -- gh failure returns non-zero with diagnostic stderr"
setup
: > "$STUB_DIR/gh-fail-rest"
rc_rlf=0
err_rlf=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_remove_label_rest 42 dispatch:planned 2>&1 >/dev/null) || rc_rlf=$?
assert_eq "remove-label: gh failure → non-zero" "1" "$rc_rlf"
case "$err_rlf" in *"gh_issue_remove_label_rest: gh api failed"*) m=yes ;; *) m=no ;; esac
assert_eq "remove-label: gh-failure stderr names helper" "yes" "$m"
teardown

echo "Test: gh_issue_remove_label_rest -- label-absent 404 is a no-op (returns 0, silent)"
setup
: > "$STUB_DIR/gh-404-remove-label"
rc_rl404=0
err_rl404=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_remove_label_rest 42 dispatch:office-hours 2>&1 >/dev/null) || rc_rl404=$?
assert_eq "remove-label: 404 absent label → success" "0" "$rc_rl404"
# Preserves the porcelain no-op-when-absent contract: no error/WARNING on stderr.
case "$err_rl404" in *error:*|*WARNING*) m=no ;; *) m=yes ;; esac
assert_eq "remove-label: 404 absent label → silent stderr" "yes" "$m"
teardown

# --- gh_issue_close_rest ---
echo "Test: gh_issue_close_rest -- PATCH to correct path with state=closed"
setup
: > "$STUB_DIR/gh-issue-close-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_issue_close_rest 42
if grep -q 'PATCH' "$STUB_DIR/gh-issue-close-rest-calls.log"; then m=yes; else m=no; fi
assert_eq "close: log contains PATCH" "yes" "$m"
if grep -q 'issues/42' "$STUB_DIR/gh-issue-close-rest-calls.log"; then p=yes; else p=no; fi
assert_eq "close: log contains issues/42 path" "yes" "$p"
if grep -q 'state=closed' "$STUB_DIR/gh-issue-close-rest-calls.log"; then s=yes; else s=no; fi
assert_eq "close: log contains state=closed" "yes" "$s"
teardown

echo "Test: gh_issue_close_rest -- --repo flag emits cross-repo segment"
setup
: > "$STUB_DIR/gh-issue-close-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_issue_close_rest 42 --repo owner/other-repo
if grep -q 'repos/owner/other-repo/issues/42' "$STUB_DIR/gh-issue-close-rest-calls.log"; then seg=yes; else seg=no; fi
assert_eq "close: --repo uses cross-repo segment" "yes" "$seg"
teardown

echo "Test: gh_issue_close_rest -- missing number returns non-zero"
setup
rc_cl=0
err_cl=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_close_rest 2>&1 >/dev/null) || rc_cl=$?
assert_eq "close: missing number → non-zero" "1" "$rc_cl"
case "$err_cl" in *"gh_issue_close_rest: issue number is required"*) m=yes ;; *) m=no ;; esac
assert_eq "close: missing-number stderr names helper" "yes" "$m"
teardown

echo "Test: gh_issue_close_rest -- gh failure returns non-zero with diagnostic stderr"
setup
: > "$STUB_DIR/gh-fail-rest"
rc_clf=0
err_clf=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_close_rest 42 2>&1 >/dev/null) || rc_clf=$?
assert_eq "close: gh failure → non-zero" "1" "$rc_clf"
case "$err_clf" in *"gh_issue_close_rest: gh api failed"*) m=yes ;; *) m=no ;; esac
assert_eq "close: gh-failure stderr names helper" "yes" "$m"
teardown

echo "Test: gh_issue_close_rest -- --reason sends state_reason"
setup
: > "$STUB_DIR/gh-issue-close-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_issue_close_rest 42 --reason completed
if grep -q 'state_reason=completed' "$STUB_DIR/gh-issue-close-rest-calls.log"; then r=yes; else r=no; fi
assert_eq "close: --reason sends state_reason=completed" "yes" "$r"
teardown

echo "Test: gh_issue_close_rest -- --comment posts a comment then closes"
setup
: > "$STUB_DIR/gh-issue-close-rest-calls.log"
: > "$STUB_DIR/gh-issue-comment-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_issue_close_rest 42 --comment "closing note"
if grep -q 'issues/42/comments' "$STUB_DIR/gh-issue-comment-rest-calls.log"; then c=yes; else c=no; fi
assert_eq "close: --comment fires POST issues/42/comments" "yes" "$c"
if grep -q 'issues/42' "$STUB_DIR/gh-issue-close-rest-calls.log"; then p=yes; else p=no; fi
assert_eq "close: --comment still fires PATCH issues/42" "yes" "$p"
teardown

  # --- gh_issue_reopen_rest (#2337) ---
  echo "Test: gh_issue_reopen_rest -- PATCH to correct path with state=open"
  setup
  : > "$STUB_DIR/gh-issue-close-rest-calls.log"
  source "$TMPDIR_TEST/lib.sh"; gh_issue_reopen_rest 42
  if grep -q 'PATCH' "$STUB_DIR/gh-issue-close-rest-calls.log"; then m=yes; else m=no; fi
  assert_eq "reopen: log contains PATCH" "yes" "$m"
  if grep -q 'issues/42' "$STUB_DIR/gh-issue-close-rest-calls.log"; then p=yes; else p=no; fi
  assert_eq "reopen: log contains issues/42 path" "yes" "$p"
  if grep -q 'state=open' "$STUB_DIR/gh-issue-close-rest-calls.log"; then s=yes; else s=no; fi
  assert_eq "reopen: log contains state=open" "yes" "$s"
  teardown

  echo "Test: gh_issue_reopen_rest -- --repo flag emits cross-repo segment"
  setup
  : > "$STUB_DIR/gh-issue-close-rest-calls.log"
  source "$TMPDIR_TEST/lib.sh"; gh_issue_reopen_rest 42 --repo owner/other-repo
  if grep -q 'repos/owner/other-repo/issues/42' "$STUB_DIR/gh-issue-close-rest-calls.log"; then seg=yes; else seg=no; fi
  assert_eq "reopen: --repo uses cross-repo segment" "yes" "$seg"
  teardown

  echo "Test: gh_issue_reopen_rest -- missing number returns non-zero"
  setup
  rc_ro=0
  err_ro=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_reopen_rest 2>&1 >/dev/null) || rc_ro=$?
  assert_eq "reopen: missing number → non-zero" "1" "$rc_ro"
  case "$err_ro" in *"gh_issue_reopen_rest: issue number is required"*) m=yes ;; *) m=no ;; esac
  assert_eq "reopen: missing-number stderr names helper" "yes" "$m"
  teardown

  echo "Test: gh_issue_reopen_rest -- gh failure returns non-zero with diagnostic stderr"
  setup
  : > "$STUB_DIR/gh-fail-rest"
  rc_rof=0
  err_rof=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_reopen_rest 42 2>&1 >/dev/null) || rc_rof=$?
  assert_eq "reopen: gh failure → non-zero" "1" "$rc_rof"
  case "$err_rof" in *"gh_issue_reopen_rest: gh api failed"*) m=yes ;; *) m=no ;; esac
  assert_eq "reopen: gh-failure stderr names helper" "yes" "$m"
  teardown

  echo "Test: gh_issue_reopen_rest -- --comment posts a comment then reopens"
  setup
  : > "$STUB_DIR/gh-issue-close-rest-calls.log"
  : > "$STUB_DIR/gh-issue-comment-rest-calls.log"
  source "$TMPDIR_TEST/lib.sh"; gh_issue_reopen_rest 42 --comment "reopening note"
  if grep -q 'issues/42/comments' "$STUB_DIR/gh-issue-comment-rest-calls.log"; then c=yes; else c=no; fi
  assert_eq "reopen: --comment fires POST issues/42/comments" "yes" "$c"
  if grep -q 'issues/42' "$STUB_DIR/gh-issue-close-rest-calls.log"; then p=yes; else p=no; fi
  assert_eq "reopen: --comment still fires PATCH issues/42" "yes" "$p"
  teardown

# --- gh_issue_edit_rest ---
echo "Test: gh_issue_edit_rest -- --title only sends title="
setup
: > "$STUB_DIR/gh-issue-close-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_issue_edit_rest 42 --title "new title"
if grep -q 'PATCH' "$STUB_DIR/gh-issue-close-rest-calls.log"; then m=yes; else m=no; fi
assert_eq "edit: log contains PATCH" "yes" "$m"
if grep -q 'issues/42' "$STUB_DIR/gh-issue-close-rest-calls.log"; then p=yes; else p=no; fi
assert_eq "edit: log contains issues/42 path" "yes" "$p"
if grep -q 'title=new title' "$STUB_DIR/gh-issue-close-rest-calls.log"; then t=yes; else t=no; fi
assert_eq "edit: --title sends title=" "yes" "$t"
teardown

echo "Test: gh_issue_edit_rest -- --body only sends body="
setup
: > "$STUB_DIR/gh-issue-close-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_issue_edit_rest 42 --body "new body"
if grep -q 'body=new body' "$STUB_DIR/gh-issue-close-rest-calls.log"; then b=yes; else b=no; fi
assert_eq "edit: --body sends body=" "yes" "$b"
teardown

echo "Test: gh_issue_edit_rest -- --body-file uses -F body=@"
setup
: > "$STUB_DIR/gh-issue-close-rest-calls.log"
printf '%s' "edit body from file" > "$STUB_DIR/edit-body.txt"
source "$TMPDIR_TEST/lib.sh"; gh_issue_edit_rest 42 --body-file "$STUB_DIR/edit-body.txt"
if grep -q -- '-F body=@' "$STUB_DIR/gh-issue-close-rest-calls.log"; then f=yes; else f=no; fi
assert_eq "edit: --body-file uses -F body=@ flag" "yes" "$f"
teardown

echo "Test: gh_issue_edit_rest -- --repo flag emits cross-repo segment"
setup
: > "$STUB_DIR/gh-issue-close-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_issue_edit_rest 42 --title "t" --repo owner/other-repo
if grep -q 'repos/owner/other-repo/issues/42' "$STUB_DIR/gh-issue-close-rest-calls.log"; then seg=yes; else seg=no; fi
assert_eq "edit: --repo uses cross-repo segment" "yes" "$seg"
teardown

echo "Test: gh_issue_edit_rest -- --body and --body-file together return non-zero"
setup
rc_edx=0
err_edx=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_edit_rest 42 --body "b" --body-file /dev/null 2>&1 >/dev/null) || rc_edx=$?
assert_eq "edit: --body+--body-file → non-zero" "1" "$rc_edx"
case "$err_edx" in *"mutually exclusive"*) m=yes ;; *) m=no ;; esac
assert_eq "edit: --body+--body-file stderr names conflict" "yes" "$m"
teardown

echo "Test: gh_issue_edit_rest -- no title/body returns non-zero"
setup
rc_ede=0
err_ede=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_edit_rest 42 2>&1 >/dev/null) || rc_ede=$?
assert_eq "edit: no title/body → non-zero" "1" "$rc_ede"
case "$err_ede" in *"at least one of --title/--body/--body-file is required"*) m=yes ;; *) m=no ;; esac
assert_eq "edit: no-fields stderr names requirement" "yes" "$m"
teardown

echo "Test: gh_issue_edit_rest -- missing number returns non-zero"
setup
rc_edn=0
err_edn=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_edit_rest --title "t" 2>&1 >/dev/null) || rc_edn=$?
assert_eq "edit: missing number → non-zero" "1" "$rc_edn"
case "$err_edn" in *"gh_issue_edit_rest: issue number is required"*) m=yes ;; *) m=no ;; esac
assert_eq "edit: missing-number stderr names helper" "yes" "$m"
teardown

echo "Test: gh_issue_edit_rest -- gh failure returns non-zero with diagnostic stderr"
setup
: > "$STUB_DIR/gh-fail-rest"
rc_edf=0
err_edf=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_edit_rest 42 --title "t" 2>&1 >/dev/null) || rc_edf=$?
assert_eq "edit: gh failure → non-zero" "1" "$rc_edf"
case "$err_edf" in *"gh_issue_edit_rest: gh api failed"*) m=yes ;; *) m=no ;; esac
assert_eq "edit: gh-failure stderr names helper" "yes" "$m"
teardown

# --- gh_issue_create_rest ---
echo "Test: gh_issue_create_rest -- POST to correct path, echoes html_url, forwards title/body/labels"
setup
: > "$STUB_DIR/gh-issue-create-rest-calls.log"
url=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_create_rest --title "Test issue" --body "body text" --label dispatch:planned)
if grep -q 'POST' "$STUB_DIR/gh-issue-create-rest-calls.log"; then m=yes; else m=no; fi
assert_eq "create: log contains POST" "yes" "$m"
if grep -q 'title=Test issue' "$STUB_DIR/gh-issue-create-rest-calls.log"; then t=yes; else t=no; fi
assert_eq "create: log contains title" "yes" "$t"
if grep -q 'dispatch:planned' "$STUB_DIR/gh-issue-create-rest-calls.log"; then l=yes; else l=no; fi
assert_eq "create: log contains label" "yes" "$l"
assert_eq "create: stdout is the issue URL" "https://github.com/test/repo/issues/9999" "$url"
teardown

echo "Test: gh_issue_create_rest -- --repo flag emits cross-repo segment"
setup
: > "$STUB_DIR/gh-issue-create-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_issue_create_rest --title "t" --body "b" --repo owner/other-repo >/dev/null
if grep -q 'repos/owner/other-repo/issues' "$STUB_DIR/gh-issue-create-rest-calls.log"; then seg=yes; else seg=no; fi
assert_eq "create: --repo uses cross-repo segment" "yes" "$seg"
teardown

echo "Test: gh_issue_create_rest -- missing required args return non-zero"
setup
rc_ic=0
err_ic=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_create_rest --body "b" 2>&1 >/dev/null) || rc_ic=$?
assert_eq "create: missing --title → non-zero" "1" "$rc_ic"
case "$err_ic" in *"gh_issue_create_rest: --title is required"*) m=yes ;; *) m=no ;; esac
assert_eq "create: missing-title stderr names helper" "yes" "$m"
rc_icb=0
err_icb=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_create_rest --title "t" 2>&1 >/dev/null) || rc_icb=$?
assert_eq "create: missing --body → non-zero" "1" "$rc_icb"
case "$err_icb" in *"exactly one of --body/--body-file is required"*) m=yes ;; *) m=no ;; esac
assert_eq "create: missing-body stderr names requirement" "yes" "$m"
teardown

echo "Test: gh_issue_create_rest -- --body-file reads body from file, uses -F body=@"
setup
: > "$STUB_DIR/gh-issue-create-rest-calls.log"
printf '%s' "body from file" > "$STUB_DIR/create-body.txt"
source "$TMPDIR_TEST/lib.sh"; gh_issue_create_rest --title "t" --body-file "$STUB_DIR/create-body.txt" >/dev/null
if grep -q -- '-F body=@' "$STUB_DIR/gh-issue-create-rest-calls.log"; then f=yes; else f=no; fi
assert_eq "create: --body-file uses -F body=@ flag" "yes" "$f"
teardown

echo "Test: gh_issue_create_rest -- --body and --body-file together return non-zero"
setup
rc_icx=0
err_icx=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_create_rest --title "t" --body "b" --body-file /dev/null 2>&1 >/dev/null) || rc_icx=$?
assert_eq "create: --body+--body-file → non-zero" "1" "$rc_icx"
case "$err_icx" in *"mutually exclusive"*) m=yes ;; *) m=no ;; esac
assert_eq "create: --body+--body-file stderr names conflict" "yes" "$m"
teardown

echo "Test: gh_issue_create_rest -- gh failure returns non-zero with diagnostic stderr"
setup
: > "$STUB_DIR/gh-fail-rest"
rc_icf=0
err_icf=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_create_rest --title "t" --body "b" 2>&1 >/dev/null) || rc_icf=$?
assert_eq "create: gh failure → non-zero" "1" "$rc_icf"
case "$err_icf" in *"gh_issue_create_rest: gh api failed"*) m=yes ;; *) m=no ;; esac
assert_eq "create: gh-failure stderr names helper" "yes" "$m"
teardown

# --- gh_issue_comment_rest ---
echo "Test: gh_issue_comment_rest -- POST to correct path, forwards body"
setup
: > "$STUB_DIR/gh-issue-comment-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_issue_comment_rest 42 --body "a comment"
if grep -q 'POST' "$STUB_DIR/gh-issue-comment-rest-calls.log"; then m=yes; else m=no; fi
assert_eq "comment: log contains POST" "yes" "$m"
if grep -q 'issues/42/comments' "$STUB_DIR/gh-issue-comment-rest-calls.log"; then p=yes; else p=no; fi
assert_eq "comment: log contains issues/42/comments path" "yes" "$p"
if grep -q 'a comment' "$STUB_DIR/gh-issue-comment-rest-calls.log"; then b=yes; else b=no; fi
assert_eq "comment: log contains body text" "yes" "$b"
teardown

echo "Test: gh_issue_comment_rest -- --body-file reads body from file"
setup
: > "$STUB_DIR/gh-issue-comment-rest-calls.log"
printf '%s' "body from file" > "$STUB_DIR/comment-body.txt"
source "$TMPDIR_TEST/lib.sh"; gh_issue_comment_rest 42 --body-file "$STUB_DIR/comment-body.txt"
if grep -q 'issues/42/comments' "$STUB_DIR/gh-issue-comment-rest-calls.log"; then p=yes; else p=no; fi
assert_eq "comment: --body-file path appears in log" "yes" "$p"
if grep -q -- '-F body=@' "$STUB_DIR/gh-issue-comment-rest-calls.log"; then f=yes; else f=no; fi
assert_eq "comment: --body-file uses -F body=@ flag" "yes" "$f"
teardown

echo "Test: gh_issue_comment_rest -- --repo flag emits cross-repo segment"
setup
: > "$STUB_DIR/gh-issue-comment-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_issue_comment_rest 42 --body "b" --repo owner/other-repo
if grep -q 'repos/owner/other-repo/issues/42/comments' "$STUB_DIR/gh-issue-comment-rest-calls.log"; then seg=yes; else seg=no; fi
assert_eq "comment: --repo uses cross-repo segment" "yes" "$seg"
teardown

echo "Test: gh_issue_comment_rest -- missing required args return non-zero"
setup
rc_cm=0
err_cm=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_comment_rest 2>&1 >/dev/null) || rc_cm=$?
assert_eq "comment: missing number → non-zero" "1" "$rc_cm"
case "$err_cm" in *"gh_issue_comment_rest: issue number is required"*) m=yes ;; *) m=no ;; esac
assert_eq "comment: missing-number stderr names helper" "yes" "$m"
rc_cmb=0
err_cmb=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_comment_rest 42 2>&1 >/dev/null) || rc_cmb=$?
assert_eq "comment: missing --body/--body-file → non-zero" "1" "$rc_cmb"
case "$err_cmb" in *"gh_issue_comment_rest: --body or --body-file is required"*) m=yes ;; *) m=no ;; esac
assert_eq "comment: missing-body stderr names helper" "yes" "$m"
teardown

echo "Test: gh_issue_comment_rest -- --body and --body-file together return non-zero"
setup
rc_cmx=0
err_cmx=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_comment_rest 42 --body "b" --body-file /dev/null 2>&1 >/dev/null) || rc_cmx=$?
assert_eq "comment: --body+--body-file → non-zero" "1" "$rc_cmx"
case "$err_cmx" in *"mutually exclusive"*) m=yes ;; *) m=no ;; esac
assert_eq "comment: --body+--body-file stderr names conflict" "yes" "$m"
teardown

echo "Test: gh_issue_comment_rest -- gh failure returns non-zero with diagnostic stderr"
setup
: > "$STUB_DIR/gh-fail-rest"
rc_cmf=0
err_cmf=$(source "$TMPDIR_TEST/lib.sh"; gh_issue_comment_rest 42 --body "b" 2>&1 >/dev/null) || rc_cmf=$?
assert_eq "comment: gh failure → non-zero" "1" "$rc_cmf"
case "$err_cmf" in *"gh_issue_comment_rest: gh api failed"*) m=yes ;; *) m=no ;; esac
assert_eq "comment: gh-failure stderr names helper" "yes" "$m"
teardown

# --- gh_pr_merge_rest ---
echo "Test: gh_pr_merge_rest -- PUT to correct path, default merge_method=merge"
setup
: > "$STUB_DIR/gh-pr-merge-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_pr_merge_rest 42
if grep -q 'PUT' "$STUB_DIR/gh-pr-merge-rest-calls.log"; then m=yes; else m=no; fi
assert_eq "pr-merge: log contains PUT" "yes" "$m"
if grep -q 'pulls/42/merge' "$STUB_DIR/gh-pr-merge-rest-calls.log"; then p=yes; else p=no; fi
assert_eq "pr-merge: log contains pulls/42/merge path" "yes" "$p"
if grep -q 'merge_method=merge' "$STUB_DIR/gh-pr-merge-rest-calls.log"; then mm=yes; else mm=no; fi
assert_eq "pr-merge: default merge_method=merge" "yes" "$mm"
teardown

echo "Test: gh_pr_merge_rest -- --squash sets merge_method=squash"
setup
: > "$STUB_DIR/gh-pr-merge-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_pr_merge_rest 42 --squash
if grep -q 'merge_method=squash' "$STUB_DIR/gh-pr-merge-rest-calls.log"; then m=yes; else m=no; fi
assert_eq "pr-merge: --squash → merge_method=squash" "yes" "$m"
teardown

echo "Test: gh_pr_merge_rest -- --rebase sets merge_method=rebase"
setup
: > "$STUB_DIR/gh-pr-merge-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_pr_merge_rest 42 --rebase
if grep -q 'merge_method=rebase' "$STUB_DIR/gh-pr-merge-rest-calls.log"; then m=yes; else m=no; fi
assert_eq "pr-merge: --rebase → merge_method=rebase" "yes" "$m"
teardown

echo "Test: gh_pr_merge_rest -- --repo flag emits cross-repo segment"
setup
: > "$STUB_DIR/gh-pr-merge-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_pr_merge_rest 42 --repo owner/other-repo
if grep -q 'repos/owner/other-repo/pulls/42/merge' "$STUB_DIR/gh-pr-merge-rest-calls.log"; then seg=yes; else seg=no; fi
assert_eq "pr-merge: --repo uses cross-repo segment" "yes" "$seg"
teardown

echo "Test: gh_pr_merge_rest -- --subject/--body send commit_title/commit_message"
setup
: > "$STUB_DIR/gh-pr-merge-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_pr_merge_rest 42 --squash --subject "S" --body "B"
if grep -q 'commit_title=S' "$STUB_DIR/gh-pr-merge-rest-calls.log"; then s=yes; else s=no; fi
assert_eq "pr-merge: --subject sends commit_title=S" "yes" "$s"
if grep -q 'commit_message=B' "$STUB_DIR/gh-pr-merge-rest-calls.log"; then b=yes; else b=no; fi
assert_eq "pr-merge: --body sends commit_message=B" "yes" "$b"
teardown

echo "Test: gh_pr_merge_rest -- empty --body omits commit_message"
setup
: > "$STUB_DIR/gh-pr-merge-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_pr_merge_rest 42 --squash --subject "S" --body ""
if grep -q 'commit_message=' "$STUB_DIR/gh-pr-merge-rest-calls.log"; then cm=yes; else cm=no; fi
assert_eq "pr-merge: empty --body omits commit_message" "no" "$cm"
if grep -q 'commit_title=S' "$STUB_DIR/gh-pr-merge-rest-calls.log"; then s=yes; else s=no; fi
assert_eq "pr-merge: --subject still sent with empty body" "yes" "$s"
teardown

echo "Test: gh_pr_merge_rest -- missing number returns non-zero"
setup
rc_pm=0
err_pm=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_merge_rest 2>&1 >/dev/null) || rc_pm=$?
assert_eq "pr-merge: missing number → non-zero" "1" "$rc_pm"
case "$err_pm" in *"gh_pr_merge_rest: PR number is required"*) m=yes ;; *) m=no ;; esac
assert_eq "pr-merge: missing-number stderr names helper" "yes" "$m"
teardown

echo "Test: gh_pr_merge_rest -- gh failure returns non-zero with diagnostic stderr"
setup
: > "$STUB_DIR/gh-fail-rest"
rc_pmf=0
err_pmf=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_merge_rest 42 2>&1 >/dev/null) || rc_pmf=$?
assert_eq "pr-merge: gh failure → non-zero" "1" "$rc_pmf"
case "$err_pmf" in *"gh_pr_merge_rest: gh api failed"*) m=yes ;; *) m=no ;; esac
assert_eq "pr-merge: gh-failure stderr names helper" "yes" "$m"
teardown

# --- gh_pr_update_branch_rest ---
# (tactic-graph-auto-merge-up-to-date-gate) PUT .../pulls/<N>/update-branch —
# merges the base branch into the PR head and re-triggers CI on the fresh base.
echo "Test: gh_pr_update_branch_rest -- PUT to correct path, no expected_head_sha by default"
setup
: > "$STUB_DIR/gh-pr-update-branch-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_pr_update_branch_rest 42
if grep -q 'PUT' "$STUB_DIR/gh-pr-update-branch-rest-calls.log"; then m=yes; else m=no; fi
assert_eq "pr-update-branch: log contains PUT" "yes" "$m"
if grep -q 'pulls/42/update-branch' "$STUB_DIR/gh-pr-update-branch-rest-calls.log"; then p=yes; else p=no; fi
assert_eq "pr-update-branch: log contains pulls/42/update-branch path" "yes" "$p"
if grep -q 'expected_head_sha' "$STUB_DIR/gh-pr-update-branch-rest-calls.log"; then e=yes; else e=no; fi
assert_eq "pr-update-branch: no expected_head_sha sent by default" "no" "$e"
teardown

echo "Test: gh_pr_update_branch_rest -- --expected-head-sha sends the CAS guard"
setup
: > "$STUB_DIR/gh-pr-update-branch-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_pr_update_branch_rest 42 --expected-head-sha abc123
if grep -q 'expected_head_sha=abc123' "$STUB_DIR/gh-pr-update-branch-rest-calls.log"; then e=yes; else e=no; fi
assert_eq "pr-update-branch: --expected-head-sha sends expected_head_sha=abc123" "yes" "$e"
teardown

echo "Test: gh_pr_update_branch_rest -- --repo flag emits cross-repo segment"
setup
: > "$STUB_DIR/gh-pr-update-branch-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_pr_update_branch_rest 42 --repo owner/other-repo
if grep -q 'repos/owner/other-repo/pulls/42/update-branch' "$STUB_DIR/gh-pr-update-branch-rest-calls.log"; then seg=yes; else seg=no; fi
assert_eq "pr-update-branch: --repo uses cross-repo segment" "yes" "$seg"
teardown

echo "Test: gh_pr_update_branch_rest -- missing number returns non-zero"
setup
rc_ub=0
err_ub=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_update_branch_rest 2>&1 >/dev/null) || rc_ub=$?
assert_eq "pr-update-branch: missing number → non-zero" "1" "$rc_ub"
case "$err_ub" in *"gh_pr_update_branch_rest: PR number is required"*) m=yes ;; *) m=no ;; esac
assert_eq "pr-update-branch: missing-number stderr names helper" "yes" "$m"
teardown

echo "Test: gh_pr_update_branch_rest -- gh failure returns non-zero with diagnostic stderr"
setup
: > "$STUB_DIR/gh-fail-rest"
rc_ubf=0
err_ubf=$(source "$TMPDIR_TEST/lib.sh"; gh_pr_update_branch_rest 42 2>&1 >/dev/null) || rc_ubf=$?
assert_eq "pr-update-branch: gh failure → non-zero" "1" "$rc_ubf"
case "$err_ubf" in *"gh_pr_update_branch_rest: gh api failed"*) m=yes ;; *) m=no ;; esac
assert_eq "pr-update-branch: gh-failure stderr names helper" "yes" "$m"
teardown

# ============================================================================
# REST-bucket consumption assertions (#2255)
# ============================================================================
# Each new helper must consume the REST bucket (gh api repos/...) and NEVER the
# GraphQL bucket (gh api graphql). This is the founding invariant of the #2254
# epic: the fleet was exhausting the 5000/hr GraphQL bucket while the REST
# bucket sat idle.
#
# Technique: drive each helper against the stub gh and assert from the per-helper
# call-log file that the invocation used "api ... repos/" (REST) rather than
# "api graphql" (GraphQL). The stub writes STUB_DIR/gh-<helper>-calls.log for
# each sentinel branch (lines 472-576 of this file), so the log is the oracle.
#
# Manual / QA note (not runnable — networked and non-deterministic):
#   Before: `gh api rate_limit | jq .resources.graphql.used`
#   Run the helper.
#   After:  `gh api rate_limit | jq .resources.graphql.used` — must NOT increase.
#           `gh api rate_limit | jq .resources.core.used`    — must increase by 1.
#
# The in-suite form below is deterministic and offline.

echo "=== REST-bucket consumption assertions ==="

# Shared helper: assert a call-log line uses `api … repos/` (REST) and NOT
# `api graphql` (GraphQL). Calling convention:
#   assert_rest_only <label> <logfile>
assert_rest_only() {
  local label="$1" logfile="$2"
  # Primary: path contains repos/ (REST endpoint)
  if grep -q 'repos/' "$logfile"; then rp=yes; else rp=no; fi
  assert_eq "${label}: REST path (repos/) present" "yes" "$rp"
  # Secondary: graphql is absent (would spend the GraphQL bucket)
  if grep -q 'graphql' "$logfile"; then gq=yes; else gq=no; fi
  assert_eq "${label}: graphql absent from log" "no" "$gq"
  # Belt-and-suspenders: porcelain subcommands absent (would also spend GraphQL)
  if grep -qE '^(issue|pr) ' "$logfile"; then pc=yes; else pc=no; fi
  assert_eq "${label}: porcelain (issue|pr) absent from log" "no" "$pc"
}

# --- gh_issue_view_rest ---
# Use a 9xxx number — only the 9xxx sentinel branch (line 472) writes to
# gh-issue-view-rest-calls.log; the generic issues/* branch does NOT.
echo "Test: gh_issue_view_rest -- consumes REST bucket, not GraphQL"
setup
printf '%s\n' '{"number":9001,"title":"t","body":"b","state":"open","labels":[],"assignees":[]}' \
  > "$STUB_DIR/view-issue-9001.json"
: > "$STUB_DIR/gh-issue-view-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_issue_view_rest 9001 >/dev/null
assert_rest_only "issue-view" "$STUB_DIR/gh-issue-view-rest-calls.log"
teardown

# --- gh_pr_view_rest ---
# Use a 9xxx number — only the 9xxx sentinel branch (line 490) writes to
# gh-pr-view-rest-calls.log; the generic pulls/* branch does NOT.
echo "Test: gh_pr_view_rest -- consumes REST bucket, not GraphQL"
setup
printf '%s\n' '{"number":9001,"title":"t","body":"b","state":"open","mergeable":true,"mergeable_state":"clean"}' \
  > "$STUB_DIR/view-pr-9001.json"
: > "$STUB_DIR/gh-pr-view-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_pr_view_rest 9001 >/dev/null
assert_rest_only "pr-view" "$STUB_DIR/gh-pr-view-rest-calls.log"
teardown

# --- gh_issue_set_labels_rest ---
echo "Test: gh_issue_set_labels_rest -- consumes REST bucket, not GraphQL"
setup
: > "$STUB_DIR/gh-issue-set-labels-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_issue_set_labels_rest 42 dispatch:planned
assert_rest_only "set-labels" "$STUB_DIR/gh-issue-set-labels-rest-calls.log"
teardown

# --- gh_issue_remove_label_rest ---
echo "Test: gh_issue_remove_label_rest -- consumes REST bucket, not GraphQL"
setup
: > "$STUB_DIR/gh-issue-remove-label-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_issue_remove_label_rest 42 dispatch:planned
assert_rest_only "remove-label" "$STUB_DIR/gh-issue-remove-label-rest-calls.log"
teardown

# --- gh_issue_close_rest ---
echo "Test: gh_issue_close_rest -- consumes REST bucket, not GraphQL"
setup
: > "$STUB_DIR/gh-issue-close-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_issue_close_rest 42
assert_rest_only "close" "$STUB_DIR/gh-issue-close-rest-calls.log"
teardown

  # --- gh_issue_reopen_rest ---
  echo "Test: gh_issue_reopen_rest -- consumes REST bucket, not GraphQL"
  setup
  : > "$STUB_DIR/gh-issue-close-rest-calls.log"
  source "$TMPDIR_TEST/lib.sh"; gh_issue_reopen_rest 42
  assert_rest_only "reopen" "$STUB_DIR/gh-issue-close-rest-calls.log"
  teardown

# --- gh_issue_edit_rest ---
echo "Test: gh_issue_edit_rest -- consumes REST bucket, not GraphQL"
setup
: > "$STUB_DIR/gh-issue-close-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_issue_edit_rest 42 --title "t"
assert_rest_only "edit" "$STUB_DIR/gh-issue-close-rest-calls.log"
teardown

# --- gh_issue_create_rest ---
echo "Test: gh_issue_create_rest -- consumes REST bucket, not GraphQL"
setup
: > "$STUB_DIR/gh-issue-create-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_issue_create_rest --title "t" --body "b" >/dev/null
assert_rest_only "create" "$STUB_DIR/gh-issue-create-rest-calls.log"
teardown

# --- gh_issue_comment_rest ---
echo "Test: gh_issue_comment_rest -- consumes REST bucket, not GraphQL"
setup
: > "$STUB_DIR/gh-issue-comment-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_issue_comment_rest 42 --body "a comment"
assert_rest_only "comment" "$STUB_DIR/gh-issue-comment-rest-calls.log"
teardown

# --- gh_pr_merge_rest ---
echo "Test: gh_pr_merge_rest -- consumes REST bucket, not GraphQL"
setup
: > "$STUB_DIR/gh-pr-merge-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_pr_merge_rest 42
assert_rest_only "pr-merge" "$STUB_DIR/gh-pr-merge-rest-calls.log"
teardown

# --- gh_pr_update_branch_rest ---
echo "Test: gh_pr_update_branch_rest -- consumes REST bucket, not GraphQL"
setup
: > "$STUB_DIR/gh-pr-update-branch-rest-calls.log"
source "$TMPDIR_TEST/lib.sh"; gh_pr_update_branch_rest 42
assert_rest_only "pr-update-branch" "$STUB_DIR/gh-pr-update-branch-rest-calls.log"
teardown

# <<< END MOVED <<<

report_results
