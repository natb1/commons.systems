#!/usr/bin/env bash
# Tests for lib-claim-fixed-vite-port -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 26243-26379.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# claim_fixed_vite_port (fixed Vite-port pool) tests
# ============================================================================
echo ""
echo "=== claim_fixed_vite_port (fixed Vite-port pool) ==="

# Isolation: every sub-test sources lib.sh in a subshell, then overrides
# QA_VITE_PORT_LOCK_DIR (fresh mktemp -d) and QA_VITE_PORT_POOL (a known-free
# 8-port set discovered via find_available_ports) so the suite never touches a
# real QA server on 5170–5177 and needs no privileges. The pool/lock-dir are
# file-scope globals in lib.sh precisely so the overrides take after sourcing.
cvp_pool=$(source "$SCRIPT_DIR/lib.sh"; find_available_ports 8)
read -r -a CVP_POOL_ARR <<< "$cvp_pool"
assert_eq "claim: discovered an 8-member known-free test pool" "8" "${#CVP_POOL_ARR[@]}"

# --- Case 1: single claim returns a pool member -----------------------------
cvp_lockdir1=$(mktemp -d)
cvp_out1=$(
  source "$SCRIPT_DIR/lib.sh"
  QA_VITE_PORT_LOCK_DIR="$cvp_lockdir1"
  QA_VITE_PORT_POOL=("${CVP_POOL_ARR[@]}")
  claim_fixed_vite_port && echo "$VITE_PORT"
) && cvp_rc1=0 || cvp_rc1=$?
assert_eq "claim: single claim succeeds (exit 0)" "0" "$cvp_rc1"
TOTAL=$((TOTAL + 1))
if [[ " ${CVP_POOL_ARR[*]} " == *" $cvp_out1 "* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: single claim's VITE_PORT ($cvp_out1) is a pool member"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: single claim's VITE_PORT ('$cvp_out1') is not a pool member"
fi
rm -rf "$cvp_lockdir1"

# --- Case 2: 8 concurrent claims yield 8 distinct ports ---------------------
# Each worker claims, records its port, then sleeps to HOLD its flock while the
# siblings race — without the hold a fast worker could release and a slow one
# reuse the same slot, masking a collision.
cvp_lockdir2=$(mktemp -d)
cvp_results2=$(mktemp -d)
for i in $(seq 1 8); do
  (
    source "$SCRIPT_DIR/lib.sh"
    QA_VITE_PORT_LOCK_DIR="$cvp_lockdir2"
    QA_VITE_PORT_POOL=("${CVP_POOL_ARR[@]}")
    if claim_fixed_vite_port; then
      echo "$VITE_PORT" > "$cvp_results2/$i"
      sleep 3
    fi
  ) &
done
wait
cvp_total2=$(find "$cvp_results2" -type f | wc -l | tr -d ' ')
cvp_distinct2=$(find "$cvp_results2" -type f -exec cat {} + 2>/dev/null | sort -un | sed '/^$/d' | wc -l | tr -d ' ')
assert_eq "claim: 8 concurrent claims all succeed" "8" "$cvp_total2"
assert_eq "claim: 8 concurrent claims yield 8 distinct ports" "8" "$cvp_distinct2"
rm -rf "$cvp_lockdir2" "$cvp_results2"

# --- Case 3: 9th claim errors, no random-port fallback ----------------------
# Hold all 8 slots with background workers, then a 9th claim must exit non-zero,
# print the "all … in use" diagnostic, and leave VITE_PORT unset (no fallback).
cvp_lockdir3=$(mktemp -d)
cvp_results3=$(mktemp -d)
for i in $(seq 1 8); do
  (
    source "$SCRIPT_DIR/lib.sh"
    QA_VITE_PORT_LOCK_DIR="$cvp_lockdir3"
    QA_VITE_PORT_POOL=("${CVP_POOL_ARR[@]}")
    if claim_fixed_vite_port; then
      echo "$VITE_PORT" > "$cvp_results3/$i"
      sleep 4
    fi
  ) &
done
# Wait until all 8 holders have actually claimed before racing the 9th.
for _ in $(seq 1 80); do
  [ "$(find "$cvp_results3" -type f | wc -l | tr -d ' ')" -eq 8 ] && break
  sleep 0.1
done
cvp_stderr3=$(mktemp)
cvp_9th_out=$(
  source "$SCRIPT_DIR/lib.sh"
  QA_VITE_PORT_LOCK_DIR="$cvp_lockdir3"
  QA_VITE_PORT_POOL=("${CVP_POOL_ARR[@]}")
  unset VITE_PORT
  if claim_fixed_vite_port 2>"$cvp_stderr3"; then
    echo "0 ${VITE_PORT:-UNSET}"
  else
    echo "1 ${VITE_PORT:-UNSET}"
  fi
)
wait
cvp_9th_rc="${cvp_9th_out%% *}"
cvp_9th_port="${cvp_9th_out#* }"
assert_eq "claim: 9th claim (all slots held) exits non-zero" "1" "$cvp_9th_rc"
assert_eq "claim: 9th claim leaves VITE_PORT unset (no random-port fallback)" "UNSET" "$cvp_9th_port"
TOTAL=$((TOTAL + 1))
if grep -q "all .* QA Vite ports .* are in use" "$cvp_stderr3"; then
  PASS=$((PASS + 1)); echo "  PASS: 9th claim prints the 'all … in use' diagnostic"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: 9th claim did not print the expected diagnostic"
  echo "    stderr: '$(cat "$cvp_stderr3")'"
fi
rm -rf "$cvp_lockdir3" "$cvp_results3" "$cvp_stderr3"

# --- Case 4: a foreign squatter on a pool port is skipped -------------------
# Bind the first pool port with a foreign listener; a claim must win the NEXT
# free slot (post-lock bindability check), not die on the squatted port.
cvp_lockdir4=$(mktemp -d)
cvp_squat_port="${CVP_POOL_ARR[0]}"
# The squatter retries on error (so a transient collision can't kill it) and
# announces readiness by printing READY once bound. We wait for that line rather
# than bind-probing the port ourselves — a probe would momentarily hold the port
# and race the squatter's own listen, which is exactly the flake to avoid.
cvp_squat_out=$(mktemp)
node -e "const net=require('net');function bind(){const s=net.createServer();s.on('error',()=>setTimeout(bind,50));s.listen(${cvp_squat_port},'0.0.0.0',()=>console.log('READY'));}bind();setInterval(()=>{},1e9);" >"$cvp_squat_out" 2>/dev/null &
cvp_squat_pid=$!
# Wait until the squatter reports it has bound the port.
for _ in $(seq 1 100); do
  grep -q READY "$cvp_squat_out" 2>/dev/null && break
  sleep 0.1
done
cvp_out4=$(
  source "$SCRIPT_DIR/lib.sh"
  QA_VITE_PORT_LOCK_DIR="$cvp_lockdir4"
  QA_VITE_PORT_POOL=("${CVP_POOL_ARR[@]}")
  claim_fixed_vite_port && echo "$VITE_PORT"
) && cvp_rc4=0 || cvp_rc4=$?
assert_eq "claim: squatted pool port → claim succeeds on next slot (exit 0)" "0" "$cvp_rc4"
TOTAL=$((TOTAL + 1))
if [[ "$cvp_out4" != "$cvp_squat_port" && " ${CVP_POOL_ARR[*]} " == *" $cvp_out4 "* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: claim skipped the squatted port ($cvp_squat_port), took $cvp_out4"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: claim returned '$cvp_out4' (squatted port was $cvp_squat_port)"
fi
kill "$cvp_squat_pid" 2>/dev/null || true
wait "$cvp_squat_pid" 2>/dev/null || true
rm -rf "$cvp_lockdir4" "$cvp_squat_out"

# <<< END MOVED <<<

report_results
