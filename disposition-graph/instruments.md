---
question: How would we know an answer still holds?
stage: maieutic
recommendation:
  adopts: criteria-draft
  boldness: moderate
  amends: "11ed21e08230f8aec15782655434a2bce7946e68"
  at: "6d21d356d65f5fa206cb60bc3e923c462acc920e"
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: fbf4c5047cca6d46e77585d115ac371e239f89f4
alternatives:
  - name: criteria-draft
    source: ai
    ref: "2026-09-03"
  - name: facts-name-the-migration
    source: review
    ref: "2026-09-03"
  - name: assumption-stays-a-form
    source: review
    ref: "2026-09-03"
  - name: traditions-to-readings
    source: review
    ref: "2026-09-03"
  - name: define-criterion
    source: review
    ref: "2026-09-03"
  - name: no-hard-fail-on-an-unratified-answer
    source: ai
    ref: "2026-09-03"
  - name: one-ruling-for-the-word
    source: review
    ref: "2026-09-03"
facts:
  - name: authority
    choices:
      - ratified
      - delegated
    adopts: ratified
    boldness: moderate
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

## Alternatives

### criteria-draft

The draft replaces the single instrument bound to an answer with criteria of three kinds, a check the machine runs, an assessment that is a dated human judgment, and an assumption, a condition about the world under which the answer holds. It moves assumption out of the forms and into instrumentation, adds criterion and unguarded to defines and drops instrument, and says every page shows an answer's criteria or the word unguarded. The standing answer instead keeps one instrument, keeps assumption a form, and carries the target-versus-rule distinction in the sentence that a target's failing check is work while a rule's is a variance.

### facts-name-the-migration

Both reviews found that the draft renames the field in prose while nothing implements it: criteria is not a schema key, so no node can carry criteria today, and four nodes still carry an instrument field. This alternative has the node's facts state that confirming it orders a schema change and the migration of those four nodes, which the session's reply promised and the text does not say.

### assumption-stays-a-form

The second review's counter-argument is that with the achieve-or-maintain sentence withdrawn and forms keeping rule beside disposition, the argument that carried assumption out of the forms is gone, so the criterion kinds should be re-read whole rather than patched. On this alternative assumption stays a form, two nodes keep it today, and criteria carry only checks and assessments. The session accepted that the draft should be re-read as a whole, which is what the maieutic stage is for.

### traditions-to-readings

The rationale names Peirce, reflective equilibrium, Kuhn, Casey, management of change and IEC 61508 in prose, which readings' draft forbids and which stub-traditions names this node among the offenders for. The alternative moves them to readings under that ruling and leaves the rationale with the argument alone.

### define-criterion

The vocabulary finding of 2026-09-03 verified that criterion and criteria are used in the answers of transience, scope, work-loop and purpose's draft, and as a frontmatter key on four drafts, while no node's defines carries the term and the schema has no criteria key: it is defined only inside instruments' own draft. Instruments is the survivor and must be ruled before the nodes that use the word. At its recording its defines gains criterion and unguarded, the schema gains the criteria key, and the four nodes carrying an instrument field are migrated; until then the answers that use the word say instrument or disclose that the term arrives with instruments. (Raised on commons.systems/disposition-graph/scope.)

### no-hard-fail-on-an-unratified-answer

This node and transience both leave the same question open on instruments and neither decides it: whether a machine check should ever hard-fail an answer that is not ratified. The no-children rule was enforced by a check that hard-failed, which gave a deferred answer the force of a ratified one and removed in practice the overrule evaluation grants in principle. Instruments carries nothing about it today, so the candidate answer is that a check on an unanswered or deferred answer warns and does not fail. (Raised on commons.systems/disposition-graph/un-aligned-children.)

### one-ruling-for-the-word

Instruments' answer says that its ruling settles the word for every node that uses it, so the four `say-instrument-not-criterion` alternatives now pending on scope, work-loop, transience and purpose are consequences of this ruling rather than four separate ones. Verified that 'criterion' is carried by no node's `defines`, that 'criteria' is not in FRONTMATTER_KEYS, and that three recommendation fences (knowledge-store, capture, node) carry a `criteria:` block the validator's key set would refuse. On this alternative the recording of instruments migrates the four nodes carrying an `instrument:` field, adds 'criterion' and 'unguarded' to `defines`, and adds the schema key, in one landing; it is on the table because the author is otherwise asked the same vocabulary question five times on five pages.

