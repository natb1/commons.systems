---
question: What does the single-subject rule say about composing several decisions into one, and what does the record take from it?
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
  - commons.systems/disposition-graph/dialogue
source: The single-subject rule of legislative drafting, by which a bill embraces one subject, expressed in its title, so that a legislator votes on one thing at a time and a measure cannot pass by riding on another. Carried in most United States state constitutions, among them Article IV of the Illinois Constitution of 1970 and Article IV of the California Constitution, and enforced by courts that strike down logrolled acts; with the germaneness requirement, which is the same principle applied to amendments, and the line-item veto, which is the executive's remedy where the rule failed. The federal Congress has no such rule, which is why the practice it exists against, logrolling, is named from federal experience. Locus to be checked, the section numbers of the two constitutional provisions and a leading case on the rule's enforcement.
bears:
  - fact: answer
    option: every-part-in-the-record
    relation: diverged
  - node: commons.systems/disposition-graph/recording
    fact: answer
    option: per-fact-after-two-readings
    relation: diverged
---
## Answer

Against this option, and the divergence is the case the recommendation has to beat. The rule's claim is about consent, not tidiness. A decider presented with several decisions in one vote gives one answer that cannot be taken apart afterwards, and the party that drafted the bundle chose which decisions travelled with which. What the decider consented to is then unrecoverable, and the drafter has taken with the popular clause what would not have passed alone. The remedy the tradition reaches for is structural rather than procedural, one subject per instrument, because a warning in the preamble does not undo the arithmetic of a single vote.

`every-part-in-the-record` composes the standing encoding with five clauses adopted into it and asks the author for one ruling on the result. On the tradition's terms that is the thing the rule forbids, and the record does not deny it: the fact's own case against says the confirmation would confer together what the author examined and what they did not, and `commons.systems/disposition-graph/node`'s rule that a text answering two questions is two nodes is the single-subject rule already stated in the record's own words, which this composition sits in tension with.

What the record offers against it, recorded here as the reply and not as a resolution. The five clauses keep their own rows on the answer fact, each saying what a ruling for it alone would adopt, so the author may rule on one instead of the bundle; and the argument for composing is that an option is what a ruling is stored as, so an option must name the whole of what a ruling for it would take, and five clause-deltas ruled separately would leave no text that says the encoding whole. The tradition's answer to both is available and is not weak. Keeping the parts visible beside the bundle is what a committee report does, and the rule exists because that was found not to be enough; and if the encoding cannot be stated except whole, the tradition would say the subject is one subject and the title should say so, which is a claim about this node's question and not about the vote.

The divergence stands recorded and is not resolved in the reading's favour. Whether the composition is one subject or six is the question the author answers by ruling, and the tradition's contribution is that the question is theirs and not the drafter's.

## Rationale

Surfaced by the second evaluation of `commons.systems/disposition-graph/dialogue`'s maieutic movement of 2026-09-04 and named in the fence's rationale among the readings owed under that node: "the single-subject rule, which diverges from this answer and is the case against composing five clauses into one option". It bears on `every-part-in-the-record` because that is the composed option, and the relation is `diverged` because the account gives it as the case against and `commons.systems/disposition-graph/evaluation` requires a divergence to be recorded rather than argued away. The same tension is named from the other side in `commons.systems/disposition-graph/special-verdict-form` under this node, which is cited for dividing a decision into the questions the judgment needs.

## Facts

### answer

The standing text is the only reading of this rule the pass produced, and no
second account of what the record takes from it is on the table.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at reconciliation on 2026-09-04 under the author's bootstrap grant of that day, by a unit of the alignment sitting, from the pass with reference to tradition in `commons.systems/disposition-graph/dialogue`'s maieutic movement, which names this tradition among the readings owed under that node and gives its relation as a divergence. Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.

### A second divergence, 2026-09-05

The clean-context reading of `recording` found this reading arguing directly against the move that node's recommendation makes, and nothing recording the conflict: `per-fact-after-two-readings` composes the division of the review, the typing of the kick-back, the per-fact classification of a response and the persistence of the options into one option the author takes or leaves, which is the compounding this reading says is a decision not ruled on. The `evaluation` node makes an unrecorded conflict a frontier item deferred to neither side, so it is recorded rather than resolved: a second `bears` entry, relation diverged, and a sentence in that node's rationale answering the argument in its own terms. The author rules on the composition with the record's argument against it in front of them, which is all this entry claims to secure.

