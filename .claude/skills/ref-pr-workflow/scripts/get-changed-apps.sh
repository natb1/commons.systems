#!/usr/bin/env bash
set -euo pipefail

# Outputs one changed app name per line based on git diff.
# An "app" is a top-level directory containing both package.json and package-lock.json.
#
# Usage: get-changed-apps.sh [--base <ref>]
#   --base <ref>  Override comparison base (default: origin/main)

REPO_ROOT=$(git rev-parse --show-toplevel)

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

# Determine changed files
if [ -z "$BASE" ]; then
  BASE="origin/main"
fi

if ! CHANGED=$(git diff --name-only "$BASE"...HEAD); then
  echo "ERROR: could not diff against $BASE" >&2
  exit 1
fi

# Discover all apps (top-level dirs with both package.json and package-lock.json)
declare -A ALL_APPS
for dir in "$REPO_ROOT"/*/; do
  base=$(basename "$dir")
  [ -f "$dir/package.json" ] && [ -f "$dir/package-lock.json" ] && ALL_APPS["$base"]=1
done

# No changed files — nothing to output
if [ -z "$CHANGED" ]; then
  exit 0
fi

# Build a map of shared packages to their dependents by scanning package.json for file: references
declare -A SHARED_PKGS
for app in "${!ALL_APPS[@]}"; do
  pkg="$REPO_ROOT/$app/package.json"
  # Extract file: dependency paths (e.g. "file:../authutil" -> "authutil")
  while IFS= read -r dep_dir; do
    [ -z "$dep_dir" ] && continue
    SHARED_PKGS["$dep_dir"]+="$app "
  done < <(grep -o '"file:\.\./[^"]*"' "$pkg" 2>/dev/null | sed 's/"file:\.\.\/\(.*\)"/\1/' || true)
done

declare -A DIRTY_APPS

while IFS= read -r file; do
  [ -z "$file" ] && continue
  top_dir="${file%%/*}"
  case "$file" in
    .claude/skills/ref-pr-workflow/scripts/*|firebase.json|firestore.rules)
      # Global triggers: mark all apps
      for app in "${!ALL_APPS[@]}"; do
        DIRTY_APPS["$app"]=1
      done
      ;;
    *)
      # Check if this is a shared package change
      if [ -n "${SHARED_PKGS[$top_dir]+x}" ]; then
        for app in ${SHARED_PKGS[$top_dir]}; do
          DIRTY_APPS["$app"]=1
        done
      fi
      # Check if this is a direct app change
      if [ -n "${ALL_APPS[$top_dir]+x}" ]; then
        DIRTY_APPS["$top_dir"]=1
      fi
      ;;
  esac
done <<< "$CHANGED"

for app in "${!DIRTY_APPS[@]}"; do
  echo "$app"
done | sort
