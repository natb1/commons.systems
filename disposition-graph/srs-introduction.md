---
question: Does the requirements-specification tradition support opening with purpose, then scope, then references?
stage: ruling
recommendation:
  adopts: draft
  boldness: moderate
  amends: "686388606159b2b7c10aacf520c592e38d170982"
  at: "6d21d356d65f5fa206cb60bc3e923c462acc920e"
review:
  verdict: forward
  strength: weak
  date: 2026-09-03
  of: 52a05465b7b4abe375d21c72131b254b97f59a1e
alternatives:
  - name: draft
    source: ai
  - name: record-overview-divergence
    source: review
    ref: "2026-09-03"
facts:
  - name: authority
    choices:
      - ratified
      - delegated
    adopts: delegated
    boldness: moderate
form: reading
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/purpose
source: IEEE Std 830-1998, Recommended Practice for Software Requirements Specifications, section 1 (Purpose, Scope, Definitions, References, Overview); ISO/IEC/IEEE 29148:2018, section 9, the SRS outline (purpose, scope, product overview, definitions).
relation: adopted
---
## Disposition

The author, 2026-09-02:
> The tradition is a good reference but the title alone of the tradition doesn't seem to support progression to audience. That's ok - The progression from purpose to scope to reference makes sense (definitions are covered on the way via hyperlinks and overview can be provided later by blog-shaped content). The question for the reference should be re-oriented around that.

## Answer

Supports. The tradition opens a specification with purpose, then scope, then the intended audience and definitions, and this graph's onboarding walk adopts that order: the purpose node first, with scope, audience, and the vocabulary-defining nodes as its first refinements. It also settles the author's question whether "scope" or "purpose" is the better starting place: both, in that order. Purpose is the why and sits under the archē; scope is the what and follows from purpose.

## Rationale

Validated by the AI from its own knowledge of the standards on 2026-09-02; deferred until the author reads the sections. The one divergence to record: an SRS is a document about one product release, while this graph is a standing record, so "scope" here is a node that can be re-answered rather than a section that is rewritten.

## Alternatives

### draft

The draft re-orients the reading on the author's words of 2026-09-02. Where the standing answer says the tradition opens with purpose, then scope, then the intended audience and definitions, and adopts purpose, scope, audience and the vocabulary-defining nodes, the draft states the standard's own order, purpose, scope, definitions, references, overview, and adopts only the first two: definitions are met through the terms each node defines, the overview is left to projections shaped like an introduction, and the intended readers are stated inside purpose. It also drops the standing answer's settling of scope against purpose as a starting place. The rationale records the re-orientation and keeps the one divergence, that a specification is about one release while this graph is a standing record.

### record-overview-divergence

Both readings found a second divergence the draft's rationale does not record: the standard has an Overview section and this graph defers the overview to projections rather than to a node, which evaluation calls an unrecorded conflict with a cited tradition. The session's reply left it owed at the sitting. This alternative is the draft with both divergences recorded, the handling of definitions through links and the deferral of the overview, and the relation stated against them.

## Recommendation

```markdown
---
question: Does the requirements-specification tradition support opening with purpose, then scope, then references?
form: reading
authority:
  class: deferred
  by: claude
  date: 2026-09-03
under:
  - commons.systems/disposition-graph/purpose
source: IEEE Std 830-1998, Recommended Practice for Software Requirements Specifications, section 1 (Purpose, Scope, Definitions, References, Overview); ISO/IEC/IEEE 29148:2018, section 9, the SRS outline (purpose, scope, product overview, definitions).
relation: adopted
---
## Answer

Supports. The tradition opens a specification with purpose, then scope, then definitions, then references, then an overview, and this graph's onboarding walk adopts the first two: the purpose node first, scope as its refinement, and the traditions the record reads reached from each node's readings. Definitions are met on the way, through the terms each node defines, and the overview is left to projections shaped like an introduction rather than to a node. The intended readers are stated inside purpose, as the tradition states them inside its purpose section.

## Rationale

Validated by the AI from its own knowledge of the standards on 2026-09-02, and re-oriented on the author's ruling that the progression is purpose, scope, reference, with definitions covered by links and overview by blog-shaped content; deferred until the author reads the sections. The one divergence to record: a requirements specification is a document about one product release, while this graph is a standing record, so scope here is a node that can be re-answered rather than a section that is rewritten.
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
