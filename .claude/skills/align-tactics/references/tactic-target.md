# Tactic target and re-evaluation — argument construction and disposition mechanics

This is the mechanical detail behind `/align-tactics` SKILL.md's "Tactic
target" and "Re-evaluation mode" sections. Both cover the same underlying
concern — reconciling an already-frozen tactic against a strategy — on two
different invocation paths: a direct `/align-tactics <tactic-id>` session
(the per-node path), and the strategy-wide open-child sweep that runs when a
strategy edit invalidates multiple open tactics at once.

## Per-node tactic target: draft/raw vs soft-frozen

When the argument is a `tactic-<slug>` (not a `strategy-<slug>`), this
session operates on **exactly one pre-existing tactic node** — the router
queued it because its `frozenTacticSelectable` gate approved it as an
`align-tactics` candidate (`packages/intentionsutil/src/router.ts:496`;
`resolveFrozenDescendant` at line 467 is the strategy-side inverse the
selector uses). Both consult the graph selector (`selectGraphTargets`):
selectability (phase/status/`office_hours`/blockers) is already decided
before this session runs, so this session does **not** re-decide it — it
only picks the disposition and lands the write. There is no strategy
decomposition, no draft sweep, and no `rounds` bump here. This flow runs the
same Step 0 claim/worktree mechanics (keyed on the tactic id) and the same
Autonomy contract as the strategy-target flow (see `references/autonomy.md`).

The decompose/plan judgment runs inside the Workflow
(`.claude/workflows/align-tactics.js`), invoked in `mode: "tactic"`, where
the `decompose` phase is skipped entirely (there is nothing to decompose;
only this one node's plan body needs authoring, or its re-plan
reconciliation). In `mode: "tactic"` the drift phase also runs with the
round-eligibility sanity check **disabled** (round decomposability is a
strategy-round question and this run opens no round), so the plan phase is
gated only on a genuine per-node drift blocker; every park the run emits
targets the tactic id, consistent with the "Autonomy contract binds
unchanged" paragraph below. This session's job around it is the same
three-part shape as Step 1/Step 2: assemble the input, invoke the Workflow,
and land the single-node graph write it returns (via the write path in
`references/write-path.md`).

**Read the node and decide draft/raw vs soft-frozen.** A frozen tactic
target is either draft/raw or soft-frozen; read its frontmatter to tell
which. Capture the single-node base manifest here, at this read, before any
write — see `references/write-path.md`'s "Capture a base manifest" section
for the recipe; do not restate it here. The serving strategy's derived gap
cannot be read off frontmatter (`gap` is not stored — it is derived on read
via `deriveGap`, `packages/intentionsutil/src/sensors.ts`); get it from the
`=== Serving strategy ===` block by running the census (the same command
cited below) on the **serving strategy's** id. This session picks the
`phase` value it will land, but the
finalize-vs-re-plan *judgment* (what the reconciled body should say) is the
Workflow's tactic-mode job, not this thread's:

- **Draft/raw** (`phase` absent — `phase: null`, never decomposed) →
  **finalize** it: land it at `phase: implement` with a full clean-session
  plan in its body per the plan schema (the Workflow authors that body). Do
  **NOT** sweep the serving strategy's other draft tactics — that
  draft consume/split/merge/prune path is the strategy-target flow's job
  (the Workflow's decompose phase). Do **NOT** bump the strategy's
  `rounds` counter — round accounting is completion-time and prod-verified
  (see `references/write-path.md`, "Strategy round accounting"). **Whole-node
  reconcile** (clarification 32, per "Re-evaluation mode" item 2 below): the
  Workflow rewrites any stale draft narrative in `statement`, `rationale`,
  `attention.rationale`, and the body so none of it contradicts the
  finalized state — while **preserving the authored `attention.boost`
  value** (do not reset or renumber it). Frontmatter on landing:
  `status: codified`, `phase: implement`, `execution: null`, and
  `validates: []` unless this tactic itself produces the strategy's signal
  reading (in which case `validates: [<strategy-id>]`, the standard
  frontmatter convention).

- **Soft-frozen** (`phase` already set to an in-flight value —
  `implement`, `fix`, `qa` — but its `execution.strategy_fingerprint`
  entry for one serving strategy is stale) → **re-plan** it. This is
  exactly the strategy-wide re-evaluation mechanics below, applied to this
  **one** tactic instead of a strategy-wide open-child sweep. The Workflow
  reconciles the whole node against the current serving-strategy substance
  (the whole-node reconciliation bar, clarification 32, per item 2 below).
  **Preserve the existing in-flight `phase`** — a re-plan reconciles the
  body, it never relabels the tactic back to `implement`; so
  `args.target_node.phase` carries the current phase and the write path
  lands that same phase, overriding the new-tactic `phase: implement`
  default. Re-stamp **only** the re-evaluated strategy's entry in
  `execution.strategy_fingerprint` to the `{hash: strategyFingerprint(strategy),
  sha: <origin/main sha>}` object form (item 3 below) and leave every
  other serving strategy's entry untouched (a tactic still at
  `execution: null` has no map to re-stamp).

**Build `args`.** Assemble the Workflow input in `mode: "tactic"`:

```
args = {
  mode:         "tactic",
  strategy:     { id, statement, rationale, success_signal, reading,
                  derived_gap,   // from the census `=== Serving strategy ===` block:
                                 //   derived on read via deriveGap, never stored
                  clarifications: [ ... ], conditions: [ ... ],
                  rounds: { count, last_completed, last_aligned } },  // serving strategy, READ-ONLY context
  target_node:  { id, statement, rationale, body, phase },            // the single tactic being (re)planned
  reuse_hunts:  [ { focus, scope }, ... ],                            // up to 3 (default 1)
  existing_ids: [ ... ],                                              // pre-existing ids in the strategy's corpus
}
```

`args.strategy` is the serving strategy's substance as read-only context for
the Workflow's finalize-vs-re-plan judgment — the Workflow reads it; the
apply-result writer never edits the strategy. `target_node.phase` is the
value read above (absent for draft/raw, the in-flight phase for
soft-frozen); it is how the Workflow's tactic-mode prompts tell finalize
from re-plan. The router's `frozenTacticSelectable`/`resolveFrozenDescendant`
gates decide only *selectability* against the live selector — **not** the
reconciliation — so the serving strategy's substance must ride in `args`
for the Workflow to judge draft-vs-soft-frozen disposition and reconcile the
node against it.

**Invoke the Workflow tool on the registered `align-tactics` workflow**, passing
`args` (this skill is a sanctioned caller — no `ultracode` keyword). It
returns the single target tactic with its authored `body_markdown` merged
in, plus any `plans`/`parks`; the `tactics` array holds exactly the one
node, and `gates`, `prunes`, and `greenfield_drops` are empty in tactic
mode.

