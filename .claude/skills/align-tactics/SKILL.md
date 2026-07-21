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
  `packages/intentionsutil/src/router.ts:496`). This is the per-node target
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
   already exists with a live session — `worktree_has_live_session <path>
   "$CLAUDE_CODE_SESSION_ID"`
   (`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:15`,
   run with `dangerouslyDisableSandbox: true`) — the claim is held by
   another session: stop and report the held claim, then end the run. Pass
   this session's own id as the second (exclusion) argument so a
   graph-launched orchestrator — the strategy-lane spawn in
   `dispatch-graph-execute` uses `dispatch-spawn-job --name "$id"`, whose
   name equals this worktree's basename — does not match its own
   just-spawned session as a pre-existing claim; a genuinely different live
   session in the same worktree still counts as a held claim and stops the
   run. A held claim is **not** an `office_hours` park (it is not one of the
   three autonomy-contract conditions below) and **not** a defect.
3. **Enter the worktree — on a verified-fresh checkout.** Otherwise create
   or re-enter it, and do all authoring and the step-5 `graph-commit` from
   there. The worktree **is** the claim: the same live-session ⇔ worktree
   liveness rule the router uses, so no separate lock is needed. **Prefer
   `provision-node-worktree`**
   (`.claude/skills/dispatch-propagate/scripts/provision-node-worktree`): it
   fetches `origin/main` and cuts the worktree fresh from it, so no separate
   freshness check is needed after it. If instead this run uses native
   `EnterWorktree`, **or** re-enters an **already-existing** worktree by any
   means **other than `provision-node-worktree`**, running
   `.claude/skills/dispatch-propagate/scripts/assert-worktree-fresh` is
   **mandatory** as the very first action in that worktree — **before any
   graph read** (before any `readNode` or drift grep below). A non-zero exit
   means the checkout is stale **or** the `git fetch` itself failed; either
   way, **STOP** and freshen (`git fetch origin main && git merge
   origin/main`) before proceeding. Never treat a failed fetch as license to
   proceed on unverified state.

## Tactic target — per-node finalize or re-plan

When the argument is a `tactic-<slug>` (not a `strategy-<slug>`), this session
operates on **exactly one pre-existing tactic node** — the router queued it
because its `frozenTacticSelectable` gate approved it as an `align-tactics`
candidate (`packages/intentionsutil/src/router.ts:496`;
`resolveFrozenDescendant` at line 467 is the strategy-side inverse the selector
uses). Both consult the graph **selector** (`selectGraphTargets`): selectability
(phase/status/`office_hours`/blockers) is already decided before this session
runs, so this session does **not** re-decide it — it only picks the disposition
and lands the write. There is **no** strategy decomposition, no draft sweep, and
no `rounds` bump here — Steps 1–2 below are the strategy-target flow; this
subsection is the parallel tactic-target flow, reusing pieces of them **by
reference**. It runs the same Step 0 claim/worktree mechanics (keyed on the
tactic id) and the same Autonomy contract (below).

Like the strategy-target flow, the decompose/plan judgment runs **inside the
Workflow** (`.claude/workflows/align-tactics.js`), not on this caller thread —
invoked in `mode: "tactic"`, where the `decompose` phase is skipped entirely
(there is nothing to decompose; only this one node's plan body needs authoring,
or its re-plan reconciliation). This session's job around it is the same
three-part shape as Step 1/Step 2: **assemble the input, invoke the Workflow,
and land the single-node graph write it returns** (via the Step 2 writer).

**Read the node and decide draft/raw vs soft-frozen.** A frozen tactic target is
**either** draft/raw or soft-frozen; read its frontmatter to tell which. This
session picks the `phase` value it will land, but the finalize-vs-re-plan
*judgment* (what the reconciled body should say) is the Workflow's tactic-mode
job, not this thread's:

- **Draft/raw** (`phase` absent — `phase: null`, never decomposed) →
  **finalize** it: land it at `phase: implement` with a full clean-session plan
  in its body per the Step-2 plan schema (the Workflow authors that body). Do
  **NOT** sweep the serving strategy's other draft tactics — that draft
  consume/split/merge/prune path is the strategy-target flow's job (the
  Workflow's decompose phase, Step 1). Do **NOT** bump the strategy's `rounds`
  counter — round accounting is completion-time and prod-verified (see "Strategy
  round accounting" in Step 2). **Whole-node reconcile** (clarification 32, per
  "Re-evaluation mode" item 2): the Workflow rewrites any stale draft narrative
  in `statement`, `rationale`, `attention.rationale`, and the body so none of it
  contradicts the finalized state — **while preserving the authored
  `attention.boost` value** (do not reset or renumber it). Frontmatter on
  landing: `status: codified`, `phase: implement`, `execution: null`, and
  `validates: []` unless this tactic itself produces the strategy's signal
  reading (in which case `validates: [<strategy-id>]`, the Step-2 frontmatter
  convention).

- **Soft-frozen** (`phase` already set to an in-flight value — `implement`,
  `fix`, `qa` — but its `execution.strategy_fingerprint` entry for one serving
  strategy is stale) → **re-plan** it. This is exactly "## Re-evaluation mode"
  (below) applied to this **one** tactic instead of a strategy-wide open-child
  sweep. The Workflow reconciles the whole node against the current
  serving-strategy substance (the whole-node reconciliation bar, clarification
  32, per Re-evaluation mode item 2). **Preserve the existing in-flight
  `phase`** — a re-plan reconciles the body, it never relabels the tactic back
  to `implement`; so `args.target_node.phase` carries the current phase and the
  Step-2 writer lands that same phase, overriding Step 2 item 1's new-tactic
  `phase: implement` default. Re-stamp **only** the re-evaluated strategy's entry
  in `execution.strategy_fingerprint` to the `{hash: strategyFingerprint(strategy),
  sha: <origin/main sha>}` object form (Re-evaluation mode item 3) and leave
  every other serving strategy's entry untouched (a tactic still at
  `execution: null` has no map to re-stamp).

**Build `args`.** Assemble the Workflow input in `mode: "tactic"`:

```
args = {
  mode:         "tactic",
  strategy:     { id, statement, rationale, success_signal, reading, gap,
                  clarifications: [ ... ], conditions: [ ... ],
                  rounds: { count, last_completed, last_aligned } },  // serving strategy, READ-ONLY context
  target_node:  { id, statement, rationale, body, phase },            // the single tactic being (re)planned
  reuse_hunts:  [ { focus, scope }, ... ],                            // up to 3 (default 1)
  existing_ids: [ ... ],                                              // pre-existing ids in the strategy's corpus
}
```

`args.strategy` is the serving strategy's substance as **read-only context** for
the Workflow's finalize-vs-re-plan judgment — the Workflow reads it; this
session's apply-result writer **never** edits the strategy. `target_node.phase`
is the value read above (absent for draft/raw, the in-flight phase for
soft-frozen); it is how the Workflow's tactic-mode prompts tell finalize from
re-plan. The router's `frozenTacticSelectable`/`resolveFrozenDescendant` gates
decide only *selectability* against the live selector — **not** the
reconciliation — so the serving strategy's substance must ride in `args` for the
Workflow to judge draft-vs-soft-frozen disposition and reconcile the node
against it.

**Invoke the Workflow tool on `.claude/workflows/align-tactics.js`**, passing
`args` (this skill is a sanctioned caller — no `ultracode` keyword). It returns
the single target tactic with its authored `body_markdown` merged in, plus any
`plans`/`parks`; the `tactics` array holds exactly the one node, and `gates`,
`prunes`, and `greenfield_drops` are empty in tactic mode.

