---
question: Do architecture decision records in the MADR form support encoding the dialogue state as alternatives with a recommendation among them?
stage: maieutic
review:
  verdict: forward
  strength: moderate
  date: 2026-09-05
  of: 9c0f951e94dee8342bfeeb9b8b99f7b81f2b127f
  commit: 7650730028abdef429a8a94f4a11215917585581
  against: "The reading is three drafts deep and has never once left the AI's memory. Each redrawing has fitted it better to the record — every considered option kept, the class derived, supersession named — and each was made by a reader with the same second-hand knowledge of the template as the writer, so what has improved is the fit and not the fidelity, and the single test that would catch a misreading, somebody opening MADR, has been run at none of the three. This reading found two of its mappings wrong (rejected, decision-makers) by reading the record rather than the source, which is evidence that the remaining errors are of the kind only the source would catch. The entries make the point structurally: after two rounds of findings every relation is still `adopted`, and the two divergences the answer now states are carried by no entry at all, so the projection dialogue's ratifier reads still shows a tradition agreeing with the encoding in every particular. Delegated on the authority fact makes that permanent at the moment it matters most, and the record's reply — that readings' own rule confers delegated on exactly this case, and that the author's words of 2026-09-04 name this tradition in terms — answers less than it seems, since those words invoke 'ADR style \"alternatives considered\" documentation', the one clause of MADR nobody disputes, while the work this reading does is in the clauses about the status and the immutability that the author has never spoken to."
  survey:
    date: 2026-09-07
    of: abf8be8c2beabc81a6b3706a29ed4e70e1f7a7e1
    commit: 6611799a1dd6276691cf61f482c8e593f0234200
    text:
      question: "a3895c5c1f746c361cc335146588a7693431be62fde123ccac8b9114e0d3e1fe"
      answer: "a4a22f23ebb8186b3376d877e436fee3217d31d28e597db49b8fda6ffc8c9ff3"
      options: "7c3be06104260c725f38e1e928352313925b45553ccc48dc9f724a14397b278f"
      rivals: "c7061996d7a646d020af0c1b01691c7e96cc9e9e16cb1020758b6c799de96e7e"
      words: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    findings:
      - finding: "Five judged nodes stand at the ruling stage on ground still at the maieutic stage without saying so, which the thirteenth validation forbids: \"no node at the ruling stage rests on ground still at the periagogic or maieutic stage without saying so\". `tolerated-inconsistency` and `verifying-traces-and-early-cutoff` each bear on `commons.systems/disposition-graph/dialogue#answer#the-survey-block-carries-what-the-next-survey-selects-on (adopted)`; `unconfirmed-accumulation` depends on `commons.systems/disposition-graph/dialogue#an-option-carries-its-content-its-words-and-its-case`; `event-sourcing-with-snapshots` stands under `unconfirmed-accumulation` which does; and `madr-decision-records` stands under `dialogue` and depends on `viable-options`. The brief lists the ground as \"commons.systems/disposition-graph/dialogue | unanswered | stage maieutic | rank 0.0017 | settles 31\". The author would rule five nodes whose ground has no drafted answer."
        kind: "placement"
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
          - "commons.systems/disposition-graph/madr-decision-records"
          - "commons.systems/disposition-graph/tolerated-inconsistency"
          - "commons.systems/disposition-graph/verifying-traces-and-early-cutoff"
          - "commons.systems/disposition-graph/event-sourcing-with-snapshots"
          - "commons.systems/disposition-graph/unconfirmed-accumulation"
          - "commons.systems/disposition-graph/dialogue"
          - "commons.systems/disposition-graph/viable-options"
    pairs:
      - with: "commons.systems/disposition-graph/anchoring-and-adjustment"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/appellate-review-en-banc"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/approval-directed-agents"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/author-questions"
        keys:
          - "parent:commons.systems/disposition-graph/dialogue"
      - with: "commons.systems/disposition-graph/authority"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/bentham-publicity"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/brooks-surgical-team"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/change-reviewed-as-a-diff"
        keys:
          - "parent:commons.systems/disposition-graph/dialogue"
          - "cites"
      - with: "commons.systems/disposition-graph/checkpoint"
        keys:
          - "parent:commons.systems/disposition-graph/dialogue"
      - with: "commons.systems/disposition-graph/chenery-reasoned-decision"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/chestertons-fence"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/class-recommendation"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/clean-context-review"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/codd-update-anomaly"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/delegation"
        keys:
          - "term:subagent (defines: commons.systems/disposition-graph/delegation)"
      - with: "commons.systems/disposition-graph/deprecation-not-deletion"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/dialogue"
        keys:
          - "term:account (defines: commons.systems/disposition-graph/dialogue)"
          - "term:alternative (defines: commons.systems/disposition-graph/dialogue)"
          - "term:answer (defines: commons.systems/disposition-graph/dialogue)"
          - "term:confirmed (defines: commons.systems/disposition-graph/dialogue)"
          - "term:dialogue (defines: commons.systems/disposition-graph/dialogue)"
          - "term:dialogue state (defines: commons.systems/disposition-graph/dialogue)"
          - "term:draft (defines: commons.systems/disposition-graph/dialogue)"
          - "term:fact (defines: commons.systems/disposition-graph/dialogue)"
          - "term:keep (defines: commons.systems/disposition-graph/dialogue)"
          - "term:persistence (defines: commons.systems/disposition-graph/dialogue)"
          - "term:recommendation (defines: commons.systems/disposition-graph/dialogue)"
          - "term:ruling (defines: commons.systems/disposition-graph/dialogue)"
          - "term:stage (defines: commons.systems/disposition-graph/dialogue)"
          - "term:standing answer (defines: commons.systems/disposition-graph/dialogue)"
          - "cites"
      - with: "commons.systems/disposition-graph/dissent-and-reconsideration"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/dry-single-source-of-truth"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/event-sourcing-derived-view"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/fagan-inspection-roles"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/file-drawer-and-pre-registration"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/frontier-consistency"
        keys:
          - "term:frontier survey (defines: commons.systems/disposition-graph/frontier-consistency)"
      - with: "commons.systems/disposition-graph/growth"
        keys:
          - "term:boldness (defines: commons.systems/disposition-graph/growth)"
          - "term:project (defines: commons.systems/disposition-graph/growth)"
          - "term:propose (defines: commons.systems/disposition-graph/growth)"
          - "term:ratify (defines: commons.systems/disposition-graph/growth)"
      - with: "commons.systems/disposition-graph/hansard-verbatim-record"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/how-a-fact-is-headed"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/ibis-issue-based-information"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/information-hiding"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/instruments"
        keys:
          - "term:check (defines: commons.systems/disposition-graph/instruments)"
          - "term:evidence (defines: commons.systems/disposition-graph/instruments)"
          - "term:instrument (defines: commons.systems/disposition-graph/instruments)"
      - with: "commons.systems/disposition-graph/legislative-amendment-in-context"
        keys:
          - "parent:commons.systems/disposition-graph/dialogue"
          - "cites"
      - with: "commons.systems/disposition-graph/level-triggered-reconciliation"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/literate-programming"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/model"
        keys:
          - "term:disposition (defines: commons.systems/disposition-graph/model)"
          - "term:node (defines: commons.systems/disposition-graph/model)"
      - with: "commons.systems/disposition-graph/montgomery-informed-consent"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/multi-call-binary-and-facade"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/n-version-programming"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/nielsen-user-control-and-freedom"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/node"
        keys:
          - "term:answer (defines: commons.systems/disposition-graph/node)"
          - "term:form (defines: commons.systems/disposition-graph/node)"
          - "term:question (defines: commons.systems/disposition-graph/node)"
          - "term:rationale (defines: commons.systems/disposition-graph/node)"
          - "cites"
      - with: "commons.systems/disposition-graph/non-liquet"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/none-of-the-above-ballot"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/not-proven-third-verdict"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/notarial-minute"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/npm-committed-lockfile"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/ocap-attenuation"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/operation-naming-in-telemetry"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/pareto-frontier"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/peirce-paper-doubt"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/progressive-disclosure"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/projection"
        keys:
          - "term:projection (defines: commons.systems/disposition-graph/projection)"
      - with: "commons.systems/disposition-graph/promotor-fidei"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/prose-and-structure"
        keys:
          - "cites"
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
          - "cites"
      - with: "commons.systems/disposition-graph/review"
        keys:
          - "term:review (defines: commons.systems/disposition-graph/review)"
      - with: "commons.systems/disposition-graph/review-approval-pinned-to-a-revision"
        keys:
          - "parent:commons.systems/disposition-graph/dialogue"
          - "cites"
      - with: "commons.systems/disposition-graph/review-cost"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/rfc-pep-status-field"
        keys:
          - "parent:commons.systems/disposition-graph/dialogue"
          - "cites"
      - with: "commons.systems/disposition-graph/roberts-rules-commit-or-refer"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/scholarly-peer-review"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/scholastic-articulus"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/scope"
        keys:
          - "term:section (defines: commons.systems/disposition-graph/scope)"
      - with: "commons.systems/disposition-graph/segregation-of-duties"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/self-contained-specification"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/single-subject-rule"
        keys:
          - "parent:commons.systems/disposition-graph/dialogue"
          - "cites"
      - with: "commons.systems/disposition-graph/special-verdict-form"
        keys:
          - "parent:commons.systems/disposition-graph/dialogue"
          - "cites"
      - with: "commons.systems/disposition-graph/srs-introduction"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/the-wrong-abstraction"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/transience"
        keys:
          - "term:persistence (defines: commons.systems/disposition-graph/transience)"
          - "term:shim (defines: commons.systems/disposition-graph/transience)"
          - "term:standing (defines: commons.systems/disposition-graph/transience)"
      - with: "commons.systems/disposition-graph/unanswered"
        keys:
          - "term:answered (defines: commons.systems/disposition-graph/unanswered)"
          - "term:unanswered (defines: commons.systems/disposition-graph/unanswered)"
      - with: "commons.systems/disposition-graph/unconfirmed-accumulation"
        keys:
          - "parent:commons.systems/disposition-graph/dialogue"
      - with: "commons.systems/disposition-graph/under"
        keys:
          - "term:context (defines: commons.systems/disposition-graph/under)"
          - "term:under (defines: commons.systems/disposition-graph/under)"
      - with: "commons.systems/disposition-graph/utility-syntax-flag-or-subcommand"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/value-of-information"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/viable-options"
        keys:
          - "term:grant (defines: commons.systems/disposition-graph/viable-options)"
          - "term:option (defines: commons.systems/disposition-graph/viable-options)"
          - "term:viable (defines: commons.systems/disposition-graph/viable-options)"
          - "parent:commons.systems/disposition-graph/dialogue"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/what-acts-during-bootstrap"
        keys:
          - "term:bootstrap (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
      - with: "commons.systems/disposition-graph/work-loop"
        keys:
          - "term:frontier (defines: commons.systems/disposition-graph/work-loop)"
