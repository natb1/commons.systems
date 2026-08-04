#!/usr/bin/env bash
# Tests for dispatch-jit-skill -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 22817-23026.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# dispatch-jit-skill tests
# ============================================================================
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/scripts/   copies of dispatch-jit-skill, dispatch-config-load, lib.sh
#   $TMPDIR_TEST/config/    synthetic config directory (DISPATCH_CONFIG_DIR)
#   $TMPDIR_TEST/bin/       gh stub (prepended to PATH)
#
# DISPATCH_CONFIG_DIR is exported so dispatch-config-load never touches the
# real dispatch.config/ directory and does not require a git repo.

jit_skill_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/config" "$TMPDIR_TEST/bin"

  cp "$SCRIPT_DIR/dispatch-jit-skill" "$TMPDIR_TEST/scripts/dispatch-jit-skill"
  cp "$SCRIPT_DIR/dispatch-config-load" "$TMPDIR_TEST/scripts/dispatch-config-load"
  # dispatch-config-load sources lib.sh via its SCRIPT_DIR — sits alongside it.
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/lib.sh"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-jit-skill" \
           "$TMPDIR_TEST/scripts/dispatch-config-load"

  # gh stub: handles dispatch-jit-skill's gh_issue_view_rest read (#2257):
  # `gh api repos/<owner>/<repo>/issues/<N>`. Reads the labels fixture from
  # $TMPDIR_TEST/labels.json (a raw-REST {"labels":[...]} object) and merges a
  # state so the helper's .state|ascii_upcase does not error; defaults to empty
  # labels. Unknown invocations → stderr + exit 1.
  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
args="$*"
TREE="$(cd "$(dirname "$0")/.." && pwd)"
case "$args" in
  api\ repos/*/issues/*)
    if [[ -f "$TREE/labels.json" ]]; then
      jq '. + {state:"open"}' "$TREE/labels.json"
    else
      echo '{"state":"open","labels":[]}'
    fi
    ;;
  *)
    echo "gh stub: unknown invocation: $args" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/gh"

  SAVED_PATH_JIT="$PATH"
  export PATH="$TMPDIR_TEST/bin:$PATH"
  export DISPATCH_CONFIG_DIR="$TMPDIR_TEST/config"
}

jit_skill_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  export PATH="$SAVED_PATH_JIT"
  unset DISPATCH_CONFIG_DIR
}

# --- Test: dispatch-jit-skill returns the configured skill for a matching jit label ---

echo "Test: dispatch-jit-skill returns the configured skill for a matching jit label"
jit_skill_setup
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "digest",
      "repo": "some-owner/some-repo",
      "label": "jit:digest",
      "title": "Digest",
      "body": "Recurring digest checkpoint.",
      "project": "example-project",
      "remindAfterClose": "24h",
      "dueAfterClose": "48h",
      "debounce": "1h",
      "skill": "digest"
    }
  ]
}
EOF
cat > "$TMPDIR_TEST/labels.json" <<'EOF'
{"labels":[{"name":"jit:digest"},{"name":"help wanted"}]}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-jit-skill" some-owner/some-repo 42); rc=$?
assert_eq "dispatch-jit-skill: matched jit with skill exits 0" "0" "$rc"
assert_eq "dispatch-jit-skill: matched jit prints skill name" "digest" "$out"
jit_skill_teardown

# --- Test: dispatch-jit-skill prints nothing when the matched jit defines no skill ---

echo "Test: dispatch-jit-skill prints nothing when the matched jit defines no skill"
jit_skill_setup
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "plain",
      "repo": "some-owner/some-repo",
      "label": "jit:plain",
      "title": "Plain reminder",
      "body": "A plain jit with no skill field.",
      "project": "example-project",
      "remindAfterClose": "12h",
      "dueAfterClose": "24h",
      "debounce": "1h"
    }
  ]
}
EOF
cat > "$TMPDIR_TEST/labels.json" <<'EOF'
{"labels":[{"name":"jit:plain"}]}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-jit-skill" some-owner/some-repo 7); rc=$?
assert_eq "dispatch-jit-skill: matched jit without skill exits 0" "0" "$rc"
assert_eq "dispatch-jit-skill: matched jit without skill prints nothing" "" "$out"
jit_skill_teardown

# --- Test: dispatch-jit-skill prints nothing with no jit.json (no-config) ---

echo "Test: dispatch-jit-skill prints nothing with no jit.json (no-config)"
jit_skill_setup
# No jit.json written into config/ — dispatch-config-load returns "no-config".
# The labels fixture is present but should never be consulted.
cat > "$TMPDIR_TEST/labels.json" <<'EOF'
{"labels":[{"name":"jit:digest"}]}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-jit-skill" some-owner/some-repo 99); rc=$?
assert_eq "dispatch-jit-skill: no-config exits 0" "0" "$rc"
assert_eq "dispatch-jit-skill: no-config prints nothing" "" "$out"
jit_skill_teardown

# --- Test: dispatch-jit-skill prints nothing when the issue has no jit:* label ---

echo "Test: dispatch-jit-skill prints nothing when issue has no jit:* label"
jit_skill_setup
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "digest",
      "repo": "some-owner/some-repo",
      "label": "jit:digest",
      "title": "Digest",
      "body": "Recurring digest checkpoint.",
      "project": "example-project",
      "remindAfterClose": "24h",
      "dueAfterClose": "48h",
      "debounce": "1h",
      "skill": "digest"
    }
  ]
}
EOF
cat > "$TMPDIR_TEST/labels.json" <<'EOF'
{"labels":[{"name":"help wanted"},{"name":"bug"}]}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-jit-skill" some-owner/some-repo 55); rc=$?
assert_eq "dispatch-jit-skill: no jit:* label exits 0" "0" "$rc"
assert_eq "dispatch-jit-skill: no jit:* label prints nothing" "" "$out"
jit_skill_teardown

# --- Test: dispatch-jit-skill prints nothing when the jit:* label matches no jit entry ---

echo "Test: dispatch-jit-skill prints nothing when the jit:* label matches no jit entry"
jit_skill_setup
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "digest",
      "repo": "some-owner/some-repo",
      "label": "jit:digest",
      "title": "Digest",
      "body": "Recurring digest checkpoint.",
      "project": "example-project",
      "remindAfterClose": "24h",
      "dueAfterClose": "48h",
      "debounce": "1h",
      "skill": "digest"
    }
  ]
}
EOF
# The issue carries jit:stale, which no jit entry defines — the jq select emits
# nothing and the script exits 0 with empty output.
cat > "$TMPDIR_TEST/labels.json" <<'EOF'
{"labels":[{"name":"jit:stale"},{"name":"help wanted"}]}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-jit-skill" some-owner/some-repo 66); rc=$?
assert_eq "dispatch-jit-skill: unmatched jit label exits 0" "0" "$rc"
assert_eq "dispatch-jit-skill: unmatched jit label prints nothing" "" "$out"
jit_skill_teardown

# --- Test: dispatch-jit-skill rejects a <repo> that is not owner/repo ---------

echo "Test: dispatch-jit-skill rejects a malformed <repo> argument"
jit_skill_setup
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-jit-skill" "--config /tmp/evil" 42 2>&1 1>/dev/null) || rc=$?
assert_eq "dispatch-jit-skill: malformed repo exits 2" "2" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"must be owner/repo"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: malformed repo stderr mentions 'must be owner/repo'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: malformed repo stderr mentions 'must be owner/repo'"
  echo "    stderr: $err"
fi
jit_skill_teardown

# <<< END MOVED <<<

report_results
