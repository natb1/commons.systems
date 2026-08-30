#!/usr/bin/env bash
# Tests for run-typecheck.sh.
# Builds ephemeral git repos with a stub `tsc` to validate the
# baseline/HEAD comparison logic without depending on a real
# typescript install.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
source "$SCRIPT_DIR/test-helpers.sh"
SUT="$SCRIPT_DIR/run-typecheck.sh"

TMP_ROOT=""
cleanup() { [ -n "${TMP_ROOT:-}" ] && rm -rf "$TMP_ROOT"; }
trap cleanup EXIT INT TERM

# A "dirty" workspace contains the marker line DIRTY_TYPECHECK_MARKER, which the
# stub `tsc` greps for and exits 1 on. "clean" workspaces compile fine.
write_state() {
  local state="$1" path="$2"
  if [ "$state" = "clean" ]; then
    echo "export const ok = 1;" > "$path"
  else
    echo "DIRTY_TYPECHECK_MARKER" > "$path"
  fi
}

# Build a fake repo at $REPO with one workspace ($1), an origin/main commit in
# state $2, and a HEAD commit in state $3. States are "clean" or "dirty".
make_repo() {
  local ws="$1" baseline_state="$2" head_state="$3"
  REPO=$(mktemp -d "$TMP_ROOT/repo.XXXXXX")
  BARE=$(mktemp -d "$TMP_ROOT/bare.XXXXXX")

  git -C "$BARE" init --bare --quiet --initial-branch=main

  git -C "$REPO" init --quiet --initial-branch=main
  git -C "$REPO" config user.email "test@example.com"
  git -C "$REPO" config user.name "Test User"
  git -C "$REPO" remote add origin "$BARE"

  cat > "$REPO/package.json" <<JSON
{
  "name": "test-repo",
  "private": true,
  "workspaces": ["$ws"]
}
JSON

  mkdir -p "$REPO/$ws/src"
  cat > "$REPO/$ws/package.json" <<JSON
{ "name": "@commons-systems/$ws", "version": "0.0.0", "private": true }
JSON
  cat > "$REPO/$ws/tsconfig.json" <<'JSON'
{ "include": ["src"] }
JSON

  write_state "$baseline_state" "$REPO/$ws/src/index.ts"
  git -C "$REPO" add -A
  git -C "$REPO" commit --quiet -m "baseline"
  git -C "$REPO" push --quiet origin main

  git -C "$REPO" checkout --quiet -b feature
  if [ "$head_state" != "$baseline_state" ]; then
    write_state "$head_state" "$REPO/$ws/src/index.ts"
    git -C "$REPO" add -A
    git -C "$REPO" commit --quiet -m "head"
  else
    # No-op commit so the test runs against a non-main branch like CI does.
    echo "" >> "$REPO/$ws/src/index.ts"
    git -C "$REPO" add -A
    git -C "$REPO" commit --quiet -m "head (no-op)"
  fi

  git -C "$REPO" fetch --quiet origin main
}

# Stub `npx tsc` and short-circuit `ensure_deps` (via pre-populated node_modules)
# so the SUT can run without a real typescript install.
make_shims() {
  local repo="$1"
  SHIM_BIN=$(mktemp -d "$TMP_ROOT/bin.XXXXXX")

  # npx shim — only handles `npx tsc --noEmit --project <dir>`.
  cat > "$SHIM_BIN/npx" <<'NPX'
#!/usr/bin/env bash
# Expect: npx tsc --noEmit --project <dir>
if [ "$1" != "tsc" ]; then
  echo "npx-stub: only tsc supported (got: $*)" >&2
  exit 2
fi
shift
project=""
while [ $# -gt 0 ]; do
  case "$1" in
    --project) project="$2"; shift 2 ;;
    --noEmit) shift ;;
    *) shift ;;
  esac
done
if [ -z "$project" ]; then
  echo "npx-stub: missing --project" >&2
  exit 2
fi
if grep -rqF DIRTY_TYPECHECK_MARKER "$project" 2>/dev/null; then
  echo "tsc-stub: $project has a typecheck error" >&2
  exit 1
fi
exit 0
NPX
  chmod +x "$SHIM_BIN/npx"

  # Make ensure_deps a no-op by pre-creating node_modules.
  mkdir -p "$repo/node_modules"
}

# Run the SUT against $REPO with shims on PATH.
# Sets globals: RC, OUT. Runs in a subshell-free `cd` to keep these in scope.
RC=0
OUT=""
run_sut() {
  local prev_dir
  prev_dir=$(pwd)
  cd "$REPO"
  set +e
  OUT=$(PATH="$SHIM_BIN:$PATH" "$SUT" "$@" 2>&1)
  RC=$?
  set -e
  cd "$prev_dir"
}

