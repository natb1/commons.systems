#!/usr/bin/env bash
# PreToolUse hook: auto-approve workflow scripts, git writes, and gh CLI.
# Reads tool input JSON from stdin. Returns permissionDecision for known patterns.
# Exits 0 with no output for unrecognized commands (passthrough).
set -uo pipefail

INPUT=$(cat)
TOOL_NAME=$(printf '%s\n' "$INPUT" | jq -r '.tool_name // empty')

# Only process Bash tool calls
if [ "$TOOL_NAME" != "Bash" ]; then
  exit 0
fi

COMMAND=$(printf '%s\n' "$INPUT" | jq -r '.tool_input.command // empty')
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
  exit 0
}

# Workflow scripts — match .claude/skills/ref-pr-workflow/scripts/ anywhere in command
if printf '%s\n' "$COMMAND" | grep -qE '\.claude/skills/ref-pr-workflow/scripts/[a-zA-Z0-9_.-]+'; then
  approve
fi

# Git write operations
if printf '%s\n' "$COMMAND" | grep -qE '^git (add|commit|push|fetch|merge|checkout|rebase) '; then
  approve
fi

# GitHub CLI
if printf '%s\n' "$COMMAND" | grep -qE '^gh (issue|pr|run|api) '; then
  approve
fi

exit 0
