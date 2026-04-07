#!/usr/bin/env bash
set -euo pipefail

# Resolve production URLs for apps changed in a merged PR.
# Uses gh pr diff (works for merged PRs from any branch context) instead of
# git diff, which requires local refs that may not exist post-merge.
#
# Usage: get-pr-prod-urls.sh <pr-number>
# Output: one line per app: <app-name> <production-url>
# Exit 0 with no output if no changed apps have hosting targets.

PR_NUM="${1:?Usage: get-pr-prod-urls.sh <pr-number>}"
[[ "$PR_NUM" =~ ^[1-9][0-9]*$ ]] || { echo "ERROR: PR number must be a positive integer: $PR_NUM" >&2; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT=$(git rev-parse --show-toplevel)

# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

if ! CHANGED=$(gh pr diff "$PR_NUM" --name-only); then
  echo "ERROR: failed to get diff for PR #$PR_NUM" >&2
  exit 1
fi

if [ -z "$CHANGED" ]; then
  exit 0
fi

if ! DIRTY_APPS=$(printf '%s\n' "$CHANGED" | resolve_dirty_apps "$REPO_ROOT"); then
  echo "ERROR: failed to resolve changed apps for PR #$PR_NUM" >&2
  exit 1
fi

if [ -z "$DIRTY_APPS" ]; then
  exit 0
fi

while IFS= read -r app; do
  [ -z "$app" ] && continue
  if SITE=$(get_hosting_site "$REPO_ROOT" "$app"); then
    echo "$app https://${SITE}.web.app"
  fi
done <<< "$DIRTY_APPS" | sort
