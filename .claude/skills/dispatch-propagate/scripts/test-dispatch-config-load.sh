#!/usr/bin/env bash
# Tests for dispatch-config-load -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 8935-10231.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-config-load tests
# ============================================================================
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/scripts/   a copy of dispatch-config-load
#   $TMPDIR_TEST/config/    synthetic config directory (DISPATCH_CONFIG_DIR)
#
# DISPATCH_CONFIG_DIR is exported so the script never touches the real
# dispatch.config/ directory and does not require a git repo.

config_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/config"

  cp "$SCRIPT_DIR/dispatch-config-load" "$TMPDIR_TEST/scripts/dispatch-config-load"
  # dispatch-config-load sources lib.sh via its SCRIPT_DIR — so lib.sh must sit
  # alongside it. Sourced, not executed — no chmod +x.
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/lib.sh"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-config-load"

  export DISPATCH_CONFIG_DIR="$TMPDIR_TEST/config"
}

config_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  unset DISPATCH_CONFIG_DIR
}

# --- Test 1: valid projects.json prints normalized JSON ----------------------

echo "Test: valid projects.json prints normalized JSON"
config_setup
cat > "$DISPATCH_CONFIG_DIR/projects.json" <<'EOF'
{
  "projects": [
    {
      "key": "test-project",
      "owner": "test-owner",
      "number": 42,
      "statusField": "Status",
      "statusInProgress": "In Progress",
      "statusDone": "Done"
    }
  ]
}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" projects 2>/dev/null); rc=$?
assert_eq "valid projects.json exits 0" "0" "$rc"
key=$(printf '%s' "$out" | jq -r '.projects[0].key')
assert_eq "valid projects.json key" "test-project" "$key"
owner=$(printf '%s' "$out" | jq -r '.projects[0].owner')
assert_eq "valid projects.json owner" "test-owner" "$owner"
config_teardown

# --- Test 2: valid jit.json prints normalized JSON ---------------------------

echo "Test: valid jit.json prints normalized JSON"
config_setup
cat > "$DISPATCH_CONFIG_DIR/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "test-chore",
      "repo": "test-owner/test-repo",
      "label": "jit:test-chore",
      "title": "Test recurring chore",
      "body": "Test chore body.",
      "project": "test-project",
      "remindAfterClose": "12h",
      "dueAfterClose": "24h",
      "debounce": "1h"
    }
  ]
}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" jit 2>/dev/null); rc=$?
assert_eq "valid jit.json exits 0" "0" "$rc"
jit_key=$(printf '%s' "$out" | jq -r '.jits[0].key')
assert_eq "valid jit.json key" "test-chore" "$jit_key"
jit_label=$(printf '%s' "$out" | jq -r '.jits[0].label')
assert_eq "valid jit.json label" "jit:test-chore" "$jit_label"
config_teardown

# --- Test 2a: jit.json with a string skill field validates -------------------

echo "Test: jit.json with a string skill field validates"
config_setup
cat > "$DISPATCH_CONFIG_DIR/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "digest",
      "repo": "test-owner/test-repo",
      "label": "jit:digest",
      "title": "Digest",
      "body": "Recurring digest checkpoint.",
      "project": "test-project",
      "remindAfterClose": "24h",
      "dueAfterClose": "48h",
      "debounce": "1h",
      "skill": "digest"
    }
  ]
}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" jit 2>/dev/null); rc=$?
assert_eq "jit.json string skill exits 0" "0" "$rc"
skill=$(printf '%s' "$out" | jq -r '.jits[0].skill')
assert_eq "jit.json string skill value" "digest" "$skill"
config_teardown

# --- Test 2b: jit.json with a non-string skill field is rejected -------------

echo "Test: jit.json with a non-string skill field is rejected"
config_setup
cat > "$DISPATCH_CONFIG_DIR/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "digest",
      "repo": "test-owner/test-repo",
      "label": "jit:digest",
      "title": "Digest",
      "body": "Recurring digest checkpoint.",
      "project": "test-project",
      "skill": 123
    }
  ]
}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" jit 2>&1 1>/dev/null) || rc=$?
assert_eq "jit.json non-string skill exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"must be a string if present"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-string skill stderr mentions 'must be a string if present'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-string skill stderr mentions 'must be a string if present'"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 2c: jit.json with a malformed (non-slug) skill field is rejected ---

echo "Test: jit.json with a malformed (non-slug) skill field is rejected"
config_setup
cat > "$DISPATCH_CONFIG_DIR/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "digest",
      "repo": "test-owner/test-repo",
      "label": "jit:digest",
      "title": "Digest",
      "body": "Recurring digest checkpoint.",
      "project": "test-project",
      "skill": "Digest; rm -rf /"
    }
  ]
}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" jit 2>&1 1>/dev/null) || rc=$?
assert_eq "jit.json malformed skill exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"must be a lowercase skill-name slug"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: malformed skill stderr mentions 'must be a lowercase skill-name slug'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: malformed skill stderr mentions 'must be a lowercase skill-name slug'"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 2d: weekly-review jit (7d/14d, skill: weekly-review-engine) validates ------------

echo "Test: weekly-review jit (7d/14d, skill: weekly-review-engine) validates"
config_setup
cat > "$DISPATCH_CONFIG_DIR/jit.json" <<'EOF'
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
      "debounce": "1h",
      "skill": "weekly-review-engine"
    }
  ]
}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" jit 2>/dev/null); rc=$?
assert_eq "weekly-review jit exits 0" "0" "$rc"
weekly_review_skill=$(printf '%s' "$out" | jq -r '.jits[0].skill')
assert_eq "weekly-review jit skill value" "weekly-review-engine" "$weekly_review_skill"
weekly_review_remind=$(printf '%s' "$out" | jq -r '.jits[0].remindAfterClose')
assert_eq "weekly-review jit remindAfterClose value" "7d" "$weekly_review_remind"
weekly_review_due=$(printf '%s' "$out" | jq -r '.jits[0].dueAfterClose')
assert_eq "weekly-review jit dueAfterClose value" "14d" "$weekly_review_due"
config_teardown

