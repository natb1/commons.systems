---
question: What questions for the author does a node carry, and where are they asked?
stage: periagogic
form: rule
under:
  - commons.systems/disposition-graph/dialogue
---
## Disposition

The author, 2026-09-04, stopping the eleven clean-context readings of that day
and granting the reconciliation of this disposition before they are restarted
and before the survey:

> stop these reviews. before restarting these reviews, before survey, progress this disposition to survey ready and you have bootstap authority to reconcile it (for pending reviews):
> make sure we are recording as part of dialogue state of the node: a list of questions for the author needed to disambiguate author intent and make AI recommendations for each of the facts. questions are collected during periagoge, review, survey, and when processing confirmation kickback, or at any point during alignment diologue, review, reconciliation or rsi when reconsidering recorded AI recommendations. These questions feed the meiutic. If review produces questions then it necessarily kicks back to the meiutic. These questions are not presented in the alignment ui, they are presented in the meiutic session.

## Account

Recorded the turn the author said it, before anything was drafted from it, as
the checkpoint node requires. The disposition amends
`commons.systems/disposition-graph/dialogue`, which says what a node carries
while no ruling grants it, by adding a part the state does not have: the
questions for the author that the AI needs answered to disambiguate intent and
to recommend on each fact. It is an aspect of the dialogue's state and
therefore a node under it, as `dialogue#aspects-are-nodes` says.

The periagogic object, to be read before anything is changed: the `dialogue`
node, for what the state holds today and what its `facts` encoding admits; the
`recording` node, for what a movement writes; the `clean-context-review` and
`frontier-consistency` nodes, for what the two readings return and what the
applying step writes, since the disposition makes a reading's questions force a
kickback; the `alignment-page` node, for what the author's ruling screen shows,
since the disposition says the questions are not shown there; the `unanswered`
and `authority` nodes, for what a movement back to the maieutic stage means;
the `rsi` node, named by the author's words as one of the moments questions are
collected; and, in the implementation, the reader and the validator in
`packages/disposition/`, the alignment page and the frontier in
`packages/disposition/project.mjs`, the review's brief generator and applying
script in `packages/clean-context-review/`, and the three skills that run the
movements.
