---
id: tactic-attention-surface-graph-read
kind: tactic
statement: browser graph read layer — File System Access API over the local
  clone, client-side tree build and resolveAttention, staleness surfaced loudly
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-07-03 by /align-tactics round 1: foundational leaf —
  every other tactic in the round reads the graph through this layer. Consumes
  the retained draft of the same id."
reading: null
gap: null
serves:
  - strategy-attention-surface
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-attention-surface-graph-read
  pr: 2780
  attempts:
    fix: 2
  markers: []
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# browser graph read layer — File System Access API over the local clone, client-side tree build and resolveAttention, staleness surfaced loudly

## Context

The surface reads the intention graph from the local repo clone (strategy
clarification 5 on `intentions/strategy-attention-surface.md`): a File
System Access API directory handle over the clone, YAML frontmatter parsed
in the browser, tree build and attention rank computed client-side.
Read-only — the browser never writes the clone. Foundational leaf: every
other tactic in the round reads the graph through this layer.

## Unit 1 — browser-safe intentionsutil entry

**Recommended model:** sonnet

Scope:
- New subpath export `@commons-systems/intentionsutil/graph`:
  `package.json` `exports` map entry plus a `src/graph.ts` barrel
  re-exporting only the fs-free modules — `schema.js` (`validateNode`,
  types), `attention.js` (`resolveAttention`), `goals.js`, `errors.js`.
- The root barrel (`packages/intentionsutil/src/index.ts`) pulls in
  `store.js` (`node:fs`) and stays Node-only; do not move code — barrel
  and exports map only. Precedent: the React-free `.ts` subpath added for
  non-JSX consumers of `@commons-systems/ds`.
- Out of scope: any change to `store.ts` or the scripts.

## Unit 2 — FSA graph source in office-hours

**Recommended model:** opus

Scope:
- New `office-hours/src/graph-source.ts`: request and persist a directory
  handle over the clone root via `@commons-systems/local-first`
  (`createFsaHandleStore`, `detectFsaCapabilities` —
  `packages/local-first/src/fsa-handle-store.ts`, `capabilities.ts`),
  following the keyed-handle pattern of
  `office-hours/src/local-snapshot-source.ts`.
- Enumerate `intentions/*.md` under the handle, parse frontmatter with the
  `yaml` package in the browser, `validateNode` each file (collect
  per-file errors and fail loudly on any — clear errors over fallbacks),
  build the tree with `office-hours/src/intention-tree.ts` `buildTree()`,
  rank with `resolveAttention` from the Unit-1 subpath.
- Staleness (recorded strategy condition): read `.git/FETCH_HEAD` /
  `.git/HEAD` file mtimes through the same handle, surface the clone's age
  in the page chrome, and render a blocking loud banner past a threshold —
  never render stale rank silently.
- Tier boundary: the owner tier reads through this source; the build-time
  seed (`office-hours/src/vite-plugin-intention-tree-seed.ts`) remains the
  demo-tier data source. Out of scope: removing the seed or any Firestore
  path (`tactic-attention-surface-firestore-retire`).

## Dependencies

None — first leaf of the round.

## Reuse

- `packages/local-first/src/fsa-handle-store.ts`, `capabilities.ts`.
- `office-hours/src/intention-tree.ts` `buildTree()`;
  `office-hours/src/local-snapshot-source.ts` as the FSA-source pattern.
- `packages/intentionsutil/src/attention.ts` `resolveAttention` (pure —
  imports only schema and errors).

## Verification

```verify
npm test --prefix packages/intentionsutil
npx vitest run --project office-hours --root .
```

Manual: grant the handle to a real clone — the tree renders and the rank
order matches the host-side `packages/intentionsutil/scripts/frontier-view.ts`
output; point the handle at a stale clone and confirm the loud banner.

## Implementation notes

Two units; each in a subagent with the unit's Recommended model; supply
this Context and the unit's Scope; constrain to working-tree edits.
