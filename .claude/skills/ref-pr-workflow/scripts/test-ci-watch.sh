#!/usr/bin/env bash
# Tests for run-ci-watch.sh argument parsing and gh invocation
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"
SCRIPT="$SCRIPT_DIR/run-ci-watch.sh"
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
TMP_DIR="$REPO_ROOT/tmp/test-ci-watch"

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

setup() {
  rm -rf "$TMP_DIR"
  mkdir -p "$TMP_DIR"
}

assert_exit_nonzero() {
  local label="$1"
  shift
  TOTAL=$((TOTAL + 1))
  if "$@" 2>/dev/null; then
    echo "  FAIL: $label — expected non-zero exit"
    FAIL=$((FAIL + 1))
  else
    echo "  PASS: $label"
    PASS=$((PASS + 1))
  fi
}

# Create a fake gh that succeeds — echoes args and exits 0
make_mock_gh() {
  local dir="$1" exit_code="${2:-0}"
  mkdir -p "$dir"
  cat > "$dir/gh" <<MOCK
#!/usr/bin/env bash
echo "gh \$*"
exit $exit_code
MOCK
  chmod +x "$dir/gh"
}

# --- Tests ---

test_missing_run_id() {
  assert_exit_nonzero "missing run-id exits non-zero" "$SCRIPT"
}

test_invalid_run_id_string() {
  assert_exit_nonzero "non-integer run-id exits non-zero" "$SCRIPT" "abc"
}

test_invalid_run_id_zero() {
  assert_exit_nonzero "zero run-id exits non-zero" "$SCRIPT" "0"
}

test_invalid_run_id_negative() {
  assert_exit_nonzero "negative run-id exits non-zero" "$SCRIPT" "-5"
}

test_output_missing_argument() {
  assert_exit_nonzero "--output without argument exits non-zero" "$SCRIPT" "123" "--output"
}

test_delay_missing_argument() {
  assert_exit_nonzero "--delay without argument exits non-zero" "$SCRIPT" "123" "--delay"
}

test_delay_non_integer() {
  assert_exit_nonzero "--delay with non-integer exits non-zero" "$SCRIPT" "123" "--delay" "abc"
}

test_unknown_flag() {
  assert_exit_nonzero "unknown flag exits non-zero" "$SCRIPT" "123" "--bogus"
}

test_valid_args_succeeds() {
  setup
  make_mock_gh "$TMP_DIR/bin" 0

  local output
  output=$(PATH="$TMP_DIR/bin:$PATH" "$SCRIPT" "42" 2>&1)
  local rc=$?

  assert_eq "valid args: exits 0" "0" "$rc"
  assert_contains "valid args: calls gh with run-id" "42" "$output"
  assert_contains "valid args: passes --exit-status" "--exit-status" "$output"
}

test_output_flag_creates_file() {
  setup
  make_mock_gh "$TMP_DIR/bin" 0
  local outfile="$TMP_DIR/ci-output.txt"

  PATH="$TMP_DIR/bin:$PATH" "$SCRIPT" "42" --output "$outfile" 2>&1

  TOTAL=$((TOTAL + 1))
  if [[ -f "$outfile" ]]; then
    echo "  PASS: --output creates file"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: --output creates file — file not found: $outfile"
    FAIL=$((FAIL + 1))
  fi
}

test_gh_failure_exits_nonzero() {
  setup
  make_mock_gh "$TMP_DIR/bin" 1

  TOTAL=$((TOTAL + 1))
  if PATH="$TMP_DIR/bin:$PATH" "$SCRIPT" "42" 2>/dev/null; then
    echo "  FAIL: gh failure exits non-zero — expected non-zero exit"
    FAIL=$((FAIL + 1))
  else
    echo "  PASS: gh failure exits non-zero"
    PASS=$((PASS + 1))
  fi
}

# --- Run ---

test_missing_run_id
test_invalid_run_id_string
test_invalid_run_id_zero
test_invalid_run_id_negative
test_output_missing_argument
test_delay_missing_argument
test_delay_non_integer
test_unknown_flag
test_valid_args_succeeds
test_output_flag_creates_file
test_gh_failure_exits_nonzero

report_results
