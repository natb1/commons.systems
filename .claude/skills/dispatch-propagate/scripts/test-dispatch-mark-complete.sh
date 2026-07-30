#!/usr/bin/env bash
# Tests for dispatch-mark-complete / dispatch-mark-deviation -- moved verbatim
# from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 24113-24284.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
echo ""
echo "=== dispatch-mark-complete / dispatch-mark-deviation ==="

MARK_COMPLETE="$SCRIPT_DIR/dispatch-mark-complete"
MARK_DEVIATION="$SCRIPT_DIR/dispatch-mark-deviation"

# --- mark-deviation in-session park sandbox (#2541) -------------------------
# After #2541, dispatch-mark-deviation applies the office-hours park IN-SESSION:
# it resolves the issue number from the worktree branch (git toplevel basename's
# leading <N>) and calls its sibling dispatch-apply-office-hours via SCRIPT_DIR.
# Running the REAL $MARK_DEVIATION from this 2541-... worktree would resolve
# N=2541 and mutate live GitHub. To exercise the park WITHOUT any live mutation,
# the park-reaching tests run a COPY of the script from a throwaway git repo
# whose toplevel basename supplies a synthetic N, with a STUB
# dispatch-apply-office-hours sitting ALONGSIDE the copy (the script resolves it
# via SCRIPT_DIR = the copy's dir, never via PATH) that only logs its args. The
# stub's arg log lets the tests assert the in-session park is attempted with the
# resolved N and reason. Running the copy is what makes the park hit the stub;
# the cd into the repo additionally keeps N synthetic.
md_park_setup() {
  # $1 = synthetic issue number for the repo basename
  MD_SANDBOX=$(mktemp -d)
  MD_REPO="$MD_SANDBOX/${1}-mark-deviation-test"
  mkdir -p "$MD_REPO"
  git -C "$MD_REPO" init -q
  cp "$MARK_DEVIATION" "$MD_REPO/dispatch-mark-deviation"
  chmod +x "$MD_REPO/dispatch-mark-deviation"
  MD_APPLY_LOG="$MD_REPO/apply-office-hours.log"
  # Stub sibling: log args to a file next to itself, no network.
  cat > "$MD_REPO/dispatch-apply-office-hours" <<'STUB'
#!/usr/bin/env bash
d="$(cd "$(dirname "$0")" && pwd)"
printf '%s\n' "$*" > "$d/apply-office-hours.log"
exit 0
STUB
  chmod +x "$MD_REPO/dispatch-apply-office-hours"
}
md_park_teardown() {
  rm -rf "$MD_SANDBOX"
  MD_SANDBOX=""
  MD_REPO=""
  MD_APPLY_LOG=""
}

# ----- mark-complete: writes exact marker contents -----
mc_dir=$(mktemp -d)
if CLAUDE_JOB_DIR="$mc_dir" "$MARK_COMPLETE" --phase implement --pr 42; then mc_ec=0; else mc_ec=$?; fi
assert_eq "mark-complete: exit 0 on happy path" "0" "$mc_ec"
assert_eq "mark-complete: writes exact phase-completed contents" \
  "$(printf 'phase=implement\npr=42\n')" "$(cat "$mc_dir/phase-completed")"
rm -rf "$mc_dir"

# ----- mark-complete: --phase plan accepted, writes exact marker -----
mc_dir=$(mktemp -d)
if CLAUDE_JOB_DIR="$mc_dir" "$MARK_COMPLETE" --phase plan --pr 42; then mc_ec=0; else mc_ec=$?; fi
assert_eq "mark-complete: --phase plan accepted (exit 0)" "0" "$mc_ec"
assert_eq "mark-complete: plan writes exact phase-completed contents" \
  "$(printf 'phase=plan\npr=42\n')" "$(cat "$mc_dir/phase-completed")"
rm -rf "$mc_dir"

