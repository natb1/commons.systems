#!/usr/bin/env bash
# WorktreeRemove hook: tear down a worktree created by worktree-create.sh.
# Symmetric with WorktreeCreate (which performs creation); this performs removal.
#
# Removes the worktree ONLY if "in sync" (clean working tree AND all commits
# pushed) AND no Claude session is REGISTERED against it. Otherwise the worktree
# is kept. No PR-state check.
#
# A failed removal is triaged rather than merely logged. `git worktree remove`
# updates the working tree non-transactionally, so it can delete part of a
# checkout and then abort — leaving a half-deleted worktree that no later run
# can remove, because the retry validates against the `.git` file the first
# attempt destroyed. This hook detects that torn state and recovers it in place
# with `rm -rf` + `git worktree prune`; a removal git merely REFUSED (checkout
# intact) is kept untouched, as before. See `.claude/rules/sandbox.md`.
#
# "Registered", not "running": `worktree_has_live_session` reads the REGISTERED
# view (`claude agents --json --all`), so a session that has STOPPED but has not
# been `claude rm`'d still holds its worktree and this hook keeps the checkout.
# That is deliberate — the held checkout is the debugging artifact
# (tactic-stopped-session-blocks-node); the release act is `claude rm <sid>`.
# The library names the holding session on stderr, which is captured into the
# log below so the operator sees WHICH session to release.
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

# shellcheck source=../skills/dispatch-propagate/scripts/lib-worktree-in-sync.sh
source "$(dirname "${BASH_SOURCE[0]}")/../skills/dispatch-propagate/scripts/lib-worktree-in-sync.sh"
# shellcheck source=../skills/dispatch-propagate/scripts/lib-claude-agents.sh
source "$(dirname "${BASH_SOURCE[0]}")/../skills/dispatch-propagate/scripts/lib-claude-agents.sh"
# shellcheck source=../skills/dispatch-propagate/scripts/lib-repo-roots.sh
source "$(dirname "${BASH_SOURCE[0]}")/../skills/dispatch-propagate/scripts/lib-repo-roots.sh"

PAYLOAD=$(cat 2>/dev/null) || PAYLOAD=""
log "raw payload: ${PAYLOAD:-<empty>}"   # first real fire reveals the schema

PROJECT_ROOT=$(resolve_project_root) || { err "git rev-parse --git-common-dir failed — keeping worktree"; exit 0; }
# Must match worktree-create.sh's placement (anchored at the repo root, not
# nested under any one worktree, and not under .git — .git is a normal
# directory inside the working tree post-de-baring, so PROJECT_ROOT
# (dirname of --git-common-dir) IS the repo root) — a mismatch here means
# newly created worktrees fail the safety guard below and are never cleaned
# up, silently (this hook always exits 0 by contract). The dirname arithmetic
# is centralised in lib-repo-roots.sh's resolve_project_root; see its header
# for the full contract.
WORKTREES_ROOT="$PROJECT_ROOT/.claude/worktrees"
# Resolved through the SAME realpath call CANON uses below (-m, tolerating
# a not-yet-existing tail) so a symlinked worktrees root cannot desync the
# two sides of the containment check further down: CANON is always
# canonicalized (symlinks in it resolved), so comparing it against an
# UNresolved WORKTREES_ROOT would silently misfire the `case "$CANON/" in
# "$WORKTREES_ROOT"/*)` guard and the `!= "$WORKTREES_ROOT/main"` guard the
# moment .claude/worktrees itself is (or sits under) a symlink.
#
# Resolved into a scratch var first, then only overwritten on success:
# self-assigning through a failed `$(...)` would blank WORKTREES_ROOT
# outright (command substitution assigns its possibly-empty stdout before
# the exit status is even tested), which is the opposite of CANON's
# fail-open fallback to the ORIGINAL string a few lines down.
_resolved_worktrees_root=$(realpath -m "$WORKTREES_ROOT" 2>/dev/null) && WORKTREES_ROOT="$_resolved_worktrees_root"

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
if ! worktree_in_sync "$CANON" "$LOG_FILE"; then exit 0; fi

