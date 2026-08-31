---
id: tactic-graph-writer-same-writer-lock-staleness
kind: tactic
statement: "Two concurrent reconcile-graph-merged runs stamp the SAME writer
  identity, so the stale-lock reclaim that lets them overlap at all —
  dispatch-acquire-lock's 300s MAX_HOLD_SECONDS cap, refreshed by no heartbeat
  anywhere inside a reconciler run that dispatch-tick itself budgets at up to
  600s and dispatch-select-tick does not bound at all — leaves writer A
  classifying writer B's un-landed commit as its own and `git reset --mixed`ing
  it away; PR #3174's Graph-Writer trailer repairs only the DIFFERENT-writer
  half of that destruction, and the same-writer half is still live"
owner: ai
status: raw
parent: null
rationale: "Minted 2026-08-31 from the review of PR #3174 (branch
  graph-rollback-writer-attribution, OPEN at mint time). The trailer that PR
  adds gives a graph writer a durable identity so a peer writer's commit is
  never discarded, which closes the case where the two writers are DIFFERENT
  scripts. The case where they are the same script — two overlapping
  reconcile-graph-merged runs — stamps one identical trailer value and is
  therefore not distinguished by it. Recorded as its own node rather than folded
  into #3174 because it needs a different mechanism (a heartbeat or a bounded
  hold), not a wider trailer."
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
# The same-writer graph rollback race survives the writer-identity trailer

## What this node is

A **measured defect record**, not a plan. It carries the measurement and the
anchors; it has no units and no verification fence yet, and it is deliberately
born unplanned (`status: raw`, `phase: null`) so `/align-tactics` decomposes it
against whatever `origin/main` looks like when it is picked up. Born state
chosen by matching sibling convention rather than by guessing — see
"Born state" at the end.

