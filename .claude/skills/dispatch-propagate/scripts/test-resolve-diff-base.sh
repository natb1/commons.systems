#!/usr/bin/env bash
# Tests for resolve-diff-base.sh.
#
# Every exit code in the helper's header table gets a case, plus the two
# success shapes (merge-base and first-parent) and the provenance line that is
# the whole audit trail. The fixtures are hermetic git repos under a per-run
# mktemp dir; nothing here touches the repo this suite lives in except to read
# the SUT.
#
# The HEADLINE case is "first-parent at the remote tip": HEAD == origin/main is
# exactly what actions/checkout leaves on a push to `main`, and it is the state
# in which every `origin/main...HEAD` diff in this repo went silently empty.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
source "$SCRIPT_DIR/test-helpers.sh"
SUT="$SCRIPT_DIR/resolve-diff-base.sh"

TMP_ROOT=""
cleanup() { [ -n "${TMP_ROOT:-}" ] && rm -rf "$TMP_ROOT"; }
trap cleanup EXIT INT TERM
TMP_ROOT=$(mktemp -d)

# ---------------------------------------------------------------------------
# Fixture: a repo with a baseline commit on main, refs/remotes/origin/main set
# to it, and (by default) a feature branch carrying one further commit.
#
# $1: "at-tip"   — stay on main with origin/main at HEAD (the push-to-main
#                  shape; HEAD == origin/main)
#     "behind"   — check out the baseline commit while origin/main is one ahead
#                  (the strict-ancestor shape)
#     (default)  — a feature branch one commit ahead of origin/main
# Sets: REPO
# ---------------------------------------------------------------------------
REPO=""
make_repo() {
  local shape="${1:-branch}"
  REPO=$(mktemp -d "$TMP_ROOT/repo.XXXXXX")

  git -C "$REPO" init -q -b main
  git -C "$REPO" config user.email "test@example.com"
  git -C "$REPO" config user.name "Test User"

  printf 'baseline\n' > "$REPO/README"
  git -C "$REPO" add README
  git -C "$REPO" commit -q -m "baseline"
  BASELINE_SHA=$(git -C "$REPO" rev-parse HEAD)

  case "$shape" in
    at-tip)
      # A second commit, with origin/main moved onto it: HEAD == origin/main,
      # and HEAD^1 is the baseline. This is the push-to-main shape.
      printf 'pushed\n' > "$REPO/pushed.txt"
      git -C "$REPO" add pushed.txt
      git -C "$REPO" commit -q -m "the push"
      git -C "$REPO" update-ref refs/remotes/origin/main "$(git -C "$REPO" rev-parse HEAD)"
      ;;
    behind)
      printf 'ahead\n' > "$REPO/ahead.txt"
      git -C "$REPO" add ahead.txt
      git -C "$REPO" commit -q -m "remote is ahead"
      git -C "$REPO" update-ref refs/remotes/origin/main "$(git -C "$REPO" rev-parse HEAD)"
      git -C "$REPO" checkout -q "$BASELINE_SHA"
      ;;
    *)
      git -C "$REPO" update-ref refs/remotes/origin/main "$BASELINE_SHA"
      git -C "$REPO" checkout -q -b feature
      printf 'feature\n' > "$REPO/feature.txt"
      git -C "$REPO" add feature.txt
      git -C "$REPO" commit -q -m "feature work"
      ;;
  esac
}

# Run the SUT. Sets RC, OUT (stdout), ERR (stderr) separately, because the
# stdout contract ("exactly one line, the SHA, and nothing else") is only
# assertable when the provenance line is kept off stdout.
RC=0
OUT=""
ERR=""
run_sut() {
  local errfile
  errfile=$(mktemp "$TMP_ROOT/err.XXXXXX")
  set +e
  OUT=$("$SUT" "$@" 2>"$errfile")
  RC=$?
  set -e
  ERR=$(cat "$errfile")
  rm -f "$errfile"
}

# Same, but with the CWD moved into $1 first (the no---repo-root path).
run_sut_in() {
  local dir="$1"; shift
  local prev
  prev=$(pwd)
  cd "$dir"
  run_sut "$@"
  cd "$prev"
}

rc_of() { if [ "$1" -eq "$2" ]; then echo "yes"; else echo "no (rc=$1)"; fi; }

# ---------------------------------------------------------------------------
# Test 1: the ordinary branch case resolves to the merge base.
# ---------------------------------------------------------------------------
echo "Test 1: branch ahead of origin/main resolves to the merge base"
make_repo
EXPECTED_BASE=$(git -C "$REPO" rev-parse refs/remotes/origin/main)
run_sut --repo-root "$REPO"
assert_eq "branch: exit 0" "0" "$RC"
assert_eq "branch: stdout is exactly the merge-base SHA" "$EXPECTED_BASE" "$OUT"
assert_contains "branch: provenance names source=merge-base" "source=merge-base" "$ERR"
assert_contains "branch: provenance names the repo root" "repo=$REPO" "$ERR"

