---
question: What does a clean-context review cost, and how is that cost bounded?
stage: review
facts:
  - name: answer
    options:
      - name: neighbourhood-questions-and-delta
        source: ai
        ref: "2026-09-05"
      - name: one-reading-per-draft
        source: ai
        ref: "2026-09-05"
      - name: full-index-per-draft
        source: ai
        ref: "2026-09-04"
        status: passed
        reason: "a draft's reader is given one draft as its object, and the standing answer of every node it does not touch is the batch's object, which became the survey's when the review divided by its object"
      - name: no-index-at-all
        source: ai
        ref: "2026-09-05"
        status: passed
        reason: "the merge validation asks whether the record already asks this question, and a reader cannot search for a question it cannot phrase"
      - name: full-re-read-on-every-move
        source: ai
        ref: "2026-09-04"
        status: passed
        reason: "the amendment's difference from the pinned text is known exactly, and reading the node whole pays the object's price a second time to find it"
      - name: unbounded-rounds
        source: ai
        ref: "2026-09-04"
        status: passed
        reason: "a reader asked for findings returns some, so the loop ends when a reader happens to be quiet and not when the draft is sound"
      - name: budget-per-sitting
        source: ai
        ref: "2026-09-05"
        status: passed
        reason: "it stops the reading by the clock, and what it stops is whatever stood last in the queue rather than what was least worth reading"
    recommends: neighbourhood-questions-and-delta
    boldness: moderate
    against: "Every clause of it narrows what the reviewer is shown, on measurements taken by the party the review exists to check. A reader that must search for what it is no longer given searches for what it thinks to look for, which is the drafter's own frame, and the failure the index guarded against, a contradiction with a node nobody thought to name, is the one failure a search cannot be aimed at. The answer's reply, that the survey holds the whole graph and is the reader of last resort, is good only while the survey runs before every ruling, and this design moves that load onto it."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
    against: "The author's words on the viable-options node delegate the right-sizing of models and effort to the AI's judgment where it buys token efficiency, and their words here ask the AI for the lessons and grant the reconciliation, which reads as the same delegation; a class that sends every later adjustment of the review's object back to the author spends the author's attention on the thing they asked to be spared."
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
defines:
  - neighbourhood
depends:
  - commons.systems/disposition-graph/clean-context-review#per-draft-and-survey
  - commons.systems/disposition-graph/frontier-consistency#split-survey-from-per-draft
---
## Disposition

The author, 2026-09-05, during the sitting's readings, after three readers died on their models' session limits:

> This review process is burning tokens very rapidly. Some of it is acceptable as cost of draining a backlog. Are there lessons from this sitting to inform improvements to the alignment review disposition - esp. for the optimization of token usage, context management and AI attention?
>
> If so, record and reconcile that disposition first before proceeding with review (you have bootstrap authority)

And, in the same turn, on the model the readings run on:

> Continue with opus instead of fable

## Facts

### answer

`neighbourhood-questions-and-delta` is recommended because the measurement of this sitting says the cost of a draft's reading is a constant that has nothing to do with the draft. Of the nineteen draft briefs generated on 2026-09-04 and 2026-09-05, the index of every node's standing answer ran from 1,803 to 3,447 lines, a mean of 2,775, between 22 and 69 percent of the brief, and it was the same text in all of them; measured against the node under review, which ran from 94 lines to 1,946, the index was a median of eight times the object and at most thirty-one times it. The reading of `progressive-disclosure`, 108 lines of node with two options and one tradition, was given 3,284 lines of that index in a brief of 5,740 and cost 206,279 tokens, the most expensive reading of the batch on nearly the smallest object in it, while `rejected`, at 406 lines nearly four times the node, cost 89,264. What the answer does is put the object of each reading back in proportion to the reading: the neighbourhood in full, because that is where every finding this sitting returned had its locus; the questions alone of the rest, because the merge validation needs the questions and not the answers; the difference and not the node on a re-reading, because the difference is what an amendment is; and two rounds, because a reader asked for findings returns some.

Moderate boldness. The criterion is the author's, stated twice, token and context efficiency and the management of the AI's attention, and the grant to reconcile is theirs; the design is the AI's, and it is measured on a sitting the AI ran, which is the case against on the fact.

#### neighbourhood-questions-and-delta

The rules the recommended text sets out: a draft's brief carries its neighbourhood in full, and the rules of the reading itself in the same way rather than as a list of files for the reader to open, and every other node as its id and its question on one line; a re-reading's object is the amendment and not the node; a draft gets two readings of one answer, a kickback being a new answer and not a third round, and what survives goes to the author as an option; and a brief is written to be held whole by the reader that gets it.

#### one-reading-per-draft

