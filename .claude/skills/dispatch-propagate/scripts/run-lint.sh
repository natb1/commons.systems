#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
SCRIPTS="$(cd "$(dirname "$0")" && pwd)"

# shellcheck source=lib.sh
source "$SCRIPTS/lib.sh"

# Parse options
declare -A DIRTY_APPS
RUN_NIX=false
RUN_RULES=false
RUN_PROSE=false
RUN_DS_DRIFT=false
EXPLICIT=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app)
      [[ $# -lt 2 ]] && { echo "Error: --app requires an argument" >&2; exit 1; }
      DIRTY_APPS["$2"]=1
      EXPLICIT=true
      shift 2
      ;;
    --nix)
      RUN_NIX=true
      EXPLICIT=true
      shift
      ;;
    --rules)
      RUN_RULES=true
      EXPLICIT=true
      shift
      ;;
    --prose)
      RUN_PROSE=true
      EXPLICIT=true
      shift
      ;;
    --ds-drift)
      RUN_DS_DRIFT=true
      EXPLICIT=true
      shift
      ;;
    *)
      echo "Usage: run-lint.sh [--app <dir>] [--nix] [--rules] [--prose] [--ds-drift]" >&2
      exit 1
      ;;
  esac
done

# Auto-detect mode: delegate app detection to get-changed-apps.sh,
# then check nix/rules inline (those aren't app-level concerns).
if [ "$EXPLICIT" = false ]; then
  while IFS= read -r app; do
    [ -z "$app" ] && continue
    DIRTY_APPS["$app"]=1
  done < <("$SCRIPTS/get-changed-apps.sh")

  # Detect nix and rules changes separately.
  #
  # The baseline comes from resolve-diff-base.sh rather than being spelt
  # `origin/main...HEAD` inline. --at-remote-tip first-parent because this
  # script runs on pushes to `main` too, where actions/checkout leaves
  # origin/main pointing AT the pushed commit: the three-dot diff was then
  # EMPTY and RUN_NIX / RUN_RULES / RUN_PROSE / RUN_DS_DRIFT all stayed false —
  # five of this script's eight check blocks silently switched off, under the
  # informational-looking "No changed-file lint targets matched." message.
  #
  # A plain assignment, not `if ! X=$(...)`, so the helper's non-zero exit
  # propagates under `set -e` rather than being swallowed.
  DIFF_BASE=$("$SCRIPTS/resolve-diff-base.sh" --repo-root "$REPO_ROOT" --at-remote-tip first-parent)
  if ! CHANGED=$(git -C "$REPO_ROOT" diff --name-only "$DIFF_BASE"..HEAD); then
    echo "ERROR: could not diff ${DIFF_BASE}..HEAD in $REPO_ROOT" >&2
    exit 1
  fi
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    case "$file" in
      nix/*|flake.nix|flake.lock) RUN_NIX=true ;;
      firestore.rules) RUN_RULES=true ;;
      *.css|*.tsx) RUN_DS_DRIFT=true ;;
    esac
    if is_shell_script "$file"; then RUN_PROSE=true; fi
  done <<< "$CHANGED"
fi

APP_DIRS=("${!DIRTY_APPS[@]}")
FAILURES=()

# Install all dependencies once at the workspace root (skip when only running nix/rules checks)
if [ ${#APP_DIRS[@]} -gt 0 ]; then
  ensure_deps
fi

# Run eslint on detected app dirs
for dir in "${APP_DIRS[@]}"; do
  echo "=== Lint: $dir ==="
  if (cd "$REPO_ROOT" && npm run -w "$dir" lint); then
    echo "PASS: $dir"
  else
    echo "FAIL: $dir" >&2
    FAILURES+=("$dir")
  fi
done

# Run nix flake check
if [ "$RUN_NIX" = true ]; then
  echo "=== nix flake check ==="
  if nix flake check --impure "$REPO_ROOT"; then
    echo "PASS: nix flake check"
  else
    echo "FAIL: nix flake check" >&2
    FAILURES+=(nix)
  fi
fi

# Run rules syntax check
if [ "$RUN_RULES" = true ]; then
  echo "=== Firestore rules check ==="
  if "$SCRIPTS/run-rules-check.sh" "$REPO_ROOT"; then
    echo "PASS: firestore rules"
  else
    echo "FAIL: firestore rules" >&2
    FAILURES+=(rules)
  fi
fi

# Run prose-rule lint
if [ "$RUN_PROSE" = true ]; then
  echo "=== Prose-rule lint ==="
  if "$SCRIPTS/lint-prose-rules.sh"; then
    echo "PASS: prose rules"
  else
    echo "FAIL: prose rules" >&2
    FAILURES+=(prose)
  fi
fi

# Run ds-drift lint
if [ "$RUN_DS_DRIFT" = true ]; then
  echo "=== ds-drift lint ==="
  if "$SCRIPTS/lint-ds-drift.sh"; then
    echo "PASS: ds-drift"
  else
    echo "FAIL: ds-drift" >&2
    FAILURES+=(ds-drift)
  fi
fi

# Run verify-fence path lint — UNCONDITIONALLY, on every PR.
#
# Deliberately not gated on RUN_PROSE or any other changed-files flag. The
# failure this catches is a DELETION that orphans a path named inside a live
# intention node's ```verify fence, and every changed-files gate here stats the
# path on disk (RUN_PROSE comes from lib.sh's is_shell_script, which returns
# false for a file this diff deleted). Gating it would leave exactly the case it
# exists to catch uncovered.
#
# --repo-root is passed explicitly: $SCRIPTS is this script's own location,
# which is NOT always the tree under test — running main's copy of run-lint.sh
# with a worktree CWD is routine. Without the flag the checker would resolve its
# own root and scan main's intentions/ while eslint/prose scanned the worktree,
# passing on a branch it never examined.
echo "=== verify-fence path lint ==="
if "$SCRIPTS/lint-verify-fence-paths.sh" --repo-root "$REPO_ROOT"; then
  echo "PASS: verify-fence paths"
else
  echo "FAIL: verify-fence paths" >&2
  FAILURES+=(verify-fence-paths)
fi

# Run vendored-skill lint — UNCONDITIONALLY, on every PR.
#
# Not gated on changed files, and unlike every other check here it needs no
# origin/main baseline: it hashes the working tree's vendored skill directories
# against the digests recorded in their .upstream.json markers, so it also runs
# on a plain checkout or a worktree with no upstream ref. Cost is a sha256 over
# a handful of small files.
#
# INTEGRITY TIER ONLY — deliberately without --local. The drift and shadow
# checks need the machine's own Claude skill roots (~/.claude/skills and its
# synced buckets), which no CI runner has; invoked here they would silently
# downgrade to this same tier and read as coverage that does not exist. They
# run in .githooks/pre-commit instead. See .claude/rules/vendored-skills.md.
echo "=== vendored-skill lint ==="
if "$SCRIPTS/lint-vendored-skills.sh"; then
  echo "PASS: vendored skills"
else
  echo "FAIL: vendored skills" >&2
  FAILURES+=(vendored-skills)
fi

# Run type-safety escape-hatch check — UNCONDITIONALLY, on every PR.
#
# Not gated on RUN_PROSE or any app-dir flag: this diffs origin/main...HEAD
# over TS/JS files itself and is a fast self-noop when that diff is empty, so
# there is no changed-files flag worth adding just to skip it. See
# .claude/rules/type-safety-suppression-marker.md for the marker that
# suppresses a flagged line.
#
# Invoked by an absolute path under $REPO_ROOT (not $SCRIPTS-relative) so the
# script's own git-diff baseline resolves against the worktree under test, not
# against wherever run-lint.sh's copy happens to live — same reasoning as the
# verify-fence-paths --repo-root flag above.
echo "=== type-safety escape-hatch check ==="
if "$REPO_ROOT/.github/scripts/check-type-safety-escapes.sh"; then
  echo "PASS: type-safety escapes"
else
  echo "FAIL: type-safety escapes" >&2
  FAILURES+=(type-safety-escapes)
fi

# The changed-files-scoped checks may all have been skipped; say so. This is no
# longer an early exit — the unconditional check above always runs, so its
# result must still reach the FAILURES tally below.
if [ ${#APP_DIRS[@]} -eq 0 ] && [ "$RUN_NIX" = false ] && [ "$RUN_RULES" = false ] && [ "$RUN_PROSE" = false ] && [ "$RUN_DS_DRIFT" = false ]; then
  echo "No changed-file lint targets matched. Only the unconditional checks ran."
fi

if [ ${#FAILURES[@]} -gt 0 ]; then
  echo "Failed suites: ${FAILURES[*]}" >&2
  exit 1
fi

echo "All lint checks passed."
