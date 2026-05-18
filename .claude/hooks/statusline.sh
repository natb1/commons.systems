#!/usr/bin/env bash
# Project-level Claude Code status line.
# Side effect: writes ~/.local/share/productivity-tui/rate_limits.json so the
# productivity-tui rate-limits header has data to render.
# Visible output: identical to the user's global statusLine (model | cwd | tokens).

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
