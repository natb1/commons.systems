#!/usr/bin/env bash
# stamp-dispatch-session.sh — write a per-session dispatch sidecar using local
# git only (no network). Records repo/issue/branch/base_sha/node_id; `pr` starts
# null and is backfilled later by dispatch-stamp-session --backfill-pr.
#
# Bound to SessionStart:startup (fresh claude --bg worker sessions),
# SessionStart:resume (resumed sessions), and Stop (the create-if-missing
# backstop below). Always exits 0 — never blocks session start or a turn yield.
#
# WHAT THE HOOK MUST RESOLVE, AND WHY
# The sidecar's PATH comes from the payload's transcript_path, but its CONTENT
# is derived from a git working tree. Those two must describe the SAME session.
# A hook process does not necessarily run in the session's own tree, so the tree
# is resolved here and passed explicitly as --repo-dir rather than left to
# whatever cwd the hook happens to inherit. Resolution order, with the winning
# source logged to stderr (the transcript records hook stderr, which is how the
# defect below was finally diagnosed):
#
#   1. transcript_path. The transcript lives at
#      ~/.claude/projects/<encoded-cwd>/<sid>.jsonl, where <encoded-cwd> is the
#      session's absolute cwd with every non-alphanumeric character replaced by
#      `-`. Each candidate — $CLAUDE_PROJECT_DIR and every directory under
#      $CLAUDE_PROJECT_DIR/.claude/worktrees/ (all worktrees live there, per
#      .claude/rules/sandbox.md) — is encoded the same way and compared against
#      the transcript's parent directory name. A SUBAGENT transcript sits one
#      level deeper (<projdir>/<sid>/…), so a miss retries ONCE against the
#      grandparent directory name; it never walks further.
#   2. the payload's `.cwd`, when non-empty and a directory.
#   3. the hook process's own cwd — today's behaviour, kept so nothing regresses
#      for callers whose cwd is already right.
#
# RESOLVED UNCERTAINTIES (both negative; measured 2026-08-18)
# (a) SessionStart:startup DOES fire for detached `claude --bg` worker
#     sessions. A worker's own transcript carries the hook result verbatim
#     ({"hookName":"SessionStart:startup","exitCode":0,…}).
# (b) The hook DOES have working local git access. The same record carries the
#     stamp script's own stderr: "branch 'main' is not a worker or graph-native
#     branch … skipping stamp" — git ran and answered.
#     The failure was neither: the hook process ran with cwd = the MAIN CHECKOUT
#     (on `main`) even though the worker session was born in its own worktree,
#     so the worker-branch gate correctly no-opped and ~4 days of detached
#     workers were born with no sidecar at all. $CLAUDE_PROJECT_DIR resolved to
#     the main checkout for those workers. Hence --repo-dir.
#     The same mismatch is a live MIS-ATTRIBUTION hazard, not just an absence:
#     a hook running in a main checkout that happened to sit on a tactic-*/
#     graph-* branch would mint a sidecar at another session's transcript path
#     carrying the WRONG node_id — worse than no sidecar. (Audited 2026-08-18:
#     all 1682 existing sidecars are consistent; no misattribution has occurred.)
#
# IMPLEMENTED BACKSTOP: the hook is also bound to Stop, where it passes
# --only-if-absent. Stop fires in detached workers (verified: a 2026-08-14 bg
# worker transcript carries "hookName":"Stop") and on every turn yield, so
# --only-if-absent short-circuits on the sidecar-exists check BEFORE any git
# work, and a session whose birth stamp was missed still gets one — carrying its
# first-Stop base_sha rather than none. A scripted dispatch-stamp-session call
# in each phase SKILL.md is NOT the fix: ~/.claude/projects is read-only to
# sandboxed Bash, so a call that forgets `dangerouslyDisableSandbox` fails
# silently at exit 0 — an unenforceable prose instruction that would have to be
# repeated in 7+ skill bodies and would still miss every lane with no chokepoint.
#
# MONITOR: rsi-audit surfaces window.sidecar_eligible (worker sessions scanned),
# window.sidecar_present (those carrying a .dispatch-stamp.json), and the
# derived window.sidecar_present_rate. That rate is a FLEET-SCOPE signal only.
# At --node scope it is structurally 1-or-null — the scope filter can only
# select sessions BY their sidecar, so a node-scoped run never sees an unstamped
# session — and the run reports window.sidecar_coverage_measurable = false to
# say so. The node-scope substitute is window.scope_filter_dropped_unstamped
# (alongside window.scope_filter_dropped_other_node). Carry this caveat with it:
# those counters count CANDIDATE TRANSCRIPTS, NOT WORKER SESSIONS — worker
# classification happens in the aggregator's stage 1, which a dropped file never
# reaches — so a nonzero value is normal and is a disambiguator ("node scope
# found nothing because nothing was stamped" vs "…because nothing matched"),
# not an alarm. aggregate-usage.sh's BEHAVIOR CONTRACT header is the single home
# of the full field contract.
set -uo pipefail
trap 'echo "[stamp-dispatch-session] WARNING: unexpected error on line $LINENO" >&2; exit 0' ERR

