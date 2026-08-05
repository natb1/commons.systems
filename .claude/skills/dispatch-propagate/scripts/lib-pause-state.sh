#!/usr/bin/env bash
# lib-pause-state.sh — the single read point for dispatch's pause sentinel
# across every OUT-OF-BAND instrument (anything that reports on pause state
# without itself gating a scheduling decision).
#
# dispatch-tick resolves and checks the sentinel inline, at its own "Pause
# sentinel" block (around dispatch-tick:291-292):
#   DISPATCH_PAUSE_FLAG="${DISPATCH_PAUSE_FLAG:-${XDG_DATA_HOME:-$HOME/.local/share}/commons-dispatch/paused}"
# That check is a GATE — it decides whether the tick spawns work — and its
# fail-closed default (an unreadable sentinel state must not let scheduling
# proceed) is correct there. Changing it is a separate decision and out of
# scope for this file; dispatch-tick's own check is left untouched.
#
# This file exists for every OTHER caller that merely wants to REPORT pause
# state — a dashboard, a decision-log annotator, a status line, an office-hours
# summary — none of which should duplicate the sentinel-path expression or
# invent their own reading of it. When `tactic-dispatch-pause-config-field`
# lands (moving the pause flag from a sentinel file to a config field), this
# file is the ONE file that migrates every one of those callers at once.
#
# The tri-state (paused / not-paused / unknown) is why this file is not just
# `[[ -e "$DISPATCH_PAUSE_FLAG" ]]`. For a GATE, fail-closed is correct: an
# unreadable state should refuse to schedule. But for an INSTRUMENT, the same
# unreadable state must surface as its own distinct value, UNKNOWN, and the
# instrument must still emit — collapsing "I can't tell" into "not paused"
# would misreport a possibly-paused fleet as running; collapsing it into
# "paused" would misreport a running fleet as stopped. Neither is honest, and
# an instrument's job is to report what is actually known.
#
# Usage: source this file, then call:
#   dispatch_pause_state
#
# dispatch_pause_state
#   No arguments. Prints exactly one of three tokens to stdout and ALWAYS
#   returns 0 — the token, not the exit code, is the contract. A caller that
#   reads only `$?` cannot distinguish `unknown` from `not-paused` from
#   `paused`; it must read stdout.
#     paused      — the sentinel file exists.
#     not-paused  — a definite negative: either the state directory does not
#                   exist at all (dispatch has never run here, so the sentinel
#                   is definitely absent), or the directory exists, is
#                   searchable, and the sentinel file is absent from it.
#     unknown     — the state directory exists but cannot be searched (e.g.
#                   mode 000), so the sentinel's presence cannot be
#                   determined either way.
#
#   The searchability test is applied to the sentinel's PARENT DIRECTORY, not
#   the sentinel file itself: a directory without execute (search) permission
#   cannot be traversed to find the file inside it — regardless of the file's
#   own permissions — and a bare `[[ -e "$dir/paused" ]]` on such a directory
#   fails with a permission error indistinguishable from "just not there"
#   unless the directory's own searchability is checked first.
#
# Environment:
#   DISPATCH_PAUSE_FLAG   The sentinel path. Same variable name dispatch-tick
#                         itself reads, so a test override or an operator
#                         override applies uniformly to both the gate and every
#                         instrument. Default:
#                         ${XDG_DATA_HOME:-$HOME/.local/share}/commons-dispatch/paused
#
# Safe to source multiple times. Does NOT use set -e (must return, not exit).
#
# Side effect: sourcing this file once sets `-u` and `-o pipefail` in the
# caller shell (via its own load guard).

if [[ -z "${_LIB_PAUSE_STATE_LOADED:-}" ]]; then
  _LIB_PAUSE_STATE_LOADED=1

  set -uo pipefail

  # dispatch_pause_state — print paused|not-paused|unknown. See the header
  # comment for the full contract. ALWAYS returns 0.
  dispatch_pause_state() {
    local flag="${DISPATCH_PAUSE_FLAG:-${XDG_DATA_HOME:-$HOME/.local/share}/commons-dispatch/paused}"
    local dir
    dir="$(dirname -- "$flag")"

    # No state directory at all → dispatch has never run here, so the
    # sentinel is definitely absent.
    if [[ ! -d "$dir" ]]; then
      printf 'not-paused\n'
      return 0
    fi

    # The directory exists but cannot be searched (traversed) → the
    # sentinel's presence cannot be determined either way, whatever its own
    # permissions might otherwise allow.
    if [[ ! -x "$dir" ]]; then
      printf 'unknown\n'
      return 0
    fi

    # Directory exists and is searchable: a direct existence test is now
    # authoritative.
    if [[ -e "$flag" ]]; then
      printf 'paused\n'
    else
      printf 'not-paused\n'
    fi
    return 0
  }

fi
