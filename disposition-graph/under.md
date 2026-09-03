---
question: What does a node refine?
stage: maieutic
alternatives:
  - name: the-edge-alone
    source: review
    ref: "2026-09-03"
  - name: draft-after-three-rulings
    source: review
    ref: "2026-09-03"
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/model
defines:
  - under
  - rank
  - ceiling
  - context
---
## Disposition

The author, 2026-09-03:
> "Rationale" states that the node rationale stems from the node this node is under. Evaluate: would that always be the case? The disposition for the under edge seems to state this "Ask "why does this question exist?"; the answer names its parent." If so, does it make sense to make the "rationale" the prose property of the under edge?

The author, 2026-09-03:
> "Tier" (as in global-tier) needs a disposition. As a disposition references in the projected documentation must be hyperlinked. Is "tier" even the right primitive? Even cross-cutting non-functional concerns have scope. A static typing convention doesn't apply to the purpose node. Evaluate adversarially and from greenfield perspective whether cross-cutting non-functional concern could be reduced to topology and/or citations.

The author, 2026-09-03:
> The under edge disposition lists "rejected" as prose under "rationale" - it may make sense to record rejected dispositions, but this seems too ad-hoc.

## Answer

The question or questions named in its `under` field. This is the only hierarchical edge, and it means three things at once. Attention flows along it: a node's rank is its share of its parents' rank, split among siblings, so that the graph's shape is also its priority. Context loads along it: a session working on a node reads its ancestry. Authority is capped by it: a node's ceiling is its nearest ratified ancestor, and nothing the AI records under that ancestor may contradict it. A node may refine more than one question; then it draws rank and context from each. Roots have no `under`; a global-tier node has one like any other, tier only says the rule binds everywhere.

## Rationale

Ask "why does this question exist?"; the answer names its parent. Never choose a parent to change priority; that is what boost is for, and boost is the author's alone. Rejected: separate edges for attention, context, and containment, each of which turned out to be a reading of the same fact; a second reference kind for cousins, which differs from `under` by exactly one bit, motivation, and is kept as `cites`.

## Alternatives

### the-edge-alone

The decomposition finding holds that this node answers four questions at once, what the edge means, how rank is computed, what a ceiling is and how context loads, and defines all four terms, while standing at the maieutic stage with no drafted text and with its own account saying it cannot be drafted until three other questions are ruled. Three of the four are answered in full elsewhere, so under survives as the edge alone: what a node refines, that it is the only hierarchical edge, and that a node may refine more than one question. Rank moves to attention, context to session-context and ceiling to authority, after which under can be drafted without waiting on rationale-edge and tier. Raised on commons.systems/disposition-graph/session-context, commons.systems/disposition-graph/attention.

### draft-after-three-rulings

The same finding proposes that under be drafted from the outcomes of rationale-edge and a re-answered tier, and simplified as the decomposition finding proposes, since under's own account plans a draft after three rulings and one of them, tier, was kicked back with its recommendation withdrawn, so under cannot be drafted as planned. (Raised on commons.systems/disposition-graph/traditions-home.)

## Account

### Sitting on purpose, 2026-09-03

**The under node, whole; rationale, tier, and rejected alternatives**

Depends on q14, q15, and q16. The guidance to find a parent by asking why the question exists stays. The sentence on tier goes if q15 prunes it, replaced by the rule that a rule binds the subtrees of the nodes that cite it. The rejected alternatives become the structured list if q16 adopts it. The answer otherwise stands.

Facts: authority ratified; boldness moderate; persistence standing.

Depends on: `rationale-edge`, `tier`, `rejected`

Drafted after q14, q15, and q16 are ruled; the current text is shown below.

Proposed: pending.

Responses open: confirm as shown; confirm with edits; deny with feedback.

### Frontier finding, 2026-09-03

Kind: decomposition.

Under answers four questions at once — what an edge means, how rank is computed, what a ceiling is, and how context loads — and defines all four terms, while standing at the maieutic stage with 'Proposed: pending' and no draft. Three of the four are answered in full elsewhere: attention answers rank, session-context answers what a session loads, and authority's answer already carries the scope rule that 'ceiling' names. Two child nodes have been carved out of it already (rationale-edge, tier), and its Proposal says its own text cannot be drafted until three questions are ruled. Meanwhile four ruling-stage nodes rest on 'rank' and one on 'ceiling', terms only under defines.

Also named: commons.systems/disposition-graph/attention, commons.systems/disposition-graph/session-context, commons.systems/disposition-graph/rationale-edge, commons.systems/disposition-graph/tier.

Proposed: Under survives as the edge alone: what a node refines, that it is the only hierarchical edge, and that a node may refine more than one question. 'rank' moves to attention's defines, which already answers it; 'context' moves to session-context's defines; 'ceiling' moves to authority's defines, which is where the scope rule it names lives. Under then has one question and can be drafted without waiting on rationale-edge and tier.

