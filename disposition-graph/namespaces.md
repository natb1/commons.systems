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
ledger: L03
---
## Answer

By import path, as Go names packages. A repository is a module named by its path, `commons.systems`; it may carry several graphs on its `disposition` ref, as a module carries several packages; a node's id is module, graph, and slug: `commons.systems/disposition-graph/purpose`. References across graphs and across repositories are the same path. A graph that will move declares its target in the manifest: `commons.systems/public` is the public part of the author's personal disposition, hosted here during bootstrap, and moves to `natb1.com/public` when a repository answers there. That declaration is the mount shim, and its liquidation is a directory move and a prefix rewrite of ids.

## Rationale

The author's ruling of 2026-09-02. Traditions to record as readings: Go modules, whose `replace` directive is the shim's model; Unix mount namespaces, which map a path prefix to another tree. Ledger L03.
