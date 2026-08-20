---
id: tactic-detached-driver-owed-tick-sweeps
kind: tactic
statement: Settle, as doctrine rather than per-driver improvisation, which
  out-of-session tick sweeps a detached single-node driver owes, and what it
  means for a one-node driver to take fleet-wide park actions on nodes it was
  never pointed at
owner: ai
status: raw
parent: null
rationale: "Surfaced by PR #3073 Units 6 and 11 while unblocking the first
  /dispatch-ladder end-to-end run, and filed because the decision taken there is
  correct for that driver but was reasoned from first principles at the call
  site rather than from a recorded rule. Two dispositions in the dispatch
  harness are deliberately made OUT of the session that earned them:
  reservation_sweep releases a spawn marker whose reserving session is dead, and
  terminal_without_disposition_sweep parks the node of a phase session that
  escalated by writing an office-hours-reason file and deliberately declaring no
  node-terminal marker. Both run today only from a dispatch heartbeat. Every
  skill that escalates is written against the assumption that a heartbeat will
  clear up after it, and for a detached driver on a host whose heartbeat is
  stopped -- the bootstrap-deadlock case /dispatch-ladder exists to serve --
  that assumption is simply false, so the driver owes both sweeps itself. That
  much is settled. What is NOT settled, and is this node's actual subject, is
  the consequence: terminal_without_disposition_sweep takes no node filter, so a
  driver invoked on ONE node walks every escalated session in the fleet and can
  park nodes it was never pointed at. PR #3073 decided deliberately not to scope
  it down -- narrowing to the driver's own node would silently drop every other
  node's escalation for as long as the heartbeat stayed down, defeating the
  reason the call exists -- and documented that a reader WILL see the driver
  take park actions on unrelated nodes. That reasoning is sound and should not
  be re-litigated per driver; it should be doctrine on the strategy, with the
  general rule stated for the next detached caller rather than re-derived. The
  budget half is the same shape: the tick's park caps are sized for a 15-minute
  tick period (park_max=2 x park_timeout=120s + lock_wait=60s, up to 300s) which
  a driver reporting against a --max-run-s wall clock can overshoot by minutes
  in a single pass, so the driver supplies smaller per-pass defaults through the
  library's existing seams. Also unstated as a general rule: whether a caller
  may lower a sweep's per-pass budget is a question about the sweep's contract,
  not about one driver."
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
# Settle, as doctrine rather than per-driver improvisation, which out-of-session tick sweeps a detached single-node driver owes, and what it means for a one-node driver to take fleet-wide park actions on nodes it was never pointed at

## Provenance

PR #3073 (merge `3fea9f35`), Units 6 and 11, while unblocking the first
`/dispatch-ladder` end-to-end run. This node records a **doctrinal gap**, not a
defect in that PR: the decision taken there is right for that driver, and the
code is not what needs changing. What is missing is the general rule, so the
next detached caller does not re-derive it — or, worse, derive it differently.

## The two out-of-session dispositions

Two dispositions in the dispatch harness are deliberately made *outside* the
session that earned them:

| Sweep | Home | What it disposes |
|---|---|---|
| `reservation_sweep` | `lib-reservation-ledger.sh` | releases a spawn marker whose reserving session is dead, or whose worktree already has a live worker |
| `terminal_without_disposition_sweep` | `lib-frozen-session-park.sh` | parks the node of a phase session that ESCALATED — wrote `$CLAUDE_JOB_DIR/office-hours-reason` and, deliberately, no `node-terminal` marker |

The second is load-bearing across every node-lane skill:
`qa-fix/SKILL.md:203-210`, `fix-checks/SKILL.md:117-123`,
`review-fix/SKILL.md:197-199`, `implement/SKILL.md:137-143` all escalate this
way. Each is written against the assumption that a heartbeat will come along
and clear up after it.

Both sweeps run today only from a dispatch heartbeat (`dispatch-tick:509-516`,
`:799-800`).

