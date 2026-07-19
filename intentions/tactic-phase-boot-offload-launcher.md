---
id: tactic-phase-boot-offload-launcher
kind: tactic
statement: Offload precomputable phase-boot prelude to the launcher and
  propagate review-fix's dropped in-session merge to qa-fix
owner: ai
status: codified
parent: null
rationale: "Boot-boilerplate facet of the standup-cost lever
  (strategy-token-economy clarification 12). The launcher chain
  (dispatch-launch-worker -> provision-node-worktree -> dispatch-merge-main)
  already runs the deterministic prelude before the session exists, and passes N
  and the worktree path as prompt args, yet phase skills re-derive them
  in-session; boot judgment content is near-zero. review-fix already dropped its
  in-session fetch/merge (review-fix/SKILL.md:199-201, ~3-4 boot round-trips)
  because the launcher merged; qa-fix has not (re-does the merge at Step 0.5,
  qa-fix/SKILL.md:227-233, plus a redundant second context-pack, ~6-7
  round-trips). Propagate the review-fix pattern to qa-fix and push
  precomputable prelude (N, PR link, merge-base, context-pack) into the launcher
  as a prepared file. Freshness-bounded: launcher precompute is allowed only for
  values fixed at launch or produced by the launcher's own merge step, never a
  value that can go stale against the merged tree (qa-fix's diff must stay
  post-merge). Parity-gated and measured by tactic-phase-standup-audit-lens."
reading: null
gap: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 15
  override: null
  rationale: "Author-directed 2026-07-16: top-rank the three token-economy
    standup-cost tactics above the working frontier (below the main-health
    sentinel at 100, which the write-path guard reserves).
    strategy-token-economy carries no strategy-level boost, so the tactic
    carries the full weight itself; boost 15 clears the current working max
    (~14.5)."
