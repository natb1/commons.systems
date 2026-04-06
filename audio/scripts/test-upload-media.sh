#!/usr/bin/env bash
# Test suite for upload-media.sh
# Usage: bash audio/scripts/test-upload-media.sh
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

  # Create a test audio file (content irrelevant since ffprobe is stubbed)
  echo "fake audio" > "$TMPDIR_TEST/stub/test-song.mp3"

  # ffprobe stub: returns JSON with audio metadata
  # Override behavior by writing to $STUB_DIR/ffprobe-mode:
  #   "track-slash"    -> track "3/12" format
  #   "missing-optional" -> no track, no date, no title
  cat > "$TMPDIR_TEST/bin/ffprobe" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
MODE=""
if [ -f "$STUB_DIR/ffprobe-mode" ]; then
  MODE=$(cat "$STUB_DIR/ffprobe-mode")
fi

case "$MODE" in
  track-slash)
    cat <<'JSON'
{"format":{"duration":"180.0","tags":{"title":"Track Three","artist":"Slash Artist","album":"Slash Album","track":"3/12","genre":"Jazz","date":"2019-05-10"}}}
JSON
    ;;
  missing-optional)
    cat <<'JSON'
{"format":{"duration":"60.0","tags":{"artist":"Minimal Artist","album":"Minimal Album","genre":"Ambient"}}}
JSON
    ;;
  *)
    cat <<'JSON'
{"format":{"duration":"245.5","tags":{"title":"Test Song","artist":"Test Artist","album":"Test Album","track":"7","genre":"Rock","date":"2020"}}}
JSON
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/ffprobe"

  # gsutil stub: logs invocations and captures -h headers
  cat > "$TMPDIR_TEST/bin/gsutil" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
echo "$@" >> "$STUB_DIR/gsutil.log"

