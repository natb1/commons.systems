---
question: What does the alignment session take up when given nothing?
stage: ruling
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: 1c5395eea68a14452e88040c5894830533188fdf
  against: "Taking the highest-ranked unanswered node is right if rank is the author's attention, and it is not: every boost in the record is the AI's and unratified, as attention's own answer now says, and the one order the author did state covers six nodes out of sixty-two. So 'rank answers it without the session's judgment entering' describes a queue the AI itself ordered and presents an AI choice to the author as the record's own. The session's reply — that the page shows the author the whole queue at every visit — is a real answer and is now true of the built page, which weakens but does not dissolve the objection."
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-03"
      - name: ruling-order-not-rank
        source: author
        ref: "2026-09-03"
      - name: onboarding-walk-from-purpose
        source: ai
        ref: "32600efe"
        status: passed
        reason: "it presumed a record with nothing unanswered to take up"
      - name: choose-by-the-oldest-stage
        source: ai
        ref: "32600efe"
        status: passed
        reason: "it substitutes a heuristic for the rank the record already carries"
      - name: choose-by-the-fewest-movements-owed
        source: ai
        ref: "32600efe"
        status: passed
        reason: "it substitutes a heuristic for the rank the record already carries"
      - name: ask-the-author-which-node
        source: ai
        ref: "32600efe"
        status: passed
        reason: "the author's answer would be a boost, which they can set without being asked"
    recommends: standing
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
  - commons.systems/disposition-graph/growth
---
## Disposition

The author, 2026-09-03:
> new disposition (alignment shim): `/align` usage (with no disposition or node id) choose the highest ranking unanswered disposition and progress it (through periogoge and miaeutic and adversarial review, etc. depending on unsanswered node state) up to confirmation.

## Answer

The highest-ranked unanswered disposition, and it progresses that one node through the movements still owed on it, from the stage it carries, up to the author's confirmation. Given no disposition and no node id, the session reads the frontier and takes the first unanswered node in rank order, this project's graph, read from the frontier by its id prefix, before the public graph, and so the purpose node first while it is unanswered, and runs the sitting from that node's stage: the periagogic stage when the author's account is not yet in the record, the maieutic stage when the answer is not yet drafted, the clean-context review when the draft has not had it, and then the ruling, put to the author in the interview by the question mechanics of the growth node and on the alignment page. A confirmation is recorded as the recording node describes, and a denial resumes the dialogue at the movement it calls for. A movement already behind the node is not repeated: the stage is the record of what the dialogue has done, and the session trusts it; the bootstrap's drafts stand at the review stage by the author's ruling of 2026-09-03 on the unanswered node, which set their stage. The author's choice of a different node is a boost, and the session takes the node the author names instead. One node at a time: when the node is recorded, or the author leaves it, the next highest unanswered node is the next sitting.

## Rationale

The author's ruling of 2026-09-03, quoted above. Rank is the order of the author's attention, and the unanswered nodes are the queue of the dialogue; a session given nothing has one question to answer, which item of that queue comes first, and rank answers it without the session's judgment entering. Progressing from the stage rather than from the beginning is what the stored stage is for: it exists, the transience node says, so that what the dialogue has done survives the session that did it. Up to confirmation and not beyond: the confirmation is the author's act, and the session's work on a node ends when it has put the node before the author with everything the ruling needs, the draft, the three facts, and the review's counter-argument; where the author is in the interview, the session asks for the ruling there, and where the author rules on the page, the session reads the ruling back at its next sitting.

## Facts

### answer

#### ruling-order-not-rank

The alignment-order draft answers that a session given nothing takes the first node of the ruling order, derived from the tangle the record carries, and not the highest-ranked unanswered node; rank breaks ties only. The author's words there: rank was "the only order the record had to hand" when this node was ruled, and every statement applying it to alignment is reconsidered, since the alignment frontier has no confirmed authority and a greedy rank order is not necessarily optimal for untangling it. The alternative amends this answer's first sentence and its rejected heuristics, whose rejection rested on rank already being the order. It amends the clause "this project's graph before the public graph" as well: the ruling order is one order over the whole alignment frontier, the manifest's graphs together, since the dependencies cross them and the public graph carries the root that this project's graph hangs under, so a graph precedence would put a descendant's ruling before its ancestor's. Raised on commons.systems/disposition-graph/alignment-order, from the author's words of 2026-09-03 recorded there.

