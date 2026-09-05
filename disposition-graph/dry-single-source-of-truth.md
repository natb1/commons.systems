---
question: What does the rule against duplicating knowledge say about one instruction written in two files, and what does the record take from it?
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
source: Andrew Hunt and David Thomas, The Pragmatic Programmer (1999), "The Evils of Duplication", whose rule is that every piece of knowledge must have a single, unambiguous, authoritative representation within a system, and whose remedy where a fact must appear in several places is to generate the copies; with the materialized view over a normalized store, in Ashish Gupta and Inderpal Singh Mumick, Materialized Views (1999), and the convention of Go's generated code, whose files must carry the line saying they are generated and must not be edited. The relational statement of the same argument is read separately at commons.systems/disposition-graph/codd-update-anomaly, which bears on the same option. Locus to be checked, the page of the rule and of the code-generator remedy in The Pragmatic Programmer.
bears:
  - fact: answer
    option: two-skills-one-package
    relation: adopted
  - node: commons.systems/disposition-graph/prose-and-structure
    fact: answer
    option: prose-argues-structure-records
    relation: adopted
  - node: commons.systems/disposition-graph/delegation
    fact: answer
    option: reconciliation-session-writes-options
    relation: adopted
---
## Answer

Supports the split conditionally, and the condition is the whole of what the record takes. The rule forbids duplicating knowledge and not text: a fact recorded in two places will be updated in one of them, which is the anomaly, and a copy derived mechanically is not that failure, provided the derivation is the only way the copy is made, the copy is never edited by hand, and it says on its face that it is derived. The remedy the same source gives is a generator, and the convention that goes with a generator is a header telling a reader not to edit what it produced.

Applied here, two `SKILL.md` files written by the projector from one node are a materialized view over a normalized store: the knowledge lives once, in the node, and the two files cannot disagree because neither is written by hand. Two `SKILL.md` files written by hand are the anomaly itself, and no discipline short of not doing it makes them safe. The recommended option's drift answer is this rule read honestly rather than optimistically — resolved by construction at the shims' liquidation and not before — and that is what the adoption is for.

What holds in the interim is not this tradition, and the reading should not be read as saying it is. The three guards the answer names work by keeping the duplicated set empty rather than by deriving it — nothing is written in both files that both must keep true, the shared text is fetched from its one home each time a reading runs, and a stale citation is caught when the frontier is read as artifacts. Those are review and disposition, which is the weaker form of the same guarantee, and the shims are the record admitting that the strong form is not built yet.

One departure is worth recording. The tradition's third condition, that a derived artifact says on its face that it is derived, the record already meets for `.claude/rules/`, and the shim notice the transience node projects onto each skill file is the same device used for a file that is not yet derived at all — a notice saying the node wins over the file, standing in for a notice saying the file was written from the node. That is honest as far as it goes, and it is not what the convention asks for.

## Rationale

Read in the tradition survey of the review sitting of 2026-09-04, and named in `review-skills`' account among the readings its pass with reference to tradition owes: "Duplication of knowledge against duplication of text, Hunt and Thomas, 1999, with Codd's update anomaly already minted as `codd-update-anomaly` under `prose-and-structure`, adopted for the drift answer's condition, that a derived copy is no anomaly while it is never edited by hand and says so on its face, and that two hand-written copies are one; a `bears` entry on this node's recommended option is owed on that reading." That entry is recorded on `codd-update-anomaly` rather than restated here, so the relational half of the argument keeps its one home. The survey's condition that the split not be landed ahead of the projector is what the option `split-at-liquidation` carries; this reading records no relation there, since the node's account names only the drift answer's condition.

## Facts

### answer

The standing text is the only reading of these sources the survey produced,
and no second account of what the record takes from them is on the table. A
further relation, adopted on `split-at-liquidation`, is named in the
rationale as arguable and is not written, since the account gives one.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at the recording of `review-skills`' recommendation on 2026-09-04, under the author's bootstrap grant of that day to progress the adversarial-review dispositions through the maieutic movement and reconcile them immediately, from the tradition survey of the review sitting and the pass with reference to tradition that read it, which names this reading among the eight owed under that node. Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.
### A relation added, 2026-09-04

A `bears` entry on `commons.systems/disposition-graph/prose-and-structure`'s
`prose-argues-structure-records`, adopted, added by the readings unit of the
alignment sitting of 2026-09-04 under the author's bootstrap grant of that
day. The account of that node's maieutic movement asks for the tradition "as
Hunt and Thomas state it, that every piece of knowledge has one unambiguous
authoritative representation in a system, which supplies the qualification
this answer needs and Codd does not, that what may not be repeated is
knowledge and not text", and calls it owed as a reading under that node. It is
recorded as an entry here rather than as a second reading because this reading
already holds those sources, and a second node reading them would be the
duplication the option it now bears on forbids. The qualification the node
asks for is the answer's own first sentence.

