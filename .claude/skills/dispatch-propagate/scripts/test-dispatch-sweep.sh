#!/usr/bin/env bash
# Tests for dispatch-sweep -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 5359-6946.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-sweep tests
# ============================================================================
echo ""
echo "=== dispatch-sweep ==="

# Sweep tests use their own setup/teardown — the script under test sources
# lib-worktree-in-sync.sh from SCRIPT_DIR and shells out to gh/git in patterns
# the main suite's shims don't cover.
#
# Per-test layout under TMPDIR_TEST:
#   bin/                          PATH shim dir (gh, git)
#   scripts/dispatch-sweep        copy of the script under test
#   scripts/lib-worktree-in-sync.sh   sourced helper
#   project/                      fake project root
#   project/.bare/                fake git common dir (parent = project/)
#   project/worktrees/<n>-<slug>/ fake worktrees
#   project/tmp/                  sweep log default dir
#   stub/                         per-test JSON + record files (calls, gh out)
#
# Shims:
#   gh   — per-worktree PR query (gh_pr_list_rest --head) issues two calls:
#          "repo view --json owner -q .owner.login" (returns "natb1") and
#          "api --paginate repos/.../pulls?state=all&...&head=natb1:<branch>",
#          driven by pr-state-<branch>.json (REST format: {state:"open"|"closed",
#          merged_at:<ts>|null, number, created_at, title}); returns '[]' by
#          default. SWEEP_GH_PR_FAIL=<branch> forces the api call to fail.
#          Issue-view is driven by issue-state-<N>.txt.
#   git  — knows worktree list/remove/prune, branch -D, -C <p> status,
#          -C <p> rev-list --count, -C <p> log -1 --format=%ct, and
#          rev-parse --path-format=absolute --git-common-dir.
#          Every mutating call is appended to $STUB_DIR/calls.

sweep_setup() {
  TMPDIR_TEST=$(mktemp -d)
  STUB_DIR="$TMPDIR_TEST/stub"
  mkdir -p "$TMPDIR_TEST/bin" "$STUB_DIR" "$TMPDIR_TEST/scripts" \
           "$TMPDIR_TEST/project/.bare" "$TMPDIR_TEST/project/worktrees" \
           "$TMPDIR_TEST/project/tmp" "$TMPDIR_TEST/fake"
  # dispatch-sweep now defaults WORKTREES_ROOT to <project>/.claude/worktrees
  # (standard layout). This fixture keeps the worktrees under project/worktrees;
  # inject that path via the test seam so the sweep logic is exercised regardless
  # of the default. Re-modeling the fixture to .claude/worktrees is tracked on
  # tactic-retire-bare-layout (deferred fixture-purge scope).
  export DISPATCH_SWEEP_WORKTREES_ROOT="$TMPDIR_TEST/project/worktrees"

  cp "$SCRIPT_DIR/dispatch-sweep" "$TMPDIR_TEST/scripts/dispatch-sweep"
  # dispatch-sweep sources lib.sh via its SCRIPT_DIR (the scripts/ copy) — so
  # lib.sh must sit alongside it. Sourced, not executed — no chmod +x.
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/lib.sh"
  cp "$SCRIPT_DIR/lib-worktree-in-sync.sh" "$TMPDIR_TEST/scripts/lib-worktree-in-sync.sh"
  cp "$SCRIPT_DIR/lib-claude-agents.sh" "$TMPDIR_TEST/scripts/lib-claude-agents.sh"
  cp "$SCRIPT_DIR/lib-reservation-ledger.sh" "$TMPDIR_TEST/scripts/lib-reservation-ledger.sh"
  # dispatch-sweep sources lib-worktree-reap.sh (marker ledger + quarantine) from
  # its SCRIPT_DIR — required for the not-in-sync reap path.
  cp "$SCRIPT_DIR/lib-worktree-reap.sh" "$TMPDIR_TEST/scripts/lib-worktree-reap.sh"
  # dispatch-sweep resolves the grace window by shelling out to dispatch-config-load
  # ("$SCRIPT_DIR/dispatch-config-load" sweep). Without this copy the binary is
  # absent, the call exits non-zero, and the whole config branch (config-file
  # present / field present / field absent) is never exercised — the env-override
  # path silently masks it. Copy it so tests can exercise the config precedence.
  cp "$SCRIPT_DIR/dispatch-config-load" "$TMPDIR_TEST/scripts/dispatch-config-load"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-config-load"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-sweep"

  # Default empty worktree list (each test should overwrite with its records).
  : > "$STUB_DIR/worktree-list.txt"

  # gh shim — handles dispatch-sweep's calls.
  # Shims:
  #   gh   — per-worktree PR query (gh_pr_list_rest --head) issues two gh calls:
  #          1. "repo view --json owner -q .owner.login" → returns "natb1"
  #          2. "api --paginate repos/{owner}/{repo}/pulls?state=all&...&head=natb1:<branch>"
  #             → serves pr-state-<branch>.json (REST format: each entry has
  #             {state:"open"|"closed", merged_at:<ts>|null, number, created_at, title}).
  #             Returns '[]' by default when no fixture exists.
  #             SWEEP_GH_PR_FAIL=<branch> makes the api call fail for that branch.
  #          Issue-view uses issue-state-<N>.txt.
  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
case "$args" in
  "repo view --json owner -q .owner.login")
    # gh_pr_list_rest --head owner resolution: resolve the current repo owner.
    echo "natb1"
    ;;
  api\ --paginate\ */pulls\?*)
    # dispatch-sweep per-worktree PR query via gh_pr_list_rest (#2258):
    # gh api --paginate repos/{owner}/{repo}/pulls?state=all&per_page=100&head=natb1:<branch>
    # Extract branch from the head=natb1:<branch> query parameter.
    br=$(printf '%s' "$args" | grep -oE 'head=natb1:[^ ]+' | sed 's/head=natb1://')
    if [[ "${SWEEP_GH_PR_FAIL:-}" == "$br" ]]; then
      echo "gh sweep stub: simulated gh api pulls failure for $br" >&2
      exit 1
    fi
    f="$STUB_DIR/pr-state-${br}.json"
    if [[ -f "$f" ]]; then cat "$f"; else echo '[]'; fi
    ;;
  api\ repos/*/issues/[0-9]*)
    # dispatch-sweep closed-issue check via gh_issue_view_rest (#2257): the helper
    # issues `gh api repos/{owner}/{repo}/issues/<N>` and projects+upcases .state.
    num="${args##*/}"
    # Controllable failure: if SWEEP_GH_ISSUE_FAIL matches this issue number, fail.
    if [[ "${SWEEP_GH_ISSUE_FAIL:-}" == "$num" ]]; then
      echo "gh sweep stub: simulated gh api issues/$num failure for $num" >&2
      exit 1
    fi
    # Per-issue state fixture: issue-state-<N>.txt holds the raw state string
    # (e.g. CLOSED/OPEN/GARBAGE). Emit it inside a raw-REST issue object with the
    # state lowercased — the porcelain bridge in gh_issue_view_rest upcases it back.
    f="$STUB_DIR/issue-state-${num}.txt"
    if [[ -f "$f" ]]; then
      state_lc=$(tr '[:upper:]' '[:lower:]' < "$f")
      printf '{"number":%s,"state":"%s"}\n' "$num" "$state_lc"
    else
      echo "gh sweep stub: no issue-state-${num}.txt for issue view $num" >&2
      exit 1
    fi
    ;;
  *)
    echo "gh sweep stub: unknown invocation: $args" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/gh"

  # git shim — multi-mode; records every mutating call so tests can assert.
  cat > "$TMPDIR_TEST/bin/git" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
PROJECT_ROOT_FAKE="$(cd "$(dirname "$0")/.." && pwd)/project"

# Detect `-C <path>` prefix.
if [[ "${1:-}" == "-C" ]]; then
  ctx_path="$2"
  shift 2
  sub="$1"; shift
  rest="$*"
  case "$sub $rest" in
    "status --porcelain")
      # Per-path porcelain output; default empty (clean).
      key=$(echo "$ctx_path" | tr '/' '_')
      f="$STUB_DIR/status${key}.txt"
      [[ -f "$f" ]] && cat "$f"
      exit 0
      ;;
    "rev-list --count HEAD --not --remotes")
      key=$(echo "$ctx_path" | tr '/' '_')
      f="$STUB_DIR/revlist${key}.txt"
      if [[ -f "$f" ]]; then cat "$f"; else echo "0"; fi
      exit 0
      ;;
    "diff --quiet origin/main HEAD")
      # worktree_merged_in_sync tree-identity check (#1845). diffrc<key>.txt holds
      # the exit code: 0 = identical (retire-able), 1 = real diff, >1 = bad-ref
      # error. Default 0 (identical) so existing merged-in-sync tests stay green.
      key=$(echo "$ctx_path" | tr '/' '_')
      f="$STUB_DIR/diffrc${key}.txt"
      if [[ -f "$f" ]]; then exit "$(cat "$f")"; else exit 0; fi
      ;;
    "log -1 --format=%ct HEAD")
      key=$(echo "$ctx_path" | tr '/' '_')
      f="$STUB_DIR/headct${key}.txt"
      if [[ -f "$f" ]]; then cat "$f"; else exit 1; fi
      exit 0
      ;;
    "format-patch origin/main..HEAD -o "*)
      # reap_quarantine committed-divergence capture. SWEEP_FORMAT_PATCH_FAIL
      # forces a failure (quarantine-abort test). Zero patches written is fine
      # (the lib treats 0 patches as success); the -o dest already exists.
      if [[ -n "${SWEEP_FORMAT_PATCH_FAIL:-}" ]]; then
        echo "git -C stub: simulated format-patch failure" >&2
        exit 1
      fi
      exit 0
      ;;
    "diff HEAD")
      # reap_quarantine uncommitted-tracked capture → working-tree.patch. Emit a
      # real diff body so the captured patch is non-empty when a fixture exists.
      key=$(echo "$ctx_path" | tr '/' '_')
      f="$STUB_DIR/wtdiff${key}.txt"
      [[ -f "$f" ]] && cat "$f"
      exit 0
      ;;
    "ls-files --others --exclude-standard")
      # reap_quarantine untracked-files capture. The fixture lists relative paths;
      # the lib cp -p's each REAL file from the worktree into untracked/.
      key=$(echo "$ctx_path" | tr '/' '_')
      f="$STUB_DIR/untracked${key}.txt"
      [[ -f "$f" ]] && cat "$f"
      exit 0
      ;;
    *)
      echo "git -C stub: unknown invocation: -C $ctx_path $sub $rest" >&2
      exit 1
      ;;
  esac
