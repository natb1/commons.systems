---
question: How are the author's words retained when a ruling is recorded?
stage: ruling
under:
  - commons.systems/disposition-graph/authority
---

## Proposal

### Sitting on purpose, 2026-09-03

**The author's words**

The author, 2026-09-03: quotes are rarely recorded as disposition verbatim; dialogue edits for clarification and writing quality; retaining the original quote as reference may earn schema, and would be subject to the accumulation rule, appended records rolled up with git holding history. Today growth, transience, and review quote the author verbatim in their rationales, and authority says the ruling is quoted in the node.

Options:
- (recommended) No new schema. The ruling verbatim in the message of the commit that lands it; the rationale restates it; a quote appears inline only where the wording itself is the decision — authority ratified; boldness moderate; persistence standing
- A rulings list appended on the node, rolled up into the rationale at the next sitting — authority ratified; boldness moderate; persistence standing
- A sittings graph holding each sitting's record as evidence, cited by the nodes it ruled on — authority ratified; boldness high; persistence standing

Feeds: `authority`, `growth`, `transience`

Rulings open: take the recommended option; take another option by number; defer; answer in prose.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The recommended option puts the verbatim ruling 'in the message of the commit that lands it'. No projection reads commit messages: the browser renders node files, the validator parses node files, and the clean-context review reads node files. Authority's rule 'a ratified stamp whose ruling is not in the record is invalid' becomes unverifiable by any instrument. Suggested edit: say which instrument checks it.
- Every drafted node at this sitting drops its '## Disposition' section and none quotes a ruling in its rationale, so the six drafts carrying 'class: ratified' (purpose, authority, node, instruments, readings, namespaces, projection) would be invalid the moment they land under today's authority wording. This question must therefore be ruled before any of them is recorded. The Proposal does not say so.
- Projection's draft says the browser projects 'an authority section projected from the stamp, the ruling behind it, the alternatives the rationale rejected'. Under option 1 the ruling behind it is in a commit message and cannot be projected. Suggested edit: say whether the authority section projects the restatement or the verbatim ruling.

On the three facts: Ratified, moderate boldness, standing is right. The facts must add that this question is a prerequisite: no node in this batch can be recorded with a ratified stamp until it is ruled, because none of the drafts carries a quoted ruling.

Strongest counter-argument (strong): Transience's own justification for storing anything is that 'what is stored is what re-derivation cannot reconstruct, the author's decisions'. The author's verbatim words are the paradigm case: they cannot be re-derived from the graph, and a restatement is by construction the AI's wording of them, which is the drift the record exists to resist. Option 1 moves the one irreplaceable artifact to the one surface no projection, no validator and no clean-context reviewer reads, on an orphan ref whose history is the least durable part of this system. The record already treats commit history as the home of superseded answers, which is a different function: an old answer can be re-derived from its successor, a ruling cannot. Option 2, an appended rulings list rolled up at the next sitting, keeps them in the record at the accumulation cost the author has already accepted.

The session's reply: The counter-argument wins. The recommendation changes to the second option: the verbatim ruling stays in the node, under Disposition with its date, rolled up at the next sitting, and the commit message carries it in addition. This is what every node amended on 2026-09-03 already does. The prerequisite is added to the facts: no ratified stamp lands without the quoted ruling in the node.
