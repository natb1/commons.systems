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

# The `$PATH-unchanged-after-call` assertion below is a SECONDARY sanity check,
# NOT the regression discriminator: zsh restores the tied `path`/`$PATH` scalar
# when a function's `local path` scope exits, so `$PATH` is byte-identical after
# the call returns even against the buggy pre-fix library. The assertion that
# actually fails pre-fix is Test 1's FUNCTIONAL check above — pre-fix, the tied
# `$PATH` is clobbered to the worktree path *mid-call*, so the bare
# `basename "$path"` (and, in the two tests below, the mid-call `jq` / fake-claude
# `env`-shebang lookups) are not found and the function misbehaves. Each of the
# three functions below is therefore covered by a real FUNCTIONAL assertion that
# flips pre→post-fix, with the `$PATH-unchanged` line kept only as a secondary
# sanity that the scope tie is restored.
assert_eq "worktree_has_live_session: \$PATH unchanged after call (secondary sanity)" "$path_before" "$PATH"
ca_teardown

# --- Test 3: claude_sessions_under returns a live session row ----------------
#             The mid-call regression discriminator for claude_sessions_under:
#             pre-fix, `local path=<cwd>` clobbers `$PATH` so the mid-call `jq`
#             pass (and the fake-claude `env`-shebang lookup) are not found and
#             the function returns 1 with empty output; post-fix it returns 0
#             with the session's TSV row.

echo "Test: claude_sessions_under returns a matching session's TSV row"
ca_setup
write_fake_claude '[{"sessionId":"sid1","pid":111,"status":"busy","name":"w"}]' 0
path_before="$PATH"
if under_out=$(claude_sessions_under "$CA_DIR"); then under_rc=0; else under_rc=1; fi
assert_eq "claude_sessions_under: returns 0 on a matching payload" "0" "$under_rc"
assert_eq "claude_sessions_under: emits the session's TSV row" $'sid1\t111\tbusy\tw' "$under_out"
assert_eq "claude_sessions_under: \$PATH unchanged after call (secondary sanity)" "$path_before" "$PATH"
ca_teardown

# --- Test 4: claude_agents_snapshot_capture writes the payload ---------------
#             The mid-call regression discriminator for claude_agents_snapshot_
#             capture: pre-fix, `local path=<out>` clobbers `$PATH` so the fake
#             claude's `#!/usr/bin/env bash` shebang cannot resolve `bash` on the
#             clobbered path, the command fails, and the snapshot file is left
#             empty (return 1); post-fix it returns 0 and the file holds the
#             captured array.

echo "Test: claude_agents_snapshot_capture writes the captured array to <path>"
ca_setup
write_fake_claude '[{"sessionId":"sid1","pid":111,"status":"busy","name":"w"}]' 0
path_before="$PATH"
if claude_agents_snapshot_capture "$CA_DIR/snapshot.json"; then cap_rc=0; else cap_rc=1; fi
assert_eq "claude_agents_snapshot_capture: returns 0" "0" "$cap_rc"
assert_eq "claude_agents_snapshot_capture: snapshot file holds the payload" \
  '[{"sessionId":"sid1","pid":111,"status":"busy","name":"w"}]' \
  "$(cat "$CA_DIR/snapshot.json" 2>/dev/null)"
assert_eq "claude_agents_snapshot_capture: \$PATH unchanged after call (secondary sanity)" "$path_before" "$PATH"
ca_teardown

echo ""
echo "Results: $PASS passed, $FAIL failed"
[[ "$FAIL" -eq 0 ]]
