#!/usr/bin/env bash
# lib-claude-agents.sh — sourceable helper for Claude session liveness.
#
# /dispatch must know whether a git worktree currently has a live Claude
# session in it, so it never opens a second session on a worktree another
# session owns. This helper answers that against `claude agents --json`, the
# daemon-backed registry of live sessions (Claude Code >= 2.1.146), replacing
# the brittle /proc-walk previously duplicated across dispatch scripts.
#
# Usage: source this file, then call:
#   claude_sessions_under        <worktree-path>
#   worktree_has_live_session    <worktree-path>
#   other_live_sessions_under    <worktree-path>
#
# claude_sessions_under <path>
#   The low-level primitive. Runs `claude agents --json --cwd <path>`, which
#   filters server-side to sessions started under <path>.
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
#
# worktree_has_live_session <path>
#   The ergonomic fail-safe predicate. Folds unknown into the occupied branch:
#     return 0 — occupied OR unknown: do NOT start a session under <path>.
#     return 1 — definitely no live session under <path>.
#   `if worktree_has_live_session <path>` is fail-safe by construction.
#
# other_live_sessions_under <path>
#   Self-filtering predicate: answers "are there live sessions under <path>
#   besides the current session?" Filters rows whose sessionId matches
#   $CLAUDE_CODE_SESSION_ID before deciding. Fail-safe semantics match
#   worktree_has_live_session — any uncertainty returns "occupied" so the
#   caller falls through rather than mis-claiming the worktree:
#     return 0 — another session is present, OR unknown (daemon unreachable),
#               OR $CLAUDE_CODE_SESSION_ID is empty (cannot filter self, so
#               the rows might include foreign sessions misattributed to "me").
#               In all three cases the worktree should be treated as occupied.
#     return 1 — the daemon was queried successfully AND the only session(s)
#               present belong to the current session (or there are none).
#   `if other_live_sessions_under <path>` is fail-safe by construction.
#
# Test override: CLAUDE_AGENTS_CMD replaces the `claude` invocation with an
# arbitrary command (e.g. an absolute path to a fake script), so the helper is
# testable with no real daemon. Default: `claude`.
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

  # worktree_has_live_session <path> — fail-safe liveness predicate.
  # See the header comment for the return-code contract.
  worktree_has_live_session() {
    local path="${1:-}"
    local sessions
    if ! sessions=$(claude_sessions_under "$path"); then
      # Unknown — the daemon could not be queried. Fail safe: occupied.
      return 0
    fi
    if [[ -n "$sessions" ]]; then
      # The daemon reported one or more live sessions under <path>.
      return 0
    fi
    # The daemon was queried successfully and reported zero sessions.
    return 1
  }

  # other_live_sessions_under <path> — self-filtering fail-safe predicate.
  # See the header comment for the return-code contract.
  other_live_sessions_under() {
    local path="${1:-}"
    local sessions
    if ! sessions=$(claude_sessions_under "$path"); then
      return 0   # unknown → fail-safe occupied
    fi
    if [[ -z "$sessions" ]]; then
      return 1   # daemon confirmed zero sessions
    fi
    local self="${CLAUDE_CODE_SESSION_ID:-}"
    if [[ -z "$self" ]]; then
      return 0   # cannot filter self → fail-safe occupied
    fi
    # claude_sessions_under emits sessionId<TAB>pid<TAB>status<TAB>name.
    local other
    other=$(printf '%s\n' "$sessions" | awk -F'\t' -v self="$self" '$1 != self')
    [[ -n "$other" ]]
  }

fi
