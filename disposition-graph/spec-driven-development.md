---
question: Does spec-driven development support this repository's purpose?
stage: ruling
recommendation:
  adopts: standing
  class: delegated
  boldness: high
  amends: "3d9e3b26cabec954290ca3c081d8c118bfbad14c"
  at: "6d21d356d65f5fa206cb60bc3e923c462acc920e"
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: 3d9e3b26cabec954290ca3c081d8c118bfbad14c
alternatives:
  - name: chosen-over
    source: review
    ref: "2026-09-03"
  - name: split-sources
    source: review
    ref: "2026-09-03"
form: reading
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/purpose
source: Spec-driven development as practised in AI coding tools from 2025, AWS Kiro (July 2025, with requirements, design, and task documents) and GitHub Spec Kit (September 2025, with a constitution, specification, plan, and tasks). Lineage, Knuth, "Literate Programming" (1984); Meyer, Design by Contract (1986); Adzic, Specification by Example (2011).
relation: adopted
---
## Answer

Supports, with a recorded divergence. Adopted: the specification, not the prompt, is the source of truth for what agents build, and a standing constitution of principles governs every specification. Diverged: spec-driven development keeps per-feature specifications, plans, and task lists as durable artifacts. Here the durable record is the graph of standing answers; plans and tasks are regenerated from it when work is claimed, so nothing that could go stale is kept.

## Rationale

The term is current and dominant in AI coding practice of 2025 and 2026, which makes it the audience's own vocabulary and a discovery term. Its older lineage is the tradition that the description of the program is the source of truth. Validated by the AI on 2026-09-02 from its own knowledge, not from primary reading; deferred until the author reads the sources.

## Alternatives

### chosen-over

Both reviews' strongest counter-argument is that the recorded divergence is the whole of the practice: what makes spec-driven development work in the 2025 tools is exactly the per-feature requirements, design and task documents this reading rejects, and replacing them with a graph of standing answers keeps the name and drops the mechanism. On the thing the tradition is for, the relation is nearer to 'chosen over' than to 'adopted', and calling it adopted lets the audience's expectation of the term do work the record has not earned, which purpose leans on in its first paragraph. The session's reply hands the choice to the author: whether the specification reconciliation derives from the answers counts as adopting the tradition or choosing over it.

### split-sources

Both reviews find that the `source` field bundles two 2025 products, AWS Kiro and GitHub Spec Kit, with a three-item lineage, Knuth 1984, Meyer 1986 and Adzic 2011, under one `relation: adopted`, while the lineage is a different tradition from the tooling and would divide differently on the divergence recorded. Readings' rule is one tradition per reading. The session's reply records the split as owed at the sitting rather than made, so the alternative is a node whose source is the tooling alone, with the lineage read separately.

## Account

### Recording of 2026-09-03

Reclassified as unanswered at the author's ruling of 2026-09-03, quoted on the unanswered node: the answer above, stamped deferred during bootstrap before the alignment dialogue existed, stands as the draft the author rules on, and the clean-context review runs on it before the ruling. Nothing in the node was changed by the reclassification.

Facts: authority delegated on confirmation, ratified after the author's reading; boldness high; persistence standing.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Facts line: 'ratified if the author confirms'. The Rationale is explicit that the reading was made 'from its own knowledge, not from primary reading', which makes ratified the wrong class to offer even more clearly than on the other readings. Delegated is what a confirmation confers.
- Answer: 'plans and tasks are regenerated from it when work is claimed, so they cannot go stale.' Stronger than the record supports: a regenerated plan can be stale against a graph that moved between the claim and the landing, which is why work-loop re-derives the frontier after every landing. Suggested edit: 'nothing that could go stale is kept'.
- Frontmatter 'source' bundles two 2025 products (Kiro, Spec Kit) with a three-item lineage (Knuth 1984, Meyer 1986, Adzic 2011) under one 'relation: adopted'. The lineage is a different tradition from the tooling and would divide differently on the divergence recorded; readings' recommended answer requires one tradition per reading.
- Answer: 'a standing constitution of principles governs every specification' is adopted from Spec Kit; the record's nearest equivalent is doctrine, which is empty, since nothing is ratified. Adopting a mechanism the record does not yet have is legitimate but nothing marks it as owed.

On the three facts: Generic template with the wrong class. Boldness is high here specifically: the node says the reading was not made from primary sources, so nothing in it rests on the record or the author's words, and the facts should say so rather than 'as the rationale shows'.

