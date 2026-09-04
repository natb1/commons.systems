---
question: Do architecture decision records in the MADR form support encoding the dialogue state as alternatives with a recommendation among them?
stage: review
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: c38c74c977c5f7b56fe67c30fc32ef2a4180f413
facts:
  - name: answer
    options:
      - name: status-derived-from-stamp
        source: ai
        ref: "2026-09-03"
      - name: divergence-narrows
        source: ai
        ref: "2026-09-04"
    recommends: divergence-narrows
    boldness: high
    stands: divergence-narrows
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: delegated
    boldness: high
form: reading
under:
  - commons.systems/disposition-graph/dialogue
source: Markdown Architectural Decision Records (MADR), the template at adr.github.io/madr, version 4 (Context and Problem Statement, Decision Drivers, Considered Options, Decision Outcome with its chosen option, consequences, and confirmation, Pros and Cons of the Options, More Information; a status of proposed, rejected, accepted, deprecated, or superseded by another record; decision-makers, consulted, and informed), descending from Michael Nygard's architecture decision records of 2011 (Context, Decision, Status, Consequences).
bears:
  - fact: answer
    option: facts-carry-options
    relation: adopted
  - fact: answer
    option: alternatives-beside-facts
    relation: adopted
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: grant-from-a-ruling
    relation: adopted
depends:
  - commons.systems/disposition-graph/viable-options
---
## Answer

Supports it, and the record adopts its form. A MADR record lists the considered options, states the chosen option with the reasons that decided it, keeps the pros and cons of every option beside the decision, and carries a status that moves from proposed through accepted, rejected, deprecated, or superseded. A fact on a node is that record kept live: the options with their sources are the considered options, the recommended option is the decision outcome as proposed, the confirmed choice with the author's reason is the outcome as accepted, the options that persist after the ruling with the reasons they were not taken are the pros and cons kept beside the decision, and the stage is the status while the dialogue is open. One difference is recorded as this project's own: MADR stores the status, and this record stores the stage and derives the status and the class from the rulings on the facts, since a stored status drifts from the rulings that confer it. MADR's decision-makers, consulted, and informed are one person and one AI here, and the source of each option, the author, the AI, the review, or the instrument or node that raised it, carries what those fields carry.

## Rationale

Surfaced in the sitting on the dialogue node on 2026-09-03, when the author asked for the unanswered frontier to be encoded as a recommendation with dialogue state and a list of alternatives, and recorded under that node's rationale as the tradition the encoding adopts. Validated by the AI from its own knowledge of the template; deferred until the author reads it. Divergence recorded: the status is derived, not stored.

Amended 2026-09-04 under the author's bootstrap grant of that day, recorded on the viable-options node, whose model keeps the considered options after the decision as MADR keeps them, so the divergence narrows to what is stored: the stage, where MADR stores the status. The review's finding that the divergence as written was half wrong is met by the same narrowing. The reading as it stood is kept as the option `status-derived-from-stamp`; this reading is still validated from the AI's own knowledge of the template and its review is owed.

## Facts

### answer

#### status-derived-from-stamp

The reading as it stood from 2026-09-03: MADR supports the dialogue state, whose alternatives with their sources are the considered options and whose rejected lines in the rationale are the options' cons after the ruling, with two divergences, the status derived from the stamp and the stage, and the decision-makers folded into the source. Viable if the author prefers the options folded into the rationale at the recording.

#### divergence-narrows

Under the viable-options model the considered options persist after the decision as MADR keeps them, with the reasons each was not taken, so the recorded divergence narrows to what is stored: the stage is stored and the status is derived from the rulings on the facts, where MADR stores the status. The review's finding that the divergence as written was half wrong is met by the same narrowing. Raised on commons.systems/disposition-graph/viable-options.

## Account

A reading node written under the author's bootstrap grant on the dialogue node, 2026-09-03, as the reconciliation recorded on that node requires. Facts: delegated, since readings are delegated in this graph and the author has not asked to rule on each; boldness high, since the reading rests on the AI's knowledge of the MADR template and the author has not yet read the source. Persistence: standing. Open for the author: whether the template's version and sections are cited accurately; whether the derived status is the right divergence to record.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
The recommendation adopts `standing` and is pinned to the standing text as it was at that commit.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer, the recorded divergence: 'MADR stores the status, and this record derives it from the stamp and the stage, since a stored status drifts from the stamp that confers it.' Half of this is inaccurate as a reading of the record's own encoding: the *status* is derived, but the *stage* — which the same sentence maps onto MADR's status — is a stored field that the validator requires on every unanswered node. So the record stores a status-like field and derives another, and the divergence as written claims more distance from the tradition than the encoding has. Suggested edit: say the status is derived from a stored stage and a stored stamp, and that the divergence is in what is stored, not in whether anything is.
- The node carries no '## Disposition' section and no author words: it was written under the bootstrap grant on dialogue and its only ground is the AI's knowledge of the template. That is correctly stated in the account ('Validated by the AI from its own knowledge of the template; deferred until the author reads it') and correctly classed delegated.
- Answer: 'a status that moves from proposed through accepted, rejected, deprecated, or superseded'. The reading cites no version of the MADR template and no locus. Readings' recommended text makes a reading's source the primary text and locus; this node's `source` should name which MADR version's status list it is reading, since the list has changed between versions.
- The node is the only reading in the graph mounted under `dialogue` rather than under a disposition it grounds in the ordinary way, and it is the tradition dialogue's rationale names as the one the encoding adopts. Nothing is wrong with the placement; it is worth the author knowing that ruling dialogue ratifies an encoding whose only recorded tradition has never been read by anyone but the AI.
- Its `alternatives` list is empty and it has never been reviewed: this is its first reading.

On the three facts: The frontmatter recommendation (adopts standing, delegated, high) states one class and one value and the pin is current; delegated is the class readings' rule confers on a source the author has not read, and high is right, since the whole reading rests on the AI's knowledge of the template. Persistence standing follows from the node's shape. The account's open items — whether the template's version and sections are cited accurately, and whether the derived status is the right divergence — are exactly the two things this reading cannot presently support.

Strongest counter-argument (moderate): The reading is doing more work than its rank suggests and rests on less. Dialogue's encoding — alternatives with sources, a recommendation that adopts one, a rationale carrying the rejected options — is the record's central schema, and this node is the only place the tradition behind it is examined; yet the examination is one paragraph from the AI's memory of a template, with no version, no locus, and one divergence that is half wrong. If the MADR mapping is the justification for the encoding, it should be read from the source before dialogue is ratified; if it is not the justification but a post-hoc citation, the record should say so, since evaluation requires every tradition surfaced to be recorded 'with the resolution it informed'.

The session's reply: Forward accepted. The half-wrong divergence (stage is stored, status is derived) and the missing version and locus are accepted and left for the sitting, since amending the answer changes the standing text of a node the batch forwards.