#### onboarding-walk-from-purpose

A session given nothing walks the onboarding path from the purpose node to a
question in the author's words. It was passed over because it presumed a
record with nothing unanswered to take up; while any node is unanswered, the
first unanswered node is that walk.

#### choose-by-the-oldest-stage

The session takes the unanswered node whose stage is oldest. It was passed
over because it substitutes a heuristic for the rank the record already
carries.

#### choose-by-the-fewest-movements-owed

The session takes the unanswered node owing the fewest movements of the
dialogue. It was passed over for the same reason as the oldest stage: it
substitutes a heuristic for the rank the record already carries.

#### ask-the-author-which-node

The session asks the author which node to take up. It was passed over because
the author's answer would be a boost, which they can set without being asked.

## Account

### Recording of 2026-09-03

The author's words quoted above are recorded as this node's answer, stamped deferred. The author's: the usage, the choice by rank, the progression by the node's state, and the end at confirmation. The AI's, open to the author's ruling: that "up to confirmation" includes asking for the ruling in the interview when the author is present; that this project's graph comes before the public graph, so that the purpose node is first, where rank alone would put the public graph's root first; and that the earlier onboarding walk is replaced rather than kept beside this usage. The alignment skill's no-argument usage was reconciled to this node the same day.

Facts: authority ratified; boldness low on the usage and moderate on the reading of "up to confirmation" and on the order of the two graphs; persistence standing.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer: 'the session reads the frontier and takes the first unanswered node in rank order, this project's graph before the public graph and so the purpose node first while it is unanswered.' The frontier projection is a single rank order across both graphs and its first entry is commons.systems/public/agency at rank 1.0000; nothing in it separates the graphs. A session following this sentence literally takes agency, not purpose. This is the batch's clearest case of an executor being led to a wrong action. Suggested edit: state the ordering the session applies, or have the frontier emit it.
- Answer, same sentence: 'while it is unanswered'. Purpose carries an answer and no stamp, so deriveStatus returns 'proposal'; no projection reports 'unanswered' for anything. The instruction cannot be executed from a projection as written, which is the same root cause as the finding above.
- Answer: 'A movement already behind the node is not repeated: the stage is the record of what the dialogue has done, and the session trusts it.' Sixteen nodes were set to 'stage: review' in one commit on 2026-09-03 without their periagogic or maieutic movements having been run. Under this rule a session will trust that those movements are behind them and take the node straight to a ruling. Suggested edit: say what a stage set by reclassification rather than by a movement means, and whether such a node owes its periagogic movement before the ruling.
- Answer: 'The author's choice of a different node is a boost, or an argument.' 'Or an argument' is undefined and carries no consequence; attention and growth both make the choice a boost. Suggested edit: strike it or say what an argument does.

On the three facts: 'Authority ratified if the author confirms; boldness low on the usage and moderate on the reading of up to confirmation and on the order of the two graphs; persistence standing' is the best-formed facts line in the batch: one class, boldness split by clause, and the AI's share named. It should add that the two-graph order it presents as moderate boldness is not realized by the frontier the answer instructs the session to read, so confirming it confirms a rule the tooling does not yet implement.

Strongest counter-argument (strong): Taking the highest-ranked unanswered node is right if rank is the author's attention, and it is not: every boost in the record is the AI's and unratified, as attention's own rationale records, and the one order the author did state — the scope node's order field — covers six nodes out of sixty. So 'rank answers it without the session's judgment entering' describes a queue the AI itself ordered, and presents an AI choice to the author as the record's own. The rejected alternative, asking the author which node to take, is dismissed because 'the author's answer would be a boost, which they can set without being asked' — but the author has never set one, and the node offers no way for them to learn that they could.

