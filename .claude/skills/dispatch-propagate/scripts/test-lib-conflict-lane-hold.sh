#!/usr/bin/env bash
# Tests for lib-conflict-lane-hold.sh — the sweep that turns a /dispatch-conflict
# Lane 3 session which died without declaring a terminal disposition into a
# tracked, human-visible hold.
#
# Everything the sweep touches is faked: `claude agents --json --all` via
# CLAUDE_AGENTS_CMD (a small script printing a controlled registry array, which
# also TOUCHES a sentinel file so a test can assert the daemon was never
# queried), the sidecar dir via DISPATCH_CONFLICT_LANE_ROOT, the transcript store
# via DISPATCH_CONFLICT_LANE_PROJECTS_ROOT (files whose mtime `touch -d` sets),
# `hold-node` via DISPATCH_CONFLICT_LANE_HOLD_NODE (an argv logger with a
# test-controlled exit code that also copies out the reason/recommendation files
# before the sweep deletes their tempdir), and the clock via
# DISPATCH_CONFLICT_LANE_NOW_EPOCH.
#
# conflict_lane_hold_sweep always returns 0, but every call is still wrapped in
# an `if` to capture the code — the test shell runs under `set -e` — and EVERY
# case asserts that 0.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# shellcheck source=/dev/null
source "$SCRIPT_DIR/lib-claude-agents.sh"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/lib-conflict-lane-hold.sh"

echo "=== lib-conflict-lane-hold.sh ==="

# A fixed clock for every test. Transcript mtimes and marker stamps are
# expressed relative to it. The default grace is 1800s.
CL_NOW=1700000000

CL_DIR=""
CL_ROOT=""
CL_PROJ=""
CL_FAKE=""
CL_HOLD=""
CL_HOLDLOG=""
CL_QUERIED=""
CL_ENTRIES=()
CL_RC=0
CL_ERR=""

cl_setup() {
  CL_DIR=$(mktemp -d)
  CL_ROOT="$CL_DIR/worktrees"
  CL_PROJ="$CL_DIR/projects"
  CL_FAKE="$CL_DIR/fake-claude"
  CL_HOLD="$CL_DIR/fake-hold-node"
  CL_HOLDLOG="$CL_DIR/hold-node.log"
  CL_QUERIED="$CL_DIR/daemon-queried"
  CL_ENTRIES=()
  mkdir -p "$CL_ROOT" "$CL_PROJ/proj-a" "$CL_DIR/decisions"
  : > "$CL_HOLDLOG"

  # The sweep queries the daemon directly with --all; make sure no tick snapshot
  # is in scope regardless.
  unset DISPATCH_AGENTS_SNAPSHOT || true

  DISPATCH_CONFLICT_LANE_NOW_EPOCH="$CL_NOW"
  DISPATCH_CONFLICT_LANE_ROOT="$CL_ROOT"
  DISPATCH_CONFLICT_LANE_PROJECTS_ROOT="$CL_PROJ"
  DISPATCH_CONFLICT_LANE_HOLD_NODE="$CL_HOLD"
  unset DISPATCH_CONFLICT_LANE_GRACE_S || true
  unset DISPATCH_CONFLICT_LANE_HOLD_MAX || true

  # lib-decision-log.sh resolves DECISION_LOG_FILE ONCE, at source time, inside
  # its load guard — so a per-test DISPATCH_DECISION_LOG_DIR set after sourcing
  # would not be read. Set the env var for documentation/parity and re-point the
  # already-resolved variable at the same scratch path.
  DISPATCH_DECISION_LOG_DIR="$CL_DIR/decisions"
  DECISION_LOG_FILE="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"

  cl_write_hold_node 0
}

cl_teardown() {
  rm -rf "$CL_DIR"
  CL_DIR=""
  unset CLAUDE_AGENTS_CMD || true
  unset DISPATCH_CONFLICT_LANE_NOW_EPOCH DISPATCH_CONFLICT_LANE_ROOT \
        DISPATCH_CONFLICT_LANE_PROJECTS_ROOT DISPATCH_CONFLICT_LANE_HOLD_NODE \
        DISPATCH_CONFLICT_LANE_GRACE_S DISPATCH_CONFLICT_LANE_HOLD_MAX \
        DISPATCH_DECISION_LOG_DIR || true
}

