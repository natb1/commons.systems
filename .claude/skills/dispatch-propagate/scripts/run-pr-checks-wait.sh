#!/usr/bin/env bash
set -euo pipefail

# Wait for all PR checks to complete, then report their status.
# Replaces the single-run `gh run watch` approach to ensure ALL workflows
# (not just the most recent one) are verified.
#
# Usage: run-pr-checks-wait.sh <pr-number> [--output <file>] [--delay <seconds>]

usage() {
  echo "Usage: run-pr-checks-wait.sh <pr-number> [--output <file>] [--delay <seconds>]" >&2
  exit 1
}

[[ $# -lt 1 ]] && usage

pr_number="$1"
shift

if [[ ! "$pr_number" =~ ^[1-9][0-9]*$ ]]; then
  echo "Error: pr-number must be a positive integer, got: $pr_number" >&2
  exit 1
fi

output_file=""
delay=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output)
      [[ $# -lt 2 ]] && { echo "Error: --output requires an argument" >&2; exit 1; }
      output_file="$2"
      shift 2
      ;;
    --delay)
      [[ $# -lt 2 ]] && { echo "Error: --delay requires an argument" >&2; exit 1; }
      delay="$2"
      if [[ ! "$delay" =~ ^[0-9]+$ ]]; then
        echo "Error: --delay must be a non-negative integer, got: $delay" >&2
        exit 1
      fi
      shift 2
      ;;
    *)
      echo "Error: unknown option: $1" >&2
      usage
      ;;
  esac
done

if [[ "$delay" -gt 0 ]]; then
  sleep "$delay"
fi

if [[ -n "$output_file" ]]; then
  output_dir="$(dirname "$output_file")"
  if [[ ! -d "$output_dir" ]]; then
    echo "Error: output directory does not exist: $output_dir" >&2
    exit 1
  fi
fi

# Wait for all checks to complete (--watch blocks until done). A non-zero exit
# here only means some check ended non-green; the authoritative verdict is parsed
# from --json below, so watch's exit status is deliberately ignored.
gh pr checks "$pr_number" --watch > /dev/null 2>&1 || true

# Capture the human-readable table for the log / output file (display only).
results=$(gh pr checks "$pr_number" 2>&1) || true

if [[ -n "$output_file" ]]; then
  printf '%s\n' "$results" | tee "$output_file"
else
  printf '%s\n' "$results"
fi

# Authoritative verdict: parse the check-run conclusions as structured JSON
# rather than grepping the human-readable text. gh's `bucket` field is the
# normalized category (pass|fail|pending|skipping|cancel), so a check NAMED
# `fail-fast` or a `failed to…` diagnostic no longer forces red, and a
# gh/network failure that produces no JSON is treated as an error (exit 2), not
# as a false green.
checks_json=$(gh pr checks "$pr_number" --json bucket,state,name 2>/dev/null) || checks_json=""
if [[ -z "$checks_json" ]] || ! printf '%s' "$checks_json" | jq -e . >/dev/null 2>&1; then
  echo "Error: could not retrieve check-run status as JSON for PR $pr_number" >&2
  exit 2
fi

# Exit non-zero if any check landed in the 'fail' bucket.
if printf '%s' "$checks_json" | jq -e 'any(.[]; .bucket == "fail")' >/dev/null; then
  exit 1
fi
