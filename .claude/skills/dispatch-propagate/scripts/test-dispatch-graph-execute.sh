#!/usr/bin/env bash
# Tests for dispatch-graph-execute — the graph lane's Shape-B launch primitive.
#
# Verifies the direct-phase-skill launch: for each `<id:kind:phase>` the SUT
# spawns a top-level sonnet orchestrator session that invokes the phase skill
# DIRECTLY (never a runner session that invokes a workflow). Covers the per-phase
# skill map, the strategy/tactic lane split, and every provision-exit disposition
# (0/10/11/12/13/14/2) — routed here at zero token cost with no `claude` session
# on any non-zero path.
#
# Harness (mirrors the per-SUT test-*.sh files sharing dispatch-test-fixture.sh):
# copy the SUT + its sourced libs
# into a tmp dir and drop stub SIBLINGS so `"$SCRIPT_DIR/<name>"` resolves to
# them (provision-node-worktree, dispatch-spawn-job, dispatch-phase-effort). The
# package primitives park-node / demote-node-to-implement resolve from the
# project root, so their stubs live under
# `<project-root>/packages/intentionsutil/scripts/`. DISPATCH_GRAPH_MAIN_WORKTREE
# points the SUT's project-root resolution at a tmp dir, skipping `git worktree
# list`. The stubs read PROV_RC / SPAWN_RC / PARK_RC / DEMOTE_RC from the
# environment and log their argv, so a case controls the exit codes and asserts
# from the call logs.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
source "$SCRIPT_DIR/test-helpers.sh"

assert_not_contains() {  # $1 = label, $2 = needle, $3 = haystack
  TOTAL=$((TOTAL + 1))
  if echo "$3" | grep -qF -- "$2"; then
    FAIL=$((FAIL + 1))
    echo "  FAIL: $1"
    echo "    expected NOT to contain: $2"
    echo "    actual: $3"
  else
    PASS=$((PASS + 1))
    echo "  PASS: $1"
  fi
}

# assert_lane_file_fresh <label> <file> — the .conflict-lane sidecar contains
# exactly one line matching ^spawned=[0-9]+$.
assert_lane_file_fresh() {  # $1 = label, $2 = file
  local label="$1" file="$2"
  TOTAL=$((TOTAL + 1))
  if [[ -f "$file" ]] && [[ "$(wc -l < "$file" | tr -d ' ')" == "1" ]] \
      && grep -Eq '^spawned=[0-9]+$' "$file"; then
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label"
    echo "    expected a single line matching ^spawned=[0-9]+\$"
    echo "    actual: $([[ -f "$file" ]] && cat "$file" || echo '(file missing)')"
  fi
}

# --- harness ----------------------------------------------------------------
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

SUT_DIR="$TMP/scripts"
MAIN_WT="$TMP/main"
PKG_DIR="$MAIN_WT/packages/intentionsutil/scripts"
mkdir -p "$SUT_DIR" "$MAIN_WT" "$PKG_DIR" "$MAIN_WT/.claude/worktrees"

# Copy the SUT and its sourced libs (lib-reservation-ledger.sh pulls in lib.sh
# and lib-claude-agents.sh). The real dispatch-phase-effort is pure, so copy it
# rather than stub it — implement -> medium is part of the contract under test.
cp "$SCRIPT_DIR/dispatch-graph-execute" "$SUT_DIR/dispatch-graph-execute"
cp "$SCRIPT_DIR/lib-reservation-ledger.sh" "$SUT_DIR/lib-reservation-ledger.sh"
cp "$SCRIPT_DIR/lib.sh" "$SUT_DIR/lib.sh"
cp "$SCRIPT_DIR/lib-claude-agents.sh" "$SUT_DIR/lib-claude-agents.sh"
cp "$SCRIPT_DIR/lib-graph-worktree.sh" "$SUT_DIR/lib-graph-worktree.sh"
cp "$SCRIPT_DIR/dispatch-phase-effort" "$SUT_DIR/dispatch-phase-effort"
chmod +x "$SUT_DIR/dispatch-graph-execute" "$SUT_DIR/dispatch-phase-effort"

SPAWN_LOG="$TMP/spawn.log"
PARK_LOG="$TMP/park.log"
DEMOTE_LOG="$TMP/demote.log"
HOLD_LOG="$TMP/hold.log"

