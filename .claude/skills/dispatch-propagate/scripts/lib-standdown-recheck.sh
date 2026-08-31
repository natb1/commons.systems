#!/usr/bin/env bash
# lib-standdown-recheck.sh — the stand-down ledger and its liveness re-check
# sweep for the duplicate-worker stand-down protocol.
#
# The failure this closes: two sessions get spawned for the same graph node.
# The session holding uncommitted work wins; the other stands down WITHOUT
# parking the node (a park would spuriously interrupt a node another session is
# actively working). That is correct — but only while the winner is actually
# still alive. When the winner dies mid-work (crash, OOM, API error, classifier
# denial), the loser waits forever on a session that no longer exists, holding
# the node with the fix unpushed. Nothing today re-checks that assumption: no
# liveness check, no timeout, no surfacing. The node is stranded, invisibly,
# with the work in a worktree nobody will push. (Observed in production
# 2026-07-31 and repaired by hand.)
#
# The design turns the stand-down from emergent session judgment into a durable
# record plus a re-check. A standing-down session writes a marker naming the
# winner (`origin=declared`); this sweep additionally records any duplicate it
# OBSERVES itself (`origin=observed`, no attributable winner). Every tick the
# sweep re-checks each marker against the live-session registry, and when the
# winner is DEFINITELY gone it parks the node to `office_hours` — the only place
# a human can actually recover the unpushed work.
#
# THE INVARIANT: a `declared` marker NEVER expires on age. There is no TTL, no
# grace, no idle term on that path. A stand-down waits as long as the winner
# lives, however long that is — only `claude_session_id_is_live` returning a
# DEFINITE 1 (registry queried successfully, no such session) advances the state
# machine. An age-based timeout here would park nodes that are being actively
# worked, which is precisely the interruption the stand-down protocol exists to
# avoid. The one idle-grace term in this file (rule (e)) applies ONLY on the
# `origin=observed` path, where there is no attributed winner to test, and it
# GATES A PARK — it never releases anything.
#
# Usage: source this file, then call:
#   standdown_dir
#   standdown_write   <node-id> <declared|observed> <winner-sid> <sessions-csv>
#   standdown_clear   <node-id>
#   standdown_exists  <node-id>
#   standdown_recheck_sweep
#
# The ledger is a directory of marker files at the SHARED project root
# (`<project-root>/tmp/dispatch-standdown/`), project-root-shared like the
# reservation ledger so concurrent ticks in different worktrees contend on one
# ledger. Each marker file is named exactly by the node id and carries four
# lines in this FIXED order (so a reader can
# `sed -n 's/^winner=//p' | head -n1` regardless):
#   origin=<declared|observed>
#   winner=<sid|>                  (empty when origin=observed)
#   sessions=<sid1,sid2,...>
#   observed=<epoch-seconds>
#
# `origin=declared` means a standing-down session explicitly named the winner
# (written by the `dispatch-standdown` CLI); `winner=` is authoritative there.
# `origin=observed` means this sweep itself saw two live sessions under the node
# name and cannot attribute the work to either, so `winner=` is empty.
#
# standdown_dir
#   Print the ledger directory path to stdout. If DISPATCH_STANDDOWN_DIR is set
#   and non-empty, print that (the test override, authoritative — bypasses the
#   git lookup, so no git repo is required). Otherwise print
#   `<resolve_project_root>/tmp/dispatch-standdown`. Shape copied from
#   `reservation_dir` in lib-reservation-ledger.sh.
#     return 0 — path printed.
#     return 1 — no override and not in a git repo; nothing printed.
#
# standdown_write <node-id> <origin> <winner-sid> <sessions-csv>
#   Write the marker file named exactly <node-id> with the four documented lines
#   in the documented order. <node-id> and <origin> are required; <origin> must
#   be `declared` or `observed`. <winner-sid> may be empty (and MUST be for
#   `observed`). The node id must be free of path separators, `..` components,
#   and control characters — the same defense-in-depth guard reservation_write
#   applies, so the name can never escape the ledger dir on the `mv`. The dir is
#   `mkdir -p -m 0700`'d first (owner-only: a host co-tenant must not be able to
#   read session ids out of markers nor forge one). The write is atomic — a
#   dot-prefixed `.tmp` tempfile in the SAME dir, then `mv` into place — so the
#   sweep never observes a partial marker.
#     return 0 — marker written.
#     return 1 — a missing/unsafe argument, an unresolvable ledger dir, or a
#               write/mv failure.
#
# standdown_clear <node-id>
#   Best-effort idempotent removal of the marker, behind the same path-safety
#   guard.
#     return 0 — file absent after the call (removed, never existed, or no
#               ledger dir).
#     return 1 — missing or unsafe argument only.
#
# standdown_exists <node-id>
#   Membership test behind the same guard: 0 if a marker named exactly <node-id>
#   exists, 1 otherwise (including a missing/unsafe argument or absent ledger).
#
# standdown_recheck_sweep
#   No arguments. Containment/observability only — it is NEVER a gate, so it
#   ALWAYS returns 0, on every path including an unqueryable daemon, an
#   unresolvable repo root, an unwritable ledger, and a failed `park-node`.
#   Every disposition is one greppable stderr line per node per pass, and the
#   sweep ends with EXACTLY ONE summary line.
#     return 0 — ALWAYS.
#
#   Step 0 — record observed duplicates. One
#   `claude_agents_list_duplicate_node_names` call. Each duplicated name with no
#   marker yet gets `standdown_write <name> observed "" <sids>` and a `recorded`
#   line. UNKNOWN (non-zero) records nothing (fail safe) but does NOT abort the
#   pass — the re-check loop still runs against the markers already on disk.
#
#   Then, for each marker file in the ledger dir (dotfiles and `.tmp*` files
#   skipped, exactly as reservation_sweep does), this rule ladder IN THIS EXACT
#   ORDER — the order is the correctness property:
#     a. node id fails the node-id regex → `unsafe-id`, keep, next.
#     b. origin=declared AND `claude_session_id_is_live <winner>` → `observing`,
#        next. NO AGE TERM. See THE INVARIANT above.
#     c. origin=observed AND >= 2 live sessions still named <node> →
#        `observing-pair`, next.
#     d. exactly 0 live sessions named <node> → clear the marker,
#        `cleared-no-live-session`, next. Nobody is waiting; nothing to park.
#     e. origin=observed AND the one surviving session is still working →
#        `observing`, next. "Still working" is TWO signals, either of which
#        alone means keep: its transcript idle time is under the grace, OR the
#        registry reports its status as `busy` (the same "actively working"
#        predicate `claude_agents_count_busy_workers` uses). The status term is
#        load-bearing: a transcript is only appended between tool calls, so a
#        session sitting inside ONE long call (a `gh run watch` over a slow CI
#        run, a long subagent fan-out) looks arbitrarily idle while being the
#        healthiest possible worker — parking it is exactly the spurious
#        interruption this protocol exists to avoid. The pair has resolved
#        itself into ordinary single-session work. This is the ONLY idle term in
#        this file and it gates a park, never a release; the
#        `tactic-stopped-session-blocks-node` sweep owns the complementary
#        "survivor stopped making progress" case.
#     f. node id absent from origin/main's `intentions/` → `not-a-node`, keep;
#        or the node is already parked → `already-parked`, keep. Next.
#        (Lazy `git fetch`, at most once per invocation, precedes this read.)
#     -  worktree directory missing, OR present but unreadable as a checkout
#        (the torn-removal state) → NO clear. It selects the no-worktree
#        reason variant of the park below and SKIPS both sync predicates, which
#        fail on a missing directory and would be misread as "unpushed". Rule
#        (d) has already returned on `n_live == 0`, so a marker reaching this
#        point is held by at least one live session — a missing worktree never
#        means the node is free, and it does NOT by itself mean no unpushed work
#        exists: `refs/heads/<node>` outlives its checkout, so that branch is
#        MEASURED and the park reports true/false/unknown from the measurement.
#        Two lanes never pre-provision one (`kind == strategy`, and the
#        `align-tactics` rung), so this is a normal state for a stranded node.
#        Those same two lanes are why a `false` from the branch measurement is
#        not the end of it: they leave UNCOMMITTED work in the shared
#        checkout, which no branch predicate can see, so the arm probes the
#        shared checkout (tracked AND untracked under `intentions/`) and
#        degrades to `unknown` on any dirt or on a failed probe. A torn
#        directory degrades to `unknown` for the same reason: the files are
#        still on disk and nothing can measure them. The readability probe is
#        itself TWO-VALUED and the two are never collapsed: rc 0 with a
#        toplevel that is not the path is a DEFINITE tear and keeps the
#        torn-removal language; a NON-ZERO rc is INDETERMINATE — a transient
#        git failure against a healthy LIVE checkout produces it too — so that
#        park reports the probe failure rather than asserting a tear, degrades
#        to `unknown`, and issues no destructive directive.
#     g. the park cap for this pass is spent → `deferred`, keep, next. A
#        no-worktree park consumes cap budget like any other.
#     h. the worktree is NOT in sync — BOTH `worktree_in_sync` and
#        `worktree_merged_in_sync` are false → PARK,
#        `standdown-winner-dead-work-unpushed`. The second predicate is what
#        keeps a post-squash-merge local merge commit from being misread as
#        stranded work. That tag is NOT exclusive to this rule: rule (i)'s
#        no-worktree arm files the same one whenever the surviving branch
#        measures unpushed work, so a triage grep for it must not assume a
#        readable worktree exists.
#     i. otherwise (node still held) → PARK. The tag follows the VERDICT, not
#        the arm, so "no worktree" does NOT imply the -no-worktree tag. The
#        no-worktree arm (checked FIRST) measures `refs/heads/<node>`, the
#        shared checkout, and the directory's readability, then files ONE of
#        three tags off the resulting `unpushed_flag`:
#          true    → `standdown-winner-dead-work-unpushed` — the SAME tag rule
#                    (h) files. A surviving branch carrying commits on no
#                    remote is at-risk work whether or not a checkout exists.
#          unknown → `standdown-winner-dead-work-unknown` — the arm could not
#                    rule out work at risk: an unmeasurable or broken branch, a
#                    torn directory, a readability probe that failed outright,
#                    or dirt in the shared checkout. It shares the
#                    `standdown-winner-dead-work-` prefix with the unpushed tag
#                    so ONE triage grep finds both, which is the whole point of
#                    not folding it into the -no-worktree tag documented as
#                    nothing-at-risk.
#          false   → `standdown-winner-dead-node-held-no-worktree` — and ONLY
#                    here. This tag means "measured, nothing at risk under the
#                    node id", never merely "the directory was missing".
#        With a readable worktree there are two tags and both are rule (h)'s
#        business: `standdown-winner-dead-work-unpushed` (not in sync) and
#        `standdown-winner-dead-node-held` (in sync).
#        So the triage greps are: `standdown-winner-dead-work-` for everything
#        that may carry work at risk (three of the four tags, across BOTH
#        arms), and `-node-held-no-worktree` / `-node-held` for the two
#        measured all-clears.
#
#   Fail-safe posture: if EITHER underlying liveness call is UNKNOWN, every
#   marker is treated as `observing` for the pass and nothing is parked or
#   cleared. An unreadable transcript is UNKNOWN too and means "keep". The only
#   paths that park require a DEFINITELY-absent winner.
#
#   One `git fetch` per invocation at most, and it is LAZY: it runs only when a
#   marker actually reaches rule (f), so a pass with nothing to adjudicate does
#   no network I/O. Park cap: `park-node` pushes to `main` through
#   `graph-commit`'s landing lock, so an unbounded batch would serialize N
#   pushes inside one tick; excess candidates are deferred to the next pass.
#
# Environment overrides (all optional; each integer-valued one is
# integer-guarded, falling back to its default on a malformed value):
#   DISPATCH_STANDDOWN_DIR            Ledger directory. When set, the helper does
#                                     NOT require a git repo (bypasses
#                                     resolve_project_root). Default:
#                                     <project-root>/tmp/dispatch-standdown.
#   DISPATCH_STANDDOWN_NOW_EPOCH      Pinned clock (epoch seconds), for the
#                                     `observed=` stamp and the idle math.
#                                     Default: `date -u +%s`.
#   DISPATCH_STANDDOWN_IDLE_GRACE_S   Rule (e) transcript-idle grace, seconds.
#                                     Default: 900 (matching the frozen-session
#                                     sweep's grace).
#   DISPATCH_STANDDOWN_PARK_MAX       Maximum parks per invocation. Default: 3.
#   DISPATCH_STANDDOWN_PROJECTS_ROOT  Transcript store root. Default:
#                                     $HOME/.claude/projects.
#   DISPATCH_STANDDOWN_REPO_ROOT      Repo root for the `git show origin/main:`
#                                     reads and the worktree-path derivation.
#                                     Default: resolve_project_root (lib.sh).
#   DISPATCH_STANDDOWN_PARK_NODE      park-node path. Default:
#                                     <repo-root>/packages/intentionsutil/
#                                     scripts/park-node.
# Respected via the libraries this file sources, NOT redefined here:
#   CLAUDE_AGENTS_CMD                 lib-claude-agents.sh — replaces the
#                                     `claude` invocation (testable, no daemon).
#   DISPATCH_AGENTS_SNAPSHOT          lib-claude-agents.sh — per-tick registry
#                                     snapshot reused across machine-wide calls.
#   DISPATCH_DECISION_LOG_DIR / _FILE lib-decision-log.sh — the JSONL sink.
#
# Sandbox: the liveness queries reach the local Claude daemon over a Unix
# socket, so callers must run this with `dangerouslyDisableSandbox: true` — see
# `.claude/rules/sandbox.md`. A sandboxed call yields `[]`, a definite "no
# sessions", which would clear markers rather than park them.
#
# Safe to source multiple times. Does NOT use set -e (must return, not exit).
#
# Side effect: sourcing this file once sets `-u` and `-o pipefail` in the caller
# shell (via its own load-guard, and transitively via the siblings below).

