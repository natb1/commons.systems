---
question: Does the requirements-specification tradition support opening with purpose, then scope, then references?
stage: ruling
review:
  verdict: forward
  strength: moderate
  date: 2026-09-05
  of: 9de579468ecfc1b520b1284b2474951f7085a0f8
  against: "Every substantive claim in this reading is the AI's recall of two standards the record does not hold and no one has checked, and this reading found one of those claims wrong in the node's own frontmatter. The authority fact nonetheless recommends delegated, which under the readings node means the AI's reading stands and the author declines to review it — so a confirmation would fix on unchecked recall the ground of four other arrangements: the onboarding walk's order, definitions met by links, the overview's home, and the readers stated inside purpose, the last of which `audience`'s prune already cites as its reason. The reading's one uncontested claim, that the standard opens with purpose and then scope, was never in doubt; the claims that carry weight in the record are exactly the unverified ones. The remedy is written into the node already and contradicted by its own fact: 'deferred until the author reads the sections'."
  survey:
    date: 2026-09-05
    of: 9de579468ecfc1b520b1284b2474951f7085a0f8
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-02"
      - name: draft
        source: ai
        ref: "2026-09-03"
      - name: record-overview-divergence
        source: review
        ref: "2026-09-03"
        status: passed
        reason: "the recommended text now records every divergence it named, and three more"
      - name: say-only-what-the-source-says
        source: review
        ref: "2026-09-05"
    recommends: draft
    boldness: high
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: deferred
    boldness: moderate
form: reading
under:
  - commons.systems/disposition-graph/purpose
source: IEEE Std 830-1998, Recommended Practice for Software Requirements Specifications, section 1 (Purpose, Scope, Definitions, References, Overview); ISO/IEC/IEEE 29148:2018, section 9, the SRS outline (purpose, scope, product overview, definitions).
bears:
  - fact: answer
    option: standing
    relation: adopted
  - fact: answer
    option: draft
    relation: adopted
---
## Disposition

The author, 2026-09-02:
> The tradition is a good reference but the title alone of the tradition doesn't seem to support progression to audience. That's ok - The progression from purpose to scope to reference makes sense (definitions are covered on the way via hyperlinks and overview can be provided later by blog-shaped content). The question for the reference should be re-oriented around that.

## Answer

Supports. The tradition opens a specification with purpose, then scope, then the intended audience and definitions, and this graph's onboarding walk adopts that order: the purpose node first, with scope, audience, and the vocabulary-defining nodes as its first refinements. It also settles the author's question whether "scope" or "purpose" is the better starting place: both, in that order. Purpose is the why and sits under the archē; scope is the what and follows from purpose.

## Rationale

Validated by the AI from its own knowledge of the standards on 2026-09-02; deferred until the author reads the sections. The one divergence to record: an SRS is a document about one product release, while this graph is a standing record, so "scope" here is a node that can be re-answered rather than a section that is rewritten.

## Facts

### answer

`draft` is recommended because it states the standard's own order where the
standing text states one the sources do not give, and because it says what this
reading adopts and leaves the rest to the nodes that own it. High boldness, which
in this record is low confidence: neither standard is in the record, the whole
answer rests on the AI's recall of them, and the review of 2026-09-05 found one of
those recalled claims wrong, the outline of ISO/IEC/IEEE 29148 the node's own
`source` field summarises. `say-only-what-the-source-says` is the stricter limb and
stays viable; `record-overview-divergence` is passed over, the recommended text
having recorded every divergence it asked for.

#### draft

The draft re-orients the reading on the author's words of 2026-09-02. Where the standing answer says the tradition opens with purpose, then scope, then the intended audience and definitions, and adopts purpose, scope, audience and the vocabulary-defining nodes, the draft gives each source its own order, adopts only the opening the two share, and leaves what follows in the walk to the nodes that own it. It also drops the standing answer's settling of scope against purpose as a starting place. The rationale records four divergences: the standing record against the single release, and the three introduction sections, definitions, references and the overview, that have no counterpart here.

#### record-overview-divergence

Both readings of 2026-09-03 found a second divergence the draft's rationale did not record: the standard has an Overview section and this graph does not, which evaluation calls an unrecorded conflict with a cited tradition. Passed over on 2026-09-05, the recommended text now recording that divergence and two more, definitions and references, each with the node that owns it named. Lifting the status would take a divergence the rationale still leaves out.

#### say-only-what-the-source-says

The answer states the order each standard gives and nothing about this graph:
the adoption is carried by the relation on the reading's `bears` entries, and
where the walk goes, how definitions are met, where the overview lives and where
the readers are stated are the `scope`, `second-stop`, `self-documentation` and
`audience` nodes' to answer. The case for it is that a reading which states this
record's arrangements in prose puts a second answer beside theirs and goes stale
when either moves; the case against is that a divergence cannot be recorded
without saying what the record does instead, which is what the rationale does.
Raised by the clean-context review of 2026-09-05.

