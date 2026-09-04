---
question: Who may change an answer?
stage: ruling
recommendation:
  adopts: standing
  class: ratified
  boldness: moderate
  amends: "0a273ae3449272b35acc7d47e266cf3cb1b3c571"
  at: "6d21d356d65f5fa206cb60bc3e923c462acc920e"
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: 0a273ae3449272b35acc7d47e266cf3cb1b3c571
alternatives:
  - name: bootstrap-authority-as-class
    source: ai
    ref: "2026-09-03"
  - name: clause-level-ratification
    source: review
    ref: "2026-09-03"
  - name: ceiling-moves-here
    source: review
    ref: "2026-09-03"
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-03
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
  - artifact: bootstrap authority, an explicit grant from the author by which an alignment session may reconcile an unanswered node — writing an answer, an overrule, or an amendment onto a node whose dialectic has not concluded, and landing the materialized implementation that follows — which the scope rule of this node otherwise reserves to the dialectic
    for: the scope rule of this node during bootstrap, when nothing is ratified and so no answer has a ratified ancestor to be answered under
    liquidation: bootstrap exit, at the swap of the implementation ref with the main branch, after which the grant expires and an unanswered node is reconciled only through the dialectic
    declared: 2026-09-03
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

The author, 2026-09-03, on the sitting of dialogue, narrowing this node's definition of a proposal:
> closer to the second meaning. A conflicting answer that arises outside of alignment is a proposal. eg. via some evidence/signal/instrument/criteria or because a conflict is identified outside of alignment. The term must not be overloaded - it is technical vocabulary. This narrows the authority node definition is that conflicting answers evaluated in alignment are recorded differently.

The author, 2026-09-03, on the sitting of dialogue, on what grounds work while an alternative is pending on an answer, whatever its class:
> When an alternative is pending on ANY node with authority (ratified, deferred or delegated - remember that ratified has specific technical meaning) the previously confirmed answer keeps its full authority until an alternative is confirmed.

## Answer

Every answer carries a stamp: who holds it, with what class, and since when. A node without a stamp is unanswered, as the unanswered node says. Ratified means the author decided, in the alignment dialogue after its dialectic, and wants to be asked before it changes. Ratification happens only through that dialogue: the session that ran the sitting writes the stamp in the author's name, and the ruling that earned it is quoted in the node with its date; a ratified stamp whose ruling is not in the record is invalid; transcribing the author's words from any other record confers nothing, and no command does, since a script that stamps on request is a rubber stamp and the guard against rubber stamps is the dialectic itself, whose steps the round accounts for. Delegated means the author handed that class of decision to the AI and does not want to be asked again. Deferred means the AI decided within the author's rules and owes the author a review; until the author rules, a deferred answer is unanswered, as the unanswered node says, and carries the stage of the dialogue owed on it. Doctrine is the ratified answers taken together. A standing answer of any class keeps its full authority while an alternative to it is pending, until the author confirms an alternative. A proposal is technical vocabulary and is not overloaded: a conflicting answer that arises outside alignment, from evidence, a signal, an instrument, a criterion, or a conflict identified in reconciliation. It has no authority and acts on nothing; it is recorded on the node it conflicts with as an alternative whose source names the instrument or the node that raised it, and it opens the dialogue on that node at the periagogic stage, as the dialogue node says. A conflicting answer that arises in alignment is not a proposal; it is an alternative in the dialogue state, with its source, and is recorded as the dialogue node says. The AI exercises authority within scope: it may answer under a ratified ancestor, may change delegated answers at will, and records anything that would contradict doctrine or exceed its scope as an alternative on the node it conflicts with, a proposal when it arose outside alignment, which acts on nothing until the author rules. Such an alternative also triggers review of the delegated disposition it was made under.

## Rationale

Attenuation: authority only narrows as it is handed down, never widens, so a breakout would have to be written up the tree, and nothing writes up. Rejected: recording out-of-scope answers as deferred, because deferred still acts. Rejected, 2026-09-02: a ratify command run by the author as the act of ratification. The author: "Ratification is not a rubber stamp. I don't see the function of a ratification script and it can probably be liquidated with updated disposition/doctrine." The command guaranteed nothing, since it stamped under the same version-control identity every session commits with, and it made the act a keystroke instead of a decision; it is liquidated. Rejected: proposal as an authority class, because a class with no authority is a review-queue label and the deferred stamp already is that queue. Traditions to record as readings: ultra vires and enabling acts; delegation containment in cgroup v2; attenuation in object-capability systems; corrigibility and approval-directed agents in the alignment literature.

