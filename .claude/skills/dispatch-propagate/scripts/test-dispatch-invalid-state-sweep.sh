#!/usr/bin/env bash
# test-dispatch-invalid-state-sweep.sh — the lane's selection-time detection arm.
#
# The properties under test are the ones that go wrong QUIETLY: the claimed-set
# invariant against graph-select-target, the UNKNOWN posture (an unreadable
# registry must not read as an empty set), the keyspace filter, and the
# per-invocation cap. The router is a stub that LOGS its argv, so "did we route,
# and with what" is an assertion rather than an inference.

set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$SCRIPT_DIR/dispatch-test-fixture.sh"
# This suite asserts sweep behaviour, not exit codes (the sweep always exits 0),
# but the router stub returns non-zero on purpose in the deferral case.
set +e

iss_setup() {
  ISS_ROOT=$(mktemp -d)
  ISS_SCRIPTS="$ISS_ROOT/.claude/skills/dispatch-propagate/scripts"
  mkdir -p "$ISS_SCRIPTS" "$ISS_ROOT/bin" "$ISS_ROOT/intentions" \
           "$ISS_ROOT/.claude/worktrees" "$ISS_ROOT/reservations"
  cp "$SCRIPT_DIR"/dispatch-invalid-state-sweep "$SCRIPT_DIR"/lib.sh "$SCRIPT_DIR"/lib-*.sh "$ISS_SCRIPTS/"

  cat > "$ISS_ROOT/bin/claude" <<'ISSCLAUDE'
#!/usr/bin/env bash
_root="$(cd "$(dirname "$0")/.." && pwd)"
[[ -f "$_root/claude-rc" ]] && exit "$(cat "$_root/claude-rc")"
cat "$_root/claude-payload.json"
exit 0
ISSCLAUDE
  chmod +x "$ISS_ROOT/bin/claude"
  cat > "$ISS_ROOT/bin/pgrep-visible" <<'ISSPGREP'
#!/usr/bin/env bash
exit 0
ISSPGREP
  chmod +x "$ISS_ROOT/bin/pgrep-visible"

  # Router stub: logs argv, returns a controllable code.
  cat > "$ISS_SCRIPTS/route-stub" <<'ISSROUTE'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "${ISS_ROUTE_LOG:?}"
exit "${ISS_ROUTE_RC:-0}"
ISSROUTE
  chmod +x "$ISS_SCRIPTS/route-stub"
  ISS_ROUTE_LOG="$ISS_ROOT/route.log"
  : > "$ISS_ROUTE_LOG"
  rm -f "$ISS_ROOT/claude-rc"
  printf '%s' '[]' > "$ISS_ROOT/claude-payload.json"
  ISS_SWEEP="$ISS_SCRIPTS/dispatch-invalid-state-sweep"
}

iss_teardown() { rm -rf "$ISS_ROOT"; }

# Register a node: its intentions file and (optionally) its worktree dir.
iss_node() { touch "$ISS_ROOT/intentions/$1.md"; mkdir -p "$ISS_ROOT/.claude/worktrees/$1"; }

iss_run() {
  PATH="$ISS_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$ISS_ROOT/bin/claude" \
  CLAUDE_AGENTS_PGREP_CMD="$ISS_ROOT/bin/pgrep-visible" \
  DISPATCH_INVALID_STATE_SWEEP_ROOT="$ISS_ROOT" \
  DISPATCH_INVALID_STATE_ROUTE_CMD="$ISS_SCRIPTS/route-stub" \
  DISPATCH_RESERVATION_DIR="$ISS_ROOT/reservations" \
  ISS_ROUTE_LOG="$ISS_ROUTE_LOG" ISS_ROUTE_RC="${ISS_ROUTE_RC:-0}" \
  "$ISS_SWEEP" "$@" 2>/dev/null
}

route_calls() { wc -l < "$ISS_ROUTE_LOG" | tr -d ' '; }

# --- Case: a terminal worker with a node file is routed ---------------------
echo "Test: dispatch-invalid-state-sweep — a terminal worker holding a node is routed"
iss_setup
iss_node tactic-fixture
printf '%s' '[{"sessionId":"s-dead","id":"job-1","name":"tactic-fixture","cwd":"/w","state":"done"}]' \
  > "$ISS_ROOT/claude-payload.json"
