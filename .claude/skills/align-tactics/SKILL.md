---
name: align-tactics
description: Autonomously break a recorded `strategy-*` intention node into PR-sized tactic subtrees carrying full clean-session plans, or finalize/re-plan a single frozen `tactic-*` node directly — the graph-native successor to `/plan-issue` and `/file-issue`'s epic-structuring role. Two-sided drift review, decompose to the signal, plan each claude-eligible tactic into its node body, park the rest; lands via `graph-commit`. Never files a GitHub issue; never `AskUserQuestion` mid-run.
user-invocable: true
---

# Align Tactics

`/align-tactics <strategy-node-id>` breaks a recorded strategy into the
executable tactic subtree that validates its signal this round. It supersedes
`/plan-issue` and `/file-issue`'s epic-structuring role for the graph-native
dispatch model (`intentions/strategy-graph-native-dispatch.md`): a tactic
enters execution by being decomposed and planned here — landed on
`origin/main` with `phase: implement` and a full plan in its node body — not
by becoming a GitHub issue with a `<!-- dispatch:plan -->` comment. Full spec
and coverage matrix: `intentions/tactic-graph-native-dispatch.md` §2.3 and §4.

This skill never files, edits, or closes anything on GitHub, and never runs
`gh`. Its only artifacts are `intentions/tactic-*.md` nodes (and frontmatter
edits to the serving `strategy-*.md`) landed on `origin/main` via
`graph-commit`.

It inherits along two axes, each with a part it deliberately does **not** take:

- **From `/plan-issue` (`.claude/skills/plan-issue/SKILL.md`)** — take the
  drift-review substance, the Explore/Plan subagent fan-out, the reuse-first
  and design-proposals discipline, the plan-quality bar, the plan schema, and
  the autonomous office-hours park model. Drop every gh mechanic: no
  `dispatch-*` scripts, no plan-comment, no worktree-branch target parsing, no
  owning-PR probe. The target is the `<strategy-node-id>` argument; sequencing
  is `blocked_by` frontmatter edges, not a PR-precondition scan.
- **From `/align-strategy` (`.claude/skills/align-strategy/SKILL.md`)** — take
  the write path (`write-node.ts` → body `Edit` → `graph-commit`), the
  citation of `validateGraph` rules by number, and the register. Invert the
  interaction model: `/align-strategy` is interview-driven; **`/align-tactics`
  is autonomous and never calls `AskUserQuestion`**. This inversion is the
  single biggest trap — "match the sibling" pulls the wrong way.

## Trigger and input

On-demand or router-invoked. The sole argument is a node id, either:

- `/align-tactics strategy-<slug>` — decompose a recorded strategy into its
  executable tactic subtree (Steps 1–5 below), or
- `/align-tactics tactic-<slug>` — finalize or re-plan a single **frozen**
  tactic (draft/raw, or soft-frozen — the router selects exactly the tactics
  its `frozenTacticSelectable` gate approves,
  `packages/intentionsutil/src/router.ts:482`). This is the per-node target
  path (see "Tactic target — per-node finalize or re-plan", below).

With no argument, stop and report that a node id (`strategy-<slug>` or
`tactic-<slug>`) is required — this skill never selects its own target.

## Step 0 — Claim and isolate

Before the first write, claim the target node id (strategy or tactic) and
author in its worktree — the same uniform node-id reservation discipline the
router's fan-out workers follow (`strategy-graph-native-dispatch`'s 2026-07-06
concurrency-safety clarification). Never author in the shared `main`
checkout: a concurrent session's dirty tracked file blocks this run's
`graph-commit` rebase, and a stale read races live phase state.

1. **Resolve the target node id** — the `strategy-<slug>` or `tactic-<slug>`
   argument (this skill never selects its own target).
2. **Check the claim.** If `<project-root>/.claude/worktrees/<node-id>`
   already exists with a live session — `worktree_has_live_session <path>`
   (`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:15`,
   run with `dangerouslyDisableSandbox: true`) — the claim is held by
   another session: stop and report the held claim, then end the run. A
   held claim is **not** an `office_hours` park (it is not one of the three
   autonomy-contract conditions below) and **not** a defect.
3. **Enter the worktree.** Otherwise create or re-enter it — native
   `EnterWorktree` with the node id as the worktree name, or the
   `provision-node-worktree`
   (`.claude/skills/dispatch-propagate/scripts/provision-node-worktree`)
   primitive — and do all authoring and the step-5 `graph-commit` from
   there. The worktree **is** the claim: the same live-session ⇔ worktree
   liveness rule the router uses, so no separate lock is needed.

## Tactic target — per-node finalize or re-plan

