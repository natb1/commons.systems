#!/usr/bin/env bash
# Tests for ingest-downloads -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 10232-10378.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# ingest-downloads.sh tests
# ============================================================================
#
# Both ingest-downloads.sh and identify-qfx.sh are copied into a fresh tmp
# tree so BASH_SOURCE-based SCRIPT_DIR resolution works correctly. The budget
# scripts live at $SCRIPT_DIR/../../budget/scripts/ relative to the
# dispatch-propagate scripts dir.

echo ""
echo "=== ingest-downloads.sh ==="

INGEST_SRC="$SCRIPT_DIR/../../budget/scripts/ingest-downloads.sh"
IDENTIFY_SRC="$SCRIPT_DIR/../../budget/scripts/identify-qfx.sh"

ING_TMP=""

ingest_setup() {
  ING_TMP=$(mktemp -d)
  mkdir -p "$ING_TMP/scripts" "$ING_TMP/dl" "$ING_TMP/st"
  cp "$INGEST_SRC"   "$ING_TMP/scripts/ingest-downloads.sh"
  cp "$IDENTIFY_SRC" "$ING_TMP/scripts/identify-qfx.sh"
  chmod +x "$ING_TMP/scripts/ingest-downloads.sh" "$ING_TMP/scripts/identify-qfx.sh"
}

ingest_teardown() {
  rm -rf "$ING_TMP"
  ING_TMP=""
}

# --- Test: move — AMEX file is classified and moved to the correct subdir ----

echo "Test: ingest-downloads.sh moves an AMEX QFX to the correct institution/account subdir"
ingest_setup
printf '<ORG>AMEX</ORG>\n<ACCTID>tok|12345</ACCTID>\n' > "$ING_TMP/dl/amex.qfx"
out=$(bash "$ING_TMP/scripts/ingest-downloads.sh" "$ING_TMP/dl" "$ING_TMP/st" 2>&1); rc=$?
assert_eq "ingest-move: exits 0" "0" "$rc"
assert_eq "ingest-move: file at american_express/12345/amex.qfx" "yes" \
  "$([[ -f "$ING_TMP/st/american_express/12345/amex.qfx" ]] && echo yes || echo no)"
TOTAL=$((TOTAL + 1))
if printf '%s' "$out" | grep -qF ' to '; then
  PASS=$((PASS + 1)); echo "  PASS: ingest-move: output contains '<src> to <dest>' line"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: ingest-move: output contains '<src> to <dest>' line"
  echo "    output: $out"
fi
TOTAL=$((TOTAL + 1))
if printf '%s' "$out" | grep -qF "american_express/12345/amex.qfx"; then
  PASS=$((PASS + 1)); echo "  PASS: ingest-move: output names the dest path"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: ingest-move: output names the dest path"
  echo "    output: $out"
fi
ingest_teardown

# --- Test: missing statements dir — exits 1 with descriptive error -----------

echo "Test: ingest-downloads.sh exits 1 when statements dir does not exist"
ingest_setup
rm -rf "$ING_TMP/st"   # remove the statements dir to simulate unmounted drive
printf '<ORG>AMEX</ORG>\n<ACCTID>tok|12345</ACCTID>\n' > "$ING_TMP/dl/amex.qfx"
rc=0
err=$(bash "$ING_TMP/scripts/ingest-downloads.sh" "$ING_TMP/dl" "$ING_TMP/st" 2>&1 >/dev/null) || rc=$?
assert_eq "ingest-missing-statements: exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if printf '%s' "$err" | grep -qF "statements"; then
  PASS=$((PASS + 1)); echo "  PASS: ingest-missing-statements: stderr mentions statements"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: ingest-missing-statements: stderr mentions statements"
  echo "    stderr: $err"
fi
ingest_teardown

# --- Test: collision — timestamp-suffixed name used; original not overwritten -

echo "Test: ingest-downloads.sh uses a timestamp-suffixed name on collision"
ingest_setup
mkdir -p "$ING_TMP/st/american_express/12345"
printf 'OLD\n' > "$ING_TMP/st/american_express/12345/amex.qfx"
printf '<ORG>AMEX</ORG>\n<ACCTID>tok|12345</ACCTID>\n' > "$ING_TMP/dl/amex.qfx"
out=$(bash "$ING_TMP/scripts/ingest-downloads.sh" "$ING_TMP/dl" "$ING_TMP/st" 2>&1); rc=$?
assert_eq "ingest-collision: exits 0" "0" "$rc"
# Original file must still have its sentinel content (not overwritten).
orig_content=$(cat "$ING_TMP/st/american_express/12345/amex.qfx")
assert_eq "ingest-collision: original file not overwritten (content OLD)" "OLD" "$orig_content"
# A timestamp-suffixed file matching amex.*.qfx should exist.
ts_files=()
while IFS= read -r -d '' f; do
  ts_files+=("$f")
