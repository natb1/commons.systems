---
name: grounding-research
description: Interactive author-invoked grounding-research skill — the author-side consumer of the tick gap analysis. Walk the ranked unmarked durable-layer nodes top-down; per node, mark it circumstantial or `/deep-research` frontier work into candidate curriculum chunks; land every mark and new chunk in one `graph-commit`. Office-hours only, never tick-invoked.
user-invocable: true
---

# Grounding Research

`/grounding-research` walks the grounding gap ranking with the author and
closes gaps one durable-layer node at a time. It instruments
`strategy-complete-grounding`'s interactive-research actuator: the tick sensor
(`tactic-grounding-gap-analysis`) reports the ranked unmarked nodes; this skill
is the author-side half that acts on that ranking.

This is the **one place** grounding/circumstantial marks are written outside a
`/reading-review` session (strategy `complete-grounding`, 2026-07-07 interview).

## Trigger and input

On-demand only, author present — an interactive office-hours skill. **Never
tick-invoked** (a condition on `strategy-complete-grounding`: `/deep-research`
sourcing stays author-invoked). A tick worker never runs this skill and never
writes a grounding mark.

Interaction split — same as `.claude/skills/align/SKILL.md`: reserve
`AskUserQuestion` for bounded choices (recommended option first); run open
dialectic (why a node is circumstantial, which found work is load-bearing) as
ordinary conversational turns.

## Step 0 — Claim and isolate

Author in the node's own worktree, never the shared `main` checkout — a second
session's dirty tracked file blocks your `graph-commit` rebase and a stale read
races live phase state. Do all authoring and the step-4 `graph-commit` from the
worktree, on a verified-fresh checkout. **Prefer the `provision-node-worktree`
primitive** (`.claude/skills/dispatch-propagate/scripts/provision-node-worktree`):
it fetches `origin/main` and cuts the worktree fresh from it, so no separate
freshness check is needed after it. If instead you use native `EnterWorktree`,
**or** re-enter an **already-existing** worktree by any means **other than
`provision-node-worktree`**, running
`.claude/skills/dispatch-propagate/scripts/assert-worktree-fresh` is
**mandatory** as the very first action in that worktree — **before any graph
read**, i.e. before Step 1's gap-report regeneration. A non-zero exit means the
checkout is stale **or** the `git fetch` itself failed; either way, **stop** and
freshen (`git fetch origin main && git merge origin/main`) before proceeding.
Never treat a failed fetch as license to proceed on unverified state.

Never run `gh` anywhere in this flow (`assert-worktree-fresh`'s own `git fetch`
is not a `gh` call, so it does not conflict with this).

## Step 1 — Refresh the gap report

Regenerate the ranking at session start — never trust a stale report:

```bash
node --import tsx/esm packages/intentionsutil/scripts/grounding-gap.ts
```

(`tactic-grounding-gap-analysis`.) It prints the durable-layer census and the
unmarked nodes ranked by deference/capture exposure, highest first. Add
`--json` for the machine-readable `GroundingReport` if you want to drive the
walk programmatically. Walk the ranked list **top-down, in report order** — the
ranking is the agenda.

## Step 2 — Per node, in ranking order

For each ranked node, in order:

1. **Circumstantial check first.** Ask the author whether the node is unmarked
   because it is *circumstantial to the author* — grounded in this author's
   particular situation, not in a body of thought that could be examined. If
   so, record `attributes.grounding: "circumstantial: <the author's why>"` and
   move to the next node. Ask this before sourcing — a circumstantial node
   needs no research.

2. **Otherwise source.** Run `/deep-research` to find relevant frontier work
   across philosophical, technical, peer-review, and creative literature for
   the node's domain. The dialectic over which returned work is actually
   load-bearing is a conversational turn, not a gated question.

3. **Empty search.** If `/deep-research` surfaces nothing relevant, record
   `attributes.grounding: "none-found: <date>"` — get the date via
   `date -u +%Y-%m-%d`, never hand-guessed.

## Step 3 — Enqueue candidate curriculum chunks

For each found body of thought worth examining, write a candidate curriculum
chunk in the chunks-10–17 convention. Mirror
`intentions/tactic-reading-chunk-10-hirschman-exit-voice.md` exactly:

- `owner: human`
- **Born-parked**: `office_hours` set (`reason` + `since` +
  `recommendation`), `phase` field **absent** (a born-parked candidate is not
  selectable work).
- `parent: tactic-tradition-reading-program`
- `serves: [strategy-complete-grounding]` and
  `validates: [strategy-complete-grounding]`
- `attributes.curriculum: {priority: <current queue max + 1, appended after
  the existing queue>, candidate: true, passages: [{work, range}]}` — read the
  current max priority off the existing `tactic-reading-chunk-*` nodes and
  append.
- Body with `# <title>`, then `## Text`, `## Questions to establish relevance`,
  and `## Completion` sections.

**Passages and questions only — never a summary of what the candidate teaches**
(the Cave-educator constraint, strategy clarification 9). The chunk names the
text and the questions to put to it; the office-hours sitting that examines the
chunk decides what it teaches.

## Step 4 — Record everything in one bundle

Every frontmatter write goes through `write-node.ts` on a readNode-dumped,
jq-patched JSON — **never hand-edit YAML**:

```bash
node --import tsx/esm packages/intentionsutil/scripts/write-node.ts --dir intentions --file "$TMPDIR/<node>.json"
```

Land **everything this session produced in ONE `graph-commit` bundle** at
session end — grounding/circumstantial/none-found marks, every new candidate
chunk, and any `strategy-complete-grounding` clarification the author dictates:

```bash
packages/intentionsutil/scripts/graph-commit <id> [<id> ...]
```

`graph-commit` is the only write path — never a hand-rolled `git commit` /
`git push`. If it exits 1 having printed a parking message, a concurrent edit
conflicted and the node landed with `office_hours` set instead of your content;
tell the author and stop, do not retry automatically.

## Prohibitions

- **No `gh`** anywhere in the flow — this skill touches only `intentions/` via
  `graph-commit`.
- **Marks only in this author-present session.** Tick workers never write
  grounding marks (strategy clarification 4).
- **Never create a `tradition-*` record here.** Records are created only at the
  office-hours session that examines a candidate chunk (strategy
  clarification 2); a dismissal at that session lands as a
  `strategy-complete-grounding` clarification, not a record (clarification 3).

## Reuse

- `packages/intentionsutil/scripts/grounding-gap.ts` — the session's input
  ranking (`tactic-grounding-gap-analysis`).
- `packages/intentionsutil/scripts/write-node.ts`,
  `packages/intentionsutil/scripts/graph-commit` — the write path.
- `intentions/tactic-reading-chunk-10-hirschman-exit-voice.md` — the
  candidate-chunk template this skill instantiates.
- `.claude/skills/align/SKILL.md` — register and interaction
  conventions.

## Verification

No automated test surface — a SKILL.md is model instructions. Manual dry-run in
an interactive session (stop before `graph-commit`): confirm the skill
refreshes the gap report, walks nodes in report order, asks circumstantial
before sourcing, produces mark JSON and one candidate-chunk node that
`node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions` accepts, and plans
exactly one `graph-commit` bundle. Confirm no `gh` invocation appears in the
flow and the skill states it is never tick-invoked.
