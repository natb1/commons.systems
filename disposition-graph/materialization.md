---
question: What is materialized implementation, and where does it live?
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/model
defines:
  - materialized implementation
  - package
  - greenfield ref
shims:
  - artifact: the `greenfield` ref, carrying the materialized implementation beside the incumbent code on `main`
    for: the implementation ref this node names
    liquidation: "`greenfield` is swapped with `main` at bootstrap exit, after whatever on `main` is to survive has been reconciled into `greenfield` under a supporting disposition"
    declared: 2026-09-02
  - artifact: "`packages/disposition` importing the `yaml` package from an ancestor `node_modules`, with no dependency manifest of its own"
    for: the package's dependency declaration
    liquidation: the package declares its dependencies and the workspace installs them
    declared: 2026-09-02
---
## Answer

Everything written to a repository other than the graph itself: code, skills, rules, pages, and the graph's own tooling. The disposition ref stores the graphs and only the graphs, the manifest and the node files. All materialized implementation is a projection of the graph, the browser and the graph's own tooling included: each artifact is the instrument or the projection of the node whose answer it checks or renders, and anything no disposition justifies is unsupported implementation, on the frontier and liquidated through reconciliation. Materialized implementation is organized by the JavaScript monorepo convention: one repository, a root manifest declaring workspaces, and one directory per package under `packages/`.

## Rationale

The author's rulings of 2026-09-02, and of 2026-09-03 that all materialized implementation, the browser included, is a projection of the graph and that anything the graph does not justify is liquidated through reconciliation. Keeping the disposition ref to the graph alone keeps its writes small, its history legible, and its readers simple; tooling changes never land as graph changes. The monorepo convention is the tradition of Lerna (2015), Yarn workspaces (2017), and npm workspaces (npm 7, 2020), themselves descendants of the single-repository practice described by Potvin and Levenberg (2016); a reading is owed. The incumbent repository already uses `packages/`, which is evidence, not authority. The third ref has one consequence to keep in view: whatever on `main` is to survive the swap must be reconciled into `greenfield` under a supporting disposition before exit, or it is pruned by the swap.
