#!/usr/bin/env bash
# Tests for run-lint.sh's auto-detect gating (issue #2260).
#
# This suite proves the END-TO-END CI guard that #2260 closes: run-lint.sh's
# no-args auto-detect must reach the prose-rule lint stage when the ONLY
# HEAD-vs-origin/main change is an EXTENSIONLESS bash-shebang script. The old
# auto-detect keyed only on a `*.sh` path, so an extensionless-only PR set no
# RUN_PROSE and the prose linter never ran. The broadened is_shell_script path
# (extension OR shebang) closes that hole.
#
# test-lint-prose-rules.sh invokes lint-prose-rules.sh DIRECTLY and so does NOT
# exercise run-lint.sh's gating — this suite does, by running the REAL
# run-lint.sh (which in turn uses the real lib.sh / get-changed-apps.sh /
# lint-prose-rules.sh siblings from its own dir) with CWD inside an ephemeral
# repo. run-lint.sh diffs origin/main...HEAD of the CWD's repo, and
# lint-prose-rules.sh keys on `git rev-parse --show-toplevel` from CWD, so
# pointing CWD at the ephemeral repo makes the real scripts operate on it.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
source "$SCRIPT_DIR/test-helpers.sh"
# SUT is the REAL run-lint.sh under test (not a copy) — it sources the real
# lib.sh and shells out to the real sibling scripts via its own location.
SUT="$SCRIPT_DIR/run-lint.sh"

TMP_ROOT=""
cleanup() { [ -n "${TMP_ROOT:-}" ] && rm -rf "$TMP_ROOT"; }
trap cleanup EXIT INT TERM

# ---------------------------------------------------------------------------
# Fixture pieces, assembled so NO non-comment line of THIS source file contains
# a contiguous banned token (this .sh file is itself linted by
# lint-prose-rules.sh, so it must not self-match the gh-porcelain rule).
#
# _GH holds the literal 'gh', interpolated into printf strings that become
# fixture content written into ephemeral repos. The assignment line below does
# not contain the banned two-word `gh<sp>issue<sp>verb` sequence.
# ---------------------------------------------------------------------------
_GH='gh'
# Produces: RES=$(gh issue view "$N" --json title)
PORC_ISSUE_VIEW="RES=\$($_GH issue view \"\$N\" --json title)"

# Shebang line for extensionless fixtures: construct the '!' with printf so a
# zsh-hosted run does not history-expand '!' to '\!' (which would corrupt the
# leading '#!' and defeat is_shell_script's shebang regex). Same idiom as
# test-lint-prose-rules.sh Test 8.
_BANG="$(printf '\041')"
FIXTURE_SHEBANG="#${_BANG}/usr/bin/env bash"

