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
#                  (the strict-ancestor shape; HEAD is the ROOT commit)
#     "behind-nonroot"
#                — the strict-ancestor shape with a first parent available
#                  (the push race on `main`)
#     "merged-feature"
#                — the OTHER strict-ancestor shape: a TWO-commit feature branch
#                  already merged into origin/main as a merge commit's SECOND
#                  parent, with HEAD parked on the branch tip. HEAD is contained
#                  in origin/main but sits OFF its first-parent chain.
#     "demoted-main-tip"
#                — the SAME off-chain shape reached the other way: a commit
#                  pushed to `main` that a later landing merge demoted into its
#                  SECOND parent. Indistinguishable from the above, which is
#                  exactly why the off-chain arm resolves rather than refuses.
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
    behind-nonroot)
      # Same strict-ancestor shape, but HEAD has a first parent — the push-race
      # on `main`: this run's commit landed, a second push landed on top, and
      # actions/checkout has already fetched the newer origin/main.
      printf 'mine\n' > "$REPO/mine.txt"
      git -C "$REPO" add mine.txt
      git -C "$REPO" commit -q -m "the push this run is for"
      MINE_SHA=$(git -C "$REPO" rev-parse HEAD)
      printf 'theirs\n' > "$REPO/theirs.txt"
      git -C "$REPO" add theirs.txt
      git -C "$REPO" commit -q -m "the second push, landed while this run was in flight"
      git -C "$REPO" update-ref refs/remotes/origin/main "$(git -C "$REPO" rev-parse HEAD)"
      git -C "$REPO" checkout -q "$MINE_SHA"
      ;;
    merged-feature)
      # A TWO-commit feature branch merged into main with --no-ff, so the merge
      # commit's FIRST parent is the pre-merge main tip and its SECOND parent is
      # the branch. HEAD is parked on the branch tip: contained in origin/main
      # (so merge-base == HEAD, and the no-delta arm fires) but OFF origin/main's
      # first-parent chain.
      #
      # Two commits, not one, is load-bearing: it is what makes HEAD^1..HEAD
      # DEMONSTRABLY smaller than the branch. With one commit the narrowed range
      # would happen to equal the branch and the vacuity would be invisible.
      git -C "$REPO" checkout -q -b merged-feature
      printf 'first\n' > "$REPO/branch-first.txt"
      git -C "$REPO" add branch-first.txt
      git -C "$REPO" commit -q -m "branch commit 1 of 2"
      printf 'second\n' > "$REPO/branch-second.txt"
      git -C "$REPO" add branch-second.txt
      git -C "$REPO" commit -q -m "branch commit 2 of 2"
      MERGED_TIP_SHA=$(git -C "$REPO" rev-parse HEAD)
      git -C "$REPO" checkout -q main
      git -C "$REPO" merge -q --no-ff merged-feature -m "merge the feature branch"
      git -C "$REPO" update-ref refs/remotes/origin/main "$(git -C "$REPO" rev-parse HEAD)"
      git -C "$REPO" checkout -q "$MERGED_TIP_SHA"
      ;;
    demoted-main-tip)
      # The OTHER way to land off origin/main's first-parent chain, and the one
      # that makes refusing this shape unshippable: a merge-then-push landing
      # DEMOTES the previous `main` tip into the merge's SECOND parent.
      #
      # X is pushed to main and a workflow run starts for it. Before that run's
      # `actions/checkout` fetches, a landing merges its own line Y and pushes M
      # with M^1 = Y and M^2 = X. The run's HEAD is now X: contained in
      # origin/main, off its first-parent chain, and structurally identical to
      # an already-merged feature branch — the benign push race this mode exists
      # to absorb, wearing the shape an earlier revision of the arm refused.
      #
      # Measured on the real repo 2026-08-31: 25 of 25 merge commits on
      # origin/main's own first-parent chain have an off-chain second parent.
      printf 'pushed to main\n' > "$REPO/demoted.txt"
      git -C "$REPO" add demoted.txt
      git -C "$REPO" commit -q -m "the push this run is for"
      DEMOTED_SHA=$(git -C "$REPO" rev-parse HEAD)
      git -C "$REPO" checkout -q -b lander "$BASELINE_SHA"
      printf 'the landing\n' > "$REPO/lander.txt"
      git -C "$REPO" add lander.txt
      git -C "$REPO" commit -q -m "the landing's own line"
      git -C "$REPO" merge -q --no-ff "$DEMOTED_SHA" -m "landing merge: demotes the main tip to P2"
      git -C "$REPO" update-ref refs/remotes/origin/main "$(git -C "$REPO" rev-parse HEAD)"
      git -C "$REPO" checkout -q "$DEMOTED_SHA"
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

