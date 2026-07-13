#!/usr/bin/env bash
# dispatch-stop: phase-skill worker session phase-completion + propagation handler.
#
# tactic-dispatch-legacy-rewire (Unit 2 audit) — dispatch:office-hours + dispatch-phase:
#   The GRAPH-LANE node worker is ALREADY on the greenfield seam: a node-id job
#   (intentions/<JOB_NAME>.md exists) parks via park-node → graph office_hours
#   using the job-dir office-hours-reason / office-hours-recommendation markers,
#   with NO gh label and NO dispatch-phase call (see the `^[0-9]+-` discriminator
#   below and the node-park block right after it). NOTHING to rewire there.
#   The remaining dispatch:office-hours label-apply (Branch A, dispatch-apply-office-hours)
#   and the dispatch-phase call (CURRENT_PHASE) below are reached ONLY on the
#   LEGACY `<N>-` issue-worker path. That path is DEFER-TO-UNIT-3: it dies with
#   the legacy issue lane (still live-wired via dispatch-tick → dispatch-materialize-spawn),
#   so removing it now would break live issue-lane parking. Unit 3 deletes the
#   legacy `<N>-` branch (label-apply + dispatch-phase) when it removes the lane.
#
# Wired to the Stop event. Owns the post-phase disposition: read the
# phase-completed marker, decide whether
# the phase advanced or stalled, manage the dispatch:office-hours label,
# spawn the next headless dispatch-tick (via dispatch-spawn-tick), and
# self-close on a clean advance. Moving
# this out of the model loop fixes a mid-phase context-compaction session
# leak — the harness fires Stop unconditionally at session end, regardless of
# the model's last visible action.
#
# Early not-ready gate (marker-dependent disposition): when dispatch-ci-ready
# reports the target's PR CI is back in progress, there is no actionable verdict
# for any branch below to act on. Spawn the next tick (it re-gates the issue once
# CI concludes), then decide by marker:
#   - Marker present: the phase already completed (marker written, label applied,
#     fix pushed) and only CI is still running — the common case, since a draft
#     PR's CI runs for minutes after the model work finishes in seconds.
#     Self-close the session so it does not leak idle on a held daemon slot.
#   - Marker absent: a genuine mid-phase exit during a CI restart (a push
#     restarted CI between selection and session end — the TOCTOU race). Hand the
#     issue back to the router and exit 0 without parking it on a human or
#     self-closing; the next tick picks it up once CI concludes. (Office-hours
#     would not self-heal: the dispatch queue skips office-hours issues and
#     nothing strips the label.) The router owns the CI gate.
#
# Branches (driven by marker presence + CURRENT_PHASE relative to MARKER_PHASE):
#   P. parse-job clean completion (#1024) — a /budget-parse-job session is named
#      <N>-slug like a worker but writes a `parse-job-done` sentinel instead of a
#      phase-completed marker when its idempotent statement merge succeeds.
#      Checked BEFORE Branches A-D. A clean parse-job produces
#      NO PR (the handler already closed the parse-job issue), so there is no
#      label work: spawn router + self-close. Escalation writes no sentinel — the
#      issue stays open and PR-less and lands in Branch A's office-hours park, so
#      no branch is needed for it here.
#   A. marker absent — phase skill did not run to completion (mid-phase exit
#      or context compaction). Park the ISSUE on a human via
#      dispatch-apply-office-hours (label + why-comment), spawn router, exit 0 —
#      session parks "stopped" for human review.
#   B. marker present + CURRENT_PHASE non-empty + MARKER_PHASE != CURRENT_PHASE
#      — phase advanced. Strip dispatch:office-hours from BOTH the PR (if any)
#      and the ISSUE, spawn router, self-close. Empty CURRENT_PHASE (e.g.
#      dispatch-phase network failure) is treated as "undetermined" and falls
#      through to Branch D rather than triggering a false self-close.
#   C. marker present + same phase + CURRENT_PHASE is any fix-* phase — transient
#      no-push fix-* outcome. Two sub-cases:
#      (a) PR_NUM set + dispatch:<fix-phase>-attempt counter < 3: CI has already
#          concluded and nothing is pending. Spawn router, self-close (so the
#          session does not leak idle holding its worktree); the next tick
#          re-runs the fix-* phase or escalates at the cap. The needs-human
#          fix-* failure never reaches Branch C — the fix-* skill skips the marker
#          for it, so it lands in Branch A (marker absent → park the issue on
#          office-hours on the first run).
#      (b) PR_NUM empty AND CURRENT_PHASE is fix-conflicts (the no-PR
#          provisioning backstop): a fix-conflicts pass that ran during the
#          implement phase before any PR existed. The attempt counter lives on a
#          PR label and does not exist yet, so always self-close and re-seed the
#          chain — the marker being present means fix-conflicts completed a
#          resolvable conflict. The implement phase that opens the PR runs on the
#          next tick. This backstop is fix-conflicts-specific: any other fix-*
#          phase with an empty PR_NUM falls through to Branch D.
#   D. marker present + same phase + NOT Branch C (i.e. PR-present and attempt
#      counter >= 3, a same-phase fix-* phase other than fix-conflicts with empty
#      PR_NUM, or a hypothetical same-phase non-fix-* case) — true
#      non-advancement. Park the ISSUE on a human via dispatch-apply-office-hours
#      (label + why-comment), spawn router, exit 0.
#
# CLOSING NOTE (post-#1108): NO worker branch self-parks idle waiting on pending
# work. The early not-ready gate self-closes its concluded-CI marker-present case
# and hands back its in-progress marker-absent case; Branch C self-closes its
# concluded no-push case (both the PR-present counter-below-cap sub-case and the
# no-PR provisioning backstop sub-case). The remaining exit-0-without-self-close
# branches — Branch A and Branch D office-hours parks, and the early-gate
# marker-absent TOCTOU hand-back — are deliberate human-review parks or router
# hand-backs, not idle waiters.
#
# Discriminator: only acts for a phase-skill worker session. Skipped when
# CLAUDE_JOB_DIR is unset (interactive session), state.json is missing, or the
# recorded --name does NOT match ^[0-9]+- (router names like
# `dispatch-<short-id>` are skipped — they don't run phase skills).
set -uo pipefail
trap 'echo "[dispatch-stop] WARNING: unexpected error on line $LINENO" >&2; exit 0' ERR

# Discriminator 1: managed background job.
if [ -z "${CLAUDE_JOB_DIR:-}" ]; then
  exit 0
fi

STATE_FILE="$CLAUDE_JOB_DIR/state.json"
if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