### Frontier finding, 2026-09-05

Kind: contradiction.

Forty-six reading nodes carry, verbatim, as the first sentence of the `### authority` subsection inside `## Facts`, the claim: "Delegated, as every reading on the record recommends, because the relation is the AI's from its own knowledge of the source and the author has not read it here." The claim is false at this commit. Measured on the graph: 59 nodes carry `form: reading`; 57 recommend `delegated` on the authority fact; `commons.systems/disposition-graph/srs-introduction` recommends `deferred` (disposition/disposition-graph/srs-introduction.md, `### authority`); and `commons.systems/disposition-graph/npm-committed-lockfile` carries an authority fact with its three options and no `recommends` at all (disposition/disposition-graph/npm-committed-lockfile.md, `### authority`). `commons.systems/disposition-graph/readings` carries a variant of the same claim in its authority fact's `against`, at lines 47 and 155: "every reading on the record recommends delegated for itself". The defect is not only that the count is wrong today. A standing answer that asserts a census of the record goes stale the moment a reading is minted, which is exactly what `commons.systems/disposition-graph/authority` records as the option `no-census-in-a-standing-answer` and what the `codd-update-anomaly` reading names — and `codd-update-anomaly` is itself one of the forty-six carrying it. Two nodes have already corrected their live text and carry the formula only in their `## Account`: `madr-decision-records` (line 184) and `progressive-disclosure` (lines 135 and 162); `madr-decision-records`'s corrected text refers the general question to this survey by name. Those two are named here as context and are not defects.

Also named: commons.systems/disposition-graph/anchoring-and-adjustment, commons.systems/disposition-graph/appellate-review-en-banc, commons.systems/disposition-graph/approval-directed-agents, commons.systems/disposition-graph/bentham-publicity, commons.systems/disposition-graph/brooks-surgical-team, commons.systems/disposition-graph/change-reviewed-as-a-diff, commons.systems/disposition-graph/chenery-reasoned-decision, commons.systems/disposition-graph/chestertons-fence, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/deprecation-not-deletion, commons.systems/disposition-graph/dissent-and-reconsideration, commons.systems/disposition-graph/event-sourcing-derived-view, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/file-drawer-and-pre-registration, commons.systems/disposition-graph/hansard-verbatim-record, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/legislative-amendment-in-context, commons.systems/disposition-graph/level-triggered-reconciliation, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/montgomery-informed-consent, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/nielsen-user-control-and-freedom, commons.systems/disposition-graph/none-of-the-above-ballot, commons.systems/disposition-graph/non-liquet, commons.systems/disposition-graph/notarial-minute, commons.systems/disposition-graph/not-proven-third-verdict, commons.systems/disposition-graph/n-version-programming, commons.systems/disposition-graph/ocap-attenuation, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/pareto-frontier, commons.systems/disposition-graph/peirce-paper-doubt, commons.systems/disposition-graph/promotor-fidei, commons.systems/disposition-graph/review-approval-pinned-to-a-revision, commons.systems/disposition-graph/rfc-pep-status-field, commons.systems/disposition-graph/roberts-rules-commit-or-refer, commons.systems/disposition-graph/scholarly-peer-review, commons.systems/disposition-graph/scholastic-articulus, commons.systems/disposition-graph/segregation-of-duties, commons.systems/disposition-graph/self-contained-specification, commons.systems/disposition-graph/single-subject-rule, commons.systems/disposition-graph/special-verdict-form, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand, commons.systems/disposition-graph/value-of-information, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/npm-committed-lockfile, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/progressive-disclosure, commons.systems/disposition-graph/authority.

Proposed: Strike the census from all forty-six and from `readings`' `against`, replacing it with the rule rather than the count: the class recommended is delegated because the relation is the AI's from its own knowledge of the source and the author has not read it here — which is the reason, and which stands whatever other readings recommend. `madr-decision-records` and `progressive-disclosure` have already made this correction in their live text and are the model. Where a node wants to say that this is the record's settled practice for readings, it cites `commons.systems/disposition-graph/class-recommendation` rather than counting. `srs-introduction`'s `deferred` and `npm-committed-lockfile`'s absent recommendation are left as they are: they are the two counterexamples, and the point of the fix is that a rule stated as a rule does not need them to disappear.

Recorded as an option on commons.systems/disposition-graph/authority's answer fact: `no-census-anywhere-in-a-node` (source review, 2026-09-05).