# --- Test 3: absent file prints no-config and exits 0 ------------------------

echo "Test: absent file prints no-config and exits 0"
config_setup
# no file written — config dir is empty
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" projects 2>/dev/null); rc=$?
assert_eq "absent file exits 0" "0" "$rc"
assert_eq "absent file prints no-config" "no-config" "$out"
config_teardown

# --- Test 4: invalid JSON exits 1 with an error ------------------------------

echo "Test: invalid JSON exits 1 and stderr mentions the cause"
config_setup
printf 'not valid json {{{' > "$DISPATCH_CONFIG_DIR/projects.json"
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" projects 2>&1 1>/dev/null) || rc=$?
assert_eq "invalid JSON exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"invalid JSON"* || "$err" == *"parse error"* || "$err" == *"Invalid"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: invalid JSON stderr mentions the cause"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: invalid JSON stderr mentions the cause"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 5: missing required field exits 1 and names the field --------------

echo "Test: missing required field exits 1 and stderr names the field"
config_setup
cat > "$DISPATCH_CONFIG_DIR/projects.json" <<'EOF'
{
  "projects": [
    {
      "key": "test-project",
      "owner": "test-owner",
      "number": 1,
      "statusInProgress": "In Progress",
      "statusDone": "Done"
    }
  ]
}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" projects 2>&1 1>/dev/null) || rc=$?
assert_eq "missing required field exits 1" "1" "$rc"
if [[ "$err" == *"statusField"* ]]; then
  assert_eq "missing-field error names the field" "yes" "yes"
else
  assert_eq "missing-field error names the field" "yes" "no: $err"
fi
config_teardown

# --- Test 6: top-level array exits 1 with a clear error ----------------------

echo "Test: top-level array exits 1 and stderr reports a clear error"
config_setup
printf '[1,2,3]' > "$DISPATCH_CONFIG_DIR/projects.json"
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" projects 2>&1 1>/dev/null) || rc=$?
assert_eq "top-level array exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"error:"* && "$err" == *"projects.json"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: top-level array stderr has clear error: $err"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: top-level array stderr has clear error"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 7: empty config file exits 1 with a clear error --------------------

echo "Test: empty config file exits 1 and stderr reports a clear error"
config_setup
printf '' > "$DISPATCH_CONFIG_DIR/projects.json"
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" projects 2>&1 1>/dev/null) || rc=$?
assert_eq "empty file exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"error:"* && "$err" == *"projects.json"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: empty file stderr has clear error: $err"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: empty file stderr has clear error"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 7b: valid statements.json round-trips ------------------------------

echo "Test: valid statements.json prints normalized JSON"
config_setup
cat > "$DISPATCH_CONFIG_DIR/statements.json" <<'EOF'
{
  "statements": [
    {
      "key": "mybank",
      "dir": "/home/user/statements/mybank",
      "repo": "test-owner/test-repo",
      "label": "statements:mybank",
      "project": "test-project",
      "debounce": "1h",
      "extensions": ["qfx","csv"]
    }
  ]
}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" statements 2>/dev/null); rc=$?
assert_eq "valid statements.json exits 0" "0" "$rc"
stmt_key=$(printf '%s' "$out" | jq -r '.statements[0].key')
assert_eq "valid statements.json key" "mybank" "$stmt_key"
stmt_dir=$(printf '%s' "$out" | jq -r '.statements[0].dir')
assert_eq "valid statements.json dir" "/home/user/statements/mybank" "$stmt_dir"
config_teardown

# --- Test 7c: statements.json missing required field exits 1 -----------------

echo "Test: statements.json missing required field exits 1 and stderr names the field"
config_setup
cat > "$DISPATCH_CONFIG_DIR/statements.json" <<'EOF'
{
  "statements": [
    {
      "key": "mybank",
      "repo": "test-owner/test-repo",
      "label": "statements:mybank",
      "project": "test-project"
    }
  ]
}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" statements 2>&1 1>/dev/null) || rc=$?
assert_eq "missing dir field exits 1" "1" "$rc"
if [[ "$err" == *"dir"* ]]; then
  assert_eq "missing-dir error names the field" "yes" "yes"
else
  assert_eq "missing-dir error names the field" "yes" "no: $err"
fi
config_teardown

# --- Test 7d: statements.json extensions non-array exits 1 -------------------

echo "Test: statements.json with extensions as string exits 1 and stderr mentions extensions"
config_setup
cat > "$DISPATCH_CONFIG_DIR/statements.json" <<'EOF'
{
  "statements": [
    {
      "key": "mybank",
      "dir": "/home/user/statements/mybank",
      "repo": "test-owner/test-repo",
      "label": "statements:mybank",
      "project": "test-project",
      "extensions": "qfx"
    }
  ]
}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" statements 2>&1 1>/dev/null) || rc=$?
assert_eq "extensions non-array exits 1" "1" "$rc"
if [[ "$err" == *"extensions"* ]]; then
  assert_eq "extensions non-array stderr mentions extensions" "yes" "yes"
else
  assert_eq "extensions non-array stderr mentions extensions" "yes" "no: $err"
fi
config_teardown

# --- Test 7e: absent statements.json prints no-config and exits 0 ------------

echo "Test: absent statements.json prints no-config and exits 0"
config_setup
# no file written — config dir is empty
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" statements 2>/dev/null); rc=$?
assert_eq "absent statements.json exits 0" "0" "$rc"
assert_eq "absent statements.json prints no-config" "no-config" "$out"
config_teardown

# --- Test 7f: statements.json with valid string snapshot passes ---------------

