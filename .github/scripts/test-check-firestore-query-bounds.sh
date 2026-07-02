#!/usr/bin/env bash
set -euo pipefail

# Fixture-based unit tests for check-firestore-query-bounds.sh.
#
# Each case feeds a WHOLE TS FILE BODY into the scanner's core entry point
# (`check-firestore-query-bounds.sh --scan-stdin`) and asserts on the emitted
# `::error file=<path>,line=<N>::...` annotations and the scanner's exit code.
#
# Unlike the diff-scoped type-safety sensor's test, the fixtures here are full
# file bodies piped on stdin, NOT unified diffs — the scanner reads whole file
# contents. Run this file with: bash test-check-firestore-query-bounds.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCANNER="$SCRIPT_DIR/check-firestore-query-bounds.sh"

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

# scan_fixture <fixture-file> -> writes scanner stdout to $OUT_FILE, sets $RC.
# The fixture is a whole TS file body piped on stdin. `set -e` would abort on
# the scanner's exit 1, so the call is guarded.
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
# 1. Violation caught: variable-shape query, no limit.
# ---------------------------------------------------------------------------
echo "=== Violation: unbounded variable query is flagged ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
const q = query(collection(db, p), where("x","==",true));
const s = await getDocs(q);
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 1 ] && [ "$n" -eq 1 ]; then
    pass "unbounded variable query -> 1 finding, exit 1"
  else
    fail "unbounded variable query (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

# ---------------------------------------------------------------------------
# 2. limit()-bounded passes (multi-line query span).
# ---------------------------------------------------------------------------
echo ""
echo "=== Bounded: multi-line limit() query passes ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
const q = query(
  collection(db, p),
  where("x","==",true),
  limit(50),
);
const s = await getDocs(q);
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 0 ] && [ "$n" -eq 0 ]; then
    pass "multi-line limit(50) query -> 0 findings, exit 0"
  else
    fail "multi-line limit query (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

# ---------------------------------------------------------------------------
# 3. Inline bounded passes.
# ---------------------------------------------------------------------------
echo ""
echo "=== Bounded: inline getDocs(query(..., limit())) passes ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
const s = await getDocs(query(collection(db, p), limit(10)));
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 0 ] && [ "$n" -eq 0 ]; then
    pass "inline limit(10) query -> 0 findings, exit 0"
  else
    fail "inline limit query (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

# ---------------------------------------------------------------------------
# 4. Marked query passes (marker on the query-assignment line).
# ---------------------------------------------------------------------------
echo ""
echo "=== Marked: query-bounds-ok on the assignment line passes ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
const q = query(collection(db, p), where("x","==",true)); // query-bounds-ok: product decision
const s = await getDocs(q);
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 0 ] && [ "$n" -eq 0 ]; then
    pass "marker on assignment line -> 0 findings, exit 0"
  else
    fail "marker on assignment line (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

# ---------------------------------------------------------------------------
# 5. Marked passes (marker on the getDocs line — ternary shape).
# ---------------------------------------------------------------------------
echo ""
echo "=== Marked: query-bounds-ok on the getDocs line (ternary) passes ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
const q = admin
  ? query(collection(db, p), orderBy("d"))
  : query(collection(db, p), where("pub","==",true));
const s = await getDocs(q); // query-bounds-ok: blog index needs all
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 0 ] && [ "$n" -eq 0 ]; then
    pass "marker on getDocs line (ternary) -> 0 findings, exit 0"
  else
    fail "marker on getDocs line (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

# ---------------------------------------------------------------------------
# 6. Empty-reason rejected — MULTI-LINE (CRITICAL DISCRIMINATOR).
#    An empty-reason marker on a query-span line, real code on the FOLLOWING
#    line. A concatenation-buggy scanner would treat the next line's code as the
#    marker's "reason" and wrongly suppress; the per-physical-line scanner
#    rejects the empty reason and flags. Must NOT collapse to one line.
# ---------------------------------------------------------------------------
echo ""
echo "=== Empty-reason (multi-line): does NOT suppress, still flagged ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
const q = query(
  collection(db, p),
  where("x","==",true), // query-bounds-ok:
);
const s = await getDocs(q);
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 1 ] && [ "$n" -eq 1 ]; then
    pass "multi-line empty-reason marker -> still flagged (1 finding), exit 1"
  else
    fail "multi-line empty-reason (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

# ---------------------------------------------------------------------------
# 7. getDoc( single-doc read NOT flagged.
# ---------------------------------------------------------------------------
echo ""
echo "=== Single-doc: getDoc( is NOT flagged ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
const snap = await getDoc(doc(db, p, id));
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 0 ] && [ "$n" -eq 0 ]; then
    pass "getDoc( single-doc read -> 0 findings, exit 0"
  else
    fail "getDoc single-doc (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

# ---------------------------------------------------------------------------
# 8. Unresolved variable FLAGGED (conservative default).
# ---------------------------------------------------------------------------
echo ""
echo "=== Unresolved: getDocs(<unresolved>) is flagged conservatively ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
const s = await getDocs(mystery);
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 1 ] && [ "$n" -eq 1 ]; then
    pass "unresolved variable -> 1 finding (conservative), exit 1"
  else
    fail "unresolved variable (rc=$RC count=$n): $(cat "$OUT_FILE")"
  fi
)

# ---------------------------------------------------------------------------
# 9. mockGetDocs( is NOT matched by the anchored getDocs( pattern.
#    The leading anchor [^A-Za-z0-9_$] before getDocs( excludes mockGetDocs(.
#    The fixture contains ONLY the mock call (unbounded query above it), so any
#    finding would prove the anchor leaked.
# ---------------------------------------------------------------------------
echo ""
echo "=== Anchor: mockGetDocs( is NOT matched ==="
(
  F="${TEST_TMPDIR}/f"; cat > "$F" <<'EOF'
const q = query(collection(db, p));
const s = await mockGetDocs(q);
EOF
  scan_fixture "$F"
  n=$(err_count)
  if [ "$RC" -eq 0 ] && [ "$n" -eq 0 ]; then
    pass "mockGetDocs( -> 0 findings (anchor excludes it), exit 0"
  else
    fail "mockGetDocs anchor (rc=$RC count=$n): $(cat "$OUT_FILE")"
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

EXPECTED=9
ACTUAL=$(( FINAL_PASS + FINAL_FAIL ))
if [ "$ACTUAL" -ne "$EXPECTED" ]; then
  echo "ERROR: expected $EXPECTED test results but got $ACTUAL (a test subshell may have crashed)" >&2
  exit 1
fi

if [ "$FINAL_FAIL" -gt 0 ]; then
  exit 1
fi
