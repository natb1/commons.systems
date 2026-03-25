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
  jq -n '{
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "permissionDecision": "allow",
      "permissionDecisionReason": "auto-approved by workflow hook"
    }
  }'
}

# Workflow scripts — matches .claude/skills/ref-pr-workflow/scripts/<name> at start of
# command or after "/" (absolute path). Guards against:
# - Path traversal: first char of script name must not be a dot
# - Command chaining: rejects commands with shell operators (&&, ||, ;, |)
# - Newline injection: only the first line of the command is checked
# Note: relative paths preceded by a space (e.g., "echo .claude/...") do not match,
# but absolute paths as arguments (e.g., "cat /abs/.claude/...") will match if no
# shell operators are present — an acceptable trade-off for worktree path support.
FIRST_LINE=$(printf '%s' "$COMMAND" | head -1)
if printf '%s\n' "$FIRST_LINE" | grep -qE '(^|/)\.claude/skills/ref-pr-workflow/scripts/[a-zA-Z0-9_-][a-zA-Z0-9_.-]*' && \
   ! printf '%s\n' "$FIRST_LINE" | grep -qE '(&&|\|\||[;|`])'; then
  approve
  exit 0
fi

exit 0