The author, 2026-09-03, on the bootstrap ledger: "The ledger is a shim, it shouldn't receive standing disposition. Ratified as a shim. The standing disposition (ratified) is that ratification happens only through alignment dialogue." And later that day: "The ledger is expected to be sunset and encoded as deferred dispositions. I am concerned that it has not been, I am concerned about drift between the ledger and the greenfield graph." The ledger shim declared here on 2026-09-02 was liquidated on 2026-09-03: every entry was sorted, by the survey `bootstrap/ledger-migration-survey-2026-09-03.md` on the implementation ref and by the session for the entries after it, into a node amendment, a shim declaration, an un-aligned disposition, or nothing, and the file was deleted. While it stood no stamp was ratified, and none is yet; the first ratified stamps are those the sitting on purpose writes.

The author, 2026-09-03, in the sitting on the dialogue node, quoted above, narrowed the word proposal: the draft of this node had defined it as any candidate answer, amendment, or finding with no authority, recorded in a stamped node or in a sitting's record, and the author ruled that the term is technical vocabulary for a conflicting answer arising outside alignment, that it must not be overloaded, and that conflicting answers evaluated in alignment are recorded differently, as alternatives in the dialogue state. The same day the author ruled that a standing answer of any class, ratified, delegated, or deferred, keeps its full authority while an alternative is pending, and that a proposal from outside alignment opens the dialogue on its node. This answer was written from the draft under the author's bootstrap grant on the dialogue node, folding the draft's text into the standing answer with the narrowing; the ratified stamp the draft carried is what a confirmation confers and is not written before it. Rejected: proposal as any recorded candidate, the draft's definition, since it overloaded a term the author reserves for the outside-alignment case and would have named the AI's own account and every alternative in a sitting with one word.

## Alternatives

### bootstrap-authority-as-class

Recorded on the node as a tension the sitting did not decide. Bootstrap authority is declared here as a shim, but it is a standing permission exercised only when the author invokes it, not a stopgap artifact applied by default, which is what evaluation's shim rule describes. Either the shim vocabulary covers two kinds, or bootstrap authority is a second class of authority beside ratified, delegated and deferred, which this node's answer would then have to define. The author's words name it a shim and it is recorded as one, so what is pending is the class.

### clause-level-ratification

A frontier finding carried on this node observes that the author ruled clause by clause on growth — 'Ratified on the rule. Ratified on the shim.' — while the record gives a node one stamp, so a ruling the author has given is recorded nowhere and the author will be asked for it again. The finding says that whether a clause can be ratified separately is a question for this node and should be minted here. The alternative is an answer that lets a stamp attach to a named clause rather than to the whole node. Also raised on commons.systems/disposition-graph/growth.

### ceiling-moves-here

The decomposition finding proposes that under survive as the edge alone and that three of the four terms it defines move to the nodes that answer them, rank to attention, context to session-context, and ceiling to authority, whose answer already carries the scope rule the term names: that a node's ceiling is its nearest ratified ancestor and nothing recorded under it may contradict it. Verified: under's defines carries ceiling and authority's does not, and authority is not among the nodes the finding names, so the proposed change to its defines is recorded nowhere on it. The cross-reference finding adds that ceiling and up-to-the-roots are two different rules for the reviewer's world, coinciding today only because nothing is ratified. Raised on commons.systems/disposition-graph/rationale-edge, commons.systems/disposition-graph/session-context, commons.systems/disposition-graph/attention, commons.systems/disposition-graph/under.

## Account

### The stub grant expired, 2026-09-03

The author, 2026-09-03:
> bootstrap authority to stub nodes is now expired in lieu of unanswered node concepts.

and, correcting the wording the same day:
> (replaced by, not "in lieu of")

The first shim on this node is struck. It read "the bootstrap grant, under which the AI stubs nodes and materialized implementation stamped deferred with no ratified ancestor", declared 2026-09-02, to be liquidated when the root and the purpose node were ratified. It is liquidated earlier and on a different ground: not that a ratified ancestor now exists, since none does, but that the thing it authorized has been replaced.

What replaced it. The grant existed because this node's scope rule lets the AI answer only under a ratified ancestor, and a stub was an answer written where there was none. Under the model the author ruled on the same day, what the AI writes when it opens a question is not an answer but an unanswered disposition: a node carrying a question and the dialogue state on it, which has no authority and grounds no work until it is answered. That needs no grant, because it exercises no authority. The mechanism the shim stood in for now exists in the record, which is what liquidates a shim.

