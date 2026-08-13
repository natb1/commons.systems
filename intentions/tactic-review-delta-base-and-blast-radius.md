---
id: tactic-review-delta-base-and-blast-radius
kind: tactic
statement: Scope a re-review to the changes since the last review, and keep
  detection whole with a mechanical blast-radius reading list
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-08-13 /align round on review token usage, from
  an incident traced end-to-end that same session:
  tactic-attention-namespaced-rank completed a full /review-fix pass costing
  3h26m and 32 subagents, /fix-checks then pushed one CI-repair commit,
  resolving the fix-interrupt stripped the `reviewed` marker, and the lane
  re-reviewed the ENTIRE PR from merge-base. This node carries clarifications 50
  and 51 (the narrowed base, its three detection guards, and the sidecar that
  holds the last-reviewed sha), plus the blast-radius classifier that
  clarification 54 deliberately moved OUT of the pre-pass so this node ships
  complete and safe on its own, entirely within the sanctioned structural
  lever."
reading: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: tactic-review-delta-base-and-blast-radius
  pr: 3087
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Scope a re-review to the changes since the last review, and keep detection whole with a mechanical blast-radius reading list

Draft retained from the 2026-08-13 `/align` round on review token usage. Not
refined to the plan schema — that is `/align-tactics`' job. Authoritative
requirements live in `strategy-token-economy` clarifications 50, 51 and 54; this
body carries the mechanical context that round measured, so a clean session does
not have to rediscover it.

## The waste this closes