# Source siblings via BASH_SOURCE dirname, matching lib-reservation-ledger.sh
# and lib-frozen-session-park.sh. lib.sh is plain function definitions; the
# other three are load-guarded. lib-decision-log.sh is sourced non-fatally — its
# log is a best-effort observability sink, exactly as dispatch-select-tick
# sources it.
_lsr_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$_lsr_dir/lib.sh"
# shellcheck source=lib-claude-agents.sh
source "$_lsr_dir/lib-claude-agents.sh"
# shellcheck source=lib-worktree-in-sync.sh
source "$_lsr_dir/lib-worktree-in-sync.sh"
# shellcheck source=/dev/null
source "$_lsr_dir/lib-decision-log.sh" 2>/dev/null || true

if [[ -z "${_LIB_STANDDOWN_RECHECK_LOADED:-}" ]]; then
  _LIB_STANDDOWN_RECHECK_LOADED=1

  set -uo pipefail

  # standdown_dir — print the ledger directory path.
  # See the header comment for the return-code contract.
  standdown_dir() {
    if [[ -n "${DISPATCH_STANDDOWN_DIR:-}" ]]; then
      printf '%s\n' "$DISPATCH_STANDDOWN_DIR"
      return 0
    fi
    local root
    root=$(resolve_project_root) || return 1
    printf '%s\n' "$root/tmp/dispatch-standdown"
    return 0
  }

  # _standdown_id_is_safe <node-id> — the shared path-safety guard. The marker is
  # named exactly by the node id, so a value carrying a path separator, a `..`
  # component, or a control character could escape the ledger dir on the `mv` /
  # `rm`. Copied from reservation_write's guard.
  _standdown_id_is_safe() {
    case "${1:-}" in
      *..*|*/*|*[[:cntrl:]]*) return 1 ;;
    esac
    return 0
  }

  # standdown_write <node-id> <origin> <winner-sid> <sessions-csv> — record a
  # stand-down. See the header comment for the format and return-code contract.
  standdown_write() {
    local node="${1:-}" origin="${2:-}" winner="${3:-}" sessions="${4:-}"
    if [[ -z "$node" || -z "$origin" ]]; then
      printf 'lib-standdown-recheck: standdown_write requires <node-id> <origin> <winner-sid> <sessions-csv>\n' >&2
      return 1
    fi
    if [[ "$origin" != "declared" && "$origin" != "observed" ]]; then
      printf 'lib-standdown-recheck: standdown_write: origin must be declared or observed, got %q\n' "$origin" >&2
      return 1
    fi
    if ! _standdown_id_is_safe "$node"; then
      printf 'lib-standdown-recheck: standdown_write: unsafe node-id %q\n' "$node" >&2
      return 1
    fi

    local dir
    dir=$(standdown_dir) || {
      printf 'lib-standdown-recheck: standdown_write could not resolve the ledger dir (not in a git repo and DISPATCH_STANDDOWN_DIR unset)\n' >&2
      return 1
    }
    # Owner-only (0700), same rationale as the reservation ledger: a co-tenant
    # must not read session ids out of markers nor inject a forged one.
    mkdir -p -m 0700 "$dir" || return 1

    local now
    if [[ "${DISPATCH_STANDDOWN_NOW_EPOCH:-}" =~ ^[0-9]+$ ]]; then
      now="$DISPATCH_STANDDOWN_NOW_EPOCH"
    else
      now=$(date -u +%s)
    fi

    # Atomic write: dot-prefixed `.tmp` tempfile in the SAME dir (so the `mv` is
    # a rename within one filesystem), then rename into place.
    local tmpfile="$dir/.${node}.$$.tmp"
    {
      printf 'origin=%s\n' "$origin"
      printf 'winner=%s\n' "$winner"
      printf 'sessions=%s\n' "$sessions"
      printf 'observed=%s\n' "$now"
    } >"$tmpfile" || { rm -f "$tmpfile" 2>/dev/null; return 1; }

    if ! mv -f "$tmpfile" "$dir/$node"; then
      rm -f "$tmpfile" 2>/dev/null
      return 1
    fi
    return 0
  }

  # standdown_clear <node-id> — best-effort idempotent removal.
  standdown_clear() {
    local node="${1:-}"
    if [[ -z "$node" ]]; then
      printf 'lib-standdown-recheck: standdown_clear requires a <node-id> argument\n' >&2
      return 1
    fi
    if ! _standdown_id_is_safe "$node"; then
      printf 'lib-standdown-recheck: standdown_clear: unsafe node-id %q\n' "$node" >&2
      return 1
    fi
    local dir
    # Unresolvable ledger dir → nothing to clear (best-effort cleanup).
    dir=$(standdown_dir) || return 0
    rm -f "$dir/$node" 2>/dev/null || true
    return 0
  }

  # standdown_exists <node-id> — marker membership test.
  standdown_exists() {
    local node="${1:-}"
    if [[ -z "$node" ]]; then
      printf 'lib-standdown-recheck: standdown_exists requires a <node-id> argument\n' >&2
      return 1
    fi
    if ! _standdown_id_is_safe "$node"; then
      printf 'lib-standdown-recheck: standdown_exists: unsafe node-id %q\n' "$node" >&2
      return 1
    fi
    local dir
    dir=$(standdown_dir) || return 1
    [[ -f "$dir/$node" ]]
  }

  # _standdown_session_idle_s <sid> — print the session's transcript idle time in
  # seconds. The transcript lives at <projects-root>/<project>/<sid>.jsonl —
  # keyed on the globally-unique session id, so the project-dir slug (a mangling
  # of the session's cwd) never has to be reconstructed. Takes the NEWEST mtime
  # across matches. No match, or an unreadable mtime, is UNKNOWN: return 1 with
  # no output, which every caller treats as "keep".
  #
  # This block deliberately DUPLICATES the equivalent block in
  # lib-frozen-session-park.sh. That sibling is not merged to main yet (it lands
  # on its own branch), so there is no shared helper to call; extracting one is a
  # follow-up once both are on main, not this unit's job.
  _standdown_session_idle_s() {
    local sid="${1:-}" now="${2:-}"
    [[ -n "$sid" ]] || return 1
    # The sid feeds a `find -name` glob; validate its shape at this edge (input
    # validation at a system boundary), matching lib-frozen-session-park.sh.
    [[ "$sid" =~ ^[0-9a-fA-F-]+$ ]] || return 1
    local projects_root="${DISPATCH_STANDDOWN_PROJECTS_ROOT:-$HOME/.claude/projects}"
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

  # _standdown_log_decision <node> <origin> <winner> <survivors> <unpushed> <disposition>
  # — append one best-effort JSONL decision record. Mirrors
  # dispatch-select-tick's _dlog_select_emit and lib-frozen-session-park's own
  # helper: build with `jq -c -n`, hand to `decision_log_append` behind a
  # `command -v` guard, never fail the caller. <unpushed> is "true"/"false"
  # when measured, "unknown" when the question was asked and could not be
  # answered (→ the JSON string "unknown"), or empty for a disposition where
  # the question does not arise (→ null). "unknown" and null are DISTINCT on
  # purpose: collapsing both to null made an unanswered measurement read exactly
  # like one never taken, in the durable record an operator acts on. MEASURED
  # 2026-08-30: nothing outside this file reads `.unpushed`, so the added string
  # value breaks no consumer.
  _standdown_log_decision() {
    local node="$1" origin="$2" winner="$3" survivors="$4" unpushed="$5" disposition="$6"
    local json
    json=$(jq -c -n \
      --arg ts          "$(date -u +%FT%TZ)" \
      --arg site        "standdown-recheck-sweep" \
      --arg node        "$node" \
      --arg origin      "$origin" \
      --arg winner      "$winner" \
      --arg survivors   "$survivors" \
      --arg unpushed    "$unpushed" \
      --arg disposition "$disposition" \
      '
      {
        ts:          $ts,
        site:        $site,
        node:        $node,
        origin:      $origin,
        winner:      $winner,
        survivors:   $survivors,
        unpushed:    (if $unpushed == "true" then true
                      elif $unpushed == "false" then false
                      elif $unpushed == "unknown" then "unknown"
                      else null end),
        disposition: $disposition
      }' 2>/dev/null) || return 0
    command -v decision_log_append >/dev/null 2>&1 && decision_log_append "$json" || true
    return 0
  }

  # standdown_recheck_sweep — record observed duplicates, then re-check every
  # marker against the live-session registry. See the header comment for the full
  # rule ladder and the fail-safe posture. ALWAYS returns 0.
  standdown_recheck_sweep() {
    local markers=0 recorded=0 parked_count=0 observing=0 cleared=0 deferred=0

    # --- tunables, computed ONCE ---------------------------------------------
    local now
    if [[ "${DISPATCH_STANDDOWN_NOW_EPOCH:-}" =~ ^[0-9]+$ ]]; then
      now="$DISPATCH_STANDDOWN_NOW_EPOCH"
    else
      now=$(date -u +%s)
    fi
    local grace="${DISPATCH_STANDDOWN_IDLE_GRACE_S:-900}"
    [[ "$grace" =~ ^[0-9]+$ ]] || grace=900
    local park_max="${DISPATCH_STANDDOWN_PARK_MAX:-3}"
    [[ "$park_max" =~ ^[0-9]+$ ]] || park_max=3

    # --- Step 0: observe duplicates -------------------------------------------
    # One duplicate-name query. UNKNOWN records nothing (fail safe) but does not
    # abort the pass: the re-check loop below still runs against the markers
    # already on disk.
    local unknown=0 dups="" dup_name dup_sids
    if ! dups=$(claude_agents_list_duplicate_node_names); then
      unknown=1
      dups=""
      printf 'lib-standdown-recheck: duplicate-name query unqueryable; recording nothing this pass\n' >&2
    fi
    if [[ -n "$dups" ]]; then
      while IFS=$'\t' read -r dup_name dup_sids; do
        [[ -n "$dup_name" && -n "$dup_sids" ]] || continue
        _standdown_id_is_safe "$dup_name" || continue
        if standdown_exists "$dup_name"; then
          continue
        fi
        if standdown_write "$dup_name" observed "" "$dup_sids"; then
          recorded=$(( recorded + 1 ))
          printf 'lib-standdown-recheck: recorded %s (observed duplicate; sessions=%s)\n' "$dup_name" "$dup_sids" >&2
          _standdown_log_decision "$dup_name" "observed" "" "$dup_sids" "" "recorded"
        else
          printf 'lib-standdown-recheck: could not record observed duplicate %s (ledger unwritable)\n' "$dup_name" >&2
        fi
      done <<<"$dups"
    fi

    # --- the live-session-name index ------------------------------------------
    # One machine-wide fetch supplies the per-name survivor set for EVERY marker
    # (the duplicate query above only covers names with >= 2 sessions; a name
    # with 0 or 1 needs this). UNKNOWN from either query folds into `unknown`,
    # under which every marker is `observing` and nothing is parked or cleared.
    local all="" line rest sid status name
    declare -A live_sids=()
    declare -A live_count=()
    declare -A sid_status=()
    if ! all=$(claude_agents_list_all); then
      unknown=1
      all=""
      printf 'lib-standdown-recheck: session registry unqueryable; observing every marker this pass\n' >&2
    fi
    if [[ -n "$all" ]]; then
      while IFS= read -r line; do
        # Split the 3-column TSV BY HAND. `IFS=$'\t' read -r sid status name`
        # cannot be used here: TAB is IFS whitespace, so bash collapses a RUN of
        # tabs into one delimiter, and the daemon reports `status: null` — which
        # `@tsv` renders as an EMPTY middle field — for every held/blocked
        # session. That is precisely the session a stand-down leaves behind, so
        # the collapsing parse would drop the surviving loser from this index,
        # read n_live as 0, and let rule (d) silently clear the marker.
        [[ "$line" == *$'\t'*$'\t'* ]] || continue
        sid="${line%%$'\t'*}"
        rest="${line#*$'\t'}"
        status="${rest%%$'\t'*}"
        name="${rest#*$'\t'}"
        [[ -n "$name" && -n "$sid" ]] || continue
        if [[ -z "${live_sids[$name]:-}" ]]; then
          live_sids["$name"]="$sid"
        else
          live_sids["$name"]="${live_sids[$name]},$sid"
        fi
        live_count["$name"]=$(( ${live_count[$name]:-0} + 1 ))
        # Keyed by sid, not name: rule (e) tests the ONE survivor's own status.
        sid_status["$sid"]="$status"
      done <<<"$all"
    fi

    # --- the ledger ------------------------------------------------------------
    local dir
    if ! dir=$(standdown_dir) || [[ ! -d "$dir" ]]; then
      printf 'lib-standdown-recheck: sweep complete (markers=%s recorded=%s parked=%s observing=%s cleared=%s deferred=%s)\n' \
        "$markers" "$recorded" "$parked_count" "$observing" "$cleared" "$deferred" >&2
      return 0
    fi

    # --- the repo root ---------------------------------------------------------
    local repo_root="${DISPATCH_STANDDOWN_REPO_ROOT:-}"
    if [[ -z "$repo_root" ]]; then
      repo_root=$(resolve_project_root) || repo_root=""
    fi
    if [[ -z "$repo_root" ]]; then
      printf 'lib-standdown-recheck: repo root unresolvable; parking nothing\n' >&2
      printf 'lib-standdown-recheck: sweep complete (markers=%s recorded=%s parked=%s observing=%s cleared=%s deferred=%s)\n' \
        "$markers" "$recorded" "$parked_count" "$observing" "$cleared" "$deferred" >&2
      return 0
    fi
    local park_node="${DISPATCH_STANDDOWN_PARK_NODE:-$repo_root/packages/intentionsutil/scripts/park-node}"
    # verify-landed — the shared primitive that confirms a park actually
    # landed on origin/main (see the park block below). Resolved from THIS
    # FILE's own on-disk location (`_lsr_dir`), not from `$repo_root` (the
    # repo being SWEPT, which in tests is a bare scratch fixture with no
    # `node_modules`): verify-landed's own header explains it must run out of
    # its OWN checkout (for `node --import tsx/esm` to resolve) while taking
    # the repo to inspect as a `-C` argument — the same split
    # lib-frozen-session-park.sh's two sweeps use. A missing/non-executable
    # copy just falls back to "not landed" at the call site (fail-safe).
    local verify_landed="$_lsr_dir/../../../../packages/intentionsutil/scripts/verify-landed"

    # The lazy-fetch latch: at most one `git fetch` per invocation, and none at
    # all when no marker reaches rule (f).
    local fetched=0

    local had_nullglob=0
    shopt -q nullglob && had_nullglob=1
    shopt -s nullglob
    local f node m_origin m_winner m_sessions survivors n_live idle
    for f in "$dir"/*; do
      # Regular files directly in the dir only. The default glob already excludes
      # the dot-prefixed `.tmp` in-flight tempfiles from standdown_write; the
      # explicit `.tmp` test covers any non-dot variant.
      [[ -f "$f" ]] || continue
      node=$(basename "$f")
      case "$node" in .*|*.tmp*) continue ;; esac
      markers=$(( markers + 1 ))

      m_origin=$(sed -n 's/^origin=//p' "$f" 2>/dev/null | head -n1)
      m_winner=$(sed -n 's/^winner=//p' "$f" 2>/dev/null | head -n1)
      m_sessions=$(sed -n 's/^sessions=//p' "$f" 2>/dev/null | head -n1)

      # UNKNOWN liveness → observe everything, park and clear nothing. Checked
      # ahead of the ladder so a daemon hiccup can never advance a marker.
      if (( unknown )); then
        observing=$(( observing + 1 ))
        printf 'lib-standdown-recheck: observing %s (liveness unknown this pass; taking no action)\n' "$node" >&2
        continue
      fi

      survivors="${live_sids[$node]:-}"
      n_live="${live_count[$node]:-0}"

      # (a) The node id becomes a path component in the `git show origin/main:`
      # read and the worktree-path derivation below, so validate its shape at
      # this edge with the SAME node-id regex office-hours-graph applies before
      # provisioning. A clear skip beats an opaque git failure — or a path
      # escape — downstream. The marker is KEPT: a human should see it.
      if [[ ! "$node" =~ ^[a-z][a-z0-9]*(-[a-z0-9]+)*$ ]]; then
        printf 'lib-standdown-recheck: unsafe-id %s (marker name is not a valid node id); keeping marker, taking no action\n' "$node" >&2
        continue
      fi

      # (b) THE INVARIANT. A `declared` stand-down waits as long as its winner
      # lives — however long that is. There is NO age term here, deliberately:
      # an aged-out declared marker would park a node another session is
      # actively working, which is exactly the interruption the stand-down
      # protocol exists to avoid. Only a DEFINITE absence (the registry queried
      # successfully with no such session id) advances past this rule;
      # claude_session_id_is_live folds UNKNOWN into "live" for that reason.
      if [[ "$m_origin" == "declared" ]]; then
        if [[ -z "$m_winner" ]]; then
          # A declared marker with no winner is malformed — it names no session
          # to test. Treat it like an unreadable marker: keep and flag, never
          # park (an empty winner must not be conflated with a dead one).
          printf 'lib-standdown-recheck: observing %s (declared marker has no winner= line; malformed, keeping)\n' "$node" >&2
          observing=$(( observing + 1 ))
          continue
        fi
        if claude_session_id_is_live "$m_winner"; then
          observing=$(( observing + 1 ))
          printf 'lib-standdown-recheck: observing %s (declared winner %s is still live; age-independent, no timeout applies)\n' \
            "$node" "$m_winner" >&2
          continue
        fi
      fi

      # (c) An observed pair that is still a pair: two live sessions under the
      # node name, neither attributable. Nothing has resolved yet.
      if [[ "$m_origin" == "observed" ]] && (( n_live >= 2 )); then
        observing=$(( observing + 1 ))
        printf 'lib-standdown-recheck: observing-pair %s (%s live sessions still registered under this name)\n' "$node" "$n_live" >&2
        continue
      fi

      # (d) Nobody is left holding the node. There is no loser waiting on a dead
      # winner, so there is nothing to surface — drop the marker.
      if (( n_live == 0 )); then
        standdown_clear "$node"
        cleared=$(( cleared + 1 ))
        printf 'lib-standdown-recheck: cleared-no-live-session %s (no live session under this name remains)\n' "$node" >&2
        _standdown_log_decision "$node" "$m_origin" "$m_winner" "$survivors" "" "cleared-no-live-session"
        continue
      fi

      # (e) An observed pair that shrank to one, whose survivor is still making
      # progress. The pair resolved itself into ordinary single-session work;
      # parking would interrupt it. This is the ONLY idle term in this file, it
      # applies ONLY on the observed path (there is no attributed winner to
      # test), and it gates a PARK — never a release. The complementary case (a
      # survivor that stopped making progress but still holds the node) belongs
      # to `tactic-stopped-session-blocks-node`, not here. An unmeasurable idle
      # is UNKNOWN → keep.
      #
      # TWO independent "still working" signals, either sufficient to keep:
      # transcript idle under the grace, and a registry status of `busy`. The
      # status term exists because the transcript is only appended BETWEEN tool
      # calls — a session inside one long call (a `gh run watch` over a slow CI
      # run, a long subagent fan-out) reads as arbitrarily idle while being the
      # healthiest possible worker. A stood-down loser is never `busy`: the
      # daemon reports it `status: null` / `state: blocked` while the Stop hook
      # holds it, so this gate narrows the false-park window without closing the
      # park path this sweep exists to open.
      if [[ "$m_origin" == "observed" ]] && (( n_live == 1 )); then
        if ! idle=$(_standdown_session_idle_s "$survivors" "$now"); then
          observing=$(( observing + 1 ))
          printf 'lib-standdown-recheck: observing %s (survivor %s transcript unreadable — idle unmeasurable, keeping)\n' \
            "$node" "$survivors" >&2
          continue
        fi
        if (( idle < grace )); then
          observing=$(( observing + 1 ))
          printf 'lib-standdown-recheck: observing %s (survivor %s idle_seconds=%s < grace_seconds=%s; still progressing)\n' \
            "$node" "$survivors" "$idle" "$grace" >&2
          continue
        fi
        if [[ "${sid_status[$survivors]:-}" == "busy" ]]; then
          observing=$(( observing + 1 ))
          printf 'lib-standdown-recheck: observing %s (survivor %s reports status=busy — actively working inside a long tool call; idle_seconds=%s ignored)\n' \
            "$node" "$survivors" "$idle" >&2
          continue
        fi
      fi

      # (f) Lazy fetch, once per sweep, then the origin/main reads. A fetch
      # failure is non-fatal: fall back to whatever `origin/main` ref this
      # checkout already has rather than blocking the sweep on a network blip
      # (copied from office-hours-graph / lib-frozen-session-park).
      if (( fetched == 0 )); then
        git -C "$repo_root" fetch origin main --quiet 2>/dev/null || true
        fetched=1
      fi

      local body
      if ! body=$(git -C "$repo_root" show "origin/main:intentions/${node}.md" 2>/dev/null); then
        printf 'lib-standdown-recheck: not-a-node %s (no intentions/%s.md on origin/main); keeping marker\n' "$node" "$node" >&2
        continue
      fi

      # Already parked. The frontmatter scoping below is load-bearing:
      # restricting the test to the YAML block (between the first two `---`
      # fences) means a column-0 `office_hours:` line in the markdown BODY
      # (documentation of the serialization) can never be misread as park
      # state. Same frontmatter-scoped, column-0-anchored idiom
      # `node_kind_on_main` in `packages/intentionsutil/scripts/office-hours-graph`
      # uses, deliberately inlined here rather than shared.
      local frontmatter parked_already=0
      frontmatter=$(awk 'NR==1&&/^---/{f=1;next} f&&/^---[[:space:]]*$/{exit} f' <<<"$body")
      if grep -q '^office_hours:' <<<"$frontmatter"; then
        if ! grep -qE '^office_hours:[[:space:]]*null[[:space:]]*$' <<<"$frontmatter"; then
          parked_already=1
        fi
      fi
      if (( parked_already )); then
        printf 'lib-standdown-recheck: already-parked %s (office_hours is already non-null on origin/main); keeping marker\n' "$node" >&2
        continue
      fi

      # Worktree path, DERIVED (never read from the daemon), mirroring
      # dispatch-graph-execute's CONFLICT_WT composition. A MISSING directory
      # does NOT mean the node is free: rule (d) has already returned for
      # n_live == 0, so at this point at least one live session still holds the
      # node name. Nor does it prove no unpushed work exists —
      # `refs/heads/<node>` outlives its checkout, so the no-worktree arm below
      # MEASURES that branch instead of inferring safety from `[[ -d ]]`.
      # Two lanes never
      # pre-provision a worktree at all (dispatch-graph-execute: kind ==
      # strategy, and the align-tactics rung of the tactic lane both spawn with
      # --cwd "$PROJECT_ROOT"), so "no worktree" is a NORMAL state for a
      # genuinely stranded node. It therefore selects the no-worktree
      # REASON VARIANT below and skips the sync predicates (both fail on a
      # missing dir and would be misread as "unpushed"). It never clears:
      # clearing here would erase the only durable record of a stand-down whose
      # holder is still live.
      local wt="$repo_root/.claude/worktrees/$node"
      local no_wt=0 torn_wt=0 unreadable_wt=0
      # `-d` alone is not "a usable checkout". A TORN removal -- the state a
      # sandboxed `git worktree remove` leaves behind, and the state this whole
      # arm exists to survive -- leaves the path PRESENT while git can no longer
      # read it. Such a path used to skip the no-worktree arm entirely and fall
      # into rule (h), where both sync predicates fail their `git -C` and return
      # 1: the park then read "the winner left work UNPUSHED in $wt", printed
      # `<unavailable>` for the head, and told the operator to push from a
      # checkout git cannot open. Measure readability; never infer it from the
      # directory's existence.
      if [[ -d "$wt" ]]; then
        # NOT `rev-parse --git-dir`: the worktrees root lives INSIDE the repo
        # working tree, so from a torn checkout git simply walks UP and answers
        # with the parent repo's .git -- success, and the tear goes undetected.
        # Ask instead whether this path is its own toplevel, which is true of a
        # live worktree and false of both tear shapes (a dangling .git file
        # errors; a missing one resolves to the parent repo root).
        #
        # TWO OUTCOMES, never collapsed. rc 0 with a toplevel that is not $wt
        # is DEFINITE: git read the path and it is not its own worktree, which
        # is exactly the tear shape described above. A NON-ZERO rc is
        # INDETERMINATE -- it covers a real tear AND a transient failure
        # against a perfectly healthy, live, in-use checkout: the `bwrap: Can't
        # get type of source .../config.worktree` class this repo already
        # tracks, and `index.lock` contention. The old `|| wt_top=""` threw the
        # rc away and made both set torn_wt=1, so a single blip filed a park
        # that asserted a torn removal as FACT and told the operator to
        # `rm -rf` the directory -- the one command that destroys the live
        # session's uncommitted work this arm exists to protect. Unmeasurable
        # reports UNKNOWN, never "safe" and never a fact; the same posture the
        # branch measurement below already honours.
        local wt_top="" wt_top_rc=0
        wt_top=$(git -C "$wt" rev-parse --show-toplevel 2>/dev/null) || wt_top_rc=$?
        if (( wt_top_rc != 0 )); then
          no_wt=1
          unreadable_wt=1
        elif ! [[ "$wt_top" -ef "$wt" ]]; then
          # rc 0 and an answer, so this is determinate. An empty answer cannot
          # be `-ef` anything and lands here too, which is the correct arm: git
          # succeeded, so whatever it said is a measurement.
          no_wt=1
          torn_wt=1
        fi
      else
        no_wt=1
      fi

      # (g) Cap. Excess candidates are deferred to the next pass rather than
      # serializing N graph-commit landing-lock pushes inside this one.
      if (( parked_count >= park_max )); then
        deferred=$(( deferred + 1 ))
        printf 'lib-standdown-recheck: deferred %s (park cap %s reached this sweep)\n' "$node" "$park_max" >&2
        continue
      fi

      # (h)/(i) The park. BOTH sync predicates must be false for "work is
      # stranded": worktree_merged_in_sync is what keeps a post-squash-merge
      # local merge commit (which `rev-list --not --remotes` over-counts as
      # unpushed) from being misread as stranded work.
      local unpushed_flag reason_tag reason recommendation unpushed_head="" rec_wt_clause
      local unpushed_count="" branch_clause=""
      if (( no_wt )); then
        # FIRST arm, so the sync predicates are never called on a missing
        # directory: both return 1 when `git -C` fails, which rule (h) would
        # read as stranded unpushed work in a worktree that does not exist.
        # A missing checkout does NOT prove a missing branch, so the safety of
        # this arm is MEASURED, never inferred from `[[ -d ]]`. `git worktree
        # remove` -- and the `rm -rf` + `git worktree prune` recovery that a
        # torn sandboxed removal requires -- both leave `refs/heads/<node>`
        # behind carrying its commits, and provision-node-worktree re-attaches
        # that same branch rather than recutting it (it runs `worktree add
        # "$WT" "$NODE_ID"` whenever `rev-parse --verify` succeeds). The same
        # gap opens when the session claimed its worktree under a name other
        # than the node id, which native `EnterWorktree` permits and which every
        # worktree on this host in fact does.
        #
        # Unmeasurable reports UNKNOWN, never "safe": this park record is the
        # durable artifact the operator acts on, and telling them there is
        # nothing to look at is worse than telling them we could not tell.
        # `branch_clause` (what the park RECORDS) and `rec_wt_clause` (what it
        # TELLS THE OPERATOR TO DO) are set TOGETHER in each arm, from the one
        # measurement that justifies both. They used to be built in two
        # separate if/else chains further apart in this function, and they
        # drifted: the recommendation asserted "fully merged into origin/main"
        # in the very arm where no branch existed to measure. Keep them
        # adjacent so that cannot recur.
        local rev_rc=0 rev_err=""
        # stderr is CAPTURED, not discarded, because rc 1 covers two states that
        # must not be reported the same way: the ref is genuinely ABSENT, or it
        # exists and is BROKEN (a torn ref write -- a state this repo already
        # expects from torn sandboxed worktree removals). The old `2>&1`
        # discarded the only thing that tells them apart.
        #
        # MEASURED on this host, git 2.55.0:
        #   absent            -> rc 1, stderr ''
        #   garbage loose ref -> rc 1, stderr 'warning: ignoring broken ref <ref>'
        #   empty loose ref   -> rc 1, stderr 'warning: ignoring broken ref <ref>'
        #   unreachable sha   -> rc 0, stderr ''   (handled by the arms below)
        #
        # A broken ref reported as "no branch exists" issues an all-clear over
        # commits that are still recoverable from .git/logs/refs/heads/<node>.
        # That is the exact failure class this arm exists to close, and it
        # contradicts the arm's own "unmeasurable reports UNKNOWN" posture.
        #
        # LC_ALL=C is LOad-BEARING, not hygiene. The discriminator below is a
        # substring match on git's own warning text, and git LOCALIZES warnings.
        # Under a translated locale the match fails, a broken ref reclassifies as
        # ABSENT, and the arm issues exactly the false all-clear it was written
        # to prevent -- silently, on the one input that matters.
        rev_err=$(LC_ALL=C git -C "$repo_root" rev-parse --verify --quiet "refs/heads/$node" 2>&1 >/dev/null) || rev_rc=$?
        if (( rev_rc == 1 )) && [[ "$rev_err" == *"broken ref"* ]]; then
          unpushed_flag="unknown"
          branch_clause="A ref for refs/heads/$node exists but is BROKEN (git reported: $rev_err), so whether unpushed work survives is UNKNOWN -- do not assume there is none."
          rec_wt_clause="No worktree exists at $wt, and refs/heads/$node is a BROKEN ref -- do NOT assume nothing is at risk. Its commits may still be recoverable: read '$repo_root/.git/logs/refs/heads/$node' and repair the ref before releasing the node."
        elif (( rev_rc == 1 )); then
          # rc 1 is specifically "no such ref". MEASURED on this host: an absent
          # branch AND a corrupt or empty loose ref all exit 1 (the corrupt one
          # with `warning: ignoring broken ref`), while an unreadable repository
          # exits 128 -- which is why 128 is handled as UNKNOWN below rather
          # than folded in here.
          #
          # Determinate about THIS ref, and about nothing else. A session may
          # claim its checkout under a name other than the node id -- native
          # EnterWorktree permits it, and every worktree on this host in fact
          # does (agent-<hash> or a slug) -- and its commits then sit on a
          # branch this check never looks at. So the verdict is `false` because
          # that is what was measured, and the prose says what was measured
          # instead of issuing an unscoped all-clear.
          unpushed_flag="false"
          branch_clause="No branch refs/heads/$node exists either, so no unpushed work survives under the node id. NOTE: a session that claimed its checkout under a different name would have left its branch under that name, which this check does not see."
          rec_wt_clause="No worktree exists at $wt and no branch refs/heads/$node exists, so there is nothing to recut under the node id — do NOT create one. If the holder claimed its checkout under another name, list candidates with 'git -C $repo_root branch --no-merged origin/main' before releasing the node."
        elif (( rev_rc != 0 )); then
          unpushed_flag="unknown"
          branch_clause="Whether branch refs/heads/$node exists could not be determined (git rev-parse exited $rev_rc, neither 0 nor 1), so whether unpushed work survives is UNKNOWN -- do not assume there is none."
          rec_wt_clause="No worktree exists at $wt, and whether branch refs/heads/$node even exists could not be determined -- do NOT assume nothing is at risk. Re-run 'git -C $repo_root rev-parse --verify refs/heads/$node' and resolve the repository error before proceeding."
        else
          # TWO predicates, in this order -- the same pair rule (h) already
          # uses five lines below via worktree_in_sync (lib-worktree-in-sync.sh:62)
          # and worktree_merged_in_sync (:103). The two arms must not reach
          # OPPOSITE verdicts on identical repository state merely because one
          # has a checkout to look at and the other does not.
          #
          # (1) REACHABILITY, not "unmerged". `origin/main..<branch>` answers
          #     "is it unmerged", which is a different question. A branch already
          #     pushed to origin/<node> is entirely safe and still counts ahead
          #     of origin/main. Ask instead whether any commit sits on NO remote.
          #     MEASURED: pushed-to-own-remote -> `origin/main..` 1, but
          #     `--not --remotes` 0.
          # (2) TREE IDENTITY as the fallback, for the squash merge. MEASURED on
          #     git 2.55.0: after a squash merge the ahead-count is 1 while
          #     `git diff --quiet origin/main <branch>` exits 0. Post-merge with
          #     the worktree reaped is the NORMAL end state in this fleet, so
          #     counting alone told the operator that an already-landed branch
          #     was "at risk" and to recut it and "push it FIRST" -- resurrecting
          #     work that had already landed.
          local diff_rc=0
          unpushed_count=$(git -C "$repo_root" rev-list --count "refs/heads/$node" --not --remotes 2>/dev/null) || unpushed_count=""
          if ! [[ "$unpushed_count" =~ ^[0-9]+$ ]]; then
            unpushed_flag="unknown"
            branch_clause="Branch refs/heads/$node exists but its unpushed-commit count could not be measured, so whether unpushed work survives is UNKNOWN -- check it before assuming there is none."
            rec_wt_clause="No worktree exists at $wt, and branch refs/heads/$node could not be measured -- do NOT assume nothing is at risk. Check 'git -C $repo_root rev-list --count refs/heads/$node --not --remotes' before proceeding."
          elif (( unpushed_count == 0 )); then
            unpushed_flag="false"
            branch_clause="Branch refs/heads/$node is fully reachable from a remote ref (0 commits on no remote), so no unpushed work survives under the node id."
            rec_wt_clause="No worktree exists at $wt and every commit on branch refs/heads/$node is already on a remote, so no unpushed work is at risk — do NOT create one."
          else
            git -C "$repo_root" diff --quiet origin/main "refs/heads/$node" 2>/dev/null || diff_rc=$?
            if (( diff_rc == 0 )); then
              unpushed_flag="false"
              branch_clause="Branch refs/heads/$node carries $unpushed_count commit(s) on no remote, but its tree is IDENTICAL to origin/main — the signature of a squash merge that already landed. No unpushed work survives under the node id."
              rec_wt_clause="No worktree exists at $wt, and branch refs/heads/$node has a tree identical to origin/main (already landed, squash-merged), so no unpushed work is at risk — do NOT create one."
            elif (( diff_rc == 1 )); then
              unpushed_flag="true"
              branch_clause="Branch refs/heads/$node survived the missing checkout and still carries $unpushed_count commit(s) not on any remote, with a tree that differs from origin/main. That work is at risk."
              # `worktree prune` FIRST: the torn sandboxed removal this arm exists
              # for leaves the registration under .git/worktrees/ behind, and
              # `worktree add` refuses while that stale entry is present.
              rec_wt_clause="No worktree exists at $wt, but branch refs/heads/$node still carries $unpushed_count commit(s) not on any remote. Recut the checkout with 'git -C $repo_root worktree prune && git -C $repo_root worktree add $wt $node', verify that work, and push it FIRST."
            else
              unpushed_flag="unknown"
              branch_clause="Branch refs/heads/$node carries $unpushed_count commit(s) on no remote, but comparing its tree against origin/main failed (git diff exited $diff_rc), so whether that work already landed is UNKNOWN -- do not assume it did."
              rec_wt_clause="No worktree exists at $wt, and branch refs/heads/$node could not be compared against origin/main -- do NOT assume nothing is at risk. Re-run 'git -C $repo_root diff --quiet origin/main refs/heads/$node' and resolve the repository error before proceeding."
            fi
          fi
        fi
        if (( torn_wt )); then
          branch_clause="A directory exists at $wt but git cannot read it as a checkout -- the torn-removal state -- so it was measured as if absent. $branch_clause"
          # A tear destroys the .git link while LEAVING THE FILES on disk.
          # Nothing above can see them: they were never committed, so
          # refs/heads/<node> says nothing about them, and the directory is
          # unreadable as a checkout so no status probe reaches them. A
          # "false" here is therefore an all-clear issued over work that is
          # still sitting there.
          if [[ "$unpushed_flag" == "false" ]]; then
            unpushed_flag="unknown"
            branch_clause="$branch_clause Whether that directory still holds UNCOMMITTED work is UNKNOWN: a tear leaves the session's files in place while destroying the .git link, so no branch measurement above can see them."
          fi
          # SALVAGE BEFORE rm -rf. The previous ordering opened the
          # recommendation with the one command that destroys the thing
          # this arm exists to protect.
          rec_wt_clause="A directory exists at $wt but git cannot read it as a checkout (a torn removal). SALVAGE FIRST: inspect $wt and copy out any uncommitted work, because the next step destroys it permanently. Only then clear it with 'rm -rf $wt && git -C $repo_root worktree prune'. $rec_wt_clause"
        elif (( unreadable_wt )); then
          # INDETERMINATE, and it must not borrow the torn arm's language. The
          # probe exited non-zero, which a healthy live checkout can also
          # produce, so this park states what FAILED instead of asserting what
          # the directory IS -- and it issues NO destructive directive at all.
          # An `rm -rf` here would be aimed at a path that may still hold a
          # running session's uncommitted work, on the strength of a probe that
          # did not run.
          branch_clause="A directory exists at $wt but the checkout probe FAILED (git rev-parse --show-toplevel exited $wt_top_rc), so whether it is a torn removal or a healthy live checkout is UNKNOWN -- a transient git failure against a live checkout produces this rc too. $branch_clause"
          if [[ "$unpushed_flag" == "false" ]]; then
            unpushed_flag="unknown"
            branch_clause="$branch_clause Whether that directory holds work is UNKNOWN for the same reason: nothing above could read it."
          fi
          rec_wt_clause="A directory exists at $wt but the checkout probe FAILED (git rev-parse --show-toplevel exited $wt_top_rc). Do NOT delete it: this rc does not distinguish a torn removal from a transient git failure against a live checkout still in use. Re-run 'git -C $wt rev-parse --show-toplevel' and resolve the repository error FIRST; only once the directory is confirmed unreadable AND abandoned does the torn-removal recovery apply. $rec_wt_clause"
        fi

        # Every measurement above asks about refs/heads/<node>. Two lanes never
        # create that ref at all: kind == strategy, and the align-tactics rung,
        # both of which spawn with --cwd pointing at the SHARED checkout rather
        # than at a per-node worktree. Their at-risk work is UNCOMMITTED there,
        # which no branch predicate can see -- so a "false" verdict here would be
        # an all-clear issued over precisely this arm's motivating case.
        #
        # Dirt in the shared checkout is NOT attributed to this node: any session
        # may have left it, and claiming otherwise would be a different lie. The
        # verdict degrades to UNKNOWN and names the thing to go look at, which is
        # this arm's stated "unmeasurable reports UNKNOWN, never safe" posture.
        if [[ "$unpushed_flag" != "true" ]]; then
          local shared_dirty="" shared_dirty_rc=0 shared_dirty_count=0
          local shared_untracked="" shared_untracked_rc=0 shared_untracked_count=0
          shared_dirty=$(git -C "$repo_root" status --porcelain --untracked-files=no 2>/dev/null) || shared_dirty_rc=$?
          # The dominant shape of shared-checkout work is a NEW FILE: a
          # strategy or align-tactics session writes intentions/<id>.md and
          # dies before committing it. --untracked-files=no cannot see that,
          # so the probe read clean and the park issued an all-clear over
          # precisely this arm's motivating case. worktrees/ is already
          # gitignored, so -uno was never needed for noise control; scoping
          # the untracked probe to intentions/ keeps it targeted anyway.
          shared_untracked=$(git -C "$repo_root" ls-files --others --exclude-standard -- intentions 2>/dev/null) || shared_untracked_rc=$?
          if (( shared_dirty_rc != 0 || shared_untracked_rc != 0 )); then
            # Unmeasurable reports UNKNOWN, never safe -- the posture every
            # other failure path in this arm already honours. Falling through
            # with the verdict still "false" would issue an all-clear on the
            # strength of a probe that did not run.
            unpushed_flag="unknown"
            branch_clause="$branch_clause However, the shared checkout at $repo_root could not be inspected (git status exited $shared_dirty_rc, ls-files exited $shared_untracked_rc). Sessions spawned against the shared checkout rather than a per-node worktree (kind == strategy, and the align-tactics rung) leave their work THERE and never create refs/heads/$node, so whether any is at risk is UNKNOWN."
            rec_wt_clause="$rec_wt_clause Before releasing the node, resolve the repository error and re-run 'git -C $repo_root status --porcelain' and 'git -C $repo_root ls-files --others --exclude-standard -- intentions': until those succeed, nothing rules out work left in the shared checkout."
          elif [[ -n "$shared_dirty" || -n "$shared_untracked" ]]; then
            # Explicit `if`, not `[[ ]] && cmd`: under errexit a false test
            # makes the compound return non-zero and takes the caller down.
            shared_dirty_count=0
            if [[ -n "$shared_dirty" ]]; then
              shared_dirty_count=$(printf '%s\n' "$shared_dirty" | wc -l | tr -d ' ')
            fi
            if [[ -n "$shared_untracked" ]]; then
              shared_untracked_count=$(printf '%s\n' "$shared_untracked" | wc -l | tr -d ' ')
            fi
            unpushed_flag="unknown"
            branch_clause="$branch_clause However, the shared checkout at $repo_root holds $shared_dirty_count uncommitted tracked file(s) and $shared_untracked_count untracked file(s) under intentions/. Sessions spawned against the shared checkout rather than a per-node worktree (kind == strategy, and the align-tactics rung) leave their work THERE and never create refs/heads/$node, so none of it would appear in any branch measurement above. Whether any of it belongs to this node is UNKNOWN."
            rec_wt_clause="$rec_wt_clause Before releasing the node, inspect the shared checkout: 'git -C $repo_root status --porcelain' for the $shared_dirty_count uncommitted tracked file(s), and 'git -C $repo_root ls-files --others --exclude-standard -- intentions' for the $shared_untracked_count untracked one(s). A session that ran against the shared checkout leaves its work there, not on a branch, and a node body it never committed is untracked."
          fi
        fi

        # The tag follows the VERDICT, not the arm. Filing a park that carries
        # stranded work under the tag the header ladder documents as "nothing at
        # risk" hides it from the triage grep that looks for the unpushed tag.
        if [[ "$unpushed_flag" == "true" ]]; then
          reason_tag="standdown-winner-dead-work-unpushed"
        elif [[ "$unpushed_flag" == "unknown" ]]; then
          # Shares the `standdown-winner-dead-work-` prefix so ONE triage
          # grep finds both it and -unpushed. Tagging an UNKNOWN as
          # -node-held-no-worktree filed a park whose own text says commits
          # may be recoverable from the reflog under the tag the header
          # ladder documents as "nothing at risk" -- the exact defect the
          # comment above claims to close, one verdict over.
          reason_tag="standdown-winner-dead-work-unknown"
        else
          reason_tag="standdown-winner-dead-node-held-no-worktree"
        fi
        printf -v reason \
          '%s: a session stood down for this node in favour of winner session %s, which is no longer registered with the Claude daemon. No usable worktree exists at %s. %s The node is still held by session(s) %s waiting on a session that no longer exists, so nothing will advance it without intervention.' \
          "$reason_tag" "${m_winner:-(unattributed — observed duplicate, no winner declared)}" "$wt" "$branch_clause" "${survivors:-none}"
      elif ! worktree_in_sync "$wt" && ! worktree_merged_in_sync "$wt"; then
        unpushed_flag="true"
        reason_tag="standdown-winner-dead-work-unpushed"
        # Never fatal: any git failure yields an empty head summary.
        unpushed_head=$(git -C "$wt" log --oneline -n 3 origin/main..HEAD 2>/dev/null) || unpushed_head=""
        printf -v reason \
          'standdown-winner-dead-work-unpushed: a session stood down for this node in favour of winner session %s, which is no longer registered with the Claude daemon (crash, OOM, API error, or classifier denial). The stand-down is unconditional on the winner living, so the standing-down session(s) %s are still waiting on a session that no longer exists, and the winner left work UNPUSHED in %s. Unpushed head (origin/main..HEAD): %s' \
          "${m_winner:-(unattributed — observed duplicate, no winner declared)}" \
          "${survivors:-none}" "$wt" "${unpushed_head:-<unavailable>}"
      else
        unpushed_flag="false"
        reason_tag="standdown-winner-dead-node-held"
        printf -v reason \
          'standdown-winner-dead-node-held: a session stood down for this node in favour of winner session %s, which is no longer registered with the Claude daemon. No work is unpushed — the worktree at %s is clean and fully pushed — but the node is still held by session(s) %s waiting on a session that no longer exists, so nothing will advance it without intervention.' \
          "${m_winner:-(unattributed — observed duplicate, no winner declared)}" "$wt" "${survivors:-none}"
      fi
      # One shared template; only the worktree sentence varies, so the long
      # prose below is never duplicated per reason variant. In the no-worktree
      # arm `rec_wt_clause` was already set beside the branch measurement that
      # justifies it (above), so only the has-worktree default is set here.
      if (( ! no_wt )); then
        rec_wt_clause="If the worktree at $wt has unpushed commits, verify them and push them from there FIRST."
      fi
      recommendation="Find the holding job with 'claude agents --all' and attach it ('claude attach <job-id>') to see where it stopped. $rec_wt_clause To release the holding session use 'claude stop <job-id>' — NEVER 'claude rm', which deletes the session AND its worktree, destroying any unpushed work still in the shared worktree. Once the work is safe and the session is stopped, run 'clear-park -C <repo-root> $node' to return the node to the lane. Accepted residual: while a live session still holds the node-id session name, office-hours reports this node as 'all-held' rather than launching a review session for it — that is expected, not a bug."

      local rc=0
      "$park_node" "$node" "$reason" "$recommendation" >/dev/null || rc=$?
      if (( rc == 0 )); then
        # Confirm the park actually LANDED before counting it. `park-node`
        # lands through `graph-commit`, and invariant I2 is explicit that a
        # `graph-commit` exit 0 is never evidence that anything reached
        # `origin/main` — so the exit code alone does not get to authorize
        # counting this as a park. Re-read the node from a freshly fetched
        # `origin/main` via the shared `verify-landed` primitive
        # (three-valued: `unknown` is never treated as landed — the fail-safe
        # direction). The fetch is mandatory here, not latched with rule
        # (f)'s: the park just run is exactly what made this checkout's
        # `origin/main` stale, so a confirmation read against the pre-park
        # ref would report every park as not-landed. `--no-fetch` on the
        # verify-landed call itself: this explicit fetch is the one that
        # counts against the sweep's own fetch budget, so verify-landed must
        # not fetch a second time.
        git -C "$repo_root" fetch origin main --quiet 2>/dev/null || true
        # The node id and the predicate are SEPARATE arguments (`--node` /
        # `--jq`), never a concatenated `"${node}@..."` spec: an id containing
        # `@` used to become jq source, and an id ending in `@true #` comments
        # out the predicate and forges `landed` for any node. `$node` here is
        # read off a stand-down marker filename, not written in this file, so
        # the charset is also checked locally — a malformed id fails closed
        # (marker kept, park not counted).
        local landed=0 vl_rc=0
        if [[ ! "$node" =~ ^[A-Za-z0-9._-]+$ ]]; then
          printf 'lib-standdown-recheck: refusing to confirm a park for malformed node id %q — ids must match ^[A-Za-z0-9._-]+$; KEEPING the marker\n' "$node" >&2
        elif [[ -x "$verify_landed" ]]; then
          "$verify_landed" --no-fetch -C "$repo_root" --node "$node" --jq '.office_hours != null' \
            >/dev/null 2>&1 || vl_rc=$?
          (( vl_rc == 0 )) && landed=1
        fi
        if (( landed )); then
          parked_count=$(( parked_count + 1 ))
          printf 'lib-standdown-recheck: parked %s (%s; winner=%s survivors=%s)\n' \
            "$node" "$reason_tag" "${m_winner:-none}" "${survivors:-none}" >&2
          _standdown_log_decision "$node" "$m_origin" "$m_winner" "$survivors" "$unpushed_flag" "parked"
        else
          # Exit 0, but nothing landed (or verify-landed itself could not
          # determine the outcome — `unknown` is never counted as landed).
          # Loud and distinctly greppable: the marker is KEPT so the next
          # pass retries, and the park is NOT counted.
          printf 'lib-standdown-recheck: park-not-landed for %s — park-node exited 0 but origin/main still shows no office_hours on intentions/%s.md; graph-commit exit 0 is not evidence a write landed (I2). KEEPING the marker; will retry next tick\n' \
            "$node" "$node" >&2
          _standdown_log_decision "$node" "$m_origin" "$m_winner" "$survivors" "$unpushed_flag" "park-not-landed"
        fi
      else
        # A park failure is never fatal to the sweep or the tick: log it, KEEP
        # the marker so the next pass retries, and move on.
        printf 'lib-standdown-recheck: park failed for %s (park-node exit %s); keeping marker, will retry next tick\n' "$node" "$rc" >&2
        _standdown_log_decision "$node" "$m_origin" "$m_winner" "$survivors" "$unpushed_flag" "park-failed"
      fi
    done
    (( had_nullglob )) || shopt -u nullglob

    printf 'lib-standdown-recheck: sweep complete (markers=%s recorded=%s parked=%s observing=%s cleared=%s deferred=%s)\n' \
      "$markers" "$recorded" "$parked_count" "$observing" "$cleared" "$deferred" >&2
    return 0
  }

fi
