#!/usr/bin/env bash
# Tests for dispatch-qa-noprogress -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 13280-13417.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-qa-noprogress tests
# ============================================================================
#
# Exercises the qa-noprogress content-aware no-progress detector. Tests 1-3
# share a single setup (state accumulates in $TMPDIR_TEST/comment-body across
# calls). Tests 4 and 5 each get a fresh setup.
#
# Fake-gh design: stateful single-comment store at $TMPDIR_TEST/comment-body.
#   GET (api --paginate):  returns [{id:1, body:<store>, user:{id:4242}}] or []
#   WRITE (api --method PATCH|POST): copies the body file to the store
#   api user: returns 4242 (not reached when AUTHOR_ID env is set, but safe)
#
# DISPATCH_QA_NOPROGRESS_AUTHOR_ID=4242 avoids the live `gh api user` lookup.

echo ""
echo "=== dispatch-qa-noprogress ==="

qanp_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/bin"

  cp "$SCRIPT_DIR/dispatch-qa-noprogress" \
    "$TMPDIR_TEST/scripts/dispatch-qa-noprogress"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-qa-noprogress"

  # Stateful fake-gh: single comment body stored at $TMPDIR_TEST/comment-body.
  # Absent = no comment yet (first call returns []). WRITE copies the body
  # verbatim; the script emits a compact single-line ids array so no
  # normalization is needed here.
  cat > "$TMPDIR_TEST/bin/fake-gh" <<STUB
#!/usr/bin/env bash
STORE="$TMPDIR_TEST/comment-body"
# GET the comments list: api --paginate repos/.../issues/<pr>/comments
if [[ "\$1" == "api" && "\$2" == "--paginate" ]]; then
  if [[ -f "\$STORE" ]]; then
    jq -n --arg b "\$(cat "\$STORE")" '[{id:1, body:\$b, user:{id:4242}}]'
  else
    echo '[]'
  fi
  exit 0
fi
# WRITE: api --method PATCH|POST repos/... --field body=@<path>
if [[ "\$1" == "api" && "\$2" == "--method" ]]; then
  bodyfile=""
  for a in "\$@"; do
    case "\$a" in body=@*) bodyfile="\${a#body=@}" ;; esac
  done
  [[ -n "\$bodyfile" ]] && cp "\$bodyfile" "\$STORE"
  exit 0
fi
# api user --jq .id  (not reached when AUTHOR_ID env is set, but be safe)
if [[ "\$1" == "api" && "\$2" == "user" ]]; then
  echo "4242"; exit 0
fi
exit 0
STUB
  chmod +x "$TMPDIR_TEST/bin/fake-gh"
  export DISPATCH_QA_NOPROGRESS_GH_CMD="$TMPDIR_TEST/bin/fake-gh"
  export DISPATCH_QA_NOPROGRESS_AUTHOR_ID=4242
}

qanp_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  unset DISPATCH_QA_NOPROGRESS_GH_CMD
  unset DISPATCH_QA_NOPROGRESS_AUTHOR_ID
}

# --- Tests 1-3: shared setup (state accumulates across calls) -----------------

echo "Test: qanp 1-3 (shared state)"
qanp_setup

# Test 1: first attempt (no prior comment) → progress, marker comment written
echo "  Test 1: first attempt (no prior comment) → progress, comment written"
printf 'a\nb\nc\n' > "$TMPDIR_TEST/cur.txt"
if out=$("$TMPDIR_TEST/scripts/dispatch-qa-noprogress" 555 "$TMPDIR_TEST/cur.txt" 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "qanp test-1 exits 0" "0" "$rc"
assert_eq "qanp test-1 stdout is progress" "progress" "$out"
TOTAL=$((TOTAL + 1))
if [[ -f "$TMPDIR_TEST/comment-body" ]] \
   && grep -q 'dispatch:qa-residue' "$TMPDIR_TEST/comment-body"; then
  PASS=$((PASS + 1)); echo "    PASS: first attempt writes marker comment containing dispatch:qa-residue"
else
  FAIL=$((FAIL + 1)); echo "    FAIL: first attempt writes marker comment containing dispatch:qa-residue"
  echo "      comment-body exists: $(test -f "$TMPDIR_TEST/comment-body" && echo yes || echo no)"
fi

# Test 2: identical id set (nothing resolved) → no-progress
echo "  Test 2: same ids (a,b,c) → no-progress"
printf 'a\nb\nc\n' > "$TMPDIR_TEST/cur.txt"
if out=$("$TMPDIR_TEST/scripts/dispatch-qa-noprogress" 555 "$TMPDIR_TEST/cur.txt" 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "qanp test-2 exits 0" "0" "$rc"
assert_eq "qanp test-2 stdout is no-progress" "no-progress" "$out"

# Test 3: strictly smaller set (one id resolved) → progress
echo "  Test 3: smaller ids (a,b) → progress (c resolved)"
printf 'a\nb\n' > "$TMPDIR_TEST/cur.txt"
if out=$("$TMPDIR_TEST/scripts/dispatch-qa-noprogress" 555 "$TMPDIR_TEST/cur.txt" 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "qanp test-3 exits 0" "0" "$rc"
assert_eq "qanp test-3 stdout is progress" "progress" "$out"

qanp_teardown

# --- Test 4: JSON-array input form round-trip ---------------------------------

echo "Test: qanp test-4 JSON-array input round-trip"
qanp_setup
# First call with JSON array ["x","y"] → progress (first attempt)
printf '["x","y"]\n' > "$TMPDIR_TEST/cur.txt"
if out=$("$TMPDIR_TEST/scripts/dispatch-qa-noprogress" 555 "$TMPDIR_TEST/cur.txt" 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "qanp test-4a exits 0" "0" "$rc"
assert_eq "qanp test-4a JSON-first stdout is progress" "progress" "$out"
# Second call with identical JSON array → no-progress (nothing resolved)
printf '["x","y"]\n' > "$TMPDIR_TEST/cur.txt"
if out=$("$TMPDIR_TEST/scripts/dispatch-qa-noprogress" 555 "$TMPDIR_TEST/cur.txt" 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "qanp test-4b exits 0" "0" "$rc"
assert_eq "qanp test-4b JSON-same stdout is no-progress" "no-progress" "$out"
qanp_teardown

# --- Test 5a: missing current-ids-file → exit 2 ------------------------------

echo "Test: qanp missing current-ids-file → exit 2"
qanp_setup
if out=$("$TMPDIR_TEST/scripts/dispatch-qa-noprogress" 555 /nonexistent/path 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "qanp missing cur-file exits 2" "2" "$rc"
qanp_teardown

# --- Test 5b: flag-like / non-numeric pr-num → exit 2 ------------------------

echo "Test: qanp flag-like pr-num → exit 2"
qanp_setup
printf 'a\n' > "$TMPDIR_TEST/cur.txt"
if out=$("$TMPDIR_TEST/scripts/dispatch-qa-noprogress" --repo "$TMPDIR_TEST/cur.txt" 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "qanp flag-like pr-num exits 2" "2" "$rc"
qanp_teardown

# <<< END MOVED <<<

report_results
