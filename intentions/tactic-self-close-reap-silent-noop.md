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
  `kept <id> — worktree has files but no repository to verify them against` and
  exits **0**. Reproduced verbatim against session e2636150. Because the exit
  status is 0, the Stop hook sees a successful reap, no error is logged, no
  retry is scheduled, and no detect fires. The session stays registered in
  `claude agents --json --all` forever. THE CONSEQUENCE: graph-select-target's
  occupancy check (`worktree_has_live_session`) is NAME-keyed on the node id, so
  a permanently-registered terminal session makes its node permanently
  unselectable while also consuming a live-session slot — the exact double-bind
  the auto-heal contract exists to prevent, arrived at through a path that
  reports success at every step. THE TRIGGER, and why this is systemic rather
  than incidental: the unverifiable-worktree condition holds whenever the node's
  branch was never pushed to origin. An `/align-tactics` round lands its work by
  `graph-commit` direct-push to `main` and never pushes a branch named for the
  node, so EVERY align-round node worker ends in this state. Measured
  2026-08-03: of 5 stranded terminal sessions, 4 carried a correct
  `node-terminal` marker with `disposition=align-round` and all 4 had
  `remote=NO` for their node branch — the reap gate passed and the reap itself
  silently did nothing. Since the router autonomously decomposes draft tactics
  through `/align-tactics` (the fleet's most frequent unattended phase), this
  leaks a session per align-round indefinitely. THE FIX DIRECTION: `claude rm`'s
  decline is detectable — it is reported on stdout and the session remains
  present in a subsequent listing — so self-close must verify the removal rather
  than trust the exit code, and on a detected decline either remove the worktree
  first (the documented remedy) and retry, or emit a loud, detectable failure.
  This is the project's recurring silent-PASS class: an instrument or action
  whose failure mode is indistinguishable from success."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Park questions — (1) what reaps a marker-declared terminal session
      whose branch has unlanded content or an open PR, and (2) which tactic owns
      dispatch-self-close's terminal reap line?
    answer: "(Ruled 2026-08-04 /align interview, author-ratified.) Superseded by the
      invalid-state lane recorded on strategy-graph-native-dispatch (2026-08-04
      clarifications). (1) The recorded brownfield Step 2 (delete exec claude
      rm) is RETIRED — dispatch-self-close KEEPS its reap as a best-effort fast
      path, session_reap_sweep stays the backstop for the undeclared/align-round
      class, and the invalid-state lane is the guaranteed net: the
      selection-time occupancy check discriminates occupied-by-terminal (invalid
      state — route to an intervention session that reviews the transcript,
      files a find-or-create root-cause follow-up, and resolves or parks) from
      occupied-by-live (valid skip), with the defensive sweeps as the second
      detection point. A marker-declared session with unlanded content or an
      open PR routes to that lane rather than being force-reaped or stranded, so
      gates 7b/7c stay as they are. (2) tactic-worker-self-close-configurable
      retains ownership of the call site; its default-off keep-all gate lands as
      planned with no ordering conflict. This node's remaining scope: make the
      fast path's decline DETECTABLE and loud (verify the post-state instead of
      trusting exit 0), with the lane owning escalation. Re-run /align-tactics
      on this node to re-plan against the lane. Park cleared on this ruling."
