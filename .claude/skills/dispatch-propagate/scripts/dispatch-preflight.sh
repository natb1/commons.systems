#!/usr/bin/env bash
# dispatch-preflight.sh <worktree-path> <phase> — a cheap, deterministic
# pre-spawn gate. The caller (dispatch-materialize-spawn) runs on the MAIN
# worktree and only invokes this script when the gate is enabled by config; this
# script does NOT read config, does not park/drop, and does not fetch (#2041).
#
# Contract:
#   exit 0 — pass (allow spawn).
#   exit non-zero — preflight failed (abort). On failure, exactly ONE specific
#                   reason line is printed to >&2.
#   exit 2 — usage error (missing <worktree-path> or un-cd-able path).
#
# LOAD-BEARING: this script cd's into the TARGET worktree ($1) right after
# arg-validation. dispatch-materialize-spawn runs on the *main* worktree, so CWD
# != target on entry. Without the cd, `git merge-tree HEAD origin/main` would run
# against main's HEAD (≈ origin/main) and silently ALWAYS PASS — the conflict
# check would become dead code. So all three checks operate on the target tree.
#
# The three checks are ordered cheap/local first, daemon-querying last, and
# SHORT-CIRCUIT on the first failure:
#   1. Lockfile parse — phase-independent; guards package-lock.json corruption.
#   2. Merge-tree conflict dry-run — PHASE-GATED (plan|implement|qa|review only);
#      exempt for fix-conflicts/fix-checks/empty/unknown to avoid starvation.
#   3. Live session — phase-independent; fail-safe daemon query (occupied OR
#      unknown → abort).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Source via $SCRIPT_DIR BEFORE the cd "$1", so these resolve relative to this
# script's own dir, not the target worktree.
source "$SCRIPT_DIR/lib.sh"
source "$SCRIPT_DIR/lib-claude-agents.sh"

# Arg validation. <worktree-path> ($1) is required; <phase> ($2) may be empty —
# an empty/unknown phase is a legitimate input (see check 2).
if [[ -z "${1-}" ]]; then
  echo "dispatch-preflight: usage: dispatch-preflight.sh <worktree-path> <phase>" >&2
  exit 2
fi

# LOAD-BEARING cd into the target worktree (see header).
cd "$1" || { echo "dispatch-preflight: cannot cd to $1" >&2; exit 2; }

# Check 1 — lockfile parse (phase-independent, runs first). Absent
# package-lock.json → PASS (the check guards corruption, not presence).
# set -e safety: capture rc explicitly so a non-zero jq fails the CHECK, not the
# script.
if [[ -f package-lock.json ]]; then
  rc=0; jq empty package-lock.json 2>/dev/null || rc=$?
  if [[ $rc -ne 0 ]]; then
    echo "dispatch-preflight: lockfile parse failed for $1/package-lock.json" >&2
    exit 1
  fi
fi

# Check 2 — merge-tree conflict dry-run (PHASE-GATED). Run ONLY for the four
# build phases. fix-conflicts/fix-checks/empty/unknown are EXEMPT: the codebase
# deliberately routes merge conflicts to the /dispatch-conflict phase rather than an
# abort, so booting that worker IS the resolution; aborting it would re-abort
# every tick forever (retry-forever starvation). An empty/unknown phase is the
# dispatch-phase exit-3 / pending-CI case where the existing ci-waiting
# reseed-with-attempt-cap path must win, not a preflight drain. origin/main is
# already fetched fresh by the caller's pipeline — do NOT fetch here.
# set -e safety: capture rc explicitly so a conflict fails the CHECK, not the
# script.
case "${2-}" in
  plan|implement|qa|review)
    rc=0; git merge-tree --write-tree HEAD origin/main >/dev/null 2>&1 || rc=$?
    if [[ $rc -eq 1 ]]; then
      echo "dispatch-preflight: merge conflict against origin/main in $1" >&2
      exit 1
    elif [[ $rc -ge 2 ]]; then
      echo "dispatch-preflight: git merge-tree infrastructure error (exit $rc) in $1 — origin/main may be missing or repo may be corrupted" >&2
      exit 2
    fi
    ;;
  *)
    : # exempt: fix-conflicts / fix-checks / empty / unknown phase — skip the conflict check
    ;;
esac

# Check 3 — live session (phase-independent, runs last — daemon query). Pass the
# ORIGINAL $1 (absolute worktree path), not ".", since the predicate matches on
# the worktree path/basename. The `if` guard is set -e-safe. The predicate folds
# unknown into occupied: return 0 = occupied OR unknown → do NOT start.
if worktree_has_live_session "$1"; then
  echo "dispatch-preflight: live session already in $1" >&2
  exit 1
fi

exit 0
