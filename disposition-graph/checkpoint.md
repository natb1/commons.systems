---
question: When is the dialogue's state written to the record?
stage: ruling
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: 622143928b6827a2708f340e7d789fc8961ed13b
  against: "The rule lands a graph commit at every stage transition of every node, which for a sixty-eight-node frontier moving through four stages is roughly two hundred and seventy landings on a ref whose history persistence calls the trail of the record. Transience's test is that only what re-derivation cannot reconstruct is stored, and three of the four things this rule checkpoints — the recommended text, the recommendation's facts, the review's state — are re-derivable by re-running the movement that produced them. The author's instruction was to survive compaction, which the author's words alone achieve; checkpointing the rest turns the record's history into a movement log, and the pending `words-only-checkpoint` alternative is the narrower rule that meets the instruction."
  survey:
    date: 2026-09-05
    of: d0e21187d5cc2273d8ed7b523311377016844aac
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-03"
        supports:
          - words/2026-09-03/30
      - name: words-only-checkpoint
        source: review
        ref: "2026-09-03"
      - name: unlanded-write-as-criterion
        source: review
        ref: "2026-09-03"
      - name: drop-unpinned-evidence
        source: review
        ref: "2026-09-03"
      - name: checkpoint-to-a-file-outside-the-record
        source: ai
        ref: "cbabf108"
        status: passed
        reason: "a file outside the record is invisible to a successor session and to the projector"
      - name: checkpoint-only-at-the-ruling
        source: ai
        ref: "cbabf108"
        status: passed
        reason: "it loses the earlier stages"
      - name: checkpoint-on-every-edit
        source: ai
        ref: "cbabf108"
        status: passed
        reason: "it lands half-states and turns the record's history into a keystroke log"
    recommends: standing
    boldness: low
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
form: rule
under:
  - commons.systems/disposition-graph/dialogue
---

## Facts

### answer

#### standing

At every transition of a node's stage, before the next movement begins.

**AI support.** The author, 2026-09-03: "alignment skill must have an instruction to checkpoint/persist every unanswered question at each dialogue phase transition (periagoge -> mieutic -> adversarial review -> confirmation) to survive compaction". A stage transition is the checkpoint because the stage is the record of what the dialogue has done, as the alignment-target node says, and what each stage carries is fixed by the dialogue node: a finer grain would checkpoint half-states, and a coarser grain would lose a movement. The words-first rule follows from what can be re-derived: a draft can be redrafted from the words and a review re-run, but words held only in a context are lost with it, and the periagogic account is the most expensive thing to elicit again. Evidence: the bootstrap session of 2026-09-03 kept a resume note in scratch space in place of this rule and survived a compaction that afternoon by it; the rule moves the checkpoint into the record, where a successor session and the projector can read it and a scratch file is invisible to both.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is the dialogue's state written to the record?
form: rule
under:
  - commons.systems/disposition-graph/dialogue
---

## Answer

At every transition of a node's stage, before the next movement begins. The session that moves a node from the periagogic stage to the maieutic, from the maieutic to review, from review to ruling, or back by a kickback, writes the node with its new stage and everything the stage carries, the author's words, the draft, the recommendation, and the review's state, validates the graph, lands it on the record's ref, and only then continues. The author's words are written the turn they are said, before anything is drafted from them, since they are the one part of the state no session can re-derive. The record, not the session's context, is the dialogue's memory: a session whose context is compacted or lost resumes any node from its stage, as the alignment-target node says, and nothing the author said is held only in a context. When the graph cannot validate at a transition, the node is still written to the worktree and the failure is reported to the author in the same turn, never held back in context until it can land.
```

#### words-only-checkpoint

The reviewer's counter-argument: the rule lands a graph commit at every stage transition of every node, roughly two hundred and fifty landings for a sixty-two-node frontier moving through four stages, and three of the four things it checkpoints, the recommended text, the recommendation's facts and the review's state, are re-derivable by re-running the movement that produced them. The author's instruction was to survive compaction, which the author's words alone achieve. The alternative checkpoints the author's words the turn they are said and nothing else, letting the rest be written when the node lands.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is the dialogue's state written to the record?
form: rule
under:
  - commons.systems/disposition-graph/dialogue
---

## Answer

The reviewer's counter-argument: the rule lands a graph commit at every stage transition of every node, roughly two hundred and fifty landings for a sixty-two-node frontier moving through four stages, and three of the four things it checkpoints, the recommended text, the recommendation's facts and the review's state, are re-derivable by re-running the movement that produced them. The author's instruction was to survive compaction, which the author's words alone achieve. The alternative checkpoints the author's words the turn they are said and nothing else, letting the rest be written when the node lands.
```

#### unlanded-write-as-criterion

The clause covering a graph that cannot validate at a transition is the one operational failure mode with no instrument: nothing detects a node written to a worktree and never landed. The session took the first branch of the reviewer's suggestion and made the unlanded write reportable to the author in the same turn; the second branch, carrying it as a criterion on this node so the failure is measured rather than reported by convention, is still open.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is the dialogue's state written to the record?
form: rule
under:
  - commons.systems/disposition-graph/dialogue
---

## Answer

