#!/usr/bin/env bash
# Tests for dispatch-digest-window -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 23027-23164.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# dispatch-digest-window tests
# ============================================================================
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/scripts/   copy of dispatch-digest-window
#   $TMPDIR_TEST/bin/       gh stub (prepended to PATH)
#
# The gh stub handles the two queries dispatch-digest-window issues:
#   issue view <num> --repo <repo> --json createdAt,labels  → cat issue.json
#   issue list --repo <repo> --label <label> --state closed --limit <n> --json number,closedAt
#                                                            → cat closed.json
# Fixtures default to a minimal jit issue and an empty closed list.

digest_window_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/bin"

  cp "$SCRIPT_DIR/dispatch-digest-window" "$TMPDIR_TEST/scripts/dispatch-digest-window"
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/lib.sh"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-digest-window"

  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
args="$*"
TREE="$(cd "$(dirname "$0")/.." && pwd)"
case "$args" in
  api\ repos/*/issues/[0-9]*)
    # gh_issue_view_rest single-issue GET: gh api repos/<repo>/issues/<N>.
    # MUST precede the api repos/*/issues* list arm (first-match-wins).
    # Serves issue.json in raw REST shape (created_at, not createdAt).
    if [[ -f "$TREE/issue.json" ]]; then
      cat "$TREE/issue.json"
    else
      echo '{"number":30,"title":"","body":"","state":"open","state_reason":null,"created_at":"2026-01-01T00:00:00Z","labels":[{"name":"jit:digest"}],"assignees":[]}'
    fi
    ;;
  api\ repos/*/issues*)
    # gh_issue_list_rest uses REST: gh api repos/<repo>/issues?state=...
    # Return each item in REST snake_case format; gh_issue_list_rest remaps to camelCase.
    if [[ -f "$TREE/closed.json" ]]; then
      jq 'map({number, pull_request: null, created_at: .createdAt, closed_at: .closedAt, labels})' "$TREE/closed.json"
    else
      echo '[]'
    fi
    ;;
  *)
    echo "gh stub: unknown invocation: $args" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/gh"

  SAVED_PATH_DIGEST="$PATH"
  export PATH="$TMPDIR_TEST/bin:$PATH"
}

digest_window_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  export PATH="$SAVED_PATH_DIGEST"
}

# --- Test: prints the prior closed digest closedAt (steady state) ---

echo "Test: dispatch-digest-window prints the prior closed digest closedAt (steady state)"
digest_window_setup
cat > "$TMPDIR_TEST/issue.json" <<'EOF'
{"number":30,"title":"","body":"","state":"open","state_reason":null,"created_at":"2026-05-01T00:00:00Z","labels":[{"name":"jit:digest"}],"assignees":[]}
EOF
cat > "$TMPDIR_TEST/closed.json" <<'EOF'
[{"number":10,"closedAt":"2026-05-20T00:00:00Z"},{"number":11,"closedAt":"2026-05-25T12:00:00Z"}]
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-digest-window" some-owner/some-repo 30); rc=$?
assert_eq "dispatch-digest-window: steady state exits 0" "0" "$rc"
assert_eq "dispatch-digest-window: steady state prints max prior closedAt" "2026-05-25T12:00:00Z" "$out"
digest_window_teardown

# --- Test: falls back to createdAt on cold start (no prior closed) ---

echo "Test: dispatch-digest-window falls back to createdAt on cold start (no prior closed)"
digest_window_setup
cat > "$TMPDIR_TEST/issue.json" <<'EOF'
{"number":40,"title":"","body":"","state":"open","state_reason":null,"created_at":"2026-06-01T09:00:00Z","labels":[{"name":"jit:digest"}],"assignees":[]}
EOF
# No closed.json — the stub's default empty list applies.
out=$("$TMPDIR_TEST/scripts/dispatch-digest-window" some-owner/some-repo 40); rc=$?
assert_eq "dispatch-digest-window: cold start exits 0" "0" "$rc"
assert_eq "dispatch-digest-window: cold start prints createdAt" "2026-06-01T09:00:00Z" "$out"
digest_window_teardown

# --- Test: excludes the issue's own closedAt ---

echo "Test: dispatch-digest-window excludes the issue's own closedAt"
digest_window_setup
cat > "$TMPDIR_TEST/issue.json" <<'EOF'
{"number":30,"title":"","body":"","state":"open","state_reason":null,"created_at":"2026-05-01T00:00:00Z","labels":[{"name":"jit:digest"}],"assignees":[]}
EOF
# Issue 30 is itself closed with a later closedAt than the real prior (20).
# The script must ignore its own entry and anchor on the prior digest's closedAt.
cat > "$TMPDIR_TEST/closed.json" <<'EOF'
[{"number":20,"closedAt":"2026-05-15T00:00:00Z"},{"number":30,"closedAt":"2026-05-28T00:00:00Z"}]
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-digest-window" some-owner/some-repo 30); rc=$?
assert_eq "dispatch-digest-window: exclude-self exits 0" "0" "$rc"
assert_eq "dispatch-digest-window: exclude-self ignores own closedAt" "2026-05-15T00:00:00Z" "$out"
digest_window_teardown

# --- Test: exits 1 when the issue carries no jit:* label ---

echo "Test: dispatch-digest-window exits 1 when the issue carries no jit:* label"
digest_window_setup
cat > "$TMPDIR_TEST/issue.json" <<'EOF'
{"number":50,"title":"","body":"","state":"open","state_reason":null,"created_at":"2026-05-01T00:00:00Z","labels":[{"name":"help wanted"},{"name":"bug"}],"assignees":[]}
EOF
# Capture with the set -e-safe pattern: a bare `cmd; rc=$?` would abort the
# suite when the command exits nonzero.
out=$("$TMPDIR_TEST/scripts/dispatch-digest-window" some-owner/some-repo 50 2>/dev/null) && rc=0 || rc=$?
assert_eq "dispatch-digest-window: no jit:* label exits 1" "1" "$rc"
assert_eq "dispatch-digest-window: no jit:* label prints nothing on stdout" "" "$out"
digest_window_teardown

# --- Test: rejects a <repo> that is not owner/repo ---

echo "Test: dispatch-digest-window rejects a malformed <repo> argument"
digest_window_setup
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-digest-window" "--config /tmp/evil" 30 2>&1 1>/dev/null) || rc=$?
assert_eq "dispatch-digest-window: malformed repo exits 2" "2" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"must be owner/repo"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: malformed repo stderr mentions 'must be owner/repo'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: malformed repo stderr mentions 'must be owner/repo'"
  echo "    stderr: $err"
fi
digest_window_teardown

# <<< END MOVED <<<

report_results
