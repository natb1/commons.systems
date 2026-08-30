#!/usr/bin/env bash
# Tests for lint-prose-rules.sh.
# Builds ephemeral git repos to validate the diff-scoping and detection logic.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
source "$SCRIPT_DIR/test-helpers.sh"
SUT="$SCRIPT_DIR/lint-prose-rules.sh"

TMP_ROOT=""
cleanup() { [ -n "${TMP_ROOT:-}" ] && rm -rf "$TMP_ROOT"; }
trap cleanup EXIT INT TERM

# Assemble the banned pattern from pieces so this source file never contains
# the contiguous sequence on a non-comment line. These variables are used to
# write fixture content into ephemeral repos only.
_PIPE='|'
# Produces the string: X=$(echo "$J" | jq -r .a)
VIOL_CONTENT="X=\$(echo \"\$J\" $_PIPE jq -r .a)"
# Produces the string: X=$(echo -e "$J" | jq -r .a)  (escape-interpreting flag form)
VIOL_CONTENT_FLAG="X=\$(echo -e \"\$J\" $_PIPE jq -r .a)"
# Produces the string: X=$(echo "${MY_VAR}" | jq -r .a)  (braced form)
VIOL_CONTENT_BRACED="X=\$(echo \"\${MY_VAR}\" $_PIPE jq -r .a)"

# Build a fresh ephemeral repo. Sets globals: REPO, BARE.
# $1 (optional): "with_violation" — include VIOL_CONTENT in the origin/main baseline.
REPO=""
BARE=""
make_repo() {
  local include_viol="${1:-}"
  REPO=$(mktemp -d "$TMP_ROOT/repo.XXXXXX")
  BARE=$(mktemp -d "$TMP_ROOT/bare.XXXXXX")

  git -C "$BARE" init --bare --quiet --initial-branch=main

  git -C "$REPO" init --quiet --initial-branch=main
  git -C "$REPO" config user.email "test@example.com"
  git -C "$REPO" config user.name "Test User"
  git -C "$REPO" remote add origin "$BARE"

  # Write the baseline script.sh.
  printf '%s\n' '#!/usr/bin/env bash' > "$REPO/script.sh"
  printf '%s\n' 'jq -r .field <<<"$VAR"' >> "$REPO/script.sh"
  if [ "$include_viol" = "with_violation" ]; then
    printf '%s\n' "$VIOL_CONTENT" >> "$REPO/script.sh"
  fi

  git -C "$REPO" add -A
  git -C "$REPO" commit --quiet -m "baseline"
  git -C "$REPO" push --quiet origin main

  git -C "$REPO" checkout --quiet -b feature

  # Ensure origin/main is fetchable so origin/main...HEAD resolves.
  git -C "$REPO" fetch --quiet origin main
}

# Run the SUT with CWD inside $REPO. Sets globals: RC, OUT.
RC=0
OUT=""
run_sut() {
  local prev_dir
  prev_dir=$(pwd)
  cd "$REPO"
  set +e
  OUT=$("$SUT" 2>&1)
  RC=$?
  set -e
  cd "$prev_dir"
}

TMP_ROOT=$(mktemp -d)

# ---------------------------------------------------------------------------
# Test 1: net-new violation IS flagged.
# Baseline has no violation. HEAD adds the banned pattern to a .sh file.
# ---------------------------------------------------------------------------
echo "Test 1: net-new violation is flagged"
make_repo
printf '%s\n' "$VIOL_CONTENT" >> "$REPO/script.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add violation"
run_sut
[ "$RC" -ne 0 ] && _t1_rc=nonzero || _t1_rc=zero
assert_eq "violation: exit non-zero" "nonzero" "$_t1_rc"
assert_contains "violation: output names the file" "script.sh" "$OUT"
assert_contains "violation: remediation pointer present" "shell-json.md" "$OUT"
assert_contains "violation: good-form hint present" '<<<"$VAR"' "$OUT"

# ---------------------------------------------------------------------------
# Test 2: pre-existing violation is NOT flagged.
# The banned pattern is already on origin/main; HEAD makes a no-op change
# elsewhere so the diff shows no net-new addition of the violating line.
# ---------------------------------------------------------------------------
echo "Test 2: pre-existing violation is not flagged"
make_repo with_violation
echo "# no-op change" >> "$REPO/script.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "no-op change"
run_sut
assert_eq "pre-existing: exit 0" "0" "$RC"
assert_contains "pre-existing: PASS printed" "PASS" "$OUT"

