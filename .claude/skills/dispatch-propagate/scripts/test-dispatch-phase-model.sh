#!/usr/bin/env bash
# Tests for dispatch-phase-model — the tick-time phase → model lookup.
#
# Invariant under test (#2872): the phase orchestrator is ALWAYS Sonnet for the
# workflow phases, and there is NO policy that can promote it to Opus. The lookup
# is a pure static map — it reads no config file. These tests cover the static
# map, the empty-default for unmapped phases, the regression guard that a stray
# phase-model-policy.json is ignored (the retired #2028 promotion cannot come
# back), and the usage-error exit-code contract (exit 2).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
source "$SCRIPT_DIR/test-helpers.sh"
SUT="$SCRIPT_DIR/dispatch-phase-model"

# run_phase: run the SUT against a given config dir, capturing stdout in OUT and
# the exit code in RC. Pass "" as the dir to invoke the SUT with no override.
OUT=""
RC=0
run_phase() {  # $1 = config dir (or "" for none), $2 = phase
  local dir="$1" phase="$2"
  set +e
  OUT=$(DISPATCH_CONFIG_DIR="$dir" "$SUT" "$phase" 2>/dev/null)
  RC=$?
  set -e
}

# ============================================================================
# Case 1: the static map — every workflow phase resolves to sonnet.
# ============================================================================
echo "Case 1: static map -> sonnet for the workflow phases"
for ph in qa review fix-checks fix-conflicts main-qa; do
  run_phase "" "$ph"
  assert_eq "static: $ph -> sonnet" "sonnet" "$OUT"
  assert_eq "static: $ph exit 0" "0" "$RC"
done

# ============================================================================
# Case 1b: the ladder-eval pseudo-phase is pinned to opus, on its own — it is
# NOT part of the sonnet arm above. A sonnet-tier eval once improvised an
# ambiguous `find -newermt` call and recorded a displaced search window's
# blindness as proof no artifact existed; the lane is opus because the job
# reasons about evidence and its own blindness, not because it authors code.
# ============================================================================
echo "Case 1b: ladder-eval -> opus"
run_phase "" "ladder-eval"
assert_eq "static: ladder-eval -> opus" "opus" "$OUT"
assert_eq "static: ladder-eval exit 0" "0" "$RC"

# ============================================================================
# Case 2: unmapped phases -> empty (inherit the session default, no --model).
# ============================================================================
echo "Case 2: unmapped phases -> empty"
for ph in plan implement done; do
  run_phase "" "$ph"
  assert_eq "unmapped: $ph -> empty" "" "$OUT"
  assert_eq "unmapped: $ph exit 0" "0" "$RC"
done

# ============================================================================
# Case 3: regression guard — a stray phase-model-policy.json cannot promote the
# orchestrator. The retired #2028 policy routed qa/review to opus; the lookup no
# longer reads any config, so such a file is inert.
# ============================================================================
echo "Case 3: stray policy file is ignored (no promotion to opus)"
STRAY_DIR=$(mktemp -d)
printf '%s\n' '{"routes":{"qa":"claude-opus-4-8","review":"claude-opus-4-8"}}' \
  > "$STRAY_DIR/phase-model-policy.json"

run_phase "$STRAY_DIR" qa
assert_eq "stray policy: qa stays sonnet" "sonnet" "$OUT"
assert_eq "stray policy: qa exit 0" "0" "$RC"

run_phase "$STRAY_DIR" review
assert_eq "stray policy: review stays sonnet" "sonnet" "$OUT"

# A malformed policy file is likewise inert — no config load, so no failure.
echo "Case 3b: malformed stray policy file is still inert"
BAD_DIR=$(mktemp -d)
printf '%s\n' '{ not json' > "$BAD_DIR/phase-model-policy.json"
run_phase "$BAD_DIR" qa
assert_eq "malformed stray policy: qa stays sonnet" "sonnet" "$OUT"
assert_eq "malformed stray policy: qa exit 0" "0" "$RC"

