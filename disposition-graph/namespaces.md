---
question: How are nodes named across graphs?
stage: review
recommendation:
  adopts: draft
  class: ratified
  boldness: moderate
  amends: "75b18577aced0fec1e9425504e2d9e25328ef48c"
  at: "6d21d356d65f5fa206cb60bc3e923c462acc920e"
review:
  verdict: forward
  strength: weak
  date: 2026-09-03
  of: 905dbc2b9536e4856734dec32a3fa98f72883043
alternatives:
  - name: draft
    source: ai
  - name: traditions-graph-declares-move
    source: review
    ref: "2026-09-03"
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
    liquidation: a repository answers at natb1.com with a `disposition` ref; `public/` moves there and ids rewrite by prefix, with redirects from the old addresses, as the web-routing reading adopts
    declared: 2026-09-02
---
## Disposition

The author, 2026-09-02:
> It is a mount because it could theoretically be represented by its own graph with its own arche and its own reference to traditions.

## Answer

By import path, as Go names packages. A repository is a module named by its path, `commons.systems`; it may carry several graphs on its `disposition` ref, as a module carries several packages; a node's id is module, graph, and slug: `commons.systems/disposition-graph/purpose`. References across graphs and across repositories are the same path. A graph that will move declares its target in the manifest, and that declaration is a shim whose liquidation is a directory move and a prefix rewrite of ids.

## Rationale

The author's ruling of 2026-09-02. Traditions to record as readings: Go modules, whose `replace` directive is the shim's model; Unix mount namespaces, which map a path prefix to another tree.

## Alternatives

### draft

The draft adds to the standing answer one sentence creating the traditions graph: a graph may be a mount of what is not this project's own disposition, the traditions graph holding one root node per tradition the record reads, with a tradition that comes to have a graph of its own reached by the same path. It carries the same public-graph mount shim, now with the redirect obligation web-routing adopts, and a rationale naming the model of a tradition as a mount. It presumes traditions-home's recommended option, which is unruled, and the manifest entry that would create the graph is shown on traditions-home rather than here.

### traditions-graph-declares-move

The counter-argument, twice recorded: the traditions graph inherits the manifest's shape for graphs that move, a target and a liquidation, and has neither, so the manifest would carry a graph of a third kind with no declared future, while the author's own model is that a tradition could be represented by its own graph, a move this entry does not anticipate and which web-routing's adopted principle would make owe redirects. This alternative gives the traditions graph a declared target and liquidation like the public graph's, one line in the manifest entry, so that every graph in the manifest declares its future.

## Recommendation

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
    liquidation: a repository answers at natb1.com with a `disposition` ref; `public/` moves there and ids rewrite by prefix, with redirects from the old addresses, as the web-routing reading adopts
    declared: 2026-09-02
---
## Answer

By import path, as Go names packages. A repository is a module named by its path, `commons.systems`; it may carry several graphs on its `disposition` ref, as a module carries several packages; a node's id is module, graph, and slug: `commons.systems/disposition-graph/purpose`. References across graphs and across repositories are the same path. A graph may be a mount of what is not this project's own disposition: the traditions graph holds one root node per tradition this record reads, and a tradition that comes to have a graph of its own is reached by the same path. A graph that will move declares its target in the manifest, and that declaration is a shim whose liquidation is a directory move and a prefix rewrite of ids.

## Rationale

