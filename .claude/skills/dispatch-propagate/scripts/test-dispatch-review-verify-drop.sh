#!/usr/bin/env bash
# Tests for dispatch-review-verify-drop -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 22653-22682.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# === dispatch-review-verify-drop ===
# ============================================================================

echo "Test: dispatch-review-verify-drop"

IN='{"findings":[{"id":"r1","bucket":"Required"},{"id":"r2","bucket":"Required"},{"id":"r3","bucket":"Required"},{"id":"r4","bucket":"Required"},{"id":"i1","bucket":"Informational"}],"votes":{"r1":["refuted","upheld"],"r2":["refuted","refuted"],"r3":["upheld","upheld"]}}'
out=$(printf '%s' "$IN" | "$SCRIPT_DIR/dispatch-review-verify-drop")

# dropped ids (sorted) == r1, r2, r4 (r4 = empty votes → Unverified, also dropped)
assert_eq "verify-drop: dropped ids" "r1
r2
r4" "$(printf '%s' "$out" | jq -r '.dropped[].id' | sort)"

# r1, r2 dropped with verify=="Refuted"
assert_eq "verify-drop: refuted dropped count" "2" "$(printf '%s' "$out" | jq -r '.dropped[] | select(.verify=="Refuted") | .id' | wc -l | tr -d ' ')"

# r1 NOT in kept
assert_eq "verify-drop: r1 not in kept" "0" "$(printf '%s' "$out" | jq -r '.kept[].id' | grep -c '^r1$' || true)"

# r3 in kept with verify=="Upheld"
assert_eq "verify-drop: r3 kept with verify=Upheld" "Upheld" "$(printf '%s' "$out" | jq -r '.kept[] | select(.id=="r3") | .verify')"

# r4 (empty votes — both skeptics failed) dropped with verify=="Unverified", NOT kept
assert_eq "verify-drop: r4 empty-votes dropped with verify=Unverified" "Unverified" "$(printf '%s' "$out" | jq -r '.dropped[] | select(.id=="r4") | .verify')"
assert_eq "verify-drop: r4 not in kept" "0" "$(printf '%s' "$out" | jq -r '.kept[].id' | grep -c '^r4$' || true)"

# i1 (non-Required) in kept with no verify key
assert_eq "verify-drop: i1 non-Required kept without verify key" "false" "$(printf '%s' "$out" | jq -r '.kept[] | select(.id=="i1") | has("verify")')"

# <<< END MOVED <<<

report_results