fi

args="$*"
case "$args" in
  "rev-parse --path-format=absolute --git-common-dir")
    echo "$PROJECT_ROOT_FAKE/.bare"
    ;;
  "worktree list --porcelain")
    cat "$STUB_DIR/worktree-list.txt"
    ;;
  "worktree remove --force "*)
    path="${args#worktree remove --force }"
    echo "worktree-remove-force:$path" >> "$STUB_DIR/calls"
    ;;
  "worktree remove "*)
    path="${args#worktree remove }"
    echo "worktree-remove:$path" >> "$STUB_DIR/calls"
    ;;
  "worktree prune")
    echo "worktree-prune" >> "$STUB_DIR/calls"
    ;;
  "branch -D "*)
    name="${args#branch -D }"
    echo "branch-D:$name" >> "$STUB_DIR/calls"
    ;;
  *)
    echo "git sweep stub: unknown invocation: $args" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/git"

  export PATH="$TMPDIR_TEST/bin:$PATH"

  # Default fake `claude` — prints `[]` and exits 0 (no live sessions).
  # Step 3's liveness gate sees a definite "no sessions" and proceeds with
  # removal. Tests that need a live session call sweep_fake_claude_sessions_by_name.
  local default_fake="$TMPDIR_TEST/fake/claude"
  cat > "$default_fake" <<'FAKE'
#!/usr/bin/env bash
printf '[]'
exit 0
FAKE
  chmod +x "$default_fake"

  # Defaults for dispatch-sweep env overrides.
  export CLAUDE_AGENTS_CMD="$default_fake"
  export DISPATCH_SWEEP_LOG_FILE="$STUB_DIR/sweep.log"
  export DISPATCH_SWEEP_NOW="2026-01-01T00:00:00Z"
  export GH_RETRY_BASE_DELAY=0
  # Point the reservation ledger at a scratch dir that is absent by default — no
  # marker files, so reservation_exists is false for every row and the
  # reserved-skip is inert. A reserved-skip test opts in by creating a marker here.
  export DISPATCH_RESERVATION_DIR="$STUB_DIR/reservations"
  # dispatch-sweep's grace-resolution shells out to dispatch-config-load, which
  # reads DISPATCH_CONFIG_DIR. Point it at an EMPTY dir by default: with no
  # sweep.json present the loader prints "no-config", so dispatch-sweep falls
  # through to the env override (DISPATCH_SWEEP_NOT_IN_SYNC_GRACE_S) / baked
  # default — exactly the behavior every existing env-override test relies on. A
  # config-path test opts in by writing sweep.json into this dir.
  mkdir -p "$STUB_DIR/config"
  export DISPATCH_CONFIG_DIR="$STUB_DIR/config"
}

sweep_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  STUB_DIR=""
  export PATH="$SAVED_PATH"
  unset CLAUDE_AGENTS_CMD DISPATCH_SWEEP_LOG_FILE DISPATCH_SWEEP_NOW DISPATCH_RESERVATION_DIR GH_RETRY_BASE_DELAY SWEEP_GH_PR_FAIL SWEEP_GH_ISSUE_FAIL
  # DISPATCH_CONFIG_DIR / DISPATCH_SWEEP_WORKTREES_ROOT are sweep-local — never
  # leak them into later non-sweep tests.
  unset DISPATCH_CONFIG_DIR DISPATCH_SWEEP_WORKTREES_ROOT
  # Not-in-sync reap seams — never leak the epoch/grace/fail toggles across tests.
  unset DISPATCH_SWEEP_NOW_EPOCH DISPATCH_SWEEP_NOT_IN_SYNC_GRACE_S SWEEP_FORMAT_PATCH_FAIL
}

# Helper: register a worktree in the porcelain list AND create its directory.
# Each record is the blank-line-terminated block dispatch-sweep parses.
sweep_register_wt() {
  local wt_path="$1" branch="$2"
  mkdir -p "$wt_path"
  printf 'worktree %s\nHEAD abc123\nbranch refs/heads/%s\n\n' \
    "$wt_path" "$branch" >> "$STUB_DIR/worktree-list.txt"
}

# Convenience: convert an absolute path to the status/revlist/headct key
# used by the git -C shim.
sweep_path_key() {
  echo "$1" | tr '/' '_'
}

# Helper: install a fake `claude` whose `agents --json` invocation (NO --cwd)
# returns sessions keyed by name — matching how claude_sessions_with_name
# queries the daemon after the #882 Unit 2 name-keyed rewrite.
# Each argument must be in `name=sid` form; name is the worktree basename
# (as passed via --name=<basename> by dispatch-launch-worker). The cwd field is
# set to "" since name-keyed classification ignores it.
# The fake ignores any --cwd argument and always returns the full payload; the
# client-side jq select(.name == $name) in claude_sessions_with_name does the
# filtering, exactly as in production.
sweep_fake_claude_sessions_by_name() {
  local fake="$TMPDIR_TEST/fake/claude"
  local all_payload="[" entry name sid first=1
  for entry in "$@"; do
    name="${entry%%=*}"
    sid="${entry#*=}"
    if (( first )); then first=0; else all_payload+=","; fi
    all_payload+="{\"sessionId\":\"$sid\",\"pid\":1,\"status\":\"busy\",\"name\":\"$name\",\"cwd\":\"\"}"
  done
  all_payload+="]"
  printf '%s' "$all_payload" > "$TMPDIR_TEST/fake/payload.json"
  cat > "$fake" <<'FAKE'
#!/usr/bin/env bash
# Ignore any args (including --cwd) — return the full payload unconditionally.
# claude_sessions_with_name applies its own jq name filter client-side.
cat "$(cd "$(dirname "$0")" && pwd)/payload.json"
exit 0
FAKE
  chmod +x "$fake"
  export CLAUDE_AGENTS_CMD="$fake"
}

# --- Test 1: merged classification triggers cleanup --------------------------

echo "Test: merged worktree (in-sync) is removed + branch deleted"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/42-feature"
sweep_register_wt "$WT_PATH" "42-feature"
echo '[{"state":"closed","merged_at":"2024-01-01T00:00:00Z","number":100,"created_at":"2024-01-01T00:00:00Z","title":"PR 100"}]' \
  > "$STUB_DIR/pr-state-42-feature.json"
# Clean tree + zero unpushed (defaults already match this — explicit for clarity).
key=$(sweep_path_key "$WT_PATH")
: > "$STUB_DIR/status${key}.txt"
echo "0" > "$STUB_DIR/revlist${key}.txt"

# Run the sweep; capture stdout, stderr, and exit code.
out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "merged sweep exits 0" "0" "$rc"
assert_eq "merged sweep emits no stdout (nothing to adopt)" "" "$out"

# Calls recorded.
calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "worktree-remove:$WT_PATH"; then
  PASS=$((PASS + 1)); echo "  PASS: merged worktree remove call recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: merged worktree remove call recorded"
  echo "    calls: $calls"
fi
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "branch-D:42-feature"; then
  PASS=$((PASS + 1)); echo "  PASS: merged branch -D call recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: merged branch -D call recorded"
fi

# Log entry.
TOTAL=$((TOTAL + 1))
if grep -q "REMOVE_MERGED: '$WT_PATH' branch=42-feature pr=#100" \
   "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: REMOVE_MERGED log line present"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: REMOVE_MERGED log line present"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test 1a: squash-merged worktree retired despite non-zero rev-list (#1845) ---
# Reproduces the squash-merge bug: a `git merge origin/main` left a local-only
# merge commit, so `rev-list --count HEAD --not --remotes` is >=1 even though the
# tree is byte-identical to origin/main (the squash-merge deleted the remote head
# branch, defeating reachability). The merged path now uses worktree_merged_in_sync
# (tree identity), so the worktree is retired. On the PRE-FIX worktree_in_sync,
# rev-list>=1 → SKIP_MERGED_NOT_IN_SYNC and this test FAILS — proving it reproduces
# the bug, not merely exercises the fix.
echo "Test: squash-merged worktree retired despite non-zero rev-list (#1845)"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/80-squash-merged"
sweep_register_wt "$WT_PATH" "80-squash-merged"
echo '[{"state":"closed","merged_at":"2024-01-01T00:00:00Z","number":800,"created_at":"2024-01-01T00:00:00Z","title":"PR 800"}]' \
  > "$STUB_DIR/pr-state-80-squash-merged.json"
key=$(sweep_path_key "$WT_PATH")
: > "$STUB_DIR/status${key}.txt"          # clean working tree
echo "1" > "$STUB_DIR/revlist${key}.txt"  # local-only merge commit (would defeat rev-list)
echo "0" > "$STUB_DIR/diffrc${key}.txt"   # tree identical to origin/main

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "squash-merged sweep exits 0" "0" "$rc"

calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "worktree-remove:$WT_PATH"; then
  PASS=$((PASS + 1)); echo "  PASS: squash-merged worktree remove call recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: squash-merged worktree remove call recorded"
  echo "    calls: $calls"
fi
TOTAL=$((TOTAL + 1))
if grep -q "REMOVE_MERGED: '$WT_PATH' branch=80-squash-merged pr=#800" \
   "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: REMOVE_MERGED log line present (squash-merged, non-zero rev-list)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: REMOVE_MERGED log line present (squash-merged, non-zero rev-list)"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test 1b: closed-issue worktree (in-sync) is removed + branch deleted ----

