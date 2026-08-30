---
id: tactic-mainqa-record-time-routing
kind: tactic
statement: "Post-merge verification tests are sorted to their terminal queue at
  qa record time: /qa-fix writes standalone tactic-mainqa-* nodes grouped by
  destination instead of a source-body residue section, and the source goes
  review -> done"
owner: ai
status: codified
parent: null
rationale: Byproduct of the 2026-07-28 /align-strategy interview that recorded
  the record-time main-qa routing requirement. The routing unit today is the
  source tactic, which has exactly one destination, so the record-time triage
  that needs-main-followups.md already mandates cannot actually be expressed.
  This tactic carries the implementation of the greenfield design recorded in
  that clarification.
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: pr5a-mainqa-record-time-routing
  pr: 3140
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-30T02:52:45Z
    mergeCommitSha: 77bd747136fcdb3238792dfa43224523ee15c348
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by:
  - tactic-wait-calendar-release
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Post-merge verification tests are sorted to their terminal queue at qa record time: /qa-fix writes standalone tactic-mainqa-* nodes grouped by destination instead of a source-body residue section, and the source goes review -> done

## Context

**The problem.** A post-merge (main-qa) verification test discovered by the qa
phase must be sorted to its terminal queue *at record time* — the dispatch queue
when a machine can settle it, the office-hours queue when only the author can.
`.claude/skills/qa-fix/references/needs-main-followups.md` already mandates that
triage ("verifiability is triaged here at record time"), but the machinery cannot
express it, because **the routing unit is the source tactic and a source tactic
has exactly one destination**. `/qa-fix` Step 3.6's node lane appends a
`## needs-main residue` section to the source's *own* body
(`.claude/skills/qa-fix/SKILL.md:358-379`), the source advances `qa → review`, and
the residue drains later through the `review → main-qa` edge. Consequences:

- Mixed residue cannot be split — one node, one destination.
- An author-required item cannot be parked at qa time without parking the very
  source whose merge its observation depends on.
- Every main-qa item boots a `/qa-main` worker *first* and discovers only then
  that a human is needed. Live cost: `tactic-execution-pr-merge-verification`
  residue item 12 booted `/qa-main`, which concluded "not browser-verifiable — its
  `url_path` names a repo script, not a web page", parked 2026-07-28, and was
  drained by human override.

**The outcome.** The sorting unit becomes the routing unit. At qa record time
`/qa-fix` mints **standalone `tactic-mainqa-*` nodes grouped by destination — at
most two per source** — instead of a residue body section, and the source goes
`review → done` with no `main-qa` stop.

**Verified current state** (measured at `origin/main` in this worktree,
`f8bea654`, 2026-08-19 — re-verify before executing; every figure below drifts):

- `/qa-fix` Step 3.6's node lane still appends `## needs-main residue` and still
  advances `qa → review` unchanged. The problem is real and unfixed.
- 63 nodes carry a `## needs-main` H2; by phase: 38 `done`, **20 `main-qa`**, 4
  `implement`, 1 `review`, 0 `qa`, 0 `null`. The 20 at `main-qa` are the drain
  tail. Measured 2026-08-30 at `b76ce953`, after Unit 7's migration landed.
  The earlier reading here — 76 / 37 `done` / **28 `main-qa`** / 5 / 3 / 1 / 2 —
  was taken before that landing; Unit 7 emptied 14 of those sections, which is
  the whole of the difference.
- `Verifiability: WAIT` marks: **52 occurrences across 28 files** at `74c281dc`,
  and **none are live** — Unit 7's migration has landed. The 52 partition
  exactly: **22 marks on the 15 new `tactic-mainqa-*-machine` nodes** (all
  `phase: main-qa`), carried under `## Verification items`, which is the
  migrated shape and is why the Unit 7 fence — keyed on `^## needs-main` — no
  longer matches them; **17 marks on 9 `done` nodes** (historical); and **13
  marks on 4 non-`done` files that only mention the string**:
  `strategy-graph-native-dispatch.md` (6, inside clarification text), this node
  itself (5), `tactic-observation-ladder-terminus-baseline-drift.md` (1) and
  `tactic-office-hours-select-fresh-main.md` (1) — the last two inside an
  `office_hours` park reason, not a residue bullet. Immediately before the
  migration, at `74c281dc^`, the live set was **22 marks across 15 nodes** (14
  at `phase: main-qa`, 1 at `qa`). Ruling 3 said to re-measure; this is that
  measurement.
- `arm-wait` / `release-wait` do **not** exist in code. They are
  `tactic-wait-calendar-release`'s surface (PR #3051, open, CI-red).

### Binding author rulings (2026-08-19, park cleared, landed `5f8dbc0a`)

These are **binding**. A later round that disagrees parks rather than overrides.

- **R1 — WAIT is a hold on the machine-verifiable node, not a third
  destination.** The at-most-two-nodes-per-source cap stands unamended and
  `owner` stays the sort mark. A WAIT-classed item lands on the `owner: ai`
  node, and that node carries `blocked_by: [tactic-wait-<id>]` pointing at the
  hold `arm-wait` mints (`intentions/tactic-wait-calendar-release.md:160-200` —
  `attributes.wait_for` names the source, `source.blocked_by` names the WAIT;
  under the new routing the "source" *is* the `owner: ai` destination node). A
  genuine third destination node is **rejected**.
- **R2 — this node blocks on `tactic-wait-calendar-release`.** The edge is
  written by the caller **in the same commit as the finalize**, never before it
  (`/align-tactics`' Step-0 gate `frozenTacticSelectable` exits 12 on incomplete
  blockers, so carrying the edge early makes this node unplannable).
- **R3 — the live `Verifiability: WAIT` marks migrate in this PR**, rewritten
  into the standalone-node shape rather than draining in place. The Migration
  rule "no bulk rewrite" applies only to residue-carrying nodes' *phase drain*,
  not to these marks.
- **R4 — scope is the writer plus the reader, landing together.** The old
  indicative Units 3, 4 and 5 are named out-of-scope follow-ups. **This node does
  not split** — a split would contradict the writer and reader landing together.
