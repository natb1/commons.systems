#!/usr/bin/env bash
# Test suite for check-test-integrity.sh
# Usage: ./test-check-test-integrity.sh
#
# Creates hermetic temp git repos to drive the detection script with synthetic
# diffs. Each case asserts the expected exit code and, where relevant, that
# stderr contains the remediation text.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
CHECK_SCRIPT="$SCRIPT_DIR/check-test-integrity.sh"

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

# make_temp_repo — initialise a hermetic git repo for one test case.
# Sets up:
#   - a main branch with one commit (a non-test source file)
#   - refs/remotes/origin/main pointing at that commit
#   - a feature branch checked out, ready for the test mutation
# Prints the repo path.
make_temp_repo() {
  local tmpdir
  tmpdir=$(mktemp -d)
  TMPDIRS+=("$tmpdir")

  git -C "$tmpdir" init -q -b main
  git -C "$tmpdir" config user.email "test@test.local"
  git -C "$tmpdir" config user.name "Test"

  # Initial commit on main with a non-test file.
  printf 'export const x = 1;\n' > "$tmpdir/src.ts"
  git -C "$tmpdir" add src.ts
  git -C "$tmpdir" commit -q -m "initial"

  # Set refs/remotes/origin/main so 'git diff origin/main...HEAD' resolves.
  local main_sha
  main_sha=$(git -C "$tmpdir" rev-parse HEAD)
  git -C "$tmpdir" update-ref refs/remotes/origin/main "$main_sha"

  # Create and check out a feature branch.
  git -C "$tmpdir" checkout -q -b feature

  printf '%s\n' "$tmpdir"
}

# run_check REPO_DIR [REPO_ROOT_ARG] — run check-test-integrity.sh against
# REPO_DIR. Sets RC and STDERR for assertion helpers.
#
# REPO_ROOT_ARG is what gets passed to --repo-root, defaulting to REPO_DIR (so
# every existing call is unchanged). Cases (y) and (z) pass a DIFFERENT value —
# a subdirectory of the repo, and a path in no repo at all — because the flag's
# argument and the tree it must resolve to are exactly what those cases test.
#
# --repo-root is REQUIRED here, not optional politeness: $CHECK_SCRIPT lives in
# THIS repo while the fixture is a temp repo elsewhere, and the script refuses
# to guess between the two. That refusal is the point — running one checkout's
# copy against another used to silently diff the wrong tree, come up clean, and
# pass. CWD is still set to the repo so nothing that reads it can drift.
#
# STDERR is the gate's OWN stderr: resolve-diff-base.sh's one-line provenance
# record is split off into BASE_LINE first. Both are asserted on — STDERR by
# assert_stderr_empty (the gate stayed silent) and BASE_LINE by
# assert_base_source (the baseline was resolved, and by which route) — so
# nothing is being dropped to keep a case green; the two claims are just
# separated because they are different claims.
RC=0
STDERR=""
BASE_LINE=""
run_check() {
  local repo="$1" root="${2:-$1}" raw
  RC=0
  STDERR=""
  BASE_LINE=""
  raw=$(cd "$repo" && "$CHECK_SCRIPT" --repo-root "$root" 2>&1 >/dev/null) || RC=$?
  # Split on the PROVENANCE line specifically (`base=` is in it), not on the
  # helper's name: its diagnostics carry the same prefix, and filing those into
  # BASE_LINE would silently hide a hard failure from every stderr assertion.
  BASE_LINE=$(printf '%s\n' "$raw" | grep '^resolve-diff-base: base=' || true)
  STDERR=$(printf '%s\n' "$raw" | grep -v '^resolve-diff-base: base=' || true)
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
  fi
}

# assert_stderr_contains PATTERN DESCRIPTION
#
# A quoted `[[ == *…* ]]` match, never `printf "$STDERR" | grep -qF`. This file
# runs under `set -o pipefail`, and `grep -q` exits the instant it matches — so
# on a $STDERR big enough that printf is still writing when that happens, the
# writer takes SIGPIPE, the pipeline reports 141, and a MATCHING assertion is
# reported as a FAILURE. check-test-integrity.sh's violation block prints one
# line per offending file, so a large removal grows $STDERR past the 64 KiB pipe
# buffer. Quoting makes the needle literal exactly as `grep -F` did; this is the
# same spelling test-helpers.sh's shared assert_contains already uses, for the
# same reason.
assert_stderr_contains() {
  local pattern="$1" desc="$2"
  TOTAL=$((TOTAL + 1))
  if [[ "$STDERR" == *"$pattern"* ]]; then
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

# assert_stderr_empty DESCRIPTION
assert_stderr_empty() {
  local desc="$1"
  TOTAL=$((TOTAL + 1))
  if [ -z "$STDERR" ]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: $desc — expected silent output, got:"
    printf '%s\n' "$STDERR" | sed 's/^/    /'
  fi
}

# assert_base_source EXPECTED_SOURCE DESCRIPTION — assert the baseline was
# resolved, and by the expected route. "merge-base" is the ordinary branch
# case; "first-parent" is the push-to-main shape, where the whole point is
# that a baseline exists at all.
assert_base_source() {
  local expected="$1" desc="$2"
  TOTAL=$((TOTAL + 1))
  case "$BASE_LINE" in
    *"source=$expected"*)
      PASS=$((PASS + 1))
      ;;
    *)
      FAIL=$((FAIL + 1))
      echo "FAIL: $desc — expected source=$expected, got: ${BASE_LINE:-<no provenance line>}"
      ;;
  esac
}

# ---------------------------------------------------------------------------
# Case (a): Playwright runtime-conditional skip ADDED — must NOT flag.
#
# test.skip(testInfo.project.name !== "desktop", "desktop only") has an
# expression (not a string literal) as the first arg — the char after '(' is
# 't', not a quote. Signal 1 must NOT match it.
# ---------------------------------------------------------------------------
echo "--- case (a): Playwright conditional skip → no flag ---"
REPO=$(make_temp_repo)

cat > "$REPO/foo.spec.ts" <<'EOF'
import { test } from '@playwright/test';
test('desktop only', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop only');
  await page.goto('/');
});
EOF
git -C "$REPO" add foo.spec.ts
git -C "$REPO" commit -q -m "add conditional skip"

run_check "$REPO"
assert_exit 0 "(a) Playwright conditional skip: exit 0"
assert_stderr_empty "(a) Playwright conditional skip: no output"

# ---------------------------------------------------------------------------
# Case (b): it.skip conversion (was it("title",…)) in *.test.ts — must flag.
#
# The diff shows:
#   - it("should do thing", () => { … })
#   + it.skip("should do thing", () => { … })
# Signal 1: net +1 disabling skip added → flag.
# Signal 2: net -1 declaration removed → also flag (skip-conversion pattern).
# ---------------------------------------------------------------------------
echo "--- case (b): it.skip conversion in *.test.ts → flag ---"
REPO=$(make_temp_repo)

cat > "$REPO/widget.test.ts" <<'EOF'
import { it } from 'vitest';
it('should do thing', () => {
  expect(1).toBe(1);
});
EOF
git -C "$REPO" add widget.test.ts
git -C "$REPO" commit -q -m "add test"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2

cat > "$REPO/widget.test.ts" <<'EOF'
import { it } from 'vitest';
it.skip('should do thing', () => {
  expect(1).toBe(1);
});
EOF
git -C "$REPO" add widget.test.ts
git -C "$REPO" commit -q -m "disable test"

