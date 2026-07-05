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
if [[ ! "$OWNER_REPO" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then
  echo "error: could not derive owner/repo from remote URL" >&2
  exit 1
fi

# Each sensor function emits ONLY its header line plus its body — no leading or
# trailing blank line. The blank-line separators between sections are the
# `echo ""` calls in the composer block at the bottom, so the concatenated
# output is byte-identical to the original monolithic script.

# --- Local-first sensors (own repo + own GitHub project state) --------------
# These read the project's OWN execution state — its intention graph, its
# roadmap/README, its own GitHub issues and repo stats. They are the default
# the feedback arm reaches for first (.claude/docs/signal-identification.md,
# "Local-first / no-mining").

sensor_principle_roots() {
  echo "=== Intention graph: virtue roots (and the kind nodes defining the graph) ==="
  if ls intentions/virtue-*.md 1>/dev/null 2>&1; then
    cat intentions/kind-*.md intentions/virtue-*.md
  else
    echo "(no virtue roots found)"
  fi
}

sensor_strategy_roots() {
  echo "=== Intention graph: strategies ==="
  if ls intentions/strategy-*.md 1>/dev/null 2>&1; then
    cat intentions/strategy-*.md
  else
    echo "(no strategies found)"
  fi
}

sensor_active_frontier() {
  echo "=== Active frontier (generated from the intention graph) ==="
  npx tsx intentionsutil/scripts/frontier-view.ts \
    || echo "(frontier-view failed; active frontier context unavailable)" >&2
}

sensor_readme() {
  echo "=== README.md ==="
  cat README.md
}

sensor_open_issues() {
  echo "=== Open Issues ==="
  gh_issue_list_rest --state open --limit 200 --include-title
}

sensor_closed_issues() {
  echo "=== Closed Issues (recent 100) ==="
  gh_issue_list_rest --state closed --limit 100 --include-title
}

sensor_repo_stats() {
  echo "=== Repo Stats ==="
  gh api "repos/$OWNER_REPO" --jq '{stargazers_count, forks_count, watchers_count}'
}

# --- External sensors (flagged, opt-in — not local-first; honor no-mining) --
# These read activity BEYOND the project's own execution (site analytics,
# synthetic web-performance probes). Per the local-first / no-mining principle
# they are NOT the default a sensor classifier reaches for. They remain in the
# default gather-context output here only because the align Phase-1 context
# contract is owned by #2372 and is unchanged by this unit; they are explicitly
# flagged as external/opt-in for when #2372 makes them toggleable. The `|| true`
# keeps a failed external fetch from aborting the whole gather under `set -e`.

external_sensor_analytics() {
  echo "=== Analytics (GA4 + Search Console) ==="
  "$REPO_ROOT/.claude/skills/align-init/scripts/fetch-analytics.sh" || true
}

external_sensor_psi() {
  echo "=== Web Performance (PageSpeed Insights) ==="
  "$REPO_ROOT/.claude/skills/align-init/scripts/fetch-psi.sh" || true
}

{
sensor_principle_roots
echo ""
sensor_strategy_roots
echo ""
sensor_active_frontier
echo ""
sensor_readme
echo ""
sensor_open_issues
echo ""
sensor_closed_issues
echo ""
sensor_repo_stats || true
echo ""
external_sensor_analytics
echo ""
external_sensor_psi
} > "$OUTPUT"

echo "$OUTPUT"
