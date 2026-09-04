---
question: When is a disposition answered?
stage: maieutic
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: b5717e656b723368acf1ad6f3609c7ab85c6a1a3
facts:
  - name: answer
    options:
      - name: answered-by-stamp
        source: ai
        ref: "2026-09-03"
      - name: page-in-ruling-order
        source: author
        ref: "2026-09-03"
      - name: responses-on-decisions-and-children
        source: ai
        ref: "2026-09-04"
      - name: child-ruling-held-until-the-parent
        source: ai
        ref: "2026-09-04"
      - name: unanswered-is-no-ruling
        source: author
        ref: "2026-09-04"
      - name: confirmation-before-the-ruling-stage-is-invalid
        source: commons.systems/disposition-graph/alignment-page
        ref: "2026-09-04"
    recommends: unanswered-is-no-ruling
    boldness: moderate
    stands: unanswered-is-no-ruling
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
depends:
  - commons.systems/disposition-graph/alignment-page
  - commons.systems/disposition-graph/dialogue#aspects-are-nodes
  - commons.systems/disposition-graph/viable-options
form: rule
under:
  - commons.systems/disposition-graph/growth
defines:
  - unanswered
  - answered
  - confirmation with edits
  - denial with feedback
---
## Disposition

The author, 2026-09-03, on the alignment page and what it says about confirmation:

> Not all aspects of the disposition need to be confirmed individually. ... I want a list A of the things I need to confirm about the recommended disposition. Eg. authority and permanence are on list A if confirmation is required. ... The final option on list B is always reject all choices with feedback text input. ... After the final render is an option to reject final render with text input for feedback.

> nodes (eg. commons.systems/disposition-graph/purpose) still indicate that they are edits to confirmed dispositions (there appears to be a ground version that is being diffed) even though no node is yet confirmed. This appears to be bootstrap encoding artifact. purpose node is a confirmation ruling for a node that does not yet exist on the reconciliation frontier (only on the alignment frontier).

The words in full are on `commons.systems/disposition-graph/alignment-page`, the node whose question they open.

The author, 2026-09-03:
> bootstrap operations: Due to the bootstrap nature of the current graph which needed to record (deferred) dispositions that weren't yet answered by alignment dialogue because the alignment dialogue (shim) was not yet bootstrapped. Now that the alignment dialogue does exist, all existing dispositions need to be answered by it. Classify all dispositions as unanswered (the actual status). There should be no loss of disposition encoding - it is only a reclassification to unanswered. For any unanswered dispositions that have not already received adversarial review - do so. The alignment artifact must sort unanswered nodes by rank (purpose node first) and provide inputs to confirm/confirm with edits/or deny with feedback any subset of unanswered nodes.

The author, 2026-09-03, on the sitting of dialogue, the part that answers this question:
> A conflicting answer that arises in alignment AND survives periagoge/meiutic/adversarial review is marked unanswered until confirmed.

The author, 2026-09-03, a note on the same:
> A conflicting answer that arises in alignment AND survives periagoge/meiutic/adversarial review is marked unanswered until confirmed. A conflicting answer that arises outside of alignment is a proposal.

The author, 2026-09-03, retracting the marking and stating the function it served:
> The flipping of node I suggested from answered to unanswered pending confirmation feels like a hack. At a functional level, when reading the documentation for a node that has been previously confirmed/answered I want to see if there are alternate proposals surfaced outside of alignment, or alternate answers surfaced during alignment which are pending confirmation.

The author, 2026-09-03, on the sitting of dialogue, on what grounds work while an alternative is pending:
> When an alternative is pending on ANY node with authority (ratified, deferred or delegated - remember that ratified has specific technical meaning) the previously confirmed answer keeps its full authority until an alternative is confirmed.

The author, 2026-09-03, answering the probe on the unit of a ruling:

> the revised record is to carry a decision per aspect. each aspect of a disposition may have choices that require confirmation.

The words in full are on `commons.systems/disposition-graph/alignment-page`.

## Answer

When a ruling grants it. A disposition is answered when the rulings on its facts give it a class, ratified, delegated, or deferred, the classes only the author's ruling confers, on the node or on an ancestor whose grant covers it; until then it is unanswered, whatever the node carries: a recommended answer, a draft with no recommendation, or no answer at all. Unanswered is a status the projections derive, never a field: the facts stay as they are, with their options and their recommendation, and the answer stays as it is, the draft the author rules on, so that nothing of the encoding is lost when a node changes class. Nothing on an unanswered node acts, and it is reconciled only on an explicit grant, as the authority node says.

