---
id: tactic-projects-app-relocation
kind: tactic
statement: Relocate the 6 hosting apps + functions into projects/ and collapse
  the workspaces glob to ["projects/*","packages/*"] — Tier-2 of the
  packages/+projects/ repo reorg
owner: ai
status: raw
parent: null
rationale: "Retained 2026-07-08: closed epic #2513 reorganized the repo into
  packages/ (scoped @commons-systems/* leaves) + projects/ (unscoped runnable
  units) but deliberately deferred Tier-2 — relocating the hosting apps and
  functions — as per-app follow-ups to file 'when pursued'. Those follow-ups
  were never filed on GitHub, and planning has since migrated to the intention
  graph as sole tracker, so the deferred work was tracked nowhere. This node
  carries the full #2513 Tier-2 plan so /align-tactics can decompose it into
  per-app PRs. It continues strategy-owned-web-platform's
  apps-are-unscoped-workspace-roots /
  libraries-are-scoped-@commons-systems/*-leaves boundary (clarification 4) in
  physical form. Draft (phase absent): not selectable until decomposed."
reading: null
gap: null
serves:
  - strategy-owned-web-platform
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Relocate the 6 hosting apps + functions into projects/ and collapse the workspaces glob to ["projects/*","packages/*"] — Tier-2 of the packages/+projects/ repo reorg

## Context

The repo reorg (former GitHub epic #2513, closed COMPLETED 2026-06-29)
reorganized the top-level layout around one language-neutral axis — *"is this
imported, or is it run?"*:

- **`packages/`** — anything consumed as a dependency (the `@commons-systems/*`
  shared libraries).
- **`projects/`** — any standalone runnable/deployable unit.

The epic split the move into two ROI tiers and **only Tier-1 landed**:

- **Tier-1 (done):** all ~23 shared libraries moved to `packages/` (#2514); a
  root `go.work` spans the two Go modules (#2515); `projects/` was stood up with
  the low-coupling runnables `budget-etl`, `scaffolding`, `booklet` (#2516).
- **Tier-2 (deferred, this tactic):** relocate the 6 hosting apps + `functions`
  into `projects/`, then collapse the workspaces glob. #2513 explicitly did
  **not** file this — it was to be "tracked for later, per-app, after Tier-1
  lands." It was never filed on GitHub, and once planning migrated to the
  intention graph (sole tracker) the work was tracked nowhere. This node closes
  that gap.

## Current state (as of 2026-07-08)

Still at repo root, not yet under `projects/`:

- Hosting apps: `landing`, `budget`, `fellspiral`, `print`, `audio`,
  `office-hours`.
- Backend: `functions` (Firebase Functions).

`package.json` still carries the flat mixed `workspaces` list (each app and each
`packages/*` lib enumerated), **not** the collapsed
`["projects/*","packages/*"]` glob. That collapse is the terminal step and
depends on every app move landing first.

`office-hours-snapshot` is a separate workspace root that is neither clearly a
hosting app nor a library (a snapshot data surface) — classify it at
decomposition time (root-carve-out vs. `projects/`), do not assume it moves with
the apps.

## Target end-state

```
/
├── projects/
│   ├── landing/ budget/ fellspiral/ print/ audio/ office-hours/   # ← Tier-2 moves these in
│   ├── functions/                                                 # ← and this
│   ├── budget-etl/ scaffolding/ booklet/                          # already here (Tier-1)
├── packages/                # shared libs, already here (Tier-1)
├── firebase.json .firebaserc firestore.rules storage.rules firestore.indexes.json  # STAY at root
├── intentions/  trackers/   # STAY at root (repo data)
├── go.work  flake.nix
├── package.json  # workspaces: ["projects/*","packages/*"]   ← collapse only after all app moves land
```

## Scope — what each app move rewrites

Per #2513's ROI analysis, each hosting app is **its own PR** (distinct ref set +
its own deploy verification). Relocating one app rewrites:

- **~40 `.claude/` files** — every `--prefix <app>`, `--project <app>`, and
  `run-qa-server.sh <app>` reference.
- **9 `.github/` CI files** — workflow paths referencing the app directory.
- **`nix/flake.nix`** derivations for the app.
- **The app's `firebase.json` `public`/`source` path** — e.g.
  `public: "landing/dist"` → `public: "projects/landing/dist"`. `firebase.json`
  stays at root; its paths are relative, so only the path strings change.

**Unaffected (do not touch):**

- **`.firebaserc` hosting targets** — they map to Firebase **site IDs**, not
  directory paths, so relocating an app requires no `.firebaserc` change.
- **Library import names** (`@commons-systems/*`) — unchanged; imports stay
  stable.
- **Change-detection** — already resolves nested `packages/*`/`projects/*` paths
  (#1887 / #1912 / #1913, all closed), which derisks the moves.

## What stays at root (deliberate, unchanged from Tier-1)

- **Deploy/repo config** — `firebase.json`, `.firebaserc`, `firestore.rules`,
  `storage.rules`, `firestore.indexes.json`. The Firebase CLI expects these at
  the directory `firebase deploy` runs from; their `public`/`source`/`rules` are
  relative paths, so apps relocate without moving the config.
- **`intentions/` + `trackers/`** — repo data, neither runnable nor imported.

## Terminal step (last, gated on all app moves)

Collapse `package.json` `workspaces` from the flat enumerated list to
`["projects/*","packages/*"]`. This can only land once every app + `functions`
lives under `projects/` — until then the glob would fail to resolve the
still-at-root apps.

## Decomposition guidance for /align-tactics

- One unit per hosting app (6) + one for `functions` + one terminal
  workspaces-glob-collapse unit = ~8 units, sequenced with the collapse last.
- Each app unit carries its own deploy/QA verification (preview deploy + the
  app's smoke path), since a mis-rewritten `firebase.json` path or CI ref only
  surfaces at deploy.
- Resolve `office-hours-snapshot`'s classification as part of (or alongside) the
  `office-hours` unit.

## Why deferred, not abandoned

Tier-2 is expensive (the ~40 + 9 + nix + firebase.json rewrites above) for low
marginal value — the "what's deployable?" signal is already encoded in metadata
(unscoped package names + a `.firebaserc` hosting target). It is worth doing for
layout consistency once cheaper work clears, but it does not block anything.
Recorded so the graph, not a closed GitHub issue, carries it.