facts:
  - name: answer
    options:
      - name: status-derived-from-stamp
        source: ai
        ref: "2026-09-03"
        status: passed
        reason: "it rests on a stamp the record no longer writes and on options folded into the rationale, which the viable-options node passed over"
      - name: divergence-narrows
        source: author
        ref: "2026-09-04"
        status: passed
        reason: "it records one divergence where the tradition's supersession is a second, and describes the viable-options node's recommended option while bearing on its standing one"
      - name: storage-and-supersession-diverge
        source: review
        ref: "2026-09-05"
    recommends: storage-and-supersession-diverge
    boldness: high
    against: "The reading is the record's only examination of the tradition behind its central encoding and is drawn from the AI's memory of a template no one here has read; two divergences recorded from memory may be two misreadings, and a tradition the encoding was drawn from on purpose will always read as adopted, so the relation proves less than it seems."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: delegated
    boldness: high
    against: "Delegating a reading nobody but the AI has read leaves the dialogue node's encoding resting on an unread source at its ratification; deferred would hold the reading in front of the author until they have read the template."
form: reading
under:
  - commons.systems/disposition-graph/dialogue
source: Markdown Architectural Decision Records (MADR), the template at adr.github.io/madr, version 4 (Context and Problem Statement, Decision Drivers, Considered Options, Decision Outcome with its chosen option, consequences, and confirmation, Pros and Cons of the Options, More Information; a status of proposed, rejected, accepted, deprecated, or superseded by another record; decision-makers, consulted, and informed), descending from Michael Nygard's architecture decision records of 2011 (Context, Decision, Status, Consequences).
bears:
  - fact: answer
    option: facts-carry-options
    relation: adopted
  - fact: answer
    option: alternatives-beside-facts
    relation: adopted
  - fact: answer
    option: every-part-in-the-record
    relation: adopted
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: grant-from-a-ruling
    relation: adopted
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: passed-over-options-stay
    relation: adopted
  - node: commons.systems/disposition-graph/prose-and-structure
    fact: answer
    option: prose-argues-structure-records
    relation: adopted
  - node: commons.systems/disposition-graph/authority
    fact: answer
    option: authority-derived
    relation: diverged
  - node: commons.systems/disposition-graph/node
    fact: answer
    option: four-form-draft
    relation: diverged
  - node: commons.systems/disposition-graph/how-a-fact-is-headed
    fact: answer
    option: glosses-written-with-this-ruling
    relation: adopted
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: confirmed-is-a-derived-label-and-every-option-carries-its-content
    relation: adopted
depends:
  - commons.systems/disposition-graph/viable-options
---

## Facts

### answer