# Discriminator 2: this job is a worker. Two worker keyspaces:
#   - legacy issue worker — name `<N>-<slug>` (matches ^[0-9]+-); the issue-keyed
#     body below owns it.
#   - graph-native node worker — name IS the intention node id, and
#     `intentions/<id>.md` exists at this worktree's root. Its phase completion /
#     advance is the worker's OWN transition-node write (a state-only commit on
#     origin/main), NOT this hook, so a clean completion needs nothing here. The
#     hook's only node-lane duty is the escalation-park BACKSTOP: if the escalating
#     session left an office-hours-reason, park the node via the graph write
#     (park-node → office_hours), never a gh label. No reason file → clean or bare
#     exit; the node keeps office_hours null, so the next graph tick re-selects it.
# Routers named `dispatch-<short-id>` are neither keyspace and MUST be skipped —
# they don't run phase skills.
JOB_NAME=$(jq -r '.name // empty' "$STATE_FILE" 2>/dev/null) || JOB_NAME=""
_HOOK_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." 2>/dev/null && pwd)" || _HOOK_ROOT=""
if ! [[ "$JOB_NAME" =~ ^[0-9]+- ]]; then
  # Not a legacy issue worker. Node worker iff intentions/<JOB_NAME>.md exists.
  if [[ -n "$JOB_NAME" && -n "$_HOOK_ROOT" && -f "$_HOOK_ROOT/intentions/$JOB_NAME.md" ]]; then
    _OH_REASON_FILE="$CLAUDE_JOB_DIR/office-hours-reason"
    if [ -s "$_OH_REASON_FILE" ]; then
      _OH_REASON="$(cat "$_OH_REASON_FILE" 2>/dev/null || true)"
      _OH_RECO=""
      if [ -s "$CLAUDE_JOB_DIR/office-hours-recommendation" ]; then
        _OH_RECO="$(cat "$CLAUDE_JOB_DIR/office-hours-recommendation" 2>/dev/null || true)"
      fi
      _PARK="$_HOOK_ROOT/packages/intentionsutil/scripts/park-node"
      if [ -n "$_OH_REASON" ] && [ -x "$_PARK" ]; then
        # Backstop park via the graph-commit primitive. Best-effort: a failure
        # (e.g. graph-commit's PR-branch fast-path guard — the worker's own
        # in-session park applies the reset-dance; this backstop does not) is
        # non-fatal, matching this hook's best-effort philosophy.
        if [ -n "$_OH_RECO" ]; then
          "$_PARK" "$JOB_NAME" "$_OH_REASON" "$_OH_RECO" >/dev/null 2>&1 \
            || echo "[dispatch-stop] WARNING: park-node for '$JOB_NAME' failed (non-fatal)" >&2
        else
          "$_PARK" "$JOB_NAME" "$_OH_REASON" >/dev/null 2>&1 \
            || echo "[dispatch-stop] WARNING: park-node for '$JOB_NAME' failed (non-fatal)" >&2
        fi
      fi
    fi
  fi
  # Node worker (parked or clean) and routers alike: nothing more for this hook.
  exit 0
fi

# Drain any buffered single-line JSON payload fast. Short timeout so an open,
# idle stdin (hook events never close stdin at EOF) returns in ~0.1s rather
# than stalling a full second on the NUL delimiter. The payload is KEPT (not
# discarded) so Branch A's idle-poll discriminator can resolve the stopping
# session's transcript path below.
PAYLOAD=""
if read -rt 0.1 PAYLOAD; then :; fi

# Resolve the stopping session's transcript path for the Branch A idle-poll
# discriminator (session_scheduled_wakeup). Two sources, in order:
#   (a) the Stop payload's `transcript_path` field (standard Claude Code Stop
#       hook schema) — the primary source; and
#   (b) a state.json-derived fallback when (a) is empty: sessionId + cwd, with
#       cwd mapped to the Claude Code project-dir slug by replacing every `/`
#       and `.` with `-`. The derived path
#       ~/.claude/projects/<slug>/<sessionId>.jsonl is the live transcript
#       location (confirmed to exist for a running managed-bg worker), and the
#       running session's final assistant turn IS flushed to that file before
#       the Stop hook reads it.
# A here-string feeds jq (NOT `echo "$PAYLOAD" | jq` — zsh-style echo
# un-escapes \t/\n in the payload JSON and corrupts it; see
# .claude/rules/shell-json.md). If both sources fail, TRANSCRIPT_PATH stays
# empty and the discriminator falls through to today's fail-safe park.
TRANSCRIPT_PATH=$(jq -r '.transcript_path // empty' <<<"$PAYLOAD" 2>/dev/null) || TRANSCRIPT_PATH=""
if [ -z "$TRANSCRIPT_PATH" ] && [ -n "${CLAUDE_JOB_DIR:-}" ] && [ -f "$STATE_FILE" ]; then
  _sid=$(jq -r '.sessionId // empty' "$STATE_FILE" 2>/dev/null)
  _cwd=$(jq -r '.cwd // empty' "$STATE_FILE" 2>/dev/null)
  if [ -n "$_sid" ] && [ -n "$_cwd" ]; then
    _slug=$(printf '%s' "$_cwd" | tr '/.' '--')
    TRANSCRIPT_PATH="$HOME/.claude/projects/$_slug/$_sid.jsonl"
  fi
fi

# Resolve the current session ID for session_has_inflight_background_task's
# session-scoped scan (#2261). PAYLOAD is the PRIMARY source: it reflects the
# actually-running session, whereas state.json can be stale across a re-stamp.
# Here-string feeds jq (NOT `echo "$PAYLOAD" | jq` — zsh echo un-escapes \t/\n
# and corrupts the JSON; see .claude/rules/shell-json.md). Fallback when the
# payload yields nothing: reuse the `_sid` already parsed from $STATE_FILE in the
# block above (do not re-read). `${_sid:-}` is mandatory — `_sid` is only set
# inside that `if` block, and under `set -u` + the ERR trap a bare unset
# reference would abort the whole hook. When CURRENT_SESSION_ID stays empty the
# scan degrades to the whole file (today's behavior).
CURRENT_SESSION_ID=$(jq -r '.session_id // empty' <<<"$PAYLOAD" 2>/dev/null) || CURRENT_SESSION_ID=""
if [ -z "$CURRENT_SESSION_ID" ] && [ -n "${_sid:-}" ]; then
  CURRENT_SESSION_ID="$_sid"
fi

# Resolve issue number from the validated JOB_NAME (<N>-<slug>). Discriminator 2
# guarantees JOB_NAME matches ^[0-9]+-, so the numeric prefix is non-empty.
ISSUE_NUM="${JOB_NAME%%-*}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" || exit 0
SCRIPTS="$SCRIPT_DIR/../skills/dispatch-propagate/scripts"
source "$SCRIPTS/lib.sh"

