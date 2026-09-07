---
question: Is each reading of the clean-context review its own skill?
stage: maieutic
facts:
  - name: answer
    options:
      - name: one-skill-with-a-flag
        source: ai
        ref: "2026-09-04"
        status: passed
        reason: "the author's words of 2026-09-04 ask for two skills so that the telemetry tells the readings apart, and a flag leaves both readings under one name"
      - name: two-skills-one-package
        source: ai
        ref: "2026-09-04"
      - name: two-skills-code-beside-one
        source: ai
        ref: "2026-09-04"
        status: passed
        reason: "it makes one skill's directory the other's dependency and keeps the graph's own tooling under `.claude/skills/`, where the materialization node's convention puts it under `packages/`"
      - name: split-at-liquidation
        source: ai
        ref: "2026-09-04"
      - name: one-skill-named-operation
        source: ai
        ref: "2026-09-04"
        status: passed
        reason: "it answers the author's purpose by a mechanism their words did not ask for and the repository cannot verify"
      - name: two-skills-under-the-general-rule
        source: commons.systems/disposition-graph/unit-skills
        ref: "2026-09-07"
      - name: align-survey-renamed-for-the-family
        source: commons.systems/disposition-graph/unit-skills
        ref: "2026-09-07"
      - name: fragments-move-to-the-units-package
        source: commons.systems/disposition-graph/unit-skills
        ref: "2026-09-07"
      - name: the-survey-skill-launches-a-selected-reading
        source: commons.systems/disposition-graph/survey-selection
        ref: "2026-09-07"
        supports:
          - words/2026-09-04/10
          - words/2026-09-04/38
          - words/2026-09-07/10
      - name: one-generator-for-every-brief
        source: commons.systems/disposition-graph/unit-skills
        ref: "2026-09-07"
      - name: the-materialization-sentence-is-dated-to-its-commit
        source: review
        ref: "2026-09-07"
    recommends: the-survey-skill-launches-a-selected-reading
    boldness: moderate
    against: "The two readings share the one decision that matters, what a clean-context reading is, and until the projector writes the skills that decision is guarded by two hand-written files with nothing checking that they still agree; measured at implementation commit ca64407d they share forty-seven identical non-blank lines where they shared thirty-four at the split, so what the interim leaves unguarded grows with the files rather than closing. The telemetry motive is the observer's need, whose tradition's remedy is to name the operation and not to refactor the program, so the split bends the design to a limitation of a harness the record does not own."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: deferred
    boldness: low
    against: "Deferred leaves the names `/align-review` and `/align-survey` movable by a recommendation, and the record, the alignment skill, the telemetry and now `unit-skills`' proposed family of seven all cite them; a reader may hold that a landing other work is already built on is irreversible in `class-recommendation`'s own gloss, that the names are exactly that, and that the test therefore yields ratified. Ratified also costs the author nothing they do not already have — a ratified answer still changes by interview — and it is what makes the split doctrine rather than a recommendation standing on the author's words, which is what those words asked for."
  - name: persistence
    options:
      - name: with the three shims
      - name: without them
    recommends: with the three shims
    boldness: low
    against: "The skills project the parent's mechanics as much as this node's split, and a reader of clean-context-review, where the record has declared the review skill since 2026-09-03, would find no shim there."
review:
  verdict: forward
  strength: none
  date: 2026-09-07
  of: 6eb680043b880246883c473aa1c8d7f4602d204b
  commit: d4ab02834a08930a67d9b5885708f3f23f7a9153
  survey:
    date: 2026-09-07
    of: 6eb680043b880246883c473aa1c8d7f4602d204b
    commit: 6611799a1dd6276691cf61f482c8e593f0234200
    text:
      question: "dbe699c9d43ab54b06d23dd990054296ae76935e9f58d8aae5c39baae0290a72"
      answer: "7601185917f215b028e80f7781e6da7469065e5f6a4e978ec5693e003f609987"
      options: "ae7f9f9358444910529592c7ef9f63ac7e7513aa7deb9240174c03e01bc53a62"
      rivals: "e5ae74dead19f69a37537cce6c9936998df4de76238dfbdd13b5ec7094c83e27"
      words: "3663eb1c5777c4838cd5402c2d8b02a0a17233701e6ff6e556a166420ae40846"
    findings:
      - finding: "The term survey is used with two meanings across the frontier. `frontier-consistency`'s answer defines it as the reading of the whole graph, while `delegation`'s answer, projected at .claude/rules/delegation.md, makes it a kind of subagent unit: \"Every investigation whose context is verbose is a unit whatever its size: debugging, driving a browser, reading logs, transcripts, or diagnostic output, and surveys.\" `review-skills` records the collision on its own face in `align-survey-renamed-for-the-family`: \"the vocabulary conflict behind it is already in the record, `frontier-consistency` defining survey as the reading of the frontier while `decomposition` calls three of a sitting's units surveys\". A term the record has made a skill name (`/align-survey`) and a validation subject cannot also name an ordinary unit."
        kind: "vocabulary"
        status: "new"
        since: "2026-09-07"
        supports:
          - "question"
          - "answer"
          - "options"
          - "rivals"
          - "words"
        discharge: "the option this finding proposes is ruled, or a later survey re-derives it over moved support and does not find it"
        nodes:
          - "commons.systems/disposition-graph/review-skills"
          - "commons.systems/disposition-graph/frontier-consistency"
          - "commons.systems/disposition-graph/decomposition"
          - "commons.systems/disposition-graph/delegation"
          - "commons.systems/disposition-graph/clean-context-review"
    pairs:
      - with: "commons.systems/disposition-graph/alignment-page"
        keys:
          - "words:words/2026-09-04/10"
      - with: "commons.systems/disposition-graph/author-questions"
        keys:
          - "term:probe (defines: commons.systems/disposition-graph/author-questions)"
          - "cites"
      - with: "commons.systems/disposition-graph/authority"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/class-recommendation"
        keys:
          - "term:capture-shaped (defines: commons.systems/disposition-graph/class-recommendation)"
          - "term:expensive (defines: commons.systems/disposition-graph/class-recommendation)"
          - "term:irreversible (defines: commons.systems/disposition-graph/class-recommendation)"
      - with: "commons.systems/disposition-graph/clean-context-review"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "cites"
          - "depends"
      - with: "commons.systems/disposition-graph/codd-update-anomaly"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/decomposition"
        keys:
          - "words:words/2026-09-07/10"
          - "cites"
      - with: "commons.systems/disposition-graph/delegation"
        keys:
          - "term:subagent (defines: commons.systems/disposition-graph/delegation)"
          - "term:unit (defines: commons.systems/disposition-graph/delegation)"
          - "cites"
      - with: "commons.systems/disposition-graph/dialogue"
        keys:
          - "term:account (defines: commons.systems/disposition-graph/dialogue)"
          - "term:alternative (defines: commons.systems/disposition-graph/dialogue)"
          - "term:answer (defines: commons.systems/disposition-graph/dialogue)"
          - "term:dialogue (defines: commons.systems/disposition-graph/dialogue)"
          - "term:dialogue state (defines: commons.systems/disposition-graph/dialogue)"
          - "term:draft (defines: commons.systems/disposition-graph/dialogue)"
          - "term:fact (defines: commons.systems/disposition-graph/dialogue)"
          - "term:keep (defines: commons.systems/disposition-graph/dialogue)"
          - "term:persistence (defines: commons.systems/disposition-graph/dialogue)"
          - "term:recommendation (defines: commons.systems/disposition-graph/dialogue)"
          - "term:ruling (defines: commons.systems/disposition-graph/dialogue)"
          - "term:stage (defines: commons.systems/disposition-graph/dialogue)"
          - "cites"
      - with: "commons.systems/disposition-graph/dry-single-source-of-truth"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/evaluation"
        keys:
          - "term:adversarial review (defines: commons.systems/disposition-graph/evaluation)"
          - "term:greenfield (defines: commons.systems/disposition-graph/evaluation)"
      - with: "commons.systems/disposition-graph/fagan-inspection-roles"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/frontier-consistency"
        keys:
          - "term:frontier survey (defines: commons.systems/disposition-graph/frontier-consistency)"
          - "parent:commons.systems/disposition-graph/clean-context-review"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/growth"
        keys:
          - "term:boldness (defines: commons.systems/disposition-graph/growth)"
          - "term:maieutic (defines: commons.systems/disposition-graph/growth)"
          - "term:periagogic (defines: commons.systems/disposition-graph/growth)"
          - "words:words/2026-09-04/10"
      - with: "commons.systems/disposition-graph/hand-written-projection-drift"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/information-hiding"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/instruments"
        keys:
          - "term:check (defines: commons.systems/disposition-graph/instruments)"
          - "term:instrument (defines: commons.systems/disposition-graph/instruments)"
          - "cites"
      - with: "commons.systems/disposition-graph/literate-programming"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/materialization"
        keys:
          - "term:package (defines: commons.systems/disposition-graph/materialization)"
          - "cites"
      - with: "commons.systems/disposition-graph/model"
        keys:
          - "term:disposition (defines: commons.systems/disposition-graph/model)"
          - "term:node (defines: commons.systems/disposition-graph/model)"
      - with: "commons.systems/disposition-graph/multi-call-binary-and-facade"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/namespaces"
        keys:
          - "term:id (defines: commons.systems/disposition-graph/namespaces)"
          - "term:module (defines: commons.systems/disposition-graph/namespaces)"
      - with: "commons.systems/disposition-graph/node"
        keys:
          - "term:answer (defines: commons.systems/disposition-graph/node)"
          - "term:form (defines: commons.systems/disposition-graph/node)"
          - "term:question (defines: commons.systems/disposition-graph/node)"
          - "term:rationale (defines: commons.systems/disposition-graph/node)"
      - with: "commons.systems/disposition-graph/operation-naming-in-telemetry"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/persistence"
        keys:
          - "term:disposition ref (defines: commons.systems/disposition-graph/persistence)"
      - with: "commons.systems/disposition-graph/projection"
        keys:
          - "term:projection (defines: commons.systems/disposition-graph/projection)"
      - with: "commons.systems/disposition-graph/prose-and-structure"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/quotes"
        keys:
          - "term:ledger (defines: commons.systems/disposition-graph/quotes)"
      - with: "commons.systems/disposition-graph/readings"
        keys:
          - "term:adopted (defines: commons.systems/disposition-graph/readings)"
          - "term:diverged (defines: commons.systems/disposition-graph/readings)"
          - "term:reading (defines: commons.systems/disposition-graph/readings)"
          - "term:tradition (defines: commons.systems/disposition-graph/readings)"
          - "cites"
      - with: "commons.systems/disposition-graph/recording"
        keys:
          - "term:confirmation (defines: commons.systems/disposition-graph/recording)"
          - "term:kickback (defines: commons.systems/disposition-graph/recording)"
          - "term:substance (defines: commons.systems/disposition-graph/recording)"
          - "cites"
      - with: "commons.systems/disposition-graph/review"
        keys:
          - "term:review (defines: commons.systems/disposition-graph/review)"
      - with: "commons.systems/disposition-graph/review-cost"
        keys:
          - "term:neighbourhood (defines: commons.systems/disposition-graph/review-cost)"
          - "parent:commons.systems/disposition-graph/clean-context-review"
          - "cites"
      - with: "commons.systems/disposition-graph/review-model"
        keys:
          - "parent:commons.systems/disposition-graph/clean-context-review"
          - "cites"
      - with: "commons.systems/disposition-graph/scope"
        keys:
          - "term:section (defines: commons.systems/disposition-graph/scope)"
      - with: "commons.systems/disposition-graph/session-context"
        keys:
          - "term:rules (defines: commons.systems/disposition-graph/session-context)"
          - "cites"
      - with: "commons.systems/disposition-graph/survey-selection"
        keys:
          - "term:frozen set (defines: commons.systems/disposition-graph/survey-selection)"
          - "term:judged set (defines: commons.systems/disposition-graph/survey-selection)"
          - "term:mechanical tier (defines: commons.systems/disposition-graph/survey-selection)"
          - "depends"
      - with: "commons.systems/disposition-graph/the-wrong-abstraction"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/transience"
        keys:
          - "term:liquidation (defines: commons.systems/disposition-graph/transience)"
          - "term:persistence (defines: commons.systems/disposition-graph/transience)"
          - "term:shim (defines: commons.systems/disposition-graph/transience)"
          - "term:standing (defines: commons.systems/disposition-graph/transience)"
          - "term:un-aligned disposition (defines: commons.systems/disposition-graph/transience)"
          - "cites"
      - with: "commons.systems/disposition-graph/unanswered"
        keys:
          - "term:answered (defines: commons.systems/disposition-graph/unanswered)"
      - with: "commons.systems/disposition-graph/unconfirmed-accumulation"
        keys:
          - "term:accumulation (defines: commons.systems/disposition-graph/unconfirmed-accumulation)"
          - "term:fold (defines: commons.systems/disposition-graph/unconfirmed-accumulation)"
      - with: "commons.systems/disposition-graph/under"
        keys:
          - "term:context (defines: commons.systems/disposition-graph/under)"
          - "term:under (defines: commons.systems/disposition-graph/under)"
      - with: "commons.systems/disposition-graph/unit-skills"
        keys:
          - "words:words/2026-09-07/10"
          - "cites"
          - "depends"
      - with: "commons.systems/disposition-graph/utility-syntax-flag-or-subcommand"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/viable-options"
        keys:
          - "term:grant (defines: commons.systems/disposition-graph/viable-options)"
          - "term:option (defines: commons.systems/disposition-graph/viable-options)"
          - "term:viable (defines: commons.systems/disposition-graph/viable-options)"
      - with: "commons.systems/disposition-graph/what-acts-during-bootstrap"
        keys:
          - "term:bootstrap (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
          - "term:bootstrap authority (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
      - with: "commons.systems/disposition-graph/work-loop"
        keys:
          - "term:frontier (defines: commons.systems/disposition-graph/work-loop)"
          - "term:reconcile (defines: commons.systems/disposition-graph/work-loop)"
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
shims:
  - artifact: "`.claude/skills/align-review/SKILL.md` on the implementation ref, the review of a draft, hand-written from the clean-context-review node, the recording node, this node, the review-model node and the review-cost node"
    for: the projection of the review of a draft as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-04
  - artifact: "`.claude/skills/align-survey/SKILL.md` on the implementation ref, the survey, hand-written from the clean-context-review node, the frontier-consistency node, this node and the review-model node"
    for: the projection of the survey as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-04
  - artifact: "the brief templates `brief-draft.md`, `brief-survey.md` and `brief-delta.md` and the fragments `brief-bounds.md` and `brief-record.md` under `packages/clean-context-review/` on the implementation ref, hand-written from the nodes each summarizes"
    for: the briefs the two skills write for their readers, whose common text is one fragment filled into both
    liquidation: the brief generator fills a brief's common and reading-specific text from the nodes' answers and the hand-written templates and fragments are deleted
    declared: 2026-09-04
