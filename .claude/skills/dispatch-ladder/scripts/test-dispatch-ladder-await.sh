#!/usr/bin/env bash
# Unit tests for dispatch-ladder-await — the wait-and-verify half of the
# dispatch-ladder loop.
#
# Two things are worth testing and both are invisible in production until they
# are wrong:
#
#   1. SESSION-STATE CLASSIFICATION. A reaped session and a held one look
#      similar in the registry and mean opposite things — one is a clean
#      completion, the other is a stuck worker holding a slot and blocking the
#      node. Collapsing them would make the loop step over a stuck phase.
#   2. GRAPH-VERDICT PRECEDENCE. An absent node satisfies `.phase != <from>`, so
#      a pruned node and an advanced node are indistinguishable unless absence
#      is checked FIRST; a parked node may also have advanced, so the park must
#      outrank the phase change. Both orderings are asserted here, because
#      getting them backwards produces a plausible-looking wrong answer rather
#      than an error.
#   3. THE `reviewed` MARKER, AND ITS FROM-PHASE GATE. A clean review writes a
#      marker instead of a phase, so it looks exactly like a stall to a
#      phase-only check — and markers are never cleared, so a marker-only check
#      would call every later phase complete. Both halves are asserted.
#   4. THE HELD PATH ASKS THE GRAPH FIRST. A held session is how an escalation
#      looks BEFORE terminal_without_disposition_sweep parks it, so the park is
#      checked ahead of the hold: parked → `throw <id> parked`, unparked →
#      `held-observing` at exit 21, which claims nothing and lets the caller run
#      the sweep and call again.
#   5. THE `execution.lane_pass` STAMP, AND ITS LAUNCH WINDOW. Two lanes complete
#      by pushing and never move `.phase`, so a successful pass reads as a stall
#      by phase alone. The stamp is read ONLY with `--since`, and only when it is
#      at or after that launch — a presence-only read would repeat the
#      accumulation trap the `reviewed` gate exists for. Both halves are pinned,
#      and so is the halt this must not break: no stamp is still `stalled`.
#   6. THE LIVE GRAPH POLL, SPLIT BY VERDICT CLASS. The completion is public at
#      origin/main before the registry reaps the row, so the graph is asked on a
#      throttled cadence even while the session says `working` — but only the
#      three RUN-ENDING verdicts (pruned / parked / blocked) may be reported
#      against a live row. The three PROGRESS verdicts (advanced / reviewed /
#      lane-complete) send the caller straight into dispatch-ladder-advance's
#      exit-13 live-session refusal, so they are recorded and the poll continues
#      until the reap. Pinned: both halves of that split, the `reap_lag_s` field
#      the sighting makes measurable (present after a sighting, ABSENT without
#      one — never 0), that `unchanged` and an unreadable graph end nothing
#      (mid-phase they are transients, not the exit-14 a stopped worker earns),
#      and that the throttle is real, so the default cadence skips short windows.
#
# The Claude registry and verify-landed are both stubbed — no daemon, no
# network, no gh. Polling is driven at --poll-s 1 so the suite runs in seconds.
#
# Runs from anywhere; creates and removes its own temp tree.

set -uo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

PASS=0
FAIL=0
fail() { printf 'FAIL: %s\n' "$1" >&2; FAIL=$((FAIL + 1)); }
ok()   { printf 'ok: %s\n' "$1"; PASS=$((PASS + 1)); }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# --- Fixture ---------------------------------------------------------------
PROJECT="$TMP/project"
LADDER_SCRIPTS="$PROJECT/.claude/skills/dispatch-ladder/scripts"
DISPATCH="$PROJECT/.claude/skills/dispatch-propagate/scripts"
IUTIL="$PROJECT/packages/intentionsutil/scripts"
mkdir -p "$LADDER_SCRIPTS" "$DISPATCH" "$IUTIL"

cp "$SCRIPT_DIR/dispatch-ladder-await" "$LADDER_SCRIPTS/dispatch-ladder-await"
chmod +x "$LADDER_SCRIPTS/dispatch-ladder-await"
for lib in lib-claude-agents.sh lib-reservation-ledger.sh lib-graph-worktree.sh lib.sh; do
  src="$SCRIPT_DIR/../../dispatch-propagate/scripts/$lib"
  [[ -f "$src" ]] && cp "$src" "$DISPATCH/$lib"
