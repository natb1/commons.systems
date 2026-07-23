#!/usr/bin/env bash
# test-subagent-contamination-guard.sh — tests for subagent-contamination-guard
# (a standalone executable, not a sourceable lib). Exercises it as a
# subprocess across the five acceptance-criteria cases: SKIP (primary ==
# launching worktree), clean, contamination detected, pre-existing dirt
# tolerated, and missing-baseline.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

GUARD="$SCRIPT_DIR/subagent-contamination-guard"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# "Launching worktree" cwd the guard is invoked from — its git toplevel is CUR.
CUR="$WORK/cur"
git init --quiet "$CUR"
git -C "$CUR" -c user.email=test@test -c user.name=test commit --quiet --allow-empty -m "init"

# Fake "primary checkout" the guard snapshots via DISPATCH_GRAPH_MAIN_WORKTREE.
PRIMARY="$WORK/primary"
git init --quiet "$PRIMARY"
git -C "$PRIMARY" -c user.email=test@test -c user.name=test commit --quiet --allow-empty -m "init"

# Guard's own temp dir for snapshot files — kept separate from the real
# $TMPDIR so this run's snapshots don't collide with anything else.
GUARD_TMPDIR="$WORK/tmp"
mkdir -p "$GUARD_TMPDIR"

run_guard() {
  local primary="$1" subcmd="$2" label="$3" session="${4:-test-session}"
  (
    cd "$CUR"
    CLAUDE_CODE_SESSION_ID="$session" DISPATCH_GRAPH_MAIN_WORKTREE="$primary" TMPDIR="$GUARD_TMPDIR" "$GUARD" "$subcmd" "$label"
  )
}

# ---- Case 1: SKIP — primary checkout IS the launching worktree ------------

STDOUT1B="$WORK/stdout-1-baseline"
STDERR1B="$WORK/stderr-1-baseline"
set +e
run_guard "$CUR" baseline skip1 >"$STDOUT1B" 2>"$STDERR1B"
STATUS1B=$?
set -e
assert_eq "case1 baseline: exits 0" "0" "$STATUS1B"
assert_eq "case1 baseline: no stdout" "" "$(cat "$STDOUT1B")"
assert_eq "case1 baseline: no stderr" "" "$(cat "$STDERR1B")"

STDOUT1C="$WORK/stdout-1-check"
STDERR1C="$WORK/stderr-1-check"
set +e
run_guard "$CUR" check skip1 >"$STDOUT1C" 2>"$STDERR1C"
STATUS1C=$?
set -e
assert_eq "case1 check: exits 0 (SKIP)" "0" "$STATUS1C"
assert_eq "case1 check: no stdout" "" "$(cat "$STDOUT1C")"
assert_eq "case1 check: no stderr" "" "$(cat "$STDERR1C")"

# ---- Case 2: Clean — no dirty files at baseline or check time -------------

STDOUT2B="$WORK/stdout-2-baseline"
STDERR2B="$WORK/stderr-2-baseline"
set +e
run_guard "$PRIMARY" baseline clean2 >"$STDOUT2B" 2>"$STDERR2B"
STATUS2B=$?
set -e
assert_eq "case2 baseline: exits 0" "0" "$STATUS2B"

STDOUT2C="$WORK/stdout-2-check"
STDERR2C="$WORK/stderr-2-check"
set +e
run_guard "$PRIMARY" check clean2 >"$STDOUT2C" 2>"$STDERR2C"
STATUS2C=$?
set -e
assert_eq "case2 check: exits 0 on clean primary checkout" "0" "$STATUS2C"
assert_eq "case2 check: no stderr" "" "$(cat "$STDERR2C")"

# ---- Case 3: Contamination — new dirty file appears after baseline --------

STDOUT3B="$WORK/stdout-3-baseline"
STDERR3B="$WORK/stderr-3-baseline"
set +e
run_guard "$PRIMARY" baseline contam3 >"$STDOUT3B" 2>"$STDERR3B"
STATUS3B=$?
set -e
assert_eq "case3 baseline: exits 0" "0" "$STATUS3B"

echo "contamination" >"$PRIMARY/leaked-file.txt"

