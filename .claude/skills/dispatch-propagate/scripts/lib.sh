#!/usr/bin/env bash
# Shared functions for PR workflow scripts

export FIREBASE_PROJECT_ID="commons-systems"

# Default Tailscale SSH host for remote QA port-forwarding. Static by design:
# the Remote access block must not shell out to `tailscale` at runtime (#963).
# Override with QA_REMOTE_SSH_HOST when the host's tailnet name differs.
QA_REMOTE_SSH_HOST="${QA_REMOTE_SSH_HOST:-nixos}"

# Resolve the issue number from an argument or the current branch name.
# Args: $1 = issue number (optional; derived from branch if omitted)
# Output: prints the issue number to stdout
# Returns 1 if no issue number can be determined.
resolve_issue_number() {
  local num="${1:-}"
  if [[ -z "$num" ]]; then
    num=$(git rev-parse --abbrev-ref HEAD | grep -oE '^[1-9][0-9]*' || true)
  fi
  if [[ -z "$num" ]]; then
    echo "error: branch name does not start with an issue number and no argument provided" >&2
    return 1
  fi
  if [[ ! "$num" =~ ^[1-9][0-9]*$ ]]; then
    echo "error: invalid issue number: $num (must be a positive integer)" >&2
    return 1
  fi
  echo "$num"
}

# Determine whether a repo-relative path is a shell script.
# Args: $1 = repo-relative path (as produced by git diff --name-only)
# Returns 0 if the file is a shell script (either by .sh extension or by
# bash/sh shebang on the first line); returns 1 otherwise.
# Reads the file via $REPO_ROOT/$1 — REPO_ROOT must be set by the caller.
# Safe under set -euo pipefail.
is_shell_script() {
  local path="$1"
  # Cheap check: .sh extension — no file read needed.
  if [[ "$path" == *.sh ]]; then
    return 0
  fi
  local resolved="$REPO_ROOT/$path"
  [[ -f "$resolved" ]] || return 1
  local first
  IFS= read -r first < "$resolved" || true
  if [[ "$first" =~ ^#!.*/(env[[:space:]]+(-S[[:space:]]+)?)?(ba|z)?sh([[:space:]]|$) ]]; then
    return 0
  fi
  return 1
}

# Derive and validate owner/repo from a git remote URL.
# Args: $1 = remote.origin.url value; $2 = caller name (error-message prefix).
# Resolve owner/repo from the remote so gh addresses the repo independent of cwd
# (dirname(common_dir) is not a working tree in the bare-repo + worktrees layout).
# Handles https://github.com/<owner>/<repo>(.git) and git@github.com:<owner>/<repo>(.git).
# Prints owner/repo to stdout on success; on an empty/non-GitHub/malformed result,
# prints a caller-prefixed message to stderr and returns 1.
gh_repo_from_remote() {
  local url="$1" caller="$2" stripped repo
  stripped="${url%.git}"
  repo="${stripped#*github.com[:/]}"
  if [[ -z "$stripped" ]]; then
    echo "$caller: could not resolve owner/repo from remote.origin.url ('$url')" >&2
    return 1
  fi
  if [[ "$repo" == "$stripped" ]]; then
    echo "$caller: remote is not a GitHub repository ('$url')" >&2
    return 1
  fi
  if [[ ! "$repo" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then
    echo "$caller: unexpected owner/repo format from remote.origin.url ('$url'): $repo" >&2
    return 1
  fi
  printf '%s\n' "$repo"
}

# ---- parse_duration <str> — duration string to whole seconds ----------------
# Accepts <int><unit> where unit is one of s|m|h|d|w (second/minute/hour/day/
# week). Prints the duration in seconds on stdout and returns 0. On unparseable
# input prints nothing and returns 1 — the caller decides how to surface it.
# 10# forces base-10 so a leading-zero spec like "08h"/"012h" is not read as
# octal (bash arithmetic treats a leading-zero literal as octal otherwise).
parse_duration() {
  local spec="$1" num unit
  if [[ ! "$spec" =~ ^([0-9]+)([smhdw])$ ]]; then
    return 1
  fi
  num=$(( 10#${BASH_REMATCH[1]} ))
  unit="${BASH_REMATCH[2]}"
  case "$unit" in
    s) printf '%s\n' "$num" ;;
    m) printf '%s\n' "$(( num * 60 ))" ;;
    h) printf '%s\n' "$(( num * 3600 ))" ;;
    d) printf '%s\n' "$(( num * 86400 ))" ;;
    w) printf '%s\n' "$(( num * 604800 ))" ;;
  esac
  return 0
}

# Classify a captured gh stderr blob as transient (retryable) or deterministic.
# Args: $1 = the captured stderr text.
# Returns 0 when the blob matches a known transient class (HTTP 5xx, gateway
# timeouts, connection resets, secondary rate limit / abuse detection, etc.),
# non-zero otherwise. Deterministic failures (404, 401/403 auth, 422, and the
# bare primary "API rate limit exceeded") are NOT transient — fail fast.
# Match is case-insensitive. A bare 4xx code and a bare "rate limit" must not
# match; only a "secondary rate limit" is retryable.
_gh_error_is_transient() {
  local stderr="$1"
  printf '%s' "$stderr" | grep -qiE \
    'HTTP 5[0-9][0-9]|Bad Gateway|Gateway Time-?out|Service Unavailable|Internal Server Error|timed out|\btimeout\b|i/o timeout|deadline exceeded|connection reset|TLS handshake|secondary rate limit|abuse detection|retry your request|temporarily unavailable'
}

# Run a command, retrying on transient gh/GitHub failures with exponential
# backoff. Args: the command and its arguments (e.g. `gh_retry gh api /path`).
# On success: prints the command's stdout and returns 0. On a deterministic
# failure or once attempts are exhausted: forwards the last attempt's stderr to
# >&2 and returns the command's real exit code (no swallowing — see
# .claude/rules/code-style.md). A transient failure with attempts remaining
# logs one retry line to >&2, sleeps, doubles the delay, and retries.
# Tunables (env): GH_RETRY_ATTEMPTS (default 4 = 1 try + 3 retries),
# GH_RETRY_BASE_DELAY (default 2 seconds).
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
  # Unreachable — the loop returns on every path — but keep the temp file clean.
  rm -f "$tmpfile"
  return 1
}

# Neutralize secrets in firebase-tools --debug output. Reads stdin, writes the
# redacted stream to stdout. This is the BACKSTOP control — firebase_auth_diagnostic's
# allowlisted error window is the primary one. Ordering matters and is enforced here:
#   1. the MULTI-LINE PEM private-key block FIRST — collapse everything from
#      `-----BEGIN ... PRIVATE KEY-----` through `-----END ... PRIVATE KEY-----`
#      (inclusive) to a single line via an awk range (a per-line sed cannot span
#      lines), so the key bytes never reach the line-oriented passes below.
#   2. single-line passes: `Bearer <token>` BEFORE bare `ya29.` tokens (so a
#      bearer OAuth token collapses to `Bearer [REDACTED]` rather than leaking a
#      `Bearer ` prefix), then bare OAuth tokens, JWTs, and keyed JSON / key=value
#      secret values for access_token/refresh_token/id_token/client_secret/private_key.
redact_firebase_secrets() {
  awk '
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/ { print "[REDACTED PRIVATE KEY]"; inkey=1; next }
    inkey && /-----END [A-Z ]*PRIVATE KEY-----/ { inkey=0; next }
    inkey { next }
    { print }
  ' \
  | sed -E \
      -e 's/[Bb]earer[[:space:]]+[A-Za-z0-9._~+/=-]+/Bearer [REDACTED]/g' \
      -e 's/ya29\.[A-Za-z0-9._-]+/[REDACTED-TOKEN]/g' \
      -e 's/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/[REDACTED-JWT]/g' \
      -e 's/("(access_token|refresh_token|id_token|client_secret|private_key)"[[:space:]]*:[[:space:]]*")[^"]*"/\1[REDACTED]"/g' \
      -e 's/((access_token|refresh_token|id_token|client_secret|private_key)=)[^[:space:]&]+/\1[REDACTED]/g'
}

# On the auth-class deploy failure ONLY, run a one-shot NON-json firebase-tools
# --debug probe to surface the underlying transport/credential error that the
# --json deploy suppressed (e.g. a node/undici "Premature close" on the OAuth
# token fetch surfacing as the generic "Failed to authenticate"). Writes a
# redacted, allowlisted window of the probe output to STDERR. Never leaks
# secrets: the captured output is first passed through redact_firebase_secrets
# (backstop), then only a bounded window grep'd around the error signature is
# emitted (allowlist — the primary control). The diagnostic command defaults to
# `npx firebase-tools projects:list --debug`; override via env var
# FIREBASE_AUTH_DIAGNOSTIC_CMD (word-split, for test injection). Runs under
# `timeout` so a hung probe cannot stall the failure path; the probe's expected
# non-zero exit is captured and does not trip a caller's `set -e`.
firebase_auth_diagnostic() {
  local cmd output rc window
  read -ra cmd <<< "${FIREBASE_AUTH_DIAGNOSTIC_CMD:-npx firebase-tools projects:list --debug}"
  echo "=== firebase auth diagnostic (non-json --debug) ===" >&2
  if output=$(timeout 60 "${cmd[@]}" 2>&1); then
    rc=0
  else
    rc=$?
  fi
  window=$(printf '%s\n' "$output" | redact_firebase_secrets \
    | grep -iE -B1 -A2 'error|premature|invalid response|denied|token|fail' || true)
  if [[ -z "$window" ]]; then
    echo "auth diagnostic produced no recognizable error lines (exit $rc); auth may have recovered — original failure possibly transient" >&2
  else
    printf '%s\n' "$window" >&2
  fi
}

# Run a firebase-tools deploy command, retrying ONLY on the transient auth
# failure with exponential backoff. Args: the command and its arguments (e.g.
# `firebase_deploy_retry npx firebase-tools hosting:channel:deploy ...`).
# Unlike gh_retry, the retryable signature ("Failed to authenticate") arrives on
# the command's STDOUT (inside the firebase-tools --json payload), not stderr —
# so classification reads the combined stdout+stderr, and the failure-forward
# path forwards STDOUT too, keeping the JSON error visible to the caller's
# downstream preview-URL extraction.
# On success: prints the command's stdout and returns 0. On a non-auth failure
# or once attempts are exhausted: forwards the last attempt's stdout to stdout
# and its stderr to >&2, then returns the command's real exit code (no
# swallowing — see .claude/rules/code-style.md). Only "Failed to authenticate"
# is treated as transient — every other failure fails fast.
# When the FINAL forwarded failure is auth-class (the --json deploy only ever
# yields the generic "Failed to authenticate"), additionally run
# firebase_auth_diagnostic to surface the real underlying firebase-tools error
# on STDERR (#2522). A non-auth failure already carries its real error in stderr
# and does NOT trigger the probe.
# Tunables (env): FIREBASE_DEPLOY_RETRY_ATTEMPTS (default 3 = up to 3 attempts),
# FIREBASE_DEPLOY_RETRY_BASE_DELAY (default 5 seconds).
firebase_deploy_retry() {
  local attempts="${FIREBASE_DEPLOY_RETRY_ATTEMPTS:-3}"
  local delay="${FIREBASE_DEPLOY_RETRY_BASE_DELAY:-5}"
  local attempt out rc err combined tmpfile
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
    combined="$out"$'\n'"$err"
    if [[ "$attempt" -ge "$attempts" ]] || [[ "${combined,,}" != *"failed to authenticate"* ]]; then
      printf '%s\n' "$out"
      printf '%s' "$err" >&2
      if [[ "${combined,,}" == *"failed to authenticate"* ]]; then
        firebase_auth_diagnostic >&2
      fi
      rm -f "$tmpfile"
      return "$rc"
    fi
    echo "firebase_deploy_retry: transient auth failure (attempt $attempt/$attempts), retrying in ${delay}s" >&2
    sleep "$delay"
    delay=$(( delay * 2 ))
  done
  # Unreachable — the loop returns on every path — but keep the temp file clean.
  rm -f "$tmpfile"
  return 1
}

# Call gh api and validate the response is a JSON array before applying a jq filter.
# Args: $1 = API path (e.g. "/repos/{owner}/{repo}/issues/42/sub_issues")
#        $2 = jq filter to apply to the array (e.g. '.[].number')
# Output: filtered results, one per line
# Exits 1 with error if API returns a non-array (e.g., error object).
gh_api_array() {
  local path="$1"
  local filter="$2"
  local raw stderr_file
  stderr_file=$(mktemp) || { echo "error: could not create temp file" >&2; return 1; }
  raw=$(gh_retry gh api "$path" 2>"$stderr_file") || {
    local api_stderr
    api_stderr=$(cat "$stderr_file")
    rm -f "$stderr_file"
    echo "error: gh api call failed for $path: $api_stderr" >&2
    return 1
  }
  rm -f "$stderr_file"
  local result
  result=$(printf '%s\n' "$raw" | jq -r "if type == \"array\" then ($filter) else error(\"expected array, got \" + type) end") || {
    if printf '%s\n' "$raw" | jq -e 'type == "array"' > /dev/null 2>&1; then
      echo "error: jq filter failed for $path" >&2
    else
      echo "error: API response for $path is not a JSON array: ${raw:0:200}" >&2
    fi
    return 1
  }
  if [[ -n "$result" ]]; then
    printf '%s\n' "$result"
  fi
}

# dispatch_marker_comment_id <N> <marker> — echo the id of the issue comment
# whose body starts with <marker> (first line), authored by the trusted dispatch
# identity, or empty when none. Uses startswith (not contains) so prose mentions
# of the marker string in other comments are never matched. Consolidates the author-id-filtered find jq currently duplicated inline
# in dispatch-read-plan and dispatch-write-plan (those two are deliberately NOT
# migrated in this PR — see issue #2039 plan; the greenfield migration is a
# deferred follow-up). Resolves the trusted author id from `gh api user --jq '.id'`
# (validated ^[0-9]+$, overridable via DISPATCH_PLAN_AUTHOR_ID for parity with the
# plan scripts), fetches comments via gh_retry, and applies the same
# author-id-filtered first(...) selector. Returns non-zero with a stderr message
# on an unresolvable author id (clear error, not a fallback). Echoes nothing
# (empty) when no matching comment exists. A gh_retry or jq pipeline failure
# returns non-zero (a clear error), distinct from the empty-output absent case —
# mirroring gh_api_array's error propagation rather than silently swallowing it.
dispatch_marker_comment_id() {
  local n="$1" marker="$2"
  local author_id="${DISPATCH_PLAN_AUTHOR_ID:-$(gh api user --jq '.id')}"
  if [[ ! "$author_id" =~ ^[0-9]+$ ]]; then
    echo "dispatch_marker_comment_id: could not resolve a numeric comment author id (got: '$author_id')" >&2
    return 1
  fi
  local raw
  raw=$(gh_retry gh api --paginate "repos/{owner}/{repo}/issues/$n/comments") \
    || return 1
  local cid
  cid=$(printf '%s\n' "$raw" | jq -r --arg m "$marker" --argjson author_id "$author_id" \
      'first(.[] | select((.body | startswith($m)) and (.user.id == $author_id)) | .id)') \
    || return 1
  if [[ -z "$cid" || "$cid" == "null" ]]; then
    return 0
  fi
  printf '%s\n' "$cid"
}

# List issues (NOT pull requests) via the GitHub REST API rather than
# `gh issue list` (which GraphQL-backs). Keeping the per-tick dispatch issue
# scans on REST keeps them off the shared GraphQL rate-limit bucket, which the
# per-tick scan was self-exhausting (#1601).
#
# Contract:
#   gh_issue_list_rest --state <open|closed|all> [--repo <owner/repo>] [--label <name>] [--limit <n>] [--paginate] [--include-title] [--include-body]
#
# Flags:
#   --state  (required) open|closed|all. `all` is accepted — REST's
#            issues?state=all is native and needs no special-casing.
#   --repo   (optional) owner/repo for a cross-repo scan; when absent the path
#            uses the {owner}/{repo} placeholder gh auto-resolves for the
#            current repo.
#   --label  (optional) a single label name; URL-encoded minimally (space→%20;
#            the colon in values like dispatch:main-broken is query-safe).
#   --limit  (optional) cap on the number of issues returned. When ABSENT we
#            --paginate the full set (REST --paginate has no silent-truncation
#            hazard, unlike gh pr/issue list's --limit default). When PRESENT and
#            <= 100 we fetch a SINGLE page of that size (no --paginate). When
#            PRESENT and > 100 we --paginate at per_page=100 and slice the merged
#            result to the first <limit> objects in the final jq projection —
#            REST clamps per_page to 100, so a single-page per_page=<limit> would
#            silently truncate to <= 100. The slice preserves the
#            `len == limit ⇒ truncated` guard semantics: paginate-all-then-slice
#            yields len == limit iff at least <limit> issues exist.
#   --paginate (optional) force the paginate-then-slice path even when --limit is
#            <= 100. Without it, a <= 100 limit fetches a SINGLE page of mixed
#            issues+PRs, so PR-filtering silently leaves FEWER than <limit> real
#            issues. With it (and a --limit), we --paginate at per_page=100,
#            filter PRs, then slice to <limit> — yielding the true recent <limit>
#            issues. Use this when a limit <= 100 must mean "up to <limit> real
#            issues" rather than "issues among the first <limit> mixed rows"
#            (e.g. align's recent-closed-issues context in a PR-dominated repo).
#            A no-op without --limit (that path already paginates the full set).
#   --include-title (optional) when present, the projected objects additionally
#            carry a `title` field. Omitted by default so the repo-wide per-tick
#            callers stay byte-identical and payload-lean.
#   --include-body (optional) when present, the projected objects additionally
#            carry `title` and `body` fields. Omitted by default so the repo-wide per-tick
#            callers stay byte-identical and payload-lean.
#
# Output: one merged JSON array on stdout. REST /issues returns issues AND PRs;
# only PR objects carry a `pull_request` key, so we filter those out to match
# `gh issue list`. The remaining objects are remapped from REST snake_case to the
# camelCase shape downstream jq expects ({number, createdAt, closedAt, labels}).
# `labels` is already [{name,...}] in REST, so it passes through unchanged; a null
# closedAt on open issues is harmless. Results are sorted created-descending so a
# downstream `.[0]` is the most-recently-created issue. When --include-title is
# passed, each projected object also carries a `title` field; when --include-body
# is passed, each carries BOTH `title` and `body` fields; both flags may be
# passed together (idempotent — title appears once).
#
# On gh failure: errors to stderr and returns 1 (clear-errors convention, no
# fallback).
gh_issue_list_rest() {
  local state="" repo="" label="" limit="" include_title="" include_body="" force_paginate=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --state) state="$2"; shift 2 ;;
      --repo)  repo="$2";  shift 2 ;;
      --label) label="$2"; shift 2 ;;
      --limit) limit="$2"; shift 2 ;;
      --include-title) include_title=1; shift 1 ;;
      --include-body) include_body=1; shift 1 ;;
      --paginate) force_paginate=1; shift 1 ;;
      *) echo "error: gh_issue_list_rest: unknown flag '$1'" >&2; return 1 ;;
    esac
  done
  if [[ -z "$state" ]]; then
    echo "error: gh_issue_list_rest: --state is required" >&2
    return 1
  fi

  local path
  if [[ -n "$repo" ]]; then
    path="repos/$repo/issues"
  else
    path="repos/{owner}/{repo}/issues"
  fi

  # When --limit > 100, REST clamps a single page's per_page to 100, so we must
  # --paginate at per_page=100 and slice the merged result down to <limit> in the
  # projection. A limit <= 100 fits one page (per_page=<limit>, no --paginate).
  #
  # The single-page <=100 optimization under-delivers ISSUES: REST returns mixed
  # issues+PRs, so one page of per_page=<limit> mixed rows yields FEWER than
  # <limit> real issues after the projection filters PRs out — silently, with no
  # shortfall indicator. Callers that need up-to-<limit> real issues at a limit
  # <= 100 pass --paginate to force the paginate-then-slice path (paginate at
  # per_page=100, filter PRs, slice to <limit>), which returns the true recent
  # <limit> issues instead.
  local paginate="" per_page="100" slice=""
  if [[ -n "$limit" ]]; then
    if [[ ! "$limit" =~ ^[0-9]+$ ]]; then
      echo "error: gh_issue_list_rest: --limit must be a non-negative integer (got '$limit')" >&2
      return 1
    fi
    if (( limit > 100 )) || [[ -n "$force_paginate" ]]; then
      paginate=1
      per_page="100"
      slice="$limit"
    else
      per_page="$limit"
    fi
  else
    paginate=1
  fi

  local query="state=$state&per_page=$per_page&sort=created&direction=desc"
  if [[ -n "$label" ]]; then
    # Minimal URL-encode: space → %20 (colon is query-safe).
    local enc_label="${label// /%20}"
    query="$query&labels=$enc_label"
  fi

  local raw
  if [[ -n "$paginate" ]]; then
    # Full set (--limit absent) or --limit > 100: REST --paginate has no
    # silent-truncation hazard; a >100 limit is enforced by the projection slice.
    raw=$(gh_retry gh api --paginate "$path?$query") || {
      echo "error: gh_issue_list_rest: gh api failed for $path?$query" >&2
      return 1
    }
  else
    # Single page (no --paginate) — caller wants at most one page of per_page.
    raw=$(gh_retry gh api "$path?$query") || {
      echo "error: gh_issue_list_rest: gh api failed for $path?$query" >&2
      return 1
    }
  fi

  # Build the projection: filter PRs, remap to camelCase, conditionally add
  # title/body, then conditionally slice to <limit> (only when --limit > 100).
  local fields="number, createdAt: .created_at, closedAt: .closed_at, labels"
  # --include-title ⇒ add title. --include-body ⇒ add BOTH title and body
  # (origin/main #2255's shipped semantics). Add title once when either flag is
  # set (avoid a duplicate `title` key when both are passed), then body only for
  # --include-body.
  if [[ -n "$include_title" || -n "$include_body" ]]; then
    fields="$fields, title"
  fi
  [[ -n "$include_body" ]] && fields="$fields, body"
  local projection="add // [] | map(select(.pull_request == null)) | map({$fields})"
  [[ -n "$slice" ]] && projection="$projection | .[:$slice]"
  printf '%s' "$raw" | jq -s "$projection"
}

# List pull requests via the GitHub REST API rather than `gh pr list` (which
# GraphQL-backs). Keeping per-tick dispatch PR scans on REST keeps them off the
# shared GraphQL rate-limit bucket the per-tick scan was self-exhausting (#1601,
# #2258). Mirrors gh_issue_list_rest's --limit discipline.
#
# Contract:
#   gh_pr_list_rest --state <open|closed|all> [--repo <owner/repo>] [--head <branch>] [--limit <n>]
#
# Flags:
#   --state  (required) open|closed|all. REST's pulls?state=all is native.
#   --repo   (optional) owner/repo for a cross-repo scan; when absent the path
#            uses the {owner}/{repo} placeholder gh auto-resolves for the
#            current repo.
#   --head   (optional) filter to PRs from a single head branch. REST wants
#            head=<owner>:<branch>. The owner is the FIRST path segment of --repo
#            when given (cut on /); otherwise it is resolved from the current
#            repo via `gh repo view --json owner -q .owner.login` (wrapped in
#            gh_retry). Resolution is lazy — only performed when --head is set and
#            --repo is absent — so the common no-head call path makes no extra
#            API call.
#   --limit  (optional) cap on PRs returned. SAME three-way discipline as
#            gh_issue_list_rest: ABSENT ⇒ --paginate the full set (REST --paginate
#            has no silent-truncation hazard); PRESENT and <= 100 ⇒ a SINGLE page
#            of per_page=<limit> (no --paginate); PRESENT and > 100 ⇒ --paginate
#            at the REST-clamped per_page=100 and slice the merged result to the
#            first <limit> objects in the final jq projection. The slice preserves
#            the `len == limit ⇒ truncated` guard semantics.
#
# Endpoint: repos/{owner}/{repo}/pulls (or repos/$repo/pulls with --repo). The
# query string carries state, per_page, and head (when set). No sort/direction
# param is emitted (this unit migrates no call sites — see #2258).
#
# Projection: a FIXED {number, state, title, mergedAt, createdAt} shape, remapped
# from REST snake_case (merged_at → mergedAt, created_at → createdAt). REST
# /pulls returns ONLY pull requests, so — unlike /issues — no pull_request filter
# is needed; every element is a PR.
#
# State normalization (CRITICAL): REST PR `state` is only open|closed and does
# not distinguish merged from closed-unmerged, but consuming scripts compare
# against the GraphQL state enum (OPEN/CLOSED/MERGED). We normalize IN the jq
# projection to that vocabulary:
#   REST open                          → OPEN
#   REST closed with merged_at != null → MERGED
#   REST closed with merged_at == null → CLOSED
#
# Output: one merged JSON array on stdout.
#
# On gh failure: errors to stderr and returns 1 (clear-errors convention, no
# fallback).
gh_pr_list_rest() {
  local state="" repo="" head="" limit=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --state) state="$2"; shift 2 ;;
      --repo)  repo="$2";  shift 2 ;;
      --head)  head="$2";  shift 2 ;;
      --limit) limit="$2"; shift 2 ;;
      *) echo "error: gh_pr_list_rest: unknown flag '$1'" >&2; return 1 ;;
    esac
  done
  if [[ -z "$state" ]]; then
    echo "error: gh_pr_list_rest: --state is required" >&2
    return 1
  fi

  local path
  if [[ -n "$repo" ]]; then
    path="repos/$repo/pulls"
  else
    path="repos/{owner}/{repo}/pulls"
  fi

  # When --limit > 100, REST clamps a single page's per_page to 100, so we must
  # --paginate at per_page=100 and slice the merged result down to <limit> in the
  # projection. A limit <= 100 fits one page (per_page=<limit>, no --paginate).
  local paginate="" per_page="100" slice=""
  if [[ -n "$limit" ]]; then
    if [[ ! "$limit" =~ ^[0-9]+$ ]]; then
      echo "error: gh_pr_list_rest: --limit must be a non-negative integer (got '$limit')" >&2
      return 1
    fi
    if (( limit > 100 )); then
      paginate=1
      per_page="100"
      slice="$limit"
    else
      per_page="$limit"
    fi
  else
    paginate=1
  fi

  local query="state=$state&per_page=$per_page"
  if [[ -n "$head" ]]; then
    # Resolve the head owner: first segment of --repo when given, else the
    # current repo's owner login. Lazy — only when --head is set.
    local head_owner
    if [[ -n "$repo" ]]; then
      head_owner="${repo%%/*}"
    else
      head_owner=$(gh_retry gh repo view --json owner -q .owner.login) || {
        echo "error: gh_pr_list_rest: could not resolve current repo owner for --head" >&2
        return 1
      }
    fi
    query="$query&head=$head_owner:$head"
  fi

  local raw
  if [[ -n "$paginate" ]]; then
    # Full set (--limit absent) or --limit > 100: REST --paginate has no
    # silent-truncation hazard; a >100 limit is enforced by the projection slice.
    raw=$(gh_retry gh api --paginate "$path?$query") || {
      echo "error: gh_pr_list_rest: gh api failed for $path?$query" >&2
      return 1
    }
  else
    # Single page (no --paginate) — caller wants at most one page of per_page.
    raw=$(gh_retry gh api "$path?$query") || {
      echo "error: gh_pr_list_rest: gh api failed for $path?$query" >&2
      return 1
    }
  fi

  # Build the projection: fixed field set, remap snake_case to camelCase, and
  # normalize REST open|closed to the GraphQL OPEN|MERGED|CLOSED vocabulary; then
  # conditionally slice to <limit> (only when --limit > 100).
  local projection
  projection='add // [] | map({number, state: (if .state == "open" then "OPEN" elif .merged_at != null then "MERGED" else "CLOSED" end), title, mergedAt: .merged_at, createdAt: .created_at})'
  [[ -n "$slice" ]] && projection="$projection | .[:$slice]"
  printf '%s' "$raw" | jq -s "$projection"
}

