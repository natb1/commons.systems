#!/usr/bin/env bash
# Create a new PR comment from output file (and optional eval file).
# Usage: post-pr-comment.sh <pr-number> <output-file> [<eval-file>]
# Prints the new comment ID to stdout. Exits non-zero on any error.
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

# Restrict file paths to the repo's tmp/ directory to prevent accidental
# posting of arbitrary file contents as PR comments.
if ! command -v realpath &>/dev/null; then
  echo "error: realpath is required but not found in PATH" >&2
  exit 1
fi
_ALLOWED="${POST_PR_ALLOWED_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)/tmp}"
_ALLOWED=$(realpath "$_ALLOWED" 2>/dev/null) || _ALLOWED=""
if [ -n "${_ALLOWED}" ]; then
  _REAL_OUT=$(realpath "$OUTPUT_FILE")
  if [[ "${_REAL_OUT}" != "${_ALLOWED}"/* ]]; then
    echo "error: output file must be within ${_ALLOWED}: ${OUTPUT_FILE}" >&2
    exit 1
  fi
  if [ -n "$EVAL_FILE" ]; then
    _REAL_EVAL=$(realpath "$EVAL_FILE")
    if [[ "${_REAL_EVAL}" != "${_ALLOWED}"/* ]]; then
      echo "error: eval file must be within ${_ALLOWED}: ${EVAL_FILE}" >&2
      exit 1
    fi
  fi
fi

if ! REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null); then
  echo "error: could not determine repository name (gh repo view failed)" >&2
  exit 1
fi
if [ -z "$REPO" ]; then
  echo "error: gh repo view returned empty repository name" >&2
  exit 1
fi
if ! [[ "$REPO" =~ ^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$ ]]; then
  echo "error: unexpected repository name format: '${REPO}'" >&2
  exit 1
fi
GH_ERR_FILE=""
TMPFILE=""
trap '[ -n "${GH_ERR_FILE}" ] && rm -f "${GH_ERR_FILE}"; [ -n "${TMPFILE}" ] && rm -f "${TMPFILE}"' EXIT
GH_ERR_FILE=$(mktemp) || { echo "error: could not create temporary file" >&2; exit 1; }

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