The author's ruling of 2026-09-02, and the model of a tradition as a mount that could be a graph of its own.
```

## Account

### Sitting on purpose, 2026-09-03

**The namespaces node, whole; a traditions graph**

A traditions graph is declared in the manifest beside the public graph, one root node per tradition, reached by the same import path as any node. The mount shim declared today stays.

Facts: authority ratified if q2 stands; boldness moderate; persistence standing.

Rejected:
- A graph per tradition. — One file per tradition suffices until a tradition is articulated; a graph each would be many near-empty manifests.

Depends on: `traditions-home`

Proposed text: the draft section of this node.

Responses open: confirm as shown; confirm with edits; deny with feedback.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Draft Answer adds the traditions graph, but the manifest carries only disposition-graph and public. The manifest edit is part of what the author would be confirming and is not shown. Suggested edit: show the manifest entry.
- Draft frontmatter 'form: disposition' presumes the forms ruling; 'Depends on' lists only traditions-home.

On the three facts: Ratified if q2 stands, moderate boldness, standing, with the public-graph mount shim carried forward, is right as presented.

Strongest counter-argument (weak): The traditions graph inherits the manifest's shape for graphs that move (target and liquidation) but has neither, so the manifest would carry a graph of a third kind with no declared future. The author's own model is that a tradition 'could theoretically be represented by its own graph', which is a move this manifest entry does not anticipate. One line.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Draft Answer adds the traditions graph, but the manifest carries only disposition-graph and public. Verified against disposition/disposition.yaml. The manifest edit is part of what the author would be confirming and is shown nowhere. Suggested edit: show the manifest entry in the Proposal.
- The previous review's finding that 'Draft frontmatter form: disposition presumes the forms ruling' is stale: the draft carries 'form: rule'. It should be struck rather than left standing beside the amended draft.
- Web-routing, in this same batch, adopts 'addresses do not change' from Berners-Lee while this node's shim liquidates by 'a directory move and a prefix rewrite of ids'. Web-routing's reply says the namespaces shim's liquidation 'should carry' the redirect obligation; it does not carry it. Suggested edit: add it in the same landing.
- Draft: 'a tradition that comes to have a graph of its own is reached by the same path' presumes traditions-home's recommended option, which is listed as a dependency but is itself unruled.

On the three facts: The frontmatter recommendation (ratified, moderate) is right, contingent on traditions-home. The prose Facts line says 'ratified if q2 stands', which names a question by a sitting label rather than a node id — the same defect as the three dangling 'Depends on' ids elsewhere in the batch.

Strongest counter-argument (weak): The traditions graph inherits the manifest's shape for graphs that move (target and liquidation) but has neither, so the manifest would carry a graph of a third kind with no declared future. The author's own model is that a tradition 'could theoretically be represented by its own graph', which is a move this manifest entry does not anticipate — and web-routing has just adopted a principle that makes such a move owe redirects. One line in the manifest entry would settle it.

The session's reply: Validated. Amended tonight: the public graph's shim carries the redirect obligation web-routing adopts, in the frontmatter and the draft. The manifest entry for the traditions graph is shown at traditions-home, which is ruled first. On the counter-argument: a traditions graph declares no move, and the sitting says whether it needs a target and a liquidation like public's. Stage review: the shim changed.

### Frontier finding, 2026-09-03

Kind: placement.

Two ruling-stage nodes rest on maieutic ground without saying so. Rationale-edge is at ruling under under, which is at maieutic with 'Proposed: pending' and no draft, and under's own Proposal says its text is 'Drafted after q14, q15, and q16 are ruled' — one of which, tier, was kicked back and its recommendation withdrawn, so under cannot be drafted as planned. Separately, readings' draft and namespaces' draft both presume a traditions graph that traditions-home would create, and traditions-home is at ruling but is listed as a dependency of both; the manifest edit that would create the graph is shown on none of the three.

Also named: commons.systems/disposition-graph/rationale-edge, commons.systems/disposition-graph/under, commons.systems/disposition-graph/tier, commons.systems/disposition-graph/traditions-home, commons.systems/disposition-graph/readings.

Proposed: Rule traditions-home before readings and namespaces, and show the manifest entry on traditions-home so the author sees what they are creating. Rule rationale-edge and re-answer tier before under, and add to rationale-edge one clause saying its parent is unanswered. Under is then drafted from the three outcomes, simplified as the decomposition finding proposes.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `draft` (ai); `traditions-graph-declares-move` (review, 2026-09-03).
The recommendation adopts `draft` and is pinned to the standing text as it was at that commit.
Merge analysis of the author's words: 2026-09-02, own-question: A tradition is a mount because it could theoretically be represented by its own graph with its own archē and its own references to traditions.
Moved to other nodes as alternatives: `show-the-manifest-entry` on commons.systems/disposition-graph/traditions-home; `disclose-unanswered-parent` on commons.systems/disposition-graph/rationale-edge.
The census unit's note: The Draft is the recommendation, source ai. The second alternative is the review's counter-argument, which the session's reply hands to the sitting to decide. Excluded as already ruled: a graph per tradition, rejected in the sitting's own Rejected list. Excluded as applied: the redirect obligation web-routing asked the shim to carry, which I verified is now in both the frontmatter and the draft. The author's words here are a fragment of a longer 2026-09-02 quotation whose home is readings; carried on this node as the ground of the naming question, which validation 14 admits. Two elsewhere entries come from this node's placement finding.