run_check "$REPO"
assert_exit 1 "(b) it.skip conversion: exit 1"
assert_stderr_contains "Test-integrity violation" "(b) it.skip conversion: remediation text present"
assert_stderr_contains "RESTORE" "(b) it.skip conversion: steers toward restore"

# ---------------------------------------------------------------------------
# Case (b2): describe.skip( ADDED (Signal 1, Pattern A) → flag.
#
# A brand-new disabling skip line is added on the feature branch. SKIP_NET = +1
# (Pattern A: describe.skip( with a string-literal first arg) → Signal 1 fires.
# The added line is also a fresh DECL add, so Signal 2 stays clean — this case
# isolates the Pattern A `describe.skip` variant.
# ---------------------------------------------------------------------------
echo "--- case (b2): describe.skip( added → flag (Signal 1) ---"
REPO=$(make_temp_repo)

cat > "$REPO/group.test.ts" <<'EOF'
import { describe, it, expect } from 'vitest';
describe('group', () => {
  it('works', () => { expect(1).toBe(1); });
});
EOF
git -C "$REPO" add group.test.ts
git -C "$REPO" commit -q -m "add test"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2

cat > "$REPO/group.test.ts" <<'EOF'
import { describe, it, expect } from 'vitest';
describe('group', () => {
  it('works', () => { expect(1).toBe(1); });
});
describe.skip('disabled group', () => {
  it('does nothing', () => { expect(1).toBe(1); });
});
EOF
git -C "$REPO" add group.test.ts
git -C "$REPO" commit -q -m "add describe.skip"

run_check "$REPO"
assert_exit 1 "(b2) describe.skip added: exit 1"
assert_stderr_contains "Test-integrity violation" "(b2) describe.skip added: remediation text present"
assert_stderr_contains "Signal 1" "(b2) describe.skip added: Signal 1 fires"

# ---------------------------------------------------------------------------
# Case (b3): test.skip( with a string literal ADDED (Signal 1, Pattern A) → flag.
#
# A brand-new test.skip("title", …) line is added. The char after '(' is a
# quote, so Pattern A matches (distinct from the Playwright conditional skip in
# case (a)). SKIP_NET = +1 → Signal 1 fires.
# ---------------------------------------------------------------------------
echo "--- case (b3): test.skip( string-literal added → flag (Signal 1) ---"
REPO=$(make_temp_repo)

cat > "$REPO/feature.spec.ts" <<'EOF'
import { test, expect } from '@playwright/test';
test('works', async ({ page }) => { await page.goto('/'); });
EOF
git -C "$REPO" add feature.spec.ts
git -C "$REPO" commit -q -m "add test"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2

cat > "$REPO/feature.spec.ts" <<'EOF'
import { test, expect } from '@playwright/test';
test('works', async ({ page }) => { await page.goto('/'); });
test.skip('disabled case', async ({ page }) => { await page.goto('/x'); });
EOF
git -C "$REPO" add feature.spec.ts
git -C "$REPO" commit -q -m "add test.skip"

run_check "$REPO"
assert_exit 1 "(b3) test.skip added: exit 1"
assert_stderr_contains "Test-integrity violation" "(b3) test.skip added: remediation text present"
assert_stderr_contains "Signal 1" "(b3) test.skip added: Signal 1 fires"

# ---------------------------------------------------------------------------
# Case (b4): xit( ADDED (Signal 1, Pattern B) → flag.
#
# A brand-new xit(…) line is added. Pattern B matches (xit|xdescribe)( without
# needing a quote. xit( is NOT matched by the Signal 2 DECL pattern (the word
# boundary precedes the leading 'x'), so only Signal 1 fires.
# ---------------------------------------------------------------------------
echo "--- case (b4): xit( added → flag (Signal 1) ---"
REPO=$(make_temp_repo)

cat > "$REPO/alpha.test.ts" <<'EOF'
import { it, expect } from 'vitest';
it('works', () => { expect(1).toBe(1); });
EOF
git -C "$REPO" add alpha.test.ts
git -C "$REPO" commit -q -m "add test"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2

cat > "$REPO/alpha.test.ts" <<'EOF'
import { it, expect } from 'vitest';
it('works', () => { expect(1).toBe(1); });
xit('disabled', () => { expect(1).toBe(1); });
EOF
git -C "$REPO" add alpha.test.ts
git -C "$REPO" commit -q -m "add xit"

run_check "$REPO"
assert_exit 1 "(b4) xit added: exit 1"
assert_stderr_contains "Test-integrity violation" "(b4) xit added: remediation text present"
assert_stderr_contains "Signal 1" "(b4) xit added: Signal 1 fires"

# ---------------------------------------------------------------------------
# Case (b5): xdescribe( ADDED (Signal 1, Pattern B) → flag.
#
# A brand-new xdescribe(…) block is added. Pattern B matches without a quote.
# xdescribe( is NOT matched by the Signal 2 DECL pattern, so only Signal 1 fires.
# ---------------------------------------------------------------------------
echo "--- case (b5): xdescribe( added → flag (Signal 1) ---"
REPO=$(make_temp_repo)

cat > "$REPO/beta.test.ts" <<'EOF'
import { describe, it, expect } from 'vitest';
describe('beta', () => {
  it('works', () => { expect(1).toBe(1); });
});
EOF
git -C "$REPO" add beta.test.ts
git -C "$REPO" commit -q -m "add test"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2

cat > "$REPO/beta.test.ts" <<'EOF'
import { describe, it, expect } from 'vitest';
describe('beta', () => {
  it('works', () => { expect(1).toBe(1); });
});
xdescribe('disabled beta', () => {
  it('does nothing', () => { expect(1).toBe(1); });
});
EOF
git -C "$REPO" add beta.test.ts
git -C "$REPO" commit -q -m "add xdescribe"

run_check "$REPO"
assert_exit 1 "(b5) xdescribe added: exit 1"
assert_stderr_contains "Test-integrity violation" "(b5) xdescribe added: remediation text present"
assert_stderr_contains "Signal 1" "(b5) xdescribe added: Signal 1 fires"

# ---------------------------------------------------------------------------
# Case (c): Removed it(/test( declaration (test deleted from a file) → flag.
# ---------------------------------------------------------------------------
echo "--- case (c): removed test declaration → flag ---"
REPO=$(make_temp_repo)

cat > "$REPO/math.test.ts" <<'EOF'
import { it, expect } from 'vitest';
it('adds numbers', () => {
  expect(1 + 1).toBe(2);
});
it('subtracts numbers', () => {
  expect(3 - 1).toBe(2);
});
EOF
git -C "$REPO" add math.test.ts
git -C "$REPO" commit -q -m "add tests"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2

cat > "$REPO/math.test.ts" <<'EOF'
import { it, expect } from 'vitest';
it('adds numbers', () => {
  expect(1 + 1).toBe(2);
});
EOF
git -C "$REPO" add math.test.ts
git -C "$REPO" commit -q -m "remove test"

run_check "$REPO"
assert_exit 1 "(c) removed declaration: exit 1"
assert_stderr_contains "Test-integrity violation" "(c) removed declaration: remediation text present"
assert_stderr_contains "Signal 2" "(c) removed declaration: Signal 2 fires"

