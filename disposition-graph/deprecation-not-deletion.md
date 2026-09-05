---
question: What does deprecation rather than deletion say about a thing on its way out, and what does the record take from it?
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
  - commons.systems/disposition-graph/viable-options
source: The practice of marking an interface as on its way out instead of removing it. The `@deprecated` Javadoc tag and the `@Deprecated` annotation of Java, from the 1990s onward, whose contract is that the element still works, that its use is discouraged, and that the replacement is named; the obsoleting and updating relations RFC 2026 defines between standards-track documents, and the Deprecation response header field of HTTP, standardized in an RFC of 2025, which lets a server say that a resource is deprecated and point at its successor; and the deprecation policies of platform vendors, which require a named successor and a stated window before removal. Locus to be checked, the Java version at which the annotation joined the tag, and the number and date of the HTTP Deprecation RFC.
bears:
  - fact: answer
    option: passed-over-options-stay
    relation: adopted
  - node: commons.systems/disposition-graph/rejected
    fact: answer
    option: passed-over-stays-listed
    relation: adopted
---
## Answer

Supports the mark, and supplies the reason the mark and not the deletion is the act. The practice's premise is that the consumers of a thing are not in the room when it is retired. Removing it is a decision made on their behalf and communicated by the failure it causes; marking it keeps the thing working, tells them it is on its way out, and names what to use instead, so the retirement is something they can see and plan against rather than something they discover. The mark is therefore a communication and not a bookkeeping state, and it is addressed to a party the remover cannot consult.

The record takes it exactly. A candidate the AI holds dominated keeps its place on the fact, carries the status passed with the one clause saying why, and acts on nothing, being neither what the fact recommends nor what stands; the option that displaced it is what the clause names, which is the tradition's named successor. The consumer here is the later session and the author, neither of whom is in the room when the AI makes the dominance judgment, and the alternative the record rejected, dropping the candidate to version control, is retirement by removal with the notice sent to a place no reader of the record ever visits.

The tradition also settles who may do which of the two acts, and the record's answer matches it. Marking is the maintainer's, since it is a claim about the design; removal is a release decision, taken by someone who can weigh the breakage and announce it. In the record the AI passes over on its own authority and lifts the status on the same authority, and striking an option is the author's alone, so the party that may be wrong is not the party that may remove the evidence.

Where they part, with the counter attached. Deprecation is a promise about a future removal; the window and the eventual deletion are the point of it, and a deprecation with no end is a known failure mode that vendors and standards bodies both complain of, because the marked surface accumulates and the mark stops meaning anything. The record makes no such promise. A passed-over option is kept indefinitely, the list grows to the size the rationales already carried in prose, and the only exit is the author's strike. So the record takes the mark and drops the window, and the tradition's own experience says that is the half that decays; what the record has against it is that a fact's options are read at the decision they belong to rather than carried by every consumer, so the accumulation costs a longer page and not a larger surface to maintain.

## Rationale

Surfaced by the maieutic movement of `commons.systems/disposition-graph/viable-options` on 2026-09-04 as one of three traditions the record did not carry, and recorded there as a reading owed under that node: "deprecation rather than deletion in standards and interface practice, where a thing on its way out is marked and kept so that its consumers can see what happened". `commons.systems/disposition-graph/rejected`'s movement of the same day records the three as owed for the pair, which is why this reading carries a second entry on that node's recommended option. `commons.systems/disposition-graph/transience`' rationale names deprecation at Google in a prose tradition list for a different question, how a shim is retired; that reading is owed under `commons.systems/disposition-graph/stub-traditions`' ruling and no relation is written from here to it.

## Facts

### answer

The standing text is the only reading of this practice the record has
produced, and no second account of what it takes from it is on the table.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at reconciliation on 2026-09-04 under the author's bootstrap grant of that day, by a unit of the alignment sitting, from the pass with reference to tradition in `commons.systems/disposition-graph/viable-options`' maieutic movement on the membership of an option list, which names this tradition among the three owed as readings under that node and which `commons.systems/disposition-graph/rejected` records as owed for the pair. Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.

### Frontier finding, 2026-09-05

Kind: contradiction.

