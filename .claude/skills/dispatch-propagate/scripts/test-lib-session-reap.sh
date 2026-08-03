#!/usr/bin/env bash
# Tests for lib-session-reap.sh — the dispatch-sweep arm that reaps terminal
# graph-node worker sessions `claude rm` silently DECLINED to remove.
#
# Everything the arm touches is faked, but the git side is REAL: the fixture
# builds an actual scratch repo with actual `git worktree add` checkouts, so the
# clean-tree gate, the `origin/main` content diff and the `git worktree remove`
# itself exercise real git semantics rather than a shim's idea of them. That
# matters most for the squash-merge test, whose whole point is that a branch can
# be many commits "ahead" of origin/main with an EMPTY content diff — a property
# no stub can honestly reproduce.
#
# Faked:
#   `claude`  via CLAUDE_AGENTS_CMD — serves `agents --json --all` from
#             payload.json and implements `rm <id>` per the mode file:
#               accept        removes the entry from payload.json (a real reap)
#               decline       prints the daemon's real decline line and exits 0
#                             WITHOUT removing anything (THE BUG)
#               unknown-list  the very first `agents` query fails
#               unknown-post  `agents` succeeds once, then fails (the post-state
#                             read is UNKNOWN)
#   `gh`      via a PATH shim, driving gh_pr_list_rest's two calls.
#   `git`     via a PATH shim that LOGS any `worktree remove` invocation and then
#             execs the real git. Together with the fake `claude`'s own log line
#             this gives a single ordered call log, which is how the
#             "worktree remove BEFORE claude rm" ordering is asserted — that
#             ordering is load-bearing behavior (removing the worktree is what
#             makes the daemon accept), not an implementation detail.
#   transcripts via DISPATCH_SESSION_REAP_PROJECTS_ROOT (mtimes set by `touch -d`)
#   job dirs    via DISPATCH_SESSION_REAP_JOBS_ROOT
#   the clock   via DISPATCH_SESSION_REAP_NOW_EPOCH
#
# session_reap_sweep always returns 0, but every call is still wrapped in an `if`
# to capture the code — the test shell runs under `set -e`.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# shellcheck source=/dev/null
source "$SCRIPT_DIR/lib-session-reap.sh"

echo ""
echo "=== lib-session-reap.sh ==="

# The real git, resolved BEFORE the PATH shim is installed — the shim execs it.
REAL_GIT="$(command -v git)"

# A fixed clock. Transcript mtimes are expressed relative to it.
SR_NOW=1700000000

SR_DIR=""
SR_REPO=""
SR_WTROOT=""
SR_PROJ=""
SR_JOBS=""
SR_BIN=""
SR_CALLS=""
SR_FAKE=""
SR_ENTRIES=()
SR_RC=0
SR_ERR=""
SR_SAVED_PATH="$PATH"

sr_setup() {
  SR_DIR=$(mktemp -d)
  SR_REPO="$SR_DIR/repo"
  SR_WTROOT="$SR_REPO/.claude/worktrees"
  SR_PROJ="$SR_DIR/projects"
  SR_JOBS="$SR_DIR/jobs"
  SR_BIN="$SR_DIR/bin"
  SR_CALLS="$SR_DIR/calls"
  SR_FAKE="$SR_DIR/fake-claude"
  SR_ENTRIES=()
  mkdir -p "$SR_REPO" "$SR_PROJ/proj-a" "$SR_JOBS" "$SR_BIN"
  : > "$SR_CALLS"
  printf 'accept' > "$SR_DIR/mode"
  printf '[]' > "$SR_DIR/payload.json"

  # A real scratch repo. HEAD is set to `main` explicitly — CI has no
  # init.defaultBranch, so a bare `git init` would land on `master`.
  "$REAL_GIT" -C "$SR_REPO" init -q
  "$REAL_GIT" -C "$SR_REPO" symbolic-ref HEAD refs/heads/main
  "$REAL_GIT" -C "$SR_REPO" config user.email "test@example.com"
  "$REAL_GIT" -C "$SR_REPO" config user.name "Test"
  mkdir -p "$SR_REPO/intentions"
  # The worktree container lives inside the repo (mirroring the real
  # .claude/worktrees layout), so keep it out of the parent's index.
  printf '.claude/\n' > "$SR_REPO/.gitignore"
  printf 'seed\n' > "$SR_REPO/README.md"
  printf 'seed\n' > "$SR_REPO/intentions/seed.md"
  "$REAL_GIT" -C "$SR_REPO" add -A
  "$REAL_GIT" -C "$SR_REPO" commit -q -m "seed"
  # No bare remote is needed: the arm only READS origin/main.
  "$REAL_GIT" -C "$SR_REPO" update-ref refs/remotes/origin/main HEAD
  mkdir -p "$SR_WTROOT"

  sr_write_shims

  DISPATCH_SESSION_REAP_NOW_EPOCH="$SR_NOW"
  DISPATCH_SESSION_REAP_REPO_ROOT="$SR_REPO"
  DISPATCH_SESSION_REAP_WORKTREES_ROOT="$SR_WTROOT"
  DISPATCH_SESSION_REAP_PROJECTS_ROOT="$SR_PROJ"
  DISPATCH_SESSION_REAP_JOBS_ROOT="$SR_JOBS"
  export DISPATCH_SESSION_REAP_NOW_EPOCH DISPATCH_SESSION_REAP_REPO_ROOT \
         DISPATCH_SESSION_REAP_WORKTREES_ROOT DISPATCH_SESSION_REAP_PROJECTS_ROOT \
         DISPATCH_SESSION_REAP_JOBS_ROOT
  unset DISPATCH_SESSION_REAP_GRACE_S DISPATCH_SESSION_REAP_MAX || true
  # gh_pr_list_rest retries through gh_retry; zero the backoff so a deliberate
  # failure test does not sleep.
  export GH_RETRY_BASE_DELAY=0
  # The arm must never read a tick snapshot — CLAUDE_AGENTS_CMD is the fake we
  # want exercised. (claude_agents_list_terminal_workers queries --all directly,
  # but unset it anyway so a leaked snapshot from another suite cannot confuse a
  # future reader.)
  unset DISPATCH_AGENTS_SNAPSHOT || true
  CLAUDE_AGENTS_CMD="$SR_FAKE"
  export CLAUDE_AGENTS_CMD
}