# ---------------------------------------------------------------------------
# Case (d): Whole test-file deletion (git rm a *.test.ts) → flag.
# ---------------------------------------------------------------------------
echo "--- case (d): whole test-file deleted → flag ---"
REPO=$(make_temp_repo)

cat > "$REPO/old.test.ts" <<'EOF'
import { it, expect } from 'vitest';
it('old test', () => {
  expect(true).toBe(true);
});
EOF
git -C "$REPO" add old.test.ts
git -C "$REPO" commit -q -m "add old test"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2

git -C "$REPO" rm -q old.test.ts
git -C "$REPO" commit -q -m "delete test file"

run_check "$REPO"
assert_exit 1 "(d) file deleted: exit 1"
assert_stderr_contains "Test-integrity violation" "(d) file deleted: remediation text present"
assert_stderr_contains "Signal 3" "(d) file deleted: Signal 3 fires"
assert_stderr_contains "old.test.ts" "(d) file deleted: filename mentioned in output"

# ---------------------------------------------------------------------------
# Case (e): Test moved between two files (net zero) → NO flag.
#
# Removes `it('moved', …)` from file A, adds the identical line to file B.
# Signal 2 net = 0 → clean.
# ---------------------------------------------------------------------------
echo "--- case (e): test moved between files → no flag ---"
REPO=$(make_temp_repo)

cat > "$REPO/a.test.ts" <<'EOF'
import { it, expect } from 'vitest';
it('moved', () => { expect(1).toBe(1); });
it('stays in a', () => { expect(2).toBe(2); });
EOF
git -C "$REPO" add a.test.ts
git -C "$REPO" commit -q -m "initial tests"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2

cat > "$REPO/a.test.ts" <<'EOF'
import { it, expect } from 'vitest';
it('stays in a', () => { expect(2).toBe(2); });
EOF
cat > "$REPO/b.test.ts" <<'EOF'
import { it, expect } from 'vitest';
it('moved', () => { expect(1).toBe(1); });
EOF
git -C "$REPO" add a.test.ts b.test.ts
git -C "$REPO" commit -q -m "move test to b"

run_check "$REPO"
assert_exit 0 "(e) test moved between files: exit 0"
assert_stderr_empty "(e) test moved between files: no output"

# ---------------------------------------------------------------------------
# Case (f): PR touches only a non-test file → clean exit 0, no output.
#
# This is the MOST IMPORTANT case: exercises the set -e / grep-zero-match
# guards. Every non-test PR hits this path.
# ---------------------------------------------------------------------------
echo "--- case (f): non-test file change only → clean exit 0 ---"
REPO=$(make_temp_repo)

# Add an existing test file on main so the glob can match something if it fails.
cat > "$REPO/existing.test.ts" <<'EOF'
import { it, expect } from 'vitest';
it('existing', () => { expect(true).toBe(true); });
EOF
git -C "$REPO" add existing.test.ts
git -C "$REPO" commit -q -m "add test on main"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2

# Change only a non-test file.
printf 'export const y = 2;\n' > "$REPO/util.ts"
git -C "$REPO" add util.ts
git -C "$REPO" commit -q -m "add util (no test change)"

run_check "$REPO"
assert_exit 0 "(f) non-test change: exit 0"
assert_stderr_empty "(f) non-test change: no output"

# ---------------------------------------------------------------------------
# Case (g): Canonical #2633 import-based co-deletion → exit 0, silent.
#
# cache.ts exports createRenderer (survives) and CachedRangeReader (deleted on
# feature). The test imports BOTH on ONE import line and tests each. Feature:
# delete CachedRangeReader from cache.ts, remove its test, and drop it from the
# test's import line (keep createRenderer + its test). The OLD-minus-NEW import
# set difference nets out the still-imported createRenderer, leaving
# removed-imports = {CachedRangeReader}; that symbol is ABSENT from post-PR
# source ⇒ the file's removed declaration is exempt ⇒ Signal 2 stays clean.
# ---------------------------------------------------------------------------
echo "--- case (g): import co-deletion happy path → exit 0 ---"
REPO=$(make_temp_repo)

cat > "$REPO/cache.ts" <<'EOF'
export const createRenderer = () => 1;
export const CachedRangeReader = () => 2;
EOF
cat > "$REPO/cache.test.ts" <<'EOF'
import { it, expect } from 'vitest';
import { createRenderer, CachedRangeReader } from './cache';
it('createRenderer works', () => { expect(createRenderer()).toBe(1); });
it('CachedRangeReader works', () => { expect(CachedRangeReader()).toBe(2); });
EOF
git -C "$REPO" add cache.ts cache.test.ts
git -C "$REPO" commit -q -m "add cache + tests"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2

cat > "$REPO/cache.ts" <<'EOF'
export const createRenderer = () => 1;
EOF
cat > "$REPO/cache.test.ts" <<'EOF'
import { it, expect } from 'vitest';
import { createRenderer } from './cache';
it('createRenderer works', () => { expect(createRenderer()).toBe(1); });
EOF
git -C "$REPO" add cache.ts cache.test.ts
git -C "$REPO" commit -q -m "remove CachedRangeReader + its test"

run_check "$REPO"
assert_exit 0 "(g) import co-deletion happy path: exit 0"
assert_stderr_empty "(g) import co-deletion happy path: no output"

# ---------------------------------------------------------------------------
# Case (h): Weakening a still-existing symbol's test still fires → exit 1.
#
# widget.ts exports Foo, which STAYS. The test imports Foo and tests it.
# Feature: remove the test and drop Foo from imports, but Foo still exists in
# source. removed-imports = {Foo}; Foo is PRESENT in post-PR source ⇒ NOT
# exempt ⇒ Signal 2 fires on the net declaration removal.
# ---------------------------------------------------------------------------
echo "--- case (h): weakening (symbol survives) → flag (Signal 2) ---"
REPO=$(make_temp_repo)

cat > "$REPO/widget.ts" <<'EOF'
export const Foo = () => 1;
EOF
cat > "$REPO/widget.test.ts" <<'EOF'
import { it, expect } from 'vitest';
import { Foo } from './widget';
it('Foo works', () => { expect(Foo()).toBe(1); });
EOF
git -C "$REPO" add widget.ts widget.test.ts
git -C "$REPO" commit -q -m "add widget + test"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2

cat > "$REPO/widget.test.ts" <<'EOF'
import { it, expect } from 'vitest';
EOF
git -C "$REPO" add widget.test.ts
git -C "$REPO" commit -q -m "remove Foo test (Foo still exists)"

run_check "$REPO"
assert_exit 1 "(h) weakening: exit 1"
assert_stderr_contains "Test-integrity violation" "(h) weakening: remediation text present"
assert_stderr_contains "Signal 2" "(h) weakening: Signal 2 fires"

# ---------------------------------------------------------------------------
# Case (i): Mixed file — one symbol gone, one surviving in the same source file.
#
# mix.ts exports Gone and Survivor. The test imports and tests both. Feature:
# remove BOTH tests, drop BOTH imports, delete Gone from source but KEEP
# Survivor. removed-imports = {Gone, Survivor}; Survivor is still PRESENT ⇒ the
# exemption requires EVERY removed-import symbol absent, so one survivor blocks
# it ⇒ NOT exempt ⇒ Signal 2 fires.
# ---------------------------------------------------------------------------
echo "--- case (i): mixed gone/surviving same file → flag (Signal 2) ---"
REPO=$(make_temp_repo)

