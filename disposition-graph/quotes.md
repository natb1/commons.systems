---
question: How are the author's words retained when a ruling is recorded?
stage: ruling
review:
  verdict: forward
  strength: strong
  date: 2026-09-03
  of: 5597bbeedad00fbb6a4c6197563e1955dd7a3132
  against: "Option 1 has one virtue the record should weigh before discarding it. A verbatim ruling kept in the node accumulates: purpose already carries nine quotations, work-loop eight, dialogue thirteen, and the author reads past all of them on every page of the browser and the alignment page. Transience's own test is that only what re-derivation cannot reconstruct is stored, and the recommended option answers the accumulation with a roll-up nobody has specified — so the choice as put is between an unreadable record and an unverifiable one. Option 2 is right, and it owes the roll-up rule before it is ratified rather than after."
facts:
  - name: answer
    options:
      - name: ruling-stays-in-node
        source: ai
        ref: "2026-09-03"
      - name: ruling-in-commit-message
        source: ai
        ref: "2026-09-03"
      - name: sittings-graph
        source: ai
        ref: "2026-09-03"
      - name: edited-not-verbatim
        source: author
        ref: "2026-09-03"
      - name: facts-state-the-count
        source: review
        ref: "2026-09-03"
      - name: fence-carries-the-ruling
        source: review
        ref: "2026-09-03"
      - name: one-ruling-for-the-unquoted-stamp
        source: review
        ref: "2026-09-03"
    recommends: ruling-stays-in-node
    boldness: moderate
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
under:
  - commons.systems/disposition-graph/authority
---
## Facts

### answer

#### ruling-stays-in-node

The author's verbatim ruling stays in the node, under a Disposition section with its date, and is rolled up at the next sitting; the commit message carries it in addition. This is the option the session moved the recommended marker to after the first review's counter-argument, and it is what every node amended on 2026-09-03 already does. It owes a rule for the roll-up, whose shape no node describes.

#### ruling-in-commit-message

No new schema: the ruling goes verbatim into the message of the commit that lands it, the rationale restates it, and a quote appears inline only where the wording itself is the decision. The session withdrew this after the counter-argument that no projection, validator or clean-context reviewer reads commit messages, which would make authority's invalid-stamp rule uncheckable. The second review still argues it has one virtue worth weighing, that verbatim rulings kept in nodes accumulate to nine quotations on purpose and eight on work-loop that the author reads past on every page.

#### sittings-graph

A sittings graph holds each sitting's record as evidence, cited by the nodes it ruled on, so the verbatim words live in one place and the nodes reach them by citation. It is the highest-boldness of the three options and is neither recommended nor withdrawn.

#### edited-not-verbatim

The author's words carried verbatim on authority state a candidate answer to this node's question: quotes are rarely expected to be recorded as disposition verbatim, the dialogue is expected to edit for clarification and writing quality, and retaining the original quotes as reference is a function that must earn new schema. This node carries those words only as a paraphrase in its account and has no `## Disposition` section of its own, and the option it now recommends — the verbatim ruling stays in the node under Disposition, rolled up at the next sitting — is in tension with the first half of them. (Raised on commons.systems/disposition-graph/authority.)

#### facts-state-the-count

The placement finding proposes that quotes be ruled first after agency, since its resolution is a bar on roughly a third of the frontier: twenty-two of the sixty-two nodes carry no Disposition section and so cannot support a ratified stamp under authority's rule. It proposes that quotes' facts state that count, and it finds that quotes' own Options block still marks as recommended the option its session reply withdrew, so an author taking the recommended option would take the withdrawn one; the marker is to be moved before the author rules. Raised on commons.systems/disposition-graph/recording, commons.systems/disposition-graph/evaluation.

#### fence-carries-the-ruling

