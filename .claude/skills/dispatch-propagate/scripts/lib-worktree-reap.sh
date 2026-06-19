#!/usr/bin/env bash
# lib-worktree-reap.sh — sourceable helpers for reaping not-in-sync merged/closed
# worktrees after a bounded grace.
#
# A merged or closed-issue worktree that is NOT in sync (dirty tree or unpushed
# divergence) is never reaped immediately: it might carry recoverable work, or a
# worker may be mid-edit. dispatch-sweep skips it, but an indefinitely-skipped
# worktree accumulates forever. This helper provides the two primitives that turn
# that indefinite skip into a bounded-grace reap:
#
#   1. A not-in-sync MARKER LEDGER — a write-once "first observed not-in-sync"
#      timestamp per worktree basename. The age of that marker (now - stamp) is
#      the grace signal. It is deliberately NOT the HEAD commit timestamp: the
#      headline case is uncommitted residue whose HEAD is the recent merge commit,
#      which would never age past grace.
#
#   2. A QUARANTINE — before a reap, capture ALL THREE divergence kinds (committed
#      divergence as patches, uncommitted tracked changes as a diff, and untracked
#      files as copies) under the RUNNER's stable root, so `git worktree remove
#      --force` discards nothing unrecoverably (AC2: divergence is recoverable,
#      not silently discarded).
#
# CRITICAL — root resolution. Both the marker ledger AND the quarantine
# destination MUST live under the sweep-RUNNER's stable project root, the SAME
# root the reservation ledger resolves (resolve_project_root, computed
# independently of any target worktree). They must NEVER be resolved relative to
# the worktree being reaped (e.g. `git -C "$wt_path" rev-parse --show-toplevel`):
# that would place the quarantine INSIDE the worktree, and `git worktree remove
# --force` would delete the quarantine we just wrote — data gone, AC2 violated.
# To make this structurally impossible, every function here takes the resolved
# runner root as an explicit `<root>` parameter. The caller (dispatch-sweep) passes
# its top-level `$PROJECT_ROOT` (= resolve_project_root, target-independent).
#
# Usage: source this file, then call:
#   reap_marker_dir          <root>
#   reap_marker_path         <root> <wt-basename>
#   reap_marker_record       <root> <wt-basename>
#   reap_marker_read         <root> <wt-basename>
#   reap_marker_clear        <root> <wt-basename>
#   reap_quarantine          <root> <wt-path> <wt-basename>   (prints dest on success)
#
# reap_marker_dir <root>
#   Print the marker ledger directory `<root>/tmp/dispatch-not-in-sync` to stdout.
#   A DISTINCT directory from the reservation ledger, under the same root.
#     return 0 — path printed.  return 1 — missing/empty <root>.
#
# reap_marker_path <root> <wt-basename>
#   Print `<marker-dir>/<wt-basename>`.
#     return 0 — path printed.  return 1 — missing/empty/unsafe argument.
#
# reap_marker_record <root> <wt-basename>
#   WRITE-ONCE: create the marker if and only if it does not already exist,
#   storing epoch seconds from `${DISPATCH_SWEEP_NOW_EPOCH:-$(date -u +%s)}`. The
#   create is GENUINELY ATOMIC (O_EXCL via `set -C` noclobber in a subshell) — two
#   overlapping sweeps cannot both win and cannot corrupt the file. If the marker
#   already exists it is left UNTOUCHED (the stored timestamp is never refreshed;
#   refreshing would reset the grace clock every sweep and the feature would be
#   inert).
#     return 0 — marker exists after the call (created now, or already present).
#     return 1 — missing/unsafe argument, unresolvable dir, or a write error.
#
# reap_marker_read <root> <wt-basename>
#   Print the stored epoch on stdout (exit 0), or signal absent (non-zero, no
#   output). A present-but-unparseable marker is treated as absent (return 1).
#
# reap_marker_clear <root> <wt-basename>
#   Idempotent removal of the marker (absent is fine).
#     return 0 — marker absent after the call.  return 1 — missing/unsafe argument.
#
# reap_quarantine <root> <wt-path> <wt-basename>
#   Capture all three divergence kinds under `<root>/tmp/dispatch-sweep-quarantine/
#   <wt-basename>-<epoch>/` (epoch from the same NOW override as the marker), then
#   print that destination path to stdout. Captures:
#     1. committed divergence — `git format-patch origin/main..HEAD -o <dest>`
#        (0 patches when there is no committed divergence is fine, not an error).
#     2. uncommitted tracked changes — `git diff HEAD > <dest>/working-tree.patch`.
#     3. untracked files — copied into `<dest>/untracked/` preserving relative
#        paths (a patch cannot carry untracked content).
#   Plus a `manifest` recording source path, epoch, and what was captured. Returns
#   NON-ZERO on ANY capture error (mkdir/git/copy failure). The dest root resolves
#   from <root> (the runner), never from <wt-path>.
#     return 0 — dest printed; all captures succeeded.
#     return 1 — missing/unsafe argument or any capture failure (no dest printed).
#
# Test overrides:
#   DISPATCH_SWEEP_NOW_EPOCH   Override the "now" epoch stamped into a marker and
#                              used for the quarantine dir suffix. Default:
#                              `date -u +%s`. Mirrors DISPATCH_RESERVATION_SWEEP_NOW_EPOCH.
#
# Safe to source multiple times. Does NOT use set -e (functions return, never
# exit). Side effect: sourcing once sets `-u` and `-o pipefail` in the caller.

