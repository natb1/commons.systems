#!/usr/bin/env bash
# Tests for dispatch-review-npm-audit — the scripted replacement for the two raw
# `npm audit --json` blocks that used to run inline in the /review-fix parent
# thread and be diffed by hand.
#
# Fully OFFLINE: every case drives the script through its
# DISPATCH_REVIEW_NPM_AUDIT_{HEAD,BASELINE}_FIXTURE seams, so neither `npm` nor
# `git show` is ever invoked.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

SUT="$SCRIPT_DIR/dispatch-review-npm-audit"

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

echo "Test: dispatch-review-npm-audit"

# npm audit --json (auditReportVersion 2) shape: each advisory is an OBJECT entry
# in .vulnerabilities[<pkg>].via[]; string entries are transitive back-references.
#
# HEAD carries three advisories:
#   111 brand-new-pkg  high      — absent at baseline  → introduced_by_diff=true
#   222 old-critical   critical  — present at baseline → introduced_by_diff=false
#   333 old-moderate   moderate  — present at baseline → OMITTED (below threshold)
cat > "$WORK/head.json" <<'EOF'
{"auditReportVersion":2,"vulnerabilities":{
 "brand-new-pkg":{"name":"brand-new-pkg","severity":"high","via":[
   {"source":111,"name":"brand-new-pkg","title":"Prototype pollution in brand-new-pkg","url":"https://github.com/advisories/GHSA-aaaa","severity":"high","range":"<2.0.1"}],
   "fixAvailable":true},
 "old-critical":{"name":"old-critical","severity":"critical","via":[
   {"source":222,"name":"old-critical","title":"RCE in old-critical","url":"https://github.com/advisories/GHSA-bbbb","severity":"critical","range":"<1.5.0"}],
   "fixAvailable":false},
 "old-moderate":{"name":"old-moderate","severity":"moderate","via":[
   {"source":333,"name":"old-moderate","title":"ReDoS in old-moderate","url":"https://github.com/advisories/GHSA-cccc","severity":"moderate","range":"<3.0.0"}],
   "fixAvailable":true},
 "transitive-holder":{"name":"transitive-holder","severity":"moderate","via":["old-moderate"],"fixAvailable":true}
}}
EOF
cat > "$WORK/base.json" <<'EOF'
{"auditReportVersion":2,"vulnerabilities":{
 "old-critical":{"name":"old-critical","severity":"critical","via":[
   {"source":222,"name":"old-critical","title":"RCE in old-critical","url":"https://github.com/advisories/GHSA-bbbb","severity":"critical","range":"<1.5.0"}],
   "fixAvailable":false},
 "old-moderate":{"name":"old-moderate","severity":"moderate","via":[
   {"source":333,"name":"old-moderate","title":"ReDoS in old-moderate","url":"https://github.com/advisories/GHSA-cccc","severity":"moderate","range":"<3.0.0"}],
   "fixAvailable":true}
}}
EOF

rc=0
out=$(DISPATCH_REVIEW_NPM_AUDIT_HEAD_FIXTURE="$WORK/head.json" \
      DISPATCH_REVIEW_NPM_AUDIT_BASELINE_FIXTURE="$WORK/base.json" \
      "$SUT" deadbeefdeadbeef) || rc=$?
assert_eq "npm-audit: differential → exit 0" "0" "$rc"

# 1. NEWLY-INTRODUCED ADVISORY → emitted with introduced_by_diff=true.
new_desc=$(jq -r '.findings[] | select(.Location | contains("brand-new-pkg")) | .Description' <<<"$out")
has_new=no
[[ "$new_desc" == *"introduced_by_diff=true"* ]] && has_new=yes
assert_eq "npm-audit: head-only advisory → introduced_by_diff=true" "yes" "$has_new"
assert_eq "npm-audit: introduced advisory severity high → Confidence high" \
  "high" "$(jq -r '.findings[] | select(.Location | contains("brand-new-pkg")) | .Confidence' <<<"$out")"
assert_eq "npm-audit: Source is npm" \
  "npm" "$(jq -r '.findings[] | select(.Location | contains("brand-new-pkg")) | .Source' <<<"$out")"

