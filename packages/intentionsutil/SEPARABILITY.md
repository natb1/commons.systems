# Separability audit — the intention graph without the harness

`strategy-data-structure-first` positions the intention graph as a *data
structure* a reader can adopt with their own project management and agentic
workflows. That is recorded as a **direction stated honestly**, not a
current-capability claim: `packages/intentionsutil` and the align skill family
assume this repo's layout, this repo's CI, and the dispatch harness. This
document enumerates, with `path:line` evidence, what actually breaks when the
graph data structure and its tooling are used **without** the dispatch harness,
so copy (`tactic-readme-data-structure-first`) can state standalone use as
direction rather than capability, and each confirmed gap becomes trackable work.

Scope note: this audit only *enumerates*. It changes no code, decouples
nothing, and authors no `tactic-*` nodes. Fixing any gap below is a future
`/align-tactics` round on `strategy-data-structure-first`, driven by reading
this audit.

## What a standalone adopter actually gets, cleanly

Before the gaps, the part that *does* separate cleanly, so the gaps are read in
proportion:

- **The schema and its library API are layout-agnostic.** `validateNode` /
  `validateGraph` (`src/schema.ts`) operate on in-memory objects and take no
  filesystem or repo assumptions. `writeNode(dir, node)`, `readNode(dir, id)`,
  and `listNodes(dir)` (`src/store.ts:40,110,137`) take the store directory as
  an explicit argument — the library imposes no location on the graph. An
  adopter who calls the library directly can put `intentions/` anywhere.
- **`validate-graph.ts` takes its directory as a required argument.** It reads
  it from `process.argv[2]` with no default (`scripts/validate-graph.ts`,
  `parseIntentionsDir`); the former cwd-relative `intentions` default was
  removed by strategy-graph-native-dispatch clarification 194/242, because a
  wrong cwd validated an empty node set and reported a clean graph. A standalone
  adopter can point it at any directory today, and must.

The graph data structure — node schema, referential-integrity rules, the
round-trip guarantee — is genuinely separable. The gaps below are in the
**CLI wrappers, the commit primitive, the packaging, and the docs**, not in the
data model itself.

## Gap 1 — CLI wrapper scripts hardcode the `<repo-root>/intentions/` + `packages/intentionsutil/` layout

**What breaks:** the write/read CLI scripts resolve the store directory as a
fixed three-directories-up-from-the-script path, then join `intentions/`. An
adopter whose repo does not place the package at `packages/intentionsutil/` and
the graph at `<repo-root>/intentions/` gets writes aimed at the wrong (or a
nonexistent) directory, with no override flag.

**Evidence:**

- `scripts/write-node.ts:21-23` — `scriptDir` from `import.meta.url`,
  `repoRoot = dirname(dirname(dirname(scriptDir)))`,
  `intentionsDir = join(repoRoot, "intentions")`. There is no CLI flag or env
  var to override `intentionsDir`; `main()` always uses the computed one
  (`write-node.ts:59`). (The exported `writeNodeFromJson(intentionsDir, …)`
  helper *does* take the dir — so the coupling is in the CLI entrypoint, not the
  logic.)
- Same 3-up pattern, same hardcoded `intentions/` join with no override,
  repeated in `scripts/review-coverage.ts:28-29`,
  `scripts/detect-rung.ts:25-26`, `scripts/frontier-view.ts:26-27`,
  `scripts/office-hours-select.ts:37-38`, and `scripts/read-sensors.ts:43-44`.
  (`scripts/dump-node.ts` and `scripts/write-node.ts` were in this list until
  clarification 194/242 converted them to a required `--dir`.)
- Several peers already carry the fix this gap recommends:
  `scripts/select-targets.ts:31-45` and
  `scripts/check-node-selection.ts:196-212` compute the identical
  repo-relative default but accept a `--dir <intentions-dir>` flag that
  overrides it. (An earlier pass of this audit misread `select-targets.ts` as
  another hardcoded peer — it is not; its `--dir` flag is the pattern the
  other six scripts above are missing.)

**Adopter expectation violated:** "I can keep my graph wherever I like and run
the tooling against it." The library honors this; six of the eight CLI
wrappers surveyed do not.

**Severity: DEGRADE, not blocker.** The library API (`store.ts`) is fully
layout-agnostic, `validate-graph.ts` requires a directory argument, and four of
the wrapper scripts (`select-targets.ts`, `check-node-selection.ts`,
`dump-node.ts`, `write-node.ts`) already implement a `--dir` override — the last
two as a REQUIRED flag. That in-repo precedent is direct
evidence the fix (thread the same `--dir`/`INTENTIONS_DIR` override through
the remaining CLI entrypoints) is small and additive, not speculative.

## Gap 2 — the package is not consumable as a normal npm dependency

