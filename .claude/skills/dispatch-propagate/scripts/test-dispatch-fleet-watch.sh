#!/usr/bin/env bash
#
# test-dispatch-fleet-watch.sh — unit-test harness for dispatch-fleet-watch.
#
# Dependency-injects EVERY external command the watcher touches, through the
# script's own seams (the DISPATCH_LIVENESS_* pattern used by
# test-dispatch-daemon-liveness.sh lines 33-120):
#   DISPATCH_FLEET_WATCH_LIVENESS_CMD   stub for dispatch-daemon-liveness
#   DISPATCH_FLEET_WATCH_REDSYNC_CMD    stub for dispatch-graph-main-red-sync
#   DISPATCH_FLEET_WATCH_ALARM_CMD      recording stub for dispatch-fleet-alarm
#   CLAUDE_AGENTS_CMD                   lib-claude-agents.sh's OWN `claude` seam
#                                       (lib-claude-agents.sh:355) — the real
#                                       library is sourced and really runs; only
#                                       the daemon round-trip is faked
#   DISPATCH_DECISION_LOG_FILE          lib-decision-log.sh's path seam
#   DISPATCH_PAUSE_FLAG                 lib-pause-state.sh's sentinel seam (the
#                                       REAL lib-pause-state.sh is sourced and
#                                       exercised live — it is small and its
#                                       tri-state is load-bearing here)
#   DISPATCH_FLEET_WATCH_STATE_FILE     cross-pass span state
#   DISPATCH_FLEET_WATCH_HOLDALERT_CMD  stub for predicate 5's enumerator
#                                       (list-unclaimed-hold-alerts.ts) — the
#                                       whole invocation, no args appended
#   DISPATCH_GRAPH_MAIN_WORKTREE        lib-graph-worktree.sh's root override,
#                                       so resolve_main_worktree never reaches
#                                       the real repo (and predicate 5's
#                                       worktree probes stay inside $WORK)
#   DISPATCH_RESERVATION_DIR            lib-reservation-ledger.sh's ledger dir
#
# No systemd, no real `claude` daemon, no git remote, no graph write — only bash
# + jq. Run under bash, never zsh.

set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="$HARNESS_DIR/dispatch-fleet-watch"
[[ -f "$SCRIPT" ]] || { echo "error: dispatch-fleet-watch not found at $SCRIPT" >&2; exit 1; }

WORK="$(mktemp -d)" || { echo "error: mktemp failed" >&2; exit 1; }
cleanup() { chmod -R 755 "$WORK" 2>/dev/null; rm -rf "$WORK"; }
trap cleanup EXIT

PASS=0; FAIL=0
ok() { echo "PASS: $1"; PASS=$((PASS + 1)); }
no() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }
assert_eq() { # <label> <expected> <actual>
  if [[ "$2" == "$3" ]]; then ok "$1"; else no "$1 (expected '$2', got '$3')"; fi
}
assert_contains() { # <label> <needle> <haystack>
  if [[ "$3" == *"$2"* ]]; then ok "$1"; else no "$1 (missing '$2')"; fi
}
assert_not_contains() { # <label> <needle> <haystack>
  if [[ "$3" != *"$2"* ]]; then ok "$1"; else no "$1 (unexpectedly present: '$2')"; fi
}

# --- stubs ------------------------------------------------------------------
BIN="$WORK/bin"; mkdir -p "$BIN"

# dispatch-daemon-liveness stub: emits a --json reading and exits with
# STUB_LIVENESS_RC (the sensor's documented enum: 0/2/3/4, 69 environment).
cat > "$BIN/liveness" <<'STUB'
#!/usr/bin/env bash
rc="${STUB_LIVENESS_RC:-0}"
verdict="${STUB_LIVENESS_VERDICT:-managed-live}"
reason="${STUB_LIVENESS_REASON:-}"
if [[ "${STUB_LIVENESS_NOJSON:-0}" != "1" ]]; then
  jq -n --arg v "$verdict" --argjson c "$rc" --arg r "$reason" \
    '{verdict:$v, exit_code:$c, degraded_reason:(if $r=="" then null else $r end)}'
fi
exit "$rc"
STUB
chmod +x "$BIN/liveness"

# dispatch-graph-main-red-sync stub: ALWAYS exits 0 (its real contract); the
# signal is entirely in stdout. It also records its argv to $REDSYNC_ARGV_LOG so
# cases can assert the watcher invoked it in its WRITE-FREE --read-only mode —
# unflagged, the real script completes the open tactic-main-red-* nodes and
# thereby re-arms the auto-merge gate from inside a watchdog pass.
cat > "$BIN/redsync" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "${REDSYNC_ARGV_LOG:-/dev/null}"
[[ -n "${STUB_REDSYNC_OUT:-}" ]] && printf '%s\n' "$STUB_REDSYNC_OUT"
exit 0
STUB
chmod +x "$BIN/redsync"

# dispatch-fleet-alarm recording stub: appends its argv to $ALARM_LOG, one
# invocation per line, so cases can assert exactly which kinds fired and which
# resolved. When $ALARM_BODY_DIR is set it also files each --body-file under its
# kind, so a case can compare the bodies two passes emit BYTE-FOR-BYTE (the
# real dispatch-fleet-alarm skips its commit only when the body is unchanged,
# so a body carrying a live span would push to origin/main every pass).
cat > "$BIN/alarm" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$ALARM_LOG"
if [[ -n "${ALARM_BODY_DIR:-}" ]]; then
  mkdir -p "$ALARM_BODY_DIR"
  kind=""; prev=""
  for a in "$@"; do
    [[ "$prev" == "--kind" ]] && kind="$a"
    [[ "$prev" == "--body-file" && -n "$kind" ]] && cp "$a" "$ALARM_BODY_DIR/$kind.body"
    prev="$a"
  done
fi
exit "${STUB_ALARM_RC:-0}"
STUB
chmod +x "$BIN/alarm"

# predicate 5's enumerator stub (list-unclaimed-hold-alerts.ts). The watcher
# runs it with NO arguments appended, so the stub takes none. STUB_HOLDALERT_OUT
# is the raw 7-column TSV; STUB_HOLDALERT_RC fakes an enumeration failure.
cat > "$BIN/holdalert" <<'STUB'
#!/usr/bin/env bash
[[ -n "${STUB_HOLDALERT_OUT:-}" ]] && printf '%s\n' "$STUB_HOLDALERT_OUT"
exit "${STUB_HOLDALERT_RC:-0}"
STUB
chmod +x "$BIN/holdalert"

