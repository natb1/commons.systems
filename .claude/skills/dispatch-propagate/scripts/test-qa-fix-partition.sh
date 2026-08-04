#!/usr/bin/env bash
# Tests for qa-fix-partition (partitionDispositions, sliced out of
# .claude/workflows/qa-fix.js by qa-fix-partition-probe.mjs) -- moved verbatim
# from test-dispatch-scripts.sh (tactic-dispatch-test-monolith-split). Original
# section: 22753-22816, less two trailing blocks re-homed to their own SUTs:
# the align-tactics resolveTempRefs block (test-align-tactics-tempref.sh) and
# the dispatch-qa-disposition planned-deferral block
# (test-dispatch-qa-disposition.sh).
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# === qa-fix partition (#1844) ===
# ============================================================================
# CI vector: run-unit-tests.sh has no mapping for .claude/workflows/*, so a PR
# touching only qa-fix.js triggers no vitest suite. The hook-tests job (this
# script) is the only test that runs on every PR, so coverage for
# partitionDispositions must live here. The probe slices the pure function out
# of qa-fix.js between sentinel comments and evals just that slice.

echo "Test: qa-fix partition (#1844)"

out=$(node "$SCRIPT_DIR/qa-fix-partition-probe.mjs")

# already-satisfied id (p4) is partitioned OUT of dispositions
assert_eq "qa-fix partition: already-satisfied id absent from dispositions" "false" "$(printf '%s' "$out" | jq -r '.dispositions | any(. == "p4")')"
# already-satisfied id (p4) is partitioned INTO already_satisfied
assert_eq "qa-fix partition: already-satisfied id present in already_satisfied" "true" "$(printf '%s' "$out" | jq -r '.already_satisfied | any(. == "p4")')"
# inverse guard: a non-already-satisfied id (p1, opus-fixable) stays in dispositions
assert_eq "qa-fix partition: non-already-satisfied id present in dispositions" "true" "$(printf '%s' "$out" | jq -r '.dispositions | any(. == "p1")')"
# anti-over-filtering: needs-main (p2) and needs-human (p3) must ALSO survive in
# dispositions. Without these, a regression like `class !== 'needs-main'` in the
# dispositions filter would pass (p1 still present, p4 still absent).
assert_eq "qa-fix partition: needs-main id present in dispositions" "true" "$(printf '%s' "$out" | jq -r '.dispositions | any(. == "p2")')"
assert_eq "qa-fix partition: needs-human id present in dispositions" "true" "$(printf '%s' "$out" | jq -r '.dispositions | any(. == "p3")')"
# count guard: exactly the 3 non-already-satisfied items land in dispositions.
assert_eq "qa-fix partition: dispositions count is 3" "3" "$(printf '%s' "$out" | jq -r '.dispositions | length')"
# shape guard: the already_satisfied projection keeps exactly {id, title, kind,
# rationale} — class/aesthetic/verify are stripped. A regression that omits a
# key or leaks a stripped field changes this sorted key set.
assert_eq "qa-fix partition: already_satisfied element keys" '["id","kind","rationale","title"]' "$(printf '%s' "$out" | jq -c '.already_satisfied_keys')"
# call-site coverage: qa-fix.js still invokes the function the probe slices.
# This file defines its own assert_eq (it does not source test-helpers.sh), so
# use the grep -c | assert_eq convention the rest of the suite uses.
# Match `= partitionDispositions(allDispositions)` (the call site), not the bare
# `function partitionDispositions(allDispositions)` definition — both contain the
# call substring, so the `= ` prefix isolates the invocation to exactly one line.
assert_eq "qa-fix partition: call site present in qa-fix.js" "1" "$(grep -c '= partitionDispositions(allDispositions)' "$REPO_ROOT/.claude/workflows/qa-fix.js" || true)"

# <<< END MOVED <<<

report_results
