---
question: How is the unanswered frontier kept consistent with itself?
stage: review
review:
  verdict: forward
  strength: moderate
  date: 2026-09-05
  of: 63bd9090654f8debaf85d9bcaa550843da53742c
  against: "The split answers only half of the counter-argument the record accepted on 2026-09-03: the survey still reads the whole graph on every invocation and is incremental only in what it judges, with no floor on what a finding is worth, so its cost and its noise still grow with the frontier. It also restates the partition in two nodes (this fence and clean-context-review's) and two brief templates, and the partition has already drifted within a day, the survey running a sixteenth validation this list does not name; a ratified numbered list becomes the thing the instrument drifts from, which is the update anomaly the node's own validations 9 and 12 exist to catch. And the merge validation now runs at three moments on three objects, in periagoge, in the draft review, and in the survey, with no rule for which finding wins when they disagree, so one node can be proposed a merge three times by three readers before the author sees it. The reply is that the division is by what a reader must hold in view, which no single context serves, and that the drift is a cross-reference finding the survey itself raises, but the draft would be stronger stating the partition once and naming the reader of last resort for validation 15."
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-03"
      - name: split-survey-from-per-draft
        source: review
        ref: "2026-09-03"
      - name: per-node-review-without-a-survey
        source: ai
        ref: "cbabf108"
        status: passed
        reason: "it sees only the drafts named for it and never the frontier's drift"
      - name: validator-rule-for-consistency
        source: ai
        ref: "cbabf108"
        status: passed
        reason: "a validator holds ids, edges, ranks and shapes, and whether two answers disagree is judgment"
      - name: probe-is-not-a-mintable-question
        source: commons.systems/disposition-graph/author-questions
        ref: "2026-09-04"
      - name: survey-at-reconciliation-time
        source: ai
        ref: "cbabf108"
        status: passed
        reason: "it is too late, the implementation being built by then on inconsistent drafts"
      - name: sixteenth-validation-independence
        source: commons.systems/disposition-graph/probe-or-node
        ref: "2026-09-04"
      - name: new-question-or-new-answer
        source: author
        ref: "2026-09-03"
      - name: cite-run-mechanics
        source: ai
        ref: "2026-09-03"
      - name: placement-feeds-the-order
        source: author
        ref: "2026-09-03"
      - name: proposal-as-a-state-of-a-ratified-node
        source: commons.systems/disposition-graph/authority
        ref: "2026-09-05"

    recommends: split-survey-from-per-draft
    boldness: moderate
    against: "The split answers half of the counter-argument of 2026-09-03: the survey still reads the whole graph on every invocation and is incremental only in what it judges, so its cost and its noise grow with the frontier; the partition is stated in this fence and in the clean-context-review node's, and the merge validation runs at three moments on three objects."
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
    against: "Deferred would let the validations act while the node stays in view, and this node is unanswered under an unanswered ancestor whose own division of the readings is still at review."
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
defines:
  - frontier survey
depends:
  - commons.systems/disposition-graph/clean-context-review#per-draft-and-survey
  - commons.systems/disposition-graph/alignment-order#settle-counts-nodes-only
  - commons.systems/disposition-graph/decomposition#seams-and-split-review
---
## Disposition

The author, 2026-09-03:
> new disposition (alignment shim): there is a flaw in the harness disposition that makes the unanswered question frontier (the entire graph right now) prone to drift. As the unanswered frontier grows we expect it to maintain consistency with the answered-with-authority graph, but there is no recorded disposition for the harness to enforce self consistency of the unanswered frontier. Inconsistency with the answered-with-authority graph is expected to be surfaced by periogoge (recorded disposition). Inconcistency with the unanswered frontier must be surfaced by the adversarial alignment review skill. Propose a full list of validations which must be encoded into the adversarial alignment review skill - it must include a survey of the full unanswered frontier to identify inconcistencies and redundancies (unanswered dispositions that should be merged, or decomposed in a better way). This implies serialization of the batch operation - but that is low priority, it can be serialized manually for now. This superceded existing unanswered dispositions about the adversarial review skill (case in point). EVERY invocation of the adversarial alignment review skill is a batch operation that evaluates the full unanswered frontier (without isolating any context by disposition).

The author, 2026-09-03, refining:
> refinement to disposition: When adversarial review identifies conflict the result is the same kickback flow described previously. Recommend kick back to earlier alignment dialogue phase with context and/or edits.

The author, 2026-09-03, on the batch:
> serialize the review skill after completion of any currently running adversarial review skill in this session

The author, 2026-09-03, on the sitting of dialogue, the part that answers this question:
> One of the analyses performed by periagoge and adversarial alignment review is whether disposition is a new question or a new answer for a disposition (answered or unanswered).

The author, 2026-09-03, during the reconciliation under the bootstrap grant on the dialogue node:
> disposition (if not already recorded as unanswered): adversarial alignment review validation includes a check for opportunites to merge unanswered nodes as alternate answers to the same question. Adversarial review evaluates batch of nodes which are at the review dialogue phase against the full graph.
>
> you have bootstrap authority to reconcile the adversarial alignment review skill in additino to the alignment skill and other bootstrap grants already provided.

The author, 2026-09-04, on the decomposition node, whose recommendation stands under this node's option `split-survey-from-per-draft`:
> go, and bootrap authority granted

## Answer

By the adversarial review, which at every invocation takes the batch of nodes at the review stage and evaluates it against the full graph, answered and unanswered at every stage, in one context, and runs the validations below. Inconsistency between a draft and the answered graph is surfaced to the author by the periagogic stage, where the dialogue turns the author toward the doctrine the draft would join; inconsistency within the frontier has no author to meet it, and the review is where it is surfaced. The validations, each producing findings that name the nodes and the sentences:

On each node of the batch, the draft being the text its recommendation adopts, the node as it stands or the alternative it names:

1. Question and words. The draft answers the node's question and nothing else, and the author's words on the node are answered by it: no drift between what the author said and what the draft says.
2. Doctrine. The draft contradicts no answered node in its ancestry or among the nodes it cites; what would contradict doctrine is never adopted by a recommendation; it is recorded as an alternative on the node it conflicts with, a proposal under the authority node when it arose outside alignment, and the review says which.
3. Facts. The recommendation's class and boldness are right, it adopts a listed alternative or the node as it stands, its pin names the standing text as it is, so that a recommendation drafted against text since amended is caught, its persistence follows from the node's shape, and every claim about the record or the implementation is verified: a file named exists, a command cited runs, a date and a quotation are exact.
4. Readings. A tradition cited is represented accurately within its recorded support scope, and a divergence from it is recorded as the author's.
5. Shims. Each declared shim names an artifact that exists and a liquidation condition, and nothing the draft presumes materialized is unmaterialized without saying so.
6. Counter-argument. The strongest case against the draft, with its strength.

Across the graph, each node of the batch against every other node, answered or unanswered, at whatever stage, and a finding naming whichever nodes it concerns:

7. Contradiction. Two frontier nodes whose answers, drafts, or author's words touch the same matter and disagree.
8. Supersession. The author's words on one node superseded by later words on another while the earlier node still answers the superseded words; the occasion of this node.
9. Redundancy. Two nodes answering the same question, defining the same term, or restating each other; a merge is proposed naming the survivor and what moves.
10. Decomposition. A node answering more than one question or carrying what another node owns, or a node that is a fragment of its parent; a split or a fold is proposed.
11. Vocabulary. Every term used with one meaning across the frontier, each definition made once, and no term used by a node that has no path to the node defining it.
12. Cross-reference. Every prose reference to another node points at a node that still says what is attributed to it; a reference stale since an amendment is the drift this review exists to catch.
13. Placement and order. The `under` and `order` fields agree with the answers' dependencies: a draft that presupposes another node's answer is under it or after it, and no node at the ruling stage rests on ground still at the periagogic or maieutic stage without saying so. The review recommends the order in which the author rules.
14. Coverage. Each part of every disposition the author has given in the record is answered by exactly one node: none unanswered, none answered twice; a quotation may be carried on a child as the ground of the part it answers.
15. Merge. The opportunities to merge unanswered nodes as alternate answers to the same question, the check the author's words of 2026-09-03 quoted above add: each disposition the author has given, and each unanswered node and each alternative pending on one, is a new question or a new answer to a question the record already asks, answered or unanswered; a new answer standing as its own node is proposed for the node whose question it answers, as an alternative with its source, and a new question carried on another node's dialogue is proposed a node of its own.

The result is applied as the kickback flow the recording and clean-context-review nodes describe, and nothing else: each node with a recommendation is forwarded to the ruling stage or kicked back, and a frontier finding kicks back each node it names whose text must change to the earliest stage the finding touches, the periagogic stage when the ground or the author's words are in question, the maieutic when the answer must be redrafted, with the finding as context and, where the reviewer can give it, the edit or the proposed merge or split. The merge or split itself is an alternative recorded on the node it would change, which the author rules on; the review does neither. One review runs at a time over the frontier: an invocation waits for any review already running, by the invoking session's discipline until a lock is materialized, which the author set at low priority.

## Rationale

The author, 2026-09-03: "there is a flaw in the harness disposition that makes the unanswered question frontier (the entire graph right now) prone to drift. As the unanswered frontier grows we expect it to maintain consistency with the answered-with-authority graph, but there is no recorded disposition for the harness to enforce self consistency of the unanswered frontier. Inconsistency with the answered-with-authority graph is expected to be surfaced by periogoge (recorded disposition). Inconcistency with the unanswered frontier must be surfaced by the adversarial alignment review skill. Propose a full list of validations which must be encoded into the adversarial alignment review skill - it must include a survey of the full unanswered frontier to identify inconcistencies and redundancies (unanswered dispositions that should be merged, or decomposed in a better way). This implies serialization of the batch operation - but that is low priority, it can be serialized manually for now. This superceded existing unanswered dispositions about the adversarial review skill (case in point). EVERY invocation of the adversarial alignment review skill is a batch operation that evaluates the full unanswered frontier (without isolating any context by disposition)." And, refining: "When adversarial review identifies conflict the result is the same kickback flow described previously. Recommend kick back to earlier alignment dialogue phase with context and/or edits." And: "serialize the review skill after completion of any currently running adversarial review skill in this session."

Drift between unanswered nodes is invisible to any reading of one node: the second reading of the clean-context-review node had already found that the contradictions a round creates are between texts written together, and the author's disposition carries that to its end, since the frontier is the round while nothing is ratified. The list divides by what the reviewer must hold in view: the first six validations are the review of a draft as the recording node describes it, and need the draft and its ancestry; the last eight need the whole frontier at once, and are the survey the author asked for. Contradiction, supersession, redundancy, and decomposition are the four shapes of drift a growing frontier takes; vocabulary, cross-reference, and placement are where drift leaves a trace a reader can check; coverage closes the loop from the author's words back to the nodes. The kickback flow is the author's refinement: a finding across nodes is a finding on each, and each returns to the stage where it is repaired, so that the frontier is repaired by the dialogue and not by the review. Serialization follows from the scope: two reviews of the same frontier at once would each forward what the other kicks back.

The merge validation and the batch scope were added on 2026-09-03 under the author's bootstrap grant, quoted above, when the frontier was re-encoded with the merge analysis the author's words ask for: the batch is the nodes at the review stage, the context is the full graph, and the author's earlier words that every invocation evaluates the full unanswered frontier are kept as the context read and narrowed as to what is judged. Kept from the previous answer: the clean context, a fresh subagent that is never a fork, since the review must be independent of the sitting's framing even while it reads everything the sitting wrote.

