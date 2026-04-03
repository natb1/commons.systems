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
RUN_CI_SCRIPTS=false
RUN_PR_SCRIPTS=false
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
    --ci-scripts)
      RUN_CI_SCRIPTS=true
      EXPLICIT=true
      shift
      ;;
    --pr-scripts)
      RUN_PR_SCRIPTS=true
      EXPLICIT=true
      shift
      ;;
    *)
      echo "Usage: run-unit-tests.sh [--app <dir>] [--nix] [--rules] [--ci-scripts] [--pr-scripts]" >&2
      exit 1
      ;;
  esac
done

# Auto-detect mode: delegate app detection to get-changed-apps.sh,
# then check nix/rules/ci-scripts inline (those aren't app-level concerns).
if [ "$EXPLICIT" = false ]; then
  if ! CHANGED_APPS=$("$SCRIPTS/get-changed-apps.sh"); then
    echo "ERROR: get-changed-apps.sh failed" >&2
    exit 1
  fi
  while IFS= read -r app; do
    [ -z "$app" ] && continue
    DIRTY_APPS["$app"]=1
  done <<< "$CHANGED_APPS"

  # Detect nix, rules, and ci-scripts changes separately
  if ! CHANGED=$(git diff --name-only origin/main...HEAD); then
    echo "ERROR: could not diff against origin/main" >&2
    exit 1
  fi
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    case "$file" in
      nix/*|flake.nix|flake.lock) RUN_NIX=true ;;
      firestore.rules) RUN_RULES=true ;;
      .github/scripts/*) RUN_CI_SCRIPTS=true ;;
      .claude/skills/ref-pr-workflow/scripts/*) RUN_PR_SCRIPTS=true ;;
    esac
  done <<< "$CHANGED"
fi

# Filter rules-test: it requires Firebase emulators and is not a vitest workspace project
unset 'DIRTY_APPS[rules-test]'
APP_DIRS=("${!DIRTY_APPS[@]}")
FAILURES=()

# Install all dependencies once at the workspace root (skip when only running nix/rules/ci-scripts checks)
if [ ${#APP_DIRS[@]} -gt 0 ]; then
  ensure_deps
fi

# Run app unit tests via vitest workspace projects
if [ ${#APP_DIRS[@]} -gt 0 ]; then
  echo "=== Unit tests: ${APP_DIRS[*]} ==="
  PROJECT_ARGS=()
  for dir in "${APP_DIRS[@]}"; do
    PROJECT_ARGS+=(--project "$dir")
  done
  if npx vitest run "${PROJECT_ARGS[@]}" --root "$REPO_ROOT"; then
    echo "PASS: ${APP_DIRS[*]}"
  else
    echo "FAIL: ${APP_DIRS[*]}" >&2
    FAILURES+=("vitest(${APP_DIRS[*]})")
  fi
fi

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

# Run CI scripts tests
if [ "$RUN_CI_SCRIPTS" = true ]; then
  echo "=== CI scripts tests ==="
  if "$REPO_ROOT/.github/scripts/test-firebase-auth.sh"; then
    echo "PASS: CI scripts"
  else
    echo "FAIL: CI scripts" >&2
    FAILURES+=(ci-scripts)
  fi
fi

# Run PR workflow script tests (skip test-helpers.sh and test-issue-state-scripts.sh which requires Firestore emulator)
if [ "$RUN_PR_SCRIPTS" = true ]; then
  echo "=== PR workflow script tests ==="
  PR_SCRIPT_FAIL=false
  for test_script in "$SCRIPTS"/test-*.sh; do
    name=$(basename "$test_script")
    [[ "$name" == "test-helpers.sh" ]] && continue
    [[ "$name" == "test-issue-state-scripts.sh" ]] && continue
    echo "--- $name ---"
    if "$test_script"; then
      echo "PASS: $name"
    else
      echo "FAIL: $name" >&2
      PR_SCRIPT_FAIL=true
    fi
  done
  if [ "$PR_SCRIPT_FAIL" = true ]; then
    FAILURES+=(pr-scripts)
  fi
fi

if [ ${#APP_DIRS[@]} -eq 0 ] && [ "$RUN_NIX" = false ] && [ "$RUN_RULES" = false ] && [ "$RUN_CI_SCRIPTS" = false ] && [ "$RUN_PR_SCRIPTS" = false ]; then
  echo "No test suites matched changed files. Nothing to check."
  exit 0
fi

if [ ${#FAILURES[@]} -gt 0 ]; then
  echo "Failed suites: ${FAILURES[*]}" >&2
  exit 1
fi

echo "All unit test suites passed."
