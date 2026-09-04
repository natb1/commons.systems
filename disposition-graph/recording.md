---
question: How is a disposition confirmed and recorded?
stage: maieutic
recommendation:
  adopts: responses-classified-per-decision
  class: ratified
  boldness: low
  amends: "75336fcff7555274971f7db32a861b19c5651f4e"
  at: "919cea3b"
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: 75336fcff7555274971f7db32a861b19c5651f4e
alternatives:
  - name: move-the-quotations-into-a-disposition-section
    source: review
    ref: "2026-09-03"
  - name: deferred-rather-than-ratified
    source: review
    ref: "2026-09-03"
  - name: mechanical-checks-instead-of-a-full-reading
    source: review
    ref: "2026-09-03"
  - name: cite-reviewers-world
    source: review
    ref: "2026-09-03"
  - name: cite-unanswered-responses
    source: review
    ref: "2026-09-03"
  - name: responses-classified-per-decision
    source: ai
    ref: "2026-09-04"
  - name: stage-per-decision
    source: ai
    ref: "2026-09-04"
depends:
  - commons.systems/disposition-graph/unanswered
  - commons.systems/disposition-graph/dialogue#aspects-are-nodes
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-03
under:
  - commons.systems/disposition-graph/growth
defines:
  - confirmation
  - kickback
  - clean-context review
  - steelman
---
## Answer

In three steps after the maieutic stage, the first before the author sees the recommendation and the other two after. First, every recommended disposition is reviewed adversarially by a subagent that starts with no context but the record: the record as the clean-context-review node names it, the whole unanswered frontier among it, whose consistency with itself is the review's to check, as the frontier-consistency node describes. The reviewer judges whether the answer says what the author said and quotes every ruling it rests on; whether it contradicts the record it joins, or a tradition it cites, without recording the divergence; whether its stamp, boldness, and persistence class are the ones the session means to present; whether an executor reading it would take a wrong action; and what the strongest argument against the disposition is. Its verdict is per disposition: forward to the author, or kick back to the periagogic or the maieutic stage with findings. A forwarded disposition reaches the author with the reviewer's strongest counter-argument, when the reviewer found one worth the author's time, and the session's account of why the disposition stands regardless; when the review found no strong counter-argument, the recommendation goes alone and says so. Second, the author responds in one of the three ways the unanswered node defines, and the session classifies the response. A confirmation as shown, or of the recommended option, is recorded. A confirmation with edits, or a denial with feedback, is analysed for where the dialogue must resume: at the periagogic stage when the response shows the author has lost hold of the record's ground, asking for what the record forbids for a reason they have not engaged, or contradicting an ancestor they have not cited; at the maieutic stage when the response is ambiguous while the AI's understanding of the ground is complete, so the intention must be drawn out again with visible drafts; or, in the common case, the draft is refined with the author's edits and put back for confirmation. A node left unconfirmed stays unanswered at its stage; a denial records what the author said, and the dialogue resumes from it. Third, the recording: the stamp is written, the author's words are quoted into the rationale, the dialogue fields are removed, the Disposition section excepted as the quotes ruling decides, and the node is landed. The recommended dispositions of a round are sent to review together, one batch over the whole unanswered frontier in one clean context, as the clean-context-review node describes, and each moves on its own verdict; one that is kicked back never holds the others. The reviewer recommends and never writes; the session decides and answers for the record. No disposition is confirmed without the review and none is stamped without the confirmation.

## Rationale

The author's disposition of 2026-09-03: "incumbent graph describes subagent, clean context adversarial review of all dispositions just prior to recording. Record this disposition (do not copy it verbatim, you are not bound by the incumbent, evaluate greenfield and write from scratch) and reconcile the alignment shim. ... It occurs at the granularity of the disposition - adversarial review should batch author confirmed dispositions, but dispositions unvalidated by adversarial review must not block validated dispositions. Instead, adversarial review may recommend to the main alignment thread kicking a disposition back to periogoge, maietic or author confirmation with additional context and edits." Amended the same day: "Change of adversarial review disposition: adversarial review happens after maieutic, before confirmation. This way the author can review any steelman counter argument as a standard part of confirmation review, and why AI thinks the disposition stands regardless (but steelman argument is optional, if adversarial review returns no strong counter argument)". And on the response: "Dispositions not validated verbatim during author confirmation using the alignment artifact follow a similar kickback analysis by the alignment skill. Based on author input on unconfirmed dispositions kick back to either periogogue (if there seems to be fundamental misunderstanding on author's part), miaeutic (if there is ambiguity and fundamental understanding on AI part) or just update the unanswered disposition with refinements to re-attempt confirmation (most likely case)."

