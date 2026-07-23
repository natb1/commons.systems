#!/usr/bin/env bash
# fetch-forks.sh — assemble the fork & derivative digest for the owner's
# office-hours "built-to-be-left" reading (strategy-owned-orchestration) and
# emit a single formatted text block to stdout.
#
# The strategy's success signal is external activity — "forks, derivative
# projects, practitioners adapting the workflow independently" — reviewed by the
# owner at office-hours. That sensor is human judgment over OTHER people's
# repositories, so per the external-sensor doctrine
# (packages/intentionsutil/scripts/read-sensors.ts, the local-first / no-mining
# principle) this is a flagged, opt-in fetch script — NOT a default-registry
# sensor and NOT an automatic `reading` write. It mechanically assembles the
# evidence the observable names; the owner judges the pursued-tier threshold at
# the sitting (tactic-fork-derivative-first-reading records the reading).
#
# Sections (all via `gh api`, REST):
#   1. REPO        — forks_count, stargazers_count, subscribers_count.
#   2. FORKS       — per fork: full_name, created_at, pushed_at, and an
#                    adaptation discriminator (ahead_by / behind_by from a
#                    compare against upstream's default branch). A renamed or
#                    detached fork default branch yields a 404 on the compare,
#                    reported as "compare unavailable" — the fork still lists.
#   3. DERIVATIVES — candidate derivative projects: a repo search for
#                    "commons.systems" (excluding this repo and its forks) and a
#                    code search for the distinctive package name "intentionsutil"
#                    outside this repo. Printed plainly, no scoring — the human
#                    judges relevance.
#   4. TRAFFIC     — 14-day clones and views. These endpoints require push
#                    access; on HTTP 403 the section prints a skip note and the
#                    script continues.
#
# Config env vars (with defaults):
#   FORK_DIGEST_REPO   owner/repo slug to digest. Default: natb1/commons.systems.
#                        Fork-friendly, like the ALIGN_* envs in the sibling
#                        fetch-*.sh scripts.
#
# Error posture (per .claude/rules/code-style.md — clear errors over defensive
# fallbacks): this is an operator-run instrument, so `gh` missing or
# unauthenticated, or ANY non-optional API call failing, prints a descriptive
# error to stderr and exits non-zero. This deliberately differs from
# fetch-analytics.sh's exit-0 no-config path: `gh` auth is this repo's baseline
# tooling (see .claude/rules/sandbox.md, "gh CLI"), not an optional credential
# set. The ONLY tolerated failures are the two documented ones: a per-fork
# compare 404 and the traffic 403 — every other failure is fatal.
#
# Sandbox: callers MUST wrap this script with dangerouslyDisableSandbox: true —
# `gh` uses the macOS Security framework for TLS, which the sandbox blocks (see
# .claude/rules/sandbox.md, "gh CLI"). The script itself sets nothing
# sandbox-related.
#
# JSON-in-shell (per .claude/rules/shell-json.md): every JSON parse uses either
# `gh --jq` (gh runs the filter on its in-memory JSON) or `jq <<<"$VAR"` — never
# `echo "$VAR" | jq`, which the CI prose linter rejects on net-new lines.
set -euo pipefail

# ---- Step 0: preflight — gh present and authenticated -----------------------
if ! command -v gh >/dev/null 2>&1; then
  echo "error: 'gh' not found on PATH — the fork digest needs the GitHub CLI" >&2
  exit 1
fi
if ! gh auth status >/dev/null 2>&1; then
  echo "error: 'gh' is not authenticated — run 'gh auth login' before the fork digest" >&2
  exit 1
fi

