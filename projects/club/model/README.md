# The club model — one source, three consumers

Every number this project states about the venture's economics comes from
`model.mjs`. The interactive [benchmark explorer](../claude/benchmark-explorer.md)
and the written documents used to hold two independent copies of the same model,
and they drifted: the matrix doc's cells were built on a café margin the explorer
had since corrected, §6 printed an owner-comp figure its own column arithmetic
contradicted, and the "SN/HT: subtract ~$22K per cell" shortcut survived in one
place after being shown wrong in the other. There is now one model, and the page
and the prose are both generated from it.

## The files

| File | What it is |
|---|---|
| `model.mjs` | The model: the plan's §5/§6 marks, the wage rungs, the derivations, and the levers. The single source of truth. Written in the artifact's own dialect (`var`, ES5 functions, no imports, DOM-free) because it is spliced into the published page verbatim. |
| `figures.mjs` | The reading side: named scalar `FIGURES` and whole-table `BLOCKS` that the documents and the artifact's notes card consume. |
| `render.mjs` | Writes both. `node model/render.mjs` regenerates everything; `--check` fails when anything is stale. |
| `verify.mjs` | The model's invariants — the §6 reproduction, the solved operations split, the marginals, the levers that must not move owner comp. |

## Changing the model

```sh
cd projects/club
$EDITOR model/model.mjs        # or figures.mjs, for how a number is presented
node model/verify.mjs          # the invariants still hold
node model/render.mjs          # rewrite the artifact source and every document
git diff                       # every downstream change, in one review
```

Never edit a generated figure in a document — the next render will overwrite it,
and in the meantime the docs and the page disagree, which is the failure this
directory exists to prevent. `node model/render.mjs --check` is the gate: it
exits non-zero and names the stale files.

## The three kinds of generated region

- **The model itself**, spliced into `claude/benchmark-explorer-src.html`
  between `// model:begin` and `// model:end`. The published page's model bytes
  are `model.mjs`'s bytes, re-indented with `export` stripped — nothing else is
  transformed, so a diff between the two is a whitespace-and-keyword diff by
  construction.
- **Blocks** — `<!-- model:begin <name> -->` … `<!-- model:end <name> -->` —
  filled by the matching entry in `BLOCKS`. Whole tables: the pro forma, the
  sensitivity rows, the matrices, the wage rungs, the notes card's two mini
  tables. Works in markdown and in the artifact's HTML.
- **Spans** — `<!--m:<name>-->$43K<!--/m-->` — filled from `FIGURES`. One number
  inside authored prose. The prose stays hand-written; only the number is
  generated, so a sentence's argument is the author's and its arithmetic is the
  model's.

An unknown block or figure name is an error, not a silent no-op: the renderer
names the file and the missing entry.

## What is deliberately not generated

Argument, judgment, and history. The plan's decision log, the notes card's
account of what an earlier revision got wrong, the evidence caveats in
`../validation/` — those are authored, including the numbers inside them that
describe superseded models (the retired $107K site basis, the 60.6% café margin,
the figures §6 printed through v0.3.3). A generated figure states what the model
says today; a historical one states what a document once said, and rewriting it
would erase the record.

## Deploying the artifact

The model reaching the published page is a separate step from the model reaching
the repo — see `.claude/rules/published-artifacts.md`. In short: preview from the
second artifact while the change is in flight, and after the PR merges, deploy
`claude/benchmark-explorer-src.html` from main to the live URL recorded in
`../claude/benchmark-explorer.md`.
