---
id: tactic-phase-terminal-requires-disposition
kind: tactic
statement: A phase skill that terminates on a needs-human judgment item must
  land an office_hours park before exiting — ending a phase with the node still
  at its entry phase and office_hours null is indistinguishable from work never
  started, so releasing the node re-selects it into an identical pass that
  reaches an identical dead end, a churn loop that never converges
owner: ai
status: raw
parent: null
rationale: "Observed live 2026-07-31 during the dispatch-pipeline bootstrap, on
  two Wave A nodes at once. A /qa-fix worker on
  tactic-graph-commit-intentions-base-stale-restore ran a complete and correct
  QA pass — all six script-verifiable items green (test-graph-commit.sh 50/50,
  test-park-node.sh 21/21, test-transition-node.sh 3/3, intentionsutil vitest
  717/717, lint clean, code inspection), no defects — then terminated on one
  genuine needs-human item: whether to accept the fail-closed
  park-the-whole-invocation tradeoff in ensure_intentions_only_base()'s
  three-way-merge replay. It exited done with the node still phase: qa and
  office_hours: null. The churn was directly measured, not inferred: reaping the
  holder at 00:49Z produced a fresh worker that redid the entire pass and was
  done by 01:01Z with the node unchanged. Crucially, the second session did NOT
  simply forget to park — it drafted the park reason and a full line-numbered
  recommendation, wrote both to its job directory, and ended expecting the Stop
  hook to fire park-node; the hook did not, and the session named the mechanism
  itself: the Stop hook does not reliably fire the park after a session awaits a
  background Workflow. So the defect has two distinct shapes that must both be
  closed — a skill that never writes a disposition at all, and a skill that
  delegates the write to a Stop hook that silently no-ops. This is the same
  class as tactic-qa-fix-node-terminal-declaration, whose fix-finalize path
  declares no node-terminal marker and freezes its own node, and the fix should
  be planned against both: the general rule is that a phase terminating with the
  node at its entry phase and no disposition is an ERROR, not a normal exit, and
  should be detected mechanically rather than left to each skill's good
  behavior. Note the operational trap this creates, which is the opposite of the
  tactic-stopped-session-blocks-node playbook: reaping a done session whose node
  never advanced is what RESTARTS the loop, so a terminal session on an
  unadvanced node is a symptom to diagnose, never garbage to collect. Filed
  together with tactic-denied-command-parks-node and
  tactic-standdown-winner-liveness — all three are the same root confusion, that
  'held' and 'being worked' are not the same predicate and no code distinguishes
  them, with tactic-router-spawn-window-duplicate-worker the fourth member.
  Interim attention scaffolding only — tactic-attention-tier-ranking replaces
  the numeric scheme with lexicographic (tier, rank) and max-lifting, and
  tactic-attention-boost-scripts converts these boosts to tier/bug_fix marks.
  blocked_by is empty, so this Wave A promotion lifts no blocker and cannot
  compound."
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
    burns a full autonomous phase pass per iteration on a node that cannot
    advance, and it held two Wave A nodes simultaneously on 2026-07-31,
    contributing directly to the measured zero-productive-worker state.
    blocked_by is empty, so this promotion lifts no blocker and cannot compound.
    status stays raw and phase stays null so the selector emits it as an
    /align-tactics candidate for planning, not as an implement candidate."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# A phase skill that terminates on a needs-human judgment item must land an office_hours park before exiting — ending a phase with the node still at its entry phase and office_hours null is indistinguishable from work never started, so releasing the node re-selects it into an identical pass that reaches an identical dead end, a churn loop that never converges

## Context

Observed live **2026-07-31**, holding **two Wave A nodes simultaneously**.

A `/qa-fix` worker on `tactic-graph-commit-intentions-base-stale-restore` ran a
complete and correct QA pass — all six script-verifiable items green
(`test-graph-commit.sh` 50/50, `test-park-node.sh` 21/21,
`test-transition-node.sh` 3/3, `intentionsutil` vitest 717/717, lint clean, code
inspection), **no defects found** — then terminated on one genuine needs-human
item:

> "**One item needs a human**: whether to accept the fail-closed 'park the whole
> invocation' tradeoff in `ensure_intentions_only_base()`'s new three-way-merge
> replay…"

It exited `done` **without an `office_hours` park landing**, leaving the node at
`phase: qa` with `office_hours: null` — a state **indistinguishable from work
never started**.

## The churn loop was measured, not inferred

Reaping the holder at **00:49Z** produced a fresh worker that redid the **entire**
pass and was `done` by **01:01Z**, with the node unchanged at `qa`. Twelve
minutes of autonomous work to arrive at the identical dead end.