depends:
  - commons.systems/disposition-graph/clean-context-review#pointers-for-what-grows-with-the-record
  - commons.systems/disposition-graph/frontier-consistency#split-survey-from-per-draft
  - commons.systems/disposition-graph/survey-selection#candidate-pairs-with-their-nominating-key
---

## Facts

### answer

`the-survey-skill-launches-a-selected-reading` is recommended since 2026-09-07: it is `two-skills-one-package` with the survey skill's steps amended for `survey-selection` — the brief step refusing to write while the mechanical tier reports a finding and taking `--whole`, the launch step naming the frozen set and asking for a finding on any pair no key nominated, the apply step writing the accumulation that node's selection runs on, and the judged set and the comparisons cited to that node instead of restated. Its own support and divergence are under its subsection, and what follows is the reason the text it amends was recommended on, which the amendment carries except where it says otherwise. What the amendment names of `packages/clean-context-review/` is design and not description: none of the tier, the flag, the section hashes, the frozen set, the pairs or the survey block's register exists at implementation commit ca64407d, and the fence says so where it states each of them, so the answer claims of the record's own nodes what they say and of the instrument only what it does.

`two-skills-one-package` was recommended before the amendment because it is the only option on the
list that honours the author's words as they stand, two skills so that the
telemetry tells the readings apart, and answers the question the author
attached to them, how the common instructions avoid drift, without stating a
mechanism the record does not have. The split rests on the author's words and,
by analogy, on the record's rule that a unit needing a second contract is
two units, a rule about delegated work that says nothing of invocation
surfaces;
the package rests on the materialization node's convention for the graph's
tooling; the common text held in the node rests on the session-context node's
rule that a rule living only in a file is invisible to the projector and to
review; and the drift answer rests on the one regeneration the record has,
the rules directory, and on the projector's lack of any skill mode. Moderate
boldness: the split and its purpose are the author's words, and the names,
the package, the fragments, the placement of the shims, and the two-sentence
answer on drift are the AI's, each grounded in a rule of the record; what
rests on the AI's knowledge alone is the reading of the harness's convention
for naming a skill, which the repository's three skills show and no node
states, and the author's premise about the telemetry, which the design
carries as a premise and does not verify. The amendment adds nothing to that
boldness that is the AI's: the tier, the selection and the pairs are
`survey-selection`'s answer and are cited to it, and what this node adds is
only where each becomes a step of the skill and the disclosure that no step of
it is built.

#### one-skill-with-a-flag

The incumbent: one directory, `.claude/skills/align-review/`, whose
`SKILL.md` runs the review of a draft as `/align-review <node id>` and the
survey as `/align-review --survey`, with the scripts, both brief templates,
the fixtures and the tests beside it, as the clean-context-review node's shim
declares and its recommended text's first sentence says. What it would
answer: no, one skill runs both readings, told apart by an argument. Passed
over on the author's words of 2026-09-04, which ask for two skills so that
the telemetry tells the readings apart; one directory gives both readings one
name, and under one name the telemetry reports two populations of different
cost and duration as one.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Is each reading of the clean-context review its own skill?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
shims:
  - artifact: "`.claude/skills/align-review/SKILL.md` on the implementation ref, the review of a draft, hand-written from the clean-context-review node, the recording node, this node, the review-model node and the review-cost node"
    for: the projection of the review of a draft as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-04
  - artifact: "`.claude/skills/align-survey/SKILL.md` on the implementation ref, the survey, hand-written from the clean-context-review node, the frontier-consistency node, this node and the review-model node"
    for: the projection of the survey as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-04
  - artifact: "the brief templates `brief-draft.md`, `brief-survey.md` and `brief-delta.md` and the fragments `brief-bounds.md` and `brief-record.md` under `packages/clean-context-review/` on the implementation ref, hand-written from the nodes each summarizes"
    for: the briefs the two skills write for their readers, whose common text is one fragment filled into both
    liquidation: the brief generator fills a brief's common and reading-specific text from the nodes' answers and the hand-written templates and fragments are deleted
    declared: 2026-09-04
---
## Answer

