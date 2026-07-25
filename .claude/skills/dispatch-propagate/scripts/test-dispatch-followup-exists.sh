#!/usr/bin/env bash
# Tests for dispatch-followup-exists -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 23429-24112.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# === dispatch-followup-exists ===
# ============================================================================

echo "Test: dispatch-followup-exists"

# Dedicated setup/teardown modeled on jit_skill_setup/teardown. Builds a temp
# tree with the script under test and a gh stub on PATH. The stub returns the
# WHOLE issues.json fixture array (no filtering of its own) so the script's jq
# does the exact-substring filtering under test.
followup_exists_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/bin"

  cp "$SCRIPT_DIR/dispatch-followup-exists" "$TMPDIR_TEST/scripts/dispatch-followup-exists"
  # (#2258) dispatch-followup-exists now sources lib.sh (for gh_issue_list_rest),
  # so lib.sh must sit alongside it. Sourced, not executed — no chmod +x.
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/lib.sh"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-followup-exists"

  # gh stub: (#2258) the script now fetches via gh_issue_list_rest, which issues
  #   gh api [--paginate] repos/{owner}/{repo}/issues?state=all&...
  # On match, serve the fixture $TREE/issues.json (else []), jq-remapped from the
  # fixture's {number,title} to REST snake_case WITH title (the script passes
  # --include-title). The stub does NOT filter on the identifier — it returns the
  # whole array; the script's boundary-aware jq post-filter does the matching.
  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
args="$*"
TREE="$(cd "$(dirname "$0")/.." && pwd)"
case "$args" in
  *"api "*"repos/"*"/issues"*)
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

  SAVED_PATH_FE="$PATH"
  export PATH="$TMPDIR_TEST/bin:$PATH"
}

followup_exists_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  export PATH="$SAVED_PATH_FE"
}

# CASE 1 — OPEN match (npm)
followup_exists_setup
cat > "$TMPDIR_TEST/issues.json" <<'EOF'
[{"number":1077,"title":"security: npm advisories in lodash"}]
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-followup-exists" "npm advisories in lodash")
assert_eq "followup-exists: open npm match → prints number" "1077" "$out"
followup_exists_teardown

# CASE 2 — Match from a fixture that includes a closed issue. The stub accepts
# --state all (which is the flag the script passes), confirming the script doesn't
# silently drop the flag. The stub is state-agnostic — it mirrors how gh returns
# both open and closed issues when --state all is supplied; jq does the filtering.
followup_exists_setup
cat > "$TMPDIR_TEST/issues.json" <<'EOF'
[{"number":1094,"title":"security: npm advisories in axios"}]
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-followup-exists" "npm advisories in axios")
assert_eq "followup-exists: --state all fixture match → prints number" "1094" "$out"
followup_exists_teardown

# CASE 3 — CodeQL match
followup_exists_setup
cat > "$TMPDIR_TEST/issues.json" <<'EOF'
[{"number":1096,"title":"security: CodeQL js/sql-injection alert #42 in src/db.ts"}]
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-followup-exists" "CodeQL js/sql-injection alert #42")
assert_eq "followup-exists: codeql match → prints number" "1096" "$out"
followup_exists_teardown

# CASE 4 — NO match (empty fixture)
followup_exists_setup
cat > "$TMPDIR_TEST/issues.json" <<'EOF'
[]
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-followup-exists" "npm advisories in lodash")
assert_eq "followup-exists: no match → empty" "" "$out"
followup_exists_teardown

# CASE 5 — FUZZY token overlap but NOT a boundary-anchored match.
# Title "npm advisories in the lodash package" shares the leading tokens but
# the intervening word "the" breaks the substring, so neither endswith($id)
# nor contains($id + " ") matches.
followup_exists_setup
cat > "$TMPDIR_TEST/issues.json" <<'EOF'
[{"number":1200,"title":"security: npm advisories in the lodash package"}]
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-followup-exists" "npm advisories in lodash")
assert_eq "followup-exists: fuzzy token overlap, no exact substring → empty" "" "$out"
followup_exists_teardown