# ---------------------------------------------------------------------------
# Test 2 (HEADLINE): HEAD == origin/main, --at-remote-tip first-parent.
#
# This is the push-to-main shape. Before this helper existed every caller spelt
# its baseline `origin/main...HEAD`, which expands to HEAD..HEAD here and is
# EMPTY — read by every caller as "nothing changed, clean pass".
# ---------------------------------------------------------------------------
echo "Test 2: at the remote tip, first-parent returns HEAD^1"
make_repo at-tip
EXPECTED_PARENT=$(git -C "$REPO" rev-parse 'HEAD^1')
run_sut --repo-root "$REPO" --at-remote-tip first-parent
assert_eq "at-tip/first-parent: exit 0" "0" "$RC"
assert_eq "at-tip/first-parent: base is HEAD^1" "$EXPECTED_PARENT" "$OUT"
assert_contains "at-tip/first-parent: provenance names source=first-parent" \
  "source=first-parent" "$ERR"
# The whole point: the range the caller then diffs is NOT empty.
DELTA=$(git -C "$REPO" diff --name-only "$OUT"..HEAD)
assert_eq "at-tip/first-parent: the resulting range names the pushed file" \
  "pushed.txt" "$DELTA"
# ... whereas the expression this helper replaces sees nothing at all.
OLD_DELTA=$(git -C "$REPO" diff --name-only 'refs/remotes/origin/main...HEAD')
assert_eq "at-tip/first-parent: the old three-dot range was empty" "" "$OLD_DELTA"

# ---------------------------------------------------------------------------
# Test 3: exit 8 — at the remote tip under the default `fail` mode.
# ---------------------------------------------------------------------------
echo "Test 3: at the remote tip, the default mode fails"
make_repo at-tip
run_sut --repo-root "$REPO"
assert_eq "at-tip/fail: exit 8" "yes" "$(rc_of "$RC" 8)"
assert_eq "at-tip/fail: stdout is empty" "" "$OUT"
assert_contains "at-tip/fail: names the remedy" "--at-remote-tip first-parent" "$ERR"

# ---------------------------------------------------------------------------
# Test 4: exit 5 — HEAD is a STRICT ancestor of the remote ref. Always fatal,
# never governed by --at-remote-tip.
# ---------------------------------------------------------------------------
echo "Test 4: strict ancestor is fatal in both modes"
make_repo behind
run_sut --repo-root "$REPO"
assert_eq "behind/default: exit 5" "yes" "$(rc_of "$RC" 5)"
assert_contains "behind/default: names the condition" "STRICT ANCESTOR" "$ERR"
run_sut --repo-root "$REPO" --at-remote-tip first-parent
assert_eq "behind/first-parent: still exit 5" "yes" "$(rc_of "$RC" 5)"
assert_eq "behind/first-parent: stdout is empty" "" "$OUT"

# ---------------------------------------------------------------------------
# Test 5: exit 4 — the remote ref does not resolve.
# ---------------------------------------------------------------------------
echo "Test 5: unresolvable remote ref"
make_repo
run_sut --repo-root "$REPO" --remote-ref origin/nope-does-not-exist
assert_eq "bad remote-ref: exit 4" "yes" "$(rc_of "$RC" 4)"
assert_contains "bad remote-ref: names fetch-depth" "fetch-depth: 0" "$ERR"

# Deleting refs/remotes/origin/main is the same failure by the other route —
# and it is what detect-changes.sh used to answer with a silent HEAD~1
# substitution.
run_sut --repo-root "$REPO" --remote-ref refs/remotes/origin/main
assert_eq "remote-ref present: exit 0" "0" "$RC"
git -C "$REPO" update-ref -d refs/remotes/origin/main
run_sut --repo-root "$REPO"
assert_eq "deleted remote-ref: exit 4" "yes" "$(rc_of "$RC" 4)"

# ---------------------------------------------------------------------------
# Test 6: exit 7 — --head does not resolve.
# ---------------------------------------------------------------------------
echo "Test 6: unresolvable head ref"
make_repo
run_sut --repo-root "$REPO" --head no-such-ref-at-all
assert_eq "bad head: exit 7" "yes" "$(rc_of "$RC" 7)"
assert_contains "bad head: names the ref" "no-such-ref-at-all" "$ERR"

