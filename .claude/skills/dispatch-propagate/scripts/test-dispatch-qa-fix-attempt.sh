#!/usr/bin/env bash
# Tests for dispatch-qa-fix-attempt -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 12855-13082.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# --- dispatch-qa-fix-attempt (#1553) ---
# ============================================================================
# dispatch-qa-fix-attempt tests
# ============================================================================
#
# Exercises the qa-fix attempt counter bump: under-cap prints `fix` and bumps
# the dispatch:qa-fix-attempt-<n> label; at-cap prints `escalate` with no label
# writes; bad args / non-integer CUR / bad CAP exit 2; the create-on-"not found"
# path falls back to `label create` + retry and still prints `fix`.
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/scripts/   copy of dispatch-qa-fix-attempt
#   $TMPDIR_TEST/bin/       fake-gh stub
#   $TMPDIR_TEST/gh-edit-log   recorded fake-gh pr-edit / label-create argv

echo ""
echo "=== dispatch-qa-fix-attempt ==="

qfa_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/bin"

  cp "$SCRIPT_DIR/dispatch-qa-fix-attempt" \
    "$TMPDIR_TEST/scripts/dispatch-qa-fix-attempt"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-qa-fix-attempt"

  # fake gh: `pr view` echoes the test-controlled current attempt count
  # ($FAKE_CUR_ATTEMPT, default 0). `pr edit` / `label create` record their
  # argv to a log and exit 0.
  cat > "$TMPDIR_TEST/bin/fake-gh" <<STUB
#!/usr/bin/env bash
if [[ "\$1" == "pr" && "\$2" == "view" ]]; then
  echo "\${FAKE_CUR_ATTEMPT:-0}"
  exit 0
fi
echo "\$*" >> "$TMPDIR_TEST/gh-edit-log"
exit 0
STUB
  chmod +x "$TMPDIR_TEST/bin/fake-gh"
  export DISPATCH_QA_FIX_ATTEMPT_GH_CMD="$TMPDIR_TEST/bin/fake-gh"
  export DISPATCH_QA_FIX_ATTEMPT_CAP=2
}

qfa_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  unset DISPATCH_QA_FIX_ATTEMPT_GH_CMD
  unset DISPATCH_QA_FIX_ATTEMPT_CAP
  unset FAKE_CUR_ATTEMPT
}

# --- Test 1: no prior label (CUR=0), default cap 2 → fix, applies attempt-1 ---