echo "Test: statements.json with string snapshot exits 0"
config_setup
cat > "$DISPATCH_CONFIG_DIR/statements.json" <<'EOF'
{
  "statements": [
    {
      "key": "mybank",
      "dir": "/home/user/statements/mybank",
      "repo": "test-owner/test-repo",
      "label": "statements:mybank",
      "project": "test-project",
      "snapshot": "/home/user/statements/mybank/budget.benc"
    }
  ]
}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" statements 2>/dev/null); rc=$?
assert_eq "snapshot string exits 0" "0" "$rc"
stmt_snapshot=$(printf '%s' "$out" | jq -r '.statements[0].snapshot')
assert_eq "snapshot value round-trips" "/home/user/statements/mybank/budget.benc" "$stmt_snapshot"
config_teardown

# --- Test 7g: statements.json with non-string snapshot exits 1 ---------------

echo "Test: statements.json with non-string snapshot exits 1 and stderr mentions snapshot"
config_setup
cat > "$DISPATCH_CONFIG_DIR/statements.json" <<'EOF'
{
  "statements": [
    {
      "key": "mybank",
      "dir": "/home/user/statements/mybank",
      "repo": "test-owner/test-repo",
      "label": "statements:mybank",
      "project": "test-project",
      "snapshot": 42
    }
  ]
}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" statements 2>&1 1>/dev/null) || rc=$?
assert_eq "snapshot non-string exits 1" "1" "$rc"
if [[ "$err" == *"snapshot"* ]]; then
  assert_eq "snapshot non-string stderr mentions snapshot" "yes" "yes"
else
  assert_eq "snapshot non-string stderr mentions snapshot" "yes" "no: $err"
fi
config_teardown

# --- Test 7h: statements.json without snapshot field is still valid -----------

echo "Test: statements.json without snapshot field exits 0 (back-compat)"
config_setup
cat > "$DISPATCH_CONFIG_DIR/statements.json" <<'EOF'
{
  "statements": [
    {
      "key": "mybank",
      "dir": "/home/user/statements/mybank",
      "repo": "test-owner/test-repo",
      "label": "statements:mybank",
      "project": "test-project"
    }
  ]
}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" statements 2>/dev/null); rc=$?
assert_eq "absent snapshot exits 0" "0" "$rc"
stmt_key=$(printf '%s' "$out" | jq -r '.statements[0].key')
assert_eq "absent snapshot key round-trips" "mybank" "$stmt_key"
config_teardown

# --- Test 7i: absent epic.json prints no-config and exits 0 ------------------

echo "Test: absent epic.json prints no-config and exits 0"
config_setup
# no file written — config dir is empty
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" epic 2>/dev/null); rc=$?
assert_eq "absent epic.json exits 0" "0" "$rc"
assert_eq "absent epic.json prints no-config" "no-config" "$out"
config_teardown

# --- Test 7j: valid epic.json round-trips ------------------------------------

echo "Test: valid epic.json prints normalized JSON"
config_setup
cat > "$DISPATCH_CONFIG_DIR/epic.json" <<'EOF'
{
  "labels": ["epic","tracking-epic"]
}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" epic 2>/dev/null); rc=$?
assert_eq "valid epic.json exits 0" "0" "$rc"
epic_label=$(printf '%s' "$out" | jq -r '.labels[0]')
assert_eq "valid epic.json labels[0]" "epic" "$epic_label"
config_teardown

# --- Test 7k: epic.json where .labels is not an array exits 1 ----------------

echo "Test: epic.json with labels as string exits 1 and stderr mentions labels"
config_setup
cat > "$DISPATCH_CONFIG_DIR/epic.json" <<'EOF'
{
  "labels": "epic"
}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" epic 2>&1 1>/dev/null) || rc=$?
assert_eq "labels non-array exits 1" "1" "$rc"
if [[ "$err" == *"labels"* ]]; then
  assert_eq "labels non-array stderr mentions labels" "yes" "yes"
else
  assert_eq "labels non-array stderr mentions labels" "yes" "no: $err"
fi
config_teardown

# --- Test 7l: epic.json with a non-string element exits 1 --------------------

echo "Test: epic.json with non-string label element exits 1 and stderr mentions labels"
config_setup
cat > "$DISPATCH_CONFIG_DIR/epic.json" <<'EOF'
{
  "labels": ["epic", 42]
}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" epic 2>&1 1>/dev/null) || rc=$?
assert_eq "labels non-string element exits 1" "1" "$rc"
if [[ "$err" == *"labels"* ]]; then
  assert_eq "labels non-string element stderr mentions labels" "yes" "yes"
else
  assert_eq "labels non-string element stderr mentions labels" "yes" "no: $err"
fi
config_teardown

# --- Test 8: valid target-workers.json prints normalized JSON ---------------

echo "Test: valid target-workers.json prints normalized JSON"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{
  "weekly_pace_floor_pct": 60,
  "weekly_increment_cap_pct": 8,
  "weekly_terminal_windows": 2,
  "five_hour_target_floor_pct": 55,
  "weekly_curve_power": 2
}
EOF
# shoulder = 100 - 8*2 = 84 >= 60, admissible
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>/dev/null); rc=$?
assert_eq "valid target-workers.json exits 0" "0" "$rc"
tw_floor=$(printf '%s' "$out" | jq -r '.weekly_pace_floor_pct')
assert_eq "valid target-workers.json weekly_pace_floor_pct" "60" "$tw_floor"
tw_cap=$(printf '%s' "$out" | jq -r '.weekly_increment_cap_pct')
assert_eq "valid target-workers.json weekly_increment_cap_pct" "8" "$tw_cap"
tw_windows=$(printf '%s' "$out" | jq -r '.weekly_terminal_windows')
assert_eq "valid target-workers.json weekly_terminal_windows" "2" "$tw_windows"
tw_power=$(printf '%s' "$out" | jq -r '.weekly_curve_power')
assert_eq "valid target-workers.json weekly_curve_power" "2" "$tw_power"
config_teardown

# --- Test 9: absent target-workers.json prints no-config and exits 0 --------