## Recommendation

```markdown
---
question: How would we know an answer still holds?
form: rule
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

By criteria bound to the answer, and every page shows them or says the answer is unguarded. A criterion is one of three kinds: a check the machine runs; an assessment, a dated human judgment; or an assumption, a condition about the world under which the answer holds, which is not a form of answer but a criterion, and whose failure sends the question back to the author. A ratified answer with no criterion is unguarded, and the record says so. An archē is never tested by derivation; it is re-grasped, and only on events, never on a calendar: a proposal under it rejected for conflict with it; a failed assumption in its subtree; an action taken under it that the author rejects at review; anomalies past a ratified threshold; a reading under it re-ratified with a changed verdict. A proposal that contradicts doctrine also opens review of the delegated disposition it came from. Expiry stays where the traditions put it, on delegated authority and on assessments of lower answers.

## Rationale

The author rejected cadence review of first principles on 2026-09-02; the record diverges from the periodic-convention strand and adopts Peirce, for whom inquiry begins with genuine doubt from surprise and manufactured doubt is paper doubt. Assumption moved from the forms to the criteria because it was instrumentation from the start, the condition under which an answer stays valid, and the requirements tradition records domain assumptions beside the specification for the same reason. Rejected: criteria as nodes of their own, because a criterion that needs its own stamp is a question of its own and becomes a node then; a single instrument per node, because an answer commonly has a check and an assessment. Open: whether a delegated stamp itself sunsets.
```

## Account

### Sitting on purpose, 2026-09-03

**The instruments node, whole; criteria on every page**

The single instrument becomes a list of criteria; three kinds, check, assessment, assumption; each says whether the answer is achieved or maintained; every page shows its criteria or the word unguarded; the re-grasp triggers are unchanged; the prose list of traditions leaves the rationale.

Facts: authority ratified; boldness moderate; persistence standing; the schema change is materialized by the validator and projector.

Rejected:
- Criteria as child nodes with their own stamps, which the legacy transcription chose. — A criterion that needs its own stamp is a question of its own and becomes a node then; the common case is a line on the node it guards.
- Keep one instrument per node. — An answer commonly has a check and an assessment, and purpose has both.

Depends on: `forms`

Proposed text: the draft section of this node.

Responses open: confirm as shown; confirm with edits; deny with feedback.

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

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Draft Answer, sentence 3, still reads 'A criterion also says whether the answer is to be achieved, so that its failing check is work on the frontier, or maintained, so that its failing check is a variance that gates the work that broke it', although the session's own reply says 'the draft's sentence that moves it to the criterion is withdrawn at the recording'. The withdrawal is disclosed, which is why this is a forward and not a kickback, but the sentence is the ground of node's four-form merge and of forms' first option, both of which have since moved the other way. Suggested edit: strike it from the draft now, so the three nodes agree before the author reads them.
- Draft defines drops 'instrument' and adds 'criterion', 'unguarded' and 'assumption', while 'instrument:' remains a live frontmatter key carried by four nodes (review, transience, node, public/agency) and remains in FRONTMATTER_KEYS. Verified: 'criteria' is not a schema key, so no node can carry criteria today. Ratifying renames the field in prose while nothing implements it. Suggested edit: name the migration as part of what is confirmed, as the session's reply promises.
- Draft Answer: 'A ratified answer with no criterion is unguarded, and the record says so.' Verified false of the projections: 'unguarded' does not occur in packages/disposition/browser-template.html, and the frontier prints 'instrument: none'. The record says it in one place with a different word.
- Rationale names Peirce, reflective equilibrium, Kuhn, Casey, management of change and IEC 61508 in prose, which readings' draft forbids; stub-traditions names this node among the offenders.

On the three facts: The frontmatter recommendation (ratified, moderate) is right in shape. The facts should add that the schema change makes the 'instrument:' field on four nodes non-conforming, that 'criteria' is not yet a schema key, and that the withdrawn achieve-or-maintain sentence is still in the text the author would ratify.

