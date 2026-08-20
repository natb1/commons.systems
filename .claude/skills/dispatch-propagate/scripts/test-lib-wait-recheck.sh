#!/usr/bin/env bash
# test-lib-wait-recheck.sh — functional harness for lib-wait-recheck.sh's
# `wait_recheck_sweep`.
#
# Fixture idiom copied from test-lib-stale-hold-recheck.sh — a throwaway scratch
# repo under `mktemp -d` carrying the REAL packages/intentionsutil/src (plus its
# package.json for ESM resolution) and a `node_modules` SYMLINK to this repo's
# own, so the REAL enumerator (list-recheckable-waits.ts) executes under tsx
# against real node files, classifying them through the real
# `listWaitCandidates` ladder.
#
# Exactly three things are stubbed:
#   - `release-wait` (via DISPATCH_WAIT_RECHECK_RELEASE) — a logging stub that
#     appends its argv to a log and exits with a configurable code.
#   - `park-node` (via DISPATCH_WAIT_RECHECK_PARK) — the same shape, its own log.
#     The real writers fetch, write, and push through graph-commit's landing
#     lock; what this harness must observe is WHETHER and WITH WHAT each was
#     invoked.
#   - the enumerator (via DISPATCH_WAIT_RECHECK_ENUM) — in case 8 ONLY, to
#     reproduce an enumeration failure. Every other case runs the real one.
#
# The session registry is driven by DISPATCH_AGENTS_SNAPSHOT_ALL (the
# registered-view snapshot lib-claude-agents.sh honors), and the reservation
# ledger by DISPATCH_RESERVATION_DIR — so no Claude daemon and no shared ledger
# is touched, and the suite needs no sandbox override to run.
#
# Cases:
#   1.  a `due` wait -> release-wait invoked exactly once with the WAIT id as
#       its sole argument; released=1, park-node never invoked
#   2.  a not-yet-due wait -> observing (until=…), neither writer invoked
#   3.  a `capped` wait -> park-node invoked with the WAIT id and BOTH the
#       seeded wait_reason and wait_recommendation strings; capped=1, and
#       release-wait NEVER invoked
#   4.  a live session / reservation under the SOURCE id -> observing-claimed,
#       neither writer invoked
#   5.  a live session under the WAIT's own id -> observing-claimed
#   6.  a corrupted `wait_until` (the REAL enumerator classifies it malformed)
#       -> skip-malformed, malformed=1, neither writer invoked
#   7.  an already-parked wait (office_hours non-null) -> not enumerated AT ALL
#       (the enumerator's own ladder excludes it): candidates=0
#   8.  enumerator exits 2 -> status=enumeration-failed, nothing invoked, and
#       the summary is textually DISTINGUISHABLE from case 9's
#   9.  an empty store (real enumerator, no wait nodes) -> candidates=0 status=ok
#   10. release-wait exits 1 for one `due` wait -> failed=1, the sibling
#       candidate is still processed, return 0
#   11. four candidates (three due, one capped) with DISPATCH_WAIT_RECHECK_MAX=2
#       -> exactly TWO writes total across BOTH writers (one shared counter,
#       not one per class), the rest deferred
#   12. unresolvable repo root -> status=repo-unresolvable, return 0
#   15. ROTATION: three due waits, DISPATCH_WAIT_RECHECK_MAX=1, the
#       alphabetically FIRST one failing every time -> pass 2 resumes after it
#       and releases the next wait instead of re-spending the only slot on the
#       failing head (head-of-line starvation regression)
#   16. BACKOFF: a failed write arms the per-node skip window -> the next pass
#       reports backoff-skipped for it, spends no slot on it, and still
#       releases its sibling
#   17. ESCALATION: DISPATCH_WAIT_RECHECK_FAIL_ESCALATE=2 with a writer that
#       always fails -> the second consecutive failure parks the WAIT's own id
#       to office hours, the park strings carrying the node's own
#       wait_reason / wait_recommendation
#   ALL: EVERY case: return value 0 and EXACTLY ONE `sweep complete` line
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
[[ -f "$UTIL_SCRIPTS_SRC/list-recheckable-waits.ts" ]] || {
  echo "error: list-recheckable-waits.ts not found at $UTIL_SCRIPTS_SRC" >&2; exit 1; }

echo "=== lib-wait-recheck.sh ==="

WORK="$(mktemp -d)" || { echo "error: mktemp failed" >&2; exit 1; }
trap 'rm -rf "$WORK"' EXIT

# --- Stubs -------------------------------------------------------------------

RELEASE_STUB="$WORK/release-wait-stub"
cat >"$RELEASE_STUB" <<'SH'
#!/usr/bin/env bash
# Logging stand-in for packages/intentionsutil/scripts/release-wait: record the
# full argv, then exit 1 for any wait id named in RELEASE_FAIL_IDS (a
# space-separated list) and 0 otherwise.
printf '%s\n' "$*" >>"$RELEASE_LOG"
for bad in ${RELEASE_FAIL_IDS:-}; do
  if [[ "${1:-}" == "$bad" ]]; then
    echo "release-wait stub: failing for $1" >&2
    exit 1
  fi
