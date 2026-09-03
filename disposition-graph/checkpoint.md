---
question: When is the dialogue's state written to the record?
stage: review
recommendation:
  class: ratified
  boldness: low
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-03
under:
  - commons.systems/disposition-graph/dialogue
---
## Disposition

The author, 2026-09-03:
> new disposition (alignment shim): alignment skill must have an instruction to checkpoint/persist every unanswered question at each dialogue phase transition (periagoge -> mieutic -> adversarial review -> confirmation) to survive compaction

## Answer

At every transition of a node's stage, before the next movement begins. The session that moves a node from the periagogic stage to the maieutic, from the maieutic to review, from review to ruling, or back by a kickback, writes the node with its new stage and everything the stage carries, the author's words, the draft, the recommendation, and the review's state, validates the graph, lands it on the record's ref, and only then continues. The author's words are written the turn they are said, before anything is drafted from them, since they are the one part of the state no session can re-derive. The record, not the session's context, is the dialogue's memory: a session whose context is compacted or lost resumes any node from its stage, as the alignment-target node says, and nothing the author said is held only in a context. When the graph cannot validate at a transition, the node is still written to the worktree and the failure is reported, never held back in context until it can land.

## Rationale

The author, 2026-09-03: "alignment skill must have an instruction to checkpoint/persist every unanswered question at each dialogue phase transition (periagoge -> mieutic -> adversarial review -> confirmation) to survive compaction". A stage transition is the checkpoint because the stage is the record of what the dialogue has done, as the alignment-target node says, and what each stage carries is fixed by the dialogue node: a finer grain would checkpoint half-states, and a coarser grain would lose a movement. The words-first rule follows from what can be re-derived: a draft can be redrafted from the words and a review re-run, but words held only in a context are lost with it, and the periagogic account is the most expensive thing to elicit again. Evidence: the bootstrap session of 2026-09-03 kept a resume note in scratch space in place of this rule and survived a compaction that afternoon by it; the rule moves the checkpoint into the record, where a successor session and the projector can read it and a scratch file is invisible to both. Rejected: checkpointing to a file outside the record, for that reason; checkpointing only at the ruling, which loses the earlier stages; a checkpoint on every edit, which lands half-states and turns the record's history into a keystroke log.

## Proposal

### Recording of 2026-09-03

The author's words quoted above are recorded as this node's answer, stamped deferred. The author's: the instruction, and the four transitions it names. The AI's, open to the author's ruling: the author's words written in the same turn, ahead of any draft; the landing on the record's ref as the checkpoint, never a scratch file; the conduct when the graph cannot validate. Materialized the same day as an instruction in the alignment skill, the shim declared on the growth node. Facts: authority ratified if the author confirms; boldness low, the answer transcribes the author's stated position and adds the same-turn rule; persistence standing.
