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

  # Detect Auth: direct firebase SDK import or authutil wrapper packages
  USES_AUTH=false
  if grep -rq -e '"firebase/auth"' -e 'authutil/app-auth' -e 'authutil/firebase-auth' "$app_src_dir" 2>/dev/null; then
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

# Resolve which apps are affected by a set of changed files.
# Reads changed file paths from stdin, one per line.
# Outputs dirty app names to stdout, one per line (unsorted).
# Args: $1 = repo root
resolve_dirty_apps() {
  local repo_root="${1:?resolve_dirty_apps requires a repo root argument}"

  # Discover all workspaces from root package.json
  declare -A all_apps
  local workspace_list
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
  local file top_dir

  while IFS= read -r file; do
    [ -z "$file" ] && continue
    top_dir="${file%%/*}"
    case "$file" in
      firebase.json|firestore.rules|storage.rules|package.json|package-lock.json)
        # Root-level config changes affect all workspaces
        for app in "${!all_apps[@]}"; do
          dirty_apps["$app"]=1
        done
        ;;
      *)
        # Check if this is a shared package change
        if [ -n "${shared_pkgs[$top_dir]+x}" ]; then
          for app in ${shared_pkgs[$top_dir]}; do
            dirty_apps["$app"]=1
          done
        fi
        # Check if this is a direct app change
        if [ -n "${all_apps[$top_dir]+x}" ]; then
          dirty_apps["$top_dir"]=1
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

  local RECOVER_SCRIPT="$main_worktree/.claude/skills/dispatch-propagate/scripts/dispatch-tick-recover"
  local UNIT_DIR="${DISPATCH_RECOVER_UNIT_DIR:-${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user}"
  local UNIT_PATH="$UNIT_DIR/dispatch-tick-recover.service"
  local SYSTEMCTL_CMD="${DISPATCH_RECOVER_SYSTEMCTL_CMD:-systemctl}"

  # Strip any stray newline OR double-quote from the captured PATH for the same
  # line-structure reason; a newline in PATH is a broken environment, and a
  # double-quote would prematurely terminate the double-quoted Environment=
  # value, leaving an attacker-controlled bare token as a stray [Service]
  # directive. Neither is ever a valid character in a PATH component, so
  # dropping them is safe (#1207).
  local safe_path="${PATH//[$'\n'\"]/}"

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
  # so it takes the bare path (safe here: the worktree path has no spaces).
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

  # Strip any stray newline OR double-quote from the captured PATH for the same
  # line-structure reason; a newline in PATH is a broken environment, and a
  # double-quote would prematurely terminate the double-quoted Environment=
  # value, leaving an attacker-controlled bare token as a stray [Service]
  # directive. Neither is ever a valid character in a PATH component, so
  # dropping them is safe (#1207).
  local safe_path="${PATH//[$'\n'\"]/}"

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
