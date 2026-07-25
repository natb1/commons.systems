#!/usr/bin/env bash
# audit-copy-changes.sh — enumerate merged diffs touching in-scope copy paths
# over a commit range, so the office-hours owner audit of the copy-approval
# signal (strategy-author-approved-copy) is a repeatable, bounded enumeration
# rather than unbounded git archaeology.
#
# strategy-author-approved-copy requires that every merged change to in-scope
# copy trace to a recorded author approval. Its success signal is an "owner
# audit of merged copy changes at office-hours." This script IS the instrument
# that makes that sensor runnable: it lists each in-scope copy file changed in
# the range together with the commit(s) that touched it, so the owner can jump
# to each change and check it against the approval record (a completed gate
# tactic or a dated clarifications entry on the strategy).
#
# What this script does NOT do (deliberately out of scope):
#   - It does NOT judge whether a change was *approved*. That stays a human
#     check against the graph at office-hours. This script enumerates the
#     changes the audit must review, not their approval status.
#   - It does NOT gate or block anything in CI. Enumeration is report-only; it
#     always exits 0 (a non-empty result is a normal audit finding, not a
#     failure).
#
# Usage:
#   audit-copy-changes.sh [--base <ref>] [--head <ref>]
#     --base <ref>  Range base (default: origin/main).
#     --head <ref>  Range head (default: HEAD).
#
#   The range uses the three-dot merge-base form ("$BASE"..."$HEAD"), matching
#   detect-changes.sh and get-changed-apps.sh: changes are enumerated relative
#   to where HEAD diverged from BASE.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)
cd "$REPO_ROOT"

BASE="origin/main"
HEAD_REF="HEAD"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)
      [[ $# -lt 2 ]] && { echo "Error: --base requires an argument" >&2; exit 1; }
      BASE="$2"
      shift 2
      ;;
    --head)
      [[ $# -lt 2 ]] && { echo "Error: --head requires an argument" >&2; exit 1; }
      HEAD_REF="$2"
      shift 2
      ;;
    *)
      echo "Usage: audit-copy-changes.sh [--base <ref>] [--head <ref>]" >&2
      exit 1
      ;;
  esac
done

# ---------------------------------------------------------------------------
# In-scope copy path allowlist — THE SINGLE PLACE to widen scope.
#
# Grounded in strategy-author-approved-copy's scope clarification: in-scope
# copy is landing, the about page, app heroes and onboarding text, the README,
# and blog posts. Explicitly EXCLUDED (and therefore absent below): in-app UI
# strings, practitioner reference docs (intentions/kind-kind.md, package
# READMEs), and GitHub issue/PR prose.
#
# When a later strategy clarification widens in-scope copy, edit this one
# block — nothing else in the script encodes scope.
#
# Each entry is an anchored ERE matched against a repo-relative path:
#   ^README\.md$                 the README (project front-door copy)
#   ^landing/post/               landing blog posts (landing/post/*.md)
#   ^fellspiral/post/            fellspiral blog posts (fellspiral/post/*.md)
#   ^landing/index\.html$        landing site shell (narrative copy)
#   ^fellspiral/index\.html$     fellspiral site shell (narrative copy)
#   ^landing/src/pages/          landing narrative pages (About.tsx lives here)
#   ^landing/src/hero-config\.tsx$   landing hero copy
#   ^landing/src/site-config\.ts$    landing onboarding/site copy
#   ^fellspiral/src/site-config\.ts$ fellspiral onboarding/site copy
# ---------------------------------------------------------------------------
COPY_PATH_ALLOWLIST='^README\.md$|^landing/post/|^fellspiral/post/|^landing/index\.html$|^fellspiral/index\.html$|^landing/src/pages/|^landing/src/hero-config\.tsx$|^landing/src/site-config\.ts$|^fellspiral/src/site-config\.ts$'

RANGE="$BASE...$HEAD_REF"

if ! CHANGED=$(git diff --name-only "$BASE"..."$HEAD_REF"); then
  echo "ERROR: could not diff $RANGE (are BASE and HEAD valid refs?)" >&2
  exit 1
fi

# Filter to in-scope copy paths. grep -E returns exit 1 when nothing matches;
# under set -e we must not let that empty-match abort the script.
COPY_CHANGED=$(printf '%s\n' "$CHANGED" | grep -E "$COPY_PATH_ALLOWLIST" || true)

if [ -z "$COPY_CHANGED" ]; then
  echo "no in-scope copy changes in $RANGE"
  exit 0
fi

echo "In-scope copy changes in $RANGE (review each against the approval record):"
echo
while IFS= read -r file; do
  [ -z "$file" ] && continue
  echo "$file"
  git log --oneline "$BASE".."$HEAD_REF" -- "$file" | sed 's/^/  /'
  echo
done <<<"$COPY_CHANGED"

exit 0
