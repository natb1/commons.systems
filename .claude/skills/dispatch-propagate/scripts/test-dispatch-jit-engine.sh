#!/usr/bin/env bash
# Tests for dispatch-jit-engine -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 15909-16891.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-jit-engine tests
# ============================================================================
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/scripts/   copies of the engine + loader + project-item-add
#   $TMPDIR_TEST/config/    synthetic config directory (DISPATCH_CONFIG_DIR)
#   $TMPDIR_TEST/state/     the jit state-file directory (DISPATCH_JIT_STATE_DIR)
#   $TMPDIR_TEST/checkdir/  check-script directory (DISPATCH_JIT_SCRIPT_DIR)
#   $TMPDIR_TEST/stub/      gh stub fixtures + the gh-calls.log
#   $TMPDIR_TEST/bin/       the gh PATH stub
#
# The engine resolves dispatch-config-load and dispatch-project-item-add via its
# own SCRIPT_DIR — which becomes $TMPDIR_TEST/scripts for the copy — so all three
# scripts are co-located. The gh stub logs EVERY matched invocation to
# gh-calls.log so a test can assert "zero gh calls" (the debounce case). "now" is
# pinned via DISPATCH_JIT_NOW so every create decision is deterministic.

# A fixed reference epoch — 2026-01-01T00:00:00Z. Closed-issue timestamps in the
# fixtures are computed relative to this so the cadence math is deterministic.
JIT_NOW_EPOCH=1767225600

jit_setup() {
  TMPDIR_TEST=$(mktemp -d)
  STUB_DIR="$TMPDIR_TEST/stub"
  mkdir -p "$TMPDIR_TEST/scripts" "$STUB_DIR" "$TMPDIR_TEST/bin" \
    "$TMPDIR_TEST/config" "$TMPDIR_TEST/state" "$TMPDIR_TEST/checkdir"

  cp "$SCRIPT_DIR/dispatch-jit-engine" "$TMPDIR_TEST/scripts/dispatch-jit-engine"
  cp "$SCRIPT_DIR/dispatch-config-load" \
    "$TMPDIR_TEST/scripts/dispatch-config-load"
  # dispatch-jit-engine and dispatch-config-load source lib.sh via their
  # SCRIPT_DIR — so lib.sh must sit alongside them. Sourced, not executed — no
  # chmod +x.
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/lib.sh"
  cp "$SCRIPT_DIR/dispatch-project-item-add" \
    "$TMPDIR_TEST/scripts/dispatch-project-item-add"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-jit-engine" \
           "$TMPDIR_TEST/scripts/dispatch-config-load" \
           "$TMPDIR_TEST/scripts/dispatch-project-item-add"

  export DISPATCH_CONFIG_DIR="$TMPDIR_TEST/config"
  export DISPATCH_JIT_STATE_DIR="$TMPDIR_TEST/state"
  export DISPATCH_JIT_SCRIPT_DIR="$TMPDIR_TEST/checkdir"
  export DISPATCH_JIT_NOW="$JIT_NOW_EPOCH"

  # gh PATH stub. Every matched subcommand is appended to gh-calls.log so the
  # debounce test can assert the log is absent (zero gh calls). issue list reads
  # open-issues.json / closed-issues.json fixtures if present, else "[]". The REST
  # create arm (`api -X POST .../issues`, #2256) logs its full args to
  # gh-issue-create-rest-calls.log so tests can verify the body (including the
  # jit-due marker) the engine sent.
  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
echo "$args" >> "$STUB_DIR/gh-calls.log"
case "$args" in
  "label create "*)
    # Idempotent label create — default success.
    ;;
  "api -X POST "*/issues\ *)
    # gh_issue_create_rest sentinel (#2256): POST .../issues (new issue creation).
    # MUST precede the generic issue-list REST branch below, whose pattern would
    # otherwise swallow this POST. Echoes html_url so the script's URL→number
    # parse keeps working (matches the prior porcelain stub's URL echo).
    echo "$args" >> "$STUB_DIR/gh-issue-create-rest-calls.log"
    echo '{"number":123,"html_url":"https://github.com/test-owner/test-repo/issues/123"}'
    ;;
  *"api "*"repos/"*"/issues"*)
    # gh_issue_list_rest (#2258): the engine's open/closed scans now hit REST
    # (gh api [--paginate] repos/<repo>/issues?state=<s>&...). Serve the SAME
    # open-issues.json / closed-issues.json fixtures, jq-remapped to REST
    # snake_case so the helper remaps them back to identical camelCase data.
    # state=open vs state=closed in the query string selects the fixture.
    if [[ "$args" == *state=open* ]]; then
      fixture="$STUB_DIR/open-issues.json"
    else
      fixture="$STUB_DIR/closed-issues.json"
    fi
    if [[ -f "$fixture" ]]; then
      jq 'map({number, pull_request: null, created_at: (.createdAt // null), closed_at: (.closedAt // null), labels: (.labels // [])} + (if has("body") then {body} else {} end) + (if has("title") then {title} else {} end))' "$fixture"
    else
      echo '[]'
    fi
    ;;
  "project item-add "*)
    echo '{"id":"PVTI_jit001","title":"JIT issue","type":"Issue"}'
    ;;
  *)
    echo "gh stub: unknown invocation: $args" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/gh"
  PATH="$TMPDIR_TEST/bin:$PATH"
}

