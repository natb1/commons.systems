#!/usr/bin/env bash
# dispatch-stop: dispatch-worker phase-completion + propagation handler.
#
# Wired to the Stop event. Owns the post-phase disposition that used to live
# in /dispatch-worker Step 4: read the phase-completed marker, decide whether
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
#   R. conflict-resolver job (#982) — a /dispatch-resolve-conflict session is
#      named <N>-slug like a worker but writes a `conflict-resolver` sentinel
#      instead of a phase-completed marker. Checked BEFORE Branches A-D.
#      `conflict-resolved` present → target-keyed re-seed + self-close (the chain
#      returns to <N>, where materialize-spawn now sails through the resolved
#      merge); sentinel present without `conflict-resolved` (ambiguous/crash) →
#      park the issue (its office-hours-reason) + re-seed, no self-close.
#   P. parse-job clean completion (#1024) — a /budget-parse-job session is named
#      <N>-slug like a worker but writes a `parse-job-done` sentinel instead of a
#      phase-completed marker when its idempotent statement merge succeeds.
#      Checked AFTER Branch R and BEFORE Branches A-D. A clean parse-job produces
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
#   C. marker present + same phase + CURRENT_PHASE == verify + verify-attempt
#      counter < 3 — transient no-push verify outcome. CI has already concluded
#      and nothing is pending: a verify pass that pushes a fix restarts CI, and
#      the early not-ready gate above already intercepts and self-closes that
#      in-progress case when the marker is present, so by the time control
#      reaches Branch C, CI is concluded and not re-running. Spawn router,
#      self-close (so the session does not leak idle holding its worktree); the
#      next tick re-runs verify or escalates at the cap. The needs-human verify
#      failure never reaches Branch C — /verify-pr skips the marker for it, so it
#      lands in Branch A (marker absent → park the issue on office-hours on the
#      first run).
#   D. marker present + same phase + NOT (verify AND counter < 3) — true
#      non-advancement (or a hypothetical same-phase non-verify case). Park the
#      ISSUE on a human via dispatch-apply-office-hours (label + why-comment),
#      spawn router, exit 0.
#
# CLOSING NOTE (post-#1108): NO worker branch self-parks idle waiting on pending
# work. The early not-ready gate self-closes its concluded-CI marker-present case
# and hands back its in-progress marker-absent case; Branch C self-closes its
# concluded no-push case. The remaining exit-0-without-self-close branches —
# Branch A and Branch D office-hours parks, and the early-gate marker-absent
# TOCTOU hand-back — are deliberate human-review parks or router hand-backs, not
# idle waiters.
#
# Discriminator: only acts for a /dispatch-worker job. Skipped when
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

# Discriminator 2: this job is a worker (name starts with <N>-). Routers named
# `dispatch-<short-id>` MUST be skipped — they don't run phase skills.
JOB_NAME=$(jq -r '.name // empty' "$STATE_FILE" 2>/dev/null) || JOB_NAME=""
if ! [[ "$JOB_NAME" =~ ^[0-9]+- ]]; then
  exit 0
fi

# Consume the payload (defensive — Stop may pass JSON on stdin). Unused.
PAYLOAD=""
if read -t 1 -d '' PAYLOAD; then :; fi

# Resolve issue number from the validated JOB_NAME (<N>-<slug>). Discriminator 2
# guarantees JOB_NAME matches ^[0-9]+-, so the numeric prefix is non-empty.
ISSUE_NUM="${JOB_NAME%%-*}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" || exit 0
SCRIPTS="$SCRIPT_DIR/../skills/dispatch-propagate/scripts"

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
    gh pr edit "$PR_NUM" --remove-label dispatch:office-hours >/dev/null 2>&1 \
      || echo "[dispatch-stop] WARNING: gh pr edit --remove-label failed" >&2
  fi
  gh issue edit "$ISSUE_NUM" --remove-label dispatch:office-hours >/dev/null 2>&1 \
    || echo "[dispatch-stop] WARNING: gh issue edit --remove-label failed" >&2
}

spawn_tick() {
  "$SCRIPTS/dispatch-spawn-tick" >/dev/null 2>&1 \
    || echo "[dispatch-stop] WARNING: dispatch-spawn-tick failed" >&2
}

self_close() {
  "$SCRIPTS/dispatch-self-close" >/dev/null 2>&1 \
    || echo "[dispatch-stop] WARNING: dispatch-self-close failed" >&2
}

# Branch R — conflict-resolver job (#982): a /dispatch-resolve-conflict session is
# named <N>-slug like a worker but writes a `conflict-resolver` sentinel instead of
# a phase-completed marker. resolved → target-keyed re-seed (so the chain returns to
# <N>, where materialize-spawn now sails through the already-resolved merge) +
# self-close. ambiguous/crash (sentinel present, no conflict-resolved marker) →
# park the issue (its office-hours-reason) + re-seed, no self-close.
if [ -f "$CLAUDE_JOB_DIR/conflict-resolver" ]; then
  if [ -f "$CLAUDE_JOB_DIR/conflict-resolved" ]; then
    "$SCRIPTS/dispatch-spawn-tick" "$ISSUE_NUM" >/dev/null 2>&1 \
      || echo "[dispatch-stop] WARNING: dispatch-spawn-tick (resolved re-seed) failed" >&2
    self_close
    exit 0
  fi
  "$SCRIPTS/dispatch-apply-office-hours" "$ISSUE_NUM" \
    "$(resolve_office_hours_reason "merge conflict could not be auto-resolved")" \
    || echo "[dispatch-stop] WARNING: dispatch-apply-office-hours failed" >&2
  "$SCRIPTS/dispatch-spawn-tick" "$ISSUE_NUM" >/dev/null 2>&1 \
    || echo "[dispatch-stop] WARNING: dispatch-spawn-tick (ambiguous re-seed) failed" >&2
  exit 0
