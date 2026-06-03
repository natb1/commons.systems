#!/usr/bin/env bash
# lib-reservation-ledger.sh — sourceable helper for the fan-out reservation ledger.
#
# The /dispatch-propagate fan-out budget is `gap = TARGET_N - effective_live`,
# where `effective_live = busy_workers + outstanding_reservations`. A
# reservation is an explicit, durable marker written under the selection lock
# the instant a target is claimed — BEFORE its worker spawns or registers — so
# the budget no longer depends on worker-registration timing (the lock-through-
# registration behavior of #945). This helper owns the ledger: write a marker on
# claim, clear it on registration, count outstanding markers for the budget, and
# sweep markers whose reserving session is dead-and-never-converted or whose
# worker has already gone live.
#
# The ledger is a directory of marker files at the SHARED project root
# (`<project-root>/tmp/dispatch-reservations/`), project-root-shared like the
# selection lock (`tmp/dispatch.lock`) so concurrent ticks in different
# worktrees contend on one ledger. Each marker file is named exactly by the
# reserved worktree basename (`<N>-slug`) and carries three lines:
#   session=<reserving session-id>
#   issue=<issue-N>
#   timestamp=<UTC ISO-8601>
#
# Usage: source this file, then call:
#   reservation_dir
#   reservation_write   <worktree-basename> <issue-N> <session-id>
#   reservation_clear   <worktree-basename>
#   reservation_count
#   reservation_sweep
#
# reservation_dir
#   Print the ledger directory path to stdout. If DISPATCH_RESERVATION_DIR is set
#   and non-empty, print that (the test override, authoritative — bypasses the
#   git lookup). Otherwise print `<resolve_project_root>/tmp/dispatch-reservations`.
#     return 0 — path printed.
#     return 1 — no override and not in a git repo (resolve_project_root failed);
#               nothing printed.
#
# reservation_write <worktree-basename> <issue-N> <session-id>
#   Claim a slot: atomically write the marker file named exactly
#   <worktree-basename> in the ledger dir, with the three documented lines. All
#   three arguments are required and must be non-empty (an empty arg prints a
#   diagnostic to stderr and returns 1, matching the arg-validation style of the
#   sibling lib-claude-agents.sh primitives). The dir is `mkdir -p`'d first. The
#   write is atomic: content goes to a dot-prefixed `.tmp` tempfile in the same
#   dir, then `mv` into place, so a concurrent reader (count/sweep) never observes
#   a partial file. The timestamp is `${DISPATCH_RESERVATION_NOW:-$(date -u
#   +%FT%TZ)}`.
#     return 0 — marker written.
#     return 1 — a missing argument, an unresolvable ledger dir, or a write/mv
#               failure.
#
# reservation_clear <worktree-basename>
#   Best-effort cleanup: remove the marker file named <worktree-basename>.
#   Idempotent — succeeds whether or not the file existed. The argument is
#   required (empty → return 1). If the ledger dir is unresolvable (no project
#   root and no override), there is nothing to clear → return 0.
#     return 0 — file absent after the call (removed, or never existed, or no
#               ledger).
#     return 1 — missing argument only.
#
# reservation_count
#   Print the integer count of outstanding marker files to stdout. NEVER fails —
#   there is no daemon dependency, so an unresolvable/absent ledger dir prints
#   `0` and returns 0. Counts only regular files directly in the dir (no
#   recursion); in-flight `.tmp` tempfiles and dot-prefixed files are excluded so
#   a concurrent `reservation_write` is never counted.
#     return 0 — always; stdout is a single non-negative integer line.
#
# reservation_sweep
#   Reconcile the ledger against live sessions and reclaim stranded markers.
#   Makes exactly ONE `claude_agents_list_all` call. If that returns non-zero
#   (UNKNOWN — daemon unqueryable), reclaim NOTHING and return 0 (fail safe,
#   matching every other liveness consumer): a single stderr note is emitted and
#   no marker is touched. Otherwise it builds the live-session-id set and the
#   live-session-name set from the TSV, then for each marker file (basename =
#   reserved worktree name, `session=` line = reserving session id):
#     a. marker basename ∈ live-session-names  → a LIVE worker already owns the
#        worktree (counted by busy_workers); reclaim (redundant / crash-after-
#        register backstop).
#     b. else reserving session id ∉ live-session-ids → reserving session is DEAD
#        and never converted; reclaim (stranded).
#     c. else (reserving session alive, no live worker yet) → in-flight; KEEP.
#   Reclaim = `reservation_clear <basename>` plus a one-line stderr note
#   distinguishing the two reasons (live-worker-redundant vs dead-session-
#   stranded), mirroring dispatch-sweep's reclaim-note style. `.tmp`/dot
#   tempfiles are skipped.
#     return 0 — always (sweep completed, or fail-safe no-op on UNKNOWN /
#               absent ledger).
#
# Test overrides:
#   DISPATCH_RESERVATION_DIR  Override the ledger directory path. When set, the
#                             helper does NOT require a git repo (bypasses
#                             resolve_project_root). Used by tests to point the
#                             ledger at a scratch dir.
#   DISPATCH_RESERVATION_NOW  Override the UTC timestamp stamped into a written
#                             marker (deterministic tests). Default:
#                             `date -u +%FT%TZ`.
#   CLAUDE_AGENTS_CMD         Inherited from lib-claude-agents.sh: replaces the
#                             `claude` invocation in the sweep's liveness query
#                             with an arbitrary command (testable with no daemon).
#
# Safe to source multiple times. Does NOT use set -e (functions return, never
# exit).
#
# Side effect: sourcing this file once sets `-u` and `-o pipefail` in the caller
# shell (via its own load-guard, and transitively via lib-claude-agents.sh). New
# callers should be aware before sourcing.