cat > "$REPO/mix.ts" <<'EOF'
export const Gone = () => 1;
export const Survivor = () => 2;
EOF
cat > "$REPO/mix.test.ts" <<'EOF'
import { it, expect } from 'vitest';
import { Gone, Survivor } from './mix';
it('Gone works', () => { expect(Gone()).toBe(1); });
it('Survivor works', () => { expect(Survivor()).toBe(2); });
EOF
git -C "$REPO" add mix.ts mix.test.ts
git -C "$REPO" commit -q -m "add mix + tests"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2

cat > "$REPO/mix.ts" <<'EOF'
export const Survivor = () => 2;
EOF
cat > "$REPO/mix.test.ts" <<'EOF'
import { it, expect } from 'vitest';
EOF
git -C "$REPO" add mix.ts mix.test.ts
git -C "$REPO" commit -q -m "remove both tests; Survivor still exists"

run_check "$REPO"
assert_exit 1 "(i) mixed gone/surviving: exit 1"
assert_stderr_contains "Test-integrity violation" "(i) mixed gone/surviving: remediation text present"
assert_stderr_contains "Signal 2" "(i) mixed gone/surviving: Signal 2 fires"

# ---------------------------------------------------------------------------
# Case (j): Vacuous-true guard — same-file helper, no import removed.
#
# The test defines a local helper inline (no import for the tested subject) and
# removes one of two tests exercising it. No import binding is dropped ⇒
# removed-imports = ∅ ⇒ the exemption's empty-set guard refuses to exempt
# (closing the vacuous-true hole) ⇒ Signal 2 fires on the net declaration
# removal.
# ---------------------------------------------------------------------------
echo "--- case (j): vacuous-true / same-file helper → flag (Signal 2) ---"
REPO=$(make_temp_repo)

cat > "$REPO/local.test.ts" <<'EOF'
import { it, expect } from 'vitest';
function localHelper() { return 1; }
it('localHelper a', () => { expect(localHelper()).toBe(1); });
it('localHelper b', () => { expect(localHelper()).toBe(1); });
EOF
git -C "$REPO" add local.test.ts
git -C "$REPO" commit -q -m "add local helper tests"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2

cat > "$REPO/local.test.ts" <<'EOF'
import { it, expect } from 'vitest';
function localHelper() { return 1; }
it('localHelper a', () => { expect(localHelper()).toBe(1); });
EOF
git -C "$REPO" add local.test.ts
git -C "$REPO" commit -q -m "remove one helper test (no import dropped)"

run_check "$REPO"
assert_exit 1 "(j) vacuous-true: exit 1"
assert_stderr_contains "Test-integrity violation" "(j) vacuous-true: remediation text present"
assert_stderr_contains "Signal 2" "(j) vacuous-true: Signal 2 fires"

# ---------------------------------------------------------------------------
# Case (k): Substring false-match — word-boundary existence check → exit 0.
#
# store.ts: Cache is deleted as a declaration, but the longer identifier
# CacheManager survives AND a comment mentioning Cache survives. The test
# imported Cache and drops it + its test. The existence check matches
# WORD-BOUNDARY declaration/export forms only, so `const Cache\b` does NOT match
# inside `const CacheManager` and the comment text is not a declaration ⇒ Cache
# reads as ABSENT ⇒ exempt ⇒ exit 0.
# ---------------------------------------------------------------------------
echo "--- case (k): substring false-match (CacheManager) → exit 0 ---"
REPO=$(make_temp_repo)

cat > "$REPO/store.ts" <<'EOF'
export const Cache = () => 1;
export const CacheManager = () => 2;
EOF
cat > "$REPO/store.test.ts" <<'EOF'
import { it, expect } from 'vitest';
import { Cache, CacheManager } from './store';
it('Cache works', () => { expect(Cache()).toBe(1); });
it('CacheManager works', () => { expect(CacheManager()).toBe(2); });
EOF
git -C "$REPO" add store.ts store.test.ts
git -C "$REPO" commit -q -m "add store + tests"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2

cat > "$REPO/store.ts" <<'EOF'
// Cache eviction is handled by CacheManager
export const CacheManager = () => 2;
EOF
cat > "$REPO/store.test.ts" <<'EOF'
import { it, expect } from 'vitest';
import { CacheManager } from './store';
it('CacheManager works', () => { expect(CacheManager()).toBe(2); });
EOF
git -C "$REPO" add store.ts store.test.ts
git -C "$REPO" commit -q -m "remove Cache (CacheManager + comment survive)"

run_check "$REPO"
assert_exit 0 "(k) substring false-match: exit 0"
assert_stderr_empty "(k) substring false-match: no output"

# ---------------------------------------------------------------------------
# Case (l): import type { … } participates → exit 0.
#
# types.ts exports GoneType. The test uses `import type { GoneType }` and a test
# referencing the type. Feature: delete GoneType from source, remove its
# `import type` line and its test. Type-only imports are parsed into the named
# set ⇒ removed-imports = {GoneType}; absent from post-PR source ⇒ exempt ⇒
# exit 0.
# ---------------------------------------------------------------------------
echo "--- case (l): import type co-deletion → exit 0 ---"
REPO=$(make_temp_repo)

cat > "$REPO/types.ts" <<'EOF'
export type GoneType = { a: number };
export const KEEP = 1;
EOF
cat > "$REPO/types.test.ts" <<'EOF'
import { it, expect } from 'vitest';
import type { GoneType } from './types';
it('GoneType shape', () => { const v: GoneType = { a: 1 }; expect(v.a).toBe(1); });
EOF
git -C "$REPO" add types.ts types.test.ts
git -C "$REPO" commit -q -m "add types + test"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2

cat > "$REPO/types.ts" <<'EOF'
export const KEEP = 1;
EOF
cat > "$REPO/types.test.ts" <<'EOF'
import { it, expect } from 'vitest';
EOF
git -C "$REPO" add types.ts types.test.ts
git -C "$REPO" commit -q -m "remove GoneType + its type-only import + test"

run_check "$REPO"
assert_exit 0 "(l) import type co-deletion: exit 0"
assert_stderr_empty "(l) import type co-deletion: no output"

# ---------------------------------------------------------------------------
# Case (m): Namespace `import * as ns` removal is unverifiable → flag.
#
# The test has `import * as cache from './cachem'` plus two tests. Feature
# removes the namespace import line and one test (the surviving test is left
# byte-identical so it does not double-count). A removed namespace import binds
# no checkable source symbol ⇒ the removed named-import set is empty / the
# import is unverifiable ⇒ NO exemption (bias to fire) ⇒ Signal 2 fires.
# ---------------------------------------------------------------------------
echo "--- case (m): namespace import removed → flag (Signal 2) ---"
REPO=$(make_temp_repo)

cat > "$REPO/cachem.ts" <<'EOF'
export const foo = () => 1;
EOF
cat > "$REPO/cachem.test.ts" <<'EOF'
import { it, expect } from 'vitest';
import * as cache from './cachem';
it('uses cache a', () => { expect(cache.foo()).toBe(1); });
it('uses cache b', () => { expect(cache.foo()).toBe(1); });
EOF
git -C "$REPO" add cachem.ts cachem.test.ts
git -C "$REPO" commit -q -m "add cachem + namespace-import tests"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2

