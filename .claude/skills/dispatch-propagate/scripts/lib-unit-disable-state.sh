#!/usr/bin/env bash
# lib-unit-disable-state.sh — the single read point for a PER-UNIT manual-disable
# sentinel: a per-timer marker file an operator creates to say "leave this
# systemd unit alone", read by anything that installs/re-arms dispatch's
# systemd timer units (ensure_healer_units, ensure_watcher_units, and any
# future ensure_*_units installer in lib.sh) before it unconditionally
# re-enables a timer a human deliberately turned off.
#
# This is the per-UNIT sibling of lib-pause-state.sh's global pause sentinel:
# that file gates whether dispatch SCHEDULES WORK at all; this file gates
# whether a specific systemd timer unit should be left disabled across a
# reseed. They are deliberately separate files/sentinels — a global pause and
# a per-unit disable are independent axes (an operator can disable one timer
# while dispatch keeps scheduling everything else).
#
# The tri-state (disabled / not-disabled / unknown) mirrors
# lib-pause-state.sh's rationale exactly: for an INSTRUMENT (as opposed to a
# GATE), an unreadable sentinel state must surface as its own distinct value,
# UNKNOWN, rather than collapsing into either "definitely disabled" or
# "definitely not disabled" — either collapse would misreport what is not
# actually known. See lib-pause-state.sh's header for the fuller argument;
# it applies here unchanged.
#
# Usage: source this file, then call:
#   dispatch_unit_disable_sentinel_path <timer-unit-name>
#   dispatch_unit_disable_state <timer-unit-name>
#
# dispatch_unit_disable_sentinel_path <unit>
#   Prints the absolute sentinel path for <unit> to stdout and ALWAYS returns
#   0. Does not check whether the path exists — this is a pure path
#   computation, used by callers (and by ensure_*_units installers) that need
#   the path itself rather than the tri-state read.
#
# dispatch_unit_disable_state <unit>
#   Prints exactly one of three tokens to stdout and ALWAYS returns 0 — the
#   token, not the exit code, is the contract. A caller that reads only `$?`
#   cannot distinguish `unknown` from `not-disabled` from `disabled`; it must
#   read stdout.
#     disabled      — the sentinel directory exists, is searchable, and the
#                      per-unit marker file exists inside it.
#     not-disabled  — a definite negative: either the sentinel directory does
#                      not exist at all (no unit has ever been manually
#                      disabled here, so the marker is definitely absent), or
#                      the directory exists, is searchable, and the marker is
#                      absent from it.
#     unknown       — the sentinel directory exists but cannot be searched
#                      (e.g. mode 000), so the marker's presence cannot be
#                      determined either way; OR the <unit> argument fails
#                      validation (empty, contains `/`, or is `.`/`..`) — an
#                      unvalidated argument must never be used to build a
#                      path, so a bad argument reads as "cannot be
#                      determined" rather than silently reading some other
#                      file.
#
#   The searchability test is applied to the sentinel's PARENT DIRECTORY, not
#   the marker file itself: a directory without execute (search) permission
#   cannot be traversed to find the file inside it — regardless of the file's
#   own permissions — and a bare `[[ -e "$dir/$unit" ]]` on such a directory
#   fails with a permission error indistinguishable from "just not there"
#   unless the directory's own searchability is checked first.
#
# Environment:
#   DISPATCH_UNIT_DISABLE_DIR   The sentinel directory. A test override or an
#                                operator override applies uniformly. Default:
#                                ${XDG_DATA_HOME:-$HOME/.local/share}/commons-dispatch/disabled
#
# Operator procedure — disable a timer so reseed stops re-arming it (create
# the sentinel FIRST — a reseed landing between the disable and the sentinel
# re-arms the timer):
#   mkdir -p ~/.local/share/commons-dispatch/disabled
#   touch    ~/.local/share/commons-dispatch/disabled/dispatch-fleet-watch.timer
#   systemctl --user disable --now dispatch-fleet-watch.timer
#
# Re-enable:
#   rm ~/.local/share/commons-dispatch/disabled/dispatch-fleet-watch.timer
#   systemctl --user enable --now dispatch-fleet-watch.timer   # or wait for the next reseed
#
# Confirm a disable is being honored (works in steady state, not only on the
# reseed cycle that rewrites the unit files):
#   journalctl --user -t dispatch-schedule-reseed --since '-1h' | grep 'skipping enable --now'
#   # → "...is marked manually disabled (<sentinel path>); unit files already
#   #    current, skipping enable --now"   — and NO `WARNING:` for this unit.
# Only ensure_healer_units and ensure_watcher_units consult this sentinel; the
# other ensure_*_units installers in lib.sh do not.
#
# Safe to source multiple times. Does NOT use set -e (must return, not exit).
#
# CRITICAL DIVERGENCE from lib-pause-state.sh: that file sets `set -uo
# pipefail` in its load guard. This file deliberately does NOT set any shell
# options on the sourcing shell, because lib.sh sources this file and lib.sh
# is itself sourced by dozens of scripts that are not written under `set -u`
# — imposing it here would change behavior far outside this file's own
# functions. Instead, every function below is written to be `set -u`-safe on
# its own: every parameter expansion uses `${VAR:-default}` or a
# `${1:-}`-guarded positional parameter, so the functions behave correctly
# whether or not the calling shell already has `set -u` active.

if [[ -z "${_LIB_UNIT_DISABLE_STATE_LOADED:-}" ]]; then
  _LIB_UNIT_DISABLE_STATE_LOADED=1

  # dispatch_unit_disable_sentinel_path — print the absolute sentinel path for
  # <unit>. ALWAYS returns 0. Pure path computation; does not validate <unit>
  # or check existence.
  dispatch_unit_disable_sentinel_path() {
    local unit="${1:-}"
    local dir="${DISPATCH_UNIT_DISABLE_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/commons-dispatch/disabled}"
    printf '%s/%s\n' "$dir" "$unit"
    return 0
  }

  # dispatch_unit_disable_state — print disabled|not-disabled|unknown for
  # <unit>. See the header comment for the full contract. ALWAYS returns 0.
  dispatch_unit_disable_state() {
    local unit="${1:-}"

    # Defensive boundary check: never build a path from an unvalidated
    # component. An empty argument, a path-separator-bearing argument, or a
    # `.`/`..` argument could escape the sentinel directory or collide with
    # it; refuse to guess and report unknown instead.
    if [[ -z "$unit" || "$unit" == *"/"* || "$unit" == "." || "$unit" == ".." ]]; then
      echo "WARNING: dispatch_unit_disable_state: invalid unit argument: '${unit}'" >&2
      printf 'unknown\n'
      return 0
    fi

    local dir="${DISPATCH_UNIT_DISABLE_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/commons-dispatch/disabled}"
    local marker="$dir/$unit"

    # No sentinel directory at all → no unit has ever been manually disabled
    # here, so the marker is definitely absent.
    if [[ ! -d "$dir" ]]; then
      printf 'not-disabled\n'
      return 0
    fi

    # The directory exists but cannot be searched (traversed) → the marker's
    # presence cannot be determined either way, whatever its own permissions
    # might otherwise allow.
    if [[ ! -x "$dir" ]]; then
      printf 'unknown\n'
      return 0
    fi

    # Directory exists and is searchable: a direct existence test is now
    # authoritative.
    if [[ -e "$marker" ]]; then
      printf 'disabled\n'
    else
      printf 'not-disabled\n'
    fi
    return 0
  }

fi
