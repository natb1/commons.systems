---
name: align-review
description: The clean-context review of one draft. Invoked by node id the moment that node's recommendation is recorded or moved in substance, it reads that draft against its neighbourhood in one fresh context and either forwards it to the author's ruling or kicks it back with findings. The reader writes nothing; the invoking session validates every finding against the record before any is applied. Bootstrap shim declared on review-skills; the graph wins on conflict.
---
# Align review

> **Shim notice (declared 2026-09-04 on `review-skills`).** This file is the
> hand-written projection of the review of a draft as a skill of its own,
> written from the nodes `clean-context-review` (how the reading is run and
> what its reader is given), `recording` (what the reading judges),
> `review-skills` (the division of the review into two skills over one
> package, and what this file carries), and `review-model` (the model and the
> effort the reading runs on) of `commons.systems/disposition-graph`, none of
> them carrying a ruling and all of them therefore unanswered, and from the
> author's words quoted on them, among them the grant of 2026-09-04 under
> which this file was written before the author ruled. It has no authority of
> its own: where it differs from the graph at `origin/disposition`, the graph
> wins and the difference is recorded as an un-aligned disposition on the node
> it differs from. Liquidation: the projector materializes this skill from
> ratified nodes and this hand-written file is deleted.

`/align-review <node id>` is the review of one draft. Its object is that
node's recommendation, and it runs the moment the recommendation is recorded
or moved in substance, which is the node's transition to the review stage: an
alignment sitting invokes it on the node it drafted, and the author or a
session invokes it on any node at that stage. It alone forwards a node to the
ruling stage, and two of its runs never wait on each other.

The survey of the frontier is `/align-survey`, a skill of its own, and nothing
of it is here.

## 0. Currency

1. Fetch `origin/disposition`; the nested worktree `disposition/` must be at
   it with a clean tree, except a sitting's own uncommitted drafts when
   invoked from a sitting. Run
   `node packages/disposition/validate.mjs disposition`.
2. Read `clean-context-review`, `frontier-consistency`, `review-skills`, and
   `review-model` at their current text. What a clean-context reading is, and
   the instruction text common to both readings, live there and not here;
   where a node differs from this file, follow the node and record the
   difference as an un-aligned disposition on it.

## 1. The draft, and what its reader is given

The node named on the command line, at `stage: review`. It alone receives a
verdict.

Its reader is given, from the record and never from a set the session names:
the node whole; the chain of nodes above it; the rules that bind everywhere;
its siblings under the same parent, which the checkpoint has landed; the nodes
it names; the author's words on each; and the index of every question the
record asks, with its class, its stage, its standing answer, and the options
on its answer fact, so that a draft answering a question the record already
asks is caught at the draft (`clean-context-review`). It runs validations 1 to
6 and 15 of `frontier-consistency`, judges whether every option on the node's
facts is viable and whether a viable one is missing (`recording`), and returns
the strongest counter-argument with its strength.

`node packages/disposition/project.mjs disposition --frontier -` lists every
node with its stage, its class, what its facts recommend, and its review and
survey state. A node is ready for the author's ruling when it carries a
forward verdict pinned to the recommendation as it stands and a survey pin on
the same; this reading gives the first of the two.

## 2. The brief

`node packages/clean-context-review/brief.mjs --node <id> [--date YYYY-MM-DD]
[--dry]` writes `tmp/review/draft-<slug>.brief.md` from `brief-draft.md` in
that package, and names `tmp/review/draft-<slug>.json` as the reader's output
file. It computes no model and prints none (`review-model`).

The brief carries the validations this reading runs, the viability judgment,
the judging criteria from `recording`, and nothing of the session: no draft of
the reply, no account of the sitting, no verdict hoped for. `tmp/` is
gitignored scratch.

## 3. The reader

Launch one subagent with the Agent tool: type `general-purpose`, model
`fable`, effort high — the model and the effort `review-model` fixes for this
reading, stated here and never argued in a brief. Never a fork: a forked
context carries the session's framing and is not clean. The prompt: "Read and
follow `<the brief the previous step wrote>` exactly; you are a clean-context
reviewer with no context but the record; never run state-changing git; write
only the output file the brief names."

