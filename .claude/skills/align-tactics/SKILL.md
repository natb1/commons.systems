---
name: align-tactics
description: Autonomously break a recorded `strategy-*` intention node into PR-sized tactic subtrees carrying full clean-session plans — the graph-native successor to `/plan-issue` and `/file-issue`'s epic-structuring role. Two-sided drift review, decompose to the signal, plan each claude-eligible tactic into its node body, park the rest; lands via `graph-commit`. Never files a GitHub issue; never `AskUserQuestion` mid-run.
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

On-demand or router-invoked. The sole argument is the id of the strategy to
decompose: `/align-tactics strategy-<slug>`. With no argument, stop and report
that a strategy id is required — this skill never selects its own target.

## Autonomy contract

Runs to completion without user interaction. Parks to `office_hours` — never
`AskUserQuestion` — under `/plan-issue`'s three conditions:

- **Requirement ambiguity** — a strategy term or clarification has multiple
  plausible readings that would change the decomposition.
- **Major scope deviation** — the minimum round to validate the signal
  deviates substantially from what the strategy's recorded substance implies.
- **Unverifiable blocker** — a `blocked_by` precondition or drift signal that
  cannot be resolved from the graph alone.

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

## Idempotency

`/align-tactics` decomposes one strategy into N tactics, so idempotency is
**per-tactic**, not a single strategy-level marker. Before planning, read the
strategy's existing non-draft child tactics (grep `intentions/tactic-*.md` for
`serves: [<strategy-id>]` with `phase` set and non-`draft`/non-`done`). A
tactic already at `phase: implement` with a plan in its body is done work — do
not re-plan it. A partial prior run (some tactics landed, some not) resumes by
planning only the missing ones. Draft tactics (`phase` absent) are **input**,
not landed work: they are consumed in step 2.

## Step 1 — Scope and two-sided drift review

Read the strategy node's frontmatter (`readNode` via a small `tsx` one-liner,
or just read the file — only the frontmatter is authoritative): `statement`,
`rationale`, `success_signal`, `reading`, `gap`, `clarifications`,
`attributes.conditions`, `rounds`, and its draft child tactics (their bodies
carry retained tactical context from `/align-strategy`).

**Eligibility sanity check.** Confirm the strategy is actually decomposable
this round (`intentions/tactic-graph-native-dispatch.md` §3.1): `office_hours`
null, signal unvalidated (`gap` non-null or `reading` null), the fresh-reading
gate holds, and `rounds.count < 2`. If `rounds.count` is already at the cap
with no fresh reading, park the strategy (round history as the reason) instead
of burning a third round.

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

Every clarification `answer` ends with a provenance sentence in the existing
convention, e.g. `"...Recorded 2026-07-05 /align-tactics round."` (date via
`date -u +%Y-%m-%d`).

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
2. **Consume the draft tactics.** Each draft child (`phase` absent, retained
   by `/align-strategy`) is **finalized, split, merged, or pruned** — it is
   input, never left dangling. Finalizing reuses the draft's retained body as
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
   not a valid gate.
4. **Stamp the `validates` edge.** On each tactic that validates the signal —
   produces its reading or meets its threshold — set
   `validates: [<strategy-id>]` (the factual edge; `validateGraph` rule 14
   requires the target resolve to a `kind: strategy` node). These are the
   terminals of the calculated-attention signal term (strategy clarification
   11). The instrument tactic that produces the reading is a validates-terminal.
5. **Off-path work gets no flag.** Work worth recording but off the minimum
   signal path lands as an ordinary tactic with **no** special marker.
   Off-path status is *derived* at read time from the absence of a
   `blocked_by`/`parent` chain to a validates-terminal — calculated attention
   demotes it (strategy clarifications 9, 11). Never defer such work by
   omission and never invent a flag for it — record it fully and let the
   derivation demote it.

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

## Step 5 — Record

The write path mirrors `/align-strategy` Step 5 exactly — `write-node.ts` is
the single validation gate; never hand-author YAML frontmatter, and
`graph-commit` is the **only** landing path.

Per tactic:

1. **Frontmatter via `write-node.ts`.** Construct the full node JSON —
   `kind: "tactic"`, `owner`, `status: "codified"`, `serves: [<strategy-id>]`
   (rule 7 requires a tactic's `serves` resolve to a strategy), `parent` for a
   subtree child, `blocked_by`, `validates` for a signal-validating tactic,
   `phase: "implement"` (born-parked tactics: omit `phase`, set
   `office_hours`). Leave `execution: null` — the execution object is the
   router's live in-flight record, populated when it launches the worker in a
   worktree, not plan-time state; the worked example
   (`intentions/tactic-align-tactics-skill.md`) lands `phase: implement` with
   `execution: null`. These are **first-class** frontmatter fields (`schema.ts`
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
   packages/intentionsutil/scripts/graph-commit <tactic-id> [<tactic-id> ...] [<strategy-id>]
   ```

   `graph-commit` stages exactly `intentions/<id>.md` for each id (frontmatter
   and the body `Edit` both live there), commits, stamps the four required
   checks via the `graph/**` fast path, and fast-forwards onto `main` with a
   bounded rebase-retry loop. If it exits 1 having printed a parking message,
   a concurrent writer landed an overlapping edit to the same node: the node
   landed with `office_hours` set instead of the intended content, and this
   session's unlanded content is preserved on disk. Report it and stop — do
   not retry automatically.

**Strategy round accounting.** Ensure the serving strategy carries a `rounds`
object (`validateGraph` rule 12 — strategies only). On the first round,
initialize `rounds: {count: 0, last_completed: null}` if null. `count`
increments and `last_completed` timestamps when the round's **final** tactic
completes — a completion-time write behind prod verification
(`intentions/tactic-graph-native-dispatch.md` §1.1; in the bootstrap interim
with no live router, that stamp is made by hand at completion). Any strategy
frontmatter this session does change (a drift clarification, a park, the
`rounds` init) lands via `graph-commit <strategy-id>`, bundled with the round's
tactics when small.

**Fingerprint honesty.** `execution.strategy_fingerprint` is where the router's
soft-freeze trigger will record the serving strategy's substance hash
(strategy clarification 10). In the bootstrap there is no `execution` object to
seed and no fingerprint helper exists — so there is no fingerprint field to
write yet (every node in `intentions/tactic-graph-native-dispatch.md` §5
carries `execution: null` / a null fingerprint). When the hashing and router
machinery lands, the router stamps `execution` — fingerprint included — at
plan/launch time. Until then the freeze-on-mismatch rule is discharged by
running re-evaluation in the **same session** as the strategy edit (below),
exactly as every recorded round has.

## Re-evaluation mode

When invoked after a mid-flight strategy edit — the router detects a stale
`execution.strategy_fingerprint` on an open tactic and queues one
re-evaluation session (strategy clarification 10) — the session does **not**
decompose fresh. It:

1. Reads the edited strategy and its open (non-draft, non-`done`) tactics.
2. **Amends, prunes, or confirms** each open tactic against the edited
   substance — revise a plan whose premise changed, prune a tactic the edit
   made unnecessary, confirm one still valid — rather than authoring a new
   round.
3. Re-stamps each surviving tactic's `execution.strategy_fingerprint` to the
   current substance (seeded `null` until the machinery lands), which unfreezes
   the subtree.
4. Lands the amendments via `graph-commit`.

Until a live router exists, re-evaluation runs **inline** in the same session
that recorded the strategy edit — the way every round on
`strategy-graph-native-dispatch` has executed it by hand.

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