Every node on the alignment frontier carries the dialogue, as the dialogue node defines it, and first its `stage`, the next movement owed on it: periagogic while the author's account is not yet in the record, maieutic while the answer is not yet drafted, review while the draft has not had the clean-context review, and ruling while the author's confirmation is owed. The alignment frontier is every node with no ruling, every deferred node, and every ratified node whose recommendation has moved since its ruling; the validator refuses any of them without a stage, and a delegated node carries one only when an option that would leave its delegation's scope has returned it to the author. A node with a class keeps its confirmed choice and its full authority while an option is pending beside it, whatever the option's source, until the author rules for another; the author's first suggestion, that such a node be marked unanswered until confirmed, was retracted by the author on 2026-09-03 as a hack, and the projections show the pending options beside the answer instead. The deferred stamps the bootstrap wrote before the dialogue existed conferred nothing and are gone; each of those nodes stands unanswered at the stage it has reached.

The author rules on the alignment page or in prose; what that page shows, and in what order, is the alignment-page node's question. Three responses are open, and they are open on any subset at once: confirm, confirm with edits, and deny with feedback. A response is given on a node, or on one of the decisions that node's ruling asks, which are its facts: the answer, the authority class a ruling would confer, the node's existence, and its persistence where the recommendation would change its shape; any other decision the author would rule on separately is a question and therefore a node, and is responded to as a node. A response stands whether or not the node's parent has been ruled: a ruling the author gives is a ruling, and a later ruling on the parent that contradicts it is recorded as an option on the child and put to the author, never applied over their ruling. A confirmation is recorded as a ruling on the option each fact recommends, and the class follows from the rulings: ratified when the answer fact is ruled, delegated or deferred when the ruling on the authority fact says so. A confirmation with edits rules for the option with the edits: the session applies them, and where they change substance the draft goes through the review again before the ruling is recorded. A denial with feedback is a kickback, classified by the recording node to the movement it calls for, and the feedback is recorded as the author's words, never as a ruling; a denial on one decision is a kickback on that decision, and the node returns to the movement the feedback calls for carrying the rulings given on its other decisions. No fourth response is needed: deferring is a choice on the authority fact, not a way of leaving the node unconfirmed. A confirmation given on a node whose review has not run is held until the review runs and recorded when the review forwards it. Nothing the author has not confirmed is doctrine, and nothing in the record is exempt from the dialogue.

## Rationale

The author's ruling of 2026-09-03, quoted above. The bootstrap wrote its answers stamped deferred because the dialogue that alone confers a stamp in the author's name did not yet exist, and the author's ruling on the authority node of 2026-09-02, that the first valid ratifications will be the outputs of this first alignment dialogue, already said that none of them was answered. What changed on 2026-09-03 is the classification. The record had two words for two things: "un-aligned disposition" for a node with no answer, hidden from the browser and listed by the alignment page, and the stamp's class for everything else, so that a deferred answer read as an answer in every projection although the author had not ruled on it. Re-evaluated at the author's direction the same day, the encoding needed one status derived from the stamp and the answer, answered or unanswered, and one rule, that an unanswered node carries its stage, so that the review queue is a listed dialogue the validator holds rather than a reading of the stamps. The un-aligned disposition keeps its name and its shape: it is the unanswered node with no answer yet, which the browser hides because it has nothing to show; every other unanswered node shows in the browser as the draft it is, marked with its stage, because the browser is the record's own documentation and the draft the author reads there is the draft the author rules on.

Why a confirmation ratifies: the recording node makes the confirmation the last movement before the stamp, and the three responses the author asked for are the ruling's three outcomes as that node classifies them, recorded, refined, or kicked back; a fourth response, defer, is not needed, because leaving a node unconfirmed is the deferral. Why the purpose node first: rank alone puts the public graph's root above this project's, since the purpose node stands under it, while the author's order recorded on the scope node begins at purpose; listing each graph in the manifest's order, by rank within it, gives the author's order without touching a rank. Rejected: reading the earlier ruling that unanswered nodes are hidden from the browser as covering every unanswered node, which would empty the browser of the record it documents; that ruling was made of nodes with no answer and is kept for them. Rejected: a fourth authority class, or a field, for unanswered, since the status is derived from the stamp and the answer and a stored copy would drift; marking an answered node unanswered while an alternative is pending, the author's own first suggestion of 2026-09-03, retracted by the author the same day, since a pending alternative is dialogue state beside the answer and the answer's authority does not lapse until one is confirmed, as the author ruled that day, quoted above. Rejected: leaving the deferred answers without a stage, which would keep the queue a reading of the stamps instead of a dialogue the page lists. Not adopted from the incumbent record: review-item nodes and a curriculum, since the queue is the unanswered nodes themselves.

