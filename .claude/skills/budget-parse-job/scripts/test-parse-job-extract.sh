#!/usr/bin/env bash
# Unit-test suite for parse-job-extract.sh. Self-contained: builds issue-body
# fixtures and statement-file fixtures in a tmp dir, exercises every subcommand
# and every error path. No network. Matches the assert_eq / report_results
# convention of test-dispatch-scripts.sh.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXTRACT="$SCRIPT_DIR/parse-job-extract.sh"

PASS=0
FAIL=0
TOTAL=0

assert_eq() {
  local label="$1" expected="$2" actual="$3"
  TOTAL=$((TOTAL + 1))
  if [[ "$expected" == "$actual" ]]; then
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label"
    echo "    expected: '$expected'"
    echo "    actual:   '$actual'"
  fi
}

report_results() {
  echo ""
  echo "================================"
  echo "Results: $PASS/$TOTAL passed, $FAIL failed"
  echo "================================"
  [[ "$FAIL" -eq 0 ]]
}

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# ---- fixtures --------------------------------------------------------------
# A real statement file and its true sha256.
mkdir -p "$TMP/statements/nested/deep"
printf 'OFXHEADER:100\nfake qfx contents\n' > "$TMP/statements/nested/deep/jan.qfx"
REAL_SHA=$(sha256sum "$TMP/statements/nested/deep/jan.qfx" | awk '{print $1}')

# A body in the EXACT dispatch-statements-scan format.
BODY_OK="$TMP/body-ok.txt"
cat > "$BODY_OK" <<EOF
Parse the bank statement \`jan.qfx\` from the shared statements folder and merge it into the budget snapshot. The statement contents are not included here — read the file from the shared statements folder on this machine.

- File: \`jan.qfx\`
- sha256: \`$REAL_SHA\`
EOF

# Body missing the File line.
BODY_NO_FILE="$TMP/body-no-file.txt"
cat > "$BODY_NO_FILE" <<EOF
Parse the bank statement.

- sha256: \`$REAL_SHA\`
EOF

# Body missing the sha256 line.
BODY_NO_SHA="$TMP/body-no-sha.txt"
cat > "$BODY_NO_SHA" <<EOF
Parse the bank statement.

- File: \`jan.qfx\`
EOF

# Body whose File value is a glob pattern (must be rejected, not fed to find).
BODY_GLOB="$TMP/body-glob.txt"
cat > "$BODY_GLOB" <<EOF
- File: \`*.qfx\`
- sha256: \`$REAL_SHA\`
EOF

# Body whose sha256 does not match the real file.
WRONG_SHA="0000000000000000000000000000000000000000000000000000000000000000"
BODY_MISMATCH="$TMP/body-mismatch.txt"
cat > "$BODY_MISMATCH" <<EOF
- File: \`jan.qfx\`
- sha256: \`$WRONG_SHA\`
EOF

# ---- parse: correct body ---------------------------------------------------
echo "== parse =="
OUT=$("$EXTRACT" parse "$BODY_OK")
assert_eq "parse extracts file line" "file=jan.qfx" "$(printf '%s\n' "$OUT" | sed -n 's/^\(file=.*\)$/\1/p')"
assert_eq "parse extracts sha256 line" "sha256=$REAL_SHA" "$(printf '%s\n' "$OUT" | sed -n 's/^\(sha256=.*\)$/\1/p')"

# parse via stdin too.
OUT=$("$EXTRACT" parse < "$BODY_OK")
assert_eq "parse reads stdin" "file=jan.qfx" "$(printf '%s\n' "$OUT" | sed -n 's/^\(file=.*\)$/\1/p')"

# parse: missing File line -> error.
rc=0; "$EXTRACT" parse "$BODY_NO_FILE" >/dev/null 2>&1 || rc=$?
assert_eq "parse missing File line errors" "1" "$rc"

# parse: missing sha256 line -> error.
rc=0; "$EXTRACT" parse "$BODY_NO_SHA" >/dev/null 2>&1 || rc=$?
assert_eq "parse missing sha256 line errors" "1" "$rc"

# parse: glob metacharacters in File value -> error (not fed to find -name).
rc=0; "$EXTRACT" parse "$BODY_GLOB" >/dev/null 2>&1 || rc=$?
assert_eq "parse rejects glob metacharacters in File" "1" "$rc"

# locate: glob metacharacters in base -> error (defense-in-depth entry point).
rc=0; "$EXTRACT" locate "$TMP/statements" "*.qfx" "$REAL_SHA" >/dev/null 2>&1 || rc=$?
assert_eq "locate rejects glob metacharacters in base" "1" "$rc"

# ---- locate: found + sha matches ------------------------------------------
echo "== locate =="
OUT=$("$EXTRACT" locate "$TMP/statements" "jan.qfx" "$REAL_SHA")
assert_eq "locate returns abs path" "$TMP/statements/nested/deep/jan.qfx" "$OUT"

# locate: sha mismatch -> error.
rc=0; "$EXTRACT" locate "$TMP/statements" "jan.qfx" "$WRONG_SHA" >/dev/null 2>&1 || rc=$?
assert_eq "locate sha mismatch errors" "1" "$rc"

# locate: file not found -> error.
rc=0; "$EXTRACT" locate "$TMP/statements" "missing.qfx" "$REAL_SHA" >/dev/null 2>&1 || rc=$?
assert_eq "locate file-not-found errors" "1" "$rc"

# locate: ambiguous (two files same basename) -> error.
cp "$TMP/statements/nested/deep/jan.qfx" "$TMP/statements/jan.qfx"
rc=0; "$EXTRACT" locate "$TMP/statements" "jan.qfx" "$REAL_SHA" >/dev/null 2>&1 || rc=$?
assert_eq "locate ambiguous match errors" "1" "$rc"
rm -f "$TMP/statements/jan.qfx"

# ---- resolve: end-to-end ---------------------------------------------------
echo "== resolve =="
OUT=$("$EXTRACT" resolve "$BODY_OK" --dir "$TMP/statements")
assert_eq "resolve emits path line" "path=$TMP/statements/nested/deep/jan.qfx" "$(printf '%s\n' "$OUT" | sed -n 's/^\(path=.*\)$/\1/p')"

# resolve: sha mismatch propagates the error.
rc=0; "$EXTRACT" resolve "$BODY_MISMATCH" --dir "$TMP/statements" >/dev/null 2>&1 || rc=$?
assert_eq "resolve sha mismatch errors" "1" "$rc"

# ---- usage / unknown subcommand -------------------------------------------
echo "== usage =="
rc=0; "$EXTRACT" bogus >/dev/null 2>&1 || rc=$?
assert_eq "unknown subcommand errors" "2" "$rc"

report_results