## Facts

### answer

The recommendation moves from the standing text to `split-survey-from-per-draft` on the author's "go" of 2026-09-04 on the decomposition node, which stands under this option: the fifteen validations divide between the two readers the clean-context-review node's `per-draft-and-survey` names, and the run mechanics are cited there rather than restated. Boldness moderate: the requirement and the survey are the author's, the division and the readers' contexts are the AI's. Five options the recommended text carries stay listed as adopted, so that no candidate leaves the list and the author can rule for any on its own: `new-question-or-new-answer`, the author's, `cite-run-mechanics`, and `placement-feeds-the-order`, the author's, adopted on 2026-09-04; and `probe-is-not-a-mintable-question` and `sixteenth-validation-independence`, adopted on 2026-09-05 after the reading of that day. The case against the recommendation is that the split answers half of the counter-argument of 2026-09-03: the survey still reads the whole graph on every invocation and is incremental only in what it judges, so its cost and its noise grow with the frontier; the partition is stated here and in the clean-context-review node's fence; and the merge validation runs at three moments on three objects, which the fence meets by naming the survey the reader of last resort.

#### split-survey-from-per-draft

The answer the fence holds. The review of a draft runs validations one to six and the fifteenth on one node when its recommendation is recorded, against the draft's neighbourhood and the index of every question the record asks; the survey runs seven to fifteen over the whole graph, judging the nodes whose recommendation changed since its pin, before the author rules; the periagogic stage asks the merge analysis first, as the author's words of 2026-09-03 on the dialogue node say; a tangle or a divergence the survey finds is recorded as the alignment-order node says and the ruling order is derived from it; and how each reading is run, what its reader is given, and how the survey is pinned and serialized are the clean-context-review node's. First raised by the review's counter-argument of 2026-09-03, that the batch paid twice for the per-draft pass; taken up by the decomposition node from the author's words of 2026-09-04.

#### per-node-review-without-a-survey

Every node is reviewed in a context of its own and no survey runs, which was
the clean-context-review node's answer on the morning of 2026-09-03. It was
passed over because such a reading sees only what it is handed and never the
frontier's drift.

#### validator-rule-for-consistency

The frontier's self-consistency is enforced by a validator rule rather than by
a review. It was passed over because a validator holds ids, edges, ranks and
shapes, and whether two answers disagree is judgment.

#### probe-is-not-a-mintable-question

Adopted into `split-survey-from-per-draft` on 2026-09-05: the fifteenth validation carries the clause. Everything the recommendation says, with one clause added to the fifteenth validation: a probe is not a question of the kind that is proposed a node of its own, and a question carried on another node's dialogue whose answer would itself stand as an answer to a question of the record still is. Read with `probe` defined on `commons.systems/disposition-graph/author-questions`, the validation already excludes a probe, because the question it means is one the record would answer with a disposition and a probe's answer is a fact about what the author meant; but a reader should not have to draw that unaided, and every use of the `probes` field is otherwise a survey finding against itself. The clause is the admission test's third limb read from the survey's side, and it keeps the finding of 2026-09-03 in force for everything disposition-shaped rather than overturning it. Raised by the `author-questions` sitting of 2026-09-04, whose answer requires the amendment by name.

#### survey-at-reconciliation-time

The survey of the frontier runs at reconciliation rather than before the
author rules. It was passed over because it is too late: the implementation is
by then being built on inconsistent drafts.

#### sixteenth-validation-independence

Adopted into `split-survey-from-per-draft` on 2026-09-05: the survey's list names the sixteenth. The survey runs a sixteenth validation beside the fifteen this answer enumerates: the independence test of the probe-or-node node, under which a node standing under an unanswered parent, whose only possible answer is a reading of the parent's, whose facts would repeat the parent's, and which would be pruned the moment the parent's recommendation moved, is reported as a probe on the parent, as a finding carrying the probe it would become, readings exempt. The survey brief runs it since 2026-09-04 under the author's grant on probe-or-node and reports it under the decomposition kind, since a finding kind of its own would be refused by the applying script; this option enumerates it here so the brief runs nothing this node does not name, and leaves open whether independence becomes a kind of its own.

#### new-question-or-new-answer

Adopted into `split-survey-from-per-draft` on 2026-09-04: the fence names the merge analysis as the periagogic stage's as well as the review's. The author's words on the sitting of dialogue name the analysis of whether a disposition is a new question or a new answer to a question already recorded as performed by periagoge and by the adversarial review; the standing answer's periagogic sentence covers a draft's inconsistency with the answered graph and not this analysis. This option is the answer with the analysis named as belonging to the periagogic stage as well as to the review, so that a sitting checks it before a draft exists and not only when the batch is read.

#### cite-run-mechanics

Adopted into `split-survey-from-per-draft` on 2026-09-04: the fence cites the clean-context-review node for how each reading is run, its model, and how the survey is pinned and serialized. Both nodes had stated the same two run rules in full, that every invocation is one batch over the whole frontier read in one context and that one review runs at a time by the invoking session's discipline until a lock exists, and let each other go stale on the lock. Clean-context-review is the survivor of the run mechanics, since its question is how the review is run and it is the node the skill implements; this node keeps what is its own, the validations and the kickback flow. Raised on commons.systems/disposition-graph/clean-context-review.

#### placement-feeds-the-order