The consequence for what is already recorded, and the reading that makes the expiry safe. Forty-six nodes carry a deferred stamp and not one stands under a ratified ancestor, so if a deferred answer were an exercise of the scope rule, striking this shim would leave all forty-six unsupported. It is not: `unanswered` holds that until the author rules a deferred answer is unanswered, and `dialogue` holds that such a node's text is the AI's draft. The scope rule governs answered writes, the ratified and the delegated. The forty-six are drafts in open dialogues, and the expiry costs them nothing. This reading is what the replacement rests on, and it is stated here because striking the shim without it would silently unsupport a third of the graph.

What remains. The second shim, bootstrap authority, is untouched and covers something the stub grant did not: an explicit grant letting an alignment session reconcile an unanswered node and land the implementation that follows. Stubbing needed no ruling from the author; reconciling one does, which is why the two expire at different times and why they were not merged.

Two cross-references were left stale by the strike. On the author's instruction of 2026-09-03 they are annotated where they stand, rather than rewritten: each is a recorded review finding or reply, and editing what a review said would falsify the record of the review while leaving its date and verdict in place. `evaluation`'s recorded reply grounds the scope of its overrule rule in "the bootstrap grant declared on the authority node", which no longer exists; the substance holds unchanged, since nothing is ratified and the overrule's scope is still the whole record, but the citation should move to the unanswered model. And the frontier finding carried on `recording`, `dialogue` and `growth` that "'bootstrap grant' ... is defined nowhere" is half resolved: the term it names is gone, while the term that replaced it, bootstrap authority, is defined in its own shim text and still not in `defines`.

The `## Draft` on this node carried the struck shim too, and confirming it would have restored an expired grant. The draft's shims are brought into line with the frontmatter in the same edit. This is the second instance today of a draft diverging from the node it drafts, after `node`'s answer, and it is the case the finding recorded on `dialogue` predicts: the review pin hashes the draft, so the frontmatter's shim list can change under a reviewed draft without the frontier saying so.

### Bootstrap authority declared as a shim, 2026-09-03

The author, 2026-09-03:
> also record the concept of bootstrap authority as an alignment shim - unanswered nodes may be reconciled by alignment with explicit bootstrap authority, but that authority expires on bootstrap exit

Declared as the second shim above, beside the bootstrap grant then on this node and not merged with it, because the two differ in both scope and expiry. The author expired that first grant later the same day, so this is now the only shim here. The existing grant covers the AI stubbing nodes and implementation with deferred stamps where no ratified ancestor exists, and liquidates when the root and the purpose node are ratified. This one covers something the scope rule otherwise reserves: an alignment session writing an answer, an overrule, or an amendment onto a node whose dialectic has not concluded, and landing the implementation that follows. It expires later, at bootstrap exit, because the condition that makes it necessary — that nothing is ratified, so nothing can be answered under a ratified ancestor — persists until the swap.

Three properties the author's words fix, and the record should not soften. The grant is **explicit**: it is given in the author's words for a named reconciliation and is never assumed, never inferred from a prior grant, and never standing. It is **alignment's**: it lets the alignment session cross into what the dialectic would otherwise decide, and, as exercised on 2026-09-03, into the implementation ref that `work-loop` divides away from this skill. And it **expires**: at bootstrap exit the grant is gone, and an unanswered node is thereafter reconciled only through the dialectic, which is what this node's answer already says.

Exercised on 2026-09-03, and the exercises are the evidence for the shim: the lockfile committed to the implementation ref before its question was answered; the model of the unanswered disposition reconciled on `transience`, `node` and `un-aligned-children`, with the no-children rule struck and its instrument removed; `dialogue` reconciled to the three requirements the author set; and the alignment skill reconciled to the result. Each carries the author's words on the node it changed.

A finding on the shim vocabulary, not decided here. `evaluation` holds that "a shim declared on the record is applied by default; a prompt is required only to bypass it." This shim inverts that: it is a permission that does nothing until the author invokes it, and applying it by default would be precisely the capture it guards against. Either the shim vocabulary covers two kinds — a stopgap artifact standing in for a projection, and a standing permission exercised on demand — or bootstrap authority is not a shim but a second class of authority alongside ratified, delegated and deferred, which this node defines. The author's words name it a shim and it is recorded as one; the tension is put to `evaluation` and to this node's own answer as a proposal.

This node stands at the review stage with a kickback verdict of 2026-09-03, so the work that kickback names is owed independently of this shim, and the node's text has changed since that review.

### Sitting on purpose, 2026-09-03