Forty-six reading nodes carry, verbatim, as the first sentence of the `### authority` subsection inside `## Facts`, the claim: "Delegated, as every reading on the record recommends, because the relation is the AI's from its own knowledge of the source and the author has not read it here." The claim is false at this commit. Measured on the graph: 59 nodes carry `form: reading`; 57 recommend `delegated` on the authority fact; `commons.systems/disposition-graph/srs-introduction` recommends `deferred` (disposition/disposition-graph/srs-introduction.md, `### authority`); and `commons.systems/disposition-graph/npm-committed-lockfile` carries an authority fact with its three options and no `recommends` at all (disposition/disposition-graph/npm-committed-lockfile.md, `### authority`). `commons.systems/disposition-graph/readings` carries a variant of the same claim in its authority fact's `against`, at lines 47 and 155: "every reading on the record recommends delegated for itself". The defect is not only that the count is wrong today. A standing answer that asserts a census of the record goes stale the moment a reading is minted, which is exactly what `commons.systems/disposition-graph/authority` records as the option `no-census-in-a-standing-answer` and what the `codd-update-anomaly` reading names — and `codd-update-anomaly` is itself one of the forty-six carrying it. Two nodes have already corrected their live text and carry the formula only in their `## Account`: `madr-decision-records` (line 184) and `progressive-disclosure` (lines 135 and 162); `madr-decision-records`'s corrected text refers the general question to this survey by name. Those two are named here as context and are not defects.

Also named: commons.systems/disposition-graph/anchoring-and-adjustment, commons.systems/disposition-graph/appellate-review-en-banc, commons.systems/disposition-graph/approval-directed-agents, commons.systems/disposition-graph/bentham-publicity, commons.systems/disposition-graph/brooks-surgical-team, commons.systems/disposition-graph/change-reviewed-as-a-diff, commons.systems/disposition-graph/chenery-reasoned-decision, commons.systems/disposition-graph/chestertons-fence, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/dissent-and-reconsideration, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/event-sourcing-derived-view, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/file-drawer-and-pre-registration, commons.systems/disposition-graph/hansard-verbatim-record, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/legislative-amendment-in-context, commons.systems/disposition-graph/level-triggered-reconciliation, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/montgomery-informed-consent, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/nielsen-user-control-and-freedom, commons.systems/disposition-graph/none-of-the-above-ballot, commons.systems/disposition-graph/non-liquet, commons.systems/disposition-graph/notarial-minute, commons.systems/disposition-graph/not-proven-third-verdict, commons.systems/disposition-graph/n-version-programming, commons.systems/disposition-graph/ocap-attenuation, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/pareto-frontier, commons.systems/disposition-graph/peirce-paper-doubt, commons.systems/disposition-graph/promotor-fidei, commons.systems/disposition-graph/review-approval-pinned-to-a-revision, commons.systems/disposition-graph/rfc-pep-status-field, commons.systems/disposition-graph/roberts-rules-commit-or-refer, commons.systems/disposition-graph/scholarly-peer-review, commons.systems/disposition-graph/scholastic-articulus, commons.systems/disposition-graph/segregation-of-duties, commons.systems/disposition-graph/self-contained-specification, commons.systems/disposition-graph/single-subject-rule, commons.systems/disposition-graph/special-verdict-form, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand, commons.systems/disposition-graph/value-of-information, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/npm-committed-lockfile, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/progressive-disclosure, commons.systems/disposition-graph/authority.

Proposed: Strike the census from all forty-six and from `readings`' `against`, replacing it with the rule rather than the count: the class recommended is delegated because the relation is the AI's from its own knowledge of the source and the author has not read it here — which is the reason, and which stands whatever other readings recommend. `madr-decision-records` and `progressive-disclosure` have already made this correction in their live text and are the model. Where a node wants to say that this is the record's settled practice for readings, it cites `commons.systems/disposition-graph/class-recommendation` rather than counting. `srs-introduction`'s `deferred` and `npm-committed-lockfile`'s absent recommendation are left as they are: they are the two counterexamples, and the point of the fix is that a rule stated as a rule does not need them to disappear.

Recorded as an option on commons.systems/disposition-graph/authority's answer fact: `no-census-anywhere-in-a-node` (source review, 2026-09-05).
