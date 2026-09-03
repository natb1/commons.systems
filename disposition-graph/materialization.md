---
question: What is materialized implementation, and where does it live?
stage: ruling
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/model
tier: global
defines:
  - materialized implementation
  - package
  - greenfield ref
shims:
  - artifact: the `greenfield` ref, carrying the materialized implementation beside the incumbent code on `main`
    for: the implementation ref this node names
    liquidation: "`greenfield` is swapped with `main` at bootstrap exit, after whatever on `main` is to survive has been reconciled into `greenfield` under a supporting disposition, and the scope node has been ruled on what the record covers"
    declared: 2026-09-02
  - artifact: "`packages/disposition` importing the `yaml` package from an ancestor `node_modules`, with no dependency manifest of its own"
    for: the package's dependency declaration
    liquidation: the package declares its dependencies and the workspace installs them
    declared: 2026-09-02
---
## Disposition

The author, 2026-09-03:
> general disposition is that all materialized implementation (including the browser) is a projection of the graph - anything not justified by the graph is subject to liquidation through reconciliation. "implementation unit" kind of makes it sound like we are recording transient dispositions - ensure that we are not.

## Answer

Everything written to a repository other than the graph itself: code, skills, rules, pages, and the graph's own tooling. The disposition ref stores the graphs and only the graphs, the manifest and the node files. All materialized implementation is a projection of the graph, the browser and the graph's own tooling included: each artifact is the instrument or the projection of the node whose answer it checks or renders, and anything no disposition justifies is unsupported implementation, on the frontier and liquidated through reconciliation, where pruning is proposed and the author rules on it. Materialized implementation is organized by the JavaScript monorepo convention: one repository, a root manifest declaring workspaces, and one directory per package under `packages/`.

## Rationale

The author's rulings of 2026-09-02, and of 2026-09-03 that all materialized implementation, the browser included, is a projection of the graph and that anything the graph does not justify is liquidated through reconciliation. Keeping the disposition ref to the graph alone keeps its writes small, its history legible, and its readers simple; tooling changes never land as graph changes. The monorepo convention is the tradition of Lerna (2015), Yarn workspaces (2017), and npm workspaces (npm 7, 2020), themselves descendants of the single-repository practice described by Potvin and Levenberg (2016); a reading is owed. The incumbent repository already uses `packages/`, which is evidence, not authority. The third ref has one consequence to keep in view: whatever on `main` is to survive the swap must be reconciled into `greenfield` under a supporting disposition before exit, or it is pruned by the swap. The author, 2026-09-03: "general disposition is that all materialized implementation (including the browser) is a projection of the graph - anything not justified by the graph is subject to liquidation through reconciliation. 'implementation unit' kind of makes it sound like we are recording transient dispositions - ensure that we are not." This node binds every session that writes to the implementation ref, subagents included, so it is projected as a rule.


## Proposal

### Sitting on purpose, 2026-09-03

**The materialization node, whole, as recorded today**

As recorded today: the general disposition in the answer, the third ref and the yaml import declared as shims. Here for the ruling on the whole.

Facts: authority ratified; boldness low; persistence standing; two shims.

Proposed: the node as it stands.

Rulings open: ratify as shown; ratify with edits; defer; overrule.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Rationale carries a tradition reference in prose: 'The monorepo convention is the tradition of Lerna (2015), Yarn workspaces (2017), and npm workspaces ... Potvin and Levenberg (2016); a reading is owed.' Readings in this batch forbids it and the author ruled against it on 2026-09-02. Suggested edit: move it to a reading or to the traditions graph before landing.
- Frontmatter 'tier: global', but .claude/rules/ on the implementation ref holds only authority, delegation, evaluation and session-context. The projector selects tier global, so the rules directory is stale and session-context's claim of one file per global-tier node is currently false. Suggested edit: regenerate before landing, or state the gap as a frontier item.
- Answer, sentence 3: 'anything no disposition justifies is unsupported implementation, on the frontier and liquidated through reconciliation.' An executor could read this as licence to delete. Work-loop says the reconciler 'proposes a disposition that would support it ... or proposes pruning it, and the author rules at review'. Suggested edit: add that liquidation is a proposal the author rules on, not an action the reconciler takes.

On the three facts: Ratified, low boldness, standing is right for the general disposition the author stated verbatim on 2026-09-03. The facts must also carry each shim's liquidation condition; without them the author cannot see that the greenfield shim's condition is a prune.

Strongest counter-argument (strong): Ratifying this node arms a deletion whose scope is unruled. The greenfield shim's liquidation is that greenfield is swapped with main at exit 'after whatever on main is to survive has been reconciled into greenfield under a supporting disposition'. Scope, at stage periagogic and unanswered, names twelve recorded functions, of which four fall outside purpose as worded: three consumer apps and their backend, the public site and blog, a tabletop-gaming blog, and about twenty libraries plus the author's host configuration. Its own text says 'functions 9 to 12 need an answer before then'. So the standing rule that everything unjustified is pruned is being ratified while the question of what counts as justified is still open, and the failure mode is silent and irreversible at the swap. The mitigation is to ratify with the swap held until scope is answered, which the shim's liquidation condition can carry.

The session's reply: Accepted. The swap is now held by the scope ruling: the greenfield shim's liquidation names it as of 2026-09-03, and the answer now says that liquidation through reconciliation is a pruning proposed for the author's ruling, not an action the reconciler takes. The rules directory was regenerated the same day and carries this node. The tradition reference in the rationale is one of the eleven owed to the stub-traditions ruling.