sr_teardown() {
  export PATH="$SR_SAVED_PATH"
  # Detach every worktree registration before deleting the tree, so a failed
  # test cannot leave stale admin dirs behind in the tmp repo.
  rm -rf "$SR_DIR"
  SR_DIR=""
  unset CLAUDE_AGENTS_CMD DISPATCH_SESSION_REAP_NOW_EPOCH \
        DISPATCH_SESSION_REAP_REPO_ROOT DISPATCH_SESSION_REAP_WORKTREES_ROOT \
        DISPATCH_SESSION_REAP_PROJECTS_ROOT DISPATCH_SESSION_REAP_JOBS_ROOT \
        DISPATCH_SESSION_REAP_GRACE_S DISPATCH_SESSION_REAP_MAX \
        GH_RETRY_BASE_DELAY || true
}

# sr_write_shims — install the PATH shims (git, gh) and the fake `claude`.
sr_write_shims() {
  # git: log every `worktree remove` into the shared call log, then exec the
  # REAL git. Passthrough, so the reap-safety gates run against real git.
  cat > "$SR_BIN/git" <<GITSHIM
#!/usr/bin/env bash
case "\$*" in
  *"worktree remove"*) printf 'git-worktree-remove %s\n' "\$*" >> "$SR_CALLS" ;;
esac
exec "$REAL_GIT" "\$@"
GITSHIM
  chmod +x "$SR_BIN/git"

  # gh: gh_pr_list_rest --head issues two calls — owner resolution, then the
  # REST pulls query. Per-branch fixtures live at pr-<branch>.json in REST shape
  # ({state:"open"|"closed", merged_at, number, created_at, title}); absent means
  # "no PRs". A gh-fail sentinel forces the pulls call to fail.
  cat > "$SR_BIN/gh" <<GHSTUB
#!/usr/bin/env bash
D="$SR_DIR"
args="\$*"
case "\$args" in
  "repo view --json owner"*)
    echo natb1
    ;;
  api*pulls*)
    if [[ -f "\$D/gh-fail" ]]; then
      echo "gh stub: simulated pulls failure" >&2
      exit 1
    fi
    br=\$(printf '%s' "\$args" | grep -oE 'head=natb1:[^ ]+' | sed 's/head=natb1://')
    f="\$D/pr-\${br}.json"
    if [[ -f "\$f" ]]; then cat "\$f"; else echo '[]'; fi
    ;;
  *)
    echo "gh stub: unknown invocation: \$args" >&2
    exit 1
    ;;
esac
GHSTUB
  chmod +x "$SR_BIN/gh"

  export PATH="$SR_BIN:$SR_SAVED_PATH"

  # claude: `rm <id>` and `agents --json --all`, both logged; behavior driven by
  # the mode file.
  cat > "$SR_FAKE" <<CLAUDEFAKE
#!/usr/bin/env bash
D="$SR_DIR"
CALLS="$SR_CALLS"
MODE=\$(cat "\$D/mode" 2>/dev/null || printf 'accept')

if [[ "\${1:-}" == "rm" ]]; then
  id="\${2:-}"
  printf 'claude-rm %s\n' "\$id" >> "\$CALLS"
  if [[ "\$MODE" == "decline" ]]; then
    # The daemon's REAL decline: a message on stdout and exit 0, with the
    # session left registered. This is the bug under test.
    printf 'kept %s — worktree has files but no repository to verify them against\n' "\$id"
    exit 0
  fi
  tmp=\$(mktemp)
  jq --arg id "\$id" 'map(select(.id != \$id))' "\$D/payload.json" > "\$tmp" && mv "\$tmp" "\$D/payload.json"
  exit 0
