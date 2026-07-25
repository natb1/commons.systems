#!/usr/bin/env bash
# Tests for dispatch-review-dedup -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 22584-22652.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# === dispatch-review-dedup ===
# ============================================================================

echo "Test: dispatch-review-dedup"

# same location, partition collapses → length 1, sources merged, Confidence max, OWASP from high
IN1='{"findings":[{"id":"a","Location":"f.ts:1","Source":"review","OWASP":"","STRIDE":"","Confidence":"low"},{"id":"b","Location":"f.ts:1","Source":"security-review","OWASP":"A03:2021 Injection","STRIDE":"Tampering","Confidence":"high"}],"partition":[["a","b"]]}'
out=$(printf '%s' "$IN1" | "$SCRIPT_DIR/dispatch-review-dedup")
assert_eq "dedup: same-location merge → length 1" "1" "$(printf '%s' "$out" | jq -r 'length')"
assert_eq "dedup: same-location merge → sources union" '["review","security-review"]' "$(printf '%s' "$out" | jq -c '.[0].sources')"
assert_eq "dedup: same-location merge → Confidence max (high)" "high" "$(printf '%s' "$out" | jq -r '.[0].Confidence')"
assert_eq "dedup: same-location merge → OWASP from high-confidence member" "A03:2021 Injection" "$(printf '%s' "$out" | jq -r '.[0].OWASP')"

# distinct locations → length 2
IN2='{"findings":[{"id":"a","Location":"f.ts:1","Source":"review","OWASP":"","STRIDE":"","Confidence":"low"},{"id":"b","Location":"f.ts:9","Source":"review","OWASP":"","STRIDE":"","Confidence":"low"}],"partition":[["a"],["b"]]}'
out=$(printf '%s' "$IN2" | "$SCRIPT_DIR/dispatch-review-dedup")
assert_eq "dedup: distinct locations → length 2" "2" "$(printf '%s' "$out" | jq -r 'length')"

# same location, distinct root issues, partition keeps them apart → length 2
IN3='{"findings":[{"id":"a","Location":"f.ts:1","Source":"review","OWASP":"","STRIDE":"","Confidence":"low"},{"id":"b","Location":"f.ts:1","Source":"secrets","OWASP":"A02:2021 Cryptographic Failures","STRIDE":"Information Disclosure","Confidence":"medium"}],"partition":[["a"],["b"]]}'
out=$(printf '%s' "$IN3" | "$SCRIPT_DIR/dispatch-review-dedup")
assert_eq "dedup: same-location distinct-root partition → length 2" "2" "$(printf '%s' "$out" | jq -r 'length')"

# absent-id partition: unknown id is skipped, present finding survives, exit 0
IN4='{"findings":[{"id":"a","Location":"f.ts:1","Source":"review","OWASP":"","STRIDE":"","Confidence":"low"}],"partition":[["a","zzz"]]}'
if out=$(printf '%s' "$IN4" | "$SCRIPT_DIR/dispatch-review-dedup"); then rc=0; else rc=$?; fi
assert_eq "dedup: absent-id partition → exit 0" "0" "$rc"
assert_eq "dedup: absent-id partition → length 1 (unknown id skipped)" "1" "$(printf '%s' "$out" | jq -r 'length')"
assert_eq "dedup: absent-id partition → present finding emitted" "a" "$(printf '%s' "$out" | jq -r '.[0].id')"
# Discriminating assertion: WITHOUT the map(select(.finding != null)) filter
# (dispatch-review-dedup:79-80), the null member pollutes the union →
# ["review", null]. exit/length/id all still pass without the filter, so this
# sources check is the only one that actually guards the absent-id fix.
assert_eq "dedup: absent-id partition → sources unpolluted by null member" '["review"]' "$(printf '%s' "$out" | jq -c '.[0].sources')"
assert_eq "dedup: absent-id partition → absent id zzz never emitted (id or sources)" "0" "$(printf '%s' "$out" | jq -r '[.[] | select(.id == "zzz" or ((.sources // []) | index("zzz")))] | length')"

# empty findings → [], exit 0
IN5='{"findings":[],"partition":[]}'
if out=$(printf '%s' "$IN5" | "$SCRIPT_DIR/dispatch-review-dedup"); then rc=0; else rc=$?; fi
assert_eq "dedup: empty findings → exit 0" "0" "$rc"
assert_eq "dedup: empty findings → []" "[]" "$(printf '%s' "$out" | jq -c '.')"

# missing Confidence field → graceful fallback (Confidence: null), exit 0
IN6='{"findings":[{"id":"a","Location":"f.ts:1","Source":"review","OWASP":"","STRIDE":""}],"partition":[]}'
if out=$(printf '%s' "$IN6" | "$SCRIPT_DIR/dispatch-review-dedup"); then rc=0; else rc=$?; fi
assert_eq "dedup: missing Confidence → exit 0" "0" "$rc"
assert_eq "dedup: missing Confidence → length 1" "1" "$(printf '%s' "$out" | jq -r 'length')"
assert_eq "dedup: missing Confidence → Confidence null fallback" "null" "$(printf '%s' "$out" | jq -c '.[0].Confidence')"

# same location, partition splits into separate sub-groups → length 2, each sub-group keeps its own Confidence (no cross-boundary max)
IN7='{"findings":[{"id":"a","Location":"f.ts:1","Source":"security-review","OWASP":"A03:2021 Injection","STRIDE":"Tampering","Confidence":"high"},{"id":"b","Location":"f.ts:1","Source":"review","OWASP":"","STRIDE":"","Confidence":"low"}],"partition":[["a"],["b"]]}'
out=$(printf '%s' "$IN7" | "$SCRIPT_DIR/dispatch-review-dedup")
assert_eq "dedup: partition-split → length 2" "2" "$(printf '%s' "$out" | jq -r 'length')"
assert_eq "dedup: partition-split → output[0] Confidence preserved (high)" "high" "$(printf '%s' "$out" | jq -r '.[0].Confidence')"
assert_eq "dedup: partition-split → output[1] Confidence preserved (low)" "low" "$(printf '%s' "$out" | jq -r '.[1].Confidence')"

# all-absent partition group: every member absent from findings → group
# collapses to nothing (not a junk finding), exit 0. Distinct from IN5
# (empty partition): here the partition is NON-empty but references only
# absent ids. Discriminating: WITHOUT the empty-group drop, this group
# emits {"Confidence":null,...} and length is 1, so the [] / length-0
# assertion is the one that guards the fix.
IN8='{"findings":[],"partition":[["zzz","yyy"]]}'
if out=$(printf '%s' "$IN8" | "$SCRIPT_DIR/dispatch-review-dedup"); then rc=0; else rc=$?; fi
assert_eq "dedup: all-absent partition group → exit 0" "0" "$rc"
assert_eq "dedup: all-absent partition group → length 0" "0" "$(printf '%s' "$out" | jq -r 'length')"
assert_eq "dedup: all-absent partition group → []" "[]" "$(printf '%s' "$out" | jq -c '.')"

# <<< END MOVED <<<

report_results