cat > "$REPO/cachem.test.ts" <<'EOF'
import { it, expect } from 'vitest';
it('uses cache b', () => { expect(cache.foo()).toBe(1); });
EOF
git -C "$REPO" add cachem.test.ts
git -C "$REPO" commit -q -m "remove namespace import + one test"

run_check "$REPO"
assert_exit 1 "(m) namespace import removed: exit 1"
assert_stderr_contains "Test-integrity violation" "(m) namespace import removed: remediation text present"
assert_stderr_contains "Signal 2" "(m) namespace import removed: Signal 2 fires"

# ---------------------------------------------------------------------------
# Case (n): Default import removal is unverifiable → flag.
#
# The test has `import Foo from './foo'` plus two tests. Feature removes the
# default import line and one test (surviving test left byte-identical). A
# removed default import binds no checkable source symbol ⇒ unverifiable ⇒ NO
# exemption ⇒ Signal 2 fires.
# ---------------------------------------------------------------------------
echo "--- case (n): default import removed → flag (Signal 2) ---"
REPO=$(make_temp_repo)

cat > "$REPO/foo.ts" <<'EOF'
export default function foo() { return 1; }
EOF
cat > "$REPO/foo.test.ts" <<'EOF'
import { it, expect } from 'vitest';
import Foo from './foo';
it('Foo a', () => { expect(Foo()).toBe(1); });
it('Foo b', () => { expect(Foo()).toBe(1); });
EOF
git -C "$REPO" add foo.ts foo.test.ts
git -C "$REPO" commit -q -m "add foo + default-import tests"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2

cat > "$REPO/foo.test.ts" <<'EOF'
import { it, expect } from 'vitest';
it('Foo b', () => { expect(Foo()).toBe(1); });
EOF
git -C "$REPO" add foo.test.ts
git -C "$REPO" commit -q -m "remove default import + one test"

run_check "$REPO"
assert_exit 1 "(n) default import removed: exit 1"
assert_stderr_contains "Test-integrity violation" "(n) default import removed: remediation text present"
assert_stderr_contains "Signal 2" "(n) default import removed: Signal 2 fires"

# ---------------------------------------------------------------------------
# Case (o): Multi-line import block — member extraction across lines → exit 0.
#
# The test imports Gone and Survivor in a MULTI-LINE `{ … }` block and tests
# both. Feature: remove the `Gone,` member line and Gone's test, delete Gone
# from source, keep Survivor (its member line + test stay). The parser joins the
# multi-line block into one logical statement ⇒ removed-imports = {Gone}; absent
# from post-PR source ⇒ exempt ⇒ exit 0.
# ---------------------------------------------------------------------------
echo "--- case (o): multi-line import block co-deletion → exit 0 ---"
REPO=$(make_temp_repo)

cat > "$REPO/mod.ts" <<'EOF'
export const Gone = () => 1;
export const Survivor = () => 2;
EOF
cat > "$REPO/mod.test.ts" <<'EOF'
import { it, expect } from 'vitest';
import {
  Gone,
  Survivor,
} from './mod';
it('Gone works', () => { expect(Gone()).toBe(1); });
it('Survivor works', () => { expect(Survivor()).toBe(2); });
EOF
git -C "$REPO" add mod.ts mod.test.ts
git -C "$REPO" commit -q -m "add mod + multi-line import tests"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2

cat > "$REPO/mod.ts" <<'EOF'
export const Survivor = () => 2;
EOF
cat > "$REPO/mod.test.ts" <<'EOF'
import { it, expect } from 'vitest';
import {
  Survivor,
} from './mod';
it('Survivor works', () => { expect(Survivor()).toBe(2); });
EOF
git -C "$REPO" add mod.ts mod.test.ts
git -C "$REPO" commit -q -m "remove Gone member + its test"

run_check "$REPO"
assert_exit 0 "(o) multi-line import co-deletion: exit 0"
assert_stderr_empty "(o) multi-line import co-deletion: no output"

# ---------------------------------------------------------------------------
# Case (p): Re-export / barrel brace form survives → flag.
#
# barrel.ts exposes Widget ONLY through an `export { w as Widget }` brace — there
# is no `const/function/class Widget` declaration, so the first existence form
# cannot catch it; only the named-export brace form can. The test imports Widget
# and drops it + its test on feature. The existence check's brace form matches
# `export { w as Widget }` ⇒ Widget PRESENT ⇒ NOT exempt ⇒ Signal 2 fires.
# ---------------------------------------------------------------------------
echo "--- case (p): re-export brace form survives → flag (Signal 2) ---"
REPO=$(make_temp_repo)

cat > "$REPO/barrel.ts" <<'EOF'
const w = () => 1;
export { w as Widget };
EOF
cat > "$REPO/barrel.test.ts" <<'EOF'
import { it, expect } from 'vitest';
import { Widget } from './barrel';
it('Widget works', () => { expect(Widget()).toBe(1); });
EOF
git -C "$REPO" add barrel.ts barrel.test.ts
git -C "$REPO" commit -q -m "add barrel + test"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2

cat > "$REPO/barrel.test.ts" <<'EOF'
import { it, expect } from 'vitest';
EOF
git -C "$REPO" add barrel.test.ts
git -C "$REPO" commit -q -m "remove Widget test (brace export survives)"

run_check "$REPO"
assert_exit 1 "(p) re-export brace form: exit 1"
assert_stderr_contains "Test-integrity violation" "(p) re-export brace form: remediation text present"
assert_stderr_contains "Signal 2" "(p) re-export brace form: Signal 2 fires"

# ---------------------------------------------------------------------------
# Case (q): "from"-substring CONTINUATION member must not drop later members
# (code-review-0, collecting terminator at line ~294) → flag.
#
# multi.test.ts imports GoneSym from its own single-line statement and imports
# fromList + AliveSymbol from a MULTI-LINE block whose CONTINUATION member
# `fromList,` contains "from" as a substring. The buggy terminator (`|| $0 ~
# /from/`) ended the brace block on that line, so fromList AND AliveSymbol were
# dropped from OLD_TAGS while GoneSym (its own statement) survived. Feature
# deletes GoneSym from a MODIFIED source file (so the basename loop does not
# apply), removes GoneSym's import+test, and removes the alive import + the
# AliveSymbol test — but AliveSymbol STILL EXISTS in source. With AliveSymbol
# dropped from OLD_TAGS the removed-import set was just {GoneSym} (absent),
# wrongly exempting the AliveSymbol weakening (exit 0). With the fix the block
# closes only on "}", AliveSymbol is captured, found PRESENT ⇒ fire.
# ---------------------------------------------------------------------------
echo "--- case (q): from-substring continuation member drop → flag (Signal 2) ---"
REPO=$(make_temp_repo)

cat > "$REPO/gone.ts" <<'EOF'
export const GoneSym = () => 1;
EOF
cat > "$REPO/alive.ts" <<'EOF'
export const fromList = () => 0;
export const AliveSymbol = () => 2;
EOF
cat > "$REPO/multi.test.ts" <<'EOF'
import { it, expect } from 'vitest';
import { GoneSym } from './gone';
import {
  fromList,
  AliveSymbol,
} from './alive';
it('GoneSym', () => { expect(GoneSym()).toBe(1); });
it('AliveSymbol', () => { expect(AliveSymbol()).toBe(2); });
EOF
git -C "$REPO" add gone.ts alive.ts multi.test.ts
git -C "$REPO" commit -q -m "add gone/alive + multi-line import tests"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2