### Frontier finding, 2026-09-03

Kind: cross-reference.

Recording's Answer describes the reviewer's world as 'the node as it would be committed, the nodes it joins up to its ceiling and the rules that bind everywhere, the nodes it cites, the author's words, and the whole unanswered frontier'. Clean-context-review describes it as 'every node with a stage, the answered nodes they join up to the roots, the rules that bind everywhere, the manifest, and the author's words on each'. 'Up to its ceiling' and 'up to the roots' are different rules, and 'ceiling' is defined by under — 'a node's ceiling is its nearest ratified ancestor' — which is at the maieutic stage with no draft. With nothing ratified the two rules coincide today and will diverge at the first ratification.

Also named: commons.systems/disposition-graph/recording, commons.systems/disposition-graph/clean-context-review.

Proposed: Clean-context-review is the survivor, since it is the node that answers how the review is run and its rule is the one the brief and the skill implement. Recording's sentence cites it rather than restating the input set, which also removes the only use of 'ceiling' outside under and lets under be simplified as the decomposition finding proposes.

### Frontier finding, 2026-09-03

Kind: placement.

Two ruling-stage nodes rest on maieutic ground without saying so. Rationale-edge is at ruling under under, which is at maieutic with 'Proposed: pending' and no draft, and under's own Proposal says its text is 'Drafted after q14, q15, and q16 are ruled' — one of which, tier, was kicked back and its recommendation withdrawn, so under cannot be drafted as planned. Separately, readings' draft and namespaces' draft both presume a traditions graph that traditions-home would create, and traditions-home is at ruling but is listed as a dependency of both; the manifest edit that would create the graph is shown on none of the three.

Also named: commons.systems/disposition-graph/rationale-edge, commons.systems/disposition-graph/tier, commons.systems/disposition-graph/traditions-home, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/namespaces.

Proposed: Rule traditions-home before readings and namespaces, and show the manifest entry on traditions-home so the author sees what they are creating. Rule rationale-edge and re-answer tier before under, and add to rationale-edge one clause saying its parent is unanswered. Under is then drafted from the three outcomes, simplified as the decomposition finding proposes.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `the-edge-alone` (review, 2026-09-03); `edge-alone` (review, 2026-09-03, from commons.systems/disposition-graph/session-context); `draft-after-three-rulings` (review, 2026-09-03, from commons.systems/disposition-graph/traditions-home); `simplify-to-the-edge` (review, 2026-09-03, from commons.systems/disposition-graph/attention).
Merge analysis of the author's words: 2026-09-03, new-answer on commons.systems/disposition-graph/rationale-edge: If a node's rationale always stems from the node it is under, does it make sense to make the rationale the prose property of the under edge?. 2026-09-03, new-answer on commons.systems/disposition-graph/tier: Tier needs a disposition and may not be the right primitive, since even cross-cutting concerns have scope; evaluate whether a cross-cutting concern reduces to topology or citations. 2026-09-03, new-answer on commons.systems/disposition-graph/rejected: Listing rejected alternatives as prose under the rationale seems too ad hoc, though recording rejected dispositions may make sense.
Moved to other nodes as alternatives: `rank-moves-here` on commons.systems/disposition-graph/attention; `context-moves-here` on commons.systems/disposition-graph/session-context; `ceiling-moves-here` on commons.systems/disposition-graph/authority; `rationale-as-the-edge-prose` on commons.systems/disposition-graph/rationale-edge; `say-the-parent-is-unanswered` on commons.systems/disposition-graph/rationale-edge; `record-rejected-dispositions` on commons.systems/disposition-graph/rejected; `show-the-manifest-entry` on commons.systems/disposition-graph/traditions-home.
The census unit's note: The node has a standing answer but no recommendation field and its account says the recommendation is pending, so adopts is null rather than standing; its own sitting cannot draft it until three other questions are ruled. All three of the author's blocks answer other nodes' questions, and all three targets already carry the same words verbatim, so the elsewhere entries on rationale-edge and rejected record where the author's leaning differs from the target's recommendation rather than adding words the target lacks; the tier block needed no entry, tier being one of my own nodes and carrying the quote. The decomposition finding gives the one alternative on this node and three defines moves elsewhere. The contingent edits in the sitting's own summary are not alternatives: the one that would have replaced the tier sentence rested on the cites-based scope rule that tier withdrew.

### Alternatives merged, 2026-09-03

The alternatives raised on this node by more than one census cohort were merged at the re-encoding, and any alternative the standing answer already carries was removed: `the-edge-alone` absorbs `edge-alone`, `simplify-to-the-edge`. The merge unit's note: draft-after-three-rulings restates the simplification but its own proposal is about when and from what under is drafted, that it be drafted from the outcomes of rationale-edge and a re-answered tier since tier was kicked back with its recommendation withdrawn, so it stays separate.
