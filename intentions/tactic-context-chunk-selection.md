---
id: tactic-context-chunk-selection
kind: tactic
statement: Context-chunk selection worker lane — recursively draft
  broader-context reading chunks (passages + questions only, Opus-only) for
  resolved readings
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-07-10 /align-tactics round from the 2026-07-08
  /align-strategy context-broadening draft: the worker-lane instrument for the
  context-chunk admission rule on strategy-complete-grounding, constrained by
  the Cave-educator clarification (turning, not telling) and the Opus condition.
  Off the minimum signal path (no validates edge) by design — calculated
  attention demotes it; the author's direct boost 7 carries its priority."
reading: null
gap: null
serves:
  - strategy-complete-grounding
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 7
  override: null
  rationale: "Author-directed 2026-07-09: curriculum-frontier machinery — the
    context-chunk selection worker lane that recursively drafts broader-context
    reading chunks (the mode-B context-broadening expansion that grows the
    frontier). Same tier as the other curriculum tooling
    (tactic-reading-review-skill, tactic-sync-reader-skill: boost 7). It serves
    strategy-complete-grounding (unboosted, and too broad to boost as a whole),
    so it takes the full boost 7 directly rather than by inheritance to reach
    the same authored-7 curriculum tier."
phase: review
execution:
  branch: tactic-context-chunk-selection
  pr: 2808
  attempts:
    implement: 1
  markers:
    - qa-done
  strategy_fingerprint: 1bcaff9037314f477f00aab1cf86a4cd27a4dfab2d7bed79106123a60a5a6efb
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Context-chunk selection worker lane — recursively draft broader-context reading chunks (passages + questions only, Opus-only) for resolved readings

## Context

The worker-lane instrument for the context-chunk admission rule recorded on
`strategy-complete-grounding` (clarifications 8–9, 2026-07-08
context-broadening interview): after a reading resolves, workers draft
whatever broader context most deepens that reading — the full work the
excerpts came from, the author's other writings, contemporaries, the
surrounding culture — as a capture guard auditing delegatee excerpt
selection (the 2026-07-07 chunk-1 session verified Republic VII partly from
592a-b, outside the chunk's own range — the risk observed live). Off the
minimum signal path by design (no `validates` edge): calculated attention
demotes it; the author's direct boost 7 (2026-07-09) carries its priority.

## Units of work

### Unit 1 — author `.claude/skills/context-chunks/SKILL.md`

**Scope.** One new file: `.claude/skills/context-chunks/SKILL.md` — an
autonomous worker skill (tick-emulation or on-demand; never
`AskUserQuestion`). Follow `ref-write-instructions`; the auto-mode
`.claude/skills/**` commit-denial caveat applies (surface, don't retry).

The skill must specify:

- **Trigger**: `/context-chunks <resolved-chunk-or-tradition-record-id>` —
  the trigger is a resolved reading (a `tactic-reading-chunk-*` node at
  `phase: done`, or a tradition record freshly verified). With no argument,
  stop and report that an id is required — the skill never selects its own
  target.
- **Selection**: recursively choose the broader context most relevant for
  deepening understanding of that reading and reinforcing the original
  education — by relevance, never a fixed excerpt→work→author→culture tier
  ladder (strategy clarification 8). Drafting is unrestricted in time; only
  reading priority is gated.
- **Format — the Cave-educator constraint** (strategy clarification 9): each
  drafted chunk carries **passages + questions only**, never conclusions or
  summaries of what the context shows — telling is where delegatee selection
  bias re-enters. Questions embed the named dialectic forms: recall-first
  delta, elenchus, rival-tradition steelman. Amend/ratify and intent review
  run in chunks directly touching prior outcomes, or defer to an area
  capstone chunk when one exists.
- **Chunk shape**: same discipline as the existing curriculum — ≤30
  author-minutes per sitting; `Text` / `Questions` / `Completion` sections;
  owner `human`; born-parked (`office_hours` reason + since +
  recommendation, `phase` absent);
  `parent: tactic-tradition-reading-program`;
  `serves: [strategy-complete-grounding]`; no `validates` (context chunks
  are off the candidate signal path); sync-reader-compatible
  `attributes.curriculum` extended with `distance` (hops removed from a
  critical-path node — focused verify/candidate chunks are 0, context
  chunks ≥ 1) and `deepens` (the tradition-record id(s) this context
  deepens; a chunk may cite several).
- **Ordering**: reading priority ascends by `distance`, ties broken by
  doctrine load; attention and blockers may override
  (`strategy-recovery-critical-path`'s distance ordering);
  `attributes.curriculum.priority` is appended after the current queue max
  for `/sync-reader` file naming.
- **Model condition**: sessions running this skill run on **Opus** (a
  condition on `strategy-complete-grounding` — chunk selection is the
  surface where delegatee bias enters the curriculum); state this in the
  skill preamble.
- **Landing**: `write-node.ts` per chunk, ONE `graph-commit` bundle.
  Prohibitions: no `gh`; no edits outside `intentions/`; drafts only —
  never phase-set tactics, never tradition records, never grounding marks.

**Recommended model**: opus

## Reuse

- `intentions/tactic-reading-chunk-10-hirschman-exit-voice.md` and siblings —
  chunk body/frontmatter template.
- `packages/intentionsutil/scripts/write-node.ts`,
  `packages/intentionsutil/scripts/graph-commit` — the write path.
- `.claude/skills/align-tactics/SKILL.md` — the autonomy-contract register
  (park-time recommendation discipline) the born-parked chunk writes inherit.

## Verification

No automated test surface. Manual dry-run: run the skill against
`tactic-reading-chunk-1-plato-cave` (resolved 2026-07-07) without landing:
confirm the drafted chunk(s) carry passages + questions only (no
conclusions or summaries), `attributes.curriculum` has `distance ≥ 1` and
`deepens` naming `tradition-plato`, priority lands after the current queue
max, and the JSON passes
`npx tsx packages/intentionsutil/scripts/validate-graph.ts`; confirm the
skill text pins Opus and contains no `gh`.
