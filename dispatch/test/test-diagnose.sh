#!/usr/bin/env bash
# Unit tests for diagnose_state and reconcile_phase_signal in dispatch.
#
# These tests use PATH-injected stubs for `gh` and per-test temp git repos
# (with a bare clone serving as `origin`) so they never touch the real
# `gh`, real Firestore, or real `origin/main`. Stub `issue-state-read` /
# `issue-state-write` scripts are placed under
# `<temp-repo>/.claude/skills/ref-pr-workflow/scripts/` because
# `reconcile_phase_signal` resolves them by absolute path via
# `git rev-parse --show-toplevel` rather than via PATH lookup.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DISPATCH="$SCRIPT_DIR/../bin/dispatch"

# shellcheck disable=SC1090
source "$DISPATCH"

PASS=0
FAIL=0
TOTAL=0

assert_eq() {
  local label="$1" expected="$2" actual="$3"
  TOTAL=$((TOTAL + 1))
  if [[ "$expected" == "$actual" ]]; then
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label"
    echo "    expected: '$expected'"
    echo "    actual:   '$actual'"
  fi
}

# --- helpers ---------------------------------------------------------------

# Create a stub directory with a `gh` script driven by STUB_GH_OUTCOME.
# Echoes the stub directory path to stdout.
make_gh_stub_dir() {
  local stub_dir
  stub_dir=$(mktemp -d)
  cat >"$stub_dir/gh" <<'GHSTUB'
#!/usr/bin/env bash
# Test stub for `gh`. Driven by STUB_GH_OUTCOME env var.
# Recognized invocations: `gh pr view <branch> --json number,state`.
case "${STUB_GH_OUTCOME:-}" in
  no-pr)
    # Mimic real gh's stderr message for missing PR.
    echo 'no pull requests found for branch "stub-branch"' >&2
    exit 1
    ;;
  open-pr)
    printf '{"number":42,"state":"OPEN"}\n'
    exit 0
    ;;
  merged-pr)
    printf '{"number":99,"state":"MERGED"}\n'
    exit 0
    ;;
  closed-pr)
    printf '{"number":7,"state":"CLOSED"}\n'
    exit 0
    ;;
  auth-error)
    echo "authentication required" >&2
    exit 1
    ;;
  *)
    echo "stub gh: unknown STUB_GH_OUTCOME='${STUB_GH_OUTCOME:-}'" >&2
    exit 2
    ;;
esac
GHSTUB
  chmod +x "$stub_dir/gh"
  printf '%s\n' "$stub_dir"
}

# Initialize a fresh git repo in $1 with one commit on `main`. Sets up a
# bare clone at $1.git as `origin`, so `git fetch origin main` works.
# Args:
#   $1 (repo): repo path
#   $2 (extra): N additional commits beyond the initial one (default 0)
#   $3 (extra_branch): branch the extras live on (default "main"); when
#     non-main, the branch is created from main, the extras are added to
#     it, and the worktree is checked back out to main afterwards. This
#     simulates the production case where dispatch runs from the project
#     root with HEAD on main while the issue branch has unmerged commits.
init_test_repo() {
  local repo="$1"
  local extra="${2:-0}"
  local extra_branch="${3:-main}"

  mkdir -p "$repo"
  (
    cd "$repo"
    git init --quiet --initial-branch=main
    git config user.email "test@example.com"
    git config user.name "Test"
    git config commit.gpgsign false
    echo "initial" >file.txt
    git add file.txt
    git commit --quiet -m "initial"
  )

  # Create the bare clone serving as `origin`.
  git clone --quiet --bare "$repo" "$repo.git" >/dev/null
  (
    cd "$repo"
    git remote add origin "$repo.git"
    git fetch --quiet origin main
    git branch --quiet --set-upstream-to=origin/main main || true
  )

  if [[ "$extra" -gt 0 ]]; then
    (
      cd "$repo"
      if [[ "$extra_branch" != "main" ]]; then
        git checkout --quiet -b "$extra_branch"
      fi
      local i
      for ((i = 1; i <= extra; i++)); do
        echo "extra-$i" >>file.txt
        git add file.txt
        git commit --quiet -m "extra commit $i"
      done
      if [[ "$extra_branch" != "main" ]]; then
        git checkout --quiet main
      fi
    )
  fi
}

