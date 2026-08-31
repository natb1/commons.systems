#!/usr/bin/env bash
# Unit tests for dispatch-ladder-run — the detached ladder driver.
#
# The driver is pure exit-code branching over seven scripts it does not own, so
# what is worth testing is exactly the branch table: every exit code of
# dispatch-ladder-advance and dispatch-ladder-await, every reason the advance
# `idle` line can carry, and the reconcile pass's stdout protocols. All seven
# are faked here — no daemon, no gh, no real git, no network.
#
# Three branches are worth calling out because getting them wrong is invisible
# until it costs a real run:
#
#   1. `idle <id> ci-waiting` MUST re-poll rather than halt. A freshly opened
#      draft PR with pending CI produces it, so halting there would halt after
#      every implement phase — the loop would never finish a single node.
#   2. The anti-spin guards. The --ci-wait-s budget bounds a reconcile pass that
#      changes nothing, and the requeue budget bounds `stale-selection` /
#      `scope-stale-demoted`. Without them a node that never becomes selectable
#      spins until --max-run-s.
#   3. The pass takes the selection lock and RELEASES it before every sleep. A
#      sleep under the lock would wedge a concurrent dispatch tick for the whole
#      poll interval, and a pass that skipped the lock entirely would let the
#      tick merge and absorb the same node at the same time.
#   4. `held-observing` (await exit 21) re-runs the owed sweeps and re-polls,
#      bounded by HELD_GRACE_S. The sweep that heals a held escalation is called
#      by this driver and needs 300s of idle before it acts, so halting on the
#      first held answer made the driver's own healer unreachable. Both halves
#      are asserted: the sweeps DO run between held polls, and a hold nothing
#      heals still halts 11 on its own budget.
#
# The fakes are sequence-driven: each one reads the Nth line of its own script
# file on its Nth call, as `<exit-code>|<stdout>`, reusing the last line once
# the sequence runs out. That is what lets a case express "advance launches,
# then goes idle" or "await says running twice, then advanced".
#
# Runs from anywhere; creates and removes its own temp tree.

LADDER_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# The shared dispatch harness (assert_eq / report_results, plus the host-systemd
# and decision-log leak guards). It sets `set -euo pipefail`, so every
# invocation that can exit non-zero below is wrapped in `|| rc=$?`.
# shellcheck source=../../dispatch-propagate/scripts/dispatch-test-fixture.sh
source "$LADDER_DIR/../../dispatch-propagate/scripts/dispatch-test-fixture.sh"

echo "=== dispatch-ladder-run ==="

# --- Fixture tree ------------------------------------------------------------
# TMPDIR_TEST is the fixture's own variable — its EXIT trap removes it, so the
# suite needs no teardown of its own.
TMPDIR_TEST=$(mktemp -d)
PROJECT="$TMPDIR_TEST/project"
LADDER="$PROJECT/.claude/skills/dispatch-ladder/scripts"
DISPATCH="$PROJECT/.claude/skills/dispatch-propagate/scripts"
IUTIL="$PROJECT/packages/intentionsutil/scripts"
SEQ_DIR="$TMPDIR_TEST/seq"
FAKE_BIN="$TMPDIR_TEST/bin"
mkdir -p "$LADDER" "$DISPATCH" "$IUTIL" "$SEQ_DIR" "$FAKE_BIN" "$PROJECT/.claude/worktrees"

cp "$LADDER_DIR/dispatch-ladder-run" "$LADDER/dispatch-ladder-run"
chmod +x "$LADDER/dispatch-ladder-run"
cp "$SCRIPT_DIR/lib-graph-worktree.sh" "$DISPATCH/lib-graph-worktree.sh"
# lib.sh, REAL: the driver reads dispatch_lock_file and headless_sentinel_path
# from it to place the headless-liveness sentinel that makes its synthetic
# `headless:<token>` lock holder resolvable as live. Faking those two would fake
# away the only thing that makes the lock hold mean anything.
cp "$SCRIPT_DIR/lib.sh" "$DISPATCH/lib.sh"
# The reservation ledger is STUBBED rather than copied. The driver's contract is
# "reservation_sweep runs once before every advance", and a counting stub is the
# only way to assert that directly — the real sweep's only observable is a
# marker file it may or may not decide to reclaim. The sweep's own behavior is
# covered by test-lib-reservation-ledger.sh.
cat >"$DISPATCH/lib-reservation-ledger.sh" <<STUB
reservation_sweep() { echo sweep >>"$SEQ_DIR/sweep.log"; return 0; }
STUB
# lib-frozen-session-park.sh is STUBBED for the same reason, and its stub records
# ORDER as well as count. The driver's contract is "sweep, THEN advance" — a
# sweep that ran after the advance it was meant to protect would still count 1:1
# while doing nothing for the escalation the advance is about to trip over. So
# the stub records the advance counter AS IT STANDS at sweep time; the Nth sweep
# must see N-1 completed advances. The real sweep's behavior (which sessions it
# parks, and on what evidence) is covered by test-lib-frozen-session-park.sh.
# The stub also records the three budget tunables it sees (Unit 11: the driver
# exports driver-sized defaults for them around this call, via
# `${VAR:-default}` so an inherited override still wins) and, when
# $SEQ_DIR/sweep-sleep-s holds a positive number, sleeps that long — the only
# way to make this instant stub stand in for a sweep that consumes real
# wall-clock budget, which is what the deadline-recheck-after-sweeps cases
# below need.
cat >"$DISPATCH/lib-frozen-session-park.sh" <<STUB
terminal_without_disposition_sweep() {
  local n
  n=\$(cat "$SEQ_DIR/advance.count" 2>/dev/null) || n=missing
  printf '%s\n' "\$n" >>"$SEQ_DIR/terminal-sweep.log"
  printf 'PARK_MAX=%s PARK_TIMEOUT_S=%s LOCK_WAIT_S=%s\n' \
    "\${DISPATCH_TERMINAL_DISPOSITION_PARK_MAX:-<unset>}" \
    "\${DISPATCH_TERMINAL_DISPOSITION_PARK_TIMEOUT_S:-<unset>}" \
    "\${DISPATCH_TERMINAL_DISPOSITION_LOCK_WAIT_S:-<unset>}" \
    >>"$SEQ_DIR/terminal-sweep-env.log"
  if [[ -s "$SEQ_DIR/sweep-sleep-s" ]]; then
    sleep "\$(cat "$SEQ_DIR/sweep-sleep-s")"
  fi
  return 0
}
STUB
# Kept so the load-failure cases at the end can put it back.
FROZEN_LIB="$DISPATCH/lib-frozen-session-park.sh"
FROZEN_LIB_GOOD=$(cat "$FROZEN_LIB")

RUN="$LADDER/dispatch-ladder-run"
NODE=tactic-fixture-node
STATE_DIR="$PROJECT/.claude/worktrees/$NODE.ladder"
export DISPATCH_GRAPH_MAIN_WORKTREE="$PROJECT"
# The lock file path, so the driver's dispatch_lock_file never falls through to
# `git rev-parse` (which would hit the fake git below and consume a sequence
# line). The sentinel lands beside it.
export DISPATCH_LOCK_FILE="$TMPDIR_TEST/lock/dispatch.lock"
# The suite itself usually runs INSIDE a Claude session, which exports a real
# CLAUDE_CODE_SESSION_ID; the driver honors an inherited one (that is the
# by-hand case, where the daemon governs liveness for real) and would then
# synthesize nothing. Clear it so every case below exercises the headless path
# the systemd-launched driver actually takes.
unset CLAUDE_CODE_SESSION_ID || true

# make_seq_fake <path> <name> — a fake whose Nth call emits the Nth line of
# $SEQ_DIR/<name>.script, formatted `<exit-code>|<stdout>`.
make_seq_fake() {
  local path="$1" name="$2"
  cat >"$path" <<STUB
#!/usr/bin/env bash
n=\$(cat "$SEQ_DIR/$name.count")
echo \$((n + 1)) >"$SEQ_DIR/$name.count"
printf '%s\n' "\$*" >>"$SEQ_DIR/$name.argv"
# Record the two REST memo variables the driver must unset before every
# reconciler call (see dispatch-ladder-run's cache note). Same
# \${VAR:-<unset>} shape as the lib-frozen-session-park.sh stub above.
printf 'CI=%s PRJSON=%s\n' "\${DISPATCH_CI_VERDICT_CACHE:-<unset>}" \
  "\${DISPATCH_PR_JSON_CACHE:-<unset>}" >>"$SEQ_DIR/$name.env"
line=\$(sed -n "\$((n + 1))p" "$SEQ_DIR/$name.script")
[[ -n "\$line" ]] || line=\$(tail -n1 "$SEQ_DIR/$name.script")
out="\${line#*|}"
[[ -n "\$out" ]] && printf '%s\n' "\$out"
exit "\${line%%|*}"
STUB
  chmod +x "$path"
}

make_seq_fake "$LADDER/dispatch-ladder-advance" advance
make_seq_fake "$LADDER/dispatch-ladder-await"   await
make_seq_fake "$DISPATCH/graph-auto-merge"      merge
make_seq_fake "$DISPATCH/reconcile-graph-merged" reconcile
make_seq_fake "$DISPATCH/reconcile-graph-review-stall" stall
make_seq_fake "$IUTIL/verify-landed"            landed
# The per-phase evaluation spawn. Faked as a sequence so a case can make the
# spawn fail and assert the ladder's own disposition is unchanged by it.
make_seq_fake "$DISPATCH/dispatch-spawn-job"    spawnjob
# The model/effort policy is copied REAL, not faked: the point of routing the
# evaluator's tier through dispatch-phase-model is that the policy lives there,
# so a test against a fake would assert nothing about the actual answer.
cp "$SCRIPT_DIR/dispatch-phase-model"  "$DISPATCH/dispatch-phase-model"
cp "$SCRIPT_DIR/dispatch-phase-effort" "$DISPATCH/dispatch-phase-effort"
chmod +x "$DISPATCH/dispatch-phase-model" "$DISPATCH/dispatch-phase-effort"
# git is faked on PATH, not by path: the driver syncs the main checkout with
# `git -C <root> fetch` then `git -C <root> merge --ff-only`, two calls per
# pass, and the sequence drives which of them fails.
make_seq_fake "$FAKE_BIN/git"                   git
export PATH="$FAKE_BIN:$PATH"

# The lock fake is NOT a plain sequence fake. The driver calls
# dispatch-acquire-lock five times in a full pass (--wait, three --heartbeat,
# --release), and a case that wants "the second pass is busy" must sequence the
# --wait answers ALONE. So --wait consumes lock.script; --heartbeat and
# --release always succeed silently. Every call is recorded in lock.argv, which
# is what the release-once-per-pass assertion reads. The fake also records the
# session id it was invoked with, so the suite can check the driver synthesized
# a `headless:` holder rather than an id the lock script would resolve as dead.
cat >"$DISPATCH/dispatch-acquire-lock" <<STUB
#!/usr/bin/env bash
printf '%s\n' "\$*" >>"$SEQ_DIR/lock.argv"
printf '%s\n' "\${CLAUDE_CODE_SESSION_ID:-<unset>}" >>"$SEQ_DIR/lock.sid"
case "\${1:-}" in
  --heartbeat|--release) exit 0 ;;
esac
n=\$(cat "$SEQ_DIR/lock.count")
echo \$((n + 1)) >"$SEQ_DIR/lock.count"
line=\$(sed -n "\$((n + 1))p" "$SEQ_DIR/lock.script")
[[ -n "\$line" ]] || line=\$(tail -n1 "$SEQ_DIR/lock.script")
out="\${line#*|}"
[[ -n "\$out" ]] && printf '%s\n' "\$out"
exit "\${line%%|*}"
STUB
chmod +x "$DISPATCH/dispatch-acquire-lock"

set_seq() { # <name> <line>...
  local name="$1"; shift
  : >"$SEQ_DIR/$name.script"
  : >"$SEQ_DIR/$name.argv"
  echo 0 >"$SEQ_DIR/$name.count"
  : >"$SEQ_DIR/$name.env"
  local l
  for l in "$@"; do printf '%s\n' "$l" >>"$SEQ_DIR/$name.script"; done
}
calls() { cat "$SEQ_DIR/$1.count"; }

# await_argv <n> — the Nth recorded await argv with the launch-window flag
# normalized out. `--since <epoch>` is wall-clock and so cannot be written into
# an exact-match expectation; stripping it keeps the pins below asserting
# exactly what they always asserted (node, phase, timeout) rather than being
# loosened to a prefix match. The flag's own presence and shape are asserted
# separately by await_since_count.
await_argv() {
  sed -n "${1}p" "$SEQ_DIR/await.argv" | sed -E 's/ --since [0-9]+$//'
}
# await_since_count — how many recorded await calls end in a plausible
# `--since <epoch>` (10 digits: seconds since the epoch, through 2286).
await_since_count() {
  local n
  n=$(grep -cE ' --since [0-9]{10}$' "$SEQ_DIR/await.argv" 2>/dev/null) || n=0
  echo "$n"
}

# lock_modes <flag> — how many times dispatch-acquire-lock was called with it.
# `grep -c` prints 0 AND exits 1 on a genuine zero, so the status is discarded
# into the assignment rather than piped through a `|| echo 0` that would fire
# too and yield two lines.
lock_modes() {
  local n
  n=$(grep -c -- "^$1\$" "$SEQ_DIR/lock.argv" 2>/dev/null) || n=0
  echo "$n"
}
# sweeps — how many times reservation_sweep ran (the stub appends one line).
sweeps() {
  local n
  n=$(grep -c . "$SEQ_DIR/sweep.log" 2>/dev/null) || n=0
  echo "$n"
}
# terminal_sweeps — how many times terminal_without_disposition_sweep ran.
terminal_sweeps() {
  local n
  n=$(grep -c . "$SEQ_DIR/terminal-sweep.log" 2>/dev/null) || n=0
  echo "$n"
}
# terminal_sweep_order — the advance counter each sweep observed, comma-joined.
# "0,1" means: swept, advanced, swept, advanced. Anything else means the sweep
# is running after the advance it is supposed to precede.
terminal_sweep_order() {
  local out
  out=$(paste -sd, "$SEQ_DIR/terminal-sweep.log" 2>/dev/null) || out=""
  echo "$out"
}
# terminal_sweep_env — the PARK_MAX/PARK_TIMEOUT_S/LOCK_WAIT_S line the sweep
# stub saw on its LAST call (tail -n1), the tunables the driver exported
# around that call.
terminal_sweep_env() {
  tail -n1 "$SEQ_DIR/terminal-sweep-env.log" 2>/dev/null || echo ""
}

