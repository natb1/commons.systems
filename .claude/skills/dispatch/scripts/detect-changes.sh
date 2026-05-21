#!/usr/bin/env bash
set -euo pipefail

# Detect changed file categories for CI conditional tool installation.
# Outputs "nix=true", "playwright=true", "rules=true", and/or "go=true" to
# $GITHUB_OUTPUT when relevant files changed on the branch relative to
# origin/main.

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
# playwright-version-sync re-runs when either side of the chromium pin moves —
# package-lock.json catches @playwright/test bumps, flake.lock catches nixpkgs
# playwright-driver bumps, and the script itself is included for self-edits.
if echo "$CHANGED" | grep -qE '^(package-lock\.json$|flake\.lock$|\.github/scripts/check-playwright-version-sync\.sh$)'; then
  echo "playwright=true" >> "$GITHUB_OUTPUT"
fi
# rules-test needs Java 21 for Firebase emulators. Set rules=true when rules-test
# would be detected as dirty: direct changes, or any global trigger from
# get-changed-apps.sh (those mark ALL workspaces dirty, including rules-test).
if echo "$CHANGED" | grep -qE '^(firestore\.rules$|storage\.rules$|rules-test/|\.claude/skills/dispatch/scripts/|firebase\.json$|package\.json$|package-lock\.json$)'; then
  echo "rules=true" >> "$GITHUB_OUTPUT"
fi
# go-tests needs the Go toolchain. Set go=true when a changed file is under a
# discovered Go module. list-go-modules.sh discovers module roots from go.mod
# locations, so a new Go module needs no edit here.
GO_MODULE_PREFIXES=$("$(dirname "$0")/list-go-modules.sh" | sed 's|$|/|')
if [ -n "$GO_MODULE_PREFIXES" ]; then
  GO_REGEX=$(printf '%s\n' "$GO_MODULE_PREFIXES" | paste -sd'|' -)
  if echo "$CHANGED" | grep -qE "^($GO_REGEX)"; then
    echo "go=true" >> "$GITHUB_OUTPUT"
  fi
fi
