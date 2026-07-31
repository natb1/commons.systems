#!/usr/bin/env bash
# lib-frozen-session-park.sh — sourceable helper that parks the intention node
# of a worker session frozen at a permission/classifier denial.
#
# The failure this closes: an auto-mode classifier (or a plain permission
# prompt) denies a command mid-session. The Claude Code session goes to
# `state: blocked` and stops making progress — its transcript stops growing —
# but it never reaches the Stop hook, so it cannot park itself, cannot write a
# node-terminal marker, and cannot release the node it holds. No existing fleet
# check detects this shape: `dispatch-sweep` sees a live session (so it will not
# reap the worktree), `reservation_sweep` sees a live session id (so it will not
# reclaim the marker), and the router's concurrency accounting keeps counting
# the node as in-flight. The node is held forever, invisibly.
#
# `frozen_session_sweep` is the detector. Run periodically from `dispatch-tick`,
# it asks `claude_agents_list_blocked_workers` (lib-claude-agents.sh) for the
# machine-wide set of blocked worker sessions, measures each one's transcript
# idle time, and — only for a session idle past a grace period whose name is a
# real graph node that is not already parked — parks that node to `office_hours`
# via `packages/intentionsutil/scripts/park-node`. The park surfaces the freeze
# to a human in the office-hours queue, which is the only place it can actually
# be resolved (someone must answer the pending prompt or stop the session).
#
# Usage: source this file, then call:
#   frozen_session_sweep
#
# frozen_session_sweep
#   No arguments. Bookkeeping only — it must never abort a tick, so it ALWAYS
#   returns 0, on every path including a daemon failure, an unresolvable repo
#   root, and a failed `park-node`. Every disposition is a single greppable
#   stderr line, and the sweep ends with exactly one summary line.
#     return 0 — ALWAYS.
#
#   Fail-safe posture, throughout: the sweep never parks without POSITIVE
#   evidence of staleness. An UNKNOWN daemon, an unreadable transcript, an
#   unmeasurable mtime, or a missing node file all mean "keep", never "park".
#   The only path that parks is: blocked + measured idle >= grace + NO other
#   live session holding the node + a real, unparked node file on origin/main.
#
#   The "no other live session" term is the stand-down interlock. A stood-down
#   LOSER (the duplicate-worker protocol in lib-standdown-recheck.sh) has
#   EXACTLY this candidate's shape: the daemon reports it `status: null` /
#   `state: blocked` while the Stop hook holds it, and — because both sessions
#   in a stand-down register under the same node id as their session name — its
#   name resolves to the very node the WINNER is actively working. The
#   stand-down protocol deliberately has NO age term on that path ("an aged-out
#   declared marker would park a node another session is actively working,
#   which is exactly the interruption the stand-down protocol exists to
#   avoid"), so this sweep must not reintroduce one through the back door. Two
#   independent signals, either sufficient to KEEP: a stand-down marker exists
#   for the node (`standdown_exists`), or two or more live sessions are
#   registered under the node name (`claude_agents_list_duplicate_node_names`,
#   which catches the duplicate even when no marker was ever written).
#
#   One daemon query and at most one `git fetch` per invocation. The fetch is
#   LAZY: it runs only when a candidate has actually aged past the grace, so a
#   sweep with no aged candidate does no network I/O at all.
#
#   Bounded cost, because the sweep runs INLINE on the tick's scheduling path
#   (dispatch-tick calls it before Step 1's dispatch-select-tick). `park-node`
#   pushes to `main` through `graph-commit`, whose landing-lock wait defaults to
#   MAX_PUSH_ATTEMPTS * (CHECK_TIMEOUT_SECONDS + 30) = 1050s, plus required-check
#   polling — roughly half an hour for ONE park under a contended lock. Left
#   unbounded, a sweep could out-run the 15-minute heartbeat and stop the fleet
#   from scheduling anything, every tick, for as long as the contention lasts.
#   Three bounds keep the sweep's worst case small relative to the tick:
#     - each `park-node` call runs under `timeout` (default 120s), and a timeout
#       is treated as any other non-zero rc — logged, then on to the next
#       candidate;
#     - each call gets a short `GRAPH_COMMIT_LOCK_WAIT_SECONDS` (default 60s) so
#       graph-commit gives up on a contended landing lock well inside that
#       timeout instead of waiting out its own 1050s default;
#     - the park cap defaults to 1 (excess candidates are logged as deferred and
#       picked up by the next tick), so the whole sweep's park budget is
#       cap x timeout.
#   None of this makes a park more likely to fail permanently: a park failure is
#   never sticky, and the next tick retries.
#
#   Two provenance checks guard what the sweep actually EXECUTES, because it runs
#   unattended from the headless tick with the sandbox disabled:
#     - the repo root must be a primary checkout on `main`
#       (`assert_primary_checkout_on_main`, lib.sh). A drifted primary checkout
#       (the 2026-07-21 direct-to-main incident, PR #2925) would otherwise have
#       the sweep run an unreviewed branch's `park-node` — a script that fetches,
#       writes, and force-pushes `refs/graph/**` and `main`.
#     - the resolved `park-node` must be an executable regular file whose real
#       directory is `<repo-root>/packages/intentionsutil/scripts`. This is what
#       makes DISPATCH_FROZEN_SESSION_PARK_NODE safe to honour: an inherited
#       environment cannot redirect the call to an arbitrary executable.
#   Either check failing aborts the sweep loudly (still returning 0).
#
# Environment overrides (all optional; each is integer-guarded where numeric,
# falling back to its default on a malformed value):
#   DISPATCH_FROZEN_SESSION_NOW_EPOCH      Test clock (epoch seconds). Default:
#                                          `date -u +%s`.
#   DISPATCH_FROZEN_SESSION_GRACE_S        Transcript idle seconds a blocked
#                                          worker must REACH (the park test is
#                                          `idle >= grace`) before it is parked.
#                                          Default: 900.
#   DISPATCH_FROZEN_SESSION_PARK_MAX       Maximum parks per invocation.
#                                          Default: 1.
#   DISPATCH_FROZEN_SESSION_PARK_TIMEOUT_S Wall-clock seconds a single
#                                          `park-node` call may take before it
#                                          is killed (rc 124, handled as a park
#                                          failure). Default: 120.
#   DISPATCH_FROZEN_SESSION_LOCK_WAIT_S    Exported to each `park-node` call as
#                                          GRAPH_COMMIT_LOCK_WAIT_SECONDS, so
#                                          graph-commit abandons a contended
#                                          landing lock inside the timeout above
#                                          rather than after its own 1050s
#                                          default. Default: 60.
#   DISPATCH_FROZEN_SESSION_PROJECTS_ROOT  Transcript store root. Default:
#                                          $HOME/.claude/projects (mirrors
#                                          DISPATCH_RECLAIM_PROJECTS_ROOT in
#                                          dispatch-reclaim-audit).
#   DISPATCH_FROZEN_SESSION_REPO_ROOT      Repo root for the `git show
#                                          origin/main:` reads. Default:
#                                          resolve_project_root (lib.sh).
#   DISPATCH_FROZEN_SESSION_PARK_NODE      park-node path. Default:
#                                          <repo-root>/packages/intentionsutil/
#                                          scripts/park-node (mirrors
#                                          dispatch-graph-execute's PARK_NODE).
#                                          MUST still resolve inside that
#                                          directory — see the provenance checks
#                                          above; anything else aborts the sweep.
#   CLAUDE_AGENTS_CMD                      Inherited from lib-claude-agents.sh.
#   DISPATCH_STANDDOWN_DIR                 Inherited from lib-standdown-recheck.sh
#                                          (the stand-down ledger this sweep
#                                          reads through `standdown_exists`).
#   DISPATCH_DECISION_LOG_DIR / _FILE      Inherited from lib-decision-log.sh.
#
# Sandbox: the candidate query reaches the local Claude daemon over a Unix
# socket, so callers must run this with `dangerouslyDisableSandbox: true` — see
# `.claude/rules/sandbox.md`. A sandboxed call yields `[]`, which is a definite
# "no blocked workers" and simply parks nothing (fail safe).
#
# Safe to source multiple times. Does NOT use set -e (must return, not exit).
#
# Side effect: sourcing this file once sets `-u` and `-o pipefail` in the caller
# shell (via its own load-guard, and transitively via the siblings below).

