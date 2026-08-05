#!/usr/bin/env bash
# Tests for dispatch-plan-finalize -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 4694-4756.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-plan-finalize tests (#1230)
# ============================================================================
echo ""
echo "=== dispatch-plan-finalize ==="

# #1230: dispatch-plan-finalize composes the three plan-completion sub-steps in a
# fixed order whose load-bearing invariant is marker-BEFORE-label:
#   1. dispatch-write-plan       (persist the plan comment — durable)
#   2. dispatch-mark-complete    (write the per-session phase-completed marker)
#   3. dispatch-apply-planned    (apply the dispatch:planned label — LAST)
# Because the durable label is written last, its presence guarantees the
# ephemeral marker was already written in the same session. A crash in the
# window between step 2 and step 3 leaves the label ABSENT, so dispatch-phase
# returns "plan" (recoverable via office-hours plan-clarification) instead of
# "implement" (the old dead-end). This test pins that order so it cannot silently
# drift back to the pre-fix (label-before-marker) sequence.
echo "Test: dispatch-plan-finalize runs siblings in marker-before-label order (#1230)"
setup
export STUB_DIR  # the order-logging sibling stubs read STUB_DIR from the env
export CLAUDE_JOB_DIR="$TMPDIR_TEST/job"
mkdir -p "$CLAUDE_JOB_DIR"
# Overwrite the three siblings in TMPDIR_TEST (where dispatch-plan-finalize's
# SCRIPT_DIR resolves) with order-logging stubs.
cat > "$TMPDIR_TEST/dispatch-write-plan" <<'STUB'
#!/usr/bin/env bash
cat >/dev/null
echo write-plan >> "$STUB_DIR/finalize-order.log"
STUB
# dispatch-mark-complete logs AND touches the marker — load-bearing: the
# apply-planned stub asserts the marker already exists when it runs, so a stub
# that only logged would make the order assertion misleading.
cat > "$TMPDIR_TEST/dispatch-mark-complete" <<'STUB'
#!/usr/bin/env bash
echo mark-complete >> "$STUB_DIR/finalize-order.log"
touch "$CLAUDE_JOB_DIR/phase-completed"
STUB
cat > "$TMPDIR_TEST/dispatch-apply-planned" <<'STUB'
#!/usr/bin/env bash
if [[ -f "$CLAUDE_JOB_DIR/phase-completed" ]]; then
  echo apply-planned >> "$STUB_DIR/finalize-order.log"
else
  echo apply-planned-NO-MARKER >> "$STUB_DIR/finalize-order.log"
fi
STUB
chmod +x "$TMPDIR_TEST/dispatch-write-plan" \
         "$TMPDIR_TEST/dispatch-mark-complete" \
         "$TMPDIR_TEST/dispatch-apply-planned"
"$TMPDIR_TEST/dispatch-plan-finalize" 55 <<<'plan body text'
# The order log records the three steps in sequence. apply-planned (not
# apply-planned-NO-MARKER) confirms the marker existed when apply-planned ran —
# i.e. the marker was written before the label.
assert_eq "dispatch-plan-finalize: marker before label (#1230)" \
  "$(printf 'write-plan\nmark-complete\napply-planned\n')" \
  "$(cat "$STUB_DIR/finalize-order.log")"
# Arg-validation smoke: a non-numeric issue-num exits 2. This path returns at the
# integer check BEFORE reading STDIN or calling any sibling, so </dev/null is
# harmless, finalize-order.log is untouched, and no network is reached.
if "$TMPDIR_TEST/dispatch-plan-finalize" abc </dev/null 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "dispatch-plan-finalize: non-numeric arg exits 2" "2" "$rc"
unset CLAUDE_JOB_DIR
teardown

# <<< END MOVED <<<

report_results
