#!/usr/bin/env bash
# lib-stale-hold-recheck.sh — the stale-hold re-check sweep
# (tactic-stale-hold-auto-resolve, unit 4).
#
# The failure this closes: a tracked hold outlives the condition it tracks. A
# `worktree-residue` hold is born-parked when provision-node-worktree refuses to
# provision a node's worktree because it carries mechanical residue from a dead
# session (exit 14). Nothing re-checks that residue afterwards. A human, a
# reaper, or an unrelated `git worktree remove` clears the residue — and the hold
# stays parked forever, with the source node still carrying its `blocked_by`
# edge, permanently unselectable. The same is true of the `edge-residue` shape:
# a hold that DID complete (`phase: done`, `office_hours: null`) whose source's
# `blocked_by` entry survived a graph-commit layer-2 union that silently dropped
# the removal (see resolve-hold's header). Both are steady states nothing
# currently escapes.
#
# THE CONTRACT — read this before changing anything below:
#
#   1. CONTAINMENT AND OBSERVABILITY ONLY. This sweep is NEVER a gate. It
#      ALWAYS returns 0 — on every single code path, including an unresolvable
#      repo root, a failed enumeration, an unqueryable session daemon, an
#      unreadable worktree, and a failed `resolve-hold`. A caller's tick must
#      never fail because the stale-hold re-check had a bad day.
#   2. NO GRAPH WRITE OF ITS OWN. Every write goes through
#      `packages/intentionsutil/scripts/resolve-hold`, which owns the fresh
#      `origin/main` refresh, the `--base` compare-and-swap token, the
#      deliberate two-commit split (the hold's resolution and the source's edge
#      removal never ride in one graph-commit), and the post-land re-read that
#      asserts the removal actually survived. Do NOT add a second edge-clearing
#      code path here — the union-drops-removals hazard resolve-hold's header
#      documents is exactly what a hand-rolled shortcut would reintroduce.
#   3. FAIL-SAFE MEANS KEEP. Every uncertainty — an inspection that could not
#      run, a daemon that could not be queried, a session that might be holding
#      the node — resolves to KEEPING the hold and reporting it, never to
#      resolving it. A hold kept one tick too long costs a tick; a hold resolved
#      while a session is mid-repair corrupts that session's work.
#
# Usage: source this file, then call:
#   stale_hold_recheck_sweep
#
# stale_hold_recheck_sweep
#   No arguments. Returns 0 ALWAYS. Emits one greppable stderr line per
#   candidate, one best-effort `_stale_hold_log_decision` JSONL record per
#   candidate, and EXACTLY ONE summary line on every return path:
#
#     lib-stale-hold-recheck: sweep complete (candidates=N resolved=N
#       observing=N manual=N unknown=N failed=N deferred=N
#       status=<ok|enumeration-failed|repo-unresolvable>)
#
#   `status=ok` with `candidates=0` is the legitimate "nothing to do" pass. It
#   is deliberately DISTINCT from `status=enumeration-failed`: an enumeration
#   that could not run must never be reported as "no stale holds".
#
#   Step 1 — the repo root. `DISPATCH_HOLD_RECHECK_REPO_ROOT` when set and
#   non-empty, else `resolve_main_worktree` (lib-graph-worktree.sh, which honors
#   DISPATCH_GRAPH_MAIN_WORKTREE). Unresolvable → the `repo-unresolvable`
#   summary and return 0. Every path below — the enumerator, `resolve-hold`, and
#   the worktree lookups — is anchored at this root: `resolve-hold` and
#   `graph-commit` derive their OWN repo root from their script location, so
#   invoking `$ROOT/packages/intentionsutil/scripts/resolve-hold` is what makes
#   the write land against the main checkout regardless of the tick's cwd.
#
#   Step 2 — enumerate. `node --import tsx/esm
#   $ROOT/packages/intentionsutil/scripts/list-recheckable-holds.ts --dir
#   $ROOT/intentions`, run with cwd `$ROOT` (the invocation shape
#   dispatch-graph-scope-sweep uses for its own enumerator). One TSV line per
#   candidate: `<hold-id>\t<source-id>\t<kind>\t<class>`, class one of
#   `predicate` | `edge-residue` | `manual`. A non-zero exit prints one loud
#   stderr line and ends the pass with `status=enumeration-failed`.
#
#   Step 3 — per candidate, THIS ladder in THIS order (the order is the
#   correctness property):
#     a. either id fails the node-id slug shape `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`,
#        or carries `/`, `..`, or a control character → `unsafe-id`, skip. Both
#        ids become path components below; a clear skip beats a path escape.
#     b. class == `manual` → `skip-manual-policy`, counted, never acted on. The
#        kind has no machine-checkable predicate (KIND_RECHECK in
#        packages/intentionsutil/src/holds.ts records why, per kind).
#     c. class == `edge-residue` → straight to (f). No predicate applies: the
#        hold is already terminal, so the tracked condition is definitionally
#        gone and the surviving edge is the dropped-removal shape.
#     d. CLAIMED — `reservation_exists <source-id>` (the ledger marker basename
#        for a node-lane source IS its node id) OR `worktree_has_live_session
#        "$ROOT/.claude/worktrees/<source-id>"` → `observing-claimed`, skip. A
#        session may be actively clearing the residue right now; never mutate a
#        node another session holds. `worktree_has_live_session` is fail-safe by
#        construction — an unqueryable daemon reports OCCUPIED — which is
#        precisely the posture this rule wants. Do not "fix" that.
#     e. PREDICATE (class == `predicate`, i.e. the kind's re-check policy is
#        `auto` — today only `worktree-residue`) —
#        `worktree_residue_condition "$ROOT/.claude/worktrees/<source-id>"
#        "<source-id>"` (lib-worktree-residue.sh, strictly read-only).
#          rc 0 (`clean` / `absent`) → the condition has cleared → (f).
#          rc 1 → `observing-residue (<slug>)`, skip.
#          rc 2 (`unknown`) → `unknown`, skip. NEVER resolve on an inspection
#          failure.
#     f. RESOLVE — the per-pass cap is checked FIRST: at
#        `DISPATCH_HOLD_RECHECK_MAX` attempts already spent → `deferred
#        (cap=<n>)`, skip. Otherwise `$ROOT/packages/intentionsutil/scripts/
#        resolve-hold <source-id> --kind <kind>`. Exit 0 → `resolved`. Non-zero
#        → `resolve-failed (rc=<n>)`, the hold is KEPT and retried next tick, and
#        the sweep CONTINUES to the next candidate. It never aborts, never parks
#        anything, and never touches a node file directly.
#
#   The cap exists for the same reason lib-standdown-recheck.sh caps its parks:
#   `resolve-hold` pushes to `main` through graph-commit's landing lock, so an
#   unbounded batch would serialize N lock-contended pushes inside one tick.
#   Excess candidates are deferred to the next pass, which is free — the sweep is
#   idempotent and runs every tick.
#
# Environment overrides (all optional; the integer-valued one is
# integer-guarded, falling back to its default on a malformed value):
#   DISPATCH_HOLD_RECHECK_REPO_ROOT  Repo root anchoring every path below.
#                                    Default: resolve_main_worktree.
#   DISPATCH_HOLD_RECHECK_ENUM       Executable run INSTEAD of the default
#                                    enumerator invocation, with NO arguments
#                                    appended (test seam). Its stdout must carry
#                                    the same 4-column TSV.
#   DISPATCH_HOLD_RECHECK_RESOLVE    Executable run instead of
#                                    `<root>/packages/intentionsutil/scripts/
#                                    resolve-hold`, invoked with the SAME
#                                    arguments (test seam).
#   DISPATCH_HOLD_RECHECK_MAX        Maximum resolve attempts per invocation.
#                                    Default: 3.
# Respected via the libraries this file sources, NOT redefined here:
#   CLAUDE_AGENTS_CMD                 lib-claude-agents.sh — replaces the
#                                     `claude` invocation (testable, no daemon).
#   DISPATCH_AGENTS_SNAPSHOT[_ALL]    lib-claude-agents.sh — per-tick registry
#                                     snapshot reused across machine-wide calls.
#   DISPATCH_RESERVATION_DIR          lib-reservation-ledger.sh — ledger dir.
#   DISPATCH_GRAPH_MAIN_WORKTREE      lib-graph-worktree.sh — main-worktree
#                                     override.
#   DISPATCH_DECISION_LOG_DIR / _FILE lib-decision-log.sh — the JSONL sink.
#
# WHY ITS OWN FILE. This is deliberately NOT an extension of
# lib-standdown-recheck.sh, whose shape it copies (sourcing block, numbered rule
# ladder, one stderr line per item, per-invocation action cap, fail-safe
# UNKNOWN-keeps posture, and `_standdown_log_decision`'s shape). That file
# records the same non-sharing precedent with lib-frozen-session-park.sh in its
# own doc note. The two sweeps re-check unrelated conditions against unrelated
# ledgers and land through unrelated primitives; a merged file would couple two
# independent fail-safe postures.
#
# Sandbox: rule (d)'s liveness query reaches the local Claude daemon over a Unix
# socket, so callers must run this with `dangerouslyDisableSandbox: true` — see
# `.claude/rules/sandbox.md`. A sandboxed call yields `[]`; because
# `worktree_has_live_session` fails safe toward OCCUPIED only on an UNKNOWN (not
# on a well-formed empty array), a sandboxed pass would read every node as
# unclaimed. That is a false-resolve risk, not a false-keep one — hence the
# requirement.
#
# Safe to source multiple times. Does NOT use set -e (must return, not exit).
#
# Side effect: sourcing this file once sets `-u` and `-o pipefail` in the caller
# shell (via its own load-guard, and transitively via the siblings below).