STDIN_JSON=$(cat 2>/dev/null) || STDIN_JSON=""
SESSION_ID=$(printf '%s' "$STDIN_JSON" | jq -r '.session_id // empty' 2>/dev/null) || SESSION_ID=""
TRANSCRIPT_PATH=$(printf '%s' "$STDIN_JSON" | jq -r '.transcript_path // empty' 2>/dev/null) || TRANSCRIPT_PATH=""
HOOK_EVENT=$(printf '%s' "$STDIN_JSON" | jq -r '.hook_event_name // empty' 2>/dev/null) || HOOK_EVENT=""
PAYLOAD_CWD=$(printf '%s' "$STDIN_JSON" | jq -r '.cwd // empty' 2>/dev/null) || PAYLOAD_CWD=""

if [[ -z "$SESSION_ID" || -z "$TRANSCRIPT_PATH" ]]; then
  echo "[stamp-dispatch-session] session_id or transcript_path missing in hook payload; skipping stamp" >&2
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" || exit 0
STAMP_SCRIPT="$SCRIPT_DIR/../skills/dispatch-propagate/scripts/dispatch-stamp-session"

if [[ ! -x "$STAMP_SCRIPT" ]]; then
  echo "[stamp-dispatch-session] dispatch-stamp-session not found or not executable at '$STAMP_SCRIPT'; skipping stamp" >&2
  exit 0
fi

# --- resolve the session's own working tree ---------------------------------

# encode_cwd — the projects-root directory-name encoding: every non-alphanumeric
# character becomes `-`.
encode_cwd() {
  printf '%s' "$1" | sed 's/[^A-Za-z0-9]/-/g'
}

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-}"
SESSION_DIR=""
SESSION_DIR_SOURCE=""

# resolve_from_encoded — match one encoded directory name against the project
# root and every worktree under it. Sets SESSION_DIR on a hit.
resolve_from_encoded() {
  local encoded="$1" cand
  [[ -n "$encoded" ]] || return 1
  [[ -n "$PROJECT_DIR" && -d "$PROJECT_DIR" ]] || return 1
  if [[ "$(encode_cwd "$PROJECT_DIR")" == "$encoded" ]]; then
    SESSION_DIR="$PROJECT_DIR"
    return 0
  fi
  for cand in "$PROJECT_DIR"/.claude/worktrees/*; do
    [[ -d "$cand" ]] || continue
    if [[ "$(encode_cwd "$cand")" == "$encoded" ]]; then
      SESSION_DIR="$cand"
      return 0
    fi
  done
  return 1
}

if resolve_from_encoded "$(basename "$(dirname "$TRANSCRIPT_PATH")")"; then
  SESSION_DIR_SOURCE="transcript_path"
elif resolve_from_encoded "$(basename "$(dirname "$(dirname "$TRANSCRIPT_PATH")")")"; then
  # A subagent transcript sits one level deeper; retry ONCE, no further.
  SESSION_DIR_SOURCE="transcript_path (subagent, grandparent)"
elif [[ -n "$PAYLOAD_CWD" && -d "$PAYLOAD_CWD" ]]; then
  SESSION_DIR="$PAYLOAD_CWD"
  SESSION_DIR_SOURCE="payload cwd"
else
  SESSION_DIR="$PWD"
  SESSION_DIR_SOURCE="process cwd"
fi

echo "[stamp-dispatch-session] session tree '$SESSION_DIR' resolved from $SESSION_DIR_SOURCE" >&2

STAMP_ARGS=(--session-id "$SESSION_ID" --transcript-path "$TRANSCRIPT_PATH" --repo-dir "$SESSION_DIR")
if [[ "$HOOK_EVENT" == "Stop" ]]; then
  # Backstop: create-if-missing only. Stop fires on every turn yield, so this
  # must not re-derive an existing sidecar (it would advance base_sha's
  # provenance) and must not do git work when one is already there.
  STAMP_ARGS+=(--only-if-absent)
fi

"$STAMP_SCRIPT" "${STAMP_ARGS[@]}" || true

exit 0
