---
id: tactic-scope-inert-restamp-primitive
kind: tactic
statement: "Scope-inert re-stamp primitive: a sanctioned script plus align-skill
  step letting an author-present align round re-stamp a tactic's worktree-local
  scope-custody stamp after a classified scope-inert body edit"
owner: ai
status: codified
parent: null
rationale: "Surfaced in the 2026-07-18 /align-strategy interview on the false
  demotion of tactic-graph-selector-reviewed-exclusion (PR #2888): a
  doctrine-mandated scope-inert reconciliation note tripped
  tacticScopeFingerprint and demoted a fully-reviewed node review -> implement,
  discarding qa and review custody. The scope-inert-restamp clarification on
  strategy-graph-native-dispatch (2026-07-18) is the authoritative doctrine;
  this carrier implements its sanctioned re-stamp mechanism."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 62
  override: null
  rationale: "Boosted to top ranking by author direction (2026-07-18
    /align-strategy round on the redundant qa-fix re-run of
    tactic-review-phase-trust-builtin-review): this draft is the tracker of
    record for the false scope-drift demotion class that cycled that node review
    -> implement -> qa on a byte-identical diff. Sized against the composed
    selector rank (childless, empty blocked_by: rank = boost + 5.33; current max
    66.33 on tactic-align-skills-latest-graph-guard and
    tactic-freeze-resurface-stale-children-only), so boost 62 gives 67.33 -
    strictly top of the selector frontier, verified via select-targets. The
    boost flows nowhere else (no blocked_by, no children)."
phase: review
execution:
  branch: tactic-scope-inert-restamp-primitive
  pr: 2902
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Scope-inert re-stamp primitive: a sanctioned script plus align-skill step letting an author-present align round re-stamp a tactic's worktree-local scope-custody stamp after a classified scope-inert body edit

Planned 2026-07-18 /align-tactics per-node finalize. Authoritative doctrine:
the scope-inert-restamp clarification on `strategy-graph-native-dispatch`
(`intentions/strategy-graph-native-dispatch.md:1967-2007`), which closes a
seam in the chain-of-custody clarification's "only author and re-evaluation
edits able to demote" clause
(`intentions/strategy-graph-native-dispatch.md:838-905` — the range covers
clarification 39 in full, including its 2026-07-18 scoping amendment at
lines 900-905, which is the actual narrowing this tactic implements).

## Context

The chain-of-custody gate demotes an in-flight tactic to `implement`
whenever its worktree-local `.scope-fingerprint` stamp no longer matches
its current `tacticScopeFingerprint(statement, body)` — by design, so a
material scope edit forces a fresh implement→qa→review chain. But an
**author-present align round** editing a tactic's body to record a
reconciliation note or classification (doctrine-mandated by clarification
38's amendment-completeness bar — the /align-strategy-side widening,
`strategy-graph-native-dispatch.md:823-837`, of the tactic-specific bar
clarification 32 names, `strategy-graph-native-dispatch.md:648+`; the two
are distinct, related clarifications, not the same one cited twice) is
itself a body edit, and today has no way to distinguish itself from a
material edit: it trips the same gate.

