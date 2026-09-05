---
question: What does scholarly peer review say about the standing of the reader, and what does the record take from it?
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
  - commons.systems/disposition-graph/review-model
source: The referee system of the learned journal, in the Philosophical Transactions of the Royal Society under Oldenburg from 1665, in the Society's Committee on Papers of 1752, which put a paper before members of the Society before it was printed, and Melinda Baldwin, "Scientific Autonomy, Public Accountability, and the Rise of 'Peer Review' in the Cold War United States", Isis 109(3) (2018), for how the modern practice and its name were made. Locus to be checked, the 1665 and 1752 loci, which are conventionally cited rather than read here, and whether "a peer, of comparable standing and not superior" is the tradition's own formulation or this reading's characterization of it.
bears:
  - fact: answer
    option: fable-for-both-readings
    relation: adopted
  - node: commons.systems/disposition-graph/recording
    fact: answer
    option: per-fact-after-two-readings
    relation: adopted
---
## Answer

Supports one standard of reader across both readings. The referee is a peer: of comparable standing to the author, not a superior, and the venue's standard of reader is one standard applied to every submission it accepts. Blinding, where the practice uses it, removes the author's identity so that the argument is judged on its merits and not on who made it. Grading the referee's stature to the perceived importance of a submission is the mark of a tiered system of venues, not of the practice inside one.

The record takes the uniform standard and the identity of the peer. The party whose blind spots a clean-context reading hunts is the main thread, which runs on the most capable model at full effort and reads its own integrated draft before the reading is launched; the peer of that party is a reader of the same standing, and under `fable-for-both-readings` that is what both readings get. One venue, one standard of reader, whatever is submitted to it.

The tradition reads the record's abandoned floor charitably and cuts against the tier above it. "Never smaller than the drafter's" is the peer floor stated as a floor, so the rule the record carried was not against this tradition in its first half; what the tradition refuses is the second half, a formula that gives a bold draft a stronger reader and a modest one a weaker reader, which is a two-tier venue inside one record. That relation is not written on `conditional-by-boldness` here because `review-model`'s account records the adoption alone; a `bears` entry there is owed if the author reads the tradition the way the survey did.

Where the analogy is thin, the reading says so. A referee is a person with a career, a rival's paper in the same field, and reasons of their own to be careful, and blinding exists to neutralize a status that a model does not have. What survives the transposition is the standard of the reader and not the sociology that enforced it, so the tradition supplies a rule for how a reader is chosen and nothing that makes the choice stick.

## Rationale

Read in the tradition survey of the review sitting of 2026-09-04, and named in `review-model`'s account among the six that its pass with reference to tradition owes: "scholarly peer review, from the Royal Society's Committee on Papers of 1752 and Baldwin's history of 2018, adopted on `fable-for-both-readings`, for one standard of reader across both readings, the peer of the main thread being the main thread's model". The survey also read the same tradition against the conditional half of the rule the record carried, as a two-tier venue; the account gives one relation, which is what is written, and the second is named in the answer as owed rather than recorded as a relation the account does not give.

## Facts

### answer

The standing text is the only reading of the referee system the survey
produced. A second account, that the tradition bears on `conditional-by-boldness`
as a divergence as well, is named in the answer and is not recorded as an
option, since it is a further relation of this same reading rather than a
different reading of the sources.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at the recording of `review-model`'s recommendation on 2026-09-04, under the author's bootstrap grant of that day to progress the adversarial-review dispositions through the maieutic movement and reconcile them immediately, from the tradition survey of the review sitting and the pass with reference to tradition that read it, which names this reading among the six owed under that node. Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.
### A relation added, 2026-09-04

A `bears` entry on `commons.systems/disposition-graph/recording`'s
`per-fact-after-two-readings`, adopted, added by the readings unit of the
alignment sitting of 2026-09-04 under the author's bootstrap grant of that
day. That node's account asks for "blinded peer review, for the independence
of the reader's context rather than of the record it reads", and its facts
prose names the debt in the same terms, "the reader whose context is
independent of the writer's". Blinding is part of the practice this reading
already holds, so it is an entry and not a second reading of the referee
system, which is the idiom this reading's own facts section sets.

### Frontier finding, 2026-09-05

Kind: contradiction.

