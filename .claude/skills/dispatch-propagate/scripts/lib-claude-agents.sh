#!/usr/bin/env bash
# lib-claude-agents.sh — sourceable helper for Claude session liveness.
#
# /dispatch-propagate must know whether a git worktree currently has a live Claude
# session in it, so it never opens a second session on a worktree another
# session owns. This helper answers that against `claude agents --json`, the
# daemon-backed registry of live sessions (Claude Code >= 2.1.146), replacing
# the brittle /proc-walk previously duplicated across dispatch scripts.
#
# Usage: source this file, then call:
#   claude_sessions_under              <worktree-path>
#   claude_sessions_with_name          <name>
#   claude_agents_list_all
#   claude_agents_list_registered
#   live_session_claimed_nums
#   worktree_has_live_session          <worktree-path> [exclude_sid]
#   worktree_occupancy_state           <worktree-path> [exclude_sid]
#   worktree_code_review_lock_path     <worktree-path>
#   claude_agents_count_busy_workers
#   claude_agents_list_blocked_workers
#   claude_agents_count_held_for_debug
#   claude_agents_list_terminal_workers
#   verify_agent_registered_under      <agent-name> <cwd>
#   verify_agent_registered_under_state <agent-name> <cwd>
#   claude_agents_snapshot_capture            <path>
#   claude_agents_snapshot_capture_registered <path>
#   claude_job_id_for_name_all         <name>
#   claude_session_id_is_live          <sid>
#   claude_agents_list_duplicate_node_names
#   claude_agents_registry_reachable
#
# EMPTY-READ CORROBORATION. `claude agents --json` reaches the daemon over a
# Unix socket. A blocked read (sandbox, network-namespace isolation) exits 0 and
# prints `[]` — byte-identical to a genuine "no live sessions". Five functions
# therefore refuse to trust an exactly-`[]` payload on its own: they corroborate
# it with `claude_agents_registry_reachable` (a `pgrep -f 'claude daemon'`
# process probe, a mechanism the socket failure does not share) and fold an
# uncorroborated `[]` into UNKNOWN, with one stderr line naming the remedy:
#   claude_sessions_under, claude_agents_list_all, claude_agents_list_registered,
#   claude_agents_count_busy_workers  → UNKNOWN (return 1)
#   claude_session_id_is_live         → UNKNOWN folds to LIVE (return 0 with
#                                       CLAUDE_SESSION_ID_LIVE_STATE=unknown),
#                                       this function's inverted contract
# The probe runs AFTER the `claude agents` invocation, never before: the daemon
# is spawned on demand by the first `claude` call, so probing first would report
# "no daemon" on a genuinely idle host and defer forever. A NON-empty array is
# self-corroborating (a blocked read cannot invent rows) and is never gated by
# the probe. The RAW payload is classified, never a projection — a `--cwd` or
# name filter legitimately yields zero rows from a non-empty array.
# Deliberately NOT hardened: claude_sessions_with_name,
# claude_sessions_with_name_all, claude_sessions_with_name_prefix_all,
# claude_job_id_for_name_all, claude_agents_count_held_for_debug, and
# claude_agents_list_duplicate_node_names (covered transitively via
# claude_agents_list_all); and the two snapshot writers
# (claude_agents_snapshot_capture / _capture_registered), since an
# uncorroborated `[]` snapshot is re-classified on every read — refusing to
# write it would only force extra live round-trips without changing a verdict.
#
# claude_sessions_under <path>
#   The cwd-based low-level primitive. Runs `claude agents --json --cwd <path>`,
#   which filters server-side to sessions started under <path>.
#     return 0 — daemon queried successfully. Stdout carries one tab-separated
#               line per live session: sessionId<TAB>pid<TAB>status<TAB>name.
#               Zero sessions (`[]`) → return 0 with empty stdout: this is a
#               definite "no sessions", NOT a failure.
#     return 1 — UNKNOWN. The daemon could not be queried: `claude` missing,
#               non-zero exit, output that is not a JSON array, or an
#               exactly-`[]` payload no visible `claude daemon` process
#               corroborates (see EMPTY-READ CORROBORATION above). Stdout is
#               empty. Callers MUST treat unknown as occupied/active, never as
#               free.
#   Used by `dispatch-launch-worker` / `dispatch-spawn-job` to filter on
#   SPAWN_CWD — callers that want cwd-based semantics.
#
# claude_sessions_with_name <name>
#   The name-based low-level primitive. Runs `claude agents --json` (NO --cwd
#   flag) and filters client-side to sessions whose `name` field exactly equals
#   <name>.
#     return 0 — daemon queried successfully. Stdout carries one tab-separated
#               line per matching session: sessionId<TAB>pid<TAB>status<TAB>name.
#               Zero matches → return 0 with empty stdout: definite "no sessions".
#     return 1 — UNKNOWN. Same contract as `claude_sessions_under`: `claude`
#               missing, non-zero exit, non-array output, or zero exit with
#               empty output. Stdout is empty.
#
# claude_sessions_with_name_all <name>
#   The office-hours selector's name-based state lookup. Like
#   `claude_sessions_with_name`, but (a) runs `claude agents --json --all` so
#   completed sessions (`state: "done"`, hidden from the active-only default) are
#   visible, and (b) projects `sessionId<TAB>state` (the granular `state`, the
#   discriminator the selector gates on) instead of the pid/status TSV. It queries
#   `claude agents --json --all` DIRECTLY — NOT via `_claude_agents_raw` — because
#   the tick snapshot (DISPATCH_AGENTS_SNAPSHOT) is captured without `--all` and so
#   lacks the `done` rows this helper exists to surface; reading the snapshot would
#   silently hide them.
#   The DIRECT query (bypassing the snapshot) is a FRESHNESS requirement, not a
#   scoping one: this helper backs the office-hours attach path, which must observe
#   the daemon's current answer and must not read a tick-old snapshot. That is why
#   it does not go through `_claude_agents_raw_registered` either, even though that
#   sibling now offers a snapshot-backed REGISTERED view.
#   Occupancy no longer borrows this helper's `--all` view: it has its own
#   registered accessors (`_claude_agents_raw_registered` /
#   `claude_agents_list_registered`), which `worktree_has_live_session` reads — a
#   registered-but-done session keeps blocking its node by design. See the
#   "ACTIVE vs REGISTERED" section below. The ACTIVE-view helpers
#   (`claude_sessions_with_name`, `claude_agents_list_all`, `_claude_agents_raw`,
#   `claude_agents_count_busy_workers`) stay untouched: they answer "is a process
#   running right now?", and making `done` sessions visible there would break the
#   pace budget, the spawn-registration race, and the dead-router reservation
#   reclaim.
#     return 0 — daemon queried successfully. Stdout carries one tab-separated
#               line per matching session: sessionId<TAB>state. Zero matches →
#               return 0 with empty stdout: definite "no sessions".
#     return 1 — UNKNOWN. Same contract as `claude_sessions_with_name`: `claude`
#               missing, non-zero exit, non-array output, or zero exit with
#               empty output. Stdout is empty.
#
# claude_agents_list_all
#   The unfiltered machine-wide primitive. Runs `claude agents --json` (NO --cwd
#   flag, NO name filter) and projects every live session to a three-column TSV.
#   The reservation-ledger sweep needs the full live-session set — ids, statuses,
#   and names — in a single daemon query, so it can reconcile every marker
#   against both the live-session-id set and the live-session-name set without
#   re-querying per marker.
#     return 0 — daemon queried successfully. Stdout carries one tab-separated
#               line per live session: sessionId<TAB>status<TAB>name (THREE
#               columns — no pid, unlike `claude_sessions_under` /
#               `claude_sessions_with_name`). Zero sessions (`[]`) → return 0
#               with empty stdout: a definite "no sessions", NOT a failure.
#     return 1 — UNKNOWN. Same contract as `claude_sessions_under`: `claude`
#               missing, non-zero exit, non-array output, zero exit with
#               whitespace-only output, or an uncorroborated `[]` (EMPTY-READ
#               CORROBORATION above). Stdout is empty. Callers MUST treat
#               unknown as "cannot reconcile" and reclaim nothing (fail safe).
#
# worktree_has_live_session <path> [exclude_sid]
#   The ergonomic fail-safe predicate. Name-keyed, two-name check against a
#   SINGLE `claude_agents_list_registered` fetch (not two
#   `claude_sessions_with_name` calls — one daemon round-trip per worktree on
#   dispatch-sweep's hot path). It reads the REGISTERED view (`claude agents
#   --json --all`), so a session that has STOPPED but has not been `claude rm`'d
#   still occupies its worktree: registration IS the claim, and releasing it is an
#   explicit human act.
#   Exact-matches the live-session name column against BOTH the worktree basename
#   (matching the worker session spawned with `--name=<basename>` by
#   `dispatch-launch-worker`) AND `office-hours-<N>`, where <N> is the basename's
#   numeric prefix (matching the office-hours session, renamed off the basename
#   in #1311 and carrying no reservation-ledger marker). The second name is only
#   formed when the basename actually starts with `<digits>-` (a legacy issue
#   worktree); a graph-node worktree (`tactic-*` / `strategy-*`) has no numeric
#   prefix, so it is matched on its basename alone — never on a shared
#   `office-hours-tactic`-style key, which one registration would use to claim
#   every node worktree at once, permanently (the registered view has no
#   expiry). Reports occupied if either name matches a live session or the
#   query is UNKNOWN. Folds unknown
#   into the occupied branch:
#     return 0 — occupied OR unknown: do NOT start a session under <path>.
#     return 1 — definitely no live session under either name for the worktree.
#   `if worktree_has_live_session <path>` is fail-safe by construction.
#   Optional second argument `exclude_sid` — a live-session id to treat as "not
#   another session": a matching row whose sessionId (column 1) equals it does
#   NOT count as a live claim, even when its name matches. This is the caller's
#   own session id, so a session spawned with `--name=<basename>` (e.g. the
#   graph strategy-lane `/align-tactics` orchestrator, spawned by
#   `dispatch-graph-execute` with `--name "$id"`) does not match its own
#   just-spawned session as a pre-existing claim. Omitted or empty → default
#   behavior, byte-identical to a plain `<path>` check.
#   Worktree coupling: `claude rm <id>` deletes the session row AND its worktree;
#   a plain `stop` deletes neither. This predicate does NOT depend on that
#   coupling — it is keyed on the worktree basename via the registry row, not on
#   the worktree's presence on disk. If only the session row is removed, the
#   worktree unblocks regardless of whether the checkout itself survived;
#   `dispatch-resolve-worktree` re-provisions it if needed.
#   NO TIMEOUT. The block is permanent until a human releases it with
#   `claude rm <id>`. Do NOT add an age cutoff, grace period, or auto-expiry —
#   that would reintroduce exactly the silent expiry this design removes.
#   Accumulation of held nodes is the intended trade: containment (the stopped
#   session survives for inspection) over throughput.
#
# claude_agents_count_busy_workers
#   Counts live sessions that are actively working: `name` matches `^[0-9]+-`
#   (the real worker `<N>-<slug>` shape) AND `status == "busy"`, machine-wide
#   (no `--cwd` filter). `^[0-9]+-` excludes routers (named `dispatch-<short-id>`).
#   `status == "busy"` excludes idle / input-blocked / stopped workers, because
#   those do not consume the concurrency/token budget the gate paces. On a single
#   dev machine this is acceptable; if two separate checkouts run in parallel,
#   their busy worker sessions are counted together, inflating the count and
#   gating spawning too aggressively — fail-safe (errs toward fewer workers). An
#   over-count from a stray busy human session is fail-safe too (it throttles
#   spawning). Used by the dispatch router's concurrency gate before deciding
#   whether to spawn one more. Same UNKNOWN contract as `claude_sessions_under`:
#   a count of `0` is a definite "no matches", non-zero return is "could not
#   determine" — and an exactly-`[]` read counts as definite only when a visible
#   `claude daemon` process corroborates it (EMPTY-READ CORROBORATION above), so
#   a blocked read can no longer manufacture spawn headroom.
#     return 0 — daemon queried successfully. Stdout is a single integer (>=0)
#               line: the count of matching sessions.
#     return 1 — UNKNOWN. Stdout is empty. Callers MUST defer rather than
#               assume headroom: `dispatch-select-tick` and `graph-select-target`
#               both fail CLOSED on this return (concurrency-cap disposition),
#               not fail open. `dispatch-spawn-job`'s per-worktree dedup is NOT
#               an independent backstop here — it calls `claude_sessions_under`,
#               which shares the same daemon-read ambiguity this function does,
#               so it cannot be trusted to catch what an UNKNOWN busy-count
#               read let through. (This is the 2026-07-21 incident this
#               contract closes: an uncorroborated empty `claude agents --json`
#               read was indistinguishable from a genuine "no live sessions",
#               so a manual tick fell through to GAP=1 and launched a duplicate
#               `/implement` worker onto an already-occupied worktree.)
#
# verify_agent_registered_under <agent-name> <cwd>
#   Bounded retry of `claude_sessions_under` that closes the async-registration
#   race between `claude --bg` returning and the daemon adding the new agent to
#   `claude agents --json`. Polls the registry up to 5 times at 200 ms spacing —
#   4 sleeps, not 5, since the last attempt is not followed by a sleep
#   (≈0.8 s total budget). On any attempt where a non-`stopped` row appears whose
#   `name` column equals `<agent-name>`, returns 0 immediately — a `stopped` row
#   is skipped so only a live successor counts (mirrors the spawn-script dedup
#   guards). A non-numeric interval override (e.g. `inf`) is rejected in favour
#   of the 0.2 s default so a malformed value cannot hang the verify. UNKNOWN
#   results from
#   `claude_sessions_under` are treated as "not yet" and retried — a daemon
#   momentarily unresponsive during async registration is exactly the case the
#   retry is meant to absorb. On exhaustion, returns 1 — the conservative-fail
#   semantic is preserved so the caller still surfaces its `did not register`
#   diagnostic and exits non-zero.
#     return 0 — a row with the given <agent-name> was observed.
#     return 1 — exhaustion: the agent never appeared within the budget.
#   Used by `dispatch-launch-worker` / `dispatch-spawn-job` Step 4 verify.
#   THIS BOOLEAN CONFLATES TWO OUTCOMES. `return 1` means either "the registry
#   answered and the agent is not there" or "the registry could not be asked at
#   all". A caller whose response to a failed verify is destructive — releasing
#   a claim, say — MUST NOT use it: use
#   `verify_agent_registered_under_state` below and act on the token.
#
# verify_agent_registered_under_state <agent-name> <cwd>
#   The granular verify: same probe, same budget, same seam, but it reports
#   WHICH of the two `return 1` outcomes happened. Prints exactly ONE token on
#   stdout and ALWAYS returns 0 — the same token-not-exit-code contract
#   `worktree_occupancy_state` uses, and for the same reason: there are three
#   outcomes, not two.
#
#     registered — an attempt observed a non-`stopped` row named <agent-name>.
#     absent     — at least one attempt was a DEFINITE read (`claude_sessions_under`
#                  returned 0) and no attempt matched the name. The agent really
#                  is not registered.
#     unknown    — EVERY attempt was UNKNOWN (`claude` missing, non-zero exit,
#                  non-array payload, or an uncorroborated `[]`). NOT evidence
#                  of anything: the registry was never read. Callers MUST NOT
#                  treat this as absence — in particular, must not release a
#                  reservation, reap a worktree, or declare a phantom spawn on
#                  it, because a real worker may be booting behind an
#                  unanswerable daemon.
#
#   Also sets VERIFY_AGENT_REGISTERED_STATE (mirrors stdout).
#   CAVEAT — that global is observable ONLY on a DIRECT call:
#       verify_agent_registered_under_state "$n" "$cwd" >/dev/null  # global set
#       st=$(verify_agent_registered_under_state "$n" "$cwd")       # NOT set
#   Command substitution runs the function in a subshell, so the assignment dies
#   with it. The TOKEN is the contract; the global is a convenience for callers
#   that already redirect stdout (see worktree_occupancy_state's identical
#   CAVEAT).
#
# claude_session_id_is_live <sid>
#   The winner-liveness predicate for the duplicate-worker stand-down protocol.
#   Queries `claude agents --json --all` DIRECTLY — with `--all`, and NOT via
#   `claude_agents_list_all` / `_claude_agents_raw`. This is load-bearing, not a
#   style choice: the default (active-only) listing HIDES a session that stopped
#   but was never `claude rm`'d (`state: "done"` / `stopped`), and that is the
#   COMMON state for a stand-down winner — a Stop-hook-held or errored session
#   whose fix is still uncommitted in the SHARED worktree. Reading the
#   active-only listing would report such a winner as definitely gone, and the
#   documented `winner-absent` response ("become the worker itself") would take
#   over that worktree and destroy the winner's uncommitted work — exactly the
#   loss this protocol exists to prevent. The tick snapshot
#   (DISPATCH_AGENTS_SNAPSHOT) is bypassed for the same reason
#   `claude_sessions_with_name_all` bypasses it: it is captured without `--all`
#   and so lacks the very rows this predicate must see.
#   Matches `.sessionId` with jq's exact `==`, never a substring test — session
#   ids share prefixes, so a substring match could conflate two distinct sessions.
#   This is the SAME fail-safe posture as `worktree_has_live_session`
#   (occupied-on-unknown), applied to a session id instead of a worktree name —
#   the inversion is load-bearing: a caller parking a node on `return 1` must
#   never park because the daemon hiccupped.
#   THREE registry states are distinguished, folded into two return codes so the
#   fail-safe direction is preserved for every existing boolean caller:
#     return 0 — LIVE or STOPPED-BUT-PRESENT: <sid> matched a row in a
#               successfully-queried registry (whatever its state), OR the
#               registry could not be queried (UNKNOWN folds to live).
#     return 1 — ABSENT: the registry was queried successfully WITH `--all` and
#               no row's sessionId equals <sid>. The session is gone from the
#               daemon entirely — only then is "definitely not live" true.
#   The granular verdict is published in the global CLAUDE_SESSION_ID_LIVE_STATE,
#   set on EVERY call to exactly one of:
#     live     — present and in a non-terminal state (working/busy/waiting/idle/…)
#     stopped  — present but in a terminal state (done/stopped/killed/failed/…):
#               the session is finished yet still registered, so its worktree may
#               still hold uncommitted work. Callers that want to report a
#               distinct `winner-stopped` disposition read this — it must
#               ESCALATE, never invite a peer to take over the worktree.
#     absent   — queried successfully, no such session (the only `return 1`).
#     unknown  — the registry could not be queried, no <sid> was passed, or the
#               read returned an exactly-`[]` array no visible `claude daemon`
#               process corroborates (EMPTY-READ CORROBORATION above). An
#               uncorroborated `[]` must never resolve to `absent`.
#   Callers that ignore the variable keep byte-identical two-state behavior.
#   Empty/missing <sid>: prints a stderr diagnostic and returns 0 (fail safe),
#   mirroring `worktree_has_live_session`'s own empty-arg handling.
#
# claude_agents_list_duplicate_node_names
#   The observed-pair detector for the duplicate-worker stand-down protocol.
#   Takes no arguments. One `claude_agents_list_all` fetch, then keeps only rows
#   whose name (column 3) matches the graph-node worker shape `^tactic-|^strategy-`
#   — the same keyspace `claude_agents_count_busy_workers` counts — which
#   excludes routers (`dispatch-<short-id>`) and legacy `<N>-slug` issue workers
#   (those have no graph node to park). Groups by name and emits one line per
#   name with TWO OR MORE live sessions: `name<TAB>sid1,sid2,...` — sids in the
#   order the registry returned them, output lines sorted by name for
#   deterministic output. Implemented as a single awk pass; no per-name
#   shell-out.
#     return 0 — daemon queried successfully. Stdout carries one line per
#               duplicated name (empty when the registry holds no duplicate —
#               a definite "no duplicates" answer, not a failure).
#     return 1 — UNKNOWN. `claude_agents_list_all` could not be queried. Stdout
#               is empty.
#
# Test override: CLAUDE_AGENTS_CMD replaces the `claude` invocation with an
# arbitrary command (e.g. an absolute path to a fake script), so the helper is
# testable with no real daemon. Default: `claude`.
#
# ACTIVE vs REGISTERED — two views of the daemon registry, two questions.
#
#   | view       | query                        | question | consumers |
#   |---|---|---|---|
#   | REGISTERED | `claude agents --json --all` | "Is this node/worktree spoken for?" Registration IS the claim; release is `claude rm`. | worktree_has_live_session (node concurrency gate, worktree reuse, worktree removal) |
#   | ACTIVE     | `claude agents --json`       | "Is a process running right now?" | pace/concurrency budget, spawn-registration race, dead-router reservation reclaim |
#
# The REGISTERED accessors are `_claude_agents_raw_registered`,
# `claude_agents_list_registered`, and `claude_agents_snapshot_capture_registered`
# — siblings of the ACTIVE `_claude_agents_raw` / `claude_agents_list_all` /
# `claude_agents_snapshot_capture`, modeled on them so the UNKNOWN contract is
# identical. Two design rules govern the split:
#
#   (1) Do NOT reconstruct ACTIVE from REGISTERED client-side. A
#       `select(.state != "done")` filter over the `--all` array guesses at the
#       daemon's terminal-state set — which this file's own comment on
#       `claude_job_id_for_name_all` describes as "done/stopped/etc". Ask the
#       daemon for the view you want; do not guess at its state machine.
#
#   (2) Do NOT flip the shared `claude_agents_list_all` wholesale to `--all`. It
#       also backs `reservation_sweep` (lib-reservation-ledger.sh:418) rule (c),
#       which reclaims a marker when the reserving session id is no longer in the
#       live set. Reserving sessions are routers (`dispatch-<short-id>`) that
#       routinely go done, so making done rows visible there would make markers
#       immortal: `reservation_count` would climb monotonically and
#       `LIVE_COUNT = busy_workers + reservations` (dispatch-select-tick:640-644)
#       would pin at the ceiling, stalling the whole fleet. The flip is therefore
#       confined to the occupancy predicate.
#
# Naming trap: `claude_agents_list_all`'s `_all` suffix means MACHINE-WIDE (no
# `--cwd` filter, no name filter) — NOT `--all`. It is the ACTIVE view. A reader
# skimming for "the place that needs --all" will land on it wrongly. The fully
# greenfield name is `claude_agents_list_active`; renaming it is out of scope here
# (separate mechanical PR).
#
# Tick snapshot: DISPATCH_AGENTS_SNAPSHOT names a file holding one captured
# `claude agents --json` array for the current selection tick. When it is set
# and names a readable file, the THREE machine-wide functions — `claude_agents_
# list_all`, `claude_sessions_with_name`, and `claude_agents_count_busy_workers`
# — read that raw array instead of shelling out, so a single daemon query is
# reused across every machine-wide call in a tick rather than re-queried per
# call. The staleness is bounded to one query per seconds-long selection tick —
# the same rationale as `reservation_sweep` in lib-reservation-ledger.sh, which
# reconciles against one machine-wide query. `claude_agents_snapshot_capture
# <path>` writes such a snapshot. When DISPATCH_AGENTS_SNAPSHOT is
# unset / unreadable / empty, every function falls back to the live per-call
# path and the UNKNOWN contract is preserved bit-for-bit.
#
# Registered tick snapshot: DISPATCH_AGENTS_SNAPSHOT_ALL is the REGISTERED-view
# counterpart — a file holding one captured `claude agents --json --all` array for
# the current tick. It is read by `_claude_agents_raw_registered`, and therefore by
# `claude_agents_list_registered` and `worktree_has_live_session` (the only
# consumers of the registered view). `claude_agents_snapshot_capture_registered
# <path>` writes it; dispatch-tick captures it once per tick alongside
# DISPATCH_AGENTS_SNAPSHOT, so the occupancy predicate does not issue one live
# `--all` round-trip per candidate worktree. When DISPATCH_AGENTS_SNAPSHOT_ALL is
# unset / unreadable, `_claude_agents_raw_registered` falls back to the live
# `claude agents --json --all` query and the UNKNOWN contract is preserved
# bit-for-bit. The two snapshots are DISTINCT files and are never interchangeable:
# the ACTIVE snapshot lacks `done` rows, the REGISTERED snapshot contains them.
#
# The two freshness-sensitive functions are deliberately EXCLUDED from the
# snapshot and always query live: `claude_sessions_under` (the `--cwd` variant)
# and `verify_agent_registered_under` (its bounded retry). Both back the
# launcher's async-registration-race poll, which must observe a just-spawned
# agent the instant the daemon registers it — a tick-old snapshot would miss it.
# The `--all` functions (`claude_sessions_with_name_all`,
# `claude_sessions_with_name_prefix_all`, `claude_job_id_for_name_all`,
# `claude_session_id_is_live`) are excluded for a different reason: the snapshot
# is captured WITHOUT `--all`, so it lacks the terminal-state rows they exist to
# see. Reading it would silently hide them.
#
# Test override: LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S overrides the
# `verify_agent_registered_under` inter-attempt sleep (default 0.2 s). Tests that
# exercise the full exhaustion path set it to 0 to skip the real sleeps.
#
# Test override: CLAUDE_AGENTS_PGREP_CMD replaces the `pgrep` invocation in
# `claude_agents_registry_reachable`, so the corroboration probe is testable
# without a real daemon. Default: `pgrep`. A stub exiting 0 models "daemon
# visible"; one exiting 1 models the blocked-read case.
#
# Sandbox: `claude agents --json` reaches the local daemon over a Unix socket;
# a sandboxed call returns `[]` at exit 0, which the raw read cannot distinguish
# from "no sessions". The five hardened functions above now detect that case via
# the process probe and report UNKNOWN rather than a false empty — but the probe
# is a backstop, not a licence: callers must still run this helper with
# `dangerouslyDisableSandbox: true` — see `.claude/rules/sandbox.md`.
#
# Safe to source multiple times. Does NOT use set -e (must return, not exit).
#
# Side effect: sourcing this file once sets `-u` and `-o pipefail` in the
# caller shell. New callers should be aware before sourcing.