The incumbent: one directory, `.claude/skills/align-review/`, whose
`SKILL.md` runs the review of a draft as `/align-review <node id>` and the
survey as `/align-review --survey`, with the scripts, both brief templates,
the fixtures and the tests beside it, as the clean-context-review node's shim
declares and its recommended text's first sentence says. What it would
answer: no, one skill runs both readings, told apart by an argument. Passed
over on the author's words of 2026-09-04, which ask for two skills so that
the telemetry tells the readings apart; one directory gives both readings one
name, and under one name the telemetry reports two populations of different
cost and duration as one.
```

#### two-skills-one-package

Two skills, `/align-review` for the review of a draft and `/align-survey` for
the survey, each one directory under `.claude/skills/` with one `SKILL.md`
carrying only what is specific to its reading; the mechanics of both readings
held once as the workspace package `packages/clean-context-review/`, the
brief generator, the apply script, the two brief templates with the two
fragments they share, the fixtures and the tests; the instruction text common
to both readings held in neither skill but read from the clean-context-review
node at every invocation; and the answer that skill reconciliation resolves
drift by construction at the shims' liquidation, when the projector writes
both skills from the graph, and not before, the interim being disclosed and
guarded by the currency step and the survey's validations. The split and its
purpose are the author's words of 2026-09-04; the rest is the AI's. Adopted
by the recommendation and set out in the fence.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Is each reading of the clean-context review its own skill?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
shims:
  - artifact: "`.claude/skills/align-review/SKILL.md` on the implementation ref, the review of a draft, hand-written from the clean-context-review node, the recording node, this node, the review-model node and the review-cost node"
    for: the projection of the review of a draft as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-04
  - artifact: "`.claude/skills/align-survey/SKILL.md` on the implementation ref, the survey, hand-written from the clean-context-review node, the frontier-consistency node, this node and the review-model node"
    for: the projection of the survey as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-04
  - artifact: "the brief templates `brief-draft.md`, `brief-survey.md` and `brief-delta.md` and the fragments `brief-bounds.md` and `brief-record.md` under `packages/clean-context-review/` on the implementation ref, hand-written from the nodes each summarizes"
    for: the briefs the two skills write for their readers, whose common text is one fragment filled into both
    liquidation: the brief generator fills a brief's common and reading-specific text from the nodes' answers and the hand-written templates and fragments are deleted
    declared: 2026-09-04
---
## Answer

Yes. The review of a draft and the survey are two skills, `/align-review` and `/align-survey`, each one directory under `.claude/skills/` with one `SKILL.md`: `.claude/skills/align-review/SKILL.md` runs the review of a draft and `.claude/skills/align-survey/SKILL.md` runs the survey, as the clean-context-review node divides the review by its object and the frontier-consistency node divides the validations between the two. The author's purpose is that the telemetry tells the readings apart; that the telemetry keys on the skill is the reading of their words taken here, that the harness names a skill by its directory is the AI's reading of the harness's convention, and the repository holds no telemetry configuration and no reading of it, so neither is verified here. That premise is load-bearing and its condition is named rather than left open: it is the whole reason `one-skill-named-operation`, the remedy the operation-naming reading records as the tradition's own, is passed over, so that option's status is lifted on the first per-skill usage reading the author can produce, which is an instrument the instruments node has yet to record and which the review-cost node's own accounting would read. The split stands on its own ground as well. The two readings take different arguments, a node id the survey forbids and the review requires; they return different contracts, one node's verdict with its findings against a frontier's findings with the commit they read and the pins they are applied by; and they hide different decisions, what a draft's neighbourhood is against what the frontier's pins and staleness are. By analogy with the delegation node's rule that a unit needing a second contract is two units, an invocation needing a second contract is two invocations, and a flag that forbids the argument the other form requires and replaces its output is a second command wearing a flag's name. The names keep both beside `/align` in the harness's listing, since both are the alignment dialogue's review step: review is the parent node's word for the reading of one draft, and survey is the term the frontier-consistency node defines.

What the two readings share is held once, in two places by its kind. The mechanics are code, and code lives where the materialization node puts the graph's own tooling: one workspace package, `packages/clean-context-review/`, named `@commons.systems/clean-context-review` after the node whose answer it implements, declared like every package by the root manifest's workspaces, holding `brief.mjs`, which writes a reader's brief for either reading; `apply.mjs`, which applies what a reading found and reads which reading from the input's own `scope`; the templates `brief-draft.md`, `brief-survey.md` and `brief-delta.md`, the last the template of the re-reading whose object is an amendment, which the review-cost node decides; the fragments `brief-bounds.md`, the reader's bounds, and `brief-record.md`, the primer on the record's encoding, which the generator fills into both templates at `{{bounds}}` and `{{record}}` so that the primer and the bounds exist in one file each, while each template keeps the read-first list specific to its reading; the fixture graph under `fixtures/`; and the tests `brief.test.mjs` and `apply.test.mjs`, which the root manifest's test script runs with every other package's. The package imports the reader from `packages/disposition` by its workspace name, `@commons.systems/disposition`, and declares `yaml`. No skill directory holds code, and neither skill imports from the other.

The instruction text common to the two readings is in neither skill, because it is the clean-context-review node's answer and each skill reads it there: a reading runs in one fresh context that carries nothing of the invoking session and is never a fork, reads the record and writes nothing to it, and its findings are validated by the invoking session on its own thread and never delegated before any is applied, as the author ruled on 2026-09-03. Each skill's first step is the currency step: fetch `origin/disposition`, the nested worktree at it with a clean tree but for a sitting's own drafts, `node packages/disposition/validate.mjs disposition`, then the nodes each skill's shim notice names, read at their current text, five for the review of a draft, the clean-context-review, recording, review-skills, review-model and review-cost nodes, and four for the survey, the clean-context-review, frontier-consistency, review-skills and review-model nodes; where a node differs from the skill, the skill follows the node and records the difference as an un-aligned disposition on it. What each skill states of its own is what is specific to its reading; what the two files share, measured at graph commit c9296cf4, is thirty-four identical non-blank lines of two hundred and eighty-six and two hundred, twenty-six of them longer than forty characters, and three of the four things this answer once said were the same have already stopped being so: the shim notices differ, the review's carrying a reconciliation of 2026-09-05 for `review-cost` that the survey's lacks; the launch paragraphs differ, the review's naming the model in the prompt and writing none in the file while the survey's writes `fable`; and the sections on model and delegation diverge on the rule they both cite, the review's having moved onto `fallback-when-the-model-is-unavailable`, an option `review-model` records and has not adopted, while the survey's has not. That drift was found by a reading and not by the currency step, which is the interim's cost measured rather than asserted, and the guard below is what the record has meanwhile and not a guarantee.

`/align-review <node id>`, the review of a draft. The sitting invokes it the moment it records or moves a node's recommendation in substance and sets `stage: review`; the author or a session invokes it on any node at that stage; it alone forwards a node to the ruling stage, and two of its runs never wait on each other. Its `SKILL.md` carries: the object and the reader's context as the parent's paragraph on the review of a draft gives them, restated here in no part, since the parent's answer moves and a copy of it here fell a day behind its source; the brief, `node packages/clean-context-review/brief.mjs --node <id> [--date YYYY-MM-DD] [--dry]`, which writes `tmp/review/draft-<slug>.brief.md` from `brief-draft.md`, and names `tmp/review/draft-<slug>.json` as the reader's output file, computing no model and printing none; the launch, one subagent of type `general-purpose` at high effort, on the model the review-model node decides, stated in this step and never argued in a brief, never a fork, told to read and follow the brief exactly, write only the output file and never run state-changing git, relaunched once with the same brief on a failure and reported on a second with the node left at its stage; the validation, the session's on its own thread, recorded as replies in `tmp/review/replies.json` and overrides in `tmp/review/overrides.json`; the apply, `node packages/clean-context-review/apply.mjs tmp/review/draft-<slug>.json --replies tmp/review/replies.json [--overrides tmp/review/overrides.json] [--date YYYY-MM-DD]`, which appends `### Clean-context review, <date>` to the node's account with the verdict, the findings, the facts check, the viability judgment, the counter-argument with its strength and the reply, marks passed over and never removes an option the reader no longer holds viable and adds the viable one it named, writes on the node the probes the reader raised, and derives the stage from those probes before it reads the verdict, a node that will carry an open probe after the apply going to the maieutic stage whatever the verdict, as the author-questions node says; and otherwise on a forward sets `stage: ruling` and writes `review` with `verdict`, `strength`, `date`, `of`, the pin of the recommendation read, and `against`, the counter-argument, and on a kickback sets the stage the reader named and writes the same; the session's judgment after the apply, amending what the reply accepts and sending an amendment of substance through this reading again; and the landing, `review: <slug> <date>` on the disposition ref, or with the sitting's own round when a sitting invoked it. Its frontmatter carries `name: align-review` and a description, and nothing of the model, which is the reader's and is passed at launch.

`/align-survey`, the survey. It takes no argument; it runs before the author rules, when the frontier shows a survey owed, and whenever a session or the author invokes it; it forwards nothing. Its `SKILL.md` carries: the object and the judged set as the parent's paragraph on the survey and the frontier-consistency node give them, the whole graph read in one context without its accounts, every node at the review or ruling stage whose recommendation has moved since the survey last pinned it judged against every other node on validations seven to sixteen; the brief, `node packages/clean-context-review/brief.mjs --survey [--date YYYY-MM-DD] [--dry]`, which writes `tmp/review/survey.brief.md` from `brief-survey.md`, names `tmp/review/survey.json`, and writes `tmp/review/survey.pins.json`, the graph commit read and the recommendation hash of every node, which the apply step compares against and never a hash the reader copied; the launch, one subagent of type `general-purpose` at high effort on the model the review-model node decides, never a fork, with the same prompt, relaunch and report as the review of a draft, and, when the generator says the brief may exceed what one reader holds, told to report what it could not read, an unread part being a gap and never a finding of nothing; the validation, the session's, in the same two files; the apply, `node packages/clean-context-review/apply.mjs tmp/review/survey.json --replies tmp/review/replies.json [--overrides tmp/review/overrides.json] [--pins tmp/review/survey.pins.json] [--date YYYY-MM-DD]`, which writes `review.survey` with its `date` and `of` on every judged node whose recommendation still matches its pin, discards with a note every finding on a node that moved since the commit read, appends `### Frontier finding, <date>` to every node a finding names and sets each such node's stage to the earliest a finding recommends for it, records each proposed option on the named node's answer fact with `source: review` and its `####` subsection, writes a subtree divergence on the leaves as `<ancestor>#<option>` in `depends` and never on the ancestor, writes on each node the probes the reader raised there and derives that node's stage from its probes before the finding's, a node carrying an open probe never landing at the ruling stage, and refuses the whole run where any node would not validate after the write; the session's judgment, a merge, split or fold recorded as an option and never done, a lateral tangle applied on the earlier-recorded node; and the landing, `review: survey <date>`, with the alignment page republished as the alignment skill says. Its frontmatter carries `name: align-survey` and a description.

Drift, and whether skill reconciliation resolves it. Until the projector writes the skills, the two `SKILL.md` files and the templates are hand-written shims, declared above, and can drift from the graph and from each other; reconciliation does not resolve that by itself, and the record does not say it does. Three things catch it in the interim. The skills state no rule of their own, and the common instructions are read from the nodes at every invocation under the currency step, which is where a stale skill is corrected and the difference recorded; what the two files duplicate, the shim notice, the currency step, the launch and the model section, is the text the currency step checks first, and a stale copy in one is a difference recorded on the node. The briefs' common text, the bounds and the primer, is one fragment each filled into both. And the survey's validations read the skills as artifacts: a file named exists and a command cited runs, a shim names an artifact that exists, and every cross-reference points at what the node still says, so a skill naming a command the package no longer has, or a node naming `/align-review --survey`, is a finding. Skill reconciliation resolves drift by construction at the shims' liquidation and not before: when the projector materializes both skills from the nodes their shim notices name, the clean-context-review, recording, frontier-consistency, review-skills, review-model and review-cost nodes between them, as it writes the rules directory today, one file per node, regenerated whole, with a file it wrote and no node claims deleted, the two skills are two projections of one source and nothing can drift between them. Two hand-written files are the interim the author's words accept for the telemetry's sake, and it is declared as an interim. What guards a hand-written projection generally, in the interval between a shim's declaration and its liquidation, is not this node's question and is asked on `commons.systems/disposition-graph/hand-written-projection-drift`, minted from this paragraph on 2026-09-05; what stands here is what is specific to these two files.

