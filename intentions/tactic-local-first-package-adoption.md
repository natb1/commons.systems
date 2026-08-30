---
id: tactic-local-first-package-adoption
kind: tactic
statement: Consolidate the duplicated FSA handle-store implementations onto
  packages/local-first
owner: ai
status: codified
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy code review:
  packages/local-first (capability probes, IndexedDB-persisted FSA handles
  namespaced app:purpose) is the intended shared substrate. Drift note,
  finalized 2026-07-11 /align-tactics round: adoption has grown since the draft
  - print (local-folder-ui.ts), audio (local-source.ts), and office-hours
  (graph-source.ts, local-snapshot-source.ts) all import it now. The residual
  duplicator is budget, which re-implements the same concerns three ways:
  local-file.ts (own FSA ambient declarations, picker, permission helpers),
  idb.ts putFileHandle/getFileHandle (own snapshot-handle persistence), and
  statements-dir.ts (a second, separate directory-handle persistence).
  Duplicated permission/handle logic is the same drift-hazard class the crypto
  consolidation (PR 2836) fixed."
reading: null
gap: null
serves:
  - strategy-durable-owned-data
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-local-first-package-adoption
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: 68a324156abf9b4ee033c0578a9e3fcd0753a38fa70be3c3a21e996eca0525f5
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Consolidate the duplicated FSA handle-store implementations onto packages/local-first

## Context

`packages/local-first` is the shared FSA substrate: capability probes
(`packages/local-first/src/capabilities.ts:19`) and IndexedDB-persisted FSA
handles namespaced `{app}:{purpose}`
(`packages/local-first/src/fsa-handle-store.ts:70` `createFsaHandleStore`,
with `put/get/remove/queryPermission/requestPermission/ensurePermission/load`
documented at `:19-:68`). Adoption has grown since this draft was retained:
print (`print/src/local-folder-ui.ts:14`, store at `:45`), audio
(`audio/src/local-source.ts:15`), and office-hours
(`office-hours/src/graph-source.ts:31`,
`office-hours/src/local-snapshot-source.ts:14`) all use it.

The residual duplicator is **budget**, which re-implements the same concerns
three ways:

- `budget/src/local-file.ts` — its own ambient FSA declarations (lines
  10-26), `isFsaSupported` (`:29`), `pickBencFile` (`:37`),
  `queryReadWritePermission`/`requestReadWritePermission` (`:56`, `:64`),
  plus file I/O helpers (`writeFileToHandle:68`, `readFileFromHandle:91`).
- `budget/src/idb.ts:62-66` — `putFileHandle`/`getFileHandle` persisting the
  snapshot file handle in budget's own IDB.
- `budget/src/statements-dir.ts:43-61` — a second, separate directory-handle
  persistence (its `meta` store) with its own ambient declarations
  (`:14-26`).

Duplicated permission/handle logic is the drift-hazard class
`strategy-durable-owned-data` tracks (same class as the crypto consolidation,
PR 2836): a permission-flow fix landing in the package silently misses
budget, the app holding the most consequential owned data.

## Unit 1 — migrate budget's handle persistence and permission flow

**Recommended model:** opus

**Scope:**

- Add `"@commons-systems/local-first": "file:../packages/local-first"` to
  `budget/package.json` dependencies (pattern: `audio/package.json`).
- Create one module-level store, `createFsaHandleStore({ app: "budget" })`,
  with two purposes: `"snapshot-file"` (the `.benc` file handle) and
  `"statements-dir"` (the statements folder handle).
- Replace the snapshot-handle persistence call sites — `budget/src/use-app-state.ts`
  imports at `:22`, `putFileHandle` at `:276`, `getFileHandle` at `:429` —
  with `store.put/get/remove` plus `ensurePermission(handle, "readwrite")`
  (which subsumes the query-then-request dance; note its user-gesture
  requirement documented at `fsa-handle-store.ts:44-68` — keep permission
  requests inside click handlers, as the current code already does).
- Replace `budget/src/statements-dir.ts` `getStoredDirectoryHandle`/
  `storeDirectoryHandle` (`:43-:56`) with the store under
  `"statements-dir"` (mode `"read"`).
- One-time legacy port: on load, when the new store has no handle under a
  purpose, read the legacy record (`idb.ts getFileHandle` / the
  `statements-dir` meta record), port it into the store, then delete the
  legacy record. A user re-picks only when both stores are empty.
- Replace `local-file.ts`'s ambient FSA declarations and permission helpers
  with the package's (`packages/local-first/src/fsa-types.d.ts`, store
  permission methods). KEEP budget-specific pieces where the package has no
  equivalent: `pickBencFile` (a picker with `.benc` accept types),
  `writeFileToHandle`/`readFileFromHandle` (file I/O beyond the package's
  handle-store scope), and the `budget/src/file-sync.ts:19` write-back
  wiring that consumes them.

Out of scope: the sidecar package, print/audio/office-hours (already
migrated), any UI change, the statements parsing flow, and any change to
`packages/local-first` itself (if a genuine budget need does not fit the
package API, stop and record it rather than forking behavior back into
budget).

## Unit 2 — delete the superseded duplication

**Recommended model:** sonnet

**Dependencies:** Unit 1.

**Scope:** remove what Unit 1 made unreferenced — candidates:
`budget/src/idb.ts` `putFileHandle`/`getFileHandle` (and `clearFileHandle`
if unused; keep whatever the legacy-port path still reads, with a
`TODO(tactic-<follow-up>)`-free comment noting it is port-only),
`budget/src/statements-dir.ts` persistence functions and ambient
declarations superseded by the package, `budget/src/local-file.ts` globals
covered by `fsa-types.d.ts`. Rule: delete only symbols
`grep -rn <symbol> budget/src` shows unreferenced after Unit 1; update tests
alongside their subjects (`.claude/rules/test-integrity.md` — a test is
removed only when its subject is removed in the same change).

## Reuse

- `packages/local-first/src/fsa-handle-store.ts` (`createFsaHandleStore:70`;
  `load`/`ensurePermission` semantics at `:44-:68`).
- `packages/local-first/src/capabilities.ts` (`isFsaSupported:32` — replaces
  `budget/src/local-file.ts:29`).
- Adoption patterns to copy: `audio/src/local-source.ts`,
  `print/src/local-folder-ui.ts:45`, `office-hours/src/graph-source.ts`.

## Verification

```verify
npx vitest run --project budget --root . || exit 1
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app budget
```

Manual (QA phase, QA server per `.claude/rules/sandbox.md`): load an
existing `.benc` via the picker; reload and confirm the handle restores
without re-picking; exercise the legacy-port path by seeding a legacy
`idb.ts` record first and confirming it ports then clears; re-link the
statements folder and confirm statement resolution still works; confirm
write-back still fires (the `file-sync.ts` status listener flips on a
successful persist).
