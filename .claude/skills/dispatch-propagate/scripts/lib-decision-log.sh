#!/usr/bin/env bash
# lib-decision-log.sh — sourceable, write-only JSONL decision-log append helper
# for the dispatch control path.
#
# The headless dispatch control path (select-tick, stop, and other per-worker
# sites) emits a structured per-tick routing decision as one JSON line. This
# helper owns the append: it is the SINGLE shared writer of the decision log.
# Callers build a complete JSON object with `jq -n`/`jq -c` and hand the string
# to `decision_log_append`. The helper itself guarantees single-line, valid-JSON
# output on disk regardless of whether the caller passed compact (`jq -nc`) or
# pretty-printed (`jq -n`) JSON: it canonicalizes the argument through `jq -c .`
# before appending, so callers may use either form. Non-JSON/unparseable input
# is silently dropped: NO stderr diagnostic, NO sentinel record — the whole
# function body is wrapped in `2>/dev/null || true` so it can run inside
# EXIT-trap handlers under `set -euo pipefail` without ever killing the caller.
# Operator consequence: a missing record for a call site means either the write
# failed or the argument was not valid JSON. Remedy: build payloads with
# `jq -c -n`; test-lib-decision-log-compact.sh covers the canonicalization.
# The helper ensures the directory, rotates the log when it grows too large,
# and appends the line under a flock so concurrent per-worker writers never
# interleave a rotate-then-append.
#
# Usage: source this file, then call:
#   decision_log_append <json-string>
#
# decision_log_append <json-string>
#   Append one JSON line to the decision log. The ENTIRE body is wrapped so any
#   internal failure (unwritable dir, missing tool, stat/mv/append error) is
#   swallowed: the function ALWAYS returns 0 and never writes to the caller's
#   stdout/stderr on failure. Callers run under `set -euo pipefail` and must
#   never die because the decision-log write failed — the log is a best-effort,
#   non-fatal observability sink. Before appending it runs rotation (see below).
#     return 0 — ALWAYS. Success and every internal failure both return 0.
#
# Rotation policy:
#   Single-generation rename. Before appending, if the log file exists and its
#   size is ≥ 5 MB, it is `mv`'d to `<log>.old` (overwriting any prior `.old`).
#   This is one bounded backup — no N-generation ring, no truncate. Rotation
#   runs inside the flock critical section so rotate-then-append is atomic
#   across concurrent writers.
#
# Concurrency:
#   A `flock` on `<log>.lock` serializes the rotate+append critical section.
#   Per-worker sites (e.g. dispatch-stop.sh) can run concurrently, and JSONL
#   lines can exceed PIPE_BUF (4 KB) so O_APPEND alone is not atomic for
#   interleaved writers. If `flock` is unavailable, the helper degrades to a
#   plain rotate+append (still non-fatal).
#
# The decision log is WRITE-ONLY through this helper. The only operations on the
# log file are: mkdir (its dir), stat (size), mv (rotate), and append
# (printf >>). No prior log CONTENT is ever read back or parsed here by design —
# the log file is append-only through this helper. (The incoming ARGUMENT is a
# separate matter: it is parsed once per call by `jq -c .` to canonicalize it.)
#
# Path:
#   DECISION_LOG_FILE — the resolved log path, exported as a var for callers.
#   Default: $HOME/.local/share/commons-dispatch/routing-decisions.jsonl
#
# Test overrides:
#   DISPATCH_DECISION_LOG_DIR   Override the log DIRECTORY (the file
#                               routing-decisions.jsonl is placed inside it).
#                               Used by tests to point the log at a scratch dir.
#   DISPATCH_DECISION_LOG_FILE  Override the full log file PATH (takes
#                               precedence over DISPATCH_DECISION_LOG_DIR).
#
# Safe to source multiple times. Does NOT use set -e (the function returns,
# never exits).
#
# Side effect: sourcing this file once sets `-u` and `-o pipefail` in the caller
# shell (via its own load-guard). New callers should be aware before sourcing.

if [[ -z "${_LIB_DECISION_LOG_LOADED:-}" ]]; then
  _LIB_DECISION_LOG_LOADED=1

  set -uo pipefail

  # Resolve the log path. DISPATCH_DECISION_LOG_FILE overrides the full path;
  # otherwise the file lives under DISPATCH_DECISION_LOG_DIR (or the default
  # commons-dispatch state dir). Mirrors update-rate-limits.sh's STATE_FILE.
  DECISION_LOG_FILE="${DISPATCH_DECISION_LOG_FILE:-${DISPATCH_DECISION_LOG_DIR:-$HOME/.local/share/commons-dispatch}/routing-decisions.jsonl}"

  # Rotation threshold: 5 MB = 5 * 1024 * 1024 bytes. At/above this size the log
  # is renamed to <log>.old before the next append (single-generation backup).
  _DECISION_LOG_MAX_BYTES=5242880

  # decision_log_append <json-string> — append one JSON line, non-fatally.
  # See the header comment for the rotation/concurrency/return-code contract.
  decision_log_append() {
    local json="${1:-}"
    # The ENTIRE body is wrapped so ANY internal failure is swallowed: stderr is
    # silenced and the `|| true` absorbs a non-zero status. The explicit
    # `return 0` below guarantees the function never propagates a failure to a
    # caller running under `set -e`.
    {
      # Canonicalize the caller's argument to single-line JSON up front, once,
      # reused by both the flock and no-flock branches below. On invalid JSON,
      # `jq -c .` exits non-zero and the `&&` chain short-circuits, so the
      # append is skipped; the outer `return 0` still holds.
      local canonical_json
      canonical_json=$(printf '%s' "$json" | jq -c .) &&

      mkdir -p "$(dirname "$DECISION_LOG_FILE")" &&

      {
        local lockfile="${DECISION_LOG_FILE}.lock"

        if command -v flock >/dev/null 2>&1; then
          # Serialize rotate+append across concurrent per-worker writers. A failed
          # or timed-out flock (fd 9) exits the subshell 0 — the append is dropped
          # rather than racing or blocking, consistent with the best-effort
          # contract. The 2-second wait (-w 2) bounds the worst-case hang when
          # another live process holds the lock, so this EXIT-trap handler can
          # never stall dispatch-stop.sh / dispatch-select-tick indefinitely.
          (
            flock -w 2 9 || exit 0
            _decision_log_rotate
            printf '%s\n' "$canonical_json" >> "$DECISION_LOG_FILE"
          ) 9>"$lockfile"
        else
          # No flock available — degrade to a plain rotate+append (still non-fatal).
          _decision_log_rotate
          printf '%s\n' "$canonical_json" >> "$DECISION_LOG_FILE"
        fi
      }
    } 2>/dev/null || true
    return 0
  }

  # _decision_log_rotate — private: rotate the log if it has reached the size
  # threshold. Runs INSIDE the flock critical section so rotate-then-append is
  # atomic. Single-generation: rename to <log>.old (overwriting any prior .old).
  _decision_log_rotate() {
    local size
    if [[ -f "$DECISION_LOG_FILE" ]]; then
      size=$(stat -c%s "$DECISION_LOG_FILE" 2>/dev/null) || return 0
      if [[ "$size" =~ ^[0-9]+$ ]] && (( size >= _DECISION_LOG_MAX_BYTES )); then
        mv -f "$DECISION_LOG_FILE" "${DECISION_LOG_FILE}.old" 2>/dev/null || return 0
      fi
    fi
    return 0
  }

fi