echo "Test: absent target-workers.json prints no-config and exits 0"
config_setup
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>/dev/null); rc=$?
assert_eq "absent target-workers.json exits 0" "0" "$rc"
assert_eq "absent target-workers.json prints no-config" "no-config" "$out"
config_teardown

# --- Test 10: target-workers.json with a non-number field exits 1 -----------

echo "Test: target-workers.json with non-number field exits 1 and stderr names it"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"weekly_pace_floor_pct": "fifty"}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>&1 1>/dev/null) || rc=$?
assert_eq "non-number tunable exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"weekly_pace_floor_pct"* && "$err" == *"number"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-number tunable stderr names the field and type"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-number tunable stderr names the field and type"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 11: empty object is accepted (every tunable is optional) ----------

echo "Test: empty object target-workers.json is accepted"
config_setup
echo '{}' > "$DISPATCH_CONFIG_DIR/target-workers.json"
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>/dev/null); rc=$?
assert_eq "empty object exits 0" "0" "$rc"
# jq normalizes "{}" to "{}".
out_compact=$(printf '%s' "$out" | jq -c '.')
assert_eq "empty object prints {}" "{}" "$out_compact"
config_teardown

# --- Test 12: five_hour_target_floor_pct: 0 is rejected (must be > 0) --------

echo "Test: five_hour_target_floor_pct: 0 exits 1 and stderr says must be > 0"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"five_hour_target_floor_pct": 0}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>&1 1>/dev/null) || rc=$?
assert_eq "five_hour_target_floor_pct 0 exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"five_hour_target_floor_pct"* && "$err" == *"must be > 0"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: five_hour_target_floor_pct 0 stderr says must be > 0"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: five_hour_target_floor_pct 0 stderr says must be > 0"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 12b: five_hour_target_ceiling_pct: 101 rejected (must be <= 100) ---

echo "Test: five_hour_target_ceiling_pct: 101 exits 1 and stderr says must be <= 100"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"five_hour_target_ceiling_pct": 101}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>&1 1>/dev/null) || rc=$?
assert_eq "five_hour_target_ceiling_pct 101 exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"five_hour_target_ceiling_pct"* && "$err" == *"<= 100"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: five_hour_target_ceiling_pct 101 stderr says <= 100"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: five_hour_target_ceiling_pct 101 stderr says <= 100"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 12c: weekly_curve_power: 200 accepted (no upper bound) ------------

echo "Test: weekly_curve_power: 200 accepted (unbounded above)"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"weekly_curve_power": 200}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>/dev/null); rc=$?
assert_eq "weekly_curve_power 200 exits 0 (no upper bound)" "0" "$rc"
tw_power=$(printf '%s' "$out" | jq -r '.weekly_curve_power')
assert_eq "weekly_curve_power 200 preserved" "200" "$tw_power"
config_teardown

# --- Test 12d: weekly_curve_power: 0 rejected (must be > 0) -----------------

echo "Test: weekly_curve_power: 0 exits 1 and stderr says must be > 0"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"weekly_curve_power": 0}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>&1 1>/dev/null) || rc=$?
assert_eq "weekly_curve_power 0 exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"weekly_curve_power"* && "$err" == *"must be > 0"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly_curve_power 0 stderr says must be > 0"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly_curve_power 0 stderr says must be > 0"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 13: max_concurrent_workers: -1 is rejected (must be > 0) -----------

echo "Test: max_concurrent_workers: -1 exits 1 and stderr says must be > 0"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"max_concurrent_workers": -1}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>&1 1>/dev/null) || rc=$?
assert_eq "max_concurrent_workers -1 exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"max_concurrent_workers"* && "$err" == *"must be > 0"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: max_concurrent_workers -1 stderr says must be > 0"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: max_concurrent_workers -1 stderr says must be > 0"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 13b: max_concurrent_workers: 200 accepted (no upper bound) --------

echo "Test: max_concurrent_workers: 200 accepted (unbounded above)"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"max_concurrent_workers": 200}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>/dev/null); rc=$?
assert_eq "max_concurrent_workers 200 exits 0 (no upper bound)" "0" "$rc"
config_teardown

# --- Test 13c: anchor-ordering rejection (floor > derived shoulder) ----------

echo "Test: weekly_pace_floor_pct: 85 exits 1 (shoulder defaults to 80 < 85)"
config_setup
echo '{"weekly_pace_floor_pct": 85}' > "$DISPATCH_CONFIG_DIR/target-workers.json"
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>&1 1>/dev/null) || rc=$?
assert_eq "floor 85 > shoulder 80 exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"weekly_pace_floor_pct"* && "$err" == *"shoulder"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: floor > shoulder stderr names field and shoulder"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: floor > shoulder stderr names field and shoulder"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 13d: anchor-ordering boundary accept (floor == shoulder) -----------

echo "Test: weekly_pace_floor_pct: 80 exits 0 (floor == shoulder 80, boundary accepted)"
config_setup
echo '{"weekly_pace_floor_pct": 80}' > "$DISPATCH_CONFIG_DIR/target-workers.json"
# shoulder = 100 - 10*2 = 80; floor 80 is NOT > shoulder 80, so accepted
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>/dev/null); rc=$?
assert_eq "floor == shoulder exits 0" "0" "$rc"
config_teardown

# --- Test 13e: five_hour_target_floor_pct > ceiling rejected (cross-field) ---

echo "Test: five_hour_target_floor_pct > five_hour_target_ceiling_pct exits 1"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"five_hour_target_floor_pct": 80, "five_hour_target_ceiling_pct": 50}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>&1 1>/dev/null) || rc=$?
assert_eq "floor5 > ceil5 exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"five_hour_target_floor_pct"* && "$err" == *"<= five_hour_target_ceiling_pct"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: floor5 > ceil5 stderr names the ordering rule"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: floor5 > ceil5 stderr names the ordering rule"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 13f: weekly_terminal_pct: 100 accepted and round-trips -------------

