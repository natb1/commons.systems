---
question: Where does a tradition node live?
stage: ruling
recommendation:
  class: ratified
  boldness: moderate
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: 848aff5b9ecff9467e39717cc2fdb272394a3233
under:
  - commons.systems/disposition-graph/readings
---

## Proposal

### Sitting on purpose, 2026-09-03

**Where traditions live**

A tradition is a mount. It could be a graph of its own; until it is, it is one root node carrying its name and primary references. The manifest already carries a second graph, public, with a declared move.

Options:
- (recommended) One traditions graph on this ref, one root node per tradition — authority ratified; boldness moderate; persistence standing
- A graph per tradition — authority ratified; boldness moderate; persistence standing
- Tradition nodes inside the disposition graph — authority ratified; boldness low; persistence standing

Feeds: `readings`, `namespaces`, `harness-tradition`, `stub-traditions`

Responses open: confirm the recommended option; confirm with edits, naming another option; deny with feedback.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The option does not say what a tradition node contains (question, answer, form, stamp) or what authority class an unread tradition root carries. Stub-traditions proposes about thirty of them as open questions, so thirty unstamped roots would enter the record at once and, under transience, all thirty are the author's queue. Suggested edit: state the shape of a tradition root and the expected queue effect.
- The manifest edit is part of the option and is not shown. Namespaces' draft and readings' draft both assume the graph exists; the manifest today carries only disposition-graph and public.
- The manifest's other non-primary graph, public, carries a target and a liquidation condition because it will move. A traditions graph has neither, and the author's own model is that a tradition 'could theoretically be represented by its own graph'. Suggested edit: say whether a tradition that acquires its own repository is a mount that moves, and what happens to its id.

On the three facts: Ratified, moderate boldness, standing is right for the recommended option. The facts should add the manifest edit and the approximate number of stub nodes the ruling admits.

Strongest counter-argument (weak): Option 2, a graph per tradition, matches the author's stated model exactly: a mount that 'could theoretically be represented by its own graph with its own arche and its own reference to traditions'. Under option 2 a tradition that later acquires its own graph needs no migration, because it already is one; under option 1 it needs a directory move and a prefix rewrite, which is the same liquidation the public graph carries and which web-routing's adopted principle is uneasy with. The cost of option 2 is many near-empty manifests, which is real but cheap. Worth one line rather than a re-opening.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The option does not say what a tradition node contains (question, answer, form, stamp) or what authority class an unread tradition root carries. Stub-traditions proposes about thirty of them as open questions, so thirty unstamped roots would enter the record at once and, under unanswered, all thirty join the author's queue — which is already forty-eight nodes at review or ruling. Suggested edit: state the shape of a tradition root and the queue effect.
- The manifest edit is part of the option and is not shown. Verified: disposition/disposition.yaml carries only disposition-graph and public. Both readings' draft and namespaces' draft assume the traditions graph exists.
- The manifest's other non-primary graph, public, carries a target and a liquidation condition because it will move; a traditions graph has neither, and the author's model is that a tradition could be represented by its own graph. Web-routing has since adopted a principle that makes such a move owe redirects.
- Forms' reply defers to this node's parent: 'Whether a tradition carries a form of its own is put to the readings ruling.' Node's draft meanwhile makes tradition a form. The question lands here in practice and is not among the options.

On the three facts: The frontmatter recommendation (ratified, moderate) is right for the recommended option. The facts should add the manifest edit and the approximate number of stub nodes the ruling admits, since that is the ruling's largest consequence and it lands on the author's queue.

Strongest counter-argument (moderate): Option 2, a graph per tradition, matches the author's stated model exactly: a mount that could theoretically be represented by its own graph with its own archē and its own references. Under option 2 a tradition that later acquires its own graph needs no migration, because it already is one; under option 1 it needs a directory move and a prefix rewrite — the same liquidation the public graph carries and the one web-routing's adopted principle is uneasy with. The cost of option 2 is many near-empty manifests, which is real but cheap, and the record has just adopted a principle that prices the alternative.

The session's reply: Validated. A tradition root carries what any node carries, a question, an answer, a form, a stamp, entering as an un-aligned disposition; the manifest entry is one graph beside public, with no target and no liquidation because it declares no move; and the stub-traditions node proposes about thirty such roots, which join the queue in rank order. Whether a tradition is a form is settled here or at node. On the counter-argument, one graph per tradition: the record adopts one graph now and pays the move if a tradition outgrows it, with redirects. Stage ruling.

### Frontier finding, 2026-09-03

Kind: placement.

Two ruling-stage nodes rest on maieutic ground without saying so. Rationale-edge is at ruling under under, which is at maieutic with 'Proposed: pending' and no draft, and under's own Proposal says its text is 'Drafted after q14, q15, and q16 are ruled' — one of which, tier, was kicked back and its recommendation withdrawn, so under cannot be drafted as planned. Separately, readings' draft and namespaces' draft both presume a traditions graph that traditions-home would create, and traditions-home is at ruling but is listed as a dependency of both; the manifest edit that would create the graph is shown on none of the three.

Also named: commons.systems/disposition-graph/rationale-edge, commons.systems/disposition-graph/under, commons.systems/disposition-graph/tier, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/namespaces.

Proposed: Rule traditions-home before readings and namespaces, and show the manifest entry on traditions-home so the author sees what they are creating. Rule rationale-edge and re-answer tier before under, and add to rationale-edge one clause saying its parent is unanswered. Under is then drafted from the three outcomes, simplified as the decomposition finding proposes.
