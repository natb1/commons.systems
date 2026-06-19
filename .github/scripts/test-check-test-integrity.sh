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

# run_check REPO_DIR — run check-test-integrity.sh with CWD=repo dir.
# Sets RC and STDERR for assertion helpers.
RC=0
STDERR=""
run_check() {
  local repo="$1"
  RC=0
  STDERR=""
  STDERR=$(cd "$repo" && "$CHECK_SCRIPT" 2>&1 >/dev/null) || RC=$?
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
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "Results: $PASS passed, $FAIL failed, $TOTAL total"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo "All tests passed."
