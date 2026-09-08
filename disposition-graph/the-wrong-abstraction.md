---
question: What does the wrong abstraction say about factoring what two instruments share, and what does the record take from it?
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
      question: "e5973630c10084550d804e57bdf78dccfe20bad175e2a36098224d6786d9ba45"
      answer: "6d116632870e1a031997ef0eacc64242712229017473d695ae98e56be6d78ea2"
      options: "c48d530267e4fd4fb3e35b48a9af889334207ad6295fbde71b2de79d0b32ee42"
      rivals: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      words: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
form: reading
under:
  - commons.systems/disposition-graph/review-skills
source: Sandi Metz, "The Wrong Abstraction" (sandimetz.com, January 2016), whose rule is that duplication is far cheaper than the wrong abstraction. Text extracted because it currently looks the same couples callers whose requirements will diverge, the coupling then resists the divergence, and each caller accretes a parameter to say how it differs, until the shared thing is a switch with a body attached. The templating experience of Helm and Kubernetes charts is the same failure at scale.
bears:
  - fact: answer
    option: two-skills-one-package
    relation: adopted
---

## Facts

### answer

The standing text is the only reading of the essay the survey produced, and
no second account of what the record takes from it is on the table.

#### standing

Supports the split, and is cited for the bound it puts on what the split may factor.

**AI support.** Read in the tradition survey of the review sitting of 2026-09-04 as the caution against the drift answer's remedy, and named in `review-skills`' account among the readings its pass with reference to tradition owes: "The wrong abstraction, Metz, 2016, adopted as the bound on what is factored: only the essential common text, the reader's bounds and the primer, and nothing that merely looks the same today." It bears on `two-skills-one-package` because that option draws the bound, not because it argues for the split.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does the wrong abstraction say about factoring what two instruments share, and what does the record take from it?
form: reading
under:
  - commons.systems/disposition-graph/review-skills
source: Sandi Metz, "The Wrong Abstraction" (sandimetz.com, January 2016), whose rule is that duplication is far cheaper than the wrong abstraction. Text extracted because it currently looks the same couples callers whose requirements will diverge, the coupling then resists the divergence, and each caller accretes a parameter to say how it differs, until the shared thing is a switch with a body attached. The templating experience of Helm and Kubernetes charts is the same failure at scale.
bears:
  - fact: answer
    option: two-skills-one-package
    relation: adopted
---

## Answer

Supports the split, and is cited for the bound it puts on what the split may factor. The rule is that duplication is cheaper than the wrong abstraction. Text extracted because it currently looks the same couples callers whose requirements will diverge; the coupling then resists the divergence rather than absorbing it, and the shared thing accretes a parameter for each caller that has grown out of it. What makes an abstraction right is not that the text matches today but that the callers share a reason to change.

The record takes it as the limit on the fragments. The instructions the two readings share divide into what is essential — a fresh context carrying nothing of the invoking session and never a fork, a reader that writes nothing, findings validated on the invoking thread before any is applied — and what merely coincides today, the currency step, the brief mechanics, the landing. Factoring the coincidental ones would re-create inside a shared fragment exactly the flag the split removes from the command line, with each reading passing a parameter to say how its version differs. So only the essential text is factored, and it is factored into the node rather than into a file: the reader's bounds and the primer on the record's encoding are the two fragments the briefs share, and nothing else is.

The tradition also prices a cost the record must pay attention to and the essay does not. Indirection here is read by an agent whose attention is the scarce thing: a transcluded fragment is one more hop at load time and one more place a reader must hold, so the case for factoring has to clear a bar the human case does not set. That argues the same way as the rule and for a different reason, which is why the bound is drawn tightly rather than at the first repetition.

Where the tradition does not reach: it says nothing about two hand-written files that are meant to become one projection, which is the record's actual interim. Its subject is a shared abstraction chosen too early, and the record's risk is a derived artifact landed before its generator. Those are different failures and this reading is evidence only for the first.
```

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the source and the author has not read
it here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the source, and it is the author's to
take.

## Account

Minted at the recording of `review-skills`' recommendation on 2026-09-04, under the author's bootstrap grant of that day to progress the adversarial-review dispositions through the maieutic movement and reconcile them immediately, from the tradition survey of the review sitting and the pass with reference to tradition that read it, which names this reading among the eight owed under that node. Validated by the AI from its own knowledge of the source; deferred until the author reads it, and delegated if the author declines to.

### Frontier finding, 2026-09-05

Kind: contradiction.

Forty-six reading nodes carry, verbatim, as the first sentence of the `### authority` subsection inside `## Facts`, the claim: "Delegated, as every reading on the record recommends, because the relation is the AI's from its own knowledge of the source and the author has not read it here." The claim is false at this commit. Measured on the graph: 59 nodes carry `form: reading`; 57 recommend `delegated` on the authority fact; `commons.systems/disposition-graph/srs-introduction` recommends `deferred` (disposition/disposition-graph/srs-introduction.md, `### authority`); and `commons.systems/disposition-graph/npm-committed-lockfile` carries an authority fact with its three options and no `recommends` at all (disposition/disposition-graph/npm-committed-lockfile.md, `### authority`). `commons.systems/disposition-graph/readings` carries a variant of the same claim in its authority fact's `against`, at lines 47 and 155: "every reading on the record recommends delegated for itself". The defect is not only that the count is wrong today. A standing answer that asserts a census of the record goes stale the moment a reading is minted, which is exactly what `commons.systems/disposition-graph/authority` records as the option `no-census-in-a-standing-answer` and what the `codd-update-anomaly` reading names — and `codd-update-anomaly` is itself one of the forty-six carrying it. Two nodes have already corrected their live text and carry the formula only in their `## Account`: `madr-decision-records` (line 184) and `progressive-disclosure` (lines 135 and 162); `madr-decision-records`'s corrected text refers the general question to this survey by name. Those two are named here as context and are not defects.