What this costs, as a consequence and never as a reason. Created: `.claude/skills/align-survey/SKILL.md`; `packages/clean-context-review/package.json`, `brief-bounds.md` and `brief-record.md`. Moved from `.claude/skills/align-review/` into `packages/clean-context-review/`: `brief.mjs`, `apply.mjs`, `brief-draft.md`, `brief-survey.md`, `brief.test.mjs`, `apply.test.mjs` and `fixtures/frontier/`, their imports of the reader rewritten to the workspace name, the fixture manifest's module renamed with the package, and the fixture nodes carrying the authority fact the reader requires of a staged node with facts, a repair the sibling reconciliation had already landed; `REPO_ROOT` in both scripts re-anchored to the package's new depth, and `apply.mjs` otherwise unchanged. Rewritten: `.claude/skills/align-review/SKILL.md`, to the review of a draft alone; the alignment skill's shim notice, its first and fifth sections and its section on model and delegation, where `/align-review --survey` becomes `/align-survey`; and the bullet of `CLAUDE.md` that names the skills. In the graph: the clean-context-review node's shim, which names one directory holding the scripts, is superseded here, and its supersession is a persistence option the sitting records on that node with this node as its source, for the author to rule on there; that node's recommended text's first sentence, "As a skill of its own, `/align-review`", is amended under the grant to name the two skills and cite this node, its standing text keeping the one-skill form for the author to rule on. Telemetry recorded under `/align-review` before the split mixes both readings.
```

#### two-skills-code-beside-one

Two directories, with the scripts, the templates, the fixtures and the tests
staying beside `/align-review` as they stand today and the survey's
`SKILL.md` naming them across directories. What it would answer: yes, two
skills, with the code where it is. Passed over because it makes one skill's
directory the other's dependency, so that a change to the draft skill's
directory can break the survey, and because it keeps the graph's own tooling
under `.claude/skills/`, where the materialization node's convention puts it
under `packages/` and where the root manifest's test script does not run it.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Is each reading of the clean-context review its own skill?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
shims:
  - artifact: "`.claude/skills/align-review/SKILL.md` on the implementation ref, the review of a draft, hand-written from the clean-context-review node, the recording node, this node, the review-model node and the review-cost node"
    for: the projection of the review of a draft as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-04
  - artifact: "`.claude/skills/align-survey/SKILL.md` on the implementation ref, the survey, hand-written from the clean-context-review node, the frontier-consistency node, this node and the review-model node"
    for: the projection of the survey as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-04
  - artifact: "the brief templates `brief-draft.md`, `brief-survey.md` and `brief-delta.md` and the fragments `brief-bounds.md` and `brief-record.md` under `packages/clean-context-review/` on the implementation ref, hand-written from the nodes each summarizes"
    for: the briefs the two skills write for their readers, whose common text is one fragment filled into both
    liquidation: the brief generator fills a brief's common and reading-specific text from the nodes' answers and the hand-written templates and fragments are deleted
    declared: 2026-09-04
---
## Answer

Two directories, with the scripts, the templates, the fixtures and the tests
staying beside `/align-review` as they stand today and the survey's
`SKILL.md` naming them across directories. What it would answer: yes, two
skills, with the code where it is. Passed over because it makes one skill's
directory the other's dependency, so that a change to the draft skill's
directory can break the survey, and because it keeps the graph's own tooling
under `.claude/skills/`, where the materialization node's convention puts it
under `packages/` and where the root manifest's test script does not run it.
```

#### split-at-liquidation

The author's split honoured when the projector can write both skills from
the graph, and one skill with the flag until then, so that the two files
never exist as two hand-written copies; the telemetry's differentiation waits
on the projector's skill mode. On the table because it is the one shape in
which the drift question answers itself: two projections of one source cannot
drift from each other, and two hand-written files can.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it: the author
asked for the telemetry now and granted the reconciliation immediately, and
the interval's drift is bounded to each reading's own text, which no other
file duplicates and which the survey's cross-reference validation reads.
Raised by the tradition survey of 2026-09-04.

**Content.**

```markdown
---
question: Is each reading of the clean-context review its own skill?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
shims:
  - artifact: "`.claude/skills/align-review/SKILL.md` on the implementation ref, the review of a draft, hand-written from the clean-context-review node, the recording node, this node, the review-model node and the review-cost node"
    for: the projection of the review of a draft as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-04
  - artifact: "`.claude/skills/align-survey/SKILL.md` on the implementation ref, the survey, hand-written from the clean-context-review node, the frontier-consistency node, this node and the review-model node"
    for: the projection of the survey as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-04
  - artifact: "the brief templates `brief-draft.md`, `brief-survey.md` and `brief-delta.md` and the fragments `brief-bounds.md` and `brief-record.md` under `packages/clean-context-review/` on the implementation ref, hand-written from the nodes each summarizes"
    for: the briefs the two skills write for their readers, whose common text is one fragment filled into both
    liquidation: the brief generator fills a brief's common and reading-specific text from the nodes' answers and the hand-written templates and fragments are deleted
    declared: 2026-09-04
---
## Answer

The author's split honoured when the projector can write both skills from
the graph, and one skill with the flag until then, so that the two files
never exist as two hand-written copies; the telemetry's differentiation waits
on the projector's skill mode. On the table because it is the one shape in
which the drift question answers itself: two projections of one source cannot
drift from each other, and two hand-written files can.
```

#### one-skill-named-operation

One skill, with the two readings told apart in the telemetry by something
other than the skill's name, the reviewer subagent's description or a name
the skill emits at launch. What it would answer: no, the readings are told
apart at the operation and the skill stays one. It is the observability
tradition's own remedy, to name the operation rather than refactor the
program. Passed over because it answers the author's purpose by a mechanism their
words did not ask for and the repository cannot verify: no telemetry
configuration and no reading of it is in the record, and a design resting on an unverifiable property of an
instrument the record does not own is not the AI's to recommend over the
author's stated premise.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Is each reading of the clean-context review its own skill?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
shims:
  - artifact: "`.claude/skills/align-review/SKILL.md` on the implementation ref, the review of a draft, hand-written from the clean-context-review node, the recording node, this node, the review-model node and the review-cost node"
    for: the projection of the review of a draft as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-04
  - artifact: "`.claude/skills/align-survey/SKILL.md` on the implementation ref, the survey, hand-written from the clean-context-review node, the frontier-consistency node, this node and the review-model node"
    for: the projection of the survey as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-04
  - artifact: "the brief templates `brief-draft.md`, `brief-survey.md` and `brief-delta.md` and the fragments `brief-bounds.md` and `brief-record.md` under `packages/clean-context-review/` on the implementation ref, hand-written from the nodes each summarizes"
    for: the briefs the two skills write for their readers, whose common text is one fragment filled into both
    liquidation: the brief generator fills a brief's common and reading-specific text from the nodes' answers and the hand-written templates and fragments are deleted
    declared: 2026-09-04
---
## Answer

One skill, with the two readings told apart in the telemetry by something
other than the skill's name, the reviewer subagent's description or a name
the skill emits at launch. What it would answer: no, the readings are told
apart at the operation and the skill stays one. It is the observability
tradition's own remedy, to name the operation rather than refactor the
program. Passed over because it answers the author's purpose by a mechanism their
words did not ask for and the repository cannot verify: no telemetry
configuration and no reading of it is in the record, and a design resting on an unverifiable property of an
instrument the record does not own is not the AI's to recommend over the
author's stated premise.
```

#### two-skills-under-the-general-rule

Yes, two skills, because every unit of a sitting is its own skill: the general
rule is `commons.systems/disposition-graph/unit-skills`, minted under
`decomposition` on 2026-09-07 from the author's words of that day, and this
node's answer becomes the application of that rule to the two readings rather
than a rule of its own — the names, the package and the node-held common text
staying exactly as `two-skills-one-package` states them, and the ground for the
split moving from this node's own two-contracts argument to the parent rule
that carries it for all seven kinds. On the table because the author's words of
2026-09-07 ask that each subagent's instructions be codified in a skill, which
is a question about every unit and not about the two readings, and a reader may
hold that the two readings are the only units that need it and that the general
question therefore belongs here.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it: the question the new node asks
reaches `decomposition`'s list of kinds, which is not below this node, and
authority only narrows on the way down, so a ruling here could not confer it;
`node`'s rule that a text answering two questions is two nodes sends it to a
node of its own, and `probe-or-node`'s four tests each agree. If the author
rules for this option the new node is pruned and its answer folds into this
one's, its account and the author's words moving here as `probe-or-node`'s
independence test requires.

**Content.**

```markdown
---
question: Is each reading of the clean-context review its own skill?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
shims:
  - artifact: "`.claude/skills/align-review/SKILL.md` on the implementation ref, the review of a draft, hand-written from the clean-context-review node, the recording node, this node, the review-model node and the review-cost node"
    for: the projection of the review of a draft as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-04
  - artifact: "`.claude/skills/align-survey/SKILL.md` on the implementation ref, the survey, hand-written from the clean-context-review node, the frontier-consistency node, this node and the review-model node"
    for: the projection of the survey as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-04
  - artifact: "the brief templates `brief-draft.md`, `brief-survey.md` and `brief-delta.md` and the fragments `brief-bounds.md` and `brief-record.md` under `packages/clean-context-review/` on the implementation ref, hand-written from the nodes each summarizes"
    for: the briefs the two skills write for their readers, whose common text is one fragment filled into both
    liquidation: the brief generator fills a brief's common and reading-specific text from the nodes' answers and the hand-written templates and fragments are deleted
    declared: 2026-09-04
---
## Answer

Yes, two skills, because every unit of a sitting is its own skill: the general
rule is `commons.systems/disposition-graph/unit-skills`, minted under
`decomposition` on 2026-09-07 from the author's words of that day, and this
node's answer becomes the application of that rule to the two readings rather
than a rule of its own — the names, the package and the node-held common text
staying exactly as `two-skills-one-package` states them, and the ground for the
split moving from this node's own two-contracts argument to the parent rule
that carries it for all seven kinds. On the table because the author's words of
2026-09-07 ask that each subagent's instructions be codified in a skill, which
is a question about every unit and not about the two readings, and a reader may
hold that the two readings are the only units that need it and that the general
question therefore belongs here.
```

#### align-survey-renamed-for-the-family

The same as `two-skills-one-package` except that the survey's skill is
`/align-survey-frontier` and not `/align-survey`. Raised by
`commons.systems/disposition-graph/unit-skills` on 2026-09-07, which names five
more skills of the family and found under the greenfield lens that from
scratch every name in it would say its object and no name would be a prefix of
another: `/align-decompose`, `/align-survey-record`,
`/align-survey-tradition`, `/align-survey-implementation`, `/align-design`,
`/align-review`, `/align-survey-frontier`. The incumbent `/align-survey` is the
one name that does not say its object, and the vocabulary conflict behind it is
already in the record, `frontier-consistency` defining survey as the reading of
the frontier while `decomposition` calls three of a sitting's units surveys.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it: the name was fixed by this node's answer on 2026-09-04 and is what
the record and the telemetry cite; a rename costs both, and the cost is not a
reason either way under `evaluation`, which is why the option is recorded here
for the author rather than taken by the child. The child's answer does not
depend on it and names the incumbent.

**Content.**

```markdown
---
question: Is each reading of the clean-context review its own skill?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
shims:
  - artifact: "`.claude/skills/align-review/SKILL.md` on the implementation ref, the review of a draft, hand-written from the clean-context-review node, the recording node, this node, the review-model node and the review-cost node"
    for: the projection of the review of a draft as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-04
  - artifact: "`.claude/skills/align-survey/SKILL.md` on the implementation ref, the survey, hand-written from the clean-context-review node, the frontier-consistency node, this node and the review-model node"
    for: the projection of the survey as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-04
  - artifact: "the brief templates `brief-draft.md`, `brief-survey.md` and `brief-delta.md` and the fragments `brief-bounds.md` and `brief-record.md` under `packages/clean-context-review/` on the implementation ref, hand-written from the nodes each summarizes"
    for: the briefs the two skills write for their readers, whose common text is one fragment filled into both
    liquidation: the brief generator fills a brief's common and reading-specific text from the nodes' answers and the hand-written templates and fragments are deleted
    declared: 2026-09-04
