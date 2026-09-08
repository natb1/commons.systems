---
question: What does a clean-context review cost, and how is that cost bounded?
stage: maieutic
facts:
  - name: answer
    options:
      - name: neighbourhood-questions-and-delta
        source: ai
        ref: "2026-09-05"
      - name: one-reading-per-draft
        source: ai
        ref: "2026-09-05"
      - name: neighbours-carried-whole
        source: review
        ref: "2026-09-05"
      - name: answers-only-index
        source: review
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
      - name: neighbourhood-cited-not-restated
        source: review
        ref: "2026-09-05"
      - name: pin-names-the-text-the-reader-read
        source: review
        ref: "2026-09-05"
      - name: brief-carries-the-recount-command
        source: review
        ref: "2026-09-05"
      - name: rules-of-the-reading-named-as-files
        source: review
        ref: "2026-09-05"
        status: passed
        reason: "it saves the 65,882 bytes the twelve rule nodes cost in every brief and buys back the double read, the reader opening each of the twelve by instruction and five of them twice, which is the fourth measurement in the rationale and the one the brief was cut to remove"
      - name: a-cap-on-redraws-per-node-per-sitting
        source: ai
        ref: "2026-09-05"
      - name: one-answer-a-node-and-one-read
        source: ai
        ref: "2026-09-07"
      - name: a-waves-brief-is-one-brief
        source: commons.systems/disposition-graph/clean-context-review
        ref: "2026-09-07"
      - name: the-surveys-unreached-node-is-one-line
        source: commons.systems/disposition-graph/frontier-consistency
        ref: "2026-09-07"
        status: passed
        reason: "the survey's selection and reach are survey-selection's question (F5 of the survey of 2026-09-07); what this node prices is the bound alone"
      - name: the-surveys-selection-moves-to-its-own-node
        source: commons.systems/disposition-graph/survey-selection
        ref: "2026-09-07"
        supports:
          - words/2026-09-05/4
          - words/2026-09-07/2
          - words/2026-09-07/3
          - words/2026-09-07/4
          - words/2026-09-07/5
          - words/2026-09-07/6
          - words/2026-09-07/7
          - words/2026-09-07/8
          - words/2026-09-07/9
          - words/2026-09-07/11
          - words/2026-09-07/12
          - words/2026-09-07/13
          - words/2026-09-07/15
          - words/2026-09-07/16
      - name: the-brief-is-bounded-by-what-one-call-holds
        source: review
        ref: "2026-09-07"
      - name: no-brief-grows-with-the-record
        source: ai
        ref: "2026-09-07"
        supports:
          - words/2026-09-07/22
          - words/2026-09-07/23
      - name: reader-is-the-parser-and-reviewer-is-the-reading
        source: review
        ref: "2026-09-07"
    recommends: no-brief-grows-with-the-record
    boldness: moderate
    against: "Every clause of it narrows what the reviewer is shown, on measurements taken by the party the review exists to check. A reader that must search for what it is no longer given searches for what it thinks to look for, which is the drafter's own frame, and the failure the index guarded against, a contradiction with a node nobody thought to name, is the one failure a search cannot be aimed at. The answer's reply, that the survey holds the whole graph and is the reader of last resort, is good only while the survey runs before every ruling; this design moves that load onto it: at graph commit 1cde11f6 on 2026-09-05, before the first survey ran, forty-eight nodes stood at the review or the ruling stage and none carried a survey pin, and what the survey costs once the load is on it is the question the author raised on 2026-09-07 and `survey-selection` answers beneath this node."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
    against: "The author's words on the viable-options node delegate the right-sizing of models and effort to the AI's judgment where it buys token efficiency, and their words here ask the AI for the lessons and grant the reconciliation, which reads as the same delegation; a class that sends every later adjustment of the review's object back to the author spends the author's attention on the thing they asked to be spared."
review:
  verdict: forward
  strength: weak
  date: 2026-09-07
  of: bb2eb39aac16fa96e1453bd6d22298c26e0a3a20
  commit: 32a615df336afeec4917bc5d9f05a0ac73742582
  against: "The previous reading forwarded the node while flagging, at weak strength, that it could not itself verify `survey-selection` existed and was deferring that check to the survey; this re-reading closed that gap by checking the disk directly rather than relying further on the record's own narration. The residual concern is procedural rather than substantive: a second unratified recommendation move has now landed on top of the first before the author has ruled on either, and one of the three live options still carries only a sentence rather than full content, which is exactly why the node cannot yet reach the review stage. The record discloses this itself in the same account section rather than presenting the node as more finished than it is, which is the reason this is a residual doubt and not a defect."
  survey:
    date: 2026-09-07
    of: bb2eb39aac16fa96e1453bd6d22298c26e0a3a20
    commit: edc5af91d942319c12174309e388a244de61fa52
    text:
      question: "5a276f1bf8183de6f01b2848f4b759efc17925da9b1ea889ceb9a2b2c522bf8d"
      answer: "322b4c79c4923a837fa8ab0a7a8c236515e54deb363df0907ce25e9e4d7c9e94"
      options: "ab246cdd3791bca1ea903f22eb32eaba621298e705ec3210a2e9309ab25e2753"
      rivals: "4e0bf6dce0a2d2fd753cb1ff5b142279672940238af1e72502b53d8df2d37ebd"
      words: "9bc306ab74cf5e5b0f099e672dc98fe1bd9ab7fb79ff99d6a69d4d5dbe69f2a9"
    findings:
      - finding: "The one-line carriage of an unreached or unchanged node is stated on four nodes. survey-selection: 'a node the judged set reaches but whose read text has not changed since a survey read it, judged or reached, is carried on one line rather than by what it answers'. frontier-consistency: 'a node whose text stands as an earlier survey read it is carried on one line, and a node minted or amended since is carried by what it answers until a survey has read it again', while its Facts 'recommends the-judged-set-and-its-comparisons-move-to-survey-selection'. clean-context-review's recommended answer: 'of a node no judged node reaches, what the frontier-consistency node\\'s condition on its text gives, its question alone on one line'. review-cost: option `the-surveys-unreached-node-is-one-line`, of which frontier-consistency's account says 'a rule drafted twice in one day on two nodes is evidence that the seam is in the wrong place'."
        kind: "redundancy"
        status: "new"
        since: "2026-09-07"
        supports:
          - "question"
          - "answer"
          - "options"
          - "rivals"
          - "words"
        discharge: "the option this finding proposes is ruled, or a later survey re-derives it over moved support and does not find it"
        nodes:
          - "commons.systems/disposition-graph/review-cost"
          - "commons.systems/disposition-graph/survey-selection"
          - "commons.systems/disposition-graph/frontier-consistency"
          - "commons.systems/disposition-graph/clean-context-review"
      - finding: "author-questions' answer: 'The two senses of reader collide here and the record carries both, the parser of the graph and the clean-context reading\\'s subagent, which is a vocabulary finding this answer records rather than settles and leaves to the survey; where this node says reader without qualification it means the parser.' The parser sense: viable-options 'the reader parses an option\\'s `#### ` subsection and no content within it'; what-an-option-row-carries 'which the reader of the graph enforces'. The agent sense: review-cost 'A reading is the only reader in this record that can judge whether an answer is right, and it is the most expensive reader the record has'; what-an-option-row-carries 'Where no reader\\'s line bears on a fact the row carries, in the line\\'s place, one'. recording already has the third term: 'The reviewer recommends and never writes'."
        kind: "vocabulary"
        status: "new"
        since: "2026-09-07"
        supports:
          - "question"
          - "answer"
          - "options"
          - "rivals"
          - "words"
        discharge: "the option this finding proposes is ruled, or a later survey re-derives it over moved support and does not find it"
        nodes:
          - "commons.systems/disposition-graph/review-cost"
          - "commons.systems/disposition-graph/author-questions"
          - "commons.systems/disposition-graph/recording"
          - "commons.systems/disposition-graph/viable-options"
          - "commons.systems/disposition-graph/what-an-option-row-carries"
          - "commons.systems/disposition-graph/clean-context-review"
    pairs:
      - with: "commons.systems/disposition-graph/alignment-page"
        keys:
          - "words:words/2026-09-07/2"
          - "words:words/2026-09-07/3"
          - "words:words/2026-09-07/4"
      - with: "commons.systems/disposition-graph/authors-words-on-the-page"
        keys:
          - "words:words/2026-09-07/2"
          - "words:words/2026-09-07/3"
          - "words:words/2026-09-07/4"
      - with: "commons.systems/disposition-graph/change-reviewed-as-a-diff"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/clean-context-review"
        keys:
          - "words:words/2026-09-07/5"
          - "words:words/2026-09-07/6"
          - "words:words/2026-09-07/7"
          - "words:words/2026-09-07/8"
          - "words:words/2026-09-07/9"
          - "cites"
          - "depends"
      - with: "commons.systems/disposition-graph/decomposition"
        keys:
          - "words:words/2026-09-07/5"
          - "words:words/2026-09-07/6"
          - "words:words/2026-09-07/7"
          - "words:words/2026-09-07/8"
          - "cites"
      - with: "commons.systems/disposition-graph/dialogue"
        keys:
          - "words:words/2026-09-07/2"
          - "words:words/2026-09-07/3"
          - "words:words/2026-09-07/4"
          - "words:words/2026-09-07/11"
          - "words:words/2026-09-07/12"
          - "words:words/2026-09-07/13"
          - "words:words/2026-09-07/15"
          - "cites"
          - "depends"
      - with: "commons.systems/disposition-graph/fagan-inspection-roles"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/frontier-consistency"
        keys:
          - "words:words/2026-09-07/5"
          - "words:words/2026-09-07/6"
          - "words:words/2026-09-07/7"
          - "words:words/2026-09-07/8"
          - "words:words/2026-09-07/9"
          - "words:words/2026-09-07/16"
          - "parent:commons.systems/disposition-graph/clean-context-review"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/growth"
        keys:
          - "term:propose (defines: commons.systems/disposition-graph/growth)"
      - with: "commons.systems/disposition-graph/madr-decision-records"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/materialization"
        keys:
          - "term:package (defines: commons.systems/disposition-graph/materialization)"
      - with: "commons.systems/disposition-graph/persistence"
        keys:
          - "term:land (defines: commons.systems/disposition-graph/persistence)"
      - with: "commons.systems/disposition-graph/progressive-disclosure"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/quotes"
        keys:
          - "words:words/2026-09-07/4"
          - "words:words/2026-09-07/15"
      - with: "commons.systems/disposition-graph/readings"
        keys:
          - "words:words/2026-09-07/4"
      - with: "commons.systems/disposition-graph/recording"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/rejected"
        keys:
          - "term:rejected alternative (defines: commons.systems/disposition-graph/rejected)"
          - "cites"
      - with: "commons.systems/disposition-graph/review-approval-pinned-to-a-revision"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/review-model"
        keys:
          - "words:words/2026-09-07/5"
          - "words:words/2026-09-07/6"
          - "words:words/2026-09-07/7"
          - "words:words/2026-09-07/8"
          - "parent:commons.systems/disposition-graph/clean-context-review"
          - "cites"
      - with: "commons.systems/disposition-graph/review-skills"
        keys:
          - "parent:commons.systems/disposition-graph/clean-context-review"
          - "cites"
      - with: "commons.systems/disposition-graph/self-contained-specification"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/survey-selection"
        keys:
          - "term:candidate pair (defines: commons.systems/disposition-graph/survey-selection)"
          - "words:words/2026-09-07/9"
          - "words:words/2026-09-07/11"
          - "words:words/2026-09-07/12"
          - "words:words/2026-09-07/13"
          - "words:words/2026-09-07/16"
          - "words:words/2026-09-07/22"
          - "words:words/2026-09-07/23"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/unconfirmed-accumulation"
        keys:
          - "term:accumulation (defines: commons.systems/disposition-graph/unconfirmed-accumulation)"
          - "words:words/2026-09-07/2"
          - "words:words/2026-09-07/3"
          - "words:words/2026-09-07/4"
          - "words:words/2026-09-07/11"
          - "words:words/2026-09-07/12"
          - "words:words/2026-09-07/13"
          - "words:words/2026-09-07/15"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/viable-options"
        keys:
          - "words:words/2026-09-07/2"
          - "words:words/2026-09-07/3"
          - "words:words/2026-09-07/4"
      - with: "commons.systems/disposition-graph/what-an-option-row-carries"
        keys:
          - "words:words/2026-09-07/2"
          - "words:words/2026-09-07/3"
          - "words:words/2026-09-07/4"
      - with: "commons.systems/disposition-graph/work-loop"
        keys:
          - "cites"
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
defines:
  - neighbourhood
depends:
  - commons.systems/disposition-graph/clean-context-review#per-draft-and-survey
  - commons.systems/disposition-graph/frontier-consistency#split-survey-from-per-draft
  - commons.systems/disposition-graph/dialogue
  - commons.systems/disposition-graph/survey-selection#candidate-pairs-with-their-nominating-key
---

## Facts

### answer