Why a second reader with no context: the session that ran the dialogue shares the author's framing and its own, and the defects that survive a dialogue are the ones both parties stopped seeing, a ruling paraphrased rather than quoted, a contradiction with a node neither re-read, a sentence that reads one way to the two of them and another way to an executor. A reader given only the record sees what the record says. Why before the confirmation: the author rules better with the strongest case against in front of them, and a review after confirmation would either second-guess a ruling or review a draft the author has not yet seen changed. Why per disposition and non-blocking: the reviews of a round are invoked together, but each reviewer reads for itself, since a shared reading carries one node's framing into the next, and a verdict that held one disposition hostage to another would turn the review into a gate. The author, 2026-09-03, on the review as a skill with a context per node, is quoted on the clean-context-review node; until that day the reviews of a round ran in one context, and the batch sentence above was amended at the author's ruling. Why the reviewer recommends and never writes: authority attenuates and nothing writes up; the session holds the dialogue and answers for the record. Rejected: a fixed checklist as the reviewer's brief, because the findings that matter are the ones no list anticipated, so the brief states what the review judges and leaves how to the reviewer; a steelman on every item whether or not one was found, because a manufactured objection is paper doubt and costs the author's attention; the incumbent's mechanics, its gate script and its workflow, because they were built for a record with phases and tactics, which this record does not have.

Traditions, owed as readings: the office of the promotor fidei (Sixtus V, 1587; reformed 1983), adopted for a standing adversary to every candidate and diverged from in that the adversary here cannot stall, only send back or object on the record; blinded peer review, adopted for the independence of the reader's context; the four-eyes principle of financial control, adopted for a second reader before every write to the record; Peirce on paper doubt, adopted for the optional steelman. The evaluation node's rule that adversarial review of one's own output is part of producing it still holds; this node adds the reader who did not produce it.

## Alternatives

### move-the-quotations-into-a-disposition-section

The placement finding verified that this node carries no Disposition section although its rationale quotes the author three times with dates, and that authority makes a ratified stamp invalid without the ruling in the record. This alternative moves those quotations into a Disposition section before any stamp is written, which also makes the alignment page show them, since the page renders the author's words only from that section.

### deferred-rather-than-ratified

The same finding offers the other branch: if the quotations are not moved, the recommendation changes from ratified to deferred, on the ground that a ratified stamp the node cannot support is worse than an honest deferral. It bears on this node as one of the twenty-two carrying no Disposition section while recommending ratification.

### mechanical-checks-instead-of-a-full-reading

Both reviews' strongest counter-argument is that a mandatory, unbounded second reading of the record before every confirmation buys what a check would catch: the node's own failure modes are mechanical, a ruling is quoted with its date or it is not, a shim's artifact exists or it does not, a cited command runs or it does not. The alternative answer is that the review is a set of checks over the frontier plus a narrower reading, rather than a whole reading per batch. The session replied that the checks become instruments as the reader grows but that the whole reading stays by the author's ruling, so the alternative is live and unruled.

### cite-reviewers-world

The frontier finding of 2026-09-03 records that recording describes the reviewer's world as the nodes a draft joins up to its ceiling while clean-context-review describes it as the answered nodes they join up to the roots; the two rules coincide only while nothing is ratified, and ceiling is defined by under, which is itself at the maieutic stage. Clean-context-review is the survivor. Recording's sentence cites it instead of restating the input set, which also removes the only use of ceiling outside the under node. (Raised on commons.systems/disposition-graph/clean-context-review.)

### cite-unanswered-responses

The contradiction finding carried on unanswered proposes that recording cite unanswered for the author's three responses rather than restating four outcomes of its own, and recast its second step as the classification of each of the three: a deferral being a node left unconfirmed, an overrule being a denial with feedback. Three response vocabularies are live for one act and the page implements only unanswered's three. (Raised on commons.systems/disposition-graph/unanswered.) Also raised on commons.systems/disposition-graph/growth.

### responses-classified-per-decision

The classification step takes a response given on one of the decisions a node's ruling asks as well as one given on the node: it moves the whole node, since a node has one stage, and the responses on the node's other decisions are written onto them as rulings and survive the kickback. The recording step takes the stamp's class from the ruling on the node's authority fact rather than from the recommendation, which no longer carries one, and records a prune ruling before the node is deleted. A ruling given while the node's parent is open is recorded like any other, with a contradicting parent's ruling later recorded as an alternative on the child. Adopted by the recommendation, and set out in the fence.

### stage-per-decision

Each decision carries its own stage, so a kickback on one leaves the others where they were and the author is not shown a node returned wholesale to the maieutic stage over one row. Against it: the dialogue node makes the stage the node's, the single next movement owed on it, and a node carrying four stages cannot answer what is owed; the ruling order and the frontier both read one stage per node, and the alignment page's rail shows one. The answer keeps one stage and gets the same benefit by keeping the other decisions' rulings.

## Recommendation

