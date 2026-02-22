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

# Find an available TCP port by binding to port 0 and reading the assigned port.
find_available_port() {
  node -e "
    const s = require('net').createServer();
    s.listen(0, () => { console.log(s.address().port); s.close(); });
  "
}