done

AWAIT="$LADDER_SCRIPTS/dispatch-ladder-await"
export DISPATCH_GRAPH_MAIN_WORKTREE="$PROJECT"

# See test-dispatch-ladder-advance.sh: the empty-read corroboration needs a visible daemon,
# and CI has none. Stub the probe so the suite does not depend on whether a real
# Claude daemon happens to be running on the host.
PGREP_STUB="$TMP/pgrep-stub"
printf '#!/usr/bin/env bash\nexit 0\n' >"$PGREP_STUB"
chmod +x "$PGREP_STUB"
export CLAUDE_AGENTS_PGREP_CMD="$PGREP_STUB"

# --- Stubs -----------------------------------------------------------------
# The registry. Each case writes the JSON it wants observed.
AGENTS_JSON="$TMP/agents.json"
echo '[]' >"$AGENTS_JSON"
CLAUDE_STUB="$TMP/claude-stub"
cat >"$CLAUDE_STUB" <<STUB
#!/usr/bin/env bash
cat "$AGENTS_JSON"
STUB
chmod +x "$CLAUDE_STUB"
export CLAUDE_AGENTS_CMD="$CLAUDE_STUB"

# verify-landed. Its three answers (0 landed / 4 not-landed / 1 unknown) are
# what dispatch-ladder-await maps, so the stub is keyed on the spec it is asked about: each
# case writes the exit code it wants for `absent`, `office_hours`, `blocked_by`,
# `markers` and `phase`.
RC_ABSENT="$TMP/rc.absent"; RC_PARKED="$TMP/rc.parked"
RC_BLOCKED="$TMP/rc.blocked"; RC_PHASE="$TMP/rc.phase"
RC_REVIEWED="$TMP/rc.reviewed"; RC_LANE="$TMP/rc.lane"
cat >"$IUTIL/verify-landed" <<STUB
#!/usr/bin/env bash
args="\$*"
case "\$args" in
  *"--blob absent"*)   exit "\$(cat "$RC_ABSENT")" ;;
  *office_hours*)      exit "\$(cat "$RC_PARKED")" ;;
  *blocked_by*)        exit "\$(cat "$RC_BLOCKED")" ;;
  *markers*)           exit "\$(cat "$RC_REVIEWED")" ;;
  # ORDERING TRAP — this arm MUST precede *.phase*. The lane-pass filter reads
  # \`.execution.lane_pass.phase\`, which the *.phase* glob below matches too. If
  # this arm came after it, every lane-pass probe would silently return the
  # PHASE rc and the lane-pass cases would pass for entirely the wrong reason.
  # So it matches on \`lane_pass\`, which appears in no other filter.
  *lane_pass*)         exit "\$(cat "$RC_LANE")" ;;
  *.phase*)            exit "\$(cat "$RC_PHASE")" ;;
esac
exit 1
STUB
chmod +x "$IUTIL/verify-landed"

# The reviewed-marker and lane-pass rcs are last and optional: every
# pre-existing case predates those checks and wants their "no" answer (4).
set_graph() { # <absent-rc> <parked-rc> <blocked-rc> <phase-rc> [<reviewed-rc>] [<lane-rc>]
  echo "$1" >"$RC_ABSENT"; echo "$2" >"$RC_PARKED"
  echo "$3" >"$RC_BLOCKED"; echo "$4" >"$RC_PHASE"
  echo "${5:-4}" >"$RC_REVIEWED"; echo "${6:-4}" >"$RC_LANE"
}
# The ordinary "present, unparked, unblocked, still at <from>" graph.
set_graph 4 4 4 4

session_rows() { printf '%s\n' "$1" >"$AGENTS_JSON"; }

NODE=tactic-fixture-node
REAPED='[]'
WORKING='[{"pid":1,"id":"a","cwd":"/x","sessionId":"a-1","name":"tactic-fixture-node","status":"busy","state":"working"}]'
HELD='[{"pid":1,"id":"a","cwd":"/x","sessionId":"a-1","name":"tactic-fixture-node","status":"idle","state":"done"}]'

