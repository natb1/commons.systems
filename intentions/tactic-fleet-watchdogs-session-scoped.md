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
  not a plan: promote both instruments to systemd user units, or fold the heal
  into an existing dispatch unit, so that neither depends on an operator session
  existing. The healer targets the very units it would itself live in, so a
  dispatch-heal.service must be resilient to its own ExecStart being rewritten —
  that hazard is the defect tactic-sweep-timer-unit-dir-leak fixed and merged as
  #2999 on 2026-07-31, so this work is now unblocked, but the resilience
  requirement stands as a design constraint rather than a scheduling one. Fold
  in the keyspace filter as a property of whatever the watcher becomes, and give
  every such instrument the general rule this class demands: state explicitly
  what it prints when it cannot see, and never let that equal healthy. An
  instrument that cannot read its input must report UNKNOWN, not OK — the repo's
  code-style rule already says prefer clear errors over defensive fallbacks.
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