echo "Test: weekly_terminal_pct: 100 accepted and round-trips"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"weekly_terminal_pct": 100}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>/dev/null); rc=$?
assert_eq "weekly_terminal_pct 100 exits 0" "0" "$rc"
tw_terminal=$(printf '%s' "$out" | jq -r '.weekly_terminal_pct')
assert_eq "weekly_terminal_pct 100 round-trips" "100" "$tw_terminal"
config_teardown

# --- Test 13g: weekly_terminal_pct: 150 rejected (must be <= 100) ------------

echo "Test: weekly_terminal_pct: 150 exits 1 and stderr says must be <= 100"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"weekly_terminal_pct": 150}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>&1 1>/dev/null) || rc=$?
assert_eq "weekly_terminal_pct 150 exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"weekly_terminal_pct"* && "$err" == *"<= 100"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly_terminal_pct 150 stderr says <= 100"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly_terminal_pct 150 stderr says <= 100"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 13h: weekly_terminal_pct: 0 rejected (must be > 0) ----------------

echo "Test: weekly_terminal_pct: 0 exits 1 and stderr says must be > 0"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"weekly_terminal_pct": 0}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>&1 1>/dev/null) || rc=$?
assert_eq "weekly_terminal_pct 0 exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"weekly_terminal_pct"* && "$err" == *"must be > 0"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly_terminal_pct 0 stderr says must be > 0"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly_terminal_pct 0 stderr says must be > 0"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 13i: exhaustion_threshold_pct: valid round-trip -------------------

echo "Test: exhaustion_threshold_pct: 95 accepted and round-trips"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"exhaustion_threshold_pct": 95}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>/dev/null); rc=$?
assert_eq "exhaustion_threshold_pct 95 exits 0" "0" "$rc"
tw_exh=$(printf '%s' "$out" | jq -r '.exhaustion_threshold_pct')
assert_eq "exhaustion_threshold_pct 95 preserved" "95" "$tw_exh"
config_teardown

# --- Test 13j: exhaustion_threshold_pct: 101 rejected (must be <= 100) -------

echo "Test: exhaustion_threshold_pct: 101 exits 1 and stderr says must be <= 100"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"exhaustion_threshold_pct": 101}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>&1 1>/dev/null) || rc=$?
assert_eq "exhaustion_threshold_pct 101 exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"exhaustion_threshold_pct"* && "$err" == *"<= 100"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: exhaustion_threshold_pct 101 stderr says <= 100"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: exhaustion_threshold_pct 101 stderr says <= 100"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 13k: weekly_terminal_windows: 0.5 rejected (fractional, must be >= 1) ---

echo "Test: weekly_terminal_windows: 0.5 exits 1 and stderr names field and >= 1"
config_setup
echo '{"weekly_terminal_windows": 0.5}' > "$DISPATCH_CONFIG_DIR/target-workers.json"
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>&1 1>/dev/null) || rc=$?
assert_eq "weekly_terminal_windows 0.5 exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"weekly_terminal_windows"* && "$err" == *">= 1"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly_terminal_windows 0.5 stderr names field and >= 1"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly_terminal_windows 0.5 stderr names field and >= 1"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 13l: weekly_terminal_windows: 0 rejected (must be > 0) ------------

echo "Test: weekly_terminal_windows: 0 exits 1 and stderr says must be > 0"
config_setup
echo '{"weekly_terminal_windows": 0}' > "$DISPATCH_CONFIG_DIR/target-workers.json"
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>&1 1>/dev/null) || rc=$?
assert_eq "weekly_terminal_windows 0 exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"weekly_terminal_windows"* && "$err" == *"must be > 0"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly_terminal_windows 0 stderr says must be > 0"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly_terminal_windows 0 stderr says must be > 0"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 13m: weekly_pace_floor_pct round-trip (value preserved) ------------

echo "Test: weekly_pace_floor_pct: 40 exits 0 and round-trips"
config_setup
echo '{"weekly_pace_floor_pct": 40}' > "$DISPATCH_CONFIG_DIR/target-workers.json"
# shoulder = 100 - 10*2 = 80 >= 40, admissible
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>/dev/null); rc=$?
assert_eq "weekly_pace_floor_pct 40 exits 0" "0" "$rc"
tw_floor=$(printf '%s' "$out" | jq -r '.weekly_pace_floor_pct')
assert_eq "weekly_pace_floor_pct 40 preserved" "40" "$tw_floor"
config_teardown

# --- Test 13n: weekly_pace_floor_pct: 0 rejected (must be > 0) --------------

echo "Test: weekly_pace_floor_pct: 0 exits 1 and stderr says must be > 0"
config_setup
echo '{"weekly_pace_floor_pct": 0}' > "$DISPATCH_CONFIG_DIR/target-workers.json"
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>&1 1>/dev/null) || rc=$?
assert_eq "weekly_pace_floor_pct 0 exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"weekly_pace_floor_pct"* && "$err" == *"must be > 0"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly_pace_floor_pct 0 stderr says must be > 0"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly_pace_floor_pct 0 stderr says must be > 0"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 13o: weekly_pace_floor_pct: 150 rejected (must be <= 100) ----------

echo "Test: weekly_pace_floor_pct: 150 exits 1 and stderr says must be <= 100"
config_setup
echo '{"weekly_pace_floor_pct": 150}' > "$DISPATCH_CONFIG_DIR/target-workers.json"
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>&1 1>/dev/null) || rc=$?
assert_eq "weekly_pace_floor_pct 150 exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"weekly_pace_floor_pct"* && "$err" == *"<= 100"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly_pace_floor_pct 150 stderr says <= 100"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly_pace_floor_pct 150 stderr says <= 100"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 13p: weekly_terminal_windows round-trip (value preserved) ----------