# Local, matching assert_contains's own [[ == * ]] form (test-helpers.sh) rather
# than an `echo | grep` pipe: this suite's haystacks are single ERR captures,
# but a subprocess pipe under `set -o pipefail` is the same SIGPIPE trap that
# comment warns about, so there is no reason to reintroduce it here.
assert_not_contains() {  # <label> <needle> <haystack>
  local label="$1" needle="$2" haystack="$3"
  TOTAL=$((TOTAL + 1))
  if [[ "$haystack" == *"$needle"* ]]; then
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label"
    echo "    expected NOT to contain: $needle"
    echo "    actual: $haystack"
  else
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  fi
}

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
OLD_DELTA=$(git -C "$REPO" diff --name-only 'refs/remotes/origin/main...HEAD')  # diff-base-ok: the reproduction: asserts the old vacuous range sees nothing
assert_eq "at-tip/first-parent: the old three-dot range was empty" "" "$OLD_DELTA"
# HEAD is exactly the remote tip — the ordinary, expected post-merge push —
# so the stale-checkout warning must stay silent here.
assert_not_contains "at-tip/first-parent: no stale-checkout warning at the tip" \
  "WARNING" "$ERR"

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
# Test 4: HEAD is a STRICT ancestor of the remote ref. The two modes diverge.
#
# `fail` keeps exit 5: a caller that needs a branch delta has none here, and
# the cause (already merged / checkout behind) differs from the at-tip cause,
# so the code stays distinct from 8.
#
# `first-parent` resolves to HEAD^1, exactly as it does at the tip. Before this
# was fixed the exit-5 branch ran BEFORE the --at-remote-tip handling, so a
# first-parent caller could never reach its own fallback — and every one of the
# nine call sites runs on `main` pushes, where a second push landing while the
# first run is in flight makes that run's HEAD a strict ancestor of
# origin/main. Four required contexts went red on `main` for a benign race,
# blocking merges repo-wide.
# ---------------------------------------------------------------------------
echo "Test 4: strict ancestor — fatal under fail, HEAD^1 under first-parent"
make_repo behind
run_sut --repo-root "$REPO"
assert_eq "behind/default: exit 5" "yes" "$(rc_of "$RC" 5)"
assert_contains "behind/default: names the condition" "STRICT ANCESTOR" "$ERR"
assert_eq "behind/default: stdout is empty" "" "$OUT"

# The `behind` fixture parks HEAD on the ROOT commit, so first-parent has no
# HEAD^1 there and the root-commit guard (exit 9) fires — proving that guard
# covers the strict-ancestor shape too, not just the at-tip one.
run_sut --repo-root "$REPO" --at-remote-tip first-parent
assert_eq "behind root commit/first-parent: exit 9" "yes" "$(rc_of "$RC" 9)"
assert_contains "behind root commit/first-parent: names the condition" "root commit" "$ERR"
assert_eq "behind root commit/first-parent: stdout is empty" "" "$OUT"

# The real push-race shape: HEAD is a strict ancestor AND has a first parent.
make_repo behind-nonroot
BEHIND_PARENT=$(git -C "$REPO" rev-parse 'HEAD^1')
run_sut --repo-root "$REPO" --at-remote-tip first-parent
assert_eq "behind/first-parent: exit 0" "0" "$RC"
assert_eq "behind/first-parent: base is HEAD^1" "$BEHIND_PARENT" "$OUT"
assert_contains "behind/first-parent: provenance names source=first-parent" \
  "source=first-parent" "$ERR"
# The point of not failing: the range the caller then diffs is non-empty, so
# the check examines what this commit introduced instead of going red.
BEHIND_DELTA=$(git -C "$REPO" diff --name-only "$OUT"..HEAD)
assert_eq "behind/first-parent: the resulting range names the file this commit added" \
  "mine.txt" "$BEHIND_DELTA"
# The fallback is loud, not silent: HEAD is strictly behind $REMOTE_REF, so a
# developer running this locally (every first-parent call site is ALSO a
# developer-invoked script) still gets told the checkout is stale, even though
# the exit code is 0.
assert_contains "behind/first-parent: warns the checkout is behind" \
  "WARNING" "$ERR"
assert_contains "behind/first-parent: warning names HEAD" "$MINE_SHA" "$ERR"
assert_contains "behind/first-parent: warning names the remote ref" \
  "origin/main" "$ERR"
assert_contains "behind/first-parent: warning tells the reader to fetch/rebase" \
  "fetch and rebase" "$ERR"
# ... and the default mode is untouched by that: still exit 5.
run_sut --repo-root "$REPO"
assert_eq "behind-nonroot/default: exit 5" "yes" "$(rc_of "$RC" 5)"