jit_teardown() {
  rm -rf "$TMPDIR_TEST"
  PATH="$SAVED_PATH"
  TMPDIR_TEST=""
  STUB_DIR=""
  unset DISPATCH_CONFIG_DIR
  unset DISPATCH_JIT_STATE_DIR
  unset DISPATCH_JIT_SCRIPT_DIR
  unset DISPATCH_JIT_NOW
}

# jit_write_projects — write a projects.json fixture with one project whose key
# matches the jit `project` field used throughout these tests.
jit_write_projects() {
  cat > "$TMPDIR_TEST/config/projects.json" <<'EOF'
{
  "projects": [
    {
      "key": "test-project",
      "owner": "test-owner",
      "number": 1,
      "statusField": "Status",
      "statusInProgress": "In Progress",
      "statusDone": "Done"
    }
  ]
}
EOF
}

# --- Test 1: no config — silent no-op ---------------------------------------

echo "Test: dispatch-jit-engine with no config is a silent no-op"
jit_setup
# No jit.json written in $DISPATCH_CONFIG_DIR.
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "no-config exits 0" "0" "$rc"
assert_eq "no-config prints nothing" "" "$out"
jit_teardown

# --- Test 2: cadence cold start creates an issue -----------------------------

echo "Test: dispatch-jit-engine cadence cold start creates an issue"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "daily-chore",
      "repo": "test-owner/test-repo",
      "label": "jit:daily-chore",
      "title": "Daily chore",
      "body": "Recurring daily chore. Close when done.",
      "project": "test-project",
      "remindAfterClose": "12h",
      "dueAfterClose": "24h"
    }
  ]
}
EOF
# open-issues.json and closed-issues.json absent — open/closed both "[]".
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "cold start exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
# Cold start with remind=12h, due=24h, NOW=2026-01-01T00:00:00Z:
# DUE = NOW + 24h - 12h = 2026-01-01T12:00:00Z.
if [[ "$out" == *"daily-chore: created #123 (due 2026-01-01T12:00:00Z)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: cold start reports created #123 (due 2026-01-01T12:00:00Z)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: cold start reports created #123 (due 2026-01-01T12:00:00Z)"
  echo "    actual: $out"
fi
calls=$(cat "$STUB_DIR/gh-calls.log")
TOTAL=$((TOTAL + 1))
if [[ "$calls" == *"label create"* && "$calls" == *"issues?"*"state=open"* \
   && "$calls" == *"issues?"*"state=closed"* \
   && "$calls" == *"api -X POST "*"/issues "* && "$calls" == *"project item-add"* ]]; then
  PASS=$((PASS + 1))
  echo "  PASS: cold start invoked label create / list / create (REST) / item-add"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL: cold start invoked label create / list / create / item-add"
  echo "    gh-calls.log: $calls"
fi
create_log=$(cat "$STUB_DIR/gh-issue-create-rest-calls.log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$create_log" == *"<!-- jit-due: 2026-01-01T12:00:00Z -->"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: cold start embedded jit-due marker in issue body"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: cold start embedded jit-due marker in issue body"
  echo "    gh-issue-create-rest-calls.log: $create_log"
fi
jit_teardown

# --- Test 2-weekly-review: weekly-review jit (7d/14d) cadence cold start -----------------

echo "Test: dispatch-jit-engine weekly-review jit cadence cold start creates an issue"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "weekly-review",
      "repo": "test-owner/test-repo",
      "label": "jit:weekly-review",
      "title": "Weekly review",
      "body": "Recurring weekly review.",
      "project": "test-project",
      "remindAfterClose": "7d",
      "dueAfterClose": "14d",
      "skill": "weekly-review-engine"
    }
  ]
}
EOF
# open-issues.json and closed-issues.json absent — open/closed both "[]".
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "weekly-review cold start exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
# Cold start with remind=7d, due=14d, NOW=2026-01-01T00:00:00Z:
# DUE = NOW + 14d - 7d = NOW + 7d = 2026-01-08T00:00:00Z.
if [[ "$out" == *"weekly-review: created #123 (due 2026-01-08T00:00:00Z)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly-review cold start reports created #123 (due 2026-01-08T00:00:00Z)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly-review cold start reports created #123 (due 2026-01-08T00:00:00Z)"
  echo "    actual: $out"
fi
create_log=$(cat "$STUB_DIR/gh-issue-create-rest-calls.log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$create_log" == *"<!-- jit-due: 2026-01-08T00:00:00Z -->"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly-review cold start embedded jit-due marker in issue body"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly-review cold start embedded jit-due marker in issue body"
  echo "    gh-issue-create-rest-calls.log: $create_log"
fi
TOTAL=$((TOTAL + 1))
if [[ "$create_log" == *"title=Weekly review"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly-review cold start created issue with configured title"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly-review cold start created issue with configured title"
  echo "    gh-issue-create-rest-calls.log: $create_log"
fi
jit_teardown

# --- Test 3: cadence within window — skipped, no issue created ---------------

echo "Test: dispatch-jit-engine cadence within remindAfterClose is skipped"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "daily-chore",
      "repo": "test-owner/test-repo",
      "label": "jit:daily-chore",
      "title": "Daily chore",
      "body": "Recurring daily chore. Close when done.",
      "project": "test-project",
      "remindAfterClose": "12h"
    }
  ]
}
EOF
# Newest closed issue closed 1h before "now" — within the 12h window.
closed_at=$(date -u -d "@$((JIT_NOW_EPOCH - 3600))" +%Y-%m-%dT%H:%M:%SZ)
printf '[{"number":40,"closedAt":"%s"}]\n' "$closed_at" \
  > "$STUB_DIR/closed-issues.json"
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "within-window exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"daily-chore: skipped (within remindAfterClose)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: within-window reports skipped (within remindAfterClose)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: within-window reports skipped (within remindAfterClose)"
  echo "    actual: $out"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -f "$STUB_DIR/gh-issue-create-rest-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: within-window made no issue create call"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: within-window made no issue create call"
  echo "    gh-issue-create-rest-calls.log: $(cat "$STUB_DIR/gh-issue-create-rest-calls.log")"
fi
jit_teardown

# --- Test 3-weekly-review: weekly-review jit (7d/14d) within window — skipped, no issue created ---

echo "Test: dispatch-jit-engine weekly-review jit within remindAfterClose is skipped"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "weekly-review",
      "repo": "test-owner/test-repo",
      "label": "jit:weekly-review",
      "title": "Weekly review",
      "body": "Recurring weekly review.",
      "project": "test-project",
      "remindAfterClose": "7d",
      "dueAfterClose": "14d",
      "skill": "weekly-review-engine"
    }
  ]
}
EOF
# Newest closed issue closed 5d before "now" — within the 7d window.
closed_at=$(date -u -d "@$((JIT_NOW_EPOCH - 5*86400))" +%Y-%m-%dT%H:%M:%SZ)
printf '[{"number":40,"closedAt":"%s"}]\n' "$closed_at" \
  > "$STUB_DIR/closed-issues.json"
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "weekly-review within-window exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"weekly-review: skipped (within remindAfterClose)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly-review within-window reports skipped (within remindAfterClose)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly-review within-window reports skipped (within remindAfterClose)"
  echo "    actual: $out"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -f "$STUB_DIR/gh-issue-create-rest-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly-review within-window made no issue create call"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly-review within-window made no issue create call"
  echo "    gh-issue-create-rest-calls.log: $(cat "$STUB_DIR/gh-issue-create-rest-calls.log")"