# ---------------------------------------------------------------------------
# Test 7: exit 6 — unrelated histories have no merge base.
# ---------------------------------------------------------------------------
echo "Test 7: unrelated histories"
make_repo
git -C "$REPO" checkout -q --orphan orphan-branch
git -C "$REPO" rm -q -rf . >/dev/null 2>&1 || true
printf 'orphan\n' > "$REPO/ORPHAN"
git -C "$REPO" add ORPHAN
git -C "$REPO" commit -q -m "orphan root"
run_sut --repo-root "$REPO"
assert_eq "unrelated histories: exit 6" "yes" "$(rc_of "$RC" 6)"
assert_contains "unrelated histories: names the condition" "no merge base" "$ERR"

# ---------------------------------------------------------------------------
# Test 8: exit 9 — first-parent requested but HEAD is a root commit.
# ---------------------------------------------------------------------------
echo "Test 8: first-parent on a root commit"
REPO=$(mktemp -d "$TMP_ROOT/repo.XXXXXX")
git -C "$REPO" init -q -b main
git -C "$REPO" config user.email "test@example.com"
git -C "$REPO" config user.name "Test User"
printf 'only\n' > "$REPO/ONLY"
git -C "$REPO" add ONLY
git -C "$REPO" commit -q -m "root"
git -C "$REPO" update-ref refs/remotes/origin/main "$(git -C "$REPO" rev-parse HEAD)"
run_sut --repo-root "$REPO" --at-remote-tip first-parent
assert_eq "root commit: exit 9" "yes" "$(rc_of "$RC" 9)"
assert_contains "root commit: names the condition" "root commit" "$ERR"

# ---------------------------------------------------------------------------
# Test 9: exit 3 — repo-root resolution failures.
# ---------------------------------------------------------------------------
echo "Test 9: repo-root resolution failures"
run_sut --repo-root "$TMP_ROOT/definitely-not-a-directory"
assert_eq "missing dir: exit 3" "yes" "$(rc_of "$RC" 3)"
assert_contains "missing dir: names the condition" "is not a directory" "$ERR"

NON_REPO=$(mktemp -d "$TMP_ROOT/nonrepo.XXXXXX")
run_sut --repo-root "$NON_REPO"
assert_eq "non-repo dir: exit 3" "yes" "$(rc_of "$RC" 3)"
assert_contains "non-repo dir: names the condition" "not inside a git work tree" "$ERR"

# The divergence guard: no --repo-root, and the CWD is a DIFFERENT checkout
# from the one this script lives in. Either tree could be meant, so refuse and
# name the flag. This is the foreign-cwd vacuity the helper exists to stop.
echo "Test 10: no --repo-root, foreign CWD, divergence guard fires"
make_repo
run_sut_in "$REPO"
assert_eq "foreign cwd: exit 3" "yes" "$(rc_of "$RC" 3)"
assert_contains "foreign cwd: names the flag" "Pass --repo-root" "$ERR"
assert_eq "foreign cwd: stdout is empty" "" "$OUT"

# ... and with the CWD inside this script's OWN repo the default is accepted.
echo "Test 11: no --repo-root, CWD in this script's own repo, default accepted"
SELF_ROOT=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)
run_sut_in "$SELF_ROOT" --at-remote-tip first-parent
assert_eq "own repo: exit 0" "0" "$RC"
assert_contains "own repo: provenance names this tree" "repo=$SELF_ROOT" "$ERR"

# ---------------------------------------------------------------------------
# Test 12: exit 2 — usage errors.
# ---------------------------------------------------------------------------
echo "Test 12: usage errors"
run_sut --no-such-flag
assert_eq "unknown flag: exit 2" "yes" "$(rc_of "$RC" 2)"
assert_contains "unknown flag: names it" "unknown argument: --no-such-flag" "$ERR"

run_sut --repo-root
assert_eq "missing flag value: exit 2" "yes" "$(rc_of "$RC" 2)"

run_sut --repo-root "$REPO" --at-remote-tip sometimes
assert_eq "bad --at-remote-tip value: exit 2" "yes" "$(rc_of "$RC" 2)"
assert_contains "bad --at-remote-tip value: prints usage" "fail (default) | first-parent" "$ERR"

# ---------------------------------------------------------------------------
# Test 13: the NOT-IN-SCOPE contract is documented, not merely intended.
#
# The helper resolves a COMMIT base. An uncommitted working-tree edit is in no
# commit, so it is invisible to <base>..HEAD — the changed-file tiers are still
# vacuous on uncommitted work. That is a separate defect; this asserts the
# header says so, so the next reader does not mistake this change for its fix.
# ---------------------------------------------------------------------------
echo "Test 13: the working-tree limitation is stated in the header"
SUT_SRC=$(cat "$SUT")
assert_contains "header: names the working-tree exclusion" \
  "The WORKING TREE. This helper resolves a COMMIT base" "$SUT_SRC"
assert_contains "header: names the multi-commit-push residual" \
  "github.event.before" "$SUT_SRC"

report_results
