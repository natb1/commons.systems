---
id: tactic-self-close-reap-silent-noop
kind: tactic
statement: "`claude rm` exits 0 while DECLINING to remove a session whose
  worktree has no verifiable repository, so dispatch-self-close's terminating
  `exec claude rm` reports success, nothing retries, and the session holds its
  node's live-session slot permanently — the reap's failure mode is a silent
  pass"
owner: ai
status: raw
parent: null
rationale: "Confirmed live 2026-08-03 by direct reproduction. THE DEFECT:
  dispatch-self-close ends with `exec \"$CLAUDE_CMD\" rm \"$JOB_ID\"`, and
  treats that exec as the reap. But when the session's worktree cannot be
  verified against a repository, `claude rm` does not remove it — it prints
  `kept <id> — worktree has files but no repository to verify them against`
  and exits **0**. Reproduced verbatim against session e2636150. Because the
  exit status is 0, the Stop hook sees a successful reap, no error is logged,
  no retry is scheduled, and no detect fires. The session stays registered in
  `claude agents --json --all` forever. THE CONSEQUENCE: graph-select-target's
  occupancy check (`worktree_has_live_session`) is NAME-keyed on the node id,
  so a permanently-registered terminal session makes its node permanently
  unselectable while also consuming a live-session slot — the exact
  double-bind the auto-heal contract exists to prevent, arrived at through a
  path that reports success at every step. THE TRIGGER, and why this is
  systemic rather than incidental: the unverifiable-worktree condition holds
  whenever the node's branch was never pushed to origin. An `/align-tactics`
  round lands its work by `graph-commit` direct-push to `main` and never
  pushes a branch named for the node, so EVERY align-round node worker ends in
  this state. Measured 2026-08-03: of 5 stranded terminal sessions, 4 carried
  a correct `node-terminal` marker with `disposition=align-round` and all 4
  had `remote=NO` for their node branch — the reap gate passed and the reap
  itself silently did nothing. Since the router autonomously decomposes draft
  tactics through `/align-tactics` (the fleet's most frequent unattended
  phase), this leaks a session per align-round indefinitely. THE FIX
  DIRECTION: `claude rm`'s decline is detectable — it is reported on stdout
  and the session remains present in a subsequent listing — so self-close must
  verify the removal rather than trust the exit code, and on a detected
  decline either remove the worktree first (the documented remedy) and retry,
  or emit a loud, detectable failure. This is the project's recurring
  silent-PASS class: an instrument or action whose failure mode is
  indistinguishable from success."
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

# `claude rm` reports success when it declines to reap

`dispatch-self-close` treats `exec claude rm "$JOB_ID"` as the reap itself. The
command exits 0 in two materially different cases:

- the session and its worktree were removed;
- the session was **kept**, because its worktree has files but no repository to
  verify them against.

Only the first is a reap. Nothing downstream distinguishes them.

## Observed 2026-08-03

Five sessions sat terminal and unreaped. Four of them had a valid
`$CLAUDE_JOB_DIR/node-terminal` marker naming their own node with
`disposition=align-round`, so `dispatch-self-close`'s terminal-disposition
invariant passed and it proceeded to `claude rm`. Reproducing that call by hand:

```
$ claude rm e2636150
kept e2636150 — worktree has files but no repository to verify them against —
  remove the directory manually, or delete from the agents view to discard it
  worktree kept at .../.claude/worktrees/tactic-review-cross-lane-dedup
$ echo $?
0
```

All four node branches existed locally and **not** on `origin`. The remedy that
works is the one already documented for the interactive case: `git worktree
remove` first, then `claude rm` succeeds.

The fifth session was a separate, already-tracked cause — a `/qa-fix` pass that
never wrote a `node-terminal` marker at all, so self-close correctly HELD it
(`tactic-qa-fix-node-terminal-declaration`).

## Why this is not covered by existing tracking

