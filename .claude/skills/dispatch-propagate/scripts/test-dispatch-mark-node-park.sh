#!/usr/bin/env bash
# Tests for dispatch-mark-node-park (tactic-qa-main-verifiability-sort-criterion,
# unit 1) — the node-lane office-hours park marker writer that rejects any
# park reason whose operative claim is browser-reachability.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

echo ""
echo "=== dispatch-mark-node-park (tactic-qa-main-verifiability-sort-criterion) ==="

MARK_NODE_PARK="$SCRIPT_DIR/dispatch-mark-node-park"

# ----- happy path: exit 0, exact marker byte contents, no office-hours-pr -----
d=$(mktemp -d)
if CLAUDE_JOB_DIR="$d" "$MARK_NODE_PARK" "auth wall prevented observing the expected banner" "re-run once auth is fixed"; then ec=0; else ec=$?; fi
assert_eq "happy path: exit 0" "0" "$ec"
assert_eq "happy path: office-hours-reason exact bytes" \
  "$(printf 'auth wall prevented observing the expected banner\n')" "$(cat "$d/office-hours-reason")"
assert_eq "happy path: office-hours-recommendation exact bytes" \
  "$(printf 're-run once auth is fixed\n')" "$(cat "$d/office-hours-recommendation")"
assert_eq "happy path: no office-hours-pr file without --pr" "0" \
  "$([ -f "$d/office-hours-pr" ] && echo 1 || echo 0)"
rm -rf "$d"

# ----- --pr 42: office-hours-pr contains "42\n" -----
d=$(mktemp -d)
if CLAUDE_JOB_DIR="$d" "$MARK_NODE_PARK" --pr 42 "auth wall prevented observing the expected banner" "re-run once auth is fixed"; then ec=0; else ec=$?; fi
assert_eq "--pr 42: exit 0" "0" "$ec"
assert_eq "--pr 42: office-hours-pr exact bytes" "$(printf '42\n')" "$(cat "$d/office-hours-pr")"
rm -rf "$d"

# ----- --pr abc: exit 2 -----
d=$(mktemp -d)
if CLAUDE_JOB_DIR="$d" "$MARK_NODE_PARK" --pr abc "auth wall prevented observing the expected banner" "re-run once auth is fixed" 2>/dev/null; then ec=0; else ec=$?; fi
assert_eq "--pr abc: exit 2" "2" "$ec"
rm -rf "$d"

# ----- missing arg: exit 2, no files -----
d=$(mktemp -d)
if CLAUDE_JOB_DIR="$d" "$MARK_NODE_PARK" "only one reason" 2>/dev/null; then ec=0; else ec=$?; fi
assert_eq "missing recommendation arg: exit 2" "2" "$ec"
assert_eq "missing recommendation arg: no files written" "0" \
  "$([ -f "$d/office-hours-reason" ] && echo 1 || echo 0)"
rm -rf "$d"

# ----- zero args: exit 2 -----
d=$(mktemp -d)
if CLAUDE_JOB_DIR="$d" "$MARK_NODE_PARK" 2>/dev/null; then ec=0; else ec=$?; fi
assert_eq "zero args: exit 2" "2" "$ec"
rm -rf "$d"

# ----- empty reason: exit 2 -----
d=$(mktemp -d)
if CLAUDE_JOB_DIR="$d" "$MARK_NODE_PARK" "" "recommendation" 2>/dev/null; then ec=0; else ec=$?; fi
assert_eq "empty reason: exit 2" "2" "$ec"
rm -rf "$d"

# ----- empty recommendation: exit 2 -----
d=$(mktemp -d)
if CLAUDE_JOB_DIR="$d" "$MARK_NODE_PARK" "reason" "" 2>/dev/null; then ec=0; else ec=$?; fi
assert_eq "empty recommendation: exit 2" "2" "$ec"
rm -rf "$d"

