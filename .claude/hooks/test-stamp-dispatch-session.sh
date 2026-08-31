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

assert_not_contains() {
  local desc="$1" needle="$2" haystack="$3"
  TOTAL=$((TOTAL + 1))
  case "$haystack" in
    *"$needle"*)
      FAIL=$((FAIL + 1))
      echo "  FAIL: $desc"
      echo "    expected NOT to contain: '$needle'"
      echo "    actual:                  '$haystack'"
      ;;
    *)
      PASS=$((PASS + 1))
      echo "  PASS: $desc"
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

# setup_spy — a copy of the hook in an isolated directory tree whose sibling
# dispatch-stamp-session is a SPY: it appends its argv to $SPY_LOG and writes
# nothing. The hook resolves the stamp script relative to its own location
# ($SCRIPT_DIR/../skills/...), so a relocated copy is the only way to observe
# WHETHER THE DOWNSTREAM SCRIPT RAN AT ALL — which is the observation the Stop
# fast-path case needs and no sidecar assertion can make. Call after setup_root.
SPY_HOOK=""; SPY_LOG=""
setup_spy() {
  mkdir -p "$ROOT/spy/hooks" "$ROOT/spy/skills/dispatch-propagate/scripts"
  cp "$HOOK" "$ROOT/spy/hooks/stamp-dispatch-session.sh"
  chmod +x "$ROOT/spy/hooks/stamp-dispatch-session.sh"
  SPY_HOOK="$ROOT/spy/hooks/stamp-dispatch-session.sh"
  SPY_LOG="$ROOT/spy-invocations.log"
  rm -f "$SPY_LOG"
  cat > "$ROOT/spy/skills/dispatch-propagate/scripts/dispatch-stamp-session" <<SPY
#!/usr/bin/env bash
printf '%s\n' "\$*" >> "$SPY_LOG"
SPY
  chmod +x "$ROOT/spy/skills/dispatch-propagate/scripts/dispatch-stamp-session"
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

# --- 1b. Subagent transcripts: the two layouts Claude Code actually writes ---
#
# Measured over ~/.claude/projects on 2026-08-31, every subagent transcript on
# disk has one of exactly two shapes, counted as path components below the
# projects root:
#
#   4 components (2294 files)  <projdir>/<sid>/subagents/agent-*.jsonl
#   6 components (4724 files)  <projdir>/<sid>/subagents/workflows/<wf>/agent-*.jsonl
#
# In BOTH the encoded name is <projdir> — three and five dirname steps above the
# transcript. The superseded implementation retried exactly once, against the
# grandparent, which lands on <sid> in the first layout and on `workflows` in
# the second; it therefore resolved NEITHER in production, and passed only
# against a synthetic <projdir>/<sid>/sub-agent.jsonl fixture that Claude Code
# does not produce. Both cases below MUST fail against that single-retry hook:
# resolution falls through to the process cwd (the main checkout, on `main`),
# whose worker-branch gate no-ops, so no sidecar is written at all.
# aggregate-usage.sh's own header documents the 4-component layout.

setup_root
SID="sess-subagent-4"
mkdir -p "$PROJECTS/$ENC_WT/$SID/subagents"
TRANSCRIPT="$PROJECTS/$ENC_WT/$SID/subagents/agent-a1b2c3d.jsonl"
SIDECAR="$PROJECTS/$ENC_WT/$SID/subagents/agent-a1b2c3d.dispatch-stamp.json"
run_hook "$(jq -nc --arg s "$SID" --arg t "$TRANSCRIPT" \
  '{hook_event_name:"SessionStart", session_id:$s, transcript_path:$t}')" "$ROOT"
assert_eq       "subagent(4-component): exit 0" "0" "$HOOK_RC"
assert_eq       "subagent(4-component): sidecar written" "yes" \
  "$([ -f "$SIDECAR" ] && echo yes || echo no)"
assert_eq       "subagent(4-component): .branch is the worktree's branch" "tactic-hook-fixture" \
  "$(jq -r .branch "$SIDECAR" 2>/dev/null || echo '<no sidecar>')"
assert_contains "subagent(4-component): stderr reports the 3-level walk" \
  "resolved from transcript_path (ancestor 3 levels up)" "$HOOK_ERR"

SID="sess-subagent-6"
mkdir -p "$PROJECTS/$ENC_WT/$SID/subagents/workflows/align-tactics"
TRANSCRIPT="$PROJECTS/$ENC_WT/$SID/subagents/workflows/align-tactics/agent-e4f5g6h.jsonl"
SIDECAR="$PROJECTS/$ENC_WT/$SID/subagents/workflows/align-tactics/agent-e4f5g6h.dispatch-stamp.json"
run_hook "$(jq -nc --arg s "$SID" --arg t "$TRANSCRIPT" \
  '{hook_event_name:"SessionStart", session_id:$s, transcript_path:$t}')" "$ROOT"
assert_eq       "subagent(6-component): exit 0" "0" "$HOOK_RC"
assert_eq       "subagent(6-component): sidecar written" "yes" \
  "$([ -f "$SIDECAR" ] && echo yes || echo no)"
assert_eq       "subagent(6-component): .branch is the worktree's branch" "tactic-hook-fixture" \
  "$(jq -r .branch "$SIDECAR" 2>/dev/null || echo '<no sidecar>')"
assert_contains "subagent(6-component): stderr reports the 5-level walk" \
  "resolved from transcript_path (ancestor 5 levels up)" "$HOOK_ERR"

# The walk is BOUNDED, not a climb to /: a transcript deeper than the bound
# falls through to the ordinary fallbacks rather than matching by accident.
SID="sess-subagent-too-deep"
mkdir -p "$PROJECTS/$ENC_WT/$SID/a/b/c/d/e/f"
TRANSCRIPT="$PROJECTS/$ENC_WT/$SID/a/b/c/d/e/f/agent-deep.jsonl"
run_hook "$(jq -nc --arg s "$SID" --arg t "$TRANSCRIPT" \
  '{hook_event_name:"SessionStart", session_id:$s, transcript_path:$t}')" "$ROOT"
assert_eq       "subagent(beyond the bound): exit 0" "0" "$HOOK_RC"
assert_contains "subagent(beyond the bound): walk gives up, falls back to process cwd" \
  "resolved from process cwd" "$HOOK_ERR"
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

# --- 7. Stop fast path: an existing sidecar short-circuits BEFORE resolving --
#
# Stop fires on every turn yield of every session in the project, and tree
# resolution encodes CLAUDE_PROJECT_DIR plus every directory under
# .claude/worktrees/. Doing that on a yield whose only possible outcome is a
# downstream no-op is pure waste, and its cost scales with the worktree count on
# disk (volatile: worktrees are cut and reaped continuously, so no count is
# asserted here). The two observations are the ABSENCE of the resolution stderr
# line and the ABSENCE of any downstream invocation; both go red if the fast
# path is removed.

setup_root
setup_spy
SID="sess-stop-fastpath"
TRANSCRIPT="$PROJECTS/$ENC_WT/$SID.jsonl"
SIDECAR="$PROJECTS/$ENC_WT/$SID.dispatch-stamp.json"
printf '%s\n' '{"schema":1,"session_id":"sess-stop-fastpath"}' > "$SIDECAR"
run_hook "$(jq -nc --arg s "$SID" --arg t "$TRANSCRIPT" \
  '{hook_event_name:"Stop", session_id:$s, transcript_path:$t}')" "$ROOT" "$SPY_HOOK"
assert_eq           "stop/fast path: exit 0" "0" "$HOOK_RC"
assert_not_contains "stop/fast path: no tree resolution ran" "resolved from" "$HOOK_ERR"
assert_eq           "stop/fast path: downstream stamp script NOT invoked" "no" \
  "$([ -f "$SPY_LOG" ] && echo yes || echo no)"

# Control A — Stop with NO sidecar: the backstop still resolves and still runs,
# so the fast path has not disabled the thing it sits in front of.
SID="sess-stop-backstop"
TRANSCRIPT="$PROJECTS/$ENC_WT/$SID.jsonl"
rm -f "$SPY_LOG"
run_hook "$(jq -nc --arg s "$SID" --arg t "$TRANSCRIPT" \
  '{hook_event_name:"Stop", session_id:$s, transcript_path:$t}')" "$ROOT" "$SPY_HOOK"
assert_contains "stop/no sidecar: tree resolution still runs" \
  "resolved from transcript_path" "$HOOK_ERR"
assert_eq       "stop/no sidecar: downstream stamp script invoked" "yes" \
  "$([ -f "$SPY_LOG" ] && echo yes || echo no)"
assert_contains "stop/no sidecar: --only-if-absent still passed through" \
  "--only-if-absent" "$(cat "$SPY_LOG" 2>/dev/null || echo '<not invoked>')"

# Control B — SessionStart never takes the fast path, sidecar present or not:
# a birth stamp is exactly the write that must still be attempted.
SID="sess-start-with-sidecar"
TRANSCRIPT="$PROJECTS/$ENC_WT/$SID.jsonl"
SIDECAR="$PROJECTS/$ENC_WT/$SID.dispatch-stamp.json"
printf '%s\n' '{"schema":1,"session_id":"sess-start-with-sidecar"}' > "$SIDECAR"
rm -f "$SPY_LOG"
run_hook "$(jq -nc --arg s "$SID" --arg t "$TRANSCRIPT" \
  '{hook_event_name:"SessionStart", session_id:$s, transcript_path:$t}')" "$ROOT" "$SPY_HOOK"
assert_contains "sessionstart/sidecar present: tree resolution still runs" \
  "resolved from transcript_path" "$HOOK_ERR"
assert_eq       "sessionstart/sidecar present: downstream stamp script invoked" "yes" \
  "$([ -f "$SPY_LOG" ] && echo yes || echo no)"
rm -rf "$ROOT"

# --- 8. encode_cwd: no fork per candidate, byte-identical to the sed it replaced

# resolve_from_encoded calls encode_cwd once per candidate worktree, so on every
# Stop yield the cost of this helper is multiplied by the number of worktrees on
# disk. Dropping `sed` from the body removed one `exec` per call but NOT the
# fork: bash forks a subshell for every command substitution, with no
# optimization for a function body, so a `$(encode_cwd "$cand")` call site forks
# once per candidate however the function is spelled internally. The fork is
# removed only by returning through the global $ENCODED_CWD and reading it.
#
# The superseded version of this case could not detect any of that. It greped
# the extracted function body for `sed` and then called the function through
# `$(...)` itself — demonstrating the very fork it certified as absent. The
# assertions below are built so each one goes RED when its property is
# violated:
#
#   (a) call sites  — no `$(encode_cwd` anywhere in the hook's CODE. Comment
#       lines are stripped first: the hook's own header quotes the forbidden
#       spelling to explain why it is forbidden, and a grep that cannot tell
#       prose from code would fail on the documentation.
#   (b) function body — no command substitution, backtick or pipeline inside
#       encode_cwd, so it forks nothing internally either. (A `case` pattern
#       alternation would trip the pipeline check; spell one as a character
#       class, which is what the encoder uses anyway.)
#   (c) DYNAMIC — the decisive one. A counting shim wraps the encoder, and
#       resolve_from_encoded is driven over a real fixture. A counter increment
#       survives only if the call site ran the function in the CURRENT shell; a
#       `$(...)` call site runs it in a forked subshell where the increment is
#       discarded with the subshell. So the observed count is 0 exactly when the
#       fork is back, and the exact expected count also pins that the encoder is
#       called once per candidate and short-circuits on a hit.
#   (d) equivalence — still byte-identical to the real `sed`, now read out of
#       $ENCODED_CWD rather than captured from stdout.

HOOK_ENCODE_SRC=$(awk '/^encode_cwd\(\)/,/^[}]$/' "$HOOK" | sed 's/encode_cwd/hook_encode_cwd/g')
HOOK_RESOLVE_SRC=$(awk '/^resolve_from_encoded\(\)/,/^[}]$/' "$HOOK" | sed 's/encode_cwd/hook_encode_cwd/g')
assert_contains "encode_cwd: the hook's own function was extracted" \
  "hook_encode_cwd() {" "$HOOK_ENCODE_SRC"
assert_contains "encode_cwd: the hook's own resolve_from_encoded was extracted" \
  "resolve_from_encoded() {" "$HOOK_RESOLVE_SRC"

# (a) call sites do not fork. Comment lines stripped — see note above.
assert_eq "encode_cwd: no call site spells \$(encode_cwd …)" "0" \
  "$(grep -v '^[[:space:]]*#' "$HOOK" | grep -c '[$](encode_cwd' || true)"

# (b) the body itself forks nothing.
assert_eq "encode_cwd: body has no command substitution, backtick or pipeline" "clean" \
  "$(case "$HOOK_ENCODE_SRC" in *'$('*) echo "command substitution" ;; *'`'*) echo "backtick" ;; *'|'*) echo "pipeline" ;; *) echo "clean" ;; esac)"

eval "$HOOK_ENCODE_SRC"
eval "$HOOK_RESOLVE_SRC"

# The encoder must return through the global, never on stdout: this hook's
# stdout is consumed by Claude Code, and with the `$(...)` containment gone
# there is no subshell left to swallow a printf.
assert_eq "encode_cwd: writes nothing to stdout" "" "$(hook_encode_cwd "/a/b" ; printf '%s' "")"

# (c) the dynamic fork detector. Wrap the real encoder in a counting shim.
eval "$(declare -f hook_encode_cwd | sed '1s/^hook_encode_cwd/real_hook_encode_cwd/')"
ENCODE_CALLS=0
hook_encode_cwd() { ENCODE_CALLS=$((ENCODE_CALLS + 1)); real_hook_encode_cwd "$@"; }

FORK_ROOT=$(mktemp -d)
mkdir -p "$FORK_ROOT/.claude/worktrees/wt-a" \
         "$FORK_ROOT/.claude/worktrees/wt-b" \
         "$FORK_ROOT/.claude/worktrees/wt-c"
PROJECT_DIR="$FORK_ROOT"

# Miss: every candidate is encoded — project root plus all three worktrees.
SESSION_DIR=""
ENCODE_CALLS=0
resolve_from_encoded "no-such-encoded-directory-name" || true
assert_eq "encode_cwd: runs in the caller's shell, not a forked subshell (miss)" "4" \
  "$ENCODE_CALLS"
assert_eq "encode_cwd: a miss resolves nothing" "" "$SESSION_DIR"

# Hit on the SECOND worktree: project root, wt-a, wt-b — then it short-circuits.
SESSION_DIR=""
ENCODE_CALLS=0
resolve_from_encoded "$(encode_cwd "$FORK_ROOT/.claude/worktrees/wt-b")" || true
assert_eq "encode_cwd: runs in the caller's shell, not a forked subshell (hit)" "3" \
  "$ENCODE_CALLS"
assert_eq "encode_cwd: the hit resolves the right worktree" \
  "$FORK_ROOT/.claude/worktrees/wt-b" "$SESSION_DIR"

rm -rf "$FORK_ROOT"

# (d) still byte-identical to the sed it replaced, read out of the global.
ENCODE_CASES=(
  "/home/n8/repo/.claude/worktrees/tactic-hook-fixture"
  "under_score"
  "with space"
  "at@sign"
  "dot.dot.dot"
  "/leading/and/trailing/"
  "Unicode: Ünïcødé"
  "MiXeD09azAZ"
  '!@#$%^&*()[]{}'
  ""
)
for RAW in "${ENCODE_CASES[@]}"; do
  ENCODED_CWD="<unset>"
  real_hook_encode_cwd "$RAW"
  assert_eq "encode_cwd matches sed for '$RAW'" \
    "$(printf '%s' "$RAW" | sed 's/[^A-Za-z0-9]/-/g')" \
    "$ENCODED_CWD"
done

# --- Summary ----------------------------------------------------------------

echo ""
echo "Results: $PASS passed, $FAIL failed, $TOTAL total"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo "All tests passed."