Adopted into `split-survey-from-per-draft` on 2026-09-04: the thirteenth validation records what the survey finds as the alignment-order node says and derives the order from it. Validation 13 had the review recommend the order in which the author rules, and nothing consumed the recommendation of 2026-09-03. The alignment-order node gives it a consumer: the survey's findings of contradiction, supersession, and redundancy between unanswered nodes are recorded as options on the earlier-recorded survivor, and its findings of divergence between subtrees as `depends` on the leaves, and the ruling order is derived from that data rather than recommended in prose. Raised on commons.systems/disposition-graph/alignment-order, from the author's words of 2026-09-03 recorded there.

#### proposal-as-a-state-of-a-ratified-node

Validation 2, in both the standing answer and the recommended `split-survey-from-per-draft`, reads "it is recorded as an option on the node it conflicts with, a proposal under the authority node when it arose outside alignment, and the review says which". Under the authority node's recommendation a proposal is no longer a thing recorded under that node but the state of a ratified node whose recommendation has moved, so the clause this node's own readings run under has become unreadable. The validation drops "a proposal under the authority node when it arose outside alignment, and the review says which" and says instead that where the node it conflicts with is ratified, the option puts that node into the proposal state the authority node defines. Raised on commons.systems/disposition-graph/authority, by its clean-context reading of 2026-09-05.

### authority

Ratified is recommended because the validations are the contract every reading runs under, and a change to the list changes what the author is shown before they rule; a defect in it is undetected in every ruling after it, which is capture-shaped on the record's own test. Boldness moderate: the requirement and the survey are the author's, the list and its division are the AI's. The case against is deferred, under which the validations would act while the node stays in view; it is live because this node is unanswered under an unanswered ancestor whose own division of the readings is still at review, and the fence rests on options of three other nodes, named in `depends`, none of them ruled.

## Recommendation

```markdown
---
question: How is the unanswered frontier kept consistent with itself?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
defines:
  - frontier survey
---
## Answer

By the adversarial review, whose two readings divide the validations below by their object, as the clean-context-review node describes: the review of a draft runs the first six and the fifteenth on one node the moment its recommendation is recorded, and the survey, the frontier survey this node defines, the reading that judges the whole graph against itself, runs the seventh to the sixteenth over the whole graph, answered and unanswered at every stage, judging the nodes whose recommendation has changed since it last pinned them, before the author rules. Inconsistency between a draft and the answered graph is surfaced to the author by the periagogic stage, where the dialogue turns the author toward the doctrine the draft would join and asks whether the disposition is a new question or a new answer to one the record already asks, as the author's words of 2026-09-03 say; inconsistency within the frontier has no author to meet it, and the review is where it is surfaced. The validations, each producing findings that name the nodes and the sentences:

On a draft, the text its recommendation names:

1. Question and words. The draft answers the node's question and nothing else, and the author's words on the node are answered by it: no drift between what the author said and what the draft says.
2. Doctrine. The draft contradicts no answered node in its ancestry or among the nodes it cites; what would contradict doctrine is never adopted by a recommendation; it is recorded as an option on the node it conflicts with, a proposal under the authority node when it arose outside alignment, and the review says which.
3. Facts. The recommendation's boldness is right and the class its authority fact recommends is the one the session means to present, it names a listed option, its pin names the recommendation as it is, so that a review of text since amended is caught, its persistence follows from the node's shape, and every claim about the record or the implementation is verified: a file named exists, a command cited runs, a date and a quotation are exact.
4. Readings. A tradition cited is represented accurately within its recorded support scope, and a divergence from it is recorded as the author's.
5. Shims. Each declared shim names an artifact that exists and a liquidation condition, and nothing the draft presumes materialized is unmaterialized without saying so.
6. Counter-argument. The strongest case against the draft, with its strength.

Across the graph, each node the survey judges against every other node, answered or unanswered, at whatever stage, and a finding naming whichever nodes it concerns:

7. Contradiction. Two frontier nodes whose answers, drafts, or author's words touch the same matter and disagree.
8. Supersession. The author's words on one node superseded by later words on another while the earlier node still answers the superseded words; the occasion of this node.
9. Redundancy. Two nodes answering the same question, defining the same term, or restating each other; a merge is proposed naming the survivor and what moves.
10. Decomposition. A node answering more than one question or carrying what another node owns, or a node that is a fragment of its parent; a split or a fold is proposed.
11. Vocabulary. Every term used with one meaning across the frontier, each definition made once, and no term used by a node that has no path to the node defining it.
12. Cross-reference. Every prose reference to another node points at a node that still says what is attributed to it; a reference stale since an amendment is the drift this review exists to catch.
13. Placement and order. The `under` and `order` fields agree with the answers' dependencies: a draft that presupposes another node's answer is under it or after it, and no node at the ruling stage rests on ground still at the periagogic or maieutic stage without saying so. What the survey finds is recorded as the alignment-order node says, a lateral tangle as an option on the earlier-recorded node and a divergence between subtrees on the leaves, and the ruling order is derived from that and never recommended in prose.
14. Coverage. Each part of every disposition the author has given in the record is answered by exactly one node: none unanswered, none answered twice; a quotation may be carried on a child as the ground of the part it answers.
15. Merge. Whether each disposition the author has given, each node, and each option pending on one is a new question or a new answer to a question the record already asks, answered or unanswered: a new answer standing as its own node is proposed for the node whose question it answers, as an option with its source, and a new question carried on another node's dialogue is proposed a node of its own. A probe recorded on a node is a question about what the author meant and is not proposed a node of its own; a question whose answer would itself stand as an answer to a question of the record still is. The review of a draft asks it of the draft against the index of every question the record asks, and the survey asks it across the frontier and is its reader of last resort: a merge the periagogic stage or a draft's reader proposes is the same finding met sooner.
16. Independence. A node standing under an unanswered parent whose only possible answer is a reading of the parent's, whose facts would repeat the parent's, and which would be pruned when the parent's recommendation moved, is reported as a probe on the parent, as a finding carrying the probe it would become, readings exempt.

The result is applied as the kickback flow the recording and clean-context-review nodes describe, and nothing else: a draft is forwarded to the ruling stage or kicked back, and a frontier finding kicks back each node it names whose text must change to the earliest stage the finding touches, the periagogic stage when the ground or the author's words are in question, the maieutic when the answer must be redrafted, with the finding as context and, where the reviewer can give it, the edit or the proposed merge or split. The merge or split itself is an option recorded on the node it would change, which the author rules on; the review does neither. How each reading is run, what its reader is given, its model, and how the survey's findings are pinned and serialized are the clean-context-review node's and are not restated here.

## Rationale

The author, 2026-09-03: "there is a flaw in the harness disposition that makes the unanswered question frontier (the entire graph right now) prone to drift. As the unanswered frontier grows we expect it to maintain consistency with the answered-with-authority graph, but there is no recorded disposition for the harness to enforce self consistency of the unanswered frontier. Inconsistency with the answered-with-authority graph is expected to be surfaced by periogoge (recorded disposition). Inconcistency with the unanswered frontier must be surfaced by the adversarial alignment review skill. Propose a full list of validations which must be encoded into the adversarial alignment review skill - it must include a survey of the full unanswered frontier to identify inconcistencies and redundancies (unanswered dispositions that should be merged, or decomposed in a better way)." Refining: "When adversarial review identifies conflict the result is the same kickback flow described previously. Recommend kick back to earlier alignment dialogue phase with context and/or edits." On the sitting of dialogue: "One of the analyses performed by periagoge and adversarial alignment review is whether disposition is a new question or a new answer for a disposition (answered or unanswered)." During the reconciliation of that day: "adversarial alignment review validation includes a check for opportunites to merge unanswered nodes as alternate answers to the same question. Adversarial review evaluates batch of nodes which are at the review dialogue phase against the full graph." The author, 2026-09-04, on the decomposition node, whose recommendation stands under this node's split: "go, and bootrap authority granted".

Drift between unanswered nodes is invisible to any reading of one node, and the author's disposition carries that to its end: the survey reads the whole frontier. The list divides by what the reader must hold in view, which is why it divides between two readers: the first six validations need the draft and its neighbourhood and are the review of a draft as the recording node describes it; the last ten need the whole frontier at once and are the survey the author asked for; the fifteenth runs in both, on the draft against the index of every question the record asks, and across the frontier. Contradiction, supersession, redundancy, and decomposition are the four shapes of drift a growing frontier takes; vocabulary, cross-reference, and placement are where drift leaves a trace a reader can check; coverage closes the loop from the author's words back to the nodes; merge asks of each disposition and each node whether it is a new question or a new answer, and the periagogic stage asks it first, as the author's words say, so that a duplicate is met before it is drafted further. The kickback flow is the author's refinement: a finding across nodes is a finding on each, and each returns to the stage where it is repaired, so that the frontier is repaired by the dialogue and not by the review. The readers were split on the author's words of 2026-09-04 because the two objects need two contexts: a draft's reader must hold one node and its neighbourhood, the survey's must hold the frontier, and neither context serves the other. The undivided reading had the consequence the review of this node found on 2026-09-03: one reading over sixty-odd nodes on every invocation paid twice for the per-draft pass, handing the survey's reader the whole graph to judge six validations that need a neighbourhood, and its cost grew with the frontier rather than with what changed. Kept: the clean context, a fresh subagent that is never a fork.
```

