#!/usr/bin/env bash
# lib-wait-recheck.sh — the WAIT calendar-release sweep
# (tactic-wait-calendar-release, unit 7).
#
# The failure this closes: a WAIT node is a mechanical hold that a session arms
# when the thing it needs is not observable YET — a batch window that has not
# closed, a deploy that has not run, a calendar instant that has not arrived.
# While it is armed (`phase: null`, `office_hours: null`) the source's
# `blocked_by` edge naming it keeps the source unselectable. Nothing in the
# graph watches a clock, so without a tick-driven sweep the instant recorded in
# `attributes.wait_until` passes and the WAIT stays armed forever — the source
# permanently unselectable for a condition that cleared on schedule. The
# mirror-image steady state is the re-arm loop that never ends: a WAIT that
# re-arms on every not-yet-observed verdict would spin without limit, so
# `attributes.wait_attempts` reaching `WAIT_ATTEMPT_CAP` (packages/
# intentionsutil/src/waits.ts) must escalate to the author instead of releasing
# again. The third steady state is the wait that is never due at all — armed for
# a distant instant, or re-EXTENDED before every deadline (an extension is not a
# new attempt, so the counter never moves): the attempt cap cannot see it, so
# the enumerator classifies a wait past `WAIT_MAX_HORIZON_DAYS` — by
# `wait_until` or by cumulative `wait_armed_since` age — as `capped` too, and
# this sweep parks it. This sweep is what escapes all three states.
#
# THE CONTRACT — read this before changing anything below:
#
#   1. CONTAINMENT AND OBSERVABILITY ONLY. This sweep is NEVER a gate. It
#      ALWAYS returns 0 — on every single code path, including an unresolvable
#      repo root, a failed enumeration, an unqueryable session daemon, an
#      unreadable node, a failed `release-wait`, and a failed `park-node`. A
#      caller's tick must never fail because the WAIT re-check had a bad day.
#   2. NO GRAPH WRITE OF ITS OWN. Every mutation goes through
#      `packages/intentionsutil/scripts/release-wait` (the release: `phase:
#      done` on the WAIT's own node) or `packages/intentionsutil/scripts/
#      park-node` (the cap escalation: `office_hours` on the WAIT's own node).
#      Both own the fresh `origin/main` refresh, the compare-and-swap token, and
#      — for release-wait — the re-assert of every release precondition on the
#      FRESH content plus the post-land re-read that proves the write survived.
#      Do NOT hand-roll a node write here. In particular, do NOT clear the
#      source's `blocked_by` edge: that edge surviving a release is BY DESIGN
#      (it is what lets a later `arm-wait` REARM put the WAIT back to work in
#      place without re-deriving an id or re-wiring an edge), which is exactly
#      the opposite of a hold's `edge-residue`.
#   3. FAIL-SAFE MEANS KEEP. Every uncertainty — a daemon that could not be
#      queried, a node whose park attributes could not be read, a session that
#      might be holding the WAIT or its source — resolves to KEEPING the WAIT
#      armed and reporting it, never to releasing it. For a CALENDAR wait the
#      failure direction that matters is releasing EARLY: a WAIT held one tick
#      too long costs a tick, while a WAIT released before its instant hands a
#      source back to the fleet to re-observe the very thing that was not
#      observable yet.
#
# Usage: source this file, then call:
#   wait_recheck_sweep
#
# wait_recheck_sweep
#   No arguments. Returns 0 ALWAYS. Emits one greppable stderr line per
#   candidate, one best-effort `_wait_recheck_log_decision` JSONL record per
#   candidate, and EXACTLY ONE summary line on every return path:
#
#     lib-wait-recheck: sweep complete (candidates=N released=N capped=N
#       observing=N malformed=N failed=N deferred=N backoff=N escalated=N
#       status=<ok|enumeration-failed|repo-unresolvable>)
#
#   `status=ok` with `candidates=0` is the legitimate "nothing to do" pass. It
#   is deliberately DISTINCT from `status=enumeration-failed`: an enumeration
#   that could not run must never be reported as "no waits are due".
#
#   Step 1 — the repo root. `DISPATCH_WAIT_RECHECK_REPO_ROOT` when set and
#   non-empty, else `resolve_main_worktree` (lib-graph-worktree.sh, which honors
#   DISPATCH_GRAPH_MAIN_WORKTREE). Unresolvable → the `repo-unresolvable`
#   summary and return 0. Every path below — the enumerator, `release-wait`,
#   `park-node`, and the worktree lookups — is anchored at this root:
#   `release-wait`, `park-node`, and `graph-commit` derive their OWN repo root
#   from their script location, so invoking `$ROOT/packages/intentionsutil/
#   scripts/<writer>` is what makes the write land against the main checkout
#   regardless of the tick's cwd.
#
#   Step 2 — enumerate. `node --import tsx/esm
#   $ROOT/packages/intentionsutil/scripts/list-recheckable-waits.ts --dir
#   $ROOT/intentions`, run with cwd `$ROOT` (the invocation shape
#   lib-stale-hold-recheck.sh uses for its own enumerator). One TSV line per
#   candidate: `<wait-id>\t<source-id>\t<attempts>\t<wait-until>\t<class>`,
#   class one of `due` | `waiting` | `capped` | `malformed`. A non-zero exit
#   prints one loud stderr line and ends the pass with
#   `status=enumeration-failed`.
#
#   Step 3 — per candidate, THIS ladder in THIS order (the order is the
#   correctness property):
#     a. either id (the WAIT's or the source's) fails the node-id slug shape
#        `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`, or carries `/`, `..`, or a control
#        character → `unsafe-id`, skip. Both ids become path components and
#        command arguments below; a clear skip beats a path escape.
#     b. class == `malformed` → `skip-malformed`, counted, never acted on, with
#        ONE loud stderr line naming the WAIT. This is the ONLY visible surface
#        for a corrupted `wait_until` / `wait_attempts` (the enumerator never
#        guesses a value to make such a node actionable), so it must not be
#        silently dropped.
#     c. class == `waiting` → `observing (until=<wait-until>)`, skip. The
#        instant has not arrived; there is nothing to do and nothing wrong.
#     d. CLAIMED — for the SOURCE node and for the WAIT node alike:
#        `reservation_exists <id>` (the ledger marker basename for a node-lane
#        node IS its node id) OR `worktree_has_live_session
#        "$ROOT/.claude/worktrees/<id>"` → `observing-claimed`, skip, naming
#        WHICH id is claimed. The source is checked first, then the WAIT. Both
#        are checked because both are mutated in effect: a release makes the
#        SOURCE selectable again (a session mid-work on it would find the fleet
#        racing it for the same node), and a cap-park writes `office_hours` on
#        the WAIT itself — and a WAIT is a `kind: tactic` node, so the graph
#        office-hours lane (`packages/intentionsutil/scripts/
#        office-hours-graph`) can provision `<root>/.claude/worktrees/<wait-id>`
#        and launch a `--bg` session named after it. Never mutate a node another
#        session holds.
#        `worktree_has_live_session` is fail-safe by construction — an
#        unqueryable daemon reports OCCUPIED — which is precisely the posture
#        this rule wants. Do not "fix" that.
#     e. THE PER-NODE FAILURE BACKOFF, checked BEFORE the cap so a backing-off
#        candidate spends no slot at all: a WAIT with `skips > 0` in the sweep
#        state → `backoff-skipped`, skip and decrement. Every consecutive failed
#        write attempt on a WAIT doubles its skip window (1, 2, 4, 8 … passes,
#        clamped at `DISPATCH_WAIT_RECHECK_BACKOFF_MAX`), and a success clears
#        it. At `DISPATCH_WAIT_RECHECK_FAIL_ESCALATE` consecutive failures the
#        WAIT is escalated to office hours (`park-node` on its OWN id) and the
#        sweep stops retrying it — a wait whose writer refuses forever is an
#        author problem, not a thing to re-attempt every tick until the heat
#        death of the fleet. That escalation park is itself a write attempt and
#        counts against the cap, so a pass may spend one slot past the cap on
#        it; the alternative (deferring the terminal disposition of a wait that
#        already failed N times) is the starvation this whole rule closes.
#     f. THE PER-PASS CAP, checked BEFORE acting on a `due` or `capped`
#        candidate: at `DISPATCH_WAIT_RECHECK_MAX` write attempts already spent
#        this invocation → `deferred (cap=<n>)`, skip. Both `release-wait` and
#        `park-node` push to `main` through graph-commit's landing lock, so an
#        unbounded batch would serialize N lock-contended pushes inside one
#        tick. Excess candidates are deferred to the next pass, which is free —
#        the sweep is idempotent and runs every tick.
#     g. THE WRITE.
#        class == `due` → `$ROOT/packages/intentionsutil/scripts/release-wait
#        <wait-id>`. Exit 0 → `released`. Non-zero → `resolve-failed (rc=<n>)`:
#        the WAIT is KEPT armed and retried next tick, and the sweep CONTINUES
#        to the next candidate. (release-wait re-asserts every release
#        precondition against FRESH origin/main content and refuses on a stale
#        classification, so a non-zero exit here is frequently the system
#        working, not breaking.)
#        class == `capped` → `$ROOT/packages/intentionsutil/scripts/park-node
#        <wait-id> <wait_reason> <wait_recommendation>` — on the WAIT's OWN id,
#        NEVER the source's. Parking the source would freeze work the author
#        never escalated; the thing that ran out of attempts is the WAIT. The
#        two strings come from the node's own frontmatter
#        (`attributes.wait_reason` / `attributes.wait_recommendation`, both
#        required non-empty by validate-graph rule 22) so the author reads the
#        awaited event verbatim in `office_hours.reason`. They are read through
#        `readNode` under tsx and extracted with `jq <<<` — never `echo | jq`
#        (.claude/rules/shell-json.md: zsh's builtin echo un-escapes `\t`/`\n`
#        and corrupts valid JSON). An unreadable or empty pair is a `resolve-
#        failed` KEEP, not a park with an invented reason. Exit 0 →
#        `capped-parked`. Non-zero → `resolve-failed (rc=<n>)`, same
#        KEEP-and-continue posture as a failed release.
#
#        The cap counter (`resolve_attempts`) increments on EVERY invocation of
#        either writer — a FAILED one spent a landing-lock push exactly as a
#        successful one did, so it must count against the cap.
#
#   Step 4 — FAIRNESS. The cap in (f) plus a FIXED candidate order is a
#   head-of-line starvation bug: `listWaitCandidates` sorts by wait id ascending
#   (packages/intentionsutil/src/wait-sweep.ts), so three alphabetically-early
#   WAITs whose writer fails every time would spend the whole cap every tick
#   forever and every later-sorted WAIT would be `deferred` on every tick — a
#   quiet failure, since the summary still reads `status=ok`. Two mechanisms
#   close it, and they are BOTH required:
#     - ROUND-ROBIN. The pass resumes at the candidate AFTER the last one a
#       write attempt was spent on (`cursor_id` in the sweep state), wrapping
#       around, so the cap walks the whole candidate list across successive
#       ticks instead of re-spending itself on the same prefix.
#     - PER-NODE BACKOFF AND ESCALATION — rule (e). Round-robin alone still lets
#       a permanently-failing WAIT burn one slot per lap; the doubling skip
#       window shrinks that to almost nothing, and the escalation retires it.
#   The state both mechanisms need lives OUTSIDE the graph — this sweep still
#   writes no node of its own (contract 2) — in a machine-local JSON file
#   (`DISPATCH_WAIT_RECHECK_STATE`), read and written BEST-EFFORT: a missing,
#   unreadable, or corrupt file degrades to "start at candidate 0, no backoff",
#   which is exactly the pre-fix behavior, never to a failed pass.
#
# Environment overrides (all optional; the integer-valued one is
# integer-guarded, falling back to its default on a malformed value):
#   DISPATCH_WAIT_RECHECK_REPO_ROOT  Repo root anchoring every path below.
#                                    Default: resolve_main_worktree.
#   DISPATCH_WAIT_RECHECK_ENUM       Executable run INSTEAD of the default
#                                    enumerator invocation, with NO arguments
#                                    appended (test seam). Its stdout must carry
#                                    the same 5-column TSV.
#   DISPATCH_WAIT_RECHECK_RELEASE    Executable run instead of
#                                    `<root>/packages/intentionsutil/scripts/
#                                    release-wait`, invoked with the SAME
#                                    arguments (test seam).
#   DISPATCH_WAIT_RECHECK_PARK       Executable run instead of
#                                    `<root>/packages/intentionsutil/scripts/
#                                    park-node`, invoked with the SAME
#                                    arguments (test seam).
#   DISPATCH_WAIT_RECHECK_MAX        Maximum write attempts per invocation
#                                    (release + park combined — ONE shared
#                                    counter, not one per class). Default: 3.
#   DISPATCH_WAIT_RECHECK_STATE      Path to the machine-local JSON carrying the
#                                    round-robin cursor and the per-node
#                                    consecutive-failure/backoff counters.
#                                    Default: $HOME/.local/share/
#                                    commons-dispatch/wait-recheck-state.json.
#   DISPATCH_WAIT_RECHECK_BACKOFF_MAX  Clamp on the doubling skip window, in
#                                    passes. Default: 16. 0 disables backoff.
#   DISPATCH_WAIT_RECHECK_FAIL_ESCALATE  Consecutive failed write attempts on
#                                    ONE wait that escalate it to office hours.
#                                    Default: 6.
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
# lib-stale-hold-recheck.sh, whose shape it copies (sourcing block, numbered
# rule ladder, one stderr line per item, per-invocation action cap, fail-safe
# KEEP-on-uncertainty posture, and `_stale_hold_log_decision`'s shape). That
# file records the same non-sharing precedent with lib-standdown-recheck.sh in
# its own doc note, which in turn records it with lib-frozen-session-park.sh.
# The two sweeps look alike and are not: a HOLD is born PARKED (`office_hours`
# set) and resolves by clearing TWO independent facts — the hold's own state AND
# the source's `blocked_by` edge — which is why resolve-hold needs a deliberate
# two-commit split and a post-land re-read that the edge removal survived
# graph-commit's union-dedup merge. A WAIT is born `office_hours`-NULL and
# releases by ONE fact, its own `phase`, with the source's edge KEPT on purpose.
# Merging them would couple two independent fail-safe postures and invite a
# shared code path to "helpfully" clear the WAIT's edge, destroying re-arm in
# place.
#
# Sandbox: rule (d)'s claim check reaches the local Claude daemon over a Unix
# socket, so callers must run this with `dangerouslyDisableSandbox: true` — see
# `.claude/rules/sandbox.md`. A sandboxed call yields `[]`; because
# `worktree_has_live_session` fails safe toward OCCUPIED only on an UNKNOWN (not
# on a well-formed empty array), a sandboxed pass would read every node as
# unclaimed. That is a false-RELEASE risk (and a false-park risk), not a
# false-keep one — hence the requirement.
#
# Safe to source multiple times. Does NOT use set -e (must return, not exit).
#
# Side effect: sourcing this file once sets `-u` and `-o pipefail` in the caller
# shell (via its own load-guard, and transitively via the siblings below).

