#!/usr/bin/env bash
# Tests for dispatch-apply-office-hours -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 4290-4437.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-apply-office-hours tests
# ============================================================================
echo ""
echo "=== dispatch-apply-office-hours ==="


# Happy path: the issue carries no office-hours label. #2256: the script now
# ensure-label-exists-first (`gh label create` with canonical FBCA04 metadata) then
# REST-adds the label to the ISSUE (POST .../issues/42/labels). The why-comment is
# now REST-backed too via gh_issue_comment_rest (POST .../issues/42/comments).
echo "Test: label absent → ensure label + REST add to issue + post why-comment"
setup
echo '{"state":"open","labels":[]}' > "$STUB_DIR/arg-issue-42.json"
"$TMPDIR_TEST/dispatch-apply-office-hours" 42 "phase exited before completion"
TOTAL=$((TOTAL + 1))
if grep -q 'issues/42/labels' "$STUB_DIR/gh-issue-set-labels-rest-calls.log" \
   && grep -q 'labels\[\]=dispatch:office-hours' "$STUB_DIR/gh-issue-set-labels-rest-calls.log"; then
  PASS=$((PASS + 1)); echo "  PASS: REST-adds dispatch:office-hours to issues/42/labels"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: REST-adds dispatch:office-hours to issues/42/labels"
  echo "    actual: '$(cat "$STUB_DIR/gh-issue-set-labels-rest-calls.log" 2>/dev/null)'"
fi
TOTAL=$((TOTAL + 1))
if grep -q "^label create dispatch:office-hours --color FBCA04 " "$STUB_DIR/gh-label-create.log"; then
  PASS=$((PASS + 1)); echo "  PASS: ensure-first creates with FBCA04 metadata"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: ensure-first creates with FBCA04 metadata"
fi
TOTAL=$((TOTAL + 1))
if grep -q "Reason: phase exited before completion" "$STUB_DIR/gh-issue-comment-rest-calls.log"; then
  PASS=$((PASS + 1)); echo "  PASS: why-comment contains the reason"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: why-comment contains the reason"
fi
TOTAL=$((TOTAL + 1))
if grep -q "issues/42/comments" "$STUB_DIR/gh-issue-comment-rest-calls.log"; then
  PASS=$((PASS + 1)); echo "  PASS: comment targets the issue"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: comment targets the issue"
fi
teardown

# Already-exists tolerance: the office-hours label already exists in the repo, so
# `gh label create` errors already-exists; the ensure-first idiom tolerates it and
# still REST-adds the label + posts the comment.
echo "Test: label already exists in repo → tolerated, REST add + comment still fire"
setup
: > "$STUB_DIR/gh-label-exists"
"$TMPDIR_TEST/dispatch-apply-office-hours" 42 "phase exited before completion"
TOTAL=$((TOTAL + 1))
if grep -q 'labels\[\]=dispatch:office-hours' "$STUB_DIR/gh-issue-set-labels-rest-calls.log"; then
  PASS=$((PASS + 1)); echo "  PASS: already-exists still REST-adds the label"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: already-exists still REST-adds the label"
fi
assert_eq "already-exists: why-comment still posted" "present" "$(log_state gh-issue-comment-rest-calls.log)"
teardown

# Idempotent: the issue already carries the label → no re-apply, no duplicate
# comment.
echo "Test: label already present → no edit, no duplicate comment"
setup
echo '{"state":"open","labels":[{"name":"dispatch:office-hours"}]}' > "$STUB_DIR/arg-issue-42.json"
"$TMPDIR_TEST/dispatch-apply-office-hours" 42 "phase ran but did not advance"
assert_eq "idempotent: no label edit" "absent" "$(log_state gh-issue-edit.log)"
assert_eq "idempotent: no duplicate comment" "absent" "$(log_state gh-issue-comment-rest-calls.log)"
teardown

# Missing reason (only an issue number) → non-zero exit, no edit, no comment.
echo "Test: missing reason → non-zero exit, no edit, no comment"
setup
if "$TMPDIR_TEST/dispatch-apply-office-hours" 42 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "missing reason exits non-zero" "1" "$rc"
assert_eq "missing reason: no label edit" "absent" "$(log_state gh-issue-edit.log)"
assert_eq "missing reason: no comment" "absent" "$(log_state gh-issue-comment-rest-calls.log)"
teardown

