#!/usr/bin/env bash
# Tests for dispatch-escalate-sync-broken -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 21047-21318.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# === #1546: direct dispatch-escalate-sync-broken body-content tests ===
# ============================================================================
# Invokes the REAL dispatch-escalate-sync-broken (by absolute path) with git and
# gh PATH-shimmed. The git shim feeds fixed diagnostics; the gh shim captures the
# composed --title and --body-file contents so the test can inspect the body the
# script wrote. Exercises both the CREATE path (no open latch) and the EDIT path
# (an existing latch number), and the --reason parametrization (#1546).

ESB_SCRIPT="$SCRIPT_DIR/dispatch-escalate-sync-broken"
ESB_TMPDIR=""
ESB_CAPTURE=""
ESB_STUB_DIR=""

esb_setup() {
  ESB_TMPDIR=$(mktemp -d)
  ESB_CAPTURE="$ESB_TMPDIR/capture"
  # #2256: REST sentinel logs live alongside the capture dir. The gh stub records
  # the full argv of each `gh api` mutation here so the migrated PATCH/POST calls
  # can be asserted (mirrors the shared stub's gh-issue-*-rest-calls.log files).
  ESB_STUB_DIR="$ESB_TMPDIR/stub"
  mkdir -p "$ESB_TMPDIR/bin" "$ESB_CAPTURE" "$ESB_STUB_DIR"

  # git shim: fixed diagnostics for the three queries the script runs.
  cat > "$ESB_TMPDIR/bin/git" <<'STUB'
#!/usr/bin/env bash
case "$*" in
  "rev-parse --show-toplevel")          echo "/fake/main/worktree" ;;
  "status --porcelain")                 echo " M somefile" ;;
  "log --oneline origin/main..HEAD")    echo "deadbee some local commit" ;;
  *)                                    exit 0 ;;
esac
STUB
  chmod +x "$ESB_TMPDIR/bin/git"

  # gh shim: the script now drives the REST helpers gh_issue_edit_rest /
  # gh_issue_create_rest (#2256), which call `gh api -X PATCH|POST ... -f title=...
  # -F body=@<file>`. This stub (a) copies the body to capture/body.txt and the
  # title to capture/title.txt for the #1546 content assertions — keying on the
  # REST `-f title=` / `-F body=@` flags, NOT the old porcelain --title/--body-file
  # — and (b) logs each mutation's full argv to the shared REST sentinel files
  # (gh-issue-close-rest-calls.log for PATCH .../issues/<N>; gh-issue-create-rest-calls.log
  # for POST .../issues). `gh label create` is logged and exits 0 (or models
  # already-exists when $STUB_DIR/gh-label-exists is present). `gh api --paginate`
  # serves the find-or-create latch query (capture/existing.txt seeds an open latch).
  cat > "$ESB_TMPDIR/bin/gh" <<STUB
#!/usr/bin/env bash
CAP="$ESB_CAPTURE"
STUB_DIR="$ESB_STUB_DIR"
STUB
  cat >> "$ESB_TMPDIR/bin/gh" <<'STUB'
args="$*"
# Pull title=<val> (from `-f title=...`) and body=@<path> (from `-F body=@...`)
# out of the argv; capture their values for the body-content assertions.
for a in "$@"; do
  case "$a" in
    title=*)  printf '%s' "${a#title=}" > "$CAP/title.txt" ;;
    body=@*)  bf="${a#body=@}"; [[ -f "$bf" ]] && cat "$bf" > "$CAP/body.txt" ;;
  esac