## Account

### Recording of 2026-09-03

The author's words quoted above are recorded as this node's answer, stamped deferred. The author's: that the frontier's self-consistency is the review's to surface and the answered graph's the periagogic stage's; that every invocation is a batch over the whole frontier with no context isolated by node; the survey for inconsistencies and redundancies, merges and decompositions; the kickback flow with context and edits; serialization, manual for now, and after any running review. The AI's, open to the author's ruling: the fourteen validations and their division; the earliest-stage rule for a frontier finding; that a merge or split is proposed, never done, by the review. This node supersedes the per-node answer of the clean-context-review node, amended the same day, and the `siblings` field of the review state, removed from the dialogue node the same day. Materialized the same day in the review skill under the bootstrap exception the author granted, and run over the whole frontier that evening, its findings recorded on the nodes they name after the session validated each against the record. Facts: authority ratified; boldness moderate, the requirement is the author's and the list is the AI's; persistence standing.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The node carries 'stage: review' and no 'review:' field: this is its first reading, and it is the node that defines what this reading does. That is a live circularity the author should see: the validations this review ran are themselves unratified and were read by the reader they govern.
- Answer, validation 3: 'The recommendation's class and boldness are right, its persistence follows from the node's shape.' Verified that persistence is nowhere stored or derived: dialogue makes it derived and never stored, no projection emits it, and the sixteen generic Facts lines state it in prose only. So validation 3 asks the reviewer to check a fact the record does not carry.
- Answer, last paragraph: 'One review runs at a time over the frontier: an invocation waits for any review already running, by the invoking session's discipline until a lock is materialized, which the author set at low priority.' Honest about the gap and correctly attributes the priority to the author.
- Answer, validation 14: 'Every disposition the author has given in the record is answered by exactly one node.' Verified violated four times by exact-duplicate quotations: audience and coverage; scope, self-documentation and rsi; knowledge-store, capture and purpose; node and form-vocabulary. Some are deliberate context on a child; the validation as worded admits no such case. Suggested edit: say that a quote may be carried as context on a child that answers a part of it, and that the violation is two nodes answering the same part.
- Answer: 'a frontier finding kicks back each node it names to the earliest stage the finding touches'. Applied literally this kicks back a node for a finding about a sibling, which for a contradiction between a ruling-stage node and a maieutic one would return the ruling-stage node to maieutic on the strength of the other node's immaturity. Suggested edit: say the kickback falls on the node whose text must change.

