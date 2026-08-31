#!/usr/bin/env bash
# Test suite for worktree-remove.sh hook.
# Usage: ./test-worktree-remove.sh
# Requires: jq, realpath
#
# The hook emits no decision output (WorktreeRemove ignores stdout/exit code),
# so cases assert on SIDE EFFECTS instead: whether a stub `git` received
# `worktree remove`, and the contents of the hook's persistent log file.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
HOOK="$SCRIPT_DIR/worktree-remove.sh"
ORIG_TMPDIR="${TMPDIR:-/tmp}"

PASS=0
FAIL=0
TOTAL=0

# --- stub git ---------------------------------------------------------------
# A fake `git` prepended to PATH. Behaviour is driven entirely by STUB_* env
# vars set per case, so no real repo or network is needed.

STUB_BIN=$(mktemp -d)

# Fake `claude` for the worktree_has_live_session helper.
# Behaviour is driven by STUB_CLAUDE_JSON (printed on stdout) and
# STUB_CLAUDE_RC (exit code). Defaults: empty JSON array (no sessions), rc=0.
cat >"$STUB_BIN/claude" <<'STUB'
#!/usr/bin/env bash
set -uo pipefail
# Accept any args (agents --json) — just emit the canned response.
printf '%s\n' "${STUB_CLAUDE_JSON:-[]}"
exit "${STUB_CLAUDE_RC:-0}"
STUB
chmod +x "$STUB_BIN/claude"
# Tell lib-claude-agents.sh to use our stub instead of the real `claude`.
export CLAUDE_AGENTS_CMD="$STUB_BIN/claude"

# Fake `pgrep` for lib-claude-agents.sh's EMPTY-READ CORROBORATION probe.
#
# Without this stub the probe shells out to the REAL pgrep and asks the REAL
# host whether a `claude daemon` process is running — so every assertion below
# that drives STUB_CLAUDE_JSON='[]' (the "no sessions, therefore reap" cases)
# would silently depend on the developer's machine. On a host running the
# daemon the empty read is corroborated and the suite passes; in CI, where no
# daemon exists, the same read folds to UNKNOWN, `worktree_has_live_session`
# fails safe, and 15 assertions fail with "expected 'git worktree remove' to be
# invoked". Same commit, opposite results — the suite was measuring the host,
# not the hook.
#
# There is no in-process probe that can tell "sandboxed, host daemon
# invisible" from "unsandboxed, no daemon running" — both report an empty
# process listing that still functions (measured 2026-08-03: under sandbox
# `pgrep -f 'claude daemon'` returns 1 while a positive control returns 0,
# exactly as in a daemon-less CI runner). The ambiguity is irreducible, so the
# corroboration signal must be INJECTED by the fixture, exactly as the agents
# list already is — not inferred.
#
# Behaviour is driven by STUB_PGREP_RC. Default 0 = "a claude daemon is
# visible", which corroborates an empty read and lets these cases exercise the
# reap path they are actually asserting. A case that wants to exercise the
# uncorroborated-empty path sets STUB_PGREP_RC=1.
cat >"$STUB_BIN/pgrep" <<'STUB'
#!/usr/bin/env bash
set -uo pipefail
exit "${STUB_PGREP_RC:-0}"
STUB
chmod +x "$STUB_BIN/pgrep"
export CLAUDE_AGENTS_PGREP_CMD="$STUB_BIN/pgrep"

