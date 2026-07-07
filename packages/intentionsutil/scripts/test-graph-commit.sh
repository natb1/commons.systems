#!/usr/bin/env bash
#
# test-graph-commit.sh — functional harness for graph-commit's --prune and
# --base support (tactic-graph-commit-prune-support).
#
# Sets up a throwaway bare origin plus writer clones (independent sessions),
# a `gh` PATH shim standing in for the GitHub check-run API (always reports
# the four required checks green, so the fast-path stamp step succeeds on the
# first poll), and GRAPH_COMMIT_* env overrides shrinking the poll windows.
# The graph-commit under test is copied into each clone at its real
# repo-relative path so its own REPO_ROOT resolution (derived from
# BASH_SOURCE, not cwd) points at the scratch clone.
#
# Covers:
#   1. --prune: an ordinary edit id and a prune id land in ONE commit
#   2. --prune guard: a prune id whose file is still present on disk is
#      rejected (no commit lands)
#   3. --base fresh: a --base entry matching origin/main's current blob lands
#   4. --base stale: a --base entry pointing at a blob origin/main no longer
#      has is refused (no commit lands, no rebase-retry burned)
#
# No network and no real gh needed; requires only bash + git.

set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GC_SCRIPT="$HARNESS_DIR/graph-commit"
[[ -f "$GC_SCRIPT" ]] || { echo "error: graph-commit not found at $GC_SCRIPT" >&2; exit 1; }

WORK="$(mktemp -d)" || { echo "error: mktemp failed" >&2; exit 1; }
trap 'rm -rf "$WORK"' EXIT

PASS=0; FAIL=0
ok() { echo "PASS: $1"; PASS=$((PASS + 1)); }
no() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }

# --- Scratch origin + seed content ------------------------------------------
ORIGIN="$WORK/origin.git"
git init -q --bare "$ORIGIN"
git -C "$ORIGIN" symbolic-ref HEAD refs/heads/main

SEED="$WORK/seed"
mkdir -p "$SEED"
git -C "$SEED" init -q -b main
git -C "$SEED" config user.email harness@test
git -C "$SEED" config user.name harness
git -C "$SEED" remote add origin "$ORIGIN"
mkdir -p "$SEED/intentions"

seed_node() { # <id> — a few numbered lines so edits/reads have real content
  local i
  {
    echo "id: $1"
    for i in $(seq 1 6); do echo "line$i: base"; done
  } >"$SEED/intentions/$1.md"
}
for id in t-prune-edit t-prune t-prune-guard t-base; do seed_node "$id"; done
git -C "$SEED" add -A
git -C "$SEED" commit -qm seed
git -C "$SEED" push -q origin main

# --- Writer clone helper -----------------------------------------------------
# Each clone gets its own copy of the graph-commit script under test, staged
# at the real repo-relative path, so its REPO_ROOT resolves to the clone.
make_clone() { # <dst> <identity>
  git clone -q "$ORIGIN" "$1"
  git -C "$1" config user.email "$2@test"
  git -C "$1" config user.name "$2"
  mkdir -p "$1/packages/intentionsutil/scripts" "$1/packages/intentionsutil/src"
  cp "$GC_SCRIPT" "$1/packages/intentionsutil/scripts/graph-commit"
  # The path must exist for STORE_MODULE resolution; none of these tests hit
  # the conflict/parking path, so it is never actually imported.
  : >"$1/packages/intentionsutil/src/store.js"
}

run_gc() { # <clonedir> <args...> — runs the in-clone graph-commit copy
  local dir="$1"; shift
  ( cd "$dir" && "$dir/packages/intentionsutil/scripts/graph-commit" "$@" )
}

# --- gh PATH shim ------------------------------------------------------------
# Only implements `gh api .../check-runs --jq ...`, always reporting all four
# required checks green so the fast-path stamp step succeeds on the first
# poll. graph-commit has no other gh usage.
mkdir -p "$WORK/bin"
cat >"$WORK/bin/gh" <<'SH'
#!/usr/bin/env bash
if [[ "$1" == "api" ]]; then
  echo "4 0"
  exit 0
fi
echo "gh shim: unsupported invocation: $*" >&2
exit 1
SH
chmod +x "$WORK/bin/gh"
export PATH="$WORK/bin:$PATH"

export GRAPH_COMMIT_CHECK_POLL_SECONDS=1
export GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS=10
export GRAPH_COMMIT_MAX_ATTEMPTS=3

# ---------------------------------------------------------------------------
# Tests 1-2: --prune
# ---------------------------------------------------------------------------