`tactic-graph-node-session-reap` extended the Stop hook to *call* self-close on
terminal exit; that landed and works. This defect is one layer down: the call is
made, the gate passes, and the primitive silently declines. `dispatch-sweep`
does not compensate — it reaps worktrees and branches, never sessions, and its
`HELD_FOR_DEBUG_COUNT` is explicitly documented as an observability metric that
nothing acts on.

## Scope note

Out of scope: changing when `claude rm` is called, the terminal-disposition
invariant, or the held-for-debug default. In scope: making self-close verify
that the removal actually happened, and making a decline loud.

## Auto-heal design (recorded 2026-08-03, author-directed)

Measured the same day: the fleet ran at `effective_live` 1-2 against
`max_concurrent_workers: 3` for an entire window, with two of three slots held
by terminal sessions doing no work. `dispatch-tick` was healthy throughout
(`target_n: 3`, firing every ~15 min). Throughput was never limited by the cap,
the router, or attention ranking. It was limited by this defect, and by a failed
park (the `office-hours-*` marker class) holding a second slot. Both slots were
cleared by hand -- the fifth such hand-reap sitting recorded, with no change in
the underlying rate. Hand-reaping is the absence of an auto-heal, not one.

### Greenfield: one reaper, and it verifies its own post-state

The reap belongs to `dispatch-sweep` -- it already runs on a timer and already
owns `lib-worktree-reap.sh` / `lib-worktree-in-sync.sh`. `dispatch-self-close`
writes the terminal marker and exits; it does not call `claude rm` at all.

The reason this is a structural fix rather than a patch: self-close's last line
is `exec "$CLAUDE_CMD" rm "$JOB_ID"`. `exec` replaces the process, so nothing
survives to verify whether the reap happened. The silent no-op is not an
accident of that line -- it is entailed by it. Any fix that keeps self-close as
the reaper must first stop it exec'ing, which changes its termination contract
anyway. A supervisor that outlives the session removes the class.

The sweep's session arm, in order. Every gate fails toward KEEP:

- An UNCORROBORATED empty `claude agents --json --all` read means "cannot see",
  not "none" (the EMPTY-READ CORROBORATION contract in `lib-claude-agents.sh`).
  Abort the arm; never reap on it.
- Skip unless the session name matches `^tactic-|^strategy-` and the session is
  terminal (`state` in done/stopped/killed/failed/error).
- Require a valid `$CLAUDE_JOB_DIR/node-terminal` naming that node -- the
  existing Invariant 2 gate, unchanged.
- Reap-safety, all of: worktree clean; `git diff origin/main HEAD -- . ':!intentions'`
  EMPTY; no OPEN PR whose head is this branch (never delete such a branch).
- `git worktree remove <path>` FIRST -- this is what makes `claude rm` accept.
- `claude rm <session-id>`.
- Re-list. If the session id is STILL PRESENT, log a loud `REAP_DECLINED` and
  leave it for the operator.

Two elements are load-bearing and are exactly what the current path lacks:
`worktree remove` before `claude rm`, and verifying the post-state instead of
trusting exit 0.

**The reap-safety gate must be a content check, not a commit count.** Measured
2026-08-03: both sessions reaped by hand were 11 and 12 commits "ahead" of
`origin/main` and one was 12 ahead of its own remote branch, yet both were fully
safe -- GitHub squash-merges, so a branch's individual commits are never
ancestors of `main`, only their content is. A commit-count gate produces false
positives in both directions: it refuses a safe reap after a squash merge (which
is precisely the stranded-slot case this tactic exists to fix), and it counts
landed graph commits riding on a node branch as unpushed work.

### Brownfield migration

The greenfield is backwards-incompatible with self-close's termination contract,
so it does not land in one step:

1. Add the sweep session arm. This heals the defect immediately, changes no
   existing contract, and is safe to run alongside self-close's `exec claude rm`
   -- a session self-close already removed simply is not in the listing.
