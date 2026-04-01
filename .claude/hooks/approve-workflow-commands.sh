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

# Strip benign stderr redirects (2>/dev/null, 2>&1) before analysis, then validate
# each segment in the pipeline and semicolon chain. Every segment must:
#   1. Start with a workflow script OR a command from the allowedTools list
#   2. Contain no dangerous shell metacharacters after stripping stderr redirects
# This allows piped and chained commands like:
#   script-a 2>&1 | head -200
#   script-a 2>/dev/null; script-b 2>&1
# while rejecting injection like:
#   script-a | malicious-command
#   script-a; rm -rf /
CLEANED=$(printf '%s' "$FIRST_LINE" | sed 's/ *2>[/&][a-z1-9]*//g')

SCRIPT_RE='(^|/)\.claude/skills/ref-pr-workflow/scripts/[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$'
UNSAFE_RE='(&&|\|\||[`<>$])'

# Build list of allowed command basenames from settings.json Bash(cmd:*) entries.
# Falls back to empty (no piped commands approved beyond workflow scripts) on failure.
HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"
SETTINGS_DIR="$HOOK_DIR/.."
ALLOWED_CMDS=()
for _SETTINGS_FILE in "$SETTINGS_DIR/settings.json" "$SETTINGS_DIR/settings.local.json"; do
  if [ -f "$_SETTINGS_FILE" ]; then
    while IFS= read -r _CMD; do
      [ -n "$_CMD" ] && ALLOWED_CMDS+=("$_CMD")
    done < <(jq -r '.permissions.allow[]? // empty' "$_SETTINGS_FILE" 2>/dev/null \
      | sed -n 's/^Bash(\([^:)]*\):\*).*/\1/p' | sort -u)
  fi
done

is_allowed_cmd() {
  local token="$1"
  if printf '%s\n' "$token" | grep -qE "$SCRIPT_RE"; then
    return 0
  fi
  local base
  base=$(basename "$token")
  for _ALLOWED in "${ALLOWED_CMDS[@]}"; do
    if [ "$base" = "$_ALLOWED" ] || [ "$token" = "$_ALLOWED" ]; then
      return 0
    fi
  done
  return 1
}

# Split on | first (pipeline stages), then ; within each stage.
IFS='|' read -ra PIPE_STAGES <<< "$CLEANED"
for STAGE in "${PIPE_STAGES[@]}"; do
  IFS=';' read -ra SEGMENTS <<< "$STAGE"
  for SEGMENT in "${SEGMENTS[@]}"; do
    SEGMENT=$(printf '%s' "$SEGMENT" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    [ -z "$SEGMENT" ] && continue

    CMD_TOKEN=$(printf '%s' "$SEGMENT" | awk '{print $1}' | sed "s/^[\"'(]*//; s/[)]*$//")
    if ! is_allowed_cmd "$CMD_TOKEN"; then
      exit 0
    fi
    if printf '%s\n' "$SEGMENT" | grep -qE "$UNSAFE_RE"; then
      exit 0
    fi
  done
done

printf '%s\n' "$APPROVE"
exit 0
