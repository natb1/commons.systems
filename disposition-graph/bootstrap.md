---
question: How does this graph come into being?
form: target
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/purpose
defines:
  - bootstrap
  - ledger
  - stub
instrument:
  kind: check
  ref: bootstrap exit criteria (ledger L16)
  note: LEDGER.md is empty and deleted; /align exists on this ref; dispatch selects from this graph; nothing live reads intentions/
ledger: L10
---
## Answer

By a bootstrap operation run as onboarding. One node at a time, in the order a newcomer should meet them, the AI proposes a node, projects its page in the graph browser, and the author ratifies or steers. During the operation the AI holds a grant to stub dispositions and materialized implementation; every stub is stamped deferred, listed on the bootstrap ledger, and ratified, amended, or pruned before exit. Emptying the ledger is the critical path to a materialized `/align` skill, after which every further node is recorded through that skill. The operation exits when every rule this project runs under is a node or a declared shim, dispatch selects from this graph, `/align` is the only recording path, and nothing live reads the legacy record.

## Rationale

The author's rulings of 2026-09-02 (ledger L10, L12, L13, L15, L16). Onboarding is the ordering principle because it makes the bootstrap order a recorded fact with permanent consumers: rank later steers frontier attention and compaction floors. The grant decouples the critical path from that order, so schema nodes can be stubbed at once and ratified as the walk reaches them. Operational rules for the bootstrap sessions themselves live in `CLAUDE.md` on the `greenfield` implementation ref, beside the ledger, and liquidate into this node and the skill.