STDOUT3C="$WORK/stdout-3-check"
STDERR3C="$WORK/stderr-3-check"
set +e
run_guard "$PRIMARY" check contam3 >"$STDOUT3C" 2>"$STDERR3C"
STATUS3C=$?
set -e
assert_eq "case3 check: exits 1 when contamination detected" "1" "$STATUS3C"
STDERR3_CONTENT="$(cat "$STDERR3C")"
assert_contains "case3 stderr: names INVARIANT VIOLATED" "INVARIANT VIOLATED" "$STDERR3_CONTENT"
assert_contains "case3 stderr: names the leaked file" "leaked-file.txt" "$STDERR3_CONTENT"
assert_contains "case3 stderr: includes Repair guidance" "Repair:" "$STDERR3_CONTENT"

rm -f "$PRIMARY/leaked-file.txt"

# ---- Case 4: Pre-existing dirt tolerated (no false positive) --------------

echo "pre-existing" >"$PRIMARY/already-dirty.txt"

STDOUT4B="$WORK/stdout-4-baseline"
STDERR4B="$WORK/stderr-4-baseline"
set +e
run_guard "$PRIMARY" baseline preexist4 >"$STDOUT4B" 2>"$STDERR4B"
STATUS4B=$?
set -e
assert_eq "case4 baseline: exits 0" "0" "$STATUS4B"

STDOUT4C="$WORK/stdout-4-check"
STDERR4C="$WORK/stderr-4-check"
set +e
run_guard "$PRIMARY" check preexist4 >"$STDOUT4C" 2>"$STDERR4C"
STATUS4C=$?
set -e
assert_eq "case4 check: exits 0 — pre-existing dirt is not new contamination" "0" "$STATUS4C"
assert_eq "case4 check: no stderr" "" "$(cat "$STDERR4C")"

rm -f "$PRIMARY/already-dirty.txt"

# ---- Case 5: Missing baseline — check without a prior baseline call -------

STDOUT5C="$WORK/stdout-5-check"
STDERR5C="$WORK/stderr-5-check"
set +e
run_guard "$PRIMARY" check never-baselined5 >"$STDOUT5C" 2>"$STDERR5C"
STATUS5C=$?
set -e
assert_eq "case5 check: exits 2 when baseline never ran" "2" "$STATUS5C"

# ---- Case 6: check consumes the baseline (deleted after read) -------------
# After a successful check, a SECOND check for the same label — with no
# intervening baseline — must exit 2. This proves the snapshot is removed once
# read, so a leftover cannot later be mistaken for a skipped run's baseline
# (red-team-1).

run_guard "$PRIMARY" baseline consume6 >/dev/null 2>&1
set +e
run_guard "$PRIMARY" check consume6 >/dev/null 2>&1
STATUS6C1=$?
run_guard "$PRIMARY" check consume6 >/dev/null 2>&1
STATUS6C2=$?
set -e
assert_eq "case6 first check: exits 0 on clean primary checkout" "0" "$STATUS6C1"
assert_eq "case6 second check: exits 2 — baseline was consumed, not stale-reused" "2" "$STATUS6C2"

# ---- Case 7: baseline/check pair is session-scoped ------------------------
# A baseline written under one session must not satisfy a check running under a
# DIFFERENT session — otherwise a leftover snapshot from another session could
# mask a run whose own baseline was skipped (red-team-1).

run_guard "$PRIMARY" baseline crosssession7 "session-A" >/dev/null 2>&1
set +e
run_guard "$PRIMARY" check crosssession7 "session-B" >/dev/null 2>&1
STATUS7C=$?
set -e
assert_eq "case7 check: exits 2 — a different session's baseline does not count" "2" "$STATUS7C"

# ---- Case 8: missing CLAUDE_CODE_SESSION_ID fails loud --------------------
# Without a session id the snapshot filename cannot be scoped to this run, so
# the guard must refuse rather than degrade to a collidable filename.

STDERR8="$WORK/stderr-8"
set +e
(
  cd "$CUR"
  CLAUDE_CODE_SESSION_ID="" DISPATCH_GRAPH_MAIN_WORKTREE="$PRIMARY" TMPDIR="$GUARD_TMPDIR" \
    "$GUARD" baseline nosession8 2>"$STDERR8"
)
STATUS8=$?
set -e
assert_eq "case8 baseline: exits 2 when CLAUDE_CODE_SESSION_ID is unset" "2" "$STATUS8"
assert_contains "case8 stderr: names CLAUDE_CODE_SESSION_ID" "CLAUDE_CODE_SESSION_ID" "$(cat "$STDERR8")"

report_results