# provision-node-worktree stub: echo the worktree path on exit 0; exit PROV_RC.
cat >"$SUT_DIR/provision-node-worktree" <<'STUB'
#!/usr/bin/env bash
id="$1"
rc="${PROV_RC:-0}"
[[ "$rc" == "0" ]] && echo "${DISPATCH_GRAPH_MAIN_WORKTREE}/.claude/worktrees/${id}"
exit "$rc"
STUB

# dispatch-spawn-job stub: log the full argv, exit SPAWN_RC.
cat >"$SUT_DIR/dispatch-spawn-job" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$SPAWN_LOG"
exit "${SPAWN_RC:-0}"
STUB

# park-node / demote-node-to-implement stubs under the package scripts dir.
cat >"$PKG_DIR/park-node" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$PARK_LOG"
exit "${PARK_RC:-0}"
STUB
cat >"$PKG_DIR/demote-node-to-implement" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$DEMOTE_LOG"
exit "${DEMOTE_RC:-0}"
STUB
# hold-node stub: log the full argv, exit HOLD_RC.
cat >"$PKG_DIR/hold-node" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$HOLD_LOG"
exit "${HOLD_RC:-0}"
STUB
chmod +x "$SUT_DIR/provision-node-worktree" "$SUT_DIR/dispatch-spawn-job" \
  "$PKG_DIR/park-node" "$PKG_DIR/demote-node-to-implement" "$PKG_DIR/hold-node"

RES_DIR="$TMP/reservations"
mkdir -p "$RES_DIR"

# run_exec <spec> — reset logs, run the SUT against the stubbed sandbox, capture
# stdout in OUT and the exit code in RC. Env in scope (PROV_RC/SPAWN_RC/...) is
# forwarded to the stubs.
OUT=""
RC=0
run_exec() {
  : >"$SPAWN_LOG"; : >"$PARK_LOG"; : >"$DEMOTE_LOG"; : >"$HOLD_LOG"
  set +e
  OUT=$(
    export DISPATCH_GRAPH_MAIN_WORKTREE="$MAIN_WT"
    export DISPATCH_RESERVATION_DIR="$RES_DIR"
    export SPAWN_LOG PARK_LOG DEMOTE_LOG HOLD_LOG
    "$SUT_DIR/dispatch-graph-execute" "$@"
  )
  RC=$?
  set -e
}

# ============================================================================
# Case 1: tactic:implement -> /implement, sonnet, --cwd worktree, --effort medium
# ============================================================================
echo "Case 1: tactic:implement launches /implement directly"
printf 'session=headless:t\nissue=tactic-foo\ntimestamp=2026-01-01T00:00:00Z\n' > "$RES_DIR/tactic-foo"
run_exec "tactic-foo:tactic:implement"
SPAWN=$(cat "$SPAWN_LOG")
assert_eq "implement stdout" "launched tactic-foo /implement" "$OUT"
assert_eq "implement exit 0" "0" "$RC"
assert_contains "implement invokes /implement directly" "/implement tactic-foo" "$SPAWN"
assert_contains "implement orchestrator model sonnet" "--model sonnet" "$SPAWN"
assert_contains "implement --name is the node id" "--name tactic-foo" "$SPAWN"
assert_contains "implement --cwd is the worktree" "--cwd $MAIN_WT/.claude/worktrees/tactic-foo" "$SPAWN"
assert_contains "implement --effort medium" "--effort medium" "$SPAWN"
# The retired workflow indirection must be gone (needle built by concatenation
# so this file does not itself trip the repo-wide dead-string grep).
GT_NEEDLE="dispatch-graph""-tick"
assert_not_contains "implement carries no retired-workflow string" "$GT_NEEDLE" "$SPAWN"
assert_not_contains "implement does not invoke the Workflow tool" "Invoke the Workflow tool" "$SPAWN"
assert_eq "implement hands off the reservation marker, does not clear it" "present" \
  "$([ -e "$RES_DIR/tactic-foo" ] && echo present || echo gone)"
assert_contains "implement marker is re-stamped origin=spawned" "origin=spawned" \
  "$(cat "$RES_DIR/tactic-foo")"
# The re-stamp preserves the selection marker's identity fields rather than
# falling back to the synthesized create-if-absent values (Case 15).
assert_contains "implement handoff preserves the selection session=" "session=headless:t" \
  "$(cat "$RES_DIR/tactic-foo")"
assert_contains "implement handoff preserves the selection issue=" "issue=tactic-foo" \
  "$(cat "$RES_DIR/tactic-foo")"