# The explicit open-PR fetch cap. gh pr list defaults to 30, which silently
# truncates the open-PR snapshot once a fan-out crosses 30 open PRs. 300 mirrors
# dispatch-select-target's open-issue cap. Overridable for tests.
DISPATCH_PR_LIST_LIMIT="${DISPATCH_PR_LIST_LIMIT:-300}"

# Fetch all open PRs with an explicit --limit and a loud truncation guard.
# Args: $1 = comma-separated --json field set (e.g. "number,headRefName").
# Output: the gh pr list JSON array on stdout.
# Returns non-zero on gh failure (propagated) OR on truncation — when the result
# length equals the limit, meaning the snapshot is likely cut off. Errors to
# stderr in the truncation case so the failure is never silent.
pr_list_open() {
  local fields="$1"
  local out rc len
  # lint-allow: gh-rest-porcelain pr_list_open is the canonical open-PR wrapper; predates the list ban, gh_pr_list_rest exists for new code
  out=$(gh pr list --state open --limit "$DISPATCH_PR_LIST_LIMIT" --json "$fields")
  rc=$?
  [[ "$rc" -ne 0 ]] && return "$rc"
  len=$(printf '%s' "$out" | jq 'length')
  if [[ "$len" -eq "$DISPATCH_PR_LIST_LIMIT" ]]; then
    echo "error: gh pr list returned exactly $DISPATCH_PR_LIST_LIMIT open PRs (the --limit) — the open-PR snapshot is likely truncated. Raise DISPATCH_PR_LIST_LIMIT." >&2
    return 1
  fi
  printf '%s\n' "$out"
}

# Write the open-PR JSON list to a temp file and echo its path. Lets callers
# pass the (potentially large) list to child scripts via a tiny DISPATCH_PR_LIST_FILE
# path env var instead of an inline DISPATCH_PR_LIST string, which can exceed the
# kernel's per-arg MAX_ARG_STRLEN (128 KB) and fail the child exec with E2BIG.
# Args: $1 = the open-PR JSON array string.
# Output: the temp-file path on stdout.
# Returns non-zero on mktemp/write failure.
# CALLER OWNS CLEANUP: register `trap 'rm -f "$f"' EXIT` on the path this returns.
pr_list_export_file() {
  local json="$1" f
  f=$(mktemp "${TMPDIR:-/tmp}/dispatch-pr-list.XXXXXX") || return 1
  printf '%s' "$json" > "$f" || { rm -f "$f"; return 1; }
  printf '%s' "$f"
}

# Read the open-PR JSON list a consumer script should use: the caller-supplied
# file (DISPATCH_PR_LIST_FILE) when set, otherwise self-fetch via pr_list_open.
# Centralizes the read pattern shared by dispatch-ci-ready and dispatch-phase.
# Args: $1 = comma-separated --json field set, forwarded to pr_list_open on the
#       self-fetch path.
# Output: the open-PR JSON array on stdout.
# Returns 2 (with a stderr error) when DISPATCH_PR_LIST_FILE is set but unreadable;
# otherwise propagates pr_list_open's exit code on the self-fetch path.
pr_list_import() {
  local fields="$1"
  if [[ -n "${DISPATCH_PR_LIST_FILE:-}" ]]; then
    [[ -r "$DISPATCH_PR_LIST_FILE" ]] || {
      echo "error: DISPATCH_PR_LIST_FILE not readable: $DISPATCH_PR_LIST_FILE" >&2
      return 2
    }
    cat "$DISPATCH_PR_LIST_FILE"
  else
    pr_list_open "$fields"
  fi
}

# Count the open blockers of <issue-num> via GitHub's blocked_by dependency
# edges. Prints an integer; closed blockers do not gate work, so only open
# blockers are counted.
count_open_blockers() {
  local issue_num="$1"
  gh_api_array "/repos/{owner}/{repo}/issues/$issue_num/dependencies/blocked_by" \
    '[.[] | select(.state == "open" or .state == "OPEN")] | length'
}

