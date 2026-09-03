---
question: Which traditions does the record already read without a node?
stage: maieutic
alternatives:
  - name: traditions-graph-stubs
    source: ai
    ref: "2026-09-03"
  - name: regenerate-enumeration
    source: review
    ref: "2026-09-03"
under:
  - commons.systems/disposition-graph/readings
---
## Disposition

The author, 2026-09-02:
> do not replicate tradition references in the rationale section. There is already a tradition section.

## Alternatives

### traditions-graph-stubs

Every list of traditions to record as readings in a rationale becomes root nodes in the traditions graph, each an open question until read, and the list leaves the rationale; about thirty stub nodes, written by a unit after the traditions-home ruling. The proposal enumerates the rationales it would drain and rejects leaving the lists in place until each tradition is read, on the ground that the author ruled rationales do not carry tradition references and an unread tradition is an open question, which is a node. Its own text says the proposed node is pending, and it depends on traditions-home.

### regenerate-enumeration

The cross-reference finding verifies by grep that fourteen nodes carry prose tradition lists and that the enumeration here misses three of them, dialogue, recording and scope, while naming instruments, which carries its traditions without the marker phrase. It proposes that the enumeration be regenerated from the record rather than maintained by hand, the same class of drift the scope node's order field was introduced to prevent, and that until then the three missing nodes be added. Raised on commons.systems/disposition-graph/audience.

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