echo "Test: closed-issue worktree (in-sync) is removed + branch deleted"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/57-closed-feature"
sweep_register_wt "$WT_PATH" "57-closed-feature"
# No pr-state fixture — stub returns '[]' by default, sending this to the issue path.
# Issue 57 is CLOSED.
echo "CLOSED" > "$STUB_DIR/issue-state-57.txt"
# Clean tree + zero unpushed (defaults).
key=$(sweep_path_key "$WT_PATH")
: > "$STUB_DIR/status${key}.txt"
echo "0" > "$STUB_DIR/revlist${key}.txt"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "closed-issue sweep exits 0" "0" "$rc"
assert_eq "closed-issue sweep emits no stdout" "" "$out"

calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "worktree-remove:$WT_PATH"; then
  PASS=$((PASS + 1)); echo "  PASS: REMOVE_CLOSED_ISSUE worktree-remove call recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: REMOVE_CLOSED_ISSUE worktree-remove call recorded"
  echo "    calls: $calls"
fi
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "branch-D:57-closed-feature"; then
  PASS=$((PASS + 1)); echo "  PASS: REMOVE_CLOSED_ISSUE branch -D call recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: REMOVE_CLOSED_ISSUE branch -D call recorded"
fi
TOTAL=$((TOTAL + 1))
if grep -q "REMOVE_CLOSED_ISSUE: '$WT_PATH' branch=57-closed-feature issue=#57" \
   "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: REMOVE_CLOSED_ISSUE log line present"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: REMOVE_CLOSED_ISSUE log line present"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test 1c: closed-issue worktree (not-in-sync) is kept ---------------------

echo "Test: closed-issue worktree (not-in-sync) is kept"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/58-closed-dirty"
sweep_register_wt "$WT_PATH" "58-closed-dirty"
# No pr-state fixture — stub returns '[]' by default, sending this to the issue path.
echo "CLOSED" > "$STUB_DIR/issue-state-58.txt"
# Not-in-sync: has an uncommitted change.
key=$(sweep_path_key "$WT_PATH")
echo " M somefile.txt" > "$STUB_DIR/status${key}.txt"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "closed-not-in-sync sweep exits 0" "0" "$rc"

calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if ! echo "$calls" | grep -q "worktree-remove"; then
  PASS=$((PASS + 1)); echo "  PASS: SKIP_CLOSED_NOT_IN_SYNC no worktree-remove call"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: SKIP_CLOSED_NOT_IN_SYNC no worktree-remove call"
  echo "    calls: $calls"
fi
TOTAL=$((TOTAL + 1))
if grep -q "SKIP_CLOSED_NOT_IN_SYNC: '$WT_PATH' branch=58-closed-dirty issue=#58" \
   "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: SKIP_CLOSED_NOT_IN_SYNC log line present"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: SKIP_CLOSED_NOT_IN_SYNC log line present"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test 1d: open-issue worktree is kept (regression guard) -----------------

echo "Test: open-issue worktree is kept (regression guard)"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/59-open-feature"
sweep_register_wt "$WT_PATH" "59-open-feature"
# No pr-state fixture — stub returns '[]' by default, sending this to the issue path.
echo "OPEN" > "$STUB_DIR/issue-state-59.txt"
key=$(sweep_path_key "$WT_PATH")
: > "$STUB_DIR/status${key}.txt"
echo "0" > "$STUB_DIR/revlist${key}.txt"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "open-issue sweep exits 0" "0" "$rc"

calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if ! echo "$calls" | grep -q "worktree-remove"; then
  PASS=$((PASS + 1)); echo "  PASS: open-issue worktree not removed"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: open-issue worktree not removed"
  echo "    calls: $calls"
fi
sweep_teardown

# --- Test 1e: gh issue view fails → isolated ERROR_ISSUE_STATE_FETCH, exit 0, sibling still removed ---
#
# The old contract (exit 1) is gone. A per-worktree gh issue view failure is now
# isolated: logged as ERROR_ISSUE_STATE_FETCH and skipped, never aborting the sweep.
# A sibling in-sync MERGED worktree in the same run must still be removed to prove
# the sweep continues past the failure.

echo "Test: gh-issue-view fails → isolated log+continue+exit 0, sibling still removed"
sweep_setup
# Failing worktree: no pr-state fixture (stub returns '[]') → issue path → gh issue view fails.
WT_PATH="$TMPDIR_TEST/project/worktrees/60-closed-feature"
sweep_register_wt "$WT_PATH" "60-closed-feature"
# No issue-state-60.txt — let gh issue view fail via the SWEEP_GH_ISSUE_FAIL env var.
export SWEEP_GH_ISSUE_FAIL="60"

# Sibling in-sync MERGED worktree to prove the sweep continues.
WT_PATH_60B="$TMPDIR_TEST/project/worktrees/60b-sibling-merged"
sweep_register_wt "$WT_PATH_60B" "60b-sibling-merged"
echo '[{"state":"closed","merged_at":"2024-01-01T00:00:00Z","number":600,"created_at":"2024-01-01T00:00:00Z","title":"PR 600"}]' > "$STUB_DIR/pr-state-60b-sibling-merged.json"
key_60b=$(sweep_path_key "$WT_PATH_60B")
: > "$STUB_DIR/status${key_60b}.txt"
echo "0" > "$STUB_DIR/revlist${key_60b}.txt"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "gh-issue-view fail → exit 0 (isolated, not fatal)" "0" "$rc"

calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "worktree-remove:$WT_PATH_60B"; then
  PASS=$((PASS + 1)); echo "  PASS: sibling was removed (sweep continued past issue-view failure)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: sibling was removed (sweep continued past issue-view failure)"
  echo "    calls: $calls"
fi
TOTAL=$((TOTAL + 1))
if grep -q "ERROR_ISSUE_STATE_FETCH: branch=60-closed-feature issue=60 gh_issue_view_rest failed" \
   "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: ERROR_ISSUE_STATE_FETCH log line present"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: ERROR_ISSUE_STATE_FETCH log line present"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
unset SWEEP_GH_ISSUE_FAIL
sweep_teardown

# --- Test 1f: open-PR worktree with closed issue is kept (OPEN_BY_BRANCH guard) ---

echo "Test: open-PR worktree with closed issue is kept (OPEN_BY_BRANCH guard)"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/61-active-pr"
sweep_register_wt "$WT_PATH" "61-active-pr"
echo '[{"state":"open","merged_at":null,"number":888,"created_at":"2024-01-01T00:00:00Z","title":"PR 888"}]' \
  > "$STUB_DIR/pr-state-61-active-pr.json"
# Issue is CLOSED, but the OPEN PR precedence guard must short-circuit before gh issue view.
echo "CLOSED" > "$STUB_DIR/issue-state-61.txt"
key=$(sweep_path_key "$WT_PATH")
: > "$STUB_DIR/status${key}.txt"
echo "0" > "$STUB_DIR/revlist${key}.txt"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "open-PR closed-issue sweep exits 0" "0" "$rc"

calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if ! echo "$calls" | grep -q "worktree-remove"; then
  PASS=$((PASS + 1)); echo "  PASS: open-PR worktree not removed despite closed issue"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: open-PR worktree not removed despite closed issue"
  echo "    calls: $calls"
fi
sweep_teardown

# --- Test 15: Step 3 with live name-match — merged+in-sync worktree is kept --
#
# A merged + in-sync worktree whose basename matches a live session in the
# fake-claude registry must NOT be removed; the script must log
# SKIP_MERGED_LIVE_SESSION and add it to the surviving list.

echo "Test: Step 3 skips merged+in-sync worktree when a live session matches its basename"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/70-live-merged"
sweep_register_wt "$WT_PATH" "70-live-merged"
key=$(sweep_path_key "$WT_PATH")
: > "$STUB_DIR/status${key}.txt"
echo "0" > "$STUB_DIR/revlist${key}.txt"
echo '[{"state":"closed","merged_at":"2024-01-01T00:00:00Z","number":300,"created_at":"2024-01-01T00:00:00Z","title":"PR 300"}]' \
  > "$STUB_DIR/pr-state-70-live-merged.json"
# Register a live session whose name matches the worktree's basename.
sweep_fake_claude_sessions_by_name "70-live-merged=sess-live-70"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "Step3-live-merged sweep exits 0" "0" "$rc"

# The worktree must NOT have been removed.
calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -q "worktree-remove:$WT_PATH"; then
  FAIL=$((FAIL + 1)); echo "  FAIL: Step 3 must NOT remove a worktree with a live session"
  echo "    calls: $calls"
else
  PASS=$((PASS + 1)); echo "  PASS: Step 3 did not remove the live-session worktree"
fi

# The log must carry SKIP_MERGED_LIVE_SESSION.
TOTAL=$((TOTAL + 1))
if grep -q "SKIP_MERGED_LIVE_SESSION: '$WT_PATH' branch=70-live-merged pr=#300" \
   "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: SKIP_MERGED_LIVE_SESSION log line present"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: SKIP_MERGED_LIVE_SESSION log line present"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test 16: Step 3 happy path — merged+in-sync with no live session is removed

echo "Test: Step 3 removes merged+in-sync worktree when no live session matches its basename"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/71-no-live-merged"
sweep_register_wt "$WT_PATH" "71-no-live-merged"
key=$(sweep_path_key "$WT_PATH")
: > "$STUB_DIR/status${key}.txt"
echo "0" > "$STUB_DIR/revlist${key}.txt"
echo '[{"state":"closed","merged_at":"2024-01-01T00:00:00Z","number":301,"created_at":"2024-01-01T00:00:00Z","title":"PR 301"}]' \
  > "$STUB_DIR/pr-state-71-no-live-merged.json"
# Default fake (no live sessions) — the worktree is free to remove.

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "Step3-no-live-merged sweep exits 0" "0" "$rc"

calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "worktree-remove:$WT_PATH"; then
  PASS=$((PASS + 1)); echo "  PASS: Step 3 removed the unoccupied merged worktree"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: Step 3 removed the unoccupied merged worktree"
  echo "    calls: $calls"
fi