# Set up stub `issue-state-read`/`issue-state-write` scripts inside
# `<repo>/.claude/skills/ref-pr-workflow/scripts/`. They read/write a
# fixture JSON file at $STUB_FIRESTORE_FILE.
install_state_stubs() {
  local repo="$1"
  local scripts_dir="$repo/.claude/skills/ref-pr-workflow/scripts"
  mkdir -p "$scripts_dir"

  cat >"$scripts_dir/issue-state-read" <<'READSTUB'
#!/usr/bin/env bash
# Stub: print contents of $STUB_FIRESTORE_FILE, or fail if missing/unset.
set -euo pipefail
if [[ -z "${STUB_FIRESTORE_FILE:-}" || ! -f "$STUB_FIRESTORE_FILE" ]]; then
  echo "stub issue-state-read: STUB_FIRESTORE_FILE missing" >&2
  exit 1
fi
cat "$STUB_FIRESTORE_FILE"
READSTUB
  chmod +x "$scripts_dir/issue-state-read"

  cat >"$scripts_dir/issue-state-write" <<'WRITESTUB'
#!/usr/bin/env bash
# Stub: read JSON from stdin, write to $STUB_FIRESTORE_FILE. Also mirror
# the new state into $STUB_LOCAL_CACHE_FILE under a `.state` wrapper, to
# mimic the real script's behavior of keeping the local cache in sync.
set -euo pipefail
if [[ -z "${STUB_FIRESTORE_FILE:-}" ]]; then
  echo "stub issue-state-write: STUB_FIRESTORE_FILE unset" >&2
  exit 1
fi
input=$(cat)
printf '%s' "$input" >"$STUB_FIRESTORE_FILE"
if [[ -n "${STUB_LOCAL_CACHE_FILE:-}" ]]; then
  # Mirror the state into the local cache. If the cache exists, replace
  # only the `.state` field; else seed a minimal wrapper.
  if [[ -f "$STUB_LOCAL_CACHE_FILE" ]]; then
    tmp=$(mktemp)
    jq --argjson s "$input" '.state = $s' "$STUB_LOCAL_CACHE_FILE" >"$tmp"
    mv "$tmp" "$STUB_LOCAL_CACHE_FILE"
  else
    jq -n --argjson s "$input" '{state: $s}' >"$STUB_LOCAL_CACHE_FILE"
  fi
fi
WRITESTUB
  chmod +x "$scripts_dir/issue-state-write"
}

# Save and restore PATH around tests.
ORIGINAL_PATH="$PATH"

# --- case 1: fresh ---------------------------------------------------------
TEST_ROOT=$(mktemp -d)
REPO="$TEST_ROOT/repo"
init_test_repo "$REPO" 0
STUB_DIR=$(make_gh_stub_dir)
PATH="$STUB_DIR:$ORIGINAL_PATH"
export STUB_GH_OUTCOME=no-pr
pushd "$REPO" >/dev/null
STATE_FILE="$REPO/state.json"
ACTUAL=$(diagnose_state "stub-branch" "$STATE_FILE" "569" 2>/dev/null || true)
popd >/dev/null
assert_eq "fresh: 0 commits ahead, no PR -> 'fresh'" "fresh" "$ACTUAL"
unset STUB_GH_OUTCOME
PATH="$ORIGINAL_PATH"
rm -rf "$TEST_ROOT" "$STUB_DIR"

