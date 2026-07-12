---
id: tactic-graph-explicit-node-dispatch
kind: tactic
statement: give the graph lane an explicit single-node dispatch entrypoint
  (dispatch <node-id>) that skips the pace gate, mirroring the issue-lane
  explicit-arg path
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-11 while explicitly executing
  tactic-graph-census-recurrence's implement phase: the graph lane has no CLI
  entry to dispatch one node on demand. The issue lane already honors the
  author's principle that explicit human dispatch overrides autonomous pacing —
  dispatch <issue-number> routes through dispatch-resolve-arg and the
  explicit-arg branch (dispatch-select-tick:778-818) returns before both the
  graph selector and the legacy pace gate, so it skips the concurrency gate
  (dispatch-tick header line 30). The graph lane has no equivalent:
  dispatch-resolve-arg accepts positive integers only (dispatch-resolve-arg:30),
  so dispatch tactic-graph-census-recurrence errors, and the only way to
  explicitly execute a graph node is to call dispatch-graph-execute directly by
  hand. This tactic closes that gap by teaching the explicit-arg path to
  recognize a node id and route it to the already-pace-independent
  dispatch-graph-execute. Distinct from the pace_exempt flag (strategy
  clarification 14): that is a standing autonomous per-node exemption the
  selector reads; this is an on-demand human bypass for any node. A second
  explicit-path gap of the same family surfaced 2026-07-11 executing
  census-recurrence's qa phase (design point 5): the explicit
  dispatch-graph-execute path never fast-forwards the main-checkout working tree
  the way dispatch-select-tick does, so provision-node-worktree's worker-start
  re-validation gate (check-node-selection.ts) reads a stale pre-transition
  phase and false-exit-12s stale-selection. The same explicit entrypoint must
  pre-sync the main checkout, so both gaps close together in this tactic."
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
# give the graph lane an explicit single-node dispatch entrypoint (dispatch <node-id>) that skips the pace gate, mirroring the issue-lane explicit-arg path

> Draft context retained by `/align-strategy` on 2026-07-11 — not yet a
> finalized unit plan. `/align-tactics` decomposes this into PR-sized units.

## Context

The author's standing principle: **explicit human dispatch overrides the
autonomous pace curve.** The issue lane already honors it — the explicit-arg
branch at `dispatch-select-tick:778-818` resolves the arg via
`dispatch-resolve-arg`, emits `explicit <issue> <gap>`, and `exit 0`s *before*
Step 3a's graph selector (`dispatch-select-tick:820`) and before the legacy
pace/concurrency gate. `dispatch-tick`'s header records the consequence
directly: "`dispatch <N>` (explicit target): the tick skips the concurrency
gate" (`dispatch-tick:30`).

The graph lane has **no equivalent**. `dispatch-resolve-arg` accepts a positive
integer only (`dispatch-resolve-arg:30`, regex `^[1-9][0-9]*$`), so a node id
is rejected as a usage error (exit 1) and `dispatch tactic-graph-census-recurrence`
fails. The only way to explicitly execute a graph node today is to invoke
`dispatch-graph-execute <id:kind:phase>` by hand (as was done 2026-07-11 for
`tactic-graph-census-recurrence`). That executor is already pace-independent
and lock-free, and `dispatch-tick:597` already routes a `graph …` selection
line to it — so the missing piece is purely *arg recognition and routing*, not
new execution machinery.