Amended 2026-09-04 under the author's bootstrap grant of that day, recorded on the viable-options node, from the author's words there: "Is 'unanswered' just an authority - as in no authority granted for reconciliation"; "In this model 'delegated' and 'deferred' authority mean reconciliation authority is granted for AI recommendation without requiring confirmation. Delegated means the node is removed from the alignment frontier and deferred means it remains." Unanswered is the absence of a ruling and deferred a class the author confers, so the ground given above for needing no fourth response, that leaving a node unconfirmed is the deferral, no longer holds and is replaced: the deferral is a choice on the authority fact. The status stays derived, the three responses stand, and the responses per decision of `responses-on-decisions-and-children` are kept, the decisions being the facts. The answer as it stood is kept as the option `answered-by-stamp`, and the review of this text is owed.

## Facts

### answer

#### answered-by-stamp

The answer as it stood on 2026-09-03: a disposition is answered when its stamp is ratified or delegated; unanswered is derived from the stamp and the answer; a deferred stamp is unanswered; the three responses are given on the node. Viable if the author prefers the stamp; `responses-on-decisions-and-children` is the same answer with the responses given per decision.

#### page-in-ruling-order

This answer lists every unanswered node on the alignment page in rank order, the purpose node first. The alignment-order draft orders the alignment frontier by the ruling order, the node whose ruling settles the most first, with rank as tie-break; the alternative amends the page order accordingly, and amends "the purpose node first" with it: on the amended count, which counts what a ruling makes decidable elsewhere and not the alternatives it closes on itself, the first node is commons.systems/public/agency, the sole root, whose unanswered subtree is every other node in the record, and the purpose node is second, its only child. The page pages in one order across the manifest's graphs, the graph shown as a label on each node, since a graph precedence would put a descendant's ruling before its ancestor's. Raised on commons.systems/disposition-graph/alignment-order, from the author's words of 2026-09-03 recorded there.

#### responses-on-decisions-and-children

The description of the alignment page leaves this answer for the node that asks the page's question, which subsumes `page-in-ruling-order`, and the three responses gain two rules the record did not have. A response may be given on one of the decisions a node's ruling asks, the reserved facts the dialogue node names, and a denial on one decision is a kickback on that decision while the responses on the others are kept. And a response on a node stands whether or not its parent has been ruled, with a later parent's ruling that contradicts it recorded as an alternative on the child and put to the author rather than applied over their stamp. Adopted by the recommendation, and set out in the fence.

#### child-ruling-held-until-the-parent

A confirmation on a child given while the parent is open is held and recorded when the parent is ruled, by analogy with the confirmation held until the review runs. Against it: the review is a step in producing the draft the author is confirming, so a confirmation before it confirms something unfinished, while a parent's ruling is no part of producing the child's draft. Holding a ruling the author gave would make their ratification wait on a question they did not ask about, and the alignment-order node is explicit that the author's choice of what comes next is their own order.

#### unanswered-is-no-ruling

Unanswered is the state of a node no ruling grants: nothing on it acts, and it is reconciled only on an explicit grant. Deferred is not that state but a class the author confers on the authority fact, beside ratified and delegated, under which the recommendation acts and the node stays on the alignment frontier; the answer's ground for rejecting a fourth response, that leaving a node unconfirmed is the deferral, no longer holds, and no fourth response is needed, since the deferral is a choice on a fact. The alignment frontier becomes every node with no ruling, every deferred node, and every ratified node whose recommendation has moved since its ruling. The three responses and the status derived rather than stored are unchanged. Raised on commons.systems/disposition-graph/viable-options, from the author's words of 2026-09-04 recorded there.

#### confirmation-before-the-ruling-stage-is-invalid

A confirmation given on a node that has not reached the ruling stage, on the page or in prose, is not held and confers nothing: it is recorded as the author's words and the dialogue proceeds from its stage, and the page renders its inputs disabled there. This supersedes the standing sentence that a confirmation given before the review has run is held until the review forwards it, on the author's words of 2026-09-04 recorded on commons.systems/disposition-graph/alignment-page: "Confirmed responses for nodes that are not at the confirmation stage of dialogue are invalid. Show the facts with pending confirmation, and recommendations, but disable to input." Raised by that node's clean-context review of 2026-09-04, which found the supersession recorded nowhere here.
## Account

### Recording of 2026-09-03

