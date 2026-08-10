---
id: tactic-qa-main-node-terminal-declaration
kind: tactic
statement: >-
  /qa-main's node-lane escalation paths (AUTHOR, BARRIER, WAIT) declare no
  terminal disposition and write no graph state — they write job-dir markers and
  STOP — so every escalating qa-main pass strands its own session and leaves its
  node re-selectable until a downstream tier compensates; and the in-flight
  coverage ratchet records this path as already covered, so it would certify the
  gap as correct
owner: ai
status: raw
parent: null
rationale: >-
  Confirmed live 2026-08-09 by direct measurement of a complete incident, then
  by reading the shipped skill. THE INCIDENT: dispatch-tick selected
  tactic-graph-auto-merge-office-hours-gate (phase main-qa, office_hours null)
  at 19:16:32 and launched /qa-main at 19:16:53. The pass did its job correctly
  — it found the node's single needs-main residue item pre-marked
  `Verifiability: AUTHOR`, declined to decide it, and at 19:18:09 wrote
  office-hours-reason and office-hours-recommendation into its job dir via
  dispatch-mark-node-park, then went `state: done`. Its own transcript records
  the handoff it believed in: "no git writes needed from this session;
  dispatch-tick's terminal_without_disposition_sweep will read these markers and
  park the node via park-node on origin/main. Stopping here." Nothing landed.
  THE MECHANISM: .claude/skills/qa-main/SKILL.md contains ZERO occurrences of
  mark-node-terminal. Its three escalation branches each call
  dispatch-mark-node-park and then "**STOP**"; that script's own header states
  it writes only $CLAUDE_JOB_DIR markers and that "a later graph-native step
  reads these markers instead". transition-node is invoked at SKILL.md:303 and
  :361 — the clean-pass path only — and :292 states outright that it "runs only
  when *no* AUTHOR and *no* WAIT item remains". The single park-node mention, at
  :399, is PROSE describing terminal_without_disposition_sweep's own call, not
  an invocation by qa-main. So the escalation path declares nothing and writes
  nothing. THE COMPENSATING TIERS BOTH DECLINED, SILENTLY: at 19:31:03
  terminal_without_disposition_sweep found the corpse and ROUTED it to the
  invalid-state lane rather than parking (routed=1, "deferred, not parked;
  markers left intact") — correct by its own design, but its summary line
  reports `terminal=1 parked=0 ... deferred=0` because routed is deliberately
  omitted from that string to keep it stable for journald greps and test
  oracles. At 19:31:49 the lane ran: `candidates=1 intervened=0 kept=1`, the
  KEEP arriving as router exit 4 ("keep — positive evidence to do nothing this
  pass"). Net result 13 minutes after the pass ended: node still phase main-qa
  with office_hours null (hence re-selectable, and it had already burned one
  spawn), session still holding a worker slot and unreapable because
  lib-session-reap.sh gate 4 requires a node-terminal marker that was never
  written. A monitor landed the park by hand (commit 18a27870, using the
  session's own marker text verbatim) and reaped the session. THE SECOND,
  SHARPER DEFECT: tactic-qa-fix-node-terminal-declaration's "Corrected coverage
  table" carries the row `/implement, /qa-main | clean-pass, escalation | yes,
  via transition-node / park-node`. That is right for clean-pass and WRONG for
  escalation, and its Unit 1 builds a mechanical coverage ratchet from that
  table with expected counts including `qa-main=0` for mark-node-terminal — so
  landing that ratchet would freeze this gap into a passing test as intended
  behaviour. Filing separately rather than amending that node follows the
  precedent it set itself: it registered /dispatch-conflict Lane 2 as a reasoned
  GAP row and said "filing the Lane 2 fix as its own tactic is an
  author/office-hours follow-up, not this tactic's work".
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
# /qa-main's escalation paths declare no terminal disposition and write no graph state

## Context

Every other node-lane phase skill records its disposition and then closes.
`/dispatch-invalid-state` calls `mark-node-terminal <id> park` **after its
`graph-commit`**. `/dispatch-conflict` Lane 3 calls
`mark-node-terminal "$NODE_ID" conflict-hold` explicitly "so the session does not
hold". `/align-tactics` and `/qa-fix` call `mark-node-terminal … no-claim`.
`mark-node-terminal`'s closed enum already contains `park` for exactly this
shape.

`/qa-main`'s node lane is the exception. On its clean-pass path it does write the
graph itself (`transition-node "$N"`, then STOP). On its three escalation paths —
AUTHOR, BARRIER, WAIT — it writes marker files into `$CLAUDE_JOB_DIR` and stops,
writing neither the graph nor a terminal declaration. The asymmetry is inside one
skill, on adjacent branches.

The consequence is not a lost park in the ordinary sense. The park text survives
in the job dir; what is missing is any actor obliged to land it. The session
cannot be reaped (`lib-session-reap.sh` gate 4 needs a `node-terminal` marker),
and the node stays `office_hours: null`, so the selector may re-select it — the
"HELD and RE-SELECTABLE" churn loop that `lib-frozen-session-park.sh` describes
in its own header as the thing it exists to break, landing "the office_hours park
**the session itself owed**".

## Measured evidence — 2026-08-09

Target node: `tactic-graph-auto-merge-office-hours-gate`. Session `ef83a8a8`.

| time (EDT) | event |
|---|---|
| 19:16:32 | `dispatch-tick: graph 1 tactic-graph-auto-merge-office-hours-gate:tactic:main-qa` |
| 19:16:53 | `launched … /qa-main` |
| 19:18:09 | markers written via `dispatch-mark-node-park`; session `state: done` |
| 19:31:03 | `terminal_without_disposition_sweep`: `routed=1 kept-by-lane=0` — "deferred, not parked; markers left intact"; summary line reads `terminal=1 parked=0 observing=0 unmeasurable=0 deferred=0` |
| 19:31:49 | `invalid-state-sweep: candidates=1 intervened=0 kept=1` (router exit 4) |
| 19:35 | node still `phase: main-qa`, `office_hours: null`; session still held |
| — | monitor landed the park by hand (`18a27870`) and reaped the session |

Call-site counts read off the shipped `.claude/skills/qa-main/SKILL.md`:

| symbol | count | where |
|---|---|---|
| `mark-node-terminal` | **0** | — |
| `transition-node` | 2 invocations | `:303`, `:361` — clean-pass only; `:292` says it runs only when no AUTHOR and no WAIT item remains |
| `park-node` | 0 invocations | the one mention, `:399`, is prose describing the downstream sweep's call |
| `dispatch-mark-node-park` | 3 invocations | the AUTHOR, BARRIER and WAIT branches |

The bug-J detector (`find $CLAUDE_JOB_DIR -maxdepth 2 -name office-hours-reason`,
where any hit is by definition a park that did not land) fired correctly
throughout. It is the detection that works; the obligation is what is missing.

## Why the compensating machinery did not cover it

Two tiers exist below the skill and both declined, each defensibly:

1. `terminal_without_disposition_sweep` routed rather than parked. That is its
   documented pre-tier behaviour, and routed candidates are explicitly "DEFERRED,
   not resolved".
2. The invalid-state lane kept rather than intervened, on router exit 4 —
   "positive evidence to do nothing this pass".

Neither is a bug on its own reading. The gap is that the union of two correct
"not mine this pass" decisions is nobody, and the only actor with an
unconditional obligation — the session that made the judgment — was never given
one.

A related observability problem made this invisible rather than merely broken:
the KEEP is silent at all three layers (the router has six distinct `exit 4`
sites and surfaces no reason; the sweep's `4) KEPT=$(( KEPT + 1 ))` arm carries
no echo, unlike its neighbouring `ESCALATE_DEFERRED` arm which echoes the rc, and
unlike the cap branch whose comment reads "Deliberately NOT silent: a silent cap
reads as 'covered everything'"; and the summary names no node). That belongs to
tactic-invalid-state-lane-diagnostics-unobservable — recorded here as the reason
this went unnoticed, not re-diagnosed.

## Fix direction

**Greenfield.** `/qa-main`'s escalation branches should record-then-close like
every other lane: land the park with `park-node` (or the `hold-node` equivalent
where the class calls for it), then declare `mark-node-terminal <id> park`,
matching the ordering `/dispatch-invalid-state` already documents — the marker
after the graph write, never instead of it. The downstream sweep then becomes a
genuine backstop for crashes rather than the primary path for an ordinary,
successful escalation. This also closes the reap side for free: a declared
session is reapable by `dispatch-self-close` with no intervention.

Note the one real objection to weigh: the node lane deliberately forbids `gh` and
keeps sessions out of graph writes on some paths. `park-node` is a graph write,
so adopting it here is a scope decision, not a pure bug fix. The cheaper variant
— declare `mark-node-terminal <id> park` while still leaving the park itself to
the sweep — fixes the stranded session but leaves the node re-selectable, so it
addresses half the defect.

**Interim, and owed regardless of which direction wins.** Correct the coverage
row in tactic-qa-fix-node-terminal-declaration from "covered" to an explicit
reasoned GAP row, the pattern its Unit 1 already uses for `/dispatch-conflict`
Lane 2. Its ratchet encodes `qa-main=0` for `mark-node-terminal` as the expected
count; landing it unchanged would make this gap a passing assertion and much
harder to see later.

## Out of scope

- Re-diagnosing the invalid-state lane's silent KEEP — owned by
  tactic-invalid-state-lane-diagnostics-unobservable.
- The sweep's park lacking a CAS base — owned by
  tactic-terminal-disposition-sweep-park-without-cas.
- `dispatch-mark-node-park`'s browser-reachability rejection gate, which worked
  correctly here and is not implicated.
- The doctrine question of where reap authorization should live — owned by
  tactic-session-reap-authorization-durability and
  tactic-terminal-declaration-verified-against-node, both awaiting an author
  ratification.