fi

# \`agents --json --all\`
n=\$(cat "\$D/agents-count" 2>/dev/null || printf '0')
n=\$(( n + 1 ))
printf '%s' "\$n" > "\$D/agents-count"
printf 'claude-agents %s\n' "\$n" >> "\$CALLS"
if [[ "\$MODE" == "unknown-list" ]]; then
  exit 1
fi
if [[ "\$MODE" == "unknown-post" && "\$n" -ge 2 ]]; then
  exit 1
fi
cat "\$D/payload.json"
exit 0
CLAUDEFAKE
  chmod +x "$SR_FAKE"
}

# sr_mode <accept|decline|unknown-list|unknown-post>
sr_mode() { printf '%s' "$1" > "$SR_DIR/mode"; }

# sr_add_session <sid> <id-or-null> <name> [state] — append one registry entry.
sr_add_session() {
  local sid="$1" id="$2" name="$3" state="${4:-done}" idfield
  if [[ "$id" == "null" ]]; then idfield="null"; else idfield="\"$id\""; fi
  SR_ENTRIES+=("{\"sessionId\":\"$sid\",\"id\":$idfield,\"name\":\"$name\",\"state\":\"$state\",\"cwd\":\"$SR_WTROOT/$name\"}")
}

# sr_install_registry — write the accumulated entries into payload.json.
sr_install_registry() {
  local payload
  payload=$( IFS=,; printf '[%s]' "${SR_ENTRIES[*]-}" )
  printf '%s' "$payload" > "$SR_DIR/payload.json"
}

# sr_job <jid> <state-json-name> [marker-node] — create the managed-job dir.
# <state-json-name> is what state.json's `.name` says (the ownership gate).
# [marker-node] writes a node-terminal marker in mark-node-terminal's exact byte
# format naming that node; "none" (or omitted) writes no marker; "malformed"
# writes a marker with no `^node=` line at all.
sr_job() {
  local jid="$1" owner="$2" marker="${3:-none}"
  mkdir -p "$SR_JOBS/$jid"
  printf '{"name":"%s"}\n' "$owner" > "$SR_JOBS/$jid/state.json"
  case "$marker" in
    none) ;;
    malformed) printf 'disposition=align-round\n' > "$SR_JOBS/$jid/node-terminal" ;;
    *) printf 'node=%s\ndisposition=align-round\n' "$marker" > "$SR_JOBS/$jid/node-terminal" ;;
  esac
}

# sr_transcript <sid> <mtime-epoch>
sr_transcript() {
  printf '{}\n' > "$SR_PROJ/proj-a/$1.jsonl"
  touch -d "@$2" "$SR_PROJ/proj-a/$1.jsonl"
}

# sr_worktree <node-id> <clean|squash|content|intentions|dirty>
# Create a real worktree on a branch named for the node (what
# provision-node-worktree does), then shape its divergence from origin/main.
sr_worktree() {
  # Split assignments: `local` expands every word before assigning any of them,
  # so `w="$SR_WTROOT/$name"` on the same line would read an unset $name under
  # `set -u`.
  local name="$1" kind="$2" i
  local w="$SR_WTROOT/$name"
  "$REAL_GIT" -C "$SR_REPO" worktree add -q "$w" -b "$name" main
  case "$kind" in
    clean) ;;
    dirty)
      printf 'uncommitted\n' >> "$w/README.md"
      ;;
    content)
      printf 'changed\n' > "$w/README.md"
      "$REAL_GIT" -C "$w" add -A
      "$REAL_GIT" -C "$w" commit -q -m "content change"
      ;;
    intentions)
      printf 'node body\n' > "$w/intentions/$name.md"
      "$REAL_GIT" -C "$w" add -A
      "$REAL_GIT" -C "$w" commit -q -m "graph record"
      ;;
    squash)
      # Many commits "ahead" of origin/main whose NET tree is identical to it —
      # exactly the shape a squash-merged branch has. A commit-count gate would
      # refuse to reap this; the content gate must not.
      for i in 1 2 3 4 5; do
        printf '%s\n' "$i" > "$w/scratch.txt"
        "$REAL_GIT" -C "$w" add -A
        "$REAL_GIT" -C "$w" commit -q -m "step $i"
      done
      rm "$w/scratch.txt"
      "$REAL_GIT" -C "$w" add -A
      "$REAL_GIT" -C "$w" commit -q -m "net zero"
      ;;
  esac
}