- **R5 — record-time minting is correct; the "already-merged" prose was the
  error.** *(Ruled 2026-08-29, author batch-execution sitting; recorded in
  `plans/dispatch-rsi-author-rulings.md` §"Ruling 6".)* The question was whether
  the destination node is born carrying the source's **already-merged** PR, as an
  earlier plan sentence said, or its **still-open** one, as the shipped code does
  — `/qa-fix` mints at Step 3.6 inside phase `qa`, **before** Step 4 advances
  `qa → review`. **Ratify what ships.** Record-time triage is this tactic's own
  thesis — the thing it exists to make possible — so the prose is the error, not
  the code. The follow-up prose correction is **landed** (re-verified
  2026-08-30): PR #3142 (`plan-reconciliation`, carrying commit `cba77286`)
  merged 2026-08-30T06:53:02Z as `35ab0e45`, and its sibling PR #3141 merged
  2026-08-30T06:30:48Z. The stale wording no longer survives at `origin/main`:
  an `LC_ALL=C grep -ain 'already.merged'` over this node now hits only this R5
  paragraph's own quotations of it — the sentence that stood at `:207-208`, "born
  at `main-qa` carrying the source's already-merged PR", is gone — and over
  `packages/intentionsutil/scripts/mint-mainqa-nodes` it returns **0 hits**. That
  script's `--pr` doc line has moved to `:64` and now reads "the source's PR
  number — STILL OPEN at mint time, since the mint runs at qa record time, not
  at merge time". The earlier "already landed, zero hits" reading of that script
  was a case-sensitivity false negative against a then-upper-case
  `ALREADY-MERGED`; the wording has since been replaced outright, so the zero is
  now genuine.
  **The ruling stands regardless** — it settles which of the two readings is
  correct — and the prose corrections are owed wherever the stale wording survives
  at `origin/main`. **Do not re-open the mint-time question**; a later round that
  disagrees parks rather than overrides.

The units below are an implementation decomposition of R4's in-scope work (one
PR). They are **not** a re-scoping: Units 1–7 all serve "the `/qa-fix` writer and
the `/qa-main` reader land together". Old Units 3/4/5 stay out (see
**Out of scope**).

**Checked and rejected: folding #3051 into PR2 of the RSI serialized PR plan.** The
author asked whether `tactic-wait-calendar-release` (PR #3051) could be folded into
PR2 as described in `plans/dispatch-rsi-serialized-pr-plan.md`. It cannot. PR2 is
the ladder driver (`dispatch-ladder-{advance,await,run,status,spawn}` plus the
`terminus.ts` census, 7 nodes); #3051 touches `waits.ts`, `wait-sweep.ts`,
validate-graph Rule 22, the `router.ts` draft-candidate exclusion,
`arm-wait`/`release-wait`, `lib-wait-recheck.sh` and `dispatch-tick` — no file
overlap. #3051 is already code-complete and carries `planned` / `qa-done` /
`reviewed` markers with only CI red (`dispatch:fix-checks-attempt-1`), so folding it
into an unstarted bundle would discard a finished review and **delay** the machinery
Ruling 2 depends on. PR2's remainder also sits in Bundle 3 (COLD, position 6 of 10),
whereas a `wait_until` tick sweep belongs topically to Bundle 2. The plan's single
mention of this node's sibling (line 924) is a *rejection* — `wait_until` does not
fit `tactic-pause-disables-merge-lane`'s episode wait. No edit was made to that plan
file. One line in it is now stale and is a known residual: its line 898 calls this
node "itself raw and unplanned".

**Update 2026-08-20 — #3051 merged (`38934c61`); this node is unblocked.** The
"CI red" and `blocked_by` state described above was true when the ruling was
made and is retained as the record of it. Two corrections to the surface list:
the WAIT-node check landed as **validate-graph Rule 22**, not 21 — main had
retired Rule 20 and claimed 21 for `attributes.measured_impact` before #3051
merged, so the branch's rule was renumbered on the way in (the paragraph above
has been corrected in place). And the merge also made `--dir` required on
`write-node.ts` / `dump-node.ts`, which `arm-wait` / `release-wait` now pass.
The fold ruling itself is unchanged: no file overlap with PR2, so it stood.

### Target design

One node per (source, destination) group, at most two per source PR:

| field | machine-verifiable group | author-required group |
|---|---|---|
| `id` | `tactic-mainqa-<source-slug>-machine` | `tactic-mainqa-<source-slug>-author` |
| `kind` | `tactic` | `tactic` |
| `phase` | `main-qa` | `main-qa` |
| `owner` | `ai` | `human` |
| `status` | `codified` | `delegated` |
| `office_hours` | `null` | `{reason, since, recommendation, session_type: "other"}` |
| `serves` | copied verbatim from the source | copied verbatim from the source |
| `parent` | `null` | `null` |
| `blocked_by` | `[<source-id>]` | `[<source-id>]` |
| `execution` | `{branch: <source branch>, pr: <source PR>, attempts: {}, markers: [], strategy_fingerprint: null}` | same |
| queue | dispatch (`/qa-main`) | office-hours only |

`<source-slug>` is the source id with a leading `tactic-` stripped — the same
derivation `tactic-wait-calendar-release` uses for `tactic-wait-<slug>`. Either
group is omitted when its item list is empty. The source tactic then goes
`review → done` directly.

**Why this works with existing machinery — each re-verified at `f8bea654`:**

- Selector tactic eligibility skips any node with `office_hours !== null`
  (`packages/intentionsutil/src/router.ts:403`, also `:445`, `:475`), so the
  author-lane node is never selectable — it appears only on the office-hours
  panel. No new selector code.
- `officeHoursQueue` admits every non-null-`office_hours` node
  (`packages/intentionsutil/src/officeHours.ts:83`, also `:190`), so the
  author-lane node reaches the human queue by construction.
- `blockersComplete` (`packages/intentionsutil/src/router.ts:239`) returns false
  for any blocker whose phase is not `done`, so a destination node is held until
  its source merges and reconciles to `done`.
- `inboundBlockers` (`packages/intentionsutil/src/transitions.ts:407`) strips
  inbound `blocked_by` in the same commit that prunes a `done` source, and
  absence reads as completion — so the edge self-clears.
- `dispatch-graph-execute:189` already routes `tactic:main-qa` to `/qa-main`, and
  `graph-select-target`'s `main-qa` sensor arm
  (`.claude/skills/dispatch-propagate/scripts/graph-select-target:1143-1153`)
  gates purely on the source PR's `mergedAt`. Both work unchanged given
  `execution.pr`.
- `main-qa` **is** in the schema enum (`packages/intentionsutil/src/schema.ts:59`
  `PHASES`), so `write-node.ts` accepts it.
- `provision-node-worktree` cuts a worktree on a branch named `<node-id>` from
  `origin/main` when no remote branch exists, and its CI-ready gate reports
  ready when no PR matches that branch — so a freshly minted destination node
  provisions cleanly with no PR of its own.

**Two corrections to the older draft of this design, carried forward:**

1. The migrated `tactic-mainqa-*` nodes (`tactic-mainqa-gcp-cost-alerts`,
   `tactic-mainqa-ds-storybook-visual`) exemplify the `owner` / `office_hours` /
   `phase` half only — both carry `execution: null` and `blocked_by: []`. The
   `execution.pr`-carrying, source-linked half is genuinely **new** work.
2. `tactic-main-qa-phase`, named by
   `.claude/skills/qa-fix/references/needs-main-followups.md:32` as owning
   verification, has been **pruned** from `intentions/`. That prose is stale and
   is corrected in Unit 5.