done
case "$args" in
  "api --paginate"*)
    # gh_issue_list_rest uses REST: gh api --paginate repos/{owner}/{repo}/issues?...
    # Return the open-latch number if seeded; absent file means no open latch.
    # gh_issue_list_rest remaps from snake_case REST to camelCase; serve snake_case.
    if [[ -f "$CAP/existing.txt" ]]; then
      num=$(cat "$CAP/existing.txt")
      printf '[{"number":%s,"pull_request":null,"created_at":"2026-01-01T00:00:00Z","closed_at":null,"labels":[]}]' "$num"
    else
      echo '[]'
    fi
    exit 0
    ;;
  "api -X PATCH "*/issues/[0-9]*)
    # gh_issue_edit_rest sentinel: PATCH .../issues/<N> (EDIT path).
    echo "$args" >> "$STUB_DIR/gh-issue-close-rest-calls.log"
    echo '{}'
    ;;
  "api -X POST "*/issues\ *)
    # gh_issue_create_rest sentinel: POST .../issues (CREATE path). The helper pipes
    # the response through `jq -r .html_url`, so emit JSON carrying html_url; the
    # script's ${create_out##*/} then yields the bare trailing number (123).
    echo "$args" >> "$STUB_DIR/gh-issue-create-rest-calls.log"
    echo '{"html_url":"https://github.com/x/y/issues/123"}'
    ;;
  "label create"*)
    # Ensure-first latch-label create. Log the argv; model already-exists when the
    # marker is present (the script must tolerate it and still create the issue).
    echo "$args" >> "$STUB_DIR/gh-label-create.log"
    if [[ -f "$STUB_DIR/gh-label-exists" ]]; then
      echo "gh: Validation Failed (HTTP 422): already_exists" >&2
      exit 1
    fi
    if [[ -f "$STUB_DIR/gh-fail-label-create" ]]; then
      echo "gh: could not create label (HTTP 500): Internal Server Error" >&2
      exit 1
    fi
    ;;
  *)
    echo "gh stub (esb): unknown invocation: $*" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$ESB_TMPDIR/bin/gh"

  export PATH="$ESB_TMPDIR/bin:$SAVED_PATH"
  # Use plain mktemp inside the script (no CLAUDE_JOB_DIR tmp subtree needed).
  unset CLAUDE_JOB_DIR
}

esb_teardown() {
  export PATH="$SAVED_PATH"
  rm -rf "$ESB_TMPDIR"
  ESB_TMPDIR="" ; ESB_CAPTURE="" ; ESB_STUB_DIR=""
}

# Reset just the capture dir between runs within one setup.
esb_reset_capture() {
  rm -rf "$ESB_CAPTURE"
  mkdir -p "$ESB_CAPTURE"
}

# --- AC4 + AC3: fetch-failed body (CREATE path) ------------------------------
echo "Test: dispatch-escalate-sync-broken --reason fetch-failed body content (#1546)"
esb_setup
# No existing.txt → list returns empty → CREATE path.
ISSUE_NUM=$(printf '%s' "fatal: unable to access origin: Could not resolve host" \
  | "$ESB_SCRIPT" --reason fetch-failed) || ISSUE_NUM="ERR"
assert_eq "fetch-failed: issue number parsed from create URL" "123" "$ISSUE_NUM"
BODY=$(cat "$ESB_CAPTURE/body.txt" 2>/dev/null || true)
TITLE=$(cat "$ESB_CAPTURE/title.txt" 2>/dev/null || true)
assert_eq "fetch-failed body: states no merge was attempted" "1" \
  "$(grep -ciF 'no merge was attempted' <<<"$BODY" || true)"
assert_eq "fetch-failed body: no 'diverge' token" "0" \
  "$(grep -ic 'diverge' <<<"$BODY" || true)"
assert_eq "fetch-failed body: no 'conflict' token" "0" \
  "$(grep -ic 'conflict' <<<"$BODY" || true)"
assert_eq "fetch-failed body: no merge-stderr section header" "0" \
  "$(grep -cF 'git merge --ff-only origin/main (captured stderr)' <<<"$BODY" || true)"
assert_eq "fetch-failed body: no git-log divergence section" "0" \
  "$(grep -cF 'git log --oneline origin/main..HEAD' <<<"$BODY" || true)"
assert_eq "fetch-failed body: has fetch-stderr section header" "1" \
  "$(grep -cF '## git fetch origin main (captured stderr)' <<<"$BODY" || true)"
assert_eq "fetch-failed title: 'cannot reach origin/main'" "1" \
  "$(grep -cF 'cannot reach origin/main' <<<"$TITLE" || true)"
esb_teardown

# --- AC2: merge-failed body retains divergence language (CREATE path) ---------
echo "Test: dispatch-escalate-sync-broken --reason merge-failed body content (#1546)"
esb_setup
ISSUE_NUM=$(printf '%s' "CONFLICT (content): Merge conflict in foo" \
  | "$ESB_SCRIPT" --reason merge-failed) || ISSUE_NUM="ERR"
assert_eq "merge-failed: issue number parsed from create URL" "123" "$ISSUE_NUM"
BODY=$(cat "$ESB_CAPTURE/body.txt" 2>/dev/null || true)
TITLE=$(cat "$ESB_CAPTURE/title.txt" 2>/dev/null || true)
assert_eq "merge-failed body: has git-log divergence section" "1" \
  "$(grep -cF 'git log --oneline origin/main..HEAD (local divergence)' <<<"$BODY" || true)"
