---
question: Does spec-driven development support this repository's purpose?
stage: ruling
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: ee031b91079ad2fb45fe5d96b6ffd03a9ab1b560
  against: "The recorded divergence is the whole of the practice. What makes spec-driven development work in the 2025 tools is exactly the per-feature requirements, design and task documents this reading rejects: they are what the agent reads, and the specification is useful because it is close enough to the work to be executable. Replacing them with a graph of standing answers keeps the name and drops the mechanism, so 'adopted, with a recorded divergence' understates the relation — on the thing the tradition is for, this is nearer to 'chosen over', and purpose leans on the audience's expectation of the name in its first paragraph."
  survey:
    date: 2026-09-05
    of: ee031b91079ad2fb45fe5d96b6ffd03a9ab1b560
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-02"
      - name: chosen-over
        source: review
        ref: "2026-09-03"
      - name: split-sources
        source: review
        ref: "2026-09-03"
    recommends: standing
    boldness: high
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: delegated
    boldness: high
form: reading
under:
  - commons.systems/disposition-graph/purpose
source: Spec-driven development as practised in AI coding tools from 2025, AWS Kiro (July 2025, with requirements, design, and task documents) and GitHub Spec Kit (September 2025, with a constitution, specification, plan, and tasks). Lineage, Knuth, "Literate Programming" (1984); Meyer, Design by Contract (1986); Adzic, Specification by Example (2011).
bears:
  - fact: answer
    option: standing
    relation: adopted
---

## Facts

### answer

#### standing

Supports, with a recorded divergence.

**AI support.** The term is current and dominant in AI coding practice of 2025 and 2026, which makes it the audience's own vocabulary and a discovery term. Its older lineage is the tradition that the description of the program is the source of truth. Validated by the AI on 2026-09-02 from its own knowledge, not from primary reading; deferred until the author reads the sources.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Does spec-driven development support this repository's purpose?
form: reading
under:
  - commons.systems/disposition-graph/purpose
source: Spec-driven development as practised in AI coding tools from 2025, AWS Kiro (July 2025, with requirements, design, and task documents) and GitHub Spec Kit (September 2025, with a constitution, specification, plan, and tasks). Lineage, Knuth, "Literate Programming" (1984); Meyer, Design by Contract (1986); Adzic, Specification by Example (2011).
bears:
  - fact: answer
    option: standing
    relation: adopted
---

## Answer

Supports, with a recorded divergence. Adopted: the specification, not the prompt, is the source of truth for what agents build, and a standing constitution of principles governs every specification. Diverged: spec-driven development keeps per-feature specifications, plans, and task lists as durable artifacts. Here the durable record is the graph of standing answers; plans and tasks are regenerated from it when work is claimed, so nothing that could go stale is kept.
```

#### chosen-over

Both reviews' strongest counter-argument is that the recorded divergence is the whole of the practice: what makes spec-driven development work in the 2025 tools is exactly the per-feature requirements, design and task documents this reading rejects, and replacing them with a graph of standing answers keeps the name and drops the mechanism. On the thing the tradition is for, the relation is nearer to 'chosen over' than to 'adopted', and calling it adopted lets the audience's expectation of the term do work the record has not earned, which purpose leans on in its first paragraph. The session's reply hands the choice to the author: whether the specification reconciliation derives from the answers counts as adopting the tradition or choosing over it. As worded that choice cannot be recorded, which the second clean-context reading of `readings` found on 2026-09-05: under that node's recommended answer chosen over is derived from an adopted entry on an option that was not chosen, and never a relation a `bears` entry may carry. When `readings` is ruled the choice is re-worded here, as an entry on the rival option or as `diverged`, and the author is not offered a relation the encoding cannot hold.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

From: standing

```diff
@@ -12,4 +12,4 @@
 
 ## Answer
 
