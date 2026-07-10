---
name: reading-review
description: Office-hours skill that runs one tradition-reading curriculum chunk's demonstration — the author demonstrates understanding of the tradition and its application to the deferral against the primary text, the graph is amended where the reading contradicts it or ratified where it holds, and the chunk node is resolved (phase → done), which triggers /sync-reader's retirement of the chunk's excerpt from the e-reader. Interactive and unbounded; the inverse of /align-tactics' autonomy contract. Never files a GitHub issue.
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

## Precondition — confirm the sitting happened

Before the dialectic (first-run convention, 2026-07-07): confirm the author
completed the independent reading sitting for this chunk. A session run from
recollection of an older reading is not a demonstration. If the reading has
not happened, offer to stop and reconvene after the sitting rather than
proceed on recollection.

## Session flow

1. **Read the chunk node body.** Its `## Text`, `## Questions to re-open
   against the text`, and `## Completion` sections are the session script.
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
- Confirm no `gh` invocation appears anywhere in the flow.
