---
question: Is the rationale the prose of the under edge?
stage: ruling
review:
  verdict: forward
  strength: weak
  date: 2026-09-03
  of: dcef237c051b8b1ca92ca7e6baf8189f0b0983a0
facts:
  - name: answer
    options:
      - name: rationale-stays-with-node
        source: ai
        ref: "2026-09-03"
      - name: because-clause-on-edge
        source: ai
        ref: "2026-09-03"
      - name: rationale-on-edge
        source: ai
        ref: "2026-09-03"
      - name: drop-convention-clause
        source: review
        ref: "2026-09-03"
      - name: disclose-unanswered-parent
        source: review
        ref: "2026-09-03"
      - name: rationale-as-the-edge-prose
        source: author
        ref: "2026-09-03"
    recommends: rationale-stays-with-node
    boldness: moderate
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
under:
  - commons.systems/disposition-graph/under
---
## Disposition

The author, 2026-09-03:
> 'Rationale' states that the node rationale stems from the node this node is under. Evaluate: would that always be the case? The disposition for the under edge seems to state this 'Ask "why does this question exist?"; the answer names its parent.' If so, does it make sense to make the 'rationale' the prose property of the under edge?

## Facts

### answer

#### rationale-stays-with-node

The recommended option keeps the rationale as the node's own, why this answer stands, with the under edge carrying no prose; where a refinement is not evident from the two questions side by side, the rationale's first sentence says so. It rests on the separation of the warrant of an inference from the backing of a claim, on the observation that several rationales do not stem from the parent at all, and on the fact that a node with two parents would need two edge rationales but has one answer. It is the only option that is not a schema change.

#### because-clause-on-edge

Give each under entry a because clause and reserve the rationale for the answer, a schema change. The reviews' counter-argument backs it: it puts the refinement in structure exactly where the two questions do not show it, which is the case the recommended option leaves to a convention, so the projector can show why a node hangs where it does. Against it, a clause on every edge will be filled with restatements of the two questions in the common case, which is the drift the record resists elsewhere.

#### rationale-on-edge

Move the whole rationale onto the under edge, making it the prose property of the edge as the author's question asks, a schema change of high boldness. It is the strongest reading of the author's words and the one the node's own analysis argues against, since why this question exists and why this answer stands are two justifications and only the first belongs to the edge.

#### drop-convention-clause

Both reviews find the recommended option's second clause, that where a refinement is not evident the rationale's first sentence says so, to be a convention with no criterion and nothing to check it, and the finding is recorded as unchanged since the previous review. The candidate is the recommended option with that clause dropped, or with it made a validator rule so that it can fail.

#### disclose-unanswered-parent

The placement finding of 2026-09-03: rationale-edge stands at the ruling stage under the `under` node, which is at the maieutic stage with no draft and whose own account says its text is drafted only after tier and two other questions are ruled, one of which was kicked back with its recommendation withdrawn. This alternative adds one clause saying its parent is unanswered, which frontier-consistency requires be said, so that a ruling-stage node does not silently rest on maieutic ground; the finding also asks that rationale-edge be ruled before under is drafted. Raised on commons.systems/disposition-graph/namespaces, commons.systems/disposition-graph/traditions-home, commons.systems/disposition-graph/under.

#### rationale-as-the-edge-prose

The author's words carried here ask whether the rationale should be the prose property of the under edge, on the ground that under already says a parent is found by asking why the question exists. Rationale-edge carries the same words and offers three options, but its recommendation adopts the opposite, keeping the rationale as the node's own with no prose on the edge; the author's own leaning corresponds to its second and third options. (Raised on commons.systems/disposition-graph/under.)

## Recommendation