cat >"$STUB_BIN/git" <<'STUB'
#!/usr/bin/env bash
set -uo pipefail
# Drop a leading "-C <path>" (git -C <wt> status / rev-list).
if [ "${1:-}" = "-C" ]; then shift 2; fi
cmd="$*"
case "$cmd" in
  "rev-parse --path-format=absolute --git-common-dir")
    printf '%s\n' "${STUB_GIT_COMMON_DIR:-}"
    exit "${STUB_REVPARSE_RC:-0}" ;;
  "worktree list --porcelain")
    [ -n "${STUB_WT_LIST:-}" ] && printf '%s\n' "$STUB_WT_LIST"
    exit 0 ;;
  "status --porcelain")
    [ -n "${STUB_STATUS:-}" ] && printf '%s\n' "$STUB_STATUS"
    exit "${STUB_STATUS_RC:-0}" ;;
  "status --porcelain --untracked-files=no")
    # The hook's POST-removal damage probe. Deliberately a separate stub var
    # from STUB_STATUS: the pre-removal in-sync check and the post-removal
    # damage check ask different questions of different tree states, and a
    # shared var would make it impossible to model "clean before, gutted after".
    [ -n "${STUB_POST_STATUS:-}" ] && printf '%s\n' "$STUB_POST_STATUS"
    exit "${STUB_POST_STATUS_RC:-0}" ;;
  "rev-list --count HEAD --not --remotes")
    printf '%s\n' "${STUB_REVLIST:-0}"
    exit "${STUB_REVLIST_RC:-0}" ;;
  "worktree remove "*)
    printf '%s\n' "$cmd" >>"${STUB_REMOVED_LOG:?STUB_REMOVED_LOG unset}"
    # Real `git worktree remove` updates the working tree NON-transactionally,
    # so a failure can leave the checkout partly deleted. STUB_REMOVE_TEARS
    # selects which half-deleted state to leave behind, so the hook's recovery
    # path can be driven without a read-only mount to abort against.
    case "${STUB_REMOVE_TEARS:-}" in
      gitfile) rm -f -- "${STUB_TEAR_TARGET:?STUB_TEAR_TARGET unset}/.git" ;;
      dir)     rm -rf -- "${STUB_TEAR_TARGET:?STUB_TEAR_TARGET unset}" ;;
    esac
    exit "${STUB_REMOVE_RC:-0}" ;;
  "worktree prune")
    exit 0 ;;
  *)
    echo "git stub: unknown invocation: $cmd" >&2
    exit 1 ;;
esac
STUB
chmod +x "$STUB_BIN/git"
export PATH="$STUB_BIN:$PATH"

# --- per-case fixtures ------------------------------------------------------

ROOT=""; BRANCH=""; WT=""; REMOVED_LOG=""; HOOK_LOG=""; HOOK_RC=0

# setup_root — fresh fake project root with a registered, in-sync worktree.
# Sets every STUB_* var so a previous case's overrides never leak.
setup_root() {
  TMPDIR="$ORIG_TMPDIR"
  ROOT=$(realpath "$(mktemp -d)")
  export TMPDIR="$ROOT"      # isolates the hook's pre-relocation log per case

  BRANCH="42-foo"
  # Standard layout: `.git` is a normal directory inside the working tree, so
  # the git common dir is <repo>/.git and the repo root is its PARENT — the
  # worktrees root is <repo>/.claude/worktrees, not <common-dir>/.claude/...
  # (the `.bare` bare-repo layout this fixture used to model was retired
  # 2026-07-21). Anchoring the fixture at the common dir made the suite agree
  # with the hook's own wrong arithmetic while both disagreed with reality, so
  # the dead worktrees root never showed up as a failure.
  WT="$ROOT/.claude/worktrees/$BRANCH"
  mkdir -p "$ROOT/.git/worktrees/$BRANCH" "$ROOT/.claude/worktrees/main" "$WT"
  # A registered worktree's `.git` is a FILE holding a `gitdir:` pointer, and
  # the hook's partial-delete detector tests for exactly that file. Without it
  # the fixture would model a checkout that is ALREADY half-deleted, so every
  # failed removal would be scored as torn and recovered — destroying the
  # fixture and hiding the refusal path entirely.
  printf 'gitdir: %s\n' "$ROOT/.git/worktrees/$BRANCH" >"$WT/.git"

  REMOVED_LOG="$ROOT/removed.log"
  HOOK_LOG="$ROOT/tmp/worktree-remove.log"

  export STUB_GIT_COMMON_DIR="$ROOT/.git"
  export STUB_REVPARSE_RC=0
  export STUB_WT_LIST="worktree $ROOT/.claude/worktrees/main
worktree $WT"
  export STUB_STATUS=""        # clean working tree
  export STUB_STATUS_RC=0
  export STUB_REVLIST="0"      # all commits pushed
  export STUB_REVLIST_RC=0
  export STUB_REMOVE_RC=0
  export STUB_REMOVED_LOG="$REMOVED_LOG"
  export STUB_POST_STATUS=""     # post-removal tree: undamaged by default
  export STUB_POST_STATUS_RC=0
  unset STUB_REMOVE_TEARS        # removal does not tear unless a case says so
  unset STUB_TEAR_TARGET
  export STUB_CLAUDE_JSON="[]"   # no live sessions by default
  export STUB_CLAUDE_RC=0
}

