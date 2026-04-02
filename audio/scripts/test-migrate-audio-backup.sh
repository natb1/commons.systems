#!/usr/bin/env bash
# Test suite for migrate-audio-backup.sh
# Usage: bash audio/scripts/test-migrate-audio-backup.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
MIGRATE_SCRIPT="$SCRIPT_DIR/migrate-audio-backup.sh"

PASS=0
FAIL=0
TOTAL=0
SAVED_PATH=""
TMPDIR_TEST=""

setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/bin" "$TMPDIR_TEST/stub"

  # ffprobe stub: returns JSON with audio metadata
  # Override behavior by writing to $STUB_DIR/ffprobe-mode:
  #   "missing-duration" -> no duration field
  #   "missing-optional" -> no track, no date, no title
  cat > "$TMPDIR_TEST/bin/ffprobe" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
MODE=""
if [ -f "$STUB_DIR/ffprobe-mode" ]; then
  MODE=$(cat "$STUB_DIR/ffprobe-mode")
fi

case "$MODE" in
  missing-duration)
    cat <<'JSON'
{"format":{"tags":{"title":"No Duration","artist":"Test","album":"Test","genre":"Rock"}}}
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
  # Modes via $STUB_DIR/gsutil-mode:
  #   "stat-exists" -> stat returns 0 (object already exists)
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
    ls)
      # Return canned list of source files
      if [ -f "$STUB_DIR/gsutil-ls-output" ]; then
        cat "$STUB_DIR/gsutil-ls-output"
      else
        echo "gs://rml-media/audio-backup-20251117-121224/Artist One/Album A/01 Track One.mp3"
        echo "gs://rml-media/audio-backup-20251117-121224/Artist One/Album A/02 Track Two.mp3"
        echo "gs://rml-media/audio-backup-20251117-121224/Artist Two/Album B/01 Song.mp3"
      fi
      exit 0
      ;;
    cp)
      # For downloads: create the destination file
      DEST="${ARGS[${#ARGS[@]}-1]}"
      if [[ "$DEST" != gs://* ]]; then
        echo "fake audio data" > "$DEST"
      fi
      echo "Copying..." >> "$STUB_DIR/gsutil-cp.log"
      exit 0
      ;;
    stat)
      if [ -f "$STUB_DIR/stat-exists" ]; then
        echo "gs://bucket/path: 1024 bytes"
        exit 0
      else
        echo "No URLs matched" >&2
        exit 1
      fi
      ;;
  esac
done
STUB
  chmod +x "$TMPDIR_TEST/bin/gsutil"

  # gcloud stub: tracks refresh count
  cat > "$TMPDIR_TEST/bin/gcloud" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
echo "fake-token"
COUNT=0
if [ -f "$STUB_DIR/token-refresh-count" ]; then
  COUNT=$(cat "$STUB_DIR/token-refresh-count")
fi
COUNT=$((COUNT + 1))
echo "$COUNT" > "$STUB_DIR/token-refresh-count"
STUB
  chmod +x "$TMPDIR_TEST/bin/gcloud"

  # curl stub: handles GET (group lookup) and POST (doc creation)
  cat > "$TMPDIR_TEST/bin/curl" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
RESP_FILE=""
HAS_DATA=false
IS_POST=false
URL=""
ARGS=("$@")
for ((i=0; i<${#ARGS[@]}; i++)); do
  case "${ARGS[$i]}" in
    -d) HAS_DATA=true; echo "${ARGS[$((i+1))]}" >> "$STUB_DIR/curl-body.log"; i=$((i+1)) ;;
    -o) RESP_FILE="${ARGS[$((i+1))]}"; i=$((i+1)) ;;
    -X) IS_POST=true; i=$((i+1)) ;;
    --config) i=$((i+1)) ;;
    https://*) URL="${ARGS[$i]}" ;;
  esac
done

# Track curl calls
echo "$URL" >> "$STUB_DIR/curl-urls.log"

