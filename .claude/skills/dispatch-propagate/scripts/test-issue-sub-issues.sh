#!/usr/bin/env bash
# Tests for issue-sub-issues -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 2129-2180.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# issue-sub-issues output-shape tests (#2257)
# ============================================================================
echo ""
echo "=== issue-sub-issues output shape ==="

# issue-sub-issues now emits one gh_issue_view_rest object per sub-issue (#2257),
# replacing the GraphQL `gh issue view --json <FIELDS>` porcelain. The former
# FIELDS arg (#1593) is gone: the helper has a FIXED projection. So the old
# field-forwarding tests (which asserted the requested --json field set) are
# retired in favor of asserting the EMITTED object shape — a stronger check of
# the actual consumer contract (number/state/stateReason). Children route to the
# generic `api repos/*/issues/<N>` stub arm by number → arg-issue-<N>.json
# supplies each child's raw REST object.
#
# These tests run the REAL issue-sub-issues script (setup() installs a fake for
# dispatch-trace-leaf; we overwrite it with the real script here).

# A. One child → exactly one emitted object carrying number/state/stateReason.
# (Leanness via #1593's narrow --json field set is superseded by the helper's
# fixed projection; this epic's goal is GraphQL rate-limit relief, not payload
# size. The helper does project body/labels/etc., which the consumers ignore.)
echo "Test: issue-sub-issues — one child → one object with number/state/stateReason"
setup
cp "$SCRIPT_DIR/issue-sub-issues" "$TMPDIR_TEST/issue-sub-issues"
chmod +x "$TMPDIR_TEST/issue-sub-issues"
printf '[{"number":801}]\n' > "$STUB_DIR/subissues-80.json"
printf '{"number":801,"state":"closed","state_reason":"completed"}\n' > "$STUB_DIR/arg-issue-801.json"
out=$("$TMPDIR_TEST/issue-sub-issues" 80)
assert_eq "one child: object count" "1" "$(printf '%s' "$out" | jq -s 'length')"
assert_eq "one child: number" "801" "$(printf '%s' "$out" | jq -s '.[0].number')"
assert_eq "one child: state upcased" "CLOSED" "$(printf '%s' "$out" | jq -rs '.[0].state')"
assert_eq "one child: stateReason upcased" "COMPLETED" "$(printf '%s' "$out" | jq -rs '.[0].stateReason')"
teardown

# B. Two children → two emitted objects, each with the projected keys (the
# per-child-emission invariant the old test D guarded, now asserted on output).
echo "Test: issue-sub-issues — two children → two objects, both with number/state"
setup
cp "$SCRIPT_DIR/issue-sub-issues" "$TMPDIR_TEST/issue-sub-issues"
chmod +x "$TMPDIR_TEST/issue-sub-issues"
printf '[{"number":831},{"number":832}]\n' > "$STUB_DIR/subissues-83.json"
printf '{"number":831,"state":"open","state_reason":null}\n' > "$STUB_DIR/arg-issue-831.json"
printf '{"number":832,"state":"closed","state_reason":"completed"}\n' > "$STUB_DIR/arg-issue-832.json"
out=$("$TMPDIR_TEST/issue-sub-issues" 83)
assert_eq "two children: object count" "2" "$(printf '%s' "$out" | jq -s 'length')"
assert_eq "two children: numbers" "831 832" \
  "$(printf '%s' "$out" | jq -rs 'map(.number) | join(" ")')"
assert_eq "two children: all carry state" "2" \
  "$(printf '%s' "$out" | jq -s '[.[] | select(has("state"))] | length')"
teardown

# <<< END MOVED <<<

report_results
