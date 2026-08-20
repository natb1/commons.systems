---
id: tactic-graph-refsplit-read-coherence
kind: tactic
statement: tactic-graph-ref-split refreshes the shared GRAPH_WT only at
  worktree-provisioning time — add a post-land coherence step so a session that
  lands a node can read its own write back
owner: ai
status: raw
parent: null
rationale: "Surfaced by the 2026-08-14 /align round recording the read-coherence
  invariant (strategy clarification 237). Verified by reading all 1040 lines of
  tactic-graph-ref-split: Unit 3 refreshes GRAPH_WT with fetch + reset --hard at
  four provisioning/hook call sites, all pre-session, and no unit refreshes it
  after a land. The 2026-08-14 ledger regression
  (tactic-eval-finding-list-reads-working-tree-stale-after-plumbing-land) is
  exactly this failure on today's mechanism, so it survives the cutover unless
  ref-split gains this step. A gap in a sound plan, not grounds to reject the
  symlink design."
reading: null
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
# tactic-graph-ref-split refreshes the shared GRAPH_WT only at worktree-provisioning time — add a post-land coherence step so a session that lands a node can read its own write back

Draft retained from the 2026-08-14 `/align` round. Not a plan.

## The gap, as measured

`tactic-graph-ref-split` Unit 3 materializes `intentions/` into every worktree as
a **symlink** to one shared long-lived worktree checked out from `graph-main`,
refreshed with `git -C "$GRAPH_WT" fetch origin graph-main && git -C "$GRAPH_WT"
reset --hard origin/graph-main`. That refresh runs at **four call sites, all
pre-session**: worktree provisioning and the hooks.

Grepping all 1040 lines of that node for a post-land refresh returns nothing. Unit
2's landing loop (`fetch` → `read-tree` → `write-tree` → `commit-tree` → push)
correctly never touches a working tree — which is the point — but nothing then
advances `GRAPH_WT` to the sha it just landed.

So a long-lived session that lands a node and then reads through the symlink reads
its own write as missing. That is not hypothetical: it is the 2026-08-14 regression
`tactic-eval-finding-list-reads-working-tree-stale-after-plumbing-land`, measured
at 7 stale rows and 28 lands without a HEAD move, with duplicate ledger slugs
minted because the similarity check could not see the entries already written.
Today it fires on the main checkout; post-cutover it fires on `GRAPH_WT`.

## The shape of the fix is open — deliberately

Two candidates, neither chosen this round:

1. **Refresh after land.** `graph-commit` advances `GRAPH_WT` to the pushed sha
   before returning success. Cheap, local, and the node already argues the reset is
   safe: *"a `git reset --hard origin/graph-main` is idempotent and never races
   against a plumbing-only writer."* Risk: `GRAPH_WT` is shared, so one session's
   refresh moves every reader — usually fine (all readers want `graph-main`'s tip),
   but it is a shared-mutable-cache write and should be reasoned about, not assumed.
2. **Read through the ref.** Resolve node blobs with `git cat-file` at
   `origin/graph-main` instead of through the symlink. Coherent by construction, but
   it rewrites every read site, gives up plain `grep`/editor access to `intentions/`,
   and makes a whole-graph pass shell out per node — the cost `graph-digest.ts`
   exists to manage.

The invariant this serves (strategy clarification 237) is stated
mechanism-neutrally on purpose: **no reader may observe graph state older than a
write it was told succeeded.** Either candidate can satisfy it. A hybrid — refresh
after land, and read through the ref only on the paths where staleness is
correctness-critical, such as the ledger's find-before-minting check — is also
open.

## Ordering

This does not block `tactic-graph-ref-split`, and ref-split does not block this.
The same coherence defect exists on today's mechanism, so a fix aimed at the
current writer is worth landing before the cutover — and would then need
re-pointing at `GRAPH_WT` as part of Unit 3 rather than being re-invented there.
