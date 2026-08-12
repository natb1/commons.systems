#!/usr/bin/env bash
# Unit tests for dispatch-ladder-advance — the launch half of the
# dispatch-ladder loop.
#
# What is worth testing here is the DISPOSITION MAPPING and the REFUSALS, not
# the dispatch machinery: dispatch-ladder-advance's whole design is that it delegates
# selection and execution verbatim, so the tests stub both siblings and assert
# that every line they can emit maps to the documented exit code. A mapping
# regression is silent in production — an unmapped `parked` that fell through to
# `launched` would send the loop into a wait for a session that does not exist.
#
# Both stubs and the Claude daemon are replaced: CLAUDE_AGENTS_CMD for liveness,
# DISPATCH_RESERVATION_DIR for the ledger, DISPATCH_GRAPH_MAIN_WORKTREE for the
# project root. No network, no daemon, no gh.
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
# A real checkout layout, because dispatch-ladder-advance resolves its
# siblings from its own on-disk location (four levels up) — a resolution that
# is itself a regression risk.
PROJECT="$TMP/project"
LADDER_SCRIPTS="$PROJECT/.claude/skills/dispatch-ladder/scripts"
DISPATCH="$PROJECT/.claude/skills/dispatch-propagate/scripts"
mkdir -p "$LADDER_SCRIPTS" "$DISPATCH"

cp "$SCRIPT_DIR/dispatch-ladder-advance" "$LADDER_SCRIPTS/dispatch-ladder-advance"
chmod +x "$LADDER_SCRIPTS/dispatch-ladder-advance"
for lib in lib-claude-agents.sh lib-reservation-ledger.sh lib-graph-worktree.sh lib.sh; do
  src="$SCRIPT_DIR/../../dispatch-propagate/scripts/$lib"
  [[ -f "$src" ]] && cp "$src" "$DISPATCH/$lib"
done

git -C "$PROJECT" init -q
git -C "$PROJECT" config user.email test@example.com
git -C "$PROJECT" config user.name Test
git -C "$PROJECT" add -A >/dev/null 2>&1
git -C "$PROJECT" commit -qm init >/dev/null 2>&1

ADVANCE="$LADDER_SCRIPTS/dispatch-ladder-advance"

export DISPATCH_GRAPH_MAIN_WORKTREE="$PROJECT"
export DISPATCH_RESERVATION_DIR="$TMP/reservations"
mkdir -p "$DISPATCH_RESERVATION_DIR"

# `git fetch origin main` must succeed — dispatch-ladder-advance refuses to act on an
# unverified graph otherwise. Give the fixture a real local "remote".
REMOTE="$TMP/remote.git"
git init -q --bare "$REMOTE"
git -C "$PROJECT" remote add origin "$REMOTE"
git -C "$PROJECT" push -q origin HEAD:main

# lib-claude-agents' empty-read corroboration only accepts an empty registry as
# a definite "no sessions" when a `claude daemon` process is visible — otherwise
# every liveness read is UNKNOWN, which folds to occupied, and every case below
# would exit 13. CI has no daemon, so stub the probe rather than the process.
# Without this the suite passes on a developer machine (a real daemon is running)
# and fails in CI — the exact environment-dependent test this repo does not want.
PGREP_STUB="$TMP/pgrep-stub"
cat >"$PGREP_STUB" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
chmod +x "$PGREP_STUB"
export CLAUDE_AGENTS_PGREP_CMD="$PGREP_STUB"

# --- Stubs -----------------------------------------------------------------
# `claude agents --json[ --all]` — the registry. Body controlled per case.
AGENTS_JSON="$TMP/agents.json"
echo '[]' >"$AGENTS_JSON"
CLAUDE_STUB="$TMP/claude-stub"
cat >"$CLAUDE_STUB" <<STUB
#!/usr/bin/env bash
cat "$AGENTS_JSON"
STUB
chmod +x "$CLAUDE_STUB"
export CLAUDE_AGENTS_CMD="$CLAUDE_STUB"