if [ "$HAS_DATA" = true ]; then
  # POST: Firestore document creation
  BODY='{"name":"projects/commons-systems/databases/(default)/documents/audio/prod/media/auto-id-'"$(date +%s%N)"'"}'
  if [ -n "$RESP_FILE" ]; then echo "$BODY" > "$RESP_FILE"; else echo "$BODY"; fi
  echo "200"
elif [[ "$URL" == *"groups"* ]]; then
  # GET: group lookup
  if [ -f "$STUB_DIR/group-not-found" ]; then
    BODY='{"error":{"code":404,"message":"NOT_FOUND"}}'
    if [ -n "$RESP_FILE" ]; then echo "$BODY" > "$RESP_FILE"; else echo "$BODY"; fi
    echo "404"
  else
    BODY='{"name":"projects/commons-systems/databases/(default)/documents/audio/prod/groups/rml-private","fields":{"name":{"stringValue":"rml-private"},"members":{"arrayValue":{"values":[{"stringValue":"nathan@natb1.com"},{"stringValue":"lwebb7@jhmi.edu"}]}}}}'
    if [ -n "$RESP_FILE" ]; then echo "$BODY" > "$RESP_FILE"; else echo "$BODY"; fi
    echo "200"
  fi
else
  BODY='{}'
  if [ -n "$RESP_FILE" ]; then echo "$BODY" > "$RESP_FILE"; else echo "$BODY"; fi
  echo "200"
fi
STUB
  chmod +x "$TMPDIR_TEST/bin/curl"

  # date stub: returns fixed timestamp
  cat > "$TMPDIR_TEST/bin/date" <<'STUB'
#!/usr/bin/env bash
echo "2026-04-02T00:00:00Z"
STUB
  chmod +x "$TMPDIR_TEST/bin/date"

  # jq: use the real jq (required for JSON construction)
  # It should already be on the system PATH

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

assert_file_contains() {
  local label="$1" needle="$2" file="$3"
  TOTAL=$((TOTAL + 1))
  if [ -f "$file" ] && grep -qF -- "$needle" "$file"; then
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label"
    echo "    expected file to contain: $needle"
    if [ -f "$file" ]; then
      echo "    file contents: $(cat "$file")"
    else
      echo "    file does not exist: $file"
    fi
  fi
}

assert_file_not_contains() {
  local label="$1" needle="$2" file="$3"
  TOTAL=$((TOTAL + 1))
  if [ ! -f "$file" ] || ! grep -qF -- "$needle" "$file"; then
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label"
    echo "    expected file NOT to contain: $needle"
  fi
}

# --- Tests ---

echo "Test 1: Flattening produces correct flat names"
setup
output=$(bash "$MIGRATE_SCRIPT" --dry-run --progress-file "$TMPDIR_TEST/stub/progress.log" 2>&1)
assert_contains "flat name for Artist One/Album A/01 Track One" "Artist One - Album A - 01 Track One.mp3" "$output"
assert_contains "flat name for Artist One/Album A/02 Track Two" "Artist One - Album A - 02 Track Two.mp3" "$output"
assert_contains "flat name for Artist Two/Album B/01 Song" "Artist Two - Album B - 01 Song.mp3" "$output"
teardown

echo "Test 2: Duplicate flat names are skipped with warning"
setup
cat > "$TMPDIR_TEST/stub/gsutil-ls-output" <<'EOF'
gs://rml-media/audio-backup-20251117-121224/Artist/Album/Track.mp3
gs://rml-media/audio-backup-20251117-121224/Artist/Album/Track.mp3
EOF
output=$(bash "$MIGRATE_SCRIPT" --dry-run --progress-file "$TMPDIR_TEST/stub/progress.log" 2>&1)
assert_contains "warns about duplicate" "duplicate flat name" "$output"
assert_contains "reports 1 unique" "1 unique files" "$output"
teardown

