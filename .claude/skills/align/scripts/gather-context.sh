#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"
# shellcheck source=../../dispatch-propagate/scripts/lib.sh
source "$REPO_ROOT/.claude/skills/dispatch-propagate/scripts/lib.sh"

OUTPUT="$REPO_ROOT/tmp/align-context.txt"
# Pre-create the file owner-only: it now holds analytics data (Search Console
# queries, traffic) that should not be world-readable. A later '>' redirect
# truncates but preserves the existing mode, so 0600 sticks.
mkdir -p "$(dirname "$OUTPUT")"
( umask 077; : > "$OUTPUT" )

# Derive owner/repo from git remote
REMOTE_URL=$(git remote get-url origin)
OWNER_REPO=$(echo "$REMOTE_URL" | sed -E 's|.*github\.com[:/]||; s|\.git$||')

{
echo "=== Intention graph: principle roots ==="
if ls intentions/principle-*.md 1>/dev/null 2>&1; then
  cat intentions/principle-*.md
else
  echo "(no principle roots found)"
fi

echo ""
echo "=== ROADMAP.md ==="
cat ROADMAP.md

echo ""
echo "=== README.md ==="
cat README.md

echo ""
echo "=== Open Issues ==="
gh_issue_list_rest --state open --limit 200 --include-title

echo ""
echo "=== Closed Issues (recent 100) ==="
gh_issue_list_rest --state closed --limit 100 --include-title

echo ""
echo "=== Repo Stats ==="
gh api "repos/$OWNER_REPO" --jq '{stargazers_count, forks_count, watchers_count}'

echo ""
echo "=== Analytics (GA4 + Search Console) ==="
"$REPO_ROOT/.claude/skills/align/scripts/fetch-analytics.sh" || true

echo ""
echo "=== Web Performance (PageSpeed Insights) ==="
"$REPO_ROOT/.claude/skills/align/scripts/fetch-psi.sh" || true
} > "$OUTPUT"

echo "$OUTPUT"
