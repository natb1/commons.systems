---
id: tactic-rsi-reprioritization-outcome-audit
kind: tactic
statement: Derive the reprioritization delta and the post-hoc outcome audit —
  did tactics /rsi-evaluate front-loaded actually close faster than the queue
  baseline
owner: ai
status: codified
parent: null
rationale: "Split out 2026-08-11 after adversarial review of the round that
  created strategy-rsi-delegated-prioritization. That strategy names this
  measurement as the sensor for its outcome signal, but the work was filed
  inside tactic-rsi-plan-priority-render, which serves the sibling
  strategy-rsi-plan-surface. That inverts the stay-vs-move principle the same
  round recorded on the parent: completing this audit moves THIS strategy signal
  and does not move the surface child at all, and filing it outside the subtree
  made this strategy signal unreadable until an unrelated tactic landed."
reading: null
serves:
  - strategy-rsi-delegated-prioritization
recovers: []
clarifications:
  - question: This node's blocker was pruned and its implementation file was
      deleted. Where does the work live now, and is the node still worth
      building?
    answer: >-
      (Recorded 2026-08-13 with the prune round that followed the collapse, PR
      3074.) Still worth building — this node is the SENSOR named by
      strategy-rsi-delegated-prioritization's success signal, so pruning it
      would leave that strategy's outcome half with no carrier at all. What
      changes is where it lives and what it waits on.


      The blocked_by on tactic-rsi-plan-priority-render is cleared. That node is
      pruned: it typed the rsi-plan.md task-plan section and added the
      renderer's staleness FLAG kinds, and both the section and the renderer are
      retired doctrine. This also settles a contradiction that was standing on
      main — the body below says 'No blocked_by' in its own Dependencies section
      while the frontmatter carried one. The body was right.


      The carrier moves from the renderer to /rsi-audit. The body says 'All work
      is in packages/intentionsutil/scripts/render-rsi-plan.ts'; that file was
      deleted by the collapse. Both halves — the per-iteration reprioritization
      delta and the post-hoc outcome audit — become /rsi-audit lens sections,
      alongside the per-workflow spend fold that landed with PR 3074. The
      measurement is unchanged: join attributes.priority_log entry dates with
      node closure dates, derived on read, no new stored state, and report
      'insufficient data' honestly rather than a median computed from three
      closures.


      The actuator whose acts it audits is /rsi-audit, not the /rsi-evaluate
      named in the statement and body — that skill was retired unbuilt and its
      node is pruned in this same round. The statement is left as written
      because it is a dated record and this clarification is what makes it
      readable as one.


      Worth stating rather than discovering: nothing can be measured yet.
      attributes.priority_log has no writer anywhere on main — it is prose in
      eight node files — so the join has an empty left side by construction. The
      real prerequisite is tactic-rsi-audit-prioritization-writer, itself
      blocked on tactic-attention-namespaced-rank. That is deliberately NOT
      recorded as a blocked_by: this node can be built against the field as
      written and will read 'insufficient data' until entries exist, which is
      the honest reading and not a failure.
  - question: "Verified against main 2026-08-20: which parts of this node's Scope
      and Verification prose are now stale, and what shape should the work take
      on its new carrier?"
    answer: "(Recorded 2026-08-20 by the /align-tactics per-node finalize pass,
      verifying the body against main.) The Scope prose is stale in three places
      and the finalize round is authorized to rewrite all three — the 2026-08-13
      clarification already moved the carrier, but the body text was never
      brought along. ONE: \"All work is in
      packages/intentionsutil/scripts/render-rsi-plan.ts\" names a file that no
      longer exists (deleted by the PR-3074 collapse;
      tactic-rsi-plan-render-retire sits at phase done), and the Dependencies
      bullet deferring \"Section 6's typing and the renderer's FLAG kinds\" to
      tactic-rsi-plan-priority-render names a node absent from intentions/ since
      the 2026-08-13 prune. TWO: the Verification section requires the output be
      \"reachable from /rsi\", but /rsi today is the per-phase evaluation skill
      that lands ledger findings through dispatch-eval-finding — the report
      surface is /rsi-audit, and the reachability check belongs there. THREE:
      the section shape to copy is the unranked, non-lens Step 7 form in
      .claude/skills/rsi-audit/SKILL.md:200-206 (\"It is not a Nth lens and is
      not ranked by price_proxy_usd\"), not a thirteenth lens. None of this
      changes the measurement, which stands as the 2026-08-13 clarification
      records it: join attributes.priority_log entry dates with node closure
      dates, derived on read, no new stored state, and report \"insufficient
      data\" honestly. Also confirmed this round and NOT a drift:
      attributes.priority_log is still outside the substance fingerprints —
      strategyFingerprint (packages/intentionsutil/src/router.ts:102-111) hashes
      only statement, clarifications, attributes.conditions, serves,
      success_signal, and tooling_goals, and tacticScopeFingerprint hashes
      statement plus body only — so the serving strategy's fingerprint
      conditions on priority_log and measured_impact both hold."
  - question: Two batch-plan docs still say this node is parked on an open author
      ruling — is that a live blocker?
    answer: "(Verified 2026-08-29 by the /align-tactics per-node finalize pass.) The
      PR14 entries in plans/dispatch-rsi-serialized-pr-plan.md:2427 and the
      position-8 row in plans/dispatch-rsi-sequence.md:35 still read \"parked on
      an author ruling ... still open\" for this node. That is stale, not a live
      blocker: the author ruled observable (a) on 2026-08-29 (disposition A,
      ratified as proposed, recorded as a clarification on
      strategy-rsi-delegated-prioritization in commit 2c806848), and this node's
      office_hours park was cleared in commit 06ba043e with the plan write
      explicitly handed to /align-tactics. Read the graph, not the plan doc:
      baseline = closed owner: ai tactics with no priority_log entry in the
      window, interval = node creation date to phase-done commit date for BOTH
      cohorts, the priority_log entry date partitions cohorts and bounds the
      per-iteration delta and is never a start point. Do not re-park this node
      on the plan doc's word."
  - question: Who sets the "insufficient data" floor for the outcome audit, and does
      changing it need an author sitting?
    answer: (Recorded 2026-08-29 by the /align-tactics per-node finalize pass.) The
      "insufficient data" floor is set by the plan, not by the author. The
      body's standing doctrine is the constraint — a median computed from three
      closures is worse than an admission, because this section exists to be the
      check on the model's own judgment and a check that always answers is not a
      check — so the plan names an explicit minimum front-loaded-cohort size,
      states that number in the section's own output line rather than hiding it,
      and reports "insufficient data (n=<N>, floor <F>)" below it. The floor is
      derived on read with no stored state, so revising it later invalidates
      nothing and needs no author sitting. With priority_log carrying zero
      entries on main today (zero code, zero schema, zero validate-graph rule;
      prose in eight node files, re-verified this pass), the section reads
      "insufficient data" from the day it lands, which is the honest reading and
      not a failure.
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates:
  - strategy-rsi-delegated-prioritization
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Derive the reprioritization delta and the post-hoc outcome audit — did tactics /rsi-evaluate front-loaded actually close faster than the queue baseline

(The H1 reproduces the frontmatter `statement` verbatim, including the retired
`/rsi-evaluate` name. Per the 2026-08-13 clarification the statement is left as
written because it is a dated record; the carrier is `/rsi-audit`, and this body
is what makes the statement readable as a record rather than an instruction.)

## Context

This is the **sensor** named by `strategy-rsi-delegated-prioritization`'s success
signal. Its observable (a) — "the median closure interval of tactics the model
front-loaded, against the dispatch queue's baseline closure interval" — cannot be
read at all until this node lands. Nothing else in the graph computes it.

Three facts set the shape of the work, and each supersedes prose that stood in
this body before this plan replaced it:

1. **The carrier is `/rsi-audit`, not a renderer.** The original body said "All
   work is in `packages/intentionsutil/scripts/render-rsi-plan.ts`". That file was
   deleted by the PR-3074 collapse (`tactic-rsi-plan-render-retire`, phase done),
   and `/rsi-evaluate` was retired unbuilt. Both halves — the per-iteration
   reprioritization delta and the post-hoc outcome audit — become an `/rsi-audit`
   report section in the **unranked, non-lens Step 7 form**
   (`.claude/skills/rsi-audit/SKILL.md:199-202` for the bullet template,
   `:240-269` and `:419-486` for the full-section template): *not* a thirteenth
   lens, *not* ranked by `price_proxy_usd`, rendered on every fleet-scoped run.
   The original body's Dependencies bullet deferring "Section 6's typing and the
   renderer's FLAG kinds" to `tactic-rsi-plan-priority-render` names a node pruned
   from `intentions/` on 2026-08-13; that bullet is deleted, not carried forward.
2. **The measurement itself is unchanged**, as the 2026-08-13 and 2026-08-20
   clarifications record it: join `attributes.priority_log` entry dates with node
   closure dates, derived on read, no new stored state (the same doctrine as rank
   itself), and report **"insufficient data" honestly** rather than a median
   computed from three closures.
3. **The 2026-08-29 author ruling fixes the cohorts and the interval** (strategy
   clarification, disposition (A) of this node's own office-hours park, ratified
   as proposed):
   - **Front-loaded cohort** = closed `owner: ai` tactics carrying at least one
     `attributes.priority_log` entry dated inside the window.
   - **Baseline cohort** = the *complement*: closed `owner: ai` tactics with no
     `priority_log` entry inside the window.
   - **Interval, for BOTH cohorts** = node creation date → phase-done commit date.
   - The `priority_log` entry date **partitions the cohorts and bounds the
     per-iteration delta; it is never a start point.** A boost-dated start would
     make the two cohorts incommensurable, because the baseline cohort has no
     boost date by construction. This is the stricter admissible reading and the
     only one under which the front-loaded cohort can genuinely score **worse**
     than baseline — which this node's own doctrine requires (below).

**The adversarial reading is load-bearing, not a caveat.** A sustained result
showing front-loaded nodes closing *no faster* than baseline is evidence the
delegated reordering is not earning its authority, and must be surfaced as such
rather than buried as a null result. A check that always answers favourably is not
a check. This is why the verdict line names both directions explicitly and why the
"insufficient data" branch exists as a first-class outcome rather than a fallback.

**What is honestly unreadable today, and why that is not a failure.**
`attributes.priority_log` has no writer anywhere on `main` — it is prose in eight
node files, with no schema entry, no `validate-graph` rule, no reader and no
writer. So the join has an empty left side by construction and this section will
print "insufficient data" on its first run. That is the correct output, not a
defect: the actuator (`tactic-rsi-audit-prioritization-writer`, itself blocked on
`tactic-attention-namespaced-rank`) is deliberately **not** recorded as a
`blocked_by` here. This node builds against the field as currently specified and
reads "insufficient data" until entries exist.

### Boundaries carried forward

- **No `blocked_by`, by design.** The field's schema, cap and lint are
  `tactic-priority-provenance-schema` (also under this strategy). This node can be
  built against the field as written (`{date, old→new, rationale}`, append-only,
  capped ~10 — `intentions/tactic-priority-provenance-schema.md:61` region). If
  that tactic changes the shape, **whichever lands second reconciles**; this plan
  concentrates every read of the field in one exported function so that
  reconciliation has a single site (Unit 2).
- **The integrity half of the strategy's signal is NOT here.** Observable (b) —
  attention writes onto a strategy's own attention block, plus attention writes
  carrying no `priority_log` entry — is `validate-graph` lint belonging to
  `tactic-priority-provenance-schema`. (Note the 2026-08-28 amendment: the old
  "cross-strategy rank inversion count" framing is retired language, structurally
  zero and measuring nothing. Do not implement or cite it.)
- **No fingerprint risk.** `strategyFingerprint`
  (`packages/intentionsutil/src/router.ts:103`) hashes only statement,
  clarifications, `attributes.conditions`, serves, success_signal and
  tooling_goals; `tacticScopeFingerprint` (`:132`) hashes statement plus body
  only. Neither hashes `attributes.priority_log` or `attributes.measured_impact`,
  so a derived-on-read join over those fields can never trip scope custody or
  freeze an open child. Verified 2026-08-20 and re-verified for this plan — this
  is a fact to rely on, not something to re-check at implementation time.
- **No new sensor registry entry.** The strategy names *this section of the
  `/rsi-audit` report* as its sensor, not a `read-sensors.ts` reading. Adding a
  dated `success_signal.reading` is explicitly out of scope for every unit below.

---

## Unit 1 — Shared git-derived node lifecycle dates, and one `isAiOwnedAt`

**Scope.** New file `packages/intentionsutil/scripts/lib-node-lifecycle-dates.ts`
(script layer, not `src/`, because it shells out to git — the same rule that keeps
`lib-store-at-ref.ts` out of `src/`, stated at
`packages/intentionsutil/scripts/lib-store-at-ref.ts:1-12`). Exports:

- `assertNotShallowRepository(repoRoot: string): void` — moved verbatim (message
  included) from the inline guard inside `gitEntryDate`
  (`packages/intentionsutil/scripts/ledger-census.ts:154-166`): `git rev-parse
  --is-shallow-repository`, throwing when `true`, because a shallow boundary makes
  `--diff-filter=A` report every path present there as newly Added and yields a
  plausible-but-wrong (too-recent) date.
- `isAiOwnedAt(repoRoot: string, commitHash: string, filePath: string): boolean` —
  the single home for `git show <commit>:<path>` + `/^owner:\s*ai\s*$/m`, keeping
  the existing degrade-to-`false`-on-lookup-failure posture (a total-sensor
  contract, not a silent fallback — the sensors depend on it).
- `parseCreationDates(log: string): Map<string, string>` — pure parser over
  `--format=%H %cI --name-only --diff-filter=A` output. git lists newest-first, so
  **the last add seen for a path wins** (the earliest add). Same last-line-wins
  rule as `parseEntryDate` (`ledger-census.ts:137`), generalized from one id to a
  whole-tree pass.
- `parseDoneDates(patch: string, isAiOwned: (commit: string, path: string) =>
  boolean): Map<string, string>` — pure parser over `git log -p --diff-filter=AM
  --no-renames --format=%H %cI` output, collecting per path the **latest**
  `+phase: done` added line whose commit passes the ownership gate. Loop shape
  copied from `read-sensors.ts:580-616` (commit line `/^([0-9a-f]{40}) (\S+)$/`,
  header `/^diff --git a\/(\S+) b\/(\S+)$/`, phase add `/^\+\s*phase:\s*(\S+)\s*$/`,
  date via `commitDate.slice(0, 10)`).
- `readTacticLifecycleDates(repoRoot: string): Map<string, { created: string; done:
  string | null }>` — keyed by repo-relative path (`intentions/tactic-*.md`). Calls
  `assertNotShallowRepository`, then runs the two git passes above (`maxBuffer: 64
  * 1024 * 1024`, matching the existing sensors) and folds them.

Refactors, behavior-preserving:

- `packages/intentionsutil/scripts/read-sensors.ts:350` and `:566` — the two
  verbatim private `isAiOwnedAt` copies — are deleted and both call sites import
  the shared one, passing `repoDir` as the new first argument.
- `packages/intentionsutil/scripts/ledger-census.ts:154-166` — the inline shallow
  guard is replaced by a call to `assertNotShallowRepository(root)`.

**Out of scope.** Do NOT restructure `readTacticVelocity`
(`read-sensors.ts:314`) or `readLifecyclePhaseHistory` (`:536`) beyond swapping
the helper. In particular `readLifecyclePhaseHistory` keeps its own patch loop:
it also collects the full per-path *phase set* for `LIFECYCLE_REQUIRED_PHASES`
(`:505`), which the new reader does not need, so replacing its loop would either
add a second git pass or widen the new reader's contract. Do not change
`gitEntryDate`'s `%as` date kind — its use is a census display, not interval
arithmetic. Do not touch any sensor's returned string format.

**Note on date kinds.** The new reader uses committer date (`%cI`, sliced to
`YYYY-MM-DD`) for **both** endpoints, matching `readLifecyclePhaseHistory`. Both
ends of an interval must come from the same clock; `gitEntryDate`'s author date
(`%as`) is deliberately not reused for the creation endpoint.

**Recommended model**: opus.

## Unit 2 — Pure derivation module `src/reprioritization.ts`

**Dependencies.** Unit 1 (for the `NodeLifecycle` shape it consumes; the module
itself imports nothing from Unit 1 at runtime).

**Scope.** New file `packages/intentionsutil/src/reprioritization.ts`, **fs-free,
git-free and process-free**, exactly like `packages/intentionsutil/src/spend.ts:1-17`
states its own contract. This is the reuse-first split the audit's own sibling
already established: derivation in `src/`, I/O and rendering in the thin CLI, so
the figure has one definition and cannot grow a second denominator.

Exports:

- `interface PriorityLogEntry { date: string; move: string | null; rationale: string
  | null }`.
- `readPriorityLog(attributes: unknown): { entries: PriorityLogEntry[]; malformed:
  number }` — **the single site that knows the field's shape.** Narrow with the
  `isPlainObject` style already used in `packages/intentionsutil/src/schema.ts:510-513`
  and `:536-537`; never an `as` cast (avoids a suppression marker under
  `.claude/rules/type-safety-suppression-marker.md`). An entry is well-formed when
  it is a plain object with a `date` string matching `/^\d{4}-\d{2}-\d{2}$/`.
  `rationale` is read when it is a string, else `null`. `move` is built from
  whichever of `old`/`new`, `from`/`to`, or a single `old_new`/`move` string field
  is present, else `null` — the recorded shape is prose (`{date, old→new,
  rationale}`), so read tolerantly and let `tactic-priority-provenance-schema`
  tighten it later. Entries that are not well-formed are **counted, not silently
  dropped** (`.claude/rules/code-style.md`); the count surfaces in the report.
- `interface NodeLifecycle { id: string; created: string; done: string | null;
  ownerAi: boolean; log: PriorityLogEntry[] }`.
- `intervalDays(created: string, done: string): number` — both parsed as
  `Date.parse(\`${d}T00:00:00Z\`)`, difference in whole days, clamped at `>= 0`.
- `median(values: number[]): number | null` — `null` on empty; mean of the two
  middles when even.
- `interface Window { since: string; until: string }` and `inWindow(date, window)`
  — inclusive on both ends.
- `deriveDelta(nodes: NodeLifecycle[], window: Window): DeltaRow[]` — one row per
  `priority_log` entry **dated inside the window**, `{ id, date, move, rationale }`,
  sorted by date ascending then id ascending. Rows come from every `owner: ai`
  tactic, closed or not: the delta reports what moved, and an open node that was
  boosted this window is exactly what it exists to show. It **reports without
  judging** — no verdict, no ranking.
- `deriveOutcomeAudit(nodes: NodeLifecycle[], window: Window): OutcomeAudit` —
  implements the 2026-08-29 ruling literally:
  - Population = nodes with `ownerAi === true` and `done !== null` and `done`
    inside the window ("closed … in the window").
  - `frontLoaded` = population members with ≥1 `priority_log` entry dated inside
    the window; `baseline` = the exact complement of that population.
  - Each member's interval is `intervalDays(created, done)`. **The entry date is
    never a start point.**
  - Result `{ frontLoaded: { n, medianDays }, baseline: { n, medianDays }, verdict,
    malformed }` where `verdict` is one of `"insufficient-data"`,
  `"at-or-below-baseline"`, `"above-baseline"`.
  - `verdict` is `"insufficient-data"` whenever either cohort has fewer than
    `MIN_COHORT_N` members. Export `export const MIN_COHORT_N = 5` with a comment
    recording *why* the constant exists: "a confident number computed from three
    closures is worse than an admission, because this section is the check on the
    model's own judgment, and a check that always answers is not a check." Five is
    a plan-set floor, not an author ruling — it is a single exported constant so a
    later author decision moves it in one place.
  - Otherwise `"at-or-below-baseline"` when `frontLoaded.medianDays <=
    baseline.medianDays`, else `"above-baseline"`.

**Out of scope.** No file reads, no `execFileSync`, no `process.*`, no rendering
(the strings live in Unit 3, mirroring `attribute-spend.ts`'s split where
`renderSpendFold` sits in the script and the fold sits in `src/spend.ts`). No
`validate-graph` rule and no schema entry for `priority_log` — that is
`tactic-priority-provenance-schema`'s scope.

New test file `packages/intentionsutil/test/reprioritization.test.ts` covering, at
minimum: empty store → `insufficient-data` with `n: 0` on both cohorts; a
front-loaded cohort of 5 that beats a baseline of 5 → `at-or-below-baseline`; the
same data with the medians reversed → `above-baseline` (the adversarial direction
must be reachable and asserted); a node boosted *before* the window but closed
inside it landing in the **baseline** cohort, per the literal ruling; malformed
entries counted rather than dropped; `intervalDays` never negative.

**Recommended model**: opus.

## Unit 3 — Thin CLI `scripts/reprioritization-audit.ts`

**Dependencies.** Units 1 and 2.

**Scope.** New file `packages/intentionsutil/scripts/reprioritization-audit.ts`,
structured as a **thin CLI over the `src/` module**, exactly as
`packages/intentionsutil/scripts/attribute-spend.ts:1-35` documents its own shape
and its reason ("re-deriving the shares here … would give the fitness function two
denominators that could disagree").

Behavior:

- Flags: `--days <N>` (default `7`, matching `/rsi-audit`'s default window),
  `--now <YYYY-MM-DD>` (default today UTC — present so tests and backfills are
  deterministic), `--ref <ref>` (default `origin/main`), `--repo <abs path>`
  (default: repo root resolved three directories up from this file, the same
  script-location rule stated at
  `packages/intentionsutil/scripts/office-hours-select.ts:100-105` and
  `ledger-census.ts:22-27`; the override exists so a caller can name the checkout
  explicitly rather than relying on where the script happens to live).
- Reads the store with `listNodesAtRef(repoRoot, ref)`
  (`packages/intentionsutil/scripts/lib-store-at-ref.ts`), the same helper
  `office-hours-select.ts:90` uses — never a hand-parse of `intentions/*.md`, and
  never the working tree by default (a stale worktree reports stale attention with
  no signal that the answer is old). Filters to `kind === "tactic"` and
  `owner === "ai"`.
- Reads dates with `readTacticLifecycleDates(repoRoot)` from Unit 1, joins by
  `intentions/<id>.md`, folds with Unit 2.
- Renders two labeled blocks to stdout, exported as pure functions
  (`renderDelta`, `renderOutcomeAudit`) so they are testable without a git fixture,
  the way `renderSpendFold` is:
  - **Reprioritization delta — `<since>`..`<until>`**: a `node | entry date | move
    | rationale` table, or the line `No priority_log entries dated in this window.`
    when empty. Followed by the bound: this reports what moved; it does not judge
    it.
  - **Reprioritization outcome audit**: `front-loaded n=<x> median <a>d` /
    `baseline (complement) n=<y> median <b>d`, then one verdict line —
    `INSUFFICIENT DATA — need >= 5 closures in each cohort`, or
    `front-loaded median <a>d vs baseline <b>d — AT OR BELOW baseline`, or
    `front-loaded median <a>d vs baseline <b>d — ABOVE baseline: the delegated
    reordering is not earning its authority in this window`. Then three standing
    caveat lines: (i) the interval is node creation → phase-done commit for both
    cohorts and the `priority_log` entry date partitions only; (ii) the strategy's
    threshold is "across consecutive iterations", so one window never settles it;
    (iii) `malformed priority_log entries: <n>` when nonzero, following the
    `files_failed if nonzero` posture at `.claude/skills/rsi-audit/SKILL.md:190`.
- Exit codes mirroring `attribute-spend.ts:26-35`: **`0` when the audit printed,
  including "insufficient data" and including the `ABOVE baseline` verdict** (a
  finding is a finding, not a failed run); `1` when the measurement could not be
  taken (store unreadable at `ref`, shallow checkout) — never a fabricated empty
  population, since an empty fold would silently read as a clean pass; `2` usage.
- `main` guarded by the `import.meta.url === pathToFileURL(process.argv[1]).href`
  idiom already used at the bottom of `attribute-spend.ts`.

New test file `packages/intentionsutil/test/reprioritization-audit.test.ts`
exercising `renderDelta` / `renderOutcomeAudit` on in-memory fixtures (no git), and
`packages/intentionsutil/test/node-lifecycle-dates.test.ts` exercising Unit 1's
pure parsers plus one end-to-end pass over a fixture git repo. Build the fixture
repo with the `tempDir` / `git` / `initRepo` helpers copied from
`packages/intentionsutil/test/lifecycle-sensor.test.ts:26-45` — those helpers are
file-local and already duplicated across the sensor tests, so replicating them is
the established pattern here, not new duplication to avoid.

**Out of scope.** No writes of any kind: no node file, no `attention`, no
`priority_log` append, no sensor registry entry, no `success_signal.reading`. The
writer is `tactic-rsi-audit-prioritization-writer`.

**Recommended model**: sonnet.

## Unit 4 — Wire the section into `/rsi-audit`

**Dependencies.** Unit 3 (the CLI it names must exist and run).

**Scope.** `.claude/skills/rsi-audit/SKILL.md` only. Two edits, both copying the
existing unranked-section template rather than inventing prose structure:

1. Add one Step 7 bullet immediately after the **Strategy attention
   recommendations** bullet at `:202`, mirroring the sentence shape of `:199-202`
   exactly: a separate labeled, **fleet-only** section, rendered on EVERY
   fleet-scoped run, AFTER the ranked opportunities list; **not** a thirteenth lens
   and **not** ranked by `price_proxy_usd` (it carries no cost-magnitude figure at
   all, the same reasoning that keeps the spend fold, the parked survey and routing
   recommendations out of the numbered list); pointing down to the new section
   below.
2. Add a `## Reprioritization delta and outcome audit` section after `## Strategy
   attention recommendations` (which ends at `:486`) and before `## Per-session
   artifact join` (`:487`). It must state:
   - The run command — `npx tsx packages/intentionsutil/scripts/reprioritization-audit.ts
     --days <N>` — and the instruction to **reproduce its rows and verdict line
     verbatim**, exactly as the Per-workflow spend fold does at `:199` and
     `:220-238`.
   - **Do not recompute this in jq or by hand.** The cohorts, the interval and the
     `MIN_COHORT_N` floor are defined once, in
     `packages/intentionsutil/src/reprioritization.ts`; a second copy is a second
     definition of the strategy's own fitness reading. Same discipline the spend
     fold states at `:230` and the parked survey at `:267-269`.
   - **FLEET-ONLY**, for the reason the Parked-population survey gives at
     `:240-246`: the graph's closure population is a property of the whole store,
     not of one session, so a `--session`/`--node`-scoped evaluator skips it.
   - **This section MEASURES, never JUDGES which reorderings were right** — it
     reports the delta and the interval comparison; whether a given boost was wise
     is an author call at office hours.
   - The `ABOVE baseline` verdict is a **finding to surface, not a null result to
     bury**: it is evidence the delegated reordering is not earning its authority.
     Say so in the report rather than noting the number and moving on — the same
     obligation the `SPEND-DEVIATION FLAG` carries at `:234-238`.
   - The `INSUFFICIENT DATA` escape hatch, and that it is the **expected** output
     until `tactic-rsi-audit-prioritization-writer` lands (mirroring the honest
     "no strategy attention recommendations this window" line at `:469-471`).
     Cross-reference the existing "The write half is deliberately not built here"
     paragraph at `:472-486` rather than restating it.
   - The bound: this section reads the *audit* half of
     `strategy-rsi-delegated-prioritization`'s paired signal. The integrity half
     (observable (b)) is `validate-graph` lint under
     `tactic-priority-provenance-schema`, and neither half alone is a pass.

**Out of scope.** No change to the twelve-lens roster, to Step 5's ranking rule, to
Step 6's ledger write, or to the no-routing-policy bound at `:206`. No change to
any other skill.

**Recommended model**: sonnet.

---

## Reuse

- `packages/intentionsutil/scripts/read-sensors.ts:314` `readTacticVelocity` and
  `:536` `readLifecyclePhaseHistory` — the established `git log -p --diff-filter=AM
  --no-renames --format=%H %cI` + added-`+phase: done`-line + per-commit ownership
  gate technique. Unit 1 lifts the loop shape from `:580-616`; it does not
  re-derive commit-date extraction.
- `packages/intentionsutil/scripts/read-sensors.ts:350` and `:566` `isAiOwnedAt` —
  two verbatim private copies of `git show <commit>:<path>` +
  `/^owner:\s*ai\s*$/m`. Unit 1 extracts one shared export instead of adding a
  third copy.
- `packages/intentionsutil/scripts/ledger-census.ts:137` `parseEntryDate` (the
  last-line-wins add-date rule) and `:154-166` `gitEntryDate`'s shallow-checkout
  guard. Unit 1 generalizes the first to a whole-tree pass and extracts the second.
- `packages/intentionsutil/scripts/attribute-spend.ts:1-35` + `src/spend.ts:1-17` —
  the canonical thin-CLI-over-pure-`src`-module architecture for an unranked Step 7
  section, and the exit-code contract (`0` including a fired flag, `1` for "could
  not measure", `2` usage). Units 2 and 3 follow it exactly.
- `packages/intentionsutil/scripts/lib-store-at-ref.ts` `listNodesAtRef`, imported
  the way `office-hours-select.ts:90` imports it — store enumeration at
  `origin/main`, strict, erroring rather than returning an empty store.
- `packages/intentionsutil/src/store.ts:232` `listNodes` / `:249` `listNodesStrict`
  — reached through `listNodesAtRef`; never a hand-parse of node YAML.
- `packages/intentionsutil/src/schema.ts:510-513`, `:536-537` — the `isPlainObject`
  narrowing style for reading free-form `attributes` (`attributes` is
  `Record<string, unknown>` at `:250`/`:281`, and `priority_log` has no schema rule
  today), avoiding an `as` cast and its suppression marker.
- `packages/intentionsutil/src/router.ts:103` `strategyFingerprint` / `:132`
  `tacticScopeFingerprint` — cited as the reason no fingerprint dependency is
  introduced; no code change here.
- `.claude/skills/rsi-audit/SKILL.md:199-202` (bullet template), `:220-238`
  (Per-workflow spend fold: run-the-CLI-and-reproduce-verbatim, one-denominator
  rule, deviation-is-a-review-trigger), `:240-269` (Parked-population survey:
  FLEET-ONLY framing, "measures never judges"), `:419-486` (Strategy attention
  recommendations: the honest "nothing this window" line, and the write-half
  paragraph to cross-reference).
- `packages/intentionsutil/test/lifecycle-sensor.test.ts:26-45` — `tempDir` / `git`
  / `initRepo` fixture-repo helpers for Unit 3's git-backed test.
- `packages/intentionsutil/test/spend.test.ts` — the pattern of testing a `src/`
  fold and its script-side renderer from one file on in-memory fixtures.

## Verification

Auto-runnable:

```verify
npx vitest run --project packages/intentionsutil --root . packages/intentionsutil/test/reprioritization.test.ts packages/intentionsutil/test/reprioritization-audit.test.ts packages/intentionsutil/test/node-lifecycle-dates.test.ts
```

The whole package suite must stay green — this is what proves Unit 1's
`isAiOwnedAt` extraction was behavior-preserving, since `sensors.test.ts`,
`lifecycle-sensor.test.ts`, `token-economy-sensor.test.ts` and `ledger-census.test.ts`
all cover the refactored call sites:

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
bash .claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app packages/intentionsutil
```

```verify
bash .claude/skills/dispatch-propagate/scripts/run-lint.sh --app packages/intentionsutil
```

End-to-end against the real store, reading the working tree's own ref so the check
does not depend on a freshly fetched `origin/main`. It must exit 0 and print both
labeled blocks; with no `priority_log` entries on main it prints the
`INSUFFICIENT DATA` verdict, which is the correct output, not a failure:

```verify
node --import tsx/esm packages/intentionsutil/scripts/reprioritization-audit.ts --days 7 --ref HEAD
```

The skill wiring must name the script and carry the section heading:

```verify
grep -q 'reprioritization-audit.ts' .claude/skills/rsi-audit/SKILL.md && grep -q '^## Reprioritization delta and outcome audit' .claude/skills/rsi-audit/SKILL.md
```

Manual / judgment checks:

- Run the default form, `npx tsx packages/intentionsutil/scripts/reprioritization-audit.ts
  --days 7`, and confirm it reads `origin/main` and prints the same two blocks. If
  `origin/main` is stale or unfetched it must fail loudly with
  `listNodesAtRef`'s own message — confirm it does not silently print an empty
  population.
- **Seeded join check.** In a scratch clone (never on `main`), add a
  `priority_log` entry dated inside the window to an `owner: ai` tactic that has
  since reached `phase: done`, commit it, and confirm the node moves from the
  baseline cohort to the front-loaded cohort and that its reported interval is
  creation → phase-done, *not* boost → phase-done. This is the check that the
  2026-08-29 ruling was implemented as ruled.
- **Delta window check.** Confirm the delta lists only entries dated inside the
  window, not the whole log — seed two entries on one node, one inside and one
  outside, and confirm exactly one row appears.
- **Adversarial-direction check.** Confirm from the Unit 2 tests, and by reading
  the rendered text, that an `ABOVE baseline` verdict is reachable and is phrased
  as a finding ("the delegated reordering is not earning its authority in this
  window"), not softened into a null result. A section that can only ever report
  favourably or "insufficient data" has not been built.
- **Reachability.** The audit's output must be reachable from **`/rsi-audit`** —
  not `/rsi`, which is the per-phase evaluation skill that lands ledger findings
  through `dispatch-eval-finding` and is not the report surface. If a human has to
  compute the median themselves after reading the report, the sensor is not built.
  Confirm by reading Step 7's bullet list and following it to the new section.
- Confirm no unit wrote a node file, an `attention` block, a `priority_log` entry,
  or a `success_signal.reading` — `git status` should show only the four source
  files, the three test files, and `SKILL.md`.

