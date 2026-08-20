---
id: tactic-rsi-intervention-special-cases
kind: tactic
statement: Extract the shared evaluation core and make the four invalid-state
  lanes special cases of it — each a thin selector over core plus lens catalog
  plus the one write surface, adding a variance-debugging lens and a closed
  remediation list declared in its own frontmatter
owner: ai
status: raw
parent: null
rationale: "Drafted 2026-08-14 by the second /align round of that date, carrying
  that round's core/special-case ruling, its assurance-independence condition,
  its author-owned remediation-list condition, and the four-lane scope decision.
  Cross-cutting serves is honest rather than nearest-fit, and follows the same
  split as tactic-rsi-session-sweep-trigger: the EVALUATION CONTRACT — what the
  core is, what a special case may add, and the independence bound — is owned by
  strategy-recursive-self-improvement, while the ARTIFACTS changed are the four
  intervention skills under .claude/skills/, which are dispatch-surface
  artifacts owned by strategy-graph-native-dispatch."
reading: null
serves:
  - strategy-recursive-self-improvement
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by:
  - tactic-rsi-lens-catalog-decomposition
  - tactic-finding-search-all-producers
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# Intervention lanes become special cases of the evaluation core

Drafted 2026-08-14 by the second `/align` round of that date, on author ruling.
The doctrine is recorded on `strategy-recursive-self-improvement` — its
core/special-case condition, its assurance-independence condition, and its
author-owned-remediation-list condition — and on
`strategy-graph-native-dispatch`'s clarification *"The four invalid-state
intervention lanes become special cases of the evaluation core"*. Read those
first; this body carries only what an implementing session needs that the
conditions do not spell out.

## The shape

A **session** = the shared core + its lenses + a **closed remediation list
declared in its own frontmatter**.

- The **core** reviews a completed unit of harness work plus its outcome
  evidence, runs the lens catalog, and records findings through the one
  find-or-recur write surface. The core itself never acts.
- **`/rsi`** is the degenerate case: an empty remediation list, record-only,
  behaviourally unchanged from today.
- The **four invalid-state lanes** each add the variance-debugging lens and
  their own enumerated remediations:

| lane | invalid state | declared remediations |
|---|---|---|
| `dispatch-invalid-state` | node held by a terminal, undeclared worker (5 kinds) | complete a verified missed disposition (`transition-node`); reap (`dispatch-node-reap`); park (`park-node`) |
| `dispatch-conflict` | a conflict on any of its three lanes | resolve the conflict on that lane |
| `fix-checks` | failing CI checks on a draft PR | fix the failing checks |
| `dispatch-diagnose-main` | `origin/main` red | **none** — record-only |

`dispatch-diagnose-main` with an empty list is the worked case: the model
degrades to `/rsi` rather than needing an exception. A lane with no declared list
may only record.

## What must not change

The merge changes what a lane's **body** is made of, never its **session
contract with the router**. Three properties survive intact:

1. A lane spawned `--name <node-id>` is a graph-node worker in the Stop hook's
   eyes (`.claude/hooks/dispatch-stop.sh`) and owes **exactly one**
   `mark-node-terminal` disposition on every terminal path — declared as the
   *last* durable action, since `Stop` fires on every turn yield. Omitting it
   makes `dispatch-self-close --node` hold the job forever, freezing the node the
   session was sent to unfreeze.
2. `dispatch-invalid-state-route`'s exit-code contract (0 handled, 4 keep, 10
   escalate, 1 router failure treated as escalate, 2 usage), its per-node attempt
   cap and its sidecar stay the **router's** — neither read nor written by the
   lane.
3. The kind table fixing `terminal-session` and `frozen-session` to the human
   class (→ `park-node`, never `hold-node`) stays authoritative.

This is the sharpest contrast with `/rsi` and it must be written down where an
implementer will see it: **nominal `/rsi` is fire-and-forget, claims nothing and
gates nothing; a special case is router-spawned, claims the node, and its exit
code routes the router.** Same core, opposite session contracts.

## Independence is a mechanism, not a hope

A special case never evaluates its own session — it reviews a *prior* completed
unit (a dead session, a failing CI run). Its own conduct is reviewed later by an
independent nominal evaluation, because the lane-agnostic sweep is session-keyed
and an intervention session's own `<stem>.dispatch-stamp.json` sidecar is swept
exactly like any other. **If that sweep ever stops covering intervention
sessions, the assurance-independence bar breaks and the merge must be re-derived
rather than defended.** A test should pin this.