fi
jit_teardown

# --- Test 3b-weekly-review: weekly-review jit (7d/14d) at the exact 7d boundary — skipped (inclusive) ---

echo "Test: dispatch-jit-engine weekly-review jit at the exact 7d boundary is skipped"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "weekly-review",
      "repo": "test-owner/test-repo",
      "label": "jit:weekly-review",
      "title": "Weekly review",
      "body": "Recurring weekly review.",
      "project": "test-project",
      "remindAfterClose": "7d",
      "dueAfterClose": "14d",
      "skill": "weekly-review-engine"
    }
  ]
}
EOF
# Newest closed issue closed exactly 7d before "now" — the inclusive
# boundary, still within the 7d window (strict `>` comparison in dispatch-jit-engine).
closed_at=$(date -u -d "@$((JIT_NOW_EPOCH - 7*86400))" +%Y-%m-%dT%H:%M:%SZ)
printf '[{"number":40,"closedAt":"%s"}]\n' "$closed_at" \
  > "$STUB_DIR/closed-issues.json"
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "weekly-review exact-7d-boundary exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"weekly-review: skipped (within remindAfterClose)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly-review exact-7d-boundary reports skipped (within remindAfterClose)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly-review exact-7d-boundary reports skipped (within remindAfterClose)"
  echo "    actual: $out"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -f "$STUB_DIR/gh-issue-create-rest-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly-review exact-7d-boundary made no issue create call"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly-review exact-7d-boundary made no issue create call"
  echo "    gh-issue-create-rest-calls.log: $(cat "$STUB_DIR/gh-issue-create-rest-calls.log")"