The answer says what a recommendation fence carries of the author's words, not only what a recorded node carries. Verified that the batch is split three ways on this today: three fences carrying `class: ratified` quote a dated ruling (rationale-edge, quotes, rejected) and eight do not (purpose, hexis, namespaces, projection, traditions-home, forms, second-stop, purpose-criteria), with no rule anywhere deciding which is right. On this alternative a fence recommending ratification carries the ruling it rests on, or names the node that carries it, so that a reader of the alignment page sees the ground of the stamp beside the stamp; it is on the table because the recommended answer settles what the recorded node holds and is silent about the text the author actually reads when ruling.

#### one-ruling-for-the-unquoted-stamp

Quotes' answer says what becomes of a node recommending ratification with no ruling quoted in it, and that ruling governs every such node rather than each carrying its own alternative. Verified that the same question is pending under three different names on six nodes — `deferred-rather-than-ratified` on legacy and recording, `deferred-until-ruling-quoted` on validation-order and evaluation, `deferred-not-ratified` on review and persistence — and that twenty-three of sixty-eight nodes carry no '## Disposition' section, so the population is larger than the six that happen to carry an entry. On this alternative quotes' answer states the consequence once, that such a node either gains the ruling it rests on or its recommendation drops to deferred, and the six entries become consequences of it; it is on the table because one question is currently on the author's queue six times under three names, and inconsistently, since seventeen nodes in the same position carry no entry at all.

## Recommendation

```markdown
---
question: How are the author's words retained when a ruling is recorded?
form: rule
under:
  - commons.systems/disposition-graph/authority
---
## Answer

The verbatim ruling stays in the node. When a sitting records a ruling, the author's words are quoted in the node's Disposition section with their date, and the message of the commit that lands the node carries them in addition. The rationale restates the ruling in the record's own register; the quotation is what the restatement is of, and is never replaced by it. The section accumulates, and each sitting on the node rolls up the quotations its answer has absorbed, version control holding what the roll-up drops. A ratified stamp whose ruling is not in the node is invalid, and the ruling a stamp requires is the one the author gives at that sitting, quoted then; words the author said earlier are the ground a draft rests on and bar no stamp.

## Rationale

The author's decisions are the one thing re-derivation cannot reconstruct, so they are what the record stores, and a restatement is by construction the AI's wording of them, which is the drift this record exists to resist. Nothing reads commit messages: the browser renders node files, the validator parses node files, and the clean-context review reads node files, so a ruling kept only in a landing commit would make the rule that a ratified stamp needs its ruling in the record unverifiable by any instrument. The cost is accumulation, which the roll-up pays sitting by sitting and which the author has already accepted for appended records. The author, 2026-09-03, asked for this: author quotes are rarely expected to be recorded as disposition verbatim and the dialogue edits for clarification and writing quality, but "it may make sense to retain original author quotes as reference though - evaluate whether this function earns new schema".
```

## Account

### Sitting on purpose, 2026-09-03

**The author's words**

The author, 2026-09-03: quotes are rarely recorded as disposition verbatim; dialogue edits for clarification and writing quality; retaining the original quote as reference may earn schema, and would be subject to the accumulation rule, appended records rolled up with git holding history. Today growth, transience, and review quote the author verbatim in their rationales, and authority says the ruling is quoted in the node.

Options:
- No new schema. The ruling verbatim in the message of the commit that lands it; the rationale restates it; a quote appears inline only where the wording itself is the decision — authority ratified; boldness moderate; persistence standing; withdrawn after the review below
- (recommended) The verbatim ruling stays in the node, under Disposition with its date, rolled up at the next sitting — authority ratified; boldness moderate; persistence standing
- A sittings graph holding each sitting's record as evidence, cited by the nodes it ruled on — authority ratified; boldness high; persistence standing

Feeds: `authority`, `growth`, `transience`