# cl_write_hold_node <exit-code> — install the fake hold-node: it logs its argc
# and full argv, copies the reason/recommendation files out (the sweep rm -rf's
# their tempdir immediately after the call), then exits <exit-code>.
cl_write_hold_node() {
  cat > "$CL_HOLD" <<HOLD
#!/usr/bin/env bash
{
  printf 'ARGC=%s\n' "\$#"
  printf 'ARGV=%s\n' "\$*"
} >> "$CL_HOLDLOG"
while [[ \$# -gt 0 ]]; do
  case "\$1" in
    --reason-file) cat "\$2" >> "$CL_DIR/reason.txt"; shift 2 ;;
    --recommendation-file) cat "\$2" >> "$CL_DIR/rec.txt"; shift 2 ;;
    *) shift ;;
  esac
done
printf 'held tactic-hold-x (NONE)\n'
exit $1
HOLD
  chmod +x "$CL_HOLD"
}

# cl_add_session <sid> <name> [state] — append one registry entry. [state]
# defaults to "working" (which claude_session_id_is_live classifies as `live`);
# pass "done" for the terminal-but-not-removed shape this sweep hunts.
cl_add_session() {
  local sid="$1" name="$2" state="${3-working}"
  CL_ENTRIES+=("{\"sessionId\":\"$sid\",\"name\":\"$name\",\"state\":\"$state\",\"cwd\":\"/tmp/$name\"}")
}

# cl_install_claude [exit-code] — install the fake `claude`. It TOUCHES the
# daemon-queried sentinel on every invocation, so a test can assert the sweep
# made no daemon call at all.
cl_install_claude() {
  local exit_code="${1:-0}" payload
  payload=$( IFS=,; printf '[%s]' "${CL_ENTRIES[*]}" )
  printf '%s' "$payload" > "$CL_DIR/payload.json"
  cat > "$CL_FAKE" <<FAKE
#!/usr/bin/env bash
touch "$CL_QUERIED"
cat "$CL_DIR/payload.json"
exit $exit_code
FAKE
  chmod +x "$CL_FAKE"
  CLAUDE_AGENTS_CMD="$CL_FAKE"
}

# cl_write_marker <id> <spawned-epoch> — write the sidecar marker
# dispatch-graph-execute writes on a successful Lane 3 kick.
cl_write_marker() {
  printf 'spawned=%s\n' "$2" > "$CL_ROOT/$1.conflict-lane"
}

cl_marker_exists() {
  [[ -f "$CL_ROOT/$1.conflict-lane" ]] && printf 'yes' || printf 'no'
}

# cl_write_transcript <sid> <mtime-epoch>
cl_write_transcript() {
  printf '{}\n' > "$CL_PROJ/proj-a/$1.jsonl"
  touch -d "@$2" "$CL_PROJ/proj-a/$1.jsonl"
}

cl_run() {
  if conflict_lane_hold_sweep 2>"$CL_DIR/err"; then CL_RC=0; else CL_RC=$?; fi
  CL_ERR=$(cat "$CL_DIR/err")
}

cl_contains() {
  case "$CL_ERR" in *"$1"*) printf 'yes' ;; *) printf 'no' ;; esac
}

cl_hold_calls() {
  local c
  c=$(grep -c '^ARGC=' "$CL_HOLDLOG" 2>/dev/null) || c=0
  [[ -n "$c" ]] || c=0
  printf '%s' "$c"
}

cl_err_count() {
  local c
  c=$(grep -c -- "$1" <<<"$CL_ERR") || c=0
  [[ -n "$c" ]] || c=0
  printf '%s' "$c"
}

cl_file_contains() {
  local file="$1" needle="$2"
  [[ -f "$file" ]] || { printf 'no'; return 0; }
  if grep -qF -- "$needle" "$file"; then printf 'yes'; else printf 'no'; fi
}

# --- Test 1: zero markers costs nothing — no daemon query at all -------------
# This runs on every tick, so the common case must not touch the daemon. The
# fake `claude` here EXITS 1 and touches the sentinel: if the sweep queried it,
# the sentinel would exist and an "unqueryable" line would be logged.

echo "Test: with no markers the sweep never queries the daemon"
cl_setup
cl_install_claude 1
cl_run
assert_eq "no-markers: sweep returns 0" "0" "$CL_RC"
assert_eq "no-markers: the daemon was never queried" "no" \
  "$([[ -e "$CL_QUERIED" ]] && printf 'yes' || printf 'no')"
assert_eq "no-markers: no unqueryable line" "no" "$(cl_contains 'daemon unqueryable')"
assert_eq "no-markers: hold-node not invoked" "0" "$(cl_hold_calls)"
assert_eq "no-markers: summary reports zero markers" "yes" \
  "$(cl_contains 'swept 0 marker(s): 0 held, 0 observing, 0 cleared, 0 deferred')"
cl_teardown

# --- Test 2: a live lane session is observed ---------------------------------

