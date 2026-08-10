#!/usr/bin/env bash
# Tests for align-tactics' synthesizeTargetPlanTactic and tacticModeFraming
# (sliced out of .claude/workflows/align-tactics.js by
# align-tactics-target-context-probe.mjs). CI vector: run-unit-tests.sh has no
# mapping for .claude/workflows/*, so a PR touching only align-tactics.js
# triggers no vitest suite. Its test-*.sh glob over this directory is NOT a
# fallback either — that glob only runs when RUN_PR_SCRIPTS is set, which
# auto-detect sets solely for changed paths under
# .claude/skills/dispatch-propagate/scripts/ (run-unit-tests.sh:88). So this
# script is wired unconditionally into the hook-tests job of
# .github/workflows/unit-tests.yml; that step is the only thing that runs this
# coverage on every PR. Keep it wired.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

echo "Test: align-tactics tactic-mode target-node context"

out_tc=$(node "$SCRIPT_DIR/align-tactics-target-context-probe.mjs")

assert_eq "align-tactics target-context: all probe vectors pass" \
  "align-tactics-target-context-probe: ALL PASS" \
  "$(printf '%s' "$out_tc" | tail -n1)"

report_results