phase: implement
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "/implement: implementation deviated from the persisted plan on
    tactic-phase-boot-offload-launcher. Unit 1 done (PR #2926); Unit 2 targets
    retired dispatch-launch-worker and its own blocking lens
    (tactic-phase-standup-audit-lens) does not exist in the repo."
  since: 2026-07-19
  recommendation: >-
    # Recommendation: `tactic-phase-boot-offload-launcher`


    ## Status


    - **Unit 1 — done.** PR #2926 removes qa-fix's redundant in-session
    `origin/main` merge at Step 0.5, since `provision-node-worktree` already
    merges before the phase worker spawns (mirrors review-fix's #1426 pattern).
    Legacy issue lane left unchanged (launch chain retired). Ready for review on
    its own.

    - **Unit 2 — not implemented.** Its target,
    `dispatch-launch-worker:161-164`, was deleted by PR #2869 (commit a8c4898d)
    when the harness moved to the graph-only path. The launcher is now
    `dispatch-graph-execute` + `provision-node-worktree`, which write nothing
    into the worktree. The plan-text mechanism no longer exists.


    ## Options for Unit 2


    **(a) Unblock the scoping question first.** Write the missing
    `tactic-phase-standup-audit-lens` node (the body prose names it as the input
    that decides which preamble steps are safe to offload; it is absent from the
    repo). Do this only if you believe a general offload framework is worth
    designing — it is the largest scope.


    **(b) Narrow Unit 2 to one real slice.** Extend the existing
    `DISPATCH_PR_LIST_FILE` mechanism (introduced in PR #1646, today scoped to
    selection-time inside `dispatch-select-target`/`dispatch-ci-ready`) across
    the worker-session boundary for the qa and review phases only — where a PR
    already exists at launch. Feed a precomputed PR number / context-pack as
    **advisory-only** input, with the phase skill's existing idempotency
    preamble doing an in-session freshness check on cache miss or staleness.
    This is the one slice with plausible payoff.


    **(c) Close Unit 2 as not-worth-it.** The only guardrail-safe value (the
    post-merge merge-base SHA, already `provision-node-worktree`'s
    `$ORIGIN_SHA`) is a free local `git merge-base` — precomputing it saves ~0
    and adds a file-read seam. Caching `dispatch-context-pack` violates the
    node's own freshness bound (labels/CI drift between launch and start). If
    you take this path, update the node's rationale to record that
    `dispatch-launch-worker` is retired.


    **Recommendation:** ship #2926, then take **(b)** if PR-context
    re-resolution is a measured cost in qa/review, otherwise **(c)**. Reserve
    **(a)** only if a broad offload lens is independently wanted.


    ## Regardless of choice


    Fix the doc/frontmatter inconsistency: the body prose still names
    `tactic-phase-standup-audit-lens` as a blocker, but the frontmatter
    `blocked_by` is empty (`[]`), so the graph does not actually gate on it.
    Update the prose to match the frontmatter (or add the link if the gate is
    intended — but per option (b)/(c) it should just be dropped).


    References:

    - #2926: https://github.com/natb1/commons.systems/pull/2926

    - #2869: https://github.com/natb1/commons.systems/pull/2869

    - #1646: https://github.com/natb1/commons.systems/pull/1646

    - #1426: https://github.com/natb1/commons.systems/pull/1426
pace_exempt: false
rounds: null
attributes: {}
---

# Offload precomputable phase-boot prelude to the launcher and propagate review-fix's dropped in-session merge to qa-fix

## Context

`strategy-token-economy` clarification 12 (2026-07-16), boot-boilerplate facet of
the standup-cost lever. The launcher chain
(`dispatch-launch-worker` → `provision-node-worktree` → `dispatch-merge-main`)
already runs the deterministic prelude **before the session exists** and passes N
and the worktree path as prompt args (`dispatch-launch-worker:161-164`, the
`$SKILL $N $WORKTREE_PATH` exec). Yet phase skills re-derive these in-session,
paying metered tool round-trips for values already fixed at launch. Boot judgment
content is near-zero.

`review-fix` is the exemplar: it explicitly **dropped** its in-session
`git fetch origin main` / merge (`review-fix/SKILL.md:199-201`) because the
launcher's phase-entry merge already keeps `origin/main` current, and it runs
~3–4 boot round-trips. `qa-fix` has **not** adopted this — its Step 0.5 re-runs
the merge (`qa-fix/SKILL.md:227-233`, `commit-merge-push --merge-only`) plus a
redundant second `dispatch-context-pack`, at ~6–7 round-trips.

This tactic (a) propagates the `review-fix` boot-offload pattern to `qa-fix`, and
(b) pushes precomputable prelude into the launcher as a prepared file. Throughput
lever, off the success-signal path (no `validates`; priority is the author's
boost 15).

**Binding guardrail from clarification 12 — freshness bound.** Launcher
precompute is allowed **only** for values fixed at launch or produced by the
launcher's own merge step — never a value that can go stale against the merged
tree. `qa-fix`'s diff must stay **post-merge**: it is computed after the
launcher's merge, so it may be reused, but any value that could change once the
tree is merged must still be derived in-session.

**Measure-first.** `blocked_by: [tactic-phase-standup-audit-lens]` — read the
lens's per-phase scriptable-vs-judgment split for `qa-fix` before choosing which
preamble steps to offload.

## Unit 1 — propagate review-fix's dropped in-session merge to qa-fix

**Recommended model:** opus

The parity risk is real (dropping a merge that was load-bearing regresses QA), so
mirror `review-fix`'s exact justification, not just its deletion.

Scope:
- `.claude/skills/qa-fix/SKILL.md:227-233` (Step 0.5): drop the in-session
  `commit-merge-push --merge-only` **only if** the launcher's phase-entry merge
  already guarantees `origin/main` is merged into the working branch before the
  qa-fix session starts — the same precondition `review-fix/SKILL.md:199-201`
  relies on. Confirm that precondition against
  `provision-node-worktree`/`dispatch-merge-main` (the launcher merge step); if
  the launcher merge does not cover the qa lane, this unit narrows to removing
  only the **redundant second** `dispatch-context-pack`, not the merge.
- Preserve the freshness bound: `qa-fix`'s changed-surface diff must remain
  computed post-merge (mirror `review-fix`'s direct `git merge-base` against the
  already-merged tree, `review-fix/SKILL.md:199-201`), never a pre-merge or
  launcher-cached diff that can go stale.

Dependencies: gated on the audit lens (frontmatter `blocked_by`).

Reuse:
- `.claude/skills/review-fix/SKILL.md:199-201` — the exemplar dropped-merge
  pattern and its `#1426` justification; copy the reasoning verbatim into the
  `qa-fix` change so the parity argument is explicit.
- `.claude/skills/dispatch-propagate/scripts/dispatch-merge-main` and
  `provision-node-worktree` — the launcher merge step whose guarantee this unit
  depends on.

## Unit 2 — push precomputable prelude into the launcher as a prepared file

**Recommended model:** opus

Scope:
- `.claude/skills/dispatch-propagate/scripts/dispatch-launch-worker` (and
  `provision-node-worktree`): after the launcher's merge, write a small prepared
  prelude file into the worktree (e.g. `.dispatch-prelude.json`) carrying the
  values fixed at launch or produced by the launcher's merge — N, the PR link
  (already resolved by the router), the post-merge `merge-base`, and the
  `dispatch-context-pack` output. Phase skills read this file instead of
  re-deriving those values in-session.
- Apply the freshness bound strictly: include in the prepared file **only**
  launch-fixed or launcher-merge-produced values. Anything that can change after
  merge stays in-session.
- Update the consuming phase skills (`qa-fix`, and `review-fix` where it still
  re-derives an offloadable value) to read the prepared file when present, with a
  clean in-session fallback if it is absent (so a hand-run session outside the
  launcher still works).

Dependencies: gated on the audit lens; independent of Unit 1 but should land
after it so the qa-fix boot path is already simplified.

Reuse:
- `dispatch-launch-worker:161-164` — the existing prompt-arg passing (N,
  worktree path) is the precedent for launcher→session handoff; extend it to a
  prepared file rather than growing the prompt.
- `dispatch-context-pack` — already run in the chain; capture its output into
  the prepared file rather than re-running it in-session.

## Verification

Manual, parity-gated (no unit test covers the launcher→session handoff
end-to-end):
- Launch a real `qa` phase worker via the graph lane and confirm from its
  transcript that it no longer re-runs the `origin/main` merge and the redundant
  second `dispatch-context-pack` — the boot round-trip count for `qa-fix` drops
  toward `review-fix`'s ~3–4 (measured by the standup-cost lens before/after).
- Confirm the phase still operates on a **post-merge** tree: the changed-surface
  diff it acts on must reflect `origin/main` merged in, proving the freshness
  bound held.
- Confirm a hand-run `qa-fix` session (no launcher prelude file present) still
  completes via the in-session fallback.
- Phase-success parity: the first post-change `qa` runs must complete their full
  contract with no regression.