# ---------------------------------------------------------------------------
# Test 3: added comment mentioning the pattern is NOT flagged.
# The linter skips comment lines (first non-whitespace char is #), including
# indented comments (leading spaces/tabs before the #).
# ---------------------------------------------------------------------------
echo "Test 3: added comment is not flagged"
make_repo
# Write both an un-indented and an indented comment referencing the pattern;
# assembled in parts here to avoid the contiguous banned sequence appearing on
# this non-comment source line. The indented case guards the regression where a
# space-/tab-indented comment was wrongly flagged.
COMMENT_LINE="# do not use: echo \"\$X\" $_PIPE jq"
COMMENT_LINE_INDENTED="  # do not use: echo \"\$Y\" $_PIPE jq"
printf '%s\n' "$COMMENT_LINE" >> "$REPO/script.sh"
printf '%s\n' "$COMMENT_LINE_INDENTED" >> "$REPO/script.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add comment"
run_sut
assert_eq "comment: exit 0" "0" "$RC"
assert_contains "comment: PASS printed" "PASS" "$OUT"

# ---------------------------------------------------------------------------
# Test 4: clean added line passes.
# HEAD adds a here-string form (the correct pattern), which must not be flagged.
# ---------------------------------------------------------------------------
echo "Test 4: clean added line passes"
make_repo
echo 'jq -r .a <<<"$J"' >> "$REPO/script.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add clean line"
run_sut
assert_eq "clean-line: exit 0" "0" "$RC"
assert_contains "clean-line: PASS printed" "PASS" "$OUT"

# ---------------------------------------------------------------------------
# Test 5: net-new flag form (echo -e "$VAR" | jq) IS flagged.
# The -e flag is the explicit opt-in to escape interpretation — the most
# dangerous form of the anti-pattern.
# ---------------------------------------------------------------------------
echo "Test 5: echo -e flag form is flagged"
make_repo
printf '%s\n' "$VIOL_CONTENT_FLAG" >> "$REPO/script.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add flag-form violation"
run_sut
[ "$RC" -ne 0 ] && _t5_rc=nonzero || _t5_rc=zero
assert_eq "flag-form: exit non-zero" "nonzero" "$_t5_rc"
assert_contains "flag-form: output names the file" "script.sh" "$OUT"

# ---------------------------------------------------------------------------
# Test 6: net-new braced form (echo "${VAR}" | jq) IS flagged.
# Semantically identical to the unbraced form; must not be a lint bypass.
# ---------------------------------------------------------------------------
echo "Test 6: braced variable form is flagged"
make_repo
printf '%s\n' "$VIOL_CONTENT_BRACED" >> "$REPO/script.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add braced-form violation"
run_sut
[ "$RC" -ne 0 ] && _t6_rc=nonzero || _t6_rc=zero
assert_eq "braced-form: exit non-zero" "nonzero" "$_t6_rc"
assert_contains "braced-form: output names the file" "script.sh" "$OUT"

# ---------------------------------------------------------------------------
# Porcelain fixture pieces: assembled so NO non-comment source line here
# contains a contiguous banned token (gh<sp>issue<sp>verb or gh<sp>pr<sp>verb).
# _GH is never the literal string 'gh' when interpolated in shell context, but
# here we assign 'gh' to it and use it inside printf strings that become the
# fixture content written into ephemeral repos — the ASSIGNMENT line itself
# does not contain the banned two-word sequence.
# ---------------------------------------------------------------------------
_GH='gh'
# Produces: RES=$(gh issue view "$N" --json title)
PORC_ISSUE_VIEW="RES=\$($_GH issue view \"\$N\" --json title)"
# Produces: RES=$(gh pr view "$N" --json closingIssuesReferences)
PORC_PR_VIEW="RES=\$($_GH pr view \"\$N\" --json closingIssuesReferences)"
# Produces: RES=$(gh issue list --label dispatch:planned --json number)
PORC_ISSUE_LIST="RES=\$($_GH issue list --label dispatch:planned --json number)"
# Produces: RES=$(gh pr list --state open --json number)
PORC_PR_LIST="RES=\$($_GH pr list --state open --json number)"

# Shebang line for extensionless fixtures: construct with printf so zsh
# history expansion does not escape the '!' in '#!/usr/bin/env bash'.
_BANG="$(printf '\041')"
FIXTURE_SHEBANG="#${_BANG}/usr/bin/env bash"

