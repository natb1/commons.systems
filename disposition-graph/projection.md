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

Through projections, never by opening node files, except in alignment sessions. The graph browser is the human projection: one page that renders every node lazily, opens on the purpose node, links every defined term to the node that defines it, and sets readings of tradition apart from the answers they ground. The README on the main branch is a projection of the purpose node, and the repository's description and discovery tags are projections of the purpose and audience nodes. An implementation session never reads the graph: the global-tier rules it works under are materialized into the repository's rules, the ancestry of the node it serves is materialized into its worktree's `CLAUDE.local.md` at provisioning, pinned at a graph commit, and the orientation page it reads first, `CLAUDE.md`, is projected from the purpose node and this one; what a session loads and where each part comes from is the session-context node under this one. Such a session writes back only through narrow verbs, propose, answer as deferred, record evidence.

## Rationale

The author's ruling of 2026-09-02 that bite sessions read projections, not the worktree. It keeps context focused, keeps legacy vocabulary out of working sessions, and makes the graph commit a session read from a pinned fact. The browser is recorded as a node before bootstrap exit, and its published address is recorded on that node; during bootstrap it is published as the private page https://claude.ai/code/artifact/502111c1-a7fb-4108-a9cb-ebb7b2a44933, regenerated from the record each round. Ledger L05, L12, L18, L21, L23.