# Classify a PR's statusCheckRollup into a CI verdict.
# Args: $1 = the statusCheckRollup JSON array (e.g. `gh pr view --json
#   statusCheckRollup | jq '.statusCheckRollup'`).
# Output: prints exactly one of `failing` | `passing` | `pending` to stdout.
#   failing — at least one check run/status context has concluded in a failing
#             state (a concluded failure is actionable even while other checks
#             are still running, so a mixed rollup resolves to `failing`).
#   passing — every entry has concluded passing.
#   pending — no verdict yet: empty rollup, in-progress checks, or any
#             unrecognized non-terminal state.
# This is the classification logic that dispatch-phase applies inline; it is
# factored here so the readiness predicate can reuse it verbatim.
#
# Input shapes — and why only one of them is live (tactic-orphaned-check-run-
# pins-pending-ci-guard, Unit 2). The classifier accepts two entry shapes: the
# GraphQL `statusCheckRollup` CheckRun/StatusContext union, and the REST
# check-runs projection `dispatch_ci_verdict_rest` adapts to it. As of the
# REST-default migration (#1601) `dispatch_ci_verdict_rest` is the ONLY live
# producer — every dispatch caller (dispatch-ci-ready, dispatch-reconcile-ready,
# dispatch-auto-merge, graph-auto-merge, graph-select-target,
# dispatch-context-pack, reconcile-graph-review-stall) reaches the classifier
# through it, and no script feeds a raw `gh pr view --json statusCheckRollup`
# array here any more. So the orphaned-check-run rule (a check run whose parent
# check suite has already concluded is STALE, never pending) is applied ONCE, at
# the REST adaptation point below, and there is deliberately no second
# implementation for the GraphQL shape. If a GraphQL feeder is ever
# reintroduced, apply the same rule at its adaptation point — the GraphQL
# CheckRun node exposes `checkSuite` inline, so it needs no extra API call.
dispatch_classify_rollup() {
  local rollup="$1"
  local rollup_len
  rollup_len=$(printf '%s' "$rollup" | jq 'length')

  # Empty rollup — checks not yet started, nothing actionable.
  if [[ "$rollup_len" -eq 0 ]]; then
    echo "pending"
    return 0
  fi

  # Check for any failing entries first: a concluded failure is actionable even
  # while other checks are still running, so a mixed rollup (some failing, some
  # pending) resolves to failing, not pending.
  local failing
  failing=$(printf '%s' "$rollup" | jq '
    map(
      if has("conclusion") then
        # Check run: failing conclusions
        (.conclusion // "") as $c |
        ($c == "FAILURE" or $c == "TIMED_OUT" or $c == "CANCELLED" or
         $c == "ACTION_REQUIRED" or $c == "STARTUP_FAILURE" or $c == "STALE")
      else
        # Status context: failing states
        (.state // "") as $s |
        ($s == "FAILURE" or $s == "ERROR")
      end
    ) | any
  ')

  if [[ "$failing" == "true" ]]; then
    echo "failing"
    return 0
  fi

  # Check for any pending entries (check runs not yet COMPLETED, or status
  # contexts with state PENDING/EXPECTED). No failures found above, so pending
  # means checks are still running — nothing actionable yet.
  local pending
  pending=$(printf '%s' "$rollup" | jq '
    map(
      if has("conclusion") then
        # Check run: pending only if no terminal conclusion yet (a desynced
        # status=in_progress + non-null conclusion is concluded, not pending) — #2457
        (.conclusion // "") == "" and .status != "COMPLETED"
      else
        # Status context: pending if state is PENDING or EXPECTED
        (.state == "PENDING" or .state == "EXPECTED")
      end
    ) | any
  ')

  if [[ "$pending" == "true" ]]; then
    echo "pending"
    return 0
  fi

  # All entries are passing — check that all passing conditions hold.
  # An entry passes if: check run with conclusion in {SUCCESS,NEUTRAL,SKIPPED},
  # or status context with state SUCCESS.
  local all_passing
  all_passing=$(printf '%s' "$rollup" | jq '
    map(
      if has("conclusion") then
        (.conclusion // "") as $c |
        ($c == "SUCCESS" or $c == "NEUTRAL" or $c == "SKIPPED")
      else
        (.state // "") == "SUCCESS"
      end
    ) | all
  ')

  if [[ "$all_passing" != "true" ]]; then
    # Non-empty rollup with no failures, no pending, but not all passing —
    # unrecognized state, nothing actionable.
    echo "pending"
    return 0
  fi

  echo "passing"
}

# Compute a single PR/commit's CI verdict from a lazy REST check-runs fetch,
# avoiding the per-tick statusCheckRollup GraphQL over-fetch (issue #1601).
# Args: $1 = <sha> — the commit SHA whose check-runs to classify.
# Output: prints exactly one of `failing` | `passing` | `pending` to stdout,
#   matching dispatch_classify_rollup's contract (an empty/absent check-run set
#   maps to `pending`).
# This fetches `repos/{owner}/{repo}/commits/<sha>/check-runs` (one REST call,
# paginated) and reuses dispatch_classify_rollup verbatim. REST reports
# status/conclusion in lowercase (`completed`, `success`, `failure`) whereas the
# classifier — written for the statusCheckRollup CheckRun shape — matches
# UPPERCASE; each adapted entry is `ascii_upcase`d so the classifier applies
# unchanged. Every adapted object carries a `conclusion` key so the classifier's
# `has("conclusion")` check-run branch fires (never the status-context branch).
# Orphaned check runs (tactic-orphaned-check-run-pins-pending-ci-guard). GitHub
# sometimes leaves a check run permanently un-concluded — `status: queued` with
# a null conclusion — while that row's PARENT check suite has already finished.
# A suite cannot conclude and still be running one of its own jobs, so such a
# row will never report and is not retriable (`gh run rerun` answers "This
# workflow run cannot be retried"). Adapted naively it reads `pending` forever,
# which pins graph-select-target's `pending-ci-guard` on a node with every other
# check green and gives the router no automated exit. So: a NON-COMPLETED row
# with NO conclusion whose parent suite reports `status: completed` is adapted as
# `{status: COMPLETED, conclusion: STALE}` — a conclusion dispatch_classify_rollup
# already counts as failing, which routes the node into the fix lane's normal
# budgeted re-push (a new head sha, fresh checks, orphan gone).
#   - Only rows with a NULL conclusion qualify. A row carrying a conclusion
#     behind a stale `in_progress` status is the DIFFERENT, complementary #2457
#     desync, and it is already classified correctly off its conclusion;
#     re-labelling it STALE would flip genuinely-green PRs to failing.
#   - Extra API cost is paid only on a sha that is genuinely mid-flight: when
#     every row is `completed`, or no pending row carries a `check_suite.id`,
#     zero extra calls are made. Otherwise one call per DISTINCT parent suite.
# Memoisation: when DISPATCH_CI_VERDICT_CACHE names a non-empty directory, the
# verdict is cached per-SHA at $DISPATCH_CI_VERDICT_CACHE/<sha> — a cache hit
# returns the stored verdict and makes no REST call; a miss fetches, writes the
# verdict, then prints it. The caller owns the directory's lifecycle (this
# helper does not mkdir it). When the var is unset/empty, every call fetches.
# ONLY TERMINAL verdicts (`passing`, `failing`) are cached. A `pending` verdict
# is deliberately never stored: pending is a statement about a moment, and a sha
# classified pending while its suite was still running must be recomputed once
# the suite concludes — otherwise the orphan rule above is shadowed by the very
# cache entry the orphan produced, for as long as the cache directory lives.
# That window is bounded today, not forever: the only producer is
# dispatch-select-tick, which mktemp -d's the directory and rm -rf's it on EXIT
# (dispatch-select-tick:296-304), and dispatch-ladder-run unsets the var
# outright before every reconciler call. The cost of not caching is therefore
# bounded to repeat queries on one in-flight sha within a single tick. The rule
# is written against the lifecycle CONTRACT rather than today's only caller —
# this helper does not own the directory, so a longer-lived owner would extend
# the shadow without touching this file.
dispatch_ci_verdict_rest() {
  local sha="$1"

  # Memoisation hit: return the cached verdict without a REST call.
  local cache_file=""
  if [[ -n "${DISPATCH_CI_VERDICT_CACHE:-}" ]]; then
    cache_file="$DISPATCH_CI_VERDICT_CACHE/$sha"
    if [[ -f "$cache_file" ]]; then
      cat "$cache_file"
      return 0
    fi
  fi

  # One paginated REST call. `gh api --paginate` emits one JSON object per page,
  # so slurp (`jq -s`) and concatenate every page's `.check_runs` into a single
  # array; `add` over an empty slurp is null, so coerce to `[]`.
  local rows
  rows=$(gh_retry gh api --paginate "repos/{owner}/{repo}/commits/$sha/check-runs" \
    | jq -s 'map(.check_runs) | add // []') || {
    echo "error: dispatch_ci_verdict_rest: check-runs fetch failed for $sha" >&2
    return 1
  }

  # Orphan detection, step 1 — the distinct parent suites of the rows that could
  # be orphans (not completed, no conclusion). Empty on the fast path, which is
  # what keeps the all-green case at exactly one REST call.
  local suite_ids
  suite_ids=$(jq -r '
    [ .[]
      | select((.status // "") != "completed")
      | select((.conclusion // "") == "")
      | .check_suite.id // empty
      | tostring ]
    | unique | .[]' <<<"$rows") || {
    echo "error: dispatch_ci_verdict_rest: check-run projection failed for $sha" >&2
    return 1
  }

  # Step 2 — read each candidate suite once; collect the ids that have concluded.
  local stale_suites="" suite_id suite_json suite_status
  if [[ -n "$suite_ids" ]]; then
    while IFS= read -r suite_id; do
      [[ -n "$suite_id" ]] || continue
      suite_json=$(gh_retry gh api "repos/{owner}/{repo}/check-suites/$suite_id") || {
        echo "error: dispatch_ci_verdict_rest: check-suite fetch failed for suite $suite_id (sha $sha)" >&2
        return 1
      }
      suite_status=$(jq -r '.status // ""' <<<"$suite_json")
      if [[ "$suite_status" == "completed" ]]; then
        stale_suites+="$suite_id"$'\n'
      fi
    done <<<"$suite_ids"
  fi
  local stale_json
  stale_json=$(printf '%s' "$stale_suites" | jq -R -s 'split("\n") | map(select(length > 0))')

  # Step 3 — adapt to the statusCheckRollup CheckRun shape. REST reports
  # lowercase enums, so uppercase every entry; orphaned rows are replaced
  # wholesale by the already-uppercase COMPLETED/STALE pair.
  local adapted
  adapted=$(jq --argjson stale "$stale_json" '
    map(
      if ((.status // "") != "completed")
         and ((.conclusion // "") == "")
         and ((.check_suite.id // "" | tostring) as $sid
              | $sid != "" and ($stale | index($sid)) != null)
      then {status: "COMPLETED", conclusion: "STALE"}
      else {status: (.status | ascii_upcase),
            conclusion: ((.conclusion // "") | ascii_upcase)}
      end
    )' <<<"$rows") || {
    echo "error: dispatch_ci_verdict_rest: check-run adaptation failed for $sha" >&2
    return 1
  }

  local verdict
  verdict=$(dispatch_classify_rollup "$adapted")

  # Memoisation miss: persist TERMINAL verdicts only (see the header note) before
  # printing.
  if [[ -n "$cache_file" && "$verdict" != "pending" ]]; then
    printf '%s\n' "$verdict" > "$cache_file"
  fi

  printf '%s\n' "$verdict"
}

# --- CI-pending liveness bound ------------------------------------------------
#
# Consecutive-observation cap for a draft PR whose CI verdict stays `pending`
# on the SAME head SHA. A baked-in constant, deliberately NOT a dispatch.config
# tunable — parity with CONFLICT_STRIKE_CAP (dispatch-graph-execute) and
# FIX_ATTEMPT_CAP (packages/intentionsutil/src/transitions.ts). The tick fires
# every 15 minutes (OnCalendar=*:0/15), so 8 consecutive observations is
# ~2 hours of a single CI run never concluding — far past any legitimate run in
# this repo, and cheap because every observation below the cap is a file write,
# never a graph record.
DISPATCH_CI_PENDING_STRIKE_CAP=8

# The two helpers below share one sidecar file per node:
#
#   <main-root>/.claude/worktrees/<node-id>.ci-pending-strikes
#
# It lives OUTSIDE every checkout — next to the node's worktree, not inside it —
# the same convention as dispatch-graph-execute's `.conflict-strikes`. That is
# what keeps it from dirtying a tree and from tripping graph-commit's
# `assert_clean_outside_ids`. Both callers (graph-select-target's selection gate
# and reconcile-graph-review-stall's sweep) resolve <main-root> through
# resolve_main_worktree, so the two surfaces agree on one file per node.
#
# Format difference from `.conflict-strikes`, which stores a bare count: this
# one stores `<head-sha> <count>`. The bound means "this ONE CI run never
# concluded", not "this node has been slow over its lifetime", so a differing
# observed SHA resets the count — a fresh push legitimately restarts CI.
#
# Both are FAIL-OPEN and make ZERO graph writes. Losing the sidecar grants a few
# extra free retries and is harmless; a per-observation graph record would not
# be, because a graph-commit can block on the global landing lock for up to
# LOCK_WAIT_SECONDS against a caller whose heartbeat budget is far shorter.

# ci_pending_strike_bump <main-root> <node-id> <head-sha>
# Bumps the node's consecutive-pending count for <head-sha> and prints the new
# count on stdout. Resets to 1 when the file is absent, unparseable, or records
# a different SHA.
#
# Returns 1 WITHOUT writing when <head-sha> is empty or the literal string
# `null`. Callers reach this helper from two different projections: one spells
# `jq -r '.headRefOid // empty'` (empty on a missing field) and one spells a
# bare `jq -r '.headRefOid'` (the four-character string `null`). An unreadable
# PR must not be counted at all — keying every unreadable PR on `null` would
# make them share one counter and hold an arbitrary node.
ci_pending_strike_bump() {
  local main_root="${1:-}" id="${2:-}" sha="${3:-}"
  [[ -z "$main_root" || -z "$id" ]] && return 1
  [[ -z "$sha" || "$sha" == "null" ]] && return 1

  local file="$main_root/.claude/worktrees/$id.ci-pending-strikes"
  local recorded="" c=0
  if [[ -f "$file" ]]; then
    read -r recorded c < "$file" 2>/dev/null || { recorded=""; c=0; }
  fi
  # Validate the count as a literal integer BEFORE any (( )) context: bash
  # arithmetic evaluates array-index command substitution, so an untrusted file
  # value must never reach it unchecked.
  [[ "$c" =~ ^[0-9]+$ ]] || c=0
  if [[ "$recorded" != "$sha" ]]; then
    c=1
  else
    c=$(( c + 1 ))
  fi

  mkdir -p "$main_root/.claude/worktrees" 2>/dev/null
  printf '%s %s\n' "$sha" "$c" > "$file" || return 1
  printf '%s\n' "$c"
}

# ci_pending_strike_clear <main-root> <node-id>
# Drops the node's sidecar. Always returns 0 — a missing file is the normal
# case, and no caller has anything to do about a failed removal.
ci_pending_strike_clear() {
  local main_root="${1:-}" id="${2:-}"
  [[ -n "$main_root" && -n "$id" ]] &&
    rm -f "$main_root/.claude/worktrees/$id.ci-pending-strikes" 2>/dev/null
  return 0
}

# REST-backed drop-in for `gh issue view <N> --json
# number,title,body,state,stateReason,createdAt,labels,assignees` (#2255). The
# dispatch fleet exhausts GitHub's shared GraphQL rate-limit bucket while the
# REST bucket sits idle; the `gh issue view` porcelain spends GraphQL, this
# helper spends REST.
# Args: $1 = <N> (issue number, required); --repo owner/repo (optional, defaults
#   to the current repo via the {owner}/{repo} placeholder); --comments (optional
#   boolean) opts into a SECOND REST call that fetches the issue's comments.
# Output: one JSON object on stdout matching the porcelain shape — an EXPLICIT
#   named projection (not a passthrough of the raw REST object) so the shape is
#   pinned and tested:
#     {number, title, body, state, stateReason, createdAt,
#      labels:[{name}], assignees:[{login}]}
#   With --comments, also: comments:[{author:{login}, createdAt, body}].
# Byte-compat bridges over the raw REST shape:
#   - state: REST returns lowercase `open`/`closed`; the porcelain emits the
#     UPPERCASE GraphQL enum `OPEN`/`CLOSED`. `ascii_upcase` bridges it (same as
#     dispatch_ci_verdict_rest's enum bridge).
#   - stateReason: REST's snake_case `state_reason` is lowercase
#     (`completed`/`not_planned`/`reopened`/null); the porcelain emits the
#     UPPERCASE GraphQL enum (`COMPLETED`/`NOT_PLANNED`/`REOPENED`/null).
#     `ascii_upcase` bridges it; null is preserved exactly (no upcase of null).
#   - createdAt: remapped from REST's snake_case `created_at` (ISO 8601 string,
#     same value the porcelain `createdAt` carries).
#   - labels / assignees: narrowed to the porcelain-visible keys (`name` /
#     `login`) rather than passing the full REST objects through.
# Comments (--comments): a SECOND REST call against the issue's comments endpoint
#   (built with the SAME --repo logic as the main path). It uses the slurp idiom
#   (`gh api --paginate ... | jq -s 'map(.[]) | ...'`) rather than gh_api_array:
#   gh_api_array fetches WITHOUT --paginate (it would truncate at 30 comments),
#   and --paginate can't be bolted onto it (--paginate emits one JSON doc per
#   page, breaking gh_api_array's single-array `type=="array"` validator). Each
#   comment is remapped to {author:{login}, createdAt, body}. Without the flag
#   there is no second call and no `comments` key.
# On gh failure: errors to stderr and returns 1 (clear-errors convention, no
# fallback).
gh_issue_view_rest() {
  local num="" repo="" want_comments=0
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --repo) repo="$2"; shift 2 ;;
      --comments) want_comments=1; shift 1 ;;
      --*) echo "error: gh_issue_view_rest: unknown flag '$1'" >&2; return 1 ;;
      *)
        if [[ -z "$num" ]]; then
          num="$1"; shift 1
        else
          echo "error: gh_issue_view_rest: unexpected argument '$1'" >&2; return 1
        fi
        ;;
    esac
  done
  if [[ -z "$num" ]]; then
    echo "error: gh_issue_view_rest: issue number is required" >&2
    return 1
  fi

  local path
  if [[ -n "$repo" ]]; then
    path="repos/$repo/issues/$num"
  else
    path="repos/{owner}/{repo}/issues/$num"
  fi

  local raw
  raw=$(gh_retry gh api "$path") || {
    echo "error: gh_issue_view_rest: gh api failed for $path" >&2
    return 1
  }

  local projected
  projected=$(printf '%s' "$raw" | jq '{
    number,
    title,
    body: (.body // ""),
    state: (.state | ascii_upcase),
    stateReason: ((.state_reason // null) | (if . == null then null else ascii_upcase end)),
    createdAt: .created_at,
    closedAt: .closed_at,
    labels: ((.labels // []) | map({name})),
    assignees: ((.assignees // []) | map({login}))
  }') || return 1

  if [[ "$want_comments" -eq 0 ]]; then
    printf '%s\n' "$projected"
    return 0
  fi

  # --comments: a second REST call against the issue's comments endpoint, built
  # with the same --repo logic as the main path. Slurp the per-page arrays
  # (--paginate emits one array doc per page), flatten, and remap to the
  # porcelain comment shape. See dispatch_ci_verdict_rest / the header comment for
  # why gh_api_array can't be used here.
  local comments_path
  if [[ -n "$repo" ]]; then
    comments_path="repos/$repo/issues/$num/comments"
  else
    comments_path="repos/{owner}/{repo}/issues/$num/comments"
  fi

  local comments
  comments=$(gh_retry gh api --paginate "$comments_path" \
    | jq -s 'map(.[]) | map({author: {login: .user.login},
                            createdAt: .created_at,
                            body: (.body // "")})') || {
    echo "error: gh_issue_view_rest: gh api failed for $comments_path" >&2
    return 1
  }

  jq --argjson comments "$comments" '. + {comments: $comments}' <<<"$projected"
}

# Resolve a CI run's createdAt and headSha via `gh run view` (porcelain, not
# gh api). The GitHub Actions API is a separate REST bucket from the core REST
# bucket used by gh api, so this call does not spend the core rate-limit.
# Args: $1 = <run-id> (required); --repo owner/repo (optional).
# Output: {"createdAt":"<iso8601>","headSha":"<sha>"} on stdout.
gh_run_view_rest() {
  local id="" repo=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --repo) repo="$2"; shift 2 ;;
      --*) echo "error: gh_run_view_rest: unknown flag '$1'" >&2; return 1 ;;
      *)
        if [[ -z "$id" ]]; then
          id="$1"; shift 1
        else
          echo "error: gh_run_view_rest: unexpected argument '$1'" >&2; return 1
        fi
        ;;
    esac
  done
  if [[ -z "$id" ]]; then
    echo "error: gh_run_view_rest: run id is required" >&2
    return 1
  fi

  local cmd=(gh run view "$id" --json createdAt,headSha)
  [[ -n "$repo" ]] && cmd+=(--repo "$repo")

  local out
  out=$(gh_retry "${cmd[@]}") || {
    echo "error: gh_run_view_rest: gh run view failed for run $id" >&2
    return 1
  }
  printf '%s\n' "$out"
}

# Return the commit SHA that closed an issue, or empty string when the issue
# was closed manually (no commit). Uses the REST issue timeline endpoint, which
# is on the core REST rate-limit bucket.
# Args: $1 = <N> (issue number, required); --repo owner/repo (optional).
# Output: closing commit SHA on stdout, or empty string when none.
gh_issue_closing_commit_rest() {
  local num="" repo=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --repo) repo="$2"; shift 2 ;;
      --*) echo "error: gh_issue_closing_commit_rest: unknown flag '$1'" >&2; return 1 ;;
      *)
        if [[ -z "$num" ]]; then
          num="$1"; shift 1
        else
          echo "error: gh_issue_closing_commit_rest: unexpected argument '$1'" >&2; return 1
        fi
        ;;
    esac
  done
  if [[ -z "$num" ]]; then
    echo "error: gh_issue_closing_commit_rest: issue number is required" >&2
    return 1
  fi

  local path
  if [[ -n "$repo" ]]; then
    path="repos/$repo/issues/$num/timeline"
  else
    path="repos/{owner}/{repo}/issues/$num/timeline"
  fi

  gh_retry gh api --paginate "$path" \
    | jq -rs '[.[][] | select(.event=="closed")] | last | .commit_id // empty' || {
    echo "error: gh_issue_closing_commit_rest: gh api failed for $path" >&2
    return 1
  }
}

# Compare two commits via the GitHub REST compare endpoint and return their
# relationship. Uses the core REST rate-limit bucket.
# Args: $1 = <base-commit> (required); $2 = <head-sha> (required);
#   --repo owner/repo (optional).
# Output: one of: ahead / identical / behind / diverged on stdout.
gh_commit_is_ancestor_rest() {
  local base="" head="" repo=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --repo) repo="$2"; shift 2 ;;
      --*) echo "error: gh_commit_is_ancestor_rest: unknown flag '$1'" >&2; return 1 ;;
      *)
        if [[ -z "$base" ]]; then
          base="$1"; shift 1
        elif [[ -z "$head" ]]; then
          head="$1"; shift 1
        else
          echo "error: gh_commit_is_ancestor_rest: unexpected argument '$1'" >&2; return 1
        fi
        ;;
    esac
  done
  if [[ -z "$base" ]]; then
    echo "error: gh_commit_is_ancestor_rest: base commit is required" >&2
    return 1
  fi
  if [[ -z "$head" ]]; then
    echo "error: gh_commit_is_ancestor_rest: head sha is required" >&2
    return 1
  fi

  local path
  if [[ -n "$repo" ]]; then
    path="repos/$repo/compare/$base...$head"
  else
    path="repos/{owner}/{repo}/compare/$base...$head"
  fi

  gh_retry gh api "$path" | jq -r '.status' || {
    echo "error: gh_commit_is_ancestor_rest: gh api failed for $path" >&2
    return 1
  }
}

# REST-backed drop-in for `gh pr view <N> --json
# number,title,body,state,mergeable,mergeStateStatus,headRefName,headRefOid,labels`
# (#2255). Spends the REST rate-limit bucket instead of GraphQL, like
# gh_issue_view_rest.
# Args: $1 = <N> (PR number, required); --repo owner/repo (optional).
# Output: one JSON object on stdout matching the porcelain shape — an EXPLICIT
#   named projection: {number, title, body, state, mergedAt, mergeCommitSha,
#   mergeable, mergeStateStatus, isDraft, headRefName, headRefOid,
#   labels:[{name}]}.
# Byte-compat bridges over the raw REST shape:
#   - state: lowercase `open`/`closed` → UPPERCASE via `ascii_upcase`. (REST has
#     no distinct MERGED state — a merged PR is state `closed` — so a consumer
#     that distinguishes the porcelain `MERGED` state must test the `mergedAt`
#     field below rather than string-comparing `state`.)
#   - mergedAt: REST's `merged_at` (ISO timestamp, or null for open and for
#     closed-unmerged PRs) passed through under the porcelain camelCase key,
#     mirroring gh_prs_involving_rest's projection and how reconcile-graph-merged
#     reads `.mergedAt`. This is the merged signal REST exposes: a PR is merged
#     iff `mergedAt != null`.
#   - mergeable: REST returns a BOOLEAN (true/false/null); the porcelain emits
#     the GraphQL enum string `MERGEABLE`/`CONFLICTING`/`UNKNOWN` that dispatch
#     call sites string-compare. Mapped explicitly: true→MERGEABLE,
#     false→CONFLICTING, null (or absent)→UNKNOWN.
#   - isDraft: REST's `draft` boolean passed through under the porcelain
#     camelCase key `isDraft` — the same field name and boolean vocabulary
#     `gh pr list --json isDraft` emits, so a consumer can read draftness off
#     either source with one spelling. The raw value is passed through
#     UNCOERCED, so a payload with no `draft` key surfaces as `null` rather
#     than being folded into `false`. Consumers that gate on draftness must
#     therefore compare against `"false"`/`"true"` explicitly and treat `null`
#     as neither — the shape dispatch-ci-ready's non-draft short-circuit
#     already assumes.
#   - mergeStateStatus: remapped from REST's snake_case `mergeable_state` and
#     `ascii_upcase`d to match the porcelain GraphQL enum casing (REST is
#     lowercase `clean`/`dirty`/`blocked`).
#   - headRefName: the PR's head branch name, remapped from REST's `head.ref`
#     (same value the porcelain `headRefName` carries).
#   - headRefOid: the PR's head commit oid, remapped from REST's `head.sha`
#     (same value the porcelain `headRefOid` carries).
#   - mergeCommitSha: REST `merge_commit_sha`. NOT a merge signal on its own —
#     GitHub populates it with the ephemeral test-merge sha on OPEN PRs and
#     leaves a stale value on closed-unmerged PRs. Only trust it as the commit
#     the PR landed as when `mergedAt` is also non-null.
#   - labels: narrowed to the porcelain-visible key (`name`) rather than passing
#     the full REST label objects through (same as gh_issue_view_rest's labels).
# On gh failure: errors to stderr and returns 1 (clear-errors convention, no
# fallback).
# Memoisation: when DISPATCH_PR_JSON_CACHE names a non-empty directory, the
# PROJECTED object (not the raw REST body) is cached per resolved REST path at
# $DISPATCH_PR_JSON_CACHE/<sanitised-path> — a cache hit cats the stored
# projection and makes no REST call; a miss fetches, projects, writes, then
# prints. The key is the resolved path and never the bare PR number: a
# `--repo owner/repo` call and a default `{owner}/{repo}` call address
# different PRs under the same number. Failed fetches are never cached. The var
# is UNSET BY DEFAULT, and unset means every call fetches, so every unarmed
# caller is unaffected. The caller owns the directory's lifecycle (this helper
# does not mkdir it).
# THERE IS NO STATE FILTER AND NO TTL, deliberately: safety here comes from
# ARMING SCOPE, not from what is cached. dispatch_ci_verdict_rest above can
# store TERMINAL verdicts only because its mutable half is also its useless
# half. For PR JSON that relation inverts — the half that is safe to cache
# (merged/closed) is exactly the half the armed consumer skips, and the half it
# needs (OPEN) is exactly the mutable one — so a terminal-only rule here would
# cache nothing useful.
# THE ONLY SANCTIONED ARMING is dispatch-select-tick's back-to-back
# reconcile-graph-merged / reconcile-graph-review-stall pair, where the second
# sweep's candidate set is a strict subset of the first's. There the directory
# is created, passed as a per-command env prefix on exactly those two commands,
# and torn down immediately after — it is NEVER exported. Two readers must
# never see it: graph-auto-merge, which runs EARLIER in the same tick and
# MUTATES PR state (`gh pr ready`), and graph-select-target's `mergedAt`
# freshness checks, which would re-acquire the stale-review-target bug if fed a
# cached pre-merge body.
# Accepted residual: inside the armed window the review-stall sweep reads the
# snapshot the merged sweep took, so its maximum staleness equals the merged
# sweep's own runtime. If a human merges a PR inside that window, review-stall
# could enter a `fix` interrupt on an already-merged PR. Accepted: the write is
# reversible (`apply-fix-state --clear-fix`), the next tick's
# reconcile-graph-merged absorbs the merge to `done` regardless, and every
# same-tick reader whose correctness depends on `mergedAt` freshness sits
# outside the armed window by construction.
gh_pr_view_rest() {
  local num="" repo=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --repo) repo="$2"; shift 2 ;;
      --*) echo "error: gh_pr_view_rest: unknown flag '$1'" >&2; return 1 ;;
      *)
        if [[ -z "$num" ]]; then
          num="$1"; shift 1
        else
          echo "error: gh_pr_view_rest: unexpected argument '$1'" >&2; return 1
        fi
        ;;
    esac
  done
  if [[ -z "$num" ]]; then
    echo "error: gh_pr_view_rest: PR number is required" >&2
    return 1
  fi

  local path
  if [[ -n "$repo" ]]; then
    path="repos/$repo/pulls/$num"
  else
    path="repos/{owner}/{repo}/pulls/$num"
  fi

  # Memoisation hit: return the cached projection without a REST call. Keyed on
  # the resolved path (see the header note), sanitised into a single filename.
  local cache_file="" key
  if [[ -n "${DISPATCH_PR_JSON_CACHE:-}" ]]; then
    key=$(printf '%s' "$path" | tr -c 'A-Za-z0-9._-' '_')
    cache_file="$DISPATCH_PR_JSON_CACHE/$key"
    if [[ -f "$cache_file" ]]; then
      cat "$cache_file"
      return 0
    fi
  fi

  local raw
  raw=$(gh_retry gh api "$path") || {
    echo "error: gh_pr_view_rest: gh api failed for $path" >&2
    return 1
  }

  local projected
  projected=$(jq '{
    number,
    title,
    body: (.body // ""),
    state: (.state | ascii_upcase),
    mergedAt: .merged_at,
    mergeCommitSha: .merge_commit_sha,
    mergeable: (
      if .mergeable == true then "MERGEABLE"
      elif .mergeable == false then "CONFLICTING"
      else "UNKNOWN" end
    ),
    mergeStateStatus: ((.mergeable_state // "") | ascii_upcase),
    isDraft: .draft,
    headRefName: .head.ref,
    headRefOid: .head.sha,
    labels: ((.labels // []) | map({name}))
  }' <<<"$raw") || {
    echo "error: gh_pr_view_rest: projection failed for $path" >&2
    return 1
  }

  # Memoisation miss: persist the PROJECTION, never the raw body, so a hit and a
  # miss emit the same bytes.
  if [[ -n "$cache_file" && -n "$projected" ]]; then
    printf '%s\n' "$projected" > "$cache_file"
  fi

  printf '%s\n' "$projected"
}

# REST-backed mutation: add one or more labels to an issue (#2255).
# Uses POST repos/{owner}/{repo}/issues/<N>/labels which is ADDITIVE (matching
# `gh issue edit --add-label`). Each label is a separate -f flag so gh_retry
# can re-invoke safely without draining a stdin pipe.
# Args: $1 = <N> (issue number, required); then one or more label names;
#   --repo owner/repo (optional).
# On gh failure: errors to stderr and returns 1.
gh_issue_set_labels_rest() {
  local num="" repo=""
  local -a labels=()
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --repo) repo="$2"; shift 2 ;;
      --*) echo "error: gh_issue_set_labels_rest: unknown flag '$1'" >&2; return 1 ;;
      *)
        if [[ -z "$num" ]]; then
          num="$1"; shift 1
        else
          labels+=("$1"); shift 1
        fi
        ;;
    esac
  done
  if [[ -z "$num" ]]; then
    echo "error: gh_issue_set_labels_rest: issue number is required" >&2
    return 1
  fi
  if [[ "${#labels[@]}" -eq 0 ]]; then
    echo "error: gh_issue_set_labels_rest: at least one label is required" >&2
    return 1
  fi

  local path
  if [[ -n "$repo" ]]; then
    path="repos/$repo/issues/$num/labels"
  else
    path="repos/{owner}/{repo}/issues/$num/labels"
  fi

  local -a label_flags=()
  for lbl in "${labels[@]}"; do
    label_flags+=(-f "labels[]=$lbl")
  done

  gh_retry gh api -X POST "$path" "${label_flags[@]}" >/dev/null || {
    echo "error: gh_issue_set_labels_rest: gh api failed for $path" >&2
    return 1
  }
}

# REST-backed mutation: remove a single label from an issue (#2255).
# Uses DELETE repos/{owner}/{repo}/issues/<N>/labels/<name>.
# URL-encodes minimally (space→%20) mirroring gh_issue_list_rest.
# Args: $1 = <N> (issue number, required); $2 = <label> (required);
#   --repo owner/repo (optional).
# A label-absent 404 is treated as success (no-op), mirroring the porcelain
# `gh ... --remove-label` contract. On any other gh failure: errors to stderr
# and returns 1.
gh_issue_remove_label_rest() {
  local num="" label="" repo=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --repo) repo="$2"; shift 2 ;;
      --*) echo "error: gh_issue_remove_label_rest: unknown flag '$1'" >&2; return 1 ;;
      *)
        if [[ -z "$num" ]]; then
          num="$1"; shift 1
        elif [[ -z "$label" ]]; then
          label="$1"; shift 1
        else
          echo "error: gh_issue_remove_label_rest: unexpected argument '$1'" >&2; return 1
        fi
        ;;
    esac
  done
  if [[ -z "$num" ]]; then
    echo "error: gh_issue_remove_label_rest: issue number is required" >&2
    return 1
  fi
  if [[ -z "$label" ]]; then
    echo "error: gh_issue_remove_label_rest: label name is required" >&2
    return 1
  fi

  # Minimal URL-encode: space → %20 (mirrors gh_issue_list_rest).
  local enc_label="${label// /%20}"

  local path
  if [[ -n "$repo" ]]; then
    path="repos/$repo/issues/$num/labels/$enc_label"
  else
    path="repos/{owner}/{repo}/issues/$num/labels/$enc_label"
  fi

  local err
  if ! err=$(gh_retry gh api -X DELETE "$path" 2>&1 >/dev/null); then
    # Porcelain `gh ... --remove-label` is a no-op when the label is absent; REST
    # DELETE returns 404 in that case. The issue/PR is known to exist, so a 404
    # here means the label was not present — treat it as success (faithful to the
    # porcelain contract, not a fallback).
    case "$err" in
      *"HTTP 404"*|*"Not Found"*) return 0 ;;
      *) echo "error: gh_issue_remove_label_rest: gh api failed for $path" >&2; return 1 ;;
    esac
  fi
}

# REST-backed mutation: close an issue (#2255).
# Uses PATCH repos/{owner}/{repo}/issues/<N> with state=closed.
# Args: $1 = <N> (issue number, required); --reason <completed|not_planned>
#   (optional; maps to state_reason, matching `gh issue close --reason`); --comment
#   <body> (optional; posts the comment BEFORE the close, matching the porcelain's
#   comment-then-close ordering); --repo owner/repo (optional).
# On gh failure: errors to stderr and returns 1.
gh_issue_close_rest() {
  local num="" reason="" comment="" has_comment="" repo=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --reason)  reason="$2";  shift 2 ;;
      --comment) comment="$2"; has_comment=1; shift 2 ;;
      --repo)    repo="$2";    shift 2 ;;
      --*) echo "error: gh_issue_close_rest: unknown flag '$1'" >&2; return 1 ;;
      *)
        if [[ -z "$num" ]]; then
          num="$1"; shift 1
        else
          echo "error: gh_issue_close_rest: unexpected argument '$1'" >&2; return 1
        fi
        ;;
    esac
  done
  if [[ -z "$num" ]]; then
    echo "error: gh_issue_close_rest: issue number is required" >&2
    return 1
  fi

  local path
  if [[ -n "$repo" ]]; then
    path="repos/$repo/issues/$num"
  else
    path="repos/{owner}/{repo}/issues/$num"
  fi

  # --comment: post the comment BEFORE the close (matches the porcelain ordering),
  # reusing the exact POST issues/<N>/comments shape from gh_issue_comment_rest.
  if [[ -n "$has_comment" ]]; then
    local comments_path="$path/comments"
    gh_retry gh api -X POST "$comments_path" -f "body=$comment" >/dev/null || {
      echo "error: gh_issue_close_rest: gh api failed for $comments_path" >&2
      return 1
    }
  fi

  # --reason: send state_reason only when passed (preserves prior behavior for
  # callers that omit it). The flag value maps directly to GitHub's state_reason.
  local -a reason_flag=()
  [[ -n "$reason" ]] && reason_flag=(-f "state_reason=$reason")

  gh_retry gh api -X PATCH "$path" -f state=closed "${reason_flag[@]}" >/dev/null || {
    echo "error: gh_issue_close_rest: gh api failed for $path" >&2
    return 1
  }
}

# REST-backed mutation: reopen a closed issue (#2337).
# Uses PATCH repos/{owner}/{repo}/issues/<N> with state=open (no state_reason).
# Args: $1 = <N> (issue number, required); --comment <body> (optional; posts the
#   comment BEFORE the reopen, matching gh_issue_close_rest's comment-then-mutate
#   ordering); --repo owner/repo (optional).
# On gh failure: errors to stderr and returns 1.
gh_issue_reopen_rest() {
  local num="" comment="" has_comment="" repo=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --comment) comment="$2"; has_comment=1; shift 2 ;;
      --repo)    repo="$2";    shift 2 ;;
      --*) echo "error: gh_issue_reopen_rest: unknown flag '$1'" >&2; return 1 ;;
      *)
        if [[ -z "$num" ]]; then
          num="$1"; shift 1
        else
          echo "error: gh_issue_reopen_rest: unexpected argument '$1'" >&2; return 1
        fi
        ;;
    esac
  done
  if [[ -z "$num" ]]; then
    echo "error: gh_issue_reopen_rest: issue number is required" >&2
    return 1
  fi

  local path
  if [[ -n "$repo" ]]; then
    path="repos/$repo/issues/$num"
  else
    path="repos/{owner}/{repo}/issues/$num"
  fi

  # --comment: post the comment BEFORE the reopen (matches the porcelain ordering),
  # reusing the exact POST issues/<N>/comments shape from gh_issue_comment_rest.
  if [[ -n "$has_comment" ]]; then
    local comments_path="$path/comments"
    gh_retry gh api -X POST "$comments_path" -f "body=$comment" >/dev/null || {
      echo "error: gh_issue_reopen_rest: gh api failed for $comments_path" >&2
      return 1
    }
  fi

  gh_retry gh api -X PATCH "$path" -f state=open >/dev/null || {
    echo "error: gh_issue_reopen_rest: gh api failed for $path" >&2
    return 1
  }
}

# REST-backed mutation: edit an issue's title and/or body (#2255).
# Uses PATCH repos/{owner}/{repo}/issues/<N>. PRs are issues in REST, so this same
# helper later serves `gh pr edit --body`.
# Args: $1 = <N> (issue number, required); --title <t> and/or --body <b> OR
#   --body-file <f> (at least one of title/body required; --body/--body-file
#   mutually exclusive); --repo owner/repo (optional).
# On gh failure: errors to stderr and returns 1.
gh_issue_edit_rest() {
  local num="" title="" has_title="" body="" body_file="" repo=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --title)     title="$2"; has_title=1; shift 2 ;;
      --body)      body="$2";      shift 2 ;;
      --body-file) body_file="$2"; shift 2 ;;
      --repo)      repo="$2";      shift 2 ;;
      --*) echo "error: gh_issue_edit_rest: unknown flag '$1'" >&2; return 1 ;;
      *)
        if [[ -z "$num" ]]; then
          num="$1"; shift 1
        else
          echo "error: gh_issue_edit_rest: unexpected argument '$1'" >&2; return 1
        fi
        ;;
    esac
  done
  if [[ -z "$num" ]]; then
    echo "error: gh_issue_edit_rest: issue number is required" >&2
    return 1
  fi
  if [[ -n "$body" && -n "$body_file" ]]; then
    echo "error: gh_issue_edit_rest: --body and --body-file are mutually exclusive" >&2
    return 1
  fi
  if [[ -z "$has_title" && -z "$body" && -z "$body_file" ]]; then
    echo "error: gh_issue_edit_rest: at least one of --title/--body/--body-file is required" >&2
    return 1
  fi

  local path
  if [[ -n "$repo" ]]; then
    path="repos/$repo/issues/$num"
  else
    path="repos/{owner}/{repo}/issues/$num"
  fi

  local -a edit_flags=()
  [[ -n "$has_title" ]] && edit_flags+=(-f "title=$title")
  if [[ -n "$body_file" ]]; then
    # -F body=@file re-reads the file on each retry attempt — safe for gh_retry.
    edit_flags+=(-F "body=@$body_file")
  elif [[ -n "$body" ]]; then
    edit_flags+=(-f "body=$body")
  fi

  gh_retry gh api -X PATCH "$path" "${edit_flags[@]}" >/dev/null || {
    echo "error: gh_issue_edit_rest: gh api failed for $path" >&2
    return 1
  }
}

# REST-backed mutation: create a new issue (#2255).
# Uses POST repos/{owner}/{repo}/issues.
# Echoes the new issue URL (.html_url) to stdout, matching `gh issue create` output.
# Args: --title <t> (required); --body <b> OR --body-file <f> (exactly one
#   required); --label <l> (repeatable); --repo owner/repo (optional).
# On gh failure: errors to stderr and returns 1.
gh_issue_create_rest() {
  local title="" body="" body_file="" repo=""
  local -a label_flags=()
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --title)     title="$2"; shift 2 ;;
      --body)      body="$2";      shift 2 ;;
      --body-file) body_file="$2"; shift 2 ;;
      --label) label_flags+=(-f "labels[]=$2"); shift 2 ;;
      --repo)  repo="$2";  shift 2 ;;
      *) echo "error: gh_issue_create_rest: unknown flag '$1'" >&2; return 1 ;;
    esac
  done
  if [[ -z "$title" ]]; then
    echo "error: gh_issue_create_rest: --title is required" >&2
    return 1
  fi
  if [[ -n "$body" && -n "$body_file" ]]; then
    echo "error: gh_issue_create_rest: --body and --body-file are mutually exclusive" >&2
    return 1
  fi
  if [[ -z "$body" && -z "$body_file" ]]; then
    echo "error: gh_issue_create_rest: exactly one of --body/--body-file is required" >&2
    return 1
  fi

  local path
  if [[ -n "$repo" ]]; then
    path="repos/$repo/issues"
  else
    path="repos/{owner}/{repo}/issues"
  fi

  local -a body_flag=()
  if [[ -n "$body_file" ]]; then
    # -F body=@file re-reads the file on each retry attempt — safe for gh_retry.
    body_flag=(-F "body=@$body_file")
  else
    body_flag=(-f "body=$body")
  fi

  local raw
  raw=$(gh_retry gh api -X POST "$path" \
    -f "title=$title" \
    "${body_flag[@]}" \
    "${label_flags[@]}") || {
    echo "error: gh_issue_create_rest: gh api failed for $path" >&2
    return 1
  }

  printf '%s' "$raw" | jq -r '.html_url'
}

