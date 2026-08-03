#!/usr/bin/env bash
# test-lib-stale-hold-recheck.sh — functional harness for
# lib-stale-hold-recheck.sh's `stale_hold_recheck_sweep`.
#
# Fixture idiom copied from test-resolve-hold.sh:44-110 — a throwaway scratch
# repo under `mktemp -d` carrying the REAL packages/intentionsutil/src (plus its
# package.json for ESM resolution) and a `node_modules` SYMLINK to this repo's
# own, so the REAL enumerator (list-recheckable-holds.ts) executes under tsx
# against real node files. Real linked worktrees come from `git worktree add`
# (test-lib-worktree-residue.sh's idiom), so the residue predicate inspects real
# git state.
#
# Exactly two things are stubbed:
#   - `resolve-hold` (via DISPATCH_HOLD_RECHECK_RESOLVE) — a logging stub that
#     appends its argv to a log and exits with a configurable code. The real one
#     fetches, writes, and pushes through graph-commit's landing lock; what this
#     harness must observe is WHETHER and WITH WHAT it was invoked.
#   - the enumerator (via DISPATCH_HOLD_RECHECK_ENUM) — in case 9 ONLY, to
#     reproduce an enumeration failure. Every other case runs the real one.
#
# The session registry is driven by DISPATCH_AGENTS_SNAPSHOT_ALL (the registered
# -view snapshot lib-claude-agents.sh honors), and the reservation ledger by
# DISPATCH_RESERVATION_DIR — so no Claude daemon and no shared ledger is touched.
#
# Cases:
#   1.  open worktree-residue hold + clean worktree -> stub invoked exactly once
#       with `<source-id> --kind worktree-residue`; resolved=1
#   2.  worktree directory absent entirely           -> resolved (absent is NOT
#       residue)
#   3.  dirty tracked tree      -> observing-residue (dirty-tracked-tree), stub
#       never invoked
#   4.  wrong branch + detached HEAD -> both observing-residue, stub never
#       invoked
#   5.  a live session under the source's worktree name -> observing-claimed
#   6.  a reservation marker for the source            -> observing-claimed
#   7.  an edge-residue candidate whose worktree is DIRTY -> still resolved
#       (no predicate applies to an already-terminal hold)
#   8.  an open provision-conflict hold -> skip-manual-policy, manual=1
#   9.  enumerator exits 2 -> status=enumeration-failed, candidates=0, nothing
#       invoked, return 0 — and the summary is textually DISTINGUISHABLE from
#       case 10's
#   10. no holds at all (real enumerator, empty store) -> candidates=0 status=ok
#   11. one candidate whose resolve exits 1 + one whose resolve exits 0 ->
#       failed=1 resolved=1, both processed, return 0
#   12. four resolvable candidates with DISPATCH_HOLD_RECHECK_MAX=2 ->
#       resolved=2 deferred=2
#   13. unresolvable repo root -> status=repo-unresolvable, return 0
#   14. EVERY case: return value 0 and EXACTLY ONE `sweep complete` line
#       (asserted by run_sweep, which every case goes through)
#
# No network needed; requires bash + git + jq + a real node with tsx resolvable
# through a read-only node_modules symlink to this repo's own.
set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REAL_REPO_ROOT="$(cd "$HARNESS_DIR/../../../.." && pwd -P)"
UTIL_SCRIPTS_SRC="$REAL_REPO_ROOT/packages/intentionsutil/scripts"
INTENTIONSUTIL_SRC="$REAL_REPO_ROOT/packages/intentionsutil/src"

# shellcheck source=test-helpers.sh
source "$HARNESS_DIR/test-helpers.sh"

command -v jq >/dev/null || { echo "error: jq not found" >&2; exit 1; }
[[ -f "$UTIL_SCRIPTS_SRC/list-recheckable-holds.ts" ]] || {
  echo "error: list-recheckable-holds.ts not found at $UTIL_SCRIPTS_SRC" >&2; exit 1; }

echo "=== lib-stale-hold-recheck.sh ==="

WORK="$(mktemp -d)" || { echo "error: mktemp failed" >&2; exit 1; }
trap 'rm -rf "$WORK"' EXIT

# --- Stubs -------------------------------------------------------------------

