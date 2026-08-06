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
# again. This sweep is what escapes both states.
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
#       observing=N malformed=N failed=N deferred=N
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
#     e. THE PER-PASS CAP, checked BEFORE acting on a `due` or `capped`
#        candidate: at `DISPATCH_WAIT_RECHECK_MAX` write attempts already spent
#        this invocation → `deferred (cap=<n>)`, skip. Both `release-wait` and
#        `park-node` push to `main` through graph-commit's landing lock, so an
#        unbounded batch would serialize N lock-contended pushes inside one
#        tick. Excess candidates are deferred to the next pass, which is free —
#        the sweep is idempotent and runs every tick.
#     f. THE WRITE.
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
#        required non-empty by validate-graph rule 21) so the author reads the
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
  #                       <malformed> <failed> <deferred> <status>
  # The single summary line. Called on EVERY return path of the sweep — the
  # early repo-unresolvable and enumeration-failed exits included — so exactly
  # one such line appears per invocation, never zero and never two.
  _wait_recheck_summary() {
    printf 'lib-wait-recheck: sweep complete (candidates=%s released=%s capped=%s observing=%s malformed=%s failed=%s deferred=%s status=%s)\n' \
      "$1" "$2" "$3" "$4" "$5" "$6" "$7" "$8" >&2
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

  # wait_recheck_sweep — see the header comment for the full contract and rule
  # ladder. ALWAYS returns 0.
  wait_recheck_sweep() {
    local candidates=0 released=0 capped=0 observing=0 malformed=0 failed=0 deferred=0
    # resolve_attempts counts only the attempts the cap governs, across BOTH
    # writers. It is deliberately NOT `released + capped`: a failed write
    # consumed a landing-lock push just as a successful one did, so it must
    # count against the cap.
    local resolve_attempts=0

    local max="${DISPATCH_WAIT_RECHECK_MAX:-3}"
    [[ "$max" =~ ^[0-9]+$ ]] || max=3

    # --- Step 1: the repo root ----------------------------------------------
    local root="${DISPATCH_WAIT_RECHECK_REPO_ROOT:-}"
    if [[ -z "$root" ]]; then
      root=$(resolve_main_worktree 2>/dev/null) || root=""
    fi
    if [[ -z "$root" ]]; then
      printf 'lib-wait-recheck: repo root unresolvable (DISPATCH_WAIT_RECHECK_REPO_ROOT unset and no worktree has main checked out); re-checking nothing this pass\n' >&2
      _wait_recheck_summary 0 0 0 0 0 0 0 "repo-unresolvable"
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
      _wait_recheck_summary 0 0 0 0 0 0 0 "enumeration-failed"
      return 0
    fi

    local release_cmd="${DISPATCH_WAIT_RECHECK_RELEASE:-$root/packages/intentionsutil/scripts/release-wait}"
    local park_cmd="${DISPATCH_WAIT_RECHECK_PARK:-$root/packages/intentionsutil/scripts/park-node}"

    # --- Step 3: the per-candidate ladder ------------------------------------
    local wait_id source_id attempts until_at cls
    local wt wait_wt claimed_id rc attrs_json reason recommendation
    while IFS=$'\t' read -r wait_id source_id attempts until_at cls; do
      [[ -n "$wait_id" || -n "$source_id" ]] || continue
      candidates=$(( candidates + 1 ))

      # (a) Unsafe id. Counted only as a candidate — no other bucket claims it.
      if ! _wait_recheck_id_is_safe "$wait_id" || ! _wait_recheck_id_is_safe "$source_id"; then
        printf 'lib-wait-recheck: unsafe-id (%s / %s)\n' "$wait_id" "$source_id" >&2
        _wait_recheck_log_decision "$wait_id" "$source_id" "$attempts" "$until_at" "$cls" "unsafe-id"
        continue
      fi

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

      # (e) The per-pass cap, checked BEFORE the attempt is spent. ONE shared
      # counter across both writers: they contend for the same landing lock.
      if (( resolve_attempts >= max )); then
        printf 'lib-wait-recheck: deferred (cap=%s) for %s\n' "$max" "$wait_id" >&2
        deferred=$(( deferred + 1 ))
        _wait_recheck_log_decision "$wait_id" "$source_id" "$attempts" "$until_at" "$cls" "deferred"
        continue
      fi

      # (f) The write.
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

        resolve_attempts=$(( resolve_attempts + 1 ))
        rc=0
        # The WAIT's OWN id, never the source's: the thing that exhausted its
        # attempts is the wait, and parking the source would freeze work the
        # author never escalated.
        "$park_cmd" "$wait_id" "$reason" "$recommendation" >/dev/null || rc=$?
        if (( rc == 0 )); then
          printf 'lib-wait-recheck: capped-parked %s (re-arm attempt cap reached after %s attempts; escalated to office hours)\n' \
            "$wait_id" "$attempts" >&2
          capped=$(( capped + 1 ))
          _wait_recheck_log_decision "$wait_id" "$source_id" "$attempts" "$until_at" "$cls" "capped-parked"
        else
          printf 'lib-wait-recheck: resolve-failed (rc=%s) — keeping the wait armed, retrying next tick (%s)\n' \
            "$rc" "$wait_id" >&2
          failed=$(( failed + 1 ))
          _wait_recheck_log_decision "$wait_id" "$source_id" "$attempts" "$until_at" "$cls" "resolve-failed"
        fi
        continue
      fi

      # class == `due`. release-wait re-asserts every release precondition
      # against FRESH origin/main content and refuses a stale classification, so
      # this call is never forced and a non-zero exit is never fatal.
      resolve_attempts=$(( resolve_attempts + 1 ))
      rc=0
      "$release_cmd" "$wait_id" >/dev/null || rc=$?
      if (( rc == 0 )); then
        printf 'lib-wait-recheck: released %s (unblocked %s)\n' "$wait_id" "$source_id" >&2
        released=$(( released + 1 ))
        _wait_recheck_log_decision "$wait_id" "$source_id" "$attempts" "$until_at" "$cls" "released"
      else
        # Never fatal, never a park, never a hand-edit: keep the wait armed and
        # let the next tick retry. release-wait is idempotent, so a retry is
        # free.
        printf 'lib-wait-recheck: resolve-failed (rc=%s) — keeping the wait armed, retrying next tick (%s)\n' \
          "$rc" "$wait_id" >&2
        failed=$(( failed + 1 ))
        _wait_recheck_log_decision "$wait_id" "$source_id" "$attempts" "$until_at" "$cls" "resolve-failed"
      fi
    done <<<"$enum_out"

    _wait_recheck_summary "$candidates" "$released" "$capped" "$observing" "$malformed" "$failed" "$deferred" "ok"
    return 0
  }

fi