# CASE 6 — MULTIPLE matches: script returns the FIRST issue number ([0]).
followup_exists_setup
cat > "$TMPDIR_TEST/issues.json" <<'EOF'
[{"number":1050,"title":"security: npm advisories in lodash"},{"number":1077,"title":"security: npm advisories in lodash (duplicate)"}]
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-followup-exists" "npm advisories in lodash")
assert_eq "followup-exists: multiple matches → first issue number" "1050" "$out"
followup_exists_teardown

# CASE 7 — npm PREFIX COLLISION must NOT match. Identifier "npm advisories in
# lodash" is a literal substring of title "...lodash-es", but the char after
# the identifier is "-", not a space or end-of-title. A bare contains() would
# false-match and silently suppress the genuine "lodash" follow-up; the
# boundary-aware filter rejects it.
followup_exists_setup
cat > "$TMPDIR_TEST/issues.json" <<'EOF'
[{"number":1300,"title":"security: npm advisories in lodash-es"}]
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-followup-exists" "npm advisories in lodash")
assert_eq "followup-exists: npm prefix collision (lodash vs lodash-es) → empty" "" "$out"
followup_exists_teardown

# CASE 8 — CodeQL alert-number PREFIX COLLISION must NOT match. Identifier
# "CodeQL js/sql-injection alert #5" is a literal substring of title
# "...alert #50 in ...", but the char after "#5" is "0", not a space. The
# boundary-aware filter rejects it so alert #5 still files its own follow-up.
followup_exists_setup
cat > "$TMPDIR_TEST/issues.json" <<'EOF'
[{"number":1301,"title":"security: CodeQL js/sql-injection alert #50 in src/db.ts"}]
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-followup-exists" "CodeQL js/sql-injection alert #5")
assert_eq "followup-exists: codeql alert-number prefix collision (#5 vs #50) → empty" "" "$out"
followup_exists_teardown

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

  # ============================================================================
  # === dispatch-flake-dedup-node (tactic-fix-checks-graph-native-flake-tracking) ===
  # ============================================================================
  # Node-lane sibling of dispatch-flake-dedup: no gh stub, no network — it works
  # against real local git state (intentions/tactic-*.md working-tree content plus
  # origin/main history for the phase:done ancestry gate). Uses real git repos,
  # mirroring the dispatch-merge-main convention above rather than the gh-stub
  # harness used for the issue-lane sibling.

  echo "Test: dispatch-flake-dedup-node"

  FDN="$SCRIPT_DIR/dispatch-flake-dedup-node"
  FDN_FP="acceptance — fellspiral/e2e/navigation.spec.ts:4:3 page loads without JS errors @smoke"

  # Helper: build an origin + worktree pair with an intentions/ dir, mirroring
  # merge_main_setup's real-git convention. Callers add commits/files on top.
  fdn_setup() {
    FDN_TMPDIR=$(mktemp -d)
    FDN_ORIGIN="$FDN_TMPDIR/origin"
    FDN_WORKTREE="$FDN_TMPDIR/worktree"

    git init -q "$FDN_ORIGIN"
    git -C "$FDN_ORIGIN" config user.email "test@test"
    git -C "$FDN_ORIGIN" config user.name "Test"
    git -C "$FDN_ORIGIN" checkout -q -b main 2>/dev/null || true
    mkdir -p "$FDN_ORIGIN/intentions"
    touch "$FDN_ORIGIN/seed.txt"
    git -C "$FDN_ORIGIN" add seed.txt
    git -C "$FDN_ORIGIN" commit -q -m "initial"
  }

  # Clone origin into the worktree once the caller has finished seeding origin
  # commits. Populates refs/remotes/origin/main via the clone.
  fdn_clone() {
    git clone -q "$FDN_ORIGIN" "$FDN_WORKTREE"
    git -C "$FDN_WORKTREE" config user.email "test@test"
    git -C "$FDN_WORKTREE" config user.name "Test"
  }

  fdn_teardown() {
    rm -rf "$FDN_TMPDIR"
    unset FDN_TMPDIR FDN_ORIGIN FDN_WORKTREE
  }

  # Run the script with cwd = the worktree, so `git rev-parse --show-toplevel`
  # and the `intentions/tactic-*.md` glob resolve against it.
  fdn_run() {
    (cd "$FDN_WORKTREE" && "$FDN" "$@")
  }

  # CASE 1 — no fingerprint anywhere → NONE.
  fdn_setup
  fdn_clone
  printf 'recurred on PR #900\n' > "$FDN_TMPDIR/body.md"
  out=$(fdn_run "$FDN_FP" --body-file "$FDN_TMPDIR/body.md")
  assert_eq "flake-dedup-node: no match → NONE" "NONE" "$out"
  fdn_teardown

  # CASE 2 — open (phase: implement) match → EXISTING <id>. No --head-ref needed
  # (the ancestry gate only fires on a phase:done match).
  fdn_setup
  cat > "$FDN_ORIGIN/intentions/tactic-flake-nav-smoke.md" <<EOF
