---
question: How is the record read?
stage: ruling
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
boost: 5
under:
  - commons.systems/disposition-graph/model
defines:
  - projection
  - graph browser
shims:
  - artifact: the graph browser published as the private page https://claude.ai/code/artifact/502111c1-a7fb-4108-a9cb-ebb7b2a44933, regenerated from the record each round
    for: the human projection this node names
    liquidation: the browser is recorded as a node with its published address, and the page is published from the implementation ref
    declared: 2026-09-02
---
## Disposition

The author, 2026-09-02:
> I do not like how the artifact UI has "how to read this" and "vocabulary" sections. These do not seem to be materialized from the graph and so are prone to drift. "how to read this" as well as vocabulary should follow naturally from the onboarding progression of graph review.

The author, 2026-09-02:
> The artifact does not need to track bootstrapping concerns - those are transient concerns managed by the AI and do not need to be included in greenfield documentation.

The author, 2026-09-02:
> An authority section projected into the documentation (with notes on pending ratification for deferred authority) would make more sense than a "rejected" section which seems ad-hoc. Notes on deferred ratification could also feed the `/align` dialogue.

The author, 2026-09-02:
> Projecting "cites" relationships will aid onboarding navigation.

The author, 2026-09-03:
> general disposition is that all materialized implementation (including the browser) is a projection of the graph - anything not justified by the graph is subject to liquidation through reconciliation.

The author, 2026-09-03:
> The url in the artifact is not updated on navigation between nodes. This could cause navigation confusion. Record reference to web app routing tradition for disposition. Edit the browser shim to reconcile the disposition.

The author, 2026-09-03:
> "Tier" (as in global-tier) needs a disposition. As a disposition references in the projected documentation must be hyperlinked.

## Answer

Through projections, never by opening node files, except in alignment sessions. The graph browser is the human projection: one page that renders every node lazily, opens on the purpose node, links every defined term to the node that defines it, and sets readings of tradition apart from the answers they ground. It shows no un-aligned disposition and nothing of an open sitting; those are listed by the alignment page, the projection of the open dialogue that the growth node describes. Every node has an address, its id, which the browser writes as the reader moves and reopens when the reader arrives by it; the page keeps the reader's place and shows the address of the node in view, because a viewer that frames the page cannot show it. The README on the main branch is a projection of the purpose node, and the repository's description and discovery tags are projections of the purpose and audience nodes. An implementation session never reads the graph: the global-tier rules it works under are materialized into the repository's rules, the ancestry of the node it serves is materialized into its worktree's `CLAUDE.local.md` at provisioning, pinned at a graph commit, and the orientation page it reads first, `CLAUDE.md`, is projected from the purpose node and this one; what a session loads and where each part comes from is the session-context node under this one. Such a session writes back only through narrow verbs, propose, answer as deferred, record evidence.

## Rationale

The author's ruling of 2026-09-02 that bite sessions read projections, not the worktree. It keeps context focused, keeps legacy vocabulary out of working sessions, and makes the graph commit a session read from a pinned fact. The address rule was recorded at the author's direction on 2026-09-03, after the address was seen not to change on navigation in the framed viewer; the routing tradition is the reading under this node. The author, 2026-09-03: "The url in the artifact is not updated on navigation between nodes. This could cause navigation confusion. Record reference to web app routing tradition for disposition. Edit the browser shim to reconcile the disposition." And, the same day, that unanswered nodes are hidden from the browser and listed by the alignment page, quoted on the transience node. A hosted README cannot embed a live page, so the README renders the purpose page statically or links the browser at the purpose node; that bite on the main branch is unbuilt work, not a disposition.


## Proposal

### Sitting on purpose, 2026-09-03

**The projection node, whole; the browser states nothing of its own**

Every node has an address and the page keeps the reader's place (recorded today at the author's direction, deferred; the framed viewer cannot show or receive the address, which the reading under this node records as the host's divergence). Every field name and value on a page links to its defining node (q15). The browser states nothing of its own; each page shows the question, the answer, the criteria or the word unguarded, the readings under the node, the nodes it cites and that cite it, and an authority section projected from the stamp, the ruling, the rejected alternatives, and what is pending for a deferred node. Every defined term and every tradition name links. The README, description, and tags project from purpose alone, since audience is pruned. The session-context part is unchanged. The browser shim declared today stays.