tooling_goals: []
success_signal: null
attention:
  boosts:
    "1": 10
  rationale: >-
    Author-directed 2026-08-03: prioritize bug-ledger fixes directly BELOW the
    token-efficiency cluster. Boost 12 resolves to 17.33 because an inbound
    distributor adds 5.33 — under that cluster's 20.00 and above the 5.33
    undecomposed baseline. Simulated over the live store before writing: 0 tier
    changes, 0 value drift onto non-target nodes.


    LEVEL MIGRATION 2026-08-14: tier 1 boost snapped from 12 to the closed level
    vocabulary value 10 (low) per strategy-graph-drives-dispatch's
    level-vocabulary clarification; ordering intent unchanged.
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Side B material premise from a 2026-08-10 /align-tactics tactic-mode
    finalize attempt: the plan depends on an unrecorded design call the node
    itself declines to take. This node's body (§\"What this means for this
    node's plan\", 2026-08-06 correction) records that
    lib-session-reap.sh:288-291 derives the reaped worktree path from the node
    id, that this premise is false for /align-tactics-provisioned checkouts, and
    that the remedy is therefore aimed at the wrong directory — then states
    verbatim: 'Either the invariant is enforced at provisioning time, or the
    sweep stops deriving and starts resolving. That choice is a design call, not
    an implementation detail.' Nothing in strategy-graph-native-dispatch or in
    this node answers it, and the two limbs produce disjoint unit sets, files,
    and owners: limb (a) edits the /align-tactics worktree-entry contract at
    .claude/skills/align-tactics/SKILL.md:80-88 and
    dispatch-graph-execute:205-215's deliberate no-pre-provision branch; limb
    (b) edits lib-session-reap.sh:286-291 and its false header premise at
    :263-267, plus test-lib-session-reap.sh:221-266 fixtures. The same ruling
    settles a second open point: whether path resolution lands under this node
    at all, since the author's 2026-08-04 ruling narrowed this node's remaining
    scope to 'make the fast path's decline DETECTABLE and loud (verify the
    post-state instead of trusting exit 0), with the lane owning escalation' —
    the 2026-08-06 correction's expansion into the sweep was recorded by a
    monitor pass, not ratified. Planning either limb now would author against an
    unratified premise, and planning the narrow ratified scope alone would ship
    a fix the node's own text says leaves the loop running ('a decline that is
    correctly detected every 15 minutes and correctly reported is still a
    decline'). See the dated clarification added this round for the full
    proposed-clarification text and the measured evidence bounding the choice
    (registry `cwd` already tracks the real checkout and is already
    parsed/threaded through lib-session-reap.sh, just unused for path resolution
    at :288-291; dispatch-node-reap:134 passes no cwd at all and independently
    hits the same bug). Recommend: ratify one limb (RECOMMENDATION: limb (b) —
    resolve from the registry cwd — is the lower-friction fix on measured
    evidence, since it needs only a consumer change at
    lib-session-reap.sh:288-291 and also fixes dispatch-node-reap:134 for free;
    limb (a) is the stronger invariant but closes the EnterWorktree escape hatch
    dispatch-graph-execute:205-215 deliberately leaves open), record the ruling
    as this node's clarification answer, then re-run /align-tactics
    tactic-self-close-reap-silent-noop to author the plan against it. Sequencing
    note for whoever plans this next:
    tactic-reap-safety-behind-branch-false-positive (phase qa) edits gate 7b
    inside the same session_reap_node function and should be sequenced against
    this node's eventual fix, though it does not own the wt_path derivation."
  since: 2026-08-10
  recommendation: null
  session_type: other
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

## Step 2 retired (2026-08-04 author ruling)

The brownfield Step 2 above — deleting `exec claude rm` from
`dispatch-self-close` — is retired; see the 2026-08-04 clarification in this
node's frontmatter. Self-close keeps its reap as a best-effort fast path (so
`tactic-worker-self-close-configurable`'s gate on that call site lands as
planned); the invalid-state lane recorded on `strategy-graph-native-dispatch`
(2026-08-04) is the guaranteed net for declines, with the occupancy-check
discriminator (occupied-by-terminal vs occupied-by-live) as the detection
point and the sweeps as the second. This node's remaining scope narrows to
making the fast path's decline detectable and loud — verify the post-state
instead of trusting exit 0.

## Correction 2026-08-06: the decline is a WRONG-PATH bug, not a no-worktree case

