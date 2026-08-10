#!/usr/bin/env bash
# Unit tests for rsi-claim — the /rsi serialization primitive.
#
# The claim's whole value is that it FAILS CLOSED, so the cases that matter are
# the ones where the session probe cannot answer. Those are unreachable against
# a real daemon, so `claude` is stubbed: CLAUDE_AGENTS_CMD points at a script
# whose output each case controls. A `claude daemon` process is likewise stubbed
# where the helper's empty-read corroboration needs to see one.
#
# Runs from anywhere; creates and removes its own temp tree.

set -uo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
CLAIM="$SCRIPT_DIR/rsi-claim"

PASS=0
FAIL=0

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  FAIL=$((FAIL + 1))
}

ok() {
  printf 'ok: %s\n' "$1"
  PASS=$((PASS + 1))
}

expect_state() {
  local label="$1" want="$2" got
  got="$("$CLAIM" --state 2>/dev/null)"
  if [[ "$got" == "$want" ]]; then
    ok "$label (state=$want)"
  else
    fail "$label — expected state '$want', got '$got'"
  fi
}

expect_exit() {
  local label="$1" want="$2"
  "$CLAIM" >/dev/null 2>&1
  local got=$?
  if [[ "$got" == "$want" ]]; then
    ok "$label (exit=$want)"
  else
    fail "$label — expected exit $want, got $got"
  fi
}

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# A real repository, so the script's project-root resolution runs for real
# rather than being stubbed — that resolution is itself a regression risk (a
# path under the wrong root does not exist, and a non-existent worktree reports
# `free`, silently disabling the claim).
PROJECT="$TMP/project"
mkdir -p "$PROJECT"
git -C "$PROJECT" init -q
git -C "$PROJECT" config user.email test@example.com
git -C "$PROJECT" config user.name Test
mkdir -p "$PROJECT/.claude/skills/rsi/scripts" \
         "$PROJECT/.claude/skills/dispatch-propagate/scripts"
cp "$CLAIM" "$PROJECT/.claude/skills/rsi/scripts/rsi-claim"
cp "$SCRIPT_DIR/../../dispatch-propagate/scripts/lib-claude-agents.sh" \
   "$PROJECT/.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh"
git -C "$PROJECT" add -A >/dev/null
git -C "$PROJECT" commit -qm init

CLAIM="$PROJECT/.claude/skills/rsi/scripts/rsi-claim"
WORKTREE="$PROJECT/.claude/worktrees/strategy-recursive-self-improvement"

# --- Stub plumbing ----------------------------------------------------------

STUB_BIN="$TMP/bin"
mkdir -p "$STUB_BIN"
cat > "$STUB_BIN/claude" <<'STUB'
#!/usr/bin/env bash
# Emits whatever RSI_TEST_AGENTS_JSON holds, exiting with RSI_TEST_AGENTS_RC.
if [[ "${RSI_TEST_AGENTS_RC:-0}" != "0" ]]; then
  exit "${RSI_TEST_AGENTS_RC}"
fi
printf '%s\n' "${RSI_TEST_AGENTS_JSON:-[]}"
STUB
chmod +x "$STUB_BIN/claude"
export CLAUDE_AGENTS_CMD="$STUB_BIN/claude"

# The helper corroborates an empty read by pgrep-ing for a live `claude daemon`
# process before calling it a definite "no sessions". That probe must be stubbed
# too, via the seam the helper documents (CLAUDE_AGENTS_PGREP_CMD): the host
# running these tests very often HAS a real daemon, which would corroborate the
# "no daemon visible" case and silently invert its assertion.
cat > "$STUB_BIN/pgrep" <<'STUB'
#!/usr/bin/env bash
exit "${RSI_TEST_DAEMON_VISIBLE:-1}"
STUB
chmod +x "$STUB_BIN/pgrep"
export CLAUDE_AGENTS_PGREP_CMD="$STUB_BIN/pgrep"

# --- Cases ------------------------------------------------------------------

# 1. No worktree at all: nothing can hold a path that does not exist.
export RSI_TEST_AGENTS_JSON='[]'
expect_state "absent worktree is free" "free"
expect_exit "absent worktree claims" 0

mkdir -p "$WORKTREE"

# 2. A rival live session in the worktree: refuse, exit 11.
export RSI_TEST_AGENTS_JSON='[{"sessionId":"sess-rival","pid":999999,"status":"running","name":"strategy-recursive-self-improvement"}]'
expect_state "rival session holds the claim" "held"
expect_exit "held claim refuses with 11" 11

# 3. The caller's OWN session must not read as a rival. The stub reports a
#    session whose pid is this test process — an ancestor of the claim script —
#    which is exactly the shape of /rsi re-invoking itself inside its worktree.
export RSI_TEST_AGENTS_JSON="[{\"sessionId\":\"sess-self\",\"pid\":$$,\"status\":\"running\",\"name\":\"strategy-recursive-self-improvement\"}]"
expect_state "own session is not a rival claim" "free"
expect_exit "own session still claims" 0

# 4. An unanswerable probe is HELD, never free — the sandbox failure mode.
export RSI_TEST_AGENTS_RC=1
expect_state "probe failure is unknown" "unknown"
expect_exit "unknown claim refuses with 12" 12
unset RSI_TEST_AGENTS_RC

# 5. An UNCORROBORATED empty read is unknown too: a sandboxed `claude agents
#    --json` returns `[]` indistinguishably from a genuine no-sessions answer,
#    so `[]` only means free when a daemon process is visible.
export RSI_TEST_AGENTS_JSON='[]'
export RSI_TEST_DAEMON_VISIBLE=1   # pgrep exits 1 — no daemon visible
expect_state "uncorroborated empty read is unknown" "unknown"

export RSI_TEST_DAEMON_VISIBLE=0   # pgrep exits 0 — daemon visible
expect_state "corroborated empty read is free" "free"

# 6. An unknown argument is a usage error, not a silent claim.
"$CLAIM" --nonsense >/dev/null 2>&1
if [[ $? == 2 ]]; then
  ok "unknown argument exits 2"
else
  fail "unknown argument should exit 2"
fi

printf '\n%d passed, %d failed\n' "$PASS" "$FAIL"
[[ "$FAIL" == "0" ]]
