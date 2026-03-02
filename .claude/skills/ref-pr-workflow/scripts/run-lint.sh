#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
SCRIPTS="$(cd "$(dirname "$0")" && pwd)"

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
      echo "Usage: run-lint.sh [--app <dir>] [--nix] [--rules]" >&2
      exit 1
      ;;
  esac
done

# Auto-detect mode: derive targets from changed files vs origin/main
if [ "$EXPLICIT" = false ]; then
  if ! CHANGED=$(git diff --name-only origin/main...HEAD 2>/dev/null); then
    if ! CHANGED=$(git diff --name-only HEAD~1...HEAD 2>/dev/null); then
      echo "WARNING: could not determine changed files; running all app checks as fallback" >&2
      for dir in "$REPO_ROOT"/*/; do
        base=$(basename "$dir")
        [ -f "$dir/package.json" ] && [ -f "$dir/package-lock.json" ] && DIRTY_APPS["$base"]=1
      done
      CHANGED=""
    fi
  fi

  while IFS= read -r file; do
    [ -z "$file" ] && continue
    top_dir="${file%%/*}"
    case "$file" in
      nix/*|flake.nix|flake.lock)
        RUN_NIX=true
        ;;
      firestore.rules)
        RUN_RULES=true
        ;;
      .claude/skills/ref-pr-workflow/scripts/*)
        # Scripts changed: lint all top-level app dirs with package.json and package-lock.json
        for dir in "$REPO_ROOT"/*/; do
          base=$(basename "$dir")
          [ -f "$dir/package.json" ] && [ -f "$dir/package-lock.json" ] && DIRTY_APPS["$base"]=1
        done
        ;;
      authutil/*)
        DIRTY_APPS[authutil]=1
        DIRTY_APPS[landing]=1
        ;;
      firestoreutil/*)
        DIRTY_APPS[firestoreutil]=1
        DIRTY_APPS[landing]=1
        ;;
      firebaseutil/*|style/*)
        DIRTY_APPS[landing]=1
        ;;
      *)
        # Generic: any new app dir with package.json and package-lock.json gets lint.
        # Requires package-lock.json (npm ci will fail without it). Dirs with only package.json
        # but no lock file (e.g. style/) must be handled by named cases above.
        [ -f "$REPO_ROOT/$top_dir/package.json" ] && [ -f "$REPO_ROOT/$top_dir/package-lock.json" ] && DIRTY_APPS["$top_dir"]=1
        ;;
    esac
  done <<< "$CHANGED"
fi

APP_DIRS=("${!DIRTY_APPS[@]}")
FAILURES=()

# Run eslint on detected app dirs
for dir in "${APP_DIRS[@]}"; do
  echo "=== Lint: $dir ==="
  if (cd "$REPO_ROOT/$dir" && npm ci && npx eslint src/); then
    echo "PASS: $dir"
  else
    echo "FAIL: $dir" >&2
    FAILURES+=("$dir")
  fi
done

# Run nix flake check
if [ "$RUN_NIX" = true ]; then
  echo "=== nix flake check ==="
  if nix flake check "$REPO_ROOT"; then
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
  echo "No lint targets matched changed files. Nothing to check."
  exit 0
fi

if [ ${#FAILURES[@]} -gt 0 ]; then
  echo "Failed suites: ${FAILURES[*]}" >&2
  exit 1
fi

echo "All lint checks passed."
