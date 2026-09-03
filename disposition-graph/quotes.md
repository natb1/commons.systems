---
question: How are the author's words retained when a ruling is recorded?
stage: review
recommendation:
  adopts: ruling-stays-in-node
  class: ratified
  boldness: moderate
  amends: "6d201558a0f7a7edbc82636c72a3cd4852d90562"
  at: "6d21d356d65f5fa206cb60bc3e923c462acc920e"
alternatives:
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
under:
  - commons.systems/disposition-graph/authority
---
## Alternatives

### ruling-stays-in-node

The author's verbatim ruling stays in the node, under a Disposition section with its date, and is rolled up at the next sitting; the commit message carries it in addition. This is the option the session moved the recommended marker to after the first review's counter-argument, and it is what every node amended on 2026-09-03 already does. It owes a rule for the roll-up, whose shape no node describes.

### ruling-in-commit-message

No new schema: the ruling goes verbatim into the message of the commit that lands it, the rationale restates it, and a quote appears inline only where the wording itself is the decision. The session withdrew this after the counter-argument that no projection, validator or clean-context reviewer reads commit messages, which would make authority's invalid-stamp rule uncheckable. The second review still argues it has one virtue worth weighing, that verbatim rulings kept in nodes accumulate to nine quotations on purpose and eight on work-loop that the author reads past on every page.

### sittings-graph

A sittings graph holds each sitting's record as evidence, cited by the nodes it ruled on, so the verbatim words live in one place and the nodes reach them by citation. It is the highest-boldness of the three options and is neither recommended nor withdrawn.

### edited-not-verbatim

The author's words carried verbatim on authority state a candidate answer to this node's question: quotes are rarely expected to be recorded as disposition verbatim, the dialogue is expected to edit for clarification and writing quality, and retaining the original quotes as reference is a function that must earn new schema. This node carries those words only as a paraphrase in its account and has no `## Disposition` section of its own, and the option it now recommends — the verbatim ruling stays in the node under Disposition, rolled up at the next sitting — is in tension with the first half of them. (Raised on commons.systems/disposition-graph/authority.)

### facts-state-the-count

The placement finding proposes that quotes be ruled first after agency, since its resolution is a bar on roughly a third of the frontier: twenty-two of the sixty-two nodes carry no Disposition section and so cannot support a ratified stamp under authority's rule. It proposes that quotes' facts state that count, and it finds that quotes' own Options block still marks as recommended the option its session reply withdrew, so an author taking the recommended option would take the withdrawn one; the marker is to be moved before the author rules. Raised on commons.systems/disposition-graph/recording, commons.systems/disposition-graph/evaluation.

## Recommendation

```markdown
---
question: How are the author's words retained when a ruling is recorded?
form: rule
authority:
  class: ratified
  by: Nathan Buesgens
  date: <the date of the ruling>
under:
  - commons.systems/disposition-graph/authority
---
## Answer

The verbatim ruling stays in the node. When a sitting records a ruling, the author's words are quoted in the node's Disposition section with their date, and the message of the commit that lands the node carries them in addition. The rationale restates the ruling in the record's own register; the quotation is what the restatement is of, and is never replaced by it. The section accumulates, and each sitting on the node rolls up the quotations its answer has absorbed, version control holding what the roll-up drops. A ratified stamp whose ruling is not in the node is invalid, and the ruling a stamp requires is the one the author gives at that sitting, quoted then; words the author said earlier are the ground a draft rests on and bar no stamp.

## Rationale

The author's decisions are the one thing re-derivation cannot reconstruct, so they are what the record stores, and a restatement is by construction the AI's wording of them, which is the drift this record exists to resist. Nothing reads commit messages: the browser renders node files, the validator parses node files, and the clean-context review reads node files, so a ruling kept only in a landing commit would make the rule that a ratified stamp needs its ruling in the record unverifiable by any instrument. The cost is accumulation, which the roll-up pays sitting by sitting and which the author has already accepted for appended records. Rejected: no new schema, with the ruling verbatim only in the landing commit's message, because it moves the one irreplaceable artifact to the one surface no projection, no validator and no reviewer reads; and a sittings graph holding each sitting as evidence, because it buys durability at the price of a second graph and an indirection between a node and the words that bind it. The author, 2026-09-03, asked for this: author quotes are rarely expected to be recorded as disposition verbatim and the dialogue edits for clarification and writing quality, but "it may make sense to retain original author quotes as reference though - evaluate whether this function earns new schema".
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
