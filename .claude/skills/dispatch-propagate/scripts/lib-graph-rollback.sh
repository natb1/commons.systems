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
#   export GRAPH_WRITER=my-script                        # SAME string as <label>
#   HEAD_AT_ARM="$(git -C "$REPO_ROOT" rev-parse HEAD)"   # BEFORE the write
#   ... mutate intentions/<id>.md ...
#   if ! graph-commit ...; then
#     graph_rollback_node_writes "$REPO_ROOT" "$HEAD_AT_ARM" my-script "$id"
#   fi
#
# `export GRAPH_WRITER` is not optional bookkeeping — it is what makes this
# writer's own commits recognisable as its own. graph-commit stamps that string
# as a `Graph-Writer:` trailer; the <label> argument below is compared against
# it. A caller that omits the export gets its commits stamped with
# graph-commit's default and this rollback then classifies them as ANOTHER
# writer's, which is safe (they are kept) but leaves them stranded on HEAD.
#
# EXPORT IT ONLY IF THE CALLER RUNS NO OTHER GRAPH WRITER AS A CHILD.
# `export` puts the label in every child process's environment, and
# graph-commit reads it from there. A caller that also invokes hold-node,
# park-node, or any other tool that lands its own graph-commit would stamp
# THAT tool's commit with the caller's label too — and a concurrent instance
# of the caller would then read the stranded hold/park commit as `mine` and
# discard it, widening the same-script gap below from one tool to three.
# Such a caller sets the label PER INVOCATION on the commands that land its
# own writes (`GRAPH_WRITER=<label> graph-commit …`), or strips it from the
# child (`env -u GRAPH_WRITER <tool> …`), instead of exporting it.
# graph-select-target and reconcile-graph-review-stall both do this.
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
# happen. "Unpushed" below means unpushed AND ABOVE <head-at-arm> — the exact
# set `reset --mixed <head-at-arm>` would drop. An unpushed commit BELOW
# <head-at-arm> is out of the rewind's reach and so is none of this function's
# business; classifying it could only manufacture a refusal that strands our own
# escaped write (see the rev-list note in the body):
#   - HEAD unmoved                 → checkout -- (the ordinary rollback).
#   - HEAD moved, nothing unpushed → graph-commit landed what it moved to (its
#                                    pushed park path); checkout -- is a no-op
#                                    that preserves it.
#   - HEAD moved, unpushed commits that are all graph-commit PARK commits
#                                  → keep them (an unpushed park is a record a
#                                    human still needs) and say so loudly. A
#                                    park in that range also BLOCKS the discard
#                                    below, for exactly the reason a foreign
#                                    commit does: the rewind drops EVERY commit
#                                    above <head-at-arm>, park included.
#   - HEAD moved, unpushed NON-park commits attributed to ANOTHER writer
#                                  → not ours to touch. Keep them and restore
#                                    only our own node files to HEAD.
#   - HEAD moved, unpushed NON-park commits carrying NO attribution
#                                  → REFUSE. See the fail-closed note below.
#   - HEAD moved, unpushed NON-park commits attributed to US → that is the
#                                    escaped write. Discard it by rewinding to
#                                    <head-at-arm> and restoring the paths it
#                                    touched when that is safe — which means
#                                    NOTHING ELSE shares that range: no other
#                                    writer's commit, and no park. Else refuse
#                                    loudly.
#
# WHY ATTRIBUTION, AND WHY IT FAILS CLOSED.
# The intentions/-only + single-parent gate in _graph_discard_stranded_commits
# CANNOT TELL TWO CONCURRENT GRAPH WRITERS APART: both produce single-parent,
# intentions/-only commits with a `graph: …` subject, so a peer writer's commit
# landed into this shared checkout while we were planning read as OUR stranded
# write and was reset away. graph-commit now stamps every commit it makes with a
# `Graph-Writer: <label>` trailer (see GRAPH_WRITER_LABEL in
# packages/intentionsutil/scripts/graph-commit), and <label> here is compared
# against it. A caller gets its own commits attributed by exporting
# GRAPH_WRITER=<the same label> before it invokes graph-commit.
#
# WHAT THE LABEL DOES NOT ANSWER. It identifies the WRITER SCRIPT, not the
# invocation, so it discriminates CROSS-SCRIPT peers and only those:
# reconcile-graph-merged tells graph-select-target's commit from its own. TWO
# CONCURRENT INVOCATIONS OF THE SAME SCRIPT — the tick's
# `reconcile-graph-merged` and /dispatch-ladder's `reconcile-graph-merged
# --node`, say — stamp the SAME label, so each still reads the other's commit as
# `mine` and the pre-attribution destruction is unchanged for that pair. The
# overlap is reachable, not theoretical: every call site takes the same
# `dispatch-acquire-lock` selection lock, but that lock is stale-reclaimable
# once the holder's heartbeat is older than DISPATCH_LOCK_MAX_HOLD_SECONDS
# (default 300s) and neither reconciler heartbeats inside its own run, which
# dispatch-tick budgets at up to 600s. A genuine per-INVOCATION identity would
# change the trailer format and every reader of it, so it is deliberately not
# attempted here — but do not read the attribution as covering that case.
#
# An UNATTRIBUTED commit is treated as `unknown` and REFUSED (rc 1), never
# discarded. Every graph commit made before the trailer shipped carries none, as
# does every hand-made commit and every stale worktree's leftovers — and the
# destructive leg cannot tell those from our own un-landed write. Falling through
# to the discard on `unknown` would simply reinstate the behaviour this
# classification replaces, so the unknown case refuses and says what to inspect.
# The cost of refusing wrongly is a dirty tree and a loud message; the cost of
# discarding wrongly is another writer's committed work, unrecoverably.
#
# ATTRIBUTION AND THE PARK SUBJECT ANSWER DIFFERENT QUESTIONS, and the park test
# is asked FIRST. Attribution answers "is this commit mine"; the subject answers
# "is this a park". graph-commit makes the park commit on the caller's behalf, so
# a park may legitimately carry EITHER the caller's label or graph-commit's own
# default — and a park is kept in both cases, because an unpushed park is a
# record a human still needs whoever made it. Never collapse the two tests.
#
# graph_rollback_node_writes <repo-root> <head-at-arm> <label> <id>...
#   <head-at-arm> is HEAD as of the moment the rollback was armed — the exact
#   commit the mutation sits on top of, and the only commit `git checkout --` can
#   be trusted to restore to. Pass "" only when it genuinely could not be read;
#   the moved-HEAD classification is then skipped.
#   <label> prefixes every diagnostic (the calling script's name).
#   <id>... is the set of nodes this writer actually mutated. NO ids means no
#   write happened, and the call is a silent no-op (see the guard at the top of
#   the body).
# _graph_commit_writer <repo-root> <sha> — print <sha>'s `Graph-Writer`
# attribution, or NOTHING when it carries none (every commit made before the
# trailer shipped, every hand-made commit, every other tool's commit).
#
# Read through git's own trailer parser (`%(trailers:key=…)`) rather than by
# grepping the body: the parser only accepts a well-formed trailer in the
# message's trailing block, so a `Graph-Writer:` string quoted inside a node
# body that happened to reach a commit message cannot forge an attribution.
# `head -n1` because a malformed message could carry two; the first wins and the
# comparison then simply fails to match, which is the safe direction.
_graph_commit_writer() {
  git -C "$1" log -1 --format='%(trailers:key=Graph-Writer,valueonly)' "$2" 2>/dev/null \
    | head -n1 | tr -d '[:space:]'
}