# ============================================================================
# Case 2: per-phase skill map (review/qa/fix/main-qa)
# ============================================================================
echo "Case 2: per-phase skill map"
run_exec "tactic-r:tactic:review"
assert_eq "review stdout" "launched tactic-r /review-fix" "$OUT"
assert_contains "review invokes /review-fix directly" "/review-fix tactic-r" "$(cat "$SPAWN_LOG")"

run_exec "tactic-q:tactic:qa"
assert_eq "qa stdout" "launched tactic-q /qa-fix" "$OUT"
assert_contains "qa invokes /qa-fix directly" "/qa-fix tactic-q" "$(cat "$SPAWN_LOG")"

run_exec "tactic-f:tactic:fix"
assert_eq "fix stdout" "launched tactic-f /fix-checks" "$OUT"
assert_contains "fix invokes /fix-checks directly" "/fix-checks tactic-f" "$(cat "$SPAWN_LOG")"

run_exec "tactic-c:tactic:conflict"
SPAWN=$(cat "$SPAWN_LOG")
assert_eq "conflict stdout" "launched tactic-c /dispatch-conflict" "$OUT"
assert_contains "conflict invokes /dispatch-conflict directly" "/dispatch-conflict tactic-c" "$SPAWN"
assert_not_contains "conflict has no --effort (unmapped phase)" "--effort" "$SPAWN"

run_exec "tactic-m:tactic:main-qa"
SPAWN=$(cat "$SPAWN_LOG")
assert_eq "main-qa stdout" "launched tactic-m /qa-main" "$OUT"
assert_contains "main-qa invokes /qa-main directly" "/qa-main tactic-m" "$SPAWN"
assert_not_contains "main-qa has no --effort (unmapped phase)" "--effort" "$SPAWN"

# ============================================================================
# Case 3: strategy lane — no pre-provision, cwd=project root, /align-tactics
# ============================================================================
echo "Case 3: strategy lane spawns /align-tactics at the project root"
printf 'session=headless:s\nissue=strategy-x\ntimestamp=2026-01-01T00:00:00Z\n' > "$RES_DIR/strategy-x"
run_exec "strategy-x:strategy:align"
SPAWN=$(cat "$SPAWN_LOG")
assert_eq "strategy stdout" "launched strategy-x /align-tactics" "$OUT"
assert_eq "strategy exit 0" "0" "$RC"
assert_contains "strategy invokes /align-tactics" "/align-tactics strategy-x" "$SPAWN"
assert_contains "strategy cwd is the project root" "--cwd $MAIN_WT" "$SPAWN"
assert_contains "strategy model sonnet" "--model sonnet" "$SPAWN"
assert_eq "strategy hands off the reservation marker, does not clear it" "present" \
  "$([ -e "$RES_DIR/strategy-x" ] && echo present || echo gone)"
assert_contains "strategy marker is re-stamped origin=spawned" "origin=spawned" \
  "$(cat "$RES_DIR/strategy-x")"

# ============================================================================
# Case 4: provision exit 10 -> ci-waiting (no spawn)
# ============================================================================
echo "Case 4: provision exit 10 -> waiting, no spawn"
PROV_RC=10 run_exec "tactic-w:tactic:qa"
assert_eq "waiting stdout" "waiting tactic-w" "$OUT"
assert_eq "waiting exit 0" "0" "$RC"
assert_eq "waiting spawns nothing" "" "$(cat "$SPAWN_LOG")"

# ============================================================================
# Case 5: provision exit 11 -> the /dispatch-conflict Lane 3 session is the
# first responder: it is spawned in the node's own worktree, the reservation is
# HANDED OFF (re-stamped origin=spawned, not cleared), and NO strike file, NO
# hold-node call and NO park-node write happen.
# ============================================================================
echo "Case 5: provision exit 11 -> conflict lane spawned, no strike, no graph write"
rm -f "$MAIN_WT/.claude/worktrees/tactic-c.conflict-strikes"
# A WELL-FORMED selection-time marker, not a bare `touch`: the handoff must carry
# the existing session=/issue= forward. An empty marker would instead exercise the
# create-if-absent fallback, which Case 15 already covers.
printf 'session=headless:c\nissue=tactic-c\ntimestamp=2026-01-01T00:00:00Z\n' > "$RES_DIR/tactic-c"
PROV_RC=11 run_exec "tactic-c:tactic:qa"
SPAWN=$(cat "$SPAWN_LOG")
assert_eq "conflict-lane stdout" "conflict-lane tactic-c" "$OUT"
assert_eq "conflict-lane exit 0" "0" "$RC"
assert_contains "conflict-lane invokes /dispatch-conflict on the node id" \
  "/dispatch-conflict tactic-c" "$SPAWN"