The author's words quoted above are recorded as this node's answer, stamped deferred. The author's: the classification of every disposition as unanswered with nothing lost, the review of what had not been reviewed, and the page's order and its three responses. The AI's, open to the author's ruling: the encoding, one derived status and a stage on every unanswered node; the reading that the browser keeps showing the drafts and hides only nodes with no answer; the meaning given to each response, a confirmation ratifying, edits applied with a second review when they change substance, a denial classified as a kickback; and the placement of the public graph after this project's on the page. Done the same day: every node without a stage was set to review and the review ran on every node at that stage; the reader derives the status and refuses an unanswered node without a stage, the frontier and the browser show the status and the stage, and the alignment page lists every node with a stage in the order this node fixes and offers the three responses; the alignment skill reads them. The review recorded below read the state of the morning, before that tooling landed.

Facts: authority ratified; boldness moderate, the classification and the three responses being the author's words and the encoding and the meanings of the responses the AI's; persistence standing.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer, paragraph 2: 'The validator refuses an unanswered node without a stage, and an answered node carries one only while its ratification is under review.' Neither rule is in the validator. packages/disposition/read.mjs enforces exactly three: a node with no '## Answer' must carry stage; a '## Disposition' requires stage; a stage requires a '## Disposition' or a '## Proposal'. A node with a deferred stamp, an answer and no stage passes, and an answered node may carry a stage at any time. Suggested edit: keep the rule and say it is owed.
- Proposal, 'Done the same day': 'the validator, the frontier, the browser, and the alignment page were reconciled to this node.' Three of the four are false as of this reading. The validator, above. The browser renders no stage at all — the string does not occur in packages/disposition/browser-template.html, whose pill comes from STATUS_WORD (ratified, delegated, deferred, proposal, un-aligned). The alignment page groups by stage in the fixed order ruling, review, maieutic, periagogic and ranks only within a group (groupAlignmentItems), so it is neither 'in rank order' nor 'this project's graph ... and then the public graph's': commons.systems/public/agency at rank 1.0000 is the seventh item, and the three public nodes lead the review group. Suggested edit: state the gaps; the author is being asked to confirm an account of work as well as a rule.
- Answer, paragraph 3: 'the author may confirm, confirm with edits, or deny with feedback', with the Rationale rejecting a fourth: 'a fourth response, defer, is not needed.' The page as built offers four — 'Ratify as shown', 'Ratify with edits', 'Defer', 'Overrule' — and recording's answer classifies both a deferral and an overrule. Suggested edit: reconcile the response vocabulary across this node, recording and the page in one place.
- Answer, paragraph 1: 'Unanswered is a status the projections derive, never a field.' No projection derives it: deriveStatus returns the stamp's class, or 'proposal' for an answer with no stamp, or 'unaligned' for no answer, and the word 'unanswered' appears in no projection. A reader of the browser or the frontier cannot see the status this node defines. Suggested edit: say the derivation is owed, or name which projection is to carry it.

On the three facts: 'Authority ratified if the author confirms; boldness moderate, the classification and the three responses being the author's words and the encoding and the meanings of the responses the AI's; persistence standing' is well formed: one class, one boldness value, and an honest split of the author's from the AI's. It should add that the 'Done the same day' reconciliation claims are not all true, since a confirmation here endorses that account as well as the rule.

Strongest counter-argument (moderate): Reclassifying every deferred answer as unanswered loses nothing formally, and changes what the record is while the record is in use. Fifty-odd nodes now sit in one undifferentiated queue with no distinction between an answer written that morning from the author's quoted words and one written two days earlier from the AI's own knowledge, and the author must rule on all of them one at a time through a dialogue whose own rules are themselves in the queue. The alternative the node rejects — leave the deferred stamps as the review queue, which authority already called them, and put a stage only where a dialogue is actually open — preserves the same guarantee, that nothing unconfirmed is doctrine, at a fraction of the ceremony. What the reclassification bought is a word; what it cost is a record that describes itself as entirely unanswered while every session works under it.