-Supports, with a recorded divergence. Adopted: the specification, not the prompt, is the source of truth for what agents build, and a standing constitution of principles governs every specification. Diverged: spec-driven development keeps per-feature specifications, plans, and task lists as durable artifacts. Here the durable record is the graph of standing answers; plans and tasks are regenerated from it when work is claimed, so nothing that could go stale is kept.
+Both reviews' strongest counter-argument is that the recorded divergence is the whole of the practice: what makes spec-driven development work in the 2025 tools is exactly the per-feature requirements, design and task documents this reading rejects, and replacing them with a graph of standing answers keeps the name and drops the mechanism. On the thing the tradition is for, the relation is nearer to 'chosen over' than to 'adopted', and calling it adopted lets the audience's expectation of the term do work the record has not earned, which purpose leans on in its first paragraph. The session's reply hands the choice to the author: whether the specification reconciliation derives from the answers counts as adopting the tradition or choosing over it. As worded that choice cannot be recorded, which the second clean-context reading of `readings` found on 2026-09-05: under that node's recommended answer chosen over is derived from an adopted entry on an option that was not chosen, and never a relation a `bears` entry may carry. When `readings` is ruled the choice is re-worded here, as an entry on the rival option or as `diverged`, and the author is not offered a relation the encoding cannot hold.
```

#### split-sources

Both reviews find that the `source` field bundles two 2025 products, AWS Kiro and GitHub Spec Kit, with a three-item lineage, Knuth 1984, Meyer 1986 and Adzic 2011, under one `relation: adopted`, while the lineage is a different tradition from the tooling and would divide differently on the divergence recorded. Readings' rule is one tradition per reading. The session's reply records the split as owed at the sitting rather than made, so the alternative is a node whose source is the tooling alone, with the lineage read separately.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

From: standing

```diff
@@ -12,4 +12,4 @@
 
 ## Answer
 
-Supports, with a recorded divergence. Adopted: the specification, not the prompt, is the source of truth for what agents build, and a standing constitution of principles governs every specification. Diverged: spec-driven development keeps per-feature specifications, plans, and task lists as durable artifacts. Here the durable record is the graph of standing answers; plans and tasks are regenerated from it when work is claimed, so nothing that could go stale is kept.
+Both reviews find that the `source` field bundles two 2025 products, AWS Kiro and GitHub Spec Kit, with a three-item lineage, Knuth 1984, Meyer 1986 and Adzic 2011, under one `relation: adopted`, while the lineage is a different tradition from the tooling and would divide differently on the divergence recorded. Readings' rule is one tradition per reading. The session's reply records the split as owed at the sitting rather than made, so the alternative is a node whose source is the tooling alone, with the lineage read separately.
```

## Account

### Manifest

- Folded: Recording of 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Re-encoding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34

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

### Frontier survey, 2026-09-05

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:


Strongest counter-argument (strong): The divergence claims that here "plans and tasks are regenerated from it when work is claimed, so nothing that could go stale is kept", and this survey measured what the record keeps that has gone stale: `quotes`' option `one-ruling-for-the-unquoted-stamp` names a set of nodes it no longer describes; `stub-traditions`' enumeration is stale by its own `regenerate-enumeration` option; forty-seven nodes carry a review pin the projector marks changed since. The claim the reading makes over the tradition is therefore the claim the record is currently failing, and the failure is in the graph itself, not in the plans the graph was supposed to make disposable. Boldness `high` is recorded and the authority fact recommends `delegated`.

The session's reply: Taken. The divergence claims that nothing which could go stale is kept, and the survey measured three populations of kept-and-stale in the graph itself: `quotes`' enumeration, `stub-traditions`' enumeration, and forty-seven review pins the projector marks changed since. The claim is not withdrawn, because it is a claim about plans and tasks and the tradition's own subject, but it is now false of the record that makes it, and the reading should say so rather than let the divergence read as a boast. That is recorded as owed on the reading's text.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/spec-driven-development stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `standing`; the `## Rationale` its `**AI support.**`; and `stands` left the answer fact. The record wrote no text of its own for `chosen-over`, `split-sources`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `fc50b724ed00bf5f9eb4828284f5f7e561bba20b` is re-computed for the encoding as `ee031b91079ad2fb45fe5d96b6ffd03a9ab1b560`; nothing it read changed. The survey's pin `fc50b724ed00bf5f9eb4828284f5f7e561bba20b` is re-computed for the encoding as `ee031b91079ad2fb45fe5d96b6ffd03a9ab1b560`; nothing it read changed.