### The hazard this plan closes (not recorded in any prior round)

`reconcile-graph.ts` treats `main-qa` as an **open** phase
(`packages/intentionsutil/scripts/reconcile-graph.ts:139-141` `isOpen`, and the
mirrored `open` set at
`.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged:135`). Its
pass 1 enumerates every open tactic whose `execution.pr` is terminal on GitHub
and routes it through `reconcileMergedPhase(hasResidue)`
(`packages/intentionsutil/src/transitions.ts:361`).

A destination node is **born at `main-qa` at qa record time, carrying the
source's still-open PR** and, by design, carries **no** `## needs-main`
heading. So on the very next
tick the reconciler would classify it `hasResidue === false` → `done` and write
`phase: "done"` — destroying the verification node before `/qa-main` ever runs.
Today the residue heading is the only thing keeping a `main-qa` node alive
through that sweep; the new shape removes the heading, so the protection has to
become explicit. Unit 4 makes it so.

This is **not** old Unit 4's retirement of the `review → main-qa` edge (still out
of scope). It is a narrower, independently-correct rule: **a node at `main-qa`
has no merge of its own to absorb**, so the merged-reconcile sweep must not act
on it. Either the node arrived by the reconciler's own `main-qa` transition,
which already recorded the merge evidence, or it was minted directly at
`main-qa` at qa record time, in which case the merge in question is its
**source's** and is absorbed onto the source node, not this one. And the
destination node **carries no `## needs-main` heading by design** — it renders
`## Verification items` — so were the sweep to act on it, it would read
`hasResidue === false` and write `phase: "done"`, destroying the verification
node before `/qa-main` ever runs. Being at `main-qa`, not the residue heading,
is the protection.

Note the scope of this rule: it is about a **merge**. A source PR **closed
without merging** is a different event, it absorbs no merge, and the reconciler
handles it separately — see Unit 4's `isCloseAbsorbable`.

---

## Unit 1 — `src/mainqaRouting.ts`: the pure routing decision

**Scope.** New `packages/intentionsutil/src/mainqaRouting.ts` and
`packages/intentionsutil/test/mainqaRouting.test.ts`. Pure — no fs, no git, no
`gh`, no network. Modelled structurally on `packages/intentionsutil/src/holds.ts`
(vocabulary + deterministic id derivation) with the decide half following
`packages/intentionsutil/scripts/hold-node-decide.ts`.

Exports:

- `type MainqaLane = "machine" | "author"` and
  `const MAINQA_LANES: readonly MainqaLane[]`.
- `type VerifiabilityMark = "MACHINE" | "AUTHOR" | "WAIT"`.
- `interface MainqaItem { id: string; title: string; url_path: string;
  expected_outcome: string; finding: string; verifiability: VerifiabilityMark;
  check?: string | null }`.
- `mainqaNodeId(sourceId: string, lane: MainqaLane): string` — strips a single
  leading `tactic-` from `sourceId` and returns
  `tactic-mainqa-<slug>-<lane>`. Throws on an id containing `/` or `\` (mirror
  `assertPathSafeId`'s intent) and on an empty slug.
- `laneFor(mark: VerifiabilityMark): MainqaLane` — `AUTHOR → "author"`;
  `MACHINE` and `WAIT → "machine"`. **This is R1 in code**: WAIT is a hold on the
  machine node, never a third lane. An item arriving with no mark defaults to
  `MACHINE` (the default the reference already declares); the caller, not this
  module, applies that default.
- `groupByLane(items): Record<MainqaLane, MainqaItem[]>` — stable input order
  preserved within each lane.
- `buildMainqaNode(args): IntentionNodeInput` — frontmatter only, exactly the
  **Target design** table. `serves` is copied verbatim from the source's
  `serves`. `office_hours` is `null` on the machine lane; on the author lane it
  is `{reason, since, recommendation, session_type: "other"}` with **non-empty**
  `reason` and `recommendation` composed from the items (strategy condition 19 —
  a born-parked node carries at birth everything a fresh sitting needs). Throws
  if the author lane is built with an empty or whitespace-only reason or
  recommendation.
- `buildMainqaBody(args): string` — the node body (see the canonical shape
  below).
- `decideMint(args): { lane: MainqaLane; disposition: "CREATE" | "EXISTING";
  id: string; node: IntentionNodeInput; body: string }[]` — one entry per
  non-empty lane. `disposition` is `EXISTING` when the caller reports
  `intentions/<id>.md` already present at `origin/main` (idempotent re-run: the
  land half then skips the write). Lanes with no items produce no entry.

**Canonical destination-node body** produced by `buildMainqaBody` — this is the
contract Unit 6 reads:

```markdown
# <statement>

## Context