fi
jit_teardown

# --- Test 4: cadence past window creates an issue ----------------------------

echo "Test: dispatch-jit-engine cadence past remindAfterClose creates an issue"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "daily-chore",
      "repo": "test-owner/test-repo",
      "label": "jit:daily-chore",
      "title": "Daily chore",
      "body": "Recurring daily chore. Close when done.",
      "project": "test-project",
      "remindAfterClose": "12h",
      "dueAfterClose": "24h"
    }
  ]
}
EOF
# Newest closed issue closed 24h before "now" — past the 12h window.
closed_at=$(date -u -d "@$((JIT_NOW_EPOCH - 86400))" +%Y-%m-%dT%H:%M:%SZ)
printf '[{"number":40,"closedAt":"%s"}]\n' "$closed_at" \
  > "$STUB_DIR/closed-issues.json"
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "past-window exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
# closedAt = NOW − 24h, dueAfterClose = 24h → DUE = closedAt + 24h = NOW =
# 2026-01-01T00:00:00Z.
if [[ "$out" == *"daily-chore: created #123 (due 2026-01-01T00:00:00Z)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: past-window reports created #123 (due 2026-01-01T00:00:00Z)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: past-window reports created #123 (due 2026-01-01T00:00:00Z)"
  echo "    actual: $out"
fi
create_log=$(cat "$STUB_DIR/gh-issue-create-rest-calls.log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$create_log" == *"<!-- jit-due: 2026-01-01T00:00:00Z -->"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: past-window embedded jit-due marker in issue body"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: past-window embedded jit-due marker in issue body"
  echo "    gh-issue-create-rest-calls.log: $create_log"
fi
jit_teardown

# --- Test 4-weekly-review: weekly-review jit (7d/14d) cadence steady state ---------------

echo "Test: dispatch-jit-engine weekly-review jit past remindAfterClose creates an issue"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "weekly-review",
      "repo": "test-owner/test-repo",
      "label": "jit:weekly-review",
      "title": "Weekly review",
      "body": "Recurring weekly review.",
      "project": "test-project",
      "remindAfterClose": "7d",
      "dueAfterClose": "14d",
      "skill": "weekly-review-engine"
    }
  ]
}
EOF
# Newest closed issue closed 10d before "now" — past the 7d remind window.
closed_at=$(date -u -d "@$((JIT_NOW_EPOCH - 10*86400))" +%Y-%m-%dT%H:%M:%SZ)
printf '[{"number":40,"closedAt":"%s"}]\n' "$closed_at" \
  > "$STUB_DIR/closed-issues.json"
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "weekly-review past-window exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
# closedAt = NOW − 10d = 2025-12-22T00:00:00Z, dueAfterClose = 14d →
# DUE = closedAt + 14d = 2026-01-05T00:00:00Z.
if [[ "$out" == *"weekly-review: created #123 (due 2026-01-05T00:00:00Z)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly-review past-window reports created #123 (due 2026-01-05T00:00:00Z)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly-review past-window reports created #123 (due 2026-01-05T00:00:00Z)"
  echo "    actual: $out"
fi
create_log=$(cat "$STUB_DIR/gh-issue-create-rest-calls.log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$create_log" == *"<!-- jit-due: 2026-01-05T00:00:00Z -->"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly-review past-window embedded jit-due marker in issue body"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly-review past-window embedded jit-due marker in issue body"
  echo "    gh-issue-create-rest-calls.log: $create_log"
fi
jit_teardown

# --- Test 4b-weekly-review: weekly-review jit (7d/14d) one second past the 7d boundary — creates ---

echo "Test: dispatch-jit-engine weekly-review jit one second past the 7d boundary creates an issue"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "weekly-review",
      "repo": "test-owner/test-repo",
      "label": "jit:weekly-review",
      "title": "Weekly review",
      "body": "Recurring weekly review.",
      "project": "test-project",
      "remindAfterClose": "7d",
      "dueAfterClose": "14d",
      "skill": "weekly-review-engine"
    }
  ]
}
EOF
# Newest closed issue closed 7d + 1s before "now" — one second past the
# window → create.
closed_at=$(date -u -d "@$((JIT_NOW_EPOCH - (7*86400 + 1)))" +%Y-%m-%dT%H:%M:%SZ)
printf '[{"number":40,"closedAt":"%s"}]\n' "$closed_at" \
  > "$STUB_DIR/closed-issues.json"
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "weekly-review 7d+1s-past-boundary exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
# closedAt = NOW − (7d+1s) = 2025-12-24T23:59:59Z, dueAfterClose = 14d →
# DUE = closedAt + 14d = 2026-01-07T23:59:59Z.
if [[ "$out" == *"weekly-review: created #123 (due 2026-01-07T23:59:59Z)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly-review past-window reports created #123 (due 2026-01-07T23:59:59Z)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly-review past-window reports created #123 (due 2026-01-07T23:59:59Z)"
  echo "    actual: $out"
fi
create_log=$(cat "$STUB_DIR/gh-issue-create-rest-calls.log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$create_log" == *"<!-- jit-due: 2026-01-07T23:59:59Z -->"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly-review 7d+1s-past-boundary embedded jit-due marker in issue body"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly-review 7d+1s-past-boundary embedded jit-due marker in issue body"
  echo "    gh-issue-create-rest-calls.log: $create_log"
fi
jit_teardown

# --- Test 5: open-issue guard — skipped when an open issue exists ------------

echo "Test: dispatch-jit-engine skips when an open issue with the label exists"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "daily-chore",
      "repo": "test-owner/test-repo",
      "label": "jit:daily-chore",
      "title": "Daily chore",
      "body": "Recurring daily chore. Close when done.",
      "project": "test-project",
      "remindAfterClose": "12h"
    }
  ]
}
EOF
echo '[{"number":50}]' > "$STUB_DIR/open-issues.json"
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "open-guard exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"daily-chore: skipped (open issue exists)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: open-guard reports skipped (open issue exists)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: open-guard reports skipped (open issue exists)"
  echo "    actual: $out"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -f "$STUB_DIR/gh-issue-create-rest-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: open-guard made no issue create call"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: open-guard made no issue create call"
  echo "    gh-issue-create-rest-calls.log: $(cat "$STUB_DIR/gh-issue-create-rest-calls.log")"
