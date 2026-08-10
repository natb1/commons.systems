#!/usr/bin/env bash
# Tests for dispatch-node-reap — the CLI wrapper over `session_reap_node`.
#
# The act itself is tested in test-lib-session-reap.sh (118 cases, against a real
# scratch git repo). This file pins only what the CLI adds: argv validation, the
# SELF-TARGET refusal, and token passthrough.
#
# THE SELF-TARGET REFUSAL IS THE REASON THIS FILE EXISTS. The intervention
# session is registered under the SAME node name as the corpse it was sent to
# clear — that is how the router spawns it (`--name "$id"`). A mis-identified
# target would make the intervention reap ITSELF mid-pass, killing it before it
# can declare a disposition and leaving the node frozen exactly as it found it.
# So the refusal must fire BEFORE any daemon call, and the tests assert that no
# `claude rm` was invoked, not merely that the token came back right.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

echo ""
echo "=== dispatch-node-reap ==="

DNR="$SCRIPT_DIR/dispatch-node-reap"

DNR_DIR=""
DNR_RC=0
DNR_OUT=""

dnr_setup() {
  DNR_DIR=$(mktemp -d)
  DNR_CALLS="$DNR_DIR/calls"
  : > "$DNR_CALLS"
  # A fake `claude` that RECORDS every invocation. The self-target tests assert
  # this file stays empty — "the token was skip-self" alone would not prove the
  # refusal happened before the daemon call.
  cat > "$DNR_DIR/fake-claude" <<FAKE
#!/usr/bin/env bash
printf 'claude %s\n' "\$*" >> "$DNR_CALLS"
if [[ "\${1:-}" == "rm" ]]; then exit 0; fi
printf '[]'
exit 0
FAKE
  chmod +x "$DNR_DIR/fake-claude"
  export CLAUDE_AGENTS_CMD="$DNR_DIR/fake-claude"
  # A repo root that exists but holds no worktrees — enough for the act to run
  # its absent-worktree path without touching anything real.
  mkdir -p "$DNR_DIR/repo/.claude/worktrees"
  export DISPATCH_SESSION_REAP_REPO_ROOT="$DNR_DIR/repo"
  export DISPATCH_SESSION_REAP_WORKTREES_ROOT="$DNR_DIR/repo/.claude/worktrees"
  unset CLAUDE_JOB_DIR || true
}

dnr_teardown() {
  rm -rf "$DNR_DIR"
  DNR_DIR=""
  unset CLAUDE_AGENTS_CMD DISPATCH_SESSION_REAP_REPO_ROOT \
        DISPATCH_SESSION_REAP_WORKTREES_ROOT CLAUDE_JOB_DIR || true
}

run_dnr() {
  DNR_OUT=""
  DNR_RC=0
  DNR_OUT=$("$DNR" "$@" 2>/dev/null) || DNR_RC=$?
}

dnr_rm_calls() {
  local c
  c=$(grep -c '^claude rm ' "$DNR_CALLS" 2>/dev/null) || c=0
  [[ -n "$c" ]] || c=0
  printf '%s' "$c"
}

# --- Test 1: argv validation → exit 2 ---------------------------------------
echo "Test: missing or malformed argv → exit 2"
dnr_setup
run_dnr
assert_eq "no arguments exits 2" "2" "$DNR_RC"
run_dnr --node tactic-x
assert_eq "missing --session/--job-id exits 2" "2" "$DNR_RC"
run_dnr --node tactic-x --session 1111-2222
assert_eq "missing --job-id exits 2" "2" "$DNR_RC"
run_dnr --node tactic-x --session 1111-2222 --job-id aaaa1111 --bogus
assert_eq "unknown flag exits 2" "2" "$DNR_RC"
run_dnr --node "1234-legacy-issue-worker" --session 1111-2222 --job-id aaaa1111
assert_eq "a legacy issue-worker name is not a valid node id → exit 2" "2" "$DNR_RC"
run_dnr --node "tactic-x" --session "evil/../.." --job-id aaaa1111
assert_eq "a path-shaped session id exits 2" "2" "$DNR_RC"
run_dnr --node "tactic-x" --session 1111-2222 --job-id "../../etc"
assert_eq "a path-shaped job id exits 2" "2" "$DNR_RC"
assert_eq "no rejected invocation reached the daemon" "0" "$(dnr_rm_calls)"
dnr_teardown

# --- Test 2: SELF-TARGET by job id → skip-self, and no daemon call -----------
echo "Test: a job id matching this session's own job dir → skip-self"
dnr_setup
export CLAUDE_JOB_DIR="$DNR_DIR/jobs/aaaa1111"
mkdir -p "$CLAUDE_JOB_DIR"
printf '{"name":"tactic-x","sessionId":"9999-8888"}\n' > "$CLAUDE_JOB_DIR/state.json"
run_dnr --node tactic-x --session 1111-2222 --job-id aaaa1111
assert_eq "self job id yields skip-self" "skip-self" "$DNR_OUT"
assert_eq "self job id still exits 0" "0" "$DNR_RC"
assert_eq "self job id made NO claude rm call" "0" "$(dnr_rm_calls)"
dnr_teardown

