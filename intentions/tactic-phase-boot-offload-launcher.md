---
id: tactic-phase-boot-offload-launcher
kind: tactic
statement: Offload precomputable phase-boot prelude to the launcher and
  propagate review-fix's dropped in-session merge to qa-fix
owner: ai
status: codified
parent: null
rationale: "Boot-boilerplate facet of the standup-cost lever
  (strategy-token-economy clarification 12). Original scope was two units: (1)
  propagate review-fix's dropped in-session origin/main merge to qa-fix (qa-fix
  re-did the merge at Step 0.5 plus a redundant second context-pack, ~6-7
  round-trips vs review-fix's ~3-4), and (2) push precomputable prelude into the
  launcher as a prepared file. Disposition 2026-07-21 (office-hours drain): Unit
  1 delivered in PR #2926; Unit 2 CLOSED as not-worth-it -- its plan target
  dispatch-launch-worker was retired by PR #2869 (the launcher is now
  dispatch-graph-execute + provision-node-worktree + dispatch-merge-main, which
  write nothing into the worktree), the only guardrail-safe precompute value is
  a free local git merge-base, and caching context-pack would violate the
  freshness bound. The tactic-phase-standup-audit-lens gate the plan named never
  existed; blocked_by stayed []."
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
phase: qa
execution:
  branch: tactic-phase-boot-offload-launcher
  pr: 2926
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix:
    since: 2026-07-22
    attempt: 1
    pushed_sha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# Offload precomputable phase-boot prelude to the launcher and propagate review-fix's dropped in-session merge to qa-fix

## Disposition (2026-07-21, office-hours drain)

Scope narrowed to Unit 1 only; **Unit 2 closed as not-worth-it**.

- **Unit 1 — delivered.** PR #2926 drops `qa-fix`'s redundant in-session
  `origin/main` merge at Step 0.5 (mirrors `review-fix`'s #1426 pattern). All CI
  green, mergeable — proceeds through review normally.
- **Unit 2 — closed, not implemented.** Its plan target
  `dispatch-launch-worker` was retired by PR #2869 when the harness moved to the
  graph-only path; the launcher is now `dispatch-graph-execute` +
  `provision-node-worktree` + `dispatch-merge-main`, which write nothing into the
  worktree, so the plan-text mechanism no longer exists. The only guardrail-safe
  precompute value (the post-merge merge-base, already
  `provision-node-worktree`'s `$ORIGIN_SHA`) is a free local `git merge-base`
  worth ~0; caching `dispatch-context-pack` would violate this node's own
  freshness bound (labels/CI drift between launch and start). If a broad
  launcher→session offload framework is later wanted, file it as a fresh tactic.
- The `tactic-phase-standup-audit-lens` gate named in the historical body prose
  below **never existed in the repo**; the frontmatter `blocked_by` is already
  `[]` and the graph never gated on it. The prose reference is corrected below.

The Context/Unit-1/Verification sections below are the original plan, retained as
the historical record; read them through this disposition.

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

**Measure-first (historical intent; gate never materialized).** The original
plan wanted an audit lens (`tactic-phase-standup-audit-lens`) to give the
per-phase scriptable-vs-judgment split before choosing which preamble steps to
offload. That node was never written and the frontmatter `blocked_by` stayed
`[]`, so nothing ever gated on it — see the Disposition above. Unit 2 is closed,
so the lens is moot.

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

## Unit 2 — CLOSED as not-worth-it (original plan retained below for the record)

Closed 2026-07-21 — see the Disposition section above. The target
`dispatch-launch-worker` no longer exists (retired by PR #2869), and the
remaining precompute values are either free-to-recompute or forbidden by this
node's freshness bound. The original plan text follows unchanged as history.

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
