#!/usr/bin/env bash
# Test suite for the stamp-dispatch-session.sh hook.
# Usage: ./test-stamp-dispatch-session.sh
# Requires: jq, git
#
# The hook emits no decision output (SessionStart/Stop ignore its stdout here)
# and always exits 0, so cases assert on SIDE EFFECTS instead: whether the
# sidecar `<transcript-stem>.dispatch-stamp.json` was written, what it holds,
# and which resolution source the hook logged to stderr.
#
# Hermetic: every fixture is a throwaway `git init` repo under `mktemp -d`, the
# projects root is faked, and nothing reaches the network, the real
# ~/.claude/projects, or a live Claude daemon. The real dispatch-stamp-session
# is exercised (not a stub) — it is the one sidecar writer, and stubbing it
# would leave the git-read wiring untested.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
HOOK="$SCRIPT_DIR/stamp-dispatch-session.sh"

PASS=0
FAIL=0
TOTAL=0

# --- assertions -------------------------------------------------------------

assert_eq() {
  local desc="$1" expected="$2" actual="$3"
  TOTAL=$((TOTAL + 1))
  if [ "$expected" = "$actual" ]; then
    PASS=$((PASS + 1))
    echo "  PASS: $desc"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $desc"
    echo "    expected: '$expected'"
    echo "    actual:   '$actual'"
  fi
}

assert_contains() {
  local desc="$1" needle="$2" haystack="$3"
  TOTAL=$((TOTAL + 1))
  case "$haystack" in
    *"$needle"*)
      PASS=$((PASS + 1))
      echo "  PASS: $desc"
      ;;
    *)
      FAIL=$((FAIL + 1))
      echo "  FAIL: $desc"
      echo "    expected to contain: '$needle'"
      echo "    actual:              '$haystack'"
      ;;
  esac
}

# --- fixture ----------------------------------------------------------------

ROOT=""; WT=""; PROJECTS=""; ENC_WT=""; HOOK_RC=0; HOOK_ERR=""

# encode_cwd — mirrors the projects-root directory-name encoding the hook
# reverses: every non-alphanumeric character becomes `-`.
encode_cwd() {
  printf '%s' "$1" | sed 's/[^A-Za-z0-9]/-/g'
}

# setup_root — a fake project root that is a git checkout ON `main` (the WRONG
# tree), plus a worktree under it on a `tactic-*` node-id branch (the RIGHT
# tree), plus a fake projects root whose directory name encodes the worktree.
#
# The main checkout being a real repo on `main` is load-bearing: it is what the
# pre-fix hook read from ambient cwd, and the worker-branch gate no-ops there —
# so a regression writes NO sidecar rather than a subtly wrong one.
setup_root() {
  ROOT=$(mktemp -d)
  git -C "$ROOT" init -q
  git -C "$ROOT" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$ROOT" checkout -q -b main
  git -C "$ROOT" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init

  WT="$ROOT/.claude/worktrees/tactic-hook-fixture"
  mkdir -p "$WT"
  git -C "$WT" init -q
  git -C "$WT" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$WT" checkout -q -b tactic-hook-fixture
  git -C "$WT" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init

  PROJECTS="$ROOT/projects"
  ENC_WT=$(encode_cwd "$WT")
  mkdir -p "$PROJECTS/$ENC_WT"
}

# run_hook <payload> <cwd> [hook-path] — feed the payload on stdin from <cwd>,
# capturing the exit code and stderr (which names the resolution source).
run_hook() {
  local payload="$1" cwd="$2" hook="${3:-$HOOK}"
  HOOK_RC=0
  HOOK_ERR=$( ( cd "$cwd" && export CLAUDE_PROJECT_DIR="$ROOT" && \
    printf '%s' "$payload" | "$hook" ) 2>&1 >/dev/null ) || HOOK_RC=$?
}

# --- 1. THE REGRESSION: transcript encodes the worktree, cwd is main --------
#
# A detached `claude --bg` worker is born in its own worktree, but its
# SessionStart hook ran with cwd = the MAIN checkout (on `main`), so the stamp
# script's worker-branch gate no-opped and the session was born unstamped. The
# hook must recover the session's own tree from transcript_path and stamp THAT.
# This case MUST fail against the pre-fix hook.

setup_root
SID="sess-regression"
TRANSCRIPT="$PROJECTS/$ENC_WT/$SID.jsonl"
SIDECAR="$PROJECTS/$ENC_WT/$SID.dispatch-stamp.json"
run_hook "$(jq -nc --arg s "$SID" --arg t "$TRANSCRIPT" \
  '{hook_event_name:"SessionStart", session_id:$s, transcript_path:$t}')" "$ROOT"
assert_eq       "regression: exit 0" "0" "$HOOK_RC"
assert_eq       "regression: sidecar written despite cwd=main checkout" "yes" \
  "$([ -f "$SIDECAR" ] && echo yes || echo no)"
