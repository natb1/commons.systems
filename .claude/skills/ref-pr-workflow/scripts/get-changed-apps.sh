#!/usr/bin/env bash
set -euo pipefail

# Outputs one changed app name per line based on git diff.
# An "app" is a workspace listed in the root package.json.
#
# Usage: get-changed-apps.sh [--base <ref>]
#   --base <ref>  Override comparison base (default: origin/main)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT=$(git rev-parse --show-toplevel)

# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

BASE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)
      [[ $# -lt 2 ]] && { echo "Error: --base requires an argument" >&2; exit 1; }
      BASE="$2"
      shift 2
      ;;
    *)
      echo "Usage: get-changed-apps.sh [--base <ref>]" >&2
      exit 1
      ;;
  esac
done

if [ -z "$BASE" ]; then
  BASE="origin/main"
fi

if ! CHANGED=$(git diff --name-only "$BASE"...HEAD); then
  echo "ERROR: could not diff against $BASE" >&2
  exit 1
fi

if [ -z "$CHANGED" ]; then
  exit 0
fi

printf '%s\n' "$CHANGED" | resolve_dirty_apps "$REPO_ROOT" | sort
