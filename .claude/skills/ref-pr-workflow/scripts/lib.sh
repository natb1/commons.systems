#!/usr/bin/env bash
# Shared functions for PR workflow scripts

export FIREBASE_PROJECT_ID="commons-systems"

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
  raw=$(gh api "$path" 2>"$stderr_file") || {
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
    (cd "$REPO_ROOT" && npm ci)
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
  local children
  children=$(pgrep -P "$pid" 2>/dev/null) || true
  for child in $children; do
    _collect_tree_pids "$child"
  done
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
  for p in $pids; do
    kill "$p" 2>/dev/null || true
  done

  # Grace period, then SIGKILL survivors
  sleep 2
  for p in $pids; do
    if kill -0 "$p" 2>/dev/null; then
      kill -9 "$p" 2>/dev/null || true
    fi
  done
}

# Print the hosting site ID for an app from .firebaserc deploy targets.
# Returns code 1 (with stderr message) if no hosting target is found.
# Args: $1 = repo root, $2 = app name (e.g. "hello")
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

# Kill all processes whose command-line args contain the given worktree path.
# Uses fixed-string substring matching on process args.
# Excludes the current process and its ancestors to avoid self-termination.
# Args: $1 = absolute worktree path (e.g., output of `git rev-parse --show-toplevel`)
kill_worktree_processes() {
  local wt_path="${1:?kill_worktree_processes requires a worktree path}"

  local ps_output pids
  ps_output=$(ps -axo pid=,args= 2>/dev/null) || true
  pids=$(printf '%s\n' "$ps_output" | grep -F "$wt_path/" | awk '{print $1}') || true
  [ -z "$pids" ] && return 0

  local exclude_pids
  exclude_pids=$(_ancestor_pids)

  local pid
  for pid in $pids; do
    if [[ "$exclude_pids" == *" $pid "* ]]; then
      continue
    fi
    kill -0 "$pid" 2>/dev/null || continue
    echo "Killing worktree process: PID $pid"
    kill_tree "$pid"
  done
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

  # Build set of active worktree paths
  local active_paths=""
  local line
  while IFS= read -r line; do
    case "$line" in
      worktree\ *)
        active_paths+="${line#worktree } "
        ;;
    esac
  done < <(git worktree list --porcelain 2>/dev/null)

  if [ -z "$active_paths" ]; then
    echo "WARNING: git worktree list returned no entries; skipping stale cleanup" >&2
    return 0
  fi

  # Find PIDs with this repo's worktree root in their command args
  local pids
  pids=$(pgrep -f "$worktree_root/" 2>/dev/null) || true
  [ -z "$pids" ] && return 0

  local exclude_pids
  exclude_pids=$(_ancestor_pids)

  local pid
  for pid in $pids; do
    [[ "$exclude_pids" == *" $pid "* ]] && continue

    # Extract the worktree path from this process's command line
    local cmdline
    cmdline=$(ps -o args= -p "$pid" 2>/dev/null) || continue

    local wt_path
    wt_path=$(printf '%s' "$cmdline" | grep -oE '/[^ ]*worktrees/[^/ ]+' | head -1) || continue
    [ -z "$wt_path" ] && continue

    # Kill only if this worktree path is not in the active set
    if [[ "$active_paths" != *"$wt_path "* ]]; then
      kill -0 "$pid" 2>/dev/null || continue
      echo "Stale worktree process: PID $pid (worktree: $wt_path)"
      kill_tree "$pid"
    fi
  done
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