TOTAL=$((TOTAL + 1))
if grep -q "REMOVE_MERGED: '$WT_PATH' branch=71-no-live-merged pr=#301" \
   "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: REMOVE_MERGED log line present"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: REMOVE_MERGED log line present"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test 17: detached-HEAD worktree is skipped by Step 2 --------------------
#
# A worktree with no branch line (detached HEAD) has an empty WT_BRANCH after
# split_worktree_record. Step 2's [[ -z "$WT_BRANCH" ]] guard must skip it, so
# no worktree-remove or branch-D call is recorded for it.

echo "Test: detached-HEAD worktree in worktrees/ is skipped (not removed)"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/80-detached"
mkdir -p "$WT_PATH"
# Write a branchless porcelain record directly (no branch line).
printf 'worktree %s\nHEAD deadbeef\n\n' "$WT_PATH" >> "$STUB_DIR/worktree-list.txt"
# No pr-state fixture needed — the branch guard fires before any gh call.

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "detached-HEAD sweep exits 0" "0" "$rc"

calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if ! echo "$calls" | grep -q "worktree-remove"; then
  PASS=$((PASS + 1)); echo "  PASS: detached-HEAD worktree not removed"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: detached-HEAD worktree not removed"
  echo "    calls: $calls"
fi
TOTAL=$((TOTAL + 1))
if ! echo "$calls" | grep -q "branch-D"; then
  PASS=$((PASS + 1)); echo "  PASS: detached-HEAD worktree no branch-D call"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: detached-HEAD worktree no branch-D call"
  echo "    calls: $calls"
fi
sweep_teardown

# --- Test 18: non-issue branch in merged map is reaped via merged-cleanup path --
#
# A worktree with a non-issue branch (empty WT_NUM) that appears MERGED in the
# PR list must still be removed + branch deleted — the merged-cleanup path
# operates on branch names, not issue numbers, so empty WT_NUM is no obstacle.
# This confirms list_worktree_records' empty-WT_NUM records flow through the
# merged-cleanup path correctly.

echo "Test: non-issue branch (hotfix-login) in merged map is reaped"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/hotfix-login"
sweep_register_wt "$WT_PATH" "hotfix-login"
echo '[{"state":"closed","merged_at":"2024-01-01T00:00:00Z","number":400,"created_at":"2024-01-01T00:00:00Z","title":"PR 400"}]' \
  > "$STUB_DIR/pr-state-hotfix-login.json"
# Clean tree + zero unpushed.
key=$(sweep_path_key "$WT_PATH")
: > "$STUB_DIR/status${key}.txt"
echo "0" > "$STUB_DIR/revlist${key}.txt"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "non-issue-branch merged sweep exits 0" "0" "$rc"

calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "worktree-remove:$WT_PATH"; then
  PASS=$((PASS + 1)); echo "  PASS: non-issue merged worktree removed"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-issue merged worktree removed"
  echo "    calls: $calls"
fi
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "branch-D:hotfix-login"; then
  PASS=$((PASS + 1)); echo "  PASS: non-issue merged branch deleted"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-issue merged branch deleted"
  echo "    calls: $calls"
fi
TOTAL=$((TOTAL + 1))
if grep -q "REMOVE_MERGED: '$WT_PATH' branch=hotfix-login pr=#400" \
   "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: REMOVE_MERGED log line present for non-issue branch"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: REMOVE_MERGED log line present for non-issue branch"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test R1: merged worktree WITH a reservation marker is skipped (SKIP_RESERVED) ---
echo "Test: merged worktree with a reservation marker is skipped (SKIP_RESERVED)"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/90-reserved-merged"
sweep_register_wt "$WT_PATH" "90-reserved-merged"
echo '[{"state":"closed","merged_at":"2024-01-01T00:00:00Z","number":500,"created_at":"2024-01-01T00:00:00Z","title":"PR 500"}]' \
  > "$STUB_DIR/pr-state-90-reserved-merged.json"
key=$(sweep_path_key "$WT_PATH")
: > "$STUB_DIR/status${key}.txt"
echo "0" > "$STUB_DIR/revlist${key}.txt"
# Opt in: create the reservation marker for this worktree's basename.
mkdir -p "$DISPATCH_RESERVATION_DIR"
printf 'session=resv\nissue=90\ntimestamp=2026-01-01T00:00:00Z\n' \
  > "$DISPATCH_RESERVATION_DIR/90-reserved-merged"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "reserved-merged sweep exits 0" "0" "$rc"
calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if ! echo "$calls" | grep -q "worktree-remove"; then
  PASS=$((PASS + 1)); echo "  PASS: reserved merged worktree not removed"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: reserved merged worktree not removed"
  echo "    calls: $calls"
fi
TOTAL=$((TOTAL + 1))
if grep -q "SKIP_RESERVED: '$WT_PATH' branch=90-reserved-merged" \
   "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: SKIP_RESERVED log line present (merged)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: SKIP_RESERVED log line present (merged)"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test R2: closed-issue worktree WITH a reservation marker is skipped (SKIP_RESERVED) ---
echo "Test: closed-issue worktree with a reservation marker is skipped (SKIP_RESERVED)"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/91-reserved-closed"
sweep_register_wt "$WT_PATH" "91-reserved-closed"
# No pr-state fixture — stub returns '[]' by default, but the reservation guard fires first.
echo "CLOSED" > "$STUB_DIR/issue-state-91.txt"
key=$(sweep_path_key "$WT_PATH")
: > "$STUB_DIR/status${key}.txt"
echo "0" > "$STUB_DIR/revlist${key}.txt"
# Opt in: create the reservation marker for this worktree's basename.
mkdir -p "$DISPATCH_RESERVATION_DIR"
printf 'session=resv\nissue=91\ntimestamp=2026-01-01T00:00:00Z\n' \
  > "$DISPATCH_RESERVATION_DIR/91-reserved-closed"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "reserved-closed sweep exits 0" "0" "$rc"
calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if ! echo "$calls" | grep -q "worktree-remove"; then
  PASS=$((PASS + 1)); echo "  PASS: reserved closed worktree not removed"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: reserved closed worktree not removed"
  echo "    calls: $calls"
fi
TOTAL=$((TOTAL + 1))
if grep -q "SKIP_RESERVED: '$WT_PATH' branch=91-reserved-closed" \
   "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: SKIP_RESERVED log line present (closed)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: SKIP_RESERVED log line present (closed)"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test R3: closed-issue worktree WITH a live session (NO reservation) is skipped (SKIP_CLOSED_LIVE_SESSION) ---
echo "Test: closed-issue worktree with a live session is skipped (SKIP_CLOSED_LIVE_SESSION)"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/92-closed-live"
sweep_register_wt "$WT_PATH" "92-closed-live"
# No pr-state fixture — stub returns '[]' by default, sending this to the issue path.
echo "CLOSED" > "$STUB_DIR/issue-state-92.txt"
key=$(sweep_path_key "$WT_PATH")
: > "$STUB_DIR/status${key}.txt"
echo "0" > "$STUB_DIR/revlist${key}.txt"
sweep_fake_claude_sessions_by_name "92-closed-live=sess-live-92"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "closed-live sweep exits 0" "0" "$rc"
calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if ! echo "$calls" | grep -q "worktree-remove"; then
  PASS=$((PASS + 1)); echo "  PASS: closed live-session worktree not removed"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: closed live-session worktree not removed"
  echo "    calls: $calls"
fi
TOTAL=$((TOTAL + 1))
if grep -q "SKIP_CLOSED_LIVE_SESSION: '$WT_PATH' branch=92-closed-live issue=#92" \
   "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: SKIP_CLOSED_LIVE_SESSION log line present"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: SKIP_CLOSED_LIVE_SESSION log line present"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test I1: unexpected issue state is isolated (ERROR_ISSUE_STATE_FETCH) ---
#
# A branch whose issue returns a non-OPEN, non-CLOSED state (e.g. "GARBAGE")
# must be logged as ERROR_ISSUE_STATE_FETCH and skipped, not fatal. A sibling
# in-sync MERGED worktree in the same run must still be removed.

echo "Test: unexpected issue state is isolated (exit 0, sibling still removed)"
sweep_setup
# Worktree with garbage issue state: no pr-state fixture (stub returns '[]') → issue path.
WT_PATH="$TMPDIR_TEST/project/worktrees/62-garbage-issue"
sweep_register_wt "$WT_PATH" "62-garbage-issue"
echo "GARBAGE" > "$STUB_DIR/issue-state-62.txt"

# Sibling in-sync MERGED worktree to prove the sweep continues.
WT_PATH_62B="$TMPDIR_TEST/project/worktrees/62b-sibling-merged"
sweep_register_wt "$WT_PATH_62B" "62b-sibling-merged"
echo '[{"state":"closed","merged_at":"2024-01-01T00:00:00Z","number":620,"created_at":"2024-01-01T00:00:00Z","title":"PR 620"}]' > "$STUB_DIR/pr-state-62b-sibling-merged.json"
key_62b=$(sweep_path_key "$WT_PATH_62B")
: > "$STUB_DIR/status${key_62b}.txt"
echo "0" > "$STUB_DIR/revlist${key_62b}.txt"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "unexpected-state sweep exits 0" "0" "$rc"

calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "worktree-remove:$WT_PATH_62B"; then
  PASS=$((PASS + 1)); echo "  PASS: sibling was removed (sweep continued past unexpected-state)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: sibling was removed (sweep continued past unexpected-state)"
  echo "    calls: $calls"
fi
TOTAL=$((TOTAL + 1))
if grep -q "ERROR_ISSUE_STATE_FETCH: branch=62-garbage-issue issue=62 unexpected state='GARBAGE'" \
   "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: ERROR_ISSUE_STATE_FETCH unexpected-state log line present"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: ERROR_ISSUE_STATE_FETCH unexpected-state log line present"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test I2: pr-list --head failure is isolated (ERROR_PR_STATE_FETCH) -----
#
# A branch whose `gh_pr_list_rest --head` call fails must be logged as
# ERROR_PR_STATE_FETCH and skipped, not fatal. A sibling in-sync MERGED
# worktree in the same run must still be removed.

