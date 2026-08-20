---
id: tactic-align-tactics-immaterial-drift-redirect
kind: tactic
statement: Redirect /align-tactics' immaterial drift observations from a
  strategy clarifications write to a born-parked observation node, so no
  autonomous lane edits durable-layer substance
owner: ai
status: raw
parent: null
rationale: Ruled 2026-08-14 as violation V1 of the autonomous-substance
  invariant. The Side-B immaterial path writes dated clarifications onto a
  strategy with no human, which mutates strategyFingerprint and soft-freezes
  every open child for an observation defined as gating nothing; makes
  /align-tactics a second requirement-entry surface that
  strategy-discovered-requirements reserves to the interview; and collapses
  provenance, since a model-authored dated clarification is indistinguishable
  from an author-ruled one. The redirect preserves non-interruption — a
  born-parked node does not interrupt either — so nothing of the original
  requirement is lost.
reading: null
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
# Redirect /align-tactics' immaterial drift observations from a strategy clarifications write to a born-parked observation node, so no autonomous lane edits durable-layer substance

## Draft context (2026-08-14 /align correction round)

Doctrine home: `strategy-graph-native-dispatch`, the clarification "Which lanes
violate the autonomous-substance invariant today" — this is **V1**.

### Current behaviour, verbatim

The two-sided drift review in `.claude/workflows/align-tactics.js` splits Side B
on `plan_depends`:

- **Material** (`plan_depends=true`) → emit `unrecorded_premises` with a
  `proposed_clarification` **and park for author ratification**, `proceed=false`.
  Correct, and unchanged by this tactic.
- **Immaterial** (`plan_depends=false`) → "Land it as a dated clarification
  (`clarifications_to_add`) WITHOUT interrupting; do not park for it." Applied at
  `.claude/skills/align-tactics/references/write-path.md`, the
  immaterial-observation path, which lands each entry as a dated `clarifications`
  entry on the strategy.

`/align-tactics` is autonomous by its own description — "never `AskUserQuestion`
mid-run".

### The three harms

1. `clarifications` is member two of `strategyFingerprint`'s allowlist
   (`packages/intentionsutil/src/router.ts:102-112`), so the write **soft-freezes
   every open child** of that strategy — a real cost paid for an observation
   defined as gating nothing.
2. It is a **second requirement-entry surface**.
   `strategy-discovered-requirements` reserves requirement entry to the `/align`
   interview; `clarifications` is the same field the interview writes into.
3. **Provenance collapses irreversibly.** A model-authored dated clarification is
   byte-indistinguishable from an author-ruled one. No later reader — including
   the decomposer on its next round — can tell them apart.

### Scope

- Replace `clarifications_to_add` with an observation node: one born-parked
  `tactic-*` node per immaterial observation, `phase: null`,
  `office_hours: {reason, since}` set at creation, `serves` naming the strategy.
  Same recipe `/align` already uses for a deferral review item.
- **Name the strategy id in the node's `statement` or body** — the coverage
  sensor derives frontier linkage by matching that id, so an item that only
  alludes to the strategy is invisible to it.
- `proceed` stays `true`. The round runs on uninterrupted.
- Update the workflow's output schema and the Side-B prompt block together, plus
  the `write-path.md` application step.

### This OVERTURNS a standing author ruling — read it before implementing

**Recorded 2026-08-15, after the pre-commit adversarial review caught that the
2026-08-14 draft reversed a prior ruling without noticing.**

`strategy-graph-native-dispatch` carries a clarification **recorded 2026-07-28
from an author interview** stating the opposite of this tactic: *"Standing
requirement: a per-node tactic-target session MAY append clarifications entries
to the serving strategy, and may touch NOTHING else on it."* It is now amended in
place with an `OVERTURNED 2026-08-15` prefix pointing at V1.

That ruling was **correct on its own premises**, and the premise is what changed.
Its decisive argument was that the doctrine left immaterial observations with
**no legal destination at all** — `write-path.md` said write them to the
strategy, `tactic-target.md` forbade any strategy write, and the autonomy
contract closed the park escape because an immaterial observation is none of its
three park conditions. Forced to choose between dropping the observation and
writing the strategy, it chose writing. **The born-parked observation node is a
legal destination, so the forced choice dissolves.** This redirect therefore
*satisfies* the 2026-07-28 concern rather than overriding it: nothing is dropped,
and the sole-carrier condition still holds.

**Consequence for an existing node.**
`tactic-align-tactics-per-node-clarifications` is the implementation of the
overturned ruling. Its unit A widens the write authority this tactic removes, and
its unit B hardens `DRIFT_SCHEMA.clarifications_to_add`, which this tactic
deletes. It is **parked by the 2026-08-15 round** as doomed-as-written. But its
**second finding survives and is owed by this node**: `DRIFT_SCHEMA` declares
`clarifications_to_add` items as `{answer}` only with
`additionalProperties: false`, while the `Clarification` interface requires
`{question, answer}` — so the instruction was never mechanically executable. The
replacement observation-node schema must not repeat that mismatch.

### Why redirect rather than carve out

An append-only exception — autonomous may append to list-substance
(`clarifications`, `serves`, `tooling_goals`, `attributes.conditions`) but never
rewrite scalar-substance (`statement`, `success_signal`), mirroring
`node-merge.ts`'s `LIST_FIELDS`/`SCALAR_FIELDS` split — was drafted as the
alternative and **declined**. The redirect makes the invariant hold outright,
with no exception to remember. (Note: that carve-out is *materially the same
authority* the 2026-07-28 ruling granted, which is why declining it is the
overturn described above and not merely a fresh design choice.)

The steelman for the current design is "do not interrupt the round", and it is a
good requirement. It is fully preserved: **a born-parked node does not interrupt
either.** Non-interruption was achieved by not parking the *strategy*; it never
required writing *to* it.

### Not measured

Volume. Nobody counted how many `clarifications_to_add` entries actually land per
round, so the office-hours cost of this redirect is unknown. If the queue proves
noisy, that is evidence the immaterial path should be **deleted** rather than
redirected — the author considered and declined deletion on the grounds that the
decomposer reads the strategy harder than any other reader and discarding what it
notices is a real loss.