### authority

Deferred, at moderate boldness: the readings node's gloss makes deferred the
class for a reading the author accepts for now while the primary reading is
queued, and this node's own rationale says the author will read the sections.
Delegated, which the uniform pass of 2026-09-03 wrote here, says the opposite,
that the author declines to review it. Whether every reading's class should move
together is the `readings` node's question, under its option
`one-ruling-for-the-reading-class`.

## Recommendation

```markdown
---
question: Does the requirements-specification tradition support opening with purpose, then scope, then references?
form: reading
under:
  - commons.systems/disposition-graph/purpose
source: IEEE Std 830-1998, Recommended Practice for Software Requirements Specifications, section 1 (Purpose, Scope, Definitions, References, Overview); ISO/IEC/IEEE 29148:2018, section 9, the SRS outline (purpose, scope, product overview, definitions).
bears:
  - fact: answer
    option: standing
    relation: adopted
  - fact: answer
    option: draft
    relation: adopted
---
## Answer

Supports. The tradition opens a specification with purpose, then scope. IEEE 830-1998 then gives definitions, references and an overview, in that order; ISO/IEC/IEEE 29148:2018 places a product overview and definitions inside the introduction and gives references a clause of their own. Both state the intended readers inside the purpose section. This graph adopts the opening, the purpose node with scope refining it, as the scope node's order records; what the walk reaches after that is the scope and second-stop nodes' question and not this reading's. Four of the standard's arrangements have no counterpart here, and the rationale records them as divergences.

## Rationale

Validated by the AI from its own knowledge of the standards on 2026-09-02, and re-oriented on the author's words of that day, that the progression from purpose to scope to reference makes sense, that definitions are covered on the way via hyperlinks, and that the overview can be provided later by blog-shaped content. Deferred until the author reads the sections: neither standard is in the record, no one has checked this reading against them, and the review of 2026-09-05 found one recalled claim about the second wrong.

Four divergences to record. A requirements specification is a document about one product release, while this graph is a standing record, so scope here is a node that can be re-answered rather than a section that is rewritten. Definitions are a numbered section there and are met on the way here, through the terms each node defines. References are a numbered section there and are here the traditions the record reads, reached from each node's readings. And the overview is a numbered section there and is not a node here: the author's words of 2026-09-02 leave it to blog-shaped content, later, which the record does not yet make; where the record's overview lives is `self-documentation`'s question, and the option `overview-as-blog-shaped-content` is recorded there.
```

## Account

### Sitting on purpose, 2026-09-03

**The requirements reading, re-oriented**

The question is re-oriented to purpose, scope, references; definitions are met through the terms nodes define; overview is left to projections; the intended readers are stated inside purpose as the tradition states them inside its purpose section.

Facts: authority deferred until the author reads the sections; boldness moderate; persistence standing.

Proposed text: the draft section of this node.

Responses open: confirm as shown; confirm with edits; deny with feedback.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Draft question and answer say the tradition opens with 'purpose, then scope, then references, with definitions and an overview alongside'. IEEE 830-1998 section 1 orders 1.1 Purpose, 1.2 Scope, 1.3 Definitions, 1.4 References, 1.5 Overview, so definitions precede references in the source. A reading's content is what the source says. Suggested edit: state the standard's order and record this graph's handling of definitions as the divergence.
- Draft rationale records one divergence (a specification is about one release, this is a standing record) but not the second the answer makes: the standard has an Overview section and this graph defers the overview to 'projections shaped like an introduction rather than to a node'. Evaluation says an unrecorded conflict with a cited tradition is a frontier item. Suggested edit: record it as a divergence.

On the three facts: Deferred until the author reads the sections is right, moderate boldness is right, and standing is right for a reading.

Strongest counter-argument (weak): The reading now supports what the author already decided rather than testing it. The original question asked whether the tradition supports progressing to audience, and the author's answer was that the title alone does not support it, so the question was re-oriented to the progression the author preferred. That is legitimate, but the reading's remaining evidential value is small: it now says the standard opens with purpose and scope, which was never in doubt. Worth one line.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Draft answer says the tradition opens with 'purpose, then scope, then references, with definitions and an overview alongside'. IEEE 830-1998 section 1 orders 1.1 Purpose, 1.2 Scope, 1.3 Definitions, 1.4 References, 1.5 Overview, so definitions precede references in the source. A reading's content is what the source says. Suggested edit: state the standard's order and record this graph's handling of definitions as the divergence.
- Draft rationale records one divergence (a specification is about one release, this is a standing record) and not the second the answer makes: the standard has an Overview section and this graph defers the overview to 'projections shaped like an introduction rather than to a node'. Evaluation calls an unrecorded conflict with a cited tradition a frontier item.
- Frontmatter recommendation is 'ratified, moderate' while the draft's own rationale says 'deferred until the author reads the sections'. The class and the node's text disagree; the prose Facts line says deferred, which is right.
- Draft answer: 'The intended readers are stated inside purpose, as the tradition states them inside its purpose section' presumes the audience prune, which is a separate ruling and is not named as a dependency.

