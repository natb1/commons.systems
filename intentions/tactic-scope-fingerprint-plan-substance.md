---
id: tactic-scope-fingerprint-plan-substance
kind: tactic
statement: Scope tacticScopeFingerprint to PLAN SUBSTANCE only, excluding
  machinery-appended body sections, so no machinery writer can trip the tactic
  scope-custody gate by construction
owner: ai
status: codified
parent: null
rationale: "The greenfield half of the 2026-07-25 /align-strategy round on false
  scope-drift demotions, recorded per the design-proposals rule alongside its
  migration carrier tactic-transition-node-stamp-landed-body.
  tacticScopeFingerprint(statement, body) hashes the WHOLE body, so any
  machinery-written section counts as scope drift — today that is /qa-fix's Step
  3.6 `## needs-main residue` append, but the class is open and every future
  machinery body-writer reintroduces it. The 2026-07-18 round already met this
  hazard from the align-session side and resolved it with a manual, fail-closed
  re-stamp primitive (restamp-scope-fingerprint.ts) plus the doctrine that
  'phase workers, qa/review sessions, and the tick never re-stamp' — leaning on
  the transition writer's machinery refresh to cover the machinery side. That
  refresh is defective, so the lean does not hold. Scoping the fingerprint to
  plan substance removes the need for either mechanism to be right about
  machinery writes at all: a machinery append is definitionally not plan
  substance. Requires a body-section convention distinguishing plan substance
  from machinery output, which does not exist yet — that convention is the
  substantive design work of this tactic, not an incidental. Deliberately NOT
  boosted: it is the sequenced target, not the immediate stop-the-bleeding fix."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-scope-fingerprint-plan-substance
  pr: 2974
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
validates: []
blocked_by:
  - tactic-transition-node-stamp-landed-body
  - tactic-hold-conflict-scope-fingerprint-plan-substance
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Scope tacticScopeFingerprint to PLAN SUBSTANCE only, excluding machinery-appended body sections, so no machinery writer can trip the tactic scope-custody gate by construction

## Context

`tacticScopeFingerprint(statement, body)` (`packages/intentionsutil/src/router.ts:109-111`)
hashes the **whole** markdown body of a tactic node. The chain-of-custody gate
compares that hash against the phase-start stamp written at worker provision
(`.claude/skills/dispatch-propagate/scripts/provision-node-worktree:83-100`), and a
mismatch demotes the tactic back to `implement`, wiping `execution.markers`
(`qa-done` *and* `planned`) and discarding completed QA custody.

Machinery — not the author — writes into tactic bodies. `/qa-fix` Step 3.6's node
lane appends a `## needs-main residue` H2 to `intentions/<node-id>.md`
(`.claude/skills/qa-fix/SKILL.md:349-354`,
`.claude/skills/qa-fix/references/needs-main-followups.md:19-33`), and that append
rides in the same `transition-node` commit as the `qa → main-qa`/`review`
transition. Under today's whole-body hash that append **is** scope drift, so the
next `dispatch-graph-scope-sweep` falsely demotes the node. The 2026-07-25
/align-strategy round measured it: of 30 post-QA demotions, 26 were on nodes whose
QA pass had appended a residue section, against 6 of 54 never-demoted nodes.

The current mitigation is a workaround, not a fix: `transition-node`'s
`refresh_stamp()` (`.claude/skills/dispatch-propagate/scripts/transition-node:83-98`)
re-stamps after every transition specifically so machinery appends do not trip the
gate — and it is itself defective (it hashes the post-`git reset --hard` worktree
copy, not what landed). Its content-source repair is a **separate** carrier,
`tactic-transition-node-stamp-landed-body`; this tactic does not touch it.

This tactic removes the need for any writer to be right about machinery appends:
`tacticScopeFingerprint` is rescoped to **plan substance only**. A machinery append
is definitionally not plan substance, so no machinery writer can trip the custody
gate by construction. The substantive design work is the missing convention — a
body-section boundary that separates authored plan substance from machinery output
— which this plan defines positionally (a sentinel, not a name registry) so a
*future* machinery writer needs no registration to stay outside the fingerprint.

Facts established while planning (do not re-derive):

- `tacticScopeFingerprint` has exactly five callers, all passing
  `(statement, readNodeBody(...))` verbatim: `scope-sweep.ts:105`,
  `check-node-selection.ts:318`, `compute-freshness.ts:88`,
  `restamp-scope-fingerprint.ts:79`, and `transition-node:89-94`'s inline
  heredoc. Rescoping the function propagates to all five with no caller edits.