Everything below was measured on branch `graph-landings-3` at `44ef8060`
(`origin/main`'s tip at the time, PR #3172) on **2026-08-31**. Every `path:line`
anchor inherited from the PR #3174 review was re-checked; the four that had
drifted are corrected in place and listed in the drift table.

## The defect

`reconcile-graph-merged` writes intention nodes and lands them on main. Two
concurrent runs of it against the same main checkout destroy each other's work,
and neither the ordinary selection lock nor PR #3174's writer trailer prevents
it.

### 1. Ordinary mutual exclusion is in place, and it is not enough

All three `reconcile-graph-merged` call sites do take the selection lock first:

| caller | lock acquired | reconcile call |
| --- | --- | --- |
| `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick` | `:288` | `:708` |
| `.claude/skills/dispatch-propagate/scripts/dispatch-tick` | `:728` | `:772` |
| `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run` | `:1307` | `:1397` |

So two writers never *start* concurrently. They become concurrent because the
lock can be taken away from a holder that is still running.

### 2. The lock is stale-reclaimable by design

`dispatch-acquire-lock` treats the lock file's mtime as a heartbeat. Its own
header states the mechanism (`dispatch-acquire-lock:85-104`), verbatim:

```
# wedges (e.g. spins forever in some step) stops emitting heartbeats, so its mtime
# goes stale, and the next acquire reclaims the lock once the mtime is older than
# MAX_HOLD_SECONDS — even though the session is still live in the registry.
```

INVARIANT #1 (`:89`) is explicit that the cap bounds *the gap between two
consecutive heartbeats*, not the total hold: "A legitimately-long hold stays
safe as long as it keeps refreshing." The default is `MAX_HOLD_SECONDS=300` at
`dispatch-acquire-lock:227`. The reclaim itself is at `:393-395`.

This is correct behaviour. It is only dangerous where a legitimately-long hold
does **not** keep refreshing.

### 3. No heartbeat fires anywhere inside a reconciler run

`reconcile-graph-merged` is 427 lines and contains **no heartbeat at all** —
measured, `grep -n 'heartbeat\|refresh_lock\|acquire-lock'` over it exits 1
with no output. It cannot refresh: INVARIANT #2 (`dispatch-acquire-lock:96-103`)
forbids refreshing inside a retry/poll/wait loop, and the reconciler is
loop-shaped.

Every caller's refresh therefore sits immediately **before** the reconcile call,
never inside it:

- `dispatch-select-tick`: `refresh_lock` at `:586` and `:815` **straddle** the
  call at `:708` with nothing in between.
- `dispatch-tick`: `refresh_lock` at `:770`, one line before `:772`.
- `dispatch-ladder-run`: `refresh_lock` at `:1393`, four lines before `:1397`.

The practical effect is that the staleness clock is reset to zero as the
reconcile begins and is never touched again until it returns. The exposure is
exactly "one `reconcile-graph-merged` run lasting longer than
`MAX_HOLD_SECONDS`".

### 4. The budgeted run time is twice the cap, or unbounded

`dispatch-tick` wraps the reconcile in `timeout` with
`DRAIN_TIMEOUT_S="${DISPATCH_PAUSED_DRAIN_TIMEOUT_S:-600}"` (`:710`) — **600s
against a 300s cap**. Its own comment at `:764-769` already admits the arithmetic:

```
# Heartbeat BETWEEN the two drain calls (see refresh_lock's comment
# above): graph-auto-merge just completed its own up-to-600s budget,
# and reconcile-graph-merged is about to spend up to another 600s — the
# combined 1200s worst case exceeds the 300s default staleness cap, so
# without this refresh a second paused tick could reclaim the lock
# mid-drain.
```

That comment is right about the 1200s pair and wrong about the remedy being
sufficient. The refresh it describes sits **between** the two drain calls. It
zeroes the clock before the reconcile starts and does nothing for the up-to-600s
spent inside it, so the single call can still outlive the cap by 300s on its own.

`dispatch-select-tick:708` is worse: the call carries **no `timeout` wrapper at
all** —

```
RECONCILE_GRAPH_OUT=$(DISPATCH_PR_JSON_CACHE="$PR_JSON_CACHE" "$SCRIPT_DIR/reconcile-graph-merged") || true
```

— so its hold is unbounded, and the `|| true` means even a hard failure is
swallowed.

### 5. The consequence: writer A discards writer B's commit

Once the lock is reclaimed mid-run, a second tick or a `dispatch-ladder-run`
enters `reconcile-graph-merged` against the same main checkout. Both are now
live, and both write nodes.

`reconcile-graph-merged`'s own EXIT-trap comment (`:355-380`) states the harm in
its own words:

```
#   2. graph_rollback_node_writes() compares HEAD against HEAD_AT_ARM to tell
#      an ordinary rollback from graph-commit having moved HEAD. If a
#      CONCURRENT graph writer landed a commit while we were planning, that
#      comparison sees a moved HEAD, enters _graph_discard_stranded_commits,
#      and `git reset --mixed`es away a commit this sweep never made.
```

The shared helper is `graph_rollback_node_writes` in
`.claude/skills/dispatch-propagate/scripts/lib-graph-rollback.sh`. The same
comment notes the path is **routine, not rare** — "An empty plan is ROUTINE, not
exceptional ... A rare-path bug would be survivable; a routine-path one is not."

## Why PR #3174 does not close this

**Status check, measured:** `gh pr view 3174` reports `OPEN`, `mergedAt=null`,
branch `graph-rollback-writer-attribution`, titled "graph rollback: a durable
writer identity, so a peer writer's commit is never discarded". A
`grep -rn 'Graph-Writer'` over `.claude/skills/dispatch-propagate/scripts` and
`packages/intentionsutil/scripts` at `44ef8060` returns **nothing** — the trailer
is not on `origin/main` yet. So this node describes the state that will remain
*after* #3174 lands, not a regression it introduced.

The trailer gives each graph writer a durable identity so the rollback can tell
"my own commit" from "a peer's". That is a real repair, and it closes the
different-writer pairs. It cannot close this one, because the two racing writers
here are the **same script**: both stamp `Graph-Writer: reconcile-graph-merged`.
Writer A reads that value on writer B's un-landed commit, classifies it as
`mine`, and discards it — the identical pre-#3174 destruction, for the one pair
the identity cannot separate.

#3174's other two mitigations narrow the blast radius without closing the hole:
the `rev-list` narrowing reduces how many commits the discard leg considers, and
the park guard limits what a diverged id can do. Neither makes A stop believing
B's commit is A's.

## Why there is no test covering this

Deliberately not covered by a test in #3174, and the reason is a project rule
rather than an oversight. A test written against today's behaviour would have to
assert that writer A discards writer B's same-writer commit — an assertion that
**blesses the current wrong behaviour** and would have to be inverted by the fix
that makes it right. `.claude/rules/test-integrity.md` forbids exactly that
shape: a test is a signal, and one written to pass against a known defect
destroys the signal it exists to carry.

The test belongs with the fix. Whichever mechanism is chosen below, its test
asserts the *repaired* property (the peer's commit survives), and it goes red
against today's tree for the right reason.

## Directions the fix could take — not a plan, not a ruling

Recorded so a later `/align-tactics` round does not re-derive them. Each closes
the gap at a different layer, and choosing between them is that round's job.

1. **Heartbeat from inside the reconciler.** Emit a refresh at each safe step
   boundary in `reconcile-graph-merged` — honouring INVARIANT #2 by firing on a
   step's completion, never inside its poll loop. Closes the staleness directly;
   costs the reconciler a dependency on the lock it does not currently have.
2. **Bound the hold below the cap.** Wrap `dispatch-select-tick:708` in the
   `timeout` its siblings already use, and lower every reconcile budget under
   `MAX_HOLD_SECONDS`. Cheapest change; converts a silent clobber into a visible
   timeout, but only if every budget stays under the cap forever.
3. **Give the writer identity a per-run nonce.** Extend #3174's trailer from a
   script name to a script name plus run id, so two `reconcile-graph-merged` runs
   are distinguishable and the `mine` test becomes exact. Most direct fit with
   #3174's own design; needs that PR to land first.

## Anchor re-measurement, 2026-08-31 at `44ef8060`

Anchors inherited from the #3174 review were re-checked one by one. Four had
drifted:

| inherited | measured | note |
| --- | --- | --- |
| `dispatch-tick:729` | **`:728`** | off by one; `:729` is the `if` on the result |
| `dispatch-ladder-run:1306` | **`:1307`** | and the file is under `.claude/skills/dispatch-ladder/scripts/`, **not** `dispatch-propagate/scripts/` |
| `dispatch-ladder-run:1398` | **`:1397`** | off by one |
| `dispatch-tick` 600s budget (no line given) | **`:710`** | `DRAIN_TIMEOUT_S="${DISPATCH_PAUSED_DRAIN_TIMEOUT_S:-600}"` |

Confirmed exactly as inherited: `dispatch-select-tick:288`, `:586`, `:708`,
`:815`; `dispatch-tick:772` and the `:764-769` comment; `dispatch-acquire-lock:227`
(`MAX_HOLD_SECONDS=300`) and INVARIANT #1/#2/#3 at `:89`/`:96`/`:100`; and
`reconcile-graph-merged` carrying no heartbeat (427 lines, grep exit 1).

One refinement the inherited framing did not carry: `dispatch-ladder-run` and
`dispatch-tick` both **do** refresh immediately before their reconcile call
(`:1393` and `:770`). That does not rescue either — the clock restarts at zero
and the run may still exceed the cap unaided — but the accurate statement is
"no heartbeat fires *during* the run", not "no heartbeat fires near the call".

## Born state

`status: raw`, `phase: null`, `office_hours: null`, `owner: ai`,
`serves: [strategy-graph-native-dispatch]`.

Chosen by measuring sibling convention, not by guessing:

- **`serves`** — of the seven nodes mentioning `graph_rollback_node_writes`,
  stranded commits, or writer attribution, six serve
  `strategy-graph-native-dispatch` (including
  `tactic-graph-write-refresh-clobber-class-observation`, the closest sibling in
  subject). The seventh serves `strategy-recursive-self-improvement` because it
  is an RSI ledger entry, which this is not.
- **`status: raw` + `phase: null`** — the majority born state for an unplanned
  finding (measured across `intentions/tactic-*.md`: 291 nodes at `phase: null`,
  242 at `status: raw`). This node carries a measurement and no units, so it is
  a draft awaiting decomposition, exactly like
  `tactic-keystone-decomposition-reorg`.
- **`office_hours: null` — deliberately NOT parked.** The nearest structural
  sibling, `tactic-graph-write-refresh-clobber-class-observation`, *is* parked,
  but for a reason that does not apply here: it carries observations only the
  author may reconcile (a ratified clarification gone stale). This node needs no
  author ruling — the defect is measured, the mechanism is understood, and the
  choice among the three directions above is ordinary planning work an
  autonomous `/align-tactics` round is competent to make.