RESOLVE_STUB="$WORK/resolve-hold-stub"
cat >"$RESOLVE_STUB" <<'SH'
#!/usr/bin/env bash
# Logging stand-in for packages/intentionsutil/scripts/resolve-hold: record the
# full argv, then exit 1 for any source id named in RESOLVE_FAIL_IDS (a
# space-separated list) and 0 otherwise.
printf '%s\n' "$*" >>"$RESOLVE_LOG"
for bad in ${RESOLVE_FAIL_IDS:-}; do
  if [[ "${1:-}" == "$bad" ]]; then
    echo "resolve-hold stub: failing for $1" >&2
    exit 1
  fi
done
exit 0
SH
chmod +x "$RESOLVE_STUB"

ENUM_FAIL_STUB="$WORK/enum-fail-stub"
cat >"$ENUM_FAIL_STUB" <<'SH'
#!/usr/bin/env bash
echo "enumerator stub: malformed store" >&2
exit 2
SH
chmod +x "$ENUM_FAIL_STUB"

# --- Shared environment ------------------------------------------------------
# Every knob the library and the libraries it sources read is pinned at a
# scratch path, so no real ledger, decision log, or Claude daemon is touched.
export RESOLVE_LOG="$WORK/resolve-hold.log"
export RESOLVE_FAIL_IDS=""
export DISPATCH_HOLD_RECHECK_RESOLVE="$RESOLVE_STUB"
export DISPATCH_RESERVATION_DIR="$WORK/reservations"
export DISPATCH_DECISION_LOG_DIR="$WORK/decision-log"
export DISPATCH_AGENTS_SNAPSHOT_ALL="$WORK/agents-all.json"
mkdir -p "$DISPATCH_RESERVATION_DIR" "$DISPATCH_DECISION_LOG_DIR"
printf '[]\n' >"$DISPATCH_AGENTS_SNAPSHOT_ALL"

# shellcheck source=lib-stale-hold-recheck.sh
source "$HARNESS_DIR/lib-stale-hold-recheck.sh"

# --- Fixtures ----------------------------------------------------------------

# new_repo <name> — a fresh scratch repo able to run the REAL enumerator: the
# real intentionsutil src + package.json, the real enumerator script, and a
# node_modules symlink into this repo's own. Prints the repo path.
new_repo() {
  local repo="$WORK/$1"
  mkdir -p "$repo/intentions" "$repo/packages/intentionsutil/scripts" \
           "$repo/packages/intentionsutil/src" "$repo/.claude/worktrees"
  cp -r "$INTENTIONSUTIL_SRC/." "$repo/packages/intentionsutil/src/"
  cp "$REAL_REPO_ROOT/packages/intentionsutil/package.json" \
     "$repo/packages/intentionsutil/package.json"
  cp "$UTIL_SCRIPTS_SRC/list-recheckable-holds.ts" \
     "$repo/packages/intentionsutil/scripts/list-recheckable-holds.ts"
  ln -s "$REAL_REPO_ROOT/node_modules" "$repo/node_modules"
  git init -q -b main "$repo"
  git -C "$repo" config user.email harness@test
  git -C "$repo" config user.name harness
  echo seed >"$repo/README.md"
  git -C "$repo" add README.md
  git -C "$repo" commit -qm seed
  printf '%s\n' "$repo"
}

# write_source <repo> <source-id> <blocked_by-yaml-list>
write_source() {
  cat >"$1/intentions/$2.md" <<NODE
---
id: $2
kind: tactic
statement: harness source node carrying a tracked hold
owner: ai
status: codified
phase: implement
serves: []
execution: null
blocked_by: $3
---
# harness source node carrying a tracked hold
NODE
}

# write_open_hold <repo> <hold-id> <source-id> <hold-kind> — a born-parked,
# still-open hold: office_hours non-null and phase never set to done.
write_open_hold() {
  cat >"$1/intentions/$2.md" <<NODE
---
id: $2
kind: tactic
statement: 'hold: $4 on \`$3\` — a tracked hold blocking the source'
owner: ai
status: codified
serves: []
office_hours:
  reason: the tracked condition that produced this hold
  since: 2026-07-01
  recommendation: clear the condition, then resolve this hold
attributes:
  hold_for: $3
  hold_kind: $4
---
# hold: $4 on $3
NODE
}

# write_done_hold <repo> <hold-id> <source-id> <hold-kind> — a TERMINAL hold
# (phase done, office_hours null). With the source's blocked_by still naming it,
# the enumerator classes it `edge-residue`.
write_done_hold() {
  cat >"$1/intentions/$2.md" <<NODE
---
id: $2
kind: tactic
statement: 'hold: $4 on \`$3\` — a completed hold whose edge survived'
owner: ai
status: codified
phase: done
serves: []
office_hours: null
attributes:
  hold_for: $3
  hold_kind: $4
---
# hold: $4 on $3
NODE
}

