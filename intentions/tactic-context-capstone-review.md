---
id: tactic-context-capstone-review
kind: tactic
statement: Per-record context capstone review — /reading-review extension owning
  the selection-bias audit, deferred amend/ratify, and intent-evolution review
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-07-11 /align-tactics round from the 2026-07-08
  retained draft: the session instrument for the capstone doctrine recorded on
  strategy-philosophical-grounding (2026-07-08 calcification-guard and
  context-area clarifications) — one capstone per tradition record, minted when
  the record's first context chunk resolves. Extends
  .claude/skills/reading-review/SKILL.md the same way the candidate-chunk
  extension did (tactic-reading-review-candidate-extension, PR 2814); nothing
  gates it since that skill is landed. Off the minimum signal path (no validates
  edge) by design — calculated attention demotes it; the author's direct boost 7
  carries its priority."
reading: null
gap: null
serves:
  - strategy-philosophical-grounding
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 7
  override: null
  rationale: "Author-directed 2026-07-09: curriculum-frontier machinery — a
    /reading-review extension owning the selection-bias audit, deferred
    amend/ratify, and intent-evolution review. Same tier as the other curriculum
    tooling (tactic-reading-review-skill, tactic-sync-reader-skill: boost 7). It
    serves strategy-philosophical-grounding (unboosted, and too broad to boost
    as a whole), so it takes the full boost 7 directly rather than by
    inheritance to reach the same authored-7 curriculum tier."
phase: review
execution:
  branch: tactic-context-capstone-review
  pr: 2850
  attempts: {}
  markers:
    - qa-done
    - reviewed
  strategy_fingerprint: 4938e3dd607b936f594cb15964e7096ae8da08b91c2177910589282473b95a68
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Per-record context capstone review — /reading-review extension owning the selection-bias audit, deferred amend/ratify, and intent-evolution review

## Context

`strategy-philosophical-grounding`'s 2026-07-08 clarifications ("What guards
prior learnings against calcification…" and "What closes a context area…")
record the capstone doctrine: one capstone review per tradition record
(context area), created when the record's first context chunk resolves; an
ordinary at-most-30-author-minute office-hours sitting owning three duties —
the selection-bias audit, the deferred amend/ratify pass, and the
intent-evolution review; it recurs if the area's context later deepens.
Nothing implements it yet.

Context chunks are produced by `/context-chunks`
(`.claude/skills/context-chunks/SKILL.md`, landed by
`tactic-context-chunk-selection`, PR 2808): born-parked reading chunks with
`attributes.curriculum.distance >= 1` and `attributes.curriculum.deepens`
naming the tradition record id(s) they deepen. That skill explicitly defers
amend/ratify and intent review "to an area capstone chunk when one exists" —
this tactic supplies the machinery that mints and runs those capstones. No
context chunk exists on origin/main at plan time, so this must land before
the first one resolves. Nothing gates it: `.claude/skills/reading-review/SKILL.md`
is landed, including the candidate-chunk extension
(`tactic-reading-review-candidate-extension`, PR 2814) whose structural shape
this follows.

## Units of work

### Unit 1 — capstone machinery in `.claude/skills/reading-review/SKILL.md`

**Scope.** One edited file: `.claude/skills/reading-review/SKILL.md` (read
the landed file for exact anchor points). Two additions:

1. **Capstone minting rule** — a context-chunk case in the closing/recording
   steps: when the session resolves a context chunk (the selected
   `tactic-reading-chunk-*` node carries `attributes.curriculum.distance >= 1`
   and `attributes.curriculum.deepens`), then for each record id in `deepens`
   that has no unresolved capstone node, mint
   `tactic-context-capstone-<record-slug>` (e.g.
   `tactic-context-capstone-plato` for `tradition-plato`) in the same
   graph-commit, born-parked: `owner: human`, `status: codified`,
   `parent: null`, `phase` absent, `serves: [strategy-philosophical-grounding]`,
   `validates: []`, `office_hours: {reason, since, recommendation}` where the
   reason names the record, the resolved context chunk(s) it will review, and
   the three duties (since via `date -u +%Y-%m-%d`). No
   `attributes.curriculum` — a capstone has no reader excerpt, and the id
   prefix (not `tactic-reading-chunk-*`) keeps `/sync-reader` from picking it
   up. A context chunk deepening several records counts toward **each**
   record's capstone (precedent: chunk 4 cites two records). Recurrence: a
   context chunk resolving after its record's capstone is already `done`
   mints a fresh capstone (id suffixed `-2`, `-3`, …).
