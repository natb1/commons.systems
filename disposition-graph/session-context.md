---
question: What does a session load, and where does it come from?
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/projection
tier: global
defines:
  - session context
  - rules
ledger: L31
---
## Answer

From three projections and nothing else. Rules, one file per global-tier node under `.claude/rules/`, carry the doctrine every session works under; the projector regenerates them, each headed by the node it projects, and a rule no node projects is unsupported implementation. `CLAUDE.local.md`, written into a bite's worktree at provisioning and never committed, carries the ancestry of the node the bite serves, pinned at a graph commit. `CLAUDE.md`, committed at the root, is the orientation page an AI session reads first: what this repository is, where its record lives, and how a session reads and writes it, projected from the purpose node and from the projection node. It states no rule of its own, because a rule that lives only there is invisible to the projector and to review. The one function `CLAUDE.md` serves that rules do not is orientation: it is the surface an arriving session, or the AI a newcomer arrives with, reads first, and the harness loads it by directory, so a nested checkout inherits it. Anything in any of the three that no node projects is on the frontier as a prune-by-default proposal.

## Rationale

The author's ruling of 2026-09-02 that `CLAUDE.md` must be justified and materialized by disposition like rules and `CLAUDE.local.md`, with the question whether it serves any function rules do not. Evaluated against the harness: rules and `CLAUDE.md` are both always-loaded instructions; rules are scoped to the project root and may be scoped to paths, `CLAUDE.md` is scoped to the working directory and its ancestors and may import files; skills load on invocation; memory is private to one account and one path, so it can carry nothing the record needs. The functions that had accumulated in the bootstrap `CLAUDE.md` map as follows: the token-efficiency rule and the loop to the bootstrap node and the skill; the code-review recipe to the review node's instrument; environment traps to evidence on the node whose instrument they qualify; the round log and the decisions list to the ledger and git history. During bootstrap the file on the implementation ref is a declared shim carrying those until they move. Rejected: deleting `CLAUDE.md` outright, because the arriving-session function is real for the audience and costs one projected page; keeping operating rules in it, because the projector cannot see them there. Traditions to record as readings: the Unix `README` and `INSTALL` convention, adopted, orientation kept apart from rules; twelve-factor configuration, one home per fact, adopted. Ledger L31.