`no-brief-grows-with-the-record` is recommended since 2026-09-07, on the author's words of that day (words/2026-09-07/22, words/2026-09-07/23): it is `the-surveys-selection-moves-to-its-own-node` with one bound added to "**What a brief must fit.**", that no brief grows with the record, that a brief the record's size is a one-time backfill on the author's word, and that an instrument whose brief is found growing with the record is a defect repaired before it runs again. Moderate boldness: the bound is the author's, in their words; what rests on the AI is its placement here, on the node that owns what a reading is given, rather than on `survey-selection`, which applies it to the survey and is where the mechanics that make the survey bounded are recommended.

`the-surveys-selection-moves-to-its-own-node` was recommended before that, and the amendment keeps every clause of it: it is `one-answer-a-node-and-one-read` with four clauses amended to cite `survey-selection`, the child minted that day, for how a survey's object is selected and gated and for what an accumulated node is carried by; the repair of the same day that named `survey-cost` is corrected to the node's name. Its own support and divergence are under its subsection, and what follows is the reason the text it amends was recommended on, which the amendment carries except where it says otherwise.

`one-answer-a-node-and-one-read` was recommended before the amendment, which keeps every clause of it. It is `neighbourhood-questions-and-delta` with four clauses added, and the argument for the text it amends is unchanged and stands in the subsections below; what is new is the author's words of 2026-09-07, that this iterative clean-context reading is very expensive, that the recommended optimizations are to be recorded as dispositions and progressed, and that they are to be applied as the sitting progresses, together with a sixth measurement taken on the seven briefs that sitting's own readings were handed.

The measurement is what decides it, and what it says is that the parts this node sized on 2026-09-05 are no longer where the cost is. Of 2,585,266 bytes over the seven draft briefs of 2026-09-07, 465,864 are the `## Account` of the node under review -- eighteen percent, and on the `alignment-page` brief 196,599 of 623,345 -- which grows with every reading applied and is the dialogue's history this node already refuses to carry for a neighbour. A further 262,496 are the standing answer of a node whose recommended answer is carried in the same brief beside it: ninety-four neighbour renderings across the seven carry two texts of one node, one as it is and one as it is about to be, in front of a reader judging a third node. Those two clauses take 728,360 bytes off the seven, twenty-eight percent, and neither touches what the reader is asked to judge. The third clause is the reading rather than the brief: `draft-growth.brief.md` is 2,081 lines and `draft-alignment-page.brief.md` 4,692, read in seven pieces and in sixteen under a bound of three hundred lines whose reason was one reader that died on a 6,944-line brief, while the navigation line of each of those same briefs told its reader to read it whole. The fourth is where a reading's attention goes rather than where its bytes go: of the fourteen findings the reading of `growth` returned on 2026-09-07, the session counted seven as defects an instrument decides, and of the six kinds named in the answer the validator today holds one, a `passed` row with no reason, and none of the other five.

Moderate boldness. What rests on the author is the criterion, now stated three times, token and context efficiency and the management of the AI's attention, together with the instruction to apply the optimizations while progressing them. What rests on the AI is all four clauses, the measurement they are drawn on, taken by the party the reading exists to check, and one placement: the rule that a mechanical defect is the instrument's was put to this session for the node above, and is recommended here, because it is a rule about what a reading's attention is spent on, which is this answer's own paragraph and this node's own question, while what a reading judges is the `frontier-consistency` node's list, which this rule leaves as it is.

#### neighbourhood-questions-and-delta

The rules the recommended text sets out: a draft's brief carries its neighbourhood in full, and the rules of the reading itself in the same way rather than as a list of files for the reader to open, and every other node as its id and its question on one line; a re-reading's object is the amendment and not the node; a draft gets two readings of one answer, a kickback being a new answer and not a third round, and what survives goes to the author as an option; and a brief is written to be held whole by the reader that gets it.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

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

**What a draft's reading is given.** Its object is one draft, so its brief carries that node in full and its neighbourhood in full: the ancestry to the root, the rules that bind every session, the nodes it names and the nodes its `depends` names, with the options named in them, the nodes under it, its siblings, and the readings that bear on it. A neighbour is carried by what it answers and not by its whole file: its question, the answer that stands on it, the answer it now recommends where those differ, and the names of the options on its answer fact. Its rationale, its facts prose, its option subsections and the rest of its recommendation are its own dialogue, and they stay in the file one read away, exactly as its account does and for the same reason. One exception, and it is the draft's own text and not the neighbour's: where an option on a neighbour's fact names the node under review as its source, that option's prose is carried in full, because it is what the draft put there and the validation that asks whether the draft contradicts the node above it turns on that prose. A reader given only the option's name has been told that the draft wrote something on its parent and not what it wrote. The generator does this as of the reconciliation of 2026-09-05: `renderNeighbourNode` takes the id of the node under review and carries whole any option whose `source` names it. Until that landing the clause was a rule stated and not a rule running, and the reading of 2026-09-05 paid the cost the exception exists to prevent, opening a neighbour's file from disk to check two options this node had sourced there. The node under review is the one node given whole, because it is the only one being judged. It carries the rules of the reading itself in the same way, in the brief and not as a list of files to open: what the review is and what it judges, the validations, the two readings and what each is given, and the encoding's own vocabulary, facts, options, rulings, the derived class, and what a node is. A brief that tells its reader to go and read a node it could have carried has the reader read that node twice, once where the brief already quotes it and once from disk, and pays for both. Of every other node in the record it carries the id, the question, and the file the node is in, on one line, and nothing else. The file is not decoration: a question tells the reader that the record asks this somewhere, and the path is what turns the pointer into a read the reader can actually make without a search. The round's other drafts, which the clean-context-review node's recommendation gives this reader so that texts written together are read together, are carried the same way and marked as the round: id, question, and the recommendation each now makes, one line each, since what the reader needs of a sibling draft is that it moved and what it moved to, and the text that moved is one file away. The questions are there because the merge validation asks whether the record already asks this question, and a reader cannot search for a question it cannot phrase; the answers behind those questions are the survey's object, because the whole graph is what the survey reads and not what a draft's reader reads. What lies outside the neighbourhood the reader reaches by searching the graph, which the brief tells it how to do, so the cost of reaching the rest of the record is the cost of what is found and not of what exists. The rule under all of it: a part of the brief that grows with the record rather than with the draft is carried as a list of pointers, and a part that is the draft's own is carried whole.

**What a re-reading is given.** A draft amended in answer to a reading's findings is read again, and the second reading's object is the amendment: the node as it now stands, its difference from the text the last reading pinned, that reading's findings, and the session's reply to each. It answers two questions, whether the amendment answers the finding and whether it introduces anything the reading has not seen, and it is not a fresh reading of the node. A fresh reading is owed only where the answer itself was redrawn, which is what a kickback is. The difference is computable only if the first reading recorded the graph commit of the text it read, beside the pin it already records, and the dialogue node's answer enumerates the review's draft keys as four written together or not at all. This answer needs a fifth, and that is that node's decision and not this one's: it is recorded there as an option, and until it is ruled the re-reading falls back to a full reading of the amended node, which the tool reports when it does it. The commit is the text the reading read and not the text that answers it, so the order is fixed: the reading is applied first, on a clean tree, and the amendment is written after. A session that amends before it applies leaves the tree dirty, no commit is recorded, and the re-reading falls back to the full brief; that is not a loss of correctness but it is a loss of the saving, and it is the one sequencing rule this answer imposes on the session.

**How many readings a draft gets.** Two: the reading, and the re-reading of its amendment. A finding that survives the second is recorded as an option on the fact it bears on, or as a probe where it asks the author what they meant, and it goes to the author with the node. A reader asked for findings will return some, so a loop that runs until a reading is silent ends on the reader's mood; two rounds ends it on the draft. The cap bounds amendment and not redrawing: either reading may still kick the draft back, and a kickback is a new answer, which owes a reading of its own. What the cap forbids is a third reading of the same answer.

**What a brief must fit.** A brief is written to be held whole by the reader it is given to, and it states its own size and the discipline for reading it. A brief the reader cannot hold is a defect of the brief, cured by narrowing the object and never by asking the reader to skim: a reading that dies of its own context returns nothing and is paid for twice.

**What the main thread spends.** That validation is never delegated is the clean-context-review node's rule and is not restated here. What this node adds is where the main thread spends when it validates: at the locus the finding names, and not by re-deriving the neighbourhood the reader was already given. A finding names a file and a line, and the cost of checking it is the cost of that file; a thread that re-reads the brief to check a finding pays the reading a second time and adds nothing, since the reader's context is exactly what it was asked to distrust.

**What attention is spent on.** Token efficiency and context management are bounds on what a reading is given; attention is what the reading does with it, and it is not the same quantity. A reader holds its object and cannot hold everything, so what a brief puts in front of it competes for the reading it can actually give, and a brief that fits is not thereby well aimed. The rule is that every part of a brief is there for a validation the reader is asked to run, and a part no validation reaches is struck rather than shortened: the questions are there for the merge validation, the neighbourhood for the contradiction validations, and the round for the merge validation too, since the index prints only the nodes outside the parts above and so leaves the round's questions unprinted; nothing is carried because it might prove useful. Consistency between two nodes of the frontier is the seventh validation and is the survey's, not this reader's, so it prices nothing in a draft's brief. What the round adds beyond a question, the recommendation each draft now makes, is reached by no validation on this reader's list, and whether that list should gain one is the `frontier-consistency` node's, where it is recorded as an option. This is what makes the answer more than a cut. Striking a part is cheaper and better aimed than compressing it, because a compressed part still asks for the reader's attention and no longer repays it.

**What is not bounded, and is not waste.** The number of drafts on the frontier and the number of sittings. The review is priced per draft by design, and a backlog costs one reading a draft in it; that is the cost of having the drafts, not the cost of reading them. That the review is priced per draft at all is the `clean-context-review` node's decision and not this one's, and its measured price is recorded on the `decomposition` node: measured at implementation commit 8bb72b17, this sitting's twenty-three draft briefs total 7,926,691 bytes against the 838,923 of the batch brief of 2026-09-03 that the division replaced, and the survey's brief, at 1,083,638, exceeds the batch on its own. What this node bounds is one reading of one draft; the multiplication is the division's, it is on the node that made it, and the author's own words that some of the spend is the acceptable cost of draining a backlog cover the backlog and not the multiplier.
```

#### one-reading-per-draft

The re-reading goes entirely: a draft is read once, the session amends in answer to the findings, and what the amendment got wrong is caught by the survey, which reads the whole graph before the author rules and is the record's reader of last resort by the frontier-consistency node's own answer. It is the cheapest answer on the table and it is not dominated: it costs one reading per draft against the recommended two, and the survey it leans on is owed before every ruling anyway. It is not recommended because the survey's object is the frontier's consistency and not this draft's claims, so an amendment that answers a finding wrongly, or that introduces a false statement about the record in the course of answering it, is exactly what the survey is not reading for; every one of the amendments this sitting wrote was written by the party whose draft the findings were against.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

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

The re-reading goes entirely: a draft is read once, the session amends in answer to the findings, and what the amendment got wrong is caught by the survey, which reads the whole graph before the author rules and is the record's reader of last resort by the frontier-consistency node's own answer. It is the cheapest answer on the table and it is not dominated: it costs one reading per draft against the recommended two, and the survey it leans on is owed before every ruling anyway. It is not recommended because the survey's object is the frontier's consistency and not this draft's claims, so an amendment that answers a finding wrongly, or that introduces a false statement about the record in the course of answering it, is exactly what the survey is not reading for; every one of the amendments this sitting wrote was written by the party whose draft the findings were against.
```

#### neighbours-carried-whole

The recommended answer with one clause struck: the neighbourhood is carried, and each neighbour whole, as the briefs of this sitting carried it. It is named as its own option because a ruling has to be able to take it, and the clause is the one a reader who thinks the review should see everything would strike first; it was also reached by measuring the recommended option's own reconciliation rather than by argument, which is a weaker provenance than the rest of the answer and the author should see that it is. It is not recommended because sixteen neighbours rendered whole were 2,709 lines of a 3,181-line brief written to judge a 208-line node, so the clause is most of what the answer does. What it would cost is real and this sitting's own reader paid it: given its neighbours by answer only, the reader of this draft had to open `clean-context-review.md` from disk to run the validation that asks whether the draft contradicts the node above it, because that validation turns on the neighbour's option prose and not on its answer. The recommended answer takes that finding as a bound rather than as a strike, and carries in full any neighbour option the draft itself sourced.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

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