done
exit 0
SH
chmod +x "$RELEASE_STUB"

PARK_STUB="$WORK/park-node-stub"
cat >"$PARK_STUB" <<'SH'
#!/usr/bin/env bash
# Logging stand-in for packages/intentionsutil/scripts/park-node. One line per
# invocation carrying the whole argv, plus one line per individual argument in
# PARK_ARGV_LOG so an assertion can pin an exact positional value.
printf '%s\n' "$*" >>"$PARK_LOG"
for a in "$@"; do printf '%s\n' "$a" >>"$PARK_ARGV_LOG"; done
for bad in ${PARK_FAIL_IDS:-}; do
  if [[ "${1:-}" == "$bad" ]]; then
    echo "park-node stub: failing for $1" >&2
    exit 1
  fi
done
exit 0
SH
chmod +x "$PARK_STUB"

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
export RELEASE_LOG="$WORK/release-wait.log"
export PARK_LOG="$WORK/park-node.log"
export PARK_ARGV_LOG="$WORK/park-node-argv.log"
export RELEASE_FAIL_IDS=""
export PARK_FAIL_IDS=""
export DISPATCH_WAIT_RECHECK_RELEASE="$RELEASE_STUB"
export DISPATCH_WAIT_RECHECK_PARK="$PARK_STUB"
export DISPATCH_RESERVATION_DIR="$WORK/reservations"
export DISPATCH_DECISION_LOG_DIR="$WORK/decision-log"
export DISPATCH_AGENTS_SNAPSHOT_ALL="$WORK/agents-all.json"
# The round-robin cursor + per-node backoff state. Pinned into the scratch dir
# (and deleted by reset_env) so no case inherits another's failure streak and
# the developer's real ~/.local/share state is never touched.
export DISPATCH_WAIT_RECHECK_STATE="$WORK/wait-recheck-state.json"
mkdir -p "$DISPATCH_RESERVATION_DIR" "$DISPATCH_DECISION_LOG_DIR"
printf '[]\n' >"$DISPATCH_AGENTS_SNAPSHOT_ALL"

# shellcheck source=lib-wait-recheck.sh
source "$HARNESS_DIR/lib-wait-recheck.sh"

PAST="2020-01-01T00:00:00Z"
# RELATIVE, not a fixed far-future instant: the enumerator classifies a wait
# armed more than WAIT_MAX_HORIZON_DAYS (packages/intentionsutil/src/waits.ts)
# out as `capped` rather than `waiting`, since a never-due wait can never reach
# the attempt cap. Two days is a genuine not-yet-due wait forever.
FUTURE="$(date -u -d '+2 days' +%Y-%m-%dT%H:%M:%SZ)" \
  || { echo "error: date -u -d '+2 days' failed (GNU date required)" >&2; exit 1; }
# Beyond the horizon — case 13 asserts this escalates instead of observing.
FUTURE_BEYOND_HORIZON="2099-01-01T00:00:00Z"
REASON="the batch QA window has not closed yet"
RECOMMENDATION="re-check the deployed run log after the window, then re-plan or release"

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
  cp "$UTIL_SCRIPTS_SRC/list-recheckable-waits.ts" \
     "$repo/packages/intentionsutil/scripts/list-recheckable-waits.ts"
  ln -s "$REAL_REPO_ROOT/node_modules" "$repo/node_modules"
  git init -q -b main "$repo"
  git -C "$repo" config user.email harness@test
  git -C "$repo" config user.name harness
  echo seed >"$repo/README.md"
  git -C "$repo" add README.md
  git -C "$repo" commit -qm seed
  printf '%s\n' "$repo"
}

# wait_id_for <source-id> — the canonical derivation waits.ts enforces.
wait_id_for() { printf 'tactic-wait-%s\n' "${1#tactic-}"; }

# write_source <repo> <source-id> <blocked_by-yaml-list>
write_source() {
  cat >"$1/intentions/$2.md" <<NODE
---
id: $2
kind: tactic
statement: harness source node held by a calendar wait
owner: ai
status: codified
phase: implement
serves: []
execution: null
blocked_by: $3
---
# harness source node held by a calendar wait
NODE
}

