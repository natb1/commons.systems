#!/usr/bin/env bash
# Tests for lib-firebase-deploy-retry -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 29154-29344.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# firebase_deploy_retry (#2481)
# ============================================================================
echo "=== firebase_deploy_retry (#2481) ==="
export FIREBASE_DEPLOY_RETRY_BASE_DELAY=0
export FIREBASE_DEPLOY_RETRY_ATTEMPTS=3
# shellcheck source=/dev/null
source "$SCRIPT_DIR/lib.sh"

FDR_DIR=$(mktemp -d)

# --- Case 1: retry-then-succeed, signature on STDOUT (empty stderr) ---------
FDR_COUNTER="$FDR_DIR/counter1"
printf '0' > "$FDR_COUNTER"
FDR_STUB1="$FDR_DIR/stub-success"
cat > "$FDR_STUB1" <<STUB
#!/usr/bin/env bash
n=\$(cat "$FDR_COUNTER")
n=\$(( n + 1 ))
printf '%s' "\$n" > "$FDR_COUNTER"
if [[ "\$n" -lt 3 ]]; then
  # Transient auth failure: signature on STDOUT, nothing on stderr.
  printf '%s\n' 'Failed to authenticate'
  exit 1
fi
printf '%s\n' '{"result":{"site":{"url":"https://example.web.app"}}}'
exit 0
STUB
chmod +x "$FDR_STUB1"

fdr_actual=$(firebase_deploy_retry "$FDR_STUB1" 2>/dev/null)
fdr_rc=$?
assert_eq "firebase_deploy_retry: returns final success JSON on stdout" \
  '{"result":{"site":{"url":"https://example.web.app"}}}' "$fdr_actual"
assert_eq "firebase_deploy_retry: exit code 0 on eventual success" "0" "$fdr_rc"
fdr_count1=$(cat "$FDR_COUNTER")
assert_eq "firebase_deploy_retry: retried until success (3 attempts)" "3" "$fdr_count1"

# --- Case 2: non-auth failure is NOT retried -------------------------------
FDR_COUNTER2="$FDR_DIR/counter2"
printf '0' > "$FDR_COUNTER2"
FDR_STUB2="$FDR_DIR/stub-fail"
cat > "$FDR_STUB2" <<STUB
#!/usr/bin/env bash
n=\$(cat "$FDR_COUNTER2")
n=\$(( n + 1 ))
printf '%s' "\$n" > "$FDR_COUNTER2"
printf '%s\n' 'some other deploy error' >&2
exit 1
STUB
chmod +x "$FDR_STUB2"

fdr_rc2=0
firebase_deploy_retry "$FDR_STUB2" >/dev/null 2>&1 || fdr_rc2=$?
fdr_count2=$(cat "$FDR_COUNTER2")
assert_eq "firebase_deploy_retry: non-auth failure not retried (1 attempt)" "1" "$fdr_count2"
assert_eq "firebase_deploy_retry: non-auth failure returns nonzero" "nonzero" \
  "$([[ $fdr_rc2 -ne 0 ]] && echo nonzero || echo zero)"

# --- Case 3 (a): auth-class exhaustion runs the diagnostic -----------------
FDR_STUB_A="$FDR_DIR/stub-always-auth-fail-a"
cat > "$FDR_STUB_A" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' 'Failed to authenticate'
exit 1
STUB
chmod +x "$FDR_STUB_A"

FDR_DIAG_A="$FDR_DIR/diag-a"
cat > "$FDR_DIAG_A" <<'DIAGSTUB'
#!/usr/bin/env bash
printf '%s\n' '[debug] Connecting to googleapis...'
printf '%s\n' 'Invalid response body while trying to fetch https://www.googleapis.com/oauth2/v4/token: Premature close'
exit 1
DIAGSTUB
chmod +x "$FDR_DIAG_A"
export FIREBASE_AUTH_DIAGNOSTIC_CMD="$FDR_DIAG_A"

FDR_STDOUT_A="$FDR_DIR/stdout-a"
FDR_STDERR_A="$FDR_DIR/stderr-a"
firebase_deploy_retry "$FDR_STUB_A" >"$FDR_STDOUT_A" 2>"$FDR_STDERR_A" || true
assert_eq "firebase_deploy_retry: auth exhaustion - 'Failed to authenticate' on stdout" "yes" \
  "$(grep -q 'Failed to authenticate' "$FDR_STDOUT_A" && echo yes || echo no)"
assert_eq "firebase_deploy_retry: auth exhaustion - diagnostic shows 'Premature close' on stderr" "yes" \
  "$(grep -q 'Premature close' "$FDR_STDERR_A" && echo yes || echo no)"

# --- Case 3 (b): secrets are redacted (load-bearing test) -----------------
# Diagnostic emits realistic --debug output with secrets adjacent to error/token
# lines so they fall inside the grep -B1 -A2 window — proving redaction when absent.
# Layout: "error: auth failed, sending token request" (line 1) puts Bearer (line 2)
# and "access_token" JSON (line 3) inside its A2 window; "access_token" on line 3
# ("token" match) puts PEM BEGIN (line 4) and PEM body (line 5) inside its A2 window;
# "error: Premature close while fetching token" (line 7) puts eyJaaa JWT (line 8)
# inside its A2 window. If redaction were broken, all four secret values would appear
# verbatim in the emitted window.
FDR_STUB_B="$FDR_DIR/stub-always-auth-fail-b"
cat > "$FDR_STUB_B" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' 'Failed to authenticate'
exit 1
STUB
chmod +x "$FDR_STUB_B"

