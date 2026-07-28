#!/usr/bin/env bash
# Tests for dispatch-graph-execute — the graph lane's Shape-B launch primitive.
#
# Verifies the direct-phase-skill launch: for each `<id:kind:phase>` the SUT
# spawns a top-level sonnet orchestrator session that invokes the phase skill
# DIRECTLY (never a runner session that invokes a workflow). Covers the per-phase
# skill map, the strategy/tactic lane split, and every provision-exit disposition
# (0/10/11/12/13/2) — routed here at zero token cost with no `claude` session on
# any non-zero path.
#
# Harness (mirrors test-dispatch-scripts.sh): copy the SUT + its sourced libs
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

run_exec "tactic-m:tactic:main-qa"
SPAWN=$(cat "$SPAWN_LOG")
assert_eq "main-qa stdout" "launched tactic-m /qa-main" "$OUT"
assert_contains "main-qa invokes /qa-main directly" "/qa-main tactic-m" "$SPAWN"
assert_not_contains "main-qa has no --effort (unmapped phase)" "--effort" "$SPAWN"

# ============================================================================
# Case 3: strategy lane — no pre-provision, cwd=project root, /align-tactics
# ============================================================================
echo "Case 3: strategy lane spawns /align-tactics at the project root"
run_exec "strategy-x:strategy:align"
SPAWN=$(cat "$SPAWN_LOG")
assert_eq "strategy stdout" "launched strategy-x /align-tactics" "$OUT"
assert_eq "strategy exit 0" "0" "$RC"
assert_contains "strategy invokes /align-tactics" "/align-tactics strategy-x" "$SPAWN"
assert_contains "strategy cwd is the project root" "--cwd $MAIN_WT" "$SPAWN"
assert_contains "strategy model sonnet" "--model sonnet" "$SPAWN"

# ============================================================================
# Case 4: provision exit 10 -> ci-waiting (no spawn)
# ============================================================================
echo "Case 4: provision exit 10 -> waiting, no spawn"
PROV_RC=10 run_exec "tactic-w:tactic:qa"
assert_eq "waiting stdout" "waiting tactic-w" "$OUT"
assert_eq "waiting exit 0" "0" "$RC"
assert_eq "waiting spawns nothing" "" "$(cat "$SPAWN_LOG")"

# ============================================================================
# Case 5: provision exit 11 below the strike cap -> conflict-retry, no graph
# write at all (neither park-node nor hold-node), no spawn
# ============================================================================
echo "Case 5: provision exit 11 below cap -> conflict-retry, no graph write, no spawn"
rm -f "$MAIN_WT/.claude/worktrees/tactic-c.conflict-strikes"
PROV_RC=11 run_exec "tactic-c:tactic:qa"
assert_eq "conflict-retry stdout" "conflict-retry tactic-c (strike 1/5)" "$OUT"
assert_eq "conflict-retry exit 0" "0" "$RC"
assert_eq "conflict-retry spawns nothing" "" "$(cat "$SPAWN_LOG")"
assert_eq "conflict-retry makes no park-node write" "" "$(cat "$PARK_LOG")"
assert_eq "conflict-retry makes no hold-node write" "" "$(cat "$HOLD_LOG")"
assert_eq "conflict-retry strike file holds 1" "1" \
  "$(cat "$MAIN_WT/.claude/worktrees/tactic-c.conflict-strikes")"

# ============================================================================
# Case 5b: strikes accumulate across repeated exit-11 runs, then the cap-th
# run escalates to hold-node
# ============================================================================
echo "Case 5b: repeated exit-11 runs accumulate strikes, cap-th run holds"
rm -f "$MAIN_WT/.claude/worktrees/tactic-acc.conflict-strikes"
for n in 1 2 3 4; do
  PROV_RC=11 run_exec "tactic-acc:tactic:qa"
  assert_eq "accumulate strike $n stdout" "conflict-retry tactic-acc (strike $n/5)" "$OUT"
  assert_eq "accumulate strike $n exit 0" "0" "$RC"
  assert_eq "accumulate strike $n no hold-node write" "" "$(cat "$HOLD_LOG")"
done
# 5th run: strikes reach the cap -> escalate to hold-node.
PROV_RC=11 run_exec "tactic-acc:tactic:qa"
assert_eq "cap-th run stdout" "held tactic-acc" "$OUT"
assert_eq "cap-th run exit 0" "0" "$RC"
assert_eq "cap-th run spawns nothing" "" "$(cat "$SPAWN_LOG")"
assert_contains "cap-th run calls hold-node with --kind provision-conflict" \
  "tactic-acc --kind provision-conflict" "$(cat "$HOLD_LOG")"
assert_eq "cap-th run makes no park-node write" "" "$(cat "$PARK_LOG")"
assert_eq "cap-th run clears the strike sidecar" "gone" \
  "$([ -e "$MAIN_WT/.claude/worktrees/tactic-acc.conflict-strikes" ] && echo present || echo gone)"

# ============================================================================
# Case 5c: exit 0 (successful provision) clears the strike sidecar file
# ============================================================================
echo "Case 5c: exit 0 clears any accumulated strike sidecar"
printf '%s\n' "3" > "$MAIN_WT/.claude/worktrees/tactic-clr.conflict-strikes"
run_exec "tactic-clr:tactic:implement"
assert_eq "exit-0 clears sidecar" "gone" \
  "$([ -e "$MAIN_WT/.claude/worktrees/tactic-clr.conflict-strikes" ] && echo present || echo gone)"

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
PROV_RC=13 run_exec "tactic-d:tactic:qa"
assert_eq "scope-stale stdout" "scope-stale tactic-d" "$OUT"
assert_eq "scope-stale exit 0" "0" "$RC"
assert_eq "scope-stale spawns nothing" "" "$(cat "$SPAWN_LOG")"
assert_contains "scope-stale demotes the node" "tactic-d" "$(cat "$DEMOTE_LOG")"

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
# Case 9: a failed spawn kick -> failed, exit 1
# ============================================================================
echo "Case 9: spawn kick failure -> failed, exit 1"
SPAWN_RC=1 run_exec "tactic-k:tactic:implement"
assert_eq "kick-fail stdout" "failed tactic-k spawn-failed" "$OUT"
assert_eq "kick-fail exit 1" "1" "$RC"

# ============================================================================
# Case 10: hold-node failure once the conflict strike cap is exceeded ->
# failed, exit 1
# ============================================================================
echo "Case 10: hold-node failure at the strike cap -> failed, exit 1"
rm -f "$MAIN_WT/.claude/worktrees/tactic-p.conflict-strikes"
printf '%s\n' "4" > "$MAIN_WT/.claude/worktrees/tactic-p.conflict-strikes"
PROV_RC=11 HOLD_RC=1 run_exec "tactic-p:tactic:qa"
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
# Case 14: usage error (no args) -> exit 2
# ============================================================================
echo "Case 14: no args -> exit 2"
set +e
( export DISPATCH_GRAPH_MAIN_WORKTREE="$MAIN_WT"; "$SUT_DIR/dispatch-graph-execute" >/dev/null 2>&1 )
NOARG_RC=$?
set -e
assert_eq "no args -> exit 2" "2" "$NOARG_RC"

report_results