2. **Capstone sitting branch** — a section sibling to "## Candidate chunks",
   detected by id prefix `tactic-context-capstone-`. The shared session frame
   — precondition check, periagoge, verdict refinement loop, session bounds,
   cross-chunk boundary rule, notes-for-later exit, the write-node recording
   gate, persistence check, single graph-commit, prohibitions — applies
   unchanged. The agenda is the three duties:
   - **Selection-bias audit** — were the delegatee-chosen focused excerpts
     representative, judged against the now-read broader context? (The
     2026-07-07 chunk-1 session observed the risk live: Republic VII verified
     partly from 592a-b, outside the chunk's own range.)
   - **Deferred amend/ratify pass** — re-open the record's earlier
     amend/ratify outcomes against the broader context; the reading wins
     (existing clarification on `strategy-philosophical-grounding`).
   - **Intent-evolution review** — drift in understanding amends the
     tradition record; drift in intent lands as dated clarifications on the
     affected virtue/strategy nodes.
   Closing steps as for other chunks: stamp
   `attributes.irreversibility.last_exercised` on
   `intentions/delegation-philosophical-articulation.md`, record every
   reading-wins catch in that delegation's `divergence.contradictions`,
   refresh the strategy's `reading` field, set the capstone `phase: "done"`,
   and bundle everything in the sitting's one `graph-commit`.

**Out of scope**: the verify-chunk and candidate-chunk flows (unchanged);
`.claude/skills/context-chunks/SKILL.md` (read for the `deepens` convention,
not edited); `/sync-reader`; the mode-A/mode-B sitting generalization (owned
by the draft `tactic-review-sitting-skill-generalization`, serving
`strategy-graph-review-curriculum`).

Note for the implementing session: committing `.claude/skills/**` from an
auto-mode dispatch session can be denied by the permission classifier
(agent-behavior config); if the commit is blocked, surface it rather than
retrying — the human grants and the session retries.

**Recommended model**: opus

## Reuse

- `.claude/skills/reading-review/SKILL.md` — the file under edit; its
  recording rules (write-node on readNode-dumped jq-patched JSON, one
  graph-commit, provenance sentences, persistence check) are reused verbatim
  by the branch. The candidate-chunk extension (PR 2814) is the structural
  precedent for adding a chunk-kind branch.
- `intentions/tactic-context-chunk-selection.md` — the landed context-chunk
  shape (`attributes.curriculum.distance` / `deepens`) the minting rule keys
  on.
- `packages/intentionsutil/scripts/write-node.ts`,
  `packages/intentionsutil/scripts/graph-commit` — the write path any example
  in the skill must cite.

## Verification

No automated test surface (a SKILL.md is model instructions). Manual dry-run
in an interactive session, stopping before `graph-commit`: construct a
synthetic resolved context chunk (`attributes.curriculum`
`{priority: 99, distance: 1, deepens: ["tradition-plato"], passages: […]}`)
and confirm the edited skill (1) plans minting `tactic-context-capstone-plato`
born-parked with the three duties and the chunk id in its
`office_hours.reason`, producing JSON that
`npx tsx packages/intentionsutil/scripts/validate-graph.ts` accepts; (2) with
`deepens` naming two records, plans two capstones; (3) the capstone sitting
branch surfaces the three-duty agenda with the author articulating before any
account of Claude's; (4) the verify-chunk and candidate-chunk flows are
unchanged by the edit and no `gh` invocation appears anywhere.
