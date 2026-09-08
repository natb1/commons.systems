---
question: How are nodes named across graphs?
stage: ruling
review:
  verdict: forward
  strength: weak
  date: 2026-09-03
  of: 34292a80815de7aec153d0dc0cebccede3d4f479
  against: "The traditions graph inherits the manifest's shape for graphs that move — a target and a liquidation — and has neither, so the manifest would carry a graph of a third kind with no declared future, in a record that has just adopted 'addresses do not change' from Berners-Lee and made namespaces' own shim owe redirects. The author's stated model, a tradition as a mount that could be its own graph, anticipates exactly the move this entry does not, and one line in the manifest entry would settle it."
  survey:
    date: 2026-09-07
    of: 34292a80815de7aec153d0dc0cebccede3d4f479
    commit: edc5af91d942319c12174309e388a244de61fa52
    text:
      question: "b0a0cd5d3fa952013073df27b5ead3ea4d0263536a8a086e637c2aec99eb5815"
      answer: "068592dc70dea77c70f40bb9f22b16f26449b0e680d221d67783ce61ff8876ac"
      options: "bca02c2cf5947dc0339874b2d28c9cff666f166ece9a9ce4878375f5dbb41492"
      rivals: "18d823faf53f09f4281df98e834d9ddf03893cea8621bfdf41d4a8dadedad699"
      words: "69562ad55fe724a4a73d49b2883731b3af2b8d204ec9ea35d171420140904522"
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-02"
      - name: draft
        source: ai
        ref: "2026-09-03"
        supports:
          - words/2026-09-02/14
      - name: traditions-graph-declares-move
        source: review
        ref: "2026-09-03"
    recommends: draft
    boldness: moderate
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
form: rule
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

## Facts

### answer

#### standing

By import path, as Go names packages.

**AI support.** The author's ruling of 2026-09-02. Traditions to record as readings: Go modules, whose `replace` directive is the shim's model; Unix mount namespaces, which map a path prefix to another tree.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How are nodes named across graphs?
form: rule
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

By import path, as Go names packages. A repository is a module named by its path, `commons.systems`; it may carry several graphs on its `disposition` ref, as a module carries several packages; a node's id is module, graph, and slug: `commons.systems/disposition-graph/purpose`. References across graphs and across repositories are the same path. A graph that will move declares its target in the manifest, and that declaration is a shim whose liquidation is a directory move and a prefix rewrite of ids.
```

#### draft

The draft adds to the standing answer one sentence creating the traditions graph: a graph may be a mount of what is not this project's own disposition, the traditions graph holding one root node per tradition the record reads, with a tradition that comes to have a graph of its own reached by the same path. It carries the same public-graph mount shim, now with the redirect obligation web-routing adopts, and a rationale naming the model of a tradition as a mount. It presumes traditions-home's recommended option, which is unruled, and the manifest entry that would create the graph is shown on traditions-home rather than here.

**AI support.** The author's ruling of 2026-09-02, and the model of a tradition as a mount that could be a graph of its own.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How are nodes named across graphs?
form: rule
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
```

#### traditions-graph-declares-move

The counter-argument, twice recorded: the traditions graph inherits the manifest's shape for graphs that move, a target and a liquidation, and has neither, so the manifest would carry a graph of a third kind with no declared future, while the author's own model is that a tradition could be represented by its own graph, a move this entry does not anticipate and which web-routing's adopted principle would make owe redirects. This alternative gives the traditions graph a declared target and liquidation like the public graph's, one line in the manifest entry, so that every graph in the manifest declares its future.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

From: standing