# `claude` stub — lib-claude-agents.sh's own CLAUDE_AGENTS_CMD seam. Handles
# both `agents --json` (the ACTIVE view: the snapshot capture and the busy count
# that reads it) and `agents --json --all` (the REGISTERED view, which is what
# worktree_has_live_session — predicate 5's claim ladder — actually reads).
# STUB_AGENTS_FAIL=1 makes the daemon query fail, which is exactly how the real
# library produces its UNKNOWN busy count.
# THE TWO VIEWS MUST BE INDEPENDENTLY FAILABLE. They are separate daemon queries
# over separate snapshot variables, and a stub that answers both from one fixture
# cannot see a predicate gating on the wrong one: STUB_AGENTS_ALL_FAIL=1 fails
# ONLY the `--all` query, leaving the active view healthy.
cat > "$BIN/claude" <<'STUB'
#!/usr/bin/env bash
[[ "${STUB_AGENTS_FAIL:-0}" == "1" ]] && exit 1
for a in "$@"; do
  if [[ "$a" == "--all" ]]; then
    [[ "${STUB_AGENTS_ALL_FAIL:-0}" == "1" ]] && exit 1
  fi
done
printf '%s\n' "${STUB_AGENTS_JSON:-[]}"
STUB
chmod +x "$BIN/claude"

# agents_json <busy-worker-count> — build a session array with N busy workers
# named in the worker keyspace, plus one busy `dispatch-*` router and one busy
# human session that the keyspace filter must NOT count.
agents_json() {
  local n="$1" i out='[{"name":"dispatch-abc123","status":"busy"},{"name":"my-scratch","status":"busy"}]'
  for ((i = 0; i < n; i++)); do
    out=$(jq -c --arg nm "$((100 + i))-some-slug" '. + [{name:$nm, status:"busy"}]' <<<"$out")
  done
  printf '%s' "$out"
}

NOW=$(date -u +%s)
iso() { date -u -d "@$1" +%FT%TZ; }

# --- case runner -------------------------------------------------------------
# Every external touchpoint is injected. RUN_OUT / RUN_RC / ALARM_LOG carry the
# result. Extra args (e.g. --json) are forwarded to the script.
run_case() {
  ALARM_LOG="$WORK/alarm-$RANDOM-$RANDOM.log"; : > "$ALARM_LOG"
  REDSYNC_ARGV_LOG="$WORK/redsync-argv-$RANDOM-$RANDOM.log"; : > "$REDSYNC_ARGV_LOG"
  set +e
  RUN_OUT="$(
    ALARM_LOG="$ALARM_LOG" \
    ALARM_BODY_DIR="${ALARM_BODY_DIR:-}" \
    REDSYNC_ARGV_LOG="$REDSYNC_ARGV_LOG" \
    DISPATCH_FLEET_WATCH_LIVENESS_CMD="$BIN/liveness" \
    DISPATCH_FLEET_WATCH_REDSYNC_CMD="$BIN/redsync" \
    DISPATCH_FLEET_WATCH_ALARM_CMD="$BIN/alarm" \
    CLAUDE_AGENTS_CMD="$BIN/claude" \
    DISPATCH_DECISION_LOG_FILE="$LOGFILE" \
    DISPATCH_PAUSE_FLAG="$PAUSEFLAG" \
    DISPATCH_FLEET_WATCH_STATE_FILE="$STATEFILE" \
    DISPATCH_FLEET_WATCH_HOLDALERT_CMD="$BIN/holdalert" \
    DISPATCH_GRAPH_MAIN_WORKTREE="$CASEDIR" \
    DISPATCH_RESERVATION_DIR="$RESVDIR" \
    STUB_HOLDALERT_OUT="${STUB_HOLDALERT_OUT:-}" \
    STUB_HOLDALERT_RC="${STUB_HOLDALERT_RC:-0}" \
    STUB_LIVENESS_RC="${STUB_LIVENESS_RC:-0}" \
    STUB_LIVENESS_VERDICT="${STUB_LIVENESS_VERDICT:-}" \
    STUB_LIVENESS_REASON="${STUB_LIVENESS_REASON:-}" \
    STUB_LIVENESS_NOJSON="${STUB_LIVENESS_NOJSON:-0}" \
    STUB_REDSYNC_OUT="${STUB_REDSYNC_OUT:-}" \
    STUB_AGENTS_JSON="${STUB_AGENTS_JSON:-[]}" \
    STUB_AGENTS_FAIL="${STUB_AGENTS_FAIL:-0}" \
    STUB_AGENTS_ALL_FAIL="${STUB_AGENTS_ALL_FAIL:-0}" \
    STUB_ALARM_RC="${STUB_ALARM_RC:-0}" \
    bash "$SCRIPT" "$@" 2>/dev/null
  )"
  RUN_RC=$?
  set -e
  ALARMS="$(cat "$ALARM_LOG")"
  REDSYNC_ARGV="$(cat "$REDSYNC_ARGV_LOG")"
}

reset_stubs() {
  unset STUB_LIVENESS_RC STUB_LIVENESS_VERDICT STUB_LIVENESS_REASON STUB_LIVENESS_NOJSON
  unset STUB_REDSYNC_OUT STUB_AGENTS_JSON STUB_AGENTS_FAIL STUB_AGENTS_ALL_FAIL STUB_ALARM_RC
  unset STUB_HOLDALERT_OUT STUB_HOLDALERT_RC
}

# new_env <case-name> — fresh log/pause/state paths for an isolated case.
new_env() {
  local c="$1"
  CASEDIR="$WORK/$c"; mkdir -p "$CASEDIR"
  LOGFILE="$CASEDIR/routing-decisions.jsonl"
  PAUSEDIR="$CASEDIR/state"; mkdir -p "$PAUSEDIR"
  PAUSEFLAG="$PAUSEDIR/paused"
  STATEFILE="$CASEDIR/fleet-watch-state.json"
  # Predicate 5's two other inputs: the reservation ledger (empty = nothing
  # claimed) and the worktrees root under the faked main worktree ($CASEDIR).
  RESVDIR="$CASEDIR/reservations"; mkdir -p "$RESVDIR"
  mkdir -p "$CASEDIR/.claude/worktrees"
}