# _graph_restore_ids_to_head <repo-root> <label> <id>... — bring each of THIS
# writer's own node files back to HEAD's content.
#
# `checkout HEAD --`, never a bare `checkout --`. A bare `checkout -- <path>`
# restores from the INDEX, and graph-commit `git add`s each node file before
# `assert_staged_safe` and `git commit`, and its `cleanup()` never unstages. So
# on any die between the add and a successful commit — a missing git identity,
# a `.githooks` pre-commit refusal, the staged-set guard — the index holds the
# MUTATION, and the bare form copies those bytes back and reports success. The
# leak then bricks `assert_clean_outside_ids` for every other writer in the
# shared checkout, while this function's own claim says the tree is clean: the
# exact claim-outruns-evidence failure the rest of this file exists to remove.
# `HEAD` names the source explicitly and is immune to what is staged. Non-destructive to every
# peer: it touches only the ids this writer pinned, moves no commit, and
# writes no path outside intentions/<id>.md. rc 1 when any restore failed.
_graph_restore_ids_to_head() {
  local repo_root="$1" label="$2"
  shift 2
  local sid rc=0
  for sid in "$@"; do
    git -C "$repo_root" checkout HEAD -- "intentions/$sid.md" || {
      echo "$label: rollback could not restore intentions/$sid.md to HEAD" >&2
      rc=1
    }
  done
  return $rc
}