The recommended answer with one clause struck: the neighbourhood is carried, and each neighbour whole, as the briefs of this sitting carried it. It is named as its own option because a ruling has to be able to take it, and the clause is the one a reader who thinks the review should see everything would strike first; it was also reached by measuring the recommended option's own reconciliation rather than by argument, which is a weaker provenance than the rest of the answer and the author should see that it is. It is not recommended because sixteen neighbours rendered whole were 2,709 lines of a 3,181-line brief written to judge a 208-line node, so the clause is most of what the answer does. What it would cost is real and this sitting's own reader paid it: given its neighbours by answer only, the reader of this draft had to open `clean-context-review.md` from disk to run the validation that asks whether the draft contradicts the node above it, because that validation turns on the neighbour's option prose and not on its answer. The recommended answer takes that finding as a bound rather than as a strike, and carries in full any neighbour option the draft itself sourced.
```

#### answers-only-index

Raised by this node's own reading. The index carries each node's id, question, file and standing answer, and nothing of its facts, options, rationale or recommendation: roughly a quarter of the index this sitting measured, and a small multiple of the one-line index. What it would answer is precisely the cost the recommended answer records against itself, that a reader shown only questions can see that a question exists without seeing how it was answered, which is enough to propose a merge and not enough to argue one. It is not recommended because the standing answers are the survey's object by the frontier-consistency node's answer, and a per-draft index that carries them is the batch's reading returning under another name; but the reading is right that this is the frontier's real middle point, and the author should rule on it rather than on the two ends.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

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

Raised by this node's own reading. The index carries each node's id, question, file and standing answer, and nothing of its facts, options, rationale or recommendation: roughly a quarter of the index this sitting measured, and a small multiple of the one-line index. What it would answer is precisely the cost the recommended answer records against itself, that a reader shown only questions can see that a question exists without seeing how it was answered, which is enough to propose a merge and not enough to argue one. It is not recommended because the standing answers are the survey's object by the frontier-consistency node's answer, and a per-draft index that carries them is the batch's reading returning under another name; but the reading is right that this is the frontier's real middle point, and the author should rule on it rather than on the two ends.
```

#### full-index-per-draft

Every draft's brief carries the standing answer, the facts and the rationale of every node in the record, as the briefs of 2026-09-04 and 2026-09-05 did. What it would answer: the reader sees the whole record and can find a contradiction with any part of it without being told where to look. Passed over because a draft's reader is given one draft as its object, and the whole record is the object of the other reading; the index in the per-draft brief is what the batch's reading left behind when the review divided by its object on 2026-09-04, and the findings this sitting returned show what the reader used, the node, its ancestry, its depends, the options it names, its siblings, the readings that bear on it, and the implementation.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

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

Every draft's brief carries the standing answer, the facts and the rationale of every node in the record, as the briefs of 2026-09-04 and 2026-09-05 did. What it would answer: the reader sees the whole record and can find a contradiction with any part of it without being told where to look. Passed over because a draft's reader is given one draft as its object, and the whole record is the object of the other reading; the index in the per-draft brief is what the batch's reading left behind when the review divided by its object on 2026-09-04, and the findings this sitting returned show what the reader used, the node, its ancestry, its depends, the options it names, its siblings, the readings that bear on it, and the implementation.
```

#### no-index-at-all

The brief carries the neighbourhood and nothing of the rest of the record, the reader searching the graph for whatever else it needs. Passed over because the fifteenth validation asks the reader whether the record already asks this question somewhere else, and a reader that has never seen the other questions cannot search for them: the list of questions is what makes that validation checkable, and it is one line a node.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

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

The brief carries the neighbourhood and nothing of the rest of the record, the reader searching the graph for whatever else it needs. Passed over because the fifteenth validation asks the reader whether the record already asks this question somewhere else, and a reader that has never seen the other questions cannot search for them: the list of questions is what makes that validation checkable, and it is one line a node.
```

#### full-re-read-on-every-move

A recommendation that moves after its reading is read again from the beginning, the whole node and the whole brief, as this sitting did. Passed over because the record already knows what moved: the reading carries the pin of the text it read, and the difference between that text and the amended one is the amendment. Reading the node whole to find it pays the object's price a second time.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

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

A recommendation that moves after its reading is read again from the beginning, the whole node and the whole brief, as this sitting did. Passed over because the record already knows what moved: the reading carries the pin of the text it read, and the difference between that text and the amended one is the amendment. Reading the node whole to find it pays the object's price a second time.
```

#### unbounded-rounds

The reading and the amendment repeat until a reading returns no findings. Passed over because a reader asked for findings returns some, and a reading that always finds something makes the loop end when a reader happens to be quiet rather than when the draft is sound; all thirteen of the readings this sitting landed on 2026-09-05 had findings accepted and moved their node's pin, so the loop as run has never once terminated of its own accord.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

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

The reading and the amendment repeat until a reading returns no findings. Passed over because a reader asked for findings returns some, and a reading that always finds something makes the loop end when a reader happens to be quiet rather than when the draft is sound; all thirteen of the readings this sitting landed on 2026-09-05 had findings accepted and moved their node's pin, so the loop as run has never once terminated of its own accord.
```

#### budget-per-sitting

A token budget for the sitting's reviews, the reading stopping when it is spent. Passed over because it stops the reading by the clock: what goes unread is whatever stood last in the queue, which has nothing to do with what was least worth reading, and the bound this answer wants is on the object of each reading and not on their number.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

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

A token budget for the sitting's reviews, the reading stopping when it is spent. Passed over because it stops the reading by the clock: what goes unread is whatever stood last in the queue, which has nothing to do with what was least worth reading, and the bound this answer wants is on the object of each reading and not on their number.
```

#### neighbourhood-cited-not-restated

The paragraph "What a draft's reading is given" states the parts of the brief
in full, and `clean-context-review` states them too; the two enumerations
disagreed on 2026-09-05 at exactly two points, `depends` against
names-by-id-or-slug, and the author's words on each neighbour, which this
node's list excluded and that node's list added, and at a third on the same
day, the nodes a draft names, which the parent's list and the generator both
carry and this node's list omitted until the reading found it. This option keeps here the
pricing, the measurement, the pointer rule, the re-reading and the cap, and
cites `clean-context-review` for what a reader is given: "what a reader is
given is the clean-context-review node's; what it costs and why each part is
that size is this node's." The case for it is `codd-update-anomaly`, and it is
measured: three amendments in two days each produced a fresh divergence in the
same sentence.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it, the pricing argument is unreadable without the thing
priced, and a paragraph that says what a part costs while pointing elsewhere
for what the part is makes the reader hold two files to follow one argument.
The same option stands on `clean-context-review` from the other side, as
`state-what-does-not-move-and-cite-review-cost`; the two are one decision about
where the neighbourhood is stated, and ruling for one is ruling for the other.
Raised by the clean-context readings of 2026-09-05 on that node, as their
counter-argument, twice.

**Content.**

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

The paragraph "What a draft's reading is given" states the parts of the brief
in full, and `clean-context-review` states them too; the two enumerations
disagreed on 2026-09-05 at exactly two points, `depends` against
names-by-id-or-slug, and the author's words on each neighbour, which this
node's list excluded and that node's list added, and at a third on the same
day, the nodes a draft names, which the parent's list and the generator both
carry and this node's list omitted until the reading found it. This option keeps here the
pricing, the measurement, the pointer rule, the re-reading and the cap, and
cites `clean-context-review` for what a reader is given: "what a reader is
given is the clean-context-review node's; what it costs and why each part is
that size is this node's." The case for it is `codd-update-anomaly`, and it is
measured: three amendments in two days each produced a fresh divergence in the
same sentence.
```

#### pin-names-the-text-the-reader-read

The sequencing rule this answer imposes has a consequence it does not state,
and the consequence decides whether a node can ever become ready to rule. The
reading is applied first and the amendment written after, so the review's pin
names the text the reader read; the amendment then moves the recommendation
past that pin, the frontier prints the node as changed since its review, and
readiness, which asks that the pin name the recommendation as it stands, is not
met. Under the cap no third reading is available to re-pin it. The three ways
out are the option: the second reading's apply settles the pin over the
amendment it read, which is what the applying script does today and which makes
the pin attest a forward on text no reader saw; or readiness stops asking the
draft-review pin to be current once the cap is reached and asks only that the
two readings have happened; or an amendment after the second reading is
forbidden outright and every surviving finding becomes an option. The record already holds the tradition that strikes the first:
`commons.systems/disposition-graph/review-approval-pinned-to-a-revision` says
that a practice which lets an approval stand over a revision nobody read is the
failure the pinned approval exists to convert into a visible one, "the approval
is still displayed, the reader trusts it, and the change that lands is not the
change that was read", which is exactly what settling the pin over the
amendment would do. This is not recorded as settled by any of them. Measured on this sitting: every reading of
2026-09-04 and 2026-09-05 was applied after its amendment and not before, so no
review block in the record carries a graph commit except one, every re-reading
fell back to the full draft brief, and every pin written names text its reader
had not seen. Raised by the clean-context reading of `authority` on 2026-09-05.

Measured again at graph commit 4262d092, with the record's own predicates and
not by eye: of 142 nodes, 48 carry a stage of `review` or `ruling`; 34 of the 48
are stale by `reviewStale`, their pinned recommendation differing from the one
that stands; 13 review blocks now carry the graph commit the reader read, the
sequencing rule this answer imposes having taken effect on 2026-09-05; and
`readyToRule` is true of none of the 48. The survey pin is the other half of
that zero and is a different debt, since no node yet carries one. What the
first number says is that the deadlock is not a corner case of the two nodes
that reached the cap: on a frontier the size of this one it is the ordinary
state, and every amendment a reading earns puts one more node into it.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

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

The sequencing rule this answer imposes has a consequence it does not state,
and the consequence decides whether a node can ever become ready to rule. The
reading is applied first and the amendment written after, so the review's pin
names the text the reader read; the amendment then moves the recommendation
past that pin, the frontier prints the node as changed since its review, and
readiness, which asks that the pin name the recommendation as it stands, is not
met. Under the cap no third reading is available to re-pin it. The three ways
out are the option: the second reading's apply settles the pin over the
amendment it read, which is what the applying script does today and which makes
the pin attest a forward on text no reader saw; or readiness stops asking the
draft-review pin to be current once the cap is reached and asks only that the
two readings have happened; or an amendment after the second reading is
forbidden outright and every surviving finding becomes an option. The record already holds the tradition that strikes the first:
`commons.systems/disposition-graph/review-approval-pinned-to-a-revision` says
that a practice which lets an approval stand over a revision nobody read is the
failure the pinned approval exists to convert into a visible one, "the approval
is still displayed, the reader trusts it, and the change that lands is not the
change that was read", which is exactly what settling the pin over the
amendment would do. This is not recorded as settled by any of them. Measured on this sitting: every reading of
2026-09-04 and 2026-09-05 was applied after its amendment and not before, so no
review block in the record carries a graph commit except one, every re-reading
fell back to the full draft brief, and every pin written names text its reader
had not seen. Raised by the clean-context reading of `authority` on 2026-09-05.

Measured again at graph commit 4262d092, with the record's own predicates and
not by eye: of 142 nodes, 48 carry a stage of `review` or `ruling`; 34 of the 48
are stale by `reviewStale`, their pinned recommendation differing from the one
that stands; 13 review blocks now carry the graph commit the reader read, the
sequencing rule this answer imposes having taken effect on 2026-09-05; and
`readyToRule` is true of none of the 48. The survey pin is the other half of
that zero and is a different debt, since no node yet carries one. What the
first number says is that the deadlock is not a corner case of the two nodes
that reached the cap: on a frontier the size of this one it is the ordinary
state, and every amendment a reading earns puts one more node into it.
```

#### brief-carries-the-recount-command

Where a draft's rationale rests on a measurement, its brief carries the command
that reproduces the number, so that the reader checks the measurement rather
than taking the drafter's word for it or re-inventing a way to re-take it. What
it would answer is the validation that asks whether a claim about the record is
true, which is the validation a reader can least afford to run by hand and the
one this node's own rationale failed twice: once when a figure exceeded the
maximum the same paragraph stated, and once when the repair for that was to
write a different number rather than to re-measure. Its cost is that the
command is a second thing to keep true, and a stale command is worse than none,
since it looks checkable. It was the clean-context reading of 2026-09-05's own
suggestion; this node answered it in the rationale with a recount instruction
instead, and the second reading found that instruction false in both its limbs,
which is why the option is on the list rather than in the prose.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

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

Where a draft's rationale rests on a measurement, its brief carries the command
that reproduces the number, so that the reader checks the measurement rather
than taking the drafter's word for it or re-inventing a way to re-take it. What
it would answer is the validation that asks whether a claim about the record is
true, which is the validation a reader can least afford to run by hand and the
one this node's own rationale failed twice: once when a figure exceeded the
maximum the same paragraph stated, and once when the repair for that was to
write a different number rather than to re-measure. Its cost is that the
command is a second thing to keep true, and a stale command is worse than none,
since it looks checkable. It was the clean-context reading of 2026-09-05's own
suggestion; this node answered it in the rationale with a recount instruction
instead, and the second reading found that instruction false in both its limbs,
which is why the option is on the list rather than in the prose.
```

#### rules-of-the-reading-named-as-files

The brief names the twelve rule nodes for the reader to open rather than
carrying them, which is what the brief did until 2026-09-04. It would save the
65,882 bytes those twelve cost in every brief, three times the index they
displaced, and it is passed over for the double read it costs: the reader
opening the twelve by instruction, five of them twice, since the five
global-tier rules are in every neighbourhood already, and reaching outside its
neighbourhood for the other seven, which is the fourth measurement in the
rationale and the cheapest cost the brief was cut to remove. The clean-context
reading of 2026-09-05 named it as a candidate this node argued against in prose
and did not list, and the delta reading of 2026-09-07 found it still unlisted;
it is on the fact so that the author sees the bytes it would save beside the
read it would cost.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

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