# Source siblings via BASH_SOURCE dirname, matching lib-stale-hold-recheck.sh.
# lib.sh is plain function definitions; the others are load-guarded.
# lib-decision-log.sh is sourced non-fatally — its log is a best-effort
# observability sink, exactly as dispatch-select-tick sources it.
_lwr_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$_lwr_dir/lib.sh"
# shellcheck source=lib-claude-agents.sh
source "$_lwr_dir/lib-claude-agents.sh"
# shellcheck source=lib-reservation-ledger.sh
source "$_lwr_dir/lib-reservation-ledger.sh"
# shellcheck source=lib-graph-worktree.sh
source "$_lwr_dir/lib-graph-worktree.sh"
# shellcheck source=/dev/null
source "$_lwr_dir/lib-decision-log.sh" 2>/dev/null || true

if [[ -z "${_LIB_WAIT_RECHECK_LOADED:-}" ]]; then
  _LIB_WAIT_RECHECK_LOADED=1

  set -uo pipefail

  # _wait_recheck_id_is_safe <id> — the shared id guard for rule (a). Both ids
  # become path components (`$ROOT/.claude/worktrees/<source-id>`) and command
  # arguments (`release-wait <wait-id>`), so an id carrying a path separator, a
  # `..` component, or a control character must never get that far. The slug
  # regex is the same one provision-node-worktree enforces (and the same one
  # waits.ts asserts the derived wait id against); the `case` guard in front of
  # it is defense in depth, kept explicit so the intent survives a future
  # loosening of the regex.
  _wait_recheck_id_is_safe() {
    local id="${1:-}"
    [[ -n "$id" ]] || return 1
    case "$id" in
      *..*|*/*|*[[:cntrl:]]*) return 1 ;;
    esac
    [[ "$id" =~ ^[a-z][a-z0-9]*(-[a-z0-9]+)*$ ]] || return 1
    return 0
  }

  # _wait_recheck_summary <candidates> <released> <capped> <observing>
  #                       <malformed> <failed> <deferred> <backoff> <escalated>
  #                       <status>
  # The single summary line. Called on EVERY return path of the sweep — the
  # early repo-unresolvable and enumeration-failed exits included — so exactly
  # one such line appears per invocation, never zero and never two.
  _wait_recheck_summary() {
    printf 'lib-wait-recheck: sweep complete (candidates=%s released=%s capped=%s observing=%s malformed=%s failed=%s deferred=%s backoff=%s escalated=%s status=%s)\n' \
      "$1" "$2" "$3" "$4" "$5" "$6" "$7" "$8" "$9" "${10}" >&2
    return 0
  }

  # --- The sweep state: round-robin cursor + per-node failure backoff ---------
  # Held in these three globals between load and save. `_WAIT_RECHECK_FAILS[id]`
  # is the count of CONSECUTIVE failed write attempts on that wait (cleared by
  # any success), `_WAIT_RECHECK_SKIPS[id]` the number of further passes to skip
  # it for, and `_WAIT_RECHECK_CURSOR_ID` the wait the last write attempt of the
  # previous pass was spent on. See "Step 4 — FAIRNESS" in the header.
  declare -A _WAIT_RECHECK_FAILS=()
  declare -A _WAIT_RECHECK_SKIPS=()
  _WAIT_RECHECK_CURSOR_ID=""

  # _wait_recheck_state_path — the machine-local JSON path. `${HOME:-/tmp}`
  # rather than `$HOME` because this file sets `-u` in the caller shell.
  _wait_recheck_state_path() {
    printf '%s\n' \
      "${DISPATCH_WAIT_RECHECK_STATE:-${HOME:-/tmp}/.local/share/commons-dispatch/wait-recheck-state.json}"
  }

  # _wait_recheck_state_load — populate the three globals from the state file.
  # ALWAYS returns 0, and ALWAYS leaves the globals well-formed: an absent,
  # unreadable, jq-less, or corrupt file simply yields the empty state, which is
  # the pre-fix behavior (start at candidate 0, no node backing off). Every id
  # is re-validated through the same slug guard rule (a) uses — the file is
  # machine-local, but it still becomes command arguments below.
  _wait_recheck_state_load() {
    _WAIT_RECHECK_FAILS=()
    _WAIT_RECHECK_SKIPS=()
    _WAIT_RECHECK_CURSOR_ID=""
    local path
    path="$(_wait_recheck_state_path)"
    [[ -r "$path" ]] || return 0

    local cursor
    cursor=$(jq -r 'if (.cursor_id | type) == "string" then .cursor_id else "" end' \
      "$path" 2>/dev/null) || cursor=""
    if _wait_recheck_id_is_safe "$cursor"; then
      _WAIT_RECHECK_CURSOR_ID="$cursor"
    fi

    local sid sfails sskips
    while IFS=$'\t' read -r sid sfails sskips; do
      [[ -n "$sid" ]] || continue
      _wait_recheck_id_is_safe "$sid" || continue
      [[ "$sfails" =~ ^[0-9]+$ ]] || sfails=0
      [[ "$sskips" =~ ^[0-9]+$ ]] || sskips=0
      _WAIT_RECHECK_FAILS["$sid"]="$sfails"
      _WAIT_RECHECK_SKIPS["$sid"]="$sskips"
    done < <(jq -r '
      (.nodes // {}) | to_entries[]
      | [ .key,
          (.value.fails as $f | if ($f | type) == "number" then ($f | floor | tostring) else "0" end),
          (.value.skips as $s | if ($s | type) == "number" then ($s | floor | tostring) else "0" end) ]
      | @tsv' "$path" 2>/dev/null)
    return 0
  }

  # _wait_recheck_state_save — persist the three globals, atomically (tmp + mv)
  # so a concurrent reader never sees a half-written file. BEST-EFFORT and
  # ALWAYS returns 0: losing the state costs fairness on the next pass, and must
  # never cost the sweep its "returns 0 on every path" contract. The JSON is
  # built by piping a TSV into `jq -R -s` — never `echo … | jq`
  # (.claude/rules/shell-json.md).
  _wait_recheck_state_save() {
    local path dir
    path="$(_wait_recheck_state_path)"
    dir="$(dirname "$path")"
    mkdir -p "$dir" 2>/dev/null || return 0

    local tsv="" sid
    if (( ${#_WAIT_RECHECK_FAILS[@]} > 0 )); then
      for sid in "${!_WAIT_RECHECK_FAILS[@]}"; do
        tsv+="$sid"$'\t'"${_WAIT_RECHECK_FAILS[$sid]}"$'\t'"${_WAIT_RECHECK_SKIPS[$sid]:-0}"$'\n'
      done
    fi

    local json
    json=$(printf '%s' "$tsv" | jq -R -s -c --arg cursor "$_WAIT_RECHECK_CURSOR_ID" '
      {
        cursor_id: $cursor,
        nodes: (
          split("\n") | map(select(length > 0) | split("\t"))
          | map({ key: .[0], value: { fails: (.[1] | tonumber), skips: (.[2] | tonumber) } })
          | from_entries
        )
      }' 2>/dev/null) || return 0
    [[ -n "$json" ]] || return 0

    local tmp
    tmp=$(mktemp "$dir/.wait-recheck-state.XXXXXX" 2>/dev/null) || return 0
    if printf '%s\n' "$json" >"$tmp" 2>/dev/null; then
      mv -f "$tmp" "$path" 2>/dev/null || rm -f "$tmp"
    else
      rm -f "$tmp"
    fi
    return 0
  }

  # _wait_recheck_note_failure <wait-id> <backoff-max> — record ONE consecutive
  # failed write attempt on this wait and arm its skip window: 1 pass after the
  # first failure, then 2, 4, 8 …, clamped at <backoff-max> (0 disables the
  # window entirely). Updates the globals only; the caller persists them.
  _wait_recheck_note_failure() {
    local wid="$1" bmax="$2"
    local n=$(( ${_WAIT_RECHECK_FAILS[$wid]:-0} + 1 ))
    _WAIT_RECHECK_FAILS["$wid"]="$n"
    local window=1 j
    for (( j = 1; j < n; j++ )); do
      window=$(( window * 2 ))
      (( window >= bmax )) && break
    done
    (( window > bmax )) && window="$bmax"
    _WAIT_RECHECK_SKIPS["$wid"]="$window"
    return 0
  }

  # _wait_recheck_clear_failure <wait-id> — a success (or a terminal escalation)
  # ends the failure streak. The ids reaching here already passed rule (a)'s
  # slug guard, so the subscript is safe to evaluate.
  _wait_recheck_clear_failure() {
    local wid="$1"
    unset '_WAIT_RECHECK_FAILS[$wid]' 2>/dev/null || true
    unset '_WAIT_RECHECK_SKIPS[$wid]' 2>/dev/null || true
    return 0
  }

  # _wait_recheck_log_decision <wait-id> <source-id> <attempts> <wait-until>
  #                            <class> <disposition>
  # — append one best-effort JSONL decision record. Mirrors
  # lib-stale-hold-recheck.sh's `_stale_hold_log_decision`: build with `jq -c
  # -n`, hand the string to `decision_log_append` behind a `command -v` guard,
  # and NEVER fail the caller (the trailing `|| return 0` and the `2>/dev/null`
  # on the jq build are what make that true even with jq absent).
  _wait_recheck_log_decision() {
    local wait_id="$1" source_id="$2" attempts="$3" until_at="$4" cls="$5" disposition="$6"
    local json
    json=$(jq -c -n \
      --arg ts          "$(date -u +%FT%TZ)" \
      --arg site        "wait-recheck-sweep" \
      --arg wait_id     "$wait_id" \
      --arg source_id   "$source_id" \
      --arg attempts    "$attempts" \
      --arg wait_until  "$until_at" \
      --arg class       "$cls" \
      --arg disposition "$disposition" \
      '
      {
        ts:          $ts,
        site:        $site,
        wait_id:     $wait_id,
        source_id:   $source_id,
        attempts:    $attempts,
        wait_until:  $wait_until,
        class:       $class,
        disposition: $disposition
      }' 2>/dev/null) || return 0
    command -v decision_log_append >/dev/null 2>&1 && decision_log_append "$json" || true
    return 0
  }

  # _wait_recheck_park_attrs <root> <wait-id> — emit the WAIT's park strings as
  # ONE JSON object, `{"wait_reason":…,"wait_recommendation":…}`, on stdout.
  #
  # Read through store.ts's `readNode` under tsx rather than by grepping the
  # YAML frontmatter: the frontmatter is authoritative but its serialization is
  # not line-oriented (a folded or quoted multi-line reason is legal), and the
  # validated reader is the only thing that parses it correctly. The caller
  # extracts each field with `jq <<<` on this object — never `echo | jq`
  # (.claude/rules/shell-json.md).
  #     return 0 — stdout carries the JSON object.
  #     return 1 — the node could not be read, or either string is missing or
  #                empty. The caller KEEPS the WAIT rather than parking it with
  #                an invented reason.
  _wait_recheck_park_attrs() {
    local root="$1" wait_id="$2"
    local tmp
    tmp=$(mktemp --suffix=.mts 2>/dev/null) || return 1
    cat >"$tmp" <<'TS'
// argv: <storeModule> <intentionsDir> <id>
const [storePath, intentionsDir, id] = process.argv.slice(2);
const { readNode } = await import(storePath);
const node = readNode(intentionsDir, id);
const pick = (k) => (typeof node.attributes?.[k] === "string" ? node.attributes[k] : "");
process.stdout.write(
  JSON.stringify({ wait_reason: pick("wait_reason"), wait_recommendation: pick("wait_recommendation") }) + "\n",
);
TS
    local out rc=0
    out=$( (cd "$root" && node --import tsx/esm "$tmp" \
      "$root/packages/intentionsutil/src/store.js" "$root/intentions" "$wait_id" 2>/dev/null) ) || rc=$?
    rm -f "$tmp"
    (( rc == 0 )) || return 1
    [[ -n "${out//[[:space:]]/}" ]] || return 1
    printf '%s\n' "$out"
    return 0
  }

  # _wait_recheck_escalate <root> <park-cmd> <wait-id> <fails> <writer>
  # — the terminal disposition for a wait whose writer has refused <fails>
  # consecutive times: park it to office hours on its OWN id (never the
  # source's, exactly as the cap-park does) so the author reads BOTH what the
  # wait was waiting for and that the sweep gave up on it.
  #
  # The two strings still come from the node's own frontmatter — the failure
  # narrative is PREPENDED to `wait_reason` rather than substituted for it, so
  # nothing here is invented. An unreadable or empty pair returns 1 and the
  # caller keeps the wait armed (backing off), same posture as the cap-park.
  #     return 0 — the park landed.
  #     return 1 — attributes unreadable/empty, or park-node exited non-zero.
  _wait_recheck_escalate() {
    local root="$1" park_cmd="$2" wid="$3" fails="$4" writer="$5"
    local attrs reason rec
    attrs=$(_wait_recheck_park_attrs "$root" "$wid") || return 1
    # `jq <<<`, never `echo | jq` — see .claude/rules/shell-json.md.
    reason=$(jq -r '.wait_reason // ""' <<<"$attrs" 2>/dev/null) || reason=""
    rec=$(jq -r '.wait_recommendation // ""' <<<"$attrs" 2>/dev/null) || rec=""
    [[ -n "$reason" && -n "$rec" ]] || return 1
    "$park_cmd" "$wid" \
      "the calendar-wait sweep gave up on this wait: $fails consecutive $writer attempts failed, so the sweep has stopped retrying it. The awaited event was: $reason" \
      "run $writer on this wait by hand and read its refusal; fix what it names, then release or re-arm the wait. The wait's own recommendation was: $rec" \
      >/dev/null || return 1
    return 0
  }

  # wait_recheck_sweep — see the header comment for the full contract and rule
  # ladder. ALWAYS returns 0.
  wait_recheck_sweep() {
    local candidates=0 released=0 capped=0 observing=0 malformed=0 failed=0 deferred=0
    local backoff=0 escalated=0
    # resolve_attempts counts only the attempts the cap governs, across BOTH
    # writers. It is deliberately NOT `released + capped`: a failed write
    # consumed a landing-lock push just as a successful one did, so it must
    # count against the cap.
    local resolve_attempts=0

    local max="${DISPATCH_WAIT_RECHECK_MAX:-3}"
    [[ "$max" =~ ^[0-9]+$ ]] || max=3
    local backoff_max="${DISPATCH_WAIT_RECHECK_BACKOFF_MAX:-16}"
    [[ "$backoff_max" =~ ^[0-9]+$ ]] || backoff_max=16
    local escalate_at="${DISPATCH_WAIT_RECHECK_FAIL_ESCALATE:-6}"
    [[ "$escalate_at" =~ ^[1-9][0-9]*$ ]] || escalate_at=6

    # --- Step 1: the repo root ----------------------------------------------
    local root="${DISPATCH_WAIT_RECHECK_REPO_ROOT:-}"
    if [[ -z "$root" ]]; then
      root=$(resolve_main_worktree 2>/dev/null) || root=""
    fi
    if [[ -z "$root" ]]; then
      printf 'lib-wait-recheck: repo root unresolvable (DISPATCH_WAIT_RECHECK_REPO_ROOT unset and no worktree has main checked out); re-checking nothing this pass\n' >&2
      _wait_recheck_summary 0 0 0 0 0 0 0 0 0 "repo-unresolvable"
      return 0
    fi

    # --- Step 2: enumerate ---------------------------------------------------
    local enum_out="" enum_rc=0
    if [[ -n "${DISPATCH_WAIT_RECHECK_ENUM:-}" ]]; then
      enum_out=$( (cd "$root" && "$DISPATCH_WAIT_RECHECK_ENUM") ) || enum_rc=$?
    else
      enum_out=$( (cd "$root" && node --import tsx/esm \
        "$root/packages/intentionsutil/scripts/list-recheckable-waits.ts" \
        --dir "$root/intentions") ) || enum_rc=$?
    fi
    if (( enum_rc != 0 )); then
      # LOUD, and reported under its OWN status: an enumeration that could not
      # run must never be indistinguishable from a pass that genuinely found
      # nothing due.
      printf 'lib-wait-recheck: wait enumeration FAILED (rc=%s, root=%s) — no wait was re-checked this pass; this is NOT "no waits are due"\n' \
        "$enum_rc" "$root" >&2
      _wait_recheck_summary 0 0 0 0 0 0 0 0 0 "enumeration-failed"
      return 0
    fi

    local release_cmd="${DISPATCH_WAIT_RECHECK_RELEASE:-$root/packages/intentionsutil/scripts/release-wait}"
    local park_cmd="${DISPATCH_WAIT_RECHECK_PARK:-$root/packages/intentionsutil/scripts/park-node}"

    # --- Step 3: the sweep state, then the per-candidate ladder --------------
    # Best-effort: an unreadable or corrupt state file yields the empty state,
    # i.e. start at candidate 0 with nothing backing off.
    _wait_recheck_state_load

    local -a cand_lines=()
    local cand_line
    while IFS= read -r cand_line; do
      # A line with no id in either column is not a candidate (the pre-rotation
      # loop skipped these with the same test, before counting them).
      [[ -n "${cand_line//[[:space:]]/}" ]] || continue
      cand_lines+=("$cand_line")
    done <<<"$enum_out"
    local total=${#cand_lines[@]}

    # Step 4's round-robin: resume at the candidate AFTER the one the previous
    # pass spent its last write attempt on, so the shared cap walks the whole
    # list across ticks instead of re-spending itself on the same prefix. A
    # cursor naming a wait that is no longer enumerated (released, parked, or
    # re-armed into `waiting`) simply starts the pass at 0.
    local start=0 scan_i scan_id
    if [[ -n "$_WAIT_RECHECK_CURSOR_ID" ]] && (( total > 0 )); then
      for (( scan_i = 0; scan_i < total; scan_i++ )); do
        scan_id="${cand_lines[scan_i]%%$'\t'*}"
        if [[ "$scan_id" == "$_WAIT_RECHECK_CURSOR_ID" ]]; then
          start=$(( (scan_i + 1) % total ))
          break
        fi
      done
    fi

    local wait_id source_id attempts until_at cls
    local wt wait_wt claimed_id rc attrs_json reason recommendation
    local writer skips_left fails_now
    local -A seen_ids=()
    local k idx
    for (( k = 0; k < total; k++ )); do
      idx=$(( (start + k) % total ))
      IFS=$'\t' read -r wait_id source_id attempts until_at cls <<<"${cand_lines[idx]}"
      [[ -n "$wait_id" || -n "$source_id" ]] || continue
      candidates=$(( candidates + 1 ))

      # (a) Unsafe id. Counted only as a candidate — no other bucket claims it.
      if ! _wait_recheck_id_is_safe "$wait_id" || ! _wait_recheck_id_is_safe "$source_id"; then
        printf 'lib-wait-recheck: unsafe-id (%s / %s)\n' "$wait_id" "$source_id" >&2
        _wait_recheck_log_decision "$wait_id" "$source_id" "$attempts" "$until_at" "$cls" "unsafe-id"
        continue
      fi
      # Every id that got past the guard is still live in the store, so its
      # state entry (if any) is worth keeping; anything else is pruned at save.
      seen_ids["$wait_id"]=1

      # (b) A malformed WAIT: reported LOUDLY for visibility, never acted on.
      # The enumerator refuses to guess a `wait_until` or a `wait_attempts`, so
      # this line is the only place a corrupted one becomes visible.
      if [[ "$cls" == "malformed" ]]; then
        printf 'lib-wait-recheck: skip-malformed (%s carries an unparseable wait_until or a corrupt wait_attempts and is never acted on; a human must repair the node)\n' \
          "$wait_id" >&2
        malformed=$(( malformed + 1 ))
        _wait_recheck_log_decision "$wait_id" "$source_id" "$attempts" "$until_at" "$cls" "skip-malformed"
        continue
      fi

      # (c) Not yet due: nothing to do, nothing wrong.
      if [[ "$cls" == "waiting" ]]; then
        printf 'lib-wait-recheck: observing (until=%s) for %s\n' "$until_at" "$wait_id" >&2
        observing=$(( observing + 1 ))
        _wait_recheck_log_decision "$wait_id" "$source_id" "$attempts" "$until_at" "$cls" "observing"
        continue
      fi

      wt="$root/.claude/worktrees/$source_id"
      wait_wt="$root/.claude/worktrees/$wait_id"

      # (d) Claimed — EITHER node. A release hands the SOURCE back to the fleet;
      # a cap-park writes office_hours on the WAIT. Neither may happen under a
      # session that holds the node.
      claimed_id=""
      if reservation_exists "$source_id" 2>/dev/null || worktree_has_live_session "$wt"; then
        claimed_id="$source_id"
      elif reservation_exists "$wait_id" 2>/dev/null || worktree_has_live_session "$wait_wt"; then
        claimed_id="$wait_id"
      fi
      if [[ -n "$claimed_id" ]]; then
        printf 'lib-wait-recheck: observing-claimed (%s has a live session or reservation)\n' "$claimed_id" >&2
        observing=$(( observing + 1 ))
        _wait_recheck_log_decision "$wait_id" "$source_id" "$attempts" "$until_at" "$cls" "observing-claimed"
        continue
      fi

      # (e) The per-node failure backoff, checked BEFORE the cap so a wait that
      # is backing off costs no slot at all. Without this a wait whose writer
      # refuses every time re-spends a slot every tick forever, and (with the
      # cap's default of 3) three such waits starve every other wait in the
      # store — quietly, since the summary still says status=ok.
      skips_left="${_WAIT_RECHECK_SKIPS[$wait_id]:-0}"
      if (( skips_left > 0 )); then
        _WAIT_RECHECK_SKIPS["$wait_id"]=$(( skips_left - 1 ))
        printf 'lib-wait-recheck: backoff-skipped (%s has failed %s consecutive write attempts; skipping it for %s more pass(es) so it cannot monopolize the per-pass cap)\n' \
          "$wait_id" "${_WAIT_RECHECK_FAILS[$wait_id]:-0}" "$(( skips_left - 1 ))" >&2
        backoff=$(( backoff + 1 ))
        _wait_recheck_log_decision "$wait_id" "$source_id" "$attempts" "$until_at" "$cls" "backoff-skipped"
        continue
      fi

      # (f) The per-pass cap, checked BEFORE the attempt is spent. ONE shared
      # counter across both writers: they contend for the same landing lock.
      if (( resolve_attempts >= max )); then
        printf 'lib-wait-recheck: deferred (cap=%s) for %s\n' "$max" "$wait_id" >&2
        deferred=$(( deferred + 1 ))
        _wait_recheck_log_decision "$wait_id" "$source_id" "$attempts" "$until_at" "$cls" "deferred"
        continue
      fi

      # (g) The write. Both classes pick their writer here and then share ONE
      # outcome block below, so the success bookkeeping (clear the failure
      # streak) and the failure bookkeeping (arm the backoff, escalate at the
      # threshold) cannot drift apart between them.
      writer=""
      rc=0
      if [[ "$cls" == "capped" ]]; then
        # The park strings come from the node itself. An unreadable or empty
        # pair KEEPS the WAIT: parking with an invented reason would hand the
        # author an escalation that names nothing. No landing-lock push was
        # spent, so this path does NOT consume the cap.
        if ! attrs_json=$(_wait_recheck_park_attrs "$root" "$wait_id"); then
          printf 'lib-wait-recheck: resolve-failed (rc=attrs-unreadable) — could not read attributes.wait_reason/wait_recommendation; keeping the wait armed, retrying next tick (%s)\n' \
            "$wait_id" >&2
          failed=$(( failed + 1 ))
          _wait_recheck_log_decision "$wait_id" "$source_id" "$attempts" "$until_at" "$cls" "resolve-failed"
          continue
        fi
        # `jq <<<`, never `echo | jq` — see .claude/rules/shell-json.md.
        reason=$(jq -r '.wait_reason // ""' <<<"$attrs_json" 2>/dev/null) || reason=""
        recommendation=$(jq -r '.wait_recommendation // ""' <<<"$attrs_json" 2>/dev/null) || recommendation=""
        if [[ -z "$reason" || -z "$recommendation" ]]; then
          printf 'lib-wait-recheck: resolve-failed (rc=attrs-empty) — attributes.wait_reason/wait_recommendation are missing or empty; keeping the wait armed, retrying next tick (%s)\n' \
            "$wait_id" >&2
          failed=$(( failed + 1 ))
          _wait_recheck_log_decision "$wait_id" "$source_id" "$attempts" "$until_at" "$cls" "resolve-failed"
          continue
        fi

        writer="park-node"
        resolve_attempts=$(( resolve_attempts + 1 ))
        # The round-robin cursor advances to whatever the last SPENT attempt of
        # this pass landed on, so the next pass resumes after it.
        _WAIT_RECHECK_CURSOR_ID="$wait_id"
        # The WAIT's OWN id, never the source's: the thing that exhausted its
        # attempts is the wait, and parking the source would freeze work the
        # author never escalated.
        "$park_cmd" "$wait_id" "$reason" "$recommendation" >/dev/null || rc=$?
      else
        # class == `due`. release-wait re-asserts every release precondition
        # against FRESH origin/main content and refuses a stale classification,
        # so this call is never forced and a non-zero exit is never fatal.
        writer="release-wait"
        resolve_attempts=$(( resolve_attempts + 1 ))
        _WAIT_RECHECK_CURSOR_ID="$wait_id"
        "$release_cmd" "$wait_id" >/dev/null || rc=$?
      fi

      # The shared outcome block.
      if (( rc == 0 )); then
        _wait_recheck_clear_failure "$wait_id"
        if [[ "$writer" == "park-node" ]]; then
          printf 'lib-wait-recheck: capped-parked %s (re-arm attempt cap reached after %s attempts; escalated to office hours)\n' \
            "$wait_id" "$attempts" >&2
          capped=$(( capped + 1 ))
          _wait_recheck_log_decision "$wait_id" "$source_id" "$attempts" "$until_at" "$cls" "capped-parked"
        else
          printf 'lib-wait-recheck: released %s (unblocked %s)\n' "$wait_id" "$source_id" >&2
          released=$(( released + 1 ))
          _wait_recheck_log_decision "$wait_id" "$source_id" "$attempts" "$until_at" "$cls" "released"
        fi
        continue
      fi

      # Never fatal, never a hand-edit: keep the wait armed and let a later tick
      # retry. Both writers are idempotent, so a retry is free.
      printf 'lib-wait-recheck: resolve-failed (rc=%s) — keeping the wait armed, retrying next tick (%s)\n' \
        "$rc" "$wait_id" >&2
      failed=$(( failed + 1 ))
      _wait_recheck_log_decision "$wait_id" "$source_id" "$attempts" "$until_at" "$cls" "resolve-failed"

      # …but "retry" is not "retry every tick forever on the same slot": arm the
      # doubling backoff, and at the threshold stop retrying altogether and hand
      # the wait to the author.
      _wait_recheck_note_failure "$wait_id" "$backoff_max"
      fails_now="${_WAIT_RECHECK_FAILS[$wait_id]:-0}"
      if (( fails_now >= escalate_at )); then
        resolve_attempts=$(( resolve_attempts + 1 ))
        if _wait_recheck_escalate "$root" "$park_cmd" "$wait_id" "$fails_now" "$writer"; then
          printf 'lib-wait-recheck: escalated %s to office hours (%s consecutive failed %s attempts; the sweep has stopped retrying it)\n' \
            "$wait_id" "$fails_now" "$writer" >&2
          escalated=$(( escalated + 1 ))
          _wait_recheck_clear_failure "$wait_id"
          _wait_recheck_log_decision "$wait_id" "$source_id" "$attempts" "$until_at" "$cls" "escalate-parked"
        else
          printf 'lib-wait-recheck: escalate-failed (%s) — %s consecutive failed %s attempts could not be escalated to office hours; keeping the wait armed and backing off\n' \
            "$wait_id" "$fails_now" "$writer" >&2
          _wait_recheck_log_decision "$wait_id" "$source_id" "$attempts" "$until_at" "$cls" "escalate-failed"
        fi
      fi
    done

    # Prune entries for waits this pass did not enumerate (released, parked, or
    # re-armed): their failure streak is over and the file must not grow without
    # bound. Then persist — best-effort, never fatal.
    local state_id
    if (( ${#_WAIT_RECHECK_FAILS[@]} > 0 )); then
      for state_id in "${!_WAIT_RECHECK_FAILS[@]}"; do
        [[ -n "${seen_ids[$state_id]:-}" ]] || _wait_recheck_clear_failure "$state_id"
      done
    fi
    _wait_recheck_state_save

    _wait_recheck_summary "$candidates" "$released" "$capped" "$observing" "$malformed" "$failed" "$deferred" "$backoff" "$escalated" "ok"
    return 0
  }

fi