assert_contains "conflict-lane --cwd is the project root" \
  "--cwd $MAIN_WT --model" "$SPAWN"
assert_not_contains "conflict-lane --cwd is NOT the node's own worktree" \
  "$MAIN_WT/.claude/worktrees/tactic-c" "$SPAWN"
assert_contains "conflict-lane --name is the node id" "--name tactic-c" "$SPAWN"
assert_contains "conflict-lane orchestrator model sonnet" "--model sonnet" "$SPAWN"
assert_contains "conflict-lane spawns with --no-verify" "--no-verify" "$SPAWN"
assert_eq "conflict-lane makes no park-node write" "" "$(cat "$PARK_LOG")"
assert_eq "conflict-lane makes no hold-node write" "" "$(cat "$HOLD_LOG")"
assert_eq "conflict-lane writes no strike file" "gone" \
  "$([ -e "$MAIN_WT/.claude/worktrees/tactic-c.conflict-strikes" ] && echo present || echo gone)"
assert_eq "conflict-lane hands off the reservation marker, does not clear it" "present" \
  "$([ -e "$RES_DIR/tactic-c" ] && echo present || echo gone)"
assert_contains "conflict-lane marker is re-stamped origin=spawned" "origin=spawned" \
  "$(cat "$RES_DIR/tactic-c")"
# The re-stamp must PRESERVE the selection marker's identity fields, not
# overwrite them with the create-if-absent fallback (session=spawn-handoff).
assert_contains "conflict-lane handoff preserves the selection session=" "session=headless:c" \
  "$(cat "$RES_DIR/tactic-c")"
assert_contains "conflict-lane handoff preserves the selection issue=" "issue=tactic-c" \
  "$(cat "$RES_DIR/tactic-c")"
# A successful kick writes the .conflict-lane sidecar marker: one fixed
# `spawned=<epoch>` line so a later sweep can detect a stuck lane.
assert_lane_file_fresh "conflict-lane writes the .conflict-lane sidecar marker" \
  "$MAIN_WT/.claude/worktrees/tactic-c.conflict-lane"

# A successful kick must also CLEAR a strike file left by earlier failed kicks:
# the backstop's counter means "consecutive failures to launch the lane", which
# is what its hold reason asserts.
printf '%s\n' "3" > "$MAIN_WT/.claude/worktrees/tactic-c.conflict-strikes"
printf 'session=headless:c\nissue=tactic-c\ntimestamp=2026-01-01T00:00:00Z\n' > "$RES_DIR/tactic-c"
# Seed a stale .conflict-lane marker from a prior episode — a second kick must
# OVERWRITE it, not append to it.
printf 'spawned=1111111111\nstale-garbage-from-a-prior-episode\n' > "$MAIN_WT/.claude/worktrees/tactic-c.conflict-lane"
PROV_RC=11 run_exec "tactic-c:tactic:qa"
assert_eq "conflict-lane stdout after prior strikes" "conflict-lane tactic-c" "$OUT"
assert_eq "a successful kick resets the strike counter" "gone" \
  "$([ -e "$MAIN_WT/.claude/worktrees/tactic-c.conflict-strikes" ] && echo present || echo gone)"
assert_lane_file_fresh "a second kick overwrites (not appends to) the .conflict-lane marker" \
  "$MAIN_WT/.claude/worktrees/tactic-c.conflict-lane"

