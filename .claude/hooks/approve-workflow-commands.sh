#!/usr/bin/env bash
# PreToolUse hook: auto-approve workflow script and allowedTools commands.
# Reads tool input JSON from stdin. Returns JSON permissionDecision of "allow"
# when every command segment is a skill script or an allowedTools command.
# Exits 0 with no output for unrecognized commands (passthrough).
#
# errexit (-e) is intentionally omitted — hook failures must not block the user.
# Errors are logged to stderr; unrecognized commands pass through silently.
set -uo pipefail
trap 'echo "[approve-workflow-commands] WARNING: unexpected error on line $LINENO (exit $?)" >&2; exit 0' ERR

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

SCRIPT_RE='(^|/)\.claude/skills/[a-zA-Z0-9_-]+/scripts/[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$'

# --- Settings-derived allow lists ----------------------------------------

HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"
SETTINGS_DIR="$HOOK_DIR/.."

# Build list of allowed single-word commands from settings.json Bash(cmd:*) entries.
# Multi-word prefixes like "gh issue view" are skipped because CMD_TOKEN extraction
# yields only the first word, which would never equal the full multi-word entry.
ALLOWED_CMDS=()
for _SETTINGS_FILE in "$SETTINGS_DIR/settings.json" "$SETTINGS_DIR/settings.local.json"; do
  if [ -f "$_SETTINGS_FILE" ]; then
    _JQ_OUT=$(jq -r '.permissions.allow[]? // empty' "$_SETTINGS_FILE" 2>/dev/null) || {
      echo "[approve-workflow-commands] WARNING: failed to parse $_SETTINGS_FILE" >&2
      continue
    }
    while IFS= read -r _CMD; do
      [[ "$_CMD" == *" "* ]] && continue
      [ -n "$_CMD" ] && ALLOWED_CMDS+=("$_CMD")
    done < <(printf '%s\n' "$_JQ_OUT" | sed -n 's/^Bash(\([^:)]*\):\*).*/\1/p' | sort -u)
  fi
done

# Build list of allowed git subcommands from Bash(git <sub>:*) entries.
ALLOWED_GIT_SUBS=()
for _SETTINGS_FILE in "$SETTINGS_DIR/settings.json" "$SETTINGS_DIR/settings.local.json"; do
  if [ -f "$_SETTINGS_FILE" ]; then
    _JQ_OUT=$(jq -r '.permissions.allow[]? // empty' "$_SETTINGS_FILE" 2>/dev/null) || continue
    while IFS= read -r _SUB; do
      [ -n "$_SUB" ] && ALLOWED_GIT_SUBS+=("$_SUB")
    done < <(printf '%s\n' "$_JQ_OUT" | sed -n 's/^Bash(git \([^:)]*\):\*).*/\1/p' | sort -u)
  fi
done

WORKTREES_ROOT="$(cd "$HOOK_DIR/../../.." && pwd)"

# --- Helper functions ----------------------------------------------------

is_allowed_git_c() {
  local segment="$1"
  local git_cmd path_arg sub_cmd resolved
  git_cmd=$(printf '%s' "$segment" | awk '{print $1}')
  [ "$git_cmd" = "git" ] || return 1
  [ "$(printf '%s' "$segment" | awk '{print $2}')" = "-C" ] || return 1
  path_arg=$(printf '%s' "$segment" | awk '{print $3}')
  sub_cmd=$(printf '%s' "$segment" | awk '{print $4}')
  [ -n "$path_arg" ] && [ -n "$sub_cmd" ] || return 1
  resolved=$(realpath "$path_arg" 2>/dev/null) || return 1
  case "$resolved" in
    "$WORKTREES_ROOT"/*) ;;
    *) return 1 ;;
  esac
  for _SUB in "${ALLOWED_GIT_SUBS[@]}"; do
    if [ "$sub_cmd" = "$_SUB" ]; then
      return 0
    fi
  done
  return 1
}

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

# strip_heredocs — remove heredoc bodies, leaving just the command skeleton.
# Converts multi-line heredoc content to nothing, keeping the <<DELIM line.
strip_heredocs() {
  local input="$1"
  local result="" line delim in_heredoc=""
  while IFS= read -r line || [ -n "$line" ]; do
    if [ -n "$in_heredoc" ]; then
      local stripped="${line##	*}"
      if [ "$stripped" = "$in_heredoc" ] || [ "$line" = "$in_heredoc" ]; then
        in_heredoc=""
      fi
      continue
    fi
    if printf '%s\n' "$line" | grep -qE '<<-?'\''?"?[A-Za-z_][A-Za-z0-9_]*'; then
      delim=$(printf '%s\n' "$line" | sed -n "s/.*<<-\{0,1\}['\"\\ ]*\([A-Za-z_][A-Za-z0-9_]*\).*/\1/p")
      if [ -n "$delim" ]; then
        in_heredoc="$delim"
        result="${result}${line}
"
        continue
      fi
    fi
    result="${result}${line}
"
  done <<< "$input"
  printf '%s' "$result"
}