# Session guard — occupied or unknown => keep. Stderr is appended to the log so
# the library's done-but-not-removed diagnostic (session id + `claude rm <sid>`)
# reaches the operator instead of being discarded with the hook's stderr.
if worktree_has_live_session "$CANON" 2>>"$LOG_FILE"; then
  log "KEEP: '$CANON' has a live Claude session, or one registered but not yet 'claude rm'd (see any diagnostic above for the holder)"
  exit 0
fi

# In sync, no live session — remove (plain, not --force: clean check passed;
# let git's own safety net catch anything missed).
log "IN SYNC: removing '$CANON'"
if git worktree remove "$CANON" 2>>"$LOG_FILE"; then
  git worktree prune 2>/dev/null || true
  log "removed '$CANON' successfully"
else
  # The removal did not succeed. That is two different states needing opposite
  # responses, and telling them apart is the whole point of this branch.
  #
  #   REFUSED — git declined before touching anything (untracked residue is the
  #             usual cause). The checkout is intact, keeping it is correct, and
  #             a later run can retry safely.
  #   TORN    — git got in, deleted part of the checkout, then aborted. This is
  #             the sandbox signature: `git worktree remove` updates the working
  #             tree NON-transactionally, file by file, so a read-only carve-out
  #             under .claude/ aborts it midway. Retrying CANNOT recover a torn
  #             removal: the retry fails validation with `'.../.git' is not a
  #             .git file, error code 7`, the first attempt having destroyed the
  #             file the second validates against. The only recovery is
  #             `rm -rf` + `git worktree prune`.
  #
  # Scoring TORN as REFUSED leaves a half-deleted checkout registered and
  # un-removable by every later run — so this hook performs the recovery itself
  # rather than logging a failure and leaving the residue for an operator.
  damaged=0
  if [ ! -e "$CANON" ]; then
    # Checkout gone while the registration may survive — the other half of a
    # torn removal, which deletes the checkout and the admin dir in two
    # separately-failing steps. Nothing to delete; prune alone clears it.
    damaged=1
  elif [ ! -f "$CANON/.git" ]; then
    # A worktree's `.git` is a FILE holding `gitdir: <common-dir>/worktrees/<n>`.
    # Test that file directly rather than asking git: this repo's worktrees live
    # UNDER the main working tree (.claude/worktrees/<name>), so a checkout whose
    # `.git` was destroyed still answers `rev-parse` — by walking up and finding
    # the MAIN repository's `.git`. That answer says nothing about the target.
    damaged=1
  else
    # `.git` surviving proves nothing on its own: deletion runs entry-by-entry in
    # directory order, so the abort can land AFTER much of the tree is gone and
    # BEFORE `.git` is reached. worktree_in_sync proved the tracked tree clean
    # moments ago, so any tracked change now — deletions — means the removal got
    # in and gutted the checkout. Untracked files are excluded deliberately: they
    # are residue rather than damage, and they are the common cause of a clean
    # REFUSAL, which must not be scored as a tear.
    post_status=$(git -C "$CANON" status --porcelain --untracked-files=no 2>>"$LOG_FILE") || post_status=""
    [ -z "$post_status" ] || damaged=1
  fi

  if [ "$damaged" -eq 0 ]; then
    err "git worktree remove failed for '$CANON' — worktree kept"
  else
    err "PARTIAL DELETE detected for '$CANON': the removal destroyed part of the checkout before aborting. Recovering with rm -rf + git worktree prune."
    if rm -rf -- "$CANON" 2>>"$LOG_FILE"; then
      if git worktree prune 2>>"$LOG_FILE"; then
        log "recovered '$CANON': half-deleted checkout removed, registration pruned"
      else
        err "git worktree prune failed after recovering '$CANON' — a stale registration remains. REMEDIATION: run 'git worktree prune'"
      fi
    else
      err "rm -rf '$CANON' failed — '$CANON' is HALF-DELETED and unusable. REMEDIATION: run \"rm -rf '$CANON' && git worktree prune\""
    fi
  fi
fi
exit 0