echo "Test: weekly_terminal_windows: 3 exits 0 and round-trips"
config_setup
echo '{"weekly_terminal_windows": 3}' > "$DISPATCH_CONFIG_DIR/target-workers.json"
# shoulder = 100 - 10*3 = 70 >= default floor 50, admissible
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>/dev/null); rc=$?
assert_eq "weekly_terminal_windows 3 exits 0" "0" "$rc"
tw_windows=$(printf '%s' "$out" | jq -r '.weekly_terminal_windows')
assert_eq "weekly_terminal_windows 3 preserved" "3" "$tw_windows"
config_teardown

# --- Test 13q: weekly_terminal_windows: 5 accepted (no pct upper bound) -----
# shoulder = 100 - 10*5 = 50 == default floor 50; floor NOT > shoulder, accepted.

echo "Test: weekly_terminal_windows: 5 exits 0 (no <= 100 upper-bound restriction)"
config_setup
echo '{"weekly_terminal_windows": 5}' > "$DISPATCH_CONFIG_DIR/target-workers.json"
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>/dev/null); rc=$?
assert_eq "weekly_terminal_windows 5 exits 0 (no upper bound)" "0" "$rc"
tw_windows=$(printf '%s' "$out" | jq -r '.weekly_terminal_windows')
assert_eq "weekly_terminal_windows 5 preserved" "5" "$tw_windows"
config_teardown

# --- Test 13r: weekly_terminal_windows non-number rejected -------------------

echo "Test: weekly_terminal_windows: \"two\" exits 1 and stderr names field and number"
config_setup
echo '{"weekly_terminal_windows": "two"}' > "$DISPATCH_CONFIG_DIR/target-workers.json"
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>&1 1>/dev/null) || rc=$?
assert_eq "weekly_terminal_windows string exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"weekly_terminal_windows"* && "$err" == *"number"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly_terminal_windows string stderr names field and number"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly_terminal_windows string stderr names field and number"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 7p: force-opus.json enabled → normalized JSON, exit 0 --------------

echo "Test: valid force-opus.json with enabled:true prints normalized JSON"
config_setup
cat > "$DISPATCH_CONFIG_DIR/force-opus.json" <<'EOF'
{"enabled":true}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" force-opus 2>/dev/null); rc=$?
assert_eq "force-opus enabled: exits 0" "0" "$rc"
fo_enabled=$(printf '%s' "$out" | jq -r '.enabled')
assert_eq "force-opus enabled: .enabled is true" "true" "$fo_enabled"
config_teardown

# --- Test 7q: force-opus.json disabled → normalized JSON, exit 0 -------------

echo "Test: valid force-opus.json with enabled:false prints normalized JSON"
config_setup
cat > "$DISPATCH_CONFIG_DIR/force-opus.json" <<'EOF'
{"enabled":false}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" force-opus 2>/dev/null); rc=$?
assert_eq "force-opus disabled: exits 0" "0" "$rc"
fo_enabled=$(printf '%s' "$out" | jq -r '.enabled')
assert_eq "force-opus disabled: .enabled is false" "false" "$fo_enabled"
config_teardown

# --- Test 7r: absent force-opus.json → no-config, exit 0 --------------------

echo "Test: absent force-opus.json prints no-config and exits 0"
config_setup
# no file written — config dir is empty
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" force-opus 2>/dev/null); rc=$?
assert_eq "force-opus absent: exits 0" "0" "$rc"
assert_eq "force-opus absent: prints no-config" "no-config" "$out"
config_teardown

# --- Test 7s: force-opus.json missing enabled field → exit 1 -----------------

echo "Test: force-opus.json missing required enabled field exits 1 and stderr mentions enabled"
config_setup
cat > "$DISPATCH_CONFIG_DIR/force-opus.json" <<'EOF'
{}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" force-opus 2>&1 1>/dev/null) || rc=$?
assert_eq "force-opus missing enabled: exits 1" "1" "$rc"
if [[ "$err" == *"enabled"* ]]; then
  assert_eq "force-opus missing enabled: stderr mentions enabled" "yes" "yes"
else
  assert_eq "force-opus missing enabled: stderr mentions enabled" "yes" "no: $err"
fi
config_teardown

# --- Test 7t: force-opus.json enabled is a string → exit 1 ------------------

echo "Test: force-opus.json with enabled as a string exits 1 and stderr mentions enabled"
config_setup
cat > "$DISPATCH_CONFIG_DIR/force-opus.json" <<'EOF'
{"enabled":"yes"}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" force-opus 2>&1 1>/dev/null) || rc=$?
assert_eq "force-opus string enabled: exits 1" "1" "$rc"
if [[ "$err" == *"enabled"* ]]; then
  assert_eq "force-opus string enabled: stderr mentions enabled" "yes" "yes"
else
  assert_eq "force-opus string enabled: stderr mentions enabled" "yes" "no: $err"
fi
config_teardown

# --- strict-preflight config type validation (#2041) ------------------------
# strict-preflight gates the dispatch pre-spawn preflight gate. Its validator is
# the only code path that catches a malformed gate config BEFORE the bad value
# reaches dispatch-materialize-spawn's arm/disarm decision. These tests cover the
# validator directly, mirroring the force-opus tests above: valid {enabled:true}
# is printed; missing/wrong-typed enabled and non-object top-level values are
# rejected; an absent file is the inert no-config path.

# --- Test 7u: strict-preflight.json enabled:true → normalized JSON, exit 0 ---

echo "Test: valid strict-preflight.json with enabled:true prints normalized JSON"
config_setup
cat > "$DISPATCH_CONFIG_DIR/strict-preflight.json" <<'EOF'
{"enabled":true}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" strict-preflight 2>/dev/null); rc=$?
assert_eq "strict-preflight enabled: exits 0" "0" "$rc"
sp_enabled=$(printf '%s' "$out" | jq -r '.enabled')
assert_eq "strict-preflight enabled: .enabled is true" "true" "$sp_enabled"
config_teardown

