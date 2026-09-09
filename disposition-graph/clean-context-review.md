---
question: How is the clean-context review run?
stage: maieutic
review:
  verdict: forward
  strength: none
  date: 2026-09-07
  of: e2a45f86e02e587699b715e7bd116ab1f0280c83
  commit: 6d6704413cb6eda7d56e31ba632fd359e148af77
  survey:
    date: 2026-09-07
    of: e2a45f86e02e587699b715e7bd116ab1f0280c83
    commit: edc5af91d942319c12174309e388a244de61fa52
    text:
      question: "391cfe8148687d475a1c1636f26c08285ce0c341246dcdebc81f794833ce1f29"
      answer: "6ff60bcf5373592940c0edbe304da9c00da35fe53b654f75ceb17917a60fa550"
      options: "c30d65c29089a9db7050f67f628229f4e3dfb20e9c89c579fcba05d289285e12"
      rivals: "0a60fc16e0198f6b13566f5714f357b76e2782416cd2a04cb5bc0a5bf908cf94"
      words: "7404071396203f2a78f1316dbf83837099759ff7b78bc29877430fb5df6ef2fa"
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
          - "commons.systems/disposition-graph/clean-context-review"
          - "commons.systems/disposition-graph/frontier-consistency"
          - "commons.systems/disposition-graph/decomposition"
          - "commons.systems/disposition-graph/delegation"
          - "commons.systems/disposition-graph/review-skills"
    pairs:
      - with: "commons.systems/disposition-graph/acceptance-sampling-and-all-or-none"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/alignment-order"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "cites"
      - with: "commons.systems/disposition-graph/alignment-page"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/alignment-target"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/anchoring-and-adjustment"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/aristotle-hexis"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/assumption-form"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/attention"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/audience"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/author-questions"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:probe (defines: commons.systems/disposition-graph/author-questions)"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/authority"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/authors-words-on-the-page"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/blocking-and-canopies"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/bootstrap-exit-conditions"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/capture"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/capture-traditions"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/checkpoint"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/class-recommendation"
        keys:
          - "term:capture-shaped (defines: commons.systems/disposition-graph/class-recommendation)"
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/decomposition"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "words:words/2026-09-04/23"
          - "words:words/2026-09-07/5"
          - "words:words/2026-09-07/6"
          - "words:words/2026-09-07/7"
          - "words:words/2026-09-07/8"
          - "cites"
          - "depends"
      - with: "commons.systems/disposition-graph/delegation"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:main thread (defines: commons.systems/disposition-graph/delegation)"
          - "term:subagent (defines: commons.systems/disposition-graph/delegation)"
          - "term:unit (defines: commons.systems/disposition-graph/delegation)"
      - with: "commons.systems/disposition-graph/delegation-bounds-and-sizing"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/dialogue"
        keys:
          - "term:account (defines: commons.systems/disposition-graph/dialogue)"
          - "term:alternative (defines: commons.systems/disposition-graph/dialogue)"
          - "term:answer (defines: commons.systems/disposition-graph/dialogue)"
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:dialogue (defines: commons.systems/disposition-graph/dialogue)"
          - "term:draft (defines: commons.systems/disposition-graph/dialogue)"
          - "term:fact (defines: commons.systems/disposition-graph/dialogue)"
          - "term:keep (defines: commons.systems/disposition-graph/dialogue)"
          - "term:persistence (defines: commons.systems/disposition-graph/dialogue)"
          - "term:recommendation (defines: commons.systems/disposition-graph/dialogue)"
          - "term:ruling (defines: commons.systems/disposition-graph/dialogue)"
          - "term:stage (defines: commons.systems/disposition-graph/dialogue)"
          - "term:standing answer (defines: commons.systems/disposition-graph/dialogue)"
          - "words:words/2026-09-03/34"
          - "cites"
          - "depends"
      - with: "commons.systems/disposition-graph/evaluation"
        keys:
          - "term:adversarial review (defines: commons.systems/disposition-graph/evaluation)"
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "cites"
      - with: "commons.systems/disposition-graph/event-sourcing-with-snapshots"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/fagan-entry-criteria"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/fidelity"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "cites"
      - with: "commons.systems/disposition-graph/forms"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/frontier-consistency"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:frontier survey (defines: commons.systems/disposition-graph/frontier-consistency)"
          - "words:words/2026-09-03/34"
          - "words:words/2026-09-04/23"
          - "words:words/2026-09-07/5"
          - "words:words/2026-09-07/6"
          - "words:words/2026-09-07/7"
          - "words:words/2026-09-07/8"
          - "words:words/2026-09-07/9"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/graph-topology"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/growth"
        keys:
          - "term:boldness (defines: commons.systems/disposition-graph/growth)"
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:maieutic (defines: commons.systems/disposition-graph/growth)"
          - "term:periagogic (defines: commons.systems/disposition-graph/growth)"
      - with: "commons.systems/disposition-graph/hexis"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/how-a-fact-is-headed"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/information-hiding"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/instruments"
        keys:
          - "term:check (defines: commons.systems/disposition-graph/instruments)"
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:instrument (defines: commons.systems/disposition-graph/instruments)"
      - with: "commons.systems/disposition-graph/knowledge-store"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/legacy"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/lint-and-the-false-positive-threshold"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/madr-decision-records"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/mapreduce-and-cross-shard-blindness"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/materialization"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:package (defines: commons.systems/disposition-graph/materialization)"
      - with: "commons.systems/disposition-graph/model"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:disposition (defines: commons.systems/disposition-graph/model)"
          - "term:node (defines: commons.systems/disposition-graph/model)"
      - with: "commons.systems/disposition-graph/namespaces"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:id (defines: commons.systems/disposition-graph/namespaces)"
      - with: "commons.systems/disposition-graph/node"
        keys:
          - "term:answer (defines: commons.systems/disposition-graph/node)"
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:form (defines: commons.systems/disposition-graph/node)"
          - "term:question (defines: commons.systems/disposition-graph/node)"
          - "term:rationale (defines: commons.systems/disposition-graph/node)"
      - with: "commons.systems/disposition-graph/notarial-minute"
        keys:
          - "parent:commons.systems/disposition-graph/recording"
          - "cites"
      - with: "commons.systems/disposition-graph/peirce-paper-doubt"
        keys:
          - "parent:commons.systems/disposition-graph/recording"
          - "cites"
      - with: "commons.systems/disposition-graph/persistence"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/plato-maieutics"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/plato-periagoge"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/probe-or-node"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/progressive-disclosure"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/projection"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:projection (defines: commons.systems/disposition-graph/projection)"
      - with: "commons.systems/disposition-graph/promotor-fidei"
        keys:
          - "parent:commons.systems/disposition-graph/recording"
          - "cites"
      - with: "commons.systems/disposition-graph/prose-and-structure"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/purpose"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/purpose-criteria"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/quotes"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:ledger (defines: commons.systems/disposition-graph/quotes)"
      - with: "commons.systems/disposition-graph/rationale-edge"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/readings"
        keys:
          - "term:adopted (defines: commons.systems/disposition-graph/readings)"
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:reading (defines: commons.systems/disposition-graph/readings)"
      - with: "commons.systems/disposition-graph/recording"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:confirmation (defines: commons.systems/disposition-graph/recording)"
          - "term:kickback (defines: commons.systems/disposition-graph/recording)"
          - "term:substance (defines: commons.systems/disposition-graph/recording)"
          - "words:words/2026-09-04/23"
          - "cites"
          - "depends"
      - with: "commons.systems/disposition-graph/regression-test-selection"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/rejected"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/review"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:review (defines: commons.systems/disposition-graph/review)"
      - with: "commons.systems/disposition-graph/review-cost"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:neighbourhood (defines: commons.systems/disposition-graph/review-cost)"
          - "words:words/2026-09-07/5"
          - "words:words/2026-09-07/6"
          - "words:words/2026-09-07/7"
          - "words:words/2026-09-07/8"
          - "words:words/2026-09-07/9"
          - "cites"
          - "depends"
      - with: "commons.systems/disposition-graph/review-model"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "words:words/2026-09-07/5"
          - "words:words/2026-09-07/6"
          - "words:words/2026-09-07/7"
          - "words:words/2026-09-07/8"
          - "cites"
          - "depends"
      - with: "commons.systems/disposition-graph/review-skills"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "cites"
          - "depends"
      - with: "commons.systems/disposition-graph/scholastic-articulus"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/scope"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:order (defines: commons.systems/disposition-graph/scope)"
          - "term:section (defines: commons.systems/disposition-graph/scope)"
      - with: "commons.systems/disposition-graph/second-stop"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/self-documentation"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/session-context"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:rules (defines: commons.systems/disposition-graph/session-context)"
      - with: "commons.systems/disposition-graph/software-factories"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/spec-driven-development"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/srs-introduction"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/survey-selection"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:frozen set (defines: commons.systems/disposition-graph/survey-selection)"
          - "term:judged set (defines: commons.systems/disposition-graph/survey-selection)"
          - "words:words/2026-09-07/9"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/tier"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/tolerated-inconsistency"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/traditions-home"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/transience"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:persistence (defines: commons.systems/disposition-graph/transience)"
          - "term:shim (defines: commons.systems/disposition-graph/transience)"
          - "term:standing (defines: commons.systems/disposition-graph/transience)"
          - "cites"
      - with: "commons.systems/disposition-graph/turn-form"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/un-aligned-children"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/unanswered"
        keys:
          - "term:answered (defines: commons.systems/disposition-graph/unanswered)"
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:unanswered (defines: commons.systems/disposition-graph/unanswered)"
      - with: "commons.systems/disposition-graph/unconfirmed-accumulation"
        keys:
          - "term:accumulation (defines: commons.systems/disposition-graph/unconfirmed-accumulation)"
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/under"
        keys:
          - "term:context (defines: commons.systems/disposition-graph/under)"
          - "term:under (defines: commons.systems/disposition-graph/under)"
          - "cites"
      - with: "commons.systems/disposition-graph/unit-skills"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/validation-order"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/verifying-traces-and-early-cutoff"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/viable-options"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:grant (defines: commons.systems/disposition-graph/viable-options)"
          - "term:option (defines: commons.systems/disposition-graph/viable-options)"
          - "term:viable (defines: commons.systems/disposition-graph/viable-options)"
      - with: "commons.systems/disposition-graph/vocabulary-option-summary"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/web-routing"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/what-acts-during-bootstrap"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/what-an-option-row-carries"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/when-the-kickback-feedback-shows"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/where-a-change-request-goes"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/where-the-unconfirmed-indication-goes"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/which-facts-are-listed"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/work-loop"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:frontier (defines: commons.systems/disposition-graph/work-loop)"
      - with: "commons.systems/public/agency"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/public/aristotle-arche-of-action"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/public/pettit-non-domination"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-03"
      - name: rerun-earlier-reviews
        source: ai
        ref: "2026-09-03"
      - name: per-draft-and-survey
        source: commons.systems/disposition-graph/decomposition
        ref: "2026-09-04"
      - name: forked-skill-as-the-reviewer
        source: ai
        ref: "29c11274"
        status: passed
        reason: "the harness's fork inherits the session's context"
      - name: review-applied-by-the-reviewer
        source: ai
        ref: "29c11274"
        status: passed
        reason: "the reviewer only recommends"
      - name: one-context-for-a-batch
        source: ai
        ref: "29c11274"
        status: passed
        reason: "framing leaks across the drafts read in one context, a finding on one into the next; the survey keeps one context for the frontier's own object"
      - name: committed-record-only-per-draft
        source: ai
        ref: "29c11274"
        status: passed
        reason: "it hides the contradictions a sitting creates"
      - name: sibling-set-named-by-the-session
        source: ai
        ref: "29c11274"
        status: passed
        reason: "it is chosen by the party whose blind spots the review exists to catch"
      - name: fixed-model-for-every-review
        source: ai
        ref: "29c11274"
        status: passed
        reason: "dominated by the citation of the review-model node, which the answer fact makes for the model since 2026-09-04"
      - name: lock-at-launch
        source: ai
        ref: "29c11274"
        status: passed
        reason: "it is advisory, per checkout, and unneeded once the pin serializes"
      - name: moved-draft-re-read-by-the-survey
        source: ai
        ref: "2026-09-04"
        status: passed
        reason: "the judgment whether a move is substance is the reviewed party's, and the pin decides; the conflict is recorded on the recording node"
      - name: neighbourhood-by-topology-only
        source: review
        ref: "2026-09-04"
        status: passed
        reason: "it loses the round's drafts, which the second reading of 2026-09-03 won and this node's first draft of 2026-09-04 had standing in for them"
      - name: complex-drafts-only
        source: review
        ref: "2026-09-04"
      - name: pointers-for-what-grows-with-the-record
        source: commons.systems/disposition-graph/review-cost
        ref: "2026-09-05"
      - name: state-what-does-not-move-and-cite-review-cost
        source: review
        ref: "2026-09-05"
      - name: counter-argument-per-fact
        source: commons.systems/disposition-graph/what-an-option-row-carries
        ref: "2026-09-06"
      - name: one-reading-for-a-wave-written-together
        source: ai
        ref: "2026-09-07"
      - name: wave-membership-derived-from-the-record
        source: review
        ref: "2026-09-07"
      - name: identical-prefix-across-a-waves-briefs
        source: review
        ref: "2026-09-07"
      - name: the-unreached-line-is-conditioned-by-frontier-consistency
        source: commons.systems/disposition-graph/frontier-consistency
        ref: "2026-09-07"
      - name: a-surveys-selection-and-its-state-are-the-selection-nodes
        source: commons.systems/disposition-graph/survey-selection
        ref: "2026-09-07"
        supports:
          - words/2026-09-03/31
          - words/2026-09-03/32
          - words/2026-09-03/33
          - words/2026-09-03/34
          - words/2026-09-04/23
          - words/2026-09-07/5
          - words/2026-09-07/6
          - words/2026-09-07/7
          - words/2026-09-07/8
          - words/2026-09-07/9
      - name: the-unreached-line-is-cited-from-survey-selection
        source: review
        ref: "2026-09-07"
      - name: the-review-is-struck-as-superseded-by-the-expert-system
        source: author
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/37
      - name: the-independent-reading-is-constituted-and-sequenced-after-the-experts
        source: ai
        ref: "2026-09-08"
      - name: independence-by-model-diversity-and-one-whole-object-per-reader
        source: ai
        ref: "2026-09-08"
    recommends: a-surveys-selection-and-its-state-are-the-selection-nodes
    boldness: high
    against: "The wave buys bytes and spends attention, and attention is the quantity this subtree has already said is the scarce one. `review-cost` now recommends that \"Token efficiency and context management are bounds on what a reading is given; attention is what the reading does with it, and it is not the same quantity\", and a wave halves the bytes while quartering what any one object gets of the reader: the brief is fifty-six percent smaller, but each of the four drafts is now judged by a reader holding three other drafts, three other neighbourhoods of options, and three other verdicts it must also write. Deriving the wave's membership and bounding its brief settle who is in it and how large it may be, and neither touches that: on the record's own accounting a wave is a rise in cost per unit of attention and not a fall, and it is invisible to the measurement the case is built on, which counts only bytes. The deeper objection is that the saving and the loss fall on different parties: the bytes are the record's, the independence is the author's, and the author is the one the review exists to protect. And the loss is hedged only by the survey, which this node's own rationale still records as one \"no sitting has yet generated\" and which runs for the first time in the sitting that recommends the wave."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
  - name: persistence
    options:
      - name: shim kept
      - name: shim superseded by review-skills
    recommends: shim superseded by review-skills
    boldness: low