# setup_root_symlinked_wt — same fixture shape as setup_root, except
# `.claude/worktrees` is a SYMLINK to a directory that lives entirely outside
# $ROOT. Regression fixture for the WORKTREES_ROOT/CANON symlink-resolution
# mismatch: CANON is always realpath-resolved (`realpath -m "$TARGET"`), so a
# WORKTREES_ROOT left unresolved diverges from it the moment `.claude/worktrees`
# is (or sits under) a symlink — the containment `case "$CANON/" in
# "$WORKTREES_ROOT"/*)` guard and the `!= "$WORKTREES_ROOT/main"` guard both
# compare a resolved path against an unresolved one and misfire "not under
# $WORKTREES_ROOT", refusing a perfectly legitimate removal.
setup_root_symlinked_wt() {
  TMPDIR="$ORIG_TMPDIR"
  ROOT=$(realpath "$(mktemp -d)")
  export TMPDIR="$ROOT"

  BRANCH="42-foo"
  # The REAL worktrees directory lives OUTSIDE $ROOT; .claude/worktrees is only
  # a symlink pointing at it.
  REAL_WT_DIR=$(realpath "$(mktemp -d)")
  mkdir -p "$ROOT/.git/worktrees/$BRANCH" "$REAL_WT_DIR/main" "$REAL_WT_DIR/$BRANCH"
  mkdir -p "$ROOT/.claude"
  ln -s "$REAL_WT_DIR" "$ROOT/.claude/worktrees"

  # WT is the path a caller would use — via the symlinked worktrees root, since
  # that's the path worktree-create.sh and the WorktreeRemove payload both use.
  WT="$ROOT/.claude/worktrees/$BRANCH"
  printf 'gitdir: %s\n' "$ROOT/.git/worktrees/$BRANCH" >"$REAL_WT_DIR/$BRANCH/.git"

  REMOVED_LOG="$ROOT/removed.log"
  HOOK_LOG="$ROOT/tmp/worktree-remove.log"

  export STUB_GIT_COMMON_DIR="$ROOT/.git"
  export STUB_REVPARSE_RC=0
  # Registered via the symlinked form, exactly like the real worktree_path
  # payload — the registration check already realpath-resolves both sides, so
  # this alone was never the defect; it is the containment `case` afterward.
  export STUB_WT_LIST="worktree $ROOT/.claude/worktrees/main
worktree $WT"
  export STUB_STATUS=""
  export STUB_STATUS_RC=0
  export STUB_REVLIST="0"
  export STUB_REVLIST_RC=0
  export STUB_REMOVE_RC=0
  export STUB_REMOVED_LOG="$REMOVED_LOG"
  export STUB_POST_STATUS=""
  export STUB_POST_STATUS_RC=0
  unset STUB_REMOVE_TEARS
  unset STUB_TEAR_TARGET
  export STUB_CLAUDE_JSON="[]"
  export STUB_CLAUDE_RC=0
}

# run_hook <payload> [cwd] — feed the payload on stdin, capture the exit code.
run_hook() {
  local payload="$1" cwd="${2:-$ROOT}"
  HOOK_RC=0
  ( cd "$cwd" && printf '%s' "$payload" | "$HOOK" ) || HOOK_RC=$?
}

