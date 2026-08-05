---
id: tactic-hold-conflict-graph-commit-rebuild-snapshot-stale-revert
kind: tactic
statement: "hold: provision-conflict on
  `tactic-graph-commit-rebuild-snapshot-stale-revert` — a tracked hold blocking
  the source until the mechanical retry state is resolved"
owner: ai
status: codified
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
office_hours:
  reason: "/dispatch-conflict Lane 3: merging origin/main into
    tactic-graph-commit-rebuild-snapshot-stale-revert (PR 2990) is textually
    clean (2 conflict hunks, both additive, resolved cleanly) but the merge is
    semantically broken: test-demote-node-to-implement.sh's \"stale far-ahead
    demotion\" case, which passed 2/2 before the merge, fails 1/1 after it. Root
    cause: origin/main's graph-commit change (10f9e91a) added an
    app.slug==\"github-actions\" filter to the required-check gate; this
    branch's own test-demote-node-to-implement.sh fixture (added earlier by this
    branch's own Unit 2, commit 88cef46d) predates that filter and has no
    app.slug field, so every check-run row is now dropped as a foreign producer
    and the poll exhausts all retries. The merge commit was undone (git reset
    --hard HEAD~1); the branch is back at its pre-merge tip. See the
    recommendation for the exact fix."
  since: 2026-08-05
  recommendation: >-
    # Recommendation — resume
    `tactic-graph-commit-rebuild-snapshot-stale-revert` (PR 2990)


    **Status:** branch is back at its pre-merge tip `1dd7f72e`; the merge of
    `origin/main` was committed, tested, and then reverted with `git reset
    --hard HEAD~1`. Nothing from the earlier merge survives on disk. The park is
    not about the git conflicts — those resolved cleanly — it is about one test
    that goes red only after the merge, and the fix is already diagnosed.


    Total expected work: re-do the merge, one fixture edit, re-run four test
    scripts, push.


    ---


    ## Step 1 — Re-merge `origin/main` and re-resolve the two conflicts


    ```

    git merge --no-edit origin/main

    ```


    This will reproduce exactly two conflicted files. Both resolutions are
    purely additive — keep both sides in full, invent nothing:


    1. **`packages/intentionsutil/scripts/graph-commit`** — a single
    comment-only conflict. Two independent documentation additions landed in the
    same comment block (this branch's "Three call sites" list vs. origin/main's
    "Bystander prunes" paragraph). Resolution: concatenate both comment
    additions; no code is in the hunk.


    2. **`packages/intentionsutil/scripts/test-graph-commit.sh`** — four hunks,
    all "both suites added new test cases in the same region." Resolution: keep
    both sides' cases, then renumber this branch's cases 36-40 to 48-52, because
    `origin/main` newly claimed case numbers 36-47. Renumber this branch's, not
    main's. After resolving, sanity-check that case numbers are unique and
    monotonic and that the total case count matches (the suite should report 68
    cases).


    This resolution was already performed once by an Opus subagent and verified
    green (68/68). It is mechanical and reproducible — re-running
    `/dispatch-conflict` will land on the same resolution. Re-deriving it by
    hand from the description above is equally safe; there is no judgment call
    hidden in either hunk.


    ## Step 2 — Fix the stale test fixture (the actual reason this parked)


    Edit `packages/intentionsutil/scripts/test-demote-node-to-implement.sh`, the
    `green.json` heredoc around lines 127-134 (the four `check_runs` rows around
    lines 129-132). Add `id` and `app.slug` to every row:


    ```json

    {"check_runs": [
      {"name": "acceptance", "status": "completed", "conclusion": "success", "id": 1, "app": {"slug": "github-actions"}},
      {"name": "preview-and-smoke", "status": "completed", "conclusion": "success", "id": 2, "app": {"slug": "github-actions"}},
      {"name": "lint", "status": "completed", "conclusion": "success", "id": 3, "app": {"slug": "github-actions"}},
      {"name": "unit-tests", "status": "completed", "conclusion": "success", "id": 4, "app": {"slug": "github-actions"}}
    ]}

    ```


    Also carry over the explanatory comment that `origin/main` put above its own
    copy of this fixture (in `test-transition-node.sh`), so the next person does
    not re-diagnose:


    > `app.slug` is required, not decorative: graph-commit's required-check gate
    only considers rows authored by the github-actions App, so a fixture row
    without it is dropped as a foreign producer and the context reads `absent`.


    **Why:** `origin/main`'s commit `10f9e91a` (with review-fix `79a1d608`)
    added `select((.app.slug // "") == "github-actions")` to `graph-commit`'s
    required-check gate (`packages/intentionsutil/scripts/graph-commit`, around
    line 986). Rows from any other producer are now dropped as foreign. This
    branch's own commit `88cef46d` (Unit 2) added
    `test-demote-node-to-implement.sh` before that filter existed, so its
    fixture rows carry neither `id` nor `app.slug`. Post-merge, every row is
    filtered out, the required check reads `absent`, the poll in the "stale
    far-ahead demotion" case exhausts all 5 retries, and `graph-commit` aborts
    with "could not land on main after 5/5 attempts." The demotion logic and the
    CAS-guard work are not implicated — this is fixture staleness only.


    **Caveat on the reference fixture:** do not copy the shape from the
    pre-merge working copy of `test-transition-node.sh`. At `1dd7f72e` that
    file's fixture still has the old shape without `app.slug` in this branch's
    history at that point — read `test-transition-node.sh` (and
    `test-park-node.sh`) only after the Step 1 merge is in the tree, or via `git
    show origin/main:packages/intentionsutil/scripts/test-transition-node.sh`.


    ## Step 3 — Re-run the full verification suite, for real


    Run all four from the merged worktree, by absolute path:


    - `packages/intentionsutil/scripts/test-graph-commit.sh` — expect 68/68

    - `packages/intentionsutil/scripts/test-transition-node.sh` — expect 3/3

    - `packages/intentionsutil/scripts/test-park-node.sh` — expect 22/22

    - `packages/intentionsutil/scripts/test-demote-node-to-implement.sh` —
    expect 2/2 (it was 2/2 pre-merge; Step 2 restores that)


    Do not trust the node's own fenced ```verify block as-is: it hardcodes a
    `cd` into an unrelated, stale worktree path
    (`strategy-graph-native-dispatch`) and reports a false PASS without running
    anything in this branch's tree. While resuming, fix that path in the node
    body's `## Verification` section so the next automated verification is not
    vacuous.


    If `test-demote-node-to-implement.sh` still fails after the fixture edit,
    the divergence is wider than diagnosed — re-park rather than widening scope,
    and note that `graph-commit`'s gate change around line 986 is the thing to
    instrument.


    ## Step 4 — Commit, push, let the chain continue


    Commit the merge plus the fixture fix (the fixture fix is legitimately part
    of adapting this branch to `origin/main`, so a single follow-up commit on
    top of the merge commit is fine — do not amend the merge). Push, clear the
    office-hours park on `tactic-graph-commit-rebuild-snapshot-stale-revert`,
    and hand PR 2990 back to the normal chain.


    ---


    **One-line summary:** merge `origin/main` (two additive conflicts, keep both
    sides, renumber this branch's test cases 36-40 to 48-52), then add `"id"`
    and `"app": {"slug": "github-actions"}` to the four `green.json` rows around
    lines 129-132 of `test-demote-node-to-implement.sh` — that is the entire
    fix.
  session_type: other
pace_exempt: false
rounds: null
attributes:
  hold_for: tactic-graph-commit-rebuild-snapshot-stale-revert
  hold_kind: provision-conflict
---
# hold: provision-conflict on tactic-graph-commit-rebuild-snapshot-stale-revert

## Context

`tactic-graph-commit-rebuild-snapshot-stale-revert` hit a mechanical retry state (`provision-conflict`) on 2026-08-05. A mechanical retry state is not "no autonomous path exists, human required", so the source is NOT parked. Instead this born-parked hold tactic (`tactic-hold-conflict-graph-commit-rebuild-snapshot-stale-revert`) carries the park, and `tactic-graph-commit-rebuild-snapshot-stale-revert` gains a `blocked_by` edge naming it. The source's own `office_hours` is never written.

## Reason

/dispatch-conflict Lane 3: merging origin/main into tactic-graph-commit-rebuild-snapshot-stale-revert (PR 2990) is textually clean (2 conflict hunks, both additive, resolved cleanly) but the merge is semantically broken: test-demote-node-to-implement.sh's "stale far-ahead demotion" case, which passed 2/2 before the merge, fails 1/1 after it. Root cause: origin/main's graph-commit change (10f9e91a) added an app.slug=="github-actions" filter to the required-check gate; this branch's own test-demote-node-to-implement.sh fixture (added earlier by this branch's own Unit 2, commit 88cef46d) predates that filter and has no app.slug field, so every check-run row is now dropped as a foreign producer and the poll exhausts all retries. The merge commit was undone (git reset --hard HEAD~1); the branch is back at its pre-merge tip. See the recommendation for the exact fix.

