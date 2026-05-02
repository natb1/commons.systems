# shellcheck shell=bash
# Shared upload-media core library — sourced, not executed.
#
# Per-app upload scripts (audio, print) source this file and call the core::*
# functions to perform GCS upload + Firestore document creation. The library
# has no executable bit and no shebang; it expects to be sourced from a bash
# script that already enabled `set -euo pipefail`.
#
# GCS metadata header casing: lowercase (publicdomain, groupid, member_<i>).
# The deployed `storage.rules` reads lowercase keys, and both
# audio/seeds/storage.ts and print/seeds/storage.ts emit lowercase. The
# camelCase variant in print's prior local upload script was a divergence bug
# that left uploads failing the public-read rule check.
#
# Cleanup: register every temp file via core::register_temp_file. Registrations
# are appended to a file-backed registry ($CORE_CLEANUP_REGISTRY) created at
# source-time, so registrations survive subshell boundaries — core functions
# called via $(...) command substitution still register paths the parent's
# EXIT trap will see. The EXIT trap is installed once at source-time and
# removes every registered file plus the registry. Wrappers must NOT install
# their own EXIT traps — doing so overwrites the library's trap and leaks
# temp files.

set -euo pipefail

CORE_CLEANUP_REGISTRY="$(mktemp)"

core::register_temp_file() {
  local path="$1"
  printf '%s\n' "$path" >> "$CORE_CLEANUP_REGISTRY"
}

core::cleanup_temp_files() {
  # Runs in EXIT trap; must not corrupt exit status. Use `|| true` only on
  # reads that may legitimately race with concurrent removal.
  if [ -n "${CORE_CLEANUP_REGISTRY:-}" ] && [ -s "$CORE_CLEANUP_REGISTRY" ]; then
    local path
    while IFS= read -r path || [ -n "$path" ]; do
      [ -n "$path" ] && rm -f "$path"
    done < "$CORE_CLEANUP_REGISTRY"
  fi
  if [ -n "${CORE_CLEANUP_REGISTRY:-}" ] && [ -e "$CORE_CLEANUP_REGISTRY" ]; then
    rm -f "$CORE_CLEANUP_REGISTRY"
  fi
}

trap core::cleanup_temp_files EXIT

core::require_tools() {
  local missing=()
  local tool
  for tool in "$@"; do
    if ! command -v "$tool" >/dev/null 2>&1; then
      missing+=("$tool")
    fi
  done
  if [ "${#missing[@]}" -gt 0 ]; then
    echo "error: required command(s) not found: ${missing[*]}" >&2
    exit 1
  fi
}

core::get_auth_token() {
  local token
  if ! token="$(gcloud auth print-access-token 2>/dev/null)" || [ -z "$token" ]; then
    echo "error: failed to get auth token. Run 'gcloud auth login' first." >&2
    exit 1
  fi
  printf '%s\n' "$token"
}

core::lookup_group_members() {
  local project="$1"
  local groups_path="$2"
  local group_id="$3"
  local token="$4"

  local url="https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/${groups_path}/${group_id}"
  local resp_file
  resp_file="$(mktemp)"
  core::register_temp_file "$resp_file"

  local http_code
  http_code="$(curl -sS -o "$resp_file" -w '%{http_code}' "$url" \
    --config <(echo "header = \"Authorization: Bearer ${token}\""))"

  if [ "$http_code" -lt 200 ] || [ "$http_code" -ge 300 ]; then
    echo "error: group '${group_id}' not found (HTTP ${http_code})" >&2
    exit 1
  fi

  local member_list
  member_list="$(jq -r '.fields.members.arrayValue.values[]?.stringValue // empty' "$resp_file")"
  if [ -z "$member_list" ]; then
    echo "error: group '${group_id}' has no members" >&2
    exit 1
  fi

  printf '%s\n' "$member_list"
}

core::check_gcs_no_collision() {
  local gcs_dest="$1"
  local stat_output
  local stat_status=0
  stat_output="$(gsutil stat "$gcs_dest" 2>&1)" || stat_status=$?

  if [ "$stat_status" -eq 0 ]; then
    echo "error: object already exists at ${gcs_dest}" >&2
    echo "Rename the file or remove the existing object: gsutil rm ${gcs_dest}" >&2
    exit 1
  fi

  if ! printf '%s' "$stat_output" | grep -q "No URLs matched"; then
    echo "error: could not verify object status at ${gcs_dest}:" >&2
    printf '%s\n' "$stat_output" >&2
    exit 1
  fi
}

core::upload_to_gcs() {
  local gcs_dest="$1"
  local file_path="$2"
  local public="$3"
  local group_id="$4"
  # shellcheck disable=SC2178  # name-ref to a caller's array, not a scalar
  local -n emails_ref="$5"

  local -a META_ARGS=()
  META_ARGS+=(-h "x-goog-meta-publicdomain:${public}")

  if [ -n "$group_id" ]; then
    META_ARGS+=(-h "x-goog-meta-groupid:${group_id}")
    local i
    for i in "${!emails_ref[@]}"; do
      META_ARGS+=(-h "x-goog-meta-member_${i}:${emails_ref[$i]}")
    done
  fi

  if ! gsutil "${META_ARGS[@]}" cp "$file_path" "$gcs_dest"; then
    echo "error: gsutil cp failed for ${file_path} -> ${gcs_dest}" >&2
    exit 1
  fi
}

core::create_firestore_doc() {
  local project="$1"
  local collection_path="$2"
  local token="$3"
  local body_json="$4"
  local gcs_dest="$5"

  local url="https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/${collection_path}"
  local resp_file
  resp_file="$(mktemp)"
  core::register_temp_file "$resp_file"

  local http_code
  http_code="$(curl -sS -o "$resp_file" -w '%{http_code}' -X POST "$url" \
    --config <(echo "header = \"Authorization: Bearer ${token}\"") \
    -H "Content-Type: application/json" \
    -d "$body_json")"

  if [ "$http_code" -lt 200 ] || [ "$http_code" -ge 300 ]; then
    echo "error: Firestore API returned HTTP ${http_code}:" >&2
    cat "$resp_file" >&2
    echo "" >&2
    echo "The file was uploaded to GCS at: ${gcs_dest}" >&2
    echo "To clean up: gsutil rm ${gcs_dest}" >&2
    exit 1
  fi

  cat "$resp_file"
}

core::extract_doc_id() {
  local response_body="$1"
  local doc_id
  doc_id="$(printf '%s' "$response_body" | jq -r '.name | split("/") | last')"
  if [ -z "$doc_id" ] || [ "$doc_id" = "null" ]; then
    echo "error: unexpected Firestore response — could not extract document ID" >&2
    echo "Raw response: $response_body" >&2
    exit 1
  fi
  printf '%s\n' "$doc_id"
}
