---
question: How is the clean-context review run?
stage: review
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-03
under:
  - commons.systems/disposition-graph/recording
shims:
  - artifact: "`.claude/skills/align-review/SKILL.md` on the implementation ref, with the reviewer's brief `brief.md` and the script `apply.mjs` beside it, hand-written from this node and the recording node"
    for: the projection of this node as the review skill
    liquidation: the projector materializes the skill from ratified nodes and the hand-written files are deleted
    declared: 2026-09-03
---
## Disposition

The author, 2026-09-03:
> disposition: alignment adversarial review is materialized as a skill. it can be invoked as a clean context subskill when the scope of an alignment dialogue progresses to review, or it can be invoked directly. When invoked by alignment dialogue the review scope is limited to the scope of the alignment dialogue (whatever nodes are discussed as part of the dialogue). When invoked directly it executes adversarial review for all unanswered nodes queued for review. Either way, the context for each node review is isolated using subskills.

## Answer

As a skill of its own, `/align-review`, invoked two ways. The alignment sitting invokes it when its dialogue reaches the review stage, and then its scope is the sitting's: the nodes the dialogue drafted or amended, and no others. The author, or a session, invokes it directly: with no argument its scope is every unanswered node at the review stage, in rank order; with node ids, those nodes. Either way each node is reviewed in a context of its own. The skill writes one brief per node and starts one subagent per node with nothing but that brief, the record it points to, and the judging criteria the recording node states; the subagent reads the node, its ancestry, the global-tier rules, the nodes it cites, and the author's words, and returns its verdict, findings, counter-argument, and strength as data, writing nothing to the record. A context that forked the invoking session would carry the session's framing and is not clean, so the reviewer is always a fresh subagent. The session that invoked the skill applies each verdict on its own, as the recording node says: a forward sets the ruling stage and the review's state, verdict, strength, date, and the hash of the draft reviewed, and appends the findings, the counter-argument, and the session's reply to the proposal; a kickback sets the stage the reviewer named and appends the findings. The applying is mechanical and scripted; the reply is the session's judgment. The skill then validates, lands the nodes it changed, and republishes the alignment page.

## Rationale

The author's ruling of 2026-09-03, quoted above. One skill for both invocations keeps one brief, one output shape, and one applying step, so that a review run by a sitting and a review run over the queue are the same review. Scope follows the invoker because the review judges a draft against the record it joins: the sitting knows which drafts it changed, and the queue is what the stage field already lists. A context per node is the independence the recording node argues for, carried one step further: a reviewer that has read twenty drafts and their reviews reads the twenty-first with that batch's framing, and a finding on one node leaks into the next; the price is that each reviewer reads the global rules and the ancestry for itself, which is the cost of a fresh reading, paid in tokens and not in the author's attention. The reviewer writes nothing because authority attenuates and nothing writes up. The two review batches of 2026-09-03, on twenty-seven and then twenty-four items, ran in one context each before this skill existed; their verdicts stand as the reviews of that day, and the divergence is recorded here. Amended the same day on the recording node: the reviews of a round are invoked together, and each runs in its own context. Rejected: a forked skill as the reviewer, since the harness's fork inherits the session's context; the review applied by the reviewer itself, since the reviewer only recommends; one context for a batch, which was the practice until today.

## Proposal

### Recording of 2026-09-03

The author's words quoted above are recorded as this node's answer, stamped deferred. The author's: the skill, the two invocations, the scope of each, and the isolated context per node. The AI's, open to the author's ruling: that the reviewer is a fresh subagent rather than a forked skill, because a fork carries the session's context; that the invoking session applies the verdicts with a script and writes the replies itself; and that the two batches reviewed in one context on 2026-09-03 stand rather than being re-run, which the author may overrule by invoking the skill on them. The skill, its brief, and its apply script were written the same day and declared as the shim above.

Facts: authority ratified if the author confirms; boldness low on the usage and moderate on the mechanism; persistence standing, with one shim declared, the hand-written skill.
