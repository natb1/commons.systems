#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
SCRIPTS="$(cd "$(dirname "$0")" && pwd)"

# shellcheck source=lib.sh
source "$SCRIPTS/lib.sh"

# Parse options
declare -A DIRTY_APPS
EXPLICIT=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app)
      [[ $# -lt 2 ]] && { echo "Error: --app requires an argument" >&2; exit 1; }
      DIRTY_APPS["$2"]=1
      EXPLICIT=true
      shift 2
      ;;
    *)
      echo "Usage: run-typecheck.sh [--app <dir>]" >&2
      exit 1
      ;;
  esac
done

# Auto-detect mode: delegate workspace detection to get-changed-apps.sh.
if [ "$EXPLICIT" = false ]; then
  if ! CHANGED_APPS=$("$SCRIPTS/get-changed-apps.sh"); then
    echo "ERROR: get-changed-apps.sh failed" >&2
    exit 1
  fi
  while IFS= read -r app; do
    [ -z "$app" ] && continue
    DIRTY_APPS["$app"]=1
  done <<< "$CHANGED_APPS"
fi

# Filter rules-test: excluded from vitest workspace projects and from typecheck.
# (rules-test ships .ts files but its tsconfig is geared at the Firebase
# rules-test harness, not standalone tsc --noEmit.)
if [[ -n "${DIRTY_APPS[rules-test]+x}" ]]; then
  echo "Note: rules-test excluded from typecheck (matches run-unit-tests.sh)" >&2
fi
unset 'DIRTY_APPS[rules-test]'
APP_DIRS=("${!DIRTY_APPS[@]}")

if [ ${#APP_DIRS[@]} -eq 0 ]; then
  echo "No typecheck targets matched changed files. Nothing to check."
  exit 0
fi

# Pre-flight guard: the script mutates the working tree via
# `git checkout origin/main -- <ws>`, which can clobber pending changes
# inside any workspace we're about to swap. Untracked files and changes
# outside the swapped workspaces are not at risk and are tolerated.
DIRTY_WORKSPACES=()
for ws in "${APP_DIRS[@]}"; do
  if [ -n "$(git -C "$REPO_ROOT" status --porcelain -- "$ws")" ]; then
    DIRTY_WORKSPACES+=("$ws")
  fi
done
if [ ${#DIRTY_WORKSPACES[@]} -gt 0 ]; then
  echo "ERROR: working tree has uncommitted changes in workspaces being typechecked:" >&2
  printf '  %s\n' "${DIRTY_WORKSPACES[@]}" >&2
  echo "run-typecheck.sh swaps workspace files via git checkout; commit or stash first." >&2
  exit 1
fi

# Cleanup trap: restore HEAD for any workspace we touched, even on mid-script
# failure. `git checkout HEAD -- <ws>` is idempotent when nothing differs.
TOUCHED_WORKSPACES=()
cleanup() {
  local rc=$?
  local ws
  for ws in "${TOUCHED_WORKSPACES[@]:-}"; do
    [ -z "$ws" ] && continue
    git -C "$REPO_ROOT" checkout HEAD -- "$ws" 2>/dev/null || true
  done
  exit $rc
}
trap cleanup EXIT INT TERM

# Make sure origin/main is available locally. Idempotent — CI checkouts
# with fetch-depth: 0 already have it.
git -C "$REPO_ROOT" fetch origin main --quiet 2>/dev/null || \
  git -C "$REPO_ROOT" fetch origin main || true

# Install workspace dependencies once before any tsc invocation.
ensure_deps

REGRESSIONS=()

for ws in "${APP_DIRS[@]}"; do
  echo "=== Typecheck: $ws ==="

  baseline_pass=true
  is_new_workspace=false

  if ! git -C "$REPO_ROOT" rev-parse --verify "origin/main:$ws" >/dev/null 2>&1; then
    # New workspace (no origin/main baseline) — treat as baseline-passed.
    is_new_workspace=true
    echo "$ws: new workspace (no origin/main baseline) — typechecking on HEAD"
  else
    TOUCHED_WORKSPACES+=("$ws")
    git -C "$REPO_ROOT" checkout origin/main -- "$ws"

    if (cd "$REPO_ROOT" && npx tsc --noEmit --project "$ws") >/dev/null 2>&1; then
      baseline_pass=true
    else
      baseline_pass=false
    fi

    # Restore HEAD version immediately; don't wait for the trap.
    git -C "$REPO_ROOT" checkout HEAD -- "$ws"
  fi

  if [ "$baseline_pass" = false ]; then
    echo "$ws: skipping — origin/main has pre-existing typecheck errors"
    continue
  fi

  # Baseline clean (or new workspace) — HEAD must typecheck cleanly too.
  if (cd "$REPO_ROOT" && npx tsc --noEmit --project "$ws"); then
    if [ "$is_new_workspace" = true ]; then
      echo "$ws: typecheck passed (new workspace)"
    else
      echo "$ws: typecheck passed"
    fi
  else
    echo "$ws: typecheck FAILED" >&2
    REGRESSIONS+=("$ws")
  fi
done

if [ ${#REGRESSIONS[@]} -gt 0 ]; then
  echo "" >&2
  echo "Typecheck regressions in: ${REGRESSIONS[*]}" >&2
  echo "These workspaces typecheck cleanly on origin/main but fail on HEAD." >&2
  exit 1
fi

echo "All typecheck targets passed."
