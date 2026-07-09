---
id: tactic-context-chunk-selection
kind: tactic
statement: Context-chunk selection worker lane — recursively draft
  broader-context reading chunks (passages + questions only, Opus-only) for
  resolved readings
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-08 /align-strategy context-broadening
  interview: the worker-lane instrument for the context-chunk admission rule
  recorded on strategy-complete-grounding, constrained by the Cave-educator
  clarification (turning, not telling) and the Opus condition."
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
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Context-chunk selection worker lane — recursively draft broader-context reading chunks (passages + questions only, Opus-only) for resolved readings

Draft context retained verbatim from the 2026-07-08 /align-strategy
context-broadening interview; `/align-tactics` consumes and refines this.

## Trigger and selection

- A resolved reading chunk (focused or context) is the trigger: workers may
  then draft chunks of whatever broader context is **most relevant for
  deepening understanding of that reading and reinforcing the original
  education** — the full work the excerpts came from, the author's other
  writings, contemporaries, the surrounding culture. Selection is recursive
  and relevance-driven, never a fixed excerpt → work → author → culture tier
  ladder.
- Selection/drafting is unrestricted in time — context chunks may be drafted
  at any point; only *reading priority* is gated (see ordering below).

## Format — the Cave-educator constraint

- A context chunk carries **passages + questions only**, never conclusions or
  summaries of what the context "shows". The worker's role is the educator's
  in Republic VII: turn the author toward the graph's recorded good, don't
  give sight by telling facts — telling is where delegatee selection bias
  re-enters.
- Same chunk discipline as the existing curriculum: ≤30 author-minutes per
  sitting, Text / Questions / Completion sections, sync-reader-compatible
  `attributes.curriculum` metadata.
- Each chunk's dialectic must confirm understanding; the named forms (from
  strategy-philosophical-grounding's calcification clarification):
  recall-first delta, elenchus, rival-tradition steelman. Amend/ratify and
  intent review run in chunks directly touching prior outcomes, or defer to
  the area capstone (tactic-context-capstone-review).

## Metadata and ordering

- Extend `attributes.curriculum` with `distance` (hops removed from a
  critical-path node; focused verify/candidate chunks are distance 0, context
  chunks ≥ 1) and `deepens` (the tradition-record id(s) this context
  deepens — a chunk may cite several; it then counts toward each record's
  capstone).
- Reading priority = ascending distance, ties broken by doctrine load;
  attention and blockers may override (strategy-recovery-critical-path,
  2026-07-08 clarification). Priority numbering for /sync-reader file naming
  follows from this.

## Model

- Context/reading/chunk-selection workers run on **Opus** (condition on
  strategy-complete-grounding): chunk selection is the surface where
  delegatee bias enters the curriculum.
