# trackers/

The **execution-state parallel store** — one `<id>.json` per intention node that
has been emitted or linked to a GitHub issue. Each file mirrors the current
execution state of that node's corresponding issue, and is separate from the
intention tree in `../intentions/`.

## Record shape

Each `<id>.json` is an `ExecutionTracker` record (schema in
`../intentionsutil/src/tracker.ts`):

- `node_id` — the intention node id (matches the filename stem); the `node_id`↔`issue_number` pair is the mapping.
- `issue_number` — the GitHub issue number this node was emitted or linked to.
- `state` — the issue's current state: `"open"` or `"closed"`.
- `linked_prs` — PRs associated with this issue (by branch-prefix convention or
  GraphQL closing references), each with a `number` and `state`
  (`"open"` | `"closed"` | `"merged"`).
- `dispatch_labels` — the `dispatch:*` labels currently on the issue (sorted).
- `refreshed_at` — ISO 8601 timestamp of the last refresh.

## Written by two paths only

Tracker files are written by exactly two paths:

1. **`intentionsutil/scripts/refresh.ts`** — the read-only GitHub→tree
   execution-state refresh. It is strictly read-only toward GitHub (only
   `gh api` GETs); it writes no GitHub issues or comments.
2. **The `intention-emit` path** — when a node is emitted to a new GitHub issue
   (or linked to an existing one), `refresh.ts` is called as the final step to
   create/update the tracker record.

These are the only writers. Nothing else creates or overwrites files in this
directory.

## Regenerating

Regenerate all tracker files (re-syncs from GitHub for every mapped node):

```
npx tsx intentionsutil/scripts/refresh.ts
```

Refresh a single node:

```
npx tsx intentionsutil/scripts/refresh.ts <node-id>
```

Both forms are strictly read-only toward GitHub.

## Transitional: trackers mirror the GitHub projection, read-only

The graph is the authoritative source of truth for all data; GitHub is an
optional, derived projection. During the transition, execution state still
syncs from GitHub — the gh-derived fields via backfill, and issue open/closed,
linked PRs, and dispatch labels via this directory. Three migration steps
govern where that transition is headed: (1) make the graph a correct source of
truth for all data — the current change; (2) incrementally migrate the
dispatch router from working on GitHub to working on the graph — future work;
(3) optionally re-establish full GitHub integration (design TBD) — future
work.

Today — before step (2) lands — trackers remain a derived, read-only mirror:
tracker files are **NEVER** validated through `validateNode` or written
through `writeNode`. The non-import of `writeNode` in `refresh.ts` is the
diff-checkable expression of that. Execution state — issue open/closed, PR
states, dispatch labels — is always read from GitHub and mirrored here; it is
never inferred from or written back into the intention node files. That
one-way-mirror mechanic is accurate today, but it is transitional scaffolding,
not a permanent authority split — once the router works directly on the
graph, this directory's role may shrink or disappear.

## Why a separate top-level directory

Keeping trackers here rather than inside `intentions/` has two concrete reasons:

1. The backfill's prune step deletes only gh-backed tactics (frontmatter
   `attributes.source: github:<owner>/<repo>#<N>`) whose issue has closed —
   never a hand-authored tactic (no `attributes.source`). A tracker file living
   inside `intentions/` would be orphaned whenever its node was pruned.
2. The physical separation keeps the transitional GitHub-projection mirror out
   of the graph's own store: one authority (the graph), with this directory
   holding the derived, one-way mirror from GitHub.

## Reconstructibility

Every tracker is reconstructible from the `<!-- intention:node-id -->` stamp
comment that `intention-emit` posts on the corresponding GitHub issue. If this
directory is deleted or a file goes stale, `refresh.ts` regenerates it from
those stamps and current GitHub state.