Responses open: confirm the recommended option; confirm with edits, naming another option; deny with feedback.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The recommended option puts the verbatim ruling 'in the message of the commit that lands it'. No projection reads commit messages: the browser renders node files, the validator parses node files, and the clean-context review reads node files. Authority's rule 'a ratified stamp whose ruling is not in the record is invalid' becomes unverifiable by any instrument. Suggested edit: say which instrument checks it.
- Every drafted node at this sitting drops its '## Disposition' section and none quotes a ruling in its rationale, so the six drafts carrying 'class: ratified' (purpose, authority, node, instruments, readings, namespaces, projection) would be invalid the moment they land under today's authority wording. This question must therefore be ruled before any of them is recorded. The Proposal does not say so.
- Projection's draft says the browser projects 'an authority section projected from the stamp, the ruling behind it, the alternatives the rationale rejected'. Under option 1 the ruling behind it is in a commit message and cannot be projected. Suggested edit: say whether the authority section projects the restatement or the verbatim ruling.

On the three facts: Ratified, moderate boldness, standing is right. The facts must add that this question is a prerequisite: no node in this batch can be recorded with a ratified stamp until it is ruled, because none of the drafts carries a quoted ruling.

Strongest counter-argument (strong): Transience's own justification for storing anything is that 'what is stored is what re-derivation cannot reconstruct, the author's decisions'. The author's verbatim words are the paradigm case: they cannot be re-derived from the graph, and a restatement is by construction the AI's wording of them, which is the drift the record exists to resist. Option 1 moves the one irreplaceable artifact to the one surface no projection, no validator and no clean-context reviewer reads, on an orphan ref whose history is the least durable part of this system. The record already treats commit history as the home of superseded answers, which is a different function: an old answer can be re-derived from its successor, a ruling cannot. Option 2, an appended rulings list rolled up at the next sitting, keeps them in the record at the accumulation cost the author has already accepted.

The session's reply: The counter-argument wins. The recommendation changes to the second option: the verbatim ruling stays in the node, under Disposition with its date, rolled up at the next sitting, and the commit message carries it in addition. This is what every node amended on 2026-09-03 already does. The prerequisite is added to the facts: no ratified stamp lands without the quoted ruling in the node.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The Options block still marks option 1 '(recommended) No new schema. The ruling verbatim in the message of the commit that lands it', while the session's reply below says 'The counter-argument wins. The recommendation changes to the second option: the verbatim ruling stays in the node, under Disposition with its date.' The ruling this node opens is 'take the recommended option'. Suggested edit: move the '(recommended)' marker to option 2 before the author rules; this is the same clerical hazard as on forms and purpose-criteria.
- This node is a prerequisite for every ratified stamp in the batch, as its own review says and its reply confirms ('no ratified stamp lands without the quoted ruling in the node'). Twenty-two nodes carry no '## Disposition' at all, including recording, evaluation, persistence, legacy, validation-order, review, attention and all three public nodes. The Proposal should say the size of that dependency: it is not one ordering hint but a bar on roughly a third of the frontier.
- The recommended-in-reply option ('rolled up at the next sitting') introduces a roll-up whose shape no node describes, and dialogue's answer says '## Disposition' is 'removed at the recording'. Two nodes give opposite fates to the same section. Suggested edit: settle the fate of '## Disposition' at the recording here, and have dialogue cite it.
- The node has no '## Answer' and no '## Draft': the answer is written after the ruling.

On the three facts: The frontmatter recommendation (ratified, moderate) is right for either option and does not disclose which one it attaches to. The facts must carry the prerequisite the reply already states, and should say how many nodes it currently blocks.

Strongest counter-argument (strong): Option 1 has one virtue the record should weigh before discarding it: a verbatim ruling kept in the node accumulates, and forty nodes already carry '## Disposition' blocks running to nine quotations on purpose and eight on work-loop, which the author must read past on every page of the browser. Transience's own test is that only what re-derivation cannot reconstruct is stored, and the roll-up option answers this by promising a summarisation nobody has specified. The choice is between an unreadable record and an unverifiable one; option 2 is right, and it owes a rule for the roll-up.