# write_wait <repo> <source-id> <wait_until> <attempts> [reason] [recommendation]
# — an ARMED wait (phase null, office_hours null) under its canonical id.
# WAIT_ARMED_SINCE, when set non-empty in the caller's environment, adds an
# `attributes.wait_armed_since` line (the armed-age stamp the horizon rung
# reads); unset, the node carries none, which is the pre-field shape.
write_wait() {
  local repo="$1" src="$2" until_at="$3" attempts="$4"
  local reason="${5:-$REASON}" rec="${6:-$RECOMMENDATION}"
  local wid armed_line=""
  wid="$(wait_id_for "$src")"
  [[ -n "${WAIT_ARMED_SINCE:-}" ]] && armed_line="
  wait_armed_since: $WAIT_ARMED_SINCE"
  cat >"$repo/intentions/$wid.md" <<NODE
---
id: $wid
kind: tactic
statement: 'wait: harness wait for $src'
owner: ai
status: codified
serves: []
phase: null
office_hours: null
attributes:
  wait_for: $src
  wait_until: $until_at$armed_line
  wait_attempts: $attempts
  wait_reason: $reason
  wait_recommendation: $rec
---
# wait: $src
NODE
}

# write_parked_wait <repo> <source-id> <wait_until> <attempts> — a wait whose
# cap-park already fired: office_hours non-null. The enumerator's ladder (step 8
# in wait-sweep.ts) drops it entirely.
write_parked_wait() {
  local repo="$1" src="$2" until_at="$3" attempts="$4"
  local wid
  wid="$(wait_id_for "$src")"
  cat >"$repo/intentions/$wid.md" <<NODE
---
id: $wid
kind: tactic
statement: 'wait: harness wait for $src'
owner: ai
status: codified
serves: []
phase: null
office_hours:
  reason: the re-arm attempt cap already fired
  since: 2026-07-01
  recommendation: decide whether to re-arm or abandon this wait
attributes:
  wait_for: $src
  wait_until: $until_at
  wait_attempts: $attempts
  wait_reason: $REASON
  wait_recommendation: $RECOMMENDATION
---
# wait: $src
NODE
}

# --- Runner ------------------------------------------------------------------
# run_sweep <label> — run the sweep, capture stderr in ERR and the return value
# in RC, and assert the two universal properties (case 13) for EVERY case:
# return 0, and exactly one `sweep complete` line.
ERR=""; RC=0; SUMMARY=""
run_sweep() {
  local label="$1"
  : >"$RELEASE_LOG"; : >"$PARK_LOG"; : >"$PARK_ARGV_LOG"
  wait_recheck_sweep 2>"$WORK/stderr.log"
  RC=$?
  ERR="$(cat "$WORK/stderr.log")"
  SUMMARY="$(grep -F 'lib-wait-recheck: sweep complete' "$WORK/stderr.log")"
  assert_eq "$label: returns 0" "0" "$RC"
  assert_eq "$label: exactly one sweep-complete line" "1" \
    "$(grep -cF 'lib-wait-recheck: sweep complete' "$WORK/stderr.log")"
}

# run_sweep_in <dir> <label> — same, but from a different cwd (case 12 needs a
# cwd outside any git repo so resolve_main_worktree genuinely fails). The sweep
# is a shell function, so a subshell inherits it; stderr still lands in the log.
run_sweep_in() {
  local dir="$1" label="$2"
  : >"$RELEASE_LOG"; : >"$PARK_LOG"; : >"$PARK_ARGV_LOG"
  ( cd "$dir" && wait_recheck_sweep ) 2>"$WORK/stderr.log"
  RC=$?
  ERR="$(cat "$WORK/stderr.log")"
  SUMMARY="$(grep -F 'lib-wait-recheck: sweep complete' "$WORK/stderr.log")"
  assert_eq "$label: returns 0" "0" "$RC"
  assert_eq "$label: exactly one sweep-complete line" "1" \
    "$(grep -cF 'lib-wait-recheck: sweep complete' "$WORK/stderr.log")"
}

release_log_lines() { awk 'END { print NR }' "$RELEASE_LOG"; }
park_log_lines()    { awk 'END { print NR }' "$PARK_LOG"; }