The session's reply: The boosts are the AI's and unratified, as attention records, and the order field is the author's for six nodes; the counter-argument is right about whose order rank is today. It is still the record's one order, and the alternative it favours is what the alignment page already does: the author sees the whole queue in rank order at every visit and rules on any subset, which is the author's choice without a boost. A session given nothing takes the first, and the first is the purpose node, which the author did order. Accepted: 'or an argument' is struck; the sentence on trusting the stage now says that the sixteen bootstrap drafts stand at review by the author's ruling of 2026-09-03, which set their stage; and the session reads this project's graph from the frontier by its id prefix, since the frontier is one order across graphs.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer: 'the session reads the frontier and takes the first unanswered node in rank order, this project's graph, read from the frontier by its id prefix, before the public graph'. Verified: the frontier is a single rank order across both graphs and its first entry is commons.systems/public/agency at rank 1.0000; the amendment's 'by its id prefix' now makes the instruction executable, which resolves the previous review's sharpest finding. The alignment page independently groups by graph in the manifest's order (orderAlignmentItems), so page and frontier now agree on purpose first.
- Answer: 'while it is unanswered'. Verified now derivable: deriveStatus returns 'unanswered' and the frontier prints it. The previous review's finding is stale and should be corrected.
- Answer: 'A movement already behind the node is not repeated: the stage is the record of what the dialogue has done, and the session trusts it', qualified by 'the bootstrap's drafts stand at the review stage by the author's ruling of 2026-09-03'. That covers the sixteen reclassified nodes; it does not cover public/agency, whose review kicked it back to periagogic and whose periagogic movement has never been run. A session trusting the stage there would be right, which is the point — but nothing distinguishes a stage reached by a movement from a stage set by reclassification.
- The node is the first thing a no-argument session does, and it points that session at public/agency, whose parent-of-everything status and periagogic stage make it the correct but most expensive first sitting. The Proposal should say so.

On the three facts: The frontmatter recommendation (ratified, moderate) states one class and one value, and the prose Facts line ('boldness low on the usage and moderate on the reading of up to confirmation and on the order of the two graphs') is the best-formed in the batch. The two-graph order it presented as unimplemented is now implemented, so the facts should be updated rather than left as a caveat.

Strongest counter-argument (moderate): Taking the highest-ranked unanswered node is right if rank is the author's attention, and it is not: every boost in the record is the AI's and unratified, as attention's own answer now says, and the one order the author did state covers six nodes out of sixty-two. So 'rank answers it without the session's judgment entering' describes a queue the AI itself ordered and presents an AI choice to the author as the record's own. The session's reply — that the page shows the author the whole queue at every visit — is a real answer and is now true of the built page, which weakens but does not dissolve the objection.

The session's reply: Validated: the frontier's first entry is agency, the page groups by graph with purpose first, and the status is derived. A stage set by the author's reclassification is trusted as one reached by a movement, which the answer says. The first no-argument sitting is agency's periagogic movement, the most expensive first sitting and the right one. On the counter-argument, that rank is the AI's boosts: the page shows the author the whole queue at every visit, and every boost is presented as unratified. Stage ruling.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
The recommendation adopts `standing` and is pinned to the standing text as it was at that commit.
Merge analysis of the author's words: 2026-09-03, own-question: Called with no disposition and no node id, `/align` chooses the highest-ranking unanswered disposition and progresses it through the movements its state still owes, up to confirmation.
The census unit's note: Nothing is pending. The node stands at the ruling stage with a forward verdict, an answer and no draft, so the recommendation adopts the standing text. Both reviews' findings were accepted and applied in the answer — the id-prefix reading of the frontier, the striking of 'or an argument', the sentence on the stage set by the author's reclassification — and the remaining points are account corrections or observations. The two rejected alternatives, choosing by the oldest stage or the fewest movements owed and asking the author which node to take, are recorded in the rationale and excluded. I checked whether `alignment-order` duplicates this node's question and it does not: that node asks whether rank is the right order at all and its own account distinguishes the two, so no fold is proposed, though a ruling there could later amend this answer.
