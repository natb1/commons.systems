#!/usr/bin/env bash
# Tests for dispatch-attempt-count -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 13083-13279.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-attempt-count tests
# ============================================================================
#
# AC1 (selection exclusion): covered by the existing office-hours-skip selection
# tests (~line 2922 "PR whose issue carries dispatch:office-hours is skipped"
# and ~line 5723 help-wanted/office-hours skip). The ceiling park reuses
# dispatch-apply-office-hours, the same mechanism those tests exercise, so no
# new selection-exclusion test is added here.
#
# Key inversion vs dispatch-qa-fix-attempt: this script BUMPS FIRST then reports.
# At the ceiling, the label write still lands (NEXT is applied) and THEN
# `escalate` is emitted. This is the opposite of dispatch-qa-fix-attempt, which
# at cap applies NO label before escalating.
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/scripts/   copy of dispatch-attempt-count
#   $TMPDIR_TEST/bin/       fake-gh stub
#   $TMPDIR_TEST/gh-edit-log   recorded fake-gh issue edit / label create argv

echo ""
echo "=== dispatch-attempt-count ==="

aca_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/bin"

  cp "$SCRIPT_DIR/dispatch-attempt-count" \
    "$TMPDIR_TEST/scripts/dispatch-attempt-count"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-attempt-count"

  # fake gh: `issue view` echoes the test-controlled current count
  # (${FAKE_CUR_ATTEMPT:-0}). `issue edit` / `label create` record their
  # argv to a log and exit 0.
  cat > "$TMPDIR_TEST/bin/fake-gh" <<STUB
#!/usr/bin/env bash
if [[ "\$1" == "issue" && "\$2" == "view" ]]; then
  echo "\${FAKE_CUR_ATTEMPT:-0}"
  exit 0
fi
echo "\$*" >> "$TMPDIR_TEST/gh-edit-log"
exit 0
STUB
  chmod +x "$TMPDIR_TEST/bin/fake-gh"
  export DISPATCH_ATTEMPT_COUNT_GH_CMD="$TMPDIR_TEST/bin/fake-gh"
}

aca_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  unset DISPATCH_ATTEMPT_COUNT_GH_CMD
  unset DISPATCH_TOTAL_ATTEMPT_CEILING
  unset FAKE_CUR_ATTEMPT
}

# --- Test 1: no prior label (CUR=0), default ceiling 13 → proceed, applies attempts-1, no remove ---

