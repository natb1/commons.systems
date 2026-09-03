---
question: Who may change an answer?
stage: ruling
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/model
tier: global
defines:
  - authority
  - ratified
  - delegated
  - deferred
  - doctrine
  - author
shims:
  - artifact: the bootstrap grant, under which the AI stubs nodes and materialized implementation stamped deferred with no ratified ancestor
    for: the scope rule of this node before any answer is ratified
    liquidation: the root and the purpose node are ratified, after which every deferred answer stands under a ratified ancestor
    declared: 2026-09-02
---
## Disposition

The author, 2026-09-02:
> Any doctrine on the recorded graph (by definition ratified disposition) must be rolled back to deferred for review. Ratification can only be done by alignment periagogic/maieutic dialogue (what we are doing now, though via shim). The first valid ratifications/doctrine will be the outputs of this first alignment dialogue.

The author, 2026-09-02:
> Authority: proposal. I think this is mislabeled by existing disposition. Proposal indicates a contradiction with doctrine and no authority to act (confirm?) but there is no doctrine yet, and you have bootstrapped deferred graph and implementation based on this disposition.

The author, 2026-09-03:
> The ledger is a shim, it shouldn't receive standing disposition. Ratified as a shim. The standing disposition (ratified) is that ratification happens only through alignment dialogue.

The author, 2026-09-03:
> Author quotes on disposition are rarely expected to be recorded as disposition verbatim. Dialogue is expected to edit for clarification and writing quality. It may make sense to retain original author quotes as reference though - evaluate whether this function earns new schema.

## Answer

Every answer carries a stamp: who holds it, with what class, and since when. Ratified means the author decided, in the alignment interview after its dialectic, and wants to be asked before it changes. The session that ran the interview writes that stamp in the author's name and quotes the author's ruling, with its date, in the node; a ratified stamp whose ruling is not in the record is invalid. Ratification happens only through the alignment dialogue; transcribing the author's words from any other record confers nothing, and no command does: a script that stamps on request is a rubber stamp, and the guard against rubber stamps is the dialectic itself, whose steps the round accounts for. Delegated means the author handed that class of decision to the AI and does not want to be asked again. Deferred means the AI decided within the author's rules and owes the author a review. Doctrine is the ratified answers taken together. The AI exercises authority within scope: it may answer under a ratified ancestor, may change delegated answers at will, and records anything that would contradict doctrine or exceed its scope as a proposal, which has no authority and acts on nothing until the author rules. A proposal that contradicts doctrine also triggers review of the delegated disposition it was made under.

## Rationale

Attenuation: authority only narrows as it is handed down, never widens, so a breakout would have to be written up the tree, and nothing writes up. Rejected: recording out-of-scope answers as deferred, because deferred still acts. Rejected, 2026-09-02: a ratify command run by the author as the act of ratification. The author: "Ratification is not a rubber stamp. I don't see the function of a ratification script and it can probably be liquidated with updated disposition/doctrine." The command guaranteed nothing, since it stamped under the same version-control identity every session commits with, and it made the act a keystroke instead of a decision; it is liquidated. Traditions to record as readings: ultra vires and enabling acts; delegation containment in cgroup v2; attenuation in object-capability systems; corrigibility and approval-directed agents in the alignment literature.

The author, 2026-09-03, on the bootstrap ledger: "The ledger is a shim, it shouldn't receive standing disposition. Ratified as a shim. The standing disposition (ratified) is that ratification happens only through alignment dialogue." And later that day: "The ledger is expected to be sunset and encoded as deferred dispositions. I am concerned that it has not been, I am concerned about drift between the ledger and the greenfield graph." The ledger shim declared here on 2026-09-02 was liquidated on 2026-09-03: every entry was sorted, by the survey `bootstrap/ledger-migration-survey-2026-09-03.md` on the implementation ref and by the session for the entries after it, into a node amendment, a shim declaration, an un-aligned disposition, or nothing, and the file was deleted. While it stood no stamp was ratified, and none is yet; the first ratified stamps are those the sitting on purpose writes.


## Proposal

### Sitting on purpose, 2026-09-03

**The authority node, whole**

Adds to today's recording: a node without a stamp is an open question; proposal is content, never a class, and dies at the ruling into an answer, a rejected alternative, or nothing; the deferred stamps are the review queue; the ruling that earned a ratified stamp is in the landing commit and restated in the rationale (q10). The prose list of traditions leaves the rationale for the stub tradition nodes (n-stub-traditions). The two shims declared today stay.

Facts: authority ratified; boldness low; moderate on the ruling-in-the-record sentence; persistence standing.

Rejected:
- Keep proposal as a fourth authority class. — A class with no authority is a review-queue label, and the deferred stamp already is that queue; the page had labelled purpose "proposal" only because it had no stamp.
- Quote the ruling verbatim in the node, as the node said until today. — Open as q10.

Depends on: `quotes`

Proposed text:

```markdown
---
question: Who may change an answer?
form: disposition
authority:
  class: ratified
  by: Nathan Buesgens
  date: <the date of the ruling>
under:
  - commons.systems/disposition-graph/model
tier: global
defines:
  - authority
  - ratified
  - delegated
  - deferred
  - doctrine
  - author
  - proposal
shims:
  - artifact: "`LEDGER.md` on the implementation ref"
    for: the record of the author's rulings during bootstrap, held as evidence; while it stands no stamp is ratified, and the first ratified stamps are those the sitting on `purpose` writes
    liquidation: every entry is sorted into a node amendment, a criterion, a shim declaration, evidence, or nothing, and the file is deleted
    declared: 2026-09-02
  - artifact: the bootstrap grant, under which the AI stubs nodes and materialized implementation stamped deferred with no ratified ancestor
    for: the scope rule of this node before any answer is ratified
    liquidation: the root and the purpose node are ratified, after which every deferred answer stands under a ratified ancestor
    declared: 2026-09-02
---
## Answer

Every answer carries a stamp: who holds it, with what class, and since when. A node without a stamp is an open question, not an answer. Ratified means the author decided, in the alignment dialogue after its dialectic, and wants to be asked before it changes. Ratification happens only through that dialogue: the session that ran the sitting writes the stamp in the author's name, and the ruling that earned it is in the record, in the commit that lands it and restated in the node's rationale; transcribing the author's words from any other record confers nothing, and no command does, since a script that stamps on request is a rubber stamp and the guard against rubber stamps is the dialectic itself. Delegated means the author handed that class of decision to the AI and does not want to be asked again. Deferred means the AI decided within the author's rules and owes the author a review; the deferred stamps are the author's review queue. Doctrine is the ratified answers taken together. A proposal is content, never a class: a candidate answer, an amendment, or a finding with no authority, recorded in a stamped node or in a sitting's record for the author's ruling, where it becomes an answer, a rejected alternative, or nothing. The AI exercises authority within scope: it may answer under a ratified ancestor, may change delegated answers at will, and records anything that would contradict doctrine or exceed its scope as a proposal, which acts on nothing until the author rules. A proposal that contradicts doctrine also triggers review of the delegated disposition it was made under.

## Rationale

Attenuation: authority only narrows as it is handed down, never widens, so a breakout would have to be written up the tree, and nothing writes up. Rejected: recording out-of-scope answers as deferred, because deferred still acts; a ratify command run by the author as the act of ratification, because it guaranteed nothing, stamped under the same version-control identity every session commits with, and made the act a keystroke instead of a decision; proposal as an authority class, because a class with no authority is a review-queue label and the deferred stamp already is that queue.
```

Rulings open: ratify as shown; ratify with edits; defer; overrule.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Proposal, Proposed text, frontmatter: the draft re-declares the LEDGER.md shim of 2026-09-02, whose condition the node's own rationale says was met on 2026-09-03 ('every entry was sorted ... and the file was deleted'). Transience: 'a shim whose condition is met and which still exists is a frontier item.' Suggested edit: drop it and keep only the bootstrap-grant shim.
- Draft Answer, sentence 2: 'A node without a stamp is an open question, not an answer.' Transience and the current node node make the test the absence of an '## Answer' section, not the absence of a stamp. Purpose today has an answer and no stamp, so the two rules classify the same node differently, and transience hides open questions from the browser while this rule does not. Suggested edit: make the test identical in both nodes and name the thing once.
- Draft Answer: 'the ruling that earned it is in the record, in the commit that lands it and restated in the node's rationale.' This weakens today's rule, which requires the ruling quoted with its date in the node, and presumes the recommended option on quotes, which is unruled. The facts call this sentence 'moderate' boldness without saying it is contingent.
- Draft frontmatter 'form: disposition' presumes the forms ruling; 'Depends on' lists only quotes.

On the three facts: Ratified, low boldness, standing is right for the rule the author stated on 2026-09-03. The facts should list the shim explicitly with its liquidation condition, as growth's presentation rule requires, and should mark the ruling-in-the-record sentence as contingent on quotes.

Strongest counter-argument (strong): The node's central integrity rule becomes unenforceable under the change it proposes. 'A ratified stamp whose ruling is not in the record is invalid' can be checked today because the ruling is quoted in the node file: the validator can see it, the browser can project it, and a clean-context reviewer can read it. If the ruling lives in the commit message that lands it, nothing that reads the graph can see it, and an invalid ratified stamp becomes undetectable by the record's own instruments. The node itself says the guard against rubber stamps is the dialectic; under the recommended quotes option the dialectic's only durable trace sits outside the graph, on an orphan ref's history.

The session's reply: The counter-argument is right, and the record stands with it. The answer as it stands requires the ruling quoted in the node with its date, every node amended on 2026-09-03 quotes the author's words under Disposition, and the session's recommendation on quotes changes to keeping rulings in the node, so the draft's sentence that puts the ruling in the commit message is withdrawn. Accepted: the draft's re-declared ledger shim is stale, the ledger having been liquidated on 2026-09-03; and the test for an un-aligned disposition is the absence of an Answer section, as transience and the validator have it, which the draft takes at the recording.
