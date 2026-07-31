#!/usr/bin/env bash
# Tests for dispatch-epic-resolved-candidate -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 1910-2103.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-epic-resolved-candidate tests
# ============================================================================
echo ""
echo "=== dispatch-epic-resolved-candidate ==="

# Mechanical predicate (#1456): exit 0 = epic candidate (≥1 sub-issue, ALL closed
# as completed), exit 1 = clean "not a candidate", exit 3 = hard error
# (issue-sub-issues / gh failure). State + stateReason match case-insensitively.
# The fake issue-sub-issues reads subissues-<N>.json for child numbers, then cat's
# each issue-<child>.json VERBATIM (a child with no issue-<child>.json fixture
# defaults to state OPEN, no stateReason). So a child's stateReason lives in its
# own issue-<child>.json fixture. Capture the exit code with the if/else idiom
# (the suite runs set -e, so a bare non-zero call would abort).

# 1. Two children, both CLOSED/COMPLETED → candidate (exit 0).
echo "Test: candidate — 2 children all CLOSED/COMPLETED → exit 0"
setup
printf '{"labels":["epic"]}\n' > "$DISPATCH_CONFIG_DIR/epic.json"
printf '{"state":"open","labels":[{"name":"epic"}]}\n' > "$STUB_DIR/arg-issue-61.json"
printf '[{"number":611},{"number":612}]\n' > "$STUB_DIR/subissues-61.json"
printf '{"title":"c","body":"","comments":[],"number":611,"state":"CLOSED","stateReason":"COMPLETED"}\n' \
  > "$STUB_DIR/issue-611.json"
printf '{"title":"c","body":"","comments":[],"number":612,"state":"CLOSED","stateReason":"COMPLETED"}\n' \
  > "$STUB_DIR/issue-612.json"
if "$TMPDIR_TEST/dispatch-epic-resolved-candidate" 61 >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "candidate: all CLOSED/COMPLETED → exit 0" "0" "$rc"
teardown

# 2. Case-insensitive: a lowercase closed/completed child still → candidate.
echo "Test: candidate — lowercase closed/completed → exit 0"
setup
printf '{"labels":["epic"]}\n' > "$DISPATCH_CONFIG_DIR/epic.json"
printf '{"state":"open","labels":[{"name":"epic"}]}\n' > "$STUB_DIR/arg-issue-62.json"
printf '[{"number":621}]\n' > "$STUB_DIR/subissues-62.json"
printf '{"title":"c","body":"","comments":[],"number":621,"state":"closed","stateReason":"completed"}\n' \
  > "$STUB_DIR/issue-621.json"
if "$TMPDIR_TEST/dispatch-epic-resolved-candidate" 62 >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "candidate: lowercase closed/completed → exit 0" "0" "$rc"
teardown

# 3. No sub-issues → not a candidate (exit 1).
echo "Test: not a candidate — zero sub-issues → exit 1"
setup
printf '{"labels":["epic"]}\n' > "$DISPATCH_CONFIG_DIR/epic.json"
printf '{"state":"open","labels":[{"name":"epic"}]}\n' > "$STUB_DIR/arg-issue-63.json"
printf '[]\n' > "$STUB_DIR/subissues-63.json"
if "$TMPDIR_TEST/dispatch-epic-resolved-candidate" 63 >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "not a candidate: zero sub-issues → exit 1" "1" "$rc"
teardown

# 4. An OPEN child alongside a closed-completed one → not a candidate (exit 1).
echo "Test: not a candidate — an OPEN child → exit 1"
setup
printf '{"labels":["epic"]}\n' > "$DISPATCH_CONFIG_DIR/epic.json"
printf '{"state":"open","labels":[{"name":"epic"}]}\n' > "$STUB_DIR/arg-issue-64.json"
printf '[{"number":641},{"number":642}]\n' > "$STUB_DIR/subissues-64.json"
printf '{"title":"c","body":"","comments":[],"number":641,"state":"CLOSED","stateReason":"COMPLETED"}\n' \
  > "$STUB_DIR/issue-641.json"
printf '{"title":"c","body":"","comments":[],"number":642,"state":"OPEN"}\n' \
  > "$STUB_DIR/issue-642.json"
if "$TMPDIR_TEST/dispatch-epic-resolved-candidate" 64 >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "not a candidate: an OPEN child → exit 1" "1" "$rc"
teardown

