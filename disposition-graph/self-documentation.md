---
question: How does this repository document itself?
stage: maieutic
probes:
  - id: does-a-declared-term-owe-a-sentence
    asks: >-
      A node's `defines` block does two jobs: it claims a term, so the projector
      can report when two nodes claim the same one, and it may carry the
      sentence a projection shows for that term. Ninety-six of the hundred and
      twenty-four terms this graph declares do the first job only. Is a bare
      claim a legitimate use of the field, or does the record owe those
      ninety-six sentences?
    fact: answer
    why: >-
      The record has an instrument reporting this and no disposition saying what
      the report means. `project.mjs` warns `term "X" has no gloss` once per
      bare entry, ninety-six times across thirty-three of the graph's
      hundred and sixty-five nodes, on every projection run; the warnings are
      the loudest thing the projector says and nothing acts on them. Read for an
      answer: `read.mjs`'s `DEFINES_KEYS`, which admits `term` and `gloss` and
      makes neither required; `derive.mjs`'s `glossary`, which builds the map
      from glossed entries alone and skips bare ones by design, so a bare claim
      is not a broken entry to that reader; and `project.mjs` at the conflict
      check and the gloss warning, which are two tests over one field.
    discharges: >-
      Whether the ninety-six findings are a backlog the record owes or a false
      positive the check owes, and therefore whether `defines` stays one field
      with an optional sentence or divides into the claim and the gloss. It does
      not move what this node says about the browser or the overview.
    source: ai
    raised: 2026-09-08
  - id: what-equal-means-in-the-order
    asks: >-
      What does the author mean by self-documentation and scope standing equal
      in the high-level order?
    why: >-
      The author's words give the order "purpose -> [scope, self documentation
      (via the graph browser)] (equal) -> ..." and nothing else on this
      question. Rank in this record is a share of a parent's rank split among
      siblings, so two nodes under different parents cannot be made equal in it;
      `attention`'s rule and `scope`'s `order` field realize the equality only
      as each being outranked by nothing but its own ancestors, and the record
      nowhere says which of the two the author meant. Read on this node's `##
      Account`, on `scope`'s `order` field, on `attention`, and on `projection`.
    discharges: >-
      Whether an exact equality is owed, which decides whether this node is a
      section of its own with a boost equal to scope's or the mapping to
      `projection` stands; it moves the topology fact's recommendation off
      `keep` and the answer fact's off `section-of-its-own`.
    source: ai
    raised: 2026-09-03
facts:
  - name: answer
    options:
      - name: section-of-its-own
        source: author
        ref: "2026-09-03"
        supports:
          - words/2026-09-03/74
      - name: overview-as-blog-shaped-content
        source: review
        ref: "2026-09-05"
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
  - name: topology
    options:
      - name: keep
      - name: prune
    recommends: keep
    boldness: moderate
under:
  - commons.systems/disposition-graph/purpose
---

## Facts

### answer

#### section-of-its-own

Self-documentation is a section of its own, this node under purpose, answering that the record is its own documentation, read through the graph browser in rank order, with a boost equal to scope's so that the equality the author stated is exact and scope's order field names this node in its first step. The browser's own disposition, owed by projection's shim, would then live under it. This is what the author's own words place in the high-level order, self documentation via the graph browser, equal with scope; the session also noted the author's remark that the browser may need a high-ranking disposition of its own.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

#### overview-as-blog-shaped-content

The record's overview, the introduction-shaped orientation a newcomer reads
before the graph, is not a node and not a section of the graph: it is provided
later by blog-shaped content, as the author said on 2026-09-02, which is what
the `srs-introduction` reading relies on when it records the standard's Overview
section as a divergence. Until that content exists the record has no overview
and says so. Raised by the clean-context review of `srs-introduction` on
2026-09-05, under validation 15: where the overview lives is this node's
question, and a reading may not settle it in passing.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

### topology

Prune: The session's mapping of the author's self-documentation section to the projection node stands, on the ground that projection's answer already makes the browser the human projection of the record, and this node is pruned. The cost is that the equality the author stated cannot be exact, since projection's rank is a share of model's and scope's a share of purpose's, and is realized only as each being outranked by nothing but its own ancestors. Scope's order field already encodes this mapping.

## Account

The author placed self-documentation through the graph browser equal with scope, just after purpose. The session mapped it to the projection node, whose shim is the browser and whose answer makes the browser the human projection of the record. That mapping cannot make the two equal in rank, since projection's rank is a share of model's, and the order rule realizes the equality only as each being outranked by nothing but its own ancestors. The question for the author: is self-documentation a section of its own, this node under purpose, answering that the record is its own documentation, read through the browser in rank order, with a boost equal to scope's so that the equality is exact and the order names this node in its first step; or does the mapping to projection stand, in which case this node is pruned? The session's reading is a node of its own, since the author named it as a section, said on 2026-09-03 that the browser may need a high-ranking disposition of its own, and the browser's disposition, owed by projection's shim, would live under it.

Facts: authority none, an un-aligned disposition in the author's words; boldness low, the mapping and the reading are the AI's; persistence open until the author answers.

### Frontier finding, 2026-09-03

Kind: coverage.

Four author quotations are carried verbatim on more than one node, verified by exact match. 'Who is this repository for? ... It can be pruned' on audience and coverage. 'purpose -> [scope, self documentation (via the graph browser)] (equal) -> alignment -> harness context management -> reconciliation -> rsi' on scope, self-documentation and rsi. 'Is this correctly encoded as form: assumption vs form: disposition with unvalidated instrumentation? Is assumption a form at all?' on knowledge-store, capture and purpose. 'assumption deserves a target disposition, along with tradition and disposition ...' on node and form-vocabulary. Frontier-consistency's validation 14 says every disposition the author has given is 'answered by exactly one node: none unanswered, none answered twice', and admits no case for a quote carried as context on a child.

Also named: commons.systems/disposition-graph/audience, commons.systems/disposition-graph/coverage, commons.systems/disposition-graph/knowledge-store, commons.systems/disposition-graph/capture, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/node, commons.systems/disposition-graph/form-vocabulary, commons.systems/disposition-graph/scope, commons.systems/disposition-graph/rsi.

Proposed: Most of these are legitimate context on a child that answers a part of the words, and the validation should say so: amend frontier-consistency's validation 14 to read that each part of a disposition is answered by exactly one node, and that a quotation may be carried on a child as the ground of the part it answers. Two are genuine double answers and should be resolved: audience and coverage both answer the audience question, which the audience prune resolves in coverage's favour; knowledge-store, capture and purpose all carry the form question, which forms answers, so all three should cite forms rather than each carry the quote.

### Frontier finding, 2026-09-03

Kind: coverage.

Three of projection's children are at the periagogic or maieutic stage holding author words that projection's own draft partly answers. Vocabulary-view holds 'technical repo vocabulary ... will need to be recorded on the onboarding path ... References to tradition also need to be clearly called out with appropriate layout', and projection's draft answers half of it ('Every defined term and every tradition's name links to the node that defines it'). Frontier-metrics holds the heading-metrics disposition, whose metrics 'are signals/instruments/criteria of some disposition' and would amend projection. Self-documentation holds the author's own placement of self-documentation as a section equal with scope, which scope's order field has already mapped to projection. Ruling projection settles parts of all three before their own dialogues have run.

Also named: commons.systems/disposition-graph/projection, commons.systems/disposition-graph/frontier-metrics, commons.systems/disposition-graph/vocabulary-view.

Proposed: Rule projection with one clause saying which of the three questions it does not settle, or hold projection until self-documentation is answered, since that answer decides whether projection is the self-documentation section at all and scope's order field encodes the mapping. The cheapest sequence is: answer self-documentation (maieutic, one question to the author), then rule scope and projection together, then run the two periagogic sittings on frontier-metrics and vocabulary-view against a settled projection node.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `section-of-its-own` (author, 2026-09-03); `fold-into-projection` (ai, 2026-09-03).
Merge analysis of the author's words: 2026-09-03, own-question: The high-level order is purpose, then scope and self documentation via the graph browser as equals, then alignment, then harness context management, then reconciliation, then rsi.
Moved to other nodes as alternatives: `absorb-self-documentation` on commons.systems/disposition-graph/projection; `order-names-self-documentation` on commons.systems/disposition-graph/scope.
The census unit's note: The node has no recommendation field, so it adopts nothing. Its account holds two candidates open and I named them both: the section of its own, which the author's own words support, and the fold into projection, which is the session's mapping and prunes this node. The redundancy between this question and projection's is real and is the node's own subject, so I put the fold on projection as an ai-sourced alternative and the consequence for the order field on scope. The author's high-level-order quotation is carried on ten nodes; here it is the ground of this node's own question, so I classed it own-question rather than moving it. The duplicated-quotations coverage finding is emitted from purpose only.

### The scope test, 2026-09-04

The delta sweep of 2026-09-04, run under `commons.systems/disposition-graph/author-questions` with the tests of `commons.systems/disposition-graph/probe-or-node`, put the scope test to `what-equal-means-in-the-order` and could not settle it: a response of "the equality is exact" moves this node's existence fact, and `order-names-self-documentation` on scope and `absorb-self-documentation` on projection with it, both minted from this node. The unit left open whether those move on the response or on this node's existence ruling. The main thread read them as moving on the ruling, so the response is exhausted by this node's facts and the entry stays a probe, which is where doubt resolves; scope and projection enter this node in their `depends`, since their rulings wait on it either way. The node itself passes the ruling test on its existence fact, and the independence test against purpose does not fire, since what would prune it is projection's absorption and not a move of purpose's recommendation.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/self-documentation stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). 1 `## Disposition` entry became the ledger entry words/2026-09-03/74, referenced by 1 option the entry's own date names. No content is recorded for `section-of-its-own`, `overview-as-blog-shaped-content`: the record never wrote one and the migration invents none.

