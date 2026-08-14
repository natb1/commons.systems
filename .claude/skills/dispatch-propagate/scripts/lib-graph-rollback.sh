# lib-graph-rollback.sh — the ONE rollback for a graph writer whose on-disk
# node write did not land.
#
# Every graph writer mutates intentions/<id>.md in the MAIN checkout's working
# tree first and lands it with a separate `graph-commit`. When that commit does
# not land, the mutated file is left dirty — and that is not just the failing
# writer's problem. graph-commit's assert_clean_outside_ids refuses to START
# whenever a tracked file outside the call's own node set is dirty, so ONE
# leaked write denies service to every graph writer in that checkout until a
# human clears it. The blast radius is the checkout, not the node.
#
# This file exists because that rollback had been re-derived per writer and the
# copies drifted. reconcile-graph-merged grew the correct one; its siblings kept
# an earlier, subtly wrong idiom (restore a captured origin/main blob) or none at
# all. graph_rollback_node_writes() below is reconcile-graph-merged's version,
# extracted verbatim and parameterized by <label>. New writers call it; they do
# not re-derive it.
#
# Usage (source it, then call after a failed land):
#   source "$SCRIPT_DIR/lib-graph-rollback.sh"
#   HEAD_AT_ARM="$(git -C "$REPO_ROOT" rev-parse HEAD)"   # BEFORE the write
#   ... mutate intentions/<id>.md ...
#   if ! graph-commit ...; then
#     graph_rollback_node_writes "$REPO_ROOT" "$HEAD_AT_ARM" my-script "$id"
#   fi
#
# No `source` of any other file: this library is copied standalone into test
# fixtures, exactly as lib.sh is.

# Roll a writer's disk mutations back to the checkout's CURRENT HEAD — not to a
# captured blob. Restoring captured bytes is wrong on graph-commit's park path:
# park_and_exit() does `git reset --hard FETCH_HEAD`, lands an office_hours
# park, and exits non-zero, so HEAD has MOVED. Writing pre-park bytes back would
# leave the tree dirty with stale, park-erased content — the shared-checkout
# residue that bricks graph-commit's assert_clean_outside_ids guard for every
# other writer, and that re-erases the very park the land just recorded. It is
# equally wrong when the checkout sits BEHIND origin/main: an origin/main-blob
# restore then writes bytes over files whose HEAD version differs, leaving them
# dirty. Precedent: resolve-hold's clean_node_file(), same guard, same reason.
#
# But `checkout --` is NOT a universal rollback, because HEAD moving does not
# always mean the write landed. graph-commit runs commit_files() BEFORE land()
# (packages/intentionsutil/scripts/graph-commit:770-777) and, on rc 11 — landing
# lock never acquired, scratch push failed, required checks never green, or main
# advanced through every MAX_PUSH_ATTEMPTS — exits 1 with no reset
# (graph-commit:1954-1957). HEAD then carries the writer's un-landed,
# un-CAS-checked mutation, and `checkout --` would restore each node file to that
# MUTATED content: a no-op dressed up as a rollback. Worse, graph-commit pushes
# HEAD rather than just the node it names, so the next unrelated graph-commit
# from this shared checkout would rebase and push the stranded commit to main — a
# write that never passed check_base_freshness.
#
# So classify HEAD before restoring, and never report a rollback that did not
# happen:
#   - HEAD unmoved                 → checkout -- (the ordinary rollback).
#   - HEAD moved, nothing unpushed → graph-commit landed what it moved to (its
#                                    pushed park path); checkout -- is a no-op
#                                    that preserves it.
#   - HEAD moved, unpushed commits that are all graph-commit PARK commits
#                                  → keep them (an unpushed park is a record a
#                                    human still needs) and say so loudly.
#   - HEAD moved, any unpushed NON-park commit → that is the escaped write.
#                                    Discard it by resetting to <head-at-arm>
#                                    when that is safe, else refuse loudly.
#
# graph_rollback_node_writes <repo-root> <head-at-arm> <label> <id>...
#   <head-at-arm> is HEAD as of the moment the rollback was armed — the exact
#   commit the mutation sits on top of, and the only commit `git checkout --` can
#   be trusted to restore to. Pass "" only when it genuinely could not be read;
#   the moved-HEAD classification is then skipped.
#   <label> prefixes every diagnostic (the calling script's name).
graph_rollback_node_writes() {
  local repo_root="$1" head_at_arm="$2" label="$3"
  shift 3
  local -a ids=("$@")
  local sid head_now
  head_now="$(git -C "$repo_root" rev-parse HEAD 2>/dev/null)" || {
    echo "$label: cannot read HEAD — the node write(s) were NOT rolled back; inspect intentions/ by hand" >&2
    return 1
  }
  if [[ -n "$head_at_arm" && "$head_now" != "$head_at_arm" ]]; then
    local rl_out
    if ! rl_out="$(git -C "$repo_root" rev-list origin/main..HEAD 2>&1)"; then
      echo "$label: HEAD moved to ${head_now:0:8} during the write and origin/main is unreadable ($rl_out) — the node write(s) were NOT rolled back; inspect by hand before any other graph-commit runs from this checkout" >&2
      return 1
    fi
    local -a unpushed=() nonpark=()
    [[ -n "$rl_out" ]] && mapfile -t unpushed <<<"$rl_out"
    local sha
    for sha in "${unpushed[@]}"; do
      # park_and_exit()'s commit subject is `graph: park <ids> (...)`; anything
      # else on top of origin/main is the writer's own un-landed content commit.
      [[ "$(git -C "$repo_root" log -1 --format=%s "$sha")" == 'graph: park '* ]] || nonpark+=("$sha")
    done
    if [[ "${#nonpark[@]}" -gt 0 ]]; then
      # Either the stranded commit is dropped (the tree is back at
      # <head-at-arm>, nothing left to check out) or the refusal was reported —
      # either way the `checkout --` below must not run and must not be claimed.
      _graph_discard_stranded_commits "$repo_root" "$head_at_arm" "$label" "${nonpark[@]}"
      return $?
    fi
    if [[ "${#unpushed[@]}" -gt 0 ]]; then
      echo "$label: graph-commit's park commit ${unpushed[0]:0:8} is not on the local origin/main ref — treat the park as possibly unpushed; the node files are restored to HEAD, which KEEPS it" >&2
    fi
  fi
  local rc=0
  for sid in "${ids[@]}"; do
    git -C "$repo_root" checkout -- "intentions/$sid.md" || {
      echo "$label: rollback could not restore intentions/$sid.md to HEAD" >&2
      rc=1
    }
  done
  echo "$label: rolled the node write(s) back to HEAD ${head_now:0:8}" >&2
  return $rc
}