On the three facts: The frontmatter recommendation (ratified, moderate) states one class and one value, and the split it names — the requirement is the author's, the list is the AI's — is honest. It should add that the list is already materialized in the review skill under the bootstrap exception, so the author is ratifying a practice in force, and that this reading was produced under it.

Strongest counter-argument (moderate): Fourteen validations over sixty-two nodes in one context is an unbounded reading, and the node sets no floor on what a finding must be worth. The author's requirement was that inconsistency within the frontier be surfaced, which the survey validations (7 to 14) do; validations 1 to 6 duplicate what the recording node already requires of every draft review, so every invocation pays twice for the per-node pass. Splitting the survey from the per-draft review would let the survey run over the whole frontier while the per-draft review runs only on drafts that changed — which is what the author's 'EVERY invocation is a batch operation' asks for and what the cost argues for.

The session's reply: Validated. Amended tonight: validation 14 admits a quotation carried on a child as the ground of the part it answers, the kickback falls on the node whose text must change, and the proposal says the batch ran and its findings were validated by the session before recording. The circularity is disclosed: this reading was produced under the validations it reviews. Persistence is derived from the node's shape, which is what validation 3 asks the reviewer to check. On the counter-argument, that the survey and the per-draft review should split: the author ruled every invocation a batch; a per-draft pass over changed drafts only is a proposal the sitting can put. Stage review.

### The author's words of 2026-09-03 on dialogue

The sentence quoted above adds a validation the answer does not list: whether a disposition is a new question or a new answer to a question already recorded, answered or unanswered. The draft does not answer it, so the stage returns to maieutic; the whole disposition is on the dialogue node, whose sitting carries it.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `new-question-or-new-answer` (author, 2026-09-03); `split-survey-from-per-draft` (review, 2026-09-03); `cite-run-mechanics` (ai, from commons.systems/disposition-graph/clean-context-review).
The recommendation adopts `standing` and is pinned to the standing text as it was at that commit.
Merge analysis of the author's words: 2026-09-03, own-question: The unanswered frontier's self-consistency must be enforced by the adversarial review skill, whose every invocation is a batch over the full frontier with no context isolated by disposition, and which must run a full list of validations including a survey for inconsistencies and redundancies. 2026-09-03, own-question: A conflict the review identifies produces the same kickback flow, recommending a return to an earlier dialogue phase with context and edits. 2026-09-03, own-question: The review skill is serialized after any adversarial review already running in the session. 2026-09-03, own-question: Periagoge and the adversarial review both analyse whether a disposition is a new question or a new answer to a question already recorded, answered or unanswered.
The census unit's note: Two alternatives: the author's own added validation, which the node records as unanswered by the standing text and which sent it back to maieutic, and the review's split of the survey from the per-draft pass, which the session's reply explicitly left as a proposal for a sitting. The review's other findings are already applied in the answer, verified by reading validation 14 (the quotation carried on a child) and the kickback sentence (the node whose text must change), so they are not alternatives. The circularity finding and the finding that persistence is nowhere derived are observations with no proposed text. The fold of this node's restated batch and serialization rules into clean-context-review is proposed from that node.

### Alternatives merged, 2026-09-03

The alternatives raised on this node by more than one census cohort were merged at the re-encoding, and any alternative the standing answer already carries was removed: . The merge unit's note: No change proposed. new-question-or-new-answer is only PARTLY carried and stays: the answer now lists fifteen validations, and validation 15 carries the author's words verbatim, so the first half of the alternative is met, but the answer names only the review as running the analysis; the author's words say 'One of the analyses performed by periagoge and adversarial alignment review', and the answer's periagogic sentence covers a draft's inconsistency with the answered graph, not this analysis. The entry's own text is now stale on two facts, that the answer 'lists fourteen validations and no such analysis' and that 'the stage returned to maieutic'; the node stands at the review stage. If the main thread wants it rewritten rather than kept as-is, the remaining alternative is the answer with the analysis named as belonging to the periagogic stage as well as to the review.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The node carries `stage: review` and no `review:` field: this is its first reading, and it is the node that defines what this reading does. The circularity is live and the author should see it — the fifteen validations this review ran are themselves unratified and were read by the reader they govern, under a skill materialized from them by a bootstrap grant.
- Answer, validation 3: 'its persistence follows from the node's shape'. Verified that persistence is nowhere stored or derived: dialogue makes it derived and never stored, no projection emits it, and the prose Facts lines state it by convention only. The validation asks the reviewer to check a fact no projection carries, which is why every facts check in this batch states it from the node's shape by hand.
- Answer, validation 14: verified amended to admit 'a quotation may be carried on a child as the ground of the part it answers', which resolves three of the four duplicate-quotation cases the earlier finding raised. The fourth, the author's form question on knowledge-store, capture and purpose, is a genuine double answer and is pending as `cite-forms` on all three.
- Answer, validation 15 and the periagogic sentence: the author's words say 'One of the analyses performed by periagoge and adversarial alignment review is whether disposition is a new question or a new answer', and the answer names only the review as running it — its periagogic sentence covers a draft's inconsistency with the answered graph, not this analysis. The `new-question-or-new-answer` alternative is the vehicle and its own text is stale on two facts, which its merge note records.
- Answer, last paragraph: 'One review runs at a time over the frontier: an invocation waits for any review already running, by the invoking session's discipline until a lock is materialized.' Verified a lock is now written by the skill (tmp/review/frontier.lock, present for this run), so this sentence and clean-context-review's identical one are both stale in the same direction. The `cite-run-mechanics` alternative would remove the duplication that let both go stale together.