On the three facts: The prose Facts line ('authority deferred until the author reads the sections; boldness moderate; persistence standing') is right and honest. The frontmatter recommendation class 'ratified' contradicts it and should be delegated or the node held until the author reads the sections.

Strongest counter-argument (weak): The reading now supports what the author already decided rather than testing it. The original question asked whether the tradition supports progressing to audience; the author answered that the title alone does not, and the question was re-oriented to the progression the author preferred. That is legitimate, but the reading's remaining evidential value is small: it now says the standard opens with purpose and scope, which was never in doubt, and it gets the standard's own ordering of definitions and references wrong.

The session's reply: Validated against IEEE 830-1998, whose section 1 orders purpose, scope, definitions, references, overview. Amended tonight: the draft states the standard's order, and the recommendation is delegated until the author reads the sections. The handling of definitions and of the overview is stated in the answer and named as the divergence at the sitting. The audience prune is a dependency the sitting names. Stage review.

### Frontier finding, 2026-09-03

Kind: coverage.

Readings' rule is that a reading is 'ratified when the author has read the primary source ... delegated when the AI's reading stands and the author declines to review it'. Five reading nodes now carry 'recommendation: class: delegated' (the two public readings, aristotle-hexis, plato-maieutics, plato-periagoge), applying the previous round's finding. Four do not: software-factories, spec-driven-development, srs-introduction and web-routing all carry 'class: ratified' while each of their own rationales says the reading is deferred until the author reads the sources. All ten readings additionally carry the stale prose Facts line offering 'ratified if the author confirms, or delegated where the author's words delegate it', which states two classes for one stamp.

Also named: commons.systems/public/aristotle-arche-of-action, commons.systems/public/pettit-non-domination, commons.systems/disposition-graph/aristotle-hexis, commons.systems/disposition-graph/plato-maieutics, commons.systems/disposition-graph/plato-periagoge, commons.systems/disposition-graph/software-factories, commons.systems/disposition-graph/spec-driven-development, commons.systems/disposition-graph/web-routing, commons.systems/disposition-graph/readings.

Proposed: Readings is the survivor of the rule. The four remaining reading nodes change their recommendation class from ratified to delegated, and every reading's prose Facts line is rewritten to 'delegated on confirmation; ratified after the author's reading', which is what the rule says and what the corrected five already imply. This is a mechanical pass the session can make at the recording, but the author should not be shown four readings offering a class the record's own rule forbids.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `draft` (ai); `record-overview-divergence` (review, 2026-09-03); `delegated-not-ratified` (review, 2026-09-03, from commons.systems/disposition-graph/spec-driven-development).
The recommendation adopts `draft` and is pinned to the standing text as it was at that commit.
Merge analysis of the author's words: 2026-09-02, own-question: The tradition's title alone does not support progressing to audience, which is acceptable; the progression from purpose to scope to reference makes sense, with definitions covered by hyperlinks and the overview by blog-shaped content, and the question should be re-oriented around that.
The census unit's note: The Draft is the recommendation and is the AI's rewrite rather than a transcription of the author's words, so its source is ai. The second alternative is the one review finding the session left owed rather than applied: I verified the draft now states the standard's order, so that half is discharged, while the overview divergence is still unrecorded in the draft's rationale. The counter-argument that the reading now supports what the author already decided proposes no text and is excluded. The reading-class coverage finding carried here is discharged; the node's prose Facts line still says deferred where the frontmatter says delegated, which is a Facts-line cleanup rather than an alternative.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Recommendation fence, Rationale: it records one divergence — 'a requirements specification is a document about one product release, while this graph is a standing record' — and not the second the answer makes, that the standard has an Overview section which this graph 'left to projections shaped like an introduction rather than to a node'. Evaluation calls an unrecorded conflict with a cited tradition a frontier item deferred to neither side. The `record-overview-divergence` alternative is the vehicle and the session left it owed; the fence still records one divergence.
- Verified applied since the last review: the fence now states the standard's own order (purpose, scope, definitions, references, overview), correcting the earlier misordering of definitions and references.
- Recommendation fence, Answer: 'The intended readers are stated inside purpose, as the tradition states them inside its purpose section.' This presumes the audience prune, which is in this same batch as a separate ruling, and the node names no dependency on it. If the author denies the prune, the sentence is false the moment it lands.
- The node carries a '## Disposition' section with the author's words dated 2026-09-02, which grounds the re-orientation; it is one of the few reading nodes that does. The fence's class is deferred, which matches the rationale's 'deferred until the author reads the sections', while the frontmatter recommendation says delegated — the class the record's own rule confers on a confirmation. The two differ and the account does not say which the author is giving.