The re-reading goes entirely: a draft is read once, the session amends in answer to the findings, and what the amendment got wrong is caught by the survey, which reads the whole graph before the author rules and is the record's reader of last resort by the frontier-consistency node's own answer. It is the cheapest answer on the table and it is not dominated: it costs one reading per draft against the recommended two, and the survey it leans on is owed before every ruling anyway. It is not recommended because the survey's object is the frontier's consistency and not this draft's claims, so an amendment that answers a finding wrongly, or that introduces a false statement about the record in the course of answering it, is exactly what the survey is not reading for; every one of the amendments this sitting wrote was written by the party whose draft the findings were against.

#### full-index-per-draft

Every draft's brief carries the standing answer, the facts and the rationale of every node in the record, as the briefs of 2026-09-04 and 2026-09-05 did. What it would answer: the reader sees the whole record and can find a contradiction with any part of it without being told where to look. Passed over because a draft's reader is given one draft as its object, and the whole record is the object of the other reading; the index in the per-draft brief is what the batch's reading left behind when the review divided by its object on 2026-09-04, and the findings this sitting returned show what the reader used, the node, its ancestry, its depends, the options it names, its siblings, the readings that bear on it, and the implementation.

#### no-index-at-all

The brief carries the neighbourhood and nothing of the rest of the record, the reader searching the graph for whatever else it needs. Passed over because the fifteenth validation asks the reader whether the record already asks this question somewhere else, and a reader that has never seen the other questions cannot search for them: the list of questions is what makes that validation checkable, and it is one line a node.

#### full-re-read-on-every-move

A recommendation that moves after its reading is read again from the beginning, the whole node and the whole brief, as this sitting did. Passed over because the record already knows what moved: the reading carries the pin of the text it read, and the difference between that text and the amended one is the amendment. Reading the node whole to find it pays the object's price a second time.

#### unbounded-rounds

The reading and the amendment repeat until a reading returns no findings. Passed over because a reader asked for findings returns some, and a reading that always finds something makes the loop end when a reader happens to be quiet rather than when the draft is sound; all thirteen of the readings this sitting landed on 2026-09-05 had findings accepted and moved their node's pin, so the loop as run has never once terminated of its own accord.

#### budget-per-sitting

A token budget for the sitting's reviews, the reading stopping when it is spent. Passed over because it stops the reading by the clock: what goes unread is whatever stood last in the queue, which has nothing to do with what was least worth reading, and the bound this answer wants is on the object of each reading and not on their number.

### authority

Ratified. What this decides is how much of the record the adversarial reader is shown, and the party it is shown against is the party that would otherwise set it: a rule that lets the drafter narrow the review's object is capture-shaped in the way the authority node's escalation test names, and being wrong here is not visible in the record, since a review that reads too little returns fewer findings and looks cheaper and no worse. Moderate boldness: the escalation is the record's own rule, and what rests on the AI is the judgment that the author's delegation of right-sizing does not reach the reviewer's object, which the case against disputes.

## Recommendation