defines:
  - clean-context review
depends:
  - commons.systems/disposition-graph/frontier-consistency#one-line-only-where-the-text-a-survey-read-still-stands
  - commons.systems/disposition-graph/survey-selection#candidate-pairs-with-their-nominating-key
form: rule
under:
  - commons.systems/disposition-graph/recording
instrument:
  kind: check
  ref: "`packages/clean-context-review/brief.mjs` writes the draft, delta and survey briefs from `brief-draft.md`, `brief-delta.md`, `brief-survey.md` and the fragments `brief-bounds.md` and `brief-record.md`; `apply.mjs` applies a reading's findings; the skills `align-review` and `align-survey` launch the readings"
  note: "the two skills are declared shims and are hand-written until the projector writes them"
---

## Facts

### answer

`a-surveys-selection-and-its-state-are-the-selection-nodes` is recommended since 2026-09-07: it is `wave-membership-derived-from-the-record` with three sentences amended, the survey judging the set `survey-selection` names, a whole reading on that node's cadence, and the apply writing the commit, the five section hashes and the finding register beside the pin. Its own support and divergence are under its subsection, and what follows is the reason the text it amends was recommended on, which the amendment carries except where it says otherwise.

Before the amendment the recommendation had moved from `pointers-for-what-grows-with-the-record` to `wave-membership-derived-from-the-record`, which is that text with one clause: where a sitting records or moves the recommendations of several nodes that share a neighbourhood, their readings are one reading, the shared neighbourhood carried once and each node whole, with a verdict, findings, a facts check, a viability judgment and a counter-argument returned for each. The wave's membership is derived from the record and never named by the session -- the nodes one checkpoint landed at one graph commit that stand at the review stage and share a parent or one amendment, computed by the generator and recorded with the reading -- and the wave splits whenever its brief exceeds what one reader holds whole, the bound being `review-cost`'s and cited rather than restated. The division of the review by its object is unchanged, the survey is unchanged, and the moment a draft is read is unchanged.

The measurement is the whole of the case. On 2026-09-07 the four children of the alignment page were drafted in one wave and read one at a time, on briefs totalling 1,359,346 bytes, of which the parts common to all four -- the ancestry, the rules of the reading, the siblings under the same parent, the index, the round, and the reader's own contract -- run between 249,607 and 256,936 bytes, differing between them only by which of the four each brief excludes from its round and its siblings. Seventy-five percent of what the record paid for those four readings was the same bytes read four times. One brief for the wave carries their union once and the four objects once, about 598,240 bytes, fifty-six percent less than the four. That figure is a projection and not an observation: no generator writes a wave brief, and the one wave the record has run, later the same day, was one reader over four separately generated briefs, which realized none of the saving and incurred the whole of the loss. The same clause covers the second shape the author's words reach, one amendment that lands on several nodes at once: today's sitting moved seven nodes on one disposition and owes seven readings of one amendment.

High boldness, on the scale where high means little rests on the record and the author's words, which on this record is low confidence and not confidence. What rests on the author is the instruction to find optimizations and to apply them; the wave is the AI's, its derivation is the reading's, and it stands beside a passed-over option whose recorded reason it must answer rather than repeat. The answer offered is that a batch is gathered by a stage field and shares nothing else, while a wave is drafts that already share a parent and a neighbourhood and that each of their separate readers is handed in any case as siblings and as the round -- so the framing a wave's reader carries across them is framing the record already gives every one of those readers. The derivation answers the half of `sibling-set-named-by-the-session`'s recorded reason that is about who chooses the set; the half that is about four objects sharing one reader it does not answer, and that half is the case against on this fact. The boldness stays high because the case for the wave is an argument and a projection and not a measurement of any wave brief, none having been written.

#### standing

As a skill of its own, `/align-review`, and every invocation of it is one batch: the nodes at the review stage, evaluated against the full graph, answered and unanswered at every stage, read in one context, with nothing isolated by node.

**AI support.** The author, 2026-09-03: "alignment adversarial review is materialized as a skill. it can be invoked as a clean context subskill when the scope of an alignment dialogue progresses to review, or it can be invoked directly. When invoked by alignment dialogue the review scope is limited to the scope of the alignment dialogue (whatever nodes are discussed as part of the dialogue). When invoked directly it executes adversarial review for all unanswered nodes queued for review. Either way, the context for each node review is isolated using subskills." One skill for both invocations keeps one brief, one output shape, and one applying step, so that a review run by a sitting and a review run over the queue are the same review. Scope follows the invoker because the review judges a draft against the record it joins: the sitting knows which nodes it discussed, and the queue is what the stage field already lists. A context per node is the independence the recording node argues for, carried one step further: a reviewer that has read twenty drafts and their reviews reads the twenty-first with that batch's framing, and a finding on one node leaks into the next; the price is that each reviewer reads the global rules and the ancestry for itself, which is the cost of a fresh reading, paid in tokens and not in the author's attention. The reviewer sees the round's other drafts because the first review of this node showed that the findings that mattered on 2026-09-03 cited sibling drafts by name, and no reader of a single draft could have made them; isolating the framing and isolating the record are two different things. That set is derived from version control rather than named by the session because the second review of this node showed that a session which has stopped seeing a node will not name it, and an input set chosen by the party under review leaves no trace of the omission; the nodes at the review stage and the changed files of the round are what the sitting wrote, whoever remembers them, and the ids recorded in the review's state let anyone reconstruct what the reviewer was given. The reviewer writes nothing because authority attenuates and nothing writes up. The two review batches of 2026-09-03, twenty-seven items in the morning and twenty-four in the afternoon, ran in one context each before this skill existed, each free of the session's framing and each shared across its batch; their verdicts stand as the reviews of that day, the author may re-run them by invoking the skill, and the divergence is recorded here. Amended the same day on the recording node: the reviews of a round are invoked together, each runs in its own context, and the reviewer's world includes the round's other drafts.

The author, later on 2026-09-03: "This superceded existing unanswered dispositions about the adversarial review skill (case in point). EVERY invocation of the adversarial alignment review skill is a batch operation that evaluates the full unanswered frontier (without isolating any context by disposition)." The per-node isolation the morning's words asked for, and the sibling drafts the second reading added to it, were the answer to a narrower question, how one draft is judged; the author's later words ask how the frontier is kept consistent, and a reading of one node, however many siblings it is handed, cannot see drift between nodes it was not handed. The clean context stays, since the independence the recording node argues for is of framing; the isolation by node goes, since the object of the review is now the frontier. The case in point is this node: its answer of the morning stood at the review stage, twice read and twice forwarded, while the frontier it belonged to drifted from it. Divergence, recorded: the two readings of this node on 2026-09-03 ran under the superseded answer, each in a context of its own, and their subsections below are kept as the record of that; the batches of the same day, read in one context each before the skill existed, turn out to have had the shape the author's later words prescribe, though without the survey.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is the clean-context review run?
defines:
  - clean-context review
form: rule
under:
  - commons.systems/disposition-graph/recording
---

## Answer

As a skill of its own, `/align-review`, and every invocation of it is one batch: the nodes at the review stage, evaluated against the full graph, answered and unanswered at every stage, read in one context, with nothing isolated by node. The alignment sitting invokes it when its dialogue reaches the review stage, and the author or a session invokes it directly; the scope is the same either way, the batch as the record holds it at that moment, the sitting's drafts among the rest, and the whole graph as the context each is judged against. The skill writes one brief and starts one fresh subagent with nothing but that brief, the record it points to, and the validations the frontier-consistency node lists: the subagent reads every node of the batch, then the full graph, the rest of the unanswered frontier at every stage and the answered nodes up to the roots, the rules that bind everywhere, the manifest, and the author's words on each, and returns as data, writing nothing to the record, a verdict for each node of the batch, its findings, its counter-argument with its strength, its check of the three facts, and the frontier's findings, each naming the nodes and the sentences and recommending the stage to kick back to, with the edit or the merge or split it proposes. A context that forked the invoking session would carry the session's framing and is not clean: what is isolated is the framing, never the record, and the frontier is read whole because the drift the review exists to catch is between its nodes. A finding may name a node outside the batch, at any stage, and it is applied to that node as the kickback flow says; only the batch receives verdicts. The session that invoked the skill validates every finding against the record before any is applied, on its own thread and never delegated, as the author ruled on 2026-09-03, and applies what it has validated on its own, as the recording node says: a forward sets the ruling stage and the review's state, verdict, strength, date, and the hash of the recommended text reviewed, and appends the findings, the facts check, the counter-argument, and the session's reply to the account; a kickback sets the stage the reviewer named and appends the same; a frontier finding is a kickback of each node it names, with the finding and the proposed edit appended to each, as the frontier-consistency node says. The applying of what the session has validated is mechanical and scripted; the validation, the reply, and what is proposed to the author from a merge or a split are the session's judgment. A recommendation changed in substance after its review is set back to the review stage by the session that changed it, and the frontier flags a review whose text has changed since, as it flags a recommendation whose standing text has changed since it was drafted. One batch runs at a time: an invocation waits for any review already running. Invoked directly, the skill then validates, lands the nodes it changed, and republishes the alignment page; invoked by a sitting, the sitting lands with its own round. The batch scope is the author's refinement of 2026-09-03, quoted above, which narrows the earlier words that every invocation evaluates the full unanswered frontier: the frontier is still read whole, as the context, and the nodes at the review stage are what is judged; a node at the periagogic or maieutic stage has no recommendation to judge, and a node at the ruling stage has been judged.
```

#### rerun-earlier-reviews

The account holds open, as wholly the AI's, that the two review batches of 2026-09-03 stand as the reviews of that day rather than being re-run under this answer. The alternative is that they do not stand: every node whose only review was read in one of those batches goes back through the skill before the author rules on it. The author may take it simply by invoking the review, which the node itself says.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is the clean-context review run?
defines:
  - clean-context review
form: rule
under:
  - commons.systems/disposition-graph/recording
---

## Answer

The account holds open, as wholly the AI's, that the two review batches of 2026-09-03 stand as the reviews of that day rather than being re-run under this answer. The alternative is that they do not stand: every node whose only review was read in one of those batches goes back through the skill before the author rules on it. The author may take it simply by invoking the review, which the node itself says.
```