# Capture -h headers
ARGS=("$@")
for ((i=0; i<${#ARGS[@]}; i++)); do
  if [ "${ARGS[$i]}" = "-h" ] && [ $((i+1)) -lt ${#ARGS[@]} ]; then
    echo "${ARGS[$((i+1))]}" >> "$STUB_DIR/meta-headers.log"
  fi
done

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
  cat > "$TMPDIR_TEST/bin/curl" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
RESP_FILE=""
HAS_DATA=false
ARGS=("$@")
for ((i=0; i<${#ARGS[@]}; i++)); do
  case "${ARGS[$i]}" in
    -d) HAS_DATA=true; echo "${ARGS[$((i+1))]}" > "$STUB_DIR/curl-body.json"; i=$((i+1)) ;;
    -o) RESP_FILE="${ARGS[$((i+1))]}"; i=$((i+1)) ;;
    --config) i=$((i+1)) ;;
  esac
done

if [ "$HAS_DATA" = true ]; then
  if [ -f "$STUB_DIR/curl-fail" ]; then
    BODY='{"error":{"code":403,"message":"Permission denied","status":"PERMISSION_DENIED"}}'
    if [ -n "$RESP_FILE" ]; then echo "$BODY" > "$RESP_FILE"; else echo "$BODY"; fi
    echo "403"
  else
    BODY='{"name":"projects/commons-systems/databases/(default)/documents/audio/prod/media/auto-generated-id"}'
    if [ -n "$RESP_FILE" ]; then echo "$BODY" > "$RESP_FILE"; else echo "$BODY"; fi
    echo "200"
  fi
else
  if [ -f "$STUB_DIR/curl-group-fail" ]; then
    BODY='{"error":{"code":404,"message":"NOT_FOUND"}}'
    if [ -n "$RESP_FILE" ]; then echo "$BODY" > "$RESP_FILE"; else echo "$BODY"; fi
    echo "404"
  else
    BODY='{"name":"projects/commons-systems/databases/(default)/documents/audio/prod/groups/test-group","fields":{"name":{"stringValue":"test-group"},"members":{"arrayValue":{"values":[{"stringValue":"alice@example.com"},{"stringValue":"bob@example.com"}]}}}}'
    if [ -n "$RESP_FILE" ]; then echo "$BODY" > "$RESP_FILE"; else echo "$BODY"; fi
    echo "200"
  fi
fi
STUB
  chmod +x "$TMPDIR_TEST/bin/curl"

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

echo "Test 2: unsupported file extension -> exits 1"
setup
echo "fake" > "$TMPDIR_TEST/stub/test-file.txt"
exit_code=0
stderr=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-file.txt" --public 2>&1) || exit_code=$?
assert_eq "exits 1" "1" "$exit_code"
assert_contains "stderr mentions unsupported" "unsupported audio format" "$stderr"
teardown

echo "Test 3: file not found -> exits 1"
setup
exit_code=0
stderr=$(bash "$UPLOAD_SCRIPT" "/nonexistent/file.mp3" --public 2>&1) || exit_code=$?
assert_eq "exits 1" "1" "$exit_code"
assert_contains "stderr mentions not found" "not found" "$stderr"
teardown

echo "Test 4: --public upload -> correct GCS metadata and Firestore body"
setup
output=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-song.mp3" --public 2>&1)
headers=$(cat "$TMPDIR_TEST/stub/meta-headers.log")
assert_contains "GCS has publicdomain:true" "x-goog-meta-publicdomain:true" "$headers"
assert_not_contains "GCS has no groupid" "groupid" "$headers"
curl_body=$(cat "$TMPDIR_TEST/stub/curl-body.json")
assert_contains "Firestore publicDomain is true" '"booleanValue": true' "$curl_body"
assert_contains "Firestore title" '"stringValue": "Test Song"' "$curl_body"
assert_contains "Firestore artist" '"stringValue": "Test Artist"' "$curl_body"
assert_contains "Firestore album" '"stringValue": "Test Album"' "$curl_body"
assert_contains "Firestore genre" '"stringValue": "Rock"' "$curl_body"
assert_contains "Firestore format is mp3" '"stringValue": "mp3"' "$curl_body"
assert_contains "Firestore duration is doubleValue" '"doubleValue": 245.5' "$curl_body"
assert_contains "Firestore trackNumber is 7" '"integerValue": "7"' "$curl_body"
assert_contains "Firestore year is 2020" '"integerValue": "2020"' "$curl_body"
assert_contains "Firestore storagePath" '"stringValue": "media/test-song.mp3"' "$curl_body"
assert_contains "Firestore memberEmails is empty" '"values": []' "$curl_body"
assert_contains "Firestore groupId is null" '"nullValue": null' "$curl_body"
teardown

echo "Test 5: --group -> resolves members and sets groupId"
setup
output=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-song.mp3" --group test-group 2>&1)
headers=$(cat "$TMPDIR_TEST/stub/meta-headers.log")
assert_contains "GCS has publicdomain:false" "x-goog-meta-publicdomain:false" "$headers"
assert_contains "GCS has groupid" "x-goog-meta-groupid:test-group" "$headers"
curl_body=$(cat "$TMPDIR_TEST/stub/curl-body.json")
assert_contains "Firestore publicDomain is false" '"booleanValue": false' "$curl_body"
assert_contains "Firestore has alice email" '"stringValue": "alice@example.com"' "$curl_body"
assert_contains "Firestore has bob email" '"stringValue": "bob@example.com"' "$curl_body"
assert_contains "Firestore groupId is set" '"stringValue": "test-group"' "$curl_body"
teardown

echo "Test 6: --group without argument -> exits 1"
setup
exit_code=0
stderr=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-song.mp3" --group 2>&1) || exit_code=$?
assert_eq "exits 1" "1" "$exit_code"
assert_contains "stderr mentions group ID required" "--group requires" "$stderr"
teardown

echo "Test 7: neither --public nor --group -> exits 1"
setup
exit_code=0
stderr=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-song.mp3" 2>&1) || exit_code=$?
assert_eq "exits 1" "1" "$exit_code"
assert_contains "stderr shows usage" "Usage" "$stderr"
teardown

echo "Test 8: --group nonexistent -> exits 1 with not found"
setup
touch "$TMPDIR_TEST/stub/curl-group-fail"
exit_code=0
stderr=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-song.mp3" --group nonexistent 2>&1) || exit_code=$?
assert_eq "exits 1" "1" "$exit_code"
assert_contains "stderr mentions not found" "not found" "$stderr"
teardown

echo "Test 9: GCS collision -> exits 1 with 'already exists'"
setup
touch "$TMPDIR_TEST/stub/stat-exists"
exit_code=0
stderr=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-song.mp3" --public 2>&1) || exit_code=$?
assert_eq "exits 1" "1" "$exit_code"
assert_contains "stderr mentions already exists" "already exists" "$stderr"
teardown

echo "Test 10: Firestore API failure -> exits 1 with cleanup guidance"
setup
touch "$TMPDIR_TEST/stub/curl-fail"
exit_code=0
stderr=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-song.mp3" --public 2>&1) || exit_code=$?
assert_eq "exits 1" "1" "$exit_code"
assert_contains "stderr mentions HTTP code" "HTTP 403" "$stderr"
assert_contains "stderr mentions cleanup" "gsutil rm" "$stderr"
teardown

echo "Test 11: track number '3/12' format -> parses to 3"
setup
echo "track-slash" > "$TMPDIR_TEST/stub/ffprobe-mode"
output=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-song.mp3" --public 2>&1)
curl_body=$(cat "$TMPDIR_TEST/stub/curl-body.json")
assert_contains "Firestore trackNumber is 3" '"integerValue": "3"' "$curl_body"
assert_contains "Firestore year is 2019" '"integerValue": "2019"' "$curl_body"
teardown

echo "Test 12: missing optional tags -> null fields, filename fallback for title with warning"
setup
echo "missing-optional" > "$TMPDIR_TEST/stub/ffprobe-mode"
output=$(bash "$UPLOAD_SCRIPT" "$TMPDIR_TEST/stub/test-song.mp3" --public 2>&1)
assert_contains "title fallback warning" "warning: no title tag found, using filename: test-song" "$output"
curl_body=$(cat "$TMPDIR_TEST/stub/curl-body.json")
assert_contains "Firestore title falls back to filename" '"stringValue": "test-song"' "$curl_body"
assert_contains "Firestore trackNumber is null" '"nullValue": null' "$curl_body"
# year should also be null since no date tag
year_null_count=$(echo "$curl_body" | grep -c '"nullValue": null' || true)
TOTAL=$((TOTAL + 1))
if [ "$year_null_count" -ge 2 ]; then
  PASS=$((PASS + 1))
  echo "  PASS: Firestore year is null (multiple nullValue fields present)"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL: Firestore year is null"
  echo "    expected at least 2 nullValue fields (trackNumber + year), found: $year_null_count"
fi
teardown

echo ""
echo "================================"
echo "Results: $PASS/$TOTAL passed, $FAIL failed"
echo "================================"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
