#!/usr/bin/env bash
# dispatch-input-block: worker input-block handler.
#
# Wired to three harness events through which a session can block on user
# input:
#   PreToolUse  matching ExitPlanMode and AskUserQuestion
#   Notification with notification_type "permission_prompt"
#   Elicitation
#
# Fires only for a worker or parse-job session (name matches ^[0-9]+-). On
# fire:
#   1. resolves the issue number from the job name's <N>- prefix
#      (${JOB_NAME%%-*}, mirroring dispatch-stop.sh);
#   2. parks the ISSUE on a human via dispatch-apply-office-hours — the single
#      write path for dispatch:office-hours. It applies the label to the issue
#      (never a PR), creates the label on first use, and posts a why-comment;
#   3. spawns the next headless dispatch-tick via dispatch-spawn-tick, so the
#      chain keeps moving around the blocked item.
#
# Never blocks the session — every failure logs to stderr and the script exits
# 0. The blocked session stays parked; the dispatch:office-hours label is the
# durable record so the office-hours queue survives the session ending.
#
# Discriminator: this is a hook on a generic harness event. We only act when:
#   - CLAUDE_JOB_DIR is set (so this is a managed background job), AND
#   - the recorded --name in $CLAUDE_JOB_DIR/state.json matches ^[0-9]+-
#     (phase workers and parse-job sessions, both <N>-slug).
# office-hours-<N> sessions are EXCLUDED by design — they have no leading
# digit, so the regex does not match, and they legitimately block on input
# and must not be parked. Interactive user sessions (no CLAUDE_JOB_DIR) are
# also excluded.
set -uo pipefail
trap 'echo "[dispatch-input-block] WARNING: unexpected error on line $LINENO" >&2; exit 0' ERR

# Discriminator 1: managed background job.
if [ -z "${CLAUDE_JOB_DIR:-}" ]; then
  exit 0
fi

STATE_FILE="$CLAUDE_JOB_DIR/state.json"
if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

# Discriminator 2: this job is a worker (name starts with <N>-). Phase workers
# and parse-job sessions are named <N>-slug; office-hours sessions are named
# office-hours-<N> (no leading digit) and are excluded by design — they
# legitimately block on input and must not be parked.
JOB_NAME=$(jq -r '.name // empty' "$STATE_FILE" 2>/dev/null) || JOB_NAME=""
if ! [[ "$JOB_NAME" =~ ^[0-9]+- ]]; then
  exit 0
fi

# Consume any buffered single-line JSON payload fast. Short timeout so an
# open, idle stdin (hook events never close stdin at EOF) returns quickly
# rather than stalling for a full second. -r keeps backslashes in JSON intact
# so the downstream jq parse cannot be corrupted.
PAYLOAD=""
if read -rt 0.1 PAYLOAD; then :; fi

# Notification self-filter: only act on permission_prompt notifications.
# Other notification_type values (e.g. session_complete) reach this hook and
# must pass through silently. Empty payload (other events) skips the filter.
if [ -n "$PAYLOAD" ]; then
  NOTIFICATION_TYPE=$(printf '%s' "$PAYLOAD" | jq -r '.notification_type // empty' 2>/dev/null) || NOTIFICATION_TYPE=""
  if [ -n "$NOTIFICATION_TYPE" ] && [ "$NOTIFICATION_TYPE" != "permission_prompt" ]; then
    exit 0
  fi
fi

# Resolve issue number from the validated JOB_NAME (<N>-<slug>). Discriminator 2
# guarantees JOB_NAME matches ^[0-9]+-, so the numeric prefix is non-empty.
ISSUE_NUM="${JOB_NAME%%-*}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" || exit 0
SCRIPTS="$SCRIPT_DIR/../skills/dispatch-propagate/scripts"

# Park the issue on a human via the single write path. This hook fires on four
# event kinds (ExitPlanMode / AskUserQuestion / permission_prompt / elicitation)
# and does not branch on which fired, so one static reason naming all four is
# correct. dispatch-apply-office-hours owns the issue target, create-on-first-use,
# idempotency, and the why-comment.
"$SCRIPTS/dispatch-apply-office-hours" "$ISSUE_NUM" "blocked on user input (ExitPlanMode / AskUserQuestion / permission prompt / elicitation)" \
  || echo "[dispatch-input-block] WARNING: dispatch-apply-office-hours failed" >&2

# Pass the baton so the chain keeps moving. dispatch-spawn-tick is dedup-guarded
# (the fixed systemd unit name collides while a tick is in flight) — safe whether
# or not another tick is live.
"$SCRIPTS/dispatch-spawn-tick" >/dev/null 2>&1 \
  || echo "[dispatch-input-block] WARNING: dispatch-spawn-tick failed" >&2

exit 0