When the argument is a `tactic-<slug>` (not a `strategy-<slug>`), this session
operates on **exactly one pre-existing tactic node** — the router queued it
because its `frozenTacticSelectable` gate approved it as an `align-tactics`
candidate (`packages/intentionsutil/src/router.ts:482`;
`resolveFrozenDescendant` at line 453 is the strategy-side inverse the selector
uses). There is **no** strategy decomposition, no draft sweep, and no `rounds`
bump here — Steps 1–5 below are the strategy-target flow; this subsection is the
parallel tactic-target flow, reusing pieces of them **by reference**. It runs
the same Step 0 claim/worktree mechanics (keyed on the tactic id) and the same
Autonomy contract (below).

A frozen tactic target is **either** draft/raw or soft-frozen; read its
frontmatter to tell which:

- **Draft/raw** (`phase` absent — `phase: null`, never decomposed) →
  **finalize** it. This is Step 3 ("Plan each claude-eligible tactic") applied
  to exactly this **one** tactic: run the Explore/Plan fan-out (or, for a
  trivial tactic, write the plan directly), landing it at `phase: implement`
  with a full clean-session plan in its body per the Step-3 plan schema. Do
  **NOT** sweep the serving strategy's other draft tactics — that draft
  consume/split/merge/prune path is the strategy-target flow's job (Step 2 item
  2). Do **NOT** bump the strategy's `rounds` counter — round accounting is
  completion-time and prod-verified (see "Strategy round accounting" in Step 5).
  **Whole-node reconcile** (clarification 32, per "Re-evaluation mode" item 2):
  rewrite any stale draft narrative in `statement`, `rationale`,
  `attention.rationale`, and the body so none of it contradicts the finalized
  state — **while preserving the authored `attention.boost` value** (do not
  reset or renumber it). Frontmatter on landing: `status: codified`,
  `phase: implement`, `execution: null`, and `validates: []` unless this tactic
  itself produces the strategy's signal reading (in which case
  `validates: [<strategy-id>]`, the Step 2 item 5 convention).

- **Soft-frozen** (`phase` already set to an in-flight value — `implement`,
  `fix`, `qa` — but its `execution.strategy_fingerprint` entry for one serving
  strategy is stale) → **re-plan** it. This is exactly "## Re-evaluation mode"
  (below) applied to this **one** tactic instead of a strategy-wide open-child
  sweep. Reconcile the whole node against the current serving-strategy substance
  (the whole-node reconciliation bar, clarification 32, per Re-evaluation mode
  item 2), re-stamp **only** the re-evaluated strategy's entry in
  `execution.strategy_fingerprint` to the `{hash: strategyFingerprint(strategy),
  sha: <origin/main sha>}` object form (Re-evaluation mode item 3) and leave
  every other serving strategy's entry untouched (a tactic still at
  `execution: null` has no map to re-stamp), and land via `graph-commit`.

**Both cases land the single pre-existing node** via `graph-commit --base` —
dump it first with `dump-node.ts`, the exact Step-5 "Capture a base manifest"
mechanic, so a stale read of a live node is refused mechanically:

```bash
BASE=$(npx tsx packages/intentionsutil/scripts/dump-node.ts \
  --out-dir "$TMPDIR/dump" <tactic-id>)
packages/intentionsutil/scripts/graph-commit --base "$BASE" <tactic-id>
```

There is **no strategy edit** in either case — a per-node tactic-target session
never touches the serving strategy's frontmatter (`rounds`, clarifications, or
otherwise), in contrast to the strategy-target flow, which may. If a
tactic-target session discovers the strategy's own record needs an edit, that is
a record-completeness defect to name in a park (see the Autonomy contract's
unrecorded-context framing), not something this session writes onto the
strategy.

**Autonomy contract binds unchanged.** A tactic target that hits requirement
ambiguity, major scope deviation, or an unverifiable blocker parks the
**tactic** node (never the strategy) via the same `office_hours` write mechanism
in "Autonomy contract", below.

## Autonomy contract

Runs to completion without user interaction. Parks to `office_hours` — never
`AskUserQuestion` — under `/plan-issue`'s three conditions:

- **Requirement ambiguity** — a strategy term or clarification has multiple
  plausible readings that would change the decomposition.
- **Major scope deviation** — the minimum round to validate the signal
  deviates substantially from what the strategy's recorded substance implies.
- **Unverifiable blocker** — a `blocked_by` precondition or drift signal that
  cannot be resolved from the graph alone.

These three are the general categories; two later steps name concrete
instances that park under them rather than introducing separate triggers — the
round-cap park (Step 1's eligibility sanity check, an unverifiable blocker: no
fresh reading exists to resolve whether another round is warranted) and both
sides of drift review (Step 1, a failed or newly material condition — scope
deviation or an unresolvable blocker depending on which side fired). Treat
every park in this skill as an instance of one of the three; do not read the
list as exhaustive-by-enumeration and treat a same-category park elsewhere as
out-of-contract.

