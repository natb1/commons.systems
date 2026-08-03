---
id: tactic-terminal-sweep-inflight-keep-signal
kind: tactic
statement: terminal_without_disposition_sweep's only liveness signals are
  transcript idle time and the stand-down interlock; whether a terminal job
  row's inFlight field reliably zeroes at session end (a safe additional
  keep-signal) or goes stale non-zero (unsafe to gate on) is unmeasured, leaving
  an open question about whether the sweep can park a node whose worker yielded
  the turn with background work still running
owner: ai
status: raw
parent: null
rationale: "Filed 2026-07-31 by /review-fix on PR #3004
  (tactic-phase-terminal-requires-disposition), classified Deferred (code-review
  residue phase, finding residue-6): terminal_without_disposition_sweep
  (lib-frozen-session-park.sh:613) defaults
  DISPATCH_TERMINAL_DISPOSITION_GRACE_S to 300s versus 900s for the sibling
  frozen_session_sweep. A code-review finding raised the case of a session that
  yielded the turn with background subagents/Workflows still running --
  dispatch-self-close's HOLD invariant exists precisely for that shape, and such
  a job stays in the registry. Long fan-outs (e.g. /review-fix's own Workflow)
  routinely exceed 5 minutes with no writes to the parent transcript. Sampling
  live ~/.claude/jobs/*/state.json during this review pass showed those sessions
  report state: working (with inFlight: {tasks: 1, kinds: [\"local_workflow\"]}
  and selfWake: true) or state: blocked, never a terminal state -- so on current
  daemon behavior they are not sweep candidates and the concern does not fire
  today. No terminal-state job dir was available to sample during this pass, so
  the underlying question -- does inFlight reliably zero out once a session
  actually ends -- stayed open, which is why it was not applied inline."
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
# terminal_without_disposition_sweep's only liveness signals are transcript idle time and the stand-down interlock; whether a terminal job row's inFlight field reliably zeroes at session end (a safe additional keep-signal) or goes stale non-zero (unsafe to gate on) is unmeasured, leaving an open question about whether the sweep can park a node whose worker yielded the turn with background work still running

## Provenance

- **Source**: `/review-fix` on PR #3004 (`tactic-phase-terminal-requires-disposition`), 2026-07-31.
- **Location**: `.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh:613`.
- **Disposition**: classified `Deferred` (code-review residue phase, finding `residue-6`) — a valid finding, out of scope for PR #3004, needing further measurement before a fix is safe to apply.

## Failure scenario

`terminal_without_disposition_sweep` parks a node once its worker's registry
row is terminal and its transcript has been idle for
`DISPATCH_TERMINAL_DISPOSITION_GRACE_S` (default 300s). Its only liveness
signals are the transcript mtime and the stand-down interlock. The grace
default is 300s, versus 900s for the sibling `frozen_session_sweep`.

A code-review finding raised the case of a session that yielded the turn with
background subagents/Workflows still running: `dispatch-self-close`'s HOLD
invariant exists precisely for that shape, and such a job stays in the
registry. Long fan-outs (e.g. `/review-fix`'s own Workflow) routinely exceed 5
minutes with no writes to the parent transcript.

Sampling live `~/.claude/jobs/*/state.json` during the review pass that filed
this node showed those sessions report `state: working` (with `inFlight:
{tasks: 1, kinds: ["local_workflow"]}` and `selfWake: true`) or `state:
blocked`, never a terminal state — so on current daemon behavior they are not
candidates and the concern does not fire. No terminal-state job dir was
available to sample, so one question stayed open.

## Proposed work

1. Capture several `state.json` files for jobs whose session has actually
   ended (both a clean end and a crash/API-error end). Record whether
   `inFlight.tasks`/`inFlight.queued` are zeroed at terminal, or left stale
   non-zero.
2. If they are reliably zeroed: add an `inFlight` keep-signal to the sweep.
   It is nearly free — the sweep already reads `$jobs_root/$jid/state.json`
   with `jq` for the `.name` ownership check, so `.inFlight.tasks`/`.queued`
   come from the same read. Treat truthy in-flight work as `observing`, not
   a park, and add a test for a terminal row whose job still reports
   in-flight work.
3. If they are NOT reliably zeroed: do not add the guard — a stale non-zero
   `inFlight` would make the sweep skip that node forever, which is a worse
   failure than a recoverable spurious park. Record the finding in the
   sweep's "Accepted residuals" block instead.

Do not raise the 300s grace toward the frozen sweep's 900s as a substitute:
the two graces gate different predicates (a live session that might resume
vs a session that has already ended), and the current default is documented
on that basis.