# --- Decision-log instrumentation (write-only, non-fatal; #2038) -------------
# Append EXACTLY ONE structured per-tick decision record per WORKER invocation,
# via an EXIT trap. Unlike the select-tick / materialize-spawn sites (which arm
# at the top), this trap is armed LATE — only AFTER Discriminator 2 (line :98)
# has confirmed this is a worker session (JOB_NAME matches ^[0-9]+-). A
# router-named (non-worker) job that takes the early `exit 0` at :99 arms NO
# trap and so produces NO record, by design. The trap MUST NOT change the exit
# code, so the handler never calls `exit`. decision_log_append is write-only and
# ALWAYS returns 0 (see lib-decision-log.sh) — a failed source / missing tool
# degrades to a no-op rather than a hard error.
#
# Prior trap: the only existing trap is the ERR trap at the top of this file
# (`trap '...; exit 0' ERR`). EXIT and ERR are independent trap slots, so this
# `trap ... EXIT` does NOT clobber it; when the ERR trap fires it calls
# `exit 0`, which then runs this EXIT handler → still exactly one record. No
# chaining is needed.
#
# The `|| true` is load-bearing: this file runs a `trap '...; exit 0' ERR`
# (top of file), and a bare failing `source` at top level (unreadable/missing
# lib) would fire that ERR trap and `exit 0` the WHOLE hook BEFORE any branch —
# leaking the worker. `|| true` exempts the source from the ERR trap, so a
# missing lib degrades to a no-op: the trap still registers, but at exit
# `_dlog_stop_emit`'s call to the (now-undefined) decision_log_append fails
# inside a function, where the ERR trap is inactive, leaving $? untouched.
# shellcheck source=/dev/null
source "$SCRIPTS/lib-decision-log.sh" 2>/dev/null || true

# Accumulators, initialized to safe defaults before the trap is registered so an
# early exit never references an unset var. Each terminal site sets DLOG_BRANCH
# and DLOG_DISPOSITION just before its `exit`. The emitter reads the existing
# vars (JOB_NAME/ISSUE_NUM/PR_NUM/MARKER_PHASE/CURRENT_PHASE/MARKER_FILE)
# defensively as ${VAR:-} — Branches P and R exit before PR_NUM/MARKER_* are even
# defined, so the guards are load-bearing.
DLOG_BRANCH=""
DLOG_DISPOSITION=""

