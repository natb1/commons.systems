---
question: How are references to tradition recorded?
stage: ruling
recommendation:
  adopts: draft
  boldness: moderate
  amends: "8029e1b5968e7e2801b1396b631c2e23d3e52adf"
  at: "6d21d356d65f5fa206cb60bc3e923c462acc920e"
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: 8f46214fa1e80836a43e46c4d643f0e223cad9ce
alternatives:
  - name: draft
    source: ai
  - name: incomplete-enumeration-in-facts
    source: review
    ref: "2026-09-03"
  - name: one-ruling-for-the-reading-class
    source: review
    ref: "2026-09-03"
  - name: hold-for-traditions-home
    source: review
    ref: "2026-09-03"
  - name: relation-per-option
    source: author
    ref: "2026-09-04"
facts:
  - name: authority
    choices:
      - ratified
      - delegated
    adopts: ratified
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
depends:
  - commons.systems/disposition-graph/viable-options
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

## Alternatives

### draft

The Draft distinguishes tradition from reading where the standing answer runs them together: a tradition is a mount, one root node in a traditions graph until it has a graph of its own, carrying the name it defines and its primary references, and a reading is a node under the disposition it bears on, naming the tradition it reads with its source, locus and relation. It adds that many questions reading one tradition are many readings naming one tradition, that the tradition's page shows every reading citing it, that prose reaches a tradition through the name it defines, and that a rationale never repeats its readings. Its own reviews record that ratifying it makes fourteen existing rationales non-conforming at once, that the ten reading nodes name no tradition and no traditions graph exists in the manifest, and that no migration is named.

### incomplete-enumeration-in-facts

The same finding proposes that readings' facts say the remedy's enumeration is incomplete, so the author knows the size of what ratifying the rule puts on the frontier; readings' draft rests its rule that a rationale never repeats its readings on that enumeration being the remedy. (Raised on commons.systems/disposition-graph/audience.)

### one-ruling-for-the-reading-class

Readings' answer says that the class rule it states governs every reading node without each carrying its own alternative for it. Verified that all four nodes still carrying a `delegated-not-ratified` alternative — software-factories, spec-driven-development, srs-introduction, web-routing — already recommend delegated, so those four entries stand for a change the record has made and would put a settled question in front of the author four times. On this alternative the four entries are struck as discharged and readings' answer says that a reading's class follows from whether the author has read the source, so no reading needs an alternative to say it; it is on the table because the record currently carries four pending rulings on a rule it has already applied.

### hold-for-traditions-home

Readings says on the node that its tradition-as-mount rule rests on traditions-home, which is unruled, and is not confirmed before it. Verified that readings stands at the ruling stage while traditions-home stands at review with two pending alternatives under which readings' sentence 'a tradition is a mount, one root node in a traditions graph until it has a graph of its own' would be false, and that the manifest carries no traditions graph for it to name. It is on the table because frontier-consistency requires a node not to rest silently on unruled ground and because the placement finding of 2026-09-03 proposed exactly this for readings and recorded an alternative on every other node it named but this one.

### relation-per-option

A reading stays a node under the disposition it bears on, with its own stamp, and its relation attaches to the options of the fact it bears on rather than to the answer: adopted on the options the tradition supports, diverged on those it contradicts, so that "chosen over" becomes a tradition adopted on an option not chosen. The tradition's page still shows every reading that cites it, and the projections show on each option what tradition says. Raised on commons.systems/disposition-graph/viable-options, from the author's words of 2026-09-04 recorded there.

## Recommendation

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

## Account

### Sitting on purpose, 2026-09-03

**The readings node, whole; tradition as mount**

Tradition and reading are distinguished. A tradition is a mount, one root node in a traditions graph until it has a graph of its own, carrying the name it defines and its primary references. A reading is one node's reference to a tradition, under the node it bears on, with source, locus, relation, and a stamp. Many questions reading one tradition are many readings naming one tradition, and the tradition's page shows them all. Prose links to a tradition through the name it defines. A rationale never repeats the readings.