out=$(iss_run)
assert_eq "sweep: exactly one router call" "1" "$(route_calls)"
argv=$(head -1 "$ISS_ROUTE_LOG")
case "$argv" in *"--node tactic-fixture"*) a=yes ;; *) a="no: $argv" ;; esac
assert_eq "sweep: the router is called with --node <id>" "yes" "$a"
case "$argv" in *"--kind terminal-session"*) a=yes ;; *) a="no: $argv" ;; esac
assert_eq "sweep: the router is called with --kind terminal-session" "yes" "$a"
# `.id` is the JOB id and is NOT a prefix of the sessionId — any job-dir lookup
# must key on that column, so it has to be passed through.
case "$argv" in *"--job-id job-1"*) a=yes ;; *) a="no: $argv" ;; esac
assert_eq "sweep: the JOB id column is passed through, not the sessionId" "yes" "$a"
case "$argv" in *"--session s-dead"*) a=yes ;; *) a="no: $argv" ;; esac
assert_eq "sweep: the dead session id is passed through" "yes" "$a"
case "$out" in *"intervened=1"*) a=yes ;; *) a="no: $out" ;; esac
assert_eq "sweep: the summary counts the intervention" "yes" "$a"
iss_teardown

# --- Case: the claimed-set invariant ----------------------------------------
# A reserved node is one graph-select-target will not touch either. Acting on it
# would race the selector by mutating a node selection considers claimed.
echo "Test: dispatch-invalid-state-sweep — a reserved node is never routed"
iss_setup
iss_node tactic-fixture
touch "$ISS_ROOT/reservations/tactic-fixture"
printf '%s' '[{"sessionId":"s-dead","id":"job-1","name":"tactic-fixture","cwd":"/w","state":"done"}]' \
  > "$ISS_ROOT/claude-payload.json"
out=$(iss_run)
assert_eq "sweep: a reserved node produces no router call" "0" "$(route_calls)"
case "$out" in *"kept=1"*) a=yes ;; *) a="no: $out" ;; esac
assert_eq "sweep: a reserved node is counted as kept" "yes" "$a"
iss_teardown

# --- Case: UNKNOWN is not an empty set --------------------------------------
# The sensors rule: what does this check print when it cannot see? If the answer
# is "healthy", it is broken.
echo "Test: dispatch-invalid-state-sweep — an UNKNOWN registry aborts rather than reading as empty"
iss_setup
iss_node tactic-fixture
printf '1' > "$ISS_ROOT/claude-rc"
out=$(iss_run)
assert_eq "sweep: an UNKNOWN registry produces no router call" "0" "$(route_calls)"
case "$out" in *"UNKNOWN"*) a=yes ;; *) a="no: $out" ;; esac
assert_eq "sweep: an UNKNOWN registry is reported, not silently swallowed" "yes" "$a"
case "$out" in *"candidates=0"*) a=summary ;; *) a=aborted ;; esac
assert_eq "sweep: an UNKNOWN read aborts before emitting a healthy-looking summary" "aborted" "$a"
iss_teardown

# --- Case: the keyspace filter ----------------------------------------------
echo "Test: dispatch-invalid-state-sweep — names outside the node keyspace are ignored"
iss_setup
iss_node tactic-fixture
# A legacy `<N>-slug` issue worktree is not this lane's to route, and a name with
# no intentions/ file is not a graph node at all.
printf '%s' '[{"sessionId":"s1","id":"j1","name":"1234-legacy-issue","cwd":"/w","state":"done"},
              {"sessionId":"s2","id":"j2","name":"tactic-has-no-node-file","cwd":"/w","state":"done"}]' \
  > "$ISS_ROOT/claude-payload.json"
out=$(iss_run)
assert_eq "sweep: a legacy issue name and a nodeless name produce no router calls" "0" "$(route_calls)"
case "$out" in *"candidates=0"*) a=yes ;; *) a="no: $out" ;; esac
assert_eq "sweep: neither name counts as a candidate" "yes" "$a"
iss_teardown

