#!/usr/bin/env bash
# Tests for align-tactics' resolveTempRefs (sliced out of .claude/workflows/
# align-tactics.js by align-tactics-tempref-probe.mjs) -- moved verbatim from
# test-dispatch-scripts.sh (tactic-dispatch-test-monolith-split). Originally
# mis-homed as a trailing block of test-qa-fix-partition.sh: it shares that
# section's "workflows/*.js has no vitest mapping, so cover it here" rationale
# but exercises a different SUT; this moves it to its own home.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# === align-tactics tempref (resolveTempRefs) ===
# ============================================================================
# CI vector: run-unit-tests.sh has no mapping for .claude/workflows/*, so a PR
# touching only align-tactics.js triggers no vitest suite. Its test-*.sh glob
# over this directory is no fallback either — that glob only runs when
# RUN_PR_SCRIPTS is set, which auto-detect sets solely for changed paths under
# .claude/skills/dispatch-propagate/scripts/. So this script is wired
# unconditionally into the hook-tests job of .github/workflows/unit-tests.yml;
# that step is the only thing that runs resolveTempRefs coverage on every PR.
# Keep it wired. The probe slices the pure function out of
# align-tactics.js between sentinel comments and evals just that slice, then runs
# valid-resolution / dangling-ref (rule 13) / cycle (rule 15) assertions.

echo "Test: align-tactics tempref (resolveTempRefs)"

out_at=$(node "$SCRIPT_DIR/align-tactics-tempref-probe.mjs")

# The probe runs its own assertions and prints "ALL PASS" on the final line only
# when every vector passed (and exits non-zero otherwise). Assert on that token.
assert_eq "align-tactics tempref: all probe vectors pass" "align-tactics-tempref-probe: ALL PASS" "$(printf '%s' "$out_at" | tail -n1)"

# <<< END MOVED <<<

report_results
