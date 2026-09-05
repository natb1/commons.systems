---
question: What does the office of the promotor fidei say about an adversary attached to every candidate, and what does the record take from it?
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
  - commons.systems/disposition-graph/recording
source: The promotor fidei, the promoter of the faith, the office established under Sixtus V in 1587 and charged with arguing against every cause for beatification and canonization, popularly the devil's advocate; and its abolition as a party to the process by the apostolic constitution Divinus perfectionis Magister of 1983, which replaced the adversarial procedure with a relator preparing a positio and a college of theological consultors voting on it. Locus to be checked, the 1587 constitution by name and date, the articles of the 1983 constitution, and whether the office's later name, prelate theologian, carries the same function.
bears:
  - fact: answer
    option: per-fact-after-two-readings
    relation: adopted
  - node: commons.systems/disposition-graph/clean-context-review
    fact: answer
    option: per-draft-and-survey
    relation: adopted
  - node: commons.systems/disposition-graph/clean-context-review
    fact: answer
    option: pointers-for-what-grows-with-the-record
    relation: adopted
---
## Answer

Supports a reading attached by office rather than raised by whoever happens to object, and supplies the constitution of it. The tradition's move is to stop treating the objection as something that may or may not turn up. It is an office, it is on every cause without exception, and the case for the candidate is not complete until the office has argued against it and been answered. Two limits go with the office and both are structural. The promoter argues on the record, so its objection is a document the deciders must meet rather than a private reservation; and it cannot stop the cause, since it holds no vote and the decision belongs to the body it argues before.

The record takes all three. A reading stands between every recorded recommendation and the author, invoked the moment the recommendation is recorded rather than when someone thinks it warranted; its findings and its counter-argument are written into the node, where the author reads them beside the recommendation; and it recommends and never writes, so a kickback is an objection the session answers and, where the session holds its ground, overrides on the record. That is the office's shape kept intact, including the part that is easy to lose, which is that the adversary does not decide.

The abolition of 1983 is part of the tradition and the reading should carry it. The office was removed not because objection stopped mattering but because a permanent adversary was found to make the process slow and to produce objections at the rate the office was staffed for rather than at the rate the causes deserved. What replaced it puts the case together with its difficulties in one document and has a college judge it. That is a live argument against the record's design, and the record's own answer to the manufactured objection is not this office but `commons.systems/disposition-graph/peirce-paper-doubt` under this node, which is why the counter-argument is optional and the reading says when it found none.

Where the analogy is thin. The promoter is a different person, in a different office, with an interest of its own in the integrity of the process, and its independence is institutional. Both readings here are contexts of one class of mind, so what the record buys is independence of framing and not of interest, which is the same limit `commons.systems/disposition-graph/segregation-of-duties` records under `commons.systems/disposition-graph/review-model`. The tradition lends no support to the substitute; it supplies the office and leaves the record to say what fills it.

## Rationale

Named in the pass with reference to tradition of `commons.systems/disposition-graph/recording`'s maieutic movement of 2026-09-04, among the traditions surfaced there and each owed as a reading under that node: "The office of the promotor fidei, an adversary attached by office to every candidate and unable to stall, only to object on the record, for the reading that stands between a draft and the author." The same node's standing rationale had named it in prose since 2026-09-03, which `commons.systems/disposition-graph/readings` and `commons.systems/disposition-graph/prose-and-structure` both forbid, since a tradition named only in prose carries no `bears` entry and no pin. It bears on `per-fact-after-two-readings`, the recommended option, which is where the reading's standing before the author is set out. `commons.systems/disposition-graph/review-model`'s tradition survey surfaced the same office and did not mint it, since it informed no resolution there; it informed one here, which is why the reading is filed under this node.

## Facts

### answer

The standing text is the only reading of this office the record has produced,
and no second account of what it takes from it is on the table. What is open
is the fidelity the source line names, the dating of the office and the
articles of its abolition.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at reconciliation on 2026-09-04 under the author's bootstrap grant of that day, by a unit of the alignment sitting, from the pass with reference to tradition in `commons.systems/disposition-graph/recording`'s maieutic movement, which names this tradition among the readings owed under that node. Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.

### A second bearing, 2026-09-05

The clean-context reading of `clean-context-review` found that this reading, sitting one level above that node under `recording`, argues directly about clauses of that node's own fence while bearing only on the parent's option, so the frontier showed the child's design as grounded in no tradition at all. A second `bears` entry is added, naming `commons.systems/disposition-graph/clean-context-review`, its answer fact, and the option `per-draft-and-survey`, with the relation adopted. The option named is the one whose design this reading informed, and it remains viable beside the recommendation that has since moved past it to `pointers-for-what-grows-with-the-record`; the tradition grounds the division and the office of the reading, and not the pointer form, which is measured rather than traditional.