#### per-draft-and-survey

The review divides by its object, and that division is the whole of what this option decides. The review of one draft runs in clean context the moment the draft's recommendation is recorded, and its forward is what puts the node at the ruling stage; the survey runs over the whole graph before the author rules, keeping the batch shape the author's words of 2026-09-03 give it, the record read in one context without its accounts. Two moments, two objects, and the survey's pin in place of a lock: a finding on a node whose recommendation moved after the survey read it is discarded at apply, and two reviews of drafts never wait on each other. Which validations belong to which reading is the frontier-consistency node's; what a reader is given, and what each part costs, are stated where they are now decided; the reader's model is the review-model node's; and when a node is ready to rule is the recording node's. This option was drafted on 2026-09-04 carrying all four, and they are cited here rather than restated, so that a ruling for it rules the division and nothing else. Raised on commons.systems/disposition-graph/decomposition, from the author's words of 2026-09-04 recorded there; it takes the side of `split-survey-from-per-draft` on frontier-consistency, and it supersedes in part the author's words of 2026-09-03 that every invocation is one batch with nothing isolated by node, which stay whole for the survey.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is the clean-context review run?
defines:
  - clean-context review
form: rule
under:
  - commons.systems/disposition-graph/recording
---

## Answer

As a skill of its own, `/align-review`, and every invocation of it is one batch: the nodes at the review stage, evaluated against the full graph, answered and unanswered at every stage, read in one context, with nothing isolated by node. The alignment sitting invokes it when its dialogue reaches the review stage, and the author or a session invokes it directly; the scope is the same either way, the batch as the record holds it at that moment, the sitting's drafts among the rest, and the whole graph as the context each is judged against. The skill writes one brief and starts one fresh subagent with nothing but that brief, the record it points to, and the validations the frontier-consistency node lists: the subagent reads every node of the batch, then the full graph, the rest of the unanswered frontier at every stage and the answered nodes up to the roots, the rules that bind everywhere, the manifest, and the author's words on each, and returns as data, writing nothing to the record, a verdict for each node of the batch, its findings, its counter-argument with its strength, its check of the three facts, and the frontier's findings, each naming the nodes and the sentences and recommending the stage to kick back to, with the edit or the merge or split it proposes. A context that forked the invoking session would carry the session's framing and is not clean: what is isolated is the framing, never the record, and the frontier is read whole because the drift the review exists to catch is between its nodes. A finding may name a node outside the batch, at any stage, and it is applied to that node as the kickback flow says; only the batch receives verdicts. The session that invoked the skill validates every finding against the record before any is applied, on its own thread and never delegated, as the author ruled on 2026-09-03, and applies what it has validated on its own, as the recording node says: a forward sets the ruling stage and the review's state, verdict, strength, date, and the hash of the recommended text reviewed, and appends the findings, the facts check, the counter-argument, and the session's reply to the account; a kickback sets the stage the reviewer named and appends the same; a frontier finding is a kickback of each node it names, with the finding and the proposed edit appended to each, as the frontier-consistency node says. The applying of what the session has validated is mechanical and scripted; the validation, the reply, and what is proposed to the author from a merge or a split are the session's judgment. A recommendation changed in substance after its review is set back to the review stage by the session that changed it, and the frontier flags a review whose text has changed since, as it flags a recommendation whose standing text has changed since it was drafted. One batch runs at a time: an invocation waits for any review already running. Invoked directly, the skill then validates, lands the nodes it changed, and republishes the alignment page; invoked by a sitting, the sitting lands with its own round. The batch scope is the author's refinement of 2026-09-03, quoted above, which narrows the earlier words that every invocation evaluates the full unanswered frontier: the frontier is still read whole, as the context, and the nodes at the review stage are what is judged; a node at the periagogic or maieutic stage has no recommendation to judge, and a node at the ruling stage has been judged.
```

#### forked-skill-as-the-reviewer

The review runs as a forked skill rather than a fresh subagent. It was passed
over because the harness's fork inherits the session's context, which is the
framing the review exists to be free of.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is the clean-context review run?
defines:
  - clean-context review
form: rule
under:
  - commons.systems/disposition-graph/recording
---

## Answer

The review runs as a forked skill rather than a fresh subagent. It was passed
over because the harness's fork inherits the session's context, which is the
framing the review exists to be free of.
```

#### review-applied-by-the-reviewer

The reviewer applies its own findings to the record. It was passed over
because the reviewer only recommends: authority attenuates and nothing writes
up.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is the clean-context review run?
defines:
  - clean-context review
form: rule
under:
  - commons.systems/disposition-graph/recording
---

## Answer

The reviewer applies its own findings to the record. It was passed over
because the reviewer only recommends: authority attenuates and nothing writes
up.
```

#### one-context-for-a-batch

One reviewer reads a whole batch of drafts in a single context, which was the
practice until 2026-09-03. It was passed over for the review of a draft because
framing leaks across the drafts read in one context, a finding on one into the
next; the survey keeps one context, because its object is the frontier's
consistency with itself and drift between nodes is invisible to any reading of
one.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is the clean-context review run?
defines:
  - clean-context review
form: rule
under:
  - commons.systems/disposition-graph/recording
---

## Answer

One reviewer reads a whole batch of drafts in a single context, which was the
practice until 2026-09-03. It was passed over for the review of a draft because
framing leaks across the drafts read in one context, a finding on one into the
next; the survey keeps one context, because its object is the frontier's
consistency with itself and drift between nodes is invisible to any reading of
one.
```

#### committed-record-only-per-draft

The per-draft reader sees only the committed record, without the round's other
drafts. It was passed over because the first review of this node showed that
it hides the contradictions a sitting creates.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is the clean-context review run?
defines:
  - clean-context review
form: rule
under:
  - commons.systems/disposition-graph/recording
---

## Answer

The per-draft reader sees only the committed record, without the round's other
drafts. It was passed over because the first review of this node showed that
it hides the contradictions a sitting creates.
```

#### sibling-set-named-by-the-session

The session names which sibling drafts the reviewer is given. It was passed
over because that set is chosen by the party whose blind spots the review
exists to catch, and an omission leaves no trace.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is the clean-context review run?
defines:
  - clean-context review
form: rule
under:
  - commons.systems/disposition-graph/recording
---

## Answer

The session names which sibling drafts the reviewer is given. It was passed
over because that set is chosen by the party whose blind spots the review
exists to catch, and an omission leaves no trace.
```

#### fixed-model-for-every-review

Every review runs on one fixed model. It was passed over because that either
pays the most capable model on every simple draft or reviews a bold one in
name only. On 2026-09-04 the author's words put both readings on one model,
and the question of the reader's model became the review-model node's, where
its recommended option fable-for-both-readings is this option decided there;
on this fact it is dominated by the citation the answer makes of that node.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is the clean-context review run?
defines:
  - clean-context review
form: rule
under:
  - commons.systems/disposition-graph/recording
---

## Answer

Every review runs on one fixed model. It was passed over because that either
pays the most capable model on every simple draft or reviews a bold one in
name only. On 2026-09-04 the author's words put both readings on one model,
and the question of the reader's model became the review-model node's, where
its recommended option fable-for-both-readings is this option decided there;
on this fact it is dominated by the citation the answer makes of that node.
```

#### lock-at-launch

Concurrent reviews are serialized by a lock taken at launch. It was passed
over because the lock is advisory, per checkout, and unneeded once the
recommendation pin serializes.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is the clean-context review run?
defines:
  - clean-context review
form: rule
under:
  - commons.systems/disposition-graph/recording
---

## Answer

Concurrent reviews are serialized by a lock taken at launch. It was passed
over because the lock is advisory, per checkout, and unneeded once the
recommendation pin serializes.
```

#### moved-draft-re-read-by-the-survey

A draft whose recommendation moved after its review by an encoding migration and not by substance is not re-read by a second draft review: the survey, which judges every node whose recommendation moved since it last pinned it, is the second reading readiness requires, and the draft review is re-run only where the session judges the move substance and records that judgment on the node. On the table because two rules of the record conflict on this case. The dialogue node sends a changed recommendation through the review again only when the change is substance, while the recommended text here holds a node ready to rule only when both pins name the recommendation as it stands, so the migration of 2026-09-04, which moved prose lists of rejected candidates into options with the status passed on 34 nodes and touched no substance, moved the answer pin of every node it wrote, newly flagged 17 forwarded drafts as changed since their review, and owes each a re-reading under the second rule and none under the first. Recorded in reconciliation as a conflict found and not as a recommendation. Passed on 2026-09-04 after the reading of that day: the judgment whether a move is substance belongs to the party under review, and the recommended text lets the pin decide, so that a reading is owed on any move of the recommendation but the author's own edit at a confirmation; the conflict's locus is the recording node's confirmation, where the option is recorded.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is the clean-context review run?
defines:
  - clean-context review
form: rule
under:
  - commons.systems/disposition-graph/recording
---

## Answer

A draft whose recommendation moved after its review by an encoding migration and not by substance is not re-read by a second draft review: the survey, which judges every node whose recommendation moved since it last pinned it, is the second reading readiness requires, and the draft review is re-run only where the session judges the move substance and records that judgment on the node. On the table because two rules of the record conflict on this case. The dialogue node sends a changed recommendation through the review again only when the change is substance, while the recommended text here holds a node ready to rule only when both pins name the recommendation as it stands, so the migration of 2026-09-04, which moved prose lists of rejected candidates into options with the status passed on 34 nodes and touched no substance, moved the answer pin of every node it wrote, newly flagged 17 forwarded drafts as changed since their review, and owes each a re-reading under the second rule and none under the first. Recorded in reconciliation as a conflict found and not as a recommendation. Passed on 2026-09-04 after the reading of that day: the judgment whether a move is substance belongs to the party under review, and the recommended text lets the pin decide, so that a reading is owed on any move of the recommendation but the author's own edit at a confirmation; the conflict's locus is the recording node's confirmation, where the option is recorded.
```

#### neighbourhood-by-topology-only

The reader of a draft is given its ancestry, its siblings under the same parent, and the nodes it names, and the round's other drafts reach it only through the survey. This was the recommended text's own neighbourhood until the reading of 2026-09-04 found that the rationale attributed it to the second reading of 2026-09-03, whose remedy was the round's set derived from version control; siblings by `under` are topological and not a round, and the brief of that reading demonstrated the loss, review-model and review-skills reconciled together with this text at a1ddc6e6 and neither handed to the reader. Passed because it gives up what the second reading won: the round's drafts read together by nothing before the ruling but a survey that runs no counter-argument.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is the clean-context review run?
defines:
  - clean-context review
form: rule
under:
  - commons.systems/disposition-graph/recording
---

## Answer

The reader of a draft is given its ancestry, its siblings under the same parent, and the nodes it names, and the round's other drafts reach it only through the survey. This was the recommended text's own neighbourhood until the reading of 2026-09-04 found that the rationale attributed it to the second reading of 2026-09-03, whose remedy was the round's set derived from version control; siblings by `under` are topological and not a round, and the brief of that reading demonstrated the loss, review-model and review-skills reconciled together with this text at a1ddc6e6 and neither handed to the reader. Passed because it gives up what the second reading won: the round's drafts read together by nothing before the ruling but a survey that runs no counter-argument.
```

#### complex-drafts-only

The review of a draft runs only on the more complex recommendations, the author's words of 2026-09-04 on the decomposition node read literally: "pass the more complex recommendations to a fable subagent to review." Viable and not recommended: the review-model node reads those words as naming the model, which it settles for both readings, and a draft no one has read would reach the author unopposed, which the recording node forbids; what the words narrow, if anything, is the model and not whether a draft is read.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is the clean-context review run?
defines:
  - clean-context review
form: rule
under:
  - commons.systems/disposition-graph/recording
---

## Answer