# The from-phase every run_await case is awaited at. Only the marker cases care
# — the check that reads the `reviewed` marker is gated on it.
FROM=qa

run_await() { # <want-exit> <want-stdout-prefix> <label> [extra args...]
  local want_rc="$1" want_out="$2" label="$3"; shift 3
  local out rc
  # --boot-grace-s 1: every reaped-session case below has no worker to register,
  # so the full grace would be spent waiting for one that never comes. The grace
  # itself is exercised by its own case at the end.
  out=$("$AWAIT" "$NODE" "$FROM" --poll-s 1 --boot-grace-s 1 "$@" 2>/dev/null)
  rc=$?
  if [[ "$rc" != "$want_rc" ]]; then
    fail "$label — expected exit $want_rc, got $rc (stdout: $out)"; return
  fi
  if [[ "$out" != "$want_out"* ]]; then
    fail "$label — expected stdout starting '$want_out', got '$out'"; return
  fi
  ok "$label (exit=$rc, '$out')"
}

# --- Usage -----------------------------------------------------------------
"$AWAIT" >/dev/null 2>&1
[[ $? == 2 ]] && ok "no arguments is a usage error (exit 2)" || fail "no arguments should exit 2"

"$AWAIT" "$NODE" >/dev/null 2>&1
[[ $? == 2 ]] && ok "a missing from-phase is a usage error (exit 2)" || fail "missing from-phase should exit 2"

"$AWAIT" "Bad Id" qa >/dev/null 2>&1
[[ $? == 2 ]] && ok "malformed node id is rejected (exit 2)" || fail "malformed node id should exit 2"

"$AWAIT" "$NODE" qa --poll-s 0 >/dev/null 2>&1
[[ $? == 2 ]] && ok "--poll-s 0 is rejected (it would spin) (exit 2)" || fail "--poll-s 0 should exit 2"

# --- Reaped session: the graph decides -------------------------------------
session_rows "$REAPED"

# `--blob absent` satisfied means the node was pruned. Checked FIRST on purpose:
# an absent node ALSO satisfies `.phase != qa`, so a phase-first ordering would
# report a pruned node as merely advanced.
set_graph 0 4 4 4
run_await 0 "pruned $NODE" "an absent node is reported pruned, not advanced"

set_graph 4 0 4 4
run_await 11 "throw $NODE parked" "a parked node throws (exit 11)"

# The park outranks a phase change: a phase worker can advance the node AND park
# it in the same pass, and the park is the part that needs a human.
set_graph 4 0 4 0
run_await 11 "throw $NODE parked" "a park outranks an advance"

set_graph 4 4 0 4
run_await 11 "throw $NODE blocked-by" "a blocked_by edge throws (exit 11)"

set_graph 4 4 4 0
run_await 0 "advanced $NODE qa" "a phase change is reported advanced (exit 0)"

set_graph 4 4 4 4
run_await 12 "stalled $NODE qa" "a stopped worker with no graph change is stalled (exit 12)"

# verify-landed's third answer must never collapse into one of the other two —
# claiming `advanced` on an unreadable graph would step the loop forward on no
# evidence, and claiming `stalled` would trigger a needless re-run.
set_graph 1 4 4 4
run_await 14 "throw $NODE unknown-graph-read" "an unreadable graph is unknown, not a verdict (exit 14)"

set_graph 4 4 4 1
run_await 14 "throw $NODE unknown-graph-read" "an unknown phase read is also exit 14"

# --- The `reviewed` marker -------------------------------------------------
# A clean review writes the marker and NO phase (transitions.ts returns
# `{phase: "review", armMerge: true}`), so the node is still at `review` when the
# work is done. Read by phase alone that is indistinguishable from a stall, and
# the ladder would halt before the merge-and-absorb it exists to reach.
FROM=review
set_graph 4 4 4 4 0
run_await 0 "reviewed $NODE review -> pending-merge" "a clean review is recognized by its marker, not by a phase change"

# The marker is the ONLY evidence: without it an unmoved node at `review` is
# still a stall, exactly as at any other phase.
set_graph 4 4 4 4 4
run_await 12 "stalled $NODE review" "review with no marker and no phase change is still stalled"

set_graph 4 4 4 4 1
run_await 14 "throw $NODE unknown-graph-read" "an unknown marker read is unknown, not a verdict (exit 14)"