# sr_open_pr <branch> — install a REST fixture with one OPEN PR on that branch.
sr_open_pr() {
  printf '[{"number":77,"state":"open","merged_at":null,"title":"wip","created_at":"2026-01-01T00:00:00Z"}]\n' \
    > "$SR_DIR/pr-$1.json"
}

sr_run() {
  if session_reap_sweep 2>"$SR_DIR/err"; then SR_RC=0; else SR_RC=$?; fi
  SR_ERR=$(cat "$SR_DIR/err")
}

sr_contains() {
  case "$SR_ERR" in *"$1"*) printf 'yes' ;; *) printf 'no' ;; esac
}

sr_calls() { cat "$SR_CALLS"; }

# sr_line_of <pattern> — 1-based index of the first matching call-log line, or
# "none".
sr_line_of() {
  local n
  n=$(grep -n -- "$1" "$SR_CALLS" 2>/dev/null | head -n1 | cut -d: -f1) || n=""
  printf '%s' "${n:-none}"
}

sr_rm_calls() {
  local c
  c=$(grep -c '^claude-rm ' "$SR_CALLS" 2>/dev/null) || c=0
  [[ -n "$c" ]] || c=0
  printf '%s' "$c"
}

# --- Test 1: happy path — worktree removed FIRST, rm accepted, id gone -------

echo "Test: a terminal align-round worker is reaped — worktree removed before claude rm"
sr_setup
sr_worktree "tactic-happy" clean
sr_job "aaaa1111" "tactic-happy" "tactic-happy"
sr_transcript "0aa1-1111" $(( SR_NOW - 4000 ))
sr_add_session "0aa1-1111" "aaaa1111" "tactic-happy"
sr_install_registry
sr_run
assert_eq "happy: sweep returns 0" "0" "$SR_RC"
assert_eq "happy: the reap is reported" "yes" "$(sr_contains 'SESSION_REAPED: name=tactic-happy')"
assert_eq "happy: no decline is reported" "no" "$(sr_contains 'REAP_DECLINED')"
assert_eq "happy: summary counts one reap" "yes" \
  "$(sr_contains 'SESSION_REAP_COMPLETE: terminal=1 reaped=1 declined=0 unverified=0 skipped=0')"
assert_eq "happy: the worktree is gone from disk" "gone" \
  "$([[ -d "$SR_WTROOT/tactic-happy" ]] && printf 'present' || printf 'gone')"
assert_eq "happy: the branch is NOT deleted" "0" \
  "$("$REAL_GIT" -C "$SR_REPO" rev-parse --verify --quiet refs/heads/tactic-happy >/dev/null 2>&1; echo $?)"
assert_eq "happy: claude rm was called once" "1" "$(sr_rm_calls)"
assert_eq "happy: claude rm got the JOB id, not the session id" "yes" \
  "$(case "$(sr_calls)" in *"claude-rm aaaa1111"*) printf 'yes' ;; *) printf 'no' ;; esac)"
# ORDERING — load-bearing: removing the worktree is what makes the daemon accept.
SR_WT_LINE=$(sr_line_of '^git-worktree-remove ')
SR_RM_LINE=$(sr_line_of '^claude-rm ')
assert_eq "happy: worktree remove was logged" "yes" \
  "$([[ "$SR_WT_LINE" != "none" ]] && printf 'yes' || printf 'no')"
assert_eq "happy: worktree remove happened BEFORE claude rm" "yes" \
  "$([[ "$SR_WT_LINE" != "none" && "$SR_RM_LINE" != "none" && "$SR_WT_LINE" -lt "$SR_RM_LINE" ]] && printf 'yes' || printf 'no')"
sr_teardown

# --- Test 2: THE REGRESSION — `claude rm` exits 0 but declines ---------------
#
# The bug this file exists to fix. `claude rm` prints its decline line and exits
# 0; the session is still in the follow-up listing. Trusting exit 0 (what
# dispatch-self-close's `exec claude rm` does) would report success. The arm must
# report REAP_DECLINED and must NOT count a reap.

echo "Test: claude rm exits 0 while declining — REAP_DECLINED, never success"
sr_setup
sr_mode decline
sr_worktree "tactic-declined" clean
sr_job "bbbb2222" "tactic-declined" "tactic-declined"
sr_transcript "0bb2-2222" $(( SR_NOW - 4000 ))
sr_add_session "0bb2-2222" "bbbb2222" "tactic-declined"
sr_install_registry
sr_run
assert_eq "decline: sweep returns 0" "0" "$SR_RC"
assert_eq "decline: REAP_DECLINED is logged loudly" "yes" \
  "$(sr_contains 'REAP_DECLINED: name=tactic-declined session=0bb2-2222 id=bbbb2222')"
assert_eq "decline: the decline says the slot is still held" "yes" \
  "$(sr_contains 'it is holding a worker slot and its node is unselectable')"