**Apply the result via the write path** (`references/write-path.md`). The
single-node result lands through the **same** apply-result writer as the
strategy-target flow, with one node (not a subtree) to write: `dump-node.ts`
(base manifest) → `write-node.ts` (frontmatter, with the `phase` decided
above) → `assert-node-fresh` (freshness assertion against `origin/main`) →
body `Edit` (the Workflow's `body_markdown`) → `graph-commit
--base`. Do **not** duplicate that writer here; the only tactic-mode
specializations are the `phase` choice above (`implement` for a finalize,
the preserved in-flight phase for a re-plan) and the single-strategy
fingerprint re-stamp on a soft-frozen re-plan.

**Exception: a re-plan (or a strategy-scope `split` disposition) that
discovers a genuine split.** If a soft-frozen re-plan, or a strategy-scope
`split` disposition (the Workflow's decompose phase), finds the tactic must
split into a new born-parked sibling, that sibling is genuinely new work —
but it must never land via a separate later `graph-commit` call. Land the
parent edit and the new sibling in the **same** `graph-commit --base "$BASE"
<tactic-id> <new-sibling-id>` call; the `--base` manifest still covers only
the pre-existing parent id, and the new sibling — having no `origin/main`
blob — is simply absent from it. This closes the 2026-07-18 near-miss: a
parent edit landed alone as `c037cec7`, the sibling-add `graph-commit` lost
the push race five times and landed nothing, leaving `main` with a parent
describing a split sibling that did not exist there — recovered same-day as
`032768e5`.

There is **no strategy edit** in either case — a per-node tactic-target
session never touches the serving strategy's frontmatter (`rounds`,
clarifications, or otherwise), in contrast to the strategy-target flow,
which may. If a tactic-target session discovers the strategy's own record
needs an edit, that is a record-completeness defect to name in a park (see
`references/autonomy.md`'s unrecorded-context framing), not something this
session writes onto the strategy.

**Autonomy contract binds unchanged.** A tactic target that hits
requirement ambiguity, major scope deviation, or an unverifiable blocker
parks the **tactic** node (never the strategy) via the same `office_hours`
write mechanism in `references/autonomy.md`.

## Strategy-wide re-evaluation mode (the open-child sweep)

When invoked after a mid-flight strategy edit — the router detects a stale
`execution.strategy_fingerprint` on an open tactic and queues one
re-evaluation session (strategy clarification 10) — the session does
**not** decompose fresh. It:

1. Reads the edited strategy and its open (non-draft, non-`done`) tactics —
   **every** open child's body is read in full before disposition. Keyword
   grep over the open tactics (e.g. to shortlist candidates touching an
   edited term) is a shortlisting heuristic only; it never disposes of a
   tactic — disposition of each open child requires the full-body re-read
   (strategy clarification 32).
2. **Amends, prunes, splits, or confirms** each open tactic against the
   edited substance — revise a plan whose premise changed, prune a tactic
   the edit made unnecessary, split one into a new born-parked sibling
   (landed atomically with the parent edit per the split exception above),
   confirm one still valid — rather than authoring a new round.
   **Amendment completeness** (clarification 32): an amendment is complete
   only when the tactic's **whole node** — `statement`, `rationale`, the
   `## Context` prose, every unit, and `## Verification` — is reconciled
   against the full current strategy substance in this same round. A
   one-bullet delta that leaves a sibling unit or a verification step
   contradicting the amendment is an incomplete amendment — the same defect
   class as an incomplete record (condition 7). This also applies whenever
   this skill amends an already-landed tactic outside a formal
   re-evaluation trigger (e.g. a drift-review Side A/B correction to an
   open tactic): the whole-node reconciliation bar binds there too, not
   just at a fingerprint-triggered re-evaluation.
3. Re-stamps **only the re-evaluated strategy's entry** in each surviving
   tactic's `execution.strategy_fingerprint` map — set
   `map[<re-evaluated-strategy-id>] = {hash: <fingerprint>, sha:
   <origin/main sha>}`, where `hash` is the value printed by

   ```bash
   node --import tsx/esm packages/intentionsutil/scripts/strategy-fingerprint.ts <re-evaluated-strategy-id>
   ```

   (the single runnable callsite for `strategyFingerprint(strategy)`,
   `packages/intentionsutil/src/router.ts`), and `sha` is obtained via
   `git rev-parse origin/main` in the bootstrap-interim hand-stamp path, or
   `apply-node-transition.ts --strategy-sha` under a live router — leaving
   every other serving strategy's entry untouched, which unfreezes the
   subtree against this strategy without disturbing the others. (A tactic
   still at `execution: null` has no map to re-stamp until the machinery
   seeds one.)
4. Lands the amendments via `graph-commit`.
5. **Scope-inert re-stamp — protect each amended tactic's own scope
   custody.** Step 4's amendment edits the **body** of open (non-`draft`,
   non-`done`) tactics — precisely clarification 32's
   amendment-completeness scenario. A body edit to an in-flight tactic
   trips that tactic's own chain-of-custody scope gate: the worktree-local
   `.claude/worktrees/<id>.scope-fingerprint` stamp no longer matches the
   tactic's current body fingerprint, and the gate demotes the tactic back
   to `implement`, discarding its qa/review custody. That is correct for a
   real plan-substance change, but an amendment mandated solely by the
   completeness bar — a reconciliation note, a provenance annotation, a
   drift-review correction — often leaves the plan substance unchanged,
   and there the demotion is spurious (PR #2888 was falsely demoted from
   review to implement this way).

   Classify this round's own edit, **per tactic**, as **scope-inert** (plan
   substance unchanged) versus **material or unsure**. The rule is
   fail-closed: **only** a confident scope-inert verdict re-stamps; on
   **any** doubt — a merely plausible substance change included — do
   nothing further here. Leave the worktree-local stamp untouched and let
   custody demote the tactic exactly as it does today; that
   demotion-on-doubt is the existing correct behavior, not a failure mode
   to work around.

   For each confidently scope-inert tactic, **after** its amendment has
   landed via `graph-commit` in this same round (step 4, so it is on
   origin/main), run:

   ```bash
   node --import tsx/esm packages/intentionsutil/scripts/restamp-scope-fingerprint.ts <tactic-id>
   ```

   It must run post-`graph-commit`: the script reads the tactic's current
   on-disk body and the current `origin/main` sha to compute the stamp, so
   a pre-landing run would stamp stale content. Record the scope-inert
   classification and the re-stamped tactic ids in this round's record.

   This is a **completely different** mechanism from item 3's re-stamp — do
   not conflate the two. Item 3 re-stamps `execution.strategy_fingerprint`,
   a **node-frontmatter** map keyed per serving strategy, computed via
   `strategyFingerprint`, and landed as a node write in the round's
   `graph-commit`; it tracks per-strategy substance drift across the
   subtree. This item re-stamps the worktree-local
   `.claude/worktrees/<id>.scope-fingerprint` **file**, computed via
   `tacticScopeFingerprint` through the Unit-1 script; it is **never** a
   node write and **never** a `graph-commit` of its own, and it tracks a
   single tactic's own body-scope drift. Two unrelated stamps, two
   unrelated mechanisms.