# ============================================================================
# Case 5b: the strike-then-hold ladder survives as the BACKSTOP for the case
# where the conflict lane itself cannot be launched. Repeated exit-11 runs whose
# lane spawn fails accumulate strikes (no graph write below the cap), and the
# cap-th such run escalates to hold-node.
# ============================================================================
echo "Case 5b: repeated exit-11 runs with an unlaunchable conflict lane accumulate strikes, cap-th run holds"
rm -f "$MAIN_WT/.claude/worktrees/tactic-acc.conflict-strikes"
touch "$RES_DIR/tactic-acc"
for n in 1 2 3 4; do
  PROV_RC=11 SPAWN_RC=1 run_exec "tactic-acc:tactic:qa"
  assert_eq "accumulate strike $n stdout" "failed tactic-acc spawn-failed (strike $n/5)" "$OUT"
  assert_eq "accumulate strike $n exit 1" "1" "$RC"
  assert_eq "accumulate strike $n no hold-node write" "" "$(cat "$HOLD_LOG")"
  assert_eq "accumulate strike $n no park-node write" "" "$(cat "$PARK_LOG")"
  assert_eq "accumulate strike $n strike file holds $n" "$n" \
    "$(cat "$MAIN_WT/.claude/worktrees/tactic-acc.conflict-strikes")"
  # A failed lane kick leaves the reservation for the sweep, exactly as the
  # exit-0 path's own spawn-failure handling does.
  assert_eq "accumulate strike $n leaves the reservation marker" "present" \
    "$([ -e "$RES_DIR/tactic-acc" ] && echo present || echo gone)"
done
# 5th run: strikes reach the cap -> escalate to hold-node. Pre-seed a
# .conflict-lane marker from an earlier successful (but never-resolved) lane
# kick — the backstop hold success must clear it too, since the launch-failure
# ladder already raised the hold for this node and the marker would only
# produce a second escalation for the same state.
printf 'spawned=1111111111\n' > "$MAIN_WT/.claude/worktrees/tactic-acc.conflict-lane"
PROV_RC=11 SPAWN_RC=1 run_exec "tactic-acc:tactic:qa"
assert_eq "cap-th run stdout" "held tactic-acc" "$OUT"
assert_eq "cap-th run exit 0" "0" "$RC"
# The only spawn attempted on the exit-11 path is the conflict lane itself (it
# failed here) — the node's own phase skill is never launched.
assert_not_contains "cap-th run never launches the phase skill" "/qa-fix" "$(cat "$SPAWN_LOG")"
assert_contains "cap-th run calls hold-node with --kind provision-conflict" \
  "tactic-acc --kind provision-conflict" "$(cat "$HOLD_LOG")"
assert_eq "cap-th run makes no park-node write" "" "$(cat "$PARK_LOG")"
assert_eq "cap-th run clears the strike sidecar" "gone" \
  "$([ -e "$MAIN_WT/.claude/worktrees/tactic-acc.conflict-strikes" ] && echo present || echo gone)"
assert_eq "cap-th run's backstop hold success clears the .conflict-lane marker" "gone" \
  "$([ -e "$MAIN_WT/.claude/worktrees/tactic-acc.conflict-lane" ] && echo present || echo gone)"

# ============================================================================
# Case 5c: exit 0 (successful provision) clears the strike sidecar file
# ============================================================================
echo "Case 5c: exit 0 clears any accumulated strike sidecar"
printf '%s\n' "3" > "$MAIN_WT/.claude/worktrees/tactic-clr.conflict-strikes"
# A successful provision means any prior merge-conflict retry state
# self-resolved — pre-seed a .conflict-lane marker from an earlier episode too.
printf 'spawned=1111111111\n' > "$MAIN_WT/.claude/worktrees/tactic-clr.conflict-lane"
run_exec "tactic-clr:tactic:implement"
assert_eq "exit-0 clears sidecar" "gone" \
  "$([ -e "$MAIN_WT/.claude/worktrees/tactic-clr.conflict-strikes" ] && echo present || echo gone)"
assert_eq "exit-0 clears the .conflict-lane marker" "gone" \
  "$([ -e "$MAIN_WT/.claude/worktrees/tactic-clr.conflict-lane" ] && echo present || echo gone)"

# ============================================================================
# Case 6: provision exit 12 -> skipped, reservation cleared, no spawn
# ============================================================================
echo "Case 6: provision exit 12 -> skipped, reservation cleared"
touch "$RES_DIR/tactic-s"
PROV_RC=12 run_exec "tactic-s:tactic:qa"
assert_eq "stale stdout" "skipped tactic-s" "$OUT"
assert_eq "stale exit 0" "0" "$RC"
assert_eq "stale spawns nothing" "" "$(cat "$SPAWN_LOG")"
assert_eq "stale clears the reservation marker" "gone" \
  "$([ -e "$RES_DIR/tactic-s" ] && echo present || echo gone)"