Forty-six reading nodes carry, verbatim, as the first sentence of the `### authority` subsection inside `## Facts`, the claim: "Delegated, as every reading on the record recommends, because the relation is the AI's from its own knowledge of the source and the author has not read it here." The claim is false at this commit. Measured on the graph: 59 nodes carry `form: reading`; 57 recommend `delegated` on the authority fact; `commons.systems/disposition-graph/srs-introduction` recommends `deferred` (disposition/disposition-graph/srs-introduction.md, `### authority`); and `commons.systems/disposition-graph/npm-committed-lockfile` carries an authority fact with its three options and no `recommends` at all (disposition/disposition-graph/npm-committed-lockfile.md, `### authority`). `commons.systems/disposition-graph/readings` carries a variant of the same claim in its authority fact's `against`, at lines 47 and 155: "every reading on the record recommends delegated for itself". The defect is not only that the count is wrong today. A standing answer that asserts a census of the record goes stale the moment a reading is minted, which is exactly what `commons.systems/disposition-graph/authority` records as the option `no-census-in-a-standing-answer` and what the `codd-update-anomaly` reading names — and `codd-update-anomaly` is itself one of the forty-six carrying it. Two nodes have already corrected their live text and carry the formula only in their `## Account`: `madr-decision-records` (line 184) and `progressive-disclosure` (lines 135 and 162); `madr-decision-records`'s corrected text refers the general question to this survey by name. Those two are named here as context and are not defects.

Also named: commons.systems/disposition-graph/anchoring-and-adjustment, commons.systems/disposition-graph/appellate-review-en-banc, commons.systems/disposition-graph/approval-directed-agents, commons.systems/disposition-graph/bentham-publicity, commons.systems/disposition-graph/brooks-surgical-team, commons.systems/disposition-graph/change-reviewed-as-a-diff, commons.systems/disposition-graph/chenery-reasoned-decision, commons.systems/disposition-graph/chestertons-fence, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/deprecation-not-deletion, commons.systems/disposition-graph/dissent-and-reconsideration, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/event-sourcing-derived-view, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/file-drawer-and-pre-registration, commons.systems/disposition-graph/hansard-verbatim-record, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/legislative-amendment-in-context, commons.systems/disposition-graph/level-triggered-reconciliation, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/montgomery-informed-consent, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/nielsen-user-control-and-freedom, commons.systems/disposition-graph/none-of-the-above-ballot, commons.systems/disposition-graph/non-liquet, commons.systems/disposition-graph/notarial-minute, commons.systems/disposition-graph/not-proven-third-verdict, commons.systems/disposition-graph/n-version-programming, commons.systems/disposition-graph/ocap-attenuation, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/pareto-frontier, commons.systems/disposition-graph/peirce-paper-doubt, commons.systems/disposition-graph/promotor-fidei, commons.systems/disposition-graph/review-approval-pinned-to-a-revision, commons.systems/disposition-graph/rfc-pep-status-field, commons.systems/disposition-graph/roberts-rules-commit-or-refer, commons.systems/disposition-graph/scholastic-articulus, commons.systems/disposition-graph/segregation-of-duties, commons.systems/disposition-graph/self-contained-specification, commons.systems/disposition-graph/single-subject-rule, commons.systems/disposition-graph/special-verdict-form, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand, commons.systems/disposition-graph/value-of-information, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/npm-committed-lockfile, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/progressive-disclosure, commons.systems/disposition-graph/authority.

Proposed: Strike the census from all forty-six and from `readings`' `against`, replacing it with the rule rather than the count: the class recommended is delegated because the relation is the AI's from its own knowledge of the source and the author has not read it here — which is the reason, and which stands whatever other readings recommend. `madr-decision-records` and `progressive-disclosure` have already made this correction in their live text and are the model. Where a node wants to say that this is the record's settled practice for readings, it cites `commons.systems/disposition-graph/class-recommendation` rather than counting. `srs-introduction`'s `deferred` and `npm-committed-lockfile`'s absent recommendation are left as they are: they are the two counterexamples, and the point of the fix is that a rule stated as a rule does not need them to disappear.

Recorded as an option on commons.systems/disposition-graph/authority's answer fact: `no-census-anywhere-in-a-node` (source review, 2026-09-05).
