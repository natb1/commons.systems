#!/usr/bin/env bash
# Tests for dispatch-derive-node-target — the shared front-door target
# derivation script (tactic-dispatch-skill-input-contract Unit 1).
#
# Harness: an ephemeral bare-origin + working-checkout git fixture (mirrors
# test-lint-prose-rules.sh's make_repo()) carrying a real intentions/<id>.md
# node file on origin/main, checked out on a feature branch NAMED EXACTLY the
# node id (the SUT's branch-consistency check requires this) with origin/main
# fetched. `gh` is stubbed via a real $PATH shim (NOT a sibling-script stub —
# the SUT invokes `gh` by bare name).
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
source "$SCRIPT_DIR/test-helpers.sh"
SUT="$SCRIPT_DIR/dispatch-derive-node-target"

TMP_ROOT=""
cleanup() { [ -n "${TMP_ROOT:-}" ] && rm -rf "$TMP_ROOT"; }
trap cleanup EXIT INT TERM
TMP_ROOT=$(mktemp -d)

BODY_MARKER="FIXTURE BODY MARKER TEXT"

# Write a valid intentions/<id>.md node file into $1 (a repo working dir).
# $2 = node id, $3 = phase, $4 = execution YAML block (optional; defaults to
# `execution: null`). $4 lets a case seed an active CI-fix interrupt
# (execution.fix non-null) to exercise the --expect-fix-active gate.
write_node_fixture() {
  local repo="$1" id="$2" phase="$3" execution="${4:-execution: null}"
  mkdir -p "$repo/intentions"
  cat > "$repo/intentions/$id.md" <<EOF
---
id: $id
kind: tactic
statement: Fixture tactic node for dispatch-derive-node-target tests
owner: ai
status: codified
parent: null
phase: $phase
$execution
serves: []
recovers: []
clarifications: []
tooling_goals: []
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
rationale: null
reading: null
gap: null
success_signal: null
attention: null
---
# Fixture tactic node

$BODY_MARKER
EOF
}

# Build a fresh ephemeral bare-origin + working-checkout fixture. Sets
# globals: REPO, BARE.
# $1 = node id to check out as the feature branch (empty = don't check out a
#      node-named branch; caller checks out something else).
# $2 = "with_node:<phase>" to seed intentions/<node-id>.md on origin/main
#      before push (execution: null); "with_fix:<phase>" to seed it with a
#      non-null execution.fix (an active CI-fix interrupt) at the given phase;
#      or empty to omit the node entirely.
REPO=""
BARE=""
make_repo() {
  local branch_id="$1" seed="${2:-}"
  REPO=$(mktemp -d "$TMP_ROOT/repo.XXXXXX")
  BARE=$(mktemp -d "$TMP_ROOT/bare.XXXXXX")

  git -C "$BARE" init --bare --quiet --initial-branch=main

  git -C "$REPO" init --quiet --initial-branch=main
  git -C "$REPO" config user.email "test@example.com"
  git -C "$REPO" config user.name "Test User"
  git -C "$REPO" remote add origin "$BARE"

  if [[ "$seed" == with_node:* ]]; then
    local phase="${seed#with_node:}"
    write_node_fixture "$REPO" "$branch_id" "$phase"
  elif [[ "$seed" == with_fix:* ]]; then
    local phase="${seed#with_fix:}"
    # Non-null execution with an active CI-fix interrupt (execution.fix set).
    local exec_block
    exec_block=$(cat <<'FIXEOF'
execution:
  branch: fixture-branch
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix:
    since: 2026-07-19
    attempt: 1
    pushed_sha: null
FIXEOF
)
    write_node_fixture "$REPO" "$branch_id" "$phase" "$exec_block"
  else
    printf '%s\n' "# placeholder" > "$REPO/README.md"
  fi

  git -C "$REPO" add -A
  git -C "$REPO" commit --quiet -m "baseline"
  git -C "$REPO" push --quiet origin main

  if [[ -n "$branch_id" ]]; then
    git -C "$REPO" checkout --quiet -b "$branch_id"
  else
    git -C "$REPO" checkout --quiet -b some-other-branch
  fi

  git -C "$REPO" fetch --quiet origin main
}

