#!/usr/bin/env bash
# Create a new PR comment from output file (and optional eval file).
# Usage: post-pr-comment.sh <pr-number> <output-file> [<eval-file>]
# Prints the new comment ID (integer) to stdout on success.
# Exits non-zero on invalid PR number, missing output/eval file, gh repo detection failure, empty repo result, or failed POST.
set -euo pipefail

PR_NUMBER="${1:-}"
OUTPUT_FILE="${2:-}"
EVAL_FILE="${3:-}"

if [ -z "$PR_NUMBER" ] || ! [[ "$PR_NUMBER" =~ ^[1-9][0-9]*$ ]]; then
  echo "error: PR_NUMBER must be a positive integer, got: '${PR_NUMBER}'" >&2
  exit 1
fi

if [ ! -f "$OUTPUT_FILE" ]; then
  echo "error: output file not found: ${OUTPUT_FILE}" >&2
  exit 1
fi

if [ -n "$EVAL_FILE" ] && [ ! -f "$EVAL_FILE" ]; then
  echo "error: eval file not found: ${EVAL_FILE}" >&2
  exit 1
fi

if ! REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null); then
  echo "error: could not determine repository name (gh repo view failed)" >&2
  exit 1
fi
if [ -z "$REPO" ]; then
  echo "error: gh repo view returned empty repository name" >&2
  exit 1
fi
GH_ERR_FILE=$(mktemp) || { echo "error: could not create temporary file" >&2; exit 1; }
TMPFILE=""
trap 'rm -f "$GH_ERR_FILE" "${TMPFILE}"' EXIT

if [ -n "$EVAL_FILE" ]; then
  TMPFILE=$(mktemp) || { echo "error: could not create temporary file" >&2; exit 1; }
  if ! { cat "$OUTPUT_FILE"; printf '\n\n---\n\n'; cat "$EVAL_FILE"; } > "$TMPFILE"; then
    echo "error: failed to assemble comment body from '${OUTPUT_FILE}' and '${EVAL_FILE}'" >&2; exit 1
  fi
  BODY_FILE="$TMPFILE"
else
  BODY_FILE="$OUTPUT_FILE"
fi
if ! COMMENT_ID=$(gh api "repos/${REPO}/issues/${PR_NUMBER}/comments" \
    --method POST --field body=@"${BODY_FILE}" --jq '.id' 2>"$GH_ERR_FILE"); then
  echo "error: failed to post comment to repos/${REPO}/issues/${PR_NUMBER}/comments: $(cat "$GH_ERR_FILE")" >&2
  exit 1
fi
echo "$COMMENT_ID"
