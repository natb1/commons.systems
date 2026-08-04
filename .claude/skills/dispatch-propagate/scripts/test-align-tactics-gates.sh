#!/usr/bin/env bash
# Tests for align-tactics' computePhaseGates (sliced out of .claude/workflows/
# align-tactics.js by align-tactics-gates-probe.mjs). This suite was authored
# after the test-dispatch-scripts.sh monolith was split into per-SUT files
# (tactic-dispatch-test-monolith-split); it follows that split's convention
# directly rather than being moved out of the monolith, so it has no
# "MOVED FROM" provenance banner like its resolveTempRefs sibling.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# ============================================================================
# === align-tactics phase gates (computePhaseGates) ===
# ============================================================================
# CI vector: run-unit-tests.sh has no mapping for .claude/workflows/*, so a PR
# touching only align-tactics.js triggers no vitest suite. Its test-*.sh glob
# over this directory is no fallback either -- that glob only runs when
# RUN_PR_SCRIPTS is set, which auto-detect sets solely for changed paths under
# .claude/skills/dispatch-propagate/scripts/. So this script is wired
# unconditionally into the hook-tests job of .github/workflows/unit-tests.yml,
# alongside its resolveTempRefs sibling; that step is the only thing that runs
# computePhaseGates coverage on every PR. Keep it wired.

echo "Test: align-tactics phase gates (computePhaseGates)"

out_ag=$(node "$SCRIPT_DIR/align-tactics-gates-probe.mjs")

# The probe runs its own assertions and prints "ALL PASS" on the final line only
# when every vector passed (and exits non-zero otherwise). Assert on that token.
assert_eq "align-tactics gates: all probe vectors pass" "align-tactics-gates-probe: ALL PASS" "$(printf '%s' "$out_ag" | tail -n1)"

# Call-site + regression assertions (mirrors the qa-fix partition call-site
# assertion in test-qa-fix-partition.sh): the gates must be computed once and
# no phase gate may read the raw folded boolean again.
assert_eq "align-tactics gates: computePhaseGates call site present" "1" "$(grep -c '= computePhaseGates(mode, drift)' "$REPO_ROOT/.claude/workflows/align-tactics.js" || true)"
assert_eq "align-tactics gates: no phase gate reads raw !driftProceed" "0" "$(grep -c '!driftProceed' "$REPO_ROOT/.claude/workflows/align-tactics.js" || true)"

report_results
