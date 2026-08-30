#!/usr/bin/env bash
set -euo pipefail

# Outputs one changed app name per line based on git diff.
# An "app" is a workspace listed in the root package.json.
#
# Usage: get-changed-apps.sh [--base <ref>] [--all]
#   --base <ref>  Override comparison base (default: origin/main)
#   --all         List every workspace, without diffing at all
#
# With no --base the baseline is resolved by resolve-diff-base.sh, which
# hard-errors rather than yielding a baseline it cannot justify. An explicit
# --base is taken at face value under plain merge-base semantics. See the block
# above the diff below.

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
# SCOPE — this fixes the WORKSPACE LIST those consumers receive, and nothing
# else about how they use it. run-typecheck.sh in particular carries a SECOND,
# independent baseline: it stages a reference copy of each workspace with
# `git checkout <base> -- <ws>` to tell a regression from a pre-existing
# failure. That is a tree, not a file list, and it went vacuous on a push to
# `main` for the same reason. It is resolved separately, at
# run-typecheck.sh:131 — fixing this call site would not have fixed it.
#
# An explicit --base is NOT routed through that helper at all. --at-remote-tip
# is a statement about the REMOTE TIP — "HEAD is sitting where origin/main
# points, so use HEAD^1" — and an explicit base is not a remote tip, so its
# fallback must not apply. The two explicit callers show why:
#
#   run-all-cleanup-preview.sh:13    --base HEAD~1
#   run-all-prod-deploy-smoke.sh:20  --base "$DIFF_BASE"  (the last-prod-deploy
#                                    tag: the last commit successfully deployed)
#
# On a re-run where the last-prod-deploy tag already equals HEAD, the correct
# answer is "nothing new to deploy" — an empty change set, which the `exit 0`
# below already expresses. Routing it through --at-remote-tip first-parent
# silently rewrites the base to HEAD^1 and REDEPLOYS the last commit to
# production; if the tag is ahead of HEAD it deploys backwards.
#
# So an explicit base gets plain merge-base semantics — the same left-hand side
# `"$BASE"...HEAD` used to compute — and an empty range is a legitimate
# "nothing to do", neither a fallback nor a hard failure. A base that does not
# resolve, or shares no history with HEAD, still errors loudly (git says why).
if [ -z "$BASE" ]; then
  BASE=$("$SCRIPT_DIR/resolve-diff-base.sh" --repo-root "$REPO_ROOT" --at-remote-tip first-parent)
else
  EXPLICIT_BASE="$BASE"
  if ! BASE=$(git -C "$REPO_ROOT" merge-base "$EXPLICIT_BASE" HEAD 2>&1); then
    echo "ERROR: no merge base between '$EXPLICIT_BASE' and HEAD in $REPO_ROOT" >&2
    echo "git said: $BASE" >&2
    exit 1
  fi
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
