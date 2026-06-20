#!/usr/bin/env bash
# test-phase-log-reentry.sh — behavioral unit test for the --reentry flag of
# dispatch-write-phase-log (issue #2163, Unit 3 of 3).
#
# The --reentry true short-circuit replaces untested SKILL.md prose with a
# machine-verifiable guarantee: on re-entry the script is a pure no-op — no
# STDIN read, no gh call, exit 0, existing phase-log comment preserved
# byte-for-byte.
#
# Acceptance criteria:
#   AC1: --reentry true is a verbatim no-op. With </dev/null (no body) and a
#        pre-seeded phase-log comment, exit 0, the stored body is byte-identical
#        to its pre-run snapshot, and NO POST/PATCH gh write fired.
#   AC2: --reentry false takes the normal write path — exit 0, a POST to
#        issues/<N>/comments fires, and the stored body carries the inner marker
#        plus the supplied content.
#   AC3: omitting --reentry (default false) preserves the normal write path —
#        same shape as AC2 (backward compatibility).
#   AC4: an invalid --reentry value (maybe) exits 2 with '--reentry' in stderr.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

SUT="$SCRIPT_DIR/dispatch-write-phase-log"

# ---- assert_files_eq: byte-for-byte file comparison using cmp -s ------------
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

# ---- assert_log_no_write: GH_LOG (possibly absent) carries no POST/PATCH -----
assert_log_no_write() {
  local label="$1" log="$2"
  TOTAL=$((TOTAL + 1))
  local contents=""
  [[ -f "$log" ]] && contents="$(cat "$log")"
  if grep -qE 'POST|PATCH' <<<"$contents"; then
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label — a write verb appeared in the gh log"
    echo "    log contents:"
    printf '%s\n' "$contents" | head -10 | sed 's/^/      /'
  else
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  fi
}

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

BIN="$WORK/bin"
mkdir -p "$BIN"

# ---- git stub ---------------------------------------------------------------
# Resolves the common dir and remote URL so GH_REPO derivation succeeds on the
# normal write path. (Unused on the --reentry true path, which short-circuits
# before touching git.)
cat > "$BIN/git" <<'GITSTUB'
#!/usr/bin/env bash
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

# ---- stateful gh stub -------------------------------------------------------
# Models the body-state logic on write_gh_stub in test-write-phase-log.sh:
# stores the comment body in $STORED_BODY_FILE across GET/POST/PATCH. In
# ADDITION, every invocation appends its full args to $GH_LOG so the test can
# assert which verbs fired. Both paths are baked in at write time to keep the
# inner heredoc free of exported-variable complexity.
#
# Arg shapes (from dispatch-write-phase-log):
#   gh api --paginate repos/{owner}/{repo}/issues/<N>/comments
#   gh api repos/{owner}/{repo}/issues/comments/100 --jq .body
#   gh api --method POST  repos/{owner}/{repo}/issues/<N>/comments     --field body=@<file>
#   gh api --method PATCH repos/{owner}/{repo}/issues/comments/100     --field body=@<file>
write_gh_stub() {
  local stored_file="$1"
  local gh_log="$2"
  local author_id="${3:-1}"
  cat > "$BIN/gh" <<GHSTUB
#!/usr/bin/env bash
STORED_BODY_FILE='$stored_file'
GH_LOG='$gh_log'
AUTHOR_ID='$author_id'

# Record every invocation's args for verb assertions.
echo "\$*" >> "\$GH_LOG"

# Parse args into METHOD, PATH_ARG, BODY_FILE, JQ_FILTER.
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
      SKIP_NEXT=1
      ;;
    *)
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
        if [[ -f "\$STORED_BODY_FILE" ]]; then
          jq -n --rawfile b "\$STORED_BODY_FILE" \\
            --argjson aid "\$AUTHOR_ID" \\
            '[{"id":100,"body":\$b,"user":{"id":\$aid}}]'
        else
          echo "[]"
        fi
        ;;
      repos/owner/repo/issues/comments/100)
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

export PATH="$BIN:$PATH"
export DISPATCH_PLAN_AUTHOR_ID=1

echo ""
echo "=== test-phase-log-reentry.sh ==="
echo ""

# ============================================================================
# AC1: --reentry true is a verbatim no-op (no STDIN, no gh write, exit 0).
# ============================================================================
echo "-- AC1: --reentry true preserves the existing phase-log verbatim --"
STORED_BODY_FILE="$WORK/body-ac1.txt"
GH_LOG="$WORK/gh-ac1.log"
: > "$GH_LOG"   # fresh, empty