# _graph_restore_and_claim <repo-root> <label> <id>... — restore this writer's
# own node files to HEAD and set the sentence the caller must splice into its
# operator message. Sets _GRAPH_RESTORE_RC (the restore's status) and
# _GRAPH_RESTORE_CLAIM (the sentence). Sets, rather than prints, so a caller
# can read the rc — a command substitution would run it in a subshell and lose
# it, which is the same evidence-discarding this exists to stop.
#
# EVERY exit from graph_rollback_node_writes owes this, the refusals included.
# A refusal is about the DESTRUCTIVE leg — the rewind — and nothing else: the
# per-id `git checkout --` touches only the ids THIS writer pinned, moves no
# commit, and cannot reach a peer's work. Skipping it buys the refusal nothing
# and leaves this writer's node file dirty in the SHARED checkout, which trips
# graph-commit's assert_clean_outside_ids for EVERY other writer there — the
# checkout-wide outage this file exists to prevent, inflicted by the guard
# instead of by the leak.
#
# The sentence is rc-conditional because it makes a CLAIM about the shared
# checkout's cleanliness and may not outrun its evidence. An operator told "not
# left dirty" by a FAILED restore stops looking, while the next graph-commit
# from that checkout trips assert_clean_outside_ids for everyone. That is the
# same false-claim class this guard exists to remove, so the rc decides which
# half of the claim is printed.
_GRAPH_RESTORE_RC=0
_GRAPH_RESTORE_CLAIM=""
# Set by _graph_discard_stranded_commits when its rewind TORE — reset --mixed
# succeeded, so HEAD moved and the commits are gone, but a per-path restore
# then failed and those paths still hold discarded content. The discard's own
# non-zero rc cannot carry this: a refusal returns the same 1, and after a
# refusal NOTHING was touched. The two need opposite claims about the shared
# checkout, so the distinction has to leave the function as its own flag.
_GRAPH_DISCARD_TORN=0
_graph_restore_and_claim() {
  local repo_root="$1" label="$2"
  shift 2
  _GRAPH_RESTORE_RC=0
  _graph_restore_ids_to_head "$repo_root" "$label" "$@" || _GRAPH_RESTORE_RC=$?
  if (( _GRAPH_RESTORE_RC == 0 )); then
    _GRAPH_RESTORE_CLAIM="This writer's own node file(s) WERE restored to HEAD, so the shared checkout is not left dirty for every other graph writer."
  else
    _GRAPH_RESTORE_CLAIM="This writer's own node file(s) could NOT be restored to HEAD (the restore exited $_GRAPH_RESTORE_RC), so the shared checkout IS LEFT DIRTY and the next graph-commit from it will trip assert_clean_outside_ids for every other graph writer — restore them by hand FIRST."
  fi
}