fresh_log() { printf '{"ts":"%s","site":"select-tick"}\n' "$(iso $((NOW - 60)))" > "$LOGFILE"; }
stale_log() { printf '{"ts":"%s","site":"select-tick"}\n' "$(iso $((NOW - 99999)))" > "$LOGFILE"; }

# ===========================================================================
# Case 1: all five clear -> exit 0, five --resolve calls, zero finding calls.
reset_stubs; new_env case1
fresh_log
STUB_LIVENESS_RC=0 STUB_AGENTS_JSON="$(agents_json 2)" STUB_REDSYNC_OUT="" run_case
assert_eq "case1 exit code" 0 "$RUN_RC"
assert_eq "case1 resolve count" 5 "$(grep -c -- '--resolve' <<<"$ALARMS")"
assert_eq "case1 finding-alarm count" 0 "$(grep -c -- '--statement' <<<"$ALARMS")"
assert_contains "case1 reports ok" "result: ok" "$RUN_OUT"
# The latch is READ, never completed: completing it re-arms the auto-merge gate
# (dispatch-select-tick gates solely on the open set being empty), which is an
# authority the tick holds and a watchdog timer does not.
assert_contains "case1 red-sync invoked write-free (--read-only)" "--read-only" "$REDSYNC_ARGV"

# ===========================================================================
# Case 2 (ROW-O REGRESSION GUARD, the single most important case in this file):
# a fresh decision log with the liveness stub exiting 3. The daemon predicate is
# a finding; the OTHER THREE predicates must still have been evaluated. The
# historical bug returned at the first violation, leaving later predicates
# unread while the watcher looked healthy.
reset_stubs; new_env case2
fresh_log
STUB_LIVENESS_RC=3 STUB_LIVENESS_VERDICT=down STUB_AGENTS_JSON="$(agents_json 2)" STUB_REDSYNC_OUT="" run_case
assert_eq "case2 exit code (finding)" 1 "$RUN_RC"
assert_eq "case2 exactly one daemon-degraded finding" 1 "$(grep -c -- '--kind daemon-degraded --statement' <<<"$ALARMS")"
# Did the pass CONTINUE past the first violation? The other three predicates
# each read cleanly, so each must have emitted its own --resolve.
assert_eq "case2 tick-stale still evaluated (resolved)" 1 "$(grep -c -- '--resolve --kind tick-stale' <<<"$ALARMS")"
assert_eq "case2 busy-stall still evaluated (resolved)" 1 "$(grep -c -- '--resolve --kind busy-stall' <<<"$ALARMS")"
assert_eq "case2 automerge still evaluated (resolved)" 1 "$(grep -c -- '--resolve --kind automerge-suppressed' <<<"$ALARMS")"
assert_contains "case2 all four predicates in report" "automerge-suppressed:" "$RUN_OUT"
assert_not_contains "case2 daemon-degraded not resolved" "--resolve --kind daemon-degraded" "$ALARMS"

# ===========================================================================
# Case 3: stale decision log WHILE PAUSED -> tick-stale is quiet (not evaluated,
# no alarm, no resolve), exit 0.
reset_stubs; new_env case3
stale_log
touch "$PAUSEFLAG"
# `agents_json 0` (an array with no BUSY WORKERS, but non-empty) rather than a
# literal `[]`: an exactly-`[]` payload is only a definite empty read when
# lib-claude-agents.sh's daemon-process probe corroborates it, so a bare `[]`
# would make the snapshot capture UNKNOWN on some hosts and not others. The
# predicate under test here (busy-stall, quiet under pause) reads the same
# either way.
STUB_LIVENESS_RC=0 STUB_AGENTS_JSON="$(agents_json 0)" STUB_REDSYNC_OUT="" run_case
assert_eq "case3 exit code (paused, quiet)" 0 "$RUN_RC"
assert_not_contains "case3 no tick-stale finding alarm" "--kind tick-stale --statement" "$ALARMS"
assert_not_contains "case3 no tick-stale resolve either" "--resolve --kind tick-stale" "$ALARMS"
assert_contains "case3 tick predicate reported quiet" "tick-stale:           quiet" "$RUN_OUT"
# Predicates 2 and 4 still evaluate under pause.
assert_eq "case3 daemon still resolved under pause" 1 "$(grep -c -- '--resolve --kind daemon-degraded' <<<"$ALARMS")"
assert_eq "case3 automerge still resolved under pause" 1 "$(grep -c -- '--resolve --kind automerge-suppressed' <<<"$ALARMS")"

# ===========================================================================
# Case 4: pause directory unreadable (chmod 000) -> dispatch_pause_state returns
# `unknown`. Pause silences NOTHING; every predicate evaluates, a watch-unknown
# alarm fires, and the pass must not report a bare `ok`.
reset_stubs; new_env case4
fresh_log
chmod 000 "$PAUSEDIR"
STUB_LIVENESS_RC=0 STUB_AGENTS_JSON="$(agents_json 1)" STUB_REDSYNC_OUT="" run_case
chmod 755 "$PAUSEDIR"
assert_contains "case4 pause reported unknown" "pause=unknown" "$RUN_OUT"
assert_eq "case4 watch-unknown alarm fired" 1 "$(grep -c -- '--kind watch-unknown --statement' <<<"$ALARMS")"
assert_not_contains "case4 does NOT report bare ok" "result: ok" "$RUN_OUT"
if [[ "$RUN_RC" -ne 0 ]]; then ok "case4 exit is not 0"; else no "case4 exited 0 despite pause-unknown"; fi
# All five still evaluated (each read cleanly, so each resolved).
assert_eq "case4 all five predicates still evaluated" 5 "$(grep -c -- '--resolve' <<<"$ALARMS")"