if [[ -z "${_LIB_WORKTREE_REAP_LOADED:-}" ]]; then
  _LIB_WORKTREE_REAP_LOADED=1

  set -uo pipefail

  # _reap_now_epoch — the deterministic "now" in epoch seconds. The marker stamp
  # and the quarantine dir suffix read the SAME override so tests advance time
  # uniformly.
  _reap_now_epoch() {
    if [[ "${DISPATCH_SWEEP_NOW_EPOCH:-}" =~ ^[0-9]+$ ]]; then
      printf '%s\n' "$DISPATCH_SWEEP_NOW_EPOCH"
    else
      date -u +%s
    fi
  }

  # _reap_safe_basename — reject a name that could escape the ledger/quarantine
  # dir on a subsequent path join (mirrors lib-reservation-ledger's guard). The
  # basename flows into `rm` and the quarantine dest, so guard the boundary.
  #   return 0 — safe.  return 1 — unsafe (diagnostic on stderr).
  _reap_safe_basename() {
    local name="$1"
    case "$name" in
      ''|*..*|*/*|*[[:cntrl:]]*)
        printf 'lib-worktree-reap: unsafe worktree-basename %q\n' "$name" >&2
        return 1
        ;;
    esac
    return 0
  }

  # reap_marker_dir <root> — print the marker ledger directory.
  reap_marker_dir() {
    local root="${1:-}"
    if [[ -z "$root" ]]; then
      printf 'lib-worktree-reap: reap_marker_dir requires a <root> argument\n' >&2
      return 1
    fi
    printf '%s\n' "$root/tmp/dispatch-not-in-sync"
    return 0
  }

  # reap_marker_path <root> <wt-basename> — print the marker file path.
  reap_marker_path() {
    local root="${1:-}" name="${2:-}"
    if [[ -z "$root" || -z "$name" ]]; then
      printf 'lib-worktree-reap: reap_marker_path requires <root> <wt-basename>\n' >&2
      return 1
    fi
    _reap_safe_basename "$name" || return 1
    local dir
    dir=$(reap_marker_dir "$root") || return 1
    printf '%s\n' "$dir/$name"
    return 0
  }

  # reap_marker_record <root> <wt-basename> — write-once create-if-absent.
  reap_marker_record() {
    local root="${1:-}" name="${2:-}"
    if [[ -z "$root" || -z "$name" ]]; then
      printf 'lib-worktree-reap: reap_marker_record requires <root> <wt-basename>\n' >&2
      return 1
    fi
    _reap_safe_basename "$name" || return 1
    local dir
    dir=$(reap_marker_dir "$root") || return 1
    # Owner-only, matching the reservation ledger's posture.
    mkdir -p -m 0700 "$dir" || return 1
    local marker="$dir/$name"
    # Already present → leave it untouched (write-once: never refresh).
    [[ -e "$marker" ]] && return 0
    local now
    now=$(_reap_now_epoch)
    # Genuinely atomic create-if-absent: `set -C` (noclobber) makes the `>`
    # redirection fail if the target exists, with no TOCTOU window. If a
    # concurrent sweep won the race, this subshell fails; the marker still exists,
    # so we report success.
    if ( set -C; printf '%s\n' "$now" >"$marker" ) 2>/dev/null; then
      return 0
    fi
    [[ -e "$marker" ]] && return 0
    return 1
  }

  # reap_marker_read <root> <wt-basename> — print stored epoch or signal absent.
  reap_marker_read() {
    local root="${1:-}" name="${2:-}"
    if [[ -z "$root" || -z "$name" ]]; then
      printf 'lib-worktree-reap: reap_marker_read requires <root> <wt-basename>\n' >&2
      return 1
    fi
    _reap_safe_basename "$name" || return 1
    local dir marker val
    dir=$(reap_marker_dir "$root") || return 1
    marker="$dir/$name"
    [[ -f "$marker" ]] || return 1
    val=$(head -n1 "$marker" 2>/dev/null)
    [[ "$val" =~ ^[0-9]+$ ]] || return 1
    printf '%s\n' "$val"
    return 0
  }

  # reap_marker_clear <root> <wt-basename> — idempotent removal.
  reap_marker_clear() {
    local root="${1:-}" name="${2:-}"
    if [[ -z "$root" || -z "$name" ]]; then
      printf 'lib-worktree-reap: reap_marker_clear requires <root> <wt-basename>\n' >&2
      return 1
    fi
    _reap_safe_basename "$name" || return 1
    local dir
    dir=$(reap_marker_dir "$root") || return 1
    rm -f "$dir/$name" 2>/dev/null || true
    return 0
  }

  # reap_quarantine <root> <wt-path> <wt-basename> — capture all three divergence
  # kinds; print dest on success; non-zero on any capture error.
  reap_quarantine() {
    local root="${1:-}" wt_path="${2:-}" name="${3:-}"
    if [[ -z "$root" || -z "$wt_path" || -z "$name" ]]; then
      printf 'lib-worktree-reap: reap_quarantine requires <root> <wt-path> <wt-basename>\n' >&2
      return 1
    fi
    _reap_safe_basename "$name" || return 1

    local epoch
    epoch=$(_reap_now_epoch)
    local dest="$root/tmp/dispatch-sweep-quarantine/$name-$epoch"

    if ! mkdir -p "$dest"; then
      printf 'lib-worktree-reap: reap_quarantine could not create dest %q\n' "$dest" >&2
      return 1
    fi

    # 1. Committed divergence → patches. Zero patches (no divergence) is success.
    if ! git -C "$wt_path" format-patch origin/main..HEAD -o "$dest" >/dev/null 2>&1; then
      printf 'lib-worktree-reap: reap_quarantine format-patch failed for %q\n' "$wt_path" >&2
      return 1
    fi

    # 2. Uncommitted tracked changes → working-tree.patch.
    if ! git -C "$wt_path" diff HEAD >"$dest/working-tree.patch" 2>/dev/null; then
      printf 'lib-worktree-reap: reap_quarantine git diff HEAD failed for %q\n' "$wt_path" >&2
      return 1
    fi

    # 3. Untracked files → copied under untracked/ preserving relative paths.
    local untracked_list
    if ! untracked_list=$(git -C "$wt_path" ls-files --others --exclude-standard 2>/dev/null); then
      printf 'lib-worktree-reap: reap_quarantine ls-files --others failed for %q\n' "$wt_path" >&2
      return 1
    fi
    local untracked_count=0 rel
    if [[ -n "$untracked_list" ]]; then
      while IFS= read -r rel; do
        [[ -z "$rel" ]] && continue
        local src="$wt_path/$rel" dst="$dest/untracked/$rel"
        if ! mkdir -p "$(dirname "$dst")"; then
          printf 'lib-worktree-reap: reap_quarantine mkdir for untracked %q failed\n' "$rel" >&2
          return 1
        fi
        if ! cp -p "$src" "$dst"; then
          printf 'lib-worktree-reap: reap_quarantine cp of untracked %q failed\n' "$rel" >&2
          return 1
        fi
        untracked_count=$((untracked_count + 1))
      done <<<"$untracked_list"
    fi

    # Manifest: source, epoch, what was captured.
    local patch_count
    shopt -s nullglob
    local patches=("$dest"/[0-9]*.patch)
    patch_count=${#patches[@]}
    shopt -u nullglob
    if ! {
      printf 'source_worktree=%s\n' "$wt_path"
      printf 'epoch=%s\n' "$epoch"
      printf 'committed_patches=%s\n' "$patch_count"
      printf 'working_tree_patch=working-tree.patch\n'
      printf 'untracked_files=%s\n' "$untracked_count"
    } >"$dest/manifest" 2>/dev/null; then
      printf 'lib-worktree-reap: reap_quarantine manifest write failed for %q\n' "$dest" >&2
      return 1
    fi

    # Verify the dest exists before declaring success.
    [[ -d "$dest" ]] || return 1
    printf '%s\n' "$dest"
    return 0
  }

fi