echo "Test: a marker whose lane session is still live is observed, never held"
cl_setup
cl_write_marker "tactic-lane-live" $(( CL_NOW - 7200 ))
cl_add_session "0aa1-1111" "tactic-lane-live" working
cl_install_claude 0
cl_write_transcript "0aa1-1111" $(( CL_NOW - 7200 ))
cl_run
assert_eq "lane-live: sweep returns 0" "0" "$CL_RC"
assert_eq "lane-live: hold-node not invoked" "0" "$(cl_hold_calls)"
assert_eq "lane-live: the marker is kept" "yes" "$(cl_marker_exists tactic-lane-live)"
assert_eq "lane-live: stderr reports observing" "yes" \
  "$(cl_contains 'observing tactic-lane-live (session 0aa1-1111 state=live)')"
cl_teardown

# --- Test 3: a stopped lane session idle past the grace is held --------------

echo "Test: a stopped-but-unreaped lane session idle past the grace raises one hold"
cl_setup
cl_write_marker "tactic-lane-stuck" $(( CL_NOW - 7200 ))
cl_add_session "0aa1-1111" "tactic-lane-stuck" done
cl_install_claude 0
cl_write_transcript "0aa1-1111" $(( CL_NOW - 3600 ))
cl_run
assert_eq "lane-stuck: sweep returns 0" "0" "$CL_RC"
assert_eq "lane-stuck: hold-node invoked exactly once" "1" "$(cl_hold_calls)"
assert_eq "lane-stuck: argv names the node and the provision-conflict kind" "yes" \
  "$(cl_file_contains "$CL_HOLDLOG" 'ARGV=tactic-lane-stuck --kind provision-conflict')"
assert_eq "lane-stuck: reason names the stopped session" "yes" \
  "$(cl_file_contains "$CL_DIR/reason.txt" '0aa1-1111')"
assert_eq "lane-stuck: reason names provision exit 11" "yes" \
  "$(cl_file_contains "$CL_DIR/reason.txt" 'provision exit 11')"
assert_eq "lane-stuck: recommendation carries the literal claude rm" "yes" \
  "$(cl_file_contains "$CL_DIR/rec.txt" 'claude rm 0aa1-1111')"
assert_eq "lane-stuck: recommendation carries the literal resolve-hold" "yes" \
  "$(cl_file_contains "$CL_DIR/rec.txt" 'resolve-hold tactic-lane-stuck --kind provision-conflict')"
assert_eq "lane-stuck: the marker is removed after the hold lands" "no" \
  "$(cl_marker_exists tactic-lane-stuck)"
assert_eq "lane-stuck: stderr reports the hold" "yes" \
  "$(cl_contains 'held tactic-lane-stuck (stuck conflict lane, idle 3600s, session 0aa1-1111)')"
cl_teardown

# --- Test 4: a stopped session still inside the grace is observed ------------

echo "Test: a stopped lane session idle UNDER the grace is observed, not held"
cl_setup
cl_write_marker "tactic-lane-fresh" $(( CL_NOW - 7200 ))
cl_add_session "0aa1-1111" "tactic-lane-fresh" done
cl_install_claude 0
cl_write_transcript "0aa1-1111" $(( CL_NOW - 60 ))
cl_run
assert_eq "lane-fresh: sweep returns 0" "0" "$CL_RC"
assert_eq "lane-fresh: hold-node not invoked" "0" "$(cl_hold_calls)"
assert_eq "lane-fresh: the marker is kept" "yes" "$(cl_marker_exists tactic-lane-fresh)"
assert_eq "lane-fresh: stderr reports the idle comparison" "yes" \
  "$(cl_contains 'observing tactic-lane-fresh (session 0aa1-1111 idle_seconds=60 < grace_seconds=1800)')"
cl_teardown

# --- Test 5: an unmeasurable idle never escalates ----------------------------

echo "Test: a stopped lane session with no transcript is kept, never held"
cl_setup
cl_write_marker "tactic-lane-notrans" $(( CL_NOW - 7200 ))
cl_add_session "0aa1-1111" "tactic-lane-notrans" done
cl_install_claude 0
cl_run
assert_eq "lane-notrans: sweep returns 0" "0" "$CL_RC"
assert_eq "lane-notrans: hold-node not invoked" "0" "$(cl_hold_calls)"
assert_eq "lane-notrans: the marker is kept" "yes" "$(cl_marker_exists tactic-lane-notrans)"
assert_eq "lane-notrans: stderr reports the unmeasurable idle" "yes" \
  "$(cl_contains 'idle time unmeasurable')"
cl_teardown

# --- Test 6: no registry row and an aged marker → GC -------------------------