`storage-and-supersession-diverge` is recommended because it reads the tradition as the tradition is: every considered option kept, which the record matches only under the viable-options node's recommended option; a status that lives on the record after the decision; and a supersession that keeps the old record beside the new, the last two of which the record does not do, and the reading says so instead of narrowing the divergence until the relation reads as adopted. High boldness, which in this record is low confidence: the reading rests on the AI's knowledge of the template and the author has not read the source, and it is read against the record's central encoding where the sibling readings, at moderate, are each read against one option. The case against is on the fact.

#### status-derived-from-stamp

The reading as it stood from 2026-09-03: MADR supports the dialogue state, whose alternatives with their sources are the considered options and whose rejected lines in the rationale are the options' cons after the ruling, with two divergences, the status derived from the stamp and the stage, and the decision-makers folded into the source. Passed over on 2026-09-05: it presumes a stamp the authority node's answer says is not written, and its only route back is the option `options-folded-into-the-rationale`, which the viable-options node passed over and which a ruling on the recording node's `stamp-written-at-the-recording` would have to revive.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Do architecture decision records in the MADR form support encoding the dialogue state as alternatives with a recommendation among them?
form: reading
under:
  - commons.systems/disposition-graph/dialogue
source: Markdown Architectural Decision Records (MADR), the template at adr.github.io/madr, version 4 (Context and Problem Statement, Decision Drivers, Considered Options, Decision Outcome with its chosen option, consequences, and confirmation, Pros and Cons of the Options, More Information; a status of proposed, rejected, accepted, deprecated, or superseded by another record; decision-makers, consulted, and informed), descending from Michael Nygard's architecture decision records of 2011 (Context, Decision, Status, Consequences).
bears:
  - fact: answer
    option: facts-carry-options
    relation: adopted
  - fact: answer
    option: alternatives-beside-facts
    relation: adopted
  - fact: answer
    option: every-part-in-the-record
    relation: adopted
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: grant-from-a-ruling
    relation: adopted
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: passed-over-options-stay
    relation: adopted
  - node: commons.systems/disposition-graph/prose-and-structure
    fact: answer
    option: prose-argues-structure-records
    relation: adopted
  - node: commons.systems/disposition-graph/authority
    fact: answer
    option: authority-derived
    relation: diverged
  - node: commons.systems/disposition-graph/node
    fact: answer
    option: four-form-draft
    relation: diverged
  - node: commons.systems/disposition-graph/how-a-fact-is-headed
    fact: answer
    option: glosses-written-with-this-ruling
    relation: adopted
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: confirmed-is-a-derived-label-and-every-option-carries-its-content
    relation: adopted
---

## Answer

The reading as it stood from 2026-09-03: MADR supports the dialogue state, whose alternatives with their sources are the considered options and whose rejected lines in the rationale are the options' cons after the ruling, with two divergences, the status derived from the stamp and the stage, and the decision-makers folded into the source. Passed over on 2026-09-05: it presumes a stamp the authority node's answer says is not written, and its only route back is the option `options-folded-into-the-rationale`, which the viable-options node passed over and which a ruling on the recording node's `stamp-written-at-the-recording` would have to revive.
```

#### divergence-narrows

Under the viable-options model the considered options persist after the decision as MADR keeps them, with the reasons each was not taken, so the recorded divergence narrows to what is stored: the stage is stored and the status is derived from the rulings on the facts, where MADR stores the status. The review's finding that the divergence as written was half wrong is met by the same narrowing. Raised on commons.systems/disposition-graph/viable-options, from the author's words of 2026-09-04 there. Passed over on 2026-09-05: it records one divergence where supersession is a second, and what it describes, every considered option kept, holds only under that node's recommended option and not under `grant-from-a-ruling`, which this reading bore on.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Do architecture decision records in the MADR form support encoding the dialogue state as alternatives with a recommendation among them?
form: reading
under:
  - commons.systems/disposition-graph/dialogue
source: Markdown Architectural Decision Records (MADR), the template at adr.github.io/madr, version 4 (Context and Problem Statement, Decision Drivers, Considered Options, Decision Outcome with its chosen option, consequences, and confirmation, Pros and Cons of the Options, More Information; a status of proposed, rejected, accepted, deprecated, or superseded by another record; decision-makers, consulted, and informed), descending from Michael Nygard's architecture decision records of 2011 (Context, Decision, Status, Consequences).
bears:
  - fact: answer
    option: facts-carry-options
    relation: adopted
  - fact: answer
    option: alternatives-beside-facts
    relation: adopted
  - fact: answer
    option: every-part-in-the-record
    relation: adopted
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: grant-from-a-ruling
    relation: adopted
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: passed-over-options-stay
    relation: adopted
  - node: commons.systems/disposition-graph/prose-and-structure
    fact: answer
    option: prose-argues-structure-records
    relation: adopted
  - node: commons.systems/disposition-graph/authority
    fact: answer
    option: authority-derived
    relation: diverged
  - node: commons.systems/disposition-graph/node
    fact: answer
    option: four-form-draft
    relation: diverged
  - node: commons.systems/disposition-graph/how-a-fact-is-headed
    fact: answer
    option: glosses-written-with-this-ruling
    relation: adopted
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: confirmed-is-a-derived-label-and-every-option-carries-its-content
    relation: adopted
---

## Answer

Supports it, and the record adopts its form. A MADR record lists the considered options, states the chosen option with the reasons that decided it, keeps the pros and cons of every option beside the decision, and carries a status that moves from proposed through accepted, rejected, deprecated, or superseded. A fact on a node is that record kept live: the options with their sources are the considered options, the recommended option is the decision outcome as proposed, the confirmed choice with the author's reason is the outcome as accepted, the options that persist after the ruling with the reasons they were not taken are the pros and cons kept beside the decision, and the stage is the status while the dialogue is open. One difference is recorded as this project's own: MADR stores the status, and this record stores the stage and derives the status and the class from the rulings on the facts, since a stored status drifts from the rulings that confer it. MADR's decision-makers, consulted, and informed are one person and one AI here, and the source of each option, the author, the AI, the review, or the instrument or node that raised it, carries what those fields carry.
```

#### storage-and-supersession-diverge

Supports it, and the record adopts its form with two divergences of its own.

**AI support.** Surfaced in the sitting on the dialogue node on 2026-09-03, when the author asked for the unanswered frontier to be encoded as a recommendation with dialogue state and a list of alternatives, and recorded under that node's rationale as the tradition the encoding adopts; named again in the author's words of 2026-09-04 on the viable-options node, "a clear mechanical encoding for ADR style 'alternatives considered' documentation", which is why the relation on the options it bears on is adopted. Validated by the AI from its own knowledge of the template, version 4 as `source` cites it; the author has not read it and has not been asked to. Delegated is what the AI recommends for a reading the author has not asked to rule on, and it is not the case the readings node describes as declining to review, nor the deferral that node describes as accepting a reading for now and queueing the source: the author has done neither here, this node carrying no `## Disposition` and the record no words of theirs about the template. Deferred stands beside it on the fact. This reading is one of the five the viable-options node's account names as having informed `passed-over-options-stay`, and it is re-pointed onto that option on the same occasion as `pareto-frontier`'s second entry, 2026-09-05; the re-reading that account owes is of the six readings under that node, which this one, mounted under dialogue, is not.

