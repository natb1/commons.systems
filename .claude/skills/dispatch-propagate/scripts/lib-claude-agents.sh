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
#   worktree_has_live_session          <worktree-path>
#   claude_agents_count_busy_workers
#   verify_agent_registered_under      <agent-name> <cwd>
#
# claude_sessions_under <path>
#   The cwd-based low-level primitive. Runs `claude agents --json --cwd <path>`,
#   which filters server-side to sessions started under <path>.
#     return 0 — daemon queried successfully. Stdout carries one tab-separated
#               line per live session: sessionId<TAB>pid<TAB>status<TAB>name.
#               Zero sessions (`[]`) → return 0 with empty stdout: this is a
#               definite "no sessions", NOT a failure.
#     return 1 — UNKNOWN. The daemon could not be queried: `claude` missing,
#               non-zero exit, or output that is not a JSON array. Stdout is
#               empty. Callers MUST treat unknown as occupied/active, never as
#               free — a `[]` from a down daemon is indistinguishable from a
#               `[]` of genuinely no sessions, so the detectable failures fail
#               safe here and the rest is mitigated operationally (see below).
#   Used by `dispatch-spawn-router` and `dispatch-spawn-worker` to filter on
#   MAIN_WORKTREE / SPAWN_CWD — callers that want cwd-based semantics.
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
# worktree_has_live_session <path>
#   The ergonomic fail-safe predicate. Now name-keyed: delegates to
#   `claude_sessions_with_name "$(basename "$path")"`, matching the worker
#   session spawned with `--name=<basename>` by `dispatch-spawn-worker`.
#   Folds unknown into the occupied branch:
#     return 0 — occupied OR unknown: do NOT start a session under <path>.
#     return 1 — definitely no live session for the worktree's name.
#   `if worktree_has_live_session <path>` is fail-safe by construction.
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
#   determine".
#     return 0 — daemon queried successfully. Stdout is a single integer (>=0)
#               line: the count of matching sessions.
#     return 1 — UNKNOWN. Stdout is empty. Callers that gate on the count
#               should fail open (proceed to spawn) — the per-worktree dedup
#               inside `dispatch-spawn-worker` is the last-line defense.
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
#   Used by `dispatch-spawn-router` and `dispatch-spawn-worker` Step 4 verify.
#
# Test override: CLAUDE_AGENTS_CMD replaces the `claude` invocation with an
# arbitrary command (e.g. an absolute path to a fake script), so the helper is
# testable with no real daemon. Default: `claude`.
#
# Test override: LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S overrides the
# `verify_agent_registered_under` inter-attempt sleep (default 0.2 s). Tests that
# exercise the full exhaustion path set it to 0 to skip the real sleeps.
#
# Sandbox: `claude agents --json` reaches the local daemon over a Unix socket;
# a sandboxed call returns `[]` indistinguishable from "no sessions". Callers
# must run this helper with `dangerouslyDisableSandbox: true` — see
# `.claude/rules/sandbox.md`.
#
# Safe to source multiple times. Does NOT use set -e (must return, not exit).
#
# Side effect: sourcing this file once sets `-u` and `-o pipefail` in the
# caller shell. New callers should be aware before sourcing.