graph_rollback_node_writes() {
  local repo_root="$1" head_at_arm="$2" label="$3"
  shift 3
  local -a ids=("$@")
  # NO IDS => NOTHING WAS WRITTEN => NOTHING TO ROLL BACK, and nothing to say.
  # A zero-write call used to walk the whole classification and then print
  # "rolled the node write(s) back to HEAD" over an empty id loop — a claim that
  # is simply false in the journal, and the reason reconcile-graph-merged's
  # empty-plan early exit had to disarm its EXIT trap by hand before exiting.
  # The guard belongs HERE, not in each caller: reconcile-graph-review-stall
  # already carried its own copy (`[[ ${#WRITTEN_IDS[@]} -gt 0 ]] || return 0`),
  # which is exactly the per-writer re-derivation this library exists to end.
  #
  # This is a CLAIM guard, not a safety one. What makes a zero-write trap safe
  # is the `Graph-Writer:` attribution below, which refuses to read another
  # writer's commit as this sweep's stranded write. Both are needed and neither
  # substitutes for the other — a sweep that DID write is not covered by this
  # guard at all, and that is the larger half of the surface.
  [[ "${#ids[@]}" -gt 0 ]] || return 0
  local head_now
  head_now="$(git -C "$repo_root" rev-parse HEAD 2>/dev/null)" || {
    echo "$label: cannot read HEAD — the node write(s) were NOT rolled back; inspect intentions/ by hand" >&2
    return 1
  }
  if [[ -n "$head_at_arm" && "$head_now" != "$head_at_arm" ]]; then
    local rl_out
    # CLASSIFY EXACTLY THE COMMITS THE REWIND COULD DROP, AND NO OTHERS.
    # The only destructive act below is `reset --mixed <head-at-arm>`, which
    # drops `<head-at-arm>..HEAD` and cannot reach anything at or below
    # <head-at-arm>. `origin/main..HEAD` is a STRICTLY WIDER range than that: it
    # also spans every unpushed commit BELOW <head-at-arm> — a pre-trailer
    # leftover, a stale worktree's residue, a hand-made commit. Classifying
    # those forced the unattributed/foreign refusal over a commit this function
    # could not have destroyed even if it tried, and the refusal is not free: it
    # leaves OUR OWN escaped write committed on HEAD for the next graph-commit
    # to push, and our node file dirty — which bricks graph-commit's
    # assert_clean_outside_ids for every writer in the checkout. The
    # pre-attribution code handled that case correctly; keeping the range
    # narrow is what keeps it correct.
    #
    # `HEAD --not origin/main <head-at-arm>` is that set minus everything
    # <head-at-arm> already reaches. What it yields is the UNPUSHED part of the
    # rewind's blast radius — NOT the whole of it, and the difference is a real
    # residual rather than a rounding error. `reset --mixed <head-at-arm>` drops
    # EVERY commit in `<head-at-arm>..HEAD`; this rev-list classifies only those
    # of them that origin/main cannot reach. A commit above <head-at-arm> that
    # IS reachable from origin/main — a peer's commit pulled in by graph-commit's
    # own `git pull --rebase` mid-write, say — is therefore EXCLUDED from
    # classification and yet still DROPPED by the rewind, leaving the local
    # branch behind origin/main and that commit's files (the ones outside the
    # restored intentions/ paths) reading as modified. Excluding it is
    # deliberate — it is on origin/main, so it is not lost, and classifying it
    # could only manufacture the refusal the paragraph above exists to avoid —
    # but do not read this rev-list as proof that the rewind touches nothing
    # else. It is not, and the recovery for that residual is a plain
    # fetch/reset, not anything this function does.
    #
    # <head-at-arm> is an EXCLUDE, not a range endpoint, so a <head-at-arm> that
    # is NOT an ancestor of HEAD still yields a well-defined set — and the
    # `merge-base --is-ancestor` gate in _graph_discard_stranded_commits is what
    # refuses that shape, not this rev-list.
    if ! rl_out="$(git -C "$repo_root" rev-list HEAD --not origin/main "$head_at_arm" 2>&1)"; then
      echo "$label: HEAD moved to ${head_now:0:8} during the write and origin/main or ${head_at_arm:0:8} is unreadable ($rl_out) — the node write(s) were NOT rolled back; inspect by hand before any other graph-commit runs from this checkout" >&2
      return 1
    fi
    local -a unpushed=() parks=() mine=() foreign=() unattributed=()
    [[ -n "$rl_out" ]] && mapfile -t unpushed <<<"$rl_out"
    local sha writer
    for sha in "${unpushed[@]}"; do
      # THE PARK TEST COMES FIRST, and is asked of the SUBJECT alone.
      # park_and_exit()'s commit subject is `graph: park <ids> (...)` — since
      # the per-id park partition it may carry further `; land …` / `; prune …`
      # clauses, which is why this is a PREFIX test and not an equality one.
      # graph-commit makes that commit on the caller's behalf, so its
      # attribution may be the caller's label or graph-commit's own default; a
      # park is kept either way (see the header).
      if [[ "$(git -C "$repo_root" log -1 --format=%s "$sha")" == 'graph: park '* ]]; then
        parks+=("$sha")
        continue
      fi
      # Anything else on top of origin/main is SOME writer's un-landed content
      # commit. Whose, is exactly what the attribution answers.
      writer="$(_graph_commit_writer "$repo_root" "$sha")"
      if [[ -z "$writer" ]]; then
        unattributed+=("$sha")
      elif [[ "$writer" == "$label" ]]; then
        mine+=("$sha")
      else
        foreign+=("$sha")
      fi
    done
    # Fail closed on unknown: an unattributed commit may be our own un-landed
    # write (which `checkout --` would "roll back" as a no-op, stranding it for
    # the next graph-commit to push) or another process's work (which the
    # discard would destroy). Nothing here can tell them apart, so nothing here
    # touches the tree.
    if [[ "${#unattributed[@]}" -gt 0 ]]; then
      # ORDER MATTERS: restore, THEN refuse. The refusal is about the
      # DESTRUCTIVE leg only — nothing here may discard a commit it cannot
      # attribute. The per-id `git checkout --` is NOT that leg: it touches
      # only the ids THIS writer pinned, moves no commit, and cannot reach a
      # peer's work. Refusing above it also aborted the case where NOTHING on
      # HEAD is ours and the discard could not have run at all, leaving this
      # writer's node file dirty in the SHARED main checkout — which trips
      # graph-commit's assert_clean_outside_ids for EVERY other writer there.
      # That is the checkout-wide outage this file exists to prevent, inflicted
      # by the guard instead of by the leak. The header accepts "a dirty tree
      # and a loud message" as the price of refusing wrongly; it does not
      # contemplate that dirty tree denying service to everyone else, and
      # skipping the restore buys the refusal nothing.
      # The message below makes a CLAIM about the shared checkout's cleanliness,
      # and _graph_restore_and_claim is what keeps that claim tied to its
      # evidence — see its header for why the sentence is rc-conditional.
      _graph_restore_and_claim "$repo_root" "$label" "${ids[@]}"
      echo "$label: HEAD carries ${#unattributed[@]} unpushed commit(s) with NO Graph-Writer attribution (${unattributed[0]}) — this rollback cannot tell its own un-landed write from another process's work, so NOTHING was discarded and the commit(s) are LEFT on HEAD. $_GRAPH_RESTORE_CLAIM Inspect the commit(s) by hand before any other graph-commit runs from this checkout: it pushes HEAD, not just the node it names" >&2
      return 1
    fi
    if [[ "${#mine[@]}" -gt 0 ]]; then
      # The discard rewinds to <head-at-arm>, which drops EVERY commit above it
      # — not only the ones the gate inspected. So ANYTHING in that range that
      # is not ours to destroy makes the rewind unsafe, no matter how clean our
      # own stranded commits look. There are TWO such things, and each gets its
      # own refusal because the operator's next move differs.
      #
      # (a) another writer's content commit. Refuse rather than trade one
      #     writer's leak for another writer's loss.
      if [[ "${#foreign[@]}" -gt 0 ]]; then
        # Restore, THEN refuse — the same ordering the unattributed arm above
        # obeys, and for the same reason: what is refused here is the REWIND.
        _graph_restore_and_claim "$repo_root" "$label" "${ids[@]}"
        echo "$label: HEAD carries this writer's un-landed commit(s) (${mine[0]:0:8}) BELOW or beside another writer's commit(s) (${foreign[0]:0:8}, Graph-Writer: $(_graph_commit_writer "$repo_root" "${foreign[0]}")) — rewinding to ${head_at_arm:0:8} would destroy the other writer's work, so NOTHING was discarded and this writer's commit(s) are LEFT on HEAD. $_GRAPH_RESTORE_CLAIM Drop this writer's commit(s) by hand before any other graph-commit runs from this checkout" >&2
        return 1
      fi
      # (b) a PARK commit. The park test above routes it out of `foreign` on
      #     purpose — a park is KEPT whoever made it, including one graph-commit
      #     made for US — but "kept" is a claim about the rewind too, and
      #     `reset --mixed` cannot spare it: it drops every commit above
      #     <head-at-arm> indiscriminately. Discarding here would erase the
      #     office_hours record this file's header promises to preserve, which
      #     is the whole reason the park arm exists. Kept commits and
      #     discardable ones cannot share one rewind, so refuse.
      if [[ "${#parks[@]}" -gt 0 ]]; then
        # Restore, THEN refuse — as in arm (a). Keeping the park is a claim
        # about the REWIND; it says nothing about this writer's own files.
        _graph_restore_and_claim "$repo_root" "$label" "${ids[@]}"
        echo "$label: HEAD carries this writer's un-landed commit(s) (${mine[0]:0:8}) BELOW or beside an unpushed graph-commit park commit (${parks[0]:0:8}) — rewinding to ${head_at_arm:0:8} would erase a park record a human still needs whoever made it, so NOTHING was discarded and this writer's commit(s) are LEFT on HEAD. $_GRAPH_RESTORE_CLAIM Drop this writer's commit(s) by hand before any other graph-commit runs from this checkout: it pushes HEAD, not just the node it names" >&2
        return 1
      fi
      # On SUCCESS the discard leg has already restored the paths its own
      # rewind touched, so the terminal `checkout HEAD --` below must not run
      # and must not be claimed for it. On FAILURE it has not: it either
      # refused before touching anything, or tore part-way. Neither of those
      # restores this writer's own ids, so the "EVERY exit owes a claim"
      # contract applies to the failure path exactly as it does to the two
      # refusals above — which restore first and then return, because refusing
      # the rewind is not a reason to leave this writer's own file dirty for
      # every other writer in the checkout.
      local discard_rc=0
      _graph_discard_stranded_commits "$repo_root" "$head_at_arm" "$label" "${mine[@]}" || discard_rc=$?
      if [[ "$discard_rc" -ne 0 ]]; then
        _graph_restore_and_claim "$repo_root" "$label" "${ids[@]}"
        # A TORN rewind and a REFUSED one both arrive here with rc 1, but the
        # success claim is only true of the refusal. After a tear the message
        # one line above has just said the touched intentions/ path(s) still
        # hold discarded content — those are paths this writer's ids do not
        # cover, so restoring the ids cannot make the checkout clean, and
        # printing "not left dirty for every other graph writer" would deny in
        # one sentence what the previous sentence asserted. The operator who
        # believes it stops looking, and the next graph-commit from that
        # checkout trips assert_clean_outside_ids for everyone.
        if [[ "$_GRAPH_DISCARD_TORN" -eq 1 && "$_GRAPH_RESTORE_RC" -eq 0 ]]; then
          echo "$label: This writer's own node file(s) WERE restored to HEAD, but the torn rewind above left OTHER intentions/ path(s) holding discarded content, so the shared checkout IS STILL DIRTY and the next graph-commit from it will trip assert_clean_outside_ids for every other graph writer — restore the path(s) named above by hand FIRST." >&2
        else
          echo "$label: $_GRAPH_RESTORE_CLAIM" >&2
        fi
      fi
      return $discard_rc
    fi
    # Nothing above <head-at-arm> is ours. Everything there is KEPT, and the
    # per-id `checkout --` below restores only our own node files to HEAD — it
    # touches no commit and no other writer's paths.
    if [[ "${#foreign[@]}" -gt 0 ]]; then
      echo "$label: another graph writer's unpushed commit ${foreign[0]:0:8} (Graph-Writer: $(_graph_commit_writer "$repo_root" "${foreign[0]}")) is on HEAD — it is NOT this sweep's stranded write and is KEPT; only this sweep's own node file(s) are restored to HEAD" >&2
    fi
    if [[ "${#parks[@]}" -gt 0 ]]; then
      echo "$label: graph-commit's park commit ${parks[0]:0:8} is not on the local origin/main ref — treat the park as possibly unpushed; the node files are restored to HEAD, which KEEPS it" >&2
    fi
  fi
  # The success line is a CLAIM that the rollback happened, and the one caller
  # that would carry a non-zero rc onward discards it (`graph-select-target`'s
  # `|| true`), so this line is the only signal an operator ever sees. It may
  # not outrun its evidence either.
  _graph_restore_and_claim "$repo_root" "$label" "${ids[@]}"
  if (( _GRAPH_RESTORE_RC == 0 )); then
    echo "$label: rolled the node write(s) back to HEAD ${head_now:0:8}" >&2
  else
    echo "$label: could NOT roll the node write(s) back to HEAD ${head_now:0:8}. $_GRAPH_RESTORE_CLAIM" >&2
  fi
  return $_GRAPH_RESTORE_RC
}

