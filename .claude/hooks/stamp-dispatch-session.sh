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
#      the transcript's parent directory name. A SUBAGENT transcript sits
#      DEEPER than that — by three or five levels, in the two layouts Claude
#      Code actually writes — so a miss walks UP the ancestor directory names
#      instead of stopping at the parent. The walk's own comment below carries
#      the measured layouts, their file counts, and why the bound is 6.
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
# worker transcript carries "hookName":"Stop") and on every turn yield, so a
# session whose birth stamp was missed still gets one — carrying its
# first-Stop base_sha rather than none. A scripted dispatch-stamp-session call
# in each phase SKILL.md is NOT the fix: ~/.claude/projects is read-only to
# sandboxed Bash, so a call that forgets `dangerouslyDisableSandbox` fails
# silently at exit 0 — an unenforceable prose instruction that would have to be
# repeated in 7+ skill bodies and would still miss every lane with no chokepoint.
#   THE SHORT-CIRCUIT IS PAID HERE, NOT DOWNSTREAM. `--only-if-absent` does
#   short-circuit inside dispatch-stamp-session before that script's git work,
#   but only after this hook has already resolved the session tree — which it
#   did unconditionally, encoding every worktree under .claude/worktrees/ on
#   every turn yield of every session in the project. So Stop now tests the
#   sidecar path itself FIRST, in this hook, and returns before any resolution
#   when one is already there; only the create case (the backstop actually
#   doing its job) reaches the resolver.
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

# Stop fast path. Stop fires on every turn yield of every session in the
# project, and in the overwhelming majority of those yields the sidecar is
# already there — so everything below, tree resolution first of all, is work
# whose only possible outcome is a no-op downstream. The sidecar path is a pure
# string transform of transcript_path, so test it here and leave.
# SessionStart deliberately does NOT take this path: a birth stamp is the one
# write that must still happen, and its resolution is what --repo-dir exists for.
if [[ "$HOOK_EVENT" == "Stop" && -f "${TRANSCRIPT_PATH%.jsonl}.dispatch-stamp.json" ]]; then
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
# character becomes `-`. Spelled in pure bash rather than `sed` because
# resolve_from_encoded calls it once per candidate worktree, and the Stop
# binding runs that on every turn yield: a fork per candidate makes the
# per-yield cost proportional to the number of worktrees on disk. That number is
# volatile — worktrees are cut and reaped continuously — so none is recorded
# here; the point is that it is unbounded and grows, not that it is any given N.
# The case patterns are the same explicit ASCII sets `sed 's/[^A-Za-z0-9]/-/g'`
# used, and test-stamp-dispatch-session.sh asserts byte-identical output against
# the real sed over a table of inputs (underscore, space, @, ., /, a multi-byte
# UTF-8 character, and the empty string).
#
# RESULT IS RETURNED IN THE GLOBAL `ENCODED_CWD`, NOT ON STDOUT — and that is
# the whole point, not a stylistic choice. Bash forks a subshell for EVERY
# command substitution, with no optimization for a function body, so a
# `$(encode_cwd "$cand")` call site forks once per candidate no matter how the
# function is spelled internally: dropping `sed` saved one `exec` per call, not
# the fork. Reading the global is what actually removes it. A caller must
# therefore invoke `encode_cwd "$x"` as a plain command and read $ENCODED_CWD.
# The function must never `printf` its result either: this hook's stdout is
# consumed by Claude Code, so once the value stops travelling through `$(...)`
# there is no subshell left to contain it.
ENCODED_CWD=""
encode_cwd() {
  local s="$1" out="" i ch
  for (( i = 0; i < ${#s}; i++ )); do
    ch="${s:i:1}"
    case "$ch" in
      [0-9a-zA-Z]) out+="$ch" ;;
      *)           out+="-"   ;;
    esac
  done
  ENCODED_CWD="$out"
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
  encode_cwd "$PROJECT_DIR"
  if [[ "$ENCODED_CWD" == "$encoded" ]]; then
    SESSION_DIR="$PROJECT_DIR"
    return 0
  fi
  for cand in "$PROJECT_DIR"/.claude/worktrees/*; do
    [[ -d "$cand" ]] || continue
    encode_cwd "$cand"
    if [[ "$ENCODED_CWD" == "$encoded" ]]; then
      SESSION_DIR="$cand"
      return 0
    fi
  done
  return 1
}

# Encoded-ancestor walk. For a top-level session the encoded cwd IS the
# transcript's parent directory, but a subagent transcript sits deeper. Measured
# over ~/.claude/projects on 2026-08-31, subagent transcripts occur in exactly
# two shapes, counted as path components below the projects root:
#
#   4 components (2294 files)  <projdir>/<sid>/subagents/agent-*.jsonl
#   6 components (4724 files)  <projdir>/<sid>/subagents/workflows/<wf>/agent-*.jsonl
#
# The encoded name is <projdir>, so those need THREE and FIVE dirname steps
# respectively (deepest: file → <wf> → workflows → subagents → <sid> →
# <projdir>). Hence the bound of 6: five for the deepest layout measured, plus
# one so a layout one level deeper still resolves, and no more — the walk stays
# bounded rather than climbing to /.
#
# The code this replaces retried exactly ONCE, against the grandparent. In the
# 4-component layout that lands on <sid> and in the 6-component layout on
# `workflows`; neither is ever an encoded cwd, so the retry could not fire in
# production at all. It passed its test only because the fixture built a
# <projdir>/<sid>/sub-agent.jsonl layout that Claude Code does not write.
ANCESTOR="$TRANSCRIPT_PATH"
for (( UP = 1; UP <= 6; UP++ )); do
  ANCESTOR="$(dirname "$ANCESTOR")"
  [[ "$ANCESTOR" != "/" && "$ANCESTOR" != "." ]] || break
  if resolve_from_encoded "$(basename "$ANCESTOR")"; then
    if (( UP == 1 )); then
      SESSION_DIR_SOURCE="transcript_path"
    else
      SESSION_DIR_SOURCE="transcript_path (ancestor $UP levels up)"
    fi
    break
  fi
done

if [[ -z "$SESSION_DIR" && -n "$PAYLOAD_CWD" && -d "$PAYLOAD_CWD" ]]; then
  SESSION_DIR="$PAYLOAD_CWD"
  SESSION_DIR_SOURCE="payload cwd"
elif [[ -z "$SESSION_DIR" ]]; then
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