```diff
@@ -16,4 +16,4 @@
 
 ## Answer
 
-By import path, as Go names packages. A repository is a module named by its path, `commons.systems`; it may carry several graphs on its `disposition` ref, as a module carries several packages; a node's id is module, graph, and slug: `commons.systems/disposition-graph/purpose`. References across graphs and across repositories are the same path. A graph that will move declares its target in the manifest, and that declaration is a shim whose liquidation is a directory move and a prefix rewrite of ids.
+The counter-argument, twice recorded: the traditions graph inherits the manifest's shape for graphs that move, a target and a liquidation, and has neither, so the manifest would carry a graph of a third kind with no declared future, while the author's own model is that a tradition could be represented by its own graph, a move this entry does not anticipate and which web-routing's adopted principle would make owe redirects. This alternative gives the traditions graph a declared target and liquidation like the public graph's, one line in the manifest entry, so that every graph in the manifest declares its future.
```

## Account

### Manifest

- Folded: Sitting on purpose, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Re-encoding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Recommendation fence, Answer: 'the traditions graph holds one root node per tradition this record reads'. Verified that disposition/disposition.yaml carries only `disposition-graph` and `public`, so the fence's answer presumes a graph the manifest does not have, and the manifest edit the author would be confirming is shown on no node — traditions-home's `show-the-manifest-entry` alternative records the obligation and the entry itself is still not written anywhere. Suggested edit: show the manifest entry on traditions-home before either node is ruled.
- Verified applied since the last review: the public-graph shim's liquidation now carries 'with redirects from the old addresses, as the web-routing reading adopts', so the redirect obligation web-routing asked for is in both the frontmatter and the fence.
- The fence presumes traditions-home's recommended option, `one-traditions-graph`, which stands at the review stage in this same batch with `graph-per-tradition` pending — an alternative both of that node's reviews' counter-arguments prefer. If the author takes it, this fence's sentence is wrong. The dependency is named in the account and not in the answer.
- The traditions graph, as the fence has it, is a graph in the manifest with no target and no liquidation, while the manifest's other non-primary graph carries both. The author's own model is that a tradition 'could theoretically be represented by its own graph', which is a move this entry does not anticipate and which the record has just adopted a principle to price. The `traditions-graph-declares-move` alternative is the vehicle and the session handed it to the sitting.

On the three facts: The frontmatter recommendation (adopts draft, ratified, moderate) states one class and one value and the pin is current; moderate is right and it is contingent on traditions-home, which the account names. The prose Facts line says 'ratified if q2 stands', naming a question by a sitting label rather than a node id, which no reader of the record can resolve. Persistence standing with one declared shim follows from the node's shape.

Strongest counter-argument (weak): The traditions graph inherits the manifest's shape for graphs that move — a target and a liquidation — and has neither, so the manifest would carry a graph of a third kind with no declared future, in a record that has just adopted 'addresses do not change' from Berners-Lee and made namespaces' own shim owe redirects. The author's stated model, a tradition as a mount that could be its own graph, anticipates exactly the move this entry does not, and one line in the manifest entry would settle it.

The session's reply: Forward accepted. The dependence on traditions-home is named in the account and the ruling order puts traditions-home first; the manifest entry is traditions-home's show-the-manifest-entry alternative.

### Frontier finding, 2026-09-03

Kind: placement.

Authority holds that 'a ratified stamp whose ruling is not in the record is invalid', and quotes rules on what that requires. Measured against the graph as it now stands: eleven recommendation fences in this batch carry `class: ratified`, and eight of them quote no ruling of any date anywhere in the fence — purpose, hexis, namespaces, projection, traditions-home, forms, second-stop and purpose-criteria — while three do: rationale-edge, quotes and rejected. Separately, twenty-three of the sixty-eight nodes carry no '## Disposition' section at all (`validate.mjs` reports 'ok: 68 nodes'; the count of nodes with no such section is 23), among them evaluation, persistence, legacy, validation-order, review, recording, forms, traditions-home, purpose-criteria, second-stop and all three public nodes. Quotes' own recommended answer unbars them in one clause — 'the ruling a stamp requires is the one the author gives at that sitting, quoted then; words the author said earlier are the ground a draft rests on and bar no stamp' — so the whole question of whether eight fences and twenty-three nodes can carry a ratified stamp turns on a node that is itself unruled and in this batch. The counts recorded on the batch's own findings are stale against the graph: 'twenty-two of the sixty-two nodes' was measured when the graph held 62.