The 2026-08-03 diagnosis above attributes the `claude rm` decline to the node
branch never having been pushed to `origin` ("the unverifiable-worktree
condition holds whenever the node's branch was never pushed"). Measured
2026-08-06 during an N+7 monitor pass, that is **not** the operative cause of
the observed permanent declines, and the recorded remedy — "remove the worktree
first" — was being applied to the wrong directory.

`lib-session-reap.sh:291` derives the worktree path from the node id:

```sh
local wt_path="$worktrees_root/$name"
```

with the standing comment that its path "is derived, never taken from the
registry's `cwd`: provision-node-worktree puts a node's checkout at exactly
`<project-root>/.claude/worktrees/<node-id>`". **That premise does not hold for
`/align-tactics` sessions**, whose checkout is provisioned at
`<worktrees>/align-tactics-<suffix>` while the session registers under the bare
node id. The sweep therefore probes a path that either does not exist — logging
`SESSION_REAP_NO_WORKTREE` and proceeding — or, worse, exists as an unrelated
stale checkout it then gates on. Either way it never removes the directory the
daemon is actually holding, so `claude rm` declines, and the sweep re-attempts
and re-declines on every interval indefinitely.

### Reproduced twice, same shape

Session `3dc03651`, node `tactic-fleet-alarm-watch-unknown`:

```
SESSION_REAP_NO_WORKTREE: ... worktree=.../tactic-fleet-alarm-watch-unknown
  (nothing to remove; proceeding to claude rm)
REAP_DECLINED: ... claude_rm_rc=1
```

`claude rm` itself names the real path in its decline text:

```
kept 3dc03651 — worktree has files but no repository to verify them against
  worktree kept at .../.claude/worktrees/align-tactics-fleet-alarm-watch-unknown
```

Removing **that** directory made `claude rm` succeed immediately (rc=0). The
same sequence held for session `2551a780` /
`tactic-fleet-alarm-unclaimed-hold`: the sweep gated on
`<worktrees>/tactic-fleet-alarm-unclaimed-hold`, `claude rm` was holding
`<worktrees>/align-tactics-fleet-alarm-unclaimed-hold`, and the reap completed
the moment the latter was removed. Both align-prefixed worktrees were 0 commits
ahead of `origin/main`, clean, and carried no open PR.

### What this means for this node's plan

The remaining scope — make the decline detectable and loud — stands and is
unaffected. But loudness alone leaves the loop running: a decline that is
correctly detected every 15 minutes and correctly reported is still a decline.
The plan must additionally cover **path resolution**, because the removal step
the remedy depends on is aimed at the wrong directory:

- The daemon is the authority on which worktree a session holds. Its decline
  text carries the path verbatim, and the registry row is queryable; the
  node-id-derived path is an assumption that is false for every
  `/align-tactics`-provisioned worktree.
- The derivation comment at `lib-session-reap.sh:288-291` asserts an invariant
  that `provision-node-worktree` does not actually guarantee across lanes.
  Either the invariant is enforced at provisioning time, or the sweep stops
  deriving and starts resolving. That choice is a design call, not an
  implementation detail.
- `SESSION_REAP_NO_WORKTREE` is currently benign-sounding and precedes a reap
  attempt. When the daemon *does* hold a worktree, that log line is a false
  negative and should not read as "nothing to remove".

Recorded, not taken: this node stays `status: raw` under the 2026-08-05
author decision deferring raw tactics to the fleet. The separate two-dot
reap-safety defect found in the same pass is owned by
`tactic-reap-safety-behind-branch-false-positive`, which is a different gate
(7b) earlier in the same sweep.

## Fresh confirmation 2026-08-10: still live, and now also defeats the invalid-state lane's own reap

Researched 2026-08-09/10 in an `/align-tactics tactic-self-close-reap-silent-noop`
finalize attempt, before the drift review parked this node (see `office_hours`).
The 2026-08-06 diagnosis is unchanged and unfixed: `git log` shows no commit
since 2026-08-05 touching `lib-session-reap.sh`'s worktree-path derivation
(still `local wt_path="$worktrees_root/$name"` at line 291, header comment at
288-290 still asserting the false premise). A fresh, independent occurrence
landed the same day: `tactic-fleet-alarm-busy-stall`, session `e94d9b62`,
2026-08-09T17:33:09Z — `dispatch-node-reap` (the invalid-state lane's own
reap entry point, called by the `dispatch-invalid-state` intervention skill
on the `terminal-session` kind) derived
`.claude/worktrees/tactic-fleet-alarm-busy-stall` (absent,
`SESSION_REAP_NO_WORKTREE`) while the daemon actually held
`.claude/worktrees/align-tactics-fleet-alarm-busy-stall`; `claude rm` declined
(`claude_rm_rc=1`), verdict `declined`. This occurrence, and two earlier ones
from 2026-08-06, are logged on the auto-minted cause-slug dedup tracker
`tactic-invalid-state-rc-0b9860b2` (`self-close-reap-declined`), which is
**not** a fix-owning node — it exists purely to dedup occurrences by cause and
defers the fix to this node, per the sole-tracker convention.

This matters for scope: `dispatch-node-reap` is a thin CLI wrapper
(`.claude/skills/dispatch-propagate/scripts/dispatch-node-reap`) that calls
the exact same `session_reap_node` function `session_reap_sweep` calls, and
declares no independent path resolution of its own — it invokes
`session_reap_node "$NODE" "$SESSION" "$JOB_ID"` with no `cwd` argument at all
(the function's 7th positional parameter). So the invalid-state lane's own
reap — the ratified "guaranteed net" behind the fast-path decline — inherits
this exact bug and cannot succeed on an align-tactics-provisioned session
either. Whichever design limb below is ratified, the fix belongs in
`session_reap_node` (or its shared resolution path), not only in the sweep's
calling convention, so both callers benefit.

### Where the fix data already lives, unused

`session_reap_sweep`'s candidate loop already parses a `cwd` column out of
`claude_agents_list_terminal_workers`'s TSV row (`sessionId`, `id`, `name`,
`cwd` — `lib-claude-agents.sh`, function registered ~line 1479-1503) and
passes it into `session_reap_node` as its 7th positional parameter (`idle`,
`cwd` — threaded at `lib-session-reap.sh:511`, `:627`) — but `session_reap_node`
currently treats that `cwd` as DIAGNOSTIC ONLY (used solely in the trailing
`SESSION_REAPED` log line), never for path resolution. The daemon's own
registry already reports the real checkout path on every terminal-worker row;
the derivation at line 291 simply doesn't use it. Existing coverage:
`.claude/skills/dispatch-propagate/scripts/test-lib-session-reap.sh` and
`test-dispatch-node-reap.sh` exercise `session_reap_node`/`session_reap_sweep`
end-to-end against a real scratch git repo, but neither fixture currently
models a session whose registry `cwd` differs from `$worktrees_root/$name` —
new fixture coverage for that mismatch is needed to prove any fix.

### Why this node parks instead of planning against it

The "design call, not an implementation detail" question two sections above —
enforce the node-id worktree-path invariant at provisioning time, or stop
deriving in `session_reap_node` and resolve from the registry `cwd` — is still
unanswered by any author ruling, and the two limbs produce disjoint unit sets,
files, and owners (limb (a): `.claude/skills/align-tactics/SKILL.md:80-88`'s
worktree-entry contract and `dispatch-graph-execute`'s deliberate
no-pre-provision branch for `kind == strategy` / `phase == align-tactics`
sessions; limb (b): `lib-session-reap.sh:286-291` and its false header premise
at `:263-267`, plus `test-lib-session-reap.sh:221-266`'s fixtures). Planning
either limb without a ruling would author against an unratified premise, and
planning only the 2026-08-04-ratified narrow scope (fast-path decline
loudness) alone would ship a fix that leaves the loop running — a decline
correctly detected and reported every sweep interval is still a decline. See
`office_hours.reason` for the park detail and the author-facing recommendation.