# --- Test 7v: absent strict-preflight.json → no-config, exit 0 --------------

echo "Test: absent strict-preflight.json prints no-config and exits 0"
config_setup
# no file written — config dir is empty
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" strict-preflight 2>/dev/null); rc=$?
assert_eq "strict-preflight absent: exits 0" "0" "$rc"
assert_eq "strict-preflight absent: prints no-config" "no-config" "$out"
config_teardown

# --- Test 7w: strict-preflight.json missing enabled field → exit 1 ----------

echo "Test: strict-preflight.json missing required enabled field exits 1 and stderr mentions enabled"
config_setup
cat > "$DISPATCH_CONFIG_DIR/strict-preflight.json" <<'EOF'
{}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" strict-preflight 2>&1 1>/dev/null) || rc=$?
assert_eq "strict-preflight missing enabled: exits 1" "1" "$rc"
if [[ "$err" == *"enabled"* ]]; then
  assert_eq "strict-preflight missing enabled: stderr mentions enabled" "yes" "yes"
else
  assert_eq "strict-preflight missing enabled: stderr mentions enabled" "yes" "no: $err"
fi
config_teardown

# --- Test 7x: strict-preflight.json enabled is a string → exit 1 ------------

echo "Test: strict-preflight.json with enabled as a string exits 1 and stderr mentions enabled"
config_setup
cat > "$DISPATCH_CONFIG_DIR/strict-preflight.json" <<'EOF'
{"enabled":"true"}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" strict-preflight 2>&1 1>/dev/null) || rc=$?
assert_eq "strict-preflight string enabled: exits 1" "1" "$rc"
if [[ "$err" == *"enabled"* ]]; then
  assert_eq "strict-preflight string enabled: stderr mentions enabled" "yes" "yes"
else
  assert_eq "strict-preflight string enabled: stderr mentions enabled" "yes" "no: $err"
fi
config_teardown

# --- Test 7y: strict-preflight.json top-level array → exit 1 ----------------

echo "Test: strict-preflight.json with a top-level array exits 1 and stderr mentions object"
config_setup
cat > "$DISPATCH_CONFIG_DIR/strict-preflight.json" <<'EOF'
[{"enabled":true}]
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" strict-preflight 2>&1 1>/dev/null) || rc=$?
assert_eq "strict-preflight top-level array: exits 1" "1" "$rc"
if [[ "$err" == *"object"* ]]; then
  assert_eq "strict-preflight top-level array: stderr mentions object" "yes" "yes"
else
  assert_eq "strict-preflight top-level array: stderr mentions object" "yes" "no: $err"
fi
config_teardown

# --- sweep config type validation (#2026) -----------------------------------
# The sweep config gates the not-in-sync reap grace window. Its validator is the
# only code path that catches a malformed grace BEFORE it reaches dispatch-sweep's
# bash arithmetic `[[ "$age" -lt "$grace" ]]` — where a non-integer would error
# and force-reap every not-in-sync worktree. These tests cover the validator
# directly: absent → no-config; empty object → valid; valid integer → printed;
# fractional/<=0/wrong-type/non-object → rejected.

# --- Test 7u: absent sweep.json → no-config, exit 0 --------------------------
echo "Test: absent sweep.json prints no-config and exits 0"
config_setup
# no file written — config dir is empty
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" sweep 2>/dev/null); rc=$?
assert_eq "7u absent sweep.json exits 0" "0" "$rc"
assert_eq "7u absent sweep.json prints no-config" "no-config" "$out"
config_teardown

# --- Test 7v: empty-object sweep.json → valid, prints {} ---------------------
# All sweep tunables are optional, so an empty object is valid and round-trips.
echo "Test: empty-object sweep.json is valid and prints the normalized object"
config_setup
printf '{}\n' > "$DISPATCH_CONFIG_DIR/sweep.json"
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" sweep 2>/dev/null); rc=$?
assert_eq "7v empty-object sweep.json exits 0" "0" "$rc"
norm=$(printf '%s' "$out" | jq -c '.')
assert_eq "7v empty-object sweep.json normalizes to {}" "{}" "$norm"
config_teardown

# --- Test 7w: notInSyncGraceSeconds integer → valid, value round-trips -------
echo "Test: sweep.json with a valid integer notInSyncGraceSeconds round-trips"
config_setup
printf '{"notInSyncGraceSeconds":3600}\n' > "$DISPATCH_CONFIG_DIR/sweep.json"
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" sweep 2>/dev/null); rc=$?
assert_eq "7w integer grace exits 0" "0" "$rc"
grace=$(printf '%s' "$out" | jq -r '.notInSyncGraceSeconds')
assert_eq "7w integer grace round-trips" "3600" "$grace"
config_teardown

