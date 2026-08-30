#!/usr/bin/env bash
set -euo pipefail

# Detect changed file categories for CI conditional tool installation.
# Outputs "nix=true", "playwright=true", "rules=true", "graph=true", and/or
# "go=true" to $GITHUB_OUTPUT when relevant files changed relative to the
# baseline resolve-diff-base.sh resolves (origin/main on a branch, HEAD^1 on a
# push to main).

# Baseline resolution is delegated to resolve-diff-base.sh, which fails loudly
# rather than substituting a base it cannot justify.
#
# --at-remote-tip first-parent: this script runs on pushes to `main` too, where
# actions/checkout leaves origin/main pointing AT the pushed commit. The
# `origin/main...HEAD` range this used to carry was then EMPTY, so every
# category went unset and the 29 `steps.changes.outputs.*` gates across this
# repo's workflows all read false — the post-merge run skipped everything.
#
# What was here before was a two-step fallback ladder: HEAD~1...HEAD on any
# origin/main failure, then `CHANGED=""` with a `::warning::`. Both rungs are
# deleted rather than converted. HEAD~1 answers a DIFFERENT question ("what did
# the last commit change"), and the empty-string rung turned an unresolvable
# baseline into a green run that installed no tools and ran no gated job —
# precisely the buried-error shape .claude/rules/code-style.md forbids. An
# unresolvable base is now a named non-zero exit, carrying the helper's own
# diagnostic.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT=$(git rev-parse --show-toplevel)
DIFF_BASE=$("$SCRIPT_DIR/resolve-diff-base.sh" --repo-root "$REPO_ROOT" --at-remote-tip first-parent)
if ! CHANGED=$(git -C "$REPO_ROOT" diff --name-only "$DIFF_BASE"..HEAD); then
  echo "::error::detect-changes: git diff ${DIFF_BASE}..HEAD failed in $REPO_ROOT"
  exit 1
fi

# EVERY category test below feeds $CHANGED to grep through a HERE-STRING, never
# through a pipe. `echo "$CHANGED" | grep -q ...` is a second vacuous-pass shape,
# and it is the one this script is most exposed to: `grep -q` exits at the FIRST
# match, closing the pipe while the writer is still writing. Once $CHANGED
# exceeds the 64 KiB pipe buffer the writer takes SIGPIPE, the pipeline's status
# under `set -o pipefail` becomes 141, and the `if` reads FALSE — on a diff that
# MATCHED. Measured: a 360 KB $CHANGED whose first line is `flake.nix` gives
# `pipeline rc=141` and leaves nix unset, while the here-string gives rc=0 and
# sets it. A repo-wide change set (a lockfile bump, a codemod) reaches that size
# routinely, so the bigger the change the more certain the gate is to skip.
# A here-string opens no pipe, so there is no reader to close it and no SIGPIPE
# to take. It also sidesteps `echo`'s backslash-escape interpretation entirely.
if grep -qE '^(nix/|flake\.nix$|flake\.lock$)' <<<"$CHANGED"; then
  echo "nix=true" >> "$GITHUB_OUTPUT"
fi
# playwright-version-sync re-runs when either side of the chromium pin moves —
# package-lock.json catches @playwright/test bumps, flake.lock catches nixpkgs
# playwright-driver bumps, and the script itself is included for self-edits.
if grep -qE '^(package-lock\.json$|flake\.lock$|\.github/scripts/check-playwright-version-sync\.sh$)' <<<"$CHANGED"; then
  echo "playwright=true" >> "$GITHUB_OUTPUT"
fi
# rules-test needs Java 21 for Firebase emulators. Set rules=true when rules-test
# would be detected as dirty: direct changes, or any global trigger from
# get-changed-apps.sh (those mark ALL workspaces dirty, including rules-test).
if grep -qE '^(firestore\.rules$|storage\.rules$|packages/rules-test/|\.claude/skills/dispatch-propagate/scripts/|firebase\.json$|package\.json$|package-lock\.json$)' <<<"$CHANGED"; then
  echo "rules=true" >> "$GITHUB_OUTPUT"
fi
# storybook-smoke boots the packages/ds Storybook dev server. Trigger on any
# packages/ds change (a component, story, token, or .storybook config edit can
# break the dev bundle) and on edits to the smoke script itself.
if grep -qE '^(packages/ds/|\.claude/skills/dispatch-propagate/scripts/run-storybook-smoke\.sh$)' <<<"$CHANGED"; then
  echo "ds=true" >> "$GITHUB_OUTPUT"
fi
# artifact-check builds the published claude artifacts and asserts the artifact
# contract plus a from-disk render smoke. Trigger on any artifacts/ change, on
# packages/ds (the artifact bundles DS from source, so a token or component edit
# changes what ships), on intentions/ (the plan view bakes the store in at build
# time, so a graph change changes the built page), and on the runner script
# itself.
if grep -qE '^(artifacts/|packages/ds/|intentions/|\.claude/skills/dispatch-propagate/scripts/run-artifact-check\.sh$)' <<<"$CHANGED"; then
  echo "artifact=true" >> "$GITHUB_OUTPUT"
fi
# dead-code check runs knip at repo root — any TS/JS/knip-config change can
# orphan code elsewhere, so trigger on any such change across the repo.
if grep -qE '\.(ts|tsx|js|jsx|mjs|cjs)$|^knip\.(json|jsonc|ts)$' <<<"$CHANGED"; then
  echo "deadcode=true" >> "$GITHUB_OUTPUT"
fi
# graph-validate runs validate-graph.ts, the rule set the graph write path's
# `guard` job runs. graph-fast-path.yml only triggers on graph/** pushes, so a
# change to the validator (or to the graph state it reads) is NOT exercised by
# the CI of the PR that makes it -- it first executes on the next unrelated
# writer's scratch branch, where a failure denies every graph write in the repo
# (the 2026-08-14 outage). Trigger on the package that owns the validator and on
# the graph state itself.
if grep -qE '^(packages/intentionsutil/|intentions/)' <<<"$CHANGED"; then
  echo "graph=true" >> "$GITHUB_OUTPUT"
fi
# go-tests needs the Go toolchain. Set go=true when a changed file is under a
# discovered Go module. list-go-modules.sh discovers module roots from go.mod
# locations, so a new Go module needs no edit here. The root go.work / go.work.sum
# files sit under no module prefix, yet they define the workspace every module
# builds in — a change to them must still run go-tests, so match them directly.
GO_MODULE_PREFIXES=$("$(dirname "$0")/list-go-modules.sh" | sed 's|$|/|')
GO_REGEX='^go\.work(\.sum)?$'
if [ -n "$GO_MODULE_PREFIXES" ]; then
  GO_REGEX="$GO_REGEX|^($(printf '%s\n' "$GO_MODULE_PREFIXES" | paste -sd'|' -))"
fi
if grep -qE "$GO_REGEX" <<<"$CHANGED"; then
  echo "go=true" >> "$GITHUB_OUTPUT"
fi