**The authority node, whole**

Adds to today's recording: a node without a stamp is unanswered; proposal is content, never a class, and dies at the ruling into an answer, a rejected alternative, or nothing; the deferred stamps are the review queue; the ruling that earned a ratified stamp is in the landing commit and restated in the rationale (q10). The prose list of traditions leaves the rationale for the stub tradition nodes (n-stub-traditions). The two shims declared today stay.

Facts: authority ratified; boldness low; moderate on the ruling-in-the-record sentence; persistence standing.

Rejected:
- Keep proposal as a fourth authority class. — A class with no authority is a review-queue label, and the deferred stamp already is that queue; the page had labelled purpose "proposal" only because it had no stamp.
- Quote the ruling verbatim in the node, as the node said until today. — Open as q10.

Depends on: `quotes`

Proposed text: the draft section of this node.

Responses open: confirm as shown; confirm with edits; deny with feedback.

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

### Clean-context review of the amendment, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, the author's words, and the amendment named in the brief, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The amended sentence is not carried into the node's own draft. The Proposal's 'Proposed text' still reads 'Deferred means the AI decided within the author's rules and owes the author a review; the deferred stamps are the author's review queue.' The alignment page's caption for a ruling-stage node with an answer is "'as shown' means the draft in it", so a confirmation ratifies the unamended sentence and the amendment is lost at the recording. The same is true of two other sentences the session's own reply already withdrew: 'A node without a stamp is an open question, not an answer', and 'the ruling that earned it is in the record, in the commit that lands it'. Suggested edit: apply the accepted changes to the draft before the author rules, or list in the Proposal which draft sentences are already withdrawn.
- Amended sentence, 'and carries the stage of the dialogue owed on it': stated as an unconditional property of a deferred answer, but nothing enforces it — read.mjs requires a stage only when there is no '## Answer' or when a '## Disposition' is present. The sentence reads as a fact about the record and is in truth a rule the record happens to satisfy. Suggested edit: say the validator is to hold it, as unanswered claims it already does.
- Amended sentence against the rest of the answer: the node still says the AI 'may change delegated answers at will', and evaluation adds that deferred answers may be overruled on the AI's best judgment. With the amendment, a deferred answer is a draft at a stage in an open dialogue, so an overrule silently changes the text the author is queued to rule on. Neither this node nor evaluation points at dialogue's 'of' pin, which exists for that case. Suggested edit: add that an overrule of an unanswered draft re-opens the review.
- Vocabulary: the amendment introduces 'unanswered' into the node that defines the stamp vocabulary, while this node's own draft uses 'open question' for a neighbouring notion and node's draft uses it for a third. Three names for adjacent things remain live inside one batch.

On the three facts: The Facts line ('authority ratified; boldness low; moderate on the ruling-in-the-record sentence; persistence standing') is not updated for the amendment and does not mention it. The amended clause is not low boldness: the author's 2026-09-03 ruling quoted here is about classifying dispositions as unanswered, and the consequence drawn for the stamp vocabulary is the AI's. The facts should also carry the bootstrap-grant shim with its liquidation condition, which this node declares and which growth's presentation rule requires.

Strongest counter-argument (moderate): Saying a deferred answer is unanswered puts the record's definition of authority at odds with how the record behaves. Deferred answers act: every file under .claude/rules/ is deferred, every session works under them, the projector writes them, and this batch was produced by them. Calling all of that 'unanswered' is accurate about the author's assent and misleading about the answers' force, and it leaves the record with no plain word for 'no answer at all', since transience now says the un-aligned disposition carries the same fields as everything else. The draft's own formulation — the deferred stamps are the author's review queue — says the same thing about assent without claiming the answers are absent.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: kicked back to the maieutic stage.

Findings:

- The Draft — which is what a confirmation ratifies — still carries three passages the session's own replies withdrew. Draft Answer: 'A node without a stamp is an open question, not an answer' (the reply accepted that 'the test for an un-aligned disposition is the absence of an Answer section'); 'the ruling that earned it is in the record, in the commit that lands it and restated in the node's rationale' (the reply: 'the draft's sentence that puts the ruling in the commit message is withdrawn'); and the re-declared LEDGER.md shim (the reply: 'the draft's re-declared ledger shim is stale, the ledger having been liquidated'). Verified: 'ls LEDGER.md' fails and the file is not in 'git ls-files'. A shim naming a file that does not exist cannot be checked, and the node is the one that defines the stamp vocabulary the whole batch rests on. This is why the verdict is a kickback.
- The second review section, 'Clean-context review of the amendment', has no session reply: the file ends with a bare 'null' on its own line. Four findings and a counter-argument are recorded with nothing answering them, and the author would rule on an unanswered review. Suggested edit: write the reply, or state that the findings are accepted.
- The Draft's Answer and the node's standing Answer now differ on what a deferred answer is — 'the deferred stamps are the author's review queue' against 'until the author rules, a deferred answer is unanswered, as the unanswered node says, and carries the stage of the dialogue owed on it' — and the Proposal does not say which the author is ruling on.
- Answer, amended clause: 'and carries the stage of the dialogue owed on it'. Verified partly enforced: read.mjs raises 'is unanswered and must carry stage' when deriveStatus returns unanswered and stage is null, so the rule does hold for a node with a deferred stamp. The previous review's finding that nothing enforced it is now stale and should be corrected rather than left standing.
- Vocabulary: this node's draft uses 'open question' for the thing transience defines as 'un-aligned disposition' and growth's amended list now calls by that name. Fifteen nodes use 'open question'; no node defines it.

On the three facts: The frontmatter recommendation (ratified, moderate) states one class and one value. The prose Facts line ('authority ratified; boldness low; moderate on the ruling-in-the-record sentence; persistence standing') is stale in three ways: the ruling-in-the-record sentence was withdrawn, the ledger shim it should name is liquidated, and the bootstrap-grant shim it does declare — whose liquidation condition is the ratification of the root and the purpose node — is named nowhere in the facts.

Strongest counter-argument (moderate): Saying a deferred answer is unanswered puts the record's definition of authority at odds with how the record behaves. Deferred answers act: every file under .claude/rules/ is deferred, every session works under them, the projector writes them, and this review was produced under them. Calling all of that 'unanswered' is accurate about the author's assent and misleading about the answers' force, and it leaves the record with no plain word for 'no answer at all'. The draft's own formulation — the deferred stamps are the author's review queue — says the same thing about assent without claiming the answers are absent, which is one more reason the draft and the node cannot both be forwarded.

The session's reply: Validated against the draft: it carried the two withdrawn sentences and the liquidated ledger shim. Amended tonight: the ledger shim is removed from the draft, a node without a stamp is unanswered as the unanswered node says, the ruling that earns a stamp is quoted in the node with its date, and the draft's deferred sentence carries the amended clause the standing answer has. The amendment review's findings, unanswered until now: the first is met by these edits; the second is stale, the validator refusing an unanswered node without a stage since the afternoon; the third is accepted, an overrule of an unanswered draft re-opens the review through the hash the dialogue node pins, and the sitting adds the clause; the fourth is met, 'open question' giving way to unanswered and un-aligned disposition. The bootstrap-grant shim is named in the facts at the sitting. On the counter-argument, that deferred answers act: they act as shims act, by default until the author rules, and the record's plain word for no answer at all is un-aligned disposition. Stage review: the draft changed.

### Frontier finding, 2026-09-03

Kind: contradiction.

Authority's draft: 'A node without a stamp is an open question, not an answer.' Transience: an un-aligned disposition 'is a node with a question and no answer'. Node's current text agrees with transience; node's draft agrees with authority's draft. Verified the two rules classify the record differently: purpose has an answer and no stamp, and read.mjs's deriveStatus returns 'unaligned' only when there is no '## Answer', so the browser shows purpose while authority's draft would call it an open question. Authority's own session reply already accepted transience's test and the draft was not changed.

Also named: commons.systems/disposition-graph/transience, commons.systems/disposition-graph/node.

Proposed: Transience is the survivor: it defines 'un-aligned disposition' and the validator implements its test. Authority's draft strikes the sentence and, if a stamp rule is wanted, says instead that a node without a stamp is unanswered, which unanswered already defines. Node's draft restores 'A node with a question and no answer is an un-aligned disposition ... and it has no children', which is the schema node's only statement of the rule and which the validator's message quotes.

### Frontier finding, 2026-09-03

Kind: vocabulary.

'Open question' is used on fifteen nodes and defined by none; the parsed graph carries 88 defined terms and 'open question' is not among them. Transience defines 'un-aligned disposition' for the same thing, growth's amended persistence list now uses that term, and the validator's own message says 'is unanswered and must carry stage'. Authority's draft and node's draft each use 'open question' for a slightly different notion, and several Proposals use it for a third ('persistence open question until written').

Also named: commons.systems/disposition-graph/node, commons.systems/disposition-graph/transience, commons.systems/disposition-graph/growth.