# ----- mark-complete: --phase plan with NO --pr → exit 0, pr-less marker -----
# The plan phase completes on a no-PR issue, so --pr is optional for plan and the
# marker carries only the phase= line (dispatch-stop.sh greps only ^phase=).
mc_dir=$(mktemp -d)
if CLAUDE_JOB_DIR="$mc_dir" "$MARK_COMPLETE" --phase plan; then mc_ec=0; else mc_ec=$?; fi
assert_eq "mark-complete: --phase plan no --pr (exit 0)" "0" "$mc_ec"
assert_eq "mark-complete: plan no --pr writes pr-less marker" \
  "$(printf 'phase=plan\n')" "$(cat "$mc_dir/phase-completed")"
rm -rf "$mc_dir"

# ----- mark-complete: unknown phase → exit 2, no file -----
mc_dir=$(mktemp -d)
if CLAUDE_JOB_DIR="$mc_dir" "$MARK_COMPLETE" --phase bogus --pr 7 2>/dev/null; then mc_ec=0; else mc_ec=$?; fi
assert_eq "mark-complete: unknown phase exit 2" "2" "$mc_ec"
assert_eq "mark-complete: unknown phase writes no file" "0" \
  "$([ -f "$mc_dir/phase-completed" ] && echo 1 || echo 0)"
rm -rf "$mc_dir"

# ----- mark-complete: missing --pr → exit 2 -----
mc_dir=$(mktemp -d)
if CLAUDE_JOB_DIR="$mc_dir" "$MARK_COMPLETE" --phase qa 2>/dev/null; then mc_ec=0; else mc_ec=$?; fi
assert_eq "mark-complete: missing --pr exit 2" "2" "$mc_ec"
rm -rf "$mc_dir"

# ----- mark-complete: missing flag value → exit 2 -----
mc_dir=$(mktemp -d)
if CLAUDE_JOB_DIR="$mc_dir" "$MARK_COMPLETE" --phase qa --pr 2>/dev/null; then mc_ec=0; else mc_ec=$?; fi
assert_eq "mark-complete: missing flag value exit 2" "2" "$mc_ec"
rm -rf "$mc_dir"

# ----- mark-complete: CLAUDE_JOB_DIR unset → exit 0, no file, stderr diagnostic -----
mc_err=$( (unset CLAUDE_JOB_DIR; "$MARK_COMPLETE" --phase implement --pr 42) 2>&1 1>/dev/null ) && mc_ec=0 || mc_ec=$?
assert_eq "mark-complete: unset CLAUDE_JOB_DIR exit 0" "0" "$mc_ec"
assert_eq "mark-complete: unset CLAUDE_JOB_DIR emits diagnostic" "1" \
  "$([ -n "$mc_err" ] && echo 1 || echo 0)"

# ----- mark-deviation: writes exact one-line reason + attempts in-session park -----
# Runs the COPY from a synthetic-N git repo with a stub apply sibling (see
# md_park_setup) so the park hits the stub, never live GitHub.
md_park_setup 90001
md_dir=$(mktemp -d)
if ( cd "$MD_REPO" && CLAUDE_JOB_DIR="$md_dir" ./dispatch-mark-deviation "some reason text" ); then md_ec=0; else md_ec=$?; fi
assert_eq "mark-deviation: exit 0 on happy path" "0" "$md_ec"
assert_eq "mark-deviation: writes exact office-hours-reason contents" \
  "$(printf 'some reason text\n')" "$(cat "$md_dir/office-hours-reason")"
assert_eq "mark-deviation: in-session park attempted with resolved N + reason" \
  "90001 some reason text" "$(cat "$MD_APPLY_LOG" 2>/dev/null)"
rm -rf "$md_dir"
md_park_teardown

# ----- mark-deviation: no arg → exit 2 -----
md_dir=$(mktemp -d)
if CLAUDE_JOB_DIR="$md_dir" "$MARK_DEVIATION" 2>/dev/null; then md_ec=0; else md_ec=$?; fi
assert_eq "mark-deviation: no arg exit 2" "2" "$md_ec"
rm -rf "$md_dir"

