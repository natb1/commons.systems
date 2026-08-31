#!/usr/bin/env bash
# Project-level Claude Code status line.
# Side effect: writes ~/.local/share/commons-dispatch/rate_limits.json so the
# dispatch concurrency budgeter has telemetry to read.
# Visible output: model | tokens, plus a dispatch-phase segment when applicable.
# No longer mirrors the user's global statusLine, which still shows cwd.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"

input=$(cat)

# Side effect — write rate_limits.json. Discard stdout (its summary line) and
# any errors so the status line still renders if the hook fails.
printf '%s' "$input" \
  | "$CLAUDE_PROJECT_DIR/.claude/skills/dispatch-propagate/scripts/update-rate-limits.sh" \
  >/dev/null 2>&1 || true

# Visible status line — model and token usage (no cwd; see header note above).
model=$(echo "$input" | jq -r '.model.display_name')
cwd_raw=$(echo "$input" | jq -r '.workspace.current_dir')
usage=$(echo "$input" | jq '.context_window.current_usage')
ctx_size=$(echo "$input" | jq -r '.context_window.context_window_size')
# The NUMERATOR gets the same treatment as the denominator below, because it is
# exposed to the same schema drift. `.input_tokens + .cache_… + .cache_…` over a
# current_usage whose token keys have been renamed or dropped is `null + null +
# null` = `null`; bash reads the bare word `null` as an unset name worth 0 and
# the status line renders a confident `0k/200k tokens (0%)` for a session that
# may be at the context ceiling — a fabricated measurement, which is worse than
# no number. A string-typed field is the loud variant: jq's `"12" + null` is the
# string `"12"`, and `$(( "12" * 100 / ctx_size ))` is an arithmetic syntax
# error, fatal for the same reason spelled out below.
#
# `map(select(type == "number"))` sums only the members that really are numbers,
# which PRESERVES today's partial-presence behaviour (jq's `5 + null` is `5`),
# and `// "null"` turns the all-absent case into the same literal "null" the
# ctx_size guard already recognises — so it takes the model-only branch rather
# than reporting a zero it did not measure. Hoisted above the `if` so the guard
# can test it. Here-string, not `echo`, per .claude/rules/shell-json.md.
current=$(jq -r '[.input_tokens, .cache_creation_input_tokens, .cache_read_input_tokens]
                 | map(select(type == "number")) | add // "null"' <<<"$usage")
# ctx_size must be a positive integer to divide by. jq -r turns a JSON `null`
# or a missing key into the literal string "null", and a malformed/zero
# context_window_size is not impossible either — either way `$(( ... /
# ctx_size ))` is a bash arithmetic error (division by zero, or "value too
# great for base" on a non-numeric string), which is FATAL even without
# `set -e`: the whole script dies right there, silently, before this segment
# — and before the dispatch-phase segment below ever runs. That would wedge
# the status line to nothing, which the fail-open posture documented at the
# top of this file forbids. Falls back to the plain model-only branch, same
# as the no-usage case, rather than crash.
if [[ "$usage" != "null" && "$current" =~ ^[0-9]+$ && "$ctx_size" =~ ^[0-9]+$ && "$ctx_size" -gt 0 ]]; then
  pct=$((current * 100 / ctx_size))
  printf "\033[36m%s\033[0m | \033[35m%dk/%dk tokens (%d%%)\033[0m" \
    "$model" "$((current/1000))" "$((ctx_size/1000))" "$pct"
else
  printf "\033[36m%s\033[0m" "$model"
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
