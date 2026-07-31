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
# signal is entirely in stdout.
cat > "$BIN/redsync" <<'STUB'
#!/usr/bin/env bash
[[ -n "${STUB_REDSYNC_OUT:-}" ]] && printf '%s\n' "$STUB_REDSYNC_OUT"
exit 0
STUB
chmod +x "$BIN/redsync"

# dispatch-fleet-alarm recording stub: appends its argv to $ALARM_LOG, one
# invocation per line, so cases can assert exactly which kinds fired and which
# resolved.
cat > "$BIN/alarm" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$ALARM_LOG"
exit "${STUB_ALARM_RC:-0}"
STUB
chmod +x "$BIN/alarm"

# `claude` stub — lib-claude-agents.sh's own CLAUDE_AGENTS_CMD seam. Handles
# both `agents --json` (the snapshot capture) and the busy count that reads it.
# STUB_AGENTS_FAIL=1 makes the daemon query fail, which is exactly how the real
# library produces its UNKNOWN busy count.
cat > "$BIN/claude" <<'STUB'
#!/usr/bin/env bash
[[ "${STUB_AGENTS_FAIL:-0}" == "1" ]] && exit 1
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
  set +e
  RUN_OUT="$(
    ALARM_LOG="$ALARM_LOG" \
    DISPATCH_FLEET_WATCH_LIVENESS_CMD="$BIN/liveness" \
    DISPATCH_FLEET_WATCH_REDSYNC_CMD="$BIN/redsync" \
    DISPATCH_FLEET_WATCH_ALARM_CMD="$BIN/alarm" \
    CLAUDE_AGENTS_CMD="$BIN/claude" \
    DISPATCH_DECISION_LOG_FILE="$LOGFILE" \
    DISPATCH_PAUSE_FLAG="$PAUSEFLAG" \
    DISPATCH_FLEET_WATCH_STATE_FILE="$STATEFILE" \
    STUB_LIVENESS_RC="${STUB_LIVENESS_RC:-0}" \
    STUB_LIVENESS_VERDICT="${STUB_LIVENESS_VERDICT:-}" \
    STUB_LIVENESS_REASON="${STUB_LIVENESS_REASON:-}" \
    STUB_LIVENESS_NOJSON="${STUB_LIVENESS_NOJSON:-0}" \
    STUB_REDSYNC_OUT="${STUB_REDSYNC_OUT:-}" \
    STUB_AGENTS_JSON="${STUB_AGENTS_JSON:-[]}" \
    STUB_AGENTS_FAIL="${STUB_AGENTS_FAIL:-0}" \
    STUB_ALARM_RC="${STUB_ALARM_RC:-0}" \
    bash "$SCRIPT" "$@" 2>/dev/null
  )"
  RUN_RC=$?
  set -e
  ALARMS="$(cat "$ALARM_LOG")"
}

reset_stubs() {
  unset STUB_LIVENESS_RC STUB_LIVENESS_VERDICT STUB_LIVENESS_REASON STUB_LIVENESS_NOJSON
  unset STUB_REDSYNC_OUT STUB_AGENTS_JSON STUB_AGENTS_FAIL STUB_ALARM_RC
}

# new_env <case-name> — fresh log/pause/state paths for an isolated case.
new_env() {
  local c="$1"
  CASEDIR="$WORK/$c"; mkdir -p "$CASEDIR"
  LOGFILE="$CASEDIR/routing-decisions.jsonl"
  PAUSEDIR="$CASEDIR/state"; mkdir -p "$PAUSEDIR"
  PAUSEFLAG="$PAUSEDIR/paused"
  STATEFILE="$CASEDIR/fleet-watch-state.json"
}

fresh_log() { printf '{"ts":"%s","site":"select-tick"}\n' "$(iso $((NOW - 60)))" > "$LOGFILE"; }
stale_log() { printf '{"ts":"%s","site":"select-tick"}\n' "$(iso $((NOW - 99999)))" > "$LOGFILE"; }

# ===========================================================================
# Case 1: all four clear -> exit 0, four --resolve calls, zero finding calls.
reset_stubs; new_env case1
fresh_log
STUB_LIVENESS_RC=0 STUB_AGENTS_JSON="$(agents_json 2)" STUB_REDSYNC_OUT="" run_case
assert_eq "case1 exit code" 0 "$RUN_RC"
assert_eq "case1 resolve count" 4 "$(grep -c -- '--resolve' <<<"$ALARMS")"
assert_eq "case1 finding-alarm count" 0 "$(grep -c -- '--statement' <<<"$ALARMS")"
assert_contains "case1 reports ok" "result: ok" "$RUN_OUT"

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
STUB_LIVENESS_RC=0 STUB_AGENTS_JSON="[]" STUB_REDSYNC_OUT="" run_case
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
# All four still evaluated (each read cleanly, so each resolved).
assert_eq "case4 all four predicates still evaluated" 4 "$(grep -c -- '--resolve' <<<"$ALARMS")"

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
# Case 13 (DOCTRINE RATCHET): the watcher must never fleet-halt. Grep the
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

# ---------------------------------------------------------------------------
echo ""
echo "================================"
echo "Results: $PASS passed, $FAIL failed"
echo "================================"
[[ "$FAIL" -eq 0 ]]