# ---------------------------------------------------------------------------
# Test 4b: HEAD contained in origin/main but OFF its first-parent chain —
# resolved from the FORK POINT, with a warning. Never refused.
#
# HEAD is contained in origin/main, so the no-delta arm fires exactly as it does
# for the push race above, but HEAD came in as a merge commit's SECOND parent.
# HEAD^1..HEAD is then only the LAST COMMIT of the line HEAD ends, so the base
# is the fork point — the newest commit on origin/main's first-parent chain that
# is an ancestor of HEAD — which covers the whole line.
#
# WHY THIS MUST NOT REFUSE, which is the regression this test now pins: TWO
# unrelated situations produce this identical shape, and nothing here can tell
# them apart.
#   (a) an already-merged feature branch                 — `merged-feature`
#   (b) a `main` tip demoted into a landing merge's P2   — `demoted-main-tip`
# (b) is the benign push race the whole mode exists to absorb. Measured on the
# real repo 2026-08-31: 25 of 25 merge commits on origin/main's first-parent
# chain have an off-chain second parent, and `unit-tests.yml` does not ignore
# `main`, so refusing here reddens a required context on `main` deterministically
# for any workflow re-run on one of them. An earlier revision of this arm did
# exit 5, and that is what these two arms exist to keep from coming back.
#
# The DEFAULT `fail` mode is deliberately untouched: it still exits 5 for both
# halves of the strict-ancestor shape, and the arms below assert it still does.
# ---------------------------------------------------------------------------
echo "Test 4b: off the first-parent chain resolves the fork point and warns, never refuses"
make_repo merged-feature

# Why the fork point and not HEAD^1, measured on the fixture rather than asserted
# from the helper: HEAD^1..HEAD sees one of the branch's two files.
NARROWED=$(git -C "$REPO" diff --name-only "$MERGED_TIP_SHA^1..$MERGED_TIP_SHA")
assert_eq "merged-feature: HEAD^1..HEAD sees only the branch's LAST commit" \
  "branch-second.txt" "$NARROWED"

run_sut --repo-root "$REPO" --at-remote-tip first-parent
assert_eq "merged-feature/first-parent: exit 0 (resolves, never refuses)" "0" "$RC"
assert_eq "merged-feature/first-parent: base is the fork point" "$BASELINE_SHA" "$OUT"
assert_contains "merged-feature/first-parent: provenance names source=fork-point" \
  "source=fork-point" "$ERR"
# The payoff: the range the caller diffs covers the WHOLE branch, not its last
# commit — strictly wider than the HEAD^1 range measured above.
MF_DELTA=$(git -C "$REPO" diff --name-only "$OUT"..HEAD)
assert_eq "merged-feature/first-parent: the resolved range names BOTH branch files" \
  "branch-first.txt
branch-second.txt" "$MF_DELTA"
# Loud, not silent: the reader must be able to see this is not the full range.
assert_contains "merged-feature/first-parent: warns" "WARNING" "$ERR"
assert_contains "merged-feature/first-parent: warning names the condition" \
  "OFF its first-parent chain" "$ERR"
assert_contains "merged-feature/first-parent: warning says it is not the full range" \
  "not the full range since" "$ERR"
assert_contains "merged-feature/first-parent: warning still tells a developer to fetch/rebase" \
  "fetch and rebase" "$ERR"
# The old text named a remedy ("run the check against the merge commit that
# carried this branch in") that is WRONG for the demoted-main-tip half. The two
# shapes are indistinguishable here, so the message must name NEITHER remedy.
assert_not_contains "merged-feature/first-parent: names no shape-specific remedy" \
  "carried this branch in" "$ERR"

# ... and the default mode is unchanged: the same exit 5 it always gave.
run_sut --repo-root "$REPO"
assert_eq "merged-feature/default: exit 5 (unchanged)" "yes" "$(rc_of "$RC" 5)"
assert_contains "merged-feature/default: still the STRICT ANCESTOR message" \
  "STRICT ANCESTOR" "$ERR"

# (b) the SAME off-chain shape, reached by a landing merge demoting the `main`
# tip. This is the arm that makes refusing unshippable: it is the benign push
# race, and it must resolve.
make_repo demoted-main-tip
run_sut --repo-root "$REPO" --at-remote-tip first-parent
assert_eq "demoted-main-tip/first-parent: exit 0 (the push race must not redden main)" \
  "0" "$RC"
assert_eq "demoted-main-tip/first-parent: base is the fork point" "$BASELINE_SHA" "$OUT"
assert_contains "demoted-main-tip/first-parent: provenance names source=fork-point" \
  "source=fork-point" "$ERR"
# For a one-commit line the fork point IS HEAD^1, so the range is exactly what
# that push introduced — and never the landing's own file.
DMT_DELTA=$(git -C "$REPO" diff --name-only "$OUT"..HEAD)
assert_eq "demoted-main-tip/first-parent: the range is exactly what that push introduced" \
  "demoted.txt" "$DMT_DELTA"