echo "Test: no prior label (CUR=0), default ceiling → proceed, applies attempts-1, no remove"
aca_setup
export FAKE_CUR_ATTEMPT=0
if out=$("$TMPDIR_TEST/scripts/dispatch-attempt-count" 2040 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "aca CUR=0 exits 0" "0" "$rc"
assert_eq "aca CUR=0 stdout is proceed" "proceed" "$out"
edits=$(cat "$TMPDIR_TEST/gh-edit-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$edits" == *"--add-label dispatch:attempts-1"* \
   && "$edits" != *"--remove-label"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: CUR=0 applies attempts-1 with no remove"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: CUR=0 applies attempts-1 with no remove"
  echo "    edits: $edits"
fi
aca_teardown

# --- Test 2: CUR=5, default ceiling 13 → proceed, removes attempts-5, applies attempts-6 ---

echo "Test: CUR=5, default ceiling 13 → proceed, removes attempts-5 and applies attempts-6"
aca_setup
export FAKE_CUR_ATTEMPT=5
if out=$("$TMPDIR_TEST/scripts/dispatch-attempt-count" 2040 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "aca CUR=5 exits 0" "0" "$rc"
assert_eq "aca CUR=5 stdout is proceed" "proceed" "$out"
edits=$(cat "$TMPDIR_TEST/gh-edit-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$edits" == *"--remove-label dispatch:attempts-5"* \
   && "$edits" == *"--add-label dispatch:attempts-6"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: CUR=5 removes attempts-5 and adds attempts-6"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: CUR=5 removes attempts-5 and adds attempts-6"
  echo "    edits: $edits"
fi
aca_teardown

# --- Test 3: ceiling fires AND bump still lands (key inversion vs qfa at-cap) ---
# CUR=12, CEILING=13 → NEXT=13 >= 13 → escalate, BUT attempts-13 IS still written.
# This is the deliberate inversion: dispatch-qa-fix-attempt writes NO label at cap;
# dispatch-attempt-count writes the label (bump-first) THEN emits the verdict.

echo "Test: CUR=12, CEILING=13 (ceiling fires) → escalate AND attempts-13 is applied (bump-first inversion)"
aca_setup
export DISPATCH_TOTAL_ATTEMPT_CEILING=13
export FAKE_CUR_ATTEMPT=12
if out=$("$TMPDIR_TEST/scripts/dispatch-attempt-count" 2040 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "aca ceiling fires exits 0" "0" "$rc"
assert_eq "aca ceiling fires stdout is escalate" "escalate" "$out"
edits=$(cat "$TMPDIR_TEST/gh-edit-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$edits" == *"--remove-label dispatch:attempts-12"* \
   && "$edits" == *"--add-label dispatch:attempts-13"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: ceiling fires but bump still landed (attempts-13 applied, attempts-12 removed)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: ceiling fires but bump still landed (attempts-13 applied, attempts-12 removed)"
  echo "    edits: $edits"
fi
aca_teardown

# --- Test 4: env ceiling override fires early: CEILING=3, CUR=2 → escalate, bump lands ---

echo "Test: CEILING=3, CUR=2 → escalate (NEXT=3 >= 3), bump landed (attempts-3 applied)"
aca_setup
export DISPATCH_TOTAL_ATTEMPT_CEILING=3
export FAKE_CUR_ATTEMPT=2
if out=$("$TMPDIR_TEST/scripts/dispatch-attempt-count" 2040 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "aca ceiling=3 CUR=2 exits 0" "0" "$rc"
assert_eq "aca ceiling=3 CUR=2 stdout is escalate" "escalate" "$out"
edits=$(cat "$TMPDIR_TEST/gh-edit-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$edits" == *"--add-label dispatch:attempts-3"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: CEILING=3 CUR=2 escalates and applies attempts-3"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: CEILING=3 CUR=2 escalates and applies attempts-3"
  echo "    edits: $edits"
fi
aca_teardown

# --- Test 5: below the overridden ceiling: CEILING=3, CUR=1 → proceed ---

echo "Test: CEILING=3, CUR=1 (below override ceiling) → proceed"
aca_setup
export DISPATCH_TOTAL_ATTEMPT_CEILING=3
export FAKE_CUR_ATTEMPT=1
if out=$("$TMPDIR_TEST/scripts/dispatch-attempt-count" 2040 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "aca ceiling=3 CUR=1 exits 0" "0" "$rc"
assert_eq "aca ceiling=3 CUR=1 stdout is proceed" "proceed" "$out"
aca_teardown

# --- Test 6a: non-integer CUR → exit 2, no label edits, stderr mentions integer guard ---

echo "Test: non-integer CUR → exit 2, gh-edit-log empty, stderr mentions integer guard"
aca_setup
export FAKE_CUR_ATTEMPT=abc
if out=$("$TMPDIR_TEST/scripts/dispatch-attempt-count" 2040 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "aca non-integer CUR exits 2" "2" "$rc"
err=$(cat "$TMPDIR_TEST/stderr")
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"not an integer"* && ! -s "$TMPDIR_TEST/gh-edit-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-integer CUR; stderr integer-guard message + no label edit"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-integer CUR; stderr integer-guard message + no label edit"
  echo "    stderr: $err"
  echo "    gh-edit-log exists: $(test -s "$TMPDIR_TEST/gh-edit-log" && echo yes || echo no)"
fi
aca_teardown

# --- Test 6b: malformed DISPATCH_TOTAL_ATTEMPT_CEILING → exit 2, stderr mentions CEILING ---

echo "Test: CEILING=abc → exit 2, gh-edit-log empty, stderr mentions CEILING must be a positive integer"
aca_setup
export DISPATCH_TOTAL_ATTEMPT_CEILING=abc
export FAKE_CUR_ATTEMPT=0
if out=$("$TMPDIR_TEST/scripts/dispatch-attempt-count" 2040 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "aca bad CEILING exits 2" "2" "$rc"
err=$(cat "$TMPDIR_TEST/stderr")
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"CEILING must be a positive integer"* && ! -s "$TMPDIR_TEST/gh-edit-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: bad CEILING; stderr CEILING-guard message + no label edit"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: bad CEILING; stderr CEILING-guard message + no label edit"
  echo "    stderr: $err"
fi
aca_teardown

# --- Test 6c: flag-like arg → exit 2, no label edits ---

echo "Test: flag-like arg --repo → exit 2, no label edits"
aca_setup
if out=$("$TMPDIR_TEST/scripts/dispatch-attempt-count" --repo 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "aca flag-like arg exits 2" "2" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/gh-edit-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: flag-like arg; no label edits"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: flag-like arg; no label edits"
  echo "    edits: $(cat "$TMPDIR_TEST/gh-edit-log")"
fi
aca_teardown

# <<< END MOVED <<<

report_results
