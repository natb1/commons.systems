#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
SCRIPTS="$(cd "$(dirname "$0")" && pwd)"

# shellcheck source=lib.sh
source "$SCRIPTS/lib.sh"

# Parse options
declare -A DIRTY_APPS
EXPLICIT=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app)
      [[ $# -lt 2 ]] && { echo "Error: --app requires an argument" >&2; exit 1; }
      # --app takes a workspace DIRECTORY, repo-root-relative (`packages/foo`),
      # not a bare package name (`foo`). Reject a path that does not exist
      # instead of carrying it forward: a non-existent dir has no tsconfig.json,
      # so it would fall into the "no tsconfig.json — skipping (non-TS
      # workspace)" branch below and the run would exit 0 having verified
      # nothing. That failure mode is silent and reads as a pass, so a typo or a
      # missing `packages/` prefix disables typechecking for the workspace the
      # caller believed it was checking.
      if [ ! -d "$REPO_ROOT/$2" ]; then
        echo "Error: --app '$2': no such workspace directory under $REPO_ROOT" >&2
        echo "Pass a repo-root-relative workspace dir, e.g. --app packages/intentionsutil" >&2
        exit 1
      fi
      DIRTY_APPS["$2"]=1
      EXPLICIT=true
      shift 2
      ;;
    *)
      echo "Usage: run-typecheck.sh [--app <dir>]" >&2
      exit 1
      ;;
  esac
done

# Make sure origin/main is available locally. Idempotent — CI checkouts with
# fetch-depth: 0 already have it.
#
# ORDERING IS LOAD-BEARING: this fetch must precede BOTH readers of
# `origin/main`, not sit between them. Two independent resolutions happen
# below — get-changed-apps.sh resolves the WORKSPACE LIST (it does not fetch
# itself; it reads whatever origin/main is already present), and
# resolve-diff-base.sh resolves the BASELINE TREE. With the fetch in between,
# a fetch that advances origin/main mid-run leaves the two answers describing
# different states of the remote.
#
# The damaging case is specific. If the newly-fetched main CONTAINS HEAD, then
# --at-remote-tip first-parent collapses the baseline to HEAD^1, while the
# workspace list still came from the older, further-back fork point. Every
# workspace that is broken at HEAD^1 then fails its baseline probe, lands in
# SKIPPED_BASELINE, and the run exits 0 — announced only by the WARNING below.
# That is a check failing OPEN, which is the exact vacuity this whole change
# exists to remove; a stale-but-CONSISTENT pair is strictly safer than a
# fresh-but-MIXED one.
git -C "$REPO_ROOT" fetch origin main --quiet 2>/dev/null || \
  git -C "$REPO_ROOT" fetch origin main || true

# Auto-detect mode: delegate workspace detection to get-changed-apps.sh.
if [ "$EXPLICIT" = false ]; then
  if ! CHANGED_APPS=$("$SCRIPTS/get-changed-apps.sh"); then
    echo "ERROR: get-changed-apps.sh failed" >&2
    exit 1
  fi
  while IFS= read -r app; do
    [ -z "$app" ] && continue
    DIRTY_APPS["$app"]=1
  done <<< "$CHANGED_APPS"
fi

# Filter rules-test: excluded from vitest workspace projects and from typecheck.
# (rules-test ships .ts files but its tsconfig is geared at the Firebase
# rules-test harness, not standalone tsc --noEmit.)
if [[ -n "${DIRTY_APPS[packages/rules-test]+x}" ]]; then
  echo "Note: rules-test excluded from typecheck (matches run-unit-tests.sh)" >&2
fi
unset 'DIRTY_APPS[packages/rules-test]'
APP_DIRS=("${!DIRTY_APPS[@]}")

if [ ${#APP_DIRS[@]} -eq 0 ]; then
  echo "No typecheck targets matched changed files. Nothing to check."
  exit 0
fi

# Pre-flight guard: the script mutates the working tree via
# `git checkout <base> -- <ws>`, which can clobber pending changes
# inside any workspace we're about to swap. Untracked files and changes
# outside the swapped workspaces are not at risk and are tolerated.
DIRTY_WORKSPACES=()
for ws in "${APP_DIRS[@]}"; do
  if [ -n "$(git -C "$REPO_ROOT" status --porcelain -- "$ws")" ]; then
    DIRTY_WORKSPACES+=("$ws")
  fi
done
if [ ${#DIRTY_WORKSPACES[@]} -gt 0 ]; then
  echo "ERROR: working tree has uncommitted changes in workspaces being typechecked:" >&2
  printf '  %s\n' "${DIRTY_WORKSPACES[@]}" >&2
  echo "run-typecheck.sh swaps workspace files via git checkout; commit or stash first." >&2
  exit 1
fi

# Cleanup trap: restore HEAD for any workspace we touched, even on mid-script
# failure. `git checkout HEAD -- <ws>` is idempotent when nothing differs.
TOUCHED_WORKSPACES=()
cleanup() {
  local rc=$?
  local ws
  for ws in "${TOUCHED_WORKSPACES[@]:-}"; do
    [ -z "$ws" ] && continue
    git -C "$REPO_ROOT" reset -q HEAD -- "$ws" 2>/dev/null || true
    git -C "$REPO_ROOT" checkout HEAD -- "$ws" 2>/dev/null || true
    git -C "$REPO_ROOT" clean -fdq -- "$ws" 2>/dev/null || true
  done
  exit $rc
}
trap cleanup EXIT INT TERM

# THE BASELINE COMMIT — resolved, not hardcoded to `origin/main`.
#
# This script's baseline is not a changed-file list; it is a TREE. Below, each
# workspace is swapped to its baseline content with `git checkout <base> --
# <ws>`, compiled, and restored, so a HEAD failure can be classified as a
# regression rather than blamed on code that was already broken. That makes the
# choice of <base> load-bearing in its own right, separately from how
# get-changed-apps.sh picks which workspaces to look at.
#
# Spelled `origin/main`, the swap is vacuous on a push to `main`: actions/
# checkout leaves refs/remotes/origin/main pointing AT the pushed commit, so
# `git checkout origin/main -- <ws>` writes back exactly what is already there
# and the "baseline" compile is a second compile of HEAD. Both then agree by
# construction — a genuine regression compiles dirty in BOTH probes, is
# classified "origin/main has pre-existing typecheck errors", and the run exits
# 0 having reported a skip instead of the breakage it exists to catch.
#
# --at-remote-tip first-parent asks the right question there: compare against
# what the tree looked like BEFORE this push (HEAD^1). On a branch, HEAD is not
# contained in origin/main, so the helper returns the ordinary merge-base.
#
# That is NOT the old behavior, and this comment used to claim it was. The
# baseline was origin/main's TIP; it is now the fork point. The move is what
# makes the regression/pre-existing split attributable to THIS branch, but it
# carries a cost worth stating: a branch forked at a commit where a workspace
# was broken, and that main has since fixed, now fails the baseline probe and
# lands in SKIPPED_BASELINE — so that workspace is not typechecked at all, and
# a new error the branch introduces there goes unreported. The skip is
# announced by the WARNING below rather than silent, but it is still a skip.
#
# No fallback (.claude/rules/code-style.md): a baseline this script cannot
# justify would silently downgrade every workspace to the "new workspace"
# branch below and typecheck HEAD against nothing.
if ! BASE_REF=$("$SCRIPTS/resolve-diff-base.sh" \
      --repo-root "$REPO_ROOT" --at-remote-tip first-parent); then
  echo "ERROR: could not resolve a typecheck baseline commit (see above)" >&2
  exit 1
fi
echo "Typecheck baseline: $BASE_REF"

# Install workspace dependencies once before any tsc invocation.
ensure_deps

REGRESSIONS=()
# Skips are tracked by class: a tsconfig-less workspace has nothing to check and
# is benign, whereas a baseline-failure skip means we verified nothing about a
# workspace we were asked to verify. Reporting at the bottom depends on the
# distinction, so the two are never merged into one counter.
SKIPPED_NO_TSCONFIG=()
SKIPPED_BASELINE=()
CHECKED=0

for ws in "${APP_DIRS[@]}"; do
  echo "=== Typecheck: $ws ==="

  # CSS-only / non-TS workspaces have no tsconfig.json; `tsc --project <ws>`
  # exits TS5057 with no project to load. Skip them — there is nothing for tsc
  # to typecheck. This also removes the fragile coincidence whereby a
  # tsconfig-less workspace that happens to exist at the baseline (e.g. `style`)
  # was skipped only because its baseline tsc invocation *also* errored and got
  # misreported as a pre-existing typecheck failure.
  if [ ! -f "$REPO_ROOT/$ws/tsconfig.json" ]; then
    echo "$ws: no tsconfig.json — skipping (non-TS workspace)"
    SKIPPED_NO_TSCONFIG+=("$ws")
    continue
  fi

  pass_suffix=""
  if git -C "$REPO_ROOT" rev-parse --verify "$BASE_REF:$ws" >/dev/null 2>&1; then
    TOUCHED_WORKSPACES+=("$ws")
    git -C "$REPO_ROOT" checkout "$BASE_REF" -- "$ws"

    # `checkout "$BASE_REF" -- "$ws"` reverts every file the base HAS, but it
    # cannot delete a file the base does NOT have. So without this step every
    # branch-new file stays on disk at HEAD content while the code it depends on
    # reverts to the base — and the baseline compile fails on the branch's own
    # new code. That failure was then reported as "the baseline has pre-existing
    # typecheck errors" and the workspace skipped, meaning ANY PR that adds a
    # file to a workspace silently disabled typechecking for that whole
    # workspace. Remove those files so the baseline is really the base commit;
    # the reset->checkout->clean restore below brings them back, since they are
    # tracked at HEAD. `--no-renames` matters: with rename detection on, a file
    # moved within the workspace is reported as R rather than A, so its new path
    # would survive the probe and poison the baseline exactly as before.
    while IFS= read -r added_file; do
      [ -z "$added_file" ] && continue
      rm -f "$REPO_ROOT/$added_file"
    done < <(git -C "$REPO_ROOT" diff --name-only --no-renames --diff-filter=A "$BASE_REF" HEAD -- "$ws")

    baseline_ok=true
    (cd "$REPO_ROOT" && npx tsc --noEmit --project "$ws") >/dev/null 2>&1 || baseline_ok=false
    # Restore HEAD version immediately; don't wait for the trap.
    # Three steps, in order: after `checkout "$BASE_REF" -- "$ws"` a
    # baseline-only file (one HEAD deletes) is staged `A` — in the index and
    # on disk. `reset HEAD` unstages it (making it untracked); only then can
    # `clean -fdq` remove it from disk. `checkout HEAD` restores the tracked
    # files HEAD does have. Order reset->checkout->clean is required: without the
    # reset, clean is a no-op (file still tracked); without the clean, the file
    # lingers untracked on disk. `-fd` (no `-x`) preserves gitignored files; the
    # `$ws` scope + the line-78 dirty guard mean clean only removes swap-introduced files.
    git -C "$REPO_ROOT" reset -q HEAD -- "$ws"
    git -C "$REPO_ROOT" checkout HEAD -- "$ws"
    git -C "$REPO_ROOT" clean -fdq -- "$ws"

    if [ "$baseline_ok" = false ]; then
      echo "$ws: skipping — the baseline ($BASE_REF) has pre-existing typecheck errors" >&2
      SKIPPED_BASELINE+=("$ws")
      continue
    fi
  else
    echo "$ws: new workspace (absent from the baseline $BASE_REF) — typechecking on HEAD"
    pass_suffix=" (new workspace)"
  fi

  CHECKED=$((CHECKED + 1))
  if (cd "$REPO_ROOT" && npx tsc --noEmit --project "$ws"); then
    echo "$ws: typecheck passed$pass_suffix"
  else
    echo "$ws: typecheck FAILED" >&2
    REGRESSIONS+=("$ws")
  fi
done

if [ ${#REGRESSIONS[@]} -gt 0 ]; then
  echo "" >&2
  echo "Typecheck regressions in: ${REGRESSIONS[*]}" >&2
  echo "These workspaces typecheck cleanly at the baseline $BASE_REF but fail on HEAD." >&2
  exit 1
fi

# A baseline-failure skip means this run verified nothing about a workspace it
# was asked to verify, so it is always reported — never folded into a pass line.
if [ ${#SKIPPED_BASELINE[@]} -gt 0 ]; then
  echo "" >&2
  echo "WARNING: NOT typechecked (baseline $BASE_REF fails): ${SKIPPED_BASELINE[*]}" >&2
fi

# Nothing was actually typechecked. This exits 0 on purpose: a baseline skip now
# means the baseline commit is genuinely broken, and a PR author is not responsible for
# that (the contract is pinned by test-run-typecheck.sh "Test 3: dirty baseline
# + dirty HEAD -> skipped", which asserts exit 0). What must not happen is
# claiming a pass — so say plainly that nothing was verified.
if [ "$CHECKED" -eq 0 ]; then
  echo "No workspace was typechecked: ${#SKIPPED_NO_TSCONFIG[@]} non-TS, ${#SKIPPED_BASELINE[@]} baseline-skipped."
  echo "This run verified nothing — it is not a pass."
  exit 0
fi

echo "All typecheck targets passed ($CHECKED checked, $(( ${#SKIPPED_NO_TSCONFIG[@]} + ${#SKIPPED_BASELINE[@]} )) skipped)."
