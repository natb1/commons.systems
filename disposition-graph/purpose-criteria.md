---
question: What criteria guard the purpose node?
stage: ruling
recommendation:
  adopts: unguarded
  class: ratified
  boldness: low
  amends: "344adc6d0c702185eb7c60d50d6523d171c5a3a6"
  at: "6d21d356d65f5fa206cb60bc3e923c462acc920e"
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: 23758b0c5affc8dfab4abf370ea5ba7b22321807
alternatives:
  - name: unguarded
    source: ai
    ref: "2026-09-03"
  - name: drafted-criteria
    source: ai
    ref: "2026-09-03"
  - name: fold-into-purpose
    source: review
    ref: "2026-09-03"
    prune: true
under:
  - commons.systems/disposition-graph/purpose
---
## Alternatives

### unguarded

Criteria are deferred to a later sitting and purpose shows as unguarded, the record saying so, with the two criteria re-proposed when the reconciliation harness exists, the check written against it and the assessment given a threshold. This is what the session's reply adopted after the counter-argument, and what the frontmatter recommendation already states at low boldness. Instruments' text makes unguarded a legible state the record announces rather than a defect it hides.

### drafted-criteria

Purpose carries the two criteria as drafted: a check that every unit of work the harness dispatches cites the node it serves, and an assessment that work done in the author's name since the last sitting traces to a recorded disposition. The session withdrew it after the review, on the ground that the check names a harness that does not exist and the assessment has no failure condition, so it cannot fail and cannot guard; the Options block nevertheless still lists it. It remains on the table as the option the author may take.

### fold-into-purpose

Prune: The redundancy finding holds that this node decides a clause purpose's own recommended text contains, so confirming purpose as shown would decide it by that act. Its second branch folds the option into purpose's account as an explicit alternative and prunes this node, which is what the new encoding makes structural; its first branch keeps the node with one line saying it is a sub-ruling of purpose that must be ruled first.

## Recommendation

```markdown
---
question: What criteria guard the purpose node?
form: rule
authority:
  class: ratified
  by: Nathan Buesgens
  date: <the date of the ruling>
under:
  - commons.systems/disposition-graph/purpose
---
## Answer

None today. The purpose node stands unguarded, and the record says so on its page rather than leaving the absence to be inferred. The two criteria drafted on 2026-09-03 are withdrawn: the check, that every unit of work the harness dispatches cites the node it serves, named a harness that does not exist on the implementation ref, and the assessment, that work done in the author's name traces to a recorded disposition, stated no threshold and so could not fail. Both are re-proposed when the reconciliation harness exists, the check written against it and the assessment carrying the proportion of untraced work that fails it. Until then purpose carries one stamp and no criteria, since a criterion that would need a stamp of its own is a question of its own and becomes a node then.

## Rationale

Unguarded is a legible state the record announces rather than a defect it hides, so an honest absence is worth more than a check against a mechanism the implementation does not have and an assessment with no failure condition. Purpose ranks first, so a criterion that could only fail spuriously would put a false frontier item at the top of every ranked list, ahead of the work that would build the harness the check assumes. Rejected: the check and the assessment as drafted, because neither could guard anything today and because their stated authority, deferred, cannot stand beside purpose's ratified stamp on a node that carries one stamp. The author's words behind this question were a question of their own, whether every disposition has instrumentation or criteria or something like that, and not a direction that the purpose node must carry criteria before the harness they would check exists.
```

## Account

### Sitting on purpose, 2026-09-03

**Criteria on purpose**

Every page will show its criteria or the word unguarded. The draft gives purpose a check, every unit of work the harness dispatches cites the node it serves, and an assessment, work done in the author's name since the last sitting traced to a recorded disposition. Both are the AI's drafting.

Options:
- The check and the assessment as drafted — authority deferred; boldness moderate; persistence standing; withdrawn after the review below
- (recommended) Defer criteria to a later sitting; purpose shows as unguarded and the record says so — authority ratified; boldness low; persistence standing

