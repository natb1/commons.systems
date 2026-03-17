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

  # gsutil stub: logs invocations
  cat > "$TMPDIR_TEST/bin/gsutil" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
echo "$@" >> "$STUB_DIR/gsutil.log"

case "$1" in
  cp)   echo "Copying $2..." ;;
  stat) echo "gs://bucket/path: 1024 bytes" ;;
  setmeta)
    # Save all -h headers
    shift
    while [ $# -gt 0 ]; do
      case "$1" in
        -h) echo "$2" >> "$STUB_DIR/setmeta-headers.log"; shift 2 ;;
        *)  shift ;;
      esac
    done
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/gsutil"

  # gcloud stub
  cat > "$TMPDIR_TEST/bin/gcloud" <<'STUB'
#!/usr/bin/env bash
echo "fake-token"
STUB
  chmod +x "$TMPDIR_TEST/bin/gcloud"

  # curl stub: saves POST body, returns canned Firestore response
  cat > "$TMPDIR_TEST/bin/curl" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
# Find -d arg and save it
while [ $# -gt 0 ]; do
  case "$1" in
    -d) echo "$2" > "$STUB_DIR/curl-body.json"; shift 2 ;;
    *)  shift ;;
  esac
done
echo '{"name":"projects/commons-systems/databases/(default)/documents/print/prod/media/auto-generated-id"}'
STUB
  chmod +x "$TMPDIR_TEST/bin/curl"

  # jq stub: pass through to real jq
  # (jq is required, not stubbed)

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
headers=$(cat "$TMPDIR_TEST/stub/setmeta-headers.log")
assert_contains "GCS has publicDomain:true" "x-goog-meta-publicDomain:true" "$headers"
assert_not_contains "GCS has no member_0" "member_0" "$headers"
curl_body=$(cat "$TMPDIR_TEST/stub/curl-body.json")
assert_contains "Firestore publicDomain is true" '"booleanValue": true' "$curl_body"
assert_contains "Firestore memberEmails is empty array" '"values": []' "$curl_body"
assert_contains "Firestore mediaType" '"stringValue": "image-archive"' "$curl_body"
assert_contains "Firestore title" '"stringValue": "My Title"' "$curl_body"
teardown

echo "Test 5: private with 1 email -> correct GCS metadata and Firestore body"
setup
output=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-file.cbz" "Private Item" "epub" "alice@example.com" 2>&1)
headers=$(cat "$TMPDIR_TEST/stub/setmeta-headers.log")
assert_contains "GCS has publicDomain:false" "x-goog-meta-publicDomain:false" "$headers"
assert_contains "GCS has member_0" "x-goog-meta-member_0:alice@example.com" "$headers"
curl_body=$(cat "$TMPDIR_TEST/stub/curl-body.json")
assert_contains "Firestore publicDomain is false" '"booleanValue": false' "$curl_body"
assert_contains "Firestore has alice email" '"stringValue": "alice@example.com"' "$curl_body"
teardown

echo "Test 6: private with 3 emails -> all member keys set"
setup
output=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-file.cbz" "Multi" "pdf" "a@x.com" "b@x.com" "c@x.com" 2>&1)
headers=$(cat "$TMPDIR_TEST/stub/setmeta-headers.log")
assert_contains "GCS has member_0" "x-goog-meta-member_0:a@x.com" "$headers"
assert_contains "GCS has member_1" "x-goog-meta-member_1:b@x.com" "$headers"
assert_contains "GCS has member_2" "x-goog-meta-member_2:c@x.com" "$headers"
curl_body=$(cat "$TMPDIR_TEST/stub/curl-body.json")
assert_contains "Firestore has a@x.com" '"stringValue": "a@x.com"' "$curl_body"
assert_contains "Firestore has b@x.com" '"stringValue": "b@x.com"' "$curl_body"
assert_contains "Firestore has c@x.com" '"stringValue": "c@x.com"' "$curl_body"
teardown

echo "Test 7: private with 0 emails -> exits 1"
setup
exit_code=0
stderr=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-file.cbz" "Title" "pdf" 2>&1) || exit_code=$?
assert_eq "exits 1" "1" "$exit_code"
assert_contains "stderr mentions email requirement" "email" "$stderr"
teardown

echo "Test 8: private with 4 emails -> exits 1"
setup
exit_code=0
stderr=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-file.cbz" "Title" "pdf" "a@x" "b@x" "c@x" "d@x" 2>&1) || exit_code=$?
assert_eq "exits 1" "1" "$exit_code"
assert_contains "stderr mentions email count" "1-3" "$stderr"
teardown

echo "Test 9: verification output includes document ID and gsutil stat"
setup
output=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-file.cbz" "Title" "epub" --public 2>&1)
assert_contains "output has document ID" "auto-generated-id" "$output"
assert_contains "output has gsutil stat" "1024 bytes" "$output"
teardown

echo ""
echo "================================"
echo "Results: $PASS/$TOTAL passed, $FAIL failed"
echo "================================"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