The clause covering a graph that cannot validate at a transition is the one operational failure mode with no instrument: nothing detects a node written to a worktree and never landed. The session took the first branch of the reviewer's suggestion and made the unlanded write reportable to the author in the same turn; the second branch, carrying it as a criterion on this node so the failure is measured rather than reported by convention, is still open.
```

#### drop-unpinned-evidence

The rationale cites as evidence a resume note kept in scratch space during the bootstrap session of 2026-09-03, which transience requires to be cited with a pin of what was read; the note is gone and the claim cannot be checked. The alternative strikes the evidence sentence, or replaces it with a citation of the transcript, which the session left to the sitting.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is the dialogue's state written to the record?
form: rule
under:
  - commons.systems/disposition-graph/dialogue
---

## Answer

The rationale cites as evidence a resume note kept in scratch space during the bootstrap session of 2026-09-03, which transience requires to be cited with a pin of what was read; the note is gone and the claim cannot be checked. The alternative strikes the evidence sentence, or replaces it with a citation of the transcript, which the session left to the sitting.
```

#### checkpoint-to-a-file-outside-the-record

The dialogue's state is written to scratch space rather than to the record,
which is what the bootstrap session of 2026-09-03 did. It was passed over
because a scratch file is invisible to a successor session and to the
projector.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is the dialogue's state written to the record?
form: rule
under:
  - commons.systems/disposition-graph/dialogue
---

## Answer

The dialogue's state is written to scratch space rather than to the record,
which is what the bootstrap session of 2026-09-03 did. It was passed over
because a scratch file is invisible to a successor session and to the
projector.
```

#### checkpoint-only-at-the-ruling

The dialogue's state is written once, at the author's ruling. It was passed
over because it loses the earlier stages.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is the dialogue's state written to the record?
form: rule
under:
  - commons.systems/disposition-graph/dialogue
---

## Answer

The dialogue's state is written once, at the author's ruling. It was passed
over because it loses the earlier stages.
```

#### checkpoint-on-every-edit

The dialogue's state is written at every edit. It was passed over because it
lands half-states and turns the record's history into a keystroke log.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is the dialogue's state written to the record?
form: rule
under:
  - commons.systems/disposition-graph/dialogue
---

## Answer

The dialogue's state is written at every edit. It was passed over because it
lands half-states and turns the record's history into a keystroke log.
```

## Account

### Manifest

- Folded: Recording of 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Re-encoding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Verified applied since the first reading: the answer now says an unlanded write 'is reported to the author in the same turn, never held back in context until it can land'. The `unlanded-write-as-criterion` alternative keeps the second branch open — carrying it as a criterion so the failure is measured rather than reported by convention — and nothing detects a node written to a worktree and never landed.
- Rationale: 'Evidence: the bootstrap session of 2026-09-03 kept a resume note in scratch space in place of this rule and survived a compaction that afternoon by it.' Transience requires evidence to be 'cited by the node it bears on with a pin of what was read'; this is prose with no pin and the scratch file is gone, so the claim cannot be checked by anyone. The `drop-unpinned-evidence` alternative is the vehicle and the session left it to the sitting.
- Answer: 'The author's words are written the turn they are said, before anything is drafted from them.' Verified exercised: work-loop's account says 'The author's words above are recorded the turn they were said, as the checkpoint node requires', and work-loop's '## Disposition' carries five dated quotations. The rule is live and the facts should say so.
- Answer: 'writes the node with its new stage and everything the stage carries ... validates the graph, lands it on the record's ref, and only then continues.' Nothing enforces the landing; the git log of the disposition ref shows checkpoint commits, which is evidence the rule is followed and not that it is held.

On the three facts: The frontmatter recommendation (adopts standing, ratified, low) states one class and one value and the pin is current. Low is right for a rule that transcribes the author's stated position, which the node quotes with its date; the same-turn rule and the conduct when validation fails are the AI's and are nearer moderate, and the account says so in prose without adjusting the value. Persistence standing follows from the node's shape.

Strongest counter-argument (moderate): The rule lands a graph commit at every stage transition of every node, which for a sixty-eight-node frontier moving through four stages is roughly two hundred and seventy landings on a ref whose history persistence calls the trail of the record. Transience's test is that only what re-derivation cannot reconstruct is stored, and three of the four things this rule checkpoints — the recommended text, the recommendation's facts, the review's state — are re-derivable by re-running the movement that produced them. The author's instruction was to survive compaction, which the author's words alone achieve; checkpointing the rest turns the record's history into a movement log, and the pending `words-only-checkpoint` alternative is the narrower rule that meets the instruction.

The session's reply: Forward accepted. The unpinned evidence and the unenforced landing stay as pending alternative and finding.

### Frontier survey, 2026-09-05

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:


Strongest counter-argument (moderate): The answer makes the record, not the session's context, the dialogue's memory, and the field that carries that memory is `stage`. This survey measured what the record's own instruments say about that field: thirty of the forty-four nodes at the ruling stage carry a review the projector marks changed since, and `evaluation`'s answer says a recommendation moved at the ruling stage sends the node back to review. So the checkpoint has been faithfully writing a field the record's rules say is currently wrong on two thirds of the ruling-stage graph, and a session resuming from it, as `alignment-target` instructs, resumes into a movement that has already been invalidated. The checkpoint is not the cause, but it is what makes the wrong value durable.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/checkpoint stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `standing`; the `## Rationale` its `**AI support.**`; 1 `## Disposition` entry became the ledger entry words/2026-09-03/30, referenced by 0 options the entry's own date names and by the recommended option for 1 the date named none; and `stands` left the answer fact. The record wrote no text of its own for `words-only-checkpoint`, `unlanded-write-as-criterion`, `drop-unpinned-evidence`, `checkpoint-to-a-file-outside-the-record`, `checkpoint-only-at-the-ruling`, `checkpoint-on-every-edit`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `622143928b6827a2708f340e7d789fc8961ed13b` was already past the recommendation and is left as it stood. The survey's pin `fd4bc63169ddce9046f308ee57cf90987096ee65` is re-computed for the encoding as `d0e21187d5cc2273d8ed7b523311377016844aac`; nothing it read changed.
