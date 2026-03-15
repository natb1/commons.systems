#!/usr/bin/env bash
# Shared functions for PR workflow scripts

export FIREBASE_PROJECT_ID="commons-systems"

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

  USES_FIRESTORE=false
  if grep -rq '"firebase/firestore"' "$app_src_dir" 2>/dev/null; then
    USES_FIRESTORE=true
  fi

  USES_AUTH=false
  if grep -rq '"firebase/auth"' "$app_src_dir" 2>/dev/null; then
    USES_AUTH=true
  fi

  USES_STORAGE=false
  if grep -rq '"firebase/storage"' "$app_src_dir" 2>/dev/null; then
    USES_STORAGE=true
  fi

  # Detect Cloud Functions by checking for /api/ rewrites in firebase.json
  USES_FUNCTIONS=false
  if [ -d "$repo_root/functions" ] && jq -e '.hosting[] | select(.target == "'"$app_name"'") | .rewrites[]? | select(.source | startswith("/api/"))' "$repo_root/firebase.json" >/dev/null 2>&1; then
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

# Kill a process and all its descendants.
# Args: $1 = PID to kill
kill_tree() {
  local pid="${1:?kill_tree requires a PID argument}"
  local children
  children=$(pgrep -P "$pid" 2>/dev/null) || true
  for child in $children; do
    kill_tree "$child"
  done
  kill "$pid" 2>/dev/null || true
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
# (PID recycling could theoretically cause a false positive but is negligible in practice.)
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

# Write a PID file recording child processes for orphan cleanup.
# The file is scoped to the current worktree via get_emulator_project_id().
# Args: pairs of pid:command_name (e.g., "12345:node" "12346:java")
#   command_name must match `ps -o comm=` output for that PID (used to guard PID recycling)
write_pid_file() {
  local tmpdir
  tmpdir="$(get_tmpdir)"
  local project_id
  project_id="$(get_emulator_project_id)"
  local worktree_path
  worktree_path="$(git rev-parse --show-toplevel)"

  local pid_file="${tmpdir}/pids-${project_id}.json"
  local jq_args=(--argjson hub_pid "$$" --arg worktree_path "$worktree_path")
  local jq_filter='{hub_pid: $hub_pid, worktree_path: $worktree_path, processes: ['
  local i=0
  for entry in "$@"; do
    local pid="${entry%%:*}"
    local cmd="${entry#*:}"
    jq_args+=(--argjson "pid$i" "$pid" --arg "cmd$i" "$cmd")
    [ $i -gt 0 ] && jq_filter+=","
    jq_filter+="{\"pid\": \$pid${i}, \"cmd\": \$cmd${i}}"
    i=$((i + 1))
  done
  jq_filter+=']}'
  jq -n "${jq_args[@]}" "$jq_filter" > "$pid_file"
}

# Remove the PID file for the current worktree.
# Called during normal trap cleanup.
remove_pid_file() {
  local tmpdir
  tmpdir="$(get_tmpdir)"
  local project_id
  project_id="$(get_emulator_project_id)"
  rm -f "${tmpdir}/pids-${project_id}.json"
}

# Scan all PID files for the project and clean up orphaned processes.
# Orphans arise from two cases:
#   1. The owning worktree directory was deleted
#   2. The parent script PID is dead but child processes survived
# Skips PID files whose parent script is still alive (active server in another worktree).
cleanup_all_stale_processes() {
  local tmpdir
  tmpdir="$(get_tmpdir)"

  # Use base FIREBASE_PROJECT_ID (not worktree-scoped) to scan PID files from all worktrees
  local pid_file
  for pid_file in "${tmpdir}"/pids-${FIREBASE_PROJECT_ID}.json "${tmpdir}"/pids-${FIREBASE_PROJECT_ID}-wt-*.json; do
    [ -f "$pid_file" ] || continue
    local worktree_path hub_pid
    local header
    header=$(jq -r '[.worktree_path // "", .hub_pid // ""] | join("\t")' "$pid_file" 2>/dev/null) || {
      echo "WARNING: failed to parse PID file $pid_file, skipping" >&2
      continue
    }
    worktree_path="${header%%	*}"
    hub_pid="${header#*	}"

    local is_orphan=false
    if [ -n "$worktree_path" ] && [ ! -d "$worktree_path" ]; then
      echo "Orphan detected: worktree deleted ($worktree_path)"
      is_orphan=true
    elif [ -n "$hub_pid" ] && ! kill -0 "$hub_pid" 2>/dev/null; then
      echo "Orphan detected: hub PID $hub_pid is dead"
      is_orphan=true
    fi

    if [ "$is_orphan" = true ]; then
      # Extract all pid:cmd pairs in one jq call (tab-separated, newline-delimited)
      local proc_entries
      proc_entries=$(jq -r '.processes[] | [.pid, .cmd] | join("\t")' "$pid_file" 2>/dev/null) || {
        echo "WARNING: failed to extract processes from $pid_file, orphaned processes may need manual cleanup" >&2
        proc_entries=""
      }

      local line
      while IFS= read -r line; do
        [ -z "$line" ] && continue
        local proc_pid proc_cmd actual_cmd
        proc_pid="${line%%	*}"
        proc_cmd="${line#*	}"

        # Verify command name matches before killing (guards PID recycling)
        actual_cmd=$(ps -p "$proc_pid" -o comm= 2>/dev/null) || actual_cmd=""
        if [ -n "$actual_cmd" ] && [ "$actual_cmd" = "$proc_cmd" ]; then
          echo "Killing orphaned process: PID $proc_pid ($proc_cmd)"
          kill_tree "$proc_pid"
        elif [ -n "$actual_cmd" ]; then
          echo "Skipping PID $proc_pid: expected $proc_cmd but found $actual_cmd (PID recycled)"
        fi
      done <<< "$proc_entries"

      rm -f "$pid_file"

      local project_id
      project_id="${pid_file##*/pids-}"
      project_id="${project_id%.json}"
      local hub_file="${tmpdir}/hub-${project_id}.json"
      if [ -f "$hub_file" ]; then
        echo "Removing stale hub file: $hub_file"
        rm -f "$hub_file"
      fi
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
