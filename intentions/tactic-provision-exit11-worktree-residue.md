---
id: tactic-provision-exit11-worktree-residue
kind: tactic
statement: provision-node-worktree must distinguish an UNUSABLE worktree (dirty
  tracked tree, in-progress rebase/merge, detached HEAD) from a genuine content
  conflict rather than collapsing both into exit 11 — and graph-commit's
  cleanup() must abort a rebase it strands — so the conflict lane is never
  dispatched into a state its own contract says cannot occur
owner: ai
status: raw
parent: null
rationale: null
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# provision-node-worktree: separate an unusable worktree from a genuine merge conflict

## Provenance

- **Source:** interactive debugging session, 2026-07-28, triggered by the observation
  that manual dispatch ticks emitted `conflict-retry` repeatedly without ever launching
  a session that resolved anything.
- **Locations:**
  - `.claude/skills/dispatch-propagate/scripts/provision-node-worktree:125-129` (the
    merged-tree-guarantee block).
  - `.claude/skills/dispatch-conflict/SKILL.md`, Lane 3 Step 1 (the invariant it relies
    on) and Step 3 (the reproduce).
  - `packages/intentionsutil/scripts/graph-commit:335` (`cleanup()`) and `:932` (the sole
    `git rebase --abort` site).
- **Status of the originally-reported symptom:** already fixed. PR #2977 landed Lane 3 at
  2026-07-28 16:05 and rewired `dispatch-graph-execute` case 11 to spawn
  `/dispatch-conflict <id>` as first responder, demoting the strike ladder to a
  launch-failure backstop. This tactic is about a *different* defect that survived that
  fix, and that Lane 3 now walks directly into.

## The defect

`provision-node-worktree` collapses three distinct worktree states into exit 11:

```bash
if ! git -C "$WT" merge --no-edit origin/main 1>&2; then
  git -C "$WT" merge --abort 1>&2 || true
  echo "provision-node-worktree: origin/main does not merge clean into $NODE_ID" >&2
  exit 11
fi
```

Any non-zero `git merge` becomes "origin/main does not merge clean". But `git merge`
also fails non-zero when the tree is dirty or an operation is already in progress, and
in those cases the subsequent `git merge --abort` **also** fails — it is swallowed by
`|| true`, so the residue is left in place and the message is a false statement about
the branch.

Lane 3's Step 1 documents the invariant it depends on, verbatim:

> Exit 11 leaves the worktree and branch **in place**, with the merge already
> **aborted** and the tree clean

That invariant holds only for the genuine-conflict mode. It is false for the other two.

## Reproduction

Verified 2026-07-28 in a scratch repo (`feat` branch, `main` ahead, `node.md` edited on
both sides):

**Mode A — dirty tracked tree** (the observed `tactic-mechanical-park-producers` case: an
uncommitted graph write left by a session whose graph-commit never landed):

```
provision merge      rc=1    error: Your local changes to the following files would be
                             overwritten by merge: node.md
provision abort      rc=128  fatal: There is no merge to abort (MERGE_HEAD missing).
tree after "abort"           [ M node.md]        <- invariant "tree clean" FALSE
Lane 3 Step 3 merge  rc=1    (same error; Lane 3 calls a non-zero exit "expected")
Lane 3 conflicted set        []                  <- EMPTY
```

Lane 3 proceeds past Step 3 with an empty conflicted set. It is not the documented
"already up to date" sub-case either, so it falls through to Step 4/5 with no paths to
classify and no target for the resolver subagent.

**Mode B — abandoned rebase** (the observed `tactic-graph-node-session-reap` case):

```
provision merge      rc=128  error: Merging is not possible because you have unmerged files.
provision abort      rc=128  fatal: There is no merge to abort (MERGE_HEAD missing).
tree after "abort"           [UU node.md]        <- invariant "tree clean" FALSE
HEAD                         DETACHED
rebase state dir             .git/rebase-merge   <- survives
Lane 3 Step 3 merge  rc=128  (same error)
Lane 3 conflicted set        [node.md]           <- the REBASE's paths, not a merge's
```

This one is worse than stuck. Lane 3 gets a plausible-looking conflicted set, resolves
it, and Step 6 commits — **onto a detached HEAD inside a live rebase**. The commit never
reaches the branch, and the rebase is still pending underneath it.

**Mode C — genuine conflict** (clean tree, no operation in progress) behaves as
documented: merge rc=1, abort rc=0, tree clean afterwards, conflicted set populated.

## Why the retry ladder could never clear it

Modes A and B are **steady states**, not transient ones. The strike counter's premise —
that `origin/main` moved and a later tick may merge clean — does not apply: nothing about
a subsequent tick changes a dirty file or an abandoned rebase. So every retry is provably
wasted, the cap is reached deterministically, and the hold that is born asserts