echo "Test: gh_pr_list_rest --head failure is isolated (exit 0, sibling still removed)"
sweep_setup
# Failing worktree: SWEEP_GH_PR_FAIL makes the stub exit 1 for this branch.
WT_PATH="$TMPDIR_TEST/project/worktrees/63-pr-fail"
sweep_register_wt "$WT_PATH" "63-pr-fail"
export SWEEP_GH_PR_FAIL="63-pr-fail"

# Sibling in-sync MERGED worktree to prove the sweep continues.
WT_PATH_63B="$TMPDIR_TEST/project/worktrees/63b-pr-ok"
sweep_register_wt "$WT_PATH_63B" "63b-pr-ok"
echo '[{"state":"closed","merged_at":"2024-01-01T00:00:00Z","number":630,"created_at":"2024-01-01T00:00:00Z","title":"PR 630"}]' > "$STUB_DIR/pr-state-63b-pr-ok.json"
key_63b=$(sweep_path_key "$WT_PATH_63B")
: > "$STUB_DIR/status${key_63b}.txt"
echo "0" > "$STUB_DIR/revlist${key_63b}.txt"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "pr-list-fail sweep exits 0" "0" "$rc"

calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "worktree-remove:$WT_PATH_63B"; then
  PASS=$((PASS + 1)); echo "  PASS: sibling was removed (sweep continued past pr-list failure)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: sibling was removed (sweep continued past pr-list failure)"
  echo "    calls: $calls"
fi
TOTAL=$((TOTAL + 1))
if grep -q "ERROR_PR_STATE_FETCH: branch=63-pr-fail gh_pr_list_rest --head failed" \
   "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: ERROR_PR_STATE_FETCH log line present"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: ERROR_PR_STATE_FETCH log line present"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
unset SWEEP_GH_PR_FAIL
sweep_teardown

# ============================================================================
# Age-gated not-in-sync reap tests (#2026)
# ============================================================================
#
# A merged/closed worktree that is NOT in sync is skipped on first observation
# (a write-once marker starts the grace clock), kept while age < grace, then
# QUARANTINED + force-reaped once age >= grace. AC3: a live session or a
# reservation short-circuits before the reap path is ever reached. AC2: the
# divergence is captured under the RUNNER root and survives the worktree removal;
# a quarantine failure ABORTS the reap (worktree left intact).
#
# Determinism: AGE is driven purely by DISPATCH_SWEEP_NOW_EPOCH (epoch seconds,
# distinct from the ISO DISPATCH_SWEEP_NOW used for log timestamps) and GRACE by
# DISPATCH_SWEEP_NOT_IN_SYNC_GRACE_S — never wall-clock. Marker stamp = NOW_EPOCH
# of the sweep that first records it; reap requires NOW_EPOCH - stamp >= grace.

# --- Test N1 (merged): TWO-SWEEP marker-then-reap ----------------------------
# THE load-bearing case (guards the inert-feature trap): sweep #1 only records the
# marker + SKIPs; a LATER sweep past grace REAPs. Two real sweep invocations share
# the same marker dir — a refresh-every-sweep bug would reset the clock and never
# reap. Marker stamp=1000, grace=100; an intermediate sweep at 1050 (age 50 < 100)
# must still SKIP and must NOT have refreshed the stamp; the final sweep at 1300
# (age 300 >= 100) REAPs.
echo "Test: N1 merged not-in-sync — sweep records marker, later sweep past grace reaps"
sweep_setup
export DISPATCH_SWEEP_NOT_IN_SYNC_GRACE_S=100
WT_PATH="$TMPDIR_TEST/project/worktrees/2100-merged-dirty"
WT_BASE="2100-merged-dirty"
sweep_register_wt "$WT_PATH" "$WT_BASE"
echo '[{"state":"closed","merged_at":"2024-01-01T00:00:00Z","number":2100,"created_at":"2024-01-01T00:00:00Z","title":"PR 2100"}]' > "$STUB_DIR/pr-state-${WT_BASE}.json"
key=$(sweep_path_key "$WT_PATH")
# Not-in-sync: dirty tree (drives worktree_merged_in_sync to non-zero).
echo " M residue.txt" > "$STUB_DIR/status${key}.txt"
MARKER="$TMPDIR_TEST/project/tmp/dispatch-not-in-sync/$WT_BASE"

# Sweep #1 at epoch 1000 — first observation: record marker + SKIP, no removal.
export DISPATCH_SWEEP_NOW_EPOCH=1000
out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "N1 sweep#1 exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ -f "$MARKER" ]] && [[ "$(cat "$MARKER")" == "1000" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: N1 sweep#1 wrote marker stamped 1000"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N1 sweep#1 wrote marker stamped 1000 (got: $(cat "$MARKER" 2>/dev/null))"
fi
calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if ! echo "$calls" | grep -q "worktree-remove"; then
  PASS=$((PASS + 1)); echo "  PASS: N1 sweep#1 no removal"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N1 sweep#1 no removal"; echo "    calls: $calls"
fi
TOTAL=$((TOTAL + 1))
if grep -q "SKIP_MERGED_NOT_IN_SYNC: '$WT_PATH' branch=$WT_BASE pr=#2100 (grace clock started)" \
   "$DISPATCH_SWEEP_LOG_FILE" && ! grep -q "REAP_MERGED_NOT_IN_SYNC" "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: N1 sweep#1 logged SKIP (grace clock started), no REAP"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N1 sweep#1 logged SKIP (grace clock started), no REAP"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi

# Intermediate sweep #1b at epoch 1050 — age 50 < 100: still SKIP, marker UNCHANGED
# (write-once: a refresh would reset the stamp to 1050 and the reap never fires).
export DISPATCH_SWEEP_NOW_EPOCH=1050
out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "N1 sweep#1b exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$(cat "$MARKER")" == "1000" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: N1 sweep#1b marker NOT refreshed (still 1000)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N1 sweep#1b marker NOT refreshed (got: $(cat "$MARKER" 2>/dev/null))"
fi
calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if ! echo "$calls" | grep -q "worktree-remove" && ! grep -q "REAP_MERGED_NOT_IN_SYNC" "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: N1 sweep#1b within-grace, no removal, no REAP"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N1 sweep#1b within-grace, no removal, no REAP"; echo "    calls: $calls"
fi

# Sweep #2 at epoch 1300 — age 300 >= 100: quarantine + force-reap.
export DISPATCH_SWEEP_NOW_EPOCH=1300
out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "N1 sweep#2 exits 0" "0" "$rc"
calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "worktree-remove-force:$WT_PATH"; then
  PASS=$((PASS + 1)); echo "  PASS: N1 sweep#2 force-removed the aged-out worktree"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N1 sweep#2 force-removed the aged-out worktree"; echo "    calls: $calls"
fi
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "branch-D:$WT_BASE"; then
  PASS=$((PASS + 1)); echo "  PASS: N1 sweep#2 deleted the branch"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N1 sweep#2 deleted the branch"; echo "    calls: $calls"
fi
TOTAL=$((TOTAL + 1))
if grep -q "REAP_MERGED_NOT_IN_SYNC: '$WT_PATH' branch=$WT_BASE pr=#2100 age_seconds=300 grace_seconds=100 quarantine=" \
   "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: N1 sweep#2 logged REAP_MERGED_NOT_IN_SYNC with age/grace/quarantine"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N1 sweep#2 logged REAP_MERGED_NOT_IN_SYNC with age/grace/quarantine"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
