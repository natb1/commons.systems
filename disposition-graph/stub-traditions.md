---
question: Which traditions does the record already read without a node?
stage: maieutic
facts:
  - name: answer
    options:
      - name: traditions-graph-stubs
        source: ai
        ref: "2026-09-03"
      - name: regenerate-enumeration
        source: review
        ref: "2026-09-03"
      - name: one-ruling-for-the-prose-lists
        source: review
        ref: "2026-09-03"
under:
  - commons.systems/disposition-graph/readings
---
## Disposition

The author, 2026-09-02:
> do not replicate tradition references in the rationale section. There is already a tradition section.

## Facts

### answer

#### traditions-graph-stubs

Every list of traditions to record as readings in a rationale becomes root nodes in the traditions graph, each an open question until read, and the list leaves the rationale; about thirty stub nodes, written by a unit after the traditions-home ruling. The proposal enumerates the rationales it would drain and rejects leaving the lists in place until each tradition is read, on the ground that the author ruled rationales do not carry tradition references and an unread tradition is an open question, which is a node. Its own text says the proposed node is pending, and it depends on traditions-home.

#### regenerate-enumeration

The cross-reference finding verifies by grep that fourteen nodes carry prose tradition lists and that the enumeration here misses three of them, dialogue, recording and scope, while naming instruments, which carries its traditions without the marker phrase. It proposes that the enumeration be regenerated from the record rather than maintained by hand, the same class of drift the scope node's order field was introduced to prevent, and that until then the three missing nodes be added. Raised on commons.systems/disposition-graph/audience.

#### one-ruling-for-the-prose-lists

Stub-traditions' answer says that the ruling on where prose tradition lists go settles it for every rationale that carries one, so the `traditions-to-readings` alternatives pending on materialization, validation-order, instruments and evaluation are consequences of this ruling rather than four separate ones. Verified that fourteen rationales carry such lists while this node's enumeration names twelve and misses dialogue, recording and scope, which is why the node's own `regenerate-enumeration` alternative asks that the enumeration be derived from the record instead of maintained by hand. On this alternative the two are taken together: the enumeration is derived, and the derived list is what the ruling drains, so no rationale needs its own pending alternative to say the same thing.

## Account

### Sitting on purpose, 2026-09-03

Proposed node: the traditions graph (new nodes)

**The prose lists of traditions become tradition nodes**

