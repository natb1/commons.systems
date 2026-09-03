---
question: What does an unanswered node carry?
stage: ruling
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-03
under:
  - commons.systems/disposition-graph/unanswered
defines:
  - dialogue
  - stage
  - draft
  - recommendation
  - review state
---
## Disposition

The author, 2026-09-03:
> re-evaluate the encoding of unanswered greenfield if necessary

The author, 2026-09-03:
> It seems like an unanswered node is a disposition + other state needed to track progress through alignment (periogoge, mieutic, adversarial review state, recommended diff/authority/persistence/boldness) or something like that, evaluate greenfield and make a recommendation

## Answer

The disposition and the dialogue on it. The disposition is the node as it stands: the question, its fields, the answer, and the rationale, the standing text when the node was once ratified and otherwise the AI's draft, stamped deferred or unstamped. The dialogue is everything the node carries only while it is unanswered, or while a ratified node is under review; it is removed at the recording, when the author's words are quoted into the rationale and the stamp is written. It has six parts, and each holds only what cannot be re-derived.

`stage`, the next movement owed: periagogic, maieutic, review, or ruling. The movements come in that order, so the stage also says what is behind the node, and a kickback moves it back.

`## Disposition`, the author's words, verbatim and dated, accumulating through the dialogue.

`## Draft`, the recommended text when it differs from the node as it stands: one fenced markdown block holding the whole proposed node, frontmatter and sections, so that the same reader parses it and the alignment page shows the edit, field by field and word by word, beside the whole. A node with no draft section is its own draft, and a confirmation ratifies it as it stands. A draft may be invalid under the doctrine of the day, as when it presumes a ruling not yet given; the validator parses it and checks only that it answers the same question.

`recommendation`, the facts a recommendation must state, as data, required from the review stage on: `class`, the stamp a confirmation confers, ratified or delegated; and `boldness`, low, moderate, or high, how much of the draft rests on the AI's own knowledge against the record and the author's words. The third fact, persistence, is derived from the node's shape and never stored: the node itself is standing, and each shim, each piece of evidence, and each proposal in it is named with its own persistence, as the growth node's presentation rule lists them. The reasoning behind each fact is prose in the proposal.

`review`, the state of the clean-context review of the draft: `verdict`, forward or kickback; `strength`, of the counter-argument, strong, moderate, weak, or none; `date`; `of`, the hash of the draft text the reviewer read, so that a draft changed since the review shows as changed on the frontier and the page; and `siblings`, the ids of the round's other drafts the reviewer was given, so that what it saw can be reconstructed. A node reaches the ruling stage only with a forward verdict.

`## Proposal`, the AI's account in prose: the evidence, the findings, the alternatives and why they were rejected, the reasoning behind each fact, the review's findings and its counter-argument with the session's reply, and what is open for the author.

The validator holds the parts together: a stage on every unanswered node and on no answered node except one under review; a recommendation from the review stage on; a forward verdict at ruling; a draft that parses and answers the node's question. Everything else about the dialogue is derived: the status, the persistence, the queue and its order, whether the draft changed since the review, the edit the page shows, and the counts.

## Rationale

The author's question of 2026-09-03, quoted above, answered greenfield. What the dialogue must carry is fixed by what cannot be re-derived once the session that held it is gone: the author's words, the position reached, the recommended text, the facts the presentation rule requires, and what the reviewer found. Each of those was already in the record on 2026-09-03, but four of them as prose conventions inside the proposal section: a "Facts:" line, a "Proposed text" block, a review subsection with a verdict and a strength, and two conventions for the draft, since a new node was its own draft while a node of the sitting on purpose carried a proposed text beside its standing answer. Prose conventions drift, and the page could not read them; the reviewer had already flagged that "as shown" was ambiguous between the node and the draft. This answer makes the facts, the verdict, and the draft data where a projection or the validator reads them, and keeps them prose where only a person does; the stage stays one field, since the movements are ordered and a date per movement would store what version control already holds. The pin on the reviewed text is the one part with no prose precedent: a review is a reading of a text, and a review whose text has moved is stale, which the reader must be shown. Rejected: the state as prose only, since the page would keep guessing; a date per movement, since it duplicates history; a separate draft file per node, since a node is one file and the draft is parseable inside it; a stored diff, since it is derived from the draft and the node; persistence as a stored fact, since a node is always standing and its shims are declared; a validator that refuses a draft changed since the review, since the session decides whether a change is substance, as the recording node says, and the flag gives it the fact. Traditions, owed as readings under the stub-traditions ruling: the RFC and PEP processes, a status field on a prose document with a fixed order of states; review approvals pinned to a revision in code review, where a new revision marks the approval stale; and the review of a change as a diff against what stands.

