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
  local l
  for l in "$@"; do printf '%s\n' "$l" >>"$SEQ_DIR/$name.script"; done
}
calls() { cat "$SEQ_DIR/$1.count"; }

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
  : >"$SEQ_DIR/lock.sid"
  : >"$SEQ_DIR/sweep.log"
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
assert_eq "usage: nothing was launched" "0" "$(calls advance)"
assert_eq "usage: the reservation ledger was not swept either" "0" "$(sweeps)"

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
  "$(head -n1 "$SEQ_DIR/await.argv")"
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
# The acceleration review reads phase wall-clock off this field; if it stops
# being written the evidence is silently gone.
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
run_ladder
assert_eq "routed: exit 0" "0" "$RC"
assert_eq "routed: a review-stall/recovered event was recorded" "1" \
  "$(events_have review-stall recovered)"
assert_eq "routed: the pass reported 'routed' and reset the budget" "1" \
  "$(events_have reconcile routed)"
assert_eq "routed: the very next advance launched the fix phase" "$NODE fix --timeout-s 3" \
  "$(head -n1 "$SEQ_DIR/await.argv")"
assert_eq "routed: the driver never slept on a routed pass" "0" "$(events_have idle ci-wait)"

echo "Test: --node reaches all three reconcilers, never an unscoped sweep"
assert_eq "node-scope: graph-auto-merge" "--node $NODE" "$(head -n1 "$SEQ_DIR/merge.argv")"
assert_eq "node-scope: reconcile-graph-merged" "--node $NODE" "$(head -n1 "$SEQ_DIR/reconcile.argv")"
assert_eq "node-scope: reconcile-graph-review-stall" "--node $NODE" "$(head -n1 "$SEQ_DIR/stall.argv")"

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
# The wait it does take is charged to the budget as grace, never as CI — the
# acceleration review cannot tell the two apart afterwards.
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
set_seq landed  '4|' '4|' '4|' '0|'
set_seq merge   '0|merged #8 (tactic-fixture-node)'
set_seq reconcile '0|reconciled tactic-fixture-node -> done'
run_ladder
assert_eq "lock-busy: exit 0 (the loop carried on and finished)" "0" "$RC"
assert_eq "lock-busy: two lock/busy events were recorded" "2" "$(events_have lock busy)"
assert_eq "lock-busy: a busy pass merged nothing" "1" "$(calls merge)"
assert_eq "lock-busy: a busy pass did not sync the checkout either" "2" "$(calls git)"
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

report_results