**Second gap, same family (surfaced 2026-07-11, census qa phase).** Invoking
`dispatch-graph-execute` by hand also skips a step the autonomous path performs
before every worker: `dispatch-select-tick` keeps the **main-checkout working
tree** fast-forwarded to `origin/main` (`git fetch origin main && git merge
--ff-only origin/main`). `provision-node-worktree`'s worker-start re-validation
gate (`check-node-selection.ts`) reads the node's `phase` from that working tree
(`$PROJECT_ROOT/intentions`, resolved to the first `[main]` worktree —
`provision-node-worktree:63`), and its own comment states the tree "is kept
fast-forwarded to origin/main by dispatch-select-tick." The explicit path never
runs `dispatch-select-tick`; `provision-node-worktree:73` fetches the *ref* only
and does not touch the tree. So when a node's phase was just advanced out-of-band
(as census-recurrence's was, `fix → qa`), the gate reads the stale
pre-transition phase and aborts exit-12 stale-selection (`selected qa but node is
now fix`) even though `origin/main` is already `qa`. Confirmed by reproduction:
after the main checkout was synced to the `qa` commit, the same
`check-node-selection.ts … qa` call returned the scope fingerprint and **exit 0**
— the node was never reverted; the failure was a stale-working-tree false
positive, not a real phase revert or a claim mismatch.

## Greenfield design

Teach the explicit-arg path to accept a **node id** as a first-class target
kind alongside the issue number, and route it to the existing graph executor:

1. **Node-id recognition.** In the explicit-arg branch (`dispatch-select-tick:778`),
   before/around the `dispatch-resolve-arg` call, discriminate the arg: a value
   matching a node-id shape (non-numeric, e.g. `^(tactic|strategy|virtue|delegation)-`)
   is a graph node; a positive integer stays the issue path (unchanged). Cleanest
   home is either extending `dispatch-resolve-arg` to emit a typed result
   (`issue <N>` vs `node <id>`) or a sibling `dispatch-resolve-graph-arg` invoked
   on the non-numeric branch. A node id that does not exist in the graph → a
   clear error with exit-2 parity ("neither an issue nor a graph node").

2. **Phase source = the node's current persisted phase.** Read `kind` and
   `phase` from the node (via the store / `dump-node.ts`). Emit a single-node
   graph selection line — `graph 1 <id>:<kind>:<phase>` — which
   `dispatch-tick:597` hands to `dispatch-graph-execute`, reusing its full
   phase→skill / model / effort resolution. A node whose `phase` is
   `null`/draft/`done` is not selectable: refuse with a clear message ("node
   <id> has no executable phase") rather than spawn a no-op worker. (Open option
   for `/align-tactics`: also accept an explicit `dispatch <node-id>:<phase>`
   override; defer unless the author wants it.)

3. **Pace skip is inherited, not re-implemented.** Because the node-id arg takes
   the *same* explicit branch that returns before both the graph selector and
   the pace gate, it skips pacing for free — no new pace logic. This is the
   whole point: explicit graph dispatch reaches `dispatch-graph-execute` on the
   pace-gate-free path, exactly as `dispatch <issue>` does.

4. **Claim safety — respect the live claim, never force (author decision,
   2026-07-11).** Explicit dispatch overrides the **pace gate only**. If the
   node already has a live-session / worktree claim (uniform node-id claiming,
   strategy clarification "Can workers execute nodes concurrently"), the
   explicit path must **refuse** (clear message, no double-spawn), not preempt.
   Verify whether `dispatch-graph-execute` / the reservation ledger already
   probes the live claim before spawning; if not, add the probe on this path.
   No `--force` escape hatch in this tactic (rejected 2026-07-11): preempting a
   live claim races two workers into a `graph-commit` conflict-park.

5. **Pre-sync the main checkout before provisioning (surfaced 2026-07-11).** The
   worker-start re-validation gate reads the selected node's `phase` from the
   main-checkout working tree, which only `dispatch-select-tick` keeps
   fast-forwarded to `origin/main`. The explicit path bypasses
   `dispatch-select-tick`, so it must perform that sync itself before
   `provision-node-worktree` runs: `git fetch origin main && git merge --ff-only
   origin/main` on the resolved `[main]` worktree (the same op
   `dispatch-select-tick` runs, and the canonical read-only-path tree-update
   hazard — must run with the sandbox disabled). Without it, an explicitly
   dispatched node whose phase was just advanced out-of-band hits a **false
   exit-12 stale-selection** (`selected qa but node is now fix`), because the
   gate reads a stale pre-transition phase from an un-synced tree. Two viable
   homes: (a) the new explicit node-id branch runs the fetch+ff-only itself
   before emitting the `graph …` selection line — mirrors `dispatch-select-tick`
   exactly and keeps the fix in the dispatch path; or (b) harden
   `check-node-selection.ts` to read `phase` from `origin/main` directly (e.g.
   `git show origin/main:intentions/<id>.md`) rather than the working tree, which
   fixes the false positive for *every* caller (autonomous and explicit) and
   removes the implicit "someone keeps the tree fresh" coupling the gate's own
   comment documents. Prefer (b) as the greenfield shape — it makes the gate
   self-sufficient — with (a) as the minimal in-path fix if (b) is deferred.
   Either way, the explicit entrypoint must not provision against a stale tree.

Out of scope: changing the pace curve or `dispatch.config/target-workers.json`
(explicit dispatch *overrides* the curve at the gate; it never edits it); the
`pace_exempt` standing-flag mechanism (strategy clarification 14 — a distinct,
autonomous per-node exemption); the issue-lane explicit path (already correct).

## Reuse

- `dispatch-graph-execute` (`.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute`)
  — the pace-independent, lock-free graph executor; invoke as-is.
- `dispatch-tick:597` — already routes a `graph …` selection line to the executor.
- The explicit-arg branch at `dispatch-select-tick:778-818` as the copy-paste
  shape for the node-id branch (resolve → emit → `exit 0` before the pace gate).
- `dispatch-resolve-arg` (`dispatch-resolve-arg:30`) as the discrimination
  seam to extend (or a sibling resolver to add).
- The store / `dump-node.ts` for the node's `kind` + `phase` read.
- `dispatch-select-tick`'s main-checkout sync (`git fetch origin main && git
  merge --ff-only origin/main`) — the exact op the explicit path must mirror for
  design point 5; canonical read-only-path tree-update hazard (`.claude/rules/sandbox.md`).
- `provision-node-worktree` (`.claude/skills/dispatch-propagate/scripts/provision-node-worktree`,
  `PROJECT_ROOT` resolution at line 63, ref-only fetch at line 73, gate call ~88)
  and `check-node-selection.ts`
  (`packages/intentionsutil/scripts/check-node-selection.ts`) — the worker-start
  gate that reads `phase` from the working tree; the design-point-5(b) home if
  hardening the gate to read `origin/main` directly.
- `test-dispatch-scripts.sh` (has a `dispatch-resolve-arg` suite at ~line 4446)
  — extend with node-id-arg cases.

## Verification

```verify
cd /home/n8/natb1/commons.systems && .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```
Then, manually: run `dispatch <a-real-draft-or-open-node-id>` and confirm it
routes to `dispatch-graph-execute` at the node's current phase, skips the pace
gate (executes even with the curve pinned to zero), and refuses cleanly on a
node id that is unknown, has no executable phase, or is already claimed by a
live session. For design point 5, confirm the false exit-12 is gone: advance a
node's phase out-of-band on `origin/main`, then explicitly dispatch it from a
main checkout still at the pre-transition commit — the worker must provision at
the *new* phase, not abort exit-12 stale-selection.