# --- assertions -------------------------------------------------------------

assert_exit0() {
  local desc="$1"
  TOTAL=$((TOTAL + 1))
  if [ "$HOOK_RC" -eq 0 ]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: $desc — expected exit 0, got $HOOK_RC"
  fi
}

assert_remove_called() {
  local desc="$1"
  TOTAL=$((TOTAL + 1))
  if [ -s "$REMOVED_LOG" ]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: $desc — expected 'git worktree remove' to be invoked"
  fi
}

assert_remove_not_called() {
  local desc="$1"
  TOTAL=$((TOTAL + 1))
  if [ ! -s "$REMOVED_LOG" ]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: $desc — 'git worktree remove' was invoked unexpectedly: $(cat "$REMOVED_LOG")"
  fi
}

assert_path_gone() {
  local desc="$1" path="$2"
  TOTAL=$((TOTAL + 1))
  if [ ! -e "$path" ]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: $desc — expected '$path' to be gone, but it still exists"
  fi
}

assert_path_present() {
  local desc="$1" path="$2"
  TOTAL=$((TOTAL + 1))
  if [ -e "$path" ]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: $desc — expected '$path' to survive, but it was deleted"
  fi
}

assert_log() {
  local desc="$1" pattern="$2"
  TOTAL=$((TOTAL + 1))
  if grep -qF -- "$pattern" "$HOOK_LOG" 2>/dev/null; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: $desc — log missing pattern: $pattern"
    if [ -f "$HOOK_LOG" ]; then sed 's/^/    /' "$HOOK_LOG"; else echo "    <no log file>"; fi
  fi
}

# --- Removal cases: in sync, target supplied each way -----------------------

setup_root
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0          "removal via .worktree_path: exit 0"
assert_remove_called  "removal via .worktree_path: git worktree remove called"
assert_log            "removal via .worktree_path: log shows IN SYNC" "IN SYNC: removing"
assert_log            "removal via .worktree_path: log shows success" "removed '$WT' successfully"

setup_root
run_hook "$(jq -nc --arg p "$WT" '{path: $p}')"
assert_exit0          "removal via .path: exit 0"
assert_remove_called  "removal via .path: git worktree remove called"
assert_log            "removal via .path: log shows success" "removed '$WT' successfully"

setup_root
run_hook "$(jq -nc --arg p "$WT" '{cwd: $p}')"
assert_exit0          "removal via .cwd: exit 0"
assert_remove_called  "removal via .cwd: git worktree remove called"
assert_log            "removal via .cwd: log shows success" "removed '$WT' successfully"

setup_root
run_hook "$(jq -nc --arg n "$BRANCH" '{name: $n}')"
assert_exit0          "removal via .name (bare name): exit 0"
assert_remove_called  "removal via .name (bare name): git worktree remove called"
assert_log            "removal via .name (bare name): log shows success" "removed '$WT' successfully"

setup_root
run_hook '{}' "$WT"   # empty payload -> $PWD fallback
assert_exit0          "removal via \$PWD fallback: exit 0"
assert_remove_called  "removal via \$PWD fallback: git worktree remove called"
assert_log            "removal via \$PWD fallback: log shows success" "removed '$WT' successfully"

# --- Keep cases: not in sync ------------------------------------------------

setup_root
export STUB_STATUS=" M src/file.txt"
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0              "keep: dirty working tree: exit 0"
assert_remove_not_called  "keep: dirty working tree: not removed"
assert_log                "keep: dirty working tree: log shows KEEP" "has uncommitted changes"

setup_root
export STUB_REVLIST="3"
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0              "keep: unpushed commits: exit 0"
assert_remove_not_called  "keep: unpushed commits: not removed"
assert_log                "keep: unpushed commits: log shows count" "3 unpushed commit(s)"

