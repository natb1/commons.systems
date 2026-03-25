#!/usr/bin/env bash
set -euo pipefail

# Unit tests for firebase-auth.sh and firebase-auth-cleanup.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

TEST_TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TEST_TMPDIR"' EXIT

PASS_FILE="${TEST_TMPDIR}/.pass_count"
FAIL_FILE="${TEST_TMPDIR}/.fail_count"
echo 0 > "$PASS_FILE"
echo 0 > "$FAIL_FILE"

pass() {
  echo "  PASS: $1"
  echo $(( $(cat "$PASS_FILE") + 1 )) > "$PASS_FILE"
}
fail() {
  echo "  FAIL: $1"
  echo $(( $(cat "$FAIL_FILE") + 1 )) > "$FAIL_FILE"
}

echo "=== Test: auth script writes credentials and sets GITHUB_ENV vars ==="
(
  GITHUB_ENV="${TEST_TMPDIR}/github_env"
  > "$GITHUB_ENV"
  export GITHUB_ENV
  export FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"test"}'

  "$SCRIPT_DIR/firebase-auth.sh"

  if grep -q '^GOOGLE_APPLICATION_CREDENTIALS=' "$GITHUB_ENV" && \
     grep -q '^CREDS_FILE=' "$GITHUB_ENV"; then
    pass "auth sets GOOGLE_APPLICATION_CREDENTIALS and CREDS_FILE"
  else
    fail "auth did not set expected GITHUB_ENV vars"
  fi

  CREDS_FILE=$(grep '^CREDS_FILE=' "$GITHUB_ENV" | cut -d= -f2)
  if [ -f "$CREDS_FILE" ] && grep -q '"project_id"' "$CREDS_FILE"; then
    pass "auth writes credentials to temp file"
  else
    fail "credentials file missing or has wrong content"
  fi

  rm -f "$CREDS_FILE"
)

echo ""
echo "=== Test: auth script exports FIREBASE_PROJECT_ID when set ==="
(
  GITHUB_ENV="${TEST_TMPDIR}/github_env_pid"
  > "$GITHUB_ENV"
  export GITHUB_ENV
  export FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account"}'
  export FIREBASE_PROJECT_ID="my-project-123"

  "$SCRIPT_DIR/firebase-auth.sh"

  if grep -q '^FIREBASE_PROJECT_ID=my-project-123$' "$GITHUB_ENV"; then
    pass "auth exports FIREBASE_PROJECT_ID when set"
  else
    fail "auth did not export FIREBASE_PROJECT_ID"
  fi

  CREDS_FILE=$(grep '^CREDS_FILE=' "$GITHUB_ENV" | cut -d= -f2)
  rm -f "$CREDS_FILE"
)

echo ""
echo "=== Test: auth script omits FIREBASE_PROJECT_ID when unset ==="
(
  GITHUB_ENV="${TEST_TMPDIR}/github_env_nopid"
  > "$GITHUB_ENV"
  export GITHUB_ENV
  export FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account"}'
  unset FIREBASE_PROJECT_ID 2>/dev/null || true

  "$SCRIPT_DIR/firebase-auth.sh"

  if grep -q 'FIREBASE_PROJECT_ID' "$GITHUB_ENV"; then
    fail "auth should not export FIREBASE_PROJECT_ID when unset"
  else
    pass "auth omits FIREBASE_PROJECT_ID when unset"
  fi

  CREDS_FILE=$(grep '^CREDS_FILE=' "$GITHUB_ENV" | cut -d= -f2)
  rm -f "$CREDS_FILE"
)

echo ""
echo "=== Test: cleanup script removes credentials file ==="
(
  CREDS_FILE="${TEST_TMPDIR}/creds.json"
  echo '{}' > "$CREDS_FILE"
  export CREDS_FILE

  "$SCRIPT_DIR/firebase-auth-cleanup.sh"

  if [ ! -f "$CREDS_FILE" ]; then
    pass "cleanup removes credentials file"
  else
    fail "cleanup did not remove credentials file"
  fi
)

echo ""
echo "=== Test: cleanup script succeeds when CREDS_FILE is unset ==="
(
  unset CREDS_FILE 2>/dev/null || true

  if "$SCRIPT_DIR/firebase-auth-cleanup.sh"; then
    pass "cleanup succeeds when CREDS_FILE unset"
  else
    fail "cleanup failed when CREDS_FILE unset"
  fi
)

FINAL_PASS=$(cat "$PASS_FILE")
FINAL_FAIL=$(cat "$FAIL_FILE")

echo ""
echo "========================================"
echo "  Results: $FINAL_PASS passed, $FINAL_FAIL failed"
echo "========================================"

if [ "$FINAL_FAIL" -gt 0 ]; then
  exit 1
fi