```markdown
---
question: How is a disposition confirmed and recorded?
form: rule
authority:
  class: ratified
  by: Nathan Buesgens
  date: <the date of the ruling>
under:
  - commons.systems/disposition-graph/growth
defines:
  - confirmation
  - kickback
  - clean-context review
---
## Answer

In three steps after the maieutic stage, the first before the author sees the recommendation and the other two after. First, every recommended disposition is reviewed adversarially by a subagent that starts with no context but the record: the record as the clean-context-review node names it, the whole unanswered frontier among it, whose consistency with itself is the review's to check, as the frontier-consistency node describes. The reviewer judges whether the answer says what the author said and quotes every ruling it rests on; whether it contradicts the record it joins, or a tradition it cites, without recording the divergence; whether its stamp, boldness, and persistence class are the ones the session means to present; whether an executor reading it would take a wrong action; and what the strongest argument against the disposition is. Its verdict is per disposition: forward to the author, or kick back to the periagogic or the maieutic stage with findings. A forwarded disposition reaches the author with the reviewer's strongest counter-argument, when the reviewer found one worth the author's time, and the session's account of why the disposition stands regardless; when the review found no strong counter-argument, the recommendation goes alone and says so. Second, the author responds in one of the three ways the unanswered node defines, on the node or on one of the decisions its ruling asks, and the session classifies each response. A confirmation as shown, or of the recommended option, is recorded. A confirmation with edits, or a denial with feedback, is analysed for where the dialogue must resume: at the periagogic stage when the response shows the author has lost hold of the record's ground, asking for what the record forbids for a reason they have not engaged, or contradicting an ancestor they have not cited; at the maieutic stage when the response is ambiguous while the AI's understanding of the ground is complete, so the intention must be drawn out again with visible drafts; or, in the common case, the draft is refined with the author's edits and put back for confirmation. A response given on one decision is classified the same way and moves the whole node, because a node has one stage and one next movement owed on it; the responses given on the node's other decisions are written onto them as their rulings and survive the kickback, so that the author answers each decision once. A node left unconfirmed stays unanswered at its stage; a denial records what the author said, and the dialogue resumes from it. A ruling given on a node while its parent is still open is recorded like any other, and if a later ruling on the parent contradicts it the contradiction is recorded as an alternative on the child, with the parent's ruling as its source, and put to the author, never applied over their stamp. Third, the recording: the stamp is written in the class the ruling on the node's authority fact confers, the author's words are quoted into the rationale, the dialogue fields are removed, the facts and their rulings among them, the Disposition section excepted as the quotes ruling decides, and the node is landed. A ruling that the node not exist is recorded before the node is deleted, on the node that proposed the prune where one did and otherwise on the parent, so the record keeps the reason a question was closed instead of losing it with the file. The recommended dispositions of a round are sent to review together, one batch over the whole unanswered frontier in one clean context, as the clean-context-review node describes, and each moves on its own verdict; one that is kicked back never holds the others. The reviewer recommends and never writes; the session decides and answers for the record. No disposition is confirmed without the review and none is stamped without the confirmation.

## Rationale

The author's disposition of 2026-09-03: "incumbent graph describes subagent, clean context adversarial review of all dispositions just prior to recording. Record this disposition (do not copy it verbatim, you are not bound by the incumbent, evaluate greenfield and write from scratch) and reconcile the alignment shim. ... It occurs at the granularity of the disposition - adversarial review should batch author confirmed dispositions, but dispositions unvalidated by adversarial review must not block validated dispositions. Instead, adversarial review may recommend to the main alignment thread kicking a disposition back to periogoge, maietic or author confirmation with additional context and edits." Amended the same day: "Change of adversarial review disposition: adversarial review happens after maieutic, before confirmation. This way the author can review any steelman counter argument as a standard part of confirmation review, and why AI thinks the disposition stands regardless (but steelman argument is optional, if adversarial review returns no strong counter argument)". And on the response: "Dispositions not validated verbatim during author confirmation using the alignment artifact follow a similar kickback analysis by the alignment skill. Based on author input on unconfirmed dispositions kick back to either periogogue (if there seems to be fundamental misunderstanding on author's part), miaeutic (if there is ambiguity and fundamental understanding on AI part) or just update the unanswered disposition with refinements to re-attempt confirmation (most likely case)."

Why a second reader with no context: the session that ran the dialogue shares the author's framing and its own, and the defects that survive a dialogue are the ones both parties stopped seeing, a ruling paraphrased rather than quoted, a contradiction with a node neither re-read, a sentence that reads one way to the two of them and another way to an executor. A reader given only the record sees what the record says. Why before the confirmation: the author rules better with the strongest case against in front of them, and a review after confirmation would either second-guess a ruling or review a draft the author has not yet seen changed. Why per disposition and non-blocking: the reviews of a round are invoked together, but each reviewer reads for itself, since a shared reading carries one node's framing into the next, and a verdict that held one disposition hostage to another would turn the review into a gate. The author, 2026-09-03, on the review as a skill with a context per node, is quoted on the clean-context-review node; until that day the reviews of a round ran in one context, and the batch sentence above was amended at the author's ruling. Why the reviewer recommends and never writes: authority attenuates and nothing writes up; the session holds the dialogue and answers for the record. Rejected: a fixed checklist as the reviewer's brief, because the findings that matter are the ones no list anticipated, so the brief states what the review judges and leaves how to the reviewer; a steelman on every item whether or not one was found, because a manufactured objection is paper doubt and costs the author's attention; the incumbent's mechanics, its gate script and its workflow, because they were built for a record with phases and tactics, which this record does not have.

Traditions, owed as readings: the office of the promotor fidei (Sixtus V, 1587; reformed 1983), adopted for a standing adversary to every candidate and diverged from in that the adversary here cannot stall, only send back or object on the record; blinded peer review, adopted for the independence of the reader's context; the four-eyes principle of financial control, adopted for a second reader before every write to the record; Peirce on paper doubt, adopted for the optional steelman. The evaluation node's rule that adversarial review of one's own output is part of producing it still holds; this node adds the reader who did not produce it. Amended 2026-09-04, in the sitting on the alignment page. Why a response on one decision moves the whole node: the stage is the node's, the next movement owed on it, and a node carrying four stages has no answer to what is owed; the ruling order and the frontier are both built on one stage per node. Why the other decisions' responses survive the kickback: the author answered them, and discarding an answer because a different question was denied would ask for it twice. Why the stamp's class comes from the authority fact: the class a confirmation confers is one of the decisions the author rules on, which is why the recommendation no longer carries one, as the dialogue node's recommendation sets out. Rejected: a stage per decision, so that a kickback on one leaves the others at the ruling stage, since it would give a node no single next movement and would put the frontier's order on a quantity that no longer exists.
```

