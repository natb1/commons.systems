---
question: What does literate programming say about one source tangled into several artifacts, and what does the record take from it?
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
      question: "2a604649430df7b442b534774b11c8a1c2fb12d72af26f58a15c271b480639ba"
      answer: "41be6aa9e43599b32e5492f5db9ec78d61bceb0c8d9e61a5daa904b98150b8cc"
      options: "33fafef7d7c9c1d3594b153f0df9b3bd7dc8e217c20f1d710153ade780b392e8"
      rivals: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      words: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
form: reading
under:
  - commons.systems/disposition-graph/review-skills
source: Donald E. Knuth, "Literate Programming", The Computer Journal 27(2) (1984), the WEB system, whose one authored source, ordered for the argument a human reads, is mechanically tangled into the program and woven into the document, so that the artifacts are outputs and never where an author works; Norman Ramsey, "Literate programming simplified", IEEE Software 11(5) (1994), for noweb; and the content reference, `conref`, of OASIS DITA's topic-based authoring, by which one paragraph appears in several documents by reference and never by copy. Locus to be checked, the DITA version at which `conref` is read here, taken as 1.0 (2005).
bears:
  - fact: answer
    option: two-skills-one-package
    relation: adopted
---

## Facts

### answer

The standing text is the only reading of these sources the survey produced,
and no second account of what the record takes from them is on the table.

#### standing

Supports the shape the record is already in, and names the part of the recommended option that is not yet built.

**AI support.** Read in the tradition survey of the review sitting of 2026-09-04, which marked it shelved by a pre-agent constraint, and named in `review-skills`' account among the readings its pass with reference to tradition owes: "Literate programming, Knuth, 1984, with the DITA content reference, adopted for the fragments and shelved until now by a pre-agent constraint, since a tangler that is a script inverts the cost that retired it." The `evaluation` node's rule that the second pass looks for traditions shelved under constraints that no longer hold is what puts it on the record.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does literate programming say about one source tangled into several artifacts, and what does the record take from it?
form: reading
under:
  - commons.systems/disposition-graph/review-skills
source: Donald E. Knuth, "Literate Programming", The Computer Journal 27(2) (1984), the WEB system, whose one authored source, ordered for the argument a human reads, is mechanically tangled into the program and woven into the document, so that the artifacts are outputs and never where an author works; Norman Ramsey, "Literate programming simplified", IEEE Software 11(5) (1994), for noweb; and the content reference, `conref`, of OASIS DITA's topic-based authoring, by which one paragraph appears in several documents by reference and never by copy. Locus to be checked, the DITA version at which `conref` is read here, taken as 1.0 (2005).
bears:
  - fact: answer
    option: two-skills-one-package
    relation: adopted
---

## Answer

Supports the shape the record is already in, and names the part of the recommended option that is not yet built. There is one authored source, ordered for the argument rather than for the machine, and the artifacts each consumer needs are tangled out of it mechanically; an author never works in an artifact. DITA adds the documentation case directly: a paragraph belonging in several manuals is transcluded into each by reference, so that the paragraph has one place it is written and many places it appears.

This is the record's own architecture stated by an older name. The node is the woven argument, and every projection of it — the rules directory, the browser, the alignment page, and the skills when the projector writes them — is tangled output. That is why two skills cost less here than they would in a hand-authored repository: the second file is a second output of a source that already exists, and the record's whole discipline is that outputs are not edited.

The adoption on `two-skills-one-package` is for the fragments, which are the content reference standing in where the tangler is not ready: the text the two briefs share is authored once and appears in both by reference rather than by copy, which is what DITA prescribes for a paragraph belonging to several documents. That is `conref` and not WEB, and the reading marks the difference. Knuth's point is the tangler, and a transclusion is the fallback the tradition itself offers when there is no generator yet; the record has that fallback for the briefs and has neither for the skills.

