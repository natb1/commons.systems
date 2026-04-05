#!/usr/bin/env bash
set -euo pipefail

# Unit tests for cloudflare-purge.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

TEST_TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TEST_TMPDIR"' EXIT

# File-based counters (subprocess-safe)
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

# Create mock bin directory
MOCK_BIN="${TEST_TMPDIR}/bin"
mkdir -p "$MOCK_BIN"

# --- Test: skips purge when no files changed ---
echo "=== Test: skips purge when no files changed ==="
(
  cat > "${MOCK_BIN}/git" << 'MOCK'
#!/usr/bin/env bash
# Return empty diff
exit 0
MOCK
  chmod +x "${MOCK_BIN}/git"

  CURL_LOG="${TEST_TMPDIR}/curl_skip.log"
  cat > "${MOCK_BIN}/curl" << MOCK
#!/usr/bin/env bash
echo "curl called" >> "${CURL_LOG}"
MOCK
  chmod +x "${MOCK_BIN}/curl"

  export CLOUDFLARE_ZONE_ID="test-zone"
  export CLOUDFLARE_API_TOKEN="test-token"
  OUTPUT=$(PATH="${MOCK_BIN}:${PATH}" "$SCRIPT_DIR/cloudflare-purge.sh" fellspiral 2>&1)

  if echo "$OUTPUT" | grep -q "Skipping Cloudflare purge"; then
    pass "skips purge when no files changed"
  else
    fail "expected skip message, got: $OUTPUT"
  fi

  if [ -f "$CURL_LOG" ]; then
    fail "curl should not have been called"
  else
    pass "curl was not called"
  fi
)

# --- Test: maps public/ files to correct URLs ---
echo "=== Test: maps public/ files to correct URLs ==="
(
  cat > "${MOCK_BIN}/git" << 'MOCK'
#!/usr/bin/env bash
if [[ "$*" == *"diff"* ]]; then
  echo "fellspiral/public/robots.txt"
  echo "fellspiral/public/fonts/inter.woff2"
fi
MOCK
  chmod +x "${MOCK_BIN}/git"

  CURL_BODY="${TEST_TMPDIR}/curl_body_public.json"
  cat > "${MOCK_BIN}/curl" << MOCK
#!/usr/bin/env bash
# Capture the -d argument
while [ \$# -gt 0 ]; do
  case "\$1" in
    -d) echo "\$2" > "${CURL_BODY}"; shift ;;
  esac
  shift
done
echo '{"success":true}'
MOCK
  chmod +x "${MOCK_BIN}/curl"

  # Use real jq
  JQ_PATH=$(command -v jq)
  cat > "${MOCK_BIN}/jq" << MOCK
#!/usr/bin/env bash
exec "$JQ_PATH" "\$@"
MOCK
  chmod +x "${MOCK_BIN}/jq"

  export CLOUDFLARE_ZONE_ID="test-zone"
  export CLOUDFLARE_API_TOKEN="test-token"
  PATH="${MOCK_BIN}:${PATH}" "$SCRIPT_DIR/cloudflare-purge.sh" fellspiral > /dev/null 2>&1

  if [ -f "$CURL_BODY" ]; then
    BODY=$(cat "$CURL_BODY")
    if echo "$BODY" | "$JQ_PATH" -e '.files | index("https://fellspiral.commons.systems/robots.txt")' > /dev/null 2>&1; then
      pass "maps public/robots.txt to correct URL"
    else
      fail "missing robots.txt URL in: $BODY"
    fi
    if echo "$BODY" | "$JQ_PATH" -e '.files | index("https://fellspiral.commons.systems/fonts/inter.woff2")' > /dev/null 2>&1; then
      pass "maps public/fonts/inter.woff2 to correct URL"
    else
      fail "missing fonts URL in: $BODY"
    fi
  else
    fail "curl was not called"
  fi
)

