# intentions/

A point-in-time snapshot of the project's intention tree. The `principle-*.md`
and `strategy-*.md` roots are authoritative and hand-maintained; the
`issue-*.md` leaves are backfilled from GitHub state. Each `*.md` file is one intention node — the same
uniform node model at every altitude — stored as YAML frontmatter with a
cosmetic `# <statement>` body. The schema and store live in
`../intentionsutil/`.

## Regenerating

This directory is generated, not hand-edited. Regenerate it with:

```
npx tsx intentionsutil/scripts/backfill.ts
```

The script is strictly read-only toward GitHub (only `gh api` GETs). It
regenerates only the `issue-*.md` leaves from current GitHub state; the
`principle-*.md` and `strategy-*.md` roots are left untouched.

## Not yet consumed

Nothing else reads this snapshot yet. It exists so the intention-tree model has
real data to validate against; wiring it into the dispatch chain, office-hours,
or any other system is later work.

Execution state (issue open/closed, linked PRs, dispatch labels) lives in
`../trackers/`, never in `intentions/`. The two stores are kept physically
separate by design: the tree owns intention, GitHub owns execution.

## The node layers

The snapshot contains three layers that share one id space:

- **Principle roots** (`principle-*.md`) — authoritative, hand-maintained,
  parent-less nodes (`parent: null`), `status: codified`, with the principle
  prose as `rationale`. Backfill does not generate or prune these files; they
  are edited directly and committed like any other source file.
- **Strategy roots** (`strategy-*.md`) — parent-less (`parent: null`),
  `status: codified`, hand-authored prioritization and domain-selection
  doctrine. Backfill neither generates nor prunes these files; they are
  preserved across regeneration alongside the principle roots.
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