The review of a draft runs only on the more complex recommendations, the author's words of 2026-09-04 on the decomposition node read literally: "pass the more complex recommendations to a fable subagent to review." Viable and not recommended: the review-model node reads those words as naming the model, which it settles for both readings, and a draft no one has read would reach the author unopposed, which the recording node forbids; what the words narrow, if anything, is the model and not whether a draft is read.
```

#### pointers-for-what-grows-with-the-record

The reader's neighbourhood is given whole and the two parts that grow with the record rather than with the draft are given as pointers: the index becomes each node's id, its question and the file it is in on one line, without its class, its stage, its standing answer or its options, and the round's other drafts become one line each, the id, the question and the recommendation the node now makes, marked as the round. The neighbourhood grows to match, taking in the nodes under the draft and the readings that bear on it, and the rules of the reading itself are carried in the brief rather than named as files for the reader to open, since a brief that tells its reader to open a node it could have carried has it read twice. A neighbour is carried by what it answers, its question, its standing answer, the answer it now recommends where those differ and the names of its options, and not by its whole file; the exception is an option whose source is the draft under review, which is carried in full because it is the draft's own text.

Raised on `commons.systems/disposition-graph/review-cost` from the measurement of this sitting's nineteen briefs, where the index ran to a mean of 2,775 lines, a median of eight times the node under review, identical in every brief. It answers the reason this node gives for the index, that a draft answering a question the record already asks should be caught at the draft, since the questions are what that check reads; it does not answer the reason this node gives for the round's drafts, that texts written together are read together, except by holding that a reader told which neighbour moved and to what will open the one that matters. What it costs is stated on the review-cost node. The option was recorded here with the note that it acted on nothing, and the note was wrong when it was written: the reconciliation of that morning had already acted, and this recommendation is the record catching up with the instrument that runs.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is the clean-context review run?
defines:
  - clean-context review
form: rule
under:
  - commons.systems/disposition-graph/recording
---

## Answer

As a skill of its own, `/align-review`, and every invocation of it is one batch: the nodes at the review stage, evaluated against the full graph, answered and unanswered at every stage, read in one context, with nothing isolated by node. The alignment sitting invokes it when its dialogue reaches the review stage, and the author or a session invokes it directly; the scope is the same either way, the batch as the record holds it at that moment, the sitting's drafts among the rest, and the whole graph as the context each is judged against. The skill writes one brief and starts one fresh subagent with nothing but that brief, the record it points to, and the validations the frontier-consistency node lists: the subagent reads every node of the batch, then the full graph, the rest of the unanswered frontier at every stage and the answered nodes up to the roots, the rules that bind everywhere, the manifest, and the author's words on each, and returns as data, writing nothing to the record, a verdict for each node of the batch, its findings, its counter-argument with its strength, its check of the three facts, and the frontier's findings, each naming the nodes and the sentences and recommending the stage to kick back to, with the edit or the merge or split it proposes. A context that forked the invoking session would carry the session's framing and is not clean: what is isolated is the framing, never the record, and the frontier is read whole because the drift the review exists to catch is between its nodes. A finding may name a node outside the batch, at any stage, and it is applied to that node as the kickback flow says; only the batch receives verdicts. The session that invoked the skill validates every finding against the record before any is applied, on its own thread and never delegated, as the author ruled on 2026-09-03, and applies what it has validated on its own, as the recording node says: a forward sets the ruling stage and the review's state, verdict, strength, date, and the hash of the recommended text reviewed, and appends the findings, the facts check, the counter-argument, and the session's reply to the account; a kickback sets the stage the reviewer named and appends the same; a frontier finding is a kickback of each node it names, with the finding and the proposed edit appended to each, as the frontier-consistency node says. The applying of what the session has validated is mechanical and scripted; the validation, the reply, and what is proposed to the author from a merge or a split are the session's judgment. A recommendation changed in substance after its review is set back to the review stage by the session that changed it, and the frontier flags a review whose text has changed since, as it flags a recommendation whose standing text has changed since it was drafted. One batch runs at a time: an invocation waits for any review already running. Invoked directly, the skill then validates, lands the nodes it changed, and republishes the alignment page; invoked by a sitting, the sitting lands with its own round. The batch scope is the author's refinement of 2026-09-03, quoted above, which narrows the earlier words that every invocation evaluates the full unanswered frontier: the frontier is still read whole, as the context, and the nodes at the review stage are what is judged; a node at the periagogic or maieutic stage has no recommendation to judge, and a node at the ruling stage has been judged.
```

#### state-what-does-not-move-and-cite-review-cost

This node states only what does not move, the object of each reading, the fresh
context that is never a fork, that the reader writes nothing to the record,
that a forward gates the ruling, and that the invoking session validates every
finding before applying, and cites `review-cost` for what a reader is given,
where the measurement that bounds it lives. The case for it is frequency, and
it is measured: two amendments in two days have each produced a fresh
divergence in the same sentence, a clause promising the author's words to a
reader that gets none and a source exception no generator implements, both
written here and both contradicted by the child that prices them. One rule in
two homes is `codd-update-anomaly`, diagnosed once already in this subtree, and
answering an anomaly's symptoms one at a time is what an anomaly does to a
record.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it: a rule assembled from citations is harder to obey than one
read whole, and the division of ownership this option draws puts the part a
reader most needs on the node that prices it rather than on the node that
defines the reading. Raised as the counter-argument of the readings of
2026-09-05, twice, and recorded on the fact at the second.

**Content.**

```markdown
---
question: How is the clean-context review run?
defines:
  - clean-context review
form: rule
under:
  - commons.systems/disposition-graph/recording
---

## Answer

This node states only what does not move, the object of each reading, the fresh
context that is never a fork, that the reader writes nothing to the record,
that a forward gates the ruling, and that the invoking session validates every
finding before applying, and cites `review-cost` for what a reader is given,
where the measurement that bounds it lives. The case for it is frequency, and
it is measured: two amendments in two days have each produced a fresh
divergence in the same sentence, a clause promising the author's words to a
reader that gets none and a source exception no generator implements, both
written here and both contradicted by the child that prices them. One rule in
two homes is `codd-update-anomaly`, diagnosed once already in this subtree, and
answering an anomaly's symptoms one at a time is what an anomaly does to a
record.
```

#### counter-argument-per-fact

Everything the recommended option says, with a reading asked to return one
counter-argument per fact rather than one for the node. Raised on
`what-an-option-row-carries`, 2026-09-06, and moved here because what a reading
returns is this node's shape and not the page's. Today a reading returns one
counter-argument, which `caseAgainst` in the projector substitutes on the answer
fact alone, so on every other fact of every node the row falls back to the AI's
own line; a page rule that says the reader writes the first-level objection is
therefore true of one row per node and false everywhere else.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it: a
reading asked for a line on every fact is a reading asked to argue where it may
have nothing to say, and the price is paid on every fact of every node in a
brief this node's own answer is trying to keep small.

**Content.**

```markdown
---
question: How is the clean-context review run?
defines:
  - clean-context review
form: rule
under:
  - commons.systems/disposition-graph/recording
---

## Answer

Everything the recommended option says, with a reading asked to return one
counter-argument per fact rather than one for the node. Raised on
`what-an-option-row-carries`, 2026-09-06, and moved here because what a reading
returns is this node's shape and not the page's. Today a reading returns one
counter-argument, which `caseAgainst` in the projector substitutes on the answer
fact alone, so on every other fact of every node the row falls back to the AI's
own line; a page rule that says the reader writes the first-level objection is
therefore true of one row per node and false everywhere else.
```

#### one-reading-for-a-wave-written-together

Everything `pointers-for-what-grows-with-the-record` says, with one clause on the object of a draft's reading: where one sitting records or moves the recommendations of several nodes that share a neighbourhood -- the children of one parent drafted in one wave, or the single amendment one disposition lands on several nodes -- their readings are one reading. The reader gets the shared neighbourhood once and each of those nodes whole, and returns a verdict, findings, a facts check, a viability judgment and a counter-argument for each; the object is still one text per verdict, and only the brief is shared. A node the wave's neighbourhood does not cover is read on its own, and a wave of one is a reading of one.

**AI support.** For it: measured on the four alignment-page children of 2026-09-07, seventy-five percent of the four briefs is bytes that do not differ by which of the four is judged, and one wave brief is fifty-six percent smaller than the four. The sitting of 2026-09-07 also moved seven nodes on one amendment, which owes seven readings of one text under the rule as it stands.

**AI divergence.** Against it: it stands next to `one-context-for-a-batch`, passed over on this fact for leakage between drafts read in one context, and the reply -- that a wave's drafts already share their neighbourhood and are handed to each other's readers anyway -- is an argument and not a measurement. And four readings collapsing into one is a real loss of independence: the four verdicts now share a reader, and what catches a wave-reader's blind spot is a survey that had not then run.

Raised from the author's words of 2026-09-07 and from the measurement of that day's four sibling briefs. Not applied: unlike three of the `review-cost` clauses, nothing in the working tree at `cb0e02c6` runs a wave. This is now the option with the wave named by the session: `wave-membership-derived-from-the-record` is this same text with the membership derived from the record and the brief bounded, so a ruling for this one is a ruling that the sitting may say which drafts are one reading, which is what the reading of 2026-09-07 found this fact had already passed an option over for.

**Content.**

```markdown
---
question: How is the clean-context review run?
defines:
  - clean-context review
form: rule
under:
  - commons.systems/disposition-graph/recording
---

## Answer

As a skill of its own, `/align-review`, and every invocation of it is one batch: the nodes at the review stage, evaluated against the full graph, answered and unanswered at every stage, read in one context, with nothing isolated by node. The alignment sitting invokes it when its dialogue reaches the review stage, and the author or a session invokes it directly; the scope is the same either way, the batch as the record holds it at that moment, the sitting's drafts among the rest, and the whole graph as the context each is judged against. The skill writes one brief and starts one fresh subagent with nothing but that brief, the record it points to, and the validations the frontier-consistency node lists: the subagent reads every node of the batch, then the full graph, the rest of the unanswered frontier at every stage and the answered nodes up to the roots, the rules that bind everywhere, the manifest, and the author's words on each, and returns as data, writing nothing to the record, a verdict for each node of the batch, its findings, its counter-argument with its strength, its check of the three facts, and the frontier's findings, each naming the nodes and the sentences and recommending the stage to kick back to, with the edit or the merge or split it proposes. A context that forked the invoking session would carry the session's framing and is not clean: what is isolated is the framing, never the record, and the frontier is read whole because the drift the review exists to catch is between its nodes. A finding may name a node outside the batch, at any stage, and it is applied to that node as the kickback flow says; only the batch receives verdicts. The session that invoked the skill validates every finding against the record before any is applied, on its own thread and never delegated, as the author ruled on 2026-09-03, and applies what it has validated on its own, as the recording node says: a forward sets the ruling stage and the review's state, verdict, strength, date, and the hash of the recommended text reviewed, and appends the findings, the facts check, the counter-argument, and the session's reply to the account; a kickback sets the stage the reviewer named and appends the same; a frontier finding is a kickback of each node it names, with the finding and the proposed edit appended to each, as the frontier-consistency node says. The applying of what the session has validated is mechanical and scripted; the validation, the reply, and what is proposed to the author from a merge or a split are the session's judgment. A recommendation changed in substance after its review is set back to the review stage by the session that changed it, and the frontier flags a review whose text has changed since, as it flags a recommendation whose standing text has changed since it was drafted. One batch runs at a time: an invocation waits for any review already running. Invoked directly, the skill then validates, lands the nodes it changed, and republishes the alignment page; invoked by a sitting, the sitting lands with its own round. The batch scope is the author's refinement of 2026-09-03, quoted above, which narrows the earlier words that every invocation evaluates the full unanswered frontier: the frontier is still read whole, as the context, and the nodes at the review stage are what is judged; a node at the periagogic or maieutic stage has no recommendation to judge, and a node at the ruling stage has been judged.
```

#### wave-membership-derived-from-the-record

Everything `one-reading-for-a-wave-written-together` says, with the wave derived from the record and never named by the session. The wave is the nodes one checkpoint landed at one graph commit that stand at the review stage and share a parent or one amendment; the generator computes it from the record and records it with the reading, so that a draft left out of a wave, or a wave drawn to take in a draft whose neighbourhood does not cover it, leaves a trace. It is bounded as well as derived: a wave splits whenever its brief exceeds what one reader holds whole, which is the bound `review-cost` states -- "A brief the reader cannot hold is a defect of the brief, cured by narrowing the object and never by asking the reader to skim" -- and how it splits is derived too, the wave dividing on the parent or the amendment its members share and never on a choice made in the session.

