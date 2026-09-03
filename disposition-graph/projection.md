---
question: How is the record read?
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/model
defines:
  - projection
  - graph browser
ledger: L05
---
## Answer

Through projections, never by opening node files, except in alignment sessions. The graph browser is the human projection: one page that renders every node lazily, opens on the purpose node, links every defined term to the node that defines it, and sets readings of tradition apart from the answers they ground. The README on the main branch is a projection of the purpose node, and the repository's description and discovery tags are projections of the purpose and audience nodes. An implementation session never reads the graph: the global-tier rules it works under are materialized into the repository's rules, and the ancestry of the node it serves is materialized into its worktree's `CLAUDE.local.md` at provisioning, pinned at a graph commit. Such a session writes back only through narrow verbs, propose, answer as deferred, record evidence.

## Rationale

The author's ruling of 2026-09-02 that bite sessions read projections, not the worktree. It keeps context focused, keeps legacy vocabulary out of working sessions, and makes the graph commit a session read from a pinned fact. The browser is recorded as a node before bootstrap exit, and its published address is recorded on that node. Ledger L05, L12, L18, L21, L23.