- There are exactly **three** stamp-comparison sites: `scope-sweep.ts:105-106`,
  `check-node-selection.ts:341` and `compute-freshness.ts:88-91`. `transition-node`
  and `restamp-scope-fingerprint.ts` only *write* stamps.
- The only machinery writer into a *tactic's own* body today is `/qa-fix`
  Step 3.6's `## needs-main residue`. `/fix-checks`' `## Iteration <n>`
  accumulator writes `tmp/fix-checks-summary.md`, not a node body
  (`.claude/skills/fix-checks/SKILL.md:718-722`).
- 19 node files under `intentions/` currently carry a `## needs-main…` H2, and in
  **every one** it is the last H2 in the body (verified by scan). So truncating
  the substance region at that heading loses no authored plan content today.
- `packages/intentionsutil/src/transitions.ts` already imports `router.js` and
  `router.ts` already imports `transitions.js` — an existing, working ESM cycle.
  New shared helpers therefore go in a **leaf** module that imports neither.

## Units of work

### Unit 1 — Define the plan-substance boundary and rescope the fingerprint

**Scope.**

*New file* `packages/intentionsutil/src/body-substance.ts` — a leaf module (imports
nothing from this package; keeps it out of the router↔transitions cycle) exporting:

```ts
/** The machinery boundary: everything at or below this line is machinery output. */
export const MACHINERY_SENTINEL =
  "<!-- machinery: dispatch-appended sections below this line are excluded from the tactic scope fingerprint -->";

export function isMachinerySentinelLine(line: string): boolean;   // /^<!--\s*machinery\b/.test(line.trim())
export function isNeedsMainHeadingText(headingText: string): boolean; // /^needs-main(?:\s|$)/i.test(headingText.trim())
export function planSubstance(body: string): string;
export function appendMachinerySection(body: string, section: string): string;
```

`planSubstance(body)` — the boundary rule, in this exact order:

1. Walk the body's lines tracking each line's start offset.
2. The **boundary** is the first line that either (a) satisfies
   `isMachinerySentinelLine`, or (b) matches `/^##\s+(.*)$/` whose captured
   heading text satisfies `isNeedsMainHeadingText`. Rule (b) is the
   legacy/defence-in-depth arm: it classifies the 19 already-landed
   `## needs-main…` sections as machinery with no body rewrite, and catches a
   writer that appends residue without the sentinel.
3. **No boundary → return `body` byte-for-byte unchanged.** This property is
   load-bearing: every tactic with no machinery section keeps *exactly* today's
   fingerprint, so landing this change invalidates no stamp on such a node.
4. Boundary found → return `body.slice(0, boundaryLineStartOffset)` with its
   trailing newline run collapsed to exactly one `\n`
   (`prefix.replace(/\n+$/, "\n")`); an empty prefix stays `""`.

`appendMachinerySection(body, section)` — the only supported way to write a
machinery section:

- `base = body === "" ? "" : body.replace(/\n*$/, "\n")` (exactly one trailing newline).
- `normalizedSection = section.replace(/\s+$/, "") + "\n"`.
- If any line of `body` satisfies `isMachinerySentinelLine`, return
  `base + "\n" + normalizedSection` (appends at end-of-body, which is necessarily
  below the sentinel).
- Otherwise return `base + "\n" + MACHINERY_SENTINEL + "\n\n" + normalizedSection`.
- Never modifies a single byte above the boundary.

*Edit* `packages/intentionsutil/src/router.ts:92-111`:

- `tacticScopeFingerprint(statement, body)` becomes
  `sha256(JSON.stringify({ statement, body: planSubstance(body) }))`. Keep the
  `(statement, body)` signature and the canonical-JSON framing.
- **Rewrite the doc comment at `:92-108`.** It currently asserts the opposite of
  the new contract — *"Residue sections appended to the body ARE scope and DO
  change it; the transition writer refreshes the stamp after such an append"* — and
  must now state: the hash covers plan substance only; machinery sections below the
  boundary are excluded by construction; `readNodeBody` still returns the verbatim
  body and the exclusion happens here, not in the store.
- Add, next to it, the single home of "what a stamp is allowed to equal":

