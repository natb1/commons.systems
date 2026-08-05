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
# `terminal_without_disposition_sweep` is this file's SECOND predicate, closing
# the sibling failure: a phase session that ended on a needs-human judgment item
# WITHOUT declaring a disposition. Its evidence is the same registry, read one
# state over: a worker row still present in `claude agents --json --all` in a
# TERMINAL state. See that function's own header for why that predicate is sound
# and what it parks.
#
# Usage: source this file, then call:
#   frozen_session_sweep
#   terminal_without_disposition_sweep
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
#   live session holding the node + a real node file on origin/main that is
#   unparked AT WRITE TIME. That last term is stronger than the read alone can
#   make it: `origin/main` is fetched once per sweep and each candidate then
#   burns minutes of wall clock before its write, so the "not parked" read is
#   stale by the time the park runs. Every `park-node` call therefore carries
#   `--base <id>=<blob>` pinned to the blob the decision was read from, and a
#   park that landed inside that window makes park-node REFUSE (exit 3) instead
#   of overwriting it — a stale-diagnosis skip, not a park failure.
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
#   DISPATCH_TERMINAL_DISPOSITION_NOW_EPOCH
#                                          Test clock (epoch seconds) for
#                                          `terminal_without_disposition_sweep`.
#                                          Default: `date -u +%s`.
#   DISPATCH_TERMINAL_DISPOSITION_GRACE_S  Transcript idle seconds a terminal
#                                          worker must exceed before its node is
#                                          parked (the park test is
#                                          `idle >= grace`). Default: 300 — far
#                                          past the session-end-to-reap teardown
#                                          window, far short of a real stall.
#   DISPATCH_TERMINAL_DISPOSITION_PARK_MAX Maximum parks per invocation of the
#                                          terminal-disposition sweep.
#                                          Default: 2, so the whole sweep's park
#                                          budget (cap x park timeout) stays
#                                          small against the 15-minute tick.
#   DISPATCH_TERMINAL_DISPOSITION_PARK_TIMEOUT_S
#                                          Wall-clock seconds a single
#                                          `park-node` call may take before it
#                                          is killed (rc 124, handled as a
#                                          `park-timeout` disposition retried on
#                                          the next tick). Default: 120.
#   DISPATCH_TERMINAL_DISPOSITION_LOCK_WAIT_S
#                                          Exported to each `park-node` call as
#                                          GRAPH_COMMIT_LOCK_WAIT_SECONDS, so
#                                          graph-commit abandons a contended
#                                          landing lock inside the timeout above
#                                          rather than after its own 1050s
#                                          default. Default: 60.
#   DISPATCH_TERMINAL_DISPOSITION_PROJECTS_ROOT
#                                          Transcript store root. Default:
#                                          $HOME/.claude/projects.
#   DISPATCH_TERMINAL_DISPOSITION_JOBS_ROOT
#                                          Managed-job dir root, where a session's
#                                          own `office-hours-reason` /
#                                          `office-hours-recommendation` /
#                                          `office-hours-pr` escalation files
#                                          live. Default: $HOME/.claude/jobs.
#                                          Job dirs are named by the registry's
#                                          `.id` field, NOT by the sessionId —
#                                          see the sweep's step (11).
#   DISPATCH_TERMINAL_DISPOSITION_REPO_ROOT
#                                          Repo root for the `git show
#                                          origin/main:` reads and the default
#                                          park-node path. Default:
#                                          resolve_project_root (lib.sh).
#   DISPATCH_TERMINAL_DISPOSITION_PARK_NODE
#                                          park-node path. Default:
#                                          <repo-root>/packages/intentionsutil/
#                                          scripts/park-node. MUST still resolve
#                                          inside that directory — the
#                                          terminal-disposition sweep carries the
#                                          SAME two provenance checks as
#                                          frozen_session_sweep (primary checkout
#                                          on `main`, park-node an executable
#                                          regular file inside the repo's
#                                          intentionsutil scripts dir); anything
#                                          else aborts the sweep.
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

      # (7b) Diagnosis-time base (ref-diagnosis-time-cas). The decision this
      # sweep is about to make — "not parked, so park it" — is made against the
      # blob read HERE, from a ref last fetched once at step (6). Pin that exact
      # blob through park-node's --base so a park landing in the window between
      # this read and the write below is REFUSED (exit 3) rather than
      # overwritten. `rev-parse` is the identical expression park-node resolves
      # FRESH_BLOB with (park-node:205), so the two are bit-for-bit comparable;
      # hashing $body instead would not match, because command substitution
      # strips its trailing newlines.
      local diagnosis_blob
      if ! diagnosis_blob=$(git -C "$repo_root" rev-parse "origin/main:intentions/${name}.md" 2>/dev/null); then
        printf 'lib-frozen-session-park: keeping %s (could not resolve the origin/main blob sha for intentions/%s.md; refusing to park without a compare-and-swap base)\n' "$name" "$name" >&2
        continue
      fi

      # (8) Already parked. Idiom deliberately inlined rather than shared (same
      # frontmatter-scoped, column-0-anchored idiom `node_kind_on_main` in
      # `packages/intentionsutil/scripts/office-hours-graph` uses). The
      # frontmatter scoping is load-bearing: restricting the test to the YAML
      # block (between the first two `---` fences) means a column-0
      # `office_hours:` line in the markdown BODY (documentation of the
      # serialization) can never be misread as park state.
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

      # (10) Park. Three positional args: <node-id> <reason> [recommendation],
      # preceded by `--base`. No `--pr` (this caller is gh-free and has no PR
      # number), but `--base` IS threaded: there is a real diagnosis/execution
      # gap to pin. `origin/main` is fetched ONCE per sweep at step (6), and each
      # candidate then burns wall clock on transcript stats, job-dir reads, and
      # (for earlier candidates) a full park-node landing — so the window between
      # the step-(8) "not parked" read and the write below is minutes wide in
      # practice. park-node's own fresh origin/main re-read is NOT a guard against
      # that: it re-reads to build the write, not to verify the decision still
      # holds, so a specific human-facing park that landed in the window is
      # silently overwritten with this sweep's generic boilerplate. Pinning the
      # step-(7b) blob turns that race into an exit-3 refusal instead.
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
      #
      # park-node's parse is leading-flags-only: the first non-flag argument ends
      # flag parsing and everything after it is verbatim free text, so `--base`
      # must come first. The `<id>=<sha>` pair form (rather than a bare sha) is a
      # free guard — park-node rejects a pair whose id is not the node id, so a
      # mis-threaded `$name` fails loudly instead of pinning the wrong file.
      local -a park_args=(--base "$name=$diagnosis_blob" "$name" "$reason" "$recommendation")
      local rc=0
      GRAPH_COMMIT_LOCK_WAIT_SECONDS="$lock_wait" \
        "$timeout_bin" "$park_timeout" "$park_node" "${park_args[@]}" >/dev/null </dev/null || rc=$?
      if (( rc == 0 )); then
        parked_count=$(( parked_count + 1 ))
        printf 'lib-frozen-session-park: parked %s (denied-command-frozen after %ss; session=%s)\n' "$name" "$idle" "$sid" >&2
        _frozen_session_log_decision "$name" "$sid" "$idle" "parked"
      elif (( rc == 3 )); then
        # NOT a park failure. park-node refused the compare-and-swap because the
        # node changed on origin/main after this sweep read it — it is already
        # parked, or already under human review. Nothing was written, nothing is
        # broken, and the correct response is to re-diagnose next tick, never to
        # retry without the base and never to park again
        # (.claude/skills/ref-diagnosis-time-cas/SKILL.md:73-83).
        printf 'lib-frozen-session-park: stale-diagnosis skip for %s — intentions/%s.md on origin/main changed after this sweep read it (pinned base %s); park-node REFUSED rather than overwriting a park that landed in the meantime. Nothing was written; the next tick re-reads and re-decides\n' \
          "$name" "$name" "$diagnosis_blob" >&2
        _frozen_session_log_decision "$name" "$sid" "$idle" "stale-diagnosis"
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

  # _terminal_disposition_log_decision <node> <session> <idle> <disposition> —
  # append one best-effort JSONL decision record for the terminal-disposition
  # sweep. Sibling of _frozen_session_log_decision above, same shape: build with
  # `jq -c -n`, hand to `decision_log_append` behind a `command -v` guard, never
  # fail the caller. Only `site` and `state` differ.
  _terminal_disposition_log_decision() {
    local node="$1" session="$2" idle="$3" disposition="$4"
    local json
    json=$(jq -c -n \
      --arg ts          "$(date -u +%FT%TZ)" \
      --arg site        "terminal-disposition-sweep" \
      --arg node        "$node" \
      --arg session     "$session" \
      --arg state       "terminal" \
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

  # terminal_without_disposition_sweep — park the node of a phase session that
  # ENDED without declaring a disposition. No arguments; ALWAYS returns 0, on
  # every path (daemon failure, unresolvable repo root, failed `park-node`).
  #
  # Why the predicate is sound. `dispatch-self-close --node <id>` reaps a node
  # worker's job with `claude rm` ONLY when a `$CLAUDE_JOB_DIR/node-terminal`
  # marker names that node; with no marker it HOLDS the job alive instead. A
  # reaped job is gone from the registry entirely. Therefore a row that is STILL
  # PRESENT in `claude agents --json --all` in a terminal state is, by
  # construction, a session that ended WITHOUT declaring a disposition — exactly
  # the population this sweep must act on. The grace period below covers the
  # teardown window between session end and the reap.
  #
  # The node such a session leaves behind is both HELD (the registered session
  # name keeps office-hours reporting it `all-held`, and keeps the worktree
  # unreapable) and RE-SELECTABLE (`office_hours` is still null on origin/main),
  # which is the churn loop this sweep breaks: it lands the office_hours park the
  # session itself owed, so a human is asked the judgment item the session
  # stopped on.
  #
  # This replaces the Stop-hook backstop, whose park silently failed (wrong
  # worktree base, no landing budget, swallowed errors). The single most
  # important difference is WHERE park-node runs from — see step (12) below.
  #
  # The stand-down interlock. A stood-down LOSER of the duplicate-worker protocol
  # has EXACTLY this sweep's candidate shape BY DESIGN: `dispatch-standdown` tells
  # it to yield the turn WITHOUT a `node-terminal` marker, precisely so the Stop
  # hook HOLDS the job — while the WINNER goes on working that same node under the
  # same session name. Parking it is the spurious interruption the stand-down
  # protocol exists to avoid, and that protocol deliberately carries NO age term
  # on this path, so this sweep must not reintroduce one through the back door.
  # Two independent signals, either sufficient to KEEP (step (5)): a stand-down
  # marker exists for the node (`standdown_exists`), or a live session that is not
  # itself one of this sweep's candidates is registered under the node name
  # (`claude_agents_list_all`, the ACTIVE view, minus this sweep's own candidate
  # session ids). `standdown_recheck_sweep` owns those nodes and parks them itself
  # once the winner is definitely gone.
  #
  # Marker deletion is the PROOF that the park landed — not a cleanup step that
  # trusts an exit code. `park-node` lands through `graph-commit`, which pushes to
  # a contended `refs/graph/landing-lock`, and invariant I2 is explicit that a
  # `graph-commit` exit 0 is NEVER evidence that anything reached `origin/main`.
  # The session's `office-hours-reason` / `-recommendation` / `-pr` files are the
  # ONLY surviving copy of its own escalation text, so deleting them on a bare
  # exit 0 converts a RECOVERABLE failure — a node held-and-unparked, retryable on
  # the next tick from the text still on disk — into an UNRECOVERABLE one, on the
  # very path whose whole job is to prevent that state. That is the worst outcome
  # available to this function, so an exit code alone does not get to authorize
  # it.
  #
  # Step (13) therefore re-reads the node from a freshly fetched `origin/main`
  # after every rc-0 park and deletes the markers ONLY when `office_hours` is
  # non-null there — the park is then PROVEN landed, counted, and logged as
  # before. `office_hours: null`, an absent `office_hours` key, a node file that
  # is gone, or a read that fails at all all mean the park did NOT land despite
  # the exit 0: the markers are KEPT, one loud `park-not-landed` line goes to
  # stderr, a `park-not-landed` decision record is written (deliberately distinct
  # from `park-failed` — a park that exited non-zero and a park that exited 0
  # without landing have different causes and want different operator responses),
  # and the park is NOT counted. The next tick retries with the session's own text
  # intact. The confirmation read reuses step (8)'s frontmatter-scoped idiom
  # verbatim, in the opposite polarity, and the frontmatter scoping is just as
  # load-bearing here: a column-0 `office_hours:` line in the markdown BODY must
  # never be able to certify a park that never landed.
  #
  # This makes the project's bug-J detect — `find $CLAUDE_JOB_DIR -maxdepth 2
  # -name office-hours-reason`, where ANY hit is by definition a park that did not
  # land — double as this heal's OWN success criterion: a marker that survives one
  # sweep interval is a heal that failed, and it now says so in its own words.
  #
  # Accepted residuals:
  #   - A session that DID declare but whose `claude rm` reap itself failed
  #     lingers as a terminal row and could be parked spuriously. This is rare;
  #     the grace window and the `phase: done` gate absorb most of it; and a
  #     spurious park is cheap and recoverable (`clear-park <node-id>`) — the
  #     same cost model dispatch-self-close:225-233 already records for parks.
  #   - A node at `phase: null` with a held terminal `/align-tactics` session is
  #     included BY DESIGN: an align pass that ended without a claim and without
  #     a `no-claim` marker is the same churn shape.
  #   - The MIRROR of the soundness argument is NOT covered: a session that wrote
  #     BOTH a `node-terminal` marker (so `dispatch-self-close` reaps it) AND an
  #     unconsumed `office-hours-reason` leaves no registry row for this sweep to
  #     find, so its escalation text is consumed by nobody and its node is left
  #     unparked. The deleted Stop-hook backstop ran before the reap in the same
  #     hook and did cover that ordering. It is accepted here rather than closed
  #     because the only two ways to close it — having `dispatch-self-close` HOLD
  #     on a pending `office-hours-reason`, or having `mark-node-terminal` fail
  #     loudly on one — change the reap path for EVERY lane, and a wrong HOLD
  #     accumulates un-reapable jobs fleet-wide. The shape itself is a session
  #     bug: a pass that asked for a human AND declared a machine disposition
  #     contradicted itself, and the contradiction belongs upstream, in whichever
  #     skill wrote both.
  #
  # Two daemon queries (the `--all` candidate listing, which cannot come from the
  # tick snapshot, and the snapshot-backed ACTIVE view behind the interlock).
  #
  # The `git fetch` budget is ONE lazy pre-flight fetch per invocation — it runs
  # only once a candidate has actually aged past the grace, so a sweep with no
  # aged candidate does no network I/O at all — PLUS one confirmation fetch per
  # park that returned rc 0. The second kind is not optional and not foldable into
  # the first: the park itself just pushed, so by construction this checkout's
  # `origin/main` is stale exactly when step (13) needs it to be current, and a
  # confirmation read against a pre-park ref would report EVERY park as
  # not-landed. The budget is therefore `1 + park_max` fetches (3 by default),
  # bounded by the same park cap that bounds the `park-node` calls the extra
  # fetches follow — and a `git fetch origin main` is negligible beside the
  # `park-node` invocation it confirms. This paragraph, not the older "at most one
  # `git fetch` per invocation" wording, is the contract; `frozen_session_sweep`
  # (which does not confirm) still holds to the single-fetch form.
  #
  # A failed confirmation fetch is non-fatal and reads as NOT LANDED, which is the
  # fail-safe direction: markers kept, park uncounted, retry next tick. One
  # greppable stderr line per disposition, and exactly one summary line.
  #
  # Bounded and provenance-checked exactly as `frozen_session_sweep` is, and for
  # the same reasons (see that function's header): this sweep also runs INLINE on
  # the tick's scheduling path, unattended, with the sandbox disabled.
  #   - each `park-node` call runs under `timeout` (default 120s) with a short
  #     GRAPH_COMMIT_LOCK_WAIT_SECONDS (default 60s), so a contended landing lock
  #     is DEFERRED to the next tick rather than waited out in-line for
  #     graph-commit's own ~1050s default; a missing `timeout` is a loud abort,
  #     never a silent downgrade to an unbounded call;
  #   - the park cap defaults to 2, so the whole sweep's park budget is
  #     cap x timeout;
  #   - the repo root must be a primary checkout on `main`, and the resolved
  #     `park-node` must be an executable regular file whose REAL directory is
  #     `<repo-root>/packages/intentionsutil/scripts` — otherwise the sweep would
  #     execute an unreviewed (or wholly arbitrary, via the environment override)
  #     script that force-pushes `refs/graph/**` and `main`.
  terminal_without_disposition_sweep() {
    # The candidate query — a DIRECT `--all` listing (the tick snapshot is
    # captured without `--all` and so lacks the terminal rows this sweep exists
    # to find). UNKNOWN → park nothing (fail safe).
    local candidates
    if ! candidates=$(claude_agents_list_terminal_workers); then
      printf 'lib-frozen-session-park: daemon unqueryable; parking nothing\n' >&2
      return 0
    fi

    local terminal=0 parked_count=0 observing=0 unmeasurable=0 deferred=0

    if [[ -z "$candidates" ]]; then
      printf 'lib-frozen-session-park: terminal-disposition sweep complete (terminal=%s parked=%s observing=%s unmeasurable=%s deferred=%s)\n' \
        "$terminal" "$parked_count" "$observing" "$unmeasurable" "$deferred" >&2
      return 0
    fi

    # Compute "now" and the tunables ONCE before the loop. A non-numeric
    # override falls back to its default (the same guard idiom as
    # frozen_session_sweep above).
    local now
    if [[ "${DISPATCH_TERMINAL_DISPOSITION_NOW_EPOCH:-}" =~ ^[0-9]+$ ]]; then
      now="$DISPATCH_TERMINAL_DISPOSITION_NOW_EPOCH"
    else
      now=$(date -u +%s)
    fi
    local grace="${DISPATCH_TERMINAL_DISPOSITION_GRACE_S:-300}"
    [[ "$grace" =~ ^[0-9]+$ ]] || grace=300
    # Park cap defaults to 2: the sweep is inline on the tick's scheduling path,
    # so its whole park budget is cap x park_timeout (see the header).
    local park_max="${DISPATCH_TERMINAL_DISPOSITION_PARK_MAX:-2}"
    [[ "$park_max" =~ ^[0-9]+$ ]] || park_max=2
    local park_timeout="${DISPATCH_TERMINAL_DISPOSITION_PARK_TIMEOUT_S:-120}"
    [[ "$park_timeout" =~ ^[0-9]+$ ]] || park_timeout=120
    local lock_wait="${DISPATCH_TERMINAL_DISPOSITION_LOCK_WAIT_S:-60}"
    [[ "$lock_wait" =~ ^[0-9]+$ ]] || lock_wait=60
    local projects_root="${DISPATCH_TERMINAL_DISPOSITION_PROJECTS_ROOT:-$HOME/.claude/projects}"
    local jobs_root="${DISPATCH_TERMINAL_DISPOSITION_JOBS_ROOT:-$HOME/.claude/jobs}"

    # `timeout` is coreutils and always present in this fleet's environment, but
    # resolve it explicitly rather than assuming: an unbounded park is a fleet
    # stall, so a missing `timeout` is a loud abort, not a silent downgrade to an
    # unbounded call (.claude/rules/code-style.md). Same posture as
    # frozen_session_sweep.
    local timeout_bin
    timeout_bin=$(command -v timeout 2>/dev/null) || timeout_bin=""
    if [[ -z "$timeout_bin" ]]; then
      printf 'lib-frozen-session-park: `timeout` not found; refusing to run an unbounded park-node on the tick path; parking nothing\n' >&2
      printf 'lib-frozen-session-park: terminal-disposition sweep complete (terminal=%s parked=%s observing=%s unmeasurable=%s deferred=%s)\n' \
        "$terminal" "$parked_count" "$observing" "$unmeasurable" "$deferred" >&2
      return 0
    fi

    local repo_root="${DISPATCH_TERMINAL_DISPOSITION_REPO_ROOT:-}"
    if [[ -z "$repo_root" ]]; then
      repo_root=$(resolve_project_root) || repo_root=""
    fi
    if [[ -z "$repo_root" ]]; then
      printf 'lib-frozen-session-park: repo root unresolvable; parking nothing\n' >&2
      printf 'lib-frozen-session-park: terminal-disposition sweep complete (terminal=%s parked=%s observing=%s unmeasurable=%s deferred=%s)\n' \
        "$terminal" "$parked_count" "$observing" "$unmeasurable" "$deferred" >&2
      return 0
    fi

    # Provenance (1), copied from frozen_session_sweep: the checkout we are about
    # to run `park-node` OUT OF must be the primary checkout on `main`. A drift
    # off `main` (the 2026-07-21 direct-to-main incident, PR #2925; also the
    # failed-`worktree add` + chained-`cd` shape) means the sweep would execute an
    # unreviewed branch's version of a script that force-pushes refs/graph/** and
    # main — unattended, from the headless tick, sandbox off.
    if ! assert_primary_checkout_on_main "$repo_root"; then
      printf 'lib-frozen-session-park: repo root %s is not a primary checkout on main; refusing to run its park-node; parking nothing\n' "$repo_root" >&2
      printf 'lib-frozen-session-park: terminal-disposition sweep complete (terminal=%s parked=%s observing=%s unmeasurable=%s deferred=%s)\n' \
        "$terminal" "$parked_count" "$observing" "$unmeasurable" "$deferred" >&2
      return 0
    fi

    # Provenance (2), copied from frozen_session_sweep: the resolved park-node
    # must be an executable regular file whose REAL directory is the repo's
    # intentionsutil scripts dir. Canonicalize both sides (`pwd -P`) so `..`
    # segments and symlinked temp roots cannot slip an arbitrary executable past
    # a string prefix test. This is what makes honouring
    # DISPATCH_TERMINAL_DISPOSITION_PARK_NODE safe: an inherited environment
    # cannot redirect this unattended, sandbox-off call to another executable.
    local park_dir park_node park_dir_real park_node_dir_real
    park_dir="$repo_root/packages/intentionsutil/scripts"
    park_node="${DISPATCH_TERMINAL_DISPOSITION_PARK_NODE:-$park_dir/park-node}"
    park_dir_real=$(cd "$park_dir" 2>/dev/null && pwd -P) || park_dir_real=""
    park_node_dir_real=$(cd "$(dirname -- "$park_node")" 2>/dev/null && pwd -P) || park_node_dir_real=""
    if [[ -z "$park_dir_real" || "$park_node_dir_real" != "$park_dir_real" ]]; then
      printf 'lib-frozen-session-park: park-node path %s does not resolve inside %s; parking nothing\n' \
        "$park_node" "$park_dir" >&2
      printf 'lib-frozen-session-park: terminal-disposition sweep complete (terminal=%s parked=%s observing=%s unmeasurable=%s deferred=%s)\n' \
        "$terminal" "$parked_count" "$observing" "$unmeasurable" "$deferred" >&2
      return 0
    fi
    if [[ ! -f "$park_node" || ! -x "$park_node" ]]; then
      printf 'lib-frozen-session-park: park-node at %s is not an executable regular file; parking nothing\n' "$park_node" >&2
      printf 'lib-frozen-session-park: terminal-disposition sweep complete (terminal=%s parked=%s observing=%s unmeasurable=%s deferred=%s)\n' \
        "$terminal" "$parked_count" "$observing" "$unmeasurable" "$deferred" >&2
      return 0
    fi

    # The lazy-fetch latch: at most one `git fetch` per sweep invocation, and
    # none at all when no candidate ages past the grace.
    local fetched=0

    # Drain the candidate list into an array BEFORE looping, for the same reason
    # frozen_session_sweep does: `park-node` is a long chain of git/node
    # subprocesses that could otherwise consume the remaining candidates off the
    # loop body's stdin.
    local -a rows=()
    mapfile -t rows <<<"$candidates"

    # The stand-down interlock's second signal (see the header): the set of node
    # names that still have a LIVE session. `claude_agents_list_all` is the
    # ACTIVE view (no `--all`), so it is computed against a different registry
    # read than the `--all` candidate query above — and this sweep's own
    # candidates are subtracted from it by session id, so a terminal row that the
    # active view happens to surface (a `stopped`/`error` row is terminal by this
    # file's enumeration but need not be hidden from the default listing) can
    # never mask itself as its own "someone else is working this node" evidence.
    # UNKNOWN here aborts the sweep rather than downgrading to "nobody else holds
    # this node": a definite-looking answer derived from a failed query is exactly
    # the false park this interlock exists to prevent (.claude/rules/code-style.md).
    local -A terminal_sids=()
    local drow dsid
    for drow in "${rows[@]}"; do
      dsid="${drow%%$'\t'*}"
      [[ -n "$dsid" ]] || continue
      terminal_sids["$dsid"]=1
    done

    local live_rows
    if ! live_rows=$(claude_agents_list_all); then
      printf 'lib-frozen-session-park: live-session registry unqueryable; cannot rule out a stand-down; parking nothing\n' >&2
      printf 'lib-frozen-session-park: terminal-disposition sweep complete (terminal=%s parked=%s observing=%s unmeasurable=%s deferred=%s)\n' \
        "$terminal" "$parked_count" "$observing" "$unmeasurable" "$deferred" >&2
      return 0
    fi
    # Field-split by parameter expansion, NOT `IFS=$'\t' read`: TAB is IFS
    # WHITESPACE, so `read` collapses a run of tabs into one delimiter and an
    # empty middle column (a row with a null `.status`, which `@tsv` renders as
    # "") would silently shift `name` one column left. The first/last field of a
    # fixed 3-column row is unambiguous under expansion.
    local -A live_names=()
    local lrow lsid lname
    if [[ -n "$live_rows" ]]; then
      while IFS= read -r lrow; do
        [[ -n "$lrow" ]] || continue
        lsid="${lrow%%$'\t'*}"
        lname="${lrow##*$'\t'}"
        [[ -n "$lname" ]] || continue
        if [[ -n "${terminal_sids[$lsid]:-}" ]]; then
          continue
        fi
        if [[ -n "${live_names[$lname]:-}" ]]; then
          live_names["$lname"]="${live_names[$lname]},$lsid"
        else
          live_names["$lname"]="$lsid"
        fi
      done <<<"$live_rows"
    fi

    # `jid` is the registry's own `.id` — the managed-job dir's name, which is
    # NOT the sessionId nor a prefix of it once a session has been resumed. The
    # transcript is keyed on `sid`; the job dir is keyed on `jid`. See step (11).
    local row rest sid jid name cwd
    for row in "${rows[@]}"; do
      # Field-split by parameter expansion for the reason given above the live
      # map: `IFS=$'\t' read` collapses runs of tabs, so a row whose `.id` is
      # null (`@tsv` renders it "") would shift `name` onto the cwd column and
      # the sweep would silently reject its own candidate as "not a valid node
      # id" instead of falling back to the synthesized reason.
      sid="${row%%$'\t'*}";  rest="${row#*$'\t'}"
      jid="${rest%%$'\t'*}"; rest="${rest#*$'\t'}"
      name="${rest%%$'\t'*}"
      cwd="${rest#*$'\t'}"
      [[ -n "$sid" && -n "$name" ]] || continue
      terminal=$(( terminal + 1 ))

      # (1) Name shape. A `<N>-slug` legacy issue worker has no graph node at
      # all — there is nothing to park, and the issue lane's own machinery owns
      # it.
      if [[ "$name" =~ ^[0-9]+- ]]; then
        printf 'lib-frozen-session-park: terminal worker %s has no graph node (session=%s); not parking\n' "$name" "$sid" >&2
        continue
      fi
      # The name becomes a path component in the `git show origin/main:` read
      # below, so validate its shape at this edge with the SAME node-id regex
      # office-hours-graph applies before provisioning. A clear skip beats an
      # opaque git failure — or a path escape — downstream.
      if [[ ! "$name" =~ ^[a-z][a-z0-9]*(-[a-z0-9]+)*$ ]]; then
        printf 'lib-frozen-session-park: terminal worker %s is not a valid node id; not parking\n' "$name" >&2
        continue
      fi

      # (2) Session-id shape. The id feeds a `find -name` glob and a job-dir
      # path below; validate it at the same edge.
      if [[ ! "$sid" =~ ^[0-9a-fA-F-]+$ ]]; then
        printf 'lib-frozen-session-park: terminal worker %s has an invalid session id; not parking\n' "$name" >&2
        continue
      fi

      # (3) Idle time. The transcript lives at <projects-root>/<project>/<sid>.jsonl
      # — keyed on the globally-unique session id. Take the NEWEST mtime across
      # matches. No match, or an unreadable mtime, is UNKNOWN: keep, never park.
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
        printf 'lib-frozen-session-park: keeping %s (state=terminal, transcript unreadable — idle time unmeasurable)\n' "$name" >&2
        continue
      fi
      local idle=$(( now - best ))

      # (4) Grace. A row can legitimately be terminal for the seconds between
      # session end and dispatch-self-close's reap; the grace covers that
      # teardown window. A negative (future-stamped) idle is `< grace` too, so it
      # is kept — the safe direction.
      if (( idle < grace )); then
        observing=$(( observing + 1 ))
        printf 'lib-frozen-session-park: observing %s (state=terminal, idle_seconds=%s < grace_seconds=%s, session=%s)\n' \
          "$name" "$idle" "$grace" "$sid" >&2
        continue
      fi

      # (5) Stand-down interlock. A stood-down LOSER of the duplicate-worker
      # protocol has EXACTLY this candidate's shape by design: `dispatch-standdown`
      # instructs it to yield the turn WITHOUT a `node-terminal` marker precisely
      # so the Stop hook HOLDS the job, which leaves a terminal row under the node
      # name while the WINNER is actively working that node. Parking it is the
      # spurious interruption the stand-down protocol exists to avoid, and that
      # protocol deliberately carries NO age term on this path — so this sweep
      # must not reintroduce one through the back door. Two independent signals,
      # either sufficient to KEEP: a stand-down marker exists for the node, or a
      # live session (one that is not itself a candidate of this sweep) is still
      # registered under the node name. `standdown_recheck_sweep`
      # (lib-standdown-recheck.sh, which runs earlier in the same tick) owns these
      # nodes and parks them itself, with the right reason, once the winner is
      # DEFINITELY gone.
      if standdown_exists "$name"; then
        observing=$(( observing + 1 ))
        printf 'lib-frozen-session-park: keeping %s (stand-down marker present — another session holds this node; the stand-down re-check owns it)\n' "$name" >&2
        continue
      fi
      if [[ -n "${live_names[$name]:-}" ]]; then
        observing=$(( observing + 1 ))
        printf 'lib-frozen-session-park: keeping %s (live sessions still registered under this node name: %s; the node is being worked)\n' \
          "$name" "${live_names[$name]}" >&2
        continue
      fi

      # (6) Lazy fetch, once per sweep. A fetch failure is non-fatal: fall back
      # to whatever `origin/main` ref this checkout already has rather than
      # blocking the sweep on a network blip.
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

      # (7b) Diagnosis-time base (ref-diagnosis-time-cas), exactly as
      # frozen_session_sweep step (7b) does it. The decision this sweep is about
      # to make — "not parked, still at a working phase, so park it" — is made
      # against the blob read HERE, from a ref last fetched once at step (6).
      # Pin that exact blob through park-node's --base so a park landing in the
      # window between this read and the write at step (12) is REFUSED (exit 3)
      # rather than overwritten. `rev-parse` is the identical expression
      # park-node resolves FRESH_BLOB with (park-node:205), so the two are
      # bit-for-bit comparable; hashing $body instead would not match, because
      # command substitution strips its trailing newlines.
      local diagnosis_blob
      if ! diagnosis_blob=$(git -C "$repo_root" rev-parse "origin/main:intentions/${name}.md" 2>/dev/null); then
        printf 'lib-frozen-session-park: keeping %s (could not resolve the origin/main blob sha for intentions/%s.md; refusing to park without a compare-and-swap base)\n' "$name" "$name" >&2
        continue
      fi

      # (8) Already parked. Idiom deliberately inlined rather than shared (same
      # frontmatter-scoped, column-0-anchored idiom `node_kind_on_main` in
      # `packages/intentionsutil/scripts/office-hours-graph` uses; also the same
      # deliberate duplication frozen_session_sweep step (8) carries). The
      # frontmatter scoping is load-bearing: restricting the test to the YAML
      # block (between the first two `---` fences) means a column-0
      # `office_hours:` line in the markdown BODY can never be misread as park
      # state.
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

      # (9) Phase gate — the discriminator this predicate adds over the frozen
      # sweep. A node at `phase: done` is FINISHED and must never be parked;
      # everything else — any in-flight phase, and `phase: null` — is still at a
      # working phase and is a candidate. This is exactly the `active-phase`
      # classification `node_completion_state` computes (dispatch-sweep:242-289),
      # including its column-0 anchoring and its "anything other than the exact
      # `done` literal reads as not finished" rule.
      if grep -qE '^phase:[[:space:]]*done[[:space:]]*$' <<<"$frontmatter"; then
        printf 'lib-frozen-session-park: skipping %s (phase: done — the node is finished, nothing to dispose)\n' "$name" >&2
        continue
      fi

      # (10) Cap. Excess candidates are deferred to the next tick rather than
      # serializing N graph-commit landing-lock pushes inside this one.
      if (( parked_count >= park_max )); then
        deferred=$(( deferred + 1 ))
        printf 'lib-frozen-session-park: deferring %s (park cap %s reached this sweep)\n' "$name" "$park_max" >&2
        continue
      fi

      # (11) Recover the worker's OWN escalation text. Job directories are named
      # by the registry's `.id` field — NOT the session id, and NOT a prefix of
      # it: a RESUMED session keeps its original job id while its sessionId
      # changes (a live registry shows `id=c20b2f8d` beside
      # `sessionId=699ca965-…`). Keying on the sessionId would read a DIFFERENT
      # session's escalation files whenever the two collide, land that text on
      # this node, and then delete the other session's markers.
      #
      # Two guards therefore stand between the registry row and the job dir:
      # the same shape check applied to `sid` (the id becomes a path component),
      # and an OWNERSHIP check — `state.json`'s `.name` (the field dispatch-stop
      # itself reads) must be this node id. Anything else falls back to the
      # synthesized reason and, crucially, does NOT delete the markers it did not
      # write.
      #
      # When the session wrote `office-hours-reason` (the escalation contract
      # every phase skill follows) that text is used VERBATIM — this sweep
      # automates the manual recovery procedure, it does not re-derive the
      # judgment. An `office-hours-pr` holding an integer is threaded as
      # `--pr <n>`, which preserves the `execution.pr` custody the deleted
      # Stop-hook backstop provided; it reads a file the session already wrote,
      # so the sweep stays gh-free.
      local job_dir="" job_owned=0 reason="" recommendation="" pr=""
      if [[ -n "$jid" && "$jid" =~ ^[0-9a-fA-F-]+$ ]]; then
        local job_name
        job_name=$(jq -r '.name // empty' "$jobs_root/$jid/state.json" 2>/dev/null) || job_name=""
        if [[ -n "$job_name" && "$job_name" == "$name" ]]; then
          job_dir="$jobs_root/$jid"
          job_owned=1
        else
          printf 'lib-frozen-session-park: job dir %s does not belong to %s (state.json name=%s); using the synthesized reason and leaving its markers alone\n' \
            "$jobs_root/$jid" "$name" "${job_name:-<unreadable>}" >&2
        fi
      else
        printf 'lib-frozen-session-park: terminal worker %s has no usable job id (id=%s); using the synthesized reason\n' \
          "$name" "${jid:-<empty>}" >&2
      fi
      if (( job_owned )); then
        if [[ -s "$job_dir/office-hours-reason" ]]; then
          reason=$(cat "$job_dir/office-hours-reason" 2>/dev/null) || reason=""
          if [[ -s "$job_dir/office-hours-recommendation" ]]; then
            recommendation=$(cat "$job_dir/office-hours-recommendation" 2>/dev/null) || recommendation=""
          fi
        fi
        if [[ -s "$job_dir/office-hours-pr" ]]; then
          local pr_raw
          pr_raw=$(cat "$job_dir/office-hours-pr" 2>/dev/null) || pr_raw=""
          if [[ "$pr_raw" =~ ^[0-9]+$ ]]; then
            pr="$pr_raw"
          fi
        fi
      fi
      if [[ -z "$reason" ]]; then
        # LOAD-BEARING: the leading clause "phase session ended without
        # declaring a disposition" is dispatch-terminal-gap-audit's
        # SYNTHESIZED_REASON_PREFIX classifier — it buckets any parked node
        # whose reason does NOT start with this text as parked-by-design
        # rather than landed-then-skipped. A reword of this clause silently
        # moves real landed-then-skipped nodes into parked-by-design with no
        # unmeasurable signal. test-dispatch-terminal-gap-audit.sh ratchets
        # this: it extracts the audit's prefix and asserts it is still a
        # literal substring of this file. Reword the tail after the em-dash
        # freely; keep the leading clause in sync with the audit if you must
        # change it.
        printf -v reason \
          'phase session ended without declaring a disposition — `claude agents --all` reports the session for this node in a terminal state and it has had no transcript activity for `%s`s, while `origin/main` still shows the node at a working phase with `office_hours: null`; the node is therefore both re-selectable and held, so the dispatch-tick terminal-without-disposition sweep parked it' \
          "$idle"
        recommendation="Read the session's transcript or attach the held job (\`claude agents --all\`, \`claude attach <job-id>\`) to see what it concluded. Then, whenever the terminal session is still present, reap it before clearing the park — that order is mandatory: stop the session (\`claude stop <job-id>\`), let \`dispatch-sweep\` reap the worktree, and only then \`clear-park <node-id>\` to return the node to the lane. If \`claude stop\` plus \`dispatch-sweep\` do not clear the session (e.g. an unpushed branch whose content is already landed elsewhere), verify the worktree is safe to discard BEFORE the destructive fallback, using the same reap-safety gate \`lib-session-reap.sh\` applies: (a) \`git -C <worktree> status --porcelain --untracked-files=no\` prints nothing (no uncommitted work), (b) \`git -C <worktree> diff --quiet origin/main HEAD -- . ':!intentions'\` exits 0 (tree content already landed; the \`intentions/\` carve-out is deliberate — graph commits land separately), and (c) no OPEN PR still has that branch as its head. Judge by that content diff, never by a commits-ahead count: GitHub squash-merges, so a safe branch routinely reads many commits ahead. If any of those does not pass, do NOT remove the worktree — the work in it is not yet landed. Only once they all pass, fall back to \`git worktree remove\` plus \`claude rm <job-id>\`. Deciding the judgment item the session stopped on is done IN ADDITION to the reap, never instead of it. If \`claude agents --all\` shows no session for this node, the session is already gone, the reap step is already satisfied, and \`clear-park <node-id>\` alone is the correct and sufficient action. Clearing the park while the session is still present is a no-op: the same sweep re-parks the node on its next pass, because the condition it detects — a terminal, un-reaped session with no recorded disposition — is unchanged by the clear alone. (Observed: a park was cleared with the session left alive, and the same sweep re-parked the node twice.)"
      fi

      # (12) Park. Invoked BY PATH under $repo_root, exactly as
      # frozen_session_sweep and lib-standdown-recheck.sh:699 do: `park-node`
      # resolves its repo root from its OWN script location, so a park-node path
      # under $repo_root satisfies invariant I1 regardless of the tick's cwd.
      # THIS is the single most important difference from the deleted Stop-hook
      # backstop, which ran park-node from the worker's own PR-branch worktree
      # and so wrote against the wrong base. `</dev/null`: park-node's git/node
      # subprocesses have no business reading the sweep's inherited stdin.
      #
      # Bounded exactly as frozen_session_sweep's park is: `timeout` caps the
      # wall clock this one call may take, and the short
      # GRAPH_COMMIT_LOCK_WAIT_SECONDS makes graph-commit abandon a contended
      # landing lock inside that cap rather than after its own 1050s default.
      # The tick must keep scheduling even when the landing lock is busy — the
      # header's "retries on the next tick if a landing-lock wait is in progress"
      # is only true because of these two bounds.
      #
      # park-node's parse is leading-flags-only, so every flag precedes the
      # positionals. The `<id>=<sha>` pair form of `--base` (rather than a bare
      # sha) is a free guard — park-node rejects a pair whose id is not the node
      # id, so a mis-threaded `$name` fails loudly instead of pinning the wrong
      # file.
      local -a park_args=()
      if [[ -n "$pr" ]]; then
        park_args+=(--pr "$pr")
      fi
      park_args+=(--base "$name=$diagnosis_blob")
      park_args+=("$name" "$reason" "$recommendation")
      local rc=0
      GRAPH_COMMIT_LOCK_WAIT_SECONDS="$lock_wait" \
        "$timeout_bin" "$park_timeout" "$park_node" "${park_args[@]}" >/dev/null </dev/null || rc=$?
      if (( rc == 0 )); then
        # (13) Confirm the park actually LANDED. `park-node` lands through
        # `graph-commit`, and invariant I2 says a `graph-commit` exit 0 is never
        # evidence that anything reached `origin/main` — so the exit code alone
        # does not get to authorize deleting the session's escalation markers,
        # which are the only surviving copy of its own escalation text. Re-read
        # the node from origin/main and require `office_hours` to be non-null
        # there; marker deletion is the PROOF the park landed, not a cleanup step
        # that trusts an exit code (see the header).
        #
        # The fetch is mandatory here, not latched with step (6)'s: the park we
        # just ran is exactly what made this checkout's `origin/main` stale, so a
        # confirmation read against the pre-park ref would report every park as
        # not-landed. A failed fetch is non-fatal and falls through to a stale
        # read, which reads as NOT LANDED — the fail-safe direction.
        git -C "$repo_root" fetch origin main --quiet 2>/dev/null || true

        # Same frontmatter-scoped idiom as step (8), in the OPPOSITE polarity:
        # there it answers "was this already parked before we touched it", here
        # "did OUR park land". Non-null under the YAML fences is the only thing
        # that counts as landed; a null value, a missing `office_hours` key, and
        # an unreadable/absent node file are all NOT landed. The frontmatter
        # scoping is load-bearing for the same reason it is there: a column-0
        # `office_hours:` line in the markdown BODY must never certify a park.
        local landed=0 confirm_body confirm_frontmatter
        if confirm_body=$(git -C "$repo_root" show "origin/main:intentions/${name}.md" 2>/dev/null); then
          confirm_frontmatter=$(awk 'NR==1&&/^---/{f=1;next} f&&/^---[[:space:]]*$/{exit} f' <<<"$confirm_body")
          if grep -q '^office_hours:' <<<"$confirm_frontmatter"; then
            if ! grep -qE '^office_hours:[[:space:]]*null[[:space:]]*$' <<<"$confirm_frontmatter"; then
              landed=1
            fi
          fi
        fi

        if (( landed )); then
          parked_count=$(( parked_count + 1 ))
          printf 'lib-frozen-session-park: parked %s (terminal-without-disposition after %ss; session=%s)\n' "$name" "$idle" "$sid" >&2
          _terminal_disposition_log_decision "$name" "$sid" "$idle" "parked"
          # Clear the session's escalation markers so a later sweep cannot re-land
          # stale text — mirroring dispatch-stop.sh's on-success cleanup, the one
          # behaviour of the deleted backstop worth keeping. Reached ONLY with the
          # park proven landed on origin/main, and ONLY for a job dir this node
          # actually owns: deleting another session's pending escalation markers
          # would destroy its park evidence.
          if (( job_owned )); then
            rm -f "$job_dir/office-hours-reason" "$job_dir/office-hours-recommendation" \
                  "$job_dir/office-hours-pr" 2>/dev/null || true
          fi
        else
          # Exit 0, but nothing landed. Loud and distinctly greppable, because
          # this is the shape that used to destroy the evidence silently: the
          # markers are KEPT so the next tick retries with the session's own
          # text, and the park is NOT counted.
          printf 'lib-frozen-session-park: park-not-landed for %s — park-node exited 0 but origin/main still shows no office_hours on intentions/%s.md; graph-commit exit 0 is not evidence a write landed (I2). KEEPING the escalation markers; will retry next tick\n' \
            "$name" "$name" >&2
          _terminal_disposition_log_decision "$name" "$sid" "$idle" "park-not-landed"
        fi
      elif (( rc == 3 )); then
        # NOT a park failure. park-node refused the compare-and-swap because the
        # node changed on origin/main after this sweep read it — it is already
        # parked, or already under human review. Nothing was written, nothing is
        # broken, and the correct response is to re-diagnose next tick, never to
        # retry without the base and never to park again
        # (.claude/skills/ref-diagnosis-time-cas/SKILL.md:73-83). The escalation
        # markers stay where the failure paths leave them: they are only ever
        # deleted from the confirmed-landed branch above.
        printf 'lib-frozen-session-park: stale-diagnosis skip for %s — intentions/%s.md on origin/main changed after this sweep read it (pinned base %s); park-node REFUSED rather than overwriting a park that landed in the meantime. Nothing was written, keeping the escalation markers; the next tick re-reads and re-decides\n' \
          "$name" "$name" "$diagnosis_blob" >&2
        _terminal_disposition_log_decision "$name" "$sid" "$idle" "stale-diagnosis"
      elif (( rc == 124 )); then
        # A timeout is just another park failure — same non-fatal handling, the
        # markers are retained, but it is named distinctly so a contended landing
        # lock is greppable as itself.
        printf 'lib-frozen-session-park: park failed for %s (park-node timed out after %ss); will retry next tick\n' "$name" "$park_timeout" >&2
        _terminal_disposition_log_decision "$name" "$sid" "$idle" "park-timeout"
      else
        # A park failure is never fatal to the sweep or the tick: log it, KEEP
        # the marker files so the retry can still use the session's own text,
        # and move on to the next candidate. The next tick retries.
        printf 'lib-frozen-session-park: park failed for %s (park-node exit %s); will retry next tick\n' "$name" "$rc" >&2
        _terminal_disposition_log_decision "$name" "$sid" "$idle" "park-failed"
      fi
    done

    printf 'lib-frozen-session-park: terminal-disposition sweep complete (terminal=%s parked=%s observing=%s unmeasurable=%s deferred=%s)\n' \
      "$terminal" "$parked_count" "$observing" "$unmeasurable" "$deferred" >&2
    return 0
  }

fi