# THE GATE. Markers accumulate and are never cleared, so a node awaited at qa
# carries the `reviewed` marker from its earlier review pass. Reading it there
# would report a finished phase for a worker that did nothing — the stall this
# script exists to surface, silently swallowed.
FROM=qa
set_graph 4 4 4 4 0
run_await 12 "stalled $NODE qa" "a stale reviewed marker is ignored at any phase but review"

# --- The `execution.lane_pass` stamp ---------------------------------------
# dispatch-conflict's Lane 3 and qa-fix's auto-fix fixing pass complete by
# pushing to the node's branch and writing job-dir markers; neither touches
# `.phase`. Read by phase alone a SUCCESSFUL pass on either can only ever be
# `stalled`, so both stamp `execution.lane_pass` and this script reads it —
# but only against a launch window, and only when the caller supplies one.
SINCE=1750000000

# THE GATE, and the reason no case above changed meaning: without `--since` the
# stamp is not consulted at all. `RC_LANE=0` here says "a fresh stamp is on the
# node"; the answer is still `stalled`, because a hand caller has no launch time
# to assert and a defaulted window would invent evidence.
set_graph 4 4 4 4 4 0
run_await 12 "stalled $NODE qa" "a stamp is never consulted without --since"

set_graph 4 4 4 4 4 0
run_await 0 "lane-complete $NODE qa" "a stamp at or after this launch is lane-complete (exit 0)" --since "$SINCE"

# THE HALT THIS DESIGN MUST NOT BREAK. No stamp and a stamp older than the
# launch are the same answer from verify-landed (the predicate is simply false,
# rc 4), and both stay exit 12. Nothing here re-enters, retries, or falls back
# to a branch tip.
set_graph 4 4 4 4 4 4
run_await 12 "stalled $NODE qa" "no stamp, or one older than the launch, is still stalled (exit 12)" --since "$SINCE"

set_graph 4 4 4 4 4 1
run_await 14 "throw $NODE unknown-graph-read" "an unreadable stamp is unknown, never completion (exit 14)" --since "$SINCE"

# PROBE ORDER. The phase check runs FIRST: if a lane ever stamps AND moves the
# phase, `advanced` is the stronger fact and stays the answer.
set_graph 4 4 4 0 4 0
run_await 0 "advanced $NODE qa" "a phase change outranks a fresh stamp" --since "$SINCE"

# And every halting probe above it still outranks it. A stamp is the weakest
# evidence in the chain, never a way past a park or a prune.
set_graph 4 0 4 4 4 0
run_await 11 "throw $NODE parked" "a park outranks a fresh stamp" --since "$SINCE"

set_graph 0 4 4 4 4 0
run_await 0 "pruned $NODE" "a pruned node outranks a fresh stamp" --since "$SINCE"

# --- Held session ----------------------------------------------------------
# `state: done` with the row still present means the worker stopped WITHOUT
# declaring a terminal disposition, so the Stop hook is holding the job alive.
#
# THE HOLD IS NOT THE VERDICT. That is also precisely the shape of an
# ESCALATION mid-flight: every node-lane skill's escalation path writes
# $CLAUDE_JOB_DIR/office-hours-reason and deliberately declares no
# node-terminal marker, leaving the park to terminal_without_disposition_sweep,
# which lands it seconds-to-minutes later. So the graph is asked about a park
# FIRST, and a hold with no park is an OBSERVATION (`held-observing`, exit 21)
# that the caller re-polls after running that sweep — not a throw. This suite
# previously pinned the opposite ("a held session throws regardless of the
# graph"), which made the sweep structurally unreachable: dispatch-ladder-run
# halted on the first poll, and the healer only ever ran after the halt.
session_rows "$HELD"

# THE TERMINUS. Once the sweep has consumed the escalation reason and parked the
# node, the hold resolves into the one answer a person can read.
set_graph 4 0 4 4
run_await 11 "throw $NODE parked" "a held session whose node has since been parked reports the park, not the hold"

# The park is checked ahead of the phase, exactly as on the reaped path: a
# worker can advance the node AND escalate in the same pass.
set_graph 4 0 4 0
run_await 11 "throw $NODE parked" "a park outranks an advance on the held path too"

