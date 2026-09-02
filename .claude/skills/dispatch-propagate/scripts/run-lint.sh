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
  # Captured into a variable rather than read from `< <(...)`.
  #
  # A process substitution's exit status is not the status of the enclosing
  # command and `set -e` never sees it: when get-changed-apps.sh failed — which
  # it now does, loudly, on an unresolvable baseline instead of printing
  # nothing — the while loop simply read zero lines and lint proceeded with no
  # apps. That is the same buried-error shape as the vacuous diff this whole
  # change exists to remove, one layer up.
  if ! CHANGED_APPS=$("$SCRIPTS/get-changed-apps.sh"); then
    echo "ERROR: get-changed-apps.sh failed; cannot determine which apps to lint" >&2
    exit 1
  fi
  while IFS= read -r app; do
    [ -z "$app" ] && continue
    DIRTY_APPS["$app"]=1
  done <<< "$CHANGED_APPS"

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

# Path to the registered-checks runner, computed once. Both the ensure_deps
# gate below and the registered-checks block further down key off whether this
# file exists: it always does in this repo, but test-run-lint.sh exercises
# this exact script against ephemeral fixture repos that carry a package.json
# and one fixture workspace but none of the intentions toolchain — no
# packages/intentionsutil at all. This variable is the single source of truth
# both gates read, so they can never disagree about which repo they're in.
RC_RUNNER="$REPO_ROOT/packages/intentionsutil/scripts/run-registered-checks.ts"

# Install all dependencies once at the workspace root.
#
# Runs when there's an app dir to lint OR the registered-checks runner is
# present: that runner is invoked as `node --import tsx/esm`, which resolves
# `tsx` from node_modules, so it needs deps installed first. In THIS repo
# RC_RUNNER always exists, so this stays effectively unconditional here — the
# CI lint job runs no `npm ci` of its own, so gating solely on APP_DIRS left a
# .claude/**- or intentions/**-only PR with no node_modules and the runner
# died ERR_MODULE_NOT_FOUND. The RC_RUNNER-presence half of the OR only
# matters in a repo that lacks the intentions toolchain (the test fixtures
# below) and has no dirty apps either: there `npm ci` would fail anyway (no
# lockfile) for a runner that isn't even there to need it, so skipping is
# correct, not a weakening.
# `ensure_deps` is already a no-op when node_modules exists.
if [ ${#APP_DIRS[@]} -gt 0 ] || [ -f "$RC_RUNNER" ]; then
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
# Not gated on RUN_PROSE or any app-dir flag: this resolves its own baseline
# through resolve-diff-base.sh and diffs TS/JS files itself, and is a fast
# self-noop when that diff is empty, so there is no changed-files flag worth
# adding just to skip it. It no longer diffs origin/main...HEAD: that spelling
# made a branch behind main compare against commits it never had. See
# .claude/rules/type-safety-suppression-marker.md for the marker that
# suppresses a flagged line.
#
# Invoked by an absolute path under $REPO_ROOT (not $SCRIPTS-relative) so the
# copy that runs is the one in the tree under test, AND passed --repo-root so
# the tree it scans is named rather than inferred — same reasoning, and the
# same flag, as the verify-fence-paths call above.
#
# --repo-root is REQUIRED OF THE TREE UNDER TEST, not optional. Running main's
# copy of this script against a worktree that has not yet merged the commit
# adding the flag aborts with "Unknown argument: --repo-root". That is
# deliberate: the failure is loud, names the flag, and clears itself the moment
# the worktree merges main. Feature-detecting the flag and falling back to an
# unscoped invocation would be exactly the defensive fallback
# .claude/rules/code-style.md forbids — it would silently scan a tree nobody
# named, which is the vacuity this whole change exists to remove.
echo "=== type-safety escape-hatch check ==="
if "$REPO_ROOT/.github/scripts/check-type-safety-escapes.sh" --repo-root "$REPO_ROOT"; then
  echo "PASS: type-safety escapes"
else
  echo "FAIL: type-safety escapes" >&2
  FAILURES+=(type-safety-escapes)
fi

# Run the tier-aware registered-checks runner — UNCONDITIONALLY, on every PR
# in THIS repo (tactic-migration-frontier-projection, unit 7), gated only on
# RC_RUNNER's presence (computed once, above, alongside the ensure_deps gate).
#
# NOT gated on changed files, and deliberately so: unlike every check above,
# this one's pass/fail is not primarily about a diff at all — a check's TIER
# is derived from the graph's criteria (deriveTier, checks.ts), so a criterion
# authored or ratified on a strategy node moves a check's tier even when the
# PR touches no code whatsoever. A changed-files gate keyed on TS/shell diffs
# would skip exactly the intent-layer edits that move a tier, which is the one
# case this runner exists to catch.
#
# The RC_RUNNER file-presence gate exists only for test-run-lint.sh: it runs
# this exact script against ephemeral fixture repos with no
# packages/intentionsutil at all, where the runner simply isn't there to
# invoke. In this repo RC_RUNNER always exists, so this block always runs here
# — same posture as the ensure_deps gate above, and not a weakening of this
# check for any PR that actually lands in this repo.
#
# Exits non-zero ONLY when a GATING-tier check failed — every criterion
# recorded today is authority "deferred" (unit 6's bootstrap census), so every
# check derives observe by construction and this block cannot fail the build
# yet. It reports the sanction-gated tier and each check's own verdict either
# way, exactly as the frontier CLI does for the criteria/observe-failure arms.
#
# Invoked by an absolute path under $REPO_ROOT, both for the script and for
# the intentions dir it is passed, for the identical reason the
# type-safety-escapes call above states: the copy and the tree that run must
# be the ones under test, never inferred from $SCRIPTS or cwd.
#
# Default (non --strict-registry) posture: an unbound-criterion registry
# defect is caught and reported as a non-blocking "unresolved" row rather than
# crashing this gate — the same reasoning validate-graph.ts's own
# --strict-sensors precedent records for why a registry defect must not deny
# the write path for every PR (the 2026-08-14 outage). See
# packages/intentionsutil/src/run-checks.ts's module header.
if [ -f "$RC_RUNNER" ]; then
  echo "=== registered-checks runner ==="
  if node --import tsx/esm "$RC_RUNNER" "$REPO_ROOT/intentions"; then
    echo "PASS: registered checks (gating-tier)"
  else
    echo "FAIL: registered checks (gating-tier)" >&2
    FAILURES+=(registered-checks)
  fi
else
  echo "SKIP: registered-checks — packages/intentionsutil/scripts/run-registered-checks.ts not present in this repo"
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
