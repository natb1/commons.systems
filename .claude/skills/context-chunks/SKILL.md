---
name: context-chunks
description: Autonomous worker lane that drafts broader-context reading chunks (passages + questions only) deepening a resolved reading. Trigger on /context-chunks <resolved-reading-id>; Opus-only; born-parked drafts, never phase-set tactics or tradition records.
---

# Context-chunk selection worker

Draft the broader-context reading chunks that deepen a resolved reading and
reinforce the original education. The worker-lane instrument for the
context-chunk admission rule on `strategy-complete-grounding` (clarifications
8–9, 2026-07-08 context-broadening interview): after a reading resolves,
draft whatever broader context most deepens it — the full work the excerpts
came from, the author's other writings, contemporaries, the surrounding
culture — as a **capture guard** auditing delegatee excerpt selection (the
2026-07-07 chunk-1 session verified Republic VII partly from 592a-b, outside
the chunk's own range — the risk observed live).

**Run on Opus.** Chunk selection is the surface where delegatee bias enters
the curriculum, so it gets the strongest model — a condition on
`strategy-complete-grounding` (`attributes.conditions`). If the session is not
Opus, stop and report; do not draft on a weaker model.

Autonomous: tick-emulation or on-demand. **Never** `AskUserQuestion` — the
drafts are born-parked for the author, not resolved in-session.

## Trigger

`/context-chunks <resolved-chunk-or-tradition-record-id>`

The argument is a resolved reading — a `tactic-reading-chunk-*` node at
`phase: done`, or a `tradition-*` record freshly verified. **With no argument,
stop and report that an id is required.** The skill never selects its own
target; the id comes from the caller (a completed chunk, or the router).

Confirm the target is genuinely resolved before drafting: a
`tactic-reading-chunk-*` must be `phase: done` with a non-null `reading`
field; a `tradition-*` record must carry a verifying clarification. If the
target is not resolved, stop and report — there is nothing to deepen yet.

## Selection — recursive, by relevance

Recursively choose the broader context most relevant for **deepening
understanding of that reading and reinforcing the original education**. Choose
by relevance, **never** by a fixed excerpt→work→author→culture tier ladder
(strategy clarification 8): the full work an excerpt came from, the author's
other writings, contemporaries, or the surrounding culture — whichever most
deepens *this* reading.

Drafting is **unrestricted in time** — draft as much context as is relevant.
Only reading *priority* is gated (see Ordering); selection itself is not
rationed.

A chunk may deepen more than one tradition record; a single resolved reading
may spawn several context chunks at different distances.

## Format — the Cave-educator constraint

Each drafted chunk carries **passages + questions only** — never conclusions,
summaries, or statements of what the context shows (strategy clarification 9).
Telling is exactly where delegatee selection bias re-enters: the worker's role
is the Republic VII educator's — turn the author toward the graph's recorded
good, do not give sight by supplying facts.

Questions must embed the three named dialectic forms
(`strategy-philosophical-grounding`, 2026-07-08):

- **Recall-first delta** — before reading, the author states from memory what
  the prior related reading established; the gap against the record is
  measured calcification. Pose this first.
- **Elenchus** — pose the strongest objection to the author's current
  articulation for the author to defend or amend.
- **Rival-tradition steelman** — articulate how a rival *recorded* tradition
  reads the same passage.

**Amend/ratify and intent-evolution review** run inside chunks that directly
touch prior outcomes; where they do not fit, defer them to the area capstone
chunk when one exists (the per-record capstone review tactic). Do not force an
audit into a chunk that does not touch its subject.

## Chunk shape

Same discipline as the existing curriculum
(`intentions/tactic-reading-chunk-*.md`):

- **Size**: ≤30 author-minutes per sitting.
- **Body sections**: `Text` / `Questions` / `Completion`.
- **`owner`**: `human`.
- **Born-parked**: omit `phase`; set `office_hours` with `reason`, `since`
  (today's date), and `recommendation` (a best-next-steps sentence for the
  author — `office_hours.recommendation` is a first-class schema field; write
  it directly, not folded into `reason`).
- **`parent`**: `tactic-tradition-reading-program`.
- **`serves`**: `[strategy-complete-grounding]`.
- **`validates`**: `[]` — context chunks are off the candidate signal path.
- **`attributes.curriculum`** (sync-reader-compatible), extended with:
  - `priority`: appended after the current queue max (see Ordering) — drives
    `/sync-reader` file naming.
  - `passages`: `[{work, range}]` — the excerpts to read, as in existing
    chunks.
  - `distance`: hops removed from a critical-path node. Focused verify /
    candidate chunks are `0`; context chunks are `≥ 1` (the first ring of
    broader context is `1`, its context `2`, and so on).
  - `deepens`: the tradition-record id(s) this context deepens — a list; a
    chunk may cite several (e.g. `[tradition-plato]`).

## Ordering

Reading priority ascends by `distance` (nearer the critical path reads
first), ties broken by doctrine load, per
`strategy-recovery-critical-path`'s distance ordering. Attention and blockers
may override that order.

Set `attributes.curriculum.priority` by appending **after the current queue
max**: read the max `attributes.curriculum.priority` across existing
`intentions/tactic-reading-chunk-*.md` nodes and number new chunks from
`max + 1` upward, in `distance`-ascending order. Priority is the `/sync-reader`
file-naming key, distinct from the read-order semantics above.

## Landing

- One `write-node.ts` call per chunk (full validated node JSON on stdin or
  `--file`), then **one** `graph-commit` bundling all chunks from this run:

  ```bash
  node --import tsx/esm packages/intentionsutil/scripts/write-node.ts --file "$TMPDIR/chunk.json"
  packages/intentionsutil/scripts/graph-commit <chunk-id> [<chunk-id> ...]
  ```

  `write-node.ts` lands frontmatter only and preserves an existing body; write
  the `Text`/`Questions`/`Completion` body via `Edit` after the frontmatter
  lands. Never hand-author YAML.

- **Prohibitions**:
  - No `gh` — this lane touches only the graph.
  - No edits outside `intentions/`.
  - Drafts only — never phase-set a tactic (`phase` stays absent), never
    create or amend a tradition record, never apply grounding marks. Those are
    office-hours / `/reading-review` work.

- The auto-mode `.claude/skills/**` commit-denial caveat does not apply here
  (this lane writes `intentions/`, not skills); the `write-node.ts` /
  `graph-commit` path is the only landing route. On a `graph-commit` conflict
  (exit 1 with a parking message) the node auto-parks and this run's content
  is not landed — report it and stop; do not re-land over a concurrent writer.

## Verification (dry-run)

Run against `tactic-reading-chunk-1-plato-cave` (resolved 2026-07-07) **without
landing**: confirm each drafted chunk carries passages + questions only (no
conclusions or summaries), `attributes.curriculum` has `distance ≥ 1` and
`deepens` naming `tradition-plato`, `priority` lands after the current queue
max, and the node JSON passes
`node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts`.
Confirm the skill preamble pins Opus and the drafts invoke no `gh`.