set_graph 4 4 4 0
run_await 21 "held-observing $NODE" "a done-but-unreaped session is held-observing even when the phase advanced"

set_graph 4 4 4 4
run_await 21 "held-observing $NODE" "an unparked held session is held-observing (exit 21), never a verdict"

# A fresh lane-pass stamp does not resolve a hold either. The held row means a
# worker slot is still occupied and the node still unselectable, whatever the
# graph says about the pass — so this stays an observation the caller re-polls.
set_graph 4 4 4 4 4 0
run_await 21 "held-observing $NODE" "a held session with a fresh stamp is still held-observing" --since "$SINCE"

# --- Still working ---------------------------------------------------------
# A long phase is the expected case, not a failure: the timeout sits under the
# Bash tool's own ceiling so a caller gets a real answer and calls again.
session_rows "$WORKING"
set_graph 4 4 4 4
run_await 20 "running $NODE qa" "a working session at the timeout is exit 20 (call again)" --timeout-s 2

# --- The live graph poll ---------------------------------------------------
# The change this script reports is public at origin/main the moment the worker
# pushes it, which can be many minutes before the registry reaps the session
# row. Branching on session state alone bounded detection by that reap lag: the
# measured case had the `reviewed` marker public 1201s before the wait noticed.
# So stage 2 asks the graph on its own cadence even while the row says
# `working` — and then splits on WHAT THE CALLER DOES NEXT with the answer.
#
# THE CONTRACT CHANGED HERE, DELIBERATELY. The three cases below that assert a
# PROGRESS verdict (advanced / reviewed / lane-complete) previously asserted the
# opposite — that it is reported against a live row. That was a regression:
# dispatch-ladder-run logs `awaited`, breaks, and calls dispatch-ladder-advance
# with nothing in between, and advance refuses on a registered session before it
# does anything else (exit 13, dispatch-ladder-advance:199), which the run maps
# to `halt 13 claimed`. Reap lag is minutes and that gap is milliseconds, so
# reporting early ended the run instead of saving the wait. The gate is correct
# — the old worker still owns the node's worktree until it exits — so the fix is
# on this side: record the sighting, keep polling, report at the reap.
session_rows "$WORKING"

set_graph 4 4 4 0
run_await 20 "running $NODE qa" "a phase change is NOT reported while the worker is still registered" \
  --graph-poll-every 1 --timeout-s 3

# THE MEASURED CASE, now answered differently. The `reviewed` marker really is
# public before the reap — that part of the measurement stands — but the next
# ladder step cannot start against the live row, so the wait continues.
FROM=review
set_graph 4 4 4 4 0
run_await 20 "running $NODE review" "a reviewed marker does not end the wait while the row is live" \
  --graph-poll-every 1 --timeout-s 3
FROM=qa

set_graph 4 4 4 4 4 0
run_await 20 "running $NODE qa" "a fresh lane_pass stamp does not end the wait while the row is live" \
  --graph-poll-every 1 --timeout-s 3 --since "$SINCE"

# THE OTHER HALF OF THE SPLIT. A run-ending verdict IS reported against a live
# row, exactly as before: the run halts on it (exit 0 / exit 11) and never calls
# advance again, so the lingering row cannot bite and the whole reap lag is
# saved. This is where the measured 1201s is genuinely collectable.
set_graph 4 0 4 4
run_await 11 "throw $NODE parked" "a park is reported while the worker is still registered" \
  --graph-poll-every 1 --timeout-s 5

set_graph 4 4 0 4
run_await 11 "throw $NODE blocked-by" "a blocked_by edge is reported while the worker is still registered" \
  --graph-poll-every 1 --timeout-s 5

set_graph 0 4 4 4
run_await 0 "pruned $NODE" "a pruned node is reported while the worker is still registered" \
  --graph-poll-every 1 --timeout-s 5

# ONLY A TERMINAL VERDICT ENDS THE WAIT. `unchanged` is what a phase in flight
# looks like every single poll; reading it as a verdict would call every running
# phase stalled.
set_graph 4 4 4 4
run_await 20 "running $NODE qa" "a live worker with nothing public at origin/main keeps running" \
  --graph-poll-every 1 --timeout-s 2

