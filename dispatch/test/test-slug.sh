#!/usr/bin/env bash
# Unit tests for make_slug (sluggification of issue titles) in dispatch.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DISPATCH="$SCRIPT_DIR/../bin/dispatch"

# shellcheck disable=SC1090
source "$DISPATCH"

PASS=0
FAIL=0
TOTAL=0

assert_eq() {
  local label="$1" expected="$2" actual="$3"
  TOTAL=$((TOTAL + 1))
  if [[ "$expected" == "$actual" ]]; then
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label"
    echo "    expected: '$expected'"
    echo "    actual:   '$actual'"
  fi
}

# --- cases ------------------------------------------------------------------

# Real issue title — full sanitized form exceeds 32, so must be truncated.
# "562-" (4 chars) + slug ≤ 28 chars.
assert_eq "long title truncates at 32" \
  "562-build-dispatcher-infrastruct" \
  "$(make_slug "Build dispatcher infrastructure and implementation phase" 562)"

# Single short word.
assert_eq "single word lowercased" \
  "1-simple" \
  "$(make_slug "Simple" 1)"

# Punctuation + spaces collapse to dashes.
assert_eq "punctuation collapses to dashes" \
  "42-hello-world" \
  "$(make_slug "Hello World!" 42)"

# Leading / trailing whitespace trimmed.
assert_eq "leading/trailing spaces stripped" \
  "100-leading-and-trailing-spaces" \
  "$(make_slug "  leading and trailing spaces  " 100)"

# 40 'A's with issue-num 5: max slug = 32 - 1 - 1 = 30. Output is 5- + 30 a's.
assert_eq "truncation respects 32-char total cap" \
  "5-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
  "$(make_slug "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" 5)"

# Consecutive dashes in input collapse.
assert_eq "consecutive dashes collapse" \
  "10-dashes" \
  "$(make_slug "---dashes---" 10)"

# Non-ASCII characters are treated as non-alnum (replaced with dashes).
assert_eq "unicode emoji treated as non-alnum" \
  "7-emoji-test" \
  "$(make_slug "Emoji 🚀 test" 7)"

# All-non-alnum input produces an empty slug; make_slug now exits non-zero
# with an error message rather than producing a bare "<num>-" branch name.
TOTAL=$((TOTAL + 1))
if ! make_slug "!!!" 99 >/dev/null 2>&1; then
  PASS=$((PASS + 1))
  echo "  PASS: all-symbol input exits non-zero (empty slug rejected)"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL: all-symbol input should have exited non-zero"
fi

# Output length sanity: must never exceed 32.
BIG=$(make_slug "$(printf 'word %.0s' {1..50})" 123)
TOTAL=$((TOTAL + 1))
if [[ "${#BIG}" -le 32 ]]; then
  PASS=$((PASS + 1))
  echo "  PASS: output length ≤ 32 (got ${#BIG}: '$BIG')"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL: output length > 32 (got ${#BIG}: '$BIG')"
fi

# --- report -----------------------------------------------------------------
echo ""
echo "================================"
echo "Results: $PASS/$TOTAL passed, $FAIL failed"
echo "================================"
[[ "$FAIL" -eq 0 ]]