Also named: commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/hexis, commons.systems/disposition-graph/projection, commons.systems/disposition-graph/traditions-home, commons.systems/disposition-graph/forms, commons.systems/disposition-graph/second-stop, commons.systems/disposition-graph/purpose-criteria.

Proposed: Quotes is the survivor and is ruled first among the nodes of this batch, after the periagogic sitting on public/agency that every one of them descends from. Nothing in the eight fences need change before that ruling, because quotes' recommended answer sanctions them; what must not happen is that any of the eight is recorded with a ratified stamp before quotes is ruled, since under the losing option each such stamp is invalid on landing. Quotes' own facts should state the measured size of the bar at the moment of ruling rather than a count fixed in prose, since the count has already moved once.

Recorded as a pending alternative on commons.systems/disposition-graph/quotes: `fence-carries-the-ruling` (source review, 2026-09-03).

### Frontier finding, 2026-09-03

Kind: placement.

Readings stands at the ruling stage while the node that creates what its recommended text presumes stands two stages behind it. Readings' recommended text says 'a tradition is a mount, one root node in a traditions graph until it has a graph of its own'; traditions-home, which rules whether that graph exists and in what form, is at the review stage in this batch with `graph-per-tradition` and `nodes-inside-disposition-graph` both pending — two options under which readings' sentence is wrong. Namespaces, also at review, presumes the same graph. Verified that disposition/disposition.yaml carries only `disposition-graph` and `public`, so the graph none of the three can do without does not exist, and the manifest entry that would create it is written on no node. Frontier-consistency's validation 13 requires that no node at the ruling stage rest on periagogic or maieutic ground 'without saying so'; readings rests on review-stage ground and says nothing, and unlike rationale-edge and namespaces it carries no alternative recording the dependency — the placement finding of 2026-09-03 named readings in its proposal and minted an alternative on every other node it named.

Also named: commons.systems/disposition-graph/readings, commons.systems/disposition-graph/traditions-home.

Proposed: Traditions-home is the survivor of where a tradition node lives and is ruled before readings and namespaces, which the ruling order below does; the manifest entry it creates is shown on it, since that is what the ruling makes. Readings takes the alternative below, saying on the node that its tradition-as-mount sentence stands only if traditions-home's recommended option is taken — the gap the earlier finding left when it recorded its proposal on every named node but this one.

Recorded as a pending alternative on commons.systems/disposition-graph/readings: `hold-for-traditions-home` (source review, 2026-09-03).

### Frontier survey, 2026-09-05

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:


Strongest counter-argument (moderate): The Go analogy fixes an id to an import path and then concedes the public graph's ids will be rewritten by prefix when it moves to natb1.com. `web-routing`'s reading adopts as its fourth principle that addresses do not change, and this is the record's own violation of it; the answer's remedy is a shim carrying a redirect obligation, which is a promise rather than a mechanism. So the stability the naming scheme is chosen for holds only for the graph that is not moving, and the graph that is moving is the public one, which is the graph strangers will address.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/namespaces stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `standing`; the `## Rationale` its `**AI support.**`; the `## Recommendation` fence became the content of `draft`; 1 `## Disposition` entry became the ledger entry words/2026-09-02/14, referenced by 0 options the entry's own date names and by the recommended option for 1 the date named none; and `stands` left the answer fact. The record wrote no text of its own for `traditions-graph-declares-move`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `472901e1a470cbb9d515cdff48d575e4d05da26a` is re-computed for the encoding as `037fb16d831a28ae54393ec4671f94f0e1b5a0e5`; nothing it read changed. The survey's pin `472901e1a470cbb9d515cdff48d575e4d05da26a` is re-computed for the encoding as `037fb16d831a28ae54393ec4671f94f0e1b5a0e5`; nothing it read changed.
