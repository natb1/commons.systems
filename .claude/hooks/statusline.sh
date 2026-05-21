#!/usr/bin/env bash
# Project-level Claude Code status line.
# Side effect: writes ~/.local/share/productivity-tui/rate_limits.json so the
# productivity-tui rate-limits header has data to render.
# Visible output: identical to the user's global statusLine (model | cwd | tokens).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
DISPATCH_PHASE_TTL=60  # seconds; short TTL — phase changes happen minutes apart so 60s staleness is imperceptible, and it caps `gh pr list` at one call per minute per worktree.

input=$(cat)

# Side effect — write rate_limits.json. Discard stdout (its summary line) and
# any errors so the status line still renders if the hook fails.
printf '%s' "$input" \
  | "$CLAUDE_PROJECT_DIR/productivity-tui/hooks/update-rate-limits.sh" \
  >/dev/null 2>&1 || true

# Visible status line — matches ~/.claude/settings.json statusLine.command.
model=$(echo "$input" | jq -r '.model.display_name')
cwd=$(echo "$input" | jq -r '.workspace.current_dir' | sed "s|^$HOME|~|")
usage=$(echo "$input" | jq '.context_window.current_usage')
ctx_size=$(echo "$input" | jq -r '.context_window.context_window_size')
if [ "$usage" != "null" ]; then
  current=$(echo "$usage" | jq '.input_tokens + .cache_creation_input_tokens + .cache_read_input_tokens')
  pct=$((current * 100 / ctx_size))
  printf "\033[36m%s\033[0m | \033[33m%s\033[0m | \033[35m%dk/%dk tokens (%d%%)\033[0m" \
    "$model" "$cwd" "$((current/1000))" "$((ctx_size/1000))" "$pct"
else
  printf "\033[36m%s\033[0m | \033[33m%s\033[0m" "$model" "$cwd"
fi

# Dispatch-phase segment — shows the worktree's /dispatch PR phase. The phase is
# cached to a file with a TTL and refreshed in a detached background process, so
# the status line never blocks on dispatch-phase's `gh pr list` network call.
# `print_dispatch_segment ... || true` keeps a git/dispatch-phase/cache failure
# from blanking the other segments.
cwd_raw=$(echo "$input" | jq -r '.workspace.current_dir')
print_dispatch_segment() {
  local cwd_raw="$1"
  local branch issue cache phase_script now mtime phase
  branch=$(git -C "$cwd_raw" branch --show-current 2>/dev/null) || return 0
  [[ "$branch" =~ ^([0-9]+)- ]] || return 0          # main / non-issue → nothing
  issue="${BASH_REMATCH[1]}"
  cache="$SCRIPT_DIR/../../tmp/dispatch-phase"
  phase_script="$SCRIPT_DIR/../skills/dispatch/scripts/dispatch-phase"
  now=$(date +%s)
  mtime=$(stat -c %Y "$cache" 2>/dev/null || echo 0)
  if (( now - mtime >= DISPATCH_PHASE_TTL )); then
    mkdir -p "$(dirname "$cache")" 2>/dev/null
    touch "$cache" 2>/dev/null                       # bump mtime → no stampede
    setsid bash -c '
      p=$("$1" "$2" 2>/dev/null) && [ -n "$p" ] && printf "%s" "$p" > "$3"
    ' _ "$phase_script" "$issue" "$cache" >/dev/null 2>&1 </dev/null &
  fi
  phase=$(cat "$cache" 2>/dev/null) || return 0
  [[ -n "$phase" ]] || return 0
  printf " | \033[32m#%s %s\033[0m" "$issue" "$phase"
}

print_dispatch_segment "$cwd_raw" || true