# --- case 2: audit-and-pr + reconcile both ---------------------------------
# HEAD is on `main` (in sync with origin/main); the issue branch has commits
# ahead. This mirrors production, where dispatch runs from the project root
# rather than inside the worktree. STUB_LOCAL_CACHE_FILE is set to a path
# distinct from STATE_FILE so the test exercises the dispatcher's direct
# clear of $state_file (issue-state-write's CWD-relative mirror would land
# on the wrong file in production).
TEST_ROOT=$(mktemp -d)
REPO="$TEST_ROOT/repo"
init_test_repo "$REPO" 1 "stub-branch"
install_state_stubs "$REPO"
STUB_DIR=$(make_gh_stub_dir)
PATH="$STUB_DIR:$ORIGINAL_PATH"
export STUB_GH_OUTCOME=no-pr
STATE_FILE="$REPO/state.json"
echo '{"state":{"phase_signal":"complete"}}' >"$STATE_FILE"
export STUB_FIRESTORE_FILE="$TEST_ROOT/firestore.json"
echo '{"phase_signal":"complete"}' >"$STUB_FIRESTORE_FILE"
# Distinct path: simulates issue-state-write resolving REPO_ROOT to a
# directory whose tmp/ does not contain the worktree's state file.
export STUB_LOCAL_CACHE_FILE="$TEST_ROOT/wrong-cache.json"

pushd "$REPO" >/dev/null
ACTUAL=$(diagnose_state "stub-branch" "$STATE_FILE" "569" 2>/dev/null || true)
assert_eq "audit-and-pr: HEAD on main, branch 1 commit ahead, no PR -> 'audit-and-pr'" "audit-and-pr" "$ACTUAL"

reconcile_phase_signal both "$STATE_FILE" "569"
popd >/dev/null

# Local cache: phase_signal removed; .state still present.
LOCAL_HAS_SIGNAL=$(jq 'has("state") and (.state | has("phase_signal"))' "$STATE_FILE")
assert_eq "audit-and-pr: worktree state_file phase_signal removed" "false" "$LOCAL_HAS_SIGNAL"
LOCAL_HAS_STATE=$(jq 'has("state")' "$STATE_FILE")
assert_eq "audit-and-pr: worktree state_file .state preserved" "true" "$LOCAL_HAS_STATE"

# Firestore fixture: phase_signal removed.
REMOTE_HAS_SIGNAL=$(jq 'has("phase_signal")' "$STUB_FIRESTORE_FILE")
assert_eq "audit-and-pr: firestore phase_signal removed" "false" "$REMOTE_HAS_SIGNAL"

unset STUB_GH_OUTCOME STUB_FIRESTORE_FILE STUB_LOCAL_CACHE_FILE
PATH="$ORIGINAL_PATH"
rm -rf "$TEST_ROOT" "$STUB_DIR"

# --- case 3: verify --------------------------------------------------------
TEST_ROOT=$(mktemp -d)
REPO="$TEST_ROOT/repo"
init_test_repo "$REPO" 1 "stub-branch"
STUB_DIR=$(make_gh_stub_dir)
PATH="$STUB_DIR:$ORIGINAL_PATH"
export STUB_GH_OUTCOME=open-pr
pushd "$REPO" >/dev/null
STATE_FILE="$REPO/state.json"
ACTUAL=$(diagnose_state "stub-branch" "$STATE_FILE" "569" 2>/dev/null || true)
popd >/dev/null
assert_eq "verify: open PR -> 'verify' (no second line)" "verify" "$ACTUAL"
unset STUB_GH_OUTCOME
PATH="$ORIGINAL_PATH"
rm -rf "$TEST_ROOT" "$STUB_DIR"

# --- case 4: done (merged PR) ----------------------------------------------
TEST_ROOT=$(mktemp -d)
REPO="$TEST_ROOT/repo"
init_test_repo "$REPO" 0
STUB_DIR=$(make_gh_stub_dir)
PATH="$STUB_DIR:$ORIGINAL_PATH"
export STUB_GH_OUTCOME=merged-pr
pushd "$REPO" >/dev/null
STATE_FILE="$REPO/state.json"
ACTUAL=$(diagnose_state "stub-branch" "$STATE_FILE" "569" 2>/dev/null || true)
popd >/dev/null
EXPECTED=$'done\n99'
assert_eq "done: merged PR -> 'done' + PR number on second line" "$EXPECTED" "$ACTUAL"
unset STUB_GH_OUTCOME
PATH="$ORIGINAL_PATH"
rm -rf "$TEST_ROOT" "$STUB_DIR"

