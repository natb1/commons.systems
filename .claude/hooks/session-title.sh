#!/usr/bin/env bash
# Set the Claude session title to the basename of the worktree's checkout dir,
# so concurrent sessions across worktrees are distinguishable in the Remote
# Control list, mobile app, and `claude --resume` picker.
# Bound to SessionStart (default + clear matcher). See issue #825.
# Always exits 0 — never blocks session startup.
set -uo pipefail
trap 'echo "[session-title] WARNING: unexpected error on line $LINENO" >&2; exit 0' ERR

top=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
[ -n "$top" ] || exit 0

name=$(basename "$top")
[ -n "$name" ] || exit 0

# The basename is a git branch slug — characters are restricted to
# [A-Za-z0-9._-], so JSON-inlining without escaping is safe.
printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","sessionTitle":"%s"}}\n' "$name"

exit 0