# ---------------------------------------------------------------------------
# Test 7: net-new porcelain (issue-view subcommand) in a .sh file — flagged.
# ---------------------------------------------------------------------------
echo "Test 7: net-new porcelain in a .sh file is flagged"
make_repo
printf '%s\n' "$PORC_ISSUE_VIEW" >> "$REPO/script.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add porcelain call"
run_sut
[ "$RC" -ne 0 ] && _t7_rc=nonzero || _t7_rc=zero
assert_eq "porcelain-sh: exit non-zero" "nonzero" "$_t7_rc"
assert_contains "porcelain-sh: output names the file" "script.sh" "$OUT"
assert_contains "porcelain-sh: remediation helper present" "gh_issue_view_rest" "$OUT"

# ---------------------------------------------------------------------------
# Test 8: net-new porcelain in an EXTENSIONLESS bash-shebang file — flagged.
# Core regression guard: is_shell_script detects shebangs on line 1.
# ---------------------------------------------------------------------------
echo "Test 8: net-new porcelain in extensionless shebang file is flagged"
make_repo
# Write a NEW file with no .sh extension; shebang must be line 1.
# Use $FIXTURE_SHEBANG (not a literal '#!') to avoid zsh history-expansion
# rewriting '!' to '\!' and breaking the is_shell_script shebang regex.
printf '%s\n' "$FIXTURE_SHEBANG" > "$REPO/dispatch-thing"
printf '%s\n' 'set -euo pipefail' >> "$REPO/dispatch-thing"
printf '%s\n' "$PORC_ISSUE_VIEW" >> "$REPO/dispatch-thing"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add extensionless script with porcelain"
run_sut
[ "$RC" -ne 0 ] && _t8_rc=nonzero || _t8_rc=zero
assert_eq "porcelain-extensionless: exit non-zero" "nonzero" "$_t8_rc"
assert_contains "porcelain-extensionless: output names the file" "dispatch-thing" "$OUT"

# ---------------------------------------------------------------------------
# Test 9: allow-marker suppression.
# 9a: porcelain with NO marker → flagged.
# 9b: SAME porcelain immediately preceded by the allow-marker → passes.
# ---------------------------------------------------------------------------
echo "Test 9a: porcelain without allow-marker is flagged"
make_repo
printf '%s\n' "$PORC_PR_VIEW" >> "$REPO/script.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add porcelain without marker"
run_sut
[ "$RC" -ne 0 ] && _t9a_rc=nonzero || _t9a_rc=zero
assert_eq "allow-marker-absent: exit non-zero" "nonzero" "$_t9a_rc"

echo "Test 9b: porcelain preceded by allow-marker is NOT flagged"
make_repo
# Marker comment immediately before the porcelain line — no blank line between.
printf '%s\n' "# lint-allow: gh-rest-porcelain needs-graphql-field" >> "$REPO/script.sh"
printf '%s\n' "$PORC_PR_VIEW" >> "$REPO/script.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add porcelain with allow-marker"
run_sut
assert_eq "allow-marker-present: exit 0" "0" "$RC"
assert_contains "allow-marker-present: PASS printed" "PASS" "$OUT"

# ---------------------------------------------------------------------------
# Test 10: pre-existing porcelain (on origin/main baseline) is NOT flagged.
# Seed the porcelain into the baseline BEFORE push, then make a no-op HEAD
# change — diff shows no net-new porcelain line.
# ---------------------------------------------------------------------------
echo "Test 10: pre-existing porcelain on origin/main is NOT flagged"
REPO=$(mktemp -d "$TMP_ROOT/repo.XXXXXX")
BARE=$(mktemp -d "$TMP_ROOT/bare.XXXXXX")
git -C "$BARE" init --bare --quiet --initial-branch=main
git -C "$REPO" init --quiet --initial-branch=main
git -C "$REPO" config user.email "test@example.com"
git -C "$REPO" config user.name "Test User"
git -C "$REPO" remote add origin "$BARE"
# Baseline includes porcelain already committed to main.
printf '%s\n' '#!/usr/bin/env bash' > "$REPO/script.sh"
printf '%s\n' "$PORC_ISSUE_VIEW" >> "$REPO/script.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "baseline with porcelain"
git -C "$REPO" push --quiet origin main
git -C "$REPO" checkout --quiet -b feature
git -C "$REPO" fetch --quiet origin main
# HEAD change: no-op comment only.
echo "# no-op" >> "$REPO/script.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "no-op change"
run_sut
assert_eq "pre-existing-porcelain: exit 0" "0" "$RC"
assert_contains "pre-existing-porcelain: PASS printed" "PASS" "$OUT"

