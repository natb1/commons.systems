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
#   reservation_exists  <worktree-basename>
#   reservation_count
#   reserved_claimed_nums
#   claimed_issue_nums
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
#   sibling lib-claude-agents.sh primitives). The basename must also be free of
#   path separators, `..` components, and control characters — an unsafe name
#   prints a diagnostic and returns 1 (defense-in-depth so the name can never
#   escape the ledger dir). The dir is `mkdir -p -m 0700`'d first (owner-only, so
#   a host co-tenant cannot read session ids or inject forged markers). The
#   write is atomic: content goes to a dot-prefixed `.tmp` tempfile in the same
#   dir, then `mv` into place, so a concurrent reader (count/sweep) never observes
#   a partial file. The timestamp is `${DISPATCH_RESERVATION_NOW:-$(date -u
#   +%FT%TZ)}`.
#     return 0 — marker written.
#     return 1 — a missing/unsafe argument, an unresolvable ledger dir, or a
#               write/mv failure.
#
# reservation_clear <worktree-basename>
#   Best-effort cleanup: remove the marker file named <worktree-basename>.
#   Idempotent — succeeds whether or not the file existed. The argument is
#   required and must pass the same path-safety guard as reservation_write
#   (missing or unsafe → return 1). If the ledger dir is unresolvable (no project
#   root and no override), there is nothing to clear → return 0.
#     return 0 — file absent after the call (removed, or never existed, or no
#               ledger).
#     return 1 — missing or unsafe argument only.
#
# reservation_exists <worktree-basename>
#   Fast-path membership test: return 0 if a reservation marker named exactly
#   <worktree-basename> exists in the ledger dir, 1 otherwise. No daemon
#   round-trip — a single stat. The basename arg is required and must pass the
#   same path-safety guard as reservation_write/_clear (missing/unsafe → 1). An
#   unresolvable/absent ledger dir → 1 (nothing reserved). The dot/.tmp in-flight
#   tempfile is never matched (callers pass a clean basename; the guard rejects
#   names with separators anyway).
#     return 0 — a marker named <worktree-basename> exists.
#     return 1 — a missing/unsafe argument, an unresolvable ledger dir, or no
#               such marker.
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
#        register backstop). This is age-INDEPENDENT — it fires at ANY age.
#     b. else the `session=` line is empty/absent (malformed marker) → KEEP and
#        flag; an empty session id is not treated as "dead" so a corrupt or
#        tampered marker never causes a still-valid slot to be reclaimed.
#     (new) else the marker is younger than the boot grace
#        (DISPATCH_RESERVATION_BOOT_GRACE_S, default 30s) → in-flight; KEEP,
#        REGARDLESS of the reserving session's liveness. This covers an async
#        spawn whose router (the reserving session) has already exited while the
#        spawned worker is still booting and has not yet registered. A marker
#        with an unparseable/absent timestamp has no age protection — it falls
#        through to the session rules below (fail-safe to the pre-grace behavior).
#     c. else reserving session id ∉ live-session-ids AND the marker has aged
#        past the grace → reserving session is DEAD and never converted; reclaim
#        (stranded).
#     d. else (reserving session alive, no live worker yet) → in-flight; KEEP.
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
#   DISPATCH_RESERVATION_BOOT_GRACE_S
#                             The boot-grace window in seconds (default 30); a
#                             marker younger than this is kept as in-flight
#                             regardless of the reserving session's liveness. A
#                             non-numeric value falls back to 30.
#   DISPATCH_RESERVATION_SWEEP_NOW_EPOCH
#                             Override the sweep's "now" epoch (deterministic
#                             grace-boundary tests). Default: `date -u +%s`. A
#                             non-numeric value falls back to the default.
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
    local wt_name="${1:-}" issue="${2:-}" session="${3:-}"
    if [[ -z "$wt_name" || -z "$issue" || -z "$session" ]]; then
      printf 'lib-reservation-ledger: reservation_write requires <worktree-basename> <issue-N> <session-id>\n' >&2
      return 1
    fi
    # Defense-in-depth path guard: the marker is named exactly by the worktree
    # basename, so a value carrying a path separator, a `..` component, or a
    # control character could escape the ledger dir on the `mv`. All current
    # callers pass a `basename`-stripped worktree name, but guard the boundary
    # here regardless (mirrors restore-dispatch-skill.sh).
    case "$wt_name" in
      *..*|*/*|*[[:cntrl:]]*)
        printf 'lib-reservation-ledger: reservation_write: unsafe worktree-basename %q\n' "$wt_name" >&2
        return 1
        ;;
    esac

    local dir
    dir=$(reservation_dir) || {
      printf 'lib-reservation-ledger: reservation_write could not resolve the ledger dir (not in a git repo and DISPATCH_RESERVATION_DIR unset)\n' >&2
      return 1
    }
    # Owner-only (0700) so a co-tenant on the host cannot read reserving session
    # ids out of the markers nor inject a forged marker to skew the budget.
    mkdir -p -m 0700 "$dir" || return 1

    local ts="${DISPATCH_RESERVATION_NOW:-$(date -u +%FT%TZ)}"

    # Atomic write: a dot-prefixed `.tmp` tempfile in the SAME dir (so the final
    # `mv` is a rename within one filesystem, never a cross-device copy), then
    # rename into place. A concurrent reader never observes a partial marker, and
    # the dot/.tmp name is excluded by count/sweep so the tempfile is never seen
    # as an outstanding reservation.
    local tmpfile="$dir/.${wt_name}.$$.tmp"
    {
      printf 'session=%s\n' "$session"
      printf 'issue=%s\n' "$issue"
      printf 'timestamp=%s\n' "$ts"
    } >"$tmpfile" || { rm -f "$tmpfile" 2>/dev/null; return 1; }

    if ! mv -f "$tmpfile" "$dir/$wt_name"; then
      rm -f "$tmpfile" 2>/dev/null
      return 1
    fi
    return 0
  }

  # reservation_clear <worktree-basename> — best-effort idempotent removal.
  # See the header comment for the return-code contract.
  reservation_clear() {
    local wt_name="${1:-}"
    if [[ -z "$wt_name" ]]; then
      printf 'lib-reservation-ledger: reservation_clear requires a <worktree-basename> argument\n' >&2
      return 1
    fi
    # Same path guard as reservation_write — never let an unsafe name drive the
    # `rm` outside the ledger dir.
    case "$wt_name" in
      *..*|*/*|*[[:cntrl:]]*)
        printf 'lib-reservation-ledger: reservation_clear: unsafe worktree-basename %q\n' "$wt_name" >&2
        return 1
        ;;
    esac
    local dir
    # Unresolvable ledger dir → nothing to clear (best-effort cleanup).
    dir=$(reservation_dir) || return 0
    rm -f "$dir/$wt_name" 2>/dev/null || true
    return 0
  }

  # reservation_exists <worktree-basename> — fast-path marker membership test.
  # See the header comment for the return-code contract.
  reservation_exists() {
    local wt_name="${1:-}"
    if [[ -z "$wt_name" ]]; then
      printf 'lib-reservation-ledger: reservation_exists requires a <worktree-basename> argument\n' >&2
      return 1
    fi
    # Same path guard as reservation_write/_clear — never let an unsafe name
    # stat outside the ledger dir.
    case "$wt_name" in
      *..*|*/*|*[[:cntrl:]]*)
        printf 'lib-reservation-ledger: reservation_exists: unsafe worktree-basename %q\n' "$wt_name" >&2
        return 1
        ;;
    esac
    local dir
    # Unresolvable ledger dir → nothing reserved.
    dir=$(reservation_dir) || return 1
    [[ -f "$dir/$wt_name" ]]
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

  # reserved_claimed_nums — emit the UNIQUE issue numbers claimed by outstanding
  # reservation markers, one per line. The durable (reserved) half of selection's
  # claimed set. Each marker file is named exactly by the reserved worktree
  # basename (`<N>-slug`), so the claimed number is the basename's numeric prefix
  # `${bn%%-*}`. Reuses reservation_count's nullglob regular-file scan (the
  # default glob already excludes the dot-prefixed `.tmp` in-flight tempfiles, so
  # a concurrent reservation_write is never seen). NEVER fails — no daemon
  # dependency, so an unresolvable/absent ledger dir emits nothing and returns 0,
  # matching reservation_count's contract exactly.
  #     return 0 — always; stdout carries the unique claimed <N> values, one per
  #               line (empty for an absent/empty ledger).
  reserved_claimed_nums() {
    local dir
    if ! dir=$(reservation_dir) || [[ ! -d "$dir" ]]; then
      return 0
    fi
    local f bn
    declare -A seen=()
    # nullglob so a no-match glob expands to nothing rather than the literal
    # pattern (mirrors reservation_count). Dotfiles (the `.tmp` tempfiles) are
    # excluded by the default glob.
    local had_nullglob=0
    shopt -q nullglob && had_nullglob=1
    shopt -s nullglob
    for f in "$dir"/*; do
      # Count only regular files directly in the dir (no recursion).
      [[ -f "$f" ]] || continue
      bn=$(basename "$f")
      seen["${bn%%-*}"]=1
    done
    (( had_nullglob )) || shopt -u nullglob
    local n
    for n in "${!seen[@]}"; do
      printf '%s\n' "$n"
    done
    return 0
  }

  # claimed_issue_nums — emit the DEDUPED union of the claimed issue numbers from
  # live sessions (live_session_claimed_nums) and outstanding reservation markers
  # (reserved_claimed_nums), one per line. This is selection's forward-derived
  # claimed set, replacing the backward worktree walk.
  #
  # FAIL OPEN on live-UNKNOWN: live_session_claimed_nums returns 1 when the daemon
  # is unqueryable. Rather than abort the whole derivation (which would strand
  # selection), emit a one-line stderr diagnostic and continue with the reserved
  # set ONLY. The reservation ledger is the durable, daemon-independent record, so
  # a momentary daemon outage degrades to "reserved-only" rather than failing.
  #     return 0 — always; stdout carries the deduped union (empty if both halves
  #               are empty / the live half is UNKNOWN and the ledger is empty).
  claimed_issue_nums() {
    local live
    if ! live=$(live_session_claimed_nums); then
      printf 'lib-reservation-ledger: claimed_issue_nums — live sessions unqueryable; using reserved set only (fail open)\n' >&2
      live=""
    fi
    local reserved
    reserved=$(reserved_claimed_nums)
    # Guard each side so an empty half does not contribute a phantom blank line
    # that would survive `sort -u`. The `[[ -n ]]` test failing inside the pipe
    # under pipefail is absorbed by the explicit `return 0` below.
    {
      [[ -n "$live" ]] && printf '%s\n' "$live"
      [[ -n "$reserved" ]] && printf '%s\n' "$reserved"
    } | sort -u
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

    # Compute "now" (epoch) and the boot grace ONCE before the loop. A
    # non-numeric DISPATCH_RESERVATION_SWEEP_NOW_EPOCH / _BOOT_GRACE_S falls back
    # to its default.
    local now
    if [[ "${DISPATCH_RESERVATION_SWEEP_NOW_EPOCH:-}" =~ ^[0-9]+$ ]]; then
      now="$DISPATCH_RESERVATION_SWEEP_NOW_EPOCH"
    else
      now=$(date -u +%s)
    fi
    local grace="${DISPATCH_RESERVATION_BOOT_GRACE_S:-30}"
    [[ "$grace" =~ ^[0-9]+$ ]] || grace=30

    local had_nullglob=0
    shopt -q nullglob && had_nullglob=1
    shopt -s nullglob
    local f bn marker_sid marker_ts marker_epoch
    for f in "$dir"/*; do
      [[ -f "$f" ]] || continue
      bn=$(basename "$f")
      # Read the `session=` line robustly (first match wins); independent of
      # line ordering within the marker.
      marker_sid=$(sed -n 's/^session=//p' "$f" 2>/dev/null | head -n1)
      # Read the `timestamp=` line and parse it to epoch. The markers store UTC
      # ISO-8601 (e.g. 2026-01-01T00:00:00Z), which GNU `date -d` parses. This
      # may fail (empty/non-numeric marker_epoch) on an absent/unparseable
      # timestamp, in which case the marker gets no age protection (fail-safe).
      marker_ts=$(sed -n 's/^timestamp=//p' "$f" 2>/dev/null | head -n1)
      marker_epoch=$(date -d "$marker_ts" +%s 2>/dev/null)

      if [[ -n "${live_names[$bn]:-}" ]]; then
        # (a) A live worker already owns this worktree (its session name equals
        # the worktree basename) — redundant / crash-after-register backstop.
        # Age-independent: fires at ANY age, ahead of the grace check.
        reservation_clear "$bn"
        printf 'lib-reservation-ledger: reclaimed reservation %s (live-worker-redundant)\n' "$bn" >&2
      elif [[ -z "$marker_sid" ]]; then
        # (b) A marker with no readable `session=` line is malformed (truncation
        # cannot happen via the atomic write, so this means external tampering or
        # corruption). Reclaiming on an empty session id would conflate "no
        # session" with "dead session" and could delete a still-valid slot — KEEP
        # it and flag it instead (fail safe, matching the sweep's conservatism).
        printf 'lib-reservation-ledger: keeping malformed reservation %s (no session= line)\n' "$bn" >&2
      elif [[ "$marker_epoch" =~ ^[0-9]+$ ]] && (( now - marker_epoch < grace )); then
        # (new) Boot grace: a marker younger than the grace is in-flight and KEPT
        # regardless of the reserving session's liveness. This covers an async
        # spawn whose reserving session (a short-lived router) has already exited
        # while the spawned worker is still booting / not yet registered. A
        # future-stamped marker (now - epoch < 0) is < grace, so it is kept too
        # (the safe direction). KEEP — fall through to nothing.
        :
      elif [[ -z "${live_ids[$marker_sid]:-}" ]]; then
        # (c) The reserving session is not live, the marker has aged past the
        # grace, and it never converted — stranded.
        reservation_clear "$bn"
        printf 'lib-reservation-ledger: reclaimed reservation %s (dead-session-stranded)\n' "$bn" >&2
      fi
      # (d) reserving session alive, no live worker yet → in-flight → KEEP.
    done
    (( had_nullglob )) || shopt -u nullglob
    return 0
  }

fi