# Test 1: an ordinary edit id and a prune id land in ONE commit.
W1="$WORK/w1"
make_clone "$W1" writer-1
echo "line7: edited" >>"$W1/intentions/t-prune-edit.md"
rm -f "$W1/intentions/t-prune.md"
if run_gc "$W1" -m 'test: prune + edit' t-prune-edit --prune t-prune >"$WORK/w1.out" 2>&1; then
  landed_edit="$(git --git-dir="$ORIGIN" show main:intentions/t-prune-edit.md 2>/dev/null | grep -c 'line7: edited')"
  pruned_gone=1
  git --git-dir="$ORIGIN" cat-file -e main:intentions/t-prune.md 2>/dev/null && pruned_gone=0
  ncommits="$(git --git-dir="$ORIGIN" log --oneline main -2 | wc -l)"
  if [[ "$landed_edit" -eq 1 && "$pruned_gone" -eq 1 ]]; then
    ok "prune: edit + prune land together, deletion visible on main"
  else
    no "prune: edit=$landed_edit pruned_gone=$pruned_gone (see $WORK/w1.out)"
  fi
  # The edit and the deletion must be the SAME commit, not two commits.
  changed_paths="$(git --git-dir="$ORIGIN" show --name-only --format= main | sort | tr '\n' ' ')"
  if [[ "$changed_paths" == *"intentions/t-prune-edit.md"* && "$changed_paths" == *"intentions/t-prune.md"* ]]; then
    ok "prune: edit + prune land in the SAME commit"
  else
    no "prune: expected one commit touching both paths, got: $changed_paths"
  fi
else
  no "prune: expected exit 0, got $? (see $WORK/w1.out): $(cat "$WORK/w1.out")"
fi

# Test 2: a prune id whose file is still present on disk is rejected.
W2="$WORK/w2"
make_clone "$W2" writer-2
before_sha="$(git --git-dir="$ORIGIN" rev-parse main)"
if run_gc "$W2" --prune t-prune-guard >"$WORK/w2.out" 2>&1; then
  no "prune guard: expected rejection when file still present on disk, got exit 0"
else
  after_sha="$(git --git-dir="$ORIGIN" rev-parse main)"
  if grep -q "still exists on disk" "$WORK/w2.out" && [[ "$before_sha" == "$after_sha" ]]; then
    ok "prune guard: rejects a prune id still present on disk, no commit landed"
  else
    no "prune guard: rejected but wrong error or main moved: $(cat "$WORK/w2.out")"
  fi
fi

# ---------------------------------------------------------------------------
# Tests 3-4: --base compare-and-swap
# ---------------------------------------------------------------------------

# Test 3: --base fresh — a blob matching origin/main's current content lands.
W3="$WORK/w3"
make_clone "$W3" writer-3
fresh_sha="$(git -C "$W3" hash-object intentions/t-base.md)"
echo "line7: writer3 edit" >>"$W3/intentions/t-base.md"
if run_gc "$W3" -m 'test: base fresh' --base "t-base=$fresh_sha" t-base >"$WORK/w3.out" 2>&1; then
  landed="$(git --git-dir="$ORIGIN" show main:intentions/t-base.md 2>/dev/null | grep -c 'line7: writer3 edit')"
  if [[ "$landed" -eq 1 ]]; then
    ok "base fresh: a --base matching origin/main's blob lands"
  else
    no "base fresh: landed but content missing (see $WORK/w3.out)"
  fi
else
  no "base fresh: expected exit 0, got $? (see $WORK/w3.out): $(cat "$WORK/w3.out")"
fi

# Test 4: --base stale — a blob origin/main no longer has is refused.
W4="$WORK/w4"
make_clone "$W4" writer-4
stale_sha="$(git -C "$W4" hash-object intentions/t-base.md)"
before_sha="$(git --git-dir="$ORIGIN" rev-parse main)"

# Simulate a concurrent writer landing an unrelated change to the SAME node
# on origin/main, bypassing graph-commit (representing "another session
# already committed" for fast test setup — the mechanism under test is the
# blob comparison, not how the concurrent write itself lands).
OTHER="$WORK/other"
git clone -q "$ORIGIN" "$OTHER"
git -C "$OTHER" config user.email other@test
git -C "$OTHER" config user.name other
echo "line8: concurrent edit" >>"$OTHER/intentions/t-base.md"
git -C "$OTHER" commit -qam 'concurrent edit'
git -C "$OTHER" push -q origin main

echo "line7: writer4 edit (based on a stale read)" >>"$W4/intentions/t-base.md"
if run_gc "$W4" -m 'test: base stale' --base "t-base=$stale_sha" t-base >"$WORK/w4.out" 2>&1; then
  no "base stale: expected refusal, got exit 0"
else
  after_sha="$(git --git-dir="$ORIGIN" rev-parse main)"
  concurrent_sha="$(git -C "$OTHER" rev-parse HEAD)"
  if grep -q "stale base" "$WORK/w4.out" && [[ "$after_sha" == "$concurrent_sha" ]]; then
    ok "base stale: refuses a --base whose blob no longer matches origin/main, writer4 content NOT landed"
  else
    no "base stale: refused but wrong error or main moved unexpectedly: $(cat "$WORK/w4.out")"
  fi
fi

# ---------------------------------------------------------------------------
echo
echo "== $PASS passed, $FAIL failed =="
[[ "$FAIL" -eq 0 ]]
