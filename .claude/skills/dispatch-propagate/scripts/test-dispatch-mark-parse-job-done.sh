#!/usr/bin/env bash
# Tests for dispatch-mark-parse-job-done -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 24337-24386.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
echo ""
echo "=== dispatch-mark-parse-job-done ==="

MARK_PARSE_JOB_DONE="$SCRIPT_DIR/dispatch-mark-parse-job-done"

# ----- mark-parse-job-done: writes the sentinel under CLAUDE_JOB_DIR (with note) -----
pj_dir=$(mktemp -d)
if CLAUDE_JOB_DIR="$pj_dir" "$MARK_PARSE_JOB_DONE" "merged statement abc.qfx"; then pj_ec=0; else pj_ec=$?; fi
assert_eq "mark-parse-job-done: exit 0 on happy path" "0" "$pj_ec"
assert_eq "mark-parse-job-done: writes the parse-job-done sentinel" "1" \
  "$([ -f "$pj_dir/parse-job-done" ] && echo 1 || echo 0)"
assert_eq "mark-parse-job-done: writes exact note contents" \
  "$(printf 'merged statement abc.qfx\n')" "$(cat "$pj_dir/parse-job-done")"
rm -rf "$pj_dir"

# ----- mark-parse-job-done: no arg → exit 0, sentinel present (note optional) -----
pj_dir=$(mktemp -d)
if CLAUDE_JOB_DIR="$pj_dir" "$MARK_PARSE_JOB_DONE"; then pj_ec=0; else pj_ec=$?; fi
assert_eq "mark-parse-job-done: no-arg exit 0" "0" "$pj_ec"
assert_eq "mark-parse-job-done: no-arg writes the sentinel" "1" \
  "$([ -f "$pj_dir/parse-job-done" ] && echo 1 || echo 0)"
rm -rf "$pj_dir"

# ----- mark-parse-job-done: extra arg → exit 2, no file -----
pj_dir=$(mktemp -d)
if CLAUDE_JOB_DIR="$pj_dir" "$MARK_PARSE_JOB_DONE" "a" "b" 2>/dev/null; then pj_ec=0; else pj_ec=$?; fi
assert_eq "mark-parse-job-done: extra arg exit 2" "2" "$pj_ec"
assert_eq "mark-parse-job-done: extra arg writes no file" "0" \
  "$([ -f "$pj_dir/parse-job-done" ] && echo 1 || echo 0)"
rm -rf "$pj_dir"

# ----- mark-parse-job-done: CLAUDE_JOB_DIR unset → exit 0, no file, stderr diagnostic -----
pj_err=$( (unset CLAUDE_JOB_DIR; "$MARK_PARSE_JOB_DONE" "x") 2>&1 1>/dev/null ) && pj_ec=0 || pj_ec=$?
assert_eq "mark-parse-job-done: unset CLAUDE_JOB_DIR exit 0" "0" "$pj_ec"
assert_eq "mark-parse-job-done: unset CLAUDE_JOB_DIR emits diagnostic" "1" \
  "$( [[ -n "$pj_err" ]] && echo 1 || echo 0 )"

# ----- mark-parse-job-done: unset CLAUDE_JOB_DIR writes no file -----
pj_dir=$(mktemp -d)
( unset CLAUDE_JOB_DIR; "$MARK_PARSE_JOB_DONE" "x" ) >/dev/null 2>&1 || true
assert_eq "mark-parse-job-done: unset CLAUDE_JOB_DIR writes no sentinel in any dir" "0" \
  "$([ -f "$pj_dir/parse-job-done" ] && echo 1 || echo 0)"
rm -rf "$pj_dir"

# ----- mark-parse-job-done: CLAUDE_JOB_DIR set to a file (not a dir) → exit 0, no write -----
pj_file=$(mktemp)
if CLAUDE_JOB_DIR="$pj_file" "$MARK_PARSE_JOB_DONE" "note" 2>/dev/null; then pj_ec=0; else pj_ec=$?; fi
assert_eq "mark-parse-job-done: CLAUDE_JOB_DIR is a file exit 0" "0" "$pj_ec"
rm -f "$pj_file"

# <<< END MOVED <<<

report_results
