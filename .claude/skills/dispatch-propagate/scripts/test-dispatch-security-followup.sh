#!/usr/bin/env bash
# Tests for dispatch-security-followup -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 22298-22434.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# === dispatch-security-followup ===
# ============================================================================

echo "Test: dispatch-security-followup"

# 1. CodeQL out-of-scope high → length 1
out=$(printf '%s' '[{"source":"codeql","classification":"out-of-scope","rule_id":"js/sqli","alert_number":42,"security_severity_level":"high","description":"sqli","location":"src/db.ts:10","html_url":"http://x"}]' | "$SCRIPT_DIR/dispatch-security-followup" 123)
assert_eq "followup: codeql out-of-scope high → 1" "1" "$(printf '%s' "$out" | jq -r 'length')"

# 2. CodeQL out-of-scope medium → length 1
out=$(printf '%s' '[{"source":"codeql","classification":"out-of-scope","rule_id":"js/xss","alert_number":7,"security_severity_level":"medium","description":"xss","location":"src/y.ts","html_url":"http://y"}]' | "$SCRIPT_DIR/dispatch-security-followup" 123)
assert_eq "followup: codeql out-of-scope medium → 1" "1" "$(printf '%s' "$out" | jq -r 'length')"

# CodeQL out-of-scope critical → length 1
out=$(printf '%s' '[{"source":"codeql","classification":"out-of-scope","rule_id":"js/crit","alert_number":99,"security_severity_level":"critical","description":"crit","location":"src/c.ts","html_url":"http://c"}]' | "$SCRIPT_DIR/dispatch-security-followup" 123)
assert_eq "followup: codeql out-of-scope critical → 1" "1" "$(printf '%s' "$out" | jq -r 'length')"

# 3. CodeQL out-of-scope low → length 0
out=$(printf '%s' '[{"source":"codeql","classification":"out-of-scope","rule_id":"js/low","alert_number":1,"security_severity_level":"low","description":"low","location":"src/z.ts","html_url":"http://z"}]' | "$SCRIPT_DIR/dispatch-security-followup" 123)
assert_eq "followup: codeql out-of-scope low → 0" "0" "$(printf '%s' "$out" | jq -r 'length')"

# 4. CodeQL out-of-scope null security_severity_level → length 0
out=$(printf '%s' '[{"source":"codeql","classification":"out-of-scope","rule_id":"js/null","alert_number":2,"security_severity_level":null,"description":"n","location":"src/n.ts","html_url":"http://n"}]' | "$SCRIPT_DIR/dispatch-security-followup" 123)
assert_eq "followup: codeql out-of-scope null sev → 0" "0" "$(printf '%s' "$out" | jq -r 'length')"

# 5. CodeQL required (high) → length 0
out=$(printf '%s' '[{"source":"codeql","classification":"required","rule_id":"js/req","alert_number":3,"security_severity_level":"high","description":"r","location":"src/r.ts","html_url":"http://r"}]' | "$SCRIPT_DIR/dispatch-security-followup" 123)
assert_eq "followup: codeql required high → 0" "0" "$(printf '%s' "$out" | jq -r 'length')"

# 6. CodeQL false-positive (high) → length 0
out=$(printf '%s' '[{"source":"codeql","classification":"false-positive","rule_id":"js/fp","alert_number":4,"security_severity_level":"high","description":"fp","location":"src/fp.ts","html_url":"http://fp"}]' | "$SCRIPT_DIR/dispatch-security-followup" 123)
assert_eq "followup: codeql false-positive high → 0" "0" "$(printf '%s' "$out" | jq -r 'length')"

# 7. npm out-of-scope high, introduced_by_diff=false → length 1
out=$(printf '%s' '[{"source":"npm","classification":"out-of-scope","advisory_id":"GHSA-aaaa","severity":"high","introduced_by_diff":false,"package":"lodash","title":"proto pollution","url":"http://npm"}]' | "$SCRIPT_DIR/dispatch-security-followup" 123)
assert_eq "followup: npm out-of-scope high not-diff → 1" "1" "$(printf '%s' "$out" | jq -r 'length')"

# 8. npm out-of-scope critical, introduced_by_diff=false → length 1
out=$(printf '%s' '[{"source":"npm","classification":"out-of-scope","advisory_id":"GHSA-bbbb","severity":"critical","introduced_by_diff":false,"package":"axios","title":"ssrf","url":"http://npm2"}]' | "$SCRIPT_DIR/dispatch-security-followup" 123)
assert_eq "followup: npm out-of-scope critical not-diff → 1" "1" "$(printf '%s' "$out" | jq -r 'length')"

