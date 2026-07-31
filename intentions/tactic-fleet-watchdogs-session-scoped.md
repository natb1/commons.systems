---
id: tactic-fleet-watchdogs-session-scoped
kind: tactic
statement: the two instruments that watch fleet health — the unit-poisoning
  healer and the health watcher — run as shells scoped to whichever operator
  session launched them, so they die with that session and nothing reports the
  gap; and the watcher compounds this by evaluating its session predicates over
  every registered session rather than only those in the node keyspace, so an
  ordinary human session sitting at a permission prompt trips FINDING-G, and the
  watcher exits by design and leaves the fleet unwatched
owner: ai
status: raw
parent: null
rationale: "Filed 2026-07-31 as the owed tracking node for bug-ledger rows O and
  P of the bootstrap plan, which had a detect command and an exit criterion but
  no node. Row O: neither instrument is a systemd unit, so each dies silently
  with its launching session. Four observed unwatched gaps, three of them long —
  3h on 07-30, 6.7h earlier on 07-31, and 8.2h on 07-31 between the healer
  logging `watchdog exiting; heals=23` at 07:51:41Z and a relaunch at 16:03Z.
  Nothing anywhere reports that the watcher is absent, so the absence is only
  ever discovered by an operator remembering to look, which is precisely the
  babysitting the fleet is supposed to remove. Row P: the watcher's predicates
  ran over the whole `claude agents --json --all` array. A session is only
  capable of holding a node when its name is a node id — that is what
  worktree_has_live_session keys on — so any session named anything else cannot
  be an instance of F, G, H, D or J. Without that filter the watcher flagged the
  operator's own monitoring session as FINDING-G at 14:56Z, and a separate human
  analysis session as FINDING-D/J at 15:35Z and again as FINDING-G at 16:34Z.
  Because a violation exits by contract, every spurious hit converts row P into
  a fresh instance of row O. Worth recording how the fix went wrong the first
  two times: the exclusion was bolted onto one predicate at a time, so fixing
  the terminal predicate at 15:35Z left FINDING-G to fire on the same session an
  hour later. The filter belongs at the input boundary, applied once to the
  session array, not restated per predicate. A third instance of the same class
  surfaced while diagnosing this one: `ps -eo pid,args` run under the Claude
  sandbox returns no rows at all, so the check `are the watchdogs still running`
  fails open to `they are dead` — an operator who trusts it launches a duplicate
  healer on top of a live one, and two heal loops race each other in exactly the
  way the runbook already warns about, one instance's `disable --now` killing
  the other's `start` with SIGTERM. Observed live at 16:38Z. That makes at least
  five members of one class in this pipeline — a check whose failure mode is a
  silent PASS on the signal that matters. The others on record: the Monitor tool
  under sandbox, where `claude agents --json` returns [] and a duplicate-worker
  check reports green; dispatch-reclaim-audit failing open to zero counts, owned
  by tactic-reclaim-audit-journal-unit-filter; dispatch-stop.sh parking under
  `>/dev/null 2>&1` and exiting 0 by contract, owned by
  tactic-phase-terminal-requires-disposition; and graph-commit's exit 0 not
  being evidence anything landed, which is invariant I2. Direction for planning,
  not a plan: promote both instruments to systemd user units, so that neither
  depends on an operator session existing. Scope boundary, and the reason this
  node is narrower than the instruments are today — roughly half of what the
  watcher currently polls is scaffolding standing in for fleet capabilities that
  did not exist when it was written, and those predicates migrate INTO the tick
  sweep rather than being rebuilt here. Specifically: the blocked-worker check
  is superseded by frozen_session_sweep in tactic-denied-command-parks-node,
  which is strictly better because it parks the node rather than merely
  reporting; the terminal-without-disposition and duplicate-worker checks are
  superseded by tactic-phase-terminal-requires-disposition and
  tactic-router-spawn-window-duplicate-worker; and the stranded-park-marker
  check is ELIMINATED rather than migrated, because the marker exists only as an
  artifact of the dispatch-stop.sh backstop that
  tactic-phase-terminal-requires-disposition deletes. Do not re-implement any of
  those here — the plan's architectural rule is one sweep framework with several
  predicates, and a second implementation of a predicate is the failure it
  forbids. What endures is the part no sweep can cover: a check that runs INSIDE
  dispatch-tick structurally cannot report that dispatch-tick has stopped
  running, so tick staleness, daemon liveness (dispatch-daemon-liveness exists
  as a script with a test suite and nothing whatsoever schedules it), and a
  sustained BUSY=0 stall need an observer that is not part of what it observes
  and that survives the fleet being down. The healer endures too, but as a LANE
  rather than as a bug-B fixture: a standing self-heal path for any defect whose
  permanent fix is queued, idle and no-op when nothing needs healing — as it
  should be now that tactic-sweep-timer-unit-dir-leak has merged as #2999,
  absent new findings. That lane carries a second job worth keeping explicit:
  its log is the rate signal by which a queued permanent fix is judged, since
  the heal log going quiet for a full day IS bug B's exit criterion, so the
  stopgap is also the measuring instrument for the fix that replaces it. The
  healer targets the very units it would itself live in, so a
  dispatch-heal.service must be resilient to its own ExecStart being rewritten —
  that hazard is the defect #2999 fixed, so this work is now unblocked, but the
  resilience requirement stands as a design constraint rather than a scheduling
  one. Fold in the keyspace filter as a property of whatever the watcher
  becomes, and give every such instrument the general rule this class demands:
  state explicitly what it prints when it cannot see, and never let that equal
  healthy. An instrument that cannot read its input must report UNKNOWN, not
  OK — the repo's code-style rule already says prefer clear errors over
  defensive fallbacks.
  Interim attention scaffolding only — tactic-attention-tier-ranking replaces
  the numeric scheme with lexicographic (tier, rank) and max-lifting, and
  tactic-attention-boost-scripts converts these boosts to tier/bug_fix marks."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 50
  override: null
  rationale: "Bootstrap re-scale 2026-07-31: Wave A of the three-band interim
    scale (50 / 20 / 10) that puts write-path and pipeline-integrity work above
    ordinary feature work. Belongs in this band on the band's own criterion — it
    is the monitoring layer every other bug-ledger row is detected through, and
    it fails in the two worst directions available to an instrument: it
    disappears without saying so, and it reports a violation that is not one.
    Bug B's node showed what the absence costs — 23 unit-poisoning heals in a
    single overnight window were only caught because a watcher happened to be
    running. blocked_by is empty, so this promotion lifts no blocker and cannot
    compound; the one candidate blocker, tactic-sweep-timer-unit-dir-leak, is
    already phase done and therefore takes no inflow from this edge."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# tactic-fleet-watchdogs-session-scoped