Facts: authority ratified if q2 stands; boldness moderate; persistence standing.

Rejected:
- Stamped entries in a field with a derived reading frontier, the author's first framing. — Workable; parsimony of mechanism against parsimony of files, and a reading needs its own hash and pin.
- One node per tradition inside this graph. — A tradition is not a disposition of this project; it is mounted, not held (q2).

Depends on: `traditions-home`

Proposed text: the draft section of this node.

Responses open: confirm as shown; confirm with edits; deny with feedback.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Draft Answer, last clause: 'the rationale of a node never repeats its readings.' Eleven rationales still carry prose tradition lists (persistence, review, validation-order, authority, session-context, transience, evaluation, work-loop, namespaces, recording, node), and materialization carries an inline one. Two of them, transience and session-context, are forwarded in this same batch as they stand. The remedy, stub-traditions, is at stage maieutic. Ratifying this rule puts twelve nodes on the frontier the moment it lands. Suggested edit: say so in the facts.
- Draft Answer: 'A reading is a node under the disposition it bears on, naming the tradition it reads.' The ten reading nodes today carry source and relation but name no tradition, and no traditions graph exists in the manifest. No migration is named.
- Draft frontmatter 'form: disposition' presumes the forms ruling; 'Depends on' lists only traditions-home.

On the three facts: 'Ratified if q2 stands' is right, boldness moderate is right. The facts should add that ratifying this rule immediately makes twelve existing rationales non-conforming and that the fix is unruled.

Strongest counter-argument (weak): Making every reading a node multiplies files where the author's first framing did not: one tradition read by three nodes becomes one root plus three readings, so the Aristotle material already spans three files and would span four. The node records this trade honestly as 'parsimony of mechanism against parsimony of files', and the four benefits it claims (shared storage, nesting, its own hash and pin, one stamp vocabulary) are real. Worth one line rather than a re-opening.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Draft Answer, last clause: 'the rationale of a node never repeats its readings.' Verified: fourteen nodes carry prose tradition lists today (authority, dialogue, evaluation, materialization, namespaces, node, persistence, recording, review, scope, session-context, transience, validation-order, work-loop), and the remedy, stub-traditions, is at the maieutic stage and enumerates only twelve — it omits dialogue, recording and scope, and names instruments, which uses no marker phrase. Ratifying this rule puts fourteen nodes on the frontier at once with an enumeration that is short by three.
- Draft Answer: 'A reading is a node under the disposition it bears on, naming the tradition it reads.' The ten reading nodes carry source and relation and name no tradition, and no traditions graph exists in the manifest. No migration is named.
- The previous review's finding that 'Draft frontmatter form: disposition presumes the forms ruling' is stale; the draft carries 'form: rule'.
- Draft Answer: 'ratified when the author has read the primary source or understands the mounted graph and confirms the relation.' Verified applied to four readings (the three under public/agency and plato-maieutics, plato-periagoge now recommend delegated) and not to three (software-factories, spec-driven-development, srs-introduction still recommend ratified while their own rationales defer until the author reads).

On the three facts: The frontmatter recommendation (ratified, moderate) is right, contingent on traditions-home. The facts should add that ratifying makes fourteen existing rationales non-conforming, that the remedy is unruled and its enumeration incomplete, and that three reading nodes still present a class this rule forbids.

Strongest counter-argument (moderate): Making every reading a node multiplies files where the author's first framing did not: one tradition read by three nodes becomes one root plus three readings, so the Aristotle material already spans three files and would span four, and stub-traditions proposes about thirty more roots as open questions — every one of which, under transience, joins the author's queue. The node records the trade honestly as 'parsimony of mechanism against parsimony of files', and the four benefits it claims are real; but the queue effect is the cost the author will feel, and neither this node nor traditions-home states it.