---
## Answer

The same as `two-skills-one-package` except that the survey's skill is
`/align-survey-frontier` and not `/align-survey`. Raised by
`commons.systems/disposition-graph/unit-skills` on 2026-09-07, which names five
more skills of the family and found under the greenfield lens that from
scratch every name in it would say its object and no name would be a prefix of
another: `/align-decompose`, `/align-survey-record`,
`/align-survey-tradition`, `/align-survey-implementation`, `/align-design`,
`/align-review`, `/align-survey-frontier`. The incumbent `/align-survey` is the
one name that does not say its object, and the vocabulary conflict behind it is
already in the record, `frontier-consistency` defining survey as the reading of
the frontier while `decomposition` calls three of a sitting's units surveys.
```

#### fragments-move-to-the-units-package

The same as `two-skills-one-package` except that `brief-bounds.md` and
`brief-record.md` leave this node's package: they live in
`packages/sitting-units/` and `packages/clean-context-review/brief.mjs` fills
`{{bounds}}` and `{{record}}` from `@commons.systems/sitting-units` by
workspace name, so that each fragment exists in one file across both packages.
Raised by `commons.systems/disposition-graph/unit-skills` on 2026-09-07, whose
answer creates a second brief generator for a sitting's units and needs the
same two fragments: the reader's bounds and the primer on the record's
encoding are one text, and two hand-written copies of one text is the update
anomaly this node's own reading `codd-update-anomaly` names, in a record that
has already measured two hand-written projections diverging within a day. For
it: it is the shape in which the primer and the bounds stay one file each as
this node's answer says they are, rather than one file each per package. The
cost, and why the child did not take it: this node's answer enumerates the two
fragments among what `packages/clean-context-review/` holds, so moving them is
this node's to rule and not the child's, and the child refuses the move on
exactly the ground it refuses the stricter fold `one-generator-for-every-brief`;
the move also makes the readings' package depend on the units' package, so a
change to a fragment for a unit's sake reaches a reading's brief, and the
readings would then be reading a fragment maintained for another family's
skills. Until this node rules, the two fragments stand in both packages, which
the child's answer names as one of its costs.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Is each reading of the clean-context review its own skill?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
shims:
  - artifact: "`.claude/skills/align-review/SKILL.md` on the implementation ref, the review of a draft, hand-written from the clean-context-review node, the recording node, this node, the review-model node and the review-cost node"
    for: the projection of the review of a draft as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-04
  - artifact: "`.claude/skills/align-survey/SKILL.md` on the implementation ref, the survey, hand-written from the clean-context-review node, the frontier-consistency node, this node and the review-model node"
    for: the projection of the survey as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-04
  - artifact: "the brief templates `brief-draft.md`, `brief-survey.md` and `brief-delta.md` and the fragments `brief-bounds.md` and `brief-record.md` under `packages/clean-context-review/` on the implementation ref, hand-written from the nodes each summarizes"
    for: the briefs the two skills write for their readers, whose common text is one fragment filled into both
    liquidation: the brief generator fills a brief's common and reading-specific text from the nodes' answers and the hand-written templates and fragments are deleted
    declared: 2026-09-04
---
## Answer

The same as `two-skills-one-package` except that `brief-bounds.md` and
`brief-record.md` leave this node's package: they live in
`packages/sitting-units/` and `packages/clean-context-review/brief.mjs` fills
`{{bounds}}` and `{{record}}` from `@commons.systems/sitting-units` by
workspace name, so that each fragment exists in one file across both packages.
Raised by `commons.systems/disposition-graph/unit-skills` on 2026-09-07, whose
answer creates a second brief generator for a sitting's units and needs the
same two fragments: the reader's bounds and the primer on the record's
encoding are one text, and two hand-written copies of one text is the update
anomaly this node's own reading `codd-update-anomaly` names, in a record that
has already measured two hand-written projections diverging within a day. For
it: it is the shape in which the primer and the bounds stay one file each as
this node's answer says they are, rather than one file each per package. The
cost, and why the child did not take it: this node's answer enumerates the two
fragments among what `packages/clean-context-review/` holds, so moving them is
this node's to rule and not the child's, and the child refuses the move on
exactly the ground it refuses the stricter fold `one-generator-for-every-brief`;
the move also makes the readings' package depend on the units' package, so a
change to a fragment for a unit's sake reaches a reading's brief, and the
readings would then be reading a fragment maintained for another family's
skills. Until this node rules, the two fragments stand in both packages, which
the child's answer names as one of its costs.
```

#### the-survey-skill-launches-a-selected-reading

The brief step refuses to write while the mechanical tier reports a finding, takes `--whole`, and writes the frozen set and the candidate pairs with their keys beside the pins; the launch tells the reader which nodes were frozen and asks for a finding on any pair no key nominated to be reported as such.

**AI support.** The skill is where the selection becomes a command line, and the `survey-selection` node's tier, frozen set and keys each need a step here or they are rules with no act; the reader told what was frozen is what makes the frozen set a fact of the run and not an inference from the generator.

The author, 2026-09-04, in the sitting on the alignment page: "docompose adversarial review and adversarial review --survey into two skills so that they are differentiated in the telemetry. Recommend how to avoid drift in common instructions (is this resolved naturall by skill reconciliation?)"

The author, 2026-09-07, on the sitting's units: "also include this in the list of dispositions we are progressing up to confirmation and reconciling: it sounds like recommended alignment subagents have extended beyond (or superceded) align-review and align-survey. If so, each subagent have its instructions codified in a skill. And if align-review or align-survey are superceded, they must be liquidated by reconciliation." The words carry a condition, "if so", and the condition is measured rather than assumed: `.claude/skills/align/SKILL.md` invokes `/align-review <node id>` and `/align-survey` by name at the two moments this answer gives them, and the units the sitting launched — a decomposition, three surveys, a design, a reconciliation — take other arguments, return other contracts and are invoked at other moments, so they extend the family beyond the two readings and supersede neither. That the family's other members each get a skill is the same question asked of every kind of unit, which is `decomposition`'s list and not this node's object, so it is asked on `unit-skills` under that node; this answer says only that the two readings survive the family, and the third clause of the words, liquidation by reconciliation, therefore has nothing to reach here.

Why two skills, beyond the words. A skill is the harness's unit of invocation, and the record's rule for dividing work by contract, on the delegation node, decides the invocation surface as it decides the units: the review of a draft and the survey have different inputs, different outputs and different moments, so that a brief for one carries almost nothing of a brief for the other, twenty identical lines in some hundred and sixty, and a flag that makes the one reading's required argument the other's forbidden one is a second command whatever it is called. Each reading hides a decision the other does not need, the draft's neighbourhood against the frontier's pins, and changes for reasons the other does not share, the first six validations against the last nine; and the record already calls them readings because each is a role with its own checklist. The telemetry is the author's purpose and it is stated as two populations, a draft's reading over a neighbourhood against a survey over the whole graph, whose cost and duration under one name are one mixture no percentile of which is knowable; the observability tradition that names operations for exactly this reason, OpenTelemetry's span and the RED method's per-operation rate, errors and duration, would rather name the operation than split the program, and that remedy is unavailable only on the author's premise that the harness names by directory, which is why the answer carries the premise as the author's and rests the split on the contracts as well.

Why one package, and why it is named for the node. The mechanics of both readings are one body of code reading one graph and writing one kind of dialogue state, and the shape that keeps one implementation under two names is two names dispatching into one body; the alternative, the code beside one skill and imported across directories by the other, makes one skill the other's dependency for no reason of design. The monorepo convention is the materialization node's, and a package the root manifest's test script runs is how the graph's own tooling is tested; the package is named for the node whose answer it implements so that the projection relationship materialization requires of every artifact is legible from the name.

Why the common instruction text is the node's and not a fragment shared by the skills. A rule that lives in a skill is invisible to the projector and to review, which is the session-context node's reason for letting the orientation page state no rule of its own, and it holds for a skill; the common instructions are the parent's answer, read at every invocation by the currency step, and a shim notice on each file that says the node wins is what the transience node projects from a declaration. The briefs are different: their reader is a subagent given a brief and the record and nothing else, and the primer it needs on the record's encoding is a summary of five nodes that would otherwise be written twice, so one fragment is the least that holds it once until the generator writes it from the nodes; only the essential common text is factored, the reader's bounds and the primer, since factoring what merely looks the same today re-creates the flag inside the fragment.

Why the drift answer is conditional. The one drift-proof mechanism the record has is whole-file regeneration from a node, which exists today for the rules directory and not for skills; the projector has no skill mode, so the shims' liquidation is unbuilt, and saying that reconciliation resolves drift now would state a mechanism the record does not have. Two hand-written projections of one node are the update anomaly the record already suffered once in a hand-maintained enumeration, and the answer does not pretend otherwise: it bounds the anomaly to text no other file duplicates, reads the nodes at every invocation, and names the condition under which it ends. Waiting for that condition before splitting, which is the one shape in which the question answers itself, was passed over only because the author asked for the telemetry now and the interval is bounded and disclosed. The measurements this answer makes of that interval are pinned to the implementation commit they were taken at and not to a graph commit, since what they measure is two files on the implementation ref, and a measurement whose pin cannot reproduce it is an assertion.

Of the nine traditions the maieutic movement surfaced, named in the account, eight stand as readings under this node, each bearing on `two-skills-one-package`, the operation-naming one bearing on `one-skill-named-operation` as adopted and on the recommendation as diverged, since the recommendation departs from its remedy; the ninth, the Unix rule of one tool for one job, bears on no option and is unrecorded until the readings node's relation vocabulary admits a tradition that neither supports nor contradicts. The reading `codd-update-anomaly`, minted under the prose-and-structure node, bears on the recommendation too. Why the names. Both invocations are the alignment dialogue's review step, so both keep the `align-` prefix the harness lists them under; review is the parent node's word for the reading of one draft, and survey is the term the frontier-consistency node defines, so neither name adds a word the record does not have.

**AI divergence.** The skill now depends on the tier being right, since a wrong check stops the brief, and on a `--whole` the applying session must remember to pass on the cadence; a step the skill states and no instrument enforces is the kind of rule the record has found unkept before.

The two readings share the one decision that matters, what a clean-context reading is, and until the projector writes the skills that decision is guarded by two hand-written files with nothing checking that they still agree; measured at implementation commit ca64407d they share forty-seven identical non-blank lines where they shared thirty-four at the split, so what the interim leaves unguarded grows with the files rather than closing. The telemetry motive is the observer's need, whose tradition's remedy is to name the operation and not to refactor the program, so the split bends the design to a limitation of a harness the record does not own.