# ----- extra positional arg: exit 2, no files -----
d=$(mktemp -d)
if CLAUDE_JOB_DIR="$d" "$MARK_NODE_PARK" "reason" "recommendation" "extra" 2>/dev/null; then ec=0; else ec=$?; fi
assert_eq "extra arg: exit 2" "2" "$ec"
assert_eq "extra arg: no files written" "0" \
  "$([ -f "$d/office-hours-reason" ] && echo 1 || echo 0)"
rm -rf "$d"

# ----- rejection cases: one per browser-reachability pattern -----
assert_rejected() {
  local label="$1" reason="$2"
  local d ec err
  d=$(mktemp -d)
  err=$( (CLAUDE_JOB_DIR="$d" "$MARK_NODE_PARK" "$reason" "recommendation") 2>&1 1>/dev/null ) && ec=0 || ec=$?
  assert_eq "$label: exit 3" "3" "$ec"
  assert_contains_local "$label: stderr mentions author-required predicate" "cannot be machine-checked AT ALL" "$err"
  assert_eq "$label: no office-hours-reason written" "0" \
    "$([ -f "$d/office-hours-reason" ] && echo 1 || echo 0)"
  assert_eq "$label: no office-hours-recommendation written" "0" \
    "$([ -f "$d/office-hours-recommendation" ] && echo 1 || echo 0)"
  rm -rf "$d"
}

assert_rejected "pattern: browser-verifiab" \
  "not browser-verifiable: url_path is the placeholder 'current'"
assert_rejected "pattern: no url_path" \
  "item has no url_path so it cannot be checked"
assert_rejected "pattern: url_path placeholder" \
  "url_path is the placeholder 'current' and cannot be observed"
assert_rejected "pattern: url_path repo script" \
  "url_path names a repo script, not a web page"
assert_rejected "pattern: claude-in-chrome cannot" \
  "Claude-in-Chrome cannot reach this journal check"

# ----- negative controls: must be ACCEPTED -----
assert_accepted() {
  local label="$1" reason="$2"
  local d ec
  d=$(mktemp -d)
  if CLAUDE_JOB_DIR="$d" "$MARK_NODE_PARK" "$reason" "recommendation" 2>/dev/null; then ec=0; else ec=$?; fi
  assert_eq "$label: exit 0" "0" "$ec"
  assert_eq "$label: office-hours-reason written" "1" \
    "$([ -f "$d/office-hours-reason" ] && echo 1 || echo 0)"
  rm -rf "$d"
}

assert_accepted "negative control: auth wall" \
  "auth wall on https://commons.systems/x prevented observing the expected banner"
assert_accepted "negative control: deploy lag" \
  "expected X absent but originating PR #123 not yet confirmed deployed (deploy lag)"
assert_accepted "negative control: product intent" \
  "needs the author's product intent on whether the default should be opt-in"

# ----- interactive run (CLAUDE_JOB_DIR unset), rejected reason: still exit 3 -----
d=$(mktemp -d)
err=$( (unset CLAUDE_JOB_DIR; "$MARK_NODE_PARK" "not browser-verifiable: no way to check" "recommendation") 2>&1 1>/dev/null ) && ec=0 || ec=$?
assert_eq "interactive + rejected reason: exit 3 (validation precedes guard)" "3" "$ec"
assert_eq "interactive + rejected reason: no files written" "0" \
  "$([ -f "$d/office-hours-reason" ] && echo 1 || echo 0)"
rm -rf "$d"

# ----- interactive run (CLAUDE_JOB_DIR unset), good reason: exit 0, no write, stderr note -----
err=$( (unset CLAUDE_JOB_DIR; "$MARK_NODE_PARK" "auth wall prevented observing the expected banner" "recommendation") 2>&1 1>/dev/null ) && ec=0 || ec=$?
assert_eq "interactive + accepted reason: exit 0" "0" "$ec"
assert_contains_local "interactive + accepted reason: stderr notes interactive run" "interactive run" "$err"

report_results
