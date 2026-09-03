---
question: How are nodes named across graphs?
stage: ruling
recommendation:
  class: ratified
  boldness: moderate
review:
  verdict: forward
  strength: weak
  date: 2026-09-03
  of: 905dbc2b9536e4856734dec32a3fa98f72883043
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/model
defines:
  - id
  - module
  - mount
shims:
  - artifact: the `public` graph in this repository's manifest, the public part of the author's personal disposition hosted here
    for: the mount of `commons.systems/public` at `natb1.com/public`
    liquidation: a repository answers at natb1.com with a `disposition` ref; `public/` moves there and ids rewrite by prefix
    declared: 2026-09-02
---
## Disposition

The author, 2026-09-02:
> It is a mount because it could theoretically be represented by its own graph with its own arche and its own reference to traditions.

## Answer

By import path, as Go names packages. A repository is a module named by its path, `commons.systems`; it may carry several graphs on its `disposition` ref, as a module carries several packages; a node's id is module, graph, and slug: `commons.systems/disposition-graph/purpose`. References across graphs and across repositories are the same path. A graph that will move declares its target in the manifest, and that declaration is a shim whose liquidation is a directory move and a prefix rewrite of ids.

## Rationale

The author's ruling of 2026-09-02. Traditions to record as readings: Go modules, whose `replace` directive is the shim's model; Unix mount namespaces, which map a path prefix to another tree.


## Draft

```markdown
---
question: How are nodes named across graphs?
form: rule
authority:
  class: ratified
  by: Nathan Buesgens
  date: <the date of the ruling>
under:
  - commons.systems/disposition-graph/model
defines:
  - id
  - module
  - mount
shims:
  - artifact: the `public` graph in this repository's manifest, the public part of the author's personal disposition hosted here
    for: the mount of `commons.systems/public` at `natb1.com/public`
    liquidation: a repository answers at natb1.com with a `disposition` ref; `public/` moves there and ids rewrite by prefix
    declared: 2026-09-02
---
## Answer

By import path, as Go names packages. A repository is a module named by its path, `commons.systems`; it may carry several graphs on its `disposition` ref, as a module carries several packages; a node's id is module, graph, and slug: `commons.systems/disposition-graph/purpose`. References across graphs and across repositories are the same path. A graph may be a mount of what is not this project's own disposition: the traditions graph holds one root node per tradition this record reads, and a tradition that comes to have a graph of its own is reached by the same path. A graph that will move declares its target in the manifest, and that declaration is a shim whose liquidation is a directory move and a prefix rewrite of ids.

## Rationale

The author's ruling of 2026-09-02, and the model of a tradition as a mount that could be a graph of its own.
```

## Proposal

### Sitting on purpose, 2026-09-03

**The namespaces node, whole; a traditions graph**

A traditions graph is declared in the manifest beside the public graph, one root node per tradition, reached by the same import path as any node. The mount shim declared today stays.

Facts: authority ratified if q2 stands; boldness moderate; persistence standing.

Rejected:
- A graph per tradition. — One file per tradition suffices until a tradition is articulated; a graph each would be many near-empty manifests.

Depends on: `traditions-home`

Proposed text: the draft section of this node.

Rulings open: ratify as shown; ratify with edits; defer; overrule.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Draft Answer adds the traditions graph, but the manifest carries only disposition-graph and public. The manifest edit is part of what the author would be confirming and is not shown. Suggested edit: show the manifest entry.
- Draft frontmatter 'form: disposition' presumes the forms ruling; 'Depends on' lists only traditions-home.

On the three facts: Ratified if q2 stands, moderate boldness, standing, with the public-graph mount shim carried forward, is right as presented.

Strongest counter-argument (weak): The traditions graph inherits the manifest's shape for graphs that move (target and liquidation) but has neither, so the manifest would carry a graph of a third kind with no declared future. The author's own model is that a tradition 'could theoretically be represented by its own graph', which is a move this manifest entry does not anticipate. One line.
