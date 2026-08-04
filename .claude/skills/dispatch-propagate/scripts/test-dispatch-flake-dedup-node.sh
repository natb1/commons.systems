#!/usr/bin/env bash
# Tests for dispatch-flake-dedup-node -- moved verbatim from test-dispatch-scripts.sh
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