**Apply the result via the Step 2 writer, above.** The single-node result lands
through the **same** apply-result writer as the strategy-target flow —
"## Step 2 — Apply the Workflow result" — with one node (not a subtree) to
write: `dump-node.ts` (base manifest) → `write-node.ts` (frontmatter, with the
`phase` decided above) → body `Edit` (the Workflow's `body_markdown`) →
`graph-commit --base`. Do **not** duplicate that writer here; the only
tactic-mode specializations are the `phase` choice above (`implement` for a
finalize, the preserved in-flight phase for a re-plan) and the single-strategy
fingerprint re-stamp on a soft-frozen re-plan. In the single-node shape of the
Step-2 mechanic the base manifest and commit name exactly one id:

```bash
BASE=$(npx tsx packages/intentionsutil/scripts/dump-node.ts \
  --out-dir "$TMPDIR/dump" <tactic-id>)
packages/intentionsutil/scripts/graph-commit --base "$BASE" <tactic-id>
```

**Exception: a re-plan (or a strategy-scope `split` disposition) that discovers
a genuine split.** If a soft-frozen re-plan, or a strategy-scope `split`
disposition (the Workflow's decompose phase, landed via Step 2), finds the
tactic must split into a new born-parked sibling, that sibling is genuinely new
work — but it must never land via a separate later `graph-commit` call. Land the
parent edit and the new sibling in the **same** `graph-commit --base "$BASE"
<tactic-id> <new-sibling-id>` call; the `--base` manifest still covers only
the pre-existing parent id, and the new sibling — having no `origin/main`
blob — is simply absent from it. This closes the 2026-07-18 near-miss: a
parent edit landed alone as `c037cec7`, the sibling-add `graph-commit` lost
the push race five times and landed nothing, leaving `main` with a parent
describing a split sibling that did not exist there — recovered same-day as
`032768e5`.

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
escalation and born-parked (tactics and copy-approval gates the Workflow emits
with `office_hours` set) alike. Transitional note: a first-class
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

## Step 1 — Build `args` and invoke the Workflow

The strategy-target decomposition — the two-sided drift review, the
decompose-to-signal judgment, and the per-tactic plan authoring — runs inside
the `align-tactics` Workflow (`.claude/workflows/align-tactics.js`), **not** on
this caller thread. The Workflow does pure subagent fan-out + JS aggregation and
touches no files, git, or graph state. This session's job around it is to
**assemble the input**, invoke the Workflow, and **land the graph writes** it
returns (Step 2). The Sonnet/Opus model tiering (the reuse hunts run on Sonnet,
the drift/decompose/plan judgment on Opus) is structural inside the Workflow —
this session no longer re-types a `model:` at each subagent callsite.

**Gather the input.** Read the strategy node's frontmatter (`readNode` via a
small `tsx` one-liner, or just read the file — only the frontmatter is
authoritative): `statement`, `rationale`, `success_signal`, `reading`, `gap`,
`clarifications`, `attributes.conditions`, and `rounds`. Read its draft child
tactics (their bodies carry retained tactical context from `/align-strategy`)
and its existing non-draft children — the Idempotency section's `grep -rl`
recipe finds both, and tells a draft (`phase` absent **and** `office_hours`
unset) from a born-parked child (`phase` absent **with** `office_hours` set,
which is decided human-owned work, **not** a draft — leave it out of the input).

**Build `args`.**

```
args = {
  mode:              "strategy",
  strategy: {
    id, statement, rationale, success_signal, reading, gap,
    clarifications:  [ ... ],                 // the strategy's clarifications array
    conditions:      [ ... ],                 // attributes.conditions entries (Side-A drift)
    rounds:          { count, last_completed, last_aligned },
  },
  draft_tactics:     [ { id, statement, body }, ... ],   // phase-absent, office_hours-unset children only
  existing_children: [ { id, phase, on_signal_path }, ... ], // the non-draft children
  reuse_hunts:       [ { focus, scope }, ... ],          // up to 3 (default 1); omit to run one general hunt
  existing_ids:      [ ... ],   // every pre-existing real node id in the serving strategy's corpus,
                                //   for the Step-2 resolveTempRefs pass (edges to a pre-existing node pass through)
}
```

The eligibility sanity check (`office_hours` null, signal unvalidated, the
fresh-reading gate, no non-draft child already on the signal path,
`rounds.count < 2`) is the Workflow's drift phase — do **not** re-decide it here;
just supply the inputs it judges from.

**Invoke the Workflow tool on `.claude/workflows/align-tactics.js`**, passing
`args`. This skill is a sanctioned caller of that Workflow — no `ultracode`
keyword needed. The Workflow runs in the background and returns one structured
result:

```
result = {
  mode, drift,
  tactics:          [ ... ],   // the decomposed tactic set; each carries temp_ref, slug_hint,
                               //   kind/owner/status/serves/parent/blocked_by/validates,
                               //   claude_eligible, copy_touching, instrument, statement,
                               //   office_hours, draft_source_id, and body_markdown
                               //   (null for a tactic whose plan agent parked or died)
  plans:            [ ... ],   // one entry per claude-eligible tactic the plan phase authored
  gates:            [ ... ],   // born-parked author-approval (copy) gates, each with temp_ref,
                               //   slug_hint, serves, statement, office_hours_reason, blocks
  parks:            [ ... ],   // every park across drift/decompose/plan: {target, reason, category}
  prunes, greenfield_drops,
  findings_surfaced, findings_actionable, fixes_applied, followups_filed,
  subagents_launched, deviation, disposition,
}
```

The decomposition doctrine now lives in the Workflow's phase prompts — read
`.claude/workflows/align-tactics.js` for the full text; do **not** re-derive it
on this thread. In brief, so a fresh reader still knows *what* happens:

- **Two-sided drift review** (`buildDriftPrompt`) — Side A (a recorded
  `attributes.conditions` entry failed → park the strategy; conditions are
  human-decided) and Side B (the round's plans depend on an *unrecorded* premise
  → a **material** premise parks the strategy for author ratification, an
  **immaterial** one lands as a dated `clarifications` entry without
  interrupting). Absorbs `/plan-issue`'s relevance/drift, convention-drift, and
  merged-work-overlap review, with the graph as the corpus. Every clarification
  answer carries a dated provenance clause (`validateGraph` rule 17 enforces the
  date-presence half).
- **Decompose to the signal** (`buildDecomposePrompt`) — the **minimum** tactic
  set that validates `success_signal` this round (leaf = one PR): instrument-first
  when `reading` is null (strategy clarification 3), consume each draft
  (finalize / split / merge / prune — a split lands its parent edit and new
  sibling atomically, Step 2), shape the subtree via `parent` (rule 6) and
  `blocked_by` (rules 13, 15), gate in-scope copy behind a born-parked approval
  gate (`strategy-author-approved-copy`; the gate rides in `result.gates`, its id
  wired into the copy tactic's `blocked_by`, the draft copy carried in the copy
  tactic's body), the greenfield-relevance gate (clarification 26),
  `validates: [<strategy-id>]` on each signal-validating tactic (rule 14;
  clarification 11), off-path work carries **no** flag (clarifications 9, 11), and
  sole-tracker recording (clarification 28 — every defect lands as a tactic,
  never a side channel).
- **Plan each claude-eligible tactic** (`buildPlanPrompt`) — a full clean-session
  plan body per `/plan-issue`'s schema and quality bar (Context, units of work
  each with Scope / Recommended model / Dependencies, Reuse, Verification),
  authored on Opus so a fresh session with only the node body can execute it.

This session records the outcome regardless of `disposition` — a decomposition,
a set of parks, or both. `result.deviation` is LIVE: true when any park exists or
drift said do not proceed.

## Step 2 — Apply the Workflow result

The Workflow authored no files; **this session lands every graph write.** The
write path mirrors `/align-strategy` Step 5 exactly — `write-node.ts` is the
single validation gate (never hand-author YAML frontmatter), and `graph-commit`
is the **only** landing path.

**Reserve real node ids and resolve temp_refs.** The Workflow cannot know the
node count or slugs until it decomposes, so each new tactic in `result.tactics`
and each approval gate in `result.gates` carries a stable `temp_ref` and a
`slug_hint`, with its `parent`/`blocked_by` edges (and each gate's `blocks`)
expressed in `temp_ref`s — edges to a pre-existing draft/tactic use its
already-real node id. **Mint one real node id per new tactic and per gate** from
its `slug_hint`, deduped against the existing corpus (`grep -l
intentions/tactic-<slug_hint>.md`, or `grep -rl` the id across
`intentions/tactic-*.md`, for a collision; disambiguate with a suffix before
using it). Build the `temp_ref → real-id` map
over the **union** of tactics and gates, then rewrite every `parent`/`blocked_by`
edge (and each gate's `blocks`) naming a `temp_ref` to its resolved real id; an
edge already naming a real node id passes through unchanged.

`resolveTempRefs()` in `.claude/workflows/align-tactics.js` (between the
`// >>> resolveTempRefs >>>` sentinels) is the **validated** resolver — feed it
the tactic+gate set with each entry's minted `id`, plus the `existing_ids` from
Step 1, and it returns the edge-rewritten set or throws on a dangling reference
(rule 13) or a `blocked_by` cycle (rule 15). This step **mints** the ids and
**applies** that validated mapping; it does not re-implement the validation.

**Capture a base manifest for every pre-existing node this round edits** —
the serving strategy (a drift clarification, a `rounds` bump, a `last_aligned`
stamp, or a park) and any existing tactic finalized from a draft
(`draft_source_id` set). Dump them through `dump-node.ts` *before* rewriting,
then pass the manifest to `graph-commit --base` (below) so a stale read of a live
node is refused mechanically rather than by rebase luck (the 2026-07-06
near-miss). Nodes this round **creates** (new tactics, new gates) have no
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

Per node (tactic or gate), sourced from the Workflow's structured result:

1. **Frontmatter via `write-node.ts`.** Construct the full node JSON from the
   Workflow's tactic/gate object — `kind: "tactic"`, `owner`, `status` (a
   claude-eligible tactic `codified`; a born-parked gate `owner: human`,
   `status: delegated`), `serves: [<strategy-id>]` (rule 7 requires a tactic's
   `serves` resolve to a strategy), `parent` for a subtree child, `blocked_by`
   (the resolved edges from the map above), `validates` for a signal-validating
   tactic. A tactic that carries a **non-null `body_markdown` and is not a park
   target** lands `phase: "implement"`; a **born-parked** tactic or gate (in
   `result.parks`, or carrying `office_hours`, or a gate) **omits** `phase` and
   sets `office_hours` (see Parks, below). Leave `execution: null` — the
   execution object is the router's live in-flight record, populated when it
   launches the worker in a worktree, not plan-time state, so a freshly planned
   tactic lands `phase: implement` with `execution: null` (the router later
   populates `execution` as the tactic advances, so a node already past
   `implement` will show a populated object — that is router state, not plan-time
   state). These are **first-class** frontmatter fields (`schema.ts` promoted
   `phase`/`execution`/`validates`/`blocked_by`/`office_hours`/`rounds`); write
   them at top level, not squatted under `attributes` — `validateNode`
   silently drops unknown top-level keys, so a mistyped field vanishes. Pipe or
   `--file` the JSON into `write-node.ts`:

   ```bash
   npx tsx packages/intentionsutil/scripts/write-node.ts --file "$TMPDIR/tactic.json"
   ```

2. **Plan body via `Edit`.** `write-node.ts` lands only frontmatter;
   `writeNode` preserves an existing tactic body verbatim across
   frontmatter-only rewrites. For each tactic with a **non-null `body_markdown`**
   (the Workflow merged the authored plan onto the tactic by `temp_ref`, from
   `PLAN_SCHEMA`'s `body_markdown`), immediately `Edit` the node body (everything
   after the closing `---` fence) to that `body_markdown`. When finalizing a
   draft, this replaces the retained draft body with the plan. A born-parked
   tactic or gate carries **no** implement-phase body — only its statement and
   the reason it needs a human.

3. **Land via `graph-commit`.** One `graph-commit` per tactic, or a small
   batch (e.g. a parent plus its immediate children, the drift-clarified
   strategy alongside the round's tactics, or a split-parent tactic alongside
   its new born-parked sibling) in one call:

   ```bash
   packages/intentionsutil/scripts/graph-commit --base "$BASE" \
     <tactic-id> [<tactic-id> ...] [<strategy-id>]
   ```

   A split's parent edit and its new sibling must never land as two separate
   `graph-commit` calls — the 2026-07-18 near-miss (`c037cec7` landed the
   parent alone; the follow-up sibling-add call lost the push race five times
   and landed nothing, recovered same-day as `032768e5`) is the concrete
   failure this closes.

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

**Parks.** For every entry in `result.parks` (drift, decompose, and plan parks
merged), set `office_hours: {reason, since}` on the target node via
`write-node.ts`, landed in this round's `graph-commit`. A park `target` is
either a real id (the strategy, or a pre-existing tactic) or a `temp_ref` (a new
tactic whose plan agent parked, or a decompose-forced park) — map a `temp_ref`
target through the Step-2 id map first. `since` is `date -u +%Y-%m-%d`, computed
**here** (the Workflow has no way to run `date`), never hand-guessed. The
`reason` text — including its trailing `Recommend: <next step>.` sentence — comes
from the Workflow's park object; the Park-time recommendation convention
(Autonomy contract) is unchanged, the recommendation now originating in the
Workflow's park. A drift-side strategy park is applied the same way, on the
strategy node. Separately, land each `result.drift.clarifications_to_add` entry
as a dated `clarifications` entry on the strategy (the immaterial-observation
path — no park); the material premises and failed Side-A conditions arrive as
strategy parks in `result.parks` and are applied as above.

**Prunes and greenfield drops.** Apply each `result.prunes` entry by dropping the
named draft the round does not need (record why in the `graph-commit` message).
`result.greenfield_drops` name units the Workflow already excluded against a
superseding node — nothing to mint; record the drop in the round's report.

**Validate and report.** After landing, run
`npx tsx packages/intentionsutil/scripts/validate-graph.ts` and report the round:
the tactics landed (with their minted ids), parks written, prunes/greenfield
drops, and the Workflow's `disposition`.

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
<fingerprint>, sha: <origin/main sha>}}`, where the `hash` is the value printed
by

```bash
npx tsx packages/intentionsutil/scripts/strategy-fingerprint.ts <decomposed-strategy-id>
```

run against a fresh `origin/main` at stamp time — the single runnable callsite
for `strategyFingerprint(strategy)` (`packages/intentionsutil/src/router.ts`);
never hand-compute the hash, and never re-derive the recipe inline — always run
this command. `sha` is the origin/main commit the hash was taken against,
obtained with `git rev-parse origin/main` in the bootstrap-interim hand-stamp
path (a live router passes it through `apply-node-transition.ts --strategy-sha`).
A serving strategy absent from the map is never stale (per-strategy null), so an
honest multi-serves tactic is not born frozen against its other serving
strategies; those entries are filled by whichever session decomposes or
re-evaluates each of them. Untouched sibling-strategy entries in the same map
are left as-is — this session converts only the key it is re-stamping, never a
key it is not touching (opportunistic conversion, not bulk migration). A tactic
not yet advanced still carries
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
2. **Amends, prunes, splits, or confirms** each open tactic against the
   edited substance — revise a plan whose premise changed, prune a tactic the
   edit made unnecessary, split one into a new born-parked sibling (landed
   atomically with the parent edit per the Tactic target section's split
   exception above), confirm one still valid — rather than authoring a new
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
   `map[<re-evaluated-strategy-id>] = {hash: <fingerprint>, sha: <origin/main
   sha>}`, where `hash` is the value printed by

   ```bash
   npx tsx packages/intentionsutil/scripts/strategy-fingerprint.ts <re-evaluated-strategy-id>
   ```

   (the single runnable callsite for `strategyFingerprint(strategy)`,
   `packages/intentionsutil/src/router.ts`), and `sha` is obtained via `git
   rev-parse origin/main` in the bootstrap-interim hand-stamp path, or
   `apply-node-transition.ts --strategy-sha` under a live router — leaving every
   other serving strategy's entry untouched, which unfreezes the subtree against
   this strategy without disturbing the others. (A tactic still at `execution:
   null` has no map to re-stamp until the machinery seeds one.)
4. Lands the amendments via `graph-commit`.
5. **Scope-inert re-stamp — protect each amended tactic's own scope custody.**
   Step 2's amendment edits the **body** of open (non-`draft`, non-`done`)
   tactics — precisely clarification 32's amendment-completeness scenario. A
   body edit to an in-flight tactic trips that tactic's own chain-of-custody
   scope gate: the worktree-local `.claude/worktrees/<id>.scope-fingerprint`
   stamp no longer matches the tactic's current body fingerprint, and the gate
   demotes the tactic back to `implement`, discarding its qa/review custody.
   That is correct for a real plan-substance change, but an amendment mandated
   solely by the completeness bar — a reconciliation note, a provenance
   annotation, a drift-review correction — often leaves the plan substance
   unchanged, and there the demotion is spurious (PR #2888 was falsely demoted
   from review to implement this way).

   Classify this round's own edit, **per tactic**, as **scope-inert** (plan
   substance unchanged) versus **material or unsure**. The rule is fail-closed:
   **only** a confident scope-inert verdict re-stamps; on **any** doubt — a
   merely plausible substance change included — do nothing further here. Leave
   the worktree-local stamp untouched and let custody demote the tactic exactly
   as it does today; that demotion-on-doubt is the existing correct behavior,
   not a failure mode to work around.

   For each confidently scope-inert tactic, **after** its amendment has landed
   via `graph-commit` in this **same** round (step 4, so it is on origin/main),
   run:

   ```bash
   npx tsx packages/intentionsutil/scripts/restamp-scope-fingerprint.ts <tactic-id>
   ```

   It must run post-`graph-commit`: the script reads the tactic's current
   on-disk body and the current `origin/main` sha to compute the stamp, so a
   pre-landing run would stamp stale content. Record the scope-inert
   classification and the re-stamped tactic ids in this round's record.

   This is a **completely different** mechanism from item 3's re-stamp — do not
   conflate the two. Item 3 re-stamps `execution.strategy_fingerprint`, a
   **node-frontmatter** map keyed per serving strategy, computed via
   `strategyFingerprint`, and landed as a node write in the round's
   `graph-commit`; it tracks per-strategy substance drift across the subtree.
   This item re-stamps the worktree-local
   `.claude/worktrees/<id>.scope-fingerprint` **file**, computed via
   `tacticScopeFingerprint` through the Unit-1 script; it is **never** a node
   write and **never** a `graph-commit` of its own, and it tracks a single
   tactic's own body-scope drift. Two unrelated stamps, two unrelated
   mechanisms.

Until a live router exists, re-evaluation runs **inline** in the same session
that recorded the strategy edit — the way every round on
`strategy-graph-native-dispatch` has executed it by hand.

**Per-node re-evaluation.** Under `tactic-graph-frozen-tactic-dispatch`, the
router may now queue re-evaluation as a **per-node** `/align-tactics
<tactic-id>` session targeting exactly one soft-frozen tactic, rather than only
the strategy-wide open-child sweep this section describes. That per-node form
does **not** run the inline sweep above: it builds `mode: "tactic"` `args`,
invokes the Workflow to reconcile the one node, and lands the single-node result
through the Step 2 writer — see "Tactic target — per-node finalize or re-plan",
above, for that flow. The disposition bar is identical to this section's — the
same whole-node reconciliation (item 2) and single-strategy re-stamp (item 3),
now authored by the Workflow's tactic-mode prompts — applied to the one target.

The strategy-wide open-child sweep in items 1–5 above stays **inline** on this
caller thread: it re-evaluates the whole strategy's open children together
(coordinated prune/split/confirm decisions landing in one `graph-commit`), which
the Workflow's `mode: "tactic"` contract — exactly one `target_node` per call —
does not express. It is the bootstrap-interim / author-invoked path; only the
router-queued per-node form routes through the Workflow.

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