# Source siblings via BASH_SOURCE dirname, matching lib-reservation-ledger.sh.
# lib.sh is plain function definitions; lib-claude-agents.sh is load-guarded;
# lib-decision-log.sh is load-guarded and sourced non-fatally (its log is a
# best-effort observability sink — exactly as dispatch-select-tick sources it).
# lib-standdown-recheck.sh is load-guarded too, and supplies `standdown_exists`
# for the stand-down interlock below. No source cycle: that file sources only
# lib.sh, lib-claude-agents.sh, lib-worktree-in-sync.sh and lib-decision-log.sh.
_lfsp_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$_lfsp_dir/lib.sh"
# shellcheck source=lib-claude-agents.sh
source "$_lfsp_dir/lib-claude-agents.sh"
# shellcheck source=lib-standdown-recheck.sh
source "$_lfsp_dir/lib-standdown-recheck.sh"
# shellcheck source=/dev/null
source "$_lfsp_dir/lib-decision-log.sh" 2>/dev/null || true

if [[ -z "${_LIB_FROZEN_SESSION_PARK_LOADED:-}" ]]; then
  _LIB_FROZEN_SESSION_PARK_LOADED=1

  set -uo pipefail

  # _frozen_session_log_decision <node> <session> <idle> <disposition> — append
  # one best-effort JSONL decision record. Mirrors dispatch-select-tick's
  # _dlog_select_emit: build with `jq -c -n`, hand to `decision_log_append`
  # behind a `command -v` guard, never fail the caller.
  _frozen_session_log_decision() {
    local node="$1" session="$2" idle="$3" disposition="$4"
    local json
    json=$(jq -c -n \
      --arg ts          "$(date -u +%FT%TZ)" \
      --arg site        "frozen-session-sweep" \
      --arg node        "$node" \
      --arg session     "$session" \
      --arg state       "blocked" \
      --arg idle        "$idle" \
      --arg disposition "$disposition" \
      '
      def num: if . == "" then null else (tonumber? // null) end;
      {
        ts:           $ts,
        site:         $site,
        node:         $node,
        session:      $session,
        state:        $state,
        idle_seconds: ($idle | num),
        disposition:  $disposition
      }' 2>/dev/null) || return 0
    command -v decision_log_append >/dev/null 2>&1 && decision_log_append "$json" || true
    return 0
  }

  # frozen_session_sweep — park the nodes of blocked, stale worker sessions.
  # See the header comment for the contract. ALWAYS returns 0.
  frozen_session_sweep() {
    # Exactly one liveness query. UNKNOWN → park nothing (fail safe).
    local candidates
    if ! candidates=$(claude_agents_list_blocked_workers); then
      printf 'lib-frozen-session-park: daemon unqueryable; parking nothing\n' >&2
      return 0
    fi

    local blocked=0 parked_count=0 observing=0 unmeasurable=0 deferred=0

    if [[ -z "$candidates" ]]; then
      printf 'lib-frozen-session-park: sweep complete (blocked=%s parked=%s observing=%s unmeasurable=%s deferred=%s)\n' \
        "$blocked" "$parked_count" "$observing" "$unmeasurable" "$deferred" >&2
      return 0
    fi

    # Compute "now" and the tunables ONCE before the loop. A non-numeric
    # override falls back to its default (same guard idiom as reservation_sweep).
    local now
    if [[ "${DISPATCH_FROZEN_SESSION_NOW_EPOCH:-}" =~ ^[0-9]+$ ]]; then
      now="$DISPATCH_FROZEN_SESSION_NOW_EPOCH"
    else
      now=$(date -u +%s)
    fi
    local grace="${DISPATCH_FROZEN_SESSION_GRACE_S:-900}"
    [[ "$grace" =~ ^[0-9]+$ ]] || grace=900
    # Park cap defaults to 1: the sweep is inline on the tick's scheduling path,
    # so its whole park budget is cap x park_timeout (see the header).
    local park_max="${DISPATCH_FROZEN_SESSION_PARK_MAX:-1}"
    [[ "$park_max" =~ ^[0-9]+$ ]] || park_max=1
    local park_timeout="${DISPATCH_FROZEN_SESSION_PARK_TIMEOUT_S:-120}"
    [[ "$park_timeout" =~ ^[0-9]+$ ]] || park_timeout=120
    local lock_wait="${DISPATCH_FROZEN_SESSION_LOCK_WAIT_S:-60}"
    [[ "$lock_wait" =~ ^[0-9]+$ ]] || lock_wait=60
    local projects_root="${DISPATCH_FROZEN_SESSION_PROJECTS_ROOT:-$HOME/.claude/projects}"

    # `timeout` is coreutils and always present in this fleet's environment, but
    # resolve it explicitly rather than assuming: an unbounded park is a fleet
    # stall, so a missing `timeout` is a loud abort, not a silent downgrade to an
    # unbounded call (.claude/rules/code-style.md).
    local timeout_bin
    timeout_bin=$(command -v timeout 2>/dev/null) || timeout_bin=""
    if [[ -z "$timeout_bin" ]]; then
      printf 'lib-frozen-session-park: `timeout` not found; refusing to run an unbounded park-node on the tick path; parking nothing\n' >&2
      return 0
    fi

    local repo_root="${DISPATCH_FROZEN_SESSION_REPO_ROOT:-}"
    if [[ -z "$repo_root" ]]; then
      repo_root=$(resolve_project_root) || repo_root=""
    fi
    if [[ -z "$repo_root" ]]; then
      printf 'lib-frozen-session-park: repo root unresolvable; parking nothing\n' >&2
      return 0
    fi

    # Provenance (1): the checkout we are about to run `park-node` OUT OF must be
    # the primary checkout on `main`. A drift off `main` means the sweep would
    # execute an unreviewed branch's version of a script that force-pushes
    # refs/graph/** and main — unattended, from the headless tick, sandbox off.
    if ! assert_primary_checkout_on_main "$repo_root"; then
      printf 'lib-frozen-session-park: repo root %s is not a primary checkout on main; refusing to run its park-node; parking nothing\n' "$repo_root" >&2
      return 0
    fi

    # Provenance (2): the resolved park-node must be an executable regular file
    # whose REAL directory is the repo's intentionsutil scripts dir. Canonicalize
    # both sides (`pwd -P`) so `..` segments and symlinked temp roots cannot slip
    # an arbitrary executable past a string prefix test. This is the same
    # validate-at-the-edge posture as the node-id and session-id checks below,
    # and it is what makes honouring DISPATCH_FROZEN_SESSION_PARK_NODE safe.
    local park_dir park_node park_dir_real park_node_dir_real
    park_dir="$repo_root/packages/intentionsutil/scripts"
    park_node="${DISPATCH_FROZEN_SESSION_PARK_NODE:-$park_dir/park-node}"
    park_dir_real=$(cd "$park_dir" 2>/dev/null && pwd -P) || park_dir_real=""
    park_node_dir_real=$(cd "$(dirname -- "$park_node")" 2>/dev/null && pwd -P) || park_node_dir_real=""
    if [[ -z "$park_dir_real" || "$park_node_dir_real" != "$park_dir_real" ]]; then
      printf 'lib-frozen-session-park: park-node path %s does not resolve inside %s; parking nothing\n' \
        "$park_node" "$park_dir" >&2
      return 0
    fi
    if [[ ! -f "$park_node" || ! -x "$park_node" ]]; then
      printf 'lib-frozen-session-park: park-node at %s is not an executable regular file; parking nothing\n' "$park_node" >&2
      return 0
    fi

    # The stand-down interlock's second signal (see the header): the set of node
    # names with two or more LIVE sessions. Computed once, from the same
    # registry read the candidate list came from (snapshot-backed inside a
    # tick), so it costs no extra daemon round-trip. UNKNOWN here aborts the
    # sweep rather than downgrading to "no duplicates": a definite-looking
    # "nobody else holds this node" derived from a failed query is exactly the
    # false park this interlock exists to prevent (.claude/rules/code-style.md).
    local dup_names
    if ! dup_names=$(claude_agents_list_duplicate_node_names); then
      printf 'lib-frozen-session-park: duplicate-name set unqueryable; cannot rule out a stand-down; parking nothing\n' >&2
      return 0
    fi
    local -A dup_live=()
    local dup_name dup_sids
    if [[ -n "$dup_names" ]]; then
      while IFS=$'\t' read -r dup_name dup_sids; do
        [[ -n "$dup_name" ]] || continue
        dup_live["$dup_name"]="$dup_sids"
      done <<<"$dup_names"
    fi

    # The lazy-fetch latch: at most one `git fetch` per sweep invocation, and
    # none at all when no candidate ages past the grace.
    local fetched=0

    # Drain the candidate list into an array BEFORE looping. A `while read ...
    # done <<<"$candidates"` loop leaves the remaining candidates on the loop
    # body's stdin, where `park-node` (a long chain of git/node subprocesses
    # under a landing lock) could silently consume them — dropping the rest of
    # the sweep with no diagnostic and under-reporting the summary counts.
    local -a rows=()
    mapfile -t rows <<<"$candidates"

    local row sid name cwd
    for row in "${rows[@]}"; do
      IFS=$'\t' read -r sid name cwd <<<"$row"
      [[ -n "$sid" && -n "$name" ]] || continue
      blocked=$(( blocked + 1 ))

      # (1) Name shape. A `<N>-slug` legacy issue worker has no graph node at
      # all — there is nothing to park, and the issue lane's own machinery owns
      # it.
      if [[ "$name" =~ ^[0-9]+- ]]; then
        printf 'lib-frozen-session-park: frozen worker %s has no graph node (session=%s); not parking\n' "$name" "$sid" >&2
        continue
      fi
      # The name becomes a path component in the `git show origin/main:` read
      # below, so validate its shape at this edge with the SAME node-id regex
      # office-hours-graph applies before provisioning (and the worktree-create
      # hook's node lane). A clear skip beats an opaque git failure — or a path
      # escape — downstream.
      if [[ ! "$name" =~ ^[a-z][a-z0-9]*(-[a-z0-9]+)*$ ]]; then
        printf 'lib-frozen-session-park: frozen worker %s is not a valid node id; not parking\n' "$name" >&2
        continue
      fi

      # (2) Session-id shape. The id feeds a `find -name` glob below; validate
      # it at the same edge (input validation at a system boundary).
      if [[ ! "$sid" =~ ^[0-9a-fA-F-]+$ ]]; then
        printf 'lib-frozen-session-park: frozen worker %s has an invalid session id; not parking\n' "$name" >&2
        continue
      fi

      # (3) Idle time. The transcript lives at <projects-root>/<project>/<sid>.jsonl
      # — keyed on the globally-unique session id, so the project-dir slug (a
      # mangling of the session's cwd) never has to be reconstructed. Take the
      # NEWEST mtime across matches. No match, or an unreadable mtime, is
      # UNKNOWN: keep, never park.
      local matches transcript best="" cur
      matches=$(find "$projects_root" -mindepth 2 -maxdepth 2 -name "${sid}.jsonl" 2>/dev/null)
      if [[ -n "$matches" ]]; then
        while IFS= read -r transcript; do
          [[ -n "$transcript" ]] || continue
          cur=$(stat -c %Y "$transcript" 2>/dev/null) || continue
          [[ "$cur" =~ ^[0-9]+$ ]] || continue
          if [[ -z "$best" ]] || (( cur > best )); then
            best="$cur"
          fi
        done <<<"$matches"
      fi
      if [[ -z "$best" ]]; then
        unmeasurable=$(( unmeasurable + 1 ))
        printf 'lib-frozen-session-park: keeping %s (state=blocked, transcript unreadable — idle time unmeasurable)\n' "$name" >&2
        continue
      fi
      local idle=$(( now - best ))

      # (4) Grace. A negative (future-stamped) idle is `< grace` too, so it is
      # kept — the safe direction, matching reservation_sweep's boot grace.
      if (( idle < grace )); then
        observing=$(( observing + 1 ))
        printf 'lib-frozen-session-park: observing %s (state=blocked, idle_seconds=%s < grace_seconds=%s, session=%s)\n' \
          "$name" "$idle" "$grace" "$sid" >&2
        continue
      fi

      # (5) Stand-down interlock. A blocked, stale session that is NOT alone
      # under this node name is a stood-down loser, not a frozen worker holding
      # an idle node: another live session is actively working the node, and
      # parking it is precisely the interruption the stand-down protocol exists
      # to avoid. Either signal alone means keep — see the header. The
      # stand-down re-check sweep (lib-standdown-recheck.sh, which runs earlier
      # in the same tick) owns these nodes and parks them itself, with the right
      # reason, once the winner is DEFINITELY gone.
      if standdown_exists "$name"; then
        observing=$(( observing + 1 ))
        printf 'lib-frozen-session-park: keeping %s (stand-down marker present — another session holds this node; the stand-down re-check owns it)\n' "$name" >&2
        continue
      fi
      if [[ -n "${dup_live[$name]:-}" ]]; then
        observing=$(( observing + 1 ))
        printf 'lib-frozen-session-park: keeping %s (%s live sessions registered under this node name: %s; not a lone frozen worker)\n' \
          "$name" "$(awk -F, '{print NF}' <<<"${dup_live[$name]}")" "${dup_live[$name]}" >&2
        continue
      fi

      # (6) Lazy fetch, once per sweep. A fetch failure is non-fatal: fall back
      # to whatever `origin/main` ref this checkout already has rather than
      # blocking the sweep on a network blip (copied from office-hours-graph).
      if (( fetched == 0 )); then
        git -C "$repo_root" fetch origin main --quiet 2>/dev/null || true
        fetched=1
      fi

      # (7) Node exists on origin/main. origin/main is the authoritative graph
      # state; a name with no node file there is not a graph node we can park.
      local body
      if ! body=$(git -C "$repo_root" show "origin/main:intentions/${name}.md" 2>/dev/null); then
        printf 'lib-frozen-session-park: keeping %s (no intentions/%s.md on origin/main; not a graph node)\n' "$name" "$name" >&2
        continue
      fi

      # (8) Already parked. Idiom copied VERBATIM from `park_live_on_main` in
      # `packages/intentionsutil/scripts/office-hours-graph` — deliberately
      # inlined rather than shared. The frontmatter scoping is load-bearing:
      # restricting the test to the YAML block (between the first two `---`
      # fences) means a column-0 `office_hours:` line in the markdown BODY
      # (documentation of the serialization) can never be misread as park state.
      local frontmatter parked_already=0
      frontmatter=$(awk 'NR==1&&/^---/{f=1;next} f&&/^---[[:space:]]*$/{exit} f' <<<"$body")
      if grep -q '^office_hours:' <<<"$frontmatter"; then
        if ! grep -qE '^office_hours:[[:space:]]*null[[:space:]]*$' <<<"$frontmatter"; then
          parked_already=1
        fi
      fi
      if (( parked_already )); then
        printf 'lib-frozen-session-park: skipping %s (already parked to office_hours)\n' "$name" >&2
        continue
      fi

      # (9) Cap. Excess candidates are deferred to the next tick rather than
      # serializing N graph-commit landing-lock pushes inside this one.
      if (( parked_count >= park_max )); then
        deferred=$(( deferred + 1 ))
        printf 'lib-frozen-session-park: deferring %s (park cap %s reached this sweep)\n' "$name" "$park_max" >&2
        continue
      fi

      # (10) Park. Three positional args: <node-id> <reason> [recommendation].
      # No `--pr` (this caller is gh-free and has no PR number) and no `--base`
      # (there is no diagnosis/execution gap to pin — park-node's own fresh
      # origin/main re-read is the correct guard here).
      local reason recommendation
      printf -v reason \
        'worker session froze at a permission/classifier denial — claude agents reports state=blocked and the transcript has had no activity for %ss; the session cannot make progress and cannot park itself (a blocked session never reaches the Stop hook), so the dispatch-tick frozen-session sweep parked this node' \
        "$idle"
      recommendation="Find the holding job with 'claude agents --all' and attach it ('claude attach <job-id>'), then answer the pending prompt. If the denied command was gratuitous, cancel it and let the worker continue; if it is genuinely needed, run it yourself or add a standing permission rule — do NOT rewrite the command to route around the classifier. If the session is unrecoverable, stop it ('claude rm <job-id>'), let dispatch-sweep reap the worktree, then run clear-park <node-id> to return the node to the lane. Until that session is gone, office-hours reports this node as 'all-held' rather than launching a review session for it, because the frozen session still holds the node-id session name."

      # Bounded: `timeout` caps the wall clock this one call may take, and the
      # short GRAPH_COMMIT_LOCK_WAIT_SECONDS makes graph-commit abandon a
      # contended landing lock inside that cap rather than after its own 1050s
      # default. The tick must keep scheduling even when the lock is busy.
      # `</dev/null`: park-node runs a long chain of git/node subprocesses, none
      # of which has any business reading the sweep's inherited stdin.
      local rc=0
      GRAPH_COMMIT_LOCK_WAIT_SECONDS="$lock_wait" \
        "$timeout_bin" "$park_timeout" "$park_node" "$name" "$reason" "$recommendation" >/dev/null </dev/null || rc=$?
      if (( rc == 0 )); then
        parked_count=$(( parked_count + 1 ))
        printf 'lib-frozen-session-park: parked %s (denied-command-frozen after %ss; session=%s)\n' "$name" "$idle" "$sid" >&2
        _frozen_session_log_decision "$name" "$sid" "$idle" "parked"
      elif (( rc == 124 )); then
        # A timeout is just another park failure — same non-fatal handling, but
        # named distinctly so a contended landing lock is greppable as itself.
        printf 'lib-frozen-session-park: park failed for %s (park-node timed out after %ss); will retry next tick\n' "$name" "$park_timeout" >&2
        _frozen_session_log_decision "$name" "$sid" "$idle" "park-timeout"
      else
        # A park failure is never fatal to the sweep or the tick: log it and
        # move on to the next candidate. The next tick retries.
        printf 'lib-frozen-session-park: park failed for %s (park-node exit %s); will retry next tick\n' "$name" "$rc" >&2
        _frozen_session_log_decision "$name" "$sid" "$idle" "park-failed"
      fi
    done

    printf 'lib-frozen-session-park: sweep complete (blocked=%s parked=%s observing=%s unmeasurable=%s deferred=%s)\n' \
      "$blocked" "$parked_count" "$observing" "$unmeasurable" "$deferred" >&2
    return 0
  }

fi