---
id: tactic-flake-nav-smoke
phase: implement
---
# Flaky CI tracker

Fingerprint: $FDN_FP
EOF
  git -C "$FDN_ORIGIN" add intentions/tactic-flake-nav-smoke.md
  git -C "$FDN_ORIGIN" commit -q -m "create flake tactic"
  fdn_clone
  printf 'recurred on PR #900\n' > "$FDN_TMPDIR/body.md"
  out=$(fdn_run "$FDN_FP" --body-file "$FDN_TMPDIR/body.md")
  assert_eq "flake-dedup-node: open match → EXISTING <id>" "EXISTING tactic-flake-nav-smoke" "$out"
  fdn_teardown

  # CASE 3 — phase-absent match (never phase-set) → treated as open → EXISTING.
  fdn_setup
  cat > "$FDN_ORIGIN/intentions/tactic-flake-nav-smoke.md" <<EOF
---
id: tactic-flake-nav-smoke
---
# Flaky CI tracker

Fingerprint: $FDN_FP
EOF
  git -C "$FDN_ORIGIN" add intentions/tactic-flake-nav-smoke.md
  git -C "$FDN_ORIGIN" commit -q -m "create flake tactic (unphased)"
  fdn_clone
  printf 'recurred on PR #900\n' > "$FDN_TMPDIR/body.md"
  out=$(fdn_run "$FDN_FP" --body-file "$FDN_TMPDIR/body.md")
  assert_eq "flake-dedup-node: phase-absent match → EXISTING <id>" "EXISTING tactic-flake-nav-smoke" "$out"
  fdn_teardown

  # CASE 4 — done match, --head-ref descends from the closing commit → REOPENED.
  fdn_setup
  cat > "$FDN_ORIGIN/intentions/tactic-flake-nav-smoke.md" <<EOF
---
id: tactic-flake-nav-smoke
phase: implement
---
# Flaky CI tracker

Fingerprint: $FDN_FP
EOF
  git -C "$FDN_ORIGIN" add intentions/tactic-flake-nav-smoke.md
  git -C "$FDN_ORIGIN" commit -q -m "create flake tactic"
  sed -i 's/^phase: implement$/phase: done/' "$FDN_ORIGIN/intentions/tactic-flake-nav-smoke.md"
  git -C "$FDN_ORIGIN" add intentions/tactic-flake-nav-smoke.md
  git -C "$FDN_ORIGIN" commit -q -m "complete flake tactic"
  CLOSING_SHA=$(git -C "$FDN_ORIGIN" rev-parse HEAD)
  fdn_clone
  # A commit descending from the closing commit — the PR branch's head contains
  # the fix.
  touch "$FDN_WORKTREE/downstream.txt"
  git -C "$FDN_WORKTREE" add downstream.txt
  git -C "$FDN_WORKTREE" commit -q -m "downstream of the fix"
  HEAD_SHA=$(git -C "$FDN_WORKTREE" rev-parse HEAD)
  printf 'recurred on PR #900\n' > "$FDN_TMPDIR/body.md"
  out=$(fdn_run "$FDN_FP" --body-file "$FDN_TMPDIR/body.md" --head-ref "$HEAD_SHA")
  assert_eq "flake-dedup-node: done match, head contains fix → REOPENED <id>" "REOPENED tactic-flake-nav-smoke" "$out"
  fdn_teardown

  # CASE 5 — done match, --head-ref does NOT descend from the closing commit →
  # STALE. Build a branch that diverges BEFORE the closing commit.
  fdn_setup
  cat > "$FDN_ORIGIN/intentions/tactic-flake-nav-smoke.md" <<EOF
