#!/usr/bin/env bash
# Tests for qa-fix-partition -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 22753-22816.
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

# ============================================================================
# === align-tactics tempref (resolveTempRefs) ===
# ============================================================================
# CI vector: run-unit-tests.sh has no mapping for .claude/workflows/*, so a PR
# touching only align-tactics.js triggers no vitest suite. The hook-tests job
# (this script) is the only test that runs on every PR, so coverage for
# resolveTempRefs must live here. The probe slices the pure function out of
# align-tactics.js between sentinel comments and evals just that slice, then runs
# valid-resolution / dangling-ref (rule 13) / cycle (rule 15) assertions.

echo "Test: align-tactics tempref (resolveTempRefs)"

out_at=$(node "$SCRIPT_DIR/align-tactics-tempref-probe.mjs")

# The probe runs its own assertions and prints "ALL PASS" on the final line only
# when every vector passed (and exits non-zero otherwise). Assert on that token.
assert_eq "align-tactics tempref: all probe vectors pass" "align-tactics-tempref-probe: ALL PASS" "$(printf '%s' "$out_at" | tail -n1)"

# planned-deferral branch (issue #1891) — three separate input objects to avoid
# disturbing the f1..f7 order assertion above.
#
# (a) opus-fixable + planned_deferral:true → authoritatively needs-main / n/a
#     (the literal original failure mode: an opus-fixable item routed to the
#     auto-fix loop because the planned-deferral branch was absent)
IN_PD_A='{"items":[{"id":"pd1","class":"opus-fixable","aesthetic":false,"planned_deferral":true}],"votes":{}}'
out_pd_a=$(printf '%s' "$IN_PD_A" | "$SCRIPT_DIR/dispatch-qa-disposition")
assert_eq "qa-disposition: planned_deferral opus-fixable → final_class=needs-main" "needs-main" "$(printf '%s' "$out_pd_a" | jq -r '.dispositions[0].final_class')"
assert_eq "qa-disposition: planned_deferral opus-fixable → verify=n/a" "n/a" "$(printf '%s' "$out_pd_a" | jq -r '.dispositions[0].verify')"

# (b) needs-human + planned_deferral:true WITH a refuting vote → stays needs-main/n/a
#     (NOT downgraded to opus-fixable — the fan-out is bypassed by the first branch)
IN_PD_B='{"items":[{"id":"pd2","class":"needs-human","aesthetic":false,"planned_deferral":true}],"votes":{"pd2":["refuted"]}}'
out_pd_b=$(printf '%s' "$IN_PD_B" | "$SCRIPT_DIR/dispatch-qa-disposition")
assert_eq "qa-disposition: planned_deferral needs-human with refuted vote → final_class=needs-main (not downgraded to opus-fixable)" "needs-main" "$(printf '%s' "$out_pd_b" | jq -r '.dispositions[0].final_class')"
assert_eq "qa-disposition: planned_deferral needs-human with refuted vote → verify=n/a (not Refuted)" "n/a" "$(printf '%s' "$out_pd_b" | jq -r '.dispositions[0].verify')"

# (c) regression guard — non-flagged needs-human with refuting vote still downgrades
#     (genuine opus-fixable behavior unchanged; f3 above already proves this but
#     we repeat it inline as a named regression guard for clarity)
IN_PD_C='{"items":[{"id":"pd3","class":"needs-human","aesthetic":false}],"votes":{"pd3":["refuted"]}}'
out_pd_c=$(printf '%s' "$IN_PD_C" | "$SCRIPT_DIR/dispatch-qa-disposition")
assert_eq "qa-disposition: regression guard non-flagged needs-human + refuted → final_class=opus-fixable" "opus-fixable" "$(printf '%s' "$out_pd_c" | jq -r '.dispositions[0].final_class')"
assert_eq "qa-disposition: regression guard non-flagged needs-human + refuted → verify=Refuted" "Refuted" "$(printf '%s' "$out_pd_c" | jq -r '.dispositions[0].verify')"

# <<< END MOVED <<<

report_results
