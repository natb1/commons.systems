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

# ---- Case 9: explicit worktree-path keeps the guard live from a cwd that --
# IS the primary checkout — the regression this unit exists to prevent. If
# CUR were derived from cwd here it would equal PRIMARY and the guard would
# SKIP; passing WORKTREE_PATH explicitly must make it detect contamination
# instead.

run_worktree_path_guard() {
  local primary="$1" worktree_path="$2" subcmd="$3" label="$4"
  (
    cd "$primary"
    CLAUDE_CODE_SESSION_ID="test-session" DISPATCH_GRAPH_MAIN_WORKTREE="$primary" TMPDIR="$GUARD_TMPDIR" \
      "$GUARD" "$subcmd" "$label" "$worktree_path"
  )
}

STDOUT9B="$WORK/stdout-9-baseline"
STDERR9B="$WORK/stderr-9-baseline"
set +e
run_worktree_path_guard "$PRIMARY" "$CUR" baseline wtpath9 >"$STDOUT9B" 2>"$STDERR9B"
STATUS9B=$?
set -e
assert_eq "case9 baseline: exits 0" "0" "$STATUS9B"

echo "contamination" >"$PRIMARY/leaked-wtpath9.txt"

STDOUT9C="$WORK/stdout-9-check"
STDERR9C="$WORK/stderr-9-check"
set +e
run_worktree_path_guard "$PRIMARY" "$CUR" check wtpath9 >"$STDOUT9C" 2>"$STDERR9C"
STATUS9C=$?
set -e
assert_eq "case9 check: exits 1 — explicit worktree-path keeps the guard live (no false SKIP) even though cwd IS the primary checkout" "1" "$STATUS9C"
STDERR9_CONTENT="$(cat "$STDERR9C")"
assert_contains "case9 stderr: names INVARIANT VIOLATED" "INVARIANT VIOLATED" "$STDERR9_CONTENT"
assert_contains "case9 stderr: names the leaked file" "leaked-wtpath9.txt" "$STDERR9_CONTENT"
assert_contains "case9 stderr: includes Repair guidance" "Repair:" "$STDERR9_CONTENT"

rm -f "$PRIMARY/leaked-wtpath9.txt"

# ---- Case 10: worktree-path passed to baseline but omitted at check -------
# The SNAP filename is keyed on the resolved CUR, so mismatched (baseline
# with the arg, check without it) must miss the baseline entirely and exit 2
# — pass it to both or not at all.

run_worktree_path_guard "$PRIMARY" "$CUR" baseline mismatch10 >/dev/null 2>&1

# Check omits worktree-path and runs from cwd=$PRIMARY, so it derives CUR as
# $PRIMARY (via plain `git rev-parse --show-toplevel`) instead of $CUR — a
# different SNAP key than baseline's, so it must miss the baseline.
STDERR10C="$WORK/stderr-10-check"
set +e
(
  cd "$PRIMARY"
  CLAUDE_CODE_SESSION_ID="test-session" DISPATCH_GRAPH_MAIN_WORKTREE="$PRIMARY" TMPDIR="$GUARD_TMPDIR" \
    "$GUARD" check mismatch10 >/dev/null 2>"$STDERR10C"
)
STATUS10C=$?
set -e
assert_eq "case10 check: exits 2 — worktree-path must be passed to BOTH baseline and check" "2" "$STATUS10C"

# ---- Case 11: nonexistent explicit worktree-path -> usage-shaped exit 2 ---

STDERR11="$WORK/stderr-11"
set +e
run_worktree_path_guard "$PRIMARY" "$WORK/does-not-exist" baseline nonexist11 >/dev/null 2>"$STDERR11"
STATUS11=$?
set -e
assert_eq "case11 baseline: exits 2 on nonexistent worktree-path" "2" "$STATUS11"
assert_contains "case11 stderr: usage-shaped error" "Usage:" "$(cat "$STDERR11")"

# ---- Case 12: explicit path INSIDE the primary checkout -> exit 2 ----------
# A leftover plain directory where a worktree used to be (a reaped or
# partially-removed worktree) still passes the caller's `-d` precondition, but
# `rev-parse --show-toplevel` resolves it to the primary checkout itself. That
# must be a hard error, not the vacuous SKIP the explicit argument exists to
# prevent (red-team-3): a SKIP would silently disable the guard for the whole
# run while both subcommands report success.

LEFTOVER="$PRIMARY/.claude/worktrees/leftover-node"
mkdir -p "$LEFTOVER"

STDERR12B="$WORK/stderr-12-baseline"
set +e
run_worktree_path_guard "$PRIMARY" "$LEFTOVER" baseline leftover12 >/dev/null 2>"$STDERR12B"
STATUS12B=$?
set -e
assert_eq "case12 baseline: exits 2 — explicit path resolves to the primary checkout" "2" "$STATUS12B"
STDERR12B_CONTENT="$(cat "$STDERR12B")"
assert_contains "case12 stderr: names the primary checkout" "primary checkout" "$STDERR12B_CONTENT"
assert_contains "case12 stderr: names the offending path" "leftover-node" "$STDERR12B_CONTENT"

STDERR12C="$WORK/stderr-12-check"
set +e
run_worktree_path_guard "$PRIMARY" "$LEFTOVER" check leftover12 >/dev/null 2>"$STDERR12C"
STATUS12C=$?
set -e
assert_eq "case12 check: exits 2 too — never a silent clean pass" "2" "$STATUS12C"
assert_contains "case12 check stderr: names the primary checkout" "primary checkout" "$(cat "$STDERR12C")"

rm -rf "$PRIMARY/.claude"

# ---- Case 13: explicit path inside a NON-primary worktree -> exit 2 --------
# Same shape, one level over: a directory inside the launching worktree (not
# its root) resolves upward to that worktree. The guard must reject it rather
# than silently guard a tree the caller did not name.

INSIDE_CUR="$CUR/subdir/leftover"
mkdir -p "$INSIDE_CUR"

STDERR13="$WORK/stderr-13"
set +e
run_worktree_path_guard "$PRIMARY" "$INSIDE_CUR" baseline inside13 >/dev/null 2>"$STDERR13"
STATUS13=$?
set -e
assert_eq "case13 baseline: exits 2 — path is not a worktree root" "2" "$STATUS13"
assert_contains "case13 stderr: says not the root of a registered worktree" \
  "not the root of a registered git worktree" "$(cat "$STDERR13")"

rm -rf "$CUR/subdir"

report_results