# 9. npm out-of-scope moderate → length 0
out=$(printf '%s' '[{"source":"npm","classification":"out-of-scope","advisory_id":"GHSA-cccc","severity":"moderate","introduced_by_diff":false,"package":"qs","title":"dos","url":"http://npm3"}]' | "$SCRIPT_DIR/dispatch-security-followup" 123)
assert_eq "followup: npm out-of-scope moderate → 0" "0" "$(printf '%s' "$out" | jq -r 'length')"

# 10. npm out-of-scope high but introduced_by_diff=true → length 0
out=$(printf '%s' '[{"source":"npm","classification":"out-of-scope","advisory_id":"GHSA-dddd","severity":"high","introduced_by_diff":true,"package":"minimist","title":"proto","url":"http://npm4"}]' | "$SCRIPT_DIR/dispatch-security-followup" 123)
assert_eq "followup: npm out-of-scope high introduced-by-diff → 0" "0" "$(printf '%s' "$out" | jq -r 'length')"

# 11a. CodeQL stable identifier embedded verbatim in title
out=$(printf '%s' '[{"source":"codeql","classification":"out-of-scope","rule_id":"js/sql-injection","alert_number":42,"security_severity_level":"high","description":"sqli","location":"src/db.ts","html_url":"https://github.com/org/repo/security/code-scanning/42"}]' | "$SCRIPT_DIR/dispatch-security-followup" 123)
title=$(printf '%s' "$out" | jq -r '.[0].title')
case "$title" in *"CodeQL js/sql-injection alert #42"*) hit=yes ;; *) hit=no ;; esac
assert_eq "followup: codeql identifier embedded in title" "yes" "$hit"

# 11c. CodeQL html_url is included in body for traceability
body=$(printf '%s' "$out" | jq -r '.[0].body')
case "$body" in *"https://github.com/org/repo/security/code-scanning/42"*) hit=yes ;; *) hit=no ;; esac
assert_eq "followup: codeql html_url in body" "yes" "$hit"

# 11b. npm stable identifier (package-scoped) embedded verbatim in title
out=$(printf '%s' '[{"source":"npm","classification":"out-of-scope","advisory_id":"GHSA-xxxx-yyyy","severity":"critical","introduced_by_diff":false,"package":"react","title":"xss","url":"http://npm"}]' | "$SCRIPT_DIR/dispatch-security-followup" 123)
title=$(printf '%s' "$out" | jq -r '.[0].title')
case "$title" in *"npm advisories in react"*) hit=yes ;; *) hit=no ;; esac
assert_eq "followup: npm identifier embedded in title" "yes" "$hit"
body=$(printf '%s' "$out" | jq -r '.[0].body')
case "$body" in *"GHSA-xxxx-yyyy"*) hit=yes ;; *) hit=no ;; esac
assert_eq "followup: npm advisory id in body" "yes" "$hit"

# 12. Mixed interleaved array → only qualifying subset in input order
out=$(printf '%s' '[
  {"source":"codeql","classification":"out-of-scope","rule_id":"js/a","alert_number":1,"security_severity_level":"high","description":"a","location":"a.ts","html_url":"http://a"},
  {"source":"codeql","classification":"required","rule_id":"js/b","alert_number":2,"security_severity_level":"high","description":"b","location":"b.ts","html_url":"http://b"},
  {"source":"npm","classification":"out-of-scope","advisory_id":"GHSA-c","severity":"critical","introduced_by_diff":false,"package":"c","title":"c","url":"http://c"},
  {"source":"npm","classification":"out-of-scope","advisory_id":"GHSA-d","severity":"moderate","introduced_by_diff":false,"package":"d","title":"d","url":"http://d"},
  {"source":"codeql","classification":"out-of-scope","rule_id":"js/e","alert_number":5,"security_severity_level":"medium","description":"e","location":"e.ts","html_url":"http://e"}
]' | "$SCRIPT_DIR/dispatch-security-followup" 123)
assert_eq "followup: mixed array → 3 qualifying" "3" "$(printf '%s' "$out" | jq -r 'length')"
assert_eq "followup: mixed array → codeql-first then npm groups" "CodeQL js/a alert #1
CodeQL js/e alert #5
npm advisories in c" "$(printf '%s' "$out" | jq -r '.[].identifier')"

