#!/usr/bin/env bash
# Compaction recovery hook: read issue state and output reload instructions.
# Called by hooks.json on SessionStart/compact events.
# Always exits 0 — never blocks session recovery.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ISSUE_STATE_READ="$SCRIPT_DIR/../skills/ref-pr-workflow/scripts/issue-state-read"

# Extract issue number from branch name (e.g., "121-improve-pr-workflow" → "121")
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0
ISSUE_NUM=$(printf '%s\n' "$BRANCH" | grep -oE '^[0-9]+') || exit 0
[ -z "$ISSUE_NUM" ] && exit 0

# Read issue state
if ! STATE=$("$ISSUE_STATE_READ" "$ISSUE_NUM" 2>/dev/null); then
  exit 0
fi

# Parse fields from JSON
ACTIVE_SKILLS=$(printf '%s\n' "$STATE" | jq -r '.active_skills // [] | map("/" + .) | join(" ")' 2>/dev/null) || exit 0
STEP=$(printf '%s\n' "$STATE" | jq -r '.step // empty' 2>/dev/null) || true
STEP_LABEL=$(printf '%s\n' "$STATE" | jq -r '.step_label // empty' 2>/dev/null) || true
PHASE=$(printf '%s\n' "$STATE" | jq -r '.phase // empty' 2>/dev/null) || true
WIGGUM_STEP=$(printf '%s\n' "$STATE" | jq -r '.wiggum_step // empty' 2>/dev/null) || true
WIGGUM_STEP_LABEL=$(printf '%s\n' "$STATE" | jq -r '.wiggum_step_label // empty' 2>/dev/null) || true

# Output recovery instructions
if [ -n "$ACTIVE_SKILLS" ]; then
  printf 'COMPACTION RECOVERY: Reload active skills: %s\n' "$ACTIVE_SKILLS"
fi

if [ -n "$STEP" ]; then
  printf '\nWORKFLOW STATE:\n'
  printf '  Step %s: %s (phase: %s)\n' "$STEP" "${STEP_LABEL:-unknown}" "${PHASE:-unknown}"
  if [ -n "$WIGGUM_STEP" ]; then
    printf '  Wiggum Step %s: %s\n' "$WIGGUM_STEP" "${WIGGUM_STEP_LABEL:-unknown}"
  fi
  printf 'Resume workflow from the current step after reloading skills.\n'
fi

exit 0
