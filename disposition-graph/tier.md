---
question: What gives a rule its scope?
stage: maieutic
review:
  verdict: kickback
  strength: strong
  date: 2026-09-03
  of: b771f61884d089ade840320426bdb133f11fabc8
alternatives:
  - name: keep-tier-as-a-stored-flag
    source: ai
    ref: "2026-09-03"
  - name: scope-by-under-alone
    source: ai
    ref: "2026-09-03"
  - name: record-what-makes-a-rule-global
    source: review
    ref: "2026-09-03"
under:
  - commons.systems/disposition-graph/under
---
## Disposition

The author, 2026-09-03:
> 'Tier' (as in global-tier) needs a disposition. As a disposition references in the projected documentation must be hyperlinked. Is 'tier' even the right primitive? Even cross-cutting non-functional concerns have scope. A static typing convention doesn't apply to the purpose node. Evaluate adversarially and from greenfield perspective whether cross-cutting non-functional concern could be reduced to topology and/or citations.

## Alternatives

### keep-tier-as-a-stored-flag

The second option of the sitting: tier stays a stored flag on the node and the rules projection reads it, which is what the record runs on and what the projector implements today. The reviewer's counter-argument favours it, noting that all five global-tier nodes genuinely do bind every session and that no narrower cross-cutting rule has ever been recorded here.

### scope-by-under-alone

The third option of the sitting: a rule binds the subtree it sits in, and tier is pruned. The sitting's own reasoning rejects it because a rule's home question and its scope differ, evaluation living under growth while binding every evaluation, but the author has not ruled on it.

### record-what-makes-a-rule-global

The reviewer's cheaper answer, offered when the recommended option was kicked back: record what makes a rule global and keep the flag as its projection, so tier is derived from a stated property rather than being either an unexplained field or a new citation mechanism. The session accepted the kickback and named this as one of the two readings the maieutic movement must draw out.

## Account

### Sitting on purpose, 2026-09-03

**Scope of a rule**

Three nodes carry tier global (authority, session-context, evaluation) and the rules projection reads the flag. Every concern has a scope: a typing convention does not bind purpose. Topology alone fails, because a rule's home question and its scope differ (evaluation lives under growth and binds every evaluation). Citations alone fail unless they inherit. Together they suffice: a rule binds the subtree of every node that cites it, inherited along under; a rule cited by purpose binds the repository; the rules projection is the rules cited at purpose, and a bite's ancestry projection carries the rules cited along its ancestry. Tier is then derived and the field is pruned; every field name and value on a page links to the node that defines it, so nothing appears in the projection that no node defines.

Options:
- (recommended) Prune tier; a rule's scope is the subtrees of the nodes that cite it; the rules projection is the rules cited by purpose; the ancestry projection carries the rules cited along the ancestry — authority ratified; boldness moderate; persistence standing; a schema change
- Keep tier as a stored flag — authority ratified; boldness low; persistence standing
- Scope by under alone, a rule binds the subtree it sits in — authority ratified; boldness moderate; persistence standing

Feeds: `under`, `node`, `projection`, `session-context`, `authority`

Responses open: confirm the recommended option; confirm with edits, naming another option; deny with feedback.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: kickback to the maieutic stage.

Findings:

- The recommended option turns on a cites edge the schema does not have and no node carries. The record mentions cites twice: the author's 'Projecting cites relationships will aid onboarding navigation', and under's rejected list, 'a second reference kind for cousins, which differs from under by exactly one bit, motivation, and is kept as cites'. Neither says what it is, whether it inherits, or how it is written; the option asserts inheritance as settled.
- 'The rules projection is the rules cited by purpose' makes purpose cite authority, evaluation, session-context, materialization and delegation. Purpose is the onboarding entry, and projection's draft projects 'the nodes it cites'. The option does not say whether the newcomer's first page now carries five rule links.
- The same rule cited at two depths would have two scopes, so scope becomes a property of the citation rather than of the rule. Nothing says what happens when a rule is cited both at purpose and deeper, how a rule is un-cited, or which citation wins.
- The option's last clause, 'every field name and value on a page links to the node that defines it, so nothing appears in the projection that no node defines', cannot be met: at least fifteen field names and sub-keys in current use (defines, tier, source, relation, kind, ref, note, class, by, date, artifact, for, liquidation-adjacent keys, criteria, cites) are named by no node's defines. Projection's draft already carries this clause, so the two would land an unmeetable rule together.

On the three facts: 'Ratified; boldness moderate; a schema change' understates it. The option introduces a new edge kind, a new inheritance rule and a new projection rule, and changes the scope of a node not in this batch. Boldness is high.

Strongest counter-argument (strong): The author's question was whether cross-cutting concerns reduce to topology or citations. The recommendation answers 'citations' with a citation mechanism the record has never defined, and its own reasoning concedes that neither topology nor citations suffices alone. Meanwhile option 2, keeping tier as a stored flag, is what the record runs on and what the projector implements today. The author's objection is real, that a typing convention should not bind purpose, but no such convention has ever been recorded here: all five global-tier nodes genuinely do bind every session. The intention needs drawing out again: is the author asking for a mechanism that can express a rule with a narrower-than-global scope, in which case what would such a rule be, or asking why tier is a flag rather than derived, in which case the cheaper answer is to record what makes a rule global and keep the flag as its projection.

