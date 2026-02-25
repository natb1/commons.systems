#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
WRITE_SCRIPT="$SCRIPT_DIR/write-pr-comment.sh"
APPEND_SCRIPT="$SCRIPT_DIR/append-pr-comment.sh"

PASS=0
FAIL=0
TOTAL=0

setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/bin" "$TMPDIR_TEST/stub"

  # Copy scripts under test into temp dir
  cp "$WRITE_SCRIPT" "$TMPDIR_TEST/write-pr-comment.sh"
  cp "$APPEND_SCRIPT" "$TMPDIR_TEST/append-pr-comment.sh"
  chmod +x "$TMPDIR_TEST/write-pr-comment.sh" "$TMPDIR_TEST/append-pr-comment.sh"

  # Create gh stub
  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
# gh stub for testing write-pr-comment.sh and append-pr-comment.sh

STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"

case "$1 $2" in
  "repo view")
    echo "owner/repo"
    exit 0
    ;;
  "api repos/owner/repo/issues/99/comments")
    shift 2
    jq_filter=""
    file_field=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --method) shift 2 ;;
        --jq) jq_filter="$2"; shift 2 ;;
        --field)
          val="${2#body=@}"
          file_field="$val"
          shift 2
          ;;
        *) shift ;;
      esac
    done
    # Fail if @file was specified but doesn't exist
    if [ -n "$file_field" ] && [ ! -f "$file_field" ]; then
      echo "stub: file not found: $file_field" >&2
      exit 1
    fi
    if [ -n "$jq_filter" ]; then
      echo "12345"
    else
      echo '{"id": 12345}'
    fi
    exit 0
    ;;
  "api repos/owner/repo/issues/comments/12345")
    shift 2
    method=""
    jq_filter=""
    file_field=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --method) method="$2"; shift 2 ;;
        --jq)     jq_filter="$2"; shift 2 ;;
        --field)
          val="${2#body=@}"
          file_field="$val"
          shift 2
          ;;
        --silent) shift ;;
        *) shift ;;
      esac
    done

    if [ "$method" = "PATCH" ]; then
      # Save patched body to stub dir for inspection
      if [ -n "$file_field" ] && [ -f "$file_field" ]; then
        cp "$file_field" "$STUB_DIR/patched-body.txt"
      fi
      exit 0
    fi

    # GET with --jq '.body'
    if [ -n "$jq_filter" ]; then
      echo "existing body"
      exit 0
    fi

    exit 0
    ;;
  *)
    echo "stub: unknown invocation: $*" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/gh"

  export PATH="$TMPDIR_TEST/bin:$PATH"
  WRITE_T="$TMPDIR_TEST/write-pr-comment.sh"
  APPEND_T="$TMPDIR_TEST/append-pr-comment.sh"
}

teardown() {
  rm -rf "$TMPDIR_TEST"
}

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

# Test 1: write-pr-comment.sh prints comment ID from POST response
echo "Test 1: write-pr-comment.sh prints comment ID"
setup
echo "hello world" > "$TMPDIR_TEST/body.txt"
output=$("$WRITE_T" 99 "$TMPDIR_TEST/body.txt")
assert_eq "prints comment ID" "12345" "$output"
teardown

# Test 2: write-pr-comment.sh exits non-zero when file does not exist
echo "Test 2: write-pr-comment.sh exits non-zero for missing file"
setup
exit_code=0
"$WRITE_T" 99 "$TMPDIR_TEST/nonexistent.txt" 2>/dev/null || exit_code=$?
assert_eq "exits non-zero" "1" "$([ "$exit_code" -ne 0 ] && echo 1 || echo 0)"
teardown

