---
question: What does IBIS say about attaching an argument to a position rather than to the issue, and what does the record take from it?
stage: maieutic
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-04"
    recommends: standing
    boldness: moderate
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: delegated
    boldness: moderate
review:
  survey:
    date: 2026-09-07
    commit: edc5af91d942319c12174309e388a244de61fa52
    text:
      question: "3022d9986938d7085cd69aedd5e2ba96674bd1fffaf3fd90a2130907c48833b6"
      answer: "e5d97943f3c182a0644cd33ababb888989034f2cda3ea66d55e3f08a12c93b4f"
      options: "31dd163c5efa1d54dd12d55ca70d70fe64326ec779647e32342f73528c22160a"
      rivals: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      words: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
form: reading
under:
  - commons.systems/disposition-graph/viable-options
source: Kunz and Rittel, "Issues as Elements of Information Systems", Working Paper 131, Institute of Urban and Regional Development, University of California, Berkeley (1970), which builds an information system for argumentative planning out of issues, the positions taken on them, and the arguments that support or object to each position; with Rittel and Webber on wicked problems (1973) behind it and Conklin and Begeman's gIBIS (1988) and dialogue mapping after it.
bears:
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: grant-from-a-ruling
    relation: adopted
  - node: commons.systems/disposition-graph/readings
    fact: answer
    option: relation-per-option
    relation: adopted
  - node: commons.systems/disposition-graph/alignment-page
    fact: answer
    option: every-fact-every-option
    relation: adopted
---

## Facts

### answer

The standing text is the only reading of this working paper the record has
produced, and no second account of what it takes from it is on the table.

#### standing

Supports, and its central structural claim is the one the record arrived at twice on its own.

**AI support.** Adopted in two places at once, which is why the reading is one node with three bearings. The rationale of `viable-options` names IBIS as a tradition of its answer, for positions with the arguments for and against each; and the tradition pass on the alignment page of 2026-09-04 found the relation-per-option change the author made that day to be IBIS's central structural claim rediscovered, so it bears on the option that carries that change on `readings` and on the page option that renders the argument beside the position it argues about.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does IBIS say about attaching an argument to a position rather than to the issue, and what does the record take from it?
form: reading
under:
  - commons.systems/disposition-graph/viable-options
source: Kunz and Rittel, "Issues as Elements of Information Systems", Working Paper 131, Institute of Urban and Regional Development, University of California, Berkeley (1970), which builds an information system for argumentative planning out of issues, the positions taken on them, and the arguments that support or object to each position; with Rittel and Webber on wicked problems (1973) behind it and Conklin and Begeman's gIBIS (1988) and dialogue mapping after it.
bears:
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: grant-from-a-ruling
    relation: adopted
  - node: commons.systems/disposition-graph/readings
    fact: answer
    option: relation-per-option
    relation: adopted
  - node: commons.systems/disposition-graph/alignment-page
    fact: answer
    option: every-fact-every-option
    relation: adopted
---

## Answer

Supports, and its central structural claim is the one the record arrived at twice on its own. IBIS holds that deliberation on a question that cannot be settled by fact is recorded as issues, positions and arguments, and that an argument attaches to a position and never to the issue. The issue is only the question; the positions are the answers anyone has proposed; every argument is for or against one position, so an issue whose positions carry no arguments is unexamined, and an argument floating on the issue itself belongs nowhere and can be checked against nothing.

The record adopts that shape three times over. A fact with its list of viable options is an issue with its positions, each carrying what it would answer and why it is on the table. A reading's relation attaches to the option rather than to the node, which is the same claim about traditions as arguments, and it is what makes chosen over derivable, a tradition adopted on an option that was not chosen, rather than a relation the record has to store. And the page's option row carries the case for and the case against that option, which is the argument attached where IBIS puts it.

