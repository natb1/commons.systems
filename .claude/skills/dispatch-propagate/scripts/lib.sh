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

# List issues (NOT pull requests) via the GitHub REST API rather than
# `gh issue list` (which GraphQL-backs). Keeping the per-tick dispatch issue
# scans on REST keeps them off the shared GraphQL rate-limit bucket, which the
# per-tick scan was self-exhausting (#1601).
#
# Contract:
#   gh_issue_list_rest --state <open|closed> [--repo <owner/repo>] [--label <name>] [--limit <n>]
#
# Flags:
#   --state  (required) open|closed.
#   --repo   (optional) owner/repo for a cross-repo scan; when absent the path
#            uses the {owner}/{repo} placeholder gh auto-resolves for the
#            current repo.
#   --label  (optional) a single label name; URL-encoded minimally (space→%20;
#            the colon in values like dispatch:main-broken is query-safe).
#   --limit  (optional) per_page cap. When ABSENT we --paginate the full set
#            (REST --paginate has no silent-truncation hazard, unlike gh pr/issue
#            list's --limit default). When PRESENT we fetch a SINGLE page of that
#            size (no --paginate).
#
# Output: one merged JSON array on stdout. REST /issues returns issues AND PRs;
# only PR objects carry a `pull_request` key, so we filter those out to match
# `gh issue list`. The remaining objects are remapped from REST snake_case to the
# camelCase shape downstream jq expects ({number, createdAt, closedAt, labels}).
# `labels` is already [{name,...}] in REST, so it passes through unchanged; a null
# closedAt on open issues is harmless. Results are sorted created-descending so a
# downstream `.[0]` is the most-recently-created issue.
#
# On gh failure: errors to stderr and returns 1 (clear-errors convention, no
# fallback).
gh_issue_list_rest() {
  local state="" repo="" label="" limit=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --state) state="$2"; shift 2 ;;
      --repo)  repo="$2";  shift 2 ;;
      --label) label="$2"; shift 2 ;;
      --limit) limit="$2"; shift 2 ;;
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

  local per_page="100"
  [[ -n "$limit" ]] && per_page="$limit"
  local query="state=$state&per_page=$per_page&sort=created&direction=desc"
  if [[ -n "$label" ]]; then
    # Minimal URL-encode: space → %20 (colon is query-safe).
    local enc_label="${label// /%20}"
    query="$query&labels=$enc_label"
  fi

  local raw
  if [[ -n "$limit" ]]; then
    # Single page (no --paginate) — caller wants at most one page of per_page.
    raw=$(gh_retry gh api "$path?$query") || {
      echo "error: gh_issue_list_rest: gh api failed for $path?$query" >&2
      return 1
    }
  else
    # Full set — REST --paginate has no silent-truncation hazard.
    raw=$(gh_retry gh api --paginate "$path?$query") || {
      echo "error: gh_issue_list_rest: gh api failed for $path?$query" >&2
      return 1
    }
  fi

  printf '%s' "$raw" | jq -s 'add // [] | map(select(.pull_request == null)) | map({number, createdAt: .created_at, closedAt: .closed_at, labels})'
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
        # Check run: pending if status != COMPLETED
        .status != "COMPLETED"
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
# Memoisation: when DISPATCH_CI_VERDICT_CACHE names a non-empty directory, the
# verdict is cached per-SHA at $DISPATCH_CI_VERDICT_CACHE/<sha> — a cache hit
# returns the stored verdict and makes no REST call; a miss fetches, writes the
# verdict, then prints it. The caller owns the directory's lifecycle (this
# helper does not mkdir it). When the var is unset/empty, every call fetches.
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
  # array; `add` over an empty slurp is null, so coerce to `[]`. Then adapt each
  # entry to the statusCheckRollup CheckRun shape and uppercase it.
  local adapted
  adapted=$(gh_retry gh api --paginate "repos/{owner}/{repo}/commits/$sha/check-runs" \
    | jq -s 'map(.check_runs) | add // []
             | map({status: (.status | ascii_upcase),
                    conclusion: ((.conclusion // "") | ascii_upcase)})') || {
    echo "error: dispatch_ci_verdict_rest: check-runs fetch failed for $sha" >&2
    return 1
  }

  local verdict
  verdict=$(dispatch_classify_rollup "$adapted")

  # Memoisation miss: persist the verdict for subsequent ticks before printing.
  if [[ -n "$cache_file" ]]; then
    printf '%s\n' "$verdict" > "$cache_file"
  fi

  printf '%s\n' "$verdict"
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
    if timeout --kill-after=30 "$timeout_s" npx playwright install --with-deps chromium; then
      return 0
    fi
    echo "playwright_install_with_deps: attempt $attempt/$attempts failed or timed out after ${timeout_s}s" >&2
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
resolve_project_root() {
  local common_dir
  common_dir="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" || return 1
  dirname "$common_dir"
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

  # Build reverse dependency map: shared package -> consuming apps
  declare -A shared_pkgs
  local app pkg dep_list dep_dir
  for app in "${!all_apps[@]}"; do
    pkg="$repo_root/$app/package.json"
    if ! dep_list=$(jq -r '(.dependencies // {}) + (.devDependencies // {}) + (.peerDependencies // {}) | keys[] | select(startswith("@commons-systems/")) | sub("@commons-systems/"; "")' "$pkg"); then
      echo "ERROR: failed to read dependencies from $pkg" >&2
      return 1
    fi
    while IFS= read -r dep_dir; do
      [ -z "$dep_dir" ] && continue
      shared_pkgs["$dep_dir"]+="$app "
    done <<< "$dep_list"
  done

  declare -A dirty_apps
  local file

  while IFS= read -r file; do
    [ -z "$file" ] && continue
    case "$file" in
      firebase.json|firestore.rules|storage.rules|package.json|package-lock.json)
        # Root-level config changes affect all workspaces
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
  # Resolve to absolute path; worktrees live as siblings of the git common dir
  worktree_root="$(cd "$git_common_dir/.." && pwd)/worktrees"

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

# Install and activate the durable `dispatch-claude-daemon.service` unit that
# hosts Claude Code's per-user bg supervisor daemon in a stable, non-transient
# cgroup (#1197). Without it, the daemon is spawned on demand by the first
# `claude` call inside a transient tick/reseed unit and is born in that unit's
# ephemeral cgroup — so a finishing tick reaps the whole fleet (#1196). With a
# durable service already holding the daemon lock (~/.claude/daemon.lock), every
# tick/reseed/worker `claude` call attaches to the running daemon instead of
# spawning its own, and the fleet lives permanently in this service's cgroup
# regardless of any tick's KillMode.
#
# This supersedes the #1196 KillMode=process stop-gap as the load-bearing
# mechanism; KillMode=process is kept as the degraded-path fallback for hosts
# where systemd --user is unavailable and this service cannot be installed.
#
# Best-effort: a failure here must not abort the caller (a tick/reseed
# launcher), so we warn to stderr and return non-zero — never `exit`. A missing
# durable service just means the on-demand daemon falls back to #1196 behavior.
# Takes no arguments: `claude daemon run` chdirs to $HOME itself, so the unit
# sets no WorkingDirectory= and needs no worktree path (this also sidesteps the
# WorkingDirectory quoting hazard of #1203/#1207).
ensure_daemon_service() {
  # Resolve the claude binary to bake an absolute ExecStart into the unit. The
  # systemd user manager's minimal default PATH omits the nix store, so the unit
  # cannot rely on PATH resolution at fire time; an absolute path makes it
  # self-sufficient. An explicit override is authoritative (tests rely on it).
  local CLAUDE_CMD="${DISPATCH_DAEMON_CLAUDE_CMD:-$(command -v claude || true)}"
  if [[ -z "$CLAUDE_CMD" ]]; then
    echo "WARNING: ensure_daemon_service: claude binary not found on PATH; durable daemon service unavailable" >&2
    return 1
  fi

  # A systemd unit file is line-structured: each line is an independent
  # directive. An embedded newline in CLAUDE_CMD would land as an
  # attacker-controlled extra directive in the [Service] section. The resolved
  # binary path never legitimately contains a newline; reject it rather than
  # emit a malformed unit (best-effort: warn + return — never exit).
  if [[ "$CLAUDE_CMD" == *$'\n'* ]]; then
    echo "WARNING: ensure_daemon_service: claude path contains a newline; refusing to write unit; durable daemon service unavailable" >&2
    return 1
  fi

  # ExecStart= is double-quoted ("$CLAUDE_CMD" daemon run); an embedded
  # double-quote in the path would prematurely close that quoted token, making
  # systemd parse the executable and arguments wrong (bad-setting) and
  # permanently break the unit. The resolved binary path never legitimately
  # contains a double-quote; reject it rather than emit a malformed unit.
  if [[ "$CLAUDE_CMD" == *'"'* ]]; then
    echo "WARNING: ensure_daemon_service: claude path contains a double-quote; refusing to write unit; durable daemon service unavailable" >&2
    return 1
  fi
  # ExecStart= is double-quoted and systemd C-unescapes it, so a backslash in
  # the path would be misread as an escape sequence and corrupt the executable
  # token. The resolved binary path never legitimately contains a backslash;
  # reject it (#1212).
  if [[ "$CLAUDE_CMD" == *'\'* ]]; then
    echo "WARNING: ensure_daemon_service: claude path contains a backslash; refusing to write unit; durable daemon service unavailable" >&2
    return 1
  fi

  # Sanitize PATH for the Environment= line (see strip_unit_env_path).
  local safe_path
  safe_path=$(strip_unit_env_path "$PATH")

  local UNIT_DIR="${DISPATCH_DAEMON_UNIT_DIR:-${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user}"
  local UNIT_PATH="$UNIT_DIR/dispatch-claude-daemon.service"
  local SYSTEMCTL_CMD="${DISPATCH_DAEMON_SYSTEMCTL_CMD:-systemctl}"

  # Desired unit content, mirroring Claude Code's own (now-disabled) service
  # template. Environment=PATH= captures the launching caller's full nix-store
  # PATH at write time, for the same reason the recover unit does — so the
  # daemon (and the workers it later hosts) can resolve git/jq/claude.
  #
  # ExecStart= and Environment= are double-quoted: systemd unescapes C-style
  # quotes for these two directives, so a path containing spaces is parsed as a
  # single token rather than split into an executable + spurious arguments.
  #
  # No --origin flag: `claude daemon run` defaults its origin to `foreground`,
  # a long-lived foreground supervisor with no self-uninstall logic. We
  # deliberately avoid `--origin service`, which carries the binary's
  # self-uninstall-on-binary-takeover path — the exact fragility #1197 removes.
  # WE own the lifecycle via systemd Restart=always.
  #
  # StartLimitIntervalSec/StartLimitBurst mirror Claude's own template and
  # tolerate a brief restart burst during a migration window where a
  # pre-existing transient daemon still holds the lock. No StandardOutput= — the
  # daemon self-logs to ~/.claude/daemon.log.
  local desired
  desired=$(cat <<EOF
[Unit]
Description=Dispatch durable Claude background supervisor daemon
After=network-online.target
StartLimitIntervalSec=60
StartLimitBurst=10

[Service]
Type=simple
Environment="PATH=$safe_path"
ExecStart="$CLAUDE_CMD" daemon run
Restart=always
RestartSec=1

[Install]
WantedBy=default.target
EOF
)

  # Steady-state hot path — the attach-to-existing-daemon path: if the installed
  # unit already matches byte-for-byte AND the service is active, do nothing.
  # The durable daemon is already running, so the next tick's `claude` call
  # attaches to it via the lock and we skip the write/reload/enable entirely.
  # (Unlike the OnFailure-only recover unit, this service must actually be
  # RUNNING, so we add an is-active check to the content compare.)
  if [ -f "$UNIT_PATH" ] && [ "$(cat "$UNIT_PATH")" = "$desired" ] \
     && "$SYSTEMCTL_CMD" --user is-active --quiet dispatch-claude-daemon.service; then
    return 0
  fi

  if ! mkdir -p "$UNIT_DIR"; then
    echo "WARNING: ensure_daemon_service: mkdir -p $UNIT_DIR failed; durable daemon service unavailable" >&2
    return 1
  fi

  # Write atomically only when the content differs: temp file in the same dir,
  # then mv into place.
  if [ ! -f "$UNIT_PATH" ] || [ "$(cat "$UNIT_PATH")" != "$desired" ]; then
    local tmp
    tmp=$(mktemp "$UNIT_DIR/.dispatch-claude-daemon.service.XXXXXX") || {
      echo "WARNING: ensure_daemon_service: could not create temp file in $UNIT_DIR; durable daemon service unavailable" >&2
      return 1
    }
    if ! printf '%s\n' "$desired" > "$tmp"; then
      echo "WARNING: ensure_daemon_service: failed to write $tmp; durable daemon service unavailable" >&2
      rm -f "$tmp"
      return 1
    fi
    if ! mv "$tmp" "$UNIT_PATH"; then
      echo "WARNING: ensure_daemon_service: failed to install $UNIT_PATH; durable daemon service unavailable" >&2
      rm -f "$tmp"
      return 1
    fi
  fi

  # daemon-reload unconditionally on this slow path. The hot path above already
  # returned early when the unit matched byte-for-byte AND the service was
  # active; reaching here means the unit was just written OR it exists on disk
  # but the service is not active. A daemon-reload that failed on a prior call
  # (after the mv succeeded) leaves the unit on disk but unknown to systemd, so
  # the content compare skips the write block on every later call — running the
  # reload outside that block ensures it is retried until systemd has loaded the
  # unit, instead of falling straight through to a doomed `enable --now`.
  if ! "$SYSTEMCTL_CMD" --user daemon-reload; then
    echo "WARNING: ensure_daemon_service: systemctl --user daemon-reload failed; durable daemon service unavailable" >&2
    return 1
  fi

  # Install + activate idempotently: enable symlinks the unit under
  # WantedBy=default.target (so it auto-starts on every user-session start) and
  # --now starts it without restarting an already-running instance.
  if ! "$SYSTEMCTL_CMD" --user enable --now dispatch-claude-daemon.service; then
    echo "WARNING: ensure_daemon_service: systemctl --user enable --now dispatch-claude-daemon.service failed; durable daemon service unavailable" >&2
    return 1
  fi
}


# Install and activate the durable `dispatch-sweep-periodic.timer` (+ its paired
# `dispatch-sweep-periodic.service`) so the worktree garbage-collector fires on a
# wall-clock cadence instead of only from a finishing worker's Stop hook (#2023).
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


# Install and activate the durable always-on heartbeat: a `systemd --user`
# `dispatch-heartbeat.timer` firing `dispatch-heartbeat.service` (a no-arg
# `dispatch-tick`) on a flat drumbeat — `OnBootSec=2min`,
# `OnUnitActiveSec=15min`, `Persistent=true`. This gives the autonomous chain a
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

  # Desired timer unit: a flat drumbeat. OnBootSec=2min gives a fast post-boot
  # tick; OnUnitActiveSec=15min sets the steady-state cadence; Persistent=true
  # makes a missed firing (host asleep/off at the scheduled time) run on the
  # next wake instead of being skipped.
  local desired_timer
  desired_timer=$(cat <<EOF
[Unit]
Description=Dispatch chain periodic heartbeat timer (#2022)

[Timer]
OnBootSec=2min
OnUnitActiveSec=15min
Persistent=true

[Install]
WantedBy=timers.target
EOF
)

  # Steady-state hot path: if both installed units already match byte-for-byte
  # AND the timer is active, do nothing — skip the writes, daemon-reload, and
  # enable entirely. (Like the daemon service, the timer must actually be
  # RUNNING, so the content compare carries an is-active check.)
  if [ -f "$SERVICE_PATH" ] && [ "$(cat "$SERVICE_PATH")" = "$desired_service" ] \
     && [ -f "$TIMER_PATH" ] && [ "$(cat "$TIMER_PATH")" = "$desired_timer" ] \
     && "$SYSTEMCTL_CMD" --user is-active --quiet dispatch-heartbeat.timer; then
    return 0
  fi

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

  # Install + activate idempotently: enable symlinks the timer under
  # WantedBy=timers.target (so it auto-starts on every user-session start) and
  # --now starts it without restarting an already-running instance.
  if ! "$SYSTEMCTL_CMD" --user enable --now dispatch-heartbeat.timer; then
    echo "WARNING: ensure_heartbeat_units: systemctl --user enable --now dispatch-heartbeat.timer failed; periodic heartbeat unavailable" >&2
    return 1
  fi
}