**AI divergence.** The reading is the record's only examination of the tradition behind its central encoding and is drawn from the AI's memory of a template no one here has read; two divergences recorded from memory may be two misreadings, and a tradition the encoding was drawn from on purpose will always read as adopted, so the relation proves less than it seems.

**Content.**

```markdown
---
question: Do architecture decision records in the MADR form support encoding the dialogue state as alternatives with a recommendation among them?
form: reading
under:
  - commons.systems/disposition-graph/dialogue
source: Markdown Architectural Decision Records (MADR), the template at adr.github.io/madr, version 4 (Context and Problem Statement, Decision Drivers, Considered Options, Decision Outcome with its chosen option, consequences, and confirmation, Pros and Cons of the Options, More Information; a status of proposed, rejected, accepted, deprecated, or superseded by another record; decision-makers, consulted, and informed), descending from Michael Nygard's architecture decision records of 2011 (Context, Decision, Status, Consequences).
bears:
  - fact: answer
    option: facts-carry-options
    relation: adopted
  - fact: answer
    option: alternatives-beside-facts
    relation: adopted
  - fact: answer
    option: every-part-in-the-record
    relation: adopted
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: grant-from-a-ruling
    relation: adopted
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: passed-over-options-stay
    relation: adopted
  - node: commons.systems/disposition-graph/prose-and-structure
    fact: answer
    option: prose-argues-structure-records
    relation: adopted
  - node: commons.systems/disposition-graph/authority
    fact: answer
    option: authority-derived
    relation: diverged
  - node: commons.systems/disposition-graph/node
    fact: answer
    option: four-form-draft
    relation: diverged
  - node: commons.systems/disposition-graph/how-a-fact-is-headed
    fact: answer
    option: glosses-written-with-this-ruling
    relation: adopted
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: confirmed-is-a-derived-label-and-every-option-carries-its-content
    relation: adopted
---

## Answer

Supports it, and the record adopts its form with two divergences of its own. A MADR record states the context and the problem, lists the considered options, states the chosen option with the reasons that decided it, keeps the pros and cons of every considered option beside the decision, and carries a status that moves from proposed through accepted or rejected to deprecated or superseded by a later record. A fact on a node is that record kept live: the options with their sources are the considered options, and every option considered stays listed, which the record matches under the viable-options node's option `passed-over-options-stay` and not under its standing text, where a dominated option leaves the list; the recommended option is the decision outcome as proposed, and the confirmed choice with the author's reason is the outcome as accepted; the reasons each other option was not taken are the pros and cons kept beside the decision; and the reasons a candidate was passed over are the same pros and cons, carried on the option as `status: passed` with its clause. MADR's proposed and accepted are a recommendation without a ruling and a recommendation with one; its rejected and deprecated are statuses of the record, so here of the fact, and this record stores neither, a refused recommendation leaving no mark at all and only the author's words in the kickback, which is the first divergence read once more. The first divergence is in what is stored. MADR stores the status on the record; this record stores the stage while the dialogue is open, derives the node's class from the rulings on the facts, and lets the stage die at the recording where MADR's status lives on, since a stored status drifts from the rulings that confer it. The second is supersession. A MADR record once accepted is immutable, and a change is a new record kept beside the old with the old marked superseded by it; this record amends the fact in place, the displaced option staying on the fact with its sentence and the text it carried surviving only in version control, as the node node says. MADR's decision-makers, consulted, and informed are one person and one AI here: the decision-makers are the author's ruling and, before it, the recommendation the ruling answers; the consulted are the readings that bear on the option; informed has no counterpart. An option's `source` answers to none of the three, because it names who put the candidate on the table and not who decided, as the viable-options node says in as many words.
```

### authority

Delegated, the class the readings node confers where the AI's reading stands and the author does not take up the source; the relation here is the AI's, from its own knowledge of the template, and the author has neither read it nor been asked to. The census that stood in this sentence, that every reading on the record recommends delegated, is false: `srs-introduction` is a reading whose authority fact recommends deferred, and whether the same formula is wrong on the other readings that carry it word for word is the survey's to say and not this reading's. Deferred beside it is the reading of 2026-09-03's second finding, the reading held until the author reads the template, and it is the author's to take. High boldness, because what the class rests on is the AI's judgment of what the author intends by not having been asked, and not on anything they have said. The case against is on the fact.

## Account


Recorded 2026-09-03: a reading node written under the author's bootstrap grant on the dialogue node of that day, as the reconciliation recorded on that node requires, and resting on the AI's knowledge of the MADR template and on nothing the author has read. What it recommends and why is on the facts and is not restated here; the conventions this paragraph carried, the `Facts:` line and a `Persistence:` line for a fact the node does not have, are the ones `prose-argues-structure-records` liquidates, and the open item on the template's version and sections was met by the tenth finding of the reading of 2026-09-05.

### Manifest

