---
id: issue-2374
statement: Visualize the intention tree in the office-hours app
owner: human
status: raw
parent: issue-2100
rationale: >-
  - Read the intention tree and its goal frontier (from the tree store /
  generated
    view).
  - Render the tree as a navigable parent/child hierarchy. Per node, show its
  `owner`
    (`human`/`ai`/`procedure`) and `status` (`raw`/`refining`/`delegated`/`codified`).
  - Distinguish the **active frontier** (goals) and overlay execution state from
  the
    node-issue mapping — issue open/closed and linked PRs — so each goal node shows
    its status.
  - Fit the office-hours app's existing dashboard conventions: a new panel +
  data
    module wired into `Dashboard.tsx`, plus a vite seed plugin and local seed data
    (mirroring the existing `*-seed` / `*-panel` modules).
  - Optional later overlay (not required here): per-node signal gap, once the
    signal/feedback arm lands.
reading: >-
  - Read the intention tree and its goal frontier (from the tree store /
  generated
    view).
  - Render the tree as a navigable parent/child hierarchy. Per node, show its
  `owner`
    (`human`/`ai`/`procedure`) and `status` (`raw`/`refining`/`delegated`/`codified`).
  - Distinguish the **active frontier** (goals) and overlay execution state from
  the
    node-issue mapping — issue open/closed and linked PRs — so each goal node shows
    its status.
  - Fit the office-hours app's existing dashboard conventions: a new panel +
  data
    module wired into `Dashboard.tsx`, plus a vite seed plugin and local seed data
    (mirroring the existing `*-seed` / `*-panel` modules).
  - Optional later overlay (not required here): per-node signal gap, once the
    signal/feedback arm lands.
gap: null
clarifications: []
tooling_goals: []
success_signal: null
---
# Visualize the intention tree in the office-hours app
