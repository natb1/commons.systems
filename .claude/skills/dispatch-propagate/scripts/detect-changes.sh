#!/usr/bin/env bash
set -euo pipefail

# Detect changed file categories for CI conditional tool installation.
# Outputs "nix=true", "playwright=true", "rules=true", "graph=true", and/or
# "go=true" to $GITHUB_OUTPUT when relevant files changed on the branch relative
# to origin/main.

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
if echo "$CHANGED" | grep -qE '^(firestore\.rules$|storage\.rules$|packages/rules-test/|\.claude/skills/dispatch-propagate/scripts/|firebase\.json$|package\.json$|package-lock\.json$)'; then
  echo "rules=true" >> "$GITHUB_OUTPUT"
fi
# storybook-smoke boots the packages/ds Storybook dev server. Trigger on any
# packages/ds change (a component, story, token, or .storybook config edit can
# break the dev bundle) and on edits to the smoke script itself.
if echo "$CHANGED" | grep -qE '^(packages/ds/|\.claude/skills/dispatch-propagate/scripts/run-storybook-smoke\.sh$)'; then
  echo "ds=true" >> "$GITHUB_OUTPUT"
fi
# artifact-check builds the published claude artifacts and asserts the artifact
# contract plus a from-disk render smoke. Trigger on any artifacts/ change, on
# packages/ds (the artifact bundles DS from source, so a token or component edit
# changes what ships), on intentions/ (the plan view bakes the store in at build
# time, so a graph change changes the built page), and on the runner script
# itself.
if echo "$CHANGED" | grep -qE '^(artifacts/|packages/ds/|intentions/|\.claude/skills/dispatch-propagate/scripts/run-artifact-check\.sh$)'; then
  echo "artifact=true" >> "$GITHUB_OUTPUT"
fi
# dead-code check runs knip at repo root — any TS/JS/knip-config change can
# orphan code elsewhere, so trigger on any such change across the repo.
if echo "$CHANGED" | grep -qE '\.(ts|tsx|js|jsx|mjs|cjs)$|^knip\.(json|jsonc|ts)$'; then
  echo "deadcode=true" >> "$GITHUB_OUTPUT"
fi
# graph-validate runs validate-graph.ts, the rule set the graph write path's
# `guard` job runs. graph-fast-path.yml only triggers on graph/** pushes, so a
# change to the validator (or to the graph state it reads) is NOT exercised by
# the CI of the PR that makes it -- it first executes on the next unrelated
# writer's scratch branch, where a failure denies every graph write in the repo
# (the 2026-08-14 outage). Trigger on the package that owns the validator and on
# the graph state itself.
if echo "$CHANGED" | grep -qE '^(packages/intentionsutil/|intentions/)'; then
  echo "graph=true" >> "$GITHUB_OUTPUT"
fi
# go-tests needs the Go toolchain. Set go=true when a changed file is under a
# discovered Go module. list-go-modules.sh discovers module roots from go.mod
# locations, so a new Go module needs no edit here. The root go.work / go.work.sum
# files sit under no module prefix, yet they define the workspace every module
# builds in — a change to them must still run go-tests, so match them directly.
GO_MODULE_PREFIXES=$("$(dirname "$0")/list-go-modules.sh" | sed 's|$|/|')
GO_REGEX='^go\.work(\.sum)?$'
if [ -n "$GO_MODULE_PREFIXES" ]; then
  GO_REGEX="$GO_REGEX|^($(printf '%s\n' "$GO_MODULE_PREFIXES" | paste -sd'|' -))"
fi
if echo "$CHANGED" | grep -qE "$GO_REGEX"; then
  echo "go=true" >> "$GITHUB_OUTPUT"
fi