# _dlog_stop_emit — build the JSON record and hand it to decision_log_append.
# Stdout-silent: the Stop hook's stdout/stderr matters to the harness, so nothing
# here may leak to fd 1 (jq output is captured into a var; jq stderr is
# swallowed). Numeric fields (issue/pr) are passed as strings and coerced
# in-filter (tonumber? // null) so jq never fails on an empty value. Never calls
# `exit` (preserves $?). Uses an `if` block for the marker_present re-test — a
# bare `[[ -f x ]] && ...` would return non-zero when absent and could fire the
# ERR trap.
_dlog_stop_emit() {
  local marker_present=false
  if [[ -n "${MARKER_FILE:-}" && -f "${MARKER_FILE:-}" ]]; then
    marker_present=true
  fi
  local json
  json=$(jq -c -n \
    --arg ts            "$(date -u +%FT%TZ)" \
    --arg site          "stop" \
    --arg worker        "${JOB_NAME:-}" \
    --arg marker_phase  "${MARKER_PHASE:-}" \
    --arg current_phase "${CURRENT_PHASE:-}" \
    --arg branch        "$DLOG_BRANCH" \
    --arg disposition   "$DLOG_DISPOSITION" \
    --arg issue         "${ISSUE_NUM:-}" \
    --arg pr            "${PR_NUM:-}" \
    --argjson marker_present "$marker_present" \
    '
    def num: if . == "" then null else (tonumber? // null) end;
    {
      ts:             $ts,
      site:           $site,
      worker:         $worker,
      marker_present: $marker_present,
      marker_phase:   $marker_phase,
      current_phase:  $current_phase,
      branch:         $branch,
      disposition:    $disposition,
      issue:          ($issue | num),
      pr:             ($pr | num)
    }' 2>/dev/null) || return 0
  command -v decision_log_append >/dev/null 2>&1 && decision_log_append "$json" || true
}

# Arm the trap NOW — past Discriminator 2, so only worker sessions emit. (A
# router exited at :99 above, before this point.)
trap '_dlog_stop_emit' EXIT

# Release this worker's reservation marker (#1454). The marker is named by the
# worktree basename, which equals JOB_NAME (the session --name). Clearing it the
# instant the worker session ends means a normally-completed worker no longer
# leaves an orphan marker for the next tick's reservation_sweep to reclaim and
# MISLABEL `dead-session-stranded` — the dominant ~85% of those reclaims were
# exactly this: completed workers whose marker outlived them between 8-min ticks.
# The sweep stays a backstop for genuine strands (a worker that died before
# reaching this hook never gets here, so its marker is still reclaimed). Clear
# BEFORE spawn_tick so no tick this hook triggers re-finds the orphan.
#
# Race (narrow, degrades safely): if a concurrent tick already spawned the NEXT
# phase for this same worktree (same basename → same marker name) before this
# clear runs, this clear removes that fresh marker — degrading to the pre-#1454
# sweep-backstop behavior (the next phase's boot gap is briefly uncounted in the
# budget), never a lost worker. Best-effort: a clear failure must not abort Stop.
(
  . "$SCRIPTS/lib-reservation-ledger.sh" && reservation_clear "$JOB_NAME"
) >/dev/null 2>&1 \
  || echo "[dispatch-stop] WARNING: reservation_clear for '$JOB_NAME' failed (non-fatal)" >&2

# Resolve the why-comment reason. The #826 enrichment hook may write a
# context-specific reason to $CLAUDE_JOB_DIR/office-hours-reason; when present
# and non-empty it wins over the caller-supplied branch default.
resolve_office_hours_reason() {
  local default_reason="$1"
  local reason_file="$CLAUDE_JOB_DIR/office-hours-reason"
  local file_reason
  if [ -n "${CLAUDE_JOB_DIR:-}" ] && [ -s "$reason_file" ]; then
    # Command substitution strips trailing newlines; a file that contains only
    # whitespace/newlines produces an empty string — fall through to the default.
    file_reason="$(cat "$reason_file")"
    if [ -n "$file_reason" ]; then
      printf '%s' "$file_reason"
      return
    fi
  fi
  printf '%s' "$default_reason"
}

# Strip targets both the PR (if any) and the issue, since this runs from either
# an implement-phase or a post-implement worktree and the label could be on
# either side. (Apply is issue-only, via dispatch-apply-office-hours.)
strip_office_hours_label() {
  if [ -n "$PR_NUM" ]; then
    gh_issue_remove_label_rest "$PR_NUM" dispatch:office-hours >/dev/null 2>&1 \
      || echo "[dispatch-stop] WARNING: gh_issue_remove_label_rest (PR) failed" >&2
  fi
  gh_issue_remove_label_rest "$ISSUE_NUM" dispatch:office-hours >/dev/null 2>&1 \
    || echo "[dispatch-stop] WARNING: gh_issue_remove_label_rest (issue) failed" >&2
  # #2040: on the parked→unparked transition ONLY (office-hours was present at
  # session start, captured once in ISSUE_OFFICE_HOURS_PRESENT below), reset the
  # issue-anchored total-attempt counter so the resumed autonomous work gets a
  # fresh budget. Gated on the SAME single read the bump-skip guard uses so the
  # two cannot disagree. Deliberately NOT called from the unconditional
  # advance/self-close sites — resetting on every advance would defeat the
  # cross-phase accumulation that is the whole point of the ceiling.
  if [ "${ISSUE_OFFICE_HOURS_PRESENT:-no}" = yes ]; then
    clear_attempt_counter
  fi
}

# Best-effort: strip any dispatch:rate-limit-retry-<n> counter labels from the
# ISSUE on a clean marker-present advance ("reset on real progress"). Called by
# every advance/self-close site, so a session that recovered after one or more
# rate-limit resumes starts its next death from a clean counter rather than
# inheriting the prior backoff bucket. MUST return 0 even on a `gh` flake: the
# file runs `set -uo pipefail` with `trap ... exit 0 ERR`, so an unguarded
# non-zero return from this helper at its (pre-advance) call sites would fire the
# ERR trap and exit 0 BEFORE the advance/self-close runs — skipping the very work
# this hook owns. The trailing `return 0` makes the function total.
clear_rate_limit_retry_labels() {
  local lbl
  gh issue view "$ISSUE_NUM" --json labels --jq \
    '.labels[].name | select(test("^dispatch:rate-limit-retry-[0-9]+$"))' 2>/dev/null \
    | while IFS= read -r lbl; do
        [ -n "$lbl" ] && gh_issue_remove_label_rest "$ISSUE_NUM" "$lbl" >/dev/null 2>&1 \
          || echo "[dispatch-stop] WARNING: could not clear $lbl (non-fatal)" >&2
      done || true
  return 0
}

# Best-effort: clear the issue-anchored dispatch:attempts-<n> total-attempt
# counter (#2040). Called ONLY on the parked→unparked transition from inside
# strip_office_hours_label: when an office-hours-assisted session advances a
# previously-parked issue, the resumed autonomous work gets a fresh budget so it
# does not instantly re-hit the ceiling and re-park. Mirrors
# clear_rate_limit_retry_labels' totality: MUST return 0 even on a `gh` flake —
# under `set -uo pipefail` + `trap ... exit 0 ERR`, an unguarded non-zero return
# at a pre-advance call site would fire the ERR trap and skip the advance work
# this hook owns. The trailing `return 0` makes the function total.
clear_attempt_counter() {
  local lbl
  gh issue view "$ISSUE_NUM" --json labels --jq \
    '.labels[].name | select(test("^dispatch:attempts-[0-9]+$"))' 2>/dev/null \
    | while IFS= read -r lbl; do
        [ -n "$lbl" ] && gh_issue_remove_label_rest "$ISSUE_NUM" "$lbl" >/dev/null 2>&1 \
          || echo "[dispatch-stop] WARNING: could not clear $lbl (non-fatal)" >&2
      done || true
  return 0
}

spawn_tick() {
  local out
  if out=$("$SCRIPTS/dispatch-spawn-tick" 2>&1); then
    echo "[dispatch-stop] dispatch-spawn-tick: ${out:-<no output>}" >&2
  else
    echo "[dispatch-stop] WARNING: dispatch-spawn-tick failed: ${out:-<no output>}" >&2
  fi
  return 0
}

spawn_sweep() {
  "$SCRIPTS/dispatch-spawn-sweep" >/dev/null 2>&1 \
    || echo "[dispatch-stop] WARNING: dispatch-spawn-sweep failed" >&2
}

self_close() {
  "$SCRIPTS/dispatch-self-close" >/dev/null 2>&1 \
    || echo "[dispatch-stop] WARNING: dispatch-self-close failed" >&2
}

# Side-effect recovery comparison (#2025). Returns 0 ("advance") when CURRENT is
# genuinely downstream of the DISPATCHED phase, else non-zero ("park"). The two
# fix-* phases (fix-conflicts, fix-checks) are off-chain remediation, not linear
# stages of the canonical plan→implement→qa→review→done chain (the main chain is
# that canonical order with the two fix-* phases removed). Entering a fix-* phase
# (a conflict / CI failure was injected mid-phase) OR leaving one (the fix landed
# and the chain re-derived downstream) is genuine forward motion, so any CHANGE
# touching a fix-* phase advances — this preserves the #2025 "CI broke mid-qa →
# route to fix-checks, don't park a human" behavior. Two equal phases are no
# progress → park. A move BETWEEN main-chain phases must be strictly forward; a
# backwards main-chain move (e.g. qa→implement, a regressed PR whose qa-done
# never landed) is not a completion → park. A bare `!=` would wrongly treat that
# regression as an advance.
phase_advanced_past() {
  local from="$1" to="$2"
  [ "$from" = "$to" ] && return 1
  case "$from" in fix-conflicts|fix-checks) return 0 ;; esac
  case "$to"   in fix-conflicts|fix-checks) return 0 ;; esac
  # Both main-chain: rank within plan<implement<qa<review<done; advance iff to>from.
  local p rank=0 rfrom="" rto=""
  for p in plan implement qa review done; do
    [ "$p" = "$from" ] && rfrom=$rank
    [ "$p" = "$to" ]   && rto=$rank
    rank=$((rank + 1))
  done
  [ -n "$rfrom" ] && [ -n "$rto" ] && [ "$rto" -gt "$rfrom" ]
}

# Branch A idle-poll discriminator (#1590). Returns 0 ("will resume on its own")
# ONLY when the stopping session's transcript shows its FINAL assistant turn
# contained a `ScheduleWakeup` tool_use; returns 1 in EVERY other case —
# including all uncertainty: empty TRANSCRIPT_PATH, missing/unreadable file,
# malformed JSONL, or no trailing wakeup. The fail-safe direction (positive
# evidence only) is load-bearing: any doubt falls through to today's
# office-hours park, so a genuine death still parks byte-identically.
#
# jq emits one array-of-tool-use-names per assistant turn; a polling worker
# schedules one ScheduleWakeup PER poll cycle, so only the LAST assistant turn
# matters — hence `tail -1`. Non-assistant trailing lines (tool_result / user
# events) are correctly ignored because the jq `select` keeps only assistant
# turns. Reading the file directly with jq (not via echo) avoids the
# control-char trap (.claude/rules/shell-json.md).
session_scheduled_wakeup() {
  [ -n "$TRANSCRIPT_PATH" ] && [ -r "$TRANSCRIPT_PATH" ] || return 1
  jq -rc 'select(.type=="assistant") | [.message.content[]? | select(.type=="tool_use") | .name]' "$TRANSCRIPT_PATH" 2>/dev/null \
    | tail -1 | grep -q '"ScheduleWakeup"'
}