# Empty reason → same as missing reason.
echo "Test: empty reason → non-zero exit, no edit, no comment"
setup
if "$TMPDIR_TEST/dispatch-apply-office-hours" 42 "" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "empty reason exits non-zero" "1" "$rc"
assert_eq "empty reason: no label edit" "absent" "$(log_state gh-issue-edit.log)"
teardown

# Missing both args → non-zero exit.
echo "Test: missing both args → non-zero exit"
setup
if "$TMPDIR_TEST/dispatch-apply-office-hours" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "missing both args exits non-zero" "1" "$rc"
teardown

# Non-numeric, flag-like issue number → hard error, no gh calls. Guards against a
# flag-like first arg (e.g. --repo other/repo) being argument-injected into the
# gh issue view/edit/comment calls.
echo "Test: non-numeric issue number → non-zero exit, no edit/comment"
setup
if "$TMPDIR_TEST/dispatch-apply-office-hours" "--repo other/repo" "a reason" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "non-numeric issue number exits non-zero" "1" "$rc"
assert_eq "non-numeric issue number: no label edit" "absent" "$(log_state gh-issue-edit.log)"
assert_eq "non-numeric issue number: no comment" "absent" "$(log_state gh-issue-comment-rest-calls.log)"
teardown

# Never-block-a-hook: a non-already-exists `gh label create` failure must warn on
# stderr and exit 0 (a hook must never be torn down). No REST add, no comment.
echo "Test: label-create failure (not already-exists) → warn, exit 0, no add/comment"
setup
: > "$STUB_DIR/gh-fail-label-create"
if "$TMPDIR_TEST/dispatch-apply-office-hours" 42 "phase exited before completion" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "label-create failure: exit 0 (never block a hook)" "0" "$rc"
assert_eq "label-create failure: no REST add" "absent" "$(log_state gh-issue-set-labels-rest-calls.log)"
assert_eq "label-create failure: no comment" "absent" "$(log_state gh-issue-comment-rest-calls.log)"
teardown

# Never-block-a-hook: a REST add failure (label created, but POST .../labels fails)
# must also warn + exit 0 and post no comment.
echo "Test: REST add failure → warn, exit 0, no comment"
setup
: > "$STUB_DIR/gh-fail-rest"
if "$TMPDIR_TEST/dispatch-apply-office-hours" 42 "phase exited before completion" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "REST add failure: exit 0 (never block a hook)" "0" "$rc"
assert_eq "REST add failure: no comment" "absent" "$(log_state gh-issue-comment-rest-calls.log)"
teardown

# dispatch-apply-office-hours owns the FBCA04 hex. (A single-source-of-truth
# guard that excludes the two writer hooks is deferred to the unit that routes
# them through this script and removes their inline FBCA04 references.)
echo "Test: dispatch-apply-office-hours contains the FBCA04 hex"
TOTAL=$((TOTAL + 1))
if grep -q 'FBCA04' "$SCRIPT_DIR/dispatch-apply-office-hours"; then
  PASS=$((PASS + 1)); echo "  PASS: dispatch-apply-office-hours owns FBCA04"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: dispatch-apply-office-hours owns FBCA04"
fi

# Regression guard (#2244): the detached recommend-<N> machinery was removed in
# favor of the in-session recommend step (see escalation-recommend.md). Assert the
# script never re-references dispatch-spawn-recommend, so the detached spawn path
# cannot silently return.
echo "Test: dispatch-apply-office-hours no longer references dispatch-spawn-recommend"
TOTAL=$((TOTAL + 1))
if ! grep -q 'dispatch-spawn-recommend' "$SCRIPT_DIR/dispatch-apply-office-hours"; then
  PASS=$((PASS + 1)); echo "  PASS: no dispatch-spawn-recommend reference in dispatch-apply-office-hours"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: dispatch-spawn-recommend reference resurfaced in dispatch-apply-office-hours"
fi

# <<< END MOVED <<<

report_results