The session's reply: The findings read the morning's state, and the afternoon's tooling answered them: the reader derives the status and refuses an unanswered node without a stage, the browser and the frontier show both, and the alignment page lists every node with a stage in this node's order and offers exactly the three responses the answer names, the page's earlier four having been the projector's and not the record's. The proposal's account of what was done is corrected above. On the counter-argument: the deferred stamps were the review queue in name only, since nothing listed them or said what each was owed; the stage says it, and the record describing itself as unanswered is the author's classification, quoted above, not the AI's.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer, paragraph 2: 'The validator refuses an unanswered node without a stage.' Verified true: read.mjs raises '<id> is unanswered and must carry stage' from deriveStatus. The previous review's finding is resolved. The second half, 'an answered node carries one only while its ratification is under review', is not enforced and cannot be tested, since no answered node exists.
- Answer, paragraph 1: 'Unanswered is a status the projections derive, never a field.' Verified now true: deriveStatus returns 'unanswered' and the frontier and browser both print it. Resolved.
- Answer, paragraph 3: 'the author may confirm, confirm with edits, or deny with feedback', with the Rationale rejecting a fourth. Verified the page now offers exactly three (RESPONSE_CHOICES: confirm, edit, deny). But twenty-four nodes' Proposals still close with 'Rulings open: ratify as shown; ratify with edits; defer; overrule' and nine with 'take the recommended option; take another option by number; defer; answer in prose'. The response vocabulary is settled here and unsettled everywhere else.
- Answer, paragraph 3: 'The page lists every unanswered node of this project's graph in rank order, the purpose node first, and then the public graph's.' Verified true of orderAlignmentItems. Resolved.
- Answer: 'A confirmation given on a node whose review has not run is held until the review runs.' Five nodes are at the review stage today (checkpoint, clean-context-review, frontier-consistency, second-stop, work-loop), so this rule is live for the author's next sitting and the page says so in its stage hint.

On the three facts: The frontmatter recommendation (ratified, moderate) states one class and one value and splits the author's from the AI's honestly. The 'Done the same day' account in the Proposal is now true where the previous review found three of four claims false; it should be updated to say so, since a confirmation endorses that account as well as the rule.

Strongest counter-argument (moderate): Reclassifying every deferred answer as unanswered loses nothing formally and changes what the record is while the record is in use. Sixty-two nodes now sit in one queue with no distinction between an answer written that morning from the author's quoted words and one written two days earlier from the AI's own knowledge, and the author must rule on all of them through a dialogue whose own rules are in the queue. The session's reply — that the stage says what each is owed where the deferred stamp did not — is a real gain and is now visible in the frontier and the page. What is not answered is the volume: forty-eight nodes are before the author at review or ruling in one sitting.

The session's reply: Validated: the validator refuses an unanswered node without a stage, the status is derived, the page offers the three responses and lists in rank order. The thirty-three Proposal lines now use those three responses. This node is the survivor of the vocabulary and of the classification, and nothing in it is redrafted. The 'Done the same day' account is true now. On the counter-argument, the volume before the author: the ruling order the batch recommends is on the page, agency first. Stage ruling.

### Frontier finding, 2026-09-03

Kind: contradiction.

Three response vocabularies are live for one act. Unanswered: 'the author may confirm, confirm with edits, or deny with feedback', with 'a fourth response, defer, is not needed'. Recording's Answer classifies four outcomes: 'A confirmation as shown, or the recommended option taken, is recorded ... A deferral leaves the answer deferred; an overrule records what the author said stands.' Growth restates unanswered's three. The alignment page implements exactly three (RESPONSE_CHOICES: confirm, edit, deny in packages/disposition/project.mjs). Meanwhile twenty-four node Proposals close with 'Rulings open: ratify as shown; ratify with edits; defer; overrule' and nine with 'take the recommended option; take another option by number; defer; answer in prose' — a fourth and fifth wording, neither matching the page the author will use.

Also named: commons.systems/disposition-graph/recording, commons.systems/disposition-graph/growth.

Proposed: Unanswered is the survivor: it defines the responses and the page implements them. Recording cites unanswered rather than restating, and recasts its second step as the classification of each of the three responses (a deferral being a node left unconfirmed, an overrule being a denial with feedback). Growth cites unanswered for the page's responses instead of restating them. The thirty-three Proposal closing lines are rewritten to the three words the page uses, which is a mechanical pass the session can do at the recording.

### Frontier finding, 2026-09-03

Kind: supersession.

The author, quoted on transience: 'Unanswered nodes are hidden from the browser artifact and listed by the alignment artifact.' Later the same day the author classified every disposition as unanswered ('Classify all dispositions as unanswered ... There should be no loss of disposition encoding'), which makes the earlier words, applied literally, empty the browser. Projection's amendment records the reconciliation and its counter-argument names it squarely; transience still carries the earlier rule as its own ('hidden from the browser and listed by the alignment page') with no note that its scope was narrowed by the later ruling; unanswered argues the narrowing in its rationale under 'Rejected'. The superseded words are answered by transience and the superseding words by two other nodes.

Also named: commons.systems/disposition-graph/transience, commons.systems/disposition-graph/projection.

