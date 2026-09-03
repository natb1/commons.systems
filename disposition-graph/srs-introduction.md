---
question: Does the requirements-specification tradition support starting onboarding at purpose, then scope, audience, and definitions?
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


## Draft

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

Supports. The tradition opens a specification with purpose, then scope, then references, with definitions and an overview alongside, and this graph's onboarding walk adopts that order: the purpose node first, scope as its refinement, and the traditions the record reads reached from each node's readings. Definitions are met on the way, through the terms each node defines, and the overview is left to projections shaped like an introduction rather than to a node. The intended readers are stated inside purpose, as the tradition states them inside its purpose section.

## Rationale

Validated by the AI from its own knowledge of the standards on 2026-09-02, and re-oriented on the author's ruling that the progression is purpose, scope, reference, with definitions covered by links and overview by blog-shaped content; deferred until the author reads the sections. The one divergence to record: a requirements specification is a document about one product release, while this graph is a standing record, so scope here is a node that can be re-answered rather than a section that is rewritten.
```

## Proposal

### Sitting on purpose, 2026-09-03

**The requirements reading, re-oriented**

The question is re-oriented to purpose, scope, references; definitions are met through the terms nodes define; overview is left to projections; the intended readers are stated inside purpose as the tradition states them inside its purpose section.

Facts: authority deferred until the author reads the sections; boldness moderate; persistence standing.

Proposed text: the draft section of this node.

Rulings open: ratify as shown; ratify with edits; defer; overrule.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Draft question and answer say the tradition opens with 'purpose, then scope, then references, with definitions and an overview alongside'. IEEE 830-1998 section 1 orders 1.1 Purpose, 1.2 Scope, 1.3 Definitions, 1.4 References, 1.5 Overview, so definitions precede references in the source. A reading's content is what the source says. Suggested edit: state the standard's order and record this graph's handling of definitions as the divergence.
- Draft rationale records one divergence (a specification is about one release, this is a standing record) but not the second the answer makes: the standard has an Overview section and this graph defers the overview to 'projections shaped like an introduction rather than to a node'. Evaluation says an unrecorded conflict with a cited tradition is a frontier item. Suggested edit: record it as a divergence.

On the three facts: Deferred until the author reads the sections is right, moderate boldness is right, and standing is right for a reading.

Strongest counter-argument (weak): The reading now supports what the author already decided rather than testing it. The original question asked whether the tradition supports progressing to audience, and the author's answer was that the title alone does not support it, so the question was re-oriented to the progression the author preferred. That is legitimate, but the reading's remaining evidential value is small: it now says the standard opens with purpose and scope, which was never in doubt. Worth one line.