```ts
export function acceptableScopeFingerprints(statement: string, body: string): readonly string[];
export function scopeStampMatches(stamped: string, statement: string, body: string): boolean;
```

  `acceptableScopeFingerprints` returns `[tacticScopeFingerprint(statement, body),
  legacyWholeBodyFingerprint(statement, body)]`, where `legacyWholeBodyFingerprint`
  is a **module-private** `sha256(JSON.stringify({ statement, body }))` — the
  pre-rescope definition. `scopeStampMatches` is
  `acceptableScopeFingerprints(...).includes(stamped)`.

  The second entry is an explicitly **transitional** acceptance and must carry a
  comment saying so, naming its deletion condition: stamps rotate on every worker
  provision (`provision-node-worktree:83-100`) and every transition
  (`transition-node:83-98`), so once no `<main-root>/.claude/worktrees/*.scope-fingerprint`
  file predates this change's merge, drop the legacy entry, inline
  `tacticScopeFingerprint` into `scopeStampMatches`, and delete the private helper.
  Without it, the 19 residue-carrying nodes (and any body not ending in exactly one
  `\n`) would all read as scope-stale on the first sweep after merge — re-firing
  the exact false-demotion this tactic exists to stop.

*Edit* `packages/intentionsutil/src/transitions.ts:234-248` — `hasNeedsMainResidue`
keeps its current behavior and signature (it must keep scanning the **raw** body:
the reconciler's `qa → main-qa` routing depends on seeing the residue), but its
inline `/^needs-main(?:\s|$)/i` test is replaced by the imported
`isNeedsMainHeadingText`, so one detector serves both the routing branch and the
boundary rule.

*Edit* `packages/intentionsutil/src/transitions.ts:325-333` — widen `isScopeStale`
to `isScopeStale(stamp: ScopeStamp | null, current: string | readonly string[])`:
`null` stamp is still never stale; otherwise stale iff the stamp's fingerprint is in
the accepted set (a bare string is treated as a one-element set). Existing tests at
`packages/intentionsutil/test/transitions.test.ts:276-279` pass unchanged.

*Edit the three comparison sites* to route through the accepted set — this is what
closes the merge-window gap:

- `packages/intentionsutil/src/scope-sweep.ts:105-106` → read the body once, then
  `if (!scopeStampMatches(stamped, node.statement, body)) stale.push(node.id);`
- `packages/intentionsutil/scripts/check-node-selection.ts:317-345` → hoist
  `readNodeBody(dir, nodeId)` into a local at `:318` (it is currently read inline),
  keep `scopeFp = tacticScopeFingerprint(...)` as the value returned on stdout at
  `:351` (provision writes that stdout into the stamp file, so the stamp must carry
  the **new** fingerprint), and replace the `stampedScope !== scopeFp` compare at
  `:341` with `!scopeStampMatches(stampedScope, node.statement, body)`.
- `packages/intentionsutil/scripts/compute-freshness.ts:88-91` → keep
  `parseScopeStamp` for `stampMissing`, and compute
  `scopeStale = isScopeStale(stamp, acceptableScopeFingerprints(tactic.statement, body))`.

*Edit* `packages/intentionsutil/src/index.ts:16-22` — export `planSubstance`,
`appendMachinerySection`, `MACHINERY_SENTINEL`, `acceptableScopeFingerprints` and
`scopeStampMatches` alongside the existing `router.js` re-exports, matching the
barrel convention.

*Tests.* New `packages/intentionsutil/test/body-substance.test.ts`:

- `planSubstance` returns the body byte-identically when no boundary is present.
- Boundary at the sentinel; boundary at a `## needs-main residue` H2 with no
  sentinel; boundary at whichever comes **first** when both are present.
- Case-insensitive heading match (`## Needs-main QA`), and a non-machinery H2
  (`## Verification`) is *not* a boundary.
- Invariant: for any body ending in exactly one `\n` (the store's convention, see
  `store.ts:44`), `planSubstance(appendMachinerySection(B, S)) === planSubstance(B)`,
  and therefore `tacticScopeFingerprint` is unchanged by a machinery append —
  assert this for a first append (sentinel inserted) **and** a second append
  (sentinel already present).
- `appendMachinerySection` never mutates bytes above the boundary.

Extend `packages/intentionsutil/test/scope-sweep.test.ts` (reuse its
`anode`/`seed`/`stamp` helpers at `:14-52`): a qa-phase node stamped at its
pre-append fingerprint, then given a residue append, is **not** returned by
`listScopeStaleTactics`; a node whose `## Context` prose actually changed still is.
Extend `packages/intentionsutil/test/check-node-selection.test.ts:580-620` with the
same pair against exit 13.

**Out of scope for this unit and the whole plan:** `transition-node`'s
`refresh_stamp()` content-source bug (owned by
`tactic-transition-node-stamp-landed-body`); any change to
`restamp-scope-fingerprint.ts`'s behavior or fail-loud contract (it stays needed for
genuinely scope-inert *author* edits and picks the new semantics up for free through
`tacticScopeFingerprint`); `readNodeBody`'s verbatim contract (`store.ts:107-118`)
and `writeNode`'s durable-body guard (`store.ts:39-76`) — the filtering is read-side
only, bodies are stored unchanged; `validate-graph.ts` and `planlint.ts` checks (the
fingerprint is a dispatch-gate concern, not a graph-validity one);
`dispatch-derive-node-target`, which keeps handing workers the raw body including
machinery sections.