Proposed: Transience is the survivor: 'un-aligned disposition' is the one term. Authority's and node's drafts use it; the Proposal facts lines that say 'persistence open question' say 'persistence un-aligned disposition', which is the shape transience's list actually names. No new defines entry is needed.

### Frontier finding, 2026-09-03

Kind: placement.

Authority's rule is that 'a ratified stamp whose ruling is not in the record is invalid', and quotes' session reply settles that the ruling stays in the node under '## Disposition'. Verified that twenty-two of the sixty-two nodes carry no '## Disposition' section at all, among them evaluation, persistence, legacy, validation-order, review, attention and recording — every one of which is at the ruling stage recommending 'ratified' — and all three public nodes. Quotes is therefore a bar on roughly a third of the frontier, and its own Options block still marks the withdrawn option as recommended.

Also named: commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/persistence, commons.systems/disposition-graph/legacy, commons.systems/disposition-graph/validation-order, commons.systems/disposition-graph/review, commons.systems/disposition-graph/attention, commons.systems/disposition-graph/recording.

Proposed: Rule quotes first, after agency. Then, before any ratified stamp is written, each of the twenty-two nodes either gains a '## Disposition' section carrying the ruling it rests on with its date — attention and recording already have the quotations in their rationales and need only move them, which also makes the alignment page show them — or its recommendation changes from ratified to deferred, since a ratified stamp it cannot support is worse than an honest deferral. Quotes' facts state the count.

### Frontier finding, 2026-09-03

Kind: coverage.

The author, 2026-09-03, quoted in growth's rationale: 'Ratified on the rule. Ratified on the shim.' Authority's answer says ratification happens only through the alignment dialogue, and this ruling was given in one. Growth nevertheless carries 'authority: class: deferred' and is offered to the author for a fresh ruling on the whole node; its own review asked the session to 'state in the Proposal which part of the node the deferred stamp is still waiting on' and nothing does. So a ruling the author has given is recorded nowhere as an answer, and the author will be asked for it again.

Also named: commons.systems/disposition-graph/growth.

Proposed: Growth's Proposal states which clauses the author already ratified — the two-stage rule in both usages, and the alignment-skill shim — and what the fresh ruling covers. If the record's rule is that a node has one stamp, growth stays deferred and says in prose that two of its clauses are ratified in the author's words; if a clause can be ratified separately, that is a question for authority and should be minted there. Either way the author should not be asked twice for a ruling they gave.

### Frontier finding, 2026-09-03

Kind: coverage.

Four node files end with a bare 'null' on its own line, where a session's reply to a review belongs: authority, growth, projection and transience. On authority and transience the missing reply is to the amendment review, so four findings and a counter-argument stand unanswered on each, and the author would rule on a review nobody answered. The word parses as prose and passes the validator ('ok: 62 nodes'), so nothing catches it. Three of the four are among the record's most load-bearing nodes.

Also named: commons.systems/disposition-graph/growth, commons.systems/disposition-graph/projection, commons.systems/disposition-graph/transience.

Proposed: Write the four missing replies, or state on each that the review's findings are accepted, and strike the 'null'. The pattern is a serialization defect in whatever applied the reviews rather than four independent omissions, so the apply step should be checked: .claude/skills/align-review/apply.mjs is the script that writes replies, and a reply of JavaScript null being stringified into the file is the likely cause. Until it is fixed, every future review round will leave the same trace.

### The author's narrowing, 2026-09-03