# Build a fresh ephemeral repo whose ONLY HEAD-vs-origin/main change is a NEW
# extensionless bash-shebang file named dispatch-thing. Sets globals: REPO, BARE.
# $1 (optional): "with_porcelain" — add a porcelain call to dispatch-thing.
#
# The fixtures carry a root package.json declaring ONE workspace, fixture-app,
# committed in the baseline and never touched afterwards. Nothing in any case's
# diff lives under it, so DIRTY_APPS comes back empty and no app or dependency
# stage runs — leaving the prose stage as the single observable lint target,
# which is what these cases assert on.
#
# It has to be a real workspace, not an empty array: lib.sh's resolve_dirty_apps
# treats "no workspaces in package.json" as a hard error of its own, so an empty
# array would just swap one failure for another.
#
# It used to come for free from a bug. The fixture had no package.json at all,
# get-changed-apps.sh errored (rc=1) on the missing file, and run-lint.sh read
# it through `done < <(...)`, whose exit status set -e never sees — so the
# failure was swallowed and DIRTY_APPS stayed empty as a side effect. The
# comment here called the ERROR line "benign noise". It was not noise: it was
# the same buried-error shape this change exists to remove, and these cases
# were quietly depending on it. Now the failure propagates, so the fixture has
# to state the empty-workspace property outright instead of arriving at it by
# accident.
REPO=""
BARE=""
make_repo() {
  local include_porc="${1:-}"
  REPO=$(mktemp -d "$TMP_ROOT/repo.XXXXXX")
  BARE=$(mktemp -d "$TMP_ROOT/bare.XXXXXX")

  git -C "$BARE" init --bare --quiet --initial-branch=main

  git -C "$REPO" init --quiet --initial-branch=main
  git -C "$REPO" config user.email "test@example.com"
  git -C "$REPO" config user.name "Test User"
  git -C "$REPO" remote add origin "$BARE"

  # Baseline: an unrelated tracked file so origin/main is non-empty. The
  # extensionless dispatch-thing is NET-NEW on the feature branch only, so it
  # is the sole entry in the origin/main...HEAD diff.
  printf '%s\n' 'baseline' > "$REPO/README"
  printf '%s\n' '{ "workspaces": ["fixture-app"] }' > "$REPO/package.json"
  mkdir -p "$REPO/fixture-app"
  printf '%s\n' '{ "name": "fixture-app" }' > "$REPO/fixture-app/package.json"
  # run-lint.sh runs the type-safety escape-hatch check UNCONDITIONALLY, by an
  # absolute path under the CWD repo's root — and that checker resolves its own
  # repo root (and its origin/main...HEAD baseline) from its own on-disk
  # location, which is exactly why run-lint.sh invokes the copy in the tree
  # under test rather than its own sibling. So the ephemeral repo must carry it,
  # or every case here fails on a missing file rather than on what it asserts.
  # Committed in the BASELINE so the feature branch's diff stays exactly
  # dispatch-thing (and the checker's TS/JS filter makes it a self-noop anyway).
  mkdir -p "$REPO/.github/scripts"
  cp "$SCRIPT_DIR/../../../../.github/scripts/check-type-safety-escapes.sh" \
     "$REPO/.github/scripts/check-type-safety-escapes.sh"
  chmod +x "$REPO/.github/scripts/check-type-safety-escapes.sh"
  # That checker reaches resolve-diff-base.sh through its OWN on-disk location
  # (the helper is a tool that must sit beside it; the tree to scan is named
  # separately via --repo-root), so the ephemeral repo must carry the helper
  # too — otherwise every case here fails on a missing file rather than on what
  # it asserts. Committed in the BASELINE, so it never appears in the diff.
  mkdir -p "$REPO/.claude/skills/dispatch-propagate/scripts"
  cp "$SCRIPT_DIR/resolve-diff-base.sh" \
     "$REPO/.claude/skills/dispatch-propagate/scripts/resolve-diff-base.sh"
  chmod +x "$REPO/.claude/skills/dispatch-propagate/scripts/resolve-diff-base.sh"
  git -C "$REPO" add -A
  git -C "$REPO" commit --quiet -m "baseline"
  git -C "$REPO" push --quiet origin main

  git -C "$REPO" checkout --quiet -b feature
  # Ensure origin/main is resolvable so origin/main...HEAD diffs cleanly.
  git -C "$REPO" fetch --quiet origin main

  # NEW extensionless bash-shebang script — the only HEAD change.
  printf '%s\n' "$FIXTURE_SHEBANG" > "$REPO/dispatch-thing"
  printf '%s\n' 'set -euo pipefail' >> "$REPO/dispatch-thing"
  if [ "$include_porc" = "with_porcelain" ]; then
    printf '%s\n' "$PORC_ISSUE_VIEW" >> "$REPO/dispatch-thing"
  else
    printf '%s\n' 'echo hello' >> "$REPO/dispatch-thing"
  fi
  git -C "$REPO" add -A
  git -C "$REPO" commit --quiet -m "add extensionless script"
}

# Run run-lint.sh (no args → auto-detect) with CWD inside $REPO.
# Sets globals: RC, OUT.
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
# Test 1 (REQUIRED): extensionless-only PR with a porcelain violation.
# run-lint.sh's auto-detect must reach the prose stage via the broadened
# is_shell_script path (the old *.sh path would have missed this file), and the
# porcelain violation must propagate as a non-zero exit.
# ---------------------------------------------------------------------------
echo "Test 1: extensionless porcelain reaches prose stage and fails"
make_repo with_porcelain
run_sut
assert_contains "porcelain: reached prose stage" "=== Prose-rule lint ===" "$OUT"
[ "$RC" -ne 0 ] && _t1_rc=nonzero || _t1_rc=zero
assert_eq "porcelain: exit non-zero" "nonzero" "$_t1_rc"
assert_contains "porcelain: prose failure surfaced" "FAIL: prose" "$OUT"
assert_contains "porcelain: names the file" "dispatch-thing" "$OUT"

# ---------------------------------------------------------------------------
# Test 2 (positive control): extensionless-only PR with CLEAN shell content.
# Detection still fires (broadened path keys on the shebang, not the porcelain),
# so the prose stage runs — and passes, exiting 0.
# ---------------------------------------------------------------------------
echo "Test 2: clean extensionless script reaches prose stage and passes"
make_repo
run_sut
assert_contains "clean: reached prose stage" "=== Prose-rule lint ===" "$OUT"
assert_eq "clean: exit 0" "0" "$RC"
assert_contains "clean: prose PASS printed" "PASS: prose" "$OUT"