# ===========================================================================
# Case 5: busy-worker count UNKNOWN (the daemon query fails) with a pre-set
# busy_zero_since. The stamp must be left EXACTLY as it was — UNKNOWN is not
# evidence of zero busy workers — the verdict is unknown, watch-unknown fires,
# and NEITHER a busy-stall finding NOR a busy-stall resolve is emitted.
reset_stubs; new_env case5
fresh_log
PRESET=$((NOW - 100))
printf '{"busy_zero_since":%s}\n' "$PRESET" > "$STATEFILE"
STUB_LIVENESS_RC=0 STUB_AGENTS_FAIL=1 STUB_REDSYNC_OUT="" run_case
assert_eq "case5 busy_zero_since unchanged" "$PRESET" "$(jq -r '.busy_zero_since' "$STATEFILE")"
assert_contains "case5 busy verdict unknown" "busy-stall:           unknown" "$RUN_OUT"
assert_eq "case5 watch-unknown alarm fired" 1 "$(grep -c -- '--kind watch-unknown --statement' <<<"$ALARMS")"
assert_not_contains "case5 no busy-stall finding" "--kind busy-stall --statement" "$ALARMS"
assert_not_contains "case5 no busy-stall resolve" "--resolve --kind busy-stall" "$ALARMS"
assert_eq "case5 exit code (unknown, no finding)" 2 "$RUN_RC"

# ===========================================================================
# Case 6: busy_zero_since older than the idle limit with busy count 0 ->
# busy-stall finding. Then a follow-up pass with busy count 2 clears the stamp
# and resolves the alarm.
reset_stubs; new_env case6
fresh_log
printf '{"busy_zero_since":%s}\n' "$((NOW - 99999))" > "$STATEFILE"
STUB_LIVENESS_RC=0 STUB_AGENTS_JSON="$(agents_json 0)" STUB_REDSYNC_OUT="" run_case
assert_eq "case6 busy-stall finding raised" 1 "$(grep -c -- '--kind busy-stall --statement' <<<"$ALARMS")"
assert_eq "case6 exit code (finding)" 1 "$RUN_RC"
# Second pass: workers are busy again.
reset_stubs
STUB_LIVENESS_RC=0 STUB_AGENTS_JSON="$(agents_json 2)" STUB_REDSYNC_OUT="" run_case
assert_eq "case6b busy_zero_since cleared" "null" "$(jq -r '.busy_zero_since // "null"' "$STATEFILE")"
assert_eq "case6b busy-stall resolved" 1 "$(grep -c -- '--resolve --kind busy-stall' <<<"$ALARMS")"
assert_eq "case6b exit code" 0 "$RUN_RC"

# ===========================================================================
# Case 7: red-sync prints the literal UNKNOWN -> verdict unknown (NOT clear),
# and no automerge-suppressed resolve. A failed graph read must never be
# laundered into "auto-merge is healthy".
reset_stubs; new_env case7
fresh_log
STUB_LIVENESS_RC=0 STUB_AGENTS_JSON="$(agents_json 1)" STUB_REDSYNC_OUT="UNKNOWN" run_case
assert_contains "case7 automerge verdict unknown" "automerge-suppressed: unknown" "$RUN_OUT"
assert_not_contains "case7 no automerge resolve" "--resolve --kind automerge-suppressed" "$ALARMS"
assert_not_contains "case7 no automerge finding" "--kind automerge-suppressed --statement" "$ALARMS"
assert_eq "case7 watch-unknown alarm fired" 1 "$(grep -c -- '--kind watch-unknown --statement' <<<"$ALARMS")"
assert_eq "case7 exit code (unknown)" 2 "$RUN_RC"

# ===========================================================================
# Case 8: red-sync reports one open node with NO prior first-seen stamp -> under
# threshold, no alarm (a short red episode is normal). Then the same stub with a
# first-seen stamp older than the suppression limit -> finding.
reset_stubs; new_env case8
fresh_log
STUB_LIVENESS_RC=0 STUB_AGENTS_JSON="$(agents_json 1)" STUB_REDSYNC_OUT="tactic-main-red-abcd1234" run_case
assert_not_contains "case8 no automerge finding on first sighting" "--kind automerge-suppressed --statement" "$ALARMS"
assert_eq "case8 exit code (still clear, under threshold)" 0 "$RUN_RC"
SS="$(jq -r '.suppression_since' "$STATEFILE")"
if [[ "$SS" =~ ^[0-9]+$ ]]; then ok "case8 suppression_since recorded"; else no "case8 suppression_since not recorded (got '$SS')"; fi
# Age the stamp past the limit.
reset_stubs
printf '{"suppression_since":%s}\n' "$((NOW - 99999))" > "$STATEFILE"
STUB_LIVENESS_RC=0 STUB_AGENTS_JSON="$(agents_json 1)" STUB_REDSYNC_OUT="tactic-main-red-abcd1234" run_case
assert_eq "case8b automerge-suppressed finding" 1 "$(grep -c -- '--kind automerge-suppressed --statement' <<<"$ALARMS")"
assert_eq "case8b exit code (finding)" 1 "$RUN_RC"

# ===========================================================================
# Case 9: --json shape (mirrors dispatch-daemon-liveness --json).
reset_stubs; new_env case9
fresh_log
STUB_LIVENESS_RC=4 STUB_LIVENESS_VERDICT=degraded STUB_LIVENESS_REASON="linger not enabled" \
  STUB_AGENTS_JSON="$(agents_json 3)" STUB_REDSYNC_OUT="" run_case --json
if jq -e . >/dev/null 2>&1 <<<"$RUN_OUT"; then ok "case9 json parses"; else no "case9 json does not parse"; fi
assert_eq "case9 json exit_code" 1 "$(jq -r '.exit_code' <<<"$RUN_OUT")"
assert_eq "case9 json daemon verdict" "finding" "$(jq -r '.predicates["daemon-degraded"].verdict' <<<"$RUN_OUT")"
assert_eq "case9 json tick verdict" "clear" "$(jq -r '.predicates["tick-stale"].verdict' <<<"$RUN_OUT")"
assert_eq "case9 json busy_count (keyspace-filtered)" "3" "$(jq -r '.predicates["busy-stall"].busy_count' <<<"$RUN_OUT")"
assert_eq "case9 json pause_state" "not-paused" "$(jq -r '.pause_state' <<<"$RUN_OUT")"

