#!/usr/bin/env bash
# Tests for dispatch-phase-model — the tick-time phase → model lookup (#2028).
#
# Covers the generated-policy override path: a phase-model-policy.json route
# (when present, for an allowlisted phase) overrides the hardcoded default
# case-map; the demotable allowlist {qa, review} fail-closes against demoting a
# code-authoring phase; a malformed policy fails loudly (non-zero exit) rather
# than silently falling back; and the usage-error exit-code contract (exit 2)
# still fires before any policy load.
#
# The SUT is pointed at fixture policies via the DISPATCH_CONFIG_DIR env seam
# (the same seam dispatch-config-load uses) — each case writes a
# phase-model-policy.json into a per-case mktemp dir.
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

# write_policy: drop a phase-model-policy.json with the given body into a fresh
# mktemp dir and echo the dir path. The filename is fixed — dispatch-config-load
# derives it from the config type.
write_policy() {  # $1 = JSON body; echoes the config dir
  local dir
  dir=$(mktemp -d)
  printf '%s\n' "$1" > "$dir/phase-model-policy.json"
  printf '%s' "$dir"
}

# ============================================================================
# Case 1: no policy file present (empty config dir) → defaults apply.
# ============================================================================
echo "Case 1: no policy file -> hardcoded defaults"
EMPTY_DIR=$(mktemp -d)

run_phase "$EMPTY_DIR" qa
assert_eq "no policy: qa -> sonnet" "claude-sonnet-4-6" "$OUT"
assert_eq "no policy: qa exit 0" "0" "$RC"

run_phase "$EMPTY_DIR" review
assert_eq "no policy: review -> sonnet" "claude-sonnet-4-6" "$OUT"

run_phase "$EMPTY_DIR" fix-checks
assert_eq "no policy: fix-checks -> sonnet" "claude-sonnet-4-6" "$OUT"
assert_eq "no policy: fix-checks exit 0" "0" "$RC"

run_phase "$EMPTY_DIR" fix-conflicts
assert_eq "no policy: fix-conflicts -> sonnet" "claude-sonnet-4-6" "$OUT"
assert_eq "no policy: fix-conflicts exit 0" "0" "$RC"

run_phase "$EMPTY_DIR" main-qa
assert_eq "no policy: main-qa -> sonnet" "claude-sonnet-4-6" "$OUT"
assert_eq "no policy: main-qa exit 0" "0" "$RC"

run_phase "$EMPTY_DIR" plan
assert_eq "no policy: unmapped plan -> empty" "" "$OUT"
assert_eq "no policy: plan exit 0" "0" "$RC"

# ============================================================================
# Case 2: policy routes qa -> opus → override beats the default.
# ============================================================================
echo "Case 2: policy route overrides default"
DIR2=$(write_policy '{"routes":{"qa":"claude-opus-4-8"}}')

run_phase "$DIR2" qa
assert_eq "policy qa -> opus (override)" "claude-opus-4-8" "$OUT"
assert_eq "policy qa override exit 0" "0" "$RC"

# ============================================================================
# Case 3: policy present but missing the requested route → default fallback.
# ============================================================================
echo "Case 3: missing route key -> default fallback"
DIR3=$(write_policy '{"routes":{"qa":"claude-opus-4-8"}}')

run_phase "$DIR3" review
assert_eq "policy missing review key: review -> default sonnet" "claude-sonnet-4-6" "$OUT"

# ============================================================================
# Case 4: allowlist guard — a policy demoting a code-authoring phase is ignored.
# ============================================================================
echo "Case 4: allowlist guard ignores non-allowlisted route"
DIR4=$(write_policy '{"routes":{"implement":"claude-sonnet-4-6","qa":"claude-opus-4-8"}}')

run_phase "$DIR4" implement
assert_eq "policy route for implement IGNORED -> empty" "" "$OUT"
assert_eq "implement guard exit 0" "0" "$RC"

# The allowlisted route in the same policy is still honored.
run_phase "$DIR4" qa
assert_eq "allowlisted qa route still honored -> opus" "claude-opus-4-8" "$OUT"

# ============================================================================
# Case 5: malformed policy JSON → fail loudly (non-zero exit, no fallback).
# ============================================================================
echo "Case 5: malformed policy -> non-zero exit"
DIR5=$(mktemp -d)
printf '%s\n' '{ not json' > "$DIR5/phase-model-policy.json"

run_phase "$DIR5" qa
assert_eq "malformed policy -> nonzero exit" "nonzero" \
  "$([ "$RC" -ne 0 ] && echo nonzero || echo zero)"

# ============================================================================
# Case 6: usage errors → exit 2, before any policy load.
# ============================================================================
echo "Case 6: usage errors exit 2"

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

report_results