# --- gh stub -----------------------------------------------------------------
# A real $PATH shim (the SUT invokes `gh` by bare name, not via
# "$SCRIPT_DIR/gh"). The SUT resolves its open-PR lookup through lib.sh's
# gh_pr_list_rest, which shells out to `gh repo view --json owner -q
# .owner.login` (to resolve the --head owner) and then `gh api --paginate
# repos/{owner}/{repo}/pulls?...` — never the retired `gh pr list` porcelain.
# Reads GH_PR_NUM and echoes a matching REST-shaped PR object for the `api`
# call; logs its full argv to $GH_LOG so a test can assert "gh was never
# called".
STUB_DIR="$TMP_ROOT/stub"
mkdir -p "$STUB_DIR"
GH_LOG="$TMP_ROOT/gh.log"
cat > "$STUB_DIR/gh" <<'STUBEOF'
#!/usr/bin/env bash
echo "$@" >> "$GH_LOG"
if [[ "$1" == "repo" && "$2" == "view" ]]; then
  echo "testowner"
elif [[ "$1" == "api" ]]; then
  if [[ -n "${GH_PR_NUM:-}" ]]; then
    printf '[{"number": %s, "state": "open", "merged_at": null, "created_at": "2026-01-01T00:00:00Z"}]\n' "$GH_PR_NUM"
  else
    printf '[]\n'
  fi
fi
STUBEOF
chmod +x "$STUB_DIR/gh"

# Run the SUT with CWD inside $REPO, PATH prefixed with the gh stub dir. Sets
# globals: RC, OUT. GH_LOG is truncated before each run so a test's assertion
# on "gh not called" is not polluted by a prior case.
RC=0
OUT=""
run_sut() {
  local prev_dir
  prev_dir=$(pwd)
  : > "$GH_LOG"
  cd "$REPO"
  set +e
  OUT=$(PATH="$STUB_DIR:$PATH" GH_LOG="$GH_LOG" GH_PR_NUM="${GH_PR_NUM:-}" "$SUT" "$@" 2>&1)
  RC=$?
  # The suite runs `set -uo pipefail` and never enables errexit; `set +e` above
  # only guards this one command substitution. Do NOT force errexit on here —
  # restoring the suite's actual (errexit-off) state means leaving it off.
  cd "$prev_dir"
}

# ---------------------------------------------------------------------------
# Test 1: node id absent from origin/main → exit 1.
# ---------------------------------------------------------------------------
echo "Test 1: node absent from origin/main -> exit 1"
make_repo "tactic-absent-node"
run_sut "tactic-absent-node" --expect-phase implement
assert_eq "absent-node: exit 1" "1" "$RC"

# ---------------------------------------------------------------------------
# Test 2: node present at phase draft, SUT expects implement -> exit 3.
# ---------------------------------------------------------------------------
echo "Test 2: phase mismatch -> exit 3"
make_repo "tactic-phase-mismatch" "with_node:draft"
run_sut "tactic-phase-mismatch" --expect-phase implement
assert_eq "phase-mismatch: exit 3" "3" "$RC"

# ---------------------------------------------------------------------------
# Test 3: node present at implement, --pr-mode none -> exit 0, PR: none, gh
# never invoked.
# ---------------------------------------------------------------------------
echo "Test 3: pr-mode none -> exit 0, PR: none, gh not called"
make_repo "tactic-pr-none" "with_node:implement"
run_sut "tactic-pr-none" --expect-phase implement --pr-mode none
assert_eq "pr-mode-none: exit 0" "0" "$RC"
assert_contains "pr-mode-none: stdout has PR: none" "PR: none" "$OUT"
GH_LOG_SIZE=$(wc -c < "$GH_LOG" 2>/dev/null || echo 0)
assert_eq "pr-mode-none: gh log empty" "0" "$GH_LOG_SIZE"

# ---------------------------------------------------------------------------
# Test 4: node present at implement, --pr-mode required, gh returns empty ->
# exit 4.
# ---------------------------------------------------------------------------
echo "Test 4: pr-mode required with no open PR -> exit 4"
make_repo "tactic-pr-required-missing" "with_node:implement"
GH_PR_NUM="" run_sut "tactic-pr-required-missing" --expect-phase implement --pr-mode required
assert_eq "pr-mode-required-missing: exit 4" "4" "$RC"

