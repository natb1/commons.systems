#!/usr/bin/env bash
# Tests for dispatch-run-verification -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 28725-28873.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-run-verification tests (#2024)
# ============================================================================
# dispatch-run-verification reads the full plan markdown on STDIN, finds the
# "## Verification" section, runs every ```verify fenced block in order via bash
# in the current directory, and exits tri-state: 0 (all passed), 1 (a block
# failed), or 3 (no section / no verify blocks — proceed unchanged). It calls no
# gh and no network, so these cases pipe fabricated plans straight in and assert
# the exit code and output — no setup/teardown or PATH shims needed.
echo ""
echo "=== dispatch-run-verification (#2024) ==="

RUN_VERIFY="$SCRIPT_DIR/dispatch-run-verification"

# Pass path: a verify block running `true` exits 0.
echo "Test: dispatch-run-verification -- verify block passes (exit 0)"
plan=$'## Plan\nbuild it\n\n## Verification (end-to-end)\nrun this:\n```verify\ntrue\n```\n'
if out=$(printf '%s' "$plan" | "$RUN_VERIFY" 2>&1); then rc=0; else rc=$?; fi
assert_eq "dispatch-run-verification: passing verify block exits 0" "0" "$rc"

# Escalate path: a verify block running `false` exits 1 and names the block.
echo "Test: dispatch-run-verification -- verify block fails (exit 1, index reported)"
plan=$'## Verification\n```verify\nfalse\n```\n'
if out=$(printf '%s' "$plan" | "$RUN_VERIFY" 2>&1); then rc=0; else rc=$?; fi
assert_eq "dispatch-run-verification: failing verify block exits 1" "1" "$rc"
case "$out" in
  *"verify block 1 failed"*) found=yes ;;
  *) found=no ;;
esac
assert_eq "dispatch-run-verification: failing block index is reported" "yes" "$found"

# No-runnable path (a): a Verification section with only prose + a plain ```bash
# block (NOT a verify block) exits 3.
echo "Test: dispatch-run-verification -- section without verify blocks exits 3"
plan=$'## Verification\nrun things manually\n```bash\ntrue\n```\n'
if out=$(printf '%s' "$plan" | "$RUN_VERIFY" 2>&1); then rc=0; else rc=$?; fi
assert_eq "dispatch-run-verification: prose/bash-only section exits 3" "3" "$rc"

# No-runnable path (b): a plan with no Verification heading at all exits 3 — and
# a ```verify block OUTSIDE the section is ignored (not run).
echo "Test: dispatch-run-verification -- no Verification section exits 3"
plan=$'## Plan\nno verification here\n```verify\ntrue\n```\n'
if out=$(printf '%s' "$plan" | "$RUN_VERIFY" 2>&1); then rc=0; else rc=$?; fi
assert_eq "dispatch-run-verification: no section exits 3" "3" "$rc"

# Ordering: two verify blocks, first passes, second fails -> exit 1 with the
# SECOND block identified as the failing one.
echo "Test: dispatch-run-verification -- first passes, second fails (exit 1, block 2)"
plan=$'## Verification\n```verify\ntrue\n```\n```verify\nexit 1\n```\n'
if out=$(printf '%s' "$plan" | "$RUN_VERIFY" 2>&1); then rc=0; else rc=$?; fi
assert_eq "dispatch-run-verification: first-pass/second-fail exits 1" "1" "$rc"
case "$out" in
  *"verify block 2 failed"*) found=yes ;;
  *) found=no ;;
esac
assert_eq "dispatch-run-verification: second block identified as failing" "yes" "$found"

# Converse ordering: first block FAILS, so the second block must NOT run. The
# second block's only effect is creating a sentinel file; its absence after the
# run proves the second block never executed.
echo "Test: dispatch-run-verification -- first fails, second block not run (sentinel absent)"
RV_TMP=$(mktemp -d)
sentinel="$RV_TMP/second-ran"
plan=$'## Verification\n```verify\nfalse\n```\n```verify\ntouch '"$sentinel"$'\n```\n'
if out=$(printf '%s' "$plan" | "$RUN_VERIFY" 2>&1); then rc=0; else rc=$?; fi
assert_eq "dispatch-run-verification: first-fail exits 1" "1" "$rc"
if [[ -e "$sentinel" ]]; then second_ran=yes; else second_ran=no; fi
assert_eq "dispatch-run-verification: second block did not run after first failed" "no" "$second_ran"
case "$out" in
  *"verify block 1 failed"*) found=yes ;;
  *) found=no ;;
esac
assert_eq "dispatch-run-verification: first block identified as failing" "yes" "$found"
rm -rf "$RV_TMP"