# graph-select-target and dispatch-graph-execute — each echoes the contents of a
# file the case under test writes, so one stub covers every protocol line.
SELECT_OUT="$TMP/select.out"
EXEC_OUT="$TMP/exec.out"
EXEC_RC="$TMP/exec.rc"
echo 0 >"$EXEC_RC"

cat >"$DISPATCH/graph-select-target" <<STUB
#!/usr/bin/env bash
cat "$SELECT_OUT"
STUB
cat >"$DISPATCH/dispatch-graph-execute" <<STUB
#!/usr/bin/env bash
echo "\$@" > "$TMP/exec.args"
cat "$EXEC_OUT"
exit "\$(cat "$EXEC_RC")"
STUB
chmod +x "$DISPATCH/graph-select-target" "$DISPATCH/dispatch-graph-execute"

# --- Helpers ---------------------------------------------------------------
run_case() { # <label> <select-line> <exec-line> <want-exit> <want-stdout-prefix>
  local label="$1" sel="$2" ex="$3" want_rc="$4" want_out="$5"
  printf '%s\n' "$sel" >"$SELECT_OUT"
  printf '%s\n' "$ex" >"$EXEC_OUT"
  rm -f "$DISPATCH_RESERVATION_DIR"/* 2>/dev/null
  local out rc
  out=$("$ADVANCE" tactic-fixture-node 2>/dev/null)
  rc=$?
  if [[ "$rc" != "$want_rc" ]]; then
    fail "$label — expected exit $want_rc, got $rc (stdout: $out)"
    return
  fi
  if [[ "$out" != "$want_out"* ]]; then
    fail "$label — expected stdout starting '$want_out', got '$out'"
    return
  fi
  ok "$label (exit=$rc, '$out')"
}

SPEC="node tactic-fixture-node tactic qa"

# --- Usage and validation --------------------------------------------------
"$ADVANCE" >/dev/null 2>&1
[[ $? == 2 ]] && ok "no argument is a usage error (exit 2)" || fail "no argument should exit 2"

"$ADVANCE" tactic-a tactic-b >/dev/null 2>&1
[[ $? == 2 ]] && ok "two arguments are a usage error (exit 2)" || fail "two arguments should exit 2"

"$ADVANCE" "Tactic_Bad Id" >/dev/null 2>&1
[[ $? == 2 ]] && ok "malformed node id is rejected before any work (exit 2)" \
  || fail "malformed node id should exit 2"

# An id the slug regex rejects must never reach a spawn prompt or a worktree
# path — the same validation dispatch-graph-execute applies.
"$ADVANCE" "123-legacy-issue-slug" >/dev/null 2>&1
[[ $? == 2 ]] && ok "numeric-prefixed legacy slug is rejected (exit 2)" \
  || fail "numeric-prefixed slug should exit 2"

# --- Disposition mapping ---------------------------------------------------
run_case "launched maps to exit 0" \
  "$SPEC" "launched tactic-fixture-node /qa-fix" 0 "launched tactic-fixture-node tactic qa"

# The spec handed to dispatch-graph-execute must be <id>:<kind>:<phase>, built
# from the SELECTOR's answer — never re-derived. A wrong spec would silently run
# the wrong phase skill.
if [[ "$(cat "$TMP/exec.args")" == "tactic-fixture-node:tactic:qa" ]]; then
  ok "the execute spec is <id>:<kind>:<phase> from the selector"
else
  fail "expected spec 'tactic-fixture-node:tactic:qa', got '$(cat "$TMP/exec.args")'"
fi

run_case "conflict-lane is a launch (a session IS running) " \
  "$SPEC" "conflict-lane tactic-fixture-node" 0 "launched tactic-fixture-node tactic qa /dispatch-conflict"

run_case "waiting maps to idle (exit 10)" \
  "$SPEC" "waiting tactic-fixture-node" 10 "idle tactic-fixture-node ci-waiting"

run_case "skipped maps to idle (exit 10)" \
  "$SPEC" "skipped tactic-fixture-node" 10 "idle tactic-fixture-node stale-selection"

run_case "scope-stale maps to idle (exit 10)" \
  "$SPEC" "scope-stale tactic-fixture-node" 10 "idle tactic-fixture-node scope-stale-demoted"

run_case "parked maps to throw (exit 11)" \
  "$SPEC" "parked tactic-fixture-node" 11 "throw tactic-fixture-node parked"

run_case "held maps to throw (exit 11)" \
  "$SPEC" "held tactic-fixture-node" 11 "throw tactic-fixture-node held"

run_case "failed maps to throw (exit 11)" \
  "$SPEC" "failed tactic-fixture-node spawn-failed" 11 "throw tactic-fixture-node execute-failed"

# An unrecognized disposition must NOT be read as success. dispatch-graph-execute
# grows dispositions over time, and a new one falling through to `launched` would
# make the loop wait forever for a session nobody started.
run_case "an unknown disposition throws rather than passing (exit 11)" \
  "$SPEC" "some-new-disposition tactic-fixture-node" 11 "throw tactic-fixture-node execute-failed"

# --- Selection outcomes ----------------------------------------------------
run_case "an empty selection is idle, not an error (exit 10)" \
  "empty" "launched tactic-fixture-node /qa-fix" 10 "idle tactic-fixture-node not-selectable"

# A selector line for a DIFFERENT node must not be consumed as this node's
# directive — the grep is anchored on the id for exactly this reason.
run_case "a selector line for another node is not consumed (exit 10)" \
  "node tactic-other-node tactic qa" "launched x /qa-fix" 10 "idle tactic-fixture-node not-selectable"

# --- Strategy refusal -------------------------------------------------------
# A strategy id must be refused mechanically, not launched: an /align-tactics
# pass on a strategy decomposes it into CHILD tactic ids rather than
# advancing the strategy itself up the ladder, so there is no single node for
# this loop to follow. Cannot use run_case — it hardcodes tactic-fixture-node
# as the argument; this case needs a strategy id instead.
printf 'node strategy-fixture-node strategy align-tactics\n' >"$SELECT_OUT"
printf 'launched strategy-fixture-node /align-tactics\n' >"$EXEC_OUT"
rm -f "$DISPATCH_RESERVATION_DIR"/* 2>/dev/null
rm -f "$TMP/exec.args"
OUT=$("$ADVANCE" strategy-fixture-node 2>/dev/null); RC=$?
if [[ "$RC" == 2 && "$OUT" == "refused strategy-fixture-node strategy" ]]; then
  ok "a strategy id is refused before any claim or execute (exit 2)"
else
  fail "strategy refusal should exit 2 with 'refused ...', got exit $RC / '$OUT'"
fi
if [[ ! -s "$TMP/exec.args" ]]; then
  ok "dispatch-graph-execute was never invoked for a refused strategy"
else
  fail "dispatch-graph-execute should not run for a refused strategy; args: $(cat "$TMP/exec.args")"
fi
if [[ ! -f "$DISPATCH_RESERVATION_DIR/strategy-fixture-node" ]]; then
  ok "no reservation marker is written for a refused strategy"
else
  fail "a reservation marker should not exist for a refused strategy"
fi

# --- Complement: a tactic at the align-tactics rung still launches --------
# The refusal gates on KIND only, never PHASE — a draft/raw/frozen tactic
# starting its own /align-tactics finalize pass is the legitimate "start at
# align-tactics" case, so it must not be caught by the strategy refusal.
printf 'node tactic-fixture-node tactic align-tactics\n' >"$SELECT_OUT"
printf 'launched tactic-fixture-node /align-tactics\n' >"$EXEC_OUT"
rm -f "$DISPATCH_RESERVATION_DIR"/* 2>/dev/null
OUT=$("$ADVANCE" tactic-fixture-node 2>/dev/null); RC=$?
if [[ "$RC" == 0 && "$OUT" == "launched tactic-fixture-node tactic align-tactics /align-tactics" ]]; then
  ok "a tactic at the align-tactics rung still launches (exit 0)"
else
  fail "tactic at the align-tactics rung should launch (exit 0), got exit $RC / '$OUT'"
fi

# --- Claim refusals --------------------------------------------------------
# A live session registered under the node's worktree name blocks the launch.
# This is the dispatch/dispatch-ladder mutual exclusion; nothing may proceed past it.
cat >"$AGENTS_JSON" <<'JSON'
[{"pid":999,"id":"aaaa","cwd":"/x","sessionId":"aaaa-1","name":"tactic-fixture-node","status":"busy","state":"working"}]
JSON
printf '%s\n' "$SPEC" >"$SELECT_OUT"
printf 'launched tactic-fixture-node /qa-fix\n' >"$EXEC_OUT"
rm -f "$DISPATCH_RESERVATION_DIR"/* 2>/dev/null
OUT=$("$ADVANCE" tactic-fixture-node 2>/dev/null); RC=$?
if [[ "$RC" == 13 && "$OUT" == "claimed tactic-fixture-node live-session" ]]; then
  ok "a live session on the node refuses the launch (exit 13)"
else
  fail "live-session claim should exit 13 with 'claimed ...', got exit $RC / '$OUT'"
fi
echo '[]' >"$AGENTS_JSON"

# An unreleased reservation marker likewise refuses — the boot-window half of
# the same mutual exclusion.
printf 'issue=\nsession=someone-else\ntimestamp=1\n' >"$DISPATCH_RESERVATION_DIR/tactic-fixture-node"
OUT=$("$ADVANCE" tactic-fixture-node 2>/dev/null); RC=$?
if [[ "$RC" == 13 && "$OUT" == claimed\ tactic-fixture-node\ reservation:* ]]; then
  ok "an existing reservation marker refuses the launch (exit 13)"
else
  fail "reservation claim should exit 13 with 'claimed ... reservation:', got exit $RC / '$OUT'"
fi
rm -f "$DISPATCH_RESERVATION_DIR"/*

# --- The claim is written BEFORE the spawn ---------------------------------
# The marker must exist by the time dispatch-graph-execute runs, or the boot
# window is unguarded and a concurrent tick can select the same node.
cat >"$DISPATCH/dispatch-graph-execute" <<STUB
#!/usr/bin/env bash
if [[ -f "$DISPATCH_RESERVATION_DIR/tactic-fixture-node" ]]; then
  echo "MARKER-PRESENT" > "$TMP/marker-check"
else
  echo "MARKER-ABSENT" > "$TMP/marker-check"
fi
echo "launched tactic-fixture-node /qa-fix"
STUB
chmod +x "$DISPATCH/dispatch-graph-execute"
printf '%s\n' "$SPEC" >"$SELECT_OUT"
"$ADVANCE" tactic-fixture-node >/dev/null 2>&1
if [[ "$(cat "$TMP/marker-check" 2>/dev/null)" == "MARKER-PRESENT" ]]; then
  ok "the reservation marker is written before dispatch-graph-execute runs"
else
  fail "the reservation marker was NOT present when dispatch-graph-execute ran"
fi

# And it carries origin=explicit — the origin reservation_sweep's TTL rule
# already reclaims. A marker with no reclaimable origin leaks the slot forever
# if this script dies before the worker registers.
if grep -qx 'origin=explicit' "$DISPATCH_RESERVATION_DIR/tactic-fixture-node" 2>/dev/null; then
  ok "the reservation marker carries origin=explicit (sweep-reclaimable)"
else
  fail "the reservation marker should carry origin=explicit; got: $(cat "$DISPATCH_RESERVATION_DIR/tactic-fixture-node" 2>/dev/null)"
fi

printf '\n%d passed, %d failed\n' "$PASS" "$FAIL"
(( FAIL == 0 )) || exit 1