Strongest counter-argument (moderate): The rule mandated a fact the schema cannot hold and the common case cannot express, and the session has conceded it — but the concession has consequences the node does not draw. With the achieve-or-maintain sentence withdrawn and forms keeping rule beside disposition, the distinction stays on the form, which means the draft's three criterion kinds no longer need to carry it, and 'assumption' as a criterion kind loses the argument that carried it out of the forms. The node should be re-read as a whole against the withdrawn sentence rather than patched around it.

The session's reply: Validated. Amended tonight: the achieve-or-maintain sentence is struck from the draft, as the earlier reply withdrew it. Accepted: the schema does not yet hold criteria, four nodes carry the instrument field, and the browser does not say unguarded; the migration is part of what confirming this node orders, and the sitting names it. The traditions in the rationale go to readings under that rule. On the counter-argument, that the draft should be re-read whole against the withdrawn sentence: accepted, which is what the maieutic stage is for. Stage maieutic.

### Frontier finding, 2026-09-03

Kind: contradiction.

One schema question is in three states inside one batch. Forms' session reply: 'The counter-argument wins. The recommendation changes to the second option, rule kept beside disposition.' Node's draft says the opposite: 'the current position in one of four forms: a disposition, something that should become or stay true ... An assumption is not a form but a criterion', and node's Proposal summary still reads 'Four forms: disposition (target and rule merged ...)'. Instruments' draft still carries the sentence the merge rested on — 'A criterion also says whether the answer is to be achieved ... or maintained' — although instruments' own reply says it 'is withdrawn at the recording'. Forms' Options block meanwhile still marks the withdrawn option '(recommended)'.

Also named: commons.systems/disposition-graph/node, commons.systems/disposition-graph/forms.

Proposed: Forms is the survivor and is ruled first: move the '(recommended)' marker to option 2. Node's draft then reverts to five forms with the un-aligned-disposition sentence restored, and its Proposal summary is rewritten. Instruments' draft strikes the achieve-or-maintain sentence and keeps the three criterion kinds without it. The assumption question the author actually asked ('Is assumption a form at all?') is left unanswered by option 2 and should be minted as its own question under forms rather than carried by instruments' draft.

### Frontier finding, 2026-09-03

Kind: vocabulary.

'Criterion' and 'criteria' are used in the answers of transience ('A criterion, when the temporary thing is really a standing obligation'), scope, work-loop ('each a reconciliation of the criteria the node carries') and purpose's draft, and in four drafts as a frontmatter key. No node's defines carries the term: the parsed graph's 88 terms include 'instrument', 'check', 'assessment' and 'evidence' from instruments, and 'criterion' only inside instruments' Draft. Verified the key is not in the schema either: FRONTMATTER_KEYS holds 'instrument' and not 'criteria'. A term four ruling-stage answers depend on is defined only inside a draft.

Also named: commons.systems/disposition-graph/transience, commons.systems/disposition-graph/scope, commons.systems/disposition-graph/work-loop, commons.systems/disposition-graph/purpose.

Proposed: Instruments is the survivor and must be ruled before the nodes that use the word. Until it is, the answers that use 'criterion' say 'instrument', the term instruments actually defines, or the drafts that use it disclose that the term arrives with instruments. At the recording, instruments' defines gains 'criterion' and 'unguarded', the schema gains the 'criteria' key, and the four nodes carrying 'instrument:' are migrated — which instruments' own facts should name, as its reply promises.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `criteria-draft` (ai, 2026-09-03); `facts-name-the-migration` (review, 2026-09-03); `assumption-stays-a-form` (review, 2026-09-03); `traditions-to-readings` (review, 2026-09-03); `define-criterion` (review, 2026-09-03, from commons.systems/disposition-graph/scope); `no-hard-fail-on-an-unratified-answer` (ai, 2026-09-03, from commons.systems/disposition-graph/un-aligned-children).
The recommendation adopts `criteria-draft` and is pinned to the standing text as it was at that commit.
Merge analysis of the author's words: 2026-09-02, own-question: There is no projected documentation of instrumentation, and every disposition should carry instrumentation or criteria of some kind. 2026-09-02, new-answer on commons.systems/disposition-graph/forms: Assumption may not be a form at all: it started as instrumentation, the condition under which an answer stays valid.
Moved to other nodes as alternatives: `assumption-is-instrumentation` on commons.systems/disposition-graph/forms; `revert-the-draft-to-five-forms` on commons.systems/disposition-graph/node; `say-instrument-not-criterion` on commons.systems/disposition-graph/scope; `say-instrument-not-criterion` on commons.systems/disposition-graph/work-loop; `say-instrument-not-criterion` on commons.systems/disposition-graph/purpose.
The census unit's note: The node carries a draft, so the recommendation adopts it and I named it criteria-draft. Its second author block I classified as a new answer for forms rather than for this node: instruments asks how we would know an answer still holds, while the words say where assumption belongs, which is forms' question, and forms' surviving option leaves it unanswered, so the elsewhere entry on forms is the one that matters most here. The two reviews' accepted edits that were already applied, the achieve-or-maintain sentence and the three criterion kinds, I excluded; what remains pending are the unnamed migration, the whole re-read the second counter-argument asks for, and the prose traditions. The criterion vocabulary finding proposes edits to four other nodes, of which transience is mine and carries its own alternative; scope, work-loop and purpose are here.

