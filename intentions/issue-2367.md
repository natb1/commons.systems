---
id: issue-2367
statement: "Intention tree to GitHub: node-issue mapping and asymmetric sync"
owner: human
status: raw
parent: issue-2100
rationale: >-
  - Stable node-id ↔ issue-number mapping. Stamp the issue with the node id via
  a
    marker comment, using a `startswith` first-line anchor (per the marker-comment
    substring-clobber fix), not `contains`.
  - **tree → GitHub:** emit a leaf goal as a chain-compatible issue through the
    existing `/file-issue` path (correct by construction — scope, labels,
    `blocked_by`, `help wanted`).
  - **GitHub → tree:** a read-only refresh that pulls execution state
  (open/closed,
    PR links, `dispatch:*` state) into the node's tracker block. Never writes
    intention fields.
reading: >-
  - Stable node-id ↔ issue-number mapping. Stamp the issue with the node id via
  a
    marker comment, using a `startswith` first-line anchor (per the marker-comment
    substring-clobber fix), not `contains`.
  - **tree → GitHub:** emit a leaf goal as a chain-compatible issue through the
    existing `/file-issue` path (correct by construction — scope, labels,
    `blocked_by`, `help wanted`).
  - **GitHub → tree:** a read-only refresh that pulls execution state
  (open/closed,
    PR links, `dispatch:*` state) into the node's tracker block. Never writes
    intention fields.
gap: null
clarifications: []
tooling_goals: []
success_signal: null
---
# Intention tree to GitHub: node-issue mapping and asymmetric sync