This already happened concretely: on 2026-07-18 an align round's
scope-inert Interim-mechanism note on `tactic-graph-selector-reviewed-exclusion`
demoted a fully-reviewed node (PR #2888, green CI) from `review` back to
`implement`, discarding its qa and review custody — a tax of three
redundant phase sessions (re-run implement, qa, review) for an edit that
changed no plan substance. Because clarification 38's annotations are
doctrine-mandated, this tax recurs structurally every time an align round
touches an in-flight tactic's body, not just once. See "Second observed
incident" below for a distinct machinery-append variant of the same defect
class (already fixed on `main`, tracked separately).

The 2026-07-18 scope-inert-restamp clarification closes this gap: an
author-present align round that classifies its own tactic-body edit as
scope-inert re-stamps the worktree-local stamp file to the post-edit
fingerprint + current `origin/main` sha, in the same round, recording the
classification in the round's record. The stamp stays worktree-local
(never moves into the node), mirroring the transition writer's existing
machinery refresh — which this tactic does not touch. Classification is
fail-closed: only a confident scope-inert verdict re-stamps; any doubt
leaves the stamp untouched and custody demotes as recorded today.

This tactic builds the sanctioned re-stamp script and wires one step into
each of `/align-strategy` and `/align-tactics` so the bootstrap by-hand
recipe below becomes a real, reusable primitive.

## Unit 1 — `restamp-scope-fingerprint.ts` (the sanctioned re-stamp script)

**Scope.** New file `packages/intentionsutil/scripts/restamp-scope-fingerprint.ts`.
It performs exactly the recompute-and-write recipe already inline in
`transition-node`'s `refresh_stamp()`
(`.claude/skills/dispatch-propagate/scripts/transition-node:85-98`), as a
standalone, testable, `npx tsx`-invokable primitive an align round can call
after it has classified its own tactic-body edit as scope-inert.

Design decisions (make these explicit in the script's header comment):

- **Language/location: TypeScript under `packages/intentionsutil/scripts/`,
  not bash under `.claude/skills/dispatch-propagate/scripts/`.** The
  operation is a pure compute-plus-single-file-write with no
  `gh`/`graph-commit`/PR involvement — it matches the shape of
  `compute-freshness.ts` (`packages/intentionsutil/scripts/compute-freshness.ts`)
  and `dump-node.ts` (`packages/intentionsutil/scripts/dump-node.ts`) far
  more than it matches `transition-node`'s orchestration role (CI sensor,
  freshness gate, `graph-commit`, auto-merge arming). It also lets the
  script import `readNode`/`readNodeBody`/`tacticScopeFingerprint` directly
  instead of shelling out through `node --import tsx/esm -e '...'`
  one-liners the way `refresh_stamp()` must from bash.
- **Do not extract a shared helper that `transition-node`'s
  `refresh_stamp()` also calls.** Two independent implementations of the
  ~10-line recompute-and-write recipe, not one shared abstraction, because
  the two callers have genuinely different failure semantics:
  `refresh_stamp()` is a best-effort background refresh that fails **open**
  (every step in it is `|| return 0`, silently skipped) because a later
  missing-stamp check elsewhere covers for it (`transition-node:159-164`).
  The new script is invoked only after a human-present classification
  decision and IS the re-stamp — it must fail **loud** (nonzero exit, clear
  stderr) so a write failure is visible to the align round and its record,
  not silently absorbed. Forcing a shared helper across these two
  failure-mode contracts would need two wrapping layers anyway, at which
  point sharing buys nothing. This unit must not modify `transition-node`
  or its `refresh_stamp()` in any way — it keeps working exactly as today
  (per the doctrine: "mirroring the transition writer's machinery refresh,
  which stands unchanged").
- **`MAIN_ROOT` resolution.** Replicate `resolve_project_root`'s exact git
  plumbing (`.claude/skills/dispatch-propagate/scripts/lib.sh:1731-1735`:
  `git rev-parse --path-format=absolute --git-common-dir`, then `dirname`
  of that) via
  `execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], ...)`
  — never resolve the stamp path from `cwd` or from `import.meta.url`'s
  repo root, since an align round may run from a nested PR-branch worktree
  (same rationale `transition-node:47-51` documents for why `MAIN_ROOT`
  differs from `REPO_ROOT`).
- **Exported core function, CLI wrapper, main-guard** — match
  `dump-node.ts`'s shape exactly (`packages/intentionsutil/scripts/dump-node.ts:52-73`
  core function taking explicit paths as parameters for testability; `:96`
  main-guard
  `if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)`).

Proposed signature:

```ts
export function restampScope(intentionsDir: string, repoRoot: string, mainRoot: string, id: string): { fingerprint: string; sha: string }
```

- Reads `readNode(intentionsDir, id).statement` and
  `readNodeBody(intentionsDir, id)`, computes
  `fingerprint = tacticScopeFingerprint(statement, body)`.
- Computes `sha` via `execFileSync("git", ["rev-parse", "origin/main"], { cwd: repoRoot })`.
- Writes `<mainRoot>/.claude/worktrees/<id>.scope-fingerprint` with content
  `` `${fingerprint} ${sha}\n` `` (`mkdirSync(dirname(stampPath), { recursive: true })`
  first — the directory may not exist yet, matching `refresh_stamp()`'s
  `mkdir -p`).
- Throws (does not swallow) on any failure — no `|| return 0` fail-open
  behavior. The CLI wrapper's main-guard catch prints to stderr and
  `process.exit(1)` — the try/catch-around-`main()`, stderr-then-exit shape
  follows `list-scope-stale-tactics.ts:84-91`, but this script exits `1`
  rather than that file's `2`, matching `dump-node.ts:82-89`'s exit code
  instead (the closer sibling template for this script's overall shape).

CLI: `npx tsx packages/intentionsutil/scripts/restamp-scope-fingerprint.ts <tactic-id>`
— repoRoot/intentionsDir resolved from `import.meta.url` (never cwd,
matching `dump-node.ts:29-34`), `mainRoot` resolved via the git-common-dir
recipe above, both overridable via `--repo-root <dir>` / `--main-root <dir>`
flags so tests can inject temp dirs without touching the real
`.claude/worktrees/`. Print the written `<fingerprint> <sha>` line to
stdout on success (useful for the align round's record).

**Unit test required** (not just the shell end-to-end verify blocks
below): add `packages/intentionsutil/test/restamp-scope-fingerprint.test.ts`
exercising the exported `restampScope(intentionsDir, repoRoot, mainRoot, id)`
directly, following `write-node.test.ts`'s pattern
(`packages/intentionsutil/test/write-node.test.ts:1-10` — `mkdtempSync`
for a scratch `intentionsDir`/`mainRoot`, import the core function from
`../scripts/restamp-scope-fingerprint.js`). Since `restampScope` shells out
to `git rev-parse origin/main`, pass this repo's own root as `repoRoot` in
the test (a real git checkout with an `origin/main` — no fixture repo
needed) while keeping `intentionsDir` and `mainRoot` scratch temp dirs;
write a fixture node into the scratch `intentionsDir` via `writeNode`
first. Assert: the stamp file is created at
`<mainRoot>/.claude/worktrees/<id>.scope-fingerprint`; its content is
exactly `<fingerprint> <sha>\n`; `fingerprint` equals
`tacticScopeFingerprint(statement, body)` computed independently in the
test from the same fixture; and calling `restampScope` with a nonexistent
node id throws.

**Explicitly out of scope:** no `graph-commit` call, no node
frontmatter/body write, no classification logic (the align round decides
scope-inert vs. material; this script only performs the mechanical
re-stamp once told to). No change to `compute-freshness.ts`,
`transitions.ts`, `router.ts`, or `transition-node`.

**Recommended model:** sonnet. This is rote mechanical work — port an
already-existing, fully-specified 10-line bash recipe
(`transition-node:85-98`) into TypeScript against an established
sibling-script template (`dump-node.ts`), with no open design questions
(the git-common-dir recipe, the stamp format, and the fail-loud contract
are all fully specified above).

## Unit 2 — `/align-strategy` SKILL.md step

**Scope.** `.claude/skills/align-strategy/SKILL.md`, inside
`## Step 5 — Record` (heading at `SKILL.md:408`). Insert a new subsection
after the `graph-commit` block (ends around `SKILL.md:461`) and before the
"If `graph-commit` exits 1 having printed a parking message..." paragraph
(`SKILL.md:472-475`) — i.e. land it as its own clearly-scoped
paragraph/step between the landing mechanics and the
materiality-scoped-freeze section that already follows at `SKILL.md:477`.

New content (adapt wording to fit the file's voice; substance must
include):

- Trigger: this round's edit touched the **body** (not just frontmatter)
  of an **in-flight** tactic (`phase` set, not `draft`/`done`) — including
  a reconciliation note, a drift-review correction, or any other body edit
  clarification 38's amendment-completeness bar produced.
- Classification: the session classifies its own edit as **scope-inert**
  (the plan's substance is unchanged — e.g. a provenance/reconciliation
  annotation) or **material/unsure**. Fail-closed: only a confident
  scope-inert verdict re-stamps; on any doubt, do nothing further here —
  leave the stamp untouched and let custody demote as recorded today (this
  is not a failure, it is the existing correct behavior).
- Mechanism (scope-inert only): after the edit has landed via
  `graph-commit` in this same round, run:
  ```bash
  npx tsx packages/intentionsutil/scripts/restamp-scope-fingerprint.ts <tactic-id>
  ```
  for each such tactic. Note in prose that this must run **after** the
  body edit is on `origin/main` (post-`graph-commit`), since the script
  reads the current node body via `readNode`/`readNodeBody` and the sha
  via `git rev-parse origin/main`.
- Recording: note the classification (scope-inert, and which tactic ids)
  in the round's own record/summary — this is the audit trail the
  doctrine requires ("recording the classification in the round's
  record").
- Explicitly state the scope: this re-stamps only the worktree-local
  `.scope-fingerprint` file, never a node write, never a graph-commit of
  its own.

**Explicitly out of scope:** no change to Step 5's existing
`write-node.ts`/`dump-node.ts`/`graph-commit` mechanics, no change to the
materiality-scoped-freeze section (`SKILL.md:477+`), no change to any
other step in the file.

**Recommended model:** opus. This is prose surgery inside a live,
heavily-cross-referenced procedural doctrine document
(`ref-write-instructions` governs SKILL.md edits) where getting the
fail-closed framing unambiguous, correctly sequenced relative to
`graph-commit`, and non-duplicative of the adjacent
materiality-scoped-freeze section requires judgment, not mechanical
substitution.

**Dependencies:** Unit 1 (the script must exist before the step can
reference a real invocation).

## Unit 3 — `/align-tactics` SKILL.md step

**Scope.** `.claude/skills/align-tactics/SKILL.md`. Two insertion points
to choose between (pick whichever reads more naturally in full file
context; both are legitimate, do not do both):

- **(a)** Within `## Step 5 — Record`'s per-tactic numbered list
  (`SKILL.md:480-536`), as new item 4 after item 3 "Land via
  `graph-commit`" (`SKILL.md:510-536`) — covers the ordinary
  finalize-a-tactic path where this round's own body edit (finalizing a
  draft's plan body, or amending an open tactic per clarification 32) may
  trip the gate on a tactic this same round just handled.
- **(b)** Within `## Re-evaluation mode` (heading `SKILL.md:588`), as a
  new item alongside item 3's existing `execution.strategy_fingerprint`
  re-stamp (`SKILL.md:615-624`) — covers the re-evaluation path where
  step 2's "amends, prunes, or confirms each open tactic" (`SKILL.md:601-614`)
  is exactly the body-edit case this primitive targets.

**(b)** is the higher-value site: re-evaluation mode is precisely where
clarification 32's amendment-completeness bar forces a body edit on an
already in-flight (non-draft) tactic, which is the scenario that demoted
`tactic-graph-selector-reviewed-exclusion`. Item (a)'s Step 5 per-tactic
path mostly concerns brand-new or draft-finalized tactics that haven't yet
advanced past `implement`/have no meaningful stamp to protect — lower
urgency but still worth covering if it reads naturally alongside (b).
Implement at (b) as the primary site, with a short pointer from (a) if the
file's structure makes that natural — final call is implementation-time
judgment against the full file.

Content must include the same four elements as Unit 2 (trigger,
fail-closed classification, mechanism via `restamp-scope-fingerprint.ts`,
recording in the round's record), phrased to fit `/align-tactics`'
existing structure. Explicitly distinguish this new stamp from the
**unrelated** existing re-stamp logic already in this file —
`execution.strategy_fingerprint` (node frontmatter, per-strategy map,
re-stamped via `strategyFingerprint` at `SKILL.md:615-624` and
`SKILL.md:560-582`) is a different mechanism protecting against a
different staleness (strategy-substance drift), not the worktree-local
`.scope-fingerprint` file this tactic addresses — do not conflate or merge
the two in the prose.

**Explicitly out of scope:** no change to the
`execution.strategy_fingerprint` re-stamp logic (items 3 at
`SKILL.md:615-624`, or the "Fingerprint honesty" section at
`SKILL.md:560-582`) — that stamp and its mechanism are unrelated and
untouched. No change to `## Step 4 — Park non-claude-eligible tactics` or
any other section.

**Recommended model:** opus. Same reasoning as Unit 2 — plus the added
judgment call of picking the right insertion site (a vs. b vs. both)
inside a longer, denser file with an existing, easily-confusable sibling
re-stamp mechanism that must not be conflated with the new one.

**Dependencies:** Unit 1.

## Reuse

- `tacticScopeFingerprint(statement, body)` —
  `packages/intentionsutil/src/router.ts:118` (doc comment `:101-117`).
  The only sanctioned way to compute the scope fingerprint; never
  hand-compute.
- `ScopeStamp` interface — `packages/intentionsutil/src/transitions.ts:337`;
  `parseScopeStamp` — `:349`; `isScopeStale` — `:361`. Not called directly
  by the new script (it only writes the stamp), but the format it must
  produce (`<fingerprint> <sha>` on one line, exactly two
  whitespace-separated parts) is defined by `parseScopeStamp`'s parsing
  contract — match it exactly.
- `readNode` / `readNodeBody` — `packages/intentionsutil/src/store.ts:101` /
  `:114` (both call `assertPathSafeId`, `:26`).
- `resolve_project_root` — `.claude/skills/dispatch-propagate/scripts/lib.sh:1731-1735`.
  Replicate its exact git plumbing in TS (see Unit 1); do not call the bash
  function from a TS script.
- `refresh_stamp()` — `.claude/skills/dispatch-propagate/scripts/transition-node:85-98`.
  The recipe this unit ports; read but do not modify.
- `dump-node.ts` — `packages/intentionsutil/scripts/dump-node.ts`. The
  structural template for the new script: exported core function taking
  explicit paths, hand-rolled flag parsing, `--help`/`-h`,
  `process.stderr.write` + `process.exit(1)` on error, main-guard at `:96`.
- `list-scope-stale-tactics.ts` —
  `packages/intentionsutil/scripts/list-scope-stale-tactics.ts:84-91`.
  Template for the fail-loud CLI error-handling wrapper shape (catch,
  stderr, `process.exit`) — note it exits `2`; this script follows
  `dump-node.ts`'s exit `1` instead (see Unit 1).
- `compute-freshness.ts` — `packages/intentionsutil/scripts/compute-freshness.ts`.
  Sibling example of a pure-computation script taking explicit
  `--snapshot`/`--stamp` flags rather than hardcoding paths — same spirit
  as this script's `--repo-root`/`--main-root` overrides.

## Verification

```verify
cd packages/intentionsutil && npx tsc --noEmit
```

```verify
cd packages/intentionsutil && npx vitest run test/transitions.test.ts test/router.test.ts test/scope-sweep.test.ts test/restamp-scope-fingerprint.test.ts
```

```verify
# Exercise the new script end-to-end against a real tactic in this repo,
# writing to a scratch main-root so the real .claude/worktrees/ stamp is untouched.
SCRATCH=$(mktemp -d)
mkdir -p "$SCRATCH/.claude/worktrees"
npx tsx packages/intentionsutil/scripts/restamp-scope-fingerprint.ts \
  --main-root "$SCRATCH" tactic-scope-inert-restamp-primitive
cat "$SCRATCH/.claude/worktrees/tactic-scope-inert-restamp-primitive.scope-fingerprint"
# Expect one line: "<64-hex-char fingerprint> <40-char sha>" — confirm the
# fingerprint matches tacticScopeFingerprint(statement, body) computed
# independently via a one-off `node --import tsx/esm -e` call against the
# same node, and the sha matches `git rev-parse origin/main`.
rm -rf "$SCRATCH"
```

```verify
# Confirm restamp-scope-fingerprint.ts fails loud (nonzero exit, stderr message)
# on a nonexistent node id, unlike transition-node's silent refresh_stamp().
npx tsx packages/intentionsutil/scripts/restamp-scope-fingerprint.ts \
  --main-root "$(mktemp -d)" tactic-does-not-exist-xyz; echo "exit: $?"
# Expect a nonzero exit and a stderr error message, not silent success.
```

Manual / prose verification (judgment, not automatable):

- Read the new Step-5 paragraph in `.claude/skills/align-strategy/SKILL.md`
  in full file context: confirm the fail-closed framing ("only a confident
  scope-inert verdict re-stamps; any doubt leaves the stamp untouched") is
  unambiguous to a fresh session with no other context, and that it does
  not read as contradicting or duplicating the adjacent
  materiality-scoped-freeze section (`SKILL.md:477+`), which is a
  related-but-distinct mechanism (per-strategy `execution.strategy_fingerprint`
  freeze, not the worktree-local `.scope-fingerprint`).
- Read the new step in `.claude/skills/align-tactics/SKILL.md` in full
  file context: confirm it is clearly distinguished from the existing,
  adjacent `execution.strategy_fingerprint` re-stamp logic (items at
  `SKILL.md:560-582`, `:615-624`) so a fresh session cannot conflate the
  two stamps or run the wrong one.
- Confirm neither inserted step invents mechanism beyond the governing
  doctrine quoted in `intentions/strategy-graph-native-dispatch.md:1967-2007`
  (no new classification heuristic, no new bucket beyond
  scope-inert/material-or-unsure).
- Re-run the incident scenario by hand once against a disposable
  branch/worktree if practical: reproduce a body-only edit to an in-flight
  tactic, confirm `compute-freshness.ts` reports `scopeStale: true` before
  the re-stamp and `scopeStale: false` after, using the same invocation
  `transition-node` uses
  (`packages/intentionsutil/scripts/compute-freshness.ts <id> --snapshot <dir> --stamp <stamp-file>`,
  per `compute-freshness.ts:22-24`).

## Second observed incident (2026-07-18, machinery-append variant)

Recorded by the 2026-07-18 /align-strategy round answering "why did dispatch
launch qa-fix when qa was already complete?" on
`tactic-review-phase-trust-builtin-review` (PR #2887):

- 13:30 EDT `d99f84fe` — phase start; scope-custody stamp taken at this sha.
- 13:51 EDT `5be80194` — `transition-node` advanced qa -> review and appended
  the `## needs-main residue` section (a machinery body append). Its
  `refresh_stamp()` ran under the pre-#2882 wrong-root stamp bug, so the
  main-root stamp stayed at `d99f84fe`.
- 16:12 EDT — PR #2882 (`tactic-graph-node-lane-write-hardening`) merged the
  `MAIN_ROOT` stamp-path fix.
- 16:51 EDT `3a72e369` — a transition read the (still-stale) main-root stamp,
  saw `5be80194` as absorbed scope drift, and falsely demoted the node
  review -> implement, discarding qa and review custody.
- 18:35 EDT `72408785` — re-transitioned to qa; a full qa-fix pass then re-ran
  on a byte-identical diff.

Distinct trigger, same defect class as the rationale's PR #2888 incident: a
scope-inert body append (there an align note, here the machinery's own residue
append) trips `tacticScopeFingerprint` and demotes a completed ladder. The
machinery variant's root cause is fixed on main by PR #2882; its regression
protection is tracked by `tactic-transition-node-scope-stale-test-coverage`.
This primitive remains the fix for the align-round variant and the sanctioned
recovery path (re-stamp instead of re-implementing) for any future false
demotion. Cost of this incident: three redundant phase sessions.
