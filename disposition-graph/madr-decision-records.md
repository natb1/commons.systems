---
question: Do architecture decision records in the MADR form support encoding the dialogue state as alternatives with a recommendation among them?
stage: review
recommendation:
  class: delegated
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
---
## Answer

Supports it, and the dialogue state adopts its form. A MADR record lists the considered options, states the chosen option with the reasons that decided it, keeps the pros and cons of every option beside the decision, and carries a status that moves from proposed through accepted, rejected, deprecated, or superseded. The dialogue state on a node is that record kept live: the alternatives with their sources are the considered options, the recommendation naming the alternative it adopts is the decision outcome as proposed, the rationale's rejected lines are the options' cons after the ruling, and the stage is the status. Two differences are recorded as this project's own. MADR stores the status, and this record derives it from the stamp and the stage, since a stored status drifts from the stamp that confers it. MADR's decision-makers, consulted, and informed are one person and one AI here, and the source of each alternative, the author, the AI, the review, or a proposal from outside alignment, carries what those fields carry.

## Rationale

Surfaced in the sitting on the dialogue node on 2026-09-03, when the author asked for the unanswered frontier to be encoded as a recommendation with dialogue state and a list of alternatives, and recorded under that node's rationale as the tradition the encoding adopts. Validated by the AI from its own knowledge of the template; deferred until the author reads it. Divergence recorded: the status is derived, not stored.

## Proposal

A reading node written under the author's bootstrap grant on the dialogue node, 2026-09-03, as the reconciliation recorded on that node requires. Facts: delegated, since readings are delegated in this graph and the author has not asked to rule on each; boldness high, since the reading rests on the AI's knowledge of the MADR template and the author has not yet read the source. Persistence: standing. Open for the author: whether the template's version and sections are cited accurately; whether the derived status is the right divergence to record.