# Boundary robustness: a "## " line INSIDE a verify block body does not end the
# Verification section, so the block still runs and exits 0.
echo "Test: dispatch-run-verification -- '## ' inside a verify block is not a section terminator"
plan=$'## Verification\n```verify\necho "## not a heading"\ntrue\n```\n'
if out=$(printf '%s' "$plan" | "$RUN_VERIFY" 2>&1); then rc=0; else rc=$?; fi
assert_eq "dispatch-run-verification: '## ' inside fence does not terminate section" "0" "$rc"

# Usage: --help exits 0; an unexpected argument is a clear error (exit 2).
echo "Test: dispatch-run-verification -- --help exits 0, bad arg exits 2"
if "$RUN_VERIFY" --help >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "dispatch-run-verification: --help exits 0" "0" "$rc"
if "$RUN_VERIFY" bogus </dev/null >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "dispatch-run-verification: unexpected argument exits 2" "2" "$rc"

# Empty stdin guard (exit 4): truly empty input must be rejected as a hard
# error rather than silently emitting the exit-3 "proceed unchanged" signal,
# which would mask an upstream dispatch-read-plan failure.
echo "Test: dispatch-run-verification -- empty stdin exits 4 with diagnostic"
if out=$("$RUN_VERIFY" </dev/null 2>&1); then rc=0; else rc=$?; fi
assert_eq "dispatch-run-verification: empty stdin exits 4" "4" "$rc"
case "$out" in
  *"empty plan input"*) found=yes ;;
  *) found=no ;;
esac
assert_eq "dispatch-run-verification: empty stdin diagnostic contains 'empty plan input'" "yes" "$found"

# Whitespace-only stdin is also empty: same exit 4.
echo "Test: dispatch-run-verification -- whitespace-only stdin exits 4"
ws=$'  \n\t\n'
if out=$(printf '%s' "$ws" | "$RUN_VERIFY" 2>&1); then rc=0; else rc=$?; fi
assert_eq "dispatch-run-verification: whitespace-only stdin exits 4" "4" "$rc"

# Unclosed verify fence in-section (exit 5): a ```verify fence opened inside the
# Verification section but never closed before EOF is a malformed/authoring
# error, distinct from a failed verify block (exit 1) — so the routing logic can
# tell an unfixable plan from a fixable block (#2118).
echo "Test: dispatch-run-verification -- unclosed verify fence in section exits 5"
plan=$'## Verification\n```verify\ntrue\n'
if out=$(printf '%s' "$plan" | "$RUN_VERIFY" 2>&1); then rc=0; else rc=$?; fi
assert_eq "dispatch-run-verification: unclosed verify fence exits 5" "5" "$rc"
case "$out" in
  *"unclosed verify block"*) found=yes ;;
  *) found=no ;;
esac
assert_eq "dispatch-run-verification: unclosed-fence diagnostic reported" "yes" "$found"

# Unclosed fence AFTER a completed block (exit 5): the loop accumulates one or
# more closed ```verify blocks, then sets capturing=1 on the trailing unclosed
# fence. exit 5 must still fire at EOF even though blocks were successfully
# accumulated before — pinning the capturing-reset boundary on fence close so a
# future refactor cannot silently downgrade this to exit 0/1 (#2118).
echo "Test: dispatch-run-verification -- unclosed verify fence after a completed block exits 5"
plan=$'## Verification\n```verify\ntrue\n```\n```verify\nfalse\n'
if out=$(printf '%s' "$plan" | "$RUN_VERIFY" 2>&1); then rc=0; else rc=$?; fi
assert_eq "dispatch-run-verification: unclosed fence after completed block exits 5" "5" "$rc"
case "$out" in
  *"unclosed verify block"*) found=yes ;;
  *) found=no ;;
esac
assert_eq "dispatch-run-verification: post-block unclosed-fence diagnostic reported" "yes" "$found"

# Converse boundary (exit 3, NOT 5): an unclosed ```verify fence OUTSIDE any
# Verification section leaves capturing=0, so it is ignored like any out-of-
# section fence and stays the "proceed unchanged" exit 3 — pinning that exit 5
# fires only for an in-section unclosed fence.
echo "Test: dispatch-run-verification -- unclosed verify fence outside any section stays exit 3"
plan=$'## Plan\n```verify\ntrue\n'
if out=$(printf '%s' "$plan" | "$RUN_VERIFY" 2>&1); then rc=0; else rc=$?; fi
assert_eq "dispatch-run-verification: unclosed fence outside section exits 3" "3" "$rc"

# Preservation guard (criterion 2): the exit-3 cases above confirm a
# no-verify-block plan (prose/bash-only Verification section, or no section)
# still exits 3. No duplication needed here.

# <<< END MOVED <<<

report_results
