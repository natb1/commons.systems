#!/usr/bin/env bash
# Tests for dispatch-mark-deferred -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 24285-24336.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
echo ""
echo "=== dispatch-mark-deferred (#2616) ==="

MARK_DEFERRED="$SCRIPT_DIR/dispatch-mark-deferred"

# ----- mark-deferred: writes exact one-line reason to the `deferred` sentinel -----
# Unlike dispatch-mark-deviation, dispatch-mark-deferred does NOT apply the
# office-hours park in-session (the Stop hook's Branch DEF owns the blocked_by
# gate decision), so it needs no synthetic-N git repo and touches no network: it
# only writes the sentinel.
mdf_dir=$(mktemp -d)
if CLAUDE_JOB_DIR="$mdf_dir" "$MARK_DEFERRED" "resolved: linked blocked_by #2552"; then mdf_ec=0; else mdf_ec=$?; fi
assert_eq "mark-deferred: exit 0 on happy path" "0" "$mdf_ec"
assert_eq "mark-deferred: writes exact deferred sentinel contents" \
  "$(printf 'resolved: linked blocked_by #2552\n')" "$(cat "$mdf_dir/deferred")"
# Must NOT write an office-hours-reason marker (it does not park in-session).
assert_eq "mark-deferred: writes no office-hours-reason marker" "0" \
  "$([ -f "$mdf_dir/office-hours-reason" ] && echo 1 || echo 0)"
rm -rf "$mdf_dir"

# ----- mark-deferred: no arg → exit 2 -----
mdf_dir=$(mktemp -d)
if CLAUDE_JOB_DIR="$mdf_dir" "$MARK_DEFERRED" 2>/dev/null; then mdf_ec=0; else mdf_ec=$?; fi
assert_eq "mark-deferred: no arg exit 2" "2" "$mdf_ec"
assert_eq "mark-deferred: no arg writes no sentinel" "0" \
  "$([ -f "$mdf_dir/deferred" ] && echo 1 || echo 0)"
rm -rf "$mdf_dir"

# ----- mark-deferred: empty-string arg → exit 2 -----
mdf_dir=$(mktemp -d)
if CLAUDE_JOB_DIR="$mdf_dir" "$MARK_DEFERRED" "" 2>/dev/null; then mdf_ec=0; else mdf_ec=$?; fi
assert_eq "mark-deferred: empty arg exit 2" "2" "$mdf_ec"
rm -rf "$mdf_dir"

# ----- mark-deferred: extra arg → exit 2 -----
mdf_dir=$(mktemp -d)
if CLAUDE_JOB_DIR="$mdf_dir" "$MARK_DEFERRED" "r1" "r2" 2>/dev/null; then mdf_ec=0; else mdf_ec=$?; fi
assert_eq "mark-deferred: extra arg exit 2" "2" "$mdf_ec"
rm -rf "$mdf_dir"

# ----- mark-deferred: CLAUDE_JOB_DIR unset → exit 0, no sentinel, stderr diagnostic -----
mdf_err=$( (unset CLAUDE_JOB_DIR; "$MARK_DEFERRED" "reason") 2>&1 1>/dev/null ) && mdf_ec=0 || mdf_ec=$?
assert_eq "mark-deferred: unset CLAUDE_JOB_DIR exit 0" "0" "$mdf_ec"
assert_eq "mark-deferred: unset CLAUDE_JOB_DIR emits diagnostic" "1" \
  "$([ -n "$mdf_err" ] && echo 1 || echo 0)"

# ----- mark-deferred: CLAUDE_JOB_DIR set to a file (not a dir) → exit 0, no write -----
mdf_file=$(mktemp)
if CLAUDE_JOB_DIR="$mdf_file" "$MARK_DEFERRED" "reason" 2>/dev/null; then mdf_ec=0; else mdf_ec=$?; fi
assert_eq "mark-deferred: CLAUDE_JOB_DIR is a file exit 0" "0" "$mdf_ec"
rm -f "$mdf_file"

# <<< END MOVED <<<

report_results