echo "Test 3: Files in progress log are skipped"
setup
cat > "$TMPDIR_TEST/stub/progress.log" <<'EOF'
Artist One - Album A - 01 Track One.mp3
Artist One - Album A - 02 Track Two.mp3
Artist Two - Album B - 01 Song.mp3
EOF
output=$(bash "$MIGRATE_SCRIPT" --progress-file "$TMPDIR_TEST/stub/progress.log" 2>&1)
assert_contains "skipped count" "Skipped:  3" "$output"
assert_contains "uploaded zero" "Uploaded: 0" "$output"
teardown

echo "Test 4: Group creation POST sent when group does not exist"
setup
touch "$TMPDIR_TEST/stub/group-not-found"
output=$(bash "$MIGRATE_SCRIPT" --progress-file "$TMPDIR_TEST/stub/progress.log" 2>&1)
assert_contains "group created message" "created" "$output"
curl_urls=$(cat "$TMPDIR_TEST/stub/curl-urls.log")
assert_contains "POST to groups endpoint" "groups" "$curl_urls"
curl_bodies=$(cat "$TMPDIR_TEST/stub/curl-body.log")
assert_contains "group body has name" "rml-private" "$curl_bodies"
assert_contains "group body has nathan email" "nathan@natb1.com" "$curl_bodies"
assert_contains "group body has lwebb email" "lwebb7@jhmi.edu" "$curl_bodies"
teardown

echo "Test 5: Group already exists -> no POST for group"
setup
output=$(bash "$MIGRATE_SCRIPT" --progress-file "$TMPDIR_TEST/stub/progress.log" 2>&1)
assert_contains "group exists message" "already exists" "$output"
# curl-body.log should only have Firestore doc POSTs, not group creation
if [ -f "$TMPDIR_TEST/stub/curl-body.log" ]; then
  body_content=$(cat "$TMPDIR_TEST/stub/curl-body.log")
  assert_not_contains "no group creation body" "members" "$body_content"
fi
teardown

echo "Test 6: GCS upload includes all 4 metadata headers"
setup
output=$(bash "$MIGRATE_SCRIPT" --progress-file "$TMPDIR_TEST/stub/progress.log" 2>&1)
headers=$(cat "$TMPDIR_TEST/stub/meta-headers.log" 2>/dev/null || echo "")
assert_contains "publicDomain:false" "x-goog-meta-publicDomain:false" "$headers"
assert_contains "groupId header" "x-goog-meta-groupId:rml-private" "$headers"
assert_contains "member_0 header" "x-goog-meta-member_0:nathan@natb1.com" "$headers"
assert_contains "member_1 header" "x-goog-meta-member_1:lwebb7@jhmi.edu" "$headers"
teardown

echo "Test 7: Firestore body matches expected schema"
setup
output=$(bash "$MIGRATE_SCRIPT" --progress-file "$TMPDIR_TEST/stub/progress.log" 2>&1)
curl_body=$(cat "$TMPDIR_TEST/stub/curl-body.log")
assert_contains "title field" '"stringValue": "Test Song"' "$curl_body"
assert_contains "artist field" '"stringValue": "Test Artist"' "$curl_body"
assert_contains "album field" '"stringValue": "Test Album"' "$curl_body"
assert_contains "genre field" '"stringValue": "Rock"' "$curl_body"
assert_contains "duration field" '"doubleValue": 245.5' "$curl_body"
assert_contains "format is mp3" '"stringValue": "mp3"' "$curl_body"
assert_contains "publicDomain false" '"booleanValue": false' "$curl_body"
assert_contains "groupId in body" '"stringValue": "rml-private"' "$curl_body"
assert_contains "memberEmails has nathan" '"stringValue": "nathan@natb1.com"' "$curl_body"
assert_contains "memberEmails has lwebb" '"stringValue": "lwebb7@jhmi.edu"' "$curl_body"
assert_contains "storagePath has flat name" '"stringValue": "media/' "$curl_body"
assert_contains "sourceNotes has migration origin" "Migrated from" "$curl_body"
assert_contains "trackNumber is 7" '"integerValue": "7"' "$curl_body"
assert_contains "year is 2020" '"integerValue": "2020"' "$curl_body"
teardown

