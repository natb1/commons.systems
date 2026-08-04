#!/usr/bin/env bash
# Tests for dispatch-followup-exists -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 23429-24112, less the
# two trailing blocks re-homed to their own SUTs: dispatch-flake-dedup
# (test-dispatch-flake-dedup.sh) and dispatch-flake-dedup-node
# (test-dispatch-flake-dedup-node.sh).
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

# <<< END MOVED <<<

report_results
