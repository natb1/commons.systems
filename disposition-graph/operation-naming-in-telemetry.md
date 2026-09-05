---
question: What does operation naming in telemetry say about two operations reported under one name, and what does the record take from it?
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
  - commons.systems/disposition-graph/review-skills
source: The naming of operations in instrumentation, in the OpenTelemetry tracing specification's rule for span names, that a name identifies a statistically interesting class of spans and is kept low in cardinality, with the semantic conventions putting the detail that varies into attributes such as `code.function`, `rpc.method` and `http.route`; and in the RED method, Tom Wilkie (2016), which reads rate, errors and duration per operation, after Brendan Gregg's USE method (2012). Locus to be checked, the version of the specification at which the span-name rule is read.
bears:
  - fact: answer
    option: one-skill-named-operation
    relation: adopted
  - fact: answer
    option: two-skills-one-package
    relation: diverged
---
## Answer

States the author's motive exactly and prescribes a different remedy for it. Rate, errors and duration are read per operation, so two operations with different cost, latency and failure distributions must carry different operation names or every percentile computed over them is a mixture of two populations that no reader can separate afterwards. The detail that varies belongs in attributes and never in the name, which is why the name is kept to a class of spans worth counting.

The diagnosis fits the case without adjustment. A draft's reading over one node's neighbourhood and a survey over the whole graph are two populations by every measure the record has: the two draft readings of 2026-09-04 are reported at about four hundred and eighty thousand tokens each over briefs of four thousand six hundred and fifty-one and three thousand one hundred and eighty-one lines, and the survey's brief is five hundred and nineteen thousand four hundred bytes over the frontier with a pins sidecar beside it. Under one name neither reading's median is knowable, and the yield the sibling question waits on cannot be measured at all. The same rule settles the naive extension: two names, and never one per node, since a name is a class and not an identifier.

Adopted on `one-skill-named-operation`, because that option is the tradition's own remedy. The convention fixes the operation's name, which is a property of the instrumentation, and does not refactor the program to change what the traces say; its answer to "I cannot tell two operations apart in my traces" is to name them apart, and the era of services split to obtain separate dashboards is the failure the convention exists to make unnecessary.

Diverged on `two-skills-one-package`, because the recommended option answers the diagnosis by dividing the program, which is what the convention declines to do, and the reading says why the record does it anyway: the remedy is unavailable only on the author's premise that the harness attributes a skill's usage to its directory, a property of an instrument the record does not own and cannot verify, since it holds no telemetry configuration and no reading of one. The answer's other grounds for the split are other traditions' and not this one's; on this tradition's ground the recommended option is a departure, and the reading records it as one rather than letting the motive stand in for the remedy. Nothing here claims the specification prescribes how a program is factored: what it prescribes is the name.

## Rationale

Read in the tradition survey of the review sitting of 2026-09-04, and named in `review-skills`' account among the readings its pass with reference to tradition owes: "Operation naming in telemetry, the OpenTelemetry span conventions and the RED method, adopted for the author's motive stated exactly, two populations under one name, and diverged from in its remedy, to name the operation rather than refactor the program, which the author's premise makes unavailable." The account gives the two relations without naming the options they attach to; the adoption is written on the option that is the remedy and the divergence on the option that departs from it, which is the shape `review-model`'s account uses for the same case. The diagnosis, which every option on the fact serves, is carried in the answer and grounds no third entry.

## Facts

### answer

The standing text is the only reading of these conventions the survey
produced, and no second account of what the record takes from them is on the
table. A second account would attach the adoption to the recommended option
for the motive rather than to the option carrying the remedy, and nothing in
the record argues for it.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at the recording of `review-skills`' recommendation on 2026-09-04, under the author's bootstrap grant of that day to progress the adversarial-review dispositions through the maieutic movement and reconcile them immediately, from the tradition survey of the review sitting and the pass with reference to tradition that read it, which names this reading among the eight owed under that node. Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.

### Frontier finding, 2026-09-05

Kind: contradiction.

