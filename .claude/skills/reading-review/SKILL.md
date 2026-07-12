---
name: reading-review
description: Office-hours skill that runs one tradition-reading curriculum chunk's demonstration — the author demonstrates understanding of the tradition and its application to the deferral against the primary text, the graph is amended where the reading contradicts it or ratified where it holds — or, for a candidate chunk with no record yet, the session resolves to a new tradition record, grounding marks, or a dismissal clarification; it also mints and runs per-record context capstones (selection-bias audit, deferred amend/ratify, intent-evolution review) — and the chunk or capstone node is resolved (phase → done), which triggers /sync-reader's retirement of the chunk's excerpt from the e-reader. Interactive and unbounded; the inverse of /align-tactics' autonomy contract. Never files a GitHub issue.
user-invocable: true
---

# Reading Review

`/reading-review [chunk-node-id]` runs one office-hours sitting of the
tradition-reading curriculum (`tactic-tradition-reading-program` subtree). It
is the recovery loop of `delegation-philosophical-articulation` functioning:
the tradition articulations under review were made on Claude's account of the
primary texts, so the author demonstrates understanding directly against the
text, the graph is revised where the reading contradicts it, and the chunk
node is resolved. Resolution (`phase: done`) is the trigger `/sync-reader`
(`tactic-sync-reader-skill`) keys excerpt retirement on.

This skill is **interactive** — the inverse of `/align-tactics`' autonomy
contract. Its value is the dialectic; a rushed session is a permanent gap in
the author's knowledge map, not a draft someone else catches. It instruments
`strategy-philosophical-grounding`'s success-signal sensor ("owner review at
office-hours"): every completed chunk produces a recorded round that moves a
node (amend) or flips trust to verification (ratify).

## Periagoge — the design principle

Education is the art of turning, not of putting sight into eyes
(*Republic* 518b–d, verified chunk 1; 2026-07-08 clarification on
`strategy-philosophical-grounding`). This skill turns the author toward the
text; it never implants Claude's account of the reading — an interview that
implants the account is the same capture the recovery loop exists to unwind.
Concretely:

- Probes cite the text, never Claude's gloss.
- The author articulates **before** any account of Claude's appears.
- Claude's account enters only afterward, as challenge or counterpoint to a
  position the author has already committed to.
- Never open a session with a summary of the reading.
- A bounded verdict may only close a question the author's own articulation
  has already opened.

This principle governs the whole session flow below; where a step and the
periagoge appear to conflict, the periagoge wins.

## Trigger and selection

On-demand only, human-invoked: `/reading-review [chunk-node-id]`.

- **With an argument**: take that `tactic-reading-chunk-*` node as the target.
- **With no argument**: select the unresolved chunk with the lowest
  `attributes.curriculum.priority`. **Unresolved** = a
  `tactic-reading-chunk-*` node whose `phase` ≠ `done` and whose
  `office_hours` is set. Read candidates via `listNodes`
  (`packages/intentionsutil/src/store.ts:124`) or by reading the files
  directly — the frontmatter is authoritative. If no unresolved chunk exists,
  say so and stop.

Chunks come in two kinds, distinguished by
`attributes.curriculum.candidate`. Selection (above) is identical for both —
lowest-priority unresolved chunk — but the resolution differs:

- **Verify chunks** (1–9, no `candidate` flag) check an *existing* tradition
  record against its cited texts — amend-or-ratify, per the Recording rules
  below. Their agenda section is `## Questions to re-open against the text`.
- **Candidate chunks** (`attributes.curriculum.candidate: true`, chunks 10+)
  have **no record yet**; their agenda section is `## Questions to establish
  relevance`. The session establishes relevance and the author's
  understanding, then resolves per **## Candidate chunks** below. Everything
  else in the session frame is shared.

`/reading-review` also runs **capstone sittings** — an office-hours review of
one tradition record's broader context, targeted by a
`tactic-context-capstone-*` node (that id prefix, **not**
`tactic-reading-chunk-*`, and no `attributes.curriculum`). This skill mints
capstones born-parked when a context chunk resolves (Recording rules →
**Context-chunk capstone minting**) and runs them per **## Capstone sittings**
below. With an argument naming a `tactic-context-capstone-*` id, take it as the
target directly; with no argument, a parked capstone (`phase` ≠ `done`,
`office_hours` set) is selectable alongside the chunks — it carries no
`attributes.curriculum.priority`, so it sorts after them (run an area's
capstone once its context chunks have surfaced it).

