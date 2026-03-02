#!/usr/bin/env bash
set -euo pipefail

# Detect changed file categories for CI conditional tool installation.
# Outputs "nix=true" and/or "rules=true" to $GITHUB_OUTPUT when relevant
# files changed on the branch relative to origin/main.

# Try origin/main first; fall back to HEAD~1 when origin/main is unavailable
# (e.g., shallow clones or direct pushes to non-feature branches).
if CHANGED=$(git diff --name-only origin/main...HEAD 2>/dev/null); then
  : # success
elif CHANGED=$(git diff --name-only HEAD~1...HEAD 2>/dev/null); then
  echo "::warning::Could not diff against origin/main, falling back to HEAD~1"
else
  echo "::error::Could not determine changed files via git diff; tool install conditions will not trigger"
  CHANGED=""
fi

if echo "$CHANGED" | grep -qE '^(nix/|flake\.nix$|flake\.lock$)'; then
  echo "nix=true" >> "$GITHUB_OUTPUT"
fi
if echo "$CHANGED" | grep -qx 'firestore.rules'; then
  echo "rules=true" >> "$GITHUB_OUTPUT"
fi
