---
question: How is intent recorded here?
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/purpose
defines:
  - disposition
  - disposition graph
  - node
ledger: L14
---
## Answer

As a disposition graph. A disposition is one standing answer to one question, held by the author or by the AI under the author's rules; a node is the file that records it. Nodes refine one another through a single edge, `under`. Each node carries who holds its answer and with what authority, what the answer rests on, and how one would know it still holds. Rank, the context a session loads, the work queue, and the author's review queue are computed from those facts and never stored. The history of every answer lives in version control.

## Rationale

The refinements of this node define each part of the record: the node, the edge, authority, growth, projection, persistence, naming, attention, instruments, readings, the work loop, and the standing of the legacy record. Each is stubbed from the bootstrap ledger and ratified in onboarding order. The revision-2 proposal this model was drawn from is kept on this ref at `bootstrap/model-proposal.html` as input, not doctrine (ledger L19).