Shelved once by a constraint that has gone. Literate programming lost because maintaining a woven source cost a human author more than it saved when the readers were humans on a deadline and the tools were the author's own to build. When the tangler is a script and the reader is an agent that loads the whole file anyway, both halves of the objection invert, which is why the tradition is read here rather than remembered.
```

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

Also named: commons.systems/disposition-graph/anchoring-and-adjustment, commons.systems/disposition-graph/appellate-review-en-banc, commons.systems/disposition-graph/approval-directed-agents, commons.systems/disposition-graph/bentham-publicity, commons.systems/disposition-graph/brooks-surgical-team, commons.systems/disposition-graph/change-reviewed-as-a-diff, commons.systems/disposition-graph/chenery-reasoned-decision, commons.systems/disposition-graph/chestertons-fence, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/deprecation-not-deletion, commons.systems/disposition-graph/dissent-and-reconsideration, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/event-sourcing-derived-view, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/file-drawer-and-pre-registration, commons.systems/disposition-graph/hansard-verbatim-record, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/legislative-amendment-in-context, commons.systems/disposition-graph/level-triggered-reconciliation, commons.systems/disposition-graph/montgomery-informed-consent, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/nielsen-user-control-and-freedom, commons.systems/disposition-graph/none-of-the-above-ballot, commons.systems/disposition-graph/non-liquet, commons.systems/disposition-graph/notarial-minute, commons.systems/disposition-graph/not-proven-third-verdict, commons.systems/disposition-graph/n-version-programming, commons.systems/disposition-graph/ocap-attenuation, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/pareto-frontier, commons.systems/disposition-graph/peirce-paper-doubt, commons.systems/disposition-graph/promotor-fidei, commons.systems/disposition-graph/review-approval-pinned-to-a-revision, commons.systems/disposition-graph/rfc-pep-status-field, commons.systems/disposition-graph/roberts-rules-commit-or-refer, commons.systems/disposition-graph/scholarly-peer-review, commons.systems/disposition-graph/scholastic-articulus, commons.systems/disposition-graph/segregation-of-duties, commons.systems/disposition-graph/self-contained-specification, commons.systems/disposition-graph/single-subject-rule, commons.systems/disposition-graph/special-verdict-form, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand, commons.systems/disposition-graph/value-of-information, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/npm-committed-lockfile, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/progressive-disclosure, commons.systems/disposition-graph/authority.

Proposed: Strike the census from all forty-six and from `readings`' `against`, replacing it with the rule rather than the count: the class recommended is delegated because the relation is the AI's from its own knowledge of the source and the author has not read it here — which is the reason, and which stands whatever other readings recommend. `madr-decision-records` and `progressive-disclosure` have already made this correction in their live text and are the model. Where a node wants to say that this is the record's settled practice for readings, it cites `commons.systems/disposition-graph/class-recommendation` rather than counting. `srs-introduction`'s `deferred` and `npm-committed-lockfile`'s absent recommendation are left as they are: they are the two counterexamples, and the point of the fix is that a rule stated as a rule does not need them to disappear.

Recorded as an option on commons.systems/disposition-graph/authority's answer fact: `no-census-anywhere-in-a-node` (source review, 2026-09-05).

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/literate-programming stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `standing`; the `## Rationale` its `**AI support.**`; and `stands` left the answer fact.

### Frontier finding, 2026-09-07

Kind: stale-recommendation.

readings' answer: 'the option\'s readings are the derived inverse of what the readings bear on' and 'the duty to re-point is stated here and unchecked, unmet across the record at this commit as the account measures'; its option `the-rung-clause-is-stated-once` quotes the rule 'where an option is a lower rung of another, contained in it and not declined, the relation stays on the containing option, since a relation stored on the rung would project as chosen over'. Readings whose `bears` name an option the target no longer recommends: eight under review-skills carry 'option: two-skills-one-package' while review-skills 'recommends the-survey-skill-launches-a-selected-reading (moderate)'; fagan-inspection-roles carries 'option: split-survey-from-per-draft' on frontier-consistency, which 'recommends the-judged-set-and-its-comparisons-move-to-survey-selection'; codd-update-anomaly bears on recording#per-fact-after-two-readings while recording recommends `the-confirmation-folds-an-already-accumulated-node`; ibis-issue-based-information bears on readings#relation-per-option while readings 'recommends the-relation-is-projected-onto-the-option-as-one-of-three'; plato-maieutics carries 'commons.systems/disposition-graph/growth#answer#standing (adopted), commons.systems/disposition-graph/alignment-page#answer#every-fact-every-option (diverged)' while growth's list marks '`turn-form-to-a-child-and-terms-aligned` — source ai, recommended', and plato-maieutics' own option says 'so the record currently derives this tradition as chosen over on `growth` — the opposite of what the reading\'s own answer says.' Each of these traditions projects today as chosen over on the node it was read for.

Also named: commons.systems/disposition-graph/readings, commons.systems/disposition-graph/review-skills, commons.systems/disposition-graph/frontier-consistency, commons.systems/disposition-graph/recording, commons.systems/disposition-graph/growth, commons.systems/disposition-graph/alignment-page, commons.systems/disposition-graph/plato-maieutics, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand.

Proposed: readings survives. Each reading named is re-pointed under the rung clause: where the recommended option contains the one borne on, the relation moves to the containing option; where it does not, the reading records diverged on the recommended option with its reason. plato-maieutics' existing option `bears-repointed-to-the-recommended-option` is the same proposal on that node; frontier-consistency's validation 4 gains the re-pointing check readings' `re-pointing-checked` records there.

Recorded as an option on commons.systems/disposition-graph/readings's answer fact: `the-relation-is-derived-through-containment` (source review, 2026-09-07).
