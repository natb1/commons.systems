#!/usr/bin/env bash
# Tests for get-changed-apps.sh's baseline resolution.
#
# The case that matters is the PUSH-TO-MAIN shape. actions/checkout leaves
# refs/remotes/origin/main pointing AT the pushed commit, so HEAD == origin/main
# and the `"$BASE"...HEAD` three-dot range this script used to spell inline
# expanded to HEAD..HEAD — empty. Every consumer (run-lint.sh:64,
# run-unit-tests.sh:68, run-typecheck.sh:44) reads an empty result as "no dirty
# apps", so the post-merge run did no vitest, no eslint and no build, and
# reported success.
#
# Each case runs the REAL get-changed-apps.sh with CWD inside an ephemeral repo;
# the script resolves REPO_ROOT from CWD, so that points the real script at the
# fixture. It reaches the real resolve-diff-base.sh through its own $SCRIPT_DIR.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
source "$SCRIPT_DIR/test-helpers.sh"
SUT="$SCRIPT_DIR/get-changed-apps.sh"

TMP_ROOT=""
cleanup() { [ -n "${TMP_ROOT:-}" ] && rm -rf "$TMP_ROOT"; }
trap cleanup EXIT INT TERM
TMP_ROOT=$(mktemp -d)

# ---------------------------------------------------------------------------
# Fixture: a workspace repo whose only workspace is `myapp`.
#
# $1: "at-tip"  — the push-to-main shape: the change to myapp is in the commit
#                 that origin/main and HEAD both point at.
#     (default) — a feature branch one commit ahead of origin/main, carrying
#                 the change to myapp.
# Sets: REPO
# ---------------------------------------------------------------------------
REPO=""
make_repo() {
  local shape="${1:-branch}"
  REPO=$(mktemp -d "$TMP_ROOT/repo.XXXXXX")

  git -C "$REPO" init -q -b main
  git -C "$REPO" config user.email "test@example.com"
  git -C "$REPO" config user.name "Test User"

  printf '{ "name": "root", "private": true, "workspaces": ["myapp"] }\n' \
    > "$REPO/package.json"
  mkdir -p "$REPO/myapp/src"
  printf '{ "name": "myapp", "version": "0.0.0" }\n' > "$REPO/myapp/package.json"
  printf 'export const x = 1;\n' > "$REPO/myapp/src/index.ts"
  git -C "$REPO" add -A
  git -C "$REPO" commit -q -m "baseline"

  local baseline
  baseline=$(git -C "$REPO" rev-parse HEAD)

  if [ "$shape" = "at-tip" ]; then
    printf 'export const x = 2;\n' > "$REPO/myapp/src/index.ts"
    git -C "$REPO" add -A
    git -C "$REPO" commit -q -m "touch myapp (the push)"
    git -C "$REPO" update-ref refs/remotes/origin/main "$(git -C "$REPO" rev-parse HEAD)"
  else
    git -C "$REPO" update-ref refs/remotes/origin/main "$baseline"
    git -C "$REPO" checkout -q -b feature
    printf 'export const x = 2;\n' > "$REPO/myapp/src/index.ts"
    git -C "$REPO" add -A
    git -C "$REPO" commit -q -m "touch myapp"
  fi
}

# Run the SUT with CWD inside $REPO. Sets RC, OUT (stdout only).
RC=0
OUT=""
run_sut() {
  local prev
  prev=$(pwd)
  cd "$REPO"
  set +e
  OUT=$("$SUT" "$@" 2>/dev/null)
  RC=$?
  set -e
  cd "$prev"
}

# ---------------------------------------------------------------------------
# Test 1 (positive control): a feature branch names its dirty app.
# ---------------------------------------------------------------------------
echo "Test 1: branch shape names the dirty app"
make_repo
run_sut
assert_eq "branch: exit 0" "0" "$RC"
assert_eq "branch: names myapp" "myapp" "$OUT"

# ---------------------------------------------------------------------------
# Test 2 (THE FIX): main-push shape names the dirty app.
#
# The `assert_eq "... old three-dot range was empty"` line below IS the bug
# reproduction: it shows the expression this script used to carry seeing
# nothing at all in exactly this state, while the script now names the app.
# ---------------------------------------------------------------------------
echo "Test 2: main-push shape names the dirty app"
make_repo at-tip
OLD_RANGE=$(git -C "$REPO" diff --name-only 'refs/remotes/origin/main...HEAD')  # diff-base-ok: the reproduction: asserts the old vacuous range sees nothing
assert_eq "main-push: the old three-dot range was empty" "" "$OLD_RANGE"
run_sut
assert_eq "main-push: exit 0" "0" "$RC"
assert_eq "main-push: names myapp" "myapp" "$OUT"

# ---------------------------------------------------------------------------
# Test 3: an explicit --base keeps its old meaning — plain merge-base
# semantics, and NOT the --at-remote-tip first-parent fallback.
#
# The resolved value is merge-base(BASE, HEAD): exactly the old side of the
# three-dot range this replaces. run-all-cleanup-preview.sh:13 passes
# --base HEAD~1; run-all-prod-deploy-smoke.sh:20 passes the last-prod-deploy
# tag.
# ---------------------------------------------------------------------------
echo "Test 3: explicit --base is honoured"
make_repo
run_sut --base HEAD~1
assert_eq "explicit base: exit 0" "0" "$RC"
assert_eq "explicit base: names myapp" "myapp" "$OUT"

