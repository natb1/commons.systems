#!/usr/bin/env bash
# Tests for dispatch-review-erosion -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 28456-28724.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# dispatch-review-erosion tests
# ============================================================================
#
# Tests for the net-erosion structural-decay finder (#2064). These are the
# DETERMINISTIC, NETWORK-FREE portions:
#
# E1. Language-scope filter: docs-only and bash-only stdin yield {"findings":[]}
#     (exit 0). Drives the real dispatch-review-erosion entrypoint end-to-end.
#     Requires a no-op eslint stub at node_modules/.bin/eslint in cwd — eslint is
#     never invoked (filter exits before the metric runs), but the guard check
#     [[ ! -x "$ESLINT_BIN" ]] would fail before reaching the filter otherwise.
#
# E2. Complexity net-delta via sidecar: drives dispatch-review-erosion-diff.mjs
#     directly with synthetic eslint and jscpd JSON, sidestepping the real
#     eslint, jscpd (network), and git. The sidecar is the clean unit boundary
#     for asserting Source="erosion" + path:line Location when complexity rises.

echo ""
echo "=== dispatch-review-erosion ==="

# E1a. docs-only stdin → {"findings":[]} (language-scope filter exits early).
#
#     Files are created on disk so the HEAD-existence filter (which also exits
#     early) cannot silently backstop the language-scope filter test. With the
#     files present, only the language filter can explain the early exit: if it
#     were removed, head_paths would be non-empty → the script would reach
#     run_jscpd → fail loudly (no report produced). Creating them on disk is
#     the cheapest way to give the assertion real teeth.
echo "Test: dispatch-review-erosion — docs-only stdin yields empty findings"
TMPDIR_TEST=$(mktemp -d)
mkdir -p "$TMPDIR_TEST/node_modules/.bin" "$TMPDIR_TEST/docs"
cat > "$TMPDIR_TEST/node_modules/.bin/eslint" <<'ESTUB'
#!/usr/bin/env bash
# No-op stub: never invoked on a docs-only file list (language filter exits first).
exit 0
ESTUB
chmod +x "$TMPDIR_TEST/node_modules/.bin/eslint"
# Create the files on disk so HEAD-existence can't backstop the language filter.
touch "$TMPDIR_TEST/README.md" "$TMPDIR_TEST/docs/guide.md"
result=$(cd "$TMPDIR_TEST" && printf '%s\n' 'README.md' 'docs/guide.md' \
  | "$SCRIPT_DIR/dispatch-review-erosion" dummybase)
assert_eq "docs-only stdin → empty findings" '{"findings":[]}' "$result"
rm -rf "$TMPDIR_TEST"
TMPDIR_TEST=""

# E1b. bash-only stdin → {"findings":[]} (same filter path, different extension set).
#     Same disk-creation convention as E1a.
echo "Test: dispatch-review-erosion — bash-only stdin yields empty findings"
TMPDIR_TEST=$(mktemp -d)
mkdir -p "$TMPDIR_TEST/node_modules/.bin" "$TMPDIR_TEST/.claude/scripts"
cat > "$TMPDIR_TEST/node_modules/.bin/eslint" <<'ESTUB'
#!/usr/bin/env bash
exit 0
ESTUB
chmod +x "$TMPDIR_TEST/node_modules/.bin/eslint"
# Create the files on disk so HEAD-existence can't backstop the language filter.
touch "$TMPDIR_TEST/.claude/scripts/dispatch-review-erosion" \
      "$TMPDIR_TEST/.claude/scripts/lib.sh"
result=$(cd "$TMPDIR_TEST" && printf '%s\n' \
  '.claude/scripts/dispatch-review-erosion' \
  '.claude/scripts/lib.sh' \
  | "$SCRIPT_DIR/dispatch-review-erosion" dummybase)
assert_eq "bash-only stdin → empty findings" '{"findings":[]}' "$result"
rm -rf "$TMPDIR_TEST"
TMPDIR_TEST=""

