# Measurement and Constraint Provenance

Two habits that cost real session time in the dispatch/RSI serialized PR batch:
re-running measurements that were already shown, and obeying a constraint whose
origin nobody recorded. Both rules below bind every session in this repo.

## Trust a measurement that shows its work

A figure that arrives with the exact command that produced it **and** that
command's real output is trusted. Do not re-run it to confirm it.

Re-measure only when one of these holds:

- the claim is asserted with no command and no output behind it;
- it is a `path:line` anchor — line numbers drift, so re-check the anchor by
  default, while leaving the conclusion it supports alone;
- something contradicts it;
- acting on it wrongly would be expensive or irreversible — a push, a merge, a
  park clear, a `--base` compare-and-swap token. `.claude/rules/sandbox.md`
  applies the same test to commands that must set `dangerouslyDisableSandbox`
  pre-emptively rather than on retry, because the first sandboxed attempt
  already does the damage.

Re-measuring what was already measured is one of the main ways a session burns
time without advancing. The failure it guards against — acting on a stale
number — is caught more cheaply by those four triggers than by measuring
everything twice.

**A predicted figure is not a measurement.** Anything derived from a plan, a
staged kit, or a projection is a prediction, and must be labelled as one where
it is written down. Two cases from one batch: a pre-staged kit predicted a
"26 → 27 files" migration where the measured value was 28, and a ruling premise
of "41 of 124" measured 13. Drafts predict; `origin/main` is the fact.

## Record SOURCE and SCOPE with every carried constraint

Any prohibition or requirement you carry forward in your own notes — a standing
constraints list, a scratch file, a handoff summary — must record both fields.
Without them, the next compaction makes it indistinguishable from a standing
user rule, and it gets obeyed with authority it never had.

- **SOURCE** — one of: user instruction; project rule (a file under
  `.claude/rules/`); a subagent prompt the agent itself wrote; inference.
- **SCOPE** — one of: this subagent; this worktree; this session; global.

The live case is the whole argument. A constraint reading *"never execute
`mint-mainqa-nodes`"* sat in a standing constraints list and nearly blocked a
unit of work outright. It came from a read-only prep subagent prompt the agent
had written itself, and that same prompt block also forbade `graph-commit`,
`write-node.ts`, `clear-park`, `park-node`, `transition-node` and `git push` —
every one of which the agent had been running all session under explicit
granted authority.

That gives a tell you can apply directly: **a prohibition that names one tool
while the same list forbids sibling tools you are demonstrably using under
authority was scoped to a different actor.** Checking provenance is cheap and
decisive — read the constraint's own source before either obeying it or
overriding it.

It cuts both ways. An inferred constraint is not license to ignore a real one.
When provenance is genuinely unrecoverable, treat the constraint as binding and
say so explicitly — "SOURCE unknown, treating as binding" — rather than
silently dropping it.