To park, set `office_hours: {reason, since}` on the affected node (the strategy
for a strategy-wide block; the specific tactic for a tactic-local one) via
`write-node.ts` and land it with `graph-commit`. `since` is `date -u +%Y-%m-%d`
(never hand-guessed). The `reason` carries the specific question or deviation
so the office-hours queue tells the author exactly what decision is needed —
the graph analog of `/plan-issue`'s `dispatch-mark-deviation` reason string. An
interactive session's later commit touching the node clears the park
(`intentions/tactic-graph-native-dispatch.md` §1.3). Do **not** call
`AskUserQuestion` as the escalation mechanism — parking is the whole autonomy
contract.

**Park-time recommendation** (strategy clarification 30 / condition 6): every
park writes recoverable context **at park time** — `reason` plus a best-next-
steps recommendation for the human — because session attach/resume is not a
supported recovery path; a park whose full context lives only in this
session's transcript is itself a defect. This binds every park in this skill,
escalation and born-parked (Step 4) alike. Transitional note: a first-class
`office_hours.recommendation` field is planned (`tactic-office-hours-graph-entry`
Unit 1 / `tactic-phase-skill-node-targets` Unit 2 — shared, skip whichever
lands second) but is not yet in `schema.ts`, so `write-node.ts` rejects that
key today. Until it validates, carry the recommendation **inside** the
`reason` string as a labelled trailing sentence (e.g. `"...Recommend: <next
step>."`) — never drop it — and switch to the dedicated field once it lands.

**Unrecorded-context park framing.** When a decomposition or re-evaluation
cannot proceed because needed context simply is not in the graph, name the
gap in the park reason as a **record-completeness defect** (strategy
clarification 31 / condition 7) of the `/align-strategy` round that produced
the strategy — not something this session should guess at. The fix is an
author `/align-strategy` pass to complete the record, and the park reason
should say so explicitly.

## Idempotency

`/align-tactics` decomposes one strategy into N tactics, so idempotency is
**per-tactic**, not a single strategy-level marker. Before planning, read the
strategy's existing non-draft child tactics. The store serializes arrays as
YAML **block sequences**, so `serves` renders as `serves:` on its own line
followed by `  - <strategy-id>` — an inline-flow grep for
`serves: [<strategy-id>]` matches nothing. Find the children with
`grep -rl '^  - <strategy-id>$' intentions/tactic-*.md` (or, to see the
surrounding `serves:` block, `grep -B1 -A2 '^  - <strategy-id>$'
intentions/tactic-*.md` — both anchor on the target id, so neither returns
tactics serving a *different* strategy), then read each candidate's
`phase` and keep the `phase`-set, non-`draft`/non-`done` ones. A
tactic already at `phase: implement` with a plan in its body is done work — do
not re-plan it. A partial prior run (some tactics landed, some not) resumes by
planning only the missing ones. Draft tactics (`phase` absent) are **input**,
not landed work: they are consumed in step 2 — **but first check
`office_hours`**: a `phase`-absent child with `office_hours` set is not an
`/align-strategy`-retained draft, it is a **born-parked** tactic from a prior
round (Step 4), already-decided human-owned work. Skip it (at most reconfirm it
is still needed); never run it through the step-2 finalize/split/merge/prune
draft path.

## Step 1 — Scope and two-sided drift review

Read the strategy node's frontmatter (`readNode` via a small `tsx` one-liner,
or just read the file — only the frontmatter is authoritative): `statement`,
`rationale`, `success_signal`, `reading`, `gap`, `clarifications`,
`attributes.conditions`, `rounds`, and its draft child tactics (their bodies
carry retained tactical context from `/align-strategy`).

**Eligibility sanity check.** Confirm the strategy is actually decomposable
this round (`intentions/tactic-graph-native-dispatch.md` §3.1): `office_hours`
null, signal unvalidated (`gap` non-null or `reading` null), the fresh-reading
gate holds (`rounds.last_aligned` is null — never aligned — or a reading
exists dated strictly newer than `rounds.last_aligned` — a null `reading`
never satisfies "newer than"), it has no non-draft child tactics already on
its signal path (the fifth §3.1 criterion — see Idempotency, above, which
reads those children), and `rounds.count < 2`. If `rounds.count` is already at
the cap with no fresh reading, park the strategy (round history as the reason)
instead of burning a third round.

Drift review is **two-sided** (strategy clarification 8):

- **Side A — a recorded condition failed.** If any `attributes.conditions`
  entry no longer plausibly holds against current repo/author state, do
  **not** plan against a dead premise. Park the strategy back to
  `/align-strategy` territory (`office_hours` on the strategy, reason naming
  the failed condition). Conditions are human-decided; a failed one is an
  author decision, not something this session re-resolves.