Until a live router exists, re-evaluation runs **inline** in the same
session that recorded the strategy edit — the way every round on
`strategy-graph-native-dispatch` has executed it by hand.

**Per-node re-evaluation.** Under `tactic-graph-frozen-tactic-dispatch`, the
router may now queue re-evaluation as a **per-node** `/align-tactics
<tactic-id>` session targeting exactly one soft-frozen tactic, rather than
only the strategy-wide open-child sweep this section describes. That
per-node form does **not** run the inline sweep above: it builds `mode:
"tactic"` `args`, invokes the Workflow to reconcile the one node, and lands
the single-node result through the write path — see "Per-node tactic
target," above, for that flow. The disposition bar is identical to this
section's — the same whole-node reconciliation (item 2) and single-strategy
re-stamp (item 3), now authored by the Workflow's tactic-mode prompts —
applied to the one target.

The strategy-wide open-child sweep in items 1–5 above stays **inline** on
this caller thread: it re-evaluates the whole strategy's open children
together (coordinated prune/split/confirm decisions landing in one
`graph-commit`), which the Workflow's `mode: "tactic"` contract — exactly
one `target_node` per call — does not express. It is the bootstrap-interim
/ author-invoked path; only the router-queued per-node form routes through
the Workflow.

Enumerate the open children of the sweep above with the census script
(`tactic-align-tactics-mechanical-floor` Unit 2), which landed as the
enumeration hook for this sweep:

```bash
node --import tsx/esm packages/intentionsutil/scripts/align-tactics-census.ts <strategy-id> intentions
```

Sweep the children it classifies `open` (and the `draft` ones the decompose
path consumes); skip `done` and `born-parked`. See
`references/idempotency.md` for the output contract and the classification
taxonomy. The census enumerates only — every disposition still requires the
full-body re-read that item 1 mandates.
