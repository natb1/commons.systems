#!/usr/bin/env bash
# Tests for dispatch-open-pr -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 24387-24575, 28272-28353.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# === dispatch-open-pr ===
# ============================================================================

echo "Test: dispatch-open-pr"

# Dedicated setup/teardown modeled on followup_exists_setup/teardown. Builds a
# temp tree with the script under test and a gh stub on PATH. The gh stub
# EMULATES GitHub's close parser: it reads the body passed to `pr create` /
# `pr edit`, extracts every `<keyword> #N`, and writes the resulting close set
# to $TREE/close-set.txt — which `pr view` then echoes back. The force-extra /
# force-drop knobs override the parsed set deterministically.
open_pr_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/bin"

  cp "$SCRIPT_DIR/dispatch-open-pr" "$TMPDIR_TEST/scripts/dispatch-open-pr"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-open-pr"
  # #2256: dispatch-open-pr now sources its sibling lib.sh (for gh_issue_edit_rest),
  # so the copied script's SCRIPT_DIR must contain a real lib.sh.
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/lib.sh"

  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
# gh stub emulating GitHub's close parser for dispatch-open-pr tests.
TREE="$(cd "$(dirname "$0")/.." && pwd)"

# Locate the body file: `pr create` passes it as `--body-file <path>`; the
# migrated re-apply (#2256) drives gh_issue_edit_rest → `gh api -X PATCH
# repos/.../issues/<N> -F body=@<path>`, so recognize that form too.
body_file=""
prev=""
for a in "$@"; do
  if [[ "$prev" == "--body-file" ]]; then
    body_file="$a"
  fi
  case "$a" in
    body=@*) body_file="${a#body=@}" ;;
  esac
  prev="$a"
done

# Parse the close set from a body file the same way GitHub does, then apply the
# force-extra / force-drop knobs and write the sorted-unique result.
write_close_set() {
  local bf="$1"
  local set=""
  if [[ -n "$bf" && -f "$bf" ]]; then
    # Extract "<keyword> [:] #N" → bare N, case-insensitive.
    set="$(grep -ioE '(close[sd]?|fix(e[sd])?|resolve[sd]?)[ \t]*:?[ \t]*#[0-9]+' "$bf" \
      | grep -oE '#[0-9]+' | tr -d '#' || true)"
  fi
  # force-extra: add a number.
  if [[ -f "$TREE/force-extra" ]]; then
    set="$set
$(cat "$TREE/force-extra")"
  fi
  # force-drop: remove a number.
  if [[ -f "$TREE/force-drop" ]]; then
    local drop
    drop="$(cat "$TREE/force-drop")"
    set="$(printf '%s\n' "$set" | grep -vxF "$drop" || true)"
  fi
  printf '%s\n' "$set" | grep -E '^[0-9]+$' | sort -n -u > "$TREE/close-set.txt" || true
}

case "$1 $2" in
  "pr create")
    cp "$body_file" "$TREE/last-body.txt"
    write_close_set "$body_file"
    echo "https://github.com/natb1/commons.systems/pull/1500"
    ;;
  "api -X")
    # #2256: the body re-apply after a stray-keyword strip now goes through
    # gh_issue_edit_rest → `gh api -X PATCH repos/.../issues/<PR_NUM> -F body=@<file>`.
    # Behave like the old `pr edit` branch: refresh last-body.txt and re-derive the
    # close set from the corrected body (so the re-verify `pr view` sees it), and
    # log the full argv to the shared REST PATCH sentinel.
    echo "$*" >> "$TREE/gh-issue-close-rest-calls.log"
    cp "$body_file" "$TREE/last-body.txt"
    write_close_set "$body_file"
    echo '{}'
    ;;
  "pr view")
    if [[ -f "$TREE/close-set.txt" ]]; then
      cat "$TREE/close-set.txt"
    fi
    ;;
  *)
    echo "gh stub: unknown invocation: $*" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/gh"

  SAVED_PATH_OP="$PATH"
  export PATH="$TMPDIR_TEST/bin:$PATH"
}