# ============================================================================
# Case 7: provision exit 13 -> scope-stale, demote called, no spawn
# ============================================================================
echo "Case 7: provision exit 13 -> scope-stale via demote, no spawn"
touch "$RES_DIR/tactic-d"
PROV_RC=13 run_exec "tactic-d:tactic:qa"
assert_eq "scope-stale stdout" "scope-stale tactic-d" "$OUT"
assert_eq "scope-stale exit 0" "0" "$RC"
assert_eq "scope-stale spawns nothing" "" "$(cat "$SPAWN_LOG")"
assert_contains "scope-stale demotes the node" "tactic-d" "$(cat "$DEMOTE_LOG")"
assert_eq "scope-stale clears the reservation marker" "gone" \
  "$([ -e "$RES_DIR/tactic-d" ] && echo present || echo gone)"

# ============================================================================
# Case 8: provision exit 2 (or other) -> parked, no spawn
# ============================================================================
echo "Case 8: provision exit 2 -> parked via park-node, no spawn"
PROV_RC=2 run_exec "tactic-e:tactic:qa"
assert_eq "prov-error stdout" "parked tactic-e" "$OUT"
assert_eq "prov-error exit 0" "0" "$RC"
assert_eq "prov-error spawns nothing" "" "$(cat "$SPAWN_LOG")"
assert_contains "prov-error parks the node" "tactic-e" "$(cat "$PARK_LOG")"

# ============================================================================
# Case 8b: provision exit 14 -> a worktree-residue tracked hold, born on the
# FIRST occurrence. No strike ladder, no conflict-lane spawn, no park-node
# write — the residue is not a content conflict and the source's own
# office_hours is never written by this producer.
# ============================================================================
echo "Case 8b: provision exit 14 -> held via a worktree-residue hold, first occurrence"
# Exit 14 must not acquire .conflict-lane marker semantics it does not own —
# pre-seed one and assert it is untouched (still present, unchanged content)
# after the run.
printf 'spawned=1111111111\n' > "$MAIN_WT/.claude/worktrees/tactic-res.conflict-lane"
PROV_RC=14 run_exec "tactic-res:tactic:qa"
HOLD=$(cat "$HOLD_LOG")
assert_eq "residue stdout" "held tactic-res worktree-residue" "$OUT"
assert_eq "residue exit 0" "0" "$RC"
assert_eq "residue spawns nothing" "" "$(cat "$SPAWN_LOG")"
assert_eq "residue makes no park-node write" "" "$(cat "$PARK_LOG")"
assert_contains "residue calls hold-node with --kind worktree-residue" \
  "tactic-res --kind worktree-residue" "$HOLD"
assert_eq "exit 14 leaves the .conflict-lane marker untouched" "spawned=1111111111" \
  "$(cat "$MAIN_WT/.claude/worktrees/tactic-res.conflict-lane")"

# ============================================================================
# Case 8c: exit 14 where hold-node itself fails -> failed, exit 1
# ============================================================================
echo "Case 8c: provision exit 14 with a failing hold-node -> failed, exit 1"
PROV_RC=14 HOLD_RC=1 run_exec "tactic-resf:tactic:qa"
assert_eq "residue hold-fail stdout" "failed tactic-resf hold-failed" "$OUT"
assert_eq "residue hold-fail exit 1" "1" "$RC"

# ============================================================================
# Case 9: a failed spawn kick -> failed, exit 1
# ============================================================================
echo "Case 9: spawn kick failure -> failed, exit 1"
printf 'session=headless:k\nissue=tactic-k\ntimestamp=2026-01-01T00:00:00Z\n' > "$RES_DIR/tactic-k"
SPAWN_RC=1 run_exec "tactic-k:tactic:implement"
assert_eq "kick-fail stdout" "failed tactic-k spawn-failed" "$OUT"
assert_eq "kick-fail exit 1" "1" "$RC"
# A failed kick leaves the selection claim for the sweep — it does NOT stamp a
# spawn handoff, since no worker session was actually launched.
assert_eq "kick-fail leaves the reservation marker" "present" \
  "$([ -e "$RES_DIR/tactic-k" ] && echo present || echo gone)"
assert_not_contains "kick-fail marker is not stamped origin=spawned" "origin=spawned" \
  "$(cat "$RES_DIR/tactic-k")"