# --- Test: maps index.html to root and /index.html ---
echo "=== Test: maps index.html to root and /index.html ==="
(
  cat > "${MOCK_BIN}/git" << 'MOCK'
#!/usr/bin/env bash
if [[ "$*" == *"diff"* ]]; then
  echo "fellspiral/index.html"
fi
MOCK
  chmod +x "${MOCK_BIN}/git"

  CURL_BODY="${TEST_TMPDIR}/curl_body_index.json"
  cat > "${MOCK_BIN}/curl" << MOCK
#!/usr/bin/env bash
while [ \$# -gt 0 ]; do
  case "\$1" in
    -d) echo "\$2" > "${CURL_BODY}"; shift ;;
  esac
  shift
done
echo '{"success":true}'
MOCK
  chmod +x "${MOCK_BIN}/curl"

  JQ_PATH=$(command -v jq)
  cat > "${MOCK_BIN}/jq" << MOCK
#!/usr/bin/env bash
exec "$JQ_PATH" "\$@"
MOCK
  chmod +x "${MOCK_BIN}/jq"

  export CLOUDFLARE_ZONE_ID="test-zone"
  export CLOUDFLARE_API_TOKEN="test-token"
  PATH="${MOCK_BIN}:${PATH}" "$SCRIPT_DIR/cloudflare-purge.sh" fellspiral > /dev/null 2>&1

  if [ -f "$CURL_BODY" ]; then
    BODY=$(cat "$CURL_BODY")
    if echo "$BODY" | "$JQ_PATH" -e '.files | index("https://fellspiral.commons.systems/")' > /dev/null 2>&1; then
      pass "index.html maps to root URL"
    else
      fail "missing root URL in: $BODY"
    fi
    if echo "$BODY" | "$JQ_PATH" -e '.files | index("https://fellspiral.commons.systems/index.html")' > /dev/null 2>&1; then
      pass "index.html maps to /index.html URL"
    else
      fail "missing /index.html URL in: $BODY"
    fi
  else
    fail "curl was not called"
  fi
)

# --- Test: landing app uses bare domain ---
echo "=== Test: landing app uses bare domain ==="
(
  cat > "${MOCK_BIN}/git" << 'MOCK'
#!/usr/bin/env bash
if [[ "$*" == *"diff"* ]]; then
  echo "landing/index.html"
fi
MOCK
  chmod +x "${MOCK_BIN}/git"

  CURL_BODY="${TEST_TMPDIR}/curl_body_landing.json"
  cat > "${MOCK_BIN}/curl" << MOCK
#!/usr/bin/env bash
while [ \$# -gt 0 ]; do
  case "\$1" in
    -d) echo "\$2" > "${CURL_BODY}"; shift ;;
  esac
  shift
done
echo '{"success":true}'
MOCK
  chmod +x "${MOCK_BIN}/curl"

  JQ_PATH=$(command -v jq)
  cat > "${MOCK_BIN}/jq" << MOCK
#!/usr/bin/env bash
exec "$JQ_PATH" "\$@"
MOCK
  chmod +x "${MOCK_BIN}/jq"

  export CLOUDFLARE_ZONE_ID="test-zone"
  export CLOUDFLARE_API_TOKEN="test-token"
  PATH="${MOCK_BIN}:${PATH}" "$SCRIPT_DIR/cloudflare-purge.sh" landing > /dev/null 2>&1

  if [ -f "$CURL_BODY" ]; then
    BODY=$(cat "$CURL_BODY")
    if echo "$BODY" | "$JQ_PATH" -e '.files | index("https://commons.systems/")' > /dev/null 2>&1; then
      pass "landing uses bare domain commons.systems"
    else
      fail "expected commons.systems, got: $BODY"
    fi
  else
    fail "curl was not called"
  fi
)