- **Side B — the round's plans depend on an *unrecorded* condition.** Sweep
  for premises the decomposition newly relies on that the strategy does not
  record. The discriminator: does a plan actually depend on it?
  - **Material** — a premise a plan depends on that is a condition or design
    assumption the author must ratify. Propose it as a dated `clarifications`
    entry on the strategy **and** park the strategy in the **same**
    `graph-commit`, the park reason naming the proposed clarification for
    author ratification (conditions stay human-decided).
  - **Immaterial** — an observation that informs but does not gate the plans.
    Land it as a dated `clarifications` entry on the strategy without
    interrupting, and continue the round.

Every clarification `answer` carries a dated provenance clause: an event verb
(Recorded / Amended / Reviewed / clarified / adopted, etc.) plus an ISO date,
placed wherever it reads best in the sentence — a front-loaded parenthetical
is preferred, e.g. `"(Recorded 2026-07-05 /align-tactics round.) ..."`, but any
placement is accepted. The newest ISO date anywhere in the answer is its
effective date — the `readingDate()` contract
(`packages/intentionsutil/src/router.ts`) extracts it verb-agnostically, and
`coverage.ts`'s `lastReviewedOf` depends on it. An amendment adds a new dated
clause rather than rewriting the old one. Get the date via
`date -u +%Y-%m-%d`, never hand-guessed. `validateGraph` rule 17 mechanically
enforces the date-presence half of this convention; the event verb is
documented style, not linted.

This absorbs the `/plan-issue` relevance/drift, convention-drift, and
merged-work-overlap review (§4 coverage matrix) — unchanged in substance, with
the graph as the corpus in place of the issue body and its references.

## Step 2 — Decompose to the signal

Design the **minimum** tactic set that validates the strategy's
`success_signal` this round — not everything the strategy could eventually
need. This is the `/plan-issue` decomposition gate (leaf = one PR) applied to
a strategy.

1. **Instrument first when unmeasurable.** When the strategy's `reading` is
   null, the round **must** include an instrument tactic that makes the
   signal's sensor runnable (strategy clarification 3 — a strategy that cannot
   be measured must first buy its own instrument). Without it the round cannot
   produce a fresh reading and the strategy dead-ends at the round cap.
2. **Consume the draft tactics.** Each draft child (`phase` absent **and
   `office_hours` unset**, retained by `/align-strategy`) is **finalized,
   split, merged, or pruned** — it is input, never left dangling. A
   `phase`-absent child *with* `office_hours` set is a born-parked tactic from a
   prior round, not a draft (see Idempotency): leave it alone, do not run it
   through this path. Finalizing reuses the draft's retained body as
   the starting context for its plan (step 3); pruning drops a draft that the
   round does not need (record why in the pruning commit message).
3. **Shape the subtree.** A leaf tactic is **exactly one PR**. Larger shapes
   become subtrees: child tactics carry `parent: <tactic-id>` (same-kind edge,
   `validateGraph` rule 6), and execution order is encoded with
   `blocked_by: [<tactic-id>...]` (rule 13; cycles rejected by rule 15). This
   is the graph home of `/plan-issue`'s sub-issue hierarchy and its
   sequencing auto-defer: order and precondition are `blocked_by` edges; a
   sequencing ambiguity that `/plan-issue` would park on office-hours parks
   here the same way (conservative aggregation → park). This subsumes
   `/plan-issue`'s open-blocker re-check: confirm each `blocked_by` id resolves
   to a real tactic (`validateGraph` rule 13) and gates only where the round
   intends — a dangling or already-satisfied edge is a decomposition error,
   not a valid gate. Resolve by cause: a dangling id that is plainly a typo of
   a real tactic — correct it silently; an edge whose target was legitimately
   pruned or already completed — drop the edge; anything where the original
   intent is not recoverable from the graph — park (unverifiable blocker,
   Autonomy contract, above) rather than guessing.
4. **Gate in-scope copy** (`strategy-author-approved-copy`). Any tactic this
   round mints that *produces in-scope copy* must be `blocked_by` a born-parked
   author-approval gate, so the author ratifies the wording *before*
   implementation runs. This applies the gate `strategy-author-approved-copy`
   standardizes mechanically, instead of re-deriving it from the strategy text
   each round. For every decomposed tactic:
   - **Classify** it as copy-touching or not, by judgment against the
     strategy's scope — the planning agent already holds full scope in hand, so
     this is a checklist step, not mechanized scope detection. In-scope copy:
     the landing page, the about page, app heroes and onboarding text, the
     README, and blog posts. Explicitly **excluded**: in-app UI strings,
     practitioner reference docs (`SCHEMA.md`, package READMEs), and GitHub
     issue/PR prose. Exempt: mechanical fixes (typos, broken links, factual
     corrections with no reframing and no new claims) are ungated; any doubt
     means gated.
   - **Mint a sibling approval gate** in the born-parked shape (Step 4;
     `intentions/tactic-readme-copy-approval.md` is the reference instance):
     `owner: human`, `status: delegated`, `office_hours: {reason, since}` set at
     creation, `serves: [<the-serving-strategy>]`, and — being born-parked — no
     implement-phase body and `phase` omitted. The gate's `office_hours.reason`
     names the specific copy to review and folds in the ratify-or-revise ask
     (the born-parked reason convention). Chunk each gate to ≤30 author-minutes.
   - **Set `blocked_by: [<gate-id>]`** on the copy-producing tactic, so the
     router cannot select the copy work until the author completes the gate.
   - **Carry the draft copy in the copy tactic's body** (its plan), so the
     author has concrete wording to ratify or revise at office-hours and the
     implementing session settles only the remaining wording, within the
     approved copy.
   The gate tactic *is* a born-parked tactic — Step 4's shape governs it; point
   at Step 4 rather than restating the born-park mechanics here.
