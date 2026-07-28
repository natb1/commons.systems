#!/usr/bin/env bash
# test-flake-stale-head-check.sh — tests for dispatch-flake-stale-head-check,
# the stale-head guard on the flake classifier's NONE path
# (tactic-flake-classifier-stale-head-guard).
#
# The guard answers one question: is a CI failure trustworthy as a NEW flake, or
# is it a deterministic failure on a PR head that is merely missing a fix already
# on origin/main? Two tiers:
#   Tier 1 — origin/main's tip is already an ancestor of the head → CURRENT,
#            with NO suite run (the expensive path is skipped).
#   Tier 2 — head is behind main → actually run the reproduce command against a
#            throwaway origin/main worktree. Passes there → STALE-HEAD.
#            Still fails there → CURRENT.
#
# Every case runs against a REAL scratch git repo (not a PATH-shimmed git), so
# the ancestry math and the throwaway-worktree lifecycle are exercised for real
# rather than mocked.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

GUARD="$SCRIPT_DIR/dispatch-flake-stale-head-check"

WORK=""
REPO=""

# Build a scratch repo shaped like the real situation:
#
#   A ── B(fix) ── C      <- origin/main
#    \
#     └── S               <- the "stale head": branched from A, missing B
#
# `probe.sh` is the reproduce command's target: it exits 1 at A/S (bug present)
# and exits 0 from B onward (fixed). marker.txt records each probe invocation so
# a test can assert whether tier 2 ran at all.
setup_repo() {
  WORK="$(mktemp -d)"
  REPO="$WORK/repo"
  mkdir -p "$REPO"
  git -C "$REPO" init --quiet -b main
  git -C "$REPO" config user.email "test@example.com"
  git -C "$REPO" config user.name "Test"

  # A — buggy
  cat > "$REPO/probe.sh" <<'EOF'
#!/usr/bin/env bash
echo "probe ran" >> "${PROBE_MARKER:-/dev/null}"
exit 1
EOF
  chmod +x "$REPO/probe.sh"
  git -C "$REPO" add probe.sh
  git -C "$REPO" commit --quiet -m "A: buggy"
  A=$(git -C "$REPO" rev-parse HEAD)

  # S — the stale head, branched from A (never gets the fix)
  git -C "$REPO" checkout --quiet -b stale "$A"
  echo "unrelated head-only change" > "$REPO/head-only.txt"
  git -C "$REPO" add head-only.txt
  git -C "$REPO" commit --quiet -m "S: unrelated work on the PR branch"
  STALE_HEAD=$(git -C "$REPO" rev-parse HEAD)

  # B — the fix; C — a later unrelated commit
  git -C "$REPO" checkout --quiet main
  cat > "$REPO/probe.sh" <<'EOF'
#!/usr/bin/env bash
echo "probe ran" >> "${PROBE_MARKER:-/dev/null}"
exit 0
EOF
  chmod +x "$REPO/probe.sh"
  git -C "$REPO" add probe.sh
  git -C "$REPO" commit --quiet -m "B: fix"
  git -C "$REPO" commit --quiet --allow-empty -m "C: later commit"
  MAIN_TIP=$(git -C "$REPO" rev-parse HEAD)

  # A head that HAS main's tip merged in (the up-to-date case).
  git -C "$REPO" checkout --quiet -b current "$MAIN_TIP"
  git -C "$REPO" commit --quiet --allow-empty -m "D: work on top of current main"
  CURRENT_HEAD=$(git -C "$REPO" rev-parse HEAD)

  git -C "$REPO" checkout --quiet main

  # The guard resolves origin/main, so give the repo a self-referential remote
  # ref rather than a second clone — same ref name, no network.
  git -C "$REPO" update-ref refs/remotes/origin/main "$MAIN_TIP"

  export PROBE_MARKER="$WORK/probe-marker.txt"
  : > "$PROBE_MARKER"
}

teardown_repo() {
  [[ -n "$WORK" ]] && rm -rf "$WORK"
  WORK=""; REPO=""
  unset PROBE_MARKER
}

# Count probe invocations. NOTE `grep -c` prints the count AND exits 1 when the
# count is zero, so the `|| true` is what keeps an empty marker printing exactly
# one "0" rather than falling through to a second echo.
probe_runs() {
  if [[ -f "$PROBE_MARKER" ]]; then
    grep -c . "$PROBE_MARKER" || true
  else
    echo 0
  fi
}

echo "=== dispatch-flake-stale-head-check ==="

# --- Tier 1: head already contains main's tip → CURRENT, no suite run --------
echo "Test: head contains origin/main tip → CURRENT without running the probe"
setup_repo
out=$(cd "$REPO" && "$GUARD" --head-ref "$CURRENT_HEAD" --reproduce-cmd "./probe.sh" 2>/dev/null)
assert_eq "tier1: disposition CURRENT" "CURRENT" "$out"
assert_eq "tier1: probe NOT run (expensive path skipped)" "0" "$(probe_runs)"
teardown_repo