# Reset every fake to a benign default, then let each case override what it
# cares about. `landed 4` = "present at origin/main, not done"; `git 0` = the
# main checkout fetches and fast-forwards clean; `lock acquired` = uncontended.
reset_seqs() {
  set_seq advance   '10|idle tactic-fixture-node not-selectable'
  set_seq await     '0|advanced tactic-fixture-node implement -> origin/main'
  set_seq merge     '0|'
  set_seq reconcile '0|'
  set_seq stall     '0|'
  set_seq landed    '4|'
  set_seq git       '0|'
  set_seq lock      '0|acquired'
  set_seq spawnjob  '0|spawned'
  : >"$SEQ_DIR/lock.sid"
  : >"$SEQ_DIR/sweep.log"
  : >"$SEQ_DIR/terminal-sweep.log"
  : >"$SEQ_DIR/terminal-sweep-env.log"
  rm -f "$SEQ_DIR/sweep-sleep-s"
  rm -rf "$STATE_DIR"
}

RC=0
OUT=""
# --ci-wait-s 5 rather than the driver's real 3600 default: every quiet pass
# sleeps --poll-s, so a real budget would make each quiet-path case take an
# hour. Cases that assert ON the budget append their own --ci-wait-s, which
# wins — the flag loop assigns on every occurrence, so the last one sticks.
run_ladder() { # [extra driver args...]
  RC=0
  OUT=$("$RUN" "$NODE" --poll-s 1 --timeout-s 3 --ci-wait-s 5 "$@" 2>/dev/null) || RC=$?
}

# events_have <event> <disposition> — count matching lines in events.jsonl.
events_have() {
  local n
  n=$(jq -r --arg e "$1" --arg d "$2" \
        'select(.event == $e and .disposition == $d) | .event' \
        "$STATE_DIR/events.jsonl" 2>/dev/null | grep -c .) || n=0
  echo "$n"
}

# --- Usage -------------------------------------------------------------------
echo "Test: argument validation happens before anything is launched"
reset_seqs
rc=0; "$RUN" >/dev/null 2>&1 || rc=$?
assert_eq "usage: no arguments exits 2" "2" "$rc"
rc=0; "$RUN" "Bad Id" >/dev/null 2>&1 || rc=$?
assert_eq "usage: a malformed node id exits 2" "2" "$rc"
rc=0; "$RUN" "$NODE" --poll-s 0 >/dev/null 2>&1 || rc=$?
assert_eq "usage: --poll-s 0 exits 2 (it would spin)" "2" "$rc"
rc=0; "$RUN" "$NODE" --timeout-s x >/dev/null 2>&1 || rc=$?
assert_eq "usage: a non-integer --timeout-s exits 2" "2" "$rc"
rc=0; "$RUN" "$NODE" --ci-wait-s x >/dev/null 2>&1 || rc=$?
assert_eq "usage: a non-integer --ci-wait-s exits 2" "2" "$rc"
rc=0; "$RUN" "$NODE" --nope >/dev/null 2>&1 || rc=$?
assert_eq "usage: an unknown flag exits 2" "2" "$rc"
# HELD_GRACE_S is an environment knob rather than a flag, but it is validated at
# the same boundary: a typo must be a cheap exit 2 here, not an arithmetic
# surprise hours into a detached run.
export HELD_GRACE_S=x
rc=0; "$RUN" "$NODE" >/dev/null 2>&1 || rc=$?
unset HELD_GRACE_S
assert_eq "usage: a non-integer HELD_GRACE_S exits 2" "2" "$rc"
assert_eq "usage: nothing was launched" "0" "$(calls advance)"
assert_eq "usage: the reservation ledger was not swept either" "0" "$(sweeps)"
assert_eq "usage: nor was the terminal-disposition sweep run" "0" "$(terminal_sweeps)"

# --- launched → advanced → loop → done --------------------------------------
echo "Test: launch, advance, then a done node completes the run"
reset_seqs
set_seq advance '0|launched tactic-fixture-node tactic implement /implement' \
                '10|idle tactic-fixture-node not-selectable'
set_seq landed  '0|'
run_ladder
assert_eq "complete: exit 0" "0" "$RC"
assert_eq "complete: await was called once" "1" "$(calls await)"
assert_eq "complete: the phase was passed to await" "$NODE implement --timeout-s 3" \
  "$(await_argv 1)"
# And the launch window the await's lane-pass probe compares stamps against. A
# lane that completes by pushing never moves `.phase`, so without this flag its
# successful pass is indistinguishable from a stall.
assert_eq "complete: await was given a --since launch window" "1" "$(await_since_count)"
assert_eq "complete: state.json status" "complete" "$(jq -r .status "$STATE_DIR/state.json")"
assert_eq "complete: state.json exit_code" "0" "$(jq -r .exit_code "$STATE_DIR/state.json")"
assert_eq "complete: state.json unit name" "dispatch-ladder-$NODE" \
  "$(jq -r .unit "$STATE_DIR/state.json")"
assert_eq "complete: a launched event was recorded" "1" "$(events_have launched launched)"
assert_eq "complete: an awaited/advanced event was recorded" "1" "$(events_have awaited advanced)"
# The marker dispatch-ladder-advance writes before each spawn is released only
# by reservation_sweep, so a driver that skipped the sweep would deadlock its
# own next step with `claimed <id> reservation:…` on any host whose dispatch
# heartbeat is stopped — the bootstrap-deadlock case this skill exists for.
assert_eq "complete: the ledger was swept once before every advance" \
  "$(calls advance)" "$(sweeps)"
# The SECOND tick-only sweep the driver owes. Every node-lane skill's escalation
# path writes $CLAUDE_JOB_DIR/office-hours-reason and deliberately declares NO
# node-terminal marker, leaving the park to terminal_without_disposition_sweep.
# Absent that sweep, dispatch-self-close HOLDs the job and dispatch-ladder-await
# reads the hold as `held-observing` (exit 21) forever, on exactly the
# heartbeat-stopped host this driver exists for. The wedge was subtler than
# "the sweep is missing": the sweep was CALLED here and still unreachable,
# because the driver halted on the first held answer while the sweep needs
# DISPATCH_TERMINAL_DISPOSITION_GRACE_S (300s) of idle before it acts. The
# exit-21 arm below is what closes that — it re-runs these sweeps between held
# polls, so this 1:1-before-every-advance count is a floor, not a ceiling.
assert_eq "complete: the terminal-disposition sweep ran once before every advance" \
  "$(calls advance)" "$(terminal_sweeps)"
assert_eq "complete: and ran BEFORE each advance, not after it" "0,1" \
  "$(terminal_sweep_order)"
# The evaluation reads phase wall-clock off this field; if it stops being
# written the evidence is silently gone.
TOTAL=$((TOTAL + 1))
if jq -e 'select(.event == "awaited") | .detail | test("elapsed_s=[0-9]+")' \
     "$STATE_DIR/events.jsonl" >/dev/null 2>&1; then
  PASS=$((PASS + 1)); echo "  PASS: complete: the awaited event carries elapsed_s"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: complete: the awaited event carries elapsed_s"
fi
# events.jsonl must be one valid object per line — a later reader parses it.
TOTAL=$((TOTAL + 1))
if jq -e . "$STATE_DIR/events.jsonl" >/dev/null 2>&1; then
  PASS=$((PASS + 1)); echo "  PASS: complete: events.jsonl is valid JSON lines"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: complete: events.jsonl is valid JSON lines"
fi

# --- the await's optional reap_lag_s field -----------------------------------
# dispatch-ladder-await appends ` reap_lag_s=<n>` to its verdict line when the
# completion was public at origin/main before the registry reaped the worker —
# the only place both timestamps exist in one process. Three things must hold:
# the trailing field is INERT for the disposition parse (`awk '{print $1;
# exit}'`), it reaches the awaited event as a structured number as well as in
# the human-readable detail, and its ABSENCE omits the key rather than reporting
# 0 — "not measured" and "measured, no lag" are different facts.
echo "Test: an await verdict's trailing reap_lag_s reaches the awaited event"
reset_seqs
set_seq advance '0|launched tactic-fixture-node tactic implement /implement' \
                '10|idle tactic-fixture-node not-selectable'
set_seq await   '0|advanced tactic-fixture-node implement -> origin/main reap_lag_s=137'
set_seq landed  '0|'
run_ladder
assert_eq "reap-lag: exit 0" "0" "$RC"
assert_eq "reap-lag: the trailing field did not disturb the disposition parse" "1" \
  "$(events_have awaited advanced)"
TOTAL=$((TOTAL + 1))
if jq -e 'select(.event == "awaited")
          | (.reap_lag_s == 137) and (.detail | test("reap_lag_s=137"))' \
     "$STATE_DIR/events.jsonl" >/dev/null 2>&1; then
  PASS=$((PASS + 1)); echo "  PASS: reap-lag: the awaited event carries reap_lag_s as a number and in detail"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: reap-lag: the awaited event carries reap_lag_s as a number and in detail"
  echo "    line: $(jq -c 'select(.event == "awaited")' "$STATE_DIR/events.jsonl")"
fi

echo "Test: an await verdict with no reap_lag_s omits the key entirely (never 0)"
reset_seqs
set_seq advance '0|launched tactic-fixture-node tactic implement /implement' \
                '10|idle tactic-fixture-node not-selectable'
set_seq await   '0|advanced tactic-fixture-node implement -> origin/main'
set_seq landed  '0|'
run_ladder
assert_eq "no-reap-lag: exit 0" "0" "$RC"
TOTAL=$((TOTAL + 1))
if jq -e 'select(.event == "awaited")
          | (has("reap_lag_s") | not) and (.detail | test("reap_lag_s") | not)' \
     "$STATE_DIR/events.jsonl" >/dev/null 2>&1; then
  PASS=$((PASS + 1)); echo "  PASS: no-reap-lag: the key is absent, not zero"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: no-reap-lag: the key is absent, not zero"
  echo "    line: $(jq -c 'select(.event == "awaited")' "$STATE_DIR/events.jsonl")"
fi

# --- pruned → 0 --------------------------------------------------------------
echo "Test: an awaited 'pruned' completes the run without asking the graph again"
reset_seqs
set_seq advance '0|launched tactic-fixture-node tactic review /review-fix'
set_seq await   '0|pruned tactic-fixture-node'
run_ladder
assert_eq "pruned: exit 0" "0" "$RC"
assert_eq "pruned: state.json disposition" "pruned" "$(jq -r .disposition "$STATE_DIR/state.json")"
assert_eq "pruned: no merge was attempted" "0" "$(calls merge)"

# --- idle ci-waiting re-polls, it does NOT halt ------------------------------
echo "Test: 'idle <id> ci-waiting' re-polls (halting there would halt after every implement)"
reset_seqs
set_seq advance '10|idle tactic-fixture-node ci-waiting' \
                '0|launched tactic-fixture-node tactic qa /qa-fix' \
                '10|idle tactic-fixture-node not-selectable'
set_seq await   '0|advanced tactic-fixture-node qa -> origin/main'
set_seq landed  '0|'
run_ladder
assert_eq "ci-waiting: exit 0 (the loop carried on)" "0" "$RC"
assert_eq "ci-waiting: an idle/ci-waiting event was recorded" "1" "$(events_have idle ci-waiting)"
assert_eq "ci-waiting: the node was launched after the wait" "1" "$(calls await)"
assert_eq "ci-waiting: no merge was attempted on the ci-waiting arm" "0" "$(calls merge)"

# --- the requeue budget ------------------------------------------------------
echo "Test: repeated 'stale-selection' spends a bounded requeue budget, then stalls"
reset_seqs
set_seq advance '10|idle tactic-fixture-node stale-selection'
run_ladder --max-run-s 600
assert_eq "requeue: exhaustion exits 12 (stalled)" "12" "$RC"
# Budget 5 = five requeues, and the sixth advance is the one that halts.
assert_eq "requeue: advance was called 6 times (5 requeues + the halting read)" "6" "$(calls advance)"
assert_eq "requeue: no merge was attempted" "0" "$(calls merge)"

echo "Test: 'scope-stale-demoted' spends the same budget"
reset_seqs
set_seq advance '10|idle tactic-fixture-node scope-stale-demoted'
run_ladder --max-run-s 600
assert_eq "scope-stale: exhaustion exits 12 (stalled)" "12" "$RC"
assert_eq "scope-stale: advance was called 6 times" "6" "$(calls advance)"

echo "Test: a launch refills the requeue budget"
reset_seqs
set_seq advance '10|idle tactic-fixture-node stale-selection' \
                '10|idle tactic-fixture-node stale-selection' \
                '0|launched tactic-fixture-node tactic implement /implement' \
                '10|idle tactic-fixture-node stale-selection'
set_seq await   '0|advanced tactic-fixture-node implement -> origin/main'
run_ladder --max-run-s 600
# Without the refill the post-launch run of stale-selections would halt after 3
# more; with it, it takes the full 5 + 1.
assert_eq "refill: exit 12 after the budget is spent a second time" "12" "$RC"
assert_eq "refill: advance was called 2 + 1 + 6 = 9 times" "9" "$(calls advance)"

