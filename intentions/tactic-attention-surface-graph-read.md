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
serves:
  - strategy-attention-surface
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: main-qa
execution:
  branch: tactic-attention-surface-graph-read
  pr: 2780
  attempts:
    fix: 2
  markers:
    - qa-done
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-07-10T13:52:25Z
    mergeCommitSha: 2e63b186a7e12e4f9922d51cea28f5973ac5e6fe
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours:
  reason: "Both needs-main items require a human to grant a File System Access
    directory handle to their own real local repo clone via the native OS picker
    (office-hours owner tier) and visually confirm the render/rank order and the
    loud stale-clone banner -- no automated session can grant that native picker
    consent or possesses a real local clone to point it at, so this is an
    author-only manual check, not a tool-checkable one. Separately, the
    goals-page UI route that would host this check has not shipped:
    tactic-attention-surface-goals-page is still phase:implement with no PR or
    branch (gh pr list --search and git ls-remote both empty), and no code
    outside its own test file (office-hours/test/graph-source.test.ts) imports
    office-hours/src/graph-source.ts."
  since: 2026-08-04
  recommendation: "Author to verify once tactic-attention-surface-goals-page ships
    and deploys: (1) grant a real local clone via the owner-tier FSA picker,
    confirm the tree renders and the attention rank order matches
    packages/intentionsutil/scripts/frontier-view.ts output; (2) point the
    handle at a clone whose git sync is older than STALE_CLONE_THRESHOLD_MS (6h)
    and confirm the blocking loud banner replaces the view rather than rendering
    stale rank silently. Machine checks already run this session: this node's
    source PR #2780 confirmed MERGED 2026-07-10 (gh pr view);
    tactic-attention-surface-goals-page has no open PR or branch (gh pr list
    --search, git ls-remote origin both empty); grep across the repo for
    graph-source.ts imports found only its own test file, confirming no live UI
    consumer exists yet."
  session_type: other
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
npm test --prefix packages/intentionsutil || exit 1
npx vitest run --project office-hours --root .
```

Manual: grant the handle to a real clone — the tree renders and the rank
order matches the host-side `packages/intentionsutil/scripts/frontier-view.ts`
output; point the handle at a stale clone and confirm the loud banner.

## Implementation notes

Two units; each in a subagent with the unit's Recommended model; supply
this Context and the unit's Scope; constrain to working-tree edits.

## needs-main residue (review 2026-07-10)

Terminal review (PR #2780) was clean: one confirmed finding — `readGraphNodes`
sorted by raw file name instead of node id, so prefix-hyphen sibling ids
(`tactic-graph-commit` vs `tactic-graph-commit-hardening`) rendered in swapped
order versus the host `frontier-view.ts` — fixed on the branch and pinned with a
regression test. Full office-hours (431) and intentionsutil (216) suites,
type-safety-escapes, and knip all green. The `package-lock.json` churn beyond the
`yaml` add was examined and is a beneficial normalization of origin/main's own
stale lockfile, not a regression. Auto-merge armed (squash).

The plan's "Manual" verification step is inherently browser-integration work that
this node's code cannot exercise on its own — it needs the not-yet-wired UI
consumer (`tactic-attention-surface-goals-page`, `blocked_by` this node) to
render anything. Verify post-merge in main-qa (or, more naturally, as part of the
goals-page tactic's own acceptance):

1. Grant an FSA directory handle to a real repo clone in the office-hours owner
   tier; confirm the tree renders and the attention rank order matches the
   host-side `packages/intentionsutil/scripts/frontier-view.ts` output.
2. Point the handle at a stale clone (last git sync older than
   `STALE_CLONE_THRESHOLD_MS`, 6h) and confirm the blocking loud banner replaces
   the view — stale rank never renders silently.