assert_eq "decline: success is NOT reported" "no" "$(sr_contains 'SESSION_REAPED')"
assert_eq "decline: summary counts the decline, not a reap" "yes" \
  "$(sr_contains 'SESSION_REAP_COMPLETE: terminal=1 reaped=0 declined=1 unverified=0 skipped=0')"
assert_eq "decline: claude rm was still attempted" "1" "$(sr_rm_calls)"
sr_teardown

# --- Test 3: UNKNOWN from the candidate lister aborts the arm ----------------

echo "Test: an unqueryable daemon aborts the arm — it reaps nothing and says it cannot see"
sr_setup
sr_mode unknown-list
sr_worktree "tactic-unknown" clean
sr_job "cccc3333" "tactic-unknown" "tactic-unknown"
sr_transcript "0cc3-3333" $(( SR_NOW - 4000 ))
sr_add_session "0cc3-3333" "cccc3333" "tactic-unknown"
sr_install_registry
sr_run
assert_eq "unknown-list: sweep returns 0" "0" "$SR_RC"
assert_eq "unknown-list: the arm says it cannot see" "yes" \
  "$(sr_contains 'SESSION_REAP_UNKNOWN: daemon unqueryable')"
assert_eq "unknown-list: no summary claiming zero candidates" "no" \
  "$(sr_contains 'SESSION_REAP_COMPLETE')"
assert_eq "unknown-list: claude rm never called" "0" "$(sr_rm_calls)"
assert_eq "unknown-list: the worktree is untouched" "present" \
  "$([[ -d "$SR_WTROOT/tactic-unknown" ]] && printf 'present' || printf 'gone')"
sr_teardown

# --- Test 4: UNKNOWN on the POST-STATE read is not success -------------------

echo "Test: an unqueryable post-state read is UNVERIFIED, never a reported reap"
sr_setup
sr_mode unknown-post
sr_worktree "tactic-unverified" clean
sr_job "dddd4444" "tactic-unverified" "tactic-unverified"
sr_transcript "0dd4-4444" $(( SR_NOW - 4000 ))
sr_add_session "0dd4-4444" "dddd4444" "tactic-unverified"
sr_install_registry
sr_run
assert_eq "unknown-post: sweep returns 0" "0" "$SR_RC"
assert_eq "unknown-post: the unverified outcome is logged" "yes" \
  "$(sr_contains 'SESSION_REAP_UNVERIFIED: name=tactic-unverified')"
assert_eq "unknown-post: it says the removal is not confirmed" "yes" \
  "$(sr_contains 'removal NOT confirmed')"
assert_eq "unknown-post: success is NOT reported" "no" "$(sr_contains 'SESSION_REAPED')"
assert_eq "unknown-post: no false decline either" "no" "$(sr_contains 'REAP_DECLINED')"
assert_eq "unknown-post: summary counts it as unverified" "yes" \
  "$(sr_contains 'SESSION_REAP_COMPLETE: terminal=1 reaped=0 declined=0 unverified=1 skipped=0')"
sr_teardown

# --- Test 5: a dirty worktree blocks the reap --------------------------------

echo "Test: a dirty worktree blocks the reap"
sr_setup
sr_worktree "tactic-dirty" dirty
sr_job "eeee5555" "tactic-dirty" "tactic-dirty"
sr_transcript "0ee5-5555" $(( SR_NOW - 4000 ))
sr_add_session "0ee5-5555" "eeee5555" "tactic-dirty"
sr_install_registry
sr_run
assert_eq "dirty: sweep returns 0" "0" "$SR_RC"
assert_eq "dirty: the skip is logged" "yes" \
  "$(sr_contains 'SESSION_REAP_SKIP_DIRTY: name=tactic-dirty')"
assert_eq "dirty: claude rm never called" "0" "$(sr_rm_calls)"
assert_eq "dirty: the worktree survives" "present" \
  "$([[ -d "$SR_WTROOT/tactic-dirty" ]] && printf 'present' || printf 'gone')"
sr_teardown

# --- Test 6: unlanded content blocks the reap --------------------------------

echo "Test: a branch whose content differs from origin/main blocks the reap"
sr_setup
sr_worktree "tactic-content" content
sr_job "ffff6666" "tactic-content" "tactic-content"
sr_transcript "0ff6-6666" $(( SR_NOW - 4000 ))
sr_add_session "0ff6-6666" "ffff6666" "tactic-content"
sr_install_registry
sr_run
assert_eq "content: sweep returns 0" "0" "$SR_RC"
assert_eq "content: the skip is logged" "yes" \
  "$(sr_contains 'SESSION_REAP_SKIP_UNLANDED_CONTENT: name=tactic-content')"
assert_eq "content: claude rm never called" "0" "$(sr_rm_calls)"
sr_teardown

# --- Test 7: an OPEN PR on the branch blocks the reap ------------------------