Proposed: Unanswered is the survivor of the classification and projection of the browser rule. Transience's un-aligned paragraph cites unanswered for the status and projection for what the browser shows, and drops its own restatement of the hiding rule; projection's answer keeps the amended sentence and adds one clause saying it narrows the author's earlier words, which is what projection's own counter-argument asks for and what the author must rule on.

### Frontier finding, 2026-09-03

Kind: decomposition.

Transience's un-aligned paragraph now enumerates the whole dialogue — 'the author's words, verbatim and dated, in a `## Disposition` section; the AI's account ... in a `## Proposal` section; `stage` ... and, from the review stage on, the recommendation's facts and the review's state as data' — which is dialogue's entire answer, and it states the status rule, which is unanswered's. Its own amendment review flagged the double definition of 'stage' and the frontmatter defines list was fixed; the prose enumeration was not. The result is that three nodes carry the same list and drift between them is invisible until they are read together, which is what this survey is for.

Also named: commons.systems/disposition-graph/transience, commons.systems/disposition-graph/dialogue.

Proposed: Dialogue is the survivor of what an unanswered node carries and unanswered of the status. Transience's un-aligned paragraph reduces to two sentences: that an un-aligned disposition is a node with a question and no answer, and that it carries the dialogue as dialogue defines it and has no children. Everything else in that paragraph moves to, or is already in, dialogue and unanswered. The five-shape taxonomy, which is what the node is for, is untouched.

### The author's words of 2026-09-03 on dialogue

The sentence quoted above says what becomes of a conflicting answer that survives the dialogue: it is marked unanswered until confirmed. The answer says when a disposition is answered and does not say what an answer in conflict with a recorded one is, nor whether the node it conflicts with stays answered while the conflict is open; the stage returns to maieutic for that. The whole disposition is on the dialogue node, whose sitting carries it.

### The author's retraction, 2026-09-03

The sentence carried above, that a surviving conflicting answer is marked unanswered until confirmed, is retracted by the author's words of the same day as a hack. What stands in its place is the function: an answered node with an alternative pending on it, a proposal from outside alignment or an alternate answer from inside it, keeps its stamp and shows the pending alternative to its reader. This node's answer already says the status is derived and never a field, and that an answered node carries the dialogue while its ratification is under review, keeping its stamp until the author rules; the redraft under the sitting on dialogue extends that from ratification under review to any pending alternative, and this node's part of it is whether the standing answer keeps its authority meanwhile, put to the author in the maieutic movement.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `pending-alternative-keeps-stamp` (author, 2026-09-03); `standing-keeps-authority` (author, 2026-09-03).
The recommendation adopts `standing` and is pinned to the standing text as it was at that commit.
Merge analysis of the author's words: 2026-09-03, own-question: Because the bootstrap recorded deferred dispositions before the alignment dialogue existed, every disposition is reclassified as unanswered with no loss of encoding, anything not yet adversarially reviewed is reviewed, and the alignment artifact sorts unanswered nodes by rank with purpose first and offers confirm, confirm with edits, and deny with feedback on any subset. 2026-09-03, own-question: A conflicting answer that arises in alignment and survives periagoge, maieutic and adversarial review is marked unanswered until confirmed. 2026-09-03, own-question: The same marking rule, with the addition that a conflicting answer arising outside alignment is a proposal — the second sentence answering authority's question and already carried there. 2026-09-03, own-question: The flip from answered to unanswered pending confirmation is retracted as a hack; what the author wants at the functional level is to see, on a node already confirmed, the proposals surfaced outside alignment and the alternate answers pending confirmation. 2026-09-03, own-question: When an alternative is pending on any node with authority, the previously confirmed answer keeps its full authority until an alternative is confirmed.
Moved to other nodes as alternatives: `cite-unanswered-responses` on commons.systems/disposition-graph/recording; `cite-unanswered-for-page-responses` on commons.systems/disposition-graph/growth; `reduce-un-aligned-paragraph` on commons.systems/disposition-graph/transience; `narrowing-clause` on commons.systems/disposition-graph/projection.
The census unit's note: The node carries an answer and no draft, so the recommendation adopts the standing text. Two alternatives are pending, both in the author's own later words: that an answered node with a pending alternative keeps its stamp and shows what is pending, which the author gave when retracting the flip to unanswered, and that a standing answer keeps its full authority meanwhile. The marking rule of the earlier blocks is not an alternative because the author retracted it themselves. Excluded as already ruled: the counter-argument's proposal to leave the deferred stamps as the queue and put a stage only where a dialogue is open, which the rationale rejects by name. Moved elsewhere: the response-vocabulary finding to recording and growth, the decomposition finding to transience, the supersession finding to projection.

