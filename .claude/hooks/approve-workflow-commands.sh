#!/usr/bin/env bash
# PreToolUse hook: auto-approve workflow script commands.
# Reads tool input JSON from stdin. Returns JSON permissionDecision of "allow"
# when the command invokes a ref-pr-workflow script.
# Exits 0 with no output for unrecognized commands (passthrough).
#
# errexit (-e) is intentionally omitted — hook failures must not block the user.
# Errors are logged to stderr; unrecognized commands pass through silently.
set -uo pipefail
trap 'echo "[approve-workflow-commands] WARNING: unexpected error on line $LINENO" >&2; exit 0' ERR

INPUT=$(cat)
TOOL_NAME=$(printf '%s\n' "$INPUT" | jq -r '.tool_name // empty') || {
  echo "[approve-workflow-commands] WARNING: failed to parse tool_name" >&2
  exit 0
}

# Only process Bash tool calls (redundant with matcher in settings.json, kept as safety check)
if [ "$TOOL_NAME" != "Bash" ]; then
  exit 0
fi

COMMAND=$(printf '%s\n' "$INPUT" | jq -r '.tool_input.command // empty') || {
  echo "[approve-workflow-commands] WARNING: failed to parse command" >&2
  exit 0
}
if [ -z "$COMMAND" ]; then
  exit 0
fi

approve() {
  if ! jq -n '{
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "permissionDecision": "allow",
      "permissionDecisionReason": "auto-approved by workflow hook"
    }
  }'; then
    echo "[approve-workflow-commands] WARNING: jq failed to produce approval JSON" >&2
  fi
  return 0
}

# Workflow scripts — matches .claude/skills/ref-pr-workflow/scripts/ at start of command
# or after a "/" (absolute path). This prevents matching when the path appears as an
# argument to another command (e.g., "echo .claude/..." or "cat .claude/...").
if printf '%s\n' "$COMMAND" | grep -qE '(^|/)\.claude/skills/ref-pr-workflow/scripts/[a-zA-Z0-9_.-]+'; then
  approve
  exit 0
fi

exit 0
