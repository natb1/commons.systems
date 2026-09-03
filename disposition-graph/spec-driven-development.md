---
question: Does spec-driven development support this repository's purpose?
stage: review
recommendation:
  class: delegated
  boldness: high
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: 7ebb474fc79deb134fa8e93ec67de404f64150bf
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

## Proposal

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
