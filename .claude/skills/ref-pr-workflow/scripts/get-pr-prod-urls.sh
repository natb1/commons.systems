#!/usr/bin/env bash
set -euo pipefail

# Resolve production URLs for apps changed in a merged PR.
# Uses gh pr diff (works for merged PRs from any branch context) instead of
# git diff, which requires local refs that may not exist post-merge.
#
# Usage: get-pr-prod-urls.sh <pr-number>
# Output: one line per app: <app-name> <production-url>
# Exit 0 with no output if no changed apps have hosting targets.

PR_NUM="${1:?Usage: get-pr-prod-urls.sh <pr-number>}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT=$(git rev-parse --show-toplevel)

# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

# Get changed files from the PR (works for merged PRs)
CHANGED=$(gh pr diff "$PR_NUM" --name-only)

if [ -z "$CHANGED" ]; then
  exit 0
fi

# Discover all apps from workspace list in root package.json
declare -A ALL_APPS
if ! workspace_list=$(jq -r '.workspaces[]' "$REPO_ROOT/package.json"); then
  echo "ERROR: failed to read workspaces from $REPO_ROOT/package.json" >&2
  exit 1
fi

while IFS= read -r ws; do
  [ -z "$ws" ] && continue
  ALL_APPS["$ws"]=1
done <<< "$workspace_list"

if [ ${#ALL_APPS[@]} -eq 0 ]; then
  echo "ERROR: no workspaces found in $REPO_ROOT/package.json" >&2
  exit 1
fi

# Build reverse dependency map: shared package -> consuming apps
declare -A SHARED_PKGS
for app in "${!ALL_APPS[@]}"; do
  pkg="$REPO_ROOT/$app/package.json"
  if ! dep_list=$(jq -r '(.dependencies // {}) + (.devDependencies // {}) + (.peerDependencies // {}) | keys[] | select(startswith("@commons-systems/")) | sub("@commons-systems/"; "")' "$pkg"); then
    echo "ERROR: failed to read dependencies from $pkg" >&2
    exit 1
  fi
  while IFS= read -r dep_dir; do
    [ -z "$dep_dir" ] && continue
    SHARED_PKGS["$dep_dir"]+="$app "
  done <<< "$dep_list"
done

declare -A DIRTY_APPS

while IFS= read -r file; do
  [ -z "$file" ] && continue
  top_dir="${file%%/*}"
  case "$file" in
    firebase.json|firestore.rules|storage.rules|package.json|package-lock.json)
      for app in "${!ALL_APPS[@]}"; do
        DIRTY_APPS["$app"]=1
      done
      ;;
    *)
      if [ -n "${SHARED_PKGS[$top_dir]+x}" ]; then
        for app in ${SHARED_PKGS[$top_dir]}; do
          DIRTY_APPS["$app"]=1
        done
      fi
      if [ -n "${ALL_APPS[$top_dir]+x}" ]; then
        DIRTY_APPS["$top_dir"]=1
      fi
      ;;
  esac
done <<< "$CHANGED"

# Output only apps with hosting targets, with their production URLs
for app in "${!DIRTY_APPS[@]}"; do
  if SITE=$(get_hosting_site "$REPO_ROOT" "$app" 2>/dev/null); then
    echo "$app https://${SITE}.web.app"
  fi
done | sort