assert_eq       "regression: .branch is the WORKTREE's branch" "tactic-hook-fixture" \
  "$(jq -r .branch "$SIDECAR" 2>/dev/null || echo '<no sidecar>')"
assert_eq       "regression: .node_id is the worktree's node id" "tactic-hook-fixture" \
  "$(jq -r .node_id "$SIDECAR" 2>/dev/null || echo '<no sidecar>')"
assert_eq       "regression: .base_sha is the worktree's HEAD" \
  "$(git -C "$WT" rev-parse HEAD)" \
  "$(jq -r .base_sha "$SIDECAR" 2>/dev/null || echo '<no sidecar>')"
assert_eq       "regression: .session_id" "$SID" \
  "$(jq -r .session_id "$SIDECAR" 2>/dev/null || echo '<no sidecar>')"
assert_contains "regression: stderr names transcript_path as the source" \
  "resolved from transcript_path" "$HOOK_ERR"
rm -rf "$ROOT"

# --- 1b. Subagent transcript (one level deeper) resolves via the grandparent --

setup_root
SID="sess-subagent"
mkdir -p "$PROJECTS/$ENC_WT/$SID"
TRANSCRIPT="$PROJECTS/$ENC_WT/$SID/sub-agent.jsonl"
SIDECAR="$PROJECTS/$ENC_WT/$SID/sub-agent.dispatch-stamp.json"
run_hook "$(jq -nc --arg s "$SID" --arg t "$TRANSCRIPT" \
  '{hook_event_name:"SessionStart", session_id:$s, transcript_path:$t}')" "$ROOT"
assert_eq       "subagent: exit 0" "0" "$HOOK_RC"
assert_eq       "subagent: .branch is the worktree's branch" "tactic-hook-fixture" \
  "$(jq -r .branch "$SIDECAR" 2>/dev/null || echo '<no sidecar>')"
assert_contains "subagent: stderr names the grandparent retry" \
  "subagent, grandparent" "$HOOK_ERR"
rm -rf "$ROOT"

# --- 2. Unknown project dir -> falls back to the payload's .cwd -------------

setup_root
SID="sess-payload-cwd"
mkdir -p "$PROJECTS/-not-a-known-dir"
TRANSCRIPT="$PROJECTS/-not-a-known-dir/$SID.jsonl"
SIDECAR="$PROJECTS/-not-a-known-dir/$SID.dispatch-stamp.json"
# Process cwd is the main checkout, so a sidecar can only appear if `.cwd` won.
run_hook "$(jq -nc --arg s "$SID" --arg t "$TRANSCRIPT" --arg c "$WT" \
  '{hook_event_name:"SessionStart", session_id:$s, transcript_path:$t, cwd:$c}')" "$ROOT"
assert_eq       "payload cwd: exit 0" "0" "$HOOK_RC"
assert_eq       "payload cwd: .branch comes from the payload cwd" "tactic-hook-fixture" \
  "$(jq -r .branch "$SIDECAR" 2>/dev/null || echo '<no sidecar>')"
assert_contains "payload cwd: stderr names payload cwd as the source" \
  "resolved from payload cwd" "$HOOK_ERR"
rm -rf "$ROOT"

# --- 3. Neither resolves -> falls back to the process cwd (legacy behaviour) --

setup_root
SID="sess-process-cwd"
mkdir -p "$PROJECTS/-not-a-known-dir"
TRANSCRIPT="$PROJECTS/-not-a-known-dir/$SID.jsonl"
SIDECAR="$PROJECTS/-not-a-known-dir/$SID.dispatch-stamp.json"
# No `.cwd` in the payload; the hook runs FROM the worktree, as legacy callers do.
run_hook "$(jq -nc --arg s "$SID" --arg t "$TRANSCRIPT" \
  '{hook_event_name:"SessionStart", session_id:$s, transcript_path:$t}')" "$WT"
assert_eq       "process cwd: exit 0" "0" "$HOOK_RC"
assert_eq       "process cwd: .branch comes from the process cwd" "tactic-hook-fixture" \
  "$(jq -r .branch "$SIDECAR" 2>/dev/null || echo '<no sidecar>')"
assert_contains "process cwd: stderr names process cwd as the source" \
  "resolved from process cwd" "$HOOK_ERR"
rm -rf "$ROOT"

# --- 4. Stop with an EXISTING sidecar leaves it byte-for-byte unchanged ------
#
# Stop fires on every turn yield, so the backstop must be a true
# create-if-missing: it must not re-derive the birth-time base_sha, must not
# clobber a backfilled .pr, and must not advance .stamped_at.