## Precondition — confirm the sitting happened

Before the dialectic (first-run convention, 2026-07-07): confirm the author
completed the independent reading sitting for this chunk. A session run from
recollection of an older reading is not a demonstration. If the reading has
not happened, offer to stop and reconvene after the sitting rather than
proceed on recollection.

## Session flow

1. **Read the chunk node body.** Its `## Text`, agenda section (`##
   Questions to re-open against the text` for a verify chunk, `## Questions
   to establish relevance` for a candidate chunk), and `## Completion`
   sections are the session script.
2. **Surface the text citation and the questions** — the citation so the
   author has the passage in view, the questions as the agenda. Do not
   summarize the reading (periagoge).
3. **Run the demonstration as a dialectic.** The author demonstrates
   understanding of the tradition and its application to the deferral; probe
   with the body's questions. Use `AskUserQuestion` only for bounded choices,
   recommended option listed first; use plain conversation for open dialectic
   — the same split as `.claude/skills/align-strategy/SKILL.md`. The author
   articulates first on each question; Claude's account enters afterward as
   counterpoint.
4. **Record each resolution** per the recording rules below.

### Verdict refinement loop

Verdicts are not one-pass (first run, 2026-07-07 chunk 1: two recommended
options were rejected/refined, and both amendments improved). Treat every
`AskUserQuestion` verdict option as a draft: loop until the author accepts the
wording. The author's wording wins over Claude's draft.

### Session bounds

The ~30-author-minute bound is the **independent reading**, not the dialectic.
The session itself is unbounded and may span office-hours sittings. An
unconverged chunk stays parked as-is between sittings — do not force closure;
its excerpt correctly stays on the reader until `phase: done`.

### Cross-chunk boundary rule

An amendment cascade stops at claims another **unresolved** chunk owns: flag
the discovery forward onto the owning chunk node's body (append to its
`## Questions to re-open against the text` or a discovery note in the body) in
the same graph-commit, rather than resolving it now (chunk 1 → chunk-6
capstone is the precedent). A **done** chunk's claims are amendable by the
current session directly on the durable records — a resolved chunk node holds
nothing durable, so there is nothing to defer to.

### Notes-for-later exit

Mid-session author notes never die in scrollback. Each note exits two ways:

- As a self-contained follow-up prompt in the closing summary.
- Every graph-relevant note additionally lands as a born-parked office-hours
  draft tactic (no `phase` field, `office_hours` set) whose body is that
  prompt — resolved by executing it — bundled into the same graph-commit.

## Recording rules

Record every edit through
`npx tsx packages/intentionsutil/scripts/write-node.ts --file <json>` on a
`readNode`-dumped, `jq`-patched JSON. Never hand-edit YAML frontmatter.

The write-node gate, the provenance-sentence format, the delegation audit
trail, the persistence check, the chunk resolution, and the landing below are
shared by both chunk kinds. The amend-or-ratify resolution, record
codification, and chunk-6 capstone are the **verify-chunk** path; candidate
chunks resolve per **## Candidate chunks** instead.

- **The reading wins.** Amend the tradition record where the reading
  contradicts it, cascading to any virtue/strategy clarification that leaned
  on the misarticulation; ratify where it holds. Every resolution lands as a
  dated `clarifications` entry ending with a provenance sentence (date via
  `date -u +%Y-%m-%d`), e.g.
  `"...Recorded 2026-07-20 /reading-review chunk 3."`
- **Delegation audit trail.** Stamp
  `attributes.irreversibility.last_exercised` on
  `intentions/delegation-philosophical-articulation.md`. Every reading-wins
  catch — a misarticulation of the tradition or a misstatement of the
  author's position alike (2026-07-08 rule) — also lands as a dated entry in
  that delegation's `divergence.contradictions`; the list is the recovery
  loop's audit trail and entries persist after the amendment lands.
- **Codify a covered record.** When all of a tradition record's cited texts
  are covered across chunks, flip that record `status: delegated → codified`.