```markdown
---
question: Is the rationale the prose of the under edge?
form: rule
under:
  - commons.systems/disposition-graph/under
---
## Answer

No. The rationale is the node's own: why this answer stands, citing its readings and evidence and weighing the alternatives it rejected. Why the question exists is the other justification, the refinement that the under edge records, and the edge carries it without prose because it is usually evident from the parent's question and the child's read side by side. Where it is not evident, the rationale's first sentence says why the question hangs where it does. A node may refine more than one question but has one answer, so it has one rationale, which no single edge could hold.

## Rationale

Two justifications were being run together: the warrant of the refinement and the backing of the claim, which Toulmin's layout keeps apart and which this record keeps apart the same way, the edge holding the first and the rationale the second. The rationale does not always stem from the parent: the node node's rationale is about the decidability of scope and the persistence node's about concurrency, neither about the model node they sit under, so binding it to the edge would misdescribe most of the record. The author, 2026-09-03, asked whether the rationale always stems from the node a node is under and whether it should therefore be the prose property of the under edge: it does not always, and it should not.
```

## Account

### Sitting on purpose, 2026-09-03

**Rationale and the under edge**

The purpose node's rationale opens with why the question exists under its parent, and the under node says a parent is found by asking why the question exists. Two justifications are being run together. Why this question exists is the refinement, which the edge records and which is usually evident from the two questions side by side. Why this answer stands is the backing: it cites readings, evidence, and the parent, and weighs the alternatives, and it is the node's own. It does not always stem from the parent: the node node's rationale is about decidability of scope, the persistence node's about concurrency, neither about model. In Toulmin's layout the warrant of an inference and the backing of a claim are distinct; in IBIS the relation carries the link's meaning without prose; in goal-oriented requirements a refinement link carries a pattern, not text. A node with two parents would need two edge rationales but has one answer.

Options:
- (recommended) Keep the rationale as the node's own, why this answer stands; the under edge carries no prose, and where a refinement is not evident from the two questions the rationale's first sentence says so — authority ratified; boldness moderate; persistence standing
- Give each under entry a because clause and reserve the rationale for the answer — authority ratified; boldness moderate; persistence standing; a schema change
- Move the whole rationale onto the edge — authority ratified; boldness high; persistence standing; a schema change

Feeds: `under`, `node`, `purpose`

Responses open: confirm the recommended option; confirm with edits, naming another option; deny with feedback.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The recommended option's second clause, 'where a refinement is not evident from the two questions the rationale's first sentence says so', is a convention with no criterion and nothing to check it. Suggested edit: drop the clause, or make it a validator rule so it can fail.
- Feeds names under, whose Proposal says 'Drafted after q14, q15, and q16 are ruled' and 'Proposed: pending'. The author is ruling three schema questions whose combined effect on the under node's text they will not see until afterwards, which sits against the author's own request to 'show me the edit to the disposition and approve the disposition as a whole'. Suggested edit: forward the three with a draft of under showing all three outcomes for the recommended options.

On the three facts: Ratified, moderate boldness, standing is right; the recommended option is not a schema change while options 2 and 3 are, which the facts correctly distinguish.

Strongest counter-argument (weak): Option 2, a because clause on each under entry, is cheap and would put the refinement in structure exactly where the two questions do not show it, which is the case the recommended option leaves to a convention. Toulmin separates warrant from backing, but a warrant is still written down; the recommendation writes it down only sometimes and only in prose, so the projector cannot show why a node hangs where it does. Against that, a because clause on every edge is a field that will be filled with restatements of the two questions in the common case, which is the drift the record avoids elsewhere. Worth one line.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The node is at the ruling stage and its parent, under, is at the maieutic stage with 'Proposed: pending' and no draft. Frontier-consistency: 'no node at the ruling stage rests on ground still at the periagogic or maieutic stage without saying so.' Nothing here says so. Suggested edit: state it, and rule under after this and the two other questions it waits on.
- The recommended option's second clause, 'where a refinement is not evident from the two questions the rationale's first sentence says so', is a convention with no criterion and nothing to check it. Unchanged since the previous review.
- Feeds names under, whose Proposal says 'Drafted after q14, q15, and q16 are ruled'. Two of those three (tier, and this node) are in different states — tier was kicked back to maieutic and its recommendation withdrawn — so under's draft cannot be written from the three outcomes as planned. Suggested edit: say what under's text becomes now that tier's recommendation is withdrawn.
- The node has no '## Answer' and no '## Draft'.