```markdown
---
question: What does a clean-context review cost, and how is that cost bounded?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
defines:
  - neighbourhood
---
## Answer

By the object each reading is given, and never by a budget or a clock. A reading's cost is set almost entirely by what its brief puts in front of it, so the bound is written into the brief and not into the reader.

**What a draft's reading is given.** Its object is one draft, so its brief carries that node in full and its neighbourhood in full: the ancestry to the root, the rules that bind every session, the nodes its `depends` names and the options named in them, the nodes under it, its siblings, and the readings that bear on it. It carries the rules of the reading itself in the same way, in the brief and not as a list of files to open: what the review is and what it judges, the validations, the two readings and what each is given, and the encoding's own vocabulary, facts, options, rulings, the derived class, and what a node is. A brief that tells its reader to go and read a node it could have carried has the reader read that node twice, once where the brief already quotes it and once from disk, and pays for both. Of every other node in the record it carries the id and the question, on one line, and nothing else. The round's other drafts, which the clean-context-review node's recommendation gives this reader so that texts written together are read together, are carried the same way and marked as the round: id, question, and the recommendation each now makes, one line each, since what the reader needs of a sibling draft is that it moved and what it moved to, and the text that moved is one file away. The questions are there because the merge validation asks whether the record already asks this question, and a reader cannot search for a question it cannot phrase; the answers behind those questions are the survey's object, because the whole graph is what the survey reads and not what a draft's reader reads. What lies outside the neighbourhood the reader reaches by searching the graph, which the brief tells it how to do, so the cost of reaching the rest of the record is the cost of what is found and not of what exists. The rule under all of it: a part of the brief that grows with the record rather than with the draft is carried as a list of pointers, and a part that is the draft's own is carried whole.

**What a re-reading is given.** A draft amended in answer to a reading's findings is read again, and the second reading's object is the amendment: the node as it now stands, its difference from the text the last reading pinned, that reading's findings, and the session's reply to each. It answers two questions, whether the amendment answers the finding and whether it introduces anything the reading has not seen, and it is not a fresh reading of the node. A fresh reading is owed only where the answer itself was redrawn, which is what a kickback is.

**How many readings a draft gets.** Two: the reading, and the re-reading of its amendment. A finding that survives the second is recorded as an option on the fact it bears on, or as a probe where it asks the author what they meant, and it goes to the author with the node. A reader asked for findings will return some, so a loop that runs until a reading is silent ends on the reader's mood; two rounds ends it on the draft. The cap bounds amendment and not redrawing: either reading may still kick the draft back, and a kickback is a new answer, which owes a reading of its own. What the cap forbids is a third reading of the same answer.

**What a brief must fit.** A brief is written to be held whole by the reader it is given to, and it states its own size and the discipline for reading it. A brief the reader cannot hold is a defect of the brief, cured by narrowing the object and never by asking the reader to skim: a reading that dies of its own context returns nothing and is paid for twice.

**What the main thread spends.** The main thread validates every finding at the locus the finding names, and does not re-derive the neighbourhood the reader was given; validation is never delegated, since a finding accepted unchecked hands the review's authority to whichever reader spoke last.

**What is not bounded, and is not waste.** The number of drafts on the frontier and the number of sittings. The review is priced per draft by design, and a backlog costs one reading a draft in it; that is the cost of having the drafts, not the cost of reading them.

## Rationale

Recorded on the author's words of 2026-09-05, carried above: the review is burning tokens rapidly, part of that is the acceptable cost of draining a backlog, and the lessons of the sitting are to be taken as improvements for token usage, context management, and the management of the AI's attention.

The measurement decides it. Of the nineteen draft briefs this sitting generated, the index of every node's standing answer ran from 1,803 to 3,447 lines, a mean of 2,775, between 22 and 69 percent of the brief, and it was the same text in every one. Set against the object each brief was written for, the node under review, which ran from 94 lines to 1,946 and averaged 554, the index was a median of eight times the object and in one brief thirty-one times it. The reading of `progressive-disclosure`, 108 lines of node with two options and one tradition, was handed 3,284 lines of index in a brief of 5,740 lines and cost 206,279 tokens: the most expensive reading of the batch, on nearly the smallest object in it. `decomposition`, at 175 lines, cost 162,526; `rejected`, at 406, cost 89,264. Cost does not track the object, because a constant many times its size dominates it.

Why that constant is there is an incumbent fact and not a reason. Until 2026-09-04 the review was one reading of the whole frontier, and the index was that reading's object; when the clean-context-review node divided the review by its object, the index stayed in the per-draft brief where it no longer had one. Read as if the brief were being written from scratch, the question is what the reader of one draft must see, and the answer is the draft, what the draft stands on and what stands on it, and the questions the record already asks.

The findings this sitting returned are the evidence for the neighbourhood: every one had its locus in the node, its ancestry, its `depends`, the options it names, its siblings, the readings that bear on it, or the implementation. The one reach beyond that which mattered, the finding that three standing answers place a rejected alternative in the rationale, was made by searching the graph for the phrase and not by reading the index; so was the finding that a tradition the record called already read had no reading. Search is what reaches the rest of the record, and search costs what it finds.

The re-reading follows from the same sitting. Thirteen readings landed on 2026-09-05, and all thirteen had findings accepted: every one of the thirteen nodes now reads as changed since its review, owing a second reading of a text that differs from the first in the places the findings named. The cap follows from the same fact from the other side: the loop as run has never terminated of its own accord.

The round's other drafts are the case that shows the rule is not about the index. The clean-context-review node's recommendation gives a draft's reader every node whose recommendation has moved since the survey last pinned it, so that the contradictions a sitting creates between texts written together are caught before the survey; it is right about the need, and it is unmaterialized, and on 2026-09-05 that set stood at thirteen nodes. Handed whole, it would put back most of what striking the index takes out, and it would grow with the sitting rather than with the draft. Handed as thirteen lines saying which nodes moved and what each now recommends, it does the work it was asked for, because what a reader needs of a sibling draft is that it moved and what it moved to; the text is one file away, and a reader that has been told a neighbour moved will open it. That is recorded as an option on the clean-context-review node, since the neighbourhood is its answer's to state.

The double read is the fourth measurement, and the cheapest to remove: the brief as it stood told its reader to read twelve node files in full before writing a finding, four of which the brief already carried in its ancestry section, so the reader paid for those four twice and reached outside its neighbourhood by instruction for the other eight. Those twelve are the rules of the reading, they are the same twelve for every draft, and a brief that carries them carries them once.

The reader's own context is the third measurement. One reader died with its whole spend returned as nothing, its context refilling to the limit three times in three turns while it read a 6,944-line brief in large pieces; relaunched with a bound on each read, it finished, and that reading was paid for twice. A brief that a reader cannot hold is not a reader's problem.

Traditions, each owed as a reading under this node: the working set and thrashing (Denning, 1968), where a process given fewer frames than its working set spends its time faulting rather than working and the remedy is to allocate by the measured working set rather than uniformly, which is what the dead reader did and what the bound on the brief answers; separate compilation against interfaces, the unit compiled with its dependencies' interfaces and not their bodies, which is the neighbourhood; the diff as the unit of review, the ordinary practice of code review, which the re-reading adopts; the inspection rate and the yield of a large change (Fagan, 1976; Bacchelli and Bird, 2013), where a reviewer's finding rate falls as the change grows, so the remedy bounds the change and never hurries the reviewer; and satisficing (Simon, 1956), the search that stops at good enough, for the cap on rounds.

What this costs, as a consequence of the design and not a reason for it. A draft's reader no longer holds the record's standing answers, so a contradiction with a distant node is found only if the reader thinks to search for it; what it misses falls to the survey, which holds the whole graph and is the reader of last resort, and this answer therefore leans harder on the survey being run before the author rules. The two-round cap means a finding first raised in the second reading is recorded as an option rather than answered in the text, so the author meets it as a row on a fact rather than as a redrawn draft. And the questions-only index means the reader can see that a question exists without seeing how it was answered, which is enough to propose a merge and not enough to argue one.
```

