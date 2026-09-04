---
question: What does the Pareto frontier say about which options stay on a fact, and what does the record take from it?
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
source: The Pareto frontier of multi-objective choice. Pareto, Manuale di economia politica (1906), where an arrangement is optimal when no one can be made better off without making another worse off; and the use of the same relation in multi-criteria decision analysis, where one alternative dominates another when it is at least as good on every criterion and better on at least one, and the frontier is the set of alternatives nothing dominates.
bears:
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: grant-from-a-ruling
    relation: adopted
  - node: commons.systems/disposition-graph/evaluation
    fact: answer
    option: overrule-by-class
    relation: adopted
---
## Answer

Supports the definition of viable, and defines the one judgment the AI is allowed to make about an option's presence. The relation the tradition supplies is dominance: an alternative is dominated when another is at least as good on every criterion and better on one, and dominance is the only comparison an analyst can make without deciding for the decider. Everything not dominated is on the frontier and stays there, because choosing among the frontier means trading one criterion against another, and the trade is the decider's to make.

The record adopts it exactly. Viable means not dominated on the record's criteria in the AI's judgment, which is the evaluation node's solution frontier applied to one decision, so the AI's judgment about an option is a dominance judgment and never a preference. That is what keeps the option list from being the AI's shortlist: an option the AI likes less than another but which is better on some criterion is not dominated, and removing it would be the AI making the author's trade for them.

Two of the tradition's conditions are not met here, and the reading names them because the record's practice turns on them. The first is that dominance is checked against a stated set of criteria; here the criteria are the record's own prose, so the check is a judgment, it can be wrong, and the author may rule for an option the AI marked passed over. The second is that the frontier is computed and can be recomputed; here it is asserted once, when the option is written, so an option dropped as dominated is dropped on a judgment nobody re-examines. That is the pressure behind the finding the tradition pass ranked first, that the fold survives at the option level, and it is why an option that is passed over is better kept on the fact with its reason than removed from the list.

## Rationale

Recorded as one of the eight traditions in `viable-options`' rationale, adopted for what viable means, and moved here under `prose-and-structure`, which holds that a tradition named only in prose carries no `bears` entry and no pin. It bears on the option that stands on `viable-options`' answer fact, whose third paragraph defines viable as not dominated on the record's criteria. The rationale of `evaluation` names the same tradition for the sense of frontier, so a second `bears` entry on that node's answer fact is owed when its options are settled.

## Facts

### answer

The standing text is the only reading of this relation the record has
produced, and no second account of what it takes from it is on the table.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at reconciliation on 2026-09-04 under the author's bootstrap grant of that day, from the paragraph of `viable-options`' rationale that names eight traditions in prose, which under `prose-and-structure` becomes readings with `bears` entries: "the Pareto frontier, adopted for what viable means". Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.