# Marker cleared after a successful reap.
TOTAL=$((TOTAL + 1))
if [[ ! -e "$MARKER" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: N1 sweep#2 cleared the marker after reap"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N1 sweep#2 cleared the marker after reap"
fi
sweep_teardown

# --- Test N1c (closed): TWO-SWEEP marker-then-reap ---------------------------
echo "Test: N1c closed not-in-sync — sweep records marker, later sweep past grace reaps"
sweep_setup
export DISPATCH_SWEEP_NOT_IN_SYNC_GRACE_S=100
WT_PATH="$TMPDIR_TEST/project/worktrees/2101-closed-dirty"
WT_BASE="2101-closed-dirty"
sweep_register_wt "$WT_PATH" "$WT_BASE"
# No pr-state fixture → issue path; issue CLOSED.
echo "CLOSED" > "$STUB_DIR/issue-state-2101.txt"
key=$(sweep_path_key "$WT_PATH")
echo " M residue.txt" > "$STUB_DIR/status${key}.txt"
MARKER="$TMPDIR_TEST/project/tmp/dispatch-not-in-sync/$WT_BASE"

# Sweep #1 at epoch 1000.
export DISPATCH_SWEEP_NOW_EPOCH=1000
out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "N1c sweep#1 exits 0" "0" "$rc"
calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$(cat "$MARKER" 2>/dev/null)" == "1000" ]] && ! echo "$calls" | grep -q "worktree-remove" \
   && grep -q "SKIP_CLOSED_NOT_IN_SYNC: '$WT_PATH' branch=$WT_BASE issue=#2101 (grace clock started)" \
   "$DISPATCH_SWEEP_LOG_FILE" && ! grep -q "REAP_CLOSED_NOT_IN_SYNC" "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: N1c sweep#1 recorded marker + SKIP (grace clock started), no reap"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N1c sweep#1 recorded marker + SKIP (grace clock started), no reap"
  echo "    marker: $(cat "$MARKER" 2>/dev/null)  calls: $calls"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi

# Sweep #2 at epoch 1300 — reap.
export DISPATCH_SWEEP_NOW_EPOCH=1300
out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "N1c sweep#2 exits 0" "0" "$rc"
calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "worktree-remove-force:$WT_PATH" \
   && grep -q "REAP_CLOSED_NOT_IN_SYNC: '$WT_PATH' branch=$WT_BASE issue=#2101 age_seconds=300 grace_seconds=100 quarantine=" \
   "$DISPATCH_SWEEP_LOG_FILE" && [[ ! -e "$MARKER" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: N1c sweep#2 force-reaped, logged REAP_CLOSED_NOT_IN_SYNC, marker cleared"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N1c sweep#2 force-reaped, logged REAP_CLOSED_NOT_IN_SYNC, marker cleared"
  echo "    calls: $calls"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test N2 (merged): WITHIN GRACE with marker already present → kept --------
# Marker pre-exists (stamp 1000); sweep at 1050 → age 50 < grace 100 → SKIP with
# age_seconds/grace_seconds fields, no removal, no REAP.
echo "Test: N2 merged not-in-sync within grace (marker present) → kept"
sweep_setup
export DISPATCH_SWEEP_NOT_IN_SYNC_GRACE_S=100
WT_PATH="$TMPDIR_TEST/project/worktrees/2200-merged-young"
WT_BASE="2200-merged-young"
sweep_register_wt "$WT_PATH" "$WT_BASE"
echo '[{"state":"closed","merged_at":"2024-01-01T00:00:00Z","number":2200,"created_at":"2024-01-01T00:00:00Z","title":"PR 2200"}]' > "$STUB_DIR/pr-state-${WT_BASE}.json"
key=$(sweep_path_key "$WT_PATH")
echo " M residue.txt" > "$STUB_DIR/status${key}.txt"
# Pre-seed the marker (write-once already happened on a prior sweep).
mkdir -p "$TMPDIR_TEST/project/tmp/dispatch-not-in-sync"
echo "1000" > "$TMPDIR_TEST/project/tmp/dispatch-not-in-sync/$WT_BASE"
export DISPATCH_SWEEP_NOW_EPOCH=1050

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "N2 sweep exits 0" "0" "$rc"
calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if ! echo "$calls" | grep -q "worktree-remove" && ! grep -q "REAP_MERGED_NOT_IN_SYNC" "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: N2 within grace — no removal, no REAP"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N2 within grace — no removal, no REAP"; echo "    calls: $calls"
fi
TOTAL=$((TOTAL + 1))
if grep -q "SKIP_MERGED_NOT_IN_SYNC: '$WT_PATH' branch=$WT_BASE pr=#2200 age_seconds=50 grace_seconds=100" \
   "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: N2 logged SKIP with age_seconds=50 grace_seconds=100"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N2 logged SKIP with age_seconds=50 grace_seconds=100"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test N2c (closed): WITHIN GRACE with marker present → kept --------------
echo "Test: N2c closed not-in-sync within grace (marker present) → kept"
sweep_setup
export DISPATCH_SWEEP_NOT_IN_SYNC_GRACE_S=100
WT_PATH="$TMPDIR_TEST/project/worktrees/2201-closed-young"
WT_BASE="2201-closed-young"
sweep_register_wt "$WT_PATH" "$WT_BASE"
echo "CLOSED" > "$STUB_DIR/issue-state-2201.txt"
key=$(sweep_path_key "$WT_PATH")
echo " M residue.txt" > "$STUB_DIR/status${key}.txt"
mkdir -p "$TMPDIR_TEST/project/tmp/dispatch-not-in-sync"
echo "1000" > "$TMPDIR_TEST/project/tmp/dispatch-not-in-sync/$WT_BASE"
export DISPATCH_SWEEP_NOW_EPOCH=1050

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "N2c sweep exits 0" "0" "$rc"
calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if ! echo "$calls" | grep -q "worktree-remove" \
   && grep -q "SKIP_CLOSED_NOT_IN_SYNC: '$WT_PATH' branch=$WT_BASE issue=#2201 age_seconds=50 grace_seconds=100" \
   "$DISPATCH_SWEEP_LOG_FILE" && ! grep -q "REAP_CLOSED_NOT_IN_SYNC" "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: N2c within grace — SKIP with age/grace fields, no reap"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N2c within grace — SKIP with age/grace fields, no reap"; echo "    calls: $calls"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test N3a (merged): past grace + LIVE SESSION → reap never reached --------
# AC3 by construction: the live-session guard precedes the not-in-sync decision,
# so a past-grace worktree with a live session logs the live-session skip and
# NEVER reaches reap_or_skip_not_in_sync (no marker recorded, no REAP).
echo "Test: N3a merged past-grace with a live session → live-session skip, no reap"
sweep_setup
export DISPATCH_SWEEP_NOT_IN_SYNC_GRACE_S=100
export DISPATCH_SWEEP_NOW_EPOCH=99999
WT_PATH="$TMPDIR_TEST/project/worktrees/2300-merged-live"
WT_BASE="2300-merged-live"
sweep_register_wt "$WT_PATH" "$WT_BASE"
echo '[{"state":"closed","merged_at":"2024-01-01T00:00:00Z","number":2300,"created_at":"2024-01-01T00:00:00Z","title":"PR 2300"}]' > "$STUB_DIR/pr-state-${WT_BASE}.json"
key=$(sweep_path_key "$WT_PATH")
echo " M residue.txt" > "$STUB_DIR/status${key}.txt"
# Pre-seed an aged-out marker so ONLY the live-session guard prevents the reap.
mkdir -p "$TMPDIR_TEST/project/tmp/dispatch-not-in-sync"
echo "1000" > "$TMPDIR_TEST/project/tmp/dispatch-not-in-sync/$WT_BASE"
sweep_fake_claude_sessions_by_name "$WT_BASE=sess-live-2300"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "N3a sweep exits 0" "0" "$rc"
calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if ! echo "$calls" | grep -q "worktree-remove" \
   && grep -q "SKIP_MERGED_LIVE_SESSION: '$WT_PATH' branch=$WT_BASE pr=#2300" "$DISPATCH_SWEEP_LOG_FILE" \
   && ! grep -q "REAP_MERGED_NOT_IN_SYNC" "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: N3a live-session skip logged, no removal, no REAP"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N3a live-session skip logged, no removal, no REAP"; echo "    calls: $calls"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test N3b (closed): past grace + RESERVATION → reap never reached ---------
# The loop-top reservation guard precedes everything, so a reserved past-grace
# worktree logs SKIP_RESERVED and never reaches the not-in-sync decision.
echo "Test: N3b closed past-grace with a reservation → SKIP_RESERVED, no reap"
sweep_setup
export DISPATCH_SWEEP_NOT_IN_SYNC_GRACE_S=100
export DISPATCH_SWEEP_NOW_EPOCH=99999
WT_PATH="$TMPDIR_TEST/project/worktrees/2301-closed-reserved"
WT_BASE="2301-closed-reserved"
sweep_register_wt "$WT_PATH" "$WT_BASE"
echo "CLOSED" > "$STUB_DIR/issue-state-2301.txt"
key=$(sweep_path_key "$WT_PATH")
echo " M residue.txt" > "$STUB_DIR/status${key}.txt"
mkdir -p "$TMPDIR_TEST/project/tmp/dispatch-not-in-sync"
echo "1000" > "$TMPDIR_TEST/project/tmp/dispatch-not-in-sync/$WT_BASE"
mkdir -p "$DISPATCH_RESERVATION_DIR"
printf 'session=resv\nissue=2301\ntimestamp=2026-01-01T00:00:00Z\n' \
  > "$DISPATCH_RESERVATION_DIR/$WT_BASE"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "N3b sweep exits 0" "0" "$rc"
calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if ! echo "$calls" | grep -q "worktree-remove" \
   && grep -q "SKIP_RESERVED: '$WT_PATH' branch=$WT_BASE" "$DISPATCH_SWEEP_LOG_FILE" \
   && ! grep -q "REAP_CLOSED_NOT_IN_SYNC" "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: N3b SKIP_RESERVED logged, no removal, no REAP"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N3b SKIP_RESERVED logged, no removal, no REAP"; echo "    calls: $calls"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test N4a (merged): quarantine captures the real divergence + survives removal
# AC2: on a successful reap the quarantine holds the REAL divergence (untracked
# file body + non-empty working-tree.patch), under the RUNNER root, and SURVIVES
# the worktree removal. The dest path is deterministic (suffixed with NOW_EPOCH),
# so derive it directly. The git stub's worktree-remove is a no-op, so simulate
# the real force-remove with rm -rf BEFORE the survives-removal assertion: if the
# quarantine had been co-located inside the worktree, that rm would take it too.
echo "Test: N4a merged reap quarantine captures real divergence + survives worktree removal"
sweep_setup
export DISPATCH_SWEEP_NOT_IN_SYNC_GRACE_S=100
export DISPATCH_SWEEP_NOW_EPOCH=5000
WT_PATH="$TMPDIR_TEST/project/worktrees/2400-merged-quarantine"
WT_BASE="2400-merged-quarantine"
sweep_register_wt "$WT_PATH" "$WT_BASE"
echo '[{"state":"closed","merged_at":"2024-01-01T00:00:00Z","number":2400,"created_at":"2024-01-01T00:00:00Z","title":"PR 2400"}]' > "$STUB_DIR/pr-state-${WT_BASE}.json"
key=$(sweep_path_key "$WT_PATH")
echo " M residue.txt" > "$STUB_DIR/status${key}.txt"
# Aged-out marker (age 5000-1000=4000 >= 100).
mkdir -p "$TMPDIR_TEST/project/tmp/dispatch-not-in-sync"
echo "1000" > "$TMPDIR_TEST/project/tmp/dispatch-not-in-sync/$WT_BASE"
# Real untracked file in the worktree + a fixture listing it (lib cp -p's it).
echo "UNTRACKED-BODY-2400" > "$WT_PATH/residue.txt"
echo "residue.txt" > "$STUB_DIR/untracked${key}.txt"
# Non-empty working-tree diff fixture.
printf 'diff --git a/tracked.txt b/tracked.txt\n+dirty-edit-2400\n' > "$STUB_DIR/wtdiff${key}.txt"
# Deterministic dest: <root>/tmp/dispatch-sweep-quarantine/<base>-<NOW_EPOCH>.
DEST="$TMPDIR_TEST/project/tmp/dispatch-sweep-quarantine/$WT_BASE-5000"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "N4a sweep exits 0" "0" "$rc"
calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "worktree-remove-force:$WT_PATH" \
   && grep -q "REAP_MERGED_NOT_IN_SYNC: '$WT_PATH' branch=$WT_BASE pr=#2400 .*quarantine='$DEST'" \
   "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: N4a reaped + logged quarantine='$DEST'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N4a reaped + logged quarantine='$DEST'"; echo "    calls: $calls"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
# Simulate the real force-remove the stub elided.
rm -rf "$WT_PATH"
# Survives-removal + real content: untracked body captured, working-tree.patch non-empty.
TOTAL=$((TOTAL + 1))
if [[ -f "$DEST/untracked/residue.txt" ]] && grep -q "UNTRACKED-BODY-2400" "$DEST/untracked/residue.txt"; then
  PASS=$((PASS + 1)); echo "  PASS: N4a untracked file body survives in quarantine after removal"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N4a untracked file body survives in quarantine after removal"
  echo "    dest contents:"; ls -R "$DEST" 2>/dev/null | sed 's/^/      /'
fi
TOTAL=$((TOTAL + 1))
if [[ -s "$DEST/working-tree.patch" ]] && grep -q "dirty-edit-2400" "$DEST/working-tree.patch"; then
  PASS=$((PASS + 1)); echo "  PASS: N4a working-tree.patch is non-empty with the dirty edit"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N4a working-tree.patch is non-empty with the dirty edit"
fi
sweep_teardown

# --- Test N4a-fail (merged): quarantine failure ABORTS the reap --------------
# Pre-create the quarantine root as a regular FILE so the lib's `mkdir -p "$dest"`
# fails with ENOTDIR → quarantine error → reap aborts: worktree LEFT INTACT,
# SKIP_*_QUARANTINE_FAILED logged, NO REAP, marker still present.
echo "Test: N4a-fail merged quarantine failure aborts reap (worktree left intact)"
sweep_setup
export DISPATCH_SWEEP_NOT_IN_SYNC_GRACE_S=100
export DISPATCH_SWEEP_NOW_EPOCH=5000
WT_PATH="$TMPDIR_TEST/project/worktrees/2401-merged-qfail"
WT_BASE="2401-merged-qfail"
sweep_register_wt "$WT_PATH" "$WT_BASE"
echo '[{"state":"closed","merged_at":"2024-01-01T00:00:00Z","number":2401,"created_at":"2024-01-01T00:00:00Z","title":"PR 2401"}]' > "$STUB_DIR/pr-state-${WT_BASE}.json"
key=$(sweep_path_key "$WT_PATH")
echo " M residue.txt" > "$STUB_DIR/status${key}.txt"
mkdir -p "$TMPDIR_TEST/project/tmp/dispatch-not-in-sync"
echo "1000" > "$TMPDIR_TEST/project/tmp/dispatch-not-in-sync/$WT_BASE"
MARKER="$TMPDIR_TEST/project/tmp/dispatch-not-in-sync/$WT_BASE"
# Quarantine root is a regular file → mkdir -p of the dest under it fails (ENOTDIR).
: > "$TMPDIR_TEST/project/tmp/dispatch-sweep-quarantine"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "N4a-fail sweep exits 0" "0" "$rc"
calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if ! echo "$calls" | grep -q "worktree-remove" \
   && grep -q "SKIP_MERGED_NOT_IN_SYNC_QUARANTINE_FAILED: '$WT_PATH' branch=$WT_BASE pr=#2401" \
   "$DISPATCH_SWEEP_LOG_FILE" && ! grep -q "REAP_MERGED_NOT_IN_SYNC" "$DISPATCH_SWEEP_LOG_FILE" \
   && [[ -e "$MARKER" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: N4a-fail aborted — no removal, QUARANTINE_FAILED logged, marker intact"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N4a-fail aborted — no removal, QUARANTINE_FAILED logged, marker intact"
  echo "    calls: $calls  marker-exists: $([[ -e "$MARKER" ]] && echo yes || echo no)"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test N4c (closed): quarantine captures real divergence + survives removal -
echo "Test: N4c closed reap quarantine captures real divergence + survives worktree removal"
sweep_setup
export DISPATCH_SWEEP_NOT_IN_SYNC_GRACE_S=100
export DISPATCH_SWEEP_NOW_EPOCH=5000
WT_PATH="$TMPDIR_TEST/project/worktrees/2402-closed-quarantine"
WT_BASE="2402-closed-quarantine"
sweep_register_wt "$WT_PATH" "$WT_BASE"
echo "CLOSED" > "$STUB_DIR/issue-state-2402.txt"
key=$(sweep_path_key "$WT_PATH")
echo " M residue.txt" > "$STUB_DIR/status${key}.txt"
mkdir -p "$TMPDIR_TEST/project/tmp/dispatch-not-in-sync"
echo "1000" > "$TMPDIR_TEST/project/tmp/dispatch-not-in-sync/$WT_BASE"
echo "UNTRACKED-BODY-2402" > "$WT_PATH/residue.txt"
echo "residue.txt" > "$STUB_DIR/untracked${key}.txt"
printf 'diff --git a/tracked.txt b/tracked.txt\n+dirty-edit-2402\n' > "$STUB_DIR/wtdiff${key}.txt"
DEST="$TMPDIR_TEST/project/tmp/dispatch-sweep-quarantine/$WT_BASE-5000"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "N4c sweep exits 0" "0" "$rc"
calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "worktree-remove-force:$WT_PATH" \
   && grep -q "REAP_CLOSED_NOT_IN_SYNC: '$WT_PATH' branch=$WT_BASE issue=#2402 .*quarantine='$DEST'" \
   "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: N4c reaped + logged quarantine='$DEST'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N4c reaped + logged quarantine='$DEST'"; echo "    calls: $calls"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
rm -rf "$WT_PATH"
TOTAL=$((TOTAL + 1))
if [[ -f "$DEST/untracked/residue.txt" ]] && grep -q "UNTRACKED-BODY-2402" "$DEST/untracked/residue.txt" \
   && [[ -s "$DEST/working-tree.patch" ]] && grep -q "dirty-edit-2402" "$DEST/working-tree.patch"; then
  PASS=$((PASS + 1)); echo "  PASS: N4c quarantine holds real divergence and survives removal"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N4c quarantine holds real divergence and survives removal"
  echo "    dest contents:"; ls -R "$DEST" 2>/dev/null | sed 's/^/      /'
fi
sweep_teardown

# --- Test N5a: marker cleared on a normal in-sync removal ---------------------
# After REMOVE_MERGED / REMOVE_CLOSED_ISSUE (in-sync removal), any stale marker for
# that basename is cleared so a future same-named worktree never inherits the
# grace timestamp.
echo "Test: N5a in-sync REMOVE_MERGED clears any stale not-in-sync marker"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/2500-merged-clean"
WT_BASE="2500-merged-clean"
sweep_register_wt "$WT_PATH" "$WT_BASE"
echo '[{"state":"closed","merged_at":"2024-01-01T00:00:00Z","number":2500,"created_at":"2024-01-01T00:00:00Z","title":"PR 2500"}]' > "$STUB_DIR/pr-state-${WT_BASE}.json"
key=$(sweep_path_key "$WT_PATH")
: > "$STUB_DIR/status${key}.txt"          # clean
echo "0" > "$STUB_DIR/revlist${key}.txt"
echo "0" > "$STUB_DIR/diffrc${key}.txt"   # tree identical → in-sync
# A stale marker (e.g. from an earlier dirty observation before the tree was synced).
mkdir -p "$TMPDIR_TEST/project/tmp/dispatch-not-in-sync"
echo "1000" > "$TMPDIR_TEST/project/tmp/dispatch-not-in-sync/$WT_BASE"
MARKER="$TMPDIR_TEST/project/tmp/dispatch-not-in-sync/$WT_BASE"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "N5a sweep exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if grep -q "REMOVE_MERGED: '$WT_PATH' branch=$WT_BASE pr=#2500" "$DISPATCH_SWEEP_LOG_FILE" \
   && [[ ! -e "$MARKER" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: N5a in-sync removal cleared the stale marker"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N5a in-sync removal cleared the stale marker"
  echo "    marker-exists: $([[ -e "$MARKER" ]] && echo yes || echo no)"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test N5a-closed: marker cleared on a normal in-sync REMOVE_CLOSED_ISSUE ---
echo "Test: N5a-closed in-sync REMOVE_CLOSED_ISSUE clears any stale not-in-sync marker"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/2501-closed-clean"
WT_BASE="2501-closed-clean"
sweep_register_wt "$WT_PATH" "$WT_BASE"
echo "CLOSED" > "$STUB_DIR/issue-state-2501.txt"
key=$(sweep_path_key "$WT_PATH")
: > "$STUB_DIR/status${key}.txt"
echo "0" > "$STUB_DIR/revlist${key}.txt"
mkdir -p "$TMPDIR_TEST/project/tmp/dispatch-not-in-sync"
echo "1000" > "$TMPDIR_TEST/project/tmp/dispatch-not-in-sync/$WT_BASE"
MARKER="$TMPDIR_TEST/project/tmp/dispatch-not-in-sync/$WT_BASE"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "N5a-closed sweep exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if grep -q "REMOVE_CLOSED_ISSUE: '$WT_PATH' branch=$WT_BASE issue=#2501" "$DISPATCH_SWEEP_LOG_FILE" \
   && [[ ! -e "$MARKER" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: N5a-closed in-sync removal cleared the stale marker"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N5a-closed in-sync removal cleared the stale marker"
  echo "    marker-exists: $([[ -e "$MARKER" ]] && echo yes || echo no)"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test N5b: vanished-worktree marker is GC'd ------------------------------
# A marker whose basename is NOT in the registered WT_PATHS set is deleted by the
# post-loop GC, with GC_NOT_IN_SYNC_MARKER logged — so a future same-named
# worktree never inherits a stale grace timestamp. A registered worktree's own
# marker (within grace) must be left untouched to prove GC targets only vanished ones.
echo "Test: N5b vanished-worktree marker is GC'd (registered marker untouched)"
sweep_setup
export DISPATCH_SWEEP_NOT_IN_SYNC_GRACE_S=100
export DISPATCH_SWEEP_NOW_EPOCH=1050
# A registered, within-grace not-in-sync worktree keeps its marker.
WT_PATH="$TMPDIR_TEST/project/worktrees/2600-live-marked"
WT_BASE="2600-live-marked"
sweep_register_wt "$WT_PATH" "$WT_BASE"
echo '[{"state":"closed","merged_at":"2024-01-01T00:00:00Z","number":2600,"created_at":"2024-01-01T00:00:00Z","title":"PR 2600"}]' > "$STUB_DIR/pr-state-${WT_BASE}.json"
key=$(sweep_path_key "$WT_PATH")
echo " M residue.txt" > "$STUB_DIR/status${key}.txt"
mkdir -p "$TMPDIR_TEST/project/tmp/dispatch-not-in-sync"
echo "1000" > "$TMPDIR_TEST/project/tmp/dispatch-not-in-sync/$WT_BASE"
KEPT_MARKER="$TMPDIR_TEST/project/tmp/dispatch-not-in-sync/$WT_BASE"
# A marker for a basename that is NOT registered → must be GC'd.
VANISHED="2699-vanished"
echo "1000" > "$TMPDIR_TEST/project/tmp/dispatch-not-in-sync/$VANISHED"
VANISHED_MARKER="$TMPDIR_TEST/project/tmp/dispatch-not-in-sync/$VANISHED"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "N5b sweep exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$VANISHED_MARKER" ]] \
   && grep -q "GC_NOT_IN_SYNC_MARKER: vanished worktree basename=$VANISHED" "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: N5b vanished marker deleted + GC_NOT_IN_SYNC_MARKER logged"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N5b vanished marker deleted + GC_NOT_IN_SYNC_MARKER logged"
  echo "    vanished-exists: $([[ -e "$VANISHED_MARKER" ]] && echo yes || echo no)"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
TOTAL=$((TOTAL + 1))
if [[ -e "$KEPT_MARKER" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: N5b registered worktree's marker left intact"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N5b registered worktree's marker left intact"
fi
sweep_teardown

# --- Config-precedence path (Finding 1): sweep.json grace flows through -------
# The grace window resolves with precedence: sweep config notInSyncGraceSeconds →
# env override → baked default. The sweep harness now copies dispatch-config-load
# and points DISPATCH_CONFIG_DIR at an empty dir, so these tests exercise the
# config-file branch end-to-end (it was previously masked: with the loader binary
# absent the call failed and the env-override path silently handled everything).

# --- Test N6a: sweep.json notInSyncGraceSeconds drives the reap decision ------
# Config grace=100; marker stamped 1000; a sweep at 1300 (age 300 >= config 100)
# REAPs. The baked default is 86400 and no env override is set — so a reap here
# proves the CONFIG value (not the default) governed the decision, and the logged
# grace_seconds=100 must echo the config value.
echo "Test: N6a sweep.json notInSyncGraceSeconds governs the reap (config precedence)"
sweep_setup
printf '{"notInSyncGraceSeconds":100}\n' > "$DISPATCH_CONFIG_DIR/sweep.json"
WT_PATH="$TMPDIR_TEST/project/worktrees/2700-config-grace"
WT_BASE="2700-config-grace"
sweep_register_wt "$WT_PATH" "$WT_BASE"
echo '[{"state":"closed","merged_at":"2024-01-01T00:00:00Z","number":2700,"created_at":"2024-01-01T00:00:00Z","title":"PR 2700"}]' > "$STUB_DIR/pr-state-${WT_BASE}.json"
key=$(sweep_path_key "$WT_PATH")
echo " M residue.txt" > "$STUB_DIR/status${key}.txt"
MARKER="$TMPDIR_TEST/project/tmp/dispatch-not-in-sync/$WT_BASE"
# Sweep #1 at 1000 records the marker (below config grace).
export DISPATCH_SWEEP_NOW_EPOCH=1000
out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "N6a sweep#1 exits 0" "0" "$rc"
calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$(cat "$MARKER" 2>/dev/null)" == "1000" ]] && ! echo "$calls" | grep -q "worktree-remove"; then
  PASS=$((PASS + 1)); echo "  PASS: N6a sweep#1 recorded marker, no removal"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N6a sweep#1 recorded marker, no removal"; echo "    calls: $calls"
fi
# Sweep #2 at 1300 — age 300 >= config grace 100 → REAP. With the baked default
# (86400) the worktree would still be kept; a reap proves config grace governed.
export DISPATCH_SWEEP_NOW_EPOCH=1300
out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "N6a sweep#2 exits 0" "0" "$rc"
calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "worktree-remove-force:$WT_PATH" \
   && grep -q "REAP_MERGED_NOT_IN_SYNC: '$WT_PATH' branch=$WT_BASE pr=#2700 age_seconds=300 grace_seconds=100 quarantine=" \
      "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: N6a config grace=100 reaped at age 300 (grace_seconds=100 logged)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N6a config grace=100 reaped at age 300 (grace_seconds=100 logged)"
  echo "    calls: $calls"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test N6b: sweep.json present but field absent → env override wins --------
# (Finding 1 regression.) A sweep.json that omits notInSyncGraceSeconds must NOT
# pin the grace to the baked default — the lowest-precedence env override must
# still fire. Config present-but-empty + env grace=100 + age 300 → REAP, logged
# grace_seconds=100. PRE-FIX dispatch-sweep took the "!= no-config" branch,
# found the field empty, and skipped the elif env branch entirely (grace stayed
# 86400) → no reap → this test FAILS, proving it reproduces Finding 1.
echo "Test: N6b sweep.json without the field falls through to the env override (Finding 1)"
sweep_setup
printf '{}\n' > "$DISPATCH_CONFIG_DIR/sweep.json"
export DISPATCH_SWEEP_NOT_IN_SYNC_GRACE_S=100
WT_PATH="$TMPDIR_TEST/project/worktrees/2710-empty-config"
WT_BASE="2710-empty-config"
sweep_register_wt "$WT_PATH" "$WT_BASE"
echo '[{"state":"closed","merged_at":"2024-01-01T00:00:00Z","number":2710,"created_at":"2024-01-01T00:00:00Z","title":"PR 2710"}]' > "$STUB_DIR/pr-state-${WT_BASE}.json"
key=$(sweep_path_key "$WT_PATH")
echo " M residue.txt" > "$STUB_DIR/status${key}.txt"
MARKER="$TMPDIR_TEST/project/tmp/dispatch-not-in-sync/$WT_BASE"
export DISPATCH_SWEEP_NOW_EPOCH=1000
out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "N6b sweep#1 exits 0" "0" "$rc"
export DISPATCH_SWEEP_NOW_EPOCH=1300
out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "N6b sweep#2 exits 0" "0" "$rc"
calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "worktree-remove-force:$WT_PATH" \
   && grep -q "REAP_MERGED_NOT_IN_SYNC: '$WT_PATH' branch=$WT_BASE pr=#2710 age_seconds=300 grace_seconds=100 quarantine=" \
      "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: N6b empty config + env grace=100 reaped at age 300 (env override fired)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N6b empty config + env grace=100 reaped at age 300 (env override fired)"
  echo "    calls: $calls"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test N6c: sweep.json fractional grace is rejected, fallback used ---------
# (Finding 2 regression, end-to-end through dispatch-sweep.) A fractional
# notInSyncGraceSeconds (0.5) must NOT reach the bash `[[ "$age" -lt "$grace" ]]`
# integer comparison (which would error and reap every not-in-sync worktree).
# dispatch-config-load rejects the fractional value and exits non-zero; dispatch-sweep
# folds the stderr, logs SWEEP_CONFIG_ERROR, and falls back to the env override
# (grace=100 here) — so the worktree at age 300 still reaps via the env value, and
# the run never crashes. PRE-FIX the loader accepted 0.5 (1.5|type=="number", >0),
# dispatch-sweep set grace=0.5, and the integer compare errored → this test FAILS,
# proving it reproduces Finding 2.
echo "Test: N6c sweep.json fractional grace rejected by loader, env fallback governs (Finding 2)"
sweep_setup
printf '{"notInSyncGraceSeconds":0.5}\n' > "$DISPATCH_CONFIG_DIR/sweep.json"
export DISPATCH_SWEEP_NOT_IN_SYNC_GRACE_S=100
WT_PATH="$TMPDIR_TEST/project/worktrees/2720-frac-config"
WT_BASE="2720-frac-config"
sweep_register_wt "$WT_PATH" "$WT_BASE"
echo '[{"state":"closed","merged_at":"2024-01-01T00:00:00Z","number":2720,"created_at":"2024-01-01T00:00:00Z","title":"PR 2720"}]' > "$STUB_DIR/pr-state-${WT_BASE}.json"
key=$(sweep_path_key "$WT_PATH")
echo " M residue.txt" > "$STUB_DIR/status${key}.txt"
MARKER="$TMPDIR_TEST/project/tmp/dispatch-not-in-sync/$WT_BASE"
export DISPATCH_SWEEP_NOW_EPOCH=1000
out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "N6c sweep#1 exits 0 (no arithmetic crash on fractional config)" "0" "$rc"
export DISPATCH_SWEEP_NOW_EPOCH=1300
out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "N6c sweep#2 exits 0 (no arithmetic crash on fractional config)" "0" "$rc"
calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "worktree-remove-force:$WT_PATH" \
   && grep -q "REAP_MERGED_NOT_IN_SYNC: '$WT_PATH' branch=$WT_BASE pr=#2720 age_seconds=300 grace_seconds=100 quarantine=" \
      "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: N6c fractional config rejected, env grace=100 governed the reap"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N6c fractional config rejected, env grace=100 governed the reap"
  echo "    calls: $calls"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
# The loader's diagnostic must be surfaced, not swallowed.
TOTAL=$((TOTAL + 1))
if grep -q "SWEEP_CONFIG_ERROR" "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: N6c SWEEP_CONFIG_ERROR logged for the rejected fractional config"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: N6c SWEEP_CONFIG_ERROR logged for the rejected fractional config"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# <<< END MOVED <<<

report_results