echo "Test: an OPEN PR whose head is this branch blocks the reap"
sr_setup
sr_worktree "tactic-openpr" clean
sr_open_pr "tactic-openpr"
sr_job "1111aaaa" "tactic-openpr" "tactic-openpr"
sr_transcript "0117-7777" $(( SR_NOW - 4000 ))
sr_add_session "0117-7777" "1111aaaa" "tactic-openpr"
sr_install_registry
sr_run
assert_eq "open-pr: sweep returns 0" "0" "$SR_RC"
assert_eq "open-pr: the skip is logged" "yes" \
  "$(sr_contains 'SESSION_REAP_SKIP_OPEN_PR: name=tactic-openpr session=0117-7777 branch=tactic-openpr open_prs=1')"
assert_eq "open-pr: claude rm never called" "0" "$(sr_rm_calls)"
assert_eq "open-pr: the worktree survives" "present" \
  "$([[ -d "$SR_WTROOT/tactic-openpr" ]] && printf 'present' || printf 'gone')"
sr_teardown

# --- Test 8: a gh failure fails toward KEEP ----------------------------------

echo "Test: a gh failure on the PR probe fails toward KEEP"
sr_setup
sr_worktree "tactic-ghfail" clean
: > "$SR_DIR/gh-fail"
sr_job "2222bbbb" "tactic-ghfail" "tactic-ghfail"
sr_transcript "0228-8888" $(( SR_NOW - 4000 ))
sr_add_session "0228-8888" "2222bbbb" "tactic-ghfail"
sr_install_registry
sr_run
assert_eq "gh-fail: sweep returns 0" "0" "$SR_RC"
assert_eq "gh-fail: the skip is logged" "yes" \
  "$(sr_contains 'SESSION_REAP_SKIP_PR_FETCH_FAILED: name=tactic-ghfail')"
assert_eq "gh-fail: claude rm never called" "0" "$(sr_rm_calls)"
assert_eq "gh-fail: the worktree survives" "present" \
  "$([[ -d "$SR_WTROOT/tactic-ghfail" ]] && printf 'present' || printf 'gone')"
sr_teardown

# --- Test 9: THE SQUASH-MERGE CORRECTION -------------------------------------
#
# GitHub squash-merges, so a branch's individual commits are never ancestors of
# main — only their content is. A commit-count gate would read this branch as 6
# commits "ahead" and refuse forever, stranding the slot while looking
# conservative. The CONTENT gate must reap it.

echo "Test: a branch many commits ahead of origin/main with an EMPTY content diff is reaped"
sr_setup
sr_worktree "tactic-squash" squash
sr_job "3333cccc" "tactic-squash" "tactic-squash"
sr_transcript "0339-9999" $(( SR_NOW - 4000 ))
sr_add_session "0339-9999" "3333cccc" "tactic-squash"
sr_install_registry
SR_AHEAD=$("$REAL_GIT" -C "$SR_WTROOT/tactic-squash" rev-list --count HEAD --not --remotes)
assert_eq "squash: the fixture really is many commits ahead" "6" "$SR_AHEAD"
sr_run
assert_eq "squash: sweep returns 0" "0" "$SR_RC"
assert_eq "squash: the reap proceeds despite the commit count" "yes" \
  "$(sr_contains 'SESSION_REAPED: name=tactic-squash')"
assert_eq "squash: no unlanded-content skip" "no" "$(sr_contains 'SESSION_REAP_SKIP_UNLANDED_CONTENT')"
assert_eq "squash: the worktree is gone" "gone" \
  "$([[ -d "$SR_WTROOT/tactic-squash" ]] && printf 'present' || printf 'gone')"
sr_teardown

# --- Test 10: the ':!intentions' exclusion -----------------------------------

echo "Test: a branch whose only divergence is under intentions/ is reaped"
sr_setup
sr_worktree "tactic-graphonly" intentions
sr_job "4444dddd" "tactic-graphonly" "tactic-graphonly"
sr_transcript "0440-0000" $(( SR_NOW - 4000 ))
sr_add_session "0440-0000" "4444dddd" "tactic-graphonly"
sr_install_registry
sr_run
assert_eq "intentions: sweep returns 0" "0" "$SR_RC"
assert_eq "intentions: the reap proceeds" "yes" "$(sr_contains 'SESSION_REAPED: name=tactic-graphonly')"
assert_eq "intentions: no unlanded-content skip" "no" "$(sr_contains 'SESSION_REAP_SKIP_UNLANDED_CONTENT')"
sr_teardown

# --- Test 11: a missing node-terminal marker skips ---------------------------

echo "Test: a missing node-terminal marker skips the session"
sr_setup
sr_worktree "tactic-nomarker" clean
sr_job "5555eeee" "tactic-nomarker" none
sr_transcript "0551-1111" $(( SR_NOW - 4000 ))
sr_add_session "0551-1111" "5555eeee" "tactic-nomarker"
sr_install_registry
sr_run
assert_eq "no-marker: sweep returns 0" "0" "$SR_RC"
assert_eq "no-marker: the skip is logged" "yes" \
  "$(sr_contains 'SESSION_REAP_SKIP_NO_TERMINAL_MARKER: name=tactic-nomarker')"