## How to resolve

# Recommendation — resume `tactic-graph-commit-rebuild-snapshot-stale-revert` (PR 2990)

**Status:** branch is back at its pre-merge tip `1dd7f72e`; the merge of `origin/main` was committed, tested, and then reverted with `git reset --hard HEAD~1`. Nothing from the earlier merge survives on disk. The park is not about the git conflicts — those resolved cleanly — it is about one test that goes red only after the merge, and the fix is already diagnosed.

Total expected work: re-do the merge, one fixture edit, re-run four test scripts, push.

---

## Step 1 — Re-merge `origin/main` and re-resolve the two conflicts

```
git merge --no-edit origin/main
```

This will reproduce exactly two conflicted files. Both resolutions are purely additive — keep both sides in full, invent nothing:

1. **`packages/intentionsutil/scripts/graph-commit`** — a single comment-only conflict. Two independent documentation additions landed in the same comment block (this branch's "Three call sites" list vs. origin/main's "Bystander prunes" paragraph). Resolution: concatenate both comment additions; no code is in the hunk.

2. **`packages/intentionsutil/scripts/test-graph-commit.sh`** — four hunks, all "both suites added new test cases in the same region." Resolution: keep both sides' cases, then renumber this branch's cases 36-40 to 48-52, because `origin/main` newly claimed case numbers 36-47. Renumber this branch's, not main's. After resolving, sanity-check that case numbers are unique and monotonic and that the total case count matches (the suite should report 68 cases).

