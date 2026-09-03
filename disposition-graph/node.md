---
question: What is a node?
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/model
defines:
  - question
  - answer
  - rationale
  - form
  - proposal
instrument:
  kind: check
  ref: tools/validate.mjs
  note: every file parses as one question, at most one answer, and only defined fields
ledger: L14
---
## Answer

One question and its standing answer. The question is one line someone could ask the author. The answer is the current position in one of five forms, a target (something that should become true), a rule (something that must stay true while working), an assumption (something about the world the answer relies on), an archē (a first principle held, never derived), or a reading (what a tradition says about the answer above it). The rationale says why, and which alternatives were rejected. A node may also carry a proposal, a candidate answer with no authority, recorded for the author's review. If a text answers two questions, it is two nodes. If a new answer replaces an old one, the node holds the new answer and version control holds the old.

## Rationale

One question per node makes "same scope" decidable: two texts share a node only if one replaced the other. Rejected: the node as a topic, which mixes authority in one text; the node as a cluster around a default scope; history kept inside the node. Traditions to record as readings: issues as questions (Kunz and Rittel, IBIS, 1970); the answer as an accumulated restatement (the common-law restatement); store once and derive the rest (Codd). Ledger L01, L14.
