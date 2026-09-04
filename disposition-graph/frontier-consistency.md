---
question: How is the unanswered frontier kept consistent with itself?
stage: review
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: 97906aa77d607f1befdb4d4d1a613eedaabfdc34
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
      - name: survey-at-reconciliation-time
        source: ai
        ref: "cbabf108"
        status: passed
        reason: "it is too late, the implementation being built by then on inconsistent drafts"
    recommends: split-survey-from-per-draft
    boldness: moderate
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
defines:
  - frontier survey
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

The recommendation moves from the standing text to `split-survey-from-per-draft` on the author's "go" of 2026-09-04 on the decomposition node, which stands under this option: the fifteen validations divide between the two readers the clean-context-review node's `per-draft-and-survey` names, and the run mechanics are cited there rather than restated. Boldness moderate: the requirement and the survey are the author's, the division and the readers' contexts are the AI's. Three options leave the list because the recommended text carries them, and none of them stood against it: `new-question-or-new-answer`, the author's own, since the text names the merge analysis as the periagogic stage's as well as the review's; `cite-run-mechanics`, since the text cites the clean-context-review node for the batch and the serialization; and `placement-feeds-the-order`, the author's, since the text records what the survey finds as the alignment-order node says and derives the order from it.

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

#### survey-at-reconciliation-time

The survey of the frontier runs at reconciliation rather than before the
author rules. It was passed over because it is too late: the implementation is
by then being built on inconsistent drafts.

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

By the adversarial review, whose two readings divide the validations below by their object, as the clean-context-review node describes: the review of a draft runs the first six and the fifteenth on one node the moment its recommendation is recorded, and the survey runs the seventh to the fifteenth over the whole graph, answered and unanswered at every stage, judging the nodes whose recommendation has changed since it last pinned them, before the author rules. Inconsistency between a draft and the answered graph is surfaced to the author by the periagogic stage, where the dialogue turns the author toward the doctrine the draft would join and asks whether the disposition is a new question or a new answer to one the record already asks, as the author's words of 2026-09-03 say; inconsistency within the frontier has no author to meet it, and the review is where it is surfaced. The validations, each producing findings that name the nodes and the sentences:

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
15. Merge. Whether each disposition the author has given, each node, and each option pending on one is a new question or a new answer to a question the record already asks, answered or unanswered: a new answer standing as its own node is proposed for the node whose question it answers, as an option with its source, and a new question carried on another node's dialogue is proposed a node of its own. The review of a draft asks it of the draft against the index of every question the record asks; the survey asks it across the frontier.

The result is applied as the kickback flow the recording and clean-context-review nodes describe, and nothing else: a draft is forwarded to the ruling stage or kicked back, and a frontier finding kicks back each node it names whose text must change to the earliest stage the finding touches, the periagogic stage when the ground or the author's words are in question, the maieutic when the answer must be redrafted, with the finding as context and, where the reviewer can give it, the edit or the proposed merge or split. The merge or split itself is an option recorded on the node it would change, which the author rules on; the review does neither. How each reading is run, what its reader is given, its model, and how the survey's findings are pinned and serialized are the clean-context-review node's and are not restated here.

## Rationale

The author, 2026-09-03: "there is a flaw in the harness disposition that makes the unanswered question frontier (the entire graph right now) prone to drift. As the unanswered frontier grows we expect it to maintain consistency with the answered-with-authority graph, but there is no recorded disposition for the harness to enforce self consistency of the unanswered frontier. Inconsistency with the answered-with-authority graph is expected to be surfaced by periogoge (recorded disposition). Inconcistency with the unanswered frontier must be surfaced by the adversarial alignment review skill. Propose a full list of validations which must be encoded into the adversarial alignment review skill - it must include a survey of the full unanswered frontier to identify inconcistencies and redundancies (unanswered dispositions that should be merged, or decomposed in a better way)." Refining: "When adversarial review identifies conflict the result is the same kickback flow described previously. Recommend kick back to earlier alignment dialogue phase with context and/or edits." On the sitting of dialogue: "One of the analyses performed by periagoge and adversarial alignment review is whether disposition is a new question or a new answer for a disposition (answered or unanswered)." During the reconciliation of that day: "adversarial alignment review validation includes a check for opportunites to merge unanswered nodes as alternate answers to the same question. Adversarial review evaluates batch of nodes which are at the review dialogue phase against the full graph." The author, 2026-09-04, on the decomposition node, whose recommendation stands under this node's split: "go, and bootrap authority granted".

Drift between unanswered nodes is invisible to any reading of one node, and the author's disposition carries that to its end: the survey reads the whole frontier. The list divides by what the reader must hold in view, which is why it divides between two readers: the first six validations need the draft and its neighbourhood and are the review of a draft as the recording node describes it; the last nine need the whole frontier at once and are the survey the author asked for; the fifteenth runs in both, on the draft against the index of every question the record asks, and across the frontier. Contradiction, supersession, redundancy, and decomposition are the four shapes of drift a growing frontier takes; vocabulary, cross-reference, and placement are where drift leaves a trace a reader can check; coverage closes the loop from the author's words back to the nodes; merge asks of each disposition and each node whether it is a new question or a new answer, and the periagogic stage asks it first, as the author's words say, so that a duplicate is met before it is drafted further. The kickback flow is the author's refinement: a finding across nodes is a finding on each, and each returns to the stage where it is repaired, so that the frontier is repaired by the dialogue and not by the review. Splitting the readers, on the author's words of 2026-09-04: one reading over sixty-odd nodes on every invocation paid twice for the per-draft pass, handing the survey's reader the whole graph to judge six validations that need a neighbourhood, and its cost grew with the frontier rather than with what changed, which the review of this node found on 2026-09-03 and which stands as the reason. Kept: the clean context, a fresh subagent that is never a fork.
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