### What the projector already says about this record's vocabulary, 2026-09-08

This node asks how the repository documents itself, and the repository has an
answer to part of that which no node had yet read. The projector's contract
check runs on every projection and reports, in this measurement of 2026-09-08:
the graph holds 165 nodes; 40 of them declare terms; 124 terms are declared;
28 carry a gloss and 96 do not; the 96 fall across 33 nodes. `dialogue` carries
11 of them, `growth` 7, `transience`, `readings` and `instruments` 5 each. Among
the bare terms are `dialogue` on `dialogue`, `probe` on `author-questions`,
`doctrine` and `proposal` on `authority`, and `clean-context review` on
`clean-context-review`: in each case the node that owns the term claims it and
says nothing about it in the field built to hold the saying.

The finding is not that the record is undocumented. The glossary convention is
live and used 28 times, and `derive.mjs` reads it to gloss an option by its
name. The finding is narrower and is why this is a probe: one field is carrying
two jobs. `defines` claims a term, which is what the conflict check reads, and
it may also carry a sentence, which is what `glossary` reads; `glossary` skips a
bare entry deliberately, so to that reader a bare claim is well-formed, while
`project.mjs` warns on it. Two readers of one field disagree about whether it is
complete, and the record has never said which is right.

Two terms are claimed twice, which the same check reports separately: `answer`
by both `dialogue` and `node`, and `persistence` by both `dialogue` and
`transience`. Those are recorded on `dialogue`, which is a party to both.

What makes this worth a node's attention rather than a cleanup task is the
blind spot on the other side. The check can only see terms some node has
claimed. `discharge` is used 330 times across 73 of the 165 node files, is the
one status the probe schema admits, and is claimed by no node at all, so it
produces no finding; the author asked what it means on 2026-09-08 and the record
could not answer from its own text. So the instrument reports the claimed and
unglossed and is silent about the unclaimed and load-bearing, and the second set
is where the damage was actually found. Whatever this node answers about the
glossary should say which of the two problems it is solving.
