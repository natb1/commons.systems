#!/usr/bin/env bash
# Shared functions for PR workflow scripts

export FIREBASE_PROJECT_ID="commons-systems"

# Detect what Firebase features the app uses.
# Sets global variables: USES_FIRESTORE, USES_AUTH
# Args: $1 = path to app package.json, $2 = path to app src/ directory
detect_features() {
  local app_pkg="$1"
  local app_src_dir="$2"

  USES_FIRESTORE=false
  if grep -q '"firebase"' "$app_pkg" 2>/dev/null; then
    USES_FIRESTORE=true
  fi

  USES_AUTH=false
  if grep -rq '"firebase/auth"' "$app_src_dir" 2>/dev/null; then
    USES_AUTH=true
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
}

# Extract the app name from the app directory path.
# Args: $1 = app directory (e.g. "hello" or "/path/to/hello")
get_app_name() {
  basename "$1"
}

# Read the hosting site ID for an app from .firebaserc deploy targets.
# Returns code 1 if no hosting target is found.
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
  printf '%s-%s' "$1" "$2"
}

# Delete a Firebase Hosting preview channel.
# Silently succeeds if the channel does not exist.
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

# Find an available TCP port by binding to port 0 and reading the assigned port.
find_available_port() {
  node -e "
    const s = require('net').createServer();
    s.listen(0, () => { console.log(s.address().port); s.close(); });
  "
}