setup_root
SID="sess-stop-existing"
TRANSCRIPT="$PROJECTS/$ENC_WT/$SID.jsonl"
SIDECAR="$PROJECTS/$ENC_WT/$SID.dispatch-stamp.json"
printf '%s\n' '{"schema":1,"session_id":"sess-stop-existing","repo":"natb1/commons.systems","issue":null,"pr":4242,"branch":"tactic-hook-fixture","base_sha":"birthsha","node_id":"tactic-hook-fixture","stamped_at":"2026-01-01T00:00:00Z"}' > "$SIDECAR"
cp "$SIDECAR" "$ROOT/expected.json"
run_hook "$(jq -nc --arg s "$SID" --arg t "$TRANSCRIPT" \
  '{hook_event_name:"Stop", session_id:$s, transcript_path:$t}')" "$ROOT"
assert_eq "stop/existing: exit 0" "0" "$HOOK_RC"
assert_eq "stop/existing: sidecar byte-for-byte unchanged" "same" \
  "$(cmp -s "$SIDECAR" "$ROOT/expected.json" && echo same || echo differs)"
assert_eq "stop/existing: backfilled .pr preserved" "4242" "$(jq -r .pr "$SIDECAR")"
assert_eq "stop/existing: birth-time .base_sha preserved" "birthsha" "$(jq -r .base_sha "$SIDECAR")"
rm -rf "$ROOT"

# --- 5. Stop with NO sidecar creates one (the backstop doing its job) --------

setup_root
SID="sess-stop-missing"
TRANSCRIPT="$PROJECTS/$ENC_WT/$SID.jsonl"
SIDECAR="$PROJECTS/$ENC_WT/$SID.dispatch-stamp.json"
run_hook "$(jq -nc --arg s "$SID" --arg t "$TRANSCRIPT" \
  '{hook_event_name:"Stop", session_id:$s, transcript_path:$t}')" "$ROOT"
assert_eq "stop/missing: exit 0" "0" "$HOOK_RC"
assert_eq "stop/missing: sidecar created" "yes" \
  "$([ -f "$SIDECAR" ] && echo yes || echo no)"
assert_eq "stop/missing: .node_id from the resolved worktree" "tactic-hook-fixture" \
  "$(jq -r .node_id "$SIDECAR" 2>/dev/null || echo '<no sidecar>')"
rm -rf "$ROOT"

# --- 6. Degenerate payloads and a missing stamp script: exit 0, no crash -----

setup_root
run_hook '{}' "$ROOT"
assert_eq       "robustness: empty payload exits 0" "0" "$HOOK_RC"
assert_contains "robustness: empty payload diagnoses the missing fields" \
  "session_id or transcript_path missing" "$HOOK_ERR"

run_hook "$(jq -nc '{hook_event_name:"SessionStart", transcript_path:"/tmp/x.jsonl"}')" "$ROOT"
assert_eq       "robustness: missing session_id exits 0" "0" "$HOOK_RC"
assert_contains "robustness: missing session_id diagnosed" \
  "session_id or transcript_path missing" "$HOOK_ERR"

run_hook "$(jq -nc '{hook_event_name:"SessionStart", session_id:"s"}')" "$ROOT"
assert_eq       "robustness: missing transcript_path exits 0" "0" "$HOOK_RC"
assert_contains "robustness: missing transcript_path diagnosed" \
  "session_id or transcript_path missing" "$HOOK_ERR"

run_hook 'not valid json' "$ROOT"
assert_eq       "robustness: malformed JSON stdin exits 0" "0" "$HOOK_RC"

run_hook '' "$ROOT"
assert_eq       "robustness: empty stdin exits 0" "0" "$HOOK_RC"

# Non-executable / absent stamp script: the hook resolves it relative to its own
# directory, so a copy in an isolated dir has no sibling to find.
mkdir -p "$ROOT/lonely-hooks"
cp "$HOOK" "$ROOT/lonely-hooks/stamp-dispatch-session.sh"
chmod +x "$ROOT/lonely-hooks/stamp-dispatch-session.sh"
SID="sess-no-stamp"
TRANSCRIPT="$PROJECTS/$ENC_WT/$SID.jsonl"
run_hook "$(jq -nc --arg s "$SID" --arg t "$TRANSCRIPT" \
  '{hook_event_name:"SessionStart", session_id:$s, transcript_path:$t}')" "$ROOT" \
  "$ROOT/lonely-hooks/stamp-dispatch-session.sh"
assert_eq       "robustness: missing stamp script exits 0" "0" "$HOOK_RC"
assert_contains "robustness: missing stamp script diagnosed" \
  "not found or not executable" "$HOOK_ERR"
assert_eq       "robustness: missing stamp script writes no sidecar" "no" \
  "$([ -f "$PROJECTS/$ENC_WT/$SID.dispatch-stamp.json" ] && echo yes || echo no)"
rm -rf "$ROOT"

# --- Summary ----------------------------------------------------------------

echo ""
echo "Results: $PASS passed, $FAIL failed, $TOTAL total"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo "All tests passed."
