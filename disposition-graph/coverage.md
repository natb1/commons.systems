---
question: Which of the recorded functions fall within the purpose?
stage: periagogic
probes:
  - id: personal-software-maintenance
    asks: >-
      Does the purpose cover maintaining the software the author uses
      personally, or only the intention behind building it?
    fact: answer
    why: >-
      The purpose node's answer names what the repository is for and says
      nothing about maintenance of the author's own daily-use software; the
      coverage node's own account records that the twelve-function survey
      "contradicts the purpose disposition as worded and requires the author's
      clarification", and the census unit of 2026-09-03 recorded the four
      questions as open questions with no candidate answer, so nothing on the
      answer fact reaches them.
    discharges: >-
      Whether functions 9 (three consumer apps, their shared libraries and the
      Firebase backend) fall inside the purpose; it is the largest single block
      of implementation the ruling decides, and it produces the first
      recommendation the answer fact has ever carried. Until it is answered
      `materialization`'s greenfield shim cannot liquidate, its condition naming
      this node.
    source: ai
    raised: 2026-09-03
  - id: host-and-shared-infrastructure
    asks: >-
      Is the author's own computing environment one more institution of daily
      life the purpose should name, or infrastructure with no purpose of its
      own?
    fact: answer
    why: >-
      Same locus. The purpose node's answer distinguishes the record from the
      factory that acts on it and says nothing about the machinery either runs
      on; nothing in the record classifies about twenty shared libraries, the
      Firebase backend and its rules tests, or the author's machine
      configuration, backups and monitoring.
    discharges: >-
      Whether function 12 falls inside the purpose; second largest block, and it
      partly overlaps function 9's backend, so the two are answered against each
      other. Also gates the swap.
    source: ai
    raised: 2026-09-03
  - id: marketing-and-portfolio-content
    asks: >-
      Is marketing and portfolio content part of what this repository is for, or
      a separate function to be named or excluded?
    fact: answer
    why: >-
      Same locus. The purpose node names its readers and the audience question
      moved here when `audience` was recommended for pruning; the two options
      that moved with it decide who is served, not whether the surfaces built to
      reach them are in scope, and the account records the About page, the
      project showcase and the posts as outside the purpose as worded.
    discharges: >-
      Whether function 10 falls inside the purpose. Ranked below the two above
      because the node's two existing options bear on it obliquely (an answer
      for `name-excluded-audiences` would name the public site's About page as
      excluded), so the record is not wholly silent.
    source: ai
    raised: 2026-09-03
  - id: indirect-promotion-of-values
    asks: >-
      Is the indirect promotion of the author's values through unrelated content
      within the purpose, or a hobby a legacy node happened to rationalize?
    fact: answer
    why: >-
      Same locus as the three above; the purpose node's answer is silent on it.
    discharges: >-
      Whether function 11 falls inside the purpose.
    source: ai
    raised: 2026-09-03
    status: discharged
    reason: >-
      Withdrawn on the ranking, not on the merits: it did not survive the cap of
      three. It is the smallest of the four by what an answer would move, one
      blog against three consumer apps, twenty libraries and a public site, and
      it is the only one of the four whose own wording already leans ("or a
      hobby that a legacy node happened to rationalize"). It stays in the record
      as a discharged probe and the author may raise it; a later movement that
      frees a slot should take it first.
facts:
  - name: answer
    options:
      - name: audiences-served-through-primary
        source: ai
        ref: "2026-09-03"
      - name: name-excluded-audiences
        source: ai
        ref: "2026-09-03"
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
under:
  - commons.systems/disposition-graph/purpose
---
## Disposition

The author, 2026-09-02, on coverage:
> If there are other recorded functions in the incumbent code/graph then present for review to ensure full coverage of scope.

The author, 2026-09-02:
> "Who is this repository for?" to the extent this needs to be recorded right now it is handled by the purpose node already. It can be pruned. We might fold some of this in from the incumbent graph later.

## Facts

### answer

#### audiences-served-through-primary

One of the two candidate answers to the audience part of this question, moved here when the audience node was recommended for pruning. The purpose node's one audience covers the other four the evidence names — practitioners forking the harness, the author alone, prospective consulting clients, the general public downloading a stand-alone plugin, and an unspecified future collaborator — because each is served through the primary audience's tooling, and no surface is excluded on that ground.

#### name-excluded-audiences

The alternative to the above, also moved here from the audience node's account: the audiences outside the purpose are named as excluded, and the surfaces built for them — the public site's About page, the plugin listing, the fork template and separability audit, the morning brief — become unsupported implementation at the swap of the implementation ref with main. It is the same choice the twelve-function survey poses for functions nine to twelve, applied to readers rather than to functions.

## Account

This evidence contradicts the purpose disposition as worded and requires the author's clarification. A survey of what the repository is recorded as doing (evidence: the README, the root manifest's workspaces, the top-level directories, the statements of the seven legacy root nodes and fifty-eight legacy strategy nodes, forty skill files, and the nix outputs; kept at `bootstrap/scope-survey.md` on the `greenfield` ref) finds twelve recorded functions. Against the purpose above, five fall under the primary function, one under the knowledge-store hypothesis, two under the capture hypothesis, and four outside all three as currently worded.

