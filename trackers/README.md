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

## Split-authority: execution state never flows through the intention model

Tracker files are **NEVER** validated through `validateNode` or written through
`writeNode`. The intention tree owns intention (`intentions/*.md`); GitHub owns
execution (`trackers/*.json`). The non-import of `writeNode` in `refresh.ts` is
the diff-checkable expression of that split.

This means execution state — issue open/closed, PR states, dispatch labels — is
always read from GitHub and mirrored here. It is never inferred from or written
back into the intention node files.

## Why a separate top-level directory

Keeping trackers here rather than inside `intentions/` has two concrete reasons:

1. The backfill's prune step deletes only `intentions/*.md`. A tracker file
   living there would be orphaned by any prune run.
2. The physical separation is the whole point: two stores, two authorities,
   one-way mirror from GitHub into this directory.

## Reconstructibility

Every tracker is reconstructible from the `<!-- intention:node-id -->` stamp
comment that `intention-emit` posts on the corresponding GitHub issue. If this
directory is deleted or a file goes stale, `refresh.ts` regenerates it from
those stamps and current GitHub state.