On the three facts: The frontmatter recommendation (adopts standing, ratified, moderate) states one class and one value and the pin is current, and the split it names — the requirement is the author's, the list is the AI's — is honest. It should add that the list is already materialized in the review skill under the bootstrap grant, so the author is ratifying a practice in force, and that this reading was produced under it. Persistence standing follows from the node's shape.

Strongest counter-argument (moderate): Fifteen validations over sixty-eight nodes in one context is an unbounded reading, and the node sets no floor on what a finding must be worth. The author's requirement was that inconsistency within the frontier be surfaced, which validations seven to fifteen do; one to six duplicate what recording already requires of every draft review, so every invocation pays twice for the per-node pass and the cost grows with the frontier rather than with what changed. The session's answer, that the author ruled every invocation a batch, is right about the survey and does not answer the duplication, which the pending `split-survey-from-per-draft` alternative addresses.

The session's reply: Forward accepted. The circularity is real and disclosed here; the lock sentence is stale as clean-context-review's is; validation 3's persistence and the periagogic half of validation 15 stay as pending alternatives.

### Recommendation moved, 2026-09-04

Moved by the alignment session from the standing text to `split-survey-from-per-draft` on the author's words of 2026-09-04 quoted above, given on the decomposition node, whose account carries the reasoning and the grant. The review of 2026-09-03 pinned the standing text, so this node returns to the review stage and the frontier shows it as changed since its review; the first review of a draft the reconciled skill runs is owed here. The fifteen validations are kept whole; what changes is which reader runs which, the periagogic half of the merge analysis, the recording of what the survey finds, and the citation of the run mechanics to the clean-context-review node in place of the restatement that let both nodes go stale together on the lock.

### The sixteenth validation, 2026-09-04

Recorded by the reconciliation of the probe-or-node rule into the survey brief, under the author's grant of that day on that node: the brief now runs an independence validation the fifteen here do not name, and the reconciling unit reported the gap. The option `sixteenth-validation-independence` puts it on this node's answer fact for the author; the recommendation does not move.

### Clean-context review, 2026-09-05

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Facts, answer fact (validation 3, viability). The prose says "Three options leave the list because the recommended text carries them, and none of them stood against it: `new-question-or-new-answer`, the author's own ...; `cite-run-mechanics` ...; and `placement-feeds-the-order`, the author's ...", and the facts line lists only seven options. Two of the three struck are `source: author` candidates, and the record's own practice keeps an adopted option listed with its adoption noted (alignment-page's `open-probe-count-on-the-chip`, "Adopted into the recommended text on 2026-09-04"; dialogue's five clauses "Adopted into every-part-in-the-record"; the viable-options node recommends `passed-over-options-stay`, under which "a candidate never silently leaves the list"). Once struck, the author can no longer rule for `new-question-or-new-answer` on its own, and the merge note of the census (Account) that says it was only partly carried loses its subject. Suggested edit: restore the three to the options list with a subsection each reading "Adopted into `split-survey-from-per-draft` on 2026-09-04" and the sentence the fence now carries for it, and delete the "leave the list" sentence from the prose.
- Recommendation, validation 15, against `commons.systems/disposition-graph/author-questions` (validation 2, cross-reference). The fence's fifteenth reads "a new question carried on another node's dialogue is proposed a node of its own" with no exclusion for a probe, while author-questions' standing text, reconciled under grant, "requires by name that validation 15 gain a clause that a probe is not a mintable question", and the option `probe-is-not-a-mintable-question` is listed here as viable, sourced to that sitting, and left unrecommended with no reason recorded. As written the fifteenth would propose every entry in a `probes` field a node of its own, which contradicts the node this fence stands beside and the probe-or-node node's admission test. Suggested edit: adopt the clause into the fence's validation 15 ("A probe recorded on a node is a question about what the author meant and is not proposed a node of its own; a question whose answer would itself stand as an answer to a question of the record still is"), and mark the option adopted; or record in its subsection why it is passed over.
- Recommendation, the survey's list, against the materialized instrument (validation 5, cross-reference). The fence enumerates the survey's validations as "the seventh to the fifteenth", but `packages/clean-context-review/brief-survey.md` (line 25) sends the survey "validations 7 to 15 of `frontier-consistency`, and the sixteenth, the independence test of `probe-or-node`" and defines it at line 36; `.claude/skills/align-survey/SKILL.md` names it too. The option `sixteenth-validation-independence` records this and says "this option enumerates it here so the brief runs nothing this node does not name", yet stays unadopted without a reason. A ratified fence that names fifteen while the instrument runs sixteen is the drift validation 12 exists to catch, ratified. Suggested edit: add "16. Independence. A node standing under an unanswered parent whose only possible answer is a reading of the parent's, whose facts would repeat the parent's, and which would be pruned when the parent's recommendation moved, is reported as a probe on the parent, readings exempt" to the survey's list and change "the seventh to the fifteenth" to "the seventh to the sixteenth"; leave whether independence is a kind of its own to the option's prose.
- Recommendation frontmatter and text (validation 3, vocabulary). The fence declares `defines: frontier survey`, and the term appears nowhere in the fence, in review-skills, or in clean-context-review: every use is "the survey". The brief's own header for the node reads "Defines: frontier survey (no gloss yet)". Suggested edit: gloss it once where the survey is first named, "and the survey, the frontier survey this node defines, the reading that judges the whole graph against itself, runs the seventh to the ...", so the defined term is the one used.
- Facts, authority fact (validation 3). The authority fact recommends `ratified` at moderate boldness and its subsection carries no reason, where the dialogue node asks that each fact's subsection open "with the reason for its recommendation" and the sibling review-model and review-skills nodes each give one. Deferred is a live alternative here: the rule would act while the node stays in view, and the node is unanswered under an unanswered ancestor whose own division of readings is still at review. Suggested edit: one sentence under `### authority` saying why the author is asked to confirm rather than defer (the validations are the contract every reading runs under, and a change to the list changes what the author is shown), and an `against` naming deferred.
- Node header `depends: none` against the fence's validation 13 (validation 3, placement). The fence rests on the clean-context-review node's `per-draft-and-survey` ("as the clean-context-review node describes"), on the alignment-order node's recording of tangles and divergences (validation 13's second sentence), and on the decomposition node's `seams-and-split-review`, all unruled and at review; the sibling review-skills records `depends: frontier-consistency#split-survey-from-per-draft` for the same kind of dependence. Validation 13 says "no node at the ruling stage rests on ground still at the periagogic or maieutic stage without saying so"; this node forwards to ruling saying nothing. Suggested edit: `depends: clean-context-review#per-draft-and-survey, alignment-order#settle-counts-nodes-only`, and decomposition where the session judges its option decisive.
- Rationale, last paragraph (evaluation rule). "Splitting the readers, on the author's words of 2026-09-04: one reading over sixty-odd nodes on every invocation paid twice for the per-draft pass ... its cost grew with the frontier rather than with what changed ... and which stands as the reason." The evaluation rule strikes cost from the choosing and admits it only as a stated consequence. The paragraph before it already gives the merit, "the list divides by what the reader must hold in view, which is why it divides between two readers", and clean-context-review's fence rests the same split on the readings' objects and moments. Suggested edit: lead the sentence with the object division (a draft's reader must hold one node and its neighbourhood; the survey's must hold the frontier, and neither context serves the other), and state "paid twice" and "grew with the frontier" as the consequence the undivided reading had, not as "the reason".