# E2. Sidecar complexity net-delta: HEAD max rose → finding with Source="erosion"
#     and a valid path:line Location.
#
#     The sidecar reads all four artifact paths passed on the CLI; it does NOT
#     invoke eslint, jscpd, or git. Synthetic JSON is enough to drive the full
#     net-delta logic. Key alignment constraint (relpath normalization):
#       HEAD   filePath = <cwd>/foo.ts          → strips cwd prefix → "foo.ts"
#       BASE   filePath = <cwd>/baseline/foo.ts → strips cwd/baseline/ → "foo.ts"
#     Both keys become "foo.ts" so baseCx.get(rel) hits and the diff fires.
echo "Test: dispatch-review-erosion-diff.mjs — complexity net-increase yields Source=erosion finding"
TMPDIR_TEST=$(mktemp -d)
# eslint HEAD report: foo.ts, one function at complexity 5, worst-function line 3.
cat > "$TMPDIR_TEST/head-eslint.json" <<EOF
[{"filePath":"$TMPDIR_TEST/foo.ts","messages":[{"ruleId":"complexity","message":"Function 'doThing' has a complexity of 5. Maximum allowed is 0.","line":3}]}]
EOF
# eslint BASE report: same file but lower complexity (2) pre-PR.
mkdir -p "$TMPDIR_TEST/baseline"
cat > "$TMPDIR_TEST/base-eslint.json" <<EOF
[{"filePath":"$TMPDIR_TEST/baseline/foo.ts","messages":[{"ruleId":"complexity","message":"Function 'doThing' has a complexity of 2. Maximum allowed is 0.","line":1}]}]
EOF
# jscpd HEAD report: zero clones (no duplication finding expected here).
cat > "$TMPDIR_TEST/head-jscpd.json" <<'EOF'
{"statistics":{"total":{"clones":0,"duplicatedLines":0,"percentage":0}}}
EOF
sidecar_out=$(cd "$TMPDIR_TEST" && node "$SCRIPT_DIR/dispatch-review-erosion-diff.mjs" \
  --eslint-head head-eslint.json \
  --eslint-base base-eslint.json \
  --jscpd-head head-jscpd.json \
  --baseline-dir baseline)
sidecar_source=$(jq -r '.findings[0].Source // "none"' <<<"$sidecar_out")
sidecar_location=$(jq -r '.findings[0].Location // "none"' <<<"$sidecar_out")
sidecar_confidence=$(jq -r '.findings[0].Confidence // "none"' <<<"$sidecar_out")
assert_eq "sidecar complexity finding Source=erosion" "erosion" "$sidecar_source"
assert_eq "sidecar complexity finding Location=foo.ts:3" "foo.ts:3" "$sidecar_location"
assert_eq "sidecar complexity finding Confidence=high (max rose)" "high" "$sidecar_confidence"
rm -rf "$TMPDIR_TEST"
TMPDIR_TEST=""

# E3. Sidecar no net-increase → {"findings":[]}.
#     HEAD and BASE have identical complexity; the diff should produce no finding.
echo "Test: dispatch-review-erosion-diff.mjs — no net-increase yields empty findings"
TMPDIR_TEST=$(mktemp -d)
cat > "$TMPDIR_TEST/head-eslint.json" <<EOF
[{"filePath":"$TMPDIR_TEST/bar.ts","messages":[{"ruleId":"complexity","message":"Function 'x' has a complexity of 3. Maximum allowed is 0.","line":2}]}]
EOF
mkdir -p "$TMPDIR_TEST/baseline"
cat > "$TMPDIR_TEST/base-eslint.json" <<EOF
[{"filePath":"$TMPDIR_TEST/baseline/bar.ts","messages":[{"ruleId":"complexity","message":"Function 'x' has a complexity of 3. Maximum allowed is 0.","line":2}]}]
EOF
cat > "$TMPDIR_TEST/head-jscpd.json" <<'EOF'
{"statistics":{"total":{"clones":0,"duplicatedLines":0,"percentage":0}}}
EOF
sidecar_out=$(cd "$TMPDIR_TEST" && node "$SCRIPT_DIR/dispatch-review-erosion-diff.mjs" \
  --eslint-head head-eslint.json \
  --eslint-base base-eslint.json \
  --jscpd-head head-jscpd.json \
  --baseline-dir baseline)
sidecar_count=$(jq '.findings | length' <<<"$sidecar_out")
assert_eq "sidecar no net-increase → zero findings" "0" "$sidecar_count"
rm -rf "$TMPDIR_TEST"
TMPDIR_TEST=""