The session's reply: Validated: fourteen rationales carry prose tradition lists, and the enumeration on stub-traditions is short by dialogue, recording, and scope, which its sitting adds. Ratifying this rule puts them on the frontier, which the facts now say. The migration of the reading nodes to named traditions comes with traditions-home, ruled first. On the counter-argument, that the queue effect is the cost the author will feel: accepted and stated; stub traditions enter as un-aligned dispositions at the periagogic stage, ruled or pruned in rank order.

### Frontier finding, 2026-09-03

Kind: redundancy.

Form-vocabulary's proposal is 'No new nodes. Each term is defined by the node that owns it, through the defines field ... the term index links every use in prose to that node, and a term no node defines is not linked, which is how drift shows.' That is what readings' draft already says for traditions ('Prose reaches a tradition through the name it defines') and what projection's draft already says for terms ('Every defined term and every tradition's name links to the node that defines it'), and what the browser already implements. Form-vocabulary restates two other nodes' answers and adds one decision — that no node per form is created — which is a rejected alternative rather than a question.

Also named: commons.systems/disposition-graph/form-vocabulary, commons.systems/disposition-graph/projection.

Proposed: Projection is the survivor for the linking rule and readings for the tradition rule. Form-vocabulary is folded into node's rationale as a rejected alternative ('one node per form, rejected because each would restate the definition its owning node already carries') and the node is pruned, which is what its own facts already say ('persistence not recorded'). The author's quote it carries is already carried verbatim on node.

### Frontier finding, 2026-09-03

Kind: cross-reference.

Two prose references point at nodes that no longer say what is attributed to them. Audience's Proposal: 'the five-audience finding moves to scope' — verified stale, the finding is on coverage, whose own '### Sitting on purpose' section says 'The paragraph that addressed the audience node now addresses this question'. And stub-traditions enumerates the rationales carrying prose tradition lists as node, authority, instruments, namespaces, persistence, work-loop, evaluation, review, session-context, materialization, transience and validation-order; verified by grep that fourteen nodes carry such lists and that three of them — dialogue, recording and scope — are missing from the enumeration, while instruments carries its traditions without the marker phrase. Readings' draft rests its rule on that enumeration being the remedy.

Also named: commons.systems/disposition-graph/audience, commons.systems/disposition-graph/coverage, commons.systems/disposition-graph/stub-traditions.

Proposed: Audience's Proposal names coverage instead of scope. Stub-traditions' enumeration is regenerated from the record rather than maintained by hand — the same class of drift the scope node's order field was introduced to prevent — and until it is, dialogue, recording and scope are added. Readings' facts say that the remedy's enumeration is incomplete, so the author knows the size of what ratifying the rule puts on the frontier.

### Frontier finding, 2026-09-03

Kind: placement.

Two ruling-stage nodes rest on maieutic ground without saying so. Rationale-edge is at ruling under under, which is at maieutic with 'Proposed: pending' and no draft, and under's own Proposal says its text is 'Drafted after q14, q15, and q16 are ruled' — one of which, tier, was kicked back and its recommendation withdrawn, so under cannot be drafted as planned. Separately, readings' draft and namespaces' draft both presume a traditions graph that traditions-home would create, and traditions-home is at ruling but is listed as a dependency of both; the manifest edit that would create the graph is shown on none of the three.

Also named: commons.systems/disposition-graph/rationale-edge, commons.systems/disposition-graph/under, commons.systems/disposition-graph/tier, commons.systems/disposition-graph/traditions-home, commons.systems/disposition-graph/namespaces.

Proposed: Rule traditions-home before readings and namespaces, and show the manifest entry on traditions-home so the author sees what they are creating. Rule rationale-edge and re-answer tier before under, and add to rationale-edge one clause saying its parent is unanswered. Under is then drafted from the three outcomes, simplified as the decomposition finding proposes.

