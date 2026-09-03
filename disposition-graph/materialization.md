---
question: What is materialized implementation, and where does it live?
stage: review
recommendation:
  class: ratified
  boldness: low
review:
  verdict: forward
  strength: strong
  date: 2026-09-03
  of: e47a9f5936f7d8e33eae62c1e0037c69ad3d2f35
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
    liquidation: "`greenfield` is swapped with `main` at bootstrap exit, after whatever on `main` is to survive has been reconciled into `greenfield` under a supporting disposition, and the coverage node has been ruled on what the record covers"
    declared: 2026-09-02
  - artifact: "`packages/disposition` resolving the `yaml` package it declares from an ancestor `node_modules`, the workspace not installing it"
    for: the package's dependency declaration
    liquidation: the workspace installs the package's declared dependencies
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

Responses open: confirm as shown; confirm with edits; deny with feedback.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Rationale carries a tradition reference in prose: 'The monorepo convention is the tradition of Lerna (2015), Yarn workspaces (2017), and npm workspaces ... Potvin and Levenberg (2016); a reading is owed.' Readings in this batch forbids it and the author ruled against it on 2026-09-02. Suggested edit: move it to a reading or to the traditions graph before landing.
- Frontmatter 'tier: global', but .claude/rules/ on the implementation ref holds only authority, delegation, evaluation and session-context. The projector selects tier global, so the rules directory is stale and session-context's claim of one file per global-tier node is currently false. Suggested edit: regenerate before landing, or state the gap as a frontier item.
- Answer, sentence 3: 'anything no disposition justifies is unsupported implementation, on the frontier and liquidated through reconciliation.' An executor could read this as licence to delete. Work-loop says the reconciler 'proposes a disposition that would support it ... or proposes pruning it, and the author rules at review'. Suggested edit: add that liquidation is a proposal the author rules on, not an action the reconciler takes.

On the three facts: Ratified, low boldness, standing is right for the general disposition the author stated verbatim on 2026-09-03. The facts must also carry each shim's liquidation condition; without them the author cannot see that the greenfield shim's condition is a prune.

Strongest counter-argument (strong): Ratifying this node arms a deletion whose scope is unruled. The greenfield shim's liquidation is that greenfield is swapped with main at exit 'after whatever on main is to survive has been reconciled into greenfield under a supporting disposition'. Scope, at stage periagogic and unanswered, names twelve recorded functions, of which four fall outside purpose as worded: three consumer apps and their backend, the public site and blog, a tabletop-gaming blog, and about twenty libraries plus the author's host configuration. Its own text says 'functions 9 to 12 need an answer before then'. So the standing rule that everything unjustified is pruned is being ratified while the question of what counts as justified is still open, and the failure mode is silent and irreversible at the swap. The mitigation is to ratify with the swap held until scope is answered, which the shim's liquidation condition can carry.

The session's reply: Accepted. The swap is now held by the scope ruling: the greenfield shim's liquidation names it as of 2026-09-03, and the answer now says that liquidation through reconciliation is a pruning proposed for the author's ruling, not an action the reconciler takes. The rules directory was regenerated the same day and carries this node. The tradition reference in the rationale is one of the eleven owed to the stub-traditions ruling.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Frontmatter, second shim: the artifact is '`packages/disposition` importing the `yaml` package from an ancestor `node_modules`, with no dependency manifest of its own'. Verified stale: packages/disposition/package.json exists and declares '"dependencies": { "yaml": "^2" }', so half the liquidation condition ('the package declares its dependencies') is met and the artifact's own description is now false. The other half is not met: there is no node_modules under the worktree and 'yaml' resolves from an ancestor. Transience: 'a shim whose condition is met and which still exists is a frontier item.' Suggested edit: restate the artifact as the ancestor resolution alone.
- Answer, sentence 3: now reads that unsupported implementation is 'on the frontier and liquidated through reconciliation, where pruning is proposed and the author rules on it', which answers the previous review. Verified consistent with work-loop.
- Frontmatter 'tier: global': verified that .claude/rules/materialization.md now exists, so the previous review's finding is resolved and the rules directory holds exactly the five global-tier nodes. The Proposal should say that a kickback or overrule here changes what sessions are running under today.
- Rationale carries a prose tradition reference (Lerna, Yarn workspaces, npm workspaces, Potvin and Levenberg), which readings' draft forbids; stub-traditions names this node.

On the three facts: The frontmatter recommendation (ratified, low) is right for a general disposition the author stated verbatim. The prose Facts line 'persistence standing; two shims' does not carry each shim's liquidation condition, which growth's presentation rule requires and the previous review asked for; and one of the two shims now misdescribes its own artifact.

Strongest counter-argument (strong): Ratifying this node arms a deletion whose scope is unruled: the greenfield shim's liquidation is the swap of greenfield with main, and coverage, at the periagogic stage, names four recorded functions outside the purpose as worded. The mitigation the session added — the shim's liquidation now names the scope ruling as a condition — is real and verified in the shim text. The residual risk is that the condition names 'the scope node' while the coverage question moved to the coverage node on the same day, so the shim as written may be satisfied by a scope ruling that leaves coverage open.

The session's reply: Validated: the package declares its dependency and the workspace does not install it. Amended tonight: the second shim names the ancestor resolution alone, and the greenfield shim's condition names the coverage node, where the question the counter-argument raises now lives. The rules directory holds this node's projection, so a kickback here changes what sessions run under, which the sitting says. The traditions in the rationale go to readings. Stage review: the shims changed.

### Frontier finding, 2026-09-03

Kind: coverage.

Two declared shims fail transience's own requirement that a shim name an artifact that exists and a liquidation condition the frontier can read. Session-context declares '`.claude/settings.json` on the implementation ref, harness configuration the author writes at the transition of 2026-09-03': verified that no settings.json is tracked on greenfield (git ls-files lists only .claude/rules/* and .claude/skills/*), and .gitignore excludes only .claude/settings.local.json, so the artifact is not on the ref at all. Materialization declares '`packages/disposition` importing the `yaml` package from an ancestor `node_modules`, with no dependency manifest of its own': verified that packages/disposition/package.json exists and declares yaml as a dependency, so the artifact's description is false and half its liquidation condition is met. Transience: 'a shim whose condition is met and which still exists is a frontier item', and the flagging of a met condition is itself unmaterialized, so neither shows anywhere.

Also named: commons.systems/disposition-graph/session-context, commons.systems/disposition-graph/transience.

Proposed: Session-context either commits .claude/settings.json to the implementation ref, which is what its own shim says, or restates the artifact as harness configuration held outside the ref with that as part of the liquidation condition. Materialization restates its second shim as the ancestor node_modules resolution alone, the manifest half being met. Transience's instrument note is upgraded to a declared shim for the unmaterialized flagging, as its own reviewer asked and as its rule requires.