# REST-backed mutation: add a comment to an issue (#2255).
# Uses POST repos/{owner}/{repo}/issues/<N>/comments.
# Args: $1 = <N> (issue number, required); --body <b> OR --body-file <f>
#   (exactly one required); --repo owner/repo (optional).
# On gh failure: errors to stderr and returns 1.
gh_issue_comment_rest() {
  local num="" body="" body_file="" repo=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --body)      body="$2";      shift 2 ;;
      --body-file) body_file="$2"; shift 2 ;;
      --repo)      repo="$2";      shift 2 ;;
      --*) echo "error: gh_issue_comment_rest: unknown flag '$1'" >&2; return 1 ;;
      *)
        if [[ -z "$num" ]]; then
          num="$1"; shift 1
        else
          echo "error: gh_issue_comment_rest: unexpected argument '$1'" >&2; return 1
        fi
        ;;
    esac
  done
  if [[ -z "$num" ]]; then
    echo "error: gh_issue_comment_rest: issue number is required" >&2
    return 1
  fi
  if [[ -z "$body" && -z "$body_file" ]]; then
    echo "error: gh_issue_comment_rest: --body or --body-file is required" >&2
    return 1
  fi
  if [[ -n "$body" && -n "$body_file" ]]; then
    echo "error: gh_issue_comment_rest: --body and --body-file are mutually exclusive" >&2
    return 1
  fi

  local path
  if [[ -n "$repo" ]]; then
    path="repos/$repo/issues/$num/comments"
  else
    path="repos/{owner}/{repo}/issues/$num/comments"
  fi

  local -a body_flag=()
  if [[ -n "$body_file" ]]; then
    # -F body=@file re-reads the file on each retry attempt — safe for gh_retry.
    body_flag=(-F "body=@$body_file")
  else
    body_flag=(-f "body=$body")
  fi

  gh_retry gh api -X POST "$path" "${body_flag[@]}" >/dev/null || {
    echo "error: gh_issue_comment_rest: gh api failed for $path" >&2
    return 1
  }
}

# REST-backed mutation: merge a pull request (#2255).
# Uses PUT repos/{owner}/{repo}/pulls/<N>/merge with merge_method.
# Args: $1 = <N> (PR number, required); [--squash|--merge|--rebase] (default:
#   merge); --subject <s> (optional; commit_title); --body <b> (optional;
#   commit_message); --repo owner/repo (optional).
# On gh failure: errors to stderr and returns 1.
gh_pr_merge_rest() {
  local num="" method="merge" subject="" has_subject="" body="" has_body="" repo=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --squash)  method="squash"; shift 1 ;;
      --merge)   method="merge";  shift 1 ;;
      --rebase)  method="rebase"; shift 1 ;;
      --subject) subject="$2"; has_subject=1; shift 2 ;;
      --body)    body="$2";    has_body=1;    shift 2 ;;
      --repo)    repo="$2";       shift 2 ;;
      --*) echo "error: gh_pr_merge_rest: unknown flag '$1'" >&2; return 1 ;;
      *)
        if [[ -z "$num" ]]; then
          num="$1"; shift 1
        else
          echo "error: gh_pr_merge_rest: unexpected argument '$1'" >&2; return 1
        fi
        ;;
    esac
  done
  if [[ -z "$num" ]]; then
    echo "error: gh_pr_merge_rest: PR number is required" >&2
    return 1
  fi

  local path
  if [[ -n "$repo" ]]; then
    path="repos/$repo/pulls/$num/merge"
  else
    path="repos/{owner}/{repo}/pulls/$num/merge"
  fi

  # commit_title only when --subject is passed. commit_message is OMITTED when the
  # --body value is empty: `gh pr merge --body ""` yields an empty commit-message
  # body (no extra body lines), which the REST API replicates by sending no
  # commit_message at all.
  local -a commit_flags=()
  [[ -n "$has_subject" ]] && commit_flags+=(-f "commit_title=$subject")
  [[ -n "$has_body" && -n "$body" ]] && commit_flags+=(-f "commit_message=$body")

  gh_retry gh api -X PUT "$path" -f "merge_method=$method" "${commit_flags[@]}" >/dev/null || {
    echo "error: gh_pr_merge_rest: gh api failed for $path" >&2
    return 1
  }
}

# REST-backed mutation: update a pull request's branch with the latest upstream
# base (tactic-graph-auto-merge-up-to-date-gate).
# Uses PUT repos/{owner}/{repo}/pulls/<N>/update-branch.
#
# The endpoint MERGES the base branch INTO the PR head — it creates a merge
# commit on the head branch and re-triggers CI on that fresh base. It does NOT
# rebase, so the head oid changes but the branch's own history is preserved.
#
# `expected_head_sha` is a compare-and-swap guard: GitHub rejects the update
# with HTTP 422 when the head moved since the caller sensed it, so a racing push
# can never be silently merged over. gh_retry (lib.sh:125) retries only
# transient failures, so a 422 returns immediately rather than being retried.
#
# Args: $1 = <N> (PR number, required); --expected-head-sha <sha> (optional);
#   --repo owner/repo (optional).
# On gh failure: errors to stderr and returns 1.
gh_pr_update_branch_rest() {
  local num="" expected="" has_expected="" repo=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --expected-head-sha) expected="$2"; has_expected=1; shift 2 ;;
      --repo)              repo="$2";                     shift 2 ;;
      --*) echo "error: gh_pr_update_branch_rest: unknown flag '$1'" >&2; return 1 ;;
      *)
        if [[ -z "$num" ]]; then
          num="$1"; shift 1
        else
          echo "error: gh_pr_update_branch_rest: unexpected argument '$1'" >&2; return 1
        fi
        ;;
    esac
  done
  if [[ -z "$num" ]]; then
    echo "error: gh_pr_update_branch_rest: PR number is required" >&2
    return 1
  fi

  local path
  if [[ -n "$repo" ]]; then
    path="repos/$repo/pulls/$num/update-branch"
  else
    path="repos/{owner}/{repo}/pulls/$num/update-branch"
  fi

  # expected_head_sha only when --expected-head-sha is passed; omitting it lets
  # GitHub update whatever the current head is (no CAS guard).
  local -a flags=()
  [[ -n "$has_expected" ]] && flags+=(-f "expected_head_sha=$expected")

  gh_retry gh api -X PUT "$path" "${flags[@]}" >/dev/null || {
    echo "error: gh_pr_update_branch_rest: gh api failed for $path" >&2
    return 1
  }
}

# Detect what Firebase features the app uses.
# Sets global variables: USES_FIRESTORE, USES_AUTH, USES_STORAGE, USES_FUNCTIONS
# Args: $1 = path to app src/ directory, $2 = repo root, $3 = app name
detect_features() {
  local app_src_dir="$1"
  local repo_root="$2"
  local app_name="$3"

  if [ ! -d "$app_src_dir" ]; then
    echo "ERROR: app source directory not found: $app_src_dir" >&2
    return 1
  fi

  # Detect Firestore: direct firebase SDK import or createAppContext usage
  USES_FIRESTORE=false
  if grep -rq -e '"firebase/firestore"' -e 'firebaseutil/app-context' "$app_src_dir" 2>/dev/null; then
    USES_FIRESTORE=true
  fi

  # Detect Auth: direct firebase SDK import, authutil wrapper packages, or the
  # createAppContext `enableAuth: true` opt-in. The opt-in marker matters when an
  # app routes all auth through a shared bootstrap (e.g. blog's createBlogApp), so
  # its own src/ no longer imports firebase/auth directly but firebase.ts still
  # configures auth via enableAuth.
  USES_AUTH=false
  if grep -rq -e '"firebase/auth"' -e 'authutil/app-auth' -e 'authutil/firebase-auth' -e 'enableAuth: *true' "$app_src_dir" 2>/dev/null; then
    USES_AUTH=true
  fi

  # Detect Storage: direct firebase SDK import or createAppContext with storage option
  USES_STORAGE=false
  if grep -rq -e '"firebase/storage"' "$app_src_dir" 2>/dev/null; then
    USES_STORAGE=true
  elif grep -rl 'firebaseutil/app-context' "$app_src_dir" 2>/dev/null | xargs grep -q 'storage:\s*true' 2>/dev/null; then
    USES_STORAGE=true
  fi

  # Detect Cloud Functions by checking for any function rewrites in firebase.json
  USES_FUNCTIONS=false
  if [ -d "$repo_root/functions" ] && jq -e '.hosting[] | select(.target == "'"$app_name"'") | .rewrites[]? | select(.function)' "$repo_root/firebase.json" >/dev/null 2>&1; then
    USES_FUNCTIONS=true
  fi
}

# Install workspace dependencies if node_modules is missing.
# Requires REPO_ROOT to be set by the caller.
ensure_deps() {
  if [ -z "${REPO_ROOT:-}" ]; then
    echo "ERROR: REPO_ROOT is not set" >&2
    return 1
  fi
  if [ ! -d "$REPO_ROOT/node_modules" ]; then
    (
      cd "$REPO_ROOT"
      "$(dirname "${BASH_SOURCE[0]}")/npm-ci-with-retry.sh"
    )
  fi
}

# ---- wait_for_dpkg_lock — best-effort wait for the dpkg/apt lock to free ----
# On real CI a timed-out `apt-get` (see playwright_install_with_deps below)
# leaves its apt-get/dpkg grandchildren running in the background holding
# /var/lib/dpkg/lock-frontend, so an immediate retry fails fast on
# "E: Could not get lock" instead of actually retrying. This polls the lock
# with a non-blocking `flock -s` (shared probe: succeeds once no writer holds
# it) for up to DPKG_LOCK_WAIT_TIMEOUT seconds before giving up. Best-effort:
# degrades to a no-op when the lock file is absent or `flock` isn't installed
# (mirrors the lib-decision-log.sh `command -v flock` guard), and always
# returns 0 so it never fails the caller.
# Tunables (env): DPKG_LOCK_FILE (default /var/lib/dpkg/lock-frontend),
# DPKG_LOCK_WAIT_TIMEOUT (default 30 seconds).
# Deliberately single-file, unlike the pr-checks.yml `Disable
# unattended-upgrades / free dpkg lock` step, which probes all three of
# lock-frontend, /var/lib/apt/lists/lock and /var/lib/dpkg/lock. That step runs
# before any job work and must survive an arbitrary holder — including a bare
# `dpkg`, which takes only /var/lib/dpkg/lock. This helper runs in one narrow
# spot: the post-failure retry backstop inside playwright_install_with_deps,
# where the holder is always the previous attempt's own apt-get tree. apt-get
# takes lock-frontend first and holds it for the whole run, so waiting on
# lock-frontend alone is sufficient there; DPKG_LOCK_FILE remains available if a
# future caller needs a different one.
#
# Why the default is 30s and NOT the pre-step's 120s — this multiplies out. The
# call site (below, after each FAILED attempt) fans out as:
#   attempts x invocations-per-app x apps
# preview-and-smoke:  PLAYWRIGHT_INSTALL_ATTEMPTS=2 attempts
#                   x 2 smoke runs per app (run-all-preview-deploy-smoke.sh
#                     re-deploys and re-smokes once on smoke failure)
#                   x 6 apps with a hosting target (firebase.json)
#                   = up to 24 waits.
# acceptance:         2 attempts x 1 invocation x 6 apps with
#                     e2e/playwright.config.ts = up to 12 waits.
# At 120s that is 48 min (preview-and-smoke, budget 30 min, raised from 20 by
# this same PR) and 24 min (acceptance, budget 30 min) of pure lock waiting.
# At 30s it is 12 min / 6 min.
# The long wait belongs in the pr-checks.yml pre-step, which waits up to 120s
# ONCE before any job work and escalates to `fuser -k`; this helper is only a
# post-failure backstop, and its holder is the previous attempt's own apt-get
# tree that kill_tree just SIGTERM'd + SIGKILL'd (see kill_tree below) — it
# frees within seconds or not at all, so 30s is ample and 120s only burns the
# job budget 24x over. Callers needing longer set DPKG_LOCK_WAIT_TIMEOUT.
wait_for_dpkg_lock() {
  local lockfile="${DPKG_LOCK_FILE:-/var/lib/dpkg/lock-frontend}"
  local deadline="${DPKG_LOCK_WAIT_TIMEOUT:-30}"
  [ -e "$lockfile" ] || return 0
  command -v flock >/dev/null 2>&1 || return 0

  local waited=0
  while [ "$waited" -lt "$deadline" ]; do
    if flock -s -n "$lockfile" true 2>/dev/null; then
      return 0
    fi
    sleep 1
    waited=$((waited + 1))
  done
  echo "wait_for_dpkg_lock: ${lockfile} still held after ${deadline}s; retrying anyway" >&2
  return 0
}

# ---- playwright_install_with_deps — bounded, timed Playwright browser install -
# Wraps `npx playwright install --with-deps chromium` (which shells out to apt-get
# and can stall indefinitely on a flaky archive mirror — #1899) in a per-attempt
# `timeout` plus a small retry loop, so a transient network stall fails fast and
# retries instead of hanging until GitHub's 6-hour job cap. Skips entirely when
# PLAYWRIGHT_BROWSERS_PATH is set (nix provides browsers). Must run from the app
# directory (npx resolves the project's playwright). Tunables (env):
# PLAYWRIGHT_INSTALL_TIMEOUT (default 300 seconds, per attempt),
# PLAYWRIGHT_INSTALL_ATTEMPTS (default 2 = 1 try + 1 retry). Returns non-zero (so
# the caller's `set -e` aborts) once attempts are exhausted.
playwright_install_with_deps() {
  if [ -n "${PLAYWRIGHT_BROWSERS_PATH:-}" ]; then
    return 0
  fi
  local timeout_s="${PLAYWRIGHT_INSTALL_TIMEOUT:-300}"
  local attempts="${PLAYWRIGHT_INSTALL_ATTEMPTS:-2}"
  local attempt=1
  while [ "$attempt" -le "$attempts" ]; do
    if [ "$attempt" -gt 1 ]; then
      echo "playwright_install_with_deps: attempt $attempt/$attempts" >&2
    fi

    # Background the bounded install so we can capture its PID and, on a stall,
    # kill the WHOLE tree — `timeout` alone only signals npx/node, leaving the
    # sudo/apt-get/dpkg grandchildren alive to hold the dpkg lock (PR #2946).
    # The outer `timeout` bound is looser than our own deadline so OUR watchdog
    # fires first, while node's apt-get child is still a live descendant
    # (before node's death reparents it to init, out of kill_tree's reach).
    timeout --kill-after=30 "$((timeout_s + 60))" \
      npx playwright install --with-deps chromium &
    local install_pid=$!
    local start_ts; start_ts=$(date +%s)

    # Watchdog: after timeout_s of REAL wall-clock, if the install is still
    # running it has stalled — kill its whole tree. The elapsed-time guard
    # makes this inert when `sleep` is stubbed instant (unit tests): no real
    # time passed => not a stall.
    (
      # Background our own sleep (known PID) instead of running it as a plain
      # non-final child: bash forks a non-final `sleep` into a real child that
      # `kill "$watchdog_pid"` (the fast-path cancel below) can't reach — it
      # would orphan to init and idle for the rest of timeout_s. A TERM trap
      # relays that cancel straight to the sleep so it dies immediately.
      #
      # Install the trap BEFORE the fork: in the window between `sleep &` and
      # the trap the subshell still has TERM's default disposition, so a cancel
      # landing there would kill the watchdog outright and orphan the sleep —
      # the exact leak this guards against. The trap only records the cancel
      # (and relays it when the pid is already known); the post-fork check
      # closes the remaining sliver where the trap ran after the fork but
      # before `sleep_pid` was assigned. The trap must NOT exit on its own: a
      # TERM arriving once the watchdog is already inside kill_tree would abort
      # the SIGTERM->grace->SIGKILL escalation the block below relies on.
      cancelled=
      trap 'cancelled=1; kill "${sleep_pid:-}" 2>/dev/null || true' TERM
      sleep "$timeout_s" &
      sleep_pid=$!
      if [ -n "$cancelled" ]; then
        kill "$sleep_pid" 2>/dev/null || true
        exit 0
      fi
      # `|| true` + the explicit cancelled check: on cancel `wait` returns 143,
      # and without them the fall-through into the kill decision below would be
      # stopped only by the caller happening to run with errexit.
      wait "$sleep_pid" || true
      if [ -n "$cancelled" ]; then
        exit 0
      fi
      now=$(date +%s)
      if [ "$((now - start_ts))" -ge "$timeout_s" ] && kill -0 "$install_pid" 2>/dev/null; then
        kill_tree "$install_pid"
      fi
    ) &
    local watchdog_pid=$!

    local rc=0
    wait "$install_pid" || rc=$?
    # If the watchdog already fired (real elapsed >= deadline, i.e. a stall) it
    # is mid kill_tree — let it finish the SIGTERM->grace->SIGKILL escalation
    # instead of aborting it in the grace window (which would leave SIGTERM-
    # ignoring grandchildren alive). Only cancel the watchdog when it is still
    # idle in its initial sleep (fast success/failure, elapsed < deadline).
    if [ "$(( $(date +%s) - start_ts ))" -ge "$timeout_s" ]; then
      wait "$watchdog_pid" 2>/dev/null || true
    else
      kill "$watchdog_pid" 2>/dev/null || true
      wait "$watchdog_pid" 2>/dev/null || true
    fi

    if [ "$rc" -eq 0 ]; then
      return 0
    fi

    echo "playwright_install_with_deps: attempt $attempt/$attempts failed or timed out after ${timeout_s}s" >&2
    kill_tree "$install_pid" 2>/dev/null || true   # sweep survivors on non-stall failures too
    wait_for_dpkg_lock
    attempt=$((attempt + 1))
    if [ "$attempt" -le "$attempts" ]; then
      sleep 5
    fi
  done
  echo "playwright_install_with_deps: failed after $attempts attempts" >&2
  return 1
}

# Ensure Playwright browsers are resolvable. When PLAYWRIGHT_BROWSERS_PATH is
# unset and nix is available (NixOS), re-exec the calling script under
# `nix develop --command` so the devShell shellHook exports the nix-provisioned
# browsers path. When nix is unavailable (e.g. CI on ubuntu), return so the
# caller's `npx playwright install --with-deps chromium` fallback runs.
#
# Call as: ensure_playwright_browsers "$0" "$@"
ensure_playwright_browsers() {
  if [ -n "${PLAYWRIGHT_BROWSERS_PATH:-}" ]; then
    return 0
  fi
  if command -v nix >/dev/null 2>&1; then
    if [ -n "${_DISPATCH_NIX_REEXEC:-}" ]; then
      echo "ERROR: re-exec'd under 'nix develop' but PLAYWRIGHT_BROWSERS_PATH is still unset." >&2
      echo "       Enter the dev shell ('direnv allow', or 'nix develop') and retry." >&2
      return 1
    fi
    local flake_dir
    flake_dir="$(git rev-parse --show-toplevel 2>/dev/null)" || {
      echo "ERROR: could not determine repo root; ensure you are inside a git repository" >&2
      return 1
    }
    [ -n "$flake_dir" ] || {
      echo "ERROR: git rev-parse --show-toplevel returned empty string" >&2
      return 1
    }
    export _DISPATCH_NIX_REEXEC=1
    exec nix develop "$flake_dir" --command "$@"
  fi
  # nix unavailable (CI ubuntu): caller's npx fallback handles install
  return 0
}

# Extract the app name from the app directory path.
# Args: $1 = app directory (e.g. "hello" or "/path/to/hello")
get_app_name() {
  basename "$1"
}

# Return the name of the current git worktree directory, or empty string
# for a standard (non-worktree) checkout.
get_worktree_id() {
  local git_dir common_dir
  git_dir="$(git rev-parse --git-dir 2>/dev/null)" || return 0
  common_dir="$(git rev-parse --git-common-dir 2>/dev/null)" || return 0
  if [ "$git_dir" != "$common_dir" ]; then
    basename "$git_dir"
  fi
}

# Print the project root (parent of git --git-common-dir) to stdout.
# Returns non-zero if not in a git repo. Prints no error and does not exit —
# the caller supplies its own message/cleanup via `|| { … }`.
#
# This body is duplicated, deliberately, in lib-repo-roots.sh — which is the
# canonical home and the single definition the three worktree hooks share.
# lib.sh does NOT source it: ~17 test fixtures copy lib.sh into a temp scripts
# dir by name (`cp "$SCRIPT_DIR/lib.sh" "$TMP/scripts/lib.sh"`), so giving
# lib.sh a new sibling dependency breaks every one of them at source time with
# `resolve_project_root: command not found`. Measured — CI caught exactly that.
# test-lib-repo-roots.sh asserts the two definitions agree, so drift is a red
# test rather than a silent divergence. Collapsing these into one definition
# means converting those fixtures to the `lib-*.sh` glob form that a few
# already use; that is a separate, mechanical change.
#
# The `[ -n "$common_dir" ]` guard is load-bearing — see lib-repo-roots.sh's
# copy for the rationale. Keep the two bodies byte-identical.
resolve_project_root() {
  local common_dir
  common_dir="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" || return 1
  [ -n "$common_dir" ] || return 1
  dirname "$common_dir"
}

# Assert the primary checkout at <path> is on `main`. Returns 0 silently when it
# is; otherwise prints a loud, labeled error to stderr and returns 1 — never
# auto-switches. The primary checkout (the worktree with `main` checked out) is
# assumed by two unattended paths: the dispatch-select-tick main-sync
# (`git fetch origin main && git merge --ff-only origin/main`, which can only
# fast-forward a checkout actually on `main`) and provision-node-worktree's
# project-root resolution (which finds the worktree with `main` checked out).
# A drift off `main` (e.g. a failed `git worktree add` + chained `cd` falling
# through to the primary checkout — the 2026-07-21 direct-to-main incident,
# PR #2925) silently breaks both. This is a condition on
# `strategy-autonomous-execution`. Capture symbolic-ref's output and status so a
# caller under `set -e` is not killed — call as `... || { … }` or in an `if`.
assert_primary_checkout_on_main() {
  local path="$1" branch rc
  branch="$(git -C "$path" symbolic-ref --short HEAD 2>/dev/null)"
  rc=$?
  if [[ $rc -eq 0 && "$branch" == "main" ]]; then
    return 0
  fi
  local found
  if [[ $rc -ne 0 ]]; then
    found="detached HEAD or not resolvable"
  else
    found="'$branch'"
  fi
  echo "assert_primary_checkout_on_main: INVARIANT VIOLATED — the primary checkout at '$path' must stay on 'main' (a condition on strategy-autonomous-execution), but found $found." >&2
  echo "  Repair: git -C \"$path\" switch main" >&2
  return 1
}

# Fast-forward the main checkout at <project-root> onto origin/main.
#
# WHY THIS IS A FUNCTION AND NOT A BARE FETCH. `git fetch` moves REFS ONLY — it
# never touches a working tree. So anything that then READS that checkout (a
# store directory under intentions/, a candidate enumeration, a merge base) is
# reading whatever happened to be checked out last, which may be arbitrarily far
# behind origin/main. Fetch-without-merge is the defect recorded as
# tactic-provision-revalidation-reads-stale-main-checkout: provision-node-worktree
# fetched, then pointed check-node-selection.ts at the unmoved working tree and
# reported a false `stale-selection` (exit 12) against a perfectly current
# selection, halting a /dispatch-ladder run twice on 2026-08-13. Callers that
# READ FROM or WRITE INTO the main checkout call this, never a bare fetch.
#
# `--ff-only` doubles as the dirty/diverged-tree guard: a checkout carrying
# uncommitted changes or local commits refuses to fast-forward, and that is
# exactly the state no caller may merge into or write from.
#
# Args: $1 = the main checkout's path (the project root — what
#            resolve_main_worktree, or resolve_project_root on the de-bared
#            layout, prints).
#
# Both git calls send their STDOUT to stderr (`1>&2`), the form every call site
# already used, so nothing here can contaminate the caller's stdout. git's own
# STDERR is left to inherit the caller's fd 2 — a call site that wants it
# captured redirects at the call site rather than this function hardcoding it.
#
# Returns 0 on a clean fast-forward; 1 if the FETCH failed (origin unreachable,
# auth, a broken remote); 2 if the MERGE failed (the tree is dirty or diverged).
# The two are DISTINCT because the escalations differ and each call site phrases
# its own: a failed fetch is a transient/environment problem, a failed merge is
# a wedged tree that needs a person.
#
# Sandbox: `git merge` updates the working tree non-transactionally, and this
# repo's checkout contains the read-only `.claude/` carve-outs, so every caller
# must already run with `dangerouslyDisableSandbox: true`
# (.claude/rules/sandbox.md, "Tree-updating git ops touching read-only paths").
# This adds no new requirement — every current call site already required it for
# the open-coded merge this replaces.
sync_main_checkout() {
  local root="$1"
  git -C "$root" fetch origin main 1>&2 || return 1
  git -C "$root" merge --ff-only origin/main 1>&2 || return 2
}

