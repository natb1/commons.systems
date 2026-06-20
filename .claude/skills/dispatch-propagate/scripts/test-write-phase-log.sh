#!/usr/bin/env bash
# test-write-phase-log.sh — tests for dispatch-write-phase-log REPLACE path.
# Verifies that the awk state machine preserves blank separator lines between
# phase-log sections on repeated upserts (issue #2139).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# ---- assert_files_eq: byte-for-byte file comparison using cmp -s -----------
# Uses files rather than command substitution to avoid trailing-newline stripping.
assert_files_eq() {
  local label="$1" expected_file="$2" actual_file="$3"
  TOTAL=$((TOTAL + 1))
  if cmp -s "$expected_file" "$actual_file"; then
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label — files differ"
    echo "    expected ($expected_file):"
    cat -A "$expected_file" | head -30 | sed 's/^/      /'
    echo "    actual ($actual_file):"
    cat -A "$actual_file" | head -30 | sed 's/^/      /'
  fi
}

# ---- Set up a bin-shim directory with stub gh and git ----------------------

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

BIN="$WORK/bin"
mkdir -p "$BIN"

# ---- git stub ---------------------------------------------------------------
cat > "$BIN/git" <<'GITSTUB'
#!/usr/bin/env bash
# Positional args only — $* is fine here since none of our cases have spaces in values.
case "$*" in
  "rev-parse --path-format=absolute --git-common-dir")
    echo "/project/.bare"
    ;;
  "--git-dir=/project/.bare config --get remote.origin.url")
    echo "https://github.com/owner/repo.git"
    ;;
  *)
    echo "git stub: unknown invocation: $*" >&2
    exit 1
    ;;
esac
GITSTUB
chmod +x "$BIN/git"

# ---- gh stub ----------------------------------------------------------------
# The stub is written with STORED_BODY_FILE interpolated at write time so the
# inner heredoc has a concrete path, avoiding exported-variable complexity in
# the stub's own environment.
#
# Arg shapes observed from dispatch-write-phase-log (confirmed by trace):
#   gh api --paginate repos/{owner}/{repo}/issues/<N>/comments
#   gh api repos/{owner}/{repo}/issues/comments/100 --jq .body
#   gh api --method POST repos/{owner}/{repo}/issues/<N>/comments --field body=@<file>
#   gh api --method PATCH repos/{owner}/{repo}/issues/comments/100 --field body=@<file>
#
# The stub identifies each call by scanning positional args for --method,
# the api path token, and --field body=@<path>.

write_gh_stub() {
  local stored_file="$1"
  local author_id="${2:-1}"
  cat > "$BIN/gh" <<GHSTUB
#!/usr/bin/env bash
STORED_BODY_FILE='$stored_file'
AUTHOR_ID='$author_id'

# Parse args into METHOD, PATH_ARG, BODY_FILE, JQ_FILTER.
# Linear scan: flags with known values consume the next token; the first
# positional arg after 'api' that is not a flag value is PATH_ARG.
METHOD="GET"
PATH_ARG=""
BODY_FILE=""
JQ_FILTER=""
i=0
PAST_API=0
SKIP_NEXT=0
args=("\$@")
while [[ \$i -lt \${#args[@]} ]]; do
  a="\${args[\$i]}"
  if [[ "\$SKIP_NEXT" -eq 1 ]]; then
    SKIP_NEXT=0
    i=\$(( i + 1 ))
    continue
  fi
  case "\$a" in
    api)
      PAST_API=1
      ;;
    --method)
      i=\$(( i + 1 ))
      METHOD="\${args[\$i]}"
      ;;
    --paginate)
      : # no-op
      ;;
    --field)
      i=\$(( i + 1 ))
      fv="\${args[\$i]}"
      if [[ "\$fv" == body=@* ]]; then
        BODY_FILE="\${fv#body=@}"
      fi
      ;;
    --jq)
      i=\$(( i + 1 ))
      JQ_FILTER="\${args[\$i]}"
      ;;
    --*)
      # Unknown flag — skip its value token too
      SKIP_NEXT=1
      ;;
    *)
      # Positional arg after 'api' is the path
      if [[ "\$PAST_API" -eq 1 && -z "\$PATH_ARG" ]]; then
        PATH_ARG="\$a"
      fi
      ;;
  esac
  i=\$(( i + 1 ))
done

# gh expands {owner}/{repo} from GH_REPO; stub sees literal braces.
PATH_ARG="\${PATH_ARG//\{owner\}/owner}"
PATH_ARG="\${PATH_ARG//\{repo\}/repo}"