# ---------------------------------------------------------------------------
# Test 3 (THE FIX): the PUSH-TO-MAIN shape reaches the prose stage.
#
# actions/checkout leaves refs/remotes/origin/main pointing AT the pushed
# commit, so HEAD == origin/main and the `origin/main...HEAD` range run-lint.sh
# used to carry was empty. RUN_NIX / RUN_RULES / RUN_PROSE / RUN_DS_DRIFT all
# stayed false — five of run-lint.sh's eight check blocks silently off — and
# the run printed "No changed-file lint targets matched. Only the unconditional
# checks ran." and exited 0. A violation committed straight to main was never
# looked at.
#
# Same fixture as make_repo, but the violating file lands in the commit that
# origin/main and HEAD both point at, rather than on a feature branch.
# ---------------------------------------------------------------------------
make_main_push_repo() {
  REPO=$(mktemp -d "$TMP_ROOT/repo.XXXXXX")
  BARE=$(mktemp -d "$TMP_ROOT/bare.XXXXXX")

  git -C "$BARE" init --bare --quiet --initial-branch=main

  git -C "$REPO" init --quiet --initial-branch=main
  git -C "$REPO" config user.email "test@example.com"
  git -C "$REPO" config user.name "Test User"
  git -C "$REPO" remote add origin "$BARE"

  printf '%s\n' 'baseline' > "$REPO/README"
  printf '%s\n' '{ "workspaces": ["fixture-app"] }' > "$REPO/package.json"
  mkdir -p "$REPO/fixture-app"
  printf '%s\n' '{ "name": "fixture-app" }' > "$REPO/fixture-app/package.json"
  mkdir -p "$REPO/.github/scripts"
  cp "$SCRIPT_DIR/../../../../.github/scripts/check-type-safety-escapes.sh" \
     "$REPO/.github/scripts/check-type-safety-escapes.sh"
  chmod +x "$REPO/.github/scripts/check-type-safety-escapes.sh"
  # That checker reaches resolve-diff-base.sh through its OWN on-disk location
  # (the helper is a tool that must sit beside it; the tree to scan is named
  # separately via --repo-root), so the ephemeral repo must carry the helper
  # too — otherwise every case here fails on a missing file rather than on what
  # it asserts. Committed in the BASELINE, so it never appears in the diff.
  mkdir -p "$REPO/.claude/skills/dispatch-propagate/scripts"
  cp "$SCRIPT_DIR/resolve-diff-base.sh" \
     "$REPO/.claude/skills/dispatch-propagate/scripts/resolve-diff-base.sh"
  chmod +x "$REPO/.claude/skills/dispatch-propagate/scripts/resolve-diff-base.sh"
  git -C "$REPO" add -A
  git -C "$REPO" commit --quiet -m "baseline"
  git -C "$REPO" push --quiet origin main

  # The push under test: an extensionless bash-shebang script carrying a
  # porcelain violation, committed on main and pushed. No feature branch.
  printf '%s\n' "$FIXTURE_SHEBANG" > "$REPO/dispatch-thing"
  printf '%s\n' 'set -euo pipefail' >> "$REPO/dispatch-thing"
  printf '%s\n' "$PORC_ISSUE_VIEW" >> "$REPO/dispatch-thing"
  git -C "$REPO" add -A
  git -C "$REPO" commit --quiet -m "add extensionless script (the push)"
  git -C "$REPO" push --quiet origin main
  git -C "$REPO" fetch --quiet origin main
  # This is the state actions/checkout leaves on a push to main.
  git -C "$REPO" update-ref refs/remotes/origin/main "$(git -C "$REPO" rev-parse HEAD)"
}

#
# TWO LAYERS. run-lint.sh's own gate (RUN_PROSE) and lint-prose-rules.sh's own
# baseline were BOTH vacuous in this shape, and both have to be fixed for the
# violation to surface — reaching the prose stage is not the same as the prose
# stage looking at anything. This case asserts the whole path end to end.
echo "Test 3: main-push shape reaches the prose stage and fails"
make_main_push_repo
# The reproduction, stated as an assertion: the expression run-lint.sh used to
# carry sees nothing at all in exactly this state.
assert_eq "main-push: the old three-dot range was empty" "" \
  "$(git -C "$REPO" diff --name-only 'refs/remotes/origin/main...HEAD')"  # diff-base-ok: the reproduction: asserts the old vacuous range sees nothing
run_sut
assert_contains "main-push: reached prose stage" "=== Prose-rule lint ===" "$OUT"
assert_contains "main-push: baseline came from first-parent" "source=first-parent" "$OUT"
[ "$RC" -ne 0 ] && _t3_rc=nonzero || _t3_rc=zero
assert_eq "main-push: exit non-zero" "nonzero" "$_t3_rc"
assert_contains "main-push: prose failure surfaced" "FAIL: prose" "$OUT"
assert_contains "main-push: names the file" "dispatch-thing" "$OUT"
_t3_absent=absent
[[ "$OUT" == *"No changed-file lint targets matched"* ]] && _t3_absent=present
assert_eq "main-push: the vacuous-pass message is absent" "absent" "$_t3_absent"