The session's reply: Validated. Amended tonight: the recommended marker moves to the second option, the verbatim ruling staying in the node under Disposition with its date. Rejected: the twenty-two nodes without a Disposition section are not barred from a ratified stamp, since the ruling the stamp requires is the one the author gives at the sitting, quoted then; earlier words are the ground a draft rests on. Accepted: attention's quotations move to a Disposition section tonight and recording's at its sitting, where the page shows them; dialogue and recording now make the section's removal contingent on this ruling. The roll-up's shape is owed with the answer written after the ruling. Stage ruling.

### Frontier finding, 2026-09-03

Kind: placement.

Authority's rule is that 'a ratified stamp whose ruling is not in the record is invalid', and quotes' session reply settles that the ruling stays in the node under '## Disposition'. Verified that twenty-two of the sixty-two nodes carry no '## Disposition' section at all, among them evaluation, persistence, legacy, validation-order, review, attention and recording — every one of which is at the ruling stage recommending 'ratified' — and all three public nodes. Quotes is therefore a bar on roughly a third of the frontier, and its own Options block still marks the withdrawn option as recommended.

Also named: commons.systems/disposition-graph/authority, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/persistence, commons.systems/disposition-graph/legacy, commons.systems/disposition-graph/validation-order, commons.systems/disposition-graph/review, commons.systems/disposition-graph/attention, commons.systems/disposition-graph/recording.

Proposed: Rule quotes first, after agency. Then, before any ratified stamp is written, each of the twenty-two nodes either gains a '## Disposition' section carrying the ruling it rests on with its date — attention and recording already have the quotations in their rationales and need only move them, which also makes the alignment page show them — or its recommendation changes from ratified to deferred, since a ratified stamp it cannot support is worse than an honest deferral. Quotes' facts state the count.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `ruling-stays-in-node` (ai, 2026-09-03); `ruling-in-commit-message` (ai, 2026-09-03); `sittings-graph` (ai, 2026-09-03); `edited-not-verbatim` (author, 2026-09-03, from commons.systems/disposition-graph/authority); `facts-state-the-count` (review, 2026-09-03, from commons.systems/disposition-graph/recording); `move-recommended-marker` (review, 2026-09-03, from commons.systems/disposition-graph/evaluation).
The recommendation adopts `ruling-stays-in-node` and is pinned to the standing text as it was at that commit. The recommended text was drafted at the re-encoding from the option the account marks recommended, so that the recommendation adopts an alternative with a text and not only a name; the earlier review read the options and not this text, so it is removed and the node returns to the review stage for the clean-context review of the batch.
The census unit's note: The node has no answer and no draft and its whole content is dialogue state, so adopts names the recommended option, which the session moved from the first to the second after the review; that move is recorded in the reply and I took it as authoritative over the Options block's stale marker. All three listed options are pending and none is recorded as rejected. I excluded the open sub-question of the roll-up's shape, since the record offers no candidate answer for it, and the placement finding's request that this node's facts state the count, which is a facts repair; the finding's substantive proposal, that twenty-two nodes gain a Disposition section or drop to deferred, was partly rejected by the session and is in any case carried on each node it names. Note that this node has no Disposition section of its own: the author's words behind it are quoted verbatim on authority and only paraphrased here, so the merge analysis is empty.

### Alternatives merged, 2026-09-03

