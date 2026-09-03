---
question: How is a disposition confirmed and recorded?
stage: review
recommendation:
  class: ratified
  boldness: moderate
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: 408e9e31c58b5503b0dd10b8bc608295223a91e6
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

## Proposal

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

Proposed: Growth is the survivor and adds 'sitting' to its defines, with one sentence in the answer saying what a sitting is: one run of the dialogue on one node, from its stage to the author's ruling. Recording and dialogue then use the term without redefining it. Two neighbouring gaps should be closed in the same pass: 'bootstrap grant', named by authority's shim and used in evaluation and materialization, is defined nowhere; and 'frontier item', used by transience and work-loop, rests on work-loop's 'frontier'.

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