2. Only then delete `exec claude rm` from `dispatch-self-close`, once the sweep
   is observed reaping within one interval.

### Amendment to the scope note above

The scope note excludes "changing when `claude rm` is called". The greenfield
design deliberately amends that exclusion: moving the call to the sweep is the
fix, not an expansion of it, because verification is impossible on the far side
of an `exec`. The exclusion stands for the brownfield step 1, which adds the
sweep arm without touching self-close.

### Companion: the failed-park class (bug J)

A surviving `$CLAUDE_JOB_DIR/*/office-hours-reason` is by definition a park that
did not land -- that is why the detect reads "ANY hit is a FAILED park". The heal
has the same shape as the reap heal: the tick-side sweep re-drives `park-node`
from the main checkout (so invariant I1 holds), re-reads `office_hours` from
`origin/main`, and deletes the markers ONLY on a non-null read. Marker deletion
becomes the proof that the park landed rather than a cleanup step, and the
existing detect doubles as the heal's own success criterion: a marker surviving
one sweep interval is a heal that failed, and says so. Tracked primarily under
`tactic-phase-terminal-requires-disposition`; recorded here because the two heals
share a supervisor, a cadence, and a verify-the-post-state discipline.

## Brownfield step 1 IMPLEMENTED -- PR #3026 (2026-08-03)

`lib-session-reap.sh` adds `session_reap_sweep` to `dispatch-sweep`, exactly as
the greenfield design above specifies: every gate fails toward KEEP,
`git worktree remove` runs FIRST (that is what makes the daemon accept), and the
post-state is verified by re-querying rather than by trusting `claude rm`'s exit
code. The verification distinguishes THREE outcomes -- removed, `REAP_DECLINED`,
and `SESSION_REAP_UNVERIFIED` when the daemon cannot be reached. Collapsing
UNVERIFIED into success would have reproduced this very defect inside its own
fix.

`dispatch-self-close` is deliberately untouched. Step 2 -- deleting its
`exec claude rm` -- lands only once this arm is observed reaping within one sweep
interval, per the brownfield order above.

One correction to the design as recorded: the reap-safety gate is a CONTENT diff
(`git diff origin/main HEAD -- . ':!intentions'`), never a commit count. GitHub
squash-merges, so a branch's individual commits are never ancestors of `main` --
only their content is. Both sessions reaped by hand on 2026-08-03 read 11 and 12
commits "ahead" yet were entirely safe. A commit-count gate fails toward a false
"do not touch", stranding slots while looking conservative.

### Coverage: this heals the silent-decline class, NOT every stranded session

Stated plainly because the measured proportion runs the other way. Of the 8
sessions cleared by hand on 2026-08-03, **3** were bug AH (valid `node-terminal`
marker, `disposition=align-round`, no remote branch) and **5** were the marker
gap tracked by `tactic-qa-fix-node-terminal-declaration` -- no marker at all, so
`dispatch-self-close` HOLDs them, correctly. A ninth instance
(`tactic-review-domain-lens-consolidation`, 2026-08-03T19:40Z) was also the
marker gap.

The new arm requires a valid marker, because Invariant 2 is unchanged: reaping a
session that never declared a disposition would destroy the very signal that its
node still owes the author a park. So the arm covers the minority of observed
instances by construction, and the marker-gap class still needs a human.

The follow-up this suggests -- and it is a design call, not an implementation
detail, so it is recorded rather than taken: once
`terminal_without_disposition_sweep` has PARKED a marker-less terminal session's
node and that park is proven landed on `origin/main`, the park is itself a
disposition -- one supplied by the supervisor instead of by the session. Reaping
on that proof would close the remaining class without weakening Invariant 2,
since the evidence the invariant protects has by then been produced and verified.
Whether the terminal-disposition contract should admit a supervisor-supplied
disposition is exactly the kind of premise that belongs in an author ruling.