if [[ -z "${_LIB_CLAUDE_AGENTS_LOADED:-}" ]]; then
  _LIB_CLAUDE_AGENTS_LOADED=1

  set -uo pipefail

  # claude_sessions_under <path> — emit live sessions under <path> as TSV.
  # See the header comment for the return-code contract.
  claude_sessions_under() {
    local path="${1:-}"
    if [[ -z "$path" ]]; then
      printf 'lib-claude-agents: claude_sessions_under requires a <path> argument\n' >&2
      return 1
    fi

    # 2>/dev/null drops daemon noise; only the exit code and a well-formed
    # JSON array on stdout are trusted. A non-zero exit — `claude` missing
    # (127), the daemon unreachable, or any other failure — means the session
    # state cannot be determined: unknown.
    local out
    if ! out=$("${CLAUDE_AGENTS_CMD:-claude}" agents --json --cwd "$path" 2>/dev/null); then
      return 1
    fi

    # A zero exit with empty (or whitespace-only) output is unknown too — not a
    # definite "no sessions".
    if [[ -z "${out//[[:space:]]/}" ]]; then
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
  claude_sessions_with_name() {
    local name="${1:-}"
    if [[ -z "$name" ]]; then
      printf 'lib-claude-agents: claude_sessions_with_name requires a <name> argument\n' >&2
      return 1
    fi

    # No --cwd flag: name is the filter, applied client-side via jq.
    # 2>/dev/null drops daemon noise; only exit code and well-formed JSON array
    # on stdout are trusted.
    local out
    if ! out=$("${CLAUDE_AGENTS_CMD:-claude}" agents --json 2>/dev/null); then
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

  # worktree_has_live_session <path> — fail-safe liveness predicate.
  # Now name-keyed: delegates to claude_sessions_with_name "$(basename "$path")"
  # to match the worker session spawned with --name=<basename>.
  # See the header comment for the return-code contract.
  worktree_has_live_session() {
    local path="${1:-}"
    if [[ -z "$path" ]]; then
      printf 'lib-claude-agents: worktree_has_live_session requires a <path> argument\n' >&2
      return 0  # fail safe: treat as occupied
    fi
    local sessions
    if ! sessions=$(claude_sessions_with_name "$(basename "$path")"); then
      # Unknown — the daemon could not be queried. Fail safe: occupied.
      return 0
    fi
    if [[ -n "$sessions" ]]; then
      # The daemon reported one or more live sessions with this name.
      return 0
    fi
    # The daemon was queried successfully and reported zero matching sessions.
    return 1
  }

  # claude_agents_count_busy_workers — emit the count of live sessions that are
  # actively working: name matches `^[0-9]+-` (the real worker `<N>-<slug>`
  # shape) AND `status == "busy"`. `^[0-9]+-` excludes routers (named
  # `dispatch-<short-id>`). `status == "busy"` excludes idle / input-blocked /
  # stopped workers, because those do not consume the concurrency/token budget
  # the gate paces. An over-count from a stray busy human session is fail-safe
  # (it throttles spawning). Same UNKNOWN contract as `claude_sessions_under`.
  claude_agents_count_busy_workers() {
    # No --cwd here: the router needs a machine-wide count of live workers, not
    # a per-path filter. Two checkouts on the same machine share this count —
    # cross-repo inflation is fail-safe (gates spawning conservatively).
    # 2>/dev/null drops daemon noise.
    local out
    if ! out=$("${CLAUDE_AGENTS_CMD:-claude}" agents --json 2>/dev/null); then
      return 1
    fi
    if [[ -z "${out//[[:space:]]/}" ]]; then
      return 1
    fi

    # One jq pass validates the array shape and counts matches. Non-array
    # input errors out and the result is UNKNOWN.
    local count
    if ! count=$(jq -r '
      if type == "array"
      then [ .[]
        | select(.name | type == "string" and test("^[0-9]+-"))
        | select(.status == "busy") ] | length
      else error("claude agents --json output is not a JSON array")
      end' <<<"$out" 2>/dev/null); then
      return 1
    fi
    printf '%s\n' "$count"
    return 0
  }

  # verify_agent_registered_under <agent-name> <cwd> — bounded-retry verify
  # that closes the async-registration race after `claude --bg` returns.
  # See the header comment for the return-code contract.
  verify_agent_registered_under() {
    local agent_name="${1:-}"
    local cwd="${2:-}"
    if [[ -z "$agent_name" || -z "$cwd" ]]; then
      printf 'lib-claude-agents: verify_agent_registered_under requires <agent-name> <cwd>\n' >&2
      return 1
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
    for (( i = 0; i < max_attempts; i++ )); do
      if sessions=$(claude_sessions_under "$cwd"); then
        while IFS=$'\t' read -r _ _ status name; do
          # Confirm only a live successor: a "stopped" row with the target name
          # must not count as registered (mirrors the spawn-script dedup guards).
          [[ "$status" == "stopped" ]] && continue
          [[ "$name" == "$agent_name" ]] && return 0
        done <<<"$sessions"
      fi
      (( i + 1 < max_attempts )) && sleep "$interval_s"
    done
    return 1
  }

fi
