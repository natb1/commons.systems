#!/usr/bin/env bash
set -euo pipefail

# Fixture-based unit tests for check-type-safety-escapes.sh.
#
# Each case feeds a synthetic unified diff into the scanner's core entry point
# (`check-type-safety-escapes.sh --scan-stdin`) and asserts on the emitted
# `::error file=<path>,line=<N>::...` annotations and the scanner's exit code.
#
# The diffs are written as heredocs INSIDE this bash script on purpose. A literal
# `!` (needed for the non-null-assertion fixtures) is unreliable when typed into
# an interactive zsh shell — it can pick up a stray backslash even inside
# single-quoted heredocs. When *bash* executes these heredocs at test runtime,
# history expansion is off and `!` is literal, so the non-null fixtures match as
# intended. Run this file with: bash test-check-type-safety-escapes.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCANNER="$SCRIPT_DIR/check-type-safety-escapes.sh"

TEST_TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TEST_TMPDIR"' EXIT

# File-based counters because each case runs in a subshell (variable changes
# inside a subshell would be lost to the parent).
PASS_FILE="${TEST_TMPDIR}/.pass_count"
FAIL_FILE="${TEST_TMPDIR}/.fail_count"
echo 0 > "$PASS_FILE"
echo 0 > "$FAIL_FILE"

pass() {
  echo "  PASS: $1"
  echo $(( $(cat "$PASS_FILE") + 1 )) > "$PASS_FILE"
}
fail() {
  echo "  FAIL: $1"
  echo $(( $(cat "$FAIL_FILE") + 1 )) > "$FAIL_FILE"
}

# run_scan <fixture-file> -> writes scanner stdout to $OUT_FILE, sets $RC.
# Uses a global OUT_FILE/RC pair so subshell cases can inspect both. `set -e`
# would abort on the scanner's exit 1, so the call is guarded.
scan_fixture() {
  local fixture="$1"
  OUT_FILE="${TEST_TMPDIR}/.out"
  set +e
  "$SCANNER" --scan-stdin < "$fixture" > "$OUT_FILE"
  RC=$?
  set -e
}

# Count `::error` annotation lines in the captured output.
err_count() {
  grep -c '^::error ' "$OUT_FILE" 2>/dev/null || true
}

# ---------------------------------------------------------------------------
# POSITIVE CASES: each pattern must produce a finding.
# ---------------------------------------------------------------------------

echo "=== Positive: @ts-ignore is flagged ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
+++ b/a.ts
@@ -1,0 +1,1 @@
+// @ts-ignore
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 1 ] && [ "$n" -eq 1 ] && grep -q 'hatch (@ts-ignore)' "$OUT_FILE"; then
    pass "@ts-ignore -> 1 finding, exit 1"
  else
    fail "@ts-ignore (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

echo ""
echo "=== Positive: eslint-disable-next-line is flagged ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
+++ b/a.ts
@@ -1,0 +1,1 @@
+// eslint-disable-next-line no-explicit
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 1 ] && [ "$n" -eq 1 ] && grep -q 'hatch (eslint-disable)' "$OUT_FILE"; then
    pass "eslint-disable-next-line -> 1 finding (eslint-disable)"
  else
    fail "eslint-disable (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

echo ""
echo "=== Positive: @ts-expect-error is flagged ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
+++ b/a.ts
@@ -1,0 +1,1 @@
+// @ts-expect-error
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 1 ] && [ "$n" -eq 1 ] && grep -q 'hatch (@ts-expect-error)' "$OUT_FILE"; then
    pass "@ts-expect-error -> 1 finding, exit 1"
  else
    fail "@ts-expect-error (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

echo ""
echo "=== Positive: ': any' is flagged ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
+++ b/a.ts
@@ -1,0 +1,1 @@
+function f(x: any) {}
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 1 ] && [ "$n" -eq 1 ] && grep -q 'hatch (any in type position)' "$OUT_FILE"; then
    pass ": any -> 1 finding (any in type position)"
  else
    fail ": any (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

echo ""
echo "=== Positive: 'as any' is flagged EXACTLY once (any rule owns it) ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
+++ b/a.ts
@@ -1,0 +1,1 @@
+const x = y as any;
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 1 ] && [ "$n" -eq 1 ] && grep -q 'hatch (any in type position)' "$OUT_FILE"; then
    pass "as any -> EXACTLY 1 finding (not double-counted by as <Type>)"
  else
    fail "as any (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