# --- Test 3: SELF-TARGET by session id → skip-self ---------------------------
# The second half of the refusal: a RESUMED session keeps its original job `.id`
# while its `.sessionId` changes, so the two identities can disagree and both
# must be checked.
echo "Test: a session id matching this session's own state.json → skip-self"
dnr_setup
export CLAUDE_JOB_DIR="$DNR_DIR/jobs/bbbb2222"
mkdir -p "$CLAUDE_JOB_DIR"
printf '{"name":"tactic-x","sessionId":"1111-2222"}\n' > "$CLAUDE_JOB_DIR/state.json"
run_dnr --node tactic-x --session 1111-2222 --job-id cccc3333
assert_eq "self session id yields skip-self" "skip-self" "$DNR_OUT"
assert_eq "self session id still exits 0" "0" "$DNR_RC"
assert_eq "self session id made NO claude rm call" "0" "$(dnr_rm_calls)"
dnr_teardown

# --- Test 4: a DIFFERENT session is not refused ------------------------------
# The refusal must be narrow. If it fired on any job dir at all, the
# intervention could never reap the corpse it was sent for — the lane would be
# inert and the freeze permanent.
echo "Test: a genuinely different session is NOT refused"
dnr_setup
export CLAUDE_JOB_DIR="$DNR_DIR/jobs/bbbb2222"
mkdir -p "$CLAUDE_JOB_DIR"
printf '{"name":"tactic-x","sessionId":"9999-8888"}\n' > "$CLAUDE_JOB_DIR/state.json"
run_dnr --node tactic-x --session 1111-2222 --job-id cccc3333
assert_eq "a different session is not skip-self" "no" \
  "$( [ "$DNR_OUT" = "skip-self" ] && printf 'yes' || printf 'no')"
assert_eq "a different session reaches claude rm" "1" "$(dnr_rm_calls)"
assert_eq "a different session exits 0" "0" "$DNR_RC"
dnr_teardown

# --- Test 5: an unreadable state.json does not fabricate a self-match --------
# `jq` returning empty must not compare equal to the supplied sid. A vacuous
# self-match would make the refusal fire on everything (see Test 4).
echo "Test: an unreadable state.json does not produce a spurious skip-self"
dnr_setup
export CLAUDE_JOB_DIR="$DNR_DIR/jobs/dddd4444"
mkdir -p "$CLAUDE_JOB_DIR"
printf 'not json at all\n' > "$CLAUDE_JOB_DIR/state.json"
run_dnr --node tactic-x --session 1111-2222 --job-id eeee5555
assert_eq "unreadable state.json is not read as a self-match" "no" \
  "$( [ "$DNR_OUT" = "skip-self" ] && printf 'yes' || printf 'no')"
dnr_teardown

# --- Test 6: token passthrough — the act's verdict is what is printed --------
# The absent-worktree path: the reap-safety gates are vacuous (nothing to
# remove, nothing to lose), so this reaches `claude rm` and then the verified
# post-state read, which reports the job gone.
echo "Test: the act's verdict token is passed through verbatim"
dnr_setup
run_dnr --node tactic-nowhere --session 1111-2222 --job-id aaaa1111
assert_eq "token passthrough exits 0" "0" "$DNR_RC"
assert_eq "an absent worktree yields reaped" "reaped" "$DNR_OUT"
assert_eq "exactly one token line is printed" "1" \
  "$(printf '%s\n' "$DNR_OUT" | wc -l | tr -d ' ')"
dnr_teardown

# --- Test 7: no CLAUDE_JOB_DIR → no refusal is possible, and that is correct --
# An operator driving this by hand is not the session being reaped, so there is
# no self to compare against.
echo "Test: with CLAUDE_JOB_DIR unset the refusal is skipped, not defaulted on"
dnr_setup
unset CLAUDE_JOB_DIR || true
run_dnr --node tactic-nowhere --session 1111-2222 --job-id aaaa1111
assert_eq "no job dir does not force skip-self" "no" \
  "$( [ "$DNR_OUT" = "skip-self" ] && printf 'yes' || printf 'no')"
dnr_teardown

# --- Test 8: the exit code is NOT the contract ------------------------------
# Every reap outcome exits 0; only the token distinguishes them. Exit 2 is
# reserved for argv this script refused to act on at all.
echo "Test: reap outcomes all exit 0; only usage errors exit 2"
dnr_setup
export CLAUDE_JOB_DIR="$DNR_DIR/jobs/aaaa1111"
mkdir -p "$CLAUDE_JOB_DIR"
printf '{"name":"tactic-x","sessionId":"9999-8888"}\n' > "$CLAUDE_JOB_DIR/state.json"
run_dnr --node tactic-x --session 1111-2222 --job-id aaaa1111
assert_eq "the refusing outcome exits 0" "0" "$DNR_RC"
run_dnr --node "NOT A NODE ID" --session 1111-2222 --job-id aaaa1111
assert_eq "the usage error exits 2" "2" "$DNR_RC"
dnr_teardown

report_results