# Source siblings via BASH_SOURCE dirname, matching lib-standdown-recheck.sh.
# lib.sh is plain function definitions; the others are load-guarded.
# lib-decision-log.sh is sourced non-fatally — its log is a best-effort
# observability sink, exactly as dispatch-select-tick sources it.
_lshr_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$_lshr_dir/lib.sh"
# shellcheck source=lib-claude-agents.sh
source "$_lshr_dir/lib-claude-agents.sh"
# shellcheck source=lib-reservation-ledger.sh
source "$_lshr_dir/lib-reservation-ledger.sh"
# shellcheck source=lib-graph-worktree.sh
source "$_lshr_dir/lib-graph-worktree.sh"
# shellcheck source=lib-worktree-residue.sh
source "$_lshr_dir/lib-worktree-residue.sh"
# shellcheck source=/dev/null
source "$_lshr_dir/lib-decision-log.sh" 2>/dev/null || true

if [[ -z "${_LIB_STALE_HOLD_RECHECK_LOADED:-}" ]]; then
  _LIB_STALE_HOLD_RECHECK_LOADED=1

  set -uo pipefail

  # _stale_hold_id_is_safe <id> — the shared id guard for rule (a). Both ids
  # become path components (`$ROOT/.claude/worktrees/<source-id>`) and command
  # arguments (`resolve-hold <source-id>`), so an id carrying a path separator, a
  # `..` component, or a control character must never get that far. The slug
  # regex is the same one provision-node-worktree enforces; the `case` guard in
  # front of it is defense in depth, kept explicit so the intent survives a
  # future loosening of the regex.
  _stale_hold_id_is_safe() {
    local id="${1:-}"
    [[ -n "$id" ]] || return 1
    case "$id" in
      *..*|*/*|*[[:cntrl:]]*) return 1 ;;
    esac
    [[ "$id" =~ ^[a-z][a-z0-9]*(-[a-z0-9]+)*$ ]] || return 1
    return 0
  }

  # _stale_hold_summary <candidates> <resolved> <observing> <manual> <unknown>
  #                     <failed> <deferred> <status>
  # The single summary line. Called on EVERY return path of the sweep — the
  # early repo-unresolvable and enumeration-failed exits included — so exactly
  # one such line appears per invocation, never zero and never two.
  _stale_hold_summary() {
    printf 'lib-stale-hold-recheck: sweep complete (candidates=%s resolved=%s observing=%s manual=%s unknown=%s failed=%s deferred=%s status=%s)\n' \
      "$1" "$2" "$3" "$4" "$5" "$6" "$7" "$8" >&2
    return 0
  }

  # _stale_hold_log_decision <hold-id> <source-id> <kind> <class> <disposition>
  # — append one best-effort JSONL decision record. Mirrors
  # lib-standdown-recheck.sh's `_standdown_log_decision`: build with `jq -c -n`,
  # hand the string to `decision_log_append` behind a `command -v` guard, and
  # NEVER fail the caller (the trailing `|| return 0` and the `2>/dev/null` on
  # the jq build are what make that true even with jq absent).
  _stale_hold_log_decision() {
    local hold_id="$1" source_id="$2" kind="$3" cls="$4" disposition="$5"
    local json
    json=$(jq -c -n \
      --arg ts          "$(date -u +%FT%TZ)" \
      --arg site        "stale-hold-recheck-sweep" \
      --arg hold_id     "$hold_id" \
      --arg source_id   "$source_id" \
      --arg kind        "$kind" \
      --arg class       "$cls" \
      --arg disposition "$disposition" \
      '
      {
        ts:          $ts,
        site:        $site,
        hold_id:     $hold_id,
        source_id:   $source_id,
        kind:        $kind,
        class:       $class,
        disposition: $disposition
      }' 2>/dev/null) || return 0
    command -v decision_log_append >/dev/null 2>&1 && decision_log_append "$json" || true
    return 0
  }

  # stale_hold_recheck_sweep — see the header comment for the full contract and
  # rule ladder. ALWAYS returns 0.
  stale_hold_recheck_sweep() {
    local candidates=0 resolved=0 observing=0 manual=0 unknown=0 failed=0 deferred=0
    # resolve_attempts counts only the attempts the cap governs. It is
    # deliberately NOT `resolved`: a failed resolve consumed a landing-lock push
    # just as a successful one did, so it must count against the cap.
    local resolve_attempts=0

    local max="${DISPATCH_HOLD_RECHECK_MAX:-3}"
    [[ "$max" =~ ^[0-9]+$ ]] || max=3

    # --- Step 1: the repo root (invariant I1) --------------------------------
    local root="${DISPATCH_HOLD_RECHECK_REPO_ROOT:-}"
    if [[ -z "$root" ]]; then
      root=$(resolve_main_worktree 2>/dev/null) || root=""
    fi
    if [[ -z "$root" ]]; then
      printf 'lib-stale-hold-recheck: repo root unresolvable (DISPATCH_HOLD_RECHECK_REPO_ROOT unset and no worktree has main checked out); re-checking nothing this pass\n' >&2
      _stale_hold_summary 0 0 0 0 0 0 0 "repo-unresolvable"
      return 0
    fi

    # --- Step 2: enumerate ---------------------------------------------------
    local enum_out="" enum_rc=0
    if [[ -n "${DISPATCH_HOLD_RECHECK_ENUM:-}" ]]; then
      enum_out=$( (cd "$root" && "$DISPATCH_HOLD_RECHECK_ENUM") ) || enum_rc=$?
    else
      enum_out=$( (cd "$root" && node --import tsx/esm \
        "$root/packages/intentionsutil/scripts/list-recheckable-holds.ts" \
        --dir "$root/intentions") ) || enum_rc=$?
    fi
    if (( enum_rc != 0 )); then
      # LOUD, and reported under its OWN status: an enumeration that could not
      # run must never be indistinguishable from a pass that genuinely found
      # nothing to do.
      printf 'lib-stale-hold-recheck: hold enumeration FAILED (rc=%s, root=%s) — no hold was re-checked this pass; this is NOT "no stale holds"\n' \
        "$enum_rc" "$root" >&2
      _stale_hold_summary 0 0 0 0 0 0 0 "enumeration-failed"
      return 0
    fi

    local resolve_cmd="${DISPATCH_HOLD_RECHECK_RESOLVE:-$root/packages/intentionsutil/scripts/resolve-hold}"

    # --- Step 3: the per-candidate ladder ------------------------------------
    local hold_id source_id kind cls wt slug cond_rc rc do_resolve
    while IFS=$'\t' read -r hold_id source_id kind cls; do
      [[ -n "$hold_id" || -n "$source_id" ]] || continue
      candidates=$(( candidates + 1 ))

      # (a) Unsafe id. Counted only as a candidate — no other bucket claims it.
      if ! _stale_hold_id_is_safe "$hold_id" || ! _stale_hold_id_is_safe "$source_id"; then
        printf 'lib-stale-hold-recheck: unsafe-id (%s / %s)\n' "$hold_id" "$source_id" >&2
        _stale_hold_log_decision "$hold_id" "$source_id" "$kind" "$cls" "unsafe-id"
        continue
      fi

      # (b) A manual-policy hold: reported for visibility, never acted on.
      if [[ "$cls" == "manual" ]]; then
        printf 'lib-stale-hold-recheck: skip-manual-policy (%s has no machine-checkable predicate) for %s\n' \
          "$kind" "$hold_id" >&2
        manual=$(( manual + 1 ))
        _stale_hold_log_decision "$hold_id" "$source_id" "$kind" "$cls" "skip-manual-policy"
        continue
      fi

      # (c) An edge-residue candidate goes straight to the resolve step: the
      # hold is already terminal, so there is no tracked condition left to
      # predicate on — only the survived `blocked_by` edge to clear.
      do_resolve=0
      if [[ "$cls" == "edge-residue" ]]; then
        do_resolve=1
      fi

      wt="$root/.claude/worktrees/$source_id"

      if (( do_resolve == 0 )); then
        # (d) Claimed. Checked BEFORE the predicate: a session actively clearing
        # the residue would momentarily read as clean, and resolving under it
        # would mutate a node that session holds.
        if reservation_exists "$source_id" 2>/dev/null || worktree_has_live_session "$wt"; then
          printf 'lib-stale-hold-recheck: observing-claimed (%s has a live session or reservation)\n' "$source_id" >&2
          observing=$(( observing + 1 ))
          _stale_hold_log_decision "$hold_id" "$source_id" "$kind" "$cls" "observing-claimed"
          continue
        fi

        # (e) The predicate. Read-only by construction — this sweep does not own
        # the worktree and must never abort, check out, or write in it.
        cond_rc=0
        slug=$(worktree_residue_condition "$wt" "$source_id") || cond_rc=$?
        if (( cond_rc == 1 )); then
          printf 'lib-stale-hold-recheck: observing-residue (%s) for %s\n' "$slug" "$hold_id" >&2
          observing=$(( observing + 1 ))
          _stale_hold_log_decision "$hold_id" "$source_id" "$kind" "$cls" "observing-residue"
          continue
        fi
        if (( cond_rc != 0 )); then
          printf 'lib-stale-hold-recheck: unknown (%s)\n' "$hold_id" >&2
          unknown=$(( unknown + 1 ))
          _stale_hold_log_decision "$hold_id" "$source_id" "$kind" "$cls" "unknown"
          continue
        fi
        do_resolve=1
      fi

      # (f) Resolve. The cap is checked BEFORE the attempt is spent.
      if (( resolve_attempts >= max )); then
        printf 'lib-stale-hold-recheck: deferred (cap=%s) for %s\n' "$max" "$hold_id" >&2
        deferred=$(( deferred + 1 ))
        _stale_hold_log_decision "$hold_id" "$source_id" "$kind" "$cls" "deferred"
        continue
      fi
      resolve_attempts=$(( resolve_attempts + 1 ))

      rc=0
      "$resolve_cmd" "$source_id" --kind "$kind" >/dev/null || rc=$?
      if (( rc == 0 )); then
        printf 'lib-stale-hold-recheck: resolved %s (unblocked %s)\n' "$hold_id" "$source_id" >&2
        resolved=$(( resolved + 1 ))
        _stale_hold_log_decision "$hold_id" "$source_id" "$kind" "$cls" "resolved"
      else
        # Never fatal, never a park, never a hand-edit: keep the hold and let the
        # next tick retry. resolve-hold is idempotent, so a retry is free.
        printf 'lib-stale-hold-recheck: resolve-failed (rc=%s) — keeping the hold, retrying next tick (%s)\n' \
          "$rc" "$hold_id" >&2
        failed=$(( failed + 1 ))
        _stale_hold_log_decision "$hold_id" "$source_id" "$kind" "$cls" "resolve-failed"
      fi
    done <<<"$enum_out"

    _stale_hold_summary "$candidates" "$resolved" "$observing" "$manual" "$unknown" "$failed" "$deferred" "ok"
    return 0
  }

fi