**Recommended model:** opus.

### Unit 2 — `append-machinery-section` CLI, the one supported writer

**Scope.**

*New file* `packages/intentionsutil/scripts/append-machinery-section.ts`:

```
npx tsx packages/intentionsutil/scripts/append-machinery-section.ts <id> \
  [--dir <intentions-dir>] [--section-file <path>|-]
```

- Defaults: `--dir` = `<repo-root>/intentions` resolved from the script's own
  location three directories up (copy `restamp-scope-fingerprint.ts:44-48`, which
  resolves from `import.meta.url`, never cwd); `--section-file -` (stdin) is the
  default source of the section markdown.
- Rejects unknown flags and a missing/extra positional with a usage error and
  exit 1 — mirror `restamp-scope-fingerprint.ts:103-165`'s arg handling exactly
  (no defensive fallbacks, per `.claude/rules/code-style.md`).
- Requires the section text to start with `## ` after trimming; otherwise exit 1
  with a clear error naming the requirement.
- Rewrite recipe — **do not go through `writeNode`** (its YAML round-trip has
  clobbered residue bodies before): read `<dir>/<id>.md` raw, get
  `body = extractBody(raw, id)` from `packages/intentionsutil/src/frontmatter.ts:31-38`,
  then write `raw.slice(0, raw.length - body.length) + appendMachinerySection(body, section)`.
  Frontmatter bytes are preserved exactly.
- Exit 0 silently on success; print the resulting file path to stdout for the
  caller's log.

*New file* `packages/intentionsutil/test/append-machinery-section.test.ts` — follow
`packages/intentionsutil/test/restamp-scope-fingerprint.test.ts:20-64`'s
`mkdtempSync` + `writeNode` fixture pattern. Assert: the frontmatter is
byte-identical before/after; the sentinel appears exactly once after two appends;
`tacticScopeFingerprint(statement, readNodeBody(dir, id))` is unchanged across both
appends; a section not starting with `## ` exits non-zero; the file is left
untouched on that error.

**Dependencies:** Unit 1.

**Recommended model:** sonnet.

### Unit 3 — Rewire the machinery writers and the doctrine that leans on them

**Scope.** Documentation/skill edits only; no code.

- `.claude/skills/qa-fix/SKILL.md:349-354` and
  `.claude/skills/qa-fix/references/needs-main-followups.md:19-33` — the node lane
  now composes the `## needs-main residue` section and appends it by running
  `append-machinery-section` (Unit 2) instead of hand-editing
  `intentions/<node-id>.md`. Keep everything else about Step 3.6 unchanged: same
  heading text, same per-item fields (`id`, `title`, `url_path`,
  `expected_outcome`, `finding`), same "rides in the Step-4 `transition-node`
  commit" sequencing. Add one sentence stating why the CLI is mandatory: it places
  the section below the machinery sentinel, which is what keeps the append outside
  the scope fingerprint.
- `.claude/skills/qa-main/SKILL.md:95-105` — note that the residue H2 now sits
  below the machinery sentinel line and that parsing is unaffected (the node lane
  reads the raw body). No change to the residue matcher.
- `.claude/skills/align-tactics/references/tactic-target.md:196-236` and the
  parallel passage at `.claude/skills/align-strategy/SKILL.md:595-605` — add the
  new authoring rule: **an author/align-round body amendment must be written ABOVE
  the machinery sentinel.** Text placed below it is invisible to the scope
  fingerprint, so a substantive plan edit landed there would silently bypass
  custody. The existing scope-inert classification + `restamp-scope-fingerprint.ts`
  discipline is unchanged and still governs author edits; state explicitly that it
  no longer has to cover machinery appends.
