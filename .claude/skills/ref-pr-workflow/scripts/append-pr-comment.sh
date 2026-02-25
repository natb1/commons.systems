#!/usr/bin/env bash
# Append file content to an existing PR comment.
# Usage: append-pr-comment.sh <comment-id> <file-path>
set -euo pipefail
COMMENT_ID="$1"
FILE_PATH="$2"
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
CURRENT_BODY=$(gh api "repos/${REPO}/issues/comments/${COMMENT_ID}" --jq '.body')
TMPFILE=$(mktemp)
trap 'rm -f "$TMPFILE"' EXIT
printf '%s\n\n---\n\n%s' "$CURRENT_BODY" "$(cat "$FILE_PATH")" > "$TMPFILE"
gh api "repos/${REPO}/issues/comments/${COMMENT_ID}" \
  --method PATCH \
  --field body=@"${TMPFILE}" \
  --silent