# 1b. The skipped-published-patch sub-case: the introduced advisory reports
#     fixAvailable, so the resolved version skipped a published security patch.
has_skipped=no
[[ "$new_desc" == *"skipped_published_patch=true"* ]] && has_skipped=yes
assert_eq "npm-audit: introduced advisory with fixAvailable → skipped_published_patch=true" \
  "yes" "$has_skipped"

# 2. PRE-EXISTING CRITICAL → included with introduced_by_diff=false.
pre_desc=$(jq -r '.findings[] | select(.Location | contains("old-critical")) | .Description' <<<"$out")
has_pre=no
[[ "$pre_desc" == *"introduced_by_diff=false"* ]] && has_pre=yes
assert_eq "npm-audit: pre-existing critical → included, introduced_by_diff=false" "yes" "$has_pre"
# A pre-existing finding must NOT be tagged with the skipped-patch sub-case.
no_skip_on_pre=yes
[[ "$pre_desc" == *"skipped_published_patch"* ]] && no_skip_on_pre=no
assert_eq "npm-audit: pre-existing finding carries no skipped_published_patch tag" \
  "yes" "$no_skip_on_pre"

# 3. PRE-EXISTING MODERATE → OMITTED ENTIRELY (below the meaningfulness threshold).
assert_eq "npm-audit: pre-existing moderate advisory is omitted entirely" \
  "0" "$(jq '[.findings[] | select(.Location | contains("old-moderate"))] | length' <<<"$out")"
absent=yes
[[ "$out" == *"old-moderate"* ]] && absent=no
assert_eq "npm-audit: 'old-moderate' appears nowhere in the output" "yes" "$absent"

# Exactly the two expected findings — nothing else leaked through.
assert_eq "npm-audit: exactly two findings emitted" "2" "$(jq '.findings | length' <<<"$out")"

# 4. RAW AUDIT JSON MUST NOT REACH STDOUT: only the normalized envelope.
raw_leak=no
[[ "$out" == *"auditReportVersion"* || "$out" == *"fixAvailable"* ]] && raw_leak=yes
assert_eq "npm-audit: raw npm audit JSON never reaches stdout" "no" "$raw_leak"
assert_eq "npm-audit: output has only the 'findings' key" \
  "findings" "$(jq -r 'keys | join(",")' <<<"$out")"

# 5. NO DIFFERENTIAL: identical head and baseline, all moderate → no findings.
out=$(DISPATCH_REVIEW_NPM_AUDIT_HEAD_FIXTURE="$WORK/base.json" \
      DISPATCH_REVIEW_NPM_AUDIT_BASELINE_FIXTURE="$WORK/base.json" \
      "$SUT" deadbeefdeadbeef)
assert_eq "npm-audit: head == baseline → only the pre-existing critical" \
  "1" "$(jq '.findings | length' <<<"$out")"

# 6. CLEAN TREES: no vulnerabilities either side → {"findings":[]}.
printf '{"auditReportVersion":2,"vulnerabilities":{}}\n' > "$WORK/clean.json"
out=$(DISPATCH_REVIEW_NPM_AUDIT_HEAD_FIXTURE="$WORK/clean.json" \
      DISPATCH_REVIEW_NPM_AUDIT_BASELINE_FIXTURE="$WORK/clean.json" \
      "$SUT" deadbeefdeadbeef)
assert_eq "npm-audit: no vulnerabilities → empty findings" '{"findings":[]}' "$out"

# 7. MERGE_BASE IS REQUIRED and positional — a missing argument is a loud error,
#    never a silent recomputation from some other source (#1522 defect class).
rc=0
out=$(DISPATCH_REVIEW_NPM_AUDIT_HEAD_FIXTURE="$WORK/clean.json" \
      DISPATCH_REVIEW_NPM_AUDIT_BASELINE_FIXTURE="$WORK/clean.json" \
      "$SUT" 2>/dev/null) || rc=$?
assert_eq "npm-audit: missing MERGE_BASE argument → non-zero exit" "1" "$rc"

report_results
