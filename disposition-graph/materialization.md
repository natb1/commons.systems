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
ledger: L25
---
## Answer

Everything written to a repository other than the graph itself: code, skills, rules, pages, and the graph's own tooling. The disposition ref stores the graphs and only the graphs, the manifest and the node files. All materialized implementation is justified by disposition, the graph's tooling included: each tool is the instrument of the node whose answer it checks or projects, and a tool no disposition cites or instruments is unsupported implementation on the frontier. Materialized implementation is organized by the JavaScript monorepo convention: one repository, a root manifest declaring workspaces, and one directory per package under `packages/`. As a shim to avoid conflicts with incumbent code, the greenfield implementation is kept during bootstrap on a third ref, `greenfield`, which is swapped with `main` at bootstrap exit.

## Rationale

The author's rulings of 2026-09-02 (ledger L25 to L28). Keeping the disposition ref to the graph alone keeps its writes small, its history legible, and its readers simple; tooling changes never land as graph changes. The monorepo convention is the tradition of Lerna (2015), Yarn workspaces (2017), and npm workspaces (npm 7, 2020), themselves descendants of the single-repository practice described by Potvin and Levenberg (2016); a reading is owed. The incumbent repository already uses `packages/`, which is evidence, not authority. The third-ref shim has one liquidation condition, the swap at exit, and one consequence to keep in view: whatever on `main` is to survive the swap must be reconciled into `greenfield` under a supporting disposition before exit, or it is pruned by the swap.
