#!/usr/bin/env bash
# Unit tests for wait_for_stable_propagation (lib.sh).
#
# All curl calls are intercepted by a parametric PATH shim — no real network
# calls are made. Five cases exercise the key branches:
#   (a) stable from the first poll                      → rc 0
#   (b) single transient 503 then stable                → rc 0
#   (c) persistent 503 (poll budget exhausted)          → rc 1
#   (d) 200 but body never contains <script type=module → rc 1
#   (e) valid root but asset probe always returns 503   → rc 1
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# --- test helpers -----------------------------------------------------------
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

assert_contains() {
  local label="$1" needle="$2" haystack="$3"
  TOTAL=$((TOTAL + 1))
  if [[ "$haystack" == *"$needle"* ]]; then
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label"
    echo "    expected to contain: '$needle'"
    echo "    actual: '$haystack'"
  fi
}

report_results() {
  echo ""
  echo "================================"
  echo "Results: $PASS/$TOTAL passed, $FAIL failed"
  echo "================================"
  [[ "$FAIL" -eq 0 ]]
}

# --- shared temp dir --------------------------------------------------------
MASTER_TMPDIR="$(mktemp -d)"
trap 'rm -rf "$MASTER_TMPDIR"' EXIT

# --- write the parametric curl shim once ------------------------------------
# The shim is reused by all five cases via symlinks from per-case bin dirs.
# IMPORTANT: the asset-URL early-return MUST come before the counter read so
# the counter index tracks root polls only (not asset probes).
SHIM_FILE="$MASTER_TMPDIR/curl"
cat > "$SHIM_FILE" << 'SHIM_EOF'
#!/usr/bin/env bash
# Parametric fake curl shim for wait_for_stable_propagation tests.
#
# Required env vars (exported by run_case):
#   FAKE_COUNTER_FILE — temp file holding the next root-poll call index (0-based)
#   FAKE_ROOT_PLAN    — space-separated list of outcomes for successive root polls:
#                         good      → HTTP 200 + HTML with <script type="module">
#                         503       → HTTP 503 + empty body
#                         nomodule  → HTTP 200 + HTML WITHOUT <script type="module">
#   FAKE_ASSET_STATUS — HTTP status code returned for asset probes (default: 200)
#
# Matches the exact arg sequences the function passes to curl:
#   root:  curl -s -o <tmpfile> -w '%{http_code}' <base_url>
#   asset: curl -s -o /dev/null  -w '%{http_code}' <base_url><asset_path>
#
# Root vs asset is distinguished by whether the URL contains "/assets/".

OUTPUT_FILE=""
URL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -s) shift ;;
    -o) OUTPUT_FILE="$2"; shift 2 ;;
    -w) shift 2 ;;   # skip the format spec ('%{http_code}')
    http*) URL="$1"; shift ;;
    *) shift ;;
  esac
done

