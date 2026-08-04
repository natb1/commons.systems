#!/usr/bin/env bash
# Tests for dispatch-finalize-phase -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 17917-18064.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-finalize-phase tests (#2243)
# ============================================================================
echo ""
echo "=== dispatch-finalize-phase ==="

# --- Test #2243-D2: finalize-phase spawns once + strips office-hours + self-closes last ---
# dispatch-finalize-phase calls siblings via its own $SCRIPT_DIR. To stub them,
# copy the real script into a fresh tmpdir alongside stub siblings in that same
# dir (the same pattern as dispatch-plan-finalize above). gh is on PATH from a
# dedicated bin/ subdir inside the tmpdir.

echo "Test: #2243 D2 dispatch-finalize-phase: spawn-once + office-hours removed from issue and PR + self-close last"
FINALIZE_TMPDIR=$(mktemp -d)
FINALIZE_STUB_DIR="$FINALIZE_TMPDIR/stub"
FINALIZE_BIN="$FINALIZE_TMPDIR/bin"
FINALIZE_SCRIPTS="$FINALIZE_TMPDIR/scripts"
mkdir -p "$FINALIZE_STUB_DIR" "$FINALIZE_BIN" "$FINALIZE_SCRIPTS"

# Copy the real finalize script into the scripts dir so $SCRIPT_DIR resolves there.
cp "$SCRIPT_DIR/dispatch-finalize-phase" "$FINALIZE_SCRIPTS/dispatch-finalize-phase"
chmod +x "$FINALIZE_SCRIPTS/dispatch-finalize-phase"
# dispatch-finalize-phase now `source`s lib.sh via $SCRIPT_DIR for the REST-backed
# gh helpers: gh_issue_remove_label_rest (the label mutation, #2256) and
# gh_issue_view_rest (the issue read, #2257). Copy lib.sh alongside it so the
# source resolves (this private tmpdir does not use the shared `setup`, which
# copies lib.sh).
cp "$SCRIPT_DIR/lib.sh" "$FINALIZE_SCRIPTS/lib.sh"

# Stub dispatch-spawn-tick: log to order.log and spawn-calls.log.
cat > "$FINALIZE_SCRIPTS/dispatch-spawn-tick" <<'STUB'
#!/usr/bin/env bash
echo "spawn" >> "$FINALIZE_STUB_DIR/order.log"
echo "spawn" >> "$FINALIZE_STUB_DIR/spawn-calls.log"
exit 0
STUB
chmod +x "$FINALIZE_SCRIPTS/dispatch-spawn-tick"

# Stub dispatch-spawn-sweep: log to sweep-calls.log (no order entry — mirrors stop harness).
cat > "$FINALIZE_SCRIPTS/dispatch-spawn-sweep" <<'STUB'
#!/usr/bin/env bash
echo "sweep" >> "$FINALIZE_STUB_DIR/sweep-calls.log"
exit 0
STUB
chmod +x "$FINALIZE_SCRIPTS/dispatch-spawn-sweep"

# Stub dispatch-self-close: log to order.log and self-close-calls.log.
cat > "$FINALIZE_SCRIPTS/dispatch-self-close" <<'STUB'
#!/usr/bin/env bash
echo "self-close" >> "$FINALIZE_STUB_DIR/order.log"
echo "self-close" >> "$FINALIZE_STUB_DIR/self-close-calls.log"
exit 0
STUB
chmod +x "$FINALIZE_SCRIPTS/dispatch-self-close"

# Stub gh: handle issue view (rate-limit labels — return empty) and the #2256
# REST DELETE label removals (gh api -X DELETE .../issues/<N>/labels/<name>). A PR
# is an issue in REST, so both the PR-456 and issue-123 office-hours removals hit
# the same issues/<N>/labels/<name> path; log every DELETE to one file and assert
# on the number. Return an empty body (success) so gh_issue_remove_label_rest's
# 404-tolerance branch is not triggered.
cat > "$FINALIZE_BIN/gh" <<'STUB'
#!/usr/bin/env bash
FINALIZE_STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
case "$args" in
  api\ repos/*/issues/*)
    # finalize-phase reads the issue via gh_issue_view_rest (#2257). Emit a raw-REST
    # object with no rate-limit-retry labels to clear (and a state so the helper's
    # .state|ascii_upcase does not error).
    printf '{"number":0,"state":"open","labels":[]}\n'
    ;;
  api\ -X\ DELETE\ */issues/*/labels/*)
    echo "$args" >> "$FINALIZE_STUB_DIR/gh-label-remove.log"
    echo '[]'
    ;;
  *)
    echo "gh stub: unknown invocation: $args" >&2
    exit 1
    ;;
esac
STUB
chmod +x "$FINALIZE_BIN/gh"

export PATH="$FINALIZE_BIN:$SAVED_PATH"
export FINALIZE_STUB_DIR
export CLAUDE_JOB_DIR="$FINALIZE_TMPDIR/job"
mkdir -p "$CLAUDE_JOB_DIR"

"$FINALIZE_SCRIPTS/dispatch-finalize-phase" 123 --pr 456
rc=$?
assert_eq "#2243 D2 dispatch-finalize-phase: exits 0" "0" "$rc"

# Assert office-hours REST-removed from the PR (issues/456/labels/dispatch:office-hours).
remove_log=$(cat "$FINALIZE_STUB_DIR/gh-label-remove.log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$remove_log" == *"issues/456/labels/dispatch:office-hours"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: #2243 D2: REST DELETE dispatch:office-hours issued for PR 456"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: #2243 D2: REST DELETE dispatch:office-hours issued for PR 456"
  echo "    gh-label-remove.log: $remove_log"
fi

# Assert office-hours REST-removed from the issue (issues/123/labels/dispatch:office-hours).
TOTAL=$((TOTAL + 1))
if [[ "$remove_log" == *"issues/123/labels/dispatch:office-hours"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: #2243 D2: REST DELETE dispatch:office-hours issued for issue 123"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: #2243 D2: REST DELETE dispatch:office-hours issued for issue 123"
  echo "    gh-label-remove.log: $remove_log"
fi

# Assert spawn invoked exactly once.
spawn_calls=$(wc -l < "$FINALIZE_STUB_DIR/spawn-calls.log" 2>/dev/null || echo 0)
assert_eq "#2243 D2 dispatch-finalize-phase: spawn invoked exactly once" "1" "$spawn_calls"

# Assert sweep invoked.
TOTAL=$((TOTAL + 1))
if [[ -e "$FINALIZE_STUB_DIR/sweep-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: #2243 D2: sweep invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: #2243 D2: sweep invoked"
fi

# Assert self-close invoked.
TOTAL=$((TOTAL + 1))
if [[ -e "$FINALIZE_STUB_DIR/self-close-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: #2243 D2: self-close invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: #2243 D2: self-close invoked"
fi

# Assert self-close is LAST in order.log (spawn precedes self-close).
order_log=$(cat "$FINALIZE_STUB_DIR/order.log" 2>/dev/null || true)
last_entry=$(printf '%s' "$order_log" | tail -1)
TOTAL=$((TOTAL + 1))
if [[ "$last_entry" == "self-close" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: #2243 D2: self-close is last in order.log"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: #2243 D2: self-close is last in order.log"
  echo "    order.log: $order_log"
fi

unset CLAUDE_JOB_DIR FINALIZE_STUB_DIR
export PATH="$SAVED_PATH"
rm -rf "$FINALIZE_TMPDIR"


# <<< END MOVED <<<

report_results
