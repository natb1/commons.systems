#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
POST_SCRIPT="$SCRIPT_DIR/post-pr-comment.sh"

PASS=0
FAIL=0
TOTAL=0

setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/bin" "$TMPDIR_TEST/stub" "$TMPDIR_TEST/mktemp-dir"

  # Copy script under test into temp dir
  cp "$POST_SCRIPT" "$TMPDIR_TEST/post-pr-comment.sh"
  chmod +x "$TMPDIR_TEST/post-pr-comment.sh"

  # Create gh stub
  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
# gh stub for testing post-pr-comment.sh

STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"

case "$1" in
  "repo")
    case "$2" in
      "view")
        echo "owner/repo"
        exit 0
        ;;
    esac
    ;;
  "api")
    case "$2" in
      # Hardcoded to PR 99 — all tests must use PR number 99 when calling post-pr-comment.sh
      "repos/owner/repo/issues/99/comments")
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
        if [ -n "$file_field" ]; then
          if [ ! -f "$file_field" ]; then
            echo "stub: file not found: $file_field" >&2
            exit 1
          fi
          cp "$file_field" "$STUB_DIR/posted-body.txt"
        fi
        if [ -n "$jq_filter" ]; then
          echo "12345"
        else
          echo '{"id": 12345}'
        fi
        exit 0
        ;;
    esac
    ;;
esac
echo "stub: unknown invocation: $*" >&2
exit 1
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

echo "Test 1: post-pr-comment.sh prints comment ID (output file only)"
setup
echo "hello world" > "$TMPDIR_TEST/output.txt"
output=$("$POST_T" 99 "$TMPDIR_TEST/output.txt")
assert_eq "prints comment ID" "12345" "$output"
teardown

echo "Test 2: post-pr-comment.sh posted body equals output file (no eval)"
setup
printf 'output content' > "$TMPDIR_TEST/output.txt"
"$POST_T" 99 "$TMPDIR_TEST/output.txt" > /dev/null
posted=$(cat "$TMPDIR_TEST/stub/posted-body.txt")
assert_eq "body equals output file" "output content" "$posted"
teardown

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

echo "Test 4: post-pr-comment.sh preserves order: output then separator then eval"
setup
printf 'first content' > "$TMPDIR_TEST/output.txt"
printf 'last content' > "$TMPDIR_TEST/eval.txt"
"$POST_T" 99 "$TMPDIR_TEST/output.txt" "$TMPDIR_TEST/eval.txt" > /dev/null
posted=$(cat "$TMPDIR_TEST/stub/posted-body.txt")
out_pos=$(echo "$posted" | grep -n "first content" | head -1 | cut -d: -f1)
sep_pos=$(echo "$posted" | grep -n "^---$" | head -1 | cut -d: -f1)
eval_pos=$(echo "$posted" | grep -n "last content" | head -1 | cut -d: -f1)
assert_eq "output before separator" "true" "$([ "$out_pos" -lt "$sep_pos" ] && echo true || echo false)"
assert_eq "separator before eval" "true" "$([ "$sep_pos" -lt "$eval_pos" ] && echo true || echo false)"
teardown

echo "Test 5: post-pr-comment.sh exits non-zero for missing output file"
setup
exit_code=0
stderr=$("$POST_T" 99 "$TMPDIR_TEST/nonexistent.txt" 2>&1 >/dev/null) || exit_code=$?
assert_eq "exits with code 1" "1" "$exit_code"
assert_contains "error message mentions missing file" "output file not found" "$stderr"
teardown

echo "Test 6: post-pr-comment.sh exits non-zero for missing eval file"
setup
echo "output content" > "$TMPDIR_TEST/output.txt"
exit_code=0
stderr=$("$POST_T" 99 "$TMPDIR_TEST/output.txt" "$TMPDIR_TEST/nonexistent-eval.txt" 2>&1 >/dev/null) || exit_code=$?
assert_eq "exits with code 1" "1" "$exit_code"
assert_contains "error message mentions missing eval file" "eval file not found" "$stderr"
teardown

echo "Test 7: post-pr-comment.sh cleans up temp file after POST"
setup
echo "cleanup test" > "$TMPDIR_TEST/output.txt"
# Direct mktemp into a controlled directory so we can check it without
# interference from other processes creating files in /tmp
TMPDIR="$TMPDIR_TEST/mktemp-dir" "$POST_T" 99 "$TMPDIR_TEST/output.txt" > /dev/null
if [ ! -d "$TMPDIR_TEST/mktemp-dir" ]; then
  FAIL=$((FAIL + 1))
  TOTAL=$((TOTAL + 1))
  echo "  FAIL: mktemp-dir does not exist — test precondition failed"
else
  remaining=$(find "$TMPDIR_TEST/mktemp-dir" -maxdepth 1 -mindepth 1 | wc -l)
  assert_eq "no new temp files left" "0" "$remaining"
fi
teardown

# Summary
echo ""
echo "================================"
echo "Results: $PASS/$TOTAL passed, $FAIL failed"
echo "================================"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