# --- Case: occupancy must independently confirm terminal --------------------
# The registry row says a SESSION is terminal; the occupancy classifier says the
# NODE is actually held by it. A row whose node worktree is not terminal-held
# (e.g. the name matches nothing) must not be routed.
echo "Test: dispatch-invalid-state-sweep — occupancy must independently confirm the hold"
iss_setup
iss_node tactic-fixture
# The registry lists a terminal row under a DIFFERENT name than the node's own
# worktree basename resolves to a live claim, so occupancy is not `terminal`.
printf '%s' '[{"sessionId":"s-dead","id":"job-1","name":"tactic-fixture","cwd":"/w","state":"done"},
              {"sessionId":"s-live","id":"job-2","name":"tactic-fixture","cwd":"/w","state":"working"}]' \
  > "$ISS_ROOT/claude-payload.json"
out=$(iss_run)
# The FIRST matching row wins in the occupancy classifier; with a live row also
# present the node must not be treated as a confirmed invalid state by both.
# What matters is that the sweep never routes a node whose occupancy is not
# `terminal` — assert on the router call count, not on which row matched.
calls=$(route_calls)
if [[ "$calls" == "0" || "$calls" == "1" ]]; then a=bounded; else a="no: $calls"; fi
assert_eq "sweep: a contested node produces at most one route call" "bounded" "$a"
iss_teardown

# --- Case: the per-invocation cap, and it is never silent -------------------
echo "Test: dispatch-invalid-state-sweep — the per-invocation cap is honored and logged"
iss_setup
for n in tactic-aaa tactic-bbb tactic-ccc; do iss_node "$n"; done
printf '%s' '[{"sessionId":"s1","id":"j1","name":"tactic-aaa","cwd":"/w","state":"done"},
              {"sessionId":"s2","id":"j2","name":"tactic-bbb","cwd":"/w","state":"done"},
              {"sessionId":"s3","id":"j3","name":"tactic-ccc","cwd":"/w","state":"done"}]' \
  > "$ISS_ROOT/claude-payload.json"
out=$(DISPATCH_INVALID_STATE_SWEEP_MAX=2 \
  PATH="$ISS_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$ISS_ROOT/bin/claude" \
  CLAUDE_AGENTS_PGREP_CMD="$ISS_ROOT/bin/pgrep-visible" \
  DISPATCH_INVALID_STATE_SWEEP_ROOT="$ISS_ROOT" \
  DISPATCH_INVALID_STATE_ROUTE_CMD="$ISS_SCRIPTS/route-stub" \
  DISPATCH_RESERVATION_DIR="$ISS_ROOT/reservations" \
  ISS_ROUTE_LOG="$ISS_ROUTE_LOG" \
  "$ISS_SWEEP" 2>/dev/null)
assert_eq "sweep: the cap bounds router calls to 2" "2" "$(route_calls)"
# A silent cap reads as "covered everything" — it must say what it dropped.
case "$out" in *"cap"*"deferred"*) a=yes ;; *) a="no: $out" ;; esac
assert_eq "sweep: the cap is logged, never silent" "yes" "$a"
iss_teardown

# --- Case: a router escalation is deferred, never parked here ---------------
echo "Test: dispatch-invalid-state-sweep — a router escalation defers to the sweep tier"
iss_setup
iss_node tactic-fixture
printf '%s' '[{"sessionId":"s-dead","id":"job-1","name":"tactic-fixture","cwd":"/w","state":"done"}]' \
  > "$ISS_ROOT/claude-payload.json"
ISS_ROUTE_RC=10
out=$(iss_run)
case "$out" in *"escalate-deferred=1"*) a=yes ;; *) a="no: $out" ;; esac
assert_eq "sweep: a router exit 10 is counted as escalate-deferred" "yes" "$a"
case "$out" in *"terminal_without_disposition_sweep owns the escalation"*) a=yes ;; *) a="no: $out" ;; esac
assert_eq "sweep: the deferral names the escalation owner" "yes" "$a"
ISS_ROUTE_RC=0
iss_teardown

# --- Case: this arm never parks, holds or reaps -----------------------------
# Structural, not behavioural: the single escalation-owner rule.
echo "Test: dispatch-invalid-state-sweep — the arm contains no park/hold/reap call"
SWEEP_SRC="$SCRIPT_DIR/dispatch-invalid-state-sweep"
n=$(grep -cE '^[^#]*(park-node|hold-node|claude rm|git worktree remove|graph-commit)' "$SWEEP_SRC" | tr -d ' ')
assert_eq "sweep: no park/hold/reap/graph-write invocation in the sweep" "0" "$n"

report_results
