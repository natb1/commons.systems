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
  OUT=$(PATH="$SHIM_BIN:$PATH" "$SUT" 2>&1)
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

report_results
