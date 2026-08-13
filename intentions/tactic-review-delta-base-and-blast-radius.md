---
id: tactic-review-delta-base-and-blast-radius
kind: tactic
statement: Scope a re-review to the changes since the last review, and keep
  detection whole with a mechanical blast-radius reading list
owner: ai
status: raw
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
phase: null
execution: null
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
