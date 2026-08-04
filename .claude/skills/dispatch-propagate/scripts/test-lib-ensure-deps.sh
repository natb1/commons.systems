#!/usr/bin/env bash
# Tests for lib-ensure-deps -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 18065-18166.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# ensure_deps (lib.sh) retry tests
# ============================================================================
echo ""
echo "=== ensure_deps retry ==="

# These tests use a fresh TMPDIR_TEST with a STUB_DIR holding npm and sleep
# shims on PATH. lib.sh is sourced from SCRIPT_DIR (not the TMPDIR_TEST copy)
# so ensure_deps resolves directly. REPO_ROOT is a fresh tmpdir with no
# node_modules — forcing the install branch every time.

# 1. ensure_deps retries and succeeds on attempt 3.
echo "Test: ensure_deps retries and succeeds on attempt 3"
TMPDIR_TEST=$(mktemp -d)
STUB_DIR="$TMPDIR_TEST/stub"
mkdir -p "$STUB_DIR"
REPO_ROOT_TEST=$(mktemp -d)

# npm stub: fail on calls 1 and 2; succeed on call 3.
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

# sleep stub: no-op.
cat > "$STUB_DIR/sleep" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
chmod +x "$STUB_DIR/sleep"

export PATH="$STUB_DIR:$SAVED_PATH"
rc=0
( export REPO_ROOT="$REPO_ROOT_TEST"; source "$SCRIPT_DIR/lib.sh"; ensure_deps ) || rc=$?
assert_eq "ensure_deps succeeds on attempt 3 (exit code)" "0" "$rc"
npm_count=0
[ -f "$STUB_DIR/npm-count" ] && npm_count=$(cat "$STUB_DIR/npm-count")
assert_eq "ensure_deps called npm exactly 3 times" "3" "$npm_count"

rm -rf "$TMPDIR_TEST" "$REPO_ROOT_TEST"
TMPDIR_TEST=""
STUB_DIR=""
export PATH="$SAVED_PATH"

# 2. ensure_deps fails after exhausting all 3 attempts.
echo "Test: ensure_deps fails after exhausting all 3 attempts"
TMPDIR_TEST=$(mktemp -d)
STUB_DIR="$TMPDIR_TEST/stub"
mkdir -p "$STUB_DIR"
REPO_ROOT_TEST=$(mktemp -d)

# npm stub: always fails.
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

# sleep stub: no-op.
cat > "$STUB_DIR/sleep" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
chmod +x "$STUB_DIR/sleep"

export PATH="$STUB_DIR:$SAVED_PATH"
rc=0
( export REPO_ROOT="$REPO_ROOT_TEST"; source "$SCRIPT_DIR/lib.sh"; ensure_deps ) || rc=$?
TOTAL=$((TOTAL + 1))
if [ "$rc" -ne 0 ]; then
  PASS=$((PASS + 1))
  echo "  PASS: ensure_deps returns non-zero after 3 failed attempts"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL: ensure_deps returns non-zero after 3 failed attempts"
  echo "    expected non-zero, got 0"
fi
npm_count=0
[ -f "$STUB_DIR/npm-count" ] && npm_count=$(cat "$STUB_DIR/npm-count")
assert_eq "ensure_deps tried npm exactly 3 times before giving up" "3" "$npm_count"

rm -rf "$TMPDIR_TEST" "$REPO_ROOT_TEST"
TMPDIR_TEST=""
STUB_DIR=""
export PATH="$SAVED_PATH"

# <<< END MOVED <<<

report_results
