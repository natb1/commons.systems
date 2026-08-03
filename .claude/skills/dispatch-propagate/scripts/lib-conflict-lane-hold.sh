#!/usr/bin/env bash
# lib-conflict-lane-hold.sh — the stuck-conflict-lane detection sweep: turns a
# /dispatch-conflict Lane 3 session that died without declaring a terminal
# disposition into a tracked, human-visible hold.
#
# The failure this closes: a node's branch does not merge clean against
# origin/main (provision exit 11), so dispatch-graph-execute kicks a Lane 3
# `/dispatch-conflict <id>` session to resolve it and drops a
# `.claude/worktrees/<id>.conflict-lane` sidecar marker recording the episode.
# Lane 3 is spawned as a graph-native NODE WORKER (`--name <id>`), so
# dispatch-stop.sh hands it to `dispatch-self-close --node <id>`, which reaps the
# job ONLY on a `$CLAUDE_JOB_DIR/node-terminal` marker naming that node. When the
# session dies WITHOUT writing that marker — a crash, an API error, an exhausted
# context — nothing ever reaps it: the job stays HELD in the daemon's registry
# forever, `worktree_has_live_session` reports the worktree permanently occupied
# (no timeout, by design), and the node is silently unselectable forever with
# NOTHING recorded in the graph. The conflict is unresolved and no autonomous
# path will ever retry it.
#
# This sweep is the detection half. It periodically re-checks each
# `.conflict-lane` marker against the `--all` session registry and, when the
# lane's session is DEFINITELY terminal-but-unreaped and has been idle past a
# grace, raises a tracked HOLD via `hold-node --kind provision-conflict`. The
# hold is a small born-parked hold tactic plus a `blocked_by` edge from the
# source — the source's own `office_hours` is NEVER written here (doctrine:
# a mechanical retry state is not "no autonomous path exists").
#
# It never reaps a session itself. `claude rm` is the human's act — it deletes
# the session AND may strand work — so the hold's recommendation names it and
# this sweep never runs it.
#
# Usage: source this file, then call:
#   conflict_lane_hold_sweep
#
# conflict_lane_hold_sweep
#   No arguments. Containment/observability only — it is NEVER a gate, so it
#   ALWAYS returns 0, on every path including an unresolvable main worktree, an
#   unqueryable daemon, an unreadable transcript, and a failed `hold-node`.
#   Every disposition is one greppable stderr line per node per pass, and the
#   sweep ends with EXACTLY ONE summary line.
#     return 0 — ALWAYS.
#
#   Step 1 — resolve the sidecar dir: `<resolve_main_worktree>/.claude/worktrees`
#   (the SAME resolver dispatch-graph-execute uses, so producer and sweep agree
#   on the root byte-for-byte), or DISPATCH_CONFLICT_LANE_ROOT verbatim when set.
#
#   Step 2 — enumerate `*.conflict-lane` files there (dotfiles and `.tmp*`
#   skipped, exactly as reservation_sweep does). ZERO candidates emits the
#   summary and returns WITHOUT ANY DAEMON QUERY: the common case must cost
#   nothing, since this runs on every tick.
#
#   Step 3 — per candidate, this rule ladder IN THIS EXACT ORDER; each branch
#   logs one line and moves to the next candidate:
#     a. marker basename (minus the suffix) fails the node-id regex →
#        `unsafe-id`, keep the file, next. It would otherwise become a path
#        component and a `hold-node` argument.
#     b. `claude_sessions_with_name_all <id>` returns non-zero → UNKNOWN →
#        `daemon unqueryable; observing <id>`, next. UNKNOWN NEVER escalates and
#        NEVER garbage-collects.
#     c. zero registry rows → the lane's session was reaped (resolved normally,
#        or already `claude rm`'d). GC the marker, but ONLY once the marker's own
#        age has passed the grace: a younger marker with no row yet is the
#        spawn/registration lag window, and dropping it there would lose the
#        episode.
#     d. any row reporting `live` or `unknown` → `observing`, next. The lane is
#        (or may be) still working.
#     e. all rows `stopped` → candidate; the NEWEST such sid (registry order,
#        last wins) is the reported holder.
#     f. transcript idle time under the grace → `observing`, next. An
#        UNMEASURABLE idle (no transcript, unreadable mtime) is UNKNOWN → keep:
#        never escalate without positive evidence of staleness.
#     g. the hold cap for this pass is spent → `deferring`, keep, next.
#     h. otherwise HOLD via `hold-node <id> --kind provision-conflict`. On exit 0
#        the marker is removed (one hold per episode); on ANY non-zero exit the
#        marker is KEPT and the next pass retries. A failed hold is never fatal.
#     i. every candidate that reached (h) — held OR hold-failed — appends one
#        best-effort JSONL decision record.
#
#   The hold reuses the EXISTING `provision-conflict` kind (the same kind
#   dispatch-graph-execute's exit-11 strike-cap backstop raises); no new hold
#   kind is introduced, and the hold id remains a valid /dispatch-conflict Lane 3
#   entry point for the human draining it.
#
# Environment overrides (all optional; each integer-valued one is
# integer-guarded, falling back to its default on a malformed value):
#   DISPATCH_CONFLICT_LANE_ROOT          Sidecar directory. When set it is used
#                                        VERBATIM (no main-worktree resolution).
#                                        Default: <main-worktree>/.claude/worktrees.
#   DISPATCH_CONFLICT_LANE_NOW_EPOCH     Pinned clock (epoch seconds) for the
#                                        marker-age and idle math.
#                                        Default: `date -u +%s`.
#   DISPATCH_CONFLICT_LANE_GRACE_S       Idle/age grace, seconds. Default: 1800.
#   DISPATCH_CONFLICT_LANE_HOLD_MAX      Maximum holds per invocation. Default: 3.
#                                        `hold-node` pushes to main through
#                                        graph-commit's landing lock, so an
#                                        unbounded batch would serialize N pushes
#                                        inside one tick; the excess is deferred.
#   DISPATCH_CONFLICT_LANE_PROJECTS_ROOT Transcript store root (mirrors
#                                        DISPATCH_RECLAIM_PROJECTS_ROOT).
#                                        Default: $HOME/.claude/projects.
#   DISPATCH_CONFLICT_LANE_HOLD_NODE     hold-node path. Default:
#                                        <main-worktree>/packages/intentionsutil/
#                                        scripts/hold-node. It MUST be the copy
#                                        under the main worktree: hold-node
#                                        derives its own REPO_ROOT from its
#                                        script path.
# Respected via the libraries this file sources, NOT redefined here:
#   DISPATCH_GRAPH_MAIN_WORKTREE      lib-graph-worktree.sh — main-worktree override.
#   CLAUDE_AGENTS_CMD                 lib-claude-agents.sh — replaces the
#                                     `claude` invocation (testable, no daemon).
#   DISPATCH_DECISION_LOG_DIR / _FILE lib-decision-log.sh — the JSONL sink.
#
# Sandbox: the liveness queries reach the local Claude daemon over a Unix
# socket, so callers must run this with `dangerouslyDisableSandbox: true` — see
# `.claude/rules/sandbox.md`. A sandboxed call yields `[]`, a definite "no
# sessions", which would GC markers rather than escalate them.
#
# Safe to source multiple times. Does NOT use set -e (must return, not exit).
#
# Side effect: sourcing this file once sets `-u` and `-o pipefail` in the caller
# shell (via its own load-guard, and transitively via the siblings below).

