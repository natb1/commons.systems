#!/usr/bin/env bash
# Tests for dispatch-flake-dedup -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Originally mis-homed as a trailing block
# of test-dispatch-followup-exists.sh: in the monolith this section's '===' banner
# was indented two spaces, which the extractor's column-0 boundary detector missed,
# so it folded into the preceding dispatch-followup-exists section; this moves it
# to its own home. The body is unchanged, including its two-space indentation.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
  # ============================================================================
  # === dispatch-flake-dedup (#2337) ===
  # ============================================================================

  echo "Test: dispatch-flake-dedup"

  # Dedicated setup modeled on followup_exists_setup, but with a MUTATION-RECORDING
  # gh stub. dispatch-flake-dedup matches (via dispatch-followup-exists) AND records
  # the recurrence (comment on open; reopen+comment on closed). stdout alone does
  # not prove the mutation fired, so the stub records side effects to marker files
  # the cases assert on:
  #   - comments-fired : one <N> per POST .../issues/<N>/comments
  #   - reopen-fired   : one <N> per PATCH .../issues/<N> carrying state=open
  # The issue LIST (followup-exists match) and the single-issue VIEW (state read)
  # both derive from the same $TREE/issues.json fixture, which carries a per-issue
  # `state` field (open/closed).
  flake_dedup_setup() {
    TMPDIR_TEST=$(mktemp -d)
    mkdir -p "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/bin" "$TMPDIR_TEST/scripts/stub"

    cp "$SCRIPT_DIR/dispatch-flake-dedup" "$TMPDIR_TEST/scripts/dispatch-flake-dedup"
    cp "$SCRIPT_DIR/dispatch-followup-exists" "$TMPDIR_TEST/scripts/dispatch-followup-exists"
    cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/lib.sh"
    chmod +x "$TMPDIR_TEST/scripts/dispatch-flake-dedup" \
             "$TMPDIR_TEST/scripts/dispatch-followup-exists"

    # gh_retry must not sleep (no retries are expected here, but be safe).
    export GH_RETRY_BASE_DELAY=0

    cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
args="$*"
TREE="$(cd "$(dirname "$0")/.." && pwd)/scripts"
MARK="$TREE/stub"
case "$args" in
  *"api -X POST "*"/issues/"*"/comments"*)
    # recurrence comment (open path, and the comment leg of the reopen path)
    n=$(printf '%s' "$args" | sed -E 's#.*/issues/([0-9]+)/comments.*#\1#')
    echo "$n" >> "$MARK/comments-fired"
    echo '{}'
    ;;
  *"api -X PATCH "*"/issues/"[0-9]*)
    # reopen: PATCH .../issues/<N> with state=open
    case "$args" in
      *state=open*)
        n=$(printf '%s' "$args" | sed -E 's#.*/issues/([0-9]+).*#\1#')
        echo "$n" >> "$MARK/reopen-fired"
        ;;
    esac
    echo '{}'
    ;;
  *"run view "*)
    # gh_run_view_rest: `gh run view <id> --json createdAt,headSha` (porcelain,
    # no `api` token → no collision with the api globs). Emit the run.json fixture.
    if [[ -f "$TREE/run.json" ]]; then cat "$TREE/run.json"; else echo '{}'; fi
    ;;
  *"api "*"/compare/"*)
    # gh_commit_is_ancestor_rest: `gh api .../compare/<base>...<head>`. Wrap the
    # one-word compare-status fixture as {"status":"<word>"}; jq reads .status.
    printf '{"status":"%s"}\n' "$(cat "$TREE/compare-status" 2>/dev/null)"
    ;;
  *"api "*"/issues/"*"/timeline"*)
    # gh_issue_closing_commit_rest: `gh api .../issues/<N>/timeline`. MUST precede
    # the VIEW glob below — `[0-9]*` matches `501/timeline`, swallowing this call.
    if [[ -f "$TREE/timeline.json" ]]; then cat "$TREE/timeline.json"; else echo '[]'; fi
    ;;
  *"api "*"/issues/"[0-9]*)
    # single-issue VIEW (gh_issue_view_rest): emit a raw REST object from the
    # fixture issue carrying its lowercase state plus snake_case closed_at /
    # state_reason; the helper upcases state/state_reason and maps closed_at →
    # closedAt for the stale-head gate to read.
    n="${args##*/}"
    jq -c --argjson n "$n" '.[] | select(.number==$n) | {number, state, closed_at: (.closed_at // null), state_reason: (.state_reason // null)}' "$TREE/issues.json"
    ;;
  *"api "*"/issues"*)
    # issue LIST (gh_issue_list_rest via dispatch-followup-exists): whole fixture,
    # remapped to REST shape WITH title (the script passes --include-title).
    if [[ -f "$TREE/issues.json" ]]; then
      jq 'map({number, pull_request: null, created_at: null, closed_at: null, labels: []} + (if has("title") then {title} else {} end))' "$TREE/issues.json"
    else
      echo '[]'
    fi
    ;;
  *)
    echo "gh stub: unknown invocation: $args" >&2
    exit 1
    ;;