case "\$METHOD" in
  GET)
    case "\$PATH_ARG" in
      repos/owner/repo/issues/*/comments)
        # List comments — return stored comment if exists, else []
        if [[ -f "\$STORED_BODY_FILE" ]]; then
          jq -n --rawfile b "\$STORED_BODY_FILE" \\
            --argjson aid "\$AUTHOR_ID" \\
            '[{"id":100,"body":\$b,"user":{"id":\$aid}}]'
        else
          echo "[]"
        fi
        ;;
      repos/owner/repo/issues/comments/100)
        # Single comment body GET (caller uses --jq .body to extract text)
        if [[ "\$JQ_FILTER" == ".body" || -z "\$JQ_FILTER" ]]; then
          cat "\$STORED_BODY_FILE"
        else
          echo "gh stub: unexpected --jq filter: \$JQ_FILTER" >&2; exit 1
        fi
        ;;
      *)
        echo "gh stub: unknown GET path: \$PATH_ARG (raw: \$*)" >&2; exit 1
        ;;
    esac
    ;;
  POST)
    case "\$PATH_ARG" in
      repos/owner/repo/issues/*/comments)
        [[ -n "\$BODY_FILE" ]] || { echo "gh stub POST: missing body=@ field" >&2; exit 1; }
        cp "\$BODY_FILE" "\$STORED_BODY_FILE"
        ;;
      *) echo "gh stub: unknown POST path: \$PATH_ARG" >&2; exit 1 ;;
    esac
    ;;
  PATCH)
    case "\$PATH_ARG" in
      repos/owner/repo/issues/comments/100)
        [[ -n "\$BODY_FILE" ]] || { echo "gh stub PATCH: missing body=@ field" >&2; exit 1; }
        cp "\$BODY_FILE" "\$STORED_BODY_FILE"
        ;;
      *) echo "gh stub: unknown PATCH path: \$PATH_ARG" >&2; exit 1 ;;
    esac
    ;;
esac
GHSTUB
  chmod +x "$BIN/gh"
}

# ---- Helper: run dispatch-write-phase-log with stubs -----------------------
run_write() {
  local issue="$1" phase="$2" attempt="$3" body="$4"
  # Write the stub with the current STORED_BODY_FILE path baked in.
  write_gh_stub "$STORED_BODY_FILE" "1"
  export PATH="$BIN:$PATH"
  export DISPATCH_PLAN_AUTHOR_ID=1
  printf '%s\n' "$body" \
    | "$SCRIPT_DIR/dispatch-write-phase-log" "$issue" --phase "$phase" --attempt "$attempt"
}

echo ""
echo "=== test-write-phase-log.sh ==="
echo ""

# ============================================================================
# Test case 1: Non-last re-upsert is idempotent — blank separator preserved
# ============================================================================
echo "-- Test 1: non-last re-upsert is idempotent --"
STORED_BODY_FILE="$WORK/body-tc1.txt"

# Write implement:1 (first write — POST, no existing comment)
run_write 42 implement 1 "failed: compilation error"

# Write qa:1 (APPEND — implement:1 is now non-last)
run_write 42 qa 1 "failed: none"

# Capture reference body (implement:1 non-last, qa:1 last)
REF1="$WORK/ref-tc1.txt"
cp "$STORED_BODY_FILE" "$REF1"

# Re-upsert implement:1 (REPLACE path — it is non-last; qa:1 follows with a separator)
run_write 42 implement 1 "failed: compilation error"

assert_files_eq "tc1: re-upsert of non-last section is byte-for-byte identical" "$REF1" "$STORED_BODY_FILE"

# ============================================================================
# Test case 2: Three-section middle re-upsert, twice
# ============================================================================
echo ""
echo "-- Test 2: three-section middle re-upsert twice --"
STORED_BODY_FILE="$WORK/body-tc2.txt"

run_write 42 implement 1 "failed: compile"
run_write 42 qa 1 "failed: test"
run_write 42 review 1 "failed: none"

REF2="$WORK/ref-tc2.txt"
cp "$STORED_BODY_FILE" "$REF2"

# Re-upsert the MIDDLE section (qa:1) twice
run_write 42 qa 1 "failed: test"
run_write 42 qa 1 "failed: test"

assert_files_eq "tc2: middle re-upsert twice is byte-for-byte identical" "$REF2" "$STORED_BODY_FILE"

# ============================================================================
# Test case 3: Last-section re-upsert byte-for-byte identical to its APPEND
# ============================================================================
echo ""
echo "-- Test 3: last-section re-upsert equals its APPEND --"
STORED_BODY_FILE="$WORK/body-tc3.txt"

run_write 42 implement 1 "failed: compile"
run_write 42 qa 1 "failed: none"

# Capture after qa:1 APPEND (qa:1 is the last section)
REF3="$WORK/ref-tc3.txt"
cp "$STORED_BODY_FILE" "$REF3"

# Re-upsert qa:1 (REPLACE of the last section — must not add trailing blank)
run_write 42 qa 1 "failed: none"

assert_files_eq "tc3: last-section re-upsert equals its APPEND (no trailing blank)" "$REF3" "$STORED_BODY_FILE"

# ============================================================================
# Test case 4: APPEND still emits exactly one blank separator between sections
# ============================================================================
echo ""
echo "-- Test 4: APPEND emits exactly one blank separator between sections --"
STORED_BODY_FILE="$WORK/body-tc4.txt"

run_write 42 implement 1 "failed: compile"
run_write 42 qa 1 "failed: none"

# Count blank lines between the two section headers in the stored body.
BLANK_COUNT=$(awk '
  /^<!-- phase-log:implement:1 -->/ { in_impl=1; next }
  in_impl && /^<!-- phase-log:qa:1 -->/ { print blanks; exit }
  in_impl && /^$/ { blanks++ }
  in_impl && !/^$/ { blanks=0 }
' "$STORED_BODY_FILE")

assert_eq "tc4: exactly one blank line between implement:1 and qa:1 after APPEND" "1" "$BLANK_COUNT"

echo ""
report_results