# extract_and_validate_subst — find $() groups in a string, recursively validate
# each one, and return the string with $() groups replaced by a placeholder.
# Returns 0 and prints the cleaned string if all $() contents are safe.
# Returns 1 if any $() content is unsafe or unbalanced.
extract_and_validate_subst() {
  local input="$1"
  local depth="${2:-0}"
  [ "$depth" -gt 5 ] && return 1

  local i=0 len=${#input} output="" ch next
  while [ "$i" -lt "$len" ]; do
    ch="${input:$i:1}"
    next="${input:$((i+1)):1}"
    if [ "$ch" = '$' ] && [ "$next" = '(' ]; then
      # Scan for matching ) counting nesting
      local paren_depth=1 j=$((i+2))
      while [ "$j" -lt "$len" ] && [ "$paren_depth" -gt 0 ]; do
        local jch="${input:$j:1}"
        [ "$jch" = '(' ] && paren_depth=$((paren_depth+1))
        [ "$jch" = ')' ] && paren_depth=$((paren_depth-1))
        j=$((j+1))
      done
      [ "$paren_depth" -ne 0 ] && return 1
      local inner="${input:$((i+2)):$((j-i-3))}"
      # Strip heredoc bodies from inner command
      inner=$(strip_heredocs "$inner")
      local inner_first
      inner_first=$(printf '%s' "$inner" | head -n 1)
      # Recursively validate the inner command
      if ! validate_command "$inner_first" "$((depth+1))"; then
        return 1
      fi
      # Replace $(...) with placeholder in output
      output="${output}_SUBST_"
      i=$j
      continue
    fi
    # Backticks are always unsafe
    if [ "$ch" = '`' ]; then
      return 1
    fi
    output="${output}${ch}"
    i=$((i+1))
  done
  printf '%s' "$output"
  return 0
}

# validate_command — validate a full command string (may contain pipes, semicolons, $()).
# First extracts and validates $() substitutions, then splits on | and ; and checks
# each segment for allowed commands.
# Returns 0 if all segments are safe, 1 if not.
validate_command() {
  local cmd="$1"
  local depth="${2:-0}"

  # Reject && and ||
  # Must check before $() extraction since && inside $() would be caught recursively.
  # This check runs on the raw string — extract_and_validate_subst handles inner commands.

  # Extract and validate $() substitutions first, before splitting on | and ;.
  # This prevents pipes inside $() from being split prematurely.
  local cleaned
  cleaned=$(extract_and_validate_subst "$cmd" "$depth") || return 1

  # Now check for < > in the cleaned string (after $() removed)
  if printf '%s\n' "$cleaned" | grep -qE '[<>]'; then
    return 1
  fi

  # Reject && and || in the cleaned string
  if printf '%s\n' "$cleaned" | grep -qE '(&&|\|\|)'; then
    return 1
  fi

  # Strip benign stderr redirects
  cleaned=$(printf '%s' "$cleaned" | sed 's/ *2>[/&][a-z1-9]*//g')

  # Split on | then ; and validate each segment
  local IFS_SAVE="$IFS"
  IFS='|' read -ra _PIPE_STAGES <<< "$cleaned"
  for _STAGE in "${_PIPE_STAGES[@]}"; do
    IFS=';' read -ra _SEGS <<< "$_STAGE"
    for _SEG in "${_SEGS[@]}"; do
      _SEG=$(printf '%s' "$_SEG" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
      [ -z "$_SEG" ] && continue
      local cmd_token
      cmd_token=$(printf '%s' "$_SEG" | awk '{print $1}' | sed "s/^[\"'(]*//; s/[)]*$//")
      if ! is_allowed_cmd "$cmd_token" && ! is_allowed_git_c "$_SEG"; then
        IFS="$IFS_SAVE"
        return 1
      fi
    done
  done
  IFS="$IFS_SAVE"
  return 0
}

# --- Main validation -----------------------------------------------------

# Join backslash-continuation lines into a single logical line.
JOINED=$(printf '%s' "$COMMAND" | sed -e ':a' -e '/\\$/{N;s/\\\n/ /;ba}')
FIRST_LINE=$(printf '%s' "$JOINED" | head -n 1)

# Multi-line commands are rejected unless every command in the first line is an
# approved git -C command and the line contains a heredoc (<<) explaining why
# there are extra lines. Split on && and || to validate each part independently.
if [ "$JOINED" != "$FIRST_LINE" ]; then
  if printf '%s\n' "$FIRST_LINE" | grep -qF '<<'; then
    local_approved=true
    # Split first line on && and || to validate each command independently
    IFS_SAVE="$IFS"
    # Replace && and || with a delimiter we can split on
    _parts=$(printf '%s' "$FIRST_LINE" | sed 's/ *&& */ \n /g; s/ *|| */ \n /g')
    while IFS= read -r _part; do
      _part=$(printf '%s' "$_part" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
      [ -z "$_part" ] && continue
      if ! is_allowed_git_c "$_part"; then
        local_approved=false
        break
      fi
    done <<< "$_parts"
    IFS="$IFS_SAVE"
    if [ "$local_approved" = true ]; then
      printf '%s\n' "$APPROVE"
    fi
  fi
  exit 0
fi

if validate_command "$FIRST_LINE"; then
  printf '%s\n' "$APPROVE"
fi
exit 0