# ---------------------------------------------------------------------------
# Test 11: comment-only mention of porcelain token is NOT flagged.
# A line whose first non-whitespace char is # is skipped by both rules.
# ---------------------------------------------------------------------------
echo "Test 11: comment-only porcelain mention is NOT flagged"
make_repo
# Assemble a comment referencing a porcelain call — the line starts with #.
PORC_COMMENT="# do not call: $_GH issue view -- use gh_issue_view_rest instead"
printf '%s\n' "$PORC_COMMENT" >> "$REPO/script.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add comment mentioning porcelain"
run_sut
assert_eq "porcelain-comment: exit 0" "0" "$RC"
assert_contains "porcelain-comment: PASS printed" "PASS" "$OUT"

# ---------------------------------------------------------------------------
# Test 12: pre-existing allow-marker (on origin/main) suppresses a call line
# that is the ONLY net-new edit. Under --unified=0 the unchanged marker line is
# omitted from the diff, so PREV_WAS_ALLOW alone never sees it; the working-tree
# lookup at LINE_NUM-1 must still find the marker and suppress the call.
# ---------------------------------------------------------------------------
echo "Test 12: pre-existing allow-marker suppresses a call-only edit"
REPO=$(mktemp -d "$TMP_ROOT/repo.XXXXXX")
BARE=$(mktemp -d "$TMP_ROOT/bare.XXXXXX")
git -C "$BARE" init --bare --quiet --initial-branch=main
git -C "$REPO" init --quiet --initial-branch=main
git -C "$REPO" config user.email "test@example.com"
git -C "$REPO" config user.name "Test User"
git -C "$REPO" remote add origin "$BARE"
# Baseline: marker + porcelain call already committed to main, both unchanged
# on the branch except the call line.
printf '%s\n' '#!/usr/bin/env bash' > "$REPO/script.sh"
printf '%s\n' "# lint-allow: gh-rest-porcelain needs-graphql-field" >> "$REPO/script.sh"
printf '%s\n' "$PORC_PR_VIEW" >> "$REPO/script.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "baseline with marker+porcelain"
git -C "$REPO" push --quiet origin main
git -C "$REPO" checkout --quiet -b feature
git -C "$REPO" fetch --quiet origin main
# Branch change: edit ONLY the call line (the marker stays unchanged, so it is
# absent from the unified-0 diff). The edited line is still a porcelain call.
printf '%s\n' '#!/usr/bin/env bash' > "$REPO/script.sh"
printf '%s\n' "# lint-allow: gh-rest-porcelain needs-graphql-field" >> "$REPO/script.sh"
printf '%s\n' "RES=\$($_GH pr view \"\$M\" --json closingIssuesReferences)" >> "$REPO/script.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "edit only the call line"
run_sut
assert_eq "preexisting-marker-call-edit: exit 0" "0" "$RC"
assert_contains "preexisting-marker-call-edit: PASS printed" "PASS" "$OUT"

# ---------------------------------------------------------------------------
# Test 13: net-new `gh issue list` porcelain in a .sh file is flagged.
# ---------------------------------------------------------------------------
echo "Test 13: net-new gh-issue-list porcelain is flagged"
make_repo
printf '%s\n' "$PORC_ISSUE_LIST" >> "$REPO/script.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add issue-list porcelain"
run_sut
[ "$RC" -ne 0 ] && _t13_rc=nonzero || _t13_rc=zero
assert_eq "issue-list: exit non-zero" "nonzero" "$_t13_rc"
assert_contains "issue-list: output names the file" "script.sh" "$OUT"
assert_contains "issue-list: remediation helper present" "gh_issue_list_rest" "$OUT"

# ---------------------------------------------------------------------------
# Test 14: net-new `gh pr list` porcelain in a .sh file is flagged.
# ---------------------------------------------------------------------------
echo "Test 14: net-new gh-pr-list porcelain is flagged"
make_repo
printf '%s\n' "$PORC_PR_LIST" >> "$REPO/script.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add pr-list porcelain"
run_sut
[ "$RC" -ne 0 ] && _t14_rc=nonzero || _t14_rc=zero
assert_eq "pr-list: exit non-zero" "nonzero" "$_t14_rc"
assert_contains "pr-list: output names the file" "script.sh" "$OUT"
assert_contains "pr-list: remediation helper present" "gh_pr_list_rest" "$OUT"