# ---------------------------------------------------------------------------
# Test 5: node present at implement, --pr-mode required, gh returns 42 ->
# exit 0; PR line contains 42; NODE-JSON .phase == implement; NODE-BODY
# contains the fixture marker verbatim.
# ---------------------------------------------------------------------------
echo "Test 5: pr-mode required with an open PR -> exit 0, full output checks"
make_repo "tactic-pr-required-found" "with_node:implement"
GH_PR_NUM="42" run_sut "tactic-pr-required-found" --expect-phase implement --pr-mode required
assert_eq "pr-mode-required-found: exit 0" "0" "$RC"
assert_contains "pr-mode-required-found: PR line has 42" "PR: 42" "$OUT"
NODE_JSON_LINE=$(printf '%s\n' "$OUT" | sed -n '/=== NODE-JSON ===/{n;p}')
JSON_PHASE=$(jq -r '.phase' <<<"$NODE_JSON_LINE")
assert_eq "pr-mode-required-found: NODE-JSON .phase" "implement" "$JSON_PHASE"
assert_contains "pr-mode-required-found: NODE-BODY has fixture marker" "$BODY_MARKER" "$OUT"

# ---------------------------------------------------------------------------
# Test 6: node present at implement, --pr-mode optional, gh returns empty ->
# exit 0, PR: none.
# ---------------------------------------------------------------------------
echo "Test 6: pr-mode optional with no open PR -> exit 0, PR: none"
make_repo "tactic-pr-optional-missing" "with_node:implement"
GH_PR_NUM="" run_sut "tactic-pr-optional-missing" --expect-phase implement --pr-mode optional
assert_eq "pr-mode-optional-missing: exit 0" "0" "$RC"
assert_contains "pr-mode-optional-missing: stdout has PR: none" "PR: none" "$OUT"

# ---------------------------------------------------------------------------
# Test 7: current branch does not match the node id -> exit 2.
# ---------------------------------------------------------------------------
echo "Test 7: branch name mismatch -> exit 2"
make_repo ""
run_sut "tactic-branch-mismatch" --expect-phase implement
assert_eq "branch-mismatch: exit 2" "2" "$RC"

# ---------------------------------------------------------------------------
# Test 8: malformed node id (uppercase / underscore) -> exit 2, no git/gh
# calls required to succeed first.
# ---------------------------------------------------------------------------
echo "Test 8: malformed node id -> exit 2"
make_repo ""
run_sut "Tactic_Bad" --expect-phase implement
assert_eq "malformed-node-id: exit 2" "2" "$RC"

# ---------------------------------------------------------------------------
# Test 9: --expect-fix-active, node present but execution.fix is null -> exit 3.
# ---------------------------------------------------------------------------
echo "Test 9: expect-fix-active with null execution.fix -> exit 3"
make_repo "tactic-fix-inactive" "with_node:implement"
run_sut "tactic-fix-inactive" --expect-fix-active
assert_eq "fix-active-null: exit 3" "3" "$RC"

# ---------------------------------------------------------------------------
# Test 10: --expect-fix-active, execution.fix non-null, --pr-mode none ->
# exit 0, PR: none.
# ---------------------------------------------------------------------------
echo "Test 10: expect-fix-active with active interrupt, pr-mode none -> exit 0"
make_repo "tactic-fix-active" "with_fix:implement"
run_sut "tactic-fix-active" --expect-fix-active --pr-mode none
assert_eq "fix-active-none: exit 0" "0" "$RC"
assert_contains "fix-active-none: stdout has PR: none" "PR: none" "$OUT"

# ---------------------------------------------------------------------------
# Test 11: --expect-fix-active, execution.fix non-null, --pr-mode required,
# gh returns empty -> exit 4.
# ---------------------------------------------------------------------------
echo "Test 11: expect-fix-active, pr-mode required with no open PR -> exit 4"
make_repo "tactic-fix-active-nopr" "with_fix:implement"
GH_PR_NUM="" run_sut "tactic-fix-active-nopr" --expect-fix-active --pr-mode required
assert_eq "fix-active-required-missing: exit 4" "4" "$RC"

# ---------------------------------------------------------------------------
# Test 12: both --expect-phase and --expect-fix-active given -> exit 2.
# ---------------------------------------------------------------------------
echo "Test 12: both gate flags given -> exit 2 (usage error)"
make_repo "tactic-both-flags" "with_fix:implement"
run_sut "tactic-both-flags" --expect-phase implement --expect-fix-active
assert_eq "both-gate-flags: exit 2" "2" "$RC"

# ---------------------------------------------------------------------------
# Test 13: neither --expect-phase nor --expect-fix-active given -> exit 2.
# ---------------------------------------------------------------------------
echo "Test 13: no gate flag given -> exit 2 (usage error)"
make_repo "tactic-no-gate" "with_node:implement"
run_sut "tactic-no-gate" --pr-mode none
assert_eq "no-gate-flag: exit 2" "2" "$RC"

report_results
