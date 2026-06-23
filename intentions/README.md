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
regenerates only the `issue-*.md` leaves from current GitHub state; the
`principle-*.md` roots are left untouched.

## Not yet consumed

Nothing else reads this snapshot yet. It exists so the intention-tree model has
real data to validate against; wiring it into the dispatch chain, office-hours,
or any other system is later work.

Execution state (issue open/closed, linked PRs, dispatch labels) lives in
`../trackers/`, never in `intentions/`. The two stores are kept physically
separate by design: the tree owns intention, GitHub owns execution.

## The two node layers

The snapshot contains two layers that share one id space:

- **Principle roots** (`principle-*.md`) — authoritative, hand-maintained,
  parent-less nodes (`parent: null`), `status: codified`, with the principle
  prose as `rationale`. Backfill does not generate or prune these files; they
  are edited directly and committed like any other source file.
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
