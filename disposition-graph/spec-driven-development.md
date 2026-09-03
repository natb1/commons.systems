---
question: Does spec-driven development support this repository's purpose?
stage: ruling
recommendation:
  class: ratified
  boldness: moderate
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

Supports, with a recorded divergence. Adopted: the specification, not the prompt, is the source of truth for what agents build, and a standing constitution of principles governs every specification. Diverged: spec-driven development keeps per-feature specifications, plans, and task lists as durable artifacts. Here the durable record is the graph of standing answers; plans and tasks are regenerated from it when work is claimed, so they cannot go stale.

## Rationale

The term is current and dominant in AI coding practice of 2025 and 2026, which makes it the audience's own vocabulary and a discovery term. Its older lineage is the tradition that the description of the program is the source of truth. Validated by the AI on 2026-09-02 from its own knowledge, not from primary reading; deferred until the author reads the sources.

## Proposal

### Recording of 2026-09-03

Reclassified as unanswered at the author's ruling of 2026-09-03, quoted on the unanswered node: the answer above, stamped deferred during bootstrap before the alignment dialogue existed, stands as the draft the author rules on, and the clean-context review runs on it before the ruling. Nothing in the node was changed by the reclassification.

Facts: authority ratified if the author confirms, or delegated where the author's words delegate it; boldness moderate, the AI's drafting from the author's rulings and from the legacy record as evidence; persistence standing.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Facts line: 'ratified if the author confirms'. The Rationale is explicit that the reading was made 'from its own knowledge, not from primary reading', which makes ratified the wrong class to offer even more clearly than on the other readings. Delegated is what a confirmation confers.
- Answer: 'plans and tasks are regenerated from it when work is claimed, so they cannot go stale.' Stronger than the record supports: a regenerated plan can be stale against a graph that moved between the claim and the landing, which is why work-loop re-derives the frontier after every landing. Suggested edit: 'nothing that could go stale is kept'.
- Frontmatter 'source' bundles two 2025 products (Kiro, Spec Kit) with a three-item lineage (Knuth 1984, Meyer 1986, Adzic 2011) under one 'relation: adopted'. The lineage is a different tradition from the tooling and would divide differently on the divergence recorded; readings' recommended answer requires one tradition per reading.
- Answer: 'a standing constitution of principles governs every specification' is adopted from Spec Kit; the record's nearest equivalent is doctrine, which is empty, since nothing is ratified. Adopting a mechanism the record does not yet have is legitimate but nothing marks it as owed.

On the three facts: Generic template with the wrong class. Boldness is high here specifically: the node says the reading was not made from primary sources, so nothing in it rests on the record or the author's words, and the facts should say so rather than 'as the rationale shows'.

Strongest counter-argument (moderate): The recorded divergence is the whole of the practice. What makes spec-driven development work in the 2025 tools is exactly the per-feature artifacts this reading rejects: the requirements, design and task documents are what the agent reads, and the specification is useful because it is close enough to the work to be executable. Replacing them with a graph of standing answers keeps the name and drops the mechanism, so 'adopted, with a recorded divergence' understates the relation — on the thing the tradition is actually for, this is nearer to 'chosen over'. Calling it adopted lets the audience's expectation do work the record has not yet earned, and purpose leans on that expectation in its first paragraph.