# AND AN UNREADABLE GRAPH IS NOT ONE EITHER. Exit 14 is the answer for a worker
# that has already STOPPED, where nothing more will change. Mid-phase it is a
# transient, and turning it into a throw would abort a live phase on a failed
# fetch. The `set_graph 4 4 4 1` here is what makes the case bite.
set_graph 4 4 4 1
run_await 20 "running $NODE qa" "an unreadable graph mid-phase keeps polling, it is not exit 14" \
  --graph-poll-every 1 --timeout-s 2

# THE THROTTLE IS REAL. The first probe in a verdict fetches, so the graph is
# asked every nth poll, not every poll. At the default 4 with --poll-s 1 and a
# 2s window, no poll reaches the cadence — so a graph that says `parked` is NOT
# reported inside this window. That is the cost being bought: latency capped at
# n × --poll-s instead of bounded by reap lag.
#
# `parked` and not `advanced`: since the split above, a live `advanced` produces
# `running` whether or not the graph is asked, so this case would pass without
# the throttle doing anything. A run-ending verdict is the only kind that still
# makes it bite.
set_graph 4 0 4 4
run_await 20 "running $NODE qa" "the default cadence does not ask the graph on every poll" --timeout-s 2

# --- The sighting, the reap, and reap_lag_s --------------------------------
# A progress verdict sighted against a live row is not discarded — it is
# RECORDED, and reported through the `absent` arm once the registry reaps the
# row. The registry stub answers `working` for the first <n> reads and then
# empty, which is exactly the production sequence: the worker pushes, the graph
# goes public, the row lingers, the row goes.
SEQ_COUNTER="$TMP/seq-counter"
session_seq() { # <live-reads-before-the-reap>
  echo 0 >"$SEQ_COUNTER"
  cat >"$CLAUDE_STUB" <<STUB
#!/usr/bin/env bash
n=\$(cat "$SEQ_COUNTER"); echo \$((n + 1)) > "$SEQ_COUNTER"
if (( n < $1 )); then cat "$AGENTS_JSON"; else echo '[]'; fi
STUB
  chmod +x "$CLAUDE_STUB"
}
session_rows "$WORKING"

# Read 1 is stage 1 (the worker registers), read 2 is the one stage-2 poll that
# sights `advanced` at origin/main, read 3 is the reap. The verdict is reported
# then — and carries the interval between the sighting and the reap.
session_seq 2
set_graph 4 4 4 0
OUT=$("$AWAIT" "$NODE" qa --poll-s 1 --boot-grace-s 3 --graph-poll-every 1 --timeout-s 10 2>/dev/null); RC=$?
if [[ "$RC" == 0 && "$OUT" == "advanced $NODE qa -> origin/main reap_lag_s="* ]]; then
  ok "a sighted progress verdict is reported at the reap, with reap_lag_s ('$OUT')"
else
  fail "sighted-then-reaped should exit 0 'advanced ... reap_lag_s=<n>', got exit $RC / '$OUT'"
fi

# NO SIGHTING, NO FIELD. Same session sequence, but the default cadence means no
# stage-2 poll ever asks the graph, so the verdict is first read at the reap and
# nothing was measured. The field is OMITTED — a 0 would say "measured, and the
# lag was zero", which is a different claim.
session_seq 2
set_graph 4 4 4 0
OUT=$("$AWAIT" "$NODE" qa --poll-s 1 --boot-grace-s 3 --timeout-s 10 2>/dev/null); RC=$?
if [[ "$RC" == 0 && "$OUT" == "advanced $NODE qa -> origin/main" ]]; then
  ok "no early sighting means no reap_lag_s field at all"
else
  fail "unsighted-then-reaped should exit 0 'advanced $NODE qa -> origin/main' with no trailing field, got exit $RC / '$OUT'"
fi

# THE FIELD IS TRAILING, SO EXISTING PARSING IS INERT. dispatch-ladder-run reads
# the disposition with `awk '{print $1; exit}'` (dispatch-ladder-run:1159); the
# extra field lands after every word that call site or any halt message reads.
DISP=$(awk '{print $1; exit}' <<<"advanced $NODE qa -> origin/main reap_lag_s=42")
[[ "$DISP" == advanced ]] && ok "a trailing reap_lag_s field does not disturb the leading-token disposition parse" \
  || fail "awk '{print \$1; exit}' returned '$DISP' on a line carrying reap_lag_s"