# --- Asset probe: early-return BEFORE touching the root-poll counter --------
# (The counter must only count root polls so case-plan arrays line up correctly.)
if [[ "$URL" == */assets/* ]]; then
  printf '%s' "${FAKE_ASSET_STATUS:-200}"
  exit 0
fi

# --- Root probe: read current poll index, then advance the counter ----------
COUNTER=0
if [[ -f "${FAKE_COUNTER_FILE:?FAKE_COUNTER_FILE must be set}" ]]; then
  COUNTER=$(cat "$FAKE_COUNTER_FILE")
fi
printf '%s' "$(( COUNTER + 1 ))" > "$FAKE_COUNTER_FILE"

# Index into the plan (default 'good' when past the end of the list)
read -ra PLAN <<< "${FAKE_ROOT_PLAN:-good}"
OUTCOME="${PLAN[$COUNTER]:-good}"

# Prepare response bodies
GOOD_HTML='<html><head></head><body><script type="module" src="/assets/index-abc123.js"></script></body></html>'
JUNK_HTML='<html><head></head><body><p>No module script here.</p></body></html>'
ERROR_BODY='Service Unavailable'

write_body() {
  local content="$1"
  if [[ -n "$OUTPUT_FILE" && "$OUTPUT_FILE" != "/dev/null" ]]; then
    printf '%s' "$content" > "$OUTPUT_FILE"
  fi
}

case "$OUTCOME" in
  good)     write_body "$GOOD_HTML";  printf '200' ;;
  503)      write_body "$ERROR_BODY"; printf '503' ;;
  nomodule) write_body "$JUNK_HTML";  printf '200' ;;
  *)        write_body "$ERROR_BODY"; printf '503' ;;
esac
SHIM_EOF
chmod +x "$SHIM_FILE"

# --- source lib.sh to pull in wait_for_stable_propagation ------------------
source "$SCRIPT_DIR/lib.sh"

SAVED_PATH="$PATH"

# Helper: run one case in the current shell with the curl shim on PATH.
# After the call, CASE_RC and CASE_STDERR hold the results.
CASE_RC=""
CASE_STDERR=""

run_case() {
  local root_plan="$1" asset_status="$2" timeout_val="$3"

  # Fresh counter file for this case (starts at 0)
  local counter_file
  counter_file="$(mktemp "$MASTER_TMPDIR/counter.XXXXXX")"
  printf '0' > "$counter_file"

  # Case-specific bin dir with a symlink to the shared shim
  local bin_dir
  bin_dir="$(mktemp -d "$MASTER_TMPDIR/bin.XXXXXX")"
  ln -sf "$SHIM_FILE" "$bin_dir/curl"

  # Export shim env and timing tunables
  export PATH="$bin_dir:$SAVED_PATH"
  export FAKE_COUNTER_FILE="$counter_file"
  export FAKE_ROOT_PLAN="$root_plan"
  export FAKE_ASSET_STATUS="$asset_status"
  export TIMEOUT="$timeout_val"
  export INTERVAL=0               # INTERVAL=0 → max_polls == TIMEOUT (no sleep)
  export REQUIRED_CONSECUTIVE=3

  local stderr_file
  stderr_file="$(mktemp "$MASTER_TMPDIR/stderr.XXXXXX")"

  set +e
  wait_for_stable_propagation "http://test.example.com" 2>"$stderr_file"
  CASE_RC=$?
  set -e

  CASE_STDERR="$(cat "$stderr_file")"

  # Restore PATH and unset shim env so cases don't bleed into each other
  export PATH="$SAVED_PATH"
  unset FAKE_COUNTER_FILE FAKE_ROOT_PLAN FAKE_ASSET_STATUS
  unset TIMEOUT INTERVAL REQUIRED_CONSECUTIVE
}

# ============================================================================
# Case (a): stable from the first poll
# All root polls are good, all asset probes return 200.
# Hits REQUIRED_CONSECUTIVE=3 on poll 3.
# ============================================================================
echo ""
echo "=== Case (a): stable from first poll ==="
run_case "good good good good good" "200" "10"
assert_eq "(a) returns 0 when all polls are immediately good" "0" "$CASE_RC"

# ============================================================================
# Case (b): single transient 503 then stable
# Polls 1-2 good → consecutive=2; poll 3 = 503 → reset; polls 4-6 good →
# consecutive reaches 3 → return 0. Verifies reset-then-recover succeeds
# (the core bug this gate was created to catch).
# ============================================================================
echo ""
echo "=== Case (b): single transient 503 then stable ==="
run_case "good good 503 good good good" "200" "10"
assert_eq "(b) returns 0 after reset then 3 consecutive good" "0" "$CASE_RC"

# ============================================================================
# Case (c): persistent 503
# All 5 root polls return 503; poll budget (TIMEOUT=5) exhausts.
# ============================================================================
echo ""
echo "=== Case (c): persistent 503 ==="
run_case "503 503 503 503 503" "200" "5"
assert_eq "(c) returns non-zero on persistent 503" "1" "$CASE_RC"
assert_contains "(c) stderr contains 'did not reach'" "did not reach" "$CASE_STDERR"
assert_contains "(c) stderr contains last HTTP status 503" "503" "$CASE_STDERR"

# ============================================================================
# Case (d): 200 but body never contains <script type="module"
# Root always responds 200 with HTML that has no module script tag.
# The body-check branch resets the consecutive counter each poll.
# ============================================================================
echo ""
echo "=== Case (d): 200 but no <script type=module> in body ==="
run_case "nomodule nomodule nomodule nomodule nomodule" "200" "5"
assert_eq "(d) returns non-zero when module script absent" "1" "$CASE_RC"
assert_contains "(d) stderr mentions missing module script" "module" "$CASE_STDERR"

# ============================================================================
# Case (e): valid root but asset probe returns 503
# Root responds 200 + good HTML (asset path is extracted successfully), but the
# asset curl always returns 503. The dual-probe check resets the counter.
# ============================================================================
echo ""
echo "=== Case (e): valid root but asset probe returns 503 ==="
run_case "good good good good good" "503" "5"
assert_eq "(e) returns non-zero when asset probe fails" "1" "$CASE_RC"
assert_contains "(e) stderr mentions asset" "asset" "$CASE_STDERR"
assert_contains "(e) stderr mentions 503 from asset probe" "503" "$CASE_STDERR"

report_results