assert_eq "merge-failed body: has merge-stderr section header" "1" \
  "$(grep -cF 'git merge --ff-only origin/main (captured stderr)' <<<"$BODY" || true)"
assert_eq "merge-failed body: retains divergence language" "1" \
  "$([ "$(grep -ic diverge <<<"$BODY")" -ge 1 ] && echo 1 || echo 0)"
assert_eq "merge-failed title: 'cannot ff-merge origin/main'" "1" \
  "$(grep -cF 'cannot ff-merge origin/main' <<<"$TITLE" || true)"
esb_teardown

# --- Edit-path: --title is passed on the edit path too (existing latch) -------
echo "Test: dispatch-escalate-sync-broken edit path passes --title (#1546)"
esb_setup
printf '99\n' > "$ESB_CAPTURE/existing.txt"   # an open latch → EDIT path
EDIT_NUM=$(printf '%s' "fatal: unable to access origin" \
  | "$ESB_SCRIPT" --reason fetch-failed) || EDIT_NUM="ERR"
assert_eq "edit-path: existing issue number echoed" "99" "$EDIT_NUM"
TITLE=$(cat "$ESB_CAPTURE/title.txt" 2>/dev/null || true)
assert_eq "edit-path title: fetch-failed 'cannot reach origin/main'" "1" \
  "$(grep -cF 'cannot reach origin/main' <<<"$TITLE" || true)"
esb_teardown

# --- #2256: EDIT path fires a REST PATCH .../issues/<existing> carrying title+body
# The migrated edit drives gh_issue_edit_rest → `gh api -X PATCH repos/.../issues/99`.
# Assert the PATCH sentinel fired against the existing number, and that the title
# and body (from the --body-file the script composed) were both captured.
echo "Test: dispatch-escalate-sync-broken edit path → REST PATCH .../issues/<existing> (#2256)"
esb_setup
printf '99\n' > "$ESB_CAPTURE/existing.txt"   # an open latch → EDIT path
EDIT_NUM=$(printf '%s' "fatal: unable to access origin" \
  | "$ESB_SCRIPT" --reason fetch-failed) || EDIT_NUM="ERR"
assert_eq "edit-rest: existing issue number echoed" "99" "$EDIT_NUM"
EDIT_LOG="$ESB_STUB_DIR/gh-issue-close-rest-calls.log"
assert_eq "edit-rest: PATCH fired" "1" \
  "$([ -f "$EDIT_LOG" ] && grep -q 'PATCH' "$EDIT_LOG" && echo 1 || echo 0)"
assert_eq "edit-rest: PATCH targets issues/99" "1" \
  "$([ -f "$EDIT_LOG" ] && grep -q 'issues/99' "$EDIT_LOG" && echo 1 || echo 0)"
TITLE=$(cat "$ESB_CAPTURE/title.txt" 2>/dev/null || true)
BODY=$(cat "$ESB_CAPTURE/body.txt" 2>/dev/null || true)
assert_eq "edit-rest: PATCH carried the title" "1" \
  "$(grep -cF 'cannot reach origin/main' <<<"$TITLE" || true)"
assert_eq "edit-rest: PATCH carried the body (fetch-stderr section)" "1" \
  "$(grep -cF '## git fetch origin main (captured stderr)' <<<"$BODY" || true)"
esb_teardown

# --- #2256: CREATE path fires a REST POST .../issues with the latch labels -------
# The migrated create drives gh_issue_create_rest → `gh api -X POST repos/.../issues
# -f title=... -F body=@<file> -f labels[]=dispatch:sync-broken -f labels[]=bug
# -f labels[]=priority`. Assert the POST sentinel fired carrying body=@ (the
# --body-file flag) and all three labels, and that stdout is the parsed number.
echo "Test: dispatch-escalate-sync-broken create path → REST POST .../issues with labels (#2256)"
esb_setup
# No existing.txt → list empty → CREATE path. No gh-label-exists marker → label
# create succeeds.
ISSUE_NUM=$(printf '%s' "CONFLICT (content): Merge conflict in foo" \
  | "$ESB_SCRIPT" --reason merge-failed) || ISSUE_NUM="ERR"
assert_eq "create-rest: stdout is the parsed issue number" "123" "$ISSUE_NUM"
CREATE_LOG="$ESB_STUB_DIR/gh-issue-create-rest-calls.log"
assert_eq "create-rest: POST fired" "1" \
  "$([ -f "$CREATE_LOG" ] && grep -q 'POST' "$CREATE_LOG" && echo 1 || echo 0)"
