# Idempotency — finding existing children and resuming a partial run

`/align-tactics` decomposes one strategy into N tactics, so idempotency is
**per-tactic**, not a single strategy-level marker. Before planning, read
the strategy's existing child tactics.

## Finding a strategy's children — the census script

```bash
node --import tsx/esm packages/intentionsutil/scripts/align-tactics-census.ts <strategy-id> [intentionsDir]
```

`intentionsDir` defaults to `intentions`. (`validate-graph.ts` no longer has
that default — its directory is a required argument, clarification 194/242 — so
this census script's default is now its own, not a shared convention.) It
first emits one serving-strategy block:

```
=== Serving strategy ===
id: strategy-<slug>
reading: <reading> | null
gap: <derived gap> | null
```

That `gap` is **derived**, never stored: the node carries no `gap`
frontmatter key, and the script computes it fresh via `deriveGap`
(`packages/intentionsutil/src/sensors.ts`), the same doctrine `attention`
follows. This block is the caller's source for the strategy's gap — read it
here rather than off the node.

It then finds every `kind: tactic` node whose `serves` includes
`<strategy-id>` and emits one blank-line-separated record per match:

```
id: tactic-<slug>
classification: draft | born-parked | open | done
phase: <phase> | null
office_hours.reason: <first line>      # born-parked children only
statement: <statement>
headings: <body "## " headings, " | "-joined, or "(none)">
```

A missing argument, an unknown id, or a non-`strategy` id throws — there is
no fallback and no silent default.

This replaces the hand-run grep/classify dance the section used to
describe. It matters because the store serializes arrays as YAML **block
sequences** (`serves:` on its own line, then `  - <strategy-id>`), so an
inline-flow grep for `serves: [<strategy-id>]` matches nothing, and the
line-anchored `grep -rl '^  - <strategy-id>$' intentions/tactic-*.md`
workaround has both false-matched a spec-carrier body and missed an
indirectly-affected tactic. The census resolves `serves` through the store
instead of matching text.

## Classifying each candidate

The census's `classification` field already applies the taxonomy below —
read it off the output rather than re-deriving it from a raw
`phase`/`office_hours` read:

- **`done`** — a tactic already at `phase: implement` with a plan in its
  body is done work; do not re-plan it.
- **`open`** — a `phase`-set, non-`done` child. A partial prior run (some
  tactics landed, some not) resumes by planning only what the census still
  reports as `open` or `draft`.
- **`draft`** (`phase` absent, `office_hours` unset) — **input**, not
  landed work: consumed by the strategy-target flow's decompose phase
  (finalize / split / merge / prune).
- **`born-parked`** (`phase` absent, `office_hours` **set**) — not an
  `/align`-retained draft but a born-parked tactic from a prior
  round, already-decided human-owned work. Skip it (at most reconfirm it is
  still needed); never run it through the finalize/split/merge/prune draft
  path. The census prints the first line of its `office_hours.reason` so
  that reconfirmation needs no extra read.

The `draft`-vs-`born-parked` split is the one distinction a raw `phase` read
cannot make — both are `phase`-absent, and only `office_hours` tells them
apart.

This same census is what the strategy-wide re-evaluation sweep uses to
enumerate a strategy's open children (see `references/tactic-target.md`).