### Frontier finding, 2026-09-05

Kind: contradiction.

Forty-six reading nodes carry, verbatim, as the first sentence of the `### authority` subsection inside `## Facts`, the claim: "Delegated, as every reading on the record recommends, because the relation is the AI's from its own knowledge of the source and the author has not read it here." The claim is false at this commit. Measured on the graph: 59 nodes carry `form: reading`; 57 recommend `delegated` on the authority fact; `commons.systems/disposition-graph/srs-introduction` recommends `deferred` (disposition/disposition-graph/srs-introduction.md, `### authority`); and `commons.systems/disposition-graph/npm-committed-lockfile` carries an authority fact with its three options and no `recommends` at all (disposition/disposition-graph/npm-committed-lockfile.md, `### authority`). `commons.systems/disposition-graph/readings` carries a variant of the same claim in its authority fact's `against`, at lines 47 and 155: "every reading on the record recommends delegated for itself". The defect is not only that the count is wrong today. A standing answer that asserts a census of the record goes stale the moment a reading is minted, which is exactly what `commons.systems/disposition-graph/authority` records as the option `no-census-in-a-standing-answer` and what the `codd-update-anomaly` reading names — and `codd-update-anomaly` is itself one of the forty-six carrying it. Two nodes have already corrected their live text and carry the formula only in their `## Account`: `madr-decision-records` (line 184) and `progressive-disclosure` (lines 135 and 162); `madr-decision-records`'s corrected text refers the general question to this survey by name. Those two are named here as context and are not defects.

Also named: commons.systems/disposition-graph/anchoring-and-adjustment, commons.systems/disposition-graph/appellate-review-en-banc, commons.systems/disposition-graph/approval-directed-agents, commons.systems/disposition-graph/bentham-publicity, commons.systems/disposition-graph/brooks-surgical-team, commons.systems/disposition-graph/change-reviewed-as-a-diff, commons.systems/disposition-graph/chenery-reasoned-decision, commons.systems/disposition-graph/chestertons-fence, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/deprecation-not-deletion, commons.systems/disposition-graph/dissent-and-reconsideration, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/event-sourcing-derived-view, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/file-drawer-and-pre-registration, commons.systems/disposition-graph/hansard-verbatim-record, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/legislative-amendment-in-context, commons.systems/disposition-graph/level-triggered-reconciliation, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/montgomery-informed-consent, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/nielsen-user-control-and-freedom, commons.systems/disposition-graph/none-of-the-above-ballot, commons.systems/disposition-graph/non-liquet, commons.systems/disposition-graph/notarial-minute, commons.systems/disposition-graph/not-proven-third-verdict, commons.systems/disposition-graph/n-version-programming, commons.systems/disposition-graph/ocap-attenuation, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/pareto-frontier, commons.systems/disposition-graph/peirce-paper-doubt, commons.systems/disposition-graph/promotor-fidei, commons.systems/disposition-graph/review-approval-pinned-to-a-revision, commons.systems/disposition-graph/rfc-pep-status-field, commons.systems/disposition-graph/roberts-rules-commit-or-refer, commons.systems/disposition-graph/scholarly-peer-review, commons.systems/disposition-graph/scholastic-articulus, commons.systems/disposition-graph/segregation-of-duties, commons.systems/disposition-graph/self-contained-specification, commons.systems/disposition-graph/special-verdict-form, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand, commons.systems/disposition-graph/value-of-information, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/npm-committed-lockfile, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/progressive-disclosure, commons.systems/disposition-graph/authority.

Proposed: Strike the census from all forty-six and from `readings`' `against`, replacing it with the rule rather than the count: the class recommended is delegated because the relation is the AI's from its own knowledge of the source and the author has not read it here — which is the reason, and which stands whatever other readings recommend. `madr-decision-records` and `progressive-disclosure` have already made this correction in their live text and are the model. Where a node wants to say that this is the record's settled practice for readings, it cites `commons.systems/disposition-graph/class-recommendation` rather than counting. `srs-introduction`'s `deferred` and `npm-committed-lockfile`'s absent recommendation are left as they are: they are the two counterexamples, and the point of the fix is that a rule stated as a rule does not need them to disappear.

Recorded as an option on commons.systems/disposition-graph/authority's answer fact: `no-census-anywhere-in-a-node` (source review, 2026-09-05).
