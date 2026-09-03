---
question: Does each form need a defining node of its own?
stage: maieutic
under:
  - commons.systems/disposition-graph/node
---

## Disposition

The author, 2026-09-02:
> "assumption" deserves a target disposition, along with "tradition" and "disposition" (if target is renamed to disposition). This is how vocabulary is recorded, not with something bolted on that will drift. Recommend how hyperlinks will avoid drift.

## Proposal

### Sitting on purpose, 2026-09-03

Proposed node: none

**Vocabulary stays with the nodes that define the terms**

No new nodes. Each term is defined by the node that owns it, through the defines field: disposition by model, archē by agency, reading and tradition by readings, criterion and assumption by instruments; the term index links every use in prose to that node, and a term no node defines is not linked, which is how drift shows. This is a parsimony finding against the earlier encoding of one node per form.

Facts: authority deferred; boldness low; persistence not recorded; the defines fields already stand.

Rejected:
- One node per form, "What is a disposition?" and so on. — Each would restate the definition its owning node already carries, and two definitions of one term is the drift the author named.

Depends on: `forms`

Responses open: confirm as shown; confirm with edits; deny with feedback.

### Frontier finding, 2026-09-03

Kind: redundancy.

Form-vocabulary's proposal is 'No new nodes. Each term is defined by the node that owns it, through the defines field ... the term index links every use in prose to that node, and a term no node defines is not linked, which is how drift shows.' That is what readings' draft already says for traditions ('Prose reaches a tradition through the name it defines') and what projection's draft already says for terms ('Every defined term and every tradition's name links to the node that defines it'), and what the browser already implements. Form-vocabulary restates two other nodes' answers and adds one decision — that no node per form is created — which is a rejected alternative rather than a question.

Also named: commons.systems/disposition-graph/readings, commons.systems/disposition-graph/projection.

Proposed: Projection is the survivor for the linking rule and readings for the tradition rule. Form-vocabulary is folded into node's rationale as a rejected alternative ('one node per form, rejected because each would restate the definition its owning node already carries') and the node is pruned, which is what its own facts already say ('persistence not recorded'). The author's quote it carries is already carried verbatim on node.

### Frontier finding, 2026-09-03

Kind: coverage.

Four author quotations are carried verbatim on more than one node, verified by exact match. 'Who is this repository for? ... It can be pruned' on audience and coverage. 'purpose -> [scope, self documentation (via the graph browser)] (equal) -> alignment -> harness context management -> reconciliation -> rsi' on scope, self-documentation and rsi. 'Is this correctly encoded as form: assumption vs form: disposition with unvalidated instrumentation? Is assumption a form at all?' on knowledge-store, capture and purpose. 'assumption deserves a target disposition, along with tradition and disposition ...' on node and form-vocabulary. Frontier-consistency's validation 14 says every disposition the author has given is 'answered by exactly one node: none unanswered, none answered twice', and admits no case for a quote carried as context on a child.

Also named: commons.systems/disposition-graph/audience, commons.systems/disposition-graph/coverage, commons.systems/disposition-graph/knowledge-store, commons.systems/disposition-graph/capture, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/node, commons.systems/disposition-graph/scope, commons.systems/disposition-graph/self-documentation, commons.systems/disposition-graph/rsi.

Proposed: Most of these are legitimate context on a child that answers a part of the words, and the validation should say so: amend frontier-consistency's validation 14 to read that each part of a disposition is answered by exactly one node, and that a quotation may be carried on a child as the ground of the part it answers. Two are genuine double answers and should be resolved: audience and coverage both answer the audience question, which the audience prune resolves in coverage's favour; knowledge-store, capture and purpose all carry the form question, which forms answers, so all three should cite forms rather than each carry the quote.
