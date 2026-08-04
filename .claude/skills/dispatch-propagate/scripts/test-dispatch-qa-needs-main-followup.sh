#!/usr/bin/env bash
# Tests for dispatch-qa-needs-main-followup -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 22435-22513.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# === dispatch-qa-needs-main-followup ===
# ============================================================================

echo "Test: dispatch-qa-needs-main-followup"

# 1. Empty input → length 0
out=$(printf '%s' '[]' | "$SCRIPT_DIR/dispatch-qa-needs-main-followup" 1552 99)
assert_eq "qa-needs-main-followup: empty input → 0" "0" "$(printf '%s' "$out" | jq -r 'length')"

# 2. One item with non-empty url_path → identifier uses url_path
out=$(printf '%s' '[{
  "id": "i1",
  "title": "Budget page loads",
  "kind": "main-gated-fail",
  "url_path": "/budget",
  "expected_outcome": "Page renders with current data",
  "finding": "Returns 403 on staging"
}]' | "$SCRIPT_DIR/dispatch-qa-needs-main-followup" 1552 99)
assert_eq "qa-needs-main-followup: url_path item → length 1" "1" "$(printf '%s' "$out" | jq -r 'length')"
assert_eq "qa-needs-main-followup: url_path item → identifier" "qa-needs-main #1552: /budget" "$(printf '%s' "$out" | jq -r '.[0].identifier')"
title2=$(printf '%s' "$out" | jq -r '.[0].title')
case "$title2" in *"qa-needs-main #1552: /budget"*) hit=yes ;; *) hit=no ;; esac
assert_eq "qa-needs-main-followup: url_path item → title contains identifier" "yes" "$hit"
body2=$(printf '%s' "$out" | jq -r '.[0].body')
case "$body2" in *"PR #99 for issue #1552"*) hit=yes ;; *) hit=no ;; esac
assert_eq "qa-needs-main-followup: url_path item → body contains provenance" "yes" "$hit"
case "$body2" in *"**URL path:** /budget"*) hit=yes ;; *) hit=no ;; esac
assert_eq "qa-needs-main-followup: url_path item → body contains URL path line" "yes" "$hit"
case "$body2" in *"**Expected outcome:**"*) hit=yes ;; *) hit=no ;; esac
assert_eq "qa-needs-main-followup: url_path item → body contains expected outcome label" "yes" "$hit"
case "$body2" in *"**Finding during QA:**"*) hit=yes ;; *) hit=no ;; esac
assert_eq "qa-needs-main-followup: url_path item → body contains finding label" "yes" "$hit"

# 3a. Item with empty url_path → identifier uses title slug
out=$(printf '%s' '[{
  "id": "i2",
  "title": "Budget Page Loads OK!",
  "kind": "main-gated-fail",
  "url_path": "",
  "expected_outcome": "Loads without error",
  "finding": "Blank page on main"
}]' | "$SCRIPT_DIR/dispatch-qa-needs-main-followup" 1552 99)
assert_eq "qa-needs-main-followup: empty url_path → slug identifier" "qa-needs-main #1552: budget-page-loads-ok" "$(printf '%s' "$out" | jq -r '.[0].identifier')"

# 3b. Item with url_path "current" → identifier uses title slug
out=$(printf '%s' '[{
  "id": "i3",
  "title": "Auth Flow Works Correctly",
  "kind": "fail",
  "url_path": "current",
  "expected_outcome": "User can log in",
  "finding": "Redirect loop observed"
}]' | "$SCRIPT_DIR/dispatch-qa-needs-main-followup" 1552 99)
assert_eq "qa-needs-main-followup: url_path=current → slug identifier" "qa-needs-main #1552: auth-flow-works-correctly" "$(printf '%s' "$out" | jq -r '.[0].identifier')"
body3=$(printf '%s' "$out" | jq -r '.[0].body')
case "$body3" in *'**URL path:**'*) hit=yes ;; *) hit=no ;; esac
assert_eq 'qa-needs-main-followup: url_path=current → no URL path line in body' 'no' "$hit"

# 4. Determinism: same input twice → identical identifiers
input4='[{
  "id": "i4",
  "title": "Dashboard renders",
  "kind": "main-gated-fail",
  "url_path": "/dashboard",
  "expected_outcome": "Charts load",
  "finding": "Empty chart area"
}]'
id1=$(printf '%s' "$input4" | "$SCRIPT_DIR/dispatch-qa-needs-main-followup" 1552 99 | jq -r '.[0].identifier')
id2=$(printf '%s' "$input4" | "$SCRIPT_DIR/dispatch-qa-needs-main-followup" 1552 99 | jq -r '.[0].identifier')
assert_eq "qa-needs-main-followup: determinism → identical identifiers" "$id1" "$id2"

# 5. Two-item array → length 2
out=$(printf '%s' '[
  {"id":"i5","title":"A","kind":"main-gated-fail","url_path":"/a","expected_outcome":"ok","finding":"fail"},
  {"id":"i6","title":"B","kind":"main-gated-fail","url_path":"/b","expected_outcome":"ok","finding":"fail"}
]' | "$SCRIPT_DIR/dispatch-qa-needs-main-followup" 1552 99)
assert_eq "qa-needs-main-followup: 2-item input → length 2" "2" "$(printf '%s' "$out" | jq -r 'length')"

# <<< END MOVED <<<

report_results
