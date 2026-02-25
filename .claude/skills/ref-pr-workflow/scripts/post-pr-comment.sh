#!/usr/bin/env bash
# Create a new PR comment from output file (and optional eval file).
# Usage: post-pr-comment.sh <pr-number> <output-file> [<eval-file>]
set -euo pipefail
PR_NUMBER="${1:-}"
OUTPUT_FILE="${2:-}"
EVAL_FILE="${3:-}"

if [ -z "$PR_NUMBER" ] || ! [[ "$PR_NUMBER" =~ ^[0-9]+$ ]]; then
  echo "error: PR_NUMBER must be a positive integer, got: '${PR_NUMBER}'" >&2
  exit 1
fi
if [ ! -f "$OUTPUT_FILE" ]; then
  echo "error: output file not found: ${OUTPUT_FILE}" >&2
  exit 1
fi
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
TMPFILE=$(mktemp)
trap 'rm -f "$TMPFILE"' EXIT
if [ -n "$EVAL_FILE" ]; then
  { cat "$OUTPUT_FILE"; printf '\n\n---\n\n'; cat "$EVAL_FILE"; } > "$TMPFILE"
else
  cp "$OUTPUT_FILE" "$TMPFILE"
fi
gh api "repos/${REPO}/issues/${PR_NUMBER}/comments" \
  --method POST \
  --field body=@"${TMPFILE}" \
  --jq '.id'
