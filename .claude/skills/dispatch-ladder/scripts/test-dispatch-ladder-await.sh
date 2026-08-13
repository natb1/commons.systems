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
RC_REVIEWED="$TMP/rc.reviewed"
cat >"$IUTIL/verify-landed" <<STUB
#!/usr/bin/env bash
args="\$*"
case "\$args" in
  *"--blob absent"*)   exit "\$(cat "$RC_ABSENT")" ;;
  *office_hours*)      exit "\$(cat "$RC_PARKED")" ;;
  *blocked_by*)        exit "\$(cat "$RC_BLOCKED")" ;;
  *markers*)           exit "\$(cat "$RC_REVIEWED")" ;;
  *.phase*)            exit "\$(cat "$RC_PHASE")" ;;
esac
exit 1
STUB
chmod +x "$IUTIL/verify-landed"

# The reviewed-marker rc is last and optional: every pre-existing case predates
# the marker check and wants its "no marker" answer (4).
set_graph() { # <absent-rc> <parked-rc> <blocked-rc> <phase-rc> [<reviewed-rc>]
  echo "$1" >"$RC_ABSENT"; echo "$2" >"$RC_PARKED"
  echo "$3" >"$RC_BLOCKED"; echo "$4" >"$RC_PHASE"
  echo "${5:-4}" >"$RC_REVIEWED"
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

# --- Still working ---------------------------------------------------------
# A long phase is the expected case, not a failure: the timeout sits under the
# Bash tool's own ceiling so a caller gets a real answer and calls again.
session_rows "$WORKING"
set_graph 4 4 4 4
run_await 20 "running $NODE qa" "a working session at the timeout is exit 20 (call again)" --timeout-s 2

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

printf '\n%d passed, %d failed\n' "$PASS" "$FAIL"
(( FAIL == 0 )) || exit 1
