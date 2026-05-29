#!/usr/bin/env bash
# dispatch-stop: dispatch-worker phase-completion + propagation handler.
#
# Wired to the Stop event. Owns the post-phase disposition that used to live
# in /dispatch-worker Step 4: read the phase-completed marker, decide whether
# the phase advanced or stalled, manage the dispatch:office-hours label,
# spawn the next /dispatch router, and self-close on a clean advance. Moving
# this out of the model loop fixes a mid-phase context-compaction session
# leak — the harness fires Stop unconditionally at session end, regardless of
# the model's last visible action.
#
# Branches (driven by marker presence + CURRENT_PHASE relative to MARKER_PHASE):
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
#      counter < 3 — CI re-runs still possible. Spawn router, exit 0 (no label,
#      no self-close — session parks "stopped"; transcript is the diagnostic).
#   D. marker present + same phase + NOT (verify AND counter < 3) — true
#      non-advancement (or a hypothetical same-phase non-verify case). Park the
#      ISSUE on a human via dispatch-apply-office-hours (label + why-comment),
#      spawn router, exit 0.
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

# Resolve PR (may be empty for implement-phase before the draft PR opens).
PR_NUM=$("$SCRIPTS/dispatch-find-pr" "$ISSUE_NUM" 2>/dev/null) || PR_NUM=""

# Resolve current phase (used to compare against MARKER_PHASE).
CURRENT_PHASE=$("$SCRIPTS/dispatch-phase" "$ISSUE_NUM" 2>/dev/null) || CURRENT_PHASE=""

# Read marker (presence drives branch selection; content is for diagnostics).
# Validate against the known phase set — a corrupt or unknown value falls
# through to Branch A (treat as absent) rather than driving Branch B's
# self-close on an unrecognized string.
MARKER_FILE="$CLAUDE_JOB_DIR/phase-completed"
MARKER_PHASE=""
if [ -f "$MARKER_FILE" ]; then
  MARKER_PHASE=$(grep -E '^phase=' "$MARKER_FILE" | head -n1 | cut -d= -f2) || MARKER_PHASE=""
  case "$MARKER_PHASE" in
    implement|verify|qa|code-review|review|security|done) ;;
    *) MARKER_PHASE="" ;;
  esac
fi

# Resolve the why-comment reason. The #826 enrichment hook may write a
# context-specific reason to $CLAUDE_JOB_DIR/office-hours-reason; when present
# and non-empty it wins over the caller-supplied branch default.
resolve_office_hours_reason() {
  local default_reason="$1"
  local reason_file="$CLAUDE_JOB_DIR/office-hours-reason"
  if [ -n "${CLAUDE_JOB_DIR:-}" ] && [ -s "$reason_file" ]; then
    cat "$reason_file"
  else
    printf '%s' "$default_reason"
  fi
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

spawn_router() {
  "$SCRIPTS/dispatch-spawn-router" >/dev/null 2>&1 \
    || echo "[dispatch-stop] WARNING: dispatch-spawn-router failed" >&2
}

self_close() {
  "$SCRIPTS/dispatch-self-close" >/dev/null 2>&1 \
    || echo "[dispatch-stop] WARNING: dispatch-self-close failed" >&2
}

if [ -z "$MARKER_PHASE" ]; then
  # Branch A — marker absent.
  "$SCRIPTS/dispatch-apply-office-hours" "$ISSUE_NUM" \
    "$(resolve_office_hours_reason "phase exited before completion (mid-phase exit or context compaction)")" \
    || echo "[dispatch-stop] WARNING: dispatch-apply-office-hours failed" >&2
  spawn_router
  exit 0
fi

if [ -n "$CURRENT_PHASE" ] && [ "$MARKER_PHASE" != "$CURRENT_PHASE" ]; then
  # Branch B — phase advanced.
  strip_office_hours_label
  spawn_router
  self_close
  exit 0
fi

# Same phase. Check verify-exemption.
if [ "$CURRENT_PHASE" = "verify" ] && [ -n "$PR_NUM" ]; then
  N=$(gh pr view "$PR_NUM" --json labels --jq '[.labels[].name | capture("^dispatch:verify-attempt-(?<n>[0-9]+)$").n | tonumber] | max // 0' 2>/dev/null) || N=0
  [ -z "$N" ] && N=0
  if [ "$N" -lt 3 ]; then
    # Branch C — verify retry still possible.
    spawn_router
    exit 0
  fi
fi

# Branch D — true non-advancement.
"$SCRIPTS/dispatch-apply-office-hours" "$ISSUE_NUM" \
  "$(resolve_office_hours_reason "phase ran but did not advance")" \
  || echo "[dispatch-stop] WARNING: dispatch-apply-office-hours failed" >&2
spawn_router
exit 0
