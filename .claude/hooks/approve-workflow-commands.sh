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

# Join backslash-continuation lines into a single logical line, then reject bare
# newlines (multiple separate commands). This allows multi-line argument lists like:
#   script.sh \
#     arg1 \
#     arg2
# while still blocking newline-separated command injection.
JOINED=$(printf '%s' "$COMMAND" | sed -e ':a' -e '/\\$/{N;s/\\\n/ /;ba}')
FIRST_LINE=$(printf '%s' "$JOINED" | head -n 1)
if [ "$JOINED" != "$FIRST_LINE" ]; then
  exit 0
fi

# Match ref-pr-workflow script as the executable (first token), not as an argument.
# Extract the first whitespace-delimited token, strip leading shell syntax (" ' (),
# then require the script path to end the token ($ anchor). This prevents commands
# like "rm -rf / /abs/.claude/.../script" from matching on the argument path.
# Denylist rejects shell metacharacters in the full command line.
CMD_TOKEN=$(printf '%s' "$FIRST_LINE" | awk '{print $1}' | sed "s/^[\"'(]*//; s/[)]*$//")
if printf '%s\n' "$CMD_TOKEN" | grep -qE '(^|/)\.claude/skills/ref-pr-workflow/scripts/[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$' && \
   ! printf '%s\n' "$FIRST_LINE" | grep -qE '(&&|\|\||[;|`<>$])'; then
  printf '%s\n' "$APPROVE"
  exit 0
fi

exit 0
