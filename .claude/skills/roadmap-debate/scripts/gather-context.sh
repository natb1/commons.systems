#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

OUTPUT="$REPO_ROOT/tmp/roadmap-context.txt"

# Derive owner/repo from git remote
REMOTE_URL=$(git remote get-url origin)
OWNER_REPO=$(echo "$REMOTE_URL" | sed -E 's|.*github\.com[:/]||; s|\.git$||')

{
echo "=== CHARTER.md ==="
cat CHARTER.md

echo ""
echo "=== ROADMAP.md ==="
cat ROADMAP.md

echo ""
echo "=== README.md ==="
cat README.md

echo ""
echo "=== Open Issues ==="
gh issue list --state open --json number,title,labels --limit 200

echo ""
echo "=== Closed Issues (recent 100) ==="
gh issue list --state closed --json number,title,closedAt --limit 100

echo ""
echo "=== Repo Stats ==="
gh api "repos/$OWNER_REPO" --jq '{stargazers_count, forks_count, watchers_count}'
} > "$OUTPUT"

echo "$OUTPUT"