# Restore the plain registry stub for the sections below.
cat >"$CLAUDE_STUB" <<STUB
#!/usr/bin/env bash
cat "$AGENTS_JSON"
STUB
chmod +x "$CLAUDE_STUB"
session_rows "$WORKING"

"$AWAIT" "$NODE" qa --graph-poll-every 0 >/dev/null 2>&1
[[ $? == 2 ]] && ok "--graph-poll-every 0 is rejected (it would divide by zero) (exit 2)" \
  || fail "--graph-poll-every 0 should exit 2"

"$AWAIT" "$NODE" qa --graph-poll-every x >/dev/null 2>&1
[[ $? == 2 ]] && ok "a non-integer --graph-poll-every is rejected (exit 2)" \
  || fail "non-integer --graph-poll-every should exit 2"

set_graph 4 4 4 4

# --- UNKNOWN liveness is not 'finished', and not a verdict either ----------
# A registry read that cannot be answered must keep waiting. Treating it as
# `absent` would send the loop to the next phase while a worker is live — the
# duplicate-worker hazard the whole claim discipline exists to prevent.
#
# The subtle half: when EVERY read fails, the script must not fall through to a
# graph verdict either. The graph is readable in this case and says "still at
# qa", so a fall-through would report `stalled` — a real-looking verdict about a
# worker nothing ever observed. The `set_graph 4 4 4 4` below is what makes the
# case bite; with a phase change it would pass for the wrong reason.
cat >"$CLAUDE_STUB" <<'STUB'
#!/usr/bin/env bash
exit 1
STUB
chmod +x "$CLAUDE_STUB"
set_graph 4 4 4 4
run_await 20 "running $NODE qa" "an all-unknown registry never yields a graph verdict" --timeout-s 2

# --- The boot grace waits for a LATE registration --------------------------
# The spawn kick returns before the worker registers. If the wait gave up on the
# first empty read it would consult the graph mid-boot, see no transition, and
# report `stalled` for a phase that had not started yet — sending the attended
# thread to debug a worker that was merely slow to boot. Here the registry is
# empty for the first two reads and then shows a live worker; the correct answer
# is `running` (it found the session), not `stalled`.
COUNTER="$TMP/boot-counter"
echo 0 >"$COUNTER"
cat >"$CLAUDE_STUB" <<STUB
#!/usr/bin/env bash
n=\$(cat "$COUNTER"); echo \$((n + 1)) > "$COUNTER"
if (( n < 2 )); then echo '[]'; else cat "$AGENTS_JSON"; fi
STUB
chmod +x "$CLAUDE_STUB"
session_rows "$WORKING"
set_graph 4 4 4 4
OUT=$("$AWAIT" "$NODE" qa --poll-s 1 --boot-grace-s 10 --timeout-s 6 2>/dev/null); RC=$?
if [[ "$RC" == 20 && "$OUT" == "running $NODE qa" ]]; then
  ok "a late-registering worker is found within the boot grace, not called stalled"
else
  fail "late registration should exit 20 'running', got exit $RC / '$OUT'"
fi

"$AWAIT" "$NODE" qa --boot-grace-s x >/dev/null 2>&1
[[ $? == 2 ]] && ok "a non-integer --boot-grace-s is rejected (exit 2)" \
  || fail "non-integer --boot-grace-s should exit 2"

# A --since that cannot become a timestamp is an environment error, never a
# quiet skip of the probe: a silently disabled probe is indistinguishable from
# a node that carries no stamp, which is the whole defect this exists to fix.
"$AWAIT" "$NODE" qa --since x >/dev/null 2>&1
[[ $? == 2 ]] && ok "a non-integer --since is rejected (exit 2)" \
  || fail "non-integer --since should exit 2"

"$AWAIT" "$NODE" qa --since >/dev/null 2>&1
[[ $? == 2 ]] && ok "--since with no value is a usage error (exit 2)" \
  || fail "--since with no value should exit 2"

printf '\n%d passed, %d failed\n' "$PASS" "$FAIL"
(( FAIL == 0 )) || exit 1
