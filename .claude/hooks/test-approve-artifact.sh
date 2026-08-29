#!/usr/bin/env bash
# Test suite for approve-artifact.sh hook.
# Usage: ./test-approve-artifact.sh
# Requires: jq
#
# Hermetic by construction. The hook resolves its settings directory from its
# own location ($(dirname "$0")/..), so each case copies the hook into a temp
# tree beside a fixture settings.json. That keeps the suite honest about the
# thing it is testing — the hook's decision logic — instead of coupling it to
# whatever the repo's real permissions.allow happens to hold on the day.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
HOOK="$SCRIPT_DIR/approve-artifact.sh"

PASS=0
FAIL=0
TOTAL=0

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

# Builds a temp tree holding a copy of the hook and the given settings files,
# then runs the hook there. Usage: run_in_tree <input json> [<name>=<json>...]
run_in_tree() {
  local input="$1"
  shift
  local tree
  tree=$(mktemp -d "$WORK/tree.XXXXXX")
  mkdir -p "$tree/.claude/hooks"
  cp "$HOOK" "$tree/.claude/hooks/"
  local spec
  for spec in "$@"; do
    printf '%s\n' "${spec#*=}" > "$tree/.claude/${spec%%=*}"
  done
  printf '%s\n' "$input" | "$tree/.claude/hooks/approve-artifact.sh" 2>/dev/null || true
}

assert_approves() {
  local desc="$1"
  shift
  TOTAL=$((TOTAL + 1))
  local output
  output=$(run_in_tree "$@")
  if jq -e '.hookSpecificOutput.permissionDecision == "allow"' >/dev/null 2>&1 <<<"$output"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: $desc — expected approve, got: $output"
  fi
}

assert_passthrough() {
  local desc="$1"
  shift
  TOTAL=$((TOTAL + 1))
  local output
  output=$(run_in_tree "$@")
  if [ -z "$output" ]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: $desc — expected passthrough (empty output), got: $output"
  fi
}

ALLOWED='settings.json={"permissions":{"allow":["Artifact","Bash(cat:*)"]}}'
NOT_ALLOWED='settings.json={"permissions":{"allow":["Bash(cat:*)"]}}'
LOCAL_ALLOWED='settings.local.json={"permissions":{"allow":["Artifact"]}}'

PUBLISH=$(jq -n '{tool_name: "Artifact", tool_input: {file_path: "/tmp/scratch/brief.html", title: "Saturday Brief"}}')
REDEPLOY=$(jq -n '{tool_name: "Artifact", tool_input: {file_path: "/tmp/scratch/brief.html", url: "https://claude.ai/code/artifact/abc"}}')
READ=$(jq -n '{tool_name: "Artifact", tool_input: {action: "read", url: "https://claude.ai/code/artifact/abc"}}')

# --- With the allow entry present, every Artifact call is approved ---------

assert_approves "publish a new artifact" "$PUBLISH" "$ALLOWED"
assert_approves "redeploy to an existing artifact url" "$REDEPLOY" "$ALLOWED"
assert_approves "read an artifact" "$READ" "$ALLOWED"
assert_approves "the entry is honored in settings.local.json too" \
  "$PUBLISH" "$NOT_ALLOWED" "$LOCAL_ALLOWED"

# --- settings.json stays the source of truth ------------------------------

assert_passthrough "no allow entry means the prompt behaves as before" "$PUBLISH" "$NOT_ALLOWED"
assert_passthrough "no settings file at all" "$PUBLISH"

# --- Everything else passes through ---------------------------------------

assert_passthrough "another tool is not this hook's business" \
  "$(jq -n '{tool_name: "Write", tool_input: {file_path: "/tmp/scratch/brief.html"}}')" "$ALLOWED"
assert_passthrough "missing tool_name" \
  "$(jq -n '{tool_input: {file_path: "/tmp/scratch/brief.html"}}')" "$ALLOWED"
assert_passthrough "malformed input is absorbed, not fatal" "not json at all" "$ALLOWED"

echo "---"
echo "Passed: $PASS/$TOTAL"
if [ "$FAIL" -gt 0 ]; then
  echo "Failed: $FAIL"
  exit 1
fi