# Branch A background-task discriminator (#2243). Returns 0 ("still running in
# the background, will resume on its own") ONLY when the transcript shows at
# least one background task that was LAUNCHED but has not yet been NOTIFIED back
# — i.e. an in-flight launched∖notified set difference is non-empty; returns 1
# in EVERY other case — including all uncertainty: empty TRANSCRIPT_PATH,
# missing/unreadable file, malformed transcript, or no launches at all. The
# fail-safe direction (positive evidence only) is load-bearing: any doubt falls
# through to today's office-hours park, so a genuine death still parks.
#
# A Workflow-based phase skill (/review-fix, /qa-fix) launches its review/QA
# fan-out as a BACKGROUND Workflow and yields its turn to await a
# <task-notification>. That mid-phase turn-end fires this Stop hook while the
# phase is still running and has not yet written its phase-completed marker.
# Without this gate Branch A sees marker-absence and prematurely parks the
# issue on office-hours (#2243) — symmetric to session_scheduled_wakeup (#1590).
#
# Transcript shapes (whole-transcript grain, NOT last-turn-only — a background
# launch is not a per-poll-cycle event):
#   Launch — a tool_result text `... launched in background. Task ID: <ID>`
#            (Workflow: `Workflow launched in background. Task ID: <ID>`; the
#            Task tool uses analogous `... launched in background. Task ID: <ID>`).
#   Notify — a <task-notification> payload carrying `"taskId":"<ID>"` for ANY
#            status; any notification means the task resumed the session and is
#            no longer in-flight.
#
# Grep for literal substrings (not echo-into-jq): the IDs are plain substrings,
# so grep is robust and sidesteps the control-char trap
# (.claude/rules/shell-json.md), mirroring dispatch-recover-dispatched-phase /
# dispatch-detect-transient-death.
#
# Session-scoped scan (#2261): the extractions run against the CURRENT session's
# records only, not the whole file. A RESUMED session carries the prior run's
# transcript records forward into its own <sessionId>.jsonl, and each carried
# record retains its ORIGINAL `sessionId`. A whole-file scan therefore re-detects
# a background task launched-but-never-notified by a now-dead prior run as a
# false in-flight positive — yielding hand-back and silently stalling the chain.
# Filtering to CURRENT_SESSION_ID drops those carried records. This stays safe
# for the live #2243 case: a still-running session's OWN launch record carries
# that same session's sessionId (verified), so it survives the filter and still
# hands back correctly.
#
# The whole-file fallback (CURRENT_SESSION_ID empty) is DELIBERATE and
# LOAD-BEARING, and the asymmetry is exact — do NOT "simplify" it away per
# code-style.md:
#   - It fires ONLY when CURRENT_SESSION_ID is unresolvable (empty payload AND no
#     state.json sessionId). That preserves today's exact behavior in that case.
#   - It MUST NOT fire on "the scoped scan found no launch." When
#     CURRENT_SESSION_ID IS resolved but the scoped scan finds no current-session
#     launch, the correct result is a normal `return 1` (not in-flight). Softening
#     that into a whole-file retry would re-detect the stale prior-session launch
#     and reintroduce #2261.
session_has_inflight_background_task() {
  [ -n "$TRANSCRIPT_PATH" ] && [ -r "$TRANSCRIPT_PATH" ] || return 1
  local launched notified scan_src
  # Scope the scan to the CURRENT session's raw records when CURRENT_SESSION_ID
  # is resolved; otherwise fall back to the whole file (today's behavior). The
  # gate is computed ONCE on CURRENT_SESSION_ID being empty. The whole-file leg
  # is DELIBERATE and LOAD-BEARING — see the docblock above for why it must never
  # become a `return 1` (#2261 vs #2243 asymmetry).
  if [ -z "$CURRENT_SESSION_ID" ]; then
    scan_src=$(cat "$TRANSCRIPT_PATH")
  else
    # Real transcripts carry the top-level un-escaped `"sessionId":"<id>"` form
    # (no space after colon, raw quotes), so grep -F matches — keeping this
    # function's literal-substring / control-char-trap-avoiding philosophy.
    scan_src=$(grep -F "\"sessionId\":\"$CURRENT_SESSION_ID\"" "$TRANSCRIPT_PATH" 2>/dev/null)
  fi
  # Launches are identified by STRUCTURALLY parsing each JSONL record and keying
  # on the harness-emitted `toolUseResult.status == "async_launched"` field — NOT
  # by substring-matching the human-readable `launched in background. Task ID:
  # <ID>` text, and NOT by substring-matching the `async_launched`/`taskId`
  # tokens. The prose AND those tokens are also content the dispatch worker's
  # Bash tool reads (a reviewed PR's code, a `gh issue view` body, a PR comment),
  # and any such content lands verbatim — JSON-escaped — inside a tool_result
  # `content` string on a record bearing the current sessionId. A substring match
  # (of the prose or of any field-name token) would let an attacker who places
  # `async_launched "taskId":"X"` in any read content forge a phantom in-flight
  # task, silently suppressing the issue-anchored attempt-counter bump and
  # disabling the autonomous ceiling (#2541). Injected text always lands inside a
  # JSON string *value*, so it can never manifest as a real sibling `.status`
  # field — only a structural parse is immune. `jq -R … fromjson?` tolerates any
  # non-JSON line (empty output); `objects` drops non-object records; `select`
  # keys on the real `.toolUseResult.status` field; the ID is the real
  # `.toolUseResult.taskId`. `printf '%s'`-into-pipe is jq-safe (the shell-json
  # control-char trap is `echo "$VAR" | jq`, not this).
  #
  # UPDATE TRIGGER: `async_launched` is the Workflow/Task tool's `toolUseResult`
  # status and `taskId` its sibling field — both emitted by the Claude Code
  # harness, with no in-repo definition to track. The notification pattern below
  # is anchored on the `<task-notification>` envelope; if the harness renames any
  # of these (the `async_launched` status, the `toolUseResult.taskId` field, or
  # the `task-notification` wrapper), the matching anchor here must be updated.
  launched=$(printf '%s\n' "$scan_src" \
    | jq -Rr 'fromjson? | objects | select(.toolUseResult.status=="async_launched") | .toolUseResult.taskId' 2>/dev/null \
    | sort -u)
  [ -n "$launched" ] || return 1
  # Notifications are identified by the `<task-notification>` envelope, NOT a bare
  # `taskId` substring: the launch record's own sibling `toolUseResult.taskId` also
  # carries the bare "taskId":"<ID>" form, so a substring-only match would
  # self-match the launch into `notified`, empty the set difference, and wrongly
  # report not-in-flight (#2365). The grep -F 'task-notification' stage scopes the
  # taskId extraction to envelope records only. Within those, tolerate the JSONL
  # backslash-escaped quote form (\"taskId\":\"<ID>\") as well as the bare form —
  # the envelope payload is a string value, so its inner quotes are escaped.
  notified=$(printf '%s\n' "$scan_src" | grep -F 'task-notification' \
    | grep -oE 'taskId\\?":\\?"[A-Za-z0-9_-]+' \
    | grep -oE '[A-Za-z0-9_-]+$' | sort -u)
  # In-flight iff at least one launched ID has no matching notification, i.e.
  # the set difference (launched ∖ notified) is non-empty. comm -23 lists lines
  # unique to the first (sorted) input.
  [ -n "$(comm -23 <(printf '%s\n' "$launched") <(printf '%s\n' "$notified"))" ]
}