The brief names the twelve rule nodes for the reader to open rather than
carrying them, which is what the brief did until 2026-09-04. It would save the
65,882 bytes those twelve cost in every brief, three times the index they
displaced, and it is passed over for the double read it costs: the reader
opening the twelve by instruction, five of them twice, since the five
global-tier rules are in every neighbourhood already, and reaching outside its
neighbourhood for the other seven, which is the fourth measurement in the
rationale and the cheapest cost the brief was cut to remove. The clean-context
reading of 2026-09-05 named it as a candidate this node argued against in prose
and did not list, and the delta reading of 2026-09-07 found it still unlisted;
it is on the fact so that the author sees the bytes it would save beside the
read it would cost.
```

#### a-cap-on-redraws-per-node-per-sitting

The cap of two bounds the readings of one answer and is silent on how many
answers a node may have, because a kickback is a new answer and owes a reading of
its own. Nothing in the record bounds the cycle those two rules make together:
draft, reading, kickback, redraw, reading, kickback, and a node can be read any
number of times while each reading obeys the cap. Measured on this record on
2026-09-05, at graph commit 73e2a04f: `clean-context-review` has been read seven
times, `what-acts-during-bootstrap` four, `class-recommendation` three, and each
of those readings was within the cap. What the option would add is a second
bound, on redraws of one node within one sitting, past which the node stops being
redrawn and goes to the author with the reading's findings recorded as options on
the fact they bear on, which is what the answer already does with a finding that
survives the second reading.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it: the two nodes this record has read most
are the two whose answers were wrong in ways each reading caught and the last
redraw fixed, so a bound would have shipped a known defect to the author to save
tokens, and the record's own rule is that a kickback is a new answer precisely
because a redrawn answer is not the one that was read. Recorded on 2026-09-05, in
the sitting whose cost raised the question, and not recommended: what the right
bound is, or whether the right instrument is a bound at all rather than a
different first draft, is not something this sitting measured.

**Content.**

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

The cap of two bounds the readings of one answer and is silent on how many
answers a node may have, because a kickback is a new answer and owes a reading of
its own. Nothing in the record bounds the cycle those two rules make together:
draft, reading, kickback, redraw, reading, kickback, and a node can be read any
number of times while each reading obeys the cap. Measured on this record on
2026-09-05, at graph commit 73e2a04f: `clean-context-review` has been read seven
times, `what-acts-during-bootstrap` four, `class-recommendation` three, and each
of those readings was within the cap. What the option would add is a second
bound, on redraws of one node within one sitting, past which the node stops being
redrawn and goes to the author with the reading's findings recorded as options on
the fact they bear on, which is what the answer already does with a finding that
survives the second reading.
```

#### one-answer-a-node-and-one-read

`neighbourhood-questions-and-delta` with four clauses, each a bound on a part of the reading the earlier text left unpriced.

One answer a node. A node a reading is not judging is carried by one answer and never two: the answer that stands where a ruling reaches the node, the recommended answer where none does, with a line naming the other and its file. It is one rule for every reading, so the survey carries its context the same way. What it costs is that a reader shown one text cannot see how far the node moved without opening the file.

The account. The node under review is carried whole but for its `## Account`, of which the last section alone is carried, with the count of those omitted in its place. The ground is the ground on which a neighbour's account already stays in the file; the last section is kept because the previous reading's findings and the session's replies are there, and an amendment is an answer to those. What it costs is that a reading cannot see that a finding it is about to raise was raised and answered two readings ago.

The read. A brief that fits is read in the fewest pieces the reader's tool allows, and in one call where the tool reaches the whole of it, the bound on a piece staying for the brief a reader cannot hold. The brief's navigation line and the launch prompt must say the same thing, which on 2026-09-07 they did not. What it costs is that a brief which has quietly grown past what the reader can hold now fails as a dead reading rather than as a slow one.

The finding and the mechanical defect. A finding names the file and the heading and quotes its locus verbatim, so the main thread's validation is a search that returns the text or nothing; and a defect an instrument can name is the instrument's, the checks being owed to the validator and a reading that meets one still reporting it until they land. What it costs is the debt: until the validator holds the six checks, the class of defect they name is caught by nobody who is looking for it.

Raised from the author's words of 2026-09-07 and from the measurement of that sitting's own seven briefs. Three of the four clauses -- the account, the verbatim locus, and the survey's carrying rule -- were already running in the working tree at 87e4b24e under the author's instruction to begin applying, which makes this recommendation the record catching up with its instrument, the same order the option `pointers-for-what-grows-with-the-record` had on the node above.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

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

**What a draft's reading is given.** Its object is one draft, so its brief carries that node in full and its neighbourhood in full: the ancestry to the root, the rules that bind every session, the nodes it names and the nodes its `depends` names, with the options named in them, the nodes under it, its siblings, and the readings that bear on it. A node a reading is not judging is carried by what it answers and never by its whole file, and it is one rule for every reading, a draft's neighbourhood and the survey's graph alike: its question, one answer, and the names of the options on its answer fact. One answer and never two. Where a ruling reaches the node the answer that stands is carried, since that is what binds; where no ruling reaches it the answer it now recommends is carried, since nothing else on the node is operative; and one line says which was carried, names the other, and gives the file it is in. Carrying both puts one node's argument in front of the reader twice, once as it is and once as it is about to be, and asks a reader whose object is a different node to work out which of the two it is judging against; that is the class's to say and not the reader's to infer. During bootstrap no ruling reaches any node, so a neighbour whose recommendation differs from what stands is carried by the recommended text alone. Its rationale, its facts prose, its option subsections and the rest of its recommendation are its own dialogue, and they stay in the file one read away, exactly as its account does and for the same reason. One exception, and it is the draft's own text and not the neighbour's: where an option on a neighbour's fact names the node under review as its source, that option's prose is carried in full, because it is what the draft put there and the validation that asks whether the draft contradicts the node above it turns on that prose. A reader given only the option's name has been told that the draft wrote something on its parent and not what it wrote. The generator does this as of the reconciliation of 2026-09-05: `renderNeighbourNode` takes the id of the node under review and carries whole any option whose `source` names it. Until that landing the clause was a rule stated and not a rule running, and the reading of 2026-09-05 paid the cost the exception exists to prevent, opening a neighbour's file from disk to check two options this node had sourced there. The node under review is the one node given whole, because it is the only one being judged; and whole is its question, the author's words, the text that stands, its rationale, its facts with every option's prose, and its recommendation, together with the last section of its `## Account` and nothing before it, the count of the sections left out standing in its place. An account is the dialogue's history and not its text, which is the ground on which a neighbour's account already stays in the file, and it grows with every reading applied while the draft it records does not, so a node read four times pays for four accounts to be judged once. The last section is kept because the previous reading's findings and the session's replies to them are there, and a reader judging what a draft became is judging an answer to those. It carries the rules of the reading itself in the same way, in the brief and not as a list of files to open: what the review is and what it judges, the validations, the two readings and what each is given, and the encoding's own vocabulary, facts, options, rulings, the derived class, and what a node is. A brief that tells its reader to go and read a node it could have carried has the reader read that node twice, once where the brief already quotes it and once from disk, and pays for both. Of every other node in the record it carries the id, the question, and the file the node is in, on one line, and nothing else. The file is not decoration: a question tells the reader that the record asks this somewhere, and the path is what turns the pointer into a read the reader can actually make without a search. The round's other drafts, which the clean-context-review node's recommendation gives this reader so that texts written together are read together, are carried the same way and marked as the round: id, question, and the recommendation each now makes, one line each, since what the reader needs of a sibling draft is that it moved and what it moved to, and the text that moved is one file away. The questions are there because the merge validation asks whether the record already asks this question, and a reader cannot search for a question it cannot phrase; the answers behind those questions are the survey's object, because the whole graph is what the survey reads and not what a draft's reader reads. What lies outside the neighbourhood the reader reaches by searching the graph, which the brief tells it how to do, so the cost of reaching the rest of the record is the cost of what is found and not of what exists. The rule under all of it: a part of the brief that grows with the record rather than with the draft is carried as a list of pointers, and a part that is the draft's own is carried whole.

**What a re-reading is given.** A draft amended in answer to a reading's findings is read again, and the second reading's object is the amendment: the node as it now stands, its difference from the text the last reading pinned, that reading's findings, and the session's reply to each. It answers two questions, whether the amendment answers the finding and whether it introduces anything the reading has not seen, and it is not a fresh reading of the node. A fresh reading is owed only where the answer itself was redrawn, which is what a kickback is. The difference is computable only if the first reading recorded the graph commit of the text it read, beside the pin it already records, and the dialogue node's answer enumerates the review's draft keys as four written together or not at all. This answer needs a fifth, and that is that node's decision and not this one's: it is recorded there as an option, and until it is ruled the re-reading falls back to a full reading of the amended node, which the tool reports when it does it. The commit is the text the reading read and not the text that answers it, so the order is fixed: the reading is applied first, on a clean tree, and the amendment is written after. A session that amends before it applies leaves the tree dirty, no commit is recorded, and the re-reading falls back to the full brief; that is not a loss of correctness but it is a loss of the saving, and it is the one sequencing rule this answer imposes on the session.

**How many readings a draft gets.** Two: the reading, and the re-reading of its amendment. A finding that survives the second is recorded as an option on the fact it bears on, or as a probe where it asks the author what they meant, and it goes to the author with the node. A reader asked for findings will return some, so a loop that runs until a reading is silent ends on the reader's mood; two rounds ends it on the draft. The cap bounds amendment and not redrawing: either reading may still kick the draft back, and a kickback is a new answer, which owes a reading of its own. What the cap forbids is a third reading of the same answer.

**What a brief must fit.** A brief is written to be held whole by the reader it is given to, and it states its own size and the discipline for reading it. A brief the reader cannot hold is a defect of the brief, cured by narrowing the object and never by asking the reader to skim: a reading that dies of its own context returns nothing and is paid for twice. A brief that fits is then read in the fewest pieces the reader's tool allows, and in one call where the tool's limit reaches the whole of it. A reader that pages a brief it could have held re-sends everything it has already read with every further page, so the pieces multiply the brief by roughly half their number and buy nothing back; the bound on the size of a piece exists for the brief a reader cannot hold, which is the defect above, and it is not the rule for the ordinary case. The brief's own navigation line and the prompt that launches the reader state one discipline between them, or the reader has been given two rules and will follow whichever it read last.

**What the main thread spends.** That validation is never delegated is the clean-context-review node's rule and is not restated here. What this node adds is where the main thread spends when it validates: at the locus the finding names, and not by re-deriving the neighbourhood the reader was already given. A finding names a file and a line, and the cost of checking it is the cost of that file; a thread that re-reads the brief to check a finding pays the reading a second time and adds nothing, since the reader's context is exactly what it was asked to distrust. So a finding names the file, names the heading it sits under, and quotes the sentence or the clause it bears on exactly as that text stands in the file, never paraphrased, never summarized, and never by a line number: the file and the heading are the address, the quoted bytes are what turn the validation into a search that returns either the text or nothing, and a line number is stale the moment anything above it is edited. A finding whose locus the thread has to reconstruct makes the thread read the node to find what the reader already had in front of it.

**What attention is spent on.** Token efficiency and context management are bounds on what a reading is given; attention is what the reading does with it, and it is not the same quantity. A reader holds its object and cannot hold everything, so what a brief puts in front of it competes for the reading it can actually give, and a brief that fits is not thereby well aimed. The rule is that every part of a brief is there for a validation the reader is asked to run, and a part no validation reaches is struck rather than shortened: the questions are there for the merge validation, the neighbourhood for the contradiction validations, and the round for the merge validation too, since the index prints only the nodes outside the parts above and so leaves the round's questions unprinted; nothing is carried because it might prove useful. Consistency between two nodes of the frontier is the seventh validation and is the survey's, not this reader's, so it prices nothing in a draft's brief. What the round adds beyond a question, the recommendation each draft now makes, is reached by no validation on this reader's list, and whether that list should gain one is the `frontier-consistency` node's, where it is recorded as an option. This is what makes the answer more than a cut. Striking a part is cheaper and better aimed than compressing it, because a compressed part still asks for the reader's attention and no longer repays it. And a defect an instrument can name is the instrument's and never a reading's. A reading is the only reader in this record that can judge whether an answer is right, and it is the most expensive reader the record has; spending it on an option marked passed with no reason recorded, on prose that says an option was passed over where the row carries no status, on a fact whose prose opens straight onto an option subsection with no reason above it, on a pin naming a commit the node has moved past, on a dated passage quoted in a rationale that stands under no `## Disposition`, or on an account section byte-identical to the one above it, spends that attention on what a script decides. Each such finding is paid three times over, in the fix, in the re-reading the amendment owes, and in the main thread's validation. The rule binds the instrument before it binds the reader: every defect of that kind the record has met is a check the validator is owed, and a reading that meets one while the validator still lacks it reports it like any other. What the rule forbids is a brief that asks a reader to run a check a script could have refused.