- Folded: Re-encoding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: A relation added, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the reading, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context review, 2026-09-05

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Frontmatter `bears` (lines 42-63) against `## Answer` (line 69): all six entries carry `relation: adopted` while the answer now states two departures, 'The first divergence is in what is stored' and 'The second is supersession.' The readings node's answer requires the relation per option, 'adopted, where the tradition supports the option, or diverged, where the option departs from it and the reading's own answer says why', and `prose-argues-structure-records`, which this node bears adopted on, sends what has a shape to the field that has it, 'a tradition to a reading node under the disposition it bears on, with the `bears` entries that name the option and the relation'. As it stands both divergences live only in prose, so every projection shows dialogue's ratifier a tradition that agrees with the encoding in every particular, which is exactly what this fact's own `against` warns of ('a tradition the encoding was drawn from on purpose will always read as adopted'). The record names both homes. For the class, `rfc-pep-status-field`'s answer says of the same divergence that 'the relation belongs on the option that decides how the class is held', which is `commons.systems/disposition-graph/authority`'s `authority-derived`. For supersession, the draft cites the node it departs from in its own sentence, 'as the node node says', whose text is 'If a new answer replaces an old one, the node holds the new answer and version control holds the old'. Suggested edit: add `{node: commons.systems/disposition-graph/authority, fact: answer, option: authority-derived, relation: diverged}` and `{node: commons.systems/disposition-graph/node, fact: answer, option: four-form-draft, relation: diverged}`, keeping the six adopted entries as they are.
- `## Facts`, `#### storage-and-supersession-diverge` (lines 89-91): the option that stands carries a subsection. `stands: storage-and-supersession-diverge` (line 29), and dialogue's `every-part-in-the-record` — the option this node bears adopted on — says 'The option that stands has none, its text being the answer, and a projection reads its first sentences from `## Answer` exactly as it reads any other option's from its subsection', with the validator clause 'one `####` under a per-node fact for each option but the one that stands'. The siblings follow it: `checkpoint`, `pareto-frontier` and `rfc-pep-status-field` all stand `standing` and carry no `#### standing`. Dialogue's pending option `standing-option-carries-a-subsection` is the alternative and names the cost this node is paying meanwhile, 'against it, the answer's first sentences said twice drift'. Suggested edit: delete the subsection; its one piece of content the answer does not carry, 'Raised by the clean-context reading of 2026-09-05', is already in `source: review` and `ref: "2026-09-05"`.
- `## Account`, first paragraph (line 99): the superseded prose conventions survive the amendment that was said to remove them. The paragraph still reads 'Facts: delegated, since readings are delegated in this graph and the author has not asked to rule on each; boldness high, ... Persistence: standing.' `prose-argues-structure-records`, adopted by this node, liquidates in the accounts 'the conventions the facts encoding replaced, the `Facts:` line, the `Options:` block, `Feeds:`, `Depends on:`, `Proposed text:` and `Responses open:`', and there is no persistence fact for 'Persistence: standing' to report. The ninth finding of the reading of 2026-09-05 asked for this in terms ('strike "Persistence: standing" or add the fact') and the session's reply says 'All ten findings verified and taken; the tenth needed no edit', but the paragraph is unchanged. Its closing clause is stale for the same reason: 'Open for the author: whether the template's version and sections are cited accurately' was answered by that reading's tenth finding, recorded on this node as 'met'. Suggested edit: strike the field claims and the answered open item, leaving the paragraph to say what it alone says, that the node was written under the grant on dialogue and rests on the AI's knowledge of the template.
- `## Answer` (line 69): MADR's `rejected` is a status of the record, and the draft maps it to a status on an option. The sentence reads 'MADR's rejected has its nearest counterpart in the stored `status: passed` on an option, a refused ruling being recorded as the author's words and never as a ruling', while the same paragraph has already said the status 'moves from proposed through accepted or rejected to deprecated or superseded by a later record' — a status of the record — and that 'A fact on a node is that record kept live'. On the draft's own analogy MADR's rejected is a fact whose recommendation was refused, which the record stores as nothing at all, the kickback being the author's words; and `status: passed` belongs to the pros-and-cons mapping the same sentence has already made, 'the reasons each other option was not taken are the pros and cons kept beside the decision', so it is now used for two of MADR's parts. `deprecated` is listed and never placed. Suggested edit: map proposed and accepted onto a recommendation without and with a ruling; say that MADR's rejected and deprecated are statuses of the record and so of the fact, and that a refused recommendation here leaves no stored mark, only the author's words in the kickback, which is either a third divergence or the same divergence in what is stored read once more; and leave `status: passed` where it already sits, as the mark that carries the reason an option was not taken.
- `## Answer` (line 69), last sentence: `source` does not carry what MADR's decision-maker fields carry. The draft says 'MADR's decision-makers, consulted, and informed are one person and one AI here, and the source of each option, the author, the AI, the review, or the instrument or node that raised it, carries what those fields carry.' Viable-options' recommended text, which this reading bears adopted on, says the opposite of the first field: 'The source names who put the candidate on the table', where MADR's decision-makers names who took the decision. Here the decision is taken by the author's `ruling` and, before it, by the AI's `recommends`; the consulted, on the record's own vocabulary, are the readings that bear on the option; informed has no counterpart at all. Suggested edit: map decision-makers onto the ruling and the recommendation it answered, consulted onto the readings that bear on the option, informed onto nothing, and say that `source` answers to none of the three because it names who raised the candidate and not who decided.
- `## Facts`, `### authority` (line 95): 'Delegated, as every reading on the record recommends' is false as a claim about the record. `commons.systems/disposition-graph/srs-introduction` is a reading (`form: reading`, under `purpose`) whose authority fact recommends deferred (srs-introduction.md line 35). The sentence is a house formula carried verbatim on other readings — `event-sourcing-derived-view`'s `### authority` has it word for word — so the correction may be owed beyond this node, which is the survey's to say and not this reading's. Suggested edit: name the rule rather than the census, that delegated is the class the readings node confers when the AI's reading stands and the author declines to review it. In the same paragraph, the reason given for the boldness names the stakes and not the ground: 'High boldness, since the source behind the record's central encoding is the one the author would most want to have read', where dialogue defines boldness as 'how much of the recommendation rests on the AI's own knowledge against the record and the author's words'. The ground that does make it high is available and different, and is the subject of the next finding.
- `## Rationale` (line 73) and `### authority` (line 95): the record holds neither of the two acts that would fix the class. The rationale reads 'the author has not read it: delegated, the class the readings node confers when the AI's reading stands and the author declines to review it', but readings distinguishes delegated, 'the author declines to review it', from deferred, 'the author accepts it for now and queues the primary reading', and the author has done neither — this node carries no `## Disposition` and the record holds no words of theirs about this template. Not having read a source is not declining to review it. The authority paragraph compounds it: 'The `deferred` option beside it is what the account asks for' points at text the account no longer carries, the phrase 'deferred until the author reads it' surviving only inside the quotation of the 2026-09-03 reading's second finding at line 113. Suggested edit: say that the author has not been asked, that delegated is what the AI recommends for a reading the author has not asked to rule on, and that the class therefore rests on the AI's judgment of what the author intends, which is what makes the boldness high; and point the deferred sentence at the reading of 2026-09-03 or at the case against on the fact.
- `## Rationale` (line 73), last sentence: 'The readings under the viable-options node were owed a re-reading against its recommended option at the review, as that node's account says'. That node's account says 'a re-reading of the other six readings under this node against the recommended option, both at the review' (viable-options.md lines 1051-1052), and this reading is not under that node — it is under `dialogue`, and the same account names it among the five readings that informed the recommended option, '`madr-decision-records`, whose considered options are kept beside the decision' (line 1044). The re-pointing is right; its warrant is misstated. Suggested edit: say it is one of the five readings that informed `passed-over-options-stay` and is re-pointed on the same occasion, as `pareto-frontier`'s second entry was.
- A finding about another node, proposed and not made here: this draft falsifies a sentence of `commons.systems/disposition-graph/dialogue`'s own recommended text, inside the `## Recommendation` fence's `## Rationale` at dialogue.md line 966 — 'The tradition closest to this encoding is read under this node as madr-decision-records, whose bears entries mark it adopted and whose one divergence is that the status is derived here where that tradition stores it.' The draft records two divergences, and holds that nothing called a status is derived, the class being what is derived. Since dialogue is the node this reading sits under and the one the author would ratify partly on its strength, the amendment belongs there and the session should propose it: a clause saying the reading marks the form adopted and records two divergences, the class derived where the tradition stores a status on the record, and supersession, the tradition keeping the superseded record beside the new where this record amends the fact in place. Cited here because the drift is this draft's own making; the review proposes and never edits another node.
- Procedural, for the applying step, and checkable on the record: this is the first reading of a new answer and not the capped second. The amendment of 2026-09-05 moved `recommends` from `divergence-narrows` to `storage-and-supersession-diverge`, a different option, and `review-cost`'s answer says 'What the cap forbids is a third reading of the same answer'; that node's account section 'A defect in the cap's own instrument, 2026-09-05' records that `apply.mjs`'s counter 'should reset when the answer fact's `recommends` changes and not only on a kickback' and that its warning fires wrongly in exactly this case. So a re-reading remains available to this node, and the findings above that touch the recommended text can be taken as amendments rather than deferred to options on the fact; the warning, if it fires, is the defect that node names and not the cap.

