#!/usr/bin/env bash
# Test suite for check-graph-fast-path.sh
# Usage: ./test-check-graph-fast-path.sh
#
# Creates hermetic temp git repos and drives the guard script by setting the
# PUSHED_COMMITS env var to a JSON array of commit SHAs, with CWD set to the
# temp repo. Each case asserts the expected exit code and, where relevant, that
# stderr names the offending path / reason.
#
# The core regression case simulates the original race: a valid intentions/-only
# commit whose SHA is ALSO reachable from origin/main at check time (so the old
# three-dot `git diff origin/main...HEAD` guard would resolve to an empty diff
# and false-fail). The rewritten guard reads the frozen PUSHED_COMMITS list and
# never consults origin/main, so it still passes.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
CHECK_SCRIPT="$SCRIPT_DIR/check-graph-fast-path.sh"

PASS=0
FAIL=0
TOTAL=0

# ---------------------------------------------------------------------------
# Cleanup: remove all temp dirs on exit
# ---------------------------------------------------------------------------
TMPDIRS=()
cleanup() {
  for d in "${TMPDIRS[@]}"; do
    rm -rf "$d"
  done
}
trap cleanup EXIT

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# make_temp_repo — initialise a hermetic git repo (identity set, no commits).
# Prints the repo path.
make_temp_repo() {
  local tmpdir
  tmpdir=$(mktemp -d)
  TMPDIRS+=("$tmpdir")

  git -C "$tmpdir" init -q -b main
  git -C "$tmpdir" config user.email "test@test.local"
  git -C "$tmpdir" config user.name "Test"

  printf '%s\n' "$tmpdir"
}

# shas_json SHA... — build a JSON array of SHA strings for PUSHED_COMMITS.
# Uses jq --args so any SHA value is quoted correctly; prints "[]" for no args.
shas_json() {
  jq -n '$ARGS.positional' --args "$@"
}

# run_check REPO_DIR SHAS_JSON [HEAD_SHA] — run check-graph-fast-path.sh with
# CWD=repo, PUSHED_COMMITS=SHAS_JSON, and PUSHED_HEAD_SHA=HEAD_SHA (optional third
# arg, defaults to empty). Sets RC and STDERR (combined stdout+stderr, since the
# guard emits its ::error:: messages on stdout) for assertion helpers.
RC=0
STDERR=""
run_check() {
  local repo="$1" shas="$2" head_sha="${3:-}"
  RC=0
  STDERR=""
  STDERR=$(cd "$repo" && export PUSHED_COMMITS="$shas" PUSHED_HEAD_SHA="$head_sha" && "$CHECK_SCRIPT" 2>&1) || RC=$?
}

# assert_exit EXPECTED_RC DESCRIPTION
assert_exit() {
  local expected="$1" desc="$2"
  TOTAL=$((TOTAL + 1))
  if [ "$RC" -eq "$expected" ]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: $desc — expected exit $expected, got $RC"
    if [ -n "$STDERR" ]; then
      printf '%s\n' "$STDERR" | sed 's/^/    /'
    fi
  fi
}

# assert_stderr_contains PATTERN DESCRIPTION
assert_stderr_contains() {
  local pattern="$1" desc="$2"
  TOTAL=$((TOTAL + 1))
  if printf '%s\n' "$STDERR" | grep -qF -- "$pattern"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: $desc — stderr missing pattern: $pattern"
    if [ -n "$STDERR" ]; then
      printf '%s\n' "$STDERR" | sed 's/^/    /'
    else
      echo "    <empty stderr>"
    fi
  fi
}

# ---------------------------------------------------------------------------
# Case (a): Race regression — origin/main already CONTAINS the pushed commit.
#
# THE CORE CASE. Commit an intentions/-only change, then advance origin/main to
# point AT that same commit (merge-base(origin/main,HEAD) == HEAD). A three-dot
# `git diff origin/main...HEAD` would be empty and false-fail. The guard reads
# only PUSHED_COMMITS, examines the commit's own diff, sees intentions/-only, and
# passes.
# ---------------------------------------------------------------------------
echo "--- case (a): race — origin/main contains commit → exit 0 ---"
REPO=$(make_temp_repo)

mkdir -p "$REPO/intentions"
printf 'strategy body\n' > "$REPO/intentions/strategy-foo.md"
git -C "$REPO" add intentions/strategy-foo.md
git -C "$REPO" commit -q -m "add intention"
SHA=$(git -C "$REPO" rev-parse HEAD)
# Advance origin/main to CONTAIN (== ) the pushed commit — the race condition.
git -C "$REPO" update-ref refs/remotes/origin/main "$SHA"

run_check "$REPO" "$(shas_json "$SHA")"
assert_exit 0 "(a) race regression: exit 0"

# ---------------------------------------------------------------------------
# Case (b): Multi-commit push, all intentions/-only → exit 0.
#
# Two commits, each touching a distinct intentions/ file. Asserts EVERY listed
# commit is examined and accepted, not just HEAD.
# ---------------------------------------------------------------------------
echo "--- case (b): multi-commit intentions-only → exit 0 ---"
REPO=$(make_temp_repo)