Also named: commons.systems/disposition-graph/anchoring-and-adjustment, commons.systems/disposition-graph/appellate-review-en-banc, commons.systems/disposition-graph/approval-directed-agents, commons.systems/disposition-graph/bentham-publicity, commons.systems/disposition-graph/brooks-surgical-team, commons.systems/disposition-graph/change-reviewed-as-a-diff, commons.systems/disposition-graph/chenery-reasoned-decision, commons.systems/disposition-graph/chestertons-fence, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/deprecation-not-deletion, commons.systems/disposition-graph/dissent-and-reconsideration, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/event-sourcing-derived-view, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/file-drawer-and-pre-registration, commons.systems/disposition-graph/hansard-verbatim-record, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/legislative-amendment-in-context, commons.systems/disposition-graph/level-triggered-reconciliation, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/montgomery-informed-consent, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/nielsen-user-control-and-freedom, commons.systems/disposition-graph/none-of-the-above-ballot, commons.systems/disposition-graph/non-liquet, commons.systems/disposition-graph/notarial-minute, commons.systems/disposition-graph/not-proven-third-verdict, commons.systems/disposition-graph/n-version-programming, commons.systems/disposition-graph/ocap-attenuation, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/pareto-frontier, commons.systems/disposition-graph/peirce-paper-doubt, commons.systems/disposition-graph/promotor-fidei, commons.systems/disposition-graph/review-approval-pinned-to-a-revision, commons.systems/disposition-graph/rfc-pep-status-field, commons.systems/disposition-graph/roberts-rules-commit-or-refer, commons.systems/disposition-graph/scholarly-peer-review, commons.systems/disposition-graph/scholastic-articulus, commons.systems/disposition-graph/segregation-of-duties, commons.systems/disposition-graph/self-contained-specification, commons.systems/disposition-graph/single-subject-rule, commons.systems/disposition-graph/special-verdict-form, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand, commons.systems/disposition-graph/value-of-information, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/npm-committed-lockfile, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/progressive-disclosure, commons.systems/disposition-graph/authority.

Proposed: Strike the census from all forty-six and from `readings`' `against`, replacing it with the rule rather than the count: the class recommended is delegated because the relation is the AI's from its own knowledge of the source and the author has not read it here — which is the reason, and which stands whatever other readings recommend. `madr-decision-records` and `progressive-disclosure` have already made this correction in their live text and are the model. Where a node wants to say that this is the record's settled practice for readings, it cites `commons.systems/disposition-graph/class-recommendation` rather than counting. `srs-introduction`'s `deferred` and `npm-committed-lockfile`'s absent recommendation are left as they are: they are the two counterexamples, and the point of the fix is that a rule stated as a rule does not need them to disappear.

Recorded as an option on commons.systems/disposition-graph/authority's answer fact: `no-census-anywhere-in-a-node` (source review, 2026-09-05).

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/the-wrong-abstraction stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `standing`; the `## Rationale` its `**AI support.**`; and `stands` left the answer fact.

### Frontier finding, 2026-09-07

Kind: stale-recommendation.

readings' answer: 'the option\'s readings are the derived inverse of what the readings bear on' and 'the duty to re-point is stated here and unchecked, unmet across the record at this commit as the account measures'; its option `the-rung-clause-is-stated-once` quotes the rule 'where an option is a lower rung of another, contained in it and not declined, the relation stays on the containing option, since a relation stored on the rung would project as chosen over'. Readings whose `bears` name an option the target no longer recommends: eight under review-skills carry 'option: two-skills-one-package' while review-skills 'recommends the-survey-skill-launches-a-selected-reading (moderate)'; fagan-inspection-roles carries 'option: split-survey-from-per-draft' on frontier-consistency, which 'recommends the-judged-set-and-its-comparisons-move-to-survey-selection'; codd-update-anomaly bears on recording#per-fact-after-two-readings while recording recommends `the-confirmation-folds-an-already-accumulated-node`; ibis-issue-based-information bears on readings#relation-per-option while readings 'recommends the-relation-is-projected-onto-the-option-as-one-of-three'; plato-maieutics carries 'commons.systems/disposition-graph/growth#answer#standing (adopted), commons.systems/disposition-graph/alignment-page#answer#every-fact-every-option (diverged)' while growth's list marks '`turn-form-to-a-child-and-terms-aligned` — source ai, recommended', and plato-maieutics' own option says 'so the record currently derives this tradition as chosen over on `growth` — the opposite of what the reading\'s own answer says.' Each of these traditions projects today as chosen over on the node it was read for.

Also named: commons.systems/disposition-graph/readings, commons.systems/disposition-graph/review-skills, commons.systems/disposition-graph/frontier-consistency, commons.systems/disposition-graph/recording, commons.systems/disposition-graph/growth, commons.systems/disposition-graph/alignment-page, commons.systems/disposition-graph/plato-maieutics, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand.

Proposed: readings survives. Each reading named is re-pointed under the rung clause: where the recommended option contains the one borne on, the relation moves to the containing option; where it does not, the reading records diverged on the recommended option with its reason. plato-maieutics' existing option `bears-repointed-to-the-recommended-option` is the same proposal on that node; frontier-consistency's validation 4 gains the re-pointing check readings' `re-pointing-checked` records there.

Recorded as an option on commons.systems/disposition-graph/readings's answer fact: `the-relation-is-derived-through-containment` (source review, 2026-09-07).