5. **Stamp the `validates` edge.** On each tactic that validates the signal —
   produces its reading or meets its threshold — set
   `validates: [<strategy-id>]` (the factual edge; `validateGraph` rule 14
   requires the target resolve to a `kind: strategy` node). These are the
   terminals of the calculated-attention signal term (strategy clarification
   11). The instrument tactic that produces the reading is a validates-terminal.
6. **Off-path work gets no flag.** Work worth recording but off the minimum
   signal path lands as an ordinary tactic with **no** special marker.
   Off-path status is *derived* at read time from the absence of a
   `blocked_by`/`parent` chain to a validates-terminal — calculated attention
   demotes it (strategy clarifications 9, 11). Never defer such work by
   omission and never invent a flag for it — record it fully and let the
   derivation demote it.

**Finalization: greenfield-relevance gate** (strategy clarification 26).
Before finalizing any draft (item 2) or recording any newly-decomposed unit
(item 3), run the greenfield-relevance gate: check the unit's subject against
non-draft nodes elsewhere in the graph that delete or supersede it (a raw
draft never obsoletes live work). Per-unit: drop a doomed unit from the plan,
naming the superseding node in the drop; a tactic that is *fully* superseded
demotes to draft instead of landing `phase: implement`; a tactic on doomed
surface may be kept selectable only via an explicit interim-live-risk
exception naming its expiry event (e.g. "until the gh-queue drains"). This is
the same gate `/align-strategy`'s improvement pass runs across the whole
corpus — here it runs against this round's specific decomposition.

**Sole-tracker recording guidance** (strategy clarification 28). The graph
is the source-of-truth issue tracker, bug tracker included: every defect
worth fixing — surfaced during drift review, during decomposition, or found
incidentally — lands as a tactic (or a unit of an existing one), never a
side channel. Code `TODO`s stay pointer-only (`TODO(tactic-<id>)`), never
carrying the substance themselves.

## Step 3 — Plan each claude-eligible tactic

For every claude-eligible leaf tactic, produce a full clean-session plan and
write it into the tactic's node body. Reuse `/plan-issue`'s Explore/Plan
subagent fan-out and its plan-quality bar verbatim — only the landing changes.

**Explore/Plan fan-out.** This skill runs in the caller's thread, so it fans
out the built-in `Explore` and `Plan` subagents directly (no orchestrator, no
nesting), exactly as `/plan-issue` Steps 3–5:

- Launch up to **3** `Explore` agents in parallel (usually 1), reuse-first:
  have them hunt existing functions, utilities, and patterns to reuse rather
  than propose new code. The built-in agents skip `CLAUDE.md` and git history,
  so pass the tactic's scope and the strategy's intent inline; require a
  compact `path:line`-anchored findings block, not whole-file dumps.
- Launch **1–3** `Plan` agents (usually 1; multiple only for large or
  architectural work, each a distinct framing per
  `.claude/rules/design-proposals.md` — lead with the ideal greenfield design,
  add a brownfield migration path when warranted). Feed each the Explore
  findings, the tactic scope, the plan schema below, and the `/implement-unit`
  model-selection heuristic inline (the `Plan` agent will not read the skill
  file). Synthesize multiple proposals into a single recommended approach.
- Trivial tactics (a typo, a one-line change, a simple rename) skip the
  fan-out — write the one-unit plan directly.

