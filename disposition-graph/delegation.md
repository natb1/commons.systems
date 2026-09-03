---
question: How is work divided between the main thread and subagents?
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-03
under:
  - commons.systems/disposition-graph/growth
defines:
  - main thread
  - unit
  - subagent
---
## Answer

The main thread is the session that holds the interview and the record: it interviews the author, writes and amends nodes, reviews what subagents return, and lands. It runs on the most capable model at full effort, so everything else is a unit delegated to a subagent. A unit is one deliverable with a written contract, inputs, outputs, the files it may write, and its error behaviour, with a test or a verifiable output; a unit that needs a second contract is two units. Every investigation whose context is verbose is a unit whatever its size: debugging, driving a browser, reading logs, transcripts, or diagnostic output, and surveys. The subagent reports a conclusion and the exact commands it ran; the main thread reads the conclusion and never the context. The model follows the kind of work: the smaller model for mechanical tooling, tests, format work, and anything whose contract determines the answer; the larger model for design and judgment, such as a layout or a survey that classifies what it reads; the smallest for lookups. The effort is stated in the brief. A subagent never runs state-changing version control, never edits a node or the record's scaffolding, writes only the files its brief names, and works only in the worktree it was given.

## Rationale

The author's rulings of 2026-09-02, that implementation is delegated by unit, model, and effort, and of 2026-09-03, that debugging activities such as driving a browser are prime candidates for subagents, because doing them on the main thread at full effort is very expensive and their verbose context pollutes the thread that holds the interview. The rule binds the alignment session and the reconciliation sessions alike; during bootstrap it is projected into the operations document and the alignment skill. Rejected: a fixed model for every task, because the cost is set by the most capable model at full effort and most units do not need it; letting the main thread investigate when a question seems small, because the size of a debugging context is unknown until it has been read.