## Account

Queued as a node of its own on 2026-09-05, at the checkpoint, before anything was drafted from the author's words. The disposition is the author's and the grant is theirs; what the node answers is not yet drafted.

What the sitting would amend: the clean-context-review node, whose answer says what a reading reads and when it runs and says nothing about what that costs or what bounds it; the review-model node, where the author's second sentence bears and where an option is recorded for it at this landing; the frontier-consistency node, which owns the survey's object; the decomposition node, whose cost paragraph states the per-draft brief's index as the cost driver and names the index as the lever against it; and the review-skills node, whose two skills and one package materialize whatever this answers.

The periagogic object: the briefs this sitting generated and their sizes, the readings' own token counts as the harness reported them, the three readers that died, and the findings the readings actually returned, read against what each reading had to read to return them.

### Drafted, 2026-09-05

The periagogic object was read on the main thread, which measured it rather than surveying it: the nineteen draft briefs of 2026-09-04 and 2026-09-05 as they still stand under `tmp/review/`, the index share of each, the harness's token count for each reading, the four readers that died, and the findings each reading returned, each finding traced to the locus it was found at. The measurements are in the recommendation's rationale, which is where they belong, since they are the argument and not the account.

The four deaths: one reader on `author-questions` died of its own context, autocompacting three times in three turns on a 6,944-line brief, and finished on a relaunch bounded to 300-line reads, so that reading was paid for twice; three readers, on `alignment-page`, `recording`, and `clean-context-review`, died within a minute of each other on the model's session limit, returning nothing. The author's second sentence of 2026-09-05 answers the second kind, and is recorded as an option on the `review-model` node rather than here, since the model a reading runs on is that node's question.

Owed as readings under this node, none yet read: Denning on the working set and thrashing; separate compilation against interfaces; the diff as the unit of review; Fagan's inspection rate with Bacchelli and Bird on the yield of a large change; and Simon on satisficing. They are named in the rationale and derive onto the frontier from there.

Owed to the author as a caution, not as a finding: this node is the reviewed party writing the reviewer's brief, and it narrows what the reviewer sees on measurements the reviewed party took. That is the case recorded against the answer fact, and it is why the authority fact recommends ratified.

### Read adversarially on the main thread, 2026-09-05

The measurements in the rationale were recomputed against every one of the nineteen briefs before the draft went to its reading, and the first draft's figures were wrong in the direction that flattered the argument: it counted sixteen briefs, gave the index a range of 1,834 to 3,478 and a mean of 2,877, and compared two nodes by ratios it had not measured. The corrected figures are narrower and the case is stronger for being set against the object rather than the brief, since the index is a median of eight times the node it was written for.

Two findings of that reading changed the answer. The brief as it stood told its reader to read twelve node files in full before writing a finding, four of them already carried in the brief's own ancestry section: the answer now carries the rules of the reading in the brief rather than naming them as files to open. And the cap on rounds, read back, forbade a second kickback by implication, which is not what it means: the cap bounds amendment, a kickback is a new answer, and the answer now says so.