### Alternatives merged, 2026-09-03

The alternatives raised on this node by more than one census cohort were merged at the re-encoding, and any alternative the standing answer already carries was removed: `pending-alternative-keeps-stamp` dropped, Carried by the answer's sentence 'an answered node carries one while an alternative is pending on it, from the alignment dialogue or from a proposal outside it, keeping its stamp and its full authority, whatever its class, until an alternative is confirmed; the author's first suggestion, that such a node be marked unanswered until confirmed, was retracted by the author on 2026-09-03 as a hack, and the projections show the pending alternatives beside the answer instead', together with the page listing 'the alternatives pending with their sources'; `standing-keeps-authority` dropped, Carried by the same sentence: an answered node with an alternative pending keeps 'its stamp and its full authority, whatever its class, until an alternative is confirmed', which is the author's words that a pending alternative does not unanswer a node. The merge unit's note: Both entries drop, so the `alternatives` list becomes empty and the `## Alternatives` section must be removed with it: the validator requires the section present iff the list is non-empty. The node keeps its stage and its recommendation of `standing`.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Verified true, all four of the previous readings' open claims: `read.mjs` raises '<id> is unanswered and must carry stage', `deriveStatus` returns 'unanswered' and the frontier and browser print it, the page offers exactly the three responses the answer names, and `orderAlignmentItems` lists this project's graph in rank order before the public graph's. The node's 'Done the same day' account is now accurate where a previous reading found three of four claims false.
- Answer, paragraph 2: 'an answered node carries one while an alternative is pending on it ... keeping its stamp and its full authority, whatever its class, until an alternative is confirmed'. This is the author's ruling in quoted words and it is untestable today, since no node is answered. It will become live at the first ratification, and nothing in the record says what happens to the twenty-six review-stale pins at that moment.
- Answer, paragraph 3: 'A confirmation given on a node whose review has not run is held until the review runs and recorded when the review forwards it.' Verified live for this batch: thirty-seven nodes are at the review stage and this rule governs every one of them at the author's next sitting.
- The node's `alternatives` list is empty and its '## Alternatives' section correctly absent — the two author-sourced entries were dropped at the re-encoding because the standing answer carries them word for word. Verified: the answer does carry both. This is the encoding working as dialogue's answer describes.
- The node carries five dated author quotations under '## Disposition', including the retraction, so it is one of the better-grounded nodes in the batch for a ratified stamp.

On the three facts: The frontmatter recommendation (adopts standing, ratified, moderate) states one class and one value and the pin is current, and the split it names — the classification and the three responses the author's, the encoding and the meanings of the responses the AI's — is honest and among the best-formed in the batch. Every implementation claim in the node is verified true as of this reading. Persistence standing follows from the node's shape.

Strongest counter-argument (moderate): Reclassifying every deferred answer as unanswered loses nothing formally and changes what the record is while the record is in use: sixty-eight nodes now sit in one queue with no distinction between an answer written that morning from the author's quoted words and one written two days earlier from the AI's own knowledge, and the author must rule on all of them through a dialogue whose own rules are in the queue. The session's reply — that the stage says what each is owed where the deferred stamp did not — is a real gain and is now visible in the frontier and the page. What is unanswered is the volume: forty-three nodes stand at review or ruling in one sitting, and the record offers a ruling order only as a review's recommendation that nothing consumes.

The session's reply: Forward accepted. The retraction and the authority-keeping rule are the author's in quoted words; what happens to review-stale pins at the first ratification is accepted as a finding for the author.
### The author's dispositions of 2026-09-03, and where they fall

The words are in the Disposition section above and in full on
`commons.systems/disposition-graph/alignment-page`. Two halves reach this node
and they resolve differently.

The encoding half, that nodes read as edits to confirmed dispositions when
nothing is confirmed, is not a defect in this node's answer. This node already
enumerates the three carrying-states of an unanswered node, "an answer stamped
deferred, an answer with no stamp, or no answer at all", and already says the
status is derived and never a field. The defect is that
`commons.systems/disposition-graph/dialogue` gives every recommendation an
`amends` pin against a standing text and names the node as it stands an
unlisted candidate, unconditionally, so nothing downstream can tell the second
state from the third. It is recorded there, as the finding "a first answer is
presented as an amendment" and the alternatives
`first-answer-is-not-an-amendment` and `caption-only`, with the clean-context
correction that withdrew an earlier draft of both.

