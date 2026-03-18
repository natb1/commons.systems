#!/usr/bin/env bash
# Concatenate review task outputs into a single file with markdown headers.
# Usage: concat-review-output.sh <output-file> <label1>:<path1> [<label2>:<path2> ...]
# Labels may contain colons (e.g., "pr-review-toolkit: code-reviewer") —
# each argument is split on the LAST colon to separate label from path.
set -euo pipefail

OUTPUT_FILE="${1:-}"

if [ -z "$OUTPUT_FILE" ]; then
  echo "error: usage: concat-review-output.sh <output-file> <label:path> [...]" >&2
  exit 1
fi
shift

if [ $# -lt 1 ]; then
  echo "error: at least one label:path pair is required" >&2
  exit 1
fi

# Restrict output file path to the repo's tmp/ directory.
if ! command -v realpath &>/dev/null; then
  echo "error: realpath is required but not found in PATH" >&2
  exit 1
fi
_ALLOWED="${CONCAT_REVIEW_ALLOWED_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)/tmp}"
# Resolve the parent directory (file may not exist yet) and append the filename.
_OUT_DIR=$(dirname "$OUTPUT_FILE")
_OUT_BASE=$(basename "$OUTPUT_FILE")
_REAL_DIR=$(realpath "$_OUT_DIR" 2>/dev/null) || {
  echo "error: output directory does not exist: $_OUT_DIR" >&2
  exit 1
}
_REAL_OUT="${_REAL_DIR}/${_OUT_BASE}"
if [[ "${_REAL_OUT}" != "${_ALLOWED}"/* ]]; then
  echo "error: output file must be within ${_ALLOWED}: ${OUTPUT_FILE}" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT_FILE")"

FIRST=true
{
  for arg in "$@"; do
    # Split on the last colon to separate label from path.
    label="${arg%:*}"
    path="${arg##*:}"

    if [ "$FIRST" = true ]; then
      printf '## %s\n\n' "$label"
      FIRST=false
    else
      printf '\n\n## %s\n\n' "$label"
    fi

    if [ -z "$path" ] || [ ! -f "$path" ]; then
      echo "Task unavailable"
    else
      cat "$path"
    fi
  done
} > "$OUTPUT_FILE"