open_pr_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  export PATH="$SAVED_PATH_OP"
}

# CASE 1 — clean single close: prose-only body file, no --closes.
open_pr_setup
echo "Some descriptive prose." > "$TMPDIR_TEST/body.txt"
out=$("$TMPDIR_TEST/scripts/dispatch-open-pr" 1119 --title "t" --body-file "$TMPDIR_TEST/body.txt" 2>/dev/null) && rc=0 || rc=$?
assert_eq "open-pr: clean single close → stdout PR number" "1500" "$out"
assert_eq "open-pr: clean single close → rc 0" "0" "$rc"
open_pr_teardown

# CASE 2 — multi-close + normalization ("1120, #1121").
open_pr_setup
echo "Body prose." > "$TMPDIR_TEST/body.txt"
out=$("$TMPDIR_TEST/scripts/dispatch-open-pr" 1119 --title "t" --closes "1120, #1121" --body-file "$TMPDIR_TEST/body.txt" 2>/dev/null) && rc=0 || rc=$?
assert_eq "open-pr: multi-close → stdout PR number" "1500" "$out"
assert_eq "open-pr: multi-close → rc 0" "0" "$rc"
close_set="$(cat "$TMPDIR_TEST/close-set.txt")"
assert_eq "open-pr: multi-close → close set is the three numbers" "$(printf '1119\n1120\n1121')" "$close_set"
assert_eq "open-pr: multi-close → body has Closes #1119" "1" "$(grep -cxF 'Closes #1119' "$TMPDIR_TEST/last-body.txt")"
assert_eq "open-pr: multi-close → body has Closes #1120" "1" "$(grep -cxF 'Closes #1120' "$TMPDIR_TEST/last-body.txt")"
assert_eq "open-pr: multi-close → body has Closes #1121" "1" "$(grep -cxF 'Closes #1121' "$TMPDIR_TEST/last-body.txt")"
open_pr_teardown

# CASE 3 — stray "fixes #999" in prose → corrected via edit.
open_pr_setup
printf 'This change also fixes #999 in passing.\n' > "$TMPDIR_TEST/body.txt"
out=$("$TMPDIR_TEST/scripts/dispatch-open-pr" 1119 --title "t" --body-file "$TMPDIR_TEST/body.txt" 2>/dev/null) && rc=0 || rc=$?
assert_eq "open-pr: stray fixes #999 → stdout PR number" "1500" "$out"
assert_eq "open-pr: stray fixes #999 → rc 0" "0" "$rc"
# #2256: the re-apply now fires a REST PATCH .../issues/<PR_NUM> (PR #1500), not the
# old porcelain `pr edit`. Assert the PATCH sentinel fired against the PR number.
assert_eq "open-pr: stray fixes #999 → a REST PATCH re-apply occurred" "1" "$([[ -s "$TMPDIR_TEST/gh-issue-close-rest-calls.log" ]] && echo 1 || echo 0)"
assert_eq "open-pr: stray fixes #999 → PATCH targets issues/1500" "1" "$([ -f "$TMPDIR_TEST/gh-issue-close-rest-calls.log" ] && grep -q 'issues/1500' "$TMPDIR_TEST/gh-issue-close-rest-calls.log" && echo 1 || echo 0)"
assert_eq "open-pr: stray fixes #999 → final close set is just 1119" "1119" "$(cat "$TMPDIR_TEST/close-set.txt")"
assert_eq "open-pr: stray fixes #999 → keyword stripped from corrected body" "0" "$(grep -cE '(close[sd]?|fix(e[sd])?|resolve[sd]?)[ \t]*:?[ \t]*#999' "$TMPDIR_TEST/last-body.txt" || true)"
open_pr_teardown