---
id: tactic-flake-nav-smoke
phase: implement
---
# Flaky CI tracker

Fingerprint: $FDN_FP
EOF
  git -C "$FDN_ORIGIN" add intentions/tactic-flake-nav-smoke.md
  git -C "$FDN_ORIGIN" commit -q -m "create flake tactic"
  PRE_CLOSE_SHA=$(git -C "$FDN_ORIGIN" rev-parse HEAD)
  sed -i 's/^phase: implement$/phase: done/' "$FDN_ORIGIN/intentions/tactic-flake-nav-smoke.md"
  git -C "$FDN_ORIGIN" add intentions/tactic-flake-nav-smoke.md
  git -C "$FDN_ORIGIN" commit -q -m "complete flake tactic"
  fdn_clone
  # A commit that branches off BEFORE the closing commit — the PR branch is
  # stale and does not contain the fix.
  git -C "$FDN_WORKTREE" checkout -q "$PRE_CLOSE_SHA" -b stale-branch
  touch "$FDN_WORKTREE/stale.txt"
  git -C "$FDN_WORKTREE" add stale.txt
  git -C "$FDN_WORKTREE" commit -q -m "stale PR branch commit"
  STALE_HEAD_SHA=$(git -C "$FDN_WORKTREE" rev-parse HEAD)
  git -C "$FDN_WORKTREE" checkout -q main
  printf 'recurred on PR #900\n' > "$FDN_TMPDIR/body.md"
  out=$(fdn_run "$FDN_FP" --body-file "$FDN_TMPDIR/body.md" --head-ref "$STALE_HEAD_SHA" 2>"$FDN_TMPDIR/err")
  assert_eq "flake-dedup-node: done match, head behind fix → STALE <id>" "STALE tactic-flake-nav-smoke" "$out"
  if grep -q 'suppressing reopen' "$FDN_TMPDIR/err"; then g=yes; else g=no; fi
  assert_eq "flake-dedup-node: stale → suppression logged to stderr" "yes" "$g"
  fdn_teardown

  # CASE 6 — done match, missing --head-ref → non-zero exit + stderr (the
  # ancestry gate requires it, mirroring the issue lane's --run-id requirement).
  fdn_setup
  cat > "$FDN_ORIGIN/intentions/tactic-flake-nav-smoke.md" <<EOF
---
id: tactic-flake-nav-smoke
phase: done
---
# Flaky CI tracker

Fingerprint: $FDN_FP
EOF
  git -C "$FDN_ORIGIN" add intentions/tactic-flake-nav-smoke.md
  git -C "$FDN_ORIGIN" commit -q -m "create done flake tactic"
  fdn_clone
  printf 'recurred on PR #900\n' > "$FDN_TMPDIR/body.md"
  if fdn_run "$FDN_FP" --body-file "$FDN_TMPDIR/body.md" 2>"$FDN_TMPDIR/err"; then ec=0; else ec=$?; fi
  assert_eq "flake-dedup-node: done match, missing --head-ref → non-zero exit" "1" "$ec"
  if grep -q 'head-ref is required' "$FDN_TMPDIR/err"; then g=yes; else g=no; fi
  assert_eq "flake-dedup-node: done match, missing --head-ref → stderr error" "yes" "$g"
  fdn_teardown

  # CASE 7 — fingerprint matches more than one tactic node → error, non-zero exit.
  fdn_setup
  cat > "$FDN_ORIGIN/intentions/tactic-flake-a.md" <<EOF
---
id: tactic-flake-a
phase: implement
---
Fingerprint: $FDN_FP
EOF
  cat > "$FDN_ORIGIN/intentions/tactic-flake-b.md" <<EOF