Feeds: `purpose`

Responses open: confirm the recommended option; confirm with edits, naming another option; deny with feedback.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The recommended option's facts say 'authority deferred' while purpose's facts say 'authority ratified'. Instruments' rejected list forbids the split: 'a criterion that needs its own stamp is a question of its own and becomes a node then.' A node has one stamp. Suggested edit: either the criteria are ratified with purpose, or they become a node, or take option 2.
- The check, 'every unit of work the harness dispatches cites the node it serves', names a harness that does not exist on the implementation ref. The current mechanism is work-loop's reconciliation shim, which takes bites rather than dispatching units. Suggested edit: write the check against the shim, or mark it as a criterion that begins when the harness exists.
- The assessment, 'work done in the author's name since the last sitting traced to a recorded disposition', has no threshold and no failure condition, so it cannot fail and therefore cannot guard. Suggested edit: state what proportion untraced would fail it.

On the three facts: 'Authority deferred' cannot stand beside purpose's 'authority ratified' on one node. Present the criteria as part of the purpose ruling with a single stamp, or take option 2 and show purpose as unguarded.

Strongest counter-argument (strong): Option 2 is stronger than it looks. Instruments' draft makes unguarded a legible state that the record announces rather than a defect it hides: 'A ratified answer with no criterion is unguarded, and the record says so.' Guarding the record's root disposition with a check against a harness that does not exist and an assessment with no threshold buys the appearance of instrumentation without the fact of it, and purpose's rank means the resulting false frontier item sits at the top of every ranked list, ahead of the work that would build the harness the check assumes. The author's words on instruments were a question, 'Doesn't every disposition have instrumentation or criteria or something like that?', not a direction that purpose must carry them today.

The session's reply: The counter-argument wins. The recommendation changes to the second option: purpose stands unguarded and the record says so. The check named a harness that does not exist and the assessment had no failure condition, and together they would have put a false frontier item at the top of every ranked list. The two criteria are re-proposed when the reconciliation harness exists, the check written against it and the assessment with a threshold.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The Options block still marks option 1 '(recommended) The check and the assessment as drafted', while the session's own reply below it says 'The counter-argument wins. The recommendation changes to the second option: purpose stands unguarded and the record says so.' The ruling this node opens is 'take the recommended option', so an author taking it would take the option the session withdrew. This is the sharpest executor hazard in the batch and it recurs on forms and quotes. Suggested edit: move the '(recommended)' marker to option 2 before the author rules.
- Purpose's draft still carries the two criteria this node now recommends against. The two nodes contradict each other, and neither says so. Suggested edit: strike the criteria block from purpose's draft in the same landing.
- The recommended option as written says 'authority deferred' while purpose's facts say 'authority ratified'. One node has one stamp; instruments' rejected list forbids the split. Taking option 2 dissolves this, which is a further reason to move the marker.
- The node has no '## Answer' and no '## Draft', so what is ratified is an option, and the answer is written after the ruling.

On the three facts: The frontmatter recommendation (ratified, low) matches option 2, not the option still marked recommended — the data and the prose have already diverged. That is evidence the marker is a clerical omission rather than a live disagreement, and it should be fixed rather than ruled on.

Strongest counter-argument (strong): Option 2 is stronger than it looks and the session has already conceded it: instruments' draft makes unguarded a legible state the record announces rather than a defect it hides. Guarding the record's root disposition with a check against a harness that does not exist and an assessment with no threshold buys the appearance of instrumentation without the fact of it, and purpose's rank means the resulting false frontier item would sit at the top of every ranked list, ahead of the work that would build the harness the check assumes. The remaining risk is the opposite one: purpose ratified and permanently unguarded, with no date by which the criteria are re-proposed.