**Content.**

```markdown
---
question: Is each reading of the clean-context review its own skill?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
shims:
  - artifact: "`.claude/skills/align-review/SKILL.md` on the implementation ref, the review of a draft, hand-written from the clean-context-review node, the recording node, this node, the review-model node and the review-cost node"
    for: the projection of the review of a draft as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-04
  - artifact: "`.claude/skills/align-survey/SKILL.md` on the implementation ref, the survey, hand-written from the clean-context-review node, the frontier-consistency node, this node and the review-model node"
    for: the projection of the survey as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-04
  - artifact: "the brief templates `brief-draft.md`, `brief-survey.md` and `brief-delta.md` and the fragments `brief-bounds.md` and `brief-record.md` under `packages/clean-context-review/` on the implementation ref, hand-written from the nodes each summarizes"
    for: the briefs the two skills write for their readers, whose common text is one fragment filled into both
    liquidation: the brief generator fills a brief's common and reading-specific text from the nodes' answers and the hand-written templates and fragments are deleted
    declared: 2026-09-04
---
## Answer

Yes. The review of a draft and the survey are two skills, `/align-review` and `/align-survey`, each one directory under `.claude/skills/` with one `SKILL.md`: `.claude/skills/align-review/SKILL.md` runs the review of a draft and `.claude/skills/align-survey/SKILL.md` runs the survey, as the clean-context-review node divides the review by its object and the frontier-consistency node divides the validations between the two. The author's purpose is that the telemetry tells the readings apart; that the telemetry keys on the skill is the reading of their words taken here, that the harness names a skill by its directory is the AI's reading of the harness's convention, and the repository holds no telemetry configuration and no reading of it, so neither is verified here. That premise is load-bearing and its condition is named rather than left open: it is the whole reason `one-skill-named-operation`, the remedy the operation-naming reading records as the tradition's own, is passed over, so that option's status is lifted on the first per-skill usage reading the author can produce, which is an instrument the instruments node has yet to record and which the review-cost node's own accounting would read. The split stands on its own ground as well. The two readings take different arguments, a node id the survey forbids and the review requires; they return different contracts, one node's verdict with its findings against a frontier's findings with the commit they read and the pins they are applied by; and they hide different decisions, what a draft's neighbourhood is against what the frontier's pins and staleness are. By analogy with the delegation node's rule that a unit needing a second contract is two units, an invocation needing a second contract is two invocations, and a flag that forbids the argument the other form requires and replaces its output is a second command wearing a flag's name. The names keep both beside `/align` in the harness's listing, since both are the alignment dialogue's review step: review is the parent node's word for the reading of one draft, and survey is the term the frontier-consistency node defines.

Neither of these two skills is superseded, and neither is liquidated. The author asked on 2026-09-07 whether the subagents this sitting launched have extended beyond or superseded the two readings, that each subagent's instructions be codified in a skill, and that a superseded reading be liquidated by reconciliation; the second of those three is a question about every unit of a sitting and not about these two, so it is asked where `decomposition`'s list of kinds is, on `commons.systems/disposition-graph/unit-skills`, minted beneath that node on 2026-09-07, and a ruling there confers nothing here, authority narrowing only on the way down. The first and the third are answered here: `/align-review` and `/align-survey` are invoked at the same two moments and by the same names, the alignment skill invoking each by name, and the units the sitting launched sit beside them and do none of their work, so nothing on this node is liquidated by that family. What the two nodes hold in common is ruled between them and not by one over the other: the option `fragments-move-to-the-units-package` on this node's answer fact carries `unit-skills` as its source and asks whether the two fragments this answer enumerates leave this package, and the stricter fold, `one-generator-for-every-brief`, is on this fact for the same reason, because the artifact it would move is one this answer names as this package's.

What the two readings share is held once, in two places by its kind. The mechanics are code, and code lives where the materialization node puts the graph's own tooling: one workspace package, `packages/clean-context-review/`, named `@commons.systems/clean-context-review` after the node whose answer it implements, declared like every package by the root manifest's workspaces, holding `brief.mjs`, which writes a reader's brief for either reading; `apply.mjs`, which applies what a reading found and reads which reading from the input's own `scope`; the templates `brief-draft.md`, `brief-survey.md` and `brief-delta.md`, the last the template of the re-reading whose object is an amendment, which the review-cost node decides; the fragments `brief-bounds.md`, the reader's bounds, and `brief-record.md`, the primer on the record's encoding, which the generator fills into both templates at `{{bounds}}` and `{{record}}` so that the primer and the bounds exist in one file each, while each template keeps the read-first list specific to its reading; the fixture graph under `fixtures/`; and the tests `brief.test.mjs` and `apply.test.mjs`, which the root manifest's test script runs with every other package's. The package imports the reader from `packages/disposition` by its workspace name, `@commons.systems/disposition`, and declares `yaml`. No skill directory holds code, and neither skill imports from the other.

The instruction text common to the two readings is in neither skill, because it is the clean-context-review node's answer and each skill reads it there: a reading runs in one fresh context that carries nothing of the invoking session and is never a fork, reads the record and writes nothing to it, and its findings are validated by the invoking session on its own thread and never delegated before any is applied, as the author ruled on 2026-09-03. Each skill's first step is the currency step: fetch `origin/disposition`, the nested worktree at it with a clean tree but for a sitting's own drafts, `node packages/disposition/validate.mjs disposition`, then the nodes each skill's shim notice names, read at their current text, five for the review of a draft, the clean-context-review, recording, review-skills, review-model and review-cost nodes, and four for the survey, the clean-context-review, frontier-consistency, review-skills and review-model nodes; where a node differs from the skill, the skill follows the node and records the difference as an un-aligned disposition on it. What each skill states of its own is what is specific to its reading; what the two files share, measured at implementation commit ca64407d, is forty-seven identical non-blank lines of three hundred and sixty-eight and two hundred and fifty-six, thirty-eight of them longer than forty characters, where the same measure at the split gave thirty-four of two hundred and eighty-six and two hundred, so the text the interim leaves unguarded has grown by more than a third since the answer first bounded it. Of the three divergences a reading measured on 2026-09-05 among the four things this answer says the two files hold in common, two were repaired by hand on 2026-09-07 and one stands: both launch paragraphs now name the model by its relation to the other reader and write no harness name in the file, and both sections on model and delegation now name the same unadopted option of `review-model`, `fallback-when-the-model-is-unavailable`; the shim notices still differ, the review's carrying a reconciliation of 2026-09-05 to `review-cost` and `clean-context-review` where the survey's carries one to `review-model`. Both repairs were made by a session reconciling each file against its nodes, and neither was made by anything that reads one file against its twin; the drift was found by a reading and not by the currency step, which is the interim's cost measured rather than asserted, and the guard below is what the record has meanwhile and not a guarantee.

`/align-review <node id>`, the review of a draft. The sitting invokes it the moment it records or moves a node's recommendation in substance and sets `stage: review`; the author or a session invokes it on any node at that stage; it alone forwards a node to the ruling stage, and two of its runs never wait on each other. Its `SKILL.md` carries: the object and the reader's context as the parent's paragraph on the review of a draft gives them, restated here in no part, since the parent's answer moves and a copy of it here fell a day behind its source; the brief, `node packages/clean-context-review/brief.mjs --node <id> [--date YYYY-MM-DD] [--dry] [--draft]`, one invocation that chooses its own template off the record: it writes `tmp/review/draft-<slug>.brief.md` from `brief-draft.md` and names `tmp/review/draft-<slug>.json`, or, where the node's `review.commit` is set and the node's file has changed since that commit, whatever moved it, `tmp/review/delta-<slug>.brief.md` from `brief-delta.md` and `tmp/review/delta-<slug>.json`, the re-reading whose object is the amendment and not the node, as the review-cost node decides; `--draft`, whose deprecated alias is `--fresh`, forces the draft brief regardless, and there is no flag the other way, since wherever a commit is pinned and the file has moved the re-reading is what the record already owes; and it computes no model and prints none; the launch, one subagent of type `general-purpose` at high effort, on the model the review-model node decides, stated in this step and never argued in a brief, never a fork, told to read and follow the brief exactly, write only the output file and never run state-changing git, relaunched once with the same brief on a failure and reported on a second with the node left at its stage; the validation, the session's on its own thread, recorded as replies in `tmp/review/replies.json` and overrides in `tmp/review/overrides.json`; the apply, `node packages/clean-context-review/apply.mjs tmp/review/<draft|delta>-<slug>.json --replies tmp/review/replies.json [--overrides tmp/review/overrides.json] [--date YYYY-MM-DD]`, which appends `### Clean-context review, <date>` to the node's account with the verdict, the findings, the facts check, the viability judgment, the counter-argument with its strength and the reply, marks passed over and never removes an option the reader no longer holds viable and adds the viable one it named, writes on the node the probes the reader raised, and derives the stage from those probes before it reads the verdict, a node that will carry an open probe after the apply going to the maieutic stage whatever the verdict, as the author-questions node says; and otherwise on a forward sets `stage: ruling` and writes `review` with `verdict`, `strength`, `date`, `of`, the pin of the recommendation read, and `against`, the counter-argument, and on a kickback sets the stage the reader named and writes the same; the session's judgment after the apply, amending what the reply accepts and sending an amendment of substance through this reading again; and the landing, `review: <slug> <date>` on the disposition ref, or with the sitting's own round when a sitting invoked it. Its frontmatter carries `name: align-review` and a description, and nothing of the model, which is the reader's and is passed at launch. At implementation commit ca64407d the generator does exactly this: `parseArgs` takes the flags above and no others, and `chooseMode` returns the re-reading only where `review.commit` is set and git shows the node's file changed since, falling back to the draft brief, with the fallback named in the brief, where no commit is pinned, where git cannot resolve the file at that commit, or where the account carries no prior reading to re-read against.