# Source siblings via BASH_SOURCE dirname, matching lib-standdown-recheck.sh.
# lib-graph-worktree.sh is plain function definitions; lib-claude-agents.sh is
# load-guarded. lib-decision-log.sh is sourced non-fatally — its log is a
# best-effort observability sink, exactly as dispatch-select-tick sources it.
_lclh_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib-claude-agents.sh
source "$_lclh_dir/lib-claude-agents.sh"
# shellcheck source=lib-graph-worktree.sh
source "$_lclh_dir/lib-graph-worktree.sh"
# shellcheck source=/dev/null
source "$_lclh_dir/lib-decision-log.sh" 2>/dev/null || true

if [[ -z "${_LIB_CONFLICT_LANE_HOLD_LOADED:-}" ]]; then
  _LIB_CONFLICT_LANE_HOLD_LOADED=1

  set -uo pipefail

  # _conflict_lane_idle_s <sid> <now> <projects-root> — print the session's
  # transcript idle time in seconds. The transcript lives at
  # <projects-root>/<project>/<sid>.jsonl — keyed on the globally-unique session
  # id, so the project-dir slug (a mangling of the session's cwd) never has to be
  # reconstructed. Takes the NEWEST mtime across matches. No match, or an
  # unreadable mtime, is UNKNOWN: return 1 with no output, which the caller
  # treats as "keep, do not escalate". Shape copied from
  # lib-standdown-recheck.sh's _standdown_session_idle_s.
  _conflict_lane_idle_s() {
    local sid="${1:-}" now="${2:-}" projects_root="${3:-}"
    [[ -n "$sid" && -n "$projects_root" ]] || return 1
    # The sid feeds a `find -name` glob; validate its shape at this edge (input
    # validation at a system boundary).
    [[ "$sid" =~ ^[0-9a-fA-F-]+$ ]] || return 1
    local matches transcript best="" cur
    matches=$(find "$projects_root" -mindepth 2 -maxdepth 2 -name "${sid}.jsonl" 2>/dev/null)
    [[ -n "$matches" ]] || return 1
    while IFS= read -r transcript; do
      [[ -n "$transcript" ]] || continue
      cur=$(stat -c %Y "$transcript" 2>/dev/null) || continue
      [[ "$cur" =~ ^[0-9]+$ ]] || continue
      if [[ -z "$best" ]] || (( cur > best )); then
        best="$cur"
      fi
    done <<<"$matches"
    [[ -n "$best" ]] || return 1
    printf '%s\n' $(( now - best ))
    return 0
  }

  # _conflict_lane_log_decision <node> <session> <state> <idle> <disposition> —
  # append one best-effort JSONL decision record. Mirrors
  # lib-standdown-recheck.sh's _standdown_log_decision and dispatch-select-tick's
  # _dlog_select_emit: build with `jq -c -n`, hand to `decision_log_append`
  # behind a `command -v` guard, never fail the caller.
  _conflict_lane_log_decision() {
    local node="$1" session="$2" state="$3" idle="$4" disposition="$5"
    local json
    json=$(jq -c -n \
      --arg ts          "$(date -u +%FT%TZ)" \
      --arg site        "conflict-lane-hold" \
      --arg node        "$node" \
      --arg session     "$session" \
      --arg state       "$state" \
      --arg idle        "$idle" \
      --arg disposition "$disposition" \
      '
      {
        ts:           $ts,
        site:         $site,
        node:         $node,
        session:      $session,
        state:        $state,
        idle_seconds: (try ($idle | tonumber) catch null),
        disposition:  $disposition
      }' 2>/dev/null) || return 0
    command -v decision_log_append >/dev/null 2>&1 && decision_log_append "$json" || true
    return 0
  }

  # conflict_lane_hold_sweep — see the header comment for the full rule ladder
  # and the fail-safe posture. ALWAYS returns 0.
  conflict_lane_hold_sweep() {
    local markers=0 held_count=0 observing=0 cleared=0 deferred=0

    # --- tunables, computed ONCE ---------------------------------------------
    local now
    if [[ "${DISPATCH_CONFLICT_LANE_NOW_EPOCH:-}" =~ ^[0-9]+$ ]]; then
      now="$DISPATCH_CONFLICT_LANE_NOW_EPOCH"
    else
      now=$(date -u +%s)
    fi
    local grace="${DISPATCH_CONFLICT_LANE_GRACE_S:-1800}"
    [[ "$grace" =~ ^[0-9]+$ ]] || grace=1800
    local hold_max="${DISPATCH_CONFLICT_LANE_HOLD_MAX:-3}"
    [[ "$hold_max" =~ ^[0-9]+$ ]] || hold_max=3
    local projects_root="${DISPATCH_CONFLICT_LANE_PROJECTS_ROOT:-$HOME/.claude/projects}"

    # --- Step 1: the sidecar dir ---------------------------------------------
    # resolve_main_worktree is the resolver dispatch-graph-execute's PROJECT_ROOT
    # comes from, so the producer's marker path and this consumer's scan path are
    # the same bytes. Its `git worktree list` stderr is suppressed: an
    # unresolvable root is reported by this file's own line, not git's.
    local main_wt=""
    main_wt=$(resolve_main_worktree 2>/dev/null) || main_wt=""

    local dir=""
    if [[ -n "${DISPATCH_CONFLICT_LANE_ROOT:-}" ]]; then
      dir="$DISPATCH_CONFLICT_LANE_ROOT"
    elif [[ -n "$main_wt" ]]; then
      dir="$main_wt/.claude/worktrees"
    else
      printf 'lib-conflict-lane-hold: main worktree unresolvable and DISPATCH_CONFLICT_LANE_ROOT unset; escalating nothing\n' >&2
      printf 'lib-conflict-lane-hold: swept %s marker(s): %s held, %s observing, %s cleared, %s deferred\n' \
        "$markers" "$held_count" "$observing" "$cleared" "$deferred" >&2
      return 0
    fi

    local hold_node="${DISPATCH_CONFLICT_LANE_HOLD_NODE:-$main_wt/packages/intentionsutil/scripts/hold-node}"

    # --- Step 2: enumerate candidates ----------------------------------------
    # Collected BEFORE any daemon query so the zero-marker case — the common one,
    # on every tick — costs nothing.
    local candidates=() f bn
    if [[ -d "$dir" ]]; then
      local had_nullglob=0
      shopt -q nullglob && had_nullglob=1
      shopt -s nullglob
      for f in "$dir"/*.conflict-lane; do
        # Regular files directly in the dir only. The default glob already
        # excludes dot-prefixed in-flight tempfiles; the explicit `.tmp` test
        # covers any non-dot variant (reservation_sweep's convention).
        [[ -f "$f" ]] || continue
        bn=$(basename "$f")
        case "$bn" in .*|*.tmp*) continue ;; esac
        candidates+=("$f")
      done
      (( had_nullglob )) || shopt -u nullglob
    fi

    if (( ${#candidates[@]} == 0 )); then
      printf 'lib-conflict-lane-hold: swept %s marker(s): %s held, %s observing, %s cleared, %s deferred\n' \
        "$markers" "$held_count" "$observing" "$cleared" "$deferred" >&2
      return 0
    fi

    # --- Step 3: the rule ladder, per candidate -------------------------------
    local id rows line rest sid state
    for f in "${candidates[@]}"; do
      markers=$(( markers + 1 ))
      bn=$(basename "$f")
      id="${bn%.conflict-lane}"

      # (a) The id becomes a `hold-node` argument and a path component below, so
      # validate its shape at this edge with the SAME node-id regex
      # dispatch-graph-execute applies before provisioning. The marker is KEPT: a
      # human should see it.
      if [[ ! "$id" =~ ^[a-z][a-z0-9]*(-[a-z0-9]+)*$ ]]; then
        printf 'lib-conflict-lane-hold: unsafe-id %s (marker name is not a valid node id); keeping marker, taking no action\n' "$id" >&2
        continue
      fi

      # (b) The REGISTERED (`--all`) view for this name. A stopped-but-not-`claude
      # rm`'d session is invisible to the default active-only listing, and that is
      # precisely the session this sweep exists to find. Non-zero is UNKNOWN.
      if ! rows=$(claude_sessions_with_name_all "$id"); then
        observing=$(( observing + 1 ))
        printf 'lib-conflict-lane-hold: daemon unqueryable; observing %s (taking no action this pass)\n' "$id" >&2
        continue
      fi

      # Split the TSV BY HAND. `IFS=$'\t' read -r sid state ...` cannot be used:
      # TAB is IFS whitespace, so bash collapses a RUN of tabs into one delimiter
      # and an empty middle column (the daemon reports `state: null` for some
      # rows, which `@tsv` renders empty) would shift every field left.
      local sids=() row_states=()
      if [[ -n "$rows" ]]; then
        while IFS= read -r line; do
          [[ -n "$line" ]] || continue
          sid="${line%%$'\t'*}"
          rest="${line#*$'\t'}"
          state="${rest%%$'\t'*}"
          [[ -n "$sid" ]] || continue
          sids+=("$sid")
          row_states+=("$state")
        done <<<"$rows"
      fi

      # (c) No registry row at all: the lane's session was reaped — it resolved
      # normally, or a human already `claude rm`'d it. GC the marker, but only
      # once its own age has passed the grace: between the spawn and the daemon
      # registering the job there is a window with a marker and no row, and
      # dropping the marker there would lose the episode.
      if (( ${#sids[@]} == 0 )); then
        local spawned age_s=""
        spawned=$(sed -n 's/^spawned=//p' "$f" 2>/dev/null | head -n1)
        if [[ "$spawned" =~ ^[0-9]+$ ]]; then
          age_s=$(( now - spawned ))
        fi
        if [[ -n "$age_s" ]] && (( age_s >= grace )); then
          rm -f "$f" 2>/dev/null || true
          cleared=$(( cleared + 1 ))
          printf 'lib-conflict-lane-hold: cleared %s (no registry row; marker age %ss >= grace %ss — the lane session was reaped)\n' \
            "$id" "$age_s" "$grace" >&2
        else
          observing=$(( observing + 1 ))
          printf 'lib-conflict-lane-hold: observing %s (awaiting registration; no registry row yet, marker age %ss < grace %ss)\n' \
            "$id" "${age_s:-unmeasurable}" "$grace" >&2
        fi
        continue
      fi

      # (d)/(e) Resolve every row's granular liveness. ANY row reporting `live`
      # or `unknown` means the lane may still be working — observe. Only when
      # EVERY row is definitely `stopped` is the episode a candidate, and the
      # NEWEST such sid (registry order, last wins) is the reported holder.
      local i newest_stopped="" newest_state="" nonterminal_sid="" nonterminal_state=""
      for (( i = 0; i < ${#sids[@]}; i++ )); do
        sid="${sids[$i]}"
        claude_session_id_is_live "$sid" >/dev/null 2>&1 || true
        state="$CLAUDE_SESSION_ID_LIVE_STATE"
        case "$state" in
          stopped)
            newest_stopped="$sid"
            newest_state="${row_states[$i]:-$state}"
            ;;
          absent)
            # A row the name query returned that the id query cannot find: a
            # race against a concurrent `claude rm`. Not a stopped holder, and
            # not evidence of life either — it simply contributes nothing.
            :
            ;;
          *)
            # live | unknown — fail safe.
            nonterminal_sid="$sid"
            nonterminal_state="$state"
            ;;
        esac
      done

      if [[ -n "$nonterminal_sid" ]]; then
        observing=$(( observing + 1 ))
        printf 'lib-conflict-lane-hold: observing %s (session %s state=%s)\n' \
          "$id" "$nonterminal_sid" "$nonterminal_state" >&2
        continue
      fi

      if [[ -z "$newest_stopped" ]]; then
        # Every row resolved `absent` — no holder to name, nothing to escalate.
        observing=$(( observing + 1 ))
        printf 'lib-conflict-lane-hold: observing %s (registry rows resolved absent; no stopped holder to report)\n' "$id" >&2
        continue
      fi

      sid="$newest_stopped"
      state="${newest_state:-stopped}"

      # (f) Idle grace. An UNMEASURABLE idle is UNKNOWN → keep. This sweep never
      # escalates without POSITIVE evidence of staleness.
      local idle
      if ! idle=$(_conflict_lane_idle_s "$sid" "$now" "$projects_root"); then
        observing=$(( observing + 1 ))
        printf 'lib-conflict-lane-hold: keeping %s (transcript unreadable — idle time unmeasurable for session %s)\n' \
          "$id" "$sid" >&2
        continue
      fi
      if (( idle < grace )); then
        observing=$(( observing + 1 ))
        printf 'lib-conflict-lane-hold: observing %s (session %s idle_seconds=%s < grace_seconds=%s)\n' \
          "$id" "$sid" "$idle" "$grace" >&2
        continue
      fi

      # (g) Cap. Excess candidates wait for the next pass rather than serializing
      # N graph-commit landing-lock pushes inside this one.
      if (( held_count >= hold_max )); then
        deferred=$(( deferred + 1 ))
        printf 'lib-conflict-lane-hold: deferring %s (hold cap %s reached this sweep)\n' "$id" "$hold_max" >&2
        continue
      fi

      # (h) The hold. Reason and recommendation are FILES (hold-node's
      # interface), written into a per-candidate tempdir that is removed
      # immediately after the call.
      local tmpd
      if ! tmpd=$(mktemp -d 2>/dev/null); then
        printf 'lib-conflict-lane-hold: hold failed for %s (mktemp -d failed); keeping marker, will retry next tick\n' "$id" >&2
        continue
      fi

      local reason recommendation
      printf -v reason \
        "This tactic's branch did not merge clean (provision exit 11) and the /dispatch-conflict Lane 3 session dispatched to resolve it has stopped without declaring a terminal disposition: 'claude agents --json --all' reports session %s for '%s' in state %s, its transcript has had no activity for %ss, and no node-terminal marker was written — so dispatch-self-close held the job instead of reaping it. A registered session keeps claiming its node by design, so '%s' is skipped by every selection tick until that job is removed by hand: the conflict is unresolved and nothing autonomous will retry it." \
        "$sid" "$id" "$state" "$idle" "$id"
      printf -v recommendation \
        "First release the node: 'claude rm %s'. A stopped-but-not-removed session keeps blocking its node by design and nothing autonomous reaps it. If the session's transcript holds work worth keeping, attach it first ('claude attach %s'). Then resolve the conflict: run '/dispatch-conflict %s' by hand (Lane 3 reproduces and resolves the merge on the node's own branch; it merges origin/%s before reproducing the origin/main merge, which covers both causes of exit 11), or resolve it directly in .claude/worktrees/%s and push the branch. Then resolve THIS HOLD TACTIC to 'phase: done' and prune it — clearing 'office_hours' alone does not unblock the source. 'resolve-hold %s --kind provision-conflict' does the resolve and the source's blocked_by clear in one landed write." \
        "$sid" "$sid" "$id" "$id" "$id" "$id"

      printf '%s\n' "$reason" > "$tmpd/reason.txt"
      printf '%s\n' "$recommendation" > "$tmpd/recommendation.txt"

      local rc=0
      "$hold_node" "$id" --kind provision-conflict \
        --reason-file "$tmpd/reason.txt" \
        --recommendation-file "$tmpd/recommendation.txt" >/dev/null || rc=$?
      rm -rf "$tmpd" 2>/dev/null || true

      if (( rc == 0 )); then
        # One hold per episode: the marker is the episode record, and the hold
        # now carries it.
        rm -f "$f" 2>/dev/null || true
        held_count=$(( held_count + 1 ))
        printf 'lib-conflict-lane-hold: held %s (stuck conflict lane, idle %ss, session %s)\n' "$id" "$idle" "$sid" >&2
        # (i)
        _conflict_lane_log_decision "$id" "$sid" "$state" "$idle" "held"
      else
        # A hold failure is never fatal to the sweep or the tick: log it, KEEP
        # the marker so the next pass retries, and move on.
        printf 'lib-conflict-lane-hold: hold failed for %s (hold-node exit %s); will retry next tick\n' "$id" "$rc" >&2
        # (i)
        _conflict_lane_log_decision "$id" "$sid" "$state" "$idle" "hold-failed"
      fi
    done

    printf 'lib-conflict-lane-hold: swept %s marker(s): %s held, %s observing, %s cleared, %s deferred\n' \
      "$markers" "$held_count" "$observing" "$cleared" "$deferred" >&2
    return 0
  }

fi
