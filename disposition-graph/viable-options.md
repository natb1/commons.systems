---
question: Is authority a projection of the state of a node's viable options?
stage: periagogic
form: rule
under:
  - commons.systems/disposition-graph/authority
  - commons.systems/disposition-graph/dialogue
---
## Disposition

The author, 2026-09-04:

> Consider this alternative for unanswered node encoding from a greenfield perspective. Is "unanswered" just an authority - as in no authority granted for reconciliation. Or, more precicely, explicit bootstrap authority required for reconciliation - in this way bootstrap authority is not a shim, but a persistent disposition about reconciliation authority. Each fact on a node, regardless of authority, has viable options list (possibly length 1) with a) AI recommendation/why b) support or divergence from tradition for each option and c) (if answered) the confirmed choice and why. This would also collapse "proposals". Proposals are just nodes with ratified authority and a fact with confirmed choice that deviates from AI recommendation. If recommendation timestamp is after confirmation timestamp for a ratified node then (facts don't change but) the node is projected onto the alignment frontier for re-confirmation. For each fact, the confirmed choice, the AI recommendation and support divergence from tradition as well as any non-chosen option which is categorized as "viable" by the AI - these are all is persisted after confirmation to mitigate regression. This gives a clear mechanical encoding for ADR style "alternatives considered" documentation and more obvious presentation in the graph browser - what's the confirmed choice and (on drilling down) why that choice was made, what the AI said and why, what tradition says.
>
> In this model "delegated" and "deferred" authority mean reconciliation authority is granted for AI recommendation without requiring confirmation. Delegated means the node is removed from the alignment frontier and deferred means it remains.
>
> This comes close to re-framing authority as a projection of the state of the viable options list. Evaluate this.
>
> Under this model the prior statement that "reconciliation never edits the graph" is incomplete. Whatever persistent state reconciliation requires for reconciliation operations (if any) is stored outside the graph - true. But, AI has the authority record untracked but viable alternative options and to change its recommendation during either reconciliation or rsi. If the recommendation is on ratified node then that triggers the alignment frontier projection described above. Subject to attenuation/breakout controls - if the change of recommendation is on delegated or deffered node then it changes the shape of the reconciliation frontier.
>
> Progress this dialogue through meiutic and stop before adversarial review.

## Account

### Minted from the author's disposition, 2026-09-04

The words above are one model, and the model is a new answer to several
questions the record already asks: `authority` (who may change an answer, and
what the classes mean), `unanswered` (when a disposition is answered, and what
the alignment frontier holds), `dialogue` (what an unanswered node carries),
`recording` (what the recording removes), `rejected` (how rejected alternatives
are recorded), `readings` (how a tradition's support is recorded),
`work-loop` and `delegation` (whether reconciliation writes the graph),
`evaluation` (what an overrule does), and `rsi`. What binds those answers
together is one premise that no node asks: whether a node's authority is a
stamp written on it or a state read off its options. A premise the author
would rule on separately, and whose ruling makes the rest decidable, is a
question, and a question is a node (`dialogue`, `aspects-are-nodes`). It is
placed under `authority`, whose answer it would rewrite, and under `dialogue`,
whose encoding it would replace. The consequences for the other nodes are
recorded on them as alternatives at the maieutic checkpoint, each naming this
node in `depends`, so that one ruling here settles them and the ruling order
counts it.

The periagogic object is those nodes' pages, read at `origin/disposition`
before anything is drafted, and the implementation their criteria point to:
the reader's schema in `packages/disposition/read.mjs` (`FRONTMATTER_KEYS`,
`FACT_NAMES`, `CONFERRABLE_CLASSES`, `deriveStatus`,
`deriveStandingHash`), the projector's frontier and alignment page in
`packages/disposition/project.mjs`, the two skills under `.claude/skills/`,
and the rule projections under `.claude/rules/`.

The author has directed the dialogue to run through the maieutic movement and
stop before the clean-context review. The periagogic probes are therefore put
in this account, each cited to the record by locus, for the author to answer
on the page or in prose; the AI's evaluation is held out of that section and
enters only in the maieutic one that follows it. The named deviation of the
periagogic conduct, the AI's account put before the author's, is the thing to
watch in a sitting run this way, and the separation of the two sections is how
this one watches it.
