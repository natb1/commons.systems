#!/usr/bin/env bash
# lib-worktree-in-sync.sh — sourceable helper that defines worktree_in_sync().
#
# Usage: source this file, then call:
#   worktree_in_sync <worktree-path> [log-file-path] [log-tag]
#
# Returns 0 if the worktree is clean (no uncommitted changes) AND all commits
# are pushed (zero unpushed commits). Returns non-zero otherwise.
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

fi
