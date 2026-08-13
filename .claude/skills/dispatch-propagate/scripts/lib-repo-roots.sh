#!/usr/bin/env bash
# lib-repo-roots.sh — sourceable helper for resolving the repo root and the
# worktree-root paths derived from it.
#
# THE `dirname` CONTRACT AND WHY IT EXISTS:
# `git rev-parse --path-format=absolute --git-common-dir` returns the path to
# the shared `.git` directory. Since the 2026-07-21 de-baring, this repo is a
# STANDARD checkout: `.git` is a normal directory living directly inside the
# working tree (the former `.bare`-keyed bare-repo layout is retired and
# historical). That means `--git-common-dir` resolves to `<repo-root>/.git`
# from ANY worktree of this repo, and the repo root is therefore the PARENT of
# that path — i.e. `dirname "$common_dir"`, never the common dir itself.
#
# Getting this backwards — anchoring at the common dir instead of its parent —
# produces a path like `<repo>/.git/.claude/worktrees`, which never exists.
# That exact mistake shipped independently in two of this file's three former
# call sites and silently broke them (the WorktreeRemove hook refused every
# removal it was ever asked to do; PR #3080). This file exists so the
# arithmetic is defined exactly once and cannot drift again.
#
# Usage: source this file, then call:
#   resolve_project_root       — prints the repo root
#   worktrees_root              — prints <repo-root>/.claude/worktrees
#   legacy_worktrees_root       — prints <repo-root>/worktrees (pre-migration)
#
# Each function returns non-zero and prints nothing if the repo root cannot be
# resolved (e.g. not in a git repo). None of them exit or print an error
# message — the caller supplies its own message/cleanup via `|| { … }`.
#
# Safe to source multiple times (include-guarded below). Does NOT use `set -e`
# / `set -u` at file scope — this is sourced into callers with their own
# settings (e.g. approve-workflow-commands.sh runs `set -uo pipefail` with an
# ERR trap that exits 0, and must keep passing through cleanly).

if [ -n "${_LIB_REPO_ROOTS_SH_SOURCED:-}" ]; then
  return 0 2>/dev/null || exit 0
fi
_LIB_REPO_ROOTS_SH_SOURCED=1

# Print the project root (parent of git --git-common-dir) to stdout.
# Returns non-zero if not in a git repo. Prints no error and does not exit —
# the caller supplies its own message/cleanup via `|| { … }`.
#
# The `[ -n "$common_dir" ]` guard is load-bearing, not belt-and-braces: the
# function's status would otherwise be `dirname`'s, and `dirname ""` prints `.`
# and exits 0. A git that succeeds while printing nothing would therefore hand
# every caller a RELATIVE `.` root that PASSES their non-empty fail-closed
# checks — approve-workflow-commands.sh would build `./worktrees` patterns, and
# worktree-remove.sh would mkdir a stray `./tmp` in whatever cwd the hook fired
# from instead of logging "keeping worktree". The open-coded call sites this
# file replaced all guarded with `[ -n "$GIT_COMMON_DIR" ]`; that guard moves
# here rather than being dropped.
resolve_project_root() {
  local common_dir
  common_dir="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" || return 1
  [ -n "$common_dir" ] || return 1
  dirname "$common_dir"
}

# Print <project-root>/.claude/worktrees — the current worktree-root
# placement (post-de-baring standard layout). Returns non-zero, printing
# nothing, if the project root cannot be resolved.
worktrees_root() {
  local root
  root="$(resolve_project_root)" || return 1
  printf '%s/.claude/worktrees\n' "$root"
}

# Print <project-root>/worktrees — the pre-migration worktree-root placement,
# still referenced by the approve-workflow-commands.sh hook during the
# create/remove-hook migration. Returns non-zero, printing nothing, if the
# project root cannot be resolved.
legacy_worktrees_root() {
  local root
  root="$(resolve_project_root)" || return 1
  printf '%s/worktrees\n' "$root"
}