echo ""
echo "=== Positive: 'any[]' is flagged ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
+++ b/a.ts
@@ -1,0 +1,1 @@
+const xs: any[] = [];
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 1 ] && [ "$n" -ge 1 ] && grep -q 'hatch (any in type position)' "$OUT_FILE"; then
    pass "any[] -> flagged (any in type position)"
  else
    fail "any[] (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

echo ""
echo "=== Positive: 'as Foo' cast is flagged ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
+++ b/a.ts
@@ -1,0 +1,1 @@
+const x = y as Foo;
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 1 ] && [ "$n" -eq 1 ] && grep -q 'hatch (as <Type> cast)' "$OUT_FILE"; then
    pass "as Foo -> 1 finding (as <Type> cast)"
  else
    fail "as Foo (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

echo ""
echo "=== Positive: 'export const x = y as Foo' cast is flagged ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
+++ b/a.ts
@@ -1,0 +1,1 @@
+export const x = y as Foo;
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 1 ] && [ "$n" -eq 1 ] && grep -q 'hatch (as <Type> cast)' "$OUT_FILE"; then
    pass "export const x = y as Foo -> 1 finding (as <Type> cast)"
  else
    fail "export const as Foo (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

echo ""
echo "=== Negative: 'export { X as Y };' rename is NOT flagged ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
+++ b/a.ts
@@ -1,0 +1,1 @@
+export { X as Y };
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 0 ] && [ "$n" -eq 0 ]; then
    pass "export { X as Y } -> 0 findings (brace rename excluded)"
  else
    fail "export brace rename (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

echo ""
echo "=== Positive: 'foo!.bar' non-null assertion is flagged ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
+++ b/a.ts
@@ -1,0 +1,1 @@
+const v = foo!.bar;
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 1 ] && [ "$n" -eq 1 ] && grep -q 'hatch (non-null assertion' "$OUT_FILE"; then
    pass "foo!.bar -> 1 finding (non-null assertion) [! fixture fired]"
  else
    fail "foo!.bar (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

echo ""
echo "=== Positive: 'arr[0]!' non-null assertion is flagged ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
+++ b/a.ts
@@ -1,0 +1,1 @@
+const v = arr[0]!;
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 1 ] && [ "$n" -eq 1 ] && grep -q 'hatch (non-null assertion' "$OUT_FILE"; then
    pass "arr[0]! -> 1 finding (non-null assertion) [! fixture fired]"
  else
    fail "arr[0]! (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

# ---------------------------------------------------------------------------
# NEGATIVE / EXCLUSION CASES: each must produce NO finding.
# ---------------------------------------------------------------------------

echo ""
echo "=== Negative: clean exclusions produce no findings ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
+++ b/a.ts
@@ -1,0 +1,13 @@
+const x = [1, 2] as const;
+import { X as Y } from './x';
+  Foo as RenamedFoo, // type-safety-ok: bare re-export alias body line
+export { foo as Bar } from './re-export';
+const eq = a !== b;
+const notnot = !!x;
+const ok = !foo;
+const a = many;
+const b = Company;
+const c = anything;
+const d = 1; // cast as Foo here
+const e = 2; // foo!.bar in a comment
+function g(h: number) { return h; }
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 0 ] && [ "$n" -eq 0 ]; then
    pass "as const / import aliases / re-export / !== / !!x / leading !foo / many / Company / anything / comment-only hatches -> 0 findings"
  else
    fail "exclusions (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

# ---------------------------------------------------------------------------
# SUPPRESSION: a non-empty reason suppresses; an empty reason does not.
# ---------------------------------------------------------------------------

echo ""
echo "=== Suppression: '// type-safety-ok: reason' suppresses the line ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
+++ b/a.ts
@@ -1,0 +1,1 @@
+const x = y as Foo; // type-safety-ok: legacy interop, verified by hand
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 0 ] && [ "$n" -eq 0 ]; then
    pass "as Foo + non-empty type-safety-ok reason -> suppressed (0 findings)"
  else
    fail "suppression non-empty (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

echo ""
echo "=== Suppression: EMPTY reason '// type-safety-ok:' does NOT suppress ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
+++ b/a.ts
@@ -1,0 +1,1 @@
+const x = y as Foo; // type-safety-ok:
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 1 ] && [ "$n" -eq 1 ] && grep -q 'hatch (as <Type> cast)' "$OUT_FILE"; then
    pass "as Foo + EMPTY type-safety-ok reason -> still flagged (1 finding)"
  else
    fail "suppression empty (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