# Drop the un-landed commit(s) graph-commit left on HEAD, restoring the checkout
# to the state the writer found. Only safe when HEAD still descends from
# <head-at-arm> and every stranded commit is a single-parent, intentions/-only
# commit — i.e. unmistakably this writer's own write and not some other process's
# work in the shared checkout. When it is not safe, refuse loudly: leaving the
# commit with a warning that names it beats both silently stranding it and
# destroying someone else's commit.
#
# _graph_discard_stranded_commits <repo-root> <head-at-arm> <label> <sha>...
_graph_discard_stranded_commits() {
  local repo_root="$1" head_at_arm="$2" label="$3"
  shift 3
  local -a stranded=("$@")
  local unsafe=0 sha parents files
  git -C "$repo_root" merge-base --is-ancestor "$head_at_arm" HEAD || unsafe=1
  for sha in "${stranded[@]}"; do
    parents="$(git -C "$repo_root" log -1 --format=%P "$sha" | wc -w)"
    [[ "$parents" -eq 1 ]] || unsafe=1
    files="$(git -C "$repo_root" show --name-only --format= "$sha")"
    [[ -n "$files" ]] || unsafe=1
    grep -qv '^intentions/' <<<"$files" && unsafe=1
  done
  if [[ "$unsafe" -eq 0 ]] && git -C "$repo_root" reset -q --hard "$head_at_arm"; then
    echo "$label: graph-commit committed but never landed ${#stranded[@]} commit(s) (${stranded[0]:0:8}) — discarded by resetting to ${head_at_arm:0:8}; NOTHING was written to main" >&2
    return 0
  fi
  echo "$label: graph-commit left un-landed commit(s) on HEAD (${stranded[0]}) that never passed check_base_freshness, and they are NOT safely discardable — the write was NOT rolled back. Drop them by hand before any other graph-commit runs from this checkout: it pushes HEAD, not just the node it names" >&2
  return 1
}
