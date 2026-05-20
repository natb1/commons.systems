#!/usr/bin/env bash
# Test suite for upload-media.sh
# Usage: bash print/scripts/test-upload-media.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
UPLOAD_SCRIPT="$SCRIPT_DIR/upload-media.sh"

PASS=0
FAIL=0
TOTAL=0
SAVED_PATH=""
TMPDIR_TEST=""

setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/bin" "$TMPDIR_TEST/stub"

  # Create a test file to upload
  echo "test content" > "$TMPDIR_TEST/stub/test-file.cbz"

  # gsutil stub: logs invocations and captures -h headers
  cat > "$TMPDIR_TEST/bin/gsutil" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
echo "$@" >> "$STUB_DIR/gsutil.log"

# Capture -h headers from any subcommand (cp, setmeta, etc.)
ARGS=("$@")
for ((i=0; i<${#ARGS[@]}; i++)); do
  if [ "${ARGS[$i]}" = "-h" ] && [ $((i+1)) -lt ${#ARGS[@]} ]; then
    echo "${ARGS[$((i+1))]}" >> "$STUB_DIR/meta-headers.log"
  fi
done

# Subcommand-specific output
for arg in "$@"; do
  case "$arg" in
    cp)
      echo "Copying..."
      touch "$STUB_DIR/stat-exists"
      ;;
    stat)
      if [ -f "$STUB_DIR/stat-exists" ]; then
        echo "gs://bucket/path: 1024 bytes"
        exit 0
      else
        echo "No URLs matched: gs://bucket/path" >&2
        exit 1
      fi
      ;;
  esac
done
STUB
  chmod +x "$TMPDIR_TEST/bin/gsutil"

  # gcloud stub
  cat > "$TMPDIR_TEST/bin/gcloud" <<'STUB'
#!/usr/bin/env bash
echo "fake-token"
STUB
  chmod +x "$TMPDIR_TEST/bin/gcloud"

  # curl stub: handles GET (group lookup) and POST (doc creation)
  # Failure modes:
  #   $STUB_DIR/curl-fail       -> Firestore doc creation returns 403
  #   $STUB_DIR/curl-group-fail -> Group lookup returns 404
  cat > "$TMPDIR_TEST/bin/curl" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
RESP_FILE=""
HAS_DATA=false
# Parse args to detect -d (POST) vs GET, and find -o target
ARGS=("$@")
for ((i=0; i<${#ARGS[@]}; i++)); do
  case "${ARGS[$i]}" in
    -d) HAS_DATA=true; echo "${ARGS[$((i+1))]}" > "$STUB_DIR/curl-body.json"; i=$((i+1)) ;;
    -o) RESP_FILE="${ARGS[$((i+1))]}"; i=$((i+1)) ;;
    --config) i=$((i+1)) ;;
  esac
done

if [ "$HAS_DATA" = true ]; then
  # POST: Firestore doc creation
  if [ -f "$STUB_DIR/curl-fail" ]; then
    BODY='{"error":{"code":403,"message":"Permission denied","status":"PERMISSION_DENIED"}}'
    if [ -n "$RESP_FILE" ]; then echo "$BODY" > "$RESP_FILE"; else echo "$BODY"; fi
    echo "403"
  else
    BODY='{"name":"projects/commons-systems/databases/(default)/documents/print/prod/media/auto-generated-id"}'
    if [ -n "$RESP_FILE" ]; then echo "$BODY" > "$RESP_FILE"; else echo "$BODY"; fi
    echo "200"
  fi
else
  # GET: group lookup
  if [ -f "$STUB_DIR/curl-group-fail" ]; then
    BODY='{"error":{"code":404,"message":"NOT_FOUND"}}'
    if [ -n "$RESP_FILE" ]; then echo "$BODY" > "$RESP_FILE"; else echo "$BODY"; fi
    echo "404"
  else
    BODY='{"name":"projects/commons-systems/databases/(default)/documents/print/prod/groups/test-group","fields":{"name":{"stringValue":"test-group"},"members":{"arrayValue":{"values":[{"stringValue":"alice@example.com"},{"stringValue":"bob@example.com"}]}}}}'
    if [ -n "$RESP_FILE" ]; then echo "$BODY" > "$RESP_FILE"; else echo "$BODY"; fi
    echo "200"
  fi
fi
STUB
  chmod +x "$TMPDIR_TEST/bin/curl"

  # jq is used directly (not stubbed)

  # date stub: returns fixed timestamp
  cat > "$TMPDIR_TEST/bin/date" <<'STUB'
#!/usr/bin/env bash
echo "2026-03-17T00:00:00Z"
STUB
  chmod +x "$TMPDIR_TEST/bin/date"

  SAVED_PATH="$PATH"
  export PATH="$TMPDIR_TEST/bin:$PATH"
}

teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  export PATH="$SAVED_PATH"
}
trap '[ -n "${TMPDIR_TEST:-}" ] && rm -rf "$TMPDIR_TEST"' EXIT

assert_eq() {
  local label="$1" expected="$2" actual="$3"
  TOTAL=$((TOTAL + 1))
  if [ "$expected" = "$actual" ]; then
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label"
    echo "    expected: $expected"
    echo "    actual:   $actual"
  fi
}

assert_contains() {
  local label="$1" needle="$2" haystack="$3"
  TOTAL=$((TOTAL + 1))
  if echo "$haystack" | grep -qF -- "$needle"; then
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label"
    echo "    expected to contain: $needle"
    echo "    actual: $haystack"
  fi
}

assert_not_contains() {
  local label="$1" needle="$2" haystack="$3"
  TOTAL=$((TOTAL + 1))
  if ! echo "$haystack" | grep -qF -- "$needle"; then
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label"
    echo "    expected NOT to contain: $needle"
    echo "    actual: $haystack"
  fi
}

# --- Argument validation tests ---

echo "Test 1: no arguments -> exits 1 with usage"
setup
exit_code=0
stderr=$(bash "$UPLOAD_SCRIPT" 2>&1) || exit_code=$?
assert_eq "exits 1" "1" "$exit_code"
assert_contains "stderr contains usage" "Usage" "$stderr"
teardown

echo "Test 2: invalid mediaType -> exits 1"
setup
exit_code=0
stderr=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-file.cbz" "Title" "invalid-type" --public 2>&1) || exit_code=$?
assert_eq "exits 1" "1" "$exit_code"
assert_contains "stderr mentions invalid mediaType" "invalid mediaType" "$stderr"
teardown

echo "Test 3: file not found -> exits 1"
setup
exit_code=0
stderr=$(bash "$UPLOAD_SCRIPT" "/nonexistent/file.pdf" "Title" "pdf" --public 2>&1) || exit_code=$?
assert_eq "exits 1" "1" "$exit_code"
assert_contains "stderr mentions not found" "not found" "$stderr"
teardown

echo "Test 4: public upload -> correct GCS metadata and Firestore body"
setup
output=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-file.cbz" "My Title" "image-archive" --public 2>&1)
headers=$(cat "$TMPDIR_TEST/stub/meta-headers.log")
assert_contains "GCS has publicDomain:true" "x-goog-meta-publicdomain:true" "$headers"
assert_not_contains "GCS has no groupId" "groupid" "$headers"
curl_body=$(cat "$TMPDIR_TEST/stub/curl-body.json")
assert_contains "Firestore publicDomain is true" '"booleanValue": true' "$curl_body"
assert_contains "Firestore memberEmails is empty array" '"values": []' "$curl_body"
assert_contains "Firestore groupId is null" '"nullValue": null' "$curl_body"
assert_contains "Firestore mediaType" '"stringValue": "image-archive"' "$curl_body"
assert_contains "Firestore title" '"stringValue": "My Title"' "$curl_body"
teardown

echo "Test 5: --group -> resolves members and sets groupId"
setup
output=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-file.cbz" "Private Item" "epub" --group test-group 2>&1)
headers=$(cat "$TMPDIR_TEST/stub/meta-headers.log")
assert_contains "GCS has publicDomain:false" "x-goog-meta-publicdomain:false" "$headers"
assert_contains "GCS has groupId" "x-goog-meta-groupid:test-group" "$headers"
curl_body=$(cat "$TMPDIR_TEST/stub/curl-body.json")
assert_contains "Firestore publicDomain is false" '"booleanValue": false' "$curl_body"
assert_contains "Firestore has alice email" '"stringValue": "alice@example.com"' "$curl_body"
assert_contains "Firestore has bob email" '"stringValue": "bob@example.com"' "$curl_body"
assert_contains "Firestore groupId is set" '"stringValue": "test-group"' "$curl_body"
teardown

echo "Test 6: --group without argument -> exits 1"
setup
exit_code=0
stderr=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-file.cbz" "Title" "pdf" --group 2>&1) || exit_code=$?
assert_eq "exits 1" "1" "$exit_code"
assert_contains "stderr mentions group ID required" "--group requires" "$stderr"
teardown

echo "Test 7: neither --public nor --group -> exits 1"
setup
exit_code=0
stderr=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-file.cbz" "Title" "pdf" "something" 2>&1) || exit_code=$?
assert_eq "exits 1" "1" "$exit_code"
assert_contains "stderr mentions required flags" "--public or --group" "$stderr"
teardown

echo "Test 8: --group nonexistent -> exits 1 with not found"
setup
touch "$TMPDIR_TEST/stub/curl-group-fail"
exit_code=0
stderr=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-file.cbz" "Title" "pdf" --group nonexistent 2>&1) || exit_code=$?
assert_eq "exits 1" "1" "$exit_code"
assert_contains "stderr mentions not found" "not found" "$stderr"
teardown

echo "Test 9: verification output includes document ID and gsutil stat"
setup
output=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-file.cbz" "Title" "epub" --public 2>&1)
assert_contains "output has document ID" "auto-generated-id" "$output"
assert_contains "output has gsutil stat" "1024 bytes" "$output"
teardown

echo "Test 10: GCS collision -> exits 1 with 'already exists'"
setup
touch "$TMPDIR_TEST/stub/stat-exists"
exit_code=0
stderr=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-file.cbz" "Title" "epub" --public 2>&1) || exit_code=$?
assert_eq "exits 1" "1" "$exit_code"
assert_contains "stderr mentions already exists" "already exists" "$stderr"
teardown

echo "Test 11: no GCS collision -> upload proceeds"
setup
# No stat-exists file means object doesn't exist
exit_code=0
output=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-file.cbz" "Title" "epub" --public 2>&1) || exit_code=$?
assert_eq "exits 0" "0" "$exit_code"
assert_contains "output has document ID" "auto-generated-id" "$output"
teardown

echo "Test 12: Firestore API failure -> exits 1 with cleanup guidance"
setup
touch "$TMPDIR_TEST/stub/curl-fail"
exit_code=0
stderr=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-file.cbz" "Title" "epub" --public 2>&1) || exit_code=$?
assert_eq "exits 1" "1" "$exit_code"
assert_contains "stderr mentions HTTP code" "HTTP 403" "$stderr"
assert_contains "stderr mentions cleanup" "gsutil rm" "$stderr"
teardown

echo ""
echo "================================"
echo "Results: $PASS/$TOTAL passed, $FAIL failed"
echo "================================"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