The session's reply: Validated. Amended tonight: the recommended marker moves to the second option, purpose stands unguarded and the record says so, which the frontmatter already stated; purpose's draft drops the criteria block in the same landing. This node is a sub-ruling of purpose's draft, and the ruling order puts it before purpose. On the counter-argument's residue, that purpose stays unguarded with no date to re-propose: the criteria return when the reconciliation harness exists, and purpose's Proposal says so. Stage ruling.

### Frontier finding, 2026-09-03

Kind: contradiction.

Purpose's draft frontmatter carries a two-entry 'criteria:' block (the harness check and the sitting assessment). Purpose-criteria's session reply says 'The counter-argument wins. The recommendation changes to the second option: purpose stands unguarded and the record says so. The check named a harness that does not exist and the assessment had no failure condition.' Purpose's Proposal still reads 'Two criteria are added' and lists standing unguarded as merely 'Open as q8', and purpose-criteria's Options block still marks the withdrawn option '(recommended)'. The record's highest-ranked node would be ratified with criteria the record has decided against.

Also named: commons.systems/disposition-graph/purpose.

Proposed: Purpose-criteria is the survivor of the question and is ruled first: move its '(recommended)' marker to option 2. Purpose's draft then strikes the 'criteria:' block and its Proposal summary drops 'Two criteria are added', replacing it with a line saying purpose stands unguarded and that the two criteria are re-proposed when the reconciliation harness exists.

### Frontier finding, 2026-09-03

Kind: redundancy.

Three option-nodes decide clauses that a sibling's draft already contains. Hexis asks whether the hexis claim comes first, and purpose's draft already reads 'a projection of its author's hexis, which is what a knowledge store would hold'. Purpose-criteria asks whether purpose carries criteria, and purpose's draft already carries them. Second-stop asks whether the model node is rewritten, and model's draft is that rewrite. If the author confirms the parent draft as shown, the option-node is decided by that act; if they then rule the option the other way, the parent's draft must be reopened, and the alignment page offers both on one screen with no ordering shown.

Also named: commons.systems/disposition-graph/hexis, commons.systems/disposition-graph/second-stop, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/model.

Proposed: Keep the option-nodes as the survivors of their questions, since each is a real decision the author should make separately, and add one line to each saying it is a sub-ruling of the named parent's draft and must be ruled first. Correspondingly, each parent's Proposal names the option-nodes its draft presumes. Alternatively fold each option into its parent's Proposal as an explicit alternative, which is what rejected's option 1 would make structural — but that decision is itself unruled.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `unguarded` (ai, 2026-09-03); `drafted-criteria` (ai, 2026-09-03); `fold-into-purpose` (review, 2026-09-03).
The recommendation adopts `unguarded` and is pinned to the standing text as it was at that commit. The recommended text was drafted at the re-encoding from the option the account marks recommended, so that the recommendation adopts an alternative with a text and not only a name; the earlier review read the options and not this text, so it is removed and the node returns to the review stage for the clean-context review of the batch.
The census unit's note: This node has a recommendation but no standing answer and no recommended text: it is an options node, and the recommendation matches option 2, so it adopts the alternative I named unguarded. Option 1 stays listed and is carried as a pending alternative, since nothing rejects it in a rationale, and the fold proposed by the redundancy finding is the third. The stale recommended marker on option 1 and purpose's criteria block are both fixed in the snapshot, so the contradiction finding is resolved. The counter-argument's residue, that purpose stays unguarded with no date to re-propose, is answered in prose and I did not raise it to an alternative. The fold is recorded here and, from purpose's side, as its fold-option-nodes alternative.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Verified fixed since the last review: the Options block now marks option 2 '(recommended)' and option 1 'withdrawn after the review below', and the frontmatter recommendation adopts `unguarded`, so the data and the prose agree. The executor hazard the previous review called the sharpest in the batch is resolved here — but the same hazard is unresolved on rejected, where the marker and the reply still disagree.
- Recommendation fence, Answer: 'a criterion that would need a stamp of its own is a question of its own and becomes a node then' is quoted from instruments' rejected list. Instruments stands at the maieutic stage, so this fence rests its closing argument on an unruled node and does not say so.
- Recommendation fence, Rationale: 'The author's words behind this question were a question of their own, whether every disposition has instrumentation or criteria or something like that, and not a direction that the purpose node must carry criteria.' The words are paraphrased, not quoted, and the node carries no '## Disposition' section — verified, purpose-criteria is one of the twenty-three nodes with none. A ratified stamp here would rest on a paraphrase.
- The node decides a clause of purpose's recommended text and purpose's fence no longer carries criteria, so the two agree today. What neither says is that this ruling leaves the record's highest-ranked node permanently unguarded with no date at which the two withdrawn criteria return; the fence says 'when the reconciliation harness exists', which is a condition no instrument reads.

