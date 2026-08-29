#!/usr/bin/env bash
# PreToolUse hook: auto-approve Artifact tool calls when settings.json allows them.
#
# Why a hook and not the `permissions.allow` entry alone: `permissions.allow`
# rules in a project's .claude/settings.json are capability grants, so Claude
# Code withholds them until the workspace-trust dialog is accepted. A cloud
# session — a routine firing on a schedule, or any Claude Code on the web
# session — clones this repo fresh and never gets that dialog
# (hasTrustDialogAccepted stays false), so the allow rule never applies there
# and an unattended run stalls on a permission prompt nobody is present to
# answer. Hooks are NOT trust-gated: they run in every session type. So the
# hook re-applies the settings entry, exactly as approve-workflow-commands.sh
# already does for the Bash(cmd:*) entries.
#
# settings.json stays the source of truth: remove the bare "Artifact" entry
# from permissions.allow and this hook stops approving anything.
#
# errexit (-e) is intentionally omitted — hook failures must not block the user.
# Errors are logged to stderr; unrecognized input passes through silently.
set -uo pipefail
trap 'echo "[approve-artifact] WARNING: unexpected error on line $LINENO (exit $?)" >&2; exit 0' ERR

TOOL_NAME=$(jq -r '.tool_name // empty' 2>/dev/null) || {
  echo "[approve-artifact] WARNING: failed to parse input" >&2
  exit 0
}

# Redundant with the matcher in settings.json, kept as a safety check.
if [ "$TOOL_NAME" != "Artifact" ]; then
  exit 0
fi

HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"
SETTINGS_DIR="$HOOK_DIR/.."

APPROVE='{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow","permissionDecisionReason":"Artifact is allowed in .claude/settings.json; re-applied here because workspace trust withholds project allow rules in cloud sessions"}}'

for _SETTINGS_FILE in "$SETTINGS_DIR/settings.json" "$SETTINGS_DIR/settings.local.json"; do
  [ -f "$_SETTINGS_FILE" ] || continue
  if jq -e '(.permissions.allow // []) | any(. == "Artifact")' "$_SETTINGS_FILE" >/dev/null 2>&1; then
    printf '%s\n' "$APPROVE"
    exit 0
  fi
done

exit 0