On the three facts: The frontmatter recommendation (adopts draft, delegated, moderate) states one class and one value and the pin is current; delegated is the class readings' rule requires. The fence's own frontmatter says 'class: deferred', so the recommended text and the recommendation disagree about the class a confirmation writes, and the account should say which governs. Persistence standing follows from the node's shape.

Strongest counter-argument (weak): The reading now supports what the author already decided rather than testing it: the original question asked whether the tradition supports progressing to audience, the author answered that the title alone does not, and the question was re-oriented to the progression the author preferred. That is legitimate, but the reading's remaining evidential value is small — it says the standard opens with purpose and scope, which was never in doubt — and its one substantive contribution, that definitions and overview are handled differently here, is exactly the divergence the fence still does not record.

The session's reply: Forward accepted. The second divergence and the dependence on the audience prune are accepted as findings for the author; the fence's deferred class against the recommendation's delegated is a placeholder the recording replaces. The discharged delegated-not-ratified alternative is struck.

### Frontier finding, 2026-09-03

Kind: merge.

Four questions are each pending as the same alternative on four to six different nodes, so the author would rule one question up to six times. Verified from the frontier's alternatives lists: (i) `say-instrument-not-criterion` is pending on scope, work-loop, transience and purpose, and each entry says the same thing — that until instruments is ruled the answer says 'instrument', the term instruments actually defines, since 'criterion' is in no node's `defines` and 'criteria' is not in FRONTMATTER_KEYS; instruments owns the question and stands at the maieutic stage with `define-criterion` pending. (ii) `delegated-not-ratified` is pending on software-factories, spec-driven-development, srs-introduction and web-routing, each saying that a reading whose source the author has not read is delegated and not ratified; readings owns the rule and all four recommendations have in fact already been corrected to delegated, so four alternatives now stand for a change already made. (iii) `traditions-to-readings` is pending on materialization, validation-order, instruments and evaluation, each saying the node's prose tradition list goes to readings under the stub-traditions ruling; stub-traditions owns the enumeration and its own `regenerate-enumeration` alternative says the enumeration is incomplete and should be derived rather than maintained by hand. (iv) The same ruling appears as `deferred-rather-than-ratified` on legacy and recording, `deferred-until-ruling-quoted` on validation-order and evaluation, and `deferred-not-ratified` on review and persistence — six nodes, three names, one question: whether a node recommending ratification with no ruling quoted in it should drop to deferred instead; quotes owns that question. Under validation 15 each of these is a new answer to a question the record already asks, standing as its own alternative on a node that does not own the question.

Also named: commons.systems/disposition-graph/instruments, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/stub-traditions, commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/scope, commons.systems/disposition-graph/work-loop, commons.systems/disposition-graph/transience, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/software-factories, commons.systems/disposition-graph/spec-driven-development, commons.systems/disposition-graph/web-routing, commons.systems/disposition-graph/materialization, commons.systems/disposition-graph/validation-order, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/legacy, commons.systems/disposition-graph/persistence, commons.systems/disposition-graph/review, commons.systems/disposition-graph/recording.

Proposed: Instruments is the survivor of the criterion vocabulary, readings of a reading's class, stub-traditions of the prose tradition lists, and quotes of what an unquoted ratified stamp becomes. Each survivor takes one alternative saying that its ruling settles the question for every node that carries the per-node entry, and each per-node alternative is then a consequence of the survivor's ruling rather than a separate ruling — which is what the record already does for the four readings, whose class was changed once and recorded four times. The four per-node families stay listed so the author can see the blast radius, but the ruling order puts the survivor first and the alignment page should say that confirming the survivor discharges them. Case (ii) is the clearest: all four recommendations already read delegated, so those four alternatives are discharged and should be struck rather than ruled.

Recorded as a pending alternative on commons.systems/disposition-graph/instruments: `one-ruling-for-the-word` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/readings: `one-ruling-for-the-reading-class` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/stub-traditions: `one-ruling-for-the-prose-lists` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/quotes: `one-ruling-for-the-unquoted-stamp` (source review, 2026-09-03).

### Alternatives discharged, 2026-09-03

At the clean-context review of 2026-09-03 the session struck the alternatives the record had already discharged: `delegated-not-ratified` dropped, the recommendation already reads delegated, as readings' rule requires.