# ---------------------------------------------------------------------------
# Test 3b (THE PRODUCTION-DEPLOY GUARD): --base == HEAD is a no-op, not HEAD^1.
#
# run-all-prod-deploy-smoke.sh:20 passes the `last-prod-deploy` tag as --base.
# On a re-run with nothing new landed, that tag IS HEAD, and the only correct
# answer is an empty change set: there is nothing to deploy. Routing the
# explicit base through --at-remote-tip first-parent silently rewrote the base
# to HEAD^1 and named the last commit's apps — a REDEPLOY TO PRODUCTION of work
# already deployed, triggered by a re-run.
#
# This must be an empty result and exit 0, not a fallback and not an error.
# ---------------------------------------------------------------------------
echo "Test 3b: --base equal to HEAD yields an empty change set, not HEAD^1"
make_repo at-tip
run_sut --base HEAD
assert_eq "base==HEAD: exit 0" "0" "$RC"
assert_eq "base==HEAD: names no app" "" "$OUT"
# A tag spelling of the same state — the literal shape the deploy script uses.
git -C "$REPO" tag last-prod-deploy HEAD
run_sut --base last-prod-deploy
assert_eq "base==HEAD (tag): exit 0" "0" "$RC"
assert_eq "base==HEAD (tag): names no app" "" "$OUT"

# ---------------------------------------------------------------------------
# Test 3c: an explicit base AHEAD of HEAD is also a no-op, not a reverse diff.
#
# merge-base(BASE, HEAD) == HEAD here, so the range is empty. Diffing the two
# commits directly would name the files the newer commits touched and deploy
# BACKWARDS; first-parent would deploy the last commit again.
# ---------------------------------------------------------------------------
echo "Test 3c: an explicit base ahead of HEAD yields an empty change set"
make_repo at-tip
AHEAD_HEAD=$(git -C "$REPO" rev-parse HEAD)
printf 'export const x = 3;\n' > "$REPO/myapp/src/index.ts"
git -C "$REPO" add -A
git -C "$REPO" commit -q -m "landed after this checkout"
git -C "$REPO" tag last-prod-deploy HEAD
git -C "$REPO" checkout -q "$AHEAD_HEAD"
run_sut --base last-prod-deploy
assert_eq "base ahead of HEAD: exit 0" "0" "$RC"
assert_eq "base ahead of HEAD: names no app" "" "$OUT"

# ---------------------------------------------------------------------------
# Test 3d: an explicit base that shares no history with HEAD is a hard error,
# not an empty "nothing to do".
# ---------------------------------------------------------------------------
echo "Test 3d: an unrelated explicit base errors rather than reporting nothing"
make_repo
git -C "$REPO" checkout -q --orphan orphan-base
git -C "$REPO" rm -q -rf . >/dev/null 2>&1 || true
printf 'orphan\n' > "$REPO/ORPHAN"
git -C "$REPO" add ORPHAN
git -C "$REPO" commit -q -m "orphan root"
ORPHAN_SHA=$(git -C "$REPO" rev-parse HEAD)
git -C "$REPO" checkout -q feature
run_sut --base "$ORPHAN_SHA"
[ "$RC" -ne 0 ] && _rc=nonzero || _rc=zero
assert_eq "unrelated base: exit non-zero" "nonzero" "$_rc"
assert_eq "unrelated base: stdout is empty" "" "$OUT"

# A base that does not resolve at all is likewise fatal.
run_sut --base no-such-ref-at-all
[ "$RC" -ne 0 ] && _rc=nonzero || _rc=zero
assert_eq "unresolvable base: exit non-zero" "nonzero" "$_rc"
assert_eq "unresolvable base: stdout is empty" "" "$OUT"

# --all short-circuits before any diff and must stay unaffected.
run_sut --all
assert_eq "--all: exit 0" "0" "$RC"
assert_eq "--all: lists every workspace" "myapp" "$OUT"

# ---------------------------------------------------------------------------
# Test 4: an unresolvable baseline is a hard error, not an empty result.
#
# This is the swallowed-exit-code guard. get-changed-apps.sh assigns the
# helper's stdout in a plain assignment under `set -e`, so the helper's non-zero
# exit propagates. Before, an unresolvable origin/main here would have surfaced
# as "no dirty apps" — indistinguishable from a clean tree.
# ---------------------------------------------------------------------------
echo "Test 4: unresolvable baseline exits non-zero rather than printing nothing"
make_repo
git -C "$REPO" update-ref -d refs/remotes/origin/main
run_sut
[ "$RC" -ne 0 ] && _rc=nonzero || _rc=zero
assert_eq "no origin/main: exit non-zero" "nonzero" "$_rc"
assert_eq "no origin/main: stdout is empty" "" "$OUT"

report_results