# ===========================================================================
# Case 10: unreadable decision log -> unknown, NOT clear, and no tick-stale
# resolve.
reset_stubs; new_env case10
LOGFILE="$CASEDIR/does-not-exist.jsonl"
STUB_LIVENESS_RC=0 STUB_AGENTS_JSON="$(agents_json 1)" STUB_REDSYNC_OUT="" run_case
assert_contains "case10 tick verdict unknown" "tick-stale:           unknown" "$RUN_OUT"
assert_not_contains "case10 no tick-stale resolve" "--resolve --kind tick-stale" "$ALARMS"
assert_eq "case10 watch-unknown alarm fired" 1 "$(grep -c -- '--kind watch-unknown --statement' <<<"$ALARMS")"
assert_eq "case10 exit code (unknown)" 2 "$RUN_RC"

# ===========================================================================
# Case 11: liveness exiting 69 (environment) -> unknown, not finding, not clear.
reset_stubs; new_env case11
fresh_log
STUB_LIVENESS_RC=69 STUB_LIVENESS_NOJSON=1 STUB_AGENTS_JSON="$(agents_json 1)" STUB_REDSYNC_OUT="" run_case
assert_contains "case11 daemon verdict unknown" "daemon-degraded:      unknown" "$RUN_OUT"
assert_not_contains "case11 no daemon resolve" "--resolve --kind daemon-degraded" "$ALARMS"
assert_eq "case11 watch-unknown alarm fired" 1 "$(grep -c -- '--kind watch-unknown --statement' <<<"$ALARMS")"

# ===========================================================================
# Case 12: usage error.
reset_stubs; new_env case12
fresh_log
run_case --bogus
assert_eq "case12 usage exit code" 64 "$RUN_RC"

# ===========================================================================
# Case 13 (BLINDED-WATCHDOG GUARD): the span state file cannot be WRITTEN
# (its parent directory is read-only), with zero busy workers and no prior
# stamp. Without this guard busy_zero_since is never persisted, the span
# computes as NOW-NOW=0 on every pass, the verdict is `clear`, and the pass
# resolves any live busy-stall alarm — forever, while nothing is running. The
# predicate must instead be `unknown`, naming the unwritable file.
reset_stubs; new_env case13
fresh_log
chmod 555 "$CASEDIR"
STUB_LIVENESS_RC=0 STUB_AGENTS_JSON="$(agents_json 0)" STUB_REDSYNC_OUT="" run_case
chmod 755 "$CASEDIR"
assert_contains "case13 busy verdict unknown (stamp unwritable)" "busy-stall:           unknown" "$RUN_OUT"
assert_contains "case13 detail names the state file" "$STATEFILE" "$RUN_OUT"
assert_not_contains "case13 no busy-stall resolve" "--resolve --kind busy-stall" "$ALARMS"
assert_not_contains "case13 no busy-stall finding" "--kind busy-stall --statement" "$ALARMS"
assert_eq "case13 watch-unknown alarm fired" 1 "$(grep -c -- '--kind watch-unknown --statement' <<<"$ALARMS")"
assert_not_contains "case13 does NOT report bare ok" "result: ok" "$RUN_OUT"
assert_eq "case13 exit code (unknown)" 2 "$RUN_RC"

# ===========================================================================
# Case 14: same unwritable state dir, but with an open main-red node — the
# suppression span stamp cannot be persisted either. Predicate 4 must be
# `unknown` (a never-accumulating span would report clear while the latch is
# held indefinitely), while predicate 3 stays clear (workers busy, no stamp to
# write).
reset_stubs; new_env case14
fresh_log
chmod 555 "$CASEDIR"
STUB_LIVENESS_RC=0 STUB_AGENTS_JSON="$(agents_json 1)" STUB_REDSYNC_OUT="tactic-main-red-abcd1234" run_case
chmod 755 "$CASEDIR"
assert_contains "case14 automerge verdict unknown (stamp unwritable)" "automerge-suppressed: unknown" "$RUN_OUT"
assert_not_contains "case14 no automerge resolve" "--resolve --kind automerge-suppressed" "$ALARMS"
assert_not_contains "case14 no automerge finding" "--kind automerge-suppressed --statement" "$ALARMS"
assert_eq "case14 busy still clear (nothing to write)" 1 "$(grep -c -- '--resolve --kind busy-stall' <<<"$ALARMS")"
assert_eq "case14 exit code (unknown)" 2 "$RUN_RC"

# ===========================================================================
# Case 15: the state file exists but will not PARSE. state_get must report the
# read failure rather than return "no stamp yet" — both span predicates go
# unknown, and neither resolves its alarm.
reset_stubs; new_env case15
fresh_log
printf 'not json at all\n' > "$STATEFILE"
STUB_LIVENESS_RC=0 STUB_AGENTS_JSON="$(agents_json 2)" STUB_REDSYNC_OUT="" run_case
assert_contains "case15 busy verdict unknown (state unparseable)" "busy-stall:           unknown" "$RUN_OUT"
assert_contains "case15 automerge verdict unknown (state unparseable)" "automerge-suppressed: unknown" "$RUN_OUT"
assert_not_contains "case15 no busy-stall resolve" "--resolve --kind busy-stall" "$ALARMS"
assert_not_contains "case15 no automerge resolve" "--resolve --kind automerge-suppressed" "$ALARMS"
assert_eq "case15 watch-unknown alarm fired" 1 "$(grep -c -- '--kind watch-unknown --statement' <<<"$ALARMS")"
assert_eq "case15 exit code (unknown)" 2 "$RUN_RC"

# ===========================================================================
# Case 16 (BODY-STABILITY RATCHET): two passes whose READINGS all differ, but
# whose CONDITIONS are identical, must emit byte-identical alarm bodies.
#
# dispatch-fleet-alarm commits a re-detection only when the body differs from
# the one already on origin/main. A body carrying `${TICK_AGE}s old`, an elapsed
# stall/suppression span, or the raw liveness JSON (MainPID,
# ActiveEnterTimestamp, census pids) differs on EVERY pass, so one sustained
# condition would fetch+rebase+push to main once per 5-minute timer fire — ~288
# pushes a day per kind, each arming the four required CI checks, all of it
# while the fleet is already unwell and least able to absorb it.
#
# Every input below is moved between the two passes: the decision-log timestamp,
# both span stamps. Only the thresholds, paths, node ids and pause state — the
# condition's IDENTITY — may survive into a body.
reset_stubs; new_env case16
printf '{"ts":"%s","site":"select-tick"}\n' "$(iso $((NOW - 99999)))" > "$LOGFILE"
printf '{"busy_zero_since":%s,"suppression_since":%s}\n' "$((NOW - 99999))" "$((NOW - 99999))" > "$STATEFILE"
ALARM_BODY_DIR="$CASEDIR/bodies-1"
STUB_LIVENESS_RC=3 STUB_LIVENESS_VERDICT=down STUB_LIVENESS_REASON="unit is inactive" \
  STUB_AGENTS_JSON="$(agents_json 0)" STUB_REDSYNC_OUT="tactic-main-red-abcd1234" run_case
