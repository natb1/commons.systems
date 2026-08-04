#!/usr/bin/env bash
# Tests for dispatch-recover-dispatched-phase -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 27106-27283.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-recover-dispatched-phase tests (#2025)
# ============================================================================
#
# Exercises the phase-recovery tool: greps the transcript's first
# <command-name>/skill</command-name> tag and maps it to a dispatch phase.
# Exits 0 + prints the phase on a recognised dispatch skill; exits 1 + no
# output for unrecognised skills, missing/empty files, and no-arg invocations.
# Fixtures are JSONL files written with printf '%s\n' (NOT echo) to avoid
# zsh backslash-escape corruption.
echo ""
echo "=== dispatch-recover-dispatched-phase ==="

DRDP="$SCRIPT_DIR/dispatch-recover-dispatched-phase"

drdp_setup() {
  TMPDIR_TEST=$(mktemp -d)
}
drdp_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
}

# Helper: write a one-line JSONL fixture whose content embeds a command-name tag
# for the given skill name. Single quotes + concatenation avoids any shell
# escaping of the tag's forward slash.
_drdp_fixture() {
  local path="$1" skill="$2"
  printf '%s\n' \
    '{"type":"user","message":{"content":[{"type":"text","text":"<command-name>/'"${skill}"'</command-name>"}]}}' \
    > "$path"
}

