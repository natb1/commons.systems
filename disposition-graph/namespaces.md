---
question: How are nodes named across graphs?
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
## Answer

By import path, as Go names packages. A repository is a module named by its path, `commons.systems`; it may carry several graphs on its `disposition` ref, as a module carries several packages; a node's id is module, graph, and slug: `commons.systems/disposition-graph/purpose`. References across graphs and across repositories are the same path. A graph that will move declares its target in the manifest, and that declaration is a shim whose liquidation is a directory move and a prefix rewrite of ids.

## Rationale

The author's ruling of 2026-09-02. Traditions to record as readings: Go modules, whose `replace` directive is the shim's model; Unix mount namespaces, which map a path prefix to another tree.