Strongest counter-argument (moderate): The recorded divergence is the whole of the practice. What makes spec-driven development work in the 2025 tools is exactly the per-feature artifacts this reading rejects: the requirements, design and task documents are what the agent reads, and the specification is useful because it is close enough to the work to be executable. Replacing them with a graph of standing answers keeps the name and drops the mechanism, so 'adopted, with a recorded divergence' understates the relation — on the thing the tradition is actually for, this is nearer to 'chosen over'. Calling it adopted lets the audience's expectation do work the record has not yet earned, and purpose leans on that expectation in its first paragraph.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Frontmatter recommendation is 'ratified, moderate' while the Rationale says the reading was made 'from its own knowledge, not from primary reading; deferred until the author reads the sources'. Readings makes ratified conditional on the author's reading. Suggested edit: present delegated, as the sibling readings now do.
- Answer: 'plans and tasks are regenerated from it when work is claimed, so they cannot go stale.' Stronger than the record supports: a regenerated plan can be stale against a graph that moved between the claim and the landing, which is why work-loop re-derives the frontier after every landing. Suggested edit: 'nothing that could go stale is kept'.
- Frontmatter 'source' bundles two 2025 products with a three-item lineage (Knuth 1984, Meyer 1986, Adzic 2011) under one 'relation: adopted'. The lineage is a different tradition from the tooling and would divide differently on the divergence recorded.
- Answer: 'a standing constitution of principles governs every specification' is adopted from Spec Kit; the record's nearest equivalent is doctrine, which is empty, since nothing is ratified. Nothing marks the mechanism as owed.

On the three facts: The frontmatter class should be delegated rather than ratified, for the same reason as the other readings. Boldness is high here specifically: the node says the reading was not made from primary sources, so nothing in it rests on the record or the author's words.

Strongest counter-argument (moderate): The recorded divergence is the whole of the practice. What makes spec-driven development work in the 2025 tools is exactly the per-feature artifacts this reading rejects: the requirements, design and task documents are what the agent reads, and the specification is useful because it is close enough to the work to be executable. Replacing them with a graph of standing answers keeps the name and drops the mechanism, so 'adopted, with a recorded divergence' understates the relation — on the thing the tradition is for, this is nearer to 'chosen over'. Purpose leans on the audience's expectation of the name in its first paragraph.

The session's reply: Validated. Amended tonight: the recommendation is delegated at high boldness, since the reading was made from the AI's own knowledge; 'so they cannot go stale' becomes 'so nothing that could go stale is kept'. Owed at the sitting: the lineage and the two products divide as sources, and the standing constitution of principles is named as doctrine, which is empty until something is ratified. On the counter-argument, that the graph of standing answers drops the mechanism that makes the tradition work: the record holds that a specification close enough to execute is what reconciliation derives from the answers, and the author rules whether that is adopted or chosen over. Stage review.

### Frontier finding, 2026-09-03

Kind: coverage.

Readings' rule is that a reading is 'ratified when the author has read the primary source ... delegated when the AI's reading stands and the author declines to review it'. Five reading nodes now carry 'recommendation: class: delegated' (the two public readings, aristotle-hexis, plato-maieutics, plato-periagoge), applying the previous round's finding. Four do not: software-factories, spec-driven-development, srs-introduction and web-routing all carry 'class: ratified' while each of their own rationales says the reading is deferred until the author reads the sources. All ten readings additionally carry the stale prose Facts line offering 'ratified if the author confirms, or delegated where the author's words delegate it', which states two classes for one stamp.

Also named: commons.systems/public/aristotle-arche-of-action, commons.systems/public/pettit-non-domination, commons.systems/disposition-graph/aristotle-hexis, commons.systems/disposition-graph/plato-maieutics, commons.systems/disposition-graph/plato-periagoge, commons.systems/disposition-graph/software-factories, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/web-routing, commons.systems/disposition-graph/readings.

Proposed: Readings is the survivor of the rule. The four remaining reading nodes change their recommendation class from ratified to delegated, and every reading's prose Facts line is rewritten to 'delegated on confirmation; ratified after the author's reading', which is what the rule says and what the corrected five already imply. This is a mechanical pass the session can make at the recording, but the author should not be shown four readings offering a class the record's own rule forbids.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `chosen-over` (review, 2026-09-03); `split-sources` (review, 2026-09-03); `delegated-not-ratified` (review, 2026-09-03, from commons.systems/public/pettit-non-domination).
The recommendation adopts `standing` and is pinned to the standing text as it was at that commit.
Moved to other nodes as alternatives: `delegated-not-ratified` on commons.systems/disposition-graph/software-factories; `delegated-not-ratified` on commons.systems/disposition-graph/srs-introduction; `delegated-not-ratified` on commons.systems/disposition-graph/web-routing.
The census unit's note: The node has an answer and no draft; its recommendation was already amended to delegated at high boldness, so it adopts the standing text. Two things are genuinely open for the author and I made them alternatives: whether the relation to the tradition is 'adopted with a recorded divergence' or 'chosen over', which the session's reply hands to the author in as many words, and the split of the bundled source into the tooling and its lineage, which the reply records as owed. The 'standing constitution of principles' point is an observation that the mechanism is unmaterialized, not a candidate answer, so it stays out. The node has no `## Disposition` section, so there is no merge analysis to do on the author's words here. The class-of-reading finding is moved to the three sibling readings it names.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Frontmatter `source` bundles two 2025 products (AWS Kiro, GitHub Spec Kit) with a three-item lineage (Knuth 1984, Meyer 1986, Adzic 2011) under one `relation: adopted`. The lineage is a different tradition from the tooling and would divide differently on the divergence recorded; readings' rule is one tradition per reading. The `split-sources` alternative is the vehicle and the session recorded it as owed.
- Answer: 'a standing constitution of principles governs every specification' is adopted from Spec Kit. The record's nearest equivalent is doctrine, which authority defines as the ratified answers taken together and which is empty, since nothing is ratified. The node adopts a mechanism the record does not have and nothing marks it as owed.
- Verified applied since the last review: 'so they cannot go stale' now reads 'so nothing that could go stale is kept', and the recommendation class is delegated at high boldness.
- The node carries no '## Disposition' section and no quoted ruling; its rationale says the reading was made 'from its own knowledge, not from primary reading', which is the most candid statement of provenance in the batch and should stay in the answer rather than only in the rationale.