On the three facts: The frontmatter recommendation (adopts unguarded, ratified, low) states one class and one value, matches the option now marked recommended, and the pin is current. Low is right: the answer withdraws two AI-drafted criteria and asserts nothing new. Persistence standing follows from the node's shape; what the facts should add is that the ruling leaves the record's first node unguarded with no dated return.

Strongest counter-argument (moderate): Standing unguarded is the right answer and the record has already conceded it, so the residual risk is the opposite of the one the reviews chased: purpose is ratified, unguarded, and the two criteria return only 'when the reconciliation harness exists' — a condition nothing on the frontier derives and no shim carries. The record's own rule is that a shim with no liquidation condition is an undeclared permanent; an unguarded root with an unwatched promise to guard it later is the same shape without the vocabulary.

The session's reply: Forward accepted. The marker and the recommendation agree; the dependence of the closing sentence on instruments is named here; the unwatched return condition is accepted as a finding for the author.

### Frontier finding, 2026-09-03

Kind: placement.

Authority holds that 'a ratified stamp whose ruling is not in the record is invalid', and quotes rules on what that requires. Measured against the graph as it now stands: eleven recommendation fences in this batch carry `class: ratified`, and eight of them quote no ruling of any date anywhere in the fence — purpose, hexis, namespaces, projection, traditions-home, forms, second-stop and purpose-criteria — while three do: rationale-edge, quotes and rejected. Separately, twenty-three of the sixty-eight nodes carry no '## Disposition' section at all (`validate.mjs` reports 'ok: 68 nodes'; the count of nodes with no such section is 23), among them evaluation, persistence, legacy, validation-order, review, recording, forms, traditions-home, purpose-criteria, second-stop and all three public nodes. Quotes' own recommended answer unbars them in one clause — 'the ruling a stamp requires is the one the author gives at that sitting, quoted then; words the author said earlier are the ground a draft rests on and bar no stamp' — so the whole question of whether eight fences and twenty-three nodes can carry a ratified stamp turns on a node that is itself unruled and in this batch. The counts recorded on the batch's own findings are stale against the graph: 'twenty-two of the sixty-two nodes' was measured when the graph held 62.

Also named: commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/hexis, commons.systems/disposition-graph/namespaces, commons.systems/disposition-graph/projection, commons.systems/disposition-graph/traditions-home, commons.systems/disposition-graph/forms, commons.systems/disposition-graph/second-stop.

Proposed: Quotes is the survivor and is ruled first among the nodes of this batch, after the periagogic sitting on public/agency that every one of them descends from. Nothing in the eight fences need change before that ruling, because quotes' recommended answer sanctions them; what must not happen is that any of the eight is recorded with a ratified stamp before quotes is ruled, since under the losing option each such stamp is invalid on landing. Quotes' own facts should state the measured size of the bar at the moment of ruling rather than a count fixed in prose, since the count has already moved once.

Recorded as a pending alternative on commons.systems/disposition-graph/quotes: `fence-carries-the-ruling` (source review, 2026-09-03).
