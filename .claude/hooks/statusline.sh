#!/usr/bin/env bash
# Project-level Claude Code status line.
# Side effect: writes ~/.local/share/commons-dispatch/rate_limits.json so the
# dispatch concurrency budgeter has telemetry to read.
# Visible output: identical to the user's global statusLine (model | cwd | tokens).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"

input=$(cat)

# Side effect — write rate_limits.json. Discard stdout (its summary line) and
# any errors so the status line still renders if the hook fails.
printf '%s' "$input" \
  | "$CLAUDE_PROJECT_DIR/.claude/skills/dispatch-propagate/scripts/update-rate-limits.sh" \
  >/dev/null 2>&1 || true

# Visible status line — matches ~/.claude/settings.json statusLine.command.
model=$(echo "$input" | jq -r '.model.display_name')
cwd_raw=$(echo "$input" | jq -r '.workspace.current_dir')
cwd=$(printf '%s' "$cwd_raw" | sed "s|^$HOME|~|")
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

# Dispatch-phase segment — the worktree's persisted graph phase, read directly
# from the intention node's record. A graph-lane worktree's branch name IS the
# intention node id, so intentions/<branch>.md carries the authoritative `phase:`
# in its YAML frontmatter. This read is local and instant — no `gh`, no network,
# no cache/background process — so the status line never blocks.
#
# Rewired in Unit 2 of tactic-dispatch-legacy-rewire (rewire-then-delete): this
# consumer no longer derives phase from GitHub `dispatch:*` labels via the
# `dispatch-phase` sensor. It reads the persisted graph `phase:` instead, in line
# with the greenfield target (no consumer derives state from dispatch labels).
#
# Fallback for non-node worktrees — a legacy `<N>-…` issue branch, `main`, or any
# branch without a matching intention node: render nothing. The legacy issue
# lane's phase used to come from `dispatch-phase` (a `gh` label query); this hook
# must not call `gh` on the hot path, so those worktrees simply show no phase
# segment. The trailing `|| true` at the call site keeps a transient git/read
# failure from blanking the other segments.
print_dispatch_segment() {
  local cwd_raw="$1"
  local root branch node_file phase
  root=$(git -C "$cwd_raw" rev-parse --show-toplevel 2>/dev/null) || return 0
  branch=$(git -C "$cwd_raw" branch --show-current 2>/dev/null) || return 0
  [[ -n "$branch" && "$branch" != "main" ]] || return 0
  node_file="$root/intentions/$branch.md"
  [[ -f "$node_file" ]] || return 0     # non-node worktree (legacy <N>-… / other) → nothing
  # Read `phase:` from the LEADING YAML frontmatter block only (stop at its
  # closing `---`), stripping optional surrounding quotes. A `null`/empty phase
  # (a pre-phase or parked node) renders nothing.
  phase=$(awk '
    NR==1 && $0=="---" { infm=1; next }
    infm && $0=="---" { exit }
    infm && /^phase:[[:space:]]/ {
      sub(/^phase:[[:space:]]*/, "")
      gsub(/^["'\'']|["'\'']$/, "")
      print; exit
    }
  ' "$node_file") || return 0
  [[ -n "$phase" && "$phase" != "null" ]] || return 0
  printf " | \033[32m[%s]\033[0m" "$phase"
}

print_dispatch_segment "$cwd_raw" || true