The alternatives raised on this node by more than one census cohort were merged at the re-encoding, and any alternative the standing answer already carries was removed: `facts-state-the-count` absorbs `move-recommended-marker`. The merge unit's note: The marker half of this finding looks already satisfied under the new encoding, whose `recommendation.adopts` is `ruling-stays-in-node`, the option the session moved the marker to; it is kept because the standing answer does not say so, but the merged text could be trimmed to the count alone once that is confirmed.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Verified fixed since the last review: the Options block marks option 2 '(recommended)' and option 1 'withdrawn after the review below', and the frontmatter recommendation adopts `ruling-stays-in-node`, so the data and the prose agree.
- This node is a bar on much of the record and its account does not say how large. Verified counts as the graph now stands: twenty-three of sixty-eight nodes carry no '## Disposition' section at all, and eight of the eleven recommendation fences carrying `class: ratified` quote no ruling of any date (purpose, hexis, namespaces, projection, traditions-home, forms, second-stop, purpose-criteria), while three do (rationale-edge, quotes, rejected). The `facts-state-the-count` alternative asks for the count and the count it would have stated ('twenty-two of the sixty-two') is already stale. Suggested edit: state the count as measured at the ruling, or derive it.
- Recommendation fence, Answer: 'The section accumulates, and each sitting on the node rolls up the quotations its answer has absorbed, version control holding what the roll-up drops.' The roll-up's shape is described nowhere, and the batch already contains its limit case: purpose's fence drops all nine of its dated quotations rather than rolling up what its answer absorbed. Suggested edit: say what a roll-up may drop, since the first application of the rule would be to the record's highest-ranked node.
- Recommendation fence, Answer: 'A ratified stamp whose ruling is not in the node is invalid, and the ruling a stamp requires is the one the author gives at that sitting, quoted then; words the author said earlier are the ground a draft rests on and bar no stamp.' This is the sentence that unbars the twenty-three, and it is the node's most consequential clause. It is stated in the fence and nowhere in the account's facts.
- The node carries no '## Disposition' section of its own: the author's words behind it are quoted verbatim on authority and only paraphrased here, so the node that rules on where the author's words live does not carry the author's words on that question.

On the three facts: The frontmatter recommendation (adopts ruling-stays-in-node, ratified, moderate) states one class and one value, matches the option the reply moved the marker to, and the pin is current. What the facts must carry is the prerequisite the reply already states — that this ruling gates every ratified stamp in the batch — and the measured size of that bar, since the count in the pending alternative is stale. Persistence standing follows from the node's shape.

Strongest counter-argument (strong): Option 1 has one virtue the record should weigh before discarding it. A verbatim ruling kept in the node accumulates: purpose already carries nine quotations, work-loop eight, dialogue thirteen, and the author reads past all of them on every page of the browser and the alignment page. Transience's own test is that only what re-derivation cannot reconstruct is stored, and the recommended option answers the accumulation with a roll-up nobody has specified — so the choice as put is between an unreadable record and an unverifiable one. Option 2 is right, and it owes the roll-up rule before it is ratified rather than after.

The session's reply: Forward accepted. This node is the survivor of the bar on unquoted stamps and is ruled first, after agency; the fence-carries-the-ruling and one-ruling-for-the-unquoted-stamp alternatives are recorded, and the bar's size is measured at the ruling rather than fixed in prose, as this reply and the cross-reference finding say.

### Frontier finding, 2026-09-03

Kind: coverage.

Purpose's recommended text carries no '## Disposition' section, so confirming it as shown drops all nine dated author quotations the node holds today. Quotes' recommended answer, in this same batch, does not sanction that: 'The section accumulates, and each sitting on the node rolls up the quotations its answer has absorbed, version control holding what the roll-up drops.' A roll-up of what the answer absorbed is not a drop of everything, and at least three of purpose's nine are absorbed by no part of purpose's answer — the form question ('Is this correctly encoded as form: assumption vs form: disposition with unvalidated instrumentation? Is assumption a form at all?'), which forms answers; the instruction that the artifact should show the author the edit and let them approve the disposition as a whole, which dialogue answers; and the instruction to reference harnesses as a tradition and not to replicate tradition references in the rationale, which harness-tradition answers. Verified that of those three targets, forms and harness-tradition carry no '## Disposition' section at all, so two of the three quotations survive the drop nowhere in a section the alignment page renders. Verified also that the roll-up rule has no shape anywhere in the record: quotes' own second review recorded that it 'introduces a roll-up whose shape no node describes', and the session's reply deferred it to the answer written after the ruling.