**AI support.** For it: it is the recommended clause with the one thing this fact has already passed an option over for taken out of it. `sibling-set-named-by-the-session` is passed over here because such a set "is chosen by the party whose blind spots the review exists to catch", and the wave as first written was such a set, in the same paragraph that says of the round that it "is derived from the record and never named by the session". The bound answers the collision with the child that prices a brief: `review-cost` cures a brief the reader cannot hold by narrowing the object, and a wave widens it, so without a split the parent and the child bind in opposite directions on one reading.

**AI divergence.** Against it: the derivation is a rule no instrument runs, so this option stands further from the working tree than the clause it amends -- neither the wave nor its derivation exists in `packages/clean-context-review/brief.mjs`. And deriving the membership does not touch the objection on the fact, which is that four objects share one reader however the four are chosen.

Raised at the clean-context reading of 2026-09-07, in its viability paragraph, and recorded with the derivation, the bound and the split the session's reply accepted.

**Content.**

```markdown
---
question: How is the clean-context review run?
defines:
  - clean-context review
form: rule
under:
  - commons.systems/disposition-graph/recording
---

## Answer

As a skill of its own, `/align-review`, and every invocation of it is one batch: the nodes at the review stage, evaluated against the full graph, answered and unanswered at every stage, read in one context, with nothing isolated by node. The alignment sitting invokes it when its dialogue reaches the review stage, and the author or a session invokes it directly; the scope is the same either way, the batch as the record holds it at that moment, the sitting's drafts among the rest, and the whole graph as the context each is judged against. The skill writes one brief and starts one fresh subagent with nothing but that brief, the record it points to, and the validations the frontier-consistency node lists: the subagent reads every node of the batch, then the full graph, the rest of the unanswered frontier at every stage and the answered nodes up to the roots, the rules that bind everywhere, the manifest, and the author's words on each, and returns as data, writing nothing to the record, a verdict for each node of the batch, its findings, its counter-argument with its strength, its check of the three facts, and the frontier's findings, each naming the nodes and the sentences and recommending the stage to kick back to, with the edit or the merge or split it proposes. A context that forked the invoking session would carry the session's framing and is not clean: what is isolated is the framing, never the record, and the frontier is read whole because the drift the review exists to catch is between its nodes. A finding may name a node outside the batch, at any stage, and it is applied to that node as the kickback flow says; only the batch receives verdicts. The session that invoked the skill validates every finding against the record before any is applied, on its own thread and never delegated, as the author ruled on 2026-09-03, and applies what it has validated on its own, as the recording node says: a forward sets the ruling stage and the review's state, verdict, strength, date, and the hash of the recommended text reviewed, and appends the findings, the facts check, the counter-argument, and the session's reply to the account; a kickback sets the stage the reviewer named and appends the same; a frontier finding is a kickback of each node it names, with the finding and the proposed edit appended to each, as the frontier-consistency node says. The applying of what the session has validated is mechanical and scripted; the validation, the reply, and what is proposed to the author from a merge or a split are the session's judgment. A recommendation changed in substance after its review is set back to the review stage by the session that changed it, and the frontier flags a review whose text has changed since, as it flags a recommendation whose standing text has changed since it was drafted. One batch runs at a time: an invocation waits for any review already running. Invoked directly, the skill then validates, lands the nodes it changed, and republishes the alignment page; invoked by a sitting, the sitting lands with its own round. The batch scope is the author's refinement of 2026-09-03, quoted above, which narrows the earlier words that every invocation evaluates the full unanswered frontier: the frontier is still read whole, as the context, and the nodes at the review stage are what is judged; a node at the periagogic or maieutic stage has no recommendation to judge, and a node at the ruling stage has been judged.
```

#### identical-prefix-across-a-waves-briefs

Keep one reader per draft and win the same bytes by construction: order each brief of a wave so that the neighbourhood, the rules of the reading and the index form a byte-identical prefix across the wave's briefs, and launch the wave's readings together against it. It changes the order of a brief's parts and nothing else -- no reading gets a second object, no rule bounds how many objects one reader holds, and the four verdicts keep four readers.

**AI support.** For it: it keeps the four independent judgments every wave option spends, which is what the fact's case against says the wave costs, and it needs neither a derivation of membership nor a split.

Viable and not adopted: its saving rests on a fact about the harness's caching that this record has never measured, so adopting it would put the record's only economy here on an unmeasured property of a tool. That is the reason to put it to the author rather than to assume it; where the caching is what it is assumed to be, this option dominates the wave outright, since it buys the bytes and gives up no independence.

Raised at the clean-context reading of 2026-09-07, in its viability paragraph.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is the clean-context review run?
defines:
  - clean-context review
form: rule
under:
  - commons.systems/disposition-graph/recording
---

## Answer

Keep one reader per draft and win the same bytes by construction: order each brief of a wave so that the neighbourhood, the rules of the reading and the index form a byte-identical prefix across the wave's briefs, and launch the wave's readings together against it. It changes the order of a brief's parts and nothing else -- no reading gets a second object, no rule bounds how many objects one reader holds, and the four verdicts keep four readers.
```

#### the-unreached-line-is-conditioned-by-frontier-consistency

Everything `wave-membership-derived-from-the-record` says, with the survey
paragraph's restatement of what is read of an unjudged node struck and replaced
by a citation of `frontier-consistency`, which now conditions the one-line class
on the node's text as the last survey read it and which this paragraph copies
unconditioned, "of a node no judged node reaches, its question alone, on one
line with its id and its file", while saying in the same sentence that it does
not restate it. Raised by the clean-context reading of `frontier-consistency` on
2026-09-07, which found the copy stale the moment that node is ruled. Adopted into the recommendation on 2026-09-07: the survey paragraph now cites the child's condition and restates none of it, and the child is entered in `depends`.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is the clean-context review run?
defines:
  - clean-context review
form: rule
under:
  - commons.systems/disposition-graph/recording
---

## Answer

Everything `wave-membership-derived-from-the-record` says, with the survey
paragraph's restatement of what is read of an unjudged node struck and replaced
by a citation of `frontier-consistency`, which now conditions the one-line class
on the node's text as the last survey read it and which this paragraph copies
unconditioned, "of a node no judged node reaches, its question alone, on one
line with its id and its file", while saying in the same sentence that it does
not restate it. Raised by the clean-context reading of `frontier-consistency` on
2026-09-07, which found the copy stale the moment that node is ruled. Adopted into the recommendation on 2026-09-07: the survey paragraph now cites the child's condition and restates none of it, and the child is entered in `depends`.
```

#### a-surveys-selection-and-its-state-are-the-selection-nodes

The survey judges the nodes the `survey-selection` node's judged set names against the nodes its selection puts before each, its findings naming the graph commit, the nominating key and the frozen set; a whole reading runs besides on that node's cadence and after any amendment to the validations; and at apply a judged node receives, beside the pin, the commit read, the five section hashes and the register of findings left open on it.

**AI support.** This node fixes when the two readings run and what apply writes, and each of those changes under the selection; naming the selection node keeps the trigger and the apply here and the selection there. The register at apply is what lets the next survey carry a finding forward as standing rather than as new.

The author, 2026-09-03: "alignment adversarial review is materialized as a skill. it can be invoked as a clean context subskill when the scope of an alignment dialogue progresses to review, or it can be invoked directly." Later that day, superseding the per-node isolation: "EVERY invocation of the adversarial alignment review skill is a batch operation that evaluates the full unanswered frontier (without isolating any context by disposition)." In the evening: "When adversarial review finishes alignment main thread (this) validated the review findings before applying." And: "Adversarial review evaluates batch of nodes which are at the review dialogue phase against the full graph." The author, 2026-09-04, on the decomposition node, taking the recommendation that raised the option this answer adopts: "go, and bootrap authority granted"; the words that motivate it are quoted there.

Why two reviews: the two objects have different minimal contexts and different moments of worth. A draft is judged against its neighbourhood, and the judgment is worth most the moment the draft is made, while the main thread still holds the node and can answer the counter-argument with it in hand; the frontier is judged against itself, and that judgment is worth most just before the author rules, when the frontier is as it will be ruled on. One reading sized for the second and run at the first's moment paid the whole graph on every sitting, at a size the skill itself asked its reader to report not finishing, and returned a sitting's findings on nodes the main thread had moved on from. The survey keeps the batch because drift between nodes is invisible to any reading of one node, which is what the author's words of 2026-09-03 established and what stands. The review of a draft is given the round's other drafts because the contradictions a sitting creates are between texts written together, which the second reading of this node found; that reading's remedy, the set derived from the record and never named by the session, stands, and the record derives it as the set the survey owes a reading. Those were not the same set before the first survey ran: with no pin anywhere in the record the derivation yielded every node at the review or the ruling stage, forty-five on 2026-09-05; that day's survey pinned forty-five, and the round since is the nodes moved past their pin, twenty-five at graph commit e4c87ed0, the sitting's drafts inside it. That is why it is given as pointers and not whole, which is the review-cost node's rule for a part that grows with the record rather than with the draft; the words here say what is derived rather than what was wanted, and narrowing the derivation to the sitting's own set is an open question this node does not settle. The siblings under the same parent and the nodes it names are the draft's topological neighbourhood, given beside the round. The author's words of 2026-09-04 send the more complex recommendations to the most capable model's review; the review-model node reads them as naming the model, and every draft is read, because a draft no one read would reach the author unopposed, which the recording node forbids; reading only the complex ones is recorded as an option. It keeps the question index because the check whether a draft is a new question or a new answer is worth most before a duplicate is drafted further, which is why the periagogic stage asks it too. The pin replaces the lock because the record already carries the pin: a review attests to the recommendation it read, so a finding whose subject has moved is stale on its face, and the case the lock guarded against, two readings each forwarding what the other kicks back, cannot arise when the survey forwards nothing and each finding is discarded where its node moved. The reader's model is the review-model node's question and is decided there. Superseded, on the author's words of 2026-09-04: the author's words of 2026-09-03 that nothing is isolated by disposition, kept whole for the survey and narrowed for the review of a draft. The divergences recorded on this node's earlier answers stand as history: the two per-node readings of 2026-09-03 and the batch readings of that day and the next.

What this costs, as a consequence and never as a reason: two readings before every ruling instead of one; a reading of a draft's neighbourhood at every recorded recommendation, the round's drafts included, which for this node's own readings of 2026-09-05 ran to 306 and then 372 kilobytes of brief, the difference being the round, which grows with the frontier and not with the draft, the eight hundred kilobytes an earlier answer recorded being the batch brief of 2026-09-03 and not a draft's; a survey brief over the whole graph, which readiness waits on, first generated on 2026-09-07 and larger than any one reader holds whole, its measurement recorded on the review-cost node; and the survey's discard rule, under which a finding on a node that moved after the survey read it is thrown away and the node judged again, so a frontier that keeps moving is surveyed more than once. The wave's own cost is that one reader's judgment of four drafts is one reader's judgment: a reading that goes wrong goes wrong on all of them together, where four readers fail apart, and the record's only second opinion on a wave is the survey. Its saving is that the parts common to a wave's briefs, which differ between them only by which member each excludes from its round and its siblings, are carried once as their union instead of once for every member; the measurement of 2026-09-07 that prices it is recorded on the review-cost node, where what a reading costs is priced and bounded.

**AI divergence.** The apply now writes six keys where it wrote two, and a survey's report must carry the frozen set and the keys or the apply cannot write them, so the reader's contract grows with the state; and a whole reading on a cadence is a second trigger this node did not have, which the skill must keep.

The wave buys bytes and spends attention, and attention is the quantity this subtree has already said is the scarce one. `review-cost` now recommends that "Token efficiency and context management are bounds on what a reading is given; attention is what the reading does with it, and it is not the same quantity", and a wave halves the bytes while quartering what any one object gets of the reader: the brief is fifty-six percent smaller, but each of the four drafts is now judged by a reader holding three other drafts, three other neighbourhoods of options, and three other verdicts it must also write. Deriving the wave's membership and bounding its brief settle who is in it and how large it may be, and neither touches that: on the record's own accounting a wave is a rise in cost per unit of attention and not a fall, and it is invisible to the measurement the case is built on, which counts only bytes. The deeper objection is that the saving and the loss fall on different parties: the bytes are the record's, the independence is the author's, and the author is the one the review exists to protect. And the loss is hedged only by the survey, which this node's own rationale still records as one "no sitting has yet generated" and which runs for the first time in the sitting that recommends the wave.

**Content.**