if [[ -z "${_LIB_CLAUDE_AGENTS_LOADED:-}" ]]; then
  _LIB_CLAUDE_AGENTS_LOADED=1

  set -uo pipefail

  # CLAUDE_AGENTS_TERMINAL_STATES_JQ — the SINGLE definition of what "terminal"
  # means, as a jq `def` fragment prepended to every program that needs it.
  # Three consumers share it verbatim: `claude_agents_count_held_for_debug`,
  # `claude_agents_list_terminal_workers`, and `worktree_occupancy_state`. They
  # previously each carried their own copy of the same nine-state list; a
  # divergence between them would mean the counter, the lister and the occupancy
  # classifier disagreed about which sessions are dead, so the list lives here
  # once and cannot drift.
  #
  # The enumeration is deliberate, not an oversight: a NEW state the daemon
  # introduces reads as live (not terminal) until it is added here, which
  # under-reports rather than inventing frozen nodes that do not exist. Keep
  # that posture when extending the list.
  CLAUDE_AGENTS_TERMINAL_STATES_JQ='
      def terminal_states:
        ["done","stopped","killed","failed","errored","error",
         "cancelled","canceled","terminated"];
'

  # _claude_agents_raw — emit the raw `claude agents --json` array on stdout.
  # Reads the tick snapshot (DISPATCH_AGENTS_SNAPSHOT) when set and readable —
  # one daemon query per seconds-long selection tick is reused across every
  # machine-wide call (same staleness rationale as reservation_sweep). Falls back
  # to a live per-call query otherwise. Returns non-zero on a live-query failure
  # (the UNKNOWN signal); a readable snapshot is always exit 0 here, with the
  # empty/whitespace UNKNOWN guard applied by each caller as before.
  _claude_agents_raw() {
    if [[ -n "${DISPATCH_AGENTS_SNAPSHOT:-}" && -r "$DISPATCH_AGENTS_SNAPSHOT" ]]; then
      cat "$DISPATCH_AGENTS_SNAPSHOT"
      return 0
    fi
    "${CLAUDE_AGENTS_CMD:-claude}" agents --json 2>/dev/null
  }

  # claude_agents_registry_reachable — socket-INDEPENDENT corroboration probe.
  # `claude agents --json` reaches the daemon over a Unix socket; when that
  # socket is unreachable (a sandboxed call, a namespace-isolated shell) the
  # command still exits 0 and prints `[]` — byte-identical to a genuine "no live
  # sessions". This probe answers the same question by a different mechanism: is
  # a `claude daemon` process visible to THIS process? Same technique as
  # `dispatch-daemon-liveness` (its DAEMON_PATTERN / PGREP_CMD), but a SEPARATE
  # env seam (CLAUDE_AGENTS_PGREP_CMD) — the two are independent overrides.
  # Only the exit status is used; stdout/stderr are discarded.
  #     return 0 — at least one `claude daemon` process is visible: an empty
  #               array from the socket read is corroborated as definite.
  #     return 1 — no daemon process visible (or pgrep itself unavailable).
  # NOT memoized on purpose: it only runs on the empty-array path (one pgrep on
  # an otherwise idle machine), and a cached verdict would go stale across a
  # daemon start and leak between cases inside one test shell.
  claude_agents_registry_reachable() {
    "${CLAUDE_AGENTS_PGREP_CMD:-pgrep}" -f 'claude daemon' >/dev/null 2>&1
  }

  # _claude_agents_empty_read_is_definite <raw-json> — classify a successful
  # registry read as definite or uncorroborated.
  #     return 0 — DEFINITE: the payload is not an empty array (a non-empty
  #               array is self-corroborating — a blocked read cannot invent
  #               rows); or it came from a snapshot for <view>, whose emptiness
  #               was corroborated at capture time; or it IS `[]` from a live
  #               read and a `claude daemon` process is visible.
  #     return 1 — UNCORROBORATED `[]`: the caller must fold it into UNKNOWN.
  # Always pass the RAW payload, never a projection: `claude_sessions_under`'s
  # `--cwd` filter and the client-side jq filters legitimately project zero rows
  # from a NON-empty array, and keying on the projection would flip healthy
  # reads to UNKNOWN.
  # WHERE CORROBORATION HAPPENS: at CAPTURE, not at every read. A snapshot is
  # written by `claude_agents_snapshot_capture`, which performs the live socket
  # read and corroborates it there — refusing to write an uncorroborated `[]`
  # at all. So by the time a reader sees a snapshot, its emptiness has already
  # been established as real, and re-probing here would be both redundant and
  # WRONG: a caller that deliberately supplied an empty snapshot (the tick
  # reusing one capture across a selection pass; a test injecting "no
  # sessions") would have its own explicit input overridden by a probe of the
  # ambient host. That is why `<view>` exists — when the snapshot backing that
  # view is in effect, the payload is the caller's assertion and is definite by
  # construction.
  #
  # `<view>` is `active` (DISPATCH_AGENTS_SNAPSHOT, backing `_claude_agents_raw`)
  # or `registered` (DISPATCH_AGENTS_SNAPSHOT_ALL, backing
  # `_claude_agents_raw_registered`). The two are INDEPENDENT: a site reading
  # the registered view must not be excused by an active-view snapshot, so the
  # view is passed explicitly rather than inferred. Omit it for a site that
  # queries the daemon DIRECTLY, bypassing both snapshots — such a read is
  # always live and always corroborated.
  _claude_agents_snapshot_in_effect() {
    case "${1:-}" in
      active)     [[ -n "${DISPATCH_AGENTS_SNAPSHOT:-}"     && -r "${DISPATCH_AGENTS_SNAPSHOT:-}"     ]] ;;
      registered) [[ -n "${DISPATCH_AGENTS_SNAPSHOT_ALL:-}" && -r "${DISPATCH_AGENTS_SNAPSHOT_ALL:-}" ]] ;;
      *)          return 1 ;;
    esac
  }

  _claude_agents_empty_read_is_definite() {
    local raw="${1:-}" view="${2:-}"
    if [[ "${raw//[[:space:]]/}" != "[]" ]]; then
      return 0
    fi
    # A snapshot-sourced `[]` was corroborated when the snapshot was captured.
    if _claude_agents_snapshot_in_effect "$view"; then
      return 0
    fi
    claude_agents_registry_reachable
  }

  # _claude_agents_warn_uncorroborated_empty <caller> — one stderr line per
  # uncorroborated classification, naming the remedy.
  _claude_agents_warn_uncorroborated_empty() {
    printf "lib-claude-agents: %s: empty 'claude agents --json' result could not be corroborated (no 'claude daemon' process visible); treating as UNKNOWN. Run unsandboxed (dangerouslyDisableSandbox) and check dispatch-daemon-liveness.\n" \
      "${1:-registry read}" >&2
  }

  # claude_agents_snapshot_capture <path> — capture one machine-wide
  # `claude agents --json` to <path> for the tick to reuse via
  # DISPATCH_AGENTS_SNAPSHOT.
  #
  # THIS IS WHERE THE EMPTY READ IS CORROBORATED. The capture is the one place
  # the live socket read actually happens, so it is the one place the
  # blocked-read ambiguity exists. An uncorroborated `[]` is NOT written: the
  # file is removed and a non-zero status returned, so the caller falls back to
  # live per-call reads (each of which corroborates on its own) instead of
  # seeding every reader in the pass with a snapshot that says "no sessions"
  # when it means "could not see". Writing it and re-probing at each read would
  # spread one ambiguous read across the whole tick AND override any caller
  # that legitimately supplied an empty snapshot.
  #     return 0 — a snapshot was written and its contents are trustworthy.
  #     return non-zero — nothing usable was written; fall back to live reads.
  claude_agents_snapshot_capture() {
    local pth="${1:-}"
    if [[ -z "$pth" ]]; then
      printf 'lib-claude-agents: claude_agents_snapshot_capture requires a <path> argument\n' >&2
      return 1
    fi
    "${CLAUDE_AGENTS_CMD:-claude}" agents --json >"$pth" 2>/dev/null || return 1
    # No <view> argument: this classifies the LIVE read that just happened, so
    # it must probe, never excuse itself via a snapshot that does not exist yet.
    if ! _claude_agents_empty_read_is_definite "$(cat "$pth" 2>/dev/null)"; then
      _claude_agents_warn_uncorroborated_empty claude_agents_snapshot_capture
      rm -f "$pth"
      return 1
    fi
  }

  # _claude_agents_raw_registered — emit the raw `claude agents --json --all`
  # array on stdout: the REGISTERED view, which includes sessions in a terminal
  # state (done/stopped/etc) that have not been `claude rm`'d. Sibling of
  # _claude_agents_raw with identical structure and fallback semantics; only the
  # snapshot variable (DISPATCH_AGENTS_SNAPSHOT_ALL) and the `--all` flag differ.
  # Reads the registered tick snapshot when set and readable, else a live
  # per-call query. Returns non-zero on a live-query failure (the UNKNOWN
  # signal); a readable snapshot is always exit 0 here, with the
  # empty/whitespace UNKNOWN guard applied by each caller.
  _claude_agents_raw_registered() {
    if [[ -n "${DISPATCH_AGENTS_SNAPSHOT_ALL:-}" && -r "$DISPATCH_AGENTS_SNAPSHOT_ALL" ]]; then
      cat "$DISPATCH_AGENTS_SNAPSHOT_ALL"
      return 0
    fi
    "${CLAUDE_AGENTS_CMD:-claude}" agents --json --all 2>/dev/null
  }

  # claude_agents_snapshot_capture_registered <path> — capture one machine-wide
  # `claude agents --json --all` to <path> for the tick to reuse via
  # DISPATCH_AGENTS_SNAPSHOT_ALL. The REGISTERED-view sibling of
  # claude_agents_snapshot_capture, including its capture-time corroboration:
  # an uncorroborated `[]` is not written, and non-zero is returned so the
  # caller falls back to live reads.
  claude_agents_snapshot_capture_registered() {
    local pth="${1:-}"
    if [[ -z "$pth" ]]; then
      printf 'lib-claude-agents: claude_agents_snapshot_capture_registered requires a <path> argument\n' >&2
      return 1
    fi
    "${CLAUDE_AGENTS_CMD:-claude}" agents --json --all >"$pth" 2>/dev/null || return 1
    if ! _claude_agents_empty_read_is_definite "$(cat "$pth" 2>/dev/null)"; then
      _claude_agents_warn_uncorroborated_empty claude_agents_snapshot_capture_registered
      rm -f "$pth"
      return 1
    fi
  }

  # claude_sessions_under <path> — emit live sessions under <path> as TSV.
  # See the header comment for the return-code contract.
  # STAYS ON THE ACTIVE VIEW: it backs the spawn-registration race, which needs a
  # LIVE successor — matching a stale done row of the same name would falsely
  # report a successful registration.
  claude_sessions_under() {
    local pth="${1:-}"
    if [[ -z "$pth" ]]; then
      printf 'lib-claude-agents: claude_sessions_under requires a <path> argument\n' >&2
      return 1
    fi

    # 2>/dev/null drops daemon noise; only the exit code and a well-formed
    # JSON array on stdout are trusted. A non-zero exit — `claude` missing
    # (127), the daemon unreachable, or any other failure — means the session
    # state cannot be determined: unknown.
    local out
    if ! out=$("${CLAUDE_AGENTS_CMD:-claude}" agents --json --cwd "$pth" 2>/dev/null); then
      return 1
    fi

    # A zero exit with empty (or whitespace-only) output is unknown too — not a
    # definite "no sessions".
    if [[ -z "${out//[[:space:]]/}" ]]; then
      return 1
    fi

    # An exactly-`[]` payload is only a definite "no sessions" when a daemon
    # process corroborates it; otherwise it is a blocked read wearing the same
    # clothes, and folds into UNKNOWN.
    if ! _claude_agents_empty_read_is_definite "$out"; then
      _claude_agents_warn_uncorroborated_empty claude_sessions_under
      return 1
    fi

    # One jq pass validates the JSON is an array and extracts the TSV. A
    # non-array — object, scalar, or malformed JSON — hits `error`; a degenerate
    # element that breaks extraction errors mid-pass; either way jq exits
    # non-zero and the result is unknown. Capture first so partial output from
    # a mid-stream error is discarded rather than emitted.
    local lines
    if ! lines=$(jq -r '
      if type == "array"
      then .[] | [.sessionId, .pid, .status, .name] | @tsv
      else error("claude agents --json output is not a JSON array")
      end' <<<"$out" 2>/dev/null); then
      return 1
    fi
    # `[]` → empty $lines → emit nothing (zero session lines), still return 0.
    if [[ -n "$lines" ]]; then
      printf '%s\n' "$lines"
    fi
    return 0
  }

  # claude_sessions_with_name <name> — emit live sessions matching <name> as TSV.
  # See the header comment for the return-code contract.
  # STAYS ON THE ACTIVE VIEW: it answers "is a session by this name running now?"
  # `claude_sessions_with_name_all` is the `--all` variant for callers that need
  # terminal-state rows.
  claude_sessions_with_name() {
    local name="${1:-}"
    if [[ -z "$name" ]]; then
      printf 'lib-claude-agents: claude_sessions_with_name requires a <name> argument\n' >&2
      return 1
    fi

    # No --cwd flag: name is the filter, applied client-side via jq. The raw
    # array comes from the tick snapshot when set, else a live per-call query
    # (see _claude_agents_raw). 2>/dev/null inside the helper drops daemon
    # noise; only exit code and a well-formed JSON array on stdout are trusted.
    local out
    if ! out=$(_claude_agents_raw); then
      return 1
    fi

    # A zero exit with empty (or whitespace-only) output is unknown too.
    if [[ -z "${out//[[:space:]]/}" ]]; then
      return 1
    fi

    # One jq pass validates the JSON is an array and filters by exact name match.
    # Non-array input errors out and the result is UNKNOWN.
    local lines
    if ! lines=$(jq -r --arg name "$name" '
      if type == "array"
      then .[] | select(.name == $name) | [.sessionId, .pid, .status, .name] | @tsv
      else error("claude agents --json output is not a JSON array")
      end' <<<"$out" 2>/dev/null); then
      return 1
    fi
    # `[]` or no name matches → empty $lines → emit nothing, still return 0.
    if [[ -n "$lines" ]]; then
      printf '%s\n' "$lines"
    fi
    return 0
  }

  # claude_sessions_with_name_all <name> — emit live+done sessions matching <name>
  # as sessionId<TAB>state<TAB>cwd TSV. See the header comment for the return-code
  # contract and why it bypasses the snapshot. The `.cwd` column was added for #2241
  # so the consumer (issue_live_session_id) can carry the session's working
  # directory out and derive its branch when no <N>-* worktree is registered.
  claude_sessions_with_name_all() {
    local name="${1:-}"
    if [[ -z "$name" ]]; then
      printf 'lib-claude-agents: claude_sessions_with_name_all requires a <name> argument\n' >&2
      return 1
    fi

    # --all so completed (`done`) sessions are visible; queried DIRECTLY (not via
    # _claude_agents_raw) to bypass the snapshot, which is captured without --all
    # and lacks `done` rows. 2>/dev/null drops daemon noise; only the exit code
    # and a well-formed JSON array on stdout are trusted. A non-zero exit means
    # the session state cannot be determined: unknown.
    local out
    if ! out=$("${CLAUDE_AGENTS_CMD:-claude}" agents --json --all 2>/dev/null); then
      return 1
    fi

    # A zero exit with empty (or whitespace-only) output is unknown too.
    if [[ -z "${out//[[:space:]]/}" ]]; then
      return 1
    fi

    # One jq pass validates the JSON is an array and filters by exact name match,
    # projecting sessionId, the granular state, and the cwd (#2241). Non-array
    # input errors out and the result is UNKNOWN.
    local lines
    if ! lines=$(jq -r --arg name "$name" '
      if type == "array"
      then .[] | select(.name == $name) | [.sessionId, .state, .cwd] | @tsv
      else error("claude agents --json output is not a JSON array")
      end' <<<"$out" 2>/dev/null); then
      return 1
    fi
    # `[]` or no name matches → empty $lines → emit nothing, still return 0.
    if [[ -n "$lines" ]]; then
      printf '%s\n' "$lines"
    fi
    return 0
  }

  # claude_job_id_for_name_all <name> — echo the daemon JOB ID (the short `.id`
  # field of `claude agents --json --all` — the 8-hex-char basename
  # dispatch-self-close derives from $CLAUDE_JOB_DIR, NOT `.sessionId`) of the
  # live/done background job whose `.name` exactly equals <name>, or empty if
  # none. --all so a job in a terminal state (done/stopped/etc — hidden from the
  # default active-only listing) is still resolvable: office-hours' attach path
  # needs to find a job by name even after it has finished. Consolidates
  # office-hours' inline job_id_for_name() jq pattern into one shared
  # implementation.
  #     return 0 — daemon queried successfully. Stdout is the job id, or empty if
  #               no name match. Empty stdout + return 0 is a definite "no such job".
  #     return 1 — UNKNOWN. `claude` missing, non-zero exit, or non-array output.
  #               Stdout is empty. Callers MUST NOT treat this as "no job" — see
  #               each call site's own fail-safe handling.
  claude_job_id_for_name_all() {
    local name="${1:-}"
    if [[ -z "$name" ]]; then
      printf 'lib-claude-agents: claude_job_id_for_name_all requires a <name> argument\n' >&2
      return 1
    fi

    local out
    if ! out=$("${CLAUDE_AGENTS_CMD:-claude}" agents --json --all 2>/dev/null); then
      return 1
    fi
    if [[ -z "${out//[[:space:]]/}" ]]; then
      return 1
    fi

    jq -r --arg n "$name" '
      if type == "array"
      then (first(.[] | select(.name == $n) | .id) // empty)
      else error("claude agents --json output is not a JSON array")
      end' <<<"$out" 2>/dev/null || return 1
    return 0
  }

  # claude_sessions_with_name_prefix_all <prefix> — emit live+done sessions whose
  # name STARTS WITH <prefix> as sessionId<TAB>state<TAB>cwd TSV. Modeled on
  # claude_sessions_with_name_all, differing only in the jq match: a `^<prefix>`
  # regex test() instead of an exact `==`. Added for #2241 so issue_live_session_id
  # can match phase-worker sessions named `<N>-slug` (the `^[0-9]+-` shape) by
  # passing `<N>-` even when no <N>-* worktree is currently registered. The
  # return-code contract is IDENTICAL to claude_sessions_with_name_all (rc1 on
  # query/parse failure, drives the caller's saw_unknown) — only the match differs.
  claude_sessions_with_name_prefix_all() {
    local prefix="${1:-}"
    if [[ -z "$prefix" ]]; then
      printf 'lib-claude-agents: claude_sessions_with_name_prefix_all requires a <prefix> argument\n' >&2
      return 1
    fi

    # --all so completed (`done`) sessions are visible; queried DIRECTLY (not via
    # _claude_agents_raw) to bypass the snapshot, which is captured without --all
    # and lacks `done` rows. 2>/dev/null drops daemon noise; only the exit code
    # and a well-formed JSON array on stdout are trusted. A non-zero exit means
    # the session state cannot be determined: unknown.
    local out
    if ! out=$("${CLAUDE_AGENTS_CMD:-claude}" agents --json --all 2>/dev/null); then
      return 1
    fi

    # A zero exit with empty (or whitespace-only) output is unknown too.
    if [[ -z "${out//[[:space:]]/}" ]]; then
      return 1
    fi

    # One jq pass validates the JSON is an array and filters by name prefix
    # (test("^" + $prefix), reusing the prefix idiom from live_session_claimed_nums
    # / claude_agents_count_busy_workers), projecting sessionId, state, and cwd.
    # The name is type-guarded so a null/absent name never aborts the pass.
    # Non-array input errors out and the result is UNKNOWN.
    local lines
    if ! lines=$(jq -r --arg prefix "$prefix" '
      if type == "array"
      then .[] | select(.name | type == "string" and test("^" + $prefix)) | [.sessionId, .state, .cwd] | @tsv
      else error("claude agents --json output is not a JSON array")
      end' <<<"$out" 2>/dev/null); then
      return 1
    fi
    # `[]` or no prefix matches → empty $lines → emit nothing, still return 0.
    if [[ -n "$lines" ]]; then
      printf '%s\n' "$lines"
    fi
    return 0
  }

  # claude_agents_list_all — emit every live session as a 3-column TSV.
  # See the header comment for the return-code contract.
  # STAYS ON THE ACTIVE VIEW (`claude agents --json`, no `--all`): it backs
  # reservation_sweep's dead-router reclaim, which must see a done router drop out
  # of the live set or markers become immortal and the fleet stalls (header design
  # rule 2). Occupancy uses claude_agents_list_registered instead. The `_all`
  # suffix means machine-wide, NOT `--all`.
  claude_agents_list_all() {
    # No --cwd flag and no name filter: the caller (the reservation-ledger
    # sweep) needs the complete machine-wide live-session set in one query. The
    # raw array comes from the tick snapshot when set, else a live per-call
    # query (see _claude_agents_raw). 2>/dev/null inside the helper drops daemon
    # noise; only exit code and a well-formed JSON array on stdout are trusted.
    local out
    if ! out=$(_claude_agents_raw); then
      return 1
    fi

    # A zero exit with empty (or whitespace-only) output is unknown too.
    if [[ -z "${out//[[:space:]]/}" ]]; then
      return 1
    fi

    # An uncorroborated `[]` is UNKNOWN, not a definite empty registry.
    if ! _claude_agents_empty_read_is_definite "$out" active; then
      _claude_agents_warn_uncorroborated_empty claude_agents_list_all
      return 1
    fi

    # One jq pass validates the JSON is an array and projects the 3-column TSV
    # (sessionId, status, name — no pid). Non-array input errors out and the
    # result is UNKNOWN.
    local lines
    if ! lines=$(jq -r '
      if type == "array"
      then .[] | [.sessionId, .status, .name] | @tsv
      else error("claude agents --json output is not a JSON array")
      end' <<<"$out" 2>/dev/null); then
      return 1
    fi
    # `[]` → empty $lines → emit nothing (zero session lines), still return 0.
    if [[ -n "$lines" ]]; then
      printf '%s\n' "$lines"
    fi
    return 0
  }

  # claude_agents_list_registered — emit every REGISTERED session (live AND
  # terminal-state rows that have not been `claude rm`'d) as a 4-column TSV:
  # sessionId<TAB>status<TAB>name<TAB>state. Columns 1-3 are byte-identical to
  # claude_agents_list_all's projection, so any awk keyed on $1/$3 works against
  # either; `.state` is appended purely so the occupancy predicate can name the
  # held session's state in an operator diagnostic. `.state` is NOT defaulted —
  # a fake or a daemon build without the field yields null, which @tsv renders as
  # an empty field; inventing a value would be a guess.
  # The UNKNOWN contract is identical to claude_agents_list_all.
  claude_agents_list_registered() {
    # No --cwd flag and no name filter: the caller (worktree_has_live_session)
    # needs the complete machine-wide REGISTERED set in one query. The raw array
    # comes from the registered tick snapshot when set, else a live per-call
    # `--all` query (see _claude_agents_raw_registered). 2>/dev/null inside the
    # helper drops daemon noise; only exit code and a well-formed JSON array on
    # stdout are trusted.
    local out
    if ! out=$(_claude_agents_raw_registered); then
      return 1
    fi

    # A zero exit with empty (or whitespace-only) output is unknown too.
    if [[ -z "${out//[[:space:]]/}" ]]; then
      return 1
    fi

    # An uncorroborated `[]` is UNKNOWN, not a definite empty registry — and
    # `worktree_has_live_session` folds that UNKNOWN into OCCUPIED, so a blocked
    # read can no longer report a claimed worktree as free.
    if ! _claude_agents_empty_read_is_definite "$out" registered; then
      _claude_agents_warn_uncorroborated_empty claude_agents_list_registered
      return 1
    fi

    # One jq pass validates the JSON is an array and projects the 4-column TSV
    # (sessionId, status, name, state — no pid). Non-array input errors out and
    # the result is UNKNOWN.
    local lines
    if ! lines=$(jq -r '
      if type == "array"
      then .[] | [.sessionId, .status, .name, .state] | @tsv
      else error("claude agents --json output is not a JSON array")
      end' <<<"$out" 2>/dev/null); then
      return 1
    fi
    # `[]` → empty $lines → emit nothing (zero session lines), still return 0.
    if [[ -n "$lines" ]]; then
      printf '%s\n' "$lines"
    fi
    return 0
  }

  # live_session_claimed_nums — emit the UNIQUE issue numbers claimed by live
  # sessions, one per line. The forward (in-flight) half of selection's claimed
  # set: instead of walking every registered worktree backward, derive the
  # claimed numbers straight from the live-session names in a single daemon
  # query. A name matches one of two shapes and contributes its captured <N>:
  #   `^[0-9]+-`            phase workers, spawned with --name=<N>-slug (same
  #                         `^[0-9]+-` shape used by claude_agents_count_busy_workers,
  #                         which excludes routers named `dispatch-<short-id>`).
  #   `^office-hours-[0-9]+$` office-hours sessions, renamed to office-hours-<N>
  #                         in #1311 (the `$` anchor rejects office-hours-12-extra).
  # Routers (`dispatch-<short-id>`) and job sessions (diagnose-main, jit names)
  # match NEITHER shape and are excluded. A null/absent `.name` is guarded in jq.
  # Same UNKNOWN contract as the other machine-wide functions: a `[]` array is a
  # definite "no live sessions" (return 0, empty output), NOT unknown — only
  # whitespace/empty raw output is UNKNOWN.
  #     return 0 — daemon queried successfully. Stdout carries the unique claimed
  #               <N> values, one per line (empty for `[]` or no matches).
  #     return 1 — UNKNOWN. Stdout is empty. Callers should fail open (see
  #               claimed_issue_nums in lib-reservation-ledger.sh).
  # STAYS ON THE ACTIVE VIEW: graph node sessions are named tactic-* / strategy-*
  # and match neither `^[0-9]+-` nor `^office-hours-[0-9]+$`, so the registered
  # view would contribute nothing here on the graph lane.
  live_session_claimed_nums() {
    # No --cwd flag and no name filter: the caller needs the machine-wide claimed
    # set in one query. The raw array comes from the tick snapshot when set, else
    # a live per-call query (see _claude_agents_raw). 2>/dev/null inside the
    # helper drops daemon noise; only exit code and a well-formed JSON array on
    # stdout are trusted.
    local out
    if ! out=$(_claude_agents_raw); then
      return 1
    fi

    # A zero exit with empty (or whitespace-only) output is unknown too.
    if [[ -z "${out//[[:space:]]/}" ]]; then
      return 1
    fi

    # One jq pass validates the array shape and projects each live name to its
    # claimed <N> (or `empty` for non-claim names), then `unique` dedups. Using
    # test()-guarded sub() rather than capture() — capture() on a non-matching
    # string errors and would abort the whole pass (a false UNKNOWN). Non-array
    # input errors out and the result is UNKNOWN.
    local nums
    if ! nums=$(jq -r '
      if type == "array"
      then [ .[]
        | select(.name | type == "string")
        | .name
        | if test("^[0-9]+-") then sub("-.*$"; "")
          elif test("^office-hours-[0-9]+$") then sub("^office-hours-"; "")
          else empty end ] | unique | .[]
      else error("claude agents --json output is not a JSON array")
      end' <<<"$out" 2>/dev/null); then
      return 1
    fi
    # `[]` or no claim-name matches → empty $nums → emit nothing, still return 0.
    if [[ -n "$nums" ]]; then
      printf '%s\n' "$nums"
    fi
    return 0
  }

  # worktree_has_live_session <path> — fail-safe OCCUPANCY predicate.
  # Reads the REGISTERED view (claude_agents_list_registered, `claude agents
  # --json --all`): a session that has stopped but has not been `claude rm`'d
  # still holds its worktree. Registration IS the claim; release is an explicit
  # human act. No timeout — see the header contract.
  # It ALSO reports occupied while the worktree's code-review lock is held by a
  # detached `/code-review --fix` run, whose nested session never appears in the
  # registered view at all — see `worktree_occupancy_state`'s contract. That is
  # a pure widening of "occupied": no worktree this predicate used to call
  # occupied becomes free.
  # Name-keyed, two-name check against a SINGLE claude_agents_list_registered fetch
  # (one daemon round-trip per worktree, not two): exact-matches the live-session
  # name against both the worktree basename (the phase-worker session spawned
  # with --name=<basename> by dispatch-launch-worker) AND `office-hours-<N>`
  # (the office-hours session name, where <N> is the basename's numeric prefix —
  # office-hours sessions were renamed off the basename in #1311 and write no
  # reservation-ledger marker, so this is the sole backstop keeping the router
  # from spawning a phase worker into an office-hours-occupied worktree). The
  # office-hours name is formed ONLY from a numeric `<digits>-` prefix; a
  # graph-node worktree basename has none and is matched on the basename alone.
  # Reports occupied if EITHER name matches a live session OR the query returns
  # UNKNOWN.
  # See the header comment for the return-code contract.
  #
  # Optional second argument `exclude_sid` — a live-session id to exclude: a
  # matching row whose sessionId equals it does NOT count as a live claim (the
  # caller's own session, so a session spawned with --name=<basename> — e.g. the
  # graph strategy-lane /align-tactics orchestrator spawned by
  # dispatch-graph-execute with --name "$id" — does not self-match). Omitted or
  # empty preserves today's behavior for all other callers.
  worktree_has_live_session() {
    local pth="${1:-}"
    if [[ -z "$pth" ]]; then
      printf 'lib-claude-agents: worktree_has_live_session requires a <path> argument\n' >&2
      return 0  # fail safe: treat as occupied
    fi
    # Thin wrapper over `worktree_occupancy_state` — the granular classifier
    # below. The boolean contract is UNCHANGED for every existing caller:
    # only a definite `free` releases the worktree; `live`, `terminal` and
    # `unknown` all report occupied, which preserves the fail-safe UNKNOWN fold
    # verbatim. A terminal holder still blocks its node exactly as before; the
    # only thing that changed is that callers who WANT to tell the two apart can
    # now ask for the token instead of the exit code.
    local _st
    _st="$(worktree_occupancy_state "$pth" "${2:-}")"
    [[ "$_st" == "free" ]] && return 1
    return 0
  }

  # WORKTREE_OCCUPANCY_STATE / WORKTREE_OCCUPANCY_SESSION_ID /
  # WORKTREE_OCCUPANCY_REASON — the granular verdict, the matched holder's
  # sessionId, and WHY the verdict came out that way, from the most recent
  # `worktree_occupancy_state` call. Initialized here so a read before the first
  # call under `set -u` is not an unbound-variable error (same idiom as
  # CLAUDE_SESSION_ID_LIVE_STATE).
  WORKTREE_OCCUPANCY_STATE="unknown"
  WORKTREE_OCCUPANCY_SESSION_ID=""
  WORKTREE_OCCUPANCY_REASON=""

  # WORKTREE_CODE_REVIEW_LOCK_SUFFIX — the sidecar name a detached
  # `/code-review --fix` run holds while it is writing a worktree. The file sits
  # BESIDE the worktree, never inside it: `<worktrees-root>/<basename><suffix>`,
  # the same sidecar convention as `<id>.scope-fingerprint` and `<id>.ladder`.
  # Inside the worktree would be wrong twice over — it is the reviewed (and so
  # attacker-writable) tree, and it would be swept away with the worktree while
  # the run it describes was still going.
  WORKTREE_CODE_REVIEW_LOCK_SUFFIX=".code-review-lock"

  # worktree_code_review_lock_path <worktree-path> — the sidecar path for a
  # worktree. Pure string derivation; touches no filesystem and creates nothing.
  worktree_code_review_lock_path() {
    local pth="${1:-}"
    if [[ -z "$pth" ]]; then
      printf 'lib-claude-agents: worktree_code_review_lock_path requires a <path> argument\n' >&2
      return 1
    fi
    # Strip any trailing slash so `basename`/`dirname` see the worktree itself
    # rather than its parent (a caller passing "<root>/<id>/" must key the same
    # sidecar as one passing "<root>/<id>").
    while [[ "$pth" == */ && "$pth" != "/" ]]; do pth="${pth%/}"; done
    printf '%s/%s%s\n' "$(dirname "$pth")" "$(basename "$pth")" "$WORKTREE_CODE_REVIEW_LOCK_SUFFIX"
    return 0
  }

  # worktree_occupancy_state <path> [exclude_sid] — the granular OCCUPANCY
  # classifier behind `worktree_has_live_session`.
  #
  # Prints exactly ONE token on stdout and ALWAYS returns 0. The TOKEN, not the
  # exit code, is the contract — the same shape `dispatch_pause_state`
  # (`lib-pause-state.sh:30-45`) uses, and the reason this function cannot be
  # written as a predicate: it has four outcomes, not two.
  #
  #   free      — the daemon answered and no session claims this worktree.
  #   live      — a registered session claims it and is NOT in a terminal state,
  #               OR the worktree's code-review lock is held (see below).
  #               A valid claim: callers skip the node and never spawn into it.
  #   terminal  — a registered session claims it but its state is terminal
  #               (see CLAUDE_AGENTS_TERMINAL_STATES_JQ). Nothing is running, yet
  #               the claim survives until an explicit release. This is an
  #               INVALID STATE — the distinction this function exists to make.
  #   unknown   — the daemon could not be queried. NOT evidence of anything.
  #               Callers MUST fold it toward occupied and MUST NOT treat it as
  #               an invalid state: a daemon hiccup must never manufacture an
  #               intervention.
  #
  # Also sets WORKTREE_OCCUPANCY_STATE (mirrors stdout),
  # WORKTREE_OCCUPANCY_SESSION_ID (the matched row's sessionId; empty for `free`
  # and `unknown`, and empty for a code-review lock, which is not a session) and
  # WORKTREE_OCCUPANCY_REASON (why: `code-review-lock`,
  # `code-review-lock-unverifiable`, `session`, `daemon-unreadable`, `no-path`,
  # or empty for `free`) for callers that need the evidence rather than the
  # verdict.
  #
  # THE CODE-REVIEW LOCK, checked BEFORE the daemon is queried
  # ---------------------------------------------------------
  # A `/code-review --fix` run launched by `dispatch-code-review` is DETACHED:
  # it outlives the session that launched it, and the nested `claude -p` session
  # it runs never appears in the registered view at all
  # (review-fix/references/code-review-invocation.md §6). So the registered view
  # alone can report a worktree free while a review is still writing it — and a
  # worker spawned into that worktree corrupts both trees and makes
  # dispatch-code-review's `git diff <before-image>` attribute unrelated changes
  # to the review.
  #
  # The launcher runs the detached child under `flock -w 1 <sidecar>`, so the
  # KERNEL holds the lock for exactly the child's lifetime and releases it on
  # any death, SIGKILL and host crash included. Here we only ask the kernel:
  #
  #   no sidecar file            → no lock. Today's logic, unchanged.
  #   sidecar + acquire FAILS    → held → `live`, reason `code-review-lock`.
  #   sidecar + acquire SUCCEEDS → a stale file, not a held lock. Today's logic,
  #                                unchanged. The file is NOT deleted: deletion
  #                                races a launcher that is at this instant
  #                                creating it, and would drop the lock it is
  #                                about to take.
  #   no `flock` on PATH + file  → `unknown`, which every caller folds toward
  #                                occupied. Fail-safe, the same posture an
  #                                unreadable daemon gets — not a silent
  #                                downgrade to free.
  #
  # LIMITS (strategy-token-economy clarification 45). `flock` is ADVISORY: it
  # binds only claimers that check for it. That is sound here only because the
  # claim paths are few and every one of them routes through this one predicate
  # (`worktree_has_live_session` is a thin wrapper over this function) — which is
  # why the check lives here rather than being taught separately to
  # provision-node-worktree, the reservation sweep, the invalid-state lane and
  # office-hours select. A human who walks into the worktree by hand bypasses
  # the lock exactly as they bypass the registered-session claim today; the lock
  # narrows the machine's own races, and does not fence people out.
  #
  # CAVEAT — the two globals are observable ONLY on a DIRECT call:
  #     worktree_occupancy_state "$wt" >/dev/null   # globals set
  #     st=$(worktree_occupancy_state "$wt")        # globals NOT set in caller
  # Command substitution runs the function in a subshell, so assignments made
  # inside it die with that subshell. This is why the TOKEN, not a global, is
  # the contract: a caller that reads `$st` is always correct, while a caller
  # that reads the globals after a `$( )` call silently sees the previous call's
  # values (or the file-scope initializers). Need the sessionId? Call directly
  # and redirect stdout, as `dispatch-invalid-state-sweep` does.
  #
  # Everything about candidate matching is inherited unchanged from the
  # `worktree_has_live_session` this function was extracted from: ONE
  # `claude_agents_list_registered` fetch (never two round-trips per worktree),
  # the two-name check (worktree basename, plus `office-hours-<N>` only for a
  # genuine numeric prefix), exact column-3 matching (never a substring grep),
  # and the `exclude_sid` semantics.
  worktree_occupancy_state() {
    WORKTREE_OCCUPANCY_STATE="unknown"
    WORKTREE_OCCUPANCY_SESSION_ID=""
    WORKTREE_OCCUPANCY_REASON=""
    local pth="${1:-}"
    if [[ -z "$pth" ]]; then
      printf 'lib-claude-agents: worktree_occupancy_state requires a <path> argument\n' >&2
      # Fail safe: no path is not evidence of freedom. `unknown` folds to
      # occupied in every caller, matching worktree_has_live_session's own
      # empty-arg handling.
      WORKTREE_OCCUPANCY_REASON="no-path"
      printf 'unknown\n'
      return 0
    fi
    local exclude_sid="${2:-}"

    # --- the code-review lock, BEFORE the daemon query --------------------
    # Deliberately first: the whole point is that the session which launched
    # the run may already be gone from the registered view (or never appeared
    # in it), so consulting the daemon first would answer `free` for a worktree
    # that is actively being written. See the contract above for the four
    # cases, and for why `flock` being advisory is acceptable here.
    #
    # `exclude_sid` does NOT apply: it excludes a caller's own SESSION, and a
    # held lock is not a session — it is a running process with no registry
    # row. A caller cannot exempt itself from a lock it does not hold.
    local _crlock
    _crlock="$(worktree_code_review_lock_path "$pth")"
    if [[ -n "$_crlock" && -e "$_crlock" ]]; then
      if ! command -v flock >/dev/null 2>&1; then
        # The file exists and we cannot ask the kernel whether it is held.
        # Fail safe: `unknown` folds to occupied in every caller. Say so once,
        # naming the remedy, so this is a visible degradation and not a silent
        # one.
        printf 'lib-claude-agents: %s has a code-review lock sidecar but `flock` is not on PATH — reporting unknown (occupied); install util-linux to get a definite answer\n' \
          "$pth" >&2
        WORKTREE_OCCUPANCY_STATE="unknown"
        WORKTREE_OCCUPANCY_REASON="code-review-lock-unverifiable"
        printf 'unknown\n'
        return 0
      fi
      # `flock -n <file> true` acquires and immediately releases. Failing to
      # acquire is the ONLY liveness signal — never the file's existence, never
      # its body (the body is diagnostics the holder wrote, and a leftover file
      # from a crashed run keeps its stale body forever). The probe cannot
      # create the file: we already know it exists.
      #
      # The probe is EXCLUSIVE for the fork+exec of `true` (~ms), and this
      # predicate runs across the whole worktrees root on every claim path — so
      # a launcher's own acquire can land inside one of those holds. That is why
      # `dispatch-code-review`'s launch wrapper acquires with `-w 1` rather than
      # `-n`: a millisecond probe hold must not be reported as a rival run.
      if ! flock -n "$_crlock" true 2>/dev/null; then
        WORKTREE_OCCUPANCY_STATE="live"
        WORKTREE_OCCUPANCY_REASON="code-review-lock"
        # No sessionId: the holder is a detached process, not a registered
        # session. A caller reporting WHY this worktree is occupied reads
        # WORKTREE_OCCUPANCY_REASON, and can read the sidecar's body for the
        # pid/node/target the holder recorded.
        printf 'live\n'
        return 0
      fi
      # Acquired — the file is stale residue from a finished run. Fall through
      # to the registered-session logic unchanged, and leave the file alone:
      # removing it here would race a launcher creating it right now.
    fi
    local base oh
    base="$(basename "$pth")"
    # The office-hours key is only meaningful for a legacy `<N>-<slug>` issue
    # worktree, whose basename starts with the issue number: office-hours
    # sessions are named `office-hours-<N>` with a NUMERIC <N> (see
    # live_session_claimed_nums' `^office-hours-[0-9]+$` anchor). A graph-node
    # worktree is named by node id (`tactic-*` / `strategy-*`), so a naive
    # `${base%%-*}` would yield the literal word `tactic`, and the key
    # `office-hours-tactic` would be SHARED by every tactic worktree — one
    # session registered under that name would claim all of them at once. In the
    # REGISTERED view that claim never expires (no timeout, by contract), so a
    # single such registration would permanently make every node unselectable,
    # unreapable, and unreusable. Build the key only from a genuine numeric
    # prefix; otherwise leave it empty and skip the second comparison entirely.
    if [[ "$base" =~ ^([0-9]+)- ]]; then
      oh="office-hours-${BASH_REMATCH[1]}"
    else
      oh=""
    fi

    # One machine-wide fetch covers both names — `claude_agents_list_registered`
    # is the fetch-once primitive, so we avoid two separate daemon round-trips per
    # clean worktree on dispatch-sweep's hot path.
    local all
    if ! all=$(claude_agents_list_registered); then
      # Unknown — the daemon could not be queried. Fail safe: the caller folds
      # this toward occupied, but it is NOT reported as `terminal`: no positive
      # evidence exists, and a blocked read must never manufacture an invalid
      # state.
      WORKTREE_OCCUPANCY_STATE="unknown"
      WORKTREE_OCCUPANCY_REASON="daemon-unreadable"
      printf 'unknown\n'
      return 0
    fi

    # `claude_agents_list_registered` emits sessionId<TAB>status<TAB>name<TAB>state
    # (sessionId is column 1, name is column 3, state is column 4 — columns 1-3
    # match claude_agents_list_all byte-for-byte). Match column 3 exactly against
    # EITHER the phase-worker name (the worktree basename, spawned with
    # --name=<basename>) OR the office-hours name (office-hours-<N>, renamed off
    # the basename in #1311) when the basename carries a numeric issue prefix.
    # Exact match — never a substring grep, which would conflate office-hours-1
    # with office-hours-12. An empty `oh` (non-numeric basename prefix, i.e. a
    # graph node worktree) matches nothing: the comparison is skipped rather than
    # run against a shared `office-hours-<word>` key. When `exclude_sid` is
    # non-empty, a row whose sessionId (column 1) equals it is skipped: the
    # caller's own session is not "another" claim (see the second-argument
    # contract above). The matched row's sessionId and state are printed so a
    # done-but-not-removed holder can be named in the operator diagnostic below;
    # the exit-on-first-match short-circuit and `END { exit !found }` semantics
    # are unchanged.
    local matched
    if matched=$(awk -F'\t' -v base="$base" -v oh="$oh" -v exclude_sid="$exclude_sid" \
        '($3 == base || (oh != "" && $3 == oh)) && (exclude_sid == "" || $1 != exclude_sid) { found = 1; print $1 "\t" $4; exit } END { exit !found }' \
        <<<"$all"); then
      # A registered phase-worker or office-hours session occupies this worktree.
      local msid mstate
      # Split with parameter expansion, NOT `IFS=$'\t' read`: tab is IFS
      # whitespace, so `read` COLLAPSES a leading empty field — a row whose
      # sessionId is null (`.sessionId` is not defaulted in the projection, by
      # design) would yield msid="done", mstate="" and silently lose the
      # diagnostic. `%%`/`#` preserve empty fields on both sides.
      msid="${matched%%$'\t'*}"
      mstate="${matched#*$'\t'}"
      WORKTREE_OCCUPANCY_SESSION_ID="$msid"
      WORKTREE_OCCUPANCY_REASON="session"

      # Classify the matched row's state against the single shared terminal
      # enumeration. jq (not a bash case) so this cannot drift from the two
      # other consumers of CLAUDE_AGENTS_TERMINAL_STATES_JQ. A jq failure here
      # is treated as NOT terminal — under-report rather than invent a frozen
      # node, the same posture the enumeration itself documents.
      local is_terminal
      if ! is_terminal=$(jq -rn --arg st "$mstate" \
          "$CLAUDE_AGENTS_TERMINAL_STATES_JQ"'
          if (terminal_states | index($st)) then "yes" else "no" end' 2>/dev/null); then
        is_terminal="no"
      fi

      if [[ "$is_terminal" == "yes" ]]; then
        # A terminal holder is the non-obvious case: nothing is running, yet the
        # worktree stays blocked until a human (or the invalid-state lane's
        # intervention session) releases it. Say so — on EVERY probe that
        # matches it, one line per probe (there is no dedup: the per-skip
        # diagnostic IS the pressure valve, and each skip is a distinct decision
        # worth a trace line). Name the release act, and name whichever terminal
        # state actually matched rather than assuming `done`.
        printf "lib-claude-agents: %s held by a %s-but-not-removed session %s — release it with 'claude rm %s' (a stopped session keeps blocking its node by design)\n" \
          "$pth" "${mstate:-terminal}" "$msid" "$msid" >&2
        WORKTREE_OCCUPANCY_STATE="terminal"
        printf 'terminal\n'
        return 0
      fi

      # Any other state (including empty) is a live claim, and stays silent.
      WORKTREE_OCCUPANCY_STATE="live"
      printf 'live\n'
      return 0
    fi

    # The query succeeded and matched neither name: definitely free.
    WORKTREE_OCCUPANCY_STATE="free"
    printf 'free\n'
    return 0
  }

  # CLAUDE_SESSION_ID_LIVE_STATE — the granular verdict of the most recent
  # `claude_session_id_is_live` call: live | stopped | absent | unknown. Every
  # call sets it before returning; see the header comment for what each value
  # obliges a caller to do. Initialized here so a read before the first call
  # under `set -u` is not an unbound-variable error.
  CLAUDE_SESSION_ID_LIVE_STATE="unknown"

  # claude_session_id_is_live <sid> — fail-safe winner-liveness predicate for
  # the duplicate-worker stand-down protocol. See the header comment for the
  # return-code contract (the inversion is load-bearing: UNKNOWN folds to
  # LIVE, the same fail-safe posture as `worktree_has_live_session` applied to
  # a session id instead of a worktree name) and for why the query carries
  # `--all` (a stopped-but-not-removed winner is HIDDEN from the default
  # listing, and reporting it absent invites a peer to take over the shared
  # worktree its uncommitted work still sits in).
  claude_session_id_is_live() {
    CLAUDE_SESSION_ID_LIVE_STATE="unknown"
    local sid="${1:-}"
    if [[ -z "$sid" ]]; then
      printf 'lib-claude-agents: claude_session_id_is_live requires a <sid> argument\n' >&2
      return 0  # fail safe: treat as live
    fi

    # --all so a session that stopped without being `claude rm`'d is still
    # visible; queried DIRECTLY (not via _claude_agents_raw / claude_agents_list_all)
    # to bypass the tick snapshot, which is captured without --all and lacks
    # exactly those rows. 2>/dev/null drops daemon noise; only the exit code and
    # a well-formed JSON array on stdout are trusted. A non-zero exit means the
    # session state cannot be determined: UNKNOWN → fail safe: live.
    local out
    if ! out=$("${CLAUDE_AGENTS_CMD:-claude}" agents --json --all 2>/dev/null); then
      return 0
    fi
    if [[ -z "${out//[[:space:]]/}" ]]; then
      return 0
    fi

    # An uncorroborated `[]` is UNKNOWN — and this function's UNKNOWN fold is
    # INVERTED by design: unknown folds to LIVE (return 0), never to `absent`.
    # Returning 1 here would tell a caller the winner is gone and invite it to
    # take over the shared worktree, which is precisely the loss the fail-safe
    # posture exists to prevent.
    if ! _claude_agents_empty_read_is_definite "$out"; then
      _claude_agents_warn_uncorroborated_empty claude_session_id_is_live
      CLAUDE_SESSION_ID_LIVE_STATE="unknown"
      return 0
    fi

    # One jq pass validates the array shape and resolves <sid> to one of
    # `absent` or `present:<state>`. Exact `==` on .sessionId — never a
    # substring test, since session ids share prefixes. `.state` is the granular
    # field the --all listing carries; `.status` is the coarse fallback for a
    # row that has no `.state`; a row with neither is still PRESENT and resolves
    # to `present:` (empty state), which classifies as live. The `present:`
    # prefix keeps a literal state value named `absent` from being conflated
    # with a genuine absence. Non-array input errors out → UNKNOWN → live.
    local verdict
    if ! verdict=$(jq -r --arg sid "$sid" '
      if type == "array"
      then [ .[] | select(.sessionId == $sid) ] as $m
        | if ($m | length) == 0 then "absent"
          else "present:" + ((($m[0].state // $m[0].status) // "") | tostring)
          end
      else error("claude agents --json output is not a JSON array")
      end' <<<"$out" 2>/dev/null); then
      return 0
    fi

    # The query succeeded WITH --all and no row's sessionId equals <sid>: the
    # session is gone from the daemon entirely — definitely not live.
    if [[ "$verdict" == "absent" ]]; then
      CLAUDE_SESSION_ID_LIVE_STATE="absent"
      return 1
    fi

    # Present. A terminal state means the session finished but was never
    # `claude rm`'d, so its worktree may still hold uncommitted work: report it
    # as `stopped` for callers that escalate on that, and return 0 (NOT live-
    # absent) so a boolean caller never treats it as "nobody is there".
    case "${verdict#present:}" in
      done|stopped|killed|failed|errored|error|cancelled|canceled|terminated)
        CLAUDE_SESSION_ID_LIVE_STATE="stopped"
        ;;
      *)
        CLAUDE_SESSION_ID_LIVE_STATE="live"
        ;;
    esac
    return 0
  }

  # claude_agents_list_duplicate_node_names — emit one line per graph-node
  # worker name with two or more live sessions. See the header comment for the
  # return-code contract.
  claude_agents_list_duplicate_node_names() {
    # One machine-wide fetch — claude_agents_list_all is the fetch-once
    # primitive.
    local all
    if ! all=$(claude_agents_list_all); then
      # Unknown — the daemon could not be queried.
      return 1
    fi

    # Single awk pass: keep only rows whose name matches the graph-node worker
    # shape (^tactic-|^strategy-, the same keyspace claude_agents_count_busy_workers
    # counts — excludes routers and legacy <N>-slug issue workers), group
    # sessionIds by name in registry order, then emit name<TAB>sid1,sid2,...
    # for every name with >= 2 sessions.
    #
    # POSIX awk only — no `asorti`, which is a gawk extension: under mawk (the
    # default `awk` on ubuntu-latest runners and most Debian hosts) it is a
    # FATAL error, and a fatal awk pass here would print nothing while this
    # function still returned 0 — i.e. it would report a DEFINITE "the registry
    # holds no duplicate" and silently disable the observed half of the
    # stand-down protocol. Determinism instead comes from piping the END-block
    # output (emitted in registry order) through `LC_ALL=C sort`.
    #
    # The awk status is captured and checked for the same reason: a failed pass
    # is UNKNOWN (return 1), never a definite answer.
    local dups
    if ! dups=$(awk -F'\t' '
      $3 ~ /^tactic-|^strategy-/ {
        if (!($3 in seen)) { order[++n] = $3; seen[$3] = 1 }
        if (sids[$3] == "") { sids[$3] = $1 } else { sids[$3] = sids[$3] "," $1 }
        count[$3]++
      }
      END {
        for (i = 1; i <= n; i++) {
          name = order[i]
          if (count[name] >= 2) { print name "\t" sids[name] }
        }
      }' <<<"$all"); then
      return 1
    fi

    # No duplicate is a DEFINITE answer: empty stdout, return 0.
    if [[ -n "$dups" ]]; then
      LC_ALL=C sort <<<"$dups"
    fi
    return 0
  }

  # claude_agents_count_busy_workers — emit the count of live sessions that are
  # actively working: name matches `^[0-9]+-` (the real worker `<N>-<slug>`
  # shape) or a node-id worker shape (`^tactic-` / `^strategy-`), AND
  # `status == "busy"`. Both keyspaces count against the ONE pace budget
  # (tactic-graph-router-selector): draining `<N>-<slug>` issue workers and
  # graph node sessions — a strategy's `/align-tactics` session is a worker
  # too (strategy clarification 13). The patterns exclude routers (named
  # `dispatch-<short-id>`). `status == "busy"` excludes idle / input-blocked /
  # stopped workers, because those do not consume the concurrency/token budget
  # the gate paces. An over-count from a stray busy human session is fail-safe
  # (it throttles spawning). Same UNKNOWN contract as `claude_sessions_under`.
  # STAYS ON THE ACTIVE VIEW: a done session burns no tokens, so counting it
  # would throttle the fleet's concurrency budget for work that has finished.
  claude_agents_count_busy_workers() {
    # No --cwd here: the router needs a machine-wide count of live workers, not
    # a per-path filter. Two checkouts on the same machine share this count —
    # cross-repo inflation is fail-safe (gates spawning conservatively). The raw
    # array comes from the tick snapshot when set, else a live per-call query
    # (see _claude_agents_raw). 2>/dev/null inside the helper drops daemon noise.
    local out
    if ! out=$(_claude_agents_raw); then
      return 1
    fi
    if [[ -z "${out//[[:space:]]/}" ]]; then
      return 1
    fi

    # An uncorroborated `[]` is UNKNOWN, not a definite count of 0 — a blocked
    # read must not manufacture spawn headroom.
    if ! _claude_agents_empty_read_is_definite "$out" active; then
      _claude_agents_warn_uncorroborated_empty claude_agents_count_busy_workers
      return 1
    fi

    # One jq pass validates the array shape and counts matches. Non-array
    # input errors out and the result is UNKNOWN.
    local count
    if ! count=$(jq -r '
      if type == "array"
      then [ .[]
        | select(.name | type == "string" and test("^[0-9]+-|^tactic-|^strategy-"))
        | select(.status == "busy") ] | length
      else error("claude agents --json output is not a JSON array")
      end' <<<"$out" 2>/dev/null); then
      return 1
    fi
    printf '%s\n' "$count"
    return 0
  }

  # claude_agents_count_held_for_debug — emit the count of worker sessions
  # (name matches `^[0-9]+-` / `^tactic-` / `^strategy-`, the same keyspace
  # `claude_agents_count_busy_workers` counts — excluding `dispatch-*`
  # routers) sitting in a TERMINAL state — sessions a narrowed auto-close
  # default is keeping alive instead of reaping. This makes that
  # otherwise-invisible accumulation visible in dispatch-sweep's log.
  #
  # The predicate keys on `(.state // .status)` and matches the SAME terminal
  # enumeration `claude_session_id_is_live` uses
  # (done|stopped|killed|failed|errored|error|cancelled|canceled|terminated),
  # so the two agree on what "terminal" means. That list lives in exactly one
  # place — CLAUDE_AGENTS_TERMINAL_STATES_JQ at the top of this file — shared
  # with `claude_agents_list_terminal_workers` and `worktree_occupancy_state`.
  # `.state` is the granular field
  # the `--all` listing carries — a terminal row is
  # `{"state":"done"}` with NO `.status` key at all, while a live row is
  # `{"state":"working","status":"busy"|"idle"}`. A complement predicate
  # ("not busy, not idle") would therefore match every non-`working` row,
  # counting LIVE `blocked` sessions (waiting on input/permission) as held.
  # The enumeration is deliberate, not an oversight: a new state the daemon
  # introduces reads as live (not counted) until it is added here, which
  # under-reports rather than inventing frozen nodes that do not exist.
  #
  # Unlike `claude_agents_count_busy_workers`, this function queries
  # `claude agents --json --all` DIRECTLY, bypassing `_claude_agents_raw` —
  # the tick snapshot it wraps is captured without `--all` and so lacks the
  # terminal-state rows this function exists to see (same rationale as
  # `claude_sessions_with_name_all`'s direct `--all` query above).
  #     return 0 — daemon queried successfully. Stdout is the count (>= 0).
  #     return 1 — UNKNOWN. `claude` missing, non-zero exit, empty output,
  #               or non-array JSON. Stdout is empty; never prints a count
  #               on this path.
  claude_agents_count_held_for_debug() {
    # --all so terminal (done/error/etc) rows are visible; queried DIRECTLY
    # (not via _claude_agents_raw) because the snapshot lacks --all and
    # therefore lacks the very rows this function counts. 2>/dev/null drops
    # daemon noise; only the exit code and well-formed JSON on stdout are
    # trusted.
    local out
    if ! out=$("${CLAUDE_AGENTS_CMD:-claude}" agents --json --all 2>/dev/null); then
      return 1
    fi
    if [[ -z "${out//[[:space:]]/}" ]]; then
      return 1
    fi

    # One jq pass validates the array shape and counts matches. Non-array
    # input errors out and the result is UNKNOWN. `(.state // .status) // ""`
    # mirrors `claude_session_id_is_live`'s resolution: the granular `.state`
    # the --all listing carries, falling back to the coarse `.status` for a
    # row that has no `.state`, and "" for a row with neither (which is NOT
    # terminal → not counted).
    local count
    if ! count=$(jq -r "$CLAUDE_AGENTS_TERMINAL_STATES_JQ"'
      if type == "array"
      then [ .[]
        | select(.name | type == "string" and test("^[0-9]+-|^tactic-|^strategy-"))
        | select((((.state // .status) // "") | tostring) as $st
                 | terminal_states | index($st)) ] | length
      else error("claude agents --json output is not a JSON array")
      end' <<<"$out" 2>/dev/null); then
      return 1
    fi
    printf '%s\n' "$count"
    return 0
  }

  # claude_agents_list_terminal_workers — emit worker sessions (name matches
  # `^[0-9]+-` / `^tactic-` / `^strategy-`, the same keyspace
  # `claude_agents_count_held_for_debug` counts — excluding `dispatch-*`
  # routers) sitting in a TERMINAL state, as sessionId<TAB>id<TAB>name<TAB>cwd
  # TSV. This is `claude_agents_list_blocked_workers`'s sibling: same keyspace
  # filter, one extra column, different state predicate (terminal instead of
  # `blocked`). It is the lister half of `claude_agents_count_held_for_debug`
  # (which only counts) — the per-tick disposition sweep needs the actual
  # rows, not just a count, to find and park terminal worker sessions.
  #
  # `.id` is the registry's own job id, and it is a DISTINCT value from the
  # sessionId — not a prefix of it. The managed-job dir (`~/.claude/jobs/<id>`,
  # where a session leaves its `office-hours-*` escalation markers) is named by
  # `.id`, while the transcript file is named by `.sessionId`; a RESUMED session
  # keeps its original `.id` while its `.sessionId` changes. Consumers that need
  # the job dir MUST key on this column, never on `${sessionId%%-*}`. A row with
  # no `.id` emits an empty column (`@tsv` renders null as ""), which callers
  # must treat as "no job dir", never as a match.
  #
  # Shares the single `terminal_states` jq `def`
  # (CLAUDE_AGENTS_TERMINAL_STATES_JQ, defined once at the top of this file) with
  # `claude_agents_count_held_for_debug` and `worktree_occupancy_state`, and its
  # `(.state // .status) // ""` resolution: `.state` is the
  # granular field the `--all` listing carries — a terminal row is
  # `{"state":"done"}` with NO `.status` key at all — falling back to the
  # coarse `.status` for a row that has no `.state`, and "" for a row with
  # neither (which is NOT terminal → not matched).
  #
  # Unlike `claude_agents_list_blocked_workers`, this function queries
  # `claude agents --json --all` DIRECTLY, bypassing `_claude_agents_raw` —
  # the tick snapshot (DISPATCH_AGENTS_SNAPSHOT) is captured without `--all`
  # and so lacks the terminal-state rows this function exists to find; reading
  # the snapshot would silently hide them. `claude_agents_count_held_for_debug`
  # already carries this same note.
  #     return 0 — daemon queried successfully. Stdout carries one TSV line per
  #               terminal worker: sessionId<TAB>id<TAB>name<TAB>cwd. Zero
  #               matches (or a `[]` registry) → return 0 with empty stdout: a
  #               definite "no terminal workers", NOT a failure.
  #     return 1 — UNKNOWN. `claude` missing, non-zero exit, whitespace-only
  #               stdout, or jq failure on non-array input. Stdout is empty.
  #               Callers MUST treat UNKNOWN as "cannot reconcile", never as
  #               "none".
  #
  # Sandbox: reaches the local Claude daemon over a Unix socket. Callers MUST
  # run this with `dangerouslyDisableSandbox: true` — a sandboxed call yields
  # `[]`, a definite "no terminal workers", which is fail-safe here (parks
  # nothing). See `.claude/rules/sandbox.md`.
  claude_agents_list_terminal_workers() {
    # --all so terminal (done/error/etc) rows are visible; queried DIRECTLY
    # (not via _claude_agents_raw) because the snapshot lacks --all and
    # therefore lacks the very rows this function lists. 2>/dev/null drops
    # daemon noise; only the exit code and well-formed JSON on stdout are
    # trusted.
    local out
    if ! out=$("${CLAUDE_AGENTS_CMD:-claude}" agents --json --all 2>/dev/null); then
      return 1
    fi
    if [[ -z "${out//[[:space:]]/}" ]]; then
      return 1
    fi

    # One jq pass validates the array shape, filters to the worker keyspace and
    # a terminal (.state // .status), and projects the TSV. Non-array input
    # errors out and the result is UNKNOWN.
    local lines
    if ! lines=$(jq -r "$CLAUDE_AGENTS_TERMINAL_STATES_JQ"'
      if type == "array"
      then .[]
        | select(.name | type == "string" and test("^[0-9]+-|^tactic-|^strategy-"))
        | select((((.state // .status) // "") | tostring) as $st
                 | terminal_states | index($st))
        | [.sessionId, .id, .name, .cwd] | @tsv
      else error("claude agents --json output is not a JSON array")
      end' <<<"$out" 2>/dev/null); then
      return 1
    fi
    # `[]` or no matches → empty $lines → emit nothing, still return 0.
    if [[ -n "$lines" ]]; then
      printf '%s\n' "$lines"
    fi
    return 0
  }

  # claude_agents_list_blocked_workers — emit live worker sessions whose state
  # is "blocked" as sessionId<TAB>name<TAB>cwd TSV. Reads the raw registry via
  # `_claude_agents_raw` (snapshot-aware, like `claude_agents_count_busy_workers`) —
  # NOT `--all` directly: a `state: "blocked"` session is an ACTIVE session and
  # is already present in the default (non-`--all`) listing, so within a tick
  # that already captured DISPATCH_AGENTS_SNAPSHOT this costs zero extra daemon
  # round-trips. Querying `--all` here would additionally surface `state: "done"`
  # rows, which belong to a different tactic and must not be included. The
  # keyspace filter (`^[0-9]+-|^tactic-|^strategy-`) is identical to
  # `claude_agents_count_busy_workers` and excludes routers (`dispatch-<short-id>`).
  # `state` (not `status`) is the discriminator — `status` is busy/idle/stopped;
  # `state` carries the finer-grained blocked/paused/done distinctions.
  #     return 0 — daemon queried successfully. Stdout carries one TSV line per
  #               blocked worker: sessionId<TAB>name<TAB>cwd. Zero matches (or a
  #               `[]` registry) → return 0 with empty stdout: a definite "no
  #               blocked workers", NOT a failure.
  #     return 1 — UNKNOWN. `_claude_agents_raw` failure, whitespace-only output,
  #               or a jq failure (non-array input). Stdout is empty. Callers
  #               MUST treat UNKNOWN as "cannot reconcile", never as "none".
  claude_agents_list_blocked_workers() {
    # No --cwd here: callers need the machine-wide set of blocked workers, not
    # a per-path filter. The raw array comes from the tick snapshot when set,
    # else a live per-call query (see _claude_agents_raw). 2>/dev/null inside
    # the helper drops daemon noise.
    local out
    if ! out=$(_claude_agents_raw); then
      return 1
    fi
    if [[ -z "${out//[[:space:]]/}" ]]; then
      return 1
    fi

    # One jq pass validates the array shape, filters to the worker keyspace and
    # `state == "blocked"`, and projects the TSV. Non-array input errors out and
    # the result is UNKNOWN.
    local lines
    if ! lines=$(jq -r '
      if type == "array"
      then .[]
        | select(.name | type == "string" and test("^[0-9]+-|^tactic-|^strategy-"))
        | select(.state == "blocked")
        | [.sessionId, .name, .cwd] | @tsv
      else error("claude agents --json output is not a JSON array")
      end' <<<"$out" 2>/dev/null); then
      return 1
    fi
    # `[]` or no matches → empty $lines → emit nothing, still return 0.
    if [[ -n "$lines" ]]; then
      printf '%s\n' "$lines"
    fi
    return 0
  }

  # VERIFY_AGENT_REGISTERED_STATE — the granular verdict from the most recent
  # `verify_agent_registered_under_state` call. Initialized here so a read
  # before the first call under `set -u` is not an unbound-variable error (same
  # idiom as WORKTREE_OCCUPANCY_STATE / CLAUDE_SESSION_ID_LIVE_STATE).
  VERIFY_AGENT_REGISTERED_STATE="unknown"

  # verify_agent_registered_under_state <agent-name> <cwd> — the granular
  # bounded-retry verify behind `verify_agent_registered_under`.
  # See the header comment for the token contract and the globals CAVEAT.
  # STAYS ON THE ACTIVE VIEW (via claude_sessions_under): the registration race
  # needs a LIVE successor; a stale done row of the same name would falsely
  # report success.
  verify_agent_registered_under_state() {
    VERIFY_AGENT_REGISTERED_STATE="unknown"
    local agent_name="${1:-}"
    local cwd="${2:-}"
    if [[ -z "$agent_name" || -z "$cwd" ]]; then
      printf 'lib-claude-agents: verify_agent_registered_under requires <agent-name> <cwd>\n' >&2
      # Fail safe: a missing argument is a caller bug, not an observation that
      # the agent is absent. `unknown` keeps every destructive response off.
      printf 'unknown\n'
      return 0
    fi
    local max_attempts=5
    local interval_s="${LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S:-0.2}"
    # Reject a non-numeric interval (e.g. `inf`, which GNU sleep accepts and
    # would hang the verify indefinitely) and fall back to the default.
    if [[ ! "$interval_s" =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
      printf 'lib-claude-agents: LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S=%s is not a non-negative number; using 0.2\n' "$interval_s" >&2
      interval_s=0.2
    fi
    local i sessions status name
    # The discriminator between `absent` and `unknown`: did the registry EVER
    # answer? A `claude_sessions_under` return of 0 is a definite read — an
    # empty one included, since the library already refuses an uncorroborated
    # `[]`. Non-zero attempts are retried (a daemon momentarily unresponsive
    # during async registration is exactly what the retry absorbs), but they
    # contribute no evidence, so a run of nothing but non-zero attempts
    # exhausts to `unknown`, never `absent`.
    local definite_read=0
    for (( i = 0; i < max_attempts; i++ )); do
      if sessions=$(claude_sessions_under "$cwd"); then
        definite_read=1
        while IFS=$'\t' read -r _ _ status name; do
          # Confirm only a live successor: a "stopped" row with the target name
          # must not count as registered (mirrors the spawn-script dedup guards).
          [[ "$status" == "stopped" ]] && continue
          if [[ "$name" == "$agent_name" ]]; then
            VERIFY_AGENT_REGISTERED_STATE="registered"
            printf 'registered\n'
            return 0
          fi
        done <<<"$sessions"
      fi
      (( i + 1 < max_attempts )) && sleep "$interval_s"
    done
    if (( definite_read )); then
      VERIFY_AGENT_REGISTERED_STATE="absent"
      printf 'absent\n'
    else
      VERIFY_AGENT_REGISTERED_STATE="unknown"
      printf 'unknown\n'
    fi
    return 0
  }

  # verify_agent_registered_under <agent-name> <cwd> — bounded-retry verify
  # that closes the async-registration race after `claude --bg` returns.
  # See the header comment for the return-code contract.
  #
  # A thin wrapper over the classifier above. The boolean contract is UNCHANGED
  # for every existing caller: only `registered` returns 0, and both `absent`
  # and `unknown` return 1 — preserving the conservative-fail semantic verbatim.
  # Callers that must tell the two apart (because their response to a failed
  # verify is destructive) ask for the token instead.
  verify_agent_registered_under() {
    local _st
    _st="$(verify_agent_registered_under_state "$@")"
    [[ "$_st" == "registered" ]] && return 0
    return 1
  }

fi