Facts: authority ratified; boldness moderate; persistence standing.

Rejected:
- Keep a rejected-alternatives section apart from authority. — What was rejected is part of how the answer came to stand, and the author found the separate section ad hoc.

Depends on: `instruments`, `readings`

Proposed text:

```markdown
---
question: How is the record read?
form: disposition
authority:
  class: ratified
  by: Nathan Buesgens
  date: <the date of the ruling>
under:
  - commons.systems/disposition-graph/model
defines:
  - projection
  - graph browser
shims:
  - artifact: the graph browser published as the private page https://claude.ai/code/artifact/502111c1-a7fb-4108-a9cb-ebb7b2a44933, regenerated from the record each round
    for: the human projection this node names
    liquidation: the browser is recorded as a node with its published address, and the page is published from the implementation ref
    declared: 2026-09-02
---
## Answer

Through projections, never by opening node files, except in alignment sessions. The graph browser is the human projection, and it states nothing of its own: one page that renders every node lazily and opens on the purpose node, each page showing the question, the answer, the criteria or the word unguarded, the readings under the node set apart from the answer they ground, the nodes it cites and the nodes that cite it, and an authority section projected from the stamp, the ruling behind it, the alternatives the rationale rejected, and, for a deferred node, what is pending for the author. Every defined term and every tradition's name links to the node that defines it, and so does every field name and value on a page. Every node has an address, its id, which the browser writes as the reader moves and reopens when the reader arrives by it; the page keeps the reader's place and shows the address of the node in view, because a viewer that frames the page cannot show it. The README on the main branch, the repository's description, and its discovery tags are projections of the purpose node. An implementation session never reads the graph: the global-tier rules it works under are materialized into the repository's rules, the ancestry of the node it serves is materialized into its worktree's `CLAUDE.local.md` at provisioning, pinned at a graph commit, and the orientation page it reads first, `CLAUDE.md`, is projected from the purpose node and this one; what a session loads and where each part comes from is the session-context node under this one. Such a session writes back only through narrow verbs, propose, answer as deferred, record evidence.

## Rationale

The author's ruling of 2026-09-02 that bite sessions read projections, not the worktree, and of the same date that the browser must carry nothing the graph does not, since hand-written orientation and vocabulary drift and the onboarding walk is the orientation. Rejected: a how-to-read page and a vocabulary page in the browser; a rejected-alternatives section apart from authority, because what was rejected is part of how the answer came to stand.
```

Rulings open: ratify as shown; ratify with edits; defer; overrule.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Draft Answer drops the sentence the current node carries on the author's own direction of 2026-09-03: 'It shows no un-aligned disposition and nothing of an open sitting; those are listed by the alignment page.' The author's words are quoted on transience: 'Unanswered nodes are hidden from the browser artifact and listed by the alignment artifact.' The removal is not announced. Suggested edit: restore the sentence.
- Draft Answer: 'the nodes it cites and the nodes that cite it.' No node carries a cites field and the schema has none, so the projection is vacuous today. The author asked for it ('Projecting cites relationships will aid onboarding navigation'), so it should be presented as owed work, not as a standing answer already met.
- Draft Answer: 'and so does every field name and value on a page' presumes the recommended option on tier (q15), which is not in 'Depends on'. At least fifteen field names and sub-keys in current use (defines, tier, source, relation, kind, ref, note, class, by, date, artifact, for, declared, criteria, cites) are named by no node's defines, so the rule cannot be met as written.
- Draft Answer: 'projections of the purpose node' alone presumes the audience prune, which is not in 'Depends on'.

On the three facts: Ratified, moderate boldness, standing is right for the browser rule the author stated, and the browser shim should be named among the facts with its liquidation condition. The field-link sentence is contingent on tier and must be presented as such.

Strongest counter-argument (weak): A browser that states nothing of its own is only as navigable as the node text, and the two surfaces the author had it remove, how-to-read and vocabulary, were the affordances a newcomer used. The record's answer is that the onboarding walk is the orientation, which is sound, but the walk is currently one 816-word growth answer and a model node still being rewritten. Worth one line: the rule is right and the walk is not yet good enough to carry it alone.