setup_root
export STUB_STATUS_RC=1
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0              "keep: git status error: exit 0"
assert_remove_not_called  "keep: git status error: not removed"
assert_log                "keep: git status error: log shows failure" "git status failed"

setup_root
export STUB_REVLIST="not-a-number"
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0              "keep: rev-list non-numeric: exit 0"
assert_remove_not_called  "keep: rev-list non-numeric: not removed"
assert_log                "keep: rev-list non-numeric: log shows failure" "rev-list non-numeric"

setup_root
export STUB_REVLIST_RC=1
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0              "keep: rev-list error: exit 0"
assert_remove_not_called  "keep: rev-list error: not removed"
assert_log                "keep: rev-list error: log shows failure" "rev-list failed"

# --- Safety no-ops ----------------------------------------------------------

setup_root
run_hook "$(jq -nc --arg p "$ROOT/elsewhere" '{worktree_path: $p}')"
assert_exit0              "safety: target outside worktrees/: exit 0"
assert_remove_not_called  "safety: target outside worktrees/: not removed"
assert_log                "safety: target outside worktrees/: log refuses" "not under"

setup_root
run_hook "$(jq -nc --arg p "$ROOT/.claude/worktrees/main" '{worktree_path: $p}')"
assert_exit0              "safety: target is main: exit 0"
assert_remove_not_called  "safety: target is main: not removed"
assert_log                "safety: target is main: log refuses" "is main"

setup_root
run_hook "$(jq -nc --arg p "$ROOT/.claude/worktrees/99-ghost" '{worktree_path: $p}')"
assert_exit0              "safety: target not registered: exit 0"
assert_remove_not_called  "safety: target not registered: not removed"
assert_log                "safety: target not registered: log no-ops" "not a registered worktree"

setup_root
export STUB_WT_LIST=""
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0              "safety: empty worktree list: exit 0"
assert_remove_not_called  "safety: empty worktree list: not removed"
assert_log                "safety: empty worktree list: log no-ops" "not a registered worktree"

setup_root
run_hook "$(jq -nc --arg p "$ROOT/.git" '{worktree_path: $p}')"
assert_exit0              "safety: git dir path: exit 0"
assert_remove_not_called  "safety: git dir path: not removed"
assert_log                "safety: git dir path: log refuses" "not under"

# --- Robustness -------------------------------------------------------------

setup_root
run_hook "not valid json" "$ROOT"   # malformed -> all fields empty -> $PWD ($ROOT, outside worktrees/)
assert_exit0              "robustness: malformed JSON stdin: exit 0"
assert_remove_not_called  "robustness: malformed JSON stdin: not removed"

setup_root
run_hook "" "$ROOT"                 # empty stdin -> $PWD fallback ($ROOT, outside worktrees/)
assert_exit0              "robustness: empty stdin: exit 0"
assert_remove_not_called  "robustness: empty stdin: not removed"

setup_root
export STUB_REMOVE_RC=1
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0          "robustness: git worktree remove rc!=0: exit 0"
assert_remove_called  "robustness: git worktree remove rc!=0: remove attempted"
assert_log            "robustness: git worktree remove rc!=0: log shows failure" "git worktree remove failed"

# --- Live-session guard cases -----------------------------------------------

# (a) live session present + in sync → kept
# The session name must match the worktree basename ("42-foo") for the
# name-keyed predicate to detect it as occupied.
setup_root
export STUB_CLAUDE_JSON='[{"sessionId":"s1","pid":1,"status":"running","name":"42-foo"}]'
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0              "live session: in-sync + occupied -> exit 0"
assert_remove_not_called  "live session: in-sync + occupied -> not removed"
assert_log                "live session: in-sync + occupied -> log shows KEEP" "KEEP:"
assert_log                "live session: in-sync + occupied -> log names reason" "has a live Claude session"