fi
jit_teardown

# --- Test 5-weekly-review: weekly-review jit (7d/14d) open-issue guard — skipped when an open issue exists ---

echo "Test: dispatch-jit-engine weekly-review jit skips when an open issue with the label exists"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "weekly-review",
      "repo": "test-owner/test-repo",
      "label": "jit:weekly-review",
      "title": "Weekly review",
      "body": "Recurring weekly review.",
      "project": "test-project",
      "remindAfterClose": "7d",
      "dueAfterClose": "14d",
      "skill": "weekly-review-engine"
    }
  ]
}
EOF
echo '[{"number":50}]' > "$STUB_DIR/open-issues.json"
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "weekly-review open-guard exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"weekly-review: skipped (open issue exists)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly-review open-guard reports skipped (open issue exists)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly-review open-guard reports skipped (open issue exists)"
  echo "    actual: $out"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -f "$STUB_DIR/gh-issue-create-rest-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly-review open-guard made no issue create call"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly-review open-guard made no issue create call"
  echo "    gh-issue-create-rest-calls.log: $(cat "$STUB_DIR/gh-issue-create-rest-calls.log")"
fi
jit_teardown

# --- Test 6: check-script jit fires — creates an issue -----------------------

echo "Test: dispatch-jit-engine check-script jit creates an issue when it fires"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "email-review",
      "repo": "test-owner/test-repo",
      "label": "jit:email-review",
      "title": "Review the inbox",
      "body": "The inbox needs attention.",
      "project": "test-project",
      "check": { "script": "mock-check" },
      "dueAfterCreate": "24h"
    }
  ]
}
EOF
# A check script whose exit code is controlled by MOCK_CHECK_RC.
cat > "$TMPDIR_TEST/checkdir/mock-check" <<'CHK'
#!/usr/bin/env bash
exit "${MOCK_CHECK_RC:-0}"
CHK
chmod +x "$TMPDIR_TEST/checkdir/mock-check"
rc=0
out=$(MOCK_CHECK_RC=0 "$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) \
  || rc=$?
assert_eq "check-fire exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
# Check-script jit, dueAfterCreate = 24h, NOW = 2026-01-01T00:00:00Z →
# DUE = NOW + 24h = 2026-01-02T00:00:00Z.
if [[ "$out" == *"email-review: created #123 (due 2026-01-02T00:00:00Z)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: check-fire reports created #123 (due 2026-01-02T00:00:00Z)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: check-fire reports created #123 (due 2026-01-02T00:00:00Z)"
  echo "    actual: $out"
fi
create_log=$(cat "$STUB_DIR/gh-issue-create-rest-calls.log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$create_log" == *"<!-- jit-due: 2026-01-02T00:00:00Z -->"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: check-fire embedded jit-due marker in issue body"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: check-fire embedded jit-due marker in issue body"
  echo "    gh-issue-create-rest-calls.log: $create_log"
fi
jit_teardown

# --- Test 7: check-script jit does not fire — skipped ------------------------

echo "Test: dispatch-jit-engine check-script jit is skipped when it does not fire"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "email-review",
      "repo": "test-owner/test-repo",
      "label": "jit:email-review",
      "title": "Review the inbox",
      "body": "The inbox needs attention.",
      "project": "test-project",
      "check": { "script": "mock-check" }
    }
  ]
}
EOF
cat > "$TMPDIR_TEST/checkdir/mock-check" <<'CHK'
#!/usr/bin/env bash
exit "${MOCK_CHECK_RC:-0}"
CHK
chmod +x "$TMPDIR_TEST/checkdir/mock-check"
rc=0
out=$(MOCK_CHECK_RC=1 "$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) \
  || rc=$?
assert_eq "check-no-fire exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"email-review: skipped (check did not fire)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: check-no-fire reports skipped (check did not fire)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: check-no-fire reports skipped (check did not fire)"
  echo "    actual: $out"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -f "$STUB_DIR/gh-issue-create-rest-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: check-no-fire made no issue create call"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: check-no-fire made no issue create call"
  echo "    gh-issue-create-rest-calls.log: $(cat "$STUB_DIR/gh-issue-create-rest-calls.log")"
fi
jit_teardown

# --- Test 8: debounce active — skipped with zero gh calls --------------------

echo "Test: dispatch-jit-engine debounce active skips with no gh call"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "daily-chore",
      "repo": "test-owner/test-repo",
      "label": "jit:daily-chore",
      "title": "Daily chore",
      "body": "Recurring daily chore. Close when done.",
      "project": "test-project",
      "remindAfterClose": "12h",
      "debounce": "1h"
    }
  ]
}
EOF
# Pre-seed the state file: last check 5 minutes ago — within the 1h debounce.
printf '{"daily-chore": %s}\n' "$((JIT_NOW_EPOCH - 300))" \
  > "$TMPDIR_TEST/state/dispatch-jit-state.json"
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "debounce-active exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"daily-chore: debounced"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: debounce-active reports debounced"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: debounce-active reports debounced"
  echo "    actual: $out"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -s "$STUB_DIR/gh-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: debounce-active made zero gh calls"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: debounce-active made zero gh calls"
  echo "    gh-calls.log: $(cat "$STUB_DIR/gh-calls.log")"