Read the result's conclusion, never its transcript. A reader that fails is
relaunched once with the same brief; a second failure is reported and the node
stays at its stage. When `brief.mjs` warns that the brief may exceed what one
reader holds, ask the reader to report what it could not read, and treat an
unread part as a gap in the reading rather than as a finding of nothing.

## 4. Validate, then apply

1. Read `tmp/review/draft-<slug>.json`: the node's verdict, its findings, its
   facts check, its viability judgment, and its counter-argument with the
   strength. Validate every finding before any is applied, on this thread and
   never delegated (the author, 2026-09-03, quoted on
   `clean-context-review`): open the node, check that the text the finding
   quotes is there and says what the finding says, that the claim about the
   record or the implementation is true, and that the stage or edit it
   recommends follows from the doctrine it cites. Record the validation as the
   session's reply in `tmp/review/replies.json`, `{ "<id>": "<reply>" }`:
   which findings the session accepts and what it amends for them, which it
   rejects and why, and why the disposition stands against the
   counter-argument or what changes for it. A rejected verdict or stage is
   held by `tmp/review/overrides.json`, `{ "<id>": "<stage>" }`; the finding
   is still recorded on the node with the reply, as the dialogue's history,
   and the author sees both on the alignment page. Nothing is applied
   unvalidated.
2. `node packages/clean-context-review/apply.mjs tmp/review/draft-<slug>.json
   --replies tmp/review/replies.json [--overrides tmp/review/overrides.json]
   [--date YYYY-MM-DD]`. It reads the reading from the file's own `scope`,
   verifies that the node is at the review stage, and appends
   `### Clean-context review, <date>` to `## Account` (creating the section
   when absent) with the verdict, the findings, the facts check, the viability
   judgment, the counter-argument with its strength, and the reply. On
   `forward` it sets `stage: ruling` and writes `review` with `verdict`,
   `strength`, `date`, `against`, and `of`, the pin of the recommendation
   read, which goes stale when any fact's recommendation moves; on `kickback`
   it sets the stage the reader named and writes the same. What the
   counter-argument is for: the alignment page carries it, with the strength
   this reading gave it, on the recommended option's row, in place of the case
   against the session wrote when it recorded the recommendation, and the
   reply sits one step down in that option's drill-down (`alignment-page`).
   The viability judgment marks and never removes: an option the reader no
   longer holds viable is marked passed over with its reason and stays on the
   list, and a viable option the reader named is added with the prose it gave
   (`prose-and-structure`). An override wins on the stage. Nothing else in the
   node is touched — the `## Recommendation` fence, the rulings, and what each
   fact recommends least of all.
3. The session's judgment after the apply. Amend the node where the reply says
   the session accepts a finding; a finding about another node — a duplicate
   question, an option that belongs elsewhere, a merge or a split — is written
   in prose by the reader and recorded by the session, and this reading
   changes no other node's stage. When the amendment changes substance, set
   the node back to `stage: review` and run this reading again (`recording`);
   the frontier flags a review whose pin no longer matches what the node
   recommends. The earlier reading's subsection stays in the account as the
   dialogue's history.

## 5. Land

`node packages/disposition/validate.mjs disposition`; from `disposition/`,
commit the node with the message `review: <node slug> <date>` and the trailers
the harness asks for, `git push origin disposition` (fetch, rebase, and push
again on rejection); then rebuild and republish the alignment page as the
alignment skill's §4 says. When invoked from a sitting, the sitting lands with
its own round instead, at its next stage transition (`checkpoint`).

## Model and delegation

This reading runs on `fable` at high effort. The rule is `review-model`'s,
stated there and cited here, and §3 is where the launch names it; nothing in
this file computes a model and no brief argues one. The orchestration runs on
whatever model invoked this skill; the validation of the findings, the
replies, the overrides, and what is put to the author from a finding are the
session's judgment and are never delegated (`delegation`).