TMP_ROOT=$(mktemp -d)

# --- Test 1: clean baseline + clean HEAD ---
echo "Test 1: clean baseline + clean HEAD -> exits 0"
make_repo ws clean clean
make_shims "$REPO"
run_sut
assert_eq "clean/clean: exit 0" "0" "$RC"
assert_contains "clean/clean: workspace reported as passing" "ws: typecheck passed" "$OUT"
assert_eq "clean/clean: working tree clean after run" "" "$(git -C "$REPO" status --porcelain)"

# --- Test 2: clean baseline + dirty HEAD (regression) ---
echo "Test 2: clean baseline + dirty HEAD -> regression detected"
make_repo ws clean dirty
make_shims "$REPO"
run_sut
[ "$RC" -ne 0 ] && _t2_rc=nonzero || _t2_rc=zero
assert_eq "clean/dirty: exit non-zero" "nonzero" "$_t2_rc"
assert_contains "clean/dirty: regression names workspace" "ws" "$OUT"
assert_contains "clean/dirty: regression summary printed" "Typecheck regressions" "$OUT"
assert_eq "clean/dirty: working tree clean after failing run" "" "$(git -C "$REPO" status --porcelain)"

# --- Test 3: dirty baseline + dirty HEAD (skip) ---
echo "Test 3: dirty baseline + dirty HEAD -> skipped"
make_repo ws dirty dirty
make_shims "$REPO"
run_sut
assert_eq "dirty/dirty: exit 0" "0" "$RC"
assert_contains "dirty/dirty: workspace marked skipping" "skipping" "$OUT"
assert_contains "dirty/dirty: mentions pre-existing" "pre-existing" "$OUT"
assert_eq "dirty/dirty: working tree clean" "" "$(git -C "$REPO" status --porcelain)"

# --- Test 4: working-tree-dirty guard ---
echo "Test 4: dirty working tree -> bail before mutation"
make_repo ws clean clean
make_shims "$REPO"
# Seed an unstaged change (the workspace src is tracked, so a write makes it dirty).
echo "// unstaged user edit" >> "$REPO/ws/src/index.ts"
DIRTY_BEFORE=$(git -C "$REPO" status --porcelain)
run_sut
[ "$RC" -ne 0 ] && _t4_rc=nonzero || _t4_rc=zero
assert_eq "dirty-tree: exit non-zero" "nonzero" "$_t4_rc"
assert_contains "dirty-tree: error mentions uncommitted" "uncommitted" "$OUT"
DIRTY_AFTER=$(git -C "$REPO" status --porcelain)
assert_eq "dirty-tree: user changes preserved" "$DIRTY_BEFORE" "$DIRTY_AFTER"

# --- Test 5: cleanup invariant after pass and fail ---
echo "Test 5: cleanup invariant"
# Pass case
make_repo ws clean clean
make_shims "$REPO"
run_sut
assert_eq "cleanup/pass: working tree clean" "" "$(git -C "$REPO" status --porcelain)"
# Fail case
make_repo ws clean dirty
make_shims "$REPO"
run_sut
assert_eq "cleanup/fail: working tree clean" "" "$(git -C "$REPO" status --porcelain)"

# --- Test 6: deletion branch — origin/main has a file HEAD deletes (#2607) ---
# The baseline swap `git checkout origin/main -- <ws>` reintroduces the
# origin/main-only file (staged A, on disk). A single-step `git checkout HEAD
# -- <ws>` restore cannot delete it (HEAD has no such path), leaving the file
# resurrected. The fix restores via reset->checkout->clean. This case needs
# inline setup because make_repo builds only src/index.ts.
echo "Test 6: deletion branch -> deleted file not resurrected after baseline swap"
REPO=$(mktemp -d "$TMP_ROOT/repo.XXXXXX")
BARE=$(mktemp -d "$TMP_ROOT/bare.XXXXXX")
git -C "$BARE" init --bare --quiet --initial-branch=main
git -C "$REPO" init --quiet --initial-branch=main
git -C "$REPO" config user.email "test@example.com"
git -C "$REPO" config user.name "Test User"
git -C "$REPO" remote add origin "$BARE"
cat > "$REPO/package.json" <<JSON
{
  "name": "test-repo",
  "private": true,
  "workspaces": ["ws"]
}
JSON
mkdir -p "$REPO/ws/src"
cat > "$REPO/ws/package.json" <<JSON
{ "name": "@commons-systems/ws", "version": "0.0.0", "private": true }
JSON
cat > "$REPO/ws/tsconfig.json" <<'JSON'
{ "include": ["src"] }
JSON
# origin/main carries both index.ts and extra.ts, both clean.
write_state clean "$REPO/ws/src/index.ts"
write_state clean "$REPO/ws/src/extra.ts"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "baseline (index + extra)"
git -C "$REPO" push --quiet origin main
# feature HEAD deletes extra.ts, so HEAD's tree lacks it.
git -C "$REPO" checkout --quiet -b feature
git -C "$REPO" rm --quiet "ws/src/extra.ts"
git -C "$REPO" commit --quiet -m "head (rm extra.ts)"
git -C "$REPO" fetch --quiet origin main
make_shims "$REPO"
run_sut
assert_eq "deletion: exit 0" "0" "$RC"
assert_eq "deletion: working tree clean after run (nothing resurrected/staged)" "" "$(git -C "$REPO" status --porcelain)"
[ ! -f "$REPO/ws/src/extra.ts" ] && _t6_extra=absent || _t6_extra=present
assert_eq "deletion: deleted file not left on disk" "absent" "$_t6_extra"