### Frontier finding, 2026-09-03

Kind: coverage.

Readings' rule is that a reading is 'ratified when the author has read the primary source ... delegated when the AI's reading stands and the author declines to review it'. Five reading nodes now carry 'recommendation: class: delegated' (the two public readings, aristotle-hexis, plato-maieutics, plato-periagoge), applying the previous round's finding. Four do not: software-factories, spec-driven-development, srs-introduction and web-routing all carry 'class: ratified' while each of their own rationales says the reading is deferred until the author reads the sources. All ten readings additionally carry the stale prose Facts line offering 'ratified if the author confirms, or delegated where the author's words delegate it', which states two classes for one stamp.

Also named: commons.systems/public/aristotle-arche-of-action, commons.systems/public/pettit-non-domination, commons.systems/disposition-graph/aristotle-hexis, commons.systems/disposition-graph/plato-maieutics, commons.systems/disposition-graph/plato-periagoge, commons.systems/disposition-graph/software-factories, commons.systems/disposition-graph/spec-driven-development, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/web-routing.

Proposed: Readings is the survivor of the rule. The four remaining reading nodes change their recommendation class from ratified to delegated, and every reading's prose Facts line is rewritten to 'delegated on confirmation; ratified after the author's reading', which is what the rule says and what the corrected five already imply. This is a mechanical pass the session can make at the recording, but the author should not be shown four readings offering a class the record's own rule forbids.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `draft` (ai); `incomplete-enumeration-in-facts` (review, 2026-09-03, from commons.systems/disposition-graph/audience).
The recommendation adopts `draft` and is pinned to the standing text as it was at that commit.
Merge analysis of the author's words: 2026-09-02, own-question: Re-evaluate the naming and function of the reading form against tradition, with tradition as a mount of another project that could be its own graph, references to it supporting or diverging and carrying an authority class, and a recommendation for how many questions referencing one tradition are encoded. 2026-09-02, new-answer on commons.systems/disposition-graph/projection: References to tradition in the prose of the documentation projection should hyperlink to the tradition node, keeping the way target dispositions are hyperlinked. 2026-09-02, own-question: Do not replicate tradition references in the rationale section, and confirm the tradition section is projected from the references rather than duplicated in the node body; the first half is this node's rule and the second bears on projection.
Moved to other nodes as alternatives: `hyperlink-traditions-in-prose` on commons.systems/disposition-graph/projection; `fold-into-node-and-prune` on commons.systems/disposition-graph/form-vocabulary.
The census unit's note: At ruling with a Draft, so the recommendation adopts it and the draft is the only pending alternative; the counter-argument about multiplying files is the trade the rationale already records as rejected, so it was not minted. Two findings here are verified resolved and carried nowhere: the four reading nodes the coverage finding names all carry class delegated today, and the cross-reference finding's audience half is applied. What remains of that finding, the incomplete enumeration, is carried on stub-traditions instead. The author's hyperlink words ground projection's linking rule and sit on no other node, so they move there; the form-vocabulary fold is the redundancy this node's own finding proposes.

### Frontier finding, 2026-09-03

Kind: merge.

Four questions are each pending as the same alternative on four to six different nodes, so the author would rule one question up to six times. Verified from the frontier's alternatives lists: (i) `say-instrument-not-criterion` is pending on scope, work-loop, transience and purpose, and each entry says the same thing — that until instruments is ruled the answer says 'instrument', the term instruments actually defines, since 'criterion' is in no node's `defines` and 'criteria' is not in FRONTMATTER_KEYS; instruments owns the question and stands at the maieutic stage with `define-criterion` pending. (ii) `delegated-not-ratified` is pending on software-factories, spec-driven-development, srs-introduction and web-routing, each saying that a reading whose source the author has not read is delegated and not ratified; readings owns the rule and all four recommendations have in fact already been corrected to delegated, so four alternatives now stand for a change already made. (iii) `traditions-to-readings` is pending on materialization, validation-order, instruments and evaluation, each saying the node's prose tradition list goes to readings under the stub-traditions ruling; stub-traditions owns the enumeration and its own `regenerate-enumeration` alternative says the enumeration is incomplete and should be derived rather than maintained by hand. (iv) The same ruling appears as `deferred-rather-than-ratified` on legacy and recording, `deferred-until-ruling-quoted` on validation-order and evaluation, and `deferred-not-ratified` on review and persistence — six nodes, three names, one question: whether a node recommending ratification with no ruling quoted in it should drop to deferred instead; quotes owns that question. Under validation 15 each of these is a new answer to a question the record already asks, standing as its own alternative on a node that does not own the question.

