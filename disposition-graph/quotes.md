---
question: How are the author's words retained when a ruling is recorded?
stage: ruling
recommendation:
  class: ratified
  boldness: moderate
review:
  verdict: forward
  strength: strong
  date: 2026-09-03
  of: 6d201558a0f7a7edbc82636c72a3cd4852d90562
under:
  - commons.systems/disposition-graph/authority
---

## Proposal

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
