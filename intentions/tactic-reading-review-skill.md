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
- **Periagoge (the design principle — Republic 518b-d, verified chunk 1;
  2026-07-08 clarification on `strategy-philosophical-grounding`)**:
  education is the art of turning, not of putting sight into eyes. The
  skill turns the author toward the text; it never implants Claude's
  account of the reading — an interview that implants the account is the
  same capture the recovery loop exists to unwind. Concretely: probes cite
  the text, not Claude's gloss; the author articulates before any account
  of Claude's appears; Claude's account enters only afterward, as challenge
  or counterpoint to a position the author has committed to; never open a
  session with a summary of the reading; bounded verdicts may only close
  questions the author's own articulation has already opened.
- **Verdict refinement loop**: verdicts are not one-pass (first run,
  2026-07-07 chunk 1: two recommended options rejected/refined, both
  amendments improved). Verdict options are drafts; loop until the author
  accepts the wording — the author's wording wins over Claude's draft.
- **Session bounds**: the ~30-author-minute bound is the independent
  reading, not the dialectic. The session is unbounded and may span
  office-hours sittings: an unconverged chunk stays parked as-is between
  sittings (its excerpt correctly stays on the reader until `phase: done`).
- **Cross-chunk boundary rule**: an amendment cascade stops at claims
  another *unresolved* chunk owns — flag the discovery forward onto the
  owning chunk node's body in the same graph-commit (chunk 1 → chunk-6
  capstone is the precedent). A *done* chunk's claims are amendable by the
  current session directly on the durable records — a resolved chunk node
  holds nothing durable.
- **Notes-for-later exit**: mid-session author notes never die in
  scrollback. Each exits as a self-contained follow-up prompt in the
  closing summary, and every graph-relevant note additionally lands as a
  born-parked office-hours draft tactic (no `phase`, `office_hours` set)
  whose body is that prompt — resolved by executing it — bundled into the
  same graph-commit.
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
    `intentions/delegation-philosophical-articulation.md`. Required rule
    (2026-07-08): every reading-wins catch — a misarticulation of the
    tradition or a misstatement of the author's position alike — also lands
    as a dated entry in that delegation's `divergence.contradictions`; the
    list is the recovery loop's audit trail and entries persist after the
    amendment lands.
  - When all of a tradition record's cited texts are covered across chunks,
    flip that record `status: delegated → codified`.
  - Persistence check before `phase: done` (2026-07-08, "the graph is the
    author's knowledge map"): confirmed understanding and resolved
    deferrals must live on durable nodes — tradition records, virtue and
    strategy clarifications, the delegation record — never solely on the
    chunk tactic node, which is transient (pruned once done). The chunk
    node must be prunable without loss before it resolves.
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