The fleet's health instruments are not part of the fleet. Both live as shells
launched by hand from an operator session, and both inherit that session's
lifetime.

## The two instruments

| instrument | job | today |
|---|---|---|
| unit-poisoning healer | polls `ExecStart` for a `/tmp/tmp.*` path, **or** a unit in `failed`, and re-runs the ensure block | scratch shell, dies with its session |
| health watcher | polls the checks a sandboxed monitor cannot do correctly — duplicate workers, daemon liveness, auto-merge suppression, tick staleness, held-but-not-busy sessions, stranded park markers | scratch shell, exits non-zero on the first violation by design |

Both must survive an operator session ending, a machine reboot, and their own
findings.

## Scope boundary — read this before planning

About half of what the watcher polls today is scaffolding that stood in for
fleet capabilities which did not exist when it was written. Those predicates
**migrate into the tick sweep**; they must not be rebuilt here. The plan's
architectural rule is *one sweep framework, several predicates*, and a second
implementation of a predicate is precisely the failure that rule forbids.

| check | disposition |
|---|---|
| blocked worker (`FINDING-G`) | → `frozen_session_sweep`, `tactic-denied-command-parks-node`. Strictly better: it **parks** the node; the watcher only reports |
| terminal without disposition (`FINDING-H`, `FINDING-D/J`) | → the terminal predicate on that same sweep, `tactic-phase-terminal-requires-disposition` |
| duplicate worker (`FINDING-F`) | → fixed in `tactic-router-spawn-window-duplicate-worker`; retain at most as a regression canary |
| stranded park marker | **eliminated, not migrated** — the marker is an artifact of the `dispatch-stop.sh` backstop that `tactic-phase-terminal-requires-disposition` deletes. The concept ceases to exist |