## Account

### Recording of 2026-09-03

Reclassified as unanswered at the author's ruling of 2026-09-03, quoted on the unanswered node: the answer above, stamped deferred during bootstrap before the alignment dialogue existed, stands as the draft the author rules on, and the clean-context review runs on it before the ruling. Nothing in the node was changed by the reclassification.

Facts: authority ratified; boldness moderate; persistence standing.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer, final sentence: 'No disposition is confirmed without the review and none is recorded without the confirmation.' 'Recorded' is used here for the third step, stamping and landing, but read plainly the sentence forbids what growth and transience require — that a disposition the author states mid-sitting 'is recorded at once as an un-aligned disposition'. An executor could refuse to write the author's words until the author had confirmed them. Suggested edit: 'none is stamped without the confirmation'.
- Answer, second step: 'A deferral leaves the answer deferred; an overrule records what the author said stands.' Unanswered, in this same batch, names three responses and explicitly rejects a fourth: 'a fourth response, defer, is not needed, because leaving a node unconfirmed is the deferral.' The alignment page as built offers four — 'Ratify as shown', 'Ratify with edits', 'Defer', 'Overrule' (RATIFY_OPTIONS in packages/disposition/project.mjs). Two nodes of the same batch and the artifact all disagree on how many responses exist. Suggested edit: settle the response vocabulary in one node and have the other cite it.
- Answer: 'the nodes it joins up to its ceiling'. 'Ceiling' appears in no other node, is in no 'defines' list, and is not defined here. Suggested edit: define it or say 'ancestry'.
- Answer, third step: 'the dialogue fields are removed'. Dialogue makes '## Disposition' one of those fields, while the quotes sitting's recorded resolution is that 'the verbatim ruling stays in the node, under Disposition with its date', and authority makes a stamp invalid without it. Removing the section at the recording and keeping the ruling in the node cannot both hold. Suggested edit: exempt '## Disposition' by name.
- Rationale: 'Traditions, owed as readings: the office of the promotor fidei (Sixtus V, 1587 ...); blinded peer review; the four-eyes principle of financial control; Peirce on paper doubt.' A prose tradition list, which readings' recommended answer forbids and which this batch's review of readings counted among eleven offenders.

On the three facts: Generic template, though this node's Rationale does quote the author three times with dates, so the class is defensible where most of the batch's is not. It still fails the form: dialogue requires one class and one boldness value from the review stage on, and 'boldness as the rationale shows' gives neither. The mechanics — three steps, the per-disposition non-blocking verdict, the reviewer-recommends-never-writes rule, the optional steelman — are the AI's, so boldness is moderate.