# Drop the un-landed commit(s) graph-commit left on HEAD, restoring the checkout
# to the state the writer found. Only safe when HEAD still descends from
# <head-at-arm> and every stranded commit is a single-parent, intentions/-only
# commit. When it is not safe, refuse loudly: leaving the commit with a warning
# that names it beats both silently stranding it and destroying someone else's
# commit.
#
# WHO the commit belongs to is NOT decided here and never was decidable here:
# a peer graph writer's commit is single-parent and intentions/-only too, so
# these checks passed it just as readily. Ownership is settled by the
# `Graph-Writer:` attribution in graph_rollback_node_writes() above, which only
# reaches this function with commits it has already proved are the caller's own
# — and refuses outright when any commit above <head-at-arm> is another
# writer's or carries no attribution at all. What remains here is the SHAPE
# gate: are these commits the kind graph-commit makes, and does the rewind
# target still lie on HEAD's history.
#
# The gate's subject and the discard's subject are NOT the same thing, and
# conflating them is how this destroyed unrelated work. The gate proves the
# stranded COMMITS are safe to drop; it says nothing about the rest of the
# checkout. `git reset --hard` acts on the whole working tree, so a stray
# uncommitted `M flake.lock` in the shared main checkout — the very residue the
# writers were taught to tolerate rather than destroy — was wiped with no
# warning and no record. So the discard is scoped to the PATHS the gate has
# already proved: HEAD and the index move back to <head-at-arm> (`--mixed`,
# which never touches the working tree), and only the intentions/ paths those
# commits touched are brought back to <head-at-arm>'s content. Every other file
# in the checkout is left exactly as found.
#
# _graph_discard_stranded_commits <repo-root> <head-at-arm> <label> <sha>...
_graph_discard_stranded_commits() {
  local repo_root="$1" head_at_arm="$2" label="$3"
  shift 3
  local -a stranded=("$@")
  _GRAPH_DISCARD_TORN=0
  local unsafe=0 sha parents files path p seen
  local -a touched=()
  git -C "$repo_root" merge-base --is-ancestor "$head_at_arm" HEAD || unsafe=1
  for sha in "${stranded[@]}"; do
    parents="$(git -C "$repo_root" log -1 --format=%P "$sha" | wc -w)"
    [[ "$parents" -eq 1 ]] || unsafe=1
    files="$(git -C "$repo_root" show --name-only --format= "$sha")"
    [[ -n "$files" ]] || unsafe=1
    grep -qv '^intentions/' <<<"$files" && unsafe=1
    # Collect exactly what the gate just inspected: the discard restores these
    # paths and nothing else. Deduplicated — two stranded commits may touch the
    # same node, and the count is reported to the operator below.
    while IFS= read -r path; do
      [[ -n "$path" ]] || continue
      seen=0
      for p in "${touched[@]}"; do
        [[ "$p" == "$path" ]] && { seen=1; break; }
      done
      [[ "$seen" -eq 1 ]] || touched+=("$path")
    done <<<"$files"
  done
  local restore_rc=0
  if [[ "$unsafe" -eq 0 ]]; then
    _graph_restore_paths_to_rev "$repo_root" "$head_at_arm" "${touched[@]}" || restore_rc=$?
    if [[ "$restore_rc" -eq 0 ]]; then
      echo "$label: graph-commit committed but never landed ${#stranded[@]} commit(s) (${stranded[0]:0:8}) — discarded by moving HEAD back to ${head_at_arm:0:8} and restoring only the ${#touched[@]} intentions/ path(s) they touched; NOTHING was written to main, and no unrelated working-tree file was touched" >&2
      return 0
    fi
  fi
  # rc 2 means the rewind is HALF-DONE. Telling the operator to "drop the
  # commits by hand" here would be false in the most damaging direction: the
  # commits are already gone, and acting on that instruction would drop
  # whatever now sits on HEAD instead.
  if [[ "$restore_rc" -eq 2 ]]; then
    _GRAPH_DISCARD_TORN=1
    echo "$label: graph-commit left un-landed commit(s) (${stranded[0]}) and the rollback is HALF-DONE. HEAD was ALREADY moved back to ${head_at_arm:0:8} and those commit(s) are ALREADY GONE, but restoring the ${#touched[@]} intentions/ path(s) they touched FAILED, so those paths still hold the discarded content. Do NOT drop the commit(s) by hand — that would discard whatever is on HEAD now. Restore those paths to ${head_at_arm:0:8} by hand instead, before any other graph-commit runs from this checkout" >&2
    return 1
  fi
  echo "$label: graph-commit left un-landed commit(s) on HEAD (${stranded[0]}) that never passed check_base_freshness, and they are NOT safely discardable — the write was NOT rolled back. Drop them by hand before any other graph-commit runs from this checkout: it pushes HEAD, not just the node it names" >&2
  return 1
}

