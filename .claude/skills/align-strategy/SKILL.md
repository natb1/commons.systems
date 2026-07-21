---
name: align-strategy
description: Interview-driven recording of a `strategy-*` intention node — the graph-native successor to `/file-issue`'s requirements-definition role. Frames the input as a new strategy or an edit to an existing one, runs a Socratic dialectic to fix intent/placement/benefit/signal/conditions, advises on delegation capture, retains tactical byproducts as draft tactic nodes, and lands the record via `graph-commit`. On-demand only; never files a GitHub issue.
user-invocable: true
model: opus
---

# Align Strategy

**On the `model` field's enforcement (strategy-token-economy clarification 10,
2026-07-16):** `/align-strategy` is `user-invocable: true` — it runs on the
interactive main loop, not via a `context: fork` subagent launch. A `model:`
field in frontmatter is confirmed honored for `context: fork` skills; for
`user-invocable` main-loop skills like this one, honoring is unconfirmed. This
skill stays whole-session Opus because its interview dialectic is
non-delegable and it has no dispatch launch path to carry an explicit
`model: opus` argument the way `/align-tactics`' Step 3 subagent launch does.
If the harness does not honor this field on the interactive path, the default
here is intended-not-guaranteed — backed by the token audit's by-node/by-phase
attribution (`strategy-token-economy`'s sensor) reading after the fact whether
the session actually ran on Opus.

`/align-strategy [optional requirement text]` records or revises a
`strategy-*` intention node under interview. It supersedes `/file-issue`'s
requirements-definition role for the graph-native dispatch model
(`intentions/strategy-graph-native-dispatch.md`): a strategy enters
execution by being recorded here, not by becoming a GitHub issue. Full
spec and coverage matrix: `intentions/tactic-graph-native-dispatch.md`
§2.2 and §4.

This skill never files, edits, or closes anything on GitHub. Its only
artifact is one or more `intentions/strategy-*.md` (and, incidentally,
`intentions/tactic-*.md` draft) nodes landed on `origin/main`.

**Record-completeness contract** (strategy clarification 31 / condition 7):
the graph record is the **sole carrier** from this skill to `/align-tactics` —
the target router queues re-evaluation as a fresh session with only the
graph, no memory of this interview. Every decision, edge-case resolution,
and tactical byproduct this round produces must land in the node
(`clarifications`/`attributes.conditions`/`success_signal`, plus draft-tactic
bodies) at record time (step 5); running `/align-tactics` in the same
session afterward is a bootstrap safety net, not a substitute for a
complete record. Step 6's clause-coverage walk is the check that discharges
this condition.

The interview **is** the audit (clarification 2 on
`strategy-graph-native-dispatch`): unlike `/file-issue`, there is no
downstream PR review step that checks the requirement was captured
correctly. Take the dialectic seriously — a rushed interview is a
permanent gap in the record, not a draft someone else will catch.

## Trigger and input

On-demand only, human-invoked. Treat any text following `/align-strategy`
as the **requirement text** for step 1. With no text, run the
**improvement pass** branch of step 1 instead.

Never `AskUserQuestion`-free for the interview itself (step 2) — this
skill's whole value is the dialectic. Reserve `AskUserQuestion` for
bounded choices with a recommended option listed first, per the
2026-07-03 prototype run's convention; open-ended elicitation is a normal
conversational turn, prose reply captured as-is (same split as
`.claude/skills/align-init/SKILL.md`'s rung-0 intent interview).

## Step 0 — Claim and isolate

Before the first write, claim the target node id and author in its
worktree — the same uniform node-id reservation discipline the router's
fan-out workers follow (`strategy-graph-native-dispatch`'s 2026-07-06
concurrency-safety clarification). Never author strategy edits in the
shared `main` checkout: a second concurrent session's dirty tracked file
blocks your `graph-commit` rebase, and a stale read races live phase state
(both happened live the day that clarification landed).

1. **Resolve the target node id.** For an edit, an improvement pass, or a
   doctrine round, it is the primary `strategy-*` being edited — claimed
   before the first write. A brand-new strategy has no id until step 5
   constructs it; author it in the worktree and claim its id as soon as the
   id is fixed.
2. **Check the claim.** If `<project-root>/.claude/worktrees/<node-id>`
   already exists with a live session — `worktree_has_live_session <path>`
   (`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:15`,
   run with `dangerouslyDisableSandbox: true`) — the claim is held by
   another session: stop and report the held claim to the author. Do
   **not** park the node — a held claim is not a defect.
3. **Enter the worktree — on a verified-fresh checkout.** Otherwise create
   or re-enter it, and do all authoring and the step-5 `graph-commit` from
   there. The worktree **is** the claim: the same live-session ⇔ worktree
   liveness rule the router uses, so no separate lock is needed. **Prefer
   `provision-node-worktree`**
   (`.claude/skills/dispatch-propagate/scripts/provision-node-worktree`): it
   fetches `origin/main` and cuts the worktree fresh from it, so no separate
   freshness check is needed after it. If instead you use native
   `EnterWorktree`, **or** re-enter an **already-existing** worktree by any
   means **other than `provision-node-worktree`**, running
   `.claude/skills/dispatch-propagate/scripts/assert-worktree-fresh` is
   **mandatory** as the very first action in that worktree — **before any
   graph read** (before Step 1's overlap grep / `readNode`, etc.). A non-zero
   exit means the checkout is stale **or** the `git fetch` itself failed;
   either way, **STOP** and freshen (`git fetch origin main && git merge
   origin/main`) before proceeding. Never treat a failed fetch as license to
   proceed on unverified state.

**Doctrine-recording rounds pin the pace curve.** A round that records
governing dispatch doctrine (a concurrency-safety or
dispatch-discipline clarification) pins
`dispatch.config/target-workers.json` to floor 0 / terminal 1 for its
audit window so the fleet quiesces while the doctrine settles, then
restores the standing 50 / 100 curve after — the practice the 2026-07-06
clarification records.

## Step 1 — Frame

**With requirement text:**

1. **Multi-topic separation.** If the text bundles independent concerns —
   each would need its own `success_signal` and could be pursued to
   completion without the other — treat it as N separate strategies. Run
   steps 2–6 once per concern, each producing its own node and its own
   `graph-commit` call in step 5. Do not force unrelated concerns into one
   node to avoid re-running the interview.
2. **Duplicate / overlap detection.** Grep `intentions/strategy-*.md` for
   keyword overlap with the requirement (statement, rationale, and
   clarification text). A strong match means this is an **edit**, not a
   new strategy — read the matched node in full via
   `readNode(intentionsDir, id)` (or just read the file: only the
   frontmatter is authoritative) before the interview, and use it as the
   dialectic's starting point.
3. **New vs. edit.** No strong overlap → new strategy: identify which
   `virtue-*.md` node(s) it serves (a strategy's `serves` must resolve to
   `kind: virtue` — `validateGraph` rule 8). Overlap found → edit: confirm
   with the author (`AskUserQuestion`, recommended: "edit
   `strategy-<id>`") before proceeding.

**With no requirement text — improvement pass:**

1. Read every `intentions/strategy-*.md` node. For each, check:
   - Any `attributes.conditions` entry that no longer plausibly holds
     against current repo/author state.
   - `reading`/`gap` staleness — a `reading` that predates a clarification
     it should have been invalidated by, or a `gap` describing a target
     already met.
   - A `clarifications` entry contradicted by a later clarification on the
     same or a related node.
   - **Greenfield-relevance gate** (strategy clarification 26): sweep the
     strategy's open (non-draft, non-`done`) tactics for subjects deleted or
     superseded by a non-draft node elsewhere in the graph (a raw draft
     never obsoletes live work). Per-unit: a doomed unit is a candidate to
     drop, naming the superseding node; a tactic demotes to draft only when
     it is *fully* superseded; a tactic on doomed surface may be kept only
     with an explicit interim-live-risk exception naming its expiry event
     (e.g. "until the gh-queue drains"). This is the same gate
     `/align-tactics` runs at finalization — running it here too catches
     staleness on strategies with no pending decomposition round.
2. Separately, list `virtue-*.md` ids that appear in **no** strategy's
   `serves` — a virtue with no strategy expressing it is a candidate for a
   brand-new strategy.
3. Present the candidates (failing-condition strategies, stale-signal
   strategies, contradicted-clarification strategies, doomed-tactic
   strategies, unserved virtues) via `AskUserQuestion` and let the author
   pick one or more to take into step 2. If the author picks none, stop
   here — there is nothing to record.

**Mechanics.** The corpus staleness checks above (condition-vs-repo-state,
reading/gap dating, contradicted clarifications, greenfield-relevance) may
fan out to `Explore` subagents returning compact `path:line`-anchored
findings — the interview dialectic itself (step 2 onward) is never
delegated. Keyword grep (this step's corpus sweep, and step 3's delegation
sweep) only **shortlists** candidates; it never disposes of one — disposition
requires reading each shortlisted node in full. A strategy-corpus census
script is planned as an enumeration hook for this sweep
(`tactic-align-tactics-mechanical-floor` Unit 4); until it lands, sweep the
corpus by hand as above.

## Step 2 — Interview dialectic

Run this once per strategy target selected in step 1 (new or edit).

### Interview type — classify first, and state it

Every interview is one of two types, fixed by where the authoritative model of
the subject currently lives (2026-07-09 interview-types doctrine,
`strategy-explicit-intent` clarification "What interview types do align
sessions run, and which rules bind each?"). State which type each interview is
before the dialectic proper begins.

- **Type b — the record is authoritative and the author has drifted from it or
  not yet internalized it** (author education). Full periagoge rules bind:
  probes cite the record **at `origin/main`** as the fixed object — never the
  working tree (a stale checkout presents already-amended doctrine as current),
  never session memory; the author articulates their own account before
  Claude's account appears; compulsion is argument only — press until resolved,
  never impose. Three exits stay open to the author at all times: amend the
  record (the dialectic wins), defer (held on trust with a review item — see
  "Deferral mechanics" below), or claim authority over Claude's account or a
  referenced tradition (an intentional divergence, recorded). Claude never
  blocks and never withholds recording.
- **Type a — the model lives in the author, unrecorded or not yet formed**
  (Claude elicitation and education). Visible-refusable-draft rules bind:
  propose viable seams and explore their consequences to author feedback. Joint
  inquiry where nothing is settled anywhere is type a's elicitation limb, not a
  third type — it resolves by the same visible-draft machinery, and parsimony
  declines the extra seam.

**Run type b before type a when required author knowledge is unrecorded.**
Type b's object is the topic's **ground** — the knowledge needed to decide,
across the record at `origin/main` and the relevant traditions, recorded and
Claude-internal alike — not merely the pending decision surface. A type b
confined to ratifying decision mechanics is the named deviation; explore the
ground first, then take the formed decision into type a.

In either type, always surface graph-internal inconsistencies, inconsistencies
between the graph and Claude's internal knowledge (a good the author may not
yet have seen), and parsimony findings (redundant seams).

### Question mechanics — every round, both types

Every `AskUserQuestion` round in this step — the step-2.1 intent confirmation,
the step-2.9 design-canvas question, and any other — carries three things (the
standing feedback loop of both types, not a type-a convenience):

1. a **recommendation** — your best answer, listed first;
2. an honest **boldness assessment** on that recommendation — how much of it
   rests on the graph and this session's context versus Claude-internal
   knowledge the author has not verified;
3. an explicit **accept-as-deferral** option alongside plain acceptance, so the
   author can hold the recommendation on trust rather than endorse it (see
   "Deferral mechanics" below).

**Deliver a question's motivating context — including each recommendation's
boldness — where the author will actually read it:** inside the
`AskUserQuestion` tool itself (question text, option descriptions, preview
panes) or in a prior turn the author has already read and responded to. The
author reads neither Claude's thinking nor same-turn preamble emitted before
the question call, so context living only there has not been provided — a
boldness assessment stated only in preamble is undelivered. A question must
never reference material the author has not seen.

### Deferral mechanics

This subsection is the home for the born-parked review-item typology (Step 5's
Mode A curriculum enrollment points here for it). A deferral is always
defer-until-later-review — a conscious, temporary choice to hold a
recommendation on trust, never a quiet drop. When the author accepts one:

- **Record it.** Land a dated clarification on the affected node naming exactly
  what is held on trust (the ordinary step-2.8 clarification mechanics).
- **Extend delegated scope when it defers to Claude's articulation.** When the
  held content is Claude-drafted reasoning, the same round extends
  `delegation-philosophical-articulation`'s delegated scope — reconcile that
  node in this round's commit.
- **Create exactly one review item, born-parked, in the same `graph-commit`.**
  Every deferral — philosophical or not, text-grounded or not — produces one
  review item; none gets lighter treatment for lacking a text. The typology:
  - a **reading chunk** (a `tactic-reading-chunk-*` node, `parent:
    tactic-tradition-reading-program`, `validates: [<grounding strategy>]`)
    when a grounding text exists — the expected case;
  - an **office-hours review sitting** (a review-item node) when the author
    deferred to something text-less, such as Claude's logical analysis of
    internal consistency.

  **Born-parked field mechanics:** author the review item with the same
  `write-node.ts --file` recipe as a step-4 draft tactic, but omit `phase` and
  set `office_hours: {reason, since}` at creation (get `since` via `date -u
  +%Y-%m-%d`) — the parked state the router never selects for a phase worker.
  Name the enrolled node's id in the review item's `statement` or body: the
  coverage sensor (`tactic-review-curriculum-coverage-sensor`) derives frontier
  linkage by matching that id, so an item that only alludes to the node is
  invisible to it. Bundle it into the same `graph-commit` as the record it
  enrolls, exactly like a draft tactic.

### Dialectic steps

1. **Intent.** Elicit the one-line `statement` a plain conversational turn
   first; once you have enough to draft one, confirm it via
   `AskUserQuestion` with your best draft as the recommended option.
2. **Placement.** For a new strategy: propose the `serves` virtue id(s) and,
   if it is naturally a sub-strategy of an existing one, a `parent`
   strategy id (same-kind only — `validateGraph` rule 6). For an edit:
   confirm placement is still correct given the revision. Recommend your
   best guess first.
3. **Doctrinal-consistency gate.** Test the drafted strategy for internal
   consistency with the recorded model of the good before it enters that
   model — the function doctrine (`strategy-explicit-intent`, 2026-07-08
   clarifications) requires every strategy be tested against the model it
   joins, and `validateGraph` rule 8 (checked at step 2.2) covers only
   referential integrity, not consistency of intent. Read the relevant
   doctrine **at `origin/main`, never the working tree** — a stale checkout
   presents already-amended doctrine as current, the live failure mode the
   2026-07-08 round caught (e.g. `git show
   origin/main:intentions/<id>.md`). Read: the `serves` virtues' rationales
   and `tension_with` pairs; overlapping strategies' `clarifications` and
   `attributes.conditions`; and the tradition records those virtues cite.
   Surface every contradiction between the drafted `statement`/`rationale`
   and that doctrine as an interview question, following the "Question
   mechanics" subsection above (recommendation + boldness +
   accept-as-deferral, context delivered inside the `AskUserQuestion` tool).
   Each resolution lands as a dated `clarifications` entry in the step-2.8
   provenance convention. On the **edit** path (step 1.2 classified the
   target as an edit of an existing strategy), run the gate against the
   revised `statement`/`rationale` as well.
4. **Benefit.** Talk through why this strategy is worth running now versus
   later or not at all — this is conversational, not a gated question,
   but its conclusion should be visible in the eventual `rationale`.
5. **Steelman-alternative challenge.** Test the strategy against the
   strongest rival conception of its intent before recording it — the
   alternatives test otherwise lives only in
   `strategy-philosophical-grounding`'s periodic rounds, so a strategy
   recorded between rounds would enter untested. Articulate the strongest
   rival framing of the strategy's intent — a different end it could be
   serving, a different shape the same end could take — sourced from the
   tradition records the `serves` virtues cite (their `adopted` /
   `diverged` / `chosen_over` entries) or a named candidate tradition you
   can defend. Put that rival framing to the author via `AskUserQuestion`,
   following the "Question mechanics" subsection above (recommendation +
   boldness + accept-as-deferral, context delivered inside the tool). Record
   the resolution as a dated `clarifications` entry in the adopt/diverge
   shape — either the strategy adopts the rival framing, or it diverges
   from it with the reason stated — carrying a dated provenance clause per
   the step-2.8 convention.
6. **Signal.** Draft a `success_signal` — `{observable, sensor, threshold,
   is_proxy}` — and confirm it names something a sensor can actually read.
   A strategy with no plausible sensor is a sign the intent is still too
   abstract; push back before recording one.
7. **Conditions.** Ask the author to state the circumstances this strategy
   is contingent on (`attributes.conditions`) — author availability,
   architectural assumptions, another strategy holding, etc.
8. **Edge cases and consequences.** For each of the above, surface at
   least one edge case or downstream consequence and resolve it with the
   author. Every resolution becomes a dated `clarifications` entry —
   `{question, answer}` where `answer` carries a dated provenance clause:
   an event verb (Recorded / Amended / Reviewed / clarified / adopted,
   etc.) plus an ISO date, placed wherever it reads best in the sentence —
   a front-loaded parenthetical is preferred, e.g.
   `"(Recorded 2026-07-05 interview.) ..."`, but any placement is accepted.
   The newest ISO date anywhere in the answer is its effective date — the
   `readingDate()` contract (`packages/intentionsutil/src/router.ts`)
   extracts it verb-agnostically, and `coverage.ts`'s `lastReviewedOf`
   depends on it. An amendment adds a new dated clause rather than rewriting
   the old one, so the history of resolutions stays legible. Get the date
   via `date -u +%Y-%m-%d`, never hand-guessed. `validateGraph` rule 17
   mechanically enforces the date-presence half of this convention; the
   event verb is documented style, not linted.
9. **Design-canvas support (UI-design requirements only).** When a
   decision is about UI shape and text underspecifies it, supplement
   `AskUserQuestion` with visual aids: build mockup/variant artifacts on
   `@commons-systems/ds` and sync them to the claude.ai/design canvas via
   `DesignSync`, so the author disambiguates by pointing at a variant.
   Canvas artifacts are interview aids, not deliverables — the resolution
   they produce is recorded as an ordinary dated clarification like any
   other. Caveat: a freshly synced component is absent from the canvas
   until the project is opened/refreshed — warn the author if this is
   their first look at a same-session sync.
10. **Persistent-layer ownership gate.** Whenever this interview is about to
    record standing structure — a node that owns a `success_signal` that is
    read on an ongoing basis, a node carrying a standing `attention`
    boost/override,
    or any node that other machinery permanently references — the recorded
    owner must be `kind: strategy` (or `virtue`), never a tactic. Tactics are
    transient by definition: they complete and leave the selectable graph.
    If a tactic is proposed as a standing owner, surface it as an interview
    question, never record-and-fix-later: recommend the owning strategy, and
    propose creating one if none exists (`strategy-main-health` is the worked
    precedent, created 2026-07-13 for exactly this reason). Resolution lands
    as a dated `clarifications` entry per the step-2.8 provenance convention.

**The `/file-issue` 8-category evaluation, folded into the steps above**
(so nothing from the coverage matrix silently drops):

| Category | Where it lands here |
|---|---|
| Duplicates | Step 1.2 overlap detection |
| Compliance | Step 2.2 — does intent trace to a real virtue |
| Clarity | Step 2.1 — a muddled composite statement is a step-1.1 multi-topic split, not a vague one-liner accepted as-is |
| Correctness | Step 2.6 — does the signal actually measure the stated intent |
| Relevance | Step 1 improvement-pass branch (edit mode only) |
| Decomposition | Deliberately **not** this skill's job — a strategy is never broken into PR leaves here; that is `/align-tactics` |
| Recommendations | The interview's own resolutions, recorded live as clarifications — there is no separate recommendations pass |
| Open-issue alignment | Step 1 improvement-pass condition/signal staleness sweep, generalized from "issues" to "the graph" |

## Step 3 — Delegation advice

Grep `intentions/delegation-*.md` for nodes whose `statement` or
`attributes.delegated` overlaps the strategy's domain. For each match:

1. Propose (`AskUserQuestion`) whether the strategy should carry a
   `recovers: [<delegation-id>]` edge (`recovers` is valid only on
   `kind: strategy`, and every entry must resolve to `kind: delegation` —
   `validateGraph` rule 9). A strategy that unwinds or reduces reliance on
   a delegation should record the edge even if unwinding is only partial.
2. Read the delegation's `attributes.divergence.level` and
   `attributes.irreversibility.{gated,recovery_cost}`. Surface capture risk
   explicitly in the proposal: high divergence or a gated, costly
   irreversibility means the author should weigh this before committing —
   state it in the `AskUserQuestion` description, not just in your own
   head.

## Step 4 — Retain draft tactics

Tactical or implementation content that surfaces naturally during the
interview is **retained, never refined and never dropped** — this skill
has no plan schema or quality bar to hold it to; that is `/align-tactics`'s
job.

**Artifact-owner placement** (strategy clarification 27): a draft's `serves`
names the strategy that owns the artifact the byproduct touches — never the
nearest-fit strategy just because it is the one under interview. A
genuinely cross-cutting byproduct uses an honest multi-entry `serves`
naming every owning strategy. When no strategy owns the artifact, do not
force-fit one: surface the gap to the author (a candidate for a brand-new
strategy, per the improvement-pass branch above) rather than parking the
draft under a strategy that does not actually own it.

For each such byproduct, write a draft tactic node:

```bash
cat > "$TMPDIR/tactic-draft.json" <<'JSON'
{"id":"tactic-<slug>","kind":"tactic","statement":"<one-line>","owner":"ai","status":"raw","parent":null,"serves":["<strategy-id>"],"rationale":"<why this surfaced, from the interview>"}
JSON
npx tsx packages/intentionsutil/scripts/write-node.ts --file "$TMPDIR/tactic-draft.json"
```

No `phase` field (equivalently `phase: draft`) marks it as retained
context, not selectable work — the router never selects a draft tactic and
it does not count as a child for the strategy's `/align-tactics`
eligibility. If the byproduct is more than a one-line statement, follow
with a direct `Edit` of the node body (everything after the closing `---`
fence) to carry the fuller context — `writeNode` preserves an existing
tactic body verbatim across later frontmatter-only rewrites, so this
survives untouched until `/align-tactics` consumes it.

Never write this content to an ad-hoc design doc outside `intentions/` —
the graph is the only home for tactical context, however provisional.

**Graph as sole tracker** (strategy clarification 28): the `intentions/`
graph is the source-of-truth issue tracker, bug tracker included — every
defect worth fixing is a tactic (or a unit of one), never a side channel
(an ad-hoc doc, a code comment thread, a chat aside). A byproduct that is a
bug report is retained here exactly like any other tactical byproduct. Code
`TODO`s stay pointer-only — `TODO(tactic-<id>)` — never carrying the
substance itself; a substantive TODO with no backing node is a
review-phase finding, not something this skill should ever produce.

## Step 5 — Record

Before constructing the JSON to land, re-confirm that no node about to be
recorded this round — as a `success_signal` owner or a standing `attention`
boost/override carrier — is `kind: tactic`. This is the same gate as dialectic
step 10, restated here as the final pre-write check so a resolution made earlier
in a long interview is not silently dropped by the time the JSON is constructed.

Write the full node through `write-node.ts` — never hand-edit the YAML
frontmatter:

- **New strategy:** construct the full JSON from the interview (required
  core plus `serves`, `rationale`, `clarifications`, `success_signal`,
  `attributes.conditions`, `recovers` from step 3) and pipe or `--file` it
  into `write-node.ts`.
- **Edit:** read the existing node's frontmatter in full by **dumping it
  through `dump-node.ts`**, which captures both the JSON to reconcile and a
  base manifest recording the blob you read — the compare-and-swap token
  step 5's `graph-commit --base` checks (never a bare `readNode` one-liner,
  which records no base):

  ```bash
  BASE=$(npx tsx packages/intentionsutil/scripts/dump-node.ts \
    --out-dir "$TMPDIR/dump" <strategy-id>)
  # reconcile from "$TMPDIR/dump/<strategy-id>.json"; pass "$BASE" to graph-commit below
  ```

  Only the frontmatter is authoritative. **Amendment completeness**
  (strategy clarification 38,
  widening clarification 32's tactic-amendment bar to any node amendment in
  any align skill): an edit round is a **whole-node reconciliation**, never
  a patch applied in isolation. Reconcile the edited strategy's `statement`,
  `rationale`, `attributes.conditions`, `success_signal`, and every
  `clarifications` entry the edit touches or contradicts against the
  interview's full outcome before constructing the JSON to land — landing
  one new clarification while a sibling field (an older clarification, a
  stale condition, an unrevised rationale sentence) still contradicts it is
  an incomplete amendment, the same defect class as an incomplete record
  (condition 7). The author's live presence in this interview reduces but
  does not remove the risk: the record, not the session, is the carrier.
  Construct the fully-reconciled JSON (not a `jq` delta patch) and pass it
  to `write-node.ts`. Never transcribe frontmatter by hand.

```bash
npx tsx packages/intentionsutil/scripts/write-node.ts --file "$TMPDIR/strategy.json"
```

Then land it — `graph-commit` is the **only** write path, never a
hand-rolled `git commit`/`git push`. For an **edit**, pass the base
manifest from `dump-node.ts` via `--base` so a stale read is refused
mechanically (before any commit) rather than left to rebase luck:

```bash
packages/intentionsutil/scripts/graph-commit --base "$BASE" \
  <strategy-id> [<draft-tactic-id> ...]
```

A brand-new strategy has no origin/main blob to compare, so it takes no
`--base` entry — omit the flag (or the id) for nodes this round creates;
`--base` covers only the pre-existing nodes you dumped.

Bundle any draft tactic nodes authored in the same pass into the same
`graph-commit` call as their serving strategy — one call, one commit,
covering everything this interview produced. A multi-topic round
(step 1.1) instead runs step 5 **once per independent strategy**, each its
own `graph-commit` call with its own draft-tactic bundle: the "single-node
commit" discipline (clarification 2) is about one node id per file inside
a commit that stays small and reviewable, not a hard cap of one file per
push.

If `graph-commit` exits 1 having printed a parking message, the node
landed with `office_hours` set instead of the intended content (a
concurrent-edit conflict) — tell the author and stop; do not retry
automatically.

**Scope-inert re-stamp — protect a tactic's own scope custody.** If this
round's edit touched the **body** (not just frontmatter) of an in-flight
tactic — a node with a phase set, i.e. an open child (not `draft`, not
`done`), the same population the Materiality-scoped-freeze section below
discusses — then that body edit trips the tactic's own chain-of-custody
scope gate: the worktree-local `.claude/worktrees/<id>.scope-fingerprint`
stamp no longer matches the tactic's current body fingerprint, and the gate
demotes the tactic back to `implement`, discarding its qa/review custody.
That is correct for a real plan-substance change, but this interview
sometimes must edit an open tactic's body for a **scope-inert** reason — a
reconciliation note, a drift-review correction, a provenance annotation, or
any other body edit clarification 38's amendment-completeness bar produces —
where the plan substance is unchanged. For those, the demotion is spurious.

Classify this round's own edit, per tactic, as **scope-inert** (plan
substance unchanged — e.g. a provenance/reconciliation annotation) versus
**material or unsure**. The rule is fail-closed: **only** a confident
scope-inert verdict re-stamps; on **any** doubt — including a merely
plausible substance change — do nothing further here. Leave the stamp
untouched and let custody demote the tactic exactly as it does today. That
demotion-on-doubt is the existing correct behavior, not a failure mode to
work around.

For each tactic whose edit is confidently scope-inert, **after** the body
edit has landed via `graph-commit` in this **same** round (so it is on
origin/main), run:

```bash
npx tsx packages/intentionsutil/scripts/restamp-scope-fingerprint.ts <tactic-id>
```

It must run post-`graph-commit`: the script reads the tactic's current
on-disk body and the current `origin/main` sha to compute the stamp, so a
pre-landing run would stamp stale content. It re-writes **only** the
worktree-local `.scope-fingerprint` file — it is never a node write and
never a `graph-commit` of its own.

Record the classification in this round's own record/summary — the
scope-inert verdict and the tactic ids re-stamped — as the audit trail the
doctrine requires.

This is a **separate** stamp from the Materiality-scoped-freeze section that
follows, not an extension of it. That section's `execution.strategy_fingerprint`
freeze protects open children broadly against **strategy**-substance drift;
this step's worktree-local `.scope-fingerprint` re-stamp protects a single
**tactic**'s own scope-custody gate from being tripped by a scope-inert edit
to that tactic's own body. Two unrelated stamps, two unrelated mechanisms —
do not conflate them.

**Documentation completeness over commit size.** When an interview outcome is
materially a property of the strategy under edit (an invariant of its
contract, a resolved edge case, a doctrine correction), record it as a
strategy clarification on that strategy — never relocate it to a draft tactic,
or omit it, to keep the commit small or to avoid a re-stamp. Commit size is
never a reason to put documentation in the wrong place; the materiality-scoped
freeze below is what keeps a warranted clarification's *blast radius* small —
it is not a reason to avoid recording the clarification itself.

**Measure freeze/re-stamp cost via the authoritative predicate, never a
grep.** If a recording or materiality decision turns on how many open children
a clarification would freeze, compute the actual set with `readNode`
(`packages/intentionsutil/src/store.ts`, re-exported via the package index
barrel) + `isFingerprintStale`
(`packages/intentionsutil/src/transitions.ts`) — or
`strategyFingerprint` (`packages/intentionsutil/src/router.ts`) plus the same
per-child stamp read the router's selector uses — never a text `grep` over
`strategy_fingerprint`. A `grep -c` (or similar) over that field counts the
key line itself, so a null-valued stamp (`strategy_fingerprint: null` — not
stale, per `isFingerprintStale`) is indistinguishable from a real one in the
grep count and inflates the estimate. A cost estimate that drives a recording
or materiality decision must come from the same predicate the router uses, not
a text search.

**Materiality-scoped freeze — classify each open child.** If this is an edit
to a strategy that has open (non-draft, non-`done`) child tactics with an
existing stamped `execution.strategy_fingerprint` entry for this strategy, the
session must classify **each** such stamped open child against the actual edit
delta — **before** running `graph-commit` — into exactly one of three buckets.
The classification is materiality-scoped, not indiscriminate: an edit no longer
queues a blanket freeze of the whole open subtree; only the children the edit
actually affects freeze.

There is **no rank gate** — rank is not a proxy for materiality. A low-rank
child can still be materially affected, and a high-rank child can still be
orthogonal; classify every stamped open child on the substance of the delta,
never on its rank.

- **Orthogonal** — the edit does not affect this child's plan at all.
  Re-stamp its `execution.strategy_fingerprint` entry for this strategy to
  `{hash: strategyFingerprint(strategy), sha: <origin/main sha at edit time>}`
  in the **same** `graph-commit` as this strategy edit, so no freeze fires for
  this child.
- **Materially affected** — the edit changes something this child's plan
  depends on. Leave its stamp untouched/stale: the freeze fires and it
  re-evaluates later at its own rank via the existing re-evaluation mechanism
  (unchanged — `tactic-graph-router-selector` /
  `tactic-graph-router-transitions` when live; the inline `/align-tactics` pass
  in this same session in the bootstrap interim, as every round recorded on
  `strategy-graph-native-dispatch` so far has done by hand).
- **Must-land-first migration** — this child must not proceed until some
  carrier work lands. In addition to leaving its stamp stale (as materially
  affected), add `blocked_by += [<carrier-id>]` so the router cannot select it
  until the carrier lands.

`hash` is always `strategyFingerprint(strategy)` from
`packages/intentionsutil/src/router.ts` — always that helper, never a
hand-computed hash. In the bootstrap-interim hand-stamp path (no live router
yet), get `sha` with `git rev-parse origin/main`. The live-router path instead
passes it through `apply-node-transition.ts --strategy-sha <sha>` rather than
shelling git itself.

Dropping the legacy bare-string form entirely, and making `validate-graph`
**reject** bare strings, is sequenced future work (migration step 4), **not**
this change: bare strings remain valid deprecated-legacy, and only the
classification-touched (re-stamped) keys convert to the `{hash, sha}` object
form — opportunistic conversion, not a bulk migration of the extant legacy
bare-hash stamps.

**Curriculum enrollment (record time).** Maintaining the ever-expanding
review curriculum is one of /align's roles
(`strategy-graph-review-curriculum` clarification 5): every recorded node
enrolls when it lands, and enrollment happens here, not in a later pass.
Which mode a node enrolls in is derivable from its own record —
held-on-trust/delegated content is mode A, author-owned content is mode B.

- **Mode A — content held on trust.** When this round records a deferral or
  a delegated/held-on-trust recording, land its born-parked re-validation
  review item in the **same `graph-commit`** as the record it enrolls (bundle
  it exactly like a draft tactic, step 5's bundling rule). That review item is
  the node's curriculum-frontier entry, so its `statement` or body must
  **name the enrolled node's id**: the coverage sensor
  (`tactic-review-curriculum-coverage-sensor`) derives frontier linkage
  mechanically by matching that id, so a review item that only alludes to the
  node is invisible to it. Author the review item with the same
  `write-node.ts --file` recipe as the step 4 draft-tactic byproduct. The
  deferral typology — which held-on-trust content becomes a reading chunk
  versus an office-hours sitting, and the born-parked field mechanics — is
  owned by `tactic-align-interview-type-doctrine` on this same skill surface;
  point there for it, do not restate it here. This clause carries only the
  frontier-entry framing, the same-commit rule, and the id-naming requirement.
- **Mode B — author-owned content.** Enrollment is implicit: being recorded
  in the graph *is* enrollment, and the curriculum frontier's recursive scope
  expansion is the recurrence mechanism that reaches the node — no action is
  owed at record time. Never create a per-node review schedule, a standing
  review item, or a side list for author-owned doctrine. Review items are
  born-parked nodes derived from node status
  (`strategy-graph-review-curriculum` condition: the curriculum stays
  graph-encoded, never a hand-maintained side list); /align never maintains a
  separate roster.

## Step 6 — Requirements coverage check

Before finishing (requirement-text mode only): walk the author's original
text clause by clause and confirm each maps to a recorded element — a
`clarifications` entry, a `rationale` sentence, a `tooling_goals` entry, an
`attributes.conditions` entry, or a draft-tactic bullet. An unmapped clause
never drops silently: either return to the interview for it, or land it in
a draft tactic body. State in your final summary to the author which
clause mapped where — this is the one behavior a rushed pass is most
likely to skip, and skipping it is exactly the failure mode this step
exists to catch (found live in the 2026-07-03 `strategy-attention-surface`
round: a requirement anchor that survived only in session context until
this check restored it).

This walk is what discharges the record-completeness contract (strategy
clarification 31 / condition 7, see the preamble above): `/align-tactics`
re-evaluates from a fresh session with only the graph, so a clause that
maps to nothing recorded is a gap this skill — not the next session — is
responsible for closing.

## Out of scope

- `/align-tactics` (breaking a recorded strategy into PR-sized tactics —
  `tactic-align-tactics-skill`) and `/align-init` (fork onboarding —
  `tactic-align-init-skill`): sibling skills, not this one's job.
- Deleting `/file-issue` itself: that is `tactic-legacy-router-removal`,
  gated on the legacy gh queue draining. `/file-issue` keeps working for
  gh-issue work throughout this skill's rollout.

## Verification

Prose only — this is an interactive-dialectic skill with no automated
test surface, so no ```verify block:

- Dry-run on a toy requirement in an interactive session. Confirm:
  - the written node passes `npx tsx packages/intentionsutil/scripts/validate-graph.ts`;
  - it landed via `graph-commit` (visible on `origin/main`, not just
    locally committed);
  - any draft tactics from step 4 landed in the same commit and read back
    with `phase` absent;
  - no `gh issue`/`gh pr` command ran anywhere in the flow.