Strongest counter-argument (moderate): The review is mandatory before every confirmation and unbounded in cost — it reads the node, its ancestry, the global rules and everything it cites — while what it guards is a draft the author is about to read anyway. The justification, that 'the defects that survive a dialogue are the ones both parties stopped seeing', is real, but the remedy chosen is a whole second reading of the record per batch rather than a check of the two failure modes the node itself names, both of which are mechanical: a ruling is quoted with its date or it is not, and a contradiction with an ancestor is a diff against the ancestry the projector already emits. Buying a full reading to catch what a check would catch is the over-processing waste validation-order adopts Ohno for, and this batch is the evidence: the highest-value findings here are quoted-ruling absences and false claims about the validator, browser and page — all checkable.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer, final sentence: 'No disposition is confirmed without the review and none is recorded without the confirmation.' Read plainly this forbids what growth, transience and checkpoint require — that a disposition the author states mid-sitting is recorded at once as an un-aligned disposition, and that the author's words are written the turn they are said. Unchanged since the previous review, whose suggested edit was 'none is stamped without the confirmation'.
- Answer, third step: 'the dialogue fields are removed'. Dialogue makes '## Disposition' one of those fields, while quotes' recorded resolution is that the verbatim ruling stays in the node and authority makes a stamp invalid without it. Suggested edit: exempt '## Disposition' by name, contingent on quotes.
- Answer: 'the nodes it joins up to its ceiling'. 'Ceiling' is defined by under, which is at the maieutic stage with 'Proposed: pending', and clean-context-review says 'the answered nodes they join up to the roots' — a different rule. Two nodes give the reviewer two worlds.
- Answer, second step: 'A deferral leaves the answer deferred; an overrule records what the author said stands.' Unanswered names three responses and rejects a fourth; the page implements three (confirm / edit / deny); twenty-four Proposals offer four ('ratify as shown; ratify with edits; defer; overrule'). Three vocabularies for one act.
- The node has no '## Disposition' section, although its Rationale quotes the author three times with dates — which is exactly what quotes' recommended-in-reply option requires. Moving those quotes into '## Disposition' would make this node conform and would let the alignment page show them, since the page renders the author's words only from that section.

On the three facts: The frontmatter recommendation (ratified, moderate) states one class and one value. The prose Facts line is the generic template stating two classes, though this node's Rationale does quote the author three times with dates, so the class is defensible where most of the batch's is not.

Strongest counter-argument (moderate): The review is mandatory before every confirmation and unbounded in cost, while what it guards is a draft the author is about to read anyway. The justification is real, but the remedy chosen is a whole second reading of the record per batch rather than a check of the failure modes the node names, most of which are mechanical: a ruling is quoted with its date or it is not, a shim's artifact exists or it does not, a cited command runs or it does not. This reading is the evidence: its highest-value findings — a missing settings.json, a stale yaml shim, three dangling dependency ids, four files ending in a bare 'null', withdrawn sentences left in drafts — are all checkable, and the judgment findings are fewer.

The session's reply: Validated. Amended tonight: none is stamped without the confirmation; the reviewer's world is what the clean-context-review node names; the Disposition section is excepted from removal as the quotes ruling decides; the second step classifies the three responses the unanswered node defines. The author's quotations move to a Disposition section at the sitting. On the counter-argument, that most of the review's checks are mechanical: accepted as work owed on frontier-consistency's validations, which become instruments as the reader grows; the whole reading stays, by the author's ruling, for the drift only a reading catches. Stage review.

### Frontier finding, 2026-09-03

Kind: contradiction.

Three response vocabularies are live for one act. Unanswered: 'the author may confirm, confirm with edits, or deny with feedback', with 'a fourth response, defer, is not needed'. Recording's Answer classifies four outcomes: 'A confirmation as shown, or the recommended option taken, is recorded ... A deferral leaves the answer deferred; an overrule records what the author said stands.' Growth restates unanswered's three. The alignment page implements exactly three (RESPONSE_CHOICES: confirm, edit, deny in packages/disposition/project.mjs). Meanwhile twenty-four node Proposals close with 'Rulings open: ratify as shown; ratify with edits; defer; overrule' and nine with 'take the recommended option; take another option by number; defer; answer in prose' — a fourth and fifth wording, neither matching the page the author will use.

Also named: commons.systems/disposition-graph/unanswered, commons.systems/disposition-graph/growth.

Proposed: Unanswered is the survivor: it defines the responses and the page implements them. Recording cites unanswered rather than restating, and recasts its second step as the classification of each of the three responses (a deferral being a node left unconfirmed, an overrule being a denial with feedback). Growth cites unanswered for the page's responses instead of restating them. The thirty-three Proposal closing lines are rewritten to the three words the page uses, which is a mechanical pass the session can do at the recording.

### Frontier finding, 2026-09-03

Kind: vocabulary.

'Sitting' is the record's name for one run of the alignment dialogue and is used across growth ('each is a sitting in two separated stages', 'The sitting moves in order'), recording, dialogue, transience, alignment-target and roughly twenty Proposal headings ('### Sitting on purpose, 2026-09-03'). No node defines it: the parsed graph's 88 terms include 'periagogic', 'maieutic', 'propose', 'project', 'ratify' and 'steer' from growth, and no 'sitting'. Projection's draft requires every defined term to link to the node that defines it, so the word that names the record's central act is the one word the browser cannot link.

Also named: commons.systems/disposition-graph/growth, commons.systems/disposition-graph/dialogue.