# mk_wt <repo> <node-id> — a REAL linked worktree at
# <repo>/.claude/worktrees/<node-id> on a same-named branch, which is the shape
# worktree_residue_condition's identity assertion requires.
mk_wt() {
  git -C "$1" worktree add -q -b "$2" "$1/.claude/worktrees/$2" main
}

# --- Runner ------------------------------------------------------------------
# run_sweep <label> — run the sweep, capture stderr in ERR and the return value
# in RC, and assert the two universal properties (case 14) for EVERY case:
# return 0, and exactly one `sweep complete` line.
ERR=""; RC=0; SUMMARY=""
run_sweep() {
  local label="$1"
  : >"$RESOLVE_LOG"
  stale_hold_recheck_sweep 2>"$WORK/stderr.log"
  RC=$?
  ERR="$(cat "$WORK/stderr.log")"
  SUMMARY="$(grep -F 'lib-stale-hold-recheck: sweep complete' "$WORK/stderr.log")"
  assert_eq "$label: returns 0" "0" "$RC"
  assert_eq "$label: exactly one sweep-complete line" "1" \
    "$(grep -cF 'lib-stale-hold-recheck: sweep complete' "$WORK/stderr.log")"
}

# run_sweep_in <dir> <label> — same, but from a different cwd (case 13 needs a
# cwd outside any git repo so resolve_main_worktree genuinely fails). The sweep
# is a shell function, so a subshell inherits it; stderr still lands in the log.
run_sweep_in() {
  local dir="$1" label="$2"
  : >"$RESOLVE_LOG"
  ( cd "$dir" && stale_hold_recheck_sweep ) 2>"$WORK/stderr.log"
  RC=$?
  ERR="$(cat "$WORK/stderr.log")"
  SUMMARY="$(grep -F 'lib-stale-hold-recheck: sweep complete' "$WORK/stderr.log")"
  assert_eq "$label: returns 0" "0" "$RC"
  assert_eq "$label: exactly one sweep-complete line" "1" \
    "$(grep -cF 'lib-stale-hold-recheck: sweep complete' "$WORK/stderr.log")"
}

resolve_log_lines() { awk 'END { print NR }' "$RESOLVE_LOG"; }