# ---- Step 1: resolve config with defaults, validate the slug ----------------
SLUG="${FORK_DIGEST_REPO:-natb1/commons.systems}"
# The slug becomes a URL path segment in every API call below, so restrict it to
# a legitimate owner/repo shape — this blocks a query/path-injection payload in
# the env var (same rationale as the ALIGN_* guards in the sibling scripts).
if [[ ! "$SLUG" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then
  echo "error: FORK_DIGEST_REPO='${SLUG}' is not a valid owner/repo slug" >&2
  exit 1
fi

# ---- helper: fatal gh api call ----------------------------------------------
# Runs `gh api "$@"`, printing stdout on success. On ANY failure it prints a
# descriptive error (including gh's stderr) and exits non-zero. Stderr is kept
# separate from stdout so a warning line never corrupts captured JSON. The
# `|| rc=$?` form suppresses `set -e` so the custom error path runs.
gh_api() {
  local errf out rc=0
  errf=$(mktemp)
  out=$(gh api "$@" 2>"$errf") || rc=$?
  if [[ $rc -ne 0 ]]; then
    echo "error: 'gh api $*' failed: $(tr '\r\n' '  ' <"$errf")" >&2
    rm -f "$errf"
    exit 1
  fi
  rm -f "$errf"
  printf '%s' "$out"
}

echo "=== Fork & derivative digest: ${SLUG} ==="
echo ""

# ---- Section 1: REPO --------------------------------------------------------
echo "--- REPO ---"
REPO_JSON=$(gh_api "/repos/${SLUG}")
FORKS_COUNT=$(jq -r '.forks_count // "n/a"' <<<"$REPO_JSON")
STARS_COUNT=$(jq -r '.stargazers_count // "n/a"' <<<"$REPO_JSON")
SUBS_COUNT=$(jq -r '.subscribers_count // "n/a"' <<<"$REPO_JSON")
DEFAULT_BRANCH=$(jq -r '.default_branch // "main"' <<<"$REPO_JSON")
echo "forks_count: ${FORKS_COUNT}"
echo "stargazers_count: ${STARS_COUNT}"
echo "subscribers_count: ${SUBS_COUNT}"
echo "default_branch: ${DEFAULT_BRANCH}"
echo ""

# ---- Section 2: FORKS -------------------------------------------------------
# Also builds EXCLUDE (this repo + every fork, lowercased) so Section 3's
# derivative search does not re-report the repo itself or its own forks.
echo "--- FORKS ---"
declare -A EXCLUDE
EXCLUDE["${SLUG,,}"]=1

# One TSV line per fork: full_name, created_at, pushed_at, owner login. gh runs
# the jq filter on its in-memory (paginated) JSON, so no shell round-trip.
FORKS_TSV=$(gh_api "/repos/${SLUG}/forks" --paginate \
  --jq '.[] | [.full_name, .created_at, .pushed_at, .owner.login] | @tsv')

if [[ -z "$FORKS_TSV" ]]; then
  echo "(no forks)"
else
  while IFS=$'\t' read -r FORK_FULL FORK_CREATED FORK_PUSHED FORK_OWNER; do
    [[ -z "$FORK_FULL" ]] && continue
    EXCLUDE["${FORK_FULL,,}"]=1
    echo "${FORK_FULL}"
    echo "  created_at: ${FORK_CREATED}"
    echo "  pushed_at:  ${FORK_PUSHED}"
    # Adaptation discriminator: how far the fork's default branch has diverged
    # from upstream's. A 404 (renamed / detached fork default branch) is the one
    # tolerated failure — the fork still lists with a note.
    CMP_ERRF=$(mktemp)
    CMP_RC=0
    CMP_JSON=$(gh api "/repos/${SLUG}/compare/${DEFAULT_BRANCH}...${FORK_OWNER}:${DEFAULT_BRANCH}" 2>"$CMP_ERRF") || CMP_RC=$?
    if [[ $CMP_RC -ne 0 ]]; then
      if grep -q 'HTTP 404' "$CMP_ERRF"; then
        echo "  compare unavailable (404 — fork default branch renamed or detached)"
      else
        echo "error: compare failed for ${FORK_FULL}: $(tr '\r\n' '  ' <"$CMP_ERRF")" >&2
        rm -f "$CMP_ERRF"
        exit 1
      fi
    else
      AHEAD=$(jq -r '.ahead_by // "n/a"' <<<"$CMP_JSON")
      BEHIND=$(jq -r '.behind_by // "n/a"' <<<"$CMP_JSON")
      echo "  ahead_by: ${AHEAD}, behind_by: ${BEHIND}  (commits carried beyond upstream)"
    fi
    rm -f "$CMP_ERRF"
  done <<<"$FORKS_TSV"
fi
echo ""

# ---- Section 3: DERIVATIVES -------------------------------------------------
# Candidate derivative projects for the human to judge — printed plainly, no
# scoring. Two searches: repos mentioning "commons.systems" and code referencing
# the distinctive package name "intentionsutil" outside this repo.
echo "--- DERIVATIVES ---"

echo "Repository search (q=commons.systems), excluding this repo and its forks:"
REPOS_JSON=$(gh_api /search/repositories -X GET -f q='commons.systems')
REPOS_TOTAL=$(jq -r '.total_count // 0' <<<"$REPOS_JSON")
echo "  total_count: ${REPOS_TOTAL}"
# Top ~10 hits, minus the excluded set. Sanitize description (server-controlled)
# by stripping newlines and truncating.
REPO_HITS_TSV=$(jq -r '.items[:10][]? | [.full_name, ((.description // "") | gsub("[\r\n]"; " ")[0:200])] | @tsv' <<<"$REPOS_JSON")
REPO_HIT_COUNT=0
if [[ -n "$REPO_HITS_TSV" ]]; then
  while IFS=$'\t' read -r HIT_FULL HIT_DESC; do
    [[ -z "$HIT_FULL" ]] && continue
    [[ -n "${EXCLUDE[${HIT_FULL,,}]:-}" ]] && continue
    echo "  ${HIT_FULL} — ${HIT_DESC}"
    REPO_HIT_COUNT=$((REPO_HIT_COUNT + 1))
  done <<<"$REPO_HITS_TSV"
fi
[[ "$REPO_HIT_COUNT" -eq 0 ]] && echo "  (no candidate repositories after excluding this repo and its forks)"

echo "Code search (q=intentionsutil -repo:${SLUG}):"
CODE_JSON=$(gh_api /search/code -X GET -f q="intentionsutil -repo:${SLUG}")
CODE_TOTAL=$(jq -r '.total_count // 0' <<<"$CODE_JSON")
echo "  total_count: ${CODE_TOTAL}"
CODE_HITS=$(jq -r '.items[:10][]? | "  \(.repository.full_name): \((.path // "") | gsub("[\r\n]"; " ")[0:200])"' <<<"$CODE_JSON")
if [[ -n "$CODE_HITS" ]]; then
  printf '%s\n' "$CODE_HITS"
else
  echo "  (no code hits)"
fi
echo ""

# ---- Section 4: TRAFFIC -----------------------------------------------------
# clones and views over GitHub's 14-day window. Both endpoints require push
# access, so an HTTP 403 prints a skip note and continues; every other failure
# is fatal.
echo "--- TRAFFIC (14-day) ---"
for KIND in clones views; do
  T_ERRF=$(mktemp)
  T_RC=0
  T_JSON=$(gh api "/repos/${SLUG}/traffic/${KIND}" 2>"$T_ERRF") || T_RC=$?
  if [[ $T_RC -ne 0 ]]; then
    if grep -q 'HTTP 403' "$T_ERRF"; then
      echo "${KIND}: (traffic requires push access — skipped)"
      rm -f "$T_ERRF"
      continue
    fi
    echo "error: 'gh api /repos/${SLUG}/traffic/${KIND}' failed: $(tr '\r\n' '  ' <"$T_ERRF")" >&2
    rm -f "$T_ERRF"
    exit 1
  fi
  rm -f "$T_ERRF"
  T_COUNT=$(jq -r '.count // "n/a"' <<<"$T_JSON")
  T_UNIQ=$(jq -r '.uniques // "n/a"' <<<"$T_JSON")
  echo "${KIND}: ${T_COUNT} total, ${T_UNIQ} unique (14-day)"
done