**Plan schema (node body).** The body carries the same schema `/plan-issue`
persists to its plan comment (§4 coverage matrix: "Tactic node body, same
schema"):

- **Context** — why this change is being made: the problem, what prompted it,
  the intended outcome.
- An ordered list of **units of work**, each with:
  - **Scope** — files/behavior that change, what is out of scope, with
    `path:line` anchors so the build delegates each unit to `/implement-unit`
    without re-reading source.
  - **Recommended model** — `sonnet` or `opus`, per the model-selection
    heuristic at `.claude/skills/implement-unit/SKILL.md` (lines 31–39; the
    canonical home — do not restate the bullets here, same convention
    `.claude/rules/planning.md` uses).
  - **Dependencies** — prior units that must complete first (omit if none).
- **Reuse** — existing functions/utilities to reuse, with their file paths.
- **Verification** — how to test end-to-end. Auto-runnable checks (test
  suites, typechecks, builds) go in fenced ` ```verify ` blocks; invoke an
  app's unit suite as `npx vitest run --project <app> --root <repo_root>` (the
  CI-equivalent form — never `--root <app>`, which scopes vite's
  `server.fs.allow` to the app and denies root-hoisted `?url` asset imports).
  Manual steps, observe-in-production checks, and judgment calls stay as prose.

Write the plan so a **fresh session with only the node body** can execute it —
the body is the sole carrier to the `implement` phase (the phase boundary is
the context clear, exactly as `/plan-issue`'s persisted comment is). Do **not**
copy `/plan-issue`'s "Plan preface": that is a gh terminal procedure citing
retired `dispatch-*` scripts. The graph-native implement/qa/review progression
is driven by the router reading the node's `phase`, not by an embedded
procedure.

Each planned tactic lands `phase: implement`.

## Step 4 — Park non-claude-eligible tactics

Work that needs the author (not claude-executable) is authored **born-parked**:
`office_hours` set at creation, and chunked so each parked leaf is
≤30 author-minutes (`intentions/tactic-graph-native-dispatch.md` §1.3). Do not
plan an implement-phase body for a born-parked tactic — it carries only its
statement and the reason it needs a human.

The copy-approval gate minted by Step 2 ("Gate in-scope copy") is an instance
of this born-parked shape — this section's mechanics govern it.

## Step 5 — Record

The write path mirrors `/align-strategy` Step 5 exactly — `write-node.ts` is
the single validation gate; never hand-author YAML frontmatter, and
`graph-commit` is the **only** landing path.

**Capture a base manifest for every pre-existing node this round edits** —
the serving strategy (a drift clarification, a `rounds` bump, a park) and any
existing tactic finalized from a draft. Dump them through `dump-node.ts`
*before* rewriting, then pass the manifest to `graph-commit --base` (item 3)
so a stale read of a live node is refused mechanically rather than by rebase
luck (the 2026-07-06 near-miss). Nodes this round **creates** have no
origin/main blob and take no `--base` entry.

```bash
BASE=$(npx tsx packages/intentionsutil/scripts/dump-node.ts \
  --out-dir "$TMPDIR/dump" <pre-existing-id> [<pre-existing-id> ...])
```

**Artifact-owner placement** (strategy clarification 27): `serves` names the
strategy that actually owns the artifact the tactic changes. Normally that is
the strategy under decomposition, but a byproduct that genuinely changes a
different strategy's artifact (e.g. a finalized draft retained here that
touches another strategy's surface) uses an honest multi-entry `serves`
naming every owning strategy — never a force-fit onto the strategy being
decomposed just because it is convenient. When no strategy owns the
artifact, surface the gap (a park, or a note for the author) instead of
assigning ownership by proximity.

Per tactic:

1. **Frontmatter via `write-node.ts`.** Construct the full node JSON —
   `kind: "tactic"`, `owner`, `status: "codified"`, `serves: [<strategy-id>]`
   (rule 7 requires a tactic's `serves` resolve to a strategy), `parent` for a
   subtree child, `blocked_by`, `validates` for a signal-validating tactic,
   `phase: "implement"` (born-parked tactics: omit `phase`, set
   `office_hours`). Leave `execution: null` — the execution object is the
   router's live in-flight record, populated when it launches the worker in a
   worktree, not plan-time state, so a freshly planned tactic lands
   `phase: implement` with `execution: null` (the router later populates
   `execution` as the tactic advances, so a node already past `implement` will
   show a populated object — that is router state, not plan-time state).
   These are **first-class** frontmatter fields (`schema.ts`
   promoted
   `phase`/`execution`/`validates`/`blocked_by`/`office_hours`/`rounds`); write
   them at top level, not squatted under `attributes` — `validateNode`
   silently drops unknown top-level keys, so a mistyped field vanishes. Pipe or
   `--file` the JSON into `write-node.ts`:

   ```bash
   npx tsx packages/intentionsutil/scripts/write-node.ts --file "$TMPDIR/tactic.json"
   ```

2. **Plan body via `Edit`.** `write-node.ts` lands only frontmatter;
   `writeNode` preserves an existing tactic body verbatim across
   frontmatter-only rewrites. Immediately `Edit` the node body (everything
   after the closing `---` fence) to carry the full clean-session plan. When
   finalizing a draft, this replaces the retained draft body with the plan.

3. **Land via `graph-commit`.** One `graph-commit` per tactic, or a small
   batch (e.g. a parent plus its immediate children, or the drift-clarified
   strategy alongside the round's tactics) in one call:

   ```bash
   packages/intentionsutil/scripts/graph-commit --base "$BASE" \
     <tactic-id> [<tactic-id> ...] [<strategy-id>]
   ```

   Pass `--base "$BASE"` (the manifest from `dump-node.ts` above) whenever the
   call touches a pre-existing node; omit it for a round that only creates new
   tactics. `--base` covers only the dumped pre-existing ids — newly created
   ids in the same call are simply absent from the manifest and unchecked.
   `graph-commit` stages exactly `intentions/<id>.md` for each id (frontmatter
   and the body `Edit` both live there), commits, stamps the four required
   checks via the `graph/**` fast path, and fast-forwards onto `main` with a
   bounded rebase-retry loop. It has **two** distinct exit-1 cases,
   discriminated by the presence of a parking message. If it exits 1 having
   printed a parking message (`... parking node(s) — this writer's content is
   NOT landed`), a concurrent writer landed an overlapping edit to the same
   node: the node landed with `office_hours` set instead of the intended
   content, and this session's unlanded content is preserved on disk. If it
   exits 1 with **no** parking message — instead the busy-main exhaustion error
   ending `... retry later` — nothing landed and no `office_hours` was set:
   `main` stayed busy (or the required checks never stamped green) across all
   `MAX_PUSH_ATTEMPTS`, with no semantic conflict. Either way, report it and
   stop — do not retry automatically within this session.

**Strategy round accounting.** Ensure the serving strategy carries a `rounds`
object (`validateGraph` rule 12 — strategies only). On the first round,
initialize `rounds: {count: 0, last_completed: null, last_aligned: null}` if
null. `count` increments and `last_completed` timestamps when the round's
**final** tactic completes — a completion-time write behind prod verification
(`intentions/tactic-graph-native-dispatch.md` §1.1; in the bootstrap interim
with no live router, that stamp is made by hand at completion). `last_aligned`
is a **separate, landing-time** stamp: when a strategy round (this skill,
invoked over the whole strategy — not the per-node finalize form below) lands
its tactics for a strategy, this session also sets that strategy's
`rounds.last_aligned` to the round's commit date (`date -u +%Y-%m-%d`) via
`write-node.ts`, bundled into the **same** `graph-commit` as the round's
tactics. `last_aligned` tracks when the strategy was last decomposed, distinct
from `count`/`last_completed`, which stay keyed to tactic-completion time (per
clarification 22) — its semantics are unchanged by this stamp. A **per-node
finalize** invocation (`/align-tactics <tactic-id>`, i.e. passing a specific
tactic id argument) does **not** stamp `last_aligned` — it is not a strategy
round and never bumps `rounds` at all (per clarification 52). Any strategy
frontmatter this session does change (a drift clarification, a park, the
`rounds` init, the `last_aligned` stamp) lands via `graph-commit
<strategy-id>`, bundled with the round's tactics when small.

**Fingerprint honesty.** `execution.strategy_fingerprint` is a **per-strategy
map** `{<strategy-id>: {hash, sha}}` — one entry per serving strategy — that
the router's soft-freeze trigger compares against each serving strategy's
current substance (strategy clarification 10). At mint time this session stamps
only the **decomposed** strategy's entry: `{<decomposed-strategy-id>: {hash:
strategyFingerprint(strategy), sha: <origin/main sha>}}`, where the `hash` is
`strategyFingerprint(strategy)` from `packages/intentionsutil/src/router.ts` —
always that helper, never a hand-computed hash — and `sha` is the origin/main
commit the hash was taken against, obtained with `git rev-parse origin/main` in
the bootstrap-interim hand-stamp path (a live router passes it through
`apply-node-transition.ts --strategy-sha`). A serving strategy absent from the
map is never stale (per-strategy null), so an honest multi-serves tactic is not
born frozen against its other serving strategies; those entries are filled by
whichever session decomposes or re-evaluates each of them. Untouched
sibling-strategy entries in the same map are left as-is — this session converts
only the key it is re-stamping, never a key it is not touching (opportunistic
conversion, not bulk migration). A tactic not yet advanced still carries
`execution: null` (no map to stamp); the map is seeded the first time an
`execution` object exists. The bare-string form is deprecated-legacy — never
emit it. In the bootstrap interim with no live router, the mint-time stamp is
made by hand at completion; the freeze-on-mismatch rule is otherwise discharged
by running re-evaluation in the **same session** as the strategy edit (below).

Dropping the bare-string form entirely, and making `validate-graph` **reject**
it, is sequenced future work (migration step 4), not this change — bare strings
remain valid deprecated-legacy, and only classification-touched keys convert to
the `{hash, sha}` object form.

## Re-evaluation mode

When invoked after a mid-flight strategy edit — the router detects a stale
`execution.strategy_fingerprint` on an open tactic and queues one
re-evaluation session (strategy clarification 10) — the session does **not**
decompose fresh. It:

1. Reads the edited strategy and its open (non-draft, non-`done`) tactics —
   **every** open child's body is read in full before disposition. Keyword
   grep over the open tactics (e.g. to shortlist candidates touching an
   edited term) is a shortlisting heuristic only; it never disposes of a
   tactic — disposition of each open child requires the full-body re-read
   (strategy clarification 32).
2. **Amends, prunes, or confirms** each open tactic against the edited
   substance — revise a plan whose premise changed, prune a tactic the edit
   made unnecessary, confirm one still valid — rather than authoring a new
   round. **Amendment completeness** (clarification 32): an amendment is
   complete only when the tactic's **whole node** — `statement`,
   `rationale`, the `## Context` prose, every unit, and `## Verification` —
   is reconciled against the full current strategy substance in this same
   round. A one-bullet delta that leaves a sibling unit or a verification
   step contradicting the amendment is an incomplete amendment — the same
   defect class as an incomplete record (condition 7). This also applies
   whenever this skill amends an already-landed tactic outside a formal
   re-evaluation trigger (e.g. a drift-review Side A/B correction to an open
   tactic): the whole-node reconciliation bar binds there too, not just at a
   fingerprint-triggered re-evaluation.
3. Re-stamps **only the re-evaluated strategy's entry** in each surviving
   tactic's `execution.strategy_fingerprint` map — set
   `map[<re-evaluated-strategy-id>] = {hash: strategyFingerprint(strategy),
   sha: <origin/main sha>}` (`hash` via `strategyFingerprint` from
   `packages/intentionsutil/src/router.ts`; `sha` via `git rev-parse
   origin/main` in the bootstrap-interim hand-stamp path, or
   `apply-node-transition.ts --strategy-sha` under a live router), leaving every
   other serving strategy's entry untouched — which unfreezes the subtree
   against this strategy without disturbing the others. (A tactic still at
   `execution: null` has no map to re-stamp until the machinery seeds one.)
4. Lands the amendments via `graph-commit`.

Until a live router exists, re-evaluation runs **inline** in the same session
that recorded the strategy edit — the way every round on
`strategy-graph-native-dispatch` has executed it by hand.

**Per-node re-evaluation.** Under `tactic-graph-frozen-tactic-dispatch`, the
router may now queue re-evaluation as a **per-node** `/align-tactics
<tactic-id>` session targeting exactly one soft-frozen tactic, rather than only
the strategy-wide open-child sweep this section historically described. The
disposition bar is identical — the same whole-node reconciliation (item 2) and
single-strategy re-stamp (item 3) — applied to the one target. See "Tactic
target — per-node finalize or re-plan", above, for that flow.

A strategy-corpus census script is planned as an enumeration hook for the
open-child sweep above (`tactic-align-tactics-mechanical-floor` Unit 2);
until it lands, enumerate open children by hand per the Idempotency section's
`grep -rl` recipe.

## Out of scope

- The router's consumption of `phase` (selection, transitions, the soft-freeze
  gate) — `tactic-graph-router-selector` / `tactic-graph-router-transitions`,
  not this skill.
- `/align-strategy` (recording the strategy under interview) and `/align-init`
  (fork onboarding) — sibling skills.
- Deleting `/plan-issue` / `/file-issue` — that is
  `tactic-legacy-router-removal`, gated on the legacy gh queue draining. Both
  keep working for gh-issue work throughout this skill's rollout.
- `phase: main-qa` — it is in the spec enum (strategy clarification 22) but
  **not** in `schema.ts`'s `PHASES`, so `write-node.ts` would throw on it.
  This skill lands only `phase: implement` (and consumes drafts); needs-main
  residue rides the source tactic into `main-qa` under the router, never
  something this skill stamps.

## Verification

Prose — this is an autonomous decomposition skill; its output is graph state,
verified by re-running against a small strategy with a null `reading`:

- Round 1 includes an instrument tactic (the null-reading requirement).
- Leaves are PR-sized; each planned tactic body carries the plan schema with
  per-unit `Recommended model` tags and, where applicable, fenced ` ```verify `
  blocks.
- The written nodes pass
  `npx tsx packages/intentionsutil/scripts/validate-graph.ts` — in particular
  `serves` resolves to the strategy (rule 7), `validates` to the strategy
  (rule 14), `blocked_by` to tactics with no cycle (rules 13, 15), and no
  tactic-only field lands on a non-tactic (rule 10).
- Signal-validating tactics carry `validates: [<strategy-id>]`; off-path
  tactics carry no flag.
- The tactics and any strategy frontmatter change land atomically via
  `graph-commit` (visible on `origin/main`), and **no** `gh issue`/`gh pr`
  command ran anywhere in the flow.
