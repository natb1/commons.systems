# intentions/

A read-only, backfilled, point-in-time snapshot of the project's intention
tree. Each `*.md` file is one intention node — the same uniform node model at
every altitude — stored as YAML frontmatter with a cosmetic `# <statement>`
body. The schema and store live in `../intentionsutil/`.

## Regenerating

This directory is generated, not hand-edited. Regenerate it with:

```
npx tsx intentionsutil/scripts/backfill.ts
```

The script is strictly read-only toward GitHub (only `gh api` GETs). It
overwrites the node files from current state, so manual edits will be lost.

## Not yet consumed

Nothing else reads this snapshot yet. It exists so the intention-tree model has
real data to validate against; wiring it into the dispatch chain, office-hours,
or any other system is later work.

## The two node layers

The snapshot contains two layers that share one id space:

- **Principle roots** (`principle-*.md`) — parsed from the `## Principles`
  section of the repo-root `CHARTER.md`. One node per `### <Title>` subsection,
  with `parent: null` (roots), `status: codified`, and the subsection prose as
  `rationale`.
- **Issue leaves** (`issue-*.md`) — one node per open GitHub issue (pull
  requests excluded), `status: raw`. Leaves are linked to one another by the
  existing GitHub issue hierarchy: a node's `parent` is set to its GitHub parent
  issue only when that parent is itself an open issue in the snapshot. A parent
  that is closed (no node file) is nulled, so every non-null `parent` points to
  a node file that exists.

## Deferred: cross-layer linking

There is intentionally **no** link between the principle layer and the issue
layer. Connecting issues to the principles they serve is deferred dialectic
work in a later epic stage.
