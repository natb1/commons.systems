#!/usr/bin/env bash
# lib-verify-fence.sh — the shared ```verify fence parser.
#
# Sourced, not executed. Exposes one function, `extract_verify_blocks`, which
# performs the plan/body walk that locates the `## Verification` section and
# extracts every fenced block whose opening fence is exactly three backticks
# immediately followed by the info string `verify`.
#
# It was lifted verbatim out of `dispatch-run-verification` so a second caller
# (`lint-verify-fence-paths.sh`, which scans intention-node bodies for
# fence-named paths that no longer exist) walks the SAME state machine rather
# than a drifting copy. The two callers want different things from the
# unclosed-fence case — dispatch-run-verification treats it as a hard exit 5,
# the linter merely skips the node — so the walk reports that condition to the
# caller instead of deciding it.
#
# Usage:
#   source "$(dirname "${BASH_SOURCE[0]}")/lib-verify-fence.sh"
#   declare -a blocks=()
#   unclosed=0
#   extract_verify_blocks "$TEXT" blocks unclosed
#
# Args:
#   $1 — the full plan/body markdown text.
#   $2 — name of an ARRAY variable the caller declared; it is reset and then
#        populated so element i is the full body of verify block i+1 (each body
#        newline-terminated, exactly as the original inlined walk produced).
#   $3 — name of a SCALAR variable set to 1 when the walk reached EOF while
#        still capturing an unclosed `verify` fence, else 0.
#
# Always returns 0 — an unclosed fence is reported via $3, not via the exit
# status, because it is not an error for every caller.

# Walk `$1`, filling the caller's array (`$2`) and unclosed flag (`$3`).
extract_verify_blocks() {
  local _evb_text="$1"
  local -n _evb_blocks_ref="$2"
  local -n _evb_unclosed_ref="$3"

  # `in_section` is true once we pass the first "## Verification..." heading and
  # false again at the next "## " heading at the section's top level. `in_fence`
  # tracks whether we are inside ANY fenced block, so that (a) a "## " line
  # inside a fence does not end the section, and (b) we can tell a fence open
  # from a fence close. When a `verify` fence opens inside the section,
  # `capturing` is set and subsequent lines are appended to the current block
  # until the closing fence.
  _evb_blocks_ref=()
  local _evb_in_section=0
  local _evb_in_fence=0
  local _evb_capturing=0
  local _evb_current=""
  local _evb_line _evb_info

  while IFS= read -r _evb_line || [[ -n "$_evb_line" ]]; do
    if [[ "$_evb_in_fence" -eq 0 ]]; then
      # Outside a fence: a "## " heading drives section boundaries.
      if [[ "$_evb_line" =~ ^##[[:space:]]+Verification ]]; then
        _evb_in_section=1
        continue
      fi
      if [[ "$_evb_in_section" -eq 1 && "$_evb_line" =~ ^##[[:space:]] ]]; then
        # Next top-level section heading ends Verification.
        _evb_in_section=0
        continue
      fi
      # A fence opening. Match exactly three backticks plus an optional info string.
      if [[ "$_evb_line" =~ ^'```'(.*)$ ]]; then
        _evb_info="${BASH_REMATCH[1]}"
        _evb_in_fence=1
        # Capture only when inside the section and the info string is exactly
        # `verify` (optional trailing whitespace, nothing else).
        if [[ "$_evb_in_section" -eq 1 && "$_evb_info" =~ ^verify[[:space:]]*$ ]]; then
          _evb_capturing=1
          _evb_current=""
        else
          _evb_capturing=0
        fi
        continue
      fi
    else
      # Inside a fence: only a closing triple-backtick fence matters.
      if [[ "$_evb_line" =~ ^'```'[[:space:]]*$ ]]; then
        _evb_in_fence=0
        if [[ "$_evb_capturing" -eq 1 ]]; then
          _evb_blocks_ref+=("$_evb_current")
          _evb_capturing=0
        fi
        continue
      fi
      if [[ "$_evb_capturing" -eq 1 ]]; then
        _evb_current+="$_evb_line"$'\n'
      fi
      continue
    fi
  done <<<"$_evb_text"

  # An unclosed verify fence (opened with ```verify but reaching EOF before its
  # closing ```) leaves capturing=1 with the partial block never appended.
  _evb_unclosed_ref="$_evb_capturing"
  return 0
}
