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
#   claude_sessions_under   <worktree-path>
#   worktree_has_live_session <worktree-path>
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

    # Capture stdout and exit code separately — `local out=$(...)` would mask
    # the exit code. 2>/dev/null drops daemon noise; only the exit code and a
    # well-formed JSON array on stdout are trusted.
    local out rc
    out=$("${CLAUDE_AGENTS_CMD:-claude}" agents --json --cwd "$path" 2>/dev/null)
    rc=$?
    if [[ "$rc" -ne 0 ]]; then
      # Non-zero exit: `claude` missing (127), the daemon unreachable, or any
      # other failure. The session state cannot be determined — unknown.
      return 1
    fi

    # A zero exit must still yield a JSON array. Anything else — empty output,
    # an object, malformed JSON — is unknown, not a definite "no sessions".
    if ! jq -e 'type == "array"' >/dev/null 2>&1 <<<"$out"; then
      return 1
    fi

    # Valid array (including `[]`): one TSV line per session. Capture first so
    # a degenerate array (e.g. of non-objects) that makes jq fail extraction
    # yields unknown (return 1) rather than partial output.
    local lines
    lines=$(jq -r '.[] | [.sessionId, .pid, .status, .name] | @tsv' <<<"$out" 2>/dev/null)
    rc=$?
    if [[ "$rc" -ne 0 ]]; then
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

fi
