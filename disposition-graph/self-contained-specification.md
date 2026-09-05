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

### Frontier finding, 2026-09-05

Kind: contradiction.

Forty-six reading nodes carry, verbatim, as the first sentence of the `### authority` subsection inside `## Facts`, the claim: "Delegated, as every reading on the record recommends, because the relation is the AI's from its own knowledge of the source and the author has not read it here." The claim is false at this commit. Measured on the graph: 59 nodes carry `form: reading`; 57 recommend `delegated` on the authority fact; `commons.systems/disposition-graph/srs-introduction` recommends `deferred` (disposition/disposition-graph/srs-introduction.md, `### authority`); and `commons.systems/disposition-graph/npm-committed-lockfile` carries an authority fact with its three options and no `recommends` at all (disposition/disposition-graph/npm-committed-lockfile.md, `### authority`). `commons.systems/disposition-graph/readings` carries a variant of the same claim in its authority fact's `against`, at lines 47 and 155: "every reading on the record recommends delegated for itself". The defect is not only that the count is wrong today. A standing answer that asserts a census of the record goes stale the moment a reading is minted, which is exactly what `commons.systems/disposition-graph/authority` records as the option `no-census-in-a-standing-answer` and what the `codd-update-anomaly` reading names — and `codd-update-anomaly` is itself one of the forty-six carrying it. Two nodes have already corrected their live text and carry the formula only in their `## Account`: `madr-decision-records` (line 184) and `progressive-disclosure` (lines 135 and 162); `madr-decision-records`'s corrected text refers the general question to this survey by name. Those two are named here as context and are not defects.

Also named: commons.systems/disposition-graph/anchoring-and-adjustment, commons.systems/disposition-graph/appellate-review-en-banc, commons.systems/disposition-graph/approval-directed-agents, commons.systems/disposition-graph/bentham-publicity, commons.systems/disposition-graph/brooks-surgical-team, commons.systems/disposition-graph/change-reviewed-as-a-diff, commons.systems/disposition-graph/chenery-reasoned-decision, commons.systems/disposition-graph/chestertons-fence, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/deprecation-not-deletion, commons.systems/disposition-graph/dissent-and-reconsideration, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/event-sourcing-derived-view, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/file-drawer-and-pre-registration, commons.systems/disposition-graph/hansard-verbatim-record, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/legislative-amendment-in-context, commons.systems/disposition-graph/level-triggered-reconciliation, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/montgomery-informed-consent, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/nielsen-user-control-and-freedom, commons.systems/disposition-graph/none-of-the-above-ballot, commons.systems/disposition-graph/non-liquet, commons.systems/disposition-graph/notarial-minute, commons.systems/disposition-graph/not-proven-third-verdict, commons.systems/disposition-graph/n-version-programming, commons.systems/disposition-graph/ocap-attenuation, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/pareto-frontier, commons.systems/disposition-graph/peirce-paper-doubt, commons.systems/disposition-graph/promotor-fidei, commons.systems/disposition-graph/review-approval-pinned-to-a-revision, commons.systems/disposition-graph/rfc-pep-status-field, commons.systems/disposition-graph/roberts-rules-commit-or-refer, commons.systems/disposition-graph/scholarly-peer-review, commons.systems/disposition-graph/scholastic-articulus, commons.systems/disposition-graph/segregation-of-duties, commons.systems/disposition-graph/single-subject-rule, commons.systems/disposition-graph/special-verdict-form, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand, commons.systems/disposition-graph/value-of-information, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/npm-committed-lockfile, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/progressive-disclosure, commons.systems/disposition-graph/authority.

Proposed: Strike the census from all forty-six and from `readings`' `against`, replacing it with the rule rather than the count: the class recommended is delegated because the relation is the AI's from its own knowledge of the source and the author has not read it here — which is the reason, and which stands whatever other readings recommend. `madr-decision-records` and `progressive-disclosure` have already made this correction in their live text and are the model. Where a node wants to say that this is the record's settled practice for readings, it cites `commons.systems/disposition-graph/class-recommendation` rather than counting. `srs-introduction`'s `deferred` and `npm-committed-lockfile`'s absent recommendation are left as they are: they are the two counterexamples, and the point of the fix is that a rule stated as a rule does not need them to disappear.

Recorded as an option on commons.systems/disposition-graph/authority's answer fact: `no-census-anywhere-in-a-node` (source review, 2026-09-05).
