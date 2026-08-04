#!/usr/bin/env bash
# Tests for dispatch-epic-labels -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 2104-2128.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-epic-labels unit tests (#2235)
# ============================================================================
echo ""
echo "=== dispatch-epic-labels ==="

# The helper is copied into TMPDIR_TEST by setup() (task A wiring), and it calls
# dispatch-config-load which setup() also copies. Run it directly and assert stdout.

# E-1. No epic.json in $DISPATCH_CONFIG_DIR → stdout is exactly "epic" (the
# built-in default).
echo "Test: dispatch-epic-labels — no config → stdout is 'epic'"
setup
out=$("$TMPDIR_TEST/dispatch-epic-labels")
assert_eq "no config → stdout is 'epic'" "epic" "$out"
teardown

# E-2. epic.json = {"labels":["a","b"]} → stdout is "a" then "b" (two lines).
echo "Test: dispatch-epic-labels — config with two labels → stdout is 'a' then 'b'"
setup
printf '{"labels":["a","b"]}\n' > "$DISPATCH_CONFIG_DIR/epic.json"
out=$("$TMPDIR_TEST/dispatch-epic-labels")
assert_eq "config two labels → stdout is 'a' then 'b'" "$(printf 'a\nb')" "$out"
teardown

# <<< END MOVED <<<

report_results
