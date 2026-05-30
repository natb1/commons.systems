#!/usr/bin/env bash
# Test suite for attach-markdown.sh
# Usage: bash print/scripts/test-attach-markdown.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
ATTACH_SCRIPT="$SCRIPT_DIR/attach-markdown.sh"

PASS=0
FAIL=0
TOTAL=0
SAVED_PATH=""
TMPDIR_TEST=""

setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/bin" "$TMPDIR_TEST/stub"

  # Create a test markdown file to attach
  echo "# test content" > "$TMPDIR_TEST/stub/test-file.md"

  # gsutil stub: collision check stats (no URLs matched), then cp, then stat
  cat > "$TMPDIR_TEST/bin/gsutil" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
echo "$@" >> "$STUB_DIR/gsutil.log"

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

  # curl stub: handles GET (doc verify) and PATCH (markdownPath set).
  # Failure mode:
  #   $STUB_DIR/curl-doc-fail -> GET doc verify returns 404
  cat > "$TMPDIR_TEST/bin/curl" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
RESP_FILE=""
IS_PATCH=false
# Parse args: detect -X PATCH, find -o target, log request URLs.
# Value-taking flags skip their value so it can't be mistaken for a URL.
ARGS=("$@")
for ((i=0; i<${#ARGS[@]}; i++)); do
  case "${ARGS[$i]}" in
    -X) [ "${ARGS[$((i+1))]}" = "PATCH" ] && IS_PATCH=true; i=$((i+1)) ;;
    -d) i=$((i+1)) ;;
    -o) RESP_FILE="${ARGS[$((i+1))]}"; i=$((i+1)) ;;
    -w) i=$((i+1)) ;;
    -H) i=$((i+1)) ;;
    --config) i=$((i+1)) ;;
    https://*) echo "${ARGS[$i]}" >> "$STUB_DIR/curl-urls.log" ;;
  esac
done

if [ "$IS_PATCH" = true ]; then
  # PATCH: set markdownPath
  BODY='{"name":"projects/commons-systems/databases/(default)/documents/print/prod/media/some-id"}'
  if [ -n "$RESP_FILE" ]; then echo "$BODY" > "$RESP_FILE"; else echo "$BODY"; fi
  echo "200"
else
  # GET: doc verify
  if [ -f "$STUB_DIR/curl-doc-fail" ]; then
    BODY='{"error":{"code":404,"message":"NOT_FOUND"}}'
    if [ -n "$RESP_FILE" ]; then echo "$BODY" > "$RESP_FILE"; else echo "$BODY"; fi
    echo "404"
  else
    BODY='{"name":"projects/commons-systems/databases/(default)/documents/print/prod/media/some-id","fields":{"title":{"stringValue":"Item"}}}'
    if [ -n "$RESP_FILE" ]; then echo "$BODY" > "$RESP_FILE"; else echo "$BODY"; fi
    echo "200"
  fi
fi
STUB
  chmod +x "$TMPDIR_TEST/bin/curl"

  # jq is used directly (not stubbed)

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

echo "Test 1: docId with slash -> percent-encoded in Firestore URL"
setup
bash "$ATTACH_SCRIPT" 'has/slash' "$TMPDIR_TEST/stub/test-file.md" >/dev/null 2>&1
curl_urls=$(cat "$TMPDIR_TEST/stub/curl-urls.log")
assert_contains "URL contains percent-encoded doc ID" "documents/print/prod/media/has%2Fslash" "$curl_urls"
assert_not_contains "URL does not contain raw slash in doc ID" "media/has/slash" "$curl_urls"
teardown

echo "Test 2: docId with slash, doc verify 404 -> error quotes raw doc ID"
setup
touch "$TMPDIR_TEST/stub/curl-doc-fail"
exit_code=0
stderr=$(bash "$ATTACH_SCRIPT" 'has/slash' "$TMPDIR_TEST/stub/test-file.md" 2>&1) || exit_code=$?
assert_eq "exits 1" "1" "$exit_code"
assert_contains "error quotes original unencoded doc ID" "document 'has/slash' not found" "$stderr"
teardown

echo ""
echo "================================"
echo "Results: $PASS/$TOTAL passed, $FAIL failed"
echo "================================"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
