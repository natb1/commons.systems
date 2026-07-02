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
# Always exits 0 — must not block prompt submission. The REST-backed
# gh_issue_remove_label_rest preserves the porcelain --remove-label contract: a
# no-op when the label is not present (it treats the label-absent 404 as
# success), so removing an absent label is fine.
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
source "$SCRIPTS/lib.sh" || exit 0

PR_NUM=$("$SCRIPTS/dispatch-find-pr" "$ISSUE_NUM" 2>/dev/null) || PR_NUM=""

# Strip from both the PR and the issue. The resolution rule guarantees only one
# carries the label at a time, so the call to the unlabeled target is a no-op.
# Stripping from both prevents a stale label when the PR was opened between the
# input-block (which labeled the issue) and the user's engagement (which now
# sees the PR). gh_issue_remove_label_rest preserves the porcelain no-op-when-
# absent contract (it treats the label-absent 404 as success).
if [ -n "$PR_NUM" ]; then
  gh_issue_remove_label_rest "$PR_NUM" dispatch:office-hours >/dev/null 2>&1 \
    || echo "[dispatch-office-hours-strip] WARNING: gh_issue_remove_label_rest failed for PR #$PR_NUM" >&2
fi
gh_issue_remove_label_rest "$ISSUE_NUM" dispatch:office-hours >/dev/null 2>&1 \
  || echo "[dispatch-office-hours-strip] WARNING: gh_issue_remove_label_rest failed for issue #$ISSUE_NUM" >&2

# Office-hours snapshot: un-park `parked-only` refresh (#2661). Fired
# unconditionally — this hook already runs only inside an <N>-* worktree on user
# engagement; env-gated OFF by default + flock-serialized + best-effort, so a
# redundant refresh is harmless. Preserves the never-block-submission contract.
"$SCRIPTS/office-hours-snapshot-launch" parked-only || true

exit 0
