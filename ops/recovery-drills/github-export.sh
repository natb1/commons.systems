#!/usr/bin/env bash
# github-export.sh — GitHub-graph recovery-drill exporter.
#
# Walks the "delegation-github" irreversibility drill: exports this repo's issue
# and PR graph via the GitHub REST API into a timestamped local archive of raw
# JSON pages, then writes a small COMMITTED summary manifest with per-entity
# counts from the most recent run. Unit 2 imports the archive into a substitute
# forge and diffs what survived; Unit 3 flips the delegation record.
#
# Design notes:
#   - REST only, never GraphQL: bulk pulls exhaust the GraphQL 5000/hr bucket
#     (see .claude/rules/sandbox.md "dispatch GitHub GraphQL bucket exhaustion").
#     `gh api --paginate` on REST list endpoints follows Link headers with no
#     silent truncation.
#   - Fail loud: `set -euo pipefail`, every non-200 aborts (no silent
#     fallbacks) per .claude/rules/code-style.md.
#   - JSON handling never pipes a captured shell variable through `echo` into
#     `jq` — we use `jq <<<"$VAR"`, `gh ... --jq`, direct pipes, or files on
#     disk (see .claude/rules/shell-json.md).
#
# Known non-exportable gap (NOT a bug): repository secrets (Actions/Dependabot
# secrets) cannot be read back through the API by design. We export the workflow
# FILE LIST only; secret VALUES are a permanent recovery gap the drill records.
#
# Out of scope here: git-data mirroring. The git object graph itself is already
# fully replicated by every local clone/worktree — that is the drill's
# non-delegable floor and needs no API export. This script covers only the
# GitHub-hosted metadata layered on top of the git data.

set -euo pipefail

REPO="natb1/commons.systems"
OWNER="${REPO%%/*}"
NAME="${REPO##*/}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARCHIVES_DIR="$SCRIPT_DIR/archives"
MANIFEST="$SCRIPT_DIR/archives-manifest.json"

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_DIR="$ARCHIVES_DIR/$TIMESTAMP"

# ---------------------------------------------------------------------------
# gh helpers — mirror the conventions in
# .claude/skills/dispatch-propagate/scripts/lib.sh (gh_retry / gh_api_array).
# We reimplement a trimmed copy here rather than sourcing that file so this
# recovery-drill script stays self-contained (the whole point of the drill is
# that it must run even when the surrounding tooling is being reconstituted).
# ---------------------------------------------------------------------------

# Classify a captured gh stderr blob as transient (retryable). Deterministic
# failures (404/401/403/422, bare primary rate limit) fail fast.
_gh_error_is_transient() {
  local stderr="$1"
  printf '%s' "$stderr" | grep -qiE \
    'HTTP 5[0-9][0-9]|Bad Gateway|Gateway Time-?out|Service Unavailable|Internal Server Error|timed out|\btimeout\b|i/o timeout|deadline exceeded|connection reset|TLS handshake|secondary rate limit|abuse detection|retry your request|temporarily unavailable'
}

# gh_retry <cmd...> — run a gh command, retrying transient failures with
# exponential backoff. On success prints stdout; on deterministic failure or
# exhausted attempts forwards stderr and returns the real exit code.
gh_retry() {
  local attempts="${GH_RETRY_ATTEMPTS:-4}"
  local delay="${GH_RETRY_BASE_DELAY:-2}"
  local attempt out rc err tmpfile
  tmpfile=$(mktemp) || { echo "error: could not create temp file" >&2; return 1; }
  for (( attempt=1; attempt<=attempts; attempt++ )); do
    out=$("$@" 2>"$tmpfile")
    rc=$?
    if [[ "$rc" -eq 0 ]]; then
      printf '%s\n' "$out"
      rm -f "$tmpfile"
      return 0
    fi
    err=$(cat "$tmpfile")
    if [[ "$attempt" -ge "$attempts" ]] || ! _gh_error_is_transient "$err"; then
      printf '%s' "$err" >&2
      rm -f "$tmpfile"
      return "$rc"
    fi
    echo "gh_retry: transient gh failure (attempt $attempt/$attempts), retrying in ${delay}s" >&2
    sleep "$delay"
    delay=$(( delay * 2 ))
  done
  rm -f "$tmpfile"
  return 1
}

