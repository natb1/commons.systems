#!/usr/bin/env bash
set -euo pipefail

# Wrapper around `gh run watch` that keeps shell expansions inside the script,
# so Bash tool calls are literal strings matching allowedTools patterns.
#
# Usage: run-ci-watch.sh <run-id> [--output <file>] [--delay <seconds>]

usage() {
  echo "Usage: run-ci-watch.sh <run-id> [--output <file>] [--delay <seconds>]" >&2
  exit 1
}

[[ $# -lt 1 ]] && usage

run_id="$1"
shift

if [[ ! "$run_id" =~ ^[1-9][0-9]*$ ]]; then
  echo "Error: run-id must be a positive integer, got: $run_id" >&2
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
  gh run watch -i 30 --exit-status "$run_id" | tee "$output_file"
else
  gh run watch -i 30 --exit-status "$run_id"
fi