# --- Test: other apps use subdomain ---
echo "=== Test: other apps use subdomain ==="
(
  cat > "${MOCK_BIN}/git" << 'MOCK'
#!/usr/bin/env bash
if [[ "$*" == *"diff"* ]]; then
  echo "budget/index.html"
fi
MOCK
  chmod +x "${MOCK_BIN}/git"

  CURL_BODY="${TEST_TMPDIR}/curl_body_budget.json"
  cat > "${MOCK_BIN}/curl" << MOCK
#!/usr/bin/env bash
while [ \$# -gt 0 ]; do
  case "\$1" in
    -d) echo "\$2" > "${CURL_BODY}"; shift ;;
  esac
  shift
done
echo '{"success":true}'
MOCK
  chmod +x "${MOCK_BIN}/curl"

  JQ_PATH=$(command -v jq)
  cat > "${MOCK_BIN}/jq" << MOCK
#!/usr/bin/env bash
exec "$JQ_PATH" "\$@"
MOCK
  chmod +x "${MOCK_BIN}/jq"

  export CLOUDFLARE_ZONE_ID="test-zone"
  export CLOUDFLARE_API_TOKEN="test-token"
  PATH="${MOCK_BIN}:${PATH}" "$SCRIPT_DIR/cloudflare-purge.sh" budget > /dev/null 2>&1

  if [ -f "$CURL_BODY" ]; then
    BODY=$(cat "$CURL_BODY")
    if echo "$BODY" | "$JQ_PATH" -e '.files | index("https://budget.commons.systems/")' > /dev/null 2>&1; then
      pass "budget uses subdomain budget.commons.systems"
    else
      fail "expected budget.commons.systems, got: $BODY"
    fi
  else
    fail "curl was not called"
  fi
)

# --- Test: filters out assets/ paths ---
echo "=== Test: filters out assets/ paths ==="
(
  cat > "${MOCK_BIN}/git" << 'MOCK'
#!/usr/bin/env bash
if [[ "$*" == *"diff"* ]]; then
  echo "fellspiral/public/assets/hashed.js"
  echo "fellspiral/public/favicon.ico"
fi
MOCK
  chmod +x "${MOCK_BIN}/git"

  CURL_BODY="${TEST_TMPDIR}/curl_body_filter.json"
  cat > "${MOCK_BIN}/curl" << MOCK
#!/usr/bin/env bash
while [ \$# -gt 0 ]; do
  case "\$1" in
    -d) echo "\$2" > "${CURL_BODY}"; shift ;;
  esac
  shift
done
echo '{"success":true}'
MOCK
  chmod +x "${MOCK_BIN}/curl"

  JQ_PATH=$(command -v jq)
  cat > "${MOCK_BIN}/jq" << MOCK
#!/usr/bin/env bash
exec "$JQ_PATH" "\$@"
MOCK
  chmod +x "${MOCK_BIN}/jq"

  export CLOUDFLARE_ZONE_ID="test-zone"
  export CLOUDFLARE_API_TOKEN="test-token"
  PATH="${MOCK_BIN}:${PATH}" "$SCRIPT_DIR/cloudflare-purge.sh" fellspiral > /dev/null 2>&1

  if [ -f "$CURL_BODY" ]; then
    BODY=$(cat "$CURL_BODY")
    if echo "$BODY" | "$JQ_PATH" -e '.files | index("https://fellspiral.commons.systems/favicon.ico")' > /dev/null 2>&1; then
      pass "includes non-asset file"
    else
      fail "missing favicon.ico URL in: $BODY"
    fi
    if echo "$BODY" | "$JQ_PATH" -e '.files | index("https://fellspiral.commons.systems/assets/hashed.js")' > /dev/null 2>&1; then
      fail "should have filtered out assets/ path"
    else
      pass "assets/ path filtered out"
    fi
  else
    fail "curl was not called"
  fi
)

# --- Test: fails on missing CLOUDFLARE_ZONE_ID ---
echo "=== Test: fails on missing CLOUDFLARE_ZONE_ID ==="
(
  unset CLOUDFLARE_ZONE_ID 2>/dev/null || true
  export CLOUDFLARE_API_TOKEN="test-token"
  if OUTPUT=$(PATH="${MOCK_BIN}:${PATH}" "$SCRIPT_DIR/cloudflare-purge.sh" fellspiral 2>&1); then
    fail "should have exited non-zero"
  else
    if echo "$OUTPUT" | grep -q "CLOUDFLARE_ZONE_ID"; then
      pass "fails with clear message for missing CLOUDFLARE_ZONE_ID"
    else
      fail "expected CLOUDFLARE_ZONE_ID in error, got: $OUTPUT"
    fi
  fi
)