On the facts and what they recommend: The answer fact recommends `split-survey-from-per-draft` at moderate boldness, standing `standing`; the requirement, the survey, and the go of 2026-09-04 are the author's while the division by object and the readers' contexts are the AI's, and moderate is right. The authority fact recommends ratified at moderate boldness with no reason. The fence (form rule, under clean-context-review, defines frontier survey) is what the author would confirm: the fifteen validations divided per draft and per frontier, the periagogic stage asking merge first as the author's words on the dialogue node say (verified verbatim at disposition/disposition-graph/dialogue.md line 234), findings recorded as alignment-order says, and mechanics cited to clean-context-review; the review pin (forward, moderate, 2026-09-03, of 97906aa7) is stale against it, which this reading replaces, and there is no survey pin.

On the viability of the options: Every listed option is viable, and the four passed-over ones (`per-node-review-without-a-survey`, `validator-rule-for-consistency`, `survey-at-reconciliation-time`, and the standing text) carry their reasons. Viable options are missing: the three adopted ones struck from the list (`new-question-or-new-answer` and `placement-feeds-the-order`, both the author's, and `cite-run-mechanics`) should stand listed as adopted, and two listed options (`probe-is-not-a-mintable-question`, required by name by author-questions, and `sixteenth-validation-independence`, already run by the survey brief) are neither adopted nor passed over with a reason.

Strongest counter-argument (moderate): The split answers only half of the counter-argument the record accepted on 2026-09-03: the survey still reads the whole graph on every invocation and is incremental only in what it judges, with no floor on what a finding is worth, so its cost and its noise still grow with the frontier. It also restates the partition in two nodes (this fence and clean-context-review's) and two brief templates, and the partition has already drifted within a day, the survey running a sixteenth validation this list does not name; a ratified numbered list becomes the thing the instrument drifts from, which is the update anomaly the node's own validations 9 and 12 exist to catch. And the merge validation now runs at three moments on three objects, in periagoge, in the draft review, and in the survey, with no rule for which finding wins when they disagree, so one node can be proposed a merge three times by three readers before the author sees it. The reply is that the division is by what a reader must hold in view, which no single context serves, and that the drift is a cross-reference finding the survey itself raises, but the draft would be stronger stating the partition once and naming the reader of last resort for validation 15.

The session's reply: Validated, all seven. The three adopted options return to the list, each with a subsection saying what it was adopted into and when, as the dialogue and alignment-page nodes keep theirs and as the viable-options node recommends; the two options struck the same way on the authority and materialization nodes on 2026-09-05 return likewise, and an option is recorded on the viable-options node for a status naming an adopted option, since the encoding's only status is passed. The probe clause the author-questions answer requires by name is adopted into the fifteenth validation, and the sixteenth, independence, is added to the survey's list, so the fence names what the brief runs; both options stay listed as adopted. The frontier survey is glossed where the survey is first named. The authority fact opens with its reason and carries its case against, naming deferred. Depends names the three options this fence rests on. The rationale leads the split with the division by object and states the doubled cost as the consequence the undivided reading had. On the counter-argument, the fence now says the survey is the reader of last resort for the merge validation and that an earlier proposal of the same merge is the same finding met sooner. Stage review for the re-read.

### Amended after the reading, 2026-09-05

After the clean-context reading of 2026-09-05, whose findings the session validated. The three options the recommended text carried, `new-question-or-new-answer`, `cite-run-mechanics`, and `placement-feeds-the-order`, struck on 2026-09-04 as carried, return to the list as adopted, each with the subsection it had, since the record keeps an adopted option listed with its adoption noted and the viable-options node recommends that no candidate leave the list; two of them are the author's, and struck they could not be ruled for on their own. The clause the author-questions answer requires by name is adopted into the fifteenth validation, and the sixteenth, independence, is named in the survey's list, so the fence names what the survey brief has run since 2026-09-04; both options stay listed as adopted. The frontier survey is glossed where the survey is first named. The authority fact opens with its reason and carries its case against, deferred. `depends` names the options of three nodes the fence rests on, under the thirteenth validation's own rule. The rationale leads the split with the division by object and states the doubled cost as the consequence the undivided reading had. The fence names the survey the reader of last resort for the merge validation. Stage review for the re-read.
