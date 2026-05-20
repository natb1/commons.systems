#!/usr/bin/env bash
# lib-worktree-in-sync.sh — sourceable helper that defines worktree_in_sync().
#
# Usage: source this file, then call:
#   worktree_in_sync <worktree-path> [log-file-path]
#
# Returns 0 if the worktree is clean (no uncommitted changes) AND all commits
# are pushed (zero unpushed commits). Returns non-zero otherwise.
#
# When [log-file-path] is supplied, appends a reason line on every non-zero
# return using the same wording as the inline check in worktree-remove.sh:
#   ERROR: ...  — for git command failures and non-numeric rev-list output
#   KEEP: ...   — for dirty tree and unpushed commits
#
# Log line format: "<UTC-ISO-8601> [worktree-remove] <message>"
# This matches the log() / err() helpers in worktree-remove.sh so output is
# consistent when both write to the same log file.
#
# Safe to source multiple times. Does NOT use set -e (must return, not exit).

if [[ -z "${_LIB_WORKTREE_IN_SYNC_LOADED:-}" ]]; then
  _LIB_WORKTREE_IN_SYNC_LOADED=1

  set -uo pipefail

  worktree_in_sync() {
    local path="$1"
    local log_file="${2:-}"

    # Internal helper: write a line to the log file only if one is configured.
    _wis_log() {
      local msg="$1"
      if [[ -n "$log_file" ]]; then
        printf '%s [worktree-remove] %s\n' "$(date -u +%FT%TZ)" "$msg" >>"$log_file" 2>/dev/null || true
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