# Pre-seed a rich, realistic (implement,1) phase-log comment with a multi-line body.
cat > "$STORED_BODY_FILE" <<'SEED'
<!-- dispatch:phase-log -->

<!-- phase-log:implement:1 -->
## implement · attempt 1
failed: compilation error in src/widget.ts
- TS2345: argument of type 'string' is not assignable to 'number'
- reran tsc after the fix; clean

next: hand off to qa with the rebuilt bundle
SEED

# Snapshot the seed for byte-for-byte comparison after the run.
REF1="$WORK/ref-ac1.txt"
cp "$STORED_BODY_FILE" "$REF1"

write_gh_stub "$STORED_BODY_FILE" "$GH_LOG" "1"

set +e
AC1_STDERR=$("$SUT" 2163 --phase implement --reentry true </dev/null 2>&1)
AC1_RC=$?
set -e

assert_eq "AC1: exit code is 0" "0" "$AC1_RC"
assert_files_eq "AC1: stored body is byte-for-byte identical to the pre-run snapshot" "$REF1" "$STORED_BODY_FILE"
assert_log_no_write "AC1: no POST/PATCH write verb fired on re-entry" "$GH_LOG"

# ============================================================================
# AC2: --reentry false takes the normal write path (POST + inner marker).
# ============================================================================
echo ""
echo "-- AC2: --reentry false writes the section normally --"
STORED_BODY_FILE="$WORK/body-ac2.txt"   # fresh path → no stored comment yet
GH_LOG="$WORK/gh-ac2.log"
: > "$GH_LOG"

write_gh_stub "$STORED_BODY_FILE" "$GH_LOG" "1"

AC2_BODY=$'failed: none\nDISTINCTIVE-AC2-CONTENT-7f3a\n- all acceptance checks green\n- bundle rebuilt'

set +e
"$SUT" 2163 --phase implement --reentry false <<<"$AC2_BODY"
AC2_RC=$?
set -e

assert_eq "AC2: exit code is 0" "0" "$AC2_RC"
assert_contains "AC2: a POST to issues/2163/comments fired" "issues/2163/comments" "$(cat "$GH_LOG")"
assert_contains "AC2: gh called with --method POST" "POST" "$(cat "$GH_LOG")"
assert_file_contains "AC2: stored body carries the inner marker" "$STORED_BODY_FILE" "<!-- phase-log:implement:1 -->"
assert_file_contains "AC2: stored body carries the rich content" "$STORED_BODY_FILE" "DISTINCTIVE-AC2-CONTENT-7f3a"

# ============================================================================
# AC3: omitting --reentry (default false) preserves the normal write path.
# ============================================================================
echo ""
echo "-- AC3: default (no --reentry flag) writes normally (backward compat) --"
STORED_BODY_FILE="$WORK/body-ac3.txt"   # fresh path → no stored comment yet
GH_LOG="$WORK/gh-ac3.log"
: > "$GH_LOG"

write_gh_stub "$STORED_BODY_FILE" "$GH_LOG" "1"

AC3_BODY=$'failed: none\nDISTINCTIVE-AC3-CONTENT-b91c\n- default flag path exercised'

set +e
"$SUT" 2163 --phase implement <<<"$AC3_BODY"
AC3_RC=$?
set -e

assert_eq "AC3: exit code is 0" "0" "$AC3_RC"
assert_contains "AC3: a POST to issues/2163/comments fired" "issues/2163/comments" "$(cat "$GH_LOG")"
assert_contains "AC3: gh called with --method POST" "POST" "$(cat "$GH_LOG")"
assert_file_contains "AC3: stored body carries the inner marker" "$STORED_BODY_FILE" "<!-- phase-log:implement:1 -->"
assert_file_contains "AC3: stored body carries the rich content" "$STORED_BODY_FILE" "DISTINCTIVE-AC3-CONTENT-b91c"

# ============================================================================
# AC4: invalid --reentry value → exit 2, stderr mentions --reentry.
# ============================================================================
echo ""
echo "-- AC4: invalid --reentry value -> exit 2, stderr mentions --reentry --"
STORED_BODY_FILE="$WORK/body-ac4.txt"
GH_LOG="$WORK/gh-ac4.log"
: > "$GH_LOG"

write_gh_stub "$STORED_BODY_FILE" "$GH_LOG" "1"

set +e
AC4_STDERR=$("$SUT" 2163 --phase implement --reentry maybe </dev/null 2>&1)
AC4_RC=$?
set -e

assert_eq "AC4: exit code is 2" "2" "$AC4_RC"
assert_contains "AC4: stderr mentions --reentry" "--reentry" "$AC4_STDERR"

report_results