Under the primary function (a):

1. The intention-graph mechanism: a versioned goal graph, one file per node, with a library that reads, writes, and validates it.
2. The autonomous dispatch harness: a headless scheduler that runs one bounded agent session per unit of work through plan, implement, qa, review, and merge.
3. Interview, audit, and self-improvement tooling: the align skills, the graph audit, and the harness's measurement of its own sessions.
4. Office hours: the human half of the queue, with its own hosted app and local-first snapshot.
5. Distribution and forkability: a plugin marketplace listing, an identity-free nix configuration with a fork template, and a separability audit of the graph tooling.

Under the knowledge-store hypothesis (b):

6. The root layer of principles, several cross-checked against named philosophical and religious traditions: a recorded personal ethical framework independent of any AI use.

Under the capture hypothesis (c):

7. Personal daily-practice dispositions: sleep, food, exercise, household consent, and how the author exercises voice toward delegatees; no software deliverable.
8. A café and community-space business venture: plan, financial model, and decision log, drafted with AI help and not linked into the legacy graph.

Outside the purpose as worded, each with the question that would bring it in or leave it out:

9. Personal-autonomy recovery apps (budget, print, audio): local-first web apps that replace institutional software in the author's daily use, also offered publicly. The intention behind them is close to (c); building and indefinitely maintaining three consumer apps, their shared libraries, and a Firebase backend is a different kind of work. Does the purpose cover maintaining software the author uses personally, or only the intention behind building it?
10. The public site and blog: an About page pitching independent consulting, a project showcase, and posts. Is marketing and portfolio content part of what the repository is for, or a separate function to name or exclude?
11. A tabletop-gaming blog, recorded as a deliberately indirect way of promoting one of the principles. Is covert promotion of the author's values through unrelated content within the purpose, or a hobby that a legacy node happened to rationalize?
12. Shared engineering and host infrastructure: about twenty libraries, the Firebase backend and its rules tests, and the author's own machine configuration, backups, and monitoring. Is the author's computing environment one more institution of daily life the purpose should name, or infrastructure with no purpose of its own?

Two further findings bear on the audience node. The evidence names at least five audiences: practitioners forking the harness, the author alone, prospective consulting clients, the general public downloading a stand-alone plugin, and an unspecified future collaborator. And the third-ref shim makes this question load-bearing: whatever on `main` has no supporting disposition by bootstrap exit is pruned by the swap, so functions 9 to 12 need an answer before then.

### Sitting on purpose, 2026-09-03

**The coverage question; the audience finding moves here**

The question stays open with its twelve-function proposal. The paragraph that addressed the audience node now addresses this question: the evidence names five audiences, purpose names its readers, and whether the others are in scope is for this node to say.

Facts: authority deferred; boldness low; persistence open question; the audience finding a proposal that dies at the coverage ruling.

Depends on: `audience`

### Moved from the scope node, 2026-09-03

Until 2026-09-03 this question was the scope node's. When the author answered scope as the section after purpose and the table of contents of the onboarding walk, the open coverage question moved here, under purpose, since it asks what the purpose covers; the scope node's answer refers to it for what the record leaves out. The materialization shim's liquidation holds the swap of the implementation ref with the main branch until this question is ruled. The movement owed is periagogic: the author's clarification of the purpose against the evidence above.