# E4. Sidecar duplication net-delta: HEAD jscpd clones rose from 0 → finding
#     with Source="erosion" and a path:line Location derived from the largest
#     clone (exercises worstCloneLocation).
#
#     Empty eslint reports ([]) for both HEAD and BASE suppress the complexity
#     path (complexityScalars yields no per-file entries), so the ONLY finding is
#     the duplication one. The HEAD jscpd report carries clones rising from a
#     zero-clone baseline, so clonesRose fires (Confidence=high). worstCloneLocation
#     iterates every entry in `duplicates` and keeps the one with the largest
#     (firstFile.end - firstFile.start) span; we seed TWO clones so the
#     "largest clone wins" comparison branch is actually exercised rather than
#     trivially true on a single-item loop. The first entry is a 9-line span at
#     dup.ts:5 (end 14 - start 5); the second is a smaller 3-line span at
#     dup.ts:1 (end 4 - start 1). The larger span must win, and firstFile.name is
#     the bare relative "dup.ts" (no cwd prefix to strip), so the Location is
#     "dup.ts:5" — the smaller clone's "dup.ts:1" must NOT be selected.
echo "Test: dispatch-review-erosion-diff.mjs — duplication net-increase yields Source=erosion finding"
TMPDIR_TEST=$(mktemp -d)
# Empty eslint reports suppress the complexity path entirely.
cat > "$TMPDIR_TEST/head-eslint.json" <<'EOF'
[]
EOF
mkdir -p "$TMPDIR_TEST/baseline"
cat > "$TMPDIR_TEST/base-eslint.json" <<'EOF'
[]
EOF
# jscpd HEAD report: two clone blocks. The first is a 9-line span at dup.ts:5
# (end 14 - start 5); the second is a smaller 3-line span at dup.ts:1 (end 4 -
# start 1). worstCloneLocation must pick the larger span (dup.ts:5), so the
# second, smaller entry makes the "largest clone wins" comparison meaningful.
cat > "$TMPDIR_TEST/head-jscpd.json" <<'EOF'
{
  "statistics": { "total": { "clones": 2, "duplicatedLines": 13, "percentage": 7 } },
  "duplicates": [
    { "firstFile": { "name": "dup.ts", "start": 5, "end": 14 },
      "secondFile": { "name": "dup.ts", "start": 30, "end": 39 } },
    { "firstFile": { "name": "dup.ts", "start": 1, "end": 4 },
      "secondFile": { "name": "dup.ts", "start": 50, "end": 53 } }
  ]
}
EOF
# jscpd BASE report: zero clones (no duplication pre-PR).
cat > "$TMPDIR_TEST/base-jscpd.json" <<'EOF'
{ "statistics": { "total": { "clones": 0, "duplicatedLines": 0, "percentage": 0 } } }
EOF
sidecar_out=$(cd "$TMPDIR_TEST" && node "$SCRIPT_DIR/dispatch-review-erosion-diff.mjs" \
  --eslint-head head-eslint.json \
  --eslint-base base-eslint.json \
  --jscpd-head head-jscpd.json \
  --jscpd-base base-jscpd.json \
  --baseline-dir baseline)
sidecar_count=$(jq '.findings | length' <<<"$sidecar_out")
sidecar_source=$(jq -r '.findings[0].Source // "none"' <<<"$sidecar_out")
sidecar_location=$(jq -r '.findings[0].Location // "none"' <<<"$sidecar_out")
sidecar_confidence=$(jq -r '.findings[0].Confidence // "none"' <<<"$sidecar_out")
assert_eq "sidecar duplication finding count=1" "1" "$sidecar_count"
assert_eq "sidecar duplication finding Source=erosion" "erosion" "$sidecar_source"
assert_eq "sidecar duplication finding Location=dup.ts:5" "dup.ts:5" "$sidecar_location"
assert_eq "sidecar duplication finding Confidence=high (clones rose)" "high" "$sidecar_confidence"
rm -rf "$TMPDIR_TEST"
TMPDIR_TEST=""

# E5. Sidecar no-baseline duplication: all-new-files PR has empty baseline_paths,
#     so the driver passes NO --jscpd-base. The sidecar then defaults baseDup to
#     zeros, so any HEAD clone (headDup.clones > 0) fires an aggregate duplication
#     finding with a path:line Location from the largest HEAD clone. E2/E3 pass a
#     zero-clone HEAD report, so this duplication path is otherwise uncovered.
#     Empty eslint reports isolate the duplication path (no complexity finding).
echo "Test: dispatch-review-erosion-diff.mjs — no-baseline HEAD clone yields Source=erosion duplication finding"
TMPDIR_TEST=$(mktemp -d)
mkdir -p "$TMPDIR_TEST/baseline"
# Empty eslint reports → no complexity finding; isolates the duplication path.
echo '[]' > "$TMPDIR_TEST/head-eslint.json"
echo '[]' > "$TMPDIR_TEST/base-eslint.json"
# HEAD jscpd report: one clone with concrete per-clone detail so the Location is
# a real path:line (newfile.ts:10), not the changed-files fallback.
cat > "$TMPDIR_TEST/head-jscpd.json" <<'EOF'
{"statistics":{"total":{"clones":1,"duplicatedLines":12,"percentage":8}},
 "duplicates":[{"firstFile":{"name":"newfile.ts","start":10,"end":22},
                "secondFile":{"name":"newfile.ts","start":40,"end":52}}]}
