#!/usr/bin/env bash
set -euo pipefail

# Wait for all PR checks to complete, then report their status.
# Replaces the single-run `gh run watch` approach to ensure ALL workflows
# (not just the most recent one) are verified.
#
# Usage: run-pr-checks-wait.sh <pr-number> [--output <file>] [--delay <seconds>]
#
# Exit codes:
#   0 — every check concluded green (or the only non-green rows are
#       skipped/neutral noise that the shared CI classifier calls `passing`).
#   1 — red: some check is in gh's `fail` bucket, or a row that never concluded
#       classifies `failing` (e.g. an orphaned check run — see below).
#   2 — indeterminate: no verdict could be obtained. Either gh returned no
#       parseable JSON, or checks were still pending when the bounded watch gave
#       up. Explicitly NOT green.
#
# The watch is bounded (PR_CHECKS_WATCH_S, default 1800s) because
# `gh pr checks --watch` can block forever on a check run that never reports —
# GitHub sometimes leaves a run `queued` with a null conclusion after its parent
# check suite has concluded. This script is invoked by a model through the Bash
# tool, whose own ceiling is 600s, so an unbounded watch burns the whole tool
# call and returns no verdict at all.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

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

# Wait for all checks to complete (--watch blocks until done), bounded so a row
# that never reports cannot pin this call forever. A non-zero exit here only
# means some check ended non-green, or that the bound fired; the authoritative
# verdict is parsed from --json below, so watch's exit status is deliberately
# ignored. Falling out of the bound is not a green signal — the pending arm
# after the fail-bucket parse below handles it.
watch_bound="${PR_CHECKS_WATCH_S:-1800}"
timeout "$watch_bound" gh pr checks "$pr_number" --watch > /dev/null 2>&1 || true

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

# Exit non-zero if any check landed in the 'fail' bucket. This stays the
# authoritative red signal and runs first: a concluded failure is actionable
# even while other rows are still moving.
if printf '%s' "$checks_json" | jq -e 'any(.[]; .bucket == "fail")' >/dev/null; then
  exit 1
fi

# No red rows — but a row still in the 'pending' bucket is NOT green, and gh's
# bucket alone cannot tell "still running" from "will never report". Falling
# through to exit 0 here would report a false green on a PR whose CI never
# concluded. So resolve the head sha and ask the shared classifier, which
# already carries the orphaned-check-run rule (a run whose parent suite has
# concluded is STALE, hence `failing`). `gh pr checks --json` exposes no
# check_suite id, so the rule cannot be re-derived here — delegating is what
# keeps a single implementation of it.
if printf '%s' "$checks_json" | jq -e 'any(.[]; .bucket == "pending")' >/dev/null; then
  pending_names=$(printf '%s' "$checks_json" \
    | jq -r '[.[] | select(.bucket == "pending") | .name] | join(", ")')

  pr_json=$(gh_pr_view_rest "$pr_number") || {
    echo "Error: could not resolve the head sha for PR $pr_number" >&2
    exit 2
  }
  head_sha=$(jq -r '.headRefOid // ""' <<<"$pr_json")
  if [[ -z "$head_sha" ]]; then
    echo "Error: PR $pr_number reported no head sha" >&2
    exit 2
  fi

  verdict=$(dispatch_ci_verdict_rest "$head_sha") || {
    echo "Error: could not classify check runs for PR $pr_number ($head_sha)" >&2
    exit 2
  }

  case "$verdict" in
    failing)
      echo "Error: check(s) never concluded and classify as failing for PR $pr_number: $pending_names" >&2
      exit 1
      ;;
    pending)
      echo "Error: checks not concluded after ${watch_bound}s for PR $pr_number: $pending_names" >&2
      exit 2
      ;;
    passing)
      # The pending row is skipped/neutral noise the classifier already counts
      # as green; fall through to exit 0.
      ;;
    *)
      echo "Error: unrecognized CI verdict '$verdict' for PR $pr_number ($head_sha)" >&2
      exit 2
      ;;
  esac
fi
