---
id: tactic-reading-review-skill
kind: tactic
statement: "Draft: office-hours reading-review skill — run one curriculum
  chunk's demonstration, amend-or-ratify the records, resolve the chunk node"
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-07-06 /align-strategy interview
  (retain-not-refine): the author expects the curriculum's office-hours sessions
  to be skill-guided — demonstrate understanding of the tradition and its
  application to the deferral, revise the graph where the reading contradicts
  it, and resolve the chunk node, which is what triggers /sync-reader's
  retirement of the chunk's excerpt from the reader. Instruments
  strategy-philosophical-grounding's owner-review-at-office-hours sensor."
reading: null
gap: null
serves:
  - strategy-philosophical-grounding
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# /reading-review skill — run one curriculum chunk's office-hours demonstration, amend-or-ratify the records, resolve the chunk node

## Context

The tradition-reading curriculum (`tactic-tradition-reading-program` subtree)
is encoded as nine born-parked office-hours tactic nodes
(`tactic-reading-chunk-*`), each one personal-reading sitting of ≤30
author-minutes verifying delegated tradition articulations against the
primary texts (the recovery loop of
`delegation-philosophical-articulation`). The author decided (2026-07-06
/align-strategy interview, recorded on `strategy-philosophical-grounding`)
that these sessions are skill-guided: the author demonstrates understanding
of the tradition and its application to the deferral, the graph is revised
where the reading contradicts it, and the chunk node is resolved — which is
the trigger `/sync-reader` (`tactic-sync-reader-skill`) uses to retire the
chunk's excerpt from the e-reader. This tactic creates that skill. It
instruments the strategy's success-signal sensor ("owner review at
office-hours"): every completed chunk produces a recorded round that moves a
node (amend) or flips trust to verification (ratify).

Note for the implementing session: committing `.claude/skills/**` from an
auto-mode dispatch session can be denied by the permission classifier
(agent-behavior config); if the commit is blocked, surface it rather than
retrying — the human grants and the session retries.

## Units of work

### Unit 1 — author `.claude/skills/reading-review/SKILL.md`

**Scope.** One new file: `.claude/skills/reading-review/SKILL.md`. No
scripts, no hooks, no other files. Follow `ref-write-instructions` when
authoring. The skill it defines is interactive (an office-hours skill — the
inverse of `/align-tactics`' autonomy contract), and must specify:

- **Trigger**: `/reading-review [chunk-node-id]`. With no argument, select
  the unresolved chunk with the lowest `attributes.curriculum.priority` —
  unresolved = a `tactic-reading-chunk-*` node with `phase` ≠ `done` and
  `office_hours` set. Read candidates via `listNodes`
  (`packages/intentionsutil/src/store.ts:88`) or by reading the files; the
  frontmatter is authoritative.
- **Session flow**: (1) read the chunk node body — its `## Text`,
  `## Questions to re-open against the text`, and `## Completion` sections
  are the session script; (2) surface the text citation and questions; (3)
  run the demonstration as a dialectic — the author demonstrates
  understanding of the tradition and its application to the deferral; probe
  with the body's questions; use `AskUserQuestion` only for bounded choices
  (recommended option first), plain conversation for open dialectic — same
  split as `.claude/skills/align-strategy/SKILL.md`; (4) record each
  resolution.
- **Recording rules** (all via
  `npx tsx packages/intentionsutil/scripts/write-node.ts --file <json>` on a
  `readNode`-dumped, jq-patched JSON — never hand-edit YAML frontmatter):
  - The standing rule is "the reading wins": amend the tradition record where
    the reading contradicts it, cascading to any virtue/strategy
    clarification that leaned on the misarticulation; ratify where it holds.
    Every resolution lands as a dated `clarifications` entry ending with a
    provenance sentence (date via `date -u +%Y-%m-%d`), e.g.
    `"...Recorded 2026-07-20 /reading-review chunk 3."`
  - Stamp `attributes.irreversibility.last_exercised` on
    `intentions/delegation-philosophical-articulation.md`.
  - When all of a tradition record's cited texts are covered across chunks,
    flip that record `status: delegated → codified`.
  - Set the chunk node `phase: "done"` — this is the resolution
    `/sync-reader` keys excerpt retirement on.
  - Refresh `strategy-philosophical-grounding`'s `reading` field with a
    one-line fresh reading describing the round (e.g. "chunk N completed
    YYYY-MM-DD: <amended|ratified> <record>"), keeping the fresh-reading
    gate satisfied for future decomposition rounds. Do not touch
    `rounds` — round accounting stamps when a decomposition round's final
    tactic completes, not per chunk.
  - Chunk-6 capstone: if chunks 1–6 are all `done` after this session,
    revisit the apex question on both root virtues and record the outcome as
    a dated clarification on each.
- **Landing**: ONE
  `packages/intentionsutil/scripts/graph-commit <id> [<id> ...]` call
  bundling every touched node (chunk, tradition record(s), delegation,
  strategy, any cascaded nodes). The commit touching the chunk node clears
  its `office_hours` park (`intentions/tactic-graph-native-dispatch.md`
  §1.3). On a graph-commit conflict park (exit 1 with parking message),
  report and stop — no automatic retry.
- **Prohibitions**: no `gh` commands anywhere; no edits outside
  `intentions/`; never weaken or skip a chunk — a chunk that cannot complete
  in the sitting stays parked as-is.

**Out of scope**: `/sync-reader` itself (sibling tactic); any change to
`packages/intentionsutil`; automation of the reading.

**Recommended model**: opus

## Reuse

- `packages/intentionsutil/scripts/write-node.ts` — the single frontmatter
  write gate; `readNode`/`listNodes` at
  `packages/intentionsutil/src/store.ts:74,88`.
- `packages/intentionsutil/scripts/graph-commit` — the only landing path.
- `.claude/skills/align-strategy/SKILL.md` — register, AskUserQuestion
  conventions, provenance-sentence format.
- Chunk node bodies (`intentions/tactic-reading-chunk-*.md`) — the per-chunk
  session script this skill consumes.

## Verification

No automated test surface — a SKILL.md is model instructions. Manual:

- Dry-run in an interactive session against
  `tactic-reading-chunk-1-plato-cave` without landing (stop before
  `graph-commit`): confirm the skill selects chunk 1 by priority, surfaces
  its three questions, produces valid patched JSON that
  `npx tsx packages/intentionsutil/scripts/validate-graph.ts` accepts, and
  plans exactly one graph-commit bundle.
- Confirm no `gh` invocation appears anywhere in the SKILL.md flow.