The divergence is that IBIS has no ruling and no authority. Rittel's problems have no stopping rule, and the method is deliberately a record of the argument rather than of a decision: nothing in it says who chose, when, or on what warrant, and no position is marked as the one in force. This record adds all of that, the author's ruling recorded on the option they chose with its response, date and pin, and the class read off those rulings. That addition is not a correction of IBIS, whose subject is a deliberation among many parties that never ends, but it is a real difference and the record should not claim IBIS for the parts of its model the method does not have.
```

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the source and the author has not read
it here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the source, and it is the author's to
take.

## Account

Minted at reconciliation on 2026-09-04 under the author's bootstrap grant of that day, from the paragraph of `viable-options`' rationale that names eight traditions in prose, which under `prose-and-structure` becomes readings with `bears` entries: "IBIS, adopted for positions with the arguments for and against each". The tradition pass of the alignment-page sitting the same day named it again: "The relation-per-option change the author made on 2026-09-04 is IBIS's central structural claim, that an argument attaches to a position and never to the issue (Kunz and Rittel, 1970)", and recorded that it was one of three owed as readings and never minted. Validated by the AI from its own knowledge of the source; deferred until the author reads it, and delegated if the author declines to.

### Frontier finding, 2026-09-05

Kind: contradiction.

Forty-six reading nodes carry, verbatim, as the first sentence of the `### authority` subsection inside `## Facts`, the claim: "Delegated, as every reading on the record recommends, because the relation is the AI's from its own knowledge of the source and the author has not read it here." The claim is false at this commit. Measured on the graph: 59 nodes carry `form: reading`; 57 recommend `delegated` on the authority fact; `commons.systems/disposition-graph/srs-introduction` recommends `deferred` (disposition/disposition-graph/srs-introduction.md, `### authority`); and `commons.systems/disposition-graph/npm-committed-lockfile` carries an authority fact with its three options and no `recommends` at all (disposition/disposition-graph/npm-committed-lockfile.md, `### authority`). `commons.systems/disposition-graph/readings` carries a variant of the same claim in its authority fact's `against`, at lines 47 and 155: "every reading on the record recommends delegated for itself". The defect is not only that the count is wrong today. A standing answer that asserts a census of the record goes stale the moment a reading is minted, which is exactly what `commons.systems/disposition-graph/authority` records as the option `no-census-in-a-standing-answer` and what the `codd-update-anomaly` reading names — and `codd-update-anomaly` is itself one of the forty-six carrying it. Two nodes have already corrected their live text and carry the formula only in their `## Account`: `madr-decision-records` (line 184) and `progressive-disclosure` (lines 135 and 162); `madr-decision-records`'s corrected text refers the general question to this survey by name. Those two are named here as context and are not defects.

Also named: commons.systems/disposition-graph/anchoring-and-adjustment, commons.systems/disposition-graph/appellate-review-en-banc, commons.systems/disposition-graph/approval-directed-agents, commons.systems/disposition-graph/bentham-publicity, commons.systems/disposition-graph/brooks-surgical-team, commons.systems/disposition-graph/change-reviewed-as-a-diff, commons.systems/disposition-graph/chenery-reasoned-decision, commons.systems/disposition-graph/chestertons-fence, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/deprecation-not-deletion, commons.systems/disposition-graph/dissent-and-reconsideration, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/event-sourcing-derived-view, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/file-drawer-and-pre-registration, commons.systems/disposition-graph/hansard-verbatim-record, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/legislative-amendment-in-context, commons.systems/disposition-graph/level-triggered-reconciliation, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/montgomery-informed-consent, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/nielsen-user-control-and-freedom, commons.systems/disposition-graph/none-of-the-above-ballot, commons.systems/disposition-graph/non-liquet, commons.systems/disposition-graph/notarial-minute, commons.systems/disposition-graph/not-proven-third-verdict, commons.systems/disposition-graph/n-version-programming, commons.systems/disposition-graph/ocap-attenuation, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/pareto-frontier, commons.systems/disposition-graph/peirce-paper-doubt, commons.systems/disposition-graph/promotor-fidei, commons.systems/disposition-graph/review-approval-pinned-to-a-revision, commons.systems/disposition-graph/rfc-pep-status-field, commons.systems/disposition-graph/roberts-rules-commit-or-refer, commons.systems/disposition-graph/scholarly-peer-review, commons.systems/disposition-graph/scholastic-articulus, commons.systems/disposition-graph/segregation-of-duties, commons.systems/disposition-graph/self-contained-specification, commons.systems/disposition-graph/single-subject-rule, commons.systems/disposition-graph/special-verdict-form, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand, commons.systems/disposition-graph/value-of-information, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/npm-committed-lockfile, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/progressive-disclosure, commons.systems/disposition-graph/authority.

