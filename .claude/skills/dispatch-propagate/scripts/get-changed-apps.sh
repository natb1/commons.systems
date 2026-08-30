#!/usr/bin/env bash
set -euo pipefail

# Outputs one changed app name per line based on git diff.
# An "app" is a workspace listed in the root package.json.
#
# Usage: get-changed-apps.sh [--base <ref>] [--all]
#   --base <ref>  Override comparison base (default: origin/main)
#   --all         List every workspace, without diffing at all
#
# The base is resolved by resolve-diff-base.sh, which hard-errors rather than
# yielding a baseline it cannot justify. See the block above the diff below.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT=$(git rev-parse --show-toplevel)

# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

BASE=""
ALL=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)
      [[ $# -lt 2 ]] && { echo "Error: --base requires an argument" >&2; exit 1; }
      BASE="$2"
      shift 2
      ;;
    --all)
      ALL=true
      shift
      ;;
    *)
      echo "Usage: get-changed-apps.sh [--base <ref>] [--all]" >&2
      exit 1
      ;;
  esac
done

if [ "$ALL" = true ]; then
  # Return every workspace — caller wants to deploy all apps
  jq -r '.workspaces[]' "$REPO_ROOT/package.json" | sort
  exit 0
fi

# Resolve the baseline through resolve-diff-base.sh instead of spelling it
# `"$BASE"...HEAD` inline. The three-dot form goes EMPTY whenever HEAD is
# already contained in the base — on every push to `main`, where
# actions/checkout leaves origin/main pointing at the pushed commit. This
# script's consumers (run-lint.sh, run-unit-tests.sh, run-typecheck.sh) read an
# empty result as "no dirty apps", so that pass ran no vitest, no eslint and no
# build while reporting success. --at-remote-tip first-parent asks the right
# question there: what did this push introduce.
#
# An explicit --base is still honoured; it is routed through the helper as the
# remote ref so the resolved value is merge-base(BASE, HEAD) — exactly the old
# side of the three-dot range it replaces, so `--base HEAD~1` (the one explicit
# caller, run-all-cleanup-preview.sh:13) means precisely what it meant before.
if [ -z "$BASE" ]; then
  BASE=$("$SCRIPT_DIR/resolve-diff-base.sh" --repo-root "$REPO_ROOT" --at-remote-tip first-parent)
else
  BASE=$("$SCRIPT_DIR/resolve-diff-base.sh" --repo-root "$REPO_ROOT" \
    --remote-ref "$BASE" --at-remote-tip first-parent)
fi

if ! CHANGED=$(git -C "$REPO_ROOT" diff --name-only "$BASE"..HEAD); then
  echo "ERROR: could not diff ${BASE}..HEAD in $REPO_ROOT" >&2
  exit 1
fi

if [ -z "$CHANGED" ]; then
  exit 0
fi

if ! DIRTY_APPS=$(printf '%s\n' "$CHANGED" | resolve_dirty_apps "$REPO_ROOT"); then
  echo "ERROR: failed to resolve changed apps (base: $BASE)" >&2
  exit 1
fi

if [ -n "$DIRTY_APPS" ]; then
  printf '%s\n' "$DIRTY_APPS" | sort
fi
