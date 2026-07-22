#!/usr/bin/env bash
# lib-graph-worktree.sh — sourceable helper: resolve the worktree with `main`
# checked out (substrate clarification 23: the graph-native project root).
#
# resolve_main_worktree [<git-dir>]
#   <git-dir> optional — run `git -C <git-dir> worktree list` instead of
#   relying on cwd already being inside the repo (graph-select-target passes
#   $REPO_ROOT since it may run from outside a worktree cwd; the other three
#   call sites omit it, relying on their own cwd).
#
# Honors DISPATCH_GRAPH_MAIN_WORKTREE, the shared test override, ahead of the
# real git worktree parse.
#
# Prints the resolved path on stdout and returns 0, or prints nothing and
# returns 1 if no worktree has `main` checked out. Never exits the caller's
# shell and does no existence (`-d`) check — each call site keeps its own
# existence check and its own error message, since those differ per site
# (hard error vs. soft fallback) and that difference is preserved, not fixed,
# by this refactor.
#
# Does NOT redirect its own stderr — the `git worktree list` call's stderr is
# left to inherit the caller's fd 2 normally. Two of the four call sites want
# it suppressed (they did before this refactor too); they redirect at the
# call site with `resolve_main_worktree 2>/dev/null` instead of this function
# hardcoding it, so the other two sites keep seeing git's stderr exactly as
# they did before this refactor.
resolve_main_worktree() {
  local git_dir="${1:-}"
  if [[ -n "${DISPATCH_GRAPH_MAIN_WORKTREE:-}" ]]; then
    printf '%s\n' "$DISPATCH_GRAPH_MAIN_WORKTREE"
    return 0
  fi
  local list wt
  if [[ -n "$git_dir" ]]; then
    list=$(git -C "$git_dir" worktree list --porcelain)
  else
    list=$(git worktree list --porcelain)
  fi
  wt=$(awk '/^worktree /{wt=substr($0,10)} /^branch refs\/heads\/main$/{if(!f){print wt; f=1}}' <<<"$list")
  [[ -n "$wt" ]] || return 1
  printf '%s\n' "$wt"
}