# 5. A CLOSED child with stateReason NOT_PLANNED → not a candidate (exit 1).
echo "Test: not a candidate — CLOSED/NOT_PLANNED child → exit 1"
setup
printf '{"labels":["epic"]}\n' > "$DISPATCH_CONFIG_DIR/epic.json"
printf '{"state":"open","labels":[{"name":"epic"}]}\n' > "$STUB_DIR/arg-issue-65.json"
printf '[{"number":651}]\n' > "$STUB_DIR/subissues-65.json"
printf '{"title":"c","body":"","comments":[],"number":651,"state":"CLOSED","stateReason":"NOT_PLANNED"}\n' \
  > "$STUB_DIR/issue-651.json"
if "$TMPDIR_TEST/dispatch-epic-resolved-candidate" 65 >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "not a candidate: CLOSED/NOT_PLANNED child → exit 1" "1" "$rc"
teardown

# 6. A CLOSED child with NO stateReason key (null) → not a candidate (exit 1).
echo "Test: not a candidate — CLOSED child with null stateReason → exit 1"
setup
printf '{"labels":["epic"]}\n' > "$DISPATCH_CONFIG_DIR/epic.json"
printf '{"state":"open","labels":[{"name":"epic"}]}\n' > "$STUB_DIR/arg-issue-66.json"
printf '[{"number":661}]\n' > "$STUB_DIR/subissues-66.json"
printf '{"title":"c","body":"","comments":[],"number":661,"state":"CLOSED"}\n' \
  > "$STUB_DIR/issue-661.json"
if "$TMPDIR_TEST/dispatch-epic-resolved-candidate" 66 >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "not a candidate: CLOSED child with null stateReason → exit 1" "1" "$rc"
teardown

# 7. issue-sub-issues hard failure → exit 3 (distinct from "not a candidate").
echo "Test: hard error — issue-sub-issues fails → exit 3"
setup
printf '{"labels":["epic"]}\n' > "$DISPATCH_CONFIG_DIR/epic.json"
printf '{"state":"open","labels":[{"name":"epic"}]}\n' > "$STUB_DIR/arg-issue-67.json"
touch "$STUB_DIR/gh-fail-sub_issues-67"
if "$TMPDIR_TEST/dispatch-epic-resolved-candidate" 67 >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "hard error: issue-sub-issues fails → exit 3" "3" "$rc"
teardown

# --- Epic-label gate (#1594) ------------------------------------------------
# The gate runs BEFORE the sub-issues check: an issue is a candidate only if it
# carries a configured epic label — the configured set from epic.json, or the
# built-in default ("epic") when no epic.json is present. A present config
# replaces the default entirely (the configured set is used verbatim). A real
# label-fetch failure → exit 3 (distinct from "not a candidate").

# GATE-1. Epic configured, but the issue LACKS the configured label, even though
# all children are CLOSED/COMPLETED (would be a candidate without the gate) → the
# gate blocks it: exit 1.
echo "Test: gate — epic configured but issue lacks the label → exit 1"
setup
printf '{"labels":["epic"]}\n' > "$DISPATCH_CONFIG_DIR/epic.json"
printf '{"state":"open","labels":[{"name":"enhancement"}]}\n' > "$STUB_DIR/arg-issue-68.json"
printf '[{"number":681}]\n' > "$STUB_DIR/subissues-68.json"
printf '{"title":"c","body":"","comments":[],"number":681,"state":"CLOSED","stateReason":"COMPLETED"}\n' \
  > "$STUB_DIR/issue-681.json"
if "$TMPDIR_TEST/dispatch-epic-resolved-candidate" 68 >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "gate: configured but unlabeled would-be candidate → exit 1" "1" "$rc"
teardown

# GATE-2. NO epic config at all + issue carries the default "epic" label + all
# children CLOSED/COMPLETED → candidate (exit 0). The helper emits the built-in
# default "epic", the issue carries it, and all children are complete.
echo "Test: gate — no config + default epic label + all children complete → exit 0"
setup
printf '{"state":"open","labels":[{"name":"epic"}]}\n' > "$STUB_DIR/arg-issue-69.json"
printf '[{"number":691}]\n' > "$STUB_DIR/subissues-69.json"
printf '{"title":"c","body":"","comments":[],"number":691,"state":"CLOSED","stateReason":"COMPLETED"}\n' \
  > "$STUB_DIR/issue-691.json"
if "$TMPDIR_TEST/dispatch-epic-resolved-candidate" 69 >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "gate: no config + default epic label + all children complete → exit 0" "0" "$rc"
teardown