# ---------------------------------------------------------------------------
# Test 15: the relocation exemption, and its limits.
#
# The rule's contract is net-NEW porcelain. A pure MOVE of an existing call adds
# no call site, so it must not be reported (15a) -- otherwise any large file
# split reports lines that have sat on origin/main unflagged for months, and the
# only escapes are editing moved content or burying it under allow-markers.
#
# 15b and 15c are the anti-blindness guards: the exemption must not become a
# loophole that lets real net-new porcelain ride in alongside a move.
# ---------------------------------------------------------------------------
echo "Test 15a: porcelain RELOCATED between files is NOT flagged"
REPO=$(mktemp -d "$TMP_ROOT/repo.XXXXXX")
BARE=$(mktemp -d "$TMP_ROOT/bare.XXXXXX")
git -C "$BARE" init --bare --quiet --initial-branch=main
git -C "$REPO" init --quiet --initial-branch=main
git -C "$REPO" config user.email "test@example.com"
git -C "$REPO" config user.name "Test User"
git -C "$REPO" remote add origin "$BARE"
# Baseline: the porcelain lives in old.sh, already on main (so it is pre-existing
# and unflagged there, exactly like the monolith's calls).
printf '%s\n' '#!/usr/bin/env bash' > "$REPO/old.sh"
printf '%s\n' "$PORC_ISSUE_VIEW" >> "$REPO/old.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "baseline with porcelain in old.sh"
git -C "$REPO" push --quiet origin main
git -C "$REPO" checkout --quiet -b feature
git -C "$REPO" fetch --quiet origin main
# Move it verbatim into new.sh and delete old.sh -- a pure relocation.
printf '%s\n' '#!/usr/bin/env bash' > "$REPO/new.sh"
printf '%s\n' "$PORC_ISSUE_VIEW" >> "$REPO/new.sh"
rm "$REPO/old.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "relocate porcelain from old.sh to new.sh"
run_sut
assert_eq "relocation: exit 0" "0" "$RC"
assert_contains "relocation: PASS printed" "PASS" "$OUT"

echo "Test 15b: a genuinely NEW call riding alongside a relocation is STILL flagged"
# Same relocation as 15a, but the commit also introduces a DIFFERENT porcelain
# call that never existed on main. This is the proof the rule did not go blind:
# if the exemption were a blanket skip, this would pass.
REPO=$(mktemp -d "$TMP_ROOT/repo.XXXXXX")
BARE=$(mktemp -d "$TMP_ROOT/bare.XXXXXX")
git -C "$BARE" init --bare --quiet --initial-branch=main
git -C "$REPO" init --quiet --initial-branch=main
git -C "$REPO" config user.email "test@example.com"
git -C "$REPO" config user.name "Test User"
git -C "$REPO" remote add origin "$BARE"
printf '%s\n' '#!/usr/bin/env bash' > "$REPO/old.sh"
printf '%s\n' "$PORC_ISSUE_VIEW" >> "$REPO/old.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "baseline with porcelain in old.sh"
git -C "$REPO" push --quiet origin main
git -C "$REPO" checkout --quiet -b feature
git -C "$REPO" fetch --quiet origin main
printf '%s\n' '#!/usr/bin/env bash' > "$REPO/new.sh"
printf '%s\n' "$PORC_ISSUE_VIEW" >> "$REPO/new.sh"
# The net-new one: a different subcommand, with no matching removal anywhere.
printf '%s\n' "$PORC_PR_LIST" >> "$REPO/new.sh"
rm "$REPO/old.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "relocate porcelain and add a new call"
run_sut
[ "$RC" -ne 0 ] && _t15b_rc=nonzero || _t15b_rc=zero
assert_eq "relocation+new: exit non-zero" "nonzero" "$_t15b_rc"
assert_contains "relocation+new: the NEW call is named" "gh_pr_list_rest" "$OUT"

