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
RUN_TOKEN_AUDIT_SCRIPTS=false
RUN_FILE_ISSUE_SCRIPTS=false
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
    --token-audit-scripts)
      RUN_TOKEN_AUDIT_SCRIPTS=true
      EXPLICIT=true
      shift
      ;;
    --file-issue-scripts)
      RUN_FILE_ISSUE_SCRIPTS=true
      EXPLICIT=true
      shift
      ;;
    *)
      echo "Usage: run-unit-tests.sh [--app <dir>] [--nix] [--rules] [--ci-scripts] [--pr-scripts] [--token-audit-scripts] [--file-issue-scripts]" >&2
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

  # Detect nix, rules, and ci-scripts changes separately.
  #
  # The baseline comes from resolve-diff-base.sh rather than being spelt
  # `origin/main...HEAD` inline. --at-remote-tip first-parent because this
  # script runs on pushes to `main` too, where actions/checkout leaves
  # origin/main pointing AT the pushed commit: the three-dot diff is then
  # EMPTY, RUN_CI_SCRIPTS/RUN_PR_SCRIPTS stay false, and the run falls through
  # to "No test suites matched changed files. Nothing to check." with exit 0.
  # That made the post-merge unit-tests run structurally vacuous.
  #
  # This is a plain assignment, not `if ! X=$(...)`, so the helper's non-zero
  # exit propagates under `set -e` instead of being swallowed.
  DIFF_BASE=$("$SCRIPTS/resolve-diff-base.sh" --repo-root "$REPO_ROOT" --at-remote-tip first-parent)
  if ! CHANGED=$(git -C "$REPO_ROOT" diff --name-only "$DIFF_BASE"..HEAD); then
    echo "ERROR: could not diff ${DIFF_BASE}..HEAD in $REPO_ROOT" >&2
    exit 1
  fi
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    case "$file" in
      nix/*|flake.nix|flake.lock) RUN_NIX=true ;;
      firestore.rules) RUN_RULES=true ;;
      .github/scripts/*) RUN_CI_SCRIPTS=true ;;
      .claude/skills/dispatch-propagate/scripts/*) RUN_PR_SCRIPTS=true ;;
      .claude/skills/rsi-audit/scripts/*) RUN_TOKEN_AUDIT_SCRIPTS=true ;;
      .claude/skills/file-issue/scripts/*) RUN_FILE_ISSUE_SCRIPTS=true ;;
    esac
  done <<< "$CHANGED"
fi

# Filter rules-test: requires Firebase emulators (not supported by vitest run);
# also excluded from vitest workspace projects in vitest.config.ts
if [[ -n "${DIRTY_APPS[packages/rules-test]+x}" ]]; then
  echo "Warning: rules-test requires Firebase emulators; skipping from vitest run" >&2
fi
unset 'DIRTY_APPS[packages/rules-test]'
APP_DIRS=("${!DIRTY_APPS[@]}")
FAILURES=()

# Install all dependencies once at the workspace root (skip when only running
# nix/rules/ci-scripts checks). dispatch-derive-node-target's test suite shells
# out to `node --import tsx/esm`, so the PR-scripts path now needs node_modules
# too, not just a dirty app dir.
if [ ${#APP_DIRS[@]} -gt 0 ] || [ "$RUN_PR_SCRIPTS" = true ]; then
  ensure_deps
fi

# Build changed apps that have a build script, so build-dependent vitest
# tests (which read dist/index.html and skipIf it is absent) run their
# assertions instead of silently skipping.
if [ ${#APP_DIRS[@]} -gt 0 ]; then
  for dir in "${APP_DIRS[@]}"; do
    pkg="$REPO_ROOT/$dir/package.json"
    if [ -f "$pkg" ] && jq -e '.scripts.build' "$pkg" >/dev/null 2>&1; then
      echo "=== Build: $dir ==="
      if npm run build --prefix "$REPO_ROOT/$dir"; then
        echo "PASS: build($dir)"
      else
        echo "FAIL: build($dir)" >&2
        FAILURES+=("build($dir)")
      fi
    fi
  done
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
  CI_SCRIPT_FAIL=false
  for test_script in "$REPO_ROOT/.github/scripts"/test-*.sh; do
    name=$(basename "$test_script")
    echo "--- $name ---"
    if "$test_script"; then
      echo "PASS: $name"
    else
      echo "FAIL: $name" >&2
      CI_SCRIPT_FAIL=true
    fi
  done
  if [ "$CI_SCRIPT_FAIL" = true ]; then
    FAILURES+=(ci-scripts)
  fi
fi

# Run dispatch script tests (skip test-helpers.sh -- sourced library, not a test)
if [ "$RUN_PR_SCRIPTS" = true ]; then
  echo "=== Dispatch script tests ==="
  PR_SCRIPT_FAIL=false
  for test_script in "$SCRIPTS"/test-*.sh; do
    name=$(basename "$test_script")
    [[ "$name" == "test-helpers.sh" ]] && continue
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

# Run rsi-audit script tests (no test-helpers.sh in that dir)
if [ "$RUN_TOKEN_AUDIT_SCRIPTS" = true ]; then
  echo "=== RSI audit script tests ==="
  TOKEN_AUDIT_SCRIPTS="$REPO_ROOT/.claude/skills/rsi-audit/scripts"
  TOKEN_AUDIT_FAIL=false
  for test_script in "$TOKEN_AUDIT_SCRIPTS"/test-*.sh; do
    name=$(basename "$test_script")
    [[ "$name" == "test-helpers.sh" ]] && continue
    echo "--- $name ---"
    if "$test_script"; then
      echo "PASS: $name"
    else
      echo "FAIL: $name" >&2
      TOKEN_AUDIT_FAIL=true
    fi
  done
  if [ "$TOKEN_AUDIT_FAIL" = true ]; then
    FAILURES+=(token-audit-scripts)
  fi
fi

# Run file-issue script tests (skip test-helpers.sh if one ever exists)
if [ "$RUN_FILE_ISSUE_SCRIPTS" = true ]; then
  echo "=== File-issue script tests ==="
  FILE_ISSUE_SCRIPTS="$REPO_ROOT/.claude/skills/file-issue/scripts"
  FILE_ISSUE_FAIL=false
  for test_script in "$FILE_ISSUE_SCRIPTS"/test-*.sh; do
    name=$(basename "$test_script")
    [[ "$name" == "test-helpers.sh" ]] && continue
    echo "--- $name ---"
    if "$test_script"; then
      echo "PASS: $name"
    else
      echo "FAIL: $name" >&2
      FILE_ISSUE_FAIL=true
    fi
  done
  if [ "$FILE_ISSUE_FAIL" = true ]; then
    FAILURES+=(file-issue-scripts)
  fi
fi

if [ ${#APP_DIRS[@]} -eq 0 ] && [ "$RUN_NIX" = false ] && [ "$RUN_RULES" = false ] && [ "$RUN_CI_SCRIPTS" = false ] && [ "$RUN_PR_SCRIPTS" = false ] && [ "$RUN_TOKEN_AUDIT_SCRIPTS" = false ] && [ "$RUN_FILE_ISSUE_SCRIPTS" = false ]; then
  echo "No test suites matched changed files. Nothing to check."
  exit 0
fi

if [ ${#FAILURES[@]} -gt 0 ]; then
  echo "Failed suites: ${FAILURES[*]}" >&2
  exit 1
fi

echo "All unit test suites passed."