# --- the reconcile pass ------------------------------------------------------
echo "Test: a 'reviewed' await flows into the reconcile pass and merges"
# The case the suite most conspicuously lacked: a node awaited at phase `review`
# whose review completed clean. dispatch-ladder-await answers `reviewed <id>
# review -> pending-merge` at exit 0, the driver breaks out of the await loop on
# any non-`pruned` exit 0, and the next advance finds nothing selectable —
# because router.ts classifies phase:review + the `reviewed` marker as
# `pending-merge` and excludes it from candidates. From there ONLY the reconcile
# pass can move the node, so this is the whole point of the pass existing.
reset_seqs
set_seq advance '0|launched tactic-fixture-node tactic review /review-fix' \
                '10|idle tactic-fixture-node not-selectable' \
                '10|idle tactic-fixture-node not-selectable'
set_seq await   '0|reviewed tactic-fixture-node review -> pending-merge'
set_seq landed  '4|' '0|'
set_seq merge   '0|merged #55 (tactic-fixture-node)'
set_seq reconcile '0|reconciled tactic-fixture-node -> main-qa'
run_ladder
assert_eq "reviewed: exit 0" "0" "$RC"
assert_eq "reviewed: the await verdict was recorded" "1" "$(events_have awaited reviewed)"
assert_eq "reviewed: it did NOT re-launch a phase after the review" "1" "$(calls await)"
assert_eq "reviewed: the pass merged the node" "1" "$(events_have merge merged)"
assert_eq "reviewed: the merge was absorbed" "1" "$(events_have absorb reconciled)"
assert_eq "reviewed: the absorb reset the ci-wait budget" "1" "$(events_have reconcile changed)"
assert_eq "reviewed: the selection lock was taken for the pass" "1" "$(lock_modes --wait)"
assert_eq "reviewed: and released again" "1" "$(lock_modes --release)"
# The driver has no real Claude session, so an invented holder id would be
# resolved as DEAD by dispatch-acquire-lock and give it no exclusion at all.
# Only the `headless:` form (plus the PID sentinel) is resolvable as live.
TOTAL=$((TOTAL + 1))
if [[ "$(head -n1 "$SEQ_DIR/lock.sid")" == headless:* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: reviewed: the lock was taken under a synthetic headless: holder id"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: reviewed: the lock was taken under a synthetic headless: holder id"
  echo "    sid: $(head -n1 "$SEQ_DIR/lock.sid")"
fi
# A `headless:` holder resolves as live iff its PID sentinel exists, so a leaked
# sentinel from a finished run would keep a dead holder looking alive.
assert_eq "reviewed: the liveness sentinel was removed on exit" "0" \
  "$(find "$TMPDIR_TEST/lock" -name '*.live' 2>/dev/null | grep -c . || true)"

echo "Test: an awaited 'lane-complete' takes another ladder step rather than halting"
# The sibling of the `reviewed` case above. dispatch-conflict's Lane 3 and
# qa-fix's fixing pass complete by PUSHING and never move `.phase`, so await
# answers `lane-complete <id> <phase>` at exit 0 off the `execution.lane_pass`
# stamp. The driver has NO case arm for it on purpose: the exit-0 arm only
# special-cases `pruned`, so the disposition flows through the phase evaluation
# and straight into the next advance — which is exactly right, because the node
# is still at the same phase and the ladder's next step is to look again.
reset_seqs
set_seq advance '0|launched tactic-fixture-node tactic qa /qa-fix' \
                '10|idle tactic-fixture-node not-selectable'
set_seq await   '0|lane-complete tactic-fixture-node qa'
set_seq landed  '0|'
run_ladder
assert_eq "lane-complete: exit 0" "0" "$RC"
assert_eq "lane-complete: the await verdict was recorded verbatim" "1" \
  "$(events_have awaited lane-complete)"
assert_eq "lane-complete: the phase was NOT re-awaited" "1" "$(calls await)"
# The point of the row: the driver took another ladder step instead of halting.
assert_eq "lane-complete: the driver advanced again" "2" "$(calls advance)"
assert_eq "lane-complete: the phase boundary was evaluated, as on any exit-0 verdict" "1" \
  "$(calls spawnjob)"

echo "Test: a 'recovered -> fix' route is the intervention: the next advance launches /fix-checks"
# Red CI on a `pending-merge` node is routed by reconcile-graph-review-stall and
# by nothing else — the node is excluded from selector candidates, so
# _gate_maybe_interrupt never sees it. The driver does not compute that; it
# reads the sweep's line and takes another ladder step.
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable' \
                '0|launched tactic-fixture-node tactic fix /fix-checks' \
                '10|idle tactic-fixture-node not-selectable'
set_seq await   '0|advanced tactic-fixture-node fix -> origin/main'
set_seq landed  '4|' '0|'
set_seq stall   '0|recovered tactic-fixture-node -> fix (ci=failing merge=MERGEABLE)'
# Poison the environment with both REST memo directories before the driver runs.
# Neither may reach a reconciler: this driver polls the three of them at
# different wall-clock times, and both memos are TTL-less and non-invalidating,
# so an inherited directory would pin the loop to one snapshot forever — the
# first `pending` verdict, or a pre-merge PR body. Asserted below, in the
# node-scope case that reads this same pass's recordings.
export DISPATCH_CI_VERDICT_CACHE="$SEQ_DIR/bogus-ci-verdict-cache"
export DISPATCH_PR_JSON_CACHE="$SEQ_DIR/bogus-pr-json-cache"
run_ladder
unset DISPATCH_CI_VERDICT_CACHE DISPATCH_PR_JSON_CACHE
assert_eq "routed: exit 0" "0" "$RC"
assert_eq "routed: a review-stall/recovered event was recorded" "1" \
  "$(events_have review-stall recovered)"
assert_eq "routed: the pass reported 'routed' and reset the budget" "1" \
  "$(events_have reconcile routed)"
assert_eq "routed: the very next advance launched the fix phase" "$NODE fix --timeout-s 3" \
  "$(await_argv 1)"
assert_eq "routed: that await carried a --since launch window too" "1" "$(await_since_count)"
assert_eq "routed: the driver never slept on a routed pass" "0" "$(events_have idle ci-wait)"

echo "Test: --node reaches all three reconcilers, never an unscoped sweep"
assert_eq "node-scope: graph-auto-merge" "--node $NODE" "$(head -n1 "$SEQ_DIR/merge.argv")"
assert_eq "node-scope: reconcile-graph-merged" "--node $NODE" "$(head -n1 "$SEQ_DIR/reconcile.argv")"
assert_eq "node-scope: reconcile-graph-review-stall" "--node $NODE" "$(head -n1 "$SEQ_DIR/stall.argv")"

echo "Test: neither REST memo cache reaches advance or a reconciler, however the environment arrives"
# The pass above exported both variables to bogus paths. Every recorded
# invocation of all three reconcilers must nonetheless read <unset> for both:
# dispatch-ladder-run clears them for the whole process. This is the containment
# backstop for gh_pr_view_rest's DISPATCH_PR_JSON_CACHE memo, which is armed
# only inside dispatch-select-tick's back-to-back reconciler pair; it also
# closes the pre-existing gap that the CI cache's `unset` was never asserted.
#
# ADVANCE IS IN THE LIST, AND IS THE REASON THE LIST IS NOT JUST THE THREE
# RECONCILERS. dispatch-ladder-advance is not a reconciler and runs EARLIER in
# every pass than any of them, but it calls graph-select-target, whose
# `mergedAt` freshness reads go through gh_pr_view_rest — one of the two
# readers lib.sh's header names as never allowed to see the memo. A driver that
# unset only beside the reconciler calls left every advance reading a pinned
# pre-merge snapshot, and this loop asserted nothing about it. The routed pass
# above calls advance three times, so a per-call-site unset fails here on the
# FIRST recorded advance while the later two (after reconcile_pass has run in
# the same shell) look clean — which is exactly the shape that made the gap
# invisible in production.
for _seq in advance merge reconcile stall; do
  assert_eq "no-cache: $_seq recorded at least one invocation" "1" \
    "$([[ -s "$SEQ_DIR/$_seq.env" ]] && echo 1 || echo 0)"
  assert_eq "no-cache: every $_seq call saw both memos unset" "0" \
    "$(grep -cv '^CI=<unset> PRJSON=<unset>$' "$SEQ_DIR/$_seq.env" || true)"
done

echo "Test: a merge is absorbed across passes, and a 'deferred' re-polls"
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable' \
                '10|idle tactic-fixture-node not-selectable' \
                '0|launched tactic-fixture-node tactic main-qa /qa-main' \
                '10|idle tactic-fixture-node not-selectable'
set_seq await   '0|advanced tactic-fixture-node main-qa -> origin/main'
set_seq landed  '4|' '4|' '0|'
set_seq merge   '0|merged #123 (tactic-fixture-node)' '0|'
set_seq reconcile '0|deferred tactic-fixture-node (main-qa phase not yet in schema)' \
                  '0|reconciled tactic-fixture-node -> main-qa'
run_ladder
assert_eq "merge: exit 0" "0" "$RC"
assert_eq "merge: graph-auto-merge was called once per pass" "2" "$(calls merge)"
assert_eq "merge: it was called with --node" "--node $NODE" "$(head -n1 "$SEQ_DIR/merge.argv")"
assert_eq "merge: reconcile-graph-merged was called once per pass" "2" "$(calls reconcile)"
assert_eq "merge: a merge/merged event was recorded" "1" "$(events_have merge merged)"
assert_eq "merge: the second pass merged nothing" "1" "$(events_have merge no-merge)"
assert_eq "merge: an absorb/deferred event was recorded" "1" "$(events_have absorb deferred)"
assert_eq "merge: an absorb/reconciled event was recorded" "1" "$(events_have absorb reconciled)"
# THE LOCK IS NEVER HELD ACROSS THE SLEEP. Two passes ran, so the lock was taken
# twice and released twice — a driver that released only at the end of the loop,
# or not at all, would wedge a concurrent dispatch tick for the whole poll.
assert_eq "merge: the lock was taken once per pass" "2" "$(lock_modes --wait)"
assert_eq "merge: and released once per pass, before the sleep" "2" "$(lock_modes --release)"
# A pass that MERGED is progress even when its absorb deferred, so it resets the
# budget and takes the next ladder step immediately — no sleep, no idle event.
assert_eq "merge: the merging pass counted as progress" "1" "$(events_have reconcile merged)"
assert_eq "merge: and therefore never charged the ci-wait budget" \
  "0" "$(events_have idle grace-wait)"

echo "Test: the reconciler's GRACE window is the SILENT case, and is polled through"
# reconcile-graph-merged skips a merge younger than GRAPH_RECONCILE_GRACE with a
# bare `continue` — it prints NOTHING. Because this run merged, silence means
# "not aged yet", so the driver must keep polling rather than call it a no-op.
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
set_seq landed  '4|' '4|' '4|' '0|'
set_seq merge   '0|merged #7 (tactic-fixture-node)' '0|'
set_seq reconcile '0|' '0|' '0|reconciled tactic-fixture-node -> done'
run_ladder
assert_eq "grace: exit 0" "0" "$RC"
assert_eq "grace: the reconciler was polled 3 times" "3" "$(calls reconcile)"
assert_eq "grace: two absorb/grace-wait events were recorded" "2" "$(events_have absorb grace-wait)"
# Only the SECOND of those is a wait: the first pass merged, which is progress.
# The wait it does take is charged to the budget as grace, never as CI — no
# later evaluation can tell the two apart afterwards.
assert_eq "grace: the wait was charged as grace, not CI" "1" "$(events_have idle grace-wait)"
assert_eq "grace: and never as CI" "0" "$(events_have idle ci-wait)"

echo "Test: without a merge of our own, a silent reconcile is a noop, not a grace window"
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
run_ladder --ci-wait-s 1
assert_eq "noop: exit 10 (the budget ran out)" "10" "$RC"
assert_eq "noop: an absorb/noop event was recorded" "2" "$(events_have absorb noop)"
assert_eq "noop: no grace-wait was claimed" "0" "$(events_have absorb grace-wait)"
assert_eq "noop: the waits were charged to CI" "2" "$(events_have idle ci-wait)"

echo "Test: 'held' from graph-auto-merge throws — a hold is a person's call"
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
set_seq merge   '0|held tactic-fixture-node (office-hours)'
run_ladder
assert_eq "held: exit 11 (throw)" "11" "$RC"
assert_eq "held: the absorb was never reached" "0" "$(calls reconcile)"
assert_eq "held: state.json status is halted" "halted" "$(jq -r .status "$STATE_DIR/state.json")"
assert_eq "held: the lock was released before halting" "1" "$(lock_modes --release)"

# --- Advisory main-conflict prediction (check_main_conflict_prediction) -----
# check_main_conflict_prediction runs `git merge-tree --write-tree origin/main
# origin/<node>` on the SAME POLL_S cadence as the driver's own idle/quiet
# re-polls (poll_wait), and logs a `main-conflict-prediction` event ONLY on a
# transition in the verdict (clean/conflict/unknown) — never once per poll.
# It is advisory: it must never change RC, never gate, never requeue.
#
# All three cases below drive the "not-selectable" quiet-reconcile arm with
# merge/reconcile/stall all no-op (mirrors "a silent reconcile is a noop"
# above), so each pass is exactly THREE git calls in order: fetch, merge
# --ff-only, then the advisory merge-tree check from poll_wait.
echo "Test: a clean prediction on every poll writes no event"
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
run_ladder --ci-wait-s 2
assert_eq "predict-clean: exit 10 (the ci-wait budget ran out, unaffected)" "10" "$RC"
TOTAL=$((TOTAL + 1))
if ! jq -e 'select(.event == "main-conflict-prediction")' "$STATE_DIR/events.jsonl" \
     >/dev/null 2>&1; then
  PASS=$((PASS + 1)); echo "  PASS: predict-clean: no main-conflict-prediction event of any disposition was recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: predict-clean: no main-conflict-prediction event of any disposition was recorded"
  echo "    events: $(jq -c 'select(.event == "main-conflict-prediction")' "$STATE_DIR/events.jsonl")"
fi

echo "Test: a conflict prediction fires exactly one event on the transition, and stays quiet while it persists"
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
# 4 passes x 3 calls (fetch, merge, merge-tree): pass1's merge-tree is clean
# (no event — matches the assumed starting state); pass2's is the transition
# to conflict (the one event); passes 3 and 4 see the SAME conflict verdict
# and must write nothing more.
set_seq git     '0|' '0|' '0|' \
                '0|' '0|' '1|' \
                '0|' '0|' '1|' \
                '0|' '0|' '1|'
run_ladder --ci-wait-s 3
assert_eq "predict-conflict: exit 10 (the ci-wait budget ran out, unaffected by the prediction)" "10" "$RC"
assert_eq "predict-conflict: four quiet passes ran (four merge-tree checks among them)" \
  "12" "$(calls git)"
assert_eq "predict-conflict: exactly one event fired on the clean->conflict transition" \
  "1" "$(events_have main-conflict-prediction conflict)"
assert_eq "predict-conflict: no clean event was recorded (only the transition is logged)" \
  "0" "$(events_have main-conflict-prediction clean)"
TOTAL=$((TOTAL + 1))
N_EVENTS=$(jq -c 'select(.event == "main-conflict-prediction")' "$STATE_DIR/events.jsonl" 2>/dev/null | grep -c .) || N_EVENTS=0
if [[ "$N_EVENTS" == "1" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: predict-conflict: exactly ONE main-conflict-prediction event total, despite three polls seeing the conflict persist"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: predict-conflict: exactly ONE main-conflict-prediction event total, despite three polls seeing the conflict persist"
  echo "    count: $N_EVENTS"
fi
TOTAL=$((TOTAL + 1))
DETAIL=$(jq -r 'select(.event == "main-conflict-prediction") | .detail' "$STATE_DIR/events.jsonl" 2>/dev/null)
if grep -q 'advisory only, never gates or halts' <<<"$DETAIL"; then
  PASS=$((PASS + 1)); echo "  PASS: predict-conflict: the event's own detail declares it advisory-only, for a later editor reading the journal"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: predict-conflict: the event's own detail declares it advisory-only, for a later editor reading the journal"
  echo "    detail: $DETAIL"
fi

echo "Test: a prediction that cannot be computed (exit >1) logs 'unknown' and the run continues unaffected"
# rc=128 stands in for merge-tree's real-world failure mode named in the
# driver's own comment: the node's branch does not exist on origin yet.
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
set_seq git     '0|' '0|' '128|'
run_ladder --ci-wait-s 0
assert_eq "predict-unknown: exit 10 (idle halt) — the SAME disposition an ordinary quiet pass reaches" \
  "10" "$RC"
assert_eq "predict-unknown: exactly one 'unknown' event was recorded" \
  "1" "$(events_have main-conflict-prediction unknown)"
assert_eq "predict-unknown: no 'conflict' or 'clean' event accompanied it" \
  "0" "$(( $(events_have main-conflict-prediction conflict) + $(events_have main-conflict-prediction clean) ))"
assert_eq "predict-unknown: the pass still reached the reconciler despite the failed prediction" \
  "1" "$(calls reconcile)"

echo "Test: repeated quiet passes exhaust --ci-wait-s and halt naming CI"
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
run_ladder --max-run-s 600 --ci-wait-s 2
assert_eq "ci-budget: exit 10 (idle halt)" "10" "$RC"
# poll 1s, budget 2s: the third pass is the one that pushes ci_waited past it.
assert_eq "ci-budget: three passes ran before the halt" "3" "$(calls merge)"
assert_eq "ci-budget: the absorb ran once per pass and never polled internally" \
  "3" "$(calls reconcile)"
assert_eq "ci-budget: advance was read once per pass" "3" "$(calls advance)"
assert_eq "ci-budget: the lock was released every pass, including the last" \
  "3" "$(lock_modes --release)"
TOTAL=$((TOTAL + 1))
if jq -r 'select(.event == "halt") | .detail' "$STATE_DIR/events.jsonl" 2>/dev/null \
     | grep -q -- '--ci-wait-s'; then
  PASS=$((PASS + 1)); echo "  PASS: ci-budget: the halt names the CI wait, not 'already ran once'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: ci-budget: the halt names the CI wait, not 'already ran once'"
  echo "    detail: $(jq -r 'select(.event == "halt") | .detail' "$STATE_DIR/events.jsonl")"
fi

echo "Test: a busy selection lock is a soft retry, not a halt"
# `busy` means a dispatch tick is mid-selection. Transient by construction: the
# outer wait re-polls, and NOTHING else in the pass runs meanwhile.
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
set_seq lock    '0|busy' '0|busy' '0|acquired'
# The last two lines are classify_terminus's own reads at the halt: `4` = the
# node is PRESENT at origin/main, then `0` = it is done. Spelled out rather than
# left to the fake's repeat-the-last-line fallback, which would answer "absent"
# to the --blob read and send the classification down the git-history probe —
# two more git calls, in a case whose whole subject is which git calls a busy
# pass makes.
set_seq landed  '4|' '4|' '4|' '0|' '4|' '0|'
set_seq merge   '0|merged #8 (tactic-fixture-node)'
set_seq reconcile '0|reconciled tactic-fixture-node -> done'
run_ladder
assert_eq "lock-busy: exit 0 (the loop carried on and finished)" "0" "$RC"
assert_eq "lock-busy: two lock/busy events were recorded" "2" "$(events_have lock busy)"
assert_eq "lock-busy: a busy pass merged nothing" "1" "$(calls merge)"
# 2 sync calls (fetch + merge --ff-only) from the ONE acquiring pass, plus 2
# advisory `git merge-tree` calls from check_main_conflict_prediction — one per
# busy-lock quiet poll (poll_wait's cadence, unconditional on lock state: the
# prediction is read-only and needs no lock, so it still runs on a busy pass).
# The busy passes themselves still skip fetch/merge entirely — see the argv
# assertion just below, which is what actually pins "no sync on a busy pass".
assert_eq "lock-busy: a busy pass did not sync the checkout either" "4" "$(calls git)"
assert_eq "lock-busy: only ONE pass ran fetch (the acquiring one)" \
  "1" "$(grep -c -- '-C .* fetch origin main$' "$SEQ_DIR/git.argv" 2>/dev/null || true)"
assert_eq "lock-busy: only the acquiring pass released" "1" "$(lock_modes --release)"

echo "Test: a main checkout that will not sync halts 11 and merges NOTHING"
# The reconcilers enumerate their candidate set from the LOCAL tree, so merging
# against an unsynced checkout could merge straight past a park that landed
# after this run started.
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
set_seq git     '0|' '1|'
run_ladder
assert_eq "sync-fail: exit 11 (throw)" "11" "$RC"
assert_eq "sync-fail: graph-auto-merge was never called" "0" "$(calls merge)"
assert_eq "sync-fail: the lock was released before halting" "1" "$(lock_modes --release)"
TOTAL=$((TOTAL + 1))
if [[ "$(jq -r .detail "$STATE_DIR/state.json")" == main-sync-failed* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: sync-fail: state.json names main-sync-failed"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: sync-fail: state.json names main-sync-failed"
  echo "    detail: $(jq -r .detail "$STATE_DIR/state.json")"
fi

echo "Test: a failed fetch is distinguished from a failed fast-forward"
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
set_seq git     '1|'
run_ladder
assert_eq "fetch-fail: exit 11 (throw)" "11" "$RC"
assert_eq "fetch-fail: the merge step was never attempted" "1" "$(calls git)"
assert_eq "fetch-fail: graph-auto-merge was never called" "0" "$(calls merge)"

echo "Test: a graph-auto-merge hard error throws rather than being retried"
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
set_seq merge   '1|'
run_ladder
assert_eq "merge-error: exit 11 (throw)" "11" "$RC"
assert_eq "merge-error: the lock was released before halting" "1" "$(lock_modes --release)"

echo "Test: a reconcile-graph-merged hard error throws"
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
set_seq merge   '0|merged #9 (tactic-fixture-node)'
set_seq reconcile '1|'
run_ladder
assert_eq "absorb-error: exit 11 (throw)" "11" "$RC"

echo "Test: a reconcile-graph-review-stall hard error throws"
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
set_seq stall   '1|'
run_ladder
assert_eq "stall-error: exit 11 (throw)" "11" "$RC"

echo "Test: an rc=2 usage answer from any driven script is exit 2, never a retry"
# rc=2 means the driver called a script wrongly — an argument protocol drifted.
# Retrying that forever would bury the drift under a ci-wait budget.
for pair in "merge|graph-auto-merge" "reconcile|reconcile-graph-merged" \
            "stall|reconcile-graph-review-stall" "lock|dispatch-acquire-lock"; do
  name="${pair%%|*}"
  reset_seqs
  set_seq advance '10|idle tactic-fixture-node not-selectable'
  set_seq merge   '0|merged #4 (tactic-fixture-node)'
  set_seq "$name" '2|'
  run_ladder
  assert_eq "usage rc=2 from ${pair#*|}: exit 2" "2" "$RC"
done

# --- await's exit codes ------------------------------------------------------
echo "Test: await exit 20 is re-called with identical arguments until it answers"
reset_seqs
set_seq advance '0|launched tactic-fixture-node tactic implement /implement' \
                '10|idle tactic-fixture-node not-selectable'
set_seq await   '20|running tactic-fixture-node implement' \
                '20|running tactic-fixture-node implement' \
                '0|advanced tactic-fixture-node implement -> origin/main'
set_seq landed  '0|'
run_ladder
assert_eq "re-call: exit 0" "0" "$RC"
assert_eq "re-call: await was called 3 times" "3" "$(calls await)"
assert_eq "re-call: two await-repoll events were recorded" "2" "$(events_have await-repoll running)"
TOTAL=$((TOTAL + 1))
if [[ "$(sed -n 1p "$SEQ_DIR/await.argv")" == "$(sed -n 3p "$SEQ_DIR/await.argv")" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: re-call: the arguments were identical on every call"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: re-call: the arguments were identical on every call"
  echo "    argv: $(cat "$SEQ_DIR/await.argv")"
fi

# --- await exit 21: the held session is waited out, once ---------------------
echo "Test: await exit 21 re-runs the owed sweeps and re-polls, rather than halting"
# THE WEDGE THIS ARM CLOSES. An escalating phase stops WITHOUT a node-terminal
# marker on purpose, so dispatch-self-close HOLDs its job and await answers
# `held-observing` (21). The park that resolves it comes from
# terminal_without_disposition_sweep — run by this very driver, but needing
# DISPATCH_TERMINAL_DISPOSITION_GRACE_S (300s) of idle first. While the driver
# halted on the first held answer, its own healer could only ever run AFTER the
# halt, i.e. never. So the arm must re-run BOTH sweeps between held polls.
reset_seqs
set_seq advance '0|launched tactic-fixture-node tactic qa /qa-fix' \
                '10|idle tactic-fixture-node not-selectable'
set_seq await   '21|held-observing tactic-fixture-node qa' \
                '21|held-observing tactic-fixture-node qa' \
                '0|advanced tactic-fixture-node qa -> origin/main'
set_seq landed  '0|'
run_ladder
assert_eq "held: exit 0 — the wait ended in progress, not a halt" "0" "$RC"
assert_eq "held: await was re-called until it answered" "3" "$(calls await)"
assert_eq "held: a held-sweep event was recorded per held poll" "2" \
  "$(events_have held-sweep held-observing)"
# The point of the arm: 2 sweeps before the 2 advances, PLUS one per held poll.
assert_eq "held: the terminal-disposition sweep ran on every held poll too" "4" \
  "$(terminal_sweeps)"
assert_eq "held: the ledger sweep kept pace with it" "4" "$(sweeps)"
# It is a wait, never a retry: the phase is not relaunched, and the verdict
# still comes from the next await's read of origin/main.
assert_eq "held: the phase was never relaunched" "2" "$(calls advance)"
TOTAL=$((TOTAL + 1))
if [[ "$(sed -n 1p "$SEQ_DIR/await.argv")" == "$(sed -n 3p "$SEQ_DIR/await.argv")" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: held: the re-poll used identical await arguments"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: held: the re-poll used identical await arguments"
  echo "    argv: $(cat "$SEQ_DIR/await.argv")"
fi

echo "Test: a held session the sweeps never heal still halts 11, unconditionally"
# The wait is BOUNDED. HELD_GRACE_S=1 with --poll-s 1: the first held poll
# charges 1s (not yet past), the second charges 2s and halts. Nothing here is
# retried forever just because a healer exists for the ordinary case.
reset_seqs
set_seq advance '0|launched tactic-fixture-node tactic qa /qa-fix'
set_seq await   '21|held-observing tactic-fixture-node qa'
export HELD_GRACE_S=1
run_ladder --max-run-s 600
unset HELD_GRACE_S
assert_eq "held-grace: exit 11 (throw)" "11" "$RC"
assert_eq "held-grace: the wait was bounded at two polls" "2" "$(calls await)"
assert_eq "held-grace: state.json status is halted" "halted" "$(jq -r .status "$STATE_DIR/state.json")"
TOTAL=$((TOTAL + 1))
if jq -r 'select(.event == "halt") | .detail' "$STATE_DIR/events.jsonl" 2>/dev/null \
     | grep -q 'HELD_GRACE_S'; then
  PASS=$((PASS + 1)); echo "  PASS: held-grace: the halt names the window it exhausted"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: held-grace: the halt names the window it exhausted"
  echo "    detail: $(jq -r 'select(.event == "halt") | .detail' "$STATE_DIR/events.jsonl")"
fi

echo "Test: await's terminal exit codes are passed through, never reinterpreted"
for pair in "11|throw tactic-fixture-node parked" \
            "12|stalled tactic-fixture-node qa" \
            "14|throw tactic-fixture-node unknown-graph-read" \
            "2|"; do
  want_rc="${pair%%|*}"
  reset_seqs
  set_seq advance '0|launched tactic-fixture-node tactic qa /qa-fix'
  set_seq await "$pair"
  run_ladder
  assert_eq "await passthrough: exit $want_rc" "$want_rc" "$RC"
done

echo "Test: an unmapped await exit code is an internal error, not a silent step forward"
reset_seqs
set_seq advance '0|launched tactic-fixture-node tactic qa /qa-fix'
set_seq await   '7|weird tactic-fixture-node'
run_ladder
assert_eq "await unmapped: exit 1 (internal)" "1" "$RC"

# --- advance's exit codes ----------------------------------------------------
echo "Test: advance's terminal exit codes are passed through"
for pair in "11|throw tactic-fixture-node parked" \
            "11|throw tactic-fixture-node launch-unverified" \
            "13|claimed tactic-fixture-node live-session" \
            "13|claimed tactic-fixture-node terminal-session" \
            "2|refused tactic-fixture-node strategy"; do
  want_rc="${pair%%|*}"
  reset_seqs
  set_seq advance "$pair"
  run_ladder
  assert_eq "advance passthrough: exit $want_rc" "$want_rc" "$RC"
  assert_eq "advance passthrough $want_rc: nothing was awaited" "0" "$(calls await)"
done

echo "Test: an unmapped advance exit code is an internal error"
reset_seqs
set_seq advance '9|surprise tactic-fixture-node'
run_ladder
assert_eq "advance unmapped: exit 1 (internal)" "1" "$RC"

echo "Test: an advance exit 0 whose line cannot be parsed is an internal error"
reset_seqs
set_seq advance '0|launched'
run_ladder
assert_eq "advance malformed: exit 1 (internal)" "1" "$RC"

# --- verify-landed's third answer -------------------------------------------
echo "Test: an unreadable origin/main is exit 14, never a merge and never a 'done'"
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
set_seq landed  '1|'
run_ladder
assert_eq "landed unknown: exit 14" "14" "$RC"
assert_eq "landed unknown: no merge was attempted" "0" "$(calls merge)"
assert_eq "landed unknown: the phase question was asked at origin/main" \
  "-C $PROJECT --node $NODE --jq .phase == \"done\"" "$(head -n1 "$SEQ_DIR/landed.argv")"

# --- the wall clock ----------------------------------------------------------
echo "Test: --max-run-s is enforced and reported as exit 21, not as a silent stop"
reset_seqs
set_seq advance '10|idle tactic-fixture-node ci-waiting'
RC=0
OUT=$("$RUN" "$NODE" --poll-s 1 --max-run-s 2 2>/dev/null) || RC=$?
assert_eq "max-run: exit 21" "21" "$RC"
assert_eq "max-run: state.json disposition" "timeout" "$(jq -r .disposition "$STATE_DIR/state.json")"
assert_eq "max-run: state.json status is halted" "halted" "$(jq -r .status "$STATE_DIR/state.json")"

# --- the per-phase evaluation ------------------------------------------------
# The driver spawns /rsi at every phase boundary and, from
# halt(), for the phase a halted run still owes. Everything asserted here is
# invisible until it costs a real run: a name that dedups would silently drop
# every phase after the first, and a spawn that could halt the ladder would let
# the review gate the work.
echo "Test: a per-phase evaluation is spawned at EVERY phase boundary, with distinct names"
reset_seqs
set_seq advance '0|launched tactic-fixture-node tactic implement /implement' \
                '0|launched tactic-fixture-node tactic qa /qa-fix' \
                '10|idle tactic-fixture-node not-selectable'
set_seq await   '0|advanced tactic-fixture-node implement -> origin/main' \
                '0|advanced tactic-fixture-node qa -> origin/main'
set_seq landed  '0|'
run_ladder
assert_eq "eval: exit 0" "0" "$RC"
assert_eq "eval: one spawn per phase boundary" "2" "$(calls spawnjob)"
assert_eq "eval: both spawns were recorded as events" "2" "$(events_have eval spawned)"
# THE --name IS THE DEDUP KEY. dispatch-spawn-job spawns NOTHING for a name a
# live session already holds, so two phases sharing a name would evaluate the
# first and silently skip the second.
EVAL_NAME_1=$(sed -n 1p "$SEQ_DIR/spawnjob.argv" | sed 's/.*--name \([^ ]*\).*/\1/')
EVAL_NAME_2=$(sed -n 2p "$SEQ_DIR/spawnjob.argv" | sed 's/.*--name \([^ ]*\).*/\1/')
TOTAL=$((TOTAL + 1))
if [[ -n "$EVAL_NAME_1" && "$EVAL_NAME_1" != "$EVAL_NAME_2" \
      && "$EVAL_NAME_1" == *"$NODE"*implement* && "$EVAL_NAME_2" == *"$NODE"*qa* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: eval: the two spawns carry distinct node+phase names"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: eval: the two spawns carry distinct node+phase names"
  echo "    names: '$EVAL_NAME_1' '$EVAL_NAME_2'"
fi
TOTAL=$((TOTAL + 1))
if grep -q -- "--cwd $PROJECT " "$SEQ_DIR/spawnjob.argv" \
   && grep -q -- "/rsi $NODE implement --since [0-9]" "$SEQ_DIR/spawnjob.argv"; then
  PASS=$((PASS + 1)); echo "  PASS: eval: the prompt carries the node, the phase and the launch epoch"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: eval: the prompt carries the node, the phase and the launch epoch"
  echo "    argv: $(cat "$SEQ_DIR/spawnjob.argv")"
fi
# The tier is dispatch-phase-model's answer for the `ladder-eval` pseudo-phase,
# not a literal at the call site.
TOTAL=$((TOTAL + 1))
if grep -q -- "--model opus" "$SEQ_DIR/spawnjob.argv"; then
  PASS=$((PASS + 1)); echo "  PASS: eval: the model came from dispatch-phase-model (opus)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: eval: the model came from dispatch-phase-model (opus)"
  echo "    argv: $(cat "$SEQ_DIR/spawnjob.argv")"
fi
# The default verify path, deliberately: these one-offs have no reservation
# ledger and no sweep to reconcile a kick that never came up.
TOTAL=$((TOTAL + 1))
if ! grep -q -- "--no-verify" "$SEQ_DIR/spawnjob.argv"; then
  PASS=$((PASS + 1)); echo "  PASS: eval: the spawn keeps the default registration verify"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: eval: the spawn keeps the default registration verify"
fi
# elapsed_s / window_s / await_repolls as NUMBERS, not text inside detail.
TOTAL=$((TOTAL + 1))
if jq -e 'select(.event == "awaited")
          | (.elapsed_s | type == "number")
            and (.window_s == 3) and (.await_repolls | type == "number")' \
     "$STATE_DIR/events.jsonl" >/dev/null 2>&1; then
  PASS=$((PASS + 1)); echo "  PASS: eval: the awaited event carries structured numeric timing fields"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: eval: the awaited event carries structured numeric timing fields"
  echo "    line: $(jq -c 'select(.event == "awaited")' "$STATE_DIR/events.jsonl")"
fi

echo "Test: the evaluator's --since predates a slow launch, not just the phase boundary"
# dispatch-ladder-advance blocks on verify_launch before it returns, so
# LAUNCH_EPOCH (stamped right after advance returns, dispatch-ladder-run:1116)
# is measurably later than the worker session it is meant to bound. Make the
# fake advance itself slow — standing in for that blocking wait — so a
# regression back to LAUNCH_EPOCH is distinguishable from the fix (PASS_SINCE,
# captured before advance is called, dispatch-ladder-run:1082/1120) rather than
# both landing in the same instant.
reset_seqs
cat >"$LADDER/dispatch-ladder-advance" <<STUB
#!/usr/bin/env bash
printf '%s\n' "\$*" >>"$SEQ_DIR/advance.argv"
n=\$(cat "$SEQ_DIR/advance.count"); echo \$((n + 1)) >"$SEQ_DIR/advance.count"
if [[ "\$n" -eq 0 ]]; then
  # The blocking verify_launch, stood in for by a sleep the assertion can see.
  sleep 2
  printf 'launched %s tactic implement /implement\n' "$NODE"
  exit 0
fi
# Every later call ENDS THE RUN, the same way the sequence-driven fake's last
# line does everywhere else in this suite. A stub that only ever launches makes
# the driver relaunch forever: nothing here bounds the loop but the advance
# answer, so the case hangs the whole suite rather than failing it.
printf 'idle %s not-selectable\n' "$NODE"
exit 10
STUB
chmod +x "$LADDER/dispatch-ladder-advance"
set_seq await '0|advanced tactic-fixture-node implement -> origin/main'
set_seq landed '0|'
T_BEFORE=$(date +%s)
run_ladder
make_seq_fake "$LADDER/dispatch-ladder-advance" advance
assert_eq "since-skew: exit 0" "0" "$RC"
SINCE=$(sed -n '1p' "$SEQ_DIR/spawnjob.argv" | sed -E 's/.*--since ([0-9]+)$/\1/')
TOTAL=$((TOTAL + 1))
# A regression to LAUNCH_EPOCH would land at T_BEFORE+2 or later (the sleep);
# the fix lands within a whisker of T_BEFORE (before the sleep). Bound the pass
# case generously (< +2s) to absorb process-startup jitter without accepting
# the regression.
if [[ "$SINCE" -ge "$T_BEFORE" && "$SINCE" -lt "$((T_BEFORE + 2))" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: since-skew: --since is PASS_SINCE (pre-launch), not LAUNCH_EPOCH (post-launch)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: since-skew: --since is PASS_SINCE (pre-launch), not LAUNCH_EPOCH (post-launch)"
  echo "    T_BEFORE=$T_BEFORE SINCE=$SINCE"
fi

echo "Test: halt() spawns the evaluation a mid-run halt still owes"
# Exit 12: the worker stopped with no graph change — the phase never reached its
# boundary, so nothing spawned there. Under the old terminus-only rule this run,
# one of the most defect-rich kinds, recorded nothing at all.
reset_seqs
set_seq advance '0|launched tactic-fixture-node tactic implement /implement'
set_seq await   '12|stalled tactic-fixture-node implement'
run_ladder
assert_eq "halt-eval: exit 12 (stalled), unchanged by the spawn" "12" "$RC"
assert_eq "halt-eval: the owed evaluation was spawned once" "1" "$(calls spawnjob)"
TOTAL=$((TOTAL + 1))
if grep -q -- "/rsi $NODE implement --since [0-9]" "$SEQ_DIR/spawnjob.argv"; then
  PASS=$((PASS + 1)); echo "  PASS: halt-eval: it evaluated the phase the run was in"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: halt-eval: it evaluated the phase the run was in"
  echo "    argv: $(cat "$SEQ_DIR/spawnjob.argv")"
fi

echo "Test: every halting exit code owes it — one halt() edit, not five call sites"
for pair in "11|throw tactic-fixture-node parked" \
            "14|throw tactic-fixture-node unknown-graph-read"; do
  want_rc="${pair%%|*}"
  reset_seqs
  set_seq advance '0|launched tactic-fixture-node tactic qa /qa-fix'
  set_seq await "$pair"
  run_ladder
  assert_eq "halt-eval $want_rc: exit passed through" "$want_rc" "$RC"
  assert_eq "halt-eval $want_rc: the owed evaluation was spawned" "1" "$(calls spawnjob)"
done

echo "Test: a halt with no launched phase spawns NOTHING"
# `refused`/`claimed`/`throw` straight off the first advance: no phase ran, so
# there is nothing to evaluate and a spawn would be a job with no subject.
for pair in "2|refused tactic-fixture-node strategy" \
            "13|claimed tactic-fixture-node live-session" \
            "11|throw tactic-fixture-node parked"; do
  want_rc="${pair%%|*}"
  reset_seqs
  set_seq advance "$pair"
  run_ladder
  assert_eq "no-phase $want_rc: exit passed through" "$want_rc" "$RC"
  assert_eq "no-phase $want_rc: nothing was evaluated" "0" "$(calls spawnjob)"
done

echo "Test: a phase already evaluated at its boundary is not evaluated twice by halt()"
reset_seqs
set_seq advance '0|launched tactic-fixture-node tactic review /review-fix' \
                '10|idle tactic-fixture-node not-selectable'
set_seq await   '0|reviewed tactic-fixture-node review -> pending-merge'
set_seq merge   '0|held tactic-fixture-node (office-hours)'
run_ladder
assert_eq "no-double: exit 11 (the hold still throws)" "11" "$RC"
assert_eq "no-double: the review phase was evaluated exactly once" "1" "$(calls spawnjob)"

echo "Test: a spawn that fails is a warning, never the ladder's disposition"
# The review must never gate the work: a ladder that reached `done` reports 0
# whatever happened to its evaluation job.
reset_seqs
set_seq advance '0|launched tactic-fixture-node tactic implement /implement' \
                '10|idle tactic-fixture-node not-selectable'
set_seq landed  '0|'
set_seq spawnjob '1|'
run_ladder
assert_eq "eval-fail: exit 0 — the run completed regardless" "0" "$RC"
assert_eq "eval-fail: the failure was recorded, not swallowed" "2" \
  "$(events_have eval spawn-failed)"
assert_eq "eval-fail: state.json still reports complete" "complete" \
  "$(jq -r .status "$STATE_DIR/state.json")"

echo "Test: a failed boundary spawn is still OWED, so halt() retries it once"
# The claim rule: a spawn that failed evaluated nothing, so it must not mark the
# phase done. halt() is the one terminal path and runs once, so the retry budget
# is exactly one — the sequence below fails the boundary attempt and succeeds on
# the halt attempt, and the phase ends up evaluated rather than silently skipped.
reset_seqs
set_seq advance '0|launched tactic-fixture-node tactic implement /implement' \
                '10|idle tactic-fixture-node not-selectable'
set_seq landed  '0|'
set_seq spawnjob '1|' '0|spawned'
run_ladder
assert_eq "eval-retry: exit 0" "0" "$RC"
assert_eq "eval-retry: the boundary failure is on the record" "1" \
  "$(events_have eval spawn-failed)"
assert_eq "eval-retry: and halt() paid the debt" "1" "$(events_have eval spawned)"
assert_eq "eval-retry: exactly two attempts — the budget is one retry, not a loop" \
  "2" "$(calls spawnjob)"

echo "Test: a deduped spawn is recorded as deduped, not as spawned"
reset_seqs
set_seq advance '0|launched tactic-fixture-node tactic qa /qa-fix' \
                '10|idle tactic-fixture-node not-selectable'
set_seq landed  '0|'
set_seq spawnjob '0|deduped'
run_ladder
assert_eq "eval-dedup: exit 0" "0" "$RC"
assert_eq "eval-dedup: the event says deduped" "1" "$(events_have eval deduped)"

# --- the terminal-disposition sweep -----------------------------------------
echo "Test: the terminal-disposition sweep runs once per pass, before each advance"
# Same 1:1-before-every-advance contract as the ledger sweep, held across a run
# that takes several quiet passes rather than one launch.
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
run_ladder --max-run-s 600 --ci-wait-s 2
assert_eq "terminal-sweep: three passes ran" "3" "$(calls advance)"
assert_eq "terminal-sweep: one sweep per pass" "3" "$(terminal_sweeps)"
assert_eq "terminal-sweep: each ran BEFORE its advance" "0,1,2" "$(terminal_sweep_order)"
assert_eq "terminal-sweep: the ledger sweep kept pace with it" "3" "$(sweeps)"

# --- Unit 11: the deadline is re-checked after the sweeps ------------------
echo "Test: the deadline is re-checked after both sweeps, before the advance"
# check_deadline runs once at the top of the loop, and the sweeps run after
# that — so a sweep that eats the remaining budget must be caught by a SECOND
# check_deadline call, or the pass would still START an advance past
# --max-run-s. --max-run-s 3 lets the top-of-loop check pass, then the terminal
# sweep stub sleeps 5s — past the 3s deadline — before the driver ever reaches
# dispatch-ladder-advance.
#
# WHY 3 AND 5, AND NOT 1 AND 2. The old pair raced. dispatch-ladder-run:468-469
# captures START_EPOCH as a WHOLE SECOND and sets DEADLINE_EPOCH =
# START_EPOCH + MAX_RUN_S; check_deadline (:646-648) halts when
# now_epoch() >= DEADLINE_EPOCH. At --max-run-s 1 the top-of-loop check at
# :1053 therefore passes only if it lands in the SAME wall-clock second as
# :469 — and because START_EPOCH is truncated, the usable margin is only
# whatever fraction of a second was left when the script started, anywhere from
# ~1s down to ~0. When process startup crossed the boundary, the run halted
# BEFORE the sweeps and the two sweep-count rows below went red. The margin is
# now 3s, comfortably past process-startup jitter, and the sleep is raised in
# step so it still exhausts it.
#
# The assertions are byte-identical to what they were: this row still proves
# exactly what it proved — the top-of-loop check passes, a sweep eats the
# budget, and the SECOND check_deadline catches it before an advance starts.
# Net cost is +3s per suite run (the stub sleeps in the terminal sweep only).
#
# Deliberately NOT fixed by making now_epoch/START_EPOCH sub-second. That is
# real precision, but production runs default to MAX_RUN_S=21600 where
# truncation is irrelevant — it would be a production change made solely for a
# test.
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
printf '5\n' >"$SEQ_DIR/sweep-sleep-s"
RC=0
OUT=$("$RUN" "$NODE" --poll-s 1 --max-run-s 3 2>/dev/null) || RC=$?
assert_eq "deadline-after-sweep: exit 21 (timeout), not idle or complete" "21" "$RC"
assert_eq "deadline-after-sweep: BOTH sweeps ran once this pass" "1" "$(sweeps)"
assert_eq "deadline-after-sweep: including the one that ate the budget" "1" "$(terminal_sweeps)"
assert_eq "deadline-after-sweep: no advance was started past the deadline" \
  "0" "$(calls advance)"
assert_eq "deadline-after-sweep: state.json disposition is timeout" \
  "timeout" "$(jq -r .disposition "$STATE_DIR/state.json")"
rm -f "$SEQ_DIR/sweep-sleep-s"

echo "Test: a sweep that does NOT exhaust the budget still lets the advance start"
# The companion case: an ordinary run with no sweep sleep and a generous
# --max-run-s must NOT halt — proving the halt above is really about the
# deadline being exhausted, not some side effect of the second check_deadline
# call existing at all.
reset_seqs
set_seq advance '0|launched tactic-fixture-node tactic implement /implement' \
                '10|idle tactic-fixture-node not-selectable'
set_seq landed  '0|'
run_ladder
assert_eq "deadline-after-sweep unaffected: exit 0 (complete), not timeout" "0" "$RC"
assert_eq "deadline-after-sweep unaffected: the advance did run" "2" "$(calls advance)"

# --- Unit 11: the sweep's budget tunables --------------------------------
echo "Test: the driver exports driver-sized budget tunables around the sweep call"
# lib-frozen-session-park.sh's own tick defaults are park_max=2, timeout=120,
# lock_wait=60 (up to 300s per sweep) — too large for a driver that reports
# progress on --poll-s cadence against --max-run-s. The driver exports smaller
# defaults via ${VAR:-default}, so with nothing set in the environment the
# sweep must see the driver's OWN smaller values, not the library's.
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
run_ladder
assert_eq "tunables: driver default PARK_MAX" \
  "PARK_MAX=1 PARK_TIMEOUT_S=30 LOCK_WAIT_S=15" "$(terminal_sweep_env)"

echo "Test: an inherited environment override still wins over the driver default"
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
export DISPATCH_TERMINAL_DISPOSITION_PARK_MAX=7
export DISPATCH_TERMINAL_DISPOSITION_PARK_TIMEOUT_S=45
export DISPATCH_TERMINAL_DISPOSITION_LOCK_WAIT_S=9
run_ladder
unset DISPATCH_TERMINAL_DISPOSITION_PARK_MAX DISPATCH_TERMINAL_DISPOSITION_PARK_TIMEOUT_S \
      DISPATCH_TERMINAL_DISPOSITION_LOCK_WAIT_S
assert_eq "tunables: an inherited override is not clobbered by the driver default" \
  "PARK_MAX=7 PARK_TIMEOUT_S=45 LOCK_WAIT_S=9" "$(terminal_sweep_env)"

echo "Test: a lib-frozen-session-park.sh that loads without the sweep aborts at startup"
# dispatch-tick logs a loud line and ticks on when this library fails to load —
# it runs again in a minute and the skipped sweep is retried. This driver is a
# ONE-SHOT detached process that exists precisely because no heartbeat is
# running behind it, so a silently-skipped sweep is not a delayed sweep; it is
# the wedge the sweep exists to prevent. It must refuse to start instead.
reset_seqs
printf '%s\n' ': # loads clean, defines nothing' >"$FROZEN_LIB"
rc=0; "$RUN" "$NODE" --poll-s 1 >/dev/null 2>&1 || rc=$?
assert_eq "sweep-undefined: exit 2" "2" "$rc"
assert_eq "sweep-undefined: nothing was advanced" "0" "$(calls advance)"
assert_eq "sweep-undefined: and no pass ran at all" "0" "$(sweeps)"

echo "Test: an unreadable lib-frozen-session-park.sh is refused by name, not skipped"
reset_seqs
rm -f "$FROZEN_LIB"
rc=0; ERR=$("$RUN" "$NODE" --poll-s 1 2>&1 >/dev/null) || rc=$?
assert_eq "sweep-absent: exit 2" "2" "$rc"
assert_eq "sweep-absent: nothing was advanced" "0" "$(calls advance)"
TOTAL=$((TOTAL + 1))
if grep -q 'lib-frozen-session-park\.sh' <<<"$ERR"; then
  PASS=$((PASS + 1)); echo "  PASS: sweep-absent: the refusal names the missing library"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: sweep-absent: the refusal names the missing library"
  echo "    stderr: $ERR"
fi
printf '%s\n' "$FROZEN_LIB_GOOD" >"$FROZEN_LIB"

# --- the terminus classification (classify_terminus) ------------------------
# The exit code says WHY the driver stopped; `terminus` says whether stopping
# there was legitimate. Both are recorded, and they are ORTHOGONAL — the whole
# point is that a halt reads the same whether the node was parked (fine) or
# abandoned mid-flight (a violation of the requirement in
# intentions/tactic-ladder-terminus-owns-main-qa.md).
#
# The classifications reached through verify-landed are driven through the SAME
# sequence fake the landing signal already uses — classify_terminus reads the
# node at origin/main through the very same script, so its answers are just more
# lines of `landed.script`. The reads it makes, in order:
#
#   1. --blob absent            0 -> absent (see below), 1 -> unknown,
#                               4 -> keep asking
#   2. --jq .phase == "done"                 0 -> done
#   3. --jq .office_hours != null            0 -> excused-parked
#   4. --jq (.blocked_by | length) > 0       0 -> excused-blocked
#   otherwise: violation, or unknown if any read answered 1.
#
# An ABSENT node is then split by git history rather than by verify-landed, so
# those cases drive the `git` fake instead — see terminus_absent_case below.
#
# Every case below halts on await's exit 12, which reaches halt() WITHOUT the
# driver having asked phase_is_done first — so line 1 of the sequence is
# classify_terminus's own first read and the mapping stays legible.

# The terminus as each of its two required sinks reports it. `// "<absent>"`
# rather than jq's bare null so a MISSING field is distinguishable from a null
# one — a missing field is the failure mode the guard in halt() exists to
# prevent.
state_terminus() {
  jq -r 'if has("terminus") then (.terminus // "<null>") else "<absent>" end' \
    "$STATE_DIR/state.json" 2>/dev/null
}
halt_event_terminus() {
  jq -r 'select(.event == "halt")
         | if has("terminus") then (.terminus // "<null>") else "<absent>" end' \
    "$STATE_DIR/events.jsonl" 2>/dev/null
}

# terminus_case <label> <expected> <landed-sequence-line>...
terminus_case() {
  local label="$1" want="$2"; shift 2
  reset_seqs
  set_seq advance '0|launched tactic-fixture-node tactic implement /implement'
  set_seq await   '12|stalled tactic-fixture-node implement'
  set_seq landed "$@"
  run_ladder
  # THE CLASSIFICATION IS A DIAGNOSTIC, so it may not rewrite the disposition it
  # describes: exit 12 stays exit 12 whatever the terminus turns out to be.
  assert_eq "terminus $label: the halt's exit code is unchanged (12)" "12" "$RC"
  assert_eq "terminus $label: state.json records it" "$want" "$(state_terminus)"
  assert_eq "terminus $label: the halt event records it" "$want" "$(halt_event_terminus)"
}

echo "Test: a node at phase 'done' on origin/main classifies 'done'"
terminus_case done done '4|' '0|'
# It stops at the first YES: `done` outranks every excuse, so the two remaining
# predicates are never asked. That is what makes the classification
# deterministic when more than one condition holds.
assert_eq "terminus done: the later predicates were never asked" "2" "$(calls landed)"

echo "Test: a node parked to office-hours classifies 'excused-parked'"
terminus_case excused-parked excused-parked '4|' '4|' '0|'

echo "Test: a node with a non-empty blocked_by classifies 'excused-blocked'"
terminus_case excused-blocked excused-blocked '4|' '4|' '4|' '0|'

echo "Test: neither done nor excused, every read definitive, is a 'violation'"
terminus_case violation violation '4|'
# The predicates themselves, pinned in order — the classification IS these four
# questions, so a drifted filter would silently change what "violation" means.
assert_eq "terminus violation: 1. absence is asked in --blob mode" \
  "-C $PROJECT --node $NODE --blob absent" "$(sed -n 1p "$SEQ_DIR/landed.argv")"
assert_eq "terminus violation: 2. the done predicate" \
  "-C $PROJECT --no-fetch --node $NODE --jq .phase == \"done\"" \
  "$(sed -n 2p "$SEQ_DIR/landed.argv")"
assert_eq "terminus violation: 3. the office-hours excuse" \
  "-C $PROJECT --no-fetch --node $NODE --jq .office_hours != null" \
  "$(sed -n 3p "$SEQ_DIR/landed.argv")"
assert_eq "terminus violation: 4. the awaited-event excuse, as a STRUCTURAL edge" \
  "-C $PROJECT --no-fetch --node $NODE --jq (.blocked_by | length) > 0" \
  "$(sed -n 4p "$SEQ_DIR/landed.argv")"

echo "Test: verify-landed's 'unknown' (rc=1) classifies 'unknown', NEVER 'violation'"
# The 0/4/1 split is the whole reason these reads go through verify-landed:
# collapsing "could not tell" into a verdict is the defect it exists to end, and
# here that verdict would be an accusation against a node nobody could read.
terminus_case unknown-first unknown '1|'
assert_eq "terminus unknown-first: an unreadable origin/main stops the questioning" \
  "1" "$(calls landed)"
# And an unknown from a LATER read is just as fatal to a verdict, even though
# the reads around it answered definitively.
terminus_case unknown-mid unknown '4|' '4|' '1|' '4|'
# rc=2 is verify-landed's usage error — not an answer either, so not a verdict.
terminus_case unknown-usage unknown '2|'

# --- an absent node: pruned, or never a node at all -------------------------
# The first trap this closes: in --jq mode an absent node is not an error.
# verify-landed feeds jq the literal `null`, every predicate evaluates false on
# it, and all three reads answer 4 — so a landed prune would be reported as a
# violation. Measured against the real script: `--jq` on an absent node exits 4
# while `--blob absent` exits 0. Hence the separate --blob read, first.
#
# The second: `--blob absent` answers "not at origin/main NOW" and nothing more.
# A typo'd id and a node whose graph-commit never pushed are equally absent, so
# answering `pruned` off that read alone would record work that never started as
# a LEGITIMATE terminus. History settles it, through the `git` fake:
#
#   log -1 … -- intentions/<id>.md   sha    -> pruned
#                                    rc!=0  -> unknown
#                                    empty  -> ask the shallow guard
#   rev-parse --is-shallow-repository false -> not-a-node
#                                    else   -> unknown
#
# terminus_absent_case <label> <expected> <git-line>...
# Every case here halts on await's exit 12 out of a LAUNCHING pass, which never
# reaches the reconcile pass's checkout sync — so the probe is the run's first
# git call and the sequence lines below map one-to-one onto the reads above.
terminus_absent_case() {
  local label="$1" want="$2"; shift 2
  reset_seqs
  set_seq advance '0|launched tactic-fixture-node tactic implement /implement'
  set_seq await   '12|stalled tactic-fixture-node implement'
  set_seq landed  '0|'
  set_seq git     "$@"
  run_ladder
  assert_eq "terminus $label: the halt's exit code is unchanged (12)" "12" "$RC"
  assert_eq "terminus $label: state.json records it" "$want" "$(state_terminus)"
  assert_eq "terminus $label: the halt event records it" "$want" "$(halt_event_terminus)"
  # The disambiguation is pure git plumbing: the --blob read is still the only
  # verify-landed call an absent node costs.
  assert_eq "terminus $label: no second verify-landed read" "1" "$(calls landed)"
}

echo "Test: an absent node whose file HAS history classifies 'pruned'"
terminus_absent_case pruned pruned '0|4bd3ae0f9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f'
assert_eq "terminus pruned: absence is settled against origin/main's history" \
  "-C $PROJECT log -1 --format=%H origin/main -- intentions/$NODE.md" \
  "$(sed -n 1p "$SEQ_DIR/git.argv")"
assert_eq "terminus pruned: and the shallow guard is not paid on that path" \
  "1" "$(calls git)"

echo "Test: an absent node with NO history classifies 'not-a-node', not 'pruned'"
# The id was never in the graph — a typo, or a node whose graph-commit never
# pushed. Work that never started is not a legitimate terminus.
terminus_absent_case not-a-node not-a-node '0|' '0|false'
assert_eq "terminus not-a-node: empty history is only believed once shallowness is ruled out" \
  "-C $PROJECT rev-parse --is-shallow-repository" "$(sed -n 2p "$SEQ_DIR/git.argv")"

echo "Test: empty history in a SHALLOW clone classifies 'unknown', never 'not-a-node'"
# A shallow clone's `git log` exits 0 and prints nothing for a node pruned
# before the graft point (lib-deleted-node-ids.ts:39-63), so its silence is
# evidence of nothing. Same reasoning as that helper's throw, mapped to a token
# because classify_terminus may never throw.
terminus_absent_case shallow unknown '0|' '0|true'

echo "Test: a git failure behind an absent node classifies 'unknown'"
# rc!=0 is not an answer, so it is not a verdict — the same rule the 0/4/1
# verify-landed split enforces for the reads above.
terminus_absent_case history-unreadable unknown '128|'
assert_eq "terminus history-unreadable: an unreadable history stops the questioning" \
  "1" "$(calls git)"

echo "Test: the terminus never changes the exit code — on ANY halting code"
# One halt() edit covers them all, exactly as the owed evaluation does. Each row
# leaves the node at a violation terminus and must still exit with its own code.
for pair in "11|throw tactic-fixture-node parked" \
            "12|stalled tactic-fixture-node qa" \
            "14|throw tactic-fixture-node unknown-graph-read"; do
  want_rc="${pair%%|*}"
  reset_seqs
  set_seq advance '0|launched tactic-fixture-node tactic qa /qa-fix'
  set_seq await "$pair"
  set_seq landed '4|'
  run_ladder
  assert_eq "terminus on exit $want_rc: the exit code is untouched" "$want_rc" "$RC"
  assert_eq "terminus on exit $want_rc: and the violation is on the record" \
    "violation" "$(state_terminus)"
done

echo "Test: a completing run records its terminus too, and a disagreement never gates"
# exit 0 is the ONE path that already read origin/main (phase_is_done), so line 1
# of the sequence is consumed there and the classification starts at line 2. The
# sequence below then answers 'not done, not excused, present' — a terminus that
# CONTRADICTS the exit code. The run must still exit 0: the classification is a
# diagnostic, not a gate, and the driver sequences rather than gating.
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
set_seq landed  '0|' '4|'
run_ladder
assert_eq "terminus complete: exit 0, unchanged by a contradicting terminus" "0" "$RC"
assert_eq "terminus complete: state.json still reports complete" "complete" \
  "$(jq -r .status "$STATE_DIR/state.json")"
assert_eq "terminus complete: the disagreement is recorded rather than acted on" \
  "violation" "$(state_terminus)"

echo "Test: a completing run whose node really is done classifies 'done'"
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
set_seq landed  '0|' '4|' '0|'
run_ladder
assert_eq "terminus complete-done: exit 0" "0" "$RC"
assert_eq "terminus complete-done: state.json" "done" "$(state_terminus)"
assert_eq "terminus complete-done: the halt event" "done" "$(halt_event_terminus)"

echo "Test: the operator-facing halt line names the terminus"
# The third sink. A person reading the journal must not have to open state.json
# to learn whether the halt they are looking at was legitimate.
reset_seqs
set_seq advance '0|launched tactic-fixture-node tactic implement /implement'
set_seq await   '12|stalled tactic-fixture-node implement'
set_seq landed  '4|'
rc=0
ERR=$("$RUN" "$NODE" --poll-s 1 --timeout-s 3 --ci-wait-s 5 2>&1 >/dev/null) || rc=$?
assert_eq "terminus stderr: exit 12" "12" "$rc"
TOTAL=$((TOTAL + 1))
if grep -q 'terminus violation' <<<"$ERR"; then
  PASS=$((PASS + 1)); echo "  PASS: terminus stderr: the halt line names the terminus"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: terminus stderr: the halt line names the terminus"
  echo "    stderr: $ERR"
fi

echo "Test: before it halts, a run renders terminus as null — never an empty string"
# Only a halt has a terminus to classify, so every earlier state write must
# render the field the way `phase`/`disposition`/`detail` render theirs: PRESENT
# and null, not "" and not absent. Read mid-flight, while the driver sleeps out
# a ci-waiting poll: --poll-s 3 against --max-run-s 2 means one advance, one
# 3-second sleep, then a timeout halt — a 3s window to read a state.json that is
# always complete on disk (write_state renames it into place atomically).
reset_seqs
set_seq advance '10|idle tactic-fixture-node ci-waiting'
"$RUN" "$NODE" --poll-s 3 --max-run-s 2 >/dev/null 2>&1 &
LADDER_PID=$!
sleep 1
MID_TERMINUS=$(state_terminus) || MID_TERMINUS="<unreadable>"
MID_STATUS=$(jq -r .status "$STATE_DIR/state.json" 2>/dev/null) || MID_STATUS="<unreadable>"
wait "$LADDER_PID" || true
assert_eq "mid-run: the run had not halted yet" "running" "$MID_STATUS"
assert_eq "mid-run: terminus is present and null" "<null>" "$MID_TERMINUS"
assert_eq "mid-run: and the timeout halt then classified one" "violation" "$(state_terminus)"

# --- advance's stderr diagnosis reaching events.jsonl ------------------------
echo "Test: advance's stderr reason on a stale-selection requeue reaches events.jsonl"
# make_seq_fake only ever writes stdout, so a bespoke one-off fake stands in for
# dispatch-ladder-advance here — one that ALSO writes the one diagnostic line
# the real script emits on this path (e.g. "selected review but node is now
# qa") to stderr, which is exactly what the driver must now capture instead of
# losing it to a journalctl-only trawl (the defect this row exists to pin).
# Restored to the sequence-driven fake below so every later case (there are
# none after this one today, but the restore is not conditional on that) keeps
# working.
reset_seqs
cat >"$LADDER/dispatch-ladder-advance" <<'STUB'
#!/usr/bin/env bash
echo "idle tactic-fixture-node stale-selection"
echo "dispatch-ladder-advance: stale-selection: phase: selected review but node is now qa" >&2
exit 10
STUB
chmod +x "$LADDER/dispatch-ladder-advance"
run_ladder --max-run-s 600
assert_eq "stderr-detail: the budget still drains to exit 12 (stalled)" "12" "$RC"
TOTAL=$((TOTAL + 1))
if jq -r 'select(.event == "idle" and .disposition == "stale-selection") | .detail' \
     "$STATE_DIR/events.jsonl" 2>/dev/null | grep -q 'selected review but node is now qa'; then
  PASS=$((PASS + 1)); echo "  PASS: stderr-detail: advance's stderr reason reaches the idle event's detail"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stderr-detail: advance's stderr reason reaches the idle event's detail"
  echo "    events: $(jq -c 'select(.event == "idle")' "$STATE_DIR/events.jsonl" 2>/dev/null)"
fi
TOTAL=$((TOTAL + 1))
if jq -r 'select(.event == "idle" and .disposition == "stale-selection") | .detail' \
     "$STATE_DIR/events.jsonl" 2>/dev/null | grep -q 'requeue_budget='; then
  PASS=$((PASS + 1)); echo "  PASS: stderr-detail: the requeue_budget figure is still present alongside it"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stderr-detail: the requeue_budget figure is still present alongside it"
  echo "    events: $(jq -c 'select(.event == "idle")' "$STATE_DIR/events.jsonl" 2>/dev/null)"
fi
make_seq_fake "$LADDER/dispatch-ladder-advance" advance

# --- A signal STOPS the run (it does not merely release the lock) ------------
# The driver's own cleanup comment names the scenario: "a SIGTERM from
# `systemctl stop` lands mid-pass otherwise and leaves the lock held". A single
# combined `trap _ladder_cleanup EXIT INT TERM` DEFEATS that rather than serving
# it — bash runs the handler, the handler releases the lock and RETURNS, and
# control goes straight back to the interrupted pass, which carries on merging
# and absorbing THE SAME NODE with the selection lock no longer held. A
# concurrent dispatch tick is free to claim it at the same moment. That is a
# routing race, not a tidy-up nit, which is why the assertions below check where
# the run got to and not only what status it returned.
#
# The signal is delivered from inside the graph-auto-merge fake, which the
# driver calls in the middle of reconcile_pass with LOCK_HELD=1 — the exact
# window the comment above is about. bash runs the pending trap when that
# command substitution returns, so the fake also answers normally (exit 0, no
# merge): nothing about the sequence itself stops the pass. Three assertions per
# signal:
#   status   — 143 / 130 EXACTLY, never merely non-zero. Measured under the
#              combined `trap fn EXIT INT TERM`: both signals produce exit 10
#              (the ci-wait budget draining normally), because at handler entry
#              $? is the last COMPLETED command's status and NOT 128+signo.
#   stopped  — reconcile-graph-merged was never called. This is the race itself:
#              under the combined trap the pass walks straight on into the
#              absorb step having already released the lock.
#   released — the lock was still released exactly once, i.e. the handler still
#              does its ORIGINAL job. Without it, `trap 'exit 143' TERM` passes.
# INT and TERM get one case each on purpose: with only one of them, the other
# registration could be mis-numbered or deleted and this suite would stay green.

# ladder_signal_merge_fake <SIG> — the graph-auto-merge fake for the two cases
# below. Waits (bounded) for the harness to record the driver's PID, signals it,
# then answers `no merge` and exits 0 like any other quiet pass.
ladder_signal_merge_fake() {
  local sig="$1"
  rm -f "$SEQ_DIR/driver.pid"
  cat >"$DISPATCH/graph-auto-merge" <<STUB
#!/usr/bin/env bash
n=\$(cat "$SEQ_DIR/merge.count")
echo \$((n + 1)) >"$SEQ_DIR/merge.count"
printf '%s\n' "\$*" >>"$SEQ_DIR/merge.argv"
for _ in 1 2 3 4 5 6 7 8 9 10; do
  [[ -s "$SEQ_DIR/driver.pid" ]] && break
  sleep 0.1
done
kill -$sig "\$(cat "$SEQ_DIR/driver.pid")"
exit 0
STUB
  chmod +x "$DISPATCH/graph-auto-merge"
}

# run_ladder_signalled — run the driver in the background so its PID can be
# handed to the fake above, then report its exit status in RC.
#
# `set -m` around the launch is REQUIRED, not decoration. With job control off
# (the default for a script), a command started with `&` inherits SIGINT and
# SIGQUIT as SIG_IGN — and a signal ignored on entry to a shell cannot be
# trapped or reset. Measured without it in the sibling test-dispatch-tick.sh
# case: the TERM half passes while the INT half runs to a normal completion,
# i.e. the trap never fires at all and the case proves nothing about the INT
# registration. Job control gives the child its own process group with default
# signal dispositions.
run_ladder_signalled() { # [extra driver args...]
  local pid
  RC=0
  set -m
  "$RUN" "$NODE" --poll-s 1 --timeout-s 3 --ci-wait-s 1 "$@" >/dev/null 2>&1 &
  pid=$!
  set +m
  printf '%s\n' "$pid" >"$SEQ_DIR/driver.pid"
  wait "$pid" || RC=$?
}

echo "Test: a SIGTERM mid-pass stops the run with status 143, after releasing the lock"
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
ladder_signal_merge_fake TERM
run_ladder_signalled
assert_eq "sigterm: the run exits 143, not the budget's own 10" "143" "$RC"
assert_eq "sigterm: the pass STOPPED — it never walked on into the absorb step" \
  "0" "$(calls reconcile)"
assert_eq "sigterm: the selection lock was still released" "1" "$(lock_modes --release)"
make_seq_fake "$DISPATCH/graph-auto-merge" merge

echo "Test: a SIGINT mid-pass stops the run with status 130, after releasing the lock"
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
ladder_signal_merge_fake INT
run_ladder_signalled
assert_eq "sigint: the run exits 130, not the budget's own 10" "130" "$RC"
assert_eq "sigint: the pass STOPPED — it never walked on into the absorb step" \
  "0" "$(calls reconcile)"
assert_eq "sigint: the selection lock was still released" "1" "$(lock_modes --release)"
make_seq_fake "$DISPATCH/graph-auto-merge" merge

# --- ...and a signal exit still owes a TERMINAL STATE -------------------------
# The three assertions per signal above pin that the run STOPS. They cannot see
# what it leaves behind, and stopping cleanly is only half the contract.
#
# halt() is the one terminal path the ladder's own logic takes, and everything
# terminal hangs off it: classify_terminus, write_state, spawn_phase_eval. A
# signal exit reaches none of that. Left alone it stops with state.json still
# reading `{"status":"running","step":"merge","terminus":null}` — the file it
# wrote on entering the merge step — and TWO things then go wrong:
#
#   * `dispatch-ladder-status` sees status `running` with an inactive unit and
#     answers `orphaned`, whose documented meaning (the `orphaned` row of
#     dispatch-ladder-status's <status> list, :50) is "the driver died WITHOUT
#     writing a terminal state". After an ordinary
#     `systemctl --user stop dispatch-ladder-<node>` that is simply false, so
#     the reader's vocabulary starts lying about its most routine case.
#   * the per-phase RSI evaluation halt() would have spawned is never spawned
#     and never recorded, so the phase produces NO ledger entry at all — the
#     exact gap the driver header's A HALT OWES THE EVALUATION TOO closes.
#
# The repair is local writes ONLY (signal_terminal_write), which is why the
# terminus stays null here rather than being classified: classify_terminus makes
# bounded network reads and spawn_phase_eval is a daemon round trip, and the
# clock on this path is TimeoutStopSec, after which systemd sends SIGKILL and
# nothing lands at all. So the assertions below pin BOTH halves — the state that
# is written, and the debt that is recorded rather than paid.
#
# The step is asserted as `merge` on purpose: it is set at
# dispatch-ladder-run's `STEP=merge; write_state` immediately before
# graph-auto-merge, which is where this fake delivers the signal. A terminal
# write that reset or blanked it would lose the one field that says WHERE the
# run was standing when it was stopped.
echo "Test: a SIGTERM mid-merge writes a terminal 'signalled' state, not one that reads as orphaned"
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
ladder_signal_merge_fake TERM
run_ladder_signalled
assert_eq "sigterm-state: the run exits 143" "143" "$RC"
assert_eq "sigterm-state: state.json status is 'signalled', NOT 'running' (which reads as orphaned)" \
  "signalled" "$(jq -r .status "$STATE_DIR/state.json")"
assert_eq "sigterm-state: state.json exit_code is 143" \
  "143" "$(jq -r .exit_code "$STATE_DIR/state.json")"
assert_eq "sigterm-state: state.json disposition is 'signalled'" \
  "signalled" "$(jq -r .disposition "$STATE_DIR/state.json")"
assert_eq "sigterm-state: the step the run was standing on is preserved" \
  "merge" "$(jq -r .step "$STATE_DIR/state.json")"
assert_eq "sigterm-state: terminus stays null — classifying it is the network read this path skips" \
  "null" "$(jq -r '.terminus // "null"' "$STATE_DIR/state.json")"
assert_eq "sigterm-state: the detail names the signal" "1" \
  "$(jq -r .detail "$STATE_DIR/state.json" | grep -c 'SIGTERM')"
assert_eq "sigterm-state: exactly one halt event with disposition 'signalled'" \
  "1" "$(events_have halt signalled)"
make_seq_fake "$DISPATCH/graph-auto-merge" merge

echo "Test: a SIGINT mid-merge writes the same terminal state with its own status"
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
ladder_signal_merge_fake INT
run_ladder_signalled
assert_eq "sigint-state: the run exits 130" "130" "$RC"
assert_eq "sigint-state: state.json status is 'signalled'" \
  "signalled" "$(jq -r .status "$STATE_DIR/state.json")"
assert_eq "sigint-state: state.json exit_code is 130, not 143" \
  "130" "$(jq -r .exit_code "$STATE_DIR/state.json")"
assert_eq "sigint-state: the detail names SIGINT, not SIGTERM" "1" \
  "$(jq -r .detail "$STATE_DIR/state.json" | grep -c 'SIGINT')"
make_seq_fake "$DISPATCH/graph-auto-merge" merge

# --- the owed evaluation is RECORDED, not silently dropped -------------------
# The two cases above run the idle path, where no phase ever launches, so no
# evaluation is owed and none can be missing. This case is the one that can see
# the second half of the gap: advance LAUNCHES a phase, and the signal lands
# inside the await that follows it — before the phase boundary where
# spawn_phase_eval would otherwise have run.
#
# The debt is not paid here (the spawn is the daemon round trip this path
# cannot afford) but it must not vanish either, so it is written to
# events.jsonl as `eval ... skipped` — reusing the disposition
# spawn_phase_eval's own "no executable dispatch-spawn-job" arm already uses for
# "this phase is unevaluated", so the events vocabulary stays closed. The event
# names the exact `/rsi` call that pays it, which is what makes the record
# actionable rather than merely honest.
#
# Guarded exactly as spawn_phase_eval is: asserting the spawn did NOT happen
# pins that this path stays local, and asserting the record DID pins that
# skipping it is not the same as forgetting it.
ladder_signal_await_fake() {
  local sig="$1"
  rm -f "$SEQ_DIR/driver.pid"
  cat >"$LADDER/dispatch-ladder-await" <<STUB
#!/usr/bin/env bash
n=\$(cat "$SEQ_DIR/await.count")
echo \$((n + 1)) >"$SEQ_DIR/await.count"
printf '%s\n' "\$*" >>"$SEQ_DIR/await.argv"
for _ in 1 2 3 4 5 6 7 8 9 10; do
  [[ -s "$SEQ_DIR/driver.pid" ]] && break
  sleep 0.1
done
kill -$sig "\$(cat "$SEQ_DIR/driver.pid")"
echo 'advanced tactic-fixture-node implement -> origin/main'
exit 0
STUB
  chmod +x "$LADDER/dispatch-ladder-await"
}

echo "Test: a SIGTERM after a phase launched RECORDS the owed evaluation instead of dropping it"
reset_seqs
set_seq advance '0|launched tactic-fixture-node tactic implement /implement'
ladder_signal_await_fake TERM
run_ladder_signalled
assert_eq "sigterm-owed: the run exits 143" "143" "$RC"
assert_eq "sigterm-owed: state.json status is 'signalled'" \
  "signalled" "$(jq -r .status "$STATE_DIR/state.json")"
assert_eq "sigterm-owed: the phase the run was in is preserved" \
  "implement" "$(jq -r .phase "$STATE_DIR/state.json")"
assert_eq "sigterm-owed: the evaluation was NOT spawned — this path makes no daemon round trip" \
  "0" "$(calls spawnjob)"
assert_eq "sigterm-owed: exactly one 'eval ... skipped' event records the debt" \
  "1" "$(events_have eval skipped)"
assert_eq "sigterm-owed: that event names the /rsi call that pays the debt" "1" \
  "$(jq -r 'select(.event == "eval" and .disposition == "skipped") | .detail' \
       "$STATE_DIR/events.jsonl" | grep -c "/rsi $NODE implement --since")"
make_seq_fake "$LADDER/dispatch-ladder-await" await

# --- a signal that lands INSIDE halt() must not overwrite what halt() decided --
# Every signal case above stops a run that was still walking the ladder, so the
# terminal write has nothing to overwrite. This one reaches the window where it
# does: halt() writes state.json and logs its halt event and only THEN calls
# spawn_phase_eval, a dispatch-spawn-job round trip through the claude daemon.
# bash defers a pending trap until the running command returns, so a stop
# delivered during that spawn fires the handler while halt() is still mid-body,
# with a terminal record already on disk.
#
# What the unguarded terminal write does to that record is not a cosmetic
# overwrite. It replaces `halted`/`stalled`/12 with `signalled`/`signalled`/143
# — losing the disposition the ladder actually reached — while leaving TERMINUS
# at the `violation` classify_terminus paid two network reads for. The result is
# a `signalled` status carrying a classified terminus, the ONE combination the
# status vocabulary promises cannot occur (dispatch-ladder-status's `signalled`
# row: "<terminus> is null rather than classified"). A reader that trusts the
# vocabulary reads a deliberate operator stop where the truth is a violation.
#
# The fixture drives exactly that ordering: advance launches a phase (so halt()
# has an evaluation to spawn and therefore a window to be interrupted in), await
# answers 12 so the run halts `stalled`, and the spawn fake signals the driver
# before answering. The default `landed 4` sequence makes classify_terminus walk
# its three probes to `violation`, so the terminus is non-empty when the handler
# runs — without that the bug leaves no trace to assert on.
#
# The assertions read the record, not the exit status: the process still dies of
# the signal (143), because it genuinely was signalled. What must survive is
# what the ladder decided before the signal arrived.
ladder_signal_spawnjob_fake() { # <SIG>
  local sig="$1"
  rm -f "$SEQ_DIR/driver.pid"
  cat >"$DISPATCH/dispatch-spawn-job" <<STUB
#!/usr/bin/env bash
n=\$(cat "$SEQ_DIR/spawnjob.count")
echo \$((n + 1)) >"$SEQ_DIR/spawnjob.count"
printf '%s\n' "\$*" >>"$SEQ_DIR/spawnjob.argv"
for _ in 1 2 3 4 5 6 7 8 9 10; do
  [[ -s "$SEQ_DIR/driver.pid" ]] && break
  sleep 0.1
done
kill -$sig "\$(cat "$SEQ_DIR/driver.pid")"
echo spawned
exit 0
STUB
  chmod +x "$DISPATCH/dispatch-spawn-job"
}

echo "Test: a SIGTERM inside halt()'s evaluation spawn leaves halt()'s own terminal record intact"
reset_seqs
set_seq advance '0|launched tactic-fixture-node tactic implement /implement'
set_seq await   '12|stalled tactic-fixture-node implement'
ladder_signal_spawnjob_fake TERM
run_ladder_signalled
assert_eq "halt-race: the process still dies of the signal" "143" "$RC"
assert_eq "halt-race: the signal landed inside halt()'s spawn" "1" "$(calls spawnjob)"
assert_eq "halt-race: state.json still reports the halt, not the signal" \
  "halted" "$(jq -r .status "$STATE_DIR/state.json")"
assert_eq "halt-race: the disposition the ladder reached survives" \
  "stalled" "$(jq -r .disposition "$STATE_DIR/state.json")"
assert_eq "halt-race: so does the exit code halt() recorded" \
  "12" "$(jq -r .exit_code "$STATE_DIR/state.json")"
assert_eq "halt-race: and the terminus classify_terminus paid for" \
  "violation" "$(jq -r '.terminus // "null"' "$STATE_DIR/state.json")"
assert_eq "halt-race: no second halt event was appended under the signal" \
  "0" "$(events_have halt signalled)"
assert_eq "halt-race: halt()'s own halt event is the only one" \
  "1" "$(events_have halt stalled)"
# The pairing the vocabulary forbids, asserted directly rather than inferred
# from the four fields above: no state.json a reader ever sees may carry status
# `signalled` alongside a non-null terminus.
assert_eq "halt-race: no record pairs a 'signalled' status with a classified terminus" \
  "false" "$(jq -r '.status == "signalled" and .terminus != null' "$STATE_DIR/state.json")"
make_seq_fake "$DISPATCH/dispatch-spawn-job" spawnjob
make_seq_fake "$LADDER/dispatch-ladder-await" await

# --- a signal DURING the acquire must release the lock the child then took ----
# The window the two cases above do not reach. `dispatch-acquire-lock --wait`
# polls for up to DISPATCH_LOCK_WAIT_TIMEOUT (default 300s) in a CHILD process,
# and dispatch-ladder-spawn passes --property=KillMode=process — so a
# `systemctl --user stop dispatch-ladder-<node>` mid-wait signals only the
# driver and the child polls on. bash defers the pending trap until the command
# substitution returns, by which time the child has ALREADY taken the lock and
# recorded our session id. With LOCK_HELD raised only after the acquire the
# handler sees 0 and skips the release; and because the handler now exits
# rather than returning into the pass, reconcile_pass's own release_lock never
# runs either. The lock is stranded until it ages past MAX_HOLD_SECONDS —
# blocking every dispatch tick meanwhile.
#
# Before this PR the same window existed but was harmless: the handler returned
# and the pass reached its own release_lock. The new `exit` removes exactly
# that recovery, so the window has to be closed at the flag instead.
#
# The stub reproduces the ordering: it signals the driver and THEN answers
# `acquired`, so the lock is genuinely the driver's by the time the deferred
# trap fires. The release assertion is what fails without the fix.

echo "Test: a SIGTERM while the selection-lock acquire is in flight still releases the lock"
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
rm -f "$SEQ_DIR/driver.pid"
cat >"$DISPATCH/dispatch-acquire-lock" <<STUB
#!/usr/bin/env bash
printf '%s\n' "\$*" >>"$SEQ_DIR/lock.argv"
printf '%s\n' "\${CLAUDE_CODE_SESSION_ID:-<unset>}" >>"$SEQ_DIR/lock.sid"
case "\${1:-}" in
  --heartbeat|--release) exit 0 ;;
esac
# The acquire is "in flight": signal the driver, then hand back the lock. bash
# cannot run the pending trap until this substitution returns, so the handler
# observes a lock that IS ours.
for _ in 1 2 3 4 5 6 7 8 9 10; do
  [[ -s "$SEQ_DIR/driver.pid" ]] && break
  sleep 0.1
done
kill -TERM "\$(cat "$SEQ_DIR/driver.pid")"
n=\$(cat "$SEQ_DIR/lock.count")
echo \$((n + 1)) >"$SEQ_DIR/lock.count"
line=\$(sed -n "\$((n + 1))p" "$SEQ_DIR/lock.script")
[[ -n "\$line" ]] || line=\$(tail -n1 "$SEQ_DIR/lock.script")
out="\${line#*|}"
[[ -n "\$out" ]] && printf '%s\n' "\$out"
exit "\${line%%|*}"
STUB
chmod +x "$DISPATCH/dispatch-acquire-lock"
run_ladder_signalled
assert_eq "acquire-window: the run exits 143, not the budget's own 10" "143" "$RC"
assert_eq "acquire-window: the signal landed INSIDE the acquire — the merge step never ran" \
  "0" "$(calls merge)"
assert_eq "acquire-window: the lock the child took was RELEASED on the way out" \
  "1" "$(lock_modes --release)"

report_results