The draft's sentence "A proposal is content, never a class: a candidate answer, an amendment, or a finding with no authority, recorded in a stamped node or in a sitting's record for the author's ruling" is narrowed by the author's words quoted above: a proposal is a conflicting answer that arises outside alignment, from an instrument, a criterion, a signal, or a conflict found in reconciliation, and a conflicting answer that arises in alignment is recorded differently, as an alternative in the dialogue state the dialogue node defines. The term is technical vocabulary and is not to be overloaded. The stage returns to maieutic because the draft's substance changed in the author's words and has not been redrafted; the redraft is part of the reconciliation the author's conditional grant on dialogue names, and the review runs on it after.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `draft` (ai, 2026-09-03); `narrowed-proposal` (author, 2026-09-03); `pending-keeps-authority` (author, 2026-09-03); `bootstrap-authority-as-class` (ai, 2026-09-03); `clause-level-ratification` (review, 2026-09-03); `ceiling-in-defines` (review, 2026-09-03, from commons.systems/disposition-graph/rationale-edge); `defines-ceiling` (review, 2026-09-03, from commons.systems/disposition-graph/session-context); `ceiling-moves-here` (review, 2026-09-03, from commons.systems/disposition-graph/under); `un-aligned-disposition-term` (review, 2026-09-03, from commons.systems/disposition-graph/growth).
The recommendation adopts `standing` and is pinned to the standing text as it was at that commit. The census said the recommendation adopts `draft`, but the node carries no recommended text, so it adopts the node as it stands.
Merge analysis of the author's words: 2026-09-02, own-question: All doctrine on the recorded graph must be rolled back to deferred for review, and ratification can happen only through periagogic and maieutic alignment dialogue, whose outputs will be the first valid ratifications. 2026-09-02, own-question: The `proposal` label is mislabelled by the existing disposition, since a proposal is meant to indicate a contradiction with doctrine and no authority to act, and there is no doctrine yet while the deferred graph and implementation were bootstrapped under that disposition. 2026-09-03, own-question: The bootstrap ledger is a shim and receives no standing disposition; the standing ratified disposition is that ratification happens only through alignment dialogue. 2026-09-03, new-answer on commons.systems/disposition-graph/quotes: The author's quotes are rarely expected to be recorded as disposition verbatim, the dialogue editing for clarification and writing quality, though retaining the original quotes as reference may earn its own schema. 2026-09-03, own-question: A proposal is technical vocabulary for a conflicting answer that arises outside alignment, which narrows this node's definition and means conflicting answers evaluated in alignment are recorded differently. 2026-09-03, own-question: A standing answer of any class keeps its full authority while an alternative is pending on it, until the author confirms an alternative.
Moved to other nodes as alternatives: `edited-not-verbatim` on commons.systems/disposition-graph/quotes; `shim-two-kinds` on commons.systems/disposition-graph/evaluation; `clauses-already-ratified` on commons.systems/disposition-graph/growth.
The census unit's note: Turned into alternatives: the draft the recommendation adopts; the author's narrowing of `proposal`, which the account itself says the draft no longer matches; the author's rule that a pending alternative leaves the standing answer's authority intact; the undecided question whether bootstrap authority is a shim or a fourth class, which the account explicitly puts to this node; and the clause-level ratification question a frontier finding asks be minted here. Moved elsewhere: the author's words on quotes, which answer that node's question and are carried here only; the shim-vocabulary tension to evaluation; the clause account to growth. Judged borderline and excluded: the placement finding's proposal that twenty-two nodes without a `## Disposition` be demoted from ratified to deferred, which quotes' own session reply has already rejected; and the contradiction and vocabulary findings' proposals for `node`, which node.md has already absorbed by striking the no-children rule.

### Alternatives merged, 2026-09-03

The alternatives raised on this node by more than one census cohort were merged at the re-encoding, and any alternative the standing answer already carries was removed: `ceiling-moves-here` absorbs `ceiling-in-defines`, `defines-ceiling`; `draft` dropped, The entry describes 'the recommended text carried in the node's fenced draft', and the node now carries no `## Recommendation` fence: the recommendation adopts standing, so the redraft the entry says the node was standing at the maieutic stage for is the present answer, which carries the draft's distinguishing sentence 'A node without a stamp is unanswered, as the unanswered node says' and, in place of the draft's stale proposal-as-content sentence, the author's narrowing the entry itself records; `narrowed-proposal` dropped, Carried word for word by the answer's sentences 'A proposal is technical vocabulary and is not overloaded: a conflicting answer that arises outside alignment, from evidence, a signal, an instrument, a criterion, or a conflict identified in reconciliation' and 'A conflicting answer that arises in alignment is not a proposal; it is an alternative in the dialogue state, with its source, and is recorded as the dialogue node says.'; `pending-keeps-authority` dropped, Carried by the answer's sentence 'A standing answer of any class keeps its full authority while an alternative to it is pending, until the author confirms an alternative.'; `un-aligned-disposition-term` dropped, The alternative proposes the recommended text drop 'open question' for the defined terms; the answer no longer uses the phrase anywhere ('A node without a stamp is unanswered, as the unanswered node says'), and the node's own reply of 2026-09-03 records the finding as met, 'open question' giving way to unanswered and un-aligned disposition. The merge unit's note: Dropping `draft` is the one judgment call here: the answer does not restate the draft's proposal-as-content definition, it supersedes it with the author's narrowing, and the fenced text the entry names no longer exists. If the main thread wants the superseded definition kept visible to the author, keep `draft` and rewrite its text to say what it now differs on. bootstrap-authority-as-class and clause-level-ratification are distinct open questions and stay.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Verified applied since the kickback: the node carries no '## Recommendation' fence (the recommendation adopts standing), the liquidated LEDGER.md shim is gone, and the standing answer says 'A node without a stamp is unanswered, as the unanswered node says' rather than the withdrawn 'open question' sentence. Verified `grep -rn '^null$' disposition/` returns nothing, so the missing reply to the amendment review is written. The three defects that earned the kickback are closed.
- Answer: 'a ratified stamp whose ruling is not in the record is invalid'. Verified this is a bar on much of the batch as it stands: twenty-three of the sixty-eight nodes carry no '## Disposition' section at all, and eight of the eleven recommendation fences carrying `class: ratified` quote no ruling. Quotes settles what the rule requires and is unruled; see the placement finding.
- Frontmatter, bootstrap-authority shim: its liquidation is 'bootstrap exit, at the swap of the implementation ref with the main branch'. The shim is a standing permission exercised only when the author invokes it, which inverts evaluation's rule that 'a shim declared on the record is applied by default; a prompt is required only to bypass it'. The `bootstrap-authority-as-class` alternative here and `two-kinds-of-shim` on evaluation are the two halves of one undecided question, and neither node's answer records the tension.
- Answer: 'A proposal ... opens the dialogue on that node at the periagogic stage, as the dialogue node says.' Verified consistent with dialogue's answer. The vocabulary is now narrowed to the author's sense throughout, and 'open question' no longer appears in this node — though it is still used in nineteen node files and defined by none.
- The `clause-level-ratification` alternative asks a question this node owns and the record needs: the author ruled 'Ratified on the rule. Ratified on the shim' on growth, and a node has one stamp, so a ruling the author gave is recorded nowhere. Nothing in the answer says whether a clause can carry a stamp.