Also named: commons.systems/disposition-graph/purpose.

Proposed: Quotes is the survivor: it rules on what becomes of the author's words at a recording, and it must be ruled before purpose, which the ruling order below does. Until then purpose's recommended text is the first application of a rule that does not exist, and the honest form is that the account name which of the nine quotations the answer absorbs and which move to the node that answers them, with the two that have no home — the form question on forms and the tradition instruction on harness-tradition — moved in the same landing rather than dropped. Quotes' answer, when it is written, should say what a roll-up may drop and what it may not.

Recorded as a pending alternative on commons.systems/disposition-graph/purpose: `keep-the-authors-words` (source review, 2026-09-03).

### Frontier finding, 2026-09-03

Kind: placement.

Authority holds that 'a ratified stamp whose ruling is not in the record is invalid', and quotes rules on what that requires. Measured against the graph as it now stands: eleven recommendation fences in this batch carry `class: ratified`, and eight of them quote no ruling of any date anywhere in the fence — purpose, hexis, namespaces, projection, traditions-home, forms, second-stop and purpose-criteria — while three do: rationale-edge, quotes and rejected. Separately, twenty-three of the sixty-eight nodes carry no '## Disposition' section at all (`validate.mjs` reports 'ok: 68 nodes'; the count of nodes with no such section is 23), among them evaluation, persistence, legacy, validation-order, review, recording, forms, traditions-home, purpose-criteria, second-stop and all three public nodes. Quotes' own recommended answer unbars them in one clause — 'the ruling a stamp requires is the one the author gives at that sitting, quoted then; words the author said earlier are the ground a draft rests on and bar no stamp' — so the whole question of whether eight fences and twenty-three nodes can carry a ratified stamp turns on a node that is itself unruled and in this batch. The counts recorded on the batch's own findings are stale against the graph: 'twenty-two of the sixty-two nodes' was measured when the graph held 62.

Also named: commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/hexis, commons.systems/disposition-graph/namespaces, commons.systems/disposition-graph/projection, commons.systems/disposition-graph/traditions-home, commons.systems/disposition-graph/forms, commons.systems/disposition-graph/second-stop, commons.systems/disposition-graph/purpose-criteria.

Proposed: Quotes is the survivor and is ruled first among the nodes of this batch, after the periagogic sitting on public/agency that every one of them descends from. Nothing in the eight fences need change before that ruling, because quotes' recommended answer sanctions them; what must not happen is that any of the eight is recorded with a ratified stamp before quotes is ruled, since under the losing option each such stamp is invalid on landing. Quotes' own facts should state the measured size of the bar at the moment of ruling rather than a count fixed in prose, since the count has already moved once.

Recorded as a pending alternative on this node: `fence-carries-the-ruling` (source review, 2026-09-03).

### Frontier finding, 2026-09-03

Kind: merge.

Four questions are each pending as the same alternative on four to six different nodes, so the author would rule one question up to six times. Verified from the frontier's alternatives lists: (i) `say-instrument-not-criterion` is pending on scope, work-loop, transience and purpose, and each entry says the same thing — that until instruments is ruled the answer says 'instrument', the term instruments actually defines, since 'criterion' is in no node's `defines` and 'criteria' is not in FRONTMATTER_KEYS; instruments owns the question and stands at the maieutic stage with `define-criterion` pending. (ii) `delegated-not-ratified` is pending on software-factories, spec-driven-development, srs-introduction and web-routing, each saying that a reading whose source the author has not read is delegated and not ratified; readings owns the rule and all four recommendations have in fact already been corrected to delegated, so four alternatives now stand for a change already made. (iii) `traditions-to-readings` is pending on materialization, validation-order, instruments and evaluation, each saying the node's prose tradition list goes to readings under the stub-traditions ruling; stub-traditions owns the enumeration and its own `regenerate-enumeration` alternative says the enumeration is incomplete and should be derived rather than maintained by hand. (iv) The same ruling appears as `deferred-rather-than-ratified` on legacy and recording, `deferred-until-ruling-quoted` on validation-order and evaluation, and `deferred-not-ratified` on review and persistence — six nodes, three names, one question: whether a node recommending ratification with no ruling quoted in it should drop to deferred instead; quotes owns that question. Under validation 15 each of these is a new answer to a question the record already asks, standing as its own alternative on a node that does not own the question.