FDR_DIAG_B="$FDR_DIR/diag-b"
cat > "$FDR_DIAG_B" <<'DIAGSTUB'
#!/usr/bin/env bash
printf '%s\n' 'error: auth failed, sending token request'
printf '%s\n' 'authorization: Bearer ya29.LEAKME123456789'
printf '%s\n' '"access_token": "ya29.SECRETVAL987654321"'
printf '%s\n' '-----BEGIN PRIVATE KEY-----'
printf '%s\n' 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASC'
printf '%s\n' '-----END PRIVATE KEY-----'
printf '%s\n' 'error: Premature close while fetching token'
printf '%s\n' 'eyJaaa.bbb.ccc'
exit 1
DIAGSTUB
chmod +x "$FDR_DIAG_B"
export FIREBASE_AUTH_DIAGNOSTIC_CMD="$FDR_DIAG_B"

FDR_STDERR_B="$FDR_DIR/stderr-b"
firebase_deploy_retry "$FDR_STUB_B" >/dev/null 2>"$FDR_STDERR_B" || true
assert_eq "firebase_deploy_retry: redact - no raw ya29. token in diagnostic output" "no" \
  "$(grep -q 'ya29\.' "$FDR_STDERR_B" && echo yes || echo no)"
assert_eq "firebase_deploy_retry: redact - no raw JWT eyJaaa in diagnostic output" "no" \
  "$(grep -q 'eyJaaa' "$FDR_STDERR_B" && echo yes || echo no)"
assert_eq "firebase_deploy_retry: redact - no PEM body MIIEvQIBADANBg in diagnostic output" "no" \
  "$(grep -q 'MIIEvQIBADANBg' "$FDR_STDERR_B" && echo yes || echo no)"
assert_eq "firebase_deploy_retry: redact - error signature 'Premature' survives redaction" "yes" \
  "$(grep -q 'Premature' "$FDR_STDERR_B" && echo yes || echo no)"

# --- Case 3 (c): non-auth failure does NOT run the diagnostic --------------
FDR_STUB_C="$FDR_DIR/stub-non-auth-c"
cat > "$FDR_STUB_C" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' 'some other deploy error' >&2
exit 1
STUB
chmod +x "$FDR_STUB_C"

FDR_SENTINEL_C="$FDR_DIR/sentinel-c"
FDR_DIAG_C="$FDR_DIR/diag-c"
cat > "$FDR_DIAG_C" <<DIAGSTUB
#!/usr/bin/env bash
touch "$FDR_SENTINEL_C"
exit 0
DIAGSTUB
chmod +x "$FDR_DIAG_C"
export FIREBASE_AUTH_DIAGNOSTIC_CMD="$FDR_DIAG_C"

firebase_deploy_retry "$FDR_STUB_C" >/dev/null 2>/dev/null || true
fdr_sentinel_c_exists=$([[ -e "$FDR_SENTINEL_C" ]] && echo present || echo absent)
assert_eq "firebase_deploy_retry: non-auth failure does not run diagnostic" "absent" \
  "$fdr_sentinel_c_exists"

# --- Case 3 (d): success path does NOT run the diagnostic ------------------
FDR_COUNTER_D="$FDR_DIR/counter-d"
printf '0' > "$FDR_COUNTER_D"
FDR_STUB_D="$FDR_DIR/stub-success-d"
cat > "$FDR_STUB_D" <<STUB
#!/usr/bin/env bash
n=\$(cat "$FDR_COUNTER_D")
n=\$(( n + 1 ))
printf '%s' "\$n" > "$FDR_COUNTER_D"
if [[ "\$n" -lt 3 ]]; then
  printf '%s\n' 'Failed to authenticate'
  exit 1
fi
printf '%s\n' '{"result":{"ok":true}}'
exit 0
STUB
chmod +x "$FDR_STUB_D"

FDR_SENTINEL_D="$FDR_DIR/sentinel-d"
FDR_DIAG_D="$FDR_DIR/diag-d"
cat > "$FDR_DIAG_D" <<DIAGSTUB
#!/usr/bin/env bash
touch "$FDR_SENTINEL_D"
exit 0
DIAGSTUB
chmod +x "$FDR_DIAG_D"
export FIREBASE_AUTH_DIAGNOSTIC_CMD="$FDR_DIAG_D"

firebase_deploy_retry "$FDR_STUB_D" >/dev/null 2>/dev/null || true
fdr_sentinel_d_exists=$([[ -e "$FDR_SENTINEL_D" ]] && echo present || echo absent)
assert_eq "firebase_deploy_retry: success path does not run diagnostic" "absent" \
  "$fdr_sentinel_d_exists"

unset FIREBASE_AUTH_DIAGNOSTIC_CMD
rm -rf "$FDR_DIR"
unset FIREBASE_DEPLOY_RETRY_BASE_DELAY FIREBASE_DEPLOY_RETRY_ATTEMPTS

# <<< END MOVED <<<

report_results