# fetch_paginated <api_path> <out_file> — fetch ALL pages of a REST list
# endpoint (per_page=100, --paginate follows Link headers) into a single JSON
# file on disk. --paginate concatenates the page arrays into one JSON array.
# Fails loud on any non-2xx response (gh api exits non-zero → gh_retry forwards).
fetch_paginated() {
  local api_path="$1" out_file="$2"
  echo "  fetch (paginated): $api_path" >&2
  gh_retry gh api --paginate --cache 0 \
    "$api_path" > "$out_file"
}

# fetch_single <api_path> <out_file> — fetch a single (non-list) endpoint.
fetch_single() {
  local api_path="$1" out_file="$2"
  echo "  fetch (single): $api_path" >&2
  gh_retry gh api --cache 0 "$api_path" > "$out_file"
}

# count_json <file> <jq_len_filter> — count entities in a saved JSON file.
# Reads from the file (no captured-variable echo), so shell-json rule is safe.
count_json() {
  local file="$1" filter="${2:-length}"
  jq "$filter" "$file"
}

# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------

echo "recovery-drill github-export: repo=$REPO archive=$OUT_DIR" >&2
mkdir -p "$OUT_DIR"

# 1. Issues (all states) — bodies, labels, milestones are embedded in the issue
#    objects. NOTE: GitHub's issues endpoint also returns PRs; we keep the raw
#    dump as-is and additionally pull PRs explicitly below. Counts below exclude
#    PR rows from the issue count via the `.pull_request` discriminator.
fetch_paginated "/repos/$OWNER/$NAME/issues?state=all&per_page=100" \
  "$OUT_DIR/issues.json"

# 2. Issue comments (repo-wide, all issues) — single bulk endpoint.
fetch_paginated "/repos/$OWNER/$NAME/issues/comments?per_page=100" \
  "$OUT_DIR/issue-comments.json"

# 3. Pull requests (all states) — bodies embedded. Review threads are
#    best-effort / optional and are NOT pulled here (they would require a
#    per-PR fan-out; Unit 2 can decide whether the diff needs them).
fetch_paginated "/repos/$OWNER/$NAME/pulls?state=all&per_page=100" \
  "$OUT_DIR/pulls.json"

# 4. Sub-issue relationships and dependencies (blocked_by / blocking), per
#    issue. These are per-issue endpoints (no repo-wide bulk endpoint exists),
#    so we fan out over the issue numbers we just pulled. See
#    .claude/skills/ref-github-issues/SKILL.md for the endpoint shapes.
#    We record one relationships file keyed by issue number.
echo "  fetch: sub-issue + dependency relationships (per-issue fan-out)" >&2
RELATIONSHIPS="$OUT_DIR/relationships.json"
: > "$OUT_DIR/relationships.ndjson"

# Extract issue numbers (exclude PRs via .pull_request) from the saved dump.
# Read numbers from the file into an array — no echo-into-jq.
mapfile -t ISSUE_NUMBERS < <(jq -r '.[] | select(has("pull_request") | not) | .number' "$OUT_DIR/issues.json")

for num in "${ISSUE_NUMBERS[@]}"; do
  sub_file="$OUT_DIR/.rel-sub-$num.json"
  blocked_file="$OUT_DIR/.rel-blocked-$num.json"
  blocking_file="$OUT_DIR/.rel-blocking-$num.json"
  # Each endpoint returns a JSON array; a missing relationship set returns [].
  gh_retry gh api --paginate --cache 0 \
    "/repos/$OWNER/$NAME/issues/$num/sub_issues?per_page=100" > "$sub_file"
  gh_retry gh api --paginate --cache 0 \
    "/repos/$OWNER/$NAME/issues/$num/dependencies/blocked_by?per_page=100" > "$blocked_file"
  gh_retry gh api --paginate --cache 0 \
    "/repos/$OWNER/$NAME/issues/$num/dependencies/blocking?per_page=100" > "$blocking_file"
  # Fold the three per-issue arrays into one NDJSON row. jq reads the files
  # directly (no captured-variable echo); --argjson pulls each file in.
  jq -n \
    --arg number "$num" \
    --slurpfile subs "$sub_file" \
    --slurpfile blocked_by "$blocked_file" \
    --slurpfile blocking "$blocking_file" \
    '{number: ($number|tonumber),
      sub_issues: $subs[0],
      blocked_by: $blocked_by[0],
      blocking: $blocking[0]}' >> "$OUT_DIR/relationships.ndjson"
  rm -f "$sub_file" "$blocked_file" "$blocking_file"