# Print the canonical dispatch selection-lock file path to stdout. An explicit
# DISPATCH_LOCK_FILE is authoritative and bypasses the git lookup (tests rely on
# this). Otherwise the lock lives at the shared project-root tmp/ (not a per-
# worktree tmp/) so concurrent ticks in different worktrees contend on the same
# file. Returns non-zero (no output) when DISPATCH_LOCK_FILE is unset AND
# resolve_project_root fails (not in a git repo); the caller supplies its own
# error message. Mirrors dispatch-acquire-lock's Step-1 logic so the tick (which
# writes the headless liveness sentinel) and the lock script resolve the same
# lock-file directory. See #1068.
dispatch_lock_file() {
  local project_root
  if [[ -n "${DISPATCH_LOCK_FILE:-}" ]]; then
    printf '%s\n' "$DISPATCH_LOCK_FILE"
    return 0
  fi
  project_root=$(resolve_project_root) || return 1
  printf '%s\n' "$project_root/tmp/dispatch.lock"
}

# Print the sync-repair attempt-counter file path to stdout. An explicit
# DISPATCH_SYNC_REPAIR_ATTEMPTS_FILE is authoritative and bypasses the git
# lookup (tests rely on this). Otherwise the file lives at the shared
# project-root tmp/ (not a per-worktree tmp/) so concurrent ticks in different
# worktrees contend on the same counter — the same rationale as
# dispatch_lock_file. Returns non-zero (no output) when the override is unset
# AND resolve_project_root fails (not in a git repo); the caller supplies its
# own error handling.
#
# A file beside dispatch.lock is the right primitive here: there is no PR to
# hang a dispatch:<phase>-attempt-<n> label on, and the common path — a
# transient dirty lockfile that heals in one repair — must stay issue-free.
sync_repair_attempts_file() {
  local project_root
  if [[ -n "${DISPATCH_SYNC_REPAIR_ATTEMPTS_FILE:-}" ]]; then
    printf '%s\n' "$DISPATCH_SYNC_REPAIR_ATTEMPTS_FILE"
    return 0
  fi
  project_root=$(resolve_project_root) || return 1
  printf '%s\n' "$project_root/tmp/sync-repair-attempts"
}

# Print the integer stored in the sync-repair attempts file, or 0 if absent/empty/non-numeric.
sync_repair_read_attempts() {
  local file n=0
  file=$(sync_repair_attempts_file) || { printf '0\n'; return 0; }
  if [[ -f "$file" ]]; then
    n=$(<"$file")
  fi
  if [[ "$n" =~ ^[0-9]+$ ]]; then
    printf '%s\n' "$n"
  else
    printf '0\n'
  fi
}

# Write (current-attempts + 1) to the attempts file, creating it if absent.
sync_repair_bump_attempts() {
  local file n
  file=$(sync_repair_attempts_file) || return 1
  n=$(sync_repair_read_attempts)
  printf '%s\n' "$((n + 1))" > "$file"
}

# Remove the attempts file so the counter resets to 0; a failed path resolution is a no-op.
sync_repair_reset_attempts() {
  local file
  file=$(sync_repair_attempts_file) || return 0
  rm -f "$file"
}

# headless_sentinel_path <holder-id> <lock-file> — print the PID-sentinel path
# for a `headless:<token>` holder id to stdout. The sentinel lives alongside the
# lock file (same directory) so a concurrent tick in any worktree resolves the
# same path. The filename is `dispatch-tick-<slug>.live`, where <slug> is the
# token (everything after the `headless:` prefix) with every character outside
# `[0-9A-Za-z._-]` replaced by `_`. Slugging is defense-in-depth (#1068): a
# polluted INVOCATION_ID cannot escape the lock-file directory via path
# separators. Fed via `printf '%s'` (no trailing newline) so `tr -c` appends no
# spurious trailing `_`.
headless_sentinel_path() {
  local holder="$1" lock_file="$2" token slug dir
  token="${holder#headless:}"
  slug="$(printf '%s' "$token" | tr -c '0-9A-Za-z._-' '_')"
  dir="$(dirname "$lock_file")"
  printf '%s\n' "$dir/dispatch-tick-${slug}.live"
}

# ---- Graph-write mutex (one graph writer per checkout) ----------------------
# Print the path of a checkout's graph-write mutex to stdout. An explicit
# DISPATCH_GRAPH_WRITE_LOCK_FILE is authoritative and bypasses the derivation
# (tests rely on this); otherwise the mutex lives beside the checkout it guards,
# at <repo-root>/tmp/graph-write.lock (gitignored).
#
# WHY PER-CHECKOUT, not project-wide like dispatch_lock_file: the hazard this
# mutex closes is two graph writers mutating THE SAME working tree at once.
# graph-commit rebases the checkout it is handed and, on its busy-main /
# far-ahead-HEAD paths, runs `git reset --hard` on it. A second writer's
# half-written intentions/<id>.md in that same tree is then either discarded
# (a graph write that exits 0 having landed nothing) or left dirty, tripping the
# clean-tree assertion of every later writer in that checkout. Two writers in
# DIFFERENT checkouts do not have that problem — graph-commit's own distributed
# landing lock (refs/graph/landing-lock) serializes them at the remote.
#
# Returns non-zero (no output) when the override is unset AND no repo root was
# supplied; the caller supplies its own error message.
graph_write_lock_file() {
  local repo_root="${1:-}"
  if [[ -n "${DISPATCH_GRAPH_WRITE_LOCK_FILE:-}" ]]; then
    printf '%s\n' "$DISPATCH_GRAPH_WRITE_LOCK_FILE"
    return 0
  fi
  [[ -n "$repo_root" ]] || return 1
  printf '%s\n' "$repo_root/tmp/graph-write.lock"
}

# TWO ACQUIRE VERBS, ONE MUTEX — WHICH ONE A CALLER TAKES DEPENDS ON WHETHER IT
# HAS A NEXT PASS.
#
# Both verbs take the same flock on fd 9 of the CALLING shell, held for the
# caller's whole process lifetime and released when fd 9 closes (process exit).
# Neither has a release verb, deliberately: an out-of-band instrument that could
# "release early" would reopen the window this mutex exists to close. They
# differ only in what they do when the lock is already held.
#
#   graph_write_lock_acquire       — NON-BLOCKING. For a caller fired by a
#                                    systemd TIMER (dispatch-fleet-alarm and the
#                                    other fleet instruments). A pass that blocks
#                                    on a wedged holder pins its oneshot service
#                                    until the next fire and stacks passes on top
#                                    of each other. Skipping costs nothing there:
#                                    these instruments re-derive their entire
#                                    reading from scratch on the next pass, which
#                                    is a minute or two away. Such callers must
#                                    SKIP on return 1, never wait.
#
#   graph_write_lock_acquire_wait  — BOUNDED WAIT. For a FIRE-AND-FORGET one-shot
#                                    job that has NO next pass — nothing
#                                    re-invokes it, so a skipped pass is not a
#                                    deferred write, it is a LOST write. The
#                                    per-phase evaluator's call to
#                                    dispatch-eval-finding is the case this
#                                    exists for: it is spawned fire-and-forget by
#                                    the ladder driver, and a skip silently
#                                    under-counts the recurrence metric the
#                                    evaluation-finding ledger exists to carry.
#                                    Concurrent ladders make that contention
#                                    routine, not exceptional.
#
# THE WAIT IS ALWAYS BOUNDED, NEVER UNBOUNDED. The timeout is a required
# argument precisely so no caller can acquire an open-ended block: a wedged
# holder must eventually release every waiter, and a job that waits forever is
# a new wedge rather than a fix for the old one. On timeout the waiting caller
# is back in the skip case and must say so loudly — the write it just lost has
# no next pass to recover it.
#
# This split is the documented exception to the older "callers must SKIP, never
# wait" rule, whose stated premise (every caller is a timer oneshot) stopped
# being true when the per-phase evaluator arrived. A contract with an
# undocumented exception is the next defect, so the exception lives here.
#
# fd inheritance (both verbs): children (git, npx, graph-commit) inherit fd 9 and
# would hold the flock past our exit if one of them ever daemonized. Callers that
# invoke a child which can fork a background helper should close it there with
# `9>&-`.
#
# Return (both verbs, identical contract):
#         0 acquired;
#         1 another writer holds it (for _acquire, immediately; for
#           _acquire_wait, still after the timeout elapsed);
#         2 the mutex could not be established at all (no repo root, no `flock`
#           binary, unwritable directory, and for _acquire_wait a missing or
#           malformed timeout) — an environment error the caller must surface,
#           NEVER silently downgrade to an unserialized graph write.
graph_write_lock_acquire() {
  local repo_root="${1:-}" lock_file
  lock_file=$(graph_write_lock_file "$repo_root") || return 2
  command -v flock >/dev/null 2>&1 || return 2
  mkdir -p "$(dirname "$lock_file")" 2>/dev/null || return 2
  # Append-open, never truncate: the file is a pure mutex carrier and `>` would
  # race a concurrent holder's open.
  exec 9>>"$lock_file" || return 2
  flock -n 9 || return 1
  return 0
}

# graph_write_lock_acquire_wait <repo-root> <timeout-seconds> — as
# graph_write_lock_acquire, but waits up to <timeout-seconds> for a held lock
# instead of returning 1 at once. Same fd, same held-until-process-exit
# contract, same return codes (see the block above). The timeout is REQUIRED and
# must be a non-negative number (integer or decimal, as `flock -w` accepts); a
# missing or malformed one is return 2, not a silent unbounded wait.
graph_write_lock_acquire_wait() {
  local repo_root="${1:-}" timeout="${2:-}" lock_file
  [[ "$timeout" =~ ^[0-9]+(\.[0-9]+)?$ ]] || return 2
  lock_file=$(graph_write_lock_file "$repo_root") || return 2
  command -v flock >/dev/null 2>&1 || return 2
  mkdir -p "$(dirname "$lock_file")" 2>/dev/null || return 2
  # Append-open, never truncate — same reasoning as the non-blocking verb.
  exec 9>>"$lock_file" || return 2
  flock -w "$timeout" 9 || return 1
  return 0
}

# Return the project ID for Firebase emulators.
# Appends worktree name to prevent hub file collisions across worktrees.
get_emulator_project_id() {
  local wt_id
  wt_id="$(get_worktree_id)"
  if [ -n "$wt_id" ]; then
    echo "${FIREBASE_PROJECT_ID}-wt-${wt_id}"
  else
    echo "$FIREBASE_PROJECT_ID"
  fi
}

# Build an environment suffix with optional worktree qualifier.
# Args: $1 = base suffix (e.g. "qa", "emulator")
get_env_suffix() {
  local wt_id
  wt_id="$(get_worktree_id)"
  echo "${1}${wt_id:+-$wt_id}"
}

# Resolve the tmp directory that Firebase emulators use.
# Uses Node os.tmpdir() to match the path Firebase writes hub files to.
# Can be overridden in tests by redefining this function.
get_tmpdir() {
  node -e "process.stdout.write(require('os').tmpdir())"
}

# Build a space-delimited exclusion set of the current process and all its
# ancestors up to PID 1. Used to avoid self-termination in kill functions.
# Output: string like " 1234 567 " (leading/trailing spaces for substring match)
_ancestor_pids() {
  local result=" $$ "
  local ancestor=$$
  while [ "$ancestor" -gt 1 ]; do
    ancestor=$(ps -o ppid= -p "$ancestor" 2>/dev/null | tr -d ' ') || break
    [ -z "$ancestor" ] && break
    result+="$ancestor "
  done
  printf '%s' "$result"
}

# Collect all PIDs in a process tree (depth-first, children before parent).
# Args: $1 = root PID
# Output: one PID per line, leaves first (children listed before their parent)
_collect_tree_pids() {
  local pid="$1"
  local children child
  children=$(_pids_with_parent "$pid")
  while IFS= read -r child; do
    [ -z "$child" ] && continue
    _collect_tree_pids "$child"
  done <<< "$children"
  echo "$pid"
}

# Kill a process and all its descendants.
# Sends SIGTERM first, then escalates to SIGKILL after a 2-second grace period.
# Args: $1 = PID to kill
kill_tree() {
  local pid="${1:?kill_tree requires a PID argument}"
  local pids
  pids=$(_collect_tree_pids "$pid")
  [ -z "$pids" ] && return 0

  # SIGTERM pass
  local p
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    kill "$p" 2>/dev/null || true
  done <<< "$pids"

  # Grace period, then SIGKILL survivors
  sleep 2
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    if kill -0 "$p" 2>/dev/null; then
      kill -9 "$p" 2>/dev/null || true
    fi
  done <<< "$pids"
}