Proposed: Strike the census from all forty-six and from `readings`' `against`, replacing it with the rule rather than the count: the class recommended is delegated because the relation is the AI's from its own knowledge of the source and the author has not read it here — which is the reason, and which stands whatever other readings recommend. `madr-decision-records` and `progressive-disclosure` have already made this correction in their live text and are the model. Where a node wants to say that this is the record's settled practice for readings, it cites `commons.systems/disposition-graph/class-recommendation` rather than counting. `srs-introduction`'s `deferred` and `npm-committed-lockfile`'s absent recommendation are left as they are: they are the two counterexamples, and the point of the fix is that a rule stated as a rule does not need them to disappear.

Recorded as an option on commons.systems/disposition-graph/authority's answer fact: `no-census-anywhere-in-a-node` (source review, 2026-09-05).

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/ibis-issue-based-information stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `standing`; the `## Rationale` its `**AI support.**`; and `stands` left the answer fact.

### Frontier finding, 2026-09-07

Kind: stale-recommendation.

readings' answer: 'the option\'s readings are the derived inverse of what the readings bear on' and 'the duty to re-point is stated here and unchecked, unmet across the record at this commit as the account measures'; its option `the-rung-clause-is-stated-once` quotes the rule 'where an option is a lower rung of another, contained in it and not declined, the relation stays on the containing option, since a relation stored on the rung would project as chosen over'. Readings whose `bears` name an option the target no longer recommends: eight under review-skills carry 'option: two-skills-one-package' while review-skills 'recommends the-survey-skill-launches-a-selected-reading (moderate)'; fagan-inspection-roles carries 'option: split-survey-from-per-draft' on frontier-consistency, which 'recommends the-judged-set-and-its-comparisons-move-to-survey-selection'; codd-update-anomaly bears on recording#per-fact-after-two-readings while recording recommends `the-confirmation-folds-an-already-accumulated-node`; ibis-issue-based-information bears on readings#relation-per-option while readings 'recommends the-relation-is-projected-onto-the-option-as-one-of-three'; plato-maieutics carries 'commons.systems/disposition-graph/growth#answer#standing (adopted), commons.systems/disposition-graph/alignment-page#answer#every-fact-every-option (diverged)' while growth's list marks '`turn-form-to-a-child-and-terms-aligned` — source ai, recommended', and plato-maieutics' own option says 'so the record currently derives this tradition as chosen over on `growth` — the opposite of what the reading\'s own answer says.' Each of these traditions projects today as chosen over on the node it was read for.

Also named: commons.systems/disposition-graph/readings, commons.systems/disposition-graph/review-skills, commons.systems/disposition-graph/frontier-consistency, commons.systems/disposition-graph/recording, commons.systems/disposition-graph/growth, commons.systems/disposition-graph/alignment-page, commons.systems/disposition-graph/plato-maieutics, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand.

Proposed: readings survives. Each reading named is re-pointed under the rung clause: where the recommended option contains the one borne on, the relation moves to the containing option; where it does not, the reading records diverged on the recommended option with its reason. plato-maieutics' existing option `bears-repointed-to-the-recommended-option` is the same proposal on that node; frontier-consistency's validation 4 gains the re-pointing check readings' `re-pointing-checked` records there.

Recorded as an option on commons.systems/disposition-graph/readings's answer fact: `the-relation-is-derived-through-containment` (source review, 2026-09-07).
