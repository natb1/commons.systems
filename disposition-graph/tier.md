---
question: What gives a rule its scope?
stage: maieutic
under:
  - commons.systems/disposition-graph/under
---

## Disposition

The author, 2026-09-03:
> 'Tier' (as in global-tier) needs a disposition. As a disposition references in the projected documentation must be hyperlinked. Is 'tier' even the right primitive? Even cross-cutting non-functional concerns have scope. A static typing convention doesn't apply to the purpose node. Evaluate adversarially and from greenfield perspective whether cross-cutting non-functional concern could be reduced to topology and/or citations.

## Proposal

### Sitting on purpose, 2026-09-03

**Scope of a rule**

Three nodes carry tier global (authority, session-context, evaluation) and the rules projection reads the flag. Every concern has a scope: a typing convention does not bind purpose. Topology alone fails, because a rule's home question and its scope differ (evaluation lives under growth and binds every evaluation). Citations alone fail unless they inherit. Together they suffice: a rule binds the subtree of every node that cites it, inherited along under; a rule cited by purpose binds the repository; the rules projection is the rules cited at purpose, and a bite's ancestry projection carries the rules cited along its ancestry. Tier is then derived and the field is pruned; every field name and value on a page links to the node that defines it, so nothing appears in the projection that no node defines.

Options:
- (recommended) Prune tier; a rule's scope is the subtrees of the nodes that cite it; the rules projection is the rules cited by purpose; the ancestry projection carries the rules cited along the ancestry — authority ratified; boldness moderate; persistence standing; a schema change
- Keep tier as a stored flag — authority ratified; boldness low; persistence standing
- Scope by under alone, a rule binds the subtree it sits in — authority ratified; boldness moderate; persistence standing

Feeds: `under`, `node`, `projection`, `session-context`, `authority`

Rulings open: take the recommended option; take another option by number; defer; answer in prose.

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