Facts: authority none, an un-aligned disposition in the author's words; boldness low, the survey is evidence; persistence open until the author rules.

### Frontier finding, 2026-09-03

Kind: cross-reference.

Two prose references point at nodes that no longer say what is attributed to them. Audience's Proposal: 'the five-audience finding moves to scope' — verified stale, the finding is on coverage, whose own '### Sitting on purpose' section says 'The paragraph that addressed the audience node now addresses this question'. And stub-traditions enumerates the rationales carrying prose tradition lists as node, authority, instruments, namespaces, persistence, work-loop, evaluation, review, session-context, materialization, transience and validation-order; verified by grep that fourteen nodes carry such lists and that three of them — dialogue, recording and scope — are missing from the enumeration, while instruments carries its traditions without the marker phrase. Readings' draft rests its rule on that enumeration being the remedy.

Also named: commons.systems/disposition-graph/audience, commons.systems/disposition-graph/stub-traditions, commons.systems/disposition-graph/readings.

Proposed: Audience's Proposal names coverage instead of scope. Stub-traditions' enumeration is regenerated from the record rather than maintained by hand — the same class of drift the scope node's order field was introduced to prevent — and until it is, dialogue, recording and scope are added. Readings' facts say that the remedy's enumeration is incomplete, so the author knows the size of what ratifying the rule puts on the frontier.

### Frontier finding, 2026-09-03

Kind: coverage.

Four author quotations are carried verbatim on more than one node, verified by exact match. 'Who is this repository for? ... It can be pruned' on audience and coverage. 'purpose -> [scope, self documentation (via the graph browser)] (equal) -> alignment -> harness context management -> reconciliation -> rsi' on scope, self-documentation and rsi. 'Is this correctly encoded as form: assumption vs form: disposition with unvalidated instrumentation? Is assumption a form at all?' on knowledge-store, capture and purpose. 'assumption deserves a target disposition, along with tradition and disposition ...' on node and form-vocabulary. Frontier-consistency's validation 14 says every disposition the author has given is 'answered by exactly one node: none unanswered, none answered twice', and admits no case for a quote carried as context on a child.

Also named: commons.systems/disposition-graph/audience, commons.systems/disposition-graph/knowledge-store, commons.systems/disposition-graph/capture, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/node, commons.systems/disposition-graph/form-vocabulary, commons.systems/disposition-graph/scope, commons.systems/disposition-graph/self-documentation, commons.systems/disposition-graph/rsi.

Proposed: Most of these are legitimate context on a child that answers a part of the words, and the validation should say so: amend frontier-consistency's validation 14 to read that each part of a disposition is answered by exactly one node, and that a quotation may be carried on a child as the ground of the part it answers. Two are genuine double answers and should be resolved: audience and coverage both answer the audience question, which the audience prune resolves in coverage's favour; knowledge-store, capture and purpose all carry the form question, which forms answers, so all three should cite forms rather than each carry the quote.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `audiences-served-through-primary` (ai, 2026-09-03); `name-excluded-audiences` (ai, 2026-09-03).
Merge analysis of the author's words: 2026-09-02, own-question: If there are other recorded functions in the incumbent code or graph, they are to be presented for review so that the scope's coverage is complete. 2026-09-02, own-question: The audience question is handled by the purpose node already and can be pruned, though some of the incumbent graph's material on it might be folded in later — the folding being this node's question, and the same words grounding the prune recommended on the audience node.
The census unit's note: The node carries no `## Answer` and no `recommendation`, so `adopts` is null and it stands at the periagogic stage awaiting the author's clarification against the twelve-function survey. The survey itself, and the four questions it attaches to functions nine to twelve, are evidence and open questions with no candidate answer, so they are not alternatives. The two I did record are the audience choice, which the audience node's account states as a genuine either-or and which this node's own text says now belongs here. The second author block is classified own-question rather than new-answer on audience even though audience carries the same words: this node's account says the paragraph that addressed audience now addresses this question, and the words' last sentence, about folding the incumbent graph in later, is this node's own. The two frontier findings carried here are duplicates of those on audience and their elsewhere entries are recorded there once.