assert_eq "case16 pass 1 exit code (four findings)" 1 "$RUN_RC"
assert_eq "case16 pass 1 raised four finding alarms" 4 "$(grep -c -- '--statement' <<<"$ALARMS")"
CASE16_OUT_1="$RUN_OUT"

printf '{"ts":"%s","site":"select-tick"}\n' "$(iso $((NOW - 88888)))" > "$LOGFILE"
printf '{"busy_zero_since":%s,"suppression_since":%s}\n' "$((NOW - 88888))" "$((NOW - 88888))" > "$STATEFILE"
ALARM_BODY_DIR="$CASEDIR/bodies-2"
reset_stubs
STUB_LIVENESS_RC=3 STUB_LIVENESS_VERDICT=down STUB_LIVENESS_REASON="unit is inactive" \
  STUB_AGENTS_JSON="$(agents_json 0)" STUB_REDSYNC_OUT="tactic-main-red-abcd1234" run_case
assert_eq "case16 pass 2 exit code (four findings)" 1 "$RUN_RC"
ALARM_BODY_DIR=""

for kind in tick-stale daemon-degraded busy-stall automerge-suppressed; do
  if [[ ! -s "$CASEDIR/bodies-1/$kind.body" || ! -s "$CASEDIR/bodies-2/$kind.body" ]]; then
    no "case16 $kind body missing from one of the passes (the ratchet would be vacuous)"
  elif cmp -s "$CASEDIR/bodies-1/$kind.body" "$CASEDIR/bodies-2/$kind.body"; then
    ok "case16 $kind body is identical across passes"
  else
    no "case16 $kind body CHURNS across passes: $(diff "$CASEDIR/bodies-1/$kind.body" "$CASEDIR/bodies-2/$kind.body" | tr '\n' ' ')"
  fi
done
# The two readings really were different — otherwise the byte-comparison above
# proves nothing (identical inputs would trivially produce identical bodies).
# The per-pass stdout report is exactly where those live numbers belong.
for line_kind in 'tick-stale:' 'busy-stall:' 'automerge-suppressed:'; do
  if [[ "$(grep -F "$line_kind" <<<"$CASE16_OUT_1")" != "$(grep -F "$line_kind" <<<"$RUN_OUT")" ]]; then
    ok "case16 $line_kind reading DID change between passes (stdout keeps the live numbers)"
  else
    no "case16 $line_kind reading did not change between passes — the body comparison above is vacuous"
  fi
done
# The raw liveness JSON must not be embedded: it is pids and unit timestamps.
assert_not_contains "case16 daemon body has no raw liveness JSON" '```json' \
  "$(cat "$CASEDIR/bodies-2/daemon-degraded.body")"
assert_not_contains "case16 busy body has no first-seen epoch stamp" "$((NOW - 88888))" \
  "$(cat "$CASEDIR/bodies-2/busy-stall.body")"
# ...but the offending node id IS identity and must survive.
assert_contains "case16 automerge body still names the offending node" "tactic-main-red-abcd1234" \
  "$(cat "$CASEDIR/bodies-2/automerge-suppressed.body")"

# ===========================================================================
# Predicate 5 (unclaimed-hold). The enumerator is stubbed through
# DISPATCH_FLEET_WATCH_HOLDALERT_CMD, the claim ladder through the `claude`
# stub (live sessions) and an empty $RESVDIR (reservations).
#
# hold_row <hold-id> <source-id> <kind> <age> <tier> <band> [score] — one
# enumerator TSV line, built with real TABs so the watcher's `IFS=$'\t' read`
# sees the same seven columns list-unclaimed-hold-alerts.ts emits. `score` is the
# column appended when the resolved rank became the (tier, band, score, depth)
# quadruple; it defaults to 0 so a case that does not care about it stays terse.
hold_row() {
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s' "$1" "$2" "$3" "$4" "$5" "$6" "${7:-0}"
}

# Case 18: one unclaimed candidate, no live session, empty reservation ledger
# -> exactly one unclaimed-hold finding alarm, exit 1.
reset_stubs; new_env case18
fresh_log
STUB_LIVENESS_RC=0 STUB_AGENTS_JSON="$(agents_json 1)" STUB_REDSYNC_OUT="" \
  STUB_HOLDALERT_OUT="$(hold_row tactic-hold-review-alpha tactic-alpha review 90000 A 12.5)" run_case
assert_eq "case18 exactly one unclaimed-hold finding" 1 \
  "$(grep -c -- '--kind unclaimed-hold --statement' <<<"$ALARMS")"
assert_not_contains "case18 no unclaimed-hold resolve" "--resolve --kind unclaimed-hold" "$ALARMS"
assert_contains "case18 verdict is finding" "unclaimed-hold:       finding" "$RUN_OUT"
assert_eq "case18 exit code (finding)" 1 "$RUN_RC"

# ===========================================================================
# Case 19: the enumerator emits nothing -> clear, exactly one resolve, exit 0.
reset_stubs; new_env case19
fresh_log
STUB_LIVENESS_RC=0 STUB_AGENTS_JSON="$(agents_json 1)" STUB_REDSYNC_OUT="" run_case
assert_eq "case19 exactly one unclaimed-hold resolve" 1 \
  "$(grep -c -- '--resolve --kind unclaimed-hold' <<<"$ALARMS")"
assert_not_contains "case19 no unclaimed-hold finding" "--kind unclaimed-hold --statement" "$ALARMS"
assert_contains "case19 verdict is clear" "unclaimed-hold:       clear" "$RUN_OUT"
assert_eq "case19 exit code (clear)" 0 "$RUN_RC"