# Branch P — parse-job clean completion (#1024): a /budget-parse-job session is
# named <N>-slug like a worker but, on a successful idempotent statement merge,
# writes a `parse-job-done` sentinel instead of a phase-completed marker. A clean
# parse-job produces NO PR: the handler already closed the parse-job issue, so
# there is no label work and no PR-centric disposition — spawn the next tick and
# self-close. (Escalation writes no sentinel; the issue stays open and PR-less and
# falls through to Branch A, which parks it on office-hours — no branch needed
# here.) Checked BEFORE the PR-centric branches.
if [ -f "$CLAUDE_JOB_DIR/parse-job-done" ]; then
  DLOG_BRANCH="P"; DLOG_DISPOSITION="self-close"
  spawn_tick
  spawn_sweep
  self_close
  exit 0
fi

# Branch R — resolved-epic clean completion (#1456): /resolve-epic closes a
# spent parent epic (every sub-issue closed as completed, the epic's own ACs met
# by the merged work) and writes a `resolved-closed` sentinel instead of a
# phase-completed marker. Like a clean parse-job, a resolved epic produces NO PR
# and needs NO phase advance: the skill already closed the issue. A normal
# completion marker would not work here — the epic's derived phase is still
# `plan` (no PR, and /resolve-epic does not apply dispatch:planned), so
# MARKER_PHASE == CURRENT_PHASE == plan would hit Branch D and park on
# office-hours. The sentinel path sidesteps phase comparison entirely: spawn the
# next tick and self-close, exactly as Branch P does. (An escalation writes no
# sentinel; the epic stays open and falls through to Branch A, which parks it on
# office-hours — today's behavior, no branch needed here.) Checked BEFORE the
# PR-centric branches, beside Branch P.
if [ -f "$CLAUDE_JOB_DIR/resolved-closed" ]; then
  DLOG_BRANCH="R"; DLOG_DISPOSITION="self-close"
  spawn_tick
  spawn_sweep
  self_close
  exit 0
fi

# Branch DEF — deferred/blocked disposition (#2616): a phase worker that could
# not complete its phase but RESOLVED the deviation in-session — typically by
# linking the missing blocked_by dependency — writes a `deferred` sentinel via
# dispatch-mark-deferred instead of a phase-completed marker (advance) or relying
# on an office-hours park (dispatch-mark-deviation). The deferred disposition is
# gated on a hook-verifiable resolving condition: the issue must NOW be
# blocked_by an OPEN issue. When that holds, do NOT apply dispatch:office-hours —
# spawn the router and self-close. The router re-gates the issue on its blocked_by
# links: it skips it while the blocker is open and selects it, routing to the
# correct phase, once the blocker closes — with no office-hours label to manually
# strip. When the condition does NOT hold (no open blocker, or the check cannot be
# performed), fall back to the office-hours park — fail-safe toward human review,
# matching Branch A's discriminator direction. Checked BEFORE the PR-centric
# branches, beside Branches P and R: like them, a deferred disposition is a clean
# terminal outcome with no PR and no phase advance, so it must not bump the
# issue-anchored attempt counter below. The blocked_by gate routes through the
# SAME dispatch-check-blockers / count_open_blockers helper the queue path uses,
# so the hook and the router can never disagree on what counts as "blocked".
if [ -f "$CLAUDE_JOB_DIR/deferred" ]; then
  DLOG_BRANCH="deferred"
  # cat under `|| true`: a command-substitution whose inner command fails would
  # trip this file's `trap '...; exit 0' ERR` (independent of `set -e`). The
  # [ -f ] guard above means it won't fail in practice; the guard matches the
  # file's paranoia.
  _defer_reason="$(cat "$CLAUDE_JOB_DIR/deferred" 2>/dev/null || true)"
  # Guarded capture: dispatch-check-blockers exits NON-ZERO on the success path
  # we care about (rc=2 = open blocker found), so a bare `cmd; rc=$?` would fire
  # the ERR trap and exit 0 before this branch acts. The if/else form exempts it.
  if "$SCRIPTS/dispatch-check-blockers" "$ISSUE_NUM" >/dev/null 2>&1; then
    _blocker_rc=0
  else
    _blocker_rc=$?
  fi
  if [ "$_blocker_rc" -eq 2 ]; then
    # Open blocker present — defer cleanly. No office-hours label; the router
    # re-gates on blocked_by. Mirror Branches P/R: spawn + sweep + self-close.
    DLOG_DISPOSITION="self-close"
    spawn_tick
    spawn_sweep
    self_close
    exit 0
  fi
  # No open blocker (rc=0) or the check could not be performed (rc=1/other) —
  # fail-safe office-hours park. Mirror Branch A's park: apply + spawn only, no
  # sweep and no self-close. The deferral reason is surfaced for the human.
  DLOG_DISPOSITION="park"
  if [ "$_blocker_rc" -eq 0 ]; then
    _park_reason="deferred as blocked, but the issue has no open blocker — parking for human review (deferral reason: ${_defer_reason:-<none>})"
  else
    _park_reason="deferred as blocked, but the open-blocker check could not be performed (dispatch-check-blockers exit $_blocker_rc) — parking for human review (deferral reason: ${_defer_reason:-<none>})"
  fi
  "$SCRIPTS/dispatch-apply-office-hours" "$ISSUE_NUM" "$_park_reason" \
    || echo "[dispatch-stop] WARNING: dispatch-apply-office-hours failed" >&2
  spawn_tick
  exit 0
fi

# Resolve PR (may be empty for implement-phase before the draft PR opens).
PR_NUM=$("$SCRIPTS/dispatch-find-pr" "$ISSUE_NUM" 2>/dev/null) || PR_NUM=""

# Read marker (presence drives branch selection; content is for diagnostics).
# Validate against the known phase set — a corrupt or unknown value falls
# through to Branch A (treat as absent) rather than driving Branch B's
# self-close on an unrecognized string.
MARKER_FILE="$CLAUDE_JOB_DIR/phase-completed"
MARKER_PHASE=""
if [ -f "$MARKER_FILE" ]; then
  MARKER_PHASE=$(grep -E '^phase=' "$MARKER_FILE" | head -n1 | cut -d= -f2) || MARKER_PHASE=""
  case "$MARKER_PHASE" in
    plan|implement|fix-checks|fix-conflicts|qa|review|done) ;;
    *) MARKER_PHASE="" ;;
  esac