Proposed: Growth is the survivor and adds 'sitting' to its defines, with one sentence in the answer saying what a sitting is: one run of the dialogue on one node, from its stage to the author's ruling. Recording and dialogue then use the term without redefining it. Two neighbouring gaps should be closed in the same pass: 'bootstrap grant', named by authority's shim and used in evaluation and materialization, is defined nowhere; [Superseded 2026-09-03: 'bootstrap grant' no longer names anything. The shim it named was struck when the author expired it, replaced by the unanswered-node model, under which what the AI writes when it opens a question is an unanswered disposition and exercises no authority. The gap survives under the successor term: 'bootstrap authority' is defined in its own shim text on `authority` and is still absent from that node's `defines`, and the answer does not define it, so `defines` is not the fix. The claim that the term is used in `materialization` was wrong when written; that node has never carried it.] and 'frontier item', used by transience and work-loop, rests on work-loop's 'frontier'.

### Frontier finding, 2026-09-03

Kind: cross-reference.

Recording's Answer describes the reviewer's world as 'the node as it would be committed, the nodes it joins up to its ceiling and the rules that bind everywhere, the nodes it cites, the author's words, and the whole unanswered frontier'. Clean-context-review describes it as 'every node with a stage, the answered nodes they join up to the roots, the rules that bind everywhere, the manifest, and the author's words on each'. 'Up to its ceiling' and 'up to the roots' are different rules, and 'ceiling' is defined by under — 'a node's ceiling is its nearest ratified ancestor' — which is at the maieutic stage with no draft. With nothing ratified the two rules coincide today and will diverge at the first ratification.

Also named: commons.systems/disposition-graph/clean-context-review, commons.systems/disposition-graph/under.

Proposed: Clean-context-review is the survivor, since it is the node that answers how the review is run and its rule is the one the brief and the skill implement. Recording's sentence cites it rather than restating the input set, which also removes the only use of 'ceiling' outside under and lets under be simplified as the decomposition finding proposes.

### Frontier finding, 2026-09-03

Kind: placement.

Authority's rule is that 'a ratified stamp whose ruling is not in the record is invalid', and quotes' session reply settles that the ruling stays in the node under '## Disposition'. Verified that twenty-two of the sixty-two nodes carry no '## Disposition' section at all, among them evaluation, persistence, legacy, validation-order, review, attention and recording — every one of which is at the ruling stage recommending 'ratified' — and all three public nodes. Quotes is therefore a bar on roughly a third of the frontier, and its own Options block still marks the withdrawn option as recommended.

Also named: commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/authority, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/persistence, commons.systems/disposition-graph/legacy, commons.systems/disposition-graph/validation-order, commons.systems/disposition-graph/review, commons.systems/disposition-graph/attention.

Proposed: Rule quotes first, after agency. Then, before any ratified stamp is written, each of the twenty-two nodes either gains a '## Disposition' section carrying the ruling it rests on with its date — attention and recording already have the quotations in their rationales and need only move them, which also makes the alignment page show them — or its recommendation changes from ratified to deferred, since a ratified stamp it cannot support is worse than an honest deferral. Quotes' facts state the count.

### Frontier finding, 2026-09-03

Kind: coverage.

Sixteen nodes still carry the reclassification's generic prose Facts line, 'authority ratified if the author confirms, or delegated where the author's words delegate it; boldness ...; persistence standing': agency, recording, evaluation, attention, legacy, persistence, review, validation-order, work-loop, aristotle-hexis, software-factories, spec-driven-development, plato-maieutics, plato-periagoge, aristotle-arche-of-action and pettit-non-domination. Two of them (agency, recording) still say 'boldness as the rationale shows'. Dialogue requires 'one class and one boldness value from the review stage on', and each of the sixteen now carries a well-formed frontmatter recommendation that the prose contradicts. The alignment page renders both, so the author is shown two accounts of one stamp on a quarter of the frontier.

Also named: commons.systems/disposition-graph/dialogue, commons.systems/disposition-graph/growth.

Proposed: Dialogue is the survivor of the requirement. The sixteen prose Facts lines are rewritten to match each node's frontmatter recommendation, or deleted, since the recommendation field now carries the two facts and growth's presentation rule is satisfied by it plus each shim named in prose. Growth's presentation rule should say explicitly that the three facts are presented from the recommendation field and the node's shims, not from a prose line, so the duplication cannot recur.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `move-the-quotations-into-a-disposition-section` (review, 2026-09-03); `deferred-rather-than-ratified` (review, 2026-09-03); `mechanical-checks-instead-of-a-full-reading` (review, 2026-09-03); `cite-reviewers-world` (review, 2026-09-03, from commons.systems/disposition-graph/clean-context-review); `cite-unanswered-responses` (review, 2026-09-03, from commons.systems/disposition-graph/unanswered).
The recommendation adopts `standing` and is pinned to the standing text as it was at that commit.
Moved to other nodes as alternatives: `cite-unanswered-for-the-responses` on commons.systems/disposition-graph/growth; `define-sitting` on commons.systems/disposition-graph/growth; `facts-presented-from-the-recommendation-field` on commons.systems/disposition-graph/growth; `facts-state-the-count` on commons.systems/disposition-graph/quotes.
The census unit's note: The node has a standing answer, no draft, and no Disposition section at all, so its dispositions list is empty even though its rationale quotes the author three times; that gap is itself the substance of two of its alternatives. Everything the two reviews raised about the answer's text was applied by the session before the snapshot, so the pending items are the placement finding's two branches and the reviewers' shared counter-argument, which I treated as an alternative because it proposes a different answer rather than an observation. The four findings that name other nodes went to growth, three times, and to quotes. I did not record the cross-reference finding on ceiling, whose proposed edit to this node's answer is already applied.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The node carries no '## Disposition' section although its rationale quotes the author three times with dates — verified, it is one of the twenty-three. Because the alignment page renders the author's words only from that section, the author sees this node with an empty author-words panel and their own quoted rulings buried in the AI's account. The `move-the-quotations-into-a-disposition-section` alternative is the cheapest fix in the batch and has been accepted at two sittings without being made.
- Verified applied since the last review: the final sentence reads 'none is stamped without the confirmation', the reviewer's world is 'the record as the clean-context-review node names it', the Disposition section is excepted from removal 'as the quotes ruling decides', and the second step classifies the three responses unanswered defines.
- Answer, first step: 'the whole unanswered frontier among it, whose consistency with itself is the review's to check, as the frontier-consistency node describes.' The two nodes now cite each other for the reviewer's world and the validations, which is the right division; what neither says is which governs when they differ, and the `cite-reviewers-world` alternative would settle it by making clean-context-review the survivor.
- Rationale carries a prose tradition list — the promotor fidei, blinded peer review, the four-eyes principle, Peirce on paper doubt — which readings' recommended text forbids and which stub-traditions' enumeration does not name this node among. See the merge finding.
- Answer, second step: the classification of a confirmation with edits sends a substantive edit 'through the review again before the stamp is written'. Verified nothing enforces it: read.mjs computes `reviewStale` and the frontier prints it, but nothing returns a node from ruling to review, so the rule is a discipline the frontier can only report on after the fact.

On the three facts: The frontmatter recommendation (adopts standing, ratified, moderate) states one class and one value and the pin is current; moderate is right, since the three steps and the non-blocking per-node verdict are the AI's while the ordering and the kickback classification are the author's in quoted words. Ratified is better supported here than on most of the batch, since the rationale does quote three dated rulings — but they are in the rationale and not in a '## Disposition', which is what the alignment page reads. Persistence standing follows from the node's shape.

Strongest counter-argument (moderate): The review is mandatory before every confirmation and unbounded in cost, while what it guards is a draft the author is about to read anyway, and most of what it catches is mechanical: a ruling is quoted with its date or it is not, a shim's artifact exists or it does not, a cited command runs or it does not. This reading is the evidence — its highest-value findings are a shim naming a file absent from the checkout, a shim whose liquidation condition is met, an `at` pin in the wrong format, a `depends` field no node carries, and a Facts section contradicting its own frontmatter, every one of them checkable. The judgment findings are fewer and could be bought with a narrower reading over a smaller set.

The session's reply: Forward accepted. The missing Disposition section, the reviewers'-world citation, and the unenforced re-review stay as pending alternatives and findings.

### Frontier finding, 2026-09-03

Kind: merge.

Four questions are each pending as the same alternative on four to six different nodes, so the author would rule one question up to six times. Verified from the frontier's alternatives lists: (i) `say-instrument-not-criterion` is pending on scope, work-loop, transience and purpose, and each entry says the same thing — that until instruments is ruled the answer says 'instrument', the term instruments actually defines, since 'criterion' is in no node's `defines` and 'criteria' is not in FRONTMATTER_KEYS; instruments owns the question and stands at the maieutic stage with `define-criterion` pending. (ii) `delegated-not-ratified` is pending on software-factories, spec-driven-development, srs-introduction and web-routing, each saying that a reading whose source the author has not read is delegated and not ratified; readings owns the rule and all four recommendations have in fact already been corrected to delegated, so four alternatives now stand for a change already made. (iii) `traditions-to-readings` is pending on materialization, validation-order, instruments and evaluation, each saying the node's prose tradition list goes to readings under the stub-traditions ruling; stub-traditions owns the enumeration and its own `regenerate-enumeration` alternative says the enumeration is incomplete and should be derived rather than maintained by hand. (iv) The same ruling appears as `deferred-rather-than-ratified` on legacy and recording, `deferred-until-ruling-quoted` on validation-order and evaluation, and `deferred-not-ratified` on review and persistence — six nodes, three names, one question: whether a node recommending ratification with no ruling quoted in it should drop to deferred instead; quotes owns that question. Under validation 15 each of these is a new answer to a question the record already asks, standing as its own alternative on a node that does not own the question.

Also named: commons.systems/disposition-graph/instruments, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/stub-traditions, commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/scope, commons.systems/disposition-graph/work-loop, commons.systems/disposition-graph/transience, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/software-factories, commons.systems/disposition-graph/spec-driven-development, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/web-routing, commons.systems/disposition-graph/materialization, commons.systems/disposition-graph/validation-order, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/legacy, commons.systems/disposition-graph/persistence, commons.systems/disposition-graph/review.

Proposed: Instruments is the survivor of the criterion vocabulary, readings of a reading's class, stub-traditions of the prose tradition lists, and quotes of what an unquoted ratified stamp becomes. Each survivor takes one alternative saying that its ruling settles the question for every node that carries the per-node entry, and each per-node alternative is then a consequence of the survivor's ruling rather than a separate ruling — which is what the record already does for the four readings, whose class was changed once and recorded four times. The four per-node families stay listed so the author can see the blast radius, but the ruling order puts the survivor first and the alignment page should say that confirming the survivor discharges them. Case (ii) is the clearest: all four recommendations already read delegated, so those four alternatives are discharged and should be struck rather than ruled.

Recorded as a pending alternative on commons.systems/disposition-graph/instruments: `one-ruling-for-the-word` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/readings: `one-ruling-for-the-reading-class` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/stub-traditions: `one-ruling-for-the-prose-lists` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/quotes: `one-ruling-for-the-unquoted-stamp` (source review, 2026-09-03).

### Frontier finding, 2026-09-03

Kind: cross-reference.

Counts and implementation claims recorded across the batch's review sections have moved under them, and several are cited by pending alternatives as though current. Verified against the graph as it stands: `node packages/disposition/validate.mjs disposition` returns 'ok: 68 nodes', not the 62 that eight recorded findings assume; twenty-three nodes carry no '## Disposition' section, not twenty-two; the `defines` fields hold 117 entries, not the 88 the vocabulary findings cite; no node file ends in a bare 'null' (`grep -rn '^null$' disposition/` returns nothing), so the coverage finding of 2026-09-03 on the four bare nulls is discharged; `apply.mjs` and `brief.mjs` exist and are tracked, so the align-review shim's artifact claims hold; and browser-template.html carries an `authorityHtml` function rendering an authority block, so the earlier claim that 'there is no authority section' is stale, while 'unguarded' and 'criteria' still do not occur in it at all. The record's own rule, stated on authority, is that recorded review findings are annotated where they stand rather than rewritten, so none of these is a defect in the sections that carry them; the defect is that quotes' pending `facts-state-the-count` alternative asks the node's facts to state a count, and the count it names is already stale.

Also named: commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/authority, commons.systems/disposition-graph/projection, commons.systems/disposition-graph/dialogue.

Proposed: No node's text is wrong and nothing moves. What is owed is that a count the author is asked to ratify be measured at the ruling rather than fixed in prose: quotes' facts state the bar as measured when the author rules, and the review skill's own briefs carry the counts, so the number the author sees is derived. Recording's counter-argument makes the general form of this point — most of what the review checks is mechanical — and frontier-consistency's validations 3, 5 and 11 are the natural home for the checks that would keep these numbers true.

### Kicked back to the maieutic stage, 2026-09-04

This node was at the ruling stage with the clean-context review of 2026-09-03
behind it, and it is moved back here, keeping its review pin so the frontier
shows the review as behind the author's words. The cause is the author's
disposition of 2026-09-03, that the record carry a decision per aspect, which
`dialogue` answers with `aspects-are-nodes`: the responses this node classifies
are no longer given only on nodes, and the stamp this node writes no longer
takes its class from the recommendation.

Three consequences, and the third was not in the cascade `dialogue` named.

**A response on one decision.** It is classified exactly as a response on a
node is, and it moves the whole node, because the stage is the node's and a
node with four stages has no answer to what is owed on it. What is new is that
the responses given on the node's other decisions are written onto them as
rulings and survive the kickback. Without that clause the author answers four
questions, denies one, and is asked the other three again. The rival,
`stage-per-decision`, is recorded and rejected in the rationale.

**A response on a child while the parent is open.** `unanswered` rules that it
stands; this node carries the mechanics, which are that a later parent's ruling
contradicting it is recorded as an alternative on the child with the parent's
ruling as its source. That is the ordinary route for a conflicting answer under
`authority`, applied to the one case the sitting created by putting the
children in the pane as indications rather than as rows.

**The stamp's class, and the prune.** This was not in the cascade list and is
found here in the ordinary course of writing the amendment.
`dialogue`'s fence takes `class` off the recommendation, on the ground that the
class a confirmation confers is one of the three reserved facts. Nothing else
in the record then says where the stamp's class comes from, and this node is
the only node that writes a stamp. The answer now says: from the ruling on the
node's authority fact. The same fence introduces `existence`, and this node is
likewise the only place a node is deleted, so the answer now says a prune
ruling is recorded before the file goes. Both are consequences of a ruling that
has not been made, which is why `depends` names it.

**Facts.** Adopts `responses-classified-per-decision`. Authority ratified,
since this is the node that writes stamps. Boldness low for the first two
consequences, which are `unanswered`'s and `authority`'s sentences applied, and
moderate for the third: that the stamp's class comes from the authority fact
follows from `dialogue`'s fence, but where a prune ruling is recorded once the
node is gone is the AI's own judgment and the author may want it elsewhere.
Persistence standing.

Not reviewed. The clean-context review is owed on this and on the batch.