## Proposal

### Recording of 2026-09-03

The author's question quoted above is answered as this node, stamped deferred and recommended for ratification. The author's: that an unanswered node is the disposition plus the state of the dialogue, and the list of what that state tracks. The AI's, open to the author's ruling: the six parts and which of them are data; the draft as a fenced block inside the node; the pin on the reviewed text; persistence derived rather than stored; the validator's rules. The tooling and the migration of the existing nodes to these fields follow this recording; until they land, the fields are defined here and carried by no node, and the frontier reads only the stage.

Facts: authority ratified if the author confirms; boldness high, the model being the AI's construction from the author's list; persistence standing.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer: '## Draft, the recommended text when it differs from the node as it stands.' The reader accepts only four sections — Disposition, Answer, Rationale, Proposal (SECTION_ORDER in packages/disposition/read.mjs) — and rejects anything else with "unexpected '## Draft' heading"; 'recommendation' and 'review' are likewise absent from FRONTMATTER_KEYS. A node written to this answer today fails validation. The Proposal discloses that the tooling follows, which is the right disclosure; the answer should still say which of the six parts a node may carry now.
- Answer: 'The third fact, persistence, is derived and never stored: a node is standing.' Growth's presentation rule, which this node implements, lists six persistence values including 'a proposal that dies at the ruling, an un-aligned disposition, evidence, or not recorded'. Collapsing the fact to 'standing' for every node drops four of them without recording the divergence from the parent rule. Suggested edit: say persistence is derived for a node and stated in prose for anything else a sitting recommends.
- Answer: '## Disposition, the author's words, verbatim and dated' together with 'it is removed at the recording, when the author's words are quoted into the rationale'. The quotes sitting's recorded resolution is the opposite — 'the verbatim ruling stays in the node, under Disposition with its date, rolled up at the next sitting' — and authority makes a stamp invalid without the ruling in the node. Removing the section at the recording would invalidate the stamp written beside it. Suggested edit: exempt '## Disposition', or say what the roll-up leaves behind.
- Answer: 'review ... and of, the hash of the draft text the reviewer read.' Nothing computes it: blobSha1 hashes whole files, not sections, and the review subsections written on 2026-09-03 carry no hash. The one part of the model the node says has no prose precedent is also the only one with no producer named.

On the three facts: 'Authority ratified if the author confirms; boldness high, the model being the AI's construction from the author's list; persistence standing' is correct and honest — this and alignment-target are the only two facts lines in the batch that state a single class and a single boldness value, as growth's rule and this node's own 'recommendation' part require. It should add that no node carries these fields yet, so a confirmation ratifies a schema and a migration together, and that this batch's own sixteen reclassified nodes are non-conforming to it from the review stage on.

Strongest counter-argument (strong): The node's own test for storing anything is that it 'cannot be re-derived once the session that held it is gone', and three of the six parts fail it. The recommendation's class and boldness are judgments the next session would make again from the same node; the review's verdict and strength are re-derivable by re-running a review that the recording node already requires be re-run whenever the draft changes; and the draft is a copy of a node inside the file that holds it. What genuinely cannot be re-derived is the author's words and the stage — which the record already carried. So the model formalises as schema what prose was carrying, and pays four new fields, a hash with no producer, and a section the validator rejects, against transience's rule that only what re-derivation cannot reconstruct is stored.

The session's reply: The test is what re-derivation cannot reconstruct at a projection's cost. The recommendation's facts and the review's verdict are re-derivable only by running the judgment again, a sitting or a review, and the record stores the results of judgments for that reason, as it stores a stamp and a boost; the draft is not a copy of the node but differs from it by exactly the edit the author rules on, and the page shows that edit from the two. The hash's producer is the reader, deriveDraftHash, landed the same afternoon as this review, with the fields and the section; their absence at the time of reading was timing. Accepted: persistence is derived from the node's shape, standing for the node itself with each shim, evidence, and proposal in it named, as growth's presentation rule lists them; the recording removes the Disposition section only as the quotes ruling decides, the words being quoted into the rationale either way.