### Frontier finding, 2026-09-03

Kind: merge.

Four questions are each pending as the same alternative on four to six different nodes, so the author would rule one question up to six times. Verified from the frontier's alternatives lists: (i) `say-instrument-not-criterion` is pending on scope, work-loop, transience and purpose, and each entry says the same thing — that until instruments is ruled the answer says 'instrument', the term instruments actually defines, since 'criterion' is in no node's `defines` and 'criteria' is not in FRONTMATTER_KEYS; instruments owns the question and stands at the maieutic stage with `define-criterion` pending. (ii) `delegated-not-ratified` is pending on software-factories, spec-driven-development, srs-introduction and web-routing, each saying that a reading whose source the author has not read is delegated and not ratified; readings owns the rule and all four recommendations have in fact already been corrected to delegated, so four alternatives now stand for a change already made. (iii) `traditions-to-readings` is pending on materialization, validation-order, instruments and evaluation, each saying the node's prose tradition list goes to readings under the stub-traditions ruling; stub-traditions owns the enumeration and its own `regenerate-enumeration` alternative says the enumeration is incomplete and should be derived rather than maintained by hand. (iv) The same ruling appears as `deferred-rather-than-ratified` on legacy and recording, `deferred-until-ruling-quoted` on validation-order and evaluation, and `deferred-not-ratified` on review and persistence — six nodes, three names, one question: whether a node recommending ratification with no ruling quoted in it should drop to deferred instead; quotes owns that question. Under validation 15 each of these is a new answer to a question the record already asks, standing as its own alternative on a node that does not own the question.

Also named: commons.systems/disposition-graph/readings, commons.systems/disposition-graph/stub-traditions, commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/scope, commons.systems/disposition-graph/work-loop, commons.systems/disposition-graph/transience, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/software-factories, commons.systems/disposition-graph/spec-driven-development, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/web-routing, commons.systems/disposition-graph/materialization, commons.systems/disposition-graph/validation-order, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/legacy, commons.systems/disposition-graph/persistence, commons.systems/disposition-graph/review, commons.systems/disposition-graph/recording.

Proposed: Instruments is the survivor of the criterion vocabulary, readings of a reading's class, stub-traditions of the prose tradition lists, and quotes of what an unquoted ratified stamp becomes. Each survivor takes one alternative saying that its ruling settles the question for every node that carries the per-node entry, and each per-node alternative is then a consequence of the survivor's ruling rather than a separate ruling — which is what the record already does for the four readings, whose class was changed once and recorded four times. The four per-node families stay listed so the author can see the blast radius, but the ruling order puts the survivor first and the alignment page should say that confirming the survivor discharges them. Case (ii) is the clearest: all four recommendations already read delegated, so those four alternatives are discharged and should be struck rather than ruled.

Recorded as a pending alternative on this node: `one-ruling-for-the-word` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/readings: `one-ruling-for-the-reading-class` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/stub-traditions: `one-ruling-for-the-prose-lists` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/quotes: `one-ruling-for-the-unquoted-stamp` (source review, 2026-09-03).
