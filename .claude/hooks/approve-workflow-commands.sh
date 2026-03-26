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

# Strip benign stderr suppression (2>/dev/null) before analysis, then validate
# each ;-separated segment independently. Every segment must:
#   1. Start with a workflow script as the first token
#   2. Contain no dangerous shell metacharacters after stripping 2>/dev/null
# This allows chained workflow calls like:
#   script-a 2>/dev/null; script-b 2>/dev/null
# while rejecting injection like:
#   script-a; rm -rf /
CLEANED=$(printf '%s' "$FIRST_LINE" | sed 's/ *2>\/dev\/null//g')

SCRIPT_RE='(^|/)\.claude/skills/ref-pr-workflow/scripts/[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$'
UNSAFE_RE='(&&|\|\||[|`<>$])'

IFS=';' read -ra SEGMENTS <<< "$CLEANED"
for SEGMENT in "${SEGMENTS[@]}"; do
  SEGMENT=$(printf '%s' "$SEGMENT" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  [ -z "$SEGMENT" ] && continue

  CMD_TOKEN=$(printf '%s' "$SEGMENT" | awk '{print $1}' | sed "s/^[\"'(]*//; s/[)]*$//")
  if ! printf '%s\n' "$CMD_TOKEN" | grep -qE "$SCRIPT_RE"; then
    exit 0
  fi
  if printf '%s\n' "$SEGMENT" | grep -qE "$UNSAFE_RE"; then
    exit 0
  fi
done

printf '%s\n' "$APPROVE"
exit 0