fi
jit_teardown

# --- Test 9: debounce elapsed — the check runs -------------------------------

echo "Test: dispatch-jit-engine runs the check once the debounce window elapsed"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "daily-chore",
      "repo": "test-owner/test-repo",
      "label": "jit:daily-chore",
      "title": "Daily chore",
      "body": "Recurring daily chore. Close when done.",
      "project": "test-project",
      "remindAfterClose": "12h",
      "debounce": "1h"
    }
  ]
}
EOF
# Pre-seed the state file: last check 2h ago — past the 1h debounce window.
printf '{"daily-chore": %s}\n' "$((JIT_NOW_EPOCH - 7200))" \
  > "$TMPDIR_TEST/state/dispatch-jit-state.json"
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "debounce-elapsed exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" != *"debounced"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: debounce-elapsed did not report debounced"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: debounce-elapsed did not report debounced"
  echo "    actual: $out"
fi
TOTAL=$((TOTAL + 1))
if [[ -s "$STUB_DIR/gh-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: debounce-elapsed ran the check (gh was called)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: debounce-elapsed ran the check (gh was called)"
fi
jit_teardown

# --- Test 10: idempotency — a second run does not re-create the issue --------

echo "Test: dispatch-jit-engine is idempotent — a second run skips the open issue"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "daily-chore",
      "repo": "test-owner/test-repo",
      "label": "jit:daily-chore",
      "title": "Daily chore",
      "body": "Recurring daily chore. Close when done.",
      "project": "test-project",
      "remindAfterClose": "12h",
      "dueAfterClose": "24h"
    }
  ]
}
EOF
# Run 1: cold start (open/closed both "[]") — creates #123.
rc=0
out1=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "idempotency run 1 exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out1" == *"daily-chore: created #123 (due 2026-01-01T12:00:00Z)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: idempotency run 1 created #123 (due 2026-01-01T12:00:00Z)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: idempotency run 1 created #123 (due 2026-01-01T12:00:00Z)"
  echo "    actual: $out1"