cat > "$REPO/gone.ts" <<'EOF'
export const GoneOther = () => 9;
EOF
cat > "$REPO/multi.test.ts" <<'EOF'
import { it, expect } from 'vitest';
EOF
git -C "$REPO" add gone.ts multi.test.ts
git -C "$REPO" commit -q -m "remove GoneSym + AliveSymbol test; AliveSymbol still exists"

run_check "$REPO"
assert_exit 1 "(q) from-substring continuation member drop: exit 1"
assert_stderr_contains "Test-integrity violation" "(q) from-substring continuation member drop: remediation text present"
assert_stderr_contains "Signal 2" "(q) from-substring continuation member drop: Signal 2 fires"

# ---------------------------------------------------------------------------
# Case (q2): "from"-substring OPENING-line member must not short-circuit a
# multi-line block (code-review-0, opening classifier at line ~288) → flag.
#
# Same shape as (q), but the multi-line block's OPENING line carries the
# "from"-substring member: `import { fromEntries,`. The buggy opening classifier
# (`if ($0 ~ /from/) process($0)`) treated that line as a complete single-line
# import, dropping the continuation `AliveB }` from OLD_TAGS. The fix classifies
# an open brace block first, so the block is collected and AliveB captured ⇒
# PRESENT ⇒ fire.
# ---------------------------------------------------------------------------
echo "--- case (q2): from-substring opening-line member drop → flag (Signal 2) ---"
REPO=$(make_temp_repo)

cat > "$REPO/goneb.ts" <<'EOF'
export const GoneB = () => 1;
EOF
cat > "$REPO/aliveb.ts" <<'EOF'
export const fromEntries = () => 0;
export const AliveB = () => 2;
EOF
cat > "$REPO/op.test.ts" <<'EOF'
import { it, expect } from 'vitest';
import { GoneB } from './goneb';
import { fromEntries,
  AliveB } from './aliveb';
it('GoneB', () => { expect(GoneB()).toBe(1); });
it('AliveB', () => { expect(AliveB()).toBe(2); });
EOF
git -C "$REPO" add goneb.ts aliveb.ts op.test.ts
git -C "$REPO" commit -q -m "add goneb/aliveb + opening-line import tests"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2

cat > "$REPO/goneb.ts" <<'EOF'
export const GoneBOther = () => 9;
EOF
cat > "$REPO/op.test.ts" <<'EOF'
import { it, expect } from 'vitest';
EOF
git -C "$REPO" add goneb.ts op.test.ts
git -C "$REPO" commit -q -m "remove GoneB + AliveB test; AliveB still exists"

run_check "$REPO"
assert_exit 1 "(q2) from-substring opening-line member drop: exit 1"
assert_stderr_contains "Test-integrity violation" "(q2) from-substring opening-line member drop: remediation text present"
assert_stderr_contains "Signal 2" "(q2) from-substring opening-line member drop: Signal 2 fires"

# ---------------------------------------------------------------------------
# Case (r): `$`-bearing identifier survives the existence check (code-review-2)
# → flag.
#
# fac.ts exports $factory (a valid identifier; `$` is also ERE end-of-line).
# The OLD existence check interpolated $X into an ERE, so `const $factory\b`
# miscompiled and matched nothing ⇒ $factory read as absent ⇒ wrongly exempt
# (exit 0). The fix uses a literal pre-check plus EXACT EXPORT_AWK membership, so
# `$factory` is matched literally ⇒ PRESENT ⇒ fire.
# ---------------------------------------------------------------------------
echo "--- case (r): \$-identifier survives existence check → flag (Signal 2) ---"
REPO=$(make_temp_repo)

cat > "$REPO/fac.ts" <<'EOF'
export const $factory = () => 1;
EOF
cat > "$REPO/fac.test.ts" <<'EOF'
import { it, expect } from 'vitest';
import { $factory } from './fac';
it('$factory works', () => { expect($factory()).toBe(1); });
EOF
git -C "$REPO" add fac.ts fac.test.ts
git -C "$REPO" commit -q -m "add fac + test"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2

cat > "$REPO/fac.test.ts" <<'EOF'
import { it, expect } from 'vitest';
EOF
git -C "$REPO" add fac.test.ts
git -C "$REPO" commit -q -m "remove \$factory test (\$factory still exists)"

run_check "$REPO"
assert_exit 1 "(r) \$-identifier survives: exit 1"
assert_stderr_contains "Test-integrity violation" "(r) \$-identifier survives: remediation text present"
assert_stderr_contains "Signal 2" "(r) \$-identifier survives: Signal 2 fires"

# ---------------------------------------------------------------------------
# Case (s): multi-line `export { }` re-export survives (code-review-1) → flag.
#
# mod2.ts exposes Gadget ONLY through a MULTI-LINE `export { w2 as Gadget }`
# block — no `const/function Gadget` declaration. The OLD single-line
# NAMED_EXPORT_FORM regex (`[^}]*` cannot cross newlines, and git grep is
# line-oriented) never matched the split block ⇒ Gadget read as absent ⇒ wrongly
# exempt (exit 0). The brace-aware EXPORT_AWK joins the block ⇒ Gadget PRESENT ⇒
# fire.
# ---------------------------------------------------------------------------
echo "--- case (s): multi-line export brace survives → flag (Signal 2) ---"
REPO=$(make_temp_repo)

cat > "$REPO/mod2.ts" <<'EOF'
const w2 = () => 1;
export {
  w2 as Gadget,
};
EOF
cat > "$REPO/mod2.test.ts" <<'EOF'
import { it, expect } from 'vitest';
import { Gadget } from './mod2';
it('Gadget works', () => { expect(Gadget()).toBe(1); });
EOF
git -C "$REPO" add mod2.ts mod2.test.ts
git -C "$REPO" commit -q -m "add mod2 + test"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2

cat > "$REPO/mod2.test.ts" <<'EOF'
import { it, expect } from 'vitest';
EOF
git -C "$REPO" add mod2.test.ts
git -C "$REPO" commit -q -m "remove Gadget test (multi-line export survives)"

run_check "$REPO"
assert_exit 1 "(s) multi-line export brace survives: exit 1"
assert_stderr_contains "Test-integrity violation" "(s) multi-line export brace survives: remediation text present"
assert_stderr_contains "Signal 2" "(s) multi-line export brace survives: Signal 2 fires"

# ---------------------------------------------------------------------------
# Case (t): symbol-granular credit denies a co-removed inline-helper test
# (red-team-1) → flag.
#
# feat.test.ts imports GoneSymbol and also has an inline helper localCalc, each
# with its own test. Feature deletes GoneSymbol from a MODIFIED source file
# (basename loop does NOT apply) and removes GoneSymbol's import+test AND
# localCalc's test, keeping localCalc's definition. removed-import = {GoneSymbol}
# (absent) ⇒ all_absent. The OLD file-granular credit swept BOTH removed tests
# into the exemption (net 0 ⇒ exit 0), masking the localCalc weakening. The
# symbol-granular credit only exempts the block referencing GoneSymbol, so the
# localCalc test removal still nets −1 ⇒ fire.
# ---------------------------------------------------------------------------
echo "--- case (t): symbol-granular credit denies helper-test sweep → flag (Signal 2) ---"
REPO=$(make_temp_repo)

