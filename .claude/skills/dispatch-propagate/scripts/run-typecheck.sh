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
# `git checkout origin/main -- <ws>`, which can clobber pending changes
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

# Make sure origin/main is available locally. Idempotent — CI checkouts
# with fetch-depth: 0 already have it.
git -C "$REPO_ROOT" fetch origin main --quiet 2>/dev/null || \
  git -C "$REPO_ROOT" fetch origin main || true

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
  # tsconfig-less workspace that happens to exist on origin/main (e.g. `style`)
  # was skipped only because its baseline tsc invocation *also* errored and got
  # misreported as a pre-existing typecheck failure.
  if [ ! -f "$REPO_ROOT/$ws/tsconfig.json" ]; then
    echo "$ws: no tsconfig.json — skipping (non-TS workspace)"
    SKIPPED_NO_TSCONFIG+=("$ws")
    continue
  fi

  pass_suffix=""
  if git -C "$REPO_ROOT" rev-parse --verify "origin/main:$ws" >/dev/null 2>&1; then
    TOUCHED_WORKSPACES+=("$ws")
    git -C "$REPO_ROOT" checkout origin/main -- "$ws"

    # `checkout origin/main -- "$ws"` reverts every file origin/main HAS, but it
    # cannot delete a file origin/main does NOT have. So without this step every
    # branch-new file stays on disk at HEAD content while the code it depends on
    # reverts to origin/main — and the baseline compile fails on the branch's own
    # new code. That failure was then reported as "origin/main has pre-existing
    # typecheck errors" and the workspace skipped, meaning ANY PR that adds a
    # file to a workspace silently disabled typechecking for that whole
    # workspace. Remove those files so the baseline is really origin/main; the
    # reset->checkout->clean restore below brings them back, since they are
    # tracked at HEAD. `--no-renames` matters: with rename detection on, a file
    # moved within the workspace is reported as R rather than A, so its new path
    # would survive the probe and poison the baseline exactly as before.
    while IFS= read -r added_file; do
      [ -z "$added_file" ] && continue
      rm -f "$REPO_ROOT/$added_file"
    done < <(git -C "$REPO_ROOT" diff --name-only --no-renames --diff-filter=A origin/main HEAD -- "$ws")

    baseline_ok=true
    (cd "$REPO_ROOT" && npx tsc --noEmit --project "$ws") >/dev/null 2>&1 || baseline_ok=false
    # Restore HEAD version immediately; don't wait for the trap.
    # Three steps, in order: after `checkout origin/main -- "$ws"` an
    # origin/main-only file (one HEAD deletes) is staged `A` — in the index and
    # on disk. `reset HEAD` unstages it (making it untracked); only then can
    # `clean -fdq` remove it from disk. `checkout HEAD` restores the tracked
    # files HEAD does have. Order reset->checkout->clean is required: without the
    # reset, clean is a no-op (file still tracked); without the clean, the file
    # lingers untracked on disk. `-fd` (no `-x`) preserves gitignored files; the
    # `$ws` scope + the line-61 dirty guard mean clean only removes swap-introduced files.
    git -C "$REPO_ROOT" reset -q HEAD -- "$ws"
    git -C "$REPO_ROOT" checkout HEAD -- "$ws"
    git -C "$REPO_ROOT" clean -fdq -- "$ws"

    if [ "$baseline_ok" = false ]; then
      echo "$ws: skipping — origin/main has pre-existing typecheck errors" >&2
      SKIPPED_BASELINE+=("$ws")
      continue
    fi
  else
    echo "$ws: new workspace (no origin/main baseline) — typechecking on HEAD"
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
  echo "These workspaces typecheck cleanly on origin/main but fail on HEAD." >&2
  exit 1
fi

# A baseline-failure skip means this run verified nothing about a workspace it
# was asked to verify, so it is always reported — never folded into a pass line.
if [ ${#SKIPPED_BASELINE[@]} -gt 0 ]; then
  echo "" >&2
  echo "WARNING: NOT typechecked (origin/main baseline fails): ${SKIPPED_BASELINE[*]}" >&2
fi

# Nothing was actually typechecked. This exits 0 on purpose: a baseline skip now
# means origin/main is genuinely broken, and a PR author is not responsible for
# that (the contract is pinned by test-run-typecheck.sh "Test 3: dirty baseline
# + dirty HEAD -> skipped", which asserts exit 0). What must not happen is
# claiming a pass — so say plainly that nothing was verified.
if [ "$CHECKED" -eq 0 ]; then
  echo "No workspace was typechecked: ${#SKIPPED_NO_TSCONFIG[@]} non-TS, ${#SKIPPED_BASELINE[@]} baseline-skipped."
  echo "This run verified nothing — it is not a pass."
  exit 0
fi

echo "All typecheck targets passed ($CHECKED checked, $(( ${#SKIPPED_NO_TSCONFIG[@]} + ${#SKIPPED_BASELINE[@]} )) skipped)."