fi
# Run 1 stamped the state file with a numeric timestamp for the jit key.
TOTAL=$((TOTAL + 1))
if jq -e '.["daily-chore"] | type == "number"' \
   "$TMPDIR_TEST/state/dispatch-jit-state.json" >/dev/null 2>&1; then
  PASS=$((PASS + 1)); echo "  PASS: run 1 stamped a numeric state timestamp"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: run 1 stamped a numeric state timestamp"
  echo "    state file: $(cat "$TMPDIR_TEST/state/dispatch-jit-state.json" 2>&1)"
fi
# The created issue is now open; record the call-log line count before run 2.
echo '[{"number":123}]' > "$STUB_DIR/open-issues.json"
calls_before=$(wc -l < "$STUB_DIR/gh-calls.log")
creates_before=0
[[ -f "$STUB_DIR/gh-issue-create-rest-calls.log" ]] \
  && creates_before=$(wc -l < "$STUB_DIR/gh-issue-create-rest-calls.log")
# Run 2: the open-issue guard fires — skipped, no second create.
rc=0
out2=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "idempotency run 2 exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out2" == *"daily-chore: skipped (open issue exists)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: idempotency run 2 skipped (open issue exists)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: idempotency run 2 skipped (open issue exists)"
  echo "    actual: $out2"
