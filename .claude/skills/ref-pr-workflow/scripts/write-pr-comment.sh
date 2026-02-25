#!/usr/bin/env bash
# Create a new PR comment from file, print comment ID to stdout.
# Usage: write-pr-comment.sh <pr-number> <file-path>
set -euo pipefail
PR_NUMBER="$1"
FILE_PATH="$2"
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
gh api "repos/${REPO}/issues/${PR_NUMBER}/comments" \
  --method POST \
  --field body=@"${FILE_PATH}" \
  --jq '.id'