Forty-six reading nodes carry, verbatim, as the first sentence of the `### authority` subsection inside `## Facts`, the claim: "Delegated, as every reading on the record recommends, because the relation is the AI's from its own knowledge of the source and the author has not read it here." The claim is false at this commit. Measured on the graph: 59 nodes carry `form: reading`; 57 recommend `delegated` on the authority fact; `commons.systems/disposition-graph/srs-introduction` recommends `deferred` (disposition/disposition-graph/srs-introduction.md, `### authority`); and `commons.systems/disposition-graph/npm-committed-lockfile` carries an authority fact with its three options and no `recommends` at all (disposition/disposition-graph/npm-committed-lockfile.md, `### authority`). `commons.systems/disposition-graph/readings` carries a variant of the same claim in its authority fact's `against`, at lines 47 and 155: "every reading on the record recommends delegated for itself". The defect is not only that the count is wrong today. A standing answer that asserts a census of the record goes stale the moment a reading is minted, which is exactly what `commons.systems/disposition-graph/authority` records as the option `no-census-in-a-standing-answer` and what the `codd-update-anomaly` reading names — and `codd-update-anomaly` is itself one of the forty-six carrying it. Two nodes have already corrected their live text and carry the formula only in their `## Account`: `madr-decision-records` (line 184) and `progressive-disclosure` (lines 135 and 162); `madr-decision-records`'s corrected text refers the general question to this survey by name. Those two are named here as context and are not defects.

Also named: commons.systems/disposition-graph/anchoring-and-adjustment, commons.systems/disposition-graph/appellate-review-en-banc, commons.systems/disposition-graph/approval-directed-agents, commons.systems/disposition-graph/bentham-publicity, commons.systems/disposition-graph/brooks-surgical-team, commons.systems/disposition-graph/change-reviewed-as-a-diff, commons.systems/disposition-graph/chenery-reasoned-decision, commons.systems/disposition-graph/chestertons-fence, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/deprecation-not-deletion, commons.systems/disposition-graph/dissent-and-reconsideration, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/event-sourcing-derived-view, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/file-drawer-and-pre-registration, commons.systems/disposition-graph/hansard-verbatim-record, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/legislative-amendment-in-context, commons.systems/disposition-graph/level-triggered-reconciliation, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/montgomery-informed-consent, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/nielsen-user-control-and-freedom, commons.systems/disposition-graph/none-of-the-above-ballot, commons.systems/disposition-graph/non-liquet, commons.systems/disposition-graph/notarial-minute, commons.systems/disposition-graph/not-proven-third-verdict, commons.systems/disposition-graph/n-version-programming, commons.systems/disposition-graph/ocap-attenuation, commons.systems/disposition-graph/pareto-frontier, commons.systems/disposition-graph/peirce-paper-doubt, commons.systems/disposition-graph/promotor-fidei, commons.systems/disposition-graph/review-approval-pinned-to-a-revision, commons.systems/disposition-graph/rfc-pep-status-field, commons.systems/disposition-graph/roberts-rules-commit-or-refer, commons.systems/disposition-graph/scholarly-peer-review, commons.systems/disposition-graph/scholastic-articulus, commons.systems/disposition-graph/segregation-of-duties, commons.systems/disposition-graph/self-contained-specification, commons.systems/disposition-graph/single-subject-rule, commons.systems/disposition-graph/special-verdict-form, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand, commons.systems/disposition-graph/value-of-information, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/npm-committed-lockfile, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/progressive-disclosure, commons.systems/disposition-graph/authority.

Proposed: Strike the census from all forty-six and from `readings`' `against`, replacing it with the rule rather than the count: the class recommended is delegated because the relation is the AI's from its own knowledge of the source and the author has not read it here — which is the reason, and which stands whatever other readings recommend. `madr-decision-records` and `progressive-disclosure` have already made this correction in their live text and are the model. Where a node wants to say that this is the record's settled practice for readings, it cites `commons.systems/disposition-graph/class-recommendation` rather than counting. `srs-introduction`'s `deferred` and `npm-committed-lockfile`'s absent recommendation are left as they are: they are the two counterexamples, and the point of the fix is that a rule stated as a rule does not need them to disappear.

Recorded as an option on commons.systems/disposition-graph/authority's answer fact: `no-census-anywhere-in-a-node` (source review, 2026-09-05).
