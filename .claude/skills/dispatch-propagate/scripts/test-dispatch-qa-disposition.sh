#!/usr/bin/env bash
# Tests for dispatch-qa-disposition -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 22683-22752, plus the
# planned-deferral branch cases (#1891) from the tail of section 22753-22816 --
# those invoke dispatch-qa-disposition and their comments reference the f1..f7
# order assertion in this file, so they are re-homed here from
# test-qa-fix-partition.sh.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# === dispatch-qa-disposition ===
# ============================================================================

echo "Test: dispatch-qa-disposition"

# All branches in one object (order: f1..f8) plus a separate passthrough check.
# f1: opus-fixable  → final_class=opus-fixable, verify=n/a
# f2: needs-main    → final_class=needs-main,   verify=n/a
# f3: needs-human, aesthetic:false, votes=[refuted,upheld] → opus-fixable, Refuted
# f4: needs-human, aesthetic:false, votes=[upheld,upheld]  → needs-human,  Upheld
# f5: needs-human, aesthetic:false, NO entry in votes map  → needs-human,  Unverified (INVERTED EDGE)
# f6: needs-human, aesthetic:true,  votes=[refuted,refuted]→ needs-human,  n/a (aesthetic bypasses)
# f7: already-satisfied (no votes entry) → final_class=already-satisfied, verify=n/a (first-branch pass-through)
# f8: already-satisfied, votes=[refuted,refuted] present → final_class=already-satisfied, verify=n/a (votes ignored; vote-bypass invariant)
IN='{"items":[{"id":"f1","class":"opus-fixable","aesthetic":false},{"id":"f2","class":"needs-main","aesthetic":false},{"id":"f3","class":"needs-human","aesthetic":false},{"id":"f4","class":"needs-human","aesthetic":false},{"id":"f5","class":"needs-human","aesthetic":false},{"id":"f6","class":"needs-human","aesthetic":true},{"id":"f7","class":"already-satisfied","aesthetic":false},{"id":"f8","class":"already-satisfied","aesthetic":false}],"votes":{"f3":["refuted","upheld"],"f4":["upheld","upheld"],"f6":["refuted","refuted"],"f8":["refuted","refuted"]}}'
out=$(printf '%s' "$IN" | "$SCRIPT_DIR/dispatch-qa-disposition")

# Branch: opus-fixable passes through
assert_eq "qa-disposition: opus-fixable → final_class" "opus-fixable" "$(printf '%s' "$out" | jq -r '.dispositions[] | select(.id=="f1") | .final_class')"
assert_eq "qa-disposition: opus-fixable → verify=n/a" "n/a" "$(printf '%s' "$out" | jq -r '.dispositions[] | select(.id=="f1") | .verify')"

# Branch: needs-main passes through
assert_eq "qa-disposition: needs-main → final_class" "needs-main" "$(printf '%s' "$out" | jq -r '.dispositions[] | select(.id=="f2") | .final_class')"
assert_eq "qa-disposition: needs-main → verify=n/a" "n/a" "$(printf '%s' "$out" | jq -r '.dispositions[] | select(.id=="f2") | .verify')"

# Branch: needs-human, non-aesthetic, refuted vote → downgrade
assert_eq "qa-disposition: needs-human refuted → final_class=opus-fixable" "opus-fixable" "$(printf '%s' "$out" | jq -r '.dispositions[] | select(.id=="f3") | .final_class')"
assert_eq "qa-disposition: needs-human refuted → verify=Refuted" "Refuted" "$(printf '%s' "$out" | jq -r '.dispositions[] | select(.id=="f3") | .verify')"

# Branch: needs-human, non-aesthetic, all-upheld → keep
assert_eq "qa-disposition: needs-human upheld → final_class=needs-human" "needs-human" "$(printf '%s' "$out" | jq -r '.dispositions[] | select(.id=="f4") | .final_class')"
assert_eq "qa-disposition: needs-human upheld → verify=Upheld" "Upheld" "$(printf '%s' "$out" | jq -r '.dispositions[] | select(.id=="f4") | .verify')"

# Branch: needs-human, non-aesthetic, EMPTY votes (id absent from votes map) → KEEP (INVERTED EDGE)
# Unlike dispatch-review-verify-drop where empty→dropped, here empty→KEEP (downgrading is the risky action)
assert_eq "qa-disposition: needs-human empty-votes → final_class=needs-human (inverted edge)" "needs-human" "$(printf '%s' "$out" | jq -r '.dispositions[] | select(.id=="f5") | .final_class')"
assert_eq "qa-disposition: needs-human empty-votes → verify=Unverified (inverted edge)" "Unverified" "$(printf '%s' "$out" | jq -r '.dispositions[] | select(.id=="f5") | .verify')"

# Branch: needs-human, aesthetic:true, votes present (refuted) → KEEP, verify=n/a (aesthetic bypasses verification)
assert_eq "qa-disposition: aesthetic needs-human with refuted votes → final_class=needs-human" "needs-human" "$(printf '%s' "$out" | jq -r '.dispositions[] | select(.id=="f6") | .final_class')"
assert_eq "qa-disposition: aesthetic needs-human with refuted votes → verify=n/a" "n/a" "$(printf '%s' "$out" | jq -r '.dispositions[] | select(.id=="f6") | .verify')"

# Branch: already-satisfied → first-branch pass-through, no votes needed
assert_eq "qa-disposition: already-satisfied → final_class=already-satisfied" "already-satisfied" "$(printf '%s' "$out" | jq -r '.dispositions[] | select(.id=="f7") | .final_class')"
assert_eq "qa-disposition: already-satisfied → verify=n/a" "n/a" "$(printf '%s' "$out" | jq -r '.dispositions[] | select(.id=="f7") | .verify')"

# Branch: already-satisfied with refuting votes present → still first-branch pass-through (votes ignored; the vote-bypass invariant f7 cannot catch)
assert_eq "qa-disposition: already-satisfied with refuted votes → final_class=already-satisfied" "already-satisfied" "$(printf '%s' "$out" | jq -r '.dispositions[] | select(.id=="f8") | .final_class')"
assert_eq "qa-disposition: already-satisfied with refuted votes → verify=n/a" "n/a" "$(printf '%s' "$out" | jq -r '.dispositions[] | select(.id=="f8") | .verify')"

# Passthrough: original class and aesthetic fields survive on output items
assert_eq "qa-disposition: passthrough class field preserved" "needs-human" "$(printf '%s' "$out" | jq -r '.dispositions[] | select(.id=="f3") | .class')"
assert_eq "qa-disposition: passthrough aesthetic field preserved" "false" "$(printf '%s' "$out" | jq -r '.dispositions[] | select(.id=="f3") | .aesthetic')"

# Passthrough: arbitrary extra field (title) survives
IN_TITLE='{"items":[{"id":"t1","class":"needs-human","aesthetic":false,"title":"Check me"}],"votes":{"t1":["upheld"]}}'
out_title=$(printf '%s' "$IN_TITLE" | "$SCRIPT_DIR/dispatch-qa-disposition")
assert_eq "qa-disposition: passthrough title field preserved" "Check me" "$(printf '%s' "$out_title" | jq -r '.dispositions[0].title')"

# Output order: items must appear in input order (f1..f8)
assert_eq "qa-disposition: output order preserved" "f1
f2
f3
f4
f5
f6
f7
f8" "$(printf '%s' "$out" | jq -r '.dispositions[].id')"

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