```markdown
---
question: How is the clean-context review run?
defines:
  - clean-context review
form: rule
under:
  - commons.systems/disposition-graph/recording
---
## Answer

As two skills, `/align-review` for the review of a draft and `/align-survey` for the survey, divided as the review-skills node decides, running two reviews divided by their object, each in one fresh context that carries nothing of the invoking session and is never a fork, each reading the record and writing nothing to it.

The review of a draft. Its object is one node's recommendation; when it is invoked, by whom, and what it gates are the recording node's confirmation and are not restated here. Where one sitting records or moves the recommendations of several nodes that share a neighbourhood -- the children of one parent drafted in one wave, or the single amendment one disposition lands on several nodes at once -- their readings are one reading. The wave is derived from the record and never named by the session, as the round is: it is the nodes one checkpoint landed at one graph commit that stand at the review stage and share a parent or one amendment, computed by the generator and recorded with the reading, so that a draft left out of a wave leaves a trace. That reader is given the shared neighbourhood once and each of those nodes whole, and returns for each of them a verdict, its findings, its facts check, its viability judgment and its counter-argument, exactly as the reader of one returns them for one; the object is still one text per verdict, and what is shared is the brief and not the judgment. A wave is bounded by what one reader holds whole, which is the review-cost node's bound and is cited here and not restated: where the wave's brief would exceed it the wave splits, and it splits on the parent or the amendment its members share, by the same derivation and never by a choice made in the session. This is not `one-context-for-a-batch`, which stays passed over: a batch is every node standing at the review stage, gathered by a stage field and sharing nothing but the field, while a wave is the drafts of one sitting that already share a parent and a neighbourhood, and that every reader of any one of them is already handed as its siblings and as the round. The framing a wave's reader carries from one draft to the next is framing each of their separate readers would have been given anyway. A node the wave's neighbourhood does not cover is read on its own, and a wave of one is a reading of one. This clause is not materialized: it requires a wave mode on `packages/clean-context-review/brief.mjs`, with a brief template of its own, and a second contract for `/align-review`, which today takes exactly one node id, and neither exists; the saving stated below is projected from a measurement of four separate briefs and has not been observed on a brief any generator writes. The reader is given the node whole; the chain of nodes above it; the rules that bind everywhere; the rules of this reading itself, carried in the brief and not named as files to open; the nodes under it; its siblings under the same parent, which the checkpoint has landed; the nodes it names, by id or as the node of that slug, and the nodes its `depends` names; the readings that bear on it; the round of other drafts; and, of every other node in the record, its id, its question, and the file it is in, on one line, so that a draft answering a question the record already asks is caught at the draft. A neighbour is carried by what it answers, its question, the answer that stands, the answer it now recommends where those differ, and the names of its options, and not by its whole file; the exception is an option whose source is the draft under review, which is carried whole because it is the draft's own text, and which the generator does as of the reconciliation of 2026-09-05. The round is derived from the record and never named by the session: it is the judged set the `survey-selection` node's answer names, the nodes the survey owes a reading, and that node and not this one says which those are; since the survey of 2026-09-05 that is a proper subset of the review and ruling stages, twenty-five nodes of fifty at graph commit e4c87ed0, and it is given as pointers, one line a node, because it grows with the frontier and not with the draft. Why each part is given at that size, and what it costs, is the review-cost node's question and is not restated here; this node says what the parts are and that node says what bounds them. It runs the first six validations of the frontier-consistency node and the fifteenth, judges whether every option on the node's facts is viable and whether a viable one is missing, and returns as data a verdict, forward or kick back to the stage it names, its findings, its check of the facts, its judgment of the options' viability, any probe it raises for the author, and the strongest counter-argument with its strength. Its reader's model, and the survey's, is decided on the review-model node and stated by the skill at the launch; no brief argues it. Two reviews of drafts never wait on each other. A draft gets two readings, the reading and the re-reading of the amendment that answers it, and no more of one answer; the re-reading's object, and the cap, are the review-cost node's. A forward sets the ruling stage and writes the review's state, verdict, strength, date, the counter-argument, and the pin of the recommendation read; what the reader was given is not written on the node but is reconstructible where the reading recorded the graph commit, which the applying step records only on a clean tree, by re-running the generator of that day at that commit; a kickback sets the stage the reviewer named and writes the same; both append the findings, the facts check, the viability judgment, the counter-argument, and the session's reply to the account, and write on the node the probes the reader raised, a probe returning the node to the maieutic stage whatever the verdict, as the author-questions node says, the applying step deriving the stage from the probes before it reads the verdict.

The survey. Its object is the frontier's consistency with itself, and it keeps the shape the author's words of 2026-09-03 give it: the graph entire, answered and unanswered at every stage, read in one context, the accounts left out since they are the dialogue's history and not its text. What of each node reaches that context is what the frontier-consistency node's validations read of it, as that node states them and as this node does not restate: of a node the judged set reaches, what it answers -- its question, the one answer that binds it, and the names of the options on its answer fact; of a node no judged node reaches, what the frontier-consistency node's condition on its text gives, its question alone on one line where its text stands as an earlier survey read it and what it answers where it was minted or amended since, stated there and not here. So the survey's reader is handed the judged nodes whole, their neighbourhood by what it answers, and the rest of the record as an index of questions; what that costs and what bounds it is the review-cost node's. It judges the nodes the `survey-selection` node's judged set names, each against the nodes that node's selection puts before it, on validations seven to sixteen of the frontier-consistency node, and its findings name the graph commit they read, the key that nominated each pair, and the set the selection froze. It runs when the recording node's confirmation says and whenever it is invoked, and a whole reading, in which nothing is frozen, runs besides on the cadence the `survey-selection` node states and after any amendment to the validations. At apply, a judged node whose recommendation still matches what the survey read receives the survey's pin beside the draft review's, its date, the hash of the recommendation, and what the `survey-selection` node's accumulation carries — the commit read, the hashes of the five sections the validations read, and the register of the findings left open on it; a node whose recommendation moved since receives nothing and is judged again by the next survey. That pin serializes the survey and no lock is held: two surveys of one frontier find the same, and where the frontier moved between them the stale finding is discarded where it is stale. A frontier finding is applied as the kickback flow says to each node it names, at any stage, with the finding and the proposed edit appended; a merge or a split is an option on the node it would change, never done by the review; a tangle is recorded as the alignment-order node says.

The session that invoked the skill validates every finding against the record before any is applied, on its own thread and never delegated, as the author ruled on 2026-09-03, and applies what it validated by script. What the two readings gate, and when a node is ready for the author's ruling, is the recording node's confirmation; the frontier and the alignment page show which of the two is owed. Invoked directly, either skill validates, lands the nodes it changed, and republishes the alignment page; invoked by a sitting, the sitting lands with its own round.
```

#### the-unreached-line-is-cited-from-survey-selection

The survey carries a node the judged set does not reach, or whose read text an earlier survey read, on one line as the survey-selection node states, and this node cites that node and restates nothing; on the table because the recommended answer cites frontier-consistency for a condition frontier-consistency's own recommendation moves to survey-selection.

#### the-review-is-struck-as-superseded-by-the-expert-system

The clean-context review is struck: the expert system of recorded identities, scopes and groundings replaces it, and no fresh-context reader stands between a draft and the author.

**Author choice, unconfirmed.** The author's words of 2026-09-08: "Based on expert feedback and what's been relayed on tradition my current choice is to strike clean-context review as superceded by expert system." It is the author's current choice and it is not a confirmation, and the record has no mark for that state yet; `viable-options` carries the option that would mint one. Recorded here as an option so that the choice is on the ref and visible beside what the first expert convened on it returned.

**Tradition support.** Nemeth, Brown and Rogers (2001) found authentic minority dissent outperformed every assigned devil's-advocate condition, and that assigned advocacy can bolster the position it was assigned to oppose by letting the majority feel the objection has been heard and defeated; a reader briefed to attack a draft is an assigned advocate in that exact sense, so the strike removes an instrument whose independence was thinner than its description. Fagan locates the rigour of inspection in the division of the reading into scoped roles rather than in one reader's diligence, which makes several scoped experts the more Fagan-like instrument. The multi-agent debate result (arXiv:2305.19118) is evidence that a plurality of agents held in tension outperforms one agent reflecting on its own output.

**Tradition divergence.** TIBER-EU and CBEST faced this same choice between a blind adversary and a joint expert exchange and kept the blind test against a defender tested without foreknowledge, placing the joint exchange in a later phase: they chose sequence and not substitution. IV&V doctrine holds that independence must be constituted at three levels, financial, managerial and technical; under this shape the main thread selects which experts are convened, writes the brief fixing each one's scope and grounding, and integrates their returns into the recommendation the experts exist to test, which is none of the three. Auditing's self-review threat is the one threat adding experts cannot cure: where the recommendation is the integration of the experts' choices, every party that sees the integrated draft is a party whose choice was integrated into it, and each expert added to widen the check is another author of the thing checked. Least privilege and compartmentation both hold that a participant bounded to what its scope requires cannot correlate across compartments, so defects of composition -- a contradiction between two facts each individually well supported, a node correct and redundant, vocabulary drift across siblings, a node under the wrong parent -- are invisible to every scoped reader by construction, and this node's own answer constitutes the incumbent as the opposite, read "in one context, with nothing isolated by node". Staw's escalation experiments find self-justification strongest where the party made the prior decision itself and where it is public and attributable, and the degeneration-of-thought result states the same in this record's own medium, that a model which has established confidence in its solution cannot generate novel thoughts through reflection even where the stance is wrong; the accumulation of each expert's support and divergence is that experimental condition by design, and a clean-context reader is by construction the one party with no prior recorded position to defend. Across every tradition the survey reached it found practices that add scoped participants and keep an independent reading, and none that abolishes the independent reading in favour of scoped convened participants.

**Expert choice.** The expert `tradition-on-orchestration-shape`, scoped to the answer fact of the orchestration shape and grounded in tradition, did not choose this option. Its finding is that something specific is lost, that it is nameable, and that three of the four losses are created by the expert system's own scoping and integration clauses rather than merely left uncured by the strike.

**AI support.** The strike answers a real defect and the record should not pretend otherwise. This node's incumbent is described as a fresh, uncommitted, hostile reader, and the first two of those are constituted while the third is assigned; Nemeth's result is that the assigned third undoes some of what the first two buy. An instrument whose independence is asserted rather than constituted is worth less than the record has been treating it as worth.

**AI divergence.** The record has already passed an option over on precisely the ground the strike walks into. `sibling-set-named-by-the-session` was passed with the reason "it is chosen by the party whose blind spots the review exists to catch", and this node's own case against its recommendation says "the bytes are the record's, the independence is the author's, and the author is the one the review exists to protect". Striking the review does not answer that reason; it removes the party the reason was about. And `movements` carries the open probe `who-convenes-the-experts`, which asks whether the party writing the briefs may be the AI whose recommendation the experts exist to test: the strike would remove the mitigation before the probe questioning its replacement is answered, which is the wrong order whatever the answer turns out to be.

#### the-independent-reading-is-constituted-and-sequenced-after-the-experts

The independent reading is kept and constituted rather than struck: its brief fixed by rule instead of composed per launch, convened by something other than the party under test, given the whole object rather than a scope, and placed after the expert exchange so that it reads the integration rather than competing with the experts.

**Expert choice.** Chosen by `tradition-on-orchestration-shape`, as the cure tradition offers for what the strike correctly diagnosed. The expert states it as an option and not a recommendation, on the ground that the answer fact is the author's.

**Tradition support.** TIBER-EU and CBEST are the closest institutional analogue and they sequence rather than substitute, keeping the blind test and placing the joint exchange after it. IV&V's three levels give the test the constitution would have to meet. Fagan's inspection keeps a moderator who is not the author, so the tradition with the strongest measured defect removal used author-adjacent readers under a party who was not one of them. Peer review keeps editor-chosen referees and treats author-suggested reviewers as a supplement and never a replacement.

**Tradition divergence.** Auditor tenure is not monotone: review quality degrades at low tenure as well as at high, because client-specific expertise takes time to acquire, so a permanently rotating stranger is not the optimum and the persistent scoped expert has a real defence this option gives up. And Nemeth still bites: a reader briefed to attack is an assigned advocate whichever phase it runs in, so sequencing alone does not convert the reading into authentic dissent, and the option inherits that defect from the incumbent unchanged.

**AI support.** It concedes what the author's choice diagnosed and cures it in the direction the evidence points: the answer to independence that is asserted rather than constituted is to constitute it, and deleting the party is the one move that forecloses that. It also costs less than it looks, because the reading it asks for is one the record already runs.