This resolution was already performed once by an Opus subagent and verified green (68/68). It is mechanical and reproducible — re-running `/dispatch-conflict` will land on the same resolution. Re-deriving it by hand from the description above is equally safe; there is no judgment call hidden in either hunk.

## Step 2 — Fix the stale test fixture (the actual reason this parked)

Edit `packages/intentionsutil/scripts/test-demote-node-to-implement.sh`, the `green.json` heredoc around lines 127-134 (the four `check_runs` rows around lines 129-132). Add `id` and `app.slug` to every row:

```json
{"check_runs": [
  {"name": "acceptance", "status": "completed", "conclusion": "success", "id": 1, "app": {"slug": "github-actions"}},
  {"name": "preview-and-smoke", "status": "completed", "conclusion": "success", "id": 2, "app": {"slug": "github-actions"}},
  {"name": "lint", "status": "completed", "conclusion": "success", "id": 3, "app": {"slug": "github-actions"}},
  {"name": "unit-tests", "status": "completed", "conclusion": "success", "id": 4, "app": {"slug": "github-actions"}}
]}
```

Also carry over the explanatory comment that `origin/main` put above its own copy of this fixture (in `test-transition-node.sh`), so the next person does not re-diagnose:

> `app.slug` is required, not decorative: graph-commit's required-check gate only considers rows authored by the github-actions App, so a fixture row without it is dropped as a foreign producer and the context reads `absent`.

**Why:** `origin/main`'s commit `10f9e91a` (with review-fix `79a1d608`) added `select((.app.slug // "") == "github-actions")` to `graph-commit`'s required-check gate (`packages/intentionsutil/scripts/graph-commit`, around line 986). Rows from any other producer are now dropped as foreign. This branch's own commit `88cef46d` (Unit 2) added `test-demote-node-to-implement.sh` before that filter existed, so its fixture rows carry neither `id` nor `app.slug`. Post-merge, every row is filtered out, the required check reads `absent`, the poll in the "stale far-ahead demotion" case exhausts all 5 retries, and `graph-commit` aborts with "could not land on main after 5/5 attempts." The demotion logic and the CAS-guard work are not implicated — this is fixture staleness only.

**Caveat on the reference fixture:** do not copy the shape from the pre-merge working copy of `test-transition-node.sh`. At `1dd7f72e` that file's fixture still has the old shape without `app.slug` in this branch's history at that point — read `test-transition-node.sh` (and `test-park-node.sh`) only after the Step 1 merge is in the tree, or via `git show origin/main:packages/intentionsutil/scripts/test-transition-node.sh`.

## Step 3 — Re-run the full verification suite, for real

Run all four from the merged worktree, by absolute path:

- `packages/intentionsutil/scripts/test-graph-commit.sh` — expect 68/68
- `packages/intentionsutil/scripts/test-transition-node.sh` — expect 3/3
- `packages/intentionsutil/scripts/test-park-node.sh` — expect 22/22
- `packages/intentionsutil/scripts/test-demote-node-to-implement.sh` — expect 2/2 (it was 2/2 pre-merge; Step 2 restores that)

Do not trust the node's own fenced ```verify block as-is: it hardcodes a `cd` into an unrelated, stale worktree path (`strategy-graph-native-dispatch`) and reports a false PASS without running anything in this branch's tree. While resuming, fix that path in the node body's `## Verification` section so the next automated verification is not vacuous.

If `test-demote-node-to-implement.sh` still fails after the fixture edit, the divergence is wider than diagnosed — re-park rather than widening scope, and note that `graph-commit`'s gate change around line 986 is the thing to instrument.

## Step 4 — Commit, push, let the chain continue

Commit the merge plus the fixture fix (the fixture fix is legitimately part of adapting this branch to `origin/main`, so a single follow-up commit on top of the merge commit is fine — do not amend the merge). Push, clear the office-hours park on `tactic-graph-commit-rebuild-snapshot-stale-revert`, and hand PR 2990 back to the normal chain.

---

**One-line summary:** merge `origin/main` (two additive conflicts, keep both sides, renumber this branch's test cases 36-40 to 48-52), then add `"id"` and `"app": {"slug": "github-actions"}` to the four `green.json` rows around lines 129-132 of `test-demote-node-to-implement.sh` — that is the entire fix.

The `blocked_by` edge on `tactic-graph-commit-rebuild-snapshot-stale-revert` clears only when this node leaves the open set: resolve the hold tactic to `phase: done` (then prune) — clearing `office_hours` alone does not unblock the source.