# --- Test 7: addition branch — HEAD adds a file origin/main does not have -----
# Mirror image of Test 6. `git checkout origin/main -- <ws>` reverts the files
# origin/main has but cannot delete one it lacks, so a branch-new file used to
# survive into the baseline probe at HEAD content while everything it depends on
# reverted. The baseline then failed on the branch's own new code and the whole
# workspace was skipped as "pre-existing errors" — so ANY branch that added a
# file silently disabled typechecking for that workspace, and a real error in it
# was reported as a pass. Here the added file is the one carrying the error: it
# must surface as a regression, not a skip.
echo "Test 7: addition branch -> error in a branch-new file is detected, not skipped"
make_repo ws clean clean
write_state dirty "$REPO/ws/src/added.ts"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "head (add added.ts carrying the error)"
make_shims "$REPO"
run_sut
[ "$RC" -ne 0 ] && _t7_rc=nonzero || _t7_rc=zero
assert_eq "addition: exit non-zero" "nonzero" "$_t7_rc"
assert_contains "addition: reported as a regression" "Typecheck regressions" "$OUT"
case "$OUT" in
  *pre-existing*) _t7_skip=skipped ;;
  *) _t7_skip=not-skipped ;;
esac
assert_eq "addition: baseline not poisoned by the added file" "not-skipped" "$_t7_skip"
assert_eq "addition: working tree clean after run" "" "$(git -C "$REPO" status --porcelain)"
[ -f "$REPO/ws/src/added.ts" ] && _t7_added=present || _t7_added=absent
assert_eq "addition: added file restored after baseline probe" "present" "$_t7_added"

# --- Test 8: --app with a non-existent workspace dir ---
# Regression guard. `--app` takes a repo-root-relative workspace DIRECTORY, but
# the natural typo is the bare package name (`--app intentionsutil` instead of
# `--app packages/intentionsutil`). A non-existent dir has no tsconfig.json, so
# it used to land in the "no tsconfig.json — skipping (non-TS workspace)" branch
# and the run exited 0 reporting a benign non-TS skip — indistinguishable from a
# real pass, silently verifying nothing about the workspace the caller named.
echo "Test 8: --app with a non-existent dir -> hard error, not a silent skip"
make_repo ws clean clean
make_shims "$REPO"
run_sut --app definitely-not-a-workspace
[ "$RC" -ne 0 ] && _t8_rc=nonzero || _t8_rc=zero
assert_eq "bad --app: exit non-zero" "nonzero" "$_t8_rc"
assert_contains "bad --app: error names the bad value" "definitely-not-a-workspace" "$OUT"
assert_contains "bad --app: error explains the expected form" "repo-root-relative" "$OUT"
case "$OUT" in
  *"non-TS workspace"*) _t8_silent=silently-skipped ;;
  *) _t8_silent=errored ;;
esac
assert_eq "bad --app: not misreported as a non-TS workspace" "errored" "$_t8_silent"

# --- Test 9: --app with a real workspace dir still works ---
# Pins the guard to rejecting only paths that do not exist: the valid explicit
# form must still run a full baseline-vs-HEAD check.
echo "Test 9: --app with a real dir -> still typechecks normally"
make_repo ws clean clean
make_shims "$REPO"
run_sut --app ws
assert_eq "good --app: exit 0" "0" "$RC"
assert_contains "good --app: workspace reported as passing" "ws: typecheck passed" "$OUT"

