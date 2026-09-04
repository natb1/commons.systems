# commons.systems

> **Shim notice (2026-09-03).** This page is hand-written orientation. In
> the target state the projector writes it from the `purpose` and
> `projection` nodes (`session-context`), and it is declared as a shim on
> `session-context` until then. It states one rule of its own and no other:
> "How a recommendation is made" below, under a stopgap grant the author gave
> on 2026-09-04 as a stand-in for rule reconciliation, and that section names
> its own liquidation. Every other rule a session works under is a file under
> `.claude/rules/`, projected from the graph, and the operations live in the
> two skills below. Where this page conflicts with the graph on the
> `disposition` ref, the graph wins.

## What this repository is for

From the purpose node, whose answer is the author's and not yet ratified:
"This repository exists so that a person can keep long-horizon AI work
aligned with their explicit intent. It records the person's dispositions as
a graph, and the work is derived from that record rather than from prompts
or chat: something like spec-driven development, applied to software
factories, where the specification is the person's standing answers and
the factory is whatever agents act on them. Its intended readers are humans
who want that, and who may arrive here by way of an AI tasked with the same
goal."

## How a recommendation is made

> **Stopgap (2026-09-04).** The author granted bootstrap authority to
> reconcile this disposition here, as a stand-in for rule reconciliation, and
> stated it needs neither a disposition nor a shim. It is the one rule this
> page states. Liquidation: rules are reconciled, the projector writes this
> from `evaluation` like every other rule, and this section is deleted. Until
> then it is unsupported implementation by `session-context`'s own standard,
> which is why it says so here. The graph's text at
> `commons.systems/disposition-graph/evaluation` governs; this is its shim.

Against the full solution frontier. Nothing is sacred: no doctrine is implied
by what exists, least of all by the incumbent implementation, which is evidence
of past decisions and never authority over future ones. That is what greenfield
means here, and it is the lens every recommendation is made through, not an
occasional one; it is operational rather than a sentiment.

A class of argument is struck from the choosing: what a change would cost to
migrate, how many files or nodes it touches, what reviews or assessments it
would spend, what tooling it would rework, and that the incumbent already does
it the other way. None of those bear on whether a design is right, and a
recommendation resting on one of them has not been made.

The positive test replaces them: judge the design as if the record were being
written from scratch, with nothing in it to preserve. The error to hunt is an
incumbent fact doing the work of a design constraint, which is the failure this
lens exists to catch; a recommendation found resting on one is named as such
and redrawn.

Cost is not thereby unsayable. A recommendation still states what its design
will cost: that is a consequence of a design chosen on its merits, and never a
reason for choosing it.

## Where the record lives

- **The disposition graph** is the `disposition` ref, checked out as the
  nested worktree `disposition/` (gitignored here). Its manifest is
  `disposition/disposition.yaml`; its nodes are one markdown file each under
  `disposition/disposition-graph/` and `disposition/public/`; a node's id is
  `commons.systems/<graph>/<slug>`. A node with no `## Answer` is an
  un-aligned disposition, part of the open dialogue with the author. No
  node carries a stamp: a node's class is read off the rulings the author
  recorded on its facts, and a node no ruling reaches is unanswered.
- **The materialized implementation** is this ref, `greenfield`, during
  bootstrap (the shim declared on `materialization`; swapped with `main` at
  exit). `packages/disposition/` is the graph's reader, validator, and
  projector; `.claude/skills/align/` and `.claude/skills/reconcile/` are the
  two operating skills, both declared shims; `.claude/skills/align-review/`
  and `.claude/skills/align-survey/` are the clean-context review's two
  readings, declared shims too, over the one package
  `packages/clean-context-review/` that holds their mechanics;
  `.claude/rules/` is projected from the global-tier nodes and never edited
  by hand; `bootstrap/` holds evidence cited by nodes; `dist/` and `tmp/`
  are gitignored output.
- **The projections the author reads**: the graph browser, published at
  https://claude.ai/code/artifact/502111c1-a7fb-4108-a9cb-ebb7b2a44933, and
  the alignment page, at
  https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678.
- **The legacy record** is the tree of `main` (`intentions/`, its skills and
  rules): evidence only, read with `git show main:<path>` or from a worktree
  of `main`, never written.

## How a session reads and writes it

- Read the graph through the browser, the rules, and
  `node packages/disposition/project.mjs disposition --frontier -`, which
  lists every node in rank order with its class, instrument, shims, and
  the stage of any open dialogue, headed by the unanswered nodes in the
  ruling order that `/align` takes them in.
- Write the graph's rulings and recordings only through `/align`, the
  alignment dialogue with the author; write the implementation only
  through `/reconcile`, the reconciliation loop, whose main thread may
  also record a viable option on a fact and move a fact's recommendation
  within the node's scope, as its skill describes. Sessions divide by ref. Graph landings go straight to
  `origin/disposition` and implementation landings to `origin/greenfield`;
  no pull requests, and nothing is pushed to `main`.
- Commands, from this directory: validate,
  `node packages/disposition/validate.mjs disposition`; browser,
  `node packages/disposition/project.mjs disposition --out dist/browser/index.html`;
  alignment page, `... --alignment dist/alignment/index.html`; rules,
  `... --rules .claude/rules`; tests,
  `node --test packages/disposition/*.test.mjs`.
- Worktrees: a session that isolates itself branches from this checkout's
  head when `.claude/settings.json` sets `worktree.baseRef` to `head`
  (written by the author at the transition of 2026-09-03). A worktree has
  no `disposition/`: run graph commands at the root, or add a detached
  worktree of the graph inside it with
  `git worktree add --detach disposition origin/disposition`.
- The harness finds `/align` and `/reconcile` only when a session starts in
  this checkout.