**What is not bounded, and is not waste.** The number of drafts on the frontier and the number of sittings. The review is priced per draft by design, and a backlog costs one reading a draft in it; that is the cost of having the drafts, not the cost of reading them. That the review is priced per draft at all is the `clean-context-review` node's decision and not this one's, and its measured price is recorded on the `decomposition` node: measured at implementation commit 8bb72b17, this sitting's twenty-three draft briefs total 7,926,691 bytes against the 838,923 of the batch brief of 2026-09-03 that the division replaced, and the survey's brief, at 1,083,638, exceeds the batch on its own. What this node bounds is one reading of one draft; the multiplication is the division's, it is on the node that made it, and the author's own words that some of the spend is the acceptable cost of draining a backlog cover the backlog and not the multiplier.
```

#### a-waves-brief-is-one-brief

Everything `one-answer-a-node-and-one-read` says, with the wave's brief among what this node bounds: where a sitting's drafts are read as one wave, the shared neighbourhood is carried once and each object once, and the wave is split whenever the resulting brief exceeds what one reader holds whole.

Measured on 2026-09-07 on the four children of the alignment page, at graph commit `d0942d57` and implementation commit `87e4b24e`: `draft-authors-words-on-the-page.brief.md` 307,920 bytes, `draft-what-an-option-row-carries.brief.md` 389,802, `draft-where-a-change-request-goes.brief.md` 317,061 and `draft-where-the-unconfirmed-indication-goes.brief.md` 344,563, totalling 1,359,346, of which the parts common to all four run 249,607, 255,194, 256,936 and 256,305 bytes, differing between them only by which of the four each brief excludes from its round and its siblings. One brief carrying their union once and the four objects once is about 598,240 bytes, fifty-six percent less than the four. That figure is a projection: no generator writes a wave brief. The one wave the record has run, later the same day at graph commit `2abca334` and implementation commit `cb0e02c6`, was one reader over four separately generated briefs -- `draft-clean-context-review.brief.md` 323,650, `draft-review-model.brief.md` 280,360, `draft-frontier-consistency.brief.md` 319,159 and `draft-unit-skills.brief.md` 263,766, 1,186,935 bytes in all -- which realized none of the saving and incurred the whole of the loss. Both sets are in `tmp/review/`, which is gitignored, and are re-taken by re-running the generator at the commit named.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it: this node's recommended text cures a brief the reader cannot hold by narrowing the object, and a wave widens it; the split is what reconciles the two, and no instrument runs the split.

Raised on `commons.systems/disposition-graph/clean-context-review`, whose recommendation makes the wave, and recorded here because what a brief must fit and how many readings an answer gets are this node's. Whether the clause stands there or here is the author's to rule, and the two rows name each other.

**Content.**

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

Everything `one-answer-a-node-and-one-read` says, with the wave's brief among what this node bounds: where a sitting's drafts are read as one wave, the shared neighbourhood is carried once and each object once, and the wave is split whenever the resulting brief exceeds what one reader holds whole.

Measured on 2026-09-07 on the four children of the alignment page, at graph commit `d0942d57` and implementation commit `87e4b24e`: `draft-authors-words-on-the-page.brief.md` 307,920 bytes, `draft-what-an-option-row-carries.brief.md` 389,802, `draft-where-a-change-request-goes.brief.md` 317,061 and `draft-where-the-unconfirmed-indication-goes.brief.md` 344,563, totalling 1,359,346, of which the parts common to all four run 249,607, 255,194, 256,936 and 256,305 bytes, differing between them only by which of the four each brief excludes from its round and its siblings. One brief carrying their union once and the four objects once is about 598,240 bytes, fifty-six percent less than the four. That figure is a projection: no generator writes a wave brief. The one wave the record has run, later the same day at graph commit `2abca334` and implementation commit `cb0e02c6`, was one reader over four separately generated briefs -- `draft-clean-context-review.brief.md` 323,650, `draft-review-model.brief.md` 280,360, `draft-frontier-consistency.brief.md` 319,159 and `draft-unit-skills.brief.md` 263,766, 1,186,935 bytes in all -- which realized none of the saving and incurred the whole of the loss. Both sets are in `tmp/review/`, which is gitignored, and are re-taken by re-running the generator at the commit named.
```

#### the-surveys-unreached-node-is-one-line

Everything `one-answer-a-node-and-one-read` says, with the survey's own graph priced by this node and its reach rule cited rather than restated: what the survey reads of a node it is not judging is `commons.systems/disposition-graph/frontier-consistency`'s, stated in its validations and conditioned there on the node; this node prices what that costs and states the bound, and restates neither the reach rule nor the one-line class.

Measured on the survey brief of 2026-09-07: 1,202,450 bytes at implementation commit `87e4b24e`, before the cut, of which the eight judged nodes are 233,716 and the hundred and thirty-three context nodes 710,747; 994,467 bytes at implementation commit `cb0e02c6`, after it, which is the shape `packages/clean-context-review/brief.mjs` now writes.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it: at a hundred and forty-three nodes neither shape is held whole by one reader, so what the cut buys is a smaller brief and not a brief that fits; and the one-line class rests on an earlier survey having read those nodes, which the survey of 2026-09-05 did for every node the record then had and does for none minted since.

Raised on `commons.systems/disposition-graph/frontier-consistency`, whose validations state the inputs, and recorded here because what a reading is given is this node's. The author then rules the placement once rather than meeting the same rule on two nodes.

**Content.**

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

Everything `one-answer-a-node-and-one-read` says, with the survey's own graph priced by this node and its reach rule cited rather than restated: what the survey reads of a node it is not judging is `commons.systems/disposition-graph/frontier-consistency`'s, stated in its validations and conditioned there on the node; this node prices what that costs and states the bound, and restates neither the reach rule nor the one-line class.