**AI divergence.** It requires a party the record does not have. "Convened by something other than the party under test" names no one: there is the author, the main thread, and what the main thread launches, and the first is the party the instrument exists to protect. So the clause is a requirement without an implementation, and it is `movements`' open probe and not this node's to settle. It also adds a phase to a shape the author has just described as iterative rather than sequenced, which is a real tension with the same entry's P3 and not a detail.


#### independence-by-model-diversity-and-one-whole-object-per-reader

The expert's choice, minted by it. The independent reading is kept and every reading
takes exactly one whole draft and no wave; its independence is bought by drawing the
reader from a different model family than the one that drafted and, where the record can
arrange it, by putting the draft before it unattributed; its brief assigns no adversarial
role and supplies no candidate finding; and context freshness is kept as a cheap
necessary condition rather than treated as the mechanism that buys independence. Within
the options already on the fact the expert chooses
`identical-prefix-across-a-waves-briefs`.

**Expert choice.** `llm-systems-evidence`, convened on this answer fact on 2026-09-08,
grounding the measured behaviour of language-model systems. Its case rests on
measurements with loci, of which the load-bearing ones are these. On the closest
published analogue to this record's actual use -- a pre-registered experiment in which
the authors of forty-four meta-analyses ranked AI reports on their own paper by
usefulness -- a single-pass frontier model beat two purpose-built multi-agent debate
systems by 0.66 and 0.57 rank points, ninety-five per cent intervals excluding zero, with
the losing system at roughly thirty times the tokens (arXiv 2607.14713). On subjective
rubric scoring across six judge models a single judge had the strongest human alignment
and consensus multi-agent debate degraded it, while an assigned strict-judge role
introduced a systematic downward bias consensus did not correct (2608.30373, EMNLP 2026
Findings). Assigned personas do not improve accuracy across 162 roles, four model
families and 2,410 questions (2311.10054). A panel of diverse smaller judges beats a
single large judge at a seventh of the cost with reduced intra-model bias (2404.18796),
and ensembling mitigates self-preference where a single judge does not (2604.06996).
Under blind evaluation self-preference vanishes on three of four rubric dimensions and
reverses on the fourth, the bias being driven by attribution rather than content
(2608.18091). So independence is bought by diversity and blinding, both measured;
freshness is cheap and necessary and is not the mechanism the record has been crediting.

**Expert divergence, its own, three breaks it names against itself.** Model diversity may
be unavailable: this harness runs one vendor's models, and a different checkpoint of the
same family is not what the panel result measured, so the clause may be a requirement
with no implementation -- the same defect the expert charges against the sequencing
option. Blinding may be impossible here, since the record's drafts carry the record's
voice and the reader is given the ancestry, while the blind condition it cites was
constructed on material chosen for lacking model-specific stylistic markers, which this
record's prose is not. And the whole-object clause and the diversity clause pull apart on
cost: a whole-object reading on a second family is a second full-price reading, and
nothing the expert found prices that against the record's actual criterion, which is the
author's attention and not tokens.

**AI support.** The option is the only one on this fact that separates the three
mechanisms the record has been treating as one. The record's own texts justify the fresh
context sometimes by framing and sometimes by authorship, and the expert's evidence says
those have different cures -- a small brief in a separate context for the first, a
different family and an unattributed object for the second -- so a design that names
which it is buying is better than one that does not, whatever the author decides to buy.

**AI divergence.** The option is silent on what this fact's recommendation is mostly
about, which is the survey's selection and its state, and on the survey half generally;
the expert's grounding reaches the reading and not the selection, and it says so. Taken
alone the option would leave the fact answering less than it answers today.


### authority

Ratified, at low boldness. The author's words set this node's shape twice on 2026-09-03 and once more on 2026-09-04 through the decomposition node, and being wrong here is capture-shaped: the review is the guard against the blind spots of the session that drafts, and a delegation would let the reviewed party set the terms of its own review. The parent and the decomposition node recommend the same class at the same boldness.

### persistence

The shim declared here on 2026-09-03 names one directory holding the review
skill with its briefs and scripts beside it; the review-skills node's
recommendation divided the review into two skills and one package, and
declared three shims of its own for them, so this node's shim was superseded
by that recommendation and struck when it landed, at a1ddc6e6 on 2026-09-04;
this node's frontmatter no longer carries it. The fact is carried past the
dialogue node's rule deliberately, that rule holding a persistence fact
present only where the recommendation would change the node's shape, which
after the strike it does not; it is kept so that the author rules on the
placement rather than inheriting it. Low boldness: the transience node's rule that a
shim is declared where its artifact comes into being decides the placement,
and the artifact this shim named ceased to exist in the shape it named when
that reconciliation landed.

#### shim kept

The shim stays declared here and is restated to name the two skill files and
the package's templates, so that the artifacts are described on the node
whose mechanics they run; its declaration date would then stand for
artifacts that come into being a day later.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

#### shim superseded by review-skills

The shim was struck here when the two skills and the package landed, and the
three shims the review-skills node declares stand for them; this node's
recommended text names the two skills and cites that node.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

## Account

### Manifest

- Folded: Recording of 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03 (first reading), at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03 (second reading), at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Recording of 2026-09-03, superseded and re-answered, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Words of 2026-09-03, evening, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Re-encoding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Alternatives merged, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Recommendation moved, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Reconciled under the grant of 2026-09-04 for review-skills and review-model, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The shim struck, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the reading, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Option from the review-cost node, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The disclosure discharged, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier survey, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Two defects in the instrument, reconciled 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The skills' claim that this recommendation had not moved, corrected, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: One reading for a wave, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of 9d937730, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the reading, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of 9972f0cf, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier survey, 2026-09-07, of 9972f0cf, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the frontier survey, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of d3f8d737, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Option adopted, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of dfc00246, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Repaired after the re-reading of d4ab0283, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-07, of aaec57a0

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `a-surveys-selection-and-its-state-are-the-selection-nodes`.

Findings:


On the facts and what they recommend: The diff changes no fact's recommends, boldness, or stands: the answer fact still recommends `a-surveys-selection-and-its-state-are-the-selection-nodes` at high boldness with `stands` at `standing`, so the '## Recommendation' fence stays required and present. The diff is a repair inside that fence's text (and the account's description of it): the draft-review 'round' paragraph is rewritten from an inline restatement of which nodes the survey owes a reading into a citation of `survey-selection`'s judged set, and a stray mid-sentence capital 'The' after a semicolon in the '### Option adopted, 2026-09-07' account entry is fixed by splitting the sentence at a period.

On the viability of the options: The diff touches no option's reasoning on any of the three facts (answer, authority, persistence) other than rewording prose inside the already-recommended fence; it adds no option and passes over none. Every option that was viable before the diff remains viable after it.

The review found no strong counter-argument.

The session's reply: No counter-argument was found.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/clean-context-review stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `standing`; the `## Rationale` its `**AI support.**`; the `## Recommendation` fence became the content of `a-surveys-selection-and-its-state-are-the-selection-nodes`; 10 `## Disposition` entries became the ledger entries words/2026-09-03/31, words/2026-09-03/32, words/2026-09-03/33, words/2026-09-03/34, words/2026-09-04/23, words/2026-09-07/5, words/2026-09-07/6, words/2026-09-07/7, words/2026-09-07/8, words/2026-09-07/9, referenced by 0 options the entry's own date names and by the recommended option for 10 the date named none; and `stands` left the answer fact. The content of `per-draft-and-survey (at feb66ce6)`, `pointers-for-what-grows-with-the-record (at 6a84b48e)`, `one-reading-for-a-wave-written-together (at 2e1d5e44)`, `wave-membership-derived-from-the-record (at 0d4f36e5)` was recovered from the commit at which the answer fact recommended it. The record wrote no text of its own for `rerun-earlier-reviews`, `forked-skill-as-the-reviewer`, `review-applied-by-the-reviewer`, `one-context-for-a-batch`, `committed-record-only-per-draft`, `sibling-set-named-by-the-session`, `fixed-model-for-every-review`, `lock-at-launch`, `moved-draft-re-read-by-the-survey`, `neighbourhood-by-topology-only`, `complex-drafts-only`, `state-what-does-not-move-and-cite-review-cost`, `counter-argument-per-fact`, `identical-prefix-across-a-waves-briefs`, `the-unreached-line-is-conditioned-by-frontier-consistency`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `aaec57a00b39e6489eac17dd85c8bc5b798970fa` is re-computed for the encoding as `e2a45f86e02e587699b715e7bd116ab1f0280c83`; nothing it read changed. The survey's pin `9972f0cfa1d3635eba4440a793ce96b6d88271e0` was already past the recommendation and is left as it stood.

### Frontier survey, 2026-09-07, of e2a45f86

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- Vocabulary (11). The word survey carries two meanings across the frontier and this node owns the family. `review-skills` states the conflict on its own face in `align-survey-renamed-for-the-family`: "the vocabulary conflict behind it is already in the record, `frontier-consistency` defining survey as the reading of the frontier while `decomposition` calls three of a sitting's units surveys", and the second sense is projected into every session by `delegation`'s answer at .claude/rules/delegation.md: "Every investigation whose context is verbose is a unit whatever its size: debugging, driving a browser, reading logs, transcripts, or diagnostic output, and surveys."
- Contradiction (7) with the reading that ran under it. This node's recommendation carries the selection to `survey-selection`, and the survey the author is reading was launched with none of that selection in force: the brief states "This brief was launched over a failing tier (`--force-tier`), for diagnosis." and "3351 finding(s) stand unrepaired; treat what they name with suspicion." A node that answers how the reading is bounded is being ruled on the evidence of a reading run outside its bounds.

Strongest counter-argument (moderate): The recommendation is drafted at high boldness, which this record reads as low confidence, and it moves the survey's whole selection to a node whose own recommendation is also high and also unmaterialized, so the author is asked to confirm a division of labour between two drafts neither of which the record can yet check. Nothing in the implementation holds either half: the brief in hand reports a mechanical tier that gated nothing and 4677 candidate pairs of which none were frozen, so the selection this node delegates away is, on this date, the whole graph either way. Against that, moving the selection out is what lets the cost question be ruled without re-opening what a clean-context reading is, which is the one decision this node exists to hold.

### Frontier finding, 2026-09-07

Kind: vocabulary.

The term survey is used with two meanings across the frontier. `frontier-consistency`'s answer defines it as the reading of the whole graph, while `delegation`'s answer, projected at .claude/rules/delegation.md, makes it a kind of subagent unit: "Every investigation whose context is verbose is a unit whatever its size: debugging, driving a browser, reading logs, transcripts, or diagnostic output, and surveys." `review-skills` records the collision on its own face in `align-survey-renamed-for-the-family`: "the vocabulary conflict behind it is already in the record, `frontier-consistency` defining survey as the reading of the frontier while `decomposition` calls three of a sitting's units surveys". A term the record has made a skill name (`/align-survey`) and a validation subject cannot also name an ordinary unit.

Also named: commons.systems/disposition-graph/frontier-consistency, commons.systems/disposition-graph/decomposition, commons.systems/disposition-graph/delegation, commons.systems/disposition-graph/review-skills.

Proposed: The survivor is `frontier-consistency`'s sense: survey is the reading of the frontier, and the skill family keeps the name. `decomposition` already carries the repair as the option `units-are-readings-not-surveys`, so no new option is needed there; `delegation`'s answer loses the word from its list of verbose investigations, which is a sizing clause `delegation-bounds-and-sizing` has already assigned to `unit-sizing`, so the amendment travels with that move rather than reopening the bound.

### A survey finding the apply discarded, 2026-09-07

The survey of 2026-09-07 returned a cross-node finding that names this node
and `survey-selection`, and `survey-selection` moved after the survey read it,
its recommendation having been recorded anew at f57877f9 on the author's words
of 2026-09-07, so the apply discarded the finding whole and wrote nothing on
any node it names. It was validated at its loci on the main thread and is not
withdrawn. It proposes no option on this node. The finding
named no stage for this node and none is set; no survey pin is written by hand.
The finding is recorded so that the sitting that takes this node up finds it.

The `contradiction` finding on the brief's size against `review-cost`'s bound, as the survey wrote it: The bound `review-cost` states on a brief is contradicted by the brief the same family of nodes produced. Its answer holds that "A brief the reader cannot hold is a defect of the brief, cured by narrowing the object and never by asking the reader to skim" and that a brief that fits "is then read in the fewest pieces the reader's tool allows, and in one call where the tool's limit reaches the whole of it". The survey brief of 2026-09-07 is 9,277 lines and 1,111,970 bytes, roughly ten times a single call's cap, so the fewest pieces its reader's tool allows is nineteen, and the brief itself reports the selection that produced it as unnarrowed: "This survey is whole.", "4677 candidate pair(s), all live, 0 frozen". Either the bound is not a bound, or the object was not narrowed and the defect is the brief's.

