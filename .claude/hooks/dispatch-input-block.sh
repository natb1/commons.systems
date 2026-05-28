#!/usr/bin/env bash
# dispatch-input-block: dispatch-session input-block handler.
#
# Wired to three harness events through which a session can block on user
# input:
#   PreToolUse  matching ExitPlanMode and AskUserQuestion
#   Notification with notification_type "permission_prompt"
#   Elicitation
#
# Fires only for a dispatch-* background job. On fire:
#   1. resolves the issue number from the current branch name
#      (the <N>-* prefix idiom restore-dispatch-skill.sh already uses);
#   2. resolves a PR (via dispatch-find-pr) or falls back to the issue;
#   3. applies dispatch:office-hours, creating the label on first use with the
#      canonical color/description (this script is the single source of those
#      defaults);
#   4. spawns the next /dispatch via dispatch-spawn-router, so the chain keeps moving
#      around the blocked item.
#
# Never blocks the session — every failure logs to stderr and the script exits
# 0. The blocked session stays parked; the dispatch:office-hours label is the
# durable record so the office-hours queue survives the session ending.
#
# Discriminator: this is a hook on a generic harness event. We only act when:
#   - CLAUDE_JOB_DIR is set (so this is a managed background job), AND
#   - the recorded --name in $CLAUDE_JOB_DIR/state.json starts with "dispatch-".
# That precisely targets a dispatch-* job. Interactive user sessions running
# /dispatch (no CLAUDE_JOB_DIR) and other background jobs are excluded.
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

# Discriminator 2: this job is a dispatch-* job.
JOB_NAME=$(jq -r '.name // empty' "$STATE_FILE" 2>/dev/null) || JOB_NAME=""
case "$JOB_NAME" in
  dispatch-*) ;;
  *) exit 0 ;;
esac

# Consume the payload (defensive — some events pass JSON on stdin). Only
# dispatch-* jobs reach this point; we read so the Notification filter below
# can act. Read with a timeout so a wired event without stdin doesn't hang.
PAYLOAD=""
if read -t 1 -d '' PAYLOAD; then :; fi

# Notification self-filter: only act on permission_prompt notifications.
# Other notification_type values (e.g. session_complete) reach this hook and
# must pass through silently. Empty payload (other events) skips the filter.
if [ -n "$PAYLOAD" ]; then
  NOTIFICATION_TYPE=$(printf '%s' "$PAYLOAD" | jq -r '.notification_type // empty' 2>/dev/null) || NOTIFICATION_TYPE=""
  if [ -n "$NOTIFICATION_TYPE" ] && [ "$NOTIFICATION_TYPE" != "permission_prompt" ]; then
    exit 0
  fi
fi

# Resolve issue number from the current branch (<N>-<slug>).
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0
ISSUE_NUM=$(printf '%s\n' "$BRANCH" | grep -oE '^[0-9]+') || exit 0
[ -n "$ISSUE_NUM" ] || exit 0

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" || exit 0
SCRIPTS="$SCRIPT_DIR/../skills/dispatch-propagate/scripts"

# Resolve PR for this issue; fall back to the issue itself when no PR exists
# (the implement phase has no PR yet).
PR_NUM=$("$SCRIPTS/dispatch-find-pr" "$ISSUE_NUM" 2>/dev/null) || PR_NUM=""

apply_label() {
  if [ -n "$PR_NUM" ]; then
    gh pr edit "$PR_NUM" --add-label dispatch:office-hours 2>&1
  else
    gh issue edit "$ISSUE_NUM" --add-label dispatch:office-hours 2>&1
  fi
}

# Apply-first / create-on-"not found" idiom (mirrors dispatch-complete-phase).
if apply_output=$(apply_label); then
  :
elif [[ "$apply_output" == *"not found"* ]]; then
  gh label create dispatch:office-hours --color FBCA04 \
    --description "dispatch workflow: blocked on a human — awaiting input or review" \
    >/dev/null 2>&1 \
    || echo "[dispatch-input-block] WARNING: gh label create dispatch:office-hours failed" >&2
  apply_label >/dev/null 2>&1 \
    || echo "[dispatch-input-block] WARNING: gh apply dispatch:office-hours (retry) failed" >&2
else
  echo "[dispatch-input-block] WARNING: gh apply dispatch:office-hours failed: $apply_output" >&2
fi

# Pass the baton so the chain keeps moving. dispatch-spawn-router is dedup-guarded —
# safe whether or not another dispatch-* session is live.
"$SCRIPTS/dispatch-spawn-router" >/dev/null 2>&1 \
  || echo "[dispatch-input-block] WARNING: dispatch-spawn-router failed" >&2

exit 0
