---
question: How would we know an answer still holds?
stage: ruling
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/model
defines:
  - instrument
  - check
  - assessment
  - re-grasp
  - evidence
---
## Disposition

The author, 2026-09-02:
> I see no projected documentation of instrumentation. Doesn't every disposition have instrumentation or criteria or something like that?

The author, 2026-09-02:
> Is assumption a form at all? I think the concept of an assumption started as instrumentation. Something like "this answer is valid so long as this assumption holds".

## Answer

By an instrument bound to the answer: a check the machine runs, or an assessment, a dated human judgment. A ratified answer with no instrument is unguarded, and the record says so. Instruments differ by form. A target's failing check is work. A rule's failing check is a variance that gates the work that broke it. An assumption's failure sends the question above it back to the author. An archē is never tested by derivation; it is re-grasped, and only on events, never on a calendar: a proposal under it rejected for conflict with it; a failed assumption in its subtree; an action taken under it that the author rejects at review; anomalies past a ratified threshold; a reading under it re-ratified with a changed verdict. A proposal that contradicts doctrine also opens review of the delegated disposition it came from. Expiry stays where the traditions put it, on delegated authority and on assessments of lower answers.

## Rationale

The author rejected cadence review of first principles on 2026-09-02; the record diverges from the periodic-convention strand (Jefferson to Madison, 1789; New York Constitution Article XIX) and adopts Peirce, for whom inquiry begins with genuine doubt from surprise and manufactured doubt is paper doubt. The other triggers come from reflective equilibrium (Rawls, Goodman, Daniels), Kuhn's anomalies, the overruling factors of Planned Parenthood v. Casey, and management of change in process safety; the proof-test interval of IEC 61508 is where expiry belongs. Each is owed a reading. Open: whether a delegated stamp itself sunsets. Readings also owed for Seneca, De Ira III.36, and the Ignatian examen, the periodic review of conduct against principle, and for sunset clauses on delegated and emergency powers.


## Proposal

### Sitting on purpose, 2026-09-03

**The instruments node, whole; criteria on every page**

The single instrument becomes a list of criteria; three kinds, check, assessment, assumption; each says whether the answer is achieved or maintained; every page shows its criteria or the word unguarded; the re-grasp triggers are unchanged; the prose list of traditions leaves the rationale.

Facts: authority ratified; boldness moderate; persistence standing; the schema change is materialized by the validator and projector.

Rejected:
- Criteria as child nodes with their own stamps, which the legacy transcription chose. — A criterion that needs its own stamp is a question of its own and becomes a node then; the common case is a line on the node it guards.
- Keep one instrument per node. — An answer commonly has a check and an assessment, and purpose has both.

Depends on: `forms`

Proposed text:

```markdown
---
question: How would we know an answer still holds?
form: disposition
authority:
  class: ratified
  by: Nathan Buesgens
  date: <the date of the ruling>
under:
  - commons.systems/disposition-graph/model
defines:
  - criterion
  - check
  - assessment
  - assumption
  - re-grasp
  - evidence
  - unguarded
---
## Answer

By criteria bound to the answer, and every page shows them or says the answer is unguarded. A criterion is one of three kinds: a check the machine runs; an assessment, a dated human judgment; or an assumption, a condition about the world under which the answer holds, which is not a form of answer but a criterion, and whose failure sends the question back to the author. A criterion also says whether the answer is to be achieved, so that its failing check is work on the frontier, or maintained, so that its failing check is a variance that gates the work that broke it. A ratified answer with no criterion is unguarded, and the record says so. An archē is never tested by derivation; it is re-grasped, and only on events, never on a calendar: a proposal under it rejected for conflict with it; a failed assumption in its subtree; an action taken under it that the author rejects at review; anomalies past a ratified threshold; a reading under it re-ratified with a changed verdict. A proposal that contradicts doctrine also opens review of the delegated disposition it came from. Expiry stays where the traditions put it, on delegated authority and on assessments of lower answers.

## Rationale

The author rejected cadence review of first principles on 2026-09-02; the record diverges from the periodic-convention strand and adopts Peirce, for whom inquiry begins with genuine doubt from surprise and manufactured doubt is paper doubt. Assumption moved from the forms to the criteria because it was instrumentation from the start, the condition under which an answer stays valid, and the requirements tradition records domain assumptions beside the specification for the same reason. Rejected: criteria as nodes of their own, because a criterion that needs its own stamp is a question of its own and becomes a node then; a single instrument per node, because an answer commonly has a check and an assessment. Open: whether a delegated stamp itself sunsets.
```

Rulings open: ratify as shown; ratify with edits; defer; overrule.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Draft Answer, sentence 3: 'A criterion also says whether the answer is to be achieved ... or maintained.' No field carries this. The four criteria drafted at this sitting (purpose, node, knowledge-store, capture) carry only kind, ref and note. Suggested edit: name the field, or fold achieve and maintain into 'kind'.
- Draft Answer: 'A ratified answer with no criterion is unguarded, and the record says so.' Combined with the forms merge, an unguarded disposition carries no achieve-or-maintain at all, so the distinction target and rule used to carry is lost exactly where there is no criterion, which is most of the graph today.
- Draft defines drops 'instrument' while 'instrument:' remains a live frontmatter field on review, transience, node and public/agency. Ratifying this renames the field in prose while four nodes keep the old one. Suggested edit: name the migration as part of what is confirmed.
- Rejected list: 'a criterion that needs its own stamp is a question of its own and becomes a node then.' Purpose-criteria in this same batch offers criteria at 'authority deferred' on a node whose facts say ratified, which this rejection forbids.

On the three facts: Ratified, moderate boldness, standing is right. The facts should add that the schema change makes the 'instrument:' field on four nodes non-conforming, and that no field yet carries achieve or maintain.

Strongest counter-argument (strong): The rule mandates a fact the schema cannot hold and the common case cannot express. Every criterion is to say whether its answer is achieved or maintained, but no field exists for it and none of the four criteria drafted in the same sitting says it; and an unguarded node, which instruments itself makes a legitimate state, has no criterion and so can say neither. Since the forms merge is justified by this carrier, ratifying instruments as drafted ratifies a carrier that does not exist. The record's use of the distinction is live: this node's own current text says 'A target's failing check is work. A rule's failing check is a variance that gates the work that broke it', which is how the frontier decides what to do with a failure.

The session's reply: The counter-argument wins on the carrier. No field carries achieve or maintain and the session does not invent one here: the recommendation on forms changes to keeping rule beside disposition, so the distinction stays on the form, and the draft's sentence that moves it to the criterion is withdrawn at the recording. Accepted: the migration of the instrument field on four nodes to criteria is named as part of what is confirmed; and the split stamp on purpose-criteria is resolved by changing that recommendation to leaving purpose unguarded.
