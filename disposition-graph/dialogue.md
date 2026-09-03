---
question: What does an unanswered node carry?
stage: review
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

`recommendation`, the facts a recommendation must state, as data, required from the review stage on: `class`, the stamp a confirmation confers, ratified or delegated; and `boldness`, low, moderate, or high, how much of the draft rests on the AI's own knowledge against the record and the author's words. The third fact, persistence, is derived and never stored: a node is standing, and the shims its draft declares are shims. The reasoning behind each fact is prose in the proposal.

`review`, the state of the clean-context review of the draft: `verdict`, forward or kickback; `strength`, of the counter-argument, strong, moderate, weak, or none; `date`; and `of`, the hash of the draft text the reviewer read, so that a draft changed since the review shows as changed on the frontier and the page. A node reaches the ruling stage only with a forward verdict.

`## Proposal`, the AI's account in prose: the evidence, the findings, the alternatives and why they were rejected, the reasoning behind each fact, the review's findings and its counter-argument with the session's reply, and what is open for the author.

The validator holds the parts together: a stage on every unanswered node and on no answered node except one under review; a recommendation from the review stage on; a forward verdict at ruling; a draft that parses and answers the node's question. Everything else about the dialogue is derived: the status, the persistence, the queue and its order, whether the draft changed since the review, the edit the page shows, and the counts.

## Rationale

The author's question of 2026-09-03, quoted above, answered greenfield. What the dialogue must carry is fixed by what cannot be re-derived once the session that held it is gone: the author's words, the position reached, the recommended text, the facts the presentation rule requires, and what the reviewer found. Each of those was already in the record on 2026-09-03, but four of them as prose conventions inside the proposal section: a "Facts:" line, a "Proposed text" block, a review subsection with a verdict and a strength, and two conventions for the draft, since a new node was its own draft while a node of the sitting on purpose carried a proposed text beside its standing answer. Prose conventions drift, and the page could not read them; the reviewer had already flagged that "as shown" was ambiguous between the node and the draft. This answer makes the facts, the verdict, and the draft data where a projection or the validator reads them, and keeps them prose where only a person does; the stage stays one field, since the movements are ordered and a date per movement would store what version control already holds. The pin on the reviewed text is the one part with no prose precedent: a review is a reading of a text, and a review whose text has moved is stale, which the reader must be shown. Rejected: the state as prose only, since the page would keep guessing; a date per movement, since it duplicates history; a separate draft file per node, since a node is one file and the draft is parseable inside it; a stored diff, since it is derived from the draft and the node; persistence as a stored fact, since a node is always standing and its shims are declared; a validator that refuses a draft changed since the review, since the session decides whether a change is substance, as the recording node says, and the flag gives it the fact. Traditions, owed as readings under the stub-traditions ruling: the RFC and PEP processes, a status field on a prose document with a fixed order of states; review approvals pinned to a revision in code review, where a new revision marks the approval stale; and the review of a change as a diff against what stands.

## Proposal

### Recording of 2026-09-03

The author's question quoted above is answered as this node, stamped deferred and recommended for ratification. The author's: that an unanswered node is the disposition plus the state of the dialogue, and the list of what that state tracks. The AI's, open to the author's ruling: the six parts and which of them are data; the draft as a fenced block inside the node; the pin on the reviewed text; persistence derived rather than stored; the validator's rules. The tooling and the migration of the existing nodes to these fields follow this recording; until they land, the fields are defined here and carried by no node, and the frontier reads only the stage.

Facts: authority ratified if the author confirms; boldness high, the model being the AI's construction from the author's list; persistence standing.
