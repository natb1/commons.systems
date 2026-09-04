---
question: Do architecture decision records in the MADR form support encoding the dialogue state as alternatives with a recommendation among them?
stage: ruling
recommendation:
  adopts: standing
  boldness: high
  amends: "67e9eb68c573831ea8445c23e1e3069c4ce9b056"
  at: "6d21d356d65f5fa206cb60bc3e923c462acc920e"
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: 67e9eb68c573831ea8445c23e1e3069c4ce9b056
facts:
  - name: authority
    choices:
      - ratified
      - delegated
    adopts: delegated
    boldness: high
form: reading
authority:
  class: deferred
  by: claude
  date: 2026-09-03
under:
  - commons.systems/disposition-graph/dialogue
source: Markdown Architectural Decision Records (MADR), the template at adr.github.io/madr, version 4 (Context and Problem Statement, Decision Drivers, Considered Options, Decision Outcome with its chosen option, consequences, and confirmation, Pros and Cons of the Options, More Information; a status of proposed, rejected, accepted, deprecated, or superseded by another record; decision-makers, consulted, and informed), descending from Michael Nygard's architecture decision records of 2011 (Context, Decision, Status, Consequences).
relation: adopted
alternatives:
  - name: divergence-narrows
    source: ai
    ref: "2026-09-04"
depends:
  - commons.systems/disposition-graph/viable-options
---
## Answer

Supports it, and the dialogue state adopts its form. A MADR record lists the considered options, states the chosen option with the reasons that decided it, keeps the pros and cons of every option beside the decision, and carries a status that moves from proposed through accepted, rejected, deprecated, or superseded. The dialogue state on a node is that record kept live: the alternatives with their sources are the considered options, the recommendation naming the alternative it adopts is the decision outcome as proposed, the rationale's rejected lines are the options' cons after the ruling, and the stage is the status. Two differences are recorded as this project's own. MADR stores the status, and this record derives it from the stamp and the stage, since a stored status drifts from the stamp that confers it. MADR's decision-makers, consulted, and informed are one person and one AI here, and the source of each alternative, the author, the AI, the review, or a proposal from outside alignment, carries what those fields carry.

## Rationale

Surfaced in the sitting on the dialogue node on 2026-09-03, when the author asked for the unanswered frontier to be encoded as a recommendation with dialogue state and a list of alternatives, and recorded under that node's rationale as the tradition the encoding adopts. Validated by the AI from its own knowledge of the template; deferred until the author reads it. Divergence recorded: the status is derived, not stored.

## Alternatives

### divergence-narrows

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