### Fence re-encoded, 2026-09-05

The recommended text carried the node-level `relation: adopted` the reader no longer accepts, found by the reading of the readings node on 2026-09-05; it now carries the `bears` entry the node itself carries. The recommendation's pin moves with the fence, so the node returns to review.

### Clean-context review, 2026-09-05

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Recommendation fence, Answer (validation 4, a tradition represented accurately). The fence states one order as the tradition's: 'The tradition opens a specification with purpose, then scope, then definitions, then references, then an overview'. That is IEEE Std 830-1998 section 1 (1.1 Purpose, 1.2 Scope, 1.3 Definitions, 1.4 References, 1.5 Overview) and it is not the second source the node cites. The node's own `source` field summarises that source as 'ISO/IEC/IEEE 29148:2018, section 9, the SRS outline (purpose, scope, product overview, definitions)' — an outline in which the product overview comes before definitions and references are a clause of their own rather than the fourth item of the introduction. So the frontmatter's summary of the second source contradicts the answer's single stated order, inside one node. The earlier reading of 2026-09-03 corrected the ordering of definitions against references and the fix took, but it fixed the composite against one standard only. Suggested edit: 'The tradition opens a specification with purpose, then scope. IEEE 830-1998 then gives definitions, references and an overview in that order; ISO/IEC/IEEE 29148:2018 places a product overview and definitions inside the introduction and references in a clause of their own. This graph's onboarding walk adopts the first two ...'
- Recommendation fence, Rationale (validation 4, a divergence recorded as the author's; evaluation's 'an unrecorded conflict is a frontier item deferred to neither side'). The rationale records exactly one divergence — 'The one divergence to record: a requirements specification is a document about one product release, while this graph is a standing record' — while the answer makes three departures from the source it reads: definitions are a numbered section there and here are 'met on the way, through the terms each node defines'; references are a numbered section there and here are 'the traditions the record reads reached from each node's readings'; and the overview is a numbered section there and here is 'left to projections shaped like an introduction rather than to a node'. Three readings of 2026-09-03 named the overview and the session left it owed each time; the references departure is named by none of them and by no option. The `record-overview-divergence` option is the vehicle for two of the three and would have to be widened to carry the third. Suggested edit: the rationale records three divergences and states the relation against each, or `record-overview-divergence` is amended to name definitions, references and the overview together.
- Recommendation fence, Answer (validation 1, drift from the author's words; validation 5, presuming what is unmaterialized). The fence says the overview 'is left to projections shaped like an introduction rather than to a node'. The author's words on this node say something else and in a different tense: 'overview can be provided later by blog-shaped content'. Two things follow. First, 'projection' is a term of art here whose enumeration the projection node owns — the graph browser, the alignment page, the README, the description and discovery tags, CLAUDE.md and CLAUDE.local.md, the rules — and none of them is shaped like an introduction; grep over `disposition/` finds 'shaped like an introduction' on this node alone. So the sentence presumes, in the present tense, a projection the record neither has nor owes, without saying it is unmaterialized. Second, grep finds 'blog' in the record only in this node's Disposition quotation and on `coverage`, where 'The public site and blog' stands as function 10 among the functions coverage says fall outside the purpose as worded, unruled. The draft has converted the author's 'later, by blog-shaped content' into a standing arrangement of projections. Suggested edit: 'and the overview is not a node: the author's words of 2026-09-02 leave it to blog-shaped content, later, which the record does not yet make.'
- Merge (validation 15), naming commons.systems/disposition-graph/self-documentation. Where the record's overview lives is a question the record already asks, and this reading answers it in passing. `self-documentation` asks 'How does this repository document itself?', stands at the maieutic stage with one answer option, `section-of-its-own`, and rests on the author's high-level order; `projection` asks 'How is the record read?' and owns the enumeration of projections the clause above would add to. Under validation 15 the draft's clause is a new answer to a question the record already asks and belongs there as an option with its source, not settled inside a reading. Proposed as an option on `self-documentation`, named `overview-as-blog-shaped-content`, carrying: 'The record's overview — the introduction-shaped orientation a newcomer reads before the graph — is not a node and not a section of the graph: it is provided later by blog-shaped content, as the author said on 2026-09-02, which is what the srs-introduction reading relies on when it declines the standard's Overview section. Until that content exists the record has no overview and says so.' The review proposes and does not record it; the session validates it before it is applied.
- Recommendation fence, Answer (the round: a contradiction between two drafts moved this sitting). The fence says 'this graph's onboarding walk adopts the first two: the purpose node first, scope as its refinement'. `commons.systems/disposition-graph/second-stop`, at the ruling stage in this same round and recommending `rewrite-model`, answers the question 'What does a newcomer read after purpose?' with 'The model node. ... No node is inserted between purpose and model, so the second stop is the node that already answers the question.' Two drafts describe what follows purpose differently, and the walk's order is a question `scope` owns ('This node is the table of contents of that walk') and `second-stop` refines. A reading's own work is what the source says and what the relations on its `bears` entries adopt; asserting the walk's order in prose puts this node in the way of the two that own it. Suggested edit: say what the tradition supports and let the adoption be carried by the relation — 'and this graph adopts the first two: the purpose node, and scope refining it, as the scope node's order records' — rather than by an independent claim about the onboarding walk.
- Recommendation fence, Answer, last sentence (validation 3, a claim about the record verified; and a dependency not named). 'The intended readers are stated inside purpose, as the tradition states them inside its purpose section.' The second clause is accurate: IEEE 830-1998 section 1.1 asks the purpose subsection to delineate the purpose of the SRS and specify its intended audience. The first clause is doing work on another node: `commons.systems/disposition-graph/audience` recommends `prune` on its existence fact, at the ruling stage, and the reason recorded in its `## Facts` is this reading almost verbatim — 'Purpose states its readers, as the requirements tradition states them inside its purpose section.' One claim grounds a prune on one node and is asserted as settled on another, and neither node names the other in `depends`. If the author denies the prune the record keeps a node whose question is who the repository is for while this reading says the readers are stated inside purpose. Suggested edit: add `depends: - commons.systems/disposition-graph/audience` to this node (a bare id, since the prune is on audience's existence fact and `depends` names options on the answer fact only), or narrow the sentence to what the source says — 'and the tradition states the intended readers inside its purpose section' — leaving where this record states them to `audience` and `purpose`.
- Facts, authority (validation 3, the class the session means to present). The authority fact carries `recommends: delegated`, while the fence's Rationale says the reading is 'deferred until the author reads the sections'. Under the `readings` node's own glosses these are different acts: 'delegated when the AI's reading stands and the author declines to review it, deferred when the author accepts it for now and queues the primary reading'. The node's text says the author will read the sections, which is deferred; the fact recommends the class that says they will not. This disagreement has been reported by the readings of 2026-09-03 twice, and the frontier finding carried on this node moved the class to delegated as a uniform pass over the four remaining readings without touching the sentence that contradicts it. Suggested edit: move the authority fact's recommendation to `deferred`, which is what the node's own rationale describes and what readings' gloss names; or, if delegated is meant, strike 'deferred until the author reads the sections' from the fence's rationale, since a class stated in prose is a fact the record now carries as data.
- Facts, answer, boldness (validation 3). `boldness: moderate` understates what the recommendation rests on. Boldness is how much of the recommendation rests on the AI's own knowledge against the record, and here that is all of it: the record holds neither standard, the rationale says the answer was 'Validated by the AI from its own knowledge of the standards', and this reading found one of those recalled claims wrong (the 29148 ordering, finding 1 above). High boldness is low confidence, and low confidence is the honest report on a text no one has checked against its sources. Suggested edit: `boldness: high` on the answer fact, with the fact's own reason saying that the sources are unread and the class recommended reflects it.
- Recommendation fence, frontmatter `bears` (validation 4). The fence carries `- fact: answer / option: standing / relation: adopted`, which names the option that stands on the parent, `commons.systems/disposition-graph/purpose`. Purpose's answer fact has `stands: standing` and `recommends: draft`. The `readings` node's rule makes exactly this the review's to report: 'A move of a recommendation re-points the readings that bear on the option it leaves, and a recommended option that no reading has been read against, beside a rival one has, is a finding of the review.' Purpose's recommended option `draft` has no reading bearing on it while its rival `standing` has this one. The re-encoding of 2026-09-05 put this entry into the fence, so it is inside the text under review. Suggested edit: add a second `bears` entry on `option: draft` with its relation, or re-point the entry, saying in the fence which of purpose's options the tradition is read against. Noted for the session and not judged here: purpose's other readings — `spec-driven-development`, `software-factories`, `aristotle-hexis` — all bear on `standing` alone, so the same gap is record-wide and its sweep is the survey's, not this reading's.

On the facts and what they recommend: The answer fact recommends `draft` over the standing option at moderate boldness with a `## Recommendation` fence present, which is the right shape since the recommended option is not the one that stands; the boldness should be high rather than moderate, because every factual claim in the answer is the AI's unverified recall of two standards the record does not hold and one of them is wrong. The authority fact recommends `delegated` while the fence's rationale says 'deferred until the author reads the sections', which the readings node's glosses make two different acts, so the class presented is not the one the node's text describes. No existence and no persistence fact is carried, and neither is owed: no prune is proposed and the fence declares no shim, liquidates none, and adds or drops no evidence, so the node's shape does not change.

On the viability of the options: On the answer fact all three listed options are viable and one viable option is missing. `standing` is dominated on the record's criteria, since it misstates the source's order ('purpose, then scope, then the intended audience and definitions') which is the defect `draft` was written to repair, but it cannot be marked passed while it is the option that stands, so nothing is owed on it; `record-overview-divergence` is a live delta option and still the vehicle for the divergence the record has now owed through three readings, though as written it names only the overview and the handling of definitions and would have to be widened to carry the references departure too. Missing, and worth the author's ruling: an option that confines the answer to what the two sources say and lets the `bears` relations carry the adoption, instead of asserting four arrangements of this record that other nodes own — name it `say-only-what-the-source-says`, carrying 'The answer states the order each standard gives and nothing about this graph: the adoption is the relation on the reading's `bears` entry, and where the walk goes, how definitions are met, where the overview lives and where the readers are stated are the scope, second-stop, self-documentation and audience nodes' to answer. A reading that states the record's arrangements in prose puts a second answer beside theirs and goes stale when either moves.' On the authority fact the reserved three are complete. No existence fact is owed: pruning this reading is dominated, since it carries the author's own words of 2026-09-02 and is the ground `audience`'s prune cites.

Strongest counter-argument (moderate): Every substantive claim in this reading is the AI's recall of two standards the record does not hold and no one has checked, and this reading found one of those claims wrong in the node's own frontmatter. The authority fact nonetheless recommends delegated, which under the readings node means the AI's reading stands and the author declines to review it — so a confirmation would fix on unchecked recall the ground of four other arrangements: the onboarding walk's order, definitions met by links, the overview's home, and the readers stated inside purpose, the last of which `audience`'s prune already cites as its reason. The reading's one uncontested claim, that the standard opens with purpose and then scope, was never in doubt; the claims that carry weight in the record are exactly the unverified ones. The remedy is written into the node already and contradicted by its own fact: 'deferred until the author reads the sections'.

The session's reply: Nine findings, all validated on this thread and all accepted. The answer no longer states one composite order for two standards: IEEE 830-1998 gives definitions, references and an overview in that order, and ISO/IEC/IEEE 29148:2018 puts a product overview and definitions inside the introduction and references in a clause of their own, which is what the node's own `source` field already said and the answer contradicted. The rationale records four divergences where it recorded one: the standing record against the single release, and definitions, references and the overview, each with the node that owns the record's handling of it named. The overview clause no longer asserts a projection shaped like an introduction, a thing the projection node's enumeration does not hold and the record does not make; it says what the author said, that the overview comes later by blog-shaped content, and names `self-documentation` as the node that owns it. That node now carries the option `overview-as-blog-shaped-content`, source review, in the reader's words, since under validation 15 a reading may not settle in passing a question the record already asks. The claim about the onboarding walk's order is struck: the answer says the tradition's opening is adopted, the purpose node with scope refining it, as the scope node's order records, and leaves what follows to scope and second-stop, which is what `second-stop` at the ruling stage answers differently. The sentence on the intended readers is narrowed to what the sources say, so the reading no longer asserts on `audience`'s behalf the very claim that grounds its prune; `depends` is not added, the narrowed sentence carrying no dependency. The authority fact moves to `deferred`, which is what the node's own rationale says and what the readings node's gloss names; delegated was written here by the uniform pass of 2026-09-03 without touching the sentence that contradicts it, and whether the readings move together is `readings`' question, named in the fact's reason. Boldness moves to high, low confidence in this record's direction: neither standard is in the record, the whole answer is recall, and this reading found one of those recalled claims wrong. The `bears` entries, on the node and in the fence, now name `draft` as well as `standing`, so the reading is read against the option purpose recommends and not only against the one it stands on; that purpose's other three readings bear on `standing` alone is the survey's sweep and not this reading's. `record-overview-divergence` is passed over, the recommended text having recorded every divergence it asked for and two more. The option the viability section names is recorded as `say-only-what-the-source-says`, source review, the stricter limb in which the answer says nothing about this graph at all and the `bears` relations carry the whole adoption; the case against it, that a divergence cannot be recorded without saying what the record does instead, is stated beside it, and the author rules.

### Frontier survey, 2026-09-05

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- This node's authority fact recommends `deferred`, and `npm-committed-lockfile`'s authority fact carries options with no `recommends` at all. Those two are the counterexamples that make false the formula "as every reading on the record recommends" carried verbatim in the `### authority` prose of forty-six reading nodes. Recorded as the cross-node `contradiction` finding; noted here because this node is one of the two counterexamples and is in the judged set.

Strongest counter-argument (moderate): What the tradition supplies is a document convention — purpose, scope, definitions, references, overview — and the answer converts it into a claim about how questions refine one another in a graph, which the source does not make. IEEE 830's ordering serves a reader going front to back through one document; this record's onboarding walk is a rank order over a tree, decided by `attention` and `scope` on other ground, and the reading lends it authority it did not earn. Boldness `high` is recorded, and the answer also settles the author's purpose-or-scope question — "both, in that order" — on the strength of that borrowed authority.

### Frontier finding, 2026-09-05

Kind: contradiction.

Forty-six reading nodes carry, verbatim, as the first sentence of the `### authority` subsection inside `## Facts`, the claim: "Delegated, as every reading on the record recommends, because the relation is the AI's from its own knowledge of the source and the author has not read it here." The claim is false at this commit. Measured on the graph: 59 nodes carry `form: reading`; 57 recommend `delegated` on the authority fact; `commons.systems/disposition-graph/srs-introduction` recommends `deferred` (disposition/disposition-graph/srs-introduction.md, `### authority`); and `commons.systems/disposition-graph/npm-committed-lockfile` carries an authority fact with its three options and no `recommends` at all (disposition/disposition-graph/npm-committed-lockfile.md, `### authority`). `commons.systems/disposition-graph/readings` carries a variant of the same claim in its authority fact's `against`, at lines 47 and 155: "every reading on the record recommends delegated for itself". The defect is not only that the count is wrong today. A standing answer that asserts a census of the record goes stale the moment a reading is minted, which is exactly what `commons.systems/disposition-graph/authority` records as the option `no-census-in-a-standing-answer` and what the `codd-update-anomaly` reading names — and `codd-update-anomaly` is itself one of the forty-six carrying it. Two nodes have already corrected their live text and carry the formula only in their `## Account`: `madr-decision-records` (line 184) and `progressive-disclosure` (lines 135 and 162); `madr-decision-records`'s corrected text refers the general question to this survey by name. Those two are named here as context and are not defects.

Also named: commons.systems/disposition-graph/anchoring-and-adjustment, commons.systems/disposition-graph/appellate-review-en-banc, commons.systems/disposition-graph/approval-directed-agents, commons.systems/disposition-graph/bentham-publicity, commons.systems/disposition-graph/brooks-surgical-team, commons.systems/disposition-graph/change-reviewed-as-a-diff, commons.systems/disposition-graph/chenery-reasoned-decision, commons.systems/disposition-graph/chestertons-fence, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/deprecation-not-deletion, commons.systems/disposition-graph/dissent-and-reconsideration, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/event-sourcing-derived-view, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/file-drawer-and-pre-registration, commons.systems/disposition-graph/hansard-verbatim-record, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/legislative-amendment-in-context, commons.systems/disposition-graph/level-triggered-reconciliation, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/montgomery-informed-consent, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/nielsen-user-control-and-freedom, commons.systems/disposition-graph/none-of-the-above-ballot, commons.systems/disposition-graph/non-liquet, commons.systems/disposition-graph/notarial-minute, commons.systems/disposition-graph/not-proven-third-verdict, commons.systems/disposition-graph/n-version-programming, commons.systems/disposition-graph/ocap-attenuation, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/pareto-frontier, commons.systems/disposition-graph/peirce-paper-doubt, commons.systems/disposition-graph/promotor-fidei, commons.systems/disposition-graph/review-approval-pinned-to-a-revision, commons.systems/disposition-graph/rfc-pep-status-field, commons.systems/disposition-graph/roberts-rules-commit-or-refer, commons.systems/disposition-graph/scholarly-peer-review, commons.systems/disposition-graph/scholastic-articulus, commons.systems/disposition-graph/segregation-of-duties, commons.systems/disposition-graph/self-contained-specification, commons.systems/disposition-graph/single-subject-rule, commons.systems/disposition-graph/special-verdict-form, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand, commons.systems/disposition-graph/value-of-information, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/npm-committed-lockfile, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/progressive-disclosure, commons.systems/disposition-graph/authority.

Proposed: Strike the census from all forty-six and from `readings`' `against`, replacing it with the rule rather than the count: the class recommended is delegated because the relation is the AI's from its own knowledge of the source and the author has not read it here — which is the reason, and which stands whatever other readings recommend. `madr-decision-records` and `progressive-disclosure` have already made this correction in their live text and are the model. Where a node wants to say that this is the record's settled practice for readings, it cites `commons.systems/disposition-graph/class-recommendation` rather than counting. `srs-introduction`'s `deferred` and `npm-committed-lockfile`'s absent recommendation are left as they are: they are the two counterexamples, and the point of the fix is that a rule stated as a rule does not need them to disappear.

Recorded as an option on commons.systems/disposition-graph/authority's answer fact: `no-census-anywhere-in-a-node` (source review, 2026-09-05).