cat > "$REPO/feat.ts" <<'EOF'
export const GoneSymbol = () => 1;
export const Other = () => 9;
EOF
cat > "$REPO/feat.test.ts" <<'EOF'
import { it, expect } from 'vitest';
import { GoneSymbol } from './feat';
function localCalc() { return 5; }
it('GoneSymbol works', () => { expect(GoneSymbol()).toBe(1); });
it('localCalc works', () => { expect(localCalc()).toBe(5); });
EOF
git -C "$REPO" add feat.ts feat.test.ts
git -C "$REPO" commit -q -m "add feat + tests"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2

cat > "$REPO/feat.ts" <<'EOF'
export const Other = () => 9;
EOF
cat > "$REPO/feat.test.ts" <<'EOF'
import { it, expect } from 'vitest';
function localCalc() { return 5; }
EOF
git -C "$REPO" add feat.ts feat.test.ts
git -C "$REPO" commit -q -m "remove GoneSymbol + co-remove localCalc test"

run_check "$REPO"
assert_exit 1 "(t) symbol-granular credit: exit 1"
assert_stderr_contains "Test-integrity violation" "(t) symbol-granular credit: remediation text present"
assert_stderr_contains "Signal 2" "(t) symbol-granular credit: Signal 2 fires"

# ---------------------------------------------------------------------------
# Case (u): THE PUSH-TO-MAIN SHAPE — the defect this whole change exists for.
#
# Every case above cuts a feature branch, which is the one shape where
# `origin/main...HEAD` happened to work. On a push to `main`, actions/checkout
# leaves refs/remotes/origin/main pointing AT the pushed commit, so
# merge-base(origin/main, HEAD) == HEAD and the three-dot range expands to
# HEAD..HEAD — EMPTY. The `[ -z "$DIFF" ]` early return then reported success.
#
# Before the fix: exit 0. Deleting a test file in a commit pushed to main
# passed this required gate in silence. After: --at-remote-tip first-parent
# resolves the baseline to HEAD^1 ("what this push introduced"), the deletion
# is visible, and the gate fires.
#
# make_main_push_repo builds make_temp_repo's shape with the
# `checkout -q -b feature` OMITTED, so HEAD stays on main and origin/main is
# moved onto the tip commit.
# ---------------------------------------------------------------------------
make_main_push_repo() {
  local tmpdir
  tmpdir=$(mktemp -d)
  TMPDIRS+=("$tmpdir")

  git -C "$tmpdir" init -q -b main
  git -C "$tmpdir" config user.email "test@test.local"
  git -C "$tmpdir" config user.name "Test"

  printf 'export const x = 1;\n' > "$tmpdir/src.ts"
  cat > "$tmpdir/feat.test.ts" <<'EOF'
import { it, expect } from 'vitest';
it('works', () => { expect(1).toBe(1); });
EOF
  git -C "$tmpdir" add src.ts feat.test.ts
  git -C "$tmpdir" commit -q -m "initial"

  # The pushed commit: delete the test file, keep its implementation. No branch
  # is cut — HEAD is main, exactly as on a push.
  git -C "$tmpdir" rm -q "$tmpdir/feat.test.ts"
  git -C "$tmpdir" commit -q -m "the push: delete a test"

  # actions/checkout's post-push state.
  git -C "$tmpdir" update-ref refs/remotes/origin/main "$(git -C "$tmpdir" rev-parse HEAD)"

  printf '%s\n' "$tmpdir"
}

echo "--- case (u): push-to-main test deletion → flag (was a silent exit 0) ---"
REPO=$(make_main_push_repo)

# The reproduction, asserted rather than asserted-about: the range this gate
# used to carry sees nothing at all in this state.
TOTAL=$((TOTAL + 1))
OLD_RANGE_FILES=$(git -C "$REPO" diff --name-only 'refs/remotes/origin/main...HEAD' | grep -c . || true)  # diff-base-ok: the reproduction: asserts the old vacuous range sees nothing
if [ "$OLD_RANGE_FILES" -eq 0 ]; then
  PASS=$((PASS + 1))
else
  FAIL=$((FAIL + 1))
  echo "FAIL: (u) reproduction: expected the old three-dot range to be empty, got $OLD_RANGE_FILES files"
fi

run_check "$REPO"
assert_base_source "first-parent" "(u) push-to-main: baseline resolved via first-parent"
assert_exit 1 "(u) push-to-main: exit 1"
assert_stderr_contains "Test-integrity violation" "(u) push-to-main: remediation text present"
# Signal 3 (whole test-file deletion), which is the signal a deletion of
# feat.test.ts produces — and it is the SAME signal the identical deletion
# produces on a feature branch. That parity is the actual claim: after the fix
# the push-to-main shape is not a second, differently-behaving code path.
#
# It deliberately does NOT assert Signal 2. Signal 2's declaration removals are
# credited away here by the import-based co-deletion exemption (feat.test.ts's
# only imports are vitest's `it`/`expect`, neither of which is exported by the
# fixture's non-test tree), exactly as they are on a branch. An earlier revision
# of this case did assert Signal 2, and it passed only because the exemption's
# old blob was read from `origin/main` instead of the resolved baseline — on a
# push to main that returned the NEW content, so the exemption could never fire
# there. Asserting Signal 2 would pin that asymmetry back in place.
assert_stderr_contains "Signal 3" "(u) push-to-main: Signal 3 fires (same signal as the branch shape)"
assert_stderr_contains "feat.test.ts" "(u) push-to-main: names the deleted test file"

# ---------------------------------------------------------------------------
# Case (v): a clean push to main stays green — the fix must not flag every push.
# ---------------------------------------------------------------------------
echo "--- case (v): clean push to main → exit 0 ---"
REPO=$(make_main_push_repo)
git -C "$REPO" checkout -q HEAD~1 -- feat.test.ts
printf 'export const y = 2;\n' >> "$REPO/src.ts"
git -C "$REPO" add src.ts feat.test.ts
git -C "$REPO" commit -q -m "the push: restore the test, touch impl"
git -C "$REPO" update-ref refs/remotes/origin/main "$(git -C "$REPO" rev-parse HEAD)"

run_check "$REPO"
assert_base_source "first-parent" "(v) clean push: baseline resolved via first-parent"
assert_exit 0 "(v) clean push: exit 0"
assert_stderr_empty "(v) clean push: silent"

# ---------------------------------------------------------------------------
# Case (w): a failed baseline resolution must ABORT, not report a clean pass.
#
# The second residual of routing through resolve-diff-base: the helper is
# wired, and its exit code gets swallowed anyway. The call site is a plain
# assignment rather than an `if ! X=$(...)` precisely so `set -e` sees the
# helper's non-zero exit. On a REQUIRED gate, a swallowed exit code is
# indistinguishable from the vacuous diff this whole change removes.
# ---------------------------------------------------------------------------
echo "--- case (w): unresolvable baseline → abort, not a clean pass ---"
REPO=$(make_main_push_repo)
git -C "$REPO" update-ref -d refs/remotes/origin/main
run_check "$REPO"
TOTAL=$((TOTAL + 1))
if [ "$RC" -ne 0 ]; then
  PASS=$((PASS + 1))
else
  FAIL=$((FAIL + 1))
  echo "FAIL: (w) unresolvable baseline: expected a non-zero exit, got 0"
fi
assert_stderr_contains "origin/main" "(w) unresolvable baseline: names the ref"