mkdir -p "$REPO/intentions"
printf 'a\n' > "$REPO/intentions/a.md"
git -C "$REPO" add intentions/a.md
git -C "$REPO" commit -q -m "add a"
SHA1=$(git -C "$REPO" rev-parse HEAD)

printf 'b\n' > "$REPO/intentions/b.md"
git -C "$REPO" add intentions/b.md
git -C "$REPO" commit -q -m "add b"
SHA2=$(git -C "$REPO" rev-parse HEAD)

run_check "$REPO" "$(shas_json "$SHA1" "$SHA2")"
assert_exit 0 "(b) multi-commit intentions-only: exit 0"

# ---------------------------------------------------------------------------
# Case (c): A pushed commit touches a non-intentions/ path → exit 1.
#
# The commit adds an intentions/ file AND a repo-root source file. Asserts the
# guard rejects and names the offending path.
# ---------------------------------------------------------------------------
echo "--- case (c): non-intentions/ path in push → exit 1 ---"
REPO=$(make_temp_repo)

mkdir -p "$REPO/intentions"
printf 'a\n' > "$REPO/intentions/a.md"
printf 'export const x = 1;\n' > "$REPO/src.ts"
git -C "$REPO" add intentions/a.md src.ts
git -C "$REPO" commit -q -m "add intention + stray source"
SHA=$(git -C "$REPO" rev-parse HEAD)

run_check "$REPO" "$(shas_json "$SHA")"
assert_exit 1 "(c) non-intentions/ path: exit 1"
assert_stderr_contains "src.ts" "(c) non-intentions/ path: offending path named"

# ---------------------------------------------------------------------------
# Case (d): Symlink-mode (120000) entry under intentions/ → exit 1.
#
# Built hermetically with update-index --cacheinfo so no filesystem symlink
# support is required. The blob content is the (irrelevant) link target text; the
# 120000 mode is what the guard rejects.
# ---------------------------------------------------------------------------
echo "--- case (d): symlink-mode entry under intentions/ → exit 1 ---"
REPO=$(make_temp_repo)

BLOB=$(printf 'some/target/path' | git -C "$REPO" hash-object -w --stdin)
git -C "$REPO" update-index --add --cacheinfo "120000,$BLOB,intentions/x.md"
git -C "$REPO" commit -q -m "add symlink under intentions"
SHA=$(git -C "$REPO" rev-parse HEAD)

run_check "$REPO" "$(shas_json "$SHA")"
assert_exit 1 "(d) symlink-mode entry: exit 1"
assert_stderr_contains "intentions/x.md" "(d) symlink-mode entry: offending path named"

# ---------------------------------------------------------------------------
# Case (d2): Gitlink-mode (160000) entry under intentions/ → exit 1.
#
# A submodule-style gitlink entry (a commit SHA at a tree path). The 160000 mode
# is rejected as non-regular.
# ---------------------------------------------------------------------------
echo "--- case (d2): gitlink-mode entry under intentions/ → exit 1 ---"
REPO=$(make_temp_repo)

# Any 40-hex value serves as the gitlink's target commit for mode purposes.
GITLINK_SHA="0123456789012345678901234567890123456789"
git -C "$REPO" update-index --add --cacheinfo "160000,$GITLINK_SHA,intentions/sub"
git -C "$REPO" commit -q -m "add gitlink under intentions"
SHA=$(git -C "$REPO" rev-parse HEAD)

run_check "$REPO" "$(shas_json "$SHA")"
assert_exit 1 "(d2) gitlink-mode entry: exit 1"
assert_stderr_contains "intentions/sub" "(d2) gitlink-mode entry: offending path named"

# ---------------------------------------------------------------------------
# Case (e): Empty PUSHED_COMMITS ([]) with no PUSHED_HEAD_SHA → exit 1.
#
# Fail-closed: with no head SHA there is no way to prove the pushed commit already
# landed on origin/main, so the guard refuses.
# ---------------------------------------------------------------------------
echo "--- case (e): empty PUSHED_COMMITS, no head SHA → exit 1 (fail-closed) ---"
REPO=$(make_temp_repo)

run_check "$REPO" "$(shas_json)"
assert_exit 1 "(e) empty PUSHED_COMMITS: exit 1"
assert_stderr_contains "empty" "(e) empty PUSHED_COMMITS: fail-closed reason named"

# ---------------------------------------------------------------------------
# Case (e2): Empty PUSHED_COMMITS + head SHA reachable from origin/main → exit 0.
#
# The benign concurrent already-landed push: github.event.commits is empty
# because a byte-identical commit landed first, but the pushed HEAD SHA is
# provably reachable from origin/main, so the guard skips verification.
# ---------------------------------------------------------------------------
echo "--- case (e2): empty PUSHED_COMMITS, head SHA already on origin/main → exit 0 ---"
REPO=$(make_temp_repo)