On the facts and what they recommend: The answer fact recommends `storage-and-supersession-diverge` at high boldness and that option also stands, so no `## Recommendation` fence is present, which is right, and the two displaced options keep their places with `status: passed` and their reasons — the encoding this reading reads MADR onto, practised on itself. The review block still pins ea222b4d with a forward dated 2026-09-05, which the amendment of the same day moved past; that stale pin is what this reading replaces and is not a fault. The authority fact recommends delegated at high boldness where every sibling reading with an authority fact carries moderate (pareto-frontier, ibis-issue-based-information, rfc-pep-status-field, deprecation-not-deletion, event-sourcing-derived-view, all line 19), and the reason it gives for high names the stakes rather than the ground; persistence carries no fact and needs none, the node declaring no shim. Claims verified: `depends: viable-options` resolves and that node still carries a stage; all six `bears` entries resolve to options that exist; the author's words quoted in the rationale are exact against viable-options.md line 109; `node packages/disposition/validate.mjs disposition` reports ok at 141 nodes, so nothing here is a parse failure.

On the viability of the options: Three options on the answer fact and no two of them the same reading: `status-derived-from-stamp` rests on a stamp the record no longer writes, `divergence-narrows` records one divergence where the tradition gives two, and each is rightly marked passed with the reason that displaced it and rightly kept on the list. On the authority fact the three reserved options are the whole vocabulary and both delegated and deferred are live, the case against on the fact stating the choice fairly. I find no viable option missing on either fact: the two inaccuracies in the answer's mapping, MADR's rejected and its decision-maker fields, are amendments to the recommended option and not rival readings of the tradition, and the divergences they would add are relations on options rather than candidate answers to this node's question.

Strongest counter-argument (moderate): The reading is three drafts deep and has never once left the AI's memory. Each redrawing has fitted it better to the record — every considered option kept, the class derived, supersession named — and each was made by a reader with the same second-hand knowledge of the template as the writer, so what has improved is the fit and not the fidelity, and the single test that would catch a misreading, somebody opening MADR, has been run at none of the three. This reading found two of its mappings wrong (rejected, decision-makers) by reading the record rather than the source, which is evidence that the remaining errors are of the kind only the source would catch. The entries make the point structurally: after two rounds of findings every relation is still `adopted`, and the two divergences the answer now states are carried by no entry at all, so the projection dialogue's ratifier reads still shows a tradition agreeing with the encoding in every particular. Delegated on the authority fact makes that permanent at the moment it matters most, and the record's reply — that readings' own rule confers delegated on exactly this case, and that the author's words of 2026-09-04 name this tradition in terms — answers less than it seems, since those words invoke 'ADR style "alternatives considered" documentation', the one clause of MADR nobody disputes, while the work this reading does is in the clauses about the status and the immutability that the author has never spoken to.

The session's reply: Ten findings, all validated at their loci on the alignment thread, and all ten accepted. Nine take an amendment here; the ninth is a proposal to another node, made there as the reading asks.

The procedural finding is checked and right. The amendment of 2026-09-05 moved `recommends` from `divergence-narrows` to `storage-and-supersession-diverge`, so this is the first reading of that answer and not a capped second; `review-cost`'s answer forbids a third reading of the same answer, and the instrument's counter, which counts sections since the last kickback, is the defect that node's account of 2026-09-05 already records. The findings that touch the recommended text are therefore taken as amendments and not deferred to options.

The two divergences now have `bears` entries. `readings` requires the relation per option and `prose-argues-structure-records` sends what has a shape to the field that has it, so a divergence living only in prose showed dialogue's ratifier a tradition that agrees in every particular, which is what this fact's own case against warns of. The storage divergence bears diverged on `commons.systems/disposition-graph/authority`'s `authority-derived`, which is the option that decides how the class is held; supersession bears diverged on `commons.systems/disposition-graph/node`'s `four-form-draft`, whose text carries the sentence the answer cites, and the same sentence stands in that node's standing answer, so the divergence holds whichever way that node is ruled. The six adopted entries are unchanged.

The subsection on the option that stands is deleted. `stands` is `storage-and-supersession-diverge` and there is no fence, so its text is `## Answer`; dialogue's `every-part-in-the-record`, which this reading bears adopted on, gives the standing option no subsection, and the siblings under this node follow it. Its one piece of content the answer did not carry, that the reading of 2026-09-05 raised it, is in `source` and `ref` already. The validator tolerates the duplicate, filtering the standing option from both sides of its check, so nothing but the doctrine catches it.

The account's first paragraph is corrected. It still carried `Facts: delegated`, `boldness high` and `Persistence: standing` in the conventions `prose-argues-structure-records` liquidates, with no persistence fact for the last to report, and an open item the tenth finding of 2026-09-05 recorded as met. The ninth finding of that reading asked for this in terms and the session's reply claimed all ten taken; the paragraph was not touched. It now says only what it alone says.

Four corrections to the reading itself. MADR's `rejected` and `deprecated` are statuses of the record, so of the fact, and a refused recommendation here leaves no stored mark at all, only the author's words in the kickback; `status: passed` goes back to the pros-and-cons mapping where the same sentence had already placed it, and is no longer made to carry two of MADR's parts. `decision-makers`, `consulted` and `informed` are mapped where they belong, onto the ruling with the recommendation it answered, onto the readings that bear on the option, and onto nothing; `source` answers to none of them, because it names who put the candidate on the table, as viable-options says in as many words. The claim that the author declines to review this reading is struck: readings distinguishes declining, which confers delegated, from accepting for now and queueing the source, which confers deferred, and the author has done neither, this node carrying no `## Disposition` and the record no words of theirs about the template. What is recommended is delegated for a reading the author has not been asked to rule on, which is the AI's judgment of what they intend, and that is the ground the high boldness rests on; the earlier ground named the stakes and not the ground, which is not what boldness measures here. The census claim, "as every reading on the record recommends", is false: `srs-introduction` is a reading whose authority fact recommends deferred. The rule is named in its place, and whether the same house formula is wrong on the other readings that carry it verbatim is the survey's to say.

