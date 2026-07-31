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
# label. When the session also left an office-hours-pr marker, that PR number is
# threaded through to park-node's own --pr flag so the park records
# execution.pr (tactic-office-hours-pr-custody) — still gh-free: this hook only
# reads a file the session already wrote, no network call. When the session also
# left an office-hours-base marker (a 40-hex blob sha of the node at origin/main,
# read at the session's DIAGNOSIS time), it is threaded through to park-node's
# own --base flag so the park is a compare-and-swap: it lands only against the
# state the session actually diagnosed, and otherwise refuses with exit 3
# (`stale-diagnosis`) having written nothing, rather than silently reverting a
# newer transition that landed while the session was still verifying
# (tactic-qa-main-park-base-cas; incident 2026-07-28). The marker is OPT-IN: its
# absence keeps today's unpinned park.
#
# CRITICAL: `Stop` fires whenever the model YIELDS THE TURN, not only on terminal
# exit. A worker that launches background subagents, posts an interim message and
# waits fires this hook with its work still in flight (incident 2026-07-28: node
# tactic-graph-ref-split, session 36e64744 — reaped mid-turn, a live subagent
# killed ~1.7s later, the node left neither advanced nor parked). So the reap is
# NOT decided here: this hook passes `--node "$JOB_NAME"` and dispatch-self-close
# gates on a `node-terminal` marker naming that node, written by the terminal
# primitives (transition-node, park-node, /fix-checks, /align-tactics). No marker
# → the job is held alive, visible and resumable.
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
    _OH_PR=""
    if [ -s "$CLAUDE_JOB_DIR/office-hours-pr" ]; then
      _OH_PR_RAW="$(cat "$CLAUDE_JOB_DIR/office-hours-pr" 2>/dev/null || true)"
      if [[ "$_OH_PR_RAW" =~ ^[0-9]+$ ]]; then
        _OH_PR="$_OH_PR_RAW"
      fi
    fi
    # Diagnosis-time compare-and-swap pin. OPT-IN by design: absence of this
    # marker keeps today's unpinned park — fix-checks, review-fix, qa-fix and
    # dispatch-conflict do not write it yet, and a fail-closed hook would break
    # every park they make. A malformed value is ignored (degrades to unpinned)
    # rather than passed through, which park-node would reject as a usage error.
    _OH_BASE=""
    if [ -s "$CLAUDE_JOB_DIR/office-hours-base" ]; then
      _OH_BASE_RAW="$(cat "$CLAUDE_JOB_DIR/office-hours-base" 2>/dev/null || true)"
      if [[ "$_OH_BASE_RAW" =~ ^[0-9a-f]{40}$ ]]; then
        _OH_BASE="$_OH_BASE_RAW"
      fi
    fi
    _PARK="$_HOOK_ROOT/packages/intentionsutil/scripts/park-node"
    if [ -n "$_OH_REASON" ] && [ -x "$_PARK" ]; then
      # Backstop park via the graph-commit primitive. Best-effort: a failure
      # (e.g. graph-commit's PR-branch fast-path guard — the worker's own
      # in-session park applies the reset-dance; this backstop does not) is
      # non-fatal, matching this hook's best-effort philosophy.
      # park-node's parser is leading-flags-only — it stops scanning at the
      # first non-flag argument — so every flag must precede the node id.
      _PARK_ARGS=()
      if [ -n "$_OH_BASE" ]; then
        _PARK_ARGS+=("--base" "$_OH_BASE")
      fi
      if [ -n "$_OH_PR" ]; then
        _PARK_ARGS+=("--pr" "$_OH_PR")
      fi
      _PARK_ARGS+=("$JOB_NAME" "$_OH_REASON")
      if [ -n "$_OH_RECO" ]; then
        _PARK_ARGS+=("$_OH_RECO")
      fi
      # stdout is silenced, but stderr is CAPTURED (not swallowed) so park-node's
      # own diagnostic — notably the `stale-diagnosis` marker on exit 3 — can be
      # surfaced on this hook's stderr below.
      _PARK_ERR=""
      _PARK_RC=0
      _PARK_ERR="$("$_PARK" "${_PARK_ARGS[@]}" 2>&1 >/dev/null)" || _PARK_RC=$?
      if [ "$_PARK_RC" -eq 0 ]; then
        rm -f "$_OH_REASON_FILE" "$CLAUDE_JOB_DIR/office-hours-recommendation" \
          "$CLAUDE_JOB_DIR/office-hours-pr" "$CLAUDE_JOB_DIR/office-hours-base"
      elif [ "$_PARK_RC" -eq 3 ]; then
        # stale-diagnosis: the node changed on origin/main between the session's
        # diagnosis-time read and this park, so park-node REFUSED and wrote
        # nothing. The newer landed state stands. Markers are deliberately NOT
        # consumed and the park is NOT retried (and never re-run unpinned) — the
        # next run against the node's current state is the re-diagnosis.
        echo "[dispatch-stop] WARNING: park-node for '$JOB_NAME' refused with stale-diagnosis (exit 3): the node changed on origin/main since this session read it; nothing was written, markers left in place (non-fatal)" >&2
        if [ -n "$_PARK_ERR" ]; then
          echo "[dispatch-stop] park-node stderr: $_PARK_ERR" >&2
        fi
      else
        echo "[dispatch-stop] WARNING: park-node for '$JOB_NAME' failed (non-fatal)" >&2
        if [ -n "$_PARK_ERR" ]; then
          echo "[dispatch-stop] park-node stderr: $_PARK_ERR" >&2
        fi
      fi
    fi
  fi

  _SELF_CLOSE="$_HOOK_ROOT/.claude/skills/dispatch-propagate/scripts/dispatch-self-close"
  if [ -x "$_SELF_CLOSE" ]; then
    # Reap this node worker's job entry from `claude agents --json` -- but only
    # on a TERMINAL exit, clean or parked. `--node "$JOB_NAME"` opts into
    # dispatch-self-close's node-worker terminal-disposition branch, which reaps
    # only when a `node-terminal` marker names this node and otherwise HOLDS the
    # job alive. A hold is an expected outcome, not an error: it is exactly what
    # a mid-turn yield (subagents still running) must produce. Runs AFTER the
    # park backstop above so a durable office_hours write -- and park-node's own
    # marker -- lands before the reap decision is made.
    # dispatch-self-close is CLAUDE_JOB_DIR-gated and a no-op for interactive
    # sessions. stderr is NOT redirected: the one-line HOLD reason is the canary
    # for a terminal lane that failed to declare, and swallowing it defeats the
    # design. stdout stays silenced so the duplicate copy does not pollute hook
    # output.
    "$_SELF_CLOSE" --node "$JOB_NAME" >/dev/null \
      || echo "[dispatch-stop] WARNING: dispatch-self-close for '$JOB_NAME' failed (non-fatal)" >&2
  fi
fi

# Routers and non-node jobs: nothing more for this hook.
exit 0
