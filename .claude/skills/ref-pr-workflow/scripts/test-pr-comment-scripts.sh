#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
POST_SCRIPT="$SCRIPT_DIR/post-pr-comment.sh"

PASS=0
FAIL=0
TOTAL=0

setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/bin" "$TMPDIR_TEST/stub"

  # Copy script under test into temp dir
  cp "$POST_SCRIPT" "$TMPDIR_TEST/post-pr-comment.sh"
  chmod +x "$TMPDIR_TEST/post-pr-comment.sh"

  # Create gh stub
  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
# gh stub for testing post-pr-comment.sh

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
    # Save posted body for inspection
    if [ -n "$file_field" ] && [ -f "$file_field" ]; then
      cp "$file_field" "$STUB_DIR/posted-body.txt"
    fi
    if [ -n "$jq_filter" ]; then
      echo "12345"
    else
      echo '{"id": 12345}'
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
  POST_T="$TMPDIR_TEST/post-pr-comment.sh"
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

# Test 1: post-pr-comment.sh prints comment ID when given output file only
echo "Test 1: post-pr-comment.sh prints comment ID (output file only)"
setup
echo "hello world" > "$TMPDIR_TEST/output.txt"
output=$("$POST_T" 99 "$TMPDIR_TEST/output.txt")
assert_eq "prints comment ID" "12345" "$output"
teardown

# Test 2: post-pr-comment.sh posted body equals output file contents (no eval)
echo "Test 2: post-pr-comment.sh posted body equals output file (no eval)"
setup
printf 'output content' > "$TMPDIR_TEST/output.txt"
"$POST_T" 99 "$TMPDIR_TEST/output.txt" > /dev/null
posted=$(cat "$TMPDIR_TEST/stub/posted-body.txt")
assert_eq "body equals output file" "output content" "$posted"
teardown

# Test 3: post-pr-comment.sh body contains output, separator, and eval when eval file given
echo "Test 3: post-pr-comment.sh body contains output, separator, and eval"
setup
printf 'task output' > "$TMPDIR_TEST/output.txt"
printf 'eval results' > "$TMPDIR_TEST/eval.txt"
"$POST_T" 99 "$TMPDIR_TEST/output.txt" "$TMPDIR_TEST/eval.txt" > /dev/null
posted=$(cat "$TMPDIR_TEST/stub/posted-body.txt")
assert_contains "contains output" "task output" "$posted"
assert_contains "contains separator" "---" "$posted"
assert_contains "contains eval" "eval results" "$posted"
teardown

# Test 4: post-pr-comment.sh preserves order: output → separator → eval
echo "Test 4: post-pr-comment.sh preserves order: output then separator then eval"
setup
printf 'first content' > "$TMPDIR_TEST/output.txt"
printf 'last content' > "$TMPDIR_TEST/eval.txt"
"$POST_T" 99 "$TMPDIR_TEST/output.txt" "$TMPDIR_TEST/eval.txt" > /dev/null
posted=$(cat "$TMPDIR_TEST/stub/posted-body.txt")
out_pos=$(echo "$posted" | grep -n "first content" | head -1 | cut -d: -f1)
sep_pos=$(echo "$posted" | grep -n "^---$" | head -1 | cut -d: -f1)
eval_pos=$(echo "$posted" | grep -n "last content" | head -1 | cut -d: -f1)
assert_eq "output before separator" "1" "$([ "$out_pos" -lt "$sep_pos" ] && echo 1 || echo 0)"
assert_eq "separator before eval" "1" "$([ "$sep_pos" -lt "$eval_pos" ] && echo 1 || echo 0)"
teardown

# Test 5: post-pr-comment.sh exits non-zero when output file does not exist
echo "Test 5: post-pr-comment.sh exits non-zero for missing output file"
setup
exit_code=0
"$POST_T" 99 "$TMPDIR_TEST/nonexistent.txt" 2>/dev/null || exit_code=$?
assert_eq "exits non-zero" "1" "$([ "$exit_code" -ne 0 ] && echo 1 || echo 0)"
teardown

# Test 6: post-pr-comment.sh exits non-zero when eval file does not exist (output exists)
echo "Test 6: post-pr-comment.sh exits non-zero for missing eval file"
setup
echo "output content" > "$TMPDIR_TEST/output.txt"
exit_code=0
"$POST_T" 99 "$TMPDIR_TEST/output.txt" "$TMPDIR_TEST/nonexistent-eval.txt" 2>/dev/null || exit_code=$?
assert_eq "exits non-zero" "1" "$([ "$exit_code" -ne 0 ] && echo 1 || echo 0)"
teardown

# Test 7: post-pr-comment.sh cleans up temp file after POST
echo "Test 7: post-pr-comment.sh cleans up temp file after POST"
setup
echo "cleanup test" > "$TMPDIR_TEST/output.txt"
tmp_count_before=$(ls /tmp/tmp.* 2>/dev/null | wc -l || echo 0)
"$POST_T" 99 "$TMPDIR_TEST/output.txt" > /dev/null
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
