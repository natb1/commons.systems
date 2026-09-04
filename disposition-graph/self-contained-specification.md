---
question: What does the self-contained specification document say about restating the definitions a document needs, and what does the record take from it?
stage: maieutic
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-04"
    recommends: standing
    boldness: moderate
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: delegated
    boldness: moderate
form: reading
under:
  - commons.systems/disposition-graph/prose-and-structure
source: The convention that a specification carries the definitions it needs. IEEE Std 830-1998, Recommended Practice for Software Requirements Specifications, whose section 1 opens with a Definitions, Acronyms and Abbreviations clause, and ISO/IEC/IEEE 29148:2018, whose specification outline carries a terms clause of its own; the definitions clause of a drafted contract, which fixes each defined term inside the instrument that uses it so that the instrument can be read alone; and the terminology section of an IETF RFC, which states the words the document depends on rather than pointing at where they are stated. Locus to be checked, the clause numbers in 29148, and whether the contract convention is better cited to a drafting manual than to practice.
bears:
  - fact: answer
    option: prose-argues-structure-records
    relation: diverged
---
## Answer

Against this answer, and the divergence is recorded with its counter attached. The convention holds that a specification is read alone. Whoever picks it up may have no index, no other volume of the standard, and no way to find where a term was fixed, so the document restates the definitions it needs at the front, and the restatement is not thought of as duplication at all but as the condition of the document being usable. The contract does the same for a stricter reason: the instrument is the whole of what the parties agreed, and a term whose meaning lives outside it is a term the instrument does not control.

This answer says the opposite for a node. A term is glossed once, on the node that defines it, and every other node cites it by id; a passage that restates what a field or another node already holds is liquidated, and what is left in prose is argument. The ground of the departure is that the constraint the convention answers has gone. A node is read through a projector, by an agent that loads the graph, or by a person following an id that resolves, so the reader who cannot find where a term was fixed is not the reader this record has. What the restatement leaves behind, once the lookup is free, is the drift the record has already suffered.

The record should not pretend the constraint has gone everywhere. A node file is read alone more often than the answer admits: in a diff, in a review of one file, by a subagent given one node and its ancestry, and by anyone reading the repository without the projector built. Each of those is the convention's reader, met by a file whose terms are elsewhere. That is the counter, and this answer's reply is a projection and not a copy, which is a reply the convention would not accept, since a document that needs a program to be readable is not a self-contained document.

One half of the convention survives the divergence intact and is worth naming, because the record keeps it. Both sides agree that a reader must be able to reach the definition; they disagree only about whether reaching it means finding it in the same file. The record buys that with the id that resolves and with the validator that refuses one which does not, so the guarantee the convention got from copying is bought here by a check, which is the weaker form of the same thing and is what a divergence from a tradition costs.

## Rationale

Recorded in the pass with reference to tradition of `commons.systems/disposition-graph/prose-and-structure`'s maieutic movement of 2026-09-04, which names it as the tradition on the other side of that node's answer and owes it a reading here: "the self-contained specification document, the convention of restating in each document the definitions it needs, which was rational when a reader had no index and no search and which a projector and an agent reading the graph make unnecessary, leaving the redundancy with no effect but drift". It bears on `prose-argues-structure-records` because that option is the rule the convention contradicts, and the relation is `diverged` because the record's own rule is that a divergence is recorded rather than argued away. `commons.systems/disposition-graph/srs-introduction` reads one of the same sources, IEEE Std 830, for a different question, the progression a specification opens with; the two readings do not overlap in what they take, and no relation is written from that node here.

## Facts

### answer

The standing text is the only reading of this convention the pass produced,
and no second account of what the record takes from it is on the table. What
is open is the fidelity the source line names, whether the contract branch of
the convention is cited to the right authority.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at reconciliation on 2026-09-04 under the author's bootstrap grant of that day, by a unit of the alignment sitting, from the pass with reference to tradition in `commons.systems/disposition-graph/prose-and-structure`'s maieutic movement, which names this tradition among the readings owed under that node. Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.