assert_eq "no-marker: claude rm never called" "0" "$(sr_rm_calls)"
sr_teardown

# --- Test 12: a malformed marker (no ^node= line) skips ----------------------

echo "Test: a marker with no ^node= line skips the session"
sr_setup
sr_worktree "tactic-badmarker" clean
sr_job "6666ffff" "tactic-badmarker" malformed
sr_transcript "0662-2222" $(( SR_NOW - 4000 ))
sr_add_session "0662-2222" "6666ffff" "tactic-badmarker"
sr_install_registry
sr_run
assert_eq "bad-marker: sweep returns 0" "0" "$SR_RC"
assert_eq "bad-marker: the skip is logged" "yes" \
  "$(sr_contains 'SESSION_REAP_SKIP_NO_TERMINAL_MARKER: name=tactic-badmarker')"
assert_eq "bad-marker: claude rm never called" "0" "$(sr_rm_calls)"
sr_teardown

# --- Test 13: a marker naming a DIFFERENT node skips -------------------------

echo "Test: a marker naming another node cannot authorize this session's reap"
sr_setup
sr_worktree "tactic-othermarker" clean
sr_job "7777aaaa" "tactic-othermarker" "tactic-somewhere-else"
sr_transcript "0773-3333" $(( SR_NOW - 4000 ))
sr_add_session "0773-3333" "7777aaaa" "tactic-othermarker"
sr_install_registry
sr_run
assert_eq "other-marker: sweep returns 0" "0" "$SR_RC"
assert_eq "other-marker: the skip names the foreign marker" "yes" \
  "$(sr_contains 'marker_node=tactic-somewhere-else')"
assert_eq "other-marker: claude rm never called" "0" "$(sr_rm_calls)"
sr_teardown

# --- Test 14: a foreign-owned job dir skips ----------------------------------
#
# The job dir is keyed on the registry's `.id`, and a RESUMED session keeps its
# original `.id` while its `.sessionId` changes — so `.id` collisions across
# sessions are the failure mode the ownership gate exists for. Even with a
# perfectly valid marker inside, a job dir whose state.json names a DIFFERENT
# node must not be trusted.

echo "Test: a job dir whose state.json names another node is not trusted"
sr_setup
sr_worktree "tactic-foreignjob" clean
sr_job "8888bbbb" "tactic-someone-else" "tactic-foreignjob"
sr_transcript "0884-4444" $(( SR_NOW - 4000 ))
sr_add_session "0884-4444" "8888bbbb" "tactic-foreignjob"
sr_install_registry
sr_run
assert_eq "foreign-job: sweep returns 0" "0" "$SR_RC"
assert_eq "foreign-job: the skip is logged" "yes" \
  "$(sr_contains 'SESSION_REAP_SKIP_FOREIGN_JOB_DIR: name=tactic-foreignjob')"
assert_eq "foreign-job: it names the state.json owner" "yes" \
  "$(sr_contains 'state_json_name=tactic-someone-else')"
assert_eq "foreign-job: claude rm never called" "0" "$(sr_rm_calls)"
sr_teardown

# --- Test 15: grace not yet elapsed skips ------------------------------------

echo "Test: a session inside the grace window is skipped (self-close may be mid-reap)"
sr_setup
sr_worktree "tactic-young" clean
sr_job "9999cccc" "tactic-young" "tactic-young"
sr_transcript "0995-5555" $(( SR_NOW - 60 ))
sr_add_session "0995-5555" "9999cccc" "tactic-young"
sr_install_registry
sr_run
assert_eq "grace: sweep returns 0" "0" "$SR_RC"
assert_eq "grace: the skip reports idle vs grace" "yes" \
  "$(sr_contains 'SESSION_REAP_SKIP_GRACE: name=tactic-young session=0995-5555 idle_seconds=60 grace_seconds=300')"
assert_eq "grace: claude rm never called" "0" "$(sr_rm_calls)"
sr_teardown

# --- Test 16: an unmeasurable transcript skips -------------------------------

echo "Test: an unreadable transcript is UNKNOWN and skips the session"
sr_setup
sr_worktree "tactic-notranscript" clean
sr_job "aaaa9999" "tactic-notranscript" "tactic-notranscript"
sr_add_session "0aa6-6666" "aaaa9999" "tactic-notranscript"
sr_install_registry
sr_run
assert_eq "unmeasurable: sweep returns 0" "0" "$SR_RC"
assert_eq "unmeasurable: the skip is logged" "yes" \
  "$(sr_contains 'SESSION_REAP_SKIP_UNMEASURABLE: name=tactic-notranscript')"
