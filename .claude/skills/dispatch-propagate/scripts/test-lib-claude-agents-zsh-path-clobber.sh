#!/usr/bin/env zsh
#
# test-lib-claude-agents-zsh-path-clobber.sh — regression test for the zsh
# tied path/$PATH clobber in lib-claude-agents.sh (tactic-live-session-check-
# path-clobber).
#
# zsh ties the lowercase array parameter `path` to the scalar `$PATH`
# (same tie as `cdpath`/`fpath`). lib-claude-agents.sh has a bash shebang but
# is *sourced* into the Bash tool's zsh by the align skills' Step 0.2 claim
# check, so a `local path=` inside a sourced function used to clobber the
# calling zsh session's $PATH for the remainder of that function call. This
# is the deliberate exception to test-dispatch-daemon-liveness.sh's "run
# under bash -c, never zsh" convention: the bug is zsh-specific, so only a
# zsh-shebang test script can exercise it.

set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${(%):-%x}")" && pwd)"
# shellcheck source=/dev/null
source "$HARNESS_DIR/lib-claude-agents.sh"

PASS=0; FAIL=0
ok() { echo "PASS: $1"; PASS=$((PASS + 1)); }
no() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }
assert_eq() { # <label> <expected> <actual>
  if [[ "$2" == "$3" ]]; then ok "$1"; else no "$1 (expected '$2', got '$3')"; fi
}

CA_DIR=""
CA_FAKE=""

ca_setup() {
  CA_DIR=$(mktemp -d)
  CA_FAKE="$CA_DIR/fake-claude"
}

ca_teardown() {
  rm -rf "$CA_DIR"
  CA_DIR=""
  CA_FAKE=""
  unset CLAUDE_AGENTS_CMD
}

# write_fake_claude <stdout-payload> <exit-code> — install a fake `claude` that
# prints <stdout-payload> verbatim and exits <exit-code>, ignoring its args,
# and point CLAUDE_AGENTS_CMD at it (an absolute path, bypassing $PATH lookup).
write_fake_claude() {
  local payload="$1" exit_code="$2"
  printf '%s' "$payload" > "$CA_DIR/payload.json"
  cat > "$CA_FAKE" <<FAKE
#!/usr/bin/env bash
cat "$CA_DIR/payload.json"
exit $exit_code
FAKE
  chmod +x "$CA_FAKE"
  CLAUDE_AGENTS_CMD="$CA_FAKE"
}

# --- Test 1: worktree_has_live_session on an empty registry reports free ----

echo "Test: worktree_has_live_session on an empty registry reports free"
ca_setup
write_fake_claude '[]' 0
path_before="$PATH"
if worktree_has_live_session "$CA_DIR"; then live=occupied; else live=free; fi
assert_eq "empty: worktree_has_live_session reports free" "free" "$live"

# --- Test 2: $PATH is byte-identical before/after — the load-bearing --------
#             regression assertion. This is the assertion that fails pre-fix
#             and passes post-fix, regardless of whether case 1 also flips
#             (write_fake_claude's absolute-path CLAUDE_AGENTS_CMD bypasses
#             $PATH lookup for the claude call itself, so only the bare
#             `basename "$path"` call breaks pre-fix — do not treat case 1's
#             pass as evidence the fix works).
assert_eq "worktree_has_live_session: \$PATH unchanged after call" "$path_before" "$PATH"
ca_teardown

# --- Test 3: claude_sessions_under leaves $PATH unchanged -------------------

echo "Test: claude_sessions_under leaves \$PATH unchanged"
ca_setup
write_fake_claude '[]' 0
path_before="$PATH"
claude_sessions_under "$CA_DIR" >/dev/null 2>&1
assert_eq "claude_sessions_under: \$PATH unchanged after call" "$path_before" "$PATH"
ca_teardown

# --- Test 4: claude_agents_snapshot_capture leaves $PATH unchanged ----------

echo "Test: claude_agents_snapshot_capture leaves \$PATH unchanged"
ca_setup
write_fake_claude '[]' 0
path_before="$PATH"
claude_agents_snapshot_capture "$CA_DIR/snapshot.json" >/dev/null 2>&1
assert_eq "claude_agents_snapshot_capture: \$PATH unchanged after call" "$path_before" "$PATH"
ca_teardown

echo ""
echo "Results: $PASS passed, $FAIL failed"
[[ "$FAIL" -eq 0 ]]
