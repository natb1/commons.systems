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

# --- cross-lane dedup priority (tactic-review-cross-lane-dedup) -------------
# A same-root group spanning Lane A (code-review/security-review) and Lane B
# (everything else) must always let the Lane-B member win representative/id/
# Source selection, regardless of Confidence — a Lane-A win would let a
# Lane-A-derived entry acquire bucket `Required`, narrowing verify eligibility.

# (a) high-confidence code-review member + low-confidence secrets member,
# same location, partitioned together → representative is the secrets one
# (id/Source), Confidence is still the group MAX (high), sources is the union.
INX1='{"findings":[{"id":"a","Location":"f.ts:1","Source":"code-review","OWASP":"","STRIDE":"","Confidence":"high"},{"id":"b","Location":"f.ts:1","Source":"secrets","OWASP":"A02:2021 Cryptographic Failures","STRIDE":"Information Disclosure","Confidence":"low"}],"partition":[["a","b"]]}'
out=$(printf '%s' "$INX1" | "$SCRIPT_DIR/dispatch-review-dedup")
assert_eq "dedup: cross-lane group → representative id is Lane-B member" "b" "$(printf '%s' "$out" | jq -r '.[0].id')"
assert_eq "dedup: cross-lane group → representative Source is Lane-B member" "secrets" "$(printf '%s' "$out" | jq -r '.[0].Source')"
assert_eq "dedup: cross-lane group → Confidence is group max (high)" "high" "$(printf '%s' "$out" | jq -r '.[0].Confidence')"
assert_eq "dedup: cross-lane group → sources union" '["code-review","secrets"]' "$(printf '%s' "$out" | jq -c '.[0].sources')"

# (b) two-Lane-B group is unaffected by the lane-priority term — regression
# guard on today's Confidence-desc/idx-asc behavior (both members are Lane B,
# so the lane-a flag is 0/0 for both and the tie-break falls through to
# Confidence exactly as before).
INX2='{"findings":[{"id":"a","Location":"f.ts:1","Source":"secrets","OWASP":"","STRIDE":"","Confidence":"low"},{"id":"b","Location":"f.ts:1","Source":"domain-sweep","OWASP":"A03:2021 Injection","STRIDE":"Tampering","Confidence":"high"}],"partition":[["a","b"]]}'
out=$(printf '%s' "$INX2" | "$SCRIPT_DIR/dispatch-review-dedup")
assert_eq "dedup: two-Lane-B group → representative id is high-Confidence member" "b" "$(printf '%s' "$out" | jq -r '.[0].id')"
assert_eq "dedup: two-Lane-B group → Confidence max (high)" "high" "$(printf '%s' "$out" | jq -r '.[0].Confidence')"

# (c) Lane-A-only group still picks the Confidence-desc/idx-asc winner — the
# lane-a flag is 1/1 for both members, so it never discriminates and the
# existing tie-break governs.
INX3='{"findings":[{"id":"a","Location":"f.ts:1","Source":"code-review","OWASP":"","STRIDE":"","Confidence":"low"},{"id":"b","Location":"f.ts:1","Source":"security-review","OWASP":"A01:2021 Broken Access Control","STRIDE":"Elevation of Privilege","Confidence":"high"}],"partition":[["a","b"]]}'
out=$(printf '%s' "$INX3" | "$SCRIPT_DIR/dispatch-review-dedup")
assert_eq "dedup: Lane-A-only group → representative id is high-Confidence member" "b" "$(printf '%s' "$out" | jq -r '.[0].id')"
assert_eq "dedup: Lane-A-only group → Confidence max (high)" "high" "$(printf '%s' "$out" | jq -r '.[0].Confidence')"

report_results
