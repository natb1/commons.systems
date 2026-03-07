#!/usr/bin/env bash
# Shared functions for PR workflow scripts

export FIREBASE_PROJECT_ID="commons-systems"

# Detect what Firebase features the app uses by searching source imports.
# Sets global variables: USES_FIRESTORE, USES_AUTH
# Args: $1 = path to app src/ directory
detect_features() {
  local app_src_dir="$1"

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
}

# Install local package dependencies (file: references).
# Args: $1 = repo root, $2 = path to app package.json
install_local_deps() {
  local repo_root="$1"
  local app_pkg="$2"

  if grep -q '"@commons-systems/firebaseutil"' "$app_pkg" 2>/dev/null; then
    echo "Installing firebaseutil dependency..."
    (cd "$repo_root/firebaseutil" && npm ci)
  fi

  if grep -q '"@commons-systems/firestoreutil"' "$app_pkg" 2>/dev/null; then
    echo "Installing firestoreutil dependency..."
    (cd "$repo_root/firestoreutil" && npm ci)
  fi

  if grep -q '"@commons-systems/authutil"' "$app_pkg" 2>/dev/null || [ "${USES_AUTH:-false}" = true ]; then
    echo "Installing authutil dependency..."
    (cd "$repo_root/authutil" && npm ci)
  fi

  if grep -q '"@commons-systems/htmlutil"' "$app_pkg" 2>/dev/null; then
    echo "Installing htmlutil dependency..."
    (cd "$repo_root/htmlutil" && npm ci)
  fi

  if grep -q '"@commons-systems/style"' "$app_pkg" 2>/dev/null; then
    echo "Installing style dependency..."
    (cd "$repo_root/style" && npm ci)
  fi
}

# Extract the app name from the app directory path.
# Args: $1 = app directory (e.g. "hello" or "/path/to/hello")
get_app_name() {
  basename "$1"
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
# Safe for concurrent worktrees: only removes if the owning PID has exited.
# (PID recycling could theoretically cause a false positive but is negligible in practice.)
cleanup_stale_hub() {
  local hub_file="/tmp/hub-${FIREBASE_PROJECT_ID}.json"
  if [ -f "$hub_file" ]; then
    local hub_pid
    hub_pid=$(jq -r '.pid // empty' "$hub_file" 2>/dev/null) || true
    if [ -n "$hub_pid" ] && ! kill -0 "$hub_pid" 2>/dev/null; then
      echo "Removing stale emulator hub file (PID $hub_pid is dead)"
      rm -f "$hub_file"
    fi
  fi
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
    });
  "
}

# Find a single available TCP port (convenience wrapper).
find_available_port() {
  find_available_ports 1
}
