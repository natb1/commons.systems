---
question: What does N-version programming and the independence experiment say about two readers of one text, and what does the record take from it?
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
source: Algirdas Avizienis and Liming Chen, N-version programming, presented at COMPSAC in 1977, where several independently developed versions of one program are run and their results compared so that a fault in one is caught by the others; and John C. Knight and Nancy G. Leveson, "An experimental evaluation of the assumption of independence in multiversion programming", IEEE Transactions on Software Engineering SE-12(1) (1986), whose independently written versions failed together on correlated inputs far more often than independence predicts, so that independence must be demonstrated and is never inferred from separate construction. The layered form of the same rule, that defences in depth work only where their failure modes are uncorrelated, is James Reason's, in Human Error (1990) and Managing the Risks of Organizational Accidents (1997).
bears:
  - fact: answer
    option: chosen-for-difference
    relation: adopted
  - fact: answer
    option: fable-for-both-readings
    relation: diverged
---
## Answer

Against reading a text twice with the same kind of mind, and the experiment is what makes it more than a slogan. Redundancy buys nothing where the redundant parts fail together, and the hard result is that separately built versions of one specification do fail together: their authors share a training, and the specification's own ambiguities are read the same wrong way by each. The rule the experiment leaves is that independence is a property to be demonstrated and never inferred from the fact that two things were made apart.

Adopted on `chosen-for-difference`. A reviewer chosen for difference from the drafter rather than for rank over it is this prescription applied to readers: the second reading buys what it is bought for only where it does not fail where the first failed, and a reader chosen for rank is chosen on the axis the experiment says is not the one that matters.

Diverged on `fable-for-both-readings`. Two readings on one model share a prior; the clean context removes the shared framing and not the shared blind spot, which is exactly the inference the experiment falsified. The answer's reply is that the four models the harness offers are one lineage, so what a choice among them buys is a difference of capability and not the independence the experiment demanded; that reply concedes the tradition's point rather than meeting it. The record does not have an independent second reader, and the divergence records that it does not.

The tradition's own standard is failed on both sides, and the reading says so rather than resting on the concession. Knight and Leveson measured correlation and did not assume it; here nothing is measured, so the claim that four models of one lineage fail together is the AI's from its knowledge of how they are built, which is the kind of claim the experiment exists to distrust. What the record could do about it is bought in the brief and not in the reader, since the brief is where a reading's framing is set. Shelved once by a constraint that has gone: N-version programming died because paying several teams to build one artifact was uneconomic, and a second reader that is a different model costs a token bill, so the caution is actionable here in a way it was not where it was raised.

## Rationale

Read in the tradition survey of the review sitting of 2026-09-04, which raised `chosen-for-difference` as a third option from it, and named in `review-model`'s account among the six that its pass with reference to tradition owes: "N-version programming with the independence experiment, from Avizienis and Chen and from Knight and Leveson, adopted on `chosen-for-difference` and diverged from on `fable-for-both-readings`, since the difference four models of one lineage can buy is of capability and is not the independence the experiment demanded be demonstrated". Reason's layered-defence statement is carried in the source as the general form of the same rule and grounds no separate relation.

## Facts

### answer

The standing text is the only reading of the experiment the survey produced,
and no second account of what the record takes from it is on the table.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at the recording of `review-model`'s recommendation on 2026-09-04, under the author's bootstrap grant of that day to progress the adversarial-review dispositions through the maieutic movement and reconcile them immediately, from the tradition survey of the review sitting and the pass with reference to tradition that read it, which names this reading among the six owed under that node. Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.

### Frontier finding, 2026-09-05

Kind: contradiction.