# (b) no live session + in sync → removed (existing happy path stays green)
setup_root
# STUB_CLAUDE_JSON defaults to "[]" via setup_root
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0          "live session: in-sync + no session -> exit 0"
assert_remove_called  "live session: in-sync + no session -> removed"
assert_log            "live session: in-sync + no session -> log shows IN SYNC" "IN SYNC: removing"

# (c) daemon unreachable / unknown → kept (fail-safe)
setup_root
export STUB_CLAUDE_RC=1
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0              "live session: daemon unreachable -> exit 0"
assert_remove_not_called  "live session: daemon unreachable -> not removed"
assert_log                "live session: daemon unreachable -> log shows KEEP" "KEEP:"
assert_log                "live session: daemon unreachable -> log names reason" "has a live Claude session"

# (d) live session with a different name (not the worktree basename) → removed
# Regression guard: name-keyed predicate must NOT match a session whose name
# differs from basename(worktree_path). A cwd-based implementation would use
# --cwd and could still block; name-keyed correctly treats this as unoccupied.
setup_root
export STUB_CLAUDE_JSON='[{"sessionId":"s2","pid":2,"status":"running","name":"something-else"}]'
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0          "live session: session name mismatch -> exit 0"
assert_remove_called  "live session: session name mismatch -> removed (name-keyed, not cwd)"
assert_log            "live session: session name mismatch -> log shows IN SYNC" "IN SYNC: removing"

# (e) EMPTY-READ CORROBORATION: an empty agents list that NO visible `claude
# daemon` process corroborates must fold to UNKNOWN and keep the worktree.
#
# This is the direct coverage for the corroboration probe itself. The fixture
# stubs the probe to "daemon visible" by default so every other case exercises
# the behaviour it is actually asserting; this case is where the probe's own
# negative branch is pinned. Without it, stubbing the probe would have removed
# the only exercise of the feature in this suite — the empty read would be
# corroborated everywhere and the fail-safe would be untested.
#
# Note the contrast with case (c): there the daemon read itself FAILS
# (STUB_CLAUDE_RC=1). Here the read SUCCEEDS and returns a well-formed `[]` —
# the ambiguity is entirely in whether that emptiness is real, which is exactly
# what the corroboration probe exists to decide.
setup_root
# STUB_CLAUDE_JSON defaults to "[]" via setup_root; the read succeeds (rc 0).
export STUB_PGREP_RC=1   # no `claude daemon` process visible
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0              "corroboration: uncorroborated empty read -> exit 0"
assert_remove_not_called  "corroboration: uncorroborated empty read -> not removed"
assert_log                "corroboration: uncorroborated empty read -> log shows KEEP" "KEEP:"
unset STUB_PGREP_RC

# --- Partial-delete (torn removal) detection and recovery -------------------
#
# `git worktree remove` updates the working tree NON-transactionally — file by
# file, aborting on the first failure — so a failed removal is two different
# states that need opposite responses:
#
#   TORN    the removal got in, destroyed part of the checkout, then aborted.
#           Retrying cannot fix it: the retry fails validation with `'.../.git'
#           is not a .git file, error code 7`, because the first attempt
#           destroyed the file the second validates against. Recover in place.
#   REFUSED git declined before touching anything. The checkout is intact and
#           must be KEPT.
#
# Scoring TORN as REFUSED strands a half-deleted worktree that no later run can
# remove; scoring REFUSED as TORN destroys a healthy worktree over an untracked
# file. These cases pin both directions.

# (i) TORN — the `.git` link file was destroyed before the abort.
setup_root
export STUB_REMOVE_RC=1
export STUB_REMOVE_TEARS=gitfile
export STUB_TEAR_TARGET="$WT"
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0        "torn: .git destroyed -> exit 0"
assert_remove_called "torn: .git destroyed -> remove attempted"
assert_log          "torn: .git destroyed -> detected" "PARTIAL DELETE detected"
assert_log          "torn: .git destroyed -> recovered" "recovered '$WT'"
assert_path_gone    "torn: .git destroyed -> checkout removed" "$WT"