done < <(find "$ING_TMP/st/american_express/12345" -maxdepth 1 -name 'amex.*.qfx' -print0 2>/dev/null)
assert_eq "ingest-collision: exactly one timestamp-suffixed file exists" "1" "${#ts_files[@]}"
ingest_teardown

# --- Test: unknown ORG — classify-all-first: nothing moved -------------------

echo "Test: ingest-downloads.sh moves nothing when any file has an unknown ORG"
ingest_setup
printf '<ORG>AMEX</ORG>\n<ACCTID>tok|00001</ACCTID>\n' > "$ING_TMP/dl/good.qfx"
printf '<ORG>NOPE</ORG>\n<ACCTID>tok|00002</ACCTID>\n' > "$ING_TMP/dl/bad.qfx"
rc=0
out=$(bash "$ING_TMP/scripts/ingest-downloads.sh" "$ING_TMP/dl" "$ING_TMP/st" 2>&1) || rc=$?
assert_eq "ingest-unknown-org: exits 1" "1" "$rc"
assert_eq "ingest-unknown-org: good.qfx NOT moved (still in dl)" "yes" \
  "$([[ -f "$ING_TMP/dl/good.qfx" ]] && echo yes || echo no)"
assert_eq "ingest-unknown-org: bad.qfx NOT moved (still in dl)" "yes" \
  "$([[ -f "$ING_TMP/dl/bad.qfx" ]] && echo yes || echo no)"
# Statements dir must be empty (nothing moved).
st_file_count=$(find "$ING_TMP/st" -type f | wc -l | tr -d ' ')
assert_eq "ingest-unknown-org: statements dir has no files" "0" "$st_file_count"
TOTAL=$((TOTAL + 1))
if printf '%s' "$out" | grep -qE 'bad\.qfx|NOPE'; then
  PASS=$((PASS + 1)); echo "  PASS: ingest-unknown-org: output mentions the bad file or ORG"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: ingest-unknown-org: output mentions the bad file or ORG"
  echo "    output: $out"
fi
ingest_teardown

# --- Test: path traversal — a crafted ACCTID is rejected, nothing moved ------
# identify-qfx.sh canonicalizes ACCTID by taking the segment after the last '|',
# without stripping path separators — so <ACCTID>tok|../../escape</ACCTID>
# yields account "../../escape". ingest-downloads.sh must reject any
# institution/account containing "/" or ".." before mkdir -p / mv, otherwise a
# crafted statement file in Downloads escapes the archive root (arbitrary write).

echo "Test: ingest-downloads.sh rejects a path-traversal account and moves nothing"
ingest_setup
printf '<ORG>AMEX</ORG>\n<ACCTID>tok|../../escape</ACCTID>\n' > "$ING_TMP/dl/evil.qfx"
rc=0
err=$(bash "$ING_TMP/scripts/ingest-downloads.sh" "$ING_TMP/dl" "$ING_TMP/st" 2>&1 >/dev/null) || rc=$?
assert_eq "ingest-traversal: exits 1" "1" "$rc"
assert_eq "ingest-traversal: evil.qfx NOT moved (still in dl)" "yes" \
  "$([[ -f "$ING_TMP/dl/evil.qfx" ]] && echo yes || echo no)"
# Nothing created inside or beside the statements tree.
assert_eq "ingest-traversal: no file written under statements dir" "0" \
  "$(find "$ING_TMP/st" -type f | wc -l | tr -d ' ')"
assert_eq "ingest-traversal: no file escaped to ING_TMP/escape" "no" \
  "$([[ -e "$ING_TMP/escape" ]] && echo yes || echo no)"
TOTAL=$((TOTAL + 1))
if printf '%s' "$err" | grep -qiE 'unsafe|path component'; then
  PASS=$((PASS + 1)); echo "  PASS: ingest-traversal: stderr flags an unsafe path component"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: ingest-traversal: stderr flags an unsafe path component"
  echo "    stderr: $err"
fi
ingest_teardown

# <<< END MOVED <<<

report_results