On the three facts: The frontmatter recommendation (adopts standing, ratified, moderate) states one class and one value and the pin is current. Moderate is right: the ratification rule and the narrowing of 'proposal' are the author's in quoted words, the attenuation argument and the scope rule are the AI's. Persistence standing with one declared shim follows from the node's shape, but the prose Facts line still names neither the shim nor its liquidation condition, which growth's presentation rule requires.

Strongest counter-argument (moderate): Saying a deferred answer is unanswered puts the record's definition of authority at odds with how the record behaves: deferred answers act — every file under .claude/rules/ is deferred, every session works under them, the projector writes them, and this review was produced under them. The session's reply, that they act as shims act, by default until the author rules, is a good answer and it is in the account rather than the answer. What remains is that the node defining the stamp vocabulary describes the whole operating record as unanswered while every session runs on it, and gives no word for the force those answers plainly have.

The session's reply: Forward accepted. The bar on unquoted ratified stamps is quotes' to settle, first in the ruling order; the bootstrap-authority shim and clause-level ratification stay as pending alternatives.

### Frontier finding, 2026-09-03

Kind: cross-reference.

Counts and implementation claims recorded across the batch's review sections have moved under them, and several are cited by pending alternatives as though current. Verified against the graph as it stands: `node packages/disposition/validate.mjs disposition` returns 'ok: 68 nodes', not the 62 that eight recorded findings assume; twenty-three nodes carry no '## Disposition' section, not twenty-two; the `defines` fields hold 117 entries, not the 88 the vocabulary findings cite; no node file ends in a bare 'null' (`grep -rn '^null$' disposition/` returns nothing), so the coverage finding of 2026-09-03 on the four bare nulls is discharged; `apply.mjs` and `brief.mjs` exist and are tracked, so the align-review shim's artifact claims hold; and browser-template.html carries an `authorityHtml` function rendering an authority block, so the earlier claim that 'there is no authority section' is stale, while 'unguarded' and 'criteria' still do not occur in it at all. The record's own rule, stated on authority, is that recorded review findings are annotated where they stand rather than rewritten, so none of these is a defect in the sections that carry them; the defect is that quotes' pending `facts-state-the-count` alternative asks the node's facts to state a count, and the count it names is already stale.

Also named: commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/projection, commons.systems/disposition-graph/recording, commons.systems/disposition-graph/dialogue.

Proposed: No node's text is wrong and nothing moves. What is owed is that a count the author is asked to ratify be measured at the ruling rather than fixed in prose: quotes' facts state the bar as measured when the author rules, and the review skill's own briefs carry the counts, so the number the author sees is derived. Recording's counter-argument makes the general form of this point — most of what the review checks is mechanical — and frontier-consistency's validations 3, 5 and 11 are the natural home for the checks that would keep these numbers true.
