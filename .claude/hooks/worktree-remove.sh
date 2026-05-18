#!/usr/bin/env bash
# WorktreeRemove hook: tear down a worktree created by worktree-create.sh.
# Symmetric with WorktreeCreate (which performs creation); this performs removal.
#
# Removes the worktree ONLY if "in sync": clean working tree AND all commits
# pushed. Otherwise the worktree is kept. No PR-state check.
#
# CONTRACT: WorktreeRemove has no decision control — exit code and stdout are
# ignored, failures surface only in debug mode. A broken hook fails SILENTLY,
# so: errexit is omitted (cf. approve-workflow-commands.sh), every step is
# logged to a persistent file, and the script always exits 0.
set -uo pipefail

LOG_FILE="${TMPDIR:-/tmp}/worktree-remove.log"
log() { printf '%s [worktree-remove] %s\n' "$(date -u +%FT%TZ)" "$*" >>"$LOG_FILE" 2>/dev/null || true; }
err() { log "ERROR: $*"; }
trap 'err "unexpected error on line $LINENO (exit $?)"; exit 0' ERR
trap 'exit 0' EXIT

PAYLOAD=$(cat 2>/dev/null) || PAYLOAD=""
log "raw payload: ${PAYLOAD:-<empty>}"   # first real fire reveals the schema

GIT_COMMON_DIR=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || GIT_COMMON_DIR=""
[ -n "$GIT_COMMON_DIR" ] || { err "git rev-parse --git-common-dir failed — keeping worktree"; exit 0; }
PROJECT_ROOT=$(dirname "$GIT_COMMON_DIR")
WORKTREES_ROOT="$PROJECT_ROOT/worktrees"

# Relocate the log to a stable place outside any worktree, carrying over.
mkdir -p "$PROJECT_ROOT/tmp" 2>/dev/null || true
NEW_LOG="$PROJECT_ROOT/tmp/worktree-remove.log"
if [ "$NEW_LOG" != "$LOG_FILE" ]; then
  [ -f "$LOG_FILE" ] && cat "$LOG_FILE" >>"$NEW_LOG" 2>/dev/null || true
  LOG_FILE="$NEW_LOG"
fi

# Resolve the target worktree path. The WorktreeRemove stdin schema is
# undocumented; try the plausible fields, then a bare name, then $PWD.
TARGET=""
for field in worktree_path path cwd; do
  v=$(printf '%s' "$PAYLOAD" | jq -r --arg f "$field" '.[$f] // empty' 2>/dev/null) || v=""
  [ -n "$v" ] && { TARGET="$v"; break; }
done
if [ -z "$TARGET" ]; then
  name=$(printf '%s' "$PAYLOAD" | jq -r '.name // empty' 2>/dev/null) || name=""
  [ -n "$name" ] && TARGET="$WORKTREES_ROOT/$name"
fi
[ -n "$TARGET" ] || TARGET="${PWD:-}"
CANON=$(realpath -m "$TARGET" 2>/dev/null) || CANON="$TARGET"
log "target: '$CANON'"

# Safety guards: only ever touch a registered, non-main worktree under worktrees/.
case "$CANON/" in
  "$WORKTREES_ROOT"/*) : ;;
  *) err "refusing: '$CANON' not under $WORKTREES_ROOT"; exit 0 ;;
esac
[ "$CANON" != "$WORKTREES_ROOT/main" ] || { err "refusing: '$CANON' is main"; exit 0; }

WT_LIST=$(git worktree list --porcelain 2>/dev/null) || WT_LIST=""
registered=0
while IFS= read -r line; do
  case "$line" in
    "worktree "*)
      wp=$(realpath -m "${line#worktree }" 2>/dev/null) || wp="${line#worktree }"
      [ "$wp" = "$CANON" ] && registered=1 ;;
  esac
done <<<"$WT_LIST"
[ "$registered" -eq 1 ] || { log "'$CANON' not a registered worktree — pruning, no-op"; git worktree prune 2>/dev/null || true; exit 0; }

# In-sync check — any error or ambiguity => keep.
status=$(git -C "$CANON" status --porcelain 2>>"$LOG_FILE") || { err "git status failed for '$CANON' — keeping"; exit 0; }
[ -z "$status" ] || { log "KEEP: '$CANON' has uncommitted changes"; exit 0; }
unpushed=$(git -C "$CANON" rev-list --count HEAD --not --remotes 2>>"$LOG_FILE") || { err "rev-list failed for '$CANON' — keeping"; exit 0; }
[[ "$unpushed" =~ ^[0-9]+$ ]] || { err "rev-list non-numeric ('$unpushed') for '$CANON' — keeping"; exit 0; }
[ "$unpushed" -eq 0 ] || { log "KEEP: '$CANON' has $unpushed unpushed commit(s)"; exit 0; }

# In sync — remove (plain, not --force: clean check passed; let git's own
# safety net catch anything missed).
log "IN SYNC: removing '$CANON'"
if git worktree remove "$CANON" 2>>"$LOG_FILE"; then
  git worktree prune 2>/dev/null || true
  log "removed '$CANON' successfully"
else
  err "git worktree remove failed for '$CANON' — worktree kept"
fi
exit 0