# --- case 5: fetch failure non-fatal --------------------------------------
TEST_ROOT=$(mktemp -d)
REPO="$TEST_ROOT/repo"
init_test_repo "$REPO" 0
# Break the origin URL so `git fetch --quiet origin main` fails.
(
  cd "$REPO"
  git remote set-url origin "/nonexistent/path/to/repo.git"
)
STUB_DIR=$(make_gh_stub_dir)
PATH="$STUB_DIR:$ORIGINAL_PATH"
export STUB_GH_OUTCOME=no-pr
pushd "$REPO" >/dev/null
STATE_FILE="$REPO/state.json"
# Capture both stdout (mode) and ensure the function exits 0 despite fetch failure.
ACTUAL=$(diagnose_state "stub-branch" "$STATE_FILE" "569" 2>/dev/null || echo "FAILED")
popd >/dev/null
assert_eq "fetch failure non-fatal: still returns 'fresh'" "fresh" "$ACTUAL"
unset STUB_GH_OUTCOME
PATH="$ORIGINAL_PATH"
rm -rf "$TEST_ROOT" "$STUB_DIR"

# --- case 6a: closed PR + 0 commits ahead -> 'fresh' -----------------------
# `gh pr view` returns the most recent PR for a branch regardless of state.
# A CLOSED (non-merged) PR must NOT route to verify — that would let the
# skill mark the issue done off stale checks on an abandoned PR.
TEST_ROOT=$(mktemp -d)
REPO="$TEST_ROOT/repo"
init_test_repo "$REPO" 0
STUB_DIR=$(make_gh_stub_dir)
PATH="$STUB_DIR:$ORIGINAL_PATH"
export STUB_GH_OUTCOME=closed-pr
pushd "$REPO" >/dev/null
STATE_FILE="$REPO/state.json"
ACTUAL=$(diagnose_state "stub-branch" "$STATE_FILE" "569" 2>/dev/null || true)
popd >/dev/null
assert_eq "closed PR + 0 commits ahead -> 'fresh'" "fresh" "$ACTUAL"
unset STUB_GH_OUTCOME
PATH="$ORIGINAL_PATH"
rm -rf "$TEST_ROOT" "$STUB_DIR"

# --- case 6b: closed PR + commits ahead -> 'audit-and-pr' ------------------
TEST_ROOT=$(mktemp -d)
REPO="$TEST_ROOT/repo"
init_test_repo "$REPO" 1 "stub-branch"
STUB_DIR=$(make_gh_stub_dir)
PATH="$STUB_DIR:$ORIGINAL_PATH"
export STUB_GH_OUTCOME=closed-pr
pushd "$REPO" >/dev/null
STATE_FILE="$REPO/state.json"
ACTUAL=$(diagnose_state "stub-branch" "$STATE_FILE" "569" 2>/dev/null || true)
popd >/dev/null
assert_eq "closed PR + 1 commit ahead -> 'audit-and-pr'" "audit-and-pr" "$ACTUAL"
unset STUB_GH_OUTCOME
PATH="$ORIGINAL_PATH"
rm -rf "$TEST_ROOT" "$STUB_DIR"

# --- case 7: reconcile local-only is no-op when key absent ----------------
TEST_ROOT=$(mktemp -d)
STATE_FILE="$TEST_ROOT/state.json"
ORIGINAL_CONTENT='{"state":{"other":"value"}}'
echo "$ORIGINAL_CONTENT" >"$STATE_FILE"
EXPECTED_BYTES=$(wc -c <"$STATE_FILE")
EXPECTED_HASH=$(shasum "$STATE_FILE" | awk '{print $1}')

reconcile_phase_signal local-only "$STATE_FILE" "569"

ACTUAL_HASH=$(shasum "$STATE_FILE" | awk '{print $1}')
ACTUAL_BYTES=$(wc -c <"$STATE_FILE")
assert_eq "reconcile local-only no-op: file content unchanged (sha)" "$EXPECTED_HASH" "$ACTUAL_HASH"
assert_eq "reconcile local-only no-op: file content unchanged (bytes)" "$EXPECTED_BYTES" "$ACTUAL_BYTES"
rm -rf "$TEST_ROOT"

# --- report -----------------------------------------------------------------
echo ""
echo "================================"
echo "Results: $PASS/$TOTAL passed, $FAIL failed"
echo "================================"
[[ "$FAIL" -eq 0 ]]