Also named: commons.systems/disposition-graph/instruments, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/stub-traditions, commons.systems/disposition-graph/scope, commons.systems/disposition-graph/work-loop, commons.systems/disposition-graph/transience, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/software-factories, commons.systems/disposition-graph/spec-driven-development, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/web-routing, commons.systems/disposition-graph/materialization, commons.systems/disposition-graph/validation-order, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/legacy, commons.systems/disposition-graph/persistence, commons.systems/disposition-graph/review, commons.systems/disposition-graph/recording.

Proposed: Instruments is the survivor of the criterion vocabulary, readings of a reading's class, stub-traditions of the prose tradition lists, and quotes of what an unquoted ratified stamp becomes. Each survivor takes one alternative saying that its ruling settles the question for every node that carries the per-node entry, and each per-node alternative is then a consequence of the survivor's ruling rather than a separate ruling — which is what the record already does for the four readings, whose class was changed once and recorded four times. The four per-node families stay listed so the author can see the blast radius, but the ruling order puts the survivor first and the alignment page should say that confirming the survivor discharges them. Case (ii) is the clearest: all four recommendations already read delegated, so those four alternatives are discharged and should be struck rather than ruled.

Recorded as a pending alternative on commons.systems/disposition-graph/instruments: `one-ruling-for-the-word` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/readings: `one-ruling-for-the-reading-class` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/stub-traditions: `one-ruling-for-the-prose-lists` (source review, 2026-09-03).

Recorded as a pending alternative on this node: `one-ruling-for-the-unquoted-stamp` (source review, 2026-09-03).

### Frontier finding, 2026-09-03

Kind: cross-reference.

Counts and implementation claims recorded across the batch's review sections have moved under them, and several are cited by pending alternatives as though current. Verified against the graph as it stands: `node packages/disposition/validate.mjs disposition` returns 'ok: 68 nodes', not the 62 that eight recorded findings assume; twenty-three nodes carry no '## Disposition' section, not twenty-two; the `defines` fields hold 117 entries, not the 88 the vocabulary findings cite; no node file ends in a bare 'null' (`grep -rn '^null$' disposition/` returns nothing), so the coverage finding of 2026-09-03 on the four bare nulls is discharged; `apply.mjs` and `brief.mjs` exist and are tracked, so the align-review shim's artifact claims hold; and browser-template.html carries an `authorityHtml` function rendering an authority block, so the earlier claim that 'there is no authority section' is stale, while 'unguarded' and 'criteria' still do not occur in it at all. The record's own rule, stated on authority, is that recorded review findings are annotated where they stand rather than rewritten, so none of these is a defect in the sections that carry them; the defect is that quotes' pending `facts-state-the-count` alternative asks the node's facts to state a count, and the count it names is already stale.

Also named: commons.systems/disposition-graph/authority, commons.systems/disposition-graph/projection, commons.systems/disposition-graph/recording, commons.systems/disposition-graph/dialogue.

Proposed: No node's text is wrong and nothing moves. What is owed is that a count the author is asked to ratify be measured at the ruling rather than fixed in prose: quotes' facts state the bar as measured when the author rules, and the review skill's own briefs carry the counts, so the number the author sees is derived. Recording's counter-argument makes the general form of this point — most of what the review checks is mechanical — and frontier-consistency's validations 3, 5 and 11 are the natural home for the checks that would keep these numbers true.
