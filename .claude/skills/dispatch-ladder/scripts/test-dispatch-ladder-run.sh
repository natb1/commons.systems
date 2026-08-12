#!/usr/bin/env bash
# Unit tests for dispatch-ladder-run — the detached ladder driver.
#
# The driver is pure exit-code branching over five scripts it does not own, so
# what is worth testing is exactly the branch table: every exit code of
# dispatch-ladder-advance and dispatch-ladder-await, every reason the advance
# `idle` line can carry, and the merge-and-absorb sub-loop's three stdout
# protocols. All five are faked here — no daemon, no gh, no git, no network.
#
# Two branches are worth calling out because getting them wrong is invisible
# until it costs a real run:
#
#   1. `idle <id> ci-waiting` MUST re-poll rather than halt. A freshly opened
#      draft PR with pending CI produces it, so halting there would halt after
#      every implement phase — the loop would never finish a single node.
#   2. The anti-spin guards. `merge_tried` allows the merge-and-absorb step
#      exactly once per launched stretch, and the requeue budget bounds
#      `stale-selection` / `scope-stale-demoted`. Without them a node that
#      never becomes selectable spins until --max-run-s.
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
mkdir -p "$LADDER" "$DISPATCH" "$IUTIL" "$SEQ_DIR" "$PROJECT/.claude/worktrees"

cp "$LADDER_DIR/dispatch-ladder-run" "$LADDER/dispatch-ladder-run"
chmod +x "$LADDER/dispatch-ladder-run"
cp "$SCRIPT_DIR/lib-graph-worktree.sh" "$DISPATCH/lib-graph-worktree.sh"

RUN="$LADDER/dispatch-ladder-run"
NODE=tactic-fixture-node
STATE_DIR="$PROJECT/.claude/worktrees/$NODE.ladder"
export DISPATCH_GRAPH_MAIN_WORKTREE="$PROJECT"

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
make_seq_fake "$IUTIL/verify-landed"            landed

set_seq() { # <name> <line>...
  local name="$1"; shift
  : >"$SEQ_DIR/$name.script"
  : >"$SEQ_DIR/$name.argv"
  echo 0 >"$SEQ_DIR/$name.count"
  local l
  for l in "$@"; do printf '%s\n' "$l" >>"$SEQ_DIR/$name.script"; done
}
calls() { cat "$SEQ_DIR/$1.count"; }

# Reset every fake to a benign default, then let each case override what it
# cares about. `landed 4` = "present at origin/main, not done".
reset_seqs() {
  set_seq advance   '10|idle tactic-fixture-node not-selectable'
  set_seq await     '0|advanced tactic-fixture-node implement -> origin/main'
  set_seq merge     '0|'
  set_seq reconcile '0|'
  set_seq landed    '4|'
  rm -rf "$STATE_DIR"
}

RC=0
OUT=""
run_ladder() { # [extra driver args...]
  RC=0
  OUT=$("$RUN" "$NODE" --poll-s 1 --timeout-s 3 "$@" 2>/dev/null) || RC=$?
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
rc=0; "$RUN" "$NODE" --nope >/dev/null 2>&1 || rc=$?
assert_eq "usage: an unknown flag exits 2" "2" "$rc"
assert_eq "usage: nothing was launched" "0" "$(calls advance)"

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

# --- merge and absorb --------------------------------------------------------
echo "Test: not-selectable + not-done runs merge, polls the absorb, then carries on"
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable' \
                '0|launched tactic-fixture-node tactic main-qa /qa-main' \
                '10|idle tactic-fixture-node not-selectable'
set_seq await   '0|advanced tactic-fixture-node main-qa -> origin/main'
set_seq landed  '4|' '0|'
set_seq merge   '0|merged #123 (tactic-fixture-node)'
set_seq reconcile '0|deferred tactic-fixture-node (main-qa phase not yet in schema)' \
                  '0|reconciled tactic-fixture-node -> main-qa'
run_ladder
assert_eq "merge: exit 0" "0" "$RC"
assert_eq "merge: graph-auto-merge was called once" "1" "$(calls merge)"
assert_eq "merge: it was called with --node" "--node $NODE" "$(head -n1 "$SEQ_DIR/merge.argv")"
assert_eq "merge: reconcile-graph-merged was called twice (deferred, then reconciled)" \
  "2" "$(calls reconcile)"
assert_eq "merge: a merge/merged event was recorded" "1" "$(events_have merge merged)"
assert_eq "merge: an absorb/deferred event was recorded" "1" "$(events_have absorb deferred)"
assert_eq "merge: an absorb/reconciled event was recorded" "1" "$(events_have absorb reconciled)"

echo "Test: the reconciler's GRACE window is the SILENT case, and is polled through"
# reconcile-graph-merged skips a merge younger than GRAPH_RECONCILE_GRACE with a
# bare `continue` — it prints NOTHING. Because this run merged, silence means
# "not aged yet", so the driver must keep polling rather than call it a no-op.
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable' \
                '10|idle tactic-fixture-node not-selectable'
set_seq landed  '4|' '0|'
set_seq merge   '0|merged #7 (tactic-fixture-node)'
set_seq reconcile '0|' '0|' '0|reconciled tactic-fixture-node -> done'
run_ladder
assert_eq "grace: exit 0" "0" "$RC"
assert_eq "grace: the reconciler was polled 3 times" "3" "$(calls reconcile)"
assert_eq "grace: two grace-wait events were recorded" "2" "$(events_have absorb grace-wait)"

echo "Test: 'held' from graph-auto-merge throws — a hold is a person's call"
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
set_seq merge   '0|held tactic-fixture-node (office-hours)'
run_ladder
assert_eq "held: exit 11 (throw)" "11" "$RC"
assert_eq "held: the absorb was never reached" "0" "$(calls reconcile)"
assert_eq "held: state.json status is halted" "halted" "$(jq -r .status "$STATE_DIR/state.json")"

echo "Test: the merge_tried guard stops the merge-and-absorb step spinning"
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
set_seq merge   '0|'
set_seq reconcile '0|'
run_ladder --max-run-s 600
assert_eq "anti-spin: exit 10 (idle halt)" "10" "$RC"
assert_eq "anti-spin: the merge was attempted exactly once" "1" "$(calls merge)"
assert_eq "anti-spin: the absorb ran once and did not poll" "1" "$(calls reconcile)"
assert_eq "anti-spin: advance was read twice" "2" "$(calls advance)"

echo "Test: a graph-auto-merge hard error throws rather than being retried"
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
set_seq merge   '1|'
run_ladder
assert_eq "merge-error: exit 11 (throw)" "11" "$RC"

echo "Test: a reconcile-graph-merged hard error throws"
reset_seqs
set_seq advance '10|idle tactic-fixture-node not-selectable'
set_seq merge   '0|merged #9 (tactic-fixture-node)'
set_seq reconcile '1|'
run_ladder
assert_eq "absorb-error: exit 11 (throw)" "11" "$RC"

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
            "13|claimed tactic-fixture-node live-session" \
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