Two Wave A nodes were in this loop at once —
`tactic-graph-commit-intentions-base-stale-restore` and
`tactic-scope-fingerprint-plan-substance`, both `phase: qa`, both
`office_hours: null`.

## There are TWO distinct shapes, and a fix must close both

This is the part that a plan written from the symptom alone will miss.

**Shape 1 — the skill never writes a disposition at all.** The straightforward
case, and the one `tactic-qa-fix-node-terminal-declaration` describes for the
fix-finalize path.

**Shape 2 — the skill writes the disposition and delegates the landing to a Stop
hook that silently no-ops.** The second session on
`tactic-graph-commit-intentions-base-stale-restore` did **not** forget. It drafted
the park reason and a full line-numbered recommendation, wrote both to its job
directory (`office-hours-reason`, `office-hours-recommendation`, both still on
disk afterwards), and ended expecting the Stop hook to fire `park-node`. It named
the mechanism itself:

> "The prior pass's escalation never actually parked the node — a known infra bug
> (Stop hook doesn't reliably fire the park after a session awaits a background
> Workflow)"

So the escalation was performed correctly and still produced `office_hours: null`
on `origin/main`. A fix that only audits skill exit paths leaves shape 2 live.

## The operational trap — the opposite of the usual playbook

`tactic-stopped-session-blocks-node`'s playbook is "reap the terminal session to
free the node." Here that is exactly what **causes** the churn.

**Do not reap a `done` session whose node is still at its pre-session phase.**
Check the node's `phase` on `origin/main` and its `office_hours` *first*.
Unadvanced + unparked ⇒ diagnose, do not reap. A terminal session on an
unadvanced node is a **symptom**, not garbage to collect — and while the loop is
live, the stranded session is acting as accidental containment.

## Direction for planning (not a plan)

A phase skill that terminates on a needs-human judgment item **must** land an
`office_hours` park before exiting. More generally: **ending a phase with the
node at its entry phase and no disposition should be an error, not a normal
exit**, and it should be detected mechanically rather than left to each skill's
good behavior — every skill getting this right independently is what has already
failed twice.

Plan this against `tactic-qa-fix-node-terminal-declaration`, which is the same
class at a different call site (its fix-finalize path declares no node-terminal
marker and freezes its own node). A mechanical guard that every phase skill's
node-lane terminal path declares a disposition would close both, and shape 2
additionally requires that the landing not depend on a Stop hook that can be
skipped.

## Read this with its three siblings — do not plan it alone

`tactic-denied-command-parks-node`, `tactic-phase-terminal-requires-disposition`,
`tactic-standdown-winner-liveness` and
`tactic-router-spawn-window-duplicate-worker` are **one family**: the fleet cannot
reliably tell whether a node is being worked on. Same root confusion — **"held"
and "being worked" are not the same predicate, and no code distinguishes them.**

## Second shape, quantified — 2026-07-31: the Stop-hook backstop failed 4/4