fi

# Branch P — parse-job clean completion (#1024): a /budget-parse-job session is
# named <N>-slug like a worker but, on a successful idempotent statement merge,
# writes a `parse-job-done` sentinel instead of a phase-completed marker. A clean
# parse-job produces NO PR: the handler already closed the parse-job issue, so
# there is no label work and no PR-centric disposition — spawn the next tick and
# self-close. (Escalation writes no sentinel; the issue stays open and PR-less and
# falls through to Branch A, which parks it on office-hours — no branch needed
# here.) Checked BEFORE the PR-centric branches, mirroring Branch R.
if [ -f "$CLAUDE_JOB_DIR/parse-job-done" ]; then
  spawn_tick
  self_close
  exit 0
fi

# Resolve PR (may be empty for implement-phase before the draft PR opens).
PR_NUM=$("$SCRIPTS/dispatch-find-pr" "$ISSUE_NUM" 2>/dev/null) || PR_NUM=""

# Fetch the open-PR list once and share it with both the readiness gate and the
# phase derivation below via DISPATCH_PR_LIST, avoiding a redundant `gh pr list`
# per predicate. On fetch failure DISPATCH_PR_LIST stays empty and each script
# falls back to its own self-fetch.
DISPATCH_PR_LIST=$(gh pr list --state open \
  --json number,headRefName,isDraft,statusCheckRollup,labels 2>/dev/null) \
  || DISPATCH_PR_LIST=""
export DISPATCH_PR_LIST

# Read marker (presence drives branch selection; content is for diagnostics).
# Validate against the known phase set — a corrupt or unknown value falls
# through to Branch A (treat as absent) rather than driving Branch B's
# self-close on an unrecognized string.
MARKER_FILE="$CLAUDE_JOB_DIR/phase-completed"
MARKER_PHASE=""
if [ -f "$MARKER_FILE" ]; then
  MARKER_PHASE=$(grep -E '^phase=' "$MARKER_FILE" | head -n1 | cut -d= -f2) || MARKER_PHASE=""
  case "$MARKER_PHASE" in
    implement|verify|qa|review|done) ;;
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
if ! "$SCRIPTS/dispatch-ci-ready" "$ISSUE_NUM" >/dev/null 2>&1; then
  spawn_tick
  if [ -n "$MARKER_PHASE" ]; then
    # Marker present (see the block above): the phase completed and only CI
    # is still running — self-close so the session does not leak idle.
    self_close
  fi
  # No marker: a genuine mid-phase exit during a CI restart — hand back to
  # the router without parking or self-closing (TOCTOU protection).
  exit 0
fi

# Resolve current phase (used to compare against MARKER_PHASE). Called after the
# readiness gate so CI is confirmed ready and dispatch-phase will not exit 3.
CURRENT_PHASE=$("$SCRIPTS/dispatch-phase" "$ISSUE_NUM" 2>/dev/null) || CURRENT_PHASE=""

if [ -z "$MARKER_PHASE" ]; then
  # Branch A — marker absent.
  "$SCRIPTS/dispatch-apply-office-hours" "$ISSUE_NUM" \
    "$(resolve_office_hours_reason "phase exited before completion (mid-phase exit or context compaction)")" \
    || echo "[dispatch-stop] WARNING: dispatch-apply-office-hours failed" >&2
  spawn_tick
  exit 0
fi

if [ -n "$CURRENT_PHASE" ] && [ "$MARKER_PHASE" != "$CURRENT_PHASE" ]; then
  # Branch B — phase advanced.
  strip_office_hours_label
  spawn_tick
  self_close
  exit 0
fi

# Same phase. Check verify-exemption.
if [ "$CURRENT_PHASE" = "verify" ] && [ -n "$PR_NUM" ]; then
  N=$(gh pr view "$PR_NUM" --json labels --jq '[.labels[].name | capture("^dispatch:verify-attempt-(?<n>[0-9]+)$").n | tonumber] | max // 0' 2>/dev/null) || N=0
  [ -z "$N" ] && N=0
  if [ "$N" -lt 3 ]; then
    # Branch C — transient no-push verify outcome; CI concluded, nothing
    # pending. Self-close so the session does not leak idle holding its
    # worktree; the next tick re-runs verify or escalates at the cap.
    spawn_tick
    self_close
    exit 0
  fi
fi

# Branch D — true non-advancement.
"$SCRIPTS/dispatch-apply-office-hours" "$ISSUE_NUM" \
  "$(resolve_office_hours_reason "phase ran but did not advance")" \
  || echo "[dispatch-stop] WARNING: dispatch-apply-office-hours failed" >&2
spawn_tick
exit 0