# --- Test 1: /plan-issue → "plan", exit 0 ------------------------------------
echo "Test: /plan-issue tag → stdout 'plan', exit 0"
drdp_setup
_drdp_fixture "$TMPDIR_TEST/plan.jsonl" "plan-issue"
if out=$("$DRDP" "$TMPDIR_TEST/plan.jsonl" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "recover plan-issue: stdout is 'plan'" "plan" "$out"
assert_eq "recover plan-issue: exit 0" "0" "$rc"
drdp_teardown

# --- Test 2: /implement → "implement", exit 0 --------------------------------
echo "Test: /implement tag → stdout 'implement', exit 0"
drdp_setup
_drdp_fixture "$TMPDIR_TEST/impl.jsonl" "implement"
if out=$("$DRDP" "$TMPDIR_TEST/impl.jsonl" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "recover implement: stdout is 'implement'" "implement" "$out"
assert_eq "recover implement: exit 0" "0" "$rc"
drdp_teardown

# --- Test 3: /qa-fix → "qa", exit 0 -----------------------------------------
echo "Test: /qa-fix tag → stdout 'qa', exit 0"
drdp_setup
_drdp_fixture "$TMPDIR_TEST/qa.jsonl" "qa-fix"
if out=$("$DRDP" "$TMPDIR_TEST/qa.jsonl" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "recover qa-fix: stdout is 'qa'" "qa" "$out"
assert_eq "recover qa-fix: exit 0" "0" "$rc"
drdp_teardown

# --- Test 4: /review-fix → "review", exit 0 ----------------------------------
echo "Test: /review-fix tag → stdout 'review', exit 0"
drdp_setup
_drdp_fixture "$TMPDIR_TEST/review.jsonl" "review-fix"
if out=$("$DRDP" "$TMPDIR_TEST/review.jsonl" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "recover review-fix: stdout is 'review'" "review" "$out"
assert_eq "recover review-fix: exit 0" "0" "$rc"
drdp_teardown

# --- Test 5: /fix-checks → "fix-checks", exit 0 ------------------------------
echo "Test: /fix-checks tag → stdout 'fix-checks', exit 0"
drdp_setup
_drdp_fixture "$TMPDIR_TEST/fc.jsonl" "fix-checks"
if out=$("$DRDP" "$TMPDIR_TEST/fc.jsonl" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "recover fix-checks: stdout is 'fix-checks'" "fix-checks" "$out"
assert_eq "recover fix-checks: exit 0" "0" "$rc"
drdp_teardown

# --- Test 6: /dispatch-conflict → "fix-conflicts", exit 0 --------------------
echo "Test: /dispatch-conflict tag → stdout 'fix-conflicts', exit 0"
drdp_setup
_drdp_fixture "$TMPDIR_TEST/fcon.jsonl" "dispatch-conflict"
if out=$("$DRDP" "$TMPDIR_TEST/fcon.jsonl" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "recover dispatch-conflict: stdout is 'fix-conflicts'" "fix-conflicts" "$out"
assert_eq "recover dispatch-conflict: exit 0" "0" "$rc"
drdp_teardown

# --- Test 7: /office-hours → empty stdout, non-zero exit ---------------------
echo "Test: /office-hours tag → empty stdout, non-zero exit"
drdp_setup
_drdp_fixture "$TMPDIR_TEST/oh.jsonl" "office-hours"
if out=$("$DRDP" "$TMPDIR_TEST/oh.jsonl" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "recover office-hours: stdout is empty" "" "$out"
TOTAL=$((TOTAL + 1))
if [[ "$rc" -ne 0 ]]; then
  PASS=$((PASS + 1)); echo "  PASS: recover office-hours: exit non-zero"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: recover office-hours: exit non-zero (got 0)"
fi
drdp_teardown

# --- Test 8: /budget-parse-job → empty stdout, non-zero exit -----------------
echo "Test: /budget-parse-job tag → empty stdout, non-zero exit"
drdp_setup
_drdp_fixture "$TMPDIR_TEST/bpj.jsonl" "budget-parse-job"
if out=$("$DRDP" "$TMPDIR_TEST/bpj.jsonl" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "recover budget-parse-job: stdout is empty" "" "$out"
TOTAL=$((TOTAL + 1))
if [[ "$rc" -ne 0 ]]; then
  PASS=$((PASS + 1)); echo "  PASS: recover budget-parse-job: exit non-zero"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: recover budget-parse-job: exit non-zero (got 0)"
fi
drdp_teardown

# --- Test 9: missing path → empty stdout, non-zero exit ----------------------
echo "Test: missing transcript path → empty stdout, non-zero exit"
drdp_setup
if out=$("$DRDP" "$TMPDIR_TEST/nope.jsonl" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "recover missing-path: stdout is empty" "" "$out"
TOTAL=$((TOTAL + 1))
if [[ "$rc" -ne 0 ]]; then
  PASS=$((PASS + 1)); echo "  PASS: recover missing-path: exit non-zero"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: recover missing-path: exit non-zero (got 0)"
fi
drdp_teardown

# --- Test 10: grep -m1 first-match wins (first line wins, later line ignored) --
# First line embeds /implement; a later line embeds /commit-merge-push.
# The script must return "implement" (first match) and NOT silently yield
# nothing (commit-merge-push is not a dispatch phase, but it must not shadow).
echo "Test: first-match semantics (implement first, commit-merge-push later) → 'implement', exit 0"
drdp_setup
printf '%s\n' \
  '{"type":"user","message":{"content":[{"type":"text","text":"<command-name>/implement</command-name>"}]}}' \
  '{"type":"assistant","message":{"content":[{"type":"text","text":"<command-name>/commit-merge-push</command-name>"}]}}' \
  > "$TMPDIR_TEST/firstmatch.jsonl"
if out=$("$DRDP" "$TMPDIR_TEST/firstmatch.jsonl" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "recover first-match: stdout is 'implement' (not shadowed by commit-merge-push)" "implement" "$out"
assert_eq "recover first-match: exit 0" "0" "$rc"
drdp_teardown

# --- Test 11: fallback path (no command-name tag) → recognized skill, exit 0 --
# Transcript has NO <command-name> tag; line 1 embeds a .claude/skills/<skill>
# path. The fallback grep must recover the skill and map it to its phase.
echo "Test: fallback path (no tag, .claude/skills/qa-fix on line 1) → 'qa', exit 0"
drdp_setup
printf '%s\n' \
  '{"type":"user","message":{"content":[{"type":"text","text":"see .claude/skills/qa-fix/SKILL.md"}]}}' \
  > "$TMPDIR_TEST/fallback.jsonl"
if out=$("$DRDP" "$TMPDIR_TEST/fallback.jsonl" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "recover fallback: stdout is 'qa'" "qa" "$out"
assert_eq "recover fallback: exit 0" "0" "$rc"
drdp_teardown

# --- Test 12: fallback ignores skills paths in later records → exit 1 --------
# No tag anywhere; line 1 carries NO skills path, but line 2 references
# .claude/skills/implement (e.g. tool output / Read result). The fallback is
# scoped to line 1, so it must NOT recover "implement" from the later record —
# any doubt → empty stdout, non-zero exit. A whole-file grep would wrongly
# return "implement"; this test proves the line-1 restriction.
echo "Test: fallback ignores skills path in later record → empty stdout, exit 1"
drdp_setup
printf '%s\n' \
  '{"type":"user","message":{"content":[{"type":"text","text":"recover this dead session"}]}}' \
  '{"type":"assistant","message":{"content":[{"type":"text","text":"reading .claude/skills/implement/SKILL.md"}]}}' \
  > "$TMPDIR_TEST/fallback-later.jsonl"
if out=$("$DRDP" "$TMPDIR_TEST/fallback-later.jsonl" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "recover fallback-later: stdout is empty" "" "$out"
TOTAL=$((TOTAL + 1))
if [[ "$rc" -ne 0 ]]; then
  PASS=$((PASS + 1)); echo "  PASS: recover fallback-later: exit non-zero"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: recover fallback-later: exit non-zero (got 0)"
fi
drdp_teardown

# <<< END MOVED <<<

report_results