mkdir -p "$REPO/intentions"
printf 'strategy body\n' > "$REPO/intentions/strategy-foo.md"
git -C "$REPO" add intentions/strategy-foo.md
git -C "$REPO" commit -q -m "add intention"
SHA=$(git -C "$REPO" rev-parse HEAD)
git -C "$REPO" update-ref refs/remotes/origin/main "$SHA"

run_check "$REPO" "$(shas_json)" "$SHA"
assert_exit 0 "(e2) empty PUSHED_COMMITS, head already on origin/main: exit 0"
assert_stderr_contains "already reachable from origin/main" "(e2) benign-skip reason named"

# ---------------------------------------------------------------------------
# Case (e3): Empty PUSHED_COMMITS + head SHA NOT reachable from origin/main → exit 1.
#
# Fail-closed: the pushed HEAD is a child of origin/main, not reachable from it,
# so the guard cannot prove it already landed.
# ---------------------------------------------------------------------------
echo "--- case (e3): empty PUSHED_COMMITS, head SHA not on origin/main → exit 1 ---"
REPO=$(make_temp_repo)

mkdir -p "$REPO/intentions"
printf 'base\n' > "$REPO/intentions/base.md"
git -C "$REPO" add intentions/base.md
git -C "$REPO" commit -q -m "base"
SHA_BASE=$(git -C "$REPO" rev-parse HEAD)
git -C "$REPO" update-ref refs/remotes/origin/main "$SHA_BASE"

printf 'a\n' > "$REPO/intentions/a.md"
git -C "$REPO" add intentions/a.md
git -C "$REPO" commit -q -m "child of base, not on origin/main"
SHA_CHILD=$(git -C "$REPO" rev-parse HEAD)

run_check "$REPO" "$(shas_json)" "$SHA_CHILD"
assert_exit 1 "(e3) empty PUSHED_COMMITS, head not on origin/main: exit 1"
assert_stderr_contains "NOT reachable from origin/main" "(e3) fail-closed reason named"

# ---------------------------------------------------------------------------
# Case (e4): Empty PUSHED_COMMITS + head SHA set but origin/main ref absent → exit 1.
#
# Fail-closed: without an origin/main ref the guard cannot verify reachability.
# ---------------------------------------------------------------------------
echo "--- case (e4): empty PUSHED_COMMITS, origin/main ref absent → exit 1 ---"
REPO=$(make_temp_repo)

mkdir -p "$REPO/intentions"
printf 'a\n' > "$REPO/intentions/a.md"
git -C "$REPO" add intentions/a.md
git -C "$REPO" commit -q -m "add a, no origin/main ref set"
SHA=$(git -C "$REPO" rev-parse HEAD)

run_check "$REPO" "$(shas_json)" "$SHA"
assert_exit 1 "(e4) empty PUSHED_COMMITS, origin/main absent: exit 1"
assert_stderr_contains "origin/main is not available" "(e4) fail-closed reason named"

# ---------------------------------------------------------------------------
# Case (f): A merge commit among the pushed SHAs → exit 1.
#
# `git diff-tree` without -m prints nothing for a merge, so its changes would go
# unexamined — the guard rejects any pushed SHA with >1 parent outright.
# ---------------------------------------------------------------------------
echo "--- case (f): merge commit in push → exit 1 ---"
REPO=$(make_temp_repo)

mkdir -p "$REPO/intentions"
printf 'base\n' > "$REPO/intentions/base.md"
git -C "$REPO" add intentions/base.md
git -C "$REPO" commit -q -m "base"

git -C "$REPO" checkout -q -b side
printf 'a\n' > "$REPO/intentions/a.md"
git -C "$REPO" add intentions/a.md
git -C "$REPO" commit -q -m "side add a"

git -C "$REPO" checkout -q main
printf 'b\n' > "$REPO/intentions/b.md"
git -C "$REPO" add intentions/b.md
git -C "$REPO" commit -q -m "main add b"

git -C "$REPO" merge -q --no-ff --no-edit side
MERGE_SHA=$(git -C "$REPO" rev-parse HEAD)

run_check "$REPO" "$(shas_json "$MERGE_SHA")"
assert_exit 1 "(f) merge commit in push: exit 1"
assert_stderr_contains "merge commits" "(f) merge commit in push: merge reason named"

# ---------------------------------------------------------------------------
# Case (g): A path with a space under intentions/ → exit 0.
#
# Asserts the guard's TAB-based path parsing: `git diff-tree --raw` emits
# ":<srcmode> <dstmode> <srcsha> <dstsha> <status>\t<path>", so a space in the
# path must not be misread as a field boundary.
# ---------------------------------------------------------------------------
echo "--- case (g): space in intentions/ path → exit 0 ---"
REPO=$(make_temp_repo)

mkdir -p "$REPO/intentions"
printf 'x\n' > "$REPO/intentions/my node.md"
git -C "$REPO" add "intentions/my node.md"
git -C "$REPO" commit -q -m "add spaced-path intention"
SHA=$(git -C "$REPO" rev-parse HEAD)

run_check "$REPO" "$(shas_json "$SHA")"
assert_exit 0 "(g) space in intentions/ path: exit 0"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "Results: $PASS passed, $FAIL failed, $TOTAL total"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo "All tests passed."