# Per-case env reset: cases 5/6/9/12 each pin one knob; nothing may leak.
reset_env() {
  printf '[]\n' >"$DISPATCH_AGENTS_SNAPSHOT_ALL"
  rm -f "${DISPATCH_RESERVATION_DIR:?}"/* 2>/dev/null
  unset DISPATCH_HOLD_RECHECK_ENUM
  unset DISPATCH_HOLD_RECHECK_MAX
  export RESOLVE_FAIL_IDS=""
  export DISPATCH_HOLD_RECHECK_RESOLVE="$RESOLVE_STUB"
}

# ============================================================================
# Case 1: an open worktree-residue hold whose worktree is clean -> resolved
# ============================================================================
echo "Case 1: an open worktree-residue hold over a clean worktree resolves"
reset_env
R1="$(new_repo case1)"
write_source "$R1" tactic-src-a "[tactic-hold-residue-src-a]"
write_open_hold "$R1" tactic-hold-residue-src-a tactic-src-a worktree-residue
mk_wt "$R1" tactic-src-a
DISPATCH_HOLD_RECHECK_REPO_ROOT="$R1" run_sweep "case1"

assert_contains "case1: summary reports one resolution" \
  "candidates=1 resolved=1 observing=0 manual=0 unknown=0 failed=0 deferred=0 status=ok" "$SUMMARY"
assert_contains "case1: names the resolved hold" \
  "resolved tactic-hold-residue-src-a (unblocked tactic-src-a)" "$ERR"
assert_eq "case1: resolve-hold invoked exactly once" "1" "$(resolve_log_lines)"
assert_eq "case1: invoked with the source id and the hold's kind" \
  "tactic-src-a --kind worktree-residue" "$(cat "$RESOLVE_LOG")"

# ============================================================================
# Case 2: no worktree directory at all -> `absent` is not residue -> resolved
# ============================================================================
echo "Case 2: an absent worktree directory is not residue"
reset_env
R2="$(new_repo case2)"
write_source "$R2" tactic-src-a "[tactic-hold-residue-src-a]"
write_open_hold "$R2" tactic-hold-residue-src-a tactic-src-a worktree-residue
# deliberately NO mk_wt
DISPATCH_HOLD_RECHECK_REPO_ROOT="$R2" run_sweep "case2"

assert_contains "case2: summary reports one resolution" \
  "candidates=1 resolved=1 observing=0" "$SUMMARY"
assert_eq "case2: resolve-hold invoked exactly once" "1" "$(resolve_log_lines)"

# ============================================================================
# Case 3: a dirty tracked tree -> observed, never resolved
# ============================================================================
echo "Case 3: a dirty tracked tree keeps the hold"
reset_env
R3="$(new_repo case3)"
write_source "$R3" tactic-src-a "[tactic-hold-residue-src-a]"
write_open_hold "$R3" tactic-hold-residue-src-a tactic-src-a worktree-residue
mk_wt "$R3" tactic-src-a
echo "uncommitted edit from a dead session" >>"$R3/.claude/worktrees/tactic-src-a/README.md"
DISPATCH_HOLD_RECHECK_REPO_ROOT="$R3" run_sweep "case3"

assert_contains "case3: names the residue slug" \
  "observing-residue (dirty-tracked-tree) for tactic-hold-residue-src-a" "$ERR"
assert_contains "case3: summary counts it as observing" \
  "candidates=1 resolved=0 observing=1" "$SUMMARY"
assert_eq "case3: resolve-hold never invoked" "0" "$(resolve_log_lines)"

# ============================================================================
# Case 4: a wrong-branch worktree and a detached-HEAD worktree -> both observed
# ============================================================================
echo "Case 4: wrong-branch and detached-HEAD worktrees both keep their holds"
reset_env
R4="$(new_repo case4)"
write_source "$R4" tactic-src-a "[tactic-hold-residue-src-a]"
write_open_hold "$R4" tactic-hold-residue-src-a tactic-src-a worktree-residue
write_source "$R4" tactic-src-b "[tactic-hold-residue-src-b]"
write_open_hold "$R4" tactic-hold-residue-src-b tactic-src-b worktree-residue
mk_wt "$R4" tactic-src-a
git -C "$R4/.claude/worktrees/tactic-src-a" checkout -q -b some-other-branch
mk_wt "$R4" tactic-src-b
git -C "$R4/.claude/worktrees/tactic-src-b" checkout -q --detach HEAD
DISPATCH_HOLD_RECHECK_REPO_ROOT="$R4" run_sweep "case4"

assert_contains "case4: wrong branch is observed" \
  "observing-residue (wrong-branch:some-other-branch) for tactic-hold-residue-src-a" "$ERR"
assert_contains "case4: detached HEAD is observed" \
  "observing-residue (detached-head) for tactic-hold-residue-src-b" "$ERR"
assert_contains "case4: summary counts both as observing" \
  "candidates=2 resolved=0 observing=2" "$SUMMARY"
assert_eq "case4: resolve-hold never invoked" "0" "$(resolve_log_lines)"

# ============================================================================
# Case 5: a live session registered under the source's worktree name -> claimed
# ============================================================================
echo "Case 5: a live session under the source's name keeps the hold"
reset_env
R5="$(new_repo case5)"
write_source "$R5" tactic-src-a "[tactic-hold-residue-src-a]"
write_open_hold "$R5" tactic-hold-residue-src-a tactic-src-a worktree-residue
mk_wt "$R5" tactic-src-a   # CLEAN: only the live-session claim can keep it
jq -n '[{sessionId:"sess-1",status:"busy",name:"tactic-src-a",state:"running"}]' \
  >"$DISPATCH_AGENTS_SNAPSHOT_ALL"
DISPATCH_HOLD_RECHECK_REPO_ROOT="$R5" run_sweep "case5"

assert_contains "case5: reports the claim" \
  "observing-claimed (tactic-src-a has a live session or reservation)" "$ERR"
assert_contains "case5: summary counts it as observing" \
  "candidates=1 resolved=0 observing=1" "$SUMMARY"
assert_eq "case5: resolve-hold never invoked" "0" "$(resolve_log_lines)"

# ============================================================================
# Case 6: an outstanding reservation marker for the source -> claimed
# ============================================================================
echo "Case 6: an outstanding reservation marker keeps the hold"
reset_env
R6="$(new_repo case6)"
write_source "$R6" tactic-src-a "[tactic-hold-residue-src-a]"
write_open_hold "$R6" tactic-hold-residue-src-a tactic-src-a worktree-residue
mk_wt "$R6" tactic-src-a   # CLEAN: only the reservation can keep it
# The marker file is named exactly by the reserved worktree basename, which for
# a node-lane source IS its node id (lib-reservation-ledger.sh's contract).
{
  printf 'session=sess-1\n'
  printf 'issue=tactic-src-a\n'
  printf 'timestamp=2026-07-31T00:00:00Z\n'
} >"$DISPATCH_RESERVATION_DIR/tactic-src-a"
DISPATCH_HOLD_RECHECK_REPO_ROOT="$R6" run_sweep "case6"

assert_contains "case6: reports the claim" \
  "observing-claimed (tactic-src-a has a live session or reservation)" "$ERR"
assert_contains "case6: summary counts it as observing" \
  "candidates=1 resolved=0 observing=1" "$SUMMARY"
assert_eq "case6: resolve-hold never invoked" "0" "$(resolve_log_lines)"

# ============================================================================
# Case 7: an edge-residue candidate whose worktree is DIRTY -> still resolved.
# The hold already completed, so no predicate applies: what survives is the
# source's blocked_by edge, and residue in the worktree is irrelevant to it.
# ============================================================================
echo "Case 7: an edge-residue candidate resolves even over a dirty worktree"
reset_env
R7="$(new_repo case7)"
write_source "$R7" tactic-src-a "[tactic-hold-residue-src-a]"
write_done_hold "$R7" tactic-hold-residue-src-a tactic-src-a worktree-residue
mk_wt "$R7" tactic-src-a
echo "uncommitted edit" >>"$R7/.claude/worktrees/tactic-src-a/README.md"
DISPATCH_HOLD_RECHECK_REPO_ROOT="$R7" run_sweep "case7"

assert_contains "case7: summary reports one resolution" \
  "candidates=1 resolved=1 observing=0" "$SUMMARY"
assert_eq "case7: resolve-hold invoked exactly once" "1" "$(resolve_log_lines)"
assert_eq "case7: invoked with the source id and kind" \
  "tactic-src-a --kind worktree-residue" "$(cat "$RESOLVE_LOG")"

# ============================================================================
# Case 8: an open provision-conflict hold -> manual policy, never acted on
# ============================================================================
echo "Case 8: an open provision-conflict hold is reported, never resolved"
reset_env
R8="$(new_repo case8)"
write_source "$R8" tactic-src-a "[tactic-hold-conflict-src-a]"
write_open_hold "$R8" tactic-hold-conflict-src-a tactic-src-a provision-conflict
mk_wt "$R8" tactic-src-a   # CLEAN: only the manual policy can keep it
DISPATCH_HOLD_RECHECK_REPO_ROOT="$R8" run_sweep "case8"

assert_contains "case8: reports the manual policy" \
  "skip-manual-policy (provision-conflict has no machine-checkable predicate) for tactic-hold-conflict-src-a" "$ERR"
assert_contains "case8: summary counts it as manual" \
  "candidates=1 resolved=0 observing=0 manual=1" "$SUMMARY"
assert_eq "case8: resolve-hold never invoked" "0" "$(resolve_log_lines)"

# ============================================================================
# Case 9: a failed enumeration is reported under its OWN status
# ============================================================================
echo "Case 9: a failed enumeration is never reported as 'no stale holds'"
reset_env
R9="$(new_repo case9)"
write_source "$R9" tactic-src-a "[tactic-hold-residue-src-a]"
write_open_hold "$R9" tactic-hold-residue-src-a tactic-src-a worktree-residue
mk_wt "$R9" tactic-src-a
DISPATCH_HOLD_RECHECK_ENUM="$ENUM_FAIL_STUB" \
  DISPATCH_HOLD_RECHECK_REPO_ROOT="$R9" run_sweep "case9"
SUMMARY_ENUM_FAILED="$SUMMARY"

assert_contains "case9: status is enumeration-failed" \
  "candidates=0 resolved=0 observing=0 manual=0 unknown=0 failed=0 deferred=0 status=enumeration-failed" \
  "$SUMMARY"
assert_contains "case9: prints a loud diagnostic naming the exit code" \
  "hold enumeration FAILED (rc=2" "$ERR"
assert_eq "case9: resolve-hold never invoked" "0" "$(resolve_log_lines)"

# ============================================================================
# Case 10: a genuine empty store -> candidates=0 status=ok, and that summary is
# textually DISTINGUISHABLE from case 9's.
# ============================================================================
echo "Case 10: an empty store reports candidates=0 status=ok"
reset_env
R10="$(new_repo case10)"
DISPATCH_HOLD_RECHECK_REPO_ROOT="$R10" run_sweep "case10"

assert_contains "case10: status is ok with no candidates" \
  "candidates=0 resolved=0 observing=0 manual=0 unknown=0 failed=0 deferred=0 status=ok" "$SUMMARY"
assert_eq "case10: resolve-hold never invoked" "0" "$(resolve_log_lines)"
TOTAL=$((TOTAL + 1))
if [[ "$SUMMARY" != "$SUMMARY_ENUM_FAILED" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: case10: the empty-store summary differs from the enumeration-failed summary"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: case10: the empty-store summary differs from the enumeration-failed summary"
  echo "    both were: $SUMMARY"
fi

# ============================================================================
# Case 11: one resolve fails, the other still runs. A failure is never fatal to
# the pass and never aborts the remaining candidates.
# ============================================================================
echo "Case 11: a failed resolve keeps the hold and never aborts the pass"
reset_env
R11="$(new_repo case11)"
write_source "$R11" tactic-src-a "[tactic-hold-residue-src-a]"
write_open_hold "$R11" tactic-hold-residue-src-a tactic-src-a worktree-residue
mk_wt "$R11" tactic-src-a
write_source "$R11" tactic-src-b "[tactic-hold-residue-src-b]"
write_open_hold "$R11" tactic-hold-residue-src-b tactic-src-b worktree-residue
mk_wt "$R11" tactic-src-b
RESOLVE_FAIL_IDS="tactic-src-a" DISPATCH_HOLD_RECHECK_REPO_ROOT="$R11" run_sweep "case11"

assert_contains "case11: the failure is reported with its exit code" \
  "resolve-failed (rc=1) — keeping the hold, retrying next tick (tactic-hold-residue-src-a)" "$ERR"
assert_contains "case11: the sibling candidate still resolved" \
  "resolved tactic-hold-residue-src-b (unblocked tactic-src-b)" "$ERR"
assert_contains "case11: summary counts one failure and one resolution" \
  "candidates=2 resolved=1 observing=0 manual=0 unknown=0 failed=1 deferred=0 status=ok" "$SUMMARY"
assert_eq "case11: resolve-hold invoked once per candidate" "2" "$(resolve_log_lines)"

# ============================================================================
# Case 12: the per-pass cap defers the excess rather than serializing N pushes
# ============================================================================
echo "Case 12: the per-pass cap defers excess candidates"
reset_env
R12="$(new_repo case12)"
for s in a b c d; do
  write_source "$R12" "tactic-src-$s" "[tactic-hold-residue-src-$s]"
  write_open_hold "$R12" "tactic-hold-residue-src-$s" "tactic-src-$s" worktree-residue
  mk_wt "$R12" "tactic-src-$s"
done
DISPATCH_HOLD_RECHECK_MAX=2 DISPATCH_HOLD_RECHECK_REPO_ROOT="$R12" run_sweep "case12"

assert_contains "case12: summary reports two resolved and two deferred" \
  "candidates=4 resolved=2 observing=0 manual=0 unknown=0 failed=0 deferred=2 status=ok" "$SUMMARY"
assert_contains "case12: the deferral names the cap" "deferred (cap=2) for" "$ERR"
assert_eq "case12: resolve-hold invoked only up to the cap" "2" "$(resolve_log_lines)"

# ============================================================================
# Case 13: an unresolvable repo root ends the pass under its own status
# ============================================================================
echo "Case 13: an unresolvable repo root reports status=repo-unresolvable"
reset_env
NOT_A_REPO="$WORK/not-a-repo"
mkdir -p "$NOT_A_REPO"
unset DISPATCH_HOLD_RECHECK_REPO_ROOT
unset DISPATCH_GRAPH_MAIN_WORKTREE
run_sweep_in "$NOT_A_REPO" "case13"

assert_contains "case13: status is repo-unresolvable" \
  "candidates=0 resolved=0 observing=0 manual=0 unknown=0 failed=0 deferred=0 status=repo-unresolvable" \
  "$SUMMARY"
assert_contains "case13: prints a diagnostic naming the unresolvable root" \
  "repo root unresolvable" "$ERR"
assert_eq "case13: resolve-hold never invoked" "0" "$(resolve_log_lines)"

report_results