# --- Test: fails on missing CLOUDFLARE_API_TOKEN ---
echo "=== Test: fails on missing CLOUDFLARE_API_TOKEN ==="
(
  export CLOUDFLARE_ZONE_ID="test-zone"
  unset CLOUDFLARE_API_TOKEN 2>/dev/null || true
  if OUTPUT=$(PATH="${MOCK_BIN}:${PATH}" "$SCRIPT_DIR/cloudflare-purge.sh" fellspiral 2>&1); then
    fail "should have exited non-zero"
  else
    if echo "$OUTPUT" | grep -q "CLOUDFLARE_API_TOKEN"; then
      pass "fails with clear message for missing CLOUDFLARE_API_TOKEN"
    else
      fail "expected CLOUDFLARE_API_TOKEN in error, got: $OUTPUT"
    fi
  fi
)

# --- Test: fails when Cloudflare API returns success:false ---
echo "=== Test: fails on Cloudflare API error ==="
(
  cat > "${MOCK_BIN}/git" << 'MOCK'
#!/usr/bin/env bash
if [[ "$*" == *"diff"* ]]; then
  echo "fellspiral/index.html"
fi
MOCK
  chmod +x "${MOCK_BIN}/git"

  cat > "${MOCK_BIN}/curl" << 'MOCK'
#!/usr/bin/env bash
echo '{"success":false,"errors":[{"message":"Invalid zone"}]}'
MOCK
  chmod +x "${MOCK_BIN}/curl"

  JQ_PATH=$(command -v jq)
  cat > "${MOCK_BIN}/jq" << MOCK
#!/usr/bin/env bash
exec "$JQ_PATH" "\$@"
MOCK
  chmod +x "${MOCK_BIN}/jq"

  export CLOUDFLARE_ZONE_ID="test-zone"
  export CLOUDFLARE_API_TOKEN="test-token"
  if OUTPUT=$(PATH="${MOCK_BIN}:${PATH}" "$SCRIPT_DIR/cloudflare-purge.sh" fellspiral 2>&1); then
    fail "should have exited non-zero on API error"
  else
    if echo "$OUTPUT" | grep -q "Cloudflare purge failed"; then
      pass "fails with clear message on API error"
    else
      fail "expected purge failed message, got: $OUTPUT"
    fi
  fi
)

# --- Test: batches when more than 30 URLs ---
echo "=== Test: batches URLs when more than 30 ==="
(
  # Generate 35 changed files
  DIFF_OUTPUT=""
  for i in $(seq 1 35); do
    DIFF_OUTPUT+="fellspiral/public/img${i}.png"$'\n'
  done

  cat > "${MOCK_BIN}/git" << MOCK
#!/usr/bin/env bash
if [[ "\$*" == *"diff"* ]]; then
  printf '%s' '${DIFF_OUTPUT}'
fi
MOCK
  chmod +x "${MOCK_BIN}/git"

  CURL_COUNT_FILE="${TEST_TMPDIR}/curl_batch_count"
  echo 0 > "$CURL_COUNT_FILE"
  cat > "${MOCK_BIN}/curl" << MOCK
#!/usr/bin/env bash
echo \$(( \$(cat "${CURL_COUNT_FILE}") + 1 )) > "${CURL_COUNT_FILE}"
echo '{"success":true}'
MOCK
  chmod +x "${MOCK_BIN}/curl"

  JQ_PATH=$(command -v jq)
  cat > "${MOCK_BIN}/jq" << MOCK
#!/usr/bin/env bash
exec "$JQ_PATH" "\$@"
MOCK
  chmod +x "${MOCK_BIN}/jq"

  export CLOUDFLARE_ZONE_ID="test-zone"
  export CLOUDFLARE_API_TOKEN="test-token"
  PATH="${MOCK_BIN}:${PATH}" "$SCRIPT_DIR/cloudflare-purge.sh" fellspiral > /dev/null 2>&1

  CALL_COUNT=$(cat "$CURL_COUNT_FILE")
  if [ "$CALL_COUNT" -eq 2 ]; then
    pass "batches 35 URLs into 2 API calls"
  else
    fail "expected 2 curl calls, got $CALL_COUNT"
  fi
)

# --- Summary ---
PASSES=$(cat "$PASS_FILE")
FAILURES=$(cat "$FAIL_FILE")
TOTAL=$((PASSES + FAILURES))
echo ""
echo "Results: ${PASSES}/${TOTAL} passed, ${FAILURES} failed"
[ "$FAILURES" -eq 0 ]
