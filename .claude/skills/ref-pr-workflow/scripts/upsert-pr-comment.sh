#!/usr/bin/env bash
# Create or edit a PR comment identified by a header pattern.
# Usage: upsert-pr-comment.sh <pr-number> <header-pattern> <body>
#
# If a comment whose body starts with <header-pattern> exists, it is edited.
# Otherwise a new comment is created.

set -euo pipefail

PR_NUMBER="$1"
HEADER_PATTERN="$2"
BODY="$3"

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

# Find the first comment whose first line contains the header pattern.
# Uses jq to filter in a single API call instead of fetching each comment separately.
COMMENT_ID=$(
  gh api "repos/${REPO}/issues/${PR_NUMBER}/comments" \
    --paginate \
    --jq --arg pattern "$HEADER_PATTERN" '[.[] | select(.body | split("\n")[0] | contains($pattern))][0].id // empty'
)

if [ -n "$COMMENT_ID" ]; then
  gh api "repos/${REPO}/issues/comments/${COMMENT_ID}" \
    --method PATCH \
    --field body="$BODY" \
    --silent
  echo "Updated comment ${COMMENT_ID} on PR #${PR_NUMBER}"
else
  gh pr comment "$PR_NUMBER" --body "$BODY"
  echo "Created new comment on PR #${PR_NUMBER}"
fi