# ----- mark-deviation: empty-string arg → exit 2 -----
md_dir=$(mktemp -d)
if CLAUDE_JOB_DIR="$md_dir" "$MARK_DEVIATION" "" 2>/dev/null; then md_ec=0; else md_ec=$?; fi
assert_eq "mark-deviation: empty arg exit 2" "2" "$md_ec"
rm -rf "$md_dir"

# ----- mark-deviation: CLAUDE_JOB_DIR unset → exit 0, no marker, stderr diagnostic, park still attempted -----
# The in-session park precedes the job-dir guard, so it still fires even with
# CLAUDE_JOB_DIR unset (only the marker write is skipped). Runs the COPY so the
# park hits the stub, not live GitHub.
md_park_setup 90002
md_err=$( ( cd "$MD_REPO" && unset CLAUDE_JOB_DIR; ./dispatch-mark-deviation "x" ) 2>&1 1>/dev/null ) && md_ec=0 || md_ec=$?
assert_eq "mark-deviation: unset CLAUDE_JOB_DIR exit 0" "0" "$md_ec"
assert_eq "mark-deviation: unset CLAUDE_JOB_DIR emits diagnostic" "1" \
  "$( [[ -n "$md_err" ]] && echo 1 || echo 0 )"
assert_eq "mark-deviation: unset CLAUDE_JOB_DIR still attempts in-session park" \
  "90002 x" "$(cat "$MD_APPLY_LOG" 2>/dev/null)"
md_park_teardown

# ----- mark-deviation: extra arg → exit 2 -----
md_dir=$(mktemp -d)
if CLAUDE_JOB_DIR="$md_dir" "$MARK_DEVIATION" "reason1" "reason2" 2>/dev/null; then md_ec=0; else md_ec=$?; fi
assert_eq "mark-deviation: extra arg exit 2" "2" "$md_ec"
rm -rf "$md_dir"

# ----- mark-complete: missing --phase only (--pr present) → exit 2 -----
mc_dir=$(mktemp -d)
if CLAUDE_JOB_DIR="$mc_dir" "$MARK_COMPLETE" --pr 42 2>/dev/null; then mc_ec=0; else mc_ec=$?; fi
assert_eq "mark-complete: missing --phase exit 2" "2" "$mc_ec"
rm -rf "$mc_dir"

# ----- mark-complete: non-numeric --pr → exit 2, no file -----
mc_dir=$(mktemp -d)
if CLAUDE_JOB_DIR="$mc_dir" "$MARK_COMPLETE" --phase qa --pr bogus 2>/dev/null; then mc_ec=0; else mc_ec=$?; fi
assert_eq "mark-complete: non-numeric --pr exit 2" "2" "$mc_ec"
assert_eq "mark-complete: non-numeric --pr writes no file" "0" \
  "$(ls "$mc_dir" | wc -l | tr -d ' ')"
rm -rf "$mc_dir"

# ----- mark-complete: CLAUDE_JOB_DIR set to a file (not a dir) → exit 0, no write -----
mc_file=$(mktemp)
if CLAUDE_JOB_DIR="$mc_file" "$MARK_COMPLETE" --phase implement --pr 42 2>/dev/null; then mc_ec=0; else mc_ec=$?; fi
assert_eq "mark-complete: CLAUDE_JOB_DIR is a file exit 0" "0" "$mc_ec"
rm -f "$mc_file"

# ----- mark-deviation: CLAUDE_JOB_DIR set to a file (not a dir) → exit 0, no marker write, park still attempted -----
# Runs the COPY so the park hits the stub, not live GitHub.
md_park_setup 90003
md_file=$(mktemp)
if ( cd "$MD_REPO" && CLAUDE_JOB_DIR="$md_file" ./dispatch-mark-deviation "reason" 2>/dev/null ); then md_ec=0; else md_ec=$?; fi
assert_eq "mark-deviation: CLAUDE_JOB_DIR is a file exit 0" "0" "$md_ec"
assert_eq "mark-deviation: CLAUDE_JOB_DIR is a file still attempts in-session park" \
  "90003 reason" "$(cat "$MD_APPLY_LOG" 2>/dev/null)"
rm -f "$md_file"
md_park_teardown

# <<< END MOVED <<<

report_results