# ============================================================================
# Case 4: usage errors → exit 2.
# ============================================================================
echo "Case 4: usage errors exit 2"

set +e
"$SUT" >/dev/null 2>&1
NOARG_RC=$?
"$SUT" "" >/dev/null 2>&1
EMPTYARG_RC=$?
"$SUT" qa review >/dev/null 2>&1
EXTRAARG_RC=$?
set -e

assert_eq "no arg -> exit 2" "2" "$NOARG_RC"
assert_eq "empty arg -> exit 2" "2" "$EMPTYARG_RC"
assert_eq "extra arg -> exit 2" "2" "$EXTRAARG_RC"


# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-phase-model tests
# ============================================================================
echo "=== dispatch-phase-model ==="

echo "Test: dispatch-phase-model maps qa → sonnet"
if pm_out=$("$SCRIPT_DIR/dispatch-phase-model" qa 2>/dev/null); then pm_rc=0; else pm_rc=$?; fi
assert_eq "phase-model: qa exits 0" "0" "$pm_rc"
assert_eq "phase-model: qa → sonnet" "sonnet" "$pm_out"

echo "Test: dispatch-phase-model maps review → sonnet (#1172)"
if pm_out=$("$SCRIPT_DIR/dispatch-phase-model" review 2>/dev/null); then pm_rc=0; else pm_rc=$?; fi
assert_eq "phase-model: review exits 0" "0" "$pm_rc"
assert_eq "phase-model: review → sonnet" "sonnet" "$pm_out"

echo "Test: dispatch-phase-model maps fix-checks → sonnet (#2042)"
if pm_out=$("$SCRIPT_DIR/dispatch-phase-model" fix-checks 2>/dev/null); then pm_rc=0; else pm_rc=$?; fi
assert_eq "phase-model: fix-checks exits 0" "0" "$pm_rc"
assert_eq "phase-model: fix-checks → sonnet" "sonnet" "$pm_out"

echo "Test: dispatch-phase-model maps fix-conflicts → sonnet (#2042)"
if pm_out=$("$SCRIPT_DIR/dispatch-phase-model" fix-conflicts 2>/dev/null); then pm_rc=0; else pm_rc=$?; fi
assert_eq "phase-model: fix-conflicts exits 0" "0" "$pm_rc"
assert_eq "phase-model: fix-conflicts → sonnet" "sonnet" "$pm_out"

echo "Test: dispatch-phase-model maps main-qa → sonnet (#2274)"
if pm_out=$("$SCRIPT_DIR/dispatch-phase-model" main-qa 2>/dev/null); then pm_rc=0; else pm_rc=$?; fi
assert_eq "phase-model: main-qa exits 0" "0" "$pm_rc"
assert_eq "phase-model: main-qa → sonnet" "sonnet" "$pm_out"

echo "Test: dispatch-phase-model maps unmapped phases → empty (default → Opus, no override)"
for ph in implement done; do
  if pm_out=$("$SCRIPT_DIR/dispatch-phase-model" "$ph" 2>/dev/null); then pm_rc=0; else pm_rc=$?; fi
  assert_eq "phase-model: $ph exits 0" "0" "$pm_rc"
  assert_eq "phase-model: $ph → empty (no --model, inherit Opus)" "" "$pm_out"
done

echo "Test: dispatch-phase-model with no phase arg exits 2"
if "$SCRIPT_DIR/dispatch-phase-model" 2>/dev/null; then pm_rc=0; else pm_rc=$?; fi
assert_eq "phase-model: no-arg → exit 2" "2" "$pm_rc"

echo "Test: dispatch-phase-model with an empty-string arg exits 2"
if "$SCRIPT_DIR/dispatch-phase-model" "" 2>/dev/null; then pm_rc=0; else pm_rc=$?; fi
assert_eq "phase-model: empty-string-arg → exit 2" "2" "$pm_rc"

# <<< END MOVED <<<

report_results