# CASE 4 — force-extra=777: an extra the script cannot strip (no keyword in body
# produces it) → correction fails, rc non-zero, stderr names 777.
open_pr_setup
echo "Body prose." > "$TMPDIR_TEST/body.txt"
echo 777 > "$TMPDIR_TEST/force-extra"
out=$("$TMPDIR_TEST/scripts/dispatch-open-pr" 1119 --title "t" --body-file "$TMPDIR_TEST/body.txt" 2>"$TMPDIR_TEST/err.txt") && rc=0 || rc=$?
assert_eq "open-pr: unresolvable extra → rc non-zero" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "open-pr: unresolvable extra → stderr names 777" "1" "$(grep -c '777' "$TMPDIR_TEST/err.txt")"
open_pr_teardown

# CASE 5 — force-drop=1119: an intended number missing → rc non-zero, stderr
# names 1119.
open_pr_setup
echo "Body prose." > "$TMPDIR_TEST/body.txt"
echo 1119 > "$TMPDIR_TEST/force-drop"
out=$("$TMPDIR_TEST/scripts/dispatch-open-pr" 1119 --title "t" --body-file "$TMPDIR_TEST/body.txt" 2>"$TMPDIR_TEST/err.txt") && rc=0 || rc=$?
assert_eq "open-pr: missing intended → rc non-zero" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "open-pr: missing intended → stderr names 1119" "1" "$(grep -c '1119' "$TMPDIR_TEST/err.txt")"
open_pr_teardown

# CASE 6 — prose via stdin (no --body-file).
open_pr_setup
out=$(echo "some prose" | "$TMPDIR_TEST/scripts/dispatch-open-pr" 1119 --title t 2>/dev/null) && rc=0 || rc=$?
assert_eq "open-pr: stdin prose → stdout PR number" "1500" "$out"
assert_eq "open-pr: stdin prose → rc 0" "0" "$rc"
assert_eq "open-pr: stdin prose → close set is 1119" "1119" "$(cat "$TMPDIR_TEST/close-set.txt")"
open_pr_teardown

# CASE 7 — usage errors.
open_pr_setup
out=$("$TMPDIR_TEST/scripts/dispatch-open-pr" --title t 2>/dev/null) && rc=0 || rc=$?
assert_eq "open-pr: missing primary → rc non-zero" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
out=$("$TMPDIR_TEST/scripts/dispatch-open-pr" abc --title t 2>/dev/null) && rc=0 || rc=$?
assert_eq "open-pr: non-numeric primary → rc non-zero" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
out=$("$TMPDIR_TEST/scripts/dispatch-open-pr" 1119 2>/dev/null) && rc=0 || rc=$?
assert_eq "open-pr: missing --title → rc non-zero" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
open_pr_teardown

# CASE 8 — primary repeated in --closes is deduped to a single Closes line.
open_pr_setup
echo "Body prose." > "$TMPDIR_TEST/body.txt"
out=$("$TMPDIR_TEST/scripts/dispatch-open-pr" 1119 --title "t" --closes "1119 1120" --body-file "$TMPDIR_TEST/body.txt" 2>/dev/null) && rc=0 || rc=$?
assert_eq "open-pr: dedup primary → stdout PR number" "1500" "$out"
assert_eq "open-pr: dedup primary → rc 0" "0" "$rc"
assert_eq "open-pr: dedup primary → exactly one Closes #1119 line" "1" "$(grep -cxF 'Closes #1119' "$TMPDIR_TEST/last-body.txt")"
assert_eq "open-pr: dedup primary → close set is 1119 1120" "$(printf '1119\n1120')" "$(cat "$TMPDIR_TEST/close-set.txt")"
open_pr_teardown