Traced end-to-end on 2026-08-13 against node `tactic-attention-namespaced-rank`
(PR #3075), from `events.jsonl` and the graph history:

| Time (UTC) | Event |
|---|---|
| 14:30:52 | `launched review` — `/review-fix` |
| 17:13:58 | review completes; `f3e0a632` adds `- reviewed` to `execution.markers` |
| 18:10:43 | `review-stall recovered -> fix (ci=failing merge=MERGEABLE)` |
| 18:11:06–18:21:18 | `/fix-checks` runs, pushes **one** commit (`6e1f5770`) |
| ~18:34 | `c49270f1` resolves the fix-interrupt, clearing `fix:` and **stripping `- reviewed`** |
| 18:35:04 | `launched review` **again** — from merge-base, full PR |

The first pass cost 3 h 26 min and 32 subagents. One commit invalidated all of
it. The marker strip is correct and must not be changed — see
`packages/intentionsutil/scripts/apply-fix-state.ts:219-227`, which documents
why (`phase:review + reviewed` emit-guards would otherwise skip the node
entirely). What is wrong is only the *scope* of the pass that follows.

## Where the change goes — one site, not two

Both review lanes read a single variable:

- `.claude/skills/review-fix/SKILL.md:267` —
  `MERGE_BASE=$(git merge-base HEAD origin/main)`
- it feeds the built-in lane as `--target "$MERGE_BASE..HEAD"` (Step 1b,
  SKILL.md:401-402) and the owned lane as the Workflow's `merge_base` arg
  (SKILL.md:628)

So narrowing has one seam. Note `dispatch-code-review` **rejects a non-range
`--target` with exit 2** (SKILL.md:351), so the replacement must stay a
`A..HEAD` range.

## Three parts, all required

1. **`REVIEW_BASE`** — the last-reviewed sha when one is known, else
   `MERGE_BASE`. Held in `.claude/worktrees/<node-id>.review-base`, a sidecar
   parallel to the existing `.scope-fingerprint` and `.code-review-lock`.
   **Fails closed**: absent, unreadable, or not reachable from `HEAD` ⇒ full
   `MERGE_BASE..HEAD`.
2. **`dispatch-blast-radius`** — a new pure stdin→stdout classifier in
   `.claude/skills/dispatch-propagate/scripts/`, shaped exactly like the three
   that already sit on this seam (`dispatch-changed-files`,
   `dispatch-security-surface`, `dispatch-api-call-site`). Given the delta on
   stdin it emits the out-of-diff files that reference any changed symbol.
   Those files become required reading in the reviewers' brief — this is what
   makes the narrowed base safe rather than blind, per clarification 50.
3. **Prior-finding carry-forward** — unresolved and deferred findings from the
   previous pass re-enter the re-review pool, so re-scoping cannot silently drop
   a finding the earlier pass raised.

## Owed probes — do not assume these

Recorded as owed in clarification 51 rather than assumed:

- **(a)** Do these worktree sidecars survive every worktree-sweep path? The
  `.scope-fingerprint` precedent suggests yes; it has not been verified.
- **(b)** How is the sidecar keyed for the **PR lane**, which is not
  node-id-keyed? `dispatch-code-review` already keys its out-dir on the PR
  number (`tmp/code-review-$N`), which is a candidate but is not settled.

Both belong in the first unit as probes.

## Constraints inherited from the strategy

- The narrowed base is legal only because trigger narrowing is a sanctioned
  structural lever. Shipping part 1 without parts 2 and 3 is the detection
  reduction the quality-preservation condition forbids.
- This node ships **before** `tactic-review-plan-preflight-skill` and must not
  be planned as one PR with it — clarification 54's decoupling exists so this
  node's saving can be measured on its own.

## Resolved (2026-08-13) — PR #3087, merged e612e50c

Shipped all three required parts. Clarification 50 states that the narrowed base
without them **is** the detection reduction the quality-preservation condition
forbids, so none of them was optional:

1. `dispatch-review-base` — the `<worktrees-root>/<basename>.review-base`
   sidecar and the fail-closed `REVIEW_BASE` binding in `/review-fix` Step 1.
   `MERGE_BASE` stays bound and unchanged, per the mechanism note in
   clarification 50.
2. `dispatch-blast-radius` — the mechanical out-of-diff reading list, a pure
   stdin-to-stdout classifier on the same seam as `dispatch-changed-files`,
   `dispatch-security-surface` and `dispatch-api-call-site`, exactly as
   clarification 54's divergence directed.
3. Prior-finding carry-forward, extending the existing prior-comment resume
   channel rather than adding a second source of truth.

This PR **bypassed the dispatch ladder deliberately**: it changes the review lane
itself, so routing it through that lane would have had it reviewed by the code it
was changing. It was reviewed with the pre-change lane and merged at author
authorization. `execution.markers` is therefore empty — no ladder phase ran.

### The two owed probes — answers

Clarification 51 accepted these as **owed, not assumed**. Both are now answered.

**(a) Do `.claude/worktrees/<id>.*` sidecars survive every worktree-sweep path?
Yes.** Every removal path is `git worktree remove <worktrees-root>/<id>` —
`.claude/hooks/worktree-remove.sh:103`, `lib-session-reap.sh:374`, and the
`dispatch-sweep` / `dispatch-node-reap` arms that route through it. That removes
the *directory* at that path; the sidecar is the **sibling file**
`<root>/<id>.<suffix>` and is never targeted. Corroborated live: the
`.claude/worktrees/` listing holds many `.scope-fingerprint` files whose worktree
directories are long gone.

The answer is load-bearing in an unobvious direction, and it **added a guard the
ruling did not anticipate**. Because sidecars *outlive* the worktree, a
`.review-base` written for a node's previous, already-merged PR is still on disk
when the next PR starts — and its sha, now an ancestor of the new merge base, is
still **reachable from HEAD**. Clarification 51's stated fail-closed test
(absent, unreadable, or "naming a sha not reachable from HEAD") would therefore
have **accepted** it and skipped the entire new PR. The implementation adds a
`not-ahead-of-merge-base` condition requiring the recorded sha to be a
*descendant* of the merge base, with its own test row.

**(b) The PR lane's key: the reviewed worktree's own basename.** Not the node id
(the PR lane has none) and not the PR number. `tmp/code-review-$N` was the
candidate named at ruling time and is **rejected**, on the argument
`dispatch-code-review` already makes about its own resume cache (header lines
60-78): `tmp/` is *inside the reviewed worktree*, so the PR whose content is under
review can write it — and a planted `.review-base` naming HEAD would narrow the
next review to nothing. Basename-keying reuses the settled
`<worktrees-root>/<name>.<suffix>` convention (`.scope-fingerprint`, `.ladder`,
`.code-review-lock`) and needs no lane split at all: on the node lane the
basename *is* the node id; on the PR lane it is the issue-branch worktree's name,
stable for that PR's whole life. Outside a `.claude/worktrees` root there is no
sidecar home, so resolve falls back and record refuses — the same explicit
path-shape condition `dispatch-code-review:399-413` uses for its node lock.