### Frontier finding, 2026-09-05

Kind: contradiction.

Forty-six reading nodes carry, verbatim, as the first sentence of the `### authority` subsection inside `## Facts`, the claim: "Delegated, as every reading on the record recommends, because the relation is the AI's from its own knowledge of the source and the author has not read it here." The claim is false at this commit. Measured on the graph: 59 nodes carry `form: reading`; 57 recommend `delegated` on the authority fact; `commons.systems/disposition-graph/srs-introduction` recommends `deferred` (disposition/disposition-graph/srs-introduction.md, `### authority`); and `commons.systems/disposition-graph/npm-committed-lockfile` carries an authority fact with its three options and no `recommends` at all (disposition/disposition-graph/npm-committed-lockfile.md, `### authority`). `commons.systems/disposition-graph/readings` carries a variant of the same claim in its authority fact's `against`, at lines 47 and 155: "every reading on the record recommends delegated for itself". The defect is not only that the count is wrong today. A standing answer that asserts a census of the record goes stale the moment a reading is minted, which is exactly what `commons.systems/disposition-graph/authority` records as the option `no-census-in-a-standing-answer` and what the `codd-update-anomaly` reading names — and `codd-update-anomaly` is itself one of the forty-six carrying it. Two nodes have already corrected their live text and carry the formula only in their `## Account`: `madr-decision-records` (line 184) and `progressive-disclosure` (lines 135 and 162); `madr-decision-records`'s corrected text refers the general question to this survey by name. Those two are named here as context and are not defects.

Also named: commons.systems/disposition-graph/anchoring-and-adjustment, commons.systems/disposition-graph/appellate-review-en-banc, commons.systems/disposition-graph/approval-directed-agents, commons.systems/disposition-graph/bentham-publicity, commons.systems/disposition-graph/brooks-surgical-team, commons.systems/disposition-graph/change-reviewed-as-a-diff, commons.systems/disposition-graph/chenery-reasoned-decision, commons.systems/disposition-graph/chestertons-fence, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/deprecation-not-deletion, commons.systems/disposition-graph/dissent-and-reconsideration, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/event-sourcing-derived-view, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/file-drawer-and-pre-registration, commons.systems/disposition-graph/hansard-verbatim-record, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/legislative-amendment-in-context, commons.systems/disposition-graph/level-triggered-reconciliation, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/montgomery-informed-consent, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/nielsen-user-control-and-freedom, commons.systems/disposition-graph/none-of-the-above-ballot, commons.systems/disposition-graph/non-liquet, commons.systems/disposition-graph/notarial-minute, commons.systems/disposition-graph/not-proven-third-verdict, commons.systems/disposition-graph/n-version-programming, commons.systems/disposition-graph/ocap-attenuation, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/pareto-frontier, commons.systems/disposition-graph/peirce-paper-doubt, commons.systems/disposition-graph/review-approval-pinned-to-a-revision, commons.systems/disposition-graph/rfc-pep-status-field, commons.systems/disposition-graph/roberts-rules-commit-or-refer, commons.systems/disposition-graph/scholarly-peer-review, commons.systems/disposition-graph/scholastic-articulus, commons.systems/disposition-graph/segregation-of-duties, commons.systems/disposition-graph/self-contained-specification, commons.systems/disposition-graph/single-subject-rule, commons.systems/disposition-graph/special-verdict-form, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand, commons.systems/disposition-graph/value-of-information, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/npm-committed-lockfile, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/progressive-disclosure, commons.systems/disposition-graph/authority.

Proposed: Strike the census from all forty-six and from `readings`' `against`, replacing it with the rule rather than the count: the class recommended is delegated because the relation is the AI's from its own knowledge of the source and the author has not read it here — which is the reason, and which stands whatever other readings recommend. `madr-decision-records` and `progressive-disclosure` have already made this correction in their live text and are the model. Where a node wants to say that this is the record's settled practice for readings, it cites `commons.systems/disposition-graph/class-recommendation` rather than counting. `srs-introduction`'s `deferred` and `npm-committed-lockfile`'s absent recommendation are left as they are: they are the two counterexamples, and the point of the fix is that a rule stated as a rule does not need them to disappear.

Recorded as an option on commons.systems/disposition-graph/authority's answer fact: `no-census-anywhere-in-a-node` (source review, 2026-09-05).