echo "Test: no prior label (CUR=0) → fix, applies attempt-1, no remove"
qfa_setup
export FAKE_CUR_ATTEMPT=0
if out=$("$TMPDIR_TEST/scripts/dispatch-qa-fix-attempt" 979 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "qfa CUR=0 exits 0" "0" "$rc"
assert_eq "qfa CUR=0 stdout is fix" "fix" "$out"
edits=$(cat "$TMPDIR_TEST/gh-edit-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$edits" == *"--add-label dispatch:qa-fix-attempt-1"* \
   && "$edits" != *"--remove-label"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: CUR=0 applies attempt-1 with no remove"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: CUR=0 applies attempt-1 with no remove"
  echo "    edits: $edits"
fi
qfa_teardown

# --- Test 2: CUR=1, default cap 2 → fix, removes attempt-1, applies attempt-2 -

echo "Test: CUR=1 → fix, removes attempt-1 and applies attempt-2"
qfa_setup
export FAKE_CUR_ATTEMPT=1
if out=$("$TMPDIR_TEST/scripts/dispatch-qa-fix-attempt" 979 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "qfa CUR=1 exits 0" "0" "$rc"
assert_eq "qfa CUR=1 stdout is fix" "fix" "$out"
edits=$(cat "$TMPDIR_TEST/gh-edit-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$edits" == *"--remove-label dispatch:qa-fix-attempt-1"* \
   && "$edits" == *"--add-label dispatch:qa-fix-attempt-2"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: CUR=1 removes attempt-1 and adds attempt-2"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: CUR=1 removes attempt-1 and adds attempt-2"
  echo "    edits: $edits"
fi
qfa_teardown

# --- Test 3: CUR=2, default cap 2 (at cap) → escalate, no label writes --------

echo "Test: CUR=2, cap=2 (at cap) → escalate, gh-edit-log empty"
qfa_setup
export FAKE_CUR_ATTEMPT=2
if out=$("$TMPDIR_TEST/scripts/dispatch-qa-fix-attempt" 979 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "qfa at-cap exits 0" "0" "$rc"
assert_eq "qfa at-cap stdout is escalate" "escalate" "$out"
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/gh-edit-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: at-cap writes no labels (gh-edit-log empty)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: at-cap writes no labels (gh-edit-log empty)"
  echo "    edits: $(cat "$TMPDIR_TEST/gh-edit-log")"
fi
qfa_teardown

# --- Test 4: DISPATCH_QA_FIX_ATTEMPT_CAP=1, CUR=1 (at cap via env) → escalate -

echo "Test: CAP=1, CUR=1 (at cap via env override) → escalate, gh-edit-log empty"
qfa_setup
export DISPATCH_QA_FIX_ATTEMPT_CAP=1
export FAKE_CUR_ATTEMPT=1
if out=$("$TMPDIR_TEST/scripts/dispatch-qa-fix-attempt" 979 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "qfa cap-env at-cap exits 0" "0" "$rc"
assert_eq "qfa cap-env at-cap stdout is escalate" "escalate" "$out"
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/gh-edit-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: CAP=1 CUR=1 writes no labels (gh-edit-log empty)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: CAP=1 CUR=1 writes no labels (gh-edit-log empty)"
  echo "    edits: $(cat "$TMPDIR_TEST/gh-edit-log")"
fi
qfa_teardown

# --- Test 5a: non-integer CUR → exit 2, no label edits, stderr guard msg ------

echo "Test: non-integer CUR → exit 2, gh-edit-log empty, stderr mentions integer guard"
qfa_setup
export FAKE_CUR_ATTEMPT=abc
if out=$("$TMPDIR_TEST/scripts/dispatch-qa-fix-attempt" 979 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "qfa non-integer CUR exits 2" "2" "$rc"
err=$(cat "$TMPDIR_TEST/stderr")
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"not an integer"* && ! -s "$TMPDIR_TEST/gh-edit-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-integer CUR; stderr integer-guard message + no label edit"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-integer CUR; stderr integer-guard message + no label edit"
  echo "    stderr: $err"
  echo "    gh-edit-log exists: $(test -s "$TMPDIR_TEST/gh-edit-log" && echo yes || echo no)"
fi
qfa_teardown

# --- Test 5b: non-integer CAP → exit 2, no label edits, stderr guard msg ------

echo "Test: non-integer CAP → exit 2, gh-edit-log empty, stderr mentions CAP error"
qfa_setup
export DISPATCH_QA_FIX_ATTEMPT_CAP=abc
export FAKE_CUR_ATTEMPT=0
if out=$("$TMPDIR_TEST/scripts/dispatch-qa-fix-attempt" 979 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "qfa non-integer CAP exits 2" "2" "$rc"
err=$(cat "$TMPDIR_TEST/stderr")
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"CAP must be a positive integer"* && ! -s "$TMPDIR_TEST/gh-edit-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-integer CAP; stderr CAP-guard message + no label edit"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-integer CAP; stderr CAP-guard message + no label edit"
  echo "    stderr: $err"
fi
qfa_teardown

# --- Test 5c: flag-like arg → exit 2, no label edits -------------------------

echo "Test: flag-like arg --repo → exit 2, no label edits"
qfa_setup
if out=$("$TMPDIR_TEST/scripts/dispatch-qa-fix-attempt" --repo 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "qfa flag-like arg exits 2" "2" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/gh-edit-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: flag-like arg; no label edits"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: flag-like arg; no label edits"
  echo "    edits: $(cat "$TMPDIR_TEST/gh-edit-log")"
fi
qfa_teardown

# --- Test 6: create-on-"not found" path (CUR=0) → fix, label create logged ----
# Replaces the default fake-gh with one whose `pr edit --add-label` simulates
# a label-not-found failure, forcing the script's `label create` + retry path.
# The retry `pr edit` also hits the `pr edit` branch and exits 1 (warn path
# only); it is NOT recorded in gh-edit-log since the fake-gh `pr edit` branch
# exits before the `echo >> log` fallthrough. The retry is instead asserted via
# stderr: only the retry-after-create warning carries the `after create`
# substring, so checking for it guards the retry step against accidental
# deletion (a dropped retry would remove that warning).

echo "Test: create-on-not-found path (CUR=0) → fix, gh-edit-log contains label create"
qfa_setup
export FAKE_CUR_ATTEMPT=0
# Write a per-test fake-gh that simulates the not-found path.
cat > "$TMPDIR_TEST/bin/fake-gh" <<STUB
#!/usr/bin/env bash
if [[ "\$1" == "pr" && "\$2" == "view" ]]; then
  echo "\${FAKE_CUR_ATTEMPT:-0}"
  exit 0
fi
if [[ "\$1" == "pr" && "\$2" == "edit" ]]; then
  echo "Label 'dispatch:qa-fix-attempt-1' not found"
  exit 1
fi
echo "\$*" >> "$TMPDIR_TEST/gh-edit-log"
exit 0
STUB
chmod +x "$TMPDIR_TEST/bin/fake-gh"
if out=$("$TMPDIR_TEST/scripts/dispatch-qa-fix-attempt" 979 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "qfa create-on-not-found exits 0" "0" "$rc"
assert_eq "qfa create-on-not-found stdout is fix" "fix" "$out"
edits=$(cat "$TMPDIR_TEST/gh-edit-log" 2>/dev/null || true)
err=$(cat "$TMPDIR_TEST/stderr" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$edits" == *"label create dispatch:qa-fix-attempt-1"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: create-on-not-found logs label create dispatch:qa-fix-attempt-1"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: create-on-not-found logs label create dispatch:qa-fix-attempt-1"
  echo "    edits: $edits"
fi
# Guard the retry pr edit after `label create` against accidental deletion. The
# retry's stderr warning is the only one carrying `after create` (the initial
# add-label failure routes to the label-create branch and emits no warning), so
# its presence proves the retry ran. A dropped retry would remove this warning.
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"after create"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: create-on-not-found retries pr edit after label create (stderr 'after create')"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: create-on-not-found retries pr edit after label create (stderr 'after create')"
  echo "    stderr: $err"
fi
qfa_teardown

# <<< END MOVED <<<

report_results