What endures is the part no sweep can reach. A check that runs *inside*
`dispatch-tick` cannot report that `dispatch-tick` has stopped running — that is
irreducible, not an implementation gap. So these need an observer that is not
part of what it observes, and that survives the fleet being down:

- **tick staleness** — no in-band check can ever cover it
- **daemon liveness** — `dispatch-daemon-liveness` exists as a script with a
  test suite, and nothing schedules it. The watcher is its only caller
- **sustained `BUSY=0`** — the router logs `effective_live` every tick; nothing
  alarms on a prolonged zero
- **auto-merge suppression** — `dispatch-select-tick` reads the red-sync to
  suppress, but suppression is silent; nothing reports that it happened

## The healer is a lane, not a bug-B fixture

The healer survives the defect that motivated it. It is the standing self-heal
path for **any** defect whose permanent fix is queued — idle and no-op when
nothing needs healing, which is its expected state now that
`tactic-sweep-timer-unit-dir-leak` has merged as #2999, absent new findings.

It carries a second job that should stay explicit: **its log is how a queued
permanent fix is judged.** Bug B's exit criterion is the heal log staying quiet
for a full day. The stopgap is therefore also the measuring instrument for the
fix that supersedes it, which is a reason to keep the lane rather than retire it
when it falls quiet.

## Two failure modes, and why they compound

**The instruments die silently (row O).** Four unwatched gaps observed, three of
them long. The longest ran 8.2 hours on 2026-07-31, from the healer's own
`watchdog exiting; heals=23` line at 07:51:41Z to a relaunch at 16:03Z. Nothing
reported the absence.

**The watcher blinds itself (row P).** Its predicates ran over every registered
session. Only a session whose name is a node id can hold a node — that is the
key `worktree_has_live_session` matches on — so a human session named anything
else cannot be an instance of any finding the watcher tests for. Three spurious
firings resulted, two of them on a human analysis session that owns no worktree.
Since a violation exits by contract, every spurious hit is also a fresh
occurrence of row O.

The interaction is the point: the watcher is the thing that would notice the
healer missing, and row P is what stops the watcher from being there to notice.

## What the two false starts teach

The keyspace exclusion was first added to one predicate, then another. Fixing
the terminal predicate at 15:35Z left `FINDING-G` to fire on the same session at
16:34Z. The filter is a property of the input, not of any single test: build the
node-keyspace-and-not-self array once, and let every predicate read that.

A third instance appeared while diagnosing this one. `ps -eo pid,args` run under
the sandbox returns no rows, so *are the watchdogs running* fails open to *they
are dead*. Acting on that answer starts a duplicate healer, and two heal loops
race each other the way the runbook already documents — one instance's
`disable --now` cancelling the other's `start`. Observed 16:38Z.

## The class, and the rule this node should carry into its fix

All three belong to one class the pipeline keeps producing: **a check whose
failure mode is a silent PASS on the signal that matters.** Known members —
`Monitor` under sandbox (`claude agents --json` returns `[]`, duplicate check
reports green); `dispatch-reclaim-audit` failing open to zero
(`tactic-reclaim-audit-journal-unit-filter`); `dispatch-stop.sh` parking under
`>/dev/null 2>&1` and exiting 0 by contract
(`tactic-phase-terminal-requires-disposition`); `graph-commit` exit 0 not being
evidence anything landed (invariant I2); and now `ps` under sandbox.

Whatever this node becomes must answer, in its own tests: *what does this print
when it cannot see?* If that equals healthy, it is broken. An instrument that
cannot read its input reports UNKNOWN, never OK.

## Exit criterion

Both instruments are systemd user units — surviving a session ending and a
reboot — and the watcher does not flag a session that holds no node. Row O and
row P then close together.

Note what this criterion does **not** require: it does not require the watcher
to retain the migrating predicates. A watcher reduced to the four out-of-band
checks above, plus a healer lane sitting idle, satisfies it fully. Shrinking is
the expected outcome, not a regression.
