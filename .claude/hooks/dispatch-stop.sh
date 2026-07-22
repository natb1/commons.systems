#!/usr/bin/env bash
# dispatch-stop: graph-native node-worker Stop-hook — escalation-park backstop.
#
# Wired to the Stop event. The harness fires Stop unconditionally at session end,
# regardless of the model's last visible action, so this hook is where a node
# worker's escalation park is guaranteed to land even if the model's in-session
# park write did not complete.
#
# tactic-dispatch-legacy-rewire (Unit 3): the LEGACY `<N>-<slug>` issue-worker
# disposition (Branches A–D: the phase-completed marker read, the dispatch-phase
# CURRENT_PHASE derivation, the dispatch:office-hours label parks via
# dispatch-apply-office-hours, the phase-advance self-close, and the Stop-hook
# tick-spawn) was DELETED here. Those paths were reachable only for a legacy issue
# worker (`<N>-` name), spawned by dispatch-materialize-spawn → dispatch-launch-worker
# — both deleted with the legacy gh-issue lane. No legacy issue workers exist
# anymore, so that whole branch was dead code.
#
# What remains is the graph lane's ONLY Stop-hook duty: the escalation-park
# backstop for a graph-native node worker. A node worker's clean phase completion /
# advance is the worker's OWN transition-node write (a state-only commit on
# origin/main), NOT this hook, so a clean completion needs nothing here. Chain
# continuation is carried by the systemd heartbeat and the convergence reseed
# dispatch-tick arms on a graph execute — NOT by a Stop-hook tick-spawn. This hook
# only guarantees the park: if the escalating session left an office-hours-reason
# marker, park the node via the graph write (park-node → office_hours), never a gh
# label.
#
# Best-effort by contract: every failure logs to stderr and the hook exits 0 — it
# must never block session teardown.
set -uo pipefail
trap 'echo "[dispatch-stop] WARNING: unexpected error on line $LINENO" >&2; exit 0' ERR

# Discriminator 1: managed background job.
if [ -z "${CLAUDE_JOB_DIR:-}" ]; then
  exit 0
fi

STATE_FILE="$CLAUDE_JOB_DIR/state.json"
if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

# Discriminator 2: this job is a graph-native node worker — its name IS the
# intention node id and `intentions/<id>.md` exists at this worktree's root.
# Anything else — a `dispatch-<short-id>` router, or a stray non-node name — has
# no duty here and exits 0. (Legacy `<N>-<slug>` issue workers no longer exist;
# see the header note.)
JOB_NAME=$(jq -r '.name // empty' "$STATE_FILE" 2>/dev/null) || JOB_NAME=""
_HOOK_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." 2>/dev/null && pwd)" || _HOOK_ROOT=""
if [[ -n "$JOB_NAME" && -n "$_HOOK_ROOT" && -f "$_HOOK_ROOT/intentions/$JOB_NAME.md" ]]; then
  _OH_REASON_FILE="$CLAUDE_JOB_DIR/office-hours-reason"
  if [ -s "$_OH_REASON_FILE" ]; then
    _OH_REASON="$(cat "$_OH_REASON_FILE" 2>/dev/null || true)"
    _OH_RECO=""
    if [ -s "$CLAUDE_JOB_DIR/office-hours-recommendation" ]; then
      _OH_RECO="$(cat "$CLAUDE_JOB_DIR/office-hours-recommendation" 2>/dev/null || true)"
    fi
    _PARK="$_HOOK_ROOT/packages/intentionsutil/scripts/park-node"
    if [ -n "$_OH_REASON" ] && [ -x "$_PARK" ]; then
      # Backstop park via the graph-commit primitive. Best-effort: a failure
      # (e.g. graph-commit's PR-branch fast-path guard — the worker's own
      # in-session park applies the reset-dance; this backstop does not) is
      # non-fatal, matching this hook's best-effort philosophy.
      if [ -n "$_OH_RECO" ]; then
        if "$_PARK" "$JOB_NAME" "$_OH_REASON" "$_OH_RECO" >/dev/null 2>&1; then
          rm -f "$_OH_REASON_FILE" "$CLAUDE_JOB_DIR/office-hours-recommendation"
        else
          echo "[dispatch-stop] WARNING: park-node for '$JOB_NAME' failed (non-fatal)" >&2
        fi
      else
        if "$_PARK" "$JOB_NAME" "$_OH_REASON" >/dev/null 2>&1; then
          rm -f "$_OH_REASON_FILE"
        else
          echo "[dispatch-stop] WARNING: park-node for '$JOB_NAME' failed (non-fatal)" >&2
        fi
      fi
    fi
  fi

  _SELF_CLOSE="$_HOOK_ROOT/.claude/skills/dispatch-propagate/scripts/dispatch-self-close"
  if [ -x "$_SELF_CLOSE" ]; then
    # Reap this node worker's job entry from `claude agents --json` on every
    # terminal exit -- clean and parked alike. Runs AFTER the park backstop above
    # so a durable office_hours write lands before the session disappears.
    # dispatch-self-close is CLAUDE_JOB_DIR-gated and a no-op for interactive
    # sessions; node-worker names never match `dispatch-*`, so it self-closes
    # unconditionally here (its router continuation-invariant branch never
    # triggers for this caller).
    "$_SELF_CLOSE" >/dev/null 2>&1 \
      || echo "[dispatch-stop] WARNING: dispatch-self-close for '$JOB_NAME' failed (non-fatal)" >&2
  fi
fi

# Routers and non-node jobs: nothing more for this hook.
exit 0
