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

By a loop of three moves. Propose: the AI writes a node, or an amendment, in the record with no more authority than it holds. Project: the node's page in the graph browser is rendered, because every node has a documentation projection and the page is what the author reads. Ratify or steer: the author ratifies, which stamps the node, or steers, and the steer enters the node's rationale as a rejected alternative or an amendment before the page is rendered again. During bootstrap the loop is the `/align` shim on the `greenfield` ref, a hand-written projection of this node and its siblings that the bootstrap session follows; afterwards the skill is materialized from the ratified nodes and the shim is deleted. Legacy nodes are cited as evidence when a question needs them and never imported.

## Rationale

The loop is the alignment interview made incremental: one page, one ruling. The author's choice of what to propose next is itself a ranking act, recorded as boost. Ledger L12, L13, L15, L17.