**What breaks:** `@commons-systems/intentionsutil` cannot be `npm install`ed and
imported by an external project. It is marked private, ships no build output,
and its `exports` map points at raw TypeScript source with `.js`-specifier
imports that only resolve under a TS-aware ESM loader.

**Evidence:**

- `package.json:3` — `"private": true` (npm refuses to publish it).
- `package.json:4` — `"version": "0.0.0"` (no released version).
- `package.json:6-11` — `exports` map resolves `.`, `./graph`, `./schema`,
  `./store` to `./src/*.ts` **source files**; there is no `dist/`, no `build`
  script (`package.json:12-20` has `test`/`lint`/`detect-rung`/etc. but no
  compile step), so a consumer importing the package gets `.ts` it cannot run
  under plain `node`.
- Internal imports use extensionful `.js` specifiers that resolve to `.ts`
  (e.g. `store.ts:4` imports `"./schema.js"`; `write-node.ts:14` imports
  `"../src/store.js"`) — the tsx/ts-node ESM `.js→.ts` convention. A consumer
  must run under tsx (or bundle the source) for these to resolve.

**Adopter expectation violated:** "I add the graph library to my
`package.json` and import `validateGraph`." Today that requires vendoring the
`src/` tree and running it under a TS loader.

**Severity: BLOCKER for drop-in npm consumption; DEGRADE if the adopter vendors
source.** This is the sharpest packaging gap: the "data structure a reader can
adopt" is not currently distributable as a package. The fix (unset `private`,
add a build to compiled `dist/` with type declarations, publish, or provide a
documented vendoring path) is real work.

## Gap 3 — `graph-commit` is tightly coupled to this repo's GitHub host, CI fast-path, and branch protection

**What breaks:** `graph-commit` — the "single write primitive that lands node
edits on main" — cannot run against a repo that lacks (a) GitHub hosting with an
authenticated `gh` CLI, (b) the `graph/**` CI fast-path workflow, and (c) a
branch-protection ruleset requiring exactly the four checks
`acceptance`, `preview-and-smoke`, `lint`, `unit-tests`.

**Evidence:**

- `scripts/graph-commit:16-27` — the header states main's branch-protection
  ruleset requires those four named status checks green on the exact SHA before
  a push is accepted, and that the `graph/**` fast path is what stamps them.
- `scripts/graph-commit:343-346` — polls
  `gh api "repos/{owner}/{repo}/commits/$sha/check-runs"` and selects check runs
  named literally `acceptance` / `preview-and-smoke` / `lint` / `unit-tests`,
  and only those rows written by the GitHub Actions App
  (`.app.slug == "github-actions"`) — a row from any other `checks: write`
  principal can neither satisfy nor supersede a required context. These names,
  that producer slug, and the `gh` CLI + GitHub REST API, are hardcoded. A
  consumer repo whose fast path is stamped by some other App must change the
  slug too, not just the names.
- `.github/workflows/graph-fast-path.yml:3-5,34-60` — the `on: push: branches:
  ['graph/**']` workflow that stamps those four contexts for an
  intentions/-only SHA. (Jobs below line 60 in that file are non-required
  coverage stubs, not part of this coupling.) A consumer repo has neither this
  workflow nor the
  ruleset; without it, `graph-commit`'s scratch-branch stamp step never goes
  green and the push loop times out.
- Further host couplings: the office_hours parking fallback shells out to
  `npx tsx` against `STORE_MODULE` (`graph-commit:75-76,494`), and the script
  mirrors `.claude/skills/dispatch-propagate/scripts/lib.sh` conventions
  (`graph-commit:60-61`).

**Adopter expectation violated:** "I use the graph and its commit tool in my own
repo." `graph-commit` presumes *this* repo's entire CI-and-protection topology.

**Severity: DISMISSED as a standalone blocker for the DATA STRUCTURE; NOTED as a
harness-only tool.** The graph data structure does not need `graph-commit` — a
standalone adopter commits `intentions/*.md` with plain `git`. `graph-commit`
exists to land atomic, validated, single-commit graph writes onto a
*protected* main without a PR, which is a dispatch-harness convenience. So this
coupling does not *prevent* standalone use of the graph; it means anyone wanting
`graph-commit`'s specific behavior must replicate the fast-path workflow and
ruleset. Copy should not present `graph-commit` as part of the portable data
structure.

## Gap 4 — the align skill family assumes worktrees, dispatch state fields, and router semantics

**What breaks:** the align skills (`/align`, `/align-tactics`, and
peers) assume git worktrees, live-session detection, the dispatch `phase` /
`execution` lifecycle, and router selection. None of that is available to a
standalone adopter who only wants to author and validate a graph.

**Evidence:**

- `.claude/skills/align-tactics/SKILL.md:48-67` — reserves a node's worktree,
  checks for a live session via `worktree_has_live_session`
  (`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:15`), and
  enters it via native `EnterWorktree` or the `provision-node-worktree`
  primitive. All harness machinery.