fi
creates_after=0
[[ -f "$STUB_DIR/gh-issue-create-rest-calls.log" ]] \
  && creates_after=$(wc -l < "$STUB_DIR/gh-issue-create-rest-calls.log")
assert_eq "idempotency run 2 made no second issue create" \
  "$creates_before" "$creates_after"
jit_teardown

# --- Test 11: cadence jit with no dueAfter* → no marker in body --------------

echo "Test: dispatch-jit-engine with no dueAfter* embeds no jit-due marker"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "daily-chore",
      "repo": "test-owner/test-repo",
      "label": "jit:daily-chore",
      "title": "Daily chore",
      "body": "Recurring daily chore. Close when done.",
      "project": "test-project",
      "remindAfterClose": "12h"
    }
  ]
}
EOF
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "no-dueAfter exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"daily-chore: created #123 (no dueAfter*; due not stamped)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: no-dueAfter reports created #123 (no dueAfter*; due not stamped)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: no-dueAfter reports created #123 (no dueAfter*; due not stamped)"
  echo "    actual: $out"
fi
create_log=$(cat "$STUB_DIR/gh-issue-create-rest-calls.log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$create_log" != *"jit-due"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: no-dueAfter embedded no jit-due marker in issue body"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: no-dueAfter embedded no jit-due marker in issue body"
  echo "    gh-issue-create-rest-calls.log: $create_log"
fi
jit_teardown

# --- Test 12: cadence jit with dueAfterCreate → cross-key validation error ---
# A cadence jit must use dueAfterClose; supplying dueAfterCreate is a config
# mistake the engine rejects (HARD_ERROR → exit 1) before creating any issue.

echo "Test: dispatch-jit-engine cadence jit with dueAfterCreate is rejected"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "daily-chore",
      "repo": "test-owner/test-repo",
      "label": "jit:daily-chore",
      "title": "Daily chore",
      "body": "Recurring daily chore. Close when done.",
      "project": "test-project",
      "remindAfterClose": "12h",
      "dueAfterCreate": "24h"
    }
  ]
}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>&1 >/dev/null) || rc=$?
assert_eq "cadence+dueAfterCreate exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"cadence jit must use dueAfterClose, not dueAfterCreate"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: cadence+dueAfterCreate reports the cross-key error"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: cadence+dueAfterCreate reports the cross-key error"
  echo "    stderr: $err"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -f "$STUB_DIR/gh-issue-create-rest-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: cadence+dueAfterCreate created no issue"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: cadence+dueAfterCreate created no issue"
  echo "    gh-issue-create-rest-calls.log: $(cat "$STUB_DIR/gh-issue-create-rest-calls.log")"
fi
jit_teardown

# --- Test 13: check-script jit with dueAfterClose → cross-key validation err -
# A check-script jit must use dueAfterCreate; supplying dueAfterClose is a
# config mistake the engine rejects (HARD_ERROR → exit 1) before creating any
# issue, even though the check itself fired.

echo "Test: dispatch-jit-engine check-script jit with dueAfterClose is rejected"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "email-review",
      "repo": "test-owner/test-repo",
      "label": "jit:email-review",
      "title": "Review the inbox",
      "body": "The inbox needs attention.",
      "project": "test-project",
      "check": { "script": "mock-check" },
      "dueAfterClose": "24h"
    }
  ]
}
EOF
cat > "$TMPDIR_TEST/checkdir/mock-check" <<'CHK'
#!/usr/bin/env bash
exit "${MOCK_CHECK_RC:-0}"
CHK
chmod +x "$TMPDIR_TEST/checkdir/mock-check"
rc=0
err=$(MOCK_CHECK_RC=0 "$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>&1 >/dev/null) || rc=$?
assert_eq "check+dueAfterClose exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"check-script jit must use dueAfterCreate, not dueAfterClose"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: check+dueAfterClose reports the cross-key error"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: check+dueAfterClose reports the cross-key error"
  echo "    stderr: $err"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -f "$STUB_DIR/gh-issue-create-rest-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: check+dueAfterClose created no issue"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: check+dueAfterClose created no issue"
  echo "    gh-issue-create-rest-calls.log: $(cat "$STUB_DIR/gh-issue-create-rest-calls.log")"
fi
jit_teardown

# <<< END MOVED <<<

report_results
