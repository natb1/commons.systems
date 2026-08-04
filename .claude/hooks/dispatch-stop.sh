#!/usr/bin/env bash
# dispatch-stop: graph-native node-worker Stop-hook — marker-gated reap delegation.
#
# Wired to the Stop event. The harness fires Stop unconditionally at session end,
# regardless of the model's last visible action.
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
# tactic-phase-terminal-requires-disposition (Unit 4): the escalation-park
# backstop that used to live here — reading office-hours-reason/-recommendation/-pr
# and calling park-node — was DELETED, not repaired. Measured on 2026-07-31: 0
# successes in 5 attempts here, versus 4/4 for in-session `park-node` calls the
# same day. Root causes: (1) this hook ran `park-node` from the worker's own
# PR-branch worktree, which graph-commit's `ensure_intentions_only_base()`
# rejects as a base — the hook has no way to run from the main checkout; (2) a
# teardown hook has no budget for graph-commit's ~1050s landing-lock wait; (3)
# the failure path was swallowed three times over (best-effort `>/dev/null 2>&1`,
# the outer ERR trap, and the ambient ERR trap on the ordinary ERR path) so a
# stuck park never surfaced. The replacement is `dispatch-tick`'s
# `terminal_without_disposition_sweep` (in
# `.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh`), a
# per-tick sweep that detects a worker session that ended in a terminal daemon
# state without a landed office_hours park and parks it, reading the same
# office-hours-reason/-recommendation/-pr markers from the job dir. It runs from
# the tick's main checkout, so the graph-commit repo-root invariant holds, and it
# retries on the next tick if a landing-lock wait is in progress. The escalation
# seam itself — skills writing those marker files via `dispatch-mark-deviation`
# — is unchanged; only who reads them moved.
#
# What remains is the graph lane's ONLY Stop-hook duty: the marker-gated reap
# delegation to `dispatch-self-close` for a graph-native node worker. A node
# worker's clean phase completion / advance is the worker's OWN transition-node
# write (a state-only commit on origin/main), NOT this hook, so a clean
# completion needs nothing here. Chain continuation is carried by the systemd
# heartbeat and the convergence reseed dispatch-tick arms on a graph execute —
# NOT by a Stop-hook tick-spawn.
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
  _SELF_CLOSE="$_HOOK_ROOT/.claude/skills/dispatch-propagate/scripts/dispatch-self-close"
  if [ -x "$_SELF_CLOSE" ]; then
    # Reap this node worker's job entry from `claude agents --json` -- but only
    # on a TERMINAL exit, clean or parked. `--node "$JOB_NAME"` opts into
    # dispatch-self-close's node-worker terminal-disposition branch, which reaps
    # only when a `node-terminal` marker names this node and otherwise HOLDS the
    # job alive. A hold is an expected outcome, not an error: it is exactly what
    # a mid-turn yield (subagents still running) must produce. This is the only
    # work left in this hook -- no backstop park precedes it (see header note).
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