echo "Test 15c: exemption is a MULTISET match — 2 copies added, 1 removed → 1 flagged"
# Duplicating a moved call is not a move. One removal can excuse exactly one
# addition; the surplus copy is a net-new call site and must be reported.
REPO=$(mktemp -d "$TMP_ROOT/repo.XXXXXX")
BARE=$(mktemp -d "$TMP_ROOT/bare.XXXXXX")
git -C "$BARE" init --bare --quiet --initial-branch=main
git -C "$REPO" init --quiet --initial-branch=main
git -C "$REPO" config user.email "test@example.com"
git -C "$REPO" config user.name "Test User"
git -C "$REPO" remote add origin "$BARE"
printf '%s\n' '#!/usr/bin/env bash' > "$REPO/old.sh"
printf '%s\n' "$PORC_ISSUE_VIEW" >> "$REPO/old.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "baseline with one porcelain call"
git -C "$REPO" push --quiet origin main
git -C "$REPO" checkout --quiet -b feature
git -C "$REPO" fetch --quiet origin main
printf '%s\n' '#!/usr/bin/env bash' > "$REPO/new.sh"
printf '%s\n' "$PORC_ISSUE_VIEW" >> "$REPO/new.sh"
printf '%s\n' "$PORC_ISSUE_VIEW" >> "$REPO/new.sh"
rm "$REPO/old.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "relocate porcelain but duplicate it"
run_sut
[ "$RC" -ne 0 ] && _t15c_rc=nonzero || _t15c_rc=zero
assert_eq "relocation-duplicate: exit non-zero" "nonzero" "$_t15c_rc"
assert_contains "relocation-duplicate: output names the file" "new.sh" "$OUT"

echo "Test 15d: a removal from a NON-shell file does not exempt a .sh addition"
# The removal index is scoped to shell scripts on the old side. A doc line that
# merely quotes a porcelain call is not a relocated shell call, so deleting it
# must not buy an exemption for a byte-identical net-new call in a .sh file.
REPO=$(mktemp -d "$TMP_ROOT/repo.XXXXXX")
BARE=$(mktemp -d "$TMP_ROOT/bare.XXXXXX")
git -C "$BARE" init --bare --quiet --initial-branch=main
git -C "$REPO" init --quiet --initial-branch=main
git -C "$REPO" config user.email "test@example.com"
git -C "$REPO" config user.name "Test User"
git -C "$REPO" remote add origin "$BARE"
printf '%s\n' '#!/usr/bin/env bash' > "$REPO/script.sh"
# The doc carries the porcelain-shaped line on main.
printf '%s\n' "$PORC_ISSUE_VIEW" > "$REPO/doc.md"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "baseline with porcelain quoted in a doc"
git -C "$REPO" push --quiet origin main
git -C "$REPO" checkout --quiet -b feature
git -C "$REPO" fetch --quiet origin main
# Delete the doc line and add the identical line as a real call in the script.
rm "$REPO/doc.md"
printf '%s\n' "$PORC_ISSUE_VIEW" >> "$REPO/script.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "drop the doc line, add a real call"
run_sut
[ "$RC" -ne 0 ] && _t15d_rc=nonzero || _t15d_rc=zero
assert_eq "doc-removal-no-exemption: exit non-zero" "nonzero" "$_t15d_rc"
assert_contains "doc-removal-no-exemption: output names the script" "script.sh" "$OUT"

