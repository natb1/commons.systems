---
question: Who may change an answer?
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/model
tier: global
defines:
  - authority
  - ratified
  - delegated
  - deferred
  - doctrine
  - author
ledger: L14
---
## Answer

Every answer carries a stamp: who holds it, with what class, and since when. Ratified means the author decided and wants to be asked before it changes; only the author writes that stamp, through the ratify command, and no AI code path can. Delegated means the author handed that class of decision to the AI and does not want to be asked again. Deferred means the AI decided within the author's rules and owes the author a review. Doctrine is the ratified answers taken together. The AI exercises authority within scope: it may answer under a ratified ancestor, may change delegated answers at will, and records anything that would contradict doctrine or exceed its scope as a proposal, which has no authority and acts on nothing until the author rules. A proposal that contradicts doctrine also triggers review of the delegated disposition it was made under.

## Rationale

Attenuation: authority only narrows as it is handed down, never widens, so a breakout would have to be written up the tree, and nothing writes up. Rejected: recording out-of-scope answers as deferred, because deferred still acts. Traditions to record as readings: ultra vires and enabling acts; delegation containment in cgroup v2; attenuation in object-capability systems; corrigibility and approval-directed agents in the alignment literature. Ledger L07, L08, L14.