Also named: commons.systems/disposition-graph/instruments, commons.systems/disposition-graph/stub-traditions, commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/scope, commons.systems/disposition-graph/work-loop, commons.systems/disposition-graph/transience, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/software-factories, commons.systems/disposition-graph/spec-driven-development, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/web-routing, commons.systems/disposition-graph/materialization, commons.systems/disposition-graph/validation-order, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/legacy, commons.systems/disposition-graph/persistence, commons.systems/disposition-graph/review, commons.systems/disposition-graph/recording.

Proposed: Instruments is the survivor of the criterion vocabulary, readings of a reading's class, stub-traditions of the prose tradition lists, and quotes of what an unquoted ratified stamp becomes. Each survivor takes one alternative saying that its ruling settles the question for every node that carries the per-node entry, and each per-node alternative is then a consequence of the survivor's ruling rather than a separate ruling — which is what the record already does for the four readings, whose class was changed once and recorded four times. The four per-node families stay listed so the author can see the blast radius, but the ruling order puts the survivor first and the alignment page should say that confirming the survivor discharges them. Case (ii) is the clearest: all four recommendations already read delegated, so those four alternatives are discharged and should be struck rather than ruled.

Recorded as a pending alternative on commons.systems/disposition-graph/instruments: `one-ruling-for-the-word` (source review, 2026-09-03).

Recorded as a pending alternative on this node: `one-ruling-for-the-reading-class` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/stub-traditions: `one-ruling-for-the-prose-lists` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/quotes: `one-ruling-for-the-unquoted-stamp` (source review, 2026-09-03).

### Frontier finding, 2026-09-03

Kind: placement.

Readings stands at the ruling stage while the node that creates what its recommended text presumes stands two stages behind it. Readings' recommended text says 'a tradition is a mount, one root node in a traditions graph until it has a graph of its own'; traditions-home, which rules whether that graph exists and in what form, is at the review stage in this batch with `graph-per-tradition` and `nodes-inside-disposition-graph` both pending — two options under which readings' sentence is wrong. Namespaces, also at review, presumes the same graph. Verified that disposition/disposition.yaml carries only `disposition-graph` and `public`, so the graph none of the three can do without does not exist, and the manifest entry that would create it is written on no node. Frontier-consistency's validation 13 requires that no node at the ruling stage rest on periagogic or maieutic ground 'without saying so'; readings rests on review-stage ground and says nothing, and unlike rationale-edge and namespaces it carries no alternative recording the dependency — the placement finding of 2026-09-03 named readings in its proposal and minted an alternative on every other node it named.

Also named: commons.systems/disposition-graph/traditions-home, commons.systems/disposition-graph/namespaces.

Proposed: Traditions-home is the survivor of where a tradition node lives and is ruled before readings and namespaces, which the ruling order below does; the manifest entry it creates is shown on it, since that is what the ruling makes. Readings takes the alternative below, saying on the node that its tradition-as-mount sentence stands only if traditions-home's recommended option is taken — the gap the earlier finding left when it recorded its proposal on every named node but this one.

Recorded as a pending alternative on this node: `hold-for-traditions-home` (source review, 2026-09-03).
