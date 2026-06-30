#!/usr/bin/env bash
# lib-worktree-in-sync.sh — sourceable helper that defines worktree_in_sync()
# and worktree_merged_in_sync().
#
# Usage: source this file, then call:
#   worktree_in_sync <worktree-path> [log-file-path] [log-tag]
#   worktree_merged_in_sync <worktree-path> [log-file-path] [log-tag]
#
# worktree_in_sync returns 0 if the worktree is clean (no uncommitted changes)
# AND all commits are pushed (zero unpushed commits, via `rev-list --not
# --remotes`). Returns non-zero otherwise.
#
# worktree_merged_in_sync returns 0 (retire-able) when the worktree is clean
# AND its committed tree is byte-identical to origin/main (via `git diff
# --quiet origin/main HEAD`). It deliberately omits the `rev-list --not
# --remotes` reachability check: a squash-merge deletes the remote head branch,
# so an earlier local `git merge origin/main` leaves a local-only merge commit
# that `rev-list --not --remotes` over-counts as "unpushed" even when the tree
# matches origin/main exactly. The merged-PR sweep path uses tree-identity, not
# reachability, to avoid retaining such already-merged worktrees (#1845).
#
# When [log-file-path] is supplied, appends a reason line on every non-zero
# return. [log-tag] defaults to "worktree-remove" so the original hook caller
# keeps emitting "<ts> [worktree-remove] <msg>" unchanged; dispatch-sweep
# passes "dispatch-sweep" so its log lines aren't mistagged.
#
# Safe to source multiple times. Does NOT use set -e (must return, not exit).
#
# Side effect: sourcing this file once sets `-u` and `-o pipefail` in the caller
# shell. Both current callers (worktree-remove.sh, dispatch-sweep) already use
# those options; new callers should be aware before sourcing.

if [[ -z "${_LIB_WORKTREE_IN_SYNC_LOADED:-}" ]]; then
  _LIB_WORKTREE_IN_SYNC_LOADED=1

  set -uo pipefail

  worktree_in_sync() {
    local path="$1"
    local log_file="${2:-}"
    local log_tag="${3:-worktree-remove}"

    _wis_log() {
      local msg="$1"
      if [[ -n "$log_file" ]]; then
        printf '%s [%s] %s\n' "$(date -u +%FT%TZ)" "$log_tag" "$msg" >>"$log_file" 2>/dev/null || true
      fi
    }

    local status
    if ! status=$(git -C "$path" status --porcelain 2>>"${log_file:-/dev/null}"); then
      _wis_log "ERROR: git status failed for '$path' — keeping"
      return 1
    fi

    if [[ -n "$status" ]]; then
      _wis_log "KEEP: '$path' has uncommitted changes"
      return 1
    fi

    local unpushed
    if ! unpushed=$(git -C "$path" rev-list --count HEAD --not --remotes 2>>"${log_file:-/dev/null}"); then
      _wis_log "ERROR: rev-list failed for '$path' — keeping"
      return 1
    fi

    if ! [[ "$unpushed" =~ ^[0-9]+$ ]]; then
      _wis_log "ERROR: rev-list non-numeric ('$unpushed') for '$path' — keeping"
      return 1
    fi

    if [[ "$unpushed" -ne 0 ]]; then
      _wis_log "KEEP: '$path' has $unpushed unpushed commit(s)"
      return 1
    fi

    return 0
  }

  worktree_merged_in_sync() {
    local path="$1"
    local log_file="${2:-}"
    local log_tag="${3:-worktree-remove}"

    _wms_log() {
      local msg="$1"
      if [[ -n "$log_file" ]]; then
        printf '%s [%s] %s\n' "$(date -u +%FT%TZ)" "$log_tag" "$msg" >>"$log_file" 2>/dev/null || true
      fi
    }

    local status
    if ! status=$(git -C "$path" status --porcelain 2>>"${log_file:-/dev/null}"); then
      _wms_log "ERROR: git status failed for '$path' — keeping"
      return 1
    fi

    if [[ -n "$status" ]]; then
      _wms_log "KEEP: '$path' has uncommitted changes"
      return 1
    fi

    # Tree-identity (not reachability): a squash-merge deletes the remote head
    # branch, so `rev-list --not --remotes` over-counts a local-only merge commit
    # even when the tree is byte-identical to origin/main. Compare trees directly.
    local diff_rc=0
    git -C "$path" diff --quiet origin/main HEAD 2>>"${log_file:-/dev/null}" || diff_rc=$?
    case "$diff_rc" in
      0) return 0 ;;
      1)
        _wms_log "KEEP: '$path' tree differs from origin/main"
        return 1
        ;;
      *)
        _wms_log "ERROR: git diff vs origin/main failed for '$path' — keeping"
        return 1
        ;;
    esac
  }

fi
