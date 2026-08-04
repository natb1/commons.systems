---
id: tactic-author-park-consent-vs-access
kind: tactic
statement: "Author-only parks must name the real gate: distinguish consent-gated
  from access-gated in the park reason, since a reason claiming missing IAM
  sends every future diagnosis down a dead end"
owner: ai
status: raw
parent: null
rationale: "Filed 2026-07-30 from the tactic-demo-saas-provision office-hours
  drain, with verified evidence. That node was parked 2026-07-10 asserting the
  blocker was 'owner/console IAM'. The drain disproved it: the author's owner
  credential was live and cached in the execution environment (firebase
  login:list returned the author account) and project-scoped reads succeeded
  throughout, so access was never missing. The real gate was consent, at two
  layers: (1) an agent must not create cloud resources on the author's account
  without explicit instruction, and (2) the Claude Code auto-mode classifier
  denied 'firebase hosting:sites:create' even AFTER the author granted
  permission, so the author had to run the commands in their own shell. An agent
  can therefore hold a valid grant and still be unable to act - a state no
  current park vocabulary expresses. Cost of the wrong framing, observed: the
  drain spent a full investigation re-deriving that IAM was not the blocker, and
  the same rediscovery is owed on every future author-provisioning park.
  Adjacent but NOT covering: tactic-mechanical-park-producers converts
  mechanical retry holds into blocked_by edges (a different axis - park-vs-hold,
  not reason accuracy). Likely shape: a park-reason convention or lint
  distinguishing access-gated from consent-gated, plus guidance that a
  consent-gated park records which of the two consent layers is outstanding."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Author-only parks must name the real gate: distinguish consent-gated from access-gated in the park reason, since a reason claiming missing IAM sends every future diagnosis down a dead end

Raw tactic awaiting an `/align-tactics` planning pass. Filed 2026-07-30 as a
byproduct of draining `tactic-demo-saas-provision`; deliberately **not** wired as
a `blocked_by` on that node, which is complete.

## The defect

An `office_hours` park asserts "no autonomous path forward exists — a human is
required". It does not currently have to say *why* the human is required, and the
one worked example got it wrong in a way that costs real time.

`tactic-demo-saas-provision` was parked 2026-07-10 claiming its blocker was
**owner/console IAM**. The 2026-07-30 drain disproved that:

- the author's owner credential was live and cached in the execution environment
  (`firebase login:list` returned the author account);
- project-scoped reads (`hosting:sites:list`, `apps:list WEB`) succeeded with no
  escalation.

Access was never missing. The gate was **consent**, and it turned out to sit at
two independent layers:

1. **Human layer** — an agent must not create cloud resources on the author's
   account without an explicit instruction.
2. **Harness permission layer** — the Claude Code auto-mode classifier denied
   `firebase hosting:sites:create` *even after the author granted permission*.
   The author ultimately ran both commands in their own shell.

Layer 2 is the non-obvious one: **an agent can hold a valid grant and still be
unable to act.** No current park vocabulary expresses that state, so a drain that
receives a grant has no way to record why the grant was insufficient.

## Why it is worth fixing

The wrong framing is not inert. Diagnosing an access-gated park means checking
IAM; diagnosing a consent-gated one means checking whether consent exists at both
layers. A reason that says "needs IAM" sends every future diagnosis down the
first path. The 2026-07-30 drain spent a full investigation re-deriving that IAM
was not the blocker, and the same rediscovery is owed on every future
author-provisioning park until the vocabulary distinguishes the two.

## Scope sketch (for the planning pass, not a plan)

- A park-reason convention distinguishing **access-gated** (credential/permission
  the author holds and the lane does not) from **consent-gated** (the lane could
  act but must not, or is refused by the harness).
- For a consent-gated park, record **which layer** is outstanding — human grant,
  harness permission, or both.
- Consider whether this is lintable, or guidance only. Note the existing park
  producers as call sites.

## Adjacent, and why it does not cover this

`tactic-mechanical-park-producers` converts mechanical retry holds into
`blocked_by` edges against a tracked fix tactic. That is the **park-vs-hold**
axis: whether a park should exist at all. This node is the **reason-accuracy**
axis: given that a park legitimately exists, whether its stated cause is true.
They are independent.