# --- Tier 2: behind main + probe passes at main → STALE-HEAD -----------------
# This is the 2026-07-22 incident's exact shape: the head fails, main is fixed.
echo "Test: head behind main and probe passes at origin/main → STALE-HEAD"
setup_repo
out=$(cd "$REPO" && "$GUARD" --head-ref "$STALE_HEAD" --reproduce-cmd "./probe.sh" 2>/dev/null)
assert_eq "tier2 stale: disposition STALE-HEAD" "STALE-HEAD" "$out"
assert_eq "tier2 stale: probe ran at origin/main" "1" "$(probe_runs)"
teardown_repo

# --- Tier 2: behind main but probe STILL fails at main → CURRENT -------------
# Being behind main does not by itself excuse a failure: if main is red too, the
# signal is real and must still be filed.
echo "Test: head behind main but probe still fails at origin/main → CURRENT"
setup_repo
# Land the bug on main as well, so the probe fails at origin/main too.
git -C "$REPO" checkout --quiet main
cat > "$REPO/probe.sh" <<'EOF'
#!/usr/bin/env bash
echo "probe ran" >> "${PROBE_MARKER:-/dev/null}"
exit 1
EOF
chmod +x "$REPO/probe.sh"
git -C "$REPO" add probe.sh
git -C "$REPO" commit --quiet -m "E: main is red too"
git -C "$REPO" update-ref refs/remotes/origin/main "$(git -C "$REPO" rev-parse HEAD)"
out=$(cd "$REPO" && "$GUARD" --head-ref "$STALE_HEAD" --reproduce-cmd "./probe.sh" 2>/dev/null)
assert_eq "tier2 red-main: disposition CURRENT" "CURRENT" "$out"
assert_eq "tier2 red-main: probe ran at origin/main" "1" "$(probe_runs)"
teardown_repo

# --- Throwaway worktree is cleaned up on BOTH paths --------------------------
echo "Test: origin/main probe worktree is removed after the run"
setup_repo
(cd "$REPO" && "$GUARD" --head-ref "$STALE_HEAD" --reproduce-cmd "./probe.sh" >/dev/null 2>&1)
assert_eq "cleanup: no probe worktree left registered" "1" \
  "$(git -C "$REPO" worktree list | grep -c .)"
teardown_repo

# A probe that leaves the tree DIRTY must still be removable (the cleanup uses
# --force precisely for this).
echo "Test: probe worktree removed even when the probe dirties the tree"
setup_repo
(cd "$REPO" && "$GUARD" --head-ref "$STALE_HEAD" \
  --reproduce-cmd "echo dirt > probe.sh; ./probe.sh" >/dev/null 2>&1) || true
assert_eq "cleanup dirty: no probe worktree left registered" "1" \
  "$(git -C "$REPO" worktree list | grep -c .)"
teardown_repo

# --- Fail-loud argument handling ---------------------------------------------
# Each of these must exit non-zero and print NO disposition: silently answering
# CURRENT on a broken invocation would re-open the hole this guard closes.
echo "Test: missing --head-ref → exit 2, no disposition"
setup_repo
rc=0; out=$(cd "$REPO" && "$GUARD" --reproduce-cmd "./probe.sh" 2>/dev/null) || rc=$?
assert_eq "missing head-ref: exit 2" "2" "$rc"
assert_eq "missing head-ref: no disposition on stdout" "" "$out"
teardown_repo

echo "Test: missing --reproduce-cmd → exit 2, no disposition"
setup_repo
rc=0; out=$(cd "$REPO" && "$GUARD" --head-ref "$STALE_HEAD" 2>/dev/null) || rc=$?
assert_eq "missing reproduce-cmd: exit 2" "2" "$rc"
assert_eq "missing reproduce-cmd: no disposition on stdout" "" "$out"
teardown_repo

echo "Test: unresolvable --head-ref → exit 2, no disposition"
setup_repo
rc=0; out=$(cd "$REPO" && "$GUARD" --head-ref "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef" \
  --reproduce-cmd "./probe.sh" 2>/dev/null) || rc=$?
assert_eq "bad head-ref: exit 2" "2" "$rc"
assert_eq "bad head-ref: no disposition on stdout" "" "$out"
teardown_repo

echo "Test: unknown flag → exit 2, no disposition"
setup_repo
rc=0; out=$(cd "$REPO" && "$GUARD" --head-ref "$STALE_HEAD" --nope x 2>/dev/null) || rc=$?
assert_eq "unknown flag: exit 2" "2" "$rc"
assert_eq "unknown flag: no disposition on stdout" "" "$out"
teardown_repo

# A reproduce command that cannot run at all is NOT evidence that main is red —
# treating exit 127 as "still fails at main" would wrongly answer CURRENT.
echo "Test: unrunnable reproduce command → exit 2, no disposition"
setup_repo
rc=0; out=$(cd "$REPO" && "$GUARD" --head-ref "$STALE_HEAD" \
  --reproduce-cmd "definitely-not-a-real-command-xyz" 2>/dev/null) || rc=$?
assert_eq "unrunnable probe: exit 2" "2" "$rc"
assert_eq "unrunnable probe: no disposition on stdout" "" "$out"
teardown_repo

report_results