## The settled half

For a detached driver on a host whose heartbeat is **stopped** — exactly the
bootstrap-deadlock case `/dispatch-ladder` exists to serve — "the next tick
will clear it" is false. So the driver owes both sweeps itself, and runs them
verbatim: no wrapper, no variant policy, once before every advance
(`dispatch-ladder-run:700-742`).

The failure modes if it did not are concrete, not hypothetical:

- **Without `reservation_sweep`**: `dispatch-ladder-advance` writes an
  `origin=explicit` marker before each spawn (`:218`) and REFUSES with exit 13
  when one already exists (`:155-161`). Nothing else in the process releases
  it, so the driver's own previous step deadlocks its next one.
- **Without `terminal_without_disposition_sweep`**: an escalating phase leaves
  a job `dispatch-self-close` HOLDs for want of a `node-terminal` marker
  (`dispatch-self-close:48-101`), which `dispatch-ladder-await` reads as
  `done-held` → `throw <id> held-session` (`:322-334`), with the node left
  unselectable because `worktree_has_live_session` is name-keyed. A silent
  wedge instead of a readable halt.

Neither sweep is a gate the driver adds. It contributes no reclaim rule and no
park rule of its own — it only makes the tick's own sweeps run on its own
cadence. **Sequencing, not gating.** A driver that cleared markers by hand
would be re-implementing the claim discipline it depends on.

## The unsettled half — this node's actual subject

### 1. Fleet-wide scope from a one-node caller

`terminal_without_disposition_sweep` takes **no node filter**. A driver invoked
on ONE node walks every escalated session in the fleet and can park nodes it
was never pointed at.

PR #3073 decided deliberately not to scope it down, and the reasoning is sound:
narrowing to the driver's own node would silently drop every other node's
escalation for as long as the heartbeat stayed down, which defeats the reason
the call exists at all. It also documented the consequence plainly, so a reader
watching a "one node" driver take park actions on unrelated nodes does not file
it as a leak (`dispatch-ladder-run:59-67`).

But that is a decision recorded in **one driver's header comment**. The general
question — *when may a narrowly-scoped caller take fleet-wide dispositional
action, and what does it owe the operator in visibility when it does?* —
belongs on the strategy, stated once, not re-derived by the next detached
caller. Two callers deriving it differently is the failure this node prevents.

### 2. Whether a caller may lower a sweep's per-pass budget

Same shape. The tick's park caps are sized for a 15-minute tick period:
`park_max=2` × `park_timeout=120s` + `lock_wait=60s`, up to 300s, tolerable
buried inside a tick. A driver that reports progress on a `--poll-s` cadence
against a `--max-run-s` wall clock can overshoot that wall clock by minutes on
a single pass.

Unit 11 handled it correctly — smaller per-pass defaults supplied through the
library's **existing seams** (`lib-frozen-session-park.sh:150-167`), each
written `${VAR:-default}` so an inherited environment override still wins, plus
a second `check_deadline` after the sweeps so a pass whose sweeps ran to the
deadline does not then START an advance (`dispatch-ladder-run:744-754`). A
bound on how long ONE pass may spend, not a change to what gets parked or when:
the sweep runs every pass, so a lower per-pass cap catches up over subsequent
passes rather than dropping work.

The general rule is still unstated. *May any caller lower a sweep's per-pass
budget, and under what invariant?* The answer here rests on "the sweep runs
again next pass, so lowering the cap defers work rather than dropping it" —
which is a property of **this** call pattern, not of the sweep's contract. A
caller that ran the sweep once would silently drop work under the same
reasoning.

## Scope

Doctrine on `strategy-graph-native-dispatch`, plus whatever contract text the
two sweep libraries need to state their own budget and scope guarantees.
Explicitly **not** a change to `/dispatch-ladder`'s behaviour: that driver is
the worked example, and reversing its choices is not what this node is for.
