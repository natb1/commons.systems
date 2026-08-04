#!/usr/bin/env bash
# Tests for dispatch-api-call-site.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

echo "Test: dispatch-api-call-site"

# empty stdin → false
out=$(printf '' | "$SCRIPT_DIR/dispatch-api-call-site")
assert_eq "empty stdin → false" "api_call_site=false" "$out"

# only + line is a plain assignment, no call-site pattern → false
diff_plain=$'--- a/src/x.ts\n+++ b/src/x.ts\n@@ -1,1 +1,1 @@\n+const x = 1;\n'
out=$(printf '%s' "$diff_plain" | "$SCRIPT_DIR/dispatch-api-call-site")
assert_eq "plain assignment + line → false" "api_call_site=false" "$out"

# + line calling getDocs(collection(...)) → true
diff_getdocs=$'--- a/src/jobs.ts\n+++ b/src/jobs.ts\n@@ -1,1 +1,1 @@\n+  const snap = await getDocs(collection(db, '"'"'jobs'"'"'));\n'
out=$(printf '%s' "$diff_getdocs" | "$SCRIPT_DIR/dispatch-api-call-site")
assert_eq "getDocs(collection(...)) + line → true" "api_call_site=true" "$out"

# + line calling fetch(url) → true
diff_fetch=$'--- a/src/http.ts\n+++ b/src/http.ts\n@@ -1,1 +1,1 @@\n+  const r = await fetch(url);\n'
out=$(printf '%s' "$diff_fetch" | "$SCRIPT_DIR/dispatch-api-call-site")
assert_eq "fetch(url) + line → true" "api_call_site=true" "$out"

# pattern appears ONLY on a context line (leading space, no +/-) → false.
# Load-bearing: proves the classifier scans only +-prefixed added lines, not
# the whole diff body.
diff_context=$'--- a/src/http.ts\n+++ b/src/http.ts\n@@ -1,2 +1,2 @@\n const r = await fetch(url);\n+const y = 2;\n'
out=$(printf '%s' "$diff_context" | "$SCRIPT_DIR/dispatch-api-call-site")
assert_eq "fetch(...) on context line only → false" "api_call_site=false" "$out"

# pattern appears only on a removed line → false
diff_removed=$'--- a/src/jobs.ts\n+++ b/src/jobs.ts\n@@ -1,1 +1,1 @@\n-  await getDocs(q);\n+  await noop();\n'
out=$(printf '%s' "$diff_removed" | "$SCRIPT_DIR/dispatch-api-call-site")
assert_eq "getDocs(...) on removed line only → false" "api_call_site=false" "$out"

# the +++ file header itself contains "fetch" but the body does not → false.
# Guards the ^\+\+\+ exclusion so the header line is never mistaken for an
# added line.
diff_header=$'--- a/src/fetch-helpers.ts\n+++ b/src/fetch-helpers.ts\n@@ -1,1 +1,1 @@\n+const x = 1;\n'
out=$(printf '%s' "$diff_header" | "$SCRIPT_DIR/dispatch-api-call-site")
assert_eq "fetch in +++ header only → false" "api_call_site=false" "$out"

# markdown-only diff mentioning "fetch(" in prose inside a + line → true.
# Accepted false positive, asserted here to pin the behavior: the classifier
# has no awareness of file type, and the surface gate upstream (surface=docs)
# already excludes docs-only diffs from reaching this gate in the real
# dispatch pipeline, so a docs-only false positive here is harmless in
# practice.
diff_markdown=$'--- a/README.md\n+++ b/README.md\n@@ -1,1 +1,1 @@\n+Call `fetch(url)` to retrieve the resource.\n'
out=$(printf '%s' "$diff_markdown" | "$SCRIPT_DIR/dispatch-api-call-site")
assert_eq "markdown prose mentioning fetch( → true (accepted false positive)" "api_call_site=true" "$out"

report_results
