---
id: tactic-attention-surface-graph-read
kind: tactic
statement: "draft: browser graph read layer — File System Access API over the
  local clone's intentions/, client-side tree build and resolveAttention"
owner: ai
status: raw
parent: null
rationale: "Draft retained from the 2026-07-03 /align-strategy interview per the
  retain-not-refine contract: tactical context only, no plan schema;
  /align-tactics finalizes, splits, merges, or prunes."
reading: null
gap: null
serves:
  - strategy-attention-surface
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
attributes: {}
---
# draft: browser graph read layer — File System Access API over the local clone's intentions/, client-side tree build and resolveAttention

Retained draft context (2026-07-03 interview + exploration). Not a plan.

- Read the graph from the local repo clone: FSA directory handle over
  `intentions/`, persisted via `@commons-systems/local-first`
  (`createFsaHandleStore`, `detectFsaCapabilities`) — the same pattern the
  budget app and the office-hours `.benc` reader already use.
- Parse node frontmatter in the browser (YAML) and reuse
  `office-hours/src/intention-tree.ts` `buildTree()`; rank ordering comes
  from intentionsutil's `resolveAttention`, which needs a browser-safe
  import path (type-only imports are already the office-hours convention).
- Supersedes the build-time seed
  (`office-hours/src/vite-plugin-intention-tree-seed.ts`) for the owner
  tier; the seed can remain the demo-tier data source.
- Staleness is a recorded strategy condition: surface the clone's HEAD age
  and fail loudly when it no longer tracks origin/main — never render stale
  rank silently.