On the three facts: The frontmatter recommendation (ratified, moderate) is right, and the option's own facts correctly distinguish the recommended option (no schema change) from options 2 and 3 (schema changes). The facts should add that the parent whose text this feeds is at the maieutic stage and cannot be drafted until tier is re-answered.

Strongest counter-argument (weak): Option 2, a because clause on each under entry, is cheap and would put the refinement in structure exactly where the two questions do not show it, which is the case the recommended option leaves to a convention. Toulmin separates warrant from backing, but a warrant is still written down; the recommendation writes it down only sometimes and only in prose, so the projector cannot show why a node hangs where it does. Against that, a because clause on every edge will be filled with restatements of the two questions in the common case, which is the drift the record resists elsewhere.

The session's reply: Validated. This node's parent is at the maieutic stage with no draft, and the ruling order puts this node and tier before under, whose text is then drafted from the outcomes; the finding is stated here and at under. On the counter-argument, the because clause: the recommended option leaves the refinement to prose where the two questions do not show it, and the author weighs the cost of a clause on every edge. Stage ruling.

### Frontier finding, 2026-09-03

Kind: decomposition.

Under answers four questions at once — what an edge means, how rank is computed, what a ceiling is, and how context loads — and defines all four terms, while standing at the maieutic stage with 'Proposed: pending' and no draft. Three of the four are answered in full elsewhere: attention answers rank, session-context answers what a session loads, and authority's answer already carries the scope rule that 'ceiling' names. Two child nodes have been carved out of it already (rationale-edge, tier), and its Proposal says its own text cannot be drafted until three questions are ruled. Meanwhile four ruling-stage nodes rest on 'rank' and one on 'ceiling', terms only under defines.

Also named: commons.systems/disposition-graph/under, commons.systems/disposition-graph/attention, commons.systems/disposition-graph/session-context, commons.systems/disposition-graph/tier.

Proposed: Under survives as the edge alone: what a node refines, that it is the only hierarchical edge, and that a node may refine more than one question. 'rank' moves to attention's defines, which already answers it; 'context' moves to session-context's defines; 'ceiling' moves to authority's defines, which is where the scope rule it names lives. Under then has one question and can be drafted without waiting on rationale-edge and tier.

### Frontier finding, 2026-09-03

Kind: placement.

Two ruling-stage nodes rest on maieutic ground without saying so. Rationale-edge is at ruling under under, which is at maieutic with 'Proposed: pending' and no draft, and under's own Proposal says its text is 'Drafted after q14, q15, and q16 are ruled' — one of which, tier, was kicked back and its recommendation withdrawn, so under cannot be drafted as planned. Separately, readings' draft and namespaces' draft both presume a traditions graph that traditions-home would create, and traditions-home is at ruling but is listed as a dependency of both; the manifest edit that would create the graph is shown on none of the three.

Also named: commons.systems/disposition-graph/under, commons.systems/disposition-graph/tier, commons.systems/disposition-graph/traditions-home, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/namespaces.