> origin/main has not merged clean into this tactic's branch for 5 consecutive ticks
> (provision exit 11).

which is factually wrong for both modes — the branch merges clean the instant the residue
is cleared, with no conflict resolution at all. Both observed cases were confirmed this
way: after `git rebase --abort` (B) and `git restore` (A), `git merge-tree --write-tree`
against `origin/main` returned rc 0 immediately.

## Relationship to `tactic-conflict-lane-exit11-retry-bound`

That node (filed from PR #2977's review-fix pass) bounds a Lane 3 session that launches
but never resolves, and states that what actually happens to such a session is "not yet
observed". Modes A and B are an observed, deterministic cause of exactly that state — a
lane dispatched into a worktree whose precondition is already violated cannot resolve
anything. The two are complementary: that node is the backstop (a bound must exist
regardless of cause); this node removes a cause that would otherwise trip the bound on
every tick for the affected node. Neither substitutes for the other.

## Recommended fix

**Greenfield.** `provision-node-worktree` should assert the precondition it advertises
instead of inferring it from a merge exit code. Before the merge:

- refuse a worktree with an operation in progress — `git rev-parse --git-path
  rebase-merge` / `rebase-apply` / `MERGE_HEAD` / `CHERRY_PICK_HEAD` (use `--git-path`,
  not a hardcoded `.git/...`; `graph-commit`'s `rebase_in_progress()` at `:559` already
  does this correctly and is the reuse target);
- refuse a dirty **tracked** tree — `git status --porcelain --untracked-files=no`;
- refuse a detached HEAD — `git symbolic-ref -q HEAD`.

These get a **new exit code** (`14`, "worktree unusable") distinct from 11, because the
disposition differs: 11 is a content conflict needing judgment, 14 is mechanical residue
from a dead session. Correspondingly, verify the `git merge --abort` succeeded rather
than `|| true`-ing it — a failed abort means the state was never mergeable in the first
place and must not be reported as a conflict.

**Repair policy for exit 14 — deliberately asymmetric:**

- *In-progress operation / detached HEAD:* auto-repair. `git rebase --abort` restores the
  pre-rebase branch tip and is non-destructive with respect to committed work; the
  residue is by definition unattended (the session that created it is gone). This is what
  cleared the observed Mode B case, recovering the branch at its real tip with the
  stranded park commit intact.
- *Dirty tracked tree:* do **not** auto-discard. In the observed Mode A case the
  uncommitted edit turned out to be strictly behind `origin/main` and safe to drop, but
  that was established only by diffing it against main — it could equally have been the
  sole copy of unlanded work. Route this to a tracked hold whose reason carries the actual
  `git status` and a `git diff` summary, so the drain has the evidence in hand.

**Second half — stop producing Mode B.** `graph-commit`'s `cleanup()` (`:335`) has
best-effort backstops for the landing lock, the scratch branch, and the snapshot dir, but
none for an in-progress rebase; the only `git rebase --abort` is the single explicit site
at `:932`. Any exit that does not pass through that site — SIGKILL, a Claude tool
timeout, a session reap, or an unexpected `die()` between `git pull --rebase` and the
layer-2 handling — strands the rebase in the node's worktree permanently. `cleanup()`
should abort an in-progress rebase it did not intend to leave, on the same best-effort
footing as the lock release. Note this cannot be complete: a SIGKILL fires no trap at
all, which is exactly why the provision-side guard above is the primary defense and this
is the secondary one.

## Scope notes

- Out of scope: changing the strike/hold ladder itself. `tactic-graph-router-conflict-routing`
  is expected to replace that whole branch with an `execution.conflict` interrupt, and
  `dispatch-graph-execute`'s own case-11 comment says the branch is "expected to be
  replaced wholesale at that point, not extended". The guard belongs in
  `provision-node-worktree`, which survives that replacement.
- The new exit code must be threaded through `dispatch-graph-execute`'s case statement and
  documented in `provision-node-worktree`'s header exit-code table alongside 10/11/12/13/2.

## Verification

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

Script-level cases to add (note `tactic-provision-worktree-script-tests` tracks the fact
that no `provision-node-worktree` harness exists in that file yet — this tactic needs one,
so the two should be sequenced or merged):

- clean tree + conflicting content → exit 11, tree clean afterwards;
- dirty tracked file → exit 14, file untouched;
- `.git/rebase-merge` present → exit 14, and after auto-repair the branch is back on its
  tip with `merge-tree --write-tree` returning 0;
- detached HEAD → exit 14;
- untracked-only files → exit 0 (untracked files must not trip the dirty check, since
  worktrees routinely carry build output).

Manual: after landing, confirm no node accumulates consecutive `conflict-retry` /
`conflict-lane` ticks whose worktree has a non-empty `git status --porcelain
--untracked-files=no` or a `rebase-merge` directory.