# (ii) TORN — the checkout directory is already gone while the registration
# survives (the other half of a torn removal: git deletes the checkout and the
# admin dir in two separately-failing steps).
setup_root
export STUB_REMOVE_RC=1
export STUB_REMOVE_TEARS=dir
export STUB_TEAR_TARGET="$WT"
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0        "torn: directory gone -> exit 0"
assert_log          "torn: directory gone -> detected" "PARTIAL DELETE detected"
assert_log          "torn: directory gone -> recovered" "recovered '$WT'"
assert_path_gone    "torn: directory gone -> checkout removed" "$WT"

# (iii) TORN — `.git` survives but the tree was gutted before the abort.
# Deletion runs entry-by-entry in directory order, so the abort can land AFTER
# much of the tree is gone and BEFORE `.git` is reached. The in-sync check
# proved the tracked tree clean moments earlier, so tracked deletions appearing
# now can only mean the removal got in.
setup_root
export STUB_REMOVE_RC=1
export STUB_POST_STATUS=" D src/file.txt"
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0        "torn: tree gutted -> exit 0"
assert_log          "torn: tree gutted -> detected" "PARTIAL DELETE detected"
assert_path_gone    "torn: tree gutted -> checkout removed" "$WT"

# (iv) REFUSED, not torn — git declined and the checkout is intact. The
# regression guard for the opposite error: recovering here would delete a
# healthy worktree because of, say, one untracked build artifact.
setup_root
export STUB_REMOVE_RC=1
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0        "refused: intact checkout -> exit 0"
assert_log          "refused: intact checkout -> kept" "git worktree remove failed"
assert_path_present "refused: intact checkout -> checkout NOT deleted" "$WT"

# --- Symlinked worktrees root: containment must still match -----------------
# Before the fix, CANON resolved through the .claude/worktrees symlink to
# $REAL_WT_DIR/$BRANCH while WORKTREES_ROOT stayed as the unresolved
# $ROOT/.claude/worktrees, so the containment `case` refused a target that was
# genuinely inside the worktrees root — an in-sync, unoccupied worktree that
# should have been removed was silently kept instead, logged as "not under".

setup_root_symlinked_wt
run_hook "$(jq -nc --arg p "$WT" '{worktree_path: $p}')"
assert_exit0          "symlinked worktrees root: exit 0"
assert_remove_called  "symlinked worktrees root: git worktree remove called (containment matched through the symlink)"
assert_log            "symlinked worktrees root: log shows IN SYNC" "IN SYNC: removing"
_symlink_refused=absent
grep -qF "not under" "$HOOK_LOG" 2>/dev/null && _symlink_refused=present
TOTAL=$((TOTAL + 1))
if [ "$_symlink_refused" = "absent" ]; then
  PASS=$((PASS + 1))
else
  FAIL=$((FAIL + 1))
  echo "FAIL: symlinked worktrees root: containment guard misfired (\"not under\" in log)"
  sed 's/^/    /' "$HOOK_LOG"
fi

# The main-worktree guard must ALSO resolve both sides: a symlinked worktrees
# root's own `main` entry, addressed via the symlink, must still be recognized
# as main and refused — not because containment fails (it would still be
# "under" the unresolved WORKTREES_ROOT string, coincidentally, since it's the
# same prefix), but because `$CANON != "$WORKTREES_ROOT/main"` needs
# WORKTREES_ROOT resolved to compare correctly against a fully-resolved CANON
# in general. Exercised directly against the symlinked main path.
setup_root_symlinked_wt
run_hook "$(jq -nc --arg p "$ROOT/.claude/worktrees/main" '{worktree_path: $p}')"
assert_exit0          "symlinked worktrees root, main target: exit 0"
assert_remove_not_called "symlinked worktrees root, main target: git worktree remove NOT called"
assert_log             "symlinked worktrees root, main target: log shows refusal" "is main"

# --- Summary ----------------------------------------------------------------

echo ""
echo "Results: $PASS passed, $FAIL failed, $TOTAL total"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo "All tests passed."