echo "Test 15e: an allow-marked addition does not spend the relocation budget"
# Two byte-identical porcelain lines land in one branch. In new.sh the call sits
# under a PRE-EXISTING allow-marker (unchanged on main, so it is absent from the
# unified-0 diff and only the working-tree lookup sees it). In relocated.sh the
# same line is a genuine move of the one call removed from old.sh. The single
# removal must be spent on the relocation, not consumed by the allow-marked copy
# that needs no exemption. Diff order is alphabetical (new.sh before old.sh
# before relocated.sh), so the allow-marked addition is processed first. old.sh
# survives the branch minus its call line — deleting the whole file would let
# git pair it with relocated.sh as a rename, which emits no content lines at all.
REPO=$(mktemp -d "$TMP_ROOT/repo.XXXXXX")
BARE=$(mktemp -d "$TMP_ROOT/bare.XXXXXX")
git -C "$BARE" init --bare --quiet --initial-branch=main
git -C "$REPO" init --quiet --initial-branch=main
git -C "$REPO" config user.email "test@example.com"
git -C "$REPO" config user.name "Test User"
git -C "$REPO" remote add origin "$BARE"
printf '%s\n' '#!/usr/bin/env bash' > "$REPO/old.sh"
printf '%s\n' "$PORC_ISSUE_VIEW" >> "$REPO/old.sh"
printf '%s\n' 'echo keep-me' >> "$REPO/old.sh"
# new.sh ships on main with the marker already in place and no call under it.
printf '%s\n' '#!/usr/bin/env bash' > "$REPO/new.sh"
printf '%s\n' "# lint-allow: gh-rest-porcelain deliberate" >> "$REPO/new.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "baseline: call in old.sh, bare marker in new.sh"
git -C "$REPO" push --quiet origin main
git -C "$REPO" checkout --quiet -b feature
git -C "$REPO" fetch --quiet origin main
# Branch: add the call under the pre-existing marker, and relocate old.sh's call.
printf '%s\n' "$PORC_ISSUE_VIEW" >> "$REPO/new.sh"
printf '%s\n' '#!/usr/bin/env bash' > "$REPO/relocated.sh"
printf '%s\n' "$PORC_ISSUE_VIEW" >> "$REPO/relocated.sh"
printf '%s\n' '#!/usr/bin/env bash' > "$REPO/old.sh"
printf '%s\n' 'echo keep-me' >> "$REPO/old.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "allow-marked call plus the relocated call"
run_sut
assert_eq "allow-marker-keeps-budget: exit 0" "0" "$RC"
assert_contains "allow-marker-keeps-budget: PASS printed" "PASS" "$OUT"

# ---------------------------------------------------------------------------
# THE PUSH-TO-MAIN SHAPE.
#
# actions/checkout leaves refs/remotes/origin/main pointing AT the pushed
# commit, so HEAD == origin/main and the `origin/main...HEAD` range this linter
# used to carry expanded to HEAD..HEAD — empty. `[ -z "$DIFF" ]` then reported a
# clean pass without inspecting a single line, on every push to main, inside
# the REQUIRED `lint` job. A violation committed straight to main was never
# looked at.
#
# Same fixture as make_repo, but the violating commit stays on main and
# origin/main is moved onto it rather than a feature branch being cut.
make_main_push_repo() {
  REPO=$(mktemp -d "$TMP_ROOT/repo.XXXXXX")
  BARE=$(mktemp -d "$TMP_ROOT/bare.XXXXXX")

  git -C "$BARE" init --bare --quiet --initial-branch=main

  git -C "$REPO" init --quiet --initial-branch=main
  git -C "$REPO" config user.email "test@example.com"
  git -C "$REPO" config user.name "Test User"
  git -C "$REPO" remote add origin "$BARE"

  printf '%s\n' '#!/usr/bin/env bash' > "$REPO/script.sh"
  printf '%s\n' 'jq -r .field <<<"$VAR"' >> "$REPO/script.sh"
  git -C "$REPO" add -A
  git -C "$REPO" commit --quiet -m "baseline"
  git -C "$REPO" push --quiet origin main

  # The push under test: the banned pattern, committed on main.
  printf '%s\n' "$VIOL_CONTENT" >> "$REPO/script.sh"
  git -C "$REPO" add -A
  git -C "$REPO" commit --quiet -m "add violation (the push)"
  git -C "$REPO" push --quiet origin main
  # This is the state actions/checkout leaves on a push to main.
  git -C "$REPO" update-ref refs/remotes/origin/main "$(git -C "$REPO" rev-parse HEAD)"
}

echo "Test: main-push shape flags the violation"
make_main_push_repo
# The reproduction, stated as an assertion: the expression this linter used to
# carry sees nothing at all in exactly this state.
assert_eq "main-push: the old three-dot range was empty" "" \
  "$(git -C "$REPO" diff --name-only 'refs/remotes/origin/main...HEAD')"
run_sut
[ "$RC" -ne 0 ] && _mp_rc=nonzero || _mp_rc=zero
assert_eq "main-push: exit non-zero" "nonzero" "$_mp_rc"
assert_contains "main-push: output names the file" "script.sh" "$OUT"
assert_contains "main-push: remediation pointer present" "shell-json.md" "$OUT"

# A clean main push must still pass — the fix must not invent violations.
echo "Test: clean main-push shape passes"
make_main_push_repo
printf '%s\n' '# no-op' >> "$REPO/script.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "clean follow-up push"
git -C "$REPO" push --quiet origin main
git -C "$REPO" update-ref refs/remotes/origin/main "$(git -C "$REPO" rev-parse HEAD)"
run_sut
assert_eq "main-push clean: exit 0" "0" "$RC"

report_results
