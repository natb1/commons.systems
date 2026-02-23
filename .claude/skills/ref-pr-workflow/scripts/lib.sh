#!/usr/bin/env bash
# Shared functions for PR workflow scripts

FIREBASE_PROJECT_ID="commons-systems"

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
# Exits with code 1 if no hosting target is found.
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
  site=$(RC_PATH="$rc_path" PROJECT_ID="$FIREBASE_PROJECT_ID" APP_NAME="$app_name" node -e "
    const rc = JSON.parse(require('fs').readFileSync(process.env.RC_PATH, 'utf8'));
    const projectId = process.env.PROJECT_ID;
    const appName = process.env.APP_NAME;
    const sites = rc.targets?.[projectId]?.hosting?.[appName];
    if (!sites || !sites[0]) {
      process.stderr.write('ERROR: no hosting target \"' + appName + '\" found for project \"' + projectId + '\" in .firebaserc\n');
      process.exit(1);
    }
    console.log(sites[0]);
  " 2>&1) || {
    echo "$site" >&2
    return 1
  }

  echo "$site"
}

# Build the Firestore namespace for an app and environment.
# Args: $1 = app name, $2 = environment suffix (e.g. "prod", "qa", "preview-pr-5")
get_firestore_namespace() {
  echo "${1}-${2}"
}

# Find an available TCP port by binding to port 0 and reading the assigned port.
find_available_port() {
  node -e "
    const s = require('net').createServer();
    s.listen(0, () => { console.log(s.address().port); s.close(); });
  "
}