The pointer to a deferred option "the account asks for" is repointed: the phrase it named survives only inside the quotation of the 2026-09-03 reading, and the sentence now cites that reading and the case against on the fact. The re-pointing warrant in the rationale is corrected too: this reading is not under `viable-options` and was not covered by that node's re-reading of the six readings under it; it is one of the five that node's account names as having informed `passed-over-options-stay`, and it is re-pointed on the same occasion, as `pareto-frontier`'s second entry was.

The proposal to another node is made. `commons.systems/disposition-graph/dialogue`'s recommended text said this reading records one divergence, the status derived where the tradition stores it; the draft records two and holds that nothing called a status is derived, the class being what is derived. The drift is this draft's own making and the sentence is a plain citation of it, so it is corrected there rather than recorded as an option, and the correction is disclosed in that node's account with the pin left where the reading of its own draft set it.

Amending `## Answer` moves this fact's pin, since the recommended option is the one that stands and its text is the answer. It is not re-settled: the frontier should show the recommendation as moved since the reading, and whether an amendment written in answer to a reading should re-settle the pin is the open option `pin-names-the-text-the-reader-read` on `commons.systems/disposition-graph/review-cost`.

### Amended after the second reading, 2026-09-05

Ten findings, all validated at their loci on the alignment thread and all ten
accepted; the review block records the reading against graph commit 76507300.
The procedural finding is right and was checked: the amendment of 2026-09-05
moved the recommendation to `storage-and-supersession-diverge`, so this is the
first reading of that answer, and the instrument's two-round warning, which
counts sections since the last kickback rather than readings of one answer, is
the defect recorded on `commons.systems/disposition-graph/review-cost`.

The two divergences are now `bears` entries and not prose alone: diverged on
`authority`'s `authority-derived` for what is stored, and on `node`'s
`four-form-draft` for supersession, whose sentence stands in that node's
standing answer too, so the divergence holds whichever way it is ruled. The
subsection on the option that stands is deleted, the answer being its text; the
validator filters the standing option from both sides of its check, so only the
doctrine catches the duplicate. The account's first paragraph is corrected: it
carried the `Facts:` and `Persistence:` conventions the record has liquidated,
a persistence fact this node does not have, and an open item the tenth finding
of 2026-09-05 recorded as met, all of which the ninth finding of that reading
asked for and the reply claimed to have taken.

Four corrections to the reading. MADR's rejected and deprecated are statuses of
the record, so of the fact, and a refused recommendation leaves no stored mark
here at all; `status: passed` returns to the pros-and-cons mapping and no
longer carries two of MADR's parts. Decision-makers, consulted and informed map
onto the ruling with the recommendation it answers, onto the readings that bear
on the option, and onto nothing, and `source` answers to none of them. The
claim that the author declines to review is struck: readings separates
declining, which confers delegated, from accepting for now and queueing the
source, which confers deferred, and the author has done neither. And the census
"as every reading on the record recommends" is false, `srs-introduction`
recommending deferred; the rule is named in its place, and whether the same
house formula is wrong on the other readings that carry it verbatim is the
survey's to say.

The high boldness now names its ground rather than its stakes: what the class
rests on is the AI's judgment of what the author intends by not having been
asked. The rationale's re-pointing warrant is corrected — this reading is not
under viable-options and was not in the re-reading that node's account owes; it
is one of the five that account names as having informed
`passed-over-options-stay`.

The proposal to another node is made rather than recorded as an option:
`dialogue`'s recommended text cited this reading for one divergence and a
derived status, which this draft's own amendment falsified, so the citation is
corrected there and disclosed in that node's account.

Amending `## Answer` moves this fact's pin, the recommended option being the one
that stands. It is not re-settled, for the reason the open option
`pin-names-the-text-the-reader-read` on `review-cost` states.

### Frontier survey, 2026-09-05

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- The `## Account` of this node carries the formula "as every reading on the record recommends", and the live `### authority` prose no longer does: the node has already corrected its own text and its correction refers the general question to this survey. That is context for the cross-node `contradiction` finding naming forty-six nodes, and not a defect on this node.

Strongest counter-argument (strong): The reading is the record's only examination of the tradition behind its central encoding, and it is drawn from the AI's memory of a template no one here has read; two divergences recorded from memory may be two misreadings. Worse, a tradition the encoding was drawn from on purpose will always read as adopted, so the relation proves less than it appears to. Boldness `high` is recorded and the authority fact recommends `delegated`, which means the record's justification for its own encoding is one unread source, read once, by the party whose encoding it justifies, with nothing scheduled to put it in front of the author.

The session's reply: Taken. The record's only examination of the tradition behind its central encoding is drawn from the AI's memory of a template no one here has read, the relation is adopted for a tradition the encoding was drawn from, and nothing puts it in front of the author. The session does not treat that as a defect in this node's text — the node has already corrected its own census and refers the general question here — but as the strongest case on the record for a reading whose source someone reads. That is recorded as owed against this reading and not resolved by the survey.

### Frontier finding, 2026-09-05

Kind: contradiction.

Forty-six reading nodes carry, verbatim, as the first sentence of the `### authority` subsection inside `## Facts`, the claim: "Delegated, as every reading on the record recommends, because the relation is the AI's from its own knowledge of the source and the author has not read it here." The claim is false at this commit. Measured on the graph: 59 nodes carry `form: reading`; 57 recommend `delegated` on the authority fact; `commons.systems/disposition-graph/srs-introduction` recommends `deferred` (disposition/disposition-graph/srs-introduction.md, `### authority`); and `commons.systems/disposition-graph/npm-committed-lockfile` carries an authority fact with its three options and no `recommends` at all (disposition/disposition-graph/npm-committed-lockfile.md, `### authority`). `commons.systems/disposition-graph/readings` carries a variant of the same claim in its authority fact's `against`, at lines 47 and 155: "every reading on the record recommends delegated for itself". The defect is not only that the count is wrong today. A standing answer that asserts a census of the record goes stale the moment a reading is minted, which is exactly what `commons.systems/disposition-graph/authority` records as the option `no-census-in-a-standing-answer` and what the `codd-update-anomaly` reading names — and `codd-update-anomaly` is itself one of the forty-six carrying it. Two nodes have already corrected their live text and carry the formula only in their `## Account`: `madr-decision-records` (line 184) and `progressive-disclosure` (lines 135 and 162); `madr-decision-records`'s corrected text refers the general question to this survey by name. Those two are named here as context and are not defects.

