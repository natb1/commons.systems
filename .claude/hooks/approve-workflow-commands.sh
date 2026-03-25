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

PARSED=$(jq -r '"\(.tool_name // empty)\t\(.tool_input.command // empty)"' 2>/dev/null) || {
  echo "[approve-workflow-commands] WARNING: failed to parse input" >&2
  exit 0
}
TOOL_NAME="${PARSED%%	*}"
COMMAND="${PARSED#*	}"

# Only process Bash tool calls (redundant with matcher in settings.json, kept as safety check)
if [ "$TOOL_NAME" != "Bash" ] || [ -z "$COMMAND" ]; then
  exit 0
fi

APPROVE='{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow","permissionDecisionReason":"auto-approved by workflow hook"}}'

# Workflow scripts — matches .claude/skills/ref-pr-workflow/scripts/<name> at start of
# command or after "/" (absolute path). Guards against:
# - Path traversal: script name after scripts/ must start with alphanumeric, _, or -
#   (not a dot), which prevents ../ sequences at that position
# - Shell metacharacters: rejects commands containing &&, ||, ;, |, backtick, $, <, >
#   (covers command substitution, redirection, piping, and chaining)
# - Multiline commands: rejects if command contains embedded newlines
# Note: the regex requires .claude to appear at line-start or immediately after "/".
# Commands where .claude is preceded by a space (e.g., "echo .claude/...") do not match,
# but any path with "/" before .claude will match (e.g., "cat /abs/.claude/...") —
# an acceptable trade-off for worktree path support.
FIRST_LINE=$(printf '%s' "$COMMAND" | head -n 1)
if [ "$COMMAND" != "$FIRST_LINE" ]; then
  exit 0
fi
if printf '%s\n' "$FIRST_LINE" | grep -qE '(^|/)\.claude/skills/ref-pr-workflow/scripts/[a-zA-Z0-9_-][a-zA-Z0-9_.-]*' && \
   ! printf '%s\n' "$FIRST_LINE" | grep -qE '(&&|\|\||[;|`<>$])'; then
  printf '%s\n' "$APPROVE"
  exit 0
fi

exit 0