Forty-six reading nodes carry, verbatim, as the first sentence of the `### authority` subsection inside `## Facts`, the claim: "Delegated, as every reading on the record recommends, because the relation is the AI's from its own knowledge of the source and the author has not read it here." The claim is false at this commit. Measured on the graph: 59 nodes carry `form: reading`; 57 recommend `delegated` on the authority fact; `commons.systems/disposition-graph/srs-introduction` recommends `deferred` (disposition/disposition-graph/srs-introduction.md, `### authority`); and `commons.systems/disposition-graph/npm-committed-lockfile` carries an authority fact with its three options and no `recommends` at all (disposition/disposition-graph/npm-committed-lockfile.md, `### authority`). `commons.systems/disposition-graph/readings` carries a variant of the same claim in its authority fact's `against`, at lines 47 and 155: "every reading on the record recommends delegated for itself". The defect is not only that the count is wrong today. A standing answer that asserts a census of the record goes stale the moment a reading is minted, which is exactly what `commons.systems/disposition-graph/authority` records as the option `no-census-in-a-standing-answer` and what the `codd-update-anomaly` reading names — and `codd-update-anomaly` is itself one of the forty-six carrying it. Two nodes have already corrected their live text and carry the formula only in their `## Account`: `madr-decision-records` (line 184) and `progressive-disclosure` (lines 135 and 162); `madr-decision-records`'s corrected text refers the general question to this survey by name. Those two are named here as context and are not defects.

Also named: commons.systems/disposition-graph/anchoring-and-adjustment, commons.systems/disposition-graph/appellate-review-en-banc, commons.systems/disposition-graph/approval-directed-agents, commons.systems/disposition-graph/bentham-publicity, commons.systems/disposition-graph/brooks-surgical-team, commons.systems/disposition-graph/change-reviewed-as-a-diff, commons.systems/disposition-graph/chenery-reasoned-decision, commons.systems/disposition-graph/chestertons-fence, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/deprecation-not-deletion, commons.systems/disposition-graph/dissent-and-reconsideration, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/event-sourcing-derived-view, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/file-drawer-and-pre-registration, commons.systems/disposition-graph/hansard-verbatim-record, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/legislative-amendment-in-context, commons.systems/disposition-graph/level-triggered-reconciliation, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/montgomery-informed-consent, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/nielsen-user-control-and-freedom, commons.systems/disposition-graph/none-of-the-above-ballot, commons.systems/disposition-graph/non-liquet, commons.systems/disposition-graph/notarial-minute, commons.systems/disposition-graph/not-proven-third-verdict, commons.systems/disposition-graph/ocap-attenuation, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/pareto-frontier, commons.systems/disposition-graph/peirce-paper-doubt, commons.systems/disposition-graph/promotor-fidei, commons.systems/disposition-graph/review-approval-pinned-to-a-revision, commons.systems/disposition-graph/rfc-pep-status-field, commons.systems/disposition-graph/roberts-rules-commit-or-refer, commons.systems/disposition-graph/scholarly-peer-review, commons.systems/disposition-graph/scholastic-articulus, commons.systems/disposition-graph/segregation-of-duties, commons.systems/disposition-graph/self-contained-specification, commons.systems/disposition-graph/single-subject-rule, commons.systems/disposition-graph/special-verdict-form, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand, commons.systems/disposition-graph/value-of-information, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/npm-committed-lockfile, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/progressive-disclosure, commons.systems/disposition-graph/authority.

Proposed: Strike the census from all forty-six and from `readings`' `against`, replacing it with the rule rather than the count: the class recommended is delegated because the relation is the AI's from its own knowledge of the source and the author has not read it here — which is the reason, and which stands whatever other readings recommend. `madr-decision-records` and `progressive-disclosure` have already made this correction in their live text and are the model. Where a node wants to say that this is the record's settled practice for readings, it cites `commons.systems/disposition-graph/class-recommendation` rather than counting. `srs-introduction`'s `deferred` and `npm-committed-lockfile`'s absent recommendation are left as they are: they are the two counterexamples, and the point of the fix is that a rule stated as a rule does not need them to disappear.

Recorded as an option on commons.systems/disposition-graph/authority's answer fact: `no-census-anywhere-in-a-node` (source review, 2026-09-05).