fi

# Early not-ready gate. If the target's PR CI is back in progress (no verdict
# available), spawn the next tick and decide disposition by marker:
#   - Marker present: the phase already did its job (marker written, label
#     applied, fix pushed) — only CI is still running. Self-close the session;
#     the spawned tick re-gates the issue once CI concludes and continues the
#     chain in a fresh session. (Without this, the session leaks: idle, holding
#     a daemon slot, even though its phase completed.)
#   - Marker absent: a genuine mid-phase exit during a CI restart (the TOCTOU
#     case where a push restarted CI between selection and session end). Hand the
#     issue back to the tick without parking or self-closing — the next tick
#     re-gates it once CI concludes. Parking is avoided because the gate runs
#     BEFORE dispatch-phase: a pending dispatch-phase would exit 3, leave
#     CURRENT_PHASE="" via the `|| CURRENT_PHASE=""` fallback below, and drive a
#     spurious Branch D office-hours park.
#
# Rate-limit self-heal degradation: a rate-limit death while the PR's CI is
# back IN PROGRESS hits THIS early not-ready gate before Branch A, so it gets
# the from-scratch re-tick rather than the context-preserving resume that
# Branch A's rate-limit self-heal arms. Acceptable, intentional degradation:
# the work still continues (the next tick re-gates once CI concludes); only the
# session-context preservation is lost in this narrow window.
if ! "$SCRIPTS/dispatch-ci-ready" "$ISSUE_NUM" >/dev/null 2>&1; then
  DLOG_BRANCH="early-gate"
  spawn_tick
  if [ -n "$MARKER_PHASE" ]; then
    # Marker present (see the block above): the phase completed and only CI
    # is still running — self-close so the session does not leak idle.
    DLOG_DISPOSITION="self-close"
    clear_rate_limit_retry_labels
    spawn_sweep
    self_close
  else
    # No marker: a genuine mid-phase exit during a CI restart — hand back to
    # the router without parking or self-closing (TOCTOU protection).
    DLOG_DISPOSITION="hand-back"
  fi
  exit 0
fi

# Resolve current phase (used to compare against MARKER_PHASE). Called after the
# readiness gate so CI is confirmed ready and dispatch-phase will not exit 3.
CURRENT_PHASE=$("$SCRIPTS/dispatch-phase" "$ISSUE_NUM" 2>/dev/null) || CURRENT_PHASE=""

# Issue-anchored total-attempt ceiling (#2040). Read the issue's office-hours
# state ONCE here and share it with both the bump-skip guard below and the
# un-park reset in strip_office_hours_label, so the two cannot disagree (a
# reset-too-eager bug would silently neuter the ceiling). This read reflects the
# session-start state: the only sites that strip office-hours (Branch A
# recovery-advance, Branch B) run AFTER this point.
ISSUE_OFFICE_HOURS_PRESENT=no
if gh issue view "$ISSUE_NUM" --json labels --jq '.labels[].name' 2>/dev/null \
     | grep -qx 'dispatch:office-hours'; then
  ISSUE_OFFICE_HOURS_PRESENT=yes
fi

# Bump the issue-anchored total-attempt counter and park on the ceiling, UNLESS
# this session is a non-concluding continuation that must not count:
#   - the issue is already parked on office-hours (an office-hours-assisted run,
#     or an already-parked issue): nothing to count, nothing to escalate; and an
#     office-hours session must not inflate the autonomous counter.
#   - marker absent AND this is one of Branch A's three continuation gates that
#     RESUME the same session rather than concluding an attempt: a live
#     idle-poller (session_scheduled_wakeup), a live phase running in the
#     background (session_has_inflight_background_task, #2243), or a transient
#     rate-limit death (dispatch-detect-transient-death). Counting an idle-poller
#     or a background-phase hand-back would bump once per poll/turn cycle and blow
#     the ceiling on a single healthy review/qa phase (#1590, #2243). These mirror
#     the gates at ~lines 665, 674, and 691 below — keep the two in sync. (The
#     rate-limit gate can fall through to an office-hours park when
#     rescheduling fails; that park is then uncounted, which is harmless — it
#     parks office-hours so the ceiling is moot and the counter resets on un-park.)
# Everything else — Branch A genuine park, the #2025 recovery-advance, Branch
# B/C/D — is a concluded autonomous attempt and counts exactly once.
#
# Fail-open: a `gh` flake in dispatch-attempt-count defaults to `proceed`, never
# parks and never fires the ERR trap — the chain-advancing Branch A–D work below
# must run even if the bookkeeping bump flaked.
if [ "$ISSUE_OFFICE_HOURS_PRESENT" = no ] \
   && { [ -n "$MARKER_PHASE" ] \
        || { ! session_scheduled_wakeup \
             && ! session_has_inflight_background_task \
             && ! "$SCRIPTS/dispatch-detect-transient-death" "$TRANSCRIPT_PATH" 2>/dev/null; }; }; then
  attempt_verdict=$("$SCRIPTS/dispatch-attempt-count" "$ISSUE_NUM" 2>/dev/null) || attempt_verdict=proceed
  if [ "$attempt_verdict" = escalate ]; then
    # Re-read the just-bumped total to name it in the office-hours reason (AC4).
    attempt_total=$(gh issue view "$ISSUE_NUM" --json labels \
      --jq '[.labels[].name | capture("^dispatch:attempts-(?<n>[0-9]+)$").n | tonumber] | max // 0' \
      2>/dev/null) || attempt_total=""
    "$SCRIPTS/dispatch-apply-office-hours" "$ISSUE_NUM" \
      "total attempts across all phases reached the ceiling (N=${attempt_total:-unknown})" \
      || echo "[dispatch-stop] WARNING: dispatch-apply-office-hours failed" >&2
    spawn_tick
    exit 0
  fi
fi