esac
STUB
    chmod +x "$TMPDIR_TEST/bin/gh"

    SAVED_PATH_FD="$PATH"
    export PATH="$TMPDIR_TEST/bin:$PATH"
  }

  flake_dedup_teardown() {
    rm -rf "$TMPDIR_TEST"
    TMPDIR_TEST=""
    unset GH_RETRY_BASE_DELAY
    export PATH="$SAVED_PATH_FD"
  }

  FP="acceptance — fellspiral/e2e/navigation.spec.ts:4:3 page loads without JS errors @smoke"

  # CASE 1 — OPEN match → EXISTING <N>, comment fired, no reopen. (criterion #2)
  flake_dedup_setup
  printf '[{"number":501,"title":"Flaky CI: %s","state":"open"}]\n' "$FP" > "$TMPDIR_TEST/scripts/issues.json"
  printf 'recurred on PR #900 / run http://x\n' > "$TMPDIR_TEST/body.md"
  out=$("$TMPDIR_TEST/scripts/dispatch-flake-dedup" "$FP" --body-file "$TMPDIR_TEST/body.md")
  assert_eq "flake-dedup: open match → EXISTING <N>" "EXISTING 501" "$out"
  if grep -qx '501' "$TMPDIR_TEST/scripts/stub/comments-fired" 2>/dev/null; then c=yes; else c=no; fi
  assert_eq "flake-dedup: open match → comment fired on 501" "yes" "$c"
  if [[ -s "$TMPDIR_TEST/scripts/stub/reopen-fired" ]]; then r=yes; else r=no; fi
  assert_eq "flake-dedup: open match → no reopen" "no" "$r"
  flake_dedup_teardown

  # CASE 2 — CLOSED match, FRESH run → REOPENED <N>, reopen fired, comment fired.
  # (criterion #3) Under the stale-head gate (#2442, #2518) the CLOSED path requires
  # --run-id. Fresh = a real closing commit is present and the run head contains it
  # (ancestry `identical`), so the gate falls through to reopen.
  flake_dedup_setup
  printf '[{"number":501,"title":"Flaky CI: %s","state":"closed","closed_at":"2026-01-01T00:00:00Z"}]\n' "$FP" > "$TMPDIR_TEST/scripts/issues.json"
  printf '{"createdAt":"2026-02-01T00:00:00Z","headSha":"headsha"}\n' > "$TMPDIR_TEST/scripts/run.json"
  printf 'identical\n' > "$TMPDIR_TEST/scripts/compare-status"
  printf '[{"event":"closed","commit_id":"closingsha"}]\n' > "$TMPDIR_TEST/scripts/timeline.json"
  printf 'recurred on PR #900 / run http://x\n' > "$TMPDIR_TEST/body.md"
  out=$("$TMPDIR_TEST/scripts/dispatch-flake-dedup" "$FP" --body-file "$TMPDIR_TEST/body.md" --run-id 12345)
  assert_eq "flake-dedup: closed match, fresh run → REOPENED <N>" "REOPENED 501" "$out"
  if grep -qx '501' "$TMPDIR_TEST/scripts/stub/reopen-fired" 2>/dev/null; then r=yes; else r=no; fi
  assert_eq "flake-dedup: closed match, fresh run → reopen fired on 501" "yes" "$r"
  if grep -qx '501' "$TMPDIR_TEST/scripts/stub/comments-fired" 2>/dev/null; then c=yes; else c=no; fi
  assert_eq "flake-dedup: closed match, fresh run → comment fired on 501" "yes" "$c"
  flake_dedup_teardown

  # CASE 3 — NO match → NONE, no side effects. (criterion #5)
  flake_dedup_setup
  printf '[]\n' > "$TMPDIR_TEST/scripts/issues.json"
  printf 'recurred on PR #900 / run http://x\n' > "$TMPDIR_TEST/body.md"
  out=$("$TMPDIR_TEST/scripts/dispatch-flake-dedup" "$FP" --body-file "$TMPDIR_TEST/body.md")
  assert_eq "flake-dedup: no match → NONE" "NONE" "$out"
  if [[ -s "$TMPDIR_TEST/scripts/stub/comments-fired" ]]; then c=yes; else c=no; fi
  assert_eq "flake-dedup: no match → no comment" "no" "$c"
  if [[ -s "$TMPDIR_TEST/scripts/stub/reopen-fired" ]]; then r=yes; else r=no; fi
  assert_eq "flake-dedup: no match → no reopen" "no" "$r"
  flake_dedup_teardown

  # CASE 4 — canonical-title match: title is exactly `Flaky CI: <fp>`, probe <fp>
  # (the deterministic half of criterion #4 — run 2 matches run 1's canonical title).
  flake_dedup_setup
  printf '[{"number":777,"title":"Flaky CI: %s","state":"open"}]\n' "$FP" > "$TMPDIR_TEST/scripts/issues.json"
  printf 'recurred\n' > "$TMPDIR_TEST/body.md"
  out=$("$TMPDIR_TEST/scripts/dispatch-flake-dedup" "$FP" --body-file "$TMPDIR_TEST/body.md")
  assert_eq "flake-dedup: canonical-title match → EXISTING <N>" "EXISTING 777" "$out"
  flake_dedup_teardown

  # === STALE-HEAD REOPEN GATE (#2442) ===

  # CASE 5 — recency removed → REOPEN (#2518): run.createdAt is BEFORE closed_at
  # (the old recency floor would have tripped STALE here) but the run head
  # contains the closing fix (ancestry `identical`, real closing commit present).
  # Ancestry-only is decisive, so this REOPENs. This is exactly the case the
  # removed recency floor wrongly suppressed: it fails under the old recency code
  # (which would emit STALE) and passes under ancestry-only.
  flake_dedup_setup
  printf '[{"number":501,"title":"Flaky CI: %s","state":"closed","closed_at":"2026-02-01T00:00:00Z"}]\n' "$FP" > "$TMPDIR_TEST/scripts/issues.json"
  printf '{"createdAt":"2026-01-01T00:00:00Z","headSha":"headsha"}\n' > "$TMPDIR_TEST/scripts/run.json"
  printf 'identical\n' > "$TMPDIR_TEST/scripts/compare-status"
  printf '[{"event":"closed","commit_id":"closingsha"}]\n' > "$TMPDIR_TEST/scripts/timeline.json"
  printf 'recurred on PR #900 / run http://x\n' > "$TMPDIR_TEST/body.md"
  out=$("$TMPDIR_TEST/scripts/dispatch-flake-dedup" "$FP" --body-file "$TMPDIR_TEST/body.md" --run-id 12345 2>"$TMPDIR_TEST/err")
  assert_eq "flake-dedup: recency removed (run pre-close, head contains fix) → REOPENED <N>" "REOPENED 501" "$out"
  if grep -qx '501' "$TMPDIR_TEST/scripts/stub/reopen-fired" 2>/dev/null; then r=yes; else r=no; fi
  assert_eq "flake-dedup: recency removed → reopen fired on 501" "yes" "$r"
  if grep -qx '501' "$TMPDIR_TEST/scripts/stub/comments-fired" 2>/dev/null; then c=yes; else c=no; fi
  assert_eq "flake-dedup: recency removed → comment fired on 501" "yes" "$c"
  if grep -q 'suppressing reopen' "$TMPDIR_TEST/err"; then g=yes; else g=no; fi
  assert_eq "flake-dedup: recency removed → no suppression logged" "no" "$g"
  flake_dedup_teardown

  # CASE 6 — STALE by ancestry (the surviving #2442 case): a real closing commit
  # exists and the run head is `behind` it, so ancestry — the sole decisive
  # signal — suppresses the reopen. run.createdAt is AFTER closed_at, which the
  # removed recency floor would have treated as fresh; the verdict is carried
  # entirely by ancestry. No comment, no reopen.
  flake_dedup_setup
  printf '[{"number":501,"title":"Flaky CI: %s","state":"closed","closed_at":"2026-01-01T00:00:00Z"}]\n' "$FP" > "$TMPDIR_TEST/scripts/issues.json"
  printf '{"createdAt":"2026-02-01T00:00:00Z","headSha":"headsha"}\n' > "$TMPDIR_TEST/scripts/run.json"
  printf 'behind\n' > "$TMPDIR_TEST/scripts/compare-status"
  printf '[{"event":"closed","commit_id":"closingsha"}]\n' > "$TMPDIR_TEST/scripts/timeline.json"
  printf 'recurred on PR #900 / run http://x\n' > "$TMPDIR_TEST/body.md"
  out=$("$TMPDIR_TEST/scripts/dispatch-flake-dedup" "$FP" --body-file "$TMPDIR_TEST/body.md" --run-id 12345)
  assert_eq "flake-dedup: stale by ancestry → STALE <N>" "STALE 501" "$out"
  if [[ -s "$TMPDIR_TEST/scripts/stub/comments-fired" ]]; then c=yes; else c=no; fi
  assert_eq "flake-dedup: stale by ancestry → no comment" "no" "$c"
  if [[ -s "$TMPDIR_TEST/scripts/stub/reopen-fired" ]]; then r=yes; else r=no; fi
  assert_eq "flake-dedup: stale by ancestry → no reopen" "no" "$r"
  flake_dedup_teardown

  # CASE 6b — STALE by ancestry via `diverged`. Identical to Case 6 except the
  # run head and the closing fix have DIVERGED (neither is an ancestor of the
  # other) rather than the head being plainly `behind`. The STALE gate is
  # `[[ "$status" == "behind" || "$status" == "diverged" ]]`; this pins the
  # `diverged` arm so a future edit that drops it is caught.
  flake_dedup_setup
  printf '[{"number":501,"title":"Flaky CI: %s","state":"closed","closed_at":"2026-01-01T00:00:00Z"}]\n' "$FP" > "$TMPDIR_TEST/scripts/issues.json"
  printf '{"createdAt":"2026-02-01T00:00:00Z","headSha":"headsha"}\n' > "$TMPDIR_TEST/scripts/run.json"
  printf 'diverged\n' > "$TMPDIR_TEST/scripts/compare-status"
  printf '[{"event":"closed","commit_id":"closingsha"}]\n' > "$TMPDIR_TEST/scripts/timeline.json"
  printf 'recurred on PR #900 / run http://x\n' > "$TMPDIR_TEST/body.md"
  out=$("$TMPDIR_TEST/scripts/dispatch-flake-dedup" "$FP" --body-file "$TMPDIR_TEST/body.md" --run-id 12345)
  assert_eq "flake-dedup: stale by ancestry (diverged) → STALE <N>" "STALE 501" "$out"
  if [[ -s "$TMPDIR_TEST/scripts/stub/comments-fired" ]]; then c=yes; else c=no; fi
  assert_eq "flake-dedup: stale by ancestry (diverged) → no comment" "no" "$c"
  if [[ -s "$TMPDIR_TEST/scripts/stub/reopen-fired" ]]; then r=yes; else r=no; fi
  assert_eq "flake-dedup: stale by ancestry (diverged) → no reopen" "no" "$r"
  flake_dedup_teardown

  # CASE 7 — null commit_id (manual close), the live incident (PR #1849 / tracker
  # #2481). timeline commit_id is null, so there is no closing commit and ancestry
  # leaves stale=0 → REOPEN; compare-status `behind` MUST be ignored. run.createdAt
  # is BEFORE closed_at — the run-before-close that the removed recency floor would
  # have suppressed as STALE (the infinite-STALE bug); under ancestry-only the
  # empty closing commit → REOPEN. This is the regression test the incident needs.
  flake_dedup_setup
  printf '[{"number":501,"title":"Flaky CI: %s","state":"closed","closed_at":"2026-02-01T00:00:00Z"}]\n' "$FP" > "$TMPDIR_TEST/scripts/issues.json"
  printf '{"createdAt":"2026-01-01T00:00:00Z","headSha":"headsha"}\n' > "$TMPDIR_TEST/scripts/run.json"
  printf 'behind\n' > "$TMPDIR_TEST/scripts/compare-status"
  printf '[{"event":"closed","commit_id":null}]\n' > "$TMPDIR_TEST/scripts/timeline.json"
  printf 'recurred on PR #900 / run http://x\n' > "$TMPDIR_TEST/body.md"
  out=$("$TMPDIR_TEST/scripts/dispatch-flake-dedup" "$FP" --body-file "$TMPDIR_TEST/body.md" --run-id 12345)
  assert_eq "flake-dedup: null commit_id (run pre-close) → REOPENED <N>" "REOPENED 501" "$out"
  if grep -qx '501' "$TMPDIR_TEST/scripts/stub/reopen-fired" 2>/dev/null; then r=yes; else r=no; fi
  assert_eq "flake-dedup: null commit_id → reopen fired on 501" "yes" "$r"
  if grep -qx '501' "$TMPDIR_TEST/scripts/stub/comments-fired" 2>/dev/null; then c=yes; else c=no; fi
  assert_eq "flake-dedup: null commit_id → comment fired on 501" "yes" "$c"
  flake_dedup_teardown

  # CASE 8 — NOT_PLANNED close → ancestry skipped → stale=0 → REOPENED.
  # state_reason=not_planned means there was no fix, so ancestry is skipped;
  # compare-status `behind` and the present timeline commit_id MUST be ignored. The
  # run.createdAt is BEFORE closed_at — the run-before-close that the removed
  # recency floor would have suppressed as STALE; under ancestry-only there is no
  # closing fix to be behind, so it REOPENs. This flip discriminates old vs new code.
  flake_dedup_setup
  printf '[{"number":501,"title":"Flaky CI: %s","state":"closed","closed_at":"2026-02-01T00:00:00Z","state_reason":"not_planned"}]\n' "$FP" > "$TMPDIR_TEST/scripts/issues.json"
  printf '{"createdAt":"2026-01-01T00:00:00Z","headSha":"headsha"}\n' > "$TMPDIR_TEST/scripts/run.json"
  printf 'behind\n' > "$TMPDIR_TEST/scripts/compare-status"
  printf '[{"event":"closed","commit_id":"closingsha"}]\n' > "$TMPDIR_TEST/scripts/timeline.json"
  printf 'recurred on PR #900 / run http://x\n' > "$TMPDIR_TEST/body.md"
  out=$("$TMPDIR_TEST/scripts/dispatch-flake-dedup" "$FP" --body-file "$TMPDIR_TEST/body.md" --run-id 12345)
  assert_eq "flake-dedup: not_planned (run pre-close) → REOPENED <N>" "REOPENED 501" "$out"
  if grep -qx '501' "$TMPDIR_TEST/scripts/stub/reopen-fired" 2>/dev/null; then r=yes; else r=no; fi
  assert_eq "flake-dedup: not_planned → reopen fired on 501" "yes" "$r"
  if grep -qx '501' "$TMPDIR_TEST/scripts/stub/comments-fired" 2>/dev/null; then c=yes; else c=no; fi
  assert_eq "flake-dedup: not_planned → comment fired on 501" "yes" "$c"
  flake_dedup_teardown

  # CASE 9 — (guardrail) CLOSED match, missing --run-id → non-zero exit + stderr.
  # The CLOSED path requires --run-id; an absent one is a misconfigured caller and
  # must fail loud rather than reopen blind.
  flake_dedup_setup
  printf '[{"number":501,"title":"Flaky CI: %s","state":"closed","closed_at":"2026-01-01T00:00:00Z"}]\n' "$FP" > "$TMPDIR_TEST/scripts/issues.json"
  printf 'recurred on PR #900 / run http://x\n' > "$TMPDIR_TEST/body.md"
  if "$TMPDIR_TEST/scripts/dispatch-flake-dedup" "$FP" --body-file "$TMPDIR_TEST/body.md" 2>"$TMPDIR_TEST/err"; then ec=0; else ec=$?; fi
  assert_eq "flake-dedup: closed match, missing --run-id → non-zero exit" "1" "$ec"
  if grep -q 'run-id is required' "$TMPDIR_TEST/err"; then g=yes; else g=no; fi
  assert_eq "flake-dedup: closed match, missing --run-id → stderr error" "yes" "$g"
  if [[ -s "$TMPDIR_TEST/scripts/stub/comments-fired" ]]; then c=yes; else c=no; fi
  assert_eq "flake-dedup: closed match, missing --run-id → no comment" "no" "$c"
  if [[ -s "$TMPDIR_TEST/scripts/stub/reopen-fired" ]]; then r=yes; else r=no; fi
  assert_eq "flake-dedup: closed match, missing --run-id → no reopen" "no" "$r"
  flake_dedup_teardown

# <<< END MOVED <<<

report_results