# Test 3: write-pr-comment.sh uses @file syntax (body read from file, not inline)
echo "Test 3: write-pr-comment.sh uses @file body syntax"
setup
echo "test content" > "$TMPDIR_TEST/body.txt"
# Capture what gh receives by logging the --field argument
cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
case "$1 $2" in
  "repo view") echo "owner/repo"; exit 0 ;;
  "api repos/owner/repo/issues/99/comments")
    shift 2
    while [ $# -gt 0 ]; do
      case "$1" in
        --field)
          # Record the field value for inspection
          echo "$2" > "$STUB_DIR/field-arg.txt"
          shift 2 ;;
        --jq) echo '{"id": 12345}' | jq -r "$2"; shift 2 ;;
        *) shift ;;
      esac
    done
    echo '{"id": 12345}'
    exit 0 ;;
  *) exit 1 ;;
esac
STUB
chmod +x "$TMPDIR_TEST/bin/gh"
"$WRITE_T" 99 "$TMPDIR_TEST/body.txt" > /dev/null
field_arg=$(cat "$TMPDIR_TEST/stub/field-arg.txt")
assert_contains "field uses @file syntax" "body=@" "$field_arg"
teardown

# Test 4: append-pr-comment.sh result contains original body, separator, and appended content
echo "Test 4: append-pr-comment.sh result contains all parts"
setup
echo "appended content" > "$TMPDIR_TEST/append.txt"
"$APPEND_T" 12345 "$TMPDIR_TEST/append.txt"
patched=$(cat "$TMPDIR_TEST/stub/patched-body.txt")
assert_contains "contains original body" "existing body" "$patched"
assert_contains "contains separator" "---" "$patched"
assert_contains "contains appended content" "appended content" "$patched"
teardown

# Test 5: append-pr-comment.sh preserves order: original -> separator -> appended
echo "Test 5: append-pr-comment.sh preserves order"
setup
echo "new stuff" > "$TMPDIR_TEST/append.txt"
"$APPEND_T" 12345 "$TMPDIR_TEST/append.txt"
patched=$(cat "$TMPDIR_TEST/stub/patched-body.txt")
orig_pos=$(echo "$patched" | grep -n "existing body" | head -1 | cut -d: -f1)
sep_pos=$(echo "$patched" | grep -n "^---$" | head -1 | cut -d: -f1)
new_pos=$(echo "$patched" | grep -n "new stuff" | head -1 | cut -d: -f1)
assert_eq "original before separator" "1" "$([ "$orig_pos" -lt "$sep_pos" ] && echo 1 || echo 0)"
assert_eq "separator before appended" "1" "$([ "$sep_pos" -lt "$new_pos" ] && echo 1 || echo 0)"
teardown

# Test 6: append-pr-comment.sh exits non-zero when comment ID unknown
echo "Test 6: append-pr-comment.sh exits non-zero for unknown comment ID"
setup
# Override gh stub to fail on unknown comment ID
cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
case "$1 $2" in
  "repo view") echo "owner/repo"; exit 0 ;;
  "api repos/owner/repo/issues/comments/99999")
    echo "Not Found" >&2; exit 1 ;;
  *) exit 1 ;;
esac
STUB
chmod +x "$TMPDIR_TEST/bin/gh"
echo "content" > "$TMPDIR_TEST/append.txt"
exit_code=0
"$APPEND_T" 99999 "$TMPDIR_TEST/append.txt" 2>/dev/null || exit_code=$?
assert_eq "exits non-zero" "1" "$([ "$exit_code" -ne 0 ] && echo 1 || echo 0)"
teardown

# Test 7: append-pr-comment.sh cleans up temp file after PATCH
echo "Test 7: append-pr-comment.sh cleans up temp file"
setup
echo "cleanup test" > "$TMPDIR_TEST/append.txt"
# Intercept mktemp to track temp file path
# We'll check /tmp for leftover files by counting before/after
tmp_count_before=$(ls /tmp/tmp.* 2>/dev/null | wc -l || echo 0)
"$APPEND_T" 12345 "$TMPDIR_TEST/append.txt"
tmp_count_after=$(ls /tmp/tmp.* 2>/dev/null | wc -l || echo 0)
assert_eq "no new temp files left" "$tmp_count_before" "$tmp_count_after"
teardown

# Summary
echo ""
echo "================================"
echo "Results: $PASS/$TOTAL passed, $FAIL failed"
echo "================================"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