- `.claude/skills/align-tactics/SKILL.md:12-16,29` — plans land as nodes on
  `origin/main` with `phase: implement`, explicitly *not* as GitHub issues; it
  disclaims `dispatch-*` scripts, plan-comments, and worktree-branch parsing as
  the successor behavior — i.e. the skill is defined *in terms of* the harness
  it replaces.

**Adopter expectation violated:** none, really — an adopter does not need the
skills. What they need standalone is the schema + `validateGraph` + a
`writeNode` path + an interview *pattern* they run themselves.

**Severity: DISMISSED as a standalone blocker.** The skills are correctly
harness-only; the separable substrate (schema, validation, write/read) sits
below them and does not depend on them. The gap is only that the skills are not
portable — which is expected and fine, provided copy does not imply the
*skills* travel with the data structure.

## Gap 5 — the schema carries harness-only fields, and `SCHEMA.md` documents neither them nor standalone use

Two related documentation/shape gaps.

**5a — dispatch-state fields live in the core schema.** `validateNode` accepts
and defaults seven fields that only the dispatch harness gives meaning to:
`phase`, `execution`, `validates`, `blocked_by`, `office_hours`, `pace_exempt`,
`rounds` (`src/schema.ts:124-131`; layer rules enforced by `validateGraph`
rules 10-12, `src/schema.ts:527-532`). A standalone adopter who never runs the
router still inherits these fields in the type and in `validateGraph`'s edge
rules.

- **Severity: DEGRADE.** They all default cleanly (`null` / `[]` / `false`,
  `schema.ts:483-494`), so a non-harness consumer can ignore them — the
  round-trip guarantee still holds. But they are conceptual noise for a pure
  data-structure adopter, and a candidate for a later split between a "core"
  schema and a "dispatch extension."

**5b — `SCHEMA.md` is insufficient for a standalone adopter.** The doc
describes the core model well (fields table, enums, `validateGraph` rules 1-9,
round-trip, derived attention) but has two concrete holes:

- The field table (`SCHEMA.md:57-74`) ends at `attributes` and **never
  documents** the seven dispatch-state fields from 5a. `validateNode` validates
  seven more fields than `SCHEMA.md` describes — an adopter reading the doc
  would not know they exist or that they default away.
- There is **no standalone-use section**: nothing tells an adopter how to author
  a graph outside this repo — no mention of the `write-node` / `validate-graph`
  CLIs (or their layout assumptions from Gap 1), no statement that
  `graph-commit` is harness-specific (Gap 3), no directory-layout guidance, and
  no "you need a TS loader / vendor the source" note (Gap 2).

- **Severity: DEGRADE (documentation).** The core model is documented; the
  standalone-adoption path and the extension fields are not. The fix is a
  `SCHEMA.md` addition (or a companion `USAGE.md`) covering the field gap and a
  standalone authoring walkthrough.

**Superseded 2026-07-28:** the remediation above (extend `SCHEMA.md` / add a
companion `USAGE.md`) no longer applies. `SCHEMA.md` has been deprecated and
deleted; the still-accurate schema documentation it held was moved into the
kind-node bodies, and `intentions/kind-kind.md` is now the sole doc home for
this content (including, going forward, any standalone-adoption and
dispatch-state-field documentation this gap called for). The dated audit
narrative above is left as-is as a historical record.

## Summary

| # | Gap | Severity |
| - | --- | -------- |
| 1 | CLI wrappers hardcode `<repo-root>/intentions/` + `packages/intentionsutil/` layout | Degrade (library API is clean) |
| 2 | Package is `private`, unbuilt, exports raw `.ts` — not npm-consumable | Blocker for drop-in; degrade if vendored |
| 3 | `graph-commit` couples to GitHub host + `graph/**` fast path + 4 named required checks | Dismissed for the data structure (harness-only tool) |
| 4 | align skills assume worktrees / `phase` / `execution` / router | Dismissed (skills are correctly harness-only) |
| 5a | Dispatch-state fields (`phase`…`rounds`) live in the core schema | Degrade (default cleanly) |
| 5b | `SCHEMA.md` omits those fields and has no standalone-use section | Degrade (documentation) |

The intention graph's **data model** (schema, validation, round-trip, and the
`store.ts` library API) is genuinely separable. What is *not* yet separable is
its **distribution** (Gap 2), its **CLI ergonomics off this repo's layout**
(Gap 1), and its **documentation for a standalone reader** (Gap 5). The commit
primitive and the skills (Gaps 3, 4) are harness tools that a standalone adopter
does not need and copy should not present as portable. Copy for
`strategy-data-structure-first` should therefore describe standalone use as an
honest direction, with Gaps 1, 2, and 5 as the tracked path from direction to
capability.
