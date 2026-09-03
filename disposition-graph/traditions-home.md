---
question: Where does a tradition node live?
stage: review
recommendation:
  adopts: one-traditions-graph
  class: ratified
  boldness: moderate
  amends: "848aff5b9ecff9467e39717cc2fdb272394a3233"
  at: "6d21d356d65f5fa206cb60bc3e923c462acc920e"
alternatives:
  - name: one-traditions-graph
    source: ai
    ref: "2026-09-03"
  - name: graph-per-tradition
    source: ai
    ref: "2026-09-03"
  - name: nodes-inside-disposition-graph
    source: ai
    ref: "2026-09-03"
  - name: show-the-manifest-entry
    source: review
    ref: "2026-09-03"
under:
  - commons.systems/disposition-graph/readings
---
## Alternatives

### one-traditions-graph

The recommended option: one traditions graph on this ref, with one root node per tradition, added to the manifest beside the disposition graph and the public graph. A tradition root carries what any node carries, a question, an answer, a form and a stamp, and enters as an un-aligned disposition; the manifest entry declares no move, so unlike the public graph it carries no target and no liquidation condition. If a tradition later outgrows it, the record pays a directory move and a prefix rewrite with redirects.

### graph-per-tradition

One graph per tradition, which the review's strongest counter-argument prefers because it matches the author's own model exactly: a mount that could be represented by its own graph with its own archē and its own references. A tradition that later acquires its own repository needs no migration because it already is one, where the recommended option needs the same liquidation the public graph carries and that web-routing's adopted principle is uneasy with. Its cost is many near-empty manifests, which the reviewer calls real but cheap.

### nodes-inside-disposition-graph

Tradition nodes inside the disposition graph itself, with no new graph and no manifest edit, at low boldness. It is the cheapest option and the one the sitting ranks last; against it, stub-traditions proposes about thirty tradition roots, which would enter the disposition graph's rank order and the author's alignment queue directly rather than as a graph of their own.

### show-the-manifest-entry

Two readings of namespaces found that its draft creates a traditions graph the manifest does not carry, verified against disposition.yaml, and that the manifest edit is part of what the author would be confirming and is shown nowhere; the session's reply moved that obligation here, since traditions-home is ruled first. The placement finding of 2026-09-03 asks the same: rule traditions-home before readings and namespaces, and show on it the manifest entry the author is creating, with whatever target and liquidation the traditions graph needs. (Raised on commons.systems/disposition-graph/namespaces.) Also raised on commons.systems/disposition-graph/under.

## Recommendation

```markdown
---
question: Where does a tradition node live?
form: rule
authority:
  class: ratified
  by: Nathan Buesgens
  date: <the date of the ruling>
under:
  - commons.systems/disposition-graph/readings
---
## Answer

In a traditions graph of its own on this ref, one root node per tradition, declared in the manifest beside the disposition and public graphs. The entry carries no target and no liquidation condition, because the graph declares no move. A tradition root is a node like any other, a question, an answer, a form and a stamp, carrying the name it defines and its primary references, and it enters as an un-aligned disposition until the author has read it; the roots the stub-traditions node proposes join the author's queue in rank order like any other node. A tradition that outgrows the graph and acquires a repository of its own becomes a mount, and the record pays the move then, with redirects from the ids it had.

## Rationale

A tradition is a mount, and one graph gives every tradition an addressable home today at the cost of one manifest entry, where the alternative pays many near-empty manifests for a migration most traditions will never need. The manifest already carries a second graph, so the shape is proven and the readings and namespaces answers that assume a traditions graph can rest on it. Rejected: a graph per tradition, which matches the author's model that a tradition could be represented by its own graph but multiplies manifests for a case that has not arisen; and tradition nodes inside the disposition graph, because a tradition is not a disposition of this record's own and about thirty roots would enter the graph the author reads as their queue. The move a tradition may later make is the same liquidation the public graph carries, and web-routing's adopted principle makes it owe redirects, which is the price this answer accepts.
```

## Account

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

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `one-traditions-graph` (ai, 2026-09-03); `graph-per-tradition` (ai, 2026-09-03); `nodes-inside-disposition-graph` (ai, 2026-09-03); `show-the-manifest-entry` (review, 2026-09-03, from commons.systems/disposition-graph/namespaces).
The recommendation adopts `one-traditions-graph` and is pinned to the standing text as it was at that commit. The recommended text was drafted at the re-encoding from the option the account marks recommended, so that the recommendation adopts an alternative with a text and not only a name; the earlier review read the options and not this text, so it is removed and the node returns to the review stage for the clean-context review of the batch.
Moved to other nodes as alternatives: `parent-unanswered-clause` on commons.systems/disposition-graph/rationale-edge; `draft-after-three-rulings` on commons.systems/disposition-graph/under.
The census unit's note: The node has no `## Answer` and no draft fence: its recommendation is one of three options listed in the account, so I named all three as alternatives and made the recommendation adopt the one marked recommended. Both reviews' findings — that the option does not say what a tradition root contains or what it does to the author's queue, and that the manifest edit is part of the option and is shown nowhere — were answered in the session's reply and are folded into the recommended option's text rather than minted as separate candidates. Whether a tradition is itself a form is left open by forms, node and this node's reply; I judged it a different question and did not make it an alternative here. The node has no `## Disposition` section, so there is no author text to merge. The placement finding's proposals for rationale-edge and under are moved to those nodes.