# ============================================================================
# Case 10: hold-node failure once the conflict strike cap is exceeded ->
# failed, exit 1
# ============================================================================
echo "Case 10: hold-node failure at the strike cap -> failed, exit 1"
rm -f "$MAIN_WT/.claude/worktrees/tactic-p.conflict-strikes"
printf '%s\n' "4" > "$MAIN_WT/.claude/worktrees/tactic-p.conflict-strikes"
# SPAWN_RC=1 puts the run on the backstop path: the conflict lane cannot be
# launched, so the strike ladder runs and this run hits the cap.
PROV_RC=11 SPAWN_RC=1 HOLD_RC=1 run_exec "tactic-p:tactic:qa"
assert_eq "hold-fail stdout" "failed tactic-p hold-failed" "$OUT"
assert_eq "hold-fail exit 1" "1" "$RC"

# ============================================================================
# Case 11: malformed spec -> failed, exit 1
# ============================================================================
echo "Case 11: malformed spec -> failed, exit 1"
run_exec "no-colons-here"
assert_eq "malformed stdout" "failed no-colons-here malformed-spec" "$OUT"
assert_eq "malformed exit 1" "1" "$RC"

# ============================================================================
# Case 12: invalid node id -> failed, exit 1
# ============================================================================
echo "Case 12: invalid node id -> failed, exit 1"
run_exec "Bad_Id:tactic:qa"
assert_eq "invalid-id stdout" "failed Bad_Id invalid-node-id" "$OUT"
assert_eq "invalid-id exit 1" "1" "$RC"

# ============================================================================
# Case 13: unmapped kind:phase -> failed, exit 1
# ============================================================================
echo "Case 13: unmapped kind:phase -> failed, exit 1"
run_exec "tactic-u:tactic:bogus"
assert_eq "unmapped stdout" "failed tactic-u unmapped-kind-phase:tactic:bogus" "$OUT"
assert_eq "unmapped exit 1" "1" "$RC"

# ============================================================================
# Case 15: no reservation marker present at spawn time -> a successful kick
# still creates one, stamped origin=spawned. This covers a spawn racing ahead
# of (or outliving) whatever wrote the original selection-time marker.
# ============================================================================
echo "Case 15: a successful kick creates a marker even if none existed at spawn time"
rm -f "$RES_DIR/tactic-nomark"
run_exec "tactic-nomark:tactic:implement"
assert_eq "no-prior-marker stdout" "launched tactic-nomark /implement" "$OUT"
assert_eq "no-prior-marker exit 0" "0" "$RC"
assert_eq "no-prior-marker creates the reservation marker" "present" \
  "$([ -e "$RES_DIR/tactic-nomark" ] && echo present || echo gone)"
assert_contains "no-prior-marker is stamped origin=spawned" "origin=spawned" \
  "$(cat "$RES_DIR/tactic-nomark")"
assert_contains "no-prior-marker has a non-empty session= line" "session=" \
  "$(cat "$RES_DIR/tactic-nomark")"

# ============================================================================
# Case 16: provision exit 15 -> refused unknown-freshness, reservation cleared,
# no spawn, no park/hold/demote (an environment condition, not a node defect —
# mirrors Case 6's exit-12 assertions).
# ============================================================================
echo "Case 16: provision exit 15 -> refused unknown-freshness, reservation cleared"
touch "$RES_DIR/tactic-uf"
PROV_RC=15 run_exec "tactic-uf:tactic:qa"
assert_eq "unknown-freshness stdout" "refused tactic-uf unknown-freshness" "$OUT"
assert_eq "unknown-freshness exit 0" "0" "$RC"
assert_eq "unknown-freshness spawns nothing" "" "$(cat "$SPAWN_LOG")"
assert_eq "unknown-freshness makes no park-node write" "" "$(cat "$PARK_LOG")"
assert_eq "unknown-freshness makes no hold-node write" "" "$(cat "$HOLD_LOG")"
assert_eq "unknown-freshness makes no demote write" "" "$(cat "$DEMOTE_LOG")"
assert_eq "unknown-freshness clears the reservation marker" "gone" \
  "$([ -e "$RES_DIR/tactic-uf" ] && echo present || echo gone)"

# ============================================================================
# Case 14: usage error (no args) -> exit 2
# ============================================================================
echo "Case 14: no args -> exit 2"
set +e
( export DISPATCH_GRAPH_MAIN_WORKTREE="$MAIN_WT"; "$SUT_DIR/dispatch-graph-execute" >/dev/null 2>&1 )
NOARG_RC=$?
set -e
assert_eq "no args -> exit 2" "2" "$NOARG_RC"

report_results