## The enforcement gap this round did not close

The remediation list is **author-owned**: the model may recommend an addition
with measured justification and never writes one. But the list lives in skill
frontmatter, in files ordinary dispatch implement phases edit routinely — so
"author-owned" needs a gate (a lint, a review rule, or a hook) that the recording
round specified as **owed** rather than built. **This node owes it.** Without it
the condition is prose, and the capture shape it guards against is the quiet one:
unlike a mis-prioritization (visible in the queue) or a raised threshold
(invisible because it produces no findings), a widened remediation list is
invisible because it produces only *more acts that look sanctioned*.

## Dependencies and adjacent nodes

`blocked_by` is honest, not defensive:

- `tactic-rsi-lens-catalog-decomposition` — the core's lens half. That node
  already rules that every lens becomes its own `/rsi-lens-*` skill declaring its
  carrier in frontmatter, with `/rsi` and `/rsi-audit` reduced to thin selectors
  over the catalog. The variance-debugging lens is **one more catalog entry**;
  the four special cases are **four more thin selectors**. No parallel
  "common core" mechanism is needed or wanted.
- `tactic-finding-search-all-producers` — the core's recording half.

Adjacent, not blocking:

- `tactic-invalid-state-skill-per-kind` — its ruling (each invalid-state kind
  carries its own skill body while the shared three-tier ladder stays written
  down exactly once) is the same "written once" discipline at a different layer.
  Subsumed rather than contradicted; reconcile the two bodies when this lands.
- `tactic-rsi-session-sweep-trigger` — **unchanged** by this node. The sweep
  still evaluates all six unattended lanes' sessions. What changes for the four
  is that the invalid state *itself* additionally fires them router-side and
  unconditionally, as an outcome-family signal.

## What this is expected to save

One review of the corpse instead of two, and one writer instead of two — **not**
one session instead of two in perpetuity. Today, when node `N` is stranded by a
terminal undeclared worker `C`: `/dispatch-invalid-state` digests `C`'s
transcript and files a cause-keyed follow-up, *and* the sweep independently
evaluates `C` as an ended session that halted. After the merge `C` is reviewed
once, and the intervention session is swept later as a different object. State
this correctly in the qa evidence — the naive reading ("two sessions become one")
would make the `sessions per invalid-state episode` reading look falsified when
it is being met.

## Verification the recording round could not do

`aggregate-usage.sh` grouping sessions into an **episode** was *not* verified. If
the instrument cannot express one, the `success_signal` reading degrades to
sessions-per-node-per-day, which is readable today. Establish which before
building the sensor.

## Owed: register the three new readings, prose and constant in one PR

The recording round added three readings to
`strategy-recursive-self-improvement`'s `success_signal` — one find-or-recur
write surface, one session per invalid-state episode, zero remediation acts
outside a declared list — and named their instruments in the **observable**
rather than in `success_signal.sensor`. That was forced, not preferred.

`success_signal.sensor` on that node is a **registry key**:
`read-sensors.ts` matches the whole string against its registered `Sensor`
names, where this node's is `RSI_SENSOR_NAME`. Appending to the field
de-registers the rsi sensor, and `validate-graph.ts` now refuses on exactly that
(`Registered sensor name(s) not recorded by any node's success_signal.sensor`).
`graph-fast-path.yml` runs `validate-graph` on the graph write path, so **both**
landing orders break main: prose-first leaves a registered name no node records,
constant-first leaves a node whose sensor matches nothing. `graph-commit`
rebuilds on an `intentions/`-only base and strips non-intentions changes, so it
cannot land the two halves together.

**A pull request can.** This node owes one that lands, atomically:

1. the appended `success_signal.sensor` prose on
   `strategy-recursive-self-improvement`;
2. the matching `RSI_SENSOR_NAME` constant in
   `packages/intentionsutil/scripts/read-sensors.ts`;
3. the three instruments themselves — the mint-or-reuse write-path lint, the
   decision-log-against-declared-list check, and the aggregate-usage.sh
   episode reading (establish first whether that instrument can express an
   "episode"; if not, the reading degrades to sessions-per-node-per-day).

Verify with the `unregistered sensors` **counter**, never the `readings:`
fraction — a de-registered sensor keeps its last written reading forever, so the
fraction proves nothing.

This is a fresh occurrence of the class defect already on the graph as
`tactic-eval-finding-sensor-registry-key-prose-drift` (a code constant coupled to
interview-editable prose). Record it as a recurrence there rather than minting a
new finding.
