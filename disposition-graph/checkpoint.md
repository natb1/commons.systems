---
question: When is the dialogue's state written to the record?
stage: review
recommendation:
  adopts: standing
  class: ratified
  boldness: low
  amends: "5f7995b74efc284666ec9eb8ea218e1b6eb3977b"
  at: "6d21d356d65f5fa206cb60bc3e923c462acc920e"
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: e012b0dbf43c5aa369d0c26c0430c1e5e691f1f7
alternatives:
  - name: words-only-checkpoint
    source: review
    ref: "2026-09-03"
  - name: unlanded-write-as-criterion
    source: review
    ref: "2026-09-03"
  - name: drop-unpinned-evidence
    source: review
    ref: "2026-09-03"
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

At every transition of a node's stage, before the next movement begins. The session that moves a node from the periagogic stage to the maieutic, from the maieutic to review, from review to ruling, or back by a kickback, writes the node with its new stage and everything the stage carries, the author's words, the draft, the recommendation, and the review's state, validates the graph, lands it on the record's ref, and only then continues. The author's words are written the turn they are said, before anything is drafted from them, since they are the one part of the state no session can re-derive. The record, not the session's context, is the dialogue's memory: a session whose context is compacted or lost resumes any node from its stage, as the alignment-target node says, and nothing the author said is held only in a context. When the graph cannot validate at a transition, the node is still written to the worktree and the failure is reported to the author in the same turn, never held back in context until it can land.

## Rationale

The author, 2026-09-03: "alignment skill must have an instruction to checkpoint/persist every unanswered question at each dialogue phase transition (periagoge -> mieutic -> adversarial review -> confirmation) to survive compaction". A stage transition is the checkpoint because the stage is the record of what the dialogue has done, as the alignment-target node says, and what each stage carries is fixed by the dialogue node: a finer grain would checkpoint half-states, and a coarser grain would lose a movement. The words-first rule follows from what can be re-derived: a draft can be redrafted from the words and a review re-run, but words held only in a context are lost with it, and the periagogic account is the most expensive thing to elicit again. Evidence: the bootstrap session of 2026-09-03 kept a resume note in scratch space in place of this rule and survived a compaction that afternoon by it; the rule moves the checkpoint into the record, where a successor session and the projector can read it and a scratch file is invisible to both. Rejected: checkpointing to a file outside the record, for that reason; checkpointing only at the ruling, which loses the earlier stages; a checkpoint on every edit, which lands half-states and turns the record's history into a keystroke log.

## Alternatives

### words-only-checkpoint

The reviewer's counter-argument: the rule lands a graph commit at every stage transition of every node, roughly two hundred and fifty landings for a sixty-two-node frontier moving through four stages, and three of the four things it checkpoints, the recommended text, the recommendation's facts and the review's state, are re-derivable by re-running the movement that produced them. The author's instruction was to survive compaction, which the author's words alone achieve. The alternative checkpoints the author's words the turn they are said and nothing else, letting the rest be written when the node lands.

### unlanded-write-as-criterion

The clause covering a graph that cannot validate at a transition is the one operational failure mode with no instrument: nothing detects a node written to a worktree and never landed. The session took the first branch of the reviewer's suggestion and made the unlanded write reportable to the author in the same turn; the second branch, carrying it as a criterion on this node so the failure is measured rather than reported by convention, is still open.

### drop-unpinned-evidence

The rationale cites as evidence a resume note kept in scratch space during the bootstrap session of 2026-09-03, which transience requires to be cited with a pin of what was read; the note is gone and the claim cannot be checked. The alternative strikes the evidence sentence, or replaces it with a citation of the transcript, which the session left to the sitting.

## Account

### Recording of 2026-09-03

The author's words quoted above are recorded as this node's answer, stamped deferred. The author's: the instruction, and the four transitions it names. The AI's, open to the author's ruling: the author's words written in the same turn, ahead of any draft; the landing on the record's ref as the checkpoint, never a scratch file; the conduct when the graph cannot validate. Materialized the same day as an instruction in the alignment skill, the shim declared on the growth node. Facts: authority ratified if the author confirms; boldness low, the answer transcribes the author's stated position and adds the same-turn rule; persistence standing.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The node carries 'stage: review' and a recommendation and no 'review:' field, which is correct — it has not been read before. This is its first review.
- Answer: 'When the graph cannot validate at a transition, the node is still written to the worktree and the failure is reported, never held back in context until it can land.' This is the one clause with an operational failure mode and no instrument: nothing detects a node written to a worktree and never landed. Suggested edit: say the unlanded write is reported to the author in the same turn, or carry it as a criterion.
- Answer: 'The author's words are written the turn they are said, before anything is drafted from them.' Verified exercised on work-loop, whose Proposal says 'The author's words above are recorded the turn they were said, as the checkpoint node requires', and whose Disposition acquired a fourth quotation during this review. The rule is live, which the facts should say.
- Rationale: 'Evidence: the bootstrap session of 2026-09-03 kept a resume note in scratch space in place of this rule and survived a compaction that afternoon by it.' Transience requires evidence to be 'cited by the node it bears on with a pin of what was read'; this evidence is prose with no pin and the scratch file is gone, so the claim cannot be checked.

On the three facts: The frontmatter recommendation (ratified, low) states one class and one value, and low is right for a rule that transcribes the author's stated position. The same-turn rule and the conduct when validation fails are the AI's and are nearer moderate; the facts say so in prose ('the answer transcribes the author's stated position and adds the same-turn rule') without adjusting the value.

Strongest counter-argument (moderate): The rule lands a graph commit at every stage transition of every node, which for a sixty-two-node frontier moving through four stages is roughly two hundred and fifty landings on an orphan ref whose history persistence calls the trail of the record. Transience's test is that only what re-derivation cannot reconstruct is stored, and three of the four things this rule checkpoints — the draft, the recommendation, the review state — are re-derivable by re-running the movement that produced them. The author's instruction was to survive compaction, which the author's words alone achieve; checkpointing the rest turns the record's history into a movement log.

The session's reply: Validated. Amended tonight: an unlanded write is reported to the author in the same turn. The evidence sentence names a scratch note that is gone; the sitting cites the transcript or drops it. On the counter-argument, that the rule turns the history into a movement log: the record stores the results of movements, not what re-running them would reproduce, and a stage transition is few per node; the git log is the trail persistence names. Stage review.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `words-only-checkpoint` (review, 2026-09-03); `unlanded-write-as-criterion` (review, 2026-09-03); `drop-unpinned-evidence` (review, 2026-09-03).
The recommendation adopts `standing` and is pinned to the standing text as it was at that commit.
Merge analysis of the author's words: 2026-09-03, own-question: The alignment skill must checkpoint and persist every unanswered question at each dialogue phase transition, from periagoge to maieutic to adversarial review to confirmation, so that the state survives compaction.
The census unit's note: Checkpoint has a standing answer and no recommended text, so it adopts standing. Three alternatives are pending: the reviewer's rival that only the author's words be checkpointed, the unlanded-write criterion which is the branch the session did not take, and striking the unpinned evidence sentence, which the session left to the sitting. The author's single block answers this node's own question and needs no move. Nothing on the node proposes a change to another node, so the elsewhere list is empty; the review's verification that the words-first rule is live on work-loop is an observation, not a proposal.
