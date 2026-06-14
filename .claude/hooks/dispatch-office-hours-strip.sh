#!/usr/bin/env bash
# dispatch-office-hours-strip: clear dispatch:office-hours when the user
# engages an issue worktree.
#
# Wired to UserPromptSubmit. When the user submits a prompt inside an <N>-*
# worktree, remove dispatch:office-hours from that worktree's PR (or issue if
# no PR exists). A human is now driving the item, so the office-hours marker
# is no longer accurate — clearing it makes the item dispatch-eligible again
# (and stops dispatch-select-target from skipping it).
#
# No discriminator on CLAUDE_JOB_DIR — a human submitting a prompt is the
# engagement signal regardless of session type.
#
# Always exits 0 — must not block prompt submission. gh's --remove-label is
# a no-op when the label is not present, so removing an absent label is fine.
set -uo pipefail
trap 'echo "[dispatch-office-hours-strip] WARNING: unexpected error on line $LINENO" >&2; exit 0' ERR

# Drain the payload fast (UserPromptSubmit delivers JSON on stdin; we read no
# field from it, only drain to avoid an upstream pipe deadlock). Short timeout
# so an open, idle stdin returns in ~0.1s rather than stalling a full second
# on the NUL delimiter.
if read -rt 0.1 _PAYLOAD; then :; fi

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0
ISSUE_NUM=$(printf '%s\n' "$BRANCH" | grep -oE '^[0-9]+') || exit 0
[ -n "$ISSUE_NUM" ] || exit 0

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" || exit 0
SCRIPTS="$SCRIPT_DIR/../skills/dispatch-propagate/scripts"

PR_NUM=$("$SCRIPTS/dispatch-find-pr" "$ISSUE_NUM" 2>/dev/null) || PR_NUM=""

# Strip from both the PR and the issue. The resolution rule guarantees only one
# carries the label at a time, so the call to the unlabeled target is a no-op.
# Stripping from both prevents a stale label when the PR was opened between the
# input-block (which labeled the issue) and the user's engagement (which now
# sees the PR). gh --remove-label is a no-op when the label is absent.
if [ -n "$PR_NUM" ]; then
  gh pr edit "$PR_NUM" --remove-label dispatch:office-hours >/dev/null 2>&1 \
    || echo "[dispatch-office-hours-strip] WARNING: gh pr edit --remove-label failed for PR #$PR_NUM" >&2
fi
gh issue edit "$ISSUE_NUM" --remove-label dispatch:office-hours >/dev/null 2>&1 \
  || echo "[dispatch-office-hours-strip] WARNING: gh issue edit --remove-label failed for issue #$ISSUE_NUM" >&2

exit 0