The confirmation half does fall here. This node's answer opens confirm, confirm
with edits, and deny with feedback "on any subset of them, at once", where they
are the unanswered nodes. The author now asks for confirmation on a subset of
the aspects within one node, with a rejection open on each aspect and a second
rejection open on the whole as it renders. That is an amendment to this
sentence, and it is why this node has gone back from ruling to maieutic. What
it will say depends on the probe outstanding on `alignment-page`: whether the
aspects are derived from what the record already carries, in which case this
answer gains a clause about the granularity of a response and nothing else, or
recorded on the node, in which case this answer and `dialogue`'s both change
and the review of 2026-09-03 on each is spent. The clean-context review had
already raised the question as `partial-ratification` on
`commons.systems/disposition-graph/growth`, where it is unruled.

The standing `recommendation` on this node, adopting `standing` with a forward
review of 2026-09-03, is superseded by the author's words of the same day and
is left in place only so its review pin is not lost.

### The maieutic movement of the alignment-page sitting, 2026-09-04

This node was moved off the ruling stage on 2026-09-03 because the author's
words of that day, that the record carry a decision per aspect, contradicted
what its forwarded recommendation rested on: its three responses are open "on
any subset of them", where "them" is the unanswered nodes and not the decisions
within one. The recommendation now answers that, and answers a second thing the
`dialogue` node named as this node's cascade, a response given on a child while
the parent is still open.

**Responses on a decision.** Under `dialogue`'s `aspects-are-nodes` the
decisions a node's ruling asks are its answer, where alternatives are pending,
and three reserved facts, the authority class, the node's existence, and its
persistence where the recommendation would change the node's shape. Anything
else the author would rule on separately is a question and therefore a node.
So the extension this answer needs is small and exactly bounded: the subset the
three responses open on now includes those decisions, and a denial on one is a
kickback on that one, with the other decisions' responses kept rather than
discarded with it. That last clause matters on the page: without it, rejecting
one row of a screen throws away every other row the author had answered.

**Responses on a child.** The rule is that the ruling stands. It follows from
`authority` and not from a judgment of this sitting: ratified means the author
decided and wants to be asked before it changes, so a later ruling on the
parent that contradicts the child cannot silently undo it, and is recorded as
an alternative on the child and put to the author like any other conflicting
answer. The symmetric-looking rule, that the child's confirmation be held until
the parent is ruled, is recorded as `child-ruling-held-until-the-parent` and
rejected in the rationale, because the analogy it rests on does not hold: the
review is a step in producing the draft the author confirms, and a parent's
ruling is not.

**The page's description leaves.** This answer described the page in a sentence
and a half, including an order that `alignment-order` had already amended and
that this node's own `page-in-ruling-order` alternative records. The whole
description goes to `alignment-page`, which subsumes that alternative; what
stays here is what this node owns, the three responses and what each one does.
This is the same correction made on `growth` in this sitting, and it is the
same cause: the page had no node, so three nodes described it.

**Facts.** Adopts `responses-on-decisions-and-children`. Authority ratified,
since a mis-specified response is a ruling the author did not give. Boldness
low: the reserved facts are `dialogue`'s fence, the child rule is `authority`'s
own sentence, and the hand-over is `alignment-page`'s answer. Persistence
standing.

`depends` records that this node's ruling waits on `alignment-page`, without
whose answer the description would leave with nowhere to go, and on
`dialogue#aspects-are-nodes`, without which the reserved facts do not exist.

Not reviewed. The clean-context review is owed on this and on the batch.

### Where the page contradicted this node, 2026-09-04

The author read `commons.systems/public/agency` on the published page and
found it offering, as the first choice on the graph's root question, "standing
(the node as it stands)" — on a node they have never answered. The four
findings are recorded on `commons.systems/disposition-graph/alignment-page`,
whose question the page is.

Recorded here because the first of them is this node's answer violated in
implementation and nowhere else. This node says every node is unanswered until
the author confirms it, and `authority` says a deferred answer is unanswered
until the author rules; the author's ruling of 2026-09-03 reclassified every
deferred answer in the record on exactly that ground. The projector then tested
for a stamp of any class and called the result "standing", so on 33 of the 72
staged nodes the page told the author a confirmation would ratify the node "as
it stands" when no node in the record is ratified at all.

Nothing in this node's answer or its recommendation changes. The evidence runs
the other way: the rule was right, was not projected, and the page reintroduced
the distinction the author's ruling had just collapsed. It is worth one line
because it is the second time this shape has appeared — a doctrine that holds
in the graph and lapses in the artifact projected from it — and the answer to
it is projection, not more doctrine.
