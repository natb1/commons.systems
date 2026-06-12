#!/usr/bin/env bash
# Context-clear recovery hook: if this is a dispatch worker session, emit a
# reload instruction. Bound to SessionStart:clear.
# Always exits 0 — never blocks session recovery.
set -uo pipefail
trap 'echo "[restore-dispatch-skill] WARNING: unexpected error on line $LINENO" >&2; exit 0' ERR

STDIN_JSON=$(cat 2>/dev/null) || STDIN_JSON=""
SESSION_ID=$(printf '%s' "$STDIN_JSON" | jq -r '.session_id // empty' 2>/dev/null) || SESSION_ID=""

# Query the running sessions to get the --name for this session.
NAME=""
if [ -n "$SESSION_ID" ]; then
  NAME=$(claude agents --json 2>/dev/null | \
    jq -r --arg sid "$SESSION_ID" '.[] | select(.sessionId == $sid) | .name' \
    2>/dev/null) || NAME=""
fi

# No `dispatch-<short-id>` router sessions exist anymore: after #982 Unit 3 the
# autonomous tick is a headless `systemd-run` dispatch-tick, not a Claude session,
# so nothing spawns `claude --bg /dispatch-propagate`. The branch is kept as a
# defensive no-op — a stray `dispatch-*` session is not a phase worker and must
# not have a phase skill restored.
case "$NAME" in
  dispatch-*) exit 0 ;;
esac

ISSUE_NUM=""
WORKTREE_BASENAME=""

# Primary path: session --name matches worker shape ^[0-9]+-. The name IS the
# worktree basename for workers spawned by dispatch-launch-worker.
if printf '%s\n' "$NAME" | grep -qE '^[0-9]+-'; then
  ISSUE_NUM=$(printf '%s\n' "$NAME" | grep -oE '^[0-9]+')
  WORKTREE_BASENAME="$NAME"
else
  # Fallback: derive from the branch name (worktree basename).
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0
  if printf '%s\n' "$BRANCH" | grep -qE '^[0-9]+-'; then
    ISSUE_NUM=$(printf '%s\n' "$BRANCH" | grep -oE '^[0-9]+')
    WORKTREE_BASENAME="$BRANCH"
  else
    exit 0
  fi
fi

[ -n "$ISSUE_NUM" ] || exit 0
[ -n "$WORKTREE_BASENAME" ] || exit 0

