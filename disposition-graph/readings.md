---
question: How are references to tradition recorded?
stage: ruling
recommendation:
  class: ratified
  boldness: moderate
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/model
defines:
  - reading
  - tradition
  - adopted
  - diverged
  - chosen over
---
## Disposition

The author, 2026-09-02:
> Re-evaluate the naming and function of the form "READING (RDG)" - we have been using the term "tradition" up until now, is this different? My concept of the tradition node is that it is a mount of another project - a philosophical tradition, or a body of research, or another code repo. It is a mount because it could theoretically be represented by its own graph with its own arche and its own reference to traditions. In lieu of a fully articulated disposition graph, a tradition may list primary references/readings. A disposition in the greenfield graph may reference tradition as either supporting by or diverging from disposition. That reference (supporting or diverging) may be ratified (if I have read the primary sources or understand the hypothetic mounted graph and can confirm support or divergence), delegated (if I accept AI judgement on the reference), or deferred (if I accept AI judgement pending review). Given the model of tradition as graph mount, recommend, how should multiple questions that reference the same tradition be encoded?

The author, 2026-09-02:
> references to tradition in the prose of the documentation projection (such as the answer) should hyperlink to the tradition node. I like how target dispositions are hyperlinked, keep that.

The author, 2026-09-02:
> do not replicate tradition references in the rationale section. There is already a tradition section. Confirm the tradition section is projected from the references, not duplicated in the node body.

## Answer

As readings, which are nodes. A reading answers the question what a tradition says about the answer above it: its source is the primary text and locus, its relation is adopted, diverged, or chosen over, and its answer says how the text supports or contradicts the disposition and where the disposition deliberately departs. A reading carries a stamp like any node: ratified when the author has read the primary source and judges the relation, delegated when the AI's reading stands and the author declines to review it, deferred when the author accepts it for now and queues the primary reading. Deferred reading is recursive: one source leads to another, and a reading may sit under a reading. A reading whose verdict changes on re-reading is a re-grasp trigger for the node it grounds, not an automatic failure of it.

## Rationale

The author's ruling of 2026-09-02 that tradition references carry authority classes. Making them nodes rather than field entries buys four things: one reading of a shared source is stored once and refined under each node it grounds; readings nest, which is what recursion needs; a reading has its own hash and pin, so a changed reading is distinguishable from a changed answer; and there is one write path, one queue, and one stamp vocabulary. The alternative, stamped entries in a field with a derived reading frontier, is workable and was the author's framing; the difference is parsimony of mechanism against parsimony of files.


## Draft

```markdown
---
question: How are references to tradition recorded?
form: rule
authority:
  class: ratified
  by: Nathan Buesgens
  date: <the date of the ruling>
under:
  - commons.systems/disposition-graph/model
defines:
  - reading
  - tradition
  - adopted
  - diverged
  - chosen over
---
## Answer

As readings under the node that refers, and traditions they refer to. A tradition is a mount: a philosophical tradition, a body of research, or another repository, which could be a disposition graph of its own with its own archē and its own readings, and until it is articulated is one root node in the traditions graph, carrying the name it defines and its primary references. A reading is a node under the disposition it bears on, naming the tradition it reads, its source and locus, and its relation: adopted, where the tradition supports the answer; diverged, where the answer departs and says why; or chosen over, where a rival tradition was weighed. A reading carries a stamp like any node: ratified when the author has read the primary source or understands the mounted graph and confirms the relation, delegated when the AI's reading stands and the author declines to review it, deferred when the author accepts it for now and queues the primary reading. Deferred reading is recursive: one source leads to another, and a reading may sit under a reading. A reading whose verdict changes on re-reading is a re-grasp trigger for the node it grounds, not an automatic failure of it. Many questions that read one tradition are many readings naming that tradition, and the tradition's page shows every reading that cites it. Prose reaches a tradition through the name it defines, and the rationale of a node never repeats its readings.

## Rationale

The author's rulings of 2026-09-02 that tradition references carry authority classes and that a tradition is a mount. Making readings nodes rather than field entries buys four things: one tradition is stored once and read under each node it grounds; readings nest, which is what recursion needs; a reading has its own hash and pin, so a changed reading is distinguishable from a changed answer; and there is one write path, one queue, and one stamp vocabulary. Rejected: stamped entries in a field with a derived reading frontier, workable and the author's first framing, parsimony of mechanism against parsimony of files; readings in the rationale prose, which drift and cannot carry a stamp; one node per tradition inside this graph, because a tradition is not a disposition of this project and is mounted rather than held.
```

## Proposal

### Sitting on purpose, 2026-09-03

**The readings node, whole; tradition as mount**

Tradition and reading are distinguished. A tradition is a mount, one root node in a traditions graph until it has a graph of its own, carrying the name it defines and its primary references. A reading is one node's reference to a tradition, under the node it bears on, with source, locus, relation, and a stamp. Many questions reading one tradition are many readings naming one tradition, and the tradition's page shows them all. Prose links to a tradition through the name it defines. A rationale never repeats the readings.

Facts: authority ratified if q2 stands; boldness moderate; persistence standing.

Rejected:
- Stamped entries in a field with a derived reading frontier, the author's first framing. — Workable; parsimony of mechanism against parsimony of files, and a reading needs its own hash and pin.
- One node per tradition inside this graph. — A tradition is not a disposition of this project; it is mounted, not held (q2).

Depends on: `traditions-home`

Proposed text: the draft section of this node.

Rulings open: ratify as shown; ratify with edits; defer; overrule.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Draft Answer, last clause: 'the rationale of a node never repeats its readings.' Eleven rationales still carry prose tradition lists (persistence, review, validation-order, authority, session-context, transience, evaluation, work-loop, namespaces, recording, node), and materialization carries an inline one. Two of them, transience and session-context, are forwarded in this same batch as they stand. The remedy, stub-traditions, is at stage maieutic. Ratifying this rule puts twelve nodes on the frontier the moment it lands. Suggested edit: say so in the facts.
- Draft Answer: 'A reading is a node under the disposition it bears on, naming the tradition it reads.' The ten reading nodes today carry source and relation but name no tradition, and no traditions graph exists in the manifest. No migration is named.
- Draft frontmatter 'form: disposition' presumes the forms ruling; 'Depends on' lists only traditions-home.

On the three facts: 'Ratified if q2 stands' is right, boldness moderate is right. The facts should add that ratifying this rule immediately makes twelve existing rationales non-conforming and that the fix is unruled.

Strongest counter-argument (weak): Making every reading a node multiplies files where the author's first framing did not: one tradition read by three nodes becomes one root plus three readings, so the Aristotle material already spans three files and would span four. The node records this trade honestly as 'parsimony of mechanism against parsimony of files', and the four benefits it claims (shared storage, nesting, its own hash and pin, one stamp vocabulary) are real. Worth one line rather than a re-opening.