# ============================================================================
# dispatch-open-pr — PR backfill into the per-session sidecar (#1861)
# ============================================================================
# dispatch-open-pr resolves its sibling dispatch-stamp-session via its own
# SCRIPT_DIR. Running the REAL "$SCRIPT_DIR/dispatch-open-pr" (not a copy) means
# that sibling resolves to the real script, so the backfill actually runs. Each
# case is a self-contained subshell that (a) puts a gh stub first on PATH and
# (b) sets CLAUDE_CODE_SESSION_ID + DISPATCH_STAMP_PROJECTS_ROOT so the backfill
# targets a seeded fake sidecar. The backfill needs only find/jq (no git), so no
# fake git repo is required. Env exports are scoped per-subshell — teardown()
# untouched. The gh stub keeps the two numbers DISTINCT: `pr create` returns a
# URL whose basename is 4242 (the PR number), while `pr view` prints 1861 (the
# primary issue), so the exact-match branch fires on pass 1 (no `pr edit`) and a
# sidecar `.pr == 4242` proves the backfill wrote the PR number, not the issue.
echo ""
echo "=== dispatch-open-pr backfill (#1861) ==="

OPENPR="$SCRIPT_DIR/dispatch-open-pr"

open_pr_backfill_gh_stub() {
  # $1 = bin dir to write the stub into.
  cat > "$1/gh" <<'STUB'
#!/usr/bin/env bash
case "$1 $2" in
  "pr create")
    # Basename of the URL is the PR number.
    echo "https://github.com/natb1/commons.systems/pull/4242"
    ;;
  "pr view")
    # The intended close set is the primary issue 1861 only — print it so the
    # exact-match branch in dispatch-open-pr fires immediately.
    echo "1861"
    ;;
  *)
    echo "gh stub: unknown invocation: $*" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$1/gh"
}

# 1. Backfill on PR open: the seeded sidecar's .pr is set to the PR number, and
#    stdout is the BARE PR number only.
(
  bin=$(mktemp -d)
  root=$(mktemp -d)
  open_pr_backfill_gh_stub "$bin"
  mkdir -p "$root/projdir"
  sc="$root/projdir/sessP.dispatch-stamp.json"
  printf '%s\n' '{"schema":1,"session_id":"sessP","repo":"natb1/commons.systems","issue":1861,"pr":null,"branch":"1861-x","base_sha":"abc123","stamped_at":"2026-01-01T00:00:00Z"}' > "$sc"
  body=$(mktemp)
  echo "Body prose." > "$body"
  export PATH="$bin:$PATH"
  export CLAUDE_CODE_SESSION_ID=sessP
  export DISPATCH_STAMP_PROJECTS_ROOT="$root"
  rc=0
  out=$("$OPENPR" 1861 --title "t" --body-file "$body" 2>/dev/null) || rc=$?
  assert_eq "open-pr backfill: rc 0" "0" "$rc"
  assert_eq "open-pr backfill: stdout is bare PR number only" "4242" "$out"
  assert_eq "open-pr backfill: sidecar .pr set to PR number" "4242" "$(jq -r .pr "$sc")"
  rm -rf "$bin" "$root" "$body"
)

# 2. Missing-sidecar run is non-fatal: PR creation is unaffected by the backfill
#    miss — still rc 0 and the bare PR number on stdout.
(
  bin=$(mktemp -d)
  root=$(mktemp -d)
  open_pr_backfill_gh_stub "$bin"
  body=$(mktemp)
  echo "Body prose." > "$body"
  export PATH="$bin:$PATH"
  export CLAUDE_CODE_SESSION_ID=no-such-session
  export DISPATCH_STAMP_PROJECTS_ROOT="$root"
  rc=0
  out=$("$OPENPR" 1861 --title "t" --body-file "$body" 2>/dev/null) || rc=$?
  assert_eq "open-pr backfill: missing sidecar → rc 0" "0" "$rc"
  assert_eq "open-pr backfill: missing sidecar → bare PR number on stdout" "4242" "$out"
  rm -rf "$bin" "$root" "$body"
)

# <<< END MOVED <<<

report_results