done
# Collapse the NDJSON stream into one JSON array for the archive.
jq -s '.' "$OUT_DIR/relationships.ndjson" > "$RELATIONSHIPS"
rm -f "$OUT_DIR/relationships.ndjson"

# 5. Releases.
fetch_paginated "/repos/$OWNER/$NAME/releases?per_page=100" \
  "$OUT_DIR/releases.json"

# 6. Repo metadata: workflow FILE LIST only (names of .github/workflows/*.yml).
#    We do NOT export secrets — see the header "Known non-exportable gap".
fetch_single "/repos/$OWNER/$NAME/actions/workflows" \
  "$OUT_DIR/workflows.json"

# 7. Repo metadata object (name, default branch, visibility, timestamps).
fetch_single "/repos/$OWNER/$NAME" \
  "$OUT_DIR/repo.json"

# ---------------------------------------------------------------------------
# Counts + committed manifest
# ---------------------------------------------------------------------------

ISSUE_COUNT=$(jq '[.[] | select(has("pull_request") | not)] | length' "$OUT_DIR/issues.json")
ISSUE_COMMENT_COUNT=$(count_json "$OUT_DIR/issue-comments.json")
PR_COUNT=$(count_json "$OUT_DIR/pulls.json")
RELEASE_COUNT=$(count_json "$OUT_DIR/releases.json")
WORKFLOW_COUNT=$(jq '.total_count' "$OUT_DIR/workflows.json")
# Relationship edge counts, summed across issues.
SUBISSUE_EDGES=$(jq '[.[].sub_issues | length] | add // 0' "$RELATIONSHIPS")
BLOCKED_BY_EDGES=$(jq '[.[].blocked_by | length] | add // 0' "$RELATIONSHIPS")
BLOCKING_EDGES=$(jq '[.[].blocking | length] | add // 0' "$RELATIONSHIPS")

echo "recovery-drill github-export: writing manifest $MANIFEST" >&2
jq -n \
  --arg repo "$REPO" \
  --arg timestamp "$TIMESTAMP" \
  --arg archive "archives/$TIMESTAMP" \
  --argjson issues "$ISSUE_COUNT" \
  --argjson issue_comments "$ISSUE_COMMENT_COUNT" \
  --argjson pulls "$PR_COUNT" \
  --argjson releases "$RELEASE_COUNT" \
  --argjson workflows "$WORKFLOW_COUNT" \
  --argjson sub_issue_edges "$SUBISSUE_EDGES" \
  --argjson blocked_by_edges "$BLOCKED_BY_EDGES" \
  --argjson blocking_edges "$BLOCKING_EDGES" \
  '{
    repo: $repo,
    exported_at: $timestamp,
    archive_dir: $archive,
    note: "Raw JSON archive is gitignored (ops/recovery-drills/archives/). Secrets are a known non-exportable gap — workflow file names are exported, secret values cannot be read back through the API by design.",
    counts: {
      issues: $issues,
      issue_comments: $issue_comments,
      pull_requests: $pulls,
      releases: $releases,
      workflows: $workflows,
      sub_issue_edges: $sub_issue_edges,
      blocked_by_edges: $blocked_by_edges,
      blocking_edges: $blocking_edges
    }
  }' > "$MANIFEST"

echo "recovery-drill github-export: done." >&2
jq '.counts' "$MANIFEST" >&2
