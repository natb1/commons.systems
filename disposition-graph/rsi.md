---
question: How does this system improve its own loop?
stage: maieutic
facts:
  - name: answer
    options:
      - name: bound-by-ratification
        source: ai
        ref: "2026-09-03"
      - name: loop-writes-options
        source: author
        ref: "2026-09-04"
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
review:
  survey:
    date: 2026-09-07
    commit: edc5af91d942319c12174309e388a244de61fa52
    text:
      question: "02173353610eaabab862daf84f06ea2b21818d078728ae41ba773bc1265b514b"
      answer: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      options: "7f93f7d53f126515a3e2f2dea7811c29c8246d687a583ed05eacc2e4aca8cd96"
      rivals: "2c2569f8e6fb68f17d95b0be9e7f01d9a1b9a2a903de61680c5a188debb66eb6"
      words: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
under:
  - commons.systems/disposition-graph/model
depends:
  - commons.systems/disposition-graph/viable-options
probes:
  - id: what-rsi-names
    target: author
    type: maieutic
    asks: >-
      What does the word `rsi`, at the end of the high-level order the author
      recorded on 2026-09-03, name in this record?
    fact: answer
    why: >-
      The author's only words on this node are that one word, in the order
      carried here from `commons.systems/disposition-graph/scope`, which
      grounds the node's placement and rank and nothing else. Read for an
      answer: `scope`'s answer and its disposition, `work-loop`'s answer,
      `viable-options`' answer on what the loop on itself may write, and
      `authority`'s scope rule. None of them says what the term covers here.
      The account records the AI's reading of the word as a reading, from the
      term's use in the incumbent harness, which is evidence and not a reason.
    discharges: >-
      Whether recursive self-improvement is a section of the record with
      dispositions of its own or the name of what the loop already does when
      the frontier bites the loop's own nodes, and with it whether the answer
      fact can carry a recommendation at all, which today it cannot.
    source: ai
    raised: "2026-09-03"
---

## Facts

### answer

#### bound-by-ratification

Whichever reading stands, a bound is owed: every change to a node the loop uses to change itself requires the author's ratification. The account raises this as the question of what bounds the term here, and records no recommendation on it.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

#### loop-writes-options

The loop on itself has the same authority over the record as reconciliation, to record viable options and move recommendations, within scope. On a ratified loop node a moved recommendation acts on nothing until the author re-confirms it, which is the bound `bound-by-ratification` asks for; on a delegated one it acts within the delegation. This reads rsi as `rsi-as-loop-on-itself`. Raised on commons.systems/disposition-graph/viable-options, from the author's words of 2026-09-04 recorded there.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

## Account

The author named `rsi` as the section that follows reconciliation and gave no account of it. The AI reads the word as recursive self-improvement, which the legacy record used for the harness's measurement and improvement of its own sessions: the work loop applied to the work loop, its instruments read against itself, and its improvements landed through the same dialogue and reconciliation as any other change. The question for the author is what the term covers here and what bounds it: whether it is a section of the record with dispositions of its own, or the name of what the loop does when the frontier bites the loop's own nodes; and whether a bound is owed, such as the author's ratification of every change to a node the loop uses to change itself. The node is placed under the model node as a peer of alignment and reconciliation, where the author's order puts it, and ranked last by that order.

Facts: authority none, an un-aligned disposition in the author's one word; boldness low, the reading of the word is the AI's; persistence open until the author answers.

### Frontier finding, 2026-09-03

Kind: coverage.

Four author quotations are carried verbatim on more than one node, verified by exact match. 'Who is this repository for? ... It can be pruned' on audience and coverage. 'purpose -> [scope, self documentation (via the graph browser)] (equal) -> alignment -> harness context management -> reconciliation -> rsi' on scope, self-documentation and rsi. 'Is this correctly encoded as form: assumption vs form: disposition with unvalidated instrumentation? Is assumption a form at all?' on knowledge-store, capture and purpose. 'assumption deserves a target disposition, along with tradition and disposition ...' on node and form-vocabulary. Frontier-consistency's validation 14 says every disposition the author has given is 'answered by exactly one node: none unanswered, none answered twice', and admits no case for a quote carried as context on a child.

Also named: commons.systems/disposition-graph/audience, commons.systems/disposition-graph/coverage, commons.systems/disposition-graph/knowledge-store, commons.systems/disposition-graph/capture, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/node, commons.systems/disposition-graph/form-vocabulary, commons.systems/disposition-graph/scope, commons.systems/disposition-graph/self-documentation.

Proposed: Most of these are legitimate context on a child that answers a part of the words, and the validation should say so: amend frontier-consistency's validation 14 to read that each part of a disposition is answered by exactly one node, and that a quotation may be carried on a child as the ground of the part it answers. Two are genuine double answers and should be resolved: audience and coverage both answer the audience question, which the audience prune resolves in coverage's favour; knowledge-store, capture and purpose all carry the form question, which forms answers, so all three should cite forms rather than each carry the quote.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `rsi-as-section` (ai, 2026-09-03); `rsi-as-loop-on-itself` (ai, 2026-09-03); `bound-by-ratification` (ai, 2026-09-03).
Merge analysis of the author's words: 2026-09-03, new-answer on commons.systems/disposition-graph/scope: The high-level order, purpose then scope and self-documentation equally, then alignment, harness context management, reconciliation, and rsi; the words are the scope node's order and are carried here as the ground of this node's placement and rank.
The census unit's note: No recommendation field, no Answer and no Draft, so it adopts nothing; it is an un-aligned disposition in the author's one word, and its account holds two readings and one bound open, minted as the three alternatives with source ai since the reading of the word is the AI's. The single author quotation is the order recorded and answered on scope, carried here as the ground of this node's placement and rank, so I classified it new-answer but added no alternative there. The coverage finding about duplicated quotations is recorded on nine nodes and proposes nothing that changes rsi, so nothing moved elsewhere from it.

### The two readings recorded as a probe, 2026-09-04

The reverse sweep of this day read every node of the graph and asked of each
whether it was a probe wearing a node's costume. None was, this one included:
the question "How does this system improve its own loop?" asks what should be
the case, the author placed it in their own recorded order, and nine files
reference its id. What the sweep found here instead was the opposite miss, and
it is the one the migration of this day should have caught.

The options `rsi-as-section` and `rsi-as-loop-on-itself` were not candidate
answers. Each ended by saying it was one of two readings the account put to the
author, and neither was recommended, which is the tell the author named on
2026-09-04 when they classified `cap-from-contract-class` and
`graph-landing-instrument` on `commons.systems/disposition-graph/review` as
maieutic questions rather than facts to be confirmed. The pattern is the same
here: the two were not two answers the AI held viable but one question about
what the author meant by a word they had already said, and the account said as
much in prose while the answer fact carried no recommendation at all. Under the
discriminator this record now states, a question the AI cannot answer and says
it cannot answer has no home as an option; it is a probe. The two are struck
and `what-rsi-names` records the question they were carrying.

`bound-by-ratification` and `loop-writes-options` stay. Both state something
the record could stand on rather than a reading to be chosen between, and
`loop-writes-options` comes from the author's own words of 2026-09-04, where it
reads the term the second way. That reading is evidence for an answer to the
probe and does not discharge it: the author recorded what the loop may write,
not what the word names.

The stage does not move; the node was already at the maieutic, which is where
the probe belongs.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/rsi stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). 1 `## Disposition` entry became the ledger entry words/2026-09-03/74, referenced by 0 options the entry's own date names. No content is recorded for `bound-by-ratification`, `loop-writes-options`: the record never wrote one and the migration invents none.