if [ -z "$MARKER_PHASE" ]; then
  # Branch A — marker absent.
  DLOG_BRANCH="A"
  if session_scheduled_wakeup; then
    # Live idle-polling worker — its final turn scheduled a ScheduleWakeup,
    # so it will resume on its own poll cadence. Do NOT park on office-hours
    # and do NOT spawn a redundant tick (the live worker drives the chain
    # itself). Without this gate Branch A re-parks the issue once per poll
    # cycle, oscillating dispatch:office-hours (#1590).
    DLOG_DISPOSITION="hand-back"
    exit 0
  fi
  if session_has_inflight_background_task; then
    # Live phase running in the background — a Workflow/Task phase skill
    # (/review-fix, /qa-fix) launched its fan-out as a background task and
    # yielded its turn to await a <task-notification>. This mid-phase turn-end
    # fired the Stop hook before the phase-completed marker was written. Hand
    # back (the running task will resume the session and finish the phase); do
    # NOT park on office-hours and do NOT spawn a redundant tick. Symmetric to
    # the scheduled-wakeup gate above (#2243).
    DLOG_DISPOSITION="hand-back-inflight-task"
    exit 0
  fi
  # Rate-limit self-heal (#1733). A worker that died on a TRANSIENT Anthropic
  # server-overload rate-limit (not the user's own usage limit) must NOT park on
  # office-hours as if it hit a human-input wall — that condition self-heals on
  # retry. Checked AFTER the scheduled-wakeup gate (a live poller still takes
  # precedence) and BEFORE the office-hours park below. On a positive detection
  # arm a backed-off resume of the dead session in place.
  if "$SCRIPTS/dispatch-detect-transient-death" "$TRANSCRIPT_PATH"; then
    _sid=$(jq -r '.sessionId // empty' "$STATE_FILE" 2>/dev/null)
    _cwd=$(jq -r '.cwd // empty' "$STATE_FILE" 2>/dev/null)
    _model=$("$SCRIPTS/dispatch-phase-model" "$CURRENT_PHASE" 2>/dev/null || true)
    _effort=$("$SCRIPTS/dispatch-phase-effort" "$CURRENT_PHASE" 2>/dev/null || true)
    if [ -n "$_sid" ] && [ -n "$_cwd" ]; then
      sched_out=$("$SCRIPTS/dispatch-schedule-rate-limit-resume" \
        "$ISSUE_NUM" "$_sid" "$_cwd" "$JOB_NAME" "$_model" "$_effort" 2>&1) && sched_rc=0 || sched_rc=$?
      if [ "$sched_rc" -eq 0 ]; then
        case "$sched_out" in
          *escalated*)
            # cap hit — the schedule script already parked office-hours.
            # Spawn a tick like the normal park (safe: the issue now carries
            # dispatch:office-hours, so the tick skips it — no race).
            DLOG_DISPOSITION="park"
            spawn_tick ;;
          *)
            # reseeded — timer armed. Do NOT spawn a tick: the resume timer
            # owns this issue's continuation; a competing tick could launch a
            # fresh from-scratch worker and race the resume.
            DLOG_DISPOSITION="hand-back"
            : ;;
        esac
        exit 0
      fi
      # schedule failed → fall through to the normal office-hours park below.
    fi
  fi
  # Side-effect recovery (#2025). The marker is absent, but the dispatched phase
  # may have completed its real work (PR opened / label applied / commits pushed)
  # and only leaked the terminal dispatch-mark-complete call (#824 trailing-step
  # leak). Recover the phase the session was dispatched to run from its transcript
  # and compare against the phase derived from durable state: if dispatch-phase has
  # advanced PAST the dispatched phase, the structural side-effects landed —
  # advance the chain instead of parking a human. (Advancing only spawns a tick,
  # which re-derives the phase, so the completion labels still gate forward
  # progress — this can never skip qa/review. Note: a dispatched=qa whose CI broke
  # mid-phase advances to fix-checks here rather than parking; that routes to the
  # autonomous handler and qa re-runs once CI is green — intentional, see #2025.)
  DISPATCHED_PHASE=$("$SCRIPTS/dispatch-recover-dispatched-phase" "$TRANSCRIPT_PATH" 2>/dev/null) || DISPATCHED_PHASE=""
  if [ -n "$DISPATCHED_PHASE" ] && [ -n "$CURRENT_PHASE" ] && phase_advanced_past "$DISPATCHED_PHASE" "$CURRENT_PHASE"; then
    DLOG_DISPOSITION="self-close"
    clear_rate_limit_retry_labels
    strip_office_hours_label
    spawn_tick
    spawn_sweep
    self_close
    exit 0
  fi
  # Recovery failed, or the chain has not advanced past the dispatched phase →
  # genuine mid-phase exit → fall through to the office-hours park below.
  DLOG_DISPOSITION="park"
  "$SCRIPTS/dispatch-apply-office-hours" "$ISSUE_NUM" \
    "$(resolve_office_hours_reason "phase exited before completion (mid-phase exit or context compaction)")" \
    || echo "[dispatch-stop] WARNING: dispatch-apply-office-hours failed" >&2
  spawn_tick
  exit 0
fi

if [ -n "$CURRENT_PHASE" ] && [ "$MARKER_PHASE" != "$CURRENT_PHASE" ]; then
  # Branch B — phase advanced.
  DLOG_BRANCH="B"; DLOG_DISPOSITION="self-close"
  clear_rate_limit_retry_labels
  strip_office_hours_label
  spawn_tick
  spawn_sweep
  self_close
  exit 0
fi

# Same phase. Check fix-* exemption (the #831 non-advancement invariant,
# generalized from fix-checks to any fix-* phase: fix-checks, fix-conflicts, …).
# The attempt counter label is phase-derived: dispatch:<fix-phase>-attempt-<n>.
case "$CURRENT_PHASE" in
  fix-*)
    if [ -n "$PR_NUM" ]; then
      N=$(gh pr view "$PR_NUM" --json labels 2>/dev/null | jq --arg phase "$CURRENT_PHASE" '[.labels[].name | capture("^dispatch:" + $phase + "-attempt-(?<n>[0-9]+)$").n | tonumber] | max // 0') || N=0
      [ -z "$N" ] && N=0
      if [ "$N" -lt 3 ]; then
        # Branch C — transient no-push fix-* outcome; CI concluded, nothing
        # pending. Self-close so the session does not leak idle holding its
        # worktree; the next tick re-runs the fix-* phase or escalates at the cap.
        DLOG_BRANCH="C"; DLOG_DISPOSITION="self-close"
        clear_rate_limit_retry_labels
        spawn_tick
        spawn_sweep
        self_close
        exit 0
      fi
      # counter at cap: fall through to Branch D (office-hours park)
    elif [ "$CURRENT_PHASE" = 'fix-conflicts' ]; then
      # Branch C — no-PR provisioning backstop, specific to fix-conflicts: a
      # fix-conflicts pass that ran during the implement phase, before any PR
      # existed. No attempt counter exists (it lives on a PR label), so always
      # self-close and re-seed the chain rather than parking — the marker being
      # present means fix-conflicts completed successfully. Any OTHER fix-* phase
      # with an empty PR_NUM matches neither branch and deliberately falls
      # through to Branch D (office-hours park).
      DLOG_BRANCH="C"; DLOG_DISPOSITION="self-close"
      clear_rate_limit_retry_labels
      spawn_tick
      spawn_sweep
      self_close
      exit 0
    fi
    ;;
esac

# Branch D — true non-advancement.
DLOG_BRANCH="D"; DLOG_DISPOSITION="park"
"$SCRIPTS/dispatch-apply-office-hours" "$ISSUE_NUM" \
  "$(resolve_office_hours_reason "phase ran but did not advance")" \
  || echo "[dispatch-stop] WARNING: dispatch-apply-office-hours failed" >&2
spawn_tick
exit 0