assert_eq "demoted-main-tip: the fork point coincides with HEAD^1 for a one-commit line" \
  "$(git -C "$REPO" rev-parse 'HEAD^1')" "$OUT"

# The positive control that keeps this narrow: the ON-chain half of the same
# strict-ancestor shape must still resolve from HEAD^1, not from the fork point.
make_repo behind-nonroot
run_sut --repo-root "$REPO" --at-remote-tip first-parent
assert_eq "control: on-chain strict ancestor still exits 0" "0" "$RC"
assert_contains "control: on-chain strict ancestor still resolves first-parent" \
  "source=first-parent" "$ERR"
assert_not_contains "control: on-chain does NOT take the fork-point arm" \
  "source=fork-point" "$ERR"

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

# ---------------------------------------------------------------------------
# Test 14: git's STDERR must never ride along in a captured VALUE.
# ---------------------------------------------------------------------------
echo "Test 14: git's stderr never rides along in the captured value"
# REGRESSION. Three captures in this helper used to be spelled
# `VAR=$(git ... 2>&1)`, which splices git's STDERR into the VALUE. git writes
# to stderr on its SUCCESS path too, so the corruption happens on a run that
# never fails: the variable comes back as "<warning text>\n<real value>" and the
# next command that consumes it dies with a diagnosis pointing somewhere else.
#
# GIT_TRACE=1 is the deterministic success-path stderr emitter — it makes every
# git invocation write trace lines to stderr while still exiting 0, so it fires
# on all three captures at once. It is also a state a developer debugging git,
# or a CI runner with it exported, is genuinely in.
#
# Measured on the pre-fix spelling: this run exits 7 ("--head 'HEAD' does not
# resolve to a commit"), because $ROOT came back as trace output rather than a
# path. The correct behaviour is exit 0 with the SHA on stdout and every trace
# line on stderr, where it belongs.
make_repo
EXPECTED_TRACE_BASE=$(git -C "$REPO" rev-parse refs/remotes/origin/main)
RC=0; OUT=""; ERR=""
TRACE_ERR=$(mktemp "$TMP_ROOT/trace.XXXXXX")
set +e
OUT=$(GIT_TRACE=1 "$SUT" --repo-root "$REPO" 2>"$TRACE_ERR")
RC=$?
set -e
ERR=$(cat "$TRACE_ERR")
rm -f "$TRACE_ERR"
assert_eq "GIT_TRACE: exit 0" "0" "$RC"
assert_eq "GIT_TRACE: stdout is exactly the merge-base SHA" "$EXPECTED_TRACE_BASE" "$OUT"
assert_not_contains "GIT_TRACE: no trace text spliced into stdout" "trace:" "$OUT"
# The trace itself is not swallowed — a diagnostic that vanishes is its own bug.
assert_contains "GIT_TRACE: the trace still reaches stderr" "trace:" "$ERR"

# The same, for the OTHER capture: the no---repo-root path resolves the root
# from the CWD instead, and had the identical `2>&1` splice. Only this repo's
# own checkout can exercise it — a foreign CWD trips the divergence guard first
# (Test 10) — so it is driven from $SCRIPT_DIR, exactly as Test 11 does.
#
# NOT TESTED HERE, deliberately: an ambiguous refname (a tag and a branch of the
# same name). It reaches this helper through `--remote-ref`, which is consumed
# by `rev-parse --verify --quiet` — `--quiet` suppresses the warning — and the
# merge-base call downstream is handed resolved SHAs, so nothing warns. Measured
# against the PRE-FIX helper: identical exit 0 and identical SHA, i.e. the
# assertion could not fail either way. The ambiguous shape does discriminate one
# layer up, where a caller passes the name straight to merge-base, and it is
# pinned there: test-get-changed-apps.sh Test 3e.
TRACE_OWN_ERR=$(mktemp "$TMP_ROOT/trace-own.XXXXXX")
TRACE_PREV=$(pwd)
cd "$SCRIPT_DIR"
set +e
TRACE_OWN_OUT=$(GIT_TRACE=1 "$SUT" --at-remote-tip first-parent 2>"$TRACE_OWN_ERR")
TRACE_OWN_RC=$?
set -e
cd "$TRACE_PREV"
rm -f "$TRACE_OWN_ERR"
assert_eq "GIT_TRACE (no --repo-root): exit 0" "0" "$TRACE_OWN_RC"
assert_eq "GIT_TRACE (no --repo-root): stdout is one bare 40-hex SHA" "yes" \
  "$(if [[ "$TRACE_OWN_OUT" =~ ^[0-9a-f]{40}$ ]]; then echo yes; else echo "no ($TRACE_OWN_OUT)"; fi)"

report_results