# Per-case env reset: cases 4/5/8/10/11 each pin one knob; nothing may leak.
reset_env() {
  printf '[]\n' >"$DISPATCH_AGENTS_SNAPSHOT_ALL"
  rm -f "${DISPATCH_RESERVATION_DIR:?}"/* 2>/dev/null
  unset DISPATCH_WAIT_RECHECK_ENUM
  unset DISPATCH_WAIT_RECHECK_MAX
  unset DISPATCH_WAIT_RECHECK_BACKOFF_MAX
  unset DISPATCH_WAIT_RECHECK_FAIL_ESCALATE
  rm -f "${DISPATCH_WAIT_RECHECK_STATE:?}"
  export RELEASE_FAIL_IDS=""
  export PARK_FAIL_IDS=""
  export DISPATCH_WAIT_RECHECK_RELEASE="$RELEASE_STUB"
  export DISPATCH_WAIT_RECHECK_PARK="$PARK_STUB"
}

# ============================================================================
# Case 1: a due wait is released
# ============================================================================
echo "Case 1: a wait whose wait_until has passed is released"
reset_env
R1="$(new_repo case1)"
write_source "$R1" tactic-src-a "[tactic-wait-src-a]"
write_wait "$R1" tactic-src-a "$PAST" 1
DISPATCH_WAIT_RECHECK_REPO_ROOT="$R1" run_sweep "case1"

assert_contains "case1: summary reports one release" \
  "candidates=1 released=1 capped=0 observing=0 malformed=0 failed=0 deferred=0 backoff=0 escalated=0 status=ok" "$SUMMARY"
assert_contains "case1: names the released wait and its source" \
  "released tactic-wait-src-a (unblocked tactic-src-a)" "$ERR"
assert_eq "case1: release-wait invoked exactly once" "1" "$(release_log_lines)"
assert_eq "case1: invoked with the WAIT id as its sole argument" \
  "tactic-wait-src-a" "$(cat "$RELEASE_LOG")"
assert_eq "case1: park-node never invoked" "0" "$(park_log_lines)"

# ============================================================================
# Case 2: a not-yet-due wait is observed, never touched
# ============================================================================
echo "Case 2: a wait whose instant has not arrived is observed"
reset_env
R2="$(new_repo case2)"
write_source "$R2" tactic-src-a "[tactic-wait-src-a]"
write_wait "$R2" tactic-src-a "$FUTURE" 1
DISPATCH_WAIT_RECHECK_REPO_ROOT="$R2" run_sweep "case2"

# The enumerator re-serializes the instant through Date#toISOString, which is
# millisecond-precision — the sweep echoes that column verbatim rather than
# reformatting it.
assert_contains "case2: reports the instant it is waiting on" \
  "observing (until=${FUTURE%Z}.000Z) for tactic-wait-src-a" "$ERR"
assert_contains "case2: summary counts it as observing" \
  "candidates=1 released=0 capped=0 observing=1 malformed=0 failed=0 deferred=0 backoff=0 escalated=0 status=ok" "$SUMMARY"
assert_eq "case2: release-wait never invoked" "0" "$(release_log_lines)"
assert_eq "case2: park-node never invoked" "0" "$(park_log_lines)"

# ============================================================================
# Case 3: a capped wait is parked on its OWN id, carrying its own strings
# ============================================================================
echo "Case 3: a wait at the re-arm attempt cap is parked, never released"
reset_env
R3="$(new_repo case3)"
write_source "$R3" tactic-src-a "[tactic-wait-src-a]"
# WAIT_ATTEMPT_CAP is 4 (packages/intentionsutil/src/waits.ts); a past instant
# plus attempts >= the cap classifies `capped`.
write_wait "$R3" tactic-src-a "$PAST" 4
DISPATCH_WAIT_RECHECK_REPO_ROOT="$R3" run_sweep "case3"

assert_contains "case3: summary reports one cap-park" \
  "candidates=1 released=0 capped=1 observing=0 malformed=0 failed=0 deferred=0 backoff=0 escalated=0 status=ok" "$SUMMARY"
assert_contains "case3: names the parked wait" "capped-parked tactic-wait-src-a" "$ERR"
assert_eq "case3: park-node invoked exactly once" "1" "$(park_log_lines)"
assert_eq "case3: parked the WAIT's own id, never the source's" \
  "tactic-wait-src-a" "$(awk 'NR==1' "$PARK_ARGV_LOG")"
assert_eq "case3: the reason argument is the node's own wait_reason, verbatim" \
  "$REASON" "$(awk 'NR==2' "$PARK_ARGV_LOG")"
assert_eq "case3: the recommendation argument is the node's own wait_recommendation, verbatim" \
  "$RECOMMENDATION" "$(awk 'NR==3' "$PARK_ARGV_LOG")"
assert_eq "case3: park-node got exactly three arguments" "3" \
  "$(awk 'END { print NR }' "$PARK_ARGV_LOG")"
assert_eq "case3: release-wait NEVER invoked for a capped wait" "0" "$(release_log_lines)"

# ============================================================================
# Case 4: a claim on the SOURCE keeps the wait armed
# ============================================================================
echo "Case 4: a live session or reservation on the source keeps the wait"
reset_env
R4="$(new_repo case4)"
write_source "$R4" tactic-src-a "[tactic-wait-src-a]"
write_wait "$R4" tactic-src-a "$PAST" 1
write_source "$R4" tactic-src-b "[tactic-wait-src-b]"
write_wait "$R4" tactic-src-b "$PAST" 1
# One claim per mechanism: a live session for src-a, a ledger marker for src-b.
jq -n '[{sessionId:"sess-1",status:"busy",name:"tactic-src-a",state:"running"}]' \
  >"$DISPATCH_AGENTS_SNAPSHOT_ALL"
{
  printf 'session=sess-2\n'
  printf 'issue=tactic-src-b\n'
  printf 'timestamp=2026-08-01T00:00:00Z\n'
} >"$DISPATCH_RESERVATION_DIR/tactic-src-b"
DISPATCH_WAIT_RECHECK_REPO_ROOT="$R4" run_sweep "case4"

assert_contains "case4: the live-session claim is reported" \
  "observing-claimed (tactic-src-a has a live session or reservation)" "$ERR"
assert_contains "case4: the reservation claim is reported" \
  "observing-claimed (tactic-src-b has a live session or reservation)" "$ERR"
assert_contains "case4: summary counts both as observing" \
  "candidates=2 released=0 capped=0 observing=2 malformed=0 failed=0 deferred=0 backoff=0 escalated=0 status=ok" "$SUMMARY"
assert_eq "case4: release-wait never invoked" "0" "$(release_log_lines)"
assert_eq "case4: park-node never invoked" "0" "$(park_log_lines)"

# ============================================================================
# Case 5: a claim on the WAIT node itself keeps it. A wait is a `kind: tactic`
# node, so the graph office-hours lane can hold a session named after it — and
# the cap-park would write office_hours underneath that session.
# ============================================================================
echo "Case 5: a live session on the wait node itself keeps the wait"
reset_env
R5="$(new_repo case5)"
write_source "$R5" tactic-src-a "[tactic-wait-src-a]"
write_wait "$R5" tactic-src-a "$PAST" 4
jq -n '[{sessionId:"sess-oh",status:"busy",name:"tactic-wait-src-a",state:"running"}]' \
  >"$DISPATCH_AGENTS_SNAPSHOT_ALL"
DISPATCH_WAIT_RECHECK_REPO_ROOT="$R5" run_sweep "case5"

assert_contains "case5: reports the claim on the wait node" \
  "observing-claimed (tactic-wait-src-a has a live session or reservation)" "$ERR"
assert_contains "case5: summary counts it as observing" \
  "candidates=1 released=0 capped=0 observing=1 malformed=0 failed=0 deferred=0 backoff=0 escalated=0 status=ok" "$SUMMARY"
assert_eq "case5: release-wait never invoked" "0" "$(release_log_lines)"
assert_eq "case5: park-node never invoked" "0" "$(park_log_lines)"

# ============================================================================
# Case 6: a corrupted wait_until is reported LOUDLY and never acted on
# ============================================================================
echo "Case 6: a malformed wait is reported for visibility, never acted on"
reset_env
R6="$(new_repo case6)"
write_source "$R6" tactic-src-a "[tactic-wait-src-a]"
# Not an ISO 8601 UTC instant -> parseWaitUntil returns null -> `malformed`
# (wait-sweep.ts step 6). The enumerator NEVER defaults it to "now".
write_wait "$R6" tactic-src-a "not-an-instant" 1
DISPATCH_WAIT_RECHECK_REPO_ROOT="$R6" run_sweep "case6"

assert_contains "case6: the malformed wait is named in a loud line" \
  "skip-malformed (tactic-wait-src-a carries an unparseable wait_until" "$ERR"
assert_contains "case6: summary counts it as malformed" \
  "candidates=1 released=0 capped=0 observing=0 malformed=1 failed=0 deferred=0 backoff=0 escalated=0 status=ok" "$SUMMARY"
assert_eq "case6: release-wait never invoked" "0" "$(release_log_lines)"
assert_eq "case6: park-node never invoked" "0" "$(park_log_lines)"

# ============================================================================
# Case 7: an ALREADY-PARKED wait is not a candidate at all. The exclusion lives
# in the enumerator (wait-sweep.ts step 8), not in this sweep: once the cap-park
# has fired the author owns the node, and neither a release nor a re-park may
# land underneath them.
# ============================================================================
echo "Case 7: an already-parked wait is never enumerated"
reset_env
R7="$(new_repo case7)"
write_source "$R7" tactic-src-a "[tactic-wait-src-a]"
write_parked_wait "$R7" tactic-src-a "$PAST" 4
DISPATCH_WAIT_RECHECK_REPO_ROOT="$R7" run_sweep "case7"

assert_contains "case7: no candidate is produced at all" \
  "candidates=0 released=0 capped=0 observing=0 malformed=0 failed=0 deferred=0 backoff=0 escalated=0 status=ok" "$SUMMARY"
assert_eq "case7: the parked wait is never named in the sweep output" "0" \
  "$(grep -cF 'tactic-wait-src-a' "$WORK/stderr.log")"
assert_eq "case7: release-wait never invoked" "0" "$(release_log_lines)"
assert_eq "case7: park-node never invoked" "0" "$(park_log_lines)"

# ============================================================================
# Case 8: a failed enumeration is reported under its OWN status
# ============================================================================
echo "Case 8: a failed enumeration is never reported as 'no waits are due'"
reset_env
R8="$(new_repo case8)"
write_source "$R8" tactic-src-a "[tactic-wait-src-a]"
write_wait "$R8" tactic-src-a "$PAST" 1
DISPATCH_WAIT_RECHECK_ENUM="$ENUM_FAIL_STUB" \
  DISPATCH_WAIT_RECHECK_REPO_ROOT="$R8" run_sweep "case8"
SUMMARY_ENUM_FAILED="$SUMMARY"

assert_contains "case8: status is enumeration-failed" \
  "candidates=0 released=0 capped=0 observing=0 malformed=0 failed=0 deferred=0 backoff=0 escalated=0 status=enumeration-failed" \
  "$SUMMARY"
assert_contains "case8: prints a loud diagnostic naming the exit code" \
  "wait enumeration FAILED (rc=2" "$ERR"
assert_eq "case8: release-wait never invoked" "0" "$(release_log_lines)"
assert_eq "case8: park-node never invoked" "0" "$(park_log_lines)"

# ============================================================================
# Case 9: a genuine empty store -> candidates=0 status=ok, textually
# DISTINGUISHABLE from case 8's summary.
# ============================================================================
echo "Case 9: an empty store reports candidates=0 status=ok"
reset_env
R9="$(new_repo case9)"
DISPATCH_WAIT_RECHECK_REPO_ROOT="$R9" run_sweep "case9"

assert_contains "case9: status is ok with no candidates" \
  "candidates=0 released=0 capped=0 observing=0 malformed=0 failed=0 deferred=0 backoff=0 escalated=0 status=ok" "$SUMMARY"
assert_eq "case9: release-wait never invoked" "0" "$(release_log_lines)"
TOTAL=$((TOTAL + 1))
if [[ "$SUMMARY" != "$SUMMARY_ENUM_FAILED" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: case9: the empty-store summary differs from the enumeration-failed summary"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: case9: the empty-store summary differs from the enumeration-failed summary"
  echo "    both were: $SUMMARY"
fi

# ============================================================================
# Case 10: a failed release keeps the wait armed and never aborts the pass
# ============================================================================
echo "Case 10: a failed release keeps the wait and never aborts the pass"
reset_env
R10="$(new_repo case10)"
write_source "$R10" tactic-src-a "[tactic-wait-src-a]"
write_wait "$R10" tactic-src-a "$PAST" 1
write_source "$R10" tactic-src-b "[tactic-wait-src-b]"
write_wait "$R10" tactic-src-b "$PAST" 1
RELEASE_FAIL_IDS="tactic-wait-src-a" DISPATCH_WAIT_RECHECK_REPO_ROOT="$R10" run_sweep "case10"

assert_contains "case10: the failure is reported with its exit code" \
  "resolve-failed (rc=1) — keeping the wait armed, retrying next tick (tactic-wait-src-a)" "$ERR"
assert_contains "case10: the sibling candidate still released" \
  "released tactic-wait-src-b (unblocked tactic-src-b)" "$ERR"
assert_contains "case10: summary counts one failure and one release" \
  "candidates=2 released=1 capped=0 observing=0 malformed=0 failed=1 deferred=0 backoff=0 escalated=0 status=ok" "$SUMMARY"
assert_eq "case10: release-wait invoked once per candidate" "2" "$(release_log_lines)"

# ============================================================================
# Case 11: the per-pass cap is ONE shared counter across both writers
# ============================================================================
echo "Case 11: the per-pass cap defers excess candidates across both writers"
reset_env
R11="$(new_repo case11)"
# Sorted by wait id: src-a (due), src-b (capped), src-c (due), src-d (due).
write_source "$R11" tactic-src-a "[tactic-wait-src-a]"; write_wait "$R11" tactic-src-a "$PAST" 1
write_source "$R11" tactic-src-b "[tactic-wait-src-b]"; write_wait "$R11" tactic-src-b "$PAST" 4
write_source "$R11" tactic-src-c "[tactic-wait-src-c]"; write_wait "$R11" tactic-src-c "$PAST" 1
write_source "$R11" tactic-src-d "[tactic-wait-src-d]"; write_wait "$R11" tactic-src-d "$PAST" 1
DISPATCH_WAIT_RECHECK_MAX=2 DISPATCH_WAIT_RECHECK_REPO_ROOT="$R11" run_sweep "case11"

assert_contains "case11: one release plus one park exhausts the shared cap of 2" \
  "candidates=4 released=1 capped=1 observing=0 malformed=0 failed=0 deferred=2 backoff=0 escalated=0 status=ok" "$SUMMARY"
assert_contains "case11: the deferral names the cap" "deferred (cap=2) for" "$ERR"
assert_eq "case11: release-wait invoked once" "1" "$(release_log_lines)"
assert_eq "case11: park-node invoked once" "1" "$(park_log_lines)"

# ============================================================================
# Case 12: an unresolvable repo root ends the pass under its own status
# ============================================================================
echo "Case 12: an unresolvable repo root reports status=repo-unresolvable"
reset_env
NOT_A_REPO="$WORK/not-a-repo"
mkdir -p "$NOT_A_REPO"
unset DISPATCH_WAIT_RECHECK_REPO_ROOT
unset DISPATCH_GRAPH_MAIN_WORKTREE
run_sweep_in "$NOT_A_REPO" "case12"

assert_contains "case12: status is repo-unresolvable" \
  "candidates=0 released=0 capped=0 observing=0 malformed=0 failed=0 deferred=0 backoff=0 escalated=0 status=repo-unresolvable" \
  "$SUMMARY"
assert_contains "case12: prints a diagnostic naming the unresolvable root" \
  "repo root unresolvable" "$ERR"
assert_eq "case12: release-wait never invoked" "0" "$(release_log_lines)"
assert_eq "case12: park-node never invoked" "0" "$(park_log_lines)"

# ============================================================================
# Case 13: a wait that outlives the horizon escalates instead of observing
# ============================================================================
# The denial-of-work hole the attempt cap cannot see. `wait_attempts` counts
# release/re-arm ROUNDS, so a wait armed for a distant instant — or one
# re-EXTENDED before every deadline, which is deliberately not a new attempt —
# never comes due, never reaches WAIT_ATTEMPT_CAP, and would otherwise be
# reported as `observing` forever while its blocked_by edge held the source.
# WAIT_MAX_HORIZON_DAYS (packages/intentionsutil/src/waits.ts) is what turns
# both into a `capped` park the author can see.
echo "Case 13: a wait armed beyond the horizon is parked, not observed"
reset_env
R13="$(new_repo case13)"
write_source "$R13" tactic-src-a "[tactic-wait-src-a]"
write_wait "$R13" tactic-src-a "$FUTURE_BEYOND_HORIZON" 1
DISPATCH_WAIT_RECHECK_REPO_ROOT="$R13" run_sweep "case13"

assert_contains "case13: the over-horizon wait is escalated, not left observing" \
  "capped-parked tactic-wait-src-a" "$ERR"
assert_eq "case13: park-node invoked exactly once" "1" "$(park_log_lines)"
assert_eq "case13: parked the WAIT's own id, never the source's" \
  "tactic-wait-src-a" "$(awk 'NR==1' "$PARK_ARGV_LOG")"
assert_eq "case13: release-wait never invoked for a not-yet-due wait" "0" "$(release_log_lines)"

echo "Case 14: a wait continuously armed past the horizon is parked"
reset_env
R14="$(new_repo case14)"
write_source "$R14" tactic-src-a "[tactic-wait-src-a]"
# Inside the horizon by wait_until, but armed far longer than it: the
# extend-forever loop, whose wait_attempts never moves off 1.
WAIT_ARMED_SINCE="$(date -u -d '-60 days' +%Y-%m-%dT%H:%M:%SZ)" \
  write_wait "$R14" tactic-src-a "$FUTURE" 1
DISPATCH_WAIT_RECHECK_REPO_ROOT="$R14" run_sweep "case14"

assert_contains "case14: cumulative armed age escalates even at wait_attempts 1" \
  "capped-parked tactic-wait-src-a" "$ERR"
assert_eq "case14: park-node invoked exactly once" "1" "$(park_log_lines)"
assert_eq "case14: release-wait never invoked" "0" "$(release_log_lines)"

# ============================================================================
# Case 15 (rotation): a persistently failing candidate at the HEAD of the id
# ordering must not monopolize the shared per-pass cap. `listWaitCandidates`
# sorts by wait id ascending, so without the round-robin cursor `src-a` — which
# fails every time — would spend the only slot on every tick forever and `src-b`
# / `src-c` would be `deferred` for good, quietly, under `status=ok`.
# ============================================================================
echo "Case 15: a persistently failing head-of-list wait cannot starve the rest"
reset_env
R15="$(new_repo case15)"
write_source "$R15" tactic-src-a "[tactic-wait-src-a]"; write_wait "$R15" tactic-src-a "$PAST" 1
write_source "$R15" tactic-src-b "[tactic-wait-src-b]"; write_wait "$R15" tactic-src-b "$PAST" 1
write_source "$R15" tactic-src-c "[tactic-wait-src-c]"; write_wait "$R15" tactic-src-c "$PAST" 1
export RELEASE_FAIL_IDS="tactic-wait-src-a"
export DISPATCH_WAIT_RECHECK_MAX=1
export DISPATCH_WAIT_RECHECK_REPO_ROOT="$R15"

run_sweep "case15-rotation pass1"
assert_contains "case15-rotation: pass 1 spends its only slot on the failing head" \
  "candidates=3 released=0 capped=0 observing=0 malformed=0 failed=1 deferred=2 backoff=0 escalated=0 status=ok" \
  "$SUMMARY"
assert_eq "case15-rotation: pass 1 attempted only the head" \
  "tactic-wait-src-a" "$(cat "$RELEASE_LOG")"

run_sweep "case15-rotation pass2"
assert_contains "case15-rotation: pass 2 resumes AFTER the failing head" \
  "released tactic-wait-src-b (unblocked tactic-src-b)" "$ERR"
assert_eq "case15-rotation: pass 2 never re-attempted the failing head" "0" \
  "$(grep -cF 'tactic-wait-src-a' "$RELEASE_LOG")"

unset DISPATCH_WAIT_RECHECK_MAX
unset DISPATCH_WAIT_RECHECK_REPO_ROOT

# ============================================================================
# Case 16 (backoff): a failed write arms a per-node skip window, so the failing
# wait spends NO slot on the next pass at all.
# ============================================================================
echo "Case 16: a failed write backs the wait off for the following pass"
reset_env
R16="$(new_repo case16)"
write_source "$R16" tactic-src-a "[tactic-wait-src-a]"; write_wait "$R16" tactic-src-a "$PAST" 1
write_source "$R16" tactic-src-b "[tactic-wait-src-b]"; write_wait "$R16" tactic-src-b "$PAST" 1
export RELEASE_FAIL_IDS="tactic-wait-src-a"
export DISPATCH_WAIT_RECHECK_REPO_ROOT="$R16"

run_sweep "case16-backoff pass1"
assert_contains "case16-backoff: pass 1 records the failure" \
  "candidates=2 released=1 capped=0 observing=0 malformed=0 failed=1 deferred=0 backoff=0 escalated=0 status=ok" \
  "$SUMMARY"

run_sweep "case16-backoff pass2"
assert_contains "case16-backoff: pass 2 skips the failing wait instead of retrying it" \
  "backoff-skipped (tactic-wait-src-a has failed 1 consecutive write attempts" "$ERR"
assert_contains "case16-backoff: pass 2 counts the skip and still releases the sibling" \
  "candidates=2 released=1 capped=0 observing=0 malformed=0 failed=0 deferred=0 backoff=1 escalated=0 status=ok" \
  "$SUMMARY"
assert_eq "case16-backoff: pass 2 invoked release-wait for the sibling only" \
  "tactic-wait-src-b" "$(cat "$RELEASE_LOG")"

unset DISPATCH_WAIT_RECHECK_REPO_ROOT

# ============================================================================
# Case 17 (escalation): a wait whose writer refuses forever is retired to office
# hours rather than retried until the heat death of the fleet — parked on its
# OWN id, carrying its own wait_reason verbatim inside the failure narrative.
# ============================================================================
echo "Case 17: a wait at the consecutive-failure threshold escalates to office hours"
reset_env
R17="$(new_repo case17)"
write_source "$R17" tactic-src-a "[tactic-wait-src-a]"; write_wait "$R17" tactic-src-a "$PAST" 1
export RELEASE_FAIL_IDS="tactic-wait-src-a"
export DISPATCH_WAIT_RECHECK_FAIL_ESCALATE=2
# 0 disables the skip window, so the second failure lands on the very next pass.
export DISPATCH_WAIT_RECHECK_BACKOFF_MAX=0
export DISPATCH_WAIT_RECHECK_REPO_ROOT="$R17"

run_sweep "case17-escalation pass1"
assert_eq "case17-escalation: the first failure escalates nothing" "0" "$(park_log_lines)"

run_sweep "case17-escalation pass2"
assert_contains "case17-escalation: the threshold failure is escalated" \
  "escalated tactic-wait-src-a to office hours (2 consecutive failed release-wait attempts" "$ERR"
assert_contains "case17-escalation: the summary counts the escalation" \
  "candidates=1 released=0 capped=0 observing=0 malformed=0 failed=1 deferred=0 backoff=0 escalated=1 status=ok" \
  "$SUMMARY"
assert_eq "case17-escalation: park-node invoked exactly once" "1" "$(park_log_lines)"
assert_eq "case17-escalation: parked the WAIT's own id, never the source's" \
  "tactic-wait-src-a" "$(awk 'NR==1' "$PARK_ARGV_LOG")"
assert_contains "case17-escalation: the park reason carries the node's own wait_reason" \
  "$REASON" "$(awk 'NR==2' "$PARK_ARGV_LOG")"
assert_contains "case17-escalation: the park recommendation carries the node's own recommendation" \
  "$RECOMMENDATION" "$(awk 'NR==3' "$PARK_ARGV_LOG")"

unset DISPATCH_WAIT_RECHECK_FAIL_ESCALATE
unset DISPATCH_WAIT_RECHECK_BACKOFF_MAX
unset DISPATCH_WAIT_RECHECK_REPO_ROOT
reset_env

report_results