echo "Test 8: Dry-run makes no gsutil cp or curl POST calls"
setup
output=$(bash "$MIGRATE_SCRIPT" --dry-run --progress-file "$TMPDIR_TEST/stub/progress.log" 2>&1)
assert_contains "dry-run output" "[dry-run]" "$output"
gsutil_log=$(cat "$TMPDIR_TEST/stub/gsutil.log" 2>/dev/null || echo "")
# gsutil ls is allowed, but cp should not appear
assert_not_contains "no gsutil cp in dry-run" " cp " "$gsutil_log"
# curl-body.log should not exist (no Firestore POSTs)
TOTAL=$((TOTAL + 1))
if [ ! -f "$TMPDIR_TEST/stub/curl-body.log" ]; then
  PASS=$((PASS + 1))
  echo "  PASS: no curl POST in dry-run"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL: curl POST occurred during dry-run"
fi
teardown

echo "Test 9: Missing duration -> file skipped with warning"
setup
echo "missing-duration" > "$TMPDIR_TEST/stub/ffprobe-mode"
output=$(timeout 10 bash "$MIGRATE_SCRIPT" --progress-file "$TMPDIR_TEST/stub/progress.log" 2>&1) || true
assert_contains "warning about no duration" "no duration" "$output"
assert_contains "failed count" "Failed:   3" "$output"
teardown

echo "Test 10: Title fallback uses original track filename"
setup
echo "missing-optional" > "$TMPDIR_TEST/stub/ffprobe-mode"
output=$(bash "$MIGRATE_SCRIPT" --progress-file "$TMPDIR_TEST/stub/progress.log" 2>&1)
curl_body=$(cat "$TMPDIR_TEST/stub/curl-body.log")
# Title should be the track filename without extension, e.g. "01 Track One"
assert_contains "title is track filename" "01 Track One" "$curl_body"
teardown

echo "Test 11: Token refreshed after 50 files"
setup
# Generate 51 source files
{
  for i in $(seq 1 51); do
    echo "gs://rml-media/audio-backup-20251117-121224/Artist/Album/Track${i}.mp3"
  done
} > "$TMPDIR_TEST/stub/gsutil-ls-output"
output=$(bash "$MIGRATE_SCRIPT" --progress-file "$TMPDIR_TEST/stub/progress.log" 2>&1)
refresh_count=$(cat "$TMPDIR_TEST/stub/token-refresh-count")
# Initial token + 1 refresh at file 50 = at least 2
TOTAL=$((TOTAL + 1))
if [ "$refresh_count" -ge 2 ]; then
  PASS=$((PASS + 1))
  echo "  PASS: token refreshed (count=$refresh_count >= 2)"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL: token not refreshed (count=$refresh_count, expected >= 2)"
fi
teardown

echo "Test 12: Existing GCS object -> skips upload, still creates Firestore doc"
setup
touch "$TMPDIR_TEST/stub/stat-exists"
output=$(bash "$MIGRATE_SCRIPT" --progress-file "$TMPDIR_TEST/stub/progress.log" 2>&1)
assert_contains "skips upload message" "skipping upload" "$output"
# But curl-body.log should have Firestore POSTs
TOTAL=$((TOTAL + 1))
if [ -f "$TMPDIR_TEST/stub/curl-body.log" ]; then
  PASS=$((PASS + 1))
  echo "  PASS: Firestore doc still created"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL: no Firestore doc created when GCS object exists"
fi
# Progress file should have entries
progress_count=$(wc -l < "$TMPDIR_TEST/stub/progress.log" | tr -d ' ')
TOTAL=$((TOTAL + 1))
if [ "$progress_count" -ge 1 ]; then
  PASS=$((PASS + 1))
  echo "  PASS: progress file records completed files (count=$progress_count)"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL: progress file empty"
fi
teardown

echo ""
echo "================================"
echo "Results: $PASS/$TOTAL passed, $FAIL failed"
echo "================================"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