- **Persistence check before `phase: done`** (2026-07-08, "the graph is the
  author's knowledge map"): confirmed understanding and resolved deferrals
  must live on durable nodes — tradition records, virtue and strategy
  clarifications, the delegation record — never solely on the chunk tactic
  node, which is transient (pruned once done). Confirm the chunk node is
  prunable without loss before it resolves.
- **Resolve the chunk.** Set the chunk node `phase: "done"` — this is the
  resolution `/sync-reader` keys excerpt retirement on.
- **Refresh the strategy's fresh reading.** Set
  `strategy-philosophical-grounding`'s `reading` field to a one-line fresh
  reading describing the round (e.g. "chunk N completed YYYY-MM-DD:
  <amended|ratified> <record>"), keeping the fresh-reading gate satisfied for
  future decomposition rounds. Do **not** touch `rounds` — round accounting
  stamps when a decomposition round's final tactic completes, not per chunk.
- **Chunk-6 capstone.** If chunks 1–6 are all `done` after this session,
  revisit the apex question on both root virtues and record the outcome as a
  dated clarification on each.
- **Context-chunk capstone minting.** When this session resolves a **context
  chunk** — a selected `tactic-reading-chunk-*` node carrying
  `attributes.curriculum.distance >= 1` and a non-empty
  `attributes.curriculum.deepens` — mint a per-record capstone for each record
  the chunk deepens, in this session's same `graph-commit`. For each id in
  `deepens` that has **no unresolved capstone** (no `tactic-context-capstone-*`
  node for that record whose `phase` ≠ `done`), create
  `tactic-context-capstone-<record-slug>` via `write-node`, where the slug is
  the record id minus its `tradition-` prefix (`tradition-plato` →
  `tactic-context-capstone-plato`). Mint it **born-parked**:
  - `owner: human`, `status: codified`, `parent: null`, `phase` **absent** (the
    born-parked convention), `serves: [strategy-philosophical-grounding]`,
    `validates: []`.
  - `office_hours: {reason, since, recommendation}` — `reason` names the record,
    the resolved context chunk(s) this capstone will review, and the three
    duties (selection-bias audit, deferred amend/ratify, intent-evolution
    review); `since` via `date -u +%Y-%m-%d`; `recommendation` a best-next-step
    sentence for the author (`office_hours.recommendation` is a first-class
    schema field — write it directly, not folded into `reason`).
  - **No `attributes.curriculum`** — a capstone has no reader excerpt, and the
    `tactic-context-capstone-*` id (not `tactic-reading-chunk-*`) keeps
    `/sync-reader` from retiring an excerpt for it.

  A context chunk whose `deepens` names several records counts toward **each**
  record's capstone (precedent: a chunk citing two records). **Recurrence:** if
  the record's capstone is already `done` when a later context chunk resolves,
  mint a fresh one with a numeric suffix (`tactic-context-capstone-plato-2`,
  `-3`, …) — the deepened area gets a new sitting. Minting is bundled into the
  chunk session's single `graph-commit`; it does not run the capstone, which is
  a later office-hours sitting.

## Candidate chunks

A candidate chunk (`attributes.curriculum.candidate: true`, e.g.
`intentions/tactic-reading-chunk-10-hirschman-exit-voice.md`) has no
tradition record behind it yet. The whole session frame above applies
unchanged — precondition check, periagoge, the demonstration dialectic (the
author articulates before any account of Claude's), verdict refinement loop,
session bounds, cross-chunk boundary rule, notes-for-later exit, the
write-node recording gate, one-graph-commit landing, and the prohibitions.
Only the resolution differs: rather than amend-or-ratify an existing record,
the dialectic first establishes relevance and the author's understanding —
the body's `## Questions to establish relevance` is the agenda — then resolves
to **exactly one** primary outcome.

### Resolution — exactly one primary outcome

- **(a) adopt / diverge — create a record.** The reading is relevant and the
  author is deferred to it (or already was): create a new `tradition-*`
  record via `write-node` with `adopted` / `diverged` / `chosen_over` entries
  each carrying its graph locus (field shapes: `intentions/kind-tradition.md`
  `attributes.fields`; precedent records: `intentions/tradition-*.md`),
  `origin` per the interview (`chosen | inherited | declined`), and
  `status: codified` — the examining session *is* the author's personal
  verification, so a record born here is codified, not delegated
  (`kind-tradition`'s status clarification). Outcome (a) normally also stamps
  `attributes.traditions` on the chunk's target nodes, pointing at the new
  record, in the same bundle. A `declined`-origin record (deliberately refused
  doctrine, the `tradition-stoicism` shape) is outcome (a), not a dismissal:
  the doctrine was examined and its refusal is worth keeping auditable.
- **(b) marks only — no record.** The reading resolves the target nodes
  without a standing attachment worth recording: apply `attributes.grounding`
  / `attributes.traditions` updates to those nodes as the interview resolves
  them, and write no new record.
- **(c) dismissal — no record.** The candidate is examined and judged
  irrelevant: write a dated `clarifications` entry on
  `strategy-complete-grounding` naming the candidate and why it was dismissed.
  Write **no** tradition record — `declined` records stay reserved for refused
  doctrine, not irrelevance (`strategy-complete-grounding`'s "What records a
  candidate examined at office-hours and judged irrelevant?" clarification).

### Either outcome — shared closing steps

Whichever of (a)/(b)/(c) the session lands, bundled into the session's single
`graph-commit`:

- Stamp `attributes.irreversibility.last_exercised` on
  `intentions/delegation-philosophical-articulation.md` — this session
  exercised the recovery loop. A delegatee misarticulation caught during the
  dialectic — of the tradition or of the author's own position alike — also
  lands as a dated entry in that delegation's `divergence.contradictions`, the
  reading-wins audit-trail rule above.
- Every record and clarification carries its dated provenance sentence, and
  the resolution passes the persistence check (Recording rules) before the
  chunk resolves: the confirmed understanding must live on a durable node —
  the new record, the target nodes' marks, or the strategy clarification —
  never solely on the chunk, which is pruned once done.
- Set the chunk node `phase: "done"` — the resolution `/sync-reader` keys
  excerpt retirement on.
- Bundle every touched node — the chunk, any new record, the marked target
  nodes, the delegation, the strategy, and any cascaded or born-parked node —
  into the single `graph-commit` (Landing).

## Capstone sittings

A capstone node (`tactic-context-capstone-*`, e.g.
`tactic-context-capstone-plato`) is an office-hours review of one tradition
record's **broader context** — minted born-parked by the Context-chunk capstone
minting rule (Recording rules) once the record's first context chunk resolves,
and recurring whenever the area later deepens. It is detected by its id prefix
(`tactic-context-capstone-`), not by `attributes.curriculum`, which it does not
carry. The whole session frame above applies **unchanged** — precondition
check, periagoge (the author articulates before any account of Claude's),
verdict refinement loop, session bounds, cross-chunk boundary rule,
notes-for-later exit, the write-node recording gate, the persistence check,
one-graph-commit landing, and the prohibitions. Only the agenda differs: rather
than a chunk's `## Questions` script, the capstone runs the three standing
duties over the record and the resolved context chunk(s) named in its
`office_hours.reason`.

### The three duties

- **Selection-bias audit.** Were the delegatee-chosen focused excerpts
  representative of the record's tradition, judged against the now-read broader
  context? (The 2026-07-07 chunk-1 session observed the risk live: *Republic*
  VII was verified partly from 592a-b, outside the chunk's own range.) Where an
  excerpt misled, the reading wins — amend the record.
- **Deferred amend/ratify pass.** Re-open the record's earlier amend/ratify
  outcomes against the broader context now in view; the reading wins over the
  prior verdict (the standing clarification on
  `strategy-philosophical-grounding`). Context chunks defer their amend/ratify
  to this sitting when it does not fit the chunk itself
  (`.claude/skills/context-chunks/SKILL.md`).
- **Intent-evolution review.** Drift in *understanding* amends the tradition
  record; drift in *intent* lands as dated `clarifications` on the affected
  virtue / strategy nodes.

### Closing steps

As for the other chunk kinds, bundled into the sitting's single `graph-commit`:

- Stamp `attributes.irreversibility.last_exercised` on
  `intentions/delegation-philosophical-articulation.md` — this sitting
  exercised the recovery loop. Every reading-wins catch — a misarticulation of
  the tradition or a misstatement of the author's position alike — also lands as
  a dated entry in that delegation's `divergence.contradictions`.
- Every amended record and clarification carries its dated provenance sentence
  (e.g. `"...Recorded 2026-07-20 /reading-review capstone tradition-plato."`),
  and the resolution passes the persistence check (Recording rules): the
  confirmed understanding lives on durable nodes — the record, the virtue /
  strategy clarifications, the delegation — never solely on the capstone node,
  which is pruned once done.
- Refresh `strategy-philosophical-grounding`'s `reading` field to a one-line
  fresh reading naming the capstone round.
- Set the capstone node `phase: "done"` — the resolution `/sync-reader` keys on
  (a capstone carries no excerpt, so nothing is retired; resolution still clears
  its `office_hours` park via the graph-commit).
- Bundle every touched node — the capstone, the amended record(s), any cascaded
  virtue / strategy clarifications, the delegation, the strategy, and any
  born-parked note-for-later draft — into the single `graph-commit`.

## Landing

ONE `packages/intentionsutil/scripts/graph-commit <id> [<id> ...]` call
bundling every touched node — the chunk, the tradition record(s), the
delegation, the strategy, any cascaded nodes, and any born-parked draft from a
notes-for-later exit. The commit touching the chunk node clears its
`office_hours` park (`intentions/tactic-graph-native-dispatch.md` §1.3).

If `graph-commit` exits 1 having printed a parking message, a concurrent edit
conflicted and this session's content did not land. Report it and stop — no
automatic retry.

## Prohibitions

- No `gh` commands anywhere in this flow.
- No edits outside `intentions/`.
- Never weaken or skip a chunk. A chunk that cannot complete in the sitting
  stays parked as-is.

## Reuse

- `packages/intentionsutil/scripts/write-node.ts` — the single frontmatter
  write gate; `readNode`/`listNodes` at
  `packages/intentionsutil/src/store.ts:110,124`.
- `packages/intentionsutil/scripts/graph-commit` — the only landing path.
- `.claude/skills/align-strategy/SKILL.md` — register, `AskUserQuestion`
  conventions, provenance-sentence format.
- Chunk node bodies (`intentions/tactic-reading-chunk-*.md`) — the per-chunk
  session script this skill consumes.

## Verification

Prose only — a SKILL.md is model instructions with no automated test surface.

- Dry-run in an interactive session against
  `tactic-reading-chunk-1-plato-cave` without landing (stop before
  `graph-commit`): confirm the skill selects chunk 1 by priority, surfaces its
  three questions, produces valid patched JSON that
  `npx tsx packages/intentionsutil/scripts/validate-graph.ts` accepts, and
  plans exactly one graph-commit bundle.
- Dry-run the candidate branch against
  `tactic-reading-chunk-10-hirschman-exit-voice` without landing (stop before
  `graph-commit`): confirm the branch detects `candidate: true`, surfaces its
  `## Questions to establish relevance`, offers the three resolutions (a
  record / marks only / dismissal) with the author's articulation preceding
  any account of Claude's, and for outcome (a) produces JSON that
  `npx tsx packages/intentionsutil/scripts/validate-graph.ts` accepts (a
  `tradition-hirschman` record plus `attributes.traditions` stamps), with the
  delegation stamp and the chunk resolution in the same bundle. Confirm the
  verify-chunk flow is unchanged by the edit.
- Dry-run the capstone path without landing. Construct a synthetic resolved
  context chunk (`attributes.curriculum` `{priority: 99, distance: 1, deepens:
  ["tradition-plato"], passages: […]}`) and confirm the Recording rules plan
  minting `tactic-context-capstone-plato` born-parked — `owner: human`,
  `status: codified`, `parent: null`, no `phase`, `serves:
  [strategy-philosophical-grounding]`, `validates: []`, no
  `attributes.curriculum`, and an `office_hours.reason` naming the record, the
  chunk, and the three duties — producing JSON that
  `npx tsx packages/intentionsutil/scripts/validate-graph.ts` accepts; with
  `deepens` naming two records, two capstones are planned. Then dry-run a
  `tactic-context-capstone-*` target and confirm the **## Capstone sittings**
  branch surfaces the three-duty agenda with the author articulating before any
  account of Claude's, and that the verify- and candidate-chunk flows are
  unchanged by the edit.
- Confirm no `gh` invocation appears anywhere in the flow.