On the three facts: The frontmatter recommendation (adopts standing, delegated, high) states one class and one value and the pin is current. High is right and is the correct value here specifically: the node says the reading was not made from primary sources, so nothing in it rests on the record or the author's words. Persistence standing follows from the node's shape.

Strongest counter-argument (moderate): The recorded divergence is the whole of the practice. What makes spec-driven development work in the 2025 tools is exactly the per-feature requirements, design and task documents this reading rejects: they are what the agent reads, and the specification is useful because it is close enough to the work to be executable. Replacing them with a graph of standing answers keeps the name and drops the mechanism, so 'adopted, with a recorded divergence' understates the relation — on the thing the tradition is for, this is nearer to 'chosen over', and purpose leans on the audience's expectation of the name in its first paragraph.

The session's reply: Forward accepted. The split of the sources stays open; the discharged delegated-not-ratified alternative is struck at this landing.

### Frontier finding, 2026-09-03

Kind: merge.

Four questions are each pending as the same alternative on four to six different nodes, so the author would rule one question up to six times. Verified from the frontier's alternatives lists: (i) `say-instrument-not-criterion` is pending on scope, work-loop, transience and purpose, and each entry says the same thing — that until instruments is ruled the answer says 'instrument', the term instruments actually defines, since 'criterion' is in no node's `defines` and 'criteria' is not in FRONTMATTER_KEYS; instruments owns the question and stands at the maieutic stage with `define-criterion` pending. (ii) `delegated-not-ratified` is pending on software-factories, spec-driven-development, srs-introduction and web-routing, each saying that a reading whose source the author has not read is delegated and not ratified; readings owns the rule and all four recommendations have in fact already been corrected to delegated, so four alternatives now stand for a change already made. (iii) `traditions-to-readings` is pending on materialization, validation-order, instruments and evaluation, each saying the node's prose tradition list goes to readings under the stub-traditions ruling; stub-traditions owns the enumeration and its own `regenerate-enumeration` alternative says the enumeration is incomplete and should be derived rather than maintained by hand. (iv) The same ruling appears as `deferred-rather-than-ratified` on legacy and recording, `deferred-until-ruling-quoted` on validation-order and evaluation, and `deferred-not-ratified` on review and persistence — six nodes, three names, one question: whether a node recommending ratification with no ruling quoted in it should drop to deferred instead; quotes owns that question. Under validation 15 each of these is a new answer to a question the record already asks, standing as its own alternative on a node that does not own the question.

Also named: commons.systems/disposition-graph/instruments, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/stub-traditions, commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/scope, commons.systems/disposition-graph/work-loop, commons.systems/disposition-graph/transience, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/software-factories, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/web-routing, commons.systems/disposition-graph/materialization, commons.systems/disposition-graph/validation-order, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/legacy, commons.systems/disposition-graph/persistence, commons.systems/disposition-graph/review, commons.systems/disposition-graph/recording.

Proposed: Instruments is the survivor of the criterion vocabulary, readings of a reading's class, stub-traditions of the prose tradition lists, and quotes of what an unquoted ratified stamp becomes. Each survivor takes one alternative saying that its ruling settles the question for every node that carries the per-node entry, and each per-node alternative is then a consequence of the survivor's ruling rather than a separate ruling — which is what the record already does for the four readings, whose class was changed once and recorded four times. The four per-node families stay listed so the author can see the blast radius, but the ruling order puts the survivor first and the alignment page should say that confirming the survivor discharges them. Case (ii) is the clearest: all four recommendations already read delegated, so those four alternatives are discharged and should be struck rather than ruled.

Recorded as a pending alternative on commons.systems/disposition-graph/instruments: `one-ruling-for-the-word` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/readings: `one-ruling-for-the-reading-class` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/stub-traditions: `one-ruling-for-the-prose-lists` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/quotes: `one-ruling-for-the-unquoted-stamp` (source review, 2026-09-03).

### Alternatives discharged, 2026-09-03

At the clean-context review of 2026-09-03 the session struck the alternatives the record had already discharged: `delegated-not-ratified` dropped, the recommendation already reads delegated, as readings' rule requires.