# WORKTREE_BASENAME comes from session --name (via `claude agents --json`) or
# git branch name; reject path-traversal and control characters before
# composing the absolute path below and emitting it on the ARGUMENTS line. Git
# refnames already disallow `..` and control characters, so a slash, `..`, or
# an embedded newline/CR/tab here indicates a malformed or hostile source — a
# control char would otherwise inject extra lines into the emitted reminder.
case "$WORKTREE_BASENAME" in
  *..*|*/*|*[[:cntrl:]]*) exit 0 ;;
esac

# Resolve the absolute worktree path. The project root is the parent of the
# shared git common dir (.bare). git is run from the hook's cwd, which is some
# worktree of the project — --git-common-dir always returns the shared path.
GIT_COMMON_DIR=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || exit 0
PROJECT_ROOT=$(dirname "$GIT_COMMON_DIR")
WORKTREE_PATH="$PROJECT_ROOT/worktrees/$WORKTREE_BASENAME"

# Inline the phase skill's SKILL.md body into a system-reminder so the model
# resumes the phase skill semantically. The previous design emitted a one-line
# `Reload skill: /<name>` directive — a prompt-engineering nudge the model
# could ignore when a competing injected user prompt clobbered it (#903 root
# cause). Inlining the SKILL.md body mirrors the shape the Skill tool delivers
# when it fires, so the phase skill's full instructions are present in context
# regardless of whether the Skill tool was invoked.
#
# Routing: plan→plan-issue; implement→implement; fix-conflicts→fix-conflicts;
# fix-checks→fix-checks; qa→qa-fix; review→review-fix. An undetermined/done
# phase (done/unknown/dispatch-phase failure, incl. not-ready CI, exit 3) has no
# phase skill to reload, so nothing is restored — the Stop hook
# (dispatch-stop.sh) owns the disposition.
#
# An office-hours-<N> session (started by the /office-hours entry point, #759)
# is not a phase worker — it restores the /office-hours skill body, not a phase
# skill, so its plan-mode paths survive a context clear. This case is matched by
# session --name ahead of the phase routing below; it is inert until
# office-hours-* sessions exist.
#
# Falls back to the one-line Reload directive if SKILL.md is missing or
# unreadable — defensive against a packaging error breaking recovery.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" || exit 0
DISPATCH_SCRIPTS="$SCRIPT_DIR/../skills/dispatch-propagate/scripts"
if printf '%s\n' "$NAME" | grep -qE '^office-hours-[0-9]+$'; then
  SKILL_DIR_NAME="office-hours"
  SKILL_ARGS=""
  DIRECTIVE="/office-hours"
else
  PHASE=$("$DISPATCH_SCRIPTS/dispatch-phase" "$ISSUE_NUM" 2>/dev/null) || PHASE=""

  case "$PHASE" in
    plan)
      SKILL_DIR_NAME="plan-issue"
      SKILL_ARGS="$ISSUE_NUM"
      DIRECTIVE="/plan-issue $ISSUE_NUM"
      ;;
    implement)
      SKILL_DIR_NAME="implement"
      SKILL_ARGS="$ISSUE_NUM"
      DIRECTIVE="/implement $ISSUE_NUM"
      ;;
    fix-conflicts)
      SKILL_DIR_NAME="fix-conflicts"
      SKILL_ARGS=""
      DIRECTIVE="/fix-conflicts"
      ;;
    fix-checks)
      SKILL_DIR_NAME="fix-checks"
      SKILL_ARGS=""
      DIRECTIVE="/fix-checks"
      ;;
    qa)
      SKILL_DIR_NAME="qa-fix"
      SKILL_ARGS=""
      DIRECTIVE="/qa-fix"
      ;;
    review)
      SKILL_DIR_NAME="review-fix"
      SKILL_ARGS=""
      DIRECTIVE="/review-fix"
      ;;
    *)
      # Undetermined or done phase (unknown / dispatch-phase failure, incl.
      # not-ready CI exit 3): no phase skill to reload. The Stop hook
      # (dispatch-stop.sh) owns the disposition. Defensive no-op, mirroring the
      # `dispatch-*) exit 0` case above.
      exit 0
      ;;
  esac
fi

# Canonicalize the skill directory. On cd failure fall back to the legacy
# one-line Reload directive — recovery still works, just without inlining.
SKILL_DIR=$(cd "$SCRIPT_DIR/../skills/$SKILL_DIR_NAME" 2>/dev/null && pwd) || {
  printf 'COMPACTION RECOVERY: Reload skill: %s\n' "$DIRECTIVE"
  exit 0
}
SKILL_FILE="$SKILL_DIR/SKILL.md"

# If SKILL.md is missing or unreadable, emit the legacy one-line Reload
# directive. The model will then invoke the Skill tool to load it.
if [ ! -r "$SKILL_FILE" ]; then
  printf 'COMPACTION RECOVERY: Reload skill: %s\n' "$DIRECTIVE"
  exit 0
fi

# Inlined form: header, base directory, SKILL.md body (frontmatter stripped),
# and optional ARGUMENTS line.
printf 'COMPACTION RECOVERY — resume the active phase skill below.\n'
printf '\n'
printf 'Base directory for this skill: %s\n' "$SKILL_DIR"
printf '\n'

# Strip a leading YAML frontmatter block delimited by `---` lines. Two-pass
# strip: first remove line 1 (the opening `---`), then delete through the
# next `---` line (the closing delimiter). A single `sed '1,/^---$/d'`
# does not work when line 1 is `---` — the range matches just line 1.
#
# Only strip when a closing `---` actually exists. A malformed file with an
# opening `---` but no closing delimiter would otherwise have its entire body
# deleted (the second sed range runs to EOF), silently emitting an empty
# skill — worse than the legacy fallback. In that case emit the file verbatim.
first_line=$(head -n1 "$SKILL_FILE")
if [ "$first_line" = "---" ] && tail -n +2 "$SKILL_FILE" | grep -qx -- '---'; then
  sed '1d' "$SKILL_FILE" | sed '1,/^---$/d'
else
  cat "$SKILL_FILE"
fi

if [ -n "$SKILL_ARGS" ]; then
  printf '\n'
  printf 'ARGUMENTS: %s\n' "$SKILL_ARGS"
fi

exit 0
