---
question: What do approval-directed agents say about acting under a review that is owed, and what does the record take from them?
stage: maieutic
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-04"
    recommends: standing
    boldness: moderate
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: delegated
    boldness: moderate
form: reading
under:
  - commons.systems/disposition-graph/viable-options
source: Christiano, "Approval-directed agents", first posted in 2014 and reposted in the AI Alignment publication, which defines an agent that takes the action its overseer would most approve of, rather than one that pursues a goal or maximises a utility of its own, and argues that this makes the agent's behaviour comprehensible to and correctable by the overseer; with the iterated amplification work that follows from it. Locus to be checked, the original posting and its date.
bears:
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: grant-from-a-ruling
    relation: adopted
  - node: commons.systems/disposition-graph/authority
    fact: answer
    option: authority-derived
    relation: adopted
  - node: commons.systems/disposition-graph/what-acts-during-bootstrap
    fact: answer
    option: deferred-as-the-resting-state
    relation: diverged
---
## Answer

Supports deferred as a class, which is the record's name for action under a review that is owed. The proposal's move is to make the standard of correctness the overseer's judgment rather than an objective the agent holds: the agent does what the overseer would approve of, so there is no goal for it to pursue past the overseer's understanding, and its behaviour stays the kind of thing the overseer can inspect and correct. The point that carries here is that the agent acts without waiting, and the overseer's authority is preserved by the standard the action is held to rather than by a gate before it.

The record adopts it for one class and not for the others. On a deferred node the recommendation acts and the node stays on the alignment frontier until the author returns to it, which is exactly action taken to a standard whose holder has not yet applied it. On an unanswered node nothing acts, which is the record refusing the approach where no approval has ever been given for anything; and on a ratified node the confirmed choice acts, which is real approval rather than an estimate of it.

The divergence is on the estimate. Approval-direction turns on what the overseer would approve, a counterfactual the agent has to model, and the known failure of the approach is that the model of the overseer is what drifts, quietly and in the agent's own favour. The record never lets the estimate stand as the approval: the node stays on the frontier so the actual ruling is eventually taken, the recommendation carries its boldness, which says how much of it rests on the AI's own knowledge rather than on the author's words, and the account is what the author reads when they return. Deferred is therefore approval-direction with a debt attached and a date on it, rather than approval-direction as a resting state.

## Rationale

Recorded as one of the eight traditions in `viable-options`' rationale, adopted for deferred as action under a review owed, and moved here under `prose-and-structure`, which holds that a tradition named only in prose carries no `bears` entry and no pin. It bears on the option that stands on `viable-options`' answer fact, whose second paragraph defines deferred as the recommendation acting with the node kept on the alignment frontier.

## Facts

### answer

The standing text is the only reading of this proposal the record has
produced, and no second account of what it takes from it is on the table.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the source and the author has not read
it here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the source, and it is the author's to
take.

## Account

Minted at reconciliation on 2026-09-04 under the author's bootstrap grant of that day, from the paragraph of `viable-options`' rationale that names eight traditions in prose, which under `prose-and-structure` becomes readings with `bears` entries: "and approval-directed agents, adopted for deferred as action under a review owed". Validated by the AI from its own knowledge of the source; deferred until the author reads it, and delegated if the author declines to.