# GATE-2b. NO epic config + issue carries a NON-epic label ("enhancement") + all
# children CLOSED/COMPLETED → not a candidate (exit 1). The default set contains
# only "epic"; "enhancement" is not in it, so the gate blocks it.
echo "Test: gate — no config + non-epic label → exit 1"
setup
printf '{"state":"open","labels":[{"name":"enhancement"}]}\n' > "$STUB_DIR/arg-issue-71.json"
printf '[{"number":711}]\n' > "$STUB_DIR/subissues-71.json"
printf '{"title":"c","body":"","comments":[],"number":711,"state":"CLOSED","stateReason":"COMPLETED"}\n' \
  > "$STUB_DIR/issue-711.json"
if "$TMPDIR_TEST/dispatch-epic-resolved-candidate" 71 >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "gate: no config + non-epic label → exit 1 (default set does not match)" "1" "$rc"
teardown

# GATE-2c. Override-precedence: epic.json present with {"labels":["big-epic"]} +
# issue carries "big-epic" + all children CLOSED/COMPLETED → candidate (exit 0).
echo "Test: gate — config override big-epic + issue carries big-epic → exit 0"
setup
printf '{"labels":["big-epic"]}\n' > "$DISPATCH_CONFIG_DIR/epic.json"
printf '{"state":"open","labels":[{"name":"big-epic"}]}\n' > "$STUB_DIR/arg-issue-72.json"
printf '[{"number":721}]\n' > "$STUB_DIR/subissues-72.json"
printf '{"title":"c","body":"","comments":[],"number":721,"state":"CLOSED","stateReason":"COMPLETED"}\n' \
  > "$STUB_DIR/issue-721.json"
if "$TMPDIR_TEST/dispatch-epic-resolved-candidate" 72 >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "gate: override big-epic + issue carries big-epic → exit 0" "0" "$rc"
teardown

# GATE-2d. Override-precedence: epic.json present with {"labels":["big-epic"]} +
# issue carries only "epic" (the former default) → not a candidate (exit 1). The
# configured set REPLACES the default, so plain "epic" is no longer recognized.
echo "Test: gate — config override big-epic + issue carries plain epic → exit 1"
setup
printf '{"labels":["big-epic"]}\n' > "$DISPATCH_CONFIG_DIR/epic.json"
printf '{"state":"open","labels":[{"name":"epic"}]}\n' > "$STUB_DIR/arg-issue-73.json"
printf '[{"number":731}]\n' > "$STUB_DIR/subissues-73.json"
printf '{"title":"c","body":"","comments":[],"number":731,"state":"CLOSED","stateReason":"COMPLETED"}\n' \
  > "$STUB_DIR/issue-731.json"
if "$TMPDIR_TEST/dispatch-epic-resolved-candidate" 73 >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "gate: override big-epic + issue carries plain epic → exit 1 (config replaces default)" "1" "$rc"
teardown

# GATE-3. Epic configured, but the label fetch HARD-fails (deterministic, not
# transient — gh_retry forwards it) → exit 3, distinct from "not a candidate".
echo "Test: gate — label fetch hard failure → exit 3"
setup
printf '{"labels":["epic"]}\n' > "$DISPATCH_CONFIG_DIR/epic.json"
touch "$STUB_DIR/gh-fail-issue-labels-70"
if "$TMPDIR_TEST/dispatch-epic-resolved-candidate" 70 >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "gate: label fetch hard failure → exit 3" "3" "$rc"
teardown

# GATE-4. Malformed epic.json → dispatch-config-load exits 1 → candidate must
# surface the loader failure as exit 3 (guard added in #2239).
echo "Test: gate — malformed epic.json → exit 3 with candidate diagnostic"
setup
printf 'not json{\n' > "$DISPATCH_CONFIG_DIR/epic.json"
if "$TMPDIR_TEST/dispatch-epic-resolved-candidate" 71 >/dev/null 2>"$TMPDIR_TEST/err.txt"; then rc=0; else rc=$?; fi
assert_eq "gate: malformed epic.json → exit 3" "3" "$rc"
if grep -q 'dispatch-epic-resolved-candidate:' "$TMPDIR_TEST/err.txt"; then diag=yes; else diag=no; fi
assert_eq "gate: malformed epic.json → candidate diagnostic on stderr" "yes" "$diag"
teardown

# <<< END MOVED <<<

report_results