Every "traditions to record as readings" list in a rationale becomes root nodes in the traditions graph, each an open question until read, and the list leaves the rationale. The lists today stand on node (IBIS; the common-law restatement; Codd), authority (ultra vires; cgroup v2; object capabilities; corrigibility), instruments (Peirce; reflective equilibrium; Kuhn; Casey; management of change; IEC 61508), namespaces (Go modules; mount namespaces), persistence (optimistic concurrency; resource versions), work-loop (level-triggered reconciliation; one-piece flow), evaluation (the Pareto frontier; Chesterton's fence), review (Deming; content-addressed builds), session-context (the Unix README convention; twelve-factor configuration), materialization (the monorepo lineage), transience (Aristotle on hexis and kinesis; Kubernetes; feature toggles; expand and contract; the strangler fig; deprecation at Google; mission command), and validation-order.

Facts: authority deferred; boldness moderate; persistence open questions.

Rejected:
- Leave the lists in the rationales until each tradition is read. — The author ruled that rationales do not carry tradition references, and an unread tradition is an open question, which is a node.

Depends on: `traditions-home`

About thirty stub nodes, written by a unit after q2.

Proposed: pending.

Responses open: confirm as shown; confirm with edits; deny with feedback.

### Frontier finding, 2026-09-03

Kind: cross-reference.

Two prose references point at nodes that no longer say what is attributed to them. Audience's Proposal: 'the five-audience finding moves to scope' — verified stale, the finding is on coverage, whose own '### Sitting on purpose' section says 'The paragraph that addressed the audience node now addresses this question'. And stub-traditions enumerates the rationales carrying prose tradition lists as node, authority, instruments, namespaces, persistence, work-loop, evaluation, review, session-context, materialization, transience and validation-order; verified by grep that fourteen nodes carry such lists and that three of them — dialogue, recording and scope — are missing from the enumeration, while instruments carries its traditions without the marker phrase. Readings' draft rests its rule on that enumeration being the remedy.

Also named: commons.systems/disposition-graph/audience, commons.systems/disposition-graph/coverage, commons.systems/disposition-graph/readings.

Proposed: Audience's Proposal names coverage instead of scope. Stub-traditions' enumeration is regenerated from the record rather than maintained by hand — the same class of drift the scope node's order field was introduced to prevent — and until it is, dialogue, recording and scope are added. Readings' facts say that the remedy's enumeration is incomplete, so the author knows the size of what ratifying the rule puts on the frontier.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `traditions-graph-stubs` (ai, 2026-09-03); `regenerated-enumeration` (review, 2026-09-03); `regenerate-enumeration` (review, 2026-09-03, from commons.systems/disposition-graph/audience).
Merge analysis of the author's words: 2026-09-02, new-answer on commons.systems/disposition-graph/readings: Do not replicate tradition references in the rationale section, there is already a tradition section; the words are readings' rule and are carried here as the ground of the drain this node proposes.
The census unit's note: No recommendation field, so it adopts nothing, and the sitting block is itself the candidate answer, minted as the first alternative; the review's regenerated enumeration is the second. I excluded the one entry under Rejected in that block, leaving the lists in the rationales until each tradition is read, as an alternative already ruled out by the AI where a Rationale would carry it. The author's quotation answers readings, which carries it verbatim, so nothing moved there. The other half of the cross-reference finding, that readings' facts state the enumeration's incompleteness, is recorded on readings and claimed in its reply, so I left it there.

### Alternatives merged, 2026-09-03

The alternatives raised on this node by more than one census cohort were merged at the re-encoding, and any alternative the standing answer already carries was removed: `regenerate-enumeration` absorbs `regenerated-enumeration`.

### Frontier finding, 2026-09-03

Kind: merge.

Four questions are each pending as the same alternative on four to six different nodes, so the author would rule one question up to six times. Verified from the frontier's alternatives lists: (i) `say-instrument-not-criterion` is pending on scope, work-loop, transience and purpose, and each entry says the same thing — that until instruments is ruled the answer says 'instrument', the term instruments actually defines, since 'criterion' is in no node's `defines` and 'criteria' is not in FRONTMATTER_KEYS; instruments owns the question and stands at the maieutic stage with `define-criterion` pending. (ii) `delegated-not-ratified` is pending on software-factories, spec-driven-development, srs-introduction and web-routing, each saying that a reading whose source the author has not read is delegated and not ratified; readings owns the rule and all four recommendations have in fact already been corrected to delegated, so four alternatives now stand for a change already made. (iii) `traditions-to-readings` is pending on materialization, validation-order, instruments and evaluation, each saying the node's prose tradition list goes to readings under the stub-traditions ruling; stub-traditions owns the enumeration and its own `regenerate-enumeration` alternative says the enumeration is incomplete and should be derived rather than maintained by hand. (iv) The same ruling appears as `deferred-rather-than-ratified` on legacy and recording, `deferred-until-ruling-quoted` on validation-order and evaluation, and `deferred-not-ratified` on review and persistence — six nodes, three names, one question: whether a node recommending ratification with no ruling quoted in it should drop to deferred instead; quotes owns that question. Under validation 15 each of these is a new answer to a question the record already asks, standing as its own alternative on a node that does not own the question.

Also named: commons.systems/disposition-graph/instruments, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/scope, commons.systems/disposition-graph/work-loop, commons.systems/disposition-graph/transience, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/software-factories, commons.systems/disposition-graph/spec-driven-development, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/web-routing, commons.systems/disposition-graph/materialization, commons.systems/disposition-graph/validation-order, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/legacy, commons.systems/disposition-graph/persistence, commons.systems/disposition-graph/review, commons.systems/disposition-graph/recording.

Proposed: Instruments is the survivor of the criterion vocabulary, readings of a reading's class, stub-traditions of the prose tradition lists, and quotes of what an unquoted ratified stamp becomes. Each survivor takes one alternative saying that its ruling settles the question for every node that carries the per-node entry, and each per-node alternative is then a consequence of the survivor's ruling rather than a separate ruling — which is what the record already does for the four readings, whose class was changed once and recorded four times. The four per-node families stay listed so the author can see the blast radius, but the ruling order puts the survivor first and the alignment page should say that confirming the survivor discharges them. Case (ii) is the clearest: all four recommendations already read delegated, so those four alternatives are discharged and should be struck rather than ruled.

Recorded as a pending alternative on commons.systems/disposition-graph/instruments: `one-ruling-for-the-word` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/readings: `one-ruling-for-the-reading-class` (source review, 2026-09-03).

Recorded as a pending alternative on this node: `one-ruling-for-the-prose-lists` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/quotes: `one-ruling-for-the-unquoted-stamp` (source review, 2026-09-03).
