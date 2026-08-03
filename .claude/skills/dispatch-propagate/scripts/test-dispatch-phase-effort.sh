#!/usr/bin/env bash
# Tests for dispatch-phase-effort -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 14918-14977.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-phase-effort tests
# ============================================================================
echo "=== dispatch-phase-effort ==="

echo "Test: dispatch-phase-effort maps implement → medium"
if pe_out=$("$SCRIPT_DIR/dispatch-phase-effort" implement 2>/dev/null); then pe_rc=0; else pe_rc=$?; fi
assert_eq "phase-effort: implement exits 0" "0" "$pe_rc"
assert_eq "phase-effort: implement → medium" "medium" "$pe_out"

echo "Test: dispatch-phase-effort maps plan → high"
if pe_out=$("$SCRIPT_DIR/dispatch-phase-effort" plan 2>/dev/null); then pe_rc=0; else pe_rc=$?; fi
assert_eq "phase-effort: plan exits 0" "0" "$pe_rc"
assert_eq "phase-effort: plan → high" "high" "$pe_out"

echo "Test: dispatch-phase-effort maps unmapped phases → empty (default, no override)"
for ph in fix-checks qa review done; do
  if pe_out=$("$SCRIPT_DIR/dispatch-phase-effort" "$ph" 2>/dev/null); then pe_rc=0; else pe_rc=$?; fi
  assert_eq "phase-effort: $ph exits 0" "0" "$pe_rc"
  assert_eq "phase-effort: $ph → empty (no --effort, inherit session default)" "" "$pe_out"
done

echo "Test: dispatch-phase-effort with no phase arg exits 2"
if "$SCRIPT_DIR/dispatch-phase-effort" 2>/dev/null; then pe_rc=0; else pe_rc=$?; fi
assert_eq "phase-effort: no-arg → exit 2" "2" "$pe_rc"

echo "Test: dispatch-phase-effort with an empty-string arg exits 2"
if "$SCRIPT_DIR/dispatch-phase-effort" "" 2>/dev/null; then pe_rc=0; else pe_rc=$?; fi
assert_eq "phase-effort: empty-string-arg → exit 2" "2" "$pe_rc"

# --- review-fix model-tiering content guards (#1172) --------------------------
# The review-fix orchestrator runs on Sonnet; fix-authoring is delegated to an
# Opus subagent. The review-fix.js `--fix` guard below is INTENTIONALLY
# INVERTED from the original #1172 doctrine ("code-review is detection-only,
# no --fix"): tactic-review-phase-trust-builtin-review deliberately reverses
# this — code-review now runs `/code-review <effort> --fix` and applies its own
# fixes directly (Lane-A trust-the-built-in doctrine), with only its
# un-auto-fixed residue dispositioned by the residue phase.
#
# The Opus fix-authoring guard below targets review-fix.js (the RUNTIME file
# that actually enforces the pin at its fix fan-out `agent()` call), NOT the
# SKILL.md prose. tactic-thin-oversized-skill-bodies moves fixed doctrine out
# of the orchestrator body into references/*.md, so a grep against the thinned
# SKILL.md body was a brittle proxy — a later thinning pass could relocate the
# string again. Per .claude/rules/test-integrity.md, re-pointing this guard at
# the mechanism that enforces the invariant strengthens it (the "Opus
# fix-authoring" invariant still holds); it is not weakening a red test.
#
# The `--fix` guard was re-pointed a SECOND time by
# tactic-review-code-review-invocation-contract, for the same reason and under the
# same rule. The invariant it protects — "the built-in /code-review runs WITH
# --fix and applies its own edits" — is unchanged and still asserted. What moved
# is the mechanism: the old review-fix.js prompt told a subagent to call the
# built-in via the Skill tool, and that call was ALWAYS rejected
# (disable-model-invocation), so the string it grepped for described an
# invocation that never actually happened. The invocation now lives in
# `dispatch-code-review`, which builds the literal `/code-review <effort> --fix`
# prompt for a `claude -p` user turn — a real call site, not prompt prose. The
# guard therefore points at that script, and a second assertion pins the removal
# of the dead Skill-tool instruction. Strictly stronger, not weaker.
REPO_ROOT=$(cd "$SCRIPT_DIR/../../../.." && pwd)
RF_WORKFLOW="$REPO_ROOT/.claude/workflows/review-fix.js"
CR_SCRIPT="$SCRIPT_DIR/dispatch-code-review"

echo "Test: review-fix.js pins fix-authoring to Opus (model: 'opus' present in the runtime)"
if grep -q "model: 'opus'" "$RF_WORKFLOW"; then rf_opus=yes; else rf_opus=no; fi
assert_eq "review-fix: Opus fix-authoring pinned" "yes" "$rf_opus"

echo "Test: dispatch-code-review invokes /code-review with --fix (Lane-A trust-the-built-in doctrine, tactic-review-code-review-invocation-contract)"
assert_eq "dispatch-code-review: /code-review --fix call site present" "1" "$(grep -c -F -- 'PROMPT="/code-review $EFFORT --fix"' "$CR_SCRIPT" || true)"

echo "Test: review-fix.js no longer carries a Skill-tool /code-review invocation (it was always rejected with disable-model-invocation)"
assert_eq "review-fix.js: no Skill-tool code-review instruction" "0" "$(grep -i -- "skill tool" "$RF_WORKFLOW" | grep -ci -- "code-review" || true)"

echo "Test: review-fix.js contains the residue phase (tactic-review-phase-trust-builtin-review)"
assert_eq "review-fix.js: residue phase present" "1" "$(grep -c -- "title: 'residue'" "$RF_WORKFLOW" || true)"

# <<< END MOVED <<<

report_results
