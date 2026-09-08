---
question: Who may change an answer?
stage: review
probes:
  - id: what-makes-a-single-valued-answer-the-authors
    asks: >-
      A node's answer is single-valued. When the author and the AI diverge and
      the record keeps the divergence, what makes the recorded answer the
      author's rather than a compromise between them?
    fact: answer
    why: >-
      round-termination holds that divergence surviving shared grounding is a
      terminal state the record keeps, and that the parties may hold
      alternative readings of a tradition and alternative dispositions, each
      internally consistent. A node still carries one answer. This node says
      what the AI does with something that would contradict doctrine, which is
      to record it as an option that acts on nothing until the author rules; it
      does not say what the answer is while a kept divergence stands beside it,
      nor which party the single value belongs to. The traditions in the family
      write that clause explicitly because they found they had to: CPR r
      35.12(5) denies an experts' agreement any binding force so that the
      decision stays with the court, and the joint statement under r 35.12(3)
      records the disagreement with its reasons rather than resolving it.
    discharges: >-
      Whether the answer standing under a kept divergence is the author's
      option, the AI's, or neither until ruled; and what the AI may build on
      while one stands.
    source: ai
    raised: 2026-09-08
review:
  verdict: forward
  strength: weak
  date: 2026-09-07
  of: d8988dc14cd0be091955ff64a8480e657ea84150
  commit: 9b5993f5ce75ed55abdda1964cc3b7c7f1e53cf1
  against: "The last reading's two findings are both fully closed: the false 'three options / the rest are passed over' sentence is now non-exhaustive and drops the closing clause exactly as the suggested edit asked, and the `authority-derived` subsection body is deleted outright, resolving the duplication with `## Answer` the survey and the previous reading both named. One could argue the subsection deletion is a stronger remedy than the previous reading's alternative of 'add a sentence explicitly deferring the fix to `dialogue`'s pending ruling', foreclosing that option rather than choosing between the two it offered; but the record's own encoding rule quoted in this brief is unconditional ('The option named by `stands` omits its subsection'), so outright deletion is the correct fix and not merely one of two equally valid choices. No new false claim, contradiction, or stale pin is introduced by this diff."
  survey:
    date: 2026-09-07
    of: d8988dc14cd0be091955ff64a8480e657ea84150
    commit: edc5af91d942319c12174309e388a244de61fa52
    text:
      question: "881f5bf6246e5981e828267cd2eaefd4af061eee8cc8df62462cb4182f4fa53a"
      answer: "23796368e74992646e4fd44a3abd4760f6614dc953569f78acd5e6ed498c67a2"
      options: "eefbc92e71568c74c190a911820e36d1f3fd315966ca0e701f52a87c9b43a488"
      rivals: "ef659d7dbb41a1d6251e5d97149c1d8fe3c7d7d791a1470dcd5d9c3c5581c444"
      words: "38a411dc3cca5dca5fe5be8073b93e6837c3d9304d6d19199386e99266145385"
    findings:
      - finding: "Two live options on `quotes`' answer fact are written in vocabulary `authority` has struck and would restore the thing the vocabulary named. `ruling-stays-in-node` reads \"A ratified stamp whose ruling is not in the node is invalid, and the ruling a stamp requires is the one the author gives at that sitting, quoted then; words the author said earlier are the ground a draft rests on and bar no stamp.\" and `the-quotation-is-copied-onto-every-option` reads \"A ratified stamp whose ruling is not in the record is invalid, and the ruling a stamp requires is the one the author gives at that sitting, entered in the ledger then and referenced by the option ruled on\". `authority`'s answer holds that \"Every answer carries its authority in the rulings recorded on its facts, and no stamp is written beside them\" and that \"the deferred stamps the bootstrap wrote were unanswered, as the author classified them on 2026-09-03, and the record no longer carries them\". Neither option carries a `status`, so both are live and either is one ruling from contradicting doctrine."
        kind: "contradiction"
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
          - "commons.systems/disposition-graph/authority"
          - "commons.systems/disposition-graph/quotes"
          - "commons.systems/disposition-graph/what-an-option-row-carries"
    pairs:
      - with: "commons.systems/disposition-graph/acceptance-sampling-and-all-or-none"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/alignment-order"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/alignment-page"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/alignment-target"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/anchoring-and-adjustment"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/appellate-review-en-banc"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/approval-directed-agents"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/aristotle-hexis"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/attention"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "parent:commons.systems/disposition-graph/model"
          - "cites"
      - with: "commons.systems/disposition-graph/audience"
        keys:
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/author-questions"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/authors-words-on-the-page"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/bentham-publicity"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/blocking-and-canopies"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/bootstrap-exit-conditions"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/brooks-surgical-team"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/capture"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/capture-traditions"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/change-reviewed-as-a-diff"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/checkpoint"
        keys:
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/chenery-reasoned-decision"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/chestertons-fence"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/class-recommendation"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:capture-shaped (defines: commons.systems/disposition-graph/class-recommendation)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:expensive (defines: commons.systems/disposition-graph/class-recommendation)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/clean-context-review"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/codd-update-anomaly"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/coverage"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/decomposition"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/delegation"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "term:subagent (defines: commons.systems/disposition-graph/delegation)"
          - "cites"
      - with: "commons.systems/disposition-graph/delegation-bounds-and-sizing"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/deprecation-not-deletion"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/dialogue"
        keys:
          - "term:account (defines: commons.systems/disposition-graph/dialogue)"
          - "term:alternative (defines: commons.systems/disposition-graph/dialogue)"
          - "term:answer (defines: commons.systems/disposition-graph/dialogue)"
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:confirmed (defines: commons.systems/disposition-graph/dialogue)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:dialogue (defines: commons.systems/disposition-graph/dialogue)"
          - "term:dialogue state (defines: commons.systems/disposition-graph/dialogue)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:draft (defines: commons.systems/disposition-graph/dialogue)"
          - "term:fact (defines: commons.systems/disposition-graph/dialogue)"
          - "term:persistence (defines: commons.systems/disposition-graph/dialogue)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "term:recommendation (defines: commons.systems/disposition-graph/dialogue)"
          - "term:ruling (defines: commons.systems/disposition-graph/dialogue)"
          - "term:stage (defines: commons.systems/disposition-graph/dialogue)"
          - "term:standing answer (defines: commons.systems/disposition-graph/dialogue)"
          - "words:words/2026-09-03/28"
          - "words:words/2026-09-03/29"
          - "cites"
      - with: "commons.systems/disposition-graph/dissent-and-reconsideration"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/domain-assumptions-reading"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/dry-single-source-of-truth"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/evaluation"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:greenfield (defines: commons.systems/disposition-graph/evaluation)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/event-sourcing-derived-view"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/event-sourcing-with-snapshots"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/fagan-entry-criteria"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/fagan-inspection-roles"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/fidelity"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/file-drawer-and-pre-registration"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/form-vocabulary"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/forms"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/frontier-consistency"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:frontier survey (defines: commons.systems/disposition-graph/frontier-consistency)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/frontier-metrics"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/graph-topology"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/growth"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:boldness (defines: commons.systems/disposition-graph/growth)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:periagogic (defines: commons.systems/disposition-graph/growth)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "term:ratify (defines: commons.systems/disposition-graph/growth)"
          - "parent:commons.systems/disposition-graph/model"
          - "cites"
      - with: "commons.systems/disposition-graph/hansard-verbatim-record"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/harness-tradition"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/hexis"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/how-a-fact-is-headed"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/ibis-issue-based-information"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/information-hiding"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/instruments"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:check (defines: commons.systems/disposition-graph/instruments)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:evidence (defines: commons.systems/disposition-graph/instruments)"
          - "term:instrument (defines: commons.systems/disposition-graph/instruments)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "parent:commons.systems/disposition-graph/model"
          - "cites"
      - with: "commons.systems/disposition-graph/knowledge-store"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/legacy"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "parent:commons.systems/disposition-graph/model"
          - "cites"
      - with: "commons.systems/disposition-graph/legislative-amendment-in-context"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/level-triggered-reconciliation"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/lint-and-the-false-positive-threshold"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/literate-programming"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/lockfile"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/madr-decision-records"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/mapreduce-and-cross-shard-blindness"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/master-detail-selection"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/materialization"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "parent:commons.systems/disposition-graph/model"
      - with: "commons.systems/disposition-graph/model"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:disposition (defines: commons.systems/disposition-graph/model)"
          - "term:node (defines: commons.systems/disposition-graph/model)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/montgomery-informed-consent"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/multi-call-binary-and-facade"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/n-version-programming"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/namespaces"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "parent:commons.systems/disposition-graph/model"
      - with: "commons.systems/disposition-graph/nielsen-user-control-and-freedom"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/node"
        keys:
          - "term:answer (defines: commons.systems/disposition-graph/node)"
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:form (defines: commons.systems/disposition-graph/node)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:question (defines: commons.systems/disposition-graph/node)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "term:rationale (defines: commons.systems/disposition-graph/node)"
          - "parent:commons.systems/disposition-graph/model"
          - "cites"
      - with: "commons.systems/disposition-graph/non-liquet"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/none-of-the-above-ballot"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/not-proven-third-verdict"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/notarial-minute"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/npm-committed-lockfile"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/ocap-attenuation"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/operation-naming-in-telemetry"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/pareto-frontier"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/peirce-paper-doubt"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/persistence"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "parent:commons.systems/disposition-graph/model"
      - with: "commons.systems/disposition-graph/plato-maieutics"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/plato-periagoge"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/probe-or-node"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/progressive-disclosure"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/projection"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:projection (defines: commons.systems/disposition-graph/projection)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "parent:commons.systems/disposition-graph/model"
          - "cites"
      - with: "commons.systems/disposition-graph/promotor-fidei"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/prose-and-structure"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/purpose"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/purpose-criteria"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/quotes"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:ledger (defines: commons.systems/disposition-graph/quotes)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/rationale-edge"
        keys:
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/readings"
        keys:
          - "term:adopted (defines: commons.systems/disposition-graph/readings)"
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "term:reading (defines: commons.systems/disposition-graph/readings)"
          - "parent:commons.systems/disposition-graph/model"
      - with: "commons.systems/disposition-graph/reconciliation-reading"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/recording"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:confirmation (defines: commons.systems/disposition-graph/recording)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/regression-test-selection"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/rejected"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/review"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "term:review (defines: commons.systems/disposition-graph/review)"
      - with: "commons.systems/disposition-graph/review-approval-pinned-to-a-revision"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/review-cost"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/review-model"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/review-skills"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/rfc-pep-status-field"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/roberts-rules-commit-or-refer"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/rsi"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "parent:commons.systems/disposition-graph/model"
      - with: "commons.systems/disposition-graph/ruling-transport"
        keys:
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/scholarly-peer-review"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/scholastic-articulus"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/scope"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/second-stop"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "parent:commons.systems/disposition-graph/model"
      - with: "commons.systems/disposition-graph/segregation-of-duties"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/self-contained-specification"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/self-documentation"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/session-context"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "term:rules (defines: commons.systems/disposition-graph/session-context)"
          - "cites"
      - with: "commons.systems/disposition-graph/single-subject-rule"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/software-factories"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/spec-driven-development"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/special-verdict-form"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/srs-introduction"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/stub-traditions"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/survey-selection"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/the-wrong-abstraction"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/tier"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/tolerated-inconsistency"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/traditions-home"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/transience"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:persistence (defines: commons.systems/disposition-graph/transience)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "term:shim (defines: commons.systems/disposition-graph/transience)"
          - "term:standing (defines: commons.systems/disposition-graph/transience)"
          - "term:un-aligned disposition (defines: commons.systems/disposition-graph/transience)"
          - "parent:commons.systems/disposition-graph/model"
          - "cites"
      - with: "commons.systems/disposition-graph/turn-form"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/un-aligned-children"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/unanswered"
        keys:
          - "term:answered (defines: commons.systems/disposition-graph/unanswered)"
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "term:unanswered (defines: commons.systems/disposition-graph/unanswered)"
          - "words:words/2026-09-03/29"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/unconfirmed-accumulation"
        keys:
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/under"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:ceiling (defines: commons.systems/disposition-graph/under)"
          - "term:context (defines: commons.systems/disposition-graph/under)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:rank (defines: commons.systems/disposition-graph/under)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "term:under (defines: commons.systems/disposition-graph/under)"
          - "parent:commons.systems/disposition-graph/model"
          - "cites"
      - with: "commons.systems/disposition-graph/unit-skills"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/utility-syntax-flag-or-subcommand"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/validation-order"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/value-of-information"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/verifying-traces-and-early-cutoff"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/viable-options"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:grant (defines: commons.systems/disposition-graph/viable-options)"
          - "term:option (defines: commons.systems/disposition-graph/viable-options)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "term:viable (defines: commons.systems/disposition-graph/viable-options)"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/vocabulary-option-summary"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/vocabulary-view"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/web-routing"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/what-acts-during-bootstrap"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:bootstrap (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
          - "term:bootstrap authority (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
          - "term:bootstrap exit (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/what-an-option-row-carries"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/when-the-kickback-feedback-shows"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/where-a-change-request-goes"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/where-the-unconfirmed-indication-goes"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/which-facts-are-listed"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/work-loop"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:frontier (defines: commons.systems/disposition-graph/work-loop)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "parent:commons.systems/disposition-graph/model"
          - "cites"
      - with: "commons.systems/public/agency"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:capture (defines: commons.systems/public/agency)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/public/aristotle-arche-of-action"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/public/pettit-non-domination"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:proposal (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
facts:
  - name: answer
    options:
      - name: stamped-classes
        source: ai
        ref: "2026-09-03"
      - name: bootstrap-authority-as-class
        source: ai
        ref: "2026-09-03"
        status: passed
        reason: "the recommendation answers the class question with a rule of this node, the explicit grant, which is no class"
      - name: clause-level-ratification
        source: review
        ref: "2026-09-03"
        status: passed
        reason: "discharged by the facts encoding, under which a ruling is recorded per fact"
      - name: ceiling-moves-here
        source: review
        ref: "2026-09-03"
      - name: authority-derived
        source: author
        ref: "2026-09-04"
        supports:
          - words/2026-09-04/22
      - name: out-of-scope-answers-as-deferred
        source: ai
        ref: "1920badc"
        status: passed
        reason: "deferred still acts, so the record would act on an answer no ruling grants"
      - name: proposal-as-an-authority-class
        source: ai
        ref: "6d21d356"
        status: passed
        reason: "a class with no authority is a review-queue label, and the deferred stamp already is that queue"
      - name: proposal-as-any-recorded-candidate
        source: ai
        ref: "6d21d356"
        status: passed
        reason: "it overloads a term the author reserves for the outside-alignment case"
      - name: escalate-toward-ratified
        source: commons.systems/disposition-graph/recording
        ref: "2026-09-04"
      - name: ratify-command
        source: ai
        ref: "2026-09-02"
        status: passed
        reason: "the author: ratification is not a rubber stamp; the command stamped under the identity every session commits with and made the act a keystroke"
      - name: no-census-in-a-standing-answer
        source: commons.systems/disposition-graph/class-recommendation
        ref: "2026-09-05"
      - name: authority-per-clause-by-a-child-node
        source: commons.systems/disposition-graph/delegation-bounds-and-sizing
        ref: "2026-09-05"
      - name: a-conferred-class-acts-during-bootstrap
        source: commons.systems/disposition-graph/what-acts-during-bootstrap
        ref: "2026-09-05"
      - name: no-census-anywhere-in-a-node
        source: review
        ref: "2026-09-05"
      - name: the-ruling-is-quoted-in-the-record-and-referenced-by-the-option
        source: commons.systems/disposition-graph/quotes
        ref: "2026-09-07"
        supports:
          - words/2026-09-02/3
          - words/2026-09-08/22
          - words/2026-09-02/4
          - words/2026-09-03/26
          - words/2026-09-03/27
          - words/2026-09-03/28
          - words/2026-09-03/29
    recommends: the-ruling-is-quoted-in-the-record-and-referenced-by-the-option
    boldness: moderate
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
form: rule
under:
  - commons.systems/disposition-graph/model
tier: global
instrument:
  kind: check
  ref: "the reader derives every node's class from the rulings on its facts and rejects a node carrying a stamp key, `packages/disposition/read.mjs` and `derive.mjs`, run by the validator on every landing"
  note: guards the derivation and the absence of stamps; that a ruling's words are in the record is checked by nothing yet, which is owed on the quotes node
defines:
  - term: authority
    gloss: "The standing that lets a recorded answer act, conferred only by a ruling of the author's on one of a node's facts and never by a mark, a command, or a class the AI writes for itself."
  - term: ratified
    gloss: "Ratified means the author ruled on the answer fact, in the alignment dialogue after its dialectic, and wants to be asked before it changes; the confirmed choice acts. A ruling of ratified on the authority fact is a different act: it says the answer must be ratified, confers nothing until the answer fact is ruled, and stops an ancestor's delegation from reaching that node, though not from reaching the nodes beneath it."
  - term: delegated
    gloss: "Delegated means the author ruled delegated on the authority fact: the recommendation acts, the delegation covers the class of decision it names below the node, and the author does not want to be asked again."
  - term: deferred
    gloss: "Deferred means the author ruled deferred on the authority fact: the recommendation acts, and the node stays on the alignment frontier until the author returns to it."
  - doctrine
  - proposal
depends:
  - commons.systems/disposition-graph/viable-options#adopted-is-a-status
  - commons.systems/disposition-graph/unanswered
  - commons.systems/disposition-graph/quotes#words-in-a-ledger-on-the-ref
---

## Facts

### answer

`the-ruling-is-quoted-in-the-record-and-referenced-by-the-option` is recommended since 2026-09-07: it is `authority-derived` with one sentence amended, that the words earning a ruling are entered in the ledger and referenced by the option ruled on, following `quotes`' recommendation of the ledger, which the author has put up for confirmation, so that it stands or falls with that ruling. Its support and divergence are under its subsection; the options recorded on this fact since the reading of 2026-09-05 stay viable beside it, each as its subsection says, and none is passed over by this amendment. What follows is the reason `authority-derived` was recommended on, which the amendment carries.

`authority-derived` was recommended until then, at moderate boldness. The derivation of the class from the rulings, the grant that does not expire, and the proposal as a state of a ratified node are the author's words of 2026-09-04; the strike of the 2026-09-03 expiry against the words of that day, the list of a move's origins, the return of a proposal to the review stage, the rule that a ruling of ratified on the authority fact is a different act, together with the two further rules of the derivation the third reading found unstated, all three read off `derive.mjs` and supported by no words of the author's, the widening of the scope sentence to a move on any node within the class's scope and to the passing over of an option the AI wrote, and the citations of what acts during bootstrap and of what class the AI recommends are the AI's. Among the options viable beside it are `stamped-classes`, the mark stored on the node if the author prefers it; `ceiling-moves-here`, which is not dominated; and `escalate-toward-ratified`, whose rule left this answer on 2026-09-05 for the node `class-recommendation`, where it is the recommendation, and which stays on the list because no candidate leaves it, shown as moved rather than passed over once the `adopted-is-a-status` option on the viable-options node is ruled, which `depends` names.

#### stamped-classes

The answer as it stood from 2026-09-02 to 2026-09-04: every answer carries a stamp naming who holds it, with what class, and since when; ratified, delegated and deferred are the stamp's classes, deferred being what the AI writes for itself; a proposal is a conflicting answer arising outside alignment, which opens the node's dialogue at the periagogic stage; and bootstrap authority is a shim that expires at bootstrap exit. Viable if the author prefers the mark of authority stored on the node to a class read off its rulings.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Who may change an answer?
form: rule
under:
  - commons.systems/disposition-graph/model
tier: global
instrument:
  kind: check
  ref: "the reader derives every node's class from the rulings on its facts and rejects a node carrying a stamp key, `packages/disposition/read.mjs` and `derive.mjs`, run by the validator on every landing"
  note: guards the derivation and the absence of stamps; that a ruling's words are in the record is checked by nothing yet, which is owed on the quotes node
defines:
  - term: authority
    gloss: "The standing that lets a recorded answer act, conferred only by a ruling of the author's on one of a node's facts and never by a mark, a command, or a class the AI writes for itself."
  - term: ratified
    gloss: "Ratified means the author ruled on the answer fact, in the alignment dialogue after its dialectic, and wants to be asked before it changes; the confirmed choice acts. A ruling of ratified on the authority fact is a different act: it says the answer must be ratified, confers nothing until the answer fact is ruled, and stops an ancestor's delegation from reaching that node, though not from reaching the nodes beneath it."
  - term: delegated
    gloss: "Delegated means the author ruled delegated on the authority fact: the recommendation acts, the delegation covers the class of decision it names below the node, and the author does not want to be asked again."
  - term: deferred
    gloss: "Deferred means the author ruled deferred on the authority fact: the recommendation acts, and the node stays on the alignment frontier until the author returns to it."
  - doctrine
  - proposal
---

## Answer

The answer as it stood from 2026-09-02 to 2026-09-04: every answer carries a stamp naming who holds it, with what class, and since when; ratified, delegated and deferred are the stamp's classes, deferred being what the AI writes for itself; a proposal is a conflicting answer arising outside alignment, which opens the node's dialogue at the periagogic stage; and bootstrap authority is a shim that expires at bootstrap exit. Viable if the author prefers the mark of authority stored on the node to a class read off its rulings.
```

#### bootstrap-authority-as-class

Recorded on the node as a tension the sitting did not decide. Bootstrap authority is declared here as a shim, but it is a standing permission exercised only when the author invokes it, not a stopgap artifact applied by default, which is what evaluation's shim rule describes. Either the shim vocabulary covers two kinds, or bootstrap authority is a second class of authority beside ratified, delegated and deferred, which this node's answer would then have to define. The author's words of 2026-09-03 named it a shim and their words of 2026-09-04 name it a persistent disposition about reconciliation authority; passed over because the recommendation answers the class question with the rule, which is a rule of this node and no class.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Who may change an answer?
form: rule
under:
  - commons.systems/disposition-graph/model
tier: global
instrument:
  kind: check
  ref: "the reader derives every node's class from the rulings on its facts and rejects a node carrying a stamp key, `packages/disposition/read.mjs` and `derive.mjs`, run by the validator on every landing"
  note: guards the derivation and the absence of stamps; that a ruling's words are in the record is checked by nothing yet, which is owed on the quotes node
defines:
  - term: authority
    gloss: "The standing that lets a recorded answer act, conferred only by a ruling of the author's on one of a node's facts and never by a mark, a command, or a class the AI writes for itself."
  - term: ratified
    gloss: "Ratified means the author ruled on the answer fact, in the alignment dialogue after its dialectic, and wants to be asked before it changes; the confirmed choice acts. A ruling of ratified on the authority fact is a different act: it says the answer must be ratified, confers nothing until the answer fact is ruled, and stops an ancestor's delegation from reaching that node, though not from reaching the nodes beneath it."
  - term: delegated
    gloss: "Delegated means the author ruled delegated on the authority fact: the recommendation acts, the delegation covers the class of decision it names below the node, and the author does not want to be asked again."
  - term: deferred
    gloss: "Deferred means the author ruled deferred on the authority fact: the recommendation acts, and the node stays on the alignment frontier until the author returns to it."
  - doctrine
  - proposal
---

## Answer

Recorded on the node as a tension the sitting did not decide. Bootstrap authority is declared here as a shim, but it is a standing permission exercised only when the author invokes it, not a stopgap artifact applied by default, which is what evaluation's shim rule describes. Either the shim vocabulary covers two kinds, or bootstrap authority is a second class of authority beside ratified, delegated and deferred, which this node's answer would then have to define. The author's words of 2026-09-03 named it a shim and their words of 2026-09-04 name it a persistent disposition about reconciliation authority; passed over because the recommendation answers the class question with the rule, which is a rule of this node and no class.
```

#### clause-level-ratification

A frontier finding carried on this node observes that the author ruled clause by clause on growth — 'Ratified on the rule. Ratified on the shim.' — while the record gives a node one stamp, so a ruling the author has given is recorded nowhere and the author will be asked for it again. The finding says that whether a clause can be ratified separately is a question for this node and should be minted here. The alternative is an answer that lets a stamp attach to a named clause rather than to the whole node. Also raised on commons.systems/disposition-graph/growth. Passed over because the facts encoding discharges it: a ruling is recorded per fact, and 'Ratified on the rule. Ratified on the shim.' is a ruling on growth's answer fact and one on its persistence fact.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Who may change an answer?
form: rule
under:
  - commons.systems/disposition-graph/model
tier: global
instrument:
  kind: check
  ref: "the reader derives every node's class from the rulings on its facts and rejects a node carrying a stamp key, `packages/disposition/read.mjs` and `derive.mjs`, run by the validator on every landing"
  note: guards the derivation and the absence of stamps; that a ruling's words are in the record is checked by nothing yet, which is owed on the quotes node
defines:
  - term: authority
    gloss: "The standing that lets a recorded answer act, conferred only by a ruling of the author's on one of a node's facts and never by a mark, a command, or a class the AI writes for itself."
  - term: ratified
    gloss: "Ratified means the author ruled on the answer fact, in the alignment dialogue after its dialectic, and wants to be asked before it changes; the confirmed choice acts. A ruling of ratified on the authority fact is a different act: it says the answer must be ratified, confers nothing until the answer fact is ruled, and stops an ancestor's delegation from reaching that node, though not from reaching the nodes beneath it."
  - term: delegated
    gloss: "Delegated means the author ruled delegated on the authority fact: the recommendation acts, the delegation covers the class of decision it names below the node, and the author does not want to be asked again."
  - term: deferred
    gloss: "Deferred means the author ruled deferred on the authority fact: the recommendation acts, and the node stays on the alignment frontier until the author returns to it."
  - doctrine
  - proposal
---

## Answer

A frontier finding carried on this node observes that the author ruled clause by clause on growth — 'Ratified on the rule. Ratified on the shim.' — while the record gives a node one stamp, so a ruling the author has given is recorded nowhere and the author will be asked for it again. The finding says that whether a clause can be ratified separately is a question for this node and should be minted here. The alternative is an answer that lets a stamp attach to a named clause rather than to the whole node. Also raised on commons.systems/disposition-graph/growth. Passed over because the facts encoding discharges it: a ruling is recorded per fact, and 'Ratified on the rule. Ratified on the shim.' is a ruling on growth's answer fact and one on its persistence fact.
```

#### ceiling-moves-here

The decomposition finding proposes that under survive as the edge alone and that three of the four terms it defines move to the nodes that answer them, rank to attention, context to session-context, and ceiling to authority, whose answer already carries the scope rule the term names: that a node's ceiling is its nearest ratified ancestor and nothing recorded under it may contradict it. Verified: under's defines carries ceiling and authority's does not, and authority is not among the nodes the finding names, so the proposed change to its defines is recorded nowhere on it. The cross-reference finding adds that ceiling and up-to-the-roots are two different rules for the reviewer's world, coinciding today only because nothing is ratified. Raised on commons.systems/disposition-graph/rationale-edge, commons.systems/disposition-graph/session-context, commons.systems/disposition-graph/attention, commons.systems/disposition-graph/under. Viable and not chosen: the answer's sentence that authority only narrows on the way down is the ceiling rule under another name and `defines` here still lacks the term, so the move is not dominated; it is the under node's to lose and this node's to gain, and neither has answered it.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Who may change an answer?
form: rule
under:
  - commons.systems/disposition-graph/model
tier: global
instrument:
  kind: check
  ref: "the reader derives every node's class from the rulings on its facts and rejects a node carrying a stamp key, `packages/disposition/read.mjs` and `derive.mjs`, run by the validator on every landing"
  note: guards the derivation and the absence of stamps; that a ruling's words are in the record is checked by nothing yet, which is owed on the quotes node
defines:
  - term: authority
    gloss: "The standing that lets a recorded answer act, conferred only by a ruling of the author's on one of a node's facts and never by a mark, a command, or a class the AI writes for itself."
  - term: ratified
    gloss: "Ratified means the author ruled on the answer fact, in the alignment dialogue after its dialectic, and wants to be asked before it changes; the confirmed choice acts. A ruling of ratified on the authority fact is a different act: it says the answer must be ratified, confers nothing until the answer fact is ruled, and stops an ancestor's delegation from reaching that node, though not from reaching the nodes beneath it."
  - term: delegated
    gloss: "Delegated means the author ruled delegated on the authority fact: the recommendation acts, the delegation covers the class of decision it names below the node, and the author does not want to be asked again."
  - term: deferred
    gloss: "Deferred means the author ruled deferred on the authority fact: the recommendation acts, and the node stays on the alignment frontier until the author returns to it."
  - doctrine
  - proposal
---

## Answer

The decomposition finding proposes that under survive as the edge alone and that three of the four terms it defines move to the nodes that answer them, rank to attention, context to session-context, and ceiling to authority, whose answer already carries the scope rule the term names: that a node's ceiling is its nearest ratified ancestor and nothing recorded under it may contradict it. Verified: under's defines carries ceiling and authority's does not, and authority is not among the nodes the finding names, so the proposed change to its defines is recorded nowhere on it. The cross-reference finding adds that ceiling and up-to-the-roots are two different rules for the reviewer's world, coinciding today only because nothing is ratified. Raised on commons.systems/disposition-graph/rationale-edge, commons.systems/disposition-graph/session-context, commons.systems/disposition-graph/attention, commons.systems/disposition-graph/under. Viable and not chosen: the answer's sentence that authority only narrows on the way down is the ceiling rule under another name and `defines` here still lacks the term, so the move is not dominated; it is the under node's to lose and this node's to gain, and neither has answered it.
```

#### authority-derived

Every answer carries its authority in the rulings recorded on its facts, and no stamp is written beside them: a node's class is read off those rulings, and a node no ruling grants is unanswered, as the unanswered node says.

**AI support.** Attenuation: authority only narrows as it is handed down, never widens, so a breakout would have to be written up the tree, and nothing writes up. The ratify command the record carried on 2026-09-02 is the option `ratify-command`, passed over on the author's words quoted there. The readings that bear here are `ocap-attenuation`, for the rule that authority only narrows, and `approval-directed-agents`, for deferred as action under a review that is owed, both under the viable-options node and bearing on `authority-derived`; ultra vires with enabling acts, and delegation containment in cgroup v2, were surfaced on 2026-09-02 and are owed as readings.

The author, 2026-09-03, on the bootstrap ledger: "The ledger is a shim, it shouldn't receive standing disposition. Ratified as a shim. The standing disposition (ratified) is that ratification happens only through alignment dialogue." And later that day: "The ledger is expected to be sunset and encoded as deferred dispositions. I am concerned that it has not been, I am concerned about drift between the ledger and the greenfield graph." The ledger shim declared here on 2026-09-02 was liquidated on 2026-09-03: every entry was sorted, by the survey `bootstrap/ledger-migration-survey-2026-09-03.md` on the implementation ref and by the session for the entries after it, into a node amendment, a shim declaration, an un-aligned disposition, or nothing, and the file was deleted. While it stood no stamp was ratified, and none is yet; the first ratified stamps are those the sitting on purpose writes.

The author, 2026-09-03, in the sitting on the dialogue node, quoted above, narrowed the word proposal: the draft of this node had defined it as any candidate answer, amendment, or finding with no authority, recorded in a stamped node or in a sitting's record, and the author ruled that the term is technical vocabulary for a conflicting answer arising outside alignment, that it must not be overloaded, and that conflicting answers evaluated in alignment are recorded differently, as alternatives in the dialogue state. The same day the author ruled that a standing answer of any class, ratified, delegated, or deferred, keeps its full authority while an alternative is pending, and that a proposal from outside alignment opens the dialogue on its node. This answer was written from the draft under the author's bootstrap grant on the dialogue node, folding the draft's text into the standing answer with the narrowing; the ratified stamp the draft carried is what a confirmation confers and is not written before it.

Amended 2026-09-04 under the author's bootstrap grant of that day, recorded on the viable-options node, from the author's words there: "Is 'unanswered' just an authority - as in no authority granted for reconciliation. Or, more precicely, explicit bootstrap authority required for reconciliation - in this way bootstrap authority is not a shim, but a persistent disposition about reconciliation authority." The stamp goes because the record stores the ruling on the fact with its response, date and pin, and a stamp beside it is a copy that drifts, the reason the unanswered node gave for deriving the status; deferred becomes a class the author confers, since every class in this record traces to a ruling and, as this answer already said, no command confers one. The bootstrap-authority shim declared here on 2026-09-03 is liquidated into the standing rule above, which strikes its expiry at bootstrap exit against the author's words of that day quoted above: a rule that reconciles an unanswered node only on the author's explicit word is the right rule at any time and not a bootstrap expedient, and the author may strike this line; `bootstrap-authority-as-class` is thereby decided in favour of the rule. The word proposal keeps what the author's narrowing of 2026-09-03 fixed, that it is technical vocabulary and not overloaded, and takes its definition from the author's words of 2026-09-04, quoted above, which supersede the origin in their words of 2026-09-03: a proposal is a state of a ratified node and not an origin, the origin being the option's source. Four nodes still cite this node for the origin definition: transience's standing answer, node's recommended `four-form-draft`, growth's standing answer and its recommended `boldness-reversed`, and frontier-consistency's validation 2 in both its standing answer and its recommended `split-survey-from-per-draft`, where the rule this node's own reading runs under becomes unreadable. The same move is recorded on each as the option `proposal-as-a-state-of-a-ratified-node`. The test the AI applies when it recommends a class, recorded here on 2026-09-04 as the option `escalate-toward-ratified` from the recording node's reading, is absorbed into the answer and the option kept, marked as adopted, since no candidate leaves the list: the rule lived in the alignment skill alone, a shim, while the nodes whose authority fact rests on it cite it as the record's own test, and a rule the record applies is stated where the classes are defined. The answer as it stood is kept as the option `stamped-classes`, and the review of this text is owed.

Amended 2026-09-05, after the second reading of that day. Three moves, each the
AI's. The rule that a ruling of ratified on the authority fact is a different
act, saying the answer must be ratified and conferring nothing until the answer
fact is ruled, was read off `classAndSource` in `packages/disposition/derive.mjs`
and is supported by no words of the author's; it is stated here because a class
the record computes and the answer does not define is a definition completed in
code, which is the capture shape this node's own escalation test names, and the
third reading of 2026-09-05 found two further rules of that walk unstated and
they are now in the answer with it. The scope sentence was widened, to a move of
a fact's recommendation on any node within the scope its class allows and the
passing over of an option the AI itself wrote, because as it stood it forbade
the move that produced this amendment and six of this node's own options carry
a status it forbade the AI to write. And the bootstrap clause left this node for
`what-acts-during-bootstrap`, because the question of what acts while nothing is
ratified survives the recording, is cited by sessions that never saw it asked,
and is not answered by a definition of the classes. The escalation test left the
same day and for the same reasons, to `class-recommendation`, the third reading
having found that the test which minted the first node reaches it with more
force.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Who may change an answer?
form: rule
under:
  - commons.systems/disposition-graph/model
tier: global
instrument:
  kind: check
  ref: "the reader derives every node's class from the rulings on its facts and rejects a node carrying a stamp key, `packages/disposition/read.mjs` and `derive.mjs`, run by the validator on every landing"
  note: guards the derivation and the absence of stamps; that a ruling's words are in the record is checked by nothing yet, which is owed on the quotes node
defines:
  - term: authority
    gloss: "The standing that lets a recorded answer act, conferred only by a ruling of the author's on one of a node's facts and never by a mark, a command, or a class the AI writes for itself."
  - term: ratified
    gloss: "Ratified means the author ruled on the answer fact, in the alignment dialogue after its dialectic, and wants to be asked before it changes; the confirmed choice acts. A ruling of ratified on the authority fact is a different act: it says the answer must be ratified, confers nothing until the answer fact is ruled, and stops an ancestor's delegation from reaching that node, though not from reaching the nodes beneath it."
  - term: delegated
    gloss: "Delegated means the author ruled delegated on the authority fact: the recommendation acts, the delegation covers the class of decision it names below the node, and the author does not want to be asked again."
  - term: deferred
    gloss: "Deferred means the author ruled deferred on the authority fact: the recommendation acts, and the node stays on the alignment frontier until the author returns to it."
  - doctrine
  - proposal
---

## Answer

Every answer carries its authority in the rulings recorded on its facts, and no stamp is written beside them: a node's class is read off those rulings, and a node no ruling grants is unanswered, as the unanswered node says. Ratified means the author ruled on the answer fact, in the alignment dialogue after its dialectic, and wants to be asked before it changes; the confirmed choice acts. Ratification happens only through that dialogue: the session that ran the sitting records the ruling on the option the author chose, with the response, the date, and the pin of the recommendation it answered, and the words that earned it are quoted in the node; a ruling whose words are not in the node is invalid; transcribing the author's words from any other record confers nothing, and no command does, since a script that rules on request is a rubber stamp and the guard against rubber stamps is the dialectic itself, whose steps the round accounts for. Delegated means the author ruled delegated on the authority fact: the recommendation acts, the delegation covers the class of decision it names below the node, and the author does not want to be asked again. Deferred means the author ruled deferred on the authority fact: the recommendation acts, and the node stays on the alignment frontier until the author returns to it. A ruling of ratified on the authority fact is a different act from a ratification: it says the answer must be ratified, so it confers nothing until the answer fact is ruled, and it stops an ancestor's delegation from reaching that node. It stops it for that node alone: the walk continues past it, so a delegation ruled further up reaches the nodes beneath, and sealing a subtree takes a ruling on each node in it. Where a node refines more than one question and two ancestors at the same distance confer different classes, the narrower acts. A ruling on an ancestor grants the decisions its scope covers to the nodes beneath it, and authority only narrows on the way down. A class the AI writes for itself is not a grant: the deferred stamps the bootstrap wrote were unanswered, as the author classified them on 2026-09-03, and the record no longer carries them. Unanswered means no ruling grants the node: nothing on it acts, and reconciling anything under it takes an explicit grant from the author, given in their words and never assumed, never read from the announcement of one, and never carried into a later sitting; the grant's unit is the alignment sitting, which it reaches whole, and what it licenses within one is the question of the node beneath this one, what-acts-during-bootstrap; that is a standing rule of this record and not a shim, and it does not expire. Doctrine is the ratified answers taken together. A confirmed choice of any class keeps its full authority while an option is pending beside it, until the author rules for another. A proposal is technical vocabulary and is not overloaded: it is the state of a ratified node whose recommendation has moved from its confirmed choice, wherever the move came from, the origin being the option's source, evidence, a signal, an instrument, a criterion, a conflict identified in reconciliation, or the loop on itself. In that state the confirmed choice keeps its full authority and the node returns to the alignment frontier for re-confirmation, at the movement the recording node's classification calls for, the review where only the recommendation moved. The AI exercises authority within scope: it may answer under a ratified ancestor, may add an option to any fact, may pass an option over and lift a status it wrote, may move a fact's recommendation on any node within the scope its class allows, what a move does being read from the class as the evaluation node says, and records anything that would contradict doctrine or exceed its scope as an option on the node it conflicts with, which acts on nothing until the author rules; an option that would leave a delegation's scope returns that node to the author with its class intact. What class the AI recommends on a node's authority fact is the question of the node beneath this one, class-recommendation; what it recommends there is a recommendation and confers nothing. During bootstrap no class acts; neither a declared shim nor the author's grant names a class, and what does act while nothing is ratified, and how that state ends, is the question of the node beneath this one, what-acts-during-bootstrap.
```

#### out-of-scope-answers-as-deferred

An answer the AI writes beyond its scope is recorded in the deferred class
rather than held as an option. It was passed over because deferred still acts.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Who may change an answer?
form: rule
under:
  - commons.systems/disposition-graph/model
tier: global
instrument:
  kind: check
  ref: "the reader derives every node's class from the rulings on its facts and rejects a node carrying a stamp key, `packages/disposition/read.mjs` and `derive.mjs`, run by the validator on every landing"
  note: guards the derivation and the absence of stamps; that a ruling's words are in the record is checked by nothing yet, which is owed on the quotes node
defines:
  - term: authority
    gloss: "The standing that lets a recorded answer act, conferred only by a ruling of the author's on one of a node's facts and never by a mark, a command, or a class the AI writes for itself."
  - term: ratified
    gloss: "Ratified means the author ruled on the answer fact, in the alignment dialogue after its dialectic, and wants to be asked before it changes; the confirmed choice acts. A ruling of ratified on the authority fact is a different act: it says the answer must be ratified, confers nothing until the answer fact is ruled, and stops an ancestor's delegation from reaching that node, though not from reaching the nodes beneath it."
  - term: delegated
    gloss: "Delegated means the author ruled delegated on the authority fact: the recommendation acts, the delegation covers the class of decision it names below the node, and the author does not want to be asked again."
  - term: deferred
    gloss: "Deferred means the author ruled deferred on the authority fact: the recommendation acts, and the node stays on the alignment frontier until the author returns to it."
  - doctrine
  - proposal
---

## Answer

An answer the AI writes beyond its scope is recorded in the deferred class
rather than held as an option. It was passed over because deferred still acts.
```

#### proposal-as-an-authority-class

Proposal is a fourth authority class beside ratified, delegated and deferred.
It was passed over because a class with no authority is a review-queue label
and the deferred stamp already is that queue.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Who may change an answer?
form: rule
under:
  - commons.systems/disposition-graph/model
tier: global
instrument:
  kind: check
  ref: "the reader derives every node's class from the rulings on its facts and rejects a node carrying a stamp key, `packages/disposition/read.mjs` and `derive.mjs`, run by the validator on every landing"
  note: guards the derivation and the absence of stamps; that a ruling's words are in the record is checked by nothing yet, which is owed on the quotes node
defines:
  - term: authority
    gloss: "The standing that lets a recorded answer act, conferred only by a ruling of the author's on one of a node's facts and never by a mark, a command, or a class the AI writes for itself."
  - term: ratified
    gloss: "Ratified means the author ruled on the answer fact, in the alignment dialogue after its dialectic, and wants to be asked before it changes; the confirmed choice acts. A ruling of ratified on the authority fact is a different act: it says the answer must be ratified, confers nothing until the answer fact is ruled, and stops an ancestor's delegation from reaching that node, though not from reaching the nodes beneath it."
  - term: delegated
    gloss: "Delegated means the author ruled delegated on the authority fact: the recommendation acts, the delegation covers the class of decision it names below the node, and the author does not want to be asked again."
  - term: deferred
    gloss: "Deferred means the author ruled deferred on the authority fact: the recommendation acts, and the node stays on the alignment frontier until the author returns to it."
  - doctrine
  - proposal
---

## Answer

Proposal is a fourth authority class beside ratified, delegated and deferred.
It was passed over because a class with no authority is a review-queue label
and the deferred stamp already is that queue.
```

#### proposal-as-any-recorded-candidate

Proposal names any candidate answer, amendment or finding with no authority,
wherever it was recorded, which is what this node's draft defined. The author
narrowed the word on 2026-09-03; it was passed over because it would have
named the AI's own account and every alternative in a sitting with one word.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Who may change an answer?
form: rule
under:
  - commons.systems/disposition-graph/model
tier: global
instrument:
  kind: check
  ref: "the reader derives every node's class from the rulings on its facts and rejects a node carrying a stamp key, `packages/disposition/read.mjs` and `derive.mjs`, run by the validator on every landing"
  note: guards the derivation and the absence of stamps; that a ruling's words are in the record is checked by nothing yet, which is owed on the quotes node
defines:
  - term: authority
    gloss: "The standing that lets a recorded answer act, conferred only by a ruling of the author's on one of a node's facts and never by a mark, a command, or a class the AI writes for itself."
  - term: ratified
    gloss: "Ratified means the author ruled on the answer fact, in the alignment dialogue after its dialectic, and wants to be asked before it changes; the confirmed choice acts. A ruling of ratified on the authority fact is a different act: it says the answer must be ratified, confers nothing until the answer fact is ruled, and stops an ancestor's delegation from reaching that node, though not from reaching the nodes beneath it."
  - term: delegated
    gloss: "Delegated means the author ruled delegated on the authority fact: the recommendation acts, the delegation covers the class of decision it names below the node, and the author does not want to be asked again."
  - term: deferred
    gloss: "Deferred means the author ruled deferred on the authority fact: the recommendation acts, and the node stays on the alignment frontier until the author returns to it."
  - doctrine
  - proposal
---

## Answer

Proposal names any candidate answer, amendment or finding with no authority,
wherever it was recorded, which is what this node's draft defined. The author
narrowed the word on 2026-09-03; it was passed over because it would have
named the AI's own account and every alternative in a sitting with one word.
```

#### escalate-toward-ratified

Adopted into `authority-derived` on 2026-09-05 and moved out of it the same day, to the node `class-recommendation` under this one, where the rule is the recommendation and the alternative to it is stated; the third reading of 2026-09-05 found that the survival and scope tests which minted `what-acts-during-bootstrap` reach this clause with more force, since it survives the recording, is cited by nineteen nodes, and is read by every session that recommends a class. What the option holds is the rule the node `class-recommendation` states, and the text of the rule is that node's: it was amended there on 2026-09-05, to name the class rather than a direction toward it, and restating it here would put one rule in two formulations in front of an author whose ruling on this fact and on that node are tied by `depends`. The rule was carried by the alignment skill alone, a declared shim, and applied as "the record's own test" by the authority fact of every node whose escalation rests on it; the session-context node says a rule that lives only in a file is invisible to the projector and to review. Recorded on 2026-09-04 with the recording node as its source, after that node's reading found the citation empty.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Who may change an answer?
form: rule
under:
  - commons.systems/disposition-graph/model
tier: global
instrument:
  kind: check
  ref: "the reader derives every node's class from the rulings on its facts and rejects a node carrying a stamp key, `packages/disposition/read.mjs` and `derive.mjs`, run by the validator on every landing"
  note: guards the derivation and the absence of stamps; that a ruling's words are in the record is checked by nothing yet, which is owed on the quotes node
defines:
  - term: authority
    gloss: "The standing that lets a recorded answer act, conferred only by a ruling of the author's on one of a node's facts and never by a mark, a command, or a class the AI writes for itself."
  - term: ratified
    gloss: "Ratified means the author ruled on the answer fact, in the alignment dialogue after its dialectic, and wants to be asked before it changes; the confirmed choice acts. A ruling of ratified on the authority fact is a different act: it says the answer must be ratified, confers nothing until the answer fact is ruled, and stops an ancestor's delegation from reaching that node, though not from reaching the nodes beneath it."
  - term: delegated
    gloss: "Delegated means the author ruled delegated on the authority fact: the recommendation acts, the delegation covers the class of decision it names below the node, and the author does not want to be asked again."
  - term: deferred
    gloss: "Deferred means the author ruled deferred on the authority fact: the recommendation acts, and the node stays on the alignment frontier until the author returns to it."
  - doctrine
  - proposal
---

## Answer

Adopted into `authority-derived` on 2026-09-05 and moved out of it the same day, to the node `class-recommendation` under this one, where the rule is the recommendation and the alternative to it is stated; the third reading of 2026-09-05 found that the survival and scope tests which minted `what-acts-during-bootstrap` reach this clause with more force, since it survives the recording, is cited by nineteen nodes, and is read by every session that recommends a class. What the option holds is the rule the node `class-recommendation` states, and the text of the rule is that node's: it was amended there on 2026-09-05, to name the class rather than a direction toward it, and restating it here would put one rule in two formulations in front of an author whose ruling on this fact and on that node are tied by `depends`. The rule was carried by the alignment skill alone, a declared shim, and applied as "the record's own test" by the authority fact of every node whose escalation rests on it; the session-context node says a rule that lives only in a file is invisible to the projector and to review. Recorded on 2026-09-04 with the recording node as its source, after that node's reading found the citation empty.
```

#### ratify-command

A command run by the author as the act of ratification, which the record carried on 2026-09-02. Passed over on the author's words of that day: "Ratification is not a rubber stamp. I don't see the function of a ratification script and it can probably be liquidated with updated disposition/doctrine." The command guaranteed nothing, since it stamped under the same version-control identity every session commits with, and it made the act a keystroke instead of a decision; the answer says no command confers a ruling.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Who may change an answer?
form: rule
under:
  - commons.systems/disposition-graph/model
tier: global
instrument:
  kind: check
  ref: "the reader derives every node's class from the rulings on its facts and rejects a node carrying a stamp key, `packages/disposition/read.mjs` and `derive.mjs`, run by the validator on every landing"
  note: guards the derivation and the absence of stamps; that a ruling's words are in the record is checked by nothing yet, which is owed on the quotes node
defines:
  - term: authority
    gloss: "The standing that lets a recorded answer act, conferred only by a ruling of the author's on one of a node's facts and never by a mark, a command, or a class the AI writes for itself."
  - term: ratified
    gloss: "Ratified means the author ruled on the answer fact, in the alignment dialogue after its dialectic, and wants to be asked before it changes; the confirmed choice acts. A ruling of ratified on the authority fact is a different act: it says the answer must be ratified, confers nothing until the answer fact is ruled, and stops an ancestor's delegation from reaching that node, though not from reaching the nodes beneath it."
  - term: delegated
    gloss: "Delegated means the author ruled delegated on the authority fact: the recommendation acts, the delegation covers the class of decision it names below the node, and the author does not want to be asked again."
  - term: deferred
    gloss: "Deferred means the author ruled deferred on the authority fact: the recommendation acts, and the node stays on the alignment frontier until the author returns to it."
  - doctrine
  - proposal
---

## Answer

A command run by the author as the act of ratification, which the record carried on 2026-09-02. Passed over on the author's words of that day: "Ratification is not a rubber stamp. I don't see the function of a ratification script and it can probably be liquidated with updated disposition/doctrine." The command guaranteed nothing, since it stamped under the same version-control identity every session commits with, and it made the act a keystroke instead of a decision; the answer says no command confers a ruling.
```

#### no-census-in-a-standing-answer

A measurement of the record does not go in the text that stands: a count belongs in the node's account, with the criterion it was taken on and the commit it was taken at, and the standing answer says where the measure lives and not what it is. This node has struck the same shape twice already, on its own text ("thirteen nodes cite it as the record's own test") under the frontier finding of 2026-09-03 that a count the author is asked to ratify be measured at the ruling rather than fixed in prose. What the option adds to that finding is the general rule and the reason it now bites harder: a global-tier node's answer is projected verbatim into `.claude/rules/`, so a census written there is doctrine every session loads, stale from the day the record next changes and with no instrument that would notice. The case that raised it is `class-recommendation`, whose amendment of 2026-09-05 wrote a dated census of the record's authority facts into its answer on the same day the node became global-tier, and whose re-reading found the count wrong on every criterion it could run. Recorded as an option and not written into the answer, because it would bind every node the record has and the author has not been asked.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Who may change an answer?
form: rule
under:
  - commons.systems/disposition-graph/model
tier: global
instrument:
  kind: check
  ref: "the reader derives every node's class from the rulings on its facts and rejects a node carrying a stamp key, `packages/disposition/read.mjs` and `derive.mjs`, run by the validator on every landing"
  note: guards the derivation and the absence of stamps; that a ruling's words are in the record is checked by nothing yet, which is owed on the quotes node
defines:
  - term: authority
    gloss: "The standing that lets a recorded answer act, conferred only by a ruling of the author's on one of a node's facts and never by a mark, a command, or a class the AI writes for itself."
  - term: ratified
    gloss: "Ratified means the author ruled on the answer fact, in the alignment dialogue after its dialectic, and wants to be asked before it changes; the confirmed choice acts. A ruling of ratified on the authority fact is a different act: it says the answer must be ratified, confers nothing until the answer fact is ruled, and stops an ancestor's delegation from reaching that node, though not from reaching the nodes beneath it."
  - term: delegated
    gloss: "Delegated means the author ruled delegated on the authority fact: the recommendation acts, the delegation covers the class of decision it names below the node, and the author does not want to be asked again."
  - term: deferred
    gloss: "Deferred means the author ruled deferred on the authority fact: the recommendation acts, and the node stays on the alignment frontier until the author returns to it."
  - doctrine
  - proposal
---

## Answer

A measurement of the record does not go in the text that stands: a count belongs in the node's account, with the criterion it was taken on and the commit it was taken at, and the standing answer says where the measure lives and not what it is. This node has struck the same shape twice already, on its own text ("thirteen nodes cite it as the record's own test") under the frontier finding of 2026-09-03 that a count the author is asked to ratify be measured at the ruling rather than fixed in prose. What the option adds to that finding is the general rule and the reason it now bites harder: a global-tier node's answer is projected verbatim into `.claude/rules/`, so a census written there is doctrine every session loads, stale from the day the record next changes and with no instrument that would notice. The case that raised it is `class-recommendation`, whose amendment of 2026-09-05 wrote a dated census of the record's authority facts into its answer on the same day the node became global-tier, and whose re-reading found the count wrong on every criterion it could run. Recorded as an option and not written into the answer, because it would bind every node the record has and the author has not been asked.
```

#### authority-per-clause-by-a-child-node

A ruling stays per fact, and a child node may name which clauses of its parent's answer that ruling reaches, so a rule whose clauses differ in kind can be ratified in part without a stamp on a clause. Raised by the sizing division the `delegation-bounds-and-sizing` node draws; it is the case the passed-over `clause-level-ratification` did not consider, since it is a node and not a stamp that does the naming. Against it stands the rule this node's own answer states, that authority only narrows on the way down, and `ocap-attenuation`, adopted on `authority-derived`, under which a holder passes on a strictly weaker reference and never a stronger one: a child naming how far its parent's ruling went is redistributing from below what the parent's ruling did. The node that raised it recommends moving the text instead, so that the division is made by a ruling per fact and this option is not needed; it is recorded because that node keeps `ratify-the-bounds-delegate-the-sizing` viable and the author may rule for it, and that option cannot be recorded without this encoding.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Who may change an answer?
form: rule
under:
  - commons.systems/disposition-graph/model
tier: global
instrument:
  kind: check
  ref: "the reader derives every node's class from the rulings on its facts and rejects a node carrying a stamp key, `packages/disposition/read.mjs` and `derive.mjs`, run by the validator on every landing"
  note: guards the derivation and the absence of stamps; that a ruling's words are in the record is checked by nothing yet, which is owed on the quotes node
defines:
  - term: authority
    gloss: "The standing that lets a recorded answer act, conferred only by a ruling of the author's on one of a node's facts and never by a mark, a command, or a class the AI writes for itself."
  - term: ratified
    gloss: "Ratified means the author ruled on the answer fact, in the alignment dialogue after its dialectic, and wants to be asked before it changes; the confirmed choice acts. A ruling of ratified on the authority fact is a different act: it says the answer must be ratified, confers nothing until the answer fact is ruled, and stops an ancestor's delegation from reaching that node, though not from reaching the nodes beneath it."
  - term: delegated
    gloss: "Delegated means the author ruled delegated on the authority fact: the recommendation acts, the delegation covers the class of decision it names below the node, and the author does not want to be asked again."
  - term: deferred
    gloss: "Deferred means the author ruled deferred on the authority fact: the recommendation acts, and the node stays on the alignment frontier until the author returns to it."
  - doctrine
  - proposal
---

## Answer

A ruling stays per fact, and a child node may name which clauses of its parent's answer that ruling reaches, so a rule whose clauses differ in kind can be ratified in part without a stamp on a clause. Raised by the sizing division the `delegation-bounds-and-sizing` node draws; it is the case the passed-over `clause-level-ratification` did not consider, since it is a node and not a stamp that does the naming. Against it stands the rule this node's own answer states, that authority only narrows on the way down, and `ocap-attenuation`, adopted on `authority-derived`, under which a holder passes on a strictly weaker reference and never a stronger one: a child naming how far its parent's ruling went is redistributing from below what the parent's ruling did. The node that raised it recommends moving the text instead, so that the division is made by a ruling per fact and this option is not needed; it is recorded because that node keeps `ratify-the-bounds-delegate-the-sizing` viable and the author may rule for it, and that option cannot be recorded without this encoding.
```

#### a-conferred-class-acts-during-bootstrap

During bootstrap a class acts from the ruling that confers it and not before;
what neither a declared shim nor the author's grant does is name a class, which
is the half of this answer's sentence that is its own. The state the
`what-acts-during-bootstrap` node defines runs to bootstrap exit and not to the
first ruling, so a sentence saying that no class acts during it is false of every
day after the first ruling, and that node's own gloss on `bootstrap` already says
the other thing: nothing acts by right but a declared shim, the author's grant,
and each class a ruling has already conferred. Raised by the clean-context
reading of that node on 2026-09-05, which found the answer and the gloss
contradicting each other in the text `.claude/rules/` carries, and recorded here
because the sentence is this node's and the author rules on it here.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Who may change an answer?
form: rule
under:
  - commons.systems/disposition-graph/model
tier: global
instrument:
  kind: check
  ref: "the reader derives every node's class from the rulings on its facts and rejects a node carrying a stamp key, `packages/disposition/read.mjs` and `derive.mjs`, run by the validator on every landing"
  note: guards the derivation and the absence of stamps; that a ruling's words are in the record is checked by nothing yet, which is owed on the quotes node
defines:
  - term: authority
    gloss: "The standing that lets a recorded answer act, conferred only by a ruling of the author's on one of a node's facts and never by a mark, a command, or a class the AI writes for itself."
  - term: ratified
    gloss: "Ratified means the author ruled on the answer fact, in the alignment dialogue after its dialectic, and wants to be asked before it changes; the confirmed choice acts. A ruling of ratified on the authority fact is a different act: it says the answer must be ratified, confers nothing until the answer fact is ruled, and stops an ancestor's delegation from reaching that node, though not from reaching the nodes beneath it."
  - term: delegated
    gloss: "Delegated means the author ruled delegated on the authority fact: the recommendation acts, the delegation covers the class of decision it names below the node, and the author does not want to be asked again."
  - term: deferred
    gloss: "Deferred means the author ruled deferred on the authority fact: the recommendation acts, and the node stays on the alignment frontier until the author returns to it."
  - doctrine
  - proposal
---

## Answer

During bootstrap a class acts from the ruling that confers it and not before;
what neither a declared shim nor the author's grant does is name a class, which
is the half of this answer's sentence that is its own. The state the
`what-acts-during-bootstrap` node defines runs to bootstrap exit and not to the
first ruling, so a sentence saying that no class acts during it is false of every
day after the first ruling, and that node's own gloss on `bootstrap` already says
the other thing: nothing acts by right but a declared shim, the author's grant,
and each class a ruling has already conferred. Raised by the clean-context
reading of that node on 2026-09-05, which found the answer and the gloss
contradicting each other in the text `.claude/rules/` carries, and recorded here
because the sentence is this node's and the author rules on it here.
```

#### no-census-anywhere-in-a-node

The existing option `no-census-in-a-standing-answer` reaches a node's standing answer. This one would extend the same rule to every part of a node a session or a projection reads as current — a fact's prose, an option's prose, and a fact's `against` — since the forty-six false census sentences this survey found are all in `### authority` prose and none in a `## Answer`, so the narrower rule would have caught none of them. What it would answer: whether the prohibition on counting the record inside the record is a rule about the answer or a rule about the node. It is on the table because the record has now measured the failure at forty-seven loci in the place the narrower option does not reach.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Who may change an answer?
form: rule
under:
  - commons.systems/disposition-graph/model
tier: global
instrument:
  kind: check
  ref: "the reader derives every node's class from the rulings on its facts and rejects a node carrying a stamp key, `packages/disposition/read.mjs` and `derive.mjs`, run by the validator on every landing"
  note: guards the derivation and the absence of stamps; that a ruling's words are in the record is checked by nothing yet, which is owed on the quotes node
defines:
  - term: authority
    gloss: "The standing that lets a recorded answer act, conferred only by a ruling of the author's on one of a node's facts and never by a mark, a command, or a class the AI writes for itself."
  - term: ratified
    gloss: "Ratified means the author ruled on the answer fact, in the alignment dialogue after its dialectic, and wants to be asked before it changes; the confirmed choice acts. A ruling of ratified on the authority fact is a different act: it says the answer must be ratified, confers nothing until the answer fact is ruled, and stops an ancestor's delegation from reaching that node, though not from reaching the nodes beneath it."
  - term: delegated
    gloss: "Delegated means the author ruled delegated on the authority fact: the recommendation acts, the delegation covers the class of decision it names below the node, and the author does not want to be asked again."
  - term: deferred
    gloss: "Deferred means the author ruled deferred on the authority fact: the recommendation acts, and the node stays on the alignment frontier until the author returns to it."
  - doctrine
  - proposal
---

## Answer

The existing option `no-census-in-a-standing-answer` reaches a node's standing answer. This one would extend the same rule to every part of a node a session or a projection reads as current — a fact's prose, an option's prose, and a fact's `against` — since the forty-six false census sentences this survey found are all in `### authority` prose and none in a `## Answer`, so the narrower rule would have caught none of them. What it would answer: whether the prohibition on counting the record inside the record is a rule about the answer or a rule about the node. It is on the table because the record has now measured the failure at forty-seven loci in the place the narrower option does not reach.
```

#### the-ruling-is-quoted-in-the-record-and-referenced-by-the-option

The words that earn a ruling are entered in the ledger and referenced by the option ruled on, and a ruling whose words are not in the record, or whose option carries no reference to them, is invalid.

**AI support.** The rule's purpose is unchanged, that a ruling is valid only where the words that earned it are in the record and reachable from it, and the guard against a rubber stamp is still the dialectic and not the location; what changes is that the words are stored once, where `quotes` now keeps them, and the option's reference is the reachability. The second limb, that the option must carry the reference, is stricter than the sentence it replaces, since words present in the record but attached to nothing earned no ruling.

Attenuation: authority only narrows as it is handed down, never widens, so a breakout would have to be written up the tree, and nothing writes up. The ratify command the record carried on 2026-09-02 is the option `ratify-command`, passed over on the author's words quoted there. The readings that bear here are `ocap-attenuation`, for the rule that authority only narrows, and `approval-directed-agents`, for deferred as action under a review that is owed, both under the viable-options node and bearing on `authority-derived`; ultra vires with enabling acts, and delegation containment in cgroup v2, were surfaced on 2026-09-02 and are owed as readings.

The author, 2026-09-03, on the bootstrap ledger: "The ledger is a shim, it shouldn't receive standing disposition. Ratified as a shim. The standing disposition (ratified) is that ratification happens only through alignment dialogue." And later that day: "The ledger is expected to be sunset and encoded as deferred dispositions. I am concerned that it has not been, I am concerned about drift between the ledger and the greenfield graph." The ledger shim declared here on 2026-09-02 was liquidated on 2026-09-03: every entry was sorted, by the survey `bootstrap/ledger-migration-survey-2026-09-03.md` on the implementation ref and by the session for the entries after it, into a node amendment, a shim declaration, an un-aligned disposition, or nothing, and the file was deleted. While it stood no stamp was ratified, and none is yet; the first ratified stamps are those the sitting on purpose writes.

The author, 2026-09-03, in the sitting on the dialogue node, quoted above, narrowed the word proposal: the draft of this node had defined it as any candidate answer, amendment, or finding with no authority, recorded in a stamped node or in a sitting's record, and the author ruled that the term is technical vocabulary for a conflicting answer arising outside alignment, that it must not be overloaded, and that conflicting answers evaluated in alignment are recorded differently, as alternatives in the dialogue state. The same day the author ruled that a standing answer of any class, ratified, delegated, or deferred, keeps its full authority while an alternative is pending, and that a proposal from outside alignment opens the dialogue on its node. This answer was written from the draft under the author's bootstrap grant on the dialogue node, folding the draft's text into the standing answer with the narrowing; the ratified stamp the draft carried is what a confirmation confers and is not written before it.

Amended 2026-09-04 under the author's bootstrap grant of that day, recorded on the viable-options node, from the author's words there: "Is 'unanswered' just an authority - as in no authority granted for reconciliation. Or, more precicely, explicit bootstrap authority required for reconciliation - in this way bootstrap authority is not a shim, but a persistent disposition about reconciliation authority." The stamp goes because the record stores the ruling on the fact with its response, date and pin, and a stamp beside it is a copy that drifts, the reason the unanswered node gave for deriving the status; deferred becomes a class the author confers, since every class in this record traces to a ruling and, as this answer already said, no command confers one. The bootstrap-authority shim declared here on 2026-09-03 is liquidated into the standing rule above, which strikes its expiry at bootstrap exit against the author's words of that day quoted above: a rule that reconciles an unanswered node only on the author's explicit word is the right rule at any time and not a bootstrap expedient, and the author may strike this line; `bootstrap-authority-as-class` is thereby decided in favour of the rule. The word proposal keeps what the author's narrowing of 2026-09-03 fixed, that it is technical vocabulary and not overloaded, and takes its definition from the author's words of 2026-09-04, quoted above, which supersede the origin in their words of 2026-09-03: a proposal is a state of a ratified node and not an origin, the origin being the option's source. Four nodes still cite this node for the origin definition: transience's standing answer, node's recommended `four-form-draft`, growth's standing answer and its recommended `boldness-reversed`, and frontier-consistency's validation 2 in both its standing answer and its recommended `split-survey-from-per-draft`, where the rule this node's own reading runs under becomes unreadable. The same move is recorded on each as the option `proposal-as-a-state-of-a-ratified-node`. The test the AI applies when it recommends a class, recorded here on 2026-09-04 as the option `escalate-toward-ratified` from the recording node's reading, is absorbed into the answer and the option kept, marked as adopted, since no candidate leaves the list: the rule lived in the alignment skill alone, a shim, while the nodes whose authority fact rests on it cite it as the record's own test, and a rule the record applies is stated where the classes are defined. The answer as it stood is kept as the option `stamped-classes`, and the review of this text is owed.

Amended 2026-09-05, after the second reading of that day. Three moves, each the
AI's. The rule that a ruling of ratified on the authority fact is a different
act, saying the answer must be ratified and conferring nothing until the answer
fact is ruled, was read off `classAndSource` in `packages/disposition/derive.mjs`
and is supported by no words of the author's; it is stated here because a class
the record computes and the answer does not define is a definition completed in
code, which is the capture shape this node's own escalation test names, and the
third reading of 2026-09-05 found two further rules of that walk unstated and
they are now in the answer with it. The scope sentence was widened, to a move of
a fact's recommendation on any node within the scope its class allows and the
passing over of an option the AI itself wrote, because as it stood it forbade
the move that produced this amendment and six of this node's own options carry
a status it forbade the AI to write. And the bootstrap clause left this node for
`what-acts-during-bootstrap`, because the question of what acts while nothing is
ratified survives the recording, is cited by sessions that never saw it asked,
and is not answered by a definition of the classes. The escalation test left the
same day and for the same reasons, to `class-recommendation`, the third reading
having found that the test which minted the first node reaches it with more
force.

**AI divergence.** The validity of a ruling now depends on a resolution across two files, and a ledger entry struck or renumbered would invalidate a ruling by accident, which the ledger's rule that entries are appended and never reordered exists to prevent and which the validator must check; and the option stands or falls with `quotes#words-in-a-ledger-on-the-ref`.

**Content.**

```markdown
---
question: Who may change an answer?
form: rule
under:
  - commons.systems/disposition-graph/model
tier: global
instrument:
  kind: check
  ref: "the reader derives every node's class from the rulings on its facts and rejects a node carrying a stamp key, `packages/disposition/read.mjs` and `derive.mjs`, run by the validator on every landing"
  note: guards the derivation and the absence of stamps; that a ruling's words are in the record is checked by nothing yet, which is owed on the quotes node
defines:
  - term: authority
    gloss: "The standing that lets a recorded answer act, conferred only by a ruling of the author's on one of a node's facts and never by a mark, a command, or a class the AI writes for itself."
  - term: ratified
    gloss: "Ratified means the author ruled on the answer fact, in the alignment dialogue after its dialectic, and wants to be asked before it changes; the confirmed choice acts. A ruling of ratified on the authority fact is a different act: it says the answer must be ratified, confers nothing until the answer fact is ruled, and stops an ancestor's delegation from reaching that node, though not from reaching the nodes beneath it."
  - term: delegated
    gloss: "Delegated means the author ruled delegated on the authority fact: the recommendation acts, the delegation covers the class of decision it names below the node, and the author does not want to be asked again."
  - term: deferred
    gloss: "Deferred means the author ruled deferred on the authority fact: the recommendation acts, and the node stays on the alignment frontier until the author returns to it."
  - doctrine
  - proposal
---
## Answer

Every answer carries its authority in the rulings recorded on its facts, and no stamp is written beside them: a node's class is read off those rulings, and a node no ruling grants is unanswered, as the unanswered node says. Ratified means the author ruled on the answer fact, in the alignment dialogue after its dialectic, and wants to be asked before it changes; the confirmed choice acts. Ratification happens only through that dialogue: the session that ran the sitting records the ruling on the option the author chose, with the response, the date, and the pin of the recommendation it answered, and the words that earned it are entered in the ledger and referenced by the option ruled on; a ruling whose words are not in the record, or whose option carries no reference to them, is invalid; transcribing the author's words from any other record confers nothing, and no command does, since a script that rules on request is a rubber stamp and the guard against rubber stamps is the dialectic itself, whose steps the round accounts for. Delegated means the author ruled delegated on the authority fact: the recommendation acts, the delegation covers the class of decision it names below the node, and the author does not want to be asked again. Deferred means the author ruled deferred on the authority fact: the recommendation acts, and the node stays on the alignment frontier until the author returns to it. A ruling of ratified on the authority fact is a different act from a ratification: it says the answer must be ratified, so it confers nothing until the answer fact is ruled, and it stops an ancestor's delegation from reaching that node. It stops it for that node alone: the walk continues past it, so a delegation ruled further up reaches the nodes beneath, and sealing a subtree takes a ruling on each node in it. Where a node refines more than one question and two ancestors at the same distance confer different classes, the narrower acts. A ruling on an ancestor grants the decisions its scope covers to the nodes beneath it, and authority only narrows on the way down. A class the AI writes for itself is not a grant: the deferred stamps the bootstrap wrote were unanswered, as the author classified them on 2026-09-03, and the record no longer carries them. Unanswered means no ruling grants the node: nothing on it acts, and reconciling anything under it takes an explicit grant from the author, given in their words and never assumed, never read from the announcement of one, and never carried into a later sitting; the grant's unit is the alignment sitting, which it reaches whole, and what it licenses within one is the question of the node beneath this one, what-acts-during-bootstrap; that is a standing rule of this record and not a shim, and it does not expire. Doctrine is the ratified answers taken together. A confirmed choice of any class keeps its full authority while an option is pending beside it, until the author rules for another. A proposal is technical vocabulary and is not overloaded: it is the state of a ratified node whose recommendation has moved from its confirmed choice, wherever the move came from, the origin being the option's source, evidence, a signal, an instrument, a criterion, a conflict identified in reconciliation, or the loop on itself. In that state the confirmed choice keeps its full authority and the node returns to the alignment frontier for re-confirmation, at the movement the recording node's classification calls for, the review where only the recommendation moved. The AI exercises authority within scope: it may answer under a ratified ancestor, may add an option to any fact, may pass an option over and lift a status it wrote, may move a fact's recommendation on any node within the scope its class allows, what a move does being read from the class as the evaluation node says, and records anything that would contradict doctrine or exceed its scope as an option on the node it conflicts with, which acts on nothing until the author rules; an option that would leave a delegation's scope returns that node to the author with its class intact. What class the AI recommends on a node's authority fact is the question of the node beneath this one, class-recommendation; what it recommends there is a recommendation and confers nothing. During bootstrap no class acts; neither a declared shim nor the author's grant names a class, and what does act while nothing is ratified, and how that state ends, is the question of the node beneath this one, what-acts-during-bootstrap.
```

### authority

Ratified, at moderate boldness: this node defines the classes themselves and what each lets act, so a wrong answer is expensive and capture-shaped, which is the escalation test the answer now states, and every consequence of the rule is ruled per fact under it. Moderate because the author has spoken to the classes in three sittings and never to this text whole, and the AI's additions are named on the answer fact.

## Account

### Manifest

- Folded: The stub grant expired, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Bootstrap authority declared as a shim, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Sitting on purpose, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review of the amendment, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The author's narrowing, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Re-encoding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Alternatives merged, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the reading, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Adopted option restored, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The reading applied, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: An option from class-recommendation's re-reading, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: An option from delegation-bounds-and-sizing's reading, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: An option from what-acts-during-bootstrap's reading, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The rule's text left this node, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier survey, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Option adopted, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of 15694b67, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Repaired after the second re-reading, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of 8d217d7d, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-07, of 2cf0cdde

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `the-ruling-is-quoted-in-the-record-and-referenced-by-the-option`.

Findings:


On the facts and what they recommend: The diff changes no fact's `recommends`, `boldness`, or `stands`: the answer fact still recommends `the-ruling-is-quoted-in-the-record-and-referenced-by-the-option` at moderate boldness with `stands: authority-derived`, the authority fact is untouched, and the `## Recommendation` fence's content is unchanged. The diff only edits the `authority-derived` option's own prose within the answer fact: it drops the false 'Three options stay viable beside it ... The rest are passed over with their reasons on their rows' claim (rewritten as the non-exhaustive 'Among the options viable beside it are ...', with the closing clause removed), and it deletes the `#### authority-derived` subsection's body entirely, since that option is the one named by `stands`.

On the viability of the options: The diff itself flips no option's status: no option is newly passed over or newly unpassed. It corrects the answer fact's reason paragraph so it no longer misstates the count of viable options or falsely claims the rest are passed over (the four post-2026-09-05 options were already, and remain, correctly unflagged as viable), and it removes the `authority-derived` subsection's duplicate prose, which is not a viability change but a compliance fix with the node-encoding rule that the stands option's subsection is empty. Every option's viability, before and after this diff, is represented consistently.

Strongest counter-argument (weak): The last reading's two findings are both fully closed: the false 'three options / the rest are passed over' sentence is now non-exhaustive and drops the closing clause exactly as the suggested edit asked, and the `authority-derived` subsection body is deleted outright, resolving the duplication with `## Answer` the survey and the previous reading both named. One could argue the subsection deletion is a stronger remedy than the previous reading's alternative of 'add a sentence explicitly deferring the fix to `dialogue`'s pending ruling', foreclosing that option rather than choosing between the two it offered; but the record's own encoding rule quoted in this brief is unconditional ('The option named by `stands` omits its subsection'), so outright deletion is the correct fix and not merely one of two equally valid choices. No new false claim, contradiction, or stale pin is introduced by this diff.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/authority stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `authority-derived`; the `## Rationale` its `**AI support.**`; the `## Recommendation` fence became the content of `the-ruling-is-quoted-in-the-record-and-referenced-by-the-option`; 7 `## Disposition` entries became the ledger entries words/2026-09-02/3, words/2026-09-02/4, words/2026-09-03/26, words/2026-09-03/27, words/2026-09-03/28, words/2026-09-03/29, words/2026-09-04/22, referenced by 1 option the entry's own date names and by the recommended option for 6 the date named none; and `stands` left the answer fact. The record wrote no text of its own for `stamped-classes`, `bootstrap-authority-as-class`, `clause-level-ratification`, `ceiling-moves-here`, `out-of-scope-answers-as-deferred`, `proposal-as-an-authority-class`, `proposal-as-any-recorded-candidate`, `escalate-toward-ratified`, `ratify-command`, `no-census-in-a-standing-answer`, `authority-per-clause-by-a-child-node`, `a-conferred-class-acts-during-bootstrap`, `no-census-anywhere-in-a-node`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `2cf0cdde322069682f6928e0f8c5b80bd56b61ea` is re-computed for the encoding as `023c2848b7bb4f67d7e92769d852bef16aa75c9f`; nothing it read changed. The survey's pin `7db4b3832bbfd7604fa87bb408fb0b266bc45d03` was already past the recommendation and is left as it stood.

### Frontier survey, 2026-09-07, of 023c2848

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- Contradiction (7) with live options on a node in its own subtree. This answer says "Every answer carries its authority in the rulings recorded on its facts, and no stamp is written beside them" and "the deferred stamps the bootstrap wrote were unanswered, as the author classified them on 2026-09-03, and the record no longer carries them", while two live options on `quotes` are written in the struck vocabulary and would restore the thing: `ruling-stays-in-node` — "A ratified stamp whose ruling is not in the node is invalid, and the ruling a stamp requires is the one the author gives at that sitting, quoted then" — and `the-quotation-is-copied-onto-every-option` — "A ratified stamp whose ruling is not in the record is invalid, and the ruling a stamp requires is the one the author gives at that sitting, entered in the ledger then and referenced by the option ruled on". Neither carries a `status`, so either is a ruling away from contradicting this node.

Strongest counter-argument (moderate): The recommendation requires that the ruling be quoted in the record and referenced by the option, and the record it names — the ledger at `disposition/words/<date>.md` — does not exist at this commit, since `quotes` and `materialization` are both unruled on whether the ref may carry it. A rule of validity whose store is unbuilt makes every ruling recorded before the migration invalid on its own terms, and this node's own option `no-census-anywhere-in-a-node` reports the record has "now measured the failure at forty-seven loci". Against that, the requirement is what stops a rubber stamp, and the alternative the node rejects is exactly the AI writing a class for itself.

### Frontier finding, 2026-09-07

Kind: contradiction.

Two live options on `quotes`' answer fact are written in vocabulary `authority` has struck and would restore the thing the vocabulary named. `ruling-stays-in-node` reads "A ratified stamp whose ruling is not in the node is invalid, and the ruling a stamp requires is the one the author gives at that sitting, quoted then; words the author said earlier are the ground a draft rests on and bar no stamp." and `the-quotation-is-copied-onto-every-option` reads "A ratified stamp whose ruling is not in the record is invalid, and the ruling a stamp requires is the one the author gives at that sitting, entered in the ledger then and referenced by the option ruled on". `authority`'s answer holds that "Every answer carries its authority in the rulings recorded on its facts, and no stamp is written beside them" and that "the deferred stamps the bootstrap wrote were unanswered, as the author classified them on 2026-09-03, and the record no longer carries them". Neither option carries a `status`, so both are live and either is one ruling from contradicting doctrine.

Also named: commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/what-an-option-row-carries.

Proposed: The survivor is `authority`'s vocabulary: no stamp. The two live options on `quotes` are rewritten so their validity rule speaks of the ruling recorded on the fact rather than of a stamp, or are passed with the reason that they restate a design the record has struck. `authority` is not amended, and `what-an-option-row-carries` is named because it governs the row the author reads these options from and is the node that could make such a divergence visible.

Recorded as an option on commons.systems/disposition-graph/quotes's answer fact: `stamp-vocabulary-struck-from-the-live-options` (source review, 2026-09-07).

### Frontier finding, 2026-09-07

Kind: vocabulary.

authority's standing answer: 'no stamp is written beside them: a node\'s class is read off those rulings, and a node no ruling grants is unanswered'. Standing answers that still define the node by a stamp: node 'Every node carries a stamp, or it is an open question awaiting its answer'; growth 'a ratification is recorded as the stamp in the author\'s name with the ruling quoted'; projection 'an authority section projected from the stamp, the ruling behind it, the alternatives the rationale rejected'; traditions-home 'A tradition root is a node like any other, a question, an answer, a form and a stamp'. quotes' option `stamp-vocabulary-struck-from-the-live-options` reaches only quotes' own options.

Also named: commons.systems/disposition-graph/node, commons.systems/disposition-graph/growth, commons.systems/disposition-graph/projection, commons.systems/disposition-graph/traditions-home, commons.systems/disposition-graph/quotes.

Proposed: authority's vocabulary survives: class, ruling, fact, option. node, growth, projection and traditions-home are amended to define a node by the rulings on its facts, and the record's use of stamp is confined to authority's historical sentence about the stamps the bootstrap wrote.

Recorded as an option on commons.systems/disposition-graph/node's answer fact: `a-node-is-classed-by-the-rulings-on-its-facts` (source review, 2026-09-07).
### The grant clause follows the node beneath, 2026-09-08

The author refined the bootstrap grant on 2026-09-08, `words/2026-09-08/22`, making its
unit the alignment sitting rather than the single reconciliation. This node states that
rule in one sentence and `what-acts-during-bootstrap` owns its detail, so the sentence
was amended to carry the unit and the two prohibitions that survive, that a grant is
never assumed and never read from the announcement of one, and to send the reader down
for what a grant licenses within a sitting. That is the direction authority runs: this
node says what a grant is and the node beneath says what it does, and the detail was
not copied up.

The clause was amended in both fences that carry it, the recommendation's and
`authority-derived`'s, because the refinement is common ground and not a position one
option holds against another; the only difference between those two fences stays the
one `authority-derived` is about. The node returns to the review stage with its forward
verdict of an earlier recommendation now stale, and this node is `tier: global`, so its
rule projection under `.claude/rules/` is stale until it is regenerated.

### A probe from the terminator reading, moved here from prose, 2026-09-08

Raised by the tradition reading on the terminator of 2026-09-08 and landed in
`movements`' account at `95823023`, held there in prose because `dialogue`'s cap
of three open probes stood. The author struck the cap the same day at
`words/2026-09-08/32`. The probe is now in the field.

The stage is deliberately not moved. Under this node's own recommended text a
probe recorded at the review stage would have returned the node to the maieutic
stage, and the author's words of the same day strike that kick-back: "A
disposition can be confirmed at any point after options are recorded for each
fact. Confirmation is not blocked on draining all probes." So the node stands at
review with an open probe on it, which is what the amendment recorded on
`author-questions` as `no-cap-and-probes-do-not-block` makes ordinary. Nothing in
the answer moved, and the rule projected from this node is unchanged.
