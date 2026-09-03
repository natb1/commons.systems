---
question: How does the graph grow?
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/model
defines:
  - propose
  - project
  - ratify
  - steer
ledger: L14
---
## Answer

By a loop of three moves. Propose: the AI writes a node, or an amendment, in the record with no more authority than it holds. Project: the node's page in the graph browser is rendered, because every node has a documentation projection and the page is what the author reads. Ratify or steer: after the dialectic the author rules; a ratification is recorded as the stamp in the author's name with the ruling quoted, and a steer enters the node's rationale as a rejected alternative or an amendment before the page is rendered again. The dialectic runs both ways, on the AI's proposal and on the author's intention, and ratification is its outcome, never a rubber stamp. The alignment skill has two usages: given a disposition in the author's words, it records or revises the node that answers it; given a node id, it runs the same dialectic to ratify the node or to review its ratification, as a sitting in two separated stages: first comprehension, in which the author articulates what the record and the readings under it say before the AI's account enters as counterpoint, with probes citing the text by locus and no verdict in play; then intention, in which what the author means and intends to bind is elicited and tested, and the ruling is taken. Each sitting recursively identifies the follow-up readings, vocabulary, and key concepts it surfaces, which feed the review frontier. During bootstrap the loop is the `/align` shim on the `greenfield` ref, a hand-written projection of this node and its siblings that the bootstrap session follows; afterwards the skill is materialized from the ratified nodes and the shim is deleted. Legacy nodes are cited as evidence when a question needs them and never imported.

## Rationale

The loop is the alignment interview made incremental: one page, one ruling. The author's choice of what to propose next is itself a ranking act, recorded as boost. Ledger L12, L13, L15, L17.