assert_eq "create-rest: POST carried body=@ (--body-file)" "1" \
  "$([ -f "$CREATE_LOG" ] && grep -q -- '-F body=@' "$CREATE_LOG" && echo 1 || echo 0)"
assert_eq "create-rest: POST carried labels[]=dispatch:sync-broken" "1" \
  "$([ -f "$CREATE_LOG" ] && grep -q 'labels\[\]=dispatch:sync-broken' "$CREATE_LOG" && echo 1 || echo 0)"
assert_eq "create-rest: POST carried labels[]=bug" "1" \
  "$([ -f "$CREATE_LOG" ] && grep -q 'labels\[\]=bug' "$CREATE_LOG" && echo 1 || echo 0)"
assert_eq "create-rest: POST carried labels[]=priority" "1" \
  "$([ -f "$CREATE_LOG" ] && grep -q 'labels\[\]=priority' "$CREATE_LOG" && echo 1 || echo 0)"
esb_teardown

# --- #2256 REGRESSION GUARD: latch label initially ABSENT --------------------
# This is the exact regression this unit must not introduce: REST POST /issues
# silently drops an unknown label[], so the latch could be created WITHOUT its
# dispatch:sync-broken label. The ensure-first restructure prevents that by
# running `gh label create` BEFORE the create. With NO gh-label-exists marker the
# stub's `label create` SUCCEEDS (models the label being absent and then created);
# assert that (a) `gh label create dispatch:sync-broken` was invoked, and (b) the
# created issue STILL carries labels[]=dispatch:sync-broken in the POST.
echo "Test: dispatch-escalate-sync-broken create path with ABSENT latch label → label create + label retained (#2256)"
esb_setup
ISSUE_NUM=$(printf '%s' "CONFLICT (content): Merge conflict in foo" \
  | "$ESB_SCRIPT" --reason merge-failed) || ISSUE_NUM="ERR"
assert_eq "absent-label: create still succeeds (issue number)" "123" "$ISSUE_NUM"
LABEL_LOG="$ESB_STUB_DIR/gh-label-create.log"
assert_eq "absent-label: gh label create dispatch:sync-broken was invoked" "1" \
  "$([ -f "$LABEL_LOG" ] && grep -q 'label create dispatch:sync-broken' "$LABEL_LOG" && echo 1 || echo 0)"
CREATE_LOG="$ESB_STUB_DIR/gh-issue-create-rest-calls.log"
assert_eq "absent-label: created issue STILL carries labels[]=dispatch:sync-broken" "1" \
  "$([ -f "$CREATE_LOG" ] && grep -q 'labels\[\]=dispatch:sync-broken' "$CREATE_LOG" && echo 1 || echo 0)"
esb_teardown

# --- #2256: latch label ALREADY EXISTS → already-exists tolerated, no abort ----
# The ensure-first idiom tolerates only an already-exists error from `gh label
# create`. With the gh-label-exists marker the stub emits gh's already-exists
# message and exits 1; the script must NOT abort and must still create the issue
# with the latch label.
echo "Test: dispatch-escalate-sync-broken create path with already-exists latch label → tolerated (#2256)"
esb_setup
: > "$ESB_STUB_DIR/gh-label-exists"   # `gh label create` returns already-exists (exit 1)
ISSUE_NUM=$(printf '%s' "CONFLICT (content): Merge conflict in foo" \
  | "$ESB_SCRIPT" --reason merge-failed) || ISSUE_NUM="ERR"
assert_eq "already-exists: create still succeeds (issue number)" "123" "$ISSUE_NUM"
CREATE_LOG="$ESB_STUB_DIR/gh-issue-create-rest-calls.log"
assert_eq "already-exists: created issue carries labels[]=dispatch:sync-broken" "1" \
  "$([ -f "$CREATE_LOG" ] && grep -q 'labels\[\]=dispatch:sync-broken' "$CREATE_LOG" && echo 1 || echo 0)"
esb_teardown

# --- Invalid --reason → clear nonzero error ----------------------------------
echo "Test: dispatch-escalate-sync-broken --reason bogus → nonzero, clear message (#1546)"
esb_setup
if "$ESB_SCRIPT" --reason bogus </dev/null 2>"$ESB_CAPTURE/err.txt"; then rc=0; else rc=$?; fi
assert_eq "invalid --reason: nonzero exit" "1" "$([ "$rc" -ne 0 ] && echo 1 || echo 0)"
assert_eq "invalid --reason: clear message mentions reason" "1" \
  "$(grep -ic 'reason' "$ESB_CAPTURE/err.txt" || true)"
esb_teardown

# <<< END MOVED <<<

report_results