# --- Test 10: HEAD is the remote tip (a push to `main`) ---------------------
# The vacuous-baseline case, for run-typecheck.sh's OWN baseline rather than
# for its changed-file list. On a push to `main`, actions/checkout leaves
# refs/remotes/origin/main pointing AT the pushed commit. A baseline spelled
# `git checkout origin/main -- <ws>` then writes back exactly what is already on
# disk, so the "baseline" compile is a second compile of HEAD and the two agree
# by construction: a real regression compiles dirty in BOTH probes, gets
# classified "pre-existing typecheck errors", and the run exits 0 having
# reported a skip. Routing the baseline through resolve-diff-base.sh
# --at-remote-tip first-parent compares against HEAD^1 instead — what the tree
# looked like before this push — so the regression surfaces.
#
# Note this test stays on `main` with origin/main == HEAD; every other test in
# this file runs from a feature branch, where the resolved base is the ordinary
# merge-base and behavior is unchanged.
echo "Test 10: HEAD == origin/main (push to main) -> regression detected, not skipped"
REPO=$(mktemp -d "$TMP_ROOT/repo.XXXXXX")
BARE=$(mktemp -d "$TMP_ROOT/bare.XXXXXX")
git -C "$BARE" init --bare --quiet --initial-branch=main
git -C "$REPO" init --quiet --initial-branch=main
git -C "$REPO" config user.email "test@example.com"
git -C "$REPO" config user.name "Test User"
git -C "$REPO" remote add origin "$BARE"
cat > "$REPO/package.json" <<JSON
{
  "name": "test-repo",
  "private": true,
  "workspaces": ["ws"]
}
JSON
mkdir -p "$REPO/ws/src"
cat > "$REPO/ws/package.json" <<JSON
{ "name": "@commons-systems/ws", "version": "0.0.0", "private": true }
JSON
cat > "$REPO/ws/tsconfig.json" <<'JSON'
{ "include": ["src"] }
JSON
# Parent commit: clean. Then a second commit on `main` introduces the error and
# is pushed, so origin/main == HEAD == the breaking commit.
write_state clean "$REPO/ws/src/index.ts"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "clean parent"
write_state dirty "$REPO/ws/src/index.ts"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "the regression, pushed straight to main"
git -C "$REPO" push --quiet origin main
git -C "$REPO" fetch --quiet origin main
# Pin the precondition: without it this test could pass for the wrong reason.
assert_eq "on-main: origin/main is exactly HEAD" \
  "$(git -C "$REPO" rev-parse HEAD)" "$(git -C "$REPO" rev-parse origin/main)"
make_shims "$REPO"
run_sut
[ "$RC" -ne 0 ] && _t10_rc=nonzero || _t10_rc=zero
assert_eq "on-main: exit non-zero" "nonzero" "$_t10_rc"
assert_contains "on-main: reported as a regression" "Typecheck regressions" "$OUT"
case "$OUT" in
  *pre-existing*) _t10_skip=skipped ;;
  *) _t10_skip=not-skipped ;;
esac
assert_eq "on-main: not misreported as a pre-existing baseline failure" \
  "not-skipped" "$_t10_skip"
assert_eq "on-main: working tree clean after run" "" "$(git -C "$REPO" status --porcelain)"

# --- Test 11: on-main baseline that is ITSELF broken still skips ------------
# The complement of Test 10, so the fix is not read as "always report a
# regression on main". When the parent commit was already broken, the push did
# not introduce the failure and the skip is the correct answer — the same
# contract Test 3 pins on a branch.
echo "Test 11: HEAD == origin/main with a broken parent -> still a skip, not a regression"
REPO=$(mktemp -d "$TMP_ROOT/repo.XXXXXX")
BARE=$(mktemp -d "$TMP_ROOT/bare.XXXXXX")
git -C "$BARE" init --bare --quiet --initial-branch=main
git -C "$REPO" init --quiet --initial-branch=main
git -C "$REPO" config user.email "test@example.com"
git -C "$REPO" config user.name "Test User"
git -C "$REPO" remote add origin "$BARE"
cat > "$REPO/package.json" <<JSON
{
  "name": "test-repo",
  "private": true,
  "workspaces": ["ws"]
}
JSON
mkdir -p "$REPO/ws/src"
cat > "$REPO/ws/package.json" <<JSON
{ "name": "@commons-systems/ws", "version": "0.0.0", "private": true }
JSON
cat > "$REPO/ws/tsconfig.json" <<'JSON'
{ "include": ["src"] }
JSON
write_state dirty "$REPO/ws/src/index.ts"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "already-broken parent"
echo "// unrelated second commit" >> "$REPO/ws/src/index.ts"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "unrelated change, pushed to main"
git -C "$REPO" push --quiet origin main
git -C "$REPO" fetch --quiet origin main
make_shims "$REPO"
run_sut
assert_eq "on-main broken parent: exit 0" "0" "$RC"
assert_contains "on-main broken parent: marked skipping" "skipping" "$OUT"
assert_contains "on-main broken parent: mentions pre-existing" "pre-existing" "$OUT"
assert_eq "on-main broken parent: working tree clean" "" "$(git -C "$REPO" status --porcelain)"

report_results