# ===========================================================================
# Case 20 (THE "UNCLAIMED" HALF): the same candidate, but a live session is
# registered under the SOURCE's worktree basename. Somebody is on it, so this is
# not an unclaimed hold — verdict clear, resolve issued, no finding.
reset_stubs; new_env case20
fresh_log
CLAIMED_AGENTS="$(jq -c '. + [{sessionId:"sid-1", name:"tactic-alpha", status:"busy", state:"running"}]' <<<"$(agents_json 1)")"
STUB_LIVENESS_RC=0 STUB_AGENTS_JSON="$CLAIMED_AGENTS" STUB_REDSYNC_OUT="" \
  STUB_HOLDALERT_OUT="$(hold_row tactic-hold-review-alpha tactic-alpha review 90000 A 12.5)" run_case
assert_contains "case20 verdict clear (source is claimed)" "unclaimed-hold:       clear" "$RUN_OUT"
assert_eq "case20 unclaimed-hold resolved" 1 "$(grep -c -- '--resolve --kind unclaimed-hold' <<<"$ALARMS")"
assert_not_contains "case20 no unclaimed-hold finding" "--kind unclaimed-hold --statement" "$ALARMS"

# ===========================================================================
# Case 21: the enumerator FAILS (exit 2). An enumeration that could not run is
# unknown, never clear: no unclaimed-hold alarm, no resolve, watch-unknown
# raised, exit 2. A failed read must never launder into "no unclaimed holds".
reset_stubs; new_env case21
fresh_log
STUB_LIVENESS_RC=0 STUB_AGENTS_JSON="$(agents_json 1)" STUB_REDSYNC_OUT="" \
  STUB_HOLDALERT_RC=2 run_case
assert_contains "case21 verdict unknown" "unclaimed-hold:       unknown" "$RUN_OUT"
assert_not_contains "case21 no unclaimed-hold finding" "--kind unclaimed-hold --statement" "$ALARMS"
assert_not_contains "case21 no unclaimed-hold resolve" "--resolve --kind unclaimed-hold" "$ALARMS"
assert_eq "case21 watch-unknown alarm fired" 1 "$(grep -c -- '--kind watch-unknown --statement' <<<"$ALARMS")"
assert_not_contains "case21 does NOT report bare ok" "result: ok" "$RUN_OUT"
assert_eq "case21 exit code (unknown)" 2 "$RUN_RC"

# ===========================================================================
# Case 22 (BODY-STABILITY RATCHET for predicate 5): two passes over the SAME
# hold/source pair whose readings differ — a different unclaimed age and a
# different resolved source tier/value — must emit a byte-identical body. The
# resolved attention values move on essentially every graph commit, so a body
# carrying them would fetch/rebase/push to origin/main once per 5-minute pass.
reset_stubs; new_env case22
fresh_log
ALARM_BODY_DIR="$CASEDIR/bodies-1"
STUB_LIVENESS_RC=0 STUB_AGENTS_JSON="$(agents_json 1)" STUB_REDSYNC_OUT="" \
  STUB_HOLDALERT_OUT="$(hold_row tactic-hold-review-alpha tactic-alpha review 90000 A 12.5)" run_case
assert_eq "case22 pass 1 raised the unclaimed-hold finding" 1 \
  "$(grep -c -- '--kind unclaimed-hold --statement' <<<"$ALARMS")"
CASE22_OUT_1="$RUN_OUT"
ALARM_BODY_DIR="$CASEDIR/bodies-2"
reset_stubs
STUB_LIVENESS_RC=0 STUB_AGENTS_JSON="$(agents_json 1)" STUB_REDSYNC_OUT="" \
  STUB_HOLDALERT_OUT="$(hold_row tactic-hold-review-alpha tactic-alpha review 178000 B 41.25)" run_case
ALARM_BODY_DIR=""
if [[ ! -s "$CASEDIR/bodies-1/unclaimed-hold.body" || ! -s "$CASEDIR/bodies-2/unclaimed-hold.body" ]]; then
  no "case22 unclaimed-hold body missing from one of the passes (the ratchet would be vacuous)"
elif cmp -s "$CASEDIR/bodies-1/unclaimed-hold.body" "$CASEDIR/bodies-2/unclaimed-hold.body"; then
  ok "case22 unclaimed-hold body is identical across passes"
else
  no "case22 unclaimed-hold body CHURNS across passes: $(diff "$CASEDIR/bodies-1/unclaimed-hold.body" "$CASEDIR/bodies-2/unclaimed-hold.body" | tr '\n' ' ')"
fi
# The readings really did differ, or the byte-comparison above proves nothing.
if [[ "$(grep -F 'unclaimed-hold:' <<<"$CASE22_OUT_1")" != "$(grep -F 'unclaimed-hold:' <<<"$RUN_OUT")" ]]; then
  ok "case22 unclaimed-hold reading DID change between passes (stdout keeps the live numbers)"
else
  no "case22 unclaimed-hold reading did not change between passes — the body comparison above is vacuous"
fi
CASE22_BODY="$(cat "$CASEDIR/bodies-2/unclaimed-hold.body")"
assert_not_contains "case22 body carries no unclaimed age" "178000" "$CASE22_BODY"
assert_not_contains "case22 body carries no resolved attention value" "41.25" "$CASE22_BODY"
# ...but the offending pair IS the condition's identity and must survive.
assert_contains "case22 body names the offending hold" "tactic-hold-review-alpha" "$CASE22_BODY"
assert_contains "case22 body names the blocked source" "tactic-alpha" "$CASE22_BODY"

# ===========================================================================
# Case 23: PAUSED. Predicate 5 still evaluates (paused scheduling with
# manual-only dispatch is a standing operating mode, and a top-ranked node
# blocked by an unclaimed hold is exactly what the human driving it needs), and
# its verdict carries the pause state rather than going quiet.
reset_stubs; new_env case23
fresh_log
touch "$PAUSEFLAG"
ALARM_BODY_DIR="$CASEDIR/bodies"
STUB_LIVENESS_RC=0 STUB_AGENTS_JSON="$(agents_json 1)" STUB_REDSYNC_OUT="" \
  STUB_HOLDALERT_OUT="$(hold_row tactic-hold-review-alpha tactic-alpha review 90000 A 12.5)" run_case
ALARM_BODY_DIR=""
assert_contains "case23 predicate 5 evaluated under pause" "unclaimed-hold:       finding" "$RUN_OUT"
assert_not_contains "case23 predicate 5 is NOT quiet under pause" "unclaimed-hold:       quiet" "$RUN_OUT"
assert_eq "case23 unclaimed-hold finding raised under pause" 1 \
  "$(grep -c -- '--kind unclaimed-hold --statement' <<<"$ALARMS")"