echo "Test: a marker with no registry row whose age passed the grace is cleared"
cl_setup
cl_write_marker "tactic-lane-reaped" $(( CL_NOW - 7200 ))
cl_add_session "0cc3-3333" "tactic-some-other-node" working
cl_install_claude 0
cl_run
assert_eq "lane-reaped: sweep returns 0" "0" "$CL_RC"
assert_eq "lane-reaped: hold-node not invoked" "0" "$(cl_hold_calls)"
assert_eq "lane-reaped: the marker is removed" "no" "$(cl_marker_exists tactic-lane-reaped)"
assert_eq "lane-reaped: stderr reports the clear" "yes" \
  "$(cl_contains 'cleared tactic-lane-reaped (no registry row')"
cl_teardown

# --- Test 7: no registry row but a young marker → the registration window ----

echo "Test: a marker with no registry row still inside the grace is kept"
cl_setup
cl_write_marker "tactic-lane-booting" $(( CL_NOW - 60 ))
cl_add_session "0cc3-3333" "tactic-some-other-node" working
cl_install_claude 0
cl_run
assert_eq "lane-booting: sweep returns 0" "0" "$CL_RC"
assert_eq "lane-booting: hold-node not invoked" "0" "$(cl_hold_calls)"
assert_eq "lane-booting: the marker is kept" "yes" "$(cl_marker_exists tactic-lane-booting)"
assert_eq "lane-booting: stderr reports the registration window" "yes" \
  "$(cl_contains 'observing tactic-lane-booting (awaiting registration')"
cl_teardown

# --- Test 8: an unqueryable daemon neither holds nor GCs ---------------------

echo "Test: an unqueryable daemon holds nothing and clears nothing"
cl_setup
cl_write_marker "tactic-lane-unknown" $(( CL_NOW - 7200 ))
cl_install_claude 1
cl_run
assert_eq "lane-unknown: sweep returns 0" "0" "$CL_RC"
assert_eq "lane-unknown: hold-node not invoked" "0" "$(cl_hold_calls)"
assert_eq "lane-unknown: the marker is kept" "yes" "$(cl_marker_exists tactic-lane-unknown)"
assert_eq "lane-unknown: stderr reports the unqueryable daemon" "yes" \
  "$(cl_contains 'daemon unqueryable; observing tactic-lane-unknown')"
cl_teardown

# --- Test 9: two stopped rows for one name still raise ONE hold --------------

echo "Test: two stopped rows under one node name raise exactly one hold"
cl_setup
cl_write_marker "tactic-lane-twice" $(( CL_NOW - 7200 ))
cl_add_session "0aa1-1111" "tactic-lane-twice" done
cl_add_session "0bb2-2222" "tactic-lane-twice" done
cl_install_claude 0
cl_write_transcript "0aa1-1111" $(( CL_NOW - 3600 ))
cl_write_transcript "0bb2-2222" $(( CL_NOW - 3600 ))
cl_run
assert_eq "lane-twice: sweep returns 0" "0" "$CL_RC"
assert_eq "lane-twice: hold-node invoked exactly once" "1" "$(cl_hold_calls)"
assert_eq "lane-twice: the newest row is the reported holder" "yes" \
  "$(cl_contains 'session 0bb2-2222')"
cl_teardown

# --- Test 10: the per-sweep hold cap defers the excess -----------------------

echo "Test: the hold cap bounds holds per sweep and defers the rest"
cl_setup
DISPATCH_CONFLICT_LANE_HOLD_MAX=2
i=1
for n in one two three four; do
  cl_write_marker "tactic-cap-$n" $(( CL_NOW - 7200 ))
  cl_add_session "0cab-000$i" "tactic-cap-$n" done
  cl_write_transcript "0cab-000$i" $(( CL_NOW - 3600 ))
  i=$(( i + 1 ))
done
cl_install_claude 0
cl_run
assert_eq "cap: sweep returns 0" "0" "$CL_RC"
assert_eq "cap: exactly two hold-node invocations" "2" "$(cl_hold_calls)"
assert_eq "cap: two deferring lines" "2" "$(cl_err_count 'lib-conflict-lane-hold: deferring ')"
cl_remaining=0
for n in one two three four; do
  [[ -f "$CL_ROOT/tactic-cap-$n.conflict-lane" ]] && cl_remaining=$(( cl_remaining + 1 ))
done
assert_eq "cap: the two deferred markers are still on disk" "2" "$cl_remaining"
assert_eq "cap: summary counts the deferrals" "yes" \
  "$(cl_contains 'swept 4 marker(s): 2 held, 0 observing, 0 cleared, 2 deferred')"