# --- Test 7x: notInSyncGraceSeconds fractional → exit 1 ----------------------
# The integer-vs-float bug: 1.5|type=="number" and 1.5>0, so the field passes the
# type and positivity checks. The whole-number guard is the ONLY thing that rejects
# a fractional grace before it reaches dispatch-sweep's integer arithmetic.
echo "Test: sweep.json with a fractional notInSyncGraceSeconds exits 1 and names the field"
config_setup
printf '{"notInSyncGraceSeconds":0.5}\n' > "$DISPATCH_CONFIG_DIR/sweep.json"
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" sweep 2>&1 1>/dev/null) || rc=$?
assert_eq "7x fractional grace exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"notInSyncGraceSeconds"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: 7x fractional grace error names notInSyncGraceSeconds"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: 7x fractional grace error names notInSyncGraceSeconds"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 7y: notInSyncGraceSeconds <= 0 → exit 1 ----------------------------
echo "Test: sweep.json with notInSyncGraceSeconds <= 0 exits 1 and names the field"
config_setup
printf '{"notInSyncGraceSeconds":0}\n' > "$DISPATCH_CONFIG_DIR/sweep.json"
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" sweep 2>&1 1>/dev/null) || rc=$?
assert_eq "7y non-positive grace exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"notInSyncGraceSeconds"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: 7y non-positive grace error names notInSyncGraceSeconds"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: 7y non-positive grace error names notInSyncGraceSeconds"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 7z: notInSyncGraceSeconds wrong type (string) → exit 1 -------------
echo "Test: sweep.json with a string notInSyncGraceSeconds exits 1 and names the field"
config_setup
printf '{"notInSyncGraceSeconds":"3600"}\n' > "$DISPATCH_CONFIG_DIR/sweep.json"
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" sweep 2>&1 1>/dev/null) || rc=$?
assert_eq "7z string grace exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"notInSyncGraceSeconds"* && "$err" == *"number"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: 7z string grace error names the field and 'number'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: 7z string grace error names the field and 'number'"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 7za: non-object top-level sweep.json → exit 1 ----------------------
echo "Test: non-object top-level sweep.json exits 1 and stderr mentions object"
config_setup
printf '[]\n' > "$DISPATCH_CONFIG_DIR/sweep.json"
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" sweep 2>&1 1>/dev/null) || rc=$?
assert_eq "7za non-object sweep.json exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"object"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: 7za non-object sweep.json error mentions 'object'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: 7za non-object sweep.json error mentions 'object'"
  echo "    stderr: $err"
fi
config_teardown

# --- selection-lock config type validation (#2104) --------------------------
# The selection-lock config gates the max-hold/heartbeat staleness cap. Its
# validator is the only path that catches a malformed max_hold_seconds BEFORE it
# reaches dispatch-acquire-lock's bash arithmetic `(( age > MAX_HOLD_SECONDS ))`,
# where a non-integer would error and break the staleness check. Mirrors the
# sweep validator tests: absent → no-config; empty object → valid; valid integer
# → printed; fractional/<=0/wrong-type/non-object → rejected naming the field.

# --- Test 7sl-a: absent selection-lock.json → no-config, exit 0 --------------
echo "Test: absent selection-lock.json prints no-config and exits 0"
config_setup
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" selection-lock 2>/dev/null); rc=$?
assert_eq "7sl-a absent selection-lock.json exits 0" "0" "$rc"
assert_eq "7sl-a absent selection-lock.json prints no-config" "no-config" "$out"
config_teardown

# --- Test 7sl-b: empty-object selection-lock.json → valid, prints {} ---------
echo "Test: empty-object selection-lock.json is valid and prints the normalized object"
config_setup
printf '{}\n' > "$DISPATCH_CONFIG_DIR/selection-lock.json"
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" selection-lock 2>/dev/null); rc=$?
assert_eq "7sl-b empty-object selection-lock.json exits 0" "0" "$rc"
norm=$(printf '%s' "$out" | jq -c '.')
assert_eq "7sl-b empty-object selection-lock.json normalizes to {}" "{}" "$norm"
config_teardown

# --- Test 7sl-c: max_hold_seconds integer → valid, value round-trips ---------
echo "Test: selection-lock.json with a valid integer max_hold_seconds round-trips"
config_setup
printf '{"max_hold_seconds":300}\n' > "$DISPATCH_CONFIG_DIR/selection-lock.json"
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" selection-lock 2>/dev/null); rc=$?
assert_eq "7sl-c integer max_hold exits 0" "0" "$rc"
mh=$(printf '%s' "$out" | jq -r '.max_hold_seconds')
assert_eq "7sl-c integer max_hold round-trips" "300" "$mh"
config_teardown

# --- Test 7sl-d: max_hold_seconds fractional → exit 1 -----------------------
echo "Test: selection-lock.json with a fractional max_hold_seconds exits 1 and names the field"
config_setup
printf '{"max_hold_seconds":0.5}\n' > "$DISPATCH_CONFIG_DIR/selection-lock.json"
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" selection-lock 2>&1 1>/dev/null) || rc=$?
assert_eq "7sl-d fractional max_hold exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"max_hold_seconds"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: 7sl-d fractional max_hold error names max_hold_seconds"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: 7sl-d fractional max_hold error names max_hold_seconds"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 7sl-e: max_hold_seconds <= 0 → exit 1 -----------------------------
echo "Test: selection-lock.json with max_hold_seconds <= 0 exits 1 and names the field"
config_setup
printf '{"max_hold_seconds":0}\n' > "$DISPATCH_CONFIG_DIR/selection-lock.json"
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" selection-lock 2>&1 1>/dev/null) || rc=$?
assert_eq "7sl-e non-positive max_hold exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"max_hold_seconds"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: 7sl-e non-positive max_hold error names max_hold_seconds"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: 7sl-e non-positive max_hold error names max_hold_seconds"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 7sl-f: max_hold_seconds wrong type (string) → exit 1 --------------
echo "Test: selection-lock.json with a string max_hold_seconds exits 1 and names the field"
config_setup
printf '{"max_hold_seconds":"300"}\n' > "$DISPATCH_CONFIG_DIR/selection-lock.json"
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" selection-lock 2>&1 1>/dev/null) || rc=$?
assert_eq "7sl-f string max_hold exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"max_hold_seconds"* && "$err" == *"number"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: 7sl-f string max_hold error names the field and 'number'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: 7sl-f string max_hold error names the field and 'number'"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 7sl-g: non-object top-level selection-lock.json → exit 1 ----------
echo "Test: non-object top-level selection-lock.json exits 1 and stderr mentions object"
config_setup
printf '[]\n' > "$DISPATCH_CONFIG_DIR/selection-lock.json"
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" selection-lock 2>&1 1>/dev/null) || rc=$?
assert_eq "7sl-g non-object selection-lock.json exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"object"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: 7sl-g non-object selection-lock.json error mentions 'object'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: 7sl-g non-object selection-lock.json error mentions 'object'"
  echo "    stderr: $err"
fi
config_teardown

# <<< END MOVED <<<

report_results