Also named: commons.systems/disposition-graph/anchoring-and-adjustment, commons.systems/disposition-graph/appellate-review-en-banc, commons.systems/disposition-graph/approval-directed-agents, commons.systems/disposition-graph/bentham-publicity, commons.systems/disposition-graph/brooks-surgical-team, commons.systems/disposition-graph/change-reviewed-as-a-diff, commons.systems/disposition-graph/chenery-reasoned-decision, commons.systems/disposition-graph/chestertons-fence, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/deprecation-not-deletion, commons.systems/disposition-graph/dissent-and-reconsideration, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/event-sourcing-derived-view, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/file-drawer-and-pre-registration, commons.systems/disposition-graph/hansard-verbatim-record, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/legislative-amendment-in-context, commons.systems/disposition-graph/level-triggered-reconciliation, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/montgomery-informed-consent, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/nielsen-user-control-and-freedom, commons.systems/disposition-graph/none-of-the-above-ballot, commons.systems/disposition-graph/non-liquet, commons.systems/disposition-graph/notarial-minute, commons.systems/disposition-graph/not-proven-third-verdict, commons.systems/disposition-graph/n-version-programming, commons.systems/disposition-graph/ocap-attenuation, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/pareto-frontier, commons.systems/disposition-graph/peirce-paper-doubt, commons.systems/disposition-graph/promotor-fidei, commons.systems/disposition-graph/review-approval-pinned-to-a-revision, commons.systems/disposition-graph/rfc-pep-status-field, commons.systems/disposition-graph/roberts-rules-commit-or-refer, commons.systems/disposition-graph/scholarly-peer-review, commons.systems/disposition-graph/scholastic-articulus, commons.systems/disposition-graph/segregation-of-duties, commons.systems/disposition-graph/self-contained-specification, commons.systems/disposition-graph/single-subject-rule, commons.systems/disposition-graph/special-verdict-form, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand, commons.systems/disposition-graph/value-of-information, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/npm-committed-lockfile, commons.systems/disposition-graph/progressive-disclosure, commons.systems/disposition-graph/authority.

Proposed: Strike the census from all forty-six and from `readings`' `against`, replacing it with the rule rather than the count: the class recommended is delegated because the relation is the AI's from its own knowledge of the source and the author has not read it here — which is the reason, and which stands whatever other readings recommend. `madr-decision-records` and `progressive-disclosure` have already made this correction in their live text and are the model. Where a node wants to say that this is the record's settled practice for readings, it cites `commons.systems/disposition-graph/class-recommendation` rather than counting. `srs-introduction`'s `deferred` and `npm-committed-lockfile`'s absent recommendation are left as they are: they are the two counterexamples, and the point of the fix is that a rule stated as a rule does not need them to disappear.

Recorded as an option on commons.systems/disposition-graph/authority's answer fact: `no-census-anywhere-in-a-node` (source review, 2026-09-05).

### Frontier survey, 2026-09-07, of 5d80f9d0

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict. It read the graph at graph commit `e4c87ed083180d8ddd57045a20a5df80704787a5`, which the record carries in no key until `dialogue`'s option `survey-pin-carries-its-commit` is ruled.

Findings:


Strongest counter-argument (weak): The reading's `bears` list gained an `adopted` entry on how-a-fact-is-headed's option `glosses-written-with-this-ruling`, and the argument for it is written on that node's account and not in this reading's answer, so a reader of this node meets a relation it does not argue. That widens the fact's own case against rather than answering it: the record's only examination of the tradition behind its central encoding is drawn from a template no one here has read, and it is now load-bearing on one more decision than when the case against was written.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/madr-decision-records stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `storage-and-supersession-diverge`; the `## Rationale` its `**AI support.**`; and `stands` left the answer fact. The content of `divergence-narrows (at 546fdbec)` was recovered from the commit at which the answer fact recommended it. The record wrote no text of its own for `status-derived-from-stamp`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `9c0f951e94dee8342bfeeb9b8b99f7b81f2b127f` was already past the recommendation and is left as it stood. The survey's pin `5d80f9d0b0e57e6f006ecee3d51f568437f00e34` was already past the recommendation and is left as it stood.

### Frontier survey, 2026-09-07, of 60be3584

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- Cross-reference (12) and staleness. Both of this node's readings are stale, its draft review and its survey each pinned to a recommendation the node has left, while it carries ten `bears` entries — the largest projection surface of any judged reading — into a derivation `readings` describes as "stated here and unchecked, unmet across the record at this commit". Ten unverified pointers behind a stale reading is the drift the twelfth validation exists to catch.
- Placement and order (13). It stands at the ruling stage under `commons.systems/disposition-graph/dialogue`, which the brief lists at "stage maieutic", and depends on `viable-options`, also maieutic, without saying so.

Strongest counter-argument (moderate): The recommendation is `storage-and-supersession-diverge` at high boldness with the authority fact recommending delegated, also high, so the reading asks for the class to be handed over on the judgment it is least confident in. Its two divergences are precisely where MADR's discipline bites — one record per decision, superseded records kept and marked — and this record instead accumulates options on one node and folds what it passes over, so a reader could hold that what is recorded as two local divergences is a rejection of the tradition's central practice, which the answer's "the record adopts its form with two divergences of its own" understates.

### Frontier finding, 2026-09-07

Kind: placement.

Five judged nodes stand at the ruling stage on ground still at the maieutic stage without saying so, which the thirteenth validation forbids: "no node at the ruling stage rests on ground still at the periagogic or maieutic stage without saying so". `tolerated-inconsistency` and `verifying-traces-and-early-cutoff` each bear on `commons.systems/disposition-graph/dialogue#answer#the-survey-block-carries-what-the-next-survey-selects-on (adopted)`; `unconfirmed-accumulation` depends on `commons.systems/disposition-graph/dialogue#an-option-carries-its-content-its-words-and-its-case`; `event-sourcing-with-snapshots` stands under `unconfirmed-accumulation` which does; and `madr-decision-records` stands under `dialogue` and depends on `viable-options`. The brief lists the ground as "commons.systems/disposition-graph/dialogue | unanswered | stage maieutic | rank 0.0017 | settles 31". The author would rule five nodes whose ground has no drafted answer.

Also named: commons.systems/disposition-graph/tolerated-inconsistency, commons.systems/disposition-graph/verifying-traces-and-early-cutoff, commons.systems/disposition-graph/event-sourcing-with-snapshots, commons.systems/disposition-graph/unconfirmed-accumulation, commons.systems/disposition-graph/dialogue, commons.systems/disposition-graph/viable-options.

Proposed: No merge and no survivor: the placement is corrected by the record saying so. Either `dialogue` is advanced to the ruling stage before the five are put to the author, or each of the five states in its answer that it rests on a `dialogue` option still at the maieutic stage and what it would lose if that option moves. The ruling order is derived from the placement, as `alignment-order` requires, and is not recommended here in prose.