# ---------------------------------------------------------------------------
# Case (x): the import-based co-deletion exemption must give the SAME answer on
# a branch and on the push that merges it.
#
# The exemption reads the test file's OLD blob to compute which imports the PR
# dropped. That old side must be the SAME revision the diff was taken against —
# $DIFF_BASE — not `origin/main`. On a push to main $DIFF_BASE is HEAD^1 while
# origin/main IS HEAD, so reading `origin/main:$F` returned the NEW content, the
# OLD-minus-NEW set difference came back empty, and the exemption could never
# fire. Consequence: a dead-code cleanup that passed this REQUIRED gate on its
# branch failed it again on `main` after merge, turning main red for work that
# was already approved.
#
# Shape: `beta` is deleted from a MODIFIED src.ts (no whole-file deletion, so
# the basename path does not apply) together with the test that imported it.
# ---------------------------------------------------------------------------
make_cleanup_repo() {
  local tmpdir
  tmpdir=$(mktemp -d)
  TMPDIRS+=("$tmpdir")

  git -C "$tmpdir" init -q -b main
  git -C "$tmpdir" config user.email "test@test.local"
  git -C "$tmpdir" config user.name "Test"

  printf 'export function alpha() { return 1; }\nexport function beta() { return 2; }\n' > "$tmpdir/src.ts"
  cat > "$tmpdir/src.test.ts" <<'EOF'
import { it, expect } from 'vitest';
import { alpha, beta } from './src';
it('alpha', () => { expect(alpha()).toBe(1); });
it('beta', () => { expect(beta()).toBe(2); });
EOF
  git -C "$tmpdir" add -A
  git -C "$tmpdir" commit -q -m "initial"

  # The cleanup commit: drop `beta` from the modified impl and its test.
  printf 'export function alpha() { return 1; }\n' > "$tmpdir/src.ts"
  cat > "$tmpdir/src.test.ts" <<'EOF'
import { it, expect } from 'vitest';
import { alpha } from './src';
it('alpha', () => { expect(alpha()).toBe(1); });
EOF
  git -C "$tmpdir" add -A
  git -C "$tmpdir" commit -q -m "drop dead beta + its test"

  printf '%s\n' "$tmpdir"
}

echo "--- case (x): dead-code cleanup is exempt on the branch AND on the push ---"
REPO=$(make_cleanup_repo)
# Branch shape: origin/main is the fork point.
git -C "$REPO" update-ref refs/remotes/origin/main "$(git -C "$REPO" rev-parse HEAD~1)"
run_check "$REPO"
assert_base_source "merge-base" "(x) branch: baseline resolved via merge-base"
assert_exit 0 "(x) branch: dead-code cleanup exempt, exit 0"

# Push-to-main shape: same commit, origin/main now AT it.
git -C "$REPO" update-ref refs/remotes/origin/main "$(git -C "$REPO" rev-parse HEAD)"
run_check "$REPO"
assert_base_source "first-parent" "(x) push: baseline resolved via first-parent"
assert_exit 0 "(x) push: same commit, same verdict — exit 0"

# ---------------------------------------------------------------------------
# Case (y): a --repo-root naming a SUBDIRECTORY must still check the WHOLE tree.
#
# Every git call in the gate is `git -C "$REPO_ROOT"`, and git resolves a
# pathspec relative to that directory's PREFIX within the repo. So a
# --repo-root naming a subdirectory scoped $TEST_GLOBS to that subdirectory
# while resolve-diff-base.sh (which normalizes) handed back a base for the
# WHOLE repo. A test deleted anywhere outside the subdirectory fell out of
# $DIFF, the `[ -z "$DIFF" ]` early exit read "nothing touched test files", and
# this REQUIRED gate exited 0 having examined part of a tree — a vacuous pass,
# the same failure shape case (u) covers for the push-to-main range.
#
# The subdirectory spelling is one a caller reaches for: resolve-diff-base.sh's
# own error text invites "a path inside the checkout".
#
# Measured against fd53e1e4 (pre-fix): exit 0, silent. With the toplevel
# normalization: exit 1, Signal 3, naming other/outside.test.ts.
# ---------------------------------------------------------------------------
echo "--- case (y): subdirectory --repo-root still sees the whole tree ---"
REPO=$(make_temp_repo)
mkdir -p "$REPO/other" "$REPO/sub"

cat > "$REPO/other/outside.test.ts" <<'EOF'
import { it, expect } from 'vitest';
it('outside the subdirectory', () => { expect(1).toBe(1); });
EOF
printf 'export const s = 1;\n' > "$REPO/sub/keep.ts"
git -C "$REPO" add other/outside.test.ts sub/keep.ts
git -C "$REPO" commit -q -m "add a test outside sub/"
git -C "$REPO" update-ref refs/remotes/origin/main HEAD

git -C "$REPO" checkout -q -b feature2
git -C "$REPO" rm -q other/outside.test.ts
git -C "$REPO" commit -q -m "delete the test outside sub/"

# The reproduction, asserted rather than asserted-about: run from the sub/
# prefix, the gate's OWN Signal 3 pathspec sees nothing at all in this state.
TOTAL=$((TOTAL + 1))
NARROWED=$(git -C "$REPO/sub" diff --diff-filter=D --name-only \
  'refs/remotes/origin/main'..HEAD -- '*.test.ts' | grep -c . || true)
if [ "$NARROWED" -eq 0 ]; then
  PASS=$((PASS + 1))
else
  FAIL=$((FAIL + 1))
  echo "FAIL: (y) reproduction: expected the sub/-prefixed pathspec to see nothing, got $NARROWED files"
fi

run_check "$REPO" "$REPO/sub"
assert_exit 1 "(y) subdirectory --repo-root: exit 1"
assert_stderr_contains "Test-integrity violation" "(y) subdirectory --repo-root: remediation text present"
assert_stderr_contains "Signal 3" "(y) subdirectory --repo-root: Signal 3 fires"
assert_stderr_contains "other/outside.test.ts" "(y) subdirectory --repo-root: names the test deleted outside sub/"

# ---------------------------------------------------------------------------
# Case (z): a --repo-root in no git work tree at all must fail LOUDLY, in this
# gate's own voice.
#
# The exit code alone does not discriminate: pre-fix the path was handed
# straight to resolve-diff-base.sh, which refused it with exit 3 and a message
# of its own that happens to use the same phrase. What the normalization adds
# is that the GATE rejects the argument it was given, before any helper runs —
# so the assertion is on the gate's own prefixed line, naming the offending
# path. Measured against fd53e1e4 (pre-fix): stderr carries only
# `resolve-diff-base: ERROR: …`, and this assertion fails.
# ---------------------------------------------------------------------------
echo "--- case (z): --repo-root outside any git work tree → loud failure ---"
REPO=$(make_temp_repo)
NON_REPO=$(mktemp -d)
TMPDIRS+=("$NON_REPO")

run_check "$REPO" "$NON_REPO"
TOTAL=$((TOTAL + 1))
if [ "$RC" -ne 0 ]; then
  PASS=$((PASS + 1))
else
  FAIL=$((FAIL + 1))
  echo "FAIL: (z) non-repo --repo-root: expected a non-zero exit, got 0"
fi
assert_stderr_contains \
  "check-test-integrity: --repo-root '$NON_REPO' is not inside a git work tree" \
  "(z) non-repo --repo-root: the GATE refuses it, naming the path"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "Results: $PASS passed, $FAIL failed, $TOTAL total"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo "All tests passed."