- `.claude/skills/dispatch-propagate/scripts/transition-node:83-84` — update the
  comment only. `refresh_stamp()`'s stated purpose ("so machinery body appends do
  not later trip the custody gate") is now obsolete; it survives as the
  post-transition stamp/sha refresh, and its content-source repair belongs to
  `tactic-transition-node-stamp-landed-body`. **Do not delete or alter the
  function** — its fail-open contract is deliberately distinct from
  `restamp-scope-fingerprint.ts`'s fail-loud one.

**Dependencies:** Units 1 and 2.

**Recommended model:** sonnet.

## Reuse

- `packages/intentionsutil/src/transitions.ts:242-248` `hasNeedsMainResidue` — the
  existing H2-heading detector; its `needs-main` predicate is extracted to
  `isNeedsMainHeadingText` and shared rather than duplicated.
- `packages/intentionsutil/src/planlint.ts:130,140` — the established
  `/^##\s+…/im` heading-detection idiom in this package; match its style.
- `packages/intentionsutil/src/frontmatter.ts:31-38` `extractBody` — the single
  fence-boundary parser; the CLI reuses it instead of re-deriving the split.
- `packages/intentionsutil/src/store.ts:107-118` `readNodeBody` — unchanged; still
  the verbatim-body reader every fingerprint caller uses.
- `packages/intentionsutil/src/transitions.ts:319-333` `parseScopeStamp` /
  `isScopeStale` — the existing stamp parser and staleness primitive; widened, not
  replaced.
- `packages/intentionsutil/scripts/restamp-scope-fingerprint.ts:44-48,103-176` —
  the arg-parsing, script-relative path resolution and fail-loud error style the
  new CLI copies.
- `packages/intentionsutil/test/scope-sweep.test.ts:14-52` (`anode`, `seed`,
  `stamp`) and `packages/intentionsutil/test/restamp-scope-fingerprint.test.ts:20-64`
  — the two established fixture patterns for fingerprint/stamp tests.
- `packages/intentionsutil/src/index.ts:16-22` — the barrel export site for the new
  public helpers.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app packages/intentionsutil || exit 1
npx vitest run --project packages/intentionsutil --root .
```

(The vitest project name is the workspace directory — `packages/intentionsutil` —
per the root `vitest.config.ts`; rooting at the repo root is required.)

Manual and observe-in-production checks:

- **No-boundary bodies keep today's hash (the no-migration property).** Before
  merging, on a node with no machinery section, confirm the fingerprint is
  bit-identical across the change:
  `npx tsx -e 'import("./packages/intentionsutil/src/router.js").then(async r => { const s = await import("./packages/intentionsutil/src/store.js"); const id = "tactic-scope-fingerprint-plan-substance"; console.log(r.tacticScopeFingerprint(s.readNode("./intentions", id).statement, s.readNodeBody("./intentions", id))); })'`
  run on `origin/main` and on the branch — the two hashes must match. Repeat on a
  node that *does* carry `## needs-main residue` (e.g.
  `intentions/tactic-heartbeat-sweep-before-pause.md`): those two hashes must
  **differ**, and the branch hash must equal the hash of the same body truncated
  above line 131.
- **End-to-end machinery append.** Copy a residue-free node file into a scratch
  `intentions/` dir, record its fingerprint, run the Unit-2 CLI with a
  `## needs-main residue` section, and re-record: the fingerprint must be
  unchanged, the frontmatter byte-identical, and `hasNeedsMainResidue` must still
  report `true` on the raw body (so `qa → main-qa` routing is intact).
- **Post-merge, watch for the demotion class disappearing.** `dispatch-graph-scope-sweep`
  prints `scope-stale <id>` per demotion. Over the days after merge, no demotion
  should be attributable to a machinery append; cross-check any demotion that does
  appear by diffing the node's `intentions/*.md` across
  `git log <stamped-sha>..origin/main` and confirming the diff touches content
  above the machinery boundary. The next `/qa-fix` node-lane pass that produces
  needs-main residue is the live end-to-end case: the node should reach `main-qa`
  and stay there, with its `qa-done` marker intact.
- **Retire the transitional acceptance.** Once every
  `<main-root>/.claude/worktrees/*.scope-fingerprint` file postdates the merge
  commit (`ls -l` on that directory), delete the legacy entry from
  `acceptableScopeFingerprints` and its private helper, and re-run the verify
  block. This is a deliberate follow-up, not part of the PR.
