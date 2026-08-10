#!/usr/bin/env bash
# Tests for dispatch-review-codeql — the scripted replacement for the raw
# `gh api .../code-scanning/alerts` block that used to run inline in the
# /review-fix parent thread.
#
# Fully OFFLINE: every case drives the script through its
# DISPATCH_REVIEW_CODEQL_FIXTURE seam, so `gh` is never invoked.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

SUT="$SCRIPT_DIR/dispatch-review-codeql"

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

echo "Test: dispatch-review-codeql"

# 1. EMPTY ALERT ARRAY: a PR with zero open alerts is NORMAL, not an error.
printf '[]\n' > "$WORK/empty.json"
rc=0
out=$(DISPATCH_REVIEW_CODEQL_FIXTURE="$WORK/empty.json" "$SUT" 42) || rc=$?
assert_eq "codeql: empty alert array → exit 0" "0" "$rc"
assert_eq "codeql: empty alert array → {\"findings\":[]}" '{"findings":[]}' "$out"

# 2. SECURITY-SEVERITY ALERT: security_severity_level=high → Confidence high,
#    and the CWE tag drives a deterministic OWASP/STRIDE classification.
cat > "$WORK/sec.json" <<'EOF'
[{"number":7,"html_url":"https://github.com/o/r/security/code-scanning/7",
  "rule":{"id":"js/sql-injection",
          "description":"Query built from user-controlled sources",
          "severity":"error","security_severity_level":"high",
          "tags":["security","external/cwe/cwe-089"],
          "help":"Use parameterized queries.",
          "help_uri":"https://codeql.example/js/sql-injection"},
  "most_recent_instance":{"message":{"text":"This query depends on a user-provided value."},
                          "location":{"path":"app/db.ts","start_line":42}}}]
EOF
out=$(DISPATCH_REVIEW_CODEQL_FIXTURE="$WORK/sec.json" "$SUT" 42)
assert_eq "codeql: security alert → one finding" "1" "$(jq '.findings | length' <<<"$out")"
assert_eq "codeql: security_severity_level=high → Confidence high" \
  "high" "$(jq -r '.findings[0].Confidence' <<<"$out")"
assert_eq "codeql: Source is codeql" \
  "codeql" "$(jq -r '.findings[0].Source' <<<"$out")"
assert_eq "codeql: Location from most_recent_instance.location" \
  "app/db.ts:42" "$(jq -r '.findings[0].Location' <<<"$out")"
assert_eq "codeql: cwe-089 tag → OWASP Injection" \
  "A03:2021 Injection" "$(jq -r '.findings[0].OWASP' <<<"$out")"
assert_eq "codeql: cwe-089 tag → STRIDE Tampering" \
  "Tampering" "$(jq -r '.findings[0].STRIDE' <<<"$out")"
assert_eq "codeql: Recommended fix from rule.help + help_uri" \
  "Use parameterized queries. (https://codeql.example/js/sql-injection)" \
  "$(jq -r '.findings[0]."Recommended fix"' <<<"$out")"
# The alert number, rule id and html_url must survive into Description so the
# finding stays traceable back to the GitHub alert.
desc=$(jq -r '.findings[0].Description' <<<"$out")
traceable=no
if [[ "$desc" == *"#7"* && "$desc" == *"js/sql-injection"* && "$desc" == *"code-scanning/7"* ]]; then
  traceable=yes
fi
assert_eq "codeql: Description carries alert number, rule id and html_url" "yes" "$traceable"

# 3. NON-SECURITY ALERT: security_severity_level is null, so Confidence falls
#    back to rule.severity — error → medium (NOT collapsed to low).
cat > "$WORK/nonsec.json" <<'EOF'
[{"number":9,"html_url":"https://github.com/o/r/security/code-scanning/9",
  "rule":{"id":"js/unused-local-variable","description":"Unused variable",
          "severity":"error","security_severity_level":null,
          "tags":["maintainability"]},
  "most_recent_instance":{"message":{"text":"Unused variable x."},
                          "location":{"path":"app/util.ts","start_line":3}}}]
EOF
out=$(DISPATCH_REVIEW_CODEQL_FIXTURE="$WORK/nonsec.json" "$SUT" 42)
assert_eq "codeql: non-security rule.severity=error → Confidence medium" \
  "medium" "$(jq -r '.findings[0].Confidence' <<<"$out")"
assert_eq "codeql: non-security rule → OWASP empty" \
  "" "$(jq -r '.findings[0].OWASP' <<<"$out")"
assert_eq "codeql: non-security rule → STRIDE empty" \
  "" "$(jq -r '.findings[0].STRIDE' <<<"$out")"

# 3b. rule.severity=warning falls back to low.
cat > "$WORK/nonsec-warn.json" <<'EOF'
[{"number":10,"html_url":"https://github.com/o/r/security/code-scanning/10",
  "rule":{"id":"js/trivial","description":"Trivial","severity":"warning",
          "security_severity_level":null,"tags":["maintainability"]},
  "most_recent_instance":{"message":{"text":"Nit."},
                          "location":{"path":"app/x.ts","start_line":1}}}]
EOF
out=$(DISPATCH_REVIEW_CODEQL_FIXTURE="$WORK/nonsec-warn.json" "$SUT" 42)
assert_eq "codeql: non-security rule.severity=warning → Confidence low" \
  "low" "$(jq -r '.findings[0].Confidence' <<<"$out")"

# 4. NO-PR SKIP: no PR number available → skipped-no-pr, exit 0, no findings.
rc=0
out=$("$SUT" "") || rc=$?
assert_eq "codeql: no PR number → exit 0" "0" "$rc"
assert_eq "codeql: no PR number → skipped-no-pr envelope" \
  '{"findings":[],"status":"skipped-no-pr"}' "$out"

rc=0
out=$("$SUT" none) || rc=$?
assert_eq "codeql: PR 'none' → skipped-no-pr envelope" \
  '{"findings":[],"status":"skipped-no-pr"}' "$out"

# 5. MULTI-PAGE: `gh api --paginate` emits one array document per page; the
#    script must concatenate them rather than reading only the first.
cat > "$WORK/paged.json" <<'EOF'
[{"number":1,"html_url":"u1","rule":{"id":"r1","description":"d1","severity":"error","security_severity_level":"medium","tags":["security"]},"most_recent_instance":{"message":{"text":"m1"},"location":{"path":"a.ts","start_line":1}}}]
[{"number":2,"html_url":"u2","rule":{"id":"r2","description":"d2","severity":"note","security_severity_level":null,"tags":[]},"most_recent_instance":{"message":{"text":"m2"},"location":{"path":"b.ts","start_line":2}}}]
EOF
out=$(DISPATCH_REVIEW_CODEQL_FIXTURE="$WORK/paged.json" "$SUT" 42)
assert_eq "codeql: two --paginate pages → both alerts normalized" \
  "2" "$(jq '.findings | length' <<<"$out")"
assert_eq "codeql: paginated security_severity_level=medium → Confidence medium" \
  "medium" "$(jq -r '.findings[0].Confidence' <<<"$out")"

report_results