The session's reply: Accepted; the stage returns to maieutic. The question to draw out is the reviewer's: whether the author wants a rule with a narrower scope than global, and what such a rule would be, or asks why tier is a stored flag rather than derived, in which case the cheaper answer records what makes a rule global and keeps the flag as its projection. The cites edge is defined by no node, and the recommendation that rested on it is withdrawn.

### Frontier finding, 2026-09-03

Kind: contradiction.

Projection's draft Answer: 'Every defined term and every tradition's name links to the node that defines it, and so does every field name and value on a page.' The second clause is tier's recommended option, which tier's reviewer kicked back and whose session reply withdrew it: 'The cites edge is defined by no node, and the recommendation that rested on it is withdrawn.' Verified unmeetable: at least fifteen field names and sub-keys in use are named by no node's defines, and no node carries a 'cites' field although the schema and the browser both support one. Projection stands at the ruling stage carrying a clause the record has withdrawn at the maieutic stage.

Also named: commons.systems/disposition-graph/projection.

Proposed: Tier is the survivor of the question and it is unanswered. Projection's draft strikes 'and so does every field name and value on a page' and keeps the defined-term and tradition-name links, which are the author's own request and are implemented. The field-link rule returns with tier whenever tier is answered.

### Frontier finding, 2026-09-03

Kind: decomposition.

Under answers four questions at once — what an edge means, how rank is computed, what a ceiling is, and how context loads — and defines all four terms, while standing at the maieutic stage with 'Proposed: pending' and no draft. Three of the four are answered in full elsewhere: attention answers rank, session-context answers what a session loads, and authority's answer already carries the scope rule that 'ceiling' names. Two child nodes have been carved out of it already (rationale-edge, tier), and its Proposal says its own text cannot be drafted until three questions are ruled. Meanwhile four ruling-stage nodes rest on 'rank' and one on 'ceiling', terms only under defines.

Also named: commons.systems/disposition-graph/under, commons.systems/disposition-graph/attention, commons.systems/disposition-graph/session-context, commons.systems/disposition-graph/rationale-edge.

Proposed: Under survives as the edge alone: what a node refines, that it is the only hierarchical edge, and that a node may refine more than one question. 'rank' moves to attention's defines, which already answers it; 'context' moves to session-context's defines; 'ceiling' moves to authority's defines, which is where the scope rule it names lives. Under then has one question and can be drafted without waiting on rationale-edge and tier.

### Frontier finding, 2026-09-03

Kind: placement.

Two ruling-stage nodes rest on maieutic ground without saying so. Rationale-edge is at ruling under under, which is at maieutic with 'Proposed: pending' and no draft, and under's own Proposal says its text is 'Drafted after q14, q15, and q16 are ruled' — one of which, tier, was kicked back and its recommendation withdrawn, so under cannot be drafted as planned. Separately, readings' draft and namespaces' draft both presume a traditions graph that traditions-home would create, and traditions-home is at ruling but is listed as a dependency of both; the manifest edit that would create the graph is shown on none of the three.

Also named: commons.systems/disposition-graph/rationale-edge, commons.systems/disposition-graph/under, commons.systems/disposition-graph/traditions-home, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/namespaces.

Proposed: Rule traditions-home before readings and namespaces, and show the manifest entry on traditions-home so the author sees what they are creating. Rule rationale-edge and re-answer tier before under, and add to rationale-edge one clause saying its parent is unanswered. Under is then drafted from the three outcomes, simplified as the decomposition finding proposes.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `keep-tier-as-a-stored-flag` (ai, 2026-09-03); `scope-by-under-alone` (ai, 2026-09-03); `record-what-makes-a-rule-global` (review, 2026-09-03).
Merge analysis of the author's words: 2026-09-03, own-question: Tier needs a disposition and may not be the right primitive, since even cross-cutting non-functional concerns have scope; evaluate adversarially and greenfield whether a cross-cutting concern reduces to topology or citations, and hyperlink every reference in the projected documentation.
Moved to other nodes as alternatives: `strike-the-field-link-clause` on commons.systems/disposition-graph/projection.
The census unit's note: The node carries no answer, no draft and no recommendation field, so adopts is null: the recommended option was withdrawn by the session's own reply after the kickback, which is why I did not record it as pending. What is pending are the two surviving options from the sitting and the reviewer's third reading, that tier be derived from a stated property of a rule while the flag remains its projection. The reviewer's two probes, whether the author wants a rule narrower than global and what such a rule would be, are questions with no candidate answer and I left them out. The author's block is this node's own question, though its hyperlink clause is answered by projection; the finding that carries that to projection is the elsewhere entry. The decomposition and placement findings on this node concern under and are recorded from under.