# Resolve the workspace key that owns a changed file via longest-prefix match.
# Echoes the LONGEST key `ws` from the `all_apps` associative array such that
# `file == ws` OR `file` begins with "$ws/" (the trailing "/" is load-bearing:
# without it "print" would match "printer/x" and "packages/ds" would match
# "packages/ds-utils/x"). Reads `all_apps` via bash dynamic scoping from the
# caller. Echoes nothing if no workspace matches.
# Args: $1 = changed file path
_resolve_workspace_for_file() {
  local file="$1" ws best=""
  for ws in "${!all_apps[@]}"; do
    if [ "$file" = "$ws" ] || [ "${file#"$ws"/}" != "$file" ]; then
      if (( ${#ws} > ${#best} )); then
        best="$ws"
      fi
    fi
  done
  echo "$best"
}

# Resolve which apps are affected by a set of changed files.
# Reads changed file paths from stdin, one per line.
# Outputs dirty app names to stdout, one per line (unsorted).
# Args: $1 = repo root
resolve_dirty_apps() {
  local repo_root="${1:?resolve_dirty_apps requires a repo root argument}"

  # Discover all workspaces from root package.json
  declare -A all_apps
  local workspace_list ws
  if ! workspace_list=$(jq -r '.workspaces[]' "$repo_root/package.json"); then
    echo "ERROR: failed to read workspaces from $repo_root/package.json" >&2
    return 1
  fi

  while IFS= read -r ws; do
    [ -z "$ws" ] && continue
    all_apps["$ws"]=1
  done <<< "$workspace_list"

  if [ ${#all_apps[@]} -eq 0 ]; then
    echo "ERROR: no workspaces found in $repo_root/package.json" >&2
    return 1
  fi

  # Build the DIRECT reverse dependency map: shared package -> apps that
  # declare it directly in their package.json.
  declare -A direct_dependents
  local app pkg dep_list dep_dir
  for app in "${!all_apps[@]}"; do
    pkg="$repo_root/$app/package.json"
    if ! dep_list=$(jq -r '(.dependencies // {}) + (.devDependencies // {}) + (.peerDependencies // {}) | keys[] | select(startswith("@commons-systems/")) | sub("@commons-systems/"; "")' "$pkg"); then
      echo "ERROR: failed to read dependencies from $pkg" >&2
      return 1
    fi
    while IFS= read -r dep_dir; do
      [ -z "$dep_dir" ] && continue
      direct_dependents["$dep_dir"]+="$app "
    done <<< "$dep_list"
  done

  # Compute the TRANSITIVE closure of internal-package dependents. Internal
  # packages are themselves workspaces, so a dependent may in turn be consumed
  # by other apps: a change to a leaf package must mark every app that depends
  # on it transitively, not just its direct declarers. Concretely, fellspiral
  # imports @commons-systems/blog which imports @commons-systems/ds, but
  # fellspiral never declares ds — so a ds-only change must still test and
  # deploy fellspiral. shared_pkgs[pkg] holds the transitive dependent set,
  # keyed on the same leaf-dir short name the resolve loop below looks up.
  declare -A shared_pkgs
  local root_pkg cur nxt acc
  for root_pkg in "${!direct_dependents[@]}"; do
    unset _seen
    declare -A _seen=()
    local -a _queue=(${direct_dependents["$root_pkg"]})
    while [ ${#_queue[@]} -gt 0 ]; do
      cur="${_queue[0]}"
      _queue=("${_queue[@]:1}")
      [ -n "${_seen[$cur]+x}" ] && continue
      _seen["$cur"]=1
      # If cur is itself an internal package other apps consume, its direct
      # dependents are transitive dependents of root_pkg too. direct_dependents
      # is keyed on the dependency SHORT name (e.g. "blog"), but cur holds a
      # full app/workspace path (e.g. "packages/blog") — the same short-name
      # bridge the resolve loop below uses (`short="${ws##*/}"`). Looking up
      # direct_dependents[$cur] directly here would silently never match for
      # any package nested under packages/ (all of them), truncating the
      # closure at depth 1.
      local cur_short="${cur##*/}"
      if [ -n "${direct_dependents[$cur_short]+x}" ]; then
        for nxt in ${direct_dependents["$cur_short"]}; do
          _queue+=("$nxt")
        done
      fi
    done
    acc=""
    for cur in "${!_seen[@]}"; do
      acc+="$cur "
    done
    shared_pkgs["$root_pkg"]="$acc"
  done
  unset _seen

  declare -A dirty_apps
  local file

  while IFS= read -r file; do
    [ -z "$file" ] && continue
    case "$file" in
      firebase.json|firestore.rules|storage.rules|package.json|package-lock.json|vitest.config.ts)
        # Root-level config changes affect all workspaces. vitest.config.ts is
        # the root test config shared by every workspace's suite, so editing it
        # alone must still resolve a non-empty dirty set (otherwise
        # run-unit-tests exits 0 and a broken test config merges green).
        for app in "${!all_apps[@]}"; do
          dirty_apps["$app"]=1
        done
        ;;
      *)
        # Longest-prefix match the file to its owning workspace key.
        local short
        ws=$(_resolve_workspace_for_file "$file")
        [ -z "$ws" ] && continue
        # Shared-package lookup keys on the workspace's leaf dir, which is
        # bridged to the @commons-systems/<name> dependency short name in the
        # shared_pkgs build above. This assumes the leaf dir equals the short
        # name; if a future nested workspace's leaf dir ever differs (e.g.
        # packages/foo providing @commons-systems/bar), its shared-package
        # retrigger silently breaks — revisit if that convention is relaxed.
        # A literal glob workspace entry (e.g. packages/*) is out of scope: it
        # already hard-errors today at the jq on $repo_root/$app/package.json.
        short="${ws##*/}"
        if [ -n "${shared_pkgs[$short]+x}" ]; then
          for app in ${shared_pkgs[$short]}; do
            dirty_apps["$app"]=1
          done
        fi
        # Check if this is a direct app change (full matched path).
        if [ -n "${all_apps[$ws]+x}" ]; then
          dirty_apps["$ws"]=1
        fi
        ;;
    esac
  done

  for app in "${!dirty_apps[@]}"; do
    echo "$app"
  done
}

# Print the hosting site ID for an app from .firebaserc deploy targets.
# Returns code 1 (with stderr message) if no hosting target is found.
# Args: $1 = repo root, $2 = app name (e.g. "budget")
get_hosting_site() {
  local repo_root="$1"
  local app_name="$2"
  local rc_path="${repo_root}/.firebaserc"

  if [ ! -f "$rc_path" ]; then
    echo "ERROR: .firebaserc not found at ${rc_path}" >&2
    return 1
  fi

  local site
  site=$(jq -r --arg pid "$FIREBASE_PROJECT_ID" --arg app "$app_name" \
    '.targets[$pid].hosting[$app][0] // empty' "$rc_path") || return 1

  if [ -z "$site" ]; then
    echo "ERROR: no hosting target \"${app_name}\" found for project \"${FIREBASE_PROJECT_ID}\" in .firebaserc" >&2
    return 1
  fi

  echo "$site"
}

# Build the Firestore namespace for an app and environment.
# Args: $1 = app name, $2 = environment suffix (e.g. "prod", "qa", "preview-pr-5")
get_firestore_namespace() {
  if [ -z "${1:-}" ] || [ -z "${2:-}" ]; then
    printf "ERROR: get_firestore_namespace requires two non-empty arguments (got app='%s', env='%s')\n" "${1:-}" "${2:-}" >&2
    return 1
  fi
  printf '%s/%s' "$1" "$2"
}

# Delete a Firebase Hosting preview channel.
# Succeeds without error if the channel does not exist.
# Args: $1 = channel ID, $2 = hosting site name
delete_preview_channel() {
  local channel_id="$1"
  local hosting_site="$2"

  DELETE_OUTPUT=$(npx firebase-tools hosting:channel:delete "$channel_id" --site "$hosting_site" --force --project "$FIREBASE_PROJECT_ID" 2>&1) || {
    if echo "$DELETE_OUTPUT" | grep -qi "not found\|does not exist\|NOT_FOUND"; then
      echo "Preview channel already deleted."
    else
      echo "WARNING: Failed to delete preview channel: $DELETE_OUTPUT" >&2
    fi
  }
}

# Remove the emulator hub file if the PID recorded in it is dead.
# Uses worktree-scoped project ID so each worktree manages its own hub file.
# (If the PID is recycled by an unrelated process, kill -0 succeeds and the stale hub file is preserved. This is negligible in practice.)
cleanup_stale_hub() {
  local tmpdir
  tmpdir="$(get_tmpdir)"
  local project_id
  project_id="$(get_emulator_project_id)"
  local hub_file="${tmpdir}/hub-${project_id}.json"
  if [ -f "$hub_file" ]; then
    local hub_pid
    hub_pid=$(jq -r '.pid // empty' "$hub_file" 2>/dev/null) || true
    if [ -n "$hub_pid" ] && ! kill -0 "$hub_pid" 2>/dev/null; then
      echo "Removing stale emulator hub file (PID $hub_pid is dead)"
      rm -f "$hub_file"
    fi
  fi
}

# Sandbox-safe replacements for `pgrep -f` and `pgrep -P`. The macOS sandbox
# Claude Code runs under blocks pgrep's sysmond IPC, so any pgrep variant
# returns nothing. These helpers use `ps` instead. Output: one PID per line.

# Print PIDs whose command-line args contain the given fixed-string substring.
# Matches against the args column only, so a numeric needle cannot collide with
# the PID column.
_pids_matching_arg() {
  local needle="${1:?_pids_matching_arg requires a substring}"
  local pid args
  ps -axo pid=,args= 2>/dev/null | while read -r pid args; do
    case "$args" in
      *"$needle"*) echo "$pid" ;;
    esac
  done || true
}

# Print PIDs whose parent PID equals the given PID.
_pids_with_parent() {
  local parent="${1:?_pids_with_parent requires a parent PID}"
  ps -axo pid=,ppid= 2>/dev/null | awk -v p="$parent" '$2 == p {print $1}' || true
}

# Kill all processes whose command-line args contain the given worktree path.
# Uses fixed-string substring matching on process args.
# Excludes the current process and its ancestors to avoid self-termination.
# Args: $1 = absolute worktree path (e.g., output of `git rev-parse --show-toplevel`)
kill_worktree_processes() {
  local wt_path="${1:?kill_worktree_processes requires a worktree path}"

  local pids
  pids=$(_pids_matching_arg "$wt_path/")
  [ -z "$pids" ] && return 0

  local exclude_pids
  exclude_pids=$(_ancestor_pids)

  while IFS= read -r pid; do
    [ -z "$pid" ] && continue
    if [[ "$exclude_pids" == *" $pid "* ]]; then
      continue
    fi
    kill -0 "$pid" 2>/dev/null || continue
    echo "Killing worktree process: PID $pid"
    kill_tree "$pid"
  done <<< "$pids"
}

# Emit one tab-separated `<issue-number>\t<path>\t<branch>` record.
# Args: $1 = worktree path, $2 = branch name (empty for detached-HEAD/bare).
# A blank path is a no-op — nothing has been collected yet.
_emit_worktree_record() {
  local wt_path="$1" branch="$2" num=""
  [ -z "$wt_path" ] && return 0
  if [[ "$branch" =~ ^([1-9][0-9]*)- ]]; then
    num="${BASH_REMATCH[1]}"
  fi
  printf '%s\t%s\t%s\n' "$num" "$wt_path" "$branch"
}

# Parse `git worktree list --porcelain` into tab-separated records.
# Emits one `<issue-number>\t<path>\t<branch>` line per registered worktree —
# including detached-HEAD, bare, and non-issue worktrees:
#   <issue-number> — leading-digits prefix of the branch (^[1-9][0-9]*-);
#                    empty when the branch has no such prefix or there is no
#                    branch line.
#   <path>         — always present.
#   <branch>       — branch name with refs/heads/ stripped; empty for
#                    detached-HEAD / bare worktrees (no `branch` line).
# Callers that want only issue worktrees skip empty-<issue-number> records.
list_worktree_records() {
  local porcelain
  porcelain=$(git worktree list --porcelain) || {
    echo "error: git worktree list --porcelain failed" >&2
    return 1
  }

  local line wt_path="" branch=""
  while IFS= read -r line; do
    if [ -z "$line" ]; then
      # A blank line closes the current record.
      _emit_worktree_record "$wt_path" "$branch"
      wt_path=""
      branch=""
    elif [[ "$line" == worktree\ * ]]; then
      wt_path="${line#worktree }"
    elif [[ "$line" == branch\ * ]]; then
      branch="${line#branch }"
      branch="${branch#refs/heads/}"
    fi
  done <<< "$porcelain"
  # Flush the final record: command substitution strips the porcelain stream's
  # trailing blank line, so the last record reaches EOF with no closing blank.
  _emit_worktree_record "$wt_path" "$branch"
}

# Split one list_worktree_records line into the globals WT_NUM / WT_PATH /
# WT_BRANCH. Uses parameter expansion, not `IFS=$'\t' read`: tab is an IFS
# whitespace character, so `read` would trim the empty leading issue-number
# field of a non-issue / detached / bare record and shift every field left.
# Parameter expansion preserves empty fields exactly.
split_worktree_record() {
  local line="$1"
  WT_NUM="${line%%$'\t'*}"
  local rest="${line#*$'\t'}"
  WT_PATH="${rest%%$'\t'*}"
  WT_BRANCH="${rest#*$'\t'}"
}

# Kill processes belonging to worktrees that no longer exist.
# Scopes the search to this repo's worktree directory (derived from git
# common dir) to avoid killing processes from unrelated repositories.
cleanup_stale_worktree_processes() {
  # Derive this repo's worktree container path from git common dir
  local git_common_dir worktree_root
  git_common_dir=$(git rev-parse --git-common-dir 2>/dev/null) || {
    echo "WARNING: git rev-parse --git-common-dir failed; skipping stale cleanup" >&2
    return 0
  }
  # Resolve to absolute path; native worktrees live under <repo>/.claude/worktrees
  # (standard Claude Code layout — the git common dir's parent is the repo root).
  worktree_root="$(cd "$git_common_dir/.." && pwd)/.claude/worktrees"

  # Prune stale admin entries so the list below reflects on-disk worktrees only.
  git worktree prune 2>/dev/null || true

  # Build set of active worktree paths — the <path> field of every registered
  # worktree record, issue-prefixed or not.
  local active_paths=""
  local line
  while IFS= read -r line; do
    split_worktree_record "$line"
    [ -z "$WT_PATH" ] && continue
    active_paths+="$WT_PATH "
  done < <(list_worktree_records)

  if [ -z "$active_paths" ]; then
    echo "WARNING: git worktree list returned no entries; skipping stale cleanup" >&2
    return 0
  fi

  # Find PIDs with this repo's worktree root in their command args
  local pids
  pids=$(_pids_matching_arg "$worktree_root/")
  [ -z "$pids" ] && return 0

  local exclude_pids
  exclude_pids=$(_ancestor_pids)

  # Declared once, before the loop: re-running `local` inside the loop makes
  # zsh display the parameter on every iteration after the first.
  local cmdline wt_path

  while IFS= read -r pid; do
    [ -z "$pid" ] && continue
    [[ "$exclude_pids" == *" $pid "* ]] && continue

    # Extract the worktree path from this process's command line
    cmdline=$(ps -o args= -p "$pid" 2>/dev/null) || continue

    wt_path=$(printf '%s' "$cmdline" | grep -oE '/[^ ]*worktrees/[^/ ]+' | head -1) || continue
    [ -z "$wt_path" ] && continue

    # Kill only if this worktree path is not in the active set
    if [[ "$active_paths" != *"$wt_path "* ]]; then
      kill -0 "$pid" 2>/dev/null || continue
      echo "Stale worktree process: PID $pid (worktree: $wt_path)"
      kill_tree "$pid"
    fi
  done <<< "$pids"
}

# Find N available TCP ports by binding to port 0 simultaneously.
# Keeps all servers open until all ports are assigned to avoid OS recycling.
# Args: $1 = number of ports (default 1)
# Output: space-separated port numbers
find_available_ports() {
  local count="${1:-1}"
  node -e "
    const net = require('net');
    const count = ${count};
    const servers = [];
    for (let i = 0; i < count; i++) {
      const s = net.createServer();
      servers.push(new Promise(r => s.listen(0, () => r(s))));
    }
    Promise.all(servers).then(ss => {
      console.log(ss.map(s => s.address().port).join(' '));
      ss.forEach(s => s.close());
    }).catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
  "
}

# Find a single available TCP port (convenience wrapper).
find_available_port() {
  find_available_ports 1
}

# Fixed pool of Vite dev-server ports for QA servers. The claude-in-chrome
# extension gates navigation per origin (scheme+host+port), so pinning the Vite
# port to a known 8-slot pool lets the operator approve those 8 origins in Chrome
# once instead of re-approving a fresh random port every QA session. Emulator
# ports stay ephemeral (find_available_ports) — the page's own JS reaches them,
# never the extension, so they never trigger an approval prompt.
#
# File-scope globals (not local/readonly) so tests can override them.
QA_VITE_PORT_POOL=(5170 5171 5172 5173 5174 5175 5176 5177)
QA_VITE_PORT_LOCK_DIR="${TMPDIR:-/tmp}"

# Sets VITE_PORT and holds an flock on fd 200 for the script's lifetime so
# concurrent QA workers never select the same pool slot. Errors (does NOT fall
# back to a random port — that would re-trigger the Chrome approval prompt)
# when all 8 slots are held.
claim_fixed_vite_port() {
  local p lockfile
  for p in "${QA_VITE_PORT_POOL[@]}"; do
    lockfile="${QA_VITE_PORT_LOCK_DIR}/qa-vite-port-${p}.lock"
    exec 200>"$lockfile" || continue
    if flock -n 200; then
      if node -e "const net=require('net');const s=net.createServer();s.once('error',()=>process.exit(1));s.listen(${p},'0.0.0.0',()=>s.close(()=>process.exit(0)));" 2>/dev/null; then
        VITE_PORT="$p"; return 0      # fd 200 stays open in caller, holding the lock
      fi
      flock -u 200                    # foreign process owns the port; try next slot
    fi
    exec 200>&-
  done
  echo "ERROR: all ${#QA_VITE_PORT_POOL[@]} QA Vite ports (${QA_VITE_PORT_POOL[*]}) are in use" >&2
  return 1
}

# Print the Remote access block for QA-server startup: the universal localhost
# URL plus a copy-paste `ssh -L` command forwarding the Vite port and every
# allocated emulator port to a remote client's localhost, so the served origin
# stays http://localhost:<vite>/ on every machine.
# Args: $1 = vite port; $2.. = emulator ports (may be empty)
print_remote_access_block() {
  local vite_port="$1"; shift
  local ssh_cmd="ssh -L ${vite_port}:localhost:${vite_port}"
  local p
  for p in "$@"; do
    ssh_cmd+=" -L ${p}:localhost:${p}"
  done
  ssh_cmd+=" ${QA_REMOTE_SSH_HOST}"
  echo "========================================"
  echo "  Remote access (Tailscale tunnel)"
  echo "========================================"
  echo ""
  echo "  The QA server runs on the WSL host. The URL below is the same on"
  echo "  every machine. On the same host, just open it. From a remote tailnet"
  echo "  client, run the ssh command first to forward the ports, then open it."
  echo ""
  echo "  URL:  http://localhost:${vite_port}/"
  echo ""
  echo "  Remote client (run before opening the URL):"
  echo ""
  echo "    ${ssh_cmd}"
  echo ""
  echo "========================================"
  echo ""
}

# Sanitize a captured PATH for interpolation into a systemd
# Environment="PATH=..." line. Three distinct hazards, three reasons:
#   - newline: a unit file is line-structured, so an embedded newline would
#     land as a stray [Service] directive.
#   - double-quote: the Environment= value is double-quoted, so an embedded
#     quote would prematurely terminate it, leaving a bare token as a stray
#     directive.
#   - backslash: systemd applies C-style unescaping to Environment= (and
#     ExecStart=) values, so a backslash is misread as an escape sequence and
#     silently corrupts the PATH (#1212).
# None of the three is ever a valid character in a PATH component, so
# dropping them is safe.
strip_unit_env_path() {
  printf '%s' "${1//[$'\n'\"\\]/}"
}

# Install the static `dispatch-tick-recover.service` unit file so the tick and
# reseed launchers can attach `OnFailure=dispatch-tick-recover.service`.
# OnFailure= references a LOADABLE unit file, not a script — and dispatch
# otherwise uses only transient `systemd-run` units, so no such file exists
# until we write one. This helper writes it idempotently.
#
# Best-effort: a failure here must not abort the caller (a tick/reseed
# launcher), so we warn to stderr and return non-zero — never `exit`. A missing
# recover unit just means a crashing tick falls back to the prior behavior.
# Args: $1 = main worktree path
ensure_recover_unit() {
  local main_worktree="$1"

  # A systemd unit file is line-structured: each line is an independent
  # directive. An embedded newline in any value we interpolate below would land
  # as an attacker-controlled extra directive in the [Service] section. The
  # main worktree path comes from git output or a test override and never
  # legitimately contains a newline; reject it rather than emit a malformed
  # unit (best-effort: warn + return per this helper's contract — never exit).
  if [[ "$main_worktree" == *$'\n'* ]]; then
    echo "WARNING: ensure_recover_unit: main worktree path contains a newline; refusing to write unit; OnFailure recovery unavailable" >&2
    return 1
  fi
  # WorkingDirectory= does not unescape quotes, so a space in the bare path would
  # split the value at the first space; reject it (same contract: warn + return 1).
  if [[ "$main_worktree" == *' '* ]]; then
    echo "WARNING: ensure_recover_unit: main worktree path contains a space; refusing to write unit; OnFailure recovery unavailable" >&2
    return 1
  fi
  # ExecStart= is double-quoted ("$RECOVER_SCRIPT"); RECOVER_SCRIPT is derived
  # from main_worktree below. An embedded double-quote in the path would
  # prematurely close that quoted token, making systemd parse the executable and
  # arguments wrong (bad-setting) and permanently break the unit. The path never
  # legitimately contains a double-quote; reject it rather than emit a malformed
  # unit (same contract: warn + return 1).
  if [[ "$main_worktree" == *'"'* ]]; then
    echo "WARNING: ensure_recover_unit: main worktree path contains a double-quote; refusing to write unit; OnFailure recovery unavailable" >&2
    return 1
  fi
  # ExecStart= is double-quoted and systemd C-unescapes it, so a backslash in
  # the path would be misread as an escape sequence and corrupt the executable
  # token. The path never legitimately contains a backslash; reject it (#1212).
  if [[ "$main_worktree" == *'\'* ]]; then
    echo "WARNING: ensure_recover_unit: main worktree path contains a backslash; refusing to write unit; OnFailure recovery unavailable" >&2
    return 1
  fi

  local RECOVER_SCRIPT="$main_worktree/.claude/skills/dispatch-propagate/scripts/dispatch-tick-recover"
  local UNIT_DIR="${DISPATCH_RECOVER_UNIT_DIR:-${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user}"
  local UNIT_PATH="$UNIT_DIR/dispatch-tick-recover.service"
  local SYSTEMCTL_CMD="${DISPATCH_RECOVER_SYSTEMCTL_CMD:-systemctl}"

  # Sanitize PATH for the Environment= line (see strip_unit_env_path).
  local safe_path
  safe_path=$(strip_unit_env_path "$PATH")

  # Environment=PATH=... captures the launching caller's PATH at write time,
  # for the same reason dispatch-spawn-tick passes --setenv=PATH: the systemd
  # user manager's minimal default PATH omits the nix store, so on NixOS/WSL
  # hosts /usr/bin/env can't resolve bash and the recover script can't find
  # git/jq/claude. The caller carries the full nix-store PATH, so baking it into
  # the unit at write time makes the unit self-sufficient.
  #
  # ExecStart= and Environment= are double-quoted: systemd unescapes C-style
  # quotes for these two directives, so a path containing spaces is parsed as a
  # single token rather than split into an executable + spurious arguments.
  # WorkingDirectory= is the exception — it does NOT unescape quotes; a leading
  # `"` makes the path non-absolute and systemd rejects the unit (bad-setting),
  # so it takes the bare path (the no-spaces invariant is enforced by the guard
  # above, so the bare value is a single token).
  #
  # Deliberately NO OnFailure= on this unit — the recover handler must not chain
  # to itself, or a failing recovery would recurse.
  local desired
  desired=$(cat <<EOF
[Unit]
Description=Dispatch chain continuation recovery (OnFailure handler)

[Service]
Type=oneshot
Environment="PATH=$safe_path"
ExecStart="$RECOVER_SCRIPT"
WorkingDirectory=$main_worktree
EOF
)

  # Steady-state hot path: if the installed unit already matches byte-for-byte,
  # skip the write and the daemon-reload entirely (a single content compare).
  if [ -f "$UNIT_PATH" ] && [ "$(cat "$UNIT_PATH")" = "$desired" ]; then
    return 0
  fi

  if ! mkdir -p "$UNIT_DIR"; then
    echo "WARNING: ensure_recover_unit: mkdir -p $UNIT_DIR failed; OnFailure recovery unavailable" >&2
    return 1
  fi

  # Write atomically: temp file in the same dir, then mv into place.
  local tmp
  tmp=$(mktemp "$UNIT_DIR/.dispatch-tick-recover.service.XXXXXX") || {
    echo "WARNING: ensure_recover_unit: could not create temp file in $UNIT_DIR; OnFailure recovery unavailable" >&2
    return 1
  }
  if ! printf '%s\n' "$desired" > "$tmp"; then
    echo "WARNING: ensure_recover_unit: failed to write $tmp; OnFailure recovery unavailable" >&2
    rm -f "$tmp"
    return 1
  fi
  if ! mv "$tmp" "$UNIT_PATH"; then
    echo "WARNING: ensure_recover_unit: failed to install $UNIT_PATH; OnFailure recovery unavailable" >&2
    rm -f "$tmp"
    return 1
  fi

  if ! "$SYSTEMCTL_CMD" --user daemon-reload; then
    echo "WARNING: ensure_recover_unit: systemctl --user daemon-reload failed; OnFailure recovery may be stale" >&2
    return 1
  fi
}

# Disable a stale timer/service pair whose installed unit points at a different
# main-worktree path than the current one. The single implementation behind
# cleanup_stale_sweep_units (just below) and cleanup_stale_heartbeat_units
# (further below) — they differ only in which unit names they disable and how
# they label the warning, so the sed/compare/disable logic lives here once.
#
# Fires when the installed WorkingDirectory= no longer matches the current main
# worktree (e.g. a checkout path change, or a corrupted unit pointing at a
# deleted temp path); does nothing if no unit is installed yet or its
# WorkingDirectory= already matches.
#
# Best-effort: the paired services carry no [Install] section, so `disable`
# exits non-zero by design. Suppress that and never abort the caller (a
# tick/reseed/worker launcher) — the subsequent unit rewrite in the calling
# ensure_* is what actually repairs the state.
# Args: $1 = installed service-unit path, $2 = current main worktree path,
#       $3 = systemctl command, $4 = timer unit name, $5 = service unit name,
#       $6 = caller name for the warning prefix, $7 = unit noun for the warning
cleanup_stale_unit_pair() {
  local service_path="$1"
  local current_main_worktree="$2"
  local systemctl_cmd="$3"
  local timer_unit="$4"
  local service_unit="$5"
  local caller="$6"
  local noun="$7"

  # No prior units → nothing to clean up.
  [ -f "$service_path" ] || return 0

  local installed_workdir
  installed_workdir=$(sed -n 's/^WorkingDirectory=//p' "$service_path" | head -1)

  # No WorkingDirectory= to compare → nothing to do.
  [ -n "$installed_workdir" ] || return 0

  # Path unchanged → the timer points at the right place; leave it running.
  [ "$installed_workdir" = "$current_main_worktree" ] && return 0

  # Path changed: stop the stale timer/service before the caller rewrites the
  # unit content. Best-effort — suppress the disable failure and warn; never
  # abort the caller.
  echo "WARNING: $caller: installed $noun unit points at '$installed_workdir' but current main worktree is '$current_main_worktree'; disabling stale timer/service before rewrite" >&2
  "$systemctl_cmd" --user disable --now "$timer_unit" "$service_unit" || true
}

# Report whether a dispatch-managed timer has been marked manually-disabled by
# the operator, so an installer can skip its `enable --now` instead of silently
# undoing a deliberate `systemctl --user disable --now` on the next reseed.
#
# One implementation, called from thin per-installer sites — the same shape as
# cleanup_stale_unit_pair above — so the check cannot be fixed for one timer and
# missed for its structurally identical twin.
#
# Args: $1 = timer unit name, $2 = caller name for message prefixes
# Returns 0 when the unit is marked manually-disabled (caller must skip enable),
#         1 otherwise.
# An indeterminate state (unreadable sentinel dir, or an unsourceable reader)
# returns 1 — proceed with enable — after a WARNING naming the cause. Failing
# the other way would tear the fleet's own watchdog down on an unreadable file,
# and the watchdog is what would otherwise report its own absence.
unit_manually_disabled() {
  local unit="$1"
  local caller="$2"

  if ! declare -f dispatch_unit_disable_state >/dev/null 2>&1; then
    # shellcheck source=lib-unit-disable-state.sh
    if ! source "$(dirname "${BASH_SOURCE[0]}")/lib-unit-disable-state.sh" 2>/dev/null; then
      echo "WARNING: $caller: cannot source lib-unit-disable-state.sh; a manual disable of $unit cannot be honored; proceeding to enable" >&2
      return 1
    fi
  fi

  local state
  state=$(dispatch_unit_disable_state "$unit")
  case "$state" in
    disabled)     return 0 ;;
    not-disabled) return 1 ;;
    *)
      echo "WARNING: $caller: unit-disable sentinel state for $unit is unknown ($(dispatch_unit_disable_sentinel_path "$unit") is unreadable); proceeding to enable — a manual disable may not be honored" >&2
      return 1
      ;;
  esac
}

# Emit the ONE informational line that makes an honored manual disable visible
# in the journal. NOT a WARNING and NOT an error — this is the requested state,
# and the caller's `|| true` must not be the only thing separating "we did what
# you asked" from "something went wrong". Callers that merely return silently
# leave the operator no in-the-moment evidence at all, which is
# indistinguishable from a dead guard or a caller that never ran.
#
# One implementation for all four call sites (both installers' steady-state and
# unit-files-updated paths), for the same reason unit_manually_disabled above is
# shared: the message cannot drift between structurally identical twins.
#
# The trailing `skipping enable --now` wording is load-bearing — the recorded
# operator procedure greps for exactly that substring — so $detail varies but
# the suffix does not.
#
# Args: $1 = caller name, $2 = timer unit name, $3 = state detail phrase
# Always returns 0.
unit_disable_skip_notice() {
  local caller="$1"
  local unit="$2"
  local detail="$3"
  echo "$caller: $unit is marked manually disabled ($(dispatch_unit_disable_sentinel_path "$unit")); $detail, skipping enable --now" >&2
  return 0
}

# Disable a stale sweep timer/service whose installed unit points at a
# different main-worktree path than the current one, mirroring
# cleanup_stale_heartbeat_units below. Thin wrapper over
# cleanup_stale_unit_pair above; see that function for the full contract.
# Args: $1 = installed service-unit path, $2 = current main worktree path,
#       $3 = systemctl command
cleanup_stale_sweep_units() {
  cleanup_stale_unit_pair "$1" "$2" "$3" \
    dispatch-sweep-periodic.timer dispatch-sweep-periodic.service \
    cleanup_stale_sweep_units sweep
}

# Install and activate the durable `dispatch-sweep-periodic.timer` (+ its paired
# `dispatch-sweep-periodic.service`) so the worktree garbage-collector fires on a
# wall-clock cadence instead of only from a finishing worker's Stop hook (#2023).
#
# The sweep launcher currently runs only when a worker stops, so an idle or
# drained chain never GCs its stale worktrees. A `systemd --user` timer ticks
# regardless of chain activity, keeping the sweep durable across idle periods.
#
# The .service is Type=oneshot and carries NO [Install] section — the .timer
# pulls it in via Unit=, and a oneshot with an [Install] would be pointlessly
# enable-able on its own. ExecStart points at `dispatch-spawn-sweep` (the
# launcher), NOT `dispatch-sweep` directly, so each fire still gets the
# launcher's fixed-unit dedup + 300s throttle rather than racing the Stop-hook
# spawns.
#
# Best-effort: a failure here must not abort the caller (a tick/reseed/worker
# launcher), so we warn to stderr and return non-zero — never `exit`. A missing
# timer just means the sweep falls back to the prior Stop-hook-only behavior.
# Args: $1 = main worktree path
ensure_sweep_timer() {
  local main_worktree="$1"

  # A systemd unit file is line-structured: each line is an independent
  # directive. An embedded newline in any value we interpolate below would land
  # as an attacker-controlled extra directive in the [Service] section. The
  # main worktree path comes from git output or a test override and never
  # legitimately contains a newline; reject it rather than emit a malformed
  # unit (best-effort: warn + return per this helper's contract — never exit).
  if [[ "$main_worktree" == *$'\n'* ]]; then
    echo "WARNING: ensure_sweep_timer: main worktree path contains a newline; refusing to write unit; periodic sweep unavailable" >&2
    return 1
  fi
  # WorkingDirectory= does not unescape quotes, so a space in the bare path would
  # split the value at the first space; reject it (same contract: warn + return 1).
  if [[ "$main_worktree" == *' '* ]]; then
    echo "WARNING: ensure_sweep_timer: main worktree path contains a space; refusing to write unit; periodic sweep unavailable" >&2
    return 1
  fi
  # ExecStart= is double-quoted ("$SWEEP_SCRIPT"); SWEEP_SCRIPT is derived from
  # main_worktree below. An embedded double-quote in the path would prematurely
  # close that quoted token, making systemd parse the executable and arguments
  # wrong (bad-setting) and permanently break the unit. The path never
  # legitimately contains a double-quote; reject it rather than emit a malformed
  # unit (same contract: warn + return 1).
  if [[ "$main_worktree" == *'"'* ]]; then
    echo "WARNING: ensure_sweep_timer: main worktree path contains a double-quote; refusing to write unit; periodic sweep unavailable" >&2
    return 1
  fi
  # ExecStart= is double-quoted and systemd C-unescapes it, so a backslash in
  # the path would be misread as an escape sequence and corrupt the executable
  # token. The path never legitimately contains a backslash; reject it (#1212).
  if [[ "$main_worktree" == *'\'* ]]; then
    echo "WARNING: ensure_sweep_timer: main worktree path contains a backslash; refusing to write unit; periodic sweep unavailable" >&2
    return 1
  fi

  local SWEEP_SCRIPT="$main_worktree/.claude/skills/dispatch-propagate/scripts/dispatch-spawn-sweep"
  local UNIT_DIR="${DISPATCH_SWEEP_TIMER_UNIT_DIR:-${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user}"
  local SERVICE_PATH="$UNIT_DIR/dispatch-sweep-periodic.service"
  local TIMER_PATH="$UNIT_DIR/dispatch-sweep-periodic.timer"
  local SYSTEMCTL_CMD="${DISPATCH_SWEEP_TIMER_SYSTEMCTL_CMD:-systemctl}"

  # Sanitize PATH for the Environment= line (see strip_unit_env_path).
  local safe_path
  safe_path=$(strip_unit_env_path "$PATH")

  # Desired .service content. Environment=PATH= captures the launching caller's
  # full nix-store PATH at write time, for the same reason the recover and daemon
  # units do — the systemd user manager's minimal default PATH omits the nix
  # store, so dispatch-spawn-sweep (and the dispatch-sweep it launches) could not
  # otherwise resolve git/jq/claude.
  #
  # ExecStart= and Environment= are double-quoted: systemd unescapes C-style
  # quotes for these two directives, so a path containing spaces is parsed as a
  # single token rather than split into an executable + spurious arguments.
  # WorkingDirectory= is the exception — it does NOT unescape quotes; a leading
  # `"` makes the path non-absolute and systemd rejects the unit (bad-setting),
  # so it takes the bare path (the no-spaces invariant is enforced by the guard
  # above, so the bare value is a single token).
  #
  # Deliberately NO [Install] section — the .timer pulls this oneshot in via
  # Unit=, so the service is never enabled on its own.
  local desired_service
  desired_service=$(cat <<EOF
[Unit]
Description=Dispatch periodic worktree sweep (timer-triggered)

[Service]
Type=oneshot
Environment="PATH=$safe_path"
ExecStart="$SWEEP_SCRIPT"
WorkingDirectory=$main_worktree
EOF
)

  # Desired .timer content. OnBootSec delays the first fire past session start so
  # the boot-time launcher storm settles; OnUnitActiveSec re-arms 15min after
  # each activation for the steady cadence. Unit= names the paired oneshot above.
  #
  # Deliberately NO Persistent= — it only affects OnCalendar= timers (catching up
  # missed wall-clock fires across downtime) and is a no-op for the monotonic
  # OnBootSec=/OnUnitActiveSec= triggers used here.
  local desired_timer
  desired_timer=$(cat <<EOF
[Unit]
Description=Dispatch periodic worktree sweep timer

[Timer]
OnBootSec=5min
OnUnitActiveSec=15min
Unit=dispatch-sweep-periodic.service

[Install]
WantedBy=timers.target
EOF
)

  # Steady-state hot path: if BOTH installed units already match byte-for-byte
  # AND the timer is active (armed), skip the write/reload/enable entirely.
  # (Like the durable daemon and unlike the OnFailure-only recover unit, the
  # timer must actually be RUNNING — an "active" timer is one that is armed and
  # will fire — so we add an is-active check to the content compare.)
  if [ -f "$SERVICE_PATH" ] && [ "$(cat "$SERVICE_PATH")" = "$desired_service" ] \
     && [ -f "$TIMER_PATH" ] && [ "$(cat "$TIMER_PATH")" = "$desired_timer" ] \
     && "$SYSTEMCTL_CMD" --user is-active --quiet dispatch-sweep-periodic.timer; then
    return 0
  fi

  # Path-change cleanup, mirroring ensure_heartbeat_units: if the installed
  # unit names a different main worktree (or is otherwise stale), disable it
  # before rewriting the unit content below. Best-effort; never aborts.
  cleanup_stale_sweep_units "$SERVICE_PATH" "$main_worktree" "$SYSTEMCTL_CMD"

  if ! mkdir -p "$UNIT_DIR"; then
    echo "WARNING: ensure_sweep_timer: mkdir -p $UNIT_DIR failed; periodic sweep unavailable" >&2
    return 1
  fi

  # Write the .service atomically only when its content differs: temp file in the
  # same dir, then mv into place.
  if [ ! -f "$SERVICE_PATH" ] || [ "$(cat "$SERVICE_PATH")" != "$desired_service" ]; then
    local tmp_service
    tmp_service=$(mktemp "$UNIT_DIR/.dispatch-sweep-periodic.service.XXXXXX") || {
      echo "WARNING: ensure_sweep_timer: could not create temp file in $UNIT_DIR; periodic sweep unavailable" >&2
      return 1
    }
    if ! printf '%s\n' "$desired_service" > "$tmp_service"; then
      echo "WARNING: ensure_sweep_timer: failed to write $tmp_service; periodic sweep unavailable" >&2
      rm -f "$tmp_service"
      return 1
    fi
    if ! mv "$tmp_service" "$SERVICE_PATH"; then
      echo "WARNING: ensure_sweep_timer: failed to install $SERVICE_PATH; periodic sweep unavailable" >&2
      rm -f "$tmp_service"
      return 1
    fi
  fi

  # Write the .timer atomically only when its content differs: temp file in the
  # same dir, then mv into place.
  if [ ! -f "$TIMER_PATH" ] || [ "$(cat "$TIMER_PATH")" != "$desired_timer" ]; then
    local tmp_timer
    tmp_timer=$(mktemp "$UNIT_DIR/.dispatch-sweep-periodic.timer.XXXXXX") || {
      echo "WARNING: ensure_sweep_timer: could not create temp file in $UNIT_DIR; periodic sweep unavailable" >&2
      return 1
    }
    if ! printf '%s\n' "$desired_timer" > "$tmp_timer"; then
      echo "WARNING: ensure_sweep_timer: failed to write $tmp_timer; periodic sweep unavailable" >&2
      rm -f "$tmp_timer"
      return 1
    fi
    if ! mv "$tmp_timer" "$TIMER_PATH"; then
      echo "WARNING: ensure_sweep_timer: failed to install $TIMER_PATH; periodic sweep unavailable" >&2
      rm -f "$tmp_timer"
      return 1
    fi
  fi

  # daemon-reload unconditionally on this slow path, outside both write blocks.
  # The hot path above already returned early when both units matched
  # byte-for-byte AND the timer was active; reaching here means at least one unit
  # was just written OR both exist on disk but the timer is not active. A
  # daemon-reload that failed on a prior call (after the mv succeeded) leaves the
  # units on disk but unknown to systemd, so the content compare skips the write
  # blocks on every later call — running the reload outside those blocks ensures
  # it is retried until systemd has loaded the units, instead of falling straight
  # through to a doomed `enable --now`. Both files are on disk before the reload
  # since the timer's Unit= references the service.
  if ! "$SYSTEMCTL_CMD" --user daemon-reload; then
    echo "WARNING: ensure_sweep_timer: systemctl --user daemon-reload failed; periodic sweep unavailable" >&2
    return 1
  fi

  # Install + activate the TIMER (not the oneshot service): enable symlinks it
  # under WantedBy=timers.target (so it re-arms on every user-session start) and
  # --now arms it immediately. A .timer does nothing until this enable --now;
  # the paired service stays inert until the timer triggers it.
  if ! "$SYSTEMCTL_CMD" --user enable --now dispatch-sweep-periodic.timer; then
    echo "WARNING: ensure_sweep_timer: systemctl --user enable --now dispatch-sweep-periodic.timer failed; periodic sweep unavailable" >&2
    return 1
  fi
}


# Disable a stale healer timer/service whose installed unit points at a
# different main-worktree path than the current one, mirroring
# cleanup_stale_sweep_units above. Thin wrapper over cleanup_stale_unit_pair;
# see that function for the full contract.
# Args: $1 = installed service-unit path, $2 = current main worktree path,
#       $3 = systemctl command
cleanup_stale_healer_units() {
  cleanup_stale_unit_pair "$1" "$2" "$3" \
    dispatch-heal.timer dispatch-heal.service \
    cleanup_stale_healer_units healer
}

# Install and activate the durable `dispatch-heal.timer` (+ its paired
# `dispatch-heal.service`) so the systemd-unit poisoning healer
# (dispatch-heal-units) fires on a wall-clock cadence rather than only from an
# ad hoc invocation.
#
# The .service is Type=oneshot and carries NO [Install] section — the .timer
# pulls it in via Unit=, and a oneshot with an [Install] would be pointlessly
# enable-able on its own. ExecStart points directly at the
# `dispatch-heal-units` script.
#
# SuccessExitStatus=1 2: a finding (exit 1) or UNKNOWN (exit 2) must not latch
# this unit into `failed` — findings are already reported via the graph node +
# journal, and a latched-failed unit would then be "healed" by the healer in a
# pointless loop. Only a genuine internal error (exit 69, or a signal) should
# mark the unit failed.
#
# Best-effort: a failure here must not abort the caller (a tick/reseed
# launcher), so we warn to stderr and return non-zero — never `exit`. A missing
# timer just means the unit-poisoning healer falls back to on-demand-only
# invocation.
#
# Honors the per-unit manual-disable sentinel: when it is set for
# dispatch-heal.timer the unit files are still kept current on disk but
# `enable --now` is skipped, so a deliberate `systemctl --user disable --now`
# survives every reseed — see lib-unit-disable-state.sh for the sentinel path
# and the operator procedure.
# Args: $1 = main worktree path
ensure_healer_units() {
  local main_worktree="$1"

  # A systemd unit file is line-structured: each line is an independent
  # directive. An embedded newline in any value we interpolate below would land
  # as an attacker-controlled extra directive in the [Service] section. The
  # main worktree path comes from git output or a test override and never
  # legitimately contains a newline; reject it rather than emit a malformed
  # unit (best-effort: warn + return per this helper's contract — never exit).
  if [[ "$main_worktree" == *$'\n'* ]]; then
    echo "WARNING: ensure_healer_units: main worktree path contains a newline; refusing to write unit; unit-poisoning healer unavailable" >&2
    return 1
  fi
  # WorkingDirectory= does not unescape quotes, so a space in the bare path would
  # split the value at the first space; reject it (same contract: warn + return 1).
  if [[ "$main_worktree" == *' '* ]]; then
    echo "WARNING: ensure_healer_units: main worktree path contains a space; refusing to write unit; unit-poisoning healer unavailable" >&2
    return 1
  fi
  # ExecStart= is double-quoted ("$HEALER_SCRIPT"); HEALER_SCRIPT is derived
  # from main_worktree below. An embedded double-quote in the path would
  # prematurely close that quoted token, making systemd parse the executable and
  # arguments wrong (bad-setting) and permanently break the unit. The path never
  # legitimately contains a double-quote; reject it rather than emit a malformed
  # unit (same contract: warn + return 1).
  if [[ "$main_worktree" == *'"'* ]]; then
    echo "WARNING: ensure_healer_units: main worktree path contains a double-quote; refusing to write unit; unit-poisoning healer unavailable" >&2
    return 1
  fi
  # ExecStart= is double-quoted and systemd C-unescapes it, so a backslash in
  # the path would be misread as an escape sequence and corrupt the executable
  # token. The path never legitimately contains a backslash; reject it (#1212).
  if [[ "$main_worktree" == *'\'* ]]; then
    echo "WARNING: ensure_healer_units: main worktree path contains a backslash; refusing to write unit; unit-poisoning healer unavailable" >&2
    return 1
  fi

  local HEALER_SCRIPT="$main_worktree/.claude/skills/dispatch-propagate/scripts/dispatch-heal-units"
  local UNIT_DIR="${DISPATCH_HEALER_UNIT_DIR:-${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user}"
  local SERVICE_PATH="$UNIT_DIR/dispatch-heal.service"
  local TIMER_PATH="$UNIT_DIR/dispatch-heal.timer"
  local SYSTEMCTL_CMD="${DISPATCH_HEALER_SYSTEMCTL_CMD:-systemctl}"

  # Sanitize PATH for the Environment= line (see strip_unit_env_path).
  local safe_path
  safe_path=$(strip_unit_env_path "$PATH")

  # Desired .service content. Environment=PATH= captures the launching caller's
  # full nix-store PATH at write time, for the same reason the recover, sweep,
  # and heartbeat units do — the systemd user manager's minimal default PATH
  # omits the nix store, so dispatch-heal-units could not otherwise resolve
  # git/jq/claude/systemctl.
  #
  # ExecStart= and Environment= are double-quoted: systemd unescapes C-style
  # quotes for these two directives, so a path containing spaces is parsed as a
  # single token rather than split into an executable + spurious arguments.
  # WorkingDirectory= is the exception — it does NOT unescape quotes; a leading
  # `"` makes the path non-absolute and systemd rejects the unit (bad-setting),
  # so it takes the bare path (the no-spaces invariant is enforced by the guard
  # above, so the bare value is a single token).
  #
  # SyslogIdentifier=dispatch-heal-units is the stable `journalctl --user -t
  # <id>` rate source for this unit. Use `-t` (SyslogIdentifier), never `-u`
  # (unit name) — a `-u` match against a oneshot triggered by a timer can
  # silently drop events, a documented past bug.
  #
  # Deliberately NO [Install] section — the .timer pulls this oneshot in via
  # Unit=, so the service is never enabled on its own.
  local desired_service
  desired_service=$(cat <<EOF
[Unit]
Description=Dispatch systemd-unit poisoning healer (timer-triggered)

[Service]
Type=oneshot
SuccessExitStatus=1 2
SyslogIdentifier=dispatch-heal-units
Environment="PATH=$safe_path"
ExecStart="$HEALER_SCRIPT"
WorkingDirectory=$main_worktree
EOF
)

  # Desired .timer content. OnBootSec delays the first fire past session start;
  # OnUnitActiveSec re-arms 2min after each activation for the steady cadence.
  # Unit= names the paired oneshot above.
  #
  # Deliberately NO Persistent= — it only affects OnCalendar= timers (catching
  # up missed wall-clock fires across downtime) and is a no-op for the
  # monotonic OnBootSec=/OnUnitActiveSec= triggers used here.
  local desired_timer
  desired_timer=$(cat <<EOF
[Unit]
Description=Dispatch unit-poisoning healer timer

[Timer]
OnBootSec=1min
OnUnitActiveSec=2min
Unit=dispatch-heal.service

[Install]
WantedBy=timers.target
EOF
)

  # Read the manual-disable marker ONCE per call: it is consulted twice below
  # (steady-state short-circuit, and the enable decision) and must not disagree
  # with itself between them.
  local manually_disabled=0
  if unit_manually_disabled dispatch-heal.timer ensure_healer_units; then
    manually_disabled=1
  fi

  # Steady-state hot path: if BOTH installed units already match byte-for-byte
  # AND the timer is active (armed) — or the operator has manually disabled it,
  # in which case an inactive timer IS the requested steady state — skip the
  # write/reload/enable entirely. The manually-disabled test comes first so a
  # disabled timer costs zero `systemctl` invocations in steady state.
  if [ -f "$SERVICE_PATH" ] && [ "$(cat "$SERVICE_PATH")" = "$desired_service" ] \
     && [ -f "$TIMER_PATH" ] && [ "$(cat "$TIMER_PATH")" = "$desired_timer" ] \
     && { [ "$manually_disabled" -eq 1 ] || "$SYSTEMCTL_CMD" --user is-active --quiet dispatch-heal.timer; }; then
    # Report a honored disable even on the zero-`systemctl` path. The
    # short-circuit above means `manually_disabled` is the only leg that can be
    # true without an is-active probe having run, so re-testing it here costs
    # nothing and does NOT re-read the sentinel — the single-read invariant
    # documented at :3193-3195 is preserved.
    if [ "$manually_disabled" -eq 1 ]; then
      unit_disable_skip_notice ensure_healer_units dispatch-heal.timer "unit files already current"
    fi
    return 0
  fi

  # Path-change cleanup, mirroring ensure_sweep_timer: if the installed unit
  # names a different main worktree (or is otherwise stale), disable it before
  # rewriting the unit content below. Best-effort; never aborts.
  cleanup_stale_healer_units "$SERVICE_PATH" "$main_worktree" "$SYSTEMCTL_CMD"

  if ! mkdir -p "$UNIT_DIR"; then
    echo "WARNING: ensure_healer_units: mkdir -p $UNIT_DIR failed; unit-poisoning healer unavailable" >&2
    return 1
  fi

  # Write the .service atomically only when its content differs: temp file in the
  # same dir, then mv into place.
  if [ ! -f "$SERVICE_PATH" ] || [ "$(cat "$SERVICE_PATH")" != "$desired_service" ]; then
    local tmp_service
    tmp_service=$(mktemp "$UNIT_DIR/.dispatch-heal.service.XXXXXX") || {
      echo "WARNING: ensure_healer_units: could not create temp file in $UNIT_DIR; unit-poisoning healer unavailable" >&2
      return 1
    }
    if ! printf '%s\n' "$desired_service" > "$tmp_service"; then
      echo "WARNING: ensure_healer_units: failed to write $tmp_service; unit-poisoning healer unavailable" >&2
      rm -f "$tmp_service"
      return 1
    fi
    if ! mv "$tmp_service" "$SERVICE_PATH"; then
      echo "WARNING: ensure_healer_units: failed to install $SERVICE_PATH; unit-poisoning healer unavailable" >&2
      rm -f "$tmp_service"
      return 1
    fi
  fi

  # Write the .timer atomically only when its content differs: temp file in the
  # same dir, then mv into place.
  if [ ! -f "$TIMER_PATH" ] || [ "$(cat "$TIMER_PATH")" != "$desired_timer" ]; then
    local tmp_timer
    tmp_timer=$(mktemp "$UNIT_DIR/.dispatch-heal.timer.XXXXXX") || {
      echo "WARNING: ensure_healer_units: could not create temp file in $UNIT_DIR; unit-poisoning healer unavailable" >&2
      return 1
    }
    if ! printf '%s\n' "$desired_timer" > "$tmp_timer"; then
      echo "WARNING: ensure_healer_units: failed to write $tmp_timer; unit-poisoning healer unavailable" >&2
      rm -f "$tmp_timer"
      return 1
    fi
    if ! mv "$tmp_timer" "$TIMER_PATH"; then
      echo "WARNING: ensure_healer_units: failed to install $TIMER_PATH; unit-poisoning healer unavailable" >&2
      rm -f "$tmp_timer"
      return 1
    fi
  fi

  # daemon-reload unconditionally on this slow path, outside both write blocks.
  # The hot path above already returned early when both units matched
  # byte-for-byte AND the timer was active; reaching here means at least one unit
  # was just written OR both exist on disk but the timer is not active. A
  # daemon-reload that failed on a prior call (after the mv succeeded) leaves the
  # units on disk but unknown to systemd, so the content compare skips the write
  # blocks on every later call — running the reload outside those blocks ensures
  # it is retried until systemd has loaded the units, instead of falling straight
  # through to a doomed `enable --now`. Both files are on disk before the reload
  # since the timer's Unit= references the service.
  if ! "$SYSTEMCTL_CMD" --user daemon-reload; then
    echo "WARNING: ensure_healer_units: systemctl --user daemon-reload failed; unit-poisoning healer unavailable" >&2
    return 1
  fi

  # Honor a deliberate operator disable: the unit files above are kept current,
  # but arming the timer is skipped. NOT a WARNING and NOT an error — this is
  # the requested state, and the caller's `|| true` must not be the only thing
  # separating "we did what you asked" from "something went wrong".
  if [ "$manually_disabled" -eq 1 ]; then
    unit_disable_skip_notice ensure_healer_units dispatch-heal.timer "unit files updated"
    return 0
  fi

  # Install + activate the TIMER (not the oneshot service): enable symlinks it
  # under WantedBy=timers.target (so it re-arms on every user-session start) and
  # --now arms it immediately. A .timer does nothing until this enable --now;
  # the paired service stays inert until the timer triggers it.
  if ! "$SYSTEMCTL_CMD" --user enable --now dispatch-heal.timer; then
    echo "WARNING: ensure_healer_units: systemctl --user enable --now dispatch-heal.timer failed; unit-poisoning healer unavailable" >&2
    return 1
  fi
}


# Disable a stale watcher timer/service whose installed unit points at a
# different main-worktree path than the current one, mirroring
# cleanup_stale_sweep_units above. Thin wrapper over cleanup_stale_unit_pair;
# see that function for the full contract.
# Args: $1 = installed service-unit path, $2 = current main worktree path,
#       $3 = systemctl command
cleanup_stale_watcher_units() {
  cleanup_stale_unit_pair "$1" "$2" "$3" \
    dispatch-fleet-watch.timer dispatch-fleet-watch.service \
    cleanup_stale_watcher_units watcher
}

# Install and activate the durable `dispatch-fleet-watch.timer` (+ its paired
# `dispatch-fleet-watch.service`) so the fleet watchdog (dispatch-fleet-watch)
# fires on a wall-clock cadence rather than only from an ad hoc invocation.
#
# The .service is Type=oneshot and carries NO [Install] section — the .timer
# pulls it in via Unit=, and a oneshot with an [Install] would be pointlessly
# enable-able on its own. ExecStart points directly at the
# `dispatch-fleet-watch` script.
#
# SuccessExitStatus=1 2: a finding (exit 1) or UNKNOWN (exit 2) must not latch
# this unit into `failed` — findings are already reported via the graph node +
# journal, and a latched-failed unit would then be "healed" by the healer in a
# pointless loop. Only a genuine internal error (exit 69, or a signal) should
# mark the unit failed.
#
# OnBootSec=3min / OnUnitActiveSec=5min are staggered off the healer's
# 1min/2min so the two timers don't fire together.
#
# Best-effort: a failure here must not abort the caller (a tick/reseed
# launcher), so we warn to stderr and return non-zero — never `exit`. A missing
# timer just means the fleet watchdog falls back to on-demand-only invocation.
#
# Honors the per-unit manual-disable sentinel: when it is set for
# dispatch-fleet-watch.timer the unit files are still kept current on disk but
# `enable --now` is skipped, so a deliberate `systemctl --user disable --now`
# survives every reseed — see lib-unit-disable-state.sh for the sentinel path
# and the operator procedure.
# Args: $1 = main worktree path
ensure_watcher_units() {
  local main_worktree="$1"

  # A systemd unit file is line-structured: each line is an independent
  # directive. An embedded newline in any value we interpolate below would land
  # as an attacker-controlled extra directive in the [Service] section. The
  # main worktree path comes from git output or a test override and never
  # legitimately contains a newline; reject it rather than emit a malformed
  # unit (best-effort: warn + return per this helper's contract — never exit).
  if [[ "$main_worktree" == *$'\n'* ]]; then
    echo "WARNING: ensure_watcher_units: main worktree path contains a newline; refusing to write unit; fleet watchdog unavailable" >&2
    return 1
  fi
  # WorkingDirectory= does not unescape quotes, so a space in the bare path would
  # split the value at the first space; reject it (same contract: warn + return 1).
  if [[ "$main_worktree" == *' '* ]]; then
    echo "WARNING: ensure_watcher_units: main worktree path contains a space; refusing to write unit; fleet watchdog unavailable" >&2
    return 1
  fi
  # ExecStart= is double-quoted ("$WATCHER_SCRIPT"); WATCHER_SCRIPT is derived
  # from main_worktree below. An embedded double-quote in the path would
  # prematurely close that quoted token, making systemd parse the executable and
  # arguments wrong (bad-setting) and permanently break the unit. The path never
  # legitimately contains a double-quote; reject it rather than emit a malformed
  # unit (same contract: warn + return 1).
  if [[ "$main_worktree" == *'"'* ]]; then
    echo "WARNING: ensure_watcher_units: main worktree path contains a double-quote; refusing to write unit; fleet watchdog unavailable" >&2
    return 1
  fi
  # ExecStart= is double-quoted and systemd C-unescapes it, so a backslash in
  # the path would be misread as an escape sequence and corrupt the executable
  # token. The path never legitimately contains a backslash; reject it (#1212).
  if [[ "$main_worktree" == *'\'* ]]; then
    echo "WARNING: ensure_watcher_units: main worktree path contains a backslash; refusing to write unit; fleet watchdog unavailable" >&2
    return 1
  fi

  local WATCHER_SCRIPT="$main_worktree/.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch"
  local UNIT_DIR="${DISPATCH_WATCHER_UNIT_DIR:-${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user}"
  local SERVICE_PATH="$UNIT_DIR/dispatch-fleet-watch.service"
  local TIMER_PATH="$UNIT_DIR/dispatch-fleet-watch.timer"
  local SYSTEMCTL_CMD="${DISPATCH_WATCHER_SYSTEMCTL_CMD:-systemctl}"

  # Sanitize PATH for the Environment= line (see strip_unit_env_path).
  local safe_path
  safe_path=$(strip_unit_env_path "$PATH")

  # Desired .service content. Environment=PATH= captures the launching caller's
  # full nix-store PATH at write time, for the same reason the recover, sweep,
  # heartbeat, and healer units do — the systemd user manager's minimal default
  # PATH omits the nix store, so dispatch-fleet-watch could not otherwise
  # resolve git/jq/claude/systemctl.
  #
  # ExecStart= and Environment= are double-quoted: systemd unescapes C-style
  # quotes for these two directives, so a path containing spaces is parsed as a
  # single token rather than split into an executable + spurious arguments.
  # WorkingDirectory= is the exception — it does NOT unescape quotes; a leading
  # `"` makes the path non-absolute and systemd rejects the unit (bad-setting),
  # so it takes the bare path (the no-spaces invariant is enforced by the guard
  # above, so the bare value is a single token).
  #
  # SyslogIdentifier=dispatch-fleet-watch is the stable `journalctl --user -t
  # <id>` rate source for this unit. Use `-t` (SyslogIdentifier), never `-u`
  # (unit name) — a `-u` match against a oneshot triggered by a timer can
  # silently drop events, a documented past bug.
  #
  # Deliberately NO [Install] section — the .timer pulls this oneshot in via
  # Unit=, so the service is never enabled on its own.
  local desired_service
  desired_service=$(cat <<EOF
[Unit]
Description=Dispatch fleet watchdog (timer-triggered)

[Service]
Type=oneshot
SuccessExitStatus=1 2
SyslogIdentifier=dispatch-fleet-watch
Environment="PATH=$safe_path"
ExecStart="$WATCHER_SCRIPT"
WorkingDirectory=$main_worktree
EOF
)

  # Desired .timer content. OnBootSec delays the first fire past session start,
  # staggered 2min after the healer's 1min so the two don't fire together;
  # OnUnitActiveSec re-arms 5min after each activation for the steady cadence
  # (also staggered off the healer's 2min). Unit= names the paired oneshot
  # above.
  #
  # Deliberately NO Persistent= — it only affects OnCalendar= timers (catching
  # up missed wall-clock fires across downtime) and is a no-op for the
  # monotonic OnBootSec=/OnUnitActiveSec= triggers used here.
  local desired_timer
  desired_timer=$(cat <<EOF
[Unit]
Description=Dispatch fleet watchdog timer

[Timer]
OnBootSec=3min
OnUnitActiveSec=5min
Unit=dispatch-fleet-watch.service

[Install]
WantedBy=timers.target
EOF
)

  # Read the manual-disable marker ONCE per call: it is consulted twice below
  # (steady-state short-circuit, and the enable decision) and must not disagree
  # with itself between them.
  local manually_disabled=0
  if unit_manually_disabled dispatch-fleet-watch.timer ensure_watcher_units; then
    manually_disabled=1
  fi

  # Steady-state hot path: if BOTH installed units already match byte-for-byte
  # AND the timer is active (armed) — or the operator has manually disabled it,
  # in which case an inactive timer IS the requested steady state — skip the
  # write/reload/enable entirely. The manually-disabled test comes first so a
  # disabled timer costs zero `systemctl` invocations in steady state.
  if [ -f "$SERVICE_PATH" ] && [ "$(cat "$SERVICE_PATH")" = "$desired_service" ] \
     && [ -f "$TIMER_PATH" ] && [ "$(cat "$TIMER_PATH")" = "$desired_timer" ] \
     && { [ "$manually_disabled" -eq 1 ] || "$SYSTEMCTL_CMD" --user is-active --quiet dispatch-fleet-watch.timer; }; then
    # Report a honored disable even on the zero-`systemctl` path. The
    # short-circuit above means `manually_disabled` is the only leg that can be
    # true without an is-active probe having run, so re-testing it here costs
    # nothing and does NOT re-read the sentinel — the single-read invariant
    # documented at :3193-3195 is preserved.
    if [ "$manually_disabled" -eq 1 ]; then
      unit_disable_skip_notice ensure_watcher_units dispatch-fleet-watch.timer "unit files already current"
    fi
    return 0
  fi

  # Path-change cleanup, mirroring ensure_sweep_timer: if the installed unit
  # names a different main worktree (or is otherwise stale), disable it before
  # rewriting the unit content below. Best-effort; never aborts.
  cleanup_stale_watcher_units "$SERVICE_PATH" "$main_worktree" "$SYSTEMCTL_CMD"

  if ! mkdir -p "$UNIT_DIR"; then
    echo "WARNING: ensure_watcher_units: mkdir -p $UNIT_DIR failed; fleet watchdog unavailable" >&2
    return 1
  fi

  # Write the .service atomically only when its content differs: temp file in the
  # same dir, then mv into place.
  if [ ! -f "$SERVICE_PATH" ] || [ "$(cat "$SERVICE_PATH")" != "$desired_service" ]; then
    local tmp_service
    tmp_service=$(mktemp "$UNIT_DIR/.dispatch-fleet-watch.service.XXXXXX") || {
      echo "WARNING: ensure_watcher_units: could not create temp file in $UNIT_DIR; fleet watchdog unavailable" >&2
      return 1
    }
    if ! printf '%s\n' "$desired_service" > "$tmp_service"; then
      echo "WARNING: ensure_watcher_units: failed to write $tmp_service; fleet watchdog unavailable" >&2
      rm -f "$tmp_service"
      return 1
    fi
    if ! mv "$tmp_service" "$SERVICE_PATH"; then
      echo "WARNING: ensure_watcher_units: failed to install $SERVICE_PATH; fleet watchdog unavailable" >&2
      rm -f "$tmp_service"
      return 1
    fi
  fi

  # Write the .timer atomically only when its content differs: temp file in the
  # same dir, then mv into place.
  if [ ! -f "$TIMER_PATH" ] || [ "$(cat "$TIMER_PATH")" != "$desired_timer" ]; then
    local tmp_timer
    tmp_timer=$(mktemp "$UNIT_DIR/.dispatch-fleet-watch.timer.XXXXXX") || {
      echo "WARNING: ensure_watcher_units: could not create temp file in $UNIT_DIR; fleet watchdog unavailable" >&2
      return 1
    }
    if ! printf '%s\n' "$desired_timer" > "$tmp_timer"; then
      echo "WARNING: ensure_watcher_units: failed to write $tmp_timer; fleet watchdog unavailable" >&2
      rm -f "$tmp_timer"
      return 1
    fi
    if ! mv "$tmp_timer" "$TIMER_PATH"; then
      echo "WARNING: ensure_watcher_units: failed to install $TIMER_PATH; fleet watchdog unavailable" >&2
      rm -f "$tmp_timer"
      return 1
    fi
  fi

  # daemon-reload unconditionally on this slow path, outside both write blocks.
  # The hot path above already returned early when both units matched
  # byte-for-byte AND the timer was active; reaching here means at least one unit
  # was just written OR both exist on disk but the timer is not active. A
  # daemon-reload that failed on a prior call (after the mv succeeded) leaves the
  # units on disk but unknown to systemd, so the content compare skips the write
  # blocks on every later call — running the reload outside those blocks ensures
  # it is retried until systemd has loaded the units, instead of falling straight
  # through to a doomed `enable --now`. Both files are on disk before the reload
  # since the timer's Unit= references the service.
  if ! "$SYSTEMCTL_CMD" --user daemon-reload; then
    echo "WARNING: ensure_watcher_units: systemctl --user daemon-reload failed; fleet watchdog unavailable" >&2
    return 1
  fi

  # Honor a deliberate operator disable: the unit files above are kept current,
  # but arming the timer is skipped. NOT a WARNING and NOT an error — this is
  # the requested state, and the caller's `|| true` must not be the only thing
  # separating "we did what you asked" from "something went wrong".
  if [ "$manually_disabled" -eq 1 ]; then
    unit_disable_skip_notice ensure_watcher_units dispatch-fleet-watch.timer "unit files updated"
    return 0
  fi

  # Install + activate the TIMER (not the oneshot service): enable symlinks it
  # under WantedBy=timers.target (so it re-arms on every user-session start) and
  # --now arms it immediately. A .timer does nothing until this enable --now;
  # the paired service stays inert until the timer triggers it.
  if ! "$SYSTEMCTL_CMD" --user enable --now dispatch-fleet-watch.timer; then
    echo "WARNING: ensure_watcher_units: systemctl --user enable --now dispatch-fleet-watch.timer failed; fleet watchdog unavailable" >&2
    return 1
  fi
}


# Install and activate the durable always-on heartbeat: a `systemd --user`
# `dispatch-heartbeat.timer` firing `dispatch-heartbeat.service` (a no-arg
# `dispatch-tick`) on a wall-clock schedule — `OnBootSec=2min`,
# `OnCalendar=*:0/15`, `Persistent=true` (#2375). This gives the autonomous chain a
# liveness floor that is independent of Stop hooks and reseed timers, so the
# chain self-recovers from abnormal worker death and post-cap stalls where no
# Stop hook fires and no reseed is armed (#2022). A flat drumbeat is safe and
# costs zero model tokens when idle: `dispatch-tick` is a pure-bash sequencer
# with no model session, and it is self-suppressing — busy / concurrency-cap /
# empty-disposition ticks spawn no worker.
#
# #1010 coexistence rationale: the heartbeat provides automatic liveness, while
# the `dispatch:chain-stalled` escalation (#1010) is kept for human visibility.
# The two are NOT mutually exclusive — the heartbeat is the machine that keeps
# the chain alive, and the escalation latch is the human-facing signal that the
# chain went quiet; neither replaces the other, and this helper does not touch
# (let alone auto-close) the escalation latch.
#
# ExecStart=dispatch-tick-direct + KillMode=process worker-survival rationale:
# ExecStart runs `dispatch-tick` DIRECTLY (not `dispatch-spawn-tick`), mirroring
# the proven reseed timer→tick path (see dispatch-schedule-reseed:460-475). The
# heartbeat-spawned worker's first `claude` call attaches to the durable
# `dispatch-claude-daemon.service` cgroup, not this oneshot service's cgroup, so
# when the heartbeat `Type=oneshot` service exits, the worker survives.
# `KillMode=process` is the degraded-path fallback for hosts where the durable
# daemon service is unavailable: it confines the kill to the dispatch-tick
# process itself, so a detached worker survives the oneshot service finishing.
# `OnFailure=dispatch-tick-recover.service` chains a crashing tick to the same
# systemd-owned recovery handler the tick/reseed launchers use.
#
# Disable a stale heartbeat timer/service whose installed unit points at a
# different main-worktree path than the current one (#2056). Between a dispatch
# checkout path change and the first ensure_heartbeat_units call from the new
# path, the timer's Persistent=true can fire dispatch-heartbeat.service at the
# old/missing path. Detect the mismatch from the installed WorkingDirectory= and
# disable the stale units before the caller rewrites them.
#
# Best-effort: the heartbeat service has no [Install] section, so `disable` exits
# non-zero by design. Suppress that and never abort the caller (a tick/reseed
# launcher) — the subsequent unit rewrite is what actually repairs the state.
# Thin wrapper over cleanup_stale_unit_pair (defined above, next to
# cleanup_stale_sweep_units); see that function for the full contract.
# Args: $1 = installed service-unit path, $2 = current main worktree path,
#       $3 = systemctl command
cleanup_stale_heartbeat_units() {
  cleanup_stale_unit_pair "$1" "$2" "$3" \
    dispatch-heartbeat.timer dispatch-heartbeat.service \
    cleanup_stale_heartbeat_units heartbeat
}

# Returns 0 only when the heartbeat timer is armed with a future trigger
# (SubState=waiting). 'elapsed' (the #2375 stranded state: active but no future
# fire), 'dead' (inactive), and any other/unrecognized substate all return
# non-zero so the caller falls through to repair. SubState is the reliable
# discriminator: NextElapseUSecRealtime is empty for a healthy monotonic timer
# too, so parsing it would mis-detect.
# Args: $1 = systemctl command
heartbeat_timer_is_armed() {
  local systemctl_cmd="$1"
  local substate
  substate=$("$systemctl_cmd" --user show dispatch-heartbeat.timer \
    --property=SubState --value 2>/dev/null) || return 1
  # 'waiting' = a future trigger is armed (healthy). 'elapsed' = the #2375
  # stranded state (active, no future fire). 'dead' = inactive. Fail-safe:
  # treat anything that is not explicitly 'waiting' as needing repair, so an
  # unrecognized substate can never be read as healthy. (A transient
  # 'running' during a heartbeat fire causes at most one harmless re-arm; the
  # tick oneshot is fast, so the window is tiny.)
  [ "$substate" = "waiting" ]
}

# Best-effort: a failure here must not abort the caller (a tick/reseed
# launcher), so we warn to stderr and return non-zero — never `exit`. A missing
# heartbeat just means the chain falls back to the prior Stop-hook/reseed-only
# liveness behavior.
# Args: $1 = main worktree path
ensure_heartbeat_units() {
  local main_worktree="$1"

  # A systemd unit file is line-structured: each line is an independent
  # directive. An embedded newline in the interpolated worktree path would land
  # as an attacker-controlled extra directive in the [Service] section. The main
  # worktree path comes from git output or a test override and never
  # legitimately contains a newline; reject it rather than emit a malformed unit
  # (best-effort: warn + return per this helper's contract — never exit).
  if [[ "$main_worktree" == *$'\n'* ]]; then
    echo "WARNING: ensure_heartbeat_units: main worktree path contains a newline; refusing to write unit; periodic heartbeat unavailable" >&2
    return 1
  fi
  # WorkingDirectory= does not unescape quotes, so a space in the bare path would
  # split the value at the first space; reject it (same contract: warn + return 1).
  if [[ "$main_worktree" == *' '* ]]; then
    echo "WARNING: ensure_heartbeat_units: main worktree path contains a space; refusing to write unit; periodic heartbeat unavailable" >&2
    return 1
  fi
  # ExecStart= is double-quoted ("$TICK_SCRIPT"); an embedded double-quote in the
  # path would prematurely close that quoted token, making systemd parse the
  # executable and arguments wrong (bad-setting) and permanently break the unit.
  # The path never legitimately contains a double-quote; reject it.
  if [[ "$main_worktree" == *'"'* ]]; then
    echo "WARNING: ensure_heartbeat_units: main worktree path contains a double-quote; refusing to write unit; periodic heartbeat unavailable" >&2
    return 1
  fi
  # ExecStart= is double-quoted and systemd C-unescapes it, so a backslash in the
  # path would be misread as an escape sequence and corrupt the executable token.
  # The path never legitimately contains a backslash; reject it (#1212).
  if [[ "$main_worktree" == *'\'* ]]; then
    echo "WARNING: ensure_heartbeat_units: main worktree path contains a backslash; refusing to write unit; periodic heartbeat unavailable" >&2
    return 1
  fi

  local TICK_SCRIPT="$main_worktree/.claude/skills/dispatch-propagate/scripts/dispatch-tick"
  local UNIT_DIR="${DISPATCH_HEARTBEAT_UNIT_DIR:-${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user}"
  local SERVICE_PATH="$UNIT_DIR/dispatch-heartbeat.service"
  local TIMER_PATH="$UNIT_DIR/dispatch-heartbeat.timer"
  local SYSTEMCTL_CMD="${DISPATCH_HEARTBEAT_SYSTEMCTL_CMD:-systemctl}"

  # Sanitize PATH for the Environment= line (see strip_unit_env_path).
  local safe_path
  safe_path=$(strip_unit_env_path "$PATH")

  # Desired service unit. ExecStart runs `dispatch-tick` directly with no args
  # (see the dispatch-tick-direct + KillMode=process rationale above); the
  # heartbeat-spawned worker attaches to the durable daemon cgroup and survives
  # this oneshot service exiting. Environment=PATH= captures the launching
  # caller's full nix-store PATH at write time, for the same reason the recover
  # and daemon units do — so the tick (and any worker it spawns) can resolve
  # git/jq/claude.
  #
  # ExecStart= and Environment= are double-quoted: systemd unescapes C-style
  # quotes for these two directives, so a path containing spaces is parsed as a
  # single token rather than split into an executable + spurious arguments.
  # WorkingDirectory= is the exception — it does NOT unescape quotes and takes
  # the bare path (the no-spaces invariant is enforced by the guard above).
  local desired_service
  desired_service=$(cat <<EOF
[Unit]
Description=Dispatch chain periodic heartbeat tick (#2022)
OnFailure=dispatch-tick-recover.service

[Service]
Type=oneshot
Environment="PATH=$safe_path"
ExecStart="$TICK_SCRIPT"
KillMode=process
WorkingDirectory=$main_worktree
EOF
)

  # Desired timer unit: a wall-clock schedule (#2375). OnCalendar=*:0/15 fires at
  # :00/:15/:30/:45 regardless of when the service last activated, so the timer
  # always has a future trigger and can never strand in `active (elapsed)` after a
  # restart (the failure mode a monotonic OnUnitActiveSec drumbeat fell into).
  # OnBootSec=2min keeps a fast first post-boot tick; Persistent=true is now
  # meaningful — it catches up a wall-clock fire missed while the host was
  # asleep/off; RandomizedDelaySec=30 smooths the post-boot launcher storm.
  local desired_timer
  desired_timer=$(cat <<EOF
[Unit]
Description=Dispatch chain periodic heartbeat timer (#2022)

[Timer]
OnBootSec=2min
OnCalendar=*:0/15
Persistent=true
RandomizedDelaySec=30

[Install]
WantedBy=timers.target
EOF
)

  # Steady-state hot path: if both installed units already match byte-for-byte
  # AND the timer is armed with a future trigger, do nothing — skip the writes,
  # daemon-reload, and enable entirely. `is-active` is too weak here: it returns
  # 0 for an `active (elapsed)` timer (the #2375 stranded state), so a dead timer
  # would be read as healthy. heartbeat_timer_is_armed requires SubState=waiting,
  # so an elapsed timer falls through to the repair path below.
  if [ -f "$SERVICE_PATH" ] && [ "$(cat "$SERVICE_PATH")" = "$desired_service" ] \
     && [ -f "$TIMER_PATH" ] && [ "$(cat "$TIMER_PATH")" = "$desired_timer" ] \
     && heartbeat_timer_is_armed "$SYSTEMCTL_CMD"; then
    return 0
  fi

  # Path-change cleanup (#2056): if the installed unit names a different main
  # worktree, the path changed — disable the stale timer/service before
  # rewriting the unit content below. Reaching here means the hot path did not
  # short-circuit, so either the content differs (path change included) or the
  # timer is inactive. Best-effort; never aborts.
  cleanup_stale_heartbeat_units "$SERVICE_PATH" "$main_worktree" "$SYSTEMCTL_CMD"

  if ! mkdir -p "$UNIT_DIR"; then
    echo "WARNING: ensure_heartbeat_units: mkdir -p $UNIT_DIR failed; periodic heartbeat unavailable" >&2
    return 1
  fi

  # Write each unit atomically only when its content differs: temp file in the
  # same dir (umask 077 so the temp file is 0600 during write), chmod 0644 before
  # mv so systemd can read the installed unit.
  local old_umask
  old_umask=$(umask)

  if [ ! -f "$SERVICE_PATH" ] || [ "$(cat "$SERVICE_PATH")" != "$desired_service" ]; then
    local tmp_service
    umask 077
    tmp_service=$(mktemp "$UNIT_DIR/.dispatch-heartbeat.service.XXXXXX") || {
      umask "$old_umask"
      echo "WARNING: ensure_heartbeat_units: could not create temp file in $UNIT_DIR; periodic heartbeat unavailable" >&2
      return 1
    }
    umask "$old_umask"
    if ! printf '%s\n' "$desired_service" > "$tmp_service"; then
      echo "WARNING: ensure_heartbeat_units: failed to write $tmp_service; periodic heartbeat unavailable" >&2
      rm -f "$tmp_service"
      return 1
    fi
    chmod 0644 "$tmp_service"
    if ! mv "$tmp_service" "$SERVICE_PATH"; then
      echo "WARNING: ensure_heartbeat_units: failed to install $SERVICE_PATH; periodic heartbeat unavailable" >&2
      rm -f "$tmp_service"
      return 1
    fi
  fi

  if [ ! -f "$TIMER_PATH" ] || [ "$(cat "$TIMER_PATH")" != "$desired_timer" ]; then
    local tmp_timer
    umask 077
    tmp_timer=$(mktemp "$UNIT_DIR/.dispatch-heartbeat.timer.XXXXXX") || {
      umask "$old_umask"
      echo "WARNING: ensure_heartbeat_units: could not create temp file in $UNIT_DIR; periodic heartbeat unavailable" >&2
      return 1
    }
    umask "$old_umask"
    if ! printf '%s\n' "$desired_timer" > "$tmp_timer"; then
      echo "WARNING: ensure_heartbeat_units: failed to write $tmp_timer; periodic heartbeat unavailable" >&2
      rm -f "$tmp_timer"
      return 1
    fi
    chmod 0644 "$tmp_timer"
    if ! mv "$tmp_timer" "$TIMER_PATH"; then
      echo "WARNING: ensure_heartbeat_units: failed to install $TIMER_PATH; periodic heartbeat unavailable" >&2
      rm -f "$tmp_timer"
      return 1
    fi
  fi

  # daemon-reload unconditionally on this slow path. The hot path above already
  # returned early when both units matched byte-for-byte AND the timer was
  # active; reaching here means a unit was just written OR the timer is not
  # active. A daemon-reload that failed on a prior call (after the mv succeeded)
  # leaves a unit on disk but unknown to systemd, so the content compare skips
  # the write block on every later call — running the reload outside that block
  # ensures it is retried until systemd has loaded the units, instead of falling
  # straight through to a doomed `enable --now`.
  if ! "$SYSTEMCTL_CMD" --user daemon-reload; then
    echo "WARNING: ensure_heartbeat_units: systemctl --user daemon-reload failed; periodic heartbeat may be stale" >&2
    return 1
  fi

  # Install + re-arm idempotently. enable symlinks the timer under
  # WantedBy=timers.target (so it auto-starts on every user-session start).
  # `enable --now` is NOT enough to repair a stranded timer: its implicit `start`
  # is a no-op on an already-active `elapsed` timer, so the next fire is never
  # recomputed. A separate `restart` re-arms in every case — cold install
  # (inactive → start) and repair (active-elapsed → recompute next elapse) (#2375).
  if ! "$SYSTEMCTL_CMD" --user enable dispatch-heartbeat.timer; then
    echo "WARNING: ensure_heartbeat_units: systemctl --user enable dispatch-heartbeat.timer failed; periodic heartbeat unavailable" >&2
    return 1
  fi
  if ! "$SYSTEMCTL_CMD" --user restart dispatch-heartbeat.timer; then
    echo "WARNING: ensure_heartbeat_units: systemctl --user restart dispatch-heartbeat.timer failed; periodic heartbeat unavailable" >&2
    return 1
  fi
}

# Gate a post-deploy smoke run on STABLE Firebase Hosting release propagation.
# Firebase Hosting release propagation is not atomic across the edge: a single
# good root response does not mean the new release has stably propagated — a
# subsequent request can still get a 503 or a stale version. So instead of
# breaking on the first good root document, this polls until it observes
# REQUIRED_CONSECUTIVE good observations in a row, where each observation
# verifies BOTH the root document AND a content-hashed asset it references.
#
# Arg: <base_url> — the origin to probe (e.g. a preview channel URL).
#
# A single observation is GOOD only when ALL hold:
#   1. GET <base_url> returns HTTP 200, AND
#   2. that body contains `<script type="module"` (a real app shell, not an
#      error/placeholder page), AND
#   3. the content-hashed entry asset referenced by that same body returns 200.
# The asset path is re-extracted from THAT poll's fresh HTML each iteration
# (edges can serve different releases poll-to-poll), mirroring
# packages/config/hosting-smoke-helpers.ts: a `script src="/assets/*.js"` match,
# then a stylesheet `href="/assets/*.css"` fallback. Any miss RESETS the
# consecutive counter to 0 and logs a one-line reason.
#
# Termination is driven by a bounded POLL COUNT (not wall-clock date-diff, which
# is awkward under a PATH-shimmed fake curl). Tunables (env, read into locals):
#   TIMEOUT              (default 120) — seconds budget
#   INTERVAL             (default 2)   — seconds slept between polls
#   REQUIRED_CONSECUTIVE (default 3)   — good observations needed in a row
# Max polls = TIMEOUT / INTERVAL when INTERVAL > 0, else TIMEOUT (so
# `TIMEOUT=5 INTERVAL=0` runs at most 5 polls — INTERVAL=0 never spins forever).
#
# Returns 0 once stable propagation is confirmed. On exhausting the poll budget
# without confirmation it prints a clear error to stderr (last root status, the
# last failing check, and head -20 of the last root HTML) and returns 1 — no
# silent pass. Safe under `set -euo pipefail`: grep/curl exits that are expected
# to be non-zero on a non-match are guarded via `if`/`|| true`.
wait_for_stable_propagation() {
  local base_url="${1:?Usage: wait_for_stable_propagation <base_url>}"
  local timeout="${TIMEOUT:-120}"
  local interval="${INTERVAL:-2}"
  local required="${REQUIRED_CONSECUTIVE:-3}"

  # Bound the loop by a poll count so INTERVAL=0 cannot spin forever.
  local max_polls
  if [ "$interval" -gt 0 ]; then
    max_polls=$(( timeout / interval ))
  else
    max_polls="$timeout"
  fi
  # Always allow at least one poll even for tiny/zero budgets.
  if [ "$max_polls" -lt 1 ]; then
    max_polls=1
  fi

  local tmphtml
  tmphtml=$(mktemp) || { echo "ERROR: wait_for_stable_propagation: could not create temp file" >&2; return 1; }

  local consecutive=0
  local poll status asset_path asset_status last_status="(none)" last_fail="(none)"

  for (( poll=1; poll<=max_polls; poll++ )); do
    # BARE curl so a PATH shim can intercept it in the Unit 4 test. `|| true`
    # keeps a curl failure (e.g. connection refused, empty %{http_code}) from
    # aborting under `set -e`; an empty/non-200 status just fails the check.
    status=$(curl -s --connect-timeout 5 --max-time 10 -o "$tmphtml" -w '%{http_code}' "$base_url" || true)
    last_status="$status"

    if [[ "$status" != "200" ]]; then
      last_fail="root returned $status (want 200)"
      echo "wait_for_stable_propagation: $last_fail — resetting consecutive count" >&2
      consecutive=0
    elif ! grep -q '<script type="module"' "$tmphtml"; then
      last_fail="root 200 but body missing <script type=\"module\""
      echo "wait_for_stable_propagation: $last_fail — resetting consecutive count" >&2
      consecutive=0
    else
      # Root looks good; extract the content-hashed entry asset from THIS poll's
      # fresh HTML. `.js` script src first, then `.css` stylesheet href fallback.
      asset_path=$(grep -oE 'src="/assets/[^"]+\.js"' "$tmphtml" | head -1 | sed -E 's/^src="//; s/"$//' || true)
      if [[ -z "$asset_path" ]]; then
        asset_path=$(grep -oE 'href="/assets/[^"]+\.css"' "$tmphtml" | head -1 | sed -E 's/^href="//; s/"$//' || true)
      fi

      if [[ -z "$asset_path" ]]; then
        last_fail="root 200 but no /assets/* asset reference in HTML"
        echo "wait_for_stable_propagation: $last_fail — resetting consecutive count" >&2
        consecutive=0
      else
        asset_status=$(curl -s --connect-timeout 5 --max-time 10 -o /dev/null -w '%{http_code}' "$base_url$asset_path" || true)
        if [[ "$asset_status" != "200" ]]; then
          last_fail="asset $asset_path returned $asset_status (want 200)"
          echo "wait_for_stable_propagation: $last_fail — resetting consecutive count" >&2
          consecutive=0
        else
          consecutive=$(( consecutive + 1 ))
          echo "wait_for_stable_propagation: good observation $consecutive/$required (root 200, asset $asset_path 200)" >&2
          if [ "$consecutive" -ge "$required" ]; then
            echo "wait_for_stable_propagation: stable propagation confirmed ($required consecutive good observations)"
            rm -f "$tmphtml"
            return 0
          fi
        fi
      fi
    fi

    sleep "$interval"
  done

  echo "ERROR: wait_for_stable_propagation: $base_url did not reach $required consecutive good observations within ${timeout}s (${max_polls} polls). Last root HTTP status: $last_status; last failing check: $last_fail" >&2
  head -20 "$tmphtml" >&2
  rm -f "$tmphtml"
  return 1
}
