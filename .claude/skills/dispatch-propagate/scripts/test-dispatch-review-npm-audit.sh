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

# 8. A FAILED AUDIT IS AN ERROR, NEVER AN EMPTY DIFFERENTIAL. When npm cannot
#    audit the tree it still writes a well-formed JSON ERROR document, which has
#    no .vulnerabilities key and would normalize to {"findings":[]} — a clean
#    bill of health byte-identical to a genuinely clean audit. Reject it loudly.
cat > "$WORK/error-doc.json" <<'EOF'
{"error":{"code":"EUSAGE","summary":"The package-lock.json file was created with an old version of npm","detail":"npm audit needs a lockfile it can read"}}
EOF
rc=0
err=$(DISPATCH_REVIEW_NPM_AUDIT_HEAD_FIXTURE="$WORK/error-doc.json" \
      DISPATCH_REVIEW_NPM_AUDIT_BASELINE_FIXTURE="$WORK/clean.json" \
      "$SUT" deadbeefdeadbeef 2>&1 >/dev/null) || rc=$?
assert_eq "npm-audit: HEAD npm error document → non-zero exit (not empty findings)" "1" "$rc"
has_code=no
[[ "$err" == *"EUSAGE"* ]] && has_code=yes
assert_eq "npm-audit: npm error text reaches stderr" "yes" "$has_code"
says_unknown=no
[[ "$err" == *"could not run"* ]] && says_unknown=yes
assert_eq "npm-audit: error names the audit as un-run, not clean" "yes" "$says_unknown"

# 8b. Same guard on the BASELINE side (which previously skipped validation on
#     the fixture path entirely).
rc=0
err=$(DISPATCH_REVIEW_NPM_AUDIT_HEAD_FIXTURE="$WORK/clean.json" \
      DISPATCH_REVIEW_NPM_AUDIT_BASELINE_FIXTURE="$WORK/error-doc.json" \
      "$SUT" deadbeefdeadbeef 2>&1 >/dev/null) || rc=$?
assert_eq "npm-audit: MERGE_BASE npm error document → non-zero exit" "1" "$rc"
names_base=no
[[ "$err" == *"MERGE_BASE"* ]] && names_base=yes
assert_eq "npm-audit: error names which side failed" "yes" "$names_base"

# 8c. Valid JSON that is not an audit report at all (no auditReportVersion, no
#     vulnerabilities) is likewise rejected rather than differenced to empty.
printf '{"totally":"unrelated"}\n' > "$WORK/not-a-report.json"
rc=0
DISPATCH_REVIEW_NPM_AUDIT_HEAD_FIXTURE="$WORK/not-a-report.json" \
  DISPATCH_REVIEW_NPM_AUDIT_BASELINE_FIXTURE="$WORK/clean.json" \
  "$SUT" deadbeefdeadbeef >/dev/null 2>&1 || rc=$?
assert_eq "npm-audit: non-audit JSON document → non-zero exit" "1" "$rc"

# 9. LIVE PATH: THE REGISTRY IS PINNED AND A DIFFED .npmrc IS A HARD STOP.
#    These cases exercise the non-fixture branch, so they need a git repo and an
#    `npm` — but both are LOCAL: a throwaway repo under $WORK and a stub `npm`
#    that records its argv and prints a clean audit report. Still no network.
NPM_STUB_DIR="$WORK/stub-bin"
mkdir -p "$NPM_STUB_DIR"
cat > "$NPM_STUB_DIR/npm" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$@" >> "$NPM_ARGLOG"
printf '{"auditReportVersion":2,"vulnerabilities":{}}\n'
EOF
chmod +x "$NPM_STUB_DIR/npm"

LIVE_REPO="$WORK/live-repo"
mkdir -p "$LIVE_REPO"
(
  cd "$LIVE_REPO"
  git init -q .
  git config user.email test@example.com
  git config user.name "npm audit test"
  printf '{"name":"x","version":"1.0.0"}\n' > package.json
  printf '{"name":"x","lockfileVersion":3,"packages":{}}\n' > package-lock.json
  git add -A
  git commit -qm base
)
LIVE_BASE=$(git -C "$LIVE_REPO" rev-parse HEAD)

NPM_ARGLOG="$WORK/npm-args.log"
: > "$NPM_ARGLOG"
rc=0
live_out=$(cd "$LIVE_REPO" && PATH="$NPM_STUB_DIR:$PATH" NPM_ARGLOG="$NPM_ARGLOG" \
  "$SUT" "$LIVE_BASE") || rc=$?
assert_eq "npm-audit: live path with no .npmrc → exit 0, empty findings" \
  "0|{\"findings\":[]}" "$rc|$live_out"

# Both invocations must carry the pinned registry and the empty user/global
# config — otherwise a repo-supplied .npmrc could choose who answers the
# advisory query, and an ambient token could be disclosed to that host.
assert_eq "npm-audit: BOTH audits pin --registry to the public registry" \
  "2" "$(grep -c -- '--registry=https://registry.npmjs.org/$' "$NPM_ARGLOG")"
assert_eq "npm-audit: BOTH audits pin --userconfig away from the ambient npmrc" \
  "2" "$(grep -c -- '--userconfig=' "$NPM_ARGLOG")"
assert_eq "npm-audit: BOTH audits pin --globalconfig away from the ambient npmrc" \
  "2" "$(grep -c -- '--globalconfig=' "$NPM_ARGLOG")"
pinned_empty=yes
while IFS= read -r cfg; do
  [[ -s "${cfg#*=}" ]] && pinned_empty=no
done < <(grep -- '--userconfig=\|--globalconfig=' "$NPM_ARGLOG")
assert_eq "npm-audit: the pinned npm config file is empty" "yes" "$pinned_empty"

# An UNTRACKED .npmrc is invisible to `git diff` yet fully live for npm.
printf 'registry=https://attacker.example/\n' > "$LIVE_REPO/.npmrc"
rc=0
err=$(cd "$LIVE_REPO" && PATH="$NPM_STUB_DIR:$PATH" NPM_ARGLOG="$NPM_ARGLOG" \
  "$SUT" "$LIVE_BASE" 2>&1 >/dev/null) || rc=$?
assert_eq "npm-audit: untracked .npmrc in the tree → non-zero exit" "1" "$rc"
untrusted=no
[[ "$err" == *"could not be trusted"* && "$err" == *"NOT clean"* ]] && untrusted=yes
assert_eq "npm-audit: .npmrc refusal names the audit untrusted, not clean" "yes" "$untrusted"

# A COMMITTED .npmrc anywhere under the tree is caught the same way.
rm "$LIVE_REPO/.npmrc"
mkdir -p "$LIVE_REPO/app"
printf '@scope:registry=https://attacker.example/\n' > "$LIVE_REPO/app/.npmrc"
(cd "$LIVE_REPO" && git add -A && git commit -qm 'add scoped npmrc')
rc=0
err=$(cd "$LIVE_REPO" && PATH="$NPM_STUB_DIR:$PATH" NPM_ARGLOG="$NPM_ARGLOG" \
  "$SUT" "$LIVE_BASE" 2>&1 >/dev/null) || rc=$?
assert_eq "npm-audit: committed nested .npmrc in the diff → non-zero exit" "1" "$rc"
names_path=no
[[ "$err" == *"app/.npmrc"* ]] && names_path=yes
assert_eq "npm-audit: .npmrc refusal names the offending path" "yes" "$names_path"

report_results