Its proposal: The survivor is the bound, made operative rather than aspirational: `review-cost` states the brief's size in what the reader's tool holds, and the generator refuses or splits a brief that exceeds it rather than emitting it, so that the clause about the fewest pieces describes an artifact that can satisfy it. `survey-selection` is where the narrowing happens and takes the number; `clean-context-review` and `review-skills` are named because the two readings and their generator are what the bound binds.

### Frontier finding, 2026-09-07

Kind: redundancy.

The one-line carriage of an unreached or unchanged node is stated on four nodes. survey-selection: 'a node the judged set reaches but whose read text has not changed since a survey read it, judged or reached, is carried on one line rather than by what it answers'. frontier-consistency: 'a node whose text stands as an earlier survey read it is carried on one line, and a node minted or amended since is carried by what it answers until a survey has read it again', while its Facts 'recommends the-judged-set-and-its-comparisons-move-to-survey-selection'. clean-context-review's recommended answer: 'of a node no judged node reaches, what the frontier-consistency node\'s condition on its text gives, its question alone on one line'. review-cost: option `the-surveys-unreached-node-is-one-line`, of which frontier-consistency's account says 'a rule drafted twice in one day on two nodes is evidence that the seam is in the wrong place'.

Also named: commons.systems/disposition-graph/survey-selection, commons.systems/disposition-graph/frontier-consistency, commons.systems/disposition-graph/review-cost.

Proposed: survey-selection survives as the rule's home. frontier-consistency's paragraph goes with its recommended move; clean-context-review cites survey-selection instead of frontier-consistency, its option `the-unreached-line-is-conditioned-by-frontier-consistency` being passed over; review-cost's `the-surveys-unreached-node-is-one-line` is passed over with survey-selection as the reason.

Recorded as an option on this node's answer fact: `the-unreached-line-is-cited-from-survey-selection` (source review, 2026-09-07).

### Frontier finding, 2026-09-07

Kind: contradiction.

clean-context-review's recommended answer: 'a whole reading, in which nothing is frozen, runs besides on the cadence the `survey-selection` node states and after any amendment to the validations'. survey-selection's recommended answer: 'The whole survey, in which nothing is frozen, is a backfill and never the norm: it runs on the author\'s word, and after any amendment to the validations, to what a reading is given, or to the tier' and 'it runs on no cadence and after no count of deltas.' survey-selection carries `size-the-cadence-and-the-sample-on-inclusiveness-and-precision` unrecommended, so the cadence clean-context-review cites is an option there, not the answer.

Also named: commons.systems/disposition-graph/survey-selection.

Proposed: survey-selection survives, its question being when the whole reading runs; clean-context-review's sentence is amended to say the whole reading runs as survey-selection says, naming no cadence.

### Frontier finding, 2026-09-07

Kind: cross-reference.

information-hiding's answer: 'They change for different reasons: the first six validations and the fifteenth against the seventh to the fifteenth, one node\'s verdict against a graph commit and a set of recommendation hashes.' frontier-consistency numbers sixteen validations, and the sibling reading fagan-inspection-roles has 'the first six validations and the fifteenth over one draft\'s neighbourhood, the seventh to the sixteenth over the whole graph', as clean-context-review has 'on validations seven to sixteen of the frontier-consistency node'.

Also named: commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/frontier-consistency.

Proposed: fagan-inspection-roles and clean-context-review survive; information-hiding's 'seventh to the fifteenth' becomes 'seventh to the sixteenth'.

### Frontier finding, 2026-09-07

Kind: vocabulary.

author-questions' answer: 'The two senses of reader collide here and the record carries both, the parser of the graph and the clean-context reading\'s subagent, which is a vocabulary finding this answer records rather than settles and leaves to the survey; where this node says reader without qualification it means the parser.' The parser sense: viable-options 'the reader parses an option\'s `#### ` subsection and no content within it'; what-an-option-row-carries 'which the reader of the graph enforces'. The agent sense: review-cost 'A reading is the only reader in this record that can judge whether an answer is right, and it is the most expensive reader the record has'; what-an-option-row-carries 'Where no reader\'s line bears on a fact the row carries, in the line\'s place, one'. recording already has the third term: 'The reviewer recommends and never writes'.

Also named: commons.systems/disposition-graph/author-questions, commons.systems/disposition-graph/review-cost, commons.systems/disposition-graph/recording, commons.systems/disposition-graph/viable-options, commons.systems/disposition-graph/what-an-option-row-carries.

Proposed: recording's term survives for the agent: reviewer, or the reading where the act is meant; reader is kept for the parser, which is what read.mjs is. review-cost, what-an-option-row-carries and clean-context-review substitute; author-questions strikes the sentence that leaves the finding to the survey.

Recorded as an option on commons.systems/disposition-graph/review-cost's answer fact: `reader-is-the-parser-and-reviewer-is-the-reading` (source review, 2026-09-07).

### The author's choice to strike, and the expert convened on it, 2026-09-08

The author's words of 2026-09-08 at `words/2026-09-08/37` state a current choice to
strike this node's instrument as superseded by the expert system that
`words/2026-09-08/36` sets out. The choice is recorded above as
`the-review-is-struck-as-superseded-by-the-expert-system` and nothing is struck: it is a choice
and not a confirmation, and the author's own words ground it in "expert feedback and
what's been relayed on tradition", so the record's part is to convene the expert and
put what it returns beside the choice.

One expert was convened, identity `tradition-on-orchestration-shape`, scope the answer
fact of the orchestration shape, grounding tradition. It returned thirty readings and
diverges from the choice. Its finding, in its own terms: what is lost is the only party
in the design whose context is not constituted by the party under review, and with it
the only reading of the draft as a whole and the only reader with no recorded position
to defend; and three of the four losses are created by the expert system's own scoping
and integration clauses rather than merely left uncured by the strike. It also found a
loss that is procedural rather than epistemic, that nothing in the shape requires a
recorded divergence to be *answered* before the author confirms, so that an answered
divergence and an unanswered one are the same input to the author's judgment.

No recommendation moved, and the reason is worth stating because it cuts against the
sitting's own convenience. Under the same entry's P2 the AI's recommendation is
redefined as the main thread's integration of the experts' choices; the one expert
convened chose `the-independent-reading-is-constituted-and-sequenced-after-the-experts`, so
integrating the experts' choices as they presently stand would move this fact's
recommendation *away* from the author's choice and not toward it. The sitting declines
to make that move on one expert's return, and records the consequence here rather than
leaving it for the author to discover: the author's redefinition of what a
recommendation is has the effect that a recommendation can now diverge from the
author's own unconfirmed choice by construction, and the record has no way to show
those two marks apart until `viable-options`' selection-per-party option is ruled.

The thirty readings are not minted as reading nodes in this sitting. Under
this node's neighbour `readings`, a reading is a node under
the node it bears on, and thirty nodes is a debt the sitting cannot discharge in
passing; it is residual R12 and R14 of the sitting's store and it grows by thirty here.
What the sitting did instead is what the author's answer to P1 asks for: tradition's
support and its divergence are written as strings on each option, both able to stand on
one option at once, which is the logical shape `words/2026-09-08/37` fixes and which the
options above are the record's first instances of.

The brief that convened the expert carried the defect `expert-instructions` already
reports, and the expert caught it. The brief enumerated the traditions it thought
relevant and described this node's instrument as "a fresh, uncommitted, deliberately
hostile reader", which names the finding it hoped for inside the list it hands over.
The expert declared the bias and asked that its agreement with that framing be
discounted and its disagreements weighted more. That is recorded on
`expert-instructions` as an instance and is noted here because it conditions everything
above: the supports in this account were written by a reader that was pointed at them.

### The third expert, on this fact, 2026-09-08

`llm-systems-evidence` was convened on this answer fact under the author's grant, its
grounding the measured behaviour of language-model systems, and its return is recorded
above. It returned a support and a divergence for each of twenty-four options and left
the strings empty where its grounding had nothing to say, which is the first exercise in
this record of the nullable pair the author's words of 2026-09-08 fix on the
tradition-to-option edge; the expert states the empty string as a finding about the scope
of the evidence rather than an omission, which is the reading this record should keep.

The recommendation does not move. What the expert returns bears on the reading and not on
the survey's selection, which is most of what the standing recommendation answers, so
integrating it would replace an answer to a wider question with an answer to a narrower
one.

**The finding this sitting most needs on the ref, and it is against the sitting.** The
expert reports that it read the first expert's tradition divergence on the strike option
before forming its own view, because that paragraph is in the file the brief told it to
read first, and that its divergence from the strike is therefore not independent of the
first expert's. In its words: "The record must not count my agreement as corroboration.
Two readers who read each other are one reader, and that is the exact failure the fact I
am scoped to is about, occurring inside this sitting." It adds that the shape in which an
option accumulates each expert's support and divergence makes a second independent
opinion structurally impossible, since every later expert reads the earlier ones. That is
a defect in the accumulation the author's words of 2026-09-08 fix, it is reported by the
party it convicts, and it is recorded on `dialogue`, which owns the accumulation, as well
as here.

What the expert adds that the first did not have is two measured results on the strike --
2607.14713 and 2608.30373 -- and it says so and says the rest of its case restates the
first expert's argument in a different vocabulary. So the record now holds two divergences
from the author's current choice and one and a bit reasons for them.

The expert also declines a claim it was not asked for and could be read into its answer.
It did not run a symmetric search for successes of the system the strike would adopt, and
says so: "The finding is: strong, recent, directly on-task qualifications exist and the
record does not hold them. It is not: the balance of the literature is negative." The
distinction is kept here because the strike is the author's own choice and the record
should not overstate what stands against it.

### What is lost in the strike, both experts, 2026-09-08

The author's standing instruction to this sitting was to establish grounding on whether
anything is lost in adopting the expert approach over the adversarial review approach.
Two experts have now answered it from unrelated groundings, and they converge on a
division rather than on a verdict.

`dialectical-conduct` divides the review's work into a dialectical function and an
inspection function. The dialectical function is subsumed: the expert system supplies far
more argument than one reviewer ever did, and on quality of argument the experts plainly
dominate. The inspection function is not subsumed, and the expert states why in a form
the record can check: an expert convened on a fact argues about the fact, while a reader
in clean context is the only party whose object is what the record actually says rather
than what the parties meant it to say. Its worked example is on `growth`, whose review of
2026-09-07 recorded as its `against` that an option's frontmatter said `passed` while its
account prose still read "Adopted into the recommendation" -- a disagreement between two
parts of a document, which is not an argument about anything and which no expert convened
on the answer fact had reason to look for. `plato-elenchus` names the same residue: the
function no party can discharge on itself, whose authority comes from the reviewer not
being the drafter and not from what it finds.

`llm-systems-evidence` reaches the same division from measurements. It grants the
strike's diagnosis on one point: the incumbent's independence is partly asserted, since
an assigned adversarial role does not improve accuracy and an assigned strict-judge role
introduces a systematic downward bias. It denies the substitution, on the ground that the
closest measurements run against it, and it names the mechanism that cuts specifically at
this expert system -- that a panel whose members are all scoped has no member who reads
the object whole, while the record's own positive citation for debate claims that a model
confident in its position cannot escape it by reflection, which argues for a party with
no prior recorded position, and every expert acquires one the moment its support and
divergence are written on the option. Its ninth probe is that it found no measurement, in
any medium, that an ensemble of scoped readers recovers defects of composition that no
member could see, and that this is the load-bearing empirical claim under the strike.

There is a second loss both experts name and neither counts as an argument against the
strike. The clean-context review was the one gate in this record that fired without the
author spending attention. Strike it and the cost does not vanish; it lands on the
author, in a record whose own words name the author's attention as the resource to
conserve. `dialectical-conduct` records this as a transfer and asks that it be counted as
one rather than as a saving.

The cheap repair both leave open, and which no option on this fact yet states: keep the
inspection alone -- one pass by a party who reads the node as written and argues nothing,
a smaller instrument than the review being struck. It is not minted here because minting
it would be the main thread choosing among the experts on a fact where two of them have
just told it that its briefs are steering them, and because the author's choice to strike
is on the fact and unconfirmed. It is put to the author as a probe.