# 12b. Multiple high/critical advisories on ONE package → 1 grouped follow-up
out=$(printf '%s' '[
  {"source":"npm","classification":"out-of-scope","advisory_id":"GHSA-wh4c","severity":"critical","introduced_by_diff":false,"package":"@xmldom/xmldom","title":"inj","url":"http://x1"},
  {"source":"npm","classification":"out-of-scope","advisory_id":"GHSA-2v35","severity":"high","introduced_by_diff":false,"package":"@xmldom/xmldom","title":"inj2","url":"http://x2"}
]' | "$SCRIPT_DIR/dispatch-security-followup" 123)
assert_eq "followup: multi-advisory one-package → 1" "1" "$(printf '%s' "$out" | jq -r 'length')"
assert_eq "followup: multi-advisory one-package → package identifier" "npm advisories in @xmldom/xmldom" "$(printf '%s' "$out" | jq -r '.[0].identifier')"
body=$(printf '%s' "$out" | jq -r '.[0].body')
case "$body" in *"GHSA-wh4c"*) hit=yes ;; *) hit=no ;; esac
assert_eq "followup: multi-advisory body has first advisory id" "yes" "$hit"
case "$body" in *"GHSA-2v35"*) hit=yes ;; *) hit=no ;; esac
assert_eq "followup: multi-advisory body has second advisory id" "yes" "$hit"
case "$body" in *"http://x1"*) hit=yes ;; *) hit=no ;; esac
assert_eq "followup: multi-advisory body has first url" "yes" "$hit"
case "$body" in *"http://x2"*) hit=yes ;; *) hit=no ;; esac
assert_eq "followup: multi-advisory body has second url" "yes" "$hit"
case "$body" in *"critical"*) hit=yes ;; *) hit=no ;; esac
assert_eq "followup: multi-advisory body has critical severity" "yes" "$hit"
case "$body" in *"high"*) hit=yes ;; *) hit=no ;; esac
assert_eq "followup: multi-advisory body has high severity" "yes" "$hit"
case "$body" in *"Max severity: critical"*) hit=yes ;; *) hit=no ;; esac
assert_eq "followup: multi-advisory body has max severity critical" "yes" "$hit"

# 12c. One high + one moderate on SAME package → 1 follow-up, both listed, max=high
out=$(printf '%s' '[
  {"source":"npm","classification":"out-of-scope","advisory_id":"GHSA-h","severity":"high","introduced_by_diff":false,"package":"foo","title":"h","url":"http://h"},
  {"source":"npm","classification":"out-of-scope","advisory_id":"GHSA-m","severity":"moderate","introduced_by_diff":false,"package":"foo","title":"m","url":"http://m"}
]' | "$SCRIPT_DIR/dispatch-security-followup" 123)
assert_eq "followup: high+moderate same package → 1" "1" "$(printf '%s' "$out" | jq -r 'length')"
body=$(printf '%s' "$out" | jq -r '.[0].body')
case "$body" in *"GHSA-h"*) hit=yes ;; *) hit=no ;; esac
assert_eq "followup: high+moderate body has high advisory" "yes" "$hit"
case "$body" in *"GHSA-m"*) hit=yes ;; *) hit=no ;; esac
assert_eq "followup: high+moderate body has moderate advisory" "yes" "$hit"
case "$body" in *"Max severity: high"*) hit=yes ;; *) hit=no ;; esac
assert_eq "followup: high+moderate body has max severity high" "yes" "$hit"

# 12d. Two distinct qualifying packages → 2 follow-ups
out=$(printf '%s' '[
  {"source":"npm","classification":"out-of-scope","advisory_id":"GHSA-a","severity":"high","introduced_by_diff":false,"package":"aaa","title":"a","url":"http://a"},
  {"source":"npm","classification":"out-of-scope","advisory_id":"GHSA-b","severity":"critical","introduced_by_diff":false,"package":"bbb","title":"b","url":"http://b"}
]' | "$SCRIPT_DIR/dispatch-security-followup" 123)
assert_eq "followup: two packages → 2" "2" "$(printf '%s' "$out" | jq -r 'length')"
assert_eq "followup: two packages → both identifiers" "npm advisories in aaa
npm advisories in bbb" "$(printf '%s' "$out" | jq -r '.[].identifier' | sort)"

# 13. Empty input [] → length 0
out=$(printf '%s' '[]' | "$SCRIPT_DIR/dispatch-security-followup" 123)
assert_eq "followup: empty input → 0" "0" "$(printf '%s' "$out" | jq -r 'length')"

# 14. Unknown/missing source → ignored
out=$(printf '%s' '[{"source":"sonarqube","classification":"out-of-scope","security_severity_level":"high"},{"classification":"out-of-scope","severity":"critical"}]' | "$SCRIPT_DIR/dispatch-security-followup" 123)
assert_eq "followup: unknown/missing source → 0" "0" "$(printf '%s' "$out" | jq -r 'length')"

# <<< END MOVED <<<

report_results