# ---------------------------------------------------------------------------
# Test 4: a failed baseline resolution must ABORT, not lint zero apps.
#
# The second residual failure mode of this whole change: the helper is wired
# correctly, and its exit code is swallowed on the way out. run-lint.sh read
# get-changed-apps.sh through `done < <(...)`, whose exit status set -e never
# sees — so a hard failure downstream produced zero apps and a clean-looking
# run, which is the exact shape of the bug being fixed, one layer up.
#
# Deleting refs/remotes/origin/main makes resolve-diff-base.sh exit 4, which
# fails get-changed-apps.sh, which must now fail run-lint.sh.
# ---------------------------------------------------------------------------
echo "Test 4: an unresolvable baseline aborts run-lint"
make_main_push_repo
git -C "$REPO" update-ref -d refs/remotes/origin/main
run_sut
[ "$RC" -ne 0 ] && _t4_rc=nonzero || _t4_rc=zero
assert_eq "unresolvable baseline: exit non-zero" "nonzero" "$_t4_rc"
assert_contains "unresolvable baseline: names the ref" "origin/main" "$OUT"
_t4_absent=absent
[[ "$OUT" == *"All lint checks passed"* ]] && _t4_absent=present
assert_eq "unresolvable baseline: did not report a clean pass" "absent" "$_t4_absent"

# ---------------------------------------------------------------------------
# Test 5: get-changed-apps.sh itself failing (ISOLATED from the resolve-
# diff-base.sh call at line ~85) must still abort run-lint, not lint zero apps.
#
# Test 4 above deletes refs/remotes/origin/main, which fails BOTH
# get-changed-apps.sh's own internal baseline resolution AND run-lint.sh's own
# separate `DIFF_BASE=$(resolve-diff-base.sh ...)` call a few lines later
# (line ~85, a plain assignment under `set -e` that was already fatal on its
# own). Measured by hand: reverting ONLY the `if !
# CHANGED_APPS=$("$SCRIPTS/get-changed-apps.sh")` guard back to the old
# `done < <(...)` process-substitution form, Test 4 still passes — because the
# OTHER call aborts first regardless. So Test 4 alone does not isolate this
# guard; it is coincidentally green on both the fixed and the broken form of
# THIS specific line, which is exactly the vacuous-fence shape this whole
# change exists to catch.
#
# This test isolates it: a scratch copy of run-lint.sh + the real lib.sh, with
# get-changed-apps.sh replaced by a stub that exits 1 while origin/main stays
# fully resolvable (so the line-85 resolve-diff-base.sh call would succeed).
# The only remaining way for run-lint.sh to fail here is the guard this test
# targets.
# ---------------------------------------------------------------------------
echo "Test 5: get-changed-apps.sh failing alone (baseline otherwise fine) aborts run-lint"
make_main_push_repo
SCRATCH_SCRIPTS=$(mktemp -d "$TMP_ROOT/scratch-scripts.XXXXXX")
cp "$SCRIPT_DIR/run-lint.sh" "$SCRATCH_SCRIPTS/run-lint.sh"
cp "$SCRIPT_DIR/lib.sh" "$SCRATCH_SCRIPTS/lib.sh"
chmod +x "$SCRATCH_SCRIPTS/run-lint.sh"
cat > "$SCRATCH_SCRIPTS/get-changed-apps.sh" <<'STUB'
#!/usr/bin/env bash
echo "get-changed-apps-stub: simulated failure" >&2
exit 1
STUB
chmod +x "$SCRATCH_SCRIPTS/get-changed-apps.sh"
prev_dir=$(pwd)
cd "$REPO"
set +e
OUT=$("$SCRATCH_SCRIPTS/run-lint.sh" 2>&1)
RC=$?
set -e
cd "$prev_dir"
[ "$RC" -ne 0 ] && _t5_rc=nonzero || _t5_rc=zero
assert_eq "isolated get-changed-apps failure: exit non-zero" "nonzero" "$_t5_rc"
assert_contains "isolated get-changed-apps failure: names the failure" "get-changed-apps.sh failed" "$OUT"
_t5_absent=absent
[[ "$OUT" == *"All lint checks passed"* ]] && _t5_absent=present
assert_eq "isolated get-changed-apps failure: did not report a clean pass" "absent" "$_t5_absent"
_t5_zeroapps=absent
[[ "$OUT" == *"No changed-file lint targets matched"* ]] && _t5_zeroapps=present
assert_eq "isolated get-changed-apps failure: did not silently fall through to zero apps" "absent" "$_t5_zeroapps"

report_results
