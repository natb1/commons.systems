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
phase: null
execution:
  branch: tactic-attention-surface-graph-read
  pr: 2780
  attempts:
    fix: 2
  markers:
    - qa-done
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by: []
office_hours:
  reason: "align-tactics router misroute, not a genuine target: this node's
    phase:null is a stale main-qa squatter (attributes.phase: main-qa), not a
    draft. It was already finalized, implemented, reviewed, and merged (PR
    #2780, execution.markers: [qa-done]); its own '## needs-main residue (review
    2026-07-10)' body section records the PR as clean with auto-merge armed,
    still awaiting the browser-manual main-qa verification. The squatter
    encoding was correct when written (2026-07-10, commit 451e9ed8) because
    schema.ts's PHASES enum did not yet include \"main-qa\" — PR #2859
    (4486b25d, 2026-07-11) added it the next day, but this node was never
    backfilled to the real phase:\"main-qa\" (attributes: {}) the way
    tactic-schema-migration-backfill (234e52e7) migrated its siblings on
    2026-07-07. Because router.ts's isDraft() (line 117) treats bare phase:null
    as draft/raw regardless of an attributes.phase squatter, and
    frozenTacticSelectable/the frozen-tactic candidate loop (lines 323-337)
    build directly on isDraft(), this node keeps re-surfacing as an
    align-tactics draft/raw candidate every tick — align-tactics' own
    tactic-target doc (references/tactic-target.md) has no carve-out for this
    case and would otherwise finalize it as a fresh draft, silently discarding
    the completed PR/qa-done/needs-main-residue state. At least 6 sibling nodes
    carry the identical stale pattern (grep intentions/tactic-*.md frontmatter
    for phase: null plus attributes.phase: main-qa):
    tactic-attention-surface-analytics-collector, tactic-budget-txn-identity,
    tactic-indieweb-audience, tactic-noncodegen-session-model-defaults,
    tactic-outcome-envelope-qa-accounting, tactic-token-audit-node-attribution.
    Recommend: (1) restamp this node's own phase to the real main-qa value
    (phase: \"main-qa\", attributes: {}) via a direct state-only graph-commit,
    precedented by tactic-schema-migration-backfill, which unblocks it onto
    /qa-main's normal main-qa queue; and (2) harden router.ts's
    isDraft()/tactic-candidate filters to also treat any
    attributes.phase-carrying node as non-draft, closing this whole misroute
    class so future phase-enum-gap squatters cannot recur; consider folding both
    into tactic-mainqa-record-time-routing's migration (which currently only
    covers draining nodes already at first-class phase:main-qa, not backfilling
    pre-#2859 squatters) or a small standalone backfill tactic. This session
    made no other change and is not competent to apply either fix itself:
    align-tactics' own SKILL.md scopes it to landing only phase: implement, and
    explicitly excludes stamping phase: main-qa (\"never something this skill
    stamps\"); the router.ts change is a source-code fix outside this skill's
    remit (intention-node graph writes only)."
  since: 2026-07-28
  recommendation: null
  session_type: other
pace_exempt: false
rounds: null
attributes:
  phase: main-qa
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