The shape recorded above ("the skill delegates the write to a Stop hook that
silently no-ops") was observed **four times in one night**, on four different
nodes, in four different phase lanes. In every case the worker did everything
correctly and the disposition still never reached `origin/main`.

| session | node | lane | park commit built (local, EDT) |
|---|---|---|---|
| `878e5c1f` | `tactic-prune-conflict-recovery-silent-loss` | `/qa-main` | `e3b27d87` 02:18:36 |
| `5ca126b1` | `tactic-standdown-winner-liveness` | `/qa-main` | `174615ec` 06:33:30 |
| `e747c30d` | `tactic-router-spawn-window-duplicate-worker` | `/qa-main` | `25a90307` 07:48:53 |
| `02a9c342` | `tactic-frozen-session-debug-count` | `/qa-main` | `f956f2b6` 09:18:14 |

### The failure has a durable, recoverable residue nobody was reading

This is the part that makes the defect diagnosable, and it was not previously
recorded. The backstop does **not** fail before doing anything. It gets most of
the way:

1. `park-node` writes `office_hours` into `intentions/<id>.md` and **commits it
   locally**, onto the node worker's own PR branch.
2. The landing (CAS push to `origin/main`) does not complete.
3. `park-node`'s exit trap **reverts the working tree**, leaving the branch HEAD
   carrying a `graph: park …` commit that is reachable from **no remote ref** —
   confirmed for all four: `branch -r --contains` is empty and
   `merge-base --is-ancestor <sha> origin/main` is false.
4. The residue on disk is a single dirty file — `M intentions/<id>.md` — whose
   diff shows `office_hours` being *removed*, because HEAD has the park and the
   tree does not. It reads as a stray manual edit.

So the escalation text exists in three places (the job dir's
`office-hours-reason`, the local commit, the dirty-file diff) and in none of the
places anything reads.

### Why it cannot work where it is called from

`.claude/hooks/dispatch-stop.sh:5-7` states the backstop is "where a node
worker's escalation park is **guaranteed** to land even if the model's in-session
park write did not complete." It is not guaranteed, for a structural reason:

- The hook invokes `park-node` **from the node worker's own worktree** — a PR
  branch 9–13 commits ahead of `origin/main`.
- `graph-commit`'s landing budget is
  `LOCK_WAIT_SECONDS = MAX_PUSH_ATTEMPTS × (CHECK_TIMEOUT_SECONDS + 30)`
  (`graph-commit:217,223,234`) = **5 × 210 = 1050 s**, i.e. up to ~17.5 minutes
  of legitimate waiting on `refs/graph/landing-lock` — a tick's own reconcile
  routinely holds it ~10 minutes.
- That call runs in a **Stop hook at session teardown**, which `.claude/settings.json`
  registers with no `timeout` (so the harness default applies). A teardown hook's
  budget is orders of magnitude below the primitive's own worst-case wait.

The backstop therefore calls a minutes-scale blocking primitive from a
seconds-scale context.

### The failure is swallowed three times over

- `dispatch-stop.sh:92` runs `park-node … >/dev/null 2>&1`, so the primitive's
  own diagnosis is discarded.
- The `else` branch (`:95`) writes one line to the hook's stderr, which reaches
  no journal — `journalctl --user` for 2026-07-31 contains **zero**
  `[dispatch-stop] WARNING` lines.
- The hook is best-effort by contract (`:41-42`) and exits 0 regardless.

### The consequence is the churn loop, one level down

`park-node` writes the `node-terminal` marker only on success. No park ⇒ no
marker ⇒ `dispatch-self-close --node` **HOLDs the job alive** (`:100-109`, by
design). So each failure produces, simultaneously:

- a node still at `office_hours: null` on `origin/main` — fully selectable, so
  the router re-selects it into an identical pass; **and**
- a permanently registered session that `worktree_has_live_session` counts as
  holding that node (name-keyed, registered view — `lib-claude-agents.sh:102-125`).

The node is therefore *both* re-selectable *and* held. Which one wins is a race,
and neither outcome is the escalation the worker actually performed.

### The discriminator that separates this from an ordinary contention failure

In-session `park-node` calls **succeeded four times the same day** — four
`graph: park …` commits landed on `origin/main` between 00:04 and 06:55 EDT.
Every landing failure was a Stop-hook backstop call; every success was an
in-session call. The mechanism is the calling context, not lock contention.

This is direct support for the remedy already recorded above — **park in-session
via `packages/intentionsutil/scripts/park-node`, and never let the landing depend
on a Stop hook that can be killed.** Note also that
`tactic-dispatch-stop-backstop-comment` (`status: raw`, `phase: implement`)
is scoped to reword `dispatch-stop.sh:62-63` on the premise that the backstop is
now "far-ahead-safe". That premise is about `graph-commit`'s base handling and is
not contradicted here — the park commits *were* built successfully. What fails is
the landing, downstream of it. A comment reword must not be read as evidence the
backstop path works.

### Recovery, for an operator holding one of these worktrees

The park text survives in `$CLAUDE_JOB_DIR/office-hours-reason` and
`office-hours-recommendation` (the hook deletes them only on success,
`dispatch-stop.sh:93`), and the built commit survives on the local branch. Do not
re-derive the text. Re-land it with an in-session `park-node` from a checkout at
`origin/main`, per invariant I1 — never from the PR-branch worktree that produced
it.

## Re-scope 2026-07-31: the disposition writer must be the tick sweep, not the Stop hook

The park that blocked this node is cleared. Two ownership questions were put to
the author and answered; a third — where the disposition is *written* — is
settled by evidence gathered the same day and recorded here, because it narrows
this node's scope rather than widening it.

**The Stop-hook backstop has never once worked.** `.claude/hooks/dispatch-stop.sh:5-7`
claims it is where a node worker's escalation park is "guaranteed to land even if
the model's in-session park write did not complete". Measured on 2026-07-31:
**five failures, zero successes**, across five different nodes, while in-session
`park-node` calls succeeded four times the same day. The fifth was observed live
at 14:34-14:37Z on `tactic-stopped-session-blocks-node`, twenty minutes after the
first four were documented — an independent reproduction, not a re-count.

Residue signature, identical every time:

| check | observed |
|---|---|
| `git log origin/main..HEAD` in the worker's worktree | a `graph: park <id> (...)` commit |
| `git branch -r --contains <sha>` | empty — never pushed |
| `origin/main:intentions/<id>.md` | still `office_hours: null` |
| `$CLAUDE_JOB_DIR/office-hours-reason` | still present (deleted only on success, `dispatch-stop.sh:93`) |
| worktree | `M intentions/<id>.md` — `park-node`'s exit trap reverted the tree |

Three independent reasons it cannot work from there, all structural:

1. **Wrong base.** The hook runs `park-node` from the worker's own PR-branch
   worktree. That violates invariant I1 — `ensure_intentions_only_base()`
   (`graph-commit:496-516`) fires on any worktree ahead of `origin/main` with
   non-`intentions/` changes, which is every PR branch.
2. **No budget.** `graph-commit`'s landing budget is
   `LOCK_WAIT_SECONDS = MAX_PUSH_ATTEMPTS x (CHECK_TIMEOUT_SECONDS + 30)` = 1050s
   (`graph-commit:217,223,234`), and a tick's reconcile routinely holds
   `refs/graph/landing-lock` ~10 minutes. A teardown hook has no such budget.
3. **Failure is swallowed three times over.** `dispatch-stop.sh:92` runs
   `park-node` under `>/dev/null 2>&1`; the `else` warning at `:95` reaches no
   journal (zero `[dispatch-stop] WARNING` lines across the whole journal); and
   the hook exits 0 by contract (`:41-42`).

**The sweep path is correct by construction, and it is already live.**
`lib-standdown-recheck.sh` — shipped by `tactic-standdown-winner-liveness`
(PR #2996) — solves the same problem the other way:

- it invokes `park-node` from `$repo_root` (`:495`) and reads state with
  `git -C "$repo_root"` (`:625`, `:630`) — the main checkout, satisfying I1;
- on failure it **keeps the marker and retries next tick** (`:708`), so a lost
  lock race costs one tick rather than the whole disposition;
- it runs on every tick (`dispatch-tick:318`, `:488`) — 21 clean sweeps observed
  in the 3.1h after merge, `markers=0 recorded=0 parked=0` throughout.

**Scope, therefore.** This node's mechanical guard is unchanged in intent but
changes location: a phase terminating with the node at its entry phase and no
disposition is an ERROR, and the *detection and the park* both belong in a
per-tick sweep modelled on `standdown_recheck_sweep`, not in the session's own
teardown. The Stop-hook backstop should be deleted rather than repaired — a
fire-once writer with no retry, the wrong base, and a swallowed exit code cannot
be made reliable, and its presence today actively hides the failure it was added
to prevent.

The generalized rule this establishes, which belongs to every heal path and not
only this one: **a park is healed only when it has been read back from
`origin/main`.** Invariant I2 already says a `graph-commit` exit 0 is not
evidence anything landed; the Stop-hook backstop is that same error committed by
a caller that never even reads the exit code.

Ordering is unchanged by this re-scope: the two collisions the /align-tactics
drift review raised still stand — the mechanical guard is homed in
`tactic-qa-fix-node-terminal-declaration` Unit 2, and the churn-fuse condition is
homed in `tactic-router-failure-fuses`, which should be planned only after
`tactic-claim-containment-durable-anchor` and
`tactic-terminal-declaration-verified-against-node`.

## Scope narrowing 2026-07-31 — extend the existing sweep, do not build a second one

Author ruling, taken together with the disposition of
`tactic-denied-command-parks-node` (PR #2994): that PR is rebased and landed
as-is, and **this node's mechanical guard is added to its sweep framework as one
more predicate**, rather than implemented as a separate sweep of its own.

So the scope recorded in the re-scope section above narrows further. It is not
"build a per-tick sweep modelled on `standdown_recheck_sweep`" — that sweep will
already exist. It is:

- add a **terminal-without-disposition** predicate to the sweep framework
  `lib-frozen-session-park.sh` establishes, and
- delete the `dispatch-stop.sh` escalation-park backstop, which has never
  succeeded and whose presence hides the failure it was added to prevent.

The intended end state is one sweep framework carrying several predicates —
frozen-at-denial (`tactic-denied-command-parks-node`),
terminal-without-disposition (this node), and stand-down recheck
(`tactic-standdown-winner-liveness`) — rather than three near-duplicate
implementations. All three share the properties that make the pattern correct:
run `park-node` from the main checkout so invariant I1 holds, keep the marker and
retry on the next tick rather than swallowing a failed land, and emit a per-sweep
count so a growing population is visible rather than silent.

Dependency consequence: this node should be planned **after** PR #2994 lands,
since it extends a framework that does not exist on `origin/main` until then.
That ordering is in addition to the two already recorded above (the guard homed
in `tactic-qa-fix-node-terminal-declaration` Unit 2, and the fuse homed in
`tactic-router-failure-fuses`).
