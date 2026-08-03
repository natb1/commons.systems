#!/usr/bin/env bash
# lib-worktree-residue.sh — STRICTLY READ-ONLY inspection of a node worktree's
# residue condition (tactic-stale-hold-auto-resolve, unit 2).
#
# The predicate "does this node's worktree still carry mechanical residue?" is
# what a worktree-residue hold exists to track. Two callers need it:
#
#   1. provision-node-worktree, which INSPECTS and then REPAIRS (aborts an
#      abandoned rebase/merge/cherry-pick and re-checks). The repair stays in
#      the provisioner — it owns the worktree it is about to hand a phase agent.
#   2. the stale-hold sweep, which only asks whether the hold still has a live
#      reason to exist. It does NOT own the worktree, so it must never abort,
#      checkout, or write anything there.
#
# This library is the shared INSPECTION half, and it is read-only by
# construction: it runs `rev-parse`, `symbolic-ref -q`, and
# `status --porcelain` and nothing else. No function here may ever repair.
#
# Two functions, both taking the worktree path explicitly (no globals):
#
#   worktree_identity_ok <worktree-path> <node-id>
#     stdout on mismatch: `toplevel=<t> git-dir=<g>` (empty on success;
#                         `<none>` for a component that would not resolve)
#     return 0 — <path> IS the linked worktree for <node-id>
#     return 1 — orphan directory / identity mismatch
#     return 2 — directory missing, or git could not be run there at all
#
#   worktree_residue_condition <worktree-path> <expected-branch>
#     stdout: exactly one slug —
#       absent | clean | rebase-in-progress | merge-in-progress |
#       cherry-pick-in-progress | detached-head | wrong-branch:<branch> |
#       dirty-tracked-tree | unknown
#     return 0 — absent | clean (no residue)
#     return 1 — any residue slug
#     return 2 — unknown (could not inspect; callers KEEP the hold)
#
# The identity assertion runs FIRST inside worktree_residue_condition, because a
# node worktree lives INSIDE the project root's own working tree
# (<root>/.claude/worktrees/<node-id>). When the directory exists but carries no
# valid `.git` file, git discovery walks UP and every `git -C <path> …` silently
# addresses the enclosing `main` checkout — so an orphan directory would
# otherwise report MAIN's dirt as this node's residue. On any identity failure
# the condition is `unknown`, never a status read.
#
# `<expected-branch>` doubles as the node id for that assertion: a node worktree
# is registered under its node id and has the same-named branch checked out.
#
# Safe to source multiple times. Does NOT use set -e (must return, not exit).
#
# Side effect: sourcing this file once sets `-u` and `-o pipefail` in the caller
# shell.