`/align-survey`, the survey. It takes no argument; it runs before the author rules, when the frontier shows a survey owed, and whenever a session or the author invokes it; it forwards nothing. Its `SKILL.md` carries: the object as the parent's paragraph on the survey gives it, with the judged set, the frozen set and the comparisons as the `survey-selection` node fixes them and the validations as the frontier-consistency node numbers them, restated here in no part, since those answers move and a copy of one here fell a day behind its source; the brief, `node packages/clean-context-review/brief.mjs --survey [--whole] [--date YYYY-MM-DD] [--dry]`, which refuses to write a brief while the mechanical tier the `survey-selection` node names reports a finding, and otherwise writes `tmp/review/survey.brief.md` from `brief-survey.md`, names `tmp/review/survey.json`, and writes `tmp/review/survey.pins.json`, the graph commit read, the recommendation hash and the five read-text section hashes of every node, the set the selection froze, and the candidate pairs with the key that nominated each, which the apply step compares against and never a hash the reader copied; the launch, one subagent of type `general-purpose` at high effort on the model the review-model node decides, never a fork, with the same prompt, relaunch and report as the review of a draft, told which nodes the selection froze and asked to report as such a finding on any pair no key nominated, and, when the generator says the brief may exceed what one reader holds, told to report what it could not read, an unread part being a gap and never a finding of nothing; the validation, the session's, in the same two files; the apply, `node packages/clean-context-review/apply.mjs tmp/review/survey.json --replies tmp/review/replies.json [--overrides tmp/review/overrides.json] [--pins tmp/review/survey.pins.json] [--date YYYY-MM-DD]`, which writes on every judged node whose recommendation still matches its pin the `review.survey` block the dialogue node's answer carries and the `survey-selection` node's accumulation needs — its `date`, its `of`, the commit the survey read at, the hashes of the five sections the validations read, the register of the findings left open on that node with the support each rests on and the condition on which each is discharged, and the keys the pairs touching it were drawn on — discards with a note every finding on a node that moved since the commit read, appends `### Frontier finding, <date>` to every node a finding names and sets each such node's stage to the earliest a finding recommends for it, records each proposed option on the named node's answer fact with `source: review` and its `####` subsection, writes a subtree divergence on the leaves as `<ancestor>#<option>` in `depends` and never on the ancestor, writes on each node the probes the reader raised there and derives that node's stage from its probes before the finding's, a node carrying an open probe never landing at the ruling stage, and refuses the whole run where any node would not validate after the write; the session's judgment, a merge, split or fold recorded as an option and never done, a lateral tangle applied on the earlier-recorded node; and the landing, `review: survey <date>`, with the alignment page republished as the alignment skill says. Its frontmatter carries `name: align-survey` and a description. None of that selection is built: at implementation commit ca64407d `brief.mjs` holds no mechanical tier and no `--whole`, `parseArgs` accepting `--node`, `--survey`, `--date`, `--dry` and `--draft` with its alias `--fresh` and throwing on any other flag, `surveyPins` writing the commit, the date, the judged list and one recommendation hash a node with no section hashes, no frozen set and no pairs, and `apply.mjs`'s `renderReviewBlock` writing a survey block of `date` and `of` alone, so what this paragraph states of the survey's brief and apply steps is owed to this package and unbuilt on this date, as `survey-selection` discloses the same of itself.

Drift, and whether skill reconciliation resolves it. Until the projector writes the skills, the two `SKILL.md` files and the templates are hand-written shims, declared above, and can drift from the graph and from each other; reconciliation does not resolve that by itself, and the record does not say it does. Three things catch it in the interim. The skills state no rule of their own, and the common instructions are read from the nodes at every invocation under the currency step, which is where a stale skill is corrected and the difference recorded; what the two files duplicate, the shim notice, the currency step, the launch and the model section, is the text the currency step checks first, and a stale copy in one is a difference recorded on the node. The briefs' common text, the bounds and the primer, is one fragment each filled into both. And the survey's validations read the skills as artifacts: a file named exists and a command cited runs, a shim names an artifact that exists, and every cross-reference points at what the node still says, so a skill naming a command the package no longer has, or a node naming `/align-review --survey`, is a finding. None of the three reads one file against its twin, which is why the divergences of 2026-09-05 were found by a reading and repaired by hand. Skill reconciliation resolves drift by construction at the shims' liquidation and not before: when the projector materializes both skills from the nodes their shim notices name, the clean-context-review, recording, frontier-consistency, review-skills, review-model and review-cost nodes between them, as it writes the rules directory today, one file per node, regenerated whole, with a file it wrote and no node claims deleted, the two skills are two projections of one source and nothing can drift between them. Two hand-written files are the interim the author's words accept for the telemetry's sake, and it is declared as an interim. What guards a hand-written projection generally, in the interval between a shim's declaration and its liquidation, is not this node's question and is asked on `commons.systems/disposition-graph/hand-written-projection-drift`, minted from this paragraph on 2026-09-05; what stands here is what is specific to these two files.

What this costs, as a consequence and never as a reason. Created: `.claude/skills/align-survey/SKILL.md`; `packages/clean-context-review/package.json`, `brief-bounds.md` and `brief-record.md`. Moved from `.claude/skills/align-review/` into `packages/clean-context-review/`: `brief.mjs`, `apply.mjs`, `brief-draft.md`, `brief-survey.md`, `brief.test.mjs`, `apply.test.mjs` and `fixtures/frontier/`, their imports of the reader rewritten to the workspace name, the fixture manifest's module renamed with the package, and the fixture nodes carrying the authority fact the reader requires of a staged node with facts, a repair the sibling reconciliation had already landed; `REPO_ROOT` in both scripts re-anchored to the package's new depth, and `apply.mjs` otherwise unchanged. Added after the split, under the same third shim row: `brief-delta.md`, the template of the re-reading, which came with the review-cost node's reconciliation of 2026-09-05 and not with this answer's landing. Owed to the package and unbuilt at implementation commit ca64407d, all of it named by `survey-selection` and none of it in `brief.mjs` or `apply.mjs` today: the mechanical tier and the refusal to write a brief while it reports a finding, the `--whole` flag, the five read-text section hashes, the frozen set, the candidate pairs with their nominating keys, and the register the apply step must leave in a node's `review.survey`. Rewritten: `.claude/skills/align-review/SKILL.md`, to the review of a draft alone; the alignment skill's shim notice, its first and fifth sections and its section on model and delegation, where `/align-review --survey` becomes `/align-survey`; and the bullet of `CLAUDE.md` that names the skills. In the graph: the clean-context-review node's shim, which names one directory holding the scripts, is superseded here, and its supersession is a persistence option the sitting records on that node with this node as its source, for the author to rule on there; that node's recommended text's first sentence, "As a skill of its own, `/align-review`", is amended under the grant to name the two skills and cite this node, its standing text keeping the one-skill form for the author to rule on. Telemetry recorded under `/align-review` before the split mixes both readings.
```

#### one-generator-for-every-brief

The same as `two-skills-one-package` except that `packages/clean-context-review/`
holds no brief generator of its own: one script in `packages/sitting-units/` writes
every brief the record produces, a reading's and a unit's alike, selected by kind,
and this package keeps `apply.mjs`, the three reading templates, the fixtures and
the tests. Raised by `commons.systems/disposition-graph/unit-skills` on 2026-09-07,
which records the fold on its own answer fact and holds that the move is this node's
to rule, because the artifact it moves, `brief.mjs`, is one this node's answer
enumerates among what its package holds.

**AI support.** It is the strictest reading of the author's question about drift and
the only shape in which the two fragments cannot stand in two packages at all, since
there is then one package that writes briefs; two files named `brief.mjs` in one
repository also invite a reader to think one of them is dead, and the record's own
`codd-update-anomaly` reading argues for one home per fact.

**AI divergence.** The two generators do different jobs: a reading's assembles a
neighbourhood out of the graph under `review-cost`'s rule, deciding what is carried
whole and what as a pointer, and a unit's fills a template with a contract the
sitting states. Folding them either loses that rule or parameterizes it by kind,
which is the flag this node's split removes from the command line, and it puts one
job's rules inside the other's file — the wrong abstraction the readings under this
node already name. It is not dominated by `fragments-move-to-the-units-package`: the
two answer the same question at different depths, and taking the weaker forecloses
nothing here.

**Content.**

```markdown
---
question: Is each reading of the clean-context review its own skill?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
shims:
  - artifact: "`.claude/skills/align-review/SKILL.md` on the implementation ref, the review of a draft, hand-written from the clean-context-review node, the recording node, this node, the review-model node and the review-cost node"
    for: the projection of the review of a draft as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-04
  - artifact: "`.claude/skills/align-survey/SKILL.md` on the implementation ref, the survey, hand-written from the clean-context-review node, the frontier-consistency node, this node and the review-model node"
    for: the projection of the survey as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-04
  - artifact: "the brief templates `brief-draft.md`, `brief-survey.md` and `brief-delta.md` and the fragments `brief-bounds.md` and `brief-record.md` under `packages/clean-context-review/` on the implementation ref, hand-written from the nodes each summarizes"
    for: the briefs the two skills write for their readers, whose common text is one fragment filled into both
    liquidation: the brief generator fills a brief's common and reading-specific text from the nodes' answers and the hand-written templates and fragments are deleted
    declared: 2026-09-04
---
## Answer