---
id: tactic-flake-b
phase: implement
---
Fingerprint: $FDN_FP
EOF
  git -C "$FDN_ORIGIN" add intentions/tactic-flake-a.md intentions/tactic-flake-b.md
  git -C "$FDN_ORIGIN" commit -q -m "duplicate flake tactics"
  fdn_clone
  printf 'recurred on PR #900\n' > "$FDN_TMPDIR/body.md"
  if fdn_run "$FDN_FP" --body-file "$FDN_TMPDIR/body.md" 2>"$FDN_TMPDIR/err"; then ec=0; else ec=$?; fi
  assert_eq "flake-dedup-node: multiple matches → non-zero exit" "1" "$ec"
  if grep -q 'matched multiple tactic nodes' "$FDN_TMPDIR/err"; then g=yes; else g=no; fi
  assert_eq "flake-dedup-node: multiple matches → stderr error" "yes" "$g"
  fdn_teardown

  # CASE 8 — (guardrail) missing --body-file → usage error, exit 2.
  fdn_setup
  fdn_clone
  if fdn_run "$FDN_FP" 2>"$FDN_TMPDIR/err"; then ec=0; else ec=$?; fi
  assert_eq "flake-dedup-node: missing --body-file → exit 2" "2" "$ec"
  fdn_teardown

  # CASE 9 — an UNRELATED node quotes the fingerprint in prose but carries no
  # canonical `Fingerprint: <fp>` label line → must NOT match (the match is
  # scoped to the label, not a bare substring anywhere in a body) → NONE.
  fdn_setup
  cat > "$FDN_ORIGIN/intentions/tactic-plan-fix-nav.md" <<EOF
---
id: tactic-plan-fix-nav
phase: implement
---
# Planning node

We should fix: $FDN_FP
EOF
  git -C "$FDN_ORIGIN" add intentions/tactic-plan-fix-nav.md
  git -C "$FDN_ORIGIN" commit -q -m "unrelated planning node quoting the fingerprint"
  fdn_clone
  printf 'recurred on PR #900\n' > "$FDN_TMPDIR/body.md"
  out=$(fdn_run "$FDN_FP" --body-file "$FDN_TMPDIR/body.md")
  assert_eq "flake-dedup-node: unrelated prose mention (no label) → NONE" "NONE" "$out"
  fdn_teardown

  # CASE 10 — phase-ABSENT frontmatter, but the BODY carries a verbatim CI
  # excerpt line beginning `phase: done`. Phase extraction is bounded to the
  # frontmatter block, so the body line must NOT be read as the node's phase:
  # the node is treated as open → EXISTING (no --head-ref demanded).
  fdn_setup
  cat > "$FDN_ORIGIN/intentions/tactic-flake-nav-smoke.md" <<EOF
---
id: tactic-flake-nav-smoke
---
# Flaky CI tracker

Fingerprint: $FDN_FP

Recurrence excerpt:
phase: done
EOF
  git -C "$FDN_ORIGIN" add intentions/tactic-flake-nav-smoke.md
  git -C "$FDN_ORIGIN" commit -q -m "phase-absent node with 'phase: done' in body excerpt"
  fdn_clone
  printf 'recurred on PR #900\n' > "$FDN_TMPDIR/body.md"
  out=$(fdn_run "$FDN_FP" --body-file "$FDN_TMPDIR/body.md")
  assert_eq "flake-dedup-node: body 'phase: done' not read as phase → EXISTING <id>" "EXISTING tactic-flake-nav-smoke" "$out"
  fdn_teardown

  # CASE 11 — (guardrail) --head-ref passed as the final token with no value →
  # clean usage error (exit 2), not a set -u 'unbound variable' abort.
  fdn_setup
  fdn_clone
  printf 'recurred on PR #900\n' > "$FDN_TMPDIR/body.md"
  if fdn_run "$FDN_FP" --body-file "$FDN_TMPDIR/body.md" --head-ref 2>"$FDN_TMPDIR/err"; then ec=0; else ec=$?; fi
  assert_eq "flake-dedup-node: --head-ref with no value → exit 2" "2" "$ec"
  if grep -q 'head-ref requires a value' "$FDN_TMPDIR/err"; then g=yes; else g=no; fi
  assert_eq "flake-dedup-node: --head-ref with no value → stderr usage error" "yes" "$g"
  fdn_teardown

# <<< END MOVED <<<

report_results