# ---------------------------------------------------------------------------
# DIFF-SCOPED: only added (+) lines are scanned; unchanged context is invisible.
# ---------------------------------------------------------------------------

echo ""
echo "=== Diff-scoped: pre-existing hatch on an unchanged line is NOT seen ==="
(
  # Context lines (leading space) carry a pre-existing `as Foo`; they are not
  # additions, so the scanner must not flag them. The single added line is clean.
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
+++ b/a.ts
@@ -1,3 +1,4 @@
 const pre = old as Foo;
 const mid = 1;
+const fresh = 2;
 const post = arr[0]!;
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 0 ] && [ "$n" -eq 0 ]; then
    pass "hatches on unchanged context lines -> 0 findings (diff-scoped)"
  else
    fail "diff-scoped clean-add (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

echo ""
echo "=== Diff-scoped: a net-new hatch added in the same hunk IS flagged ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
+++ b/a.ts
@@ -1,3 +1,4 @@
 const pre = old as Foo;
 const mid = 1;
+const fresh = bad as Foo;
 const post = clean;
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 1 ] && [ "$n" -eq 1 ] && grep -q 'hatch (as <Type> cast)' "$OUT_FILE"; then
    pass "net-new hatch on an added line -> 1 finding (diff-scoped)"
  else
    fail "diff-scoped net-new (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

# ---------------------------------------------------------------------------
# LINE-NUMBER CORRECTNESS: hatch on the 3rd added line of a hunk starting at
# +10 must report line=12 (10 -> first added line, 11, 12).
# ---------------------------------------------------------------------------

echo ""
echo "=== Line-number: hatch on 3rd added line of '@@ +10' reports line=12 ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
--- a/src/deep/a.ts
+++ b/src/deep/a.ts
@@ -1,0 +10,3 @@
+const a = 1;
+const b = 2;
+const c = obj as Foo;
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 1 ] && [ "$n" -eq 1 ] && \
     grep -q '^::error file=src/deep/a.ts,line=12::' "$OUT_FILE"; then
    pass "line bookkeeping: file=src/deep/a.ts line=12"
  else
    fail "line-number (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

echo ""
echo "=== Line-number: '\ No newline' marker does NOT skew the counter ==="
(
  # The old file lacked a trailing newline, so git emits a "\ No newline at end
  # of file" marker after the removed line. That marker is not a real source
  # line and must not advance the new-file counter. The added hatch is the 2nd
  # added line of a hunk starting at +1, so it must report line=2.
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
--- a/a.ts
+++ b/a.ts
@@ -1 +1,2 @@
-const old = 1;
\ No newline at end of file
+const a = 1;
+const c = obj as Foo;
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 1 ] && [ "$n" -eq 1 ] && \
     grep -q '^::error file=a.ts,line=2::' "$OUT_FILE"; then
    pass "no-newline marker ignored: as Foo reports line=2"
  else
    fail "no-newline marker (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

echo ""
echo "=== Comma-in-path: file= comma is percent-encoded to %2C ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
--- a/src/weird,file.ts
+++ b/src/weird,file.ts
@@ -1,0 +1,1 @@
+const x = y as Foo;
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 1 ] && [ "$n" -eq 1 ] && \
     grep -q '^::error file=src/weird%2Cfile.ts,line=1::' "$OUT_FILE"; then
    pass "comma-in-path -> file=src/weird%2Cfile.ts (comma percent-encoded)"
  else
    fail "comma-in-path (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

# ---------------------------------------------------------------------------
# RESULTS + expected-total guard (catches a crashed/early-exiting subshell).
# ---------------------------------------------------------------------------

FINAL_PASS=$(cat "$PASS_FILE")
FINAL_FAIL=$(cat "$FAIL_FILE")

echo ""
echo "========================================"
echo "  Results: $FINAL_PASS passed, $FINAL_FAIL failed"
echo "========================================"

EXPECTED=19
ACTUAL=$(( FINAL_PASS + FINAL_FAIL ))
if [ "$ACTUAL" -ne "$EXPECTED" ]; then
  echo "ERROR: expected $EXPECTED test results but got $ACTUAL (a test subshell may have crashed)" >&2
  exit 1
fi

if [ "$FINAL_FAIL" -gt 0 ]; then
  exit 1
fi