# Source siblings via BASH_SOURCE dirname. Both are idempotent: lib.sh is plain
# function definitions; lib-claude-agents.sh is load-guarded. Re-sourcing this
# file therefore re-sources them harmlessly.
_lrl_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$_lrl_dir/lib.sh"
# shellcheck source=lib-claude-agents.sh
source "$_lrl_dir/lib-claude-agents.sh"

if [[ -z "${_LIB_RESERVATION_LEDGER_LOADED:-}" ]]; then
  _LIB_RESERVATION_LEDGER_LOADED=1

  set -uo pipefail

  # reservation_dir — print the ledger directory path.
  # See the header comment for the return-code contract.
  reservation_dir() {
    if [[ -n "${DISPATCH_RESERVATION_DIR:-}" ]]; then
      printf '%s\n' "$DISPATCH_RESERVATION_DIR"
      return 0
    fi
    local root
    root=$(resolve_project_root) || return 1
    printf '%s\n' "$root/tmp/dispatch-reservations"
    return 0
  }

  # reservation_write <worktree-basename> <issue-N> <session-id> — claim a slot.
  # See the header comment for the return-code contract.
  reservation_write() {
    local basename="${1:-}" issue="${2:-}" session="${3:-}"
    if [[ -z "$basename" || -z "$issue" || -z "$session" ]]; then
      printf 'lib-reservation-ledger: reservation_write requires <worktree-basename> <issue-N> <session-id>\n' >&2
      return 1
    fi

    local dir
    dir=$(reservation_dir) || {
      printf 'lib-reservation-ledger: reservation_write could not resolve the ledger dir (not in a git repo and DISPATCH_RESERVATION_DIR unset)\n' >&2
      return 1
    }
    mkdir -p "$dir" || return 1

    local ts="${DISPATCH_RESERVATION_NOW:-$(date -u +%FT%TZ)}"

    # Atomic write: a dot-prefixed `.tmp` tempfile in the SAME dir (so the final
    # `mv` is a rename within one filesystem, never a cross-device copy), then
    # rename into place. A concurrent reader never observes a partial marker, and
    # the dot/.tmp name is excluded by count/sweep so the tempfile is never seen
    # as an outstanding reservation.
    local tmpfile="$dir/.${basename}.$$.tmp"
    {
      printf 'session=%s\n' "$session"
      printf 'issue=%s\n' "$issue"
      printf 'timestamp=%s\n' "$ts"
    } >"$tmpfile" || { rm -f "$tmpfile" 2>/dev/null; return 1; }

    if ! mv -f "$tmpfile" "$dir/$basename"; then
      rm -f "$tmpfile" 2>/dev/null
      return 1
    fi
    return 0
  }

  # reservation_clear <worktree-basename> — best-effort idempotent removal.
  # See the header comment for the return-code contract.
  reservation_clear() {
    local basename="${1:-}"
    if [[ -z "$basename" ]]; then
      printf 'lib-reservation-ledger: reservation_clear requires a <worktree-basename> argument\n' >&2
      return 1
    fi
    local dir
    # Unresolvable ledger dir → nothing to clear (best-effort cleanup).
    dir=$(reservation_dir) || return 0
    rm -f "$dir/$basename" 2>/dev/null || true
    return 0
  }

  # reservation_count — print the count of outstanding marker files. Never fails.
  # See the header comment for the return-code contract.
  reservation_count() {
    local dir
    if ! dir=$(reservation_dir) || [[ ! -d "$dir" ]]; then
      printf '0\n'
      return 0
    fi
    local count=0 f
    # nullglob so a no-match glob expands to nothing rather than the literal
    # pattern. The default glob excludes dotfiles, so the dot-prefixed `.tmp`
    # tempfiles from reservation_write are already invisible here.
    local had_nullglob=0
    shopt -q nullglob && had_nullglob=1
    shopt -s nullglob
    for f in "$dir"/*; do
      # Count only regular files directly in the dir (no recursion).
      [[ -f "$f" ]] || continue
      count=$((count + 1))
    done
    (( had_nullglob )) || shopt -u nullglob
    printf '%s\n' "$count"
    return 0
  }

  # reservation_sweep — reconcile the ledger against live sessions and reclaim
  # stranded markers. See the header comment for the return-code contract.
  reservation_sweep() {
    # Exactly one liveness query. UNKNOWN → reclaim nothing (fail safe).
    local agents
    if ! agents=$(claude_agents_list_all); then
      printf 'lib-reservation-ledger: reservation_sweep — daemon unqueryable; reclaiming nothing\n' >&2
      return 0
    fi

    local dir
    if ! dir=$(reservation_dir) || [[ ! -d "$dir" ]]; then
      return 0
    fi

    # Build the live-session-id and live-session-name sets from the TSV
    # (sessionId<TAB>status<TAB>name per line). An empty $agents (`[]`) leaves
    # both sets empty.
    declare -A live_ids=()
    declare -A live_names=()
    local sid status name
    if [[ -n "$agents" ]]; then
      while IFS=$'\t' read -r sid status name; do
        [[ -n "$sid" ]] && live_ids["$sid"]=1
        [[ -n "$name" ]] && live_names["$name"]=1
      done <<<"$agents"
    fi

    local had_nullglob=0
    shopt -q nullglob && had_nullglob=1
    shopt -s nullglob
    local f bn marker_sid
    for f in "$dir"/*; do
      [[ -f "$f" ]] || continue
      bn=$(basename "$f")
      # Read the `session=` line robustly (first match wins); independent of
      # line ordering within the marker.
      marker_sid=$(sed -n 's/^session=//p' "$f" 2>/dev/null | head -n1)

      if [[ -n "${live_names[$bn]:-}" ]]; then
        # (a) A live worker already owns this worktree (its session name equals
        # the worktree basename) — redundant / crash-after-register backstop.
        reservation_clear "$bn"
        printf 'lib-reservation-ledger: reclaimed reservation %s (live-worker-redundant)\n' "$bn" >&2
      elif [[ -z "${live_ids[$marker_sid]:-}" ]]; then
        # (b) The reserving session is not live and never converted — stranded.
        reservation_clear "$bn"
        printf 'lib-reservation-ledger: reclaimed reservation %s (dead-session-stranded)\n' "$bn" >&2
      fi
      # (c) reserving session alive, no live worker yet → in-flight → KEEP.
    done
    (( had_nullglob )) || shopt -u nullglob
    return 0
  }

fi
