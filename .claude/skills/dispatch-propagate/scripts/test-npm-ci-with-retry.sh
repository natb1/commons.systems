#!/usr/bin/env bash
# Tests for npm-ci-with-retry -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 18167-18288.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# npm-ci-with-retry.sh tests
# ============================================================================
echo ""
echo "=== npm-ci-with-retry.sh ==="

# These tests stub npm and sleep on PATH, then invoke the script directly.

# 1. npm-ci-with-retry.sh succeeds on first attempt.
echo "Test: npm-ci-with-retry.sh succeeds on first attempt"
TMPDIR_TEST=$(mktemp -d)
STUB_DIR="$TMPDIR_TEST/stub"
mkdir -p "$STUB_DIR"

cat > "$STUB_DIR/npm" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")" && pwd)"
count_file="$STUB_DIR/npm-count"
count=0
[ -f "$count_file" ] && count=$(cat "$count_file")
count=$((count + 1))
echo "$count" > "$count_file"
exit 0
STUB
chmod +x "$STUB_DIR/npm"

cat > "$STUB_DIR/sleep" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
chmod +x "$STUB_DIR/sleep"

export PATH="$STUB_DIR:$SAVED_PATH"
rc=0
"$SCRIPT_DIR/npm-ci-with-retry.sh" || rc=$?
assert_eq "npm-ci-with-retry.sh succeeds on attempt 1 (exit code)" "0" "$rc"
npm_count=0
[ -f "$STUB_DIR/npm-count" ] && npm_count=$(cat "$STUB_DIR/npm-count")
assert_eq "npm-ci-with-retry.sh called npm exactly 1 time" "1" "$npm_count"

rm -rf "$TMPDIR_TEST"
TMPDIR_TEST=""
STUB_DIR=""
export PATH="$SAVED_PATH"

# 2. npm-ci-with-retry.sh retries and succeeds on attempt 3.
echo "Test: npm-ci-with-retry.sh retries and succeeds on attempt 3"
TMPDIR_TEST=$(mktemp -d)
STUB_DIR="$TMPDIR_TEST/stub"
mkdir -p "$STUB_DIR"

cat > "$STUB_DIR/npm" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")" && pwd)"
count_file="$STUB_DIR/npm-count"
count=0
[ -f "$count_file" ] && count=$(cat "$count_file")
count=$((count + 1))
echo "$count" > "$count_file"
if [ "$count" -lt 3 ]; then
  exit 1
fi
exit 0
STUB
chmod +x "$STUB_DIR/npm"

cat > "$STUB_DIR/sleep" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
chmod +x "$STUB_DIR/sleep"

export PATH="$STUB_DIR:$SAVED_PATH"
rc=0
"$SCRIPT_DIR/npm-ci-with-retry.sh" || rc=$?
assert_eq "npm-ci-with-retry.sh succeeds on attempt 3 (exit code)" "0" "$rc"
npm_count=0
[ -f "$STUB_DIR/npm-count" ] && npm_count=$(cat "$STUB_DIR/npm-count")
assert_eq "npm-ci-with-retry.sh called npm exactly 3 times" "3" "$npm_count"

rm -rf "$TMPDIR_TEST"
TMPDIR_TEST=""
STUB_DIR=""
export PATH="$SAVED_PATH"

# 3. npm-ci-with-retry.sh fails after exhausting all 3 attempts.
echo "Test: npm-ci-with-retry.sh fails after exhausting all 3 attempts"
TMPDIR_TEST=$(mktemp -d)
STUB_DIR="$TMPDIR_TEST/stub"
mkdir -p "$STUB_DIR"

cat > "$STUB_DIR/npm" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")" && pwd)"
count_file="$STUB_DIR/npm-count"
count=0
[ -f "$count_file" ] && count=$(cat "$count_file")
count=$((count + 1))
echo "$count" > "$count_file"
exit 1
STUB
chmod +x "$STUB_DIR/npm"

cat > "$STUB_DIR/sleep" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
chmod +x "$STUB_DIR/sleep"

export PATH="$STUB_DIR:$SAVED_PATH"
rc=0
"$SCRIPT_DIR/npm-ci-with-retry.sh" || rc=$?
assert_eq "npm-ci-with-retry.sh returns non-zero after 3 failed attempts" "1" "$rc"
npm_count=0
[ -f "$STUB_DIR/npm-count" ] && npm_count=$(cat "$STUB_DIR/npm-count")
assert_eq "npm-ci-with-retry.sh tried npm exactly 3 times before giving up" "3" "$npm_count"

rm -rf "$TMPDIR_TEST"
TMPDIR_TEST=""
STUB_DIR=""
export PATH="$SAVED_PATH"

# <<< END MOVED <<<

report_results