cl_teardown

# --- Test 11: a hold-node failure is non-fatal and keeps the marker ----------

echo "Test: a hold-node failure is logged, the marker kept, and the sweep returns 0"
cl_setup
cl_write_hold_node 1
cl_write_marker "tactic-lane-holdfail" $(( CL_NOW - 7200 ))
cl_add_session "0aa1-1111" "tactic-lane-holdfail" done
cl_install_claude 0
cl_write_transcript "0aa1-1111" $(( CL_NOW - 3600 ))
cl_run
assert_eq "hold-fail: sweep returns 0" "0" "$CL_RC"
assert_eq "hold-fail: hold-node was attempted" "1" "$(cl_hold_calls)"
assert_eq "hold-fail: the marker is kept for the next pass" "yes" \
  "$(cl_marker_exists tactic-lane-holdfail)"
assert_eq "hold-fail: stderr reports the failure" "yes" \
  "$(cl_contains 'hold failed for tactic-lane-holdfail (hold-node exit 1); will retry next tick')"
assert_eq "hold-fail: summary counts zero holds" "yes" \
  "$(cl_contains 'swept 1 marker(s): 0 held, 0 observing, 0 cleared, 0 deferred')"
cl_teardown

# --- Test 12: an unsafe marker name is never used to build a path ------------

echo "Test: a marker whose name fails the node-id regex is kept and skipped"
cl_setup
printf 'spawned=%s\n' $(( CL_NOW - 7200 )) > "$CL_ROOT/tactic-Bad_Id.conflict-lane"
cl_install_claude 0
cl_run
assert_eq "unsafe-id: sweep returns 0" "0" "$CL_RC"
assert_eq "unsafe-id: the daemon was never queried for it" "no" \
  "$([[ -e "$CL_QUERIED" ]] && printf 'yes' || printf 'no')"
assert_eq "unsafe-id: hold-node not invoked" "0" "$(cl_hold_calls)"
assert_eq "unsafe-id: the marker is kept" "yes" \
  "$([[ -f "$CL_ROOT/tactic-Bad_Id.conflict-lane" ]] && printf 'yes' || printf 'no')"
assert_eq "unsafe-id: stderr reports the unsafe id" "yes" "$(cl_contains 'unsafe-id tactic-Bad_Id')"
cl_teardown

# --- Test 13: the decision log records the held candidate --------------------

echo "Test: a held candidate appends one conflict-lane-hold decision record"
cl_setup
cl_write_marker "tactic-lane-logged" $(( CL_NOW - 7200 ))
cl_add_session "0aa1-1111" "tactic-lane-logged" done
cl_install_claude 0
cl_write_transcript "0aa1-1111" $(( CL_NOW - 3600 ))
cl_run
assert_eq "decision-log: sweep returns 0" "0" "$CL_RC"
assert_eq "decision-log: the log file exists" "yes" \
  "$([[ -f "$DECISION_LOG_FILE" ]] && printf 'yes' || printf 'no')"
assert_eq "decision-log: exactly one conflict-lane-hold record" "1" \
  "$(jq -r 'select(.site == "conflict-lane-hold") | .site' "$DECISION_LOG_FILE" | wc -l | tr -d ' ')"
assert_eq "decision-log: the record says held" "held" \
  "$(jq -r 'select(.site == "conflict-lane-hold") | .disposition' "$DECISION_LOG_FILE")"
assert_eq "decision-log: the record names the node" "tactic-lane-logged" \
  "$(jq -r 'select(.site == "conflict-lane-hold") | .node' "$DECISION_LOG_FILE")"
assert_eq "decision-log: the record carries a numeric idle_seconds" "3600" \
  "$(jq -r 'select(.site == "conflict-lane-hold") | .idle_seconds' "$DECISION_LOG_FILE")"
cl_teardown

# --- Test 14: a hold-failed candidate is also recorded -----------------------

echo "Test: a hold-failed candidate appends a hold-failed decision record"
cl_setup
cl_write_hold_node 1
cl_write_marker "tactic-lane-logfail" $(( CL_NOW - 7200 ))
cl_add_session "0aa1-1111" "tactic-lane-logfail" done
cl_install_claude 0
cl_write_transcript "0aa1-1111" $(( CL_NOW - 3600 ))
cl_run
assert_eq "decision-log-fail: sweep returns 0" "0" "$CL_RC"
assert_eq "decision-log-fail: the record says hold-failed" "hold-failed" \
  "$(jq -r 'select(.site == "conflict-lane-hold") | .disposition' "$DECISION_LOG_FILE")"
cl_teardown

report_results