Post-merge verification recorded by `/qa-fix` at qa record time for
`<source-id>` (PR #<pr>). Verified against the deployed `main` for that PR,
not against a preview.

## Verification items

- **<id> — <title>**
  - Path: `<url_path>`
  - Expected outcome: <expected_outcome>
  - Finding: <finding>
  - Verifiability: MACHINE|AUTHOR|WAIT
  - Check: <check>            <!-- omitted when absent -->
```

The heading is **`## Verification items`**, deliberately *not* a `## needs-main…`
heading: `hasNeedsMainResidue`
(`packages/intentionsutil/src/transitions.ts:378`) matches only an H2 whose text
begins `needs-main`, and a destination node must never be confused with a
residue-carrying source by the reconciler or the transition writer.

The statement for each lane:
`Post-merge verification of <source-id> (PR #<pr>) — machine-verifiable items`
and `… — author-required items`.

Tests (`mainqaRouting.test.ts`) must cover: id derivation including a source id
without the `tactic-` prefix and a path-separator refusal; `laneFor` mapping WAIT
to `machine`; grouping preserving order; an all-machine source yielding exactly
one entry; an all-author source yielding exactly one entry; a mixed source
yielding exactly two and never three; the author node refusing an empty
recommendation; `serves` copied verbatim; body rendering with and without
`Check:`.

**Recommended model.** sonnet.

---

## Unit 2 — `mint-mainqa-nodes`: the landing half

**Scope.** Three new files plus one CI wiring edit:

- `packages/intentionsutil/scripts/mint-mainqa-nodes-decide.ts` — thin CLI over
  Unit 1 (`--dir <intentions-dir>` required, no default, per clarification
  194/242 as `write-node.ts:47-60` documents). Reads a JSON payload
  `{source_id, pr, items[]}` from stdin or `--file`, reads the source node with
  `readNode`, calls `decideMint`, and prints one JSON object per lane to stdout.
  No writes, no git, no `gh`.
- `packages/intentionsutil/scripts/mint-mainqa-nodes` — bash land half.

  ```
  mint-mainqa-nodes <source-node-id> --pr <n> --items <file> [--dir <intentions-dir>]
  ```

  It must **reproduce, not reinvent**, `hold-node`'s invariants
  (`packages/intentionsutil/scripts/hold-node:1-181`) — this is the same
  decision/land split, and the same one-commit rule:

  1. Resolve the repo root from an explicit `-C`/cwd, never from the script's own
     location, and pass `-C <repo root>` to `graph-commit` (see **Reuse**).
  2. Fetch `origin/main` and overwrite the local `intentions/<id>.md` files
     **before** reading — this script routinely runs from a far-behind PR-branch
     worktree.
  3. Run `mint-mainqa-nodes-decide.ts` to get the per-lane dispositions. Skip
     every `EXISTING` lane entirely (idempotent re-run: `/qa-fix` may pass this
     seam more than once on a fixing pass).
  4. For each `CREATE` lane: write frontmatter through `write-node.ts` (the
     single validation gate — never hand-authored markdown), then replace the
     generated `# <statement>` placeholder in `intentions/<id>.md` with the body
     Unit 1 produced. This is exactly the three-step recipe
     `.claude/skills/qa-main/SKILL.md:310-357` proves for a phase skill minting a
     node, and the body survives any later frontmatter-only rewrite because
     `writeNode` calls `readExistingBody`
     (`packages/intentionsutil/src/store.ts:52`).
  5. Land **all** created nodes in **ONE** `graph-commit` invocation (all ids
     positional). Both destination nodes are first mints, so neither gets a
     `--base` compare-and-swap token; if a future caller passes a pre-existing
     id, take its token from `dump-node.ts --out-dir`'s `base-manifest.txt`
     handed straight to `graph-commit --base`.
     **The source node is not touched** — the `blocked_by` edge points from the
     destination to the source, so there is no source-side edit and no CAS on it.
     This is what makes the land a pure create.
  6. Restore every touched `intentions/<id>.md` on any non-landing exit path
     using `park-node`'s conditional-restore guard
     (`packages/intentionsutil/scripts/park-node:282` `restore_node`, header at
     `:22-45`): decline the restore when HEAD has moved or the file no longer
     hashes to what this script wrote, or the "rollback" becomes an uncommitted
     revert of a landed commit.
  7. After `graph-commit` reports success, **re-read each written node from a
     fresh `origin/main` and assert the write survived**, following
     `packages/intentionsutil/scripts/resolve-hold:422-482` (Verify A / Verify B)
     — `graph-commit`'s layer-2 field merge has a documented history of silently
     dropping or duplicating parts of a write.

  Stdout: one line per lane — `minted <id> (<disposition>)`. Exit codes on
  `park-node`'s scheme: 0 landed (including an all-`EXISTING` no-op); 1
  write/`graph-commit` failure (refused CAS included); 2 usage error.

- `packages/intentionsutil/scripts/test-mint-mainqa-nodes.sh` — harness copied in
  shape from `packages/intentionsutil/scripts/test-park-node.sh` /
  `test-hold-node.sh` (throwaway `mktemp -d` repo, real `src/` plus a
  `node_modules` symlink, a stubbed remote). Minimum cases: mixed items produce
  exactly two nodes in one commit; all-machine produces one; all-author produces
  one; a WAIT item lands on the **machine** node (R1); a re-run with both files
  already present writes nothing and exits 0; the source file is byte-identical
  before and after; a `graph-commit` failure leaves a clean tree; the post-land
  re-read failure is reported non-zero.

- **CI wiring is mandatory and easy to miss.** `run-unit-tests.sh` only globs
  `test-*.sh` inside `.claude/skills/dispatch-propagate/scripts/`, so a suite
  whose SUT lives in `packages/intentionsutil/scripts/` runs in CI **only** when
  wired unconditionally in `.github/workflows/unit-tests.yml` — add a step beside
  the existing `test-park-node.sh` / `test-transition-node.sh` /
  `test-graph-commit.sh` steps at `.github/workflows/unit-tests.yml:292-303`.

Out of scope for this unit: `graph-commit` itself, `park-node`, any `gh` call
(this script stays gh-free).

**Recommended model.** opus — fresh-`origin/main` refresh, compare-and-swap,
rollback and post-land verification are the hazard class `resolve-hold` and
`park-node` document at length.

**Dependencies.** Unit 1.

---

## Unit 3 — `.claude/rules`-conformant prose lint pass on the new script

**Scope.** Not a separate file: fold into Unit 2's review, but call it out so it
is not skipped. `.claude/skills/dispatch-propagate/scripts/lint-prose-rules.sh`
(run by `run-lint.sh`, run by CI) mechanically rejects net-new added lines in
committed `.sh` files that pipe a captured JSON variable through `echo` into
`jq`. `mint-mainqa-nodes` handles JSON payloads throughout — use `<<<"$VAR"`,
`printf '%s'`, or a direct pipe from the producing command. See
`.claude/rules/shell-json.md`.

Also applies: `.github/scripts/check-type-safety-escapes.sh` flags net-new
`any` / `as <Type>` / non-null `!` on added TS lines. Unit 1's module should need
none; if one is genuinely correct, suppress it with a same-line
`// type-safety-ok: <reason>` carrying a real reason.

**Recommended model.** sonnet.

**Dependencies.** Units 1, 2.

---

## Unit 4 — the reconciler must not absorb a node already at `main-qa`

**Scope.** Two enumerations plus tests:

- `packages/intentionsutil/scripts/reconcile-graph.ts:139-141` — `isOpen` is used
  by pass 1's enumeration at `:175`. Introduce an explicit
  `isMergeAbsorbable(phase)` that is `isOpen(phase) && phase !== "main-qa"`, and
  use it at `:175`. Keep `isOpen` as-is if other call sites need it; do **not**
  broaden the change into `reconcileMergedPhase` or `forwardPhase` — retiring the
  `review → main-qa` edge is out of scope (old Unit 4).
- `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged:135` — the
  mirrored inline `open` set. Drop `"main-qa"` from it so the two enumerations
  cannot drift. Update the header comment at `:7-14`, which currently documents
  `merged + residue → main-qa` as the reason `main-qa` is in the set.
- `packages/intentionsutil/test/reconcile-graph.test.ts` — add cases: a node at
  `phase: main-qa` with a merged `execution.pr` and **no** residue heading is
  **not** written and does not appear in `plan.reconciled` (this is the
  regression that would silently `done` every destination node); a node at
  `phase: main-qa` **with** a residue heading is likewise untouched (the drain
  tail is `/qa-main`'s to advance, not the reconciler's); a node at `review` with
  a merged PR still reconciles exactly as today.

**Rationale to record in the diff comment.** A node at `main-qa` has no merge of
its own to absorb. Either it arrived by the reconciler's own `main-qa`
transition, which already recorded the merge evidence, or it was minted directly
at `main-qa` at qa record time, in which case the merge in question is its
**source's** and is absorbed onto the source node. Re-processing it can only
mis-classify it: it carries `## Verification items`, not a `## needs-main`
heading, so it would read as residue-free and be swept to `done`. This narrowing
is about a **merge** only — a source PR closed **without** merging absorbs no
merge and is handled by its own predicate beside it.

**Recommended model.** opus — this is the correctness hinge of the whole design,
and the failure mode (a destination node silently `done`'d before it is ever
verified) is silent.

**Dependencies.** none (it can land first; Units 5–7 depend on it).

---

## Unit 5 — `/qa-fix` Step 3.6 node lane: mint destination nodes instead of appending residue

**Scope.**

`.claude/skills/qa-fix/SKILL.md`:

- Step 3.6's **Node-target lane** paragraph (`:367-379`): replace the residue
  append with the mint. New behaviour, stated in the skill body:
  1. Join each `class === "needs-main"` disposition back to the in-memory residue
     list by `id` to recover `url_path` / `expected_outcome` / `finding` (the
     dispositions array does not carry them — this join already exists on the
     legacy lane and is described at
     `.claude/skills/qa-fix/references/needs-main-followups.md`, "Select and
     join").
  2. Assign each item a `verifiability` mark using the **`owner` sort criterion**,
     not the retired browser-reachability predicate: an item is **author-required
     only if it cannot be machine-checked at all** — it needs private
     credentials/accounts Claude lacks, a subjective product/UX judgment, or the
     user's product intent. Any item settleable by *any* tool the autonomous lane
     can run (browser **or** `git`/`journalctl`/log/`jq`/`grep`/`ls`/filesystem/
     test-run) is `MACHINE`. An otherwise-sound check whose event has not
     happened yet is `WAIT`. Default `MACHINE`; `AUTHOR` requires naming which of
     the three barriers applies. "The browser cannot reach it" is never a
     barrier.
  3. Write the joined, marked items as a JSON array and run, from the worktree
     root, with `dangerouslyDisableSandbox: true` (it fetches and pushes):

     ```bash
     packages/intentionsutil/scripts/mint-mainqa-nodes "$N" --pr "$PR_NUM" --items tmp/mainqa-items-<n>.json
     ```

  4. Do **not** append anything to the source body. Do **not** set the source's
     phase here — Step 4's `transition-node "$N" --set-pr "$PR_NUM"` still
     advances `qa → review`, exactly as today.
  5. Record each minted node id for the Step 4 PR comment's "filed follow-ups"
     sub-list (replacing the residue mention), and count the mint as **zero**
     forked subagents — this seam forks none.
- The **Completion** bullet at `:190-200`, whose prose still says "needs-main
  residue appended in Step 3.6 is drained after review merges, via
  `review → main-qa`". Rewrite: the source now advances `qa → review` and then
  `review → done`; the post-merge verification lives on the standalone
  `tactic-mainqa-*` nodes minted at Step 3.6, held by `blocked_by` until the
  source reaches `done`.
- Step 6's escalation-set prose (`:491-520`): `needs-main` residue stays excluded
  from the escalation set (unchanged) — but the reason changes from "filed as
  follow-ups in Step 3.6" to "minted as standalone destination nodes in Step
  3.6". Keep the exclusion; only the wording moves.

`.claude/skills/qa-fix/references/needs-main-followups.md`:

- Rewrite the whole **Node-target lane** section (`:18-77`) to the mint
  procedure: the sort criterion above (kept verbatim — it is already correct),
  the destination-node table from **Target design**, the `mint-mainqa-nodes`
  invocation, and the statement that the source body is never appended to.
- Correct `:32`, which names `tactic-main-qa-phase` as owning verification —
  that node has been **pruned** from `intentions/`. Name `/qa-main`'s node lane
  instead.
- The **Retirement** note at `:70-77` says the `Verifiability:` sub-line retires
  with the `## needs-main residue` section, "when the standalone
  `tactic-mainqa-*` node shape … is live". It is live as of this PR **for
  newly-recorded items**, and Unit 7 migrates the live WAIT marks — but 28
  residue-carrying source nodes still drain in place. Amend the note to say
  exactly that: the sub-line stays a **read-only** convention for the drain tail
  (`/qa-main` still parses it on legacy source nodes) and is no longer **written**
  by `/qa-fix`; it retires fully when the last residue-carrying node drains. Do
  not delete the section while any node still carries residue.
- Leave the **Legacy lane (`TARGET_KIND=issue`)** section untouched. GitHub
  Issues are disabled repo-wide; that lane is dead code and retiring it is not
  this node's work.

Out of scope for this unit: `forwardPhase`, `reconcileMergedPhase`,
`hasNeedsMainResidue` (all old Unit 4); the legacy issue lane; any `gh` label.

**Recommended model.** opus — a phase-skill rewrite at the seam where graph
state is written, with a prose contract two other skills read.

**Dependencies.** Units 1, 2, 4.

---

## Unit 6 — `/qa-main` node lane: the target is the verification node

**Scope.** `.claude/skills/qa-main/SKILL.md`, **Node-target lane** section
(`:103-190` and the verdict/outcome block at `:245-357`, plus the WAIT branch at
`:450-475`). The verification procedure (Steps 4a–4e, Lane M / Lane B, the
redaction rule, the untrusted-body fence) is **unchanged byte-for-byte**; only
the target and the work-list source change.

1. **Target.** Replace "The target is the source tactic at `phase: main-qa`; its
   work list is the node body's needs-main residue" with: the target is a node at
   `phase: main-qa`, and its work list is read from **either** shape —
   - **new shape** (`tactic-mainqa-*`, this node's design): the H2
     `## Verification items` on the node's own body, one bullet per item carrying
     `Path:` / `Expected outcome:` / `Finding:` / `Verifiability:` / optional
     `Check:`;
   - **legacy shape** (the 28 residue-carrying source tactics still draining):
     the H2 whose heading begins `needs-main`, parsed exactly as today.

   Detect by heading. **Both are supported until the drain tail empties** — do not
   delete the legacy parse in this PR.
2. **Empty work list is a PASS.** State it explicitly: a `main-qa` node whose
   work list is absent or has zero items takes the **pass** branch
   (`transition-node "$N"`, `main-qa → done`). This is reachable in the new
   design — Unit 7 can leave a migrated source node with an emptied residue
   section — and today's prose leaves it undefined.
3. **`execution.pr`** is read the same way
   (`jq -r '.execution.pr' <<<"$NODE_JSON"`); on the new shape it is the source
   PR the destination node was born carrying. The sensor-gate re-check is
   unchanged and stays a signal that can only demote.
4. **`AUTHOR` items never reach this lane on the new shape** — they live on the
   `owner: human` node, which the selector never emits. Keep the **AUTHOR park**
   branch for the drain tail and annotate it as such: it becomes dead once the
   last legacy residue node drains.
5. **The `broken` branch** is unchanged in mechanics (write an implement-chain
   bug tactic via `write-node.ts` + body edit + `graph-commit`, then advance to
   `done`), except that `serves` is copied from **this** node — which copied it
   verbatim from the source at mint time — and the bug node's provenance body
   records both the destination node id and the source node id.
6. **The WAIT branch stays interim and unchanged** — `dispatch-mark-node-park`
   with the awaited event and the earliest useful re-check. Its **forward
   pointer** at `:468-475` currently cites `router.ts:343-355`; that anchor has
   drifted (the draft-candidate loop is now
   `packages/intentionsutil/src/router.ts:400-461`, and the `attributes.wait_until`
   exclusion is confirmed **absent** there). Correct the anchor to a symbol
   reference — "the tactic draft-candidate loop in `router.ts`" — and leave the
   branch's behaviour alone: flipping it to emit a hold node is
   `tactic-wait-calendar-release`'s producer wiring, not this node's (see
   **Out of scope**).
7. Update the lane's opening description at `:103-110` and the front-door comment
   at `:56-64` so no prose still says the node-lane target is the source tactic.

**Recommended model.** opus — same class as Unit 5; the untrusted-body fence and
the redaction rule must survive the edit intact.

**Dependencies.** Units 4, 5.

---

## Unit 7 — migrate the live `Verifiability: WAIT` marks (Ruling 3)

**Scope.** A data migration over `intentions/`, landed in the same PR.

1. **Re-measure first** — the counts drift. The live set is every node whose
   `phase` is **not** `done` and whose body carries a `Verifiability: WAIT`
   bullet inside a `## needs-main` section. Re-measured at `74c281dc^`, the state
   this migration actually ran against: **22 marks across 15 nodes** — 14 at
   `phase: main-qa`
   (`tactic-attention-namespaced-rank`, `tactic-conflict-outranks-ci-precedence`,
   `tactic-decision-log-append-noncompact-corruption`,
   `tactic-office-hours-select-fresh-main`,
   `tactic-outcome-envelope-node-lane-parity`, `tactic-pace-exempt-ceiling-fanout`,
   `tactic-pause-disables-merge-lane`, `tactic-review-api-cost-lens-merge`,
   `tactic-review-cross-lane-dedup`, `tactic-review-domain-lens-consolidation`,
   `tactic-review-fix-residue-death-coverage`,
   `tactic-review-skill-body-decomposition`,
   `tactic-review-verify-per-file-batching`,
   `tactic-terminal-disposition-sweep-park-without-cas`) and 1 at `phase: qa`
   (`tactic-strategy-fingerprint-stamp-coverage`). The earlier `f8bea654` reading
   of "20 marks across 14 nodes" was a NUL-byte undercount:
   `tactic-review-verify-per-file-batching.md` carries a NUL at byte offset
   15001, which silences a plain `grep`, hiding that file and its 2 marks. Every
   count under `intentions/` needs `LC_ALL=C grep -a`; re-measured that way,
   `f8bea654` held 47 marks across 27 files, not 45 across 26. **Excluded** were
   the 9 `done` nodes (17 marks, historical) and the files that only mention the
   string as text about the convention (`strategy-graph-native-dispatch.md`,
   `tactic-observation-ladder-terminus-baseline-drift.md`, this node) —
   `tactic-ladder-run-answerable-across-node-boundary.md`, named in the earlier
   reading, no longer carries the string at all.
2. **Per source node with live WAIT bullet(s):** run `mint-mainqa-nodes` with
   **only that node's WAIT items**, producing exactly one
   `tactic-mainqa-<slug>-machine` node (R1: WAIT is a machine-lane item), then
   delete those bullets from the source's `## needs-main residue` section. The
   source's `MACHINE` / `AUTHOR` bullets **stay and drain in place** — the
   Migration rule forbids a bulk rewrite of the drain tail.
3. **If deleting the WAIT bullets empties the section**, delete the whole H2
   section too. The node then has no residue: with Unit 4 in place the reconciler
   leaves it alone, and `/qa-main` passes it to `done` on its next selection via
   Unit 6's empty-work-list rule. Do **not** hand-transition it.
4. **Do not arm a WAIT hold.** `arm-wait` is `tactic-wait-calendar-release`'s
   surface and its producer wiring (the qa-phase mint, the `/qa-main` re-arm, and
   the interim-branch flip) is that node's work per the strategy's 2026-08-06
   clarification. This migration moves each WAIT item onto the node shape R1
   specifies it lives on; the hold that eventually blocks that node is armed by
   the sibling's wiring. R1 says where a WAIT item **lives**, not who arms it —
   this boundary is deliberate and is not a departure from the ruling.
5. **Land as one `graph-commit`** per batch, all touched ids positional, with
   `--base` CAS tokens from `dump-node.ts --out-dir`'s `base-manifest.txt` for
   every **pre-existing** file (each source node is pre-existing and therefore
   needs a token; each minted node is a first mint and gets none). If a source
   node's blob has moved since diagnosis, `graph-commit` refuses — re-read and
   re-apply; never force.
6. Run `validate-graph.ts` over the result before landing (see **Verification**).

**Recommended model.** opus — a multi-node graph land with CAS, over nodes other
sessions may be moving concurrently.

**Dependencies.** Units 2, 4, 6.

---

## Out of scope — named follow-ups (Ruling 4)

Each is named here rather than silently dropped. None is planned by this node.

- **Old Unit 3 — deploy-lag cannot-verify as a mechanical hold.** The shared
  `blocked_by` hold primitive is already built by `tactic-mechanical-park-producers`
  (`phase: done`, `status: codified`) — `packages/intentionsutil/src/holds.ts`,
  `scripts/hold-node-decide.ts`, `scripts/hold-node`. The deploy-lag WAIT hold
  itself is wholly `tactic-wait-calendar-release`'s surface (`phase: review`, 8
  codified units, PR #3051), including `arm-wait` / `release-wait`, the
  `attributes.wait_until` sweep predicate, the attempt counter and cap, the
  `router.ts` draft-candidate exclusion, and the flip of `/qa-main`'s interim WAIT
  park branch to hold-node emission. **Do not re-plan any of it here.** A
  follow-up filed when that node reaches `done` owns the flip.
- **Old Unit 4 — retire the `review → main-qa` edge** in `forwardPhase`
  (`packages/intentionsutil/src/transitions.ts:80-92`), `reconcileMergedPhase`
  (`:361`) and `hasNeedsMainResidue` (`:378`), with their callers
  (`packages/intentionsutil/scripts/reconcile-graph.ts:176-177`,
  `packages/intentionsutil/scripts/apply-node-transition.ts:160-161`) and tests
  (`packages/intentionsutil/test/transitions.test.ts:65-93`, `:210-211`). Blocked
  twice over: 28 residue-carrying nodes must drain first, and
  `tactic-phase-routing-table-generated` is `status: raw` / `phase: null`, so
  there is no generator, no sentinels and no CI drift check today — a Unit-4 PR
  would hand-edit the generated ladder prose that strategy clarification 111 says
  must be regenerated. `main-qa` remains a valid standing phase either way.
- **Old Unit 5 — the mis-sort census.** Restated on `owner`, not on birth
  `office_hours: null`: cannot-verify parks on `owner: ai` `main-qa` nodes, over
  all `owner: ai` `main-qa` nodes, threshold at most 1 in 20. `clear-park` erases
  `office_hours` when the author drains a node, so `office_hours` cannot carry the
  mark; `owner` survives the drain. This is a measurement, not a mechanism.

### Sibling relationships bearing on sequencing (carried forward, re-verified)

- `tactic-transition-node-needs-main-residue-clobbered` (`status: raw`,
  `phase: null`) describes a live bug in the mechanism Unit 5 **deletes**:
  `transition-node` overwrites `intentions/<id>.md` from `origin/main` before
  reading residue, so an uncommitted Step-3.6 body append never rides into the
  same commit. Once Unit 5 lands there is no body append to lose. **Disposition it
  moot when this PR merges** — it is superseded, not a dependency.
- `tactic-ladder-run-answerable-across-node-boundary` (`status: raw`,
  `phase: null`) carries `blocked_by: [tactic-mainqa-record-time-routing]`. It
  becomes unblocked when this node reaches `done`; re-plan it immediately after.
- `tactic-attributes-phase-squatter-retire` explicitly scopes this node's
  record-time destination split **out** of its own remit (its squatters sit at
  `phase: null` and are invisible to a drain of first-class `phase: main-qa`
  nodes). Adjacency only; no scope to merge.
- `tactic-qa-main-node-terminal-declaration` is an independent `/qa-main`
  escalation-path defect with no mechanical overlap.
- `tactic-qa-main-verifiability-sort-criterion` (`phase: done`,
  `status: codified`) is the immediate predecessor: it landed the `owner`-based
  sort predicate and the interim `Verifiability:` sub-line. Read it before Units
  5 and 6.

---

## Reuse

Locate every symbol below **by name**, not by line — the line numbers were
measured at `f8bea654` and drift.

- `.claude/skills/qa-main/SKILL.md:310-357` — the implement-chain bug-tactic mint.
  The proven precedent for a phase skill minting a node:
  `write-node.ts` with **frontmatter only** (`status` is required with no
  default; `serves` copied from the source), then edit `intentions/<id>.md` to
  replace the generated `# <statement>` placeholder, then `graph-commit`.
  Idempotent by checking whether `intentions/<id>.md` already exists at
  `origin/main`. **Do not reinvent this.**
- `.claude/skills/review-fix/references/followup-filing.md:7-67` — the node-target
  lane's batched multi-node mint with **exactly one** `graph-commit` on the main
  thread. Also documents the redaction rule for provenance written into a public
  node body and the "create new draft files only" constraint. This is the shape
  Unit 2's ≤2-nodes-per-source land needs.
- `packages/intentionsutil/scripts/hold-node` and
  `packages/intentionsutil/scripts/hold-node-decide.ts` — the network-free pure
  decision half plus thin land-only bash wrapper. Units 1 and 2 are the same
  split.
- `packages/intentionsutil/src/holds.ts` — `HOLD_KINDS` / `KIND_SLUGS` /
  `isHoldKind` / deterministic id derivation. The structural model for Unit 1's
  `MAINQA_LANES` / `mainqaNodeId`.
- `packages/intentionsutil/scripts/park-node` — `restore_node` (the
  conditional-restore rollback guard: declines when HEAD moved or the file no
  longer hashes to what the script wrote) and the fresh-`origin/main` header
  convention. Unit 2 reuses both.
- `packages/intentionsutil/scripts/resolve-hold:422-482` — post-land re-read
  verification (Verify A / Verify B) against a fresh `origin/main`. Unit 2 step 7.
- `packages/intentionsutil/scripts/dump-node.ts` — `--dir` and `--out-dir` both
  required; writes `<dir>/<id>.json` per node plus a merged
  `<dir>/base-manifest.txt` of blob shas, handed straight to `graph-commit --base`.
  Unit 7 uses it for CAS tokens.
- `packages/intentionsutil/scripts/graph-commit` — repeatable
  `--base <id>=<blobsha>|<manifest-file>` compare-and-swap against `origin/main`.
  **Always pass an explicit `-C <repo root>`**: it resolves the repo root from
  `-C`/`--repo` else **cwd**, never from its own location, and without it you
  commit the wrong checkout and it exits 0 having landed nothing.
- `packages/intentionsutil/scripts/write-node.ts` — `writeNodeFromJson` /
  `validateNode` / `writeNode`; `--dir <intentions-dir>` required with no default.
  The single validation gate: it drops unknown keys, applies defaults, and throws
  `IntentionSchemaError` on a missing/invalid required field. `body` is **not** an
  input field.
- `packages/intentionsutil/src/store.ts` — `writeNode` calls `readExistingBody`,
  so a hand-authored body survives any later frontmatter-only rewrite;
  `assertPathSafeId` is the id-safety precedent Unit 1's `mainqaNodeId` mirrors.
- `packages/intentionsutil/src/schema.ts` — `OWNERS`
  (`"human" | "ai" | "procedure"`, a **required core** field, so the `owner` sort
  needs no schema change), `PHASES` (contains `main-qa`), `Execution`
  (`branch` required string, `pr` nullable int), `validateOfficeHours`
  (`reason` required string, `since` required date, `recommendation` optional,
  `session_type` defaults to `"other"`), and the tactic status vocabulary
  (`raw` / `refining` / `delegated` / `codified`, declared on
  `intentions/kind-tactic.md` and enforced by graph rule 16).
- `packages/intentionsutil/src/router.ts` — `blockersComplete`, `isDraft`, the
  tactic-candidate `office_hours !== null` skip, and the draft-candidate loop.
  Read-only for this node; nothing here changes.
- `packages/intentionsutil/src/transitions.ts` — `inboundBlockers` (the
  self-clearing `blocked_by` edge), `hasNeedsMainResidue` (the canonical residue
  heading matcher the new body deliberately avoids matching), `forwardPhase`,
  `reconcileMergedPhase`. Only the reconciler **enumeration** changes (Unit 4);
  these functions do not.
- `intentions/tactic-mainqa-gcp-cost-alerts.md` and
  `intentions/tactic-mainqa-ds-storybook-visual.md` — live frontmatter templates
  for the author-lane node (`phase: main-qa`, `owner: human`, `status: delegated`,
  non-null `office_hours`). Both carry `execution: null` and `blocked_by: []`;
  the source-linked half is new.
- `intentions/tactic-wait-calendar-release.md:160-200` and its Unit 6 — the WAIT
  node shape (`attributes.wait_for` names the source, `source.blocked_by` names
  the WAIT) and the `arm-wait` landing convention. **Read-only context**: do not
  implement any of it here.
- `.claude/skills/dispatch-propagate/scripts/dispatch-mark-node-park` — the
  office-hours park writer `/qa-main` already calls, including its
  browser-reachability rejection gate (exit 3). Unchanged; Unit 6 keeps calling it
  on the node it is given.
- `.claude/skills/dispatch-propagate/scripts/graph-select-target` (`main-qa`
  sensor arm) and `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute`
  (`tactic:main-qa → /qa-main`) — both already correct for the new node shape.
  Read-only.

---

## Verification

### Auto-runnable

Run from the worktree root.

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
packages/intentionsutil/scripts/test-mint-mainqa-nodes.sh
```

```verify
packages/intentionsutil/scripts/test-transition-node.sh
```

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

The `/qa-fix` skill must actually call the new writer (fails today — the string
does not appear):

```verify
grep -q 'mint-mainqa-nodes' .claude/skills/qa-fix/SKILL.md
```

`/qa-main` must accept the new work-list heading (fails today):

```verify
grep -q 'Verification items' .claude/skills/qa-main/SKILL.md
```

The reconciler must no longer enumerate `main-qa` as merge-absorbable (fails
today — the string is present):

```verify
test "$(grep -c '"review","main-qa"' .claude/skills/dispatch-propagate/scripts/reconcile-graph-merged)" -eq 0
```

Unit 7's migration is complete when no node outside `phase: done` still carries a
live WAIT bullet. This script exits 0 only when that holds — and it does at
`74c281dc`, where **0 nodes match**. Before Unit 7's migration landed, at
`74c281dc^`, 15 nodes matched:

```verify
fail=0; for f in intentions/*.md; do grep -q 'Verifiability: WAIT' "$f" || continue; grep -q '^## needs-main' "$f" || continue; ph=$(sed -n 's/^phase: //p' "$f" | head -1); [ "$ph" = "done" ] && continue; echo "still live: $f (phase=$ph)"; fail=1; done; exit $fail
```

### Manual / observe-in-production

- **End-to-end, mixed residue.** On the next `/qa-fix` node-lane pass that
  produces both a machine-verifiable and an author-required needs-main item,
  confirm: exactly **two** nodes are created, never three (a WAIT item lands on
  the machine node, per R1); the source body gains **no** `## needs-main` section;
  the source advances `qa → review` and then `review → done` with no `main-qa`
  stop; and both destination nodes carry `blocked_by: [<source-id>]` and
  `execution.pr` equal to the source PR.
- **No worker boots for the author lane.** After the source reaches `done`,
  confirm across at least two dispatch ticks that the `owner: human` node appears
  on the office-hours parked panel and that the selection log records **no**
  `/qa-main` launch for it. This is the waste the whole tactic exists to remove,
  and it is only observable in the running fleet.
- **The machine lane does boot.** Confirm the `owner: ai` node becomes selectable
  once its blocker is `done`, that `provision-node-worktree` cuts its worktree on
  a branch named for the node id from `origin/main`, and that `/qa-main` reads its
  `## Verification items` work list rather than a residue section.
- **The reconciler does not eat it.** Between the mint and the first `/qa-main`
  selection, confirm across at least two ticks that neither destination node has
  been written to `phase: done` by the reconciler. This is the Unit 4 hazard;
  a unit test pins it, but the live sweep is the real check.
- **The drain tail still drains.** Pick one of the 20 legacy residue-carrying
  nodes at `phase: main-qa` and confirm `/qa-main` still parses its
  `## needs-main residue` section and reaches a verdict — the legacy parse must
  survive this PR.
- **`graph-commit` actually landed.** After each land in Units 5/7, confirm
  `pushed` is not `none` and re-read the written nodes from a fresh `origin/main`.
  A `pushed=none context=noop` result is a **failure**, not a no-op.
## What shipped — 2026-08-30, Units 1-7, in two different places

Landed as #3140 (merge commit `77bd7471`, merged `2026-08-30T02:52:45Z`),
Position 3 of the dispatch/RSI serialized window. The unit set shipped in two
places, because Unit 7's subject is node content rather than code:

**Units 1-6 shipped as code in #3140.**

- Unit 1 — `src/mainqaRouting.ts`, the pure routing decision.
- Unit 2 — `mint-mainqa-nodes`, the landing half.
- Unit 3 — the `.claude/rules`-conformant prose lint pass over that script.
- Unit 4 — the reconciler no longer absorbs a node already at `main-qa`.
- Unit 5 — `/qa-fix` Step 3.6's node lane mints destination nodes instead of
  appending a residue section.
- Unit 6 — `/qa-main`'s node lane targets the verification node.

**Unit 7 shipped as two `graph-commit` landings directly on `main`**, under the
batch's graph-bookkeeping authority, since a node-content migration has no code
diff to carry through a PR:

- *Landing 1* — 15 `mint-mainqa-nodes` invocations minted 15
  `tactic-mainqa-*-machine` destination nodes, carrying the 22 migrated
  verification items under `## Verification items`. All 15 reported
  `context=push-reported-success`; none returned `pushed=none context=noop`.
- *Landing 2* — `74c281dc` removed those same 22 WAIT residue
  bullets from their 15 source nodes, emptying 14 `## needs-main` sections. Each
  of the 15 rewritten blobs was re-read from a fresh `origin/main` and asserted
  byte-equal to its `--expect` entry.

Measured across the two landings, at `74c281dc^` then at `b76ce953`: nodes
carrying a `## needs-main` H2 went **77 -> 63**, and WAIT-mark
occurrences went **74 -> 52**. The 52 that remain are all non-live, and
partition exactly: 22 on the 15 new machine nodes (migrated shape, under
`## Verification items`), 17 on 9 `done` nodes (historical), and 13 across 4
files that only mention the string. The Unit 7 verify fence, keyed on
`^## needs-main`, now exits 0 with no output.

**Deliberately not shipped.** Ruling 4's named follow-ups stay out of scope and
are recorded above rather than executed here. The legacy `## needs-main` parse
is retained, not removed — 20 nodes at `phase: main-qa` still drain through it.

**Review-gate deviation, recorded rather than smoothed over.** #3140 merged
before its detached `/code-review` had settled, which is the failure the batch's
review gate exists to prevent. The review was run retroactively against
`77bd7471~1..77bd7471` and its findings posted as a comment on #3140 at
`2026-08-30T03:09:15Z`.