EOF
# Invoke WITHOUT --jscpd-base (the all-new-files / no-baseline case).
sidecar_out=$(cd "$TMPDIR_TEST" && node "$SCRIPT_DIR/dispatch-review-erosion-diff.mjs" \
  --eslint-head head-eslint.json \
  --eslint-base base-eslint.json \
  --jscpd-head head-jscpd.json \
  --baseline-dir baseline)
sidecar_source=$(jq -r '.findings[0].Source // "none"' <<<"$sidecar_out")
sidecar_location=$(jq -r '.findings[0].Location // "none"' <<<"$sidecar_out")
sidecar_confidence=$(jq -r '.findings[0].Confidence // "none"' <<<"$sidecar_out")
sidecar_count=$(jq '.findings | length' <<<"$sidecar_out")
assert_eq "sidecar no-baseline duplication Source=erosion" "erosion" "$sidecar_source"
assert_eq "sidecar no-baseline duplication Location=newfile.ts:10" "newfile.ts:10" "$sidecar_location"
assert_eq "sidecar no-baseline duplication Confidence=high (clones rose 0→1)" "high" "$sidecar_confidence"
assert_eq "sidecar no-baseline duplication → exactly one finding" "1" "$sidecar_count"
rm -rf "$TMPDIR_TEST"
TMPDIR_TEST=""

# E6. Sidecar dupLines-only duplication (medium confidence): HEAD and BASE have
#     EQUAL clone counts (clones=1 both), so clonesRose=false, but HEAD has MORE
#     duplicated lines (15 > 5), so dupLinesRose=true. The aggregate duplication
#     finding still fires (clonesRose || dupLinesRose), but takes the
#     Confidence='medium' sub-path (clonesRose ? 'high' : 'medium'). E4/E5 both
#     drive clonesRose=true (high), so this medium sub-path is otherwise uncovered.
#     Empty eslint reports isolate the duplication path (no complexity finding).
echo "Test: dispatch-review-erosion-diff.mjs — dupLines-only rise yields Confidence=medium duplication finding"
TMPDIR_TEST=$(mktemp -d)
mkdir -p "$TMPDIR_TEST/baseline"
# Empty eslint reports → no complexity finding; isolates the duplication path.
echo '[]' > "$TMPDIR_TEST/head-eslint.json"
echo '[]' > "$TMPDIR_TEST/base-eslint.json"
# HEAD jscpd report: one clone, 15 duplicated lines. The single duplicates entry
# keeps the fixture realistic (worstCloneLocation has a real span to read).
cat > "$TMPDIR_TEST/head-jscpd.json" <<'EOF'
{"statistics":{"total":{"clones":1,"duplicatedLines":15,"percentage":9}},
 "duplicates":[{"firstFile":{"name":"dup.ts","start":10,"end":22},
                "secondFile":{"name":"dup.ts","start":40,"end":52}}]}
EOF
# BASE jscpd report: SAME clone count (1) so clonesRose=false, but FEWER
# duplicated lines (5 < 15) so dupLinesRose=true. Statistics-only is fine — the
# BASE report only feeds jscpdTotals (baseDup).
cat > "$TMPDIR_TEST/base-jscpd.json" <<'EOF'
{"statistics":{"total":{"clones":1,"duplicatedLines":5,"percentage":3}}}
EOF
sidecar_out=$(cd "$TMPDIR_TEST" && node "$SCRIPT_DIR/dispatch-review-erosion-diff.mjs" \
  --eslint-head head-eslint.json \
  --eslint-base base-eslint.json \
  --jscpd-head head-jscpd.json \
  --jscpd-base base-jscpd.json \
  --baseline-dir baseline)
sidecar_count=$(jq '.findings | length' <<<"$sidecar_out")
sidecar_source=$(jq -r '.findings[0].Source // "none"' <<<"$sidecar_out")
sidecar_location=$(jq -r '.findings[0].Location // "none"' <<<"$sidecar_out")
sidecar_confidence=$(jq -r '.findings[0].Confidence // "none"' <<<"$sidecar_out")
assert_eq "sidecar dupLines-only duplication count=1" "1" "$sidecar_count"
assert_eq "sidecar dupLines-only duplication Source=erosion" "erosion" "$sidecar_source"
assert_eq "sidecar dupLines-only duplication Location=dup.ts:10" "dup.ts:10" "$sidecar_location"
assert_eq "sidecar dupLines-only duplication Confidence=medium (dupLines rose, clones flat)" "medium" "$sidecar_confidence"
rm -rf "$TMPDIR_TEST"
TMPDIR_TEST=""

# <<< END MOVED <<<

report_results