# Move the recorded state back to <rev> and bring exactly <path>... to <rev>'s
# content, leaving every other working-tree file exactly as found.
#
# rc contract: 0 = done; 1 = the `reset --mixed` itself failed, so NOTHING moved
# and HEAD still carries the commits; 2 = the reset SUCCEEDED and a per-path
# restore then failed, so HEAD is already rewound, the commits are already gone,
# and only the paths are left holding discarded content. Callers must not
# collapse 1 and 2 into one message — the operator remedy is opposite in each
# case (drop the commits by hand vs. do NOT, they are already dropped).
#
# `--mixed` rather than `--hard`: it rewinds HEAD and the index and stops there,
# so no file outside <path>... is read or written. The per-path restore then
# comes off that index, which now IS <rev>. A path <rev> does not have (the
# discarded commit created it) is removed rather than checked out, which is what
# the reset would have done and what leaves the tree clean. Same discipline as
# graph-commit's sync_ids_to_rev
# (packages/intentionsutil/scripts/graph-commit:1686) and dispatch-eval-finding's
# restore_from_blob.
#
# _graph_restore_paths_to_rev <repo-root> <rev> <path>...
_graph_restore_paths_to_rev() {
  local repo_root="$1" rev="$2"
  shift 2
  local path
  git -C "$repo_root" reset -q --mixed "$rev" || return 1
  for path in "$@"; do
    if git -C "$repo_root" cat-file -e "$rev:$path" 2>/dev/null; then
      git -C "$repo_root" checkout -q -- "$path" || return 2
    else
      rm -f -- "$repo_root/$path" || return 2
    fi
  done
  return 0
}