Proposed: Rule traditions-home before readings and namespaces, and show the manifest entry on traditions-home so the author sees what they are creating. Rule rationale-edge and re-answer tier before under, and add to rationale-edge one clause saying its parent is unanswered. Under is then drafted from the three outcomes, simplified as the decomposition finding proposes.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `rationale-stays-with-node` (ai); `because-clause-on-edge` (ai); `rationale-on-edge` (ai); `drop-convention-clause` (review, 2026-09-03); `disclose-unanswered-parent` (review, 2026-09-03, from commons.systems/disposition-graph/namespaces); `parent-unanswered-clause` (review, 2026-09-03, from commons.systems/disposition-graph/traditions-home); `rationale-as-the-edge-prose` (author, 2026-09-03, from commons.systems/disposition-graph/under); `say-the-parent-is-unanswered` (review, 2026-09-03, from commons.systems/disposition-graph/under).
The recommendation adopts `rationale-stays-with-node` and is pinned to the standing text as it was at that commit. The recommended text was drafted at the re-encoding from the option the account marks recommended, so that the recommendation adopts an alternative with a text and not only a name; the earlier review read the options and not this text, so it is removed and the node returns to the review stage for the clean-context review of the batch.
Merge analysis of the author's words: 2026-09-03, own-question: The rationale is said to stem from the node this node is under, and the under edge's disposition says a parent is found by asking why the question exists; would that always be the case, and does it make sense to make the rationale the prose property of the under edge.
Moved to other nodes as alternatives: `ceiling-in-defines` on commons.systems/disposition-graph/authority.
The census unit's note: No Answer and no Draft, but a recommendation and an Options block, so the recommended option is what it adopts; the other two options and the reviews' unapplied edit are the pending alternatives. The remaining findings are about ordering rather than answers: the node is at ruling while under is at maieutic with no draft, and under cannot be drafted as planned now that tier's recommendation is withdrawn. The session's reply already states this here. The decomposition and placement findings are recorded on under, attention, session-context, tier, traditions-home, readings and namespaces, so the only entry elsewhere is the target they change but do not name, authority.

### Alternatives merged, 2026-09-03

The alternatives raised on this node by more than one census cohort were merged at the re-encoding, and any alternative the standing answer already carries was removed: `disclose-unanswered-parent` absorbs `parent-unanswered-clause`, `say-the-parent-is-unanswered`. The merge unit's note: rationale-as-the-edge-prose is the author's own words re-raised from under; it does not name one change but says the author's leaning corresponds to the second and third options (because-clause-on-edge, rationale-on-edge), so it is not merged with either.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The node stands at the review stage under `under`, which is at the maieutic stage with no drafted text and whose own account plans a draft 'after q14, q15, and q16 are ruled' — one of which, tier, was kicked back with its recommendation withdrawn, so under cannot be drafted as planned. Frontier-consistency's validation 13 requires that no node resting on periagogic or maieutic ground do so without saying so; the fence says nothing. The `disclose-unanswered-parent` alternative is the vehicle.
- Recommendation fence, Answer, second clause: 'Where it is not evident, the rationale's first sentence says why the question hangs where it does.' A convention with no criterion and nothing to check it, raised by both readings and unchanged. The `drop-convention-clause` alternative offers both branches — strike it, or make it a validator rule so it can fail.
- Recommendation fence, Rationale: it quotes the author's question with its date, which makes this one of only three fences in the batch carrying `class: ratified` that quotes a ruling at all. That is the shape the other eight should follow.
- The author's own leaning in the quoted words runs toward the options the recommendation rejects: 'does it make sense to make the rationale the prose property of the under edge?' The `rationale-as-the-edge-prose` alternative records that, sourced to the author, and the fence's rationale answers it in one clause ('it does not always, and it should not'). The author is being told their own leaning was considered and rejected, which is right, and the fence should say which of the three options the leaning corresponds to.

On the three facts: The frontmatter recommendation (adopts rationale-stays-with-node, ratified, moderate) states one class and one value and the pin is current, and the option's own facts correctly distinguish the recommended option (no schema change) from the two that are. The facts should add that the parent this ruling feeds is at the maieutic stage and cannot be drafted until tier is re-answered. Persistence standing follows from the node's shape.

Strongest counter-argument (weak): Option 2, a because clause on each under entry, is cheap and would put the refinement in structure exactly where the two questions do not show it — the case the recommendation leaves to a convention nothing checks. Toulmin separates warrant from backing, but a warrant is still written down; the recommendation writes it down only sometimes and only in prose, so the projector can never show why a node hangs where it does, which is the navigation the author asked for when they asked for cites to be projected. Against it, a clause on every edge will be filled with restatements of the two questions in the common case.

The session's reply: Forward accepted. The dependence on under and the author's own leaning toward the edge prose are carried by the pending alternatives.