The same as `two-skills-one-package` except that `packages/clean-context-review/`
holds no brief generator of its own: one script in `packages/sitting-units/` writes
every brief the record produces, a reading's and a unit's alike, selected by kind,
and this package keeps `apply.mjs`, the three reading templates, the fixtures and
the tests. Raised by `commons.systems/disposition-graph/unit-skills` on 2026-09-07,
which records the fold on its own answer fact and holds that the move is this node's
to rule, because the artifact it moves, `brief.mjs`, is one this node's answer
enumerates among what its package holds.
```

#### the-materialization-sentence-is-dated-to-its-commit

The answer's statement of what is unbuilt names the implementation commit and the artifact measured, and is re-measured when the node is next read, instead of standing as a claim about a date. It is on the table because the sentence as it stands says `brief.mjs` holds no mechanical tier and no whole-graph mode at ca64407d, while the brief generated at this graph commit reports both, so a reader cannot tell whether the answer is stale or the measurement was wrong.

### authority

Deferred, at low boldness. `class-recommendation` states its test as exhaustive, so
it is applied here and not departed from. Expensive: no. A wrong answer is paid in a
rename and a move of files, which one reconciliation takes back, and nothing else in
the record is built on the packaging as such. Irreversible: no. What the ruling fixes
is two names and one package path, and both are changed by editing the citations that
carry them; the one thing not paid back is the telemetry already recorded under
`/align-review` before the split, which mixes two populations and which this answer's
cost paragraph discloses, and that is a mixture in an instrument the record does not
own rather than a state of the record it cannot restore. Capture-shaped: no. The
party the clean-context review checks is the AI, and what does the checking is the
parent node's answer — what a reading is, what it is given, who validates its
findings — none of which this node decides; how that instrument is packaged is not
the check itself, and a wrongly packaged reviewer still reads what the parent says it
reads. Where none of the three holds, that node's rule is delegated where the author
has said they do not want to be asked again about that class of decision and deferred
otherwise, and they have not said it: they asked about the shape of these skills on
2026-09-04 and returned to it on 2026-09-07, so deferred is the class the test yields.
Under it the recommendation acts and the node stays on the alignment frontier until
the author returns to it, which is exactly what the landed reconciliation needs and no
more. Ratified was recommended here until 2026-09-07, on a fourth ground the test does
not carry, that the split is the author's own words; the ground is real and is now the
fact's `against` for the author to rule on, but it is not a limb of the test, and
under `authority` the author's words being an option's source confers no class, so it
could not be read as a ruling either. Low boldness: the test is the record's, projected
to `.claude/rules/class-recommendation.md`, and what is the AI's is the reading of each
limb, written out above so that the author can see which limb they would decide
differently.

### persistence

The three shims, the two skill files and the package's templates and
fragments, came into being on 2026-09-04 and stand on this node's frontmatter
under the transience rule, landed by the reconciliation under the author's
grant, so the recommendation no longer changes the node's shape. The
dialogue node's rule is that a persistence fact is present only where the
recommendation would change the shape and is otherwise derived and asks
nothing; this fact is carried past that rule deliberately, because it still
asks something the author rules on, whether the shims are declared here or on
the parent, and the parent met the same departure on 2026-09-05 and answered
it the same way, so the placement is ruled and not inherited. Low boldness: the transience node's
rule, that a shim is declared where it comes into being on the node it
projects, and the alignment page's precedent, whose shim moved to the node
whose question it answers, decide the placement. The parent's shim of
2026-09-03, which names one directory holding the scripts, describes an
artifact this recommendation supersedes; the sitting records its liquidation
as a persistence option on the parent with this node as the source, and the
two nodes rule together.

#### with the three shims

This node declares the three shims: `.claude/skills/align-review/SKILL.md`,
`.claude/skills/align-survey/SKILL.md`, and the brief templates and fragments
under `packages/clean-context-review/`, each with the projector's writing of
it as its liquidation, declared 2026-09-04; the parent's shim of 2026-09-03
is struck there as superseded.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

#### without them

This node declares nothing, and the parent's shim is restated to name the
two directories and the package's templates; the skills are then described
on the node whose mechanics they run and not on the node whose question they
answer, and the parent's declaration date of 2026-09-03 stands for artifacts
that come into being on 2026-09-04.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

## Account


An un-aligned disposition, recorded from the author's words the turn they
were said. It is a question of its own and not `clean-context-review`'s,
because that node's recommended option `per-draft-and-survey` decides that the
review is two readings divided by their object, and this question is about the
instrument: whether the two readings are invoked as two skills, so that the
harness's telemetry, which names a skill by its directory, tells them apart.
The author attaches a second question to it, how the instructions common to
the two readings avoid drift once they are two files, and whether that is
resolved by skill reconciliation, which this node answers with the first.

What the sitting would amend: `clean-context-review`, whose shim declares one
skill, `.claude/skills/align-review/SKILL.md` with the two briefs and the two
scripts beside it, as the projection of both readings; `decomposition`, which
names the review of a draft as one of a sitting's units and the survey as
another; and the alignment skill's §5 and the reconciliation skill, which
invoke the review by one name with a flag. The periagogic object is the skill
directory as it stands, `SKILL.md`, `brief-draft.md`, `brief-survey.md`,
`brief.mjs`, `apply.mjs` and their tests, the harness's convention that a skill
is one directory with one `SKILL.md`, and what the telemetry records of a
skill invocation.

The grant. In the words above the author granted bootstrap authority to
reconcile this disposition immediately after its maieutic movement, before
the clean-context review, which is owed on what is drafted and runs after.

### Manifest

- Folded: State at compaction, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The maieutic movement, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Recorded, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Reconciled, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the reading, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Readings verified, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended by the clean-context reading of clean-context-review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier survey, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The general question moved to a node of its own, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Option adopted, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of 5373d9a4, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Repaired after the reading of d35b0014, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-07, of 6765725e

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `the-survey-skill-launches-a-selected-reading`.

Findings:


On the facts and what they recommend: The answer fact still recommends `the-survey-skill-launches-a-selected-reading` at moderate boldness, now with a new viable option `one-generator-for-every-brief` (source `unit-skills`) added and left unadopted with a non-dominance argument recorded against `fragments-move-to-the-units-package`. The fence's `/align-survey` paragraph now cites `survey-selection` and `frontier-consistency` for the judged set, frozen set, comparisons and validations instead of restating them, extends the apply step to write the full accumulation state (commit, section hashes, findings register, pair keys) rather than `date`/`of` alone, and closes with an explicit disclosure that the tier, `--whole`, the section hashes, the frozen set and the survey block's register are unbuilt at implementation commit ca64407d; the `/align-review` paragraph now states the delta-vs-draft mode choice and the `--draft`/`--fresh` flag, matching the node's own third shim row. The authority fact's recommendation moves from ratified to deferred at low boldness, now applying all three limbs of `class-recommendation`'s test explicitly (none holds) rather than departing from the test on a fourth ground, with the prior ratified argument preserved as the fact's own `against`. The persistence fact is unchanged. The Rationale and Answer gained a new paragraph answering the author's 2026-09-07 words directly: neither skill is superseded by the `unit-skills` family, and that question belongs to `unit-skills` rather than to this node.

On the viability of the options: The diff adds exactly one option, `one-generator-for-every-brief`, sourced from `unit-skills`, correctly recorded as viable and not adopted with a stated reason it is not dominated by the sibling option already on the fact; no other option's viability is touched by the diff, and none of the diff's changes make any listed option non-viable.

The review found no strong counter-argument.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/review-skills stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Recommendation` fence became the content of `the-survey-skill-launches-a-selected-reading`; 3 `## Disposition` entries became the ledger entries words/2026-09-04/38, words/2026-09-04/10, words/2026-09-07/10, referenced by 0 options the entry's own date names and by the recommended option for 3 the date named none. The content of `two-skills-one-package (at 425bbc55)` was recovered from the commit at which the answer fact recommended it. The record wrote no text of its own for `one-skill-with-a-flag`, `two-skills-code-beside-one`, `split-at-liquidation`, `one-skill-named-operation`, `two-skills-under-the-general-rule`, `align-survey-renamed-for-the-family`, `fragments-move-to-the-units-package`, `one-generator-for-every-brief`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `6765725eec753d378fb50ccf10b4d95654d39acd` is re-computed for the encoding as `6eb680043b880246883c473aa1c8d7f4602d204b`; nothing it read changed. The survey's pin `ce9e11aaecf2e702ccf703c6a0898894a9661c68` was already past the recommendation and is left as it stood.

### Frontier survey, 2026-09-07, of 6eb68004

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- Contradiction (7) between the answer's dated measurement and the brief generated on the same date. The answer states "None of that selection is built: at implementation commit ca64407d `brief.mjs` holds no mechanical tier and no `--whole`", while the brief of 2026-09-07 reports both: "The mechanical tier ran 8 checks ... and reported 3351 finding(s)", and the launch itself is described as whole — "This survey is whole." The node's own next clause, "what this paragraph states of the survey's brief and apply steps is owed to this package and unbuilt on this date", is the sentence the brief contradicts.
- Vocabulary (11). The node names the conflict and leaves it standing: `align-survey-renamed-for-the-family` says "the vocabulary conflict behind it is already in the record, `frontier-consistency` defining survey as the reading of the frontier while `decomposition` calls three of a sitting's units surveys". Reporting a term used with two meanings inside an option, while the recommendation adopts neither repair, leaves the eleventh validation unmet on the node that found it.

Strongest counter-argument (moderate): The authority fact recommends deferred, and the node's own `against` puts the case that a landing other work is built on is irreversible in `class-recommendation`'s own gloss: the names `/align-review` and `/align-survey` are cited by the record, the alignment skill, the telemetry, and the proposed family of seven, so a recommendation may move them under a class that never returns to the author. The split is also measured to be growing apart rather than converging — forty-seven identical non-blank lines at ca64407d against thirty-four at the split — so the interim the deferral protects is the interval in which the two hand-written files silently diverge.

### Frontier finding, 2026-09-07

Kind: vocabulary.

The term survey is used with two meanings across the frontier. `frontier-consistency`'s answer defines it as the reading of the whole graph, while `delegation`'s answer, projected at .claude/rules/delegation.md, makes it a kind of subagent unit: "Every investigation whose context is verbose is a unit whatever its size: debugging, driving a browser, reading logs, transcripts, or diagnostic output, and surveys." `review-skills` records the collision on its own face in `align-survey-renamed-for-the-family`: "the vocabulary conflict behind it is already in the record, `frontier-consistency` defining survey as the reading of the frontier while `decomposition` calls three of a sitting's units surveys". A term the record has made a skill name (`/align-survey`) and a validation subject cannot also name an ordinary unit.

Also named: commons.systems/disposition-graph/frontier-consistency, commons.systems/disposition-graph/decomposition, commons.systems/disposition-graph/delegation, commons.systems/disposition-graph/clean-context-review.

Proposed: The survivor is `frontier-consistency`'s sense: survey is the reading of the frontier, and the skill family keeps the name. `decomposition` already carries the repair as the option `units-are-readings-not-surveys`, so no new option is needed there; `delegation`'s answer loses the word from its list of verbose investigations, which is a sizing clause `delegation-bounds-and-sizing` has already assigned to `unit-sizing`, so the amendment travels with that move rather than reopening the bound.

### A survey finding the apply discarded, 2026-09-07

The survey of 2026-09-07 returned a cross-node finding that names this node
and `survey-selection`, and `survey-selection` moved after the survey read it,
its recommendation having been recorded anew at f57877f9 on the author's words
of 2026-09-07, so the apply discarded the finding whole and wrote nothing on
any node it names. It was validated at its loci on the main thread and is not
withdrawn. The option `the-materialization-sentence-is-dated-to-its-commit` it proposes on this node is added to the answer fact by
hand, which is an act the AI has on any fact and which settles nothing. The stage
the finding named, maieutic, is set by hand, since the record requires every
answer option of a node at the ruling stage to carry its content and the
option carries its sentence only; no survey pin is written by hand.

The `contradiction` finding on the dated materialization sentences, as the survey wrote it: Three judged answers assert that nothing they name is materialized on 2026-09-07, and the brief generated on 2026-09-07 falsifies two of the assertions. `survey-selection` states "Nothing this answer names is materialized on 2026-09-07: the validator holds no tier, the projector emits no concordance, the brief generator selects on pins alone" and `review-skills` states "None of that selection is built: at implementation commit ca64407d `brief.mjs` holds no mechanical tier and no `--whole`", while the brief reports "The mechanical tier ran 8 checks (unresolved-reference, recommendation-past-its-pin, duplicate-option-name, option-content-unresolvable, term-without-a-path, unresolved-words-reference, duplicated-passage, unfolded-account-section) and reported 3351 finding(s)", "The keys nominated 4677 candidate pair(s)", and "This survey is whole." `unconfirmed-accumulation` carries the same form of sentence — "Nothing this answer names is materialized on 2026-09-07: no instrument folds, no manifest line exists, and the validator checks none" — which this survey did not test. A dated negative measurement written into an answer expires without notice and cannot be checked by any instrument the record has.

Its proposal: The survivor is the practice, not one of the two sentences: a materialization claim in an answer names the implementation commit it was taken at and states what it measured, as `review-skills` half does with ca64407d, rather than dating itself to a calendar day the answer outlives. `survey-selection`'s and `review-skills`' sentences are amended to that form before either is ruled, and `unconfirmed-accumulation`'s is re-measured with them.
