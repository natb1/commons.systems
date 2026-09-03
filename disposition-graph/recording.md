---
question: How is a disposition confirmed and recorded?
stage: ruling
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

In three steps after the maieutic stage, the first before the author sees the recommendation and the other two after. First, every recommended disposition is reviewed adversarially by a subagent that starts with no context but the record: the node as it would be committed, the nodes it joins up to its ceiling and the rules that bind everywhere, the nodes it cites, the author's words, and the whole unanswered frontier, whose consistency with itself is the review's to check, as the clean-context-review and frontier-consistency nodes describe. The reviewer judges whether the answer says what the author said and quotes every ruling it rests on; whether it contradicts the record it joins, or a tradition it cites, without recording the divergence; whether its stamp, boldness, and persistence class are the ones the session means to present; whether an executor reading it would take a wrong action; and what the strongest argument against the disposition is. Its verdict is per disposition: forward to the author, or kick back to the periagogic or the maieutic stage with findings. A forwarded disposition reaches the author with the reviewer's strongest counter-argument, when the reviewer found one worth the author's time, and the session's account of why the disposition stands regardless; when the review found no strong counter-argument, the recommendation goes alone and says so. Second, the author rules, and the session classifies the response. A confirmation as shown, or the recommended option taken, is recorded. Any other response is analysed for where the dialogue must resume: at the periagogic stage when the response shows the author has lost hold of the record's ground, asking for what the record forbids for a reason they have not engaged, or contradicting an ancestor they have not cited; at the maieutic stage when the response is ambiguous while the AI's understanding of the ground is complete, so the intention must be drawn out again with visible drafts; or, in the common case, the draft is refined with the author's edits and put back for confirmation. A deferral leaves the answer deferred; an overrule records what the author said stands. Third, the recording: the stamp is written, the author's words are quoted into the rationale, the dialogue fields are removed, and the node is landed. The recommended dispositions of a round are sent to review together, one batch over the whole unanswered frontier in one clean context, as the clean-context-review node describes, and each moves on its own verdict; one that is kicked back never holds the others. The reviewer recommends and never writes; the session decides and answers for the record. No disposition is confirmed without the review and none is recorded without the confirmation.

## Rationale

The author's disposition of 2026-09-03: "incumbent graph describes subagent, clean context adversarial review of all dispositions just prior to recording. Record this disposition (do not copy it verbatim, you are not bound by the incumbent, evaluate greenfield and write from scratch) and reconcile the alignment shim. ... It occurs at the granularity of the disposition - adversarial review should batch author confirmed dispositions, but dispositions unvalidated by adversarial review must not block validated dispositions. Instead, adversarial review may recommend to the main alignment thread kicking a disposition back to periogoge, maietic or author confirmation with additional context and edits." Amended the same day: "Change of adversarial review disposition: adversarial review happens after maieutic, before confirmation. This way the author can review any steelman counter argument as a standard part of confirmation review, and why AI thinks the disposition stands regardless (but steelman argument is optional, if adversarial review returns no strong counter argument)". And on the response: "Dispositions not validated verbatim during author confirmation using the alignment artifact follow a similar kickback analysis by the alignment skill. Based on author input on unconfirmed dispositions kick back to either periogogue (if there seems to be fundamental misunderstanding on author's part), miaeutic (if there is ambiguity and fundamental understanding on AI part) or just update the unanswered disposition with refinements to re-attempt confirmation (most likely case)."

Why a second reader with no context: the session that ran the dialogue shares the author's framing and its own, and the defects that survive a dialogue are the ones both parties stopped seeing, a ruling paraphrased rather than quoted, a contradiction with a node neither re-read, a sentence that reads one way to the two of them and another way to an executor. A reader given only the record sees what the record says. Why before the confirmation: the author rules better with the strongest case against in front of them, and a review after confirmation would either second-guess a ruling or review a draft the author has not yet seen changed. Why per disposition and non-blocking: the reviews of a round are invoked together, but each reviewer reads for itself, since a shared reading carries one node's framing into the next, and a verdict that held one disposition hostage to another would turn the review into a gate. The author, 2026-09-03, on the review as a skill with a context per node, is quoted on the clean-context-review node; until that day the reviews of a round ran in one context, and the batch sentence above was amended at the author's ruling. Why the reviewer recommends and never writes: authority attenuates and nothing writes up; the session holds the dialogue and answers for the record. Rejected: a fixed checklist as the reviewer's brief, because the findings that matter are the ones no list anticipated, so the brief states what the review judges and leaves how to the reviewer; a steelman on every item whether or not one was found, because a manufactured objection is paper doubt and costs the author's attention; the incumbent's mechanics, its gate script and its workflow, because they were built for a record with phases and tactics, which this record does not have.

Traditions, owed as readings: the office of the promotor fidei (Sixtus V, 1587; reformed 1983), adopted for a standing adversary to every candidate and diverged from in that the adversary here cannot stall, only send back or object on the record; blinded peer review, adopted for the independence of the reader's context; the four-eyes principle of financial control, adopted for a second reader before every write to the record; Peirce on paper doubt, adopted for the optional steelman. The evaluation node's rule that adversarial review of one's own output is part of producing it still holds; this node adds the reader who did not produce it.

## Proposal

### Recording of 2026-09-03

Reclassified as unanswered at the author's ruling of 2026-09-03, quoted on the unanswered node: the answer above, stamped deferred during bootstrap before the alignment dialogue existed, stands as the draft the author rules on, and the clean-context review runs on it before the ruling. Nothing in the node was changed by the reclassification.

Facts: authority ratified if the author confirms, or delegated where the author's words delegate it; boldness moderate, the AI's drafting from the author's rulings and from the legacy record as evidence; persistence standing.

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
