#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
SCRIPTS="$(cd "$(dirname "$0")" && pwd)"

# shellcheck source=lib.sh
source "$SCRIPTS/lib.sh"

# Parse options
declare -A DIRTY_APPS
RUN_NIX=false
RUN_RULES=false
EXPLICIT=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app)
      [[ $# -lt 2 ]] && { echo "Error: --app requires an argument" >&2; exit 1; }
      DIRTY_APPS["$2"]=1
      EXPLICIT=true
      shift 2
      ;;
    --nix)
      RUN_NIX=true
      EXPLICIT=true
      shift
      ;;
    --rules)
      RUN_RULES=true
      EXPLICIT=true
      shift
      ;;
    *)
      echo "Usage: run-unit-tests.sh [--app <dir>] [--nix] [--rules]" >&2
      exit 1
      ;;
  esac
done

# Auto-detect mode: delegate app detection to get-changed-apps.sh,
# then check nix/rules inline (those aren't app-level concerns).
if [ "$EXPLICIT" = false ]; then
  while IFS= read -r app; do
    [ -z "$app" ] && continue
    DIRTY_APPS["$app"]=1
  done < <("$SCRIPTS/get-changed-apps.sh")

  # Detect nix and rules changes separately
  if ! CHANGED=$(git diff --name-only origin/main...HEAD); then
    echo "ERROR: could not diff against origin/main" >&2
    exit 1
  fi
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    case "$file" in
      nix/*|flake.nix|flake.lock) RUN_NIX=true ;;
      firestore.rules) RUN_RULES=true ;;
    esac
  done <<< "$CHANGED"
fi

APP_DIRS=("${!DIRTY_APPS[@]}")
FAILURES=()

# Install all dependencies once at the workspace root
if [ ${#APP_DIRS[@]} -gt 0 ]; then
  ensure_deps
fi

# Run app unit tests
for dir in "${APP_DIRS[@]}"; do
  echo "=== Unit tests: $dir ==="
  if (cd "$REPO_ROOT" && npm run -w "$dir" test); then
    echo "PASS: $dir"
  else
    echo "FAIL: $dir" >&2
    FAILURES+=("$dir")
  fi
done

# Run nix flake check
if [ "$RUN_NIX" = true ]; then
  echo "=== nix flake check ==="
  if nix flake check --impure "$REPO_ROOT"; then
    echo "PASS: nix flake check"
  else
    echo "FAIL: nix flake check" >&2
    FAILURES+=(nix)
  fi
fi

# Run rules syntax check
if [ "$RUN_RULES" = true ]; then
  echo "=== Firestore rules check ==="
  if "$SCRIPTS/run-rules-check.sh" "$REPO_ROOT"; then
    echo "PASS: firestore rules"
  else
    echo "FAIL: firestore rules" >&2
    FAILURES+=(rules)
  fi
fi

if [ ${#APP_DIRS[@]} -eq 0 ] && [ "$RUN_NIX" = false ] && [ "$RUN_RULES" = false ]; then
  echo "No test suites matched changed files. Nothing to check."
  exit 0
fi

if [ ${#FAILURES[@]} -gt 0 ]; then
  echo "Failed suites: ${FAILURES[*]}" >&2
  exit 1
fi

echo "All unit test suites passed."
