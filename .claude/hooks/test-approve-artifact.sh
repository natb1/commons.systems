#!/usr/bin/env bash
# Test suite for approve-artifact.sh hook.
# Usage: ./test-approve-artifact.sh
# Requires: jq
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
HOOK="$SCRIPT_DIR/approve-artifact.sh"

PASS=0
FAIL=0
TOTAL=0

run_hook() {
  printf '%s\n' "$1" | "$HOOK" 2>/dev/null || true
}

assert_approves() {
  local desc="$1" input="$2"
  TOTAL=$((TOTAL + 1))
  local output
  output=$(run_hook "$input")
  if jq -e '.hookSpecificOutput.permissionDecision == "allow"' >/dev/null 2>&1 <<<"$output"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: $desc — expected approve, got: $output"
  fi
}

assert_passthrough() {
  local desc="$1" input="$2"
  TOTAL=$((TOTAL + 1))
  local output
  output=$(run_hook "$input")
  if [ -z "$output" ]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: $desc — expected passthrough (empty output), got: $output"
  fi
}

# --- Artifact calls are approved -----------------------------------------
# These also guard the bare "Artifact" entry in settings.json permissions.allow:
# remove it and every case below flips to passthrough.

assert_approves "publish a new artifact" \
  "$(jq -n '{tool_name: "Artifact", tool_input: {file_path: "/tmp/scratch/brief.html", title: "Saturday Brief"}}')"

assert_approves "redeploy to an existing artifact url" \
  "$(jq -n '{tool_name: "Artifact", tool_input: {file_path: "/tmp/scratch/brief.html", url: "https://claude.ai/code/artifact/abc"}}')"

assert_approves "read an artifact" \
  "$(jq -n '{tool_name: "Artifact", tool_input: {action: "read", url: "https://claude.ai/code/artifact/abc"}}')"

# --- Everything else passes through --------------------------------------

assert_passthrough "another tool is not this hook'\''s business" \
  "$(jq -n '{tool_name: "Write", tool_input: {file_path: "/tmp/scratch/brief.html"}}')"

assert_passthrough "missing tool_name" \
  "$(jq -n '{tool_input: {file_path: "/tmp/scratch/brief.html"}}')"

assert_passthrough "malformed input is absorbed, not fatal" \
  "not json at all"

echo "---"
echo "Passed: $PASS/$TOTAL"
if [ "$FAIL" -gt 0 ]; then
  echo "Failed: $FAIL"
  exit 1
fi