assert_eq "unmeasurable: claude rm never called" "0" "$(sr_rm_calls)"
sr_teardown

# --- Test 17: a legacy issue worker is not ours ------------------------------

echo "Test: a ^[0-9]+- issue-worker session is skipped"
sr_setup
sr_job "bbbb8888" "1234-some-issue" "1234-some-issue"
sr_transcript "0bb7-7777" $(( SR_NOW - 4000 ))
sr_add_session "0bb7-7777" "bbbb8888" "1234-some-issue"
sr_install_registry
sr_run
assert_eq "issue-worker: sweep returns 0" "0" "$SR_RC"
assert_eq "issue-worker: the skip is logged" "yes" \
  "$(sr_contains 'SESSION_REAP_SKIP_ISSUE_WORKER: name=1234-some-issue')"
assert_eq "issue-worker: claude rm never called" "0" "$(sr_rm_calls)"
sr_teardown

# --- Test 18: an absent worktree goes straight to claude rm ------------------

echo "Test: with no worktree on disk the reap-safety gates are vacuous and claude rm runs"
sr_setup
sr_job "cccc7777" "tactic-noworktree" "tactic-noworktree"
sr_transcript "0cc8-8888" $(( SR_NOW - 4000 ))
sr_add_session "0cc8-8888" "cccc7777" "tactic-noworktree"
sr_install_registry
sr_run
assert_eq "no-worktree: sweep returns 0" "0" "$SR_RC"
assert_eq "no-worktree: the absence is logged" "yes" \
  "$(sr_contains 'SESSION_REAP_NO_WORKTREE: name=tactic-noworktree')"
assert_eq "no-worktree: the reap proceeds" "yes" "$(sr_contains 'SESSION_REAPED: name=tactic-noworktree')"
assert_eq "no-worktree: claude rm was called once" "1" "$(sr_rm_calls)"
assert_eq "no-worktree: no worktree remove was attempted" "none" "$(sr_line_of '^git-worktree-remove ')"
sr_teardown

# --- Test 19: a null `.id` column must not shift the name column -------------
#
# `@tsv` renders a null `.id` as an empty column, and TAB is IFS whitespace — so
# `IFS=$'\t' read -r sid jid name cwd` would collapse it and slide `name` onto
# the cwd. The row must reach the documented "no usable job id" skip with its
# node name intact, never be silently misclassified.

echo "Test: a registry row with a null id keeps its node-name column"
sr_setup
sr_worktree "tactic-nullid" clean
sr_transcript "0dd9-9999" $(( SR_NOW - 4000 ))
sr_add_session "0dd9-9999" "null" "tactic-nullid"
sr_install_registry
sr_run
assert_eq "null-id: sweep returns 0" "0" "$SR_RC"
assert_eq "null-id: the node name survived the parse" "yes" \
  "$(sr_contains 'SESSION_REAP_SKIP_NO_JOB_DIR: name=tactic-nullid session=0dd9-9999 id=<empty>')"
assert_eq "null-id: claude rm never called" "0" "$(sr_rm_calls)"
sr_teardown

# --- Test 20: an empty registry is a definite zero, not an abort -------------

echo "Test: no terminal workers at all completes with a zero summary"
sr_setup
sr_install_registry
sr_run
assert_eq "empty: sweep returns 0" "0" "$SR_RC"
assert_eq "empty: summary is all zeros" "yes" \
  "$(sr_contains 'SESSION_REAP_COMPLETE: terminal=0 reaped=0 declined=0 unverified=0 skipped=0')"
assert_eq "empty: claude rm never called" "0" "$(sr_rm_calls)"
sr_teardown

# --- Test 21: the optional log file gets the same dispositions ---------------

echo "Test: dispositions also land in the caller's log file, timestamped and tagged"
sr_setup
sr_worktree "tactic-logged" clean
sr_job "dddd6666" "tactic-logged" "tactic-logged"
sr_transcript "0ee1-1112" $(( SR_NOW - 4000 ))
sr_add_session "0ee1-1112" "dddd6666" "tactic-logged"
sr_install_registry
if session_reap_sweep "$SR_DIR/sweep.log" "dispatch-sweep" 2>"$SR_DIR/err"; then SR_RC=0; else SR_RC=$?; fi
SR_ERR=$(cat "$SR_DIR/err")
assert_eq "logfile: sweep returns 0" "0" "$SR_RC"
assert_eq "logfile: the reap line is in the log file" "yes" \
  "$(grep -q 'SESSION_REAPED: name=tactic-logged' "$SR_DIR/sweep.log" && printf 'yes' || printf 'no')"
assert_eq "logfile: the line carries the dispatch-sweep tag" "yes" \
  "$(grep -q '\[dispatch-sweep\] SESSION_REAP_COMPLETE' "$SR_DIR/sweep.log" && printf 'yes' || printf 'no')"
sr_teardown

report_results
