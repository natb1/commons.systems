---
question: What does attenuation in object-capability systems say about what a delegated actor may pass on, and what does the record take from it?
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
source: Attenuation in object-capability systems. Dennis and Van Horn, "Programming Semantics for Multiprogrammed Computations", Communications of the ACM 9(3) (1966), where a capability is an unforgeable reference that carries the authority to use what it names; Miller, Robust Composition (doctoral thesis, Johns Hopkins University, 2006), on capability discipline, the principle of least authority, and the attenuating forwarder, an object that passes a request on with less authority than it holds; Hardy, "The Confused Deputy" (1988), on what goes wrong when authority travels separately from the request that uses it.
bears:
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: grant-from-a-ruling
    relation: adopted
  - node: commons.systems/disposition-graph/authority
    fact: answer
    option: authority-derived
    relation: adopted
---
## Answer

Supports the shape of what reconciliation may write. In a capability system authority is held as a reference rather than claimed by identity, and the rule that makes the system composable is that a holder may pass on a strictly weaker reference and never a stronger one. Where a subsystem needs part of an authority, the standard move is not to hand it the object but to hand it a forwarder that accepts fewer requests, so the recipient can do exactly what it was given and nothing else, and no audit of intentions is required to know that.

The record adopts the rule for its own delegations. What alignment may write to the graph is the full authority: the interview, the ruling, the recording, the author's words. What reconciliation may write is an attenuation of it, a viable option recorded on a fact and a recommendation moved within the node's scope, and never a ruling, a ruling's edit, or the author's words. A subagent's licence is a further attenuation of the session's, the files its brief names and no node at all. And a ruling on an ancestor confers on the nodes beneath it only the decisions its scope covers, so authority narrows on the way down, which is the same rule stated for the graph.

The divergence is in the enforcement. In the tradition the attenuation is the mechanism: the weaker reference is all the recipient has, so exceeding it is not something it declines to do but something it cannot do. Here the attenuation is a written disposition that a session follows, checked by review and by what the record shows afterwards. That is the same rule with a weaker guarantee, and the record should say so rather than borrow the tradition's assurance; the harness's permissions are the only part of it that is actually a mechanism.

## Rationale

Recorded as one of the eight traditions in `viable-options`' rationale, adopted for what reconciliation may write, and moved here under `prose-and-structure`, which holds that a tradition named only in prose carries no `bears` entry and no pin. It bears on the option that stands on `viable-options`' answer fact, whose fourth paragraph sets out what the AI may write and what it may not.

## Facts

### answer

The standing text is the only reading of this literature the record has
produced, and no second account of what it takes from it is on the table.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at reconciliation on 2026-09-04 under the author's bootstrap grant of that day, from the paragraph of `viable-options`' rationale that names eight traditions in prose, which under `prose-and-structure` becomes readings with `bears` entries: "attenuation in object-capability systems, adopted for what reconciliation may write". Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.