if [[ -z "${_LIB_WORKTREE_RESIDUE_LOADED:-}" ]]; then
  _LIB_WORKTREE_RESIDUE_LOADED=1

  set -uo pipefail

  # worktree_identity_ok <worktree-path> <node-id>
  # See the header comment for the return-code contract.
  worktree_identity_ok() {
    local wt="${1:-}" node_id="${2:-}"
    [[ -n "$wt" && -n "$node_id" ]] || return 2
    [[ -d "$wt" ]] || return 2

    local wt_real top top_real gitdir
    wt_real=$(cd "$wt" && pwd -P) || return 2
    [[ -n "$wt_real" ]] || return 2

    top=$(git -C "$wt" rev-parse --show-toplevel 2>/dev/null)
    gitdir=$(git -C "$wt" rev-parse --absolute-git-dir 2>/dev/null)
    top_real=""
    if [[ -n "$top" && -d "$top" ]]; then
      top_real=$(cd "$top" && pwd -P)
    fi

    if [[ "$top_real" == "$wt_real" && "$gitdir" == */worktrees/"$node_id" ]]; then
      return 0
    fi

    printf 'toplevel=%s git-dir=%s\n' "${top_real:-<none>}" "${gitdir:-<none>}"
    # Neither resolved: git could not be run there at all (not a repo, or the
    # directory is unreadable) — an inspection failure, not an orphan.
    if [[ -z "$top_real" && -z "$gitdir" ]]; then
      return 2
    fi
    return 1
  }

  # _wr_git_path <worktree-path> <worktree-realpath> <worktree-git-dir> <name>
  # Resolve a git-path (rebase-merge, MERGE_HEAD, …) as an ABSOLUTE path.
  # `git -C <wt> rev-parse --git-path X` prints a path relative to <wt> for a
  # plain repo (absolute for a linked worktree), so a bare `[[ -d ]]` from
  # another cwd would silently miss it.
  #
  # Containment guard: a resolved path that escapes this worktree's OWN git dir
  # is never followed. An orphan directory yields the relative `../.git/<name>`,
  # which the prefixing below would turn into the ENCLOSING checkout's operation
  # state. worktree_identity_ok already makes that unreachable; this is the
  # boundary assertion that keeps it so.
  _wr_git_path() {
    local wt="$1" wt_real="$2" gitdir="$3" name="$4"
    local p
    p=$(git -C "$wt" rev-parse --git-path "$name" 2>/dev/null) || return 1
    [[ -n "$p" ]] || return 1
    [[ "$p" == /* ]] || p="$wt_real/$p"
    if [[ "$p" != "$gitdir"/* ]]; then
      echo "lib-worktree-residue: git-path '$name' resolved to '$p', outside this worktree's git dir ($gitdir)" >&2
      return 1
    fi
    printf '%s\n' "$p"
  }

  # worktree_residue_condition <worktree-path> <expected-branch>
  # See the header comment for the slug/return-code contract. READ-ONLY: it
  # never aborts an operation, never checks anything out, never writes.
  worktree_residue_condition() {
    local wt="${1:-}" expected_branch="${2:-}"
    if [[ -z "$wt" || -z "$expected_branch" ]]; then
      printf 'unknown\n'
      return 2
    fi

    # An absent worktree is not a residue condition — there is nothing there to
    # block anything.
    if [[ ! -d "$wt" ]]; then
      printf 'absent\n'
      return 0
    fi

    # Identity FIRST: without it, an orphan directory's status read would be the
    # ENCLOSING checkout's.
    if ! worktree_identity_ok "$wt" "$expected_branch" >/dev/null; then
      printf 'unknown\n'
      return 2
    fi

    local wt_real gitdir
    wt_real=$(cd "$wt" && pwd -P) || { printf 'unknown\n'; return 2; }
    gitdir=$(git -C "$wt" rev-parse --absolute-git-dir 2>/dev/null) || { printf 'unknown\n'; return 2; }
    if [[ -z "$wt_real" || -z "$gitdir" ]]; then
      printf 'unknown\n'
      return 2
    fi

    local rebase_merge rebase_apply merge_head cherry_head
    rebase_merge=$(_wr_git_path "$wt" "$wt_real" "$gitdir" rebase-merge) || { printf 'unknown\n'; return 2; }
    rebase_apply=$(_wr_git_path "$wt" "$wt_real" "$gitdir" rebase-apply) || { printf 'unknown\n'; return 2; }
    merge_head=$(_wr_git_path "$wt" "$wt_real" "$gitdir" MERGE_HEAD) || { printf 'unknown\n'; return 2; }
    cherry_head=$(_wr_git_path "$wt" "$wt_real" "$gitdir" CHERRY_PICK_HEAD) || { printf 'unknown\n'; return 2; }

    # (a) An operation in progress. REPORT ONLY — repairing is the owner's call.
    if [[ -d "$rebase_merge" || -d "$rebase_apply" ]]; then
      printf 'rebase-in-progress\n'
      return 1
    fi
    if [[ -f "$merge_head" ]]; then
      printf 'merge-in-progress\n'
      return 1
    fi
    if [[ -f "$cherry_head" ]]; then
      printf 'cherry-pick-in-progress\n'
      return 1
    fi

    # (b) Detached HEAD with no operation in progress: the commits there may be
    # unreferenced.
    if ! git -C "$wt" symbolic-ref -q HEAD >/dev/null; then
      printf 'detached-head\n'
      return 1
    fi

    # (b2) Attached, but to some OTHER branch. Identity proves the directory IS
    # the node's linked worktree; it does not prove <expected-branch> is what is
    # checked out.
    local wt_branch
    wt_branch=$(git -C "$wt" symbolic-ref --short HEAD 2>/dev/null) || { printf 'unknown\n'; return 2; }
    if [[ "$wt_branch" != "$expected_branch" ]]; then
      printf 'wrong-branch:%s\n' "$wt_branch"
      return 1
    fi

    # (c) Dirty tracked tree. --untracked-files=no is load-bearing: node
    # worktrees routinely carry build output.
    local porcelain
    porcelain=$(git -C "$wt" status --porcelain --untracked-files=no 2>/dev/null) || { printf 'unknown\n'; return 2; }
    if [[ -n "$porcelain" ]]; then
      printf 'dirty-tracked-tree\n'
      return 1
    fi

    printf 'clean\n'
    return 0
  }
fi