Measured on the survey brief of 2026-09-07: 1,202,450 bytes at implementation commit `87e4b24e`, before the cut, of which the eight judged nodes are 233,716 and the hundred and thirty-three context nodes 710,747; 994,467 bytes at implementation commit `cb0e02c6`, after it, which is the shape `packages/clean-context-review/brief.mjs` now writes.
```

#### the-surveys-selection-moves-to-its-own-node

What a reading is given stays here; how a survey's object is selected and divided so that it is smaller without being narrower, which checks must be clean before a survey's reader is launched, and what the accumulation leaves in the judged node's place, are the `survey-selection` node's and are cited here and not restated.

**AI support.** The selection is a design with its own options, measurements and traditions, and a ruling per fact needs a node per question; this node's rule that a brief is narrowed by its object and never by a budget is what the selection applies, and the citation keeps the two in one direction. The amendment also corrects the repair of 2026-09-07 that named `survey-cost`, a node that did not exist, which the second re-reading kicked back.

Recorded on the author's words of 2026-09-05, carried above: the review is burning tokens rapidly, part of that is the acceptable cost of draining a backlog, and the lessons of the sitting are to be taken as improvements for token usage, context management, and the management of the AI's attention.

The measurement decides it. Of the nineteen draft briefs this sitting generated, the index of every node's standing answer ran from 1,803 to 3,447 lines, a mean of 2,775, and between 22 and 69 percent of the brief. It was near enough the same text in every one: an index differs from the next only by the nodes its own brief renders elsewhere and by the questions the record had gained, and the record went from 63 questions at graph commit 5e8e0a3d on 2026-09-04 to 142 nodes at 1cde11f6 on 2026-09-05, so the constant grew over the sitting as well as repeating within it. Set against the object each brief was written for, the node under review, which ran from 94 lines to 1,946 and averaged 554, the index was a median of eight times the object and in one brief thirty-one times it. The reading of `progressive-disclosure`, 108 lines of node with two options and one tradition, was handed 3,284 lines of index in a brief of 5,740 lines and cost 206,279 tokens: the most expensive reading of the batch, on nearly the smallest object in it. `decomposition`, at 175 lines, cost 162,526; `rejected`, at 406, cost 89,264. Cost does not track the object, because a constant many times its size dominates it.

Those figures are not recomputable, and an earlier draft of this node said they were. The briefs are the files `tmp/review/*.brief.md`, and `tmp/` is gitignored, so no brief is on the implementation ref and none is on any ref; the files on disk are overwritten each time a brief is regenerated, and by 2026-09-05 twenty-one of the twenty-three had been regenerated in the post-reconciliation form, so neither end of the before-and-after pair above survives. What can still be checked, at implementation commit 8bb72b17, is that `draft-decomposition.brief.md` is 1,266 lines and `draft-progressive-disclosure.brief.md` 1,434, and that the two briefs still carrying the old index section are consistent with the band; the range's endpoints, the mean of 2,775, the median of eight times the object, and the decomposition pair are gone and cannot be re-taken by anyone, including this node. They are left standing as what was measured on 2026-09-05 and marked here as unrecountable, which is the honest form; and the reading of 2026-09-05 records that the previous reading's finding, that 3,447 was written where 3,478 had been measured, was answered by changing the number and not by re-measuring it. Every figure this node states from here on is given with the graph commit and the implementation commit it was taken at. That a brief resting a draft's argument on a measurement should carry the command that reproduces it is the option `brief-carries-the-recount-command`, which this node answered in prose once and should not have.

Why that constant is there is an incumbent fact and not a reason. Until 2026-09-04 the review was one reading of the whole frontier, and the index was that reading's object; when the clean-context-review node divided the review by its object, the index stayed in the per-draft brief where it no longer had one. Read as if the brief were being written from scratch, the question is what the reader of one draft must see, and the answer is the draft, what the draft stands on and what stands on it, and the questions the record already asks.

The findings this sitting returned are the evidence for the neighbourhood: every one had its locus in the node, its ancestry, its `depends`, the options it names, its siblings, the readings that bear on it, or the implementation. The one reach beyond that which mattered, the finding that three standing answers place a rejected alternative in the rationale, was made by searching the graph for the phrase and not by reading the index; so was the finding that a tradition the record called already read had no reading. Search is what reaches the rest of the record, and search costs what it finds.

The re-reading follows from the same sitting. Thirteen readings landed on 2026-09-05, and all thirteen had findings accepted: every one of the thirteen nodes now reads as changed since its review, owing a second reading of a text that differs from the first in the places the findings named. The cap follows from the same fact from the other side: the loop as run has never terminated of its own accord.

The round's other drafts are the case that shows the rule is not about the index. The clean-context-review node's recommendation gives a draft's reader every node whose recommendation has moved since the survey last pinned it, so that the contradictions a sitting creates between texts written together are caught before the survey; it is right about the need, and at graph commit 1cde11f6 on 2026-09-05, before the first survey ran, that set was forty-eight nodes, every node standing at the review or the ruling stage, because no node yet carried a survey pin; that day's survey pinned forty-five, and at graph commit e4c87ed0 the set was twenty-five of the fifty at those stages. A brief prints fewer than forty-eight, since the nodes already carried in its own neighbourhood are not printed twice. Thirteen is a different number that an earlier draft of this node put here: it is the count of readings this sitting landed on 2026-09-05, and the round is not that set. Handed whole, it would put back most of what striking the index takes out, and it would grow with the sitting rather than with the draft. Handed as one line a node saying which moved and what each now recommends, it does the work it was asked for, because what a reader needs of a sibling draft is that it moved and what it moved to; the text is one file away, and a reader that has been told a neighbour moved will open it. That is recorded as an option on the clean-context-review node, since the neighbourhood is its answer's to state.

The reconciliation of this answer measured itself, which is the fifth measurement and the one that set the clause about neighbours. Measure in bytes and not in lines: this record writes a paragraph as one unwrapped line, so a line count flatters whichever text has the shorter paragraphs, and on the three briefs measured both ways it overstated the saving by ten points. Striking the index took the `decomposition` brief from 4,934 lines to 3,181 and the index within it from 3,447 lines to 97. The two ends were measured at different graph commits, the record having gained this node and its landings in between, so the pair is a change of design and a change of record together and the index figure is the one to trust, since it is the same section counted the same way at both ends. What the index left behind was not the draft: of the 3,181 lines, the node under review is 208, the instructions and the output schema about 111, the two lists of pointers 136, and sixteen neighbour nodes rendered whole are 2,709. The constant did not go away; it moved. And the neighbours are rendered whole in a record whose nodes carry their whole dialogue, so one ancestor contributed a 383-line rationale to a brief written to judge a 175-line draft. The brief already drops a neighbour's account, on the ground that an account is the dialogue's history and not its text; a neighbour's rationale, its facts prose, its passed-over options and its recommendation fence are the same node's dialogue by the same test, and the reader judges a draft against what its neighbours answer. So they go the way the accounts went.

What the whole of it came to, measured on three briefs generated before the reconciliation and again after it: `madr-decision-records` from 836 to 249 kilobytes, `authority` from 882 to 284, and `alignment-page` from 1,207 to 489, a cut of seventy, sixty-eight and sixty percent. The last is the smallest cut and is the one to read: `alignment-page` is a 1,946-line node, so the brief that judges it is mostly its object, which is the shape every brief should have and the shape none of them had.

That shape is not yet reached, and the rule as stated does not reach it. Measured on this node's own second brief, at graph commit 02287a28 and implementation commit 8bb72b17, and taken after the neighbour clause landed: 288,763 bytes, of which the node under review is 18,332 and its answer and rationale a further 52,798, so the object is a quarter of the brief; the ancestry and the rules that bind everywhere are 65,467, the rules of the reading 65,706, the siblings 21,864, the nodes it names 15,291, the index 18,836 and the round 5,385. The rules of the reading alone, three times the index they displaced, are constant across briefs. The rule this answer states sorts a part that grows with the record from a part that is the draft's own and has no case for a part that grows with neither, which is what a constant is; the argument that actually carries the rules of the reading is the double read, and that is a different test. So the rule has a third case: a part constant across every brief is carried whole only where carrying it costs less than the reads it saves, and the measurement above is what that case is judged on.

The double read is the fourth measurement, and the cheapest to remove: the brief as it stood told its reader to read twelve node files in full before writing a finding, five of which the brief already carried whole in its ancestry section, since the five global-tier rules belong to every neighbourhood; the reader paid for those five twice and reached outside its neighbourhood by instruction for the other seven. Those twelve are the rules of the reading, they are the same twelve for every draft, and a brief that carries them carries them once.

One clause of this answer adopts a convention the record has already recorded itself diverging from, and the divergence is named here rather than left for a reader to find. `commons.systems/disposition-graph/self-contained-specification` holds that a term is glossed once on the node that defines it and cited by id everywhere else, on the ground that the reader this record has follows an id that resolves, so the restatement the convention asks for buys nothing and drifts. The clause that carries the rules of the reading in the brief does the opposite, and the counter recorded on that very node is the warrant: it names, among the readers the convention still fits, a subagent given one node and its ancestry, which is this reader exactly. The scope of the adoption is that reader and no other, and the record is not thereby loosened for nodes, which are read through a projector by an agent that can follow a link.

The reader's own context is the third measurement. One reader died with its whole spend returned as nothing, its context refilling to the limit three times in three turns while it read a 6,944-line brief in large pieces; relaunched with a bound on each read, it finished, and that reading was paid for twice. A brief that a reader cannot hold is not a reader's problem.

The sixth measurement is the sitting of 2026-09-07, and it is what this answer's later clauses are drawn on. Taken at graph commit d0942d57 and implementation commit 87e4b24e, on the seven draft briefs that sitting's readings were handed, the files `tmp/review/draft-*.brief.md` written between 09:53 and 10:11 and measured before the instrument was amended at 10:36: 2,585,266 bytes over seven briefs. Of that, the `## Account` of the node under review is 465,864 bytes, eighteen percent, and on one brief, `alignment-page`, 196,599 of 623,345. Ninety-four neighbour renderings across the seven carry two texts of the same node, a standing answer and a recommended one, 262,496 bytes of the first and 592,021 of the second; one text a node strikes the 262,496. The two parts that carry the governing nodes, the ancestry and the rules of the reading, run between 129,627 and 162,913 bytes a brief and between twenty-three and sixty-three percent of it, in a form that already carries each of those nodes by what it answers. The two clauses together take 728,360 bytes off the seven, twenty-eight percent, before anything else is struck. The pieces are measured the same way: `draft-growth.brief.md` is 2,081 lines and `draft-alignment-page.brief.md` 4,692, so under a bound of three hundred lines they are read in seven pieces and sixteen, while the navigation line of each says to read the brief whole -- the two rules the clause above forbids, in one brief, on the same day. What multiplies with the pieces is not measured here and is arithmetic rather than telemetry: each further page re-sends what the reader has already read.

This answer's later clauses describe an instrument that already runs, which is the same order the `pointers-for-what-grows-with-the-record` option had on the node above. Under the author's words of 2026-09-07 to begin applying the optimizations while progressing them, the working tree at 87e4b24e carries the account clause, the verbatim locus, and the survey's carrying rule; the one-answer-a-node clause, the reading in the fewest pieces, and the rule about mechanical defects are not yet materialized, and this text states them as rules rather than as descriptions.

Traditions, each owed as a reading under this node: the working set and thrashing (Denning, 1968), where a process given fewer frames than its working set spends its time faulting rather than working and the remedy is to allocate by the measured working set rather than uniformly, which is what the dead reader did and what the bound on the brief answers; separate compilation against interfaces, the unit compiled with its dependencies' interfaces and not their bodies, which is the neighbourhood; the diff as the unit of review, the ordinary practice of code review, which the re-reading adopts, and which is a second reading of a tradition the record already holds at `commons.systems/disposition-graph/change-reviewed-as-a-diff`, where the relation belongs and where that node's own answer states the objection this re-reading is the answer to, that a reviewer shown the whole reads the whole unless the projection that derives the edit is in front of it; the inspection rate and the yield of a large change (Fagan, 1976, for the rate; Rigby and Bird, 2013, for the fall in yield as the change grows, Bacchelli and Bird's 2013 study of modern code review being qualitative and not the source of that measure), so the remedy bounds the change and never hurries the reviewer, and this is a second reading of a tradition the record already holds at `commons.systems/disposition-graph/fagan-inspection-roles`, which is where it belongs and where the relation this node adds should be recorded; and satisficing (Simon, 1956), the search that stops at good enough, for the cap on rounds.

What this costs, as a consequence of the design and not a reason for it. A draft's reader no longer holds the record's standing answers, so a contradiction with a distant node is found only if the reader thinks to search for it; what it misses falls to the survey, which holds the whole graph and is the reader of last resort, and this answer therefore leans harder on the survey being run before the author rules. The two-round cap means a finding first raised in the second reading is recorded as an option rather than answered in the text, so the author meets it as a row on a fact rather than as a redrawn draft. And the questions-only index means the reader can see that a question exists without seeing how it was answered, which is enough to propose a merge and not enough to argue one. The four clauses added on 2026-09-07 cost four more things. A neighbour carried by one answer hides from the reader that the node moved and how far, so a draft written against a parent's standing text and contradicting the text that parent now recommends is caught only because the line beside the answer says the other exists; the reader must open the file to see it, and readers open fewer files than they are told to. An account cut to its last section hides the reasons a defect was already answered once, so a reading may raise again what an earlier reading raised and an earlier amendment settled, and the session pays a validation to find that out. A brief read in one call is held by a reader that can hold it, and where the brief has grown past that the failure is a dead reading rather than a slow one, which is the more expensive failure and is why the bound on a piece stays for that case. And a rule that sends a class of defect to the validator means that until the validator holds the check nothing catches it but a reader who is no longer looking for it, so the checks are owed and the debt is this node's to carry until they land.

**AI divergence.** A fourth clause of this answer now cites a child for its content, so a reader of this node alone learns that the object is narrowed and not how, and the child's boldness is high where this node's is moderate; the citation carries the confidence down with it.

Every clause of it narrows what the reviewer is shown, on measurements taken by the party the review exists to check. A reader that must search for what it is no longer given searches for what it thinks to look for, which is the drafter's own frame, and the failure the index guarded against, a contradiction with a node nobody thought to name, is the one failure a search cannot be aimed at. The answer's reply, that the survey holds the whole graph and is the reader of last resort, is good only while the survey runs before every ruling; this design moves that load onto it: at graph commit 1cde11f6 on 2026-09-05, before the first survey ran, forty-eight nodes stood at the review or the ruling stage and none carried a survey pin, and what the survey costs once the load is on it is the question the author raised on 2026-09-07 and `survey-selection` answers beneath this node.

**Content.**

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

By the object each reading is given, and never by a budget or a clock; how a survey's object is selected and divided, so that it is smaller without being narrower, is the `survey-selection` node's, and is cited here and not restated. A reading's cost is set almost entirely by what its brief puts in front of it, so the bound is written into the brief and not into the reader.

**What a draft's reading is given.** Its object is one draft, so its brief carries that node in full and its neighbourhood in full: the ancestry to the root, the rules that bind every session, the nodes it names and the nodes its `depends` names, with the options named in them, the nodes under it, its siblings, and the readings that bear on it. A node a reading is not judging is carried by what it answers and never by its whole file, and it is one rule for every reading, a draft's neighbourhood and the survey's graph alike: its question, one answer, and the names of the options on its answer fact. One answer and never two. Where a ruling reaches the node the answer that stands is carried, since that is what binds; where no ruling reaches it the answer it now recommends is carried, since nothing else on the node is operative; and one line says which was carried, names the other, and gives the file it is in. Carrying both puts one node's argument in front of the reader twice, once as it is and once as it is about to be, and asks a reader whose object is a different node to work out which of the two it is judging against; that is the class's to say and not the reader's to infer. During bootstrap no ruling reaches any node, so a neighbour whose recommendation differs from what stands is carried by the recommended text alone. Its rationale, its facts prose, its option subsections and the rest of its recommendation are its own dialogue, and they stay in the file one read away, exactly as its account does and for the same reason. One exception, and it is the draft's own text and not the neighbour's: where an option on a neighbour's fact names the node under review as its source, that option's prose is carried in full, because it is what the draft put there and the validation that asks whether the draft contradicts the node above it turns on that prose. A reader given only the option's name has been told that the draft wrote something on its parent and not what it wrote. The generator does this as of the reconciliation of 2026-09-05: `renderNeighbourNode` takes the id of the node under review and carries whole any option whose `source` names it. Until that landing the clause was a rule stated and not a rule running, and the reading of 2026-09-05 paid the cost the exception exists to prevent, opening a neighbour's file from disk to check two options this node had sourced there. The node under review is the one node given whole, because it is the only one being judged; and whole is its question, the author's words its options reference, the resolved content of every option on its answer fact, and its facts with every option's accumulated support and divergence, together with the last section of its `## Account` and nothing before it, the manifest lines of what the accumulation folded or absorbed standing in the place of the rest. An account is the dialogue's history and not its text, which is the ground on which a neighbour's account already stays in the file, and it grows with every reading applied while the draft it records does not, so a node read four times pays for four accounts to be judged once. The last section is kept because the previous reading's findings and the session's replies to them are there, and a reader judging what a draft became is judging an answer to those. It carries the rules of the reading itself in the same way, in the brief and not as a list of files to open: what the review is and what it judges, the validations, the two readings and what each is given, and the encoding's own vocabulary, facts, options, rulings, the derived class, and what a node is. A brief that tells its reader to go and read a node it could have carried has the reader read that node twice, once where the brief already quotes it and once from disk, and pays for both. Of every other node in the record it carries the id, the question, and the file the node is in, on one line, and nothing else. The file is not decoration: a question tells the reader that the record asks this somewhere, and the path is what turns the pointer into a read the reader can actually make without a search. The round's other drafts, which the clean-context-review node's recommendation gives this reader so that texts written together are read together, are carried the same way and marked as the round: id, question, and the recommendation each now makes, one line each, since what the reader needs of a sibling draft is that it moved and what it moved to, and the text that moved is one file away. The questions are there because the merge validation asks whether the record already asks this question, and a reader cannot search for a question it cannot phrase; the answers behind those questions are the survey's object, because the whole graph is what the survey reads and not what a draft's reader reads. What lies outside the neighbourhood the reader reaches by searching the graph, which the brief tells it how to do, so the cost of reaching the rest of the record is the cost of what is found and not of what exists. The rule under all of it: a part of the brief that grows with the record rather than with the draft is carried as a list of pointers, and a part that is the draft's own is carried whole.

**What a re-reading is given.** A draft amended in answer to a reading's findings is read again, and the second reading's object is the amendment: the node as it now stands, its difference from the text the last reading pinned, that reading's findings, and the session's reply to each. It answers two questions, whether the amendment answers the finding and whether it introduces anything the reading has not seen, and it is not a fresh reading of the node. A fresh reading is owed only where the answer itself was redrawn, which is what a kickback is. The difference is computable only if the first reading recorded the graph commit of the text it read, beside the pin it already records, and the dialogue node's answer enumerates the review's draft keys as four written together or not at all. This answer needs a fifth, and that is that node's decision and not this one's: it is recorded there as an option, and until it is ruled the re-reading falls back to a full reading of the amended node, which the tool reports when it does it. The commit is the text the reading read and not the text that answers it, so the order is fixed: the reading is applied first, on a clean tree, and the amendment is written after. A session that amends before it applies leaves the tree dirty, no commit is recorded, and the re-reading falls back to the full brief; that is not a loss of correctness but it is a loss of the saving, and it is the one sequencing rule this answer imposes on the session.

**How many readings a draft gets.** Two: the reading, and the re-reading of its amendment. A finding that survives the second is recorded as an option on the fact it bears on, or as a probe where it asks the author what they meant, and it goes to the author with the node. A reader asked for findings will return some, so a loop that runs until a reading is silent ends on the reader's mood; two rounds ends it on the draft. The cap bounds amendment and not redrawing: either reading may still kick the draft back, and a kickback is a new answer, which owes a reading of its own. What the cap forbids is a third reading of the same answer.

**What a brief must fit.** A brief is written to be held whole by the reader it is given to, and it states its own size and the discipline for reading it. A brief the reader cannot hold is a defect of the brief, cured by narrowing the object and never by asking the reader to skim, the object of a survey being narrowed as the `survey-selection` node says: a reading that dies of its own context returns nothing and is paid for twice. A brief that fits is then read in the fewest pieces the reader's tool allows, and in one call where the tool's limit reaches the whole of it. A reader that pages a brief it could have held re-sends everything it has already read with every further page, so the pieces multiply the brief by roughly half their number and buy nothing back; the bound on the size of a piece exists for the brief a reader cannot hold, which is the defect above, and it is not the rule for the ordinary case. The brief's own navigation line and the prompt that launches the reader state one discipline between them, or the reader has been given two rules and will follow whichever it read last.

**What the main thread spends.** That validation is never delegated is the clean-context-review node's rule and is not restated here. What this node adds is where the main thread spends when it validates: at the locus the finding names, and not by re-deriving the neighbourhood the reader was already given. A finding names a file and a line, and the cost of checking it is the cost of that file; a thread that re-reads the brief to check a finding pays the reading a second time and adds nothing, since the reader's context is exactly what it was asked to distrust. So a finding names the file, names the heading it sits under, and quotes the sentence or the clause it bears on exactly as that text stands in the file, never paraphrased, never summarized, and never by a line number: the file and the heading are the address, the quoted bytes are what turn the validation into a search that returns either the text or nothing, and a line number is stale the moment anything above it is edited. A finding whose locus the thread has to reconstruct makes the thread read the node to find what the reader already had in front of it.

**What attention is spent on.** Token efficiency and context management are bounds on what a reading is given; attention is what the reading does with it, and it is not the same quantity. A reader holds its object and cannot hold everything, so what a brief puts in front of it competes for the reading it can actually give, and a brief that fits is not thereby well aimed. The rule is that every part of a brief is there for a validation the reader is asked to run, and a part no validation reaches is struck rather than shortened: the questions are there for the merge validation, the neighbourhood for the contradiction validations, and the round for the merge validation too, since the index prints only the nodes outside the parts above and so leaves the round's questions unprinted; nothing is carried because it might prove useful. Consistency between two nodes of the frontier is the seventh validation and is the survey's, not this reader's, so it prices nothing in a draft's brief. What the round adds beyond a question, the recommendation each draft now makes, is reached by no validation on this reader's list, and whether that list should gain one is the `frontier-consistency` node's, where it is recorded as an option. This is what makes the answer more than a cut. Striking a part is cheaper and better aimed than compressing it, because a compressed part still asks for the reader's attention and no longer repays it. And a defect an instrument can name is the instrument's and never a reading's. A reading is the only reader in this record that can judge whether an answer is right, and it is the most expensive reader the record has; spending it on an option marked passed with no reason recorded, on prose that says an option was passed over where the row carries no status, on a fact whose prose opens straight onto an option subsection with no reason above it, on a pin naming a commit the node has moved past, on a dated passage quoted in a rationale that stands under no `## Disposition`, or on an account section byte-identical to the one above it, spends that attention on what a script decides. Each such finding is paid three times over, in the fix, in the re-reading the amendment owes, and in the main thread's validation. The rule binds the instrument before it binds the reader: every defect of that kind the record has met is a check the validator is owed, and a reading that meets one while the validator still lacks it reports it like any other; which checks are owed before a survey's reader is launched at all, and that a survey is not launched while one of them fires, is the `survey-selection` node's. What the rule forbids is a brief that asks a reader to run a check a script could have refused.

**What is not bounded, and is not waste.** The number of drafts on the frontier and the number of sittings. The review is priced per draft by design, and a backlog costs one reading a draft in it; that is the cost of having the drafts, not the cost of reading them. That the review is priced per draft at all is the `clean-context-review` node's decision and not this one's, and its measured price is recorded on the `decomposition` node: measured at implementation commit 8bb72b17, this sitting's twenty-three draft briefs total 7,926,691 bytes against the 838,923 of the batch brief of 2026-09-03 that the division replaced, and the survey's brief, at 1,083,638, exceeds the batch on its own. What this node bounds is one reading of one draft; the multiplication is the division's, it is on the node that made it, and the author's own words that some of the spend is the acceptable cost of draining a backlog cover the backlog and not the multiplier.
```

#### the-brief-is-bounded-by-what-one-call-holds

A brief's size is bounded by what a single call of the reader's tool holds, the generator states the measure it used, and a brief that exceeds it is narrowed or split before it is emitted rather than handed to a reader who must chunk it. It is on the table because the answer already says a brief the reader cannot hold is a defect cured by narrowing the object, while the survey brief of 2026-09-07 ran to 1,111,970 bytes over 9,277 lines and had to be read in nineteen pieces, so the record's own bound was stated and then not applied by the instrument that owns it.

#### no-brief-grows-with-the-record

No reading's brief grows with the size of the record: what a reading is given is bounded by its object and that object's partners, a brief that is the record's size is a one-time backfill run on the author's word, and an instrument whose brief is found growing with the record is a defect repaired before it runs again.

**AI support.** The author's words of 2026-09-07 give the bound in terms (words/2026-09-07/23): no process can grow in complexity or context size with the size of the graph unbounded, and a one-time backfill that makes future processes bounded is done at once. The answer as it stood bounded a brief by its object and said a brief the reader cannot hold is a defect of the brief; it did not say what the object's size may vary with, and the survey brief of 2026-09-07, 1,348,406 bytes at graph commit 31e257b9 with its neighbourhood rendered, was within the answer as written while growing with every node the record gained, as the `survey-selection` node's account measures. The bound is placed on this node because this node owns what a reading is given, for the draft's reading and the survey's alike; `survey-selection` applies it to the survey and carries the mechanics.

**AI divergence.** The bound is stated on every reading and every instrument, and the draft's reading already meets it by construction, since its brief carries one node whole and the record as one line each; what the clause adds there is the rule that a reading found growing is repaired before it runs again, which stops a reading rather than letting it run over, and a reading stopped is a sitting delayed. The one-time backfill is priced at the record's size on the day it runs, and the clause allows it on the author's word alone, so nothing in the record bounds how large a backfill may be beyond the author's willingness to pay for it.

**Content.**

From: the-surveys-selection-moves-to-its-own-node

```diff
@@ -18,3 +18,3 @@
 
-**What a brief must fit.** A brief is written to be held whole by the reader it is given to, and it states its own size and the discipline for reading it. A brief the reader cannot hold is a defect of the brief, cured by narrowing the object and never by asking the reader to skim, the object of a survey being narrowed as the `survey-selection` node says: a reading that dies of its own context returns nothing and is paid for twice. A brief that fits is then read in the fewest pieces the reader's tool allows, and in one call where the tool's limit reaches the whole of it. A reader that pages a brief it could have held re-sends everything it has already read with every further page, so the pieces multiply the brief by roughly half their number and buy nothing back; the bound on the size of a piece exists for the brief a reader cannot hold, which is the defect above, and it is not the rule for the ordinary case. The brief's own navigation line and the prompt that launches the reader state one discipline between them, or the reader has been given two rules and will follow whichever it read last.
+**What a brief must fit.** A brief is written to be held whole by the reader it is given to, and it states its own size and the discipline for reading it. A brief the reader cannot hold is a defect of the brief, cured by narrowing the object and never by asking the reader to skim, the object of a survey being narrowed as the `survey-selection` node says: a reading that dies of its own context returns nothing and is paid for twice. A brief that fits is then read in the fewest pieces the reader's tool allows, and in one call where the tool's limit reaches the whole of it. A reader that pages a brief it could have held re-sends everything it has already read with every further page, so the pieces multiply the brief by roughly half their number and buy nothing back; the bound on the size of a piece exists for the brief a reader cannot hold, which is the defect above, and it is not the rule for the ordinary case. The brief's own navigation line and the prompt that launches the reader state one discipline between them, or the reader has been given two rules and will follow whichever it read last. And no brief grows with the record. What a reading is given is bounded by its object and that object's partners, the neighbourhood by what it answers and everything else on one line, so that the record grows without bound while what any one reading holds does not; a brief that is the record's size is a backfill, run once on the author's word so that the pins a delta freezes against exist, and an instrument whose brief is found growing with the record is a defect of the instrument, repaired before it runs again and never a cost the record carries. That is the author's bound, given in their words of 2026-09-07, and it binds every reading and every instrument of this record, the survey's selection as the `survey-selection` node applies it and the draft's reading as this node does.
 
```

#### reader-is-the-parser-and-reviewer-is-the-reading

Reader names the graph's parser and nothing else; the clean-context agent is the reviewer, its act the reading; on the table because author-questions records the collision and leaves it to the survey, and this node uses reader in the second sense throughout.

### authority

Ratified. What this decides is how much of the record the adversarial reader is shown, and the party it is shown against is the party that would otherwise set it: a rule that lets the drafter narrow the review's object is capture-shaped in the way the `class-recommendation` node's escalation test names, and being wrong here is not visible in the record, since a review that reads too little returns fewer findings and looks cheaper and no worse. Moderate boldness: the escalation is the test the `class-recommendation` node states, and what rests on the AI is the judgment that the author's delegation of right-sizing does not reach the reviewer's object, which the case against disputes.

## Account


Queued as a node of its own on 2026-09-05, at the checkpoint, before anything was drafted from the author's words. The disposition is the author's and the grant is theirs; what the node answers is not yet drafted.

What the sitting would amend: the clean-context-review node, whose answer says what a reading reads and when it runs and says nothing about what that costs or what bounds it; the review-model node, where the author's second sentence bears and where an option is recorded for it at this landing; the frontier-consistency node, which owns the survey's object; the decomposition node, whose cost paragraph states the per-draft brief's index as the cost driver and names the index as the lever against it; and the review-skills node, whose two skills and one package materialize whatever this answers.

The periagogic object: the briefs this sitting generated and their sizes, the readings' own token counts as the harness reported them, the three readers that died, and the findings the readings actually returned, read against what each reading had to read to return them.

### Manifest

- Folded: Drafted, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Read adversarially on the main thread, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Reconciled and re-measured, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The reconciliation landed, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The applying of that reading, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: A defect in the cap's own instrument, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the second reading, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The escalation test's citation corrected, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The disclosure discharged, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The cycle the cap does not reach, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The deadlock measured on the whole frontier, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier survey, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Two clauses of this answer materialized, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The delta brief was unreachable, and why, 2026-09-06, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The four cost clauses of 2026-09-07, and where the cost had moved to, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of b9e1b4e5, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier survey, 2026-09-07, of b9e1b4e5, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the frontier survey, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of 0afcc1f1, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Repaired after the re-reading, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of 0afcc1f1 (ii), at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Option adopted, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-07, of f32d7226

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `the-surveys-selection-moves-to-its-own-node`.

Findings:


On the facts and what they recommend: The diff moves the answer fact's `recommends` from `one-answer-a-node-and-one-read` to a newly added option, `the-surveys-selection-moves-to-its-own-node` (still moderate boldness), adding that option to the frontmatter list, adding a matching prose subsection ('AI support' / 'AI divergence'), and a lead paragraph in the fact prose explaining the move; it rewrites the answer fact's `against` clause and the parallel account sentence to cite `survey-selection` in place of the previously non-existent `survey-cost`, adds a `depends` entry on `survey-selection#candidate-pairs-with-their-nominating-key`, and updates the review block's `commit`/`against` to record the last reading's own kickback verdict. The authority fact, its recommendation, and boldness are untouched. The `## Recommendation` fence and rationale gain three citations to `survey-selection` (for object-selection/gating and for the mechanical-defect check) without otherwise changing text the last reading already read; the `## Rationale` prose about the pre-survey node count at graph commit 1cde11f6 is unchanged by this diff and was already corrected in an earlier round, before the pinned commit.

On the viability of the options: Every option present at the last reading's pin remains on the answer and authority facts unchanged; the diff only adds one new viable option (`the-surveys-selection-moves-to-its-own-node`, sourced to the newly cited `survey-selection` node, recommended) and removes none, so no prior option's viability is disturbed.

Strongest counter-argument (weak): The last reading's finding was that the node made a false present-tense claim citing a node, `survey-cost`, that did not exist. The amendment's fix is to rename the citation to `survey-selection` and assert in its own account that this is 'the child minted this sitting' -- but this delta reading is barred from checking the neighbourhood or the disk, so the only evidence that `survey-selection` actually exists, rather than being a second not-yet-minted placeholder under a new name, is the record's own narration by the party the finding was raised against. Against that: the citation is corroborated from three independent loci (the fact's `against` clause, the new option's `source` field, and a `depends` entry naming a specific option slug on it), which is stronger internal evidence than a bare rename would leave, and the scope of this reading explicitly defers cross-node verification to the survey rather than asking the delta reader to open other files.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/review-cost stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Recommendation` fence became the content of `the-surveys-selection-moves-to-its-own-node`; 14 `## Disposition` entries became the ledger entries words/2026-09-05/4, words/2026-09-07/5, words/2026-09-07/6, words/2026-09-07/7, words/2026-09-07/8, words/2026-09-07/16, words/2026-09-07/9, words/2026-09-07/11, words/2026-09-07/12, words/2026-09-07/13, words/2026-09-07/2, words/2026-09-07/3, words/2026-09-07/4, words/2026-09-07/15, referenced by 0 options the entry's own date names and by the recommended option for 14 the date named none. The content of `neighbourhood-questions-and-delta (at 6a84b48e)`, `one-answer-a-node-and-one-read (at c55c9ebb)` was recovered from the commit at which the answer fact recommended it. The record wrote no text of its own for `one-reading-per-draft`, `neighbours-carried-whole`, `answers-only-index`, `full-index-per-draft`, `no-index-at-all`, `full-re-read-on-every-move`, `unbounded-rounds`, `budget-per-sitting`, `neighbourhood-cited-not-restated`, `pin-names-the-text-the-reader-read`, `brief-carries-the-recount-command`, `rules-of-the-reading-named-as-files`, `a-cap-on-redraws-per-node-per-sitting`, `a-waves-brief-is-one-brief`, `the-surveys-unreached-node-is-one-line`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `f32d722609f7815130f2b7de88fd0647d809edca` is re-computed for the encoding as `388a136d38ca73f6e73c1f4030df0be4de25665a`; nothing it read changed. The survey's pin `b9e1b4e5b54bd35bfd1a6bc94aeaab7bfc8b9c32` was already past the recommendation and is left as it stood.

### Frontier survey, 2026-09-07, of 388a136d

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- Contradiction (7) between this answer and the brief generated under it. The answer holds that "A brief the reader cannot hold is a defect of the brief, cured by narrowing the object and never by asking the reader to skim", and that a brief that fits "is then read in the fewest pieces the reader's tool allows, and in one call where the tool's limit reaches the whole of it". The survey brief of 2026-09-07 is 9,277 lines and 1,111,970 bytes, roughly ten times the reading tool's per-call cap, so the fewest pieces its reader's tool allows is nineteen. The clause is stated as satisfied by the design and is falsified by the first artifact the design produced.

Strongest counter-argument (strong): Every clause of this answer narrows what the reviewer is shown, and it is the reviewed party that took the measurements the narrowing rests on; the node's own `against` says so. The narrowing is also being ruled before the thing it bounds is known: the recommendation moves the survey's selection to a node whose recommendation is high-boldness and unbuilt, so the author confirms a cost rule for an object still being drafted. The cost the author actually objected to on 2026-09-07 was the survey's, and moving the survey's sizing out of this node is what leaves that objection unanswered here.

The session's reply: The bound was falsified by the first brief the design produced, and the reply is not to soften it. The brief of 2026-09-07 was 2.2 MB at the survey's launch commit's first render and 1.11 MB after two compactions the same day; the option recorded on survey-selection the same day cuts about 250 KB more, and the sizing is being taken in the terms the finding asks for, what one call of the reader's tool holds. The finding's option on this node, that the brief is bounded by what one call holds and the generator refuses or splits one that exceeds it, is recorded, and the measure it names goes on the record when the generator holds it.

### A survey finding the apply discarded, 2026-09-07

The survey of 2026-09-07 returned a cross-node finding that names this node
and `survey-selection`, and `survey-selection` moved after the survey read it,
its recommendation having been recorded anew at f57877f9 on the author's words
of 2026-09-07, so the apply discarded the finding whole and wrote nothing on
any node it names. It was validated at its loci on the main thread and is not
withdrawn. The option `the-brief-is-bounded-by-what-one-call-holds` it proposes on this node is added to the answer fact by
hand, which is an act the AI has on any fact and which settles nothing. The stage
the finding named, maieutic, is set by hand, since the record requires every
answer option of a node at the ruling stage to carry its content and the
option carries its sentence only; no survey pin is written by hand.

The `contradiction` finding on the brief's size against `review-cost`'s bound, as the survey wrote it: The bound `review-cost` states on a brief is contradicted by the brief the same family of nodes produced. Its answer holds that "A brief the reader cannot hold is a defect of the brief, cured by narrowing the object and never by asking the reader to skim" and that a brief that fits "is then read in the fewest pieces the reader's tool allows, and in one call where the tool's limit reaches the whole of it". The survey brief of 2026-09-07 is 9,277 lines and 1,111,970 bytes, roughly ten times a single call's cap, so the fewest pieces its reader's tool allows is nineteen, and the brief itself reports the selection that produced it as unnarrowed: "This survey is whole.", "4677 candidate pair(s), all live, 0 frozen". Either the bound is not a bound, or the object was not narrowed and the defect is the brief's.

Its proposal: The survivor is the bound, made operative rather than aspirational: `review-cost` states the brief's size in what the reader's tool holds, and the generator refuses or splits a brief that exceeds it rather than emitting it, so that the clause about the fewest pieces describes an artifact that can satisfy it. `survey-selection` is where the narrowing happens and takes the number; `clean-context-review` and `review-skills` are named because the two readings and their generator are what the bound binds.

### The author's bound on what a brief grows with, 2026-09-07, at 11191654

The author, asked on `survey-selection` whether the survey brief grows with the graph or with the unconfirmed frontier, bound the record (words/2026-09-07/22, words/2026-09-07/23): a megabyte is a backfill's size and not a recurring one, no process may grow with the graph's size unbounded, and a one-time backfill that makes future processes bounded is done now under the bootstrap reconciliation authority granted for this sitting. The option `no-brief-grows-with-the-record` is recorded on those words and recommended, as a named change to `the-surveys-selection-moves-to-its-own-node` adding the bound to "**What a brief must fit.**", and the stage stays maieutic, since the review's option `the-brief-is-bounded-by-what-one-call-holds` carries its sentence only and the record requires every answer option of a node past that stage to carry its content; the amendment owes a re-reading whose object is the amendment, and it is launched from this stage. The mechanics that make the survey bounded are recommended on `survey-selection` and not here.

### Clean-context re-reading, 2026-09-07, of bb2eb39a

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `no-brief-grows-with-the-record`.

Findings:


On the facts and what they recommend: Since the pinned reading of f32d7226 (recomputed as 388a136d), the answer fact's `recommends` moved again, from `the-surveys-selection-moves-to-its-own-node` to a further named change on top of it, `no-brief-grows-with-the-record` (still moderate boldness), sourced to the author's words/2026-09-07/22 and /23 on `survey-selection` and adding the clause that no reading's brief may grow with the record's size. A third option, `the-brief-is-bounded-by-what-one-call-holds`, was added by hand from a survey finding the apply step otherwise discarded (its object, `survey-selection`, had moved after the survey read it); it carries only a short paragraph and not the full projected-answer content the encoding requires past the maieutic stage, which is why the node's `stage` is honestly held at `maieutic` rather than advanced to `review`, and why this re-reading was launched from that stage. The authority fact, its recommendation (`ratified`) and its boldness (moderate) are untouched, and no `stands` is set on either fact.

On the viability of the options: Every option present at the last reading's pin (including `the-surveys-selection-moves-to-its-own-node`) remains on the answer fact unchanged and viable; the two new options are additions, not replacements, and neither disturbs a prior option's status. Verified on disk that `commons.systems/disposition-graph/survey-selection` is a substantive node in its own right (its own facts, an extensive option list, multiple readings and an account), not a placeholder, and that the `depends` anchor `survey-selection#candidate-pairs-with-their-nominating-key` this node cites still exists as a named option there even though survey-selection's own recommendation has since moved past it.

Strongest counter-argument (weak): The previous reading forwarded the node while flagging, at weak strength, that it could not itself verify `survey-selection` existed and was deferring that check to the survey; this re-reading closed that gap by checking the disk directly rather than relying further on the record's own narration. The residual concern is procedural rather than substantive: a second unratified recommendation move has now landed on top of the first before the author has ruled on either, and one of the three live options still carries only a sentence rather than full content, which is exactly why the node cannot yet reach the review stage. The record discloses this itself in the same account section rather than presenting the node as more finished than it is, which is the reason this is a residual doubt and not a defect.

The session's reply: Accepted. The reading forwards with no finding; the residual doubt it records, that the review's option `the-brief-is-bounded-by-what-one-call-holds` carries its sentence only, is the reason the stage stays maieutic, as the account says, and that option is on the table for the author and not adopted by this amendment. The node's ruling waits on the survey the fact's movement owes, which the backfill survey of this sitting is.

### Frontier survey, 2026-09-07, of bb2eb39a

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- Answer, 'What attention is': 'A reading is the only reader in this record that can judge whether an answer is right, and it is the most expensive reader the record has' uses reader for the clean-context subagent, while author-questions says 'where this node says reader without qualification it means the parser' and viable-options has 'the reader parses an option\'s `#### ` subsection and no content within it'; the two senses collide on the judged node, which author-questions 'leaves to the survey' (frontier: vocabulary).
- Answer, 'What a brief must fit': 'And no brief grows with the record.' does not say which brief. The survey brief this reading was given carries 86 nodes, 62 by what they answer, and 2909 candidate pairs, and survey-selection says of the whole reading 'it runs on the author\'s word'; a whole reading grows with the record by construction, so the sentence holds of the draft brief and of the selected survey only, and should name them.
- Options: `the-surveys-unreached-node-is-one-line` restates a rule frontier-consistency's account already calls misplaced: '`review-cost` carries the same rule as the option `the-surveys-unreached-node-is-one-line`, sourced to this node so that the author rules the placement once, and a rule drafted twice in one day on two nodes is evidence that the seam is in the wrong place'; survey-selection now states the rule ('a node the judged set reaches but whose read text has not changed since a survey read it, judged or reached, is carried on one line rather than by what it answers'), so the option here is a third statement (frontier: redundancy).

Strongest counter-argument (moderate): The answer bounds what a reading is given by its object and its neighbourhood, but the reading that catches what nobody thought to name is the one that holds the whole graph, and the answer concedes it ('the survey holds the whole graph and is the reader of last resort'). Bounding every brief by construction then makes the survey the only unbounded reading, and survey-selection has since made the whole survey a backfill that runs on the author's word alone. Between them, no reading that holds the whole record runs on any schedule, so the failure the against names, a defect the drafter's frame never puts in front of a reader, is caught only when the author asks for it; the answer should say that this is the price it accepts rather than leave it to survey-selection to state.

The session's reply: Validated on the main thread at graph edc5af91: every quoted locus found verbatim in the node or in the brief's own rendering; each offending sentence checked against the node's recommended content resolved from its option ladder, not only its standing text. f0 (reader in two senses) stands: the recommended content says 'most expensive reader' of the clean-context agent while author-questions reserves reader for the parser; the option reader-is-the-parser-and-reviewer-is-the-reading is recorded. f1 rejected: the sentence it quotes is followed in the same paragraph by 'a brief that is the record's size is a backfill, run once on the author's word', which names the one brief the bound excepts. f2 stands: the-surveys-unreached-node-is-one-line is a third statement of survey-selection's rule; it is passed over by the session with survey-selection as the reason (frontier finding 5). The counter-argument is recorded: the answer accepts that no whole reading runs on a schedule, and the session holds that the price is the author's to confirm on survey-selection, where the-whole-reading-is-a-backfill-and-the-delta-is-the-norm states it.

### Frontier finding, 2026-09-07

Kind: redundancy.

The one-line carriage of an unreached or unchanged node is stated on four nodes. survey-selection: 'a node the judged set reaches but whose read text has not changed since a survey read it, judged or reached, is carried on one line rather than by what it answers'. frontier-consistency: 'a node whose text stands as an earlier survey read it is carried on one line, and a node minted or amended since is carried by what it answers until a survey has read it again', while its Facts 'recommends the-judged-set-and-its-comparisons-move-to-survey-selection'. clean-context-review's recommended answer: 'of a node no judged node reaches, what the frontier-consistency node\'s condition on its text gives, its question alone on one line'. review-cost: option `the-surveys-unreached-node-is-one-line`, of which frontier-consistency's account says 'a rule drafted twice in one day on two nodes is evidence that the seam is in the wrong place'.

Also named: commons.systems/disposition-graph/survey-selection, commons.systems/disposition-graph/frontier-consistency, commons.systems/disposition-graph/clean-context-review.

Proposed: survey-selection survives as the rule's home. frontier-consistency's paragraph goes with its recommended move; clean-context-review cites survey-selection instead of frontier-consistency, its option `the-unreached-line-is-conditioned-by-frontier-consistency` being passed over; review-cost's `the-surveys-unreached-node-is-one-line` is passed over with survey-selection as the reason.

Recorded as an option on commons.systems/disposition-graph/clean-context-review's answer fact: `the-unreached-line-is-cited-from-survey-selection` (source review, 2026-09-07).

### Frontier finding, 2026-09-07

Kind: vocabulary.

author-questions' answer: 'The two senses of reader collide here and the record carries both, the parser of the graph and the clean-context reading\'s subagent, which is a vocabulary finding this answer records rather than settles and leaves to the survey; where this node says reader without qualification it means the parser.' The parser sense: viable-options 'the reader parses an option\'s `#### ` subsection and no content within it'; what-an-option-row-carries 'which the reader of the graph enforces'. The agent sense: review-cost 'A reading is the only reader in this record that can judge whether an answer is right, and it is the most expensive reader the record has'; what-an-option-row-carries 'Where no reader\'s line bears on a fact the row carries, in the line\'s place, one'. recording already has the third term: 'The reviewer recommends and never writes'.

Also named: commons.systems/disposition-graph/author-questions, commons.systems/disposition-graph/recording, commons.systems/disposition-graph/viable-options, commons.systems/disposition-graph/what-an-option-row-carries, commons.systems/disposition-graph/clean-context-review.

Proposed: recording's term survives for the agent: reviewer, or the reading where the act is meant; reader is kept for the parser, which is what read.mjs is. review-cost, what-an-option-row-carries and clean-context-review substitute; author-questions strikes the sentence that leaves the finding to the survey.

Recorded as an option on this node's answer fact: `reader-is-the-parser-and-reviewer-is-the-reading` (source review, 2026-09-07).