assert_contains "case23 verdict tagged with the pause state" "Pause state: paused" \
  "$(cat "$CASEDIR/bodies/unclaimed-hold.body")"
# Predicate 1 is still quiet under pause — pause did not stop meaning anything.
assert_contains "case23 tick-stale still quiet under pause" "tick-stale:           quiet" "$RUN_OUT"

# ===========================================================================
# Case 24 (WRONG-INPUT GUARD, the false-all-clear this predicate exists to
# prevent): the ACTIVE view reads fine but the REGISTERED view (`--all`) — the
# only view predicate 5's claim ladder reads — is unreadable, with a genuine
# unclaimed candidate present. Gating on the active view's readability would let
# every `--all` probe return UNKNOWN, fold every candidate to "claimed", and
# report `clear` — which does not merely suppress the alarm, it RESOLVES an
# already-open unclaimed-hold node. The verdict must be unknown: no finding, no
# resolve, watch-unknown raised.
reset_stubs; new_env case24
fresh_log
STUB_LIVENESS_RC=0 STUB_AGENTS_JSON="$(agents_json 1)" STUB_AGENTS_ALL_FAIL=1 STUB_REDSYNC_OUT="" \
  STUB_HOLDALERT_OUT="$(hold_row tactic-hold-review-alpha tactic-alpha review 90000 A 12.5)" run_case
assert_contains "case24 verdict unknown (registered view unreadable)" "unclaimed-hold:       unknown" "$RUN_OUT"
assert_not_contains "case24 verdict is NOT a false clear" "unclaimed-hold:       clear" "$RUN_OUT"
assert_not_contains "case24 no unclaimed-hold resolve" "--resolve --kind unclaimed-hold" "$ALARMS"
assert_not_contains "case24 no unclaimed-hold finding" "--kind unclaimed-hold --statement" "$ALARMS"
assert_eq "case24 watch-unknown alarm fired" 1 "$(grep -c -- '--kind watch-unknown --statement' <<<"$ALARMS")"
assert_eq "case24 exit code (unknown)" 2 "$RUN_RC"
# The ACTIVE view really was healthy, or the case proves nothing about WHICH
# view the gate consults: predicate 3 read it and produced a definite verdict.
assert_not_contains "case24 busy-stall still read the active view" "busy-stall:           unknown" "$RUN_OUT"

# ===========================================================================
# Case 17 (DOCTRINE RATCHET): the watcher must never fleet-halt. Grep the
# finished script source and fail if it ever grows a pause-sentinel write, an
# office-hours park field write, or a blocking-edge field write. Its only graph
# side effect is dispatch-fleet-alarm on its own tactic-fleet-alarm-<kind> nodes.
SRC="$(cat "$SCRIPT")"
if grep -Eq '(>|>>)[[:space:]]*"?\$\{?DISPATCH_PAUSE_FLAG|(touch|tee|printf[^|]*>)[^|]*\$\{?DISPATCH_PAUSE_FLAG' "$SCRIPT"; then
  no "ratchet: script writes the pause sentinel (\$DISPATCH_PAUSE_FLAG)"
else
  ok "ratchet: no pause-sentinel write"
fi
# shellcheck disable=SC2016 — the field names are matched literally.
if grep -q 'office_hours' "$SCRIPT"; then
  no "ratchet: script contains an office_hours literal (a watcher must not park nodes)"
else
  ok "ratchet: no office_hours literal"
fi
if grep -q 'blocked_by' "$SCRIPT"; then
  no "ratchet: script contains a blocked_by literal (a watcher must not write blocking edges)"
else
  ok "ratchet: no blocked_by literal"
fi
if grep -Eq 'dispatch-(stop|pause)\b' "$SCRIPT"; then
  no "ratchet: script references a dispatch-stop/dispatch-pause mechanism"
else
  ok "ratchet: no dispatch-stop/dispatch-pause reference"
fi

# The mirror-image rule: the watcher must never fleet-RESUME either. Every
# predicate input must be read through a write-free path, so no command with a
# known graph-write side effect may be invoked at all. Comment lines are
# stripped first — the header DISCUSSES these mechanisms at length, and a
# doctrine ratchet that forbids naming the hazard would just get the
# explanation deleted.
NONCOMMENT="$WORK/fleet-watch-noncomment.sh"
grep -v '^[[:space:]]*#' "$SCRIPT" > "$NONCOMMENT"
if grep -Eq 'graph-commit|write-node\.ts|dump-node\.ts|park-node|clear-park|transition-node|demote-node|dispatch-graph-execute|dispatch-apply-office-hours|dispatch-mark-deviation|dispatch-complete-phase' "$NONCOMMENT"; then
  no "ratchet: script invokes a command with a known graph-write side effect (only dispatch-fleet-alarm may write)"
else
  ok "ratchet: no known graph-write command invoked"
fi
# dispatch-graph-main-red-sync is the subtle one: it LOOKS like a sensor, but
# unflagged it completes the open tactic-main-red-* nodes once repo-health reads
# green — which re-arms auto-merge and lands PRs on main. Every invocation must
# carry --read-only. Counting (rather than a bare presence test) also fails if a
# SECOND, unflagged call is ever added beside the flagged one, and the >=1 floor
# fails if a rename silently makes this ratchet vacuous.
REDSYNC_CALLS=$(grep -c '"\$REDSYNC_CMD"' "$NONCOMMENT")
REDSYNC_RO_CALLS=$(grep -c '"\$REDSYNC_CMD" --read-only' "$NONCOMMENT")
if [[ "$REDSYNC_CALLS" -ge 1 && "$REDSYNC_CALLS" -eq "$REDSYNC_RO_CALLS" ]]; then
  ok "ratchet: every red-sync invocation is --read-only"
else
  no "ratchet: red-sync invoked without --read-only ($REDSYNC_CALLS call(s), $REDSYNC_RO_CALLS flagged) — that call completes the main-red latch and re-arms auto-merge"
fi

# ---------------------------------------------------------------------------
echo ""
echo "================================"
echo "Results: $PASS passed, $FAIL failed"
echo "================================"
[[ "$FAIL" -eq 0 ]]
